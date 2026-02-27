# Tarot QuickSale — AI Agent Context

> Đọc file này để hiểu toàn bộ dự án trong 1 prompt. Dùng cho Gemini, Claude, GPT, hoặc bất kỳ coding AI nào.

## Dự án là gì?

Chrome Extension (Manifest V3) hỗ trợ nhân viên sale Tarot chốt đơn nhanh trên Facebook Business Suite. Inject một floating panel vào trang `business.facebook.com`, cho phép chọn dịch vụ, reader, và tạo tin nhắn format chuẩn gửi vào group Messenger.

## Tech Stack

- **Chrome Extension Manifest V3** — Service Worker, Content Scripts
- **Vanilla JS** — Không framework, không build step
- **CSS** — Dark theme, CSS variables, animations
- **Chrome APIs** — `storage.local`, `tabs`, `scripting`, `runtime.sendMessage`

## Kiến trúc

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  content.js     │────▶│  background.js   │────▶│  messenger.js   │
│  (Facebook UI)  │     │  (Service Worker) │     │  (Chat helper)  │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
    ┌────┴────┐
    │ popup.js│  (Popup khi click icon extension)
    └─────────┘

Data Flow:
  config.json ──▶ PAGE_IDS + CHAT_IDS (bí mật, gitignored)
  price.json  ──▶ Bảng giá dịch vụ (single source of truth)
  chrome.storage.local ──▶ Reader state, orders, shift history
```

## File quan trọng

| File | Vai trò | Kích thước |
|------|---------|-----------|
| `content.js` | Panel chính inject vào Facebook, toàn bộ logic | ~1400 dòng |
| `background.js` | Service worker, gửi tin Messenger, quản lý tab | ~100 dòng |
| `messenger.js` | Type & send tin nhắn trong Messenger tab | ~80 dòng |
| `popup.js` | Logic popup (click icon), dashboard mini | ~250 dòng |
| `price.json` | Bảng giá — sửa file này để update giá | Data file |
| `config.json` | Page ID + Chat ID — KHÔNG commit | Bí mật |
| `content.css` | CSS panel trên Facebook | ~780 dòng |
| `style.css` | CSS popup | ~380 dòng |

## Data Model

### config.json (gitignored)
```json
{
  "pages": {
    "POBO": { "fbPageId": "918...", "name": "PỜ BƠ" },
    "DUA":  { "fbPageId": "513...", "name": "DỪA" },
    "CA":   { "fbPageId": "105...", "name": "CÁ" }
  },
  "messenger": {
    "facebookChatId": "623...",
    "messengerChatId": "816..."
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
      "Trải Tarot": { "Y/N": 39, "CS Tarot": 79, "CS Đặc Biệt": 99 },
      "Câu Lẻ":    { "1 Y/N": 39, "1 CS": 79 }
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

## Quy tắc khi sửa code

1. **Không dùng framework** — Vanilla JS, không React/Vue
2. **Không dùng build tool** — Không webpack/vite, load trực tiếp
3. **Data từ file JSON** — Giá từ `price.json`, config từ `config.json`
4. **Debounce storage writes** — `syncSave()` debounced 200ms
5. **DocumentFragment** — Dùng khi generate nhiều DOM elements trong loop
6. **Cross-tab sync** — `chrome.storage.onChanged` listener để sync state
7. **Không console.log** — Đã xóa hết debug logs, không thêm lại
8. **CSS variables** — Dùng `var(--accent)`, `var(--green)`,... từ `:root` trong content.css
9. **Tiếng Việt** — UI text, toast messages, comments đều tiếng Việt

## Commands thường dùng

```bash
# Reload extension sau khi sửa code
# Chrome → chrome://extensions → 🔄 trên Tarot QuickSale

# Test trên Facebook Business Suite
# Mở: https://business.facebook.com/latest/inbox/all?asset_id=PAGE_ID

# Git workflow
git add -A && git commit -m "feat: mô tả" && git push
```

## Known limitations

- `document.execCommand("insertText")` deprecated nhưng vẫn hoạt động trên Messenger
- Messenger DOM thay đổi thường xuyên, cần update selectors khi Facebook update UI
- `config.json` phải có sẵn trước khi load extension (không có fallback UI)
