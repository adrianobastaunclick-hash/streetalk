# Task Assignment: M3 Realtime Backend & Socket Contracts

## Objective
Implement all backend contracts and event handling in `server.js` and `lib/gif-provider.js` for R1, R2, R3, R4, R5, R6.

## Inputs & Context
- Authoritative requirements: `d:\streetalk\ORIGINAL_REQUEST.md`
- Project specification: `d:\streetalk\PROJECT.md`
- Realtime explorer report: `d:\streetalk\.agents\explorer_survey_realtime\handoff.md`
- Operational rules: `d:\streetalk\AGENTS.md`

## Exclusive File Ownership
- `server.js`
- `lib/gif-provider.js`
Do NOT edit any other files.

## Detailed Requirements
1. **R1 Emojis Expansion**:
   - In `server.js:1128`, expand `allowedEmojis` to include all 12 emojis:
     `['🔥', '💀', '⚡', '🖤', '🚬', '👀', '🤯', '👏', '💖', '💋', '😈', '🌹']`.
2. **R2 GIF Engine & Categories in `lib/gif-provider.js`**:
   - Add categories `flirt`, `amore`, `spicy` (in addition to existing 9 categories).
   - Populate catalogs with distinct animated SVG cards (`kiss.svg`, `heart_pulse.svg`, `chili.svg`, etc.).
   - In `resolveUrl`, ensure relative URLs are returned without prepending `http://localhost:3000`.
3. **R3 Bilateral Friend Request Socket Flow**:
   - In `createRoom`, initialize `room.friendRequests = new Set()` and `room.friendSocials = new Map()`.
   - Add socket handler `send_friend_request` (or `request_friendship`):
     - Validates socket is in room.
     - Adds `socket.id` to `room.friendRequests`.
     - If size === 1: emits `friend_request_received` to partner (`socket.to(room.id).emit('friend_request_received', { from: socket.id })`).
     - If size >= 2: emits `friend_request_matched` (or `friendship_unlocked`) to room participants with partner profile details.
   - Add socket handler `share_friend_contact`:
     - Allowed ONLY if `room.friendRequests.size >= 2`.
     - Sanitizes handle/platform and relays `friend_contact_received` to partner.
   - In `destroyRoom`: clean `room.friendRequests.clear()` and `room.friendSocials.clear()`.
4. **R4 & R5 Thematic Groups & Hybrid Authorization**:
   - In `server.js`, maintain volatile in-memory registry `thematicGroups = new Map()` seeded with 3 underground tables ("Musica Notturna", "Confessioni Relazioni", "Dibattito Filosofico").
   - Add endpoint `GET /api/groups`: returns list of thematic groups.
   - Add endpoint `POST /api/groups`: validates title & description with XSS safety, checks hybrid qualification:
     Creator is qualified if: `qualification.isFounder === true || (qualification.karmaScore >= 150 && streetBot.getStrikes(clientIp) === 0)`.
     If qualified: adds group and returns HTTP 201 `{ ok: true, group }`.
     If not qualified: returns HTTP 403 `{ ok: false, code: 'NOT_QUALIFIED', error: 'Creazione riservata a utenti con Badge Fondatore o Street Karma elevato senza infrazioni.' }`.
5. **R6 Founder Badge Support**:
   - In `validateJoinPayload`, extract and sanitize `isFounder: Boolean(payload.profile && payload.profile.isFounder)`.
   - In `createRoom`, include `isFounder` in partnerProfile payload emitted in `match_found`.
   - Add simulation endpoint `POST /api/founder/unlock`: returns `{ ok: true, status: 'unlocked', badge: 'FONDATORE' }`.
6. **Testing & Verification**:
   - Run `npm test` and verify that all 99 existing tests pass with 0 failures!

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-14T21:09:19Z
You are the Worker for M3 (Realtime Backend & Socket Contracts).
Your working directory is: d:\streetalk\.agents\worker_m3_backend
Workspace root: d:\streetalk

MANDATORY FIRST STEP: Read d:\streetalk\ORIGINAL_REQUEST.md and d:\streetalk\AGENTS.md before starting.
Also read your assignment in: d:\streetalk\.agents\worker_m3_backend\DISPATCH.md
And reference: d:\streetalk\.agents\explorer_survey_realtime\handoff.md and d:\streetalk\PROJECT.md

Exclusive file ownership:
- server.js
- lib/gif-provider.js
Do NOT touch any other files.

Your mission:
Implement backend contracts for R1-R6 in server.js and lib/gif-provider.js:
1. Expand allowedEmojis to all 12 emojis (including 💖, 💋, 😈, 🌹).
2. Add flirt, amore, spicy categories to lib/gif-provider.js with distinct SVG items, fix relative URL resolution.
3. Add bilateral friend request double-consensus flow: room.friendRequests, room.friendSocials, socket events send_friend_request, friend_request_received, friend_request_matched, share_friend_contact, friend_contact_received, clean deallocation in destroyRoom.
4. Add in-memory thematicGroups registry, GET /api/groups and POST /api/groups with hybrid qualification check (isFounder || karmaScore >= 150 & 0 strikes).
5. Add founder simulation endpoint POST /api/founder/unlock and parse isFounder in validateJoinPayload, passing to match_found.
6. Run npm test to verify all 99 existing tests pass with 0 failures!

