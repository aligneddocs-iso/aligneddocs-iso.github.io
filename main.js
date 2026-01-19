/* 
  AlignedDocs – main.js
  Zweck:
  - Sprachumschaltung DE / EN
  - Initial nur eine Sprache sichtbar
  - Aktiven Navigationspunkt markieren
  - Minimal, stabil, frameworkfrei
*/

(function () {

  /* ===============================
     SPRACHE
     =============================== */

  // Standard-Sprache bestimmen
  const DEFAULT_LANG = (
    (navigator.language || navigator.userLanguage || "de")
      .toLowerCase()
      .startsWith("de")
  ) ? "de" : "en";

  // Sprache setzen
  function setLanguage(lang) {
    document.documentElement.setAttribute("lang", lang);
    localStorage.setItem("ad_lang", lang);

    // Texte ein-/ausblenden
    document.querySelectorAll("[data-lang]").forEach(el => {
      const targetLang = el.getAttribute("data-lang");
      el.style.display = (targetLang === lang) ? "block" : "none";
    });

    // Sprach-Buttons aktiv markieren
    document.querySelectorAll("[data-setlang]").forEach(btn => {
      const btnLang = btn.getAttribute("data-setlang");
      btn.classList.toggle("is-active", btnLang === lang);
    });
  }

  // Initiale Sprache setzen
  const savedLang = localStorage.getItem("ad_lang");
  setLanguage(savedLang || DEFAULT_LANG);

  // Klick auf Sprach-Buttons
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-setlang]");
    if (!btn) return;

    e.preventDefault();
    const lang = btn.getAttribute("data-setlang");
    setLanguage(lang);
  });


  /* ===============================
     AKTIVE NAVIGATION
     =============================== */

  const currentPage = (
    window.location.pathname.split("/").pop() || "index.html"
  ).toLowerCase();

  document.querySelectorAll(".nav a").forEach(link => {
    const href = (link.getAttribute("href") || "").toLowerCase();
    if (href === currentPage) {
      link.classList.add("active");
    }
  });

})();

