// ===== TAROT QUICKSALE — READER MANAGEMENT =====
// Reader CRUD, rotation, schedule parsing, display.
// CÁ+DỪA đồng bộ rotation, POBO riêng.

(function () {
  "use strict";
  const T = window.TQS;

  // ===== PAGE GROUP HELPER =====
  function getPageGroup(page) {
    return T.PAGE_GROUPS[page] || "CA_DUA";
  }

  function getGroupIdx() {
    const g = getPageGroup(T.detectedPage);
    const idx = T.groupReaderIdx[g] || 0;
    return T.readerList.length > 0 ? idx % T.readerList.length : 0;
  }

  function setGroupIdx(val) {
    const g = getPageGroup(T.detectedPage);
    T.groupReaderIdx[g] = val;
    // Đồng bộ activeReaderIdx cho backward compat
    T.activeReaderIdx = val;
  }

  function getGroupSlotIdx(key) {
    const g = getPageGroup(T.detectedPage);
    if (!T.groupSlotReaderIdx[g]) T.groupSlotReaderIdx[g] = {};
    return T.groupSlotReaderIdx[g][key] || 0;
  }

  function setGroupSlotIdx(key, val) {
    const g = getPageGroup(T.detectedPage);
    if (!T.groupSlotReaderIdx[g]) T.groupSlotReaderIdx[g] = {};
    T.groupSlotReaderIdx[g][key] = val;
  }

  // ===== GET ACTIVE READER =====
  function getActiveReader() {
    if (T.manualReaderOverride) return T.manualReaderOverride;
    if (T.scheduleMode && T.scheduleSlots.length > 0) {
      const slotData = getScheduleReader();
      if (slotData) return slotData;
    }
    if (T.readerList.length > 0) {
      const idx = getGroupIdx();
      return T.readerList[idx] || T.readerList[0];
    }
    return "Chưa set tên";
  }

  // ===== DISPLAY =====
  function updateReaderDisplay() {
    const reader = getActiveReader();
    const slotResult =
      T.scheduleMode && T.scheduleSlots.length > 0 ? getCurrentSlot() : null;
    const isOverride = !!T.manualReaderOverride;

    if (T.els.readerCard) {
      T.els.readerCard.classList.toggle("tqs-card-override", isOverride);
    }

    if (T.els.activeReaderName) {
      T.els.activeReaderName.textContent = reader.startsWith("@")
        ? reader
        : "@" + reader;
      T.els.activeReaderName.classList.toggle("tqs-reader-override", isOverride);
    }

    if (T.els.readerStatus) {
      const idx = getGroupIdx();
      if (isOverride) {
        T.els.readerStatus.innerHTML = "🎯 Bạn chọn · Lượt sau tự đổi";
        T.els.readerStatus.style.color = "var(--green)";
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
        const gName = getPageGroup(T.detectedPage) === "CA_DUA" ? "🐟🥥" : "🧈";
        T.els.readerStatus.innerHTML = `📅 ${currentSlot.startH}h–${currentSlot.endH}h · Còn ${minsLeft}p ${gName}`;
        T.els.readerStatus.style.color = "var(--text-dim)";
      } else if (T.scheduleMode && T.scheduleSlots.length > 0) {
        T.els.readerStatus.textContent = "⏳ Ngoài giờ làm việc";
        T.els.readerStatus.style.color = "var(--text-muted)";
      } else if (T.readerList.length > 1 && T.autoRotate) {
        const nextIdx = (idx + 1) % T.readerList.length;
        const gName = getPageGroup(T.detectedPage) === "CA_DUA" ? "🐟🥥" : "🧈";
        T.els.readerStatus.innerHTML = `🔄 Tiếp: @${T.readerList[nextIdx]} (${idx + 1}/${T.readerList.length}) ${gName}`;
        T.els.readerStatus.style.color = "var(--text-dim)";
      } else if (T.readerList.length > 1) {
        T.els.readerStatus.innerHTML = `🔒 Cố định @${T.readerList[idx]}`;
        T.els.readerStatus.style.color = "var(--text-dim)";
      } else if (T.readerList.length === 1) {
        T.els.readerStatus.textContent = "✅ 1 Reader";
        T.els.readerStatus.style.color = "var(--text-dim)";
      } else {
        T.els.readerStatus.textContent = "⬇️ Gõ tên bên dưới để thêm";
        T.els.readerStatus.style.color = "var(--text-muted)";
      }
    }

    renderReaderChips();
  }

  function renderReaderChips() {
    if (!T.els.readerChips) return;
    if (T.readerList.length === 0) {
      T.els.readerChips.innerHTML = "";
      return;
    }

    const active = getActiveReader().replace(/^@/, "");
    const frag = document.createDocumentFragment();
    T.readerList.forEach((r, i) => {
      const chip = document.createElement("span");
      chip.className = `tqs-chip ${r === active ? "tqs-chip-active" : ""}`;
      chip.dataset.reader = r;
      chip.dataset.idx = i;

      if (T.readerList.length > 1) {
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
    T.els.readerChips.innerHTML = "";
    T.els.readerChips.appendChild(frag);
  }

  // ===== CRUD =====
  function addReader(name) {
    const n = name.trim();
    if (!n) return;
    if (T.readerList.includes(n)) {
      T.ui.showToast(`@${n} đã có rồi`, "warning");
      return;
    }
    T.readerList.push(n);
    if (T.readerList.length === 1) {
      T.groupReaderIdx = { CA_DUA: 0, POBO: 0 };
      T.activeReaderIdx = 0;
    }
    T.storage.syncSave({
      savedReaders: T.readerList,
      groupReaderIdx: { ...T.groupReaderIdx },
    });
    updateReaderDisplay();
    T.ui.showToast(`✓ Đã thêm @${n}`);
  }

  function removeReader(idx) {
    if (idx < 0 || idx >= T.readerList.length) return;
    const removed = T.readerList.splice(idx, 1)[0];

    // Fix tất cả group indices
    for (const g of Object.keys(T.groupReaderIdx)) {
      if (T.groupReaderIdx[g] >= T.readerList.length) {
        T.groupReaderIdx[g] = 0;
      }
    }
    T.activeReaderIdx = getGroupIdx();

    T.storage.syncSave({
      savedReaders: T.readerList,
      groupReaderIdx: { ...T.groupReaderIdx },
    });
    updateReaderDisplay();
    T.ui.showToast(`🗑️ Đã xóa @${removed}`);
  }

  function rotateReader() {
    // Override = "1 lượt" — chỉ clear override, KHÔNG rotate
    // Rotation sẽ tiếp tục từ vị trí cũ (chưa hề thay đổi)
    if (T.manualReaderOverride !== null) {
      T.manualReaderOverride = null;
      T.preOverrideReaderIdx = null;
      T.preOverrideSlotKey = null;
      updateReaderDisplay();
      return;
    }

    if (!T.autoRotate) {
      updateReaderDisplay();
      return;
    }
    if (T.scheduleMode && T.scheduleSlots.length > 0) {
      rotateScheduleReader();
    } else if (T.readerList.length > 1) {
      const newIdx = (getGroupIdx() + 1) % T.readerList.length;
      setGroupIdx(newIdx);
      chrome.storage.local.set({ groupReaderIdx: { ...T.groupReaderIdx } });
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
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
    if (isEnd && hour < startH) d.setDate(d.getDate() + 1);
    if (now.getHours() < 8 && hour >= 20) d.setDate(d.getDate() - 1);
    return d;
  }

  function getCurrentSlot() {
    if (!T.scheduleSlots.length) return null;
    const now = new Date();
    for (let i = 0; i < T.scheduleSlots.length; i++) {
      const slot = T.scheduleSlots[i];
      const slotStart = slotToDate(slot.startH, slot.startM, false, slot.startH);
      const slotEnd = slotToDate(slot.endH, slot.endM, true, slot.startH);
      if (now >= slotStart && now < slotEnd) {
        return {
          slot,
          slotIdx: i,
          currentSlot: slot,
          nextSlot: T.scheduleSlots[i + 1] || null,
        };
      }
    }
    return null;
  }

  function getScheduleReader() {
    const result = getCurrentSlot();
    if (!result) {
      if (!T.readerList.length) return "";
      const idx = Math.min(getGroupIdx(), T.readerList.length - 1);
      return T.readerList[idx] || T.readerList[0];
    }
    const { slot, slotIdx } = result;
    if (!slot.readers || slot.readers.length === 0) return "";
    if (slot.readers.length === 1) return slot.readers[0];
    const key = `slot_${slotIdx}`;
    const rIdx = getGroupSlotIdx(key) % slot.readers.length;
    return slot.readers[rIdx] || slot.readers[0];
  }

  function rotateScheduleReader() {
    const result = getCurrentSlot();
    if (!result || result.slot.readers.length <= 1) return;
    const key = `slot_${result.slotIdx}`;
    const newIdx = (getGroupSlotIdx(key) + 1) % result.slot.readers.length;
    setGroupSlotIdx(key, newIdx);
    chrome.storage.local.set({ groupSlotReaderIdx: JSON.parse(JSON.stringify(T.groupSlotReaderIdx)) });
    updateReaderDisplay();
  }

  function startScheduleTimer() {
    if (T.scheduleTimerId) clearInterval(T.scheduleTimerId);
    T.scheduleTimerId = setInterval(updateReaderDisplay, 60000);
    updateReaderDisplay();
  }

  // Export
  T.readers = {
    getActiveReader,
    getPageGroup,
    getGroupIdx,
    updateReaderDisplay,
    renderReaderChips,
    addReader,
    removeReader,
    rotateReader,
    parseSchedule,
    getCurrentSlot,
    startScheduleTimer,
  };
})();
