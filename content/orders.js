// ===== TAROT QUICKSALE — ORDER MANAGEMENT =====
// Order CRUD, dashboard stats, report generation.

(function () {
  "use strict";
  const T = window.TQS;

  // ===== MESSAGE GENERATION =====
  function generateMessage() {
    const page = T.detectedPage;
    const pageName = T.PRICING_DATA[page]?.name || page;
    const customer = (T.els.customerInput?.value || "").trim();
    const reader = T.readers.getActiveReader().replace(/^@/, "");
    const note = (T.els.noteInput?.value || "").trim();

    let packageDisplay = "";
    if (T.els.customMode.checked) {
      packageDisplay = T.els.customName.value.trim();
    } else {
      const service = T.els.serviceSelect.value;
      const pkg = T.els.packageSelect.value;
      const serviceAbbr = T.SERVICE_ABBR[service] ?? service;
      const pkgAbbr = T.PACKAGE_ABBR[pkg] ?? pkg;

      if (page === "CA" && service === "Câu Lẻ") {
        packageDisplay = pkgAbbr;
      } else if (service.startsWith("⏱")) {
        packageDisplay = [serviceAbbr, pkgAbbr].filter(Boolean).join(" ");
      } else {
        packageDisplay = [pkgAbbr, serviceAbbr].filter(Boolean).join(" ");
      }
    }

    let msg;
    if (page === "POBO") {
      const srcEmoji = T.SOURCE_EMOJI[T.sourcePlatform] || "🔵";
      msg = `${packageDisplay} - ${T.currentPrice}k ${srcEmoji}${customer} @${reader}`;
    } else {
      const pageIcon = T.PRICING_DATA[page]?.icon || "🔮";
      msg = `${pageIcon}[${pageName}] ${packageDisplay} - ${T.currentPrice}k 👤${customer} @${reader}`;
    }
    if (note) msg += ` ${note}`;
    return msg;
  }

  // ===== VALIDATION =====
  function validateForm() {
    if (!T.els.customerInput?.value.trim()) {
      T.ui.showToast("Nhập tên khách!", "error");
      T.els.customerInput?.focus();
      return false;
    }
    if (
      T.readerList.length === 0 &&
      !(T.scheduleMode && T.scheduleSlots.length > 0)
    ) {
      T.ui.showToast("Thiết lập Reader trước!", "error");
      return false;
    }
    if (T.els.customMode.checked) {
      if (!T.els.customName.value.trim()) {
        T.ui.showToast("Nhập tên gói!", "error");
        T.els.customName.focus();
        return false;
      }
      if (!T.els.customPrice.value || parseInt(T.els.customPrice.value) <= 0) {
        T.ui.showToast("Nhập giá!", "error");
        T.els.customPrice.focus();
        return false;
      }
    } else {
      if (!T.els.serviceSelect.value) {
        T.ui.showToast("Chọn nhóm dịch vụ!", "error");
        return false;
      }
      if (!T.els.packageSelect.value) {
        T.ui.showToast("Chọn gói!", "error");
        return false;
      }
    }
    return true;
  }

  // ===== SAVE ORDER =====
  async function saveOrder() {
    if (!T.shiftStartTime) T.shiftStartTime = new Date().toISOString();

    const order = {
      id: Date.now(),
      page: T.detectedPage,
      pageName: T.PRICING_DATA[T.detectedPage]?.name || T.detectedPage,
      customer: T.els.customerInput.value.trim(),
      reader: T.readers.getActiveReader().replace(/^@/, ""),
      service: T.els.customMode.checked ? "Custom" : T.els.serviceSelect.value,
      package: T.els.customMode.checked
        ? T.els.customName.value.trim()
        : T.els.packageSelect.value,
      packageDisplay: T.els.customMode.checked
        ? T.els.customName.value.trim()
        : (() => {
            const before = generateMessage().split(/\s-\s/)[0];
            return before.includes("]")
              ? before.split("] ")[1] || before
              : before;
          })(),
      price: T.currentPrice,
      note: T.els.noteInput.value.trim(),
      timestamp: new Date().toISOString(),
    };

    const data = await chrome.storage.local.get([
      "shiftOrders",
      "shiftStartTime",
    ]);
    const latest = data.shiftOrders || [];
    latest.push(order);
    T.shiftOrders = latest;
    if (!T.shiftStartTime && data.shiftStartTime)
      T.shiftStartTime = data.shiftStartTime;

    await chrome.storage.local.set({
      shiftOrders: T.shiftOrders,
      shiftStartTime: T.shiftStartTime,
    });
    updateDashboard();
  }

  // ===== RESET FORM =====
  function resetForm() {
    if (T.els.customerInput) T.els.customerInput.value = "";
    if (!T.els.customMode?.checked) {
      if (T.els.serviceSelect) T.els.serviceSelect.value = "";
      if (T.els.packageSelect)
        T.els.packageSelect.innerHTML = '<option value="">-- Gói --</option>';
    } else {
      if (T.els.customName) T.els.customName.value = "";
      if (T.els.customPrice) T.els.customPrice.value = "";
    }
    if (T.els.noteInput) T.els.noteInput.value = "";
    T.currentPrice = 0;
    if (T.els.priceDisplay) {
      T.els.priceDisplay.textContent = "0k";
      T.els.priceDisplay.classList.remove("tqs-price-active");
    }
    if (T.els.customerInput) T.els.customerInput.focus();
  }

  // ===== COPY AND SAVE =====
  async function copyAndSave() {
    if (!validateForm()) return;
    T.sourcePlatform = T.detection.detectSourcePlatform();
    const message = generateMessage();
    try {
      await navigator.clipboard.writeText(message);
      await saveOrder();
      T.readers.rotateReader();
      T.ui.showToast("✓ Đã copy!");
      resetForm();
    } catch {
      T.ui.showToast("Lỗi!", "error");
    }
  }

  // ===== DASHBOARD =====
  function updateDashboard() {
    const revenue = T.shiftOrders.reduce((s, o) => s + o.price, 0);
    if (T.els.totalOrders) T.els.totalOrders.textContent = T.shiftOrders.length;
    if (T.els.totalRevenue) T.els.totalRevenue.textContent = revenue + "k";
    renderOrderList();
  }

  // ===== ORDER LIST (max 2 recent) =====
  function renderOrderList() {
    if (!T.shiftOrders.length) {
      T.els.orderList.innerHTML = "";
      return;
    }

    const fmtTime = (d) =>
      new Date(d).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    const frag = document.createDocumentFragment();
    const len = T.shiftOrders.length;
    const start = Math.max(0, len - 2);
    for (let idx = len - 1; idx >= start; idx--) {
      const o = T.shiftOrders[idx];
      const div = document.createElement("div");
      div.className = "tqs-order-item";
      div.dataset.id = o.id;
      div.innerHTML = `
        <span class="tqs-order-num">${idx + 1}</span>
        <span class="tqs-order-pkg">${o.packageDisplay}</span>
        <span class="tqs-order-price">${o.price}k</span>
        <span class="tqs-order-detail">${o.customer} @${o.reader}</span>
        <span class="tqs-order-time">${fmtTime(o.timestamp)}</span>
        <button class="tqs-order-btn tqs-edit-btn" data-id="${o.id}">✏️</button>
        <button class="tqs-order-btn tqs-delete-btn" data-id="${o.id}">✕</button>`;
      frag.appendChild(div);
    }

    T.els.orderList.innerHTML = "";
    T.els.orderList.appendChild(frag);
  }

  // ===== EDIT ORDER =====
  function openEditOrder(id) {
    const order = T.shiftOrders.find((o) => o.id === id);
    if (!order) return;
    T.editingOrderId = id;
    T.els.editCustomer.value = order.customer;
    T.els.editReader.value = order.reader;
    T.els.editPackage.value = order.packageDisplay;
    T.els.editPrice.value = order.price;
    T.els.editNote.value = order.note || "";
    T.els.editModal.classList.remove("tqs-hidden");
  }

  async function saveEditOrder() {
    if (T.editingOrderId === null) return;
    const data = await chrome.storage.local.get(["shiftOrders"]);
    const latest = data.shiftOrders || [];
    const idx = latest.findIndex((o) => o.id === T.editingOrderId);
    if (idx === -1) {
      T.ui.showToast("Đơn không tồn tại!", "error");
      T.els.editModal.classList.add("tqs-hidden");
      T.editingOrderId = null;
      return;
    }
    latest[idx].customer = T.els.editCustomer.value.trim();
    latest[idx].reader = T.els.editReader.value.trim();
    latest[idx].packageDisplay = T.els.editPackage.value.trim();
    latest[idx].price = parseInt(T.els.editPrice.value) || 0;
    latest[idx].note = T.els.editNote.value.trim();
    T.shiftOrders = latest;
    await chrome.storage.local.set({ shiftOrders: T.shiftOrders });
    T.els.editModal.classList.add("tqs-hidden");
    T.editingOrderId = null;
    updateDashboard();
    T.ui.showToast("✓ Đã sửa!");
  }

  async function deleteOrder(id) {
    const data = await chrome.storage.local.get(["shiftOrders"]);
    const latest = data.shiftOrders || [];
    const idx = latest.findIndex((o) => o.id === id);
    if (idx === -1) return;
    const o = latest[idx];

    const ok = await T.ui.showConfirm(
      `Xóa đơn <b>${o.customer}</b> — ${o.price}k?`,
    );
    if (!ok) return;

    latest.splice(idx, 1);
    T.shiftOrders = latest;
    await chrome.storage.local.set({ shiftOrders: T.shiftOrders });
    updateDashboard();
    T.ui.showToast("✓ Đã xóa!");
  }

  // ===== REPORT =====
  function buildReport() {
    const revenue = T.shiftOrders.reduce((s, o) => s + o.price, 0);
    const salary = Math.floor(revenue * 0.05);
    const now = new Date();
    const startTime = T.shiftStartTime ? new Date(T.shiftStartTime) : now;
    const fmtDate = (d) =>
      d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    const fmtTime = (d) =>
      d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    const byPage = {};
    T.shiftOrders.forEach((o) => {
      if (!byPage[o.pageName]) byPage[o.pageName] = [];
      byPage[o.pageName].push(o);
    });

    const byReader = {};
    T.shiftOrders.forEach((o) => {
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
    report += `  Đơn:    ${T.shiftOrders.length}\n`;
    report += `  Tiền:   ${revenue}k\n`;
    report += `  Lương:  ${salary}k (5%)\n`;
    report += `═══════════════════════════════════════\n`;
    return report;
  }

  async function copyReport() {
    if (!T.shiftOrders.length) {
      T.ui.showToast("Chưa có đơn!", "warning");
      return;
    }
    try {
      await navigator.clipboard.writeText(buildReport());
      T.ui.showToast("✓ Đã copy báo cáo!");
    } catch {
      T.ui.showToast("Lỗi!", "error");
    }
  }

  // ===== RESET SHIFT =====
  async function resetShift() {
    if (!T.shiftOrders.length) {
      T.ui.showToast("Chưa có đơn!", "warning");
      return;
    }
    const total = T.shiftOrders.reduce((s, o) => s + o.price, 0);
    const ok = await T.ui.showConfirm(
      `Reset ca? <br><b style="color:#22c55e">${T.shiftOrders.length} đơn · ${total}k</b>`,
    );
    if (!ok) return;

    const archive = {
      id: Date.now(),
      startTime: T.shiftStartTime || new Date().toISOString(),
      endTime: new Date().toISOString(),
      orders: [...T.shiftOrders],
      totalOrders: T.shiftOrders.length,
      totalRevenue: total,
    };
    const data = await chrome.storage.local.get(["shiftHistory"]);
    const history = data.shiftHistory || [];
    history.unshift(archive);
    if (history.length > 30) history.length = 30;

    T.shiftOrders = [];
    T.shiftStartTime = null;
    await chrome.storage.local.set({
      shiftOrders: [],
      shiftStartTime: null,
      shiftHistory: history,
    });
    updateDashboard();
    T.ui.showToast("✓ Đã lưu và reset!");
  }

  // ===== DROPDOWN LOGIC =====
  function populateServices() {
    const page = T.detectedPage;
    if (!page || !T.PRICING_DATA[page]) return;

    const frag = document.createDocumentFragment();
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "-- Dịch vụ --";
    frag.appendChild(defaultOpt);

    Object.keys(T.PRICING_DATA[page].services).forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      frag.appendChild(opt);
    });

    T.els.serviceSelect.innerHTML = "";
    T.els.serviceSelect.appendChild(frag);
    T.els.packageSelect.innerHTML = '<option value="">-- Gói --</option>';
    T.currentPrice = 0;
    T.els.priceDisplay.textContent = "0k";
    T.els.priceDisplay.classList.remove("tqs-price-active");
  }

  function populatePackages() {
    const page = T.detectedPage;
    if (!page || !T.PRICING_DATA[page]) return;
    const service = T.els.serviceSelect.value;

    T.els.packageSelect.innerHTML = '<option value="">-- Gói --</option>';
    T.currentPrice = 0;
    T.els.priceDisplay.textContent = "0k";
    T.els.priceDisplay.classList.remove("tqs-price-active");

    if (!service) return;

    const packages = T.PRICING_DATA[page].services[service];
    if (!packages) return;

    const frag = document.createDocumentFragment();
    Object.entries(packages).forEach(([pkg, price]) => {
      const opt = document.createElement("option");
      opt.value = pkg;
      opt.textContent = `${pkg} — ${price}k`;
      opt.dataset.price = price;
      frag.appendChild(opt);
    });
    T.els.packageSelect.appendChild(frag);
  }

  function updatePrice() {
    if (T.els.customMode?.checked) {
      T.currentPrice = parseInt(T.els.customPrice?.value) || 0;
    } else {
      const opt = T.els.packageSelect?.options[T.els.packageSelect.selectedIndex];
      T.currentPrice = opt?.dataset.price ? parseInt(opt.dataset.price) : 0;
    }
    T.els.priceDisplay.textContent = T.currentPrice + "k";
    T.els.priceDisplay.classList.toggle("tqs-price-active", T.currentPrice > 0);
  }

  function toggleCustomMode() {
    if (!T.els.customMode) return;
    const isCustom = T.els.customMode.checked;
    T.els.customInputs?.classList.toggle("tqs-hidden", !isCustom);
    if (T.els.serviceSelect) T.els.serviceSelect.disabled = isCustom;
    if (T.els.packageSelect) T.els.packageSelect.disabled = isCustom;
    updatePrice();
  }

  // Export
  T.orders = {
    generateMessage,
    validateForm,
    saveOrder,
    resetForm,
    copyAndSave,
    updateDashboard,
    renderOrderList,
    openEditOrder,
    saveEditOrder,
    deleteOrder,
    copyReport,
    resetShift,
    populateServices,
    populatePackages,
    updatePrice,
    toggleCustomMode,
  };
})();
