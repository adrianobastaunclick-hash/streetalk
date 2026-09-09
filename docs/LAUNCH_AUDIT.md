# STREETALK — audit iniziale e blocchi al lancio

Data: 9 settembre 2026. Repository: adrianobastaunclick-hash/streetalk.
Commit di partenza: 438ec13769e23935c29123356996ce67f4a3dab7.
Pagina osservata: https://streetalk-live.vercel.app/.
**Esito: prototipo con blocchi aperti; non certificato pronto al lancio.**

Questa revisione modifica la configurazione degli agenti e la documentazione, non l'implementazione pubblica. Il commit del repository non è stato confrontato con il commit effettivamente distribuito. Configurazioni, log, database e dati dei provider in produzione non sono stati ispezionati. Nessuna conversazione con utenti reali e nessuna prova invasiva sul servizio pubblico.

## Cosa è stato verificato
- Browser: contenuto della home e apertura della FAQ di moderazione; osservati contatori a 0 e latenza non disponibile durante la visita. Questo non dimostra un guasto permanente o assenza di utenti.
- Console della pagina: warning Tailwind CDN; WebGL non disponibile nel browser usato e fallback 2D. Non equivale a un errore su tutti i dispositivi.
- npm ci --ignore-scripts --no-audit --no-fund: installazione riuscita.
- npm test: 70 controlli passati, 0 falliti, localmente senza credenziali Supabase.
- Diagnostica locale con due client Socket.IO e SDK Supabase interamente simulato: due match ricevuti, segreti reciproci corretti, due inserimenti richiesti nella tabella secrets, entrambi con is_public=true. Zero chiamate a Supabase reale.
- Validatore chiamato localmente con mood riservato: input accettato. Crash remoto non tentato.

## Priorità di correzione

| ID | Priorità | Prova e impatto | Criterio di chiusura |
| --- | --- | --- | --- |
| PRIV-01 | P0 | server.js/createRoom chiama archiveSecret se il client è configurato. lib/supabase.js/archiveSecret usa isPublic=true come default; /api/secrets legge quelli pubblici. Il mock ha riprodotto i due inserimenti. Contraddice la promessa di visibilità solo al partner. | Il percorso privato non archivia né pubblica contenuti, anche con credenziali configurate; test negativo sulle destinazioni. Un eventuale feed futuro è separato e volontario. |
| PRIV-02 | P0 | public/index.html mostra P2P, zero-knowledge ed E2EE; performPingCheck e connect scelgono il badge dal nome del trasporto. server.js riceve e inoltra testo leggibile in send_message e conserva segreti nelle room. | Copy coerente con TLS e limiti del sistema attuale oppure E2EE realmente progettata, implementata e verificata prima di dichiararla. Nessun badge di sicurezza attivo prima della connessione. |
| PRIV-03 | P0 | public/index.html assegna targetServer da URLSearchParams.get('server') prima dell'endpoint previsto. Un link può scegliere la destinazione a cui l'utente invierà il proprio segreto. Riscontro statico; non testato contro endpoint esterni. | Nessun override arbitrario in produzione; eventuale configurazione di sviluppo vincolata a origine/ambiente fidati. Test del confine di destinazione. |
| SEC-01 | P1 | validateJoinPayload accetta mood arbitrari fino a 30 caratteri. getMoodQueue usa un oggetto normale con accesso per chiave. Un nome ereditato dal prototipo può restituire un valore non-array. L'accettazione è riprodotta; la conseguente eccezione è dedotta dal codice, non esercitata sul servizio. | Allowlist normalizzata dei tre mood, errore controllato e server ancora funzionante per input riservati/sconosciuti. |
| SEC-02 | P1 | getClientIp considera cf-connecting-ip e x-forwarded-for senza un confine di proxy fidati nel codice; CORS Socket.IO è '*'. Il rischio dipende anche dal comportamento dell'hosting. | Origini deliberate e controllo handshake adatto ai trasporti; identità di rete ricavata solo da proxy fidati verificati. Limiti per connessioni/eventi e regressioni. |
| SEC-03 | P1 | supabase/schema.sql consente insert anon su secrets/reports/telemetry; la policy chiamata "Disallow public read on reports" autorizza invece SELECT a ogni authenticated con USING(true). Inoltre report_user prevede persistenza di hash IP se configurato. | Rivedere policy per ruolo e accesso diretto, retention e informativa; verificare policy effettive su staging. Il nome della policy non è una protezione. |
| SAFE-01 | P1 | report_user sospende l'IP del partner dopo una sola segnalazione. Questo consente abuso delle segnalazioni e può colpire una rete condivisa. Alcuni eventi, come typing e richieste di proroga, non passano dal rate limiter comune. | Distinguere uscita/blocco personale dalla sanzione globale; limiti e regole di gestione verificate con dati sintetici. |
| TRUST-01 | P1 | destroyedSecretsCount conta dal boot, mentre il titolo UI dice 24H. Home promette match <500ms e anonimato assoluto; la latenza dei test locali non misura attesa con pochi utenti o avvio cloud. | Etichette fedeli alla finestra misurata, stato non disponibile chiaro, nessuna garanzia temporale/non tracciabilità non dimostrata. |
| UX-01 | P2 | Dallo screenshot: molte sezioni ripetono il funzionamento e le promesse; il form ha peso limitato rispetto alla pagina. Il tono rifiuta "m o f?" ma l'ingresso dà rilievo a genere/preferenze. Questa è una valutazione UX, non una misura di conversione. | Form prioritario; filtri coerenti col posizionamento; spiegazione breve; prova del percorso su telefono. |
| PERF-01 | P2 | public/index.html carica sia @tailwindcss/browser@4 sia cdn.tailwindcss.com. Il browser segnala uso CDN inadatto alla produzione. Il benchmark suite esegue soltanto matematica CPU. | Un build CSS definito e misure browser su dispositivi dichiarati; fallback e movimento ridotto verificati. |

P0/P1 indicano l'ordine raccomandato per questa beta, non un punteggio CVSS.
La diagnostica con mock dimostra il percorso di codice configurato, non che utenti reali siano già stati archiviati. Prima di qualsiasi intervento sui dati cloud verificare configurazione e situazione effettive; non cancellare automaticamente.

## Perché 70 controlli verdi non bastano
La suite include prove utili di pairing, scambio, stanze e lifecycle. Include anche assert basati sulla presenza di stringhe nei file, template creativi e istruzioni agli agenti.
La sezione Three-FPS-Profiler simula operazioni matematiche in Node: non crea un contesto WebGL, non renderizza frame, non misura layout, GPU, input o batteria.
Il test Supabase principale gira senza configurazione e accetta il fallback memory-only: non copre il ramo di pubblicazione riprodotto con mock.
Mappe vuote verificano un aspetto del cleanup, non dimostrano assenza di tutte le ritenzioni in heap o cancellazione fisica.
La conclusione della suite è stata corretta per dichiarare solo il completamento dei controlli presenti.

## Valutazione degli agenti precedenti
Due orchestratori e 16 profili descrittivi, senza AGENTS.md root o definizioni native .codex/agents.
Problemi: compiti estranei (Solidity, motori fisici, Kotlin, RAG), effetti obbligatori, loop senza limite, metriche non provate e un ruolo che chiedeva "sicurezza percepita" e jitter dei contatori.
Le frasi "ACTIVE", "70_TESTS_PASSING" o "synchronized" in JSON non provano che processi autonomi siano in esecuzione.
Revisione: coordinatore principale, sei ruoli specifici, massimo tre subagenti contemporaneamente, nessuna delega ricorsiva, file con autore assegnato e revisione indipendente. I nomi storici restano alias per evitare duplicazioni.

## Direzione di prodotto proposta
Punto distintivo: incontro fra due persone che hanno già qualcosa da raccontarsi. Il momento da rendere memorabile è lo scambio reciproco, senza simulare decrittazioni reali.
Esempio di headline da provare: **Un segreto a testa. Tre minuti per conoscersi.**
Testo: "Lascia un pensiero che non diresti al primo incontro. Leggi quello dell'altra persona e cominciate da lì."
CTA: **Trova qualcuno con cui parlare**.
È una proposta creativa da valutare, non un risultato validato da utenti.

Con pochi partecipanti i filtri dividono la disponibilità. Prima di promettere match istantanei, organizzare una beta in fasce orarie e misurare disponibilità, attesa, primo scambio e proroga. Mai presentare bot o contatori sintetici come persone reali.
Definire pubblico/età, gestione segnalazioni e responsabilità prima dell'apertura ampia. Le decisioni su trattamento/retention devono essere rispecchiate nei testi e nell'infrastruttura.

## Fonti consultate
- [Documentazione ufficiale Codex: subagenti e formato TOML](https://learn.chatgpt.com/docs/agent-configuration/subagents).
- [Documentazione ufficiale Codex: AGENTS.md e precedenza](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
- [OWASP: WebSocket Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html).

Le fonti orientano metodo e controlli; le evidenze specifiche di STREETALK provengono dal repository, dal browser e dalle prove locali sopra descritte.
