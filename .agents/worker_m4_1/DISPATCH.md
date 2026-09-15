# DISPATCH — Worker M4 (Integration, Parity, Regression Testing & Git Commit)

You are Worker M4 (`worker_m4_1`).
Your working directory is: `d:\streetalk\.agents\worker_m4_1`
Project root: `d:\streetalk`

## Mandatory Requirements
You MUST read `d:\streetalk\.agents\ORIGINAL_REQUEST.md` before starting work.
You MUST read `d:\streetalk\AGENTS.md` for local constraints.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective & Scope: Milestone 4 (A1-A7 Acceptance & Integration)
1. **Production Build**:
   - Run `npm run build` to ensure `public/utilities.css` and `public/app.min.js` are cleanly built and up-to-date.
2. **100% SHA256 Parity Audit**:
   - Verify byte-for-byte SHA256 parity between:
     - `index.html` <-> `public/index.html`
     - `incrocio.css` <-> `public/incrocio.css`
     - `street-editorial.css` <-> `public/street-editorial.css`
     - `assets/logo-streetalk.png` <-> `public/assets/logo-streetalk.png`
   - If any pair has diverged, synchronize them immediately and re-verify.
3. **Full Test Suite Execution**:
   - Run `node tests/autonomous-suite.js` (and `npm test`).
   - Confirm 100% pass (0 failures, exit code 0, >= 124 tests).
4. **Local Git Commit**:
   - Strictly follow AGENTS.md: Local development only; DO NOT push to remote, DO NOT open remote PRs, DO NOT touch cloud services.
   - Run `git status`.
   - Stage modified and untracked assets/files (`git add .` or specific files).
   - Create a clean, descriptive local git commit on main:
     `git commit -m "feat: complete Milestones 1-4 (R1-R6, A1-A7) with 100% parity and test pass"`
   - Verify with `git log -n 1` and `git status`.
5. **Handoff Report**:
   - Document all verification commands, output, SHA256 hashes, test count, git commit hash, and summary of A1-A7 criteria in `d:\streetalk\.agents\worker_m4_1\handoff.md`.
   - Report back via `send_message`.
