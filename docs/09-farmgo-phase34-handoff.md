# FARMGO — Bàn giao đợt 3 và đợt 4

Triển khai theo kế hoạch người dùng duyệt ngày 23/10/2026. Chỉ mock trong trình duyệt, không thêm dependency. Code trên `agent/workflow` và `agent/frontend`; chưa merge đợt này vào `main`.

## Contract và dữ liệu

- Contract v4 được commit trước logic hồ sơ/QC/khiếu nại; nghiệm thu logic đợt 3 trước khi ghi contract v5 và triển khai tiền/ca giao. Contract đang chạy: [03](03-data-api-contract.md). Lưu v3/v4 trong các file archive.
- Key `b2b-demo-v1`, schema 1 → 3 → 4 → 5. Không reset tự động hoặc chèn sản phẩm seed vào dữ liệu cũ. Giữ IDs, ảnh, tồn, snapshot đơn, xác nhận và chuyến.
- Hồ sơ/lô cũ được dùng tiếp với nhãn “Demo cũ — chưa thẩm định”. Nộp hồ sơ hoặc QC mới chấm dứt quyền chuyển tiếp tương ứng; thiếu chứng nhận/Yield không được bịa dữ liệu để duyệt.
- Không tạo giờ nhận, QC, giao dịch Escrow hoặc hoàn tiền hồi tố cho đơn cũ. Quyết định khiếu nại lịch sử không có thanh toán được ghi rõ chưa có giao dịch hoàn Escrow.
- Lỗi ghi storage giữ cả state trong bộ nhớ và bản đã lưu trước đó. Input và kết quả service được tách khỏi state; listener lỗi không làm giao dịch lặp.

## Màn hình và luồng

| Vai trò | Chức năng mới |
|---|---|
| Bên mua | Hồ sơ, đăng ký/đăng nhập OTP demo `000000`; QC/True-Cost trên chi tiết và so sánh cùng commodity; ngày giao và hai ca; đặt hàng & thanh toán demo; khiếu nại có tối đa ba ảnh; xem sổ tiền |
| NCC | Hồ sơ, ảnh VSATTP và VietGAP tùy chọn; QC A/B/Yield/Brix; lô nháp cho tài khoản chờ duyệt; phản hồi khiếu nại; số dư, yêu cầu rút và số tiền giữ chỗ |
| Admin | Duyệt/từ chối hồ sơ và QC; xét kg hoàn; cảnh báo SLA; đối soát từng NCC/đơn; duyệt/từ chối rút; nhóm chuyến cùng ngày/ca; tua đồng hồ |

Ảnh hồ sơ/khiếu nại dùng cùng bộ nén JPG/PNG/WebP với ảnh sản phẩm, chỉ lưu trong trình duyệt. Không nhận video. Hồ sơ phải lưu nháp trước khi nộp; nút nộp ghi rõ dùng dữ liệu đã lưu.

Hồ sơ chưa duyệt vẫn xem danh mục và chuẩn bị lô nháp. Catalog và quote/place kiểm tra điều kiện hồ sơ/QC tại service. QC chỉnh lại tạm ngừng catalog, sửa giá giữ QC. Đơn mới snapshot QC đã được duyệt; đơn cũ không đổi khi sửa QC/giá. Các luồng xác nhận/giao đơn đã có không bị chặn bởi xét hồ sơ mới.

Đồng hồ demo lưu ISO, hiển thị UTC+7; không tự chạy. Admin tua +30 phút/+120 phút/+1 ngày. Không tự gom 22h hoặc khóa điều phối theo giờ. Ngày giao từ ngày mai; ca 05–07h hoặc 13–15h, luôn qua Hub. Tài khoản đăng ký mới dùng địa chỉ fixture `DEMO_30000` với phí giao 30.000đ; seed cũ giữ phí địa chỉ 30.000/40.000đ.

Hạn gửi khiếu nại: trước mốc nhận +2 giờ. SLA xử lý: từ lúc gửi +2 giờ, quá hạn chỉ cảnh báo. Một hồ sơ mở cho mỗi đơn/NCC. Hoàn theo kg Admin duyệt và giá snapshot; không hoàn ship, cộng tồn hoặc tạo đổi hàng.

## Tiền và chống lặp

Một lần lưu cho đặt đơn + trừ tồn + HOLD toàn bộ tổng tiền. Mỗi NCC có allocation tiền hàng riêng, shipping theo dõi riêng. REFUND cùng lần lưu quyết định Admin, key theo claim. SETTLEMENT chỉ sau giao +2 giờ và hết khiếu nại mở của đúng NCC. Phí 3% làm tròn VND một lần trên tiền hàng ròng. PENDING withdrawal giữ chỗ; từ chối trả lại khả dụng. Không giải ngân/rút tự động.

Checkout và rút tiền giữ request key của lần thử trong storage. Gọi lại cùng key/payload trả kết quả đã có; khác payload báo lỗi. Quyết định hoàn, đối soát và duyệt rút không ghi ledger hai lần. Giỏ chỉ xóa sau đặt thành công; lỗi dọn giỏ giữ key chống lặp. Reset dọn đúng các key FARMGO cho cả tài khoản đăng ký mới, không xóa storage ứng dụng khác.

## Kiểm thử

```text
node --test src/services/demoService.test.mjs src/services/phase34.test.mjs
npm run build
npm run lint
git diff --check
```

- 12 nhóm test (7 hồi quy đợt 2 + 5 nhóm đợt 3/4): phê duyệt/nộp lại; thiếu Yield và sửa QC; snapshot/True-Cost; ownership/ảnh/kg/hạn; nguyên tử order/stock/hold/refund; đa NCC; fee/rút/chống lặp; ca giao; migration 1/3/4/5 và lỗi ghi; nạp module mới giữ đồng hồ/ledger và trả đúng order cũ khi gửi lại key.
- Kịch bản chuẩn: 10kg ×32.000đ + ship30.000đ = HOLD350.000đ. Hoàn2kg64.000đ; netgoods256.000đ; fee7.680đ; NCC248.320đ; ship30.000đ giữ riêng.
- Trình duyệt: nộp và duyệt hồ sơ; đặt đơn ca chiều; gom → NCC xác nhận → nhập Hub → tạo chuyến đúng ca → giao → khách khiếu nại2kg → NCC phản hồi → tua2h xuất hiện SLA → Admin hoàn → đối soát → NCC yêu cầu rút → Admin duyệt → refresh giữ kết quả. QC Yield80% cho xoài32.000đ hiển thị True-Cost40.000đ/kg, 10kg mua dùng được8kg. Đăng ký mới bằng OTP demo hoạt động.
- Desktop và viewport điện thoại 390×844: hồ sơ, QC, chi tiết, đối soát; không tràn ngang trang, bảng rộng cuộn bên trong.
- Build sạch. Lint không có error; còn cảnh báo React về đồng bộ state trong effect ở các màn hình tải dữ liệu, gồm một màn hình hồ sơ mới.

## Phạm vi thực tế

Dữ liệu chỉ bền trong cùng browser/origin có localStorage. Không có xác thực backend, kiểm định chứng nhận/QC thật, SMS, cổng thanh toán, ngân hàng hoặc GPS. Các tab trình duyệt đang mở không có cơ chế đồng bộ tức thời state; refresh nạp bản lưu mới. File ảnh lớn vượt quota báo lỗi, không tự xóa bản cũ. Không có VAT, hóa đơn, công nợ, khóa giá, tự giao, đổi hàng, video, OCR.

Các file mới chính: `src/types/governance.ts`, `src/types/finance.ts`, `src/services/governanceService.ts`, `src/services/financeService.ts`, `src/services/phase34.test.mjs`; `useDemoData`, `DemoClock`; các trang `BusinessProfilePage`, `QualityPage`, `ClaimsPage`, `FinancePage`, `admin/ApprovalsPage`. Các file cũ được nối thêm ở types/seed/store/service, App, portal routes, checkout, chi tiết đơn/sản phẩm, listing, gom/điều phối, role selector, reset giỏ và theme.
