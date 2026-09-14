# Project: STREETALK UI/UX & Functional Polishing (Session 2026-09-14)

## Architecture
- **Runtime**: Node.js (CommonJS) + Express 4.19.2 + Socket.IO 4.7.5.
- **Frontend Source**: Vanilla JS (`frontend/app.js` compiled to `public/app.min.js` via `npm run build`), HTML5 (`index.html` ↔ `public/index.html`), CSS (`incrocio.css` ↔ `public/incrocio.css`, `street-editorial.css` ↔ `public/street-editorial.css`).
- **Assets**: `assets/` ↔ `public/assets/` (Official logo, animated reaction SVGs).
- **Testing**: `tests/autonomous-suite.js` (124+ tests passing, zero regression tolerance).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R1. Sidebar Social Exchange Overflow Fix | Prevent overflow on narrow screens (320px-1440px) using flex-wrap and min-w-0 on input in `#friend-request-unlocked-drawer` | M1 | ORIGINAL_REQUEST §R1 |
| 2 | R2. Story Card Redesign | Canvas 9:16 redesign in `drawStoryCard()`: dark gradient, official branding, random tagline from >= 5 phrases, neon border, urban watermark, time, monospace CTA | M2 | ORIGINAL_REQUEST §R2 |
| 3 | R3. Official Logo Integration | Copy official logo to `assets/logo-streetalk.png` & `public/assets/logo-streetalk.png`, replace text placeholder in header with `<img>`, integrate in Story Card | M1, M2 | ORIGINAL_REQUEST §R3 |
| 4 | R4. Chat Left Sidebar Clean Removal | Hide left sidebar in chat screen via CSS (`display: none !important;`) and class `hidden`; profile features remain in main menu "Profilo"; chat takes full width | M1 | ORIGINAL_REQUEST §R4 |
| 5 | R5. Bacheca Gruppi a Tema & Founder Modal | Display groups via GET /api/groups; "Crea Gruppo" checks `isFounder || (karma >= 100 && strikes === 0)`; if unqualified opens upgrade modal (€2.99 simulated Stripe, connects to /api/founder/unlock), activates group creation POST /api/groups | M3 | ORIGINAL_REQUEST §R5 |
| 6 | R6. Street ID Avatar System | Expand avatar catalog to 58 items (10 SVGs + 48 emojis), render in grids, persist in localStorage (`streetalk_profile_v1` & `streetalk_avatar`), update header & partner avatars, default ⚡ | M2 | ORIGINAL_REQUEST §R6 |
| 7 | A1-A7. Build, Parity & Test Suite | Rebuild bundle, verify 100% SHA256 parity for index.html, incrocio.css, street-editorial.css, ensure >=124/124 tests pass, local git commit on main | M4 | ORIGINAL_REQUEST §A1-A7 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Survey & Code Mapping | Map exact lines and structure for R1-R6 across files | none | DONE |
| M1 | Logo, Header & Sidebars | R1 (overflow fix), R3 (logo copy & header), R4 (chat left sidebar CSS hiding) | M0 | IN_PROGRESS |
| M2 | Story Card & Avatar System | R2 (Story Card 9:16 canvas), R6 (58-avatar grid & persistence) | M1 | PLANNED |
| M3 | Bacheca Gruppi & Founder Modal | R5 (Gruppi a Tema tab, upgrade modal, /api/founder/unlock & /api/groups) | M2 | PLANNED |
| M4 | Final Integration, Parity & Audit | A1-A7 (bundle rebuild, parity check, test suite verification, git commit) | M1, M2, M3 | PLANNED |

## Interface Contracts

### 1. Logo Asset Contract
- Source path: `C:/Users/adria/.gemini/antigravity/brain/c8214c33-d235-419c-a827-2256d857d0f3/.user_uploaded/media_1789425043227.png`
- Destination paths: `public/assets/logo-streetalk.png` and `assets/logo-streetalk.png`
- Relative URL in HTML/JS: `/assets/logo-streetalk.png`
- Header brand: `<img src="/assets/logo-streetalk.png" alt="STREETALK — Chat Anonima. Reale. Ora." class="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105" />`

### 2. Social Exchange Drawer Layout Contract
- Container: `#friend-request-unlocked-drawer .flex` has `flex-wrap: wrap !important;`
- Platform select: `#friend-social-platform` has `shrink-0`
- Handle input: `#friend-social-handle` has `min-w-0 !important;`
- Send button: `shareFriendSocial` button spans full width on narrow containers (`w-full`), never clipped from 320px to 1440px.

### 3. Chat Left Sidebar Contract
- Selector: `#chat-sidebar` has `display: none !important;` and `class="hidden"`.
- Container `#chat-main-area` (`flex: 1 1 0% !important; min-width: 0 !important; height: 100% !important;`) expands to 100% full screen width.
- CRITICAL: DOM elements inside `#chat-sidebar` are preserved in the HTML DOM tree so tests and lifecycle event handlers (`countdown-badge`, `btn-extension`, `friend-request-unlocked-drawer`, etc.) do not throw null reference errors.

### 4. Avatar Contract
- Storage keys: `streetalk_profile_v1` (JSON object with `.avatar`) and `streetalk_avatar` (plain string)
- Default avatar: `⚡`
- Available items: 58 total (10 custom SVG glyphs + 48 street-aesthetic emojis)
- Grids: `#full-profile-avatar-grid`, `#onboarding-avatar-grid`, `#profile-avatar-grid`
- Targets: `#header-profile-avatar`, `#chat-partner-avatar`

### 5. Thematic Groups & Founder Modal Contract
- `GET /api/groups`: Fetch current groups
- `POST /api/founder/unlock`: Payload `{ clientToken: string }` -> `{ ok: true, status: 'unlocked', badge: 'FONDATORE' }`
- `POST /api/groups`: Payload `{ title, description, category, qualification: { isFounder, karmaScore, strikeCount } }`
- Group creation qualification: `isFounder || (karma >= 100 && strikes === 0)`. If unqualified, open `#modal-founder-badge` (€2.99 price, 4 perks, simulated unlock). After unlock, automatically open `#modal-create-group`.

## Code Layout
- `frontend/app.js`: Source file for client bundle (compiled with `npm run build` to `public/app.min.js`)
- `index.html` & `public/index.html`: Must remain 100% byte-for-byte identical (SHA256 parity)
- `incrocio.css` & `public/incrocio.css`: Must remain 100% byte-for-byte identical (SHA256 parity)
- `street-editorial.css` & `public/street-editorial.css`: Must remain 100% byte-for-byte identical (SHA256 parity)
- `server.js`: Node.js Express server & Socket.IO handlers
- `tests/autonomous-suite.js`: Test suite (npm test)
