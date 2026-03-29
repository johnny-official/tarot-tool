// ===== TAROT QUICKSALE — AI CHAT (GEMINI) =====
// Paste customer messages → send to Google Gemini API → display response.
// Loads after orders.js, before ui.js.

(function () {
  "use strict";
  const T = window.TQS;

  const GEMINI_MODEL = "gemini-2.5-flash";
  const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    GEMINI_MODEL +
    ":generateContent";

  const DEFAULT_MAX_HISTORY = 5;

  // ===== SYSTEM PROMPT =====
  function buildSystemPrompt() {
    return [
      "Bạn là trợ lý AI chuyên phân tích tin nhắn khách hàng cho đội ngũ sale Tarot.",
      "",
      "## Nhiệm vụ",
      "Khi nhận được tin nhắn từ khách, bạn PHẢI thực hiện ĐÚNG 3 bước sau:",
      "",
      "### Bước 1: Tóm tắt",
      "Rút gọn toàn bộ câu chuyện thành 1-2 dòng ngắn gọn.",
      "",
      "### Bước 2: Phân tích câu hỏi",
      "- Đọc kỹ tin nhắn, xác định TỪNG ý/câu hỏi RIÊNG BIỆT của khách.",
      "- Mỗi ý phải là một vấn đề KHÁC NHAU, không gộp chung.",
      "- KHÔNG được bịa thêm câu hỏi mà khách không hề đề cập.",
      "",
      "### Bước 3: Xác định chủ đề",
      "Phân loại chủ đề chính: tình cảm, công việc, tài chính, sức khoẻ, gia đình, học tập, v.v.",
      "",
      "## Format trả lời BẮT BUỘC",
      "",
      "📝 TÓM TẮT",
      "[tóm tắt ngắn gọn 1-2 dòng]",
      "",
      "📊 PHÂN TÍCH (X câu hỏi)",
      "1. [câu hỏi/ý thứ 1]",
      "2. [câu hỏi/ý thứ 2]",
      "...",
      "",
      "🏷️ CHỦ ĐỀ: [chủ đề chính]",
      "",
      "## Quy tắc nghiêm ngặt",
      "- Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng.",
      "- Đếm CHÍNH XÁC số câu hỏi — không thừa, không thiếu.",
      "- CHỈ dựa vào nội dung khách gửi. KHÔNG suy diễn thêm.",
      "- KHÔNG thêm lời khuyên hay gợi ý trải bài.",
    ].join("\n");
  }

  // ===== GENERATION CONFIG (anti-hallucination) =====
  const GENERATION_CONFIG = {
    temperature: 0.2,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 1024,
  };

  // ===== API KEY & SETTINGS MANAGEMENT =====
  async function loadApiKey() {
    try {
      const data = await chrome.storage.local.get([
        "aiChatApiKey",
        "aiChatMaxHistory",
        "aiChatSendContext",
      ]);
      if (data.aiChatApiKey) T.aiChatApiKey = data.aiChatApiKey;
      if (typeof data.aiChatMaxHistory === "number") {
        T.aiChatMaxHistory = data.aiChatMaxHistory;
      }
      if (typeof data.aiChatSendContext === "boolean") {
        T.aiChatSendContext = data.aiChatSendContext;
      }
    } catch {
      /* silent */
    }
  }

  function saveApiKey(key) {
    T.aiChatApiKey = key.trim();
    T.storage.syncSave({ aiChatApiKey: T.aiChatApiKey });
  }

  function saveMaxHistory(val) {
    T.aiChatMaxHistory = val;
    T.storage.syncSave({ aiChatMaxHistory: val });
    trimHistory();
    renderMessages();
  }

  function saveSendContext(val) {
    T.aiChatSendContext = val;
    T.storage.syncSave({ aiChatSendContext: val });
  }

  // Trim history to maxHistory (keeps most recent messages)
  function trimHistory() {
    const max = T.aiChatMaxHistory;
    if (T.aiChatHistory.length > max) {
      T.aiChatHistory = T.aiChatHistory.slice(-max);
    }
  }

  // ===== SEND MESSAGE TO GEMINI =====
  async function sendMessage(userText) {
    if (!userText.trim()) return;
    if (!T.aiChatApiKey) {
      T.ui.showToast("⚠️ Chưa nhập API Key!", "error");
      return;
    }
    if (T.aiChatLoading) return;

    // Add user message to history & trim to limit
    T.aiChatHistory.push({ role: "user", text: userText.trim() });
    trimHistory();
    renderMessages();
    scrollToBottom();

    // Build contents — with or without context window
    let contents;
    if (T.aiChatSendContext) {
      // Send full history for contextual conversation
      contents = T.aiChatHistory.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));
    } else {
      // Send only the latest user message (no context)
      contents = [{ role: "user", parts: [{ text: userText.trim() }] }];
    }

    const body = {
      system_instruction: { parts: [{ text: buildSystemPrompt() }] },
      contents,
      generationConfig: GENERATION_CONFIG,
    };

    T.aiChatLoading = true;
    updateLoadingState();

    try {
      const res = await fetch(GEMINI_URL + "?key=" + T.aiChatApiKey, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg =
          errData?.error?.message || "HTTP " + res.status;
        throw new Error(errMsg);
      }

      const data = await res.json();
      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "(Không có phản hồi)";

      T.aiChatHistory.push({ role: "model", text: reply });
      trimHistory();
    } catch (err) {
      T.aiChatHistory.push({
        role: "model",
        text: "❌ Lỗi: " + err.message,
      });
    } finally {
      T.aiChatLoading = false;
      updateLoadingState();
      renderMessages();
      scrollToBottom();
    }
  }

  // ===== CLEAR HISTORY =====
  function clearHistory() {
    T.aiChatHistory = [];
    renderMessages();
  }

  // ===== CHAT HTML =====
  function createChatHTML() {
    return `
      <div class="tqs-aichat-header">
        <div class="tqs-aichat-title">
          <span class="tqs-aichat-title-icon">🤖</span>
          <span>AI Chat</span>
          <span class="tqs-aichat-badge">Gemini 2.5</span>
        </div>
        <div class="tqs-aichat-header-actions">
          <button class="tqs-aichat-header-btn" id="tqs-aichat-settings-toggle" title="Cài đặt">⚙️</button>
          <button class="tqs-aichat-header-btn" id="tqs-aichat-clear" title="Xoá lịch sử">🗑️</button>
          <button class="tqs-aichat-header-btn tqs-aichat-close-btn" id="tqs-aichat-close" title="Đóng">✕</button>
        </div>
      </div>

      <div class="tqs-aichat-settings tqs-hidden" id="tqs-aichat-settings">
        <div class="tqs-aichat-settings-row">
          <input type="password" class="tqs-input tqs-input-sm" id="tqs-aichat-apikey"
                 placeholder="Paste Google Gemini API Key..." style="flex:1">
          <button class="tqs-ebtn tqs-ebtn-save tqs-aichat-save-key" id="tqs-aichat-save-key">Lưu</button>
        </div>
        <div class="tqs-aichat-settings-row">
          <label class="tqs-aichat-label">Lịch sử tối đa:</label>
          <select class="tqs-select tqs-input-sm" id="tqs-aichat-max-history" style="width:auto">
            <option value="3">3 tin</option>
            <option value="5" selected>5 tin</option>
            <option value="10">10 tin</option>
            <option value="20">20 tin</option>
            <option value="50">50 tin</option>
          </select>
        </div>
        <div class="tqs-aichat-settings-row">
          <label class="tqs-aichat-label">Gửi ngữ cảnh:</label>
          <label class="tqs-switch-label" style="margin-left:auto">
            <input type="checkbox" id="tqs-aichat-context-toggle" checked>
            <span class="tqs-switch"></span>
          </label>
        </div>
      </div>

      <div class="tqs-aichat-messages" id="tqs-aichat-messages"></div>

      <div class="tqs-aichat-typing tqs-hidden" id="tqs-aichat-typing">
        <span class="tqs-typing-dot"></span>
        <span class="tqs-typing-dot"></span>
        <span class="tqs-typing-dot"></span>
      </div>

      <div class="tqs-aichat-input-row">
        <textarea class="tqs-aichat-input" id="tqs-aichat-input"
                  placeholder="Paste tin nhắn khách vào đây..." rows="2"></textarea>
        <button class="tqs-aichat-send" id="tqs-aichat-send" title="Gửi">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    `;
  }

  // ===== FORMAT MESSAGE TEXT → HTML =====
  function formatMessageHTML(text) {
    // Escape HTML
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Section headers: 📝 TÓM TẮT / 📊 PHÂN TÍCH / 🏷️ CHỦ ĐỀ
    html = html.replace(
      /^(📝|📊|🏷️|❌)\s*(.+)$/gm,
      '<div class="tqs-ai-section-header"><span class="tqs-ai-section-icon">$1</span> $2</div>'
    );

    // Numbered list items: "1. text"
    html = html.replace(
      /^(\d+)\.\s+(.+)$/gm,
      '<div class="tqs-ai-list-item"><span class="tqs-ai-list-num">$1</span><span>$2</span></div>'
    );

    // Bold: **text**
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Italic: *text*
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Line breaks
    html = html.replace(/\n/g, "<br>");

    // Clean up: remove <br> right after section headers and before list items
    html = html.replace(/<\/div><br>/g, "</div>");
    html = html.replace(/<br><div class="/g, '<div class="');

    return html;
  }

  // ===== BUILD EMPTY STATE =====
  function buildEmptyState() {
    const el = document.createElement("div");
    el.className = "tqs-aichat-empty";
    el.innerHTML =
      '<div class="tqs-aichat-empty-icon">💬</div>' +
      '<div class="tqs-aichat-empty-title">Chưa có tin nhắn</div>' +
      '<div class="tqs-aichat-empty-desc">Paste tin nhắn khách hàng vào ô bên dưới<br>để AI phân tích &amp; đánh giá câu hỏi.</div>';
    return el;
  }

  // ===== RENDER MESSAGES =====
  function renderMessages() {
    const container = T.els.aiChatMessages;
    if (!container) return;

    // Empty state — rebuild each time (no stale reference)
    if (T.aiChatHistory.length === 0) {
      container.innerHTML = "";
      container.appendChild(buildEmptyState());
      return;
    }

    const frag = document.createDocumentFragment();

    T.aiChatHistory.forEach((msg) => {
      const bubble = document.createElement("div");
      bubble.className =
        "tqs-aichat-bubble tqs-aichat-bubble-" + msg.role;

      bubble.innerHTML = formatMessageHTML(msg.text);

      // Click-to-copy cho model bubbles
      if (msg.role === "model") {
        bubble.title = "Click để copy";
        bubble.addEventListener("click", () => {
          navigator.clipboard.writeText(msg.text).then(() => {
            T.ui.showToast("📋 Đã copy phản hồi AI");
          });
        });
      }

      frag.appendChild(bubble);
    });

    container.innerHTML = "";
    container.appendChild(frag);
  }

  // ===== SCROLL TO BOTTOM =====
  function scrollToBottom() {
    const container = T.els.aiChatMessages;
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }

  // ===== LOADING STATE =====
  function updateLoadingState() {
    const typing = T.els.aiChatTyping;
    const sendBtn = T.els.aiChatSend;
    if (typing) {
      typing.classList.toggle("tqs-hidden", !T.aiChatLoading);
    }
    if (sendBtn) {
      sendBtn.disabled = T.aiChatLoading;
    }
  }

  // ===== AUTO-RESIZE TEXTAREA =====
  function autoResizeInput() {
    const input = T.els.aiChatInput;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 100) + "px";
  }

  // ===== OPEN / CLOSE =====
  function openChat() {
    const chatPanel = T.els.aiChatPanel;
    if (!chatPanel) return;
    chatPanel.classList.remove("tqs-hidden");
    if (T.els.aiChatInput) T.els.aiChatInput.focus();
  }

  function closeChat() {
    const chatPanel = T.els.aiChatPanel;
    if (!chatPanel) return;
    chatPanel.classList.add("tqs-hidden");
  }

  function toggleChat() {
    const chatPanel = T.els.aiChatPanel;
    if (!chatPanel) return;
    if (chatPanel.classList.contains("tqs-hidden")) {
      openChat();
    } else {
      closeChat();
    }
  }

  // ===== INIT EVENTS =====
  function initChatEvents() {
    // Close button
    T.els.aiChatClose?.addEventListener("click", closeChat);

    // Settings toggle
    T.els.aiChatSettingsToggle?.addEventListener("click", () => {
      T.els.aiChatSettings?.classList.toggle("tqs-hidden");
      if (!T.els.aiChatSettings?.classList.contains("tqs-hidden")) {
        // Populate current values
        if (T.aiChatApiKey && T.els.aiChatApiKeyInput) {
          T.els.aiChatApiKeyInput.value = T.aiChatApiKey;
        }
        if (T.els.aiChatMaxHistorySelect) {
          T.els.aiChatMaxHistorySelect.value = String(T.aiChatMaxHistory);
        }
        // Context toggle
        const ctxToggle = document.getElementById("tqs-aichat-context-toggle");
        if (ctxToggle) ctxToggle.checked = T.aiChatSendContext !== false;
      }
    });

    // Save API key
    T.els.aiChatSaveKey?.addEventListener("click", () => {
      const key = T.els.aiChatApiKeyInput?.value;
      if (key?.trim()) {
        saveApiKey(key);
        T.ui.showToast("✓ API Key đã lưu!");
        T.els.aiChatSettings?.classList.add("tqs-hidden");
      } else {
        T.ui.showToast("⚠️ Key trống!", "error");
      }
    });

    // Max history selector
    T.els.aiChatMaxHistorySelect?.addEventListener("change", () => {
      const val = parseInt(T.els.aiChatMaxHistorySelect.value) || DEFAULT_MAX_HISTORY;
      saveMaxHistory(val);
      T.ui.showToast("✓ Lưu tối đa " + val + " tin");
    });

    // Context window toggle
    const ctxToggle = document.getElementById("tqs-aichat-context-toggle");
    ctxToggle?.addEventListener("change", () => {
      saveSendContext(ctxToggle.checked);
      T.ui.showToast(ctxToggle.checked ? "✓ Gửi ngữ cảnh: Bật" : "✓ Gửi ngữ cảnh: Tắt");
    });

    // Clear chat
    T.els.aiChatClear?.addEventListener("click", () => {
      clearHistory();
      T.ui.showToast("🗑️ Đã xoá lịch sử chat");
    });

    // Send message
    T.els.aiChatSend?.addEventListener("click", () => {
      const text = T.els.aiChatInput?.value;
      if (text?.trim()) {
        T.els.aiChatInput.value = "";
        autoResizeInput();
        sendMessage(text);
      }
    });

    // Enter to send (Shift+Enter for newline)
    T.els.aiChatInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const text = T.els.aiChatInput.value;
        if (text?.trim()) {
          T.els.aiChatInput.value = "";
          autoResizeInput();
          sendMessage(text);
        }
      }
    });

    // Auto-resize textarea on input
    T.els.aiChatInput?.addEventListener("input", autoResizeInput);

    // AI chat header button in main panel
    T.els.aiChatBtn?.addEventListener("click", toggleChat);

    // Render initial empty state
    renderMessages();
  }

  // Export
  T.aichat = {
    loadApiKey,
    saveApiKey,
    sendMessage,
    clearHistory,
    createChatHTML,
    renderMessages,
    openChat,
    closeChat,
    toggleChat,
    initChatEvents,
  };
})();
