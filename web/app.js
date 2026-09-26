/* Antigravity Console — frontend for agy-auto backend (docs/API.md) */
(() => {
  "use strict";

  // ==========================================================
  // Utils
  // ==========================================================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    panel: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9.5 4v16"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    chevDown: '<path d="m6 9 6 6 6-6"/>',
    chevRight: '<path d="m9 6 6 6-6 6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2.5"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4.5A2.5 2.5 0 0 1 2 12.5v-8A2.5 2.5 0 0 1 4.5 2h8A2.5 2.5 0 0 1 15 4.5V5"/>',
    folder: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.3a2 2 0 0 1 1.6.8l1 1.4a2 2 0 0 0 1.6.8h5.5A2.5 2.5 0 0 1 21 10.5v6a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5z"/>',
    terminal: '<path d="m5 17 5-5-5-5M12 19h7"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    filePlus: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 11v6M9 14h6"/>',
    pencil: '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13v1.5M15 13v1.5"/><circle cx="12" cy="3.5" r="1"/>',
    sparkle: '<path d="M12 3c.4 4.6 2.4 6.6 7 7-4.6.4-6.6 2.4-7 7-.4-4.6-2.4-6.6-7-7 4.6-.4 6.6-2.4 7-7z"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.1-.4-.4-2.1z"/>',
    message: '<path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    git: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="9" r="2.5"/><path d="M6 8.5v7M18 11.5c0 3-3 4-7.5 5"/>',
    minus: '<path d="M6 12h12"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    rotate: '<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5"/><path d="M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.7L4 15.5"/><path d="M4 20v-4.5h4.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 14.5A8.5 8.5 0 0 1 9.5 3a7 7 0 1 0 11.5 11.5z"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  };

  function iconHTML(name, cls = "") {
    return `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.sparkle}</svg>`;
  }
  function icon(name, cls = "") {
    const t = document.createElement("template");
    t.innerHTML = iconHTML(name, cls);
    return t.content.firstChild;
  }
  function logoEl(cls = "logo") {
    const t = document.createElement("template");
    t.innerHTML = `<svg class="${cls}"><use href="#agLogo"/></svg>`;
    return t.content.firstChild;
  }
  function hydrateIcons(root = document) {
    for (const el of $$("i[data-i]", root)) el.replaceWith(icon(el.dataset.i, el.className));
  }

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k === "html") el.innerHTML = v;
        else if (k === "value") el.value = v;
        else if (k === "checked") el.checked = !!v;
        else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? "" : v);
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.appendChild(typeof kid === "string" || typeof kid === "number" ? document.createTextNode(String(kid)) : kid);
    }
    return el;
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const LS = {
    get(k, d) {
      const raw = localStorage.getItem(k);
      if (raw == null) return d;
      try { return JSON.parse(raw); } catch { return raw; }
    },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ }
    },
  };

  const uid = (p = "") => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function fmtNum(n) {
    if (n == null || Number.isNaN(+n)) return "—";
    n = +n;
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M";
    if (Math.abs(n) >= 1e4) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + "k";
    return n.toLocaleString();
  }
  function fmtDur(ms) {
    if (ms == null || ms < 0) return "";
    const s = ms / 1000;
    if (s < 60) return `${s < 10 ? s.toFixed(1) : Math.round(s)}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${String(Math.floor(s % 60)).padStart(2, "0")}s`;
    return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
  }
  function fmtSecs(sec) {
    if (sec == null) return "";
    sec = Math.max(0, Math.round(sec));
    if (sec >= 86400) return `${Math.floor(sec / 86400)}d ${Math.floor((sec % 86400) / 3600)}h`;
    if (sec >= 3600) return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
    if (sec >= 60) return `${Math.floor(sec / 60)}m`;
    return `${sec}s`;
  }
  const fmtTime = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const fmtDateTime = (t) => new Date(t).toLocaleString([], { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  const baseName = (p) => { const s = String(p ?? "").replace(/[\\/]+$/, ""); return s.split(/[\\/]/).pop() || s; };
  const oneLine = (s, n = 160) => { const t = String(s ?? "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
  const humanize = (s) => { const t = String(s ?? "").replace(/^STEP_TYPE_|^CORTEX_STEP_TYPE_/i, "").replace(/[_-]+/g, " ").trim().toLowerCase(); return t ? t[0].toUpperCase() + t.slice(1) : ""; };
  const shortId = (id) => String(id || "").slice(0, 8);

  async function copyText(text, msg = "已复制") {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = h("textarea", { style: "position:fixed;opacity:0" });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    toast(msg);
  }

  function toast(msg, isErr = false) {
    const el = h("div", { class: "toast" + (isErr ? " err" : "") }, icon(isErr ? "alert" : "check"), h("span", { text: msg }));
    $("#toastWrap").appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 300); }, isErr ? 5200 : 3200);
  }

  function parseMaybeJSON(x) {
    if (typeof x !== "string") return x;
    const t = x.trim();
    if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
      try { return JSON.parse(t); } catch { /* keep */ }
    }
    return x;
  }
  function pretty(x, max = 30000) {
    if (x == null) return "";
    const v = parseMaybeJSON(x);
    const s = typeof v === "string" ? v : JSON.stringify(v, null, 2);
    return s.length > max ? s.slice(0, max) + `\n… (${fmtNum(s.length - max)} more chars)` : s;
  }
  function pick(obj, keys) {
    if (!obj || typeof obj !== "object") return null;
    const norm = (k) => k.toLowerCase().replace(/[_-]/g, "");
    const map = {};
    for (const k of Object.keys(obj)) map[norm(k)] = obj[k];
    for (const k of keys) {
      const v = map[norm(k)];
      if (v != null && v !== "") return v;
    }
    return null;
  }

  // ==========================================================
  // Config / API
  // ==========================================================
  const defaultBase = location.protocol.startsWith("http") ? location.origin : "http://127.0.0.1:8787";
  const cfg = {
    base: LS.get("agy.base", "") || "",
    apiKey: LS.get("agy.apiKey", "") || "",
    stream: LS.get("agy.stream", true) !== false,
  };
  const baseUrl = () => (cfg.base || defaultBase).replace(/\/+$/, "");
  const apiUrl = (p) => baseUrl() + p;

  function headers(json) {
    const hd = {};
    if (json) hd["Content-Type"] = "application/json";
    if (cfg.apiKey) hd.Authorization = `Bearer ${cfg.apiKey}`;
    return hd;
  }

  function apiError(res, data) {
    const e = data?.error;
    const msg = (typeof e === "string" ? e : e?.message) || `${res.status} ${res.statusText}`;
    return Object.assign(new Error(msg), { status: res.status, code: e?.code, detail: e?.result, data });
  }

  async function api(path, { method = "GET", body, timeoutMs = 30000, signal } = {}) {
    const ctrl = new AbortController();
    const timer = timeoutMs > 0 ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
    if (signal) signal.addEventListener("abort", () => ctrl.abort(), { once: true });
    try {
      const res = await fetch(apiUrl(path), {
        method,
        headers: headers(body !== undefined),
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw apiError(res, data);
      return data;
    } catch (err) {
      if (err.name === "AbortError") throw Object.assign(new Error(signal?.aborted ? "已取消" : "请求超时"), { code: "ABORTED" });
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  // ==========================================================
  // Markdown (safe subset: everything escaped first)
  // ==========================================================
  const RE_FENCE = /^\s{0,3}(`{3,}|~{3,})\s*([\w+#.-]*)/;
  const RE_LI = /^(\s*)([-*+]|\d{1,3}[.)])\s+(.*)$/;
  const RE_HR = /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/;
  const RE_H = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
  const RE_TSEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/;
  const RE_QUOTE = /^\s{0,3}>/;

  function mdInline(s) {
    const store = [];
    const keep = (html) => `\u0000${store.push(html) - 1}\u0000`;
    let t = String(s);
    t = t.replace(/`([^`\n]+)`/g, (_, c) => keep(`<code>${esc(c)}</code>`));
    t = t.replace(/\[([^\]\n]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (m, label, url) =>
      /^(https?:|mailto:|#)/i.test(url) ? keep(`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`) : m);
    t = t.replace(/\bhttps?:\/\/[^\s<>()\u0000]+[^\s<>().,;:!?'"\u0000]/g, (u) =>
      keep(`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u)}</a>`));
    t = esc(t);
    t = t.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>").replace(/__([^_\n]+?)__/g, "<strong>$1</strong>");
    t = t.replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, "$1<em>$2</em>");
    t = t.replace(/(^|[^_\w])_(?!\s)([^_\n]+?)_(?!\w)/g, "$1<em>$2</em>");
    t = t.replace(/~~([^~\n]+?)~~/g, "<del>$1</del>");
    return t.replace(/\u0000(\d+)\u0000/g, (_, i) => store[+i]);
  }

  function codeBlockHTML(code, lang) {
    return `<div class="codeblock"><div class="cb-head"><span>${esc(lang || "text")}</span>` +
      `<button class="cb-copy" type="button">${iconHTML("copy")}<span>Copy</span></button></div>` +
      `<pre><code>${esc(code)}</code></pre></div>`;
  }

  function mdList(lines) {
    const first = lines.find((l) => RE_LI.test(l));
    const m0 = first.match(RE_LI);
    const base = m0[1].length;
    const offset = base + m0[2].length + 1;
    const ordered = /\d/.test(m0[2]);
    const start = ordered ? parseInt(m0[2], 10) : 1;
    const items = [];
    const strip = new RegExp(`^ {0,${offset}}`);
    for (const l of lines) {
      const m = l.match(RE_LI);
      if (m && m[1].length <= base + 1) { items.push([m[3]]); continue; }
      if (items.length) items[items.length - 1].push(l.replace(/\t/g, "    ").replace(strip, ""));
    }
    const body = items.map(([head, ...rest]) => {
      const task = head.match(/^\[( |x|X)\]\s+(.*)$/);
      const label = task ? `${task[1].trim() ? "☑" : "☐"} ${mdInline(task[2])}` : mdInline(head);
      return `<li>${label}${rest.join("").trim() ? mdBlocks(rest) : ""}</li>`;
    }).join("");
    return ordered ? `<ol${start !== 1 ? ` start="${start}"` : ""}>${body}</ol>` : `<ul>${body}</ul>`;
  }

  function mdBlocks(lines) {
    const out = [];
    let i = 0;
    const isTable = (k) => lines[k].includes("|") && k + 1 < lines.length && RE_TSEP.test(lines[k + 1]);
    const isStart = (k) => RE_FENCE.test(lines[k]) || RE_H.test(lines[k]) || RE_HR.test(lines[k]) || RE_QUOTE.test(lines[k]) || RE_LI.test(lines[k]) || isTable(k);
    while (i < lines.length) {
      const line = lines[i];
      let m;
      if (!line.trim()) { i++; continue; }
      if ((m = line.match(RE_FENCE))) {
        const fence = m[1];
        const buf = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith(fence)) buf.push(lines[i++]);
        i++;
        out.push(codeBlockHTML(buf.join("\n"), m[2]));
        continue;
      }
      if ((m = line.match(RE_H))) { const n = m[1].length; out.push(`<h${n}>${mdInline(m[2])}</h${n}>`); i++; continue; }
      if (RE_HR.test(line)) { out.push("<hr>"); i++; continue; }
      if (RE_QUOTE.test(line)) {
        const buf = [];
        while (i < lines.length && RE_QUOTE.test(lines[i])) buf.push(lines[i++].replace(/^\s{0,3}>\s?/, ""));
        out.push(`<blockquote>${mdBlocks(buf)}</blockquote>`);
        continue;
      }
      if (isTable(i)) {
        const split = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
        const head = split(line);
        const aligns = split(lines[i + 1]).map((c) => (c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : ""));
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(split(lines[i++]));
        const cell = (tag, c, k) => `<${tag}${aligns[k] ? ` style="text-align:${aligns[k]}"` : ""}>${mdInline(c)}</${tag}>`;
        out.push(`<table><thead><tr>${head.map((c, k) => cell("th", c, k)).join("")}</tr></thead><tbody>` +
          rows.map((r) => `<tr>${head.map((_, k) => cell("td", r[k] ?? "", k)).join("")}</tr>`).join("") + "</tbody></table>");
        continue;
      }
      if (RE_LI.test(line)) {
        const buf = [];
        while (i < lines.length) {
          const l = lines[i];
          if (RE_LI.test(l) || (buf.length && /^\s+\S/.test(l))) { buf.push(l); i++; continue; }
          if (!l.trim() && i + 1 < lines.length && (RE_LI.test(lines[i + 1]) || /^\s{2,}\S/.test(lines[i + 1]))) { i++; continue; }
          break;
        }
        out.push(mdList(buf));
        continue;
      }
      const buf = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !isStart(i)) buf.push(lines[i++]);
      out.push(`<p>${buf.map(mdInline).join("<br>")}</p>`);
    }
    return out.join("");
  }

  const md = (src) => (src ? mdBlocks(String(src).replace(/\r\n?/g, "\n").split("\n")) : "");

  // ==========================================================
  // Theme
  // ==========================================================
  const THEME_OPTS = [
    { v: "light", l: "亮色", icon: "sun", d: "日光纸面" },
    { v: "dark", l: "暗色", icon: "moon", d: "深空控制台" },
    { v: "system", l: "系统", icon: "monitor", d: "跟随系统" },
  ];
  const themePref = () => {
    const v = LS.get("agy.theme", "system");
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  };
  const systemTheme = () => (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  const resolvedTheme = (pref = themePref()) => (pref === "system" ? systemTheme() : pref);
  function applyTheme(pref = themePref()) {
    const theme = resolvedTheme(pref);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.content = theme === "light" ? "light dark" : "dark light";
    syncThemeBtn();
  }
  function setThemePref(pref) {
    LS.set("agy.theme", pref);
    applyTheme(pref);
    if (state.drawer === "settings") renderSettings();
  }
  function syncThemeBtn() {
    const btn = $("#btnTheme");
    if (!btn) return;
    const theme = resolvedTheme();
    const next = theme === "light" ? "dark" : "light";
    btn.title = next === "light" ? "切换到亮色" : "切换到暗色";
    btn.replaceChildren(icon(theme === "light" ? "moon" : "sun"));
  }
  function cycleThemeQuick() {
    // Quick toggle flips between light/dark (pins preference, leaves system)
    setThemePref(resolvedTheme() === "light" ? "dark" : "light");
  }
  applyTheme();
  try {
    matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
      if (themePref() === "system") applyTheme("system");
    });
  } catch { /* older browsers */ }

  // ==========================================================
  // State
  // ==========================================================
  const state = {
    health: null,
    caps: null,
    connected: false,
    models: [],
    prefs: {},
    usage: null,
    usageErr: null,
    agents: [],
    runs: [],
    model: LS.get("agy.model", null) || null,
    effort: LS.get("agy.effort", "") || "",
    agent: LS.get("agy.agent", "") || "",
    cwd: LS.get("agy.cwd", "") || "",
    recentCwds: LS.get("agy.recentCwds", []) || [],
    printTimeout: LS.get("agy.printTimeout", "") || "",
    timeoutMin: LS.get("agy.timeoutMin", "") || "",
    continueNext: false,
    convs: [],
    activeId: LS.get("agy.activeConv", null),
    live: new Map(), // conv.id -> { runId, ctrl, mode, stopping }
    search: "",
    modelFilter: "",
    drawer: null,
  };

  function loadConvs() {
    const arr = LS.get("agy.convs", []);
    if (!Array.isArray(arr)) return [];
    for (const c of arr) {
      for (const t of c.turns || []) {
        if (t.status === "running") {
          t.status = "aborted";
          t.endedAt = t.endedAt || t.startedAt;
          t.blocks = t.blocks || [];
          t.blocks.push({ kind: "system", key: uid("s"), text: "页面刷新或关闭，本次运行已中断。" });
        }
        for (const b of t.blocks || []) if (b.state === "running") b.state = "stopped";
      }
    }
    return arr;
  }
  state.convs = loadConvs();
  if (!state.convs.some((c) => c.id === state.activeId)) state.activeId = null;

  let saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 600);
  }
  function saveNow() {
    const replacer = (k, v) => (k.startsWith("_") ? undefined : typeof v === "string" && v.length > 16000 ? v.slice(0, 16000) + "\n… (truncated)" : v);
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        localStorage.setItem("agy.convs", JSON.stringify(state.convs, replacer));
        return;
      } catch {
        if (state.convs.length <= 1) return;
        const keep = [...state.convs].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, Math.max(1, Math.floor(state.convs.length * 0.7)));
        state.convs = state.convs.filter((c) => keep.includes(c));
      }
    }
  }

  const activeConv = () => state.convs.find((c) => c.id === state.activeId) || null;
  const isLive = (conv) => !!conv && state.live.has(conv.id);

  // ==========================================================
  // Models / quota helpers
  // ==========================================================
  function modelGroup(m) {
    if (m?.group) return m.group;
    const id = typeof m === "string" ? m : m?.id || "";
    if (/^gemini/i.test(id)) return "Gemini Models";
    if (/^(claude|gpt)/i.test(id)) return "Claude and GPT models";
    return "Other";
  }
  function modelLabel(id) {
    if (!id) return null;
    const m = state.models.find((x) => x.id === id);
    return m ? m.display_name || m.label || m.id : id;
  }
  function modelDotClass(id) {
    const g = modelGroup(id || "");
    if (/gemini/i.test(g)) return "g";
    if (/^gpt/i.test(id || "")) return "o";
    if (/claude/i.test(g)) return "c";
    return "";
  }
  const effectiveModel = () => state.model || state.prefs.defaultModel || null;
  const effectiveCwd = () => state.cwd || state.prefs.defaultCwd || state.health?.cwd || "";

  function bucketPct(b) {
    if (b.remainingPercent != null) return +b.remainingPercent;
    if (b.remainingFraction != null) return Math.round(b.remainingFraction * 1000) / 10;
    if (b.remaining_fraction != null) return Math.round(b.remaining_fraction * 1000) / 10;
    return null;
  }
  function bucketResetSecs(b) {
    if (b.reset_in_seconds != null) return b.reset_in_seconds;
    const rt = b.resetTime || b.reset_time;
    return rt ? Math.max(0, (new Date(rt) - Date.now()) / 1000) : null;
  }
  function groupSummary(g) {
    const buckets = g.buckets || [];
    let limiting = null;
    for (const b of buckets) {
      if (b.disabled) continue;
      const p = bucketPct(b);
      if (p == null) continue;
      if (!limiting || p < limiting.pct) limiting = { pct: p, bucket: b };
    }
    return limiting;
  }
  function quotaForGroup(name) {
    const g = state.usage?.panel?.groups?.find((x) => (x.displayName || "").toLowerCase() === String(name).toLowerCase());
    return g ? groupSummary(g) : null;
  }
  const shortGroup = (name) => (/gemini/i.test(name) ? "Gemini" : /claude|gpt/i.test(name) ? "Claude · GPT" : name);
  const levelClass = (p) => (p == null ? "" : p <= 10 ? "crit" : p <= 30 ? "warn" : "");

  // ==========================================================
  // Sidebar: conversations
  // ==========================================================
  function dayBucket(t) {
    const d = new Date(t);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = (today - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000;
    if (diff <= 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return "Previous 7 days";
    if (diff < 30) return "Previous 30 days";
    return "Older";
  }

  function renderConvList() {
    const list = $("#convList");
    list.innerHTML = "";
    const q = state.search.trim().toLowerCase();
    const convs = [...state.convs]
      .filter((c) => !q || (c.title || "").toLowerCase().includes(q) || (c.turns || []).some((t) => (t.prompt || "").toLowerCase().includes(q)))
      .sort((a, b) => b.updatedAt - a.updatedAt);
    if (!convs.length) {
      list.appendChild(h("div", { class: "conv-empty", text: q ? "没有匹配的对话" : "还没有对话。发起一个任务，Agent 的每一步都会记录在这里。" }));
      return;
    }
    let lastGroup = null;
    for (const c of convs) {
      const g = dayBucket(c.updatedAt);
      if (g !== lastGroup) {
        list.appendChild(h("div", { class: "conv-group", text: g }));
        lastGroup = g;
      }
      const last = c.turns?.[c.turns.length - 1];
      const indicator = isLive(c)
        ? h("span", { class: "spin" })
        : h("span", { class: `ci-dot ${last?.status === "error" ? "err" : last?.status === "aborted" ? "aborted" : ""}` });
      const item = h("button", {
        class: "conv-item" + (c.id === state.activeId ? " active" : ""),
        title: c.title,
        onclick: () => selectConv(c.id),
      },
        indicator,
        h("span", { class: "ci-title", text: c.title || "Untitled" }),
        h("span", {
          class: "ci-del", title: "删除对话", role: "button",
          onclick: (e) => { e.stopPropagation(); deleteConv(c.id); },
        }, icon("trash")),
      );
      list.appendChild(item);
    }
  }

  function selectConv(id) {
    state.activeId = id;
    LS.set("agy.activeConv", id);
    closePops();
    renderConvList();
    renderThread();
    if (window.innerWidth <= 900) document.body.classList.add("side-collapsed");
    $("#promptInput").focus();
  }

  function newChat() {
    state.activeId = null;
    LS.set("agy.activeConv", null);
    state.continueNext = false;
    closePops();
    renderConvList();
    renderThread();
    $("#promptInput").focus();
  }

  function deleteConv(id) {
    const c = state.convs.find((x) => x.id === id);
    if (!c) return;
    if (!confirm(`删除对话「${c.title || "Untitled"}」？`)) return;
    if (isLive(c)) stopRun(c.id, true);
    state.convs = state.convs.filter((x) => x.id !== id);
    if (state.activeId === id) state.activeId = null;
    LS.set("agy.activeConv", state.activeId);
    saveNow();
    renderConvList();
    renderThread();
  }

  // ==========================================================
  // Thread rendering
  // ==========================================================
  const threadEl = $("#thread");
  const threadInner = $("#threadInner");
  const nearBottom = () => threadEl.scrollHeight - threadEl.scrollTop - threadEl.clientHeight < 120;
  const scrollBottom = () => { threadEl.scrollTop = threadEl.scrollHeight; };

  const SUGGESTIONS = [
    { i: "folder", t: "梳理项目结构", p: "梳理当前工作目录的项目结构，说明每个模块的作用" },
    { i: "file", t: "总结 docs/API.md", p: "阅读 docs/API.md 并总结这个后端的能力" },
    { i: "terminal", t: "怎么启动服务", p: "检查 package.json 并告诉我如何启动服务" },
    { i: "git", t: "最近的提交", p: "查看最近的 git 提交记录并简要总结" },
    { i: "bot", t: "子代理并行调研", p: "用子代理分别调研 src 目录下每个文件的作用，然后汇总成一张表" },
  ];

  function heroEl() {
    return h("div", { class: "hero" },
      logoEl("hero-mark"),
      h("h1", { html: 'Ready for <span class="grad">liftoff</span>' }),
      h("p", { text: "描述一个任务，Antigravity 会自主规划、编辑文件并运行命令。" }),
      h("div", { class: "sugg-row" }, SUGGESTIONS.map((s) =>
        h("button", { class: "sugg", onclick: () => { setPrompt(s.p); } }, icon(s.i), s.t))),
    );
  }

  function renderThread() {
    const conv = activeConv();
    threadInner.innerHTML = "";
    const empty = !conv || !conv.turns.length;
    $("#main").classList.toggle("is-empty", empty);
    if (empty) threadInner.appendChild(heroEl());
    else for (const t of conv.turns) threadInner.appendChild(renderTurn(conv, t));
    renderTopbar();
    syncComposer();
    requestAnimationFrame(scrollBottom);
  }

  function renderTopbar() {
    const conv = activeConv();
    const title = $("#convTitle");
    title.value = conv?.title || "New conversation";
    title.readOnly = !conv;
    const chip = $("#convIdChip");
    if (conv?.conversationId) {
      chip.textContent = `#${shortId(conv.conversationId)}`;
      chip.classList.remove("hidden");
    } else chip.classList.add("hidden");
    document.title = conv?.title ? `${conv.title} · Antigravity` : "Antigravity Console";
  }

  function renderTurn(conv, turn) {
    const uMeta = h("div", { class: "u-meta" },
      h("span", { text: fmtTime(turn.at) }),
      turn.cwd ? h("span", { class: "mono", title: turn.cwd, text: baseName(turn.cwd) }) : null,
      h("button", { title: "复制", onclick: () => copyText(turn.prompt) }, icon("copy")),
      h("button", { title: "编辑后重新发送", onclick: () => setPrompt(turn.prompt) }, icon("edit")),
    );
    const head = h("div", { class: "a-head" });
    const blocks = h("div", { class: "a-blocks" });
    const foot = h("div", { class: "a-foot" });
    const root = h("article", { class: "turn" },
      h("div", { class: "u-msg" }, h("div", { class: "u-bubble", text: turn.prompt }), uMeta),
      h("div", { class: "a-msg" }, head, blocks, foot),
    );
    const prevTx = turn._v?.tx;
    turn._v = { conv, root, head, blocks, foot, els: new Map(), tx: new Map(), wait: null };
    if (prevTx) for (const [id, tx] of prevTx) { clearInterval(tx.timer); }
    paintHead(turn);
    for (const b of turn.blocks) paintBlock(turn, b);
    paintWait(turn);
    updateCaret(turn);
    paintFoot(turn);
    return root;
  }

  const attached = (turn) => !!turn._v && turn._v.root.isConnected;

  function paintHead(turn) {
    if (!turn._v) return;
    const v = turn._v;
    v.head.innerHTML = "";
    let st;
    if (turn.status === "running") {
      st = h("span", { class: "a-state" }, h("span", { class: "spin" }), h("span", { class: "shimmer", text: "Working" }),
        h("span", { class: "el", text: fmtDur(Date.now() - turn.startedAt) }));
    } else {
      const dur = turn.endedAt && turn.startedAt ? fmtDur(turn.endedAt - turn.startedAt) : "";
      const label = turn.status === "error" ? "Failed" : turn.status === "aborted" ? "Stopped" : "Done";
      const cls = turn.status === "error" ? "red" : turn.status === "aborted" ? "" : "green";
      st = h("span", { class: "a-state" }, h("span", { class: `tag ${cls}`, text: label }), dur ? h("span", { text: dur }) : null);
    }
    v.head.append(
      logoEl("logo"),
      h("span", { class: "a-name", text: "Antigravity" }),
      turn.model ? h("span", { class: "a-model", text: modelLabel(turn.model) }) : null,
      turn.agent ? h("span", { class: "tag violet", text: turn.agent }) : null,
      st,
    );
  }

  function paintWait(turn) {
    if (!turn._v) return;
    const v = turn._v;
    const need = turn.status === "running" && !turn.blocks.length;
    if (need && !v.wait) {
      v.wait = h("div", { class: "blk-wait" }, h("span", { class: "spin" }), h("span", { class: "shimmer", text: "Planning next steps…" }));
      v.blocks.appendChild(v.wait);
    } else if (!need && v.wait) {
      v.wait.remove();
      v.wait = null;
    }
  }

  function updateCaret(turn) {
    if (!turn._v) return;
    for (const el of $$(".md.caret", turn._v.blocks)) el.classList.remove("caret");
    if (turn.status !== "running") return;
    const last = turn.blocks[turn.blocks.length - 1];
    if (last?.kind === "text") turn._v.els.get(last.key)?.querySelector(".md")?.classList.add("caret");
  }

  function paintBlock(turn, b) {
    if (!turn._v) return;
    const v = turn._v;
    const el = buildBlock(turn, b);
    const old = v.els.get(b.key);
    if (old) old.replaceWith(el);
    else {
      if (v.wait) { v.wait.remove(); v.wait = null; }
      v.blocks.appendChild(el);
    }
    v.els.set(b.key, el);
  }

  // batched painting for streaming
  const pending = new Map(); // turn -> Set(blocks)
  let rafId = 0;
  function schedulePaint(turn, block, meta = false) {
    if (!attached(turn)) return;
    if (!pending.has(turn)) pending.set(turn, { blocks: new Set(), meta: false });
    const p = pending.get(turn);
    if (block) p.blocks.add(block);
    if (meta) p.meta = true;
    if (!rafId) rafId = requestAnimationFrame(flushPaint);
  }
  function flushPaint() {
    rafId = 0;
    const stick = nearBottom();
    for (const [turn, p] of pending) {
      if (!attached(turn)) continue;
      for (const b of p.blocks) paintBlock(turn, b);
      if (p.meta) { paintHead(turn); paintFoot(turn); }
      paintWait(turn);
      updateCaret(turn);
    }
    pending.clear();
    if (stick) scrollBottom();
  }

  function buildBlock(turn, b) {
    switch (b.kind) {
      case "text":
        return h("div", { class: "blk-text" }, h("div", { class: "md", html: md(b.text) }));
      case "tool":
        return buildTool(turn, b);
      case "subagent":
        return buildSubagent(turn, b);
      case "error":
        return h("div", { class: "blk-error" }, icon("alert"),
          h("div", { class: "be-body" }, b.text || "Error", b.code ? h("div", { class: "be-code", text: b.code }) : null));
      case "system":
        return h("div", { class: "blk-system" }, icon("info"), h("span", { text: b.text }));
      default:
        return h("div");
    }
  }

  // ---------- tools ----------
  function describeTool(name, params) {
    const n = String(name || "tool").toLowerCase();
    const p = parseMaybeJSON(params);
    const obj = p && typeof p === "object" ? p : {};
    const file = pick(obj, ["AbsolutePath", "TargetFile", "FilePath", "File", "Path", "Uri"]);
    if (n === "task_boundary") return { kind: "task" };
    if (/run_command|^shell|bash|exec/.test(n))
      return { icon: "terminal", verb: "Ran command", target: pick(obj, ["CommandLine", "Command", "cmd"]), term: true, cwd: pick(obj, ["Cwd", "WorkingDirectory"]) };
    if (/command_status|read_terminal|send_command_input/.test(n))
      return { icon: "terminal", verb: n === "send_command_input" ? "Sent input" : "Checked command", target: pick(obj, ["Input", "CommandId", "Name", "id"]) };
    if (/view_file|view_code_item|read_file|^view/.test(n)) {
      let t = file ? baseName(file) : pick(obj, ["NodePath", "NodePaths", "Symbol"]);
      const s = pick(obj, ["StartLine", "Offset"]);
      const e = pick(obj, ["EndLine"]);
      if (t && s != null) t += `#L${s}${e != null ? `-${e}` : ""}`;
      return { icon: "eye", verb: /outline/.test(n) ? "Outlined" : "Analyzed", target: t, title: file };
    }
    if (/list_dir|list_directory|^ls$/.test(n)) {
      const d = pick(obj, ["DirectoryPath", "Path", "Dir"]);
      return { icon: "folder", verb: "Listed", target: d ? baseName(d) : ".", title: d };
    }
    if (/grep|codebase_search|find_by_name|search_files|^find|glob/.test(n))
      return { icon: "search", verb: "Searched", target: pick(obj, ["Query", "Pattern", "SearchPattern", "Includes"]), title: pick(obj, ["SearchPath", "SearchDirectory", "DirectoryPath"]) };
    if (/write_to_file|create_file|write_file/.test(n))
      return { icon: "filePlus", verb: "Created", target: file && baseName(file), title: file };
    if (/replace|edit|patch/.test(n))
      return { icon: "pencil", verb: "Edited", target: file && baseName(file), title: file };
    if (/search_web|web_search/.test(n)) return { icon: "globe", verb: "Searched web", target: pick(obj, ["Query"]) };
    if (/read_url|fetch|url_content/.test(n)) return { icon: "globe", verb: "Read", target: pick(obj, ["Url"]) };
    if (/browser/.test(n)) return { icon: "globe", verb: "Browser", target: pick(obj, ["TaskName", "Task", "Url"]) };
    if (/image/.test(n)) return { icon: "image", verb: "Generated image", target: pick(obj, ["Prompt", "ImageName"]) };
    if (/notify|message_user/.test(n)) return { icon: "message", verb: "Notified", target: pick(obj, ["Message"]) };
    const firstStr = Object.values(obj).find((x) => typeof x === "string");
    return { icon: "tool", verb: humanize(name) || "Tool", target: firstStr || (typeof p === "string" ? p : null) };
  }

  function stateBadge(st) {
    if (st === "running") return h("span", { class: "bt-state" }, h("span", { class: "spin" }));
    if (st === "error") return h("span", { class: "bt-state err", title: "失败" }, icon("x"));
    if (st === "stopped") return h("span", { class: "bt-state stop", title: "已停止" }, icon("minus"));
    return h("span", { class: "bt-state ok", title: "完成" }, icon("check"));
  }

  function buildTool(turn, b) {
    const d = describeTool(b.name, b.params);
    if (d.kind === "task") return buildTask(b);
    const toggle = () => { b._open = !b._open; paintBlock(turn, b); };
    const el = h("div", { class: "blk-tool" + (b._open ? " open" : "") },
      h("button", { class: "bt-row", title: d.title || b.name || "", onclick: toggle },
        h("span", { class: "bt-ico" }, icon(d.icon)),
        h("span", { class: "bt-verb", text: d.verb }),
        d.target ? h("code", { class: "bt-target", text: oneLine(d.target, 140) }) : null,
        h("span", { class: "bt-spacer" }),
        stateBadge(b.state),
        h("span", { class: "bt-chev" }, icon("chevRight")),
      ),
    );
    if (b._open) {
      const det = h("div", { class: "bt-detail" });
      if (d.term) {
        const pre = h("pre", { class: "bt-pre term" }, h("span", { class: "prompt", text: "$ " }), String(d.target ?? ""));
        if (b.output != null) pre.append("\n\n" + pretty(b.output));
        det.append(h("div", {}, h("div", { class: "bt-label", text: d.cwd ? `Terminal · ${d.cwd}` : "Terminal" }), pre));
      } else {
        if (b.params != null) det.append(h("div", {}, h("div", { class: "bt-label", text: "Parameters" }), h("pre", { class: "bt-pre", text: pretty(b.params) })));
        if (b.output != null) det.append(h("div", {}, h("div", { class: "bt-label", text: "Output" }), h("pre", { class: "bt-pre", text: pretty(b.output) })));
      }
      if (b.error) det.append(h("div", {}, h("div", { class: "bt-label", text: "Error" }), h("pre", { class: "bt-pre err", text: pretty(b.error) })));
      det.append(h("div", {}, h("span", { class: "tag mono", text: b.name || "tool" })));
      el.appendChild(det);
    }
    return el;
  }

  function buildTask(b) {
    const p = parseMaybeJSON(b.params);
    const obj = p && typeof p === "object" ? p : {};
    const name = pick(obj, ["TaskName", "Name", "Title"]) || "Task";
    const status = pick(obj, ["TaskStatus", "Status"]);
    const summary = pick(obj, ["TaskSummary", "Summary"]);
    const mode = pick(obj, ["Mode"]);
    return h("div", { class: "blk-task" },
      h("span", { class: "bt-ico" }, icon("list")),
      h("div", { style: "flex:1;min-width:0" },
        h("div", { class: "tk-name" }, name, mode ? h("span", { class: "tag", style: "margin-left:8px", text: humanize(mode) }) : null),
        status ? h("div", { class: "tk-status", text: status }) : null,
        summary ? h("div", { class: "tk-summary", text: oneLine(summary, 400) }) : null,
      ),
      b.state === "running" ? h("span", { class: "spin" }) : null,
    );
  }

  // ---------- subagents ----------
  function buildSubagent(turn, b) {
    const subs = b.subagents || [];
    const roles = subs.map((s) => s.role || s.type_name).filter(Boolean);
    const el = h("div", { class: "blk-sub" },
      h("div", { class: "bs-head" },
        h("span", { class: "bt-ico" }, icon("bot")),
        h("b", { text: subs.length > 1 ? `${subs.length} subagents` : "Subagent" }),
        roles.length ? h("span", { class: "dim", text: oneLine(roles.join(" · "), 80) }) : null,
        h("span", { class: "bt-spacer" }),
        stateBadge(b.state),
      ),
    );
    if (!subs.length) el.appendChild(h("div", { class: "bs-item" }, h("div", { class: "bs-prompt", text: "等待子代理信息…" })));
    for (const sa of subs) {
      const id = sa.transcript_id || sa.conversation_id;
      const tx = id ? turn._v?.tx.get(id) : null;
      const promptEl = sa.initial_prompt ? h("div", { class: "bs-prompt", title: "点击展开", text: sa.initial_prompt }) : null;
      if (promptEl) promptEl.onclick = () => promptEl.classList.toggle("full");
      const txBtn = id ? h("button", { class: "btn sm", onclick: () => toggleTranscript(turn, id, txBtn) },
        icon("bulb"), tx?.open ? "收起思考与步骤" : "查看思考与步骤") : null;
      const item = h("div", { class: "bs-item" },
        h("div", { class: "bs-role" }, sa.role || sa.type_name || "subagent",
          sa.type_name && sa.type_name !== sa.role ? h("span", { class: "tag", text: sa.type_name }) : null),
        promptEl,
        h("div", { class: "bs-actions" },
          txBtn,
          id ? h("button", { class: "btn sm ghost", title: "全屏查看 transcript", onclick: () => openTranscriptModal(id, sa.role) }, icon("external"), "全屏") : null,
          id ? h("span", { class: "tag mono", style: "cursor:pointer", title: `${id}（点击复制）`, onclick: () => copyText(id, "已复制子代理 conversation_id") }, `#${shortId(id)}`) : null,
        ),
      );
      if (id) {
        const txState = turn._v.tx.get(id) || { open: false, el: h("div", { class: "bs-tx hidden" }), timer: null, openKeys: new Set() };
        turn._v.tx.set(id, txState);
        item.appendChild(txState.el);
      }
      el.appendChild(item);
    }
    return el;
  }

  function toggleTranscript(turn, id, btn) {
    const tx = turn._v.tx.get(id);
    if (!tx) return;
    tx.open = !tx.open;
    tx.el.classList.toggle("hidden", !tx.open);
    btn.lastChild.textContent = tx.open ? "收起思考与步骤" : "查看思考与步骤";
    clearInterval(tx.timer);
    tx.timer = null;
    if (tx.open) {
      loadTranscriptInto(id, tx);
      if (turn.status === "running") tx.timer = setInterval(() => loadTranscriptInto(id, tx), 4000);
    }
  }

  async function loadTranscriptInto(id, tx) {
    if (!tx.el.childElementCount) tx.el.appendChild(h("div", { class: "loading-line" }, h("span", { class: "spin" }), "读取 transcript…"));
    for (const d of $$("details[data-k]", tx.el)) (d.open ? tx.openKeys.add(d.dataset.k) : tx.openKeys.delete(d.dataset.k));
    try {
      const data = await api(`/v1/transcripts/${encodeURIComponent(id)}?limit=500`, { timeoutMs: 20000 });
      tx.el.replaceChildren(renderTranscript(data, tx.openKeys));
    } catch (err) {
      const msg = err.status === 404 ? "Transcript 尚未生成（子代理可能刚启动），稍后自动重试。" : `读取失败：${err.message}`;
      tx.el.replaceChildren(h("div", { class: "tx-empty", text: msg }));
    }
  }

  function renderTranscript(data, openKeys = new Set()) {
    const steps = data.steps || [];
    const wrap = h("div", { class: "tx" });
    const thinkCount = steps.filter((s) => s.thinking).length;
    wrap.appendChild(h("div", { class: "tx-meta" },
      h("span", { text: `${steps.length} steps` }),
      thinkCount ? h("span", { class: "tag violet" }, icon("bulb"), `${thinkCount} thoughts`) : null,
      data.path ? h("span", { class: "mono", title: data.path, text: baseName(data.path) === "transcript.jsonl" ? `…/${shortId(data.conversation_id)}/transcript.jsonl` : data.path }) : null,
    ));
    if (!steps.length) {
      wrap.appendChild(h("div", { class: "tx-empty", text: "暂无步骤" }));
      return wrap;
    }
    steps.forEach((s, idx) => {
      const k = `${s.step_index ?? idx}`;
      const isModel = /planner|model|response|assistant/i.test(`${s.type || ""} ${s.source || ""}`);
      const step = h("div", { class: `tx-step${s.error ? " err" : isModel ? " model" : ""}` });
      step.appendChild(h("div", { class: "tx-head" },
        h("span", { text: `#${s.step_index ?? idx + 1}` }),
        h("span", { class: "tx-type", text: humanize(s.type) || "Step" }),
        s.source ? h("span", { text: humanize(s.source) }) : null,
        s.status ? h("span", { class: `tag ${/error|fail/i.test(s.status) ? "red" : /done|success|complete/i.test(s.status) ? "green" : ""}`, text: humanize(s.status) }) : null,
        s.created_at ? h("span", { text: fmtTime(s.created_at) }) : null,
      ));
      if (s.thinking) {
        const d = h("details", { class: "tx-think", "data-k": `t${k}` },
          h("summary", {}, icon("bulb"), h("span", { text: "Thought" }), h("span", { class: "prev", text: oneLine(s.thinking, 140) })),
          h("div", { class: "think-body", text: s.thinking }));
        if (openKeys.has(`t${k}`)) d.open = true;
        step.appendChild(d);
      }
      if (s.content != null && s.content !== "") {
        const c = parseMaybeJSON(s.content);
        const text = typeof c === "string" ? c : pick(c, ["text", "content", "message"]);
        step.appendChild(typeof text === "string"
          ? h("div", { class: "tx-content md", html: md(text.length > 20000 ? text.slice(0, 20000) + "\n…" : text) })
          : h("pre", { class: "bt-pre", text: pretty(c) }));
      }
      const calls = Array.isArray(s.tool_calls) ? s.tool_calls : s.tool_calls ? [s.tool_calls] : [];
      if (calls.length) {
        const box = h("div", { class: "tx-calls" });
        calls.forEach((tc, j) => {
          const name = tc?.name || tc?.tool_name || tc?.function?.name || "tool";
          const args = tc?.args ?? tc?.arguments ?? tc?.parameters ?? tc?.function?.arguments ?? tc?.input;
          const argStr = args == null ? "" : typeof args === "string" ? args : JSON.stringify(args);
          const d = h("details", { class: "tx-call", "data-k": `c${k}-${j}` },
            h("summary", {}, icon(describeTool(name, args).icon || "tool"), h("code", { text: name }), h("span", { class: "prev", text: oneLine(argStr, 120) })),
            h("pre", { class: "bt-pre", text: pretty(args) }));
          if (openKeys.has(`c${k}-${j}`)) d.open = true;
          box.appendChild(d);
        });
        step.appendChild(box);
      }
      if (s.error) step.appendChild(h("div", { class: "tx-err", text: pretty(s.error) }));
      wrap.appendChild(step);
    });
    return wrap;
  }

  async function openTranscriptModal(id, title) {
    const body = h("div", {}, h("div", { class: "loading-line" }, h("span", { class: "spin" }), "读取 transcript…"));
    openModal(title ? `Transcript · ${title}` : `Transcript · #${shortId(id)}`, body);
    try {
      const data = await api(`/v1/transcripts/${encodeURIComponent(id)}?limit=2000`, { timeoutMs: 30000 });
      body.replaceChildren(renderTranscript(data));
    } catch (err) {
      body.replaceChildren(h("div", { class: "loading-line err", text: err.status === 404 ? `未找到 transcript：${err.data?.path || id}` : `读取失败：${err.message}` }));
    }
  }

  // ---------- footer ----------
  function paintFoot(turn) {
    if (!turn._v) return;
    const v = turn._v;
    v.foot.innerHTML = "";
    if (turn.status === "running") {
      if (turn.stderr) v.foot.appendChild(stderrBox(turn));
      return;
    }
    const u = turn.usage || {};
    const parts = [];
    if (u.input_tokens != null) parts.push(h("span", { class: "mono", title: "input tokens" }, `↑ ${fmtNum(u.input_tokens)}`));
    if (u.output_tokens != null) parts.push(h("span", { class: "mono", title: "output tokens" }, `↓ ${fmtNum(u.output_tokens)}`));
    if (u.thinking_tokens) parts.push(h("span", { class: "mono", title: "thinking tokens（CLI 不提供主代理思考文本，仅统计数量；子代理思考见 transcript）" }, `✦ ${fmtNum(u.thinking_tokens)} think`));
    if (u.cache_read_tokens) parts.push(h("span", { class: "mono", title: "cache read tokens" }, `⟲ ${fmtNum(u.cache_read_tokens)} cached`));
    const text = turn.blocks.filter((b) => b.kind === "text").map((b) => b.text).join("\n\n") || turn.response || "";
    const items = [];
    for (const p of parts) items.push(p, h("span", { class: "sep" }));
    if (turn.status_text && turn.status_text !== "SUCCESS") items.push(h("span", { class: "tag", text: turn.status_text }), h("span", { class: "sep" }));
    if (items.length) items.pop();
    v.foot.append(...items, h("span", { class: "grow" }));
    if (text) v.foot.appendChild(h("button", { class: "f-btn", title: "复制回复", onclick: () => copyText(text) }, icon("copy"), "Copy"));
    if (turn.status !== "done") v.foot.appendChild(h("button", { class: "f-btn", title: "用相同提示重试", onclick: () => retryTurn(v.conv, turn) }, icon("rotate"), "Retry"));
    if (turn.stderr) v.foot.appendChild(stderrBox(turn));
  }

  function stderrBox(turn) {
    const d = h("details", { class: "stderr-box" },
      h("summary", {}, icon("terminal"), `诊断输出 · ${fmtNum(turn.stderr.length)} chars`),
      h("pre", { class: "bt-pre", text: turn.stderr.slice(-12000) }));
    d.open = !!turn._stderrOpen;
    d.addEventListener("toggle", () => { turn._stderrOpen = d.open; });
    return d;
  }

  // elapsed ticker
  setInterval(() => {
    for (const conv of state.convs) {
      if (!isLive(conv)) continue;
      const turn = conv.turns[conv.turns.length - 1];
      const el = turn?._v?.head.querySelector(".el");
      if (el) el.textContent = fmtDur(Date.now() - turn.startedAt);
    }
  }, 1000);

  // ==========================================================
  // Running agents
  // ==========================================================
  function upsertBlock(turn, key, kind, fn) {
    let b = turn.blocks.find((x) => x.key === key);
    if (!b) {
      b = { kind, key };
      turn.blocks.push(b);
    }
    fn(b);
    schedulePaint(turn, b);
    return b;
  }

  function normState(s, fallback = "running") {
    const t = String(s || "").toLowerCase();
    if (!t) return fallback;
    if (/error|fail|cancel|abort/.test(t)) return "error";
    if (/done|complete|success|finish|^ok$/.test(t)) return "done";
    return "running";
  }

  function setPrompt(text) {
    const input = $("#promptInput");
    input.value = text;
    autoGrow();
    syncComposer();
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  async function send(promptOverride) {
    const input = $("#promptInput");
    const prompt = (promptOverride ?? input.value).trim();
    if (!prompt) return;
    let conv = activeConv();
    if (conv && isLive(conv)) return toast("当前对话仍在运行，先停止或新建对话", true);
    if (!conv) {
      conv = { id: uid("c_"), title: oneLine(prompt, 60), conversationId: null, createdAt: Date.now(), updatedAt: Date.now(), turns: [] };
      state.convs.push(conv);
      state.activeId = conv.id;
      LS.set("agy.activeConv", conv.id);
    }
    if (promptOverride == null) { input.value = ""; autoGrow(); }

    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const turn = {
      id: uid("t_"), prompt, at: Date.now(), startedAt: Date.now(), endedAt: null,
      status: "running", model: effectiveModel(), effort: state.effort || null, agent: state.agent || null,
      cwd: state.cwd || null, runId, blocks: [], usage: null, response: null, stderr: "",
    };
    conv.turns.push(turn);
    conv.updatedAt = Date.now();

    const payload = { prompt, run_id: runId };
    if (state.model) payload.model = state.model;
    if (state.effort) payload.effort = state.effort;
    if (state.agent) payload.agent = state.agent;
    if (state.cwd) payload.cwd = state.cwd;
    if (conv.conversationId) payload.conversation_id = conv.conversationId;
    else if (state.continueNext) { payload.continue = true; state.continueNext = false; renderAdvChip(); }
    if (state.printTimeout) payload.print_timeout = state.printTimeout;
    if (+state.timeoutMin > 0) payload.timeout_ms = Math.round(+state.timeoutMin * 60000);

    const live = { runId, ctrl: new AbortController(), mode: cfg.stream ? "stream" : "sync", stopping: false };
    state.live.set(conv.id, live);

    renderConvList();
    if (conv.id === state.activeId) {
      if ($("#main").classList.contains("is-empty")) renderThread();
      else { threadInner.appendChild(renderTurn(conv, turn)); renderTopbar(); syncComposer(); }
      scrollBottom();
    }
    scheduleSave();
    setTimeout(loadRuns, 800);

    try {
      if (live.mode === "stream") await runStream(conv, turn, payload, live);
      else await runSync(conv, turn, payload, live);
    } catch (err) {
      if (err.name === "AbortError" || live.stopping) finishTurn(conv, turn, "aborted");
      else finishTurn(conv, turn, "error", { message: err.message, code: err.code, detail: err.detail });
    }
    if (turn.status === "running") finishTurn(conv, turn, live.stopping ? "aborted" : "error", live.stopping ? undefined : { message: "连接意外中断（未收到 done 事件）" });
  }

  async function runStream(conv, turn, payload, live) {
    const res = await fetch(apiUrl("/v1/agent/stream"), {
      method: "POST",
      headers: headers(true),
      body: JSON.stringify(payload),
      signal: live.ctrl.signal,
    });
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      throw apiError(res, data);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let m;
      while ((m = buf.match(/\r?\n\r?\n/))) {
        const block = buf.slice(0, m.index);
        buf = buf.slice(m.index + m[0].length);
        let ev = "message";
        const data = [];
        for (const line of block.split(/\r?\n/)) {
          if (line.startsWith("event:")) ev = line.slice(6).trim();
          else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
        }
        if (!data.length) continue;
        let obj;
        try { obj = JSON.parse(data.join("\n")); } catch { continue; }
        onStreamEvent(conv, turn, live, ev, obj);
      }
    }
  }

  function onStreamEvent(conv, turn, live, ev, d) {
    const type = ev !== "message" ? ev : d.type;
    const si = d.step_index;
    switch (type) {
      case "run_started":
        if (d.run_id) live.runId = turn.runId = d.run_id;
        if (d.cwd) turn.cwd = d.cwd;
        if (d.model) turn.model = d.model;
        schedulePaint(turn, null, true);
        break;
      case "init":
        if (d.conversation_id) setConversationId(conv, d.conversation_id);
        if (d.model && !turn.model) turn.model = d.model;
        break;
      case "text_delta": {
        const last = turn.blocks[turn.blocks.length - 1];
        const key = si != null ? `t${si}` : last?.kind === "text" ? last.key : uid("t");
        upsertBlock(turn, key, "text", (b) => {
          const delta = d.text_delta ?? "";
          b.text = b.text || "";
          if (b.text && delta.length > b.text.length && delta.startsWith(b.text)) b.text = delta;
          else b.text += delta;
        });
        break;
      }
      case "tool": {
        const info = d.tool_info || {};
        upsertBlock(turn, si != null ? `x${si}` : uid("x"), "tool", (b) => {
          b.name = d.tool_name || info.name || b.name;
          if (info.parameters != null) b.params = info.parameters;
          if (info.output != null) b.output = info.output;
          if (info.error != null) b.error = info.error;
          b.state = info.error ? "error" : normState(d.state, b.state || "running");
        });
        break;
      }
      case "subagent":
        upsertBlock(turn, si != null ? `s${si}` : uid("s"), "subagent", (b) => {
          const map = new Map((b.subagents || []).map((s) => [s.conversation_id || s.role, s]));
          for (const s of d.subagents || []) map.set(s.conversation_id || s.role, { ...(map.get(s.conversation_id || s.role) || {}), ...s });
          b.subagents = [...map.values()];
          b.state = normState(d.state, b.state || "running");
        });
        break;
      case "error_message":
        upsertBlock(turn, si != null ? `e${si}` : uid("e"), "error", (b) => { b.text = d.message || d.text_delta || "Model error"; });
        break;
      case "system":
        if (d.text_delta) upsertBlock(turn, si != null ? `y${si}` : uid("y"), "system", (b) => { b.text = d.text_delta; });
        break;
      case "stderr":
        turn.stderr = (turn.stderr + (d.text || "")).slice(-40000);
        schedulePaint(turn, null, true);
        break;
      case "result":
        if (d.conversation_id) setConversationId(conv, d.conversation_id);
        if (d.response != null) turn.response = d.response;
        if (d.usage) turn.usage = d.usage;
        if (d.status) turn.status_text = d.status;
        if (d.error) upsertBlock(turn, "result-error", "error", (b) => { b.text = typeof d.error === "string" ? d.error : pretty(d.error); });
        break;
      case "run_finished":
        if (d.usage && !turn.usage) turn.usage = d.usage;
        if (d.response && !turn.response) turn.response = d.response;
        break;
      case "done":
        if (d.conversation_id) setConversationId(conv, d.conversation_id);
        if (d.usage) turn.usage = d.usage;
        if (d.response != null) turn.response = d.response;
        if (d.model) turn.model = d.model;
        if (d.status) turn.status_text = d.status;
        finishTurn(conv, turn, "done");
        break;
      case "error": {
        const r = d.result || {};
        if (r.conversation_id) setConversationId(conv, r.conversation_id);
        if (r.usage) turn.usage = r.usage;
        if (r.response) turn.response = r.response;
        if (d.code === "AGY_ABORTED" || live.stopping) finishTurn(conv, turn, "aborted");
        else finishTurn(conv, turn, "error", { message: d.message, code: d.code, stderr: r.stderr });
        break;
      }
      default:
        break;
    }
    scheduleSave();
  }

  async function runSync(conv, turn, payload, live) {
    const data = await api("/v1/agent", { method: "POST", body: payload, timeoutMs: 0, signal: live.ctrl.signal });
    if (data.conversation_id) setConversationId(conv, data.conversation_id);
    turn.usage = data.usage || null;
    turn.response = data.response ?? null;
    if (data.model) turn.model = data.model;
    if (data.run_id) turn.runId = data.run_id;
    if (data.status) turn.status_text = data.status;
    if (data.stderr) turn.stderr = data.stderr;
    finishTurn(conv, turn, "done");
  }

  function setConversationId(conv, id) {
    if (!id || conv.conversationId === id) return;
    conv.conversationId = id;
    if (conv.id === state.activeId) renderTopbar();
  }

  function finishTurn(conv, turn, status, err) {
    if (turn.status !== "running") return;
    turn.status = status;
    turn.endedAt = Date.now();
    for (const b of turn.blocks) {
      if ((b.kind === "tool" || b.kind === "subagent") && b.state === "running") b.state = status === "done" ? "done" : "stopped";
    }
    if (!turn.blocks.some((b) => b.kind === "text") && turn.response) turn.blocks.push({ kind: "text", key: "final", text: turn.response });
    if (err) {
      turn.blocks.push({ kind: "error", key: uid("e"), text: err.message || "请求失败", code: err.code });
      const extra = err.stderr || err.detail?.stderr;
      if (extra && !turn.stderr.includes(extra)) turn.stderr += (turn.stderr ? "\n" : "") + extra;
    }
    if (status === "aborted" && !turn.blocks.some((b) => b.kind === "system" && /停止/.test(b.text))) {
      turn.blocks.push({ kind: "system", key: uid("y"), text: "已停止本次运行。" });
    }
    state.live.delete(conv.id);
    conv.updatedAt = Date.now();

    if (attached(turn)) {
      const stick = nearBottom();
      for (const b of turn.blocks) paintBlock(turn, b);
      paintHead(turn);
      paintWait(turn);
      updateCaret(turn);
      paintFoot(turn);
      for (const [id, tx] of turn._v.tx) {
        clearInterval(tx.timer);
        tx.timer = null;
        if (tx.open) loadTranscriptInto(id, tx);
      }
      if (stick) scrollBottom();
    }
    renderConvList();
    syncComposer();
    saveNow();
    clearTimeout(finishTurn.t);
    finishTurn.t = setTimeout(() => { loadUsage(false); loadRuns(); }, 1500);
    if (status === "done" && document.hidden) toast(`「${oneLine(conv.title, 30)}」已完成`);
  }

  async function stopRun(convId, silent = false) {
    const live = state.live.get(convId);
    if (!live || live.stopping) return;
    live.stopping = true;
    syncComposer();
    if (live.mode === "stream" && live.runId) {
      try {
        const r = await api("/v1/agent/abort", { method: "POST", body: { run_id: live.runId }, timeoutMs: 8000 });
        if (!r.ok && !silent) toast(`后端未找到该 run（${r.error || "unknown"}），已断开连接`, true);
      } catch (err) {
        if (!silent) toast(`中止请求失败：${err.message}，已断开连接`, true);
      }
      setTimeout(() => { if (state.live.get(convId) === live) live.ctrl.abort(); }, 3000);
    } else {
      live.ctrl.abort();
      if (!silent) toast("同步模式只能断开请求；后端进程可在 设置 → 进行中的任务 里终止", true);
    }
  }

  function retryTurn(conv, turn) {
    if (!conv || isLive(conv)) return;
    if (conv.id !== state.activeId) selectConv(conv.id);
    send(turn.prompt);
  }

  // ==========================================================
  // Composer
  // ==========================================================
  const promptInput = $("#promptInput");
  function autoGrow() {
    promptInput.style.height = "auto";
    promptInput.style.height = Math.min(promptInput.scrollHeight, 240) + "px";
  }

  function syncComposer() {
    const conv = activeConv();
    const live = conv ? state.live.get(conv.id) : null;
    const btn = $("#sendBtn");
    btn.innerHTML = "";
    $("#composer").classList.toggle("running", !!live);
    if (live) {
      btn.className = "send-btn stop";
      btn.title = live.stopping ? "正在停止…" : "停止 (Esc)";
      btn.disabled = live.stopping;
      btn.appendChild(live.stopping ? h("span", { class: "spin" }) : icon("stop"));
    } else {
      btn.className = "send-btn";
      btn.title = "发送 (Enter)";
      btn.disabled = !promptInput.value.trim();
      btn.appendChild(icon("arrowUp"));
    }
    promptInput.placeholder = live
      ? "Agent 正在运行… 可以新建对话并行执行其它任务"
      : conv?.conversationId ? "继续这个对话…" : "Ask anything, or describe a task for the agent…";
  }

  // ---------- popovers ----------
  const POPS = ["cwdPop", "agentPop", "advPop", "effortPop", "modelPop"];
  const POP_CHIP = { cwdPop: "cwdChip", agentPop: "agentChip", advPop: "advChip", effortPop: "effortChip", modelPop: "modelChip" };
  const POP_RENDER = { cwdPop: renderCwdPop, agentPop: renderAgentPop, advPop: renderAdvPop, effortPop: renderEffortPop, modelPop: renderModelPop };

  function togglePop(id) {
    const el = $(`#${id}`);
    const willOpen = el.classList.contains("hidden");
    closePops();
    if (!willOpen) return;
    POP_RENDER[id]();
    el.classList.remove("hidden");
    $(`#${POP_CHIP[id]}`).classList.add("on");
    const focusable = $("input", el);
    if (focusable) setTimeout(() => focusable.focus(), 20);
  }
  function closePops() {
    for (const id of POPS) {
      $(`#${id}`).classList.add("hidden");
      $(`#${POP_CHIP[id]}`).classList.remove("on");
    }
  }
  const popOpen = () => POPS.some((id) => !$(`#${id}`).classList.contains("hidden"));

  // model
  function renderModelChip() {
    const id = effectiveModel();
    const label = state.model ? modelLabel(state.model) : id ? `${modelLabel(id)}` : state.models.length ? "Default model" : state.connected ? "Default model" : "Loading…";
    $("#modelLabel").textContent = label;
    $("#modelDot").className = `model-dot ${modelDotClass(id)}`;
    const q = id ? quotaForGroup(modelGroup(state.models.find((m) => m.id === id) || id)) : null;
    $("#modelChip").title = `模型：${id || "agy 默认"}${state.model ? "" : "（服务器默认）"}${q ? ` · 组额度剩余 ${q.pct}%` : ""}`;
  }

  function renderModelPop() {
    const pop = $("#modelPop");
    pop.innerHTML = "";
    if (state.models.length > 7) {
      const input = h("input", { type: "text", placeholder: "搜索模型", value: state.modelFilter });
      input.addEventListener("input", () => { state.modelFilter = input.value; renderModelList(list); });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { const first = $(".pop-item[data-id]", list); if (first) first.click(); }
      });
      pop.appendChild(h("div", { class: "pop-search" }, icon("search"), input));
    }
    const list = h("div");
    pop.appendChild(list);
    renderModelList(list);
  }

  function renderModelList(list) {
    list.innerHTML = "";
    const q = state.modelFilter.trim().toLowerCase();
    const def = state.prefs.defaultModel;
    if (!q) {
      list.appendChild(h("button", { class: "pop-item" + (!state.model ? " sel" : ""), onclick: () => selectModel(null) },
        h("span", { class: "model-dot" }),
        h("div", { class: "pi-main" }, h("div", { class: "pi-label", text: "Server default" }), h("div", { class: "pi-sub", text: def ? modelLabel(def) : "由 agy 决定" })),
        h("span", { class: "pi-check" }, icon("check"))));
    }
    if (!state.models.length) {
      list.appendChild(h("div", { class: "pop-note", text: state.connected ? "未获取到模型列表（agy models 返回为空）" : "后端未连接" }));
      return;
    }
    const groups = new Map();
    for (const m of state.models) {
      if (q && !`${m.id} ${m.label || ""}`.toLowerCase().includes(q)) continue;
      const g = modelGroup(m);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(m);
    }
    const order = ["Gemini Models", "Claude and GPT models"];
    const names = [...groups.keys()].sort((a, b) => ((order.indexOf(a) + 1) || 9) - ((order.indexOf(b) + 1) || 9));
    for (const g of names) {
      const qs = quotaForGroup(g);
      const reset = qs ? bucketResetSecs(qs.bucket) : null;
      list.appendChild(h("div", { class: "pop-title" }, h("span", { text: g }),
        qs ? h("span", { class: `q ${levelClass(qs.pct)}`, title: reset != null ? `resets in ${fmtSecs(reset)}` : "" }, qs.pct <= 0 ? `额度耗尽 · ${fmtSecs(reset)}` : `${qs.pct}% left`) : null));
      for (const m of groups.get(g)) {
        const isDef = m.id === def;
        const star = h("span", { class: "pi-star" + (isDef ? " on" : ""), role: "button", title: isDef ? "当前服务器默认模型" : "设为服务器默认模型" }, icon("star"));
        star.onclick = (e) => { e.stopPropagation(); if (!isDef) setServerPrefs({ defaultModel: m.id }, `默认模型已设为 ${m.label || m.id}`); };
        list.appendChild(h("button", { class: "pop-item" + (m.id === state.model ? " sel" : "") + (qs && qs.pct <= 0 ? " dim" : ""), "data-id": m.id, onclick: () => selectModel(m.id) },
          h("span", { class: `model-dot ${modelDotClass(m.id)}` }),
          h("div", { class: "pi-main" }, h("div", { class: "pi-label", text: m.display_name || m.label || m.id }), h("div", { class: "pi-sub", text: m.id })),
          star,
          h("span", { class: "pi-check" }, icon("check"))));
      }
    }
    if (!names.length) list.appendChild(h("div", { class: "pop-note", text: "没有匹配的模型" }));
  }

  function selectModel(id) {
    state.model = id;
    LS.set("agy.model", id);
    renderModelChip();
    closePops();
  }

  // effort
  const EFFORTS = [
    { v: "", l: "Auto", d: "使用服务器默认 effort" },
    { v: "low", l: "Low", d: "最快，最省额度" },
    { v: "medium", l: "Medium", d: "速度与质量平衡" },
    { v: "high", l: "High", d: "更深入的推理与规划" },
    { v: "max", l: "Max", d: "最大推理预算，适合复杂任务" },
  ];
  function renderEffortChip() {
    const e = EFFORTS.find((x) => x.v === state.effort) || EFFORTS[0];
    const label = e.v ? e.l : state.prefs.defaultEffort ? `Auto · ${state.prefs.defaultEffort}` : "Auto";
    $("#effortLabel").textContent = label;
    $("#effortChip").classList.toggle("set", !!state.effort);
  }
  function renderEffortPop() {
    const pop = $("#effortPop");
    pop.innerHTML = "";
    pop.appendChild(h("div", { class: "pop-title", text: "Reasoning effort" }));
    for (const e of EFFORTS) {
      pop.appendChild(h("button", {
        class: "pop-item" + (state.effort === e.v ? " sel" : ""),
        onclick: () => { state.effort = e.v; LS.set("agy.effort", e.v); renderEffortChip(); closePops(); },
      }, h("div", { class: "pi-main" }, h("div", { class: "pi-label", text: e.v ? e.l : `Auto${state.prefs.defaultEffort ? ` (${state.prefs.defaultEffort})` : ""}` }), h("div", { class: "pi-desc", text: e.d })),
      h("span", { class: "pi-check" }, icon("check"))));
    }
  }

  // agent
  async function loadAgents() {
    try {
      const cwd = effectiveCwd();
      const data = await api(`/v1/agents${cwd ? `?cwd=${encodeURIComponent(cwd)}` : ""}`, { timeoutMs: 10000 });
      state.agents = data.agents || [];
    } catch {
      state.agents = [];
    }
    if (state.agent && !state.agents.some((a) => a.id === state.agent || a.name === state.agent)) {
      /* keep selection; it may exist in a different cwd */
    }
    renderAgentChip();
    if (!$("#agentPop").classList.contains("hidden")) renderAgentPop();
  }
  function renderAgentChip() {
    const a = state.agents.find((x) => x.id === state.agent);
    $("#agentLabel").textContent = state.agent ? a?.name || state.agent : "Default agent";
    $("#agentChip").classList.toggle("set", !!state.agent);
    $("#agentChip").title = state.agent ? `Agent：${state.agent}` : "Agent：内置默认";
  }
  function renderAgentPop() {
    const pop = $("#agentPop");
    pop.innerHTML = "";
    const refresh = h("button", { class: "icon-btn sm", title: "刷新", onclick: (e) => { e.stopPropagation(); loadAgents(); } }, icon("refresh"));
    pop.appendChild(h("div", { class: "pop-title" }, h("span", { text: "Agents" }), refresh));
    const list = state.agents.length ? state.agents : [{ id: "default", name: "Default agent", description: "Built-in Antigravity default agent", scope: "builtin" }];
    for (const a of list) {
      const val = a.id === "default" ? "" : a.id;
      pop.appendChild(h("button", {
        class: "pop-item" + (state.agent === val ? " sel" : ""),
        onclick: () => { state.agent = val; LS.set("agy.agent", val); renderAgentChip(); closePops(); },
      },
      h("div", { class: "pi-main" },
        h("div", { class: "pi-label" }, a.name || a.id, " ", h("span", { class: `tag ${a.scope === "workspace" ? "blue" : a.scope === "global" ? "violet" : ""}`, text: a.scope || "custom" })),
        a.description ? h("div", { class: "pi-desc", text: a.description }) : null),
      h("span", { class: "pi-check" }, icon("check"))));
    }
    pop.appendChild(h("div", { class: "pop-note", html: `自定义 agent：<code>.agents/agents/&lt;name&gt;/agent.md</code>（工作区）或 <code>~/.gemini/config/agents</code>（全局）` }));
  }

  // cwd
  function renderCwdChip() {
    const cwd = effectiveCwd();
    $("#cwdLabel").textContent = cwd ? baseName(cwd) : "Workspace";
    $("#cwdChip").classList.toggle("set", !!state.cwd);
    $("#cwdChip").title = `工作目录：${cwd || "（服务启动目录）"}${state.cwd ? "" : "（默认）"}`;
  }
  function applyCwd(val) {
    state.cwd = (val || "").trim();
    LS.set("agy.cwd", state.cwd);
    if (state.cwd) {
      state.recentCwds = [state.cwd, ...state.recentCwds.filter((x) => x !== state.cwd)].slice(0, 8);
      LS.set("agy.recentCwds", state.recentCwds);
    }
    renderCwdChip();
    loadAgents();
  }
  function renderCwdPop() {
    const pop = $("#cwdPop");
    pop.innerHTML = "";
    const def = state.prefs.defaultCwd || state.health?.cwd || "";
    const input = h("input", { class: "field mono", type: "text", placeholder: def || "D:\\your\\project", value: state.cwd, spellcheck: "false" });
    const apply = () => { applyCwd(input.value); closePops(); };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } });
    pop.appendChild(h("div", { class: "pop-title", text: "工作目录 (cwd)" }));
    pop.appendChild(h("div", { class: "pop-form" },
      input,
      h("div", { class: "row" },
        h("button", { class: "btn sm primary", onclick: apply }, "应用"),
        h("button", { class: "btn sm", title: "写入服务器 prefs.defaultCwd", onclick: () => { const v = input.value.trim(); if (!v) return toast("请输入路径", true); setServerPrefs({ defaultCwd: v }, "默认工作目录已保存"); applyCwd(""); closePops(); } }, "设为默认"),
        state.cwd ? h("button", { class: "btn sm ghost", onclick: () => { applyCwd(""); closePops(); } }, "清除") : null,
      )));
    pop.appendChild(h("div", { class: "pop-note", text: `留空则使用默认：${def || "服务启动目录"}` }));
    if (state.recentCwds.length) {
      pop.appendChild(h("div", { class: "pop-sep" }));
      pop.appendChild(h("div", { class: "pop-title", text: "最近使用" }));
      for (const p of state.recentCwds) {
        pop.appendChild(h("button", { class: "pop-item" + (p === state.cwd ? " sel" : ""), title: p, onclick: () => { applyCwd(p); closePops(); } },
          icon("folder"), h("div", { class: "pi-main" }, h("div", { class: "pi-label", text: baseName(p) }), h("div", { class: "pi-sub", text: p })),
          h("span", { class: "pi-check" }, icon("check"))));
      }
    }
  }

  // advanced
  function renderAdvChip() {
    const set = state.continueNext || !cfg.stream || state.printTimeout || +state.timeoutMin > 0;
    $("#advChip").classList.toggle("set", !!set);
  }
  function switchRow(label, desc, checked, onchange, disabled) {
    const input = h("input", { type: "checkbox", checked, disabled });
    input.addEventListener("change", () => onchange(input.checked));
    return h("label", { class: "switch-row", style: disabled ? "opacity:.45;cursor:default" : null },
      h("div", { class: "sr-main" }, h("div", { text: label }), desc ? h("div", { class: "sr-desc", text: desc }) : null),
      h("span", { class: "toggle" }, input, h("span")));
  }
  function renderAdvPop() {
    const pop = $("#advPop");
    pop.innerHTML = "";
    const conv = activeConv();
    const canContinue = !conv?.conversationId;
    pop.appendChild(h("div", { class: "pop-title", text: "运行选项" }));
    pop.appendChild(switchRow("接续上次 CLI 会话", canContinue ? "下一条消息带 --continue（仅新对话）" : "当前对话已绑定 conversation_id", state.continueNext && canContinue,
      (v) => { state.continueNext = v; renderAdvChip(); }, !canContinue));
    pop.appendChild(switchRow("流式输出 (SSE)", "关闭后改用同步 /v1/agent，一次性返回", cfg.stream,
      (v) => { cfg.stream = v; LS.set("agy.stream", v); renderAdvChip(); }));
    const pt = h("input", { class: "field mono", type: "text", placeholder: "如 10m / 0", value: state.printTimeout });
    pt.addEventListener("change", () => { state.printTimeout = pt.value.trim(); LS.set("agy.printTimeout", state.printTimeout); renderAdvChip(); });
    const tm = h("input", { class: "field mono", type: "number", min: "0", step: "1", placeholder: "0 = 不限", value: state.timeoutMin });
    tm.addEventListener("change", () => { state.timeoutMin = tm.value.trim(); LS.set("agy.timeoutMin", state.timeoutMin); renderAdvChip(); });
    pop.appendChild(h("div", { class: "pop-sep" }));
    pop.appendChild(h("div", { class: "pop-form" },
      h("label", {}, "agy --print-timeout", pt),
      h("label", {}, "后端进程超时（分钟）", tm)));
  }

  // ==========================================================
  // Health / models / prefs / runs / caps
  // ==========================================================
  async function loadHealth() {
    try {
      const hl = await api("/health", { timeoutMs: 8000 });
      const wasDown = !state.connected;
      state.health = hl;
      state.connected = true;
      if (hl.prefs) state.prefs = hl.prefs;
      $("#connDot").className = "conn-dot ok";
      $("#connText").textContent = `Connected · v${hl.version || "?"}`;
      renderAccountChip(hl.account);
      renderCwdChip();
      renderEffortChip();
      renderModelChip();
      if (wasDown) {
        loadModels();
        loadAgents();
        loadUsage(false);
        loadCaps();
        loadRuns();
      }
    } catch (err) {
      state.connected = false;
      $("#connDot").className = "conn-dot err";
      $("#connText").textContent = err.status === 401 ? "API Key 无效" : "后端未连接";
      renderModelChip();
    }
    $("#connUrl").textContent = baseUrl().replace(/^https?:\/\//, "");
  }

  async function loadModels() {
    try {
      const data = await api("/v1/models", { timeoutMs: 70000 });
      state.models = data.data || [];
      if (data.default_model !== undefined) state.prefs.defaultModel = data.default_model;
    } catch (err) {
      state.models = [];
      if (state.connected) toast(`模型列表加载失败：${err.message}`, true);
    }
    renderModelChip();
    if (!$("#modelPop").classList.contains("hidden")) renderModelPop();
  }

  async function setServerPrefs(patch, okMsg) {
    try {
      const r = await api("/v1/prefs", { method: "PUT", body: patch, timeoutMs: 10000 });
      state.prefs = r.prefs || { ...state.prefs, ...patch };
      toast(okMsg || "已保存");
      renderModelChip();
      renderEffortChip();
      renderCwdChip();
      if (!$("#modelPop").classList.contains("hidden")) renderModelPop();
      if (state.drawer === "settings") renderSettings();
      return true;
    } catch (err) {
      toast(`保存失败：${err.message}`, true);
      return false;
    }
  }

  async function loadCaps() {
    try { state.caps = await api("/v1/capabilities", { timeoutMs: 8000 }); } catch { state.caps = null; }
    if (state.drawer === "settings") renderSettings();
  }

  async function loadRuns() {
    if (!state.connected) return;
    try {
      const data = await api("/v1/runs", { timeoutMs: 8000 });
      state.runs = data.runs || [];
    } catch {
      state.runs = [];
    }
    const n = state.runs.length;
    $("#runsPill").classList.toggle("hidden", !n);
    $("#runsCount").textContent = n;
    if (state.drawer === "settings") renderRunsList();
  }

  // ==========================================================
  // Quota
  // ==========================================================
  async function loadUsage(force) {
    if (state.drawer === "quota" && force) $("#quotaBody").replaceChildren(h("div", { class: "loading-line" }, h("span", { class: "spin" }), "刷新中…"));
    try {
      state.usage = await api(`/v1/usage${force ? "?refresh=1" : ""}`, { timeoutMs: 60000 });
      state.usageErr = null;
    } catch (err) {
      state.usageErr = err.message;
    }
    renderQMeter();
    renderModelChip();
    if (state.drawer === "quota") renderQuota();
  }

  function renderQMeter() {
    const btn = $("#quotaBtn");
    btn.innerHTML = "";
    const groups = state.usage?.panel?.groups || [];
    if (!groups.length) {
      btn.appendChild(h("span", { class: "qm-empty" }, state.usageErr ? "Quotas · —" : "Quotas"));
      btn.title = state.usageErr ? `配额加载失败：${state.usageErr}` : "Model Quotas";
      return;
    }
    const tips = [];
    for (const g of groups) {
      const s = groupSummary(g);
      const pct = s?.pct;
      btn.appendChild(h("span", { class: "qm" },
        h("span", { class: "qm-name", text: shortGroup(g.displayName) }),
        h("span", { class: "qm-bar" }, h("i", { class: levelClass(pct), style: `width:${pct == null ? 0 : Math.max(2, Math.min(100, pct))}%` })),
        h("span", { class: "qm-pct", text: pct == null ? "—" : `${Math.round(pct)}%` })));
      tips.push(`${g.displayName}: ${pct == null ? "—" : `${pct}%`}${s ? ` (${s.bucket.displayName})` : ""}`);
    }
    btn.title = tips.join("\n");
  }

  function bucketEl(b) {
    const pct = bucketPct(b);
    const secs = bucketResetSecs(b);
    const resetIn = b.resetsIn || (secs != null ? fmtSecs(secs) : "");
    const rt = b.resetTime || b.reset_time;
    return h("div", { class: "q-bucket" + (b.disabled ? " disabled" : "") },
      h("div", { class: "qb-head" },
        h("span", {}, b.displayName || b.display_name || b.bucketId, b.disabled ? h("span", { class: "tag", style: "margin-left:8px", text: "受周额度限制" }) : null),
        h("span", { class: "qb-pct", text: pct == null ? "—" : `${pct}%` })),
      h("div", { class: "qb-bar" }, h("div", { class: `qb-fill ${levelClass(pct)}`, style: `width:${pct == null ? 0 : Math.max(0, Math.min(100, pct))}%` })),
      h("div", { class: "qb-sub" },
        h("span", { text: resetIn ? `Resets in ${resetIn}` : "" }),
        h("span", { text: rt ? fmtDateTime(rt) : "" })),
      b.description && !b.disabled ? h("div", { class: "qb-desc", text: b.description }) : null);
  }

  function renderQuota() {
    const body = $("#quotaBody");
    const data = state.usage;
    if (!data) {
      body.replaceChildren(state.usageErr
        ? h("div", { class: "loading-line err", text: `加载失败：${state.usageErr}` })
        : h("div", { class: "loading-line" }, h("span", { class: "spin" }), "加载中…"));
      return;
    }
    $("#quotaTitle").textContent = data.panel?.title || "Model Quotas";
    $("#quotaDesc").textContent = data.panel?.description || "";
    const frag = document.createDocumentFragment();
    if (data.stale || state.usageErr) {
      frag.appendChild(h("div", { class: "blk-error", style: "margin-bottom:16px" }, icon("alert"),
        h("div", { class: "be-body", text: state.usageErr ? `刷新失败：${state.usageErr}（显示的是旧数据）` : "刷新失败，显示的是缓存数据" })));
    }
    const groups = data.panel?.groups || [];
    if (groups.length) {
      for (const g of groups) {
        const s = groupSummary(g);
        frag.appendChild(h("div", { class: "card q-group" },
          h("h3", {}, h("span", { class: `model-dot ${/gemini/i.test(g.displayName) ? "g" : "c"}` }), g.displayName,
            s && s.pct <= 0 ? h("span", { class: "tag red", text: "Exhausted" }) : null),
          g.description ? h("div", { class: "g-desc", text: g.description }) : null,
          (g.buckets || []).map(bucketEl)));
      }
    } else if (data.quota && Object.keys(data.quota).length) {
      frag.appendChild(h("div", { class: "card q-group" }, Object.entries(data.quota).map(([id, q]) => bucketEl({
        bucketId: id, displayName: q.display_name || id, remainingFraction: q.remaining_fraction,
        resetTime: q.reset_time, reset_in_seconds: q.reset_in_seconds, disabled: q.disabled,
      }))));
    } else {
      frag.appendChild(h("div", { class: "loading-line", text: "无配额数据" }));
    }

    if (data.credits?.available) {
      frag.appendChild(h("div", { class: "section", style: "margin-top:22px" },
        h("div", { class: "section-title", text: "AI Credits" }),
        h("div", { class: "card" }, h("div", { class: "stat" }, h("div", { class: "s-label", text: "Balance" }), h("div", { class: "s-val", text: String(data.credits.balance ?? "—") })))));
    }

    const loc = data.local;
    if (loc) {
      const today = loc.today || {};
      const total = loc.total || {};
      const sec = h("div", { class: "section", style: "margin-top:22px" },
        h("div", { class: "section-title" }, h("span", { text: "本地统计" }), h("span", { class: "tag", text: "via agy-auto" })),
        h("div", { class: "stat-grid" },
          h("div", { class: "stat" }, h("div", { class: "s-label", text: "今日请求" }), h("div", { class: "s-val", text: fmtNum(today.requests || 0) }),
            h("div", { class: "s-sub", text: `↑${fmtNum(today.input_tokens || 0)} ↓${fmtNum(today.output_tokens || 0)}` })),
          h("div", { class: "stat" }, h("div", { class: "s-label", text: "今日 tokens" }), h("div", { class: "s-val", text: fmtNum(today.total_tokens || 0) }),
            h("div", { class: "s-sub", text: `think ${fmtNum(today.thinking_tokens || 0)}` })),
          h("div", { class: "stat" }, h("div", { class: "s-label", text: "累计请求" }), h("div", { class: "s-val", text: fmtNum(total.requests || 0) }),
            h("div", { class: "s-sub", text: `cache ${fmtNum(total.cache_read_tokens || 0)}` })),
          h("div", { class: "stat" }, h("div", { class: "s-label", text: "累计 tokens" }), h("div", { class: "s-val", text: fmtNum(total.total_tokens || 0) }),
            h("div", { class: "s-sub", text: `↑${fmtNum(total.input_tokens || 0)} ↓${fmtNum(total.output_tokens || 0)}` }))));
      const recent = (loc.recent || []).slice(0, 8);
      if (recent.length) {
        sec.appendChild(h("div", { class: "recent-list" }, recent.map((r) =>
          h("div", { class: "recent-row", title: r.conversation_id || "" },
            h("span", { class: "r-time", text: fmtDateTime(r.at) }),
            h("span", { class: "r-model", text: r.model ? modelLabel(r.model) : "default" }),
            h("span", { class: "r-tok", text: `${fmtNum(r.usage?.total_tokens || 0)} tok` })))));
      }
      frag.appendChild(sec);
    }
    body.replaceChildren(frag);

    const foot = $("#quotaFoot");
    foot.innerHTML = "";
    if (data.email) foot.appendChild(h("span", { text: data.email }));
    if (data.plan_tier) foot.appendChild(h("span", { text: `Plan ${data.plan_tier}` }));
    if (data.fetchedAt) foot.appendChild(h("span", { text: `更新于 ${fmtTime(data.fetchedAt)}` }));
    if (data.cached) foot.appendChild(h("span", { text: data.stale ? "缓存（刷新失败）" : "缓存" }));
  }

  // ==========================================================
  // Accounts
  // ==========================================================
  function renderAccountChip(account) {
    const email = account?.email || (account?.accountType ? `(${account.accountType})` : null);
    $("#accountEmail").textContent = email || "未登录";
    $("#avatarLetter").textContent = (account?.email || account?.activeProfile || "?")[0].toUpperCase();
    $("#accountChip").title = account ? `${account.email || ""}\nprofile: ${account.activeProfile || "—"}` : "账号管理";
  }

  let acctTab = "oauth";
  async function renderAccounts() {
    const body = $("#accountBody");
    body.replaceChildren(h("div", { class: "loading-line" }, h("span", { class: "spin" }), "加载中…"));
    let data;
    try {
      data = await api("/v1/accounts", { timeoutMs: 15000 });
    } catch (err) {
      body.replaceChildren(h("div", { class: "loading-line err", text: `加载失败：${err.message}` }));
      return;
    }
    const w = data.whoami || {};
    renderAccountChip(w);
    const frag = document.createDocumentFragment();

    frag.appendChild(h("div", { class: "section" },
      h("div", { class: "section-title", text: "当前登录" }),
      h("div", { class: "card acct-now" },
        h("span", { class: "avatar lg", text: (w.email || w.activeProfile || "?")[0].toUpperCase() }),
        h("div", { class: "meta" },
          h("strong", { text: w.email || "未登录" }),
          h("div", { class: "tags" },
            h("span", { class: "tag blue", text: `profile · ${w.activeProfile || "—"}` }),
            w.accountType ? h("span", { class: "tag", text: w.accountType }) : null,
            h("span", { class: `tag ${w.wincredExists ? "green" : "red"}`, text: `WinCred ${w.wincredExists ? "✓" : "✗"}` }))))));

    const list = h("div");
    if (!data.accounts?.length) list.appendChild(h("div", { class: "empty-note", text: "还没有保存的 profile。先把当前登录保存一个吧。" }));
    for (const a of data.accounts || []) {
      list.appendChild(h("div", { class: "acct-item" + (a.active ? " active" : "") },
        h("span", { class: "avatar", text: (a.email || a.name || "?")[0].toUpperCase() }),
        h("div", { class: "grow" },
          h("div", { class: "name" }, a.name,
            h("span", { class: "tag", text: a.type || "oauth" }),
            a.active ? h("span", { class: "tag blue", text: "active" }) : null),
          a.email ? h("div", { class: "mail", text: a.email }) : null,
          a.note ? h("div", { class: "note", text: a.note }) : null,
          a.savedAt ? h("div", { class: "mail", text: `saved ${fmtDateTime(a.savedAt)}` }) : null),
        h("button", { class: "btn sm" + (a.active ? "" : " primary"), disabled: a.active, onclick: () => switchAccount(a.name) }, a.active ? "Active" : "Switch"),
        h("button", { class: "icon-btn sm", title: "删除 profile", onclick: () => deleteAccount(a.name) }, icon("trash"))));
    }
    frag.appendChild(h("div", { class: "section" }, h("div", { class: "section-title", text: `Saved profiles · ${data.accounts?.length || 0}` }), list));

    const form = h("div", { class: "form-grid" });
    const tabs = h("div", { class: "tabs" },
      h("button", { class: acctTab === "oauth" ? "on" : "", onclick: () => { acctTab = "oauth"; renderAccounts(); } }, "保存当前登录"),
      h("button", { class: acctTab === "apikey" ? "on" : "", onclick: () => { acctTab = "apikey"; renderAccounts(); } }, "API Key"));
    const name = h("input", { class: "field", placeholder: "profile 名称，如 work" });
    const note = h("input", { class: "field", placeholder: "备注（可选）" });
    const key = h("input", { class: "field mono", type: "password", placeholder: "AIza…", autocomplete: "off" });
    form.append(h("label", {}, "名称", name));
    if (acctTab === "apikey") form.append(h("label", {}, "API Key", key));
    form.append(h("label", {}, "备注", note));
    form.append(h("div", { class: "form-actions" },
      h("span", { class: "grow", text: acctTab === "apikey" ? "保存后会立即切换到该 API Key 账号" : "把当前 live 登录快照保存为命名 profile" }),
      h("button", { class: "btn primary", onclick: () => saveAccount(name.value, note.value, acctTab === "apikey" ? key.value : null) }, acctTab === "apikey" ? "保存并切换" : "Save")));
    frag.appendChild(h("div", { class: "section" }, h("div", { class: "section-title", text: "添加 profile" }), h("div", { class: "card" }, tabs, form)));

    frag.appendChild(h("div", { class: "section" },
      h("div", { class: "section-title", text: "登录新的 Google 账号" }),
      h("div", { class: "card" },
        h("ol", { class: "steps", html: "<li>先把当前登录保存成 profile（上方 Save）</li><li>点击下方 <b>Clear live login</b></li><li>在终端运行 <code>agy</code> 完成浏览器登录</li><li>回到这里，把新登录 Save 为新的 profile</li>" }),
        h("button", { class: "btn danger", onclick: clearLive }, icon("trash"), "Clear live login"))));

    body.replaceChildren(frag);
  }

  async function switchAccount(name) {
    try {
      const r = await api("/v1/accounts/switch", { method: "POST", body: { name }, timeoutMs: 30000 });
      toast(`已切换到 ${r.name}${r.email ? `（${r.email}）` : ""}`);
      renderAccounts();
      loadHealth();
      loadModels();
      loadUsage(true);
    } catch (err) {
      toast(`切换失败：${err.message}`, true);
    }
  }
  async function deleteAccount(name) {
    if (!confirm(`确定删除 profile「${name}」？（不影响当前 live 登录）`)) return;
    try {
      await api(`/v1/accounts/${encodeURIComponent(name)}`, { method: "DELETE", timeoutMs: 15000 });
      toast(`已删除 ${name}`);
      renderAccounts();
    } catch (err) {
      toast(`删除失败：${err.message}`, true);
    }
  }
  async function saveAccount(name, note, apiKey) {
    name = (name || "").trim();
    if (!name) return toast("请输入 profile 名称", true);
    const body = { name };
    if (note?.trim()) body.note = note.trim();
    if (apiKey != null) {
      if (!apiKey.trim()) return toast("请输入 API Key", true);
      body.type = "apikey";
      body.api_key = apiKey.trim();
    }
    try {
      await api("/v1/accounts/save", { method: "POST", body, timeoutMs: 20000 });
      toast(apiKey != null ? `已保存并切换到「${name}」` : `已保存当前登录为「${name}」`);
      renderAccounts();
      if (apiKey != null) { loadHealth(); loadUsage(true); }
    } catch (err) {
      toast(`保存失败：${err.message}`, true);
    }
  }
  async function clearLive() {
    if (!confirm("清除当前 live 登录？已保存的 profile 不会被删除。")) return;
    try {
      await api("/v1/accounts/clear-live", { method: "POST", body: {}, timeoutMs: 15000 });
      toast("已清除 live 登录，请在终端运行 agy 登录新账号后回来 Save");
      renderAccounts();
      loadHealth();
    } catch (err) {
      toast(`清除失败：${err.message}`, true);
    }
  }

  // ==========================================================
  // Settings
  // ==========================================================
  const CAP_LABELS = {
    model_quotas_panel: "官方配额面板",
    model_selector: "模型切换",
    account_switch: "多账号切换",
    auto_approve: "强制自动同意",
    streaming_steps: "流式步骤 (SSE)",
    subagent_events: "子代理事件",
    subagent_thinking_via_transcript: "子代理思考（transcript）",
    main_agent_thinking_stream: "主代理独立思考流",
    ai_credits_balance: "AI Credits 余额",
    interactive_agents_panel_kill: "单独终止某个子代理",
  };

  function renderSettings() {
    const body = $("#settingsBody");
    const frag = document.createDocumentFragment();

    // appearance
    const pref = themePref();
    const seg = h("div", { class: "theme-seg", role: "radiogroup", "aria-label": "主题" });
    for (const o of THEME_OPTS) {
      seg.appendChild(h("button", {
        class: `theme-opt${pref === o.v ? " active" : ""}`,
        type: "button",
        role: "radio",
        "aria-checked": pref === o.v ? "true" : "false",
        "data-v": o.v,
        title: o.d,
        onclick: () => setThemePref(o.v),
      }, h("div", { class: "theme-swatch", "aria-hidden": "true" }), icon(o.icon), h("span", { class: "t-label", text: o.l })));
    }
    frag.appendChild(h("div", { class: "section" },
      h("div", { class: "section-title", text: "外观" }),
      h("div", { class: "card form-grid" },
        h("label", {}, "主题", seg, h("span", { class: "hint", text: pref === "system" ? `当前跟随系统 · ${resolvedTheme() === "light" ? "亮色" : "暗色"}` : "偏好保存在本机浏览器" })))));

    // connection
    const urlIn = h("input", { class: "field mono", placeholder: defaultBase, value: cfg.base });
    const keyIn = h("input", { class: "field mono", type: "password", placeholder: "未设置 AGY_API_KEY 时留空", value: cfg.apiKey, autocomplete: "off" });
    const saveConn = () => {
      cfg.base = urlIn.value.trim().replace(/\/+$/, "");
      cfg.apiKey = keyIn.value.trim();
      LS.set("agy.base", cfg.base);
      LS.set("agy.apiKey", cfg.apiKey);
      state.connected = false;
      toast("连接设置已保存");
      loadHealth();
    };
    frag.appendChild(h("div", { class: "section" },
      h("div", { class: "section-title", text: "连接" }),
      h("div", { class: "card form-grid" },
        h("label", {}, "Backend URL", urlIn, h("span", { class: "hint", text: `留空 = 当前页面同源（${defaultBase}）` })),
        h("label", {}, "API Key", keyIn, h("span", { class: "hint", text: "以 Authorization: Bearer 发送，仅保存在本机浏览器" })),
        h("div", { class: "form-actions" },
          h("span", { class: "grow" }, h("span", { class: `conn-dot ${state.connected ? "ok" : "err"}`, style: "display:inline-block;margin-right:8px" }), state.connected ? "已连接" : "未连接"),
          h("button", { class: "btn primary", onclick: saveConn }, "保存并重连")))));

    // prefs
    const p = state.prefs || {};
    const mSel = h("select", { class: "field" }, h("option", { value: "", text: "（agy 默认）" }),
      state.models.map((m) => h("option", { value: m.id, text: `${m.label || m.id}` })));
    mSel.value = p.defaultModel || "";
    if (p.defaultModel && !state.models.some((m) => m.id === p.defaultModel)) mSel.appendChild(h("option", { value: p.defaultModel, text: p.defaultModel }));
    mSel.value = p.defaultModel || "";
    const eSel = h("select", { class: "field" }, EFFORTS.map((e) => h("option", { value: e.v, text: e.v ? e.l : "（agy 默认）" })));
    eSel.value = p.defaultEffort || "";
    const cIn = h("input", { class: "field mono", placeholder: state.health?.cwd || "D:\\your\\project", value: p.defaultCwd || "" });
    frag.appendChild(h("div", { class: "section" },
      h("div", { class: "section-title", text: "服务器默认偏好 · /v1/prefs" }),
      h("div", { class: "card form-grid" },
        h("label", {}, "默认模型", mSel),
        h("label", {}, "默认 effort", eSel),
        h("label", {}, "默认工作目录", cIn, h("span", { class: "hint", text: `为空时使用服务启动目录：${state.health?.cwd || "—"}` })),
        h("div", { class: "form-actions" },
          h("span", { class: "grow", text: p.updatedAt ? `更新于 ${fmtDateTime(p.updatedAt)}` : "" }),
          h("button", {
            class: "btn primary",
            onclick: () => setServerPrefs({ defaultModel: mSel.value || null, defaultEffort: eSel.value || null, defaultCwd: cIn.value.trim() || null }, "默认偏好已保存"),
          }, "保存")))));

    // runs
    frag.appendChild(h("div", { class: "section" },
      h("div", { class: "section-title" }, h("span", { text: "进行中的任务 · /v1/runs" }), h("button", { class: "btn sm ghost", onclick: loadRuns }, icon("refresh"), "刷新")),
      h("div", { id: "runsList" })));

    // transcript lookup
    const txIn = h("input", { class: "field mono", placeholder: "conversation_id 或 file:// log_uri" });
    const openTx = () => { const v = txIn.value.trim(); if (v) openTranscriptModal(v); };
    txIn.addEventListener("keydown", (e) => { if (e.key === "Enter") openTx(); });
    frag.appendChild(h("div", { class: "section" },
      h("div", { class: "section-title", text: "Transcript 查看器" }),
      h("div", { class: "card form-grid" },
        h("div", { class: "pop-form", style: "padding:0" }, h("div", { class: "row" }, txIn, h("button", { class: "btn", onclick: openTx }, "打开"))),
        h("span", { class: "hint", text: "读取 brain/<id>/.system_generated/logs/transcript.jsonl，子代理步骤里通常带 thinking 文本" }))));

    // capabilities
    const caps = state.caps?.official_parity;
    const capList = h("div", { class: "cap-list" });
    if (caps) {
      for (const [k, v] of Object.entries(caps)) {
        const kind = v === true ? "yes" : v === false ? "no" : /partial/i.test(String(v)) ? "part" : "yes";
        capList.appendChild(h("div", { class: "cap-row" },
          h("span", { class: `cap-ico ${kind}` }, icon(kind === "no" ? "x" : kind === "part" ? "minus" : "check")),
          h("span", { class: "c-name", text: CAP_LABELS[k] || humanize(k) }),
          typeof v === "string" ? h("span", { class: "c-val", text: v }) : null));
      }
    } else capList.appendChild(h("div", { class: "empty-note", text: state.connected ? "加载中…" : "后端未连接" }));
    const thinkNote = state.health?.capabilities?.thinking?.note;
    frag.appendChild(h("div", { class: "section" },
      h("div", { class: "section-title", text: "能力 · /v1/capabilities" }),
      h("div", { class: "card" }, capList, thinkNote ? h("div", { class: "hint", style: "font-size:11.5px;color:var(--text-faint);margin-top:10px;line-height:1.5", text: thinkNote }) : null)));

    // about
    const hl = state.health;
    if (hl) {
      frag.appendChild(h("div", { class: "section" },
        h("div", { class: "section-title", text: "关于" }),
        h("div", { class: "card" }, h("dl", { class: "kv" },
          h("dt", { text: "Service" }), h("dd", { text: `${hl.service || "agy-auto"} v${hl.version || "?"}` }),
          h("dt", { text: "agy" }), h("dd", { text: hl.agy || "—" }),
          h("dt", { text: "Server cwd" }), h("dd", { text: hl.cwd || "—" }),
          h("dt", { text: "Permission" }), h("dd", { text: hl.flag || (hl.autoApprove ? "auto-approve" : "—") }),
          h("dt", { text: "Endpoints" }), h("dd", { text: String(state.caps?.endpoints?.length ?? "—") })))));
    }

    body.replaceChildren(frag);
    renderRunsList();
  }

  function renderRunsList() {
    const box = $("#runsList");
    if (!box) return;
    box.innerHTML = "";
    if (!state.runs.length) {
      box.appendChild(h("div", { class: "empty-note", text: "当前没有进行中的 agy 进程" }));
      return;
    }
    for (const r of state.runs) {
      const owner = state.convs.find((c) => state.live.get(c.id)?.runId === r.run_id);
      box.appendChild(h("div", { class: "run-row" },
        h("span", { class: "spin" }),
        h("div", { class: "grow" },
          h("div", { class: "rid", text: owner ? owner.title : r.run_id }),
          h("div", { class: "rsub", text: `${owner ? r.run_id + " · " : ""}pid ${r.pid ?? "—"} · 已运行 ${fmtDur(Date.now() - r.startedAt)}` })),
        h("button", {
          class: "btn sm danger",
          onclick: async () => {
            if (owner) return stopRun(owner.id);
            try {
              const res = await api("/v1/agent/abort", { method: "POST", body: { run_id: r.run_id }, timeoutMs: 8000 });
              toast(res.ok ? "已发送终止信号" : `终止失败：${res.error}`, !res.ok);
            } catch (err) { toast(`终止失败：${err.message}`, true); }
            setTimeout(loadRuns, 1200);
          },
        }, "Abort")));
    }
  }

  // ==========================================================
  // Drawers / modal
  // ==========================================================
  function openDrawer(name) {
    closePops();
    for (const d of ["quota", "account", "settings"]) $(`#${d}Drawer`).classList.toggle("hidden", d !== name);
    $("#mask").classList.remove("hidden");
    state.drawer = name;
    if (name === "quota") { renderQuota(); loadUsage(false); }
    if (name === "account") renderAccounts();
    if (name === "settings") { renderSettings(); loadRuns(); if (!state.caps) loadCaps(); }
  }
  function closeDrawers() {
    for (const d of ["quota", "account", "settings"]) $(`#${d}Drawer`).classList.add("hidden");
    $("#mask").classList.add("hidden");
    state.drawer = null;
  }
  function openModal(title, content) {
    $("#modalTitle").textContent = title;
    $("#modalBody").replaceChildren(content);
    $("#modalWrap").classList.remove("hidden");
  }
  function closeModal() {
    $("#modalWrap").classList.add("hidden");
    $("#modalBody").innerHTML = "";
  }

  // ==========================================================
  // Events
  // ==========================================================
  hydrateIcons();

  $("#sendBtn").onclick = () => {
    const conv = activeConv();
    if (conv && isLive(conv)) stopRun(conv.id);
    else send();
  };
  promptInput.addEventListener("input", () => { autoGrow(); syncComposer(); });
  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      const conv = activeConv();
      if (!(conv && isLive(conv))) send();
    }
  });

  $("#btnNewChat").onclick = newChat;
  $("#btnCollapse").onclick = () => document.body.classList.add("side-collapsed");
  $("#btnExpand").onclick = () => document.body.classList.remove("side-collapsed");
  $("#convSearch").addEventListener("input", (e) => { state.search = e.target.value; renderConvList(); });

  const title = $("#convTitle");
  const commitTitle = () => {
    const conv = activeConv();
    if (!conv) return;
    const v = title.value.trim();
    if (v && v !== conv.title) { conv.title = v; scheduleSave(); renderConvList(); renderTopbar(); }
    else title.value = conv.title;
  };
  title.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); title.blur(); } if (e.key === "Escape") { title.value = activeConv()?.title || ""; title.blur(); } });
  title.addEventListener("blur", commitTitle);
  $("#convIdChip").onclick = () => { const c = activeConv(); if (c?.conversationId) copyText(c.conversationId, "已复制 conversation_id"); };

  for (const id of POPS) {
    $(`#${POP_CHIP[id]}`).addEventListener("click", (e) => { e.stopPropagation(); togglePop(id); });
    $(`#${id}`).addEventListener("click", (e) => e.stopPropagation());
  }
  document.addEventListener("click", () => closePops());

  $("#quotaBtn").onclick = () => openDrawer("quota");
  $("#accountChip").onclick = () => openDrawer("account");
  $("#btnTheme").onclick = cycleThemeQuick;
  $("#btnSettings").onclick = () => openDrawer("settings");
  $("#runsPill").onclick = () => openDrawer("settings");
  $("#connBox").onclick = () => openDrawer("settings");
  $("#mask").onclick = closeDrawers;
  for (const b of $$("[data-close]")) b.onclick = closeDrawers;
  $("#quotaRefresh").onclick = () => loadUsage(true);
  $("#accountRefresh").onclick = renderAccounts;
  $("#modalClose").onclick = closeModal;
  $("#modalWrap").addEventListener("click", (e) => { if (e.target.id === "modalWrap") closeModal(); });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".cb-copy");
    if (!btn) return;
    const code = btn.closest(".codeblock")?.querySelector("code")?.textContent || "";
    copyText(code, "代码已复制");
  });

  threadEl.addEventListener("scroll", () => $("#main").classList.toggle("scrolled", threadEl.scrollTop > 4), { passive: true });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); newChat(); return; }
    if (e.key === "Escape") {
      if (!$("#modalWrap").classList.contains("hidden")) return closeModal();
      if (popOpen()) return closePops();
      if (state.drawer) return closeDrawers();
      const conv = activeConv();
      if (conv && isLive(conv) && document.activeElement === promptInput) stopRun(conv.id);
      return;
    }
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) { e.preventDefault(); promptInput.focus(); }
  });

  window.addEventListener("beforeunload", (e) => {
    saveNow();
    if (state.live.size) { e.preventDefault(); e.returnValue = ""; }
  });

  // ==========================================================
  // Boot
  // ==========================================================
  if (window.innerWidth <= 900) document.body.classList.add("side-collapsed");
  renderConvList();
  renderThread();
  renderCwdChip();
  renderEffortChip();
  renderAgentChip();
  renderModelChip();
  renderAdvChip();
  renderQMeter();
  autoGrow();
  loadHealth();
  setInterval(loadHealth, 30000);
  setInterval(loadRuns, 15000);
  setInterval(() => { if (!document.hidden && state.connected) loadUsage(false); }, 5 * 60000);
})();
