import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  saveAccount,
  syncLiveOAuthFilesFromWinCred,
  whoami,
  listProfiles,
  decodeJwtEmail,
  suggestProfileName,
  invalidateWhoamiCache,
} from "./accounts.js";
import { readJson, writeJson, resolveAgyBinary, extractOauthClientFromBinary } from "./utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WINCRED_PS1 = path.join(ROOT, "scripts", "wincred.ps1");
const OAUTH_CLIENT_CACHE = path.join(ROOT, "accounts", "oauth-client.json");
const OAUTH_CHROME_PROFILE = path.join(ROOT, ".agy-oauth-chrome");

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
/** Official Antigravity redirect — shows a code page (no localhost loopback registered). */
const REDIRECT_URI = "https://antigravity.google/oauth-callback";

const SCOPES = [
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/cclog",
  "https://www.googleapis.com/auth/experimentsandconfigs",
  "openid",
].join(" ");

/**
 * @typedef {object} OAuthSession
 * @property {string} verifier
 * @property {string} challenge
 * @property {number} createdAt
 * @property {string|null} beforeEmail
 * @property {string} status  pending|browser_opened|waiting_auth|capturing|done|error
 * @property {string|null} error
 * @property {object|null} result
 * @property {number|null} chromePid
 * @property {number|null} debugPort
 * @property {string|null} authUrl
 * @property {boolean} auto
 */

/** @type {Map<string, OAuthSession>} */
const pending = new Map();


function resolveOauthClient() {
  const fromEnv = {
    client_id: process.env.AGY_OAUTH_CLIENT_ID,
    client_secret: process.env.AGY_OAUTH_CLIENT_SECRET,
  };
  if (fromEnv.client_id && fromEnv.client_secret) return fromEnv;

  const fromFile = readJson(OAUTH_CLIENT_CACHE, null);
  if (
    fromFile?.client_id &&
    fromFile?.client_secret &&
    /^GOCSPX-[A-Za-z0-9_-]{28}$/.test(fromFile.client_secret)
  ) {
    return fromFile;
  }

  const exe = resolveAgyBinary();
  if (exe) {
    const extracted = extractOauthClientFromBinary(exe);
    if (extracted) {
      try {
        writeJson(OAUTH_CLIENT_CACHE, extracted);
      } catch {
        /* optional */
      }
      return extracted;
    }
  }
  throw new Error("无法解析 Antigravity OAuth client，请确认已安装 agy");
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.AGY_CHROME_PATH,
    path.join(process.env.PROGRAMFILES || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env.PROGRAMFILES || "", "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(process.env["PROGRAMFILES(X86)"] || "", "Microsoft", "Edge", "Application", "msedge.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}


function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function makePkce() {
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

function openSystemBrowser(url) {
  if (process.platform === "win32") {
    const safeUrl = String(url).replace(/'/g, "''");
    spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", `Start-Process '${safeUrl}'`],
      { detached: true, stdio: "ignore", windowsHide: true }
    ).unref();
  } else if (process.platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  }
}

function writeWinCredBlob(blobB64, username = "antigravity") {
  const r = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      WINCRED_PS1,
      "-Action",
      "write",
      "-BlobBase64",
      blobB64,
      "-UserName",
      username,
    ],
    { encoding: "utf8", windowsHide: true, maxBuffer: 10 * 1024 * 1024 }
  );
  if (r.status !== 0) {
    throw new Error((r.stderr || r.stdout || "CredWrite failed").trim());
  }
}

function purgeStalePending() {
  const now = Date.now();
  for (const [k, v] of pending) {
    if (now - v.createdAt > 15 * 60 * 1000) {
      tryKillChrome(v);
      pending.delete(k);
    }
  }
}

function tryKillChrome(session) {
  if (!session?.chromePid) return;
  try {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(session.chromePid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
    } else {
      process.kill(session.chromePid, "SIGTERM");
    }
  } catch {
    /* ignore */
  }
  session.chromePid = null;
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => {
      const addr = s.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      s.close((err) => (err ? reject(err) : resolve(port)));
    });
    s.on("error", reject);
  });
}

async function waitForCdp(port, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`, {
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) return await res.json();
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("Chrome 调试端口未就绪");
}

async function listCdpPages(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`, {
    signal: AbortSignal.timeout(2000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function codeFromUrl(urlStr) {
  if (!urlStr || !/oauth-callback/i.test(urlStr)) return null;
  try {
    // UIA sometimes returns host/path without scheme
    const raw = /^(https?:)?\/\//i.test(urlStr) ? urlStr : `https://${urlStr.replace(/^\/+/, "")}`;
    const u = new URL(raw);
    const code = u.searchParams.get("code");
    if (code) return code;
    if (u.hash) {
      const h = new URLSearchParams(u.hash.replace(/^#/, ""));
      return h.get("code");
    }
  } catch {
    /* ignore */
  }
  const m = String(urlStr).match(/[?&#]code=([^&#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function codeFromPageText(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/\s+/g, " ").trim();
  // Prefer explicit labels (official Antigravity callback page)
  const labeled =
    cleaned.match(/Paste this code[\s\S]{0,120}?((?:4\/|1\/)[0-9A-Za-z\-_]{20,})/i) ||
    cleaned.match(/complete authentication[:\s]+((?:4\/|1\/)[0-9A-Za-z\-_]{20,})/i) ||
    cleaned.match(/authorization code[:\s]+([A-Za-z0-9_/\-.+]{20,})/i) ||
    cleaned.match(/授权码[:\s：]+([A-Za-z0-9_/\-.+]{20,})/i) ||
    cleaned.match(/code[:\s]+([4/][A-Za-z0-9_/\-.+]{20,})/i);
  if (labeled) return labeled[1].replace(/[.,;]+$/, "");

  // Google auth codes often start with 4/
  const google = cleaned.match(/\b(4\/[0-9A-Za-z\-_]{20,})\b/);
  if (google) return google[1];

  // Long opaque token on its own line-ish
  const long = cleaned.match(/\b([A-Za-z0-9_/\-+.]{40,})\b/);
  return long ? long[1] : null;
}

async function cdpEvaluate(wsUrl, expression) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("CDP websocket timeout")), 8000);
    ws.addEventListener("open", () => {
      clearTimeout(t);
      resolve();
    });
    ws.addEventListener("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
  });

  const id = Math.floor(Math.random() * 1e9);
  const result = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("CDP evaluate timeout")), 8000);
    ws.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(String(ev.data));
        if (msg.id !== id) return;
        clearTimeout(t);
        if (msg.error) reject(new Error(msg.error.message || "CDP error"));
        else resolve(msg.result);
      } catch (err) {
        clearTimeout(t);
        reject(err);
      }
    });
    ws.send(
      JSON.stringify({
        id,
        method: "Runtime.evaluate",
        params: {
          expression,
          returnByValue: true,
          awaitPromise: true,
        },
      })
    );
  });

  try {
    ws.close();
  } catch {
    /* ignore */
  }
  return result?.result?.value ?? null;
}

async function extractCodeFromCallbackPage(page) {
  const fromUrl = codeFromUrl(page.url);
  if (fromUrl) return fromUrl;

  if (!page.webSocketDebuggerUrl) return null;
  try {
    const text = await cdpEvaluate(
      page.webSocketDebuggerUrl,
      `(() => {
        const pick = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          return (el.value || el.textContent || el.innerText || '').trim();
        };
        return (
          pick('input[readonly]') ||
          pick('input[type="text"]') ||
          pick('code') ||
          pick('pre') ||
          pick('[data-code]') ||
          (document.body && (document.body.innerText || document.body.textContent)) ||
          ''
        );
      })()`
    );
    return codeFromPageText(text);
  } catch {
    return null;
  }
}

function snapshotCurrentIfNeeded({ saveCurrentAs, skipSaveCurrent }) {
  const before = whoami();
  let savedCurrent = null;
  if (!skipSaveCurrent && before.wincredExists) {
    const email = before.email;
    const profiles = listProfiles();
    const already = email
      ? profiles.some((p) => p.email && p.email.toLowerCase() === String(email).toLowerCase())
      : Boolean(before.activeProfile);
    if (!already || saveCurrentAs) {
      const name =
        (saveCurrentAs && String(saveCurrentAs).trim()) ||
        (email ? String(email).split("@")[0].replace(/[^\w.+-]+/g, "_") : null) ||
        before.activeProfile ||
        "default";
      try {
        savedCurrent = saveAccount(name);
      } catch (err) {
        savedCurrent = { error: err.message, attemptedName: name };
      }
    } else {
      savedCurrent = { skipped: true, reason: "already_saved", email };
    }
  }
  return { before, savedCurrent };
}

function openInExistingChrome(url) {
  // Open in a NEW Chrome window so the OAuth callback keeps its own window title
  // ("Google Antigravity Authentication") and is easy to find via UI Automation.
  // Do NOT set --user-data-dir — that would spawn a blank profile.
  const chrome = findChrome();
  if (chrome) {
    try {
      const child = spawn(chrome, ["--new-window", url], {
        detached: true,
        stdio: "ignore",
        windowsHide: false,
      });
      child.unref();
      return true;
    } catch {
      /* fall through */
    }
  }
  openSystemBrowser(url);
  return false;
}

function runPsAsync(args, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", ...args], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"],
    });
    let out = "";
    const timer = setTimeout(() => {
      try { child.kill(); } catch {}
      resolve("");
    }, timeoutMs);
    child.stdout.on("data", (c) => { out += c; });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve(code === 0 ? out.trim() : "");
    });
    child.on("error", () => {
      clearTimeout(timer);
      resolve("");
    });
  });
}

async function readSystemClipboard() {
  try {
    if (process.platform === "win32") {
      const out = await runPsAsync(
        ["-Command", "try { Get-Clipboard -Raw } catch { '' }"],
        4000
      );
      return String(out || "").trim();
    }
    if (process.platform === "darwin") {
      const r = spawnSync("pbpaste", [], { encoding: "utf8", timeout: 3000 });
      return String(r.stdout || "").trim();
    }
    const r = spawnSync("xclip", ["-selection", "clipboard", "-o"], {
      encoding: "utf8",
      timeout: 3000,
    });
    return String(r.stdout || "").trim();
  } catch {
    return "";
  }
}

function looksLikeAuthCode(text) {
  const t = String(text || "").trim().replace(/\s+/g, "");
  if (t.length < 20 || t.length > 2048) return false;
  if (/^https?:\/\//i.test(t)) return false;
  if (/^(4\/|1\/)/.test(t)) return true;
  // opaque oauth codes
  return /^[A-Za-z0-9_/\-.+=]+$/.test(t) && t.length >= 30;
}

async function readChromeUrls() {
  try {
    const script = path.join(ROOT, "scripts", "chrome-urls.ps1");
    if (!fs.existsSync(script)) return [];
    const out = await runPsAsync(["-File", script], 8000);
    if (!out) return [];
    if (out.startsWith("所在位置") || out.includes("ParserError")) return [];
    const parsed = JSON.parse(out);
    if (Array.isArray(parsed)) return parsed.map(String);
    if (typeof parsed === "string") return [parsed];
    return [];
  } catch {
    return [];
  }
}

/**
 * Focus OAuth Chrome window briefly and Ctrl+L / Ctrl+C to copy the address bar.
 * Needed because Chrome often hides the omnibox URL from UI Automation.
 */
async function copyOmniboxUrlViaHotkey() {
  try {
    const script = path.join(ROOT, "scripts", "chrome-omnibox-copy.ps1");
    if (!fs.existsSync(script)) return "";
    const out = await runPsAsync(["-File", script], 8000);
    return String(out || "").trim();
  } catch {
    return "";
  }
}

async function readAuthPageText() {
  try {
    const script = path.join(ROOT, "scripts", "chrome-page-text.ps1");
    if (!fs.existsSync(script)) return "";
    const out = await runPsAsync(["-File", script], 8000);
    return String(out || "").trim();
  } catch {
    return "";
  }
}

export function extractCodeFromText(text) {
  if (!text) return null;
  const str = String(text).trim();
  const m = str.match(/[?&#]code=([^&#\s]+)/i);
  if (m?.[1]) {
    try {
      return decodeURIComponent(m[1]).trim();
    } catch {
      return m[1].trim();
    }
  }
  return (
    codeFromUrl(str) ||
    codeFromPageText(str) ||
    (looksLikeAuthCode(str) ? str.replace(/\s+/g, "") : null)
  );
}

/**
 * Watch Chrome address bar + clipboard + page text after authorize.
 * Uses the user's normal Chrome (Google accounts already signed in).
 */
async function autoCaptureLoop(state) {
  const session = pending.get(state);
  if (!session) return;
  session.status = "waiting_auth";
  session.hint = "waiting_browser";
  session.lastError = null;
  const deadline = Date.now() + 10 * 60 * 1000;
  const seenCodes = new Set();
  let lastOmniboxTry = 0;
  let emptyStreak = 0;

  while (Date.now() < deadline) {
    const cur = pending.get(state);
    if (!cur || cur.status === "done" || cur.status === "error") return;

    try {
      const candidates = [];

      // 1) Address bars (may strip ?code=; still useful for detecting callback page)
      const urls = await readChromeUrls();
      for (const u of urls) {
        const c = extractCodeFromText(u);
        if (c) candidates.push(c);
      }

      // 2) Clipboard
      const clip = await readSystemClipboard();
      if (clip) {
        const c = extractCodeFromText(clip);
        if (c) candidates.push(c);
      }

      // 3) Callback page text (code is shown on page: "Paste this code…")
      const pageText = await readAuthPageText();
      if (pageText) {
        const c = extractCodeFromText(pageText);
        if (c) candidates.push(c);
        if (/Paste this code|Authentication/i.test(pageText)) {
          cur.hint = "capturing_url";
        }
      }

      if (!candidates.length) {
        emptyStreak += 1;
        if (emptyStreak >= 5) cur.hint = "need_callback_tab";
      } else {
        emptyStreak = 0;
      }

      for (const code of candidates) {
        if (!code || seenCodes.has(code)) continue;
        seenCodes.add(code);
        cur.status = "exchanging";
        cur.hint = "exchanging";
        try {
          const result = await finishBrowserOAuth({ state, code });
          cur.status = "done";
          cur.result = result;
          cur.hint = "done";
          cur.lastError = null;
          return;
        } catch (err) {
          cur.status = "waiting_auth";
          cur.hint = "exchange_failed";
          cur.lastError = err.message || String(err);
        }
      }
    } catch (err) {
      const cur2 = pending.get(state);
      if (cur2) cur2.lastError = err.message || String(err);
    }
    await new Promise((r) => setTimeout(r, 2500));
  }

  const cur = pending.get(state);
  if (cur && cur.status !== "done") {
    cur.status = "error";
    cur.error = cur.lastError || cur.error || "添加超时：未读到授权码，请保持授权完成页打开后重试";
    cur.hint = "error";
  }
}

/**
 * Start browser OAuth in the user's normal Chrome (keeps Google login sessions).
 * Auto-finishes when the auth code is copied from the official callback page.
 */
export function startBrowserOAuth({
  saveCurrentAs,
  skipSaveCurrent = false,
  open = true,
  auto = true,
} = {}) {
  purgeStalePending();

  const { client_id } = resolveOauthClient();
  const { verifier, challenge } = makePkce();
  const state = b64url(crypto.randomBytes(16));

  const url = new URL(AUTH_URL);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("client_id", client_id);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account consent");
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);

  /** @type {OAuthSession} */
  const session = {
    verifier,
    challenge,
    createdAt: Date.now(),
    beforeEmail: null,
    status: "pending",
    error: null,
    result: null,
    chromePid: null,
    debugPort: null,
    authUrl: url.toString(),
    auto: Boolean(auto),
    hint: "pending",
  };
  pending.set(state, session);

  // Run snapshotting, browser opening, and auto-capture in the background without blocking the HTTP response
  setImmediate(() => {
    try {
      const { before } = snapshotCurrentIfNeeded({ saveCurrentAs, skipSaveCurrent });
      session.beforeEmail = before?.email || null;
    } catch { /* ignore */ }

    if (open) {
      session.status = "browser_opened";
      try {
        openInExistingChrome(url.toString());
      } catch { /* ignore */ }
    }

    if (auto) {
      autoCaptureLoop(state).catch((err) => {
        const cur = pending.get(state);
        if (cur && cur.status !== "done") {
          cur.status = "error";
          cur.error = err.message || String(err);
        }
      });
    } else {
      session.status = "waiting_auth";
    }
  });

  return {
    ok: true,
    state,
    authUrl: url.toString(),
    redirectUri: REDIRECT_URI,
    auto: Boolean(auto),
    hint: "",
  };
}

export function getOAuthStatus(state) {
  purgeStalePending();
  const session = state ? pending.get(state) : null;
  if (!session) {
    return { ok: false, status: "missing", error: "会话不存在或已结束" };
  }
  return {
    ok: true,
    state,
    status: session.status,
    error: session.error || session.lastError || null,
    result: session.result,
    auto: session.auto,
    beforeEmail: session.beforeEmail,
    hint: session.hint || null,
  };
}

function buildCredBlobFromTokenResponse(data) {
  const expiry = new Date(Date.now() + Number(data.expires_in || 3600) * 1000).toISOString();
  return {
    token: {
      access_token: data.access_token,
      token_type: data.token_type || "Bearer",
      refresh_token: data.refresh_token,
      expiry,
    },
    auth_method: "consumer",
    id_token: data.id_token || null,
  };
}

/** Exchange authorization code and save as a named profile. */
export async function finishBrowserOAuth({ state, code, name } = {}) {
  if (!code || typeof code !== "string") {
    throw Object.assign(new Error("code required"), { code: "BAD_REQUEST" });
  }
  const extracted = extractCodeFromText(code);
  const cleaned = (extracted || code).trim().replace(/\s+/g, "");
  if (!cleaned) throw Object.assign(new Error("empty code"), { code: "BAD_REQUEST" });

  purgeStalePending();
  let session = state ? pending.get(state) : null;
  let sessionKey = state;
  if (!session && pending.size === 1) {
    sessionKey = [...pending.keys()][0];
    session = pending.get(sessionKey);
  }
  if (!session) {
    throw Object.assign(new Error("登录会话已过期，请重新点「添加账号」"), {
      code: "SESSION_EXPIRED",
    });
  }

  // Keep session in map until success so status polling still works; delete after
  const { client_id, client_secret } = resolveOauthClient();
  const body = new URLSearchParams({
    client_id,
    client_secret,
    code: cleaned,
    code_verifier: session.verifier,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const raw = await res.text();
  if (!res.ok) {
    throw Object.assign(new Error(`换取 token 失败：${res.status} ${raw.slice(0, 240)}`), {
      code: "TOKEN_EXCHANGE_FAILED",
    });
  }
  const data = JSON.parse(raw);
  if (!data.access_token) {
    throw Object.assign(new Error("token 响应缺少 access_token"), {
      code: "TOKEN_EXCHANGE_FAILED",
    });
  }

  const blobObj = buildCredBlobFromTokenResponse(data);
  const blobB64 = Buffer.from(JSON.stringify(blobObj), "utf8").toString("base64");
  writeWinCredBlob(blobB64);
  syncLiveOAuthFilesFromWinCred();
  invalidateWhoamiCache();

  const emailFromToken = decodeJwtEmail(data.id_token);
  const w = whoami(true);
  const effectiveEmail = emailFromToken || w.email;

  const existingWithSameEmail = effectiveEmail
    ? listProfiles().find((p) => p.email && p.email.toLowerCase() === effectiveEmail.toLowerCase())
    : null;
  const profileName =
    (name && String(name).trim()) ||
    (existingWithSameEmail ? existingWithSameEmail.name : null) ||
    suggestProfileName(effectiveEmail) ||
    (effectiveEmail ? effectiveEmail.split("@")[0] : "account");

  const saved = saveAccount(profileName);
  session.status = "done";
  session.result = { ok: true, ...saved };
  tryKillChrome(session);
  // Keep briefly for status poll, then drop
  setTimeout(() => pending.delete(sessionKey), 30_000);

  return {
    ok: true,
    ...saved,
    hint: "已写入 Windows 凭据并保存档案，可直接切换使用。",
  };
}

export function getOAuthHint() {
  return {
    redirectUri: REDIRECT_URI,
    autoCapture: "clipboard",
    note: "在你本机已登录的 Chrome 里打开授权；授权后复制回调页授权码即可自动完成（也可手动粘贴）。",
  };
}
