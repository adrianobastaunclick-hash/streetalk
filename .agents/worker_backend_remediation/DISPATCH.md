# Task Assignment: Backend Remediation (getClientIp in lib/network-policy.js)

## Objective
Fix `getClientIp` in `lib/network-policy.js` so that Express HTTP `req` objects correctly resolve their remote IP address instead of returning `'unknown'`.

## Inputs & Context
- Reviewer 2 handoff report: `d:\streetalk\.agents\reviewer_backend_security\handoff.md`
- Target file: `lib/network-policy.js`
- Operational rules: `d:\streetalk\AGENTS.md`

## Exclusive File Ownership
- `lib/network-policy.js`
Do NOT touch any other files.

## Detailed Requirements
In `lib/network-policy.js:54-67`, update `getClientIp(target)` to support both Socket.IO sockets and Express HTTP request objects:
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

Verify that calling `getClientIp(req)` with `{ socket: { remoteAddress: '127.0.0.1' }, headers: {} }` returns `'127.0.0.1'`.
Verify that calling `getClientIp(socket)` with Socket.IO socket continues to work as before.
Run the reproduction test in Reviewer 2's handoff to confirm resolution.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-14T21:52:15Z
You are the Backend Remediation Worker.
Your working directory is: d:\streetalk\.agents\worker_backend_remediation
Workspace root: d:\streetalk

MANDATORY FIRST STEP: Read d:\streetalk\ORIGINAL_REQUEST.md and d:\streetalk\AGENTS.md before starting.
Also read your assignment in: d:\streetalk\.agents\worker_backend_remediation\DISPATCH.md
And reference: d:\streetalk\.agents\reviewer_backend_security\handoff.md

Exclusive file ownership:
- lib/network-policy.js
Do NOT touch any other files.

Your mission:
Fix getClientIp in lib/network-policy.js:54-67 to handle both Socket.IO sockets and Express req objects, as detailed in DISPATCH.md.
Verify with the reproduction script from Reviewer 2:
node -e "const { getClientIp } = require('./lib/network-policy.js'); const req = { socket: { remoteAddress: '127.0.0.1' }, headers: {} }; console.log('IP:', getClientIp(req)); if (getClientIp(req) !== '127.0.0.1') process.exit(1);"

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your report to d:\streetalk\.agents\worker_backend_remediation\handoff.md when done and send a message to orchestrator.

