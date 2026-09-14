# Handoff Report — Explorer 1 (Survey R1, R3, R4)

## 1. Observation

### 1.1 R1: "Scambio Social Facoltativo" Overflow
- **File**: `index.html` & `public/index.html`, lines 1463–1492.
- **Parent Container**: `<div id="friend-request-unlocked-drawer" class="hidden pt-2 border-t border-zinc-800/80 space-y-2">` inside `<div id="chat-friend-request-container" ...>` inside `<aside id="chat-sidebar">`.
- **Observed Code (Lines 1464–1486)**:
  ```html
  <!-- Optional Social Exchange Drawer -->
  <div class="space-y-1.5 bg-black/60 p-2.5 rounded-xl border border-zinc-800">
    <span class="text-[9px] font-mono uppercase tracking-wider text-street-orange font-bold block">Scambio Social Facoltativo:</span>
    <div class="flex gap-1.5">
      <select id="friend-social-platform" class="bg-zinc-900 border border-zinc-800 text-zinc-200 text-[10px] font-mono rounded-lg px-1.5 py-1 focus:outline-none focus:border-street-orange">
        <option value="telegram">Telegram</option>
        <option value="instagram">Instagram</option>
        <option value="link">Link</option>
      </select>
      <input
        type="text"
        id="friend-social-handle"
        placeholder="@handle o link"
        maxlength="60"
        class="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-200 text-[10px] font-mono rounded-lg px-2 py-1 placeholder-zinc-600 focus:outline-none focus:border-street-orange"
      />
      <button
        type="button"
        onclick="shareFriendSocial()"
        class="px-2.5 py-1 bg-street-orange text-black font-mono font-bold text-[10px] rounded-lg hover:bg-street-orangeHover transition cursor-pointer shrink-0 active:scale-95"
      >
        Invia
      </button>
    </div>
  ```
- **Visual Evidence**: `C:\Users\adria\.gemini\antigravity\brain\c8214c33-d235-419c-a827-2256d857d0f3\.user_uploaded\media_1789424719008.png` shows the red-circled button "Invia" overflowing outside the right edge of the card.
- **CSS Context (`incrocio.css` lines 509–529 & 809–824)**:
  ```css
  #chat-sidebar {
    width: 340px !important;
    min-width: 320px !important;
    max-width: 380px !important;
    ...
  }
  @media (max-width: 768px) {
    #chat-sidebar {
      width: clamp(140px, 38vw, 190px) !important;
      min-width: 130px !important;
      max-width: 200px !important;
      ...
    }
  }
  ```
- **Root Cause**:
  1. `<div class="flex gap-1.5">` lacks `flex-wrap`, forcing items in a single horizontal line.
  2. `<input id="friend-social-handle">` lacks `min-w-0`, causing the browser to apply default input sizing (~150px min-width).
  3. `<select>` (~75px) + `<input>` (~150px) + `<button>` (~45px) + gap (12px) requires >280px minimum width.
  4. On 320px–375px viewports (and in 140px–200px mobile sidebar), available inner card width is under 200px (or ~120px on mobile), clipping the "Invia" button completely.

---

### 1.2 R3: Official Logo Integration
- **Source File**: `C:\Users\adria\.gemini\antigravity\brain\c8214c33-d235-419c-a827-2256d857d0f3\.user_uploaded\media_1789425043227.png`.
- **Properties**: File exists on disk, size 458,483 bytes. Visually inspected: horizontal banner containing S speech bubble icon with wifi curves + orange signal dots, bold STREETALK typography, and "CHAT ANONIMA. REALE. ORA." subtitle.
- **Current Header Placeholder**: `index.html` & `public/index.html` lines 416–427:
  ```html
  <button type="button" class="flex items-center gap-3 cursor-pointer group" onclick="backToLanding()" aria-label="ST STREETALK — torna alla home">
    <!-- Streetalk Logo with high-voltage orange square -->
    <div class="w-8 h-8 bg-street-orange rounded-md flex items-center justify-center font-street font-black text-black text-lg tracking-tighter shadow-[0_0_18px_rgba(255,101,47,0.6)] group-hover:scale-105 transition-transform duration-200">
      ST
    </div>
    <div class="flex items-center gap-1.5">
      <span class="font-street font-black text-xl tracking-wider text-white">
        STREET<span class="text-street-orange">ALK</span>
      </span>
      <span class="w-2 h-2 rounded-full bg-street-orange inline-block shadow-[0_0_10px_#ff652f] animate-pulse"></span>
    </div>
  </button>
  ```
- **Destination Paths**:
  - `public/assets/logo-streetalk.png`
  - `assets/logo-streetalk.png`
  - URL reference in HTML/CSS/JS: `/assets/logo-streetalk.png`.

---

### 1.3 R4: Chat Left Sidebar Removal / Hiding
- **Element in DOM**: `<aside id="chat-sidebar">` (`index.html` & `public/index.html`, lines 1351–1612).
- **Layout Container**:
  - Parent: `<section id="view-chat">` (`incrocio.css` lines 485–506: `display: flex !important; flex-direction: row !important; position: fixed !important; inset: 0 !important;`).
  - Sibling: `<main id="chat-main-area">` (`incrocio.css` lines 540–548: `flex: 1 1 0% !important; min-width: 0 !important; height: 100% !important;`).
- **Dependencies in `tests/autonomous-suite.js`**:
  - Line 1409: `assert(indexContent.includes('id="pinned-secret-bar"'), 'index.html must include pinned-secret-bar');`
  - Lines 1704–1716:
    ```javascript
    const r3RequiredDomIds = [
      'friend-request-unlocked-drawer',
      'friend-social-handle',
      'friend-partner-social-received',
      'friend-partner-social-text',
      'chat-partner-motto-row',
      'chat-partner-topics-row',
      'chat-partner-avoids-row'
    ];
    for (const domId of r3RequiredDomIds) {
      assert(indexContent.includes(`id="${domId}"`), `index.html must include element #${domId}`);
      assert(publicIndexContent.includes(`id="${domId}"`), `public/index.html must include element #${domId}`);
    }
    ```
- **Dependencies in `frontend/app.js`**:
  - Line 4014: `badge.classList.add('border-red-600', 'text-red-400')` where `badge = document.getElementById('countdown-badge')`. Throws unhandled `TypeError` if `countdown-badge` is not in DOM!
  - Lines 4515–4516: `const extBtn = document.getElementById('btn-extension'); extBtn.classList.remove('bg-street-orange/30', 'text-street-orange');`. Throws unhandled `TypeError` upon match if `btn-extension` is missing!
  - Lines 4625–4626: `const extBtn = document.getElementById('btn-extension'); extBtn.classList.add('border-street-orange', 'text-street-orange');`. Throws unhandled `TypeError` upon extension request if missing!
  - Lines 4632–4633: `const extBtn = document.getElementById('btn-extension'); extBtn.classList.remove('bg-street-orange/30');`. Throws unhandled `TypeError` if missing!
- **Header Profile Navigation**:
  - Line 448: `<button id="nav-btn-profilo" onclick="switchView('profilo')" ...>`
  - Line 494: `<button id="btn-header-profile" onclick="switchView('profilo')" ...>`
  - Main menu provides 100% independent access to `#view-profilo` (Karma HUD, founder badge, Rubrica Connessioni).

---

## 2. Logic Chain

1. **R1 Analysis**:
   - The overflow in `media_1789424719008.png` occurs because the three controls (`select`, `input`, `button`) are in a flex row without `flex-wrap`, and the `input` has no `min-w-0`.
   - By converting `<div class="flex gap-1.5">` to `<div class="flex flex-wrap gap-1.5">`, adding `min-w-0` to the input, and giving the button `w-full` (or `sm:w-auto` with column wrap on small widths), the inputs cleanly occupy the first line and the "Invia" button occupies the second line across any container width (130px to 380px).
   - Adding a safeguard rule in `incrocio.css` ensures consistent behavior regardless of CDN utility nuances.

2. **R3 Analysis**:
   - The user provided a high-resolution logo asset (`media_1789425043227.png`) containing the full horizontal wordmark and subtitle.
   - The project specification (`PROJECT.md` line 34) and `ORIGINAL_REQUEST.md` (R3) require copying this asset to both `public/assets/logo-streetalk.png` and `assets/logo-streetalk.png`.
   - Replacing the text block in `main-header` (`ST` square + `STREETALK` text) with an `<img>` tag pointing to `/assets/logo-streetalk.png` cleanly satisfies Acceptance Criteria A3.

3. **R4 Analysis**:
   - If `<aside id="chat-sidebar">` or its inner elements are physically deleted from `index.html`:
     - `autonomous-suite.js` assertions checking for `#pinned-secret-bar` and `#friend-request-unlocked-drawer` will fail immediately.
     - `frontend/app.js` will crash with fatal unhandled exceptions (`TypeError: Cannot read properties of null`) during chat lifecycle (match found, timer <= 30s, +5m request).
   - If instead `<aside id="chat-sidebar">` is hidden via CSS (`display: none !important;`) and marked `class="hidden"`:
     - All DOM nodes remain in the document tree.
     - All `document.getElementById(...)` queries in `frontend/app.js` return non-null elements, preventing any runtime crashes.
     - All 124 tests in `tests/autonomous-suite.js` pass.
     - `#chat-main-area` (which has `flex: 1 1 0% !important; min-width: 0 !important;`) expands automatically to 100% of the viewport width.
     - Profile features remain fully accessible via the top navigation buttons (`#nav-btn-profilo`, `#btn-header-profile`), satisfying R4 and A4.

---

## 3. Caveats

- **No DOM Deletion**: Do NOT physically delete `<aside id="chat-sidebar">` or any inner IDs from `index.html` or `public/index.html`. It must be hidden using CSS / class attributes.
- **Parity Rule**: Every change to `index.html` must be identically copied to `public/index.html`. Every change to `incrocio.css` must be copied to `public/incrocio.css`. Both pairs must maintain 100% byte-for-byte SHA256 parity.
- **No NPM Packages**: No external packages or dependencies are required or permitted for these three tasks.

---

## 4. Conclusion & Proposed Implementation

### 4.1 Changes for R1: Social Exchange Drawer Overflow Fix
In `index.html` and `public/index.html` (around lines 1466–1486):
```html
<!-- BEFORE -->
              <div class="flex gap-1.5">
                <select id="friend-social-platform" class="bg-zinc-900 border border-zinc-800 text-zinc-200 text-[10px] font-mono rounded-lg px-1.5 py-1 focus:outline-none focus:border-street-orange">
                  <option value="telegram">Telegram</option>
                  <option value="instagram">Instagram</option>
                  <option value="link">Link</option>
                </select>
                <input
                  type="text"
                  id="friend-social-handle"
                  placeholder="@handle o link"
                  maxlength="60"
                  class="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-200 text-[10px] font-mono rounded-lg px-2 py-1 placeholder-zinc-600 focus:outline-none focus:border-street-orange"
                />
                <button
                  type="button"
                  onclick="shareFriendSocial()"
                  class="px-2.5 py-1 bg-street-orange text-black font-mono font-bold text-[10px] rounded-lg hover:bg-street-orangeHover transition cursor-pointer shrink-0 active:scale-95"
                >
                  Invia
                </button>
              </div>

<!-- AFTER -->
              <div class="flex flex-wrap gap-1.5">
                <select id="friend-social-platform" class="shrink-0 bg-zinc-900 border border-zinc-800 text-zinc-200 text-[10px] font-mono rounded-lg px-1.5 py-1 focus:outline-none focus:border-street-orange">
                  <option value="telegram">Telegram</option>
                  <option value="instagram">Instagram</option>
                  <option value="link">Link</option>
                </select>
                <input
                  type="text"
                  id="friend-social-handle"
                  placeholder="@handle o link"
                  maxlength="60"
                  class="flex-1 min-w-[90px] bg-zinc-900 border border-zinc-800 text-zinc-200 text-[10px] font-mono rounded-lg px-2 py-1 placeholder-zinc-600 focus:outline-none focus:border-street-orange"
                />
                <button
                  type="button"
                  onclick="shareFriendSocial()"
                  class="w-full py-1.5 bg-street-orange text-black font-mono font-bold text-[10px] rounded-lg hover:bg-street-orangeHover transition cursor-pointer active:scale-95"
                >
                  Invia
                </button>
              </div>
```

In `incrocio.css` and `public/incrocio.css`:
Add at line 538 or in responsive section:
```css
/* Responsive fix for Scambio Social Facoltativo (R1) */
#friend-request-unlocked-drawer .flex {
  flex-wrap: wrap !important;
}
#friend-social-handle {
  min-width: 0 !important;
}
```

---

### 4.2 Changes for R3: Official Logo Asset Copy & Header Brand
1. **Asset Copy Commands**:
   - Copy `C:\Users\adria\.gemini\antigravity\brain\c8214c33-d235-419c-a827-2256d857d0f3\.user_uploaded\media_1789425043227.png` to `d:\streetalk\public\assets\logo-streetalk.png`
   - Copy to `d:\streetalk\assets\logo-streetalk.png`
2. **In `index.html` and `public/index.html` (lines 416–427)**:
```html
<!-- BEFORE -->
    <button type="button" class="flex items-center gap-3 cursor-pointer group" onclick="backToLanding()" aria-label="ST STREETALK — torna alla home">
      <!-- Streetalk Logo with high-voltage orange square -->
      <div class="w-8 h-8 bg-street-orange rounded-md flex items-center justify-center font-street font-black text-black text-lg tracking-tighter shadow-[0_0_18px_rgba(255,101,47,0.6)] group-hover:scale-105 transition-transform duration-200">
        ST
      </div>
      <div class="flex items-center gap-1.5">
        <span class="font-street font-black text-xl tracking-wider text-white">
          STREET<span class="text-street-orange">ALK</span>
        </span>
        <span class="w-2 h-2 rounded-full bg-street-orange inline-block shadow-[0_0_10px_#ff652f] animate-pulse"></span>
      </div>
    </button>

<!-- AFTER -->
    <button type="button" class="flex items-center gap-3 cursor-pointer group" onclick="backToLanding()" aria-label="STREETALK — torna alla home">
      <img src="/assets/logo-streetalk.png" alt="STREETALK — Chat Anonima. Reale. Ora." class="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105" />
    </button>
```

---

### 4.3 Changes for R4: Chat Left Sidebar Hiding
1. **In `incrocio.css` and `public/incrocio.css` (lines 509–517)**:
```css
/* BEFORE */
#chat-sidebar {
  width: 340px !important;
  min-width: 320px !important;
  max-width: 380px !important;
  height: 100% !important;
  background: #0d0f17 !important;
  border-right: 1px solid #1c2130 !important;
  display: flex !important;
  ...
}

/* AFTER */
#chat-sidebar {
  display: none !important;
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  overflow: hidden !important;
}
```
2. **In `index.html` and `public/index.html`**:
   - Line 1351: Change `<aside id="chat-sidebar">` to `<aside id="chat-sidebar" class="hidden" style="display: none !important;">`.
   - Line 1633–1640: Add `hidden` to the mobile "☰ OPZIONI" button in `#chat-top-bar` since the sidebar is hidden.
   - Note: `#chat-main-area` (`flex: 1 1 0% !important; min-width: 0 !important; height: 100% !important;`) immediately fills 100% full screen width.

---

## 5. Verification Method

1. **Automated Test Suite**:
   - Command: `node tests/autonomous-suite.js` (or `npm test`).
   - Expected Result: 100% pass rate (≥ 124 passed, 0 failed).
   - Specifically verify that Test 14 (DOM audit), Test 20, Test 22 (friend requests & DOM IDs), Test 23 (karma & address book) and Test 25 (free chat invariance) pass cleanly without any null reference errors.

2. **Parity Check**:
   - Verify SHA256 hashes match:
     - `index.html` == `public/index.html`
     - `incrocio.css` == `public/incrocio.css`
     - `assets/logo-streetalk.png` == `public/assets/logo-streetalk.png`

3. **DOM & Visual Inspection**:
   - Verify `public/assets/logo-streetalk.png` exists and is readable.
   - Verify `#main-header img[src="/assets/logo-streetalk.png"]` renders in header.
   - Verify `#chat-sidebar` is `display: none` and `#chat-main-area` is full-width in chat view.
   - Verify that in `#friend-request-unlocked-drawer`, the controls wrap with `#friend-social-handle` having `min-w-0` and `#shareFriendSocial` button spanning cleanly without horizontal overflow down to 320px width.
