# Tarot QuickSale

**Công cụ hỗ trợ nhân viên sale Tarot chốt đơn nhanh trên Facebook Business Suite.**

Thay vì gõ tay từng đơn, bạn chỉ cần chọn dịch vụ, chọn gói, bấm Copy. Tin nhắn chuẩn format sẽ tự động được tạo để bạn paste ngay vào group.

---

## Mục lục

1. [Tính năng chính](#tính-năng-chính)
2. [Yêu cầu](#yêu-cầu)
3. [Cài đặt từng bước](#cài-đặt-từng-bước)
4. [Bắt đầu sử dụng](#bắt-đầu-sử-dụng)
5. [Hướng dẫn chốt đơn](#hướng-dẫn-chốt-đơn)
6. [Quản lý Reader](#quản-lý-reader)
7. [Dán lịch ca làm việc](#dán-lịch-ca-làm-việc)
8. [Báo cáo kết ca](#báo-cáo-kết-ca)
9. [Thay đổi giá dịch vụ](#thay-đổi-giá-dịch-vụ)
10. [Thêm hoặc sửa fanpage](#thêm-hoặc-sửa-fanpage)
11. [Cập nhật Extension sau khi sửa file](#cập-nhật-extension-sau-khi-sửa-file)
12. [Xử lý lỗi thường gặp](#xử-lý-lỗi-thường-gặp)
13. [Phím tắt](#phím-tắt)
14. [Liên hệ hỗ trợ](#liên-hệ-hỗ-trợ)

---

## Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| Chốt đơn 1 click | Chọn dịch vụ, chọn gói, bấm Copy là xong |
| Tự nhận diện page | Tự biết đang ở page Bơ, Dừa hay Cá |
| Phân biệt FB và IG | Tự nhận biết khách nhắn từ Facebook (🔵) hay Instagram (🟣) |
| Tự điền tên khách | Lấy tên từ cuộc hội thoại, không cần gõ |
| Tự xoay Reader | Copy xong đơn, tự chuyển sang reader kế tiếp |
| Lịch ca tự động | Paste lịch ca từ group, tự gán reader theo giờ |
| Báo cáo kết ca | Thống kê đơn, tiền, lương, copy 1 phát là xong |

---

## Yêu cầu

- Trình duyệt **Google Chrome** (phiên bản mới nhất)
- Tài khoản có quyền truy cập **Facebook Business Suite**

Không cần cài thêm bất kỳ phần mềm nào khác.

---

## Cài đặt từng bước

### Bước 1: Tải code về máy

1. Vào trang GitHub của dự án
2. Bấm nút **Code** (nút màu xanh lá)
3. Chọn **Download ZIP**
4. Mở file ZIP vừa tải về
5. Nhấp chuột phải → chọn **Giải nén tại đây** (Extract Here)
6. Bạn sẽ thấy một thư mục tên `tarot-tool`, ghi nhớ vị trí thư mục này

### Bước 2: Cài Extension vào Chrome

1. Mở trình duyệt Chrome
2. Gõ vào thanh địa chỉ phía trên: `chrome://extensions` rồi nhấn **Enter**
3. Ở góc trên bên phải, bật công tắc **Chế độ nhà phát triển** (Developer mode)
4. Bấm nút **Tải tiện ích đã giải nén** (Load unpacked) ở góc trên bên trái
5. Một cửa sổ chọn thư mục sẽ hiện ra
6. Tìm đến thư mục `tarot-tool` mà bạn vừa giải nén ở Bước 1
7. Bấm **Chọn thư mục** (Select Folder)
8. Extension **Tarot QuickSale** sẽ xuất hiện trong danh sách, vậy là xong

### Bước 3: Ghim Extension lên thanh công cụ (không bắt buộc)

1. Trên thanh Chrome, bấm vào biểu tượng hình **mảnh ghép** (Extensions) ở góc trên bên phải
2. Tìm **Tarot QuickSale** trong danh sách
3. Bấm biểu tượng **ghim** bên cạnh
4. Từ giờ bạn có thể bấm vào icon trên thanh Chrome để bật/tắt panel nhanh

---

## Bắt đầu sử dụng

1. Mở trình duyệt Chrome
2. Vào **Facebook Business Suite** tại địa chỉ: [business.facebook.com](https://business.facebook.com)
3. Chọn **Hộp thư** (Inbox) của fanpage bất kỳ
4. Panel **QuickSale** sẽ tự động hiện ở góc phải màn hình

**Nếu không thấy panel**, thử một trong các cách sau:
- Nhấn tổ hợp phím **Alt + T** trên bàn phím
- Bấm vào icon Extension trên thanh Chrome
- Vào `chrome://extensions` kiểm tra extension đã bật chưa

---

## Hướng dẫn chốt đơn

Đây là quy trình chốt đơn từ đầu đến cuối:

```
Mở cuộc trò chuyện với khách
         ↓
Tên khách tự điền (hoặc gõ tay nếu cần)
         ↓
Chọn loại bài: Tarot / Lenormand / Bài Tây
         ↓
Chọn gói: 1 CS, 3 CS, 7 CS...  →  Giá tự hiện
         ↓
Bấm  [ 📋 Copy & Lưu ]
         ↓
Mở group chat → dán tin nhắn (Ctrl + V)
```

### Kết quả copy ra trông như thế nào?

**Page Bơ** (không có icon page phía trước):
```
1CS TA - 20k 🔵Phương Thảo @Dương Thư Trâm
7CS LENOR - 145k 🟣Tuyet Nhii @Nguyễn Nguyên
```

**Page Cá** (có icon và tên page phía trước):
```
🐟[CÁ] CS TA - 20k 🔵Nguyễn Văn A @Vănn Tài
```

**Page Dừa** (có icon và tên page phía trước):
```
🥥[DỪA] 3CS TA - 55k 🟣Khách Instagram @Ngọc Phan
```

### Giải thích từng phần trong tin nhắn

Lấy ví dụ: `1CS TA - 20k 🔵Phương Thảo @Dương Thư Trâm`

| Phần | Ý nghĩa |
|------|---------|
| `1CS` | 1 Câu Soi (viết tắt tự động) |
| `TA` | Tarot (viết tắt tự động) |
| `20k` | Giá 20 nghìn đồng |
| 🔵 | Khách nhắn từ **Facebook** |
| 🟣 | Khách nhắn từ **Instagram** |
| `Phương Thảo` | Tên khách hàng |
| `@Dương Thư Trâm` | Reader đang trực ca |

---

## Quản lý Reader

### Thêm reader mới

1. Ở phần Reader trên panel, tìm ô **"Gõ tên → Enter"**
2. Gõ tên reader vào
3. Nhấn **Enter**
4. Reader sẽ xuất hiện dưới dạng chip có thể bấm chọn

### Chọn reader bằng tay

Bấm vào chip tên reader muốn chọn. Reader đó sẽ được dùng cho đơn tiếp theo. Sau đơn đó, hệ thống tự quay lại xoay vòng bình thường.

### Bật hoặc tắt tự xoay reader

- **Bật** toggle xoay: Mỗi đơn copy xong sẽ tự chuyển sang reader kế tiếp
- **Tắt** toggle xoay: Giữ nguyên reader hiện tại cho tất cả đơn

### Xoá reader

Bấm dấu **×** trên chip tên reader muốn xoá.

---

## Dán lịch ca làm việc

Tính năng này giúp bạn **tự động gán reader theo giờ** dựa trên lịch ca làm việc của team.

### Cách dùng

1. Bấm nút **📅** trên panel
2. Mở group chat, copy lịch ca mà quản lý đã đăng
3. Quay lại panel, paste lịch ca vào ô text
4. Bấm **Cập nhật**

### Ví dụ lịch ca

Giả sử quản lý đăng thông báo thế này trong group:

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

Bạn chỉ cần **copy toàn bộ đoạn text trên**, paste vào ô lịch, bấm Cập nhật. Extension sẽ tự hiểu:

- Ca nào bắt đầu mấy giờ, kết thúc mấy giờ
- Reader nào trực ca nào
- Ca có 2 reader (ví dụ 19h đến 21h) thì tự xoay giữa 2 người
- Ca đêm qua ngày (23h đến 2h) cũng hiểu

Sau khi cập nhật, reader sẽ **tự động chuyển theo giờ**, bạn không cần làm gì thêm.

**Lưu ý quan trọng:**
- Tên reader phải có dấu `@` ở trước, ví dụ: `@Hà Vi`, `@Ngọc Phan`
- Giờ viết dạng `9h`, `14h`, hoặc `9:00`, `14:00` đều được

---

## Báo cáo kết ca

Khi hết ca làm việc, bạn có thể xuất báo cáo chi tiết chỉ với 1 nút bấm.

### Cách xuất báo cáo

1. Bấm nút **📋** trên thanh header của panel (cạnh tên page)
2. Báo cáo sẽ tự động được copy vào clipboard
3. Mở group chat hoặc tin nhắn cho quản lý
4. Dán báo cáo (Ctrl + V)

### Báo cáo mẫu

Sau khi bấm nút 📋, tin nhắn copy ra sẽ trông như thế này:

```
═══════════════════════════════════════
  📊 BÁO CÁO CA TAROT
  📅 15/03/2026  ⏰ 17:00 → 21:30
═══════════════════════════════════════

┌─── PỜ BƠ (4 đơn • 210k) ───
│
│  1. 1CS TA - 20k
│     Phương Thảo  @Dương Thư Trâm
│     17:15
│  2. 7CS TA - 115k
│     Tuyet Nhii  @Dương Thư Trâm
│     17:42
│  3. 3CS LENOR - 70k
│     Ngọc Hà  @NP Quin's Cky
│     19:05
│  4. 1Y/N TA - 5k
│     Hoàng Long  @NP Quin's Cky
│     19:30
│
└─── Tổng PỜ BƠ: 210k

┌─── CÁ (2 đơn • 70k) ───
│
│  5. CS TA - 20k
│     Minh Tú  @Dương Thư Trâm
│     18:10
│  6. 3CB - 50k
│     Thanh Hằng  @NP Quin's Cky
│     20:15
│
└─── Tổng CÁ: 70k

┌─── 👤 THỐNG KÊ THEO READER ─────────
│
│  @Dương Thư Trâm: 3 đơn · 155k
│  @NP Quin's Cky: 3 đơn · 125k
│
└─────────────────────────────────────

═══════════════════════════════════════
  📈 TỔNG KẾT
  Đơn:    6
  Tiền:   280k
  Lương:  14k (5%)
═══════════════════════════════════════
```

### Giải thích báo cáo

| Phần | Ý nghĩa |
|------|---------|
| Tiêu đề | Ngày làm việc, giờ bắt đầu và kết thúc ca |
| Theo page | Gom đơn theo từng page (Bơ, Cá, Dừa), kèm số đơn và tổng tiền |
| Chi tiết đơn | Số thứ tự, gói dịch vụ, giá, tên khách, reader, giờ chốt |
| Theo Reader | Thống kê mỗi reader bao nhiêu đơn, bao nhiêu tiền |
| Tổng kết | Tổng số đơn, tổng tiền, lương 5% |

### Reset ca mới

1. Bấm nút **🔄** trên thanh header
2. Xác nhận "Reset ca?"
3. Ca cũ được **tự động lưu vào lịch sử** (lưu tối đa 30 ca gần nhất)
4. Bắt đầu ca mới với số đơn = 0

---

## Thay đổi giá dịch vụ

Khi cần cập nhật bảng giá, bạn sửa file `price.json` trong thư mục extension.

**Cách mở file:** Nhấp chuột phải vào file `price.json` → chọn **Mở bằng** (Open with) → chọn **Notepad** hoặc bất kỳ trình soạn thảo nào.

Cấu trúc bên trong file trông như thế này:

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

- Số bên phải là **giá** tính theo nghìn đồng
- Ví dụ: `"1 CS": 20` nghĩa là gói 1 Câu Soi giá 20k

Sau khi sửa xong, nhớ **cập nhật extension** (xem hướng dẫn bên dưới).

---

## Thêm hoặc sửa fanpage

Sửa file `config.json` (cũng mở bằng Notepad):

```json
{
  "pages": {
    "POBO": { "fbPageId": "918768421315641", "name": "PỜ BƠ" },
    "DUA":  { "fbPageId": "513140915211900", "name": "DỪA" },
    "CA":   { "fbPageId": "105889999207829", "name": "CÁ" }
  }
}
```

### Cách tìm Page ID của fanpage

1. Mở fanpage trên Facebook Business Suite
2. Nhìn lên thanh địa chỉ trình duyệt
3. Tìm đoạn `asset_id=` hoặc `page_id=` trong URL
4. Dãy số phía sau đó chính là Page ID

Ví dụ, nếu URL trông như thế này:
```
https://business.facebook.com/latest/inbox/all?asset_id=918768421315641&...
```
Thì Page ID là: `918768421315641`

---

## Cập nhật Extension sau khi sửa file

Mỗi khi bạn sửa file `price.json`, `config.json`, hoặc bất kỳ file nào trong thư mục extension:

1. Mở Chrome
2. Gõ `chrome://extensions` vào thanh địa chỉ, nhấn Enter
3. Tìm **Tarot QuickSale** trong danh sách
4. Bấm biểu tượng mũi tên tròn (Reload) bên cạnh tên extension
5. Quay lại tab Facebook Business Suite
6. Nhấn phím **F5** để tải lại trang

---

## Xử lý lỗi thường gặp

### Panel không hiện

- Kiểm tra bạn đang ở trang `business.facebook.com` (không phải `facebook.com` thường)
- Nhấn **Alt + T** trên bàn phím
- Bấm icon Extension trên thanh Chrome
- Vào `chrome://extensions` kiểm tra extension đã bật chưa

### Không nhận diện được fanpage

- Mở file `config.json`, kiểm tra Page ID có đúng không
- So sánh Page ID trong config với dãy số trong URL trên thanh địa chỉ
- Cập nhật extension sau khi sửa config

### Giá không đúng hoặc không hiện

- Kiểm tra file `price.json` có đúng cú pháp không (đặc biệt dấu phẩy và ngoặc nhọn)
- Cập nhật extension sau khi sửa

### Copy ra icon tím (🟣) thay vì xanh (🔵)

- 🟣 nghĩa là extension nhận diện khách nhắn từ **Instagram**
- 🔵 nghĩa là khách nhắn từ **Facebook**
- Kiểm tra lại cuộc hội thoại để xác nhận nguồn khách

---

## Phím tắt

| Phím | Chức năng |
|------|-----------|
| `Alt + T` | Ẩn hoặc hiện panel |
| `Enter` (ở ô tên khách) | Nhảy sang chọn dịch vụ |
| `Enter` (ở ô ghi chú) | Copy và Lưu đơn |
| `Enter` (ở ô thêm reader) | Thêm reader mới |

---

## Liên hệ hỗ trợ

Mọi thắc mắc, góp ý, hoặc báo lỗi, liên hệ:

- **Telegram:** [@johnnyvv](https://t.me/johnnyvv)
- **Facebook:** [Johnny Vu](https://facebook.com)

---

*Tarot QuickSale — Chốt đơn nhanh, chính xác, không sai format.*
