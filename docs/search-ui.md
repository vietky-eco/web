# Search UI

- Tìm kiếm từ `data/catalog.json`, bỏ qua dấu tiếng Việt và dấu câu, chấp nhận đảo thứ tự từ và ưu tiên tiêu đề khớp sát nhất.
- Ô tìm trên navbar cập nhật tối đa 10 gợi ý khi nhập. Enter, nút tìm và **Xem thêm** mở popup ngay trên trang đang xem. **Tìm kiếm nâng cao** mở bộ lọc **Loại**.
- Popup mặc định dành toàn bộ chiều ngang cho kết quả, 10 mục mỗi trang. Khi chưa nhập từ khóa, popup hiện các nội dung phù hợp với bộ lọc hiện tại và gợi ý một vài thời kỳ nếu chưa có điều kiện.
- Nút **Bộ lọc** nằm cạnh tùy chọn sắp xếp. Cột trái mở sẵn trên desktop, hiển thị loại nội dung, thời kỳ và khoảng năm. Trên điện thoại, bộ lọc mở phía trên kết quả. Các lựa chọn áp dụng ngay và quay về trang 1. Bấm lại **Bộ lọc** hoặc nhấn Escape để thu gọn.
- Lưới loại nội dung cho phép bật hoặc tắt **Sự kiện**, **Nhân vật**, **Địa danh**, **Hiện vật** và **Văn hóa**. Chọn **Tất cả** để bỏ giới hạn loại. Thanh chip cho phép xóa từng điều kiện hoặc xóa hết ngay trên danh sách.
- Khoảng năm dùng thanh kéo hai đầu có vạch bắt dính và cập nhật kết quả khi thả tay. Chọn thời kỳ giới hạn thanh trong khoảng của thời kỳ đó. Niên đại trước Công nguyên dùng năm âm trong dữ liệu và nhãn TCN trong bộ lọc. Nội dung chưa biết năm chỉ bị loại khi thu hẹp khoảng năm.
- Có thể gắn `categoryId` trong JSON nguồn cho các mục Di tích, Hiện vật và Văn hóa. Tạo lại chỉ mục bằng `node scripts/build-catalog.js`. Bộ lọc Chủ đề có thể bổ sung khi catalog có dữ liệu thống nhất.
- Gợi ý bài viết và danh sách kết quả công khai chỉ dùng trạng thái `published`. Để thử nội dung nháp, mở `/?preview=1` trên localhost. Dữ liệu mẫu hiện có 32 mục và đều là bản nháp.
- Từ khóa, bộ lọc đã áp dụng, cách sắp xếp và trang hiện tại được giữ khi reload cùng trang trong cùng tab.
- Danh sách dùng thanh tiến độ cuộn và component phân trang chung. Liên kết lấy từ `data/slug-index.json` hoặc dự phòng về `/chi-tiet?id=...`. Trạng thái chờ, trống và lỗi đều có thông báo.

Chạy `npm run test:e2e -- tests/e2e/search.spec.mjs` sau khi cài dependency.
