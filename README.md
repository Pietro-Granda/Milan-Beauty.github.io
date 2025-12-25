# Milan Beauty — Versione HTML/CSS/JS (statica)

Questa cartella contiene una versione **senza React/Vite/Tailwind** del sito, rifatta in:
- **HTML** (pagine: `index.html`, `booking.html`)
- **CSS** (tema dark premium + oro in `css/styles.css`)
- **JS** (interazioni in `js/main.js` e invio form in `js/booking.js`)
- **Google Apps Script** (`apps-script.gs`) per salvare prenotazioni su **Google Sheets** + **email giornaliera**.

---

## 1) Come vedere il sito
Puoi:
- aprire `index.html` direttamente (funziona già), oppure
- caricare la cartella su un hosting statico (Netlify, Vercel static, GitHub Pages, ecc.).

> Nota: alcune funzioni del form possono essere bloccate se apri i file in locale con `file://` su alcuni browser.
> Se vedi problemi, usa un mini server (es. VS Code “Live Server”).

---

## 2) Collegare il form a Google Sheets (salvataggio automatico)
### A) Crea il foglio Google Sheets
1. Crea una nuova Google Sheet
2. Copia l'ID dalla URL: `https://docs.google.com/spreadsheets/d/<ID>/edit`

### B) Crea e pubblica Google Apps Script
1. Vai su `script.google.com`
2. Nuovo progetto
3. Incolla il contenuto di `apps-script.gs`
4. Compila `CONFIG`:
   - `SHEET_ID`
   - `OWNER_EMAIL`
5. **Deploy** → “Nuova implementazione” → **App Web**
   - Esegui come: **Me**
   - Accesso: **Chiunque**
6. Copia la URL dell’App Web (finisce con `/exec`)

### C) Incolla la URL nel sito
1. Apri `js/booking.js`
2. Sostituisci:
   `const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";`
   con la URL reale.

---

## 3) Email automatica giornaliera con i lavori del giorno
1. In Apps Script, esegui una volta la funzione:
   `setupDailyTrigger()`
2. Il trigger invierà ogni giorno il report alla mail `OWNER_EMAIL` all’ora `DAILY_HOUR`.

---

## 4) Test rapido
- Compila il form in `booking.html`
- Controlla che nella Sheet compaia una nuova riga
- Se hai inserito un’email, arriva anche la conferma (opzionale)
- Il giorno dopo, arriva l’email report.

---

## Personalizzazioni veloci
- Logo / banner: `assets/images/`
- Colori: `css/styles.css` (variabili `--primary`, `--bg`, ecc.)
- Social link: cerca “Instagram/Facebook” in `index.html` e inserisci i link veri.
