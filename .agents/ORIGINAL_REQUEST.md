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
