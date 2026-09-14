# Handoff Report: Realtime & Backend Survey (R1, R3, R4, R5, R6)

## 1. Observation

### 1.1 Codebase & Runtime Environment
- **Server Entrypoint**: `server.js` (1336 lines, CommonJS, Node.js, Express 4.19.2, Socket.IO 4.7.5).
- **Test Suite**: `npm test` executes `node tests/autonomous-suite.js`.
  - Command: `npm test`
  - Output: `AUDIT COMPLETE: 99 PASSED, 0 FAILED`.
- **Operating Rules & Policies**: `AGENTS.md` and `docs/LAUNCH_AUDIT.md` mandate zero persistence of private chat content or secrets, 180s/300s room lifecycles, no cloud data operations/migrations, and strict memory leak cleanup.

### 1.2 R1 Observation: `send_reaction` Event
- Location: `server.js:1118-1135`:
```javascript
  // 7. REALTIME REACTION (EMOJI BURST)
  socket.on('send_reaction', (payload) => {
    if (!checkRateLimit(socket)) return;
    if (!payload) return;
    const user = users.get(socket.id);
    if (!user || !user.roomId) return;

    const emoji = typeof payload === 'string' ? payload : payload.emoji;
    const roomId = (typeof payload === 'object' && payload.roomId) ? payload.roomId : user.roomId;

    if (!roomId || !emoji || user.roomId !== roomId) return;
    const allowedEmojis = ['🔥', '💀', '⚡', '🖤', '🚬', '👀', '🤯', '👏'];
    if (!allowedEmojis.includes(emoji)) return;

    io.to(roomId).emit('receive_reaction', {
      senderId: socket.id,
      emoji: emoji
    });
  });
```
- Test 8 in `tests/autonomous-suite.js:560-577` asserts:
```javascript
    pairA.emit('send_reaction', { roomId: targetRoomId, emoji: '⚡' });
    const reactionData = await reactionPromise;
    pairB.emit('send_reaction', '🔥');
    const rawReactionData = await rawReactionPromise;
    if (reactionData && reactionData.emoji === '⚡' && rawReactionData && rawReactionData.emoji === '🔥') {
      pass('Realtime emoji reaction burst delivered to partner (object and raw string formats)');
    }
```
- **Defect/Gap**: `server.js:1128` defines `allowedEmojis` with only 8 items. `ORIGINAL_REQUEST.md:13` specifies:
  "🔥, 💀, ⚡, 🖤, 🚬, 👀, 🤯, 👏 e nuove emoji flirt/amore: 💖, 💋, 😈, 🌹".
  Any reaction with `💖`, `💋`, `😈`, or `🌹` is silently rejected on line 1129.

### 1.3 R3 Observation: Bilateral Consensus & Room Lifecycle
- Current bilateral pattern in `server.js:1071-1105` (`request_extension` / `request_extend`):
```javascript
    room.extensions.add(socket.id);
    if (room.extensions.size >= 2) {
      room.extensionCount++;
      funnelMetrics.extensionsGranted++;
      room.timeRemaining += EXTENSION_TIME_SEC;
      room.extensions.clear();
      io.to(room.id).emit('extension_granted', {
        newTimeRemaining: room.timeRemaining,
        addedSeconds: EXTENSION_TIME_SEC
      });
    } else {
      socket.to(room.id).emit('extension_requested', {
        by: socket.id
      });
    }
```
- Room teardown in `server.js:744-781` (`destroyRoom`):
  - Increments `destroyedSecretsCount` and nullifies `secret1` and `secret2`.
  - Clears countdown interval `clearInterval(room.timerInterval)`.
  - Makes sockets leave room: `sock1.leave(roomId); sock2.leave(roomId);`.
  - Clears `room.extensions.clear()`, deletes room from `rooms.delete(roomId)`.
- Test 10 in `tests/autonomous-suite.js:612-632` verifies 100% volatile memory deallocation:
  `usersCount === 0`, `roomsCount === 0`, `queueCount === 0`, `rateLimitsCount === 0`, `reportCountsCount === 0`.
- **Gap**: Zero backend socket events or room fields currently exist for bilateral friend requests, partner notification, bilateral match, or optional social exchange.

### 1.4 R4 Observation: Moderation Penalties & StreetBot State
- In `lib/street-bot.js:8-238`, `StreetBot` tracks IP strikes in `this.strikesByIp`:
  - Strike 1: Warning, message blocked (`action: 'warn'`).
  - Strike 2: IP Jail 15 minutes (`action: 'jail'`, `this.JAIL_DURATION_MS = 15 * 60 * 1000`).
  - Strike 3: Permanent ban (`action: 'permaban'`).
  - Method `streetBot.getStrikes(ip)` exists on line 58.
  - Method `streetBot.isBanned(ip)` exists on line 50.
- **Gap**: Street Karma score is not currently computed or validated on the backend. A qualification check combining Street Karma score with `streetBot.getStrikes(ip) === 0` is missing.

### 1.5 R5 Observation: Thematic Groups Backend State
- `server.js` currently defines REST endpoints:
  - `GET /health`
  - `GET /api/stats`
  - `GET /api/supabase/status`
  - `GET /api/secrets` (HTTP 410 FEED_DISABLED)
  - `GET /api/gifs/categories`
  - `GET /api/gifs/providers`
  - `GET /api/gifs/trending`
  - `GET /api/gifs/search`
- **Gap**: No endpoints or data structures exist for `thematicGroups`. The Bacheca in `frontend/app.js:692-756` uses a hardcoded array `BACHECA_CONFESSIONS`.

### 1.6 R6 Observation: Profile Validation & Founder Badge
- In `server.js:258-300`, `validateJoinPayload` parses `payload.profile`:
  `moniker`, `avatar`, `bio`, `motto`, `vision`, `topics`, `avoids`.
- **Gap**: `validateJoinPayload` ignores `isFounder` / `founderBadge`. Consequently, `createRoom` in `server.js:683-691` does not pass `partnerProfile.isFounder` in `match_found`.

---

## 2. Logic Chain

1. **R1 Logic Chain**:
   - *Observation 1.2* shows `server.js:1128` restricts emojis to `['🔥', '💀', '⚡', '🖤', '🚬', '👀', '🤯', '👏']`.
   - *ORIGINAL_REQUEST.md:13* adds `💖`, `💋`, `😈`, `🌹`.
   - Modifying `allowedEmojis` in `server.js` to include the 4 new emojis immediately unblocks the realtime event.
   - Preserving the broadcast payload `{ senderId: socket.id, emoji: emoji }` guarantees existing tests (`autonomous-suite.js:572`) continue to pass with 100% compatibility.

2. **R3 Logic Chain**:
   - *Observation 1.3* shows `server.js` implements bilateral consensus for extensions using `room.extensions = new Set()`.
   - Applying the identical pattern to friend requests (`room.friendRequests = new Set()`) provides deterministic, race-condition-free double consensus.
   - When user A emits `send_friend_request`, user B receives `friend_request_received`.
   - When user B also emits `send_friend_request`, `room.friendRequests.size === 2`. The server emits `friend_request_matched` with partner profile details.
   - A subsequent `share_friend_contact` event is restricted to rooms where `room.friendRequests.size === 2`, preventing unsolicited contact spam.
   - In `destroyRoom`, calling `room.friendRequests.clear()` and `room.friendSocials.clear()` guarantees zero memory leaks, preserving *Observation 1.3* Test 10 compliance.

3. **R4 Logic Chain**:
   - *Observation 1.4* establishes that `streetBot.getStrikes(clientIp)` accurately records real-time moderation violations in RAM.
   - Street Karma calculation integrates:
     - Baseline: 100 pts.
     - Completed sessions: +5 pts.
     - Reactions received: +2 pts each.
     - Bilateral friendship formed: +25 pts.
     - Penalties: Strike 1 = -25 pts; Strike 2 = -100 pts; Strike 3 = -500 pts; User report = -50 pts.
   - High Street Karma threshold for group creation is defined as `karma >= 150` AND `streetBot.getStrikes(clientIp) === 0`.
   - Because `AGENTS.md` prohibits storing private chat data in Supabase, the user's Connections Book and Karma history belong in client storage (`localStorage`), with backend qualification checks verifying live IP strikes.

4. **R5 Logic Chain**:
   - *Observation 1.5* confirms `server.js` has no group endpoints.
   - Creating a volatile `thematicGroups = new Map()` in `server.js` populated with 3 curated underground discussion tables ("Musica Notturna", "Confessioni Relazioni", "Dibattito Filosofico") provides instant availability.
   - Implementing `GET /api/groups` and `POST /api/groups` provides the REST interface.
   - `POST /api/groups` validates qualification: checks if creator is Founder (`qualification.type === 'founder'`) OR has high Street Karma (`karmaScore >= 150` AND `streetBot.getStrikes(clientIp) === 0`).
   - Sockets can join group discussion streams via `join_group` / `leave_group` / `send_group_message` (filtered through `streetBot.analyze`).

5. **R6 Logic Chain**:
   - *Observation 1.6* shows `validateJoinPayload` does not extract `isFounder`.
   - Allowing `sanitizedIsFounder = Boolean(payload.profile.isFounder)` in `validateJoinPayload` enables `createRoom` to include `isFounder: partnerProfile.isFounder` in `match_found`.
   - This delivers the visual golden neon "FONDATORE" badge in the partner's sidebar without collecting or leaking any payment credentials, real names, or billing PII.
   - Simulated activation endpoint `POST /api/founder/unlock` provides an immediate verification pathway compatible with the local M0 scope defined in `AGENTS.md:52-54`.

---

## 3. Caveats

1. **No External Stripe / Payment Gateway**: In accordance with `AGENTS.md:52-54` (local scope only, no external APIs or cloud migrations), Founder Badge purchase is architected as a Stripe-ready simulation.
2. **Persistence Boundary**: In accordance with `AGENTS.md:27` and `LAUNCH_AUDIT.md` (PRIV-01), the Connections Book is stored in client `localStorage` (`streetalk_connections_v1`). No private contact details or chat secrets are written to Supabase.
3. **Ghost Socket Handling**: In `findMatch`, stale sockets are pruned from FIFO queues. Similarly, if a socket disconnects before bilateral friendship confirmation, pending requests must be discarded during room teardown.

---

## 4. Conclusion

The existing backend is robust, performant (99/99 tests passing), and follows strict zero-leak in-memory management. The 5 architectural additions require:

1. **R1**: Update `allowedEmojis` in `server.js:1128` to:
   `['🔥', '💀', '⚡', '🖤', '🚬', '👀', '🤯', '👏', '💖', '💋', '😈', '🌹']`.
2. **R3**: Add room fields `friendRequests: new Set()`, `friendSocials: new Map()`, socket handlers `send_friend_request` and `share_friend_contact`, and emit events `friend_request_received`, `friend_request_matched`, and `friend_contact_received`. Add explicit teardown in `destroyRoom`.
3. **R4**: Define Karma formula (100 base, +5 completed chat, +2 reaction, +25 bilateral match, -25 strike 1, -100 strike 2, -50 report). Enforce high-karma qualification via `streetBot.getStrikes(clientIp) === 0`.
4. **R5**: Implement in-memory `thematicGroups` in `server.js` with seed groups, `GET /api/groups`, and `POST /api/groups` with hybrid qualification check (Founder OR Karma >= 150 & strikes === 0).
5. **R6**: Update `validateJoinPayload` to accept `isFounder: boolean` in `profile`, pass to `match_found`, and provide `POST /api/founder/unlock` simulation.

---

## 5. Verification Method

### 5.1 Automated Regression Verification
Run the standard test suite:
```powershell
npm test
```
**Acceptance Criterion**: Must execute `tests/autonomous-suite.js` with 100% pass rate (99+ passed, 0 failed).

### 5.2 Unit Verification for New Features
Write or run test fixtures verifying:
1. `pairA.emit('send_reaction', { roomId, emoji: '💖' })` triggers `receive_reaction` with `emoji: '💖'` on `pairB`.
2. `pairA.emit('send_friend_request', { roomId })` triggers `friend_request_received` on `pairB`.
3. `pairB.emit('send_friend_request', { roomId })` triggers `friend_request_matched` on both `pairA` and `pairB`.
4. `pairA.emit('share_friend_contact', { roomId, socialType: 'telegram', contact: '@street_hacker' })` relays `friend_contact_received` to `pairB`.
5. `GET /api/groups` returns HTTP 200 with the 3 seed groups.
6. `POST /api/groups` without qualification returns HTTP 403 `NOT_QUALIFIED`.
7. `POST /api/groups` with `qualification: { type: 'founder' }` returns HTTP 201/200 with new group.
8. Room destruction (`skip_partner` or timeout) completely clears `room.friendRequests` and `room.friendSocials`, leaving `roomsCount === 0`.
