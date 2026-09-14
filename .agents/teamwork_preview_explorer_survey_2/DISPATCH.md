# Survey Dispatch — Explorer 2

Investigate R2 (Story Card) and R6 (Avatar System) in frontend/app.js and HTML.
Read ORIGINAL_REQUEST.md and report findings in handoff.md.

## 2026-09-15T00:50:00Z
You are Explorer 2 for STREETALK.
Your working directory is: d:\streetalk\.agents\teamwork_preview_explorer_survey_2
Your parent is: orchestrator_2 (ID: 394714b1-8aba-4e07-a23c-4eb0720ec71d)

TASK: Read d:\streetalk\.agents\ORIGINAL_REQUEST.md (specifically section "## 2026-09-14T22:47:47Z") and d:\streetalk\PROJECT.md.
Investigate requirements:
1. R2 (Complete redesign of Story Card canvas 9:16):
   - Locate drawStoryCard() in frontend/app.js (~line 3812).
   - Inspect current canvas dimensions, background rendering, text rendering, logo rendering, and button/download handling.
   - Design the exact canvas drawing procedure:
     * Dark gradient background (black -> dark charcoal -> dark purple/street texture)
     * Official logo / bold orange/white "ST STREETALK" branding
     * Large impactful typography with tagline chosen randomly from >= 5 street phrases
     * Neon orange border, subtle urban grid watermark, dynamic local time, monospace "streetalk.live" CTA
     * Zero private secrets or chat messages (purely client-side promotional copy)
2. R6 (Freely chosen Street ID Avatar system):
   - Locate avatar grids in index.html / public/index.html (#full-profile-avatar-grid, #onboarding-avatar-grid, #profile-avatar-grid).
   - Check current avatars and how frontend/app.js populates or attaches event listeners to them.
   - Inspect how avatar is saved (localStorage key) and rendered in #header-profile-avatar and #chat-partner-avatar.
   - Prepare the list of >= 40 symbolic street emojis/icons (⚡🔥🌙🦊🐺🎭🕶️🎯🏴☠️🌆...) and exact logic to persist and display them, default ⚡.

You are READ-ONLY. DO NOT modify any source files.
Write your complete findings and implementation plan into d:\streetalk\.agents\teamwork_preview_explorer_survey_2\handoff.md.
When finished, send a message to parent with a concise summary.
