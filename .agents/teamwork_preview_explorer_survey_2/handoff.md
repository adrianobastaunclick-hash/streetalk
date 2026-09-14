# Handoff Report — Explorer 2: R2 (Story Card) & R6 (Avatar System)

**Milestone**: M0 / M2 Survey  
**Role**: Explorer 2 (Teamwork Explorer & Synthesis)  
**Target Scope**: R2 (Redesign Canvas 9:16 Story Card) & R6 (Street ID Avatar System)  
**Working Directory**: `d:\streetalk\.agents\teamwork_preview_explorer_survey_2`  

---

## 1. Observation

### 1.1 R2: Story Card Canvas & Modal Architecture
1. **Canvas Element & Dimensions**:
   - In `index.html` (lines 2375-2393) and `public/index.html`:
     ```html
     <!-- Line 2375 -->
     <div id="modal-share-card" class="hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
       ...
       <!-- Line 2391-2393 -->
       <div class="w-full aspect-[9/16] max-h-[380px] rounded-xl overflow-hidden border border-zinc-800 mx-auto mb-4 bg-black flex items-center justify-center shadow-lg relative">
         <canvas id="story-card-canvas" width="720" height="1280" class="w-full h-full object-contain"></canvas>
       </div>
     ```
   - Target dimensions: `720x1280` px (exact 9:16 aspect ratio).

2. **Trigger & Action Buttons**:
   - Open trigger in sidebar secret bar (`index.html` line 1560):
     ```html
     <button type="button" onclick="openSocialCardModal()" class="px-2 py-1 bg-street-orange/15 hover:bg-street-orange/30 text-street-orange rounded-lg text-[10px] font-mono border border-street-orange/30 flex items-center gap-1 cursor-pointer active:scale-95 transition" title="Card Story Instagram/TikTok">
       <span>📷</span> <span>Story</span>
     </button>
     ```
   - Action buttons inside modal (`index.html` lines 2396-2414):
     - `onclick="closeSocialCardModal()"` (Chiudi)
     - `onclick="shareStoryCard()"` (Condividi / Native Web Share API)
     - `onclick="downloadStoryCard()"` (Scarica PNG)

3. **Existing `drawStoryCard()` Implementation** (`frontend/app.js` lines 3812-3933):
   - **Background**: Primitive linear gradient (`#0b0d10` to `#12151d` to `#060709`), lacking depth, street texture, and purple undertones.
   - **Grid**: Rudimentary orange line loop (`rgba(255, 101, 47, 0.08)`) with no coordinate markers or tactical crosshairs.
   - **Branding**: Draws a flat orange rectangle (`ctx.fillRect(60, 65, 40, 40)`) with text `ST` inside, followed by plain `STREET` / `ALK` text. Lacks the official logo (`/assets/logo-streetalk.png`).
   - **Tagline**: Static single sentence `const textToDisplay = 'Un segreto a testa. Tre minuti per conoscersi.';` (zero variability; does not change between openings).
   - **Typography**: Plain `34px "Plus Jakarta Sans"`, missing underground street punch, quotation accents, and tactical metadata pills.
   - **Local Time**: Completely absent (no live clock or local time stamp).
   - **Monospace CTA**: Generic footer text `@STREETALK.LIVE`, lacks dedicated high-impact monospace CTA block for `streetalk.live`.
   - **Privacy Verification**: Confirmed that `drawStoryCard()` never accesses `mySecret`, `partnerSecret`, `messages`, or any session data. It generates 100% client-side promotional copy.

---

### 1.2 R6: Street ID Avatar System Architecture
1. **Avatar Grids in HTML**:
   - `index.html` (and `public/index.html`):
     - Line 2150: `<div class="grid grid-cols-5 sm:grid-cols-10 gap-2" id="full-profile-avatar-grid">` (Full profile page `#view-profilo`)
     - Line 2547: `<div class="grid grid-cols-5 sm:grid-cols-10 gap-2" id="onboarding-avatar-grid">` (First-access onboarding modal `#modal-onboarding`)
     - Line 2616: `<div class="grid grid-cols-5 sm:grid-cols-10 gap-2" id="profile-avatar-grid">` (Quick profile edit modal `#modal-profile`)
   - All three grids share the Tailwind classes `grid grid-cols-5 sm:grid-cols-10 gap-2`, designed for 5 columns on mobile and 10 columns on desktop.

2. **Avatar Display Targets**:
   - Header profile indicator (`index.html` line 500):
     ```html
     <span id="header-profile-avatar" class="text-sm">⚡</span>
     ```
   - Chat partner profile indicator (`index.html` line 1393):
     ```html
     <span id="chat-partner-avatar">⚡</span>
     ```

3. **Current JavaScript Logic in `frontend/app.js`**:
   - Lines 2643-2660:
     - `STREET_GLYPHS`: Array of 10 SVG definitions (`street-bolt`, `street-spray`, `street-mask`, `street-radar`, `street-chain`, `street-asphalt`, `street-flame`, `street-tape`, `street-cassette`, `street-seal`).
     - `STREET_AVATARS`: Array of 24 items (10 glyph IDs + 14 emojis).
   - Lines 3445-3470:
     - `renderAvatarGrid(containerId, activeAvatar, onSelect)`: **BUG**: Only iterates over `STREET_GLYPHS` (10 items). It completely ignores `STREET_AVATARS`!
     - Only 10 SVG icons are rendered in the DOM; 0 emojis are rendered.
   - Lines 3393-3425 (`getUserProfile()`):
     - Default profile avatar is hardcoded to `'street-bolt'` instead of `'⚡'`.
     - Lines 3442, 3443, 3679 also initialize temporary avatars to `'street-bolt'`.
   - Lines 3427-3432 (`saveUserProfile(prof)`):
     - Only saves JSON to `localStorage.setItem('streetalk_profile_v1', ...)`. It does not explicitly set `localStorage.setItem('streetalk_avatar', ...)`.
   - Lines 2662-2675 (`setAvatarDisplay(element, avatarValue, sizeClass)`):
     - If `STREET_GLYPHS.find(g => g.id === avatarValue || g.fallback === avatarValue)` matches, it inserts an `<img>`. Otherwise, it sets `element.textContent = avatarValue || '⚡'`.
   - Lines 4482-4483: In `socket.on('match_found')`, partner avatar is updated via:
     ```javascript
     const partnerAvatarEl = document.getElementById('chat-partner-avatar');
     if (partnerAvatarEl) setAvatarDisplay(partnerAvatarEl, partnerAvatar, 'w-6 h-6');
     ```
   - Line 1436 (`launchChatPreview()`): Missing `#chat-partner-avatar` population during chat preview demo mode.

---

## 2. Logic Chain

1. **R2 Canvas Overhaul Necessity**:
   - Observation 1.1 shows that `drawStoryCard()` in `frontend/app.js:3812` creates a flat card with static copy and basic box branding.
   - ORIGINAL_REQUEST §R2 requires:
     * Dark gradient background: black -> dark charcoal -> dark purple/street texture
     * Official logo / bold orange/white `ST STREETALK` branding
     * Large impactful typography with tagline chosen randomly from >= 5 street phrases
     * Neon orange border, subtle urban grid watermark, dynamic local time, monospace `streetalk.live` CTA
     * Zero private secrets or chat messages (purely client-side promotional copy)
   - Therefore, `drawStoryCard()` must be rewritten to render layered canvas graphics (gradient, watermark grid, corner brackets, glowing neon border, status bar with live time, random tagline selection, feature pills, and monospace CTA).

2. **R6 Avatar System Completeness**:
   - Observation 1.2 shows that `renderAvatarGrid()` only renders the 10 SVG items of `STREET_GLYPHS`, failing the requirement of >= 40 avatars.
   - The default avatar is `'street-bolt'` in `getUserProfile()`, whereas the specification requires default `'⚡'`.
   - Expanding `STREET_AVATARS` to 48 street-aesthetic emojis + 10 SVG icons = 58 items ensures full compliance with the >= 40 requirement while fitting cleanly into `grid-cols-5 sm:grid-cols-10` (mobile: 5x12 or 5x10; desktop: 10x6).
   - Updating `renderAvatarGrid` to render both `<img>` for SVG glyphs and `<span>` for emojis allows rich rendering with uniform sizing and active highlighting.
   - Persisting `prof.avatar` into both `localStorage['streetalk_profile_v1']` and `localStorage['streetalk_avatar']` guarantees cross-session persistence and fulfills the storage contract.
   - Updating `setAvatarDisplay()` to match `g.id === avatarValue` ensures that SVG glyphs render as SVGs and emojis render directly as crisp unicode symbols.

---

## 3. Caveats

1. **Read-Only Inspection**: In accordance with explorer constraints and team rules, no source files were modified during this investigation.
2. **Official Logo Availability**: The official logo was verified in the user upload path (`media_1789425043227.png`). R3 / Milestone M1 is responsible for copying it to `public/assets/logo-streetalk.png` and `assets/logo-streetalk.png`. The canvas drawing procedure designed here includes an automatic image loader with graceful canvas-drawn vector fallback (`ST` badge + `STREETALK` text), ensuring robust rendering whether the asset is present or loading.
3. **Parity Enforcement**: All HTML changes must remain identical between `index.html` and `public/index.html`. For R6, both files already have the matching grid container IDs (`#full-profile-avatar-grid`, `#onboarding-avatar-grid`, `#profile-avatar-grid`) and default avatar `⚡`.

---

## 4. Conclusion & Complete Implementation Plan

### 4.1 Implementation Code for R2 (`drawStoryCard()`)
File: `frontend/app.js` (~line 3812):

```javascript
    // ==========================================
    // R2: REDESIGNED VIRAL 9:16 STORY CARD ENGINE
    // ==========================================
    const STREET_STORY_TAGLINES = [
      'Un segreto a testa.\nTre minuti per conoscersi.',
      'Due sconosciuti nell\'asfalto.\nNessuna maschera, solo verità.',
      '180 secondi di verità nuda\nprima che la stanza bruci nel nulla.',
      'Quello che non diresti a nessuno,\ndillo a chi non sa chi sei.',
      'Niente follower, niente profili.\nSolo due voci nella notte.',
      'Parla finché c\'è tempo.\nQuando il timer scade, svanisce tutto.',
      'La notte appartiene a chi\nha il coraggio di essere sincero.'
    ];

    let storyLogoImage = null;
    function getStoryLogoImage() {
      if (!storyLogoImage) {
        storyLogoImage = new Image();
        storyLogoImage.src = '/assets/logo-streetalk.png';
      }
      return storyLogoImage;
    }

    function drawStoryCard() {
      const canvas = document.getElementById('story-card-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;  // 720
      const h = canvas.height; // 1280

      // 1. Dark Gradient Background (Deep Obsidian -> Charcoal -> Night Purple)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#050608');
      bgGrad.addColorStop(0.35, '#0e1118');
      bgGrad.addColorStop(0.70, '#131122');
      bgGrad.addColorStop(1, '#1b1226');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle atmospheric radial glow (bottom-right warm amber & purple)
      const radialGlow = ctx.createRadialGradient(w * 0.75, h * 0.85, 30, w * 0.75, h * 0.85, 520);
      radialGlow.addColorStop(0, 'rgba(255, 101, 47, 0.12)');
      radialGlow.addColorStop(0.45, 'rgba(120, 40, 180, 0.08)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, w, h);

      // 2. Subtle Urban Grid Watermark & Crosshairs
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Intersecting tactical crosshairs
      ctx.strokeStyle = 'rgba(255, 101, 47, 0.25)';
      ctx.lineWidth = 1;
      const markers = [
        { x: 120, y: 240 }, { x: 600, y: 240 },
        { x: 120, y: 640 }, { x: 600, y: 640 },
        { x: 120, y: 980 }, { x: 600, y: 980 }
      ];
      markers.forEach(pt => {
        ctx.beginPath();
        ctx.moveTo(pt.x - 8, pt.y); ctx.lineTo(pt.x + 8, pt.y);
        ctx.moveTo(pt.x, pt.y - 8); ctx.lineTo(pt.x, pt.y + 8);
        ctx.stroke();
      });
      ctx.restore();

      // 3. Neon Orange Border Frame with Tactical Corners
      ctx.save();
      ctx.strokeStyle = '#ff652f';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(255, 101, 47, 0.6)';
      ctx.shadowBlur = 14;
      ctx.strokeRect(32, 32, w - 64, h - 64);
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(44, 44, w - 88, h - 88);

      // Tactical corner brackets
      const cornerLen = 24;
      ctx.strokeStyle = '#ff652f';
      ctx.lineWidth = 4;
      // TL
      ctx.beginPath(); ctx.moveTo(28, 28 + cornerLen); ctx.lineTo(28, 28); ctx.lineTo(28 + cornerLen, 28); ctx.stroke();
      // TR
      ctx.beginPath(); ctx.moveTo(w - 28 - cornerLen, 28); ctx.lineTo(w - 28, 28); ctx.lineTo(w - 28, 28 + cornerLen); ctx.stroke();
      // BL
      ctx.beginPath(); ctx.moveTo(28, h - 28 - cornerLen); ctx.lineTo(28, h - 28); ctx.lineTo(28 + cornerLen, h - 28); ctx.stroke();
      // BR
      ctx.beginPath(); ctx.moveTo(w - 28 - cornerLen, h - 28); ctx.lineTo(w - 28, h - 28); ctx.lineTo(w - 28, h - 28 - cornerLen); ctx.stroke();
      ctx.restore();

      // 4. Header Status Bar: Dynamic Time & Session Badge
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeFormatted = `${hours}:${minutes} CET`;

      ctx.save();
      ctx.fillStyle = 'rgba(255, 101, 47, 0.12)';
      ctx.strokeStyle = 'rgba(255, 101, 47, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(64, 70, 240, 32, 8);
      } else {
        ctx.rect(64, 70, 240, 32);
      }
      ctx.fill();
      ctx.stroke();

      // Neon dot
      ctx.fillStyle = '#ff652f';
      ctx.beginPath();
      ctx.arc(82, 86, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffaa44';
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillText('NIGHT SESSION // 180s', 96, 91);

      // Local dynamic time
      ctx.fillStyle = 'rgba(200, 210, 225, 0.75)';
      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`ORA LOCALE: ${timeFormatted}`, w - 64, 91);
      ctx.textAlign = 'left';
      ctx.restore();

      // 5. Official Logo / Bold "ST STREETALK" Branding
      const logo = getStoryLogoImage();
      if (logo && logo.complete && logo.naturalWidth > 0) {
        const logoW = 270;
        const logoH = Math.round(logoW * (logo.naturalHeight / logo.naturalWidth));
        ctx.drawImage(logo, 64, 130, logoW, logoH);
      } else {
        // High-contrast vector branding fallback
        ctx.fillStyle = '#ff652f';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(64, 135, 50, 50, 10);
        } else {
          ctx.rect(64, 135, 50, 50);
        }
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = '900 28px Syne, sans-serif';
        ctx.fillText('ST', 74, 171);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 38px Syne, sans-serif';
        ctx.fillText('STREET', 128, 172);
        ctx.fillStyle = '#ff652f';
        ctx.fillText('ALK', 290, 172);

        if (!logo.onload) {
          logo.onload = () => {
            drawStoryCard();
          };
        }
      }

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillText('CHAT ANONIMA // REALE // EFFIMERA', 64, 215);

      // 6. Impactful Typography & Randomized Tagline
      const chosenTagline = STREET_STORY_TAGLINES[Math.floor(Math.random() * STREET_STORY_TAGLINES.length)];

      ctx.fillStyle = 'rgba(255, 101, 47, 0.22)';
      ctx.font = '900 130px Syne, serif';
      ctx.fillText('“', 56, 350);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 38px "Plus Jakarta Sans", Syne, sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 12;

      let currentY = 410;
      const taglineLines = chosenTagline.split('\n');
      taglineLines.forEach(l => {
        ctx.fillText(l, 64, currentY);
        currentY += 56;
      });
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(255, 101, 47, 0.22)';
      ctx.font = '900 130px Syne, serif';
      ctx.fillText('”', w - 120, currentY + 35);

      // 7. Tactical Feature Cards (3 Pillars)
      const features = [
        { icon: '🔒', title: 'DOPPIO SEGRETO RECIPROCO', desc: 'Si entra solo scambiando un pensiero intimo' },
        { icon: '⏳', title: '180 SECONDI E NIENTE TRACCE', desc: 'Nessun log, messaggi volatili solo in RAM' },
        { icon: '🤝', title: 'DOPPIO CONSENSO BILATERALE', desc: 'Proroga o contatto solo se entrambi d\'accordo' }
      ];

      let cardY = Math.max(currentY + 50, 680);
      features.forEach((feat, idx) => {
        ctx.fillStyle = 'rgba(18, 21, 30, 0.85)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(64, cardY, w - 128, 64, 12);
        } else {
          ctx.rect(64, cardY, w - 128, 64);
        }
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = idx === 0 ? '#ff652f' : (idx === 1 ? '#ffaa44' : '#a855f7');
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(64, cardY, 4, 64, [12, 0, 0, 12]);
        } else {
          ctx.rect(64, cardY, 4, 64);
        }
        ctx.fill();

        ctx.font = '22px sans-serif';
        ctx.fillText(feat.icon, 84, cardY + 41);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.fillText(feat.title, 124, cardY + 27);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(feat.desc, 124, cardY + 48);

        cardY += 76;
      });

      // 8. Monospace "streetalk.live" CTA Block
      ctx.strokeStyle = 'rgba(255, 101, 47, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(64, h - 180);
      ctx.lineTo(w - 64, h - 180);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 101, 47, 0.08)';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(64, h - 160, w - 128, 76, 14);
      } else {
        ctx.rect(64, h - 160, w - 128, 76);
      }
      ctx.fill();
      ctx.strokeStyle = '#ff652f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffaa44';
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillText('PARLA CON UNO SCONOSCIUTO ORA ➔', 88, h - 128);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 28px "JetBrains Mono", monospace';
      ctx.fillText('streetalk.live', 88, h - 98);

      ctx.fillStyle = '#ff652f';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('FREE // NO REGISTRATION', w - 86, h - 122);
      ctx.fillText('100% EPHEMERAL', w - 86, h - 104);
      ctx.textAlign = 'left';

      // 9. Privacy Seal & Zero-Secret Guarantee
      ctx.fillStyle = '#6b7280';
      ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Nessun dato personale o contenuto chat è presente in questa card.', w / 2, h - 52);
      ctx.textAlign = 'left';
    }

    window.openSocialCardModal = openSocialCardModal;
    window.closeSocialCardModal = closeSocialCardModal;
    window.drawStoryCard = drawStoryCard;
    window.downloadStoryCard = downloadStoryCard;
    window.shareStoryCard = shareStoryCard;
```

---

### 4.2 Implementation Code for R6 (Street ID Avatar System)
File: `frontend/app.js`:

1. **Avatar Definitions (lines 2643-2660)**:
```javascript
    // Custom Street Vector Glyphs (SVG)
    const STREET_GLYPHS = [
      { id: 'street-bolt', label: 'Fulmine Neon', path: '/assets/icons/street-bolt.svg', fallback: '⚡' },
      { id: 'street-spray', label: 'Spray Underground', path: '/assets/icons/street-spray.svg', fallback: '🎨' },
      { id: 'street-mask', label: 'Maschera Anonima', path: '/assets/icons/street-mask.svg', fallback: '🎭' },
      { id: 'street-radar', label: 'Radar Sonar', path: '/assets/icons/street-radar.svg', fallback: '🎯' },
      { id: 'street-chain', label: 'Catena Inox', path: '/assets/icons/street-chain.svg', fallback: '⛓️' },
      { id: 'street-asphalt', label: 'Asfalto & Gomma', path: '/assets/icons/street-asphalt.svg', fallback: '🛣️' },
      { id: 'street-flame', label: 'Fiamma Street', path: '/assets/icons/street-flame.svg', fallback: '🔥' },
      { id: 'street-tape', label: 'Nastro Hazard', path: '/assets/icons/street-tape.svg', fallback: '⚠️' },
      { id: 'street-cassette', label: 'Tape 808', path: '/assets/icons/street-cassette.svg', fallback: '📼' },
      { id: 'street-seal', label: 'Sigillo 180s', path: '/assets/icons/street-seal.svg', fallback: '⏱️' }
    ];

    // 48 Street-Aesthetic Emojis
    const STREET_EMOJI_AVATARS = [
      '⚡', '🔥', '🌙', '🦊', '🐺', '🎭', '🕶️', '🎯', '🏴', '☠️',
      '🌆', '🛹', '🎧', '🖤', '🎙️', '🥋', '🎲', '👾', '🚬', '👀',
      '💣', '🗡️', '⛓️', '🗝️', '📻', '🕷️', '🦇', '👁️‍🗨️', '🦅', '🐍',
      '🦂', '🕯️', '🌪️', '🌌', '🏎️', '🥊', '🧭', '⚓', '🔮', '💎',
      '🪙', '🛡️', '☕', '🥷', '🐅', '🐉', '🎪', '✨'
    ];

    // Complete Catalog: 10 Glyphs + 48 Emojis = 58 Avatars
    const STREET_AVATARS = [
      'street-bolt', 'street-spray', 'street-mask', 'street-radar', 'street-chain',
      'street-asphalt', 'street-flame', 'street-tape', 'street-cassette', 'street-seal',
      ...STREET_EMOJI_AVATARS
    ];
```

2. **`setAvatarDisplay()` helper (lines 2662-2675)**:
```javascript
    function setAvatarDisplay(element, avatarValue, sizeClass) {
      if (!element) return;
      element.innerHTML = '';
      const glyph = STREET_GLYPHS.find(g => g.id === avatarValue);
      if (glyph) {
        const img = document.createElement('img');
        img.src = glyph.path;
        img.alt = glyph.label;
        img.className = sizeClass ? `${sizeClass} inline-block object-contain pointer-events-none` : 'w-6 h-6 inline-block object-contain pointer-events-none';
        element.appendChild(img);
      } else {
        safeSetText(element, avatarValue || '⚡');
      }
    }
```

3. **`getUserProfile()` & `saveUserProfile()` (lines 3393-3444)**:
```javascript
    function getUserProfile() {
      try {
        const stored = localStorage.getItem('streetalk_profile_v1');
        const directAvatar = localStorage.getItem('streetalk_avatar');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed.moniker === 'string') {
            const rawAv = parsed.avatar || directAvatar;
            return {
              moniker: parsed.moniker.trim().substring(0, 25) || generateRandomStreetNick(),
              avatar: (STREET_AVATARS.includes(rawAv) || STREET_GLYPHS.some(g => g.id === rawAv)) ? rawAv : '⚡',
              bio: typeof parsed.bio === 'string' && parsed.bio.trim() ? parsed.bio.trim().substring(0, 70) : STREET_PROFILE_DEFAULTS.bio,
              motto: typeof parsed.motto === 'string' && parsed.motto.trim() ? parsed.motto.trim().substring(0, 100) : STREET_PROFILE_DEFAULTS.motto,
              vision: typeof parsed.vision === 'string' && parsed.vision.trim() ? parsed.vision.trim().substring(0, 200) : STREET_PROFILE_DEFAULTS.vision,
              topics: typeof parsed.topics === 'string' && parsed.topics.trim() ? parsed.topics.trim().substring(0, 150) : STREET_PROFILE_DEFAULTS.topics,
              avoids: typeof parsed.avoids === 'string' && parsed.avoids.trim() ? parsed.avoids.trim().substring(0, 150) : STREET_PROFILE_DEFAULTS.avoids,
              isFounder: isFounderUser()
            };
          }
        }
        if (directAvatar && (STREET_AVATARS.includes(directAvatar) || STREET_GLYPHS.some(g => g.id === directAvatar))) {
          const fallbackWithDirect = {
            moniker: generateRandomStreetNick(),
            avatar: directAvatar,
            bio: STREET_PROFILE_DEFAULTS.bio,
            motto: STREET_PROFILE_DEFAULTS.motto,
            vision: STREET_PROFILE_DEFAULTS.vision,
            topics: STREET_PROFILE_DEFAULTS.topics,
            avoids: STREET_PROFILE_DEFAULTS.avoids,
            isFounder: isFounderUser()
          };
          saveUserProfile(fallbackWithDirect);
          return fallbackWithDirect;
        }
      } catch (e) {}

      const defaultProfile = {
        moniker: generateRandomStreetNick(),
        avatar: '⚡',
        bio: STREET_PROFILE_DEFAULTS.bio,
        motto: STREET_PROFILE_DEFAULTS.motto,
        vision: STREET_PROFILE_DEFAULTS.vision,
        topics: STREET_PROFILE_DEFAULTS.topics,
        avoids: STREET_PROFILE_DEFAULTS.avoids,
        isFounder: isFounderUser()
      };
      saveUserProfile(defaultProfile);
      return defaultProfile;
    }

    function saveUserProfile(prof) {
      try {
        localStorage.setItem('streetalk_profile_v1', JSON.stringify(prof));
        localStorage.setItem('streetalk_avatar', prof.avatar || '⚡');
      } catch (e) {}
      updateHeaderProfileDisplay(prof);
    }

    let tempSelectedAvatar = '⚡';
    let fullProfileAvatar = '⚡';
    let tempOnboardingAvatar = '⚡';
```

4. **`renderAvatarGrid()` (lines 3445-3470)**:
```javascript
    function renderAvatarGrid(containerId, activeAvatar, onSelect) {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';

      const allAvatars = [
        // 10 Vector Glyphs
        ...STREET_GLYPHS.map(g => ({ id: g.id, label: g.label, isSvg: true, path: g.path })),
        // 48 Street Emojis
        ...STREET_EMOJI_AVATARS.map(emoji => ({ id: emoji, label: emoji, isSvg: false }))
      ];

      allAvatars.forEach((av) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.title = av.label;
        const isActive = activeAvatar === av.id || (!activeAvatar && av.id === '⚡');
        btn.className = `p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
          isActive
            ? 'bg-street-orange/25 border-street-orange text-white scale-110 shadow-[0_0_12px_rgba(255,101,47,0.4)]'
            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
        }`;

        if (av.isSvg) {
          const img = document.createElement('img');
          img.src = av.path;
          img.alt = av.label;
          img.className = 'w-6 h-6 object-contain pointer-events-none';
          btn.appendChild(img);
        } else {
          const span = document.createElement('span');
          span.className = 'text-xl select-none leading-none pointer-events-none';
          span.textContent = av.id;
          btn.appendChild(span);
        }

        btn.onclick = () => {
          onSelect(av.id);
          renderAvatarGrid(containerId, av.id, onSelect);
        };
        container.appendChild(btn);
      });
    }
```

5. **`launchChatPreview()` update (lines 1450-1456)**:
```javascript
      const partnerAvatarEl = document.getElementById('chat-partner-avatar');
      if (partnerAvatarEl) setAvatarDisplay(partnerAvatarEl, '🐺', 'w-6 h-6');
```

---

## 5. Verification Method

### 5.1 Automated Test Verification
- Run test suite: `npm test`
- Expected: All 124+ automated tests pass with 0 regressions.
- Specifically verify tests 14, 18.5, and 18.6 in `tests/autonomous-suite.js` which check:
  * `setAvatarDisplay` presence in `frontend/app.js`
  * `STREET_GLYPHS` presence in `frontend/app.js`
  * Parity between `index.html` and `public/index.html`
  * Avatar parsing in urban profiles

### 5.2 Build & Parity Check
- Build bundle: `npm run build`
- Verify parity:
  * SHA256 of `index.html` == SHA256 of `public/index.html`
  * SHA256 of `incrocio.css` == SHA256 of `public/incrocio.css`

### 5.3 Story Card (R2) Inspection
- Open Story Card modal via `#modal-share-card` or by clicking the camera icon in sidebar (`openSocialCardModal()`).
- Invalidate condition:
  * Background is white or light (invalid: must be dark gradient).
  * Tagline does not change across multiple modal openings (invalid: must randomly choose from >= 5 phrases).
  * Any private chat message or user secret is rendered on the canvas (invalid: must be strictly promotional copy).
  * Logo is unrecognizable or missing streetalk branding.

### 5.4 Avatar Selector (R6) Inspection
- Invalidate condition:
  * Avatar grids (`#full-profile-avatar-grid`, `#onboarding-avatar-grid`, `#profile-avatar-grid`) render fewer than 40 items (invalid: must render 58 items).
  * Selecting an emoji avatar does not update `#header-profile-avatar` or persist to `localStorage` (invalid: must update header and persist under `streetalk_profile_v1` and `streetalk_avatar`).
  * Default avatar without prior selection is not `⚡` (invalid: must default to `⚡`).
