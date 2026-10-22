# 04 — Collaboration & Git Integration Protocol

## Worktree ownership
| Agent | Worktree | Branch | Được sửa |
|---|---|---|---|
| Google Antigravity | `E:\PROJECT\B2B-Frontend` | `agent/frontend` | `src/pages/**`, `src/components/**`, `src/styles/**`, UI layout |
| OpenAI Codex | `E:\PROJECT\B2B-Workflow` | `agent/workflow` | `src/services/**`, `src/mocks/**`, `src/store/**`, `src/types/**` |
| Người tích hợp | `E:\PROJECT\B2B` | `main` | `src/App.tsx`, router, `package.json`, config, `docs/**`, `AGENTS.md` |

**Tạm thời không agent nào tự chỉnh `src/App.tsx`, `src/main.tsx`, router hay `package.json`** khi chạy song song. Antigravity chỉ tạo pages/components có export rõ; Codex chỉ tạo services/types/store có export rõ. Người tích hợp làm wiring vào App.tsx. Nếu Antigravity cần dependency ngoài, ghi tên/version mong muốn trong bàn giao, không tự cài cùng lúc gây xung đột lockfile.

## Trình tự thực hiện
1. **Phase 0 (người tích hợp):** đưa `docs/` và `AGENTS.md` lên `main`, sau đó merge `main` vào cả hai worktree. Nếu contract chưa được chấp thuận, dừng triển khai code.
2. **Phase 1 (Codex):** triển khai `types`, seed, service. Commit; cung cấp ví dụ sử dụng từ UI. Có thể làm đồng thời với Phase 1 của Antigravity nếu export đã chốt.
3. **Phase 1 (Antigravity):** tạo giao diện theo route mapping dự kiến, import hàm từ hợp đồng (hoặc nhận dependency tạm qua props), không tạo fake service riêng song song.
4. **Phase 2 (người tích hợp):** merge một nhánh một lần, kết nối App/router. Chạy `npm install`, `npm run build`, smoke test.
5. **Phase 3 (hai agent theo phạm vi):** sửa lỗi phát hiện sau tích hợp trên nhánh riêng, không sửa trên `main`.

## Giao diện đề xuất để tích hợp
**[PROPOSAL]** Antigravity xuất các root component như `SupplierDashboard`, `CustomerMarketplace`, `AdminDashboard`; nhận `onNavigate` hoặc sử dụng router đã được người tích hợp phê duyệt. Không tự phát minh giả lập riêng khi thiếu service; có thể làm component presentational thuần props trước.

## Git commands dùng sau mỗi lần hoàn thành
```powershell
# chạy trong worktree của agent
npm run build
git status
git add src
git commit -m "feat: <task>"

# chỉ người tích hợp chạy tại E:\PROJECT\B2B khi 2 agent tạm dừng chỉnh sửa
git status
git merge agent/workflow
git merge agent/frontend
npm install
npm run build
npm run dev
```
Nếu merge báo conflict: **không** dùng `git reset --hard`, `git clean -fd`, `git push --force` hay `-X ours/theirs` để che xung đột; đọc từng file, giải quyết thủ công, build/test rồi mới commit. Không tự động push mà chưa được chủ dự án chấp thuận.

## Báo cáo bàn giao (bắt buộc)
Agent phải trả: (1) việc đã làm, (2) danh sách file thay đổi, (3) commands kiểm thử và kết quả, (4) dependencies mới (nếu có), (5) các điểm chưa làm/known issues, (6) commit hash. Không tuyên bố tích hợp thành công khi chưa chạy trong `main`.

## Tại sao không cần MCP ngay?
MCP nếu có chỉ giúp kết nối công cụ và trao đổi dữ liệu. Nó không thay thế Git để cô lập file, code review hay kiểm thử; hiện cấu hình hai worktree là đủ cho vòng demo đầu tiên.
