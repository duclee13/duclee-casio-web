SPELL STUDIO — 20261018-base-v6

BẢN SỬA THEO ẢNH HƯỚNG DẪN
- Vào mode 194an/198an trước, rồi gán hex trực tiếp vào các @.
- Thứ tự xuất luôn là @<4D>, @<4E>, @<4F>, không phụ thuộc thứ tự gán.
- Base và nội dung được lập theo thứ tự dòng 1 đến dòng cuối của văn bản.
- Các ô giá trị @ dùng cùng ràng buộc byte của A/B/C: 6 + 8 + 8 ô.
- Ký tự có CT1 nhập trực tiếp; ký tự có CT2 chuyển cùng launcher.
  Chỉ ký tự không có CT1/CT2 mới nằm trong dãy base bắt buộc.
- Giữ đầy đủ số lần xuất hiện của mỗi ký tự; không bỏ trùng khi cần dùng.
- Thử literal, cặp FxFy, tiền tố đơn và biểu diễn trộn; thử mở rộng trước
  hoặc sau nhân đôi, rồi chọn phương án theo:
  1. Ít lần nhân đôi nhất trong các phương án tìm được.
  2. Ít lượt chuyển Cache nhất.
  3. Ít tổng phím, ít bước, rồi mode nhỏ hơn.
- Không ưu tiên ít CT2 hơn một phương án có thể chuyển chung launcher.
- Chèn launcher trước khi mở Cache, chuyển chung với CT2 nội dung trong
  cùng lượt. Chỉ chia thêm lượt khi các CT2 chưa chuyển vượt Cache.
- Chèn CT1 sau các lượt chuyển để không tốn dung lượng Cache tạm thời.
- Kiểm tra chỗ cho guard 1, đuôi, launcher và CT2 chưa chuyển (2 byte).
- Sau edit lần hai, dùng UP gọi lại dãy theo ảnh rồi bỏ FB01.
- Từ bản v4: số 1 được nhập ở đúng vị trí đầu tiên trước FB01.
- Loại phương án xóa đệm ngay sau cặp tiền tố F chưa mở rộng vì có thể
  làm mất tiền tố. Dùng cách gán literal/mở rộng trước thay thế.

VÍ DỤ NGƯỜI DÙNG — 2 DÒNG, KHÔNG CĂN GIỮA
Nói rằng mình là
người Thanh Hóa

Dãy bắt buộc, theo đúng văn bản:
F483 F432 67 F47C F470 67 F46F F446 61 F483 61
Có 11 ký tự: hai g (67), hai ó (F483). F471 là á, không phải ó.

Một cách gán được bộ tìm chọn:
1234567890𝓍:
@<4D> = 1.0000 FB01 F483 F4 ˣ₁₀ 32:
@<4E> = 1.67 F4F4 67 F46F F4 ˣ₁₀ 46:
@<4F> = 1.61 F483 61 62 19 23

F4F4 mở rộng thành F47C và F470 trước khi xử lý nội dung.
Không cần nhân đôi. N (4E) và T (54) chuyển cùng D của launcher trong
một lượt Cache. Tổng 1524 phím theo mô hình hiện tại, so với 2100 ở v5.

CÁC MẪU KHÁC (KHÔNG CĂN GIỮA)
- Thơ Dường như nắng đã / làm má em thêm hồng, / Làn mây bay đã /
  yêu tóc em: 2 lần nhân đôi, 1 lượt Cache, 2523 phím.
- Hai dòng, mỗi dòng 17 chữ à: vẫn base 9, 2 lần nhân đôi.
- Bốn dòng, mỗi dòng 17 chữ L: base không chứa L, 0 lần nhân đôi;
  68 CT2 nội dung cần 2 lượt Cache, launcher đi cùng lượt cuối.

NHỮNG TÍNH NĂNG ĐƯỢC GIỮ
- Một dòng toàn CT1: bắt buộc vào 110an -> lấy C (3C) -> nhập token.
- GIF loading trong lúc tìm base, xử lý lỗi và kết quả cũ khi đang sửa.
- Tự xếp dòng, căn giữa, co dấu cách, bảng glyph, font phím, sáng/tối.
- Hướng dẫn tối đa 15 bước, sao chép phím/TXT/PDF dùng cùng kết quả.
- 01 rộng 1/3 ô, mỗi dòng tối đa 17 + 1/3 ô.
- Input 200 byte; 194an: nội dung 94/Cache 125 byte;
  198an: nội dung 98/Cache 129 byte.
- Byte 23 vô hình vẫn được tính, đuôi xuất là 62 19 23.

GIỚI HẠN VÀ KIỂM TRA
Bộ tìm có giới hạn thời gian/trạng thái. Có thể chứng minh số lần nhân đôi
cho một base/biểu diễn cố định, không tuyên bố tối ưu toàn cục trên mọi
kỹ thuật máy Casio. optimization.globalOptimalityProven vẫn false.
Không hứa tận dụng 100% token nhân ra trong mọi trường hợp.
Đã kiểm tra thứ tự token cuối, số phím, slot gán, byte khi mở rộng FxFy,
con trỏ về đầu trước khi nhập 1, gộp CT2/launcher, chia lượt Cache, giới hạn
200 byte, trường hợp đầu vào 1/2/3/4 dòng, loading và API đóng gói độc lập.
Chưa kiểm chứng chuỗi phím trên máy Casio thật.

CẬP NHẬT GITHUB / VERCEL
Giải nén ZIP và upload toàn bộ file vào gốc repo rồi commit.
ZIP không có thư mục con, không upload nguyên ZIP.
Framework Preset: Other. Root Directory: gốc repo.
Build Command: node build.cjs. Output Directory: tắt Override.
Build tự tạo cấu trúc .vercel/output/static và functions/api/spell.func.
Giữ toàn bộ file server-*; build không đưa các file này vào web tĩnh.
Đợi deployment mới Ready và gán Production.
/version.json và /api/spell phải cùng hiện 20261018-base-v6.
Nếu vẫn thấy bản cũ: kiểm tra commit, nhánh Production và Build Logs.
Bản này chưa được tự đẩy lên GitHub/Vercel của bạn.

CHẠY TẠI MÁY
Node.js 22.x. Chạy npm start, mở http://localhost:3000.
Không cần npm install vì ứng dụng không có dependency ngoài.
Chạy npm test để kiểm tra. Mở trực tiếp index.html chỉ chạy một dòng;
2–4 dòng cần API.

DEMO
Mặc định không yêu cầu mật khẩu cho 2–4 dòng.
Đặt SPELL_DEMO_REQUIRE_PASSWORD=true để bật lại khóa và redeploy.
Có thể đặt SPELL_DEMO_PASSWORD và SPELL_SESSION_SECRET trên Vercel.
API không công khai thuật toán qua web tĩnh; repo GitHub công khai vẫn
cho người khác đọc toàn bộ mã nguồn đã commit.
