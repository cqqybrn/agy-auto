#!/usr/bin/env node
import http from "node:http";
import { URL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractPromptFromOpenAIMessages,
  resolveAgyBinary,
  runAgy,
  runAgyStream,
  abortRun,
  listActiveRuns,
  listAgents,
  readTranscript,
} from "./agyRunner.js";
import {
  listProfiles,
  saveAccount,
  switchAccount,
  removeAccount,
  clearLiveAuth,
  whoami,
} from "./accounts.js";
import {
  getPrefs,
  listModels,
  resolveDefaultModel,
  setPrefs,
} from "./models.js";
import { getUsage, recordLocalUsage } from "./usage.js";

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const API_KEY = process.env.AGY_API_KEY || "";
const DEFAULT_CWD = process.env.AGY_CWD || process.cwd();

const WEB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "web");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function tryServeStatic(req, res, pathname) {
  if (req.method !== "GET") return false;
  const rel = pathname === "/" || pathname === "" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(WEB_DIR, rel));
  if (!filePath.startsWith(WEB_DIR) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false;
  }
  const ext = path.extname(filePath).toLowerCase();
  const body = fs.readFileSync(filePath);
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache",
    "Content-Length": body.length,
  });
  res.end(body);
  return true;
}

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Length": Buffer.byteLength(data),
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(Object.assign(new Error("Invalid JSON body"), { cause: err }));
      }
    });
    req.on("error", reject);
  });
}

function authOk(req) {
  if (!API_KEY) return true;
  const h = req.headers.authorization || "";
  const key = h.startsWith("Bearer ") ? h.slice(7) : req.headers["x-api-key"];
  return key === API_KEY;
}

function bad(msg) {
  return Object.assign(new Error(msg), { code: "BAD_REQUEST" });
}

function openaiChatResponse({ id, model, content, usage }) {
  return {
    id: id || `chatcmpl-agy-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: model || "antigravity",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: content || "" },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: usage?.input_tokens ?? 0,
      completion_tokens: usage?.output_tokens ?? 0,
      total_tokens: usage?.total_tokens ?? 0,
    },
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);

  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  // Static frontend (web/) — everything except API/health routes
  if (
    req.method === "GET" &&
    url.pathname !== "/health" &&
    !url.pathname.startsWith("/v1/") &&
    tryServeStatic(req, res, url.pathname)
  ) {
    return;
  }

  if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/")) {
    let account = null;
    try {
      account = whoami();
    } catch {
      account = null;
    }
    return sendJson(res, 200, {
      ok: true,
      service: "agy-auto-backend",
      version: "1.3.0",
      capabilities: {
        autoApprove: true,
        streaming: true,
        subagents: true,
        transcripts: true,
        thinking: {
          main_stream: false,
          subagent_transcript: true,
          thinking_tokens_usage: true,
          note: "CLI headless has no separate thought channel; subagent transcript.jsonl may include thinking text. Official SDK/IDE expose thoughts.",
        },
        credits: false,
        abort: true,
      },
      agy: resolveAgyBinary(),
      autoApprove: true,
      flag: "--dangerously-skip-permissions",
      cwd: DEFAULT_CWD,
      prefs: getPrefs(),
      account,
    });
  }

  // Public-ish model list still respects API key if configured
  if (req.method === "GET" && url.pathname === "/v1/models") {
    if (!authOk(req)) return sendJson(res, 401, { error: { message: "Unauthorized" } });
    try {
      const data = listModels();
      const prefs = getPrefs();
      return sendJson(res, 200, {
        object: "list",
        default_model: prefs.defaultModel,
        data,
      });
    } catch (err) {
      return sendJson(res, 500, { error: { message: err.message, code: "MODELS_FAILED" } });
    }
  }

  if (!authOk(req)) {
    return sendJson(res, 401, { error: { message: "Unauthorized" } });
  }

  try {
    // ---- prefs / default model ----
    if (req.method === "GET" && url.pathname === "/v1/prefs") {
      return sendJson(res, 200, getPrefs());
    }

    // ---- usage / quota ----
    if (req.method === "GET" && url.pathname === "/v1/usage") {
      const force = url.searchParams.get("refresh") === "1" ||
        url.searchParams.get("force") === "1";
      const usage = await getUsage({ force });
      return sendJson(res, 200, usage);
    }

    if (req.method === "PUT" && url.pathname === "/v1/prefs") {
      const body = await readBody(req);
      const prefs = setPrefs({
        defaultModel: body.defaultModel ?? body.default_model ?? undefined,
        defaultEffort: body.defaultEffort ?? body.default_effort ?? undefined,
        defaultCwd: body.defaultCwd ?? body.default_cwd ?? undefined,
      });
      return sendJson(res, 200, { ok: true, prefs });
    }

    // ---- accounts ----
    if (req.method === "GET" && url.pathname === "/v1/accounts") {
      return sendJson(res, 200, { accounts: listProfiles(), whoami: whoami() });
    }

    if (req.method === "GET" && url.pathname === "/v1/accounts/whoami") {
      return sendJson(res, 200, whoami());
    }

    if (req.method === "POST" && url.pathname === "/v1/accounts/save") {
      const body = await readBody(req);
      if (!body.name) throw bad("name required");
      if (body.type === "apikey" || body.api_key || body.apiKey) {
        const r = saveAccount(body.name, {
          asApiKey: true,
          apiKey: body.api_key || body.apiKey,
          note: body.note,
        });
        switchAccount(body.name);
        return sendJson(res, 200, { ok: true, ...r });
      }
      const r = saveAccount(body.name, { note: body.note });
      return sendJson(res, 200, { ok: true, ...r });
    }

    if (req.method === "POST" && url.pathname === "/v1/accounts/switch") {
      const body = await readBody(req);
      if (!body.name) throw bad("name required");
      const result = switchAccount(body.name);
      return sendJson(res, 200, { ok: true, ...result });
    }

    if (req.method === "POST" && url.pathname === "/v1/accounts/clear-live") {
      return sendJson(res, 200, { ok: true, ...clearLiveAuth() });
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/v1/accounts/")) {
      const name = decodeURIComponent(url.pathname.slice("/v1/accounts/".length));
      if (!name) throw bad("name required");
      return sendJson(res, 200, { ok: true, ...removeAccount(name) });
    }

    // ---- agents / transcripts / runs ----
    if (req.method === "GET" && url.pathname === "/v1/agents") {
      const prefs = getPrefs();
      const cwd = url.searchParams.get("cwd") || prefs.defaultCwd || DEFAULT_CWD;
      return sendJson(res, 200, { agents: listAgents(cwd) });
    }

    if (req.method === "GET" && url.pathname === "/v1/runs") {
      return sendJson(res, 200, { runs: listActiveRuns() });
    }

    if (req.method === "POST" && url.pathname === "/v1/agent/abort") {
      const body = await readBody(req);
      const runId = body.run_id || body.runId;
      if (!runId) throw bad("run_id required");
      return sendJson(res, 200, abortRun(runId));
    }

    if (req.method === "GET" && url.pathname.startsWith("/v1/transcripts/")) {
      const id = decodeURIComponent(url.pathname.slice("/v1/transcripts/".length));
      if (!id) throw bad("conversation id required");
      const limit = Number(url.searchParams.get("limit") || 500);
      const includeThinking = url.searchParams.get("thinking") !== "0";
      const data = await readTranscript(id, { limit, includeThinking });
      return sendJson(res, data.ok ? 200 : 404, data);
    }

    if (req.method === "GET" && url.pathname === "/v1/capabilities") {
      return sendJson(res, 200, {
        service: "agy-auto-backend",
        version: "1.3.0",
        official_parity: {
          model_quotas_panel: true,
          model_selector: true,
          account_switch: "extended (multi-profile)",
          auto_approve: "forced via --dangerously-skip-permissions",
          streaming_steps: true,
          subagent_events: true,
          subagent_thinking_via_transcript: true,
          main_agent_thinking_stream: false,
          ai_credits_balance: false,
          interactive_agents_panel_kill: "partial (abort whole run only)",
        },
        endpoints: [
          "GET /health",
          "GET /v1/models",
          "GET|PUT /v1/prefs",
          "GET /v1/usage",
          "GET /v1/accounts",
          "POST /v1/accounts/save|switch|clear-live",
          "DELETE /v1/accounts/:name",
          "GET /v1/agents",
          "GET /v1/runs",
          "POST /v1/agent",
          "POST /v1/agent/stream",
          "POST /v1/agent/abort",
          "GET /v1/transcripts/:id",
          "POST /v1/chat/completions",
          "GET /v1/capabilities",
        ],
      });
    }

    // ---- agent run ----
    if (req.method === "POST" && url.pathname === "/v1/agent") {
      const body = await readBody(req);
      const prompt = body.prompt || body.input || body.message;
      if (!prompt) throw bad("prompt required");
      const model = resolveDefaultModel(body.model);
      const prefs = getPrefs();
      const result = await runAgy({
        prompt,
        cwd: body.cwd || prefs.defaultCwd || DEFAULT_CWD,
        model,
        effort: body.effort || prefs.defaultEffort,
        agent: body.agent,
        conversationId: body.conversation_id || body.conversationId,
        continueLast: Boolean(body.continue),
        outputFormat: body.output_format || "json",
        printTimeout: body.print_timeout,
        timeoutMs: body.timeout_ms,
        extraArgs: body.extra_args,
      });
      try {
        recordLocalUsage({
          model,
          usage: result.usage,
          conversationId: result.conversationId,
          account: (() => {
            try {
              return whoami()?.email || null;
            } catch {
              return null;
            }
          })(),
        });
      } catch {
        /* ignore local analytics errors */
      }
      return sendJson(res, 200, {
        ok: true,
        response: result.response ?? result.stdout,
        conversation_id: result.conversationId,
        status: result.status,
        usage: result.usage,
        model: model || null,
        run_id: result.runId,
        permission_mode: result.permissionMode,
        stderr: result.stderr || undefined,
      });
    }

    // ---- SSE streaming agent (text / tool / subagent) ----
    if (req.method === "POST" && url.pathname === "/v1/agent/stream") {
      const body = await readBody(req);
      const prompt = body.prompt || body.input || body.message;
      if (!prompt) throw bad("prompt required");
      const model = resolveDefaultModel(body.model);
      const prefs = getPrefs();
      const runId =
        body.run_id ||
        `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
        "X-Accel-Buffering": "no",
      });

      const sendEvent = (event, data) => {
        if (res.writableEnded) return;
        if (event) res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      let closed = false;
      req.on("close", () => {
        closed = true;
        abortRun(runId);
      });

      try {
        const summary = await runAgyStream(
          {
            runId,
            prompt,
            cwd: body.cwd || prefs.defaultCwd || DEFAULT_CWD,
            model,
            effort: body.effort || prefs.defaultEffort,
            agent: body.agent,
            conversationId: body.conversation_id || body.conversationId,
            continueLast: Boolean(body.continue),
            printTimeout: body.print_timeout,
            timeoutMs: body.timeout_ms,
            extraArgs: body.extra_args,
          },
          (evt) => {
            if (closed) return;
            sendEvent(evt.type || "message", evt);
          }
        );

        try {
          recordLocalUsage({
            model,
            usage: summary.usage,
            conversationId: summary.conversationId,
            account: (() => {
              try {
                return whoami()?.email || null;
              } catch {
                return null;
              }
            })(),
          });
        } catch {
          /* ignore */
        }

        if (!closed) {
          sendEvent("done", {
            ok: true,
            run_id: summary.runId,
            conversation_id: summary.conversationId,
            status: summary.status,
            response: summary.response,
            usage: summary.usage,
            subagents: summary.subagents,
            model: model || null,
          });
          res.end();
        }
      } catch (err) {
        if (!closed && !res.writableEnded) {
          sendEvent("error", {
            message: err.message,
            code: err.code || "INTERNAL",
            result: err.result
              ? {
                  conversation_id: err.result.conversationId,
                  status: err.result.status,
                  response: err.result.response,
                  usage: err.result.usage,
                  subagents: err.result.subagents,
                  stderr: err.result.stderr?.slice?.(0, 2000),
                }
              : undefined,
          });
          res.end();
        }
      }
      return;
    }

    if (
      req.method === "POST" &&
      (url.pathname === "/v1/chat/completions" || url.pathname === "/chat/completions")
    ) {
      const body = await readBody(req);
      const prompt =
        body.prompt || extractPromptFromOpenAIMessages(body.messages || []);
      if (!prompt) throw bad("messages or prompt required");
      const model = resolveDefaultModel(body.model);
      const prefs = getPrefs();
      const result = await runAgy({
        prompt,
        cwd: body.cwd || body.metadata?.cwd || prefs.defaultCwd || DEFAULT_CWD,
        model,
        effort: body.effort || body.metadata?.effort || prefs.defaultEffort,
        agent: body.agent || body.metadata?.agent,
        conversationId: body.conversation_id || body.metadata?.conversation_id,
        continueLast: Boolean(body.continue || body.metadata?.continue),
        outputFormat: "json",
        printTimeout: body.print_timeout,
        timeoutMs: body.timeout_ms,
      });
      try {
        recordLocalUsage({
          model,
          usage: result.usage,
          conversationId: result.conversationId,
        });
      } catch {
        /* ignore */
      }
      return sendJson(
        res,
        200,
        openaiChatResponse({
          model: model || body.model || "antigravity",
          content: result.response ?? result.stdout,
          usage: result.usage,
        })
      );
    }

    sendJson(res, 404, { error: { message: `Not found: ${url.pathname}` } });
  } catch (err) {
    const status =
      err.code === "AGY_TIMEOUT" ? 504 : err.code === "BAD_REQUEST" ? 400 : 500;
    sendJson(res, status, {
      error: {
        message: err.message,
        code: err.code || "INTERNAL",
        result: err.result
          ? {
              stderr: err.result.stderr,
              stdout: err.result.stdout?.slice?.(0, 2000),
              status: err.result.status,
              code: err.result.code,
            }
          : undefined,
      },
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[agy-auto] listening on http://${HOST}:${PORT}`);
  console.log(`[agy-auto] agy binary: ${resolveAgyBinary()}`);
  console.log(`[agy-auto] auto-approve: --dangerously-skip-permissions`);
  console.log(`[agy-auto] default cwd: ${DEFAULT_CWD}`);
  try {
    console.log(`[agy-auto] account: ${JSON.stringify(whoami())}`);
  } catch {
    /* ignore */
  }
  if (API_KEY) console.log(`[agy-auto] API key auth enabled`);
  else console.log(`[agy-auto] API key auth disabled (set AGY_API_KEY to enable)`);
});
