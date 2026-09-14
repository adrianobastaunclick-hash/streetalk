# Master Plan — STREETALK Evolution (R1-R6)

## Overview
Evolution of STREETALK from ephemeral chat to sustainable social connection platform while respecting all AGENTS.md rules (local scope, zero secret leakage, 100% test pass rate, root/public parity).

## Phases

### Phase 0: Survey & Codebase Exploration (3 Explorers in parallel)
- Explorer 1 (Frontend): Map UI structures, reaction bar, GIF grid, sidebar, profile views, bacheca views, and duplicate files (public/index.html vs index.html).
- Explorer 2 (Realtime & Backend): Map server.js, socket events (`send_reaction`, room management, secret handling, potential friend request events, groups API/events).
- Explorer 3 (Assets & Testing): Map test suite (`npm test`), asset directories (`flame.svg`, audio, GIFs), and missing test coverage.

### Phase 1: Architecture & Milestone Decomposition
- Compile PROJECT.md with architecture, feature inventory (R1-R6), interface contracts, and code layout.
- Define TEST_INFRA.md and acceptance test plan.

### Phase 2: Milestone Iteration Loops (Worker -> Reviewers -> Challenger -> Auditor)
- M1: R1 Quick Reaction Strip (Interactive bar, Web Audio API, spring pop/haptic, send_reaction realtime neon fade).
- M2: R2 GIF & Reaction Engine (Fix flame.svg duplicate fallback, separate animated SVGs/assets, Flirt & Amore categories, coherent search/filter).
- M3: R3 Sidebar Hub & Bilateral Friend Request (Partner info, bilateral double-consensus friend request, internal connections book, optional social exchange before room destruction).
- M4: R4 Profile & Connections Book (Moniker, motto, topics, avatar SVG, Street Karma score, Founder Badge display, Connections Book viewer).
- M5: R5 Open Thematic Groups (Bacheca view/tab, hybrid creation check: Founder Badge OR high Street Karma, public joining/reading).
- M6: R6 Founder Badge Monetization Model (Modal, one-time €2.99 Stripe-ready simulation, visual perks: golden/neon badge, VIP GIF/reaction category, thematic group creation, radar priority; zero compromise on free 1v1 chat privacy).

### Phase 3: Final E2E Suite, Root/Public Parity & Forensic Verification
- Run complete test suite and verify 100% pass rate.
- Ensure strict parity between `public/` and root files.
- Run Forensic Auditor.
- Report victory to Sentinel.
