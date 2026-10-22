# 01 — Product / MVP Specification

## 1. Mục tiêu
**[SOURCE]** Hệ thống phân phối trái cây B2B với ba nhóm người dùng: nhà vườn/người gửi hàng; quán cà phê, nhà hàng, khách sạn; admin/Hub.

**[PROPOSAL]** Tạo một prototype frontend vận hành xuyên suốt ba vai trò, phục vụ video thuyết minh ý tưởng; trình diễn bằng dữ liệu và tác vụ giả lập, **không khẳng định hệ thống đã tích hợp dịch vụ thật**.

## 2. Ba phân hệ từ tài liệu nguồn

### A. Nhà vườn / người gửi hàng
**[SOURCE]** Đăng ký và xác thực (SĐT/OTP, Zalo ID), quản lý thông tin nhà vườn, địa chỉ, tài khoản nhận tiền; đăng sản phẩm bằng ảnh/video, loại trái cây, tồn kho; nhập **giá sỉ gốc bảo mật**; nhận/xác nhận đơn tổng; khai báo biển số xe và mốc vận chuyển về Hub.

### B. Khách B2B
**[SOURCE]** Đăng nhập bằng SĐT/OTP, quản lý quán/MST/chi nhánh/địa chỉ; xem danh mục và **giá bán công khai** (không được thấy giá sỉ gốc); tính tiền và phí giao hàng; đặt đơn; theo dõi GPS; thanh toán; lịch sử đơn; gửi phản hồi/khiếu nại có ảnh.

### C. Admin / Hub
**[SOURCE]** Cấu hình markup; gom nhu cầu từ đơn hàng; tạo QR/barcode và tem sọt; gom tuyến giao nhiều điểm; điều phối đối tác vận chuyển; xác nhận bàn giao bằng QR; cập nhật trạng thái và xem doanh thu.

## 3. MVP demo ưu tiên
**[PROPOSAL]** Tập trung luồng minh họa giá trị khác biệt (gom nguồn cung, gom nhu cầu và điều phối Hub):

| Ưu tiên | Vai trò | Màn hình / Hành động | Tình trạng |
|---|---|---|---|
| P0 | Chung | Chuyển vai trò demo bằng role selector, không OTP thật | Đề xuất |
| P0 | Nhà vườn | Danh sách hàng; thêm lô trái cây, kg, giá gốc | Đề xuất từ chức năng nguồn |
| P0 | Admin | Cài markup; duyệt bảng giá công khai | Đề xuất từ chức năng nguồn |
| P0 | Khách B2B | Danh mục, giỏ hàng, checkout, tổng tiền có phí VC | Đề xuất từ chức năng nguồn |
| P0 | Admin | Danh sách đơn, gom nhu cầu theo sản phẩm, bảng tổng cho nhà vườn | Đề xuất từ chức năng nguồn |
| P0 | Nhà vườn | Xem và xác nhận tổng kg phải giao Hub | Đề xuất từ chức năng nguồn |
| P0 | Admin | Tem QR dạng mô phỏng; cập nhật trạng thái giao | Đề xuất từ chức năng nguồn |
| P0 | Khách B2B | Theo dõi trạng thái đơn giả lập; xem lịch sử | Đề xuất từ chức năng nguồn |
| P1 | Admin | Gom tuyến multi-stop mô phỏng, không tối ưu GPS thật | Đề xuất |
| P1 | Khách B2B | Gửi khiếu nại demo | Đề xuất |
| P2 | Chung | OTP/Zalo/MST thật, cổng thanh toán, API Grab/AhaMove, GPS thật | Để giai đoạn sau |

## 4. Chọn giao diện
**[TBD]** Nhóm chưa quyết định web responsive hoặc mobile-only. **[PROPOSAL]** Giữ giao diện mobile-first cho nhà vườn và khách B2B, admin dashboard responsive cho laptop; đây là lựa chọn kỹ thuật có thể đổi, không phải yêu cầu nguồn.

## 5. Các điểm chưa được tài liệu nguồn quy định
**[TBD]** Tên thương hiệu, logo, bộ nhận diện; chính sách hủy/hoàn tiền; thuật toán dự báo cầu; quy tắc phân bổ nguồn cung nếu thiếu hàng; công thức phí vận chuyển; mức markup mặc định; chính sách thanh toán công nợ; thời gian giao chính xác. Agent phải đặt các con số hiện trên prototype dưới nhãn **"Dữ liệu demo / giả lập"**, không suy diễn thành chính sách thật.

## 6. Phi chức năng
**[PROPOSAL]** Chạy được offline bằng Vite (sau cài dependency); luồng demo có nút reset; dữ liệu ổn định qua refresh (localStorage ở browser); phân quyền màn hình mức UI (không phải bảo mật server); có empty/loading/error states; build TypeScript sạch.
