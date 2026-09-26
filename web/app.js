/* Antigravity Console — frontend for agy-auto backend (docs/API.md) */
(() => {
  "use strict";

  const BASE = `${location.protocol}//${location.host}`;
  const $ = (sel) => document.querySelector(sel);

  // ---------- state ----------
  const state = {
    health: null,
    models: [],
    defaultModel: null,
    model: localStorage.getItem("agy.model") || null,
    effort: localStorage.getItem("agy.effort") || "",
    conversationId: null,
    sending: false,
    history: JSON.parse(localStorage.getItem("agy.history") || "[]"),
  };

  // ---------- helpers ----------
  async function api(path, { method = "GET", body, timeoutMs = 660000 } = {}) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error?.message || `${res.status} ${res.statusText}`;
        const err = new Error(msg);
        err.code = data?.error?.code;
        err.detail = data?.error?.result;
        throw err;
      }
      return data;
    } finally {
      clearTimeout(t);
    }
  }

  function toast(msg, isErr = false) {
    const el = document.createElement("div");
    el.className = "toast" + (isErr ? " err" : "");
    el.textContent = msg;
    $("#toastWrap").appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  function fmtTokens(u) {
    if (!u) return null;
    const parts = [];
    if (u.input_tokens != null) parts.push(`in ${u.input_tokens}`);
    if (u.output_tokens != null) parts.push(`out ${u.output_tokens}`);
    if (u.thinking_tokens) parts.push(`think ${u.thinking_tokens}`);
    if (u.total_tokens != null) parts.push(`total ${u.total_tokens}`);
    return parts.length ? parts.join(" · ") : null;
  }

  function fmtReset(b) {
    if (b.resetsIn) return `reset in ${b.resetsIn}`;
    if (b.reset_in_seconds != null) {
      const s = b.reset_in_seconds;
      if (s >= 86400) return `reset in ${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
      if (s >= 3600) return `reset in ${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
      if (s >= 60) return `reset in ${Math.floor(s / 60)}m`;
      return `reset in ${s}s`;
    }
    return "";
  }

  // ---------- health / connection ----------
  async function loadHealth() {
    const dot = $("#connDot");
    try {
      const h = await api("/health", { timeoutMs: 8000 });
      state.health = h;
      dot.className = "conn-dot ok";
      $("#connText").textContent = "Connected · auto-approve";
      if (h.prefs) {
        state.defaultModel = h.prefs.defaultModel || null;
        if (h.prefs.defaultEffort && !state.effort) {
          state.effort = h.prefs.defaultEffort;
          $("#effortSelect").value = state.effort;
        }
        if (h.prefs.defaultCwd && !$("#cwdInput").value) {
          $("#cwdInput").placeholder = `工作目录（默认 ${h.prefs.defaultCwd}）`;
        }
      }
      renderAccountChip(h.account);
    } catch {
      dot.className = "conn-dot err";
      $("#connText").textContent = "后端未连接";
      renderAccountChip(null);
    }
  }

  function renderAccountChip(account) {
    const email = account?.email || (account?.accountType ? `(${account.accountType})` : null);
    $("#accountEmail").textContent = email || "未登录";
    $("#avatarLetter").textContent = (email || "?")[0].toUpperCase();
  }

  // ---------- models ----------
  async function loadModels() {
    try {
      const data = await api("/v1/models", { timeoutMs: 30000 });
      state.models = data.data || [];
      if (data.default_model) state.defaultModel = data.default_model;
      if (!state.model) state.model = state.defaultModel || state.models[0]?.id || null;
      renderModelBtn();
      renderModelMenu();
    } catch (err) {
      $("#modelName").textContent = "models 加载失败";
    }
  }

  function modelLabel(id) {
    const m = state.models.find((x) => x.id === id);
    return m ? m.label || m.id : id || "默认模型";
  }

  function renderModelBtn() {
    $("#modelName").textContent = state.model ? modelLabel(state.model) : "默认模型";
  }

  function renderModelMenu() {
    const menu = $("#modelMenu");
    menu.innerHTML = "";
    for (const m of state.models) {
      const b = document.createElement("button");
      b.className = "model-item" + (m.id === state.model ? " sel" : "");
      b.innerHTML = `
        <span class="grow">
          <div class="m-label"></div>
          <div class="m-id"></div>
        </span>
        <span class="m-check">✓</span>`;
      b.querySelector(".m-label").textContent = m.label || m.id;
      b.querySelector(".m-id").textContent = m.id;
      b.onclick = () => selectModel(m.id);
      menu.appendChild(b);
    }
  }

  async function selectModel(id) {
    state.model = id;
    localStorage.setItem("agy.model", id);
    renderModelBtn();
    renderModelMenu();
    $("#modelMenu").classList.add("hidden");
    try {
      await api("/v1/prefs", { method: "PUT", body: { defaultModel: id } });
      toast(`默认模型已设为 ${modelLabel(id)}`);
    } catch (err) {
      toast(`保存默认模型失败：${err.message}`, true);
    }
  }

  // ---------- chat ----------
  const chatList = $("#chatList");
  const chatScroll = $("#chatScroll");

  function scrollBottom() {
    chatScroll.scrollTop = chatScroll.scrollHeight;
  }

  function addMsg(role, text, meta) {
    $("#chatEmpty").classList.add("hidden");
    const el = document.createElement("div");
    el.className = `msg ${role}`;
    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.textContent = role === "user" ? "你" : "✦";
    const body = document.createElement("div");
    body.className = "msg-body";
    const roleEl = document.createElement("div");
    roleEl.className = "msg-role";
    roleEl.textContent = role === "user" ? "You" : "Antigravity";
    const textEl = document.createElement("div");
    textEl.className = "msg-text";
    textEl.textContent = text;
    body.appendChild(roleEl);
    body.appendChild(textEl);
    if (meta) {
      const metaEl = document.createElement("div");
      metaEl.className = "msg-meta";
      metaEl.innerHTML = meta;
      body.appendChild(metaEl);
    }
    el.appendChild(avatar);
    el.appendChild(body);
    chatList.appendChild(el);
    scrollBottom();
    return { el, textEl, bodyEl: body };
  }

  function addTyping() {
    const { el, bodyEl } = addMsg("assistant", "");
    bodyEl.querySelector(".msg-text").innerHTML =
      `<span class="typing"><i></i><i></i><i></i></span>`;
    return el;
  }

  async function send() {
    if (state.sending) return;
    const input = $("#promptInput");
    const prompt = input.value.trim();
    if (!prompt) return;

    state.sending = true;
    $("#sendBtn").disabled = true;
    $("#sendIco").textContent = "…";
    input.value = "";
    autoGrow();

    addMsg("user", prompt);
    const typingEl = addTyping();

    const payload = { prompt, timeout_ms: 600000 };
    const cwd = $("#cwdInput").value.trim();
    if (cwd) payload.cwd = cwd;
    if (state.model) payload.model = state.model;
    if (state.effort) payload.effort = state.effort;
    if (state.conversationId && $("#continueChk").checked) {
      payload.conversation_id = state.conversationId;
    } else if ($("#continueChk").checked && !state.conversationId) {
      payload.continue = true;
    }

    try {
      const data = await api("/v1/agent", { method: "POST", body: payload });
      state.conversationId = data.conversation_id || state.conversationId;
      const tok = fmtTokens(data.usage);
      let meta = "";
      if (data.model) meta += `<span>model <b>${escapeHtml(data.model)}</b></span>`;
      if (data.status) meta += `<span>status <b>${escapeHtml(data.status)}</b></span>`;
      if (tok) meta += `<span>tokens <b>${escapeHtml(tok)}</b></span>`;
      typingEl.remove();
      addMsg("assistant", data.response || "(空响应)", meta || undefined);
      pushHistory(prompt, data.response);
    } catch (err) {
      typingEl.remove();
      const el = addMsg("assistant", `请求失败：${err.message}` + (err.detail?.stderr ? `\n\n${err.detail.stderr.slice(0, 800)}` : ""));
      el.el.classList.add("error");
    } finally {
      state.sending = false;
      $("#sendBtn").disabled = false;
      $("#sendIco").textContent = "➤";
      input.focus();
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  // ---------- history ----------
  function pushHistory(prompt, response) {
    state.history.unshift({
      t: Date.now(),
      prompt: prompt.slice(0, 120),
      conversationId: state.conversationId,
    });
    state.history = state.history.slice(0, 30);
    localStorage.setItem("agy.history", JSON.stringify(state.history));
    renderHistory();
  }

  function renderHistory() {
    const list = $("#historyList");
    list.innerHTML = "";
    if (!state.history.length) {
      list.innerHTML = `<div class="history-empty">暂无历史对话</div>`;
      return;
    }
    for (const h of state.history) {
      const b = document.createElement("button");
      b.className = "history-item";
      b.textContent = h.prompt;
      b.title = new Date(h.t).toLocaleString();
      b.onclick = () => {
        $("#promptInput").value = h.prompt;
        if (h.conversationId) {
          state.conversationId = h.conversationId;
          $("#continueChk").checked = true;
        }
        autoGrow();
        $("#promptInput").focus();
      };
      list.appendChild(b);
    }
  }

  function newChat() {
    state.conversationId = null;
    $("#continueChk").checked = false;
    chatList.innerHTML = "";
    $("#chatEmpty").classList.remove("hidden");
    $("#promptInput").focus();
  }

  // ---------- quota drawer ----------
  async function loadQuota(refresh = false) {
    const body = $("#quotaBody");
    body.innerHTML = `<div class="loading-line">加载中…</div>`;
    try {
      const data = await api(`/v1/usage${refresh ? "?refresh=1" : ""}`, { timeoutMs: 60000 });
      renderQuota(data);
    } catch (err) {
      body.innerHTML = `<div class="loading-line" style="color:var(--red)">加载失败：${escapeHtml(err.message)}</div>`;
    }
  }

  function renderQuota(data) {
    $("#quotaTitle").textContent = data.panel?.title || "Model Quotas";
    $("#quotaDesc").textContent = data.panel?.description || "";
    const body = $("#quotaBody");
    body.innerHTML = "";

    if (data.panel?.groups?.length) {
      for (const g of data.panel.groups) {
        const gEl = document.createElement("div");
        gEl.className = "quota-group";
        const h = document.createElement("h3");
        h.textContent = g.displayName;
        const d = document.createElement("div");
        d.className = "g-desc";
        d.textContent = g.description || "";
        gEl.appendChild(h);
        gEl.appendChild(d);
        for (const b of g.buckets || []) gEl.appendChild(bucketEl(b));
        body.appendChild(gEl);
      }
    } else if (data.quota) {
      // fallback：无 panel 时用 quota map
      for (const [id, q] of Object.entries(data.quota)) {
        body.appendChild(bucketEl({
          bucketId: id,
          displayName: q.display_name || id,
          remainingFraction: q.remaining_fraction,
          resetTime: q.reset_time,
          reset_in_seconds: q.reset_in_seconds,
          disabled: q.disabled,
        }));
      }
    } else {
      body.innerHTML = `<div class="loading-line">无配额数据</div>`;
    }

    // footer
    const foot = [];
    if (data.email) foot.push(`账号 ${data.email}`);
    if (data.fetchedAt) foot.push(`更新于 ${new Date(data.fetchedAt).toLocaleTimeString()}`);
    if (data.cached) foot.push(data.stale ? "缓存（刷新失败）" : "缓存");
    $("#quotaFoot").textContent = foot.join(" · ");
  }

  function bucketEl(b) {
    const pct = b.remainingPercent != null
      ? b.remainingPercent
      : b.remainingFraction != null ? Math.round(b.remainingFraction * 1000) / 10 : null;
    const el = document.createElement("div");
    el.className = "quota-bucket" + (b.disabled ? " disabled" : "");

    const head = document.createElement("div");
    head.className = "qb-head";
    const name = document.createElement("span");
    name.textContent = b.displayName || b.bucketId;
    if (b.disabled) {
      const badge = document.createElement("span");
      badge.className = "qb-badge";
      badge.textContent = "disabled";
      name.appendChild(badge);
    }
    const pctEl = document.createElement("span");
    pctEl.className = "qb-pct";
    pctEl.textContent = pct != null ? `${pct}%` : "—";
    head.appendChild(name);
    head.appendChild(pctEl);

    const bar = document.createElement("div");
    bar.className = "qb-bar";
    const fill = document.createElement("div");
    fill.className = "qb-fill" + (pct != null && pct <= 10 ? " crit" : pct != null && pct <= 30 ? " warn" : "");
    fill.style.width = `${pct != null ? Math.max(0, Math.min(100, pct)) : 0}%`;
    bar.appendChild(fill);

    const sub = document.createElement("div");
    sub.className = "qb-sub";
    const left = document.createElement("span");
    left.textContent = fmtReset(b);
    const right = document.createElement("span");
    right.textContent = b.resetTime ? new Date(b.resetTime).toLocaleString() : "";
    sub.appendChild(left);
    sub.appendChild(right);

    el.appendChild(head);
    el.appendChild(bar);
    el.appendChild(sub);
    if (b.description && !b.disabled) {
      const desc = document.createElement("div");
      desc.className = "qb-sub";
      desc.textContent = b.description;
      el.appendChild(desc);
    }
    return el;
  }

  // ---------- account drawer ----------
  async function loadAccounts() {
    const now = $("#acctNow");
    const list = $("#acctList");
    now.innerHTML = `<div class="loading-line">加载中…</div>`;
    list.innerHTML = "";
    try {
      const data = await api("/v1/accounts", { timeoutMs: 15000 });
      const w = data.whoami || {};
      now.innerHTML = "";
      const av = document.createElement("div");
      av.className = "avatar";
      av.textContent = (w.email || "?")[0].toUpperCase();
      const meta = document.createElement("div");
      meta.className = "meta";
      const m1 = document.createElement("strong");
      m1.textContent = w.email || "未登录";
      const m2 = document.createElement("small");
      m2.textContent = `profile: ${w.activeProfile || "—"} · ${w.accountType || ""} · WinCred ${w.wincredExists ? "✓" : "✗"}`;
      meta.appendChild(m1);
      meta.appendChild(m2);
      now.appendChild(av);
      now.appendChild(meta);
      renderAccountChip(w);

      if (!data.accounts?.length) {
        list.innerHTML = `<div class="history-empty">尚无已保存 profile，先把当前登录 Save 一个吧</div>`;
        return;
      }
      for (const a of data.accounts) {
        const item = document.createElement("div");
        item.className = "acct-item" + (a.active ? " active" : "");
        const av2 = document.createElement("div");
        av2.className = "avatar";
        av2.textContent = (a.email || a.name)[0].toUpperCase();
        const grow = document.createElement("div");
        grow.className = "grow";
        const nm = document.createElement("div");
        nm.className = "name";
        nm.textContent = a.name;
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = a.type || "oauth";
        nm.appendChild(tag);
        if (a.active) {
          const t2 = document.createElement("span");
          t2.className = "tag";
          t2.textContent = "active";
          t2.style.color = "var(--accent)";
          nm.appendChild(t2);
        }
        const mail = document.createElement("div");
        mail.className = "mail";
        mail.textContent = a.email || "";
        grow.appendChild(nm);
        grow.appendChild(mail);

        const sw = document.createElement("button");
        sw.className = "btn btn-sm primary";
        sw.textContent = "Switch";
        sw.disabled = a.active;
        sw.onclick = () => switchAccount(a.name);
        const del = document.createElement("button");
        del.className = "btn btn-sm";
        del.textContent = "✕";
        del.title = "删除 profile";
        del.onclick = () => deleteAccount(a.name);

        item.appendChild(av2);
        item.appendChild(grow);
        item.appendChild(sw);
        item.appendChild(del);
        list.appendChild(item);
      }
    } catch (err) {
      now.innerHTML = `<div class="loading-line" style="color:var(--red)">加载失败：${escapeHtml(err.message)}</div>`;
    }
  }

  async function switchAccount(name) {
    try {
      const r = await api("/v1/accounts/switch", { method: "POST", body: { name }, timeoutMs: 30000 });
      toast(`已切换到 ${r.name}${r.email ? ` (${r.email})` : ""}`);
      await loadAccounts();
      loadHealth();
    } catch (err) {
      toast(`切换失败：${err.message}`, true);
    }
  }

  async function deleteAccount(name) {
    if (!confirm(`确定删除 profile「${name}」？`)) return;
    try {
      await api(`/v1/accounts/${encodeURIComponent(name)}`, { method: "DELETE", timeoutMs: 15000 });
      toast(`已删除 ${name}`);
      loadAccounts();
    } catch (err) {
      toast(`删除失败：${err.message}`, true);
    }
  }

  async function saveAccountProfile() {
    const name = $("#newAcctName").value.trim();
    if (!name) return toast("请输入 profile 名称", true);
    try {
      await api("/v1/accounts/save", { method: "POST", body: { name }, timeoutMs: 20000 });
      toast(`已保存当前登录为「${name}」`);
      $("#newAcctName").value = "";
      loadAccounts();
    } catch (err) {
      toast(`保存失败：${err.message}`, true);
    }
  }

  async function clearLive() {
    if (!confirm("清除当前 live 登录？（不会删除已保存 profile）")) return;
    try {
      await api("/v1/accounts/clear-live", { method: "POST", body: {}, timeoutMs: 15000 });
      toast("已清除 live 登录，可在终端运行 agy 登录新账号后再 Save");
      loadAccounts();
      loadHealth();
    } catch (err) {
      toast(`清除失败：${err.message}`, true);
    }
  }

  // ---------- drawers ----------
  function openDrawer(which) {
    $(`#${which}Drawer`).classList.remove("hidden");
    $(`#${which}Mask`).classList.remove("hidden");
    if (which === "quota") loadQuota(false);
    if (which === "account") loadAccounts();
  }
  function closeDrawers() {
    for (const w of ["quota", "account"]) {
      $(`#${w}Drawer`).classList.add("hidden");
      $(`#${w}Mask`).classList.add("hidden");
    }
    $("#modelMenu").classList.add("hidden");
  }

  // ---------- input auto-grow ----------
  const promptInput = $("#promptInput");
  function autoGrow() {
    promptInput.style.height = "auto";
    promptInput.style.height = Math.min(promptInput.scrollHeight, 180) + "px";
  }

  // ---------- events ----------
  $("#sendBtn").onclick = send;
  promptInput.addEventListener("input", autoGrow);
  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  $("#btnNewChat").onclick = newChat;
  $("#btnToggleSide").onclick = () => document.body.classList.toggle("side-collapsed");

  $("#modelBtn").onclick = (e) => {
    e.stopPropagation();
    $("#modelMenu").classList.toggle("hidden");
  };
  document.addEventListener("click", (e) => {
    if (!$("#modelPicker").contains(e.target)) $("#modelMenu").classList.add("hidden");
  });

  $("#effortSelect").onchange = (e) => {
    state.effort = e.target.value;
    localStorage.setItem("agy.effort", state.effort);
  };

  $("#quotaBtn").onclick = () => openDrawer("quota");
  $("#accountChip").onclick = () => openDrawer("account");
  $("#quotaMask").onclick = closeDrawers;
  $("#accountMask").onclick = closeDrawers;
  document.querySelectorAll("[data-close]").forEach((b) => (b.onclick = closeDrawers));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawers();
  });

  $("#quotaRefresh").onclick = () => loadQuota(true);
  $("#accountRefresh").onclick = loadAccounts;
  $("#btnSaveAcct").onclick = saveAccountProfile;
  $("#btnClearLive").onclick = clearLive;

  document.querySelectorAll(".sugg").forEach((b) => {
    b.onclick = () => {
      promptInput.value = b.dataset.prompt;
      autoGrow();
      promptInput.focus();
    };
  });

  // 恢复 effort 选择
  if (state.effort) $("#effortSelect").value = state.effort;

  // ---------- boot ----------
  renderHistory();
  loadHealth().then(loadModels);
  setInterval(loadHealth, 60000);
})();
