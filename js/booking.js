// Milan Beauty - booking.js
// Invia i dati del modulo a Google Sheets tramite Google Apps Script (Web App)

(() => {
  // ===========================================
  // 1) CONFIG: incolla qui la URL /exec del Web App Apps Script
  // ===========================================
  const GOOGLE_SCRIPT_URL = "https://calendar.google.com/calendar/u/0?cid=MzY0OGYxMTJjZWI4NjEwYjBiZWUzMGNmYjI2MWM1NDE0NmMyMDM1MTBiYzg2YmFlNTk1MDIwNDRiMDhjY2Y3OUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t";

  // ===========================================
  // 2) Riferimenti DOM
  // ===========================================
  const form = document.getElementById("bookingForm");
  const msg = document.getElementById("formMsg");
  const btn = document.getElementById("submitBtn");
  const successBox = document.getElementById("successBox");

  if (!(form instanceof HTMLFormElement)) return;

  // Imposta min-date = oggi (se presente l'input)
  const dateInput = form.querySelector('input[name="data_preferita"]');
  if (dateInput instanceof HTMLInputElement && dateInput.type === "date") {
    const today = new Date();
    const yyyy = String(today.getFullYear());
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }

  // ===========================================
  // 3) Helpers
  // ===========================================
  function setMessage(text) {
    if (msg) msg.textContent = text || "";
  }

  function setBusy(isBusy) {
    if (btn instanceof HTMLButtonElement) {
      btn.disabled = isBusy;
      btn.textContent = isBusy ? "Invio in corso..." : "Invia Richiesta di Prenotazione";
    }
  }

  function clearErrors() {
    form.querySelectorAll("[data-error-for]").forEach((el) => {
      if (el instanceof HTMLElement) el.textContent = "";
    });
  }

  function setError(fieldName, text) {
    const el = form.querySelector(`[data-error-for="${fieldName}"]`);
    if (el instanceof HTMLElement) el.textContent = text;
  }

  function getField(name) {
    const el = form.elements.namedItem(name);
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
      return el.value.trim();
    }
    return "";
  }

  function showSuccess() {
    // Nasconde form e mostra box di successo (stile come nel sito originale)
    form.hidden = true;
    if (successBox instanceof HTMLElement) successBox.hidden = false;

    // Scrolla verso inizio per mostrare subito la conferma
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ===========================================
  // 4) Submit
  // ===========================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    setMessage("");

    // Validazione base (come nel progetto React originale)
    const nome = getField("nome");
    const telefono = getField("telefono");
    const servizio = getField("servizio");

    let ok = true;
    if (!nome) { setError("nome", "Inserisci il nome."); ok = false; }
    if (!telefono) { setError("telefono", "Inserisci un numero di telefono."); ok = false; }
    if (!servizio) { setError("servizio", "Seleziona un servizio."); ok = false; }

    if (!ok) {
      setMessage("Compila tutti i campi obbligatori.");
      return;
    }

    // Se l'URL non è configurata, blocchiamo per evitare invii “fantasma”
    if (GOOGLE_SCRIPT_URL.includes("YOUR_SCRIPT_ID")) {
      setMessage("⚠️ Configura la URL del Google Apps Script in js/booking.js (GOOGLE_SCRIPT_URL).");
      return;
    }

    const payload = {
      nome,
      cognome: getField("cognome"),
      telefono,
      email: getField("email"),
      servizio,
      data_preferita: getField("data_preferita"),
      orario_preferito: getField("orario_preferito"),
      note: getField("note"),
      timestamp: new Date().toLocaleString("it-IT"),
      status: "Nuovo"
    };

    try {
      setBusy(true);
      setMessage("Invio in corso…");

      // Nota CORS: usiamo no-cors per evitare blocchi cross-origin.
      // L'app Script salva i dati anche se non possiamo leggere la response.
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      // Feedback UI
      setMessage("");
      showSuccess();
    } catch (err) {
      console.error(err);
      setMessage("Errore durante l'invio. Riprova o chiamaci direttamente.");
    } finally {
      setBusy(false);
    }
  });
})();
