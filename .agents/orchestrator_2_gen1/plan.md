# Implementation Plan — STREETALK Milestones 1-4

## Overview
Implement the remaining user requirements (R1-R6) across 4 focused milestones, maintaining absolute parity between root and public/, verifying 0 regressions on autonomous-suite.js, and complying with user constraints.

## Milestones

### Milestone 1: Logo, Header & Sidebars (R1, R3, R4)
- **Scope**:
  - R1: Fix overflow in "Scambio Social Facoltativo" drawer (#friend-request-unlocked-drawer) across 320px-1440px using flex-wrap / column wrapping.
  - R3: Copy official logo file (`C:/Users/adria/.gemini/antigravity/brain/c8214c33-d235-419c-a827-2256d857d0f3/.user_uploaded/media_1789425043227.png`) to `assets/logo-streetalk.png` and `public/assets/logo-streetalk.png`. Replace placeholder in header with `<img>` pointing to `/assets/logo-streetalk.png`.
  - R4: Hide chat left sidebar cleanly using CSS (`display: none !important`) while keeping DOM elements intact for any existing JS/test queries. Ensure chat room takes full width.
  - Parity: Keep `index.html` and `public/index.html` 100% identical.
- **Worker**: teamwork_preview_worker
- **Verification**: Reviewer checks visual consistency, mobile responsiveness, DOM parity, and test suite.

### Milestone 2: Story Card Redesign & 40+ Avatar System (R2, R6)
- **Scope**:
  - R2: Redesign `drawStoryCard()` in `frontend/app.js` (~line 3812):
    - 720x1280 (9:16 vertical story format).
    - Dark obsidian/purple street background gradient.
    - Official ST STREETALK logo/branding.
    - Dynamic randomized street tagline (>=5 variations).
    - Monospace "streetalk.live" CTA.
    - Dynamic local timestamp.
    - Neon orange border and subtle urban grid watermark.
    - Zero privacy leakage (no real user IDs/IPs).
  - R6: Expand avatar grids (#full-profile-avatar-grid, #onboarding-avatar-grid, #profile-avatar-grid) to >=40 street avatars/emojis.
    - Store selected avatar in localStorage (`streetalk_avatar`), default to ⚡.
    - Update `#header-profile-avatar` and `#chat-partner-avatar`.
  - Build: Run `npm run build` to compile `public/app.bundle.js`.
- **Worker**: teamwork_preview_worker
- **Verification**: Reviewer checks canvas output, avatar count (>=40), localStorage persistence, and test suite.

### Milestone 3: Bacheca Gruppi a Tema & Founder Modal (R5)
- **Scope**:
  - R5: Restore/improve "Gruppi a Tema" tab in Bacheca to display groups fetched from `GET /api/groups`.
  - "Crea Gruppo" button logic:
    - Check user status: if user lacks Founder Badge and Karma < 100, open upgrade modal showing €2.99 price and Founder benefits (simulated Stripe).
    - Hook modal action to existing `POST /api/founder/unlock`.
    - Once unlocked or if conditions met, activate group creation and submit `POST /api/groups`.
  - Build: Run `npm run build` if `frontend/app.js` is modified. Ensure API endpoints match server.
- **Worker**: teamwork_preview_worker
- **Verification**: Reviewer verifies modal flow, group listing, founder unlock integration, and test suite.

### Milestone 4: Integration, Parity, Regression Testing & Git Commit (A1-A7)
- **Scope**:
  - Build check: `npm run build`.
  - SHA256 parity verification across `index.html` <-> `public/index.html`, and CSS files.
  - Run full test suite: `node tests/autonomous-suite.js` (must pass 100%, >=124 tests).
  - Final audit by Challenger and Forensic Auditor.
  - Clean local git commit on main (strictly no remote push).
