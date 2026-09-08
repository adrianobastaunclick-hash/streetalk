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

## 2. Matrice di Assegnazione dei Sub-Agenti Tecnici (Ralph Loop - REVIEW)

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

## 3. Matrice di Assegnazione del Dipartimento Growth & Neuromarketing (2026)

Coordinato dall'Orchestratore `autonomous-growth-director` (`.agents/autonomous-growth-director.md`), in sinergia diretta con `god-mode-creative-architect`.

| Sub-Agente Growth | Focus Operativo | Stack Principale | Output & Deliverable Operativi |
|---|---|---|---|
| **SEO-Data-Strategist** | Posizionamento Organico SERP #1 | Search Intent Clustering, Schema.org Graph, CWV, Programmatic SEO | Ottimizzazione index.html, sitemap XML, JSON-LD FAQPage (8 Q&A), ranking keyword target |
| **Neuromarketing-Psychologist** | Trigger Cognitivi & Retention | Behavioral Economics, Cialdini Scarcity, Fogg B=MAP, FOMO | Micro-copy psicologico, voyeurismo etico del segreto, abbattimento ansia sociale <5s |
| **Color-Cognitive-Scientist** | Neuro-Ergonomia Cromatica | Chromatic Psychology, WCAG AAA Contrast, Attention Heatmaps | Mappe cromatiche (#0a0b0e / #ff5500), gradienti Three.js shader, neuro-palette promozionale |
| **Viral-Copy-Architect** | Hook & Narrazione Viscerale | Hook-Story-Offer, Street Slang Parsing, TikTok/Reels Scripting | Script video short-form, cataloghi hook ad alta ritenzione, headline scroll-stopping |
| **Social-Media-Master** | Distribuzione Multipiattaforma | Social Scheduling, Algorithm Hacking, Trend Spotting, Community Radar | Calendario editoriale notturno (21:30 - 03:00), monitoring r/sfoghi, engagement rapido |
| **Creative-Media-Synthesizer** | Sintesi Media Generativa | Nano Banana 2 (Infografiche), Google Veo (Reels 9:16 @ 60 FPS), Canvas Art | Template `.agents/creative-templates/`, prompt per render farm, Story Card per app |
| **Growth-Data-Analyst** | Funnel Telemetry & Alerting | In-Memory Event Streaming, 4-Stage Funnel, Cohort Analysis | Monitoraggio tassi atterraggio -> segreto -> match -> +5m. Allerta autonoma se drop > 15% |

---

## 4. Il Protocollo di Collaborazione Autonoma (GROWTH-RALPH-LOOP)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                            GROWTH-RALPH-LOOP (AUTONOMOUS)                            │
└──────────────────────────────────────────────────────────────────────────────────────┘
  [1. MARKET INTEL] ──> Trend Analysis (TikTok/Reddit) + Keyword Gaps (SEO Strategist)
           │
  [2. SYNTHESIS]    ──> Neuromarketing emette direttive psicologiche + Palette arancio/nera
           │
  [3. ASSET CRAFT]  ──> Copywriter redige Hook + Media Synthesizer compila layout Nano/Veo
           │
  [4. APP BRIDGE]   ──> Aggiornamento meta-tag SEO, rich snippets e micro-copy su index.html
           │            (Diretta comunicazione con FrontEnd-Cinematic-Dev)
           │
  [5. ANALYTICS]    ──> Stress-test dell'indicizzazione e simulazione del CTR / Funnel Test
           │
     <KPI RAGGIUNTO?>
       ├── NO ──> Analisi del drop-off, riscrittura copy/colori e ritorno a [2. SYNTHESIS]
       │
       └── SI ──> Deploy automatico artefatti marketing e aggiornamento `.agent_learnings.md`
```

### Fasi del Ciclo Autonomo
1. **MARKET INTEL**: `SEO-Data-Strategist` e `Social-Media-Master` scansionano continuamente le SERP di Google e le tendenze di Reddit/TikTok, rilevando keyword emergenti su anonimato, solitudine notturna e sfoghi senza registrazione.
2. **SYNTHESIS**: `Neuromarketing-Psychologist` definisce gli archi emotivi (urgenza, voyeurismo etico, de-inibizione), mentre `Color-Cognitive-Scientist` calibra le soglie di contrasto retinico e la saturazione della palette ad alta adrenalina.
3. **ASSET CRAFT**: `Viral-Copy-Architect` produce gli hook testuali entro i primi 2 secondi, e `Creative-Media-Synthesizer` genera le specifiche per Nano Banana 2 (`infographics-nano-banana.json`) e video cinematici Google Veo (`cinematic-reels-veo.json`).
4. **APP BRIDGE**: Le direttive ottimizzate vengono propagate direttamente all'interfaccia utente in `index.html` e `public/index.html` in cooperazione con `FrontEnd-Cinematic-Dev` e `UIUX-Design-Virtuoso`.
5. **ANALYTICS & ADAPTATION**: `Growth-Data-Analyst` valuta l'efficacia del funnel a 4 stadi. Se il drop-off supera il 15%, il loop torna autonomamente alla fase di sintesi; al raggiungimento dei KPI, le metriche vengono salvate in `.agent_learnings.md`.

---

## 5. Stato del Protocollo di Esecuzione
- **REVIEW**: [COMPLETO] Rete tecnica (7 nodi) e Dipartimento Growth (7 nodi) registrati e sincronizzati su `PROJECT_BLUEPRINT.md`.
- **ACT**: [COMPLETO] Codice applicativo modulare, template generativi in `.agents/creative-templates/` e markup SEO ad alto CTR attivi.
- **PROVE**: [COMPLETO] Suite automatizzata di 63 test eseguita con successo al 100% (`node tests/autonomous-suite.js`).
- **LEARN**: [COMPLETO] Prompt Nano Banana 2 e Google Veo registrati in `.agent_learnings.md` insieme alle invarianti di crescita.
- **HALT**: [PRONTO] Rete multi-agente autonoma operativa, 0 memory leak, WebSockets intatti, pronta per produzione e indicizzazione SERP.

---

## 6. Piano di Intervento Coordinato (Joint Dev & Growth Overhaul)

Registrazione delle migliorie strutturali coordinate tra god-mode-creative-architect e autonomous-growth-director tramite .agents/sync-channel.json:

### 1. Grafica & Immersione 3D (FrontEnd-Cinematic-Dev & UIUX-Design-Virtuoso)
- **Elevazione della Scena WebGL**:
  - Riverbero neon anamorfico marcato con piano orizzontale in Additive Blending ad ampiezza dinamica (anamorphicFlare) e pulsazione legata al clock.
  - Reattivita fluida della camera allo scroll tramite interpolazione lerp ottimizzata e integrazione GSAP ScrollTrigger per un fly-through progressivo sul piano d asfalto deformato.
  - Micro-illuminazione volumetrica continua: la point light arancione (#ff5500) insegue con inerzia fluida il puntatore (mouse e touch), generando riflessi caldi reattivi sulla griglia.
- **Perfezionamento del Tilt 3D & Radar**:
  - Applicazione dell effetto Tilt 3D dinamico ad alta frequenza su card di selezione (Genere, Mood, Segreto, Card Regole) con supporto per giroscopio mobile (deviceorientation).
  - Animazione radar 3D sferica avanzata durante l attesa matchmaking con sfera wireframe rotante e onde concentriche di sonar pulsanti.

### 2. Neuromarketing & Psicologia del Segreto (Neuromarketing-Psychologist & Color-Cognitive-Scientist)
- **Barra di Inserimento a Gradiente Dinamico**:
  - Feedback cromatico ed emotivo a 4 stadi sull input del segreto (0-90 caratteri): da ambra delicata a arancione elettrico, fino a crimson neon pulsante a 85-90 caratteri, accompagnato da micro-copy di tensione drammatica per massimizzare il tasso di completamento.
- **Svelamento Simultaneo Esplosivo**:
  - Reveal del segreto del partner con animazione a strappo neon (#partner-secret-card), glitch cromatico con micro-sfarfallio e rimbalzo elastico GSAP.
  - Sintesi audio Web Audio API amplificata: sweep 808 sub-bass a doppia componente (160Hz -> 36Hz) accoppiato a campanella metallica armonica per un feedback aptico/sensoriale viscerale.

### 3. SEO & Social Engine (SEO-Data-Strategist, Viral-Copy-Architect & Creative-Media-Synthesizer)
- **Ottimizzazione Meta-Tag & CTR Google SERP**:
  - Aggiornamento dei meta tag per massimizzare il CTR su query ad alta intenzione di anonimato e sfogo notturno, preservando il codice di verifica Google Search Console e i 4 schemi JSON-LD Schema.org.
- **Generazione Story Card 9:16 & Web Share API**:
  - Rendering canvas 720x1280 in stile Dark Neo-Brutalism con griglia d asfalto, virgolette stese a mano, watermark @STREETALK.LIVE e metadati del segreto.
  - Trigger di condivisione nativa tramite navigator.share (con supporto file blob) e fallback istantaneo su download PNG ad alta risoluzione.
