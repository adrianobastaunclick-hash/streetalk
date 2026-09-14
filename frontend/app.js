    // ==========================================
    // TACTICAL RADAR SCOPE ENGINE (REALTIME ONLINE USERS & SWEEP)
    // ==========================================
    let radarEngineLoading = false;
    let radarScopeEngine = null;
    let latestTelemetrySnapshot = null;

    class RadarScopeEngine {
      constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animationFrame = null;
        this.lastTimestamp = 0;
        this.sweepAngle = 0;
        this.previousSweepAngle = 0;
        this.onlineCount = 0;
        this.inQueue = 0;
        this.contacts = [];
        this.hoverTarget = null;
        this.pointerX = -1;
        this.pointerY = -1;
        this.sonarPulseTime = 0;
        this.isDemoMode = false;
        this.soundThrottle = 0;

        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerLeave = this.onPointerLeave.bind(this);
        this.syncVisibility = this.syncVisibility.bind(this);
        this.animate = this.animate.bind(this);

        this.initListeners();
        this.resize();
      }

      initListeners() {
        this.canvas.addEventListener('pointermove', this.onPointerMove);
        this.canvas.addEventListener('pointerleave', this.onPointerLeave);
        window.addEventListener('resize', () => this.resize());
        
        const radarSection = document.getElementById('view-radar');
        if (radarSection) {
          this.observer = new MutationObserver(this.syncVisibility);
          this.observer.observe(radarSection, { attributes: true, attributeFilter: ['class'] });
        }
        document.addEventListener('visibilitychange', this.syncVisibility);
        window.addEventListener('pagehide', () => this.stop());
        window.addEventListener('pageshow', this.syncVisibility);
        
        const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
        reducedMotion.addEventListener('change', this.syncVisibility);
      }

      onPointerMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.pointerX = e.clientX - rect.left;
        this.pointerY = e.clientY - rect.top;
      }

      onPointerLeave() {
        this.pointerX = -1;
        this.pointerY = -1;
        this.hoverTarget = null;
      }

      resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = rect.width || 256;
        const h = rect.height || 256;
        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);
        this.width = w;
        this.height = h;
        this.dpr = dpr;
      }

      updateTelemetry(stats) {
        if (!stats || typeof stats !== 'object') return;
        const oc = Number.isSafeInteger(stats.onlineCount) ? stats.onlineCount : 0;
        const q = Number.isSafeInteger(stats.inQueue) ? stats.inQueue : 0;
        this.onlineCount = oc;
        this.inQueue = q;
        this.syncContacts();
      }

      setDemoMode(enabled) {
        this.isDemoMode = enabled;
        this.syncContacts();
      }

      syncContacts() {
        let count = Math.max(0, this.onlineCount - 1);
        if (this.isDemoMode && count === 0) {
          count = 2;
        }
        count = Math.min(count, 16);

        const GOLDEN_ANGLE = 2.399963;
        const newContacts = [];

        for (let i = 0; i < count; i++) {
          const existing = this.contacts[i];
          const baseAngle = ((i * GOLDEN_ANGLE) + 0.52) % (Math.PI * 2);
          const baseRadius = 0.35 + (((i * 7) % 11) / 11) * 0.48;
          const isQueued = i < this.inQueue;
          const isDemo = this.isDemoMode && this.onlineCount <= 1;

          newContacts.push({
            id: i + 1,
            label: isDemo 
              ? (i === 0 ? 'SHADOW_88' : 'V1PER_94')
              : (isQueued ? `SIG-${i + 1} [CODA]` : `SIG-${i + 1} [ON]`),
            baseAngle,
            radius: baseRadius,
            distanceM: Math.round(baseRadius * 350),
            isQueued: isQueued,
            isDemo: isDemo,
            lastPingTime: existing ? existing.lastPingTime : 0,
            pingIntensity: existing ? existing.pingIntensity : 0,
            driftPhase: i * 1.7
          });
        }

        this.contacts = newContacts;
      }

      isVisible() {
        const radarSection = document.getElementById('view-radar');
        return radarSection && !radarSection.classList.contains('hidden') && !document.hidden;
      }

      syncVisibility() {
        if (this.isVisible()) {
          this.start();
        } else {
          this.stop();
        }
      }

      start() {
        if (this.animationFrame) return;
        this.resize();
        this.lastTimestamp = performance.now();
        this.animationFrame = requestAnimationFrame(this.animate);
      }

      stop() {
        if (this.animationFrame) {
          cancelAnimationFrame(this.animationFrame);
          this.animationFrame = null;
        }
      }

      animate(now) {
        this.animationFrame = null;
        if (!this.isVisible()) return;

        const deltaMs = Math.min(now - (this.lastTimestamp || now), 100);
        this.lastTimestamp = now;

        const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reducedMotion) {
          this.previousSweepAngle = this.sweepAngle;
          this.sweepAngle = (this.sweepAngle + (deltaMs / 1000) * 1.4) % (Math.PI * 2);
          this.sonarPulseTime = (this.sonarPulseTime + deltaMs) % 2400;
        }

        this.render(now, reducedMotion);

        if (!reducedMotion) {
          this.animationFrame = requestAnimationFrame(this.animate);
        }
      }

      render(now, reducedMotion) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const dpr = this.dpr;
        if (!ctx || !w || !h) return;

        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const maxR = Math.min(cx, cy) - 8;

        // 1. Radar Circular Scope Clipping & Background Vignette
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
        ctx.clip();

        const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        bgGrad.addColorStop(0, '#101420');
        bgGrad.addColorStop(0.7, '#090b10');
        bgGrad.addColorStop(1, '#050608');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // 2. Concentric Range Rings (50m, 100m, 200m, 350m)
        const ringFractions = [0.25, 0.50, 0.75, 0.98];
        const ringLabels = ['50m', '100m', '200m', '350m'];

        ringFractions.forEach((frac, idx) => {
          const r = maxR * frac;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = idx === 3 ? 'rgba(255, 101, 47, 0.55)' : (idx === 2 ? 'rgba(255, 101, 47, 0.22)' : 'rgba(255, 101, 47, 0.16)');
          ctx.lineWidth = idx === 3 ? 1.5 : 1;
          if (idx === 2) {
            ctx.setLineDash([4, 4]);
          } else {
            ctx.setLineDash([]);
          }
          ctx.stroke();

          // Range text markers along 45-degree angle
          const tagAngle = -Math.PI / 4;
          const tx = cx + Math.cos(tagAngle) * (r - 2);
          const ty = cy + Math.sin(tagAngle) * (r - 2);
          ctx.font = '600 8px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(255, 101, 47, 0.45)';
          ctx.fillText(ringLabels[idx], tx - 12, ty + 2);
        });
        ctx.setLineDash([]);

        // 3. Tactical Cardinal Axes & Degree Ticks
        ctx.beginPath();
        ctx.moveTo(cx - maxR, cy);
        ctx.lineTo(cx + maxR, cy);
        ctx.moveTo(cx, cy - maxR);
        ctx.lineTo(cx, cy + maxR);
        ctx.strokeStyle = 'rgba(255, 101, 47, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Degree ticks and cardinal labels
        for (let deg = 0; deg < 360; deg += 30) {
          const rad = (deg * Math.PI) / 180;
          const isMajor = deg % 90 === 0;
          const tickLen = isMajor ? 7 : 4;
          const x1 = cx + Math.cos(rad) * (maxR - tickLen);
          const y1 = cy + Math.sin(rad) * (maxR - tickLen);
          const x2 = cx + Math.cos(rad) * maxR;
          const y2 = cy + Math.sin(rad) * maxR;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = isMajor ? 'rgba(255, 101, 47, 0.65)' : 'rgba(255, 101, 47, 0.25)';
          ctx.lineWidth = isMajor ? 1.5 : 1;
          ctx.stroke();

          if (isMajor) {
            const cardinalMap = { 0: '090°', 90: '180°', 180: '270°', 270: '000°' };
            const label = cardinalMap[deg];
            const lx = cx + Math.cos(rad) * (maxR - 14);
            const ly = cy + Math.sin(rad) * (maxR - 14);
            ctx.font = '700 8px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(255, 101, 47, 0.7)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, lx, ly);
          }
        }
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // 4. Expanding Sonar Wave Ripples from Center Beacon
        if (!reducedMotion) {
          const pulseFrac = this.sonarPulseTime / 2400;
          const pRadius = pulseFrac * maxR;
          const pAlpha = Math.max(0, (1 - pulseFrac) * 0.4);
          ctx.beginPath();
          ctx.arc(cx, cy, pRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 101, 47, ${pAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // 5. Rotating Radar Sweep Beam & Phosphor Trailing Cone
        if (!reducedMotion) {
          const sweepAngle = this.sweepAngle;
          const coneAngle = 0.75;
          const slices = 20;

          for (let s = 0; s < slices; s++) {
            const startA = sweepAngle - (s / slices) * coneAngle;
            const endA = sweepAngle - ((s + 1) / slices) * coneAngle;
            const sliceAlpha = (1 - s / slices) * 0.22;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, maxR, endA, startA);
            ctx.closePath();
            ctx.fillStyle = `rgba(255, 101, 47, ${sliceAlpha})`;
            ctx.fill();
          }

          // Sharp leading sweep laser line
          const lx = cx + Math.cos(sweepAngle) * maxR;
          const ly = cy + Math.sin(sweepAngle) * maxR;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(lx, ly);
          ctx.strokeStyle = '#ffaa44';
          ctx.shadowColor = '#ff652f';
          ctx.shadowBlur = 9;
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // 6. Online Contacts Tracking & Illumination Ping
        let activeHover = null;

        this.contacts.forEach((contact) => {
          const driftAngle = contact.baseAngle + Math.sin(now * 0.0006 + contact.driftPhase) * 0.04;
          const normAngle = ((driftAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const px = cx + Math.cos(normAngle) * (contact.radius * maxR);
          const py = cy + Math.sin(normAngle) * (contact.radius * maxR);

          if (!reducedMotion) {
            const prevA = this.previousSweepAngle;
            const currA = this.sweepAngle;
            let crossed = false;
            if (currA >= prevA) {
              crossed = normAngle >= prevA && normAngle <= currA;
            } else {
              crossed = normAngle >= prevA || normAngle <= currA;
            }

            if (crossed) {
              contact.lastPingTime = now;
              contact.pingIntensity = 1.0;
              if (typeof SoundEngine !== 'undefined' && SoundEngine.enabled && now - this.soundThrottle > 350) {
                this.soundThrottle = now;
                if (typeof SoundEngine.playRadarSweep === 'function') {
                  SoundEngine.playRadarSweep();
                }
              }
            }
          } else {
            contact.pingIntensity = 0.85;
          }

          const elapsedSec = (now - (contact.lastPingTime || 0)) / 1000;
          const decay = Math.exp(-elapsedSec / 1.5);
          const intensity = reducedMotion ? 0.85 : Math.max(0.12, decay);

          if (this.pointerX >= 0 && this.pointerY >= 0) {
            const dist = Math.hypot(this.pointerX - px, this.pointerY - py);
            if (dist < 18) {
              activeHover = { contact, px, py, normAngle };
            }
          }

          const isQueued = contact.isQueued;
          const blipColor = isQueued ? 'rgba(255, 170, 51,' : 'rgba(255, 101, 47,';

          if (!reducedMotion && elapsedSec < 0.7) {
            const ripProgress = elapsedSec / 0.7;
            const ripRadius = 4 + ripProgress * 22;
            const ripAlpha = (1 - ripProgress) * 0.75;
            ctx.beginPath();
            ctx.arc(px, py, ripRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `${blipColor} ${ripAlpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(px, py, 4 + intensity * 4.5, 0, Math.PI * 2);
          ctx.fillStyle = `${blipColor} ${intensity * 0.45})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(px, py, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = `${blipColor} ${Math.min(1, intensity + 0.3)})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(px, py, 1.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
          ctx.fill();

          if (intensity > 0.22 || reducedMotion) {
            ctx.font = '700 8px "JetBrains Mono", monospace';
            ctx.fillStyle = `${blipColor} ${Math.min(1, intensity + 0.15)})`;
            ctx.fillText(contact.label, px + 7, py - 6);
            ctx.font = '500 7px "JetBrains Mono", monospace';
            ctx.fillStyle = `rgba(200, 210, 225, ${Math.min(0.9, intensity * 0.85)})`;
            ctx.fillText(`${contact.distanceM}m`, px + 7, py + 3);
          }
        });

        // 7. Tactical Cursor Hover Inspection
        if (activeHover) {
          const { contact, px, py, normAngle } = activeHover;
          const deg = Math.round((normAngle * 180 / Math.PI) % 360);
          
          ctx.beginPath();
          const s = 10;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.moveTo(px - s, py - s + 4); ctx.lineTo(px - s, py - s); ctx.lineTo(px - s + 4, py - s);
          ctx.moveTo(px + s - 4, py - s); ctx.lineTo(px + s, py - s); ctx.lineTo(px + s, py - s + 4);
          ctx.moveTo(px - s, py + s - 4); ctx.lineTo(px - s, py + s); ctx.lineTo(px - s + 4, py + s);
          ctx.moveTo(px + s - 4, py + s); ctx.lineTo(px + s, py + s); ctx.lineTo(px + s, py + s - 4);
          ctx.stroke();

          const azmEl = document.getElementById('radar-azimuth');
          if (azmEl) {
            azmEl.textContent = `TARGET: ${contact.label} • ${contact.distanceM}m • ${deg}°`;
          }
        } else {
          const azmEl = document.getElementById('radar-azimuth');
          if (azmEl) {
            const deg = Math.round((this.sweepAngle * 180 / Math.PI) % 360);
            azmEl.textContent = `SCANNER: ${deg.toString().padStart(3, '0')}° AZM`;
          }
        }

        // 8. Center User Station (TU // NODO ATTIVO)
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff652f';
        ctx.shadowColor = '#ff652f';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.font = '900 8px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffaa44';
        ctx.textAlign = 'center';
        ctx.fillText('TU', cx, cy + 14);
        ctx.textAlign = 'left';

        ctx.restore();
        ctx.restore();

        // 9. Sync Telemetry Text Readouts
        const count = this.contacts.length;
        const geoEl = document.getElementById('radar-geo-coords');
        if (geoEl) {
          if (count > 0) {
            geoEl.textContent = `${count} ${count === 1 ? 'CONTATTO' : 'CONTATTI'} // ${this.inQueue} IN CODA`;
          } else {
            geoEl.textContent = '0 CONTATTI // NODO ATTIVO';
          }
        }
      }
    }

    function loadRadarEngine() {
      if (!radarScopeEngine) {
        const canvas = document.getElementById('radar-3d-canvas');
        if (canvas) {
          radarScopeEngine = new RadarScopeEngine(canvas);
          if (latestTelemetrySnapshot) {
            radarScopeEngine.updateTelemetry(latestTelemetrySnapshot);
          } else {
            fetch('/api/stats').then(r => r.json()).then(data => {
              if (radarScopeEngine && data) {
                radarScopeEngine.updateTelemetry(data);
              }
            }).catch(() => {});
          }
        }
      }
      if (radarScopeEngine) {
        radarScopeEngine.start();
      }
    }

    function init3DRadar() {
      loadRadarEngine();
    }
  
if (typeof io === 'undefined') {
      window.io = function() {
        return {
          connected: false,
          on: function() { return this; },
          emit: function() { return this; },
          timeout: function() { return this; }
        };
      };
    }

    const SERVER_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname === "[::1]"
      ? (window.location.port ? `${window.location.protocol}//${window.location.hostname}:${window.location.port}` : "http://localhost:3000")
      : "https://streetalk.onrender.com";

    const socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      secure: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });
    const targetServer = SERVER_URL;

    let isSocketConnected = false;
    let currentRoomId = null;
    let selectedMood = 'Cazzeggio';
    let mySecret = '';
    let partnerSecret = '';
    let partnerMood = '';
    let partnerNick = '';
    let myNick = '';
    let countdownInterval = null;
    let radarSecondsCounter = 0;
    let radarInterval = null;
    let typingTimeout = null;
    let isTyping = false;
    let pendingQueueJoin = null;
    let pingGeneration = 0;
    let pingPending = false;
    let statsExpiryTimer = null;

    function setLatencyUnavailable() {
      for (const id of ['ping-text', 'chat-ping-text', 'hud-latency']) {
        safeSetText(document.getElementById(id), 'N/D');
      }
      for (const id of ['ping-dot', 'chat-ping-dot']) {
        const dot = document.getElementById(id);
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-zinc-500';
      }
    }

    function setStatsUnavailable() {
      clearTimeout(statsExpiryTimer);
      statsExpiryTimer = null;
      for (const id of ['header-counter-number', 'hud-active-vaults', 'hud-destroyed-secrets', 'radar-display-pos']) {
        safeSetText(document.getElementById(id), '—');
      }
      safeSetText(document.getElementById('header-counter-label'), 'dato non disponibile');
      const pulse = document.getElementById('header-live-pulse');
      if (pulse) pulse.classList.add('hidden');
      for (const id of ['header-live-dot', 'hud-live-beacon']) {
        const dot = document.getElementById(id);
        if (dot) dot.className = 'w-2 h-2 rounded-full bg-zinc-500';
      }
    }

    function updateConnectionStatus() {
      const connected = Boolean(socket && socket.connected);
      const secureTransport = new URL(targetServer).protocol === 'https:';
      safeSetText(document.getElementById('hud-cipher-node'), connected
        ? (secureTransport ? 'CONNESSO // TLS AL SERVER' : 'CONNESSO // HTTP LOCALE')
        : 'NON CONNESSO');
    }

    function markRealtimeUnavailable() {
      isSocketConnected = false;
      pingGeneration++;
      pingPending = false;
      setStatsUnavailable();
      setLatencyUnavailable();
      safeSetText(document.getElementById('hud-cipher-node'), 'NON CONNESSO');
    }

    // Socket.IO acknowledgement timeout removes missing ping callbacks.
    function performPingCheck() {
      if (!socket || !socket.connected || pingPending) return;
      pingPending = true;
      const generation = ++pingGeneration;
      const start = Date.now();
      socket.timeout(3000).emit('ping_check', start, (error) => {
        if (generation !== pingGeneration || !socket.connected) return;
        pingPending = false;
        if (error) {
          setLatencyUnavailable();
          return;
        }
        const rtt = Math.max(0, Date.now() - start);
        for (const id of ['ping-text', 'chat-ping-text', 'hud-latency']) {
          safeSetText(document.getElementById(id), rtt + ' ms');
        }
        for (const id of ['ping-dot', 'chat-ping-dot']) {
          const dot = document.getElementById(id);
          if (dot) dot.className = 'w-2 h-2 rounded-full ' +
            (rtt < 80 ? 'bg-emerald-500' : rtt < 180 ? 'bg-amber-500' : 'bg-red-500');
        }
        updateConnectionStatus();
      });
    }

    // Connect to Socket.io event handlers.
    try {
      if (socket && typeof socket.on === 'function') {
        socket.on('connect', () => {
          isSocketConnected = true;
          pingGeneration++;
          pingPending = false;
          setStatsUnavailable();
          setLatencyUnavailable();
          updateConnectionStatus();
          performPingCheck();
          if (pendingQueueJoin) {
            safeSetText(document.getElementById('radar-status-text'), 'In cerca di un partner sul mood [' + pendingQueueJoin.mood + ']...');
            socket.emit('join_queue', pendingQueueJoin);
            pendingQueueJoin = null;
          }
        });
        socket.on('disconnect', markRealtimeUnavailable);
        socket.on('connect_error', () => {
          markRealtimeUnavailable();
          if (pendingQueueJoin) {
            safeSetText(document.getElementById('radar-status-text'), 'Server non raggiungibile. Nuovo tentativo in corso; puoi annullare la ricerca.');
          }
        });
      }
    } catch (e) {
      markRealtimeUnavailable();
    }

    // ==========================================
    // SKILL: DOMSafetyFilter (Zero XSS)
    // ==========================================

    // Decorative text reveal only; no cryptographic operation
    function decryptMatrixText(element, plainText, duration = 600) {
      if (!element) return;
      const glyphs = '█▓▒░01アイウエオカキクケコサシスセソタチツテト#@*$%!?&<>[]{}';
      const startTime = performance.now();
      const length = plainText.length;

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const resolvedChars = Math.floor(progress * length);

        let output = '';
        for (let i = 0; i < length; i++) {
          if (i < resolvedChars) {
            output += plainText[i];
          } else if (plainText[i] === ' ' || plainText[i] === '\n') {
            output += plainText[i];
          } else {
            output += glyphs[Math.floor(Math.random() * glyphs.length)];
          }
        }
        element.textContent = output;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          element.textContent = plainText;
        }
      }
      requestAnimationFrame(update);
    }

    // Only current socket snapshots are presented as live data.
    function updateTrustHUD(stats) {
      if (!socket || !socket.connected) return;
      const snapshot = stats && typeof stats === 'object' ? stats : {};
      latestTelemetrySnapshot = snapshot;
      if (radarScopeEngine) {
        radarScopeEngine.updateTelemetry(snapshot);
      }
      const count = value => Number.isSafeInteger(value) && value >= 0 ? value.toLocaleString() : '—';
      safeSetText(document.getElementById('header-counter-number'), count(snapshot.onlineCount));
      safeSetText(document.getElementById('hud-active-vaults'), count(snapshot.activeRooms));
      safeSetText(document.getElementById('hud-destroyed-secrets'), count(snapshot.destroyedSecrets));
      const available = count(snapshot.onlineCount) !== '—';
      safeSetText(document.getElementById('header-counter-label'), available ? 'in strada' : 'dato non disponibile');
      const pulse = document.getElementById('header-live-pulse');
      if (pulse) pulse.classList.toggle('hidden', !available);
      for (const id of ['header-live-dot', 'hud-live-beacon']) {
        const dot = document.getElementById(id);
        if (dot) dot.className = 'w-2 h-2 rounded-full ' + (available ? 'bg-emerald-500' : 'bg-zinc-500');
      }
      clearTimeout(statsExpiryTimer);
      statsExpiryTimer = setTimeout(setStatsUnavailable, 10000);
    }


    // ==========================================
    // SKILL: BachecaPublicWall & Quick Reply Engine
    // ==========================================
    const BACHECA_CONFESSIONS = [
      {
        id: 'b1',
        moniker: 'Anon_Milano',
        mood: 'cazzeggio',
        moodLabel: '💬 Cazzeggio',
        time: '7m fa',
        text: 'Fingo di avere una riunione urgente ogni venerdì alle 17:00 solo per uscire prima e andare al bar da solo.',
        fires: 42,
        skulls: 9
      },
      {
        id: 'b2',
        moniker: 'Shadow_Roma',
        mood: 'sfogati',
        moodLabel: '🖤 Sfogati',
        time: '18m fa',
        text: 'Ho cambiato città per ricominciare da zero ma ho capito che il problema non era la città, ero io.',
        fires: 88,
        skulls: 14
      },
      {
        id: 'b3',
        moniker: 'Neon_Torino',
        mood: 'flirt',
        moodLabel: '🔥 Flirt',
        time: '26m fa',
        text: 'L\'ho salutata ieri dicendole \'ci vediamo in giro\' sapendo benissimo che non l\'avrei mai più cercata.',
        fires: 61,
        skulls: 19
      },
      {
        id: 'b4',
        moniker: 'Ghost_Napoli',
        mood: 'cazzeggio',
        moodLabel: '💬 Cazzeggio',
        time: '34m fa',
        text: 'Mangio cereali direttamente dalla scatola a mezzanotte quando tutti dormono fingendo di stare al buio a riflettere.',
        fires: 35,
        skulls: 4
      },
      {
        id: 'b5',
        moniker: 'Viper_Bologna',
        mood: 'sfogati',
        moodLabel: '🖤 Sfogati',
        time: '52m fa',
        text: 'Non ho mai detto a nessuno che ho rifiutato quella borsa di studio all\'estero solo perché avevo paura di restare solo.',
        fires: 104,
        skulls: 22
      },
      {
        id: 'b6',
        moniker: 'Cyber_Firenze',
        mood: 'flirt',
        moodLabel: '🔥 Flirt',
        time: '1h fa',
        text: 'Metto sempre la stessa canzone nelle cuffie quando incrocio il mio vicino di casa sperando mi chieda cosa sto ascoltando.',
        fires: 73,
        skulls: 11
      }
    ];

    let activeBachecaFilter = 'tutti';

    function renderBacheca(filter = 'tutti') {
      activeBachecaFilter = filter;
      const grid = document.getElementById('bacheca-grid');
      if (!grid) return;
      grid.innerHTML = '';

      const items = filter === 'tutti'
        ? BACHECA_CONFESSIONS
        : BACHECA_CONFESSIONS.filter(c => c.mood.toLowerCase() === filter.toLowerCase());

      items.forEach(c => {
        const card = document.createElement('div');
        card.className = 'bg-street-surface border-2 border-zinc-800 hover:border-street-orange/60 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-xl shadow-lg transition duration-200 group';
        card.innerHTML = `
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-mono text-zinc-400 font-bold flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-street-orange shadow-[0_0_6px_#ff652f]"></span>
                <span class="bacheca-moniker"></span>
              </span>
              <span class="bacheca-mood text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-street-orange font-bold border border-zinc-800"></span>
            </div>
            <p class="bacheca-text text-sm text-zinc-100 font-sans italic my-3 leading-relaxed"></p>
          </div>
          <div class="pt-3.5 border-t border-zinc-800/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="bacheca-fire-btn px-2 py-1 rounded-lg bg-zinc-900/90 hover:bg-street-orange/20 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                <span>🔥</span> <span class="bacheca-fires-count"></span>
              </button>
              <button
                type="button"
                class="bacheca-skull-btn px-2 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                <span>💀</span> <span class="bacheca-skulls-count"></span>
              </button>
            </div>
            <button
              type="button"
              class="bacheca-reply-btn text-xs font-mono font-bold text-street-orange hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              <span>Rispondi</span> <span>→</span>
            </button>
          </div>
        `;
        safeSetText(card.querySelector('.bacheca-moniker'), c.moniker);
        safeSetText(card.querySelector('.bacheca-mood'), c.moodLabel);
        safeSetText(card.querySelector('.bacheca-text'), `"${c.text}"`);
        safeSetText(card.querySelector('.bacheca-fires-count'), c.fires);
        safeSetText(card.querySelector('.bacheca-skulls-count'), c.skulls);

        const fireBtn = card.querySelector('.bacheca-fire-btn');
        if (fireBtn) {
          fireBtn.addEventListener('click', function() {
            toggleBachecaReaction(c.id, 'fire', this);
          });
        }
        const skullBtn = card.querySelector('.bacheca-skull-btn');
        if (skullBtn) {
          skullBtn.addEventListener('click', function() {
            toggleBachecaReaction(c.id, 'skull', this);
          });
        }
        const replyBtn = card.querySelector('.bacheca-reply-btn');
        if (replyBtn) {
          replyBtn.addEventListener('click', function() {
            replyToConfession(c.mood, c.moniker);
          });
        }

        grid.appendChild(card);
      });
    }

    function filterBacheca(mood, btn) {
      document.querySelectorAll('.bacheca-filter-btn').forEach(b => {
        b.className = 'bacheca-filter-btn px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 cursor-pointer transition';
      });
      if (btn) {
        btn.className = 'bacheca-filter-btn active px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-street-orange text-black cursor-pointer transition';
      }
      renderBacheca(mood);
    }

    function toggleBachecaReaction(cardId, type, btn) {
      SoundEngine.playReaction();
      const card = BACHECA_CONFESSIONS.find(c => c.id === cardId);
      if (!card) return;
      if (type === 'fire') {
        card.fires++;
        if (btn) btn.querySelector('span:last-child').textContent = card.fires;
      } else {
        card.skulls++;
        if (btn) btn.querySelector('span:last-child').textContent = card.skulls;
      }
      showToast(type === 'fire' ? 'Hai lasciato una fiamma! 🔥' : 'Reazione teschio registrata! 💀', 'info');
    }

    function replyToConfession(mood, moniker) {
      switchView('landing', () => {
        // Find and click matching mood pill
        const pills = document.querySelectorAll('.mood-pill');
        pills.forEach(p => {
          if (p.getAttribute('data-mood').toLowerCase() === mood.toLowerCase()) {
            p.click();
          }
        });
        const secretInput = document.getElementById('secret-input');
        if (secretInput) {
          secretInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          secretInput.focus();
        }
      });
      showToast('Configura il tuo segreto per rispondere a ' + moniker + '!', 'info');
    }

    function toggleMobileView() {
      const vLanding = document.getElementById('view-landing');
      if (vLanding && !vLanding.classList.contains('hidden')) {
        switchView('bacheca');
      } else {
        switchView('landing');
      }
    }

    // Initialize Hash Router
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash;
      if (hash === '#bacheca') {
        switchView('bacheca');
      } else if (hash === '#profilo') {
        switchView('profilo');
      } else if (hash === '#app' || hash === '#confessionale') {
        switchView('app');
      } else if (hash === '#radar') {
        switchView('radar');
      } else if (hash === '#chat') {
        switchView('chat');
      } else if (hash === '#presentazione' || hash === '#landing' || hash === '' || hash === '#') {
        if (currentRoomId) {
          if (socket && socket.connected) {
            socket.emit('skip_partner', { roomId: currentRoomId });
          }
          currentRoomId = null;
        }
        clearInterval(countdownInterval);
        switchView('landing');
      }
    });

    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.hash === '#bacheca') {
        switchView('bacheca');
      } else if (window.location.hash === '#profilo') {
        switchView('profilo');
      } else {
        renderBacheca('tutti');
      }
    });

    function safeSetText(element, text) {
      if (element) {
        element.textContent = text == null ? '' : String(text);
      }
    }

    function escapeHTML(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    
    // Lead Generation Submission Handler
    function submitLeadEmail() {
      const input = document.getElementById('lead-email-input');
      const successEl = document.getElementById('lead-gen-success');
      const form = document.getElementById('lead-gen-form');
      if (!input || !input.value.trim()) return;
      const email = input.value.trim();
      if (!email.includes('@') || !email.includes('.')) {
        showToast('Inserisci un indirizzo email valido.', 'error');
        return;
      }
      try {
        localStorage.setItem('streetalk_lead_registered', 'true');
        localStorage.setItem('streetalk_lead_timestamp', Date.now().toString());
      } catch (e) {}

      if (typeof SoundEngine !== 'undefined' && SoundEngine.playMsgReceived) {
        SoundEngine.playMsgReceived();
      }
      showToast('Registrazione avvenuta con successo! Benvenuto nel Circolo 🔥', 'success');
      if (form) form.classList.add('hidden');
      if (successEl) {
        successEl.classList.remove('hidden');
        safeSetText(successEl, '✓ Sei nel Circolo Notturno! Ti scriveremo alle prossime novità.');
      }
    }

    function showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = `px-4 py-2.5 rounded-xl text-xs font-mono border backdrop-blur-xl shadow-xl transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto ${
        type === 'error'
          ? 'bg-red-950/90 border-red-800 text-red-200'
          : type === 'success'
          ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
          : 'bg-street-surface border-street-orange/60 text-street-orange'
      }`;
      safeSetText(toast, message);
      container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
      });

      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }

    // ==========================================
    // SKILL: AudioSynthesisEngine (Zero MP3 Dependencies)
    // ==========================================
    const SoundEngine = {
      ctx: null,
      enabled: true,

      init() {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      },

      activeVoiceSimCleanup: null,

      playVoiceSimulation(durationSec, playBtn, barEls, durLabel) {
        if (!this.enabled) return;
        this.init();

        if (this.activeVoiceSimCleanup) {
          this.activeVoiceSimCleanup();
          return;
        }

        const totalSec = Math.max(1, Math.round(Number(durationSec) || 12));
        playBtn.innerHTML = '⏸';

        let osc = null;
        let gain = null;
        let filter = null;
        if (this.ctx) {
          try {
            const now = this.ctx.currentTime;
            osc = this.ctx.createOscillator();
            gain = this.ctx.createGain();
            filter = this.ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now);

            for (let t = 0; t < totalSec; t += 0.2) {
              const freq = 180 + Math.sin(t * 8) * 50 + Math.cos(t * 14) * 35;
              osc.frequency.setValueAtTime(freq, now + t);
            }

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(500, now);
            filter.Q.setValueAtTime(3, now);

            gain.gain.setValueAtTime(0.04, now);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + totalSec);
          } catch (e) {}
        }

        const startTime = Date.now();
        const interval = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          const progress = Math.min(1, elapsed / totalSec);
          const filledBars = Math.floor(progress * (barEls ? barEls.length : 20));
          if (barEls) {
            barEls.forEach((bar, idx) => {
              if (idx <= filledBars) {
                bar.classList.add('played');
              } else {
                bar.classList.remove('played');
              }
            });
          }
          const rem = Math.max(0, Math.ceil(totalSec - elapsed));
          if (durLabel) safeSetText(durLabel, `0:${String(rem).padStart(2, '0')}`);

          if (elapsed >= totalSec) {
            cleanup();
          }
        }, 100);

        const cleanup = () => {
          clearInterval(interval);
          if (osc) {
            try { osc.stop(); } catch (e) {}
          }
          playBtn.innerHTML = '▶';
          if (barEls) barEls.forEach(bar => bar.classList.remove('played'));
          if (durLabel) safeSetText(durLabel, `0:${String(totalSec).padStart(2, '0')}`);
          this.activeVoiceSimCleanup = null;
        };

        this.activeVoiceSimCleanup = cleanup;
      },


      playRadarSweep() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(432, now);
          osc.frequency.exponentialRampToValueAtTime(864, now + 0.38);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.06);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.42);
        } catch (e) {}
      },

      playMatchSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          // Amplified 808 sub-bass sweep (punch & visceral low-end)
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(160, now);
          osc.frequency.exponentialRampToValueAtTime(36, now + 0.45);
          gain.gain.setValueAtTime(0.38, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.48);

          // Sub-harmonic punch
          const subOsc = this.ctx.createOscillator();
          const subGain = this.ctx.createGain();
          subOsc.type = 'triangle';
          subOsc.frequency.setValueAtTime(95, now);
          subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.28);
          subGain.gain.setValueAtTime(0.22, now);
          subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          subOsc.connect(subGain);
          subGain.connect(this.ctx.destination);
          subOsc.start(now);
          subOsc.stop(now + 0.28);

          // Metallic bell chime
          const chime = this.ctx.createOscillator();
          const chimeGain = this.ctx.createGain();
          chime.type = 'triangle';
          chime.frequency.setValueAtTime(880, now);
          chime.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
          chimeGain.gain.setValueAtTime(0.14, now);
          chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          chime.connect(chimeGain);
          chimeGain.connect(this.ctx.destination);
          chime.start(now);
          chime.stop(now + 0.25);
        } catch (e) {}
      },

      playMsgSent() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(420, now);
          osc.frequency.exponentialRampToValueAtTime(260, now + 0.07);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.07);
        } catch (e) {}
      },

      playMsgReceived() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(540, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.11);
        } catch (e) {}
      },

      playReaction() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          const osc1 = this.ctx.createOscillator();
          const gain1 = this.ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(440, now);
          osc1.frequency.exponentialRampToValueAtTime(660, now + 0.05);
          gain1.gain.setValueAtTime(0.22, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
          osc1.connect(gain1);
          gain1.connect(this.ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.06);

          const osc2 = this.ctx.createOscillator();
          const gain2 = this.ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(660, now + 0.06);
          osc2.frequency.exponentialRampToValueAtTime(990, now + 0.12);
          gain2.gain.setValueAtTime(0.24, now + 0.06);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          osc2.connect(gain2);
          gain2.connect(this.ctx.destination);
          osc2.start(now + 0.06);
          osc2.stop(now + 0.14);
        } catch (e) {}
      },

      playWarning() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          [0, 0.14].forEach(offset => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, now + offset);
            gain.gain.setValueAtTime(0.08, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + 0.09);
          });
        } catch (e) {}
      },

      playSkip() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.18);
        } catch (e) {}
      }
    };

    function toggleSound() {
      SoundEngine.enabled = !SoundEngine.enabled;
      const icon = document.getElementById('sound-icon');
      const text = document.getElementById('sound-text');
      if (SoundEngine.enabled) {
        SoundEngine.init();
        if (icon) icon.textContent = '🔊';
        if (text) text.textContent = 'SFX ON';
        showToast('Effetti sonori attivati', 'info');
      } else {
        if (icon) icon.textContent = '🔇';
        if (text) text.textContent = 'SFX OFF';
        showToast('Effetti sonori disattivati', 'info');
      }
    }

    // FAQ Accordion Toggle
    function toggleFaq(btn) {
      const parent = btn.parentElement;
      const answer = parent.querySelector('.faq-answer');
      const icon = parent.querySelector('.faq-icon');

      if (answer.classList.contains('hidden')) {
        answer.classList.remove('hidden');
        icon.textContent = '−';
        parent.classList.add('border-street-orange/50');
      } else {
        answer.classList.add('hidden');
        icon.textContent = '+';
        parent.classList.remove('border-street-orange/50');
      }
    }

    // Secret Validation Helper (3-90 chars, no script, no url, no phone)
    function validateSecretInput(val) {
      if (!val || typeof val !== 'string') {
        return { valid: false, error: 'Scrivi una confessione anonima per entrare.' };
      }
      const trimmed = val.trim();
      if (trimmed.length < 3) {
        return { valid: false, error: 'Il segreto deve avere almeno 3 caratteri.' };
      }
      if (trimmed.length > 90) {
        return { valid: false, error: 'Il segreto non può superare 90 caratteri.' };
      }
      if (/<\s*\/?\s*script/i.test(trimmed)) {
        return { valid: false, error: 'Vietato inserire tag <script> o codice.' };
      }
      if (/https?:/i.test(trimmed) || /www\.[a-z0-9\-]+(?:\.[a-z]{2,})/i.test(trimmed)) {
        return { valid: false, error: 'Vietato inserire link o URL web.' };
      }
      const isPhone = (
        /(?:\+|00)\d{1,4}[\s./-]?\(?\d{1,4}\)?(?:[\s./-]?\d{2,5}){2,4}/.test(trimmed) ||
        /(?:\b|\()(?:\d{2,4}[\s./-]|\(\d{2,4}\)[\s.-]?)\d{3,4}[\s./-]?\d{3,7}\b/.test(trimmed) ||
        /\b(?:\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{7,11})\b/.test(trimmed)
      );
      if (isPhone) {
        return { valid: false, error: 'Vietato inserire numeri di telefono.' };
      }
      return { valid: true, text: trimmed };
    }

    // View Switching with Cinematic GSAP Transition

    // Direct Chatroom Interactive Preview Mode
    function launchChatPreview() {
      clearInterval(radarInterval);
      currentRoomId = null; // marks preview/demo mode
      mySecret = mySecret || 'A volte spengo tutte le notifiche e fingo di non essere reperibile per 24 ore.';
      partnerSecret = 'Ho finto di aver dimenticato il portafoglio al primo appuntamento perché ero al verde.';
      partnerNick = 'SHADOW_88';
      myNick = myNick || 'NEON_24';
      partnerMood = selectedMood || 'Cazzeggio';
      partnerGender = 'F';

      safeSetText(document.getElementById('chat-partner-nick'), partnerNick);
      safeSetText(document.getElementById('chat-top-partner-nick'), partnerNick);
      safeSetText(document.getElementById('chat-pinned-partner-nick'), partnerNick);
      safeSetText(document.getElementById('chat-partner-secret-snippet'), `"${partnerSecret.substring(0, 48)}..."`);
      safeSetText(document.getElementById('chat-my-nick-badge'), `Tu: ${myNick}`);
      safeSetText(document.getElementById('chat-partner-gender'), partnerGender);
      safeSetText(document.getElementById('chat-partner-mood'), partnerMood);

      safeSetText(document.getElementById('chat-partner-secret-box'), partnerSecret);
      safeSetText(document.getElementById('chat-my-secret-text'), mySecret);

      const container = document.getElementById('messages-container');
      container.innerHTML = `
        <div class="text-center my-2">
          <span class="text-[10px] font-mono bg-street-orange/15 border border-street-orange/30 text-street-orange px-3.5 py-1 rounded-full shadow-sm">
            ⚡ ANTEPRIMA CHAT TELEGRAM • 180 secondi • Crittografia RAM effimera
          </span>
        </div>
      `;

      // 1. Incoming text bubble (Telegram Dark Graphite)
      appendMessageBubble({
        message: 'Bella! Ho letto il tuo segreto... assurdo 😂 Sei pronto a parlare o scappi prima dei 3 minuti?',
        timestamp: Date.now() - 32000
      }, false);

      // 2. Incoming playable demo voice note
      appendMessageBubble({
        type: 'audio',
        audioData: 'demo',
        duration: 12,
        timestamp: Date.now() - 20000
      }, false);

      // 3. Incoming reaction GIF card (Direct CDN without referer restrictions)
      appendMessageBubble({
        type: 'gif',
        gifUrl: '/assets/gifs/flame.svg',
        timestamp: Date.now() - 10000
      }, false);

      // 4. Outgoing text bubble (Telegram Street Orange)
      appendMessageBubble({
        message: 'Assurdo fra, parliamone subito prima che scada il timer dei 180s ⏳',
        timestamp: Date.now() - 2000
      }, true);

      // Ensure secret drawer is open by default
      const secretDrawer = document.getElementById('pinned-secret-drawer');
      const secretChevron = document.getElementById('pinned-secret-chevron');
      if (secretDrawer) secretDrawer.classList.remove('hidden');
      if (secretChevron) secretChevron.classList.add('rotate-180');

      const extBtn = document.getElementById('btn-extension');
      if (extBtn) {
        extBtn.classList.remove('bg-street-orange/30', 'text-street-orange');
        safeSetText(extBtn, '+5m');
      }

      startChatCountdown(180);
      SoundEngine.init();
      SoundEngine.playMatchSound();

      if (typeof decryptMatrixText === 'function') {
        decryptMatrixText(document.getElementById('chat-partner-secret-box'), partnerSecret, 600);
      }

      switchView('chat', () => {
        if (window.gsap) {
          try {
            gsap.fromTo('#partner-secret-card',
              { scale: 0.85, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' }
            );
          } catch (e) {}
        }
      });

      showToast('Sei entrato nell\'anteprima interattiva della chatroom! 🔥', 'success');
    }

    function switchView(viewName, onActive) {
      const vLanding = document.getElementById('view-landing');
      const vApp = document.getElementById('view-app');
      const vRadar = document.getElementById('view-radar');
      const vChat = document.getElementById('view-chat');
      const vBacheca = document.getElementById('view-bacheca');
      const vProfilo = document.getElementById('view-profilo');
      const views = { landing: vLanding, app: vApp, radar: vRadar, chat: vChat, bacheca: vBacheca, profilo: vProfilo };

      const targetView = views[viewName];
      if (!targetView) return;
      if (viewName !== 'landing' && !socket.connected && typeof socket.connect === 'function') socket.connect();
      if (viewName === 'radar') loadRadarEngine();
      if (viewName === 'profilo') loadFullProfileView();

      // Update Nav buttons styling
      const navLanding = document.getElementById('nav-btn-landing');
      const navApp = document.getElementById('nav-btn-app');
      const navBacheca = document.getElementById('nav-btn-bacheca');
      const navProfilo = document.getElementById('nav-btn-profilo');
      const mobileNavIcon = document.getElementById('mobile-nav-icon');
      
      const activeClass = 'px-3 py-1.5 rounded-xl font-bold transition text-white bg-zinc-800/80 border border-street-orange/60 hover:border-street-orange cursor-pointer flex items-center gap-1.5';
      const inactiveClass = 'px-3 py-1.5 rounded-xl font-medium transition text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer flex items-center gap-1.5';

      if (navLanding && navBacheca) {
        navLanding.className = inactiveClass;
        if (navApp) navApp.className = inactiveClass;
        navBacheca.className = inactiveClass;
        if (navProfilo) navProfilo.className = inactiveClass;

        if (viewName === 'landing') {
          navLanding.className = activeClass;
          if (mobileNavIcon) mobileNavIcon.textContent = '🏠';
          window.location.hash = '#presentazione';
        } else if (viewName === 'app') {
          if (navApp) navApp.className = activeClass;
          if (mobileNavIcon) mobileNavIcon.textContent = '⚡';
          window.location.hash = '#app';
        } else if (viewName === 'bacheca') {
          navBacheca.className = activeClass;
          if (mobileNavIcon) mobileNavIcon.textContent = '📜';
          window.location.hash = '#bacheca';
          renderBacheca('tutti');
        } else if (viewName === 'profilo') {
          if (navProfilo) navProfilo.className = activeClass;
          if (mobileNavIcon) mobileNavIcon.textContent = '👤';
          window.location.hash = '#profilo';
        } else if (viewName === 'radar') {
          window.location.hash = '#radar';
        } else if (viewName === 'chat') {
          window.location.hash = '#chat';
        }
      }

      // Fullscreen Chat Mode: hide main-header and lock body scroll
      const mainHeader = document.getElementById('main-header');
      if (viewName === 'chat') {
        if (mainHeader) mainHeader.classList.add('hidden');
        document.body.classList.add('chat-mode-active');
      } else {
        if (mainHeader) mainHeader.classList.remove('hidden');
        document.body.classList.remove('chat-mode-active');
        toggleMobileChatSidebar(false);
      }

      const allViews = [vLanding, vApp, vRadar, vChat, vBacheca, vProfilo].filter(Boolean);
      const currentActive = allViews.find(v => !v.classList.contains('hidden'));

      if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches && currentActive && currentActive !== targetView) {
        gsap.to(currentActive, {
          opacity: 0,
          y: -12,
          scale: 0.99,
          duration: 0.18,
          ease: 'power2.in',
          onComplete: () => {
            allViews.forEach(v => v.classList.add('hidden'));
            targetView.classList.remove('hidden');

            if (viewName === 'landing' || viewName === 'bacheca' || viewName === 'profilo') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            if (typeof onActive === 'function') {
              onActive();
            }

            if (targetView === vChat) {
              gsap.fromTo(targetView,
                { opacity: 0 },
                { opacity: 1, duration: 0.2, ease: 'power2.out', clearProps: 'transform' }
              );
            } else {
              gsap.fromTo(targetView,
                { opacity: 0, y: 14, scale: 0.99 },
                { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power3.out' }
              );
            }
          }
        });
        return;
      }

      // Instant fallback
      allViews.forEach(v => v.classList.add('hidden'));
      targetView.classList.remove('hidden');
      if (viewName === 'landing' || viewName === 'bacheca' || viewName === 'profilo') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (typeof onActive === 'function') {
        onActive();
      }
    }

    // Mobile Chat Sidebar Drawer Toggle
    function toggleMobileChatSidebar(forceState) {
      const sidebar = document.getElementById('chat-sidebar');
      const backdrop = document.getElementById('chat-sidebar-backdrop');
      if (!sidebar) return;
      const willOpen = typeof forceState === 'boolean' ? forceState : !sidebar.classList.contains('mobile-open');
      if (willOpen) {
        sidebar.classList.add('mobile-open');
        if (backdrop) backdrop.classList.remove('hidden');
      } else {
        sidebar.classList.remove('mobile-open');
        if (backdrop) backdrop.classList.add('hidden');
      }
    }

    // Radar Actions
    function initiateRadarSearch() {
      SoundEngine.init();
      const secretInput = document.getElementById('secret-input');
      const secretVal = secretInput.value;

      const validation = validateSecretInput(secretVal);
      if (!validation.valid) {
        showToast(validation.error, 'error');
        secretInput.focus();
        return;
      }

      const ripple = document.getElementById('btn-ripple');
      if (ripple) {
        ripple.style.opacity = '1';
        setTimeout(() => { ripple.style.opacity = '0'; }, 200);
      }

      mySecret = validation.text;
      const gender = document.getElementById('user-gender').value;
      const targetGender = document.getElementById('target-gender').value;

      safeSetText(document.getElementById('radar-display-mood'), selectedMood);
      safeSetText(document.getElementById('radar-display-pos'), '#1');
      safeSetText(document.getElementById('radar-timer-counter'), '00:00');
      safeSetText(document.getElementById('radar-status-text'), `In cerca di un partner sul mood [${selectedMood}]...`);

      radarSecondsCounter = 0;
      clearInterval(radarInterval);
      radarInterval = setInterval(() => {
        radarSecondsCounter++;
        const mins = String(Math.floor(radarSecondsCounter / 60)).padStart(2, '0');
        const secs = String(radarSecondsCounter % 60).padStart(2, '0');
        safeSetText(document.getElementById('radar-timer-counter'), `${mins}:${secs}`);
      }, 1000);

      switchView('radar');
      if (SoundEngine.playRadarSweep) SoundEngine.playRadarSweep();

      const joinPayload = {
        gender,
        targetGender,
        mood: selectedMood,
        secret: mySecret,
        profile: getUserProfile()
      };

      if (socket && socket.connected) {
        pendingQueueJoin = null;
        socket.emit('join_queue', joinPayload);
      } else {
        pendingQueueJoin = joinPayload;
        safeSetText(document.getElementById('radar-status-text'), 'Connessione al server in corso (risveglio cloud)...');
      }
    }

    function cancelRadarSearch() {
      clearInterval(radarInterval);
      pendingQueueJoin = null;
      if (socket && socket.connected) {
        socket.emit('leave_queue');
      }
      switchView('landing');
    }

    function backToLanding() {
      clearInterval(radarInterval);
      clearInterval(countdownInterval);
      pendingQueueJoin = null;
      document.getElementById('modal-ended').classList.add('hidden');
      closeReportModal();
      closeSocialCardModal();
      currentRoomId = null;
      switchView('landing');
    }

    function leaveChatToRadar() {
      if (socket && socket.connected && currentRoomId) {
        socket.emit('skip_partner', { roomId: currentRoomId });
      }
      clearInterval(countdownInterval);
      const modalEnded = document.getElementById('modal-ended');
      if (modalEnded) modalEnded.classList.add('hidden');
      closeReportModal();
      closeSocialCardModal();
      currentRoomId = null;

      // Strictly return to RADAR screen
      switchView('radar');
      loadRadarEngine();

      if (mySecret) {
        safeSetText(document.getElementById('radar-display-mood'), selectedMood || 'Cazzeggio');
        safeSetText(document.getElementById('radar-display-pos'), '#1');
        safeSetText(document.getElementById('radar-timer-counter'), '00:00');
        safeSetText(document.getElementById('radar-status-text'), `In cerca di un partner sul mood [${selectedMood || 'Cazzeggio'}]...`);

        radarSecondsCounter = 0;
        clearInterval(radarInterval);
        radarInterval = setInterval(() => {
          radarSecondsCounter++;
          const mins = String(Math.floor(radarSecondsCounter / 60)).padStart(2, '0');
          const secs = String(radarSecondsCounter % 60).padStart(2, '0');
          safeSetText(document.getElementById('radar-timer-counter'), `${mins}:${secs}`);
        }, 1000);

        const gender = document.getElementById('user-gender')?.value || 'M';
        const targetGender = document.getElementById('target-gender')?.value || 'ALL';

        const joinPayload = {
          gender,
          targetGender,
          mood: selectedMood || 'Cazzeggio',
          secret: mySecret,
          profile: getUserProfile()
        };

        if (socket && socket.connected) {
          pendingQueueJoin = null;
          socket.emit('join_queue', joinPayload);
        } else {
          pendingQueueJoin = joinPayload;
        }
      }
    }

    function leaveChatToHome() {
      leaveChatToRadar();
    }

    function restartWithSameSecret() {
      document.getElementById('modal-ended').classList.add('hidden');
      closeReportModal();
      closeSocialCardModal();
      initiateRadarSearch();
    }

    // Telegram Pinned Secret Drawer Toggle
    function togglePinnedSecret() {
      const drawer = document.getElementById('pinned-secret-drawer');
      const chevron = document.getElementById('pinned-secret-chevron');
      if (!drawer) return;
      drawer.classList.toggle('hidden');
      if (chevron) {
        chevron.classList.toggle('rotate-180');
      }
    }

    // Dynamic Telegram Input State (Mic vs Send Button)
    function updateChatInputState() {
      const input = document.getElementById('chat-message-input');
      const micBtn = document.getElementById('btn-chat-mic');
      const sendBtn = document.getElementById('btn-chat-send');
      if (!input || !micBtn || !sendBtn) return;
      const hasText = input.value.trim().length > 0;
      if (hasText) {
        micBtn.classList.add('hidden');
        sendBtn.classList.remove('hidden');
      } else {
        micBtn.classList.remove('hidden');
        sendBtn.classList.add('hidden');
      }
    }

    // Curated High-Speed Reaction GIFs Catalog (Local Verified Permanent Assets)
    const STREET_GIF_CATALOG = {
      trend: [
        { label: 'Lit Fire', url: '/assets/gifs/flame.svg' },
        { label: 'Popcorn Time', url: '/assets/gifs/popcorn.svg' },
        { label: 'Mind Blown', url: '/assets/gifs/mindblown.svg' },
        { label: 'Respect Salute', url: '/assets/gifs/respect.svg' },
        { label: 'Cool Doge', url: '/assets/gifs/doge.svg' },
        { label: 'Night Drive', url: '/assets/gifs/drive.svg' }
      ],
      street: [
        { label: 'Night Drive', url: '/assets/gifs/drive.svg' },
        { label: 'Boombox Beat', url: '/assets/gifs/boombox.svg' },
        { label: 'Urban Skater', url: '/assets/gifs/skate.svg' },
        { label: 'Lit Fire', url: '/assets/gifs/flame.svg' },
        { label: 'Cyber Bolt', url: '/assets/gifs/cyber.svg' },
        { label: 'Moonlight Alley', url: '/assets/gifs/moon.svg' }
      ],
      reazioni: [
        { label: 'Shocked Face', url: '/assets/gifs/shock.svg' },
        { label: 'Facepalm', url: '/assets/gifs/facepalm.svg' },
        { label: 'Mind Blown', url: '/assets/gifs/mindblown.svg' },
        { label: 'Respect Salute', url: '/assets/gifs/respect.svg' },
        { label: 'Popcorn Time', url: '/assets/gifs/popcorn.svg' },
        { label: 'Lit Fire', url: '/assets/gifs/flame.svg' }
      ],
      memes: [
        { label: 'Roll Safe Smart', url: '/assets/gifs/smart.svg' },
        { label: 'Cool Doge', url: '/assets/gifs/doge.svg' },
        { label: 'Facepalm', url: '/assets/gifs/facepalm.svg' },
        { label: 'Laugh Hard', url: '/assets/gifs/lol.svg' },
        { label: 'Wheezing Laugh', url: '/assets/gifs/wheeze.svg' },
        { label: 'Mind Blown', url: '/assets/gifs/mindblown.svg' }
      ],
      lol: [
        { label: 'Laugh Hard', url: '/assets/gifs/lol.svg' },
        { label: 'Wheezing Laugh', url: '/assets/gifs/wheeze.svg' },
        { label: 'Cool Doge', url: '/assets/gifs/doge.svg' },
        { label: 'Shocked Face', url: '/assets/gifs/shock.svg' },
        { label: 'Facepalm', url: '/assets/gifs/facepalm.svg' },
        { label: 'Roll Safe', url: '/assets/gifs/smart.svg' }
      ],
      notte: [
        { label: 'Moonlight Alley', url: '/assets/gifs/moon.svg' },
        { label: 'Midnight Smoke', url: '/assets/gifs/smoke.svg' },
        { label: 'Night Drive', url: '/assets/gifs/drive.svg' },
        { label: 'Cyber Bolt', url: '/assets/gifs/cyber.svg' },
        { label: 'Vinyl Beat', url: '/assets/gifs/vinyl.svg' },
        { label: 'Lit Fire', url: '/assets/gifs/flame.svg' }
      ],
      cyberpunk: [
        { label: 'Cyber Bolt', url: '/assets/gifs/cyber.svg' },
        { label: 'Night Drive', url: '/assets/gifs/drive.svg' },
        { label: 'Boombox Beat', url: '/assets/gifs/boombox.svg' },
        { label: 'Midnight Smoke', url: '/assets/gifs/smoke.svg' },
        { label: 'Mind Blown', url: '/assets/gifs/mindblown.svg' },
        { label: 'Anime Sparkle', url: '/assets/gifs/anime.svg' }
      ],
      anime: [
        { label: 'Anime Sparkle', url: '/assets/gifs/anime.svg' },
        { label: 'Moonlight Alley', url: '/assets/gifs/moon.svg' },
        { label: 'Midnight Smoke', url: '/assets/gifs/smoke.svg' },
        { label: 'Vinyl Beat', url: '/assets/gifs/vinyl.svg' },
        { label: 'Shocked Face', url: '/assets/gifs/shock.svg' },
        { label: 'Lit Fire', url: '/assets/gifs/flame.svg' }
      ],
      music: [
        { label: 'Vinyl Beat', url: '/assets/gifs/vinyl.svg' },
        { label: 'Boombox Beat', url: '/assets/gifs/boombox.svg' },
        { label: 'Urban Skater', url: '/assets/gifs/skate.svg' },
        { label: 'Night Drive', url: '/assets/gifs/drive.svg' },
        { label: 'Lit Fire', url: '/assets/gifs/flame.svg' },
        { label: 'Cyber Bolt', url: '/assets/gifs/cyber.svg' }
      ]
    };

    let activeGifCategory = 'trend';
    let gifAbortController = null;
    let searchDebounceTimer = null;

    function toggleGifPicker(forceState) {
      const popover = document.getElementById('chat-gif-popover');
      if (!popover) return;
      const willOpen = typeof forceState === 'boolean' ? forceState : popover.classList.contains('hidden');
      if (willOpen) {
        loadGifs({ category: activeGifCategory });
        popover.classList.remove('hidden');
        const input = document.getElementById('gif-search-input');
        if (input && window.innerWidth >= 768) {
          setTimeout(() => input.focus(), 80);
        }
      } else {
        popover.classList.add('hidden');
        if (gifAbortController) {
          gifAbortController.abort();
          gifAbortController = null;
        }
      }
    }

    function switchGifCategory(cat, btnEl) {
      activeGifCategory = cat;
      const input = document.getElementById('gif-search-input');
      const clearBtn = document.getElementById('gif-search-clear');
      if (input) input.value = '';
      if (clearBtn) clearBtn.classList.add('hidden');

      const popover = document.getElementById('chat-gif-popover');
      if (popover) {
        popover.querySelectorAll('.gif-cat-btn').forEach(b => {
          b.className = 'gif-cat-btn px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer whitespace-nowrap';
        });
      }
      if (btnEl) {
        btnEl.className = 'gif-cat-btn active px-2.5 py-1 rounded-lg bg-street-orange text-black font-bold cursor-pointer whitespace-nowrap';
      }
      loadGifs({ category: cat });
    }

    function clearGifSearch() {
      const input = document.getElementById('gif-search-input');
      const clearBtn = document.getElementById('gif-search-clear');
      if (input) {
        input.value = '';
        input.focus();
      }
      if (clearBtn) clearBtn.classList.add('hidden');
      loadGifs({ category: activeGifCategory });
    }

    function renderGifSkeletons() {
      const grid = document.getElementById('chat-gif-grid');
      if (!grid) return;
      grid.innerHTML = Array(6).fill(0).map(() => 
        '<div class="tg-gif-3d-card tg-gif-loading-skeleton" aria-hidden="true"></div>'
      ).join('');
    }

    async function loadGifs({ category = activeGifCategory, query = '' } = {}) {
      const grid = document.getElementById('chat-gif-grid');
      if (!grid) return;

      if (gifAbortController) {
        gifAbortController.abort();
      }
      gifAbortController = new AbortController();

      renderGifSkeletons();

      const badge = document.getElementById('gif-provider-badge');

      try {
        const url = query.trim()
          ? `/api/gifs/search?q=${encodeURIComponent(query.trim())}&limit=18`
          : `/api/gifs/trending?category=${encodeURIComponent(category)}&limit=18`;

        const res = await fetch(url, { signal: gifAbortController.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const items = (json && Array.isArray(json.items) && json.items.length > 0)
          ? json.items
          : (STREET_GIF_CATALOG[category] || STREET_GIF_CATALOG.trend).map(i => ({
              id: 'curated_' + Math.random().toString(36).slice(2, 7),
              title: i.label,
              url: i.url,
              previewUrl: i.url,
              provider: 'curated'
            }));

        if (badge) {
          const pName = json.provider || 'Curated';
          badge.textContent = pName.charAt(0).toUpperCase() + pName.slice(1);
        }

        renderGifItems(items);
      } catch (err) {
        if (err.name === 'AbortError') return;
        const fallbackItems = (STREET_GIF_CATALOG[category] || STREET_GIF_CATALOG.trend).map(i => ({
          id: 'curated_' + Math.random().toString(36).slice(2, 7),
          title: i.label,
          url: i.url,
          previewUrl: i.url,
          provider: 'curated'
        }));
        if (badge) badge.textContent = 'Curated';
        renderGifItems(fallbackItems);
      }
    }

    function renderGifItems(items) {
      const grid = document.getElementById('chat-gif-grid');
      if (!grid) return;
      grid.innerHTML = '';

      if (!items || items.length === 0) {
        grid.innerHTML = '<div class="col-span-3 text-center py-6 text-xs text-zinc-500 font-mono">Nessuna GIF trovata</div>';
        return;
      }

      items.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tg-gif-3d-card';
        btn.setAttribute('role', 'button');
        btn.setAttribute('tabindex', '0');
        btn.setAttribute('aria-label', `Invia GIF: ${item.title || 'Reaction'}`);
        btn.title = item.title || 'GIF';

        const img = document.createElement('img');
        img.src = item.previewUrl || item.url;
        img.alt = item.title || 'Reaction GIF';
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        img.setAttribute('referrerpolicy', 'no-referrer');
        img.crossOrigin = 'anonymous';

        img.onerror = () => {
          img.onerror = null;
          img.src = '/assets/gifs/flame.svg';
        };

        const badge = document.createElement('span');
        badge.className = 'tg-gif-3d-badge';
        safeSetText(badge, item.title || item.category || 'Reaction');

        btn.appendChild(img);
        btn.appendChild(badge);

        btn.onclick = () => {
          sendGif(item.url || item.previewUrl);
          toggleGifPicker(false);
        };

        btn.onkeydown = (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            sendGif(item.url || item.previewUrl);
            toggleGifPicker(false);
          }
        };

        grid.appendChild(btn);
      });
    }

    function sendGif(gifUrl) {
      if (!gifUrl) return;
      if (socket && socket.connected && currentRoomId) {
        socket.emit('send_message', {
          roomId: currentRoomId,
          type: 'gif',
          gifUrl
        });
      } else if (!currentRoomId) {
        // Preview mode echo
        appendMessageBubble({ type: 'gif', gifUrl, timestamp: Date.now() }, true);
        SoundEngine.playMsgSent();

        const typingEl = document.getElementById('chat-partner-typing-indicator');
        if (typingEl) typingEl.style.opacity = '1';

        setTimeout(() => {
          if (typingEl) typingEl.style.opacity = '0';
          const partnerGifs = STREET_GIF_CATALOG.lol;
          const randomGif = partnerGifs[Math.floor(Math.random() * partnerGifs.length)].url;
          appendMessageBubble({ type: 'gif', gifUrl: randomGif, timestamp: Date.now() }, false);
          SoundEngine.playMsgReceived();
        }, 1200);
      }
    }

    // Web Audio Voice Notes Recorder (Ephemeral MediaRecorder)
    let audioMediaRecorder = null;
    let audioStream = null;
    let recordedAudioChunks = [];
    let audioRecordingInterval = null;
    let audioRecordingStart = 0;

    async function startAudioRecording() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('Microfono non supportato su questo browser.', 'error');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream = stream;
        recordedAudioChunks = [];

        let options = {};
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options = { mimeType: 'audio/webm;codecs=opus' };
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
          }
        }

        audioMediaRecorder = new MediaRecorder(stream, options);

        audioMediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedAudioChunks.push(e.data);
          }
        };

        audioMediaRecorder.start(100);
        audioRecordingStart = Date.now();

        // Show recording bar, hide input form
        const recBar = document.getElementById('chat-recording-bar');
        const inputForm = document.getElementById('chat-input-form');
        const recTimer = document.getElementById('recording-timer');
        if (recBar) recBar.classList.remove('hidden');
        if (inputForm) inputForm.classList.add('hidden');
        safeSetText(recTimer, '00:00');

        clearInterval(audioRecordingInterval);
        audioRecordingInterval = setInterval(() => {
          const elapsedSec = Math.floor((Date.now() - audioRecordingStart) / 1000);
          const m = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
          const s = String(elapsedSec % 60).padStart(2, '0');
          safeSetText(recTimer, `${m}:${s}`);

          if (elapsedSec >= 60) {
            stopAndSendAudioRecording();
          }
        }, 1000);

      } catch (err) {
        if (!currentRoomId) {
          audioRecordingStart = Date.now();
          const recBar = document.getElementById('chat-recording-bar');
          const inputForm = document.getElementById('chat-input-form');
          const recTimer = document.getElementById('recording-timer');
          if (recBar) recBar.classList.remove('hidden');
          if (inputForm) inputForm.classList.add('hidden');
          safeSetText(recTimer, '00:00');

          clearInterval(audioRecordingInterval);
          audioRecordingInterval = setInterval(() => {
            const elapsedSec = Math.floor((Date.now() - audioRecordingStart) / 1000);
            const m = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
            const s = String(elapsedSec % 60).padStart(2, '0');
            safeSetText(recTimer, `${m}:${s}`);

            if (elapsedSec >= 60) {
              stopAndSendAudioRecording();
            }
          }, 1000);
          showToast('Modalità demo: simulazione registrazione vocale avviata 🎙️', 'info');
          return;
        }
        showToast('Impossibile accedere al microfono. Verifica i permessi.', 'error');
      }
    }

    function cleanupRecordingState() {
      clearInterval(audioRecordingInterval);
      if (audioStream) {
        try {
          audioStream.getTracks().forEach(track => track.stop());
        } catch (e) {}
        audioStream = null;
      }
      audioMediaRecorder = null;
      recordedAudioChunks = [];

      const recBar = document.getElementById('chat-recording-bar');
      const inputForm = document.getElementById('chat-input-form');
      if (recBar) recBar.classList.add('hidden');
      if (inputForm) inputForm.classList.remove('hidden');
    }

    function cancelAudioRecording() {
      if (audioMediaRecorder && audioMediaRecorder.state !== 'inactive') {
        try {
          audioMediaRecorder.stop();
        } catch (e) {}
      }
      cleanupRecordingState();
      showToast('Registrazione vocale annullata.', 'info');
    }

    function stopAndSendAudioRecording() {
      const durationSec = Math.max(1, Math.round((Date.now() - (audioRecordingStart || Date.now())) / 1000));

      if (!audioMediaRecorder || audioMediaRecorder.state === 'inactive') {
        if (!currentRoomId && audioRecordingStart) {
          sendAudioMessage('demo', durationSec);
        }
        cleanupRecordingState();
        return;
      }

      audioMediaRecorder.onstop = () => {
        if (!recordedAudioChunks.length) {
          cleanupRecordingState();
          return;
        }

        const mime = (audioMediaRecorder && audioMediaRecorder.mimeType) || 'audio/webm';
        const audioBlob = new Blob(recordedAudioChunks, { type: mime });

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result;
          if (typeof base64Audio === 'string' && base64Audio.startsWith('data:audio/')) {
            sendAudioMessage(base64Audio, durationSec);
          }
          cleanupRecordingState();
        };
        reader.readAsDataURL(audioBlob);
      };

      try {
        audioMediaRecorder.stop();
      } catch (e) {
        cleanupRecordingState();
      }
    }

    function sendAudioMessage(audioData, duration) {
      if (socket && socket.connected && currentRoomId) {
        socket.emit('send_message', {
          roomId: currentRoomId,
          type: 'audio',
          audioData,
          duration
        });
      } else if (!currentRoomId) {
        appendMessageBubble({ type: 'audio', audioData, duration, timestamp: Date.now() }, true);
        SoundEngine.playMsgSent();

        const typingEl = document.getElementById('chat-partner-typing-indicator');
        if (typingEl) typingEl.style.opacity = '1';

        setTimeout(() => {
          if (typingEl) typingEl.style.opacity = '0';
          appendMessageBubble({
            message: 'Ho ascoltato il tuo vocale... voce interessantissima! Dimmi di più sul segreto 🔥',
            timestamp: Date.now()
          }, false);
          SoundEngine.playMsgReceived();
        }, 1500);
      }
    }

    // Ephemeral Voice Note Web Audio Player
    let activeAudioInstance = null;
    let activeAudioCleanup = null;

    function playVoiceNote(audioData, playBtn, barEls, durLabel, totalDuration) {
      if (!audioData) return;

      if (audioData === 'demo' || audioData === 'synthetic' || !audioData.startsWith('data:audio/')) {
        SoundEngine.playVoiceSimulation(totalDuration || 12, playBtn, barEls, durLabel);
        return;
      }

      if (activeAudioInstance && !activeAudioInstance.paused && playBtn.textContent === '⏸') {
        activeAudioInstance.pause();
        playBtn.innerHTML = '▶';
        return;
      }

      if (activeAudioCleanup) {
        activeAudioCleanup();
      }

      try {
        const audio = new Audio(audioData);
        activeAudioInstance = audio;
        playBtn.innerHTML = '⏸';

        const onTimeUpdate = () => {
          if (!audio.duration || !isFinite(audio.duration)) return;
          const progress = audio.currentTime / audio.duration;
          const filledBars = Math.floor(progress * barEls.length);
          barEls.forEach((bar, idx) => {
            if (idx <= filledBars) {
              bar.classList.add('played');
            } else {
              bar.classList.remove('played');
            }
          });
          const rem = Math.max(0, Math.ceil(audio.duration - audio.currentTime));
          safeSetText(durLabel, `0:${String(rem).padStart(2, '0')}`);
        };

        const onAudioEnd = () => {
          playBtn.innerHTML = '▶';
          barEls.forEach(bar => bar.classList.remove('played'));
          safeSetText(durLabel, `0:${String(totalDuration).padStart(2, '0')}`);
          activeAudioInstance = null;
          activeAudioCleanup = null;
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onAudioEnd);
        audio.addEventListener('error', onAudioEnd);

        activeAudioCleanup = () => {
          try {
            audio.pause();
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onAudioEnd);
            audio.removeEventListener('error', onAudioEnd);
          } catch (e) {}
          playBtn.innerHTML = '▶';
          barEls.forEach(bar => bar.classList.remove('played'));
          safeSetText(durLabel, `0:${String(totalDuration).padStart(2, '0')}`);
          activeAudioInstance = null;
          activeAudioCleanup = null;
        };

        audio.play().catch(() => {
          onAudioEnd();
        });
      } catch (err) {
        playBtn.innerHTML = '▶';
      }
    }

    // Chat Actions
    function sendMessage() {
      const input = document.getElementById('chat-message-input');
      const text = input.value.trim();
      if (!text) return;

      if (socket && socket.connected && currentRoomId) {
        socket.emit('send_message', {
          roomId: currentRoomId,
          type: 'text',
          message: text,
          text: text
        });
      } else if (!currentRoomId) {
        // Interactive Preview Mode Echo
        appendMessageBubble({ message: text, timestamp: Date.now() }, true);
        SoundEngine.playMsgSent();

        const typingEl = document.getElementById('chat-partner-typing-indicator');
        if (typingEl) typingEl.style.opacity = '1';

        setTimeout(() => {
          if (typingEl) typingEl.style.opacity = '0';
          const replies = [
            'Concordo al 100%, nella notte si dicono cose che di giorno non ammetteresti mai.',
            'Ahah incredibile! Mi piace come ragioni 🔥',
            'Siamo sulla stessa frequenza. I 3 minuti stanno volando...',
            'Verissimo. Se scade il timer che fai, richiedi la proroga (+5m) o sparisci nel nulla?'
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          appendMessageBubble({ message: randomReply, timestamp: Date.now() }, false);
          SoundEngine.playMsgReceived();
        }, 1200);
      }

      input.value = '';
      input.focus();
      updateChatInputState();

      if (isTyping && socket && socket.connected && currentRoomId) {
        isTyping = false;
        socket.emit('typing', { roomId: currentRoomId, isTyping: false });
      }
    }

    function handleTyping() {
      if (!currentRoomId || !socket || !socket.connected) return;
      if (!isTyping) {
        isTyping = true;
        socket.emit('typing', { roomId: currentRoomId, isTyping: true });
      }
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        isTyping = false;
        socket.emit('typing', { roomId: currentRoomId, isTyping: false });
      }, 1500);
    }

    function requestExtension() {
      if (!currentRoomId) {
        // Preview mode simulated consent
        showToast('Proroga approvata reciprocamente! +300s aggiunti al timer 🔥', 'success');
        const btn = document.getElementById('btn-extension');
        if (btn) {
          btn.classList.add('bg-street-orange/30', 'text-street-orange');
          safeSetText(btn, '+5m (2/2)');
        }
        startChatCountdown(300);
        return;
      }
      if (!socket || !socket.connected) return;
      socket.emit('request_extend', { roomId: currentRoomId });
      showToast('Hai richiesto la proroga (+5m). In attesa del partner...', 'info');
      const btn = document.getElementById('btn-extension');
      btn.classList.add('bg-street-orange/30', 'text-street-orange');
      safeSetText(btn, '+5m (1/2)');
    }

    function confirmSkip() {
      SoundEngine.playSkip();
      if (socket && socket.connected && currentRoomId) {
        socket.emit('skip_partner', { roomId: currentRoomId });
      }
      openEndedModal('HAI SALTATO IL MATCH', 'Hai interrotto la conversazione. Puoi cercare subito un altro partner.');
    }

    function copyPartnerSecret() {
      const text = partnerSecret || '';
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast('Segreto copiato negli appunti! 📋', 'success');
        }).catch(() => fallbackCopyText(text));
      } else {
        fallbackCopyText(text);
      }
    }

    function fallbackCopyText(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Segreto copiato negli appunti! 📋', 'success');
    }

    function sendReaction(emoji) {
      if (!currentRoomId || !socket || !socket.connected) return;
      socket.emit('send_reaction', { roomId: currentRoomId, emoji });
    }

    function triggerReactionVisual(emoji, isSelf = false) {
      const layer = document.getElementById('floating-reactions-layer');
      if (!layer) return;

      const el = document.createElement('div');
      el.className = 'absolute text-3xl sm:text-4xl pointer-events-none select-none z-40';
      safeSetText(el, emoji);

      const randomX = isSelf ? (60 + Math.random() * 28) : (10 + Math.random() * 28);
      el.style.left = `${randomX}%`;
      el.style.bottom = '30px';
      el.style.transition = 'all 1.6s cubic-bezier(0.22, 1, 0.36, 1)';
      el.style.opacity = '1';
      el.style.transform = `scale(0.6) translateY(0px) rotate(${(Math.random() - 0.5) * 35}deg)`;

      layer.appendChild(el);

      requestAnimationFrame(() => {
        el.style.opacity = '0';
        el.style.transform = `scale(1.45) translateY(-${220 + Math.random() * 100}px) rotate(${(Math.random() - 0.5) * 60}deg)`;
      });

      setTimeout(() => { el.remove(); }, 1700);
      SoundEngine.playReaction();
    }

    function openReportModal() {
      const modal = document.getElementById('modal-report');
      if (modal) modal.classList.remove('hidden');
    }

    function closeReportModal() {
      const modal = document.getElementById('modal-report');
      if (modal) modal.classList.add('hidden');
    }

    function submitReport() {
      const selected = document.querySelector('input[name="report-reason"]:checked');
      const reason = selected ? selected.value : 'other';

      if (socket && socket.connected && currentRoomId) {
        socket.emit('report_user', { roomId: currentRoomId, reason });
      }

      closeReportModal();
      openEndedModal('SEGNALAZIONE INVIATA', 'Utente bloccato e segnalato. La stanza è stata chiusa all\'istante per la tua sicurezza.');
    }

    // Viral 9:16 Canvas Story Card Generator
    function openSocialCardModal() {
      const modal = document.getElementById('modal-share-card');
      if (modal) {
        modal.classList.remove('hidden');
        drawStoryCard();
      }
    }

    function closeSocialCardModal() {
      const modal = document.getElementById('modal-share-card');
      if (modal) modal.classList.add('hidden');
    }

    function openTermsModal() {
      const modal = document.getElementById('modal-terms');
      if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
      }
    }

    function closeTermsModal() {
      const modal = document.getElementById('modal-terms');
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    }

    window.openTermsModal = openTermsModal;
    window.closeTermsModal = closeTermsModal;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeTermsModal();
        closeReportModal();
        closeSocialCardModal();
        closeProfileModal();
      }
    });

    // ==========================================
    // URBAN PROFILE & ONBOARDING SYSTEM
    // ==========================================
    const STREET_RANDOM_NICKS = ['Shadow', 'Neon', 'Viper', 'Ghost', 'Drifter', 'Phantom', 'Hacker', 'Rebel', 'Rogue', 'Blade', 'Voltage', 'Echo', 'Specter', 'Apex', 'Asfalto', 'Notturno', 'Freccia', 'Zenit'];

    // Custom Street Vector Glyphs (SVG) & Legacy Emoji Fallbacks
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

    const STREET_AVATARS = [
      'street-bolt', 'street-spray', 'street-mask', 'street-radar', 'street-chain',
      'street-asphalt', 'street-flame', 'street-tape', 'street-cassette', 'street-seal',
      '⚡', '🐺', '🛹', '🎧', '🌆', '☕', '🖤', '🌙', '🎙️', '🔥', '🕶️', '🥋', '🎲', '👾'
    ];

    function setAvatarDisplay(element, avatarValue, sizeClass) {
      if (!element) return;
      element.innerHTML = '';
      const glyph = STREET_GLYPHS.find(g => g.id === avatarValue || g.fallback === avatarValue);
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

    function generateRandomStreetNick() {
      const name = STREET_RANDOM_NICKS[Math.floor(Math.random() * STREET_RANDOM_NICKS.length)];
      const num = Math.floor(10 + Math.random() * 89);
      return `${name}_${num}`;
    }

    const STREET_PROFILE_DEFAULTS = {
      bio: 'Qui per parlare con rispetto ed educazione',
      motto: 'Cerco conversazioni che lasciano il segno dopo le due di notte.',
      vision: 'Fame di futuro, progetti creativi e confronto vero con persone che non hanno paura di pensare fuori dal coro.',
      topics: 'Musica notturna, filosofia da marciapiede, sfoghi senza maschere, cinema.',
      avoids: 'Chi fa il fenomeno da bar, giudizi sul corpo, risposte a monosillabi e perditempo.'
    };

    const INSPIRATIONAL_PROFILES = [
      {
        motto: 'Cerco verità non dette dopo le due di notte.',
        vision: 'Fame di futuro, progetti musicali underground e confronto reale senza filtri.',
        topics: 'Beatmaking, filosofia urbana, viaggi in solitaria, cinema d\'autore.',
        avoids: 'Fenomeni da bar, giudizi sul corpo, ipocrisia e risposte a monosillabi.'
      },
      {
        motto: 'La notte amplifica le idee che il giorno ignora.',
        vision: 'Voglio creare qualcosa che resti, circondandomi di menti curiose che non si accontentano.',
        topics: 'Sogni lucidi, innovazione radicale, architettura brutale, sfoghi autentici.',
        avoids: 'Pettegolezzi da marciapiede, chi si prende troppo sul serio, pose social.'
      },
      {
        motto: 'Meno estetica, più anima.',
        vision: 'Confrontarmi con chi ha vissuto cadute e rinascite. La vulnerabilità è forza, non debolezza.',
        topics: 'Psicologia notturna, poesie di strada, dischi rari, dilemmi etici.',
        avoids: 'Chi giudica la copertina prima del libro, violenza verbale, spam.'
      },
      {
        motto: 'Silenzio per ascoltare, parole per costruire.',
        vision: 'Un mondo in cui la conversazione tra sconosciuti torni a essere un\'arte autentica.',
        topics: 'Astronomia amatoriale, tecnologia etica, storie di quartiere, libri letti a metà.',
        avoids: 'Trolling aggressivo, mancanza di rispetto, atteggiamento da maestro di vita.'
      }
    ];

    function getUserProfile() {
      try {
        const stored = localStorage.getItem('streetalk_profile_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed.moniker === 'string') {
            return {
              moniker: parsed.moniker.trim().substring(0, 25) || generateRandomStreetNick(),
              avatar: (STREET_AVATARS.includes(parsed.avatar) || STREET_GLYPHS.some(g => g.id === parsed.avatar)) ? parsed.avatar : 'street-bolt',
              bio: typeof parsed.bio === 'string' && parsed.bio.trim() ? parsed.bio.trim().substring(0, 70) : STREET_PROFILE_DEFAULTS.bio,
              motto: typeof parsed.motto === 'string' && parsed.motto.trim() ? parsed.motto.trim().substring(0, 100) : STREET_PROFILE_DEFAULTS.motto,
              vision: typeof parsed.vision === 'string' && parsed.vision.trim() ? parsed.vision.trim().substring(0, 200) : STREET_PROFILE_DEFAULTS.vision,
              topics: typeof parsed.topics === 'string' && parsed.topics.trim() ? parsed.topics.trim().substring(0, 150) : STREET_PROFILE_DEFAULTS.topics,
              avoids: typeof parsed.avoids === 'string' && parsed.avoids.trim() ? parsed.avoids.trim().substring(0, 150) : STREET_PROFILE_DEFAULTS.avoids
            };
          }
        }
      } catch (e) {}

      const defaultProfile = {
        moniker: generateRandomStreetNick(),
        avatar: 'street-bolt',
        bio: STREET_PROFILE_DEFAULTS.bio,
        motto: STREET_PROFILE_DEFAULTS.motto,
        vision: STREET_PROFILE_DEFAULTS.vision,
        topics: STREET_PROFILE_DEFAULTS.topics,
        avoids: STREET_PROFILE_DEFAULTS.avoids
      };
      saveUserProfile(defaultProfile);
      return defaultProfile;
    }

    function saveUserProfile(prof) {
      try {
        localStorage.setItem('streetalk_profile_v1', JSON.stringify(prof));
      } catch (e) {}
      updateHeaderProfileDisplay(prof);
    }

    function updateHeaderProfileDisplay(prof) {
      const p = prof || getUserProfile();
      const nickEl = document.getElementById('header-profile-nick');
      const avatarEl = document.getElementById('header-profile-avatar');
      if (nickEl) safeSetText(nickEl, p.moniker);
      if (avatarEl) setAvatarDisplay(avatarEl, p.avatar, 'w-4 h-4');
    }

    let tempSelectedAvatar = 'street-bolt';
    let fullProfileAvatar = 'street-bolt';

    function renderAvatarGrid(containerId, activeAvatar, onSelect) {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';
      STREET_GLYPHS.forEach((glyph) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.title = glyph.label;
        const isActive = activeAvatar === glyph.id || activeAvatar === glyph.fallback;
        btn.className = `p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${
          isActive
            ? 'bg-street-orange/25 border-street-orange text-white scale-110 shadow-[0_0_12px_rgba(255,101,47,0.4)]'
            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
        }`;
        const img = document.createElement('img');
        img.src = glyph.path;
        img.alt = glyph.label;
        img.className = 'w-6 h-6 object-contain pointer-events-none';
        btn.appendChild(img);
        btn.onclick = () => {
          onSelect(glyph.id);
          renderAvatarGrid(containerId, glyph.id, onSelect);
        };
        container.appendChild(btn);
      });
    }

    function openProfileModal() {
      const modal = document.getElementById('modal-profile');
      if (!modal) return;
      const prof = getUserProfile();
      tempSelectedAvatar = prof.avatar;

      const nickInput = document.getElementById('profile-nick-input');
      const bioInput = document.getElementById('profile-bio-input');
      const previewAvatar = document.getElementById('profile-preview-avatar');
      const previewNick = document.getElementById('profile-preview-nick');

      if (nickInput) nickInput.value = prof.moniker;
      if (bioInput) bioInput.value = prof.bio;
      if (previewAvatar) setAvatarDisplay(previewAvatar, prof.avatar, 'w-7 h-7');
      if (previewNick) safeSetText(previewNick, prof.moniker);

      renderAvatarGrid('profile-avatar-grid', tempSelectedAvatar, (av) => {
        tempSelectedAvatar = av;
        if (previewAvatar) setAvatarDisplay(previewAvatar, av, 'w-7 h-7');
      });

      if (nickInput) {
        nickInput.oninput = () => {
          if (previewNick) safeSetText(previewNick, nickInput.value || 'Anonimo');
        };
      }

      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    }

    function closeProfileModal() {
      const modal = document.getElementById('modal-profile');
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    }

    function randomizeProfileNick() {
      const newNick = generateRandomStreetNick();
      const nickInput = document.getElementById('profile-nick-input');
      const previewNick = document.getElementById('profile-preview-nick');
      if (nickInput) nickInput.value = newNick;
      if (previewNick) safeSetText(previewNick, newNick);
    }

    function saveProfileFromModal() {
      const nickInput = document.getElementById('profile-nick-input');
      const bioInput = document.getElementById('profile-bio-input');
      const current = getUserProfile();
      const moniker = (nickInput && nickInput.value.trim().length >= 2)
        ? nickInput.value.trim().substring(0, 20)
        : generateRandomStreetNick();
      const bio = bioInput ? bioInput.value.trim().substring(0, 70) : '';

      const updated = {
        ...current,
        moniker,
        avatar: tempSelectedAvatar,
        bio
      };
      saveUserProfile(updated);
      closeProfileModal();
      showToast('Profilo salvato con successo!', 'success');
    }

    // Full Descriptive Profile View (#view-profilo)
    function loadFullProfileView() {
      const prof = getUserProfile();
      fullProfileAvatar = prof.avatar || '⚡';

      const nickInput = document.getElementById('full-profile-nick');
      const mottoInput = document.getElementById('full-profile-motto');
      const visionInput = document.getElementById('full-profile-vision');
      const topicsInput = document.getElementById('full-profile-topics');
      const avoidsInput = document.getElementById('full-profile-avoids');

      if (nickInput) nickInput.value = prof.moniker || '';
      if (mottoInput) mottoInput.value = prof.motto || '';
      if (visionInput) visionInput.value = prof.vision || '';
      if (topicsInput) topicsInput.value = prof.topics || '';
      if (avoidsInput) avoidsInput.value = prof.avoids || '';

      renderAvatarGrid('full-profile-avatar-grid', fullProfileAvatar, (av) => {
        fullProfileAvatar = av;
        updateCardLivePreview();
      });

      updateCardLivePreview();
    }

    function updateCardLivePreview() {
      const nickInput = document.getElementById('full-profile-nick');
      const mottoInput = document.getElementById('full-profile-motto');
      const visionInput = document.getElementById('full-profile-vision');
      const topicsInput = document.getElementById('full-profile-topics');
      const avoidsInput = document.getElementById('full-profile-avoids');

      const nick = (nickInput && nickInput.value.trim()) ? nickInput.value.trim() : 'Anonimo';
      const motto = (mottoInput && mottoInput.value.trim()) ? mottoInput.value.trim() : STREET_PROFILE_DEFAULTS.motto;
      const vision = (visionInput && visionInput.value.trim()) ? visionInput.value.trim() : STREET_PROFILE_DEFAULTS.vision;
      const topics = (topicsInput && topicsInput.value.trim()) ? topicsInput.value.trim() : STREET_PROFILE_DEFAULTS.topics;
      const avoids = (avoidsInput && avoidsInput.value.trim()) ? avoidsInput.value.trim() : STREET_PROFILE_DEFAULTS.avoids;

      // Update counters
      const counterMotto = document.getElementById('counter-full-motto');
      const counterVision = document.getElementById('counter-full-vision');
      const counterTopics = document.getElementById('counter-full-topics');
      const counterAvoids = document.getElementById('counter-full-avoids');

      if (counterMotto && mottoInput) counterMotto.textContent = `${mottoInput.value.length}/90`;
      if (counterVision && visionInput) counterVision.textContent = `${visionInput.value.length}/180`;
      if (counterTopics && topicsInput) counterTopics.textContent = `${topicsInput.value.length}/140`;
      if (counterAvoids && avoidsInput) counterAvoids.textContent = `${avoidsInput.value.length}/140`;

      // Update live preview card (Asphalt Passport)
      const cardAvatar = document.getElementById('card-display-avatar');
      const cardNick = document.getElementById('card-display-nick');
      const cardMotto = document.getElementById('card-display-motto');
      const cardVision = document.getElementById('card-display-vision');
      const cardTopics = document.getElementById('card-display-topics');
      const cardAvoids = document.getElementById('card-display-avoids');

      if (cardAvatar) setAvatarDisplay(cardAvatar, fullProfileAvatar, 'w-10 h-10');
      if (cardNick) safeSetText(cardNick, nick);
      if (cardMotto) safeSetText(cardMotto, `"${motto}"`);
      if (cardVision) safeSetText(cardVision, vision);
      if (cardTopics) safeSetText(cardTopics, topics);
      if (cardAvoids) safeSetText(cardAvoids, avoids);
    }

    function randomizeFullProfileNick() {
      const newNick = generateRandomStreetNick();
      const nickInput = document.getElementById('full-profile-nick');
      if (nickInput) {
        nickInput.value = newNick;
        updateCardLivePreview();
      }
    }

    function appendTopicPreset(text) {
      const topicsInput = document.getElementById('full-profile-topics');
      if (!topicsInput) return;
      let cur = topicsInput.value.trim();
      if (cur.length > 0) {
        if (!cur.endsWith(',')) cur += ', ';
        else cur += ' ';
      }
      cur += text;
      if (cur.length > 140) cur = cur.substring(0, 140);
      topicsInput.value = cur;
      updateCardLivePreview();
    }

    function inspireRandomProfile() {
      const idx = Math.floor(Math.random() * INSPIRATIONAL_PROFILES.length);
      const chosen = INSPIRATIONAL_PROFILES[idx];

      const mottoInput = document.getElementById('full-profile-motto');
      const visionInput = document.getElementById('full-profile-vision');
      const topicsInput = document.getElementById('full-profile-topics');
      const avoidsInput = document.getElementById('full-profile-avoids');

      if (mottoInput) mottoInput.value = chosen.motto;
      if (visionInput) visionInput.value = chosen.vision;
      if (topicsInput) topicsInput.value = chosen.topics;
      if (avoidsInput) avoidsInput.value = chosen.avoids;

      updateCardLivePreview();
      showToast('Scheda ispirata dal flusso notturno! ✨', 'success');
    }

    function saveFullProfile() {
      const nickInput = document.getElementById('full-profile-nick');
      const mottoInput = document.getElementById('full-profile-motto');
      const visionInput = document.getElementById('full-profile-vision');
      const topicsInput = document.getElementById('full-profile-topics');
      const avoidsInput = document.getElementById('full-profile-avoids');

      const current = getUserProfile();
      const moniker = (nickInput && nickInput.value.trim().length >= 2)
        ? nickInput.value.trim().substring(0, 20)
        : generateRandomStreetNick();
      const motto = mottoInput ? mottoInput.value.trim().substring(0, 90) : '';
      const vision = visionInput ? visionInput.value.trim().substring(0, 180) : '';
      const topics = topicsInput ? topicsInput.value.trim().substring(0, 140) : '';
      const avoids = avoidsInput ? avoidsInput.value.trim().substring(0, 140) : '';

      const updated = {
        ...current,
        moniker,
        avatar: fullProfileAvatar,
        bio: 'Qui per parlare con rispetto ed educazione',
        motto,
        vision,
        topics,
        avoids
      };

      saveUserProfile(updated);
      showToast('Scheda personale salvata con successo! 🛡️', 'success');
    }

    // Onboarding Gate (First Access)
    let tempOnboardingAvatar = 'street-bolt';

    function initProfileAndOnboarding() {
      const prof = getUserProfile();
      updateHeaderProfileDisplay(prof);

      const hasAccepted = localStorage.getItem('streetalk_privacy_accepted_2026');
      if (!hasAccepted) {
        openOnboardingModal();
      }
    }

    function openOnboardingModal() {
      const modal = document.getElementById('modal-onboarding');
      if (!modal) return;
      const prof = getUserProfile();
      tempOnboardingAvatar = prof.avatar;

      const nickInput = document.getElementById('onboarding-nick-input');
      const bioInput = document.getElementById('onboarding-bio-input');
      if (nickInput) nickInput.value = prof.moniker;
      if (bioInput) bioInput.value = prof.bio;

      renderAvatarGrid('onboarding-avatar-grid', tempOnboardingAvatar, (av) => {
        tempOnboardingAvatar = av;
      });

      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    }

    function randomizeOnboardingNick() {
      const nickInput = document.getElementById('onboarding-nick-input');
      if (nickInput) nickInput.value = generateRandomStreetNick();
    }

    function submitOnboarding() {
      const check = document.getElementById('onboarding-consent-check');
      const err = document.getElementById('onboarding-error');
      if (!check || !check.checked) {
        if (err) err.classList.remove('hidden');
        return;
      }
      if (err) err.classList.add('hidden');

      const nickInput = document.getElementById('onboarding-nick-input');
      const bioInput = document.getElementById('onboarding-bio-input');
      const current = getUserProfile();
      const moniker = (nickInput && nickInput.value.trim().length >= 2)
        ? nickInput.value.trim().substring(0, 20)
        : generateRandomStreetNick();
      const bio = bioInput ? bioInput.value.trim().substring(0, 70) : '';

      const prof = {
        ...current,
        moniker,
        avatar: tempOnboardingAvatar,
        bio
      };
      saveUserProfile(prof);

      try {
        localStorage.setItem('streetalk_privacy_accepted_2026', 'true');
      } catch (e) {}

      const modal = document.getElementById('modal-onboarding');
      if (modal) modal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');

      showToast(`Benvenuto, ${moniker}! Patto di rispetto accettato.`, 'success');
    }

    // Partner Personal Profile Sheet in Chat (100% descriptive, zero photos)
    let currentPartnerProfile = null;

    function openPartnerProfileModal() {
      const modal = document.getElementById('modal-partner-profile');
      if (!modal) return;

      const p = currentPartnerProfile || {
        moniker: partnerNick || 'SHADOW',
        avatar: '⚡',
        motto: '',
        vision: '',
        topics: '',
        avoids: '',
        bio: ''
      };

      const avatarEl = document.getElementById('partner-modal-avatar');
      const nickEl = document.getElementById('partner-modal-nick');
      const mottoEl = document.getElementById('partner-modal-motto');
      const visionEl = document.getElementById('partner-modal-vision');
      const topicsEl = document.getElementById('partner-modal-topics');
      const avoidsEl = document.getElementById('partner-modal-avoids');
      const bioEl = document.getElementById('partner-modal-bio');

      if (avatarEl) setAvatarDisplay(avatarEl, p.avatar || 'street-bolt', 'w-8 h-8');
      if (nickEl) safeSetText(nickEl, p.moniker || 'SHADOW');
      if (mottoEl) safeSetText(mottoEl, p.motto ? `"${p.motto}"` : 'Nessun motto impostato');
      if (visionEl) safeSetText(visionEl, p.vision || 'Nessuna visione inserita.');
      if (topicsEl) safeSetText(topicsEl, p.topics || 'Aperto a qualsiasi argomento con rispetto.');
      if (avoidsEl) safeSetText(avoidsEl, p.avoids || 'Mancanza di rispetto e superficialità.');
      if (bioEl) safeSetText(bioEl, p.bio || 'Qui per parlare con educazione.');

      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    }

    function closePartnerProfileModal() {
      const modal = document.getElementById('modal-partner-profile');
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    }

    window.openProfileModal = openProfileModal;
    window.closeProfileModal = closeProfileModal;
    window.randomizeProfileNick = randomizeProfileNick;
    window.saveProfileFromModal = saveProfileFromModal;
    window.openOnboardingModal = openOnboardingModal;
    window.randomizeOnboardingNick = randomizeOnboardingNick;
    window.submitOnboarding = submitOnboarding;
    window.loadFullProfileView = loadFullProfileView;
    window.updateCardLivePreview = updateCardLivePreview;
    window.randomizeFullProfileNick = randomizeFullProfileNick;
    window.appendTopicPreset = appendTopicPreset;
    window.inspireRandomProfile = inspireRandomProfile;
    window.saveFullProfile = saveFullProfile;
    window.openPartnerProfileModal = openPartnerProfileModal;
    window.closePartnerProfileModal = closePartnerProfileModal;

    function drawStoryCard() {
      const canvas = document.getElementById('story-card-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;  // 720
      const h = canvas.height; // 1280

      // Asphalt Dark Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0b0d10');
      bgGrad.addColorStop(0.4, '#12151d');
      bgGrad.addColorStop(1, '#060709');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle Asphalt Perspective Grid
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 101, 47, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 45) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 45) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.restore();

      // Neon Street Border Frame
      ctx.save();
      ctx.strokeStyle = '#ff652f';
      ctx.lineWidth = 4;
      ctx.strokeRect(28, 28, w - 56, h - 56);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(38, 38, w - 76, h - 76);
      ctx.restore();

      // Header Branding
      ctx.fillStyle = '#ff652f';
      ctx.fillRect(60, 65, 40, 40);
      ctx.fillStyle = '#000000';
      ctx.font = '900 24px Syne, sans-serif';
      ctx.fillText('ST', 66, 94);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 30px Syne, sans-serif';
      ctx.fillText('STREET', 115, 95);
      ctx.fillStyle = '#ff652f';
      ctx.fillText('ALK', 245, 95);

      // Badge: Segreto svelato
      ctx.fillStyle = 'rgba(255, 101, 47, 0.14)';
      ctx.fillRect(60, 135, 260, 36);
      ctx.strokeStyle = 'rgba(255, 101, 47, 0.45)';
      ctx.lineWidth = 1;
      ctx.strokeRect(60, 135, 260, 36);
      ctx.fillStyle = '#ff652f';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillText('INVITO A STREETALK', 76, 158);

      // Quotation Mark
      ctx.fillStyle = 'rgba(255, 101, 47, 0.22)';
      ctx.font = '900 140px Syne, serif';
      ctx.fillText('“', 55, 300);

      // Generic promotional text; never read room content
      const textToDisplay = 'Un segreto a testa. Tre minuti per conoscersi.';
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 34px "Plus Jakarta Sans", sans-serif';

      const maxWidth = w - 140;
      const words = textToDisplay.split(' ');
      let line = '';
      let y = 370;
      const lineHeight = 50;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, 70, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 70, y);

      ctx.fillStyle = 'rgba(255, 101, 47, 0.22)';
      ctx.font = '900 140px Syne, serif';
      ctx.fillText('”', w - 130, y + 90);

      // Metadata Pill
      const metaY = Math.min(h - 260, y + 150);
      ctx.fillStyle = '#141720';
      ctx.fillRect(70, metaY, 360, 54);
      ctx.strokeStyle = '#343d49';
      ctx.lineWidth = 1;
      ctx.strokeRect(70, metaY, 360, 54);

      ctx.fillStyle = '#ff652f';
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillText('SCAMBIO RECIPROCO', 90, metaY + 33);

      // This card contains no participant or session metadata.

      // Footer
      ctx.fillStyle = '#aab4c2';
      ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Entra nella notte. Scambia un segreto reale in 180s.', 70, h - 130);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 24px Syne, sans-serif';
      ctx.fillText('@STREETALK.LIVE', 70, h - 90);

      ctx.fillStyle = '#ff652f';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillText('// CHAT REALTIME • MESSAGGI IN RAM', 70, h - 62);
    }

    function downloadStoryCard() {
      const canvas = document.getElementById('story-card-canvas');
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = 'streetalk-invito.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Card scaricata con successo! 🚀', 'success');
    }

    async function shareStoryCard() {
      const canvas = document.getElementById('story-card-canvas');
      if (!canvas) return;
      if (navigator.share && canvas.toBlob) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'streetalk-invito.png', { type: 'image/png' });
            const canShareFiles = typeof navigator.canShare === 'function' ? navigator.canShare({ files: [file] }) : false;
            if (canShareFiles) {
              try {
                await navigator.share({
                  title: 'STREETALK // Invito a parlare',
                  text: 'Un segreto a testa. Tre minuti per conoscersi su STREETALK.',
                  files: [file]
                });
                showToast('Condiviso con successo! 🔥', 'success');
                return;
              } catch (e) {
                if (e.name === 'AbortError') return;
              }
            }

            // Fallback: Attempt text/url native share if file sharing wasn't supported
            try {
              await navigator.share({
                title: 'STREETALK // Invito a parlare',
                text: 'Un invito a parlare su STREETALK: https://streetalk-live.vercel.app/'
              });
              showToast('Link condiviso con successo! 🔥', 'success');
              return;
            } catch (err2) {
              if (err2.name === 'AbortError') return;
            }
          }
          downloadStoryCard();
        });
      } else {
        downloadStoryCard();
      }
    }

    function openEndedModal(title, desc) {
      clearInterval(countdownInterval);
      currentRoomId = null;
      safeSetText(document.getElementById('modal-ended-title'), title);
      safeSetText(document.getElementById('modal-ended-desc'), desc);
      document.getElementById('modal-ended').classList.remove('hidden');
    }

    function startChatCountdown(seconds) {
      clearInterval(countdownInterval);
      const totalSeconds = seconds || 180;
      let remaining = seconds;
      const countdownEl = document.getElementById('chat-countdown');
      const badge = document.getElementById('countdown-badge');
      const ring = document.getElementById('timer-circular-ring');

      function updateDisplay() {
        const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
        const secs = String(remaining % 60).padStart(2, '0');
        safeSetText(countdownEl, `${mins}:${secs}`);
        safeSetText(document.getElementById('chat-top-countdown'), `${mins}:${secs}`);

        if (ring) {
          const pct = Math.max(0, Math.min(100, (remaining / totalSeconds) * 100));
          ring.style.strokeDashoffset = (100 - pct);
        }

        if (remaining <= 30) {
          badge.classList.add('border-red-600', 'text-red-400');
          badge.classList.remove('border-zinc-800', 'text-white');
          if (ring) ring.setAttribute('stroke', '#ef4444');
        } else {
          badge.classList.remove('border-red-600', 'text-red-400');
          badge.classList.add('border-zinc-800', 'text-white');
          if (ring) ring.setAttribute('stroke', '#ff652f');
        }
      }

      updateDisplay();
      countdownInterval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(countdownInterval);
          safeSetText(countdownEl, '00:00');
          safeSetText(document.getElementById('chat-top-countdown'), '00:00');
          if (ring) ring.style.strokeDashoffset = 100;
        } else {
          updateDisplay();
        }
      }, 1000);
    }

    function appendMessageBubble(messageObj, isSelf) {
      const container = document.getElementById('messages-container');
      if (!container) return;

      // Special StreetBot system message bubble
      if (messageObj.isBot || messageObj.senderId === 'STREET_BOT') {
        const botWrap = document.createElement('div');
        botWrap.className = 'w-full my-3 flex justify-center';

        const botCard = document.createElement('div');
        botCard.className = 'max-w-[90%] sm:max-w-[80%] bg-zinc-950 border border-street-orange/60 rounded-xl p-3 text-xs font-mono text-zinc-300 shadow-[0_0_15px_rgba(255,101,47,0.12)] flex items-start gap-2.5';

        const botIcon = document.createElement('div');
        botIcon.className = 'text-xl select-none shrink-0';
        botIcon.textContent = '🤖';

        const botContent = document.createElement('div');
        botContent.className = 'flex-1 space-y-1';

        const botHeader = document.createElement('div');
        botHeader.className = 'font-bold text-[10px] text-street-orange tracking-wider uppercase flex items-center justify-between';
        botHeader.innerHTML = '<span>STREET BOT // MODERAZIONE FLUSSO</span><span class="text-zinc-500 font-normal">ART. 4</span>';

        const botText = document.createElement('div');
        botText.className = 'text-zinc-200 leading-relaxed font-sans text-xs';
        safeSetText(botText, messageObj.message != null ? messageObj.message : (messageObj.text != null ? messageObj.text : ''));

        botContent.appendChild(botHeader);
        botContent.appendChild(botText);
        botCard.appendChild(botIcon);
        botCard.appendChild(botContent);
        botWrap.appendChild(botCard);
        container.appendChild(botWrap);
        container.scrollTop = container.scrollHeight;
        return;
      }

      const wrap = document.createElement('div');
      wrap.className = `flex flex-col ${isSelf ? 'items-end' : 'items-start'} mb-2.5`;

      const time = new Date(messageObj.timestamp || Date.now());
      const timeStr = `${String(time.getHours()).padStart(2,'0')}:${String(time.getMinutes()).padStart(2,'0')}`;
      const checks = isSelf ? ' ✓✓' : '';

      // 1. Audio Voice Note Bubble
      if (messageObj.type === 'audio' || messageObj.audioData) {
        const voiceWrap = document.createElement('div');
        voiceWrap.className = `tg-voice-card ${isSelf ? 'tg-bubble-out' : 'tg-bubble-in'}`;

        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.className = 'tg-voice-play-btn';
        playBtn.innerHTML = '▶';
        playBtn.setAttribute('aria-label', 'Riproduci nota vocale');

        const waveWrap = document.createElement('div');
        waveWrap.className = 'tg-waveform-wrap';

        const barHeights = [8, 14, 10, 18, 12, 22, 16, 10, 20, 14, 18, 8, 16, 22, 12, 10, 16, 14, 8, 12];
        const barEls = [];
        for (let i = 0; i < 20; i++) {
          const bar = document.createElement('div');
          bar.className = 'tg-waveform-bar';
          bar.style.height = `${barHeights[i % barHeights.length]}px`;
          waveWrap.appendChild(bar);
          barEls.push(bar);
        }

        const infoCol = document.createElement('div');
        infoCol.className = 'flex flex-col justify-between items-end gap-1 shrink-0';

        const durLabel = document.createElement('span');
        durLabel.className = 'text-[10px] font-mono font-bold leading-none';
        const durSec = Math.round(Number(messageObj.duration) || 3);
        safeSetText(durLabel, `0:${String(durSec).padStart(2, '0')}`);

        const timeSpan = document.createElement('span');
        timeSpan.className = 'text-[9px] font-mono opacity-70 leading-none';
        safeSetText(timeSpan, `${timeStr}${checks}`);

        infoCol.appendChild(durLabel);
        infoCol.appendChild(timeSpan);

        playBtn.onclick = () => {
          playVoiceNote(messageObj.audioData, playBtn, barEls, durLabel, durSec);
        };

        voiceWrap.appendChild(playBtn);
        voiceWrap.appendChild(waveWrap);
        voiceWrap.appendChild(infoCol);
        wrap.appendChild(voiceWrap);

      // 2. Animated Reaction GIF Bubble
      } else if (messageObj.type === 'gif' || messageObj.gifUrl) {
        const gifCard = document.createElement('div');
        gifCard.className = `tg-gif-card ${isSelf ? 'border-street-orange/40' : 'border-zinc-700/60'}`;

        const allowedGifHosts = [
          'media.tenor.com',
          'c.tenor.com',
          'media.giphy.com',
          'media0.giphy.com',
          'media1.giphy.com',
          'media2.giphy.com',
          'media3.giphy.com',
          'media4.giphy.com',
          'i.giphy.com'
        ];
        let safeGifUrl = '/assets/gifs/flame.svg';
        const rawUrl = String(messageObj.gifUrl || '').trim();
        if (rawUrl.startsWith('/assets/gifs/')) {
          safeGifUrl = rawUrl;
        } else if (rawUrl.startsWith('https://')) {
          try {
            const parsed = new URL(rawUrl);
            if (allowedGifHosts.includes(parsed.hostname.toLowerCase())) {
              safeGifUrl = parsed.href;
            }
          } catch (_) {}
        }

        const img = document.createElement('img');
        img.src = safeGifUrl;
        img.alt = 'GIF Reaction';
        img.className = 'tg-gif-img';
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        img.setAttribute('referrerpolicy', 'no-referrer');
        img.crossOrigin = 'anonymous';
        img.onerror = () => {
          img.onerror = null;
          img.src = '/assets/gifs/flame.svg';
        };

        const timeBadge = document.createElement('div');
        timeBadge.className = 'tg-gif-time';
        safeSetText(timeBadge, `${timeStr}${checks}`);

        gifCard.appendChild(img);
        gifCard.appendChild(timeBadge);
        wrap.appendChild(gifCard);

      // 3. Telegram Text Bubble
      } else {
        const bubble = document.createElement('div');
        bubble.className = `max-w-[85%] sm:max-w-[70%] px-3.5 py-2 text-sm break-words shadow-sm font-sans flex flex-col ${
          isSelf ? 'tg-bubble-out' : 'tg-bubble-in'
        }`;

        const textContent = document.createElement('div');
        textContent.className = 'leading-snug';
        safeSetText(textContent, messageObj.message != null ? messageObj.message : (messageObj.text != null ? messageObj.text : ''));

        const metaRow = document.createElement('div');
        metaRow.className = 'self-end text-[9px] font-mono mt-0.5 opacity-75 flex items-center gap-1 select-none';
        safeSetText(metaRow, `${timeStr}${checks}`);

        bubble.appendChild(textContent);
        bubble.appendChild(metaRow);
        wrap.appendChild(bubble);
      }

      container.appendChild(wrap);
      container.scrollTop = container.scrollHeight;
    }

    // Window global bindings for interactive HTML elements
    window.togglePinnedSecret = togglePinnedSecret;
    window.toggleGifPicker = toggleGifPicker;
    window.switchGifCategory = switchGifCategory;
    window.clearGifSearch = clearGifSearch;
    window.sendGif = sendGif;
    window.loadGifs = loadGifs;
    window.startAudioRecording = startAudioRecording;
    window.cancelAudioRecording = cancelAudioRecording;
    window.stopAndSendAudioRecording = stopAndSendAudioRecording;
    window.updateChatInputState = updateChatInputState;
    window.toggleMobileChatSidebar = toggleMobileChatSidebar;
    window.leaveChatToHome = leaveChatToHome;

    // ==========================================
    // INITIALIZATION & DOM LISTENERS
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
      // Initialize Streetalk Profile & Onboarding Gate
      try {
        initProfileAndOnboarding();
      } catch (e) {}

      // Initialize GIF Live Search
      try {
        const gifInput = document.getElementById('gif-search-input');
        const clearBtn = document.getElementById('gif-search-clear');
        if (gifInput) {
          gifInput.addEventListener('input', (e) => {
            const q = e.target.value;
            if (clearBtn) {
              if (q.length > 0) clearBtn.classList.remove('hidden');
              else clearBtn.classList.add('hidden');
            }
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
              if (q.trim()) {
                loadGifs({ query: q.trim() });
              } else {
                loadGifs({ category: activeGifCategory });
              }
            }, 250);
          });
        }
      } catch (e) {}

      // Direct URL Navigation for Chatroom Preview (?view=chat, ?preview=chat, #chat)
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('view') === 'chat' || urlParams.get('preview') === 'chat' || window.location.hash === '#chat') {
          setTimeout(() => {
            launchChatPreview();
          }, 200);
        }
      } catch (e) {}
      // Register Service Worker for PWA (2026 standards)
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').catch(() => {});
        });
      }

      // Secret Character Counter & Progress Bar
      const secretInput = document.getElementById('secret-input');
      const charCounter = document.getElementById('char-counter');
      const progressBar = document.getElementById('secret-progress-bar');
      const warningEl = document.getElementById('secret-validation-warning');
      const warningTextEl = document.getElementById('secret-validation-warning-text');

      if (secretInput && charCounter) {
        const emotionalTag = document.getElementById('secret-emotional-tag');

        secretInput.addEventListener('input', () => {
          const val = secretInput.value;
          const len = val.length;
          safeSetText(charCounter, `${len}/90`);

          const pct = Math.min(100, (len / 90) * 100);
          if (progressBar) {
            progressBar.style.width = pct + '%';
          }

          if (len === 0) {
            if (warningEl) warningEl.classList.add('hidden');
            secretInput.classList.remove('border-red-500', 'border-street-orange', 'shadow-[0_0_12px_rgba(255,101,47,0.35)]', 'shadow-[0_0_18px_rgba(239,68,68,0.5)]');
            if (emotionalTag) {
              safeSetText(emotionalTag, 'Patto aperto');
              emotionalTag.className = 'text-[10px] font-mono text-zinc-500 transition-colors duration-200 inline';
            }
            if (progressBar) {
              progressBar.className = 'h-full bg-street-orange transition-all duration-150';
            }
            return;
          }

          const validation = validateSecretInput(val);
          if (!validation.valid && val.length >= 3) {
            if (warningEl && warningTextEl) {
              warningEl.classList.remove('hidden');
              safeSetText(warningTextEl, validation.error);
            }
            secretInput.classList.add('border-red-500');
            secretInput.classList.remove('border-street-orange', 'shadow-[0_0_12px_rgba(255,101,47,0.35)]');
            if (emotionalTag) {
              safeSetText(emotionalTag, 'Formato non valido');
              emotionalTag.className = 'text-[10px] font-mono text-red-400 font-bold transition-colors duration-200 inline';
            }
            if (progressBar) {
              progressBar.className = 'h-full bg-red-500 shadow-[0_0_8px_#ef4444] transition-all duration-150';
            }
          } else {
            if (warningEl) warningEl.classList.add('hidden');
            secretInput.classList.remove('border-red-500', 'shadow-[0_0_18px_rgba(239,68,68,0.5)]');

            if (len < 30) {
              if (emotionalTag) {
                safeSetText(emotionalTag, 'Sussurro iniziale...');
                emotionalTag.className = 'text-[10px] font-mono text-emerald-400 transition-colors duration-200 inline';
              }
              if (progressBar) {
                progressBar.className = 'h-full bg-gradient-to-r from-emerald-500 to-amber-500 shadow-[0_0_8px_#f59e0b] transition-all duration-150';
              }
              secretInput.classList.remove('border-street-orange', 'shadow-[0_0_12px_rgba(255,101,47,0.35)]');
              charCounter.classList.remove('text-street-orange');
              charCounter.classList.add('text-street-cement');
            } else if (len < 60) {
              if (emotionalTag) {
                safeSetText(emotionalTag, 'Tensione in aumento...');
                emotionalTag.className = 'text-[10px] font-mono text-amber-400 transition-colors duration-200 inline';
              }
              if (progressBar) {
                progressBar.className = 'h-full bg-gradient-to-r from-amber-500 via-street-orange to-orange-500 shadow-[0_0_10px_#ff652f] transition-all duration-150';
              }
              secretInput.classList.add('border-street-orange');
              secretInput.classList.remove('shadow-[0_0_12px_rgba(255,101,47,0.35)]');
              charCounter.classList.remove('text-street-orange');
              charCounter.classList.add('text-street-cement');
            } else if (len < 85) {
              if (emotionalTag) {
                safeSetText(emotionalTag, 'Segreto profondo...');
                emotionalTag.className = 'text-[10px] font-mono text-street-orange font-semibold transition-colors duration-200 inline';
              }
              if (progressBar) {
                progressBar.className = 'h-full bg-gradient-to-r from-street-orange to-red-500 shadow-[0_0_12px_#ff652f] transition-all duration-150';
              }
              secretInput.classList.add('border-street-orange', 'shadow-[0_0_12px_rgba(255,101,47,0.35)]');
              charCounter.classList.remove('text-street-orange');
              charCounter.classList.add('text-street-cement');
            } else {
              if (emotionalTag) {
                safeSetText(emotionalTag, 'Tensione massima: pronto!');
                emotionalTag.className = 'text-[10px] font-mono text-red-400 font-bold animate-pulse transition-colors duration-200 inline';
              }
              charCounter.classList.add('text-street-orange');
              charCounter.classList.remove('text-street-cement');
              if (progressBar) {
                progressBar.className = 'h-full bg-gradient-to-r from-red-500 via-rose-600 to-orange-500 shadow-[0_0_16px_#ef4444] transition-all duration-150 animate-pulse';
              }
              secretInput.classList.add('border-street-orange', 'shadow-[0_0_18px_rgba(239,68,68,0.5)]');
            }
          }
        });
      }

      // Mood Pill Selectors
      const moodPills = document.querySelectorAll('.mood-pill');
      moodPills.forEach(pill => {
        pill.addEventListener('click', () => {
          moodPills.forEach(p => {
            p.classList.remove('active', 'bg-street-orange/25', 'border-2', 'border-street-orange', 'text-white');
            p.classList.add('bg-[#0d0e14]', 'border', 'border-zinc-800', 'text-zinc-300');
            p.setAttribute('aria-checked', 'false');
          });
          pill.classList.add('active', 'bg-street-orange/25', 'border-2', 'border-street-orange', 'text-white');
          pill.classList.remove('bg-[#0d0e14]', 'border', 'border-zinc-800', 'text-zinc-300');
          pill.setAttribute('aria-checked', 'true');
          selectedMood = pill.getAttribute('data-mood');
        });
      });

      // Latency Ping Monitor (every 4 seconds)
      setInterval(performPingCheck, 4000);
    });

    // ==========================================
    // SOCKET REALTIME LISTENERS
    // ==========================================
    if (socket) {
      socket.on('online_stats', updateTrustHUD);

      socket.on('queue_joined', (data) => {
        safeSetText(document.getElementById('radar-display-pos'), `#${data.position}`);
        safeSetText(document.getElementById('radar-status-text'), `In ascolto sulla frequenza [${data.mood}]...`);
      });

      socket.on('match_found', (data) => {
        clearInterval(radarInterval);
        currentRoomId = data.roomId;
        partnerSecret = data.partnerSecret;
        partnerMood = data.partnerMood;
        partnerNick = data.partnerMoniker || data.partnerNick || 'SHADOW_' + Math.floor(10 + Math.random() * 89);
        myNick = data.myMoniker || data.myNick || 'NEON_' + Math.floor(10 + Math.random() * 89);

        const partnerAvatar = data.partnerAvatar || '⚡';
        const partnerBio = data.partnerBio || '';

        currentPartnerProfile = data.partnerProfile || {
          moniker: partnerNick,
          avatar: partnerAvatar,
          bio: partnerBio,
          motto: data.partnerMotto || '',
          vision: data.partnerVision || '',
          topics: data.partnerTopics || '',
          avoids: data.partnerAvoids || ''
        };

        safeSetText(document.getElementById('chat-partner-nick'), partnerNick);
        safeSetText(document.getElementById('chat-pinned-partner-nick'), partnerNick);
        const secretSnippet = data.partnerSecret ? `"${data.partnerSecret.substring(0, 48)}..."` : 'Tocca per leggere il segreto completo';
        safeSetText(document.getElementById('chat-partner-secret-snippet'), secretSnippet);
        const partnerAvatarEl = document.getElementById('chat-partner-avatar');
        if (partnerAvatarEl) setAvatarDisplay(partnerAvatarEl, partnerAvatar, 'w-6 h-6');

        const partnerBioContainer = document.getElementById('chat-partner-bio-container');
        const partnerBioText = document.getElementById('chat-partner-bio-text');
        if (partnerBioContainer && partnerBioText) {
          if (partnerBio && partnerBio.trim().length > 0) {
            safeSetText(partnerBioText, partnerBio);
            partnerBioContainer.classList.remove('hidden');
          } else {
            partnerBioContainer.classList.add('hidden');
          }
        }

        safeSetText(document.getElementById('chat-partner-nick'), data.partnerNick);
        safeSetText(document.getElementById('chat-top-partner-nick'), data.partnerNick);
        safeSetText(document.getElementById('chat-pinned-partner-nick'), data.partnerNick);
        safeSetText(document.getElementById('chat-my-nick-badge'), `Tu: ${myNick}`);
        safeSetText(document.getElementById('chat-partner-gender'), data.partnerGender);
        safeSetText(document.getElementById('chat-partner-mood'), data.partnerMood);

        safeSetText(document.getElementById('chat-partner-secret-box'), data.partnerSecret);
        safeSetText(document.getElementById('chat-my-secret-text'), mySecret);

        const container = document.getElementById('messages-container');
        container.innerHTML = `
          <div class="text-center my-2">
            <span class="text-[10px] font-mono bg-zinc-900/90 border border-zinc-800 text-zinc-400 px-3.5 py-1 rounded-full">
              Inizio chat • 180 secondi • Messaggi non archiviati
            </span>
          </div>
        `;

        const extBtn = document.getElementById('btn-extension');
        extBtn.classList.remove('bg-street-orange/30', 'text-street-orange');
        safeSetText(extBtn, '+5m');

        startChatCountdown(data.timeRemaining || 180);

        const triggerExplosiveReveal = () => {
          SoundEngine.playMatchSound();

          // Explosive GSAP Stagger Reveal with Neon Tear Effect
          if (window.gsap) {
            try {
              const secretTl = gsap.timeline();
              secretTl.fromTo('#partner-secret-card',
                { scale: 0.82, opacity: 0, filter: 'drop-shadow(0 0 50px #ff652f) brightness(1.8)', x: -8, skewX: -3 },
                { scale: 1, opacity: 1, filter: 'drop-shadow(0 0 10px rgba(255,101,47,0.3)) brightness(1)', x: 0, skewX: 0, duration: 0.65, ease: 'elastic.out(1.2, 0.45)' }
              );
              secretTl.to('#partner-secret-card', {
                opacity: 0.75,
                duration: 0.04,
                yoyo: true,
                repeat: 3,
                ease: 'power1.inOut'
              }, '-=0.35');
              secretTl.fromTo('#chat-partner-secret-box',
                { opacity: 0, y: 12, scale: 0.94, filter: 'blur(3px)' },
                { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.45, ease: 'back.out(1.5)' },
                '-=0.25'
              );
              secretTl.fromTo('#chat-my-secret-text',
                { opacity: 0, y: 8 },
                { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
                '-=0.2'
              );
            } catch (e) {}
          }
        };

        switchView('chat', triggerExplosiveReveal);

        showToast(`Accoppiato con ${partnerNick}! Segreto svelato.`, 'success');
      });

      socket.on('receive_message', (msg) => {
        const isSelf = msg.senderId === socket.id;
        appendMessageBubble(msg, isSelf);
        if (isSelf) {
          SoundEngine.playMsgSent();
        } else {
          SoundEngine.playMsgReceived();
        }
      });

      socket.on('receive_reaction', (data) => {
        const isSelf = data.senderId === (socket ? socket.id : null);
        triggerReactionVisual(data.emoji, isSelf);
      });

      socket.on('partner_typing', (data) => {
        const indicator = document.getElementById('chat-partner-typing-indicator');
        const topIndicator = document.getElementById('chat-top-typing');
        if (data.isTyping) {
          if (indicator) indicator.classList.remove('opacity-0');
          if (topIndicator) topIndicator.classList.remove('hidden');
        } else {
          if (indicator) indicator.classList.add('opacity-0');
          if (topIndicator) topIndicator.classList.add('hidden');
        }
      });

      socket.on('timer_warning', (data) => {
        SoundEngine.playWarning();
        showToast(`⏳ Restano solo ${data.timeRemaining} secondi!`, 'info');
      });

      socket.on('extension_requested', () => {
        showToast('Il partner ha richiesto +5 minuti! Clicca su "+5m" per accettare.', 'info');
        const extBtn = document.getElementById('btn-extension');
        extBtn.classList.add('border-street-orange', 'text-street-orange');
      });

      socket.on('extension_granted', (data) => {
        showToast('Proroga concessa! +5 minuti aggiunti alla chat.', 'success');
        startChatCountdown(data.newTimeRemaining);
        const extBtn = document.getElementById('btn-extension');
        extBtn.classList.remove('bg-street-orange/30');
        safeSetText(extBtn, '+5m');
      });

      socket.on('report_confirmed', (data) => {
        openEndedModal('SEGNALAZIONE CONFERMATA', data.message || 'Utente segnalato con successo.');
      });

      socket.on('partner_skipped', (data) => {
        SoundEngine.playSkip();
        openEndedModal('IL PARTNER HA CHIUSO', data.reason || 'Il partner ha chiuso la sessione.');
      });

      socket.on('chat_ended', (data) => {
        SoundEngine.playSkip();
        openEndedModal('TEMPO SCADUTO', 'Il tempo della sessione è terminato. Puoi cercare una nuova conversazione.');
      });

      socket.on('bot_strike_warning', (data) => {
        if (SoundEngine.playWarning) SoundEngine.playWarning();
        showToast(`⚠️ [STREET BOT] Sgarro ${data.strike}/${data.maxStrikes}: ${data.reason}`, 'error');
      });

      socket.on('error_event', (err) => {
        if (err.code === 'STRIKE_2_JAILED') {
          if (SoundEngine.playSkip) SoundEngine.playSkip();
          openEndedModal('SOSPESO DAL BOT (2° SGARRO)', err.message || 'Accesso sospeso temporaneamente (15m). Revisione umana: contatto@streetalk.live');
          return;
        }
        if (err.code === 'STRIKE_3_PERMABAN' || err.code === 'IP_PERMABAN') {
          if (SoundEngine.playSkip) SoundEngine.playSkip();
          openEndedModal('BAN PERMANENTE (3 SGARRI)', err.message || 'Accesso escluso definitivamente da STREETALK. Revisione umana: contatto@streetalk.live');
          return;
        }
        showToast(err.message, 'error');
      });
    }
  