# E2E Test Infra: STREETALK Social Evolution

## Test Philosophy
- Opaque-box, requirement-driven.
- Automated validation via `npm test` (`node tests/autonomous-suite.js`).
- 100% pass rate requirement with zero regressions across the 19 existing test suites.
- Strict byte-for-byte parity assertion between root files and `public/`.

## Feature Inventory & Test Mapping
| # | Feature | Requirement | Test Suite in autonomous-suite.js |
|---|---------|-------------|-----------------------------------|
| 1 | R1: Quick Reaction Strip | ORIGINAL_REQUEST §R1 | TEST 20: 12-emoji socket broadcast, Web Audio param check, disallowed emoji rejection |
| 2 | R2: GIF Engine & Multi-category | ORIGINAL_REQUEST §R2 | TEST 21: Categories check, SVG assets existence in assets/ & public/, fallback matrix check |
| 3 | R3: Sidebar Hub & Friend Request | ORIGINAL_REQUEST §R3 | TEST 22: Bilateral double-consensus socket flow, optional social contact exchange |
| 4 | R4: Profile & Connections Book | ORIGINAL_REQUEST §R4 | TEST 23: Street Karma HUD calculation audit, localStorage connections schema |
| 5 | R5: Bacheca Thematic Groups | ORIGINAL_REQUEST §R5 | TEST 24: Hybrid authorization check (Founder OR Karma>=150 & 0 strikes), REST endpoints |
| 6 | R6: Founder Badge Monetization | ORIGINAL_REQUEST §R6 | TEST 25: Modal benefit verification, simulate unlock endpoint, free 1v1 chat invariance |

## Coverage Thresholds
- All 19 existing suites pass (99 tests).
- All 6 new suites pass (TEST 20 to 25).
- Total tests: >= 115 tests passed, 0 failed.
- Execution time: < 20s.
- Byte-for-byte parity: `index.html` ↔ `public/index.html`, `incrocio.css` ↔ `public/incrocio.css`, all `assets/gifs/*.svg` ↔ `public/assets/gifs/*.svg`.
