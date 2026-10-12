# Spell Studio · Casio fx-580VN X

Web tĩnh bằng HTML, CSS và JavaScript thuần. Không có backend, không yêu cầu Python hoặc cài thư viện.

## Chạy offline
Mở `dist/index.html` bằng Chrome, Edge hoặc Firefox. Bản ZIP tải từ web chứa trực tiếp `index.html`; giải nén toàn bộ rồi mở file đó. Các ảnh bảng ký tự phải nằm cùng thư mục với trang.

## Chức năng
- Gõ văn bản, hoặc bấm một trong 389 ô glyph thuộc ba bảng người dùng cung cấp: 10–EC, F010–F031 và F410–F495.
- Mã hex là định danh chính, vì nhiều glyph cùng hình hoặc cùng Unicode nhưng khác mã. Ký hiệu `{HEX}` trong ô soạn thảo giữ chính xác những mã không có Unicode duy nhất. Mỗi ký hiệu đó chiếm một vị trí, không phải số lượng chữ trong dấu ngoặc.
- Một trang làm việc gọn: bảng hex 16 × 16 theo vùng 00/F0/F4; các ô trống được giữ để không lệch tọa độ. Tìm kiếm chỉ làm nổi bật ô, không sắp lại lưới.
- Chỉ xem trước dòng chữ, không dựng vỏ máy Casio. Tùy chọn “Căn giữa” mặc định bật; tắt sẽ căn trái cả xem trước và phím spell. Giới hạn hiển thị là 52/3 ô, tương đương 17 ký tự hoàn chỉnh; không in giới hạn trên giao diện. Dòng spell vẫn điền đủ khoảng trắng bên phải theo quy trình đã chốt.
- Lưu bản nháp trong trình duyệt.
- Desktop: ô soạn và hướng dẫn bên trái, bảng ký tự bên phải. Lưới lấy kích thước theo chiều rộng, không co lại khi mở công thức hoặc cửa sổ thấp. Màn hình nhỏ xếp theo thứ tự soạn chữ → bảng ký tự → hướng dẫn.
- Phím hướng dẫn và phần gán biến mặc định 18px, có lựa chọn 16/18/20/22px; trình duyệt nhớ cỡ chữ đã chọn. Nút sao chép, công tắc và ô tìm được mở rộng; công thức chi tiết mặc định thu gọn.
- Đóng gói A/B/C bằng quy hoạch động: ít byte đệm nhất, giữ thứ tự, không tách ký tự hai byte qua hai biến; có thể tách giữa định trị và số mũ cùng biến.
- Mọi ký tự mã F… gồm hai byte, một đơn vị con trỏ, luôn phải gán. Công thức nums tính hai byte cho F… và dấu cách, một byte cho ký tự còn lại.
- Có hai luồng hướng dẫn: một biến gán trực tiếp vào @ sau 110an; hai/ba biến gán A/B/C trước 110an.
- Lần overflow đầu dùng đủ basic overflow. Kết thúc có 3C23; 23 vô hình vẫn chiếm một đơn vị con trỏ.
- Không có rác: RIGHT quay về đầu. Có rác: xóa theo nguồn gốc từng byte, không nhầm byte 20 thuộc nội dung với byte đệm.
- Gộp nút hiển thị: một nút từ 5 lần, hai nút từ 4 lần, ba nút từ 3 lần. Các số liền nhau ghép trong một cặp ngoặc.
- Sao chép hướng dẫn hoặc tải TXT; bật/tắt gộp nút; tải toàn bộ mã nguồn offline từ web.

## Nguồn
Bảng phím trực tiếp kế thừa `sap_xep_hex.py` v12 (nguồn ban đầu Phong2k11® & AxesMC). Engine JavaScript được chuyển theo các quy tắc người dùng đã chốt. Hình glyph sử dụng nguyên ba ảnh người dùng gửi. Trang tham chiếu: https://cwh.ca510.com/2-level-font/ . Unicode của ký hiệu chuyên dụng chỉ hỗ trợ nhập/tìm kiếm; ảnh và mã hex là biểu diễn chính xác.

## Kiểm tra
Chạy `node tests/engine.test.cjs`. Trong 350 mẫu Python v12, 268 mẫu không đổi đường nhập vẫn phải khớp từng byte, đệm, nums và phím. Các mẫu còn lại được phép đổi do công thức 1 mới. Kiểm tra riêng các đường phím mới theo bảng PDF, 389 glyph, mọi vùng F…, cặp qua số mũ, giới hạn gộp phím, căn lề và tọa độ 16 × 16.

Giới hạn: chưa kiểm thử trên máy Casio thật. Bảng này bao gồm các ô của ba ảnh được cung cấp, không khẳng định bao gồm mọi firmware/biến thể Casio. UI chưa được kiểm thử bằng trình duyệt tự động trong môi trường dựng này.

## Cấu trúc
- `dist/index.html`: giao diện.
- `dist/style.css`: giao diện responsive.
- `dist/app.js`: tương tác, ô nhập, lựa chọn glyph và xuất hướng dẫn.
- `dist/motion.js`, `dist/motion.css`: lớp chuyển động độc lập; không thay đổi engine hoặc phím.
- `dist/engine.js`: bộ phân tích ký tự, xếp hex, sinh phím, định dạng.
- `dist/data.js`: bảng phím và các chuỗi cố định.
- `dist/font-*.png`: nguyên ảnh bảng nguồn, dùng làm sprite CSS.
- Preview dùng viewport SVG cắt đúng tọa độ của ảnh nguồn cho cả base/F0/F4, với màu chữ tách khỏi nền bằng bộ lọc SVG. Không dùng background-size hoặc mix-blend-mode cho glyph preview. Nhận mã dạng `{F471}` và `{f471}` như nhau.
- `tests/`: các kiểm tra Node.js, không có phụ thuộc.

## Tích hợp all.pdf
- Chép đủ 221 dòng 10–EC (trang 1–21), với 93 mã có công thức 1 và 71 mã có công thức 2 (72 phương án).
- `dist/pdf-reference.json` giữ nguyên dữ liệu PDF: mã, ký tự hiển thị lúc nhập, cả hai công thức, trang nguồn. `dist/pdf-reference.js` là bản tải trực tiếp cho web offline, không dùng fetch.
- `dist/all-hex.json` chứa toàn bộ 389 glyph và dữ liệu công thức tương ứng. F0 và F4 không có công thức trong bảng PDF; ghi rõ “PDF không nêu”, không tự sáng tác phím. F4 dẫn đến bảng trang 24; F0 giữ nguồn ảnh người dùng cung cấp.
- Công thức 1 được dùng ngay khi ghép token. Không lấy công thức theo Unicode gần giống: tra đúng hex. Với J (4A), giữ nguyên SHIFT + Ans trong nguồn PDF, nhưng dùng ALPHA + Ans theo ảnh bàn phím đã cung cấp; SHIFT + Ans thuộc % (D7).
- Công thức 2 lưu cả mọi phương án và yêu cầu `context: 'FDFD'`. Những bước FDFD đang có (lấy chữ HEX đậm, lấy các @ để xuất biến) lấy phím trực tiếp từ bảng PDF này. Các công thức 2 khác hiển thị đầy đủ để tra/copy, chưa tự chèn vào bước viết token thường. Trang 21 yêu cầu bộ chuyển đổi FDFD và dẫn sang tài liệu IN HOA 1–4 dòng, không mô tả trọn quy trình đó. Vì thế không tự giả định rằng công thức 2 là phím nhập trực tiếp.
- Dấu cách của spell một dòng vẫn giữ SHIFT 8 3 4 và tính hai byte, đúng quy tắc riêng đã được người dùng xác nhận; không nhầm với công thức 2 của hex 20 trong PDF.
- Mọi mã F… vẫn luôn phải gán theo quy tắc người dùng; không loại khỏi dữ liệu gán dựa trên công thức của ký tự giống hình.
- Trỏ chuột/focus vào ô để xem hex, ký tự hiển thị khi nhập, công thức 1/2, trang PDF nguồn và các ghi chú cần thiết. Bấm ô vẫn chèn ký tự vào văn bản.
- Bản PDF được đính kèm `dist/reference/all.pdf`, dùng được cả offline.

Khi chỉnh dữ liệu nguồn: chạy `node scripts/build-reference.cjs`, rồi chạy bộ kiểm tra. Không cần Python để chạy hoặc xây dựng bảng tra của web.

## Motion
- Chuyển động nền nhẹ, logo SVG vẽ nét và giao diện xuất hiện theo nhịp.
- Thanh chọn bảng trượt, bảng hex chuyển nhẹ kèm vệt sáng, ô glyph phản hồi hover/nhấn.
- Chọn một ô: glyph bay đến dòng xem trước. Nhập văn bản: glyph mới hiện lần lượt. Đổi căn giữa: chữ trượt đến vị trí mới.
- Nút bấm có phản hồi nhấn, ripple và ánh sáng; nút tạo hướng dẫn chuyển mũi tên thành dấu hoàn thành.
- Hướng dẫn xuất hiện theo từng mục; thanh mảnh thể hiện vị trí đọc khi cuộn. Không chạy hiệu ứng lặp trên nội dung nút bấm.
- Bảng công thức, công tắc, thông báo sao chép và phản hồi lỗi có chuyển động ngắn.
- Nút “Hiệu ứng” lưu lựa chọn trên trình duyệt. Tôn trọng và cập nhật trực tiếp `prefers-reduced-motion`: bỏ chuyển động không gian, giữ fade ngắn. Dừng khi tab bị ẩn; hủy hiệu ứng cũ khi thao tác nhanh.
- CSS + Web Animations API, không tải thư viện/CDN. Trình duyệt thiếu Web Animations vẫn dùng được spell.
- Áp dụng các skill `micro-interaction`, `accessible-animation`, `60fps-animation`, `svg-animation` từ https://github.com/iart-ai/web-animation-skills (gói của https://github.com/iart-ai/motion-skills), commit `b6dba3eb759726845a44163ff0bad70dd9e7fbb6`, MIT. Bản skill cài theo dự án ở `.agents/skills/`.

Kiểm tra DOM của lớp motion dùng LinkeDOM (chỉ để kiểm tra, không phải dependency của web):
```sh
npm install --no-save linkedom@0.18.12
node tests/ui-motion.test.cjs
```
Kiểm tra bao gồm giữ nguyên phím khi bật/tắt motion, thiếu API hoặc thiếu file motion; thao tác nhanh; căn giữa; hủy glyph bay; thay đổi tùy chọn hệ thống; ẩn tab; thông báo liên tiếp. Có thể dùng `SPELL_TEST_NODE_MODULES` trỏ tới thư mục node_modules riêng.

Harness kiểm tra khung hình: `index.html?t=0`, `?t=0.3`, `?t=1`; thêm `&reduce=1` để ép giảm chuyển động. Các bài kiểm tra DOM không đo bố cục, FPS hoặc thay thế việc xem trên trình duyệt. Bản motion chưa được kiểm tra trực quan bằng trình duyệt trong môi trường này.

## Font bảng ký tự
- `dist/fonts/ClassWizXDisplay-Regular.otf`: font do người dùng cung cấp, đóng gói cùng web để dùng offline.
- `dist/palette-font.js`: ánh xạ từng hex sang ký tự Unicode riêng cho phần hiển thị nút chọn; có cả mã PUA của font (chữ HEX đậm, đơn vị và ký hiệu đặc biệt).
- 375 ô dùng font khi tải thành công, gồm toàn bộ 134 ô F4 và 34 ô F0. 14 ô chưa xác nhận hình dạng chính xác vẫn dùng PNG.
- Trước khi font tải xong, hoặc nếu lỗi tải/thiếu Font Loading API, toàn bộ nút vẫn hiển thị PNG. Không thay thế bằng ký tự gần giống từ font hệ thống.
- Preview, hex của từng ô, nội dung chèn và hướng dẫn phím giữ nguyên. Bảng font không tham gia thuật toán spell.
