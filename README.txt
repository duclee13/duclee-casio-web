SPELL STUDIO — 15/10/2026 · BẢN GIAO DIỆN GỌN

CẬP NHẬT
- Gộp các cụm phím lặp bằng ngoặc và số lần lặp, gồm cả mẫu dài như
  (1 2 3 4 5 6 7 8 9 0) × 10. Không đổi số phím hoặc thứ tự thực hiện.
- Bỏ đánh dấu hoàn thành bước và thống kê tiến độ.
- Thống kê gọn: n bước · tổng cộng x nút.
- Bỏ bộ chọn mode và các bảng thông số byte ở màn hình soạn.
- Tự so sánh 194an/198an: ưu tiên ít CT2 nội dung hơn, sau đó ít phím
  đã liệt kê hơn; khi bằng nhau ưu tiên ít bước và mode nhỏ hơn.
- Chuỗi để đối chiếu được thu gọn trong từng bước.
- Giữ chế độ 1–4 dòng, bảng ký tự, chặn ký tự không hợp lệ, sao chép,
  TXT/PDF, font phím và chế độ sáng/tối.

THÔNG SỐ
194an (100+60an): 94 byte nội dung, 125 byte Cache Area.
198an (100+64an): 98 byte nội dung, 129 byte Cache Area.
01 rộng 1/3 dấu cách; mỗi dòng tối đa 17 + 1/3 ô.
z = ALPHA S⇔D; Cache Area tính cả z và đuôi 62 19 23.
Chế độ một dòng giữ nguyên thuật toán của bản trước.

CÁCH DÙNG / CẬP NHẬT WEB
Giải nén ZIP, mở index.html để dùng offline.
Để cập nhật GitHub/Vercel: upload toàn bộ 27 file đã giải nén vào cùng
thư mục chứa index.html, thay file trùng tên và commit vào nhánh deploy.
Giữ các file cùng một cấp. Không upload riêng file ZIP.
Chờ deployment hoàn thành rồi tải lại bằng Ctrl+F5.

PHẠM VI KIỂM TRA
Đã kiểm tra việc gộp có thể bung lại đúng từng phím, kể cả mẫu dài và
phần dư; so sánh tự chọn mode; số nút không bị giảm do cách trình bày.
Đã kiểm tra thao tác giao diện bằng DOM mô phỏng và các đường dẫn nội bộ.
Chưa thử quy trình nhiều dòng trên máy Casio thật.
Ở hướng dẫn nhiều dòng, tổng số nút đếm các phím đã liệt kê. Những thao tác
phụ thuộc trạng thái máy (tìm vị trí con trỏ, nhập số đến khi đầy, điền
các @ theo mô tả) chưa có số lần bấm cố định; chú giải nằm ở thống kê.
