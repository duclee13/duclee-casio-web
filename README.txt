SPELL STUDIO — 20261018-direct-v5

CẬP NHẬT V5 — NHẬP TRỰC TIẾP MỘT DÒNG
- Khi toàn bộ ký tự có CT1, bắt buộc vào mode 110an trước.
- Sau khi kích hoạt mode, lấy C (hex 3C) và chuẩn bị đuôi 3C 23.
- Chỉ sau đó mới nhập token, số đệm và hoàn tất spell.
- Giao diện, sao chép và TXT/PDF đều có ba bước tách biệt:
  Vào mode 110an -> Lấy C (hex 3C) -> Viết token.
- Nhánh này không cần gán hex nội dung vào A/B/C. Các ký tự cần hex
  hoặc 01 do co dấu cách vẫn dùng nhánh gán tương ứng.
- Có kiểm thử riêng cho toàn bộ ký tự CT1, mẫu l và 1, căn giữa và
  không căn giữa; kiểm tra thứ tự mode/C/nhập token và tổng phím.

CẬP NHẬT V4 ĐƯỢC GIỮ LẠI
- Spell 2/3/4 dòng dùng số 1 (hex 31, một byte) thay cho z ở đầu dãy.
- Sau ghép tiền tố và xóa đệm, lùi LEFT qua toàn bộ token để về vị trí
  đầu tiên, trước FB01; nhập 1 rồi nhấn = 23 lần. Không nhập sau 19.
- Mọi lần thêm lại hoặc xóa ký tự đầu trong quy trình Cache cũng dùng 1.
- So sánh cả mở rộng FxFy trước và sau nhân đôi; hỗ trợ một tiền tố mẫu
  thành hai ký tự Fx?? / Fy?? hoặc thành một ký tự F???.
- Dãy base được chọn theo số lượt nhân đôi, số CT2 rồi tổng phím.
  Ký tự nhập trực tiếp không chiếm chỗ base. Thử đưa toàn bộ hoặc từng
  nhóm ký tự có CT2 sang bước sau để dành chỗ cho token bắt buộc.
- Tìm cả base có ký tự lặp, nhiều thứ tự, cách ghép và biểu diễn trộn;
  tính các ô A/B/C thực tế và 01 tự sinh giữa các biến.
- Sửa cận byte để không loại nhầm base có thể nén bằng cặp tiền tố F.
- Tính chi phí tạo chữ hex đậm cho cả cặp tiền tố khi so sánh cách gán.
- GIF loading hiện trong lúc tìm phương án; nút đổi thành Đang tìm dãy base.
  Tự tắt khi xong, có lỗi hoặc sửa nội dung. Kết quả cũ không ghi đè lần mới.
  Khi tắt hiệu ứng hoặc bật giảm chuyển động, dùng chỉ báo đứng yên.
- Tất cả file trong ZIP nằm cùng cấp; không có thư mục bọc ngoài.

VÍ DỤ 34 CHỮ À (2 DÒNG, MỖI DÒNG 17 CHỮ, KHÔNG CĂN GIỮA)
A = 1.0000 FB01 F470 F4 ˣ₁₀ 70:
B = 1.F470 F470 F470 F4 ˣ₁₀ 70:
C = 1.F470 F4F4 62 19 23
Bảy F470 và một F4F4 tách thành hai F470: base có 9 chữ à.
Nhân lần 1: 9 -> 18. Nhân lần 2: 18 -> 36, giữ 34 và xóa 2 chữ dư.
Tổng cộng 2 thao tác nhân đôi; 2120 phím trong bản này, CT2 nội dung 0.
Bản trước chọn base 5 và cần 3 thao tác nhân đôi, 2462 phím.
Mẫu thơ 4 dòng Dường như nắng đã / làm má em thêm hồng, / Làn mây bay đã /
yêu tóc em: 2 lượt nhân đôi, 3107 phím, 8 CT2 (không căn giữa, co dấu cách).
Số phím đã tính lại việc lùi về đúng đầu và thay z bằng số 1.

GIỚI HẠN TỐI ƯU
Với base và biểu diễn cố định, bộ chọn giữ token tìm số lượt tối thiểu
trong mô hình nhân đôi rồi xóa. Bộ tìm xét các base và cách biểu diễn khác
nhau với ngân sách thời gian/trạng thái; không tuyên bố tối ưu toàn cục
trên mọi kỹ thuật Casio. optimization.globalOptimalityProven luôn false.
Chỉ báo chứng minh riêng cho raw-token cố định khi đã xét đầy đủ mức nhỏ hơn.
Không hứa dùng hết 100% token nhân ra trong mọi trường hợp: ký tự hiếm
vẫn có thể tạo bản dư. Thứ tự token đầu ra luôn được giữ đúng.

CẬP NHẬT GITHUB / VERCEL
1. Giải nén ZIP, chọn toàn bộ file, upload vào gốc repo GitHub và commit.
   Không upload nguyên ZIP; không tạo thêm folder bọc ngoài.
2. Vercel: Framework Preset Other; Root Directory là gốc repo.
   Build Command: node build.cjs. Output Directory: tắt Override.
3. Build tự tạo .vercel/output/static và functions/api/spell.func.
   Không cần tự tạo/upload các thư mục sinh ra này; giữ đầy đủ server-*.
4. Đợi deployment mới Ready và được gán Production.
   /version.json và /api/spell phải cùng hiện 20261018-direct-v5.
   /api/spell trả unlocked:true khi không bật khóa demo.
Nếu vẫn ra bản cũ, kiểm tra commit, nhánh Production và Build Logs.
Bản ZIP này chưa tự triển khai lên GitHub/Vercel của bạn.

CHẠY VÀ KIỂM TRA TẠI MÁY
Node.js 22.x. Chạy npm start, mở http://localhost:3000.
Không cần npm install vì ứng dụng không có dependency ngoài.
Chạy npm test để kiểm tra thuật toán, API, bản đóng gói và trạng thái loading.
Mở thẳng index.html chỉ chạy một dòng; 2–4 dòng cần API.

QUY TẮC ĐƯỢC GIỮ
- Giới hạn nhập 200 byte; số 1 đầu dãy một byte; đuôi 62 19 23 ba byte.
- 194an (100+60an): 94 byte nội dung, 125 byte Cache Area.
- 198an (100+64an): 98 byte nội dung, 129 byte Cache Area.
- 01 rộng 1/3 ô; mỗi dòng tối đa 17 + 1/3 ô.
- Con trỏ và DEL đếm token; giới hạn nhập đếm byte. 23 vô hình vẫn tính.
- CALC lưu dãy; khi clear, RIGHT gọi lại ở đầu, LEFT ở cuối.
- Đủ 200 byte rồi RIGHT RIGHT DEL mở ranh giới:
  dãy hiện tại + số đệm + 62 19 | dãy đã lưu.
- Bản lưu có số 1 ở đầu; xóa nó bằng RIGHT DEL khi chuyển CT2 trong bản lưu.
  Khi nhân đôi chỉ giữ một số 1 ở đầu kết quả.
- Sau AC RIGHT chỉ xóa số đệm đã lưu, không xóa lần hai phần đã bị bỏ.
- Gán Fxxx không tách qua hai biến; đuôi 62 19 23 được tách qua ranh giới.
- Hướng dẫn tối đa 15 bước; đủ mọi phím, sao chép/TXT/PDF dùng cùng kết quả.
- Giữ tự xếp dòng, bảng glyph, font Casio, căn giữa, co dấu cách, sáng/tối.

CHẾ ĐỘ DEMO
Mặc định không yêu cầu mật khẩu cho 2–4 dòng.
Đặt SPELL_DEMO_REQUIRE_PASSWORD=true để bật khóa demo rồi redeploy.
Có thể đặt SPELL_DEMO_PASSWORD và SPELL_SESSION_SECRET trên Vercel.
Phiên mở khóa có cookie HttpOnly, hiệu lực 8 giờ.
Thuật toán nhiều dòng chạy ở API; build không đưa server-* vào web tĩnh.
Repo GitHub công khai vẫn cho người khác đọc toàn bộ mã nguồn đã commit.

PHẠM VI KIỂM TRA
Kiểm tra số lượt trên các dãy nhỏ bằng đối chiếu độc lập; phát lại byte
khi tách FxFy, xóa đệm và lùi về vị trí đầu tiên để nhập 1; đối chiếu nội dung
2/3/4 dòng, chọn token từ cả hai bản sao, dung lượng Cache, tổng phím,
giới hạn 15 bước, API đóng gói độc lập và trạng thái loading/lỗi/kết quả cũ.
Ví dụ 34 à được kiểm tra cận ô ABC: tối đa 12 à trước nhân; một lượt
nhân không thể tạo đủ 34 trong mô hình gán literal/cặp tiền tố đang dùng.
Chưa thử chuỗi phím trên Casio thật. Kiểm tra giao diện dùng DOM mô phỏng.
