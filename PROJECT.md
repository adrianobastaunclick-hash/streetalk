# Project: STREETALK Sustainable Social Evolution

## Architecture
- **Runtime**: Node.js (CommonJS) + Express 4.19.2 + Socket.IO 4.7.5.
- **Frontend**: Vanilla JS (`frontend/app.js` compiled to `public/app.min.js`), HTML5 (`index.html` ↔ `public/index.html`), CSS (`incrocio.css` ↔ `public/incrocio.css`, `public/utilities.css`).
- **Realtime**: Socket.IO events for ephemeral rooms, reactions, bilateral friend requests, group chats.
- **Data & State**:
  - Ephemeral chat rooms & secrets in volatile RAM (zero DB persistence, 180s/300s lifecycles).
  - StreetBot moderation in RAM (IP strikes).
  - Thematic groups in RAM (`thematicGroups = new Map()`).
  - Connections Book & User Profile in client `localStorage` (`streetalk_connections_v1`, `streetalk_profile_v1`).
  - Founder Badge simulated state in client storage & socket handshake.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R1. Quick Reaction Strip | Interactive 12-emoji dock, Web Audio API sound generator, spring pop/haptic, send_reaction realtime event with neon floating burst | M1 | ORIGINAL_REQUEST §R1 |
| 2 | R2. GIF & Reaction Engine | Elimination of duplicate flame.svg fallback, 13 new animated SVGs for Flirt, Amore, Spicy, category fallback matrix, search/filter | M2 | ORIGINAL_REQUEST §R2 |
| 3 | R3. Sidebar Hub & Friend Request | Partner details hub, bilateral double-consensus friend request, Connections Book unlock, optional social handle exchange | M3 | ORIGINAL_REQUEST §R3 |
| 4 | R4. Profile & Connections Book | Descriptive profile editor, Street Karma HUD, Founder Badge display, Rubrica Connessioni list & partner inspection | M4 | ORIGINAL_REQUEST §R4 |
| 5 | R5. Bacheca Thematic Groups | "Gruppi a Tema" tab in Bacheca, volatile in-memory groups, hybrid creation permission (Founder OR Karma>=150 with 0 strikes), guidance modal | M5 | ORIGINAL_REQUEST §R5 |
| 6 | R6. Founder Badge Monetization | €2.99 one-time supporter modal (Stripe-ready simulation), visual perks (gold badge, VIP glow, group creation, radar priority), 100% free 1v1 chat invariance | M6 | ORIGINAL_REQUEST §R6 |
| 7 | E2E Autonomous Test Suite | Expansion of tests/autonomous-suite.js with TEST 20-25 covering R1-R6, maintaining 100% pass rate and byte-for-byte root/public parity | M7 | ORIGINAL_REQUEST §Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | R1: Quick Reaction Strip | 12-emoji bar, Web Audio synthesizer, haptic, server whitelist, neon float | none | PLANNED |
| M2 | R2: GIF Engine & Reaction Assets | 13 animated SVGs in assets/gifs & public/assets/gifs, category fallback map, lib/gif-provider.js fix | M1 | PLANNED |
| M3 | M3: Realtime Backend & Socket Contracts | server.js: allowedEmojis, friend request double-consensus, thematic groups REST/sockets, founder unlock endpoint | M1, M2 | PLANNED |
| M4 | M4: Sidebar Hub & Friendship Flow | index.html + public/index.html sidebar, frontend/app.js friend request state machine, social exchange drawer, localStorage | M3 | PLANNED |
| M5 | M5: Profile, Karma & Connections Book | view-profilo HUD, Street Karma calculation, Rubrica Connessioni, founder card | M4 | PLANNED |
| M6 | M6: Bacheca Thematic Groups & Founder Modal | view-bacheca groups tab, hybrid qualification check, group creation modal, #modal-founder-badge | M5 | PLANNED |
| M7 | M7: E2E Test Suite & Parity Verification | tests/autonomous-suite.js (TEST 20-25), esbuild/tailwind build, root/public parity check, forensic audit | M1-M6 | PLANNED |

## Interface Contracts

### 1. Reaction Event
- Client -> Server: `send_reaction`: `{ roomId: string, emoji: string }` or `emoji: string`
- Allowed Emojis: `['🔥', '💀', '⚡', '🖤', '🚬', '👀', '🤯', '👏', '💖', '💋', '😈', '🌹']`
- Server -> Room: `receive_reaction`: `{ senderId: string, emoji: string }`

### 2. Bilateral Friend Request
- Client -> Server: `send_friend_request`: `{ roomId: string }`
- Server -> Partner: `friend_request_received`: `{ from: string }`
- Server -> Both: `friend_request_matched`: `{ partnerId: string, partnerProfile: object }`
- Client -> Server: `share_friend_contact`: `{ roomId: string, handle: string, platform: string }`
- Server -> Partner: `friend_contact_received`: `{ handle: string, platform: string }`

### 3. Thematic Groups API & Sockets
- `GET /api/groups`: returns `{ ok: true, groups: Array<Group> }`
- `POST /api/groups`: payload `{ title, description, category, qualification: { isFounder, karmaScore, strikeCount } }`
  - Success: `201 Created` `{ ok: true, group: Group }`
  - Unqualified: `403 Forbidden` `{ ok: false, code: 'NOT_QUALIFIED', error: string }`

### 4. Founder Badge Simulation API
- `POST /api/founder/unlock`: payload `{ clientToken: string }` -> returns `{ ok: true, status: 'unlocked', badge: 'FONDATORE' }`

## Code Layout
- `server.js`: Express endpoints & Socket.IO handlers
- `lib/gif-provider.js`: GIF search, trending, categories
- `lib/street-bot.js`: IP moderation & strike rules
- `frontend/app.js`: Client-side logic, SoundEngine, UI state, Socket.IO client
- `index.html` & `public/index.html`: Main HTML application views
- `incrocio.css` & `public/incrocio.css`: Custom UI styles & animations
- `assets/gifs/` & `public/assets/gifs/`: Animated reaction SVGs
- `tests/autonomous-suite.js`: Autonomous test harness
