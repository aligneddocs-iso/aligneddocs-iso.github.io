(function () {
  const DEFAULT_LANG = "de";

  function setLanguage(lang) {
    // Sprache am <html>-Tag setzen
    document.documentElement.lang = lang;

    // Alle Sprach-Elemente durchgehen
    document.querySelectorAll("[data-lang]").forEach(el => {
      const elLang = el.getAttribute("data-lang");
      if (elLang === lang) {
        el.hidden = false;
      } else {
        el.hidden = true;
      }
    });

    // Aktiven Button markieren
    document.querySelectorAll("[data-setlang]").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.setlang === lang);
    });

    // Sprache speichern
    localStorage.setItem("lang", lang);
  }

  // Initiale Sprache
  const savedLang = localStorage.getItem("lang") || DEFAULT_LANG;
  setLanguage(savedLang);

  // Klick-Handler für Sprachbuttons
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-setlang]");
    if (!btn) return;
    const lang = btn.dataset.setlang;
    setLanguage(lang);
  });
})();
