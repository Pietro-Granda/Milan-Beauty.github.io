// Milan Beauty - main.js
// Gestisce: menu mobile, scroll morbido, galleria con modal (index.html)

(() => {
  // ------------------------------
  // Menu mobile
  // ------------------------------
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Chiude il menu quando clicchi un link (su mobile)
    navMenu.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.classList.contains("nav-link")) return;

      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  }

  // ------------------------------
  // Scroll morbido (button con data-scroll="#id")
  // ------------------------------
  document.addEventListener("click", (e) => {
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;

    const selector = el.getAttribute("data-scroll");
    if (!selector) return;

    const target = document.querySelector(selector);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ------------------------------
  // Galleria: modal preview (index.html)
  // ------------------------------
  const modal = document.getElementById("imgModal");
  const modalImg = document.getElementById("modalImg");
  const modalClose = document.getElementById("modalClose");
  const gallery = document.getElementById("gallery");

  const isDialogSupported = modal instanceof HTMLDialogElement;

  function openModal(src) {
    if (!isDialogSupported || !(modalImg instanceof HTMLImageElement)) return;
    modalImg.src = src;
    modal.showModal();
  }

  function closeModal() {
    if (!isDialogSupported) return;
    modal.close();
  }

  if (gallery) {
    gallery.addEventListener("click", (e) => {
      const btn = (e.target instanceof Element) ? e.target.closest(".gallery-item") : null;
      if (!(btn instanceof HTMLButtonElement)) return;

      const src = btn.getAttribute("data-img");
      if (!src) return;

      openModal(src);
    });
  }

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  if (isDialogSupported) {
    // Chiudi cliccando sul backdrop
    modal.addEventListener("click", (e) => {
      const rect = modal.getBoundingClientRect();
      const clickedInside =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!clickedInside) closeModal();
    });

    // ESC chiude automaticamente, ma aggiungiamo pulizia dell'immagine
    modal.addEventListener("close", () => {
      if (modalImg instanceof HTMLImageElement) modalImg.src = "";
    });
  }
})();
