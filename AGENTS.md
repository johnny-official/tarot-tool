# Tarot QuickSale — AI Agent Context

> Đọc file này để hiểu toàn bộ dự án trong 1 prompt. Dùng cho Gemini, Claude, GPT, hoặc bất kỳ coding AI nào.

## Dự án là gì?

Chrome Extension (Manifest V3) hỗ trợ nhân viên sale Tarot chốt đơn nhanh trên Facebook Business Suite. Inject một floating panel vào trang `business.facebook.com`, cho phép chọn dịch vụ, reader, và copy tin nhắn format chuẩn để paste vào group Messenger.

## Tech Stack

- **Chrome Extension Manifest V3** — Service Worker, Content Scripts
- **Vanilla JS** — Không framework, không build step
- **CSS** — Glassmorphism dark theme, CSS variables, animations
- **Chrome APIs** — `storage.local`, `runtime.sendMessage`

## Kiến trúc

```
content/                     ← 8 module, load theo thứ tự trong manifest.json
  state.js      ──▶ Namespace window.TQS + tất cả mutable state
  constants.js  ──▶ Viết tắt dịch vụ, emoji, config text
  detection.js  ──▶ Auto-detect page ID, FB/Insta, tên khách
  storage.js    ──▶ Chrome storage CRUD, cross-tab sync
  readers.js    ──▶ Reader CRUD, rotation, schedule system
  orders.js     ──▶ Order CRUD, dashboard, report, dropdown
  ui.js         ──▶ Panel HTML, toast, modal, drag, controls
  main.js       ──▶ Init, event wiring, SPA observer (load SAU CÙNG)

background.js   ──▶ Service Worker, chỉ toggle panel
popup.js + popup.html + style.css ──▶ Popup dashboard (tương lai)

Data:
  config.json   ──▶ Page ID + Chat ID (BÍ MẬT, gitignored)
  price.json    ──▶ Bảng giá dịch vụ (single source of truth)
  content.css   ──▶ CSS glassmorphism dark theme
```

### Module Dependency

```
state.js → constants.js → detection.js → storage.js → readers.js → orders.js → ui.js → main.js
   ↑                                                                                        |
   └────────────── Tất cả module đọc/ghi qua window.TQS ──────────────────────────────────┘
```

## File quan trọng

| File | Vai trò | ~Dòng |
|------|---------|-------|
| `content/state.js` | Namespace `TQS`, tất cả mutable state | ~40 |
| `content/constants.js` | Viết tắt service/package, emoji | ~55 |
| `content/detection.js` | Auto-detect page, platform, customer | ~90 |
| `content/storage.js` | Chrome storage: load/save/sync | ~140 |
| `content/readers.js` | Reader CRUD, rotation, schedule | ~230 |
| `content/orders.js` | Order CRUD, message gen, dashboard, report | ~320 |
| `content/ui.js` | Panel HTML, toast, modal, drag | ~250 |
| `content/main.js` | Init, events, SPA observer | ~170 |
| `background.js` | Toggle panel (6 dòng) | ~6 |
| `content.css` | Glassmorphism dark theme | ~620 |
| `price.json` | Bảng giá — sửa file này để update giá | Data |
| `config.json` | Page ID + Chat ID — KHÔNG commit | Bí mật |

## Data Model

### config.json (gitignored)
```json
{
  "pages": {
    "POBO": { "fbPageId": "918...", "name": "PỜ BƠ" },
    "DUA":  { "fbPageId": "513...", "name": "DỪA" },
    "CA":   { "fbPageId": "105...", "name": "CÁ" }
  },
  "settings": { "salaryPercent": 5, "shiftHistoryMax": 30 }
}
```

### price.json (committed)
```json
{
  "CA": {
    "name": "CÁ", "color": "cyan",
    "services": {
      "Câu Lẻ":    { "Y/N": 9, "CS Tarot": 20 },
      "Combo 3 Câu": { "CS Tarot": 50 }
    }
  }
}
```

### chrome.storage.local keys
- `savedReaders` — `string[]` danh sách reader
- `activeReaderIdx` — `number` index reader đang active
- `autoRotate` — `boolean` tự xoay reader
- `shiftOrders` — `Order[]` đơn trong ca hiện tại
- `shiftStartTime` — `string (ISO)` thời gian bắt đầu ca
- `shiftHistory` — `Shift[]` lịch sử ca (max 30)
- `schedule` — `string` raw text lịch
- `scheduleSlots` — `Slot[]` parsed time slots
- `scheduleMode` — `boolean` dùng lịch auto
- `slotReaderIdx` — `Record<string, number>` reader index per slot

### Order object
```typescript
interface Order {
  id: number;            // Date.now()
  page: string;          // "CA" | "DUA" | "POBO"
  pageName: string;      // "CÁ" | "DỪA" | "PỜ BƠ"
  customer: string;
  reader: string;
  service: string;
  package: string;
  packageDisplay: string;
  price: number;         // đơn vị: k (nghìn VND)
  note: string;
  timestamp: string;     // ISO
}
```

### Module Pattern
Mọi module dùng IIFE pattern, export qua `window.TQS`:
```javascript
(function () {
  "use strict";
  const T = window.TQS;

  function myFunction() { /* ... */ }

  // Export public API
  T.moduleName = { myFunction };
})();
```

## Quy tắc khi sửa code

1. **Không dùng framework** — Vanilla JS, không React/Vue
2. **Không dùng build tool** — Không webpack/vite, load trực tiếp
3. **Data từ file JSON** — Giá từ `price.json`, config từ `config.json`
4. **Debounce storage writes** — `T.storage.syncSave()` debounced 200ms
5. **DocumentFragment** — Dùng khi generate nhiều DOM elements trong loop
6. **Cross-tab sync** — `chrome.storage.onChanged` listener trong `storage.js`
7. **Không console.log** — Không thêm debug logs
8. **CSS variables** — Dùng `var(--accent)`, `var(--green)`,... từ `:root` trong content.css
9. **Tiếng Việt** — UI text, toast messages, comments đều tiếng Việt
10. **Module exports** — Luôn export public API qua `T.moduleName = { ... }`
11. **State qua TQS** — Đọc/ghi state qua `window.TQS`, KHÔNG dùng local variables cho shared state
12. **Load order** — Thêm module mới phải update `manifest.json` content_scripts.js array

## Output Format

### POBO (Pờ Bơ)
```
1CS TA - 20k 🔵Phương Thảo @Dương Thư Trâm
```
- 🔵 = Facebook, 🟣 = Instagram (auto-detected từ DOM)

### CÁ, DỪA
```
🐟[CÁ] CS TA - 50k 👤Khách Test @Reader1
```

## Commands thường dùng

```bash
# Reload extension sau khi sửa code
# Chrome → chrome://extensions → 🔄 trên Tarot QuickSale

# Test trên Facebook Business Suite
# Mở: https://business.facebook.com/latest/inbox/all?asset_id=PAGE_ID
```

## Known limitations

- FB Business Suite là SPA — panel dùng URL polling 2s để detect page change
- Messenger DOM thay đổi thường xuyên
- `config.json` phải có sẵn trước khi load extension (không có fallback UI)
