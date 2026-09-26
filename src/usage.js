import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { whoami } from "./accounts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WINCRED_PS1 = path.join(ROOT, "scripts", "wincred.ps1");
const CACHE_PATH = path.join(ROOT, "accounts", "usage-cache.json");
const LOCAL_USAGE_PATH = path.join(ROOT, "accounts", "local-usage.json");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const QUOTA_URL =
  "https://daily-cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary";
const LOAD_CODE_ASSIST_URL =
  "https://daily-cloudcode-pa.googleapis.com/v1internal:loadCodeAssist";

const OAUTH_CLIENT_CACHE = path.join(ROOT, "accounts", "oauth-client.json");
const PREFERRED_CLIENT_ID_PREFIX = "1071006060591-";

const OAUTH_CREDS = path.join(os.homedir(), ".gemini", "oauth_creds.json");
const AGY_OAUTH_FILE = path.join(
  os.homedir(),
  ".gemini",
  "antigravity-cli",
  "antigravity-oauth-token"
);

let memoryToken = null;
let oauthClientCache = null;

function readJson(p, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function runWinCredRead() {
  const r = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", WINCRED_PS1, "-Action", "read"],
    { encoding: "utf8", windowsHide: true }
  );
  if (r.status !== 0) return null;
  const lines = (r.stdout || "").split(/\r?\n/).filter((l) => l.trim().startsWith("{"));
  if (!lines.length) return null;
  try {
    return JSON.parse(lines[lines.length - 1]);
  } catch {
    return null;
  }
}

function parseCredentialBlob(blobB64) {
  if (!blobB64) return null;
  const buf = Buffer.from(blobB64, "base64");
  for (const enc of ["utf8", "utf16le"]) {
    let text = buf.toString(enc).replace(/\u0000/g, "").trim();
    if (!text) continue;
    const prefix = "go-keyring-base64:";
    if (text.startsWith(prefix)) {
      try {
        text = Buffer.from(text.slice(prefix.length), "base64").toString("utf8");
      } catch {
        continue;
      }
    }
    try {
      return JSON.parse(text.replace(/^\uFEFF/, ""));
    } catch {
      /* next */
    }
  }
  return null;
}

function normalizeTokenPayload(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.token && typeof raw.token === "object") {
    return {
      access_token: raw.token.access_token,
      refresh_token: raw.token.refresh_token,
      expiry: raw.token.expiry || raw.token.expires_at || null,
    };
  }
  if (raw.access_token || raw.refresh_token) {
    let expiry = null;
    if (raw.expiry_date) expiry = new Date(Number(raw.expiry_date)).toISOString();
    else if (raw.expiry) expiry = raw.expiry;
    return {
      access_token: raw.access_token,
      refresh_token: raw.refresh_token,
      expiry,
    };
  }
  return null;
}

function loadStoredToken() {
  const cred = runWinCredRead();
  if (cred?.blobB64) {
    const parsed = normalizeTokenPayload(parseCredentialBlob(cred.blobB64));
    if (parsed?.access_token || parsed?.refresh_token) return parsed;
  }
  for (const p of [AGY_OAUTH_FILE, OAUTH_CREDS]) {
    const parsed = normalizeTokenPayload(readJson(p, null));
    if (parsed?.access_token || parsed?.refresh_token) return parsed;
  }
  return null;
}

function findAgyExe() {
  const candidates = [
    process.env.AGY_PATH,
    path.join(process.env.LOCALAPPDATA || "", "agy", "bin", "agy.exe"),
    path.join(process.env.LOCALAPPDATA || "", "agy", "bin", "agy"),
    "agy",
  ].filter(Boolean);
  for (const c of candidates) {
    if (c === "agy") continue;
    if (fs.existsSync(c)) return c;
  }
  const which = spawnSync(process.platform === "win32" ? "where.exe" : "which", ["agy"], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (which.status === 0) {
    const first = (which.stdout || "").split(/\r?\n/).map((l) => l.trim()).find(Boolean);
    if (first && fs.existsSync(first)) return first;
  }
  return null;
}

function extractOauthClientFromBinary(exePath) {
  try {
    const buf = fs.readFileSync(exePath);
    const text = buf.toString("latin1");
    const ids = [...text.matchAll(/[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com/g)].map(
      (m) => m[0]
    );
    const secrets = [...text.matchAll(/GOCSPX-[A-Za-z0-9_-]+/g)].map((m) => m[0]);
    if (!ids.length || !secrets.length) return null;
    const clientId =
      ids.find((id) => id.startsWith(PREFERRED_CLIENT_ID_PREFIX)) || ids[0];
    return { client_id: clientId, client_secret: secrets[0] };
  } catch {
    return null;
  }
}

function resolveOauthClient() {
  if (oauthClientCache) return oauthClientCache;

  const fromEnv = {
    client_id: process.env.AGY_OAUTH_CLIENT_ID,
    client_secret: process.env.AGY_OAUTH_CLIENT_SECRET,
  };
  if (fromEnv.client_id && fromEnv.client_secret) {
    oauthClientCache = fromEnv;
    return oauthClientCache;
  }

  const fromFile = readJson(OAUTH_CLIENT_CACHE, null);
  if (fromFile?.client_id && fromFile?.client_secret) {
    oauthClientCache = fromFile;
    return oauthClientCache;
  }

  const exe = findAgyExe();
  if (exe) {
    const extracted = extractOauthClientFromBinary(exe);
    if (extracted) {
      try {
        writeJson(OAUTH_CLIENT_CACHE, extracted);
      } catch {
        /* cache optional */
      }
      oauthClientCache = extracted;
      return oauthClientCache;
    }
  }

  throw new Error(
    "OAuth client missing — set AGY_OAUTH_CLIENT_ID / AGY_OAUTH_CLIENT_SECRET, or install agy so credentials can be read from the binary"
  );
}

async function refreshAccessToken(refreshToken) {
  const { client_id, client_secret } = resolveOauthClient();
  const body = new URLSearchParams({
    client_id,
    client_secret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`token refresh failed: ${res.status} ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresAtMs: Date.now() + Number(data.expires_in || 3600) * 1000,
  };
}

async function resolveAccessToken() {
  if (memoryToken && Date.now() < memoryToken.expiresAtMs - 60_000) {
    return memoryToken.accessToken;
  }
  const stored = loadStoredToken();
  if (!stored) throw new Error("no OAuth token found — login with agy first");

  if (stored.expiry) {
    const expMs = Date.parse(stored.expiry);
    if (stored.access_token && Number.isFinite(expMs) && expMs - Date.now() > 60_000) {
      memoryToken = { accessToken: stored.access_token, expiresAtMs: expMs };
      return stored.access_token;
    }
  }

  if (stored.refresh_token) {
    const refreshed = await refreshAccessToken(stored.refresh_token);
    memoryToken = refreshed;
    return refreshed.accessToken;
  }
  if (stored.access_token) return stored.access_token;
  throw new Error("OAuth token unusable");
}

async function postCloudCode(url, accessToken, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "User-Agent": `antigravity/1.2.11 ${process.platform}/${process.arch}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const err = new Error(`Cloud Code ${res.status}: ${text.slice(0, 300) || res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

function resetInSeconds(resetTime) {
  if (!resetTime) return null;
  const ms = Date.parse(resetTime);
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.floor((ms - Date.now()) / 1000));
}

function formatResetsIn(seconds) {
  if (seconds == null) return null;
  const minutes = Math.floor(seconds / 60);
  if (minutes >= 24 * 60) {
    const d = Math.floor(minutes / (24 * 60));
    const h = Math.floor((minutes % (24 * 60)) / 60);
    return h ? `${d}d ${h}h` : `${d}d`;
  }
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m`;
}

/**
 * Enrich official retrieveUserQuotaSummary payload for frontend,
 * preserving official displayName / bucketId / window 1:1.
 *
 * Official Models UI:
 *   Gemini Models
 *     Weekly Limit Remaining
 *     Five Hour Limit Remaining
 *   Claude and GPT models
 *     Weekly Limit Remaining
 *     Five Hour Limit Remaining
 *
 * Official statusline quota map keys: gemini-weekly, gemini-5h, 3p-weekly, 3p-5h
 */
function buildOfficialUsage(raw, { project, tier, account } = {}) {
  const groupsIn = Array.isArray(raw?.groups) ? raw.groups : [];
  const panelGroups = [];
  const quota = {}; // statusline shape
  const groupsCompat = []; // older camelCase helper

  for (const g of groupsIn) {
    const buckets = [];
    const compat = {
      id: null,
      name: g.displayName || null,
      description: g.description || null,
      models: [],
      weekly: null,
      five_hour: null,
      session: null,
    };

    const desc = g.description || "";
    const m = desc.match(/Models within this group:\s*(.+)$/i);
    if (m) {
      compat.models = m[1].split(",").map((s) => s.trim()).filter(Boolean);
    }
    const dn = String(g.displayName || "").toLowerCase();
    if (dn.includes("gemini")) compat.id = "gemini";
    else if (dn.includes("claude") || dn.includes("gpt")) compat.id = "claude_gpt";

    for (const b of g.buckets || []) {
      const frac =
        typeof b.remainingFraction === "number"
          ? b.remainingFraction
          : Number(b.remainingFraction);
      const remainingFraction = Number.isFinite(frac) ? frac : null;
      const remainingPercent =
        remainingFraction == null
          ? null
          : Math.round(Math.max(0, Math.min(1, remainingFraction)) * 1000) / 10;
      const usedPercent =
        remainingPercent == null ? null : Math.round((100 - remainingPercent) * 10) / 10;
      const resetTime = b.resetTime || null;
      const reset_in_seconds = resetInSeconds(resetTime);
      const disabled = Boolean(b.disabled);

      const enriched = {
        // --- official fields (unchanged names) ---
        bucketId: b.bucketId,
        displayName: b.displayName, // "Weekly Limit Remaining" | "Five Hour Limit Remaining"
        window: b.window, // "weekly" | "5h"
        resetTime,
        description: b.description || null,
        remainingFraction,
        disabled,
        // --- frontend helpers (additive) ---
        remainingPercent,
        usedPercent,
        reset_in_seconds,
        resetsIn: formatResetsIn(reset_in_seconds),
      };
      buckets.push(enriched);

      if (b.bucketId) {
        quota[b.bucketId] = {
          remaining_fraction: remainingFraction,
          reset_time: resetTime,
          reset_in_seconds,
          display_name: b.displayName,
          window: b.window,
          disabled,
        };
      }

      if (b.window === "weekly" || String(b.bucketId || "").includes("weekly")) {
        compat.weekly = enriched;
      }
      if (b.window === "5h" || String(b.bucketId || "").endsWith("-5h")) {
        compat.five_hour = enriched;
        compat.session = enriched; // alias
      }
    }

    panelGroups.push({
      displayName: g.displayName, // "Gemini Models" | "Claude and GPT models"
      description: g.description || null,
      buckets,
    });
    groupsCompat.push(compat);
  }

  const planTier =
    tier?.currentTier?.name ||
    tier?.currentTier?.id ||
    tier?.paidTier?.[0]?.name ||
    null;

  return {
    ok: true,
    // Official /usage panel (Models docs + CLI /usage)
    panel: {
      title: "Model Quotas",
      description: raw?.description || null,
      groups: panelGroups,
    },
    // Official statusline `quota` map
    // https://www.antigravity.google/docs/cli/statusline
    quota,
    // Identity (statusline fields)
    email: account?.email || null,
    plan_tier: planTier,
    project: project || null,
    product: "antigravity",
    // Compat for earlier frontend draft
    groups: groupsCompat,
    raw: {
      groups: groupsIn,
      description: raw?.description || null,
    },
  };
}

export function recordLocalUsage({ model, usage, conversationId, account } = {}) {
  if (!usage) return;
  const store = readJson(LOCAL_USAGE_PATH, {
    total: {
      input_tokens: 0,
      output_tokens: 0,
      thinking_tokens: 0,
      cache_read_tokens: 0,
      total_tokens: 0,
      requests: 0,
    },
    byDay: {},
    recent: [],
  });
  const day = new Date().toISOString().slice(0, 10);
  const add = (obj) => {
    obj.input_tokens = (obj.input_tokens || 0) + (usage.input_tokens || 0);
    obj.output_tokens = (obj.output_tokens || 0) + (usage.output_tokens || 0);
    obj.thinking_tokens = (obj.thinking_tokens || 0) + (usage.thinking_tokens || 0);
    obj.cache_read_tokens =
      (obj.cache_read_tokens || 0) + (usage.cache_read_tokens || 0);
    obj.total_tokens = (obj.total_tokens || 0) + (usage.total_tokens || 0);
    obj.requests = (obj.requests || 0) + 1;
  };
  add(store.total);
  store.byDay[day] = store.byDay[day] || {
    input_tokens: 0,
    output_tokens: 0,
    thinking_tokens: 0,
    cache_read_tokens: 0,
    total_tokens: 0,
    requests: 0,
  };
  add(store.byDay[day]);
  store.recent.unshift({
    at: new Date().toISOString(),
    model: model || null,
    account: account || null,
    conversation_id: conversationId || null,
    usage,
  });
  store.recent = store.recent.slice(0, 50);
  writeJson(LOCAL_USAGE_PATH, store);
  return store;
}

export function getLocalUsage() {
  const store = readJson(LOCAL_USAGE_PATH, null);
  if (!store) {
    return {
      total: {
        input_tokens: 0,
        output_tokens: 0,
        thinking_tokens: 0,
        cache_read_tokens: 0,
        total_tokens: 0,
        requests: 0,
      },
      today: null,
      recent: [],
    };
  }
  const day = new Date().toISOString().slice(0, 10);
  return {
    total: store.total,
    today: store.byDay?.[day] || null,
    byDay: store.byDay || {},
    recent: store.recent || [],
  };
}

export async function fetchQuota({ force = false, maxAgeMs = 60_000 } = {}) {
  const cached = readJson(CACHE_PATH, null);
  if (!force && cached?.fetchedAt && Date.now() - Date.parse(cached.fetchedAt) < maxAgeMs) {
    return { ...cached, cached: true };
  }

  const accessToken = await resolveAccessToken();

  let tier = null;
  let project = null;
  try {
    tier = await postCloudCode(LOAD_CODE_ASSIST_URL, accessToken, {
      metadata: { ideType: "ANTIGRAVITY" },
    });
    project = tier?.cloudaicompanionProject || null;
  } catch {
    /* optional */
  }

  let raw = null;
  let lastErr = null;
  for (const body of project ? [{ project }, {}] : [{}]) {
    try {
      raw = await postCloudCode(QUOTA_URL, accessToken, body);
      if (raw) break;
    } catch (err) {
      lastErr = err;
    }
  }
  if (!raw) {
    if (cached) return { ...cached, cached: true, stale: true, error: lastErr?.message };
    throw lastErr || new Error("quota fetch failed");
  }

  let account = null;
  try {
    account = whoami();
  } catch {
    account = null;
  }

  const shaped = buildOfficialUsage(raw, { project, tier, account });
  const result = {
    ...shaped,
    fetchedAt: new Date().toISOString(),
    cached: false,
    account,
    local: getLocalUsage(),
    // AI Credits are separate from baseline model quotas (official Plans/Credits docs).
    // Exposed as a stub so frontend can reserve UI; fill when credits API is wired.
    credits: {
      note: "AI Credits are separate from Model Quotas (see official /credits). Baseline quotas above are /usage.",
      balance: null,
      available: false,
    },
  };
  writeJson(CACHE_PATH, result);
  return result;
}

export async function getUsage(opts = {}) {
  const quota = await fetchQuota(opts);
  return { ...quota, local: getLocalUsage() };
}
