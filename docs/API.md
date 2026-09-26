# agy-auto Backend API（前端对接文档）

Base URL（默认）：`http://127.0.0.1:8787`

- 所有写文件 / 跑命令：**已强制自动同意**（`--dangerously-skip-permissions`）
- CORS：已放开 `*`（本地前端可直接调）
- 可选鉴权：环境变量 `AGY_API_KEY`  
  - Header：`Authorization: Bearer <key>` 或 `x-api-key: <key>`
  - 未设置时不校验

启动：

```powershell
cd D:\ProgramData\antigravity
.\start-server.cmd
```

---

## 快速能力一览

| 能力 | 怎么做 |
|------|--------|
| 跑任务（自动同意） | `POST /v1/agent` |
| **流式任务（文本/工具/子代理）** | **`POST /v1/agent/stream`（SSE）** |
| **取消任务** | **`POST /v1/agent/abort`** |
| 切模型（单次） | body 里传 `model` |
| 设默认模型 | `PUT /v1/prefs` |
| 列模型 | `GET /v1/models` |
| 列自定义 Agent | `GET /v1/agents` |
| **用量 / 配额** | **`GET /v1/usage`** |
| **子代理 transcript（含 thinking）** | **`GET /v1/transcripts/:id`** |
| 切账号（免浏览器） | `POST /v1/accounts/switch` |
| 能力清单 / 遗漏说明 | `GET /v1/capabilities` |
| OpenAI 兼容 | `POST /v1/chat/completions` |

---

## 1. Health

### `GET /health` 或 `GET /`

**Response 200**

```json
{
  "ok": true,
  "service": "agy-auto-backend",
  "version": "1.1.0",
  "agy": "C:\\Users\\...\\agy.exe",
  "autoApprove": true,
  "flag": "--dangerously-skip-permissions",
  "cwd": "D:\\ProgramData\\antigravity",
  "prefs": {
    "defaultModel": "claude-sonnet-4-6",
    "defaultEffort": null,
    "defaultCwd": null
  },
  "account": {
    "activeProfile": "default",
    "email": "you@gmail.com",
    "wincredExists": true,
    "accountType": "oauth"
  }
}
```

---

## 2. 模型

可以切换。单次请求传 `model`；也可设全局默认。

### `GET /v1/models`

从本机 `agy models` 实时拉取。

**Response 200**

```json
{
  "object": "list",
  "default_model": "claude-sonnet-4-6",
  "data": [
    { "id": "gemini-3.8-flash-high", "object": "model", "owned_by": "antigravity", "label": "Gemini 3.8 Flash (High)" },
    { "id": "claude-sonnet-4-6", "object": "model", "owned_by": "antigravity", "label": "Claude Sonnet 4.6 (Thinking)" },
    { "id": "claude-opus-4-6-thinking", "object": "model", "owned_by": "antigravity", "label": "Claude Opus 4.6 (Thinking)" },
    { "id": "gpt-oss-120b-medium", "object": "model", "owned_by": "antigravity", "label": "GPT-OSS 120B (Medium)" }
  ]
}
```

> 前端下拉框用 `data[].id` 作为值，`label` 作为显示名。

当前本机可见 id（会随账号/配额变化）：

- `gemini-3.8-flash-{high,medium,low}`
- `gemini-3.7-flash-{high,medium,low}`
- `gemini-3.6-flash-{high,medium,low}`
- `gemini-3.1-pro-{high,low}`
- `claude-sonnet-4-6`
- `claude-opus-4-6-thinking`
- `gpt-oss-120b-medium`

### `GET /v1/prefs` / `PUT /v1/prefs`

读写默认模型 / 默认 effort / 默认工作目录。

**PUT body**

```json
{
  "defaultModel": "claude-sonnet-4-6",
  "defaultEffort": "high",
  "defaultCwd": "D:\\your\\project"
}
```

也可 snake_case：`default_model` / `default_effort` / `default_cwd`。

**effort 可选**：`low` | `medium` | `high` | `max`

---

## 2.5 用量 / 配额（与官方 UI 一一对应）

官方依据：

- Models 面板文案：[Models](https://www.antigravity.google/docs/models/)
- CLI `/usage`（alias `/quota`）：[Model Quotas](https://www.antigravity.google/docs/cli/commands/usage/)
- Statusline `quota` 字段：[Status line](https://www.antigravity.google/docs/cli/statusline)
- AI Credits 是**另一套**（`/credits`），不是 Model Quotas：[AI Credits](https://antigravity.google/docs/cli/credits/)

### 官方 UI 结构（你前端要照这个画）

```text
Model Quotas
├─ Gemini Models
│    ├─ Weekly Limit Remaining      ← 进度条 = remainingFraction
│    └─ Five Hour Limit Remaining
└─ Claude and GPT models
     ├─ Weekly Limit Remaining
     └─ Five Hour Limit Remaining   ← 可能 disabled=true（周额度耗尽时）
```

### `GET /v1/usage`

同源 API：`POST …/v1internal:retrieveUserQuotaSummary`（与官方 IDE / `agy /usage` 相同）。

Query：`?refresh=1` 强制刷新（默认约 60s 缓存）。

**Response（推荐用 `panel` + `quota`）**

```json
{
  "ok": true,
  "fetchedAt": "2026-09-26T11:22:27.312Z",
  "cached": false,
  "email": "you@gmail.com",
  "plan_tier": null,
  "project": "aicode-consumers",
  "product": "antigravity",

  "panel": {
    "title": "Model Quotas",
    "description": "Within each group, models share a weekly limit and a 5-hour limit. ...",
    "groups": [
      {
        "displayName": "Gemini Models",
        "description": "Models within this group: Gemini Flash, Gemini Pro",
        "buckets": [
          {
            "bucketId": "gemini-weekly",
            "displayName": "Weekly Limit Remaining",
            "window": "weekly",
            "remainingFraction": 0.8893052,
            "remainingPercent": 88.9,
            "usedPercent": 11.1,
            "resetTime": "2026-09-27T12:37:07Z",
            "reset_in_seconds": 90840,
            "resetsIn": "1d 1h",
            "description": "You have used some of your weekly limit...",
            "disabled": false
          },
          {
            "bucketId": "gemini-5h",
            "displayName": "Five Hour Limit Remaining",
            "window": "5h",
            "remainingFraction": 0.9768063,
            "remainingPercent": 97.7,
            "usedPercent": 2.3,
            "resetTime": "2026-09-26T16:07:17Z",
            "reset_in_seconds": 17000,
            "resetsIn": "4h 43m",
            "disabled": false
          }
        ]
      },
      {
        "displayName": "Claude and GPT models",
        "description": "Models within this group: Claude Opus, Claude Sonnet, GPT-OSS",
        "buckets": [
          {
            "bucketId": "3p-weekly",
            "displayName": "Weekly Limit Remaining",
            "window": "weekly",
            "remainingFraction": 0,
            "remainingPercent": 0,
            "usedPercent": 100,
            "resetTime": "2026-09-27T12:04:59Z",
            "disabled": false
          },
          {
            "bucketId": "3p-5h",
            "displayName": "Five Hour Limit Remaining",
            "window": "5h",
            "remainingFraction": 1,
            "remainingPercent": 100,
            "disabled": true
          }
        ]
      }
    ]
  },

  "quota": {
    "gemini-weekly": {
      "remaining_fraction": 0.8893052,
      "reset_time": "2026-09-27T12:37:07Z",
      "reset_in_seconds": 90840,
      "display_name": "Weekly Limit Remaining",
      "window": "weekly",
      "disabled": false
    },
    "gemini-5h": { "remaining_fraction": 0.9768063, "reset_time": "...", "reset_in_seconds": 17000 },
    "3p-weekly": { "remaining_fraction": 0, "reset_time": "...", "reset_in_seconds": 88900 },
    "3p-5h": { "remaining_fraction": 1, "disabled": true }
  },

  "credits": {
    "note": "AI Credits are separate from Model Quotas (official /credits).",
    "balance": null,
    "available": false
  },

  "local": { "total": { "total_tokens": 0, "requests": 0 }, "today": null, "recent": [] },
  "raw": { "groups": [ "…官方原始 groups…" ], "description": "…" }
}
```

### 字段对照表（官方 ↔ 本后端）

| 官方 UI / Statusline | 本后端字段 |
|----------------------|------------|
| 面板标题 Model Quotas | `panel.title` |
| 组名 **Gemini Models** | `panel.groups[].displayName` |
| 组名 **Claude and GPT models** | 同上 |
| **Weekly Limit Remaining** | `buckets[].displayName` + `bucketId`=`*-weekly` |
| **Five Hour Limit Remaining** | `buckets[].displayName` + `bucketId`=`*-5h` |
| 进度（剩余比例 0~1） | `remainingFraction` / statusline: `quota[id].remaining_fraction` |
| 重置时间 | `resetTime` / `quota[id].reset_time` |
| 重置倒计时秒 | `reset_in_seconds` |
| 桶说明文案 | `buckets[].description` |
| 5h 桶被周额度压制 | `disabled: true`（仍要展示，官方会灰掉） |
| statusline `email` | `email` |
| statusline `plan_tier` | `plan_tier` |
| statusline `quota` map | `quota`（key=`gemini-weekly` / `gemini-5h` / `3p-weekly` / `3p-5h`） |
| AI Credits（`/credits`） | `credits`（与配额分离；余额接口后续可接） |
| 本后端本地累计（非官方） | `local` |

### 前端渲染建议（对齐官方）

```tsx
// 伪代码
for (const group of data.panel.groups) {
  <h3>{group.displayName}</h3>           // Gemini Models / Claude and GPT models
  <p>{group.description}</p>
  for (const b of group.buckets) {
    <label>{b.displayName}</label>       // Weekly / Five Hour Limit Remaining
    <Progress value={b.remainingPercent} disabled={b.disabled} />
    <span>{b.remainingPercent}% · reset {b.resetsIn}</span>
    // 或用官方文案：b.description
  }
}
```

单次对话 token：看 `POST /v1/agent` 返回的 `usage`（对应 statusline `context_window.current_usage` 语义，但是本轮请求统计）。

> `cached:true` + `stale:true` = 刷新失败，展示旧缓存。

---

## 3. 跑 Agent（主接口，推荐前端用这个）

### `POST /v1/agent`

**Request**

```json
{
  "prompt": "把 README 里的标题改成 Hello",
  "cwd": "D:\\your\\project",
  "model": "claude-sonnet-4-6",
  "effort": "high",
  "agent": null,
  "conversation_id": null,
  "continue": false,
  "print_timeout": "10m",
  "timeout_ms": 600000
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `prompt` | ✅ | 任务文本（也可用 `input` / `message`） |
| `cwd` | | 工作目录；不传则用 prefs.defaultCwd 或服务启动目录 |
| `model` | | 模型 id；不传则用 prefs.defaultModel；再没有则用 agy 默认 |
| `effort` | | 推理强度 |
| `agent` | | 自定义 agent 名（见 `GET /v1/agents`） |
| `conversation_id` | | 续聊 id |
| `continue` | | `true` = 续上一次对话 |
| `print_timeout` | | agy 超时，如 `5m` / `0` |
| `timeout_ms` | | 后端杀进程超时（毫秒） |

**Response 200**

```json
{
  "ok": true,
  "response": "已完成修改。",
  "conversation_id": "uuid...",
  "run_id": "run_...",
  "status": "SUCCESS",
  "usage": {
    "input_tokens": 12000,
    "output_tokens": 200,
    "thinking_tokens": 100,
    "cache_read_tokens": 0,
    "total_tokens": 12300
  },
  "model": "claude-sonnet-4-6",
  "permission_mode": "always-proceed (--dangerously-skip-permissions)"
}
```

> 注意：同步接口可能跑很久。前端建议超时 ≥ 5–10 分钟；要看过程请用下面的 SSE。

---

## 3.1 流式跑 Agent（SSE）— 文本 / 工具 / Subagent

### `POST /v1/agent/stream`

Body 与 `/v1/agent` 相同。响应为 **Server-Sent Events**。

**响应头**

```http
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
```

**事件类型（`event:` + `data:` JSON）**

| event | 含义 | 关键字段 |
|-------|------|----------|
| `run_started` | 开始 | `run_id`, `cwd`, `model` |
| `init` | agy 初始化 | `conversation_id`, `tools`, `permission_mode` |
| `text_delta` | 主代理增量文本 | `text_delta`, `step_index`, `state` |
| `tool` | 工具调用 | `tool_name`, `tool_info` `{name,parameters,output,error?}` |
| `subagent` | 派生子代理 | `subagents[]`：`role`, `conversation_id`, `log_uri`, `transcript_id`, `initial_prompt` |
| `error_message` | 模型/配额等错误步骤 | （如 Claude 周额度耗尽时会出现） |
| `step` | 其它步骤 | `step_type`, `state` |
| `system` | 系统消息 | |
| `stderr` | agy 诊断输出 | `text` |
| `result` | agy 最终 result | `response`, `usage`, `status` |
| `run_finished` | 进程结束汇总 | `subagents`, `usage`, … |
| `done` | HTTP 流正常结束（成功） | 同同步接口字段 + `subagents` |
| `error` | 失败/中止 | `message`, `code`, `result?` |

**前端示例**

```ts
const res = await fetch("http://127.0.0.1:8787/v1/agent/stream", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "用子代理列目录", cwd: "D:\\\\proj" }),
});
const reader = res.body!.getReader();
const dec = new TextDecoder();
let buf = "";
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buf += dec.decode(value, { stream: true });
  const parts = buf.split("\n\n");
  buf = parts.pop() || "";
  for (const block of parts) {
    const ev = block.match(/^event: (.+)$/m)?.[1];
    const dataLine = block.split("\n").find((l) => l.startsWith("data: "));
    if (!dataLine) continue;
    const data = JSON.parse(dataLine.slice(6));
    if (ev === "text_delta") appendAssistant(data.text_delta);
    if (ev === "tool") showTool(data.tool_name, data.tool_info);
    if (ev === "subagent") {
      for (const sa of data.subagents || []) {
        // 拉取子代理思考/工具日志（见 transcripts）
        const t = await fetch(
          `http://127.0.0.1:8787/v1/transcripts/${sa.conversation_id}`
        ).then((r) => r.json());
        showSubagent(sa.role, t.steps); // steps[].thinking 常有内容
      }
    }
  }
}
```

### `POST /v1/agent/abort`

```json
{ "run_id": "run_...." }
```

关闭浏览器标签 / 断开 SSE 时，服务端也会自动 abort 该 run。

### `GET /v1/runs`

当前进行中的 run 列表。

### `GET /v1/agents?cwd=`

可用 agent（builtin default + workspace/global 自定义 `agent.md`）。

### `GET /v1/transcripts/:conversationId`

读 brain 下 `transcript.jsonl`（子代理 `log_uri` / `conversation_id`）。

**重要：** 子代理 transcript 的步骤里经常有 **`thinking` 字段**（独立思考文本）。主会话 CLI 流式**没有**单独 thought 通道，只有 `thinking_tokens` 计数。

```json
{
  "ok": true,
  "path": "C:\\Users\\...\\brain\\<id>\\...\\transcript.jsonl",
  "conversation_id": "<id>",
  "steps": [
    {
      "step_index": 1,
      "type": "PLANNER_RESPONSE",
      "thinking": "Initial focus is on confirming subagent operation...",
      "tool_calls": [{ "name": "run_command", "args": { "...": "..." } }]
    }
  ]
}
```

Query：`?limit=500`、`thinking=0` 可关掉思考字段。

---

## 3.2 能力边界 / 遗漏（`GET /v1/capabilities`）

| 能力 | 状态 |
|------|------|
| 强制自动同意 | ✅ |
| 模型列表 / 默认模型 | ✅ |
| 官方配额面板字段 | ✅ `GET /v1/usage` |
| 多账号快切 | ✅ |
| SSE：text / tool / subagent | ✅ |
| 子代理 transcript + thinking | ✅ |
| 取消整次 run | ✅ |
| 主代理独立思考流 | ❌ CLI 不提供（IDE/SDK 有） |
| AI Credits 余额（`/credits`） | ❌ 未接 |
| 单独 kill 某一个 subagent（官方 `/agents` 按 K） | ❌ 目前只能 abort 整次父 run |
| MCP / Plugins 管理 UI API | ❌ 未暴露（agy 本机命令仍可用） |
| Browser 子工具实时截图流 | ⚠️ 可能出现在 tool 事件里，未单独封装 |

**错误**

```json
{
  "error": {
    "message": "...",
    "code": "AGY_EXIT | AGY_TIMEOUT | AGY_ABORTED | BAD_REQUEST | INTERNAL",
    "result": { "stderr": "...", "stdout": "...", "status": "...", "code": 1 }
  }
}
```

| HTTP | 含义 |
|------|------|
| 400 | 缺 prompt 等 |
| 401 | API key 不对 |
| 504 | 超时 |
| 500 | agy 失败 / 其它 |

---

## 4. OpenAI 兼容（可选）

### `POST /v1/chat/completions`

```json
{
  "model": "claude-sonnet-4-6",
  "messages": [
    { "role": "user", "content": "列出当前目录文件" }
  ],
  "cwd": "D:\\your\\project"
}
```

`model` 为 `antigravity` / `agy` / `default` 时，会回退到 prefs 默认模型。

返回标准 OpenAI `chat.completion` 形状。

---

## 5. 账号（类似切 cookie）

### `GET /v1/accounts`

```json
{
  "accounts": [
    {
      "name": "default",
      "type": "oauth",
      "email": "a@gmail.com",
      "savedAt": "2026-09-26T11:16:48.134Z",
      "active": true
    }
  ],
  "whoami": {
    "activeProfile": "default",
    "email": "a@gmail.com",
    "wincredExists": true,
    "accountType": "oauth"
  }
}
```

### `GET /v1/accounts/whoami`

当前登录信息。

### `POST /v1/accounts/save`

保存**当前** live 登录为命名 profile（之后 switch 免浏览器）。

```json
{ "name": "default", "note": "主号" }
```

API Key 账号：

```json
{ "name": "key1", "type": "apikey", "api_key": "AIza..." }
```

### `POST /v1/accounts/switch`

```json
{ "name": "work" }
```

**Response**

```json
{
  "ok": true,
  "name": "work",
  "type": "oauth",
  "email": "b@gmail.com",
  "hint": "OAuth restored to Windows Credential Manager. No browser needed."
}
```

### `POST /v1/accounts/clear-live`

清除当前 live 登录（为「浏览器登录新号」做准备）。**不会删**已保存 profile。

### `DELETE /v1/accounts/:name`

删除已保存 profile。

#### 前端推荐账号流程

1. 首次：用户本机已 `agy` 登录 → 调 `POST /v1/accounts/save` `{name:"default"}`
2. 加新号：`clear-live` → 提示用户终端跑一次 `agy` 浏览器登录 → 再 `save` 成 `work`
3. 日常：只调 `switch`，不再开浏览器

---

## 6. 前端调用示例

### fetch 跑任务 + 选模型

```ts
const BASE = "http://127.0.0.1:8787";

export async function runAgent(opts: {
  prompt: string;
  cwd?: string;
  model?: string;
  effort?: string;
  conversationId?: string;
}) {
  const res = await fetch(`${BASE}/v1/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: opts.prompt,
      cwd: opts.cwd,
      model: opts.model,
      effort: opts.effort,
      conversation_id: opts.conversationId,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || res.statusText);
  return data as {
    ok: true;
    response: string;
    conversation_id: string;
    status: string;
    model: string | null;
    usage?: Record<string, number>;
  };
}

export async function listModels() {
  const res = await fetch(`${BASE}/v1/models`);
  return res.json();
}

export async function switchAccount(name: string) {
  const res = await fetch(`${BASE}/v1/accounts/switch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function setDefaultModel(modelId: string) {
  const res = await fetch(`${BASE}/v1/prefs`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ defaultModel: modelId }),
  });
  return res.json();
}

export async function getUsage(refresh = false) {
  const q = refresh ? "?refresh=1" : "";
  const res = await fetch(`${BASE}/v1/usage${q}`);
  return res.json();
}
```

### 建议 UI 模块

1. **顶部栏**：账号 + 模型 + 用量条（`GET /v1/usage`）
2. **主区**：prompt / cwd / 发送；优先走 **`/v1/agent/stream`**
3. **时间线**：`text_delta` 拼回复；`tool` 卡片；`subagent` 卡片 → 点开拉 `GET /v1/transcripts/:id` 看 **thinking**
4. **取消**：保存 `run_id`，调 `/v1/agent/abort` 或断开 SSE
5. **账号管理页**：list / save / switch / delete / clear-live
6. **能力说明**：启动时读 `/v1/capabilities` 决定隐藏 Credits 等未实现入口

---

## 7. CLI 对照（调试用）

```powershell
cd D:\ProgramData\antigravity
.\agy-auto.cmd account list
.\agy-auto.cmd account switch default
.\agy-auto.cmd --json -p "hello" --model claude-sonnet-4-6
.\start-server.cmd
```

---

## 8. 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `HOST` | `127.0.0.1` | 监听地址 |
| `PORT` | `8787` | 端口 |
| `AGY_API_KEY` | 空 | 开启鉴权 |
| `AGY_CWD` | 启动目录 | 默认工作目录 |
| `AGY_BIN` | 自动探测 | agy 路径 |
| `AGY_TIMEOUT_MS` | `0` | 全局进程超时，0=不限 |

---

## 9. 注意

1. **长时间任务**：`/v1/agent` 是同步阻塞到结束；前端要大 timeout。
2. **账号切换**是改本机 WinCred；请勿并发多个会刷新 token 的 agy 进程抢同一个 live 槽。
3. `accounts/` 含敏感凭据，勿提交 git / 勿暴露到公网。
4. 服务只建议绑 `127.0.0.1`。
