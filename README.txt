SPELL STUDIO — 17/10/2026 · DEMO CÓ MẬT KHẨU

CẬP NHẬT
- Bỏ chữ chú thích nhỏ trong ô bước; vẫn đủ phím và tối đa 15 bước.
- Gán hex dùng đúng ký tự ˣ₁₀ bằng font ClassWiz X Display.
- Mở chế độ 2–4 dòng bằng mật khẩu, xử lý thuật toán trên server.
- Hướng dẫn tối đa 15 bước, gộp các bước liền nhau và dùng tiêu đề ngắn.
  Giữ nguyên thứ tự phím, tổng nút và chuỗi đối chiếu.
  Giới hạn áp dụng đồng thời trên web, sao chép, TXT và PDF.
- Giới hạn vùng nhập: 200 byte, tính cả z và đuôi 62 19 23.
- Sau khi lưu đầy Cache, nhập bổ sung đúng 75 chữ số ở 194an hoặc
  71 chữ số ở 198an. Nhân đôi dùng 200 trừ số byte của dãy hiện có.
- Sinh đủ phím di chuyển, thêm z, lưu dãy, chuyển CT2, xóa số đệm,
  chọn ký tự trong hai bản sao và ghép hackstring 2/3/4 dòng.
- Sau AC RIGHT chỉ xóa nhóm số đệm đã lưu trong Cache; nhóm nhập
  bổ sung nằm trong vùng nhập đã bị bỏ, không xóa lần thứ hai.
- Con trỏ và DEL đếm theo token; giới hạn nhập đếm theo byte.
  Ký tự Fxxx hai byte vẫn chỉ cần một lần di chuyển/xóa.
- Thống kê: n bước · tổng cộng x nút. Không còn thao tác tìm vị trí
  hay nhập đến khi đầy nằm ngoài chuỗi phím.
- Gộp pattern bằng ngoặc; tổng nút vẫn tính đủ từng lần bấm.
- Tự chọn 194an/198an: ưu tiên ít CT2 nội dung, sau đó ít phím,
  ít bước, cuối cùng mode nhỏ hơn.
- Đuôi 62 19 23 có thể tách qua A/B hoặc B/C, kết thúc trước ô số mũ.
  23 là byte cuối; ký tự Fxxx không bị tách qua hai biến.
- Giữ chế độ 1–4 dòng, bảng ký tự, chặn ký tự không hợp lệ, sao chép,
  TXT/PDF, font phím và chế độ sáng/tối.

QUY TẮC ĐÃ ÁP DỤNG
194an (100+60an): 94 byte nội dung, 125 byte Cache Area.
198an (100+64an): 98 byte nội dung, 129 byte Cache Area.
01 rộng 1/3 dấu cách; mỗi dòng tối đa 17 + 1/3 ô.
z = ALPHA S⇔D, một byte. Đuôi 62 19 23 là ba byte.
CALC lưu dãy. Khi màn hình clear, RIGHT gọi lại ở đầu, LEFT ở cuối.
Sau khi đủ 200 byte, RIGHT RIGHT DEL mở ranh giới:
  dãy hiện tại + số đệm + 62 19 | dãy đã lưu
Bản lưu gồm z đầu dãy; chương trình xóa z đó bằng RIGHT DEL trong
bản lưu khi chuyển CT2. Khi nhân đôi chỉ giữ một z ở đầu kết quả.
Sau lấy F, CALC AC RIGHT lưu và đưa con trỏ về đầu trước khi ghép đuôi.

CÁCH DÙNG / CẬP NHẬT WEB
Giải nén ZIP. Upload toàn bộ nội dung, giữ nguyên các thư mục api/,
server/ và tests/, vào thư mục gốc repo GitHub đã kết nối Vercel.
Không upload riêng ZIP. Thay các file trùng tên và commit.
vercel.json đã cấu hình: Framework Other, Build node build.cjs,
Output Directory public. Root Directory là nơi chứa vercel.json.
Nếu dự án có cấu hình cũ trong dashboard, dùng các giá trị trên.
Vercel chỉ phục vụ nội dung public/ và API; KHÔNG đổi output về dấu chấm.
Giữ repo GitHub PRIVATE nếu không muốn người khác xem thuật toán server.

CHẾ ĐỘ DEMO
- Mật khẩu mặc định: apple123. Mở khóa 2–4 dòng trong 8 giờ.
- Mật khẩu được kiểm tra trên server; cookie HttpOnly có chữ ký.
- Thuật toán nhiều dòng chỉ chạy trong API, không nằm trong JS công khai.
- Giao diện, xem trước chữ và thuật toán một dòng vẫn là mã công khai.
- Bản build không công khai README, server/, cấu hình khóa, PDF nhiều dòng.
- Có thể đặt SPELL_DEMO_PASSWORD và SPELL_SESSION_SECRET trong Environment
  Variables trên Vercel rồi redeploy để thay mật khẩu/khóa phiên.
  SPELL_SESSION_SECRET nên là chuỗi ngẫu nhiên dài ít nhất 32 ký tự.
- Bản mặc định có khóa riêng trong server/config.json. Không chia sẻ file này
  hoặc ZIP nguồn cho người không được phép truy cập thuật toán.
- Mã đã công khai ở bản triển khai hoặc lịch sử Git cũ không tự biến mất.

CHẠY TRÊN MÁY TÍNH
Cài Node.js, mở terminal ở thư mục đã giải nén, chạy npm start.
Mở http://localhost:3000. Không cần npm install vì không có dependency.
Mở thẳng index.html chỉ dùng được tính năng một dòng; demo cần API.
Chạy npm test để kiểm tra API, xác thực, đầu ra và file công khai.

PHẠM VI KIỂM TRA
Đã kiểm tra mô hình con trỏ và phát lại độc lập phím di chuyển/xóa
trong bước nhân đôi; giới hạn 200 byte; phép tính Cache; số đệm cần xóa;
nội dung và hackstring cuối; tổng phím; gộp pattern; tự chọn mode;
giao diện bằng DOM mô phỏng; chuỗi phím một dòng giữ nguyên.
Chưa thử quy trình trên máy Casio thật.
