# Việt Ký — Giải thích cấu trúc thư mục

Nút tìm kiếm trên navbar hiện là icon tĩnh; không mở popup hoặc trang tìm kiếm.

Phần giải thích được đặt **ngay dưới tên thư mục hoặc file** trong cây để có thể đọc liên tục mà không phải tra bảng ở nơi khác.

- `[Có nội dung]`: file có mã, văn bản hoặc dữ liệu tài nguyên; không đồng nghĩa đã tích hợp đầy đủ.
- `[Rỗng]`: file 0 byte giữ chỗ; mô tả bên dưới là trách nhiệm dự kiến khi triển khai.
- `art0003.json` đến `art0079.json` được gộp một dòng cho dễ đọc. Các file thực tế vẫn có đủ.
- `viet-ky/` là tên minh họa của thư mục gốc; repo hiện tại mang tên `web/`.

## Cây thư mục có giải thích

```text
viet-ky/  (tên thư mục gốc thực tế: web/)
│   ↳ Website HTML/CSS/JavaScript thuần; cây dưới đây phản ánh các mục đang có.
│
├── index.html
│   ↳ [Có nội dung] Trang chủ; hiện có metadata, favicon, header/footer viết trực tiếp và chữ TestTest. Chỉ
│     nạp base.css và home.js.
│
├── README.md
│   ↳ [Có nội dung] Giới thiệu Việt Ký, công nghệ và hướng dẫn làm việc với repo; hiện mới có mô tả ngắn và
│     tech stack.
│
├── .gitignore
│   ↳ [Có nội dung] Quy định những file Git bỏ qua: cấu hình editor, log, biến môi trường, node_modules và
│     dist.
│
├── LICENSE
│   ↳ [Có nội dung] Giấy phép Apache License 2.0 áp dụng cho mã nguồn.
│
├── components/
│   ↳ Các mảnh HTML dùng chung; component-loader sẽ tải và chèn vào các trang khi được triển khai.
│   ├── footer.html
│   │   ↳ [Rỗng] Khung cuối trang dùng chung: giới thiệu, liên kết và bản quyền.
│   └── header.html
│       ↳ [Rỗng] Khung đầu trang dùng chung: logo, menu và khu vực thao tác.
│
├── pages/
│   ↳ Trang riêng cho từng danh mục; link chuẩn khai báo trong navigation-data.js.
│   ├── about.html
│   │   ↳ [Có nội dung] Về dự án
│   ├── artifacts.html
│   │   ↳ [Có nội dung] Hiện vật lịch sử
│   ├── arts.html
│   │   ↳ [Có nội dung] Nghệ thuật truyền thống
│   ├── beliefs.html
│   │   ↳ [Có nội dung] Tín ngưỡng & Tôn giáo
│   ├── category.html
│   │   ↳ [Có nội dung] Danh mục chung, hỗ trợ đường dẫn cũ
│   ├── culture.html
│   │   ↳ [Có nội dung] Văn hóa
│   ├── customs.html
│   │   ↳ [Có nội dung] Phong tục & Tập quán
│   ├── detail.html
│   │   ↳ [Rỗng] Khung trang chưa triển khai.
│   ├── events.html
│   │   ↳ [Có nội dung] Sự kiện lịch sử
│   ├── explore.html
│   │   ↳ [Có nội dung] Khám phá
│   ├── festivals.html
│   │   ↳ [Có nội dung] Lễ hội & Đời sống
│   ├── heritage.html
│   │   ↳ [Có nội dung] Dấu xưa
│   ├── history.html
│   │   ↳ [Có nội dung] Chuyện sử
│   ├── login.html
│   │   ↳ [Có nội dung] Đăng nhập
│   ├── map.html
│   │   ↳ [Có nội dung] Bản đồ lịch sử
│   ├── monuments.html
│   │   ↳ [Có nội dung] Di tích & Kiến trúc
│   ├── pages/
│   │   ↳ Trang riêng cho từng danh mục; link chuẩn khai báo trong navigation-data.js.
│   ├── people.html
│   │   ↳ [Có nội dung] Nhân vật lịch sử
│   ├── periods.html
│   │   ↳ [Có nội dung] Các thời kỳ
│   ├── places.html
│   │   ↳ [Có nội dung] Địa danh lịch sử
│   ├── quiz.html
│   │   ↳ [Rỗng] Khung trang chưa triển khai.
│   ├── sources.html
│   │   ↳ [Có nội dung] Nguồn tư liệu
│   └── timeline.html
│       ↳ [Có nội dung] Dòng thời gian
│
├── css/
│   ↳ Hệ thống kiểu dáng: nền tảng thiết kế, UI dùng chung, landing engine và từng trang.
│   ├── token.css
│   │   ↳ [Có nội dung] File cũ có design tokens: màu, font, spacing, layout và motion. Trang chủ hiện chưa nạp
│   │     file này.
│   ├── tokens.css
│   │   ↳ [Rỗng] Tên file tokens theo cây mới; hiện rỗng, chưa liên kết hay thay thế token.css.
│   ├── reset.css
│   │   ↳ [Rỗng] Chuẩn hóa một số kiểu mặc định để giảm khác biệt giữa các trình duyệt.
│   ├── base.css
│   │   ↳ [Có nội dung] Quy tắc nền cho HTML; hiện có box-sizing, cuộn mượt, body, img và a. Trang chủ đang nạp
│   │     file này.
│   ├── typography.css
│   │   ↳ [Rỗng] Cách trình bày tiêu đề, đoạn văn, lời dẫn, trích dẫn và chú thích.
│   ├── layout.css
│   │   ↳ [Rỗng] Container, lưới, cột, khoảng cách vùng nội dung và bố cục dùng chung.
│   ├── themes.css
│   │   ↳ [Rỗng] Các biến thể giao diện theo thời kỳ hoặc ngữ cảnh của nội dung.
│   ├── components/
│   │   ↳ Kiểu dáng thành phần giao diện tái sử dụng trên nhiều trang.
│   │   ├── article.css
│   │   │   ↳ [Rỗng] Kiểu dáng bài đọc: đoạn văn, ảnh, chú thích, trích dẫn và nguồn.
│   │   ├── button.css
│   │   │   ↳ [Rỗng] Kiểu dáng nút: mặc định, hover, focus và disabled.
│   │   ├── card.css
│   │   │   ↳ [Rỗng] Kiểu dáng thẻ nội dung dùng ở danh sách, tìm kiếm và nội dung liên quan.
│   │   ├── footer.css
│   │   │   ↳ [Rỗng] Kiểu dáng cuối trang và các nhóm liên kết/thông tin.
│   │   ├── header.css
│   │   │   ↳ [Rỗng] Kiểu dáng đầu trang: logo, vùng menu và các thao tác.
│   │   ├── map.css
│   │   │   ↳ [Rỗng] Kiểu dáng khung bản đồ, marker và chú giải dùng chung.
│   │   ├── navigation.css
│   │   │   ↳ [Rỗng] Kiểu dáng menu, mục đang chọn và trạng thái tương tác.
│   │   └── timeline.css
│   │       ↳ [Rỗng] Kiểu dáng mốc, đường nối, nhãn và thẻ của thành phần timeline.
│   ├── engine/
│   │   ↳ Kiểu dáng cho landing nội dung, các cảnh kể chuyện và chuyển động.
│   │   ├── landing.css
│   │   │   ↳ [Rỗng] Bố cục tổng thể của landing: vùng mở đầu và các phần nội dung.
│   │   ├── motion.css
│   │   │   ↳ [Rỗng] Định nghĩa hiệu ứng CSS, chuyển cảnh và trạng thái giảm chuyển động.
│   │   ├── scenes.css
│   │   │   ↳ [Rỗng] Kiểu dáng các cảnh hero, narrative, image, gallery, artifact và quote.
│   │   └── story.css
│   │       ↳ [Rỗng] Cách trình bày chế độ kể chuyện và các vùng nội dung story.
│   └── pages/
│       ↳ Bố cục riêng của từng trang; tái sử dụng kiểu dáng component thay vì viết lại.
│       ├── detail.css
│       │   ↳ [Rỗng] Bố cục trang chi tiết: nội dung chính, mục lục và thông tin liên quan.
│       ├── explore.css
│       │   ↳ [Rỗng] Bố cục trang khám phá tuyến và các bước nội dung.
│       ├── home.css
│       │   ↳ [Rỗng] Bố cục trang chủ: hero, vùng khám phá và các danh sách nổi bật.
│       ├── map.css
│       │   ↳ [Rỗng] Bố cục trang bản đồ: bản đồ, danh sách và bảng thông tin.
│       ├── quiz.css
│       │   ↳ [Rỗng] Bố cục câu hỏi, lựa chọn, tiến độ và kết quả quiz.
│       └── timeline.css
│           ↳ [Rỗng] Bố cục toàn trang timeline: tiêu đề, bộ lọc và vùng timeline.
│
├── js/
│   ↳ JavaScript của website; file chỉ chạy khi được nạp bằng script hoặc import.
│   ├── core/
│   │   ↳ Các khả năng nền dùng chung: URL, tra ID, tải dữ liệu, nạp HTML và quan hệ.
│   │   ├── app.js
│   │   │   ↳ [Rỗng] Khởi tạo những phần dùng chung và điều phối quá trình khởi động ứng dụng.
│   │   ├── catalog-loader.js
│   │   │   ↳ [Rỗng] Tải danh mục gọn để hiển thị danh sách, tìm kiếm và lọc.
│   │   ├── component-loader.js
│   │   │   ↳ [Rỗng] Tải header.html/footer.html rồi chèn vào vị trí được chỉ định trong trang.
│   │   ├── content-loader.js
│   │   │   ↳ [Rỗng] Tải một tài nguyên nội dung, đọc JSON và xử lý lỗi tải/đọc dữ liệu.
│   │   ├── content-resolver.js
│   │   │   ↳ [Rỗng] Tập hợp các tài nguyên được entity tham chiếu như article, story và nguồn khi cần.
│   │   ├── id-resolver.js
│   │   │   ↳ [Rỗng] Chuyển ID thành đường dẫn; ví dụ evt0001 → data/evt/evt0001.json.
│   │   ├── layout.js
│   │   │   ↳ [Rỗng] File cũ còn giữ; cần thống nhất vai trò với app.js/component-loader.js khi triển khai để tránh
│   │   │     làm trùng.
│   │   ├── relations.js
│   │   │   ↳ [Rỗng] Xử lý quan hệ giữa thời kỳ, sự kiện, nhân vật, địa danh và văn hóa.
│   │   ├── router.js
│   │   │   ↳ [Rỗng] Đọc tham số URL, tạo liên kết và hỗ trợ điều hướng; không bắt buộc biến website thành SPA.
│   │   └── utils.js
│   │       ↳ [Rỗng] Các hàm tiện ích thực sự dùng ở nhiều nơi như định dạng thời gian, chuẩn hóa chuỗi.
│   ├── engine/
│   │   ↳ Dựng dữ liệu thành landing, bài đọc hoặc trải nghiệm kể chuyện cho từng loại nội dung.
│   │   ├── landing-engine.js
│   │   │   ↳ [Rỗng] Điều phối dựng landing: nhận dữ liệu, chọn handler/renderer và khởi tạo controller.
│   │   ├── model.js
│   │   │   ↳ [Rỗng] Chuẩn hóa đầu vào thành cấu trúc dữ liệu mà engine hiểu và sử dụng.
│   │   ├── dom.js
│   │   │   ↳ [Rỗng] Hàm hỗ trợ tạo, gắn và cập nhật phần tử HTML cho engine.
│   │   ├── story-adapter.js
│   │   │   ↳ [Rỗng] Chuyển dữ liệu story hoặc dữ liệu theo loại nội dung sang mô hình scene chung.
│   │   ├── story-renderer.js
│   │   │   ↳ [Rỗng] Dựng danh sách cảnh; gọi renderer tương ứng trong scenes/.
│   │   ├── article-renderer.js
│   │   │   ↳ [Rỗng] Dựng bài đọc từ danh sách block; gọi renderer tương ứng trong blocks/.
│   │   ├── map-controller.js
│   │   │   ↳ [Rỗng] Điều khiển bản đồ trong story: vị trí, lớp hiển thị, marker và diễn biến.
│   │   ├── scene-controller.js
│   │   │   ↳ [Rỗng] Theo dõi cảnh đang hoạt động và cập nhật khi cuộn hoặc thao tác chuyển cảnh.
│   │   ├── motion-controller.js
│   │   │   ↳ [Rỗng] Điều khiển chuyển động bằng JS, dọn hiệu ứng và đáp ứng tùy chọn giảm chuyển động.
│   │   ├── types/
│   │   │   ↳ Xử lý đặc thù từng loại nội dung; dùng lại scene và block của engine.
│   │   │   ├── culture.js
│   │   │   │   ↳ [Rỗng] Handler văn hóa: nguồn gốc, đặc trưng, ý nghĩa và bối cảnh.
│   │   │   ├── event.js
│   │   │   │   ↳ [Rỗng] Handler sự kiện: bối cảnh, diễn biến, kết quả và quan hệ.
│   │   │   ├── period.js
│   │   │   │   ↳ [Rỗng] Handler thời kỳ: khoảng thời gian, giai đoạn và các sự kiện tiêu biểu.
│   │   │   ├── person.js
│   │   │   │   ↳ [Rỗng] Handler nhân vật: tiểu sử, hoạt động và đóng góp.
│   │   │   └── place.js
│   │   │       ↳ [Rỗng] Handler địa danh: vị trí, lịch sử và vai trò.
│   │   ├── scenes/
│   │   │   ↳ Các cảnh lớn của story; một cảnh có thể kết hợp chữ, ảnh, bản đồ và tương tác.
│   │   │   ├── artifact.js
│   │   │   │   ↳ [Rỗng] Cảnh giới thiệu hiện vật, chi tiết và thông tin chú giải.
│   │   │   ├── gallery.js
│   │   │   │   ↳ [Rỗng] Cảnh trình bày một nhóm hình ảnh.
│   │   │   ├── hero.js
│   │   │   │   ↳ [Rỗng] Cảnh mở đầu với tiêu đề, ảnh chính, lời dẫn và thông tin nổi bật.
│   │   │   ├── image.js
│   │   │   │   ↳ [Rỗng] Cảnh tập trung vào một hình minh họa lớn và chú thích.
│   │   │   ├── map.js
│   │   │   │   ↳ [Rỗng] Cảnh bản đồ theo diễn biến; kết nối map-controller khi cần.
│   │   │   ├── narrative.js
│   │   │   │   ↳ [Rỗng] Cảnh kể chuyện bằng lời dẫn hoặc một đoạn nội dung theo diễn tiến.
│   │   │   ├── quote.js
│   │   │   │   ↳ [Rỗng] Cảnh nhấn mạnh một trích dẫn và nguồn trích dẫn.
│   │   │   └── timeline.js
│   │   │       ↳ [Rỗng] Cảnh trình bày các mốc thời gian trong story.
│   │   └── blocks/
│   │       ↳ Các đơn vị nhỏ để ghép thành bài đọc: đoạn văn, tiêu đề, ảnh và nguồn.
│   │       ├── heading.js
│   │       │   ↳ [Rỗng] Dựng một tiêu đề mục trong bài đọc.
│   │       ├── image.js
│   │       │   ↳ [Rỗng] Dựng hình ảnh, văn bản thay thế và chú thích trong bài đọc.
│   │       ├── paragraph.js
│   │       │   ↳ [Rỗng] Dựng một đoạn văn trong bài đọc.
│   │       ├── quote.js
│   │       │   ↳ [Rỗng] Dựng khối trích dẫn trong bài đọc.
│   │       ├── reference.js
│   │       │   ↳ [Rỗng] Dựng tham chiếu hoặc thông tin nguồn trong bài đọc.
│   │       └── timeline.js
│   │           ↳ [Rỗng] Dựng timeline nhúng trong bài đọc.
│   ├── features/
│   │   ↳ Các tính năng tương tác; được controller của trang gọi và kết nối với giao diện.
│   │   ├── explore-routes.js
│   │   │   ↳ [Rỗng] Quản lý tuyến khám phá, thứ tự nội dung và bước trước/sau.
│   │   ├── filter.js
│   │   │   ↳ [Rỗng] File cũ gần nghĩa với filters.js; hiện rỗng, chưa có logic để phân biệt.
│   │   ├── filters.js
│   │   │   ↳ [Rỗng] Áp dụng điều kiện lọc như loại nội dung, thời kỳ và khoảng năm.
│   │   ├── map-explorer.js
│   │   │   ↳ [Rỗng] Khám phá địa danh: chọn marker, lọc và xem nội dung tại địa điểm.
│   │   ├── quiz.js
│   │   │   ↳ [Rỗng] Xử lý chọn đáp án, chấm điểm, phản hồi và kết thúc lượt quiz.
│   │   ├── related-content.js
│   │   │   ↳ [Rỗng] Chọn và hiển thị nội dung liên quan từ quan hệ dữ liệu.
│   │   ├── related.js
│   │   │   ↳ [Rỗng] File cũ gần nghĩa với related-content.js; được giữ nguyên, hiện rỗng.
│   │   ├── sources.js
│   │   │   ↳ [Rỗng] File cũ dành cho xử lý/hiển thị nguồn; hiện rỗng, trách nhiệm chưa được chốt.
│   │   └── timeline.js
│   │       ↳ [Rỗng] Hành vi timeline: chọn mốc, đổi khoảng thời gian và cập nhật nội dung.
│   ├── components/
│   │   ↳ Tạo hoặc điều khiển những thành phần UI dùng lại giữa các trang.
│   │   ├── breadcrumbs.js
│   │   │   ↳ [Rỗng] Tạo đường dẫn phân cấp, chẳng hạn Trang chủ → Thời kỳ → Nội dung.
│   │   ├── content-card.js
│   │   │   ↳ [Rỗng] Tạo thẻ nội dung từ dữ liệu: tiêu đề, ảnh, thời gian, tóm tắt và liên kết.
│   │   ├── footer.js
│   │   │   ↳ [Rỗng] Hành vi riêng của footer nếu cần; footer tĩnh có thể không cần JavaScript riêng.
│   │   ├── header.js
│   │   │   ↳ [Rỗng] Hành vi đầu trang, chẳng hạn mở và đóng menu trên điện thoại.
│   │   └── navigation.js
│   │       ↳ [Rỗng] Quản lý mục đang chọn và hành vi menu điều hướng.
│   └── pages/
│       ↳ Controller từng trang: ghép core, engine, features và UI để trang hoạt động.
│       ├── detail.js
│       │   ↳ [Rỗng] Đọc ID từ URL, tải nội dung và gọi engine để dựng bài đọc/landing/story.
│       ├── explore.js
│       │   ↳ [Rỗng] Khởi tạo danh sách tuyến khám phá và trải nghiệm theo tuyến.
│       ├── home.js
│       │   ↳ [Rỗng] Khởi tạo các vùng trên trang chủ; index.html đã nạp file này nhưng chưa có code.
│       ├── map.js
│       │   ↳ [Rỗng] Khởi tạo bản đồ khám phá và kết nối dữ liệu địa danh với map-explorer.
│       ├── quiz.js
│       │   ↳ [Rỗng] Khởi tạo giao diện và dữ liệu câu hỏi, rồi kết nối logic quiz.
│       └── timeline.js
│           ↳ [Rỗng] Kết nối dữ liệu, bộ lọc và tính năng timeline trên trang.
│
├── data/
│   ↳ Kho nội dung JSON; ID theo dạng prefix + 4 chữ số, không có dấu gạch nối.
│   ├── catalog.json
│   │   ↳ [Rỗng] Danh mục tóm tắt để tìm kiếm/danh sách; dự kiến sinh từ nội dung gốc nhằm giảm cập nhật trùng.
│   ├── per/
│   │   ↳ Thực thể thời kỳ: tên, khoảng thời gian, tóm tắt và các quan hệ.
│   │   ├── per0001.json
│   │   │   ↳ [Rỗng] Dữ liệu thời kỳ có ID per0001; hiện chưa có nội dung.
│   │   ├── per0002.json
│   │   │   ↳ [Rỗng] Dữ liệu thời kỳ có ID per0002; hiện chưa có nội dung.
│   │   ├── per0003.json
│   │   │   ↳ [Rỗng] Dữ liệu thời kỳ có ID per0003; hiện chưa có nội dung.
│   │   └── per0004.json
│   │       ↳ [Rỗng] Dữ liệu thời kỳ có ID per0004; hiện chưa có nội dung.
│   ├── evt/
│   │   ↳ Thực thể sự kiện: thông tin nhận diện, thời gian và liên kết liên quan.
│   │   └── evt0001.json
│   │       ↳ [Rỗng] Dữ liệu sự kiện có ID evt0001; hiện chưa có nội dung.
│   ├── ppl/
│   │   ↳ Thực thể nhân vật: thông tin nhận diện, tóm tắt tiểu sử và quan hệ.
│   │   └── ppl0001.json
│   │       ↳ [Rỗng] Dữ liệu nhân vật có ID ppl0001; hiện chưa có nội dung.
│   ├── plc/
│   │   ↳ Thực thể địa danh: tên, vị trí và liên hệ với nội dung lịch sử.
│   │   └── plc0001.json
│   │       ↳ [Rỗng] Dữ liệu địa danh có ID plc0001; hiện chưa có nội dung.
│   ├── cul/
│   │   ↳ Thực thể văn hóa: thông tin nhận diện, đặc trưng và nội dung liên quan.
│   │   └── cul0001.json
│   │       ↳ [Rỗng] Dữ liệu văn hóa có ID cul0001; hiện chưa có nội dung.
│   ├── art/
│   │   ↳ Bài đọc đầy đủ: các mục, đoạn văn, hình ảnh, trích dẫn và tham chiếu.
│   │   ├── art0001.json
│   │   │   ↳ [Rỗng] Dữ liệu bài đọc có ID art0001; hiện chưa có nội dung.
│   │   ├── art0002.json
│   │   │   ↳ [Rỗng] Dữ liệu bài đọc có ID art0002; hiện chưa có nội dung.
│   │   ├── art0003.json … art0079.json
│   │   │   ↳ [Rỗng] 77 file bài đọc liên tiếp; chỉ gộp dòng trong tài liệu, các file thật vẫn đầy đủ.
│   │   └── art0080.json
│   │       ↳ [Rỗng] Dữ liệu bài đọc có ID art0080; hiện chưa có nội dung.
│   ├── sty/
│   │   ↳ Kịch bản kể chuyện: thứ tự cảnh, lời dẫn, tài nguyên và trạng thái trình bày.
│   │   └── sty0001.json
│   │       ↳ [Rỗng] Dữ liệu story có ID sty0001; hiện chưa có nội dung.
│   ├── tml/
│   │   ↳ Các tập hợp mốc thời gian có thể tái sử dụng trong trang, bài đọc hoặc story.
│   │   └── tml0001.json
│   │       ↳ [Rỗng] Dữ liệu timeline có ID tml0001; hiện chưa có nội dung.
│   └── src/
│       ↳ Thông tin nguồn tham khảo để truy xuất và kiểm chứng nội dung lịch sử.
│       └── src0001.json
│           ↳ [Rỗng] Dữ liệu nguồn tham khảo có ID src0001; hiện chưa có nội dung.
│
├── assets/
│   ↳ Tài nguyên tĩnh: hình ảnh, bản đồ, font, icon và ảnh chia sẻ.
│   ├── img/
│   │   ↳ Ảnh nội dung đặt theo ID imgNNNN; hiện file mẫu chưa có dữ liệu.
│   │   └── img0001.webp
│   │       ↳ [Rỗng] Chỗ giữ tên ảnh img0001; file rỗng, chưa phải ảnh WebP sử dụng được.
│   ├── map/
│   │   ↳ Bản đồ đặt theo ID mapNNNN; dùng cho bài đọc, story hoặc trang bản đồ.
│   │   └── map0001.svg
│   │       ↳ [Rỗng] Chỗ giữ tên bản đồ map0001; file rỗng, chưa phải SVG sử dụng được.
│   ├── fonts/
│   │   ↳ Nơi lưu font cục bộ nếu tự phục vụ font; hiện chưa có file font.
│   │   └── .gitkeep
│   │       ↳ [Rỗng] Giữ thư mục fonts trong Git khi chưa có font; không chứa logic hoặc font.
│   ├── ui/
│   │   ↳ Tài nguyên giao diện theo cây mới; hiện các file mẫu đều rỗng.
│   │   ├── favicon.svg
│   │   │   ↳ [Rỗng] Chỗ giữ tên favicon theo cây mới; chưa có dữ liệu SVG và chưa thay favicon cũ.
│   │   └── og-image.png
│   │       ↳ [Rỗng] Chỗ giữ tên ảnh chia sẻ theo cây mới; chưa có dữ liệu PNG.
│   ├── icons/
│   │   ↳ Bộ favicon/icon cũ có dữ liệu thực; index.html đang dùng một số file tại đây.
│   │   ├── apple-touch-icon.png
│   │   │   ↳ [Có nội dung] Icon cho thao tác thêm vào màn hình chính trên thiết bị Apple; đã khai báo trong
│   │   │     index.html.
│   │   ├── favicon-32x32.png
│   │   │   ↳ [Có nội dung] Favicon PNG 32×32 có dữ liệu; được index.html tham chiếu.
│   │   ├── favicon.ico
│   │   │   ↳ [Có nội dung] Favicon ICO có dữ liệu; được index.html tham chiếu.
│   │   ├── favicon.svg
│   │   │   ↳ [Có nội dung] Favicon SVG có dữ liệu; được index.html tham chiếu.
│   │   ├── icon-192.png
│   │   │   ↳ [Có nội dung] Icon 192×192 có dữ liệu; hiện chưa có manifest trong cây nguồn này.
│   │   └── icon-512.png
│   │       ↳ [Có nội dung] Icon 512×512 có dữ liệu; hiện chưa có manifest trong cây nguồn này.
│   ├── images/
│   │   ↳ Thư mục ảnh cũ; có ảnh chia sẻ đang được khai báo trong index.html.
│   │   └── og-cover.jpg
│   │       ↳ [Có nội dung] Ảnh chia sẻ có dữ liệu; index.html khai báo trong Open Graph và Twitter/X.
│   └── maps/
│       ↳ Thư mục bản đồ cũ được giữ nguyên; hiện không có file.
│           (Chưa có file)
│
├── schemas/
│   ↳ Hợp đồng dữ liệu: mô tả trường bắt buộc, kiểu dữ liệu và cấu trúc hợp lệ.
│   ├── article.schema.json
│   │   ↳ [Rỗng] Quy tắc cấu trúc bài đọc và các block.
│   ├── entity.schema.json
│   │   ↳ [Rỗng] Quy tắc cho entity thuộc nhóm per, evt, ppl, plc và cul.
│   ├── source.schema.json
│   │   ↳ [Rỗng] Quy tắc thông tin nguồn như tên, tác giả, xuất bản và đường dẫn khi chốt hợp đồng dữ liệu.
│   ├── story.schema.json
│   │   ↳ [Rỗng] Quy tắc cấu trúc story, danh sách scene và tham chiếu.
│   └── timeline.schema.json
│       ↳ [Rỗng] Quy tắc cấu trúc timeline, các mốc và liên kết nội dung.
│
├── scripts/
│   ↳ Công cụ dự kiến chạy bằng Node.js trên máy dev; website tĩnh không cần chạy chúng trên trình duyệt.
│   ├── build-catalog.js
│   │   ↳ [Rỗng] Dự kiến đọc dữ liệu gốc và sinh catalog.json cho tìm kiếm/danh sách.
│   ├── new-id.js
│   │   ↳ [Rỗng] Dự kiến cấp ID chưa dùng và tạo file mẫu để giảm sai tên/trùng ID.
│   └── validate-content.js
│       ↳ [Rỗng] Dự kiến kiểm tra JSON/schema, ID trùng và tham chiếu đến tài nguyên không tồn tại.
│
├── tests/
│   ↳ Các file kiểm thử tự động; hiện đều rỗng, chưa có bài test thực thi.
│   ├── component-loader.test.js
│   │   ↳ [Rỗng] Kiểm thử tải/chèn HTML đúng vị trí và cách xử lý lỗi component.
│   ├── content-loader.test.js
│   │   ↳ [Rỗng] Kiểm thử tải thành công, lỗi tải và JSON không đọc được.
│   ├── id-resolver.test.js
│   │   ↳ [Rỗng] Kiểm thử ánh xạ ID hợp lệ và cách xử lý ID không hợp lệ.
│   └── landing-engine.test.js
│       ↳ [Rỗng] Kiểm thử chọn handler/renderer và cách xử lý dữ liệu hoặc loại nội dung không hợp lệ.
│
├── dev/
│   ↳ Khu thử nghiệm tính năng/component trước khi ghép vào trang chính.
│   └── playground.html
│       ↳ [Rỗng] Trang thử riêng bằng HTTP server để kiểm tra HTML, CSS, module JS và JSON.
│
└── docs/
    ↳ Tài liệu của dự án; tài liệu này mô tả cấu trúc thực tế lúc được tạo.
    └── folder-structure.md
        ↳ [Tài liệu này] Tài liệu đang đọc: chú giải ngay dưới các mục trong cây thư mục.
```

## Lưu ý về hiện trạng

1. Hầu hết file hiện còn rỗng. Toàn bộ JavaScript, các trang trong `pages/`, JSON, schema, script và test chưa có nội dung triển khai.
2. `index.html` hiện chỉ nạp `css/base.css` và `js/pages/home.js`. Header/footer đang được viết trực tiếp trong trang, chưa được nạp từ `components/`.
3. `css/token.css` có design tokens; `css/tokens.css` đang rỗng. Trang chủ chưa nạp cả hai. Hai tên được giữ nguyên theo yêu cầu bảo toàn file cũ.
4. `filter.js`/`filters.js`, `related.js`/`related-content.js` là các tên gần nghĩa đang cùng tồn tại. Cần chốt file đảm nhiệm chính khi triển khai, tránh viết chức năng trùng nhau.
5. JSON rỗng chưa phải JSON hợp lệ để đọc bằng `response.json()`. Có 80 file article chưa có nghĩa là đã có 80 bài viết.
6. Ảnh/SVG mới trong `assets/img/`, `assets/map/`, `assets/ui/` chưa có dữ liệu. Bộ icon và ảnh chia sẻ thực đang nằm trong `assets/icons/`, `assets/images/`.
7. ID của từng nhóm độc lập. `evt0001` không mặc nhiên dùng `art0001` hoặc `sty0001`; quan hệ phải được khai báo rõ khi thiết kế dữ liệu. Một nội dung cũng không bắt buộc có đủ cả article và story riêng.
8. Danh mục `catalog.json` dự kiến được sinh từ dữ liệu gốc bằng `build-catalog.js`, giúp giảm cập nhật cùng một thông tin ở nhiều nơi.

## Phân biệt các phần dễ nhầm

| Các phần | Ranh giới trách nhiệm dự kiến |
| --- | --- |
| `id-resolver` / `content-loader` / `content-resolver` | Tìm đường dẫn / tải một tài nguyên / tập hợp các tài nguyên theo tham chiếu. |
| HTML / CSS / JS của header | Cấu trúc / kiểu dáng / hành vi tương tác. |
| `css/components/timeline.css` / `css/pages/timeline.css` | Kiểu dáng thành phần dùng chung / bố cục riêng của trang timeline. |
| Scene / block | Một cảnh tương đối lớn trong story / một đơn vị nhỏ của bài đọc. |
| `scenes/timeline.js` / `blocks/timeline.js` / `features/timeline.js` | Cảnh timeline / timeline nhúng trong bài / hành vi tính năng timeline. |
| `map-explorer.js` / `map-controller.js` | Khám phá địa danh trên trang bản đồ / điều khiển bản đồ theo diễn biến story. |
| `relations.js` / `related-content.js` | Quan hệ dữ liệu / trải nghiệm nội dung liên quan. |
| `engine/model.js` / `schemas/` | Chuẩn hóa dữ liệu để sử dụng / mô tả quy tắc dữ liệu hợp lệ. |
| `motion-controller.js` / `css/engine/motion.css` | Điều khiển chuyển động bằng JS / định nghĩa hiệu ứng và kiểu dáng CSS. |

## Ví dụ cách các phần phối hợp khi đã triển khai

1. Người dùng mở `pages/detail.html?id=evt0001`.
2. `js/pages/detail.js` đọc ID từ URL.
3. `id-resolver.js` xác định đường dẫn `data/evt/evt0001.json`.
4. `content-loader.js` tải JSON; `content-resolver.js` tập hợp nội dung và tham chiếu cần thiết.
5. `landing-engine.js` phối hợp handler theo loại nội dung và renderer phù hợp.
6. `article-renderer.js` gọi block, hoặc `story-renderer.js` gọi scene để tạo HTML.
7. CSS trình bày nội dung; controller khởi tạo những tương tác cần dùng.

Luồng trên mô tả thiết kế dự kiến, chưa phải luồng đã chạy trong mã nguồn hiện tại.
