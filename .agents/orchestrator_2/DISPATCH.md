# Dispatch

## 2026-09-14T22:48:50Z

You are the Project Orchestrator for STREETALK.
Your working directory is: d:\streetalk\.agents\orchestrator_2
Your project root is: d:\streetalk

Authoritative User Request is recorded at d:\streetalk\.agents\ORIGINAL_REQUEST.md under section "## 2026-09-14T22:47:47Z".

### Mission
Resolve 7 visual and functional issues in Streetalk without breaking the existing test suite (124/124 tests must pass, and new tests added as appropriate):

1. **R1. Overflow fix "Scambio Social Facoltativo" in right sidebar**:
   - Location: `#partner-hub-sidebar` (or similar) in `index.html` and `public/index.html`.
   - The row with `<select>` + `<input>` (@handle) + `<button>Invia</button>` overflows on narrow screens (Invia button is clipped).
   - Fix using flex-wrap or column layout on narrow screens so it stays inside container from 320px to 1440px. No new dependencies.

2. **R2. Complete redesign of Story Card (canvas 9:16)**:
   - Function: `drawStoryCard()` in `frontend/app.js` (~line 3812).
   - Needs dark gradient background (black -> dark charcoal -> dark purple/street texture).
   - Real Streetalk logo (bold orange/white "ST STREETALK" text/branding, not placeholder).
   - Big, impactful typography with tagline randomly chosen from at least 5 different street phrases.
   - Visual accents: neon orange border, subtle urban grid watermark, dynamic local time, monospace call-to-action "streetalk.live".
   - Privacy constraint: zero private secrets/messages in story card — purely client-side promotional copy.

3. **R3. Official logo integration across UI**:
   - Source logo file is at: `C:/Users/adria/.gemini/antigravity/brain/c8214c33-d235-419c-a827-2256d857d0f3/.user_uploaded/media_1789425043227.png`
   - Copy to both `public/assets/logo-streetalk.png` and `assets/logo-streetalk.png`.
   - Reference via relative path `/assets/logo-streetalk.png`.
   - Integrate in main app header (replace text placeholder `ST` or similar).
   - Integrate into Story Card header (R2).

4. **R4. Hide/remove left sidebar in chat screen until true login system exists**:
   - Chat screen left sidebar (karma, connections, founder badge display) has no auth backend yet.
   - Hide or remove from chat view DOM so chat takes full width.
   - Profile features remain accessible only via "Profilo" main menu.
   - Ensure parity between `index.html` and `public/index.html`.

5. **R5. Restore and improve Bacheca "Gruppi a Tema" tab + payment modal**:
   - Bacheca tab "Gruppi a Tema" displays existing groups (GET /api/groups).
   - "Crea Gruppo" button: if user lacks Founder Badge and Karma < 100, open upgrade modal showing €2.99 price and benefits (simulated Stripe).
   - Connect modal to existing `POST /api/founder/unlock` endpoint.
   - After unlock, "Crea Gruppo" button activates and submits `POST /api/groups`.

6. **R6. Freely chosen Street ID Avatar system**:
   - Expand avatar grids (`#full-profile-avatar-grid`, `#onboarding-avatar-grid`, `#profile-avatar-grid`) to at least 40 symbolic street emojis/icons (⚡🔥🌙🦊🐺🎭🕶️🎯🏴☠️🌆...).
   - Persist choice in `localStorage`.
   - Display chosen avatar in `#header-profile-avatar` and `#chat-partner-avatar`. Default: ⚡.
   - Privacy by design: no user image upload.

7. **A1-A7 & Governance Rules**:
   - Rebuild bundle after any `frontend/app.js` change: `npm run build`.
   - Maintain 100% SHA256 parity:
     - `index.html` == `public/index.html`
     - `incrocio.css` == `public/incrocio.css`
     - `street-editorial.css` == `public/street-editorial.css`
   - Test suite: `npm test` must pass (≥ 124/124 PASS).
   - Per `AGENTS.md` user-defined rules: Local development only; do NOT execute remote push, PRs, or real cloud changes.
   - Commit changes cleanly to git locally on main with a descriptive message.

### Orchestrator Protocol
- Initialize `plan.md`, `progress.md`, and `BRIEFING.md` in `d:\streetalk\.agents\orchestrator_2`.
- Decompose, delegate to workers/reviewers, oversee implementation, verify build, parity, and tests.
- When all requirements are verified and complete, message Sentinel (parent) with complete evidence to trigger the independent Victory Auditor.
