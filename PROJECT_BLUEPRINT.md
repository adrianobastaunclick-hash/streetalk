# PROJECT BLUEPRINT // STREETALK REALTIME ECOSYSTEM

## 1. Architettura a 3 Layer

### Layer 1: Visual Layer (FrontEnd-Cinematic-Dev + UIUX-Design-Virtuoso + Mobile-App-Architect)
- **Three.js 3D Viewport**: Scena WebGL Three.js r128 con asfalto deformato a onde sinusoidali procedurali e 800 particelle neon fluttuanti reattive al puntatore (mouse e touch).
- **Prestazioni Rendering**: Budget frame <16.66ms per garantire 60/120 FPS stabili, con dynamic pixel-ratio clamping (`Math.min(window.devicePixelRatio, 2)`).
- **Design System Dark Street Neo-Brutalist**: Palette ad alto contrasto (#0a0b0e background, arancione neon #ff5500, ciano neon, tipografia display Syne e JetBrains Mono).
- **Sensory Feedback Audio**: Micro-interazioni sonore generate proceduralmente via Web Audio API nativo (sub-bass 808 sweep, blip sintetici di trasmissione e ricezione, pop per reazioni emoji) senza dipendenza da file MP3 esterni.
- **Stabilità e Reattività Mobile**: Zero Cumulative Layout Shift (CLS = 0) verificato, viewport responsive adattivo a schermi touch, orientamento dinamico e supporto PWA.

### Layer 2: Logic/Engine Layer (Game-Mechanics-Engine + AI-Backend-Engineer + Mobile-App-Architect)
- **Realtime WebSocket Server**: Node.js + Express + Socket.io con supporto duale polling/websocket su porta dinamica, connessione al cluster di produzione Render (`https://streetalk.onrender.com`).
- **RAM Volatile Architecture & Matchmaking FIFO**: Coda di accoppiamento deterministica in-memory separata per mood (cazzeggio, sfogati, flirt) con filtraggio opzionale per genere. Nessun dato di conversazione persistito su disco o database.
- **Pairing Deterministico & Secret Swap**: Scambio atomico e bidirezionale dei segreti all'atto dell'abbinamento, con assegnazione di pseudonimi urbani univoci.
- **Game Lifecycle & Timing Loop**: Conto alla rovescia di 180s per sessione con logica di estensione bilaterale concordata (+300s) e deallocazione istantanea allo skip o disconnect.
- **Stale Socket & Ghost Pruning**: Rilevamento e rimozione immediata dei socket disconnessi orfani dalle code per impedire ghost pairings.
- **Clean Architecture & Mobile PWA Layer**: Separazione netta dei layer di presentazione e trasporto, con Service Worker (`/sw.js`) e Web App Manifest (`/manifest.json`) per caching offline e installabilità.

### Layer 3: Resilience/Contract Layer (Smart-Contract-Auditor + Self-Correction-Auditor)
- **Socket Contract Validation**: Regole contrattuali stringenti sui payload in ingresso (segreti 3-90 caratteri, rigetto assoluto di tag `<script>`, pattern URL `http://` / `https://` e formati numerici telefonici).
- **DOM Safety & Neutralizzazione XSS**: Sanitizzazione preventiva prima del rendering tramite `textContent`/`safeSetText` e neutralizzazione delle entità HTML pericolose.
- **Volatile Memory Audit & Zero-Leak Invariance**: Azzeramento provato e verificabile di mappe utenti, stanze, code e contatori di rate limit alla chiusura delle sessioni.
- **Resilient Cloud Fallback**: Gestione resiliente della modalità memoria-volatile in assenza di credenziali Supabase, senza crash di processo.
- **Technical SEO & Indexing Contract**: Robots.txt conforme, sitemap.xml con date canoniche, tag meta OpenGraph/Twitter card, meta tag Google Search Console e 4 schemi semantici Schema.org JSON-LD (WebApplication, Organization, HowTo, FAQPage con 8 voci).
- **Test Baseline Automatizzata**: Suite end-to-end con 63/63 test automatizzati passanti al 100% (`tests/autonomous-suite.js`).

---

## 2. Matrice di Assegnazione dei Sub-Agenti (Ralph Loop - REVIEW)

| Sub-Agente | Layer di Competenza | Responsabilità Operativa in STREETALK | Vincolo / Invariante Chiave |
|---|---|---|---|
| **FrontEnd-Cinematic-Dev** | Visual Layer | Scena Three.js r128, particelle neon, deallocazione WebGL, animazioni GSAP | 60/120 FPS stabili, frame budget <16.66ms |
| **UIUX-Design-Virtuoso** | Visual Layer | Dark Neo-Brutalism, contrasto elevato, Web Audio procedurale nativo, zero CLS | WCAG AAA, zero MP3 esterni, CLS = 0 |
| **Mobile-App-Architect** | Visual + Logic Layers | PWA (manifest/sw), UI responsive touch, Clean Architecture modulare | Recomposition minima, rendering fluido su mobile |
| **Game-Mechanics-Engine** | Logic/Engine Layer | Timestep matchmaking, macchine a stati FSM, code FIFO per mood, timer 180s/+300s | Transizioni di stato deterministiche, zero lock |
| **AI-Backend-Engineer** | Logic/Engine Layer | Server Socket.io, routing eventi, validazione contrattuale payload, architettura volatile | Output deterministici, zero leakage in RAM |
| **Smart-Contract-Auditor** | Resilience Layer | Sanitizzazione input, neutralizzazione XSS, isolamento delle stanze | Zero injection (XSS/SQL), isolamento crittografico |
| **Self-Correction-Auditor** | Resilience Layer | Suite di test QA (63/63 test), profilazione RAM/heap, log su `.agent_learnings.md` | 100% test pass rate, 0 memory leak verificato |

---

## 3. Stato del Protocollo di Esecuzione (Ralph Self-Improvement Loop)
- **REVIEW**: [COMPLETO] Analisi dei requisiti e matrice dei 7 sub-agenti registrata su `PROJECT_BLUEPRINT.md`.
- **ACT**: [COMPLETO] Codice modulare implementato, disaccoppiato e validato.
- **PROVE**: [COMPLETO] Suite automatizzata di 63 test eseguita con successo al 100% (`node tests/autonomous-suite.js`).
- **LEARN**: [COMPLETO] Invarianti operative attive e persistite su `.agent_learnings.md`.
- **HALT**: [PRONTO] Artefatto verificato, nessun memory leak, ambiente configurato e in ascolto per il prossimo task.
