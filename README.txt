SPELL STUDIO — 17/10/2026 · TỐI ƯU TOKEN VÀ TỰ XẾP DÒNG

CẬP NHẬT
- Tạm tắt yêu cầu mật khẩu: dùng trực tiếp tính năng 2–4 dòng.
- Nút nhỏ “Copy toàn bộ nút”: sao chép riêng toàn bộ chuỗi phím theo thứ tự,
  giữ tùy chọn Gộp nút; không kèm tiêu đề bước, gán biến hay chú thích.
- Checkbox “Tự xếp dòng” cạnh ô nhập: tự chọn ít dòng nhất trong 1–4 dòng,
  ưu tiên ngắt theo từ và cân bằng độ dài; mỗi dòng tối đa 17⅓ ô.
  Văn bản gốc vẫn giữ trong ô nhập; bố cục tự động thể hiện ở màn hình xem
  trước và được dùng khi tạo hướng dẫn. Tắt checkbox để chọn dòng thủ công.
- Nhân đôi chọn token cần giữ trên toàn bộ hai bản sao, không chỉ nối tiền tố.
  Với một dãy mẫu cố định, số lần nhân đôi đạt giới hạn tối thiểu của mô hình
  “nhân đôi rồi xóa”. Dãy mẫu được tìm bằng nhiều thứ tự và cách ghép đoạn;
  chưa khẳng định tối ưu toàn cục trên mọi cách thao tác máy Casio.
- Có thể giữ F4F4 trong dãy mẫu, nhân trước rồi điền hậu tố CT1 sau cùng.
  Thử cả token nguyên, cặp tiền tố, token mẫu lặp; chọn theo CT2 rồi tổng nút.
- Mẫu 4 dòng Casio / Việt Nam / Lê Minh Đức / Xin chào, không căn giữa:
  từ 7 lần nhân đôi và 5209 nút xuống 2 lần và 3070 nút.
- Mẫu ảnh Dường như nắng đã / làm má em thêm hồng, / Làn mây bay đã /
  yêu tóc em: tạo được hướng dẫn, 3 lần nhân đôi, 3505 nút (không căn giữa).
  Bật tự xếp dòng: 2 lần nhân đôi, 3054 nút (không căn giữa).
- Thông báo riêng khi mở bằng file hoặc khi API chưa được triển khai.
- Bỏ chữ chú thích nhỏ trong ô bước; vẫn đủ phím và tối đa 15 bước.
- Gán hex dùng đúng ký tự ˣ₁₀ bằng font ClassWiz X Display.
- Mở trực tiếp chế độ 2–4 dòng, xử lý thuật toán trên server.
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

CÁCH DÙNG / CẬP NHẬT WEB — BẢN CÙNG MỘT CẤP 20261017-flat-v1
Giải nén ZIP, chọn toàn bộ file rồi upload vào gốc repo GitHub và commit.
ZIP không có thư mục con. Không upload nguyên ZIP.
Vercel: Framework Other; Root Directory là gốc repo; Build Command node build.cjs.
Output Directory: tắt Override, để mặc định. Không chọn public hoặc dấu chấm.
vercel.json dùng Build Output API; build tự tạo cấu trúc .vercel/output gồm
static và functions/api/spell.func. Không cần tự tạo hay upload các thư mục đó.
Đợi deployment mới Ready và được gán Production.
Kiểm tra /version.json và /api/spell: cả hai phải hiện 20261017-flat-v1;
/api/spell phải trả unlocked:true khi không bật biến môi trường khóa demo.
Nếu vẫn thấy phiên bản cũ: kiểm tra commit, nhánh Production và Build Logs.
Các file server-*.js/cjs/json không được đưa vào phần web tĩnh.
Repo GitHub công khai vẫn cho người khác đọc mã nguồn; dùng repo Private
nếu cần giữ kín thuật toán. Bản này không thay đổi quyền repo.

CHẾ ĐỘ DEMO
- Hiện tại không cần mật khẩu cho 2–4 dòng.
- Muốn bật lại khóa: đặt SPELL_DEMO_REQUIRE_PASSWORD=true rồi redeploy.
  Khi bật khóa, mật khẩu mặc định là apple123; phiên mở khóa kéo dài 8 giờ.
- Khi bật khóa, mật khẩu được kiểm tra trên server; cookie HttpOnly có chữ ký.
- Thuật toán nhiều dòng chỉ chạy trong API, không nằm trong JS công khai.
- Giao diện, xem trước chữ và thuật toán một dòng vẫn là mã công khai.
- Bản build không công khai README, server-*, cấu hình khóa, PDF nhiều dòng.
- Có thể đặt SPELL_DEMO_PASSWORD và SPELL_SESSION_SECRET trong Environment
  Variables trên Vercel rồi redeploy để thay mật khẩu/khóa phiên.
  SPELL_SESSION_SECRET nên là chuỗi ngẫu nhiên dài ít nhất 32 ký tự.
- Bản mặc định có khóa riêng trong server-config.json. Không chia sẻ file này
  hoặc ZIP nguồn cho người không được phép truy cập thuật toán.
- Mã đã công khai ở bản triển khai hoặc lịch sử Git cũ không tự biến mất.

CHẠY TRÊN MÁY TÍNH
Cài Node.js, mở terminal ở thư mục đã giải nén, chạy npm start.
Mở http://localhost:3000. Không cần npm install vì không có dependency.
Mở thẳng index.html chỉ dùng được tính năng một dòng; demo cần API.
Chạy npm test để kiểm tra API, xác thực, đầu ra và file công khai.

PHẠM VI KIỂM TRA
Kiểm tra toàn bộ chuỗi ngắn trên các bộ mẫu nhỏ để đối chiếu số lần nhân đôi;
phát lại công thức F4F4 ở mức byte; kiểm tra thứ tự toàn bộ token cuối, số nút,
giới hạn bộ nhớ; tự xếp dòng, từ dài, hex nhiều byte và kết hợp khóa demo.
Đã kiểm tra mô hình con trỏ và phát lại độc lập phím di chuyển/xóa
trong bước nhân đôi; giới hạn 200 byte; phép tính Cache; số đệm cần xóa;
nội dung và hackstring cuối; tổng phím; gộp pattern; tự chọn mode;
giao diện bằng DOM mô phỏng; chuỗi phím một dòng giữ nguyên.
Chưa thử quy trình trên máy Casio thật.
