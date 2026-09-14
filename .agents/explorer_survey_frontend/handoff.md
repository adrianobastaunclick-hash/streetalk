# Handoff Report: Frontend & UI Architecture Survey (R1-R6)

**Agent**: Explorer Survey Frontend  
**Working Directory**: `d:\streetalk\.agents\explorer_survey_frontend`  
**Date**: 2026-09-14T21:08:00Z  
**Target Milestone**: M0 Architecture Survey for R1-R6  

---

## 1. Observation

### 1.1 Root vs. `public/` File Parity and Duplication
Through file hash comparisons and test suite audits, the relationship between root and `public/` was directly observed:
- **Identical Mirrored Files (Byte-for-byte matches)**:
  - `index.html` (150,742 bytes) ↔ `public/index.html` (150,742 bytes). Hash match verified.
  - `incrocio.css` (24,505 bytes) ↔ `public/incrocio.css` (24,505 bytes). Hash match verified.
  - `incrocio.js` (2,559 bytes) ↔ `public/incrocio.js` (2,559 bytes). Hash match verified.
  - `street-editorial.css` (7,416 bytes) ↔ `public/street-editorial.css` (7,416 bytes). Hash match verified.
  - `manifest.json` (347 bytes) ↔ `public/manifest.json` (347 bytes). Hash match verified.
  - `og-streetalk.svg` (3,391 bytes) ↔ `public/og-streetalk.svg` (3,391 bytes). Hash match verified.
  - `robots.txt` (355 bytes) ↔ `public/robots.txt` (355 bytes). Hash match verified.
  - `sitemap.xml` (927 bytes) ↔ `public/sitemap.xml` (927 bytes). Hash match verified.
  - `sw.js` (1,560 bytes) ↔ `public/sw.js` (1,560 bytes). Hash match verified.
  - `google33c12d417a750cbf.html` (55 bytes) ↔ `public/google33c12d417a750cbf.html` (55 bytes). Hash match verified.
  - `assets/gifs/*.svg` (18 files: `anime.svg`, `boombox.svg`, `cyber.svg`, `doge.svg`, `drive.svg`, `facepalm.svg`, `flame.svg`, `lol.svg`, `mindblown.svg`, `moon.svg`, `popcorn.svg`, `respect.svg`, `shock.svg`, `skate.svg`, `smart.svg`, `smoke.svg`, `vinyl.svg`, `wheeze.svg`) ↔ `public/assets/gifs/*.svg` (18 identical files).
- **Files with Intentional Differences**:
  - `vercel.json` (1,726 bytes in root vs 1,437 bytes in `public/`): root defines `"outputDirectory": "public"`, `"buildCommand": "npm run build"`, and `/api/:match*` proxy rewrite to Render. `public/vercel.json` contains runtime rewrites and headers only.
  - `.gitignore` (102 bytes in root vs 9 bytes in `public/`).
- **Files Only in Root**:
  - `frontend/app.js` (146,148 bytes, raw unbundled client source).
  - `scripts/tailwind.css` and build scripts (`scripts/extract-once.cjs`, `scripts/optimize-once.cjs`).
  - `server.js`, `lib/`, `tests/`, etc.
- **Files Only in `public/` (Build Outputs & Static Assets)**:
  - `public/app.min.js` (90,564 bytes): bundled and minified by `esbuild frontend/app.js --outfile=public/app.min.js --minify` (defined in `package.json:9`).
  - `public/utilities.css` (45,517 bytes): compiled from `scripts/tailwind.css` via Tailwind CLI.
  - `public/fonts.css` and `public/fonts/` (JetBrains Mono & Space Grotesk woff2 fonts).
  - `public/vendor/socket.io.min.js`.
  - `public/assets/icons/*.svg` (10 neo-brutalist glyphs: `street-bolt.svg`, `street-spray.svg`, `street-mask.svg`, `street-radar.svg`, `street-chain.svg`, `street-asphalt.svg`, `street-flame.svg`, `street-tape.svg`, `street-cassette.svg`, `street-seal.svg`).
  - `public/assets/street/*` (7 image textures/fallbacks).
- **Automated Parity Enforcement**:
  - `tests/autonomous-suite.js:1392`: `assert.strictEqual(indexContent, publicIndexContent, 'index.html and public/index.html must maintain byte-for-byte parity');`
  - `tests/autonomous-suite.js:1396`: `assert.strictEqual(incrocioCss, publicIncrocioCss, 'incrocio.css and public/incrocio.css must maintain byte-for-byte parity');`

---

### 1.2 R1: Quick Reaction Strip State
- **DOM in `index.html` (lines 1598-1611)**:
  ```html
  <!-- QUICK REACTION EMOJI DOCK -->
  <div class="px-3 sm:px-4 py-1.5 bg-[#0a0c13]/95 backdrop-blur-md border-t border-zinc-800/80 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar z-10 shrink-0">
    <span class="text-[9px] font-mono text-zinc-500 hidden sm:inline uppercase tracking-wider mr-1">Reagisci:</span>
    <div class="flex items-center gap-1 sm:gap-2">
      <button type="button" onclick="sendReaction('🔥')" class="reaction-btn text-sm" title="Fuoco">🔥</button>
      <button type="button" onclick="sendReaction('💀')" class="reaction-btn text-sm" title="Morto">💀</button>
      <button type="button" onclick="sendReaction('⚡')" class="reaction-btn text-sm" title="Flash">⚡</button>
      <button type="button" onclick="sendReaction('🖤')" class="reaction-btn text-sm" title="Cuore nero">🖤</button>
      <button type="button" onclick="sendReaction('🚬')" class="reaction-btn text-sm" title="Fumo">🚬</button>
      <button type="button" onclick="sendReaction('👀')" class="reaction-btn text-sm" title="Occhi">👀</button>
      <button type="button" onclick="sendReaction('🤯')" class="reaction-btn text-sm" title="Mind blown">🤯</button>
      <button type="button" onclick="sendReaction('👏')" class="reaction-btn text-sm" title="Applausi">👏</button>
    </div>
  </div>
  ```
- **Observed Deficiencies**:
  1. Emojis present: only 8 (`🔥`, `💀`, `⚡`, `🖤`, `🚬`, `👀`, `🤯`, `👏`). Missing the requested Flirt/Amore emojis: `💖`, `💋`, `😈`, `🌹`.
  2. In `server.js:1128`: `const allowedEmojis = ['🔥', '💀', '⚡', '🖤', '🚬', '👀', '🤯', '👏'];`. The server drops any reaction containing `💖`, `💋`, `😈`, `🌹` because of strict whitelist enforcement.
  3. In `frontend/app.js:2354-2357`:
     ```javascript
     function sendReaction(emoji) {
       if (!currentRoomId || !socket || !socket.connected) return;
       socket.emit('send_reaction', { roomId: currentRoomId, emoji });
     }
     ```
     Zero local spring-pop feedback, zero haptic vibration (`navigator.vibrate`), and local sender receives no instant Web Audio feedback until socket roundtrip.
  4. In `frontend/app.js:2359-2383` (`triggerReactionVisual`):
     Animation handles basic CSS translateY, but lacks neon glow / neon fade filter (e.g. `drop-shadow(0 0 12px ...)`) and spring pop bounce.

---

### 1.3 R2: GIF & Reaction Engine State
- **Root Cause of the "Duplicate Flame" Bug (Image 2)**:
  1. `frontend/app.js:1938-1941`:
     ```javascript
     img.onerror = () => {
       img.onerror = null;
       img.src = '/assets/gifs/flame.svg';
     };
     ```
  2. `frontend/app.js:3300-3303`:
     ```javascript
     img.onerror = () => {
       img.onerror = null;
       img.src = '/assets/gifs/flame.svg';
     };
     ```
  3. `frontend/app.js:1723-1796` (`STREET_GIF_CATALOG`): `{ label: 'Lit Fire', url: '/assets/gifs/flame.svg' }` is repeated in almost every category (`trend`, `street`, `reazioni`, `notte`, `anime`, `music`).
  4. `lib/gif-provider.js:483-485`:
     ```javascript
     const origin = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
     const resolveUrl = (u) => (u && u.startsWith('/') ? `${origin}${u}` : u);
     ```
     In browser environments (like Vercel production or different ports), prepending `http://localhost:3000` causes browser network failures (Mixed Content / connection refused), triggering `img.onerror` on all cards, transforming the entire grid into `flame.svg`.
- **Existing Categories vs Request**:
  - `index.html:1649-1657` and `lib/gif-provider.js:520-530`: defines 9 categories (`trend`, `street`, `reazioni`, `memes`, `lol`, `notte`, `cyberpunk`, `anime`, `music`).
  - No `flirt`, `amore`, or `spicy` category buttons or SVGs exist.
  - `tests/autonomous-suite.js:1435`: asserts exactly 9 categories with the old ID list:
    `assert(Array.isArray(catRes.categories) && catRes.categories.length === 9, 'Must offer all 9 street categories');`

---

### 1.4 R3: Sidebar Hub State
- **DOM in `index.html` (lines 1350-1530)**:
  - Inside `<aside id="chat-sidebar">`:
    - Top header: Active room indicator and "Radar" back button.
    - Partner Card (`chat-partner-avatar`, `chat-partner-nick`, `chat-partner-mood`, `chat-partner-gender`, `chat-partner-bio-container`).
    - Timer Cockpit (`chat-countdown`, `+5m` extension button, `Segnala` safety report button, `SALTA` button).
    - Pinned Secrets Area (`chat-my-secret-text`, `chat-partner-secret-box`, "SCHEDA (NO FOTO)" button opening `#modal-partner-profile`).
- **Observed Gaps**:
  - No "Richiedi Amicizia / Conoscenza" button exists in the sidebar.
  - No bilateral friend request state handling (Initial → Inviata → Ricevuta / Accetta → Sbloccata).
  - No optional social contact exchange drawer (Telegram / Instagram / Link).
  - No partner data persistence into a connections book.
  - Partner description details (motto, vision, topics, avoids) are hidden inside a separate modal (`#modal-partner-profile`) rather than accessible in the sidebar hub.

---

### 1.5 R4: Profile & Connections Book State
- **DOM in `index.html`**:
  - `#modal-profile` (lines 2363-2414): Quick edit modal with nickname input, SVG glyph grid, and bio input.
  - `#view-profilo` (lines 1825-2060): Full 2-column view with "Asphalt Passport" card live preview on the left and form inputs (Moniker, Glifo, Motto Notturno, Visioni Art. 2, Argomenti Art. 5, Linea Rossa Art. 3) on the right.
- **Observed Gaps**:
  - No **Street Karma** score display (flames received, 0 sanctions record, chat seniority).
  - No **Founder Badge** status or CTA to unlock.
  - No **Rubrica Connessioni** (saved partners list from bilateral friendships, their profiles, and exchanged social links).

---

### 1.6 R5: Bacheca Thematic Groups State
- **DOM in `index.html` (lines 1754-1820)**:
  - Inside `<main id="view-bacheca">`:
    - Title: "LA BACHECA DELLA NOTTE".
    - Mood filters: `TUTTI`, `Cazzeggio`, `Sfogati`, `Flirt`.
    - Wall Grid: `#bacheca-grid` displaying individual confession posters with 🔥 and 💀 reactions.
- **Observed Gaps**:
  - Completely missing a tab / switcher for **"Gruppi a Tema"** (thematic discussion tables).
  - No button or modal to "Crea Gruppo a Tema".
  - No hybrid qualification permission check (`hasFounderBadge || (karma >= 500 && sanctions === 0)`).
  - No educational modal explaining how unqualified users can qualify (Founder Badge or accumulating Karma).
  - No thematic group card list with active discussion topics and participant counts.

---

### 1.7 R6: Founder Badge Monetization Modal State
- **Current State**:
  - Zero monetization UI or modal exists in `index.html`.
  - No mention of Founder Badge, Stripe checkout simulation, or €2.99 pricing in `frontend/app.js`.

---

## 2. Logic Chain

### Chain 1: File Duplication and Build Pipeline
1. `package.json` defines `"build": "tailwindcss -i scripts/tailwind.css -o public/utilities.css --minify && esbuild frontend/app.js --outfile=public/app.min.js --minify"`.
2. `server.js:73` serves static assets from `path.join(__dirname, 'public')`.
3. `tests/autonomous-suite.js:1392, 1396` strictly checks byte-for-byte identity between root `index.html` and `public/index.html`, and `incrocio.css` and `public/incrocio.css`.
4. Therefore: Any frontend changes made to `index.html`, `incrocio.css`, `street-editorial.css`, or asset files MUST be mirrored synchronously to `public/`, and any change to `frontend/app.js` MUST be compiled to `public/app.min.js` via `esbuild`.

### Chain 2: Resolving the Flame Fallback Bug (R2)
1. `frontend/app.js:1940` and `frontend/app.js:3302` unconditionally set `img.src = '/assets/gifs/flame.svg'` whenever `img.onerror` triggers.
2. In `lib/gif-provider.js:483`, URLs are normalized using `http://localhost:3000`, causing browser HTTPS mixed content blocking on remote/production deployments.
3. In `frontend/app.js:1723-1796`, `STREET_GIF_CATALOG` reuses `flame.svg` for multiple items in every category.
4. When any image fails, every card in the 3x3 grid displays `flame.svg`, creating the visual bug shown in Image 2.
5. Therefore: To fix the bug, the system requires:
   - Unique, animated SVG vector cards for each reaction and category (specifically adding Flirt, Amore, Spicy graphics).
   - Relative URL resolution without hardcoded localhost prefix.
   - Intelligent per-category fallback graphics in `img.onerror` instead of universal `flame.svg`.

### Chain 3: Quick Reaction Strip End-to-End Realtime Integrity (R1)
1. In `index.html:1602-1609`, only 8 emoji buttons exist.
2. In `server.js:1128`, `allowedEmojis` drops any emoji outside `['🔥', '💀', '⚡', '🖤', '🚬', '👀', '🤯', '👏']`.
3. Adding `💖`, `💋`, `😈`, `🌹` to the frontend without updating `server.js:1128` would cause the server to drop the reactions silently.
4. In `frontend/app.js:2354`, `sendReaction` emits the socket event but does not trigger local audio or micro-interaction on the button.
5. Therefore: R1 requires coordinated updates across:
   - `index.html` and `public/index.html`: 12 reaction buttons with active spring-pop classes.
   - `frontend/app.js`: local immediate spring pop + haptic (`navigator.vibrate`) + Web Audio (`SoundEngine.playReaction()`) + enhanced neon-glowing floating burst in `triggerReactionVisual`.
   - `server.js`: expand whitelist to 12 emojis.

### Chain 4: Bilateral Double-Consensus Friend Request (R3)
1. Anonymous chat rooms in STREETALK operate in volatile RAM with strict 180s/480s lifespan.
2. To allow persistent connection without violating chat anonymity, bilateral double consensus is required before room destruction.
3. If Client A requests friendship, Client B must receive a discrete notification in their sidebar without disrupting the text stream.
4. When Client B accepts (double consensus):
   - A mutual event unlocks the connection.
   - The partner's profile is saved into local storage (`streetalk_connections_v1`).
   - A dedicated optional social contact exchange field opens in the sidebar.
5. Therefore: R3 requires new UI states in the sidebar, supported by socket events `request_friendship`, `receive_friendship_request`, `accept_friendship`, `friendship_unlocked`, and `exchange_social`.

### Chain 5: Profile Enhancement & Connections Book (R4)
1. `view-profilo` already contains the descriptive identity editor (moniker, motto, vision, topics, avoids, avatar).
2. Users currently have no visibility into their Street Karma or Founder status, and have no interface to view saved friends.
3. Therefore: `view-profilo` should be enhanced with:
   - A **Street Karma HUD**: calculating score from fiamme received, clean StreetBot record (0 sanctions), and completed chats.
   - A **Founder Badge Card**: showcasing perks with unlock trigger.
   - A **Rubrica Connessioni**: tabbed list of bilateral connections with full profile inspection and saved social tags.

### Chain 6: Bacheca Thematic Groups Hybrid Creation (R5)
1. `view-bacheca` currently only renders static/curated single confessions.
2. Group discussions need a separate section to avoid cluttering confession reading.
3. Creating underground discussion tables must be gated to maintain high conversation quality (anti-spam / anti-troll).
4. The hybrid rule allows creation if: `isFounder || (karma >= 500 && sanctions === 0)`.
5. Non-qualified users must receive an actionable explanation (upselling Founder Badge or encouraging respectful chat to build Karma).
6. Therefore: R5 requires a sub-tab in `view-bacheca`, a modal for group creation, a modal for locked explanation, and thematic group cards.

### Chain 7: Founder Badge Monetization Modal (R6)
1. STREETALK's core 1v1 anonymous chat must remain 100% free with zero paywalls on basic communication (per AGENTS.md).
2. The Founder Badge is a one-time launch supporter badge (€2.99) that provides vanity perks and administrative perks (creation of thematic groups, gold badge, priority radar, exclusive GIF/reactions).
3. Therefore: A sleek modal `#modal-founder-badge` with clear benefits, transparent zero-subscription messaging, and simulated Stripe-ready instant checkout will fulfill R6.

---

## 3. Caveats

1. **No External Backend / Real Stripe in Local Mode**: Per AGENTS.md, local M0 scope does not allow live Stripe keys or cloud credit card processing. The checkout must be simulated as a Stripe-ready frontend transaction flow that sets local activation state.
2. **`tests/autonomous-suite.js` Test 19.2 Assertion**: Test 19.2 specifically checks `catRes.categories.length === 9` and tests for specific category IDs. When updating GIF categories to include Flirt and Amore, this assertion must be thoughtfully aligned in the test suite so `npm test` continues to pass with 100% success rate.
3. **No Unsanctioned Frameworks**: Tailwind CLI and ESbuild are the existing pipeline. No React, Vue, or external UI libraries should be introduced.

---

## 4. Conclusion & Recommended Implementation Plan

### 4.1 DOM Targets & Architecture Blueprint

| Req | Component | Exact File & DOM Target | Changes / Additions |
|---|---|---|---|
| **R1** | Quick Reaction Strip | `index.html:1598-1611` (`#view-chat`), `frontend/app.js:2354-2383`, `server.js:1128` | Add 4 buttons (`💖`, `💋`, `😈`, `🌹`); add spring-pop CSS & active states; trigger Web Audio & haptic on click; add neon drop-shadow glow to floating layer; update server whitelist. |
| **R2** | GIF & Reaction Engine | `index.html:1648-1658`, `frontend/app.js:1723-1950, 3279-3303`, `lib/gif-provider.js:250-530`, `assets/gifs/` | Add SVG assets for `flirt`, `amore`, `spicy`; replace `flame.svg` hardcoded fallbacks with distinct per-category vectors; fix `resolveUrl` origin; update category tabs and tests. |
| **R3** | Sidebar Hub & Friendship | `index.html:1350-1530` (`<aside id="chat-sidebar">`), `frontend/app.js`, `server.js` | Reorganize sidebar; add `#chat-friend-request-container`; implement bilateral double-consensus state machine; add optional social exchange drawer; save to `localStorage.streetalk_connections_v1`. |
| **R4** | Profile & Connections | `index.html:1825-2060` (`#view-profilo`), `frontend/app.js:2530-2670` | Add Street Karma Score Cockpit; add Founder Badge status card; add "Rubrica Connessioni" section/tab with friend cards, details modal, and social links. |
| **R5** | Bacheca Thematic Groups | `index.html:1754-1820` (`#view-bacheca`), `frontend/app.js:759-855` | Add tab switcher (Confessioni vs Gruppi a Tema); add "+ Apri Gruppo a Tema" CTA; implement hybrid qualification check modal and gate modal; render active thematic tables. |
| **R6** | Founder Badge Modal | `index.html` (new `#modal-founder-badge`), `frontend/app.js` | Neo-brutalist modal with gold/neon aesthetic, €2.99 one-time pricing, perks breakdown, Stripe-ready simulation button, and instant state activation. |

### 4.2 Step-by-Step Implementation Sequence for Engineering Team
1. **Assets & Categories (R2)**:
   - Create animated SVG reaction files for Flirt (`heart.svg`, `wink.svg`), Amore (`kiss.svg`, `rose.svg`), and Spicy (`spicy.svg`, `devil.svg`) in both `assets/gifs/` and `public/assets/gifs/`.
   - Update `lib/gif-provider.js` with new categories and distinct fallback items.
   - Update `tests/autonomous-suite.js` Test 19.2 to validate the updated category catalog.
2. **Reaction Strip & Server Whitelist (R1)**:
   - Update `server.js` allowed emojis list.
   - Update `index.html` and `public/index.html` reaction dock with 12 emojis.
   - Enhance `sendReaction` and `triggerReactionVisual` in `frontend/app.js` with spring pop, Web Audio, haptic pulse, and neon fade.
3. **Sidebar Hub & Bilateral Friend Request (R3)**:
   - Restructure sidebar in `index.html` and `public/index.html`.
   - Implement friendship request & bilateral consensus handling in `server.js` and `frontend/app.js`.
   - Implement optional social exchange UI and local storage persistence.
4. **Profile & Connections Book (R4)**:
   - Add Street Karma, Founder Badge, and Rubrica Connessioni sections to `#view-profilo`.
   - Implement connection listing and partner inspection in `frontend/app.js`.
5. **Bacheca Thematic Groups (R5)**:
   - Add "Gruppi a Tema" tab in `#view-bacheca`.
   - Implement hybrid permission check (`isFounder || (karma >= 500 && sanctions === 0)`).
   - Implement creation modal and explanation modal.
6. **Founder Badge Monetization Modal (R6)**:
   - Add `#modal-founder-badge` to `index.html` and `public/index.html`.
   - Implement Stripe-ready simulated payment transaction in `frontend/app.js`.
   - Add Founder styling / perks across profile and sidebar.
7. **Compilation & Parity Verification**:
   - Run `npm run build` (`esbuild` and `tailwindcss`).
   - Sync root `index.html`, `incrocio.css` with `public/`.
   - Run `npm test` and verify 100% pass rate.

---

## 5. Verification Method

To independently verify these findings:
1. **File Parity Verification**:
   Run powershell hash checks:
   ```powershell
   Get-ChildItem -File | ForEach-Object { $name = $_.Name; $pub = Join-Path "public" $name; if (Test-Path $pub) { $h1 = (Get-FileHash $_.FullName).Hash; $h2 = (Get-FileHash $pub).Hash; "$name: $(if ($h1 -eq $h2) {'IDENTICAL'} else {'DIFFERENT'})" } }
   ```
2. **Current Test Suite**:
   Run `npm test` in `d:\streetalk`. Confirm that all 99 existing tests pass and observe the exact assertions in Test 18.5 (parity) and Test 19.2 (GIF categories).
3. **Inspecting Emoji Whitelist**:
   Inspect `server.js:1128` to confirm the 8-emoji restriction.
4. **Inspecting Flame Fallback Bug**:
   Inspect `frontend/app.js:1940`, `frontend/app.js:3302`, and `lib/gif-provider.js:483` to verify the hardcoded `/assets/gifs/flame.svg` fallbacks.
5. **Inspecting Profile and Bacheca**:
   Inspect `index.html:1754-1820` (`#view-bacheca`) and `index.html:1825-2060` (`#view-profilo`) to verify the exact current layout and missing sections.
