# STREETALK ⚡
> Chat anonima realtime con scambio di segreti inconfessabili, architettura multi-agente e memoria RAM 100% volatile.

---

## 01. PANORAMICA & FILOSOFIA ARCHITETTURALE
**STREETALK** è una piattaforma di chat anonima istantanea a costo zero:
- **Zero Database / Zero Persistence**: Tutto vive esclusivamente nella memoria RAM volatile del processo Node.js.
- **Patto del Segreto**: Nessun account né profilo. Per entrare in coda occorre inserire un segreto anonimo (max 90 caratteri). All'accoppiamento, i due interlocutori si scambiano reciprocamente i rispettivi segreti.
- **Isolamento Totale**: Le stanze create (`roomId`) sono compartimentate; nessun evento o messaggio fuoriesce dalla singola stanza.
- **Timer & Proroga**: Sessione con conto alla rovescia di 3 minuti (180s). Proroga di +5 minuti (300s) a doppio consenso.
- **Pulizia 100% Volatile**: Alla disconnessione o allo skip di un utente, stanze, timer e riferimenti in RAM vengono deallocati all'istante (zero memory leaks).

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
