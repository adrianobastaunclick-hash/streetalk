# Task Assignment: M7 E2E Automated Test Suite (TEST 20-25)

## Objective
Implement comprehensive automated end-to-end and unit tests (TEST 20 through TEST 25) in `tests/autonomous-suite.js` verifying all R1-R6 features and ensuring `npm test` passes 100% with zero regressions.

## Inputs & Context
- Authoritative requirements: `d:\streetalk\ORIGINAL_REQUEST.md`
- Test infrastructure design: `d:\streetalk\TEST_INFRA.md`
- Assets explorer report: `d:\streetalk\.agents\explorer_survey_assets_tests\handoff.md`
- Backend implementation handoff: `d:\streetalk\.agents\worker_m3_backend\handoff.md`
- Frontend integration handoff: `d:\streetalk\.agents\worker_frontend_integration\handoff.md`
- Operational rules: `d:\streetalk\AGENTS.md`

## Exclusive File Ownership
- `tests/autonomous-suite.js`
Do NOT edit any other files.

## Detailed Requirements
Add TEST 20 through TEST 25 to `tests/autonomous-suite.js`:
1. **TEST 20: R1 Quick Reactions & Web Audio Realtime Bursts**:
   - Verify all 12 emoji buttons exist in `index.html` and `public/index.html`.
   - Verify `SoundEngine.playReaction` in `frontend/app.js` synthesizes Web Audio tones and no `.mp3`, `.wav`, or `.ogg` is referenced.
   - Connect paired virtual sockets: emit `send_reaction` with each of the 4 new emojis (`💖`, `💋`, `😈`, `🌹`) and verify `receive_reaction` is broadcast to partner.
   - Negative check: Emit disallowed emoji (e.g. `'🍕'`) -> verify no reaction broadcast occurs.
2. **TEST 21: R2 GIF Multi-Category Catalog & Fallback Diversity**:
   - Query `GET /api/gifs/categories?all=true` or default -> assert categories `flirt`, `amore`, `spicy` are available.
   - Verify all 13 new SVGs exist on disk in both `assets/gifs/` and `public/assets/gifs/` and are byte-for-byte identical.
   - Verify `frontend/app.js` contains `CATEGORY_FALLBACK_MAP` and does not use unconditional `img.src = '/assets/gifs/flame.svg'`.
   - Ensure TEST 19.2 in `tests/autonomous-suite.js` cleanly passes (update expectation to accommodate expanded categories if needed).
3. **TEST 22: R3 Chat Sidebar Hub & Bilateral Friend Request Protocol**:
   - Connect paired sockets:
     - Peer A emits `send_friend_request` -> Peer B receives `friend_request_received`.
     - Peer B emits `send_friend_request` -> both receive `friend_request_matched` / `friendship_unlocked` with partner profile details.
     - Peer A emits `share_friend_contact` with handle -> Peer B receives `friend_contact_received`.
   - Verify room teardown clears `room.friendRequests` and `room.friendSocials` with zero memory leaks.
4. **TEST 23: R4 Street Karma & Connections Address Book Audit**:
   - Test Street Karma calculation logic and verify DOM elements `#profile-karma-display`, `#profile-founder-badge`, and `#connections-address-book` exist in `index.html` and `public/index.html`.
5. **TEST 24: R5 Bacheca Thematic Groups & Hybrid Authorization**:
   - Sub-test A: User with Founder Badge (`qualification: { isFounder: true }`) creates group -> HTTP 201 Created.
   - Sub-test B: User with high Karma (`qualification: { karmaScore: 100, strikeCount: 0 }`) creates group -> HTTP 201 Created.
   - Sub-test C: Unqualified user (`qualification: { karmaScore: 20, isFounder: false }`) -> HTTP 403 `NOT_QUALIFIED`.
   - Sub-test D: User with strikes (`qualification: { karmaScore: 100, strikeCount: 1 }`) -> HTTP 403 `NOT_QUALIFIED`.
   - Sub-test E: `GET /api/groups` returns the created groups.
6. **TEST 25: R6 Founder Badge Monetization & Free Chat Invariance**:
   - Verify `#modal-founder-badge` exists in `index.html` and `public/index.html` with the 4 benefit descriptors.
   - Verify `POST /api/founder/unlock` returns `{ ok: true, status: 'unlocked', badge: 'FONDATORE' }`.
   - Free Chat Invariance: Verify matchmaking queue (`join_queue`), chat messages, timer, and extension remain 100% accessible to non-founders without restrictions.
7. **Verification**:
   - Run `npm test` and verify that ALL 25 suites pass with 100% pass rate (0 failures).

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-14T21:38:20Z
Received dispatch request from orchestrator:
You are the E2E Test Writer.
Your working directory is: d:\streetalk\.agents\worker_e2e_tests
Workspace root: d:\streetalk
MANDATORY FIRST STEP: Read d:\streetalk\ORIGINAL_REQUEST.md and d:\streetalk\AGENTS.md before starting.
Also read your assignment in: d:\streetalk\.agents\worker_e2e_tests\DISPATCH.md
And reference:
- d:\streetalk\TEST_INFRA.md
- d:\streetalk\.agents\explorer_survey_assets_tests\handoff.md
- d:\streetalk\.agents\worker_m3_backend\handoff.md
- d:\streetalk\.agents\worker_frontend_integration\handoff.md
- d:\streetalk\PROJECT.md

Exclusive file ownership:
- tests/autonomous-suite.js
Do NOT modify any implementation code in server.js or frontend/!

Your mission:
Add TEST 20 through TEST 25 to tests/autonomous-suite.js:
1. TEST 20: R1 Quick Reactions & Web Audio Realtime Bursts
2. TEST 21: R2 GIF Multi-Category Catalog & Fallback Diversity
3. TEST 22: R3 Chat Sidebar Hub & Bilateral Friend Request Protocol
4. TEST 23: R4 Street Karma & Connections Address Book Audit
5. TEST 24: R5 Bacheca Thematic Groups & Hybrid Authorization
6. TEST 25: R6 Founder Badge Monetization & Free Chat Invariance
