# Task Assignment: Frontend Remediation (DOM ID Synchronization in frontend/app.js)

## 2026-09-14T21:52:15Z

## Objective
Fix the 7 desynchronized DOM IDs and hidden row classes in `frontend/app.js` for R3 friend request drawer and sidebar partner details, and rebuild `public/app.min.js`.

## Inputs & Context
- Reviewer 1 handoff report: `d:\streetalk\.agents\reviewer_frontend_assets\handoff.md`
- Defect reproduction script: `d:\streetalk\.agents\reviewer_frontend_assets\reproduce_defect.js`
- Target file: `frontend/app.js`
- Build script: `npm run build`
- Operational rules: `d:\streetalk\AGENTS.md`

## Exclusive File Ownership
- `frontend/app.js`
- `public/app.min.js` (via `npm run build`)
Do NOT touch `index.html`, `server.js`, or other files.

## Detailed Requirements
In `frontend/app.js`:
1. In `updateFriendRequestUI()` and `resetFriendRequestUI()`:
   Use `document.getElementById('friend-request-unlocked-drawer') || document.getElementById('friend-unlocked-drawer')`.
2. In `shareFriendSocial()`:
   Use `document.getElementById('friend-social-handle') || document.getElementById('friend-social-handle-input')`.
3. In `onFriendContactReceived()` and `resetFriendRequestUI()`:
   Use `document.getElementById('friend-partner-social-received') || document.getElementById('friend-partner-social-box')`.
   Use `document.getElementById('friend-partner-social-text') || document.getElementById('friend-partner-social-handle')`.
4. In `launchChatPreview()` (lines ~1489-1495) and `match_found` handler (lines ~4448-4454):
   - Check both:
     `const mottoText = document.getElementById('chat-partner-motto-text') || document.getElementById('chat-partner-motto');`
     `const topicsText = document.getElementById('chat-partner-topics-text') || document.getElementById('chat-partner-topics');`
     `const avoidsText = document.getElementById('chat-partner-avoids-text') || document.getElementById('chat-partner-avoids');`
   - When text is populated, unhide parent rows if present:
     `const mottoRow = document.getElementById('chat-partner-motto-row'); if (mottoRow && mottoVal) mottoRow.classList.remove('hidden');`
     `const topicsRow = document.getElementById('chat-partner-topics-row'); if (topicsRow && topicsVal) topicsRow.classList.remove('hidden');`
     `const avoidsRow = document.getElementById('chat-partner-avoids-row'); if (avoidsRow && avoidsVal) avoidsRow.classList.remove('hidden');`
5. Run `npm run build` to update `public/app.min.js`.
6. Run `node .agents/reviewer_frontend_assets/reproduce_defect.js` and verify it exits cleanly with all IDs reporting `EXISTS`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
