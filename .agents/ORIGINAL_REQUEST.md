# Original User Request

## 2026-09-14T20:58:44Z

Evolvere STREETALK da chat effimera a piattaforma di connessione sociale sostenibile: ripristinare e valorizzare graficamente le emoji di reazione rapida, espandere il catalogo GIF/reaction con categorie specifiche di Flirt e Amore (risolvendo il bug delle fiamme duplicate), trasformare la barra laterale in hub di conoscenza con richiesta di amicizia a doppio consenso (rubrica interna + scambio social), implementare la sezione Profilo con rubrica connessioni, integrare nella bacheca i Gruppi a Tema creati da utenti qualificati (sistema ibrido Karma/Badge Fondatore), e introdurre il modello di monetizzazione di lancio basato sul Badge Fondatore una tantum.

Working directory: d:\streetalk
Integrity mode: development

## Requirements

### R1. Striscia Emoji Reazioni Rapide: Fix Funzionale e Restyling Grafico
- Rendere interattiva e funzionante la barra orizzontale delle reazioni rapide in chat (Image 1: 🔥, 💀, ⚡, 🖤, 🚬, 👀, 🤯, 👏 e nuove emoji flirt/amore: 💖, 💋, 😈, 🌹).
- Al click su un'emoji, riprodurre micro-animazione (spring pop + haptic visuale), audio Web Audio API, e inviare l'evento realtime `send_reaction` che fa fluttuare l'emoji sullo schermo di entrambi i partner con dissolvenza neon.

### R2. Motore GIF & Reazioni Visive: Eliminazione Fallback Unico ed Espansione Flirt/Amore
- Risolvere il bug visivo (Image 2) dove tutte le schede della griglia mostrano la stessa fiamma fallback (`flame.svg`).
- Introdurre file grafici differenziati e animati per ciascuna reazione e aggiungere le categorie dedicate **"Flirt"** e **"Amore"** (cuori pulsanti, sguardi ammiccanti, baci neon, scintille), ripristinando al contempo le reazioni precedenti.
- Garantire che la ricerca e i filtri di categoria carichino elementi grafici coerenti e visivamente distinti.

### R3. Barra Laterale Chat: Hub Dettagli Partner e Richiesta Amicizia / Conoscenza
- Riorganizzare la sidebar (Image 3): eliminare ridondanze con la chat e dedicare lo spazio ai dettagli del partner (avatar, moniker, mood, scheda descrittiva senza foto, badge).
- Aggiungere il pulsante interattivo **"Richiedi Amicizia / Conoscenza"**:
  - Se uno dei due preme il tasto, il partner riceve una notifica discreta nella sua sidebar.
  - Se entrambi confermano (doppio consenso bilaterale), si sblocca lo scambio: salvataggio reciproco nella **Rubrica Connessioni Anonime** interna alla web app e opzione di scambiarsi facoltativamente un contatto social (Telegram/Instagram/Link) prima della distruzione della stanza.

### R4. Sezione Profilo & Rubrica Connessioni
- Creare o potenziare la sezione **Profilo**:
  - Gestione identità anonima (moniker, motto, visione, argomenti, avatar SVG).
  - Punteggio **Street Karma** (fiamme ricevute, rispetto delle regole del bot, anzianità).
  - Visualizzazione e attivazione del **Badge Fondatore**.
  - **Rubrica Connessioni**: lista degli amici/partner salvati con cui è scattato il doppio consenso, con possibilità di visualizzare il loro profilo e gli eventuali social scambiati.

### R5. Sezione Bacheca: Gruppi Tematici Aperti
- Introdurre nella Bacheca una nuova vista/tab **"Gruppi a Tema"** (tavoli di discussione underground a tema: es. "Musica Notturna", "Confessioni Relazioni", "Dibattito Filosofico").
- **Criterio di Creazione Ibrido**: la creazione di un gruppo a tema è riservata a chi possiede il **Badge Fondatore** (sbloccato) oppure un alto punteggio di **Street Karma** (zero sanzioni da StreetBot).
- Gli altri utenti possono unirsi al gruppo per leggere o partecipare al flusso.

### R6. Modello di Monetizzazione di Lancio: "Badge Fondatore / Sostenitore"
- Implementare il modal e la logica di supporto economico per il lancio: offerta una tantum del **"Badge Fondatore"** (es. €2.99 una tantum / simulazione Stripe-ready).
- Il badge offre vantaggi esclusivi *intorno* alla chat senza alterare l'anonimato della chat 1v1 (sempre gratuita):
  - Badge dorato/neon "FONDATORE" visibile sul profilo e nella sidebar.
  - Diritto immediato di aprire Gruppi a Tema in Bacheca.
  - Reazioni e GIF esclusive (categoria VIP / Glow).
  - Accesso prioritario al Radar quando la coda è satura.

## Acceptance Criteria

### Chat & Reazioni
- [ ] Le emoji della striscia rapida in chat (incluse quelle flirt/amore) sono cliccabili, emettono suono e generano il pop-up animato fluttuante in tempo reale sulla chat.
- [ ] Il catalogo GIF mostra grafiche animate distinte per ogni voce (zero duplicati della sola fiamma), con le categorie Trend, Street, Flirt, Amore, Spicy, LOL, Notte pienamente funzionanti.

### Connessioni & Sidebar
- [ ] La sidebar mostra la scheda del partner con pulsante "Richiedi Amicizia".
- [ ] Il doppio consenso sblocca lo scambio contatto e memorizza il partner nella Rubrica Connessioni dell'utente.
- [ ] La sezione Profilo mostra il proprio Street Karma, i badge e la lista delle connessioni salvate.

### Bacheca & Gruppi a Tema
- [ ] Gli utenti qualificati (con Badge Fondatore o alto Karma) possono creare un nuovo Gruppo a Tema compilando titolo e descrizione.
- [ ] Gli utenti non qualificati visualizzano una spiegazione chiara su come ottenere la qualifica (Badge Fondatore o accumulando Karma).
- [ ] I gruppi a tema creati appaiono nella bacheca e permettono l'accesso.

### Monetizzazione & Stabilità
- [ ] Il modal del Badge Fondatore illustra chiaramente i benefit e gestisce la transazione di sblocco in modo fluido.
- [ ] Nessuna funzionalità base di chat 1v1 viene resa a pagamento; l'anonimato e la privacy dei segreti restano inviolati al 100%.
- [ ] La suite di test automatizzata (`npm test`) si arricchisce delle nuove verifiche e registra 100% pass rate.
- [ ] Perfetta parità tra i file radice e la cartella `public/`.

## 2026-09-14T22:47:47Z

Streetalk è una chat anonima street-style (Node/Express/Socket.IO, frontend bundle in `frontend/app.js` → `public/app.min.js`). Dopo una sessione di sviluppo con agenti multipli, sono emerse 7 criticità visive e funzionali da risolvere senza rompere la suite di 124 test esistente (`npm test`). Le immagini di riferimento si trovano in `C:/Users/adria/.gemini/antigravity/brain/c8214c33-d235-419c-a827-2256d857d0f3/.user_uploaded/`.

Working directory: d:\streetalk
Integrity mode: development

---

## Requirements

### R1. Fix overflow "Scambio Social Facoltativo" nella sidebar destra della chat
Il form composto da `<select>` (Telegram/Instagram/…) + `<input>` (@handle) + `<button>Invia</button>` nella sezione **SCAMBIO SOCIAL FACOLTATIVO** della sidebar partner (`#partner-hub-sidebar` o simile in `index.html`/`public/index.html`) sporge oltre il bordo destro del pannello — il pulsante Invia è tagliato. Il fix deve fare in modo che l'intera riga rimanga dentro il container su qualsiasi larghezza dello schermo usando flex-wrap o layout column su schermi stretti. Nessuna dipendenza nuova; solo CSS/Tailwind classi esistenti.

### R2. Redesign completo della Story Card (canvas 9:16)
La funzione `drawStoryCard()` in `frontend/app.js` (~riga 3812) produce una card piatta, senza stile, con placeholder sfocati. Va rifatta con:
- Sfondo gradiente scuro (nero → antracite → viola scuro) o texture street
- Logo Streetalk reale (testo `ST STREETALK` in font bold arancio/bianco, non placeholder)
- Tipografia grande, impattante, con tagline variata fra almeno 5 frasi street diverse scelte random
- Dettagli visivi: bordo neon arancio, griglia urbana sottile come watermark, orario dinamico (ora locale), call-to-action "streetalk.live" con font monospace
- Mantenere il vincolo privacy: zero segreti/messaggi reali nella card — solo copy promozionale generata client-side

### R3. Integrazione del logo ufficiale in tutta la UI
Il logo ufficiale Streetalk si trova in `C:/Users/adria/.gemini/antigravity/brain/c8214c33-d235-419c-a827-2256d857d0f3/.user_uploaded/media_1789425043227.png` — è una `S` in forma di bolla chat con segnale WiFi + testo **STREETALK** bold + sottotitolo *CHAT ANONIMA. REALE. ORA.*
Va integrato:
- Nell'header principale dell'app (sostituire il placeholder testuale attuale `ST` o simile)
- Nella Story Card come header (R2)
- Il file logo va copiato in `public/assets/logo-streetalk.png` e in `assets/logo-streetalk.png` e referenziato tramite percorso relativo `/assets/logo-streetalk.png`

### R4. Nascondere/rimuovere la sidebar sinistra della chat finché non esiste un sistema di login
La sidebar sinistra della schermata chat contiene dati e info profilo (karma, connessioni, badge fondatore display) ma non esiste ancora un sistema di registrazione/login vero. Va nascosta (`display:none` o rimossa dal DOM della view chat) lasciando la chat a piena larghezza. Le funzionalità di profilo restano accessibili solo dalla sezione **Profilo** nel menu principale — non dalla chat. Verificare parità `index.html` / `public/index.html`.

### R5. Ripristinare e migliorare la sezione Bacheca con tab "Gruppi a Tema" e modal pagamento
La Bacheca è presente nel nav (`nav-btn-bacheca`) ma il tab **Gruppi a Tema** non ha un chiaro percorso di creazione a pagamento. Implementare:
- Tab **Gruppi a Tema** visibile in Bacheca con lista dei gruppi esistenti (GET /api/groups)
- Pulsante **"Crea Gruppo"** che apre un modal; se l'utente non ha il Badge Fondatore né Karma ≥ 100, mostra un modal di upgrade con prezzo **€2.99 (Badge Fondatore)** e i benefit (simulazione Stripe, nessuna transazione reale)
- Il flusso di unlock simulato (`POST /api/founder/unlock`) già esiste nel backend e va collegato al modal
- Dopo unlock simulato, il pulsante Crea Gruppo diventa attivo e chiama `POST /api/groups`

### R6. Sistema di avatar liberamente scelto per gli Street ID
La griglia avatar esiste in HTML (`#full-profile-avatar-grid`, `#onboarding-avatar-grid`, `#profile-avatar-grid`) ma va ampliata e resa completa:
- Almeno 40 avatar tra emoji simbolici street (⚡🔥🌙🦊🐺🎭🕶️🎯🏴☠️🌆…) e icone tematiche
- L'avatar scelto persiste in `localStorage` e si mostra nell'header (`#header-profile-avatar`) e nella partner view (`#chat-partner-avatar`)
- Se non selezionato, default `⚡`
- Nessun upload di immagini utente (privacy by design)

---

## File modificabili

- `frontend/app.js` — sorgente principale; ogni modifica richiede rebuild con `npm run build`
- `index.html` e `public/index.html` — **devono rimanere identici** (usare `Copy-Item` dopo ogni modifica)
- `incrocio.css` e `public/incrocio.css` — **devono rimanere identici**
- `street-editorial.css` e `public/street-editorial.css` — **devono rimanere identici**
- `public/assets/` e `assets/` — per copia del logo
- `server.js` — solo se serve per R5; gli endpoint `/api/founder/unlock` e `POST /api/groups` già esistono
- `tests/autonomous-suite.js` — aggiungere test di regressione se necessario

## File NON modificabili

- `lib/street-bot.js`, `lib/network-policy.js`, `lib/gif-provider.js` — non toccare
- Nessun nuovo framework, servizio cloud o dipendenza npm
- `package.json` — non aggiungere dipendenze

## Regola critica: build e parità
Dopo OGNI modifica a `frontend/app.js` eseguire `npm run build`.
Dopo OGNI modifica a `index.html` copiarlo su `public/index.html` con `Copy-Item index.html public/index.html`.
Stesso per `incrocio.css` → `public/incrocio.css` e `street-editorial.css` → `public/street-editorial.css`.

---

## Acceptance Criteria

### A1. Overflow fix sidebar (R1)
- [ ] Su viewport 375px larghezza il form "Scambio Social" è completamente visibile senza scroll orizzontale
- [ ] Il pulsante Invia non è mai tagliato/hidden su nessun viewport da 320px a 1440px
- [ ] `npm test` → 124/124 PASS dopo la modifica

### A2. Story Card redesign (R2)
- [ ] `drawStoryCard()` produce canvas con sfondo scuro (nessun bianco dominante)
- [ ] La tagline cambia ad ogni apertura (almeno 5 varianti diverse verificabili)
- [ ] Nessun placeholder sfocato o testo "[SEGRETO]" visibile
- [ ] Il logo è riconoscibile come Streetalk

### A3. Logo (R3)
- [ ] `public/assets/logo-streetalk.png` esiste su disco
- [ ] `assets/logo-streetalk.png` esiste su disco (parità)
- [ ] L'header mostra il logo invece del placeholder testuale precedente

### A4. Sidebar sinistra rimossa/nascosta (R4)
- [ ] La view chat non mostra una colonna sinistra separata con dati profilo
- [ ] `index.html` e `public/index.html` sono identici (hash SHA256 uguale)

### A5. Bacheca Gruppi a Tema + modal pagamento (R5)
- [ ] Il tab "Gruppi a Tema" è visibile in Bacheca e mostra i gruppi esistenti
- [ ] Clic su "Crea Gruppo" senza Badge Fondatore → mostra modal upgrade con prezzo €2.99
- [ ] Modal upgrade collegato a `/api/founder/unlock` → dopo unlock il pulsante Crea Gruppo si attiva
- [ ] `npm test` → almeno 124/124 PASS

### A6. Avatar selector (R6)
- [ ] La griglia avatar contiene almeno 40 opzioni
- [ ] Selezione persiste dopo reload (localStorage)
- [ ] Avatar dell'utente visibile in `#header-profile-avatar`
- [ ] `npm test` → 124/124 PASS

### A7. Build e parità finale
- [ ] `npm run build` completa senza errori
- [ ] `npm test` → ≥ 124/124 PASS
- [ ] Hash SHA256 di `index.html` == `public/index.html`
- [ ] Hash SHA256 di `incrocio.css` == `public/incrocio.css`
- [ ] Commit finale su branch main con messaggio descrittivo
- [ ] `git push origin main` eseguito
