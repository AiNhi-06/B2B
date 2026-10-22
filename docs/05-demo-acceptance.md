# 05 — Demo Script & Acceptance Criteria

## Kịch bản demo 5–7 phút [PROPOSAL]
| Phân đoạn | Vai trò | Thao tác trình diễn | Kết quả cần thấy |
|---|---|---|---|
| 1 | Chung | Giới thiệu 3 vai trò, bật Demo Mode | Hiện rõ đây là prototype giả lập |
| 2 | Nhà vườn | Đăng bơ 034 với kg và giá gốc | Tồn và giá gốc lưu trong mock state |
| 3 | Admin | Đặt markup | Catalog khách cập nhật giá bán công khai |
| 4 | Khách B2B | Hai quán thêm mặt hàng, báo giá và đặt đơn | Checkout có tiền hàng + phí VC + tổng tiền |
| 5 | Admin | Gom đơn | Demand theo loại quả bằng tổng đơn từ các quán |
| 6 | Nhà vườn | Xác nhận số kg và thông tin xe | Admin thấy xác nhận trong state |
| 7 | Admin | Gắn tem QR demo; bàn giao và cập nhật trạng thái | Order sang trạng thái giao hàng tương ứng |
| 8 | Khách B2B | Mở đơn hàng, xem trạng thái và lịch sử | Kết quả thống nhất với Admin |

## Acceptance checklist
- [ ] `npm run build` thành công tại `main`.
- [ ] Có thể chuyển 3 vai trò mà không mất dữ liệu trong một origin.
- [ ] Không có thành phần UI nào lộ giá gốc cho khách B2B.
- [ ] Giá catalog thay đổi sau markup, trong khi giá snapshot của đơn cũ không đổi.
- [ ] Checkout tính đúng `subtotal + shippingFee = total` (phí vận chuyển demo được gắn nhãn ước tính).
- [ ] Số kg ở bảng gom đơn đúng bằng tổng kg từ đơn đã xác nhận, không nhân đôi khi bấm gom đơn lần hai.
- [ ] Bản tổng nhà vườn khớp dữ liệu Admin.
- [ ] Thay đổi trạng thái từ Admin hiện trong lịch sử khách sau reload/navigation.
- [ ] Refresh không làm mất dữ liệu demo; có nút reset về seed ban đầu.
- [ ] Các trường rỗng/số âm/đặt quá tồn đều hiện lỗi rõ.
- [ ] Không có màn hình giả vờ kết nối OTP, GPS, thanh toán hoặc Grab/AhaMove thật.
- [ ] Quay thử từ đầu đến cuối không cần sửa code hoặc mở DevTools.

## Kiểm tra logic bằng dữ liệu ví dụ [PROPOSAL]
Với mặt hàng Bơ 034: giá gốc 20.000đ/kg, giá công khai mẫu 26.000đ/kg. Quán A đặt 30kg, quán B đặt 20kg => demand tổng 50kg. Phí vận chuyển ví dụ được chọn bởi fixture tại từng địa chỉ, không dựa API thật. Những số này chỉ phục vụ kiểm tra, không phải quy định chính sách kinh doanh.

## Chưa được xác nhận [TBD]
Đơn vị định lượng kg có hỗ trợ thập phân hay không; phương thức thu tiền, thuật toán phí vận chuyển, lịch đặt theo múi giờ/tài khoản và các quy tắc tối ưu tuyến. Không tự triển khai những hạng mục này như tính năng production.
