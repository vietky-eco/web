# Search UI

- Tìm trên data/catalog.json bằng core/catalog-loader.js và features/search.js; lọc loại bằng features/filter.js.
- Không sửa catalog, không fixture, không tạo ảnh. Catalog hiện có 28 mục event/person/place, tất cả draft. UI hiển thị trạng thái nội dung; không đổi draft thành published.
- Tìm kiếm navbar: gợi ý khi nhập; Enter mở dialog tối đa 6 kết quả; liên kết xem tất cả mở pages/search.html?q=... . Trang Search cập nhật trực tiếp khi nhập lại trên navbar, không tạo input thứ hai.
- Lọc loại/thời kỳ/khoảng năm; sắp xếp liên quan hoặc năm. periodIds hỗ trợ nhiều thời kỳ, nhãn lấy từ Entity bằng content-loader. Mục không có năm không nằm trong khoảng năm được lọc; UI không suy đoán năm sinh–mất.
- Phân trang 6 kết quả/trang. Query/type/period/from/to/sort/page nằm trong URL; đổi từ khóa/bộ lọc/sort quay về trang 1, Back/reload giữ trạng thái.
- Liên kết chi tiết dùng pages/detail.html?id=... được router hiện tại hỗ trợ. Bản thân kết quả không fetch toàn bộ bài, ảnh hoặc tự tạo nguồn.
- Loading/empty/error có thông báo và hành động phục hồi; lỗi catalog không bị thay bằng dữ liệu giả. Lỗi nhãn thời kỳ chỉ fallback ID, không làm mất nội dung đã tải.
- Header/footer dùng component hiện có; Newsreader/Be Vietnam Pro, token giấy/đỏ và nền mây từ repo. Không thêm dependency.

Kiểm thử tự động: tests/e2e/search.spec.mjs. Chạy server theo npm start (4173), sau đó npm run test:e2e -- tests/e2e/search.spec.mjs khi dependency phát triển đã cài. Search hoạt động ở URL HTML trên static HTTP server hoặc bản clean URL của hosting.


Bộ lọc áp dụng được hiển thị bằng nhãn có thể gỡ từng điều kiện và nút Xóa tất cả bộ lọc; giữ q/sort khi gỡ lọc. Hộp lọc dùng bản nháp tạm: Đặt lại chỉ xóa lựa chọn trong form, Hủy/Esc không thay đổi kết quả, Áp dụng mới cập nhật URL/danh sách. Số kết quả dự kiến tính theo cả loại nội dung đang chọn. Hai select thời kỳ/sắp xếp dùng chung style native select với progressive enhancement và fallback hệ điều hành.

Bố cục kết quả đã đổi theo apple-design: vùng ảnh nền màu ổn định theo ID khi chưa có ảnh, không mang ý nghĩa dữ liệu lịch sử. Desktop ảnh cạnh nội dung; mobile ảnh cạnh tiêu đề, mô tả xuống hàng rộng. Giữ Newsreader/Be Vietnam Pro, nền mây và header/footer. Các nhãn Bản nháp/Chờ duyệt được tách khỏi loại bài; không tự thêm niên đại cho dữ liệu thiếu năm.
