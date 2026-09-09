# Astra su STREETALK: come lavorare

Seleziona Astra fra i modelli disponibili nella tua interfaccia Codex. Questa configurazione eredita modello e livello di ragionamento: non forza identificativi, non cambia il tuo profilo globale e non sblocca funzioni del piano.

## Configurazione
Le istruzioni principali sono in AGENTS.md. I sei ruoli sono file TOML in .codex/agents/; .codex/config.toml limita a tre i subagenti concorrenti.
La documentazione ufficiale consultata il 9 settembre 2026 supporta questo formato. La CLI non è installata nell'ambiente dell'audit: sintassi TOML verificabile, caricamento nella tua versione ancora da verificare. Se il client non supporta i custom agent, il coordinatore può leggere le istruzioni e assegnare gli stessi ruoli con gli strumenti disponibili; non dichiarare agenti attivati solo perché esistono i file.
All'inizio chiedi a Codex di riportare le istruzioni realmente caricate e i ruoli disponibili. Se il progetto richiede una scelta di fiducia, usa il normale flusso del client; non aggirarlo.

## Divisione del lavoro
| Responsabile | Produce | Ambito |
| --- | --- | --- |
| Coordinatore Astra | priorità, contratti, integrazione, resoconto | AGENTS e piano |
| code_mapper | mappa dei flussi con evidenze | sola lettura |
| realtime_engineer | correzioni eventi/code/stanze | backend assegnato |
| frontend_engineer | ingresso, attesa e chat responsive | frontend assegnato |
| security_reviewer | revisione privacy e sicurezza | sola lettura |
| qa_reviewer | regressioni e verifiche indipendenti | test assegnati |
| product_growth | UX, copy e strategia beta | specifiche e contenuti assegnati |

I sei ruoli sono un catalogo, non sei processi sempre attivi. Il coordinatore sceglie quelli utili.
Esempio: code_mapper e security_reviewer possono leggere in parallelo mentre il coordinatore definisce i criteri. Backend e frontend possono implementare in parallelo solo dopo aver concordato gli eventi e senza modificare file condivisi. QA verifica la patch integrata.

## Contratto di incarico
- Task/obiettivo e priorità.
- Stato di partenza e prova del problema.
- File di proprietà; file da consultare soltanto.
- Input/output e dipendenze da altri ruoli.
- Comportamento atteso e test utile.
- Output: risultato, file/simboli, verifiche, limiti, prossima azione.

Gli agenti restituiscono risultati al coordinatore con gli strumenti reali di collaborazione. sync-channel.json è solo una fotografia datata del lavoro: non è un bus di messaggi né un'automazione.

## Prompt iniziale pronto
```text
Lavora su STREETALK come coordinatore tecnico e di prodotto.
Leggi AGENTS.md, docs/LAUNCH_AUDIT.md e PROJECT_BLUEPRINT.md.
Riporta le istruzioni realmente caricate, il commit di partenza e i ruoli disponibili.
Usa gli agenti solo per sottotask indipendenti, massimo tre in parallelo.

Inizia dalla milestone M0: privacy e sicurezza coerenti con il prodotto.
Riproduci i difetti localmente con dati sintetici prima di correggerli.
Traccia i segreti fino a ogni destinazione e rimuovi dall'esperienza privata
qualsiasi archiviazione/pubblicazione automatica. Verifica anche le chiamate
dirette alle API e le policy: chiudere il solo frontend non basta.
Mantieni distinta la preparazione di una migrazione dalla sua esecuzione cloud.

Correggi le promesse UI non dimostrate, inclusi badge E2EE, anonimato assoluto,
tempi di match garantiti e contatori etichettati con finestre sbagliate.
Verifica l'override del server via URL, i mood ammessi, le origini e gli header proxy.
Aggiungi regressioni che coprano i problemi, senza riutilizzare dati degli utenti.
Fai revisionare la patch integrata, prepara una PR e riporta blocchi residui.
Non dichiarare completato il lancio finché le milestone successive non sono verificate.
```

## Prove utili
- Due client indipendenti ricevono esattamente il segreto del partner; un terzo non vede né invia contenuti nella stanza.
- Un solo consenso non proroga; due consensi validi prorogano una sola volta secondo la regola scelta.
- Skip, scadenza, refresh e perdita rete lasciano UI e server in stati coerenti.
- Il percorso privato non scrive segreti nei database, log, analytics, cache o asset condivisi.
- Un browser senza WebGL e con movimento ridotto può comunque entrare, scrivere e uscire.
- Registrare nel report quali casi non sono stati eseguiti; nessun risultato simulato.

Fonti: [Custom agents](https://learn.chatgpt.com/docs/agent-configuration/subagents), [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [OWASP WebSocket Security](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html).
