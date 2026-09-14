# Task Assignment: Test Suite Remediation (tests/autonomous-suite.js)

## Objective
Update `tests/autonomous-suite.js` to:
1. In TEST 24.4: Eliminate the facade test where the client self-reported `strikeCount: 1`. Instead, record a genuine strike in `streetBot` against `'127.0.0.1'` (`streetBot.recordStrike('127.0.0.1', 'Test strike')`), send `POST /api/groups` with `qualification: { karmaScore: 100, strikeCount: 0 }`, and assert that the server returns HTTP 403 `NOT_QUALIFIED` based on the real backend `streetBot` strike.
2. In TEST 22: Add static DOM checks verifying that `#friend-request-unlocked-drawer`, `#friend-social-handle`, `#friend-partner-social-received`, `#friend-partner-social-text`, `#chat-partner-motto-row`, `#chat-partner-topics-row`, and `#chat-partner-avoids-row` exist in both `index.html` and `public/index.html`.
3. Verify that `npm test` runs with 100% pass rate (0 failures).

## Inputs & Context
- Reviewer 2 handoff report: `d:\streetalk\.agents\reviewer_backend_security\handoff.md`
- Reviewer 1 handoff report: `d:\streetalk\.agents\reviewer_frontend_assets\handoff.md`
- Target file: `tests/autonomous-suite.js`

## Exclusive File Ownership
- `tests/autonomous-suite.js`
Do NOT touch any other files.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-14T21:58:45Z
You are the Test Remediation Worker.
Your working directory is: d:\streetalk\.agents\worker_test_remediation
Workspace root: d:\streetalk

MANDATORY FIRST STEP: Read d:\streetalk\ORIGINAL_REQUEST.md and d:\streetalk\AGENTS.md before starting.
Also read your assignment in: d:\streetalk\.agents\worker_test_remediation\DISPATCH.md
And reference:
- d:\streetalk\.agents\reviewer_backend_security\handoff.md
- d:\streetalk\.agents\reviewer_frontend_assets\handoff.md

Exclusive file ownership:
- tests/autonomous-suite.js
Do NOT touch any other files.

Your mission:
1. In TEST 24.4 of tests/autonomous-suite.js: record an actual strike in streetBot for the local IP (streetBot.recordStrike('127.0.0.1', 'Test strike')), then POST /api/groups with qualification: { karmaScore: 100, strikeCount: 0 } (or without strikeCount), and assert that the server returns HTTP 403 NOT_QUALIFIED. Reset streetBot after the check.
2. In TEST 22 of tests/autonomous-suite.js: add static DOM assertions checking that #friend-request-unlocked-drawer, #friend-social-handle, #friend-partner-social-received, #friend-partner-social-text, #chat-partner-motto-row, #chat-partner-topics-row, #chat-partner-avoids-row exist in both index.html and public/index.html.
3. Run `npm test` and verify that all tests pass with 0 failures!

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your report to d:\streetalk\.agents\worker_test_remediation\handoff.md when done and send a message to orchestrator.

