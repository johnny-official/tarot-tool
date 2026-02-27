// ===== TAROT QUICKSALE CONTENT SCRIPT V2.0 =====
(function () {
  "use strict";

  if (document.getElementById("tarot-quicksale-panel")) return;

  // ===== PAGE DETECTION CONFIG =====
  const PAGE_IDS = {
    918768421315641: "POBO",
    513140915211900: "DUA",
    105889999207829: "CA",
  };

  // ===== STATE =====
  let PRICING_DATA = {}; // loaded from price.json
  let currentPrice = 0;
  let shiftOrders = [];
  let shiftStartTime = null;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let detectedPage = null;

  // Reader state
  let readerList = [];
  let activeReaderIdx = 0;
  let autoRotate = true;

  // Schedule state
  let scheduleSlots = [];
  let scheduleMode = false;
  let slotReaderIdx = {};
  let scheduleTimerId = null;

  // Misc
  let editingOrderId = null;
  let manualReaderOverride = null;

  // Abbreviations for message output
  const SERVICE_ABBR = {
    "Trải Tarot": "TA",
    Tarot: "TA",
    Lenormand: "LENOR",
    "Bài Tây": "TÂY",
    "Câu Lẻ": "",
    "Combo 3 Câu": "3C",
    "Combo 4 Câu": "4C",
    "Combo Full 6 Câu": "6C",
    "⏱ Gói 30 Phút": "30p",
    "⏱ Gói 45 Phút": "45p",
    "⏱ Gói 60 Phút": "60p",
    "⏱ Gói Thời Gian": "",
  };

  const PACKAGE_ABBR = {
    "Y/N": "Y/N",
    "CS Tarot": "CS",
    "CS Đặc Biệt": "ĐB",
    "1 Y/N": "1Y/N",
    "1 CS": "1CS",
    "3 CB": "3CB",
    "6 CB": "6CB",
    "3 CS": "3CS",
    "4 CS": "4CS",
    "5 CS": "5CS",
    "6 CS": "6CS",
    "7 CS": "7CS",
    Tarot: "TA",
    Lenormand: "LENOR",
    "Bài Tây": "TÂY",
    "30 Phút": "30p",
    "45 Phút": "45p",
    "60 Phút": "60p",
    "+ Lenormand": "+LENOR",
    "+ Bài Tây": "+TÂY",
  };

  // ===== DETECT PAGE FROM URL =====
  function detectPageFromURL() {
    const url = window.location.href;
    const params = new URLSearchParams(window.location.search);
    const pageId = params.get("page_id") || params.get("asset_id");
    if (pageId && PAGE_IDS[pageId]) return PAGE_IDS[pageId];
    for (const [id, page] of Object.entries(PAGE_IDS)) {
      if (url.includes(id)) return page;
    }
    return null;
  }

  // ===== CREATE PANEL HTML =====
  function createPanelHTML() {
    const detected = detectPageFromURL();
    detectedPage = detected;
    const pageColor = detected
      ? PRICING_DATA[detected]?.color || "cyan"
      : "cyan";

    return `
      <div class="tqs-header" id="tqs-drag-handle">
        <div class="tqs-logo">
          <span class="tqs-logo-icon">🔮</span> Tarot QuickSale
        </div>
        <div class="tqs-header-actions">
          ${detected ? `<span class="tqs-page-badge tqs-badge-${pageColor}">${PRICING_DATA[detected]?.name || detected}</span>` : ""}
          <button class="tqs-header-btn tqs-minimize" id="tqs-minimize">─</button>
          <button class="tqs-header-btn tqs-close" id="tqs-close">✕</button>
        </div>
      </div>

      <div class="tqs-body">
        <!-- LEFT: Stats & History -->
        <div class="tqs-panel-left">
          <div class="tqs-stats-grid">
            <div class="tqs-stat-item">
              <div class="tqs-stat-val highlight" id="tqs-total-orders">0</div>
              <div class="tqs-stat-lbl">Đơn</div>
            </div>
            <div class="tqs-stat-item">
              <div class="tqs-stat-val" id="tqs-total-revenue">0k</div>
              <div class="tqs-stat-lbl">Tiền</div>
            </div>
          </div>

          <div class="tqs-history" id="tqs-order-list">
            <div class="tqs-order-empty">Chưa có đơn</div>
          </div>

          <div class="tqs-left-actions">
            <button class="tqs-action-btn" id="tqs-report">📋 Báo Cáo</button>
            <button class="tqs-action-btn" id="tqs-reset">🔄 Reset</button>
          </div>
        </div>

        <!-- RIGHT: Form Controls -->
        <div class="tqs-panel-right">

          <!-- READER SECTION -->
          <div class="tqs-section-label">
            <span>Reader</span>
            <div style="display:flex;gap:6px;align-items:center">
              <label class="tqs-custom-toggle" title="Tự đổi reader sau mỗi đơn">
                <input type="checkbox" id="tqs-auto-rotate-toggle" checked>
                <span class="tqs-check"></span> 🔄
              </label>
              <label class="tqs-custom-toggle" title="Lịch tự động">
                <input type="checkbox" id="tqs-schedule-mode-toggle">
                <span class="tqs-check"></span> 📅
              </label>
            </div>
          </div>

          <div class="tqs-reader-card" id="tqs-reader-card">
            <div class="tqs-reader-main">
              <div class="tqs-reader-name" id="tqs-active-reader-name">Chưa chọn</div>
              <div class="tqs-reader-meta" id="tqs-reader-status">Nhập tên bên dưới</div>
            </div>
            <div class="tqs-reader-actions">
              <button class="tqs-icon-action" id="tqs-schedule-btn" title="Paste Lịch">📅</button>
            </div>
          </div>

          <div class="tqs-reader-chips" id="tqs-reader-chips"></div>

          <div class="tqs-reader-add">
            <input type="text" class="tqs-input" id="tqs-reader-add-input" placeholder="Gõ tên → Enter thêm reader">
          </div>

          <!-- FORM INPUTS -->
          <div class="tqs-section-label" style="margin-top:4px">Đơn Hàng</div>

          <div class="tqs-input-group">
            <input type="text" class="tqs-input" id="tqs-customer" placeholder="Tên Khách Hàng">
          </div>

          <div class="tqs-row">
            <div class="tqs-col">
              <select class="tqs-select" id="tqs-service">
                <option value="">-- Dịch vụ --</option>
              </select>
            </div>
            <div class="tqs-col">
              <select class="tqs-select" id="tqs-package">
                <option value="">-- Gói --</option>
              </select>
            </div>
          </div>

          <div class="tqs-section-label" style="margin-top:4px">Tùy Chọn</div>

          <label class="tqs-custom-toggle">
            <input type="checkbox" id="tqs-custom-mode">
            <span class="tqs-check"></span> Gói tùy chỉnh
          </label>

          <div id="tqs-custom-inputs" class="tqs-hidden tqs-row" style="margin-top:8px">
            <input type="text" class="tqs-input" id="tqs-custom-name" placeholder="Tên gói" style="flex:2">
            <input type="number" class="tqs-input" id="tqs-custom-price" placeholder="Giá" style="flex:1">
          </div>

          <input type="text" class="tqs-input" id="tqs-note" placeholder="Ghi chú..." style="margin-top:8px">

          <!-- PRICE + ACTIONS -->
          <div class="tqs-price-tag" id="tqs-price">0k</div>

          <div class="tqs-main-actions">
            <button class="tqs-btn tqs-btn-primary" id="tqs-copy-save">📋 Copy & Lưu</button>
            <button class="tqs-btn tqs-btn-secondary" id="tqs-send-msg">📤 Gửi Msg</button>
          </div>

          <!-- Platform Selector (hidden by default, shown on demand) -->
          <div class="tqs-platform-row tqs-hidden" id="tqs-platform-row">
            <label class="tqs-platform-btn"><input type="radio" name="platform" value="facebook" checked> FB</label>
            <label class="tqs-platform-btn"><input type="radio" name="platform" value="messenger"> Msg</label>
          </div>

        </div>
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

    return panel;
  }

  const panel = injectPanel();

  // ===== ELEMENT REFS =====
  const els = {
    panel,
    header: panel.querySelector("#tqs-drag-handle"),
    closeBtn: panel.querySelector("#tqs-close"),
    minimizeBtn: panel.querySelector("#tqs-minimize"),
    totalOrders: panel.querySelector("#tqs-total-orders"),
    totalRevenue: panel.querySelector("#tqs-total-revenue"),
    orderList: panel.querySelector("#tqs-order-list"),
    reportBtn: panel.querySelector("#tqs-report"),
    resetBtn: panel.querySelector("#tqs-reset"),
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
    sendMsgBtn: panel.querySelector("#tqs-send-msg"),
    platformRow: panel.querySelector("#tqs-platform-row"),
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

  // ===== TOAST =====
  let _toastTimer = null;
  function showToast(message, type = "success") {
    if (!els.toast) return;
    clearTimeout(_toastTimer);
    els.toast.textContent = message;
    els.toast.className =
      "tqs-toast tqs-show" + (type !== "success" ? " tqs-" + type : "");
    _toastTimer = setTimeout(() => {
      els.toast.className = "tqs-toast";
    }, 2500);
  }

  // ===== READER LOGIC =====
  function getActiveReader() {
    if (manualReaderOverride) return manualReaderOverride;
    if (scheduleMode && scheduleSlots.length > 0) {
      const slotData = getScheduleReader();
      if (slotData) return slotData;
    }
    if (readerList.length > 0) {
      if (activeReaderIdx >= readerList.length) activeReaderIdx = 0;
      return readerList[activeReaderIdx];
    }
    return "Chưa set tên";
  }

  function updateReaderDisplay() {
    const reader = getActiveReader();
    // Cache getCurrentSlot result — avoid calling twice
    const slotResult =
      scheduleMode && scheduleSlots.length > 0 ? getCurrentSlot() : null;
    const isOverride = !!manualReaderOverride;

    if (els.activeReaderName) {
      els.activeReaderName.textContent = reader.startsWith("@")
        ? reader
        : "@" + reader;
      els.activeReaderName.style.color = isOverride
        ? "var(--green)"
        : "var(--accent)";
    }

    if (els.readerStatus) {
      if (isOverride) {
        els.readerStatus.innerHTML = "🎯 Bạn chọn · Lượt sau tự đổi";
        els.readerStatus.style.color = "var(--green)";
      } else if (slotResult) {
        const { currentSlot } = slotResult;
        const now = new Date();
        const slotEnd = slotToDate(
          currentSlot.endH,
          currentSlot.endM,
          true,
          currentSlot.startH,
        );
        const minsLeft = Math.max(0, Math.round((slotEnd - now) / 60000));
        els.readerStatus.innerHTML = `📅 ${currentSlot.startH}h–${currentSlot.endH}h · Còn ${minsLeft}p`;
        els.readerStatus.style.color = "var(--text-dim)";
      } else if (scheduleMode && scheduleSlots.length > 0) {
        els.readerStatus.textContent = "⏳ Ngoài giờ làm việc";
        els.readerStatus.style.color = "var(--text-muted)";
      } else if (readerList.length > 1 && autoRotate) {
        const nextIdx = (activeReaderIdx + 1) % readerList.length;
        els.readerStatus.innerHTML = `🔄 Tiếp: @${readerList[nextIdx]} (${activeReaderIdx + 1}/${readerList.length})`;
        els.readerStatus.style.color = "var(--text-dim)";
      } else if (readerList.length > 1) {
        els.readerStatus.innerHTML = `🔒 Cố định @${readerList[activeReaderIdx]}`;
        els.readerStatus.style.color = "var(--text-dim)";
      } else if (readerList.length === 1) {
        els.readerStatus.textContent = "✅ 1 Reader";
        els.readerStatus.style.color = "var(--text-dim)";
      } else {
        els.readerStatus.textContent = "⬇️ Gõ tên bên dưới để thêm";
        els.readerStatus.style.color = "var(--text-muted)";
      }
    }

    renderReaderChips();
  }

  function renderReaderChips() {
    if (!els.readerChips) return;
    if (readerList.length === 0) {
      els.readerChips.innerHTML = "";
      return;
    }

    const active = getActiveReader().replace(/^@/, "");
    const frag = document.createDocumentFragment();
    readerList.forEach((r, i) => {
      const chip = document.createElement("span");
      chip.className = `tqs-chip ${r === active ? "tqs-chip-active" : ""}`;
      chip.dataset.reader = r;
      chip.dataset.idx = i;

      if (readerList.length > 1) {
        const badge = document.createElement("span");
        badge.className = "tqs-chip-num";
        badge.textContent = i + 1;
        chip.appendChild(badge);
      }
      chip.appendChild(document.createTextNode(`@${r}`));

      const x = document.createElement("span");
      x.className = "tqs-chip-x";
      x.textContent = "×";
      x.dataset.removeIdx = i;
      chip.appendChild(x);
      frag.appendChild(chip);
    });
    els.readerChips.innerHTML = "";
    els.readerChips.appendChild(frag);
  }

  function addReader(name) {
    const n = name.trim();
    if (!n) return;
    if (readerList.includes(n)) {
      showToast(`@${n} đã có rồi`, "warning");
      return;
    }
    readerList.push(n);
    if (readerList.length === 1) activeReaderIdx = 0;
    syncSave({ savedReaders: readerList, activeReaderIdx });
    updateReaderDisplay();
    showToast(`✓ Đã thêm @${n}`);
  }

  function removeReader(idx) {
    if (idx < 0 || idx >= readerList.length) return;
    const removed = readerList.splice(idx, 1)[0];
    if (readerList.length === 0 || activeReaderIdx >= readerList.length) {
      activeReaderIdx = 0;
    }
    syncSave({ savedReaders: readerList, activeReaderIdx });
    updateReaderDisplay();
    showToast(`🗑️ Đã xóa @${removed}`);
  }

  function rotateReader() {
    manualReaderOverride = null;
    if (!autoRotate) return;
    if (scheduleMode && scheduleSlots.length > 0) {
      rotateScheduleReader();
    } else if (readerList.length > 1) {
      activeReaderIdx = (activeReaderIdx + 1) % readerList.length;
      syncSave({ activeReaderIdx });
    }
    updateReaderDisplay();
  }

  // ===== SCHEDULE SYSTEM =====
  function parseSchedule(text) {
    const lines = text.split("\n").filter((l) => l.trim());
    const slots = [];

    for (const line of lines) {
      const timeMatch = line.match(
        /(\d{1,2})(?:h|:(\d{2}))?\s*(?:[-–]|->?)\s*(\d{1,2})(?:h|:(\d{2}))?/i,
      );
      if (!timeMatch) continue;

      const startH = parseInt(timeMatch[1]);
      const startM = parseInt(timeMatch[2]) || 0;
      const endH = parseInt(timeMatch[3]);
      const endM = parseInt(timeMatch[4]) || 0;

      const readerMatches =
        line.match(/@([a-zA-ZÀ-ỹ0-9\s']{2,})(?=$|[-–,;(\n✨@:])/g) ||
        line.match(/@[^\s@][^@]*/g);

      if (!readerMatches?.length) continue;

      const readers = readerMatches
        .map((r) => r.replace(/^@/, "").trim())
        .filter((r) => r.length > 0);

      if (readers.length === 0) continue;
      slots.push({ startH, startM, endH, endM, readers });
    }

    slots.sort((a, b) => {
      const aS = a.startH < 8 ? a.startH + 24 : a.startH;
      const bS = b.startH < 8 ? b.startH + 24 : b.startH;
      return aS * 60 + a.startM - (bS * 60 + b.startM);
    });

    return slots;
  }

  function slotToDate(hour, minute, isEnd, startH) {
    const now = new Date();
    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute,
      0,
    );
    if (isEnd && hour < startH) d.setDate(d.getDate() + 1);
    if (now.getHours() < 8 && hour >= 20) d.setDate(d.getDate() - 1);
    return d;
  }

  function getCurrentSlot() {
    if (!scheduleSlots.length) return null;
    const now = new Date();
    for (let i = 0; i < scheduleSlots.length; i++) {
      const slot = scheduleSlots[i];
      const slotStart = slotToDate(
        slot.startH,
        slot.startM,
        false,
        slot.startH,
      );
      const slotEnd = slotToDate(slot.endH, slot.endM, true, slot.startH);
      if (now >= slotStart && now < slotEnd) {
        return {
          slot,
          slotIdx: i,
          currentSlot: slot,
          nextSlot: scheduleSlots[i + 1] || null,
        };
      }
    }
    return null;
  }

  function getScheduleReader() {
    const result = getCurrentSlot();
    if (!result) {
      // Fallback to manual list
      if (!readerList.length) return "";
      return readerList[activeReaderIdx] || readerList[0];
    }
    const { slot, slotIdx } = result;
    if (slot.readers.length === 1) return slot.readers[0];
    const key = `slot_${slotIdx}`;
    return slot.readers[(slotReaderIdx[key] || 0) % slot.readers.length];
  }

  function rotateScheduleReader() {
    const result = getCurrentSlot();
    if (!result || result.slot.readers.length <= 1) return;
    const key = `slot_${result.slotIdx}`;
    slotReaderIdx[key] =
      ((slotReaderIdx[key] || 0) + 1) % result.slot.readers.length;
    updateReaderDisplay();
  }

  function startScheduleTimer() {
    if (scheduleTimerId) clearInterval(scheduleTimerId);
    scheduleTimerId = setInterval(updateReaderDisplay, 60000);
    updateReaderDisplay();
  }

  // ===== DROPDOWN LOGIC =====
  function populateServices() {
    const page = detectedPage;
    if (!page || !PRICING_DATA[page]) return;

    const frag = document.createDocumentFragment();
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "-- Dịch vụ --";
    frag.appendChild(defaultOpt);

    Object.keys(PRICING_DATA[page].services).forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      frag.appendChild(opt);
    });

    els.serviceSelect.innerHTML = "";
    els.serviceSelect.appendChild(frag);
    els.packageSelect.innerHTML = '<option value="">-- Gói --</option>';
    currentPrice = 0;
    els.priceDisplay.textContent = "0k";
    els.priceDisplay.classList.remove("tqs-price-active");
  }

  function populatePackages() {
    const page = detectedPage;
    if (!page || !PRICING_DATA[page]) return;
    const service = els.serviceSelect.value;

    els.packageSelect.innerHTML = '<option value="">-- Gói --</option>';
    currentPrice = 0;
    els.priceDisplay.textContent = "0k";
    els.priceDisplay.classList.remove("tqs-price-active");

    if (!service) return;

    const packages = PRICING_DATA[page].services[service];
    if (!packages) return;

    const frag = document.createDocumentFragment();
    Object.entries(packages).forEach(([pkg, price]) => {
      const opt = document.createElement("option");
      opt.value = pkg;
      opt.textContent = `${pkg} — ${price}k`;
      opt.dataset.price = price;
      frag.appendChild(opt);
    });
    els.packageSelect.appendChild(frag);
  }

  function updatePrice() {
    if (els.customMode?.checked) {
      currentPrice = parseInt(els.customPrice?.value) || 0;
    } else {
      const opt = els.packageSelect?.options[els.packageSelect.selectedIndex];
      currentPrice = opt?.dataset.price ? parseInt(opt.dataset.price) : 0;
    }
    els.priceDisplay.textContent = currentPrice + "k";
    els.priceDisplay.classList.toggle("tqs-price-active", currentPrice > 0);
  }

  // ===== CUSTOM MODE =====
  function toggleCustomMode() {
    if (!els.customMode) return;
    const isCustom = els.customMode.checked;
    els.customInputs?.classList.toggle("tqs-hidden", !isCustom);
    if (els.serviceSelect) els.serviceSelect.disabled = isCustom;
    if (els.packageSelect) els.packageSelect.disabled = isCustom;
    updatePrice();
  }

  // ===== DASHBOARD =====
  function updateDashboard() {
    const revenue = shiftOrders.reduce((s, o) => s + o.price, 0);
    if (els.totalOrders) els.totalOrders.textContent = shiftOrders.length;
    if (els.totalRevenue) els.totalRevenue.textContent = revenue + "k";
    renderOrderList();
  }

  // ===== ORDER LIST =====
  function renderOrderList() {
    if (!shiftOrders.length) {
      els.orderList.innerHTML =
        '<div class="tqs-order-empty">Chưa có đơn nào</div>';
      return;
    }

    const fmtTime = (d) =>
      new Date(d).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    const frag = document.createDocumentFragment();

    shiftOrders.forEach((o, i) => {
      const div = document.createElement("div");
      div.className = "tqs-order-item";
      div.dataset.id = o.id;
      div.innerHTML = `
        <div class="tqs-order-num">${i + 1}</div>
        <div class="tqs-order-info">
          <div class="tqs-order-main">
            <span class="tqs-order-page">[${o.pageName}]</span>
            <span class="tqs-order-pkg">${o.packageDisplay}</span>
            <span class="tqs-order-price">${o.price}k</span>
          </div>
          <div class="tqs-order-detail">${o.customer} · @${o.reader} · ${fmtTime(o.timestamp)}</div>
        </div>
        <div class="tqs-order-actions">
          <button class="tqs-order-btn tqs-edit-btn" data-id="${o.id}" title="Sửa">✏️</button>
          <button class="tqs-order-btn tqs-delete-btn" data-id="${o.id}" title="Xóa">✕</button>
        </div>`;
      frag.appendChild(div);
    });

    els.orderList.innerHTML = "";
    els.orderList.appendChild(frag);
  }

  // ===== EDIT ORDER =====
  function openEditOrder(id) {
    const order = shiftOrders.find((o) => o.id === id);
    if (!order) return;
    editingOrderId = id;
    els.editCustomer.value = order.customer;
    els.editReader.value = order.reader;
    els.editPackage.value = order.packageDisplay;
    els.editPrice.value = order.price;
    els.editNote.value = order.note || "";
    els.editModal.classList.remove("tqs-hidden");
  }

  async function saveEditOrder() {
    if (editingOrderId === null) return;
    const data = await chrome.storage.local.get(["shiftOrders"]);
    const latest = data.shiftOrders || [];
    const idx = latest.findIndex((o) => o.id === editingOrderId);
    if (idx === -1) {
      showToast("Đơn không tồn tại!", "error");
      els.editModal.classList.add("tqs-hidden");
      editingOrderId = null;
      return;
    }
    latest[idx].customer = els.editCustomer.value.trim();
    latest[idx].reader = els.editReader.value.trim();
    latest[idx].packageDisplay = els.editPackage.value.trim();
    latest[idx].price = parseInt(els.editPrice.value) || 0;
    latest[idx].note = els.editNote.value.trim();
    shiftOrders = latest;
    await chrome.storage.local.set({ shiftOrders });
    els.editModal.classList.add("tqs-hidden");
    editingOrderId = null;
    updateDashboard();
    showToast("✓ Đã sửa!");
  }

  async function deleteOrder(id) {
    const data = await chrome.storage.local.get(["shiftOrders"]);
    const latest = data.shiftOrders || [];
    const idx = latest.findIndex((o) => o.id === id);
    if (idx === -1) return;
    const o = latest[idx];

    const ok = await showConfirm(`Xóa đơn <b>${o.customer}</b> — ${o.price}k?`);
    if (!ok) return;

    latest.splice(idx, 1);
    shiftOrders = latest;
    await chrome.storage.local.set({ shiftOrders });
    updateDashboard();
    showToast("✓ Đã xóa!");
  }

  // ===== GENERATE MESSAGE =====
  function generateMessage() {
    const page = detectedPage;
    const pageName = PRICING_DATA[page]?.name || page;
    const customer = (els.customerInput?.value || "").trim();
    const reader = getActiveReader().replace(/^@/, "");
    const note = (els.noteInput?.value || "").trim();

    let packageDisplay = "";
    if (els.customMode.checked) {
      packageDisplay = els.customName.value.trim();
    } else {
      const service = els.serviceSelect.value;
      const pkg = els.packageSelect.value;
      const serviceAbbr = SERVICE_ABBR[service] ?? service;
      const pkgAbbr = PACKAGE_ABBR[pkg] ?? pkg;

      if (page === "CA" && service === "Câu Lẻ") {
        packageDisplay = pkgAbbr;
      } else if (service.startsWith("⏱")) {
        packageDisplay = [serviceAbbr, pkgAbbr].filter(Boolean).join(" ");
      } else {
        packageDisplay = [pkgAbbr, serviceAbbr].filter(Boolean).join(" ");
      }
    }

    let msg = `[${pageName}] ${packageDisplay} - ${currentPrice}k ${customer} @${reader}`;
    if (note) msg += ` ${note}`;
    return msg;
  }

  // ===== VALIDATE =====
  function validateForm() {
    if (!els.customerInput?.value.trim()) {
      showToast("Nhập tên khách!", "error");
      els.customerInput?.focus();
      return false;
    }
    if (
      readerList.length === 0 &&
      !(scheduleMode && scheduleSlots.length > 0)
    ) {
      showToast("Thiết lập Reader trước!", "error");
      return false;
    }
    if (els.customMode.checked) {
      if (!els.customName.value.trim()) {
        showToast("Nhập tên gói!", "error");
        els.customName.focus();
        return false;
      }
      if (!els.customPrice.value || parseInt(els.customPrice.value) <= 0) {
        showToast("Nhập giá!", "error");
        els.customPrice.focus();
        return false;
      }
    } else {
      if (!els.serviceSelect.value) {
        showToast("Chọn nhóm dịch vụ!", "error");
        return false;
      }
      if (!els.packageSelect.value) {
        showToast("Chọn gói!", "error");
        return false;
      }
    }
    return true;
  }

  // ===== SAVE ORDER =====
  async function saveOrder() {
    if (!shiftStartTime) shiftStartTime = new Date().toISOString();

    const order = {
      id: Date.now(),
      page: detectedPage,
      pageName: PRICING_DATA[detectedPage]?.name || detectedPage,
      customer: els.customerInput.value.trim(),
      reader: getActiveReader().replace(/^@/, ""),
      service: els.customMode.checked ? "Custom" : els.serviceSelect.value,
      package: els.customMode.checked
        ? els.customName.value.trim()
        : els.packageSelect.value,
      packageDisplay: els.customMode.checked
        ? els.customName.value.trim()
        : generateMessage().split(/\s-\s/)[0].split("] ")[1] || "",
      price: currentPrice,
      note: els.noteInput.value.trim(),
      timestamp: new Date().toISOString(),
    };

    const data = await chrome.storage.local.get([
      "shiftOrders",
      "shiftStartTime",
    ]);
    const latest = data.shiftOrders || [];
    latest.push(order);
    shiftOrders = latest;
    if (!shiftStartTime && data.shiftStartTime)
      shiftStartTime = data.shiftStartTime;

    await chrome.storage.local.set({
      shiftOrders,
      shiftStartTime,
      activeReaderIdx,
    });
    updateDashboard();
  }

  // ===== RESET FORM =====
  function resetForm() {
    if (els.customerInput) els.customerInput.value = "";
    if (!els.customMode?.checked) {
      if (els.serviceSelect) els.serviceSelect.value = "";
      if (els.packageSelect)
        els.packageSelect.innerHTML = '<option value="">-- Gói --</option>';
    } else {
      if (els.customName) els.customName.value = "";
      if (els.customPrice) els.customPrice.value = "";
    }
    if (els.noteInput) els.noteInput.value = "";
    currentPrice = 0;
    if (els.priceDisplay) {
      els.priceDisplay.textContent = "0k";
      els.priceDisplay.classList.remove("tqs-price-active");
    }
    if (els.customerInput) els.customerInput.focus();
  }

  // ===== COPY AND SAVE =====
  async function copyAndSave() {
    if (!validateForm()) return;
    const message = generateMessage();
    try {
      await navigator.clipboard.writeText(message);
      await saveOrder();
      rotateReader();
      showToast("✓ Đã copy!");
      resetForm();
    } catch {
      showToast("Lỗi!", "error");
    }
  }

  // ===== SEND TO MESSENGER =====
  async function sendToMessenger() {
    if (!validateForm()) return;
    const message = generateMessage();

    // Show platform row briefly
    els.platformRow?.classList.remove("tqs-hidden");

    const platformRadio = panel.querySelector('input[name="platform"]:checked');
    const platform = platformRadio ? platformRadio.value : "facebook";

    try {
      await navigator.clipboard.writeText(message);
      showToast("⏳ Đang gửi...", "warning");
      if (els.sendMsgBtn) {
        els.sendMsgBtn.disabled = true;
        els.sendMsgBtn.textContent = "⏳...";
      }

      chrome.runtime.sendMessage(
        { action: "instantSend", message, platform },
        async (response) => {
          if (els.sendMsgBtn) {
            els.sendMsgBtn.disabled = false;
            els.sendMsgBtn.textContent = "📤 Gửi Msg";
          }
          await saveOrder();
          rotateReader();
          resetForm();
          if (response?.success) {
            showToast("✓ Đã gửi!");
          } else {
            showToast(
              "📋 " + (response?.error || "Paste Ctrl+V và Enter"),
              "warning",
            );
          }
        },
      );
    } catch {
      if (els.sendMsgBtn) {
        els.sendMsgBtn.disabled = false;
        els.sendMsgBtn.textContent = "📤 Gửi Msg";
      }
      showToast("Lỗi! Đã copy.", "error");
    }
  }

  // ===== DEBOUNCED SYNC SAVE =====
  let _syncTimer = null;
  function syncSave(data) {
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => chrome.storage.local.set(data), 200);
  }

  // ===== BUILD REPORT =====
  function buildReport() {
    const revenue = shiftOrders.reduce((s, o) => s + o.price, 0);
    const salary = Math.floor(revenue * 0.05);
    const now = new Date();
    const startTime = shiftStartTime ? new Date(shiftStartTime) : now;
    const fmtDate = (d) =>
      d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    const fmtTime = (d) =>
      d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    const byPage = {};
    shiftOrders.forEach((o) => {
      if (!byPage[o.pageName]) byPage[o.pageName] = [];
      byPage[o.pageName].push(o);
    });

    const byReader = {};
    shiftOrders.forEach((o) => {
      const r = o.reader || "?";
      if (!byReader[r]) byReader[r] = { orders: 0, revenue: 0 };
      byReader[r].orders++;
      byReader[r].revenue += o.price;
    });

    let report = `═══════════════════════════════════════\n`;
    report += `  📊 BÁO CÁO CA TAROT\n`;
    report += `  📅 ${fmtDate(startTime)}  ⏰ ${fmtTime(startTime)} → ${fmtTime(now)}\n`;
    report += `═══════════════════════════════════════\n\n`;

    let orderNum = 0;
    for (const [pageName, orders] of Object.entries(byPage)) {
      const pageRevenue = orders.reduce((s, o) => s + o.price, 0);
      report += `┌─── ${pageName} (${orders.length} đơn • ${pageRevenue}k) ───\n│\n`;
      orders.forEach((o) => {
        orderNum++;
        report += `│  ${orderNum}. ${o.packageDisplay} - ${o.price}k\n`;
        report += `│     ${o.customer}  @${o.reader}\n`;
        report += `│     ${fmtTime(new Date(o.timestamp))}\n`;
        if (o.note) report += `│     📝 ${o.note}\n`;
      });
      report += `│\n└─── Tổng ${pageName}: ${pageRevenue}k\n\n`;
    }

    if (Object.keys(byReader).length > 1) {
      report += `┌─── 👤 THỐNG KÊ THEO READER ─────────\n│\n`;
      for (const [name, stat] of Object.entries(byReader)) {
        report += `│  @${name}: ${stat.orders} đơn · ${stat.revenue}k\n`;
      }
      report += `│\n└─────────────────────────────────────\n\n`;
    }

    report += `═══════════════════════════════════════\n`;
    report += `  📈 TỔNG KẾT\n`;
    report += `  Đơn:    ${shiftOrders.length}\n`;
    report += `  Tiền:   ${revenue}k\n`;
    report += `  Lương:  ${salary}k (5%)\n`;
    report += `═══════════════════════════════════════\n`;
    return report;
  }

  async function copyReport() {
    if (!shiftOrders.length) {
      showToast("Chưa có đơn!", "warning");
      return;
    }
    try {
      await navigator.clipboard.writeText(buildReport());
      showToast("✓ Đã copy báo cáo!");
    } catch {
      showToast("Lỗi!", "error");
    }
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
          <button id="_c-ok" style="flex:1;padding:8px;border:none;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">Xác nhận</button>
        </div>`;
      overlay.appendChild(card);
      panel.appendChild(overlay);
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

  // ===== RESET SHIFT =====
  async function resetShift() {
    if (!shiftOrders.length) {
      showToast("Chưa có đơn!", "warning");
      return;
    }
    const total = shiftOrders.reduce((s, o) => s + o.price, 0);
    const ok = await showConfirm(
      `Reset ca? <br><b style="color:#22c55e">${shiftOrders.length} đơn · ${total}k</b>`,
    );
    if (!ok) return;

    const archive = {
      id: Date.now(),
      startTime: shiftStartTime || new Date().toISOString(),
      endTime: new Date().toISOString(),
      orders: [...shiftOrders],
      totalOrders: shiftOrders.length,
      totalRevenue: total,
    };
    const data = await chrome.storage.local.get(["shiftHistory"]);
    const history = data.shiftHistory || [];
    history.unshift(archive);
    if (history.length > 30) history.length = 30;

    shiftOrders = [];
    shiftStartTime = null;
    await chrome.storage.local.set({
      shiftOrders: [],
      shiftStartTime: null,
      shiftHistory: history,
    });
    updateDashboard();
    showToast("✓ Đã lưu và reset!");
  }

  // ===== LOAD DATA =====
  async function loadData() {
    try {
      const data = await chrome.storage.local.get([
        "savedReaders",
        "activeReaderIdx",
        "autoRotate",
        "schedule",
        "scheduleSlots",
        "scheduleMode",
        "slotReaderIdx",
        "shiftOrders",
        "shiftStartTime",
      ]);

      if (Array.isArray(data.savedReaders)) readerList = data.savedReaders;
      if (typeof data.activeReaderIdx === "number") {
        activeReaderIdx =
          readerList.length > 0 ? data.activeReaderIdx % readerList.length : 0;
      }
      if (typeof data.autoRotate !== "undefined") autoRotate = data.autoRotate;
      if (els.autoRotateToggle) els.autoRotateToggle.checked = autoRotate;

      if (data.schedule && els.scheduleInput)
        els.scheduleInput.value = data.schedule;
      if (Array.isArray(data.scheduleSlots)) {
        scheduleSlots = data.scheduleSlots;
        slotReaderIdx = data.slotReaderIdx || {};
        startScheduleTimer();
      }
      scheduleMode =
        typeof data.scheduleMode !== "undefined"
          ? data.scheduleMode
          : scheduleSlots.length > 0;
      if (els.scheduleModeToggle) els.scheduleModeToggle.checked = scheduleMode;

      if (data.shiftStartTime) shiftStartTime = data.shiftStartTime;
      if (Array.isArray(data.shiftOrders)) shiftOrders = data.shiftOrders;

      updateReaderDisplay();
      updateDashboard();
    } catch {
      /* silent fail */
    }
  }

  // ===== DRAG =====
  function initDrag() {
    els.header.addEventListener("mousedown", (e) => {
      if (e.target.closest(".tqs-header-btn")) return;
      isDragging = true;
      const rect = panel.getBoundingClientRect();
      dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      panel.style.transition = "none";
    });
    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = Math.max(
        0,
        Math.min(
          e.clientX - dragOffset.x,
          window.innerWidth - panel.offsetWidth,
        ),
      );
      const y = Math.max(
        0,
        Math.min(
          e.clientY - dragOffset.y,
          window.innerHeight - panel.offsetHeight,
        ),
      );
      panel.style.left = x + "px";
      panel.style.top = y + "px";
      panel.style.right = "auto";
    });
    document.addEventListener("mouseup", () => {
      isDragging = false;
      panel.style.transition = "";
    });
  }

  // ===== PANEL CONTROLS =====
  function initControls() {
    els.closeBtn.addEventListener("click", () => {
      panel.classList.add("tqs-hidden");
      els.toggleBtn.classList.remove("tqs-hidden");
    });
    els.minimizeBtn.addEventListener("click", () => {
      const mini = panel.classList.toggle("tqs-minimized");
      els.minimizeBtn.textContent = mini ? "□" : "─";
    });
    els.toggleBtn.addEventListener("click", () => {
      panel.classList.remove("tqs-hidden");
      els.toggleBtn.classList.add("tqs-hidden");
    });
  }

  // ===== EVENTS =====
  function initEvents() {
    els.serviceSelect?.addEventListener("change", populatePackages);
    els.packageSelect?.addEventListener("change", updatePrice);
    els.customMode?.addEventListener("change", toggleCustomMode);
    els.customPrice?.addEventListener("input", updatePrice);

    els.scheduleBtn?.addEventListener("click", () => {
      els.scheduleModal.classList.remove("tqs-hidden");
      els.scheduleInput.focus();
    });

    els.readerAddInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addReader(els.readerAddInput.value);
        els.readerAddInput.value = "";
      }
    });

    els.readerChips?.addEventListener("click", (e) => {
      const xBtn = e.target.closest(".tqs-chip-x");
      if (xBtn) {
        e.stopPropagation();
        removeReader(parseInt(xBtn.dataset.removeIdx));
        return;
      }
      const chip = e.target.closest(".tqs-chip");
      if (chip?.dataset.reader) {
        manualReaderOverride = chip.dataset.reader;
        updateReaderDisplay();
        showToast(`🎯 1 lượt: @${chip.dataset.reader}`);
      }
    });

    els.autoRotateToggle?.addEventListener("change", () => {
      autoRotate = els.autoRotateToggle.checked;
      chrome.storage.local.set({ autoRotate });
      updateReaderDisplay();
      showToast(autoRotate ? "🔄 Tự đổi: Bật" : "🔒 Cố định: Tắt");
    });

    els.scheduleModeToggle?.addEventListener("change", () => {
      scheduleMode = els.scheduleModeToggle.checked;
      chrome.storage.local.set({ scheduleMode });
      if (scheduleMode && scheduleSlots.length > 0) {
        startScheduleTimer();
      } else if (scheduleTimerId) {
        clearInterval(scheduleTimerId);
        scheduleTimerId = null;
      }
      updateReaderDisplay();
    });

    els.scheduleClose?.addEventListener("click", () =>
      els.scheduleModal.classList.add("tqs-hidden"),
    );

    els.scheduleParse?.addEventListener("click", () => {
      const text = els.scheduleInput.value;
      const slots = parseSchedule(text);
      if (slots.length > 0) {
        scheduleSlots = slots;
        scheduleMode = true;
        const allReaders = [...new Set(slots.flatMap((s) => s.readers))];
        if (allReaders.length > 0) {
          readerList = allReaders;
          activeReaderIdx = 0;
        }
        if (els.scheduleModeToggle) els.scheduleModeToggle.checked = true;
        chrome.storage.local.set({
          schedule: text,
          scheduleSlots: slots,
          scheduleMode: true,
          savedReaders: readerList,
        });
        showToast(`✓ ${slots.length} ca · ${allReaders.join(", ")}`);
        els.scheduleModal.classList.add("tqs-hidden");
        startScheduleTimer();
        updateReaderDisplay();
      } else {
        showToast("⚠️ Không tìm thấy ca/reader nào!", "error");
      }
    });

    els.copySaveBtn?.addEventListener("click", copyAndSave);
    els.sendMsgBtn?.addEventListener("click", sendToMessenger);
    els.resetBtn?.addEventListener("click", resetShift);
    els.reportBtn?.addEventListener("click", copyReport);

    els.orderList?.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".tqs-edit-btn");
      const delBtn = e.target.closest(".tqs-delete-btn");
      if (editBtn) openEditOrder(parseInt(editBtn.dataset.id));
      if (delBtn) deleteOrder(parseInt(delBtn.dataset.id));
    });

    els.editSave?.addEventListener("click", saveEditOrder);
    els.editCancel?.addEventListener("click", () => {
      els.editModal.classList.add("tqs-hidden");
      editingOrderId = null;
    });

    els.customerInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") els.serviceSelect.focus();
    });
    els.noteInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") copyAndSave();
    });
    els.customPrice?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") copyAndSave();
    });
  }

  // ===== CROSS-TAB SYNC =====
  if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      let needsReader = false;
      let needsDash = false;

      if (changes.shiftOrders) {
        shiftOrders = changes.shiftOrders.newValue || [];
        needsDash = true;
      }
      if (
        changes.activeReaderIdx &&
        typeof changes.activeReaderIdx.newValue === "number"
      ) {
        activeReaderIdx = changes.activeReaderIdx.newValue;
        needsReader = true;
      }
      if (changes.savedReaders) {
        readerList = changes.savedReaders.newValue || [];
        needsReader = true;
      }
      if (changes.autoRotate) {
        autoRotate = changes.autoRotate.newValue;
        if (els.autoRotateToggle) els.autoRotateToggle.checked = autoRotate;
        needsReader = true;
      }
      if (changes.scheduleSlots) {
        scheduleSlots = changes.scheduleSlots.newValue || [];
        slotReaderIdx = {};
        needsReader = true;
      }
      if (changes.slotReaderIdx) {
        slotReaderIdx = changes.slotReaderIdx.newValue || {};
        needsReader = true;
      }
      if (changes.scheduleMode) {
        scheduleMode = changes.scheduleMode.newValue;
        if (els.scheduleModeToggle)
          els.scheduleModeToggle.checked = scheduleMode;
        needsReader = true;
      }

      if (needsDash) updateDashboard();
      if (needsReader) updateReaderDisplay();
    });
  }

  // ===== KEYBOARD SHORTCUT: Alt+T =====
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key === "t") {
      e.preventDefault();
      const isHidden = panel.classList.contains("tqs-hidden");
      panel.classList.toggle("tqs-hidden", !isHidden);
      els.toggleBtn.classList.toggle("tqs-hidden", isHidden);
    }
  });

  // ===== LISTEN FOR TOGGLE FROM EXTENSION ICON =====
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "togglePanel") {
      panel.classList.toggle("tqs-hidden");
      els.toggleBtn.classList.toggle(
        "tqs-hidden",
        !panel.classList.contains("tqs-hidden"),
      );
    }
  });

  // ===== LOAD PRICING FROM price.json =====
  async function loadPricingData() {
    const url = chrome.runtime.getURL("price.json");
    const res = await fetch(url);
    const data = await res.json();
    const { _comment, ...pricing } = data;
    return pricing;
  }

  // ===== INIT =====
  async function init() {
    try {
      PRICING_DATA = await loadPricingData();
    } catch {
      showToast("Lỗi load dữ liệu giá!", "error");
      return;
    }

    // Update page badge color now that PRICING_DATA is loaded
    if (detectedPage && PRICING_DATA[detectedPage]) {
      const badge = panel.querySelector(".tqs-page-badge");
      if (badge) {
        const color = PRICING_DATA[detectedPage].color || "cyan";
        badge.className = `tqs-page-badge tqs-badge-${color}`;
        badge.textContent = PRICING_DATA[detectedPage].name;
      }
    }

    await loadData();
    populateServices();
    initDrag();
    initControls();
    initEvents();
    if (els.customerInput) els.customerInput.focus();
  }

  init();
})();
