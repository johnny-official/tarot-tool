// ===== TAROT QUICKSALE — UI COMPONENTS =====
// Panel HTML, toast, modals, drag, controls.

(function () {
  "use strict";
  const T = window.TQS;

  // ===== PANEL HTML =====
  function createPanelHTML() {
    // NOTE: T.PRICING_DATA is NOT loaded yet when this runs.
    // Badge gets updated later by main.js after loadConfig + loadPricingData.

    return `
      <div class="tqs-header" id="tqs-drag-handle">
        <div class="tqs-logo">
          <span class="tqs-logo-icon">🔮</span> QuickSale
        </div>
        <div class="tqs-header-actions">
          <span class="tqs-page-badge tqs-badge-cyan" id="tqs-page-badge">...</span>
          <span class="tqs-source-badge tqs-source-fb" id="tqs-source-badge" title="Nguồn">🔵</span>
          <span class="tqs-stats-inline" title="Đơn / Tiền"><span id="tqs-total-orders">0</span>đ · <span id="tqs-total-revenue">0k</span></span>
          <button class="tqs-header-btn" id="tqs-report" title="📋 Báo Cáo">📋</button>
          <button class="tqs-header-btn" id="tqs-reset" title="🔄 Reset">🔄</button>
          <button class="tqs-header-btn tqs-minimize" id="tqs-minimize">─</button>
          <button class="tqs-header-btn tqs-close" id="tqs-close">✕</button>
        </div>
      </div>

      <div class="tqs-body">
        <!-- READER ROW -->
        <div class="tqs-reader-row">
          <div class="tqs-reader-card" id="tqs-reader-card">
            <div class="tqs-reader-main">
              <div class="tqs-reader-name" id="tqs-active-reader-name">Chưa chọn</div>
              <div class="tqs-reader-meta" id="tqs-reader-status">Nhập tên bên dưới</div>
            </div>
            <div class="tqs-reader-actions">
              <label class="tqs-mini-toggle" title="🔄 Tự đổi"><input type="checkbox" id="tqs-auto-rotate-toggle" checked><span class="tqs-check"></span></label>
              <label class="tqs-mini-toggle" title="📅 Lịch"><input type="checkbox" id="tqs-schedule-mode-toggle"><span class="tqs-check"></span></label>
              <button class="tqs-icon-action" id="tqs-schedule-btn" title="Paste Lịch">📅</button>
            </div>
          </div>
          <div class="tqs-reader-chips" id="tqs-reader-chips"></div>
          <input type="text" class="tqs-input tqs-input-sm" id="tqs-reader-add-input" placeholder="Gõ tên → Enter">
        </div>

        <!-- FORM -->
        <input type="text" class="tqs-input" id="tqs-customer" placeholder="Tên khách hàng">

        <div class="tqs-row">
          <select class="tqs-select" id="tqs-service" style="flex:1">
            <option value="">-- Dịch vụ --</option>
          </select>
          <select class="tqs-select" id="tqs-package" style="flex:1">
            <option value="">-- Gói --</option>
          </select>
        </div>

        <div class="tqs-row tqs-row-misc">
          <label class="tqs-custom-toggle"><input type="checkbox" id="tqs-custom-mode"><span class="tqs-check"></span> Tuỳ chọn</label>
          <div id="tqs-custom-inputs" class="tqs-hidden tqs-row" style="flex:1">
            <input type="text" class="tqs-input" id="tqs-custom-name" placeholder="Tên gói" style="flex:2">
            <input type="number" class="tqs-input" id="tqs-custom-price" placeholder="Giá" style="flex:1">
          </div>
        </div>

        <input type="text" class="tqs-input" id="tqs-note" placeholder="Ghi chú...">

        <!-- PRICE + ACTIONS -->
        <div class="tqs-bottom-bar">
          <div class="tqs-price-tag" id="tqs-price">0k</div>
          <button class="tqs-btn tqs-btn-primary" id="tqs-copy-save" style="flex:1">📋 Copy & Lưu</button>
        </div>

        <!-- RECENT ORDERS (max 2) -->
        <div class="tqs-recent" id="tqs-order-list"></div>
      </div>

      <!-- EDIT MODAL -->
      <div class="tqs-edit-overlay tqs-hidden" id="tqs-edit-modal">
        <div class="tqs-edit-card">
          <div class="tqs-edit-title">✏️ Sửa đơn</div>
          <input type="text" class="tqs-input" id="tqs-edit-customer" placeholder="Khách">
          <div class="tqs-row">
            <input type="text" class="tqs-input" id="tqs-edit-reader" placeholder="Reader">
            <input type="number" class="tqs-input" id="tqs-edit-price" placeholder="Giá">
          </div>
          <input type="text" class="tqs-input" id="tqs-edit-package" placeholder="Gói">
          <input type="text" class="tqs-input" id="tqs-edit-note" placeholder="Note">
          <div class="tqs-edit-btns">
            <button class="tqs-ebtn tqs-ebtn-cancel" id="tqs-edit-cancel">Hủy</button>
            <button class="tqs-ebtn tqs-ebtn-save" id="tqs-edit-save">Lưu</button>
          </div>
        </div>
      </div>

      <!-- SCHEDULE MODAL -->
      <div class="tqs-modal tqs-hidden" id="tqs-schedule-modal">
        <div class="tqs-modal-content">
          <div class="tqs-edit-title">📅 Lịch làm việc</div>
          <textarea class="tqs-textarea" id="tqs-schedule-input" placeholder="Paste lịch ca vào đây...

VD:
8h - 14h @Hậu @Mai
14h - 22h @Lan"></textarea>
          <div class="tqs-edit-btns">
            <button class="tqs-ebtn tqs-ebtn-cancel" id="tqs-schedule-close">Đóng</button>
            <button class="tqs-ebtn tqs-ebtn-save" id="tqs-schedule-parse">Cập nhật</button>
          </div>
        </div>
      </div>
    `;
  }

  // ===== INJECT =====
  function injectPanel() {
    if (document.getElementById("tarot-quicksale-panel")) return null;

    const panel = document.createElement("div");
    panel.id = "tarot-quicksale-panel";
    panel.innerHTML = createPanelHTML();
    document.body.appendChild(panel);

    const toast = document.createElement("div");
    toast.className = "tqs-toast";
    toast.id = "tqs-toast";
    document.body.appendChild(toast);

    const toggleBtn = document.createElement("button");
    toggleBtn.id = "tarot-quicksale-toggle";
    toggleBtn.innerHTML = "🔮";
    toggleBtn.title = "Mở Tarot QuickSale";
    toggleBtn.classList.add("tqs-hidden");
    document.body.appendChild(toggleBtn);

    T.panel = panel;
    return panel;
  }

  // ===== COLLECT ELEMENT REFS =====
  function collectElements(panel) {
    T.els = {
      panel,
      header: panel.querySelector("#tqs-drag-handle"),
      closeBtn: panel.querySelector("#tqs-close"),
      minimizeBtn: panel.querySelector("#tqs-minimize"),
      totalOrders: panel.querySelector("#tqs-total-orders"),
      totalRevenue: panel.querySelector("#tqs-total-revenue"),
      orderList: panel.querySelector("#tqs-order-list"),
      reportBtn: panel.querySelector("#tqs-report"),
      resetBtn: panel.querySelector("#tqs-reset"),
      pageBadge: panel.querySelector("#tqs-page-badge"),
      sourceBadge: panel.querySelector("#tqs-source-badge"),
      readerCard: panel.querySelector("#tqs-reader-card"),
      activeReaderName: panel.querySelector("#tqs-active-reader-name"),
      readerStatus: panel.querySelector("#tqs-reader-status"),
      scheduleBtn: panel.querySelector("#tqs-schedule-btn"),
      autoRotateToggle: panel.querySelector("#tqs-auto-rotate-toggle"),
      readerAddInput: panel.querySelector("#tqs-reader-add-input"),
      customerInput: panel.querySelector("#tqs-customer"),
      serviceSelect: panel.querySelector("#tqs-service"),
      packageSelect: panel.querySelector("#tqs-package"),
      noteInput: panel.querySelector("#tqs-note"),
      customMode: panel.querySelector("#tqs-custom-mode"),
      customInputs: panel.querySelector("#tqs-custom-inputs"),
      customName: panel.querySelector("#tqs-custom-name"),
      customPrice: panel.querySelector("#tqs-custom-price"),
      priceDisplay: panel.querySelector("#tqs-price"),
      copySaveBtn: panel.querySelector("#tqs-copy-save"),
      editModal: panel.querySelector("#tqs-edit-modal"),
      editCustomer: panel.querySelector("#tqs-edit-customer"),
      editReader: panel.querySelector("#tqs-edit-reader"),
      editPackage: panel.querySelector("#tqs-edit-package"),
      editPrice: panel.querySelector("#tqs-edit-price"),
      editNote: panel.querySelector("#tqs-edit-note"),
      editCancel: panel.querySelector("#tqs-edit-cancel"),
      editSave: panel.querySelector("#tqs-edit-save"),
      scheduleModal: panel.querySelector("#tqs-schedule-modal"),
      scheduleInput: panel.querySelector("#tqs-schedule-input"),
      scheduleClose: panel.querySelector("#tqs-schedule-close"),
      scheduleParse: panel.querySelector("#tqs-schedule-parse"),
      scheduleModeToggle: panel.querySelector("#tqs-schedule-mode-toggle"),
      readerChips: panel.querySelector("#tqs-reader-chips"),
      toast: document.querySelector("#tqs-toast"),
      toggleBtn: document.querySelector("#tarot-quicksale-toggle"),
    };
  }

  // ===== TOAST =====
  let _toastTimer = null;
  function showToast(message, type = "success") {
    if (!T.els.toast) return;
    clearTimeout(_toastTimer);
    T.els.toast.textContent = message;
    T.els.toast.className =
      "tqs-toast tqs-show" + (type !== "success" ? " tqs-" + type : "");
    _toastTimer = setTimeout(() => {
      T.els.toast.className = "tqs-toast";
    }, 2500);
  }

  // ===== CONFIRM MODAL =====
  function showConfirm(msg) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "tqs-edit-overlay";
      overlay.style.cssText =
        "position:absolute;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:30";
      const card = document.createElement("div");
      card.style.cssText =
        "background:#151b30;border:1px solid #1e2a45;border-radius:12px;padding:20px;max-width:280px;width:90%;display:flex;flex-direction:column;gap:12px";
      card.innerHTML = `
        <div style="font-size:13px;color:#e2e8f0;line-height:1.5">${msg}</div>
        <div style="display:flex;gap:8px">
          <button id="_c-cancel" style="flex:1;padding:8px;border:1px solid #1e2a45;background:transparent;color:#64748b;border-radius:7px;cursor:pointer;font-size:12px;font-family:inherit">Hủy</button>
          <button id="_c-ok" style="flex:1;padding:8px;border:none;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Xác nhận</button>
        </div>`;
      overlay.appendChild(card);
      T.panel.appendChild(overlay);
      const cleanup = (r) => {
        overlay.remove();
        resolve(r);
      };
      card.querySelector("#_c-ok").onclick = () => cleanup(true);
      card.querySelector("#_c-cancel").onclick = () => cleanup(false);
      overlay.onclick = (e) => {
        if (e.target === overlay) cleanup(false);
      };
    });
  }

  // ===== DRAG =====
  function initDrag() {
    T.els.header.addEventListener("mousedown", (e) => {
      if (e.target.closest(".tqs-header-btn")) return;
      T.isDragging = true;
      const rect = T.panel.getBoundingClientRect();
      T.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      T.panel.style.transition = "none";
    });
    document.addEventListener("mousemove", (e) => {
      if (!T.isDragging) return;
      e.preventDefault();
      const x = Math.max(
        0,
        Math.min(e.clientX - T.dragOffset.x, window.innerWidth - T.panel.offsetWidth),
      );
      const y = Math.max(
        0,
        Math.min(e.clientY - T.dragOffset.y, window.innerHeight - T.panel.offsetHeight),
      );
      T.panel.style.left = x + "px";
      T.panel.style.top = y + "px";
      T.panel.style.right = "auto";
    });
    document.addEventListener("mouseup", () => {
      T.isDragging = false;
      T.panel.style.transition = "";
    });
  }

  // ===== PANEL CONTROLS =====
  function initControls() {
    T.els.closeBtn.addEventListener("click", () => {
      T.panel.classList.add("tqs-hidden");
      T.els.toggleBtn.classList.remove("tqs-hidden");
    });
    T.els.minimizeBtn.addEventListener("click", () => {
      const mini = T.panel.classList.toggle("tqs-minimized");
      T.els.minimizeBtn.textContent = mini ? "□" : "─";
    });
    T.els.toggleBtn.addEventListener("click", () => {
      T.panel.classList.remove("tqs-hidden");
      T.els.toggleBtn.classList.add("tqs-hidden");
    });
  }

  // ===== UPDATE PAGE BADGE =====
  function updatePageBadge() {
    if (!T.detectedPage || !T.PRICING_DATA[T.detectedPage]) return;
    const badge = T.els.pageBadge;
    if (badge) {
      const color = T.PRICING_DATA[T.detectedPage].color || "cyan";
      badge.className = `tqs-page-badge tqs-badge-${color}`;
      badge.textContent = T.PRICING_DATA[T.detectedPage].name;
    }
  }

  // ===== UPDATE SOURCE BADGE =====
  function updateSourceBadge() {
    const badge = T.els.sourceBadge;
    if (!badge) return;
    const isIG = T.sourcePlatform === "instagram";
    badge.textContent = isIG ? "🟣" : "🔵";
    badge.className = `tqs-source-badge ${isIG ? "tqs-source-ig" : "tqs-source-fb"}`;
    badge.title = isIG ? "Instagram" : "Facebook";
  }

  // Export
  T.ui = {
    injectPanel,
    collectElements,
    showToast,
    showConfirm,
    initDrag,
    initControls,
    updatePageBadge,
    updateSourceBadge,
  };
})();
