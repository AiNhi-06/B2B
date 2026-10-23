# FARMGO — Contract v4: hồ sơ, QC và khiếu nại

Đã được người dùng duyệt triển khai 23/10/2026. Bổ sung v3 (lưu tại 03-data-api-contract-v3-archive.md); quy tắc v3 không mâu thuẫn tiếp tục có hiệu lực. Tất cả dữ liệu và quyết định là demo.

## Model và quy tắc
- Schema 4, giữ key b2b-demo-v1. Migration 1 → 3 → 4 giữ ID, tồn, ảnh, đơn; thêm profiles, qualityReviews, claims, demoNow. Hồ sơ/lô cũ được grandfathered với nhãn “Demo cũ — chưa thẩm định”, không tạo chứng nhận hoặc Yield. Chỉ giữ quyền chuyển tiếp khi trạng thái hồ sơ còn DRAFT và chưa nộp; nộp duyệt lần đầu chấm dứt quyền này.
- BusinessProfile: id (entity ID), role CUSTOMER/SUPPLIER, businessName, phone, taxCode, contactName, address, capacityKg?, certificateImage?, vietGapImage?, status DRAFT/PENDING/APPROVED/REJECTED, legacy, rejectionReason?, submittedAt?, reviewedAt?. Chỉnh hồ sơ đã nộp đưa về DRAFT và chặn giao dịch mới; không chặn xử lý đơn cũ.
- QualityReview: productId, supplierId, grade A/B, yieldPercent?, brix?, status PENDING/APPROVED/REJECTED, revision, note?, submittedAt, reviewedAt?. Yield (0,100] bắt buộc khi duyệt, Brix tùy chọn [0,100]. Sửa QC luôn tạo revision chờ duyệt. Snapshot QC đã duyệt vào OrderItem.qcSnapshot. Không suy diễn QC cho lịch sử.
- Claim: id, orderId, customerId, supplierId, lines [{productId,quantityKg}], reason, images (0–3 raster data URL đã nén, mỗi ảnh ≤450000 ký tự), status OPEN/RESPONDED/APPROVED/REJECTED, submittedAt, response?, approvedLines?, refundVnd?, decisionNote?, decidedAt?. Một hồ sơ đang mở trên mỗi order/supplier. Admin duyệt từng kg không vượt yêu cầu; cộng kg OPEN/RESPONDED/APPROVED không vượt kg mua. Không nhận video; không hoàn ship/hoàn tồn/đổi hàng.
- Order.deliveredAt? ghi khi mô phỏng giao thành công; đơn cũ thiếu mốc này không khiếu nại hồi tố. Hạn gửi < deliveredAt + 2 giờ; SLA cảnh báo >= submittedAt + 2 giờ, không tự quyết định.
- demoNow ISO lưu trong store, chỉ tiến bằng advanceDemoClock(minutes), không tự điều phối. True-Cost chỉ dùng QC APPROVED, giá/(Yield/100), usableKg=kg*Yield/100; so sánh cùng commodityId.
- Đăng ký/đăng nhập chỉ SĐT 10 chữ số + OTP demo 000000. Không đăng ký Admin; role selector vẫn có để thuyết trình. Service xác thực actor bằng session đang chọn cho hồ sơ/QC/khiếu nại/duyệt; đây không phải bảo mật backend.
- Pending có thể tạo/sửa lô nháp, không mở bán. Catalog và quote/place chặn owner chưa duyệt và QC chưa duyệt, trừ quyền legacy rõ ràng. Giá thay đổi không đổi QC hay snapshot cũ.

## API bổ sung (async, phát DATA_CHANGED/SESSION_CHANGED)
- registerDemoBusiness({role,phone,otp}): BusinessProfile; loginDemo({role,phone,otp}): DemoSession.
- getBusinessProfiles(): BusinessProfile[]; saveBusinessProfile({id,changes}): BusinessProfile; submitBusinessProfile(id): BusinessProfile; reviewBusinessProfile({id,approved,note}): BusinessProfile.
- getQualityReviews(): QualityReview[]; submitProductQC({productId,grade,yieldPercent?,brix?}): QualityReview; reviewProductQC({productId,approved,note}): QualityReview.
- getClaims(): Claim[] (Admin tất cả, NCC/khách chỉ của mình); submitClaim({orderId,supplierId,lines,reason,images}): Claim; respondToClaim({claimId,response}): Claim; decideClaim({claimId,approved,lines?,note}): Claim.
- getDemoClock(): string; advanceDemoClock(minutes): string (Admin); calculateTrueCost(pricePerKg,quantityKg,qc?): {costPerUsableKg,usableKg}|null.

Các API v3 giữ tên. Validation/storage failure không công bố draft, không ghi đè bản lưu cũ. Reset khôi phục seed cùng schema; legacy seed không có QC/chứng nhận bịa.
