# Handoff Report: Backend Remediation (lib/network-policy.js)

**Working Directory**: `d:\streetalk\.agents\worker_backend_remediation`  
**Worker Role**: implementer, qa  
**Date**: 2026-09-14T21:56:00Z  
**Target File**: `lib/network-policy.js` (Exclusive ownership respected)

---

## 1. Observation
1. Prior to remediation, `lib/network-policy.js:54-58` only inspected `socket.request`:
   ```javascript
   function getClientIp(socket) {
     const request = socket.request;
     const remoteAddress = request?.socket?.remoteAddress || socket.conn?.remoteAddress || socket.handshake?.address;
     if (!net.isIP(remoteAddress)) return 'unknown';
     const headers = request?.headers || socket.handshake?.headers || {};
   ```
   When passed an Express HTTP `req` object, `req.request`, `socket.conn`, and `socket.handshake` were all `undefined`, resulting in `getClientIp(req)` unconditionally returning `'unknown'`.
2. Direct invocation of the prompt verification command prior to the change:
   `node -e "const { getClientIp } = require('./lib/network-policy.js'); const req = { socket: { remoteAddress: '127.0.0.1' }, headers: {} }; console.log('IP:', getClientIp(req)); if (getClientIp(req) !== '127.0.0.1') process.exit(1);"`
   Resulted in:
   `TypeError: getClientIp is not a function` because `getClientIp` was not exported at the module level.
3. Direct execution of Reviewer 2's reproduction script prior to the change:
   Recorded strike for `127.0.0.1` in `streetBot` and sent `POST /api/groups` with `qualification: { karmaScore: 100, strikeCount: 0 }`.
   Output verbatim:
   `Status code received: 201`
   `AssertionError [ERR_ASSERTION]: Must reject with 403 when IP has active strikes: 201 !== 403`
4. Modified `lib/network-policy.js` to:
   - Accept any `target` (Socket.IO socket or Express `req` object):
     ```javascript
     function getClientIp(target) {
       if (!target) return 'unknown';
       const request = target.request || (target.socket ? target : null);
       const remoteAddress = request?.socket?.remoteAddress || target.socket?.remoteAddress || target.conn?.remoteAddress || target.handshake?.address;
       if (!remoteAddress || !net.isIP(remoteAddress)) return 'unknown';

       const headers = request?.headers || target.handshake?.headers || target.headers || {};
       try {
         const address = proxyaddr({ socket: { remoteAddress }, headers }, trustProxy);
         return net.isIP(address) ? address : remoteAddress;
       } catch {
         return remoteAddress;
       }
     }
     ```
   - Export `getClientIp` bound to default network policy at the top level:
     ```javascript
     let defaultPolicyInstance = null;
     function getDefaultPolicy() {
       if (!defaultPolicyInstance) {
         defaultPolicyInstance = createNetworkPolicy();
       }
       return defaultPolicyInstance;
     }

     function getClientIp(target) {
       return getDefaultPolicy().getClientIp(target);
     }

     module.exports = { createNetworkPolicy, PRODUCTION_ORIGINS, getClientIp };
     ```

---

## 2. Logic Chain
1. By defining `const request = target.request || (target.socket ? target : null);`:
   - For a Socket.IO socket, `target.request` resolves to the HTTP handshake request as before.
   - For an Express `req`, `target.socket` exists, so `request` points to `target` (the `req` object itself).
2. `request?.socket?.remoteAddress` retrieves `127.0.0.1` directly from `req.socket.remoteAddress`.
3. `headers` accurately falls back to `target.headers` (standard on Express `req`), allowing `proxyaddr` to correctly process any trusted forward headers.
4. Exporting `getClientIp` top-level allows direct imports (`const { getClientIp } = require('./lib/network-policy.js');`) while retaining factory usage (`createNetworkPolicy().getClientIp`) in `server.js` and test suites.
5. In `server.js:1505`, `const clientIp = getClientIp(req);` now receives `'127.0.0.1'` instead of `'unknown'`.
6. Consequently, `streetBot.getStrikes(clientIp)` looks up `'127.0.0.1'`, discovers the active strike, sets `totalStrikes = Math.max(1, 0) = 1`, and correctly rejects the request with `HTTP 403 NOT_QUALIFIED`.
7. In `server.js:50`, the REST API rate limiter now tracks client IPs in individual buckets rather than pooling all traffic under `'unknown'`.

---

## 3. Caveats
No caveats. All edits were confined strictly to `lib/network-policy.js` under exclusive file ownership. No other files were touched.

---

## 4. Conclusion
The backend remediation for `getClientIp` in `lib/network-policy.js` is complete, verified, and regression-free. Express `req` objects and Socket.IO sockets now resolve IP addresses with full proxy traversal support, resolving Finding 1 (integrity violation on strike check) and Finding 2 (global DoS on rate limiting).

---

## 5. Verification Method

### 5.1 Verification Script 1 (Prompt Verification)
```bash
node -e "const { getClientIp } = require('./lib/network-policy.js'); const req = { socket: { remoteAddress: '127.0.0.1' }, headers: {} }; console.log('IP:', getClientIp(req)); if (getClientIp(req) !== '127.0.0.1') process.exit(1);"
```
Output:
`IP: 127.0.0.1` (Exits with code 0).

### 5.2 Verification Script 2 (Reviewer 2 Adversarial Strike Enforcement)
```bash
node -e "
const http = require('http');
const assert = require('assert');
const { app, streetBot } = require('./server.js');

async function verifyDefect() {
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;

  streetBot.recordStrike('127.0.0.1', 'Abuse in chat');

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
Output:
`Status code received: 403` (Exits with code 0).

### 5.3 Test Suite Execution
```bash
npm test
```
Output:
`AUDIT COMPLETE: 123 PASSED, 0 FAILED` (Exits with code 0).
