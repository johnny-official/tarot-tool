# Tarot QuickSale

**Công cụ hỗ trợ nhân viên sale Tarot chốt đơn nhanh trên Facebook Business Suite.**

Thay vì gõ tay từng đơn, bạn chỉ cần chọn dịch vụ, chọn gói, bấm Copy — tin nhắn chuẩn format sẽ được copy vào clipboard để paste ngay vào group.

---

## Mục lục

1. [Tính năng](#tính-năng)
2. [Yêu cầu](#yêu-cầu)
3. [Cài đặt](#cài-đặt)
4. [Bắt đầu sử dụng](#bắt-đầu-sử-dụng)
5. [Chốt đơn](#chốt-đơn)
6. [Quản lý Reader](#quản-lý-reader)
7. [Dán lịch ca](#dán-lịch-ca)
8. [Báo cáo ca](#báo-cáo-ca)
9. [Thay đổi giá dịch vụ](#thay-đổi-giá-dịch-vụ)
10. [Thêm hoặc sửa fanpage](#thêm-hoặc-sửa-fanpage)
11. [Xử lý lỗi thường gặp](#xử-lý-lỗi-thường-gặp)
12. [Liên hệ hỗ trợ](#liên-hệ-hỗ-trợ)

---

## Tính năng

| Tính năng | Mô tả |
|-----------|-------|
| Chốt đơn 1 click | Chọn dịch vụ → chọn gói → bấm Copy là xong |
| Tự nhận diện page | Tự biết đang ở Bơ, Dừa hay Cá — không cần chọn tay |
| Phân biệt FB / Instagram | Tự nhận biết khách nhắn từ Facebook (🔵) hay Instagram (🟣) |
| Tự điền tên khách | Lấy tên từ cuộc hội thoại, không cần gõ |
| Tự xoay Reader | Copy xong đơn → tự chuyển sang reader kế tiếp |
| Lịch ca tự động | Paste lịch ca từ group → tự gán reader theo giờ |
| Báo cáo ca | Thống kê đơn, tiền, lương — copy 1 phát |

---

## Yêu cầu

- Trình duyệt **Google Chrome** (bản mới nhất)
- Tài khoản có quyền truy cập **Facebook Business Suite**

Không cần cài thêm bất kỳ phần mềm nào khác.

---

## Cài đặt

### Bước 1 — Tải code về máy

Có 2 cách:

**Cách 1: Tải file ZIP** (đơn giản nhất)
1. Vào trang GitHub của dự án
2. Bấm nút **Code** (nút màu xanh lá)
3. Chọn **Download ZIP**
4. Mở file ZIP vừa tải → **Giải nén** ra một thư mục (nhấp chuột phải → "Giải nén tại đây" hoặc "Extract Here")
5. Ghi nhớ vị trí thư mục `tarot-tool` vừa giải nén

**Cách 2: Dùng Git** (cho ai biết dùng terminal)
```
git clone https://github.com/YourUsername/tarot-tool.git
```

### Bước 2 — Cài Extension vào Chrome

1. Mở Chrome
2. Gõ vào thanh địa chỉ: `chrome://extensions` rồi nhấn **Enter**
3. Ở góc trên bên phải, bật công tắc **Chế độ nhà phát triển** (Developer mode)
4. Bấm nút **Tải tiện ích đã giải nén** (Load unpacked) ở góc trên bên trái
5. Một cửa sổ chọn thư mục sẽ hiện ra → tìm đến thư mục `tarot-tool` mà bạn vừa giải nén ở Bước 1 → bấm **Chọn thư mục** (Select Folder)
6. Extension **Tarot QuickSale** sẽ xuất hiện trong danh sách

Vậy là xong! Extension đã được cài đặt.

### Bước 3 — Ghim Extension lên thanh công cụ (tuỳ chọn)

1. Bấm vào biểu tượng **hình ghim** (Extensions) trên thanh Chrome (biểu tượng puzzle ở góc trên bên phải)
2. Tìm **Tarot QuickSale** trong danh sách
3. Bấm biểu tượng **ghim** bên cạnh để ghim lên thanh công cụ

---

## Bắt đầu sử dụng

1. Mở trình duyệt Chrome
2. Vào **Facebook Business Suite**: [business.facebook.com](https://business.facebook.com)
3. Chọn **Hộp thư** (Inbox) của fanpage bất kỳ
4. Panel **QuickSale** sẽ tự động hiện ở góc phải màn hình

Nếu không thấy panel, thử:
- Nhấn tổ hợp phím **Alt + T**
- Hoặc bấm vào icon Extension trên thanh Chrome

---

## Chốt đơn

Đây là quy trình chốt đơn từ đầu đến cuối:

```
Mở cuộc trò chuyện với khách
        ↓
Tên khách tự điền (hoặc gõ tay)
        ↓
Chọn loại bài (Tarot / Lenormand / Bài Tây)
        ↓
Chọn gói (1 CS, 3 CS, 7 CS...)  →  Giá tự hiện
        ↓
Bấm  [ 📋 Copy & Lưu ]
        ↓
Paste vào group chat  (Ctrl + V)
```

**Kết quả copy ra sẽ như thế này:**

Page Bơ (không có icon page):
```
1CS TA - 20k 🔵Phương Thảo @Dương Thư Trâm
```

Page Cá (có icon và tên page):
```
🐟[CÁ] CS TA - 20k 🔵Nguyễn Văn A @Vănn Tài
```

Page Dừa (có icon và tên page):
```
🥥[DỪA] 3CS TA - 55k 🟣Khách Instagram @Ngọc Phan
```

Trong đó:
- `1CS TA` = 1 câu soi Tarot (viết tắt tự động)
- `20k` = giá 20 nghìn đồng
- 🔵 = khách nhắn từ **Facebook**
- 🟣 = khách nhắn từ **Instagram**
- `@Dương Thư Trâm` = reader đang trực

---

## Quản lý Reader

### Thêm reader mới

1. Ở phần Reader trên panel, gõ tên reader vào ô **"Gõ tên → Enter"**
2. Nhấn **Enter**
3. Reader sẽ xuất hiện dưới dạng chip có thể bấm

### Chọn reader bằng tay

Bấm vào chip tên reader muốn chọn. Reader đó sẽ được dùng cho đơn tiếp theo. Sau đơn đó, hệ thống sẽ tự quay lại xoay vòng bình thường.

### Bật/tắt tự xoay reader

- **Bật** toggle 🔄: Mỗi đơn copy xong → tự chuyển sang reader kế tiếp
- **Tắt** toggle 🔄: Giữ nguyên reader hiện tại cho tất cả đơn

### Xoá reader

Bấm dấu **×** trên chip tên reader.

---

## Dán lịch ca

Đây là tính năng giúp bạn **tự động gán reader theo giờ** dựa trên lịch ca làm việc.

### Cách dùng

1. Bấm nút **📅** trên panel
2. Copy lịch ca từ group chat (ví dụ từ thông báo của quản lý)
3. Paste nguyên vào ô text
4. Bấm **Cập nhật**

### Ví dụ lịch ca

Giả sử quản lý đăng thông báo như thế này trong group:

```
🎀🎀 CA LÀM VIỆC 🎀🎀
✨Ca Sáng: 9h - 11h : @Vănn Tài
✨Ca Sáng: 11h - 13h : @Ngọc Phan
✨Ca Chiều: 13h - 15h : @Tùng Yến
✨Ca Chiều: 15h - 17h : @Hương Ly
✨Ca Tối: 17h - 19h : @Dương Thư Trâm
✨Ca Tối: 19h - 21h : @Dương Thư Trâm @NP Quin's Cky
✨Ca Đêm: 21h - 23h : @An Du Trân @NP Quin's Cky
✨Ca Đêm: 23h - 2h : @Hà Vi
```

Bạn chỉ cần **copy toàn bộ đoạn text trên** và paste vào ô lịch. Extension sẽ tự hiểu:

- Ca nào bắt đầu lúc mấy giờ, kết thúc mấy giờ
- Reader nào trực ca nào
- Ca có 2 reader (như 19h-21h) thì tự xoay giữa 2 người
- Ca đêm qua ngày (23h - 2h) cũng hiểu

Sau khi cập nhật, reader sẽ **tự động chuyển** theo giờ — bạn không cần làm gì thêm.

### Lưu ý

- Tên reader **phải có dấu @** ở trước. Ví dụ: `@Hà Vi`, `@Ngọc Phan`
- Giờ viết dạng `9h`, `14h`, hoặc `9:00`, `14:00` đều được
- Giữa 2 mốc giờ dùng dấu `-` hoặc `–`

---

## Báo cáo ca

### Copy báo cáo

Bấm nút **📋** ở thanh header (cạnh tên page) → báo cáo ca được copy vào clipboard.

Báo cáo bao gồm:
- Ngày, giờ bắt đầu/kết thúc ca
- Danh sách từng đơn (gói, giá, khách, reader, thời gian)
- Thống kê theo page, theo reader
- Tổng đơn, tổng tiền, lương (5%)

### Reset ca

Bấm nút **🔄** ở thanh header → xác nhận → reset ca mới.

Ca cũ sẽ được **lưu lại** trong lịch sử (tối đa 30 ca).

---

## Thay đổi giá dịch vụ

Khi cần cập nhật giá, sửa file `price.json` trong thư mục extension.

Mở file bằng Notepad hoặc bất kỳ trình soạn thảo nào. Cấu trúc như sau:

```json
{
  "POBO": {
    "name": "PỜ BƠ",
    "icon": "🧈",
    "services": {
      "Tarot": {
        "1 Y/N": 9,
        "1 CS": 20,
        "3 CS": 55,
        "5 CS": 85,
        "7 CS": 115
      },
      "Lenormand": {
        "1 Y/N": 12,
        "1 CS": 25
      }
    }
  }
}
```

- Số bên phải là **giá** (đơn vị: nghìn đồng)
- Ví dụ: `"1 CS": 20` nghĩa là gói 1 Câu Soi giá 20k

Sau khi sửa xong, **phải reload extension** (xem phần bên dưới).

---

## Thêm hoặc sửa fanpage

Sửa file `config.json`:

```json
{
  "pages": {
    "POBO": { "fbPageId": "918768421315641", "name": "PỜ BƠ" },
    "DUA":  { "fbPageId": "513140915211900", "name": "DỪA" },
    "CA":   { "fbPageId": "105889999207829", "name": "CÁ" }
  }
}
```

**Cách tìm Page ID của fanpage:**

1. Mở fanpage trên Facebook Business Suite
2. Nhìn lên thanh địa chỉ trình duyệt
3. Tìm đoạn `asset_id=` hoặc `page_id=` trong URL
4. Dãy số phía sau đó chính là Page ID

Ví dụ URL:
```
https://business.facebook.com/latest/inbox/all?asset_id=918768421315641&...
```
→ Page ID là `918768421315641`

---

## Reload Extension sau khi sửa file

Mỗi khi sửa `price.json`, `config.json`, hoặc bất kỳ file nào:

1. Mở Chrome → vào `chrome://extensions`
2. Tìm **Tarot QuickSale**
3. Bấm biểu tượng **🔄 mũi tên tròn** (Reload)
4. Quay lại tab Facebook Business Suite → nhấn **F5** để refresh trang

---

## Xử lý lỗi thường gặp

### Panel không hiện

- Kiểm tra bạn đang ở trang `business.facebook.com` (không phải `facebook.com` thường)
- Thử nhấn **Alt + T**
- Thử bấm icon Extension trên thanh Chrome
- Vào `chrome://extensions` kiểm tra extension có đang bật không

### Không nhận diện được fanpage

- Mở file `config.json` kiểm tra Page ID có đúng không
- So sánh Page ID trong config với số trong URL thanh địa chỉ
- Reload extension sau khi sửa config

### Giá không đúng hoặc không hiện

- Kiểm tra file `price.json` có đúng cú pháp JSON không (dấu phẩy, ngoặc)
- Reload extension

### Copy ra icon tím (🟣) thay vì xanh (🔵)

- 🟣 nghĩa là extension nhận diện khách từ **Instagram**
- 🔵 nghĩa là khách từ **Facebook**
- Nếu bị sai, kiểm tra lại cuộc hội thoại có dấu hiệu Instagram không

---

## Phím tắt

| Phím | Chức năng |
|------|-----------|
| `Alt + T` | Ẩn/hiện panel |
| `Enter` (ở ô tên khách) | Nhảy sang chọn dịch vụ |
| `Enter` (ở ô ghi chú) | Copy & Lưu đơn |
| `Enter` (ở ô thêm reader) | Thêm reader |

---

## Liên hệ hỗ trợ

Mọi thắc mắc, góp ý, hoặc báo lỗi:

- **Telegram:** [@johnnyvv](https://t.me/johnnyvv)
- **Facebook:** [Johnny Vu](https://facebook.com)

---

*Tarot QuickSale — Chốt đơn nhanh, chính xác, không sai format.*
