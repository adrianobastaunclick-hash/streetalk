let radarEngineLoading = false;
    function loadRadarEngine() {
      if (radarEngineLoading || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      radarEngineLoading = true;
      const script = document.createElement('script');
      script.src = '/vendor/three.min.js';
      script.onload = init3DRadar;
      script.onerror = () => { radarEngineLoading = false; };
      document.head.appendChild(script);
    }
    function init3DRadar() {
      const radarCanvas = document.getElementById('radar-3d-canvas');
      if (!radarCanvas || !window.THREE) return;

      try {
        const renderer = new THREE.WebGLRenderer({
          canvas: radarCanvas,
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(224, 224);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.z = 6.2;

        const radarGroup = new THREE.Group();
        scene.add(radarGroup);

        // 1. Outer Geodesic Sphere (Icosahedron Wireframe)
        const geoSphere = new THREE.IcosahedronGeometry(2.3, 2);
        const matSphere = new THREE.MeshBasicMaterial({
          color: 0xff652f,
          wireframe: true,
          transparent: true,
          opacity: 0.75
        });
        const radarSphere = new THREE.Mesh(geoSphere, matSphere);
        radarGroup.add(radarSphere);

        // 2. Equatorial Gimbal Ring
        const eqRingGeo = new THREE.TorusGeometry(2.45, 0.022, 16, 64);
        const eqRingMat = new THREE.MeshBasicMaterial({
          color: 0xffaa44,
          transparent: true,
          opacity: 0.85
        });
        const eqRing = new THREE.Mesh(eqRingGeo, eqRingMat);
        eqRing.rotation.x = Math.PI / 2;
        radarGroup.add(eqRing);

        // 3. Polar Gimbal Ring
        const polarRingGeo = new THREE.TorusGeometry(2.4, 0.02, 16, 64);
        const polarRingMat = new THREE.MeshBasicMaterial({
          color: 0xff3b00,
          transparent: true,
          opacity: 0.65
        });
        const polarRing = new THREE.Mesh(polarRingGeo, polarRingMat);
        radarGroup.add(polarRing);

        // 4. Inner Core Glowing Beacon
        const innerGeo = new THREE.SphereGeometry(0.75, 16, 12);
        const innerMat = new THREE.MeshBasicMaterial({
          color: 0xffaa33,
          wireframe: true,
          transparent: true,
          opacity: 0.85
        });
        const innerSphere = new THREE.Mesh(innerGeo, innerMat);
        radarGroup.add(innerSphere);

        // 5. Orbiting 3D Particle Cloud (Blips / Soul Signals)
        const particleCount = 42;
        const particleGeo = new THREE.BufferGeometry();
        const particlePos = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
          const u = Math.random();
          const v = Math.random();
          const theta = u * 2.0 * Math.PI;
          const phi = Math.acos(2.0 * v - 1.0);
          const r = 1.9 + Math.random() * 0.9;
          const sinPhi = Math.sin(phi);
          particlePos[i * 3] = r * sinPhi * Math.cos(theta);
          particlePos[i * 3 + 1] = r * sinPhi * Math.sin(theta);
          particlePos[i * 3 + 2] = r * Math.cos(phi);
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
        const particleMat = new THREE.PointsMaterial({
          color: 0xffe0b2,
          size: 0.09,
          transparent: true,
          opacity: 0.95
        });
        const particleCloud = new THREE.Points(particleGeo, particleMat);
        radarGroup.add(particleCloud);

        // 6. Expanding Volumetric Radar Ping Rings
        const wave1Geo = new THREE.RingGeometry(0.25, 0.35, 32);
        const wave1Mat = new THREE.MeshBasicMaterial({
          color: 0xff652f,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        });
        const wave1 = new THREE.Mesh(wave1Geo, wave1Mat);
        radarGroup.add(wave1);

        const wave2Geo = new THREE.RingGeometry(0.25, 0.35, 32);
        const wave2Mat = new THREE.MeshBasicMaterial({
          color: 0xff9944,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7
        });
        const wave2 = new THREE.Mesh(wave2Geo, wave2Mat);
        radarGroup.add(wave2);

        let wave1Scale = 0.5;
        let wave2Scale = 2.8;

        // Pointer Parallax on radar card
        let targetRotX = 0;
        let targetRotY = 0;
        const radarCard = radarCanvas.closest('.tilt-card') || radarCanvas.parentElement;
        if (radarCard) {
          radarCard.addEventListener('pointermove', (e) => {
            const rect = radarCard.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;
            targetRotY = px * 0.45;
            targetRotX = py * 0.45;
          });
          radarCard.addEventListener('pointerleave', () => {
            targetRotX = 0;
            targetRotY = 0;
          });
        }

        let radarFrame = 0;
        const radarSection = document.getElementById('view-radar');
        const radarReduced = matchMedia('(prefers-reduced-motion: reduce)');
        function radarVisible() { return radarSection && !radarSection.classList.contains('hidden') && !document.hidden; }
        function syncRadar() { cancelAnimationFrame(radarFrame); radarFrame = 0; if (!radarVisible()) return; if (radarReduced.matches) renderer.render(scene, camera); else radarFrame = requestAnimationFrame(animateRadar); }
        const radarObserver = new MutationObserver(syncRadar);
        if (radarSection) radarObserver.observe(radarSection, {attributes:true,attributeFilter:['class']});
        document.addEventListener('visibilitychange', syncRadar);
        radarReduced.addEventListener('change', syncRadar);
        window.addEventListener('pagehide', () => { cancelAnimationFrame(radarFrame); radarFrame = 0; });
        window.addEventListener('pageshow', syncRadar);
        function animateRadar() {
          radarFrame = 0;
          if (!radarVisible() || radarReduced.matches) return;
          radarFrame = requestAnimationFrame(animateRadar);

          const radarSection = document.getElementById('view-radar');
          if (!radarSection || radarSection.classList.contains('hidden')) return;

          // Smooth tilt follow
          radarGroup.rotation.y += (targetRotY - radarGroup.rotation.y) * 0.08;
          radarGroup.rotation.x += (targetRotX - radarGroup.rotation.x) * 0.08;

          // Rotations
          radarSphere.rotation.y += 0.014;
          radarSphere.rotation.x += 0.007;

          eqRing.rotation.z += 0.018;
          polarRing.rotation.y -= 0.016;

          innerSphere.rotation.y -= 0.022;
          innerSphere.rotation.z += 0.012;

          particleCloud.rotation.y += 0.008;
          particleCloud.rotation.x += 0.004;

          // Expand Ping Waves
          wave1Scale += 0.045;
          if (wave1Scale > 5.5) {
            wave1Scale = 0.5;
            wave1Mat.opacity = 0.85;
          } else {
            wave1Mat.opacity = Math.max(0, 0.85 * (1 - wave1Scale / 5.5));
          }
          wave1.scale.set(wave1Scale, wave1Scale, 1);

          wave2Scale += 0.045;
          if (wave2Scale > 5.5) {
            wave2Scale = 0.5;
            wave2Mat.opacity = 0.7;
          } else {
            wave2Mat.opacity = Math.max(0, 0.7 * (1 - wave2Scale / 5.5));
          }
          wave2.scale.set(wave2Scale, wave2Scale, 1);

          renderer.render(scene, camera);
        }

        syncRadar();
      } catch (e) {
        console.warn('[RADAR-3D] WebGL fallback:', e);
      }
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
                ${escapeHTML(c.moniker)}
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-street-orange font-bold border border-zinc-800">
                ${escapeHTML(c.moodLabel)}
              </span>
            </div>
            <p class="text-sm text-zinc-100 font-sans italic my-3 leading-relaxed">
              "${escapeHTML(c.text)}"
            </p>
          </div>
          <div class="pt-3.5 border-t border-zinc-800/80 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick="toggleBachecaReaction('${c.id}', 'fire', this)"
                class="px-2 py-1 rounded-lg bg-zinc-900/90 hover:bg-street-orange/20 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                <span>🔥</span> <span>${c.fires}</span>
              </button>
              <button
                type="button"
                onclick="toggleBachecaReaction('${c.id}', 'skull', this)"
                class="px-2 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                <span>💀</span> <span>${c.skulls}</span>
              </button>
            </div>
            <button
              type="button"
              onclick="replyToConfession('${c.mood}', '${c.moniker}')"
              class="text-xs font-mono font-bold text-street-orange hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              <span>Rispondi</span> <span>→</span>
            </button>
          </div>
        `;
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
      } else if (hash === '#app' || hash === '#confessionale') {
        switchView('app');
      } else if (hash === '#presentazione' || hash === '' || hash === '#') {
        switchView('landing');
      }
    });

    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.hash === '#bacheca') {
        switchView('bacheca');
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
        localStorage.setItem('streetalk_lead_email', email);
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
      safeSetText(document.getElementById('chat-my-nick-badge'), `Tu: ${myNick}`);
      safeSetText(document.getElementById('chat-partner-gender'), partnerGender);
      safeSetText(document.getElementById('chat-partner-mood'), partnerMood);

      safeSetText(document.getElementById('chat-partner-secret-box'), partnerSecret);
      safeSetText(document.getElementById('chat-my-secret-text'), mySecret);

      const container = document.getElementById('messages-container');
      container.innerHTML = `
        <div class="text-center my-2">
          <span class="text-[10px] font-mono bg-street-orange/15 border border-street-orange/30 text-street-orange px-3.5 py-1 rounded-full">
            ⚡ ANTEPRIMA CHATROOM ATTIVA • 180 secondi • Messaggi non archiviati
          </span>
        </div>
        <div class="flex flex-col items-start mb-3">
          <div class="max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm break-words shadow-sm font-sans bg-[#0d0e14] border border-zinc-800 text-gray-100 rounded-bl-none">
            Bella! Ho letto il tuo segreto... assurdo 😂 Sei pronto a parlare o scappi prima dei 3 minuti?
          </div>
          <span class="text-[9px] font-mono text-zinc-500 mt-1 px-1">Adesso</span>
        </div>
      `;

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
      const views = { landing: vLanding, app: vApp, radar: vRadar, chat: vChat, bacheca: vBacheca };

      const targetView = views[viewName];
      if (!targetView) return;
      if (viewName !== 'landing' && !socket.connected && typeof socket.connect === 'function') socket.connect();
      if (viewName === 'radar') loadRadarEngine();

      // Update Nav buttons styling
      const navLanding = document.getElementById('nav-btn-landing');
      const navApp = document.getElementById('nav-btn-app');
      const navBacheca = document.getElementById('nav-btn-bacheca');
      const mobileNavIcon = document.getElementById('mobile-nav-icon');
      
      const activeClass = 'px-3 py-1.5 rounded-xl font-bold transition text-white bg-zinc-800/80 border border-street-orange/60 hover:border-street-orange cursor-pointer flex items-center gap-1.5';
      const inactiveClass = 'px-3 py-1.5 rounded-xl font-medium transition text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer flex items-center gap-1.5';

      if (navLanding && navBacheca) {
        navLanding.className = inactiveClass;
        if (navApp) navApp.className = inactiveClass;
        navBacheca.className = inactiveClass;

        if (viewName === 'landing') {
          navLanding.className = activeClass;
          if (mobileNavIcon) mobileNavIcon.textContent = '🏠';
          window.location.hash = '#presentazione';
        } else if (viewName === 'app') {
          if (navApp) navApp.className = activeClass;
          if (mobileNavIcon) mobileNavIcon.textContent = '⚡';
          window.location.hash = '#app';
        } else if (viewName === 'bacheca') {
          navBacheca.className = 'px-3 py-1.5 rounded-xl font-bold transition text-white bg-zinc-800/80 border border-street-orange/60 hover:border-street-orange cursor-pointer flex items-center gap-1.5';
          navLanding.className = 'px-3 py-1.5 rounded-xl font-medium transition text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer flex items-center gap-1.5';
          if (mobileNavIcon) mobileNavIcon.textContent = '⚡';
          window.location.hash = '#bacheca';
          renderBacheca('tutti');
        } else if (viewName === 'radar') {
          window.location.hash = '#radar';
        } else if (viewName === 'chat') {
          window.location.hash = '#chat';
        }
      }

      const allViews = [vLanding, vApp, vRadar, vChat, vBacheca].filter(Boolean);
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

            if (viewName === 'landing' || viewName === 'bacheca') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            if (typeof onActive === 'function') {
              onActive();
            }

            gsap.fromTo(targetView,
              { opacity: 0, y: 14, scale: 0.99 },
              { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power3.out' }
            );
          }
        });
        return;
      }

      // Instant fallback
      allViews.forEach(v => v.classList.add('hidden'));
      targetView.classList.remove('hidden');
      if (viewName === 'landing' || viewName === 'bacheca') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (typeof onActive === 'function') {
        onActive();
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

    function restartWithSameSecret() {
      document.getElementById('modal-ended').classList.add('hidden');
      closeReportModal();
      closeSocialCardModal();
      initiateRadarSearch();
    }

    // Chat Actions
    function sendMessage() {
      const input = document.getElementById('chat-message-input');
      const text = input.value.trim();
      if (!text) return;

      if (socket && socket.connected && currentRoomId) {
        socket.emit('send_message', {
          roomId: currentRoomId,
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
    const STREET_AVATARS = ['⚡', '🐺', '🛹', '🎧', '🌆', '☕', '🖤', '🌙', '🎙️', '🔥', '🕶️', '🥋', '🎲', '👾'];

    function generateRandomStreetNick() {
      const name = STREET_RANDOM_NICKS[Math.floor(Math.random() * STREET_RANDOM_NICKS.length)];
      const num = Math.floor(10 + Math.random() * 89);
      return `${name}_${num}`;
    }

    function getUserProfile() {
      try {
        const stored = localStorage.getItem('streetalk_profile_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed.moniker === 'string') {
            return {
              moniker: parsed.moniker.trim().substring(0, 25) || generateRandomStreetNick(),
              avatar: STREET_AVATARS.includes(parsed.avatar) ? parsed.avatar : '⚡',
              bio: typeof parsed.bio === 'string' ? parsed.bio.trim().substring(0, 70) : ''
            };
          }
        }
      } catch (e) {}

      const defaultProfile = {
        moniker: generateRandomStreetNick(),
        avatar: '⚡',
        bio: 'Qui per parlare con rispetto ed educazione'
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
      if (avatarEl) safeSetText(avatarEl, p.avatar);
    }

    let tempSelectedAvatar = '⚡';

    function renderAvatarGrid(containerId, activeAvatar, onSelect) {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';
      STREET_AVATARS.forEach((av) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `p-1.5 rounded-lg text-lg border transition cursor-pointer flex items-center justify-center ${
          av === activeAvatar
            ? 'bg-street-orange/25 border-street-orange text-white scale-110 shadow-sm'
            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
        }`;
        safeSetText(btn, av);
        btn.onclick = () => {
          onSelect(av);
          renderAvatarGrid(containerId, av, onSelect);
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
      if (previewAvatar) safeSetText(previewAvatar, prof.avatar);
      if (previewNick) safeSetText(previewNick, prof.moniker);

      renderAvatarGrid('profile-avatar-grid', tempSelectedAvatar, (av) => {
        tempSelectedAvatar = av;
        if (previewAvatar) safeSetText(previewAvatar, av);
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
      const moniker = (nickInput && nickInput.value.trim().length >= 2)
        ? nickInput.value.trim().substring(0, 20)
        : generateRandomStreetNick();
      const bio = bioInput ? bioInput.value.trim().substring(0, 70) : '';

      const updated = {
        moniker,
        avatar: tempSelectedAvatar,
        bio
      };
      saveUserProfile(updated);
      closeProfileModal();
      showToast('Profilo salvato con successo!', 'success');
    }

    // Onboarding Gate (First Access)
    let tempOnboardingAvatar = '⚡';

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
      const moniker = (nickInput && nickInput.value.trim().length >= 2)
        ? nickInput.value.trim().substring(0, 20)
        : generateRandomStreetNick();
      const bio = bioInput ? bioInput.value.trim().substring(0, 70) : '';

      const prof = {
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

    window.openProfileModal = openProfileModal;
    window.closeProfileModal = closeProfileModal;
    window.randomizeProfileNick = randomizeProfileNick;
    window.saveProfileFromModal = saveProfileFromModal;
    window.openOnboardingModal = openOnboardingModal;
    window.randomizeOnboardingNick = randomizeOnboardingNick;
    window.submitOnboarding = submitOnboarding;

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
      wrap.className = `flex flex-col ${isSelf ? 'items-end' : 'items-start'} mb-3`;

      const bubble = document.createElement('div');
      bubble.className = `max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm break-words shadow-sm font-sans ${
        isSelf
          ? 'bg-gradient-to-r from-street-orange to-[#e64a00] text-black font-semibold rounded-br-none'
          : 'bg-[#0d0e14] border border-zinc-800 text-gray-100 rounded-bl-none'
      }`;

      safeSetText(bubble, messageObj.message != null ? messageObj.message : (messageObj.text != null ? messageObj.text : ''));

      const timeSpan = document.createElement('span');
      timeSpan.className = 'text-[9px] font-mono text-zinc-500 mt-1 px-1';
      const time = new Date(messageObj.timestamp);
      safeSetText(timeSpan, `${String(time.getHours()).padStart(2,'0')}:${String(time.getMinutes()).padStart(2,'0')}`);

      wrap.appendChild(bubble);
      wrap.appendChild(timeSpan);
      container.appendChild(wrap);

      container.scrollTop = container.scrollHeight;
    }

    // ==========================================
    // INITIALIZATION & DOM LISTENERS
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
      // Initialize Streetalk Profile & Onboarding Gate
      try {
        initProfileAndOnboarding();
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

        safeSetText(document.getElementById('chat-partner-nick'), partnerNick);
        const partnerAvatarEl = document.getElementById('chat-partner-avatar');
        if (partnerAvatarEl) safeSetText(partnerAvatarEl, partnerAvatar);

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
        if (data.isTyping) {
          indicator.classList.remove('opacity-0');
        } else {
          indicator.classList.add('opacity-0');
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
  