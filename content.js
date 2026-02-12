// ===== TAROT QUICKSALE CONTENT SCRIPT V1.1 =====
(function () {
  "use strict";

  // Check if already injected
  if (document.getElementById("tarot-quicksale-panel")) return;

  // ===== PAGE DETECTION CONFIG =====
  const PAGE_IDS = {
    918768421315641: "POBO", // Pờ Bơ
    513140915211900: "DUA", // Dừa
    105889999207829: "CA", // Cá
  };

  // Messenger group for sending messages
  const MESSENGER_GROUP_URL = "https://www.messenger.com/t/623973524119607";

  // ===== DATA STRUCTURE (synced with price.json) =====
  const PRICING_DATA = {
    CA: {
      name: "CÁ",
      note: "Trải Đặc Biệt kết hợp Tarot và Lenormand giúp đào sâu vấn đề.",
      services: {
        "Câu Lẻ": { "Y/N": 9, "CS Tarot": 20, "CS Đặc Biệt": 25 },
        "Combo 3 Câu": { "CS Tarot": 50, "CS Đặc Biệt": 70 },
        "Combo Full 6 Câu": { "CS Tarot": 90, "CS Đặc Biệt": 120 },
      },
    },
    DUA: {
      name: "DỪA",
      services: {
        "Trải Tarot": {
          "1 Y/N": 9,
          "3 CB": 40,
          "6 CB": 65,
          "1 CS": 20,
          "3 CS": 55,
          "4 CS": 70,
          "6 CS": 100,
        },
        Lenormand: {
          "1 Y/N": 15,
          "3 CB": 60,
          "6 CB": 95,
          "1 CS": 30,
          "3 CS": 85,
          "4 CS": 110,
          "6 CS": 155,
        },
        "Bài Tây": {
          "1 Y/N": 20,
          "3 CB": 70,
          "6 CB": 115,
          "1 CS": 40,
          "3 CS": 110,
          "4 CS": 145,
          "6 CS": 210,
        },
        "⏱ Gói 30 Phút": { Tarot: 140, Lenormand: 160, "Bài Tây": 200 },
        "⏱ Gói 45 Phút": { Tarot: 200, Lenormand: 230, "Bài Tây": 280 },
        "⏱ Gói 60 Phút": { Tarot: 270, Lenormand: 300, "Bài Tây": 380 },
      },
    },
    POBO: {
      name: "PỜ BƠ",
      services: {
        Tarot: {
          "1 Y/N": 9,
          "1 CS": 20,
          "3 CS": 55,
          "5 CS": 85,
          "7 CS": 115,
        },
        Lenormand: {
          "1 Y/N": 12,
          "1 CS": 25,
          "3 CS": 70,
          "5 CS": 110,
          "7 CS": 145,
        },
        "Bài Tây": {
          "1 Y/N": 18,
          "1 CS": 35,
          "3 CS": 95,
          "5 CS": 155,
          "7 CS": 200,
        },
        "⏱ Gói Thời Gian": {
          "30 Phút": 150,
          "45 Phút": 200,
          "60 Phút": 250,
          "+ Lenormand": 15,
          "+ Bài Tây": 20,
        },
      },
    },
  };

  // Abbreviations for output message
  const SERVICE_ABBR = {
    "Trải Tarot": "TA",
    Tarot: "TA",
    Lenormand: "LENOR",
    "Bài Tây": "TÂY",
    "Câu Lẻ": "",
    "Combo 3 Câu": "3C",
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
    "1 Y/N": "1 Y/N",
    "1 CS": "1 CS",
    "3 CB": "3 CB",
    "6 CB": "6 CB",
    "3 CS": "3 CS",
    "4 CS": "4 CS",
    "5 CS": "5 CS",
    "6 CS": "6 CS",
    "7 CS": "7 CS",
    Tarot: "TA",
    Lenormand: "LENOR",
    "Bài Tây": "TÂY",
    "30 Phút": "30p",
    "45 Phút": "45p",
    "60 Phút": "60p",
    "+ Lenormand": "+LENOR",
    "+ Bài Tây": "+TÂY",
  };

  // ===== STATE =====
  let currentPrice = 0;
  let shiftOrders = [];
  let shiftStartTime = null;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let detectedPage = null;

  // Reader state
  let readerList = [];        // e.g. ['Hậu', 'Mai']
  let activeReaderIdx = 0;    // current reader index
  let dualReaderMode = false; // 2-reader shuffle mode

  // ===== DETECT PAGE FROM URL =====
  function detectPageFromURL() {
    const url = window.location.href;
    const params = new URLSearchParams(window.location.search);

    // Check page_id or asset_id
    const pageId = params.get("page_id") || params.get("asset_id");

    if (pageId && PAGE_IDS[pageId]) {
      return PAGE_IDS[pageId];
    }

    // Fallback: check URL for any matching ID
    for (const [id, page] of Object.entries(PAGE_IDS)) {
      if (url.includes(id)) {
        return page;
      }
    }

    return null;
  }

  // ===== CREATE HTML =====
  function createPanelHTML() {
    const detected = detectPageFromURL();
    detectedPage = detected;

    return `
      <div class="tqs-header" id="tqs-drag-handle">
        <span class="tqs-logo">🔮 Tarot QuickSale</span>
        <div class="tqs-header-right">
          ${detected ? `<span class="tqs-page-badge">📍 ${PRICING_DATA[detected].name}</span>` : ""}
          <div class="tqs-header-buttons">
            <button class="tqs-header-btn tqs-minimize" id="tqs-minimize" title="Thu nhỏ">─</button>
            <button class="tqs-header-btn tqs-close" id="tqs-close" title="Đóng">✕</button>
          </div>
        </div>
      </div>

      <div class="tqs-book">
        <!-- ===== LEFT PAGE: Lịch sử ===== -->
        <div class="tqs-page tqs-page-left">
          <div class="tqs-page-title">📊 Ca làm việc <span class="tqs-shift-time" id="tqs-shift-time"></span></div>

          <div class="tqs-stats-row">
            <div class="tqs-stat-pill">
              <span class="tqs-stat-num" id="tqs-total-orders">0</span>
              <span class="tqs-stat-lbl">đơn</span>
            </div>
            <div class="tqs-stat-pill">
              <span class="tqs-stat-num tqs-cyan" id="tqs-total-revenue">0k</span>
              <span class="tqs-stat-lbl">doanh thu</span>
            </div>
            <div class="tqs-stat-pill tqs-stat-accent">
              <span class="tqs-stat-num" id="tqs-salary">0k</span>
              <span class="tqs-stat-lbl">lương 5%</span>
            </div>
          </div>

          <div class="tqs-page-breakdown" id="tqs-page-breakdown"></div>

          <div class="tqs-order-list-wrap">
            <div class="tqs-order-list-head">
              <span>📝 Đơn hàng</span>
              <button class="tqs-toggle-list" id="tqs-toggle-list">▼</button>
            </div>
            <div class="tqs-order-list" id="tqs-order-list">
              <div class="tqs-order-empty">Chưa có đơn</div>
            </div>
          </div>

          <div class="tqs-left-actions">
            <button class="tqs-act-btn" id="tqs-report" title="Copy Báo Cáo">📋</button>
            <button class="tqs-act-btn tqs-act-save" id="tqs-download" title="Lưu TXT">💾</button>
            <button class="tqs-act-btn" id="tqs-view-history" title="Lịch Sử">📂</button>
            <button class="tqs-act-btn tqs-act-danger" id="tqs-reset" title="Reset">🔄</button>
          </div>
        </div>

        <!-- ===== SPINE ===== -->
        <div class="tqs-spine"></div>

        <!-- ===== RIGHT PAGE: Soạn đơn ===== -->
        <div class="tqs-page tqs-page-right">
          <div class="tqs-page-title">✍️ Soạn đơn</div>

          <!-- Reader Setup -->
          <div class="tqs-reader-section">
            <div class="tqs-reader-header">
              <span class="tqs-reader-title">👤 Reader</span>
              <label class="tqs-dual-toggle">
                <input type="checkbox" id="tqs-dual-mode">
                <span class="tqs-dual-label">2 Reader</span>
              </label>
            </div>
            <div class="tqs-reader-setup">
              <div class="tqs-reader-inputs">
                <input type="text" class="tqs-input tqs-reader-input" id="tqs-reader-1" placeholder="Reader 1">
                <input type="text" class="tqs-input tqs-reader-input tqs-hidden" id="tqs-reader-2" placeholder="Reader 2">
              </div>
              <button class="tqs-reader-set-btn" id="tqs-reader-set" title="Lưu">✓</button>
            </div>
            <div class="tqs-reader-chips" id="tqs-reader-chips"></div>
            <div class="tqs-reader-active" id="tqs-reader-active"></div>
          </div>

          <div class="tqs-form-group">
            <label>Page</label>
            <select class="tqs-select" id="tqs-page">
              <option value="CA" ${detected === "CA" ? "selected" : ""}>Cá</option>
              <option value="DUA" ${detected === "DUA" ? "selected" : ""}>Dừa</option>
              <option value="POBO" ${detected === "POBO" ? "selected" : ""}>Pờ Bơ</option>
            </select>
          </div>

          <div class="tqs-form-group">
            <label>Khách hàng</label>
            <input type="text" class="tqs-input" id="tqs-customer" placeholder="Tên khách">
          </div>

          <div class="tqs-form-row">
            <div class="tqs-form-group">
              <label>Dịch vụ</label>
              <select class="tqs-select" id="tqs-service">
                <option value="">-- Chọn --</option>
              </select>
            </div>
            <div class="tqs-form-group">
              <label>Gói</label>
              <select class="tqs-select" id="tqs-package">
                <option value="">-- Chọn --</option>
              </select>
            </div>
          </div>

          <div class="tqs-custom-section">
            <label class="tqs-checkbox-label">
              <input type="checkbox" id="tqs-custom-mode">
              <span class="tqs-checkmark"></span>
              Custom
            </label>
            <div class="tqs-custom-inputs tqs-hidden" id="tqs-custom-inputs">
              <div class="tqs-form-row">
                <div class="tqs-form-group">
                  <label>Gói</label>
                  <input type="text" class="tqs-input" id="tqs-custom-name" placeholder="3C CS TÂY">
                </div>
                <div class="tqs-form-group">
                  <label>Giá</label>
                  <input type="number" class="tqs-input" id="tqs-custom-price" placeholder="50">
                </div>
              </div>
            </div>
          </div>

          <div class="tqs-form-group">
            <label>Ghi chú</label>
            <input type="text" class="tqs-input" id="tqs-note" placeholder="(tùy chọn)">
          </div>

          <div class="tqs-price-bar">
            <span class="tqs-price-value" id="tqs-price">0k</span>
          </div>

          <div class="tqs-platform-row">
            <label class="tqs-platform-btn">
              <input type="radio" name="platform" value="facebook" checked>
              <span>FB Msg</span>
            </label>
            <label class="tqs-platform-btn">
              <input type="radio" name="platform" value="messenger">
              <span>Messenger</span>
            </label>
          </div>

          <div class="tqs-send-row">
            <button class="tqs-btn-copy" id="tqs-copy-save">📋 COPY</button>
            <button class="tqs-btn-send" id="tqs-send-msg">📤 GỬI</button>
          </div>
        </div>
      </div>

      <!-- ===== EDIT MODAL ===== -->
      <div class="tqs-edit-overlay tqs-hidden" id="tqs-edit-modal">
        <div class="tqs-edit-card">
          <div class="tqs-edit-title">✏️ Sửa đơn</div>
          <div class="tqs-form-group">
            <label>Khách hàng</label>
            <input type="text" class="tqs-input" id="tqs-edit-customer">
          </div>
          <div class="tqs-form-row">
            <div class="tqs-form-group">
              <label>Reader</label>
              <input type="text" class="tqs-input" id="tqs-edit-reader">
            </div>
            <div class="tqs-form-group">
              <label>Giá (k)</label>
              <input type="number" class="tqs-input" id="tqs-edit-price">
            </div>
          </div>
          <div class="tqs-form-row">
            <div class="tqs-form-group">
              <label>Gói</label>
              <input type="text" class="tqs-input" id="tqs-edit-package">
            </div>
            <div class="tqs-form-group">
              <label>Ghi chú</label>
              <input type="text" class="tqs-input" id="tqs-edit-note">
            </div>
          </div>
          <div class="tqs-edit-btns">
            <button class="tqs-ebtn tqs-ebtn-cancel" id="tqs-edit-cancel">Hủy</button>
            <button class="tqs-ebtn tqs-ebtn-save" id="tqs-edit-save">✓ Lưu</button>
          </div>
        </div>
      </div>
    `;
  }

  // ===== CREATE TOAST =====
  function createToast() {
    const toast = document.createElement("div");
    toast.className = "tqs-toast";
    toast.id = "tqs-toast";
    document.body.appendChild(toast);
    return toast;
  }

  // ===== CREATE TOGGLE BUTTON =====
  function createToggleButton() {
    const btn = document.createElement("button");
    btn.id = "tarot-quicksale-toggle";
    btn.innerHTML = "🔮";
    btn.title = "Mở Tarot QuickSale";
    document.body.appendChild(btn);
    return btn;
  }

  // ===== INJECT PANEL =====
  function injectPanel() {
    const panel = document.createElement("div");
    panel.id = "tarot-quicksale-panel";
    panel.innerHTML = createPanelHTML();
    document.body.appendChild(panel);

    createToast();
    const toggleBtn = createToggleButton();
    toggleBtn.classList.add("tqs-hidden");

    return panel;
  }

  // ===== ELEMENTS =====
  const panel = injectPanel();
  const els = {
    panel: panel,
    header: panel.querySelector("#tqs-drag-handle"),
    closeBtn: panel.querySelector("#tqs-close"),
    minimizeBtn: panel.querySelector("#tqs-minimize"),
    pageSelect: panel.querySelector("#tqs-page"),
    readerInput1: panel.querySelector("#tqs-reader-1"),
    readerInput2: panel.querySelector("#tqs-reader-2"),
    readerSetBtn: panel.querySelector("#tqs-reader-set"),
    readerChips: panel.querySelector("#tqs-reader-chips"),
    readerActive: panel.querySelector("#tqs-reader-active"),
    dualModeToggle: panel.querySelector("#tqs-dual-mode"),
    customerInput: panel.querySelector("#tqs-customer"),
    serviceSelect: panel.querySelector("#tqs-service"),
    packageSelect: panel.querySelector("#tqs-package"),
    customMode: panel.querySelector("#tqs-custom-mode"),
    customInputs: panel.querySelector("#tqs-custom-inputs"),
    customName: panel.querySelector("#tqs-custom-name"),
    customPrice: panel.querySelector("#tqs-custom-price"),
    noteInput: panel.querySelector("#tqs-note"),
    priceDisplay: panel.querySelector("#tqs-price"),
    copySaveBtn: panel.querySelector("#tqs-copy-save"),
    sendMsgBtn: panel.querySelector("#tqs-send-msg"),
    totalOrders: panel.querySelector("#tqs-total-orders"),
    totalRevenue: panel.querySelector("#tqs-total-revenue"),
    salary: panel.querySelector("#tqs-salary"),
    resetBtn: panel.querySelector("#tqs-reset"),
    reportBtn: panel.querySelector("#tqs-report"),
    downloadBtn: panel.querySelector("#tqs-download"),
    historyBtn: panel.querySelector("#tqs-view-history"),
    pageBreakdown: panel.querySelector("#tqs-page-breakdown"),
    shiftTimeEl: panel.querySelector("#tqs-shift-time"),
    orderList: panel.querySelector("#tqs-order-list"),
    toggleListBtn: panel.querySelector("#tqs-toggle-list"),
    editModal: panel.querySelector("#tqs-edit-modal"),
    editCustomer: panel.querySelector("#tqs-edit-customer"),
    editReader: panel.querySelector("#tqs-edit-reader"),
    editPackage: panel.querySelector("#tqs-edit-package"),
    editPrice: panel.querySelector("#tqs-edit-price"),
    editNote: panel.querySelector("#tqs-edit-note"),
    editCancel: panel.querySelector("#tqs-edit-cancel"),
    editSave: panel.querySelector("#tqs-edit-save"),
    toast: document.querySelector("#tqs-toast"),
    toggleBtn: document.querySelector("#tarot-quicksale-toggle"),
  };

  let editingOrderId = null;

  // ===== READER MANAGEMENT =====
  function setupReaders() {
    const r1 = els.readerInput1.value.trim();
    const r2 = els.readerInput2.value.trim();

    readerList = [];
    if (r1) readerList.push(r1);
    if (dualReaderMode && r2) readerList.push(r2);

    if (readerList.length === 0) {
      showToast("Nhập tên Reader!", "error");
      return;
    }

    activeReaderIdx = 0;
    chrome.storage.local.set({
      savedReaders: readerList,
      dualReaderMode: dualReaderMode,
    });

    renderReaderChips();
    showToast(`✓ ${readerList.length} reader`);
  }

  function renderReaderChips() {
    if (readerList.length === 0) {
      els.readerChips.innerHTML = "";
      els.readerActive.innerHTML = "";
      return;
    }

    let html = "";
    readerList.forEach((name, i) => {
      const isActive = i === activeReaderIdx;
      html += `<button class="tqs-chip ${isActive ? "tqs-chip-active" : ""}" data-idx="${i}">@${name}</button>`;
    });
    els.readerChips.innerHTML = html;

    // Show who's next
    const current = readerList[activeReaderIdx];
    if (dualReaderMode && readerList.length === 2) {
      els.readerActive.innerHTML = `<span class="tqs-reader-indicator">🎯 Lượt: <strong>@${current}</strong></span>`;
    } else {
      els.readerActive.innerHTML = `<span class="tqs-reader-indicator">🎯 @${current}</span>`;
    }
  }

  function getActiveReader() {
    if (readerList.length === 0) return "";
    return readerList[activeReaderIdx] || readerList[0];
  }

  function rotateReader() {
    if (dualReaderMode && readerList.length === 2) {
      activeReaderIdx = (activeReaderIdx + 1) % 2;
      renderReaderChips();
    }
  }

  // ===== UTILITY FUNCTIONS =====
  function showToast(message, type = "success") {
    els.toast.textContent = message;
    els.toast.className =
      "tqs-toast tqs-show" + (type !== "success" ? " tqs-" + type : "");
    setTimeout(() => {
      els.toast.className = "tqs-toast";
    }, 2500);
  }

  // ===== DROPDOWN LOGIC =====
  function populateServices() {
    const page = els.pageSelect.value;
    const services = PRICING_DATA[page].services;

    els.serviceSelect.innerHTML = '<option value="">-- Chọn --</option>';
    Object.keys(services).forEach((s) => {
      els.serviceSelect.innerHTML += `<option value="${s}">${s}</option>`;
    });

    els.packageSelect.innerHTML = '<option value="">-- Chọn --</option>';
    currentPrice = 0;
    els.priceDisplay.textContent = "0k";
  }

  function populatePackages() {
    const page = els.pageSelect.value;
    const service = els.serviceSelect.value;

    els.packageSelect.innerHTML = '<option value="">-- Chọn --</option>';

    if (!service) {
      currentPrice = 0;
      els.priceDisplay.textContent = "0k";
      return;
    }

    const packages = PRICING_DATA[page].services[service];
    Object.entries(packages).forEach(([pkg, price]) => {
      els.packageSelect.innerHTML += `<option value="${pkg}" data-price="${price}">${pkg} - ${price}k</option>`;
    });

    currentPrice = 0;
    els.priceDisplay.textContent = "0k";
  }

  function updatePrice() {
    if (els.customMode.checked) {
      currentPrice = parseInt(els.customPrice.value) || 0;
    } else {
      const opt = els.packageSelect.options[els.packageSelect.selectedIndex];
      currentPrice = opt && opt.dataset.price ? parseInt(opt.dataset.price) : 0;
    }
    els.priceDisplay.textContent = currentPrice + "k";
  }

  // ===== TOGGLE CUSTOM MODE =====
  function toggleCustomMode() {
    const isCustom = els.customMode.checked;
    els.customInputs.classList.toggle("tqs-hidden", !isCustom);
    els.serviceSelect.disabled = isCustom;
    els.packageSelect.disabled = isCustom;

    if (isCustom) {
      updatePrice();
    } else {
      updatePrice();
    }
  }

  // ===== DASHBOARD =====
  function updateDashboard() {
    const total = shiftOrders.length;
    const revenue = shiftOrders.reduce((s, o) => s + o.price, 0);
    const salary = Math.floor(revenue * 0.05);

    els.totalOrders.textContent = total;
    els.totalRevenue.textContent = revenue + "k";
    els.salary.textContent = salary + "k";

    // Per-page breakdown
    const byPage = {};
    shiftOrders.forEach((o) => {
      if (!byPage[o.pageName]) byPage[o.pageName] = { count: 0, revenue: 0 };
      byPage[o.pageName].count++;
      byPage[o.pageName].revenue += o.price;
    });

    let breakdownHTML = "";
    for (const [page, data] of Object.entries(byPage)) {
      breakdownHTML += `<div class="tqs-breakdown-row">
        <span class="tqs-breakdown-page">${page}</span>
        <span class="tqs-breakdown-info">${data.count} đơn • ${data.revenue}k</span>
      </div>`;
    }
    els.pageBreakdown.innerHTML = breakdownHTML;

    // Shift time
    if (shiftStartTime) {
      const start = new Date(shiftStartTime);
      els.shiftTimeEl.textContent = `(${start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })})`;
    }

    // Render order list
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

    let html = "";
    shiftOrders.forEach((o, i) => {
      html += `<div class="tqs-order-item" data-id="${o.id}">
        <div class="tqs-order-num">${i + 1}</div>
        <div class="tqs-order-info">
          <div class="tqs-order-main">
            <span class="tqs-order-page">[${o.pageName}]</span>
            <span class="tqs-order-pkg">${o.packageDisplay}</span>
            <span class="tqs-order-price">${o.price}k</span>
          </div>
          <div class="tqs-order-detail">
            ${o.customer} • @${o.reader} • ${fmtTime(o.timestamp)}
          </div>
        </div>
        <div class="tqs-order-actions">
          <button class="tqs-order-btn tqs-edit-btn" data-id="${o.id}" title="Sửa">✏️</button>
          <button class="tqs-order-btn tqs-delete-btn" data-id="${o.id}" title="Xóa">✕</button>
        </div>
      </div>`;
    });
    els.orderList.innerHTML = html;
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

  function saveEditOrder() {
    const idx = shiftOrders.findIndex((o) => o.id === editingOrderId);
    if (idx === -1) return;

    shiftOrders[idx].customer = els.editCustomer.value.trim();
    shiftOrders[idx].reader = els.editReader.value.trim();
    shiftOrders[idx].packageDisplay = els.editPackage.value.trim();
    shiftOrders[idx].price = parseInt(els.editPrice.value) || 0;
    shiftOrders[idx].note = els.editNote.value.trim();

    chrome.storage.local.set({ shiftOrders });
    els.editModal.classList.add("tqs-hidden");
    editingOrderId = null;
    updateDashboard();
    showToast("✓ Đã sửa!");
  }

  function deleteOrder(id) {
    const idx = shiftOrders.findIndex((o) => o.id === id);
    if (idx === -1) return;
    const o = shiftOrders[idx];
    if (!confirm(`Xóa đơn: ${o.customer} - ${o.price}k?`)) return;

    shiftOrders.splice(idx, 1);
    chrome.storage.local.set({ shiftOrders });
    updateDashboard();
    showToast("✓ Đã xóa!");
  }

  // ===== GENERATE MESSAGE =====
  function generateMessage() {
    const page = els.pageSelect.value;
    const pageName = PRICING_DATA[page].name;
    const customer = els.customerInput.value.trim();
    const reader = getActiveReader();
    const note = els.noteInput.value.trim();

    let packageDisplay = "";

    if (els.customMode.checked) {
      packageDisplay = els.customName.value.trim();
    } else {
      const service = els.serviceSelect.value;
      const pkg = els.packageSelect.value;
      const serviceAbbr = SERVICE_ABBR[service] || service;
      const pkgAbbr = PACKAGE_ABBR[pkg] || pkg;

      if (page === "CA") {
        // CÁ: "Câu Lẻ" → "Y/N" / "CS" / "ĐB"
        //      "Combo 3 Câu" → "3C CS" / "3C ĐB"
        //      "Combo Full 6 Câu" → "6C CS" / "6C ĐB"
        if (service === "Câu Lẻ") {
          packageDisplay = pkgAbbr;
        } else {
          packageDisplay = `${serviceAbbr} ${pkgAbbr}`;
        }
      } else if (service.startsWith("⏱")) {
        // Time-based packages: "30p TA" / "45p LENOR" / "+LENOR"
        if (serviceAbbr) {
          packageDisplay = `${serviceAbbr} ${pkgAbbr}`;
        } else {
          packageDisplay = `${pkgAbbr}`;
        }
      } else {
        // DỪA / PỜ BƠ standard: "1 CS TA" / "3 CB LENOR" / "7 CS TÂY"
        packageDisplay = `${pkgAbbr} ${serviceAbbr}`;
      }
    }

    // Format: [PAGE] PACKAGE - PRICEk CUSTOMER @READER
    let msg = `[${pageName}] ${packageDisplay} - ${currentPrice}k ${customer} @${reader.replace("@", "")}`;

    if (note) {
      msg += ` ${note}`;
    }

    return msg;
  }

  // ===== VALIDATE FORM =====
  function validateForm() {
    if (!els.customerInput.value.trim()) {
      showToast("Nhập tên khách!", "error");
      els.customerInput.focus();
      return false;
    }
    if (readerList.length === 0) {
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

  // ===== COPY AND SAVE =====
  async function copyAndSave() {
    if (!validateForm()) return;

    const message = generateMessage();

    try {
      await navigator.clipboard.writeText(message);
      saveOrder();
      showToast("✓ Đã copy!");
      resetForm();
    } catch (err) {
      console.error(err);
      showToast("Lỗi!", "error");
    }
  }

  // ===== SEND TO MESSENGER (INSTANT) =====
  async function sendToMessenger() {
    if (!validateForm()) return;

    const message = generateMessage();

    // Get selected platform
    const platformRadio = panel.querySelector('input[name="platform"]:checked');
    const platform = platformRadio ? platformRadio.value : "facebook";

    try {
      // Copy to clipboard as backup
      await navigator.clipboard.writeText(message);

      // Show sending status
      showToast("⏳ Đang gửi...", "warning");
      els.sendMsgBtn.disabled = true;
      els.sendMsgBtn.textContent = "⏳ Đang gửi...";

      // Send instant message via background
      chrome.runtime.sendMessage(
        {
          action: "instantSend",
          message: message,
          platform: platform,
        },
        (response) => {
          els.sendMsgBtn.disabled = false;
          els.sendMsgBtn.textContent = "📤 GỬI NGAY";

          if (response && response.success) {
            saveOrder();
            showToast("✓ Đã gửi tin nhắn!");
            resetForm();
          } else {
            // Fallback - message is in clipboard
            saveOrder();
            const errMsg = response?.error || "Paste Ctrl+V và Enter";
            showToast("📋 " + errMsg, "warning");
            resetForm();
          }
        },
      );
    } catch (err) {
      console.error(err);
      els.sendMsgBtn.disabled = false;
      els.sendMsgBtn.textContent = "📤 GỬI MESSENGER";
      showToast("Lỗi! Đã copy tin nhắn.", "error");
    }
  }

  // ===== SAVE ORDER =====
  function saveOrder() {
    // Start shift timer on first order
    if (!shiftStartTime) {
      shiftStartTime = new Date().toISOString();
    }

    const order = {
      id: Date.now(),
      page: els.pageSelect.value,
      pageName: PRICING_DATA[els.pageSelect.value].name,
      customer: els.customerInput.value.trim(),
      reader: getActiveReader(),
      service: els.customMode.checked ? "Custom" : els.serviceSelect.value,
      package: els.customMode.checked
        ? els.customName.value.trim()
        : els.packageSelect.value,
      packageDisplay: els.customMode.checked
        ? els.customName.value.trim()
        : `${els.serviceSelect.value} ${els.packageSelect.value}`,
      price: currentPrice,
      note: els.noteInput.value.trim(),
      timestamp: new Date().toISOString(),
    };

    shiftOrders.push(order);

    chrome.storage.local.set({
      shiftOrders: shiftOrders,
      shiftStartTime: shiftStartTime,
    });

    updateDashboard();
    rotateReader(); // Switch to next reader in dual mode
  }

  // ===== RESET FORM =====
  function resetForm() {
    els.customerInput.value = "";
    if (!els.customMode.checked) {
      els.serviceSelect.value = "";
      els.packageSelect.innerHTML = '<option value="">-- Chọn --</option>';
    } else {
      els.customName.value = "";
      els.customPrice.value = "";
    }
    els.noteInput.value = "";
    currentPrice = 0;
    els.priceDisplay.textContent = "0k";
    els.customerInput.focus();
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

    // Group by page
    const byPage = {};
    shiftOrders.forEach((o) => {
      if (!byPage[o.pageName]) byPage[o.pageName] = [];
      byPage[o.pageName].push(o);
    });

    let report = "";
    report += `═══════════════════════════════════════\n`;
    report += `  📊 BÁO CÁO CA TAROT\n`;
    report += `  📅 ${fmtDate(startTime)}  ⏰ ${fmtTime(startTime)} → ${fmtTime(now)}\n`;
    report += `═══════════════════════════════════════\n\n`;

    // Per-page detail
    let orderNum = 0;
    for (const [pageName, orders] of Object.entries(byPage)) {
      const pageRevenue = orders.reduce((s, o) => s + o.price, 0);
      report += `┌─── ${pageName} (${orders.length} đơn • ${pageRevenue}k) ───\n`;
      report += `│\n`;
      orders.forEach((o) => {
        orderNum++;
        const time = new Date(o.timestamp);
        report += `│  ${orderNum}. ${o.packageDisplay} - ${o.price}k\n`;
        report += `│     ${o.customer}  @${o.reader}\n`;
        report += `│     ${fmtTime(time)}\n`;
        if (o.note) report += `│     📝 ${o.note}\n`;
      });
      report += `│\n`;
      report += `└─── Tổng ${pageName}: ${pageRevenue}k\n\n`;
    }

    // Total
    report += `═══════════════════════════════════════\n`;
    report += `  📈 TỔNG KẾT\n`;
    report += `  Đơn:    ${shiftOrders.length}\n`;
    report += `  Tiền:   ${revenue}k\n`;
    report += `  Lương:  ${salary}k (5%)\n`;
    report += `═══════════════════════════════════════\n`;

    return report;
  }

  // ===== COPY REPORT =====
  async function copyReport() {
    if (shiftOrders.length === 0) {
      showToast("Chưa có đơn!", "warning");
      return;
    }
    try {
      await navigator.clipboard.writeText(buildReport());
      showToast("✓ Đã copy báo cáo!");
    } catch (err) {
      showToast("Lỗi!", "error");
    }
  }

  // ===== DOWNLOAD REPORT AS TXT =====
  function downloadReport() {
    if (shiftOrders.length === 0) {
      showToast("Chưa có đơn!", "warning");
      return;
    }

    const report = buildReport();
    const now = new Date();
    const dateStr = now
      .toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");
    const timeStr = now
      .toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      .replace(":", "h");
    const filename = `BaoCao_${dateStr}_${timeStr}.txt`;

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`✓ Đã lưu ${filename}`);
  }

  // ===== RESET SHIFT (archive + clear) =====
  async function resetShift() {
    if (shiftOrders.length === 0) {
      showToast("Chưa có đơn!", "warning");
      return;
    }

    const total = shiftOrders.reduce((s, o) => s + o.price, 0);
    if (
      !confirm(
        `Reset ca?\n${shiftOrders.length} đơn - ${total}k\n\nBáo cáo sẽ được lưu vào lịch sử.`,
      )
    )
      return;

    // Archive this shift
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
    history.unshift(archive); // newest first
    // Keep max 30 shifts
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

  // ===== VIEW HISTORY =====
  async function viewHistory() {
    const data = await chrome.storage.local.get(["shiftHistory"]);
    const history = data.shiftHistory || [];

    if (history.length === 0) {
      showToast("Chưa có lịch sử!", "warning");
      return;
    }

    const fmtDate = (d) =>
      new Date(d).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
    const fmtTime = (d) =>
      new Date(d).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });

    let txt = "📂 LỊCH SỬ CA (gần nhất)\n\n";
    history.slice(0, 10).forEach((shift, i) => {
      txt += `${i + 1}. ${fmtDate(shift.startTime)} ${fmtTime(shift.startTime)}-${fmtTime(shift.endTime)}`;
      txt += ` | ${shift.totalOrders} đơn | ${shift.totalRevenue}k\n`;
    });

    try {
      await navigator.clipboard.writeText(txt);
      showToast("✓ Đã copy lịch sử!");
    } catch (err) {
      alert(txt);
    }
  }

  // ===== LOAD DATA =====
  async function loadData() {
    try {
      const data = await chrome.storage.local.get([
        "savedReaders",
        "dualReaderMode",
        "shiftOrders",
        "shiftStartTime",
      ]);

      // Restore readers
      if (data.savedReaders && Array.isArray(data.savedReaders)) {
        readerList = data.savedReaders;
        if (readerList[0]) els.readerInput1.value = readerList[0];
        if (readerList[1]) els.readerInput2.value = readerList[1];
      }
      if (data.dualReaderMode) {
        dualReaderMode = true;
        els.dualModeToggle.checked = true;
        els.readerInput2.classList.remove("tqs-hidden");
      }
      if (readerList.length > 0) {
        activeReaderIdx = 0;
        renderReaderChips();
      }

      if (data.shiftStartTime) shiftStartTime = data.shiftStartTime;
      if (data.shiftOrders && Array.isArray(data.shiftOrders)) {
        shiftOrders = data.shiftOrders;
        updateDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ===== CHECK FOR PENDING MESSAGE (auto-paste on Messenger) =====
  async function checkPendingMessage() {
    if (!window.location.href.includes("messenger.com")) return;

    try {
      const data = await chrome.storage.local.get(["pendingMessage"]);
      if (data.pendingMessage) {
        // Wait for Messenger to load
        setTimeout(() => {
          // Try to find the message input
          const input =
            document.querySelector(
              '[contenteditable="true"][role="textbox"]',
            ) ||
            document.querySelector('[data-lexical-editor="true"]') ||
            document.querySelector('[aria-label*="Message"]');

          if (input) {
            input.focus();
            // Paste the message
            document.execCommand("insertText", false, data.pendingMessage);
            showToast("✓ Đã paste tin nhắn!");
          }

          // Clear pending message
          chrome.storage.local.remove(["pendingMessage"]);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ===== DRAG FUNCTIONALITY =====
  function initDrag() {
    els.header.addEventListener("mousedown", (e) => {
      if (e.target.closest(".tqs-header-btn")) return;
      isDragging = true;
      const rect = panel.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      panel.style.transition = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      e.preventDefault();

      let x = e.clientX - dragOffset.x;
      let y = e.clientY - dragOffset.y;

      x = Math.max(0, Math.min(x, window.innerWidth - panel.offsetWidth));
      y = Math.max(0, Math.min(y, window.innerHeight - panel.offsetHeight));

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
      panel.classList.toggle("tqs-minimized");
      els.minimizeBtn.textContent = panel.classList.contains("tqs-minimized")
        ? "□"
        : "─";
    });

    els.toggleBtn.addEventListener("click", () => {
      panel.classList.remove("tqs-hidden");
      els.toggleBtn.classList.add("tqs-hidden");
    });
  }

  // ===== EVENT LISTENERS =====
  function initEvents() {
    els.pageSelect.addEventListener("change", populateServices);
    els.serviceSelect.addEventListener("change", populatePackages);
    els.packageSelect.addEventListener("change", updatePrice);

    els.customMode.addEventListener("change", toggleCustomMode);
    els.customPrice.addEventListener("input", updatePrice);

    // Reader setup events
    els.readerSetBtn.addEventListener("click", setupReaders);

    els.dualModeToggle.addEventListener("change", () => {
      dualReaderMode = els.dualModeToggle.checked;
      els.readerInput2.classList.toggle("tqs-hidden", !dualReaderMode);
      if (!dualReaderMode && readerList.length > 1) {
        readerList = [readerList[0]];
        activeReaderIdx = 0;
        renderReaderChips();
        chrome.storage.local.set({
          savedReaders: readerList,
          dualReaderMode: false,
        });
      }
    });

    els.readerChips.addEventListener("click", (e) => {
      const chip = e.target.closest(".tqs-chip");
      if (!chip) return;
      activeReaderIdx = parseInt(chip.dataset.idx);
      renderReaderChips();
    });

    els.readerInput1.addEventListener("keypress", (e) => {
      if (e.key === "Enter") setupReaders();
    });
    els.readerInput2.addEventListener("keypress", (e) => {
      if (e.key === "Enter") setupReaders();
    });

    els.copySaveBtn.addEventListener("click", copyAndSave);
    els.sendMsgBtn.addEventListener("click", sendToMessenger);
    els.resetBtn.addEventListener("click", resetShift);
    els.reportBtn.addEventListener("click", copyReport);
    els.downloadBtn.addEventListener("click", downloadReport);
    els.historyBtn.addEventListener("click", viewHistory);

    // Order list: toggle, edit, delete
    els.toggleListBtn.addEventListener("click", () => {
      els.orderList.classList.toggle("tqs-collapsed");
      els.toggleListBtn.textContent = els.orderList.classList.contains(
        "tqs-collapsed",
      )
        ? "▶"
        : "▼";
    });

    els.orderList.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".tqs-edit-btn");
      const deleteBtn = e.target.closest(".tqs-delete-btn");
      if (editBtn) openEditOrder(parseInt(editBtn.dataset.id));
      if (deleteBtn) deleteOrder(parseInt(deleteBtn.dataset.id));
    });

    els.editSave.addEventListener("click", saveEditOrder);
    els.editCancel.addEventListener("click", () => {
      els.editModal.classList.add("tqs-hidden");
      editingOrderId = null;
    });

    // Enter key shortcuts
    els.customerInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") els.serviceSelect.focus();
    });
    els.noteInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") copyAndSave();
    });
    els.customPrice.addEventListener("keypress", (e) => {
      if (e.key === "Enter") copyAndSave();
    });
  }

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

  // ===== INIT =====
  async function init() {
    await loadData();
    populateServices();
    initDrag();
    initControls();
    initEvents();
    els.customerInput.focus();

    // Check for pending message on Messenger
    checkPendingMessage();
  }

  init();
})();
