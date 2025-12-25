/**
 * Milan Beauty - Google Apps Script (Google Sheets + Email giornaliera)
 *
 * Cosa fa:
 * 1) Riceve i dati del form dal sito (POST) e li salva in Google Sheets
 * 2) (Opzionale) Manda email di conferma al cliente se ha inserito email
 * 3) Manda ogni giorno una email alla proprietaria con gli appuntamenti del giorno
 *
 * Timezone: Europe/Rome
 */

/* ==========================
   CONFIGURAZIONE
   ========================== */
const CONFIG = {
  SHEET_ID: "INSERISCI_ID_SHEET",      // ID della Google Sheet (dalla URL: .../d/<ID>/edit)
  SHEET_NAME: "Prenotazioni",          // Nome tab
  OWNER_EMAIL: "INSERISCI_EMAIL_OWNER",// Email che riceve il report giornaliero
  TIMEZONE: "Europe/Rome",
  DAILY_HOUR: 8                         // Orario invio report (8 = 08:00)
};

/* ==========================
   WEB APP ENDPOINTS
   ========================== */
function doGet() {
  return ContentService
    .createTextOutput("Milan Beauty booking endpoint OK")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const data = parseRequestData(e);

    // Validazione minima
    if (!data.nome || !data.telefono || !data.servizio) {
      return json({ success: false, message: "Campi obbligatori mancanti (nome, telefono, servizio)." });
    }

    const saved = saveBooking(data);

    // Email conferma cliente (opzionale)
    if (data.email) {
      sendClientConfirmationEmail(data);
    }

    return json({ success: true, id: saved.id, message: "Prenotazione salvata." });
  } catch (err) {
    console.error(err);
    return json({ success: false, message: "Errore interno: " + err.message });
  }
}

/* ==========================
   PARSING INPUT
   Accetta:
   - JSON (Content-Type: application/json)
   - Form URL Encoded (application/x-www-form-urlencoded)
   ========================== */
function parseRequestData(e) {
  if (!e || !e.postData || !e.postData.contents) return {};

  const raw = e.postData.contents;

  // 1) Prova JSON
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") return obj;
  } catch (_) {}

  // 2) Prova URL encoded (nome=...&telefono=...)
  const out = {};
  raw.split("&").forEach(pair => {
    const [k, v] = pair.split("=");
    if (!k) return;
    out[decodeURIComponent(k)] = decodeURIComponent((v || "").replace(/\+/g, " "));
  });
  return out;
}

/* ==========================
   SALVATAGGIO SU SHEET
   Colonne:
   ID | Data/Ora | Nome | Cognome | Telefono | Email | Servizio |
   Data Preferita | Orario Preferito | Note | Status
   ========================== */
function saveBooking(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    initHeader(sheet);
  }

  // Se header non c'è (sheet vuota) lo crea
  if (sheet.getLastRow() === 0) initHeader(sheet);

  const id = "MB" + Date.now();
  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");

  const row = [
    id,
    now,
    data.nome || "",
    data.cognome || "",
    data.telefono || "",
    data.email || "",
    data.servizio || "",
    data.data_preferita || "",
    data.orario_preferito || "",
    data.note || "",
    data.status || "Nuovo"
  ];

  sheet.appendRow(row);

  return { id };
}

function initHeader(sheet) {
  const headers = [
    "ID", "Data/Ora", "Nome", "Cognome", "Telefono", "Email",
    "Servizio", "Data Preferita", "Orario Preferito", "Note", "Status"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#C9A24A")
    .setFontColor("#0B0B0C")
    .setFontWeight("bold");
  sheet.setFrozenRows(1);
}

/* ==========================
   EMAIL CLIENTE (opzionale)
   ========================== */
function sendClientConfirmationEmail(data) {
  try {
    const subject = "✨ Milan Beauty - Richiesta di Prenotazione Ricevuta";
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#0B0B0C;color:#F7F4EF;padding:22px">
        <h2 style="margin:0;color:#C9A24A">Milan Beauty</h2>
        <p style="margin:6px 0 18px;color:#C9A24A">Eccellenza Brasiliana</p>

        <div style="background:#15151A;border:1px solid rgba(247,244,239,0.12);border-radius:14px;padding:16px">
          <p style="margin:0 0 10px">Ciao <strong>${escapeHtml(data.nome)}</strong>!</p>
          <p style="margin:0">Abbiamo ricevuto la tua richiesta e ti contatteremo entro 24 ore per confermare l'appuntamento.</p>
        </div>

        <div style="margin-top:16px;background:#15151A;border:1px solid rgba(247,244,239,0.12);border-radius:14px;padding:16px">
          <h3 style="margin:0 0 10px;color:#C9A24A">Dettagli</h3>
          <p style="margin:6px 0"><strong>Servizio:</strong> ${escapeHtml(data.servizio || "")}</p>
          ${data.data_preferita ? `<p style="margin:6px 0"><strong>Data preferita:</strong> ${escapeHtml(data.data_preferita)}</p>` : ""}
          ${data.orario_preferito ? `<p style="margin:6px 0"><strong>Orario preferito:</strong> ${escapeHtml(data.orario_preferito)}</p>` : ""}
          <p style="margin:6px 0"><strong>Telefono:</strong> ${escapeHtml(data.telefono || "")}</p>
        </div>

        <p style="margin-top:18px;color:#C9A24A">
          Via Alessandro Astesani, 45 - 20161 Milano • +39 375 636 5970
        </p>
      </div>
    `;

    MailApp.sendEmail({
      to: data.email,
      subject,
      htmlBody: html
    });
  } catch (err) {
    console.error("Errore invio email cliente:", err);
  }
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ==========================
   REPORT GIORNALIERO
   ========================== */
function sendDailyReport() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return;

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return; // solo header

  // Oggi in formato yyyy-MM-dd (con timezone Europa/Roma)
  const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");

  const rows = values.slice(1); // senza header
  const todayBookings = rows
    .map(r => ({
      id: r[0], createdAt: r[1], nome: r[2], cognome: r[3], telefono: r[4], email: r[5],
      servizio: r[6], dataPreferita: r[7], orarioPreferito: r[8], note: r[9], status: r[10]
    }))
    .filter(b => String(b.dataPreferita || "").includes(today))
    .sort((a, b) => String(a.orarioPreferito || "").localeCompare(String(b.orarioPreferito || "")));

  // Se non c'è nulla oggi, mando comunque un piccolo riepilogo (puoi cambiare)
  const subject = `📅 Milan Beauty - Lavori di oggi (${today})`;

  let html = `
    <div style="font-family:Arial,sans-serif;max-width:860px;margin:0 auto;background:#0B0B0C;color:#F7F4EF;padding:22px">
      <h2 style="margin:0;color:#C9A24A">Milan Beauty</h2>
      <p style="margin:6px 0 18px;color:#C9A24A">Report giornaliero - ${today}</p>
  `;

  if (todayBookings.length === 0) {
    html += `
      <div style="background:#15151A;border:1px solid rgba(247,244,239,0.12);border-radius:14px;padding:16px">
        <p style="margin:0;color:#C9A24A"><strong>Nessun appuntamento con data preferita oggi.</strong></p>
      </div>
    `;
  } else {
    html += `
      <div style="background:#15151A;border:1px solid rgba(247,244,239,0.12);border-radius:14px;padding:16px">
        <h3 style="margin:0 0 12px;color:#C9A24A">Appuntamenti di oggi (${todayBookings.length})</h3>
    `;

    todayBookings.forEach(b => {
      html += `
        <div style="background:#0B0B0C;border-left:4px solid #C9A24A;border-radius:12px;padding:12px;margin-bottom:12px">
          <p style="margin:0 0 6px;color:#C9A24A"><strong>${escapeHtml(b.nome)} ${escapeHtml(b.cognome || "")}</strong></p>
          <p style="margin:4px 0"><strong>Servizio:</strong> ${escapeHtml(b.servizio)}</p>
          <p style="margin:4px 0"><strong>Orario:</strong> ${escapeHtml(b.orarioPreferito || "Da definire")}</p>
          <p style="margin:4px 0"><strong>Telefono:</strong> ${escapeHtml(b.telefono)}</p>
          ${b.note ? `<p style="margin:4px 0"><strong>Note:</strong> ${escapeHtml(b.note)}</p>` : ""}
          <p style="margin:4px 0"><strong>Status:</strong> <span style="color:#C9A24A">${escapeHtml(b.status || "")}</span></p>
        </div>
      `;
    });

    html += `</div>`;
  }

  html += `
      <p style="margin-top:18px;font-size:12px;color:rgba(247,244,239,0.65)">
        Questo messaggio è inviato automaticamente dal sistema di prenotazione.
      </p>
    </div>
  `;

  MailApp.sendEmail({
    to: CONFIG.OWNER_EMAIL,
    subject,
    htmlBody: html
  });
}

/* ==========================
   TRIGGER (una tantum)
   Esegui questa funzione una volta per creare il trigger giornaliero.
   ========================== */
function setupDailyTrigger() {
  // Rimuove trigger esistenti della stessa funzione
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "sendDailyReport") ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger("sendDailyReport")
    .timeBased()
    .everyDays(1)
    .atHour(CONFIG.DAILY_HOUR)
    .create();
}

/* ==========================
   Utility JSON response
   ========================== */
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
