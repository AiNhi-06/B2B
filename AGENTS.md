# B2B Prototype — Agent Instructions

Read `docs/README.md` and its linked documents **before making changes**. `docs/03-data-api-contract.md` is the integration contract. Business details from the source file are authoritative; any `[PROPOSAL]` is provisional, `[TBD]` is unresolved.

## Goal
Build a React/Vite/TypeScript **mock-only** B2B fruit distribution prototype for an innovation contest demo. No actual backend, DB, OTP, payments, GPS or logistics integration. Keep all simulated behavior visibly labeled.

## Roles
- Antigravity: **UI only**, `agent/frontend`, `src/pages/`, `src/components/`, `src/styles/`.
- Codex: **mock logic only**, `agent/workflow`, `src/services/`, `src/mocks/`, `src/store/`, `src/types/`.
- Integrator: shared `src/App.tsx`, `src/main.tsx`, router, `package.json`, configs, documentation and merging to `main`.

Do not edit shared integration files or another agent's folders without explicit coordination. Commit only on your branch, do not merge or push main. Preserve API names from contract; report required contract changes instead of silently diverging. Run `npm run build` where feasible. Report files changed, tests, limitations, and commit hash. Never discard anyone else's changes.
