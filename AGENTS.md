# Tarot QuickSale — AI Agent Context

> **Đọc file này trước khi làm bất kỳ thay đổi nào.** File này chứa tất cả thông tin cần thiết để hiểu dự án.

---

## 1. Tổng quan

**Chrome Extension (Manifest V3)** hỗ trợ nhân viên sale Tarot chốt đơn nhanh trên **Facebook Business Suite**.

**Chức năng chính:**
- Inject floating panel vào `business.facebook.com`
- Auto-detect fanpage (Bơ/Dừa/Cá) từ URL
- Auto-detect khách từ Facebook hay Instagram (🔵/🟣)
- Chọn dịch vụ → chọn gói → copy tin nhắn format chuẩn
- Quản lý reader (tự xoay, lịch ca)
- Dashboard đơn hàng + báo cáo ca

---

## 2. Tech Stack & Quy tắc

| Quy tắc | Chi tiết |
|---------|---------|
| **Framework** | ❌ Không dùng. Vanilla JS thuần |
| **Build tool** | ❌ Không dùng. Load trực tiếp qua manifest |
| **State** | Tất cả qua `window.TQS` — không dùng local var cho shared state |
| **Module pattern** | IIFE, export qua `T.moduleName = { ... }` |
| **Storage** | `T.storage.syncSave()` — debounced 200ms |
| **DOM** | `DocumentFragment` khi tạo nhiều elements |
| **CSS** | Dùng `var(--accent)`, `var(--green)`,... từ `:root` |
| **Ngôn ngữ** | UI text, toast, comments = **tiếng Việt** |
| **Debug** | ❌ Không thêm `console.log` |

---

## 3. Kiến trúc file

```
tarot-tool/
├── manifest.json          ← Chrome extension config (v3.0.0)
├── background.js          ← Service Worker — chỉ toggle panel (6 dòng)
├── content.css            ← Glassmorphism dark theme (622 dòng)
├── config.json            ← Page IDs thật (committed)
├── config.example.json    ← Template cho người mới
├── price.json             ← Bảng giá — SINGLE SOURCE OF TRUTH
│
├── content/               ← 8 module JS, load theo thứ tự ↓
│   ├── state.js           ← (1) window.TQS namespace + mutable state
│   ├── constants.js       ← (2) Viết tắt dịch vụ, emoji, text config
│   ├── detection.js       ← (3) Auto-detect page, platform, tên khách
│   ├── storage.js         ← (4) Chrome storage CRUD, cross-tab sync
│   ├── readers.js         ← (5) Reader CRUD, rotation, schedule
│   ├── orders.js          ← (6) Order CRUD, message gen, report
│   ├── ui.js              ← (7) Panel HTML, toast, modal, drag
│   └── main.js            ← (8) Init, events, SPA observer — LOAD CUỐI
│
├── popup.html + popup.js + style.css  ← Popup dashboard (chưa dùng)
└── icons/                 ← Extension icons (SVG)
```

### Load Order (quan trọng!)

```
state → constants → detection → storage → readers → orders → ui → main
  ↑                                                                  |
  └──────────── Tất cả đọc/ghi qua window.TQS ─────────────────────┘
```

**Khi thêm module mới:** PHẢI update array `js` trong `manifest.json` đúng thứ tự.

---

## 4. Chi tiết từng module

### `state.js` (41 dòng)
Khai báo `window.TQS = { ... }` với tất cả mutable state. **Không có logic.**

### `constants.js` (54 dòng)
Bảng map tên → viết tắt. Sửa file này để thay đổi output text:
- `T.SERVICE_ABBR` — Tarot→"TA", Lenormand→"LENOR", Bài Tây→"TÂY"
- `T.PACKAGE_ABBR` — 1 CS→"1CS", 7 CS→"7CS", ...
- `T.SOURCE_EMOJI` — facebook→"🔵", instagram→"🟣"

### `detection.js` (98 dòng)
- `detectPageFromURL()` — check `asset_id`, `page_id`, `mailbox_id` từ URL
- `detectSourcePlatform()` — check **chỉ trong conversation area** (không scan sidebar)
- `tryAutoFillCustomer()` — đọc tên khách từ conversation header

### `storage.js` (154 dòng)
- `syncSave(data)` — debounced 200ms write
- `loadConfig()` — fetch `config.json` → build `T.PAGE_IDS` map
- `loadPricingData()` — fetch `price.json`
- `loadData()` — load tất cả saved state từ `chrome.storage.local`
- `initCrossTabSync()` — listener `chrome.storage.onChanged`

### `readers.js` (252 dòng)
- `addReader(name)`, `removeReader(idx)`, `rotateReader()`
- `getActiveReader()` — ưu tiên: manual override > schedule > rotation
- `parseSchedule(text)` — parse "8h - 14h @Hậu @Mai" format
- `startScheduleTimer()` — auto-update mỗi 60s

### `orders.js` (494 dòng) — file lớn nhất
- `generateMessage()` — tạo output text chuẩn
- `populateServices()` / `populatePackages()` — dropdown logic
- `copyAndSave()` — validate → detect platform → copy → save → rotate
- `saveOrder()`, `deleteOrder()`, `openEditOrder()`, `saveEditOrder()`
- `buildReport()`, `copyReport()`, `resetShift()`

### `ui.js` (297 dòng)
- `createPanelHTML()` — toàn bộ HTML template
- `injectPanel()` — inject vào body
- `collectElements(panel)` — cache DOM refs vào `T.els`
- `showToast()`, `showConfirm()` — feedback UI
- `initDrag()`, `initControls()` — panel behavior

### `main.js` (215 dòng)
- `init()` — sequence: inject → loadConfig → loadPricing → loadData → events
- `initEvents()` — wire tất cả event listeners
- `initShortcuts()` — Alt+T toggle, Chrome extension icon click
- `initSPAObserver()` — URL polling 2s (FB Business Suite là SPA)

---

## 5. Data Model

### config.json
```json
{
  "pages": {
    "POBO": { "fbPageId": "918768421315641", "name": "PỜ BƠ" },
    "DUA":  { "fbPageId": "513140915211900", "name": "DỪA" },
    "CA":   { "fbPageId": "105889999207829", "name": "CÁ" }
  },
  "settings": { "salaryPercent": 5, "shiftHistoryMax": 30 }
}
```

### price.json (sửa file này để update giá)
```json
{
  "POBO": {
    "name": "PỜ BƠ", "icon": "🧈", "color": "purple",
    "services": {
      "Tarot":    { "1 Y/N": 9, "1 CS": 20, "3 CS": 55, "5 CS": 85, "7 CS": 115 },
      "Lenormand": { "1 Y/N": 12, "1 CS": 25, ... },
      "Bài Tây":  { ... },
      "⏱ Gói Thời Gian": { "30 Phút": 150, ... }
    }
  }
}
```

### chrome.storage.local keys

| Key | Type | Mô tả |
|-----|------|-------|
| `savedReaders` | `string[]` | Danh sách reader |
| `activeReaderIdx` | `number` | Index reader đang active |
| `autoRotate` | `boolean` | Tự xoay reader |
| `shiftOrders` | `Order[]` | Đơn trong ca hiện tại |
| `shiftStartTime` | `string (ISO)` | Thời gian bắt đầu ca |
| `shiftHistory` | `Shift[]` | Lịch sử ca (max 30) |
| `schedule` | `string` | Raw text lịch |
| `scheduleSlots` | `Slot[]` | Parsed time slots |
| `scheduleMode` | `boolean` | Đang dùng lịch auto |
| `slotReaderIdx` | `Record<string, number>` | Reader index per slot |

### Order object
```typescript
interface Order {
  id: number;            // Date.now()
  page: string;          // "CA" | "DUA" | "POBO"
  pageName: string;      // "CÁ" | "DỪA" | "PỜ BƠ"
  customer: string;
  reader: string;
  service: string;       // "Tarot" | "Custom" | ...
  package: string;       // "1 CS" | ...
  packageDisplay: string; // "1CS TA" (viết tắt cho output)
  price: number;         // đơn vị: k (nghìn VND)
  note: string;
  timestamp: string;     // ISO
}
```

---

## 6. Output Format

### POBO (Pờ Bơ) — KHÔNG có icon page
```
1CS TA - 20k 🔵Phương Thảo @Dương Thư Trâm
7CS TA - 115k 🟣Tuyet Nhii @Nguyễn Nguyên
```

### CÁ, DỪA — CÓ icon + tên page
```
🐟[CÁ] CS TA - 50k 🔵Khách Test @Reader1
🥥[DỪA] 3CS TA - 55k 🟣Khách IG @Reader2
```

**🔵 = Facebook, 🟣 = Instagram** — auto-detected từ conversation DOM.

---

## 7. Module Pattern

```javascript
(function () {
  "use strict";
  const T = window.TQS;

  function myFunction() { /* ... */ }

  // Export public API
  T.moduleName = { myFunction };
})();
```

---

## 8. Khi sửa code — CHECKLIST

- [ ] Không dùng framework / build tool
- [ ] Data từ `price.json` (giá) và `config.json` (page IDs)
- [ ] Storage writes qua `T.storage.syncSave()`
- [ ] New DOM elements dùng `DocumentFragment`
- [ ] Cross-tab sync đã handle trong `storage.js`
- [ ] CSS dùng variables từ `:root`
- [ ] UI text bằng tiếng Việt
- [ ] Export API qua `T.moduleName = { ... }`
- [ ] Thêm module → update `manifest.json` JS array
- [ ] Test: reload extension trên `chrome://extensions`

---

## 9. Kiểm tra nhanh

```bash
# Syntax check tất cả module
for f in content/*.js; do node -c "$f" && echo "✅ $f"; done

# Brace balance CSS
echo "{ $(grep -c '{' content.css)  } $(grep -c '}' content.css)"

# Cross-module refs
grep -rn "T\.\w\+ = {" content/*.js  # Xem exports
grep -rn "T\.\w\+\.\w\+" content/*.js  # Xem cross-calls
```

---

## 10. Known Limitations

- FB Business Suite là SPA → panel dùng **URL polling 2s** để detect thay đổi
- Facebook thường xuyên thay đổi DOM → selector detection có thể cần update
- `config.json` phải có sẵn trước khi load extension
- Schedule chỉ hỗ trợ format: `8h - 14h @Reader1 @Reader2`
