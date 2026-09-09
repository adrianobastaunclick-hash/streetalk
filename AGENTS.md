# STREETALK — istruzioni operative per Codex

## Obiettivo e fonti
Portare una chat anonima testuale a una beta affidabile: segreto reciproco, incontro, 180 secondi, continuazione di 300 secondi a doppio consenso. Identità street nero/arancio, italiano semplice.
Leggi docs/LAUNCH_AUDIT.md per i blocchi osservati e docs/CODEX_WORKFLOW.md per il metodo.
Le definizioni native sono in .codex/agents/*.toml. I nomi storici in .agents/ sono alias documentali: file e status JSON non avviano agenti né processi in background.
PROJECT_BLUEPRINT.md è un piano, .agent_learnings.md è un registro di prove, non una certificazione.

## Setup
- Stack attuale: Node CommonJS, Express, Socket.IO, HTML/CSS/JS, integrazione Supabase opzionale.
- Installa con npm ci. Avvia con npm start; suite esistente con npm test.
- Usa server locale e contenuti sintetici per test di chat/carico; mai il backend pubblico o utenti reali.
- I test non devono usare credenziali Supabase reali; non stampare segreti o variabili d'ambiente.
- Vercel distribuisce public/; Render avvia server.js. Verifica la configurazione prima di assumere equivalenza con produzione.
- public/index.html e index.html sono copie oggi identiche: finché questa duplicazione esiste, sincronizza le modifiche intenzionali. Stesso controllo per asset duplicati interessati.
- Non introdurre un nuovo framework, servizio o dipendenza solo perché compare in un profilo agente.

## Coordinamento
L'agente principale decide priorità, assegna i file e integra. Usa subagenti soltanto per compiti indipendenti utili; massimo tre contemporaneamente, una sola profondità. Per una modifica piccola lavora direttamente.
Ruoli disponibili: code_mapper, realtime_engineer, frontend_engineer, security_reviewer, qa_reviewer, product_growth.
Prima di delegare assegna obiettivo, contesto minimo, file modificabili, contratto/input, criterio di accettazione e output richiesto.
Un solo autore per file alla volta. I due HTML non sono ambiti indipendenti. Cambi di contratto precedono le implementazioni dipendenti. Usa worktree solo se l'ambiente e l'integrazione lo richiedono.
Il revisore restituisce difetti al coordinatore, non riscrive contemporaneamente gli stessi file. Non creare sotto-orchestratori o loop permanenti.
Per un difetto: riproduci → correggi → verifica. Dopo due tentativi senza nuova evidenza, cambia diagnosi o riporta il blocco preciso; non ripetere alla cieca. Prosegui autonomamente sul lavoro autorizzato.

## Vincoli di prodotto
- Mai archiviare/pubblicare segreti privati per alimentare un feed o materiale promozionale.
- Ogni affermazione di privacy deve corrispondere al percorso dati e alla configurazione distribuita.
- HTTPS/WSS non implica E2EE. Animazioni e badge non costituiscono prove crittografiche.
- Non promettere anonimato assoluto, wipe fisico istantaneo, assenza di bot o prestazioni non misurate.
- Presenta dati live solo se reali; mostra indisponibilità quando il server non è raggiungibile.
- Leggibilità, accesso da tastiera, gestione errori e chat mobile precedono shader e animazioni. Supporta movimento ridotto e uscita immediata.
- Non cambiare modello di retention, pubblico/età o politica di moderazione implicitamente durante un restyling.

## Prove e completamento
Distingui SEMPRE osservato, riprodotto, ipotesi e non verificato. Ogni risultato cita file/simbolo oppure comando, ambiente, esito e limite.
Non usare il numero dei test, controlli di presenza stringhe o microbenchmark CPU come autorizzazione al lancio.
Per bug funzionali/sicurezza serve una regressione che fallisca sul difetto e passi sulla correzione. Per documentazione/config basta validare sintassi, coerenza e riferimenti.
Le metriche di performance richiedono dispositivo, browser, scenario e misurazione reale; i target sono obiettivi.
Non diminuire le asserzioni per nascondere un bug. Se un requisito è cambiato, spiega perché un test va sostituito.

## Git e consegna
Branch circoscritto, commit descrittivi, PR con problema, modifica, prove e limiti. Rispetta modifiche altrui e permessi della sessione.
Un task di implementazione non autorizza da solo messaggi a terzi, merge, deployment, migrazioni o distruzione di dati cloud.
Non dichiarare "pronto al lancio" con blocchi aperti. Consegna cosa cambia, cosa è verificato e cosa serve ancora.

## Code Review Rules
Priorità a esposizione dei segreti, accesso ad altre stanze, origine dei socket, header proxy, persistenza non dichiarata, controlli RLS e dati in log/cache.
Poi lifecycle, timeout, replay/duplicazione, timer e doppio consenso, stato offline e utilizzo mobile.
Segnala prove mancanti con impatto concreto; evita revisioni estetiche infinite.

## Ambito locale concordato il 9 settembre 2026
La richiesta corrente autorizza configurazione agenti e milestone M0 in locale. Nessun push, PR remota, deploy, migrazione cloud o operazione sui dati reali. Le indicazioni generiche su PR nei documenti non ampliano questa autorizzazione. Preservare le modifiche locali preesistenti; il piano precedente è conservato in docs/history/PROJECT_BLUEPRINT.pre-M0.md solo come storico.
Le vecchie specifiche .agents sono alias documentali dei ruoli correnti: non applicare mandati su shader obbligatori, contatori sintetici, sicurezza percepita, stack estranei o orchestrazione ricorsiva.
