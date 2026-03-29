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
      "Bạn là trợ lý AI cho đội ngũ sale Tarot.",
      "Nhiệm vụ chính:",
      "1. Rút gọn câu chuyện/tình huống khách hàng gửi thành tóm tắt ngắn gọn.",
      "2. Đánh giá xem tin nhắn của khách có bao nhiêu câu hỏi / ý riêng biệt.",
      "3. Liệt kê từng ý/câu hỏi rõ ràng, đánh số thứ tự.",
      "4. Xác định trọng tâm chính của khách (tình cảm, công việc, tài chính, sức khoẻ, v.v.).",
      "",
      "Format trả lời:",
      "📝 TÓM TẮT: [tóm tắt ngắn gọn tình huống khách]",
      "📊 SỐ CÂU HỎI: [số lượng]",
      "1. [câu hỏi/ý thứ 1]",
      "2. [câu hỏi/ý thứ 2]",
      "...",
      "Quy tắc:",
      "- Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng.",
      "- Đếm chính xác số câu hỏi, không gộp, không bỏ sót.",
      "- Nếu khách chỉ chào hỏi / chưa rõ nhu cầu → ghi nhận và gợi ý hỏi thêm.",
    ].join("\n");
  }

  // ===== API KEY & SETTINGS MANAGEMENT =====
  async function loadApiKey() {
    try {
      const data = await chrome.storage.local.get(["aiChatApiKey", "aiChatMaxHistory"]);
      if (data.aiChatApiKey) T.aiChatApiKey = data.aiChatApiKey;
      if (typeof data.aiChatMaxHistory === "number") {
        T.aiChatMaxHistory = data.aiChatMaxHistory;
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

    // Build request body (send only kept messages)
    const contents = T.aiChatHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const body = {
      system_instruction: { parts: [{ text: buildSystemPrompt() }] },
      contents,
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
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
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
        bubble.style.cursor = "pointer";
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
