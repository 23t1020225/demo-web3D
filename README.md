# Nếp — Ngôi nhà 3D

Ứng dụng React / Three.js dựng ngôi nhà từ ảnh. Phần 3 đã mở rộng lối đi và sảnh sau; các phần dùng chung mức phơi sáng và ánh sáng trung tính.

## Chạy và kiểm tra

- `npm run dev` — mở đường dẫn Local được in ra.
- `npm test` — kiểm tra chất lượng đồng nhất trên điện thoại và máy tính, phạm vi phòng, mô hình nén, dùng chung tài nguyên và ánh sáng.
- `npm run build` — tạo bản phát hành trong `dist`.
- `npm run preview` — xem bản phát hành.

Thêm `?room=bathroom` để vào Phần 3. Các phòng khác: `living-left`, `living-right`, `kitchen-right`, `bedroom-left`.

## Tối ưu hiệu năng

- Tải phòng đang xem trước, chuẩn bị các phòng còn lại khi người xem ngừng thao tác. Giữ phòng đã tải trong bộ nhớ.
- Chuẩn bị shader và các phòng thông nhau trước khi bắt đầu hành trình camera. Giữ đồ vật đã tải trong cảnh để bóng và phản chiếu không đổi khi xoay; trình vẽ vẫn loại bỏ các vật ngoài khung hình.
- Điện thoại và máy tính dùng cùng chất lượng khử răng cưa, bóng và phản chiếu. Độ phân giải theo mật độ màn hình, từ 1,25× đến 3×; giữ nguyên cả khi xoay hoặc di chuyển. Cấu hình này ưu tiên độ nét và có thể tốn thêm tài nguyên trên điện thoại.
- Dùng một mặt phản chiếu sàn liên tục qua các phòng, giữ độ đậm cố định. Cập nhật tối đa mỗi 100 ms khi di chuyển và cập nhật ngay khi dừng hoặc khi cảnh thay đổi.
- Dùng chung hình học và vật liệu; đổi mức chi tiết ghế theo khoảng cách có vùng đệm, không đổi chỉ vì bắt đầu hoặc dừng xoay.
- Ảnh WebP, môi trường HDR thu nhỏ và bốn mô hình ghế nén được tạo sẵn, tránh dựng lại mô hình ghế trong trình duyệt.

Các tệp gốc vẫn được giữ. Lệnh tạo lại tài nguyên: `python scripts/optimize-textures.py`, `node scripts/optimize-environment.mjs`, `node scripts/prepare-carved-lod.mjs`.

Thêm `&perf=1` vào URL có `room` để hiện số đo chẩn đoán. Giao diện bình thường không hiện bảng này. Kết quả FPS và thời gian mở còn phụ thuộc máy, bộ nhớ đệm và các ứng dụng đang chạy.
