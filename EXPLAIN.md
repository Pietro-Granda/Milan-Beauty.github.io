# Spiegazione del codice (pratica e “quasi riga per riga”)

Qui trovi cosa fa ogni file e i punti importanti.

---

## index.html (home)
- **Head**: titolo, meta description, favicon, link al CSS.
- **Header**: logo + menu (desktop) + pulsante hamburger (mobile).
- **Hero**: banner con overlay scuro + badge “Eccellenza Brasiliana” + CTA.
- **Sezioni**:
  - `#chi-siamo`: testo + 3 card + immagine con badge “5+ anni”
  - `#servizi`: 6 card categoria (come nel React), con lista servizi
  - “Perché sceglierci”: 6 card
  - `#galleria`: griglia 8 immagini + modal (dialog)
  - `#contatti`: indirizzo/telefono/orari + box “Prenota subito”
- **Footer**: colonne + copyright
- **JS**: carica `js/main.js` (menu, scroll, galleria).

---

## booking.html (prenotazione)
- Header con “back” verso home.
- Introduzione (titolo + descrizione + pillole).
- **Success box** (`#successBox`): nascosto di default, appare dopo invio.
- **Form**:
  - Informazioni personali (nome/telefono obbligatori)
  - Servizio + data/orario (servizio obbligatorio)
  - Note
  - Info importanti
- **JS**: carica `js/booking.js` (validazione + invio a Apps Script).

---

## css/styles.css
### Parti principali
- `:root` contiene i colori (sfondo, oro, testo) → cambiando qui cambi tutto il tema.
- Stili base (reset).
- Layout (`.container`, `.grid-2`, `.cards`, `.service-grid`, ecc.).
- Componenti (header, bottoni, badge, card, gallery, modal, form, success).

### Cambiare palette (veloce)
- Oro: `--primary`
- Sfondo: `--bg`
- Card: `--card`
- Testo: `--text`

---

## js/main.js (menu + scroll + galleria)
### Cosa fa
1. **Menu mobile**
   - prende `#navToggle` e `#navMenu`
   - al click aggiunge/rimuove `body.nav-open`
2. **Scroll morbido**
   - se clicchi un elemento con `data-scroll="#id"` fa `scrollIntoView()`
3. **Galleria**
   - clic su una `.gallery-item` → apre il `<dialog>` e mostra l’immagine grande

Se vuoi, puoi disattivare la galleria eliminando la sezione “Modal” in `index.html` e il blocco “Galleria” in `main.js`.

---

## js/booking.js (invio form a Google Sheets)
### I 3 punti chiave
1. **Config**
   - devi sostituire `GOOGLE_SCRIPT_URL` con la tua URL `/exec` del Web App.
2. **Validazione**
   - controlla: `nome`, `telefono`, `servizio`
3. **Invio**
   - usa `fetch(..., { method:'POST', mode:'no-cors', headers, body: JSON })`
   - `no-cors` serve per evitare blocchi cross-origin.
   - anche se il browser non ti fa leggere la risposta, **Apps Script riceve e salva**.

### Dove arrivano i dati
Arrivano nella tua Google Sheet dentro il tab `Prenotazioni` (o il nome che imposti).

---

## apps-script.gs (Google Apps Script)
### Funzioni principali
- **doPost(e)**  
  Riceve i dati dal sito, valida e salva su Sheets.

- **saveBooking(data)**  
  Apre la Sheet, crea il tab se manca, aggiunge una riga con:
  `ID | Data/Ora | Nome | ... | Status`

- **sendDailyReport()**  
  Ogni giorno legge la sheet e manda una mail alla proprietaria con le prenotazioni la cui “Data Preferita” è oggi.

- **setupDailyTrigger()**  
  Crea il trigger automatico giornaliero.

### Cose da compilare
Nel CONFIG:
- `SHEET_ID`
- `OWNER_EMAIL`

---

## Nota importante (CORS)
Google Apps Script Web App spesso non permette una risposta leggibile dal browser per richieste cross-origin.
Per questo nel sito uso `mode: "no-cors"`: invia i dati senza blocchi.

Se vuoi una versione con **risposta leggibile** (success/error) si può fare, ma richiede una gestione diversa (es. endpoint intermedio o impostazioni specifiche).
