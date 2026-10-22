# TÀI LIỆU THIẾT KẾ PHÂN HỆ NGƯỜI DÙNG \- HỆ THỐNG PHÂN PHỐI TRÁI CÂY B2B

## 1\. PHÂN HỆ 1: NGƯỜI GỬI HÀNG (NHÀ VƯỜN / NÔNG DÂN)

*Đối tượng:* Nông dân, chủ nhà vườn, đại lý sỉ tại vùng trồng.

| Chức năng | Nhiệm vụ | Thông tin cần lưu |
| :---- | :---- | :---- |
| **Đăng ký & Xác thực** | Đăng ký tài khoản và cập nhật thông tin cá nhân/vườn. | SĐT/OTP, Zalo ID, Tên nhà vườn, địa chỉ kho/vườn, STK ngân hàng nhận tiền. |
| **Đăng bán sản phẩm** *(12:00 \- 15:00)* | Chụp ảnh, video chọn loại trái cây và cập nhật số lượng tồn kho khả dụng. | Hình ảnh, video thực tế, chủng loại trái cây, số lượng tồn kho (VD: Bơ 034 \- 500kg). |
| **Định giá sỉ gốc** *(12:00 \- 15:00)* | Nhập giá sỉ gốc muốn bán cho hệ thống (được bảo mật tuyệt đối với khách hàng). | Giá sỉ gốc theo kg/tấn (VD: 20.000đ/kg). |
| **Xác nhận đơn tổng** *(Sau 22:00)* | Nhận danh sách chốt tổng số lượng các quán đặt để chuẩn bị hàng. | Tổng khối lượng cần cung cấp theo từng loại trái cây (VD: Tổng 200kg Bơ). |
| **Vận chuyển về Hub** *(03:00 \- 04:00)* | Đóng gói và vận chuyển hàng tổng về Kho Hub trung tâm đúng hẹn. | Biển số xe vận chuyển, thời gian xuất phát, thời gian giao hàng dự kiến tại Hub. |

## 

## 2\. PHÂN HỆ 2: KHÁCH HÀNG B2B (QUÁN CÀ PHÊ, NHÀ HÀNG, KHÁCH SẠN)

*Đối tượng:* Chủ quán cà phê, chuỗi F\&B, khách sạn, quán nước ép.

| Chức năng | Nhiệm vụ | Thông tin cần lưu |
| :---- | :---- | :---- |
| **Truy cập & Xác thực** | Đăng nhập hệ thống linh hoạt và quản lý thông tin doanh nghiệp/quán. | Số điện thoại & Mã OTP đăng nhập, Mã số thuế (MST), Tên quán, danh sách chi nhánh, địa chỉ nhận hàng. |
| **Xem sản phẩm & Giá bán** *(16:00 \- 22:00)* | Xem danh mục sản phẩm kèm Giá bán lẻ cuối cùng (đã cộng biên lợi nhuận, ẩn giá sỉ gốc của nhà vườn). | Giá bán lẻ sản phẩm theo kg (VD: Bơ 034 \- 26.000đ/kg). |
| **Tính tổng tiền & Phí V/C** *(16:00 \- 22:00)* | Hệ thống tự động bóc tách địa chỉ giao hàng, cộng Giá sản phẩm \+ Cước phí vận chuyển (tính theo khoảng cách từ Hub đến quán) để ra Tổng giá cuối cùng trên màn hình thanh toán. | Tiền hàng, Phí vận chuyển ước tính từ hệ thống giao hàng (AhaMove/Grab), Tổng số tiền phải thanh toán trước khi bấm xác nhận đặt hàng. |
| **Xác nhận đặt đơn** *(16:00 \- 22:00)* | Kiểm tra chi tiết đơn hàng (số lượng, giá SP, phí V/C, tổng tiền) và bấm nút xác nhận đặt đơn. | Mã đơn hàng, Trạng thái chờ xử lý, Hình thức thanh toán. |
| **Theo dõi GPS Real-time** *(Sáng sớm)* | Giám sát hành trình giao hàng trực tuyến tương tự Grab ngay trên giao diện (xem tài xế đang đi tới đâu trên bản đồ). | Tên tài xế, SĐT tài xế, Biển số xe, Link bản đồ GPS theo dõi hành trình real-time. |
| **Thanh toán**  | Quản lý thanh toán  | Hiển thị số tiền phải thanh toán, trạng thái thanh toán, phương thức thanh toán được hỗ trợ và thông tin xác nhận giao dịch.  |
| **Lịch sử giao dịch**  | Xem lịch sử đơn hàng  | Danh sách các đơn đã đặt, chi tiết sản phẩm, số lượng, giá bán, tổng tiền  |
| **Chăm sóc khách hàng**  | Gửi phản hồi và khiếu nại  | Cho phép phản ánh hàng thiếu, sai loại, không đúng độ chín, dập nát hoặc giao trễ; đính kèm hình ảnh làm căn cứ xử lý.  |

## 3\. PHÂN HỆ 3: QUẢN TRỊ HỆ THỐNG & VẬN HÀNH KHO (ADMIN DASHBOARD / HUB)

*Đối tượng:* Đội ngũ quản trị và nhân viên kho Hub.

| Chức năng | Nhiệm vụ | Thông tin cần lưu |
| :---- | :---- | :---- |
| **Cấu hình & Định giá** | Cài đặt quy tắc biên lợi nhuận (Markup) để hệ thống tự động tính giá bán công khai lên app khách hàng. | Tỷ lệ phần trăm hoặc số tiền cộng thêm (VD: \+20% hoặc \+5.000đ/kg). |
| **Gom đơn tự động** *(16:00 \- 22:00)* | Tự động tổng hợp các đơn hàng nhỏ lẻ từ tất cả các quán trong ngày. | Tổng hợp số lượng đặt theo từng loại trái cây từ toàn bộ hệ thống quán. |
| **Phân loại & In Tem nhãn** *(04:00 sáng)* | Sinh mã QR/Barcode và in tem nhãn hàng loạt dán lên sọt chứa hàng cho từng đơn. | Mã QR/Barcode, Tên quán, Mã đơn (\#1024), Chi tiết số lượng hàng trong sọt. |
| **Gom tuyến vận chuyển** *(04:00 sáng)* | Phân tích địa chỉ và gom các quán gần nhau thành cụm chuyến xe Multi-stop tối ưu chi phí cước. | Danh sách cụm tuyến đường (VD: Tuyến 1 \- Nguyễn Huệ), Cước phí ước tính cho từng chặng. |
| **Điều phối giao hàng API** *(04:00 sáng)* | Kiểm tra cụm chuyến xe và bấm nút đẩy đơn tự động sang các hãng vận chuyển (Grab/AhaMove). | Trạng thái tìm tài xế, SĐT tài xế, Mã vận đơn giao hàng đối tác. |
| **Bàn giao & Cập nhật trạng thái** | Quét mã QR xác nhận bàn giao hàng cho tài xế và tự động đồng bộ trạng thái đơn hàng thời gian thực. | Thời gian bàn giao, Trạng thái đơn hàng real-time ("Đang giao" \$\\rightarrow\$ "Hoàn thành"), Doanh thu trong ngày. |

