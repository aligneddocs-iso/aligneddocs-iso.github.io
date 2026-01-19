(function () {
  const DEFAULT_LANG = "de";

  /* =========================
     Sprache (DE / EN)
     ========================= */
  function setLanguage(lang) {
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-lang]").forEach(el => {
      el.hidden = el.getAttribute("data-lang") !== lang;
    });

    document.querySelectorAll("[data-setlang]").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.setlang === lang);
    });

    localStorage.setItem("lang", lang);
  }

  const savedLang = localStorage.getItem("lang") || DEFAULT_LANG;
  setLanguage(savedLang);

  document.addEventListener("click", function (e) {
    const langBtn = e.target.closest("[data-setlang]");
    if (langBtn) {
      setLanguage(langBtn.dataset.setlang);
      return;
    }

    /* =========================
       FAQ / Accordion
       ========================= */
    const accBtn = e.target.closest(".accordion-item");
    if (!accBtn) return;

    const content = accBtn.nextElementSibling;
    const icon = accBtn.querySelector(".accordion-icon");

    const isOpen = content.style.display === "block";

    // Alle schließen (optional, sorgt für Ordnung)
    document.querySelectorAll(".accordion-content").forEach(c => {
      c.style.display = "none";
    });
    document.querySelectorAll(".accordion-icon").forEach(i => {
      i.textContent = "+";
    });

    // Aktuelles öffnen
    if (!isOpen) {
      content.style.display = "block";
      icon.textContent = "–";
    }
  });
})();
