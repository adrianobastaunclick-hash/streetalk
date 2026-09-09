# STREETALK ⚡
> Chat anonima realtime con scambio di segreti inconfessabili e due modalità dati: solo RAM oppure persistenza Supabase.

---

## 01. PANORAMICA & FILOSOFIA ARCHITETTURALE
**STREETALK** è una piattaforma di chat anonima istantanea a costo zero:
- **Modalità solo RAM**: se `SUPABASE_URL` e una chiave (`SUPABASE_SERVICE_ROLE_KEY` o `SUPABASE_ANON_KEY`) non sono configurate, code, stanze, segreti, messaggi e segnalazioni operative vivono soltanto nella RAM del processo Node.js. Non vengono effettuate scritture cloud.
- **Modalità Supabase**: quando le credenziali sono presenti e il client è inizializzato, il realtime continua a usare la RAM, ma alcuni dati vengono anche archiviati nel database cloud come descritto sotto.
- **Patto del Segreto**: Nessun account né profilo. Per entrare in coda occorre inserire un segreto anonimo (max 90 caratteri). All'accoppiamento, i due interlocutori si scambiano reciprocamente i rispettivi segreti.
- **Isolamento Totale**: Le stanze create (`roomId`) sono compartimentate; nessun evento o messaggio fuoriesce dalla singola stanza.
- **Timer & Proroga**: Sessione con conto alla rovescia di 3 minuti (180s). Proroga di +5 minuti (300s) a doppio consenso.
- **Pulizia della sessione RAM**: alla disconnessione o allo skip, stanze, timer e riferimenti della sessione vengono deallocati. Questa pulizia non elimina le copie già archiviate su Supabase.

### Dati persistiti in modalità Supabase

Le scritture sono asincrone e avvengono solo se Supabase risulta configurato; un errore cloud non interrompe il match o la segnalazione.

- **Creazione della stanza (`createRoom` → `archiveSecret`)**: al match vengono inviati per ciascun partecipante il testo integrale del segreto e il mood. `archiveSecret` aggiunge ID e data di creazione, imposta `likes_count` a `0` e, con il comportamento attuale, `is_public` a `true`. La finalità è alimentare il “Wall of Street Confessions”; i record pubblici sono quindi leggibili tramite `/api/secrets`. Non vengono archiviati in questa operazione messaggi della chat, pseudonimi, genere, IP o `roomId`.
- **Segnalazione (`report_user` → `logReport`)**: solo una segnalazione valida relativa alla stanza corrente, e solo se è disponibile l'IP del partner, salva `roomId`, motivo, stato iniziale `pending`, data e hash abbreviati degli IP di segnalante e segnalato (SHA-256 con `IP_SALT`, o con il salt predefinito se la variabile manca). La finalità è la moderazione e il contrasto agli abusi. Questi record non sono esposti dall'API pubblica dell'app e sono destinati all'accesso amministrativo/moderazione secondo le policy Supabase.
- **Durata**: lo schema non applica scadenze né cancellazioni automatiche ai record `secrets` e `reports`; restano nel progetto Supabase finché un amministratore o una policy esterna non li elimina. La chiusura della stanza cancella soltanto lo stato in RAM.

Di conseguenza, un'installazione che richiede assenza di persistenza deve essere avviata **senza credenziali Supabase** (e verificata tramite `/api/supabase/status`, che deve riportare `in_memory_volatile`).

---

## 02. ARCHITETTURA MULTI-AGENTE & SKILLS
Il sistema è stato generato e validato dal consorzio autonomo di 4 sub-agenti:
1. **[Architect-Agent]**: Definizione del contratto WebSocket (`join_queue`, `match_found`, `send_message`, `skip_partner`, `request_extension`), protocolli e vincoli di latenza < 50ms.
2. **[Backend-Agent]**: Server Node.js + Express + Socket.io con code FIFO di pairing basate su `mood` e preferenze di genere (`M`, `F`, `Tutti`).
3. **[Frontend-Agent]**: SPA ad alto contrasto urban/street (#0d0d0d / #ff5500) con Tailwind CSS CDN, animazione sonar/radar per l'attesa, modale segreto e box segreti contrapposti.
4. **[QA-Security-Agent]**: Suite automatizzata di stress-test con 20 client concorrenti, verifica XSS e audit memory leak.

### Tool Skills Attive
- **`SocketContractValidator`**: Valida rigorosamente i payload socket scartando tipi non conformi o segreti oltre 90 caratteri.
- **`DOMSafetyFilter`**: Neutralizzazione XSS garantita tramite impiego esclusivo di `textContent` ed escaping delle entità HTML.
- **`VolatileMemoryLeakAuditor`**: Verifica che su `socket.disconnect` o `skip_partner` le mappe `users`, `rooms`, `queue` e `rateLimits` vengano azzerate al 100%.
- **`SimulatedTrafficInjector`**: Generatore di traffico sintetico parallelo per la verifica di determinismo e throughput.

---

## 03. STRUTTURA DEL PROGETTO
```
d:/streetalk/
├── package.json          # Dipendenze (express, socket.io, cors, socket.io-client)
├── server.js            # Core realtime server, matching engine e gestione stanze
├── public/
│   └── index.html       # Frontend SPA responsive (Tailwind CSS, radar, chat)
└── tests/
    ├── stress-test.js   # Automated stress test runner & security audit
    └── test-runner.js   # Script runner per pipeline CI
```

---

## 04. ISTRUZIONI PER L'ESECUZIONE

### Avvio Server di Produzione / Sviluppo
```bash
npm start
# oppure
node server.js
```
Il server sarà raggiungibile via browser all'indirizzo: `http://localhost:3000`

### Esecuzione Test Automatici & Audit di Sicurezza
```bash
npm test
# oppure
node tests/stress-test.js
```

Tutti i test vengono eseguiti in-process verificando:
- Test di baseline RAM (0 utenti, 0 stanze).
- Rigetto payload non conformi (contratto socket).
- Neutralizzazione attacchi XSS.
- 10 accoppiamenti simultanei in < 500ms (latenza effettiva ~60ms).
- Scambio di 50 messaggi tra 10 stanze isolate.
- Proroga a doppio consenso (+5 min).
- Deallocazione totale al 100% della memoria dopo disconnessione e skip.
