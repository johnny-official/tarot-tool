# 🔮 Tarot QuickSale — Chrome Extension

> **Công cụ hỗ trợ nhân viên Sale Tarot chốt đơn nhanh trên Facebook Business Suite.**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](#cài-đặt)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](#)
[![License](https://img.shields.io/badge/License-Private-red)](#)

---

## 📋 Mục Lục

- [Tính Năng](#-tính-năng)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Cài Đặt](#-cài-đặt)
- [Cấu Hình](#-cấu-hình)
- [Cập Nhật Bảng Giá](#-cập-nhật-bảng-giá)
- [Hướng Dẫn Sử Dụng](#-hướng-dẫn-sử-dụng)
- [Phát Triển](#-phát-triển)

---

## ✨ Tính Năng

| Tính năng | Mô tả |
|-----------|-------|
| 🎯 **Chốt đơn 1-click** | Copy tin nhắn format chuẩn hoặc gửi trực tiếp qua Messenger |
| 👥 **Quản lý Reader** | Thêm/xóa reader, tự động xoay vòng sau mỗi đơn |
| 📅 **Lịch tự động** | Paste lịch ca → auto nhận diện reader theo khung giờ |
| 📊 **Dashboard realtime** | Thống kê đơn, doanh thu, báo cáo ca chi tiết |
| 🔄 **Đồng bộ đa tab** | Mở nhiều page cùng lúc, data sync tức thì |
| 📱 **Nhận diện Page** | Tự detect Cá/Dừa/Pờ Bơ từ URL, hiển thị badge màu tương ứng |
| 📋 **Xuất báo cáo** | Copy hoặc download báo cáo ca dạng text |
| ⌨️ **Phím tắt** | `Alt+T` toggle panel, `Enter` chuyển field nhanh |

---

## 📁 Cấu Trúc Dự Án

```
tarot_tool/
├── manifest.json          # Cấu hình Chrome Extension (Manifest V3)
├── config.json            # 🔒 Biến riêng (Page ID, Chat ID) — KHÔNG COMMIT
├── config.example.json    # 📄 Template config — để người khác tham khảo
├── price.json             # 💰 Bảng giá — Single Source of Truth
├── background.js          # Service Worker (xử lý gửi tin nhắn, tab mgmt)
├── content.js             # Content Script (inject panel vào Facebook)
├── content.css            # CSS cho panel trên Facebook
├── messenger.js           # Helper script cho Messenger (type & send)
├── popup.html             # Popup UI (click icon extension)
├── popup.js               # Logic popup
├── style.css              # CSS cho popup
├── AGENTS.md              # 🤖 Context cho AI assistant
├── .gitignore             # Git ignore rules
└── README.md              # 📖 File này
```

---

## 🚀 Cài Đặt

### Bước 1: Clone repo

```bash
git clone https://github.com/johnny-official/tarot-tool.git
cd tarot-tool
```

### Bước 2: Tạo file cấu hình

```bash
# Copy template
cp config.example.json config.json

# Mở và điền thông tin thật
# - Facebook Page IDs
# - Messenger Chat IDs
```

### Bước 3: Load vào Chrome

1. Mở `chrome://extensions/`
2. Bật **Developer mode** (góc phải trên)
3. Click **Load unpacked** → chọn thư mục `tarot_tool/`
4. Pin extension lên toolbar

### Bước 4: Sử dụng

1. Mở **Facebook Business Suite** (`business.facebook.com`)
2. Panel sẽ tự xuất hiện ở góc phải
3. Hoặc nhấn `Alt+T` để toggle

---

## ⚙️ Cấu Hình

### `config.json` — Biến bí mật (KHÔNG commit)

| Field | Mô tả | Ví dụ |
|-------|--------|-------|
| `pages.*.fbPageId` | Facebook Page ID | `"918768421315641"` |
| `messenger.facebookChatId` | Group chat ID trên facebook.com | `"623973524119607"` |
| `messenger.messengerChatId` | Group chat ID trên messenger.com | `"8164573853616965"` |
| `settings.salaryPercent` | % lương tính trên doanh thu | `5` |
| `settings.shiftHistoryMax` | Số ca lưu tối đa | `30` |

> **Lấy Page ID:** Facebook Business Suite → Settings → Page → Page ID
>
> **Lấy Chat ID:** Mở nhóm chat trên Messenger → URL sẽ có dạng `messenger.com/t/CHAT_ID`

---

## 💰 Cập Nhật Bảng Giá

Chỉ cần sửa file `price.json` — **không cần đụng code!**

```jsonc
{
  "CA": {
    "name": "CÁ",
    "color": "cyan",
    "services": {
      "Trải Tarot": {
        "Y/N": 39,
        "CS Tarot": 79
        // Thêm gói mới ở đây
      }
    }
  }
}
```

Sau khi sửa → vào `chrome://extensions/` → bấm 🔄 Reload.

---

## 📖 Hướng Dẫn Sử Dụng

### Quy trình chốt đơn

```
1. Mở Business Suite + chọn page
2. Nhập tên khách → chọn dịch vụ → chọn gói
3. Bấm "📋 Copy & Lưu" hoặc "📤 Gửi Msg"
4. Done! Reader tự xoay, đơn tự lưu
```

### Reader

| Hành động | Cách làm |
|-----------|----------|
| Thêm reader | Gõ tên vào ô → Enter |
| Chọn reader cho 1 đơn | Click chip reader |
| Xoay tự động | Bật toggle 🔄 |
| Import từ lịch | Bấm 📅 → paste lịch → Cập nhật |

### Phím tắt

| Phím | Hành động |
|------|-----------|
| `Alt + T` | Toggle panel |
| `Enter` (ở tên khách) | Nhảy sang chọn dịch vụ |
| `Enter` (ở ghi chú) | Copy & Lưu |

---

## 🛠 Phát Triển

### Yêu cầu

- Chrome 116+ (Manifest V3)
- Không cần Node.js, không cần build

### Debug

1. `chrome://extensions/` → Tarot QuickSale → **Inspect views: service worker**
2. F12 trên trang Facebook → Console

### Đóng góp

1. Fork repo
2. Tạo branch: `git checkout -b feature/ten-tinh-nang`
3. Commit: `git commit -m "feat: mô tả ngắn"`
4. Push + tạo Pull Request

### Roadmap

- [ ] 🌐 Hỗ trợ nhiều ngôn ngữ (i18n)
- [ ] 📈 Biểu đồ doanh thu theo tuần/tháng
- [ ] 🔔 Thông báo khi đến ca reader
- [ ] 💾 Export/Import data (backup)
- [ ] 🎨 Theme tùy chỉnh (light/dark)

---

## 📄 License

**Private** — Sử dụng nội bộ.

---

<div align="center">
  <sub>Made with 🔮 by <a href="https://github.com/johnny-official">johnny-official</a></sub>
</div>
