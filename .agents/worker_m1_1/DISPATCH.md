# DISPATCH — Worker M1 (Logo, Header & Sidebars)

You are Worker M1 (`worker_m1_1`).
Your working directory is: `d:\streetalk\.agents\worker_m1_1`
Project root: `d:\streetalk`

## Mandatory Requirements
You MUST read `d:\streetalk\.agents\ORIGINAL_REQUEST.md` before starting work.
You MUST also read the Explorer 1 survey report at `d:\streetalk\.agents\teamwork_preview_explorer_survey_1\handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective & Scope: Milestone 1 (R1, R3, R4)
1. **R1: Scambio Social Facoltativo Overflow**:
   - In `index.html` and `public/index.html` (~line 1466-1486), modify `#friend-request-unlocked-drawer`:
     - Make the container `<div class="flex flex-wrap gap-1.5">`.
     - Ensure `<select id="friend-social-platform">` has `shrink-0`.
     - Ensure `<input id="friend-social-handle">` has `min-w-0` (e.g. `flex-1 min-w-[90px]`).
     - Make the `<button>` for `shareFriendSocial()` full width on wrap (`w-full py-1.5 ...`).
   - In `incrocio.css` and `public/incrocio.css`:
     - Add rules to ensure `#friend-request-unlocked-drawer .flex { flex-wrap: wrap !important; }` and `#friend-social-handle { min-width: 0 !important; }`.
   - Prevent any horizontal clipping or overflow across 320px to 1440px viewports.

2. **R3: Official Logo Integration**:
   - Copy official logo from:
     `C:\Users\adria\.gemini\antigravity\brain\c8214c33-d235-419c-a827-2256d857d0f3\.user_uploaded\media_1789425043227.png`
     to:
     - `d:\streetalk\public\assets\logo-streetalk.png`
     - `d:\streetalk\assets\logo-streetalk.png`
   - In `index.html` and `public/index.html` (~lines 416-427):
     - Replace the header logo placeholder text/square inside the `<button ... onclick="backToLanding()">` with:
       `<img src="/assets/logo-streetalk.png" alt="STREETALK — Chat Anonima. Reale. Ora." class="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105" />`

3. **R4: Chat Left Sidebar Hiding**:
   - In `incrocio.css` and `public/incrocio.css` (~lines 509-517):
     - Set `#chat-sidebar { display: none !important; width: 0 !important; min-width: 0 !important; max-width: 0 !important; padding: 0 !important; margin: 0 !important; border: none !important; overflow: hidden !important; }`.
   - In `index.html` and `public/index.html`:
     - Keep `<aside id="chat-sidebar">` and ALL its child elements in the DOM (do NOT delete any elements, as tests and app.js query them!).
     - Add `class="hidden"` and `style="display: none !important;"` to `<aside id="chat-sidebar">`.
     - In `#chat-top-bar` (~line 1633), hide the mobile hamburger button (`id="chat-mobile-menu-btn"` or similar sidebar toggle) since sidebar is gone.
     - Verify `#chat-main-area` expands to 100% full width.

4. **Parity & Tests**:
   - Maintain 100% byte-for-byte SHA256 parity between:
     - `index.html` and `public/index.html`
     - `incrocio.css` and `public/incrocio.css`
     - `assets/logo-streetalk.png` and `public/assets/logo-streetalk.png`
   - Run `node tests/autonomous-suite.js` (or `npm test`) to verify all >= 124 tests pass.
   - Write your report and results to `d:\streetalk\.agents\worker_m1_1\handoff.md`.

## 2026-09-14T23:10:46Z
Implement Milestone 1:
1. R1: Scambio Social Facoltativo overflow fix in index.html, public/index.html, incrocio.css, public/incrocio.css.
2. R3: Copy official logo file C:\Users\adria\.gemini\antigravity\brain\c8214c33-d235-419c-a827-2256d857d0f3\.user_uploaded\media_1789425043227.png to both public/assets/logo-streetalk.png and assets/logo-streetalk.png. Update header in index.html and public/index.html to display the logo image.
3. R4: Hide chat left sidebar with display: none !important (preserve all DOM nodes for test and JS compatibility). Ensure chat main area is full width.
4. Verify SHA256 parity between root and public copies of modified files.
5. Run tests: node tests/autonomous-suite.js. Verify 100% pass (>= 124 tests).
6. Write your detailed handoff report to d:\streetalk\.agents\worker_m1_1\handoff.md and report back with send_message.
