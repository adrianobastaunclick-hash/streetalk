# DISPATCH — Reviewer M3 (Bacheca Gruppi a Tema & Founder Modal)

You are Reviewer M3 (`reviewer_m3_1`).
Your working directory is: `d:\streetalk\.agents\reviewer_m3_1`
Project root: `d:\streetalk`

## Mandatory Requirements
You MUST read `d:\streetalk\.agents\ORIGINAL_REQUEST.md` before starting your review.
Read Worker M3's handoff report at: `d:\streetalk\.agents\worker_m3_1\handoff.md`

## Review Scope: Milestone 3 (R5)
1. **R5 (Bacheca Gruppi a Tema & Founder Modal Flow)**:
   - Verify `index.html` and `public/index.html`:
     - Does "+ CREA GRUPPO A TEMA" have `id="btn-bacheca-create-group"` and `onclick="openCreateGroupModal()"`?
     - Does `#modal-founder-badge` show €2.99 and 4 benefits?
     - Does `#modal-create-group` have `#create-group-form`?
   - Verify `frontend/app.js` and `public/app.min.js`:
     - Does `openCreateGroupModal()` check `isFounderUser() || (getStreetKarma() >= 100 && getBotStrikes() === 0)`?
     - If not qualified, does it route to `openFounderBadgeModal()`?
     - In `unlockFounderBadge()`, does it unlock founder status and immediately open `#modal-create-group`?
     - Does `submitCreateGroup()` post to `/api/groups` and reload groups?
2. **Parity & Tests**:
   - Verify SHA256 parity between `index.html` and `public/index.html`.
   - Run `node tests/autonomous-suite.js` (or `npm test`) to confirm all tests pass (including TEST 24, TEST 25, TEST 26, TEST 27).
   - Verify that TEST 27 is genuine and test assertions are authentic.
3. **Verdict**:
   - Write your review findings and explicit verdict (`APPROVE` or `REQUEST_CHANGES`) in `d:\streetalk\.agents\reviewer_m3_1\handoff.md`.

## 2026-09-14T23:51:43Z
<USER_REQUEST>
You are Reviewer M3 (reviewer_m3_1).
Your working directory is: d:\streetalk\.agents\reviewer_m3_1
Project root: d:\streetalk

Read your dispatch instructions at: d:\streetalk\.agents\reviewer_m3_1\DISPATCH.md
Read the user request at: d:\streetalk\.agents\ORIGINAL_REQUEST.md
Read Worker M3's handoff at: d:\streetalk\.agents\worker_m3_1\handoff.md

Perform a thorough code review and test verification of Milestone 3:
1. R5: Bacheca Gruppi a Tema & Founder Modal flow. Check #btn-bacheca-create-group in index.html & public/index.html, openCreateGroupModal() qualification check (Founder or Karma >= 100 with 0 strikes), routing to openFounderBadgeModal() with €2.99 and 4 benefits, simulated unlock in unlockFounderBadge() opening #modal-create-group, and submitCreateGroup() POSTing to /api/groups.
2. Parity: Byte-for-byte SHA256 parity between index.html and public/index.html.
3. Tests: Run node tests/autonomous-suite.js (including TEST 27). Verify 100% pass and no integrity issues.

Write your review report and explicit verdict (APPROVE or REQUEST_CHANGES) to d:\streetalk\.agents\reviewer_m3_1\handoff.md and report back with send_message.
</USER_REQUEST>
