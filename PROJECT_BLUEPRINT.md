# STREETALK — percorso verso il lancio
Stato al 9 settembre 2026: lancio bloccato. Audit su main 438ec13.
Questa revisione prepara coordinamento e prove; non modifica il servizio pubblico.
Leggere docs/LAUNCH_AUDIT.md prima di pianificare un restyling.

## M0 — verità del prodotto e confini dei dati
Owner: coordinatore; implementazione realtime_engineer; revisione security_reviewer.
- Eliminare l'archiviazione/pubblicazione automatica dal percorso privato; verificare API dirette e RLS.
- Correggere le promesse E2EE/anonimato/wipe, i contatori e i dati mostrati senza connessione.
- Chiudere l'override arbitrario dell'endpoint realtime via URL.
- Validare mood con allowlist; definire origine ammessa e proxy fidati.
Accettazione: regressioni locali su input e destinazioni; mappa dei dati documentata; nessuna promessa più forte dell'implementazione.
La configurazione cloud e le eventuali righe già presenti richiedono verifica separata; non cancellare dati alla cieca.

## M1 — chat affidabile
Owner: realtime_engineer, poi qa_reviewer.
Testare due client e un terzo escluso: scambio segreti, isolamento, ordine/duplicati, timeout, doppio consenso, scadenza, skip, refresh, caduta rete e riaccesso.
Definire gli stati e il contratto degli eventi prima di modificare la UI.
Verificare rate limit per evento, abuso delle segnalazioni, utenti su rete condivisa e limiti di memoria/coda.
Accettazione: regressioni comportamentali, chiusura risorse e nessuno stato fantasma nei casi provati. Nessuna promessa di zero leak assoluto.

## M2 — ingresso e chat mobile
Owner: product_growth specifica; frontend_engineer implementa; QA verifica.
- Home: proposta breve, form subito evidente, tre passaggi, privacy concreta, FAQ essenziali.
- Direzione: identità street nero/arancio, un effetto distintivo sullo scambio; tipografia comoda per chat e testi.
- Tutti gli stati: coda vuota, offline, server in avvio, retry annullabile, match, errore, fine sessione.
- Focus, tastiera, zoom, viewport piccole, tastiera mobile, reduced motion, audio controllabile, fallback WebGL.
- Consolidare il CSS Tailwind compilato: attualmente convivono due runtime CDN.
Accettazione: verifica browser su flussi reali con dati sintetici; misurazioni su dispositivi/scenari dichiarati.

## M3 — operatività e beta
Owner: coordinatore, security_reviewer e product_growth.
- Definire pubblico/età, regole della community, gestione segnalazioni e tempi di risposta.
- Rendere comprensibili privacy, termini e contatto responsabile; verificarne contenuti sul trattamento effettivo.
- Misurare backend raggiungibile, avvio a freddo, errori, code e carico atteso su staging.
- Definire rollback e rilevazione guasti con raccolta minima di dati.
- Beta in fasce orarie condivise; misurare attesa e tasso di conversazioni avviate senza fingere utenti.
Accettazione: criteri e responsabilità espliciti, nessun blocco critico aperto; prova di due partecipanti su rete reale in ambiente dedicato.

## Ciclo prodotto — GROWTH-RALPH-LOOP (AUTONOMOUS)
Nome storico mantenuto per continuità: un ciclo è un task finito con evidenze, non un demone.
- [1. MARKET INTEL]: capire pubblico, esigenze e contemporaneità; citare fonti.
- [2. SYNTHESIS]: scegliere un'ipotesi UX e la metrica con cui valutarla.
- [3. ASSET CRAFT]: copy o mockup, esempi sintetici chiaramente etichettati.
- [4. APP BRIDGE]: integrare la modifica dopo accordo sul contratto e proprietà dei file.
- [5. ANALYTICS]: distinguere campione reale, dato mancante e obiettivo; non ripetere senza nuove informazioni.

## Decisioni di prodotto ancora aperte
Fascia d'età e gestione accesso; responsabilità moderazione; retention dei report; esistenza futura di un feed separato e volontario; volumi e budget hosting.
L'esperienza privata dichiarata nella home rimane il vincolo di partenza. Queste decisioni non devono essere prese implicitamente dagli effetti grafici.
