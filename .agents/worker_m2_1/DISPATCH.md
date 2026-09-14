# DISPATCH — Worker M2 (Story Card Redesign & 40+ Avatar System)

You are Worker M2 (`worker_m2_1`).
Your working directory is: `d:\streetalk\.agents\worker_m2_1`
Project root: `d:\streetalk`

## Mandatory Requirements
You MUST read `d:\streetalk\.agents\ORIGINAL_REQUEST.md` before starting work.
You MUST also read the Explorer 2 survey report at `d:\streetalk\.agents\teamwork_preview_explorer_survey_2\handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective & Scope: Milestone 2 (R2, R6)
1. **R2: Story Card Canvas Redesign**:
   - In `frontend/app.js`, redesign `drawStoryCard()` (~line 3812):
     - Canvas dimensions: 720x1280 (9:16 vertical story format).
     - Dark obsidian/purple street gradient background (#050608 -> #0e1118 -> #131122 -> #1b1226) with subtle radial atmospheric glow.
     - Subtle urban grid watermark (40px grid lines) and tactical crosshair marks.
     - Neon orange border (#ff652f) with tactical corner brackets.
     - Status bar at top: session badge and dynamic local time (e.g. HH:MM CET).
     - Official logo/branding: use image `/assets/logo-streetalk.png` with vector fallback (`ST` box + `STREET` / `ALK` text).
     - Dynamic randomized tagline from an array of >= 5 street phrases (e.g., `STREET_STORY_TAGLINES`).
     - Feature cards (3 pillars: Doppio segreto reciproco, 180s e niente tracce, Doppio consenso bilaterale).
     - Monospace CTA block: "streetalk.live" with clear visual impact.
     - Zero privacy leakage: NEVER render private secrets, messages, or IPs on the canvas; strictly client-side promotional copy.

2. **R6: Street ID 40+ Avatar System**:
   - In `frontend/app.js`:
     - Define `STREET_EMOJI_AVATARS` with 48 street-aesthetic emojis (so `STREET_AVATARS` has 10 SVG glyphs + 48 emojis = 58 avatars total, well over the >= 40 requirement).
     - Update `renderAvatarGrid(containerId, activeAvatar, onSelect)` to render all 58 avatars (both SVG glyphs with `<img>` and emojis with `<span>`).
     - In `getUserProfile()`, ensure the default avatar is `'⚡'` (not 'street-bolt').
     - In `saveUserProfile(prof)`, persist avatar into both `localStorage.setItem('streetalk_profile_v1', ...)` and `localStorage.setItem('streetalk_avatar', prof.avatar || '⚡')`.
     - In `setAvatarDisplay(element, avatarValue, sizeClass)`, properly render SVGs if found in `STREET_GLYPHS`, or textContent for emojis/fallbacks.
     - Ensure `#header-profile-avatar` and `#chat-partner-avatar` properly display the chosen avatar.

3. **Build & Test**:
   - Run `npm run build` to compile `public/app.bundle.js`.
   - Run `node tests/autonomous-suite.js` and verify all 124 tests pass.
   - Verify SHA256 parity between `index.html` and `public/index.html` and other shared files.
   - Write your handoff report to `d:\streetalk\.agents\worker_m2_1\handoff.md` and report back via `send_message`.

## 2026-09-15T01:28:55Z
You are Worker M2 (worker_m2_1).
Your working directory is: d:\streetalk\.agents\worker_m2_1
Project root: d:\streetalk

Read your dispatch instructions at: d:\streetalk\.agents\worker_m2_1\DISPATCH.md
Read the user request at: d:\streetalk\.agents\ORIGINAL_REQUEST.md
Read the explorer analysis at: d:\streetalk\.agents\teamwork_preview_explorer_survey_2\handoff.md

Implement Milestone 2:
1. R2: Redesign drawStoryCard() in frontend/app.js (~line 3812) to 720x1280 9:16 vertical canvas with dark obsidian/purple gradient, urban grid watermark, neon orange border, dynamic local time, official logo branding, randomized tagline (>= 5 street phrases), 3 pillars, monospace streetalk.live CTA, and zero privacy leakage.
2. R6: Expand Street ID avatar system in frontend/app.js to >= 40 avatars (10 SVG glyphs + 48 emojis = 58 total). Update renderAvatarGrid() to render all 58 avatars. Set default avatar to '⚡' in getUserProfile(). Persist selected avatar in localStorage under 'streetalk_avatar' and 'streetalk_profile_v1'. Ensure setAvatarDisplay() updates #header-profile-avatar and #chat-partner-avatar.
3. Run npm run build to recompile public/app.bundle.js.
4. Run tests: node tests/autonomous-suite.js. Verify 100% pass (>= 124 tests).
5. Verify SHA256 parity for index.html / public/index.html and any shared files.
6. Write your detailed handoff report to d:\streetalk\.agents\worker_m2_1\handoff.md and report back with send_message.
