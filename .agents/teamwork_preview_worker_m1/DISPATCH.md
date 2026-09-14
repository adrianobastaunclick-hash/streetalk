## 2026-09-14T22:58:17Z
You are Worker M1 for STREETALK.
Your working directory is: d:\streetalk\.agents\teamwork_preview_worker_m1
Your parent is: orchestrator_2 (ID: 394714b1-8aba-4e07-a23c-4eb0720ec71d)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

First, read:
1. d:\streetalk\.agents\ORIGINAL_REQUEST.md (specifically section "## 2026-09-14T22:47:47Z")
2. d:\streetalk\PROJECT.md
3. d:\streetalk\.agents\teamwork_preview_explorer_survey_1\handoff.md (detailed before/after code and line numbers)

FILE WRITE OWNERSHIP:
You have exclusive write access to:
- public/assets/logo-streetalk.png
- assets/logo-streetalk.png
- index.html
- public/index.html
- incrocio.css
- public/incrocio.css

TASKS:
1. R3: Copy official logo from `C:/Users/adria/.gemini/antigravity/brain/c8214c33-d235-419c-a827-2256d857d0f3/.user_uploaded/media_1789425043227.png` to BOTH `d:\streetalk\public\assets\logo-streetalk.png` and `d:\streetalk\assets\logo-streetalk.png`.
2. R3: In `index.html` (lines ~416-427), replace the placeholder ST block with the official logo `<img src="/assets/logo-streetalk.png" alt="STREETALK — Chat Anonima. Reale. Ora." class="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105" />`.
3. R1: In `index.html` (lines ~1466-1486), update `#friend-request-unlocked-drawer` to prevent overflow:
   - Change flex container to `flex flex-wrap gap-1.5`
   - Add `shrink-0` to `#friend-social-platform`
   - Add `min-w-0` to `#friend-social-handle`
   - Set button class to `w-full py-1.5 bg-street-orange text-black font-mono font-bold text-[10px] rounded-lg hover:bg-street-orangeHover transition cursor-pointer active:scale-95`
   - Add CSS rules to `incrocio.css`:
     `#friend-request-unlocked-drawer .flex { flex-wrap: wrap !important; }`
     `#friend-social-handle { min-width: 0 !important; }`
4. R4: Hide chat left sidebar:
   - In `index.html`, add `hidden` to `<aside id="chat-sidebar" class="hidden">`.
   - In `incrocio.css` (lines ~509-517), set `#chat-sidebar { display: none !important; width: 0 !important; min-width: 0 !important; max-width: 0 !important; padding: 0 !important; margin: 0 !important; border: none !important; overflow: hidden !important; }`.
   - IMPORTANT: DO NOT delete the inner HTML elements or IDs of `#chat-sidebar` from `index.html`! They must remain in the DOM tree so automated tests and event listeners do not fail with null errors.
5. PARITY:
   - Copy `index.html` to `public/index.html` using powershell: `Copy-Item index.html public/index.html -Force`.
   - Copy `incrocio.css` to `public/incrocio.css` using powershell: `Copy-Item incrocio.css public/incrocio.css -Force`.
   - Verify SHA256 hashes match: `Get-FileHash index.html, public/index.html, incrocio.css, public/incrocio.css`.
6. VERIFICATION:
   - Run `npm test` and confirm all 124 tests pass (124 passed, 0 failed).
7. Report completion by writing `d:\streetalk\.agents\teamwork_preview_worker_m1\handoff.md` and sending a message to parent with the test results and parity hashes.
