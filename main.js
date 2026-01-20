/* ==========================================
   main.js – GLOBAL, ABER SICHER
   ========================================== */

(() => {

  /* ---------- NAV / LANGUAGE (nur wenn vorhanden) ---------- */
  const langButtons = document.querySelectorAll("[data-lang-btn]");
  const langBlocks  = document.querySelectorAll("[data-lang]");

  if (langButtons.length && langBlocks.length) {
    let lang = localStorage.getItem("lang") || "de";

    function updateLang() {
      langBlocks.forEach(el => {
        el.style.display = el.dataset.lang === lang ? "block" : "none";
      });

      langButtons.forEach(btn =>
        btn.classList.toggle("is-active", btn.dataset.langBtn === lang)
      );

      localStorage.setItem("lang", lang);
    }

    langButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        lang = btn.dataset.langBtn;
        updateLang();
      });
    });

    updateLang();
  }

  /* ---------- MULTI-STEP FORM (nur wenn vorhanden) ---------- */
  const steps = document.querySelectorAll(".step");
  if (steps.length) {
    let currentStep = 0;

    function showStep(index) {
      steps.forEach((s, i) =>
        s.classList.toggle("active", i === index)
      );
      currentStep = index;
    }

    document.addEventListener("click", e => {
      if (e.target.classList.contains("next")) {
        showStep(currentStep + 1);
      }
      if (e.target.classList.contains("back")) {
        showStep(currentStep - 1);
      }
    });
  }

  /* ---------- CONFIRM CHECK (nur wenn vorhanden) ---------- */
  const finishBtn = document.getElementById("finish");
  const confirm1 = document.getElementById("confirm1");
  const confirm2 = document.getElementById("confirm2");

  if (finishBtn && confirm1 && confirm2) {
    function checkConfirm() {
      finishBtn.disabled = !(confirm1.checked && confirm2.checked);
    }

    confirm1.addEventListener("change", checkConfirm);
    confirm2.addEventListener("change", checkConfirm);
  }

})();
