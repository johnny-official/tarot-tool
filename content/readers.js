// ===== TAROT QUICKSALE — READER MANAGEMENT =====
// Reader CRUD, rotation, schedule parsing, display.

(function () {
  "use strict";
  const T = window.TQS;

  // ===== GET ACTIVE READER =====
  function getActiveReader() {
    if (T.manualReaderOverride) return T.manualReaderOverride;
    if (T.scheduleMode && T.scheduleSlots.length > 0) {
      const slotData = getScheduleReader();
      if (slotData) return slotData;
    }
    if (T.readerList.length > 0) {
      if (T.activeReaderIdx >= T.readerList.length) T.activeReaderIdx = 0;
      return T.readerList[T.activeReaderIdx];
    }
    return "Chưa set tên";
  }

  // ===== DISPLAY =====
  function updateReaderDisplay() {
    const reader = getActiveReader();
    const slotResult =
      T.scheduleMode && T.scheduleSlots.length > 0 ? getCurrentSlot() : null;
    const isOverride = !!T.manualReaderOverride;

    if (T.els.activeReaderName) {
      T.els.activeReaderName.textContent = reader.startsWith("@")
        ? reader
        : "@" + reader;
      T.els.activeReaderName.classList.toggle("tqs-reader-override", isOverride);
    }

    if (T.els.readerStatus) {
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
        T.els.readerStatus.innerHTML = `📅 ${currentSlot.startH}h–${currentSlot.endH}h · Còn ${minsLeft}p`;
        T.els.readerStatus.style.color = "var(--text-dim)";
      } else if (T.scheduleMode && T.scheduleSlots.length > 0) {
        T.els.readerStatus.textContent = "⏳ Ngoài giờ làm việc";
        T.els.readerStatus.style.color = "var(--text-muted)";
      } else if (T.readerList.length > 1 && T.autoRotate) {
        const nextIdx = (T.activeReaderIdx + 1) % T.readerList.length;
        T.els.readerStatus.innerHTML = `🔄 Tiếp: @${T.readerList[nextIdx]} (${T.activeReaderIdx + 1}/${T.readerList.length})`;
        T.els.readerStatus.style.color = "var(--text-dim)";
      } else if (T.readerList.length > 1) {
        T.els.readerStatus.innerHTML = `🔒 Cố định @${T.readerList[T.activeReaderIdx]}`;
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
    if (T.readerList.length === 1) T.activeReaderIdx = 0;
    T.storage.syncSave({ savedReaders: T.readerList, activeReaderIdx: T.activeReaderIdx });
    updateReaderDisplay();
    T.ui.showToast(`✓ Đã thêm @${n}`);
  }

  function removeReader(idx) {
    if (idx < 0 || idx >= T.readerList.length) return;
    const removed = T.readerList.splice(idx, 1)[0];
    if (T.readerList.length === 0 || T.activeReaderIdx >= T.readerList.length) {
      T.activeReaderIdx = 0;
    }
    T.storage.syncSave({ savedReaders: T.readerList, activeReaderIdx: T.activeReaderIdx });
    updateReaderDisplay();
    T.ui.showToast(`🗑️ Đã xóa @${removed}`);
  }

  function rotateReader() {
    T.manualReaderOverride = null;
    if (!T.autoRotate) return;
    if (T.scheduleMode && T.scheduleSlots.length > 0) {
      rotateScheduleReader();
    } else if (T.readerList.length > 1) {
      T.activeReaderIdx = (T.activeReaderIdx + 1) % T.readerList.length;
      chrome.storage.local.set({ activeReaderIdx: T.activeReaderIdx });
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
      return T.readerList[T.activeReaderIdx] || T.readerList[0];
    }
    const { slot, slotIdx } = result;
    if (slot.readers.length === 1) return slot.readers[0];
    const key = `slot_${slotIdx}`;
    return slot.readers[(T.slotReaderIdx[key] || 0) % slot.readers.length];
  }

  function rotateScheduleReader() {
    const result = getCurrentSlot();
    if (!result || result.slot.readers.length <= 1) return;
    const key = `slot_${result.slotIdx}`;
    T.slotReaderIdx[key] =
      ((T.slotReaderIdx[key] || 0) + 1) % result.slot.readers.length;
    chrome.storage.local.set({ slotReaderIdx: { ...T.slotReaderIdx } });
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
