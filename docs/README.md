# B2B Fruit Distribution — Agent Docs

> Mục tiêu: prototype FE tương tác để quay demo cuộc thi ý tưởng; **không có database/backend thật**.

## Thứ tự đọc (bắt buộc cho cả hai agent)
1. [01-product-mvp.md](01-product-mvp.md) — phạm vi sản phẩm, phân hệ, ưu tiên demo.
2. [02-business-workflows.md](02-business-workflows.md) — nghiệp vụ theo mốc thời gian và các trạng thái.
3. [03-data-api-contract.md](03-data-api-contract.md) — **hợp đồng tích hợp bắt buộc** giữa UI và mock logic.
4. [04-agent-collaboration.md](04-agent-collaboration.md) — quyền sở hữu file, Git, tiêu chuẩn bàn giao.
5. [05-demo-acceptance.md](05-demo-acceptance.md) — kịch bản quay và tiêu chí nghiệm thu.

## Đợt chỉnh sửa FARMGO tháng 10/2026

- [06-farmgo-approved-scope.md](06-farmgo-approved-scope.md) — hướng và thứ tự triển khai đã được người dùng duyệt ngày 23/10/2026.
- [07-data-api-contract-v3-draft.md](07-data-api-contract-v3-draft.md) — đề xuất kỹ thuật cho đợt 2, chưa thay thế contract v2.
- Contract v3 đã được duyệt triển khai ngày 23/10/2026 tại `03-data-api-contract.md`; mục 8 chốt tên types/API và migration. Bản v2 được lưu tại `03-data-api-contract-v2-archive.md`. File 07 giữ lịch sử đề xuất, không phải contract chạy.

## Tính chính xác của đặc tả
- **[SOURCE]**: trực tiếp từ `trái cây.md` do nhóm cung cấp.
- **[PROPOSAL]**: giả định/giải pháp kỹ thuật đề xuất cho prototype; chưa được nhóm duyệt.
- **[TBD]**: chưa được tài liệu nguồn xác định; tuyệt đối không mặc định là chính sách thực tế.

## Tình trạng code
- Stack đã thống nhất: React + Vite + TypeScript.
- Git main: `E:\\PROJECT\\B2B`; UI branch/worktree: `agent/frontend` / `E:\\PROJECT\\B2B-Frontend`; logic branch/worktree: `agent/workflow` / `E:\\PROJECT\\B2B-Workflow`.
- Hai worktree tách biệt; đồng bộ thông qua commit/merge sau review; **không** tự động merge/push lên main.
- Không dùng API thực, OTP thật, bản đồ GPS thật, thanh toán thật, hãng vận chuyển thật khi quay demo.

## Cách tích hợp
1. Chốt file `03-data-api-contract.md` trên `main` **trước khi hai agent code**.
2. Antigravity dựng UI theo tên types/hàm trong contract; Codex hiện thực types, store, mocks, services đúng contract.
3. Cả hai báo cáo thay đổi và chạy kiểm tra `npm run build`.
4. Người tích hợp merge tuần tự các branch vào `main`, xử lý conflict và chạy toàn bộ happy-path.

Nguồn nghiệp vụ: file `trái cây.md` được cung cấp trong cuộc trò chuyện. Bản sao đưa kèm tại `docs/source-trai-cay.md` để hai agent đọc offline.
