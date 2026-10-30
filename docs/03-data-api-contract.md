# FARMGO — Contract v5: Escrow, đối soát và ca giao

Được người dùng duyệt triển khai 23/10/2026. Kế thừa v4 tại 03-data-api-contract-v4-archive.md và v3; các thay đổi dưới đây ưu tiên áp dụng. Chỉ giao dịch demo, không kết nối ngân hàng.

## Schema và lịch sử
Schema 4 → 5 thêm allocations, ledger, withdrawals, operations. Giữ nguyên IDs, ảnh, tồn, profiles, QC, claims và đơn. Không thêm deliveredAt, escrow, giao dịch hoặc trạng thái đã hoàn/đối soát cho lịch sử. Đơn chưa có allocation luôn hiển thị “Không có thanh toán demo”. Quyết định hoàn v4 giữ nguyên nhưng không hồi tố tiền. Ghi storage nguyên tử trước khi công bố state, lỗi giữ bản cũ.

## Đặt và giao
NewOrderInput bổ sung deliveryDate (YYYY-MM-DD ngày Việt Nam từ ngày mai), deliverySlot MORNING (05–07h) / AFTERNOON (13–15h), requestKey (chuỗi ổn định cho cùng lần đặt). Quote không cần requestKey; place bắt buộc. Chỉ UI cũ chưa chọn lịch được quote giá với ngày mai/ca sáng mặc định để tương thích; UI checkout mới luôn gửi cả hai. Order thêm các trường lịch và paymentRequestKey. Shipment snapshot deliveryDate?/deliverySlot?; không gom khác lịch/ca hoặc trộn lịch sử thiếu lịch với đơn mới.
Một mutate duy nhất kiểm tra điều kiện hồ sơ/QC/tồn, trừ tồn, tạo đơn PAID và giữ total. Lỗi không thay đổi gì. placeOrder cùng requestKey và cùng payload trả đơn cũ, khác payload báo lỗi. Snapshot QC/giá và ngày/ca bất biến. Gom 22h vẫn bằng nút, không tự chạy theo đồng hồ.

## Tiền
EscrowAllocation: id, orderId, supplierId, goodsVnd, refundedVnd, status HELD/SETTLED, feeVnd?, supplierNetVnd?, settledAt?. Shipping theo ledger HOLD riêng và Order.shippingFeeVnd, không vào số dư NCC.
LedgerEntry: id, key duy nhất, kind HOLD/REFUND/SETTLEMENT/WITHDRAWAL, orderId?, supplierId?, claimId?, withdrawalId?, amountVnd, feeVnd?, createdAt. HOLD toàn bộ order.totalVnd một lần. REFUND chỉ tiền hàng; SETTLEMENT ghi gross net hàng và fee. held = tổng HOLD − REFUND − SETTLEMENT (ship còn giữ riêng). Không có giải ngân tự động.
- decideClaim của v4 mở rộng: khi APPROVED và có allocation, trong cùng mutate ghi REFUND theo claimId đúng một lần; nếu đã đối soát hoặc tiền thiếu thì rollback. Lịch sử không có allocation chỉ ghi quyết định, không ghi giao dịch.
- settleEscrow({orderId,supplierId}): Admin, giao thành công + ít nhất 2 giờ, không còn claim OPEN/RESPONDED của đúng phần NCC. Trả allocation đã settled khi gọi lại. feeVnd=round((goodsVnd−refundedVnd)*3/100) một lần, supplierNetVnd=goods−refund−fee. Shipping không tính phí.
- Withdrawal: id,supplierId,amountVnd,status PENDING/APPROVED/REJECTED,requestKey,createdAt,note?,reviewedAt. Số dư available = tổng supplierNet settled − tổng withdrawal APPROVED − tổng PENDING. PENDING giữ chỗ; từ chối giải phóng. Không cho amount <=0 hoặc vượt available.
- requestWithdrawal({supplierId,amountVnd,requestKey}): NCC sở hữu; idempotent theo requestKey+payload. reviewWithdrawal({withdrawalId,approved,note}): Admin, quyết định đúng một lần; gọi lại cùng payload trả kết quả cũ, khác payload báo lỗi. Từ chối bắt buộc lý do.
- getFinance(): {allocations,ledger,withdrawals,balances:[{supplierId,availableVnd,reservedVnd,paidVnd}]}. Admin tất cả; NCC chỉ phần mình; khách chỉ order của mình, không nhận balances NCC.
- Mọi tiền VND nguyên an toàn. operations lưu fingerprint request bền qua refresh. Các giao dịch không có bên ngoài; idempotency và storage nằm trong cùng mutate.

## Đồng hồ và nghiệm thu
getDemoClock / advanceDemoClock từ v4 dùng chung cho đặt/nhận/khiếu nại/SLA/đối soát, lưu qua refresh. Reset toàn bộ state về schema5, không xóa storage khác.
Chuẩn 10kg×32000 + ship30000 = giữ350000; hoàn2kg64000; hàng ròng256000; phí7680; NCC248320; ship30000. Cần kiểm tra đa NCC, khóa đúng phần, không lặp tiền, không rút vượt số dư, không gom khác ca, migration và lỗi lưu.
Không VAT/hóa đơn/công nợ/khóa giá/tự giao/đổi hàng/video/OCR hoặc dịch vụ thật.


## Customer checkout demo extension — approved 2026-10-30
User approved selectable fees and persistence in demo orders. `NewOrderInput.checkoutOptions?` contains `orderMode: SINGLE | GROUP`, `carrier: GHN | GHTK | TRUCK`, `paymentMethod: BANK | COD | MOMO | ZALOPAY`, `insurance: boolean`. Quote and Order snapshot these options plus optional `insuranceFeeVnd`. Existing callers/orders without options retain address-based shipping and zero insurance.
Single fees: GHN 35,000 VND, GHTK 30,000 VND, truck 25,000 VND. GROUP uses a provisional demo fee 20,000 VND, without actual grouping. Insurance is rounded to nearest VND at 0.5% of goods subtotal. Total = goods + shipping + insurance. Options are validated and included in payment idempotency fingerprint. All payment choices, including COD, use the existing simulated PAID/Escrow flow; no real payment, carrier or insurance integration. Escrow HOLD records total; supplier allocation remains goods only; insurance does not alter supplier payout or claims policy.
Home sale shelf uses fixed demo comparison prices and live listing prices as final purchase prices; does not overwrite seller prices or stock. No artificial countdown or sales counts.
