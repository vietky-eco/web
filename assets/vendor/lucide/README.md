# Lucide Icons

- Phiên bản cố định: **1.65.0**.
- Tệp `lucide.min.js` là bản UMD chính thức, giữ nguyên nội dung từ gói npm `lucide`.
- Nguồn: https://registry.npmjs.org/lucide/-/lucide-1.65.0.tgz (`package/dist/umd/lucide.min.js`).
- Giấy phép: xem [LICENSE](./LICENSE), chép nguyên từ gói npm.
- Tài liệu: https://lucide.dev/guide/lucide/getting-started.

`js/components/header-graphics.js` nạp thư viện từ dự án và gọi `lucide.createIcons({ root: header })` sau khi HTML navbar được tải. Các trang cùng dùng component loader đều nhận được icon; không cần thêm CDN vào từng trang.

## Thêm icon vào navbar

Đặt tên icon từ https://lucide.dev/icons trong `components/header.html`:

```html
<button type="button" aria-label="Thu gọn thanh bên">
  <i data-lucide="panel-left-close" aria-hidden="true"></i>
</button>
```

Thư viện sẽ thay phần tử `data-lucide` bằng SVG khi navbar khởi tạo. Thư viện đầy đủ được lưu trong dự án nên có thể đổi sang tên icon khác mà không cần bước build. Icon kế thừa màu của phần tử chứa, dùng nét 1.75 và kích thước được quy định trong `css/components/header.css`.

Tất cả icon giao diện dùng Lucide, bao gồm các danh mục và mũi tên. Các alias `data-vk-graphic` được ánh xạ trong `header-graphics.js` (ví dụ `place` thành `map-pin`, `artifact` thành `amphora`). Logo thương hiệu và ảnh chụp vẫn dùng tài nguyên riêng.

Khi chèn thêm icon bằng JavaScript sau lúc khởi tạo, gọi lại `lucide.createIcons({ root: container })` cho vùng vừa cập nhật.
