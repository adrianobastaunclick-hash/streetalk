# Execution Plan — orchestrator_2

## Objective
Implement requirements R1-R6 and acceptance criteria A1-A7 for Streetalk without regressions, maintaining 100% test pass rate and file parity.

## Milestones Breakdown

### Survey Phase
- Spawn 3 Explorers in parallel to inspect:
  - Explorer 1: Sidebar DOM/CSS (#partner-hub-sidebar, chat left sidebar) and Logo asset/header references (R1, R3, R4)
  - Explorer 2: Story Card canvas implementation in frontend/app.js (~line 3812) and Avatar grid/storage in frontend/app.js and HTML (R2, R6)
  - Explorer 3: Bacheca Gruppi a Tema tab, "Crea Gruppo" flow, upgrade modal, and /api/founder/unlock + /api/groups endpoints (R5), plus existing test suite structure (A1-A7)

### Milestone 1: Logo, Header & Sidebars (R1, R3, R4)
- Worker copies logo asset from `C:/Users/adria/.gemini/antigravity/brain/c8214c33-d235-419c-a827-2256d857d0f3/.user_uploaded/media_1789425043227.png` to `public/assets/logo-streetalk.png` and `assets/logo-streetalk.png`.
- Worker replaces placeholder text/icon in header with `/assets/logo-streetalk.png`.
- Worker fixes "Scambio Social Facoltativo" flex/wrap/column layout in sidebar to prevent overflow (320px-1440px).
- Worker hides/removes chat left sidebar until true login system exists (chat takes full width).
- Worker syncs `index.html` to `public/index.html` and any CSS files, runs tests.
- Reviewer, Challenger, Auditor verify.

### Milestone 2: Story Card Redesign & Street ID Avatar System (R2, R6)
- Worker refactors `drawStoryCard()` in `frontend/app.js`:
  - Dark gradient background (black -> dark charcoal -> dark purple/street texture)
  - Bold orange/white "ST STREETALK" branding
  - Big impactful typography with randomly selected tagline from >= 5 street phrases
  - Neon orange border, subtle urban grid watermark, dynamic local time, monospace "streetalk.live" CTA
  - Strict privacy: no private messages/secrets
- Worker expands avatar grids to >= 40 street emojis/icons, saves choice to localStorage, updates header and chat partner avatar, default ⚡.
- Worker rebuilds bundle (`npm run build`), syncs HTML files, runs tests.
- Reviewer, Challenger, Auditor verify.

### Milestone 3: Bacheca Gruppi a Tema & Founder Modal (R5)
- Worker restores/improves "Gruppi a Tema" tab in Bacheca to display existing groups via `GET /api/groups`.
- Worker connects "Crea Gruppo" button: if user lacks Founder Badge and Karma < 100, open upgrade modal showing €2.99 and benefits (simulated Stripe).
- Worker connects modal to `POST /api/founder/unlock`.
- After unlock, "Crea Gruppo" activates and submits `POST /api/groups`.
- Worker rebuilds bundle (`npm run build`), syncs files, runs tests.
- Reviewer, Challenger, Auditor verify.

### Milestone 4: Bundle Rebuild, Parity Verification, Regression Testing & Git Commit (A1-A7)
- Worker rebuilds bundle (`npm run build`).
- Worker verifies 100% SHA256 parity:
  - `index.html` == `public/index.html`
  - `incrocio.css` == `public/incrocio.css`
  - `street-editorial.css` == `public/street-editorial.css`
- Worker runs `npm test` and confirms >= 124/124 tests pass.
- Worker executes clean local git commit on main.
- Final gate: Reviewers, Challengers, and Forensic Auditor confirm all criteria A1-A7 are met.
- Notify parent Sentinel.
