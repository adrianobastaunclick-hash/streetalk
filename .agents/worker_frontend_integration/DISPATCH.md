# Task Assignment: Frontend UI Integration (R1, R2, R3, R4, R5, R6)

## Objective
Implement all frontend enhancements across `index.html`, `public/index.html`, `incrocio.css`, `public/incrocio.css`, and `frontend/app.js` (compiled to `public/app.min.js`).

## Inputs & Context
- Authoritative requirements: `d:\streetalk\ORIGINAL_REQUEST.md`
- Project specification: `d:\streetalk\PROJECT.md`
- Frontend explorer survey: `d:\streetalk\.agents\explorer_survey_frontend\handoff.md`
- Asset explorer report & M2 handoff: `d:\streetalk\.agents\worker_m2_assets\handoff.md`
- Realtime backend contracts & M3 handoff: `d:\streetalk\.agents\worker_m3_backend\handoff.md`
- Operational rules: `d:\streetalk\AGENTS.md` (strict root/public parity, 100% test pass rate, no external audio files).

## Exclusive File Ownership
- `index.html` and `public/index.html` (Must maintain 100% byte-for-byte identical parity)
- `incrocio.css` and `public/incrocio.css` (Must maintain 100% byte-for-byte identical parity)
- `frontend/app.js`
- `public/app.min.js` and `public/utilities.css` (via `npm run build`)
Do NOT touch `server.js` or `tests/autonomous-suite.js`.

## Detailed Requirements
1. **R1: Quick Reaction Strip**:
   - In `index.html` and `public/index.html`: 12 emoji buttons (`🔥`, `💀`, `⚡`, `🖤`, `🚬`, `👀`, `🤯`, `👏`, `💖`, `💋`, `😈`, `🌹`).
   - In `frontend/app.js`: `sendReaction` with immediate local spring-pop, Web Audio tone (`SoundEngine.playReaction(emoji)`), haptic (`navigator.vibrate`), emit `send_reaction`.
   - In `frontend/app.js`: `triggerReactionVisual` with floating neon drop-shadow glow and fade.
2. **R2: GIF Engine & Flame Fallback Elimination**:
   - In `frontend/app.js`: Replace universal `flame.svg` in all `img.onerror` handlers with `CATEGORY_FALLBACK_MAP` using the 13 new SVGs (`kiss.svg`, `heart_pulse.svg`, `chili.svg`, etc.).
   - Add category tabs for `Flirt`, `Amore`, `Spicy` in GIF modal and catalog.
3. **R3: Sidebar Hub & Bilateral Friend Request**:
   - In `index.html` and `public/index.html`: Reorganize sidebar to showcase partner card (avatar, moniker, mood, badge) and add Friend Request container.
   - In `frontend/app.js`: Handle `send_friend_request`, receive `friend_request_received`, handle `friend_request_matched` / `friendship_unlocked`. Persist partner to `localStorage.streetalk_connections_v1`. Reveal optional social exchange drawer (Telegram/Instagram/Link).
4. **R4: Profile & Connections Book**:
   - In `index.html` and `public/index.html`: Add Street Karma HUD, Founder Badge card, and Rubrica Connessioni list in `#view-profilo`.
   - In `frontend/app.js`: Render connections from `localStorage.streetalk_connections_v1` using `DOMSafetyFilter` / `safeSetText`. Compute and display Street Karma score.
5. **R5: Bacheca Thematic Groups**:
   - In `index.html` and `public/index.html`: Add "Gruppi a Tema" tab in `#view-bacheca`, "+ Crea Gruppo a Tema" button, Creation Modal, and Unqualified Explanation Modal.
   - In `frontend/app.js`: Fetch and render groups from `GET /api/groups`, handle creation `POST /api/groups`, gate with `isFounder || (streetKarma >= 50 && strikes === 0)`.
6. **R6: Founder Badge Monetization Modal**:
   - In `index.html` and `public/index.html`: Add `#modal-founder-badge` promoting €2.99 one-time supporter badge with the 4 perks.
   - In `frontend/app.js`: Simulated Stripe-ready transaction via `POST /api/founder/unlock`, set local founder state, display golden badge on profile and sidebar, priority radar visual.
7. **Compilation & Verification**:
   - Run `npm run build` to update `public/app.min.js`.
   - Verify byte parity: `index.html` ↔ `public/index.html`, `incrocio.css` ↔ `public/incrocio.css`.
   - Run `npm test` and verify 99/99 tests pass.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-14T21:23:12Z
Received dispatch invocation as Frontend Integration Worker.
Implement all frontend enhancements for R1, R2, R3, R4, R5, R6.
Exclusive files: index.html, public/index.html, incrocio.css, public/incrocio.css, frontend/app.js, public/app.min.js, public/utilities.css.
Do NOT edit server.js, lib/gif-provider.js, or tests/autonomous-suite.js.

