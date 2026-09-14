# STREETALK // Asset Pipeline & Test Suite Survey Handoff Report

**Agent**: Assets & Testing Explorer  
**Working Directory**: `d:\streetalk\.agents\explorer_survey_assets_tests`  
**Date / Timestamp**: 2026-09-14T21:08:00Z  
**Context**: Investigation of test suite architecture (`npm test`), asset inventory (`flame.svg`, reaction SVGs/emojis), Web Audio API synthesis for R1, multi-category animated visual assets for R2, and end-to-end automated test strategy for R1-R6.

---

## 1. Observation

### 1.1 Test Suite Architecture & Current Execution State
* **Execution Command**: `npm test` is defined in `d:\streetalk\package.json`:
  ```json
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "node tests/autonomous-suite.js",
    "build": "tailwindcss -i scripts/tailwind.css -o public/utilities.css --minify && esbuild frontend/app.js --outfile=public/app.min.js --minify"
  }
  ```
* **Test Runner**: Custom zero-dependency Node.js autonomous test harness in `tests/autonomous-suite.js`, utilizing `tests/local-test-runtime.js` for ephemeral port binding (`server.listen(0, '127.0.0.1')`), clean socket disconnection, and strict test environment isolation.
* **Execution Time & Current Pass Rate**:
  * Command: `npm test` executed on Windows loopback.
  * Duration: **10.87 seconds** (synchronous run).
  * Current Result: **99 PASSED, 0 FAILED** (100% pass rate, exit code 0).
* **Test Inventory in `tests/autonomous-suite.js` (19 Test Suites)**:
  * `TEST 1`: Volatile Memory Baseline Audit (RAM zero check for users, rooms, queue, queues.cazzeggio/sfogati/flirt).
  * `TEST 2`: SocketContractValidator (Negative tests: secret length 3-90, gender enum validation, profile schema).
  * `TEST 3`: DOMSafetyFilter & XSS Neutralization (`safeSetText`, script/img injection, render.yaml envs).
  * `TEST 4`: AudioSynthesisEngine (Zero MP3 Dependencies).
  * `TEST 5`: Concurrency Matchmaking & Secret Swapping (20 virtual clients, 10 pairings in <500ms, deterministic FIFO).
  * `TEST 6`: High-Throughput Chat & Room Isolation (50 messages across 10 rooms, ephemeral audio/gif messages).
  * `TEST 7`: Room Extension (+5 Min) Mutual Consent (`request_extension` double consent).
  * `TEST 8`: Realtime Emoji Reaction Bursts (`send_reaction` object and raw string formats).
  * `TEST 9`: User Report & Temporary IP Jail (`report_user`, immediate shield shutdown, IP_JAILED code).
  * `TEST 10`: VolatileMemoryLeakAuditor (100% RAM cleanup after skip/disconnect, heap memory baseline recovery).
  * `TEST 11`: ThreeWebGLRendererOptimizer & Three-FPS-Profiler (headless math throughput, 60 FPS profile).
  * `TEST 12`: Stale Socket Matchmaking & Ghost Pair Pruning (disconnect in queue handling).
  * `TEST 13`: Supabase Integration & Cloud REST Endpoints (`/api/stats`, `/api/supabase/status`, archiveSecret refuses private text).
  * `TEST 14`: Technical SEO, Schema.org Graph & Crawlability (`robots.txt`, `sitemap.xml`, `og-streetalk.svg`, 14+ age check, DSA contact).
  * `TEST 15`: Autonomous Growth Network, Creative Media & Blueprint Audit (Role definition toml files, Nano Banana 2, Google Veo, /api/stats funnel).
  * `TEST 16`: StreetBot — Realtime Moderation & 3-Strike Rule (threat/insult/spam detection, strike 1-3 escalation).
  * `TEST 17`: Non-Typical Descriptive Profile Area (Art. 1 Compliance, zero photo inputs, socket profile exchange).
  * `TEST 18`: Street Puro Visual Identity, Higgsfield AI Pipeline & Vector Iconography (manifest, fallback SVGs, 10 icons, HTML/CSS byte-for-byte parity).
  * `TEST 19`: Multi-Provider GIF Database & 3D Chat Navigation Engine (`/api/gifs/categories`, `/api/gifs/trending`, `/api/gifs/search`, RAM TTL cache, 3D CSS).

### 1.2 Asset Inventory
* **SVG Vector Assets in Workspace**:
  * Root `assets/gifs/` (18 files):
    `anime.svg`, `boombox.svg`, `cyber.svg`, `doge.svg`, `drive.svg`, `facepalm.svg`, `flame.svg`, `lol.svg`, `mindblown.svg`, `moon.svg`, `popcorn.svg`, `respect.svg`, `shock.svg`, `skate.svg`, `smart.svg`, `smoke.svg`, `vinyl.svg`, `wheeze.svg`.
  * Public `public/assets/gifs/` (18 files): Byte-for-byte identical duplicates of root `assets/gifs/`.
  * Public `public/assets/icons/` (10 files): Custom neo-brutalist glyphs:
    `street-asphalt.svg`, `street-bolt.svg`, `street-cassette.svg`, `street-chain.svg`, `street-flame.svg`, `street-mask.svg`, `street-radar.svg`, `street-seal.svg`, `street-spray.svg`, `street-tape.svg`.
  * Public `public/assets/street/` (7 files):
    `asphalt_grunge.jpg`, `asphalt_grunge_fallback.svg`, `hazard_tape.svg`, `hero_ambient.jpg`, `hero_ambient_fallback.svg`, `radar_sonar.jpg`, `radar_sonar_fallback.svg`.
* **The Root-Cause Bug of `flame.svg` Duplicate Fallback**:
  * Direct observation in `assets/gifs/flame.svg` (and `public/assets/gifs/flame.svg`):
    An animated SVG card (320x240) containing `@keyframes flameWave`, pulsing ring, top badge "TREND", and central `🔥` emoji.
  * Direct observation in `frontend/app.js:1938-1941` and `public/app.min.js`:
    ```javascript
    img.onerror = () => {
      img.onerror = null;
      img.src = '/assets/gifs/flame.svg';
    };
    ```
  * Direct observation in `frontend/app.js:2244-2247`:
    ```javascript
    const d = document.createElement("img");
    d.src = l;
    d.onerror = () => {
      d.onerror = null;
      d.src = "/assets/gifs/flame.svg";
    };
    ```
  * Direct observation in `frontend/app.js:1723-1790` (`STREET_GIF_CATALOG`):
    `flame.svg` is repeatedly mapped across multiple categories (`trend`, `street`, `reazioni`, `notte`, `anime`, `music`).
  * When external GIF endpoints (Tenor/Giphy) fail due to network, CORS, rate limits, or adblockers, **every single grid card and chat bubble triggers `img.onerror` and resets its source to `/assets/gifs/flame.svg`**, causing the duplicate flame flood observed in the user's issue description.

### 1.3 Strict Constraints Discovered in Existing Code & Tests
* **Audio Constraint (TEST 4)**:
  Direct observation in `tests/autonomous-suite.js:350-361`:
  ```javascript
  // TEST 4: Skill AudioSynthesisEngine (Zero MP3 Dependencies)
  if (indexHtml.includes('SoundEngine') && indexHtml.includes('createOscillator') && indexHtml.includes('createGain')) {
    pass('SoundEngine utilizes native Web Audio API synthesis');
  } else {
    fail('Web Audio API synthesis missing in frontend');
  }

  if (!indexHtml.includes('.mp3') && !indexHtml.includes('.wav') && !indexHtml.includes('.ogg')) {
    pass('Zero external audio files (.mp3, .wav, .ogg) referenced');
  } else {
    fail('External audio dependencies detected in index.html');
  }
  ```
  **Any reference to `.mp3`, `.wav`, or `.ogg` in `index.html` causes `npm test` to immediately FAIL.**
* **Realtime Reaction Constraint in `server.js:1128-1129`**:
  ```javascript
  const allowedEmojis = ['🔥', '💀', '⚡', '🖤', '🚬', '👀', '🤯', '👏'];
  if (!allowedEmojis.includes(emoji)) return;
  ```
  The server strictly drops any emoji not in this 8-element array. The 4 new flirt/amore emojis (`💖`, `💋`, `😈`, `🌹`) requested in R1 are currently **rejected and dropped** by `server.js`.
* **GIF Categories Constraint in `tests/autonomous-suite.js:1435-1440` (TEST 19.2)**:
  ```javascript
  assert(Array.isArray(catRes.categories) && catRes.categories.length === 9, 'Must offer all 9 street categories');
  const expectedCats = ['trend', 'street', 'reazioni', 'memes', 'lol', 'notte', 'cyberpunk', 'anime', 'music'];
  for (const exp of expectedCats) {
    assert(catRes.categories.some(c => c.id === exp), `Category ${exp} must be registered`);
  }
  ```
  TEST 19.2 verifies `length === 9` and tests the 9 legacy category IDs. If categories are expanded to include `flirt`, `amore`, `spicy`, TEST 19.2 must be updated or adapted so that `npm test` continues to pass at 100%.

---

## 2. Logic Chain

### 2.1 Audio Strategy for R1 (Web Audio API vs Audio Files)
1. **Observation**: `autonomous-suite.js:357` asserts `!indexHtml.includes('.mp3') && !indexHtml.includes('.wav') && !indexHtml.includes('.ogg')`.
2. **Inference**: Bundling or referencing `.mp3`, `.wav`, or `.ogg` audio files is structurally forbidden by the project's autonomous test harness.
3. **Observation**: `frontend/app.js:992-1250` implements a full `SoundEngine` using native `AudioContext`, `createOscillator()`, `createGain()`, and `createBiquadFilter()`. It already features procedural synthesizers for `playRadarSweep()`, `playMatchSound()` (808 sub-bass punch), `playMsgSent()`, `playMsgReceived()`, `playReaction()`, and `playWarning()`.
4. **Conclusion**: The audio strategy for R1 **must strictly be Web Audio API parametric synthesis**.
5. **Technical Design for R1 Reaction Sounds**:
   * Enhance `SoundEngine.playReaction(type)` with 3 distinct acoustic signatures:
     * **Energy / Street** (`🔥`, `⚡`, `🤯`, `👏`): Double rising sine chirp (`440Hz -> 660Hz -> 990Hz`, 120ms total, punchy gain envelope).
     * **Flirt / Romance** (`💖`, `💋`, `🌹`, `🖤`): Warm harmonic shimmer using twin triangle oscillators tuned to a major third (`587Hz` [D5] and `740Hz` [F#5]) with exponential decay (`linearRampToValueAtTime(0.18, now + 0.02)`, `exponentialRampToValueAtTime(0.001, now + 0.32)`), simulating a glowing neon bell.
     * **Spicy / Cheeky** (`😈`, `💀`, `🚬`, `👀`): Low pitch bend (`260Hz -> 180Hz` triangle) paired with a rapid high tick (`1200Hz -> 1800Hz` sine), generating tactile comedic feedback.
   * On-click spring pop: Immediately invoke `SoundEngine.playReaction()` on click to eliminate round-trip latency.

### 2.2 Functional Fix & Visual Pop for R1 Quick Reaction Bar
1. **Observation**: `index.html:1602-1609` contains only 8 buttons with inline `onclick="sendReaction('🔥')"`.
2. **Observation**: `frontend/app.js:2354-2357` only emits to the socket; it does not trigger visual feedback for the sender until `socket.on('receive_reaction')` is received from the server.
3. **Inference**: If network latency is high or connection is flaky, the sender feels zero responsiveness.
4. **Resolution**:
   * Update `index.html` (and `public/index.html` identically) to render 12 reaction buttons:
     `🔥`, `💀`, `⚡`, `🖤`, `🚬`, `👀`, `🤯`, `👏`, `💖`, `💋`, `😈`, `🌹`.
   * Add CSS spring pop animation:
     ```css
     .reaction-btn:active {
       transform: scale(1.4) translateY(-4px);
       filter: drop-shadow(0 0 10px #ff652f);
       transition: transform 0.08s cubic-bezier(0.175, 0.885, 0.32, 1.4);
     }
     ```
   * Update `frontend/app.js:sendReaction(emoji)`:
     1. Trigger immediate local micro-animation (`el.classList.add('reaction-popped')`).
     2. Play parametric Web Audio tone immediately via `SoundEngine.playReaction(emoji)`.
     3. Emit `send_reaction` event `{ roomId: currentRoomId, emoji }`.
   * Update `server.js:1128`: expand `allowedEmojis` to include all 12 emojis:
     `const allowedEmojis = ['🔥', '💀', '⚡', '🖤', '🚬', '👀', '🤯', '👏', '💖', '💋', '😈', '🌹'];`

### 2.3 Asset Solution for R2: Distinct Animated SVGs & Multi-Category Architecture
1. **Observation**: The user request explicitly demands:
   * Elimination of the single fallback `flame.svg`.
   * Dedicated categories: **"Trend"**, **"Street"**, **"Flirt"**, **"Amore"**, **"Spicy"**, **"LOL"**, **"Notte"**.
   * Distinct, lightweight animated graphics for every single item without external broken URLs.
2. **Technical Implementation**:
   * **Category Standardization**:
     Define the core 7 categories required by R2 while preserving backwards compatibility:
     1. `trend` (Trend - 🔥)
     2. `street` (Street - 🏙️)
     3. `flirt` (Flirt - 💋)
     4. `amore` (Amore - 💖)
     5. `spicy` (Spicy - 🌶️)
     6. `lol` (LOL - 😂)
     7. `notte` (Notte - 🌙)
     *(Plus legacy aliases/support for `reazioni`, `memes`, `cyberpunk`, `anime`, `music`)*.
   * **New Vector Graphics to Create** (placed identically in `assets/gifs/` and `public/assets/gifs/`):
     * *Flirt*:
       * `kiss.svg`: 💋 Neon Kiss (Hot Pink `#ff2a85`, pulsing heart rings, `@keyframes kissPucker`).
       * `wink.svg`: 😉 Wink Glint (Bubblegum `#f472b6`, iris spark, `@keyframes winkFlash`).
       * `devil.svg`: 😈 Sweet Devil (Electric Violet `#a855f7`, glowing horns, `@keyframes devilBob`).
       * `rose.svg`: 🌹 Neon Rose (Crimson `#f43f5e`, blooming glow, `@keyframes roseGlow`).
       * `sparkle.svg`: ✨ Flirt Sparkle (Champagne Gold `#fbbf24`, glittering stars, `@keyframes sparkTwinkle`).
     * *Amore*:
       * `heart_pulse.svg`: 💖 Beating Heart (Deep Rose `#e11d48`, rhythmic dual-beat 72 BPM, `@keyframes heartDoubleBeat`).
       * `hearts.svg`: 💕 Twin Hearts (Neon Pink `#ff4d6d`, orbital swirl, `@keyframes twinOrbit`).
       * `love_letter.svg`: 💌 Secret Note (Soft Coral `#fb7185`, floating envelope with neon seal).
       * `cupid.svg`: 💘 Cupid Bolt (Vivid Amber `#f59e0b`, darting neon arrow).
       * `love_lock.svg`: 🔐 Street Lock (Neon Gold `#eab308`, pulsing keyhole beam).
     * *Spicy*:
       * `chili.svg`: 🌶️ Red Chili (Fire Red `#ef4444`, flame trail, `@keyframes chiliFlicker`).
       * `purple_flame.svg`: 💜 Violet Heat (Deep Purple `#9333ea`, plasma combustion wave).
       * `cherries.svg`: 🍒 Sweet Danger (Ruby `#be123c`, glistening highlight swing).
   * **Category-Specific Fallback Matrix**:
     Eliminate the blanket `flame.svg` fallback in `frontend/app.js:1938` and `2244`.
     Replace with a deterministic category fallback lookup:
     ```javascript
     const CATEGORY_FALLBACK_MAP = {
       flirt: '/assets/gifs/kiss.svg',
       amore: '/assets/gifs/heart_pulse.svg',
       spicy: '/assets/gifs/chili.svg',
       trend: '/assets/gifs/flame.svg',
       street: '/assets/gifs/drive.svg',
       lol: '/assets/gifs/lol.svg',
       notte: '/assets/gifs/moon.svg',
       reazioni: '/assets/gifs/shock.svg',
       memes: '/assets/gifs/smart.svg',
       cyberpunk: '/assets/gifs/cyber.svg',
       anime: '/assets/gifs/anime.svg',
       music: '/assets/gifs/vinyl.svg'
     };
     ```
     When an image fails:
     ```javascript
     img.onerror = () => {
       img.onerror = null;
       const fallback = CATEGORY_FALLBACK_MAP[item.category] || '/assets/gifs/sparkle.svg';
       img.src = fallback;
     };
     ```
     This ensures that even if external CDNs are completely blocked, each category renders its own distinct visual asset.

### 2.4 Chat Sidebar Hub & Bilateral Friend Request Protocol (R3)
1. **Observation**: `server.js:1071-1105` already provides a battle-tested pattern for bilateral double-consent in `handleExtensionRequest`:
   * Uses `room.extensions = new Set()`.
   * When `room.extensions.size === 1`, emits notification to partner.
   * When `room.extensions.size >= 2`, triggers bilateral grant event to both sockets.
2. **Protocol Design for R3**:
   * **Event**: `request_friendship` (payload: `{ roomId }`).
   * **Server Processing**:
     * Verify caller is currently active in `roomId`.
     * Store request: `room.friendRequests = room.friendRequests || new Set(); room.friendRequests.add(socket.id);`
     * If `room.friendRequests.size === 1`:
       Emit `friend_request_received` to partner (`socket.to(roomId).emit(...)`).
       Sidebar updates partner's UI with a pulsing notification badge and "Accetta Connessione" button.
     * If `room.friendRequests.size >= 2`:
       Emit `friendship_unlocked` to both room participants (`io.to(roomId).emit(...)`).
       Both clients automatically persist partner profile into their local Connections Address Book (`streetalk_connections_v1`).
       UI reveals the optional mutual social-exchange modal (Telegram/Instagram/Link).
   * **Event**: `share_social_contact` (payload: `{ roomId, handle, platform }`).
     * Permitted ONLY when `room.friendRequests.size >= 2`.
     * Sanitized via `DOMSafetyFilter` and emitted strictly to `socket.to(roomId)`.

### 2.5 Profile Section & Connections Address Book (R4)
1. **Observation**: `index.html:1918-2040` (`#view-profilo`) currently allows editing nickname, motto, vision, topics, avoids, and selecting an avatar.
2. **Expansion**:
   * Add **Street Karma** HUD:
     * Base: 10 pts.
     * Completed chat (180s full run): +5 pts.
     * Received reaction: +1 pt.
     * Friendship connection unlocked: +15 pts.
     * Penalty for Strike 1: -20 pts.
     * Penalty for Strike 2: -50 pts.
     * Minimum clamp: 0 pts.
   * Add **Badge Fondatore** display:
     * Golden badge chip (`#profile-founder-badge`) showing "FONDATORE" or "DIVENTA FONDATORE" trigger button.
   * Add **Rubrica Connessioni** (`#connections-address-book`):
     * List of cards rendered from `localStorage.getItem('streetalk_connections_v1')`.
     * Displays saved moniker, avatar glyph, meeting date/time, mood tag, and exchanged social handle (if shared).
     * Strict XSS sanitization on all rendered fields using `safeSetText`.

### 2.6 Thematic Groups in Bacheca & Hybrid Authorization (R5)
1. **Observation**: Bacheca (`#view-bacheca`) currently displays individual posts/secrets.
2. **Architecture**:
   * Add tab bar in Bacheca: `[Segreti della Notte]` vs `[Gruppi a Tema]`.
   * Thematic groups stored in volatile RAM (`groups = new Map()`) in `server.js`.
   * **Hybrid Authorization Matrix for `POST /api/groups`**:
     ```javascript
     const isFounder = Boolean(req.body.hasFounderBadge);
     const karma = Number(req.body.streetKarma) || 0;
     const strikes = Number(req.body.strikeCount) || 0;

     const isQualified = isFounder || (karma >= 50 && strikes === 0);
     if (!isQualified) {
       return res.status(403).json({
         ok: false,
         code: 'UNQUALIFIED',
         error: 'La creazione di un Gruppo a Tema richiede il Badge Fondatore oppure almeno 50 punti Karma con 0 richiami StreetBot.'
       });
     }
     ```
   * Zero memory leak: In `TEST 10: VolatileMemoryLeakAuditor`, ensure `groups.clear()` or baseline tracking is audited.

### 2.7 Launch Monetization Model: "Badge Fondatore" (R6)
1. **Observation**: AGENTS.md mandates:
   * "Nessuna funzionalità base di chat 1v1 viene resa a pagamento; l'anonimato e la privacy dei segreti restano inviolati al 100%."
   * "HTTPS/WSS non implica E2EE... non promettere anonimato assoluto."
2. **Implementation**:
   * Modal `#modal-founder`: Promotes €2.99 one-off founder support.
   * Highlights the 4 perks:
     1. Neon Golden Badge "FONDATORE" on profile & sidebar.
     2. Instant right to open Thematic Groups in Bacheca without karma grinding.
     3. Exclusive VIP reaction glow animations.
     4. Priority queue access in Radar matching.
   * Endpoint `POST /api/founder/simulate-unlock`: Sets simulated unlock token, returns `{ ok: true, status: 'unlocked', badge: 'FOUNDER' }`.
   * Verified Invariance: Chat matching (`join_queue`), chat messages, extensions, and reporting remain 100% free and open to everyone without any subscription or payment checks.

---

## 3. Caveats

1. **Read-Only Explorer Scope**:
   * This investigation was conducted in strict read-only mode. No production source files (`server.js`, `frontend/app.js`, `index.html`, etc.) were edited.
2. **Category Count in TEST 19.2**:
   * `tests/autonomous-suite.js:1435` currently checks `catRes.categories.length === 9` with hardcoded names.
   * When implementing R2 with the new categories (`flirt`, `amore`, `spicy`), the test assertion in `autonomous-suite.js` must be updated to verify that all required categories (`trend`, `street`, `flirt`, `amore`, `spicy`, `lol`, `notte`) are registered, as allowed by AGENTS.md ("Se un requisito è cambiato, spiega perché un test va sostituito").
3. **Parity Discipline (AGENTS.md)**:
   * Any new SVG files added to `assets/gifs/` MUST be simultaneously added to `public/assets/gifs/`.
   * Any HTML edits in `index.html` MUST be mirrored byte-for-byte in `public/index.html`.
   * Any CSS edits in `incrocio.css` MUST be mirrored byte-for-byte in `public/incrocio.css`.
4. **Offline Test Isolation**:
   * `tests/local-test-runtime.js` disables external HTTP and Supabase connections during tests. All test fixtures must continue to rely exclusively on loopback and synthetic in-memory state.

---

## 4. Conclusion

1. **Test Suite Status**:
   `npm test` executes `node tests/autonomous-suite.js`. It is clean, fast (10.87s), and currently passes 100% (99/99 passed). Expanding the test suite with R1-R6 automated tests will preserve this 100% pass rate.
2. **Audio Decision (R1)**:
   External audio files (`.mp3`, `.wav`, `.ogg`) are **strictly prohibited** by `TEST 4`. The solution must exclusively employ the native Web Audio API (`SoundEngine`). A three-tier procedural sound generator for Reactions satisfies all requirements with 0ms latency and 0 bytes audio payload.
3. **Asset & Fallback Solution (R2)**:
   The duplicate `flame.svg` bug is caused by: (a) a single hardcoded fallback in `img.onerror`, (b) repeated use of `flame.svg` across categories, and (c) complete absence of assets for Flirt, Amore, and Spicy. Creating 13 new animated SVG cards (320x240) in `assets/gifs/` and `public/assets/gifs/` and implementing a category-specific fallback map will permanently eliminate duplicate fallback cards.
4. **Bilateral Friendship Flow (R3)**:
   Reusing the existing double-consent pattern in `server.js` (`room.friendRequests.size >= 2`) provides an instantaneous, memory-safe, and zero-leak mechanism for reciprocal acquaintance approval.
5. **Hybrid Thematic Group Authorization (R5)**:
   `POST /api/groups` with authorization rule `hasFounderBadge === true || (streetKarma >= 50 && strikeCount === 0)` cleanly enforces qualified moderation without compromising privacy or adding database dependencies.
6. **Monetization & Free Invariance (R6)**:
   The Founder Badge adds status and community privileges (Bacheca groups, golden badge, priority radar) while keeping 1v1 anonymous chatting 100% free and uncompromised.

---

## 5. Verification Method

### 5.1 Command Line Verification
Run the autonomous test suite from project root:
```powershell
npm test
```
**Expected outcome**: All suites pass with code 0, 0 failures, and execution time <15 seconds.

### 5.2 Specific Test Cases to Add to `autonomous-suite.js` for R1-R6
To verify R1-R6 with 100% automated coverage, the following tests must be incorporated:

1. **TEST 20: R1 Quick Reactions & Web Audio Realtime Bursts**:
   * Connect pair of virtual sockets `clientA` and `clientB`.
   * For each of the 12 emojis (`['🔥', '💀', '⚡', '🖤', '🚬', '👀', '🤯', '👏', '💖', '💋', '😈', '🌹']`):
     * `clientA.emit('send_reaction', { roomId, emoji })`.
     * `waitForEvent(clientB, 'receive_reaction')` confirms delivery.
   * Negative check: Emit disallowed emoji (e.g. `'🍕'`) -> verify no reaction broadcast occurs.
   * Static DOM audit: Check `index.html` and `public/index.html` contain button triggers for all 12 emojis.
   * Audio audit: Verify `SoundEngine.playReaction` does not invoke external media elements.

2. **TEST 21: R2 GIF Multi-Category Catalog & Fallback Diversity**:
   * Query `fetchLocalJson(SERVER_URL, '/api/gifs/categories')`.
   * Assert all required categories exist: `trend`, `street`, `flirt`, `amore`, `spicy`, `lol`, `notte`.
   * For each category, query `fetchLocalJson(SERVER_URL, '/api/gifs/trending?category=' + cat)`.
   * Assert non-empty item array and assert that items within the category have distinct titles and distinct URLs.
   * Filesystem verification: Loop through all referenced SVG paths and assert `fs.existsSync()` in both `assets/gifs/` and `public/assets/gifs/`.
   * Fallback assertion: Verify `frontend/app.js` does NOT contain `img.src = '/assets/gifs/flame.svg'` as an unconditional fallback.

3. **TEST 22: R3 Chat Sidebar Hub & Bilateral Friend Request Protocol**:
   * Connect paired clients `clientA` and `clientB`.
   * Single consent check: `clientA.emit('request_friendship', { roomId })`.
     * `waitForEvent(clientB, 'friend_request_received')` fires.
     * Verify `friendship_unlocked` does NOT fire yet.
   * Mutual consent check: `clientB.emit('request_friendship', { roomId })`.
     * `waitForEvent(clientA, 'friendship_unlocked')` and `waitForEvent(clientB, 'friendship_unlocked')` both fire.
   * Social exchange check: `clientA.emit('share_social_contact', { roomId, handle: '@shadow_talk', platform: 'telegram' })`.
     * `waitForEvent(clientB, 'social_contact_received')` delivers sanitized handle.
   * Negative test: Unpaired or third-party client emits `request_friendship` -> rejected with error.

4. **TEST 23: R4 Street Karma & Connections Address Book Audit**:
   * Unit test karma calculation:
     * Base: 10.
     * Completed chat (+5) -> 15.
     * 3 reactions received (+3) -> 18.
     * Friendship unlocked (+15) -> 33.
     * StreetBot Strike 1 (-20) -> 13.
   * Static audit: Verify `#connections-address-book`, `#profile-karma-display`, and `#profile-founder-badge` exist in `index.html` and `public/index.html`.

5. **TEST 24: R5 Bacheca Thematic Groups & Hybrid Authorization**:
   * Sub-test A: User with `hasFounderBadge: true` creates group -> HTTP 201 Created.
   * Sub-test B: User with `streetKarma: 60`, `strikeCount: 0` creates group -> HTTP 201 Created.
   * Sub-test C: User with `streetKarma: 20`, `hasFounderBadge: false` -> HTTP 403 Forbidden (`code: 'UNQUALIFIED'`).
   * Sub-test D: User with `streetKarma: 80` BUT `strikeCount: 1` -> HTTP 403 Forbidden.
   * Sub-test E: XSS attempt in group title -> Neutralized by `DOMSafetyFilter`.
   * Sub-test F: `GET /api/groups` returns the created groups.

6. **TEST 25: R6 Founder Badge Monetization & Free Chat Invariance**:
   * Verify `#modal-founder` exists with the 4 benefit descriptors.
   * Verify `POST /api/founder/simulate-unlock` returns active founder status.
   * Free Chat Invariance: Verify matchmaking queue (`join_queue`), chat messages (`send_message`), countdown timer, and extension remain 100% accessible to non-founders without paywalls or restrictions.
   * RAM Cleanup: Verify in-memory state returns to zero baseline upon test teardown.

---
*Report completed and verified against local workspace on 2026-09-14.*
