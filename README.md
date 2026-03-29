<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/Manifest-V3-0A84FF?style=for-the-badge" alt="Manifest V3">
  <img src="https://img.shields.io/badge/AI-Gemini_2.5-BF5AF2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini 2.5">
  <img src="https://img.shields.io/badge/Miễn_Phí-100%25-30D158?style=for-the-badge" alt="Free">
</p>

<h1 align="center">🔮 Tarot QuickSale</h1>

<p align="center">
  <b>Chốt đơn Tarot nhanh gấp 5 lần — chỉ cần chọn, bấm, dán.</b><br>
  Chrome Extension dành cho nhân viên sale Tarot trên Facebook Business Suite.<br>
  Tích hợp AI Chat (Google Gemini) để phân tích tin nhắn khách hàng.
</p>

<p align="center">
  <a href="https://github.com/johnny-official/tarot-tool/archive/refs/heads/main.zip">
    <img src="https://img.shields.io/badge/📥_TẢI_VỀ_NGAY-Nhấp_vào_đây-0A84FF?style=for-the-badge&logoColor=white" alt="Tải về ngay" height="50">
  </a>
</p>

---

## ✨ Tính năng

|      | Tính năng             | Mô tả                                                      |
| ---- | --------------------- | ---------------------------------------------------------- |
| ⚡   | **Chốt đơn 1 click**  | Chọn gói → bấm Copy → dán vào group. Đúng format, đúng giá |
| 🏪   | **Tự nhận diện page** | Tự biết đang ở page Bơ, Dừa hay Cá từ URL                  |
| 🔵🟣 | **Phân biệt FB / IG** | Tự phát hiện khách đến từ Facebook hay Instagram           |
| 🔄   | **Tự xoay Reader**    | Copy xong tự chuyển sang reader kế tiếp                    |
| 📅   | **Lịch ca tự động**   | Paste lịch ca → tự gán reader theo khung giờ               |
| 📊   | **Báo cáo kết ca**    | Thống kê đơn, doanh thu, lương — copy 1 click              |
| 🤖   | **AI Chat (Gemini)**  | Paste tin nhắn khách → AI tóm tắt & đếm câu hỏi            |
| ⌨️   | **Phím tắt**          | Alt+C copy nhanh, Alt+A mở AI, Alt+1..9 chọn gói           |

---

## 📥 Cài đặt

### Bước 1 — Tải về

👉 **[Nhấp vào đây để tải](https://github.com/johnny-official/tarot-tool/archive/refs/heads/main.zip)**

Sau khi tải:

1. Mở file ZIP (thường nằm trong thư mục **Downloads**)
2. Chuột phải → **Giải nén tại đây** (Extract Here)
3. Ghi nhớ vị trí thư mục `tarot-tool-main`

### Bước 2 — Cài vào Chrome

1. Mở Chrome → gõ `chrome://extensions` → Enter
2. Bật **Chế độ nhà phát triển** (Developer mode) ở góc phải
3. Bấm **Tải tiện ích đã giải nén** (Load unpacked)
4. Chọn thư mục `tarot-tool-main`
5. Thấy **Tarot QuickSale** xuất hiện → ✅ Xong!

### Bước 3 — Bắt đầu dùng

1. Mở [business.facebook.com](https://business.facebook.com) → vào **Hộp thư** (Inbox)
2. Panel **🔮 QuickSale** tự hiện ở góc phải
3. Không thấy? Nhấn **Alt + T**

---

## 📝 Hướng dẫn chốt đơn

```
Mở cuộc trò chuyện với khách
         ↓
Tên khách tự điền (hoặc gõ tay)
         ↓
Chọn dịch vụ: Tarot / Lenormand / Bài Tây
         ↓
Chọn gói: 1 CS, 3 CS, 7 CS...  →  Giá tự hiện
         ↓
Bấm  [ Copy & Lưu ]
         ↓
Mở group chat → dán (Ctrl + V)
```

### Output mẫu

**Page Bơ / Dừa:**

```
1CS TA - 20k 🔵Phương Thảo @Dương Thư Trâm
7CS LENOR - 145k 🟣Tuyet Nhii @Nguyễn Nguyên
```

**Page Cá** (có `[CÁ]` phía trước):

```
[CÁ] 1CS TA - 20k 🔵Nguyễn Văn A @Vănn Tài
```

| Phần    | Ý nghĩa                 |
| ------- | ----------------------- |
| `1CS`   | 1 Chuyên Sâu (viết tắt) |
| `TA`    | Tarot (viết tắt)        |
| `20k`   | Giá 20 nghìn đồng       |
| 🔵 / 🟣 | Facebook / Instagram    |
| `@Tên`  | Reader đang trực        |

---

## 🤖 AI Chat (Google Gemini)

Tích hợp AI để phân tích tin nhắn khách hàng. Paste tin nhắn vào → AI tự động:

- Tóm tắt câu chuyện
- Đếm & liệt kê từng câu hỏi
- Xác định chủ đề (tình cảm, công việc, tài chính...)

### Cách dùng

1. Bấm nút **✦** trên header panel (hoặc **Alt + A**)
2. Panel AI Chat mở ra bên phải
3. Paste tin nhắn khách hàng vào ô input
4. Nhấn **Enter** hoặc bấm nút gửi
5. AI trả về phân tích — click vào để copy

### Cài đặt AI

Cần API Key của Google Gemini (miễn phí). Xem hướng dẫn chi tiết tại:

👉 **[docs/setup-api-key.md](docs/setup-api-key.md)**

### Tùy chọn AI

Bấm **⚙️** trong panel AI Chat để mở cài đặt:

| Tùy chọn           | Mô tả                                                                      |
| ------------------ | -------------------------------------------------------------------------- |
| **API Key**        | Nhập Google Gemini API Key                                                 |
| **Lịch sử tối đa** | Số tin nhắn giữ lại (3 / 5 / 10 / 20 / 50)                                 |
| **Gửi ngữ cảnh**   | BẬT: gửi lịch sử chat cho AI hiểu context. TẮT: mỗi tin nhắn xử lý độc lập |

> **Mẹo:** Tắt "Gửi ngữ cảnh" nếu bạn muốn mỗi lần paste tin nhắn khách mới đều được phân tích riêng biệt, không bị ảnh hưởng bởi lần trước.

---

## 👤 Quản lý Reader

### Thêm reader

Gõ tên vào ô **"Thêm reader..."** → nhấn **Enter**

### Chọn reader bằng tay

Bấm chip tên reader → dùng cho đơn kế tiếp → sau đó tự quay lại xoay vòng

### Tự xoay reader

- Toggle **↻** BẬT: mỗi đơn copy xong tự chuyển reader
- Toggle **↻** TẮT: giữ nguyên reader

### Xóa reader

Bấm **×** trên chip tên reader

---

## 📅 Lịch ca làm việc

1. Bấm nút **📅** trên panel
2. Copy lịch ca từ group chat
3. Paste vào → bấm **Cập nhật**

**Ví dụ lịch ca:**

```
✨Ca Sáng: 9h - 11h : @Vănn Tài
✨Ca Chiều: 13h - 15h : @Tùng Yến
✨Ca Tối: 19h - 21h : @Dương Thư Trâm @NP Quin's Cky
✨Ca Đêm: 23h - 2h : @Hà Vi
```

> **Lưu ý:** Tên reader phải có dấu `@` phía trước

---

## 📊 Báo cáo kết ca

Bấm **Báo cáo** trên toolbar → tự copy báo cáo → dán vào group.

```
═══════════════════════════════════════
  📊 BÁO CÁO CA TAROT
  📅 15/03/2026  ⏰ 17:00 → 21:30
═══════════════════════════════════════

┌─── PỜ BƠ (4 đơn • 210k) ───
│  1. 1CS TA - 20k
│     Phương Thảo  @Dương Thư Trâm
│  2. 7CS TA - 115k
│     Tuyet Nhii  @Dương Thư Trâm
└─── Tổng PỜ BƠ: 210k

═══════════════════════════════════════
  📈 TỔNG KẾT
  Đơn:    6   Tiền:   280k   Lương:  14k (5%)
═══════════════════════════════════════
```

Bấm **Reset** → xác nhận → bắt đầu ca mới.

---

## ⌨️ Phím tắt

| Phím                | Chức năng              |
| ------------------- | ---------------------- |
| `Alt + T`           | Ẩn / hiện panel        |
| `Alt + A`           | Mở / đóng AI Chat      |
| `Alt + C`           | Copy & Lưu đơn nhanh   |
| `Alt + 1..9`        | Chọn gói nhanh theo số |
| `Enter` (ô khách)   | Nhảy sang chọn dịch vụ |
| `Enter` (ô ghi chú) | Copy & Lưu đơn         |

---

## 💰 Cấu hình

### Thay đổi giá

Sửa `price.json` — số = giá tính theo nghìn đồng (k):

```json
{ "Tarot": { "1 CS": 20, "3 CS": 55, "7 CS": 115 } }
```

### Thêm/sửa fanpage

Sửa `config.json`:

```json
{ "pages": { "POBO": { "fbPageId": "918768421315641", "name": "PỜ BƠ" } } }
```

Cách tìm Page ID: mở Business Suite → thanh địa chỉ → `asset_id=` hoặc `page_id=`

### Sau khi sửa file

1. `chrome://extensions` → tìm Tarot QuickSale → bấm **🔄 Reload**
2. F5 tải lại trang Facebook

---

## ❓ Xử lý lỗi

| Vấn đề            | Cách xử lý                                                                         |
| ----------------- | ---------------------------------------------------------------------------------- |
| Panel không hiện  | Nhấn **Alt + T** · Kiểm tra đang ở `business.facebook.com`                         |
| Không nhận page   | Kiểm tra `config.json` Page ID                                                     |
| Giá sai           | Kiểm tra `price.json` → Reload extension                                           |
| AI không phản hồi | Kiểm tra API Key trong ⚙️ Settings · Xem [setup-api-key.md](docs/setup-api-key.md) |
| AI bịa câu hỏi    | Tắt "Gửi ngữ cảnh" trong ⚙️ Settings                                               |

---

## 🔒 Bảo mật

| Dữ liệu      | Lưu ở đâu                            | An toàn?               |
| ------------ | ------------------------------------ | ---------------------- |
| API Key      | `chrome.storage.local` (trình duyệt) | ✅ Không có trong code |
| Lịch sử chat | Bộ nhớ tạm (RAM)                     | ✅ Mất khi reload      |
| Page IDs     | `config.json`                        | ⚠️ Là ID công khai     |
| Đơn hàng     | `chrome.storage.local`               | ✅ Chỉ lưu trên máy    |

> API Key **không bao giờ** được lưu vào file hay xuất hiện trong source code.

---

## 📞 Liên hệ

- **Telegram:** [@johnnyvv](https://t.me/johnnyvv)
- **GitHub:** [johnny-official/tarot-tool](https://github.com/johnny-official/tarot-tool)

---

<p align="center">
  <b>🔮 Tarot QuickSale</b> — Chốt đơn nhanh, chính xác, không sai format.<br>
  <a href="https://github.com/johnny-official/tarot-tool/archive/refs/heads/main.zip">📥 Tải về ngay</a>
</p>
