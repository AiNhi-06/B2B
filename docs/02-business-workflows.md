# 02 — Business Workflows & State Transitions

## 1. Chu trình theo nguồn

| Thời gian | Vai trò | Hành động | Nhãn |
|---|---|---|---|
| 12:00–15:00 | Nhà vườn | Đăng sản phẩm, tồn kg, giá sỉ gốc | [SOURCE] |
| 16:00–22:00 | Khách B2B | Xem giá công khai, đặt đơn | [SOURCE] |
| Sau 22:00 | Admin + nhà vườn | Gom đơn, thông báo tổng số kg cho nhà vườn | [SOURCE] |
| 03:00–04:00 | Nhà vườn | Đóng gói, đưa hàng về Hub | [SOURCE] |
| Từ 04:00 | Admin/Hub | Dán QR, gom tuyến, điều phối xe, bàn giao | [SOURCE] |
| Sáng sớm | Khách B2B | Theo dõi hành trình giao | [SOURCE] |

**[PROPOSAL]** Demo dùng nút `Chuyển giai đoạn` để đi qua các mốc thời gian ngay trong vài phút, không khóa chức năng theo đồng hồ hệ thống. Thanh trạng thái ghi rõ `Demo mode`.

## 2. Happy path đa vai trò (bắt buộc nối cùng dữ liệu)
1. Nhà vườn tạo một listing `avocado-034` với tồn khả dụng và giá sỉ gốc.
2. Admin áp dụng markup => khách chỉ thấy `sellingPricePerKg`.
3. Hai tài khoản quán mẫu đặt số kg khác nhau của cùng mặt hàng.
4. Checkout hiển thị `subtotal`, `estimatedShippingFee`, `total`; khách xác nhận.
5. Admin gom các order hợp lệ => `aggregateDemand` theo `productId`; nhà vườn thấy số kg tổng cho sản phẩm của mình.
6. Nhà vườn bấm `Xác nhận cung ứng`, nhập thông tin xe và giờ dự kiến tới Hub (demo).
7. Admin gắn QR/tem, gán tuyến giả lập và cập nhật `DISPATCHED` -> `DELIVERED`.
8. Khách mở lịch sử đơn và thấy trạng thái mới; dữ liệu được đọc từ cùng state.

## 3. Business rules cho prototype
- **[SOURCE]** Giá sỉ gốc không lộ ra phân hệ khách hàng.
- **[SOURCE]** Giá khách đã cộng biên lợi nhuận. **[PROPOSAL]** `sellingPricePerKg = round(basePricePerKg * (1 + markupPercent / 100))` nếu áp dụng markup theo %. Nếu chọn cộng tiền cố định dùng `basePricePerKg + markupAmountPerKg`. Không áp dụng đồng thời hai chế độ.
- **[SOURCE]** Phí vận chuyển liên quan khoảng cách Hub -> quán. **[PROPOSAL]** Chỉ trả phí ước tính từ bảng `shippingFee` theo `deliveryAddressId` hoặc zone; không tính quãng đường thực.
- **[PROPOSAL]** Số lượng mua phải dương, integer kg trong MVP; nếu cần kg thập phân sẽ sửa contract đồng bộ.
- **[PROPOSAL]** Không cho checkout nếu tổng số kg trong đơn chờ + đã đặt vượt lượng hàng giả lập khả dụng; thông báo rõ khi hết hàng. Cách giữ tồn là quyết định MVP, không phải chính sách nguồn.
- **[PROPOSAL]** Giá, phí giao, tổng tiền của order được snapshot khi đặt, không bị thay đổi nếu admin sửa bảng giá sau đó.
- **[PROPOSAL]** `aggregateDemand` chỉ tính order chưa bị hủy (prototype chưa có flow hủy) và có trạng thái hợp lệ.

## 4. Trạng thái đề xuất

### OrderStatus
`PLACED -> AGGREGATED -> SUPPLIER_CONFIRMED -> AT_HUB -> DISPATCHED -> DELIVERED`

### PaymentStatus
`UNPAID -> PAID` (giả lập; không kết nối cổng thanh toán).

### ShipmentStatus
`PENDING -> ASSIGNED -> IN_TRANSIT -> DELIVERED` (giả lập; không GPS thật).

**[TBD]** Nguồn không quy định trạng thái chính xác ở mức API hoặc các trường hợp hàng thiếu/giao lỗi. Không tự bổ sung luồng nghiệp vụ phức tạp vào P0.

## 5. Các trường hợp tối thiểu cần xử lý
- Empty: chưa đăng sản phẩm, chưa có đơn.
- Validation: kg <= 0, giá < 0, thiếu địa chỉ/quán.
- Loading: mock request bất đồng bộ trong thời gian ngắn, không treo vô hạn.
- Error: dữ liệu không hợp lệ hoặc lỗi giả lập có thông báo có thể thử lại.
- Refresh: giữ trạng thái bằng localStorage trên **cùng origin**.
- Reset demo: khôi phục seed, không cần thao tác backend.
