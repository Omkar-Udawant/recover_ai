# Engineering Journal

## Log Entries

### [RecoverAI — UI/UX Overhaul & Tech Stack Modernization] 2026-09-05
- Re-architected root `/` into a pristine Product Overview with live Expected-Value Gate Simulator, formula playground, and 6-stage DAG breakdown (shadcn components, Plus Jakarta Sans, JetBrains Mono, 0 emojis).
- Dedicated `/cases` to the Case Ledger Workbench with 220px collapsible sidebar, 44px dock, and 440px side split inspector (`WorkbenchInspector`).
- Dedicated `/dashboard` to the Financial Velocity Terminal with honesty metrics banner, minimal StatCards, and Bounded Batch Cockpit.
- Dedicated `/policy` to the Mathematical Invariant Matrix and runtime PostgreSQL thresholds.
- Re-architected `Badge` into Monospace Micro-Tags with sharp 3px corners, neutral background, 1px hairline border, and 4px semantic status pips (`settled`, `inflight`, `refused`, `pending`).
- Upgraded `CaseTable` with active row selection highlighting, tabular figures, and monospace channel tags.
- Purged 600+ lines of obsolete legacy code (`case-inspection-drawer.tsx`).
- Enhanced `api-client.ts` with auto-bootstrapping demo authentication for seamless zero-friction local developer experience.
- Resolved CI failure `verify / backend` by supplying missing `backend/README.md` required by hatchling and configuring demo test fixtures in `backend/tests/conftest.py`.
- Resolved CI failure `verify / frontend` by upgrading workflow to `npm install --legacy-peer-deps` to handle React 19 / Recharts peer dependencies and verifying `npx tsc --noEmit` with 0 errors.
- Created and pushed branch `fix/ci-verification-and-developer-workbench` to remote `origin` with direct GitHub Pull Request URL.
- Verified 0 emojis across all code and commit messages.

