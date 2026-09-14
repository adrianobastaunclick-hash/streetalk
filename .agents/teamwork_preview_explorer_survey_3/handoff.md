# Handoff Report — Explorer 3: R5 (Bacheca Gruppi a Tema & Founder Modal) & A1-A7 Test Suite / Parity Audit

## 1. Observation

### 1.1 R5 Bacheca & Thematic Groups in `index.html` & `public/index.html`
- **Navigation elements**:
  - Header desktop button (`index.html:456`): `<button id="nav-btn-bacheca" onclick="switchView('bacheca')">`
  - Mobile bottom nav button (`index.html:477`): `<button id="mobile-btn-bacheca" onclick="switchView('bacheca')">`
  - Hero footer links (`index.html:1249`): `<button type="button" onclick="switchView('bacheca')">`
- **Bacheca view container**:
  - `index.html:1833`: `<main id="view-bacheca" class="hidden flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-8 z-10 relative">`
- **Bacheca sub-view tabs**:
  - `index.html:1853`: `<button id="btn-tab-bacheca-confessioni" type="button" onclick="switchBachecaTab('confessioni')" class="bacheca-tab-btn px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer bg-street-orange text-black shadow-md flex items-center gap-2">`
  - `index.html:1861`: `<button id="btn-tab-bacheca-groups" type="button" onclick="switchBachecaTab('groups')" class="bacheca-tab-btn px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-mono text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition cursor-pointer flex items-center gap-2">`
- **Sub-view containers**:
  - `index.html:1871-1898`: `<div id="bacheca-confessioni-container" class="flex flex-col gap-8">` with `#bacheca-mood-filters` and `#bacheca-grid`.
  - `index.html:1901-1920`: `<div id="bacheca-groups-container" class="hidden flex flex-col gap-6">`:
    - Title: "Tavoli di Discussione Aperti"
    - Subtitle: "Conversazioni tematiche della notte senza maschere."
    - Button (`index.html:1907-1914`):
      ```html
      <button
        type="button"
        onclick="openCreateGroupModal()"
        class="px-4 py-2.5 bg-street-orange hover:bg-street-orangeHover text-black font-street font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
      >
        <span>+ CREA GRUPPO A TEMA</span>
      </button>
      ```
    - Grid (`index.html:1917`): `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" id="bacheca-groups-grid"></div>`
- **Modals for R5 & R6 in HTML**:
  - `index.html:2713-2757`: `#modal-create-group` with form `#create-group-form`, inputs `#group-title-input` (3-60 chars), `#group-category-select` (5 street categories), `#group-desc-input` (5-250 chars), and submit button `<button type="submit">PUBBLICA TAVOLO</button>`.
  - `index.html:2762-2806`: `#modal-group-unqualified` explaining the hybrid qualification (Founder vs Karma) with button `onclick="closeUnqualifiedModal(); openFounderBadgeModal();"` ("DIVENTA FONDATORE (€2.99)").
  - `index.html:2811-2902`: `#modal-founder-badge` displaying:
    - Hero price: `€ 2,99 / UNA TANTUM` (`index.html:2829-2830`)
    - Invariance guarantee: `100% Free Chat Invariance` (`index.html:2841`)
    - The 4 perk cards:
      1. `Badge Oro & Neon Visibile` (`index.html:2853`)
      2. `Apertura Illimitata Gruppi a Tema` (`index.html:2861`)
      3. `Reazioni & GIF Esclusive VIP` (`index.html:2869`)
      4. `Priorità Coda Radar` (`index.html:2877`)
    - Unlock button: `<button id="btn-unlock-founder" type="button" onclick="unlockFounderBadge()" ...>⭐ SBLOCCA ORA BADGE FONDATORE (€2.99)</button>` (`index.html:2886-2892`).

### 1.2 Backend Endpoints in `server.js`
- **Data storage (`server.js:116-150`)**:
  - `const thematicGroups = new Map();`
  - Seeded with 3 groups (`group_musica_notturna`, `group_confessioni_relazioni`, `group_dibattito_filosofico`).
- **GET `/api/groups` (`server.js:1497-1502`)**:
  ```javascript
  app.get('/api/groups', (req, res) => {
    res.json({
      ok: true,
      groups: Array.from(thematicGroups.values())
    });
  });
  ```
- **POST `/api/groups` (`server.js:1504-1578`)**:
  - Validates `title` (3-60 chars) -> HTTP 400 `INVALID_TITLE`
  - Validates `description` (5-250 chars) -> HTTP 400 `INVALID_DESCRIPTION`
  - Hybrid qualification logic:
    ```javascript
    const isFounder = Boolean(body.hasFounderBadge || body.isFounder || qual.isFounder || qual.type === 'founder');
    const karmaScore = Number(...);
    const totalStrikes = Math.max(ipStrikes, payloadStrikes);
    const isKarmaQualified = (karmaScore >= 50 && totalStrikes === 0);
    const isQualified = isFounder || isKarmaQualified;
    ```
  - Rejection if not qualified -> HTTP 403 `NOT_QUALIFIED`
  - Success -> HTTP 201 `{ ok: true, group: newGroup }`
- **POST `/api/founder/unlock` & `/api/founder/simulate-unlock` (`server.js:1583-1590`)**:
  ```javascript
  app.post(['/api/founder/unlock', '/api/founder/simulate-unlock'], (req, res) => {
    res.json({
      ok: true,
      status: 'unlocked',
      badge: 'FONDATORE',
      timestamp: Date.now()
    });
  });
  ```

### 1.3 Client-side Logic in `frontend/app.js`
- **Bacheca tab switching (`frontend/app.js:3131-3149`)**:
  - `switchBachecaTab(tab)` toggles active classes on tab buttons and unhides `#bacheca-groups-container` while calling `loadThematicGroups()`.
- **Group fetching & rendering (`frontend/app.js:3151-3227`)**:
  - `loadThematicGroups()` calls `fetch('/api/groups')`, falls back gracefully if network issue, and calls `renderThematicGroups(groups)`.
  - `renderThematicGroups(groups)` builds DOM cards in `#bacheca-groups-grid`.
- **Modal opening & qualification check (`frontend/app.js:3229-3249`)**:
  ```javascript
  function openCreateGroupModal() {
    const isFounder = isFounderUser();
    const karma = getStreetKarma();
    const strikes = getBotStrikes();
    const isQualified = isFounder || (karma >= 50 && strikes === 0);

    if (!isQualified) {
      const unqualModal = document.getElementById('modal-group-unqualified');
      if (unqualModal) {
        unqualModal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
      }
      return;
    }
    ...
  }
  ```
- **Group submission (`frontend/app.js:3267-3326`)**:
  - Reads form inputs, validates lengths, POSTs payload to `/api/groups`. On 201, resets form, toasts success, reloads groups.
- **Founder unlock simulation (`frontend/app.js:3347-3391`)**:
  - `unlockFounderBadge()` calls `POST /api/founder/unlock`, stores `localStorage.setItem('streetalk_is_founder', 'true')`, calls `updateKarmaHUD()`, closes modal.

### 1.4 Test Suite Structure (`tests/autonomous-suite.js`)
- Executed command: `npm test` -> `node tests/autonomous-suite.js`.
- Result: **124 PASSED, 0 FAILED** across 25 TEST sections.
- **TEST 24 (lines 1764-1851)**: R5 Bacheca Thematic Groups & Hybrid Authorization
  - Case A (Founder qualification -> HTTP 201)
  - Case B (High karma 100 pts, 0 strikes -> HTTP 201)
  - Case C (Unqualified karma 20, non-founder -> HTTP 403 `NOT_QUALIFIED`)
  - Case D (Strikes >= 1 -> HTTP 403 `NOT_QUALIFIED`)
  - Case E (`GET /api/groups` returns registered tables)
- **TEST 25 (lines 1853-1932)**: R6 Founder Badge Monetization & Free Chat Invariance
  - Asserts presence of `#modal-founder-badge` in `index.html` and `public/index.html`
  - Asserts exact perk strings in `indexContent`: `'Badge Oro'` / `'badge-founder-gold'`, `'Gruppi a Tema'`, `'VIP'` / `'Esclusive VIP'`, `'Radar'` / `'Priorità Coda'`
  - Asserts `POST /api/founder/unlock` returns `status: 'unlocked'` and `badge: 'FONDATORE'`
  - Asserts Free Chat Invariance: non-founders complete full chat lifecycle without hindrance
- **Static DOM elements checked in other tests (CRITICAL REGRESSION RISKS)**:
  - TEST 14: `chat-partner-avatar`, `chat-partner-bio-container`
  - TEST 18: `pinned-secret-bar`, `chat-gif-popover`, `chat-recording-bar`, `btn-chat-mic`, `gif-search-input`, `gif-search-clear`, `leaveChatToHome()`, `STREET_GLYPHS`, `setAvatarDisplay`
  - TEST 20: 12 reaction emojis in HTML (`data-emoji` or `sendReaction`), no `.mp3`/`.wav`/`.ogg`
  - TEST 21: `CATEGORY_FALLBACK_MAP` with `/assets/gifs/kiss.svg`, `heart_pulse.svg`, `chili.svg`
  - TEST 22: `friend-request-unlocked-drawer`, `friend-social-handle`, `friend-partner-social-received`, `friend-partner-social-text`, `chat-partner-motto-row`, `chat-partner-topics-row`, `chat-partner-avoids-row`
  - TEST 23: `getStreetKarma()`, `updateKarmaHUD()`, `streetalk_connections_v1`, `renderRubricaConnessioni()`, `profile-karma-score`, `profile-founder-badge-status`, `rubrica-connessioni-section`, `rubrica-connessioni-list`, `rubrica-connessioni-empty`.

### 1.5 Current Parity & Build Scripts
- **File parity verification (`Get-FileHash`)**:
  - `index.html` SHA256: `94FF46691EDA89C23738A26A553C146909F4A0F4A55CE767B0A538FD63FB55C4`
  - `public/index.html` SHA256: `94FF46691EDA89C23738A26A553C146909F4A0F4A55CE767B0A538FD63FB55C4` (100% MATCH)
  - `incrocio.css` SHA256: `8E869F8EB8E1DAA9D27970ACF584F0F9E40FEA9EB8451FB3CAC58F2A2A190EEF`
  - `public/incrocio.css` SHA256: `8E869F8EB8E1DAA9D27970ACF584F0F9E40FEA9EB8451FB3CAC58F2A2A190EEF` (100% MATCH)
  - `street-editorial.css` SHA256: `AE4A59F437F0EB3CAAB4A4D29D48BBE7D20BA47EBD2DC7CAA2A21ED36984EF19`
  - `public/street-editorial.css` SHA256: `AE4A59F437F0EB3CAAB4A4D29D48BBE7D20BA47EBD2DC7CAA2A21ED36984EF19` (100% MATCH)
- **`package.json` scripts**:
  - `"test": "node tests/autonomous-suite.js"`
  - `"build": "tailwindcss -i scripts/tailwind.css -o public/utilities.css --minify && esbuild frontend/app.js --outfile=public/app.min.js --minify"`

---

## 2. Logic Chain

1. **R5 UI & Endpoint Readiness**:
   - Observations 1.1 and 1.2 show that `#view-bacheca`, `#btn-tab-bacheca-groups`, `#bacheca-groups-container`, `#modal-create-group`, `#modal-founder-badge`, and the endpoints `GET /api/groups`, `POST /api/groups`, `POST /api/founder/unlock` are already implemented and functional.
2. **Gap Analysis for R5 Flow**:
   - The user request R5 specifies:
     * "Pulsante 'Crea Gruppo' che apre un modal; se l'utente non ha il Badge Fondatore né Karma ≥ 100, mostra un modal di upgrade con prezzo €2.99 (Badge Fondatore) e i benefit (simulazione Stripe, nessuna transazione reale)"
     * "Dopo unlock simulato, il pulsante Crea Gruppo diventa attivo e chiama POST /api/groups"
   - In `frontend/app.js:3233`:
     * The qualification check currently uses `karma >= 50 && strikes === 0`, and routes to `#modal-group-unqualified`.
     * If updated to:
       ```javascript
       const isQualified = isFounderUser() || (getStreetKarma() >= 100 && getBotStrikes() === 0);
       ```
     * When not qualified, it should directly invoke `openFounderBadgeModal()` (showing `#modal-founder-badge` with the €2.99 price and 4 benefits).
   - In `frontend/app.js:3347` (`unlockFounderBadge()`):
     * Currently it sets `localStorage.setItem('streetalk_is_founder', 'true')` and closes the modal, but does not open the group creation modal.
     * To fulfill the requirement "dopo unlock simulato, il pulsante Crea Gruppo diventa attivo e chiama POST /api/groups", `unlockFounderBadge()` should immediately open `#modal-create-group` upon successful unlock so the user can immediately publish their table via `submitCreateGroup()`.
3. **Backend Safety**:
   - `server.js:1553` checks `isFounder || (karmaScore >= 50 && totalStrikes === 0)`.
   - TEST 24 case B tests `karmaScore: 100, strikeCount: 0`. Since 100 >= 50, keeping `>= 50` on the server preserves 100% test compatibility for TEST 24 while the client enforces the 100 threshold for opening the modal.
4. **Impact on A1-A7 & Existing Tests**:
   - Any worker implementing R1, R3, R4, R5, or R6 MUST NOT delete or alter the DOM IDs listed in Observation 1.4 (specifically `chat-partner-avatar`, `pinned-secret-bar`, `friend-request-unlocked-drawer`, `friend-social-handle`, `chat-partner-motto-row`, `profile-karma-score`, `modal-founder-badge`, and the 4 perk descriptors).
   - In R4 ("nascondere la sidebar sinistra della chat"), applying `display: none` or CSS class `hidden` on `#chat-sidebar` or its profile items is safe for indexContent assertions, BUT if elements are deleted from the HTML DOM tree, TEST 14, TEST 18, and TEST 22 will fail.
   - Every modification to `frontend/app.js` requires `npm run build`.
   - Every modification to `index.html`, `incrocio.css`, or `street-editorial.css` must be immediately mirrored to `public/` to maintain identical SHA256 hashes.

---

## 3. Caveats

- **Read-Only Investigation**: No source files were modified during this investigation. All recommendations are detailed below for the implementing workers.
- **Karma Threshold Discrepancy**: The requirement description mentions `Karma >= 100` for group creation, while `server.js` currently allows `karmaScore >= 50`. We recommend keeping `server.js` at `>= 50` (or `>= 100` if verified with TEST 24 which already uses 100 in case B) and setting the client threshold in `app.js` to 100.
- **Build Execution**: `npm run build` will update `public/app.min.js` and `public/utilities.css`; ensure Tailwind CLI and esbuild run cleanly in the worker environment.
- No other caveats.

---

## 4. Conclusion

The R5 architecture is structurally complete and requires only targeted wiring in `frontend/app.js` and button ID standardization in `index.html`:
1. **In `index.html` & `public/index.html` (lines 1907-1914)**:
   - Add `id="btn-bacheca-create-group"` to the "+ CREA GRUPPO A TEMA" button for clean testing and DOM selection.
2. **In `frontend/app.js` (lines 3229-3249 and 3347-3391)**:
   - Update `openCreateGroupModal()`:
     ```javascript
     function openCreateGroupModal() {
       const isFounder = isFounderUser();
       const karma = getStreetKarma();
       const strikes = getBotStrikes();
       const isQualified = isFounder || (karma >= 100 && strikes === 0);

       if (!isQualified) {
         openFounderBadgeModal();
         return;
       }

       const modal = document.getElementById('modal-create-group');
       if (modal) {
         modal.classList.remove('hidden');
         document.body.classList.add('overflow-hidden');
       }
     }
     ```
   - Update `unlockFounderBadge()`:
     Upon successful unlock (and in the offline fallback), after `updateKarmaHUD()`, immediately open the group creation modal:
     ```javascript
     const createModal = document.getElementById('modal-create-group');
     if (createModal) {
       createModal.classList.remove('hidden');
       document.body.classList.add('overflow-hidden');
     }
     ```
3. **In `tests/autonomous-suite.js`**:
   - Existing 124 tests in `tests/autonomous-suite.js` will remain 100% passing as long as the critical DOM IDs and the 4 perk text descriptors in `#modal-founder-badge` are strictly preserved.

---

## 5. Verification Method

1. **Automated Test Suite**:
   ```bash
   npm test
   ```
   *Expected outcome*: `AUDIT COMPLETE: 124 PASSED, 0 FAILED`.
2. **File Parity Verification**:
   ```powershell
   Get-FileHash index.html, public/index.html, incrocio.css, public/incrocio.css, street-editorial.css, public/street-editorial.css | Format-Table -AutoSize
   ```
   *Expected outcome*: Identical SHA256 hashes for all three file pairs.
3. **Build Execution**:
   ```bash
   npm run build
   ```
   *Expected outcome*: Successful Tailwind CSS and esbuild compilation with exit code 0.
4. **Functional Group Creation & Founder Unlock Verification**:
   - `GET http://localhost:3000/api/groups` -> Returns HTTP 200 with `{ ok: true, groups: [...] }`.
   - `POST http://localhost:3000/api/founder/unlock` -> Returns HTTP 200 with `{ ok: true, status: 'unlocked', badge: 'FONDATORE' }`.
   - `POST http://localhost:3000/api/groups` with `{ qualification: { isFounder: true } }` -> Returns HTTP 201 with newly created group.
