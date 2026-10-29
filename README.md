 <div align="center">

HrsBot.

Un bot WhatsApp. JavaScript. Una struttura modulare.

Sito web · Repository

</div>

⸻

01 — Introduzione

HrsBot è un bot WhatsApp scritto in JavaScript, basato sulla libreria @itsliaaa/baileys.

Il progetto utilizza un sistema a plugin per organizzare le funzionalità in moduli distinti, mantenendo il codice estendibile e più semplice da gestire.

HrsBot è attualmente in beta. Il codice è in evoluzione e potrebbero verificarsi bug, modifiche incompatibili o interruzioni del servizio.

02 — Caratteristiche

* Architettura modulare — funzionalità organizzate in plugin separati.
* Caricamento dinamico — i plugin vengono individuati nelle sottocartelle dedicate.
* Ricaricamento durante lo sviluppo — le modifiche ai plugin JavaScript possono essere rilevate senza riavviare manualmente il processo.
* Collegamento flessibile — autenticazione tramite QR code oppure codice di collegamento.
* Configurazione locale — le impostazioni personali sono separate dal codice pubblico.

Le funzionalità effettivamente disponibili dipendono dalla versione installata e dai plugin presenti.

03 — Requisiti

Prima di iniziare, assicurati di avere:

Requisito	Descrizione
Node.js	Versione 20 o superiore
npm	Incluso normalmente con Node.js
Git	Per clonare il repository
WhatsApp	Un account che sei autorizzato a collegare

* Scarica Node.js
* Installa Git

04 — Installazione

Clona il repository e installa le dipendenze:

git clone https://github.com/invulnerabile/hrsbot.git
cd hrsbot
npm install

Crea la configurazione locale partendo dal modello:

cp config.js.example config.js

Su Windows, copia config.js.example e rinomina la copia in config.js.

05 — Configurazione

Apri config.js e imposta il proprietario del bot e il prefisso dei comandi.

Esempio:

global.owner = [
  ['39XXXXXXXXXX', 'owner', true]
];
global.prefix = ['.'];

Sostituisci 39XXXXXXXXXX con il numero corretto, comprensivo del prefisso internazionale e senza +, spazi o simboli.

Il prefisso dell’esempio è .; puoi modificarlo in base alla configurazione del progetto.

Importante: non pubblicare il tuo config.js e non inserire credenziali personali nel repository. Il file config.js.example serve come modello, non come configurazione definitiva.

06 — Collegamento a WhatsApp

Avvia il bot dalla cartella del progetto:

npm start

Al primo avvio, se non esiste già una sessione salvata, scegli il metodo di collegamento nel terminale.

QR code

1. Seleziona 1.
2. Apri WhatsApp.
3. Vai su Dispositivi collegati → Collega un dispositivo.
4. Scansiona il QR code mostrato dal bot.

Codice di collegamento

1. Seleziona 2.
2. Inserisci il numero con prefisso internazionale.
3. Segui le istruzioni mostrate nel terminale e completa il collegamento da WhatsApp.

Dopo l’autenticazione, i dati della sessione vengono conservati localmente. Non condividere mai QR code, codici di collegamento o file di autenticazione.

Per interrompere il processo, usa Ctrl + C nel terminale.

07 — Struttura del progetto

La struttura principale è organizzata attorno al processo di avvio, alla gestione dei messaggi e ai plugin.

hrsbot/
├── lib/                 # Moduli di supporto
├── plugins/             # Funzionalità modulari
├── config.js.example    # Modello di configurazione
├── handler.js           # Gestione dei messaggi
├── hrs.js               # Connessione e logica del bot
├── index.js              # Avvio del processo
├── package.json          # Dipendenze e script
└── README.md

Flusso generale

flowchart TD
    A["WhatsApp"] --> B["HrsBot"]
    B --> C["Gestione messaggi"]
    C --> D["Sistema a plugin"]
    B --> E["Configurazione locale"]
    B --> F["Sessione"]
    C --> G["Database"]
    style A fill:#F4F3F0,stroke:#747FA8,color:#303342
    style B fill:#747FA8,stroke:#596487,color:#F4F3F0
    style C fill:#F4F3F0,stroke:#747FA8,color:#303342
    style D fill:#E8EAF3,stroke:#747FA8,color:#303342
    style E fill:#E8EAF3,stroke:#747FA8,color:#303342
    style F fill:#E8EAF3,stroke:#747FA8,color:#303342
    style G fill:#E8EAF3,stroke:#747FA8,color:#303342

I plugin JavaScript vengono caricati ricorsivamente dalle sottocartelle di plugins/. La struttura può cambiare durante lo sviluppo.

08 — Dati locali

Durante l’esecuzione, il bot utilizza file e cartelle locali per conservare le impostazioni e lo stato operativo.

Percorso	Utilizzo
config.js	Configurazione personale
session/	Dati di autenticazione WhatsApp
database.json	Dati persistenti del bot
temp/ e tmp/	File temporanei

Questi file non sono necessari per documentare il codice sorgente e devono rimanere esclusi dalle pubblicazioni quando contengono dati personali o di sessione.

09 — Sicurezza

* Mantieni privati config.js e la cartella session/.
* Non condividere codici QR, codici di collegamento o credenziali.
* Controlla i plugin prima di eseguirli.
* Utilizza soltanto account e gruppi per i quali disponi delle necessarie autorizzazioni.
* Considera che una libreria non ufficiale può smettere di funzionare quando WhatsApp modifica i propri sistemi.

10 — Stato del progetto

<details>
<summary>Beta · Informazioni sullo sviluppo</summary>

HrsBot è un progetto in sviluppo. Le funzionalità, la configurazione e il comportamento dei plugin possono cambiare senza preavviso.

Non è consigliato considerarlo un software stabile o pronto per ambienti di produzione.

</details>

Licenza

Al momento non è indicata una licenza che autorizzi il riutilizzo del codice. La disponibilità pubblica del repository non concede automaticamente il diritto di copiare, modificare o ridistribuire il progetto.

⸻

<div align="center">

HrsBot · JavaScript · WhatsApp

Un progetto in evoluzione.

</div>
