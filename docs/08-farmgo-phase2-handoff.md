# FARMGO đợt 2 — Bàn giao triển khai

## Phạm vi hoàn tất

- Contract v3 thay thế giá markup bằng giá NCC công khai; tên API và model được chốt trong `03-data-api-contract.md`.
- Migration giữ key `b2b-demo-v1`, tăng schema 1 -> 3, giữ ảnh/tồn/session/đơn/xác nhận/chuyến cũ. Lỗi ghi không công bố state mới hoặc ghi đè bản cũ. Lô cũ chưa phân nhóm có thể bổ sung nhóm một lần.
- Cả ba portal dùng FARMGO, bố cục có thanh điều hướng responsive và nội dung tiếng Việt.
- Bên mua: trang chủ, hai nhóm hàng, bộ lọc công dụng, tìm theo tên/NCC/vùng, sắp xếp giá, chi tiết và so sánh nguồn cung cùng commodity.
- Giỏ tách theo tài khoản doanh nghiệp, nhận giỏ cũ một lần, quote lại bằng service; đơn mới snapshot NCC và giá.
- NCC: tổng quan từ state, thêm/sửa ảnh, giá, tồn, mô tả và công dụng; ẩn/mở bán; không hard-delete.
- Hub: tổng quan vận hành, danh sách NCC, danh mục ảnh/giá công khai, gom đơn chỉ khi người dùng bấm, tiếp tục tem/chuyến/giao hàng.
- Form xác nhận cung ứng chỉ gửi đơn chưa được NCC xác nhận; thời gian được gửi theo ISO thay vì chuỗi mô tả tự do.
- Reset có xác nhận trong giao diện, xóa giỏ demo theo tài khoản ở mọi vai trò và đưa widget mốc giờ về đầu.

## Kiểm tra đã chạy

- `npm run build`: đạt trên bản ghép đầy đủ của nhánh frontend.
- `node --test src/services/demoService.test.mjs`: 7/7 đạt, gồm migration giữ snapshot đơn, idempotence, write failure, phân nhóm lô cũ, hai NCC cùng mặt hàng, ẩn/sửa lô, rollback và shipment cascade.
- Browser smoke trên origin riêng `http://localhost:5176`: tìm xoài trả hai NCC, chọn HTX ở 32.000đ/kg, đặt 10kg + 30.000đ phí giao -> tổng 350.000đ; đổi tài khoản không lẫn giỏ.
- NCC sửa giá lên 33.000đ và ẩn hàng; đơn cũ vẫn 350.000đ. Gom đơn, xác nhận cung ứng, nhập Hub, tạo chuyến và cập nhật giao; lịch sử bên mua hiển thị đã giao.
- Đăng lô rau củ kèm ảnh từ máy; ảnh giữ qua refresh và hiển thị cả ba vai trò.
- Viewport điện thoại: kiểm tra trang chủ và form, không tràn chiều ngang toàn trang. Thanh menu nhỏ cho phép cuộn riêng.
- Lint không có lỗi chặn; còn các cảnh báo về setState trong effect trên các màn hình hiện có. Không thêm dependency.

## Giới hạn có chủ đích

- Đăng ký/duyệt tài khoản, QC/Brix/Yield, khiếu nại: đợt 3 theo phạm vi đã duyệt; chưa có huy hiệu xác minh giả hoặc số liệu QC tự gán.
- VAT, công nợ, Escrow, đối soát, phí sàn, ca giao và self-delivery: chờ chốt nghiệp vụ ở đợt 4.
- Demo vẫn đặt theo kg nguyên. Quy cách thùng/sọt chỉ là mô tả.
- Ảnh tải lên nằm trong localStorage, có thu nhỏ/giới hạn; lưu nhiều ảnh vẫn có thể hết dung lượng, khi đó lỗi ghi được báo và state cũ được giữ.
- Không tự reset dữ liệu đang dùng ở cổng 5173 để tạo seed mới. Dữ liệu v2 đang có chỉ được chuyển đổi, không tự chèn mặt hàng seed mới. Muốn xem đầy đủ seed v3 có thể xem bản thử ở 5176 hoặc reset có chủ đích.
- Bản nháp lịch sử file 07 không thay thế contract hiện hành file 03.

## Tập tin thay đổi so với main trước tích hợp code

- `docs/03-data-api-contract.md`
- `docs/06-farmgo-approved-scope.md`
- `docs/07-data-api-contract-v3-draft.md`
- `docs/08-farmgo-phase2-handoff.md`
- `docs/README.md`
- `index.html`
- `src/App.tsx`
- `src/components/shared/DemoModeBanner.tsx`
- `src/components/shared/HubProductPhotos.tsx`
- `src/components/shared/PhaseAdvancer.tsx`
- `src/components/shared/PortalLayout.tsx`
- `src/components/shared/RoleSelector.tsx`
- `src/components/shared/contract-ambient.d.ts`
- `src/components/shared/useBuyerCart.ts`
- `src/components/shared/useCatalog.ts`
- `src/mocks/seed.ts`
- `src/pages/admin/AdminDashboard.tsx`
- `src/pages/admin/AdminOverviewPage.tsx`
- `src/pages/admin/AdminSuppliersPage.tsx`
- `src/pages/admin/AggregatePage.tsx`
- `src/pages/admin/PricingPage.tsx`
- `src/pages/customer/BuyerHomePage.tsx`
- `src/pages/customer/CatalogPage.tsx`
- `src/pages/customer/CheckoutPage.tsx`
- `src/pages/customer/CustomerMarketplace.tsx`
- `src/pages/customer/OrderDetailPage.tsx`
- `src/pages/customer/OrdersPage.tsx`
- `src/pages/customer/ProductDetailPage.tsx`
- `src/pages/supplier/AddProductPage.tsx`
- `src/pages/supplier/DemandPage.tsx`
- `src/pages/supplier/ListingsPage.tsx`
- `src/pages/supplier/SupplierDashboard.tsx`
- `src/pages/supplier/SupplierOverviewPage.tsx`
- `src/services/demoService.test.mjs`
- `src/services/demoService.ts`
- `src/store/demoStore.ts`
- `src/styles/theme.css`
- `src/types/index.ts`
