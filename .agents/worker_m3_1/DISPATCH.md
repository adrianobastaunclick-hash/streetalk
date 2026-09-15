# DISPATCH — Worker M3 (Bacheca Gruppi a Tema & Founder Modal)

You are Worker M3 (`worker_m3_1`).
Your working directory is: `d:\streetalk\.agents\worker_m3_1`
Project root: `d:\streetalk`

## Mandatory Requirements
You MUST read `d:\streetalk\.agents\ORIGINAL_REQUEST.md` before starting work.
You MUST also read the Explorer 3 survey report at `d:\streetalk\.agents\teamwork_preview_explorer_survey_3\handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective & Scope: Milestone 3 (R5)
1. **R5: Bacheca Gruppi a Tema & Founder Modal**:
   - In `index.html` and `public/index.html`:
     - Ensure the "+ CREA GRUPPO A TEMA" button in `#bacheca-groups-container` has `id="btn-bacheca-create-group"` and `onclick="openCreateGroupModal()"`.
     - Ensure `#modal-founder-badge` displays the €2.99 price and 4 benefit cards (`Badge Oro & Neon Visibile`, `Apertura Illimitata Gruppi a Tema`, `Reazioni & GIF Esclusive VIP`, `Priorità Coda Radar`) with the unlock button `onclick="unlockFounderBadge()"`.
     - Ensure `#modal-create-group` form `#create-group-form` has inputs for title, category, and description.
     - Crucial: Maintain 100% byte-for-byte SHA256 parity between `index.html` and `public/index.html`.
   - In `frontend/app.js` and `public/app.min.js`:
     - In `openCreateGroupModal()`:
       Check qualification: `isFounderUser() || (getStreetKarma() >= 100 && getBotStrikes() === 0)`.
       If NOT qualified, open the Founder Badge modal via `openFounderBadgeModal()`.
       If qualified, open `#modal-create-group`.
     - In `unlockFounderBadge()`:
       Execute simulated Stripe unlock via `POST /api/founder/unlock`.
       On success (or offline fallback), set `localStorage.setItem('streetalk_is_founder', 'true')`, update Karma HUD, close founder modal, and immediately open `#modal-create-group` so the user can proceed to create their group.
     - Ensure `loadThematicGroups()` properly fetches `GET /api/groups` and renders cards into `#bacheca-groups-grid`.
     - Ensure `submitCreateGroup()` properly POSTs to `/api/groups` with founder/karma qualification payload, toasts success, and refreshes the groups list.

2. **Build & Test**:
   - Run `npm run build` to compile `public/app.min.js` and CSS.
   - Run `node tests/autonomous-suite.js` (or `npm test`) and verify all tests pass (including TEST 24, TEST 25, and TEST 26).
   - Verify SHA256 parity between `index.html` and `public/index.html`.
   - Write your handoff report to `d:\streetalk\.agents\worker_m3_1\handoff.md` and report back via `send_message`.

## 2026-09-15T01:46:36Z
Implement Milestone 3:
1. R5: Bacheca Gruppi a Tema & Founder Modal flow.
   - Ensure + CREA GRUPPO A TEMA button has id="btn-bacheca-create-group" and onclick="openCreateGroupModal()".
   - In frontend/app.js (and public/app.min.js), in openCreateGroupModal(): check isFounderUser() || (getStreetKarma() >= 100 && getBotStrikes() === 0). If not qualified, open openFounderBadgeModal(). If qualified, open #modal-create-group.
   - In unlockFounderBadge(): call POST /api/founder/unlock, persist founder status, update Karma HUD, close founder modal, and open #modal-create-group.
   - In submitCreateGroup(): send POST /api/groups with qualification payload, handle 201 response, and refresh groups grid.
   - Maintain 100% byte-for-byte SHA256 parity between index.html and public/index.html.
2. Rebuild bundles via npm run build.
3. Run tests: node tests/autonomous-suite.js. Verify 100% pass across all tests.
4. Verify SHA256 parity for index.html / public/index.html.
5. Write your detailed handoff report to d:\streetalk\.agents\worker_m3_1\handoff.md and report back with send_message.
