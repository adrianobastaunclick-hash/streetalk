# Review Report: Backend, Security & Invariance Review

**Working Directory**: `d:\streetalk\.agents\reviewer_backend_security`  
**Reviewer Role**: reviewer & adversarial critic  
**Verdict**: **REQUEST_CHANGES**  

---

## 1. Review Summary & Executive Verdict

After rigorous static code inspection, full test suite execution (`npm test`), and independent adversarial stress-testing across all socket contracts, REST endpoints, and security boundaries, the verdict is **REQUEST_CHANGES**.

While the majority of M1-M6 backend requirements are cleanly implemented (12-emoji whitelist, GIF multi-category expansion, bilateral friend request double consensus, 100% Free Chat Invariance, zero private data persistence), a **Critical Defect / Integrity Violation** was uncovered in the hybrid authorization mechanism of `POST /api/groups` and REST rate limiting due to an IP resolution mismatch between `lib/network-policy.js` and Express `req` objects.

---

## 2. Findings

### [Critical] Finding 1 — Tag: INTEGRITY VIOLATION / FACADE IMPLEMENTATION
- **What**: `getClientIp(req)` fails on Express HTTP requests, unconditionally returning `'unknown'`. Consequently, `streetBot.getStrikes(clientIp)` checks `streetBot.getStrikes('unknown')` (which is always 0), rendering the server-side IP strike verification for thematic group creation completely inert. Furthermore, TEST 24.4 in `tests/autonomous-suite.js` masks this failure by relying on a self-reported client payload (`strikeCount: 1`) rather than validating against an actual strike in `streetBot`.
- **Where**:
  - `lib/network-policy.js:54-67`
  - `server.js:1505-1555`
  - `tests/autonomous-suite.js:1804-1820` (TEST 24.4)
- **Why**: 
  1. `lib/network-policy.js` declares:
     ```javascript
     function getClientIp(socket) {
       const request = socket.request;
       const remoteAddress = request?.socket?.remoteAddress || socket.conn?.remoteAddress || socket.handshake?.address;
       if (!net.isIP(remoteAddress)) return 'unknown';
     ```
     When called with an Express `req` object (`server.js:1505`: `const clientIp = getClientIp(req);`), `req.request` is `undefined` (Express `req` *is* the request; it does not have a `.request` property). `socket.conn` and `socket.handshake` are also `undefined`. Therefore, `remoteAddress` evaluates to `undefined`, `net.isIP(undefined)` is `false`, and `getClientIp(req)` returns `'unknown'`.
  2. In `server.js:1550`:
     ```javascript
     const ipStrikes = streetBot ? streetBot.getStrikes(clientIp) : 0;
     const totalStrikes = Math.max(ipStrikes, payloadStrikes);
     ```
     Because `clientIp === 'unknown'`, `ipStrikes` is always 0. If an abusive user whose IP has active strikes in `streetBot` calls `POST /api/groups` with `qualification: { karmaScore: 100, strikeCount: 0 }`, the server accepts the request and returns `HTTP 201 Created` instead of `HTTP 403 NOT_QUALIFIED`.
  3. TEST 24.4 in `tests/autonomous-suite.js` claims to test: *"Hybrid Auth (Case D): User with active Bot strike rejected with HTTP 403 NOT_QUALIFIED verified"*. However, it does not set or trigger any strike in `streetBot`; instead, it has the client pass `{ strikeCount: 1 }` in the JSON body, self-certifying its own disqualification. This represents a facade implementation where the server check appears to enforce `streetBot` strikes, but in reality depends entirely on client honesty.
- **Suggestion**:
  1. In `lib/network-policy.js:55`, update `getClientIp` to support both Socket.IO sockets and Express `req` objects:
     ```javascript
     function getClientIp(target) {
       const request = target?.request || (target?.socket ? target : null);
       const remoteAddress = request?.socket?.remoteAddress || target?.conn?.remoteAddress || target?.handshake?.address;
       if (!net.isIP(remoteAddress)) return 'unknown';
       const headers = request?.headers || target?.handshake?.headers || {};
       try {
         const address = proxyaddr({ socket: { remoteAddress }, headers }, trustProxy);
         return net.isIP(address) ? address : remoteAddress;
       } catch {
         return remoteAddress;
       }
     }
     ```
  2. In `tests/autonomous-suite.js:1804` (TEST 24.4), update the test to register an actual strike in `streetBot` against the local test IP (`streetBot.recordStrike('127.0.0.1', 'Test strike')`), and submit a request where `strikeCount` is 0 or omitted, proving that the server genuinely checks and enforces the backend strike registry.

---

### [Major] Finding 2 — Global Rate Limiter Collusion
- **What**: In `server.js:50`, the REST API rate limiter calls `const ip = getClientIp(req);`. Because `getClientIp(req)` returns `'unknown'` for all HTTP requests, ALL incoming HTTP traffic to `/api/*` across all users is pooled into a single rate limit bucket: `apiRateLimits.get('unknown')`.
- **Where**: `server.js:49-70` (`apiRateLimiter`)
- **Why**: The maximum allowed requests per 60-second window is `API_MAX_REQUESTS_PER_WINDOW = 120`. If concurrent users collectively generate more than 120 requests in 60 seconds across `/api/groups`, `/api/gifs/*`, `/api/stats`, or `/api/founder/unlock`, ALL users will be blocked with `HTTP 429 RATE_LIMIT_EXCEEDED` ("Troppe richieste. Rallenta."), resulting in a denial-of-service condition for legitimate clients.
- **Suggestion**: Fixing `getClientIp` in `lib/network-policy.js` (as specified in Finding 1) will immediately resolve this issue by ensuring each client IP is tracked in its own rate-limit bucket.

---

### [Minor] Finding 3 — Specification Discrepancy on Karma Threshold
- **What**: `PROJECT.md` line 21 specifies `Karma>=150 with 0 strikes` for thematic group creation, whereas `server.js:1553`, `DISPATCH.md:20`, and `frontend/app.js:3223` implement `karmaScore >= 50 && totalStrikes === 0`.
- **Where**: `PROJECT.md:21` vs `server.js:1553`
- **Why**: Minor documentation discrepancy between the project blueprint table and the accepted implementation.
- **Suggestion**: Update `PROJECT.md:21` to align with the 50 karma score threshold.

---

## 3. Detailed Verification of Assignment Checklist

| # | Check Item | Status | Evidence / Observation |
|---|------------|:------:|------------------------|
| 1 | `ALLOWED_EMOJIS` whitelist (12 emojis) | **PASS** | `server.js:94` defines `Object.freeze(['🔥', '💀', '⚡', '🖤', '🚬', '👀', '🤯', '👏', '💖', '💋', '😈', '🌹'])`. Enforced at `server.js:1216`. Socket bursts broadcast `receive_reaction` to room; non-whitelisted emojis (e.g. 🍕) are rejected with zero emission. |
| 2 | GIF categories & relative URLs in `lib/gif-provider.js` | **PASS** | `GIFService.categories` includes `flirt`, `amore`, `spicy` (12 categories total). `TenorProvider` and `GiphyProvider` category maps updated. `CuratedProvider.normalizeResult` returns relative `/assets/gifs/<name>.svg` in production without hardcoding `localhost:3000`. 13 distinct SVGs eliminate duplicate `flame.svg` fallback. |
| 3 | Bilateral friend request & zero-leak teardown | **PASS** | `room.friendRequests` (Set) and `room.friendSocials` (Map) initialized in `createRoom`. Re-entrancy/duplicate spam by a single socket is deduplicated. Single request emits `friend_request_received` without unlock; mutual request emits `friend_request_matched` and `friendship_unlocked`. Unilateral contact sharing blocked with `FRIENDSHIP_NOT_UNLOCKED`. On `destroyRoom`, `friendRequests.clear()`, `friendSocials.clear()`, and `rooms.delete()` ensure 100% memory deallocation. |
| 4 | Volatile `thematicGroups` in RAM & XSS | **FAIL** | `thematicGroups` initialized in volatile RAM (`new Map()`) with 3 seed groups. Inputs sanitized via `DOMSafetyFilter.sanitize()` and rendered via text content. **HOWEVER**, IP strike verification fails because `getClientIp(req)` returns `'unknown'` (see Finding 1). |
| 5 | Founder Badge handshake & unlock simulation | **PASS** | `validateJoinPayload` safely reads `isFounder` as boolean. `createRoom` propagates `partnerIsFounder` and `partnerProfile.isFounder` in `match_found`. `POST /api/founder/unlock` and alias `/api/founder/simulate-unlock` return `{ ok: true, status: 'unlocked', badge: 'FONDATORE' }`. |
| 6 | 100% Free Chat Invariance & Zero Persistence | **PASS** | Matchmaking, chat messaging (text, audio, GIF), typing indicators, and room extensions (+300s) remain 100% free and unimpeded for non-founders (`isFounder: false`). Zero chat messages or secrets are written to Supabase or any database. Secrets are held in RAM and destroyed upon room teardown (`destroyedSecretsCount` incremented). `GET /api/secrets` returns HTTP 410. |
| 7 | Execution of `npm test` (123 tests) | **PASS\*** | `npm test` runs 25 test suites with `AUDIT COMPLETE: 123 PASSED, 0 FAILED` (exit code 0). (\*Surface pass only: TEST 24.4 passes due to self-certified client payload, masking Finding 1). |

---

## 4. Adversarial Review & Attack Surface

**Overall Risk Assessment**: **HIGH**

### Attack Scenario 1: Moderation Bypass on Group Creation
- **Assumption Challenged**: The backend independently verifies IP strikes from `streetBot` on `POST /api/groups`.
- **Attack Scenario**:
  1. An attacker connects and sends abusive messages, receiving Strike 1 or Strike 2 from `streetBot` (recorded in `streetBot.strikesByIp['<attacker-ip>']`).
  2. The attacker issues an HTTP request `POST /api/groups` with payload:
     ```json
     {
       "title": "Tavolo Abusivo Sotterraneo",
       "description": "Descrizione del tavolo creato eludendo i blocchi del bot.",
       "category": "generale",
       "qualification": { "karmaScore": 100, "strikeCount": 0 }
     }
     ```
  3. The server runs `const clientIp = getClientIp(req);` which returns `'unknown'`.
  4. `streetBot.getStrikes('unknown')` returns 0.
  5. `totalStrikes = Math.max(0, 0) = 0`.
  6. The server responds with `HTTP 201 Created` and adds the group to `thematicGroups`.
- **Blast Radius**: Penalized or banned actors can open public thematic groups in Bacheca despite active moderation sanctions.
- **Reproduced Evidence**: Verified via independent Node.js script:
  ```powershell
  # Output of reproduction script:
  # streetBot.recordStrike('127.0.0.1', 'Abuse');
  # POST /api/groups with { karmaScore: 100, strikeCount: 0 } -> HTTP 201 Created (Expected: 403)
  ```

### Attack Scenario 2: Global Denial-of-Service via REST Rate Limiter
- **Assumption Challenged**: REST API rate limiting isolates abusive IP addresses.
- **Attack Scenario**:
  1. A single user or bot issues 121 requests to `GET /api/groups` or `/api/gifs/categories`.
  2. All requests are attributed to `ip = 'unknown'`.
  3. `apiRateLimits.get('unknown').count` reaches 121.
  4. Any subsequent request to `/api/*` from ANY legitimate user worldwide receives `HTTP 429 RATE_LIMIT_EXCEEDED`.
- **Blast Radius**: Complete denial of service for all REST features across the application.

---

## 5. 5-Component Handoff Protocol

### 5.1 Observation
1. In `lib/network-policy.js:54-67`:
   ```javascript
   function getClientIp(socket) {
     const request = socket.request;
     const remoteAddress = request?.socket?.remoteAddress || socket.conn?.remoteAddress || socket.handshake?.address;
     if (!net.isIP(remoteAddress)) return 'unknown';
   ```
2. Direct invocation of `getClientIp(req)` with an Express request object:
   ```javascript
   const reqMock = { socket: { remoteAddress: '203.0.113.195' }, headers: {} };
   getClientIp(reqMock) // -> returns 'unknown'
   ```
3. In `server.js:1505-1554`:
   ```javascript
   const clientIp = getClientIp(req); // -> 'unknown'
   ...
   const ipStrikes = streetBot ? streetBot.getStrikes(clientIp) : 0; // -> 0
   const totalStrikes = Math.max(ipStrikes, payloadStrikes);
   ```
4. In `tests/autonomous-suite.js:1804-1820` (TEST 24.4):
   ```javascript
   const groupDRes = await fetch(`${SERVER_URL}/api/groups`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       title: 'Tavolo Utente Sanzionato',
       description: 'Descrizione valida ma utente con richiami attivi da parte dello StreetBot.',
       category: 'generale',
       qualification: { karmaScore: 100, strikeCount: 1 }
     })
   });
   ```
5. Running `npm test` outputs:
   `AUDIT COMPLETE: 123 PASSED, 0 FAILED` (duration ~16s).

### 5.2 Logic Chain
- `server.js:1505` intends to prevent users with active strikes from creating thematic groups by calling `streetBot.getStrikes(clientIp)`.
- Because `getClientIp` only checks `socket.request` and does not check `target.socket` or `target.headers`, passing an Express `req` results in `remoteAddress = undefined`.
- `getClientIp(req)` therefore always returns `'unknown'`.
- As a result, `streetBot.getStrikes('unknown')` always returns 0.
- When an attacker submits `POST /api/groups` without self-reporting a strike, `totalStrikes` is evaluated as 0, completely bypassing the strike check.
- TEST 24.4 claims to verify active bot strike rejection, but only verifies that a client can reject itself by sending `strikeCount: 1`.
- Per the reviewer integrity mandate, facade implementations and self-certifying tests require a verdict of `REQUEST_CHANGES`.

### 5.3 Caveats
- No implementation files were modified during this review, adhering strictly to the review-only constraint.
- Outside of Finding 1 and Finding 2, all socket events, SVG assets, sound synthesis, profile management, and invariance requirements are implemented correctly and robustly.

### 5.4 Conclusion
The implementation cannot be approved in its current state because the backend's authorization check against StreetBot IP strikes is bypassed by `getClientIp(req)` returning `'unknown'`, and the rate limiter exposes the application to global DoS.

### 5.5 Verification Method
To reproduce the failure independently:
```powershell
node -e "
const http = require('http');
const assert = require('assert');
const { app, streetBot } = require('./server.js');

async function verifyDefect() {
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;

  // Record active strike in streetBot for 127.0.0.1
  streetBot.recordStrike('127.0.0.1', 'Abuse in chat');

  // Client attempts group creation, maliciously self-reporting strikeCount: 0
  const res = await fetch(base + '/api/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Bypass Group',
      description: 'Should be rejected due to active IP strike',
      qualification: { karmaScore: 100, strikeCount: 0 }
    })
  });

  server.close();
  streetBot.reset();

  console.log('Status code received:', res.status);
  assert.strictEqual(res.status, 403, 'Must reject with 403 when IP has active strikes');
}
verifyDefect();
"
```
**Expected Outcome on Current Code**: Fails with `AssertionError: 201 !== 403`.  
**Expected Outcome After Fix**: Exits with code 0.
