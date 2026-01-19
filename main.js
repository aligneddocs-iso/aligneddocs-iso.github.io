(() => {
  const steps = document.querySelectorAll(".step");
  const langButtons = document.querySelectorAll("[data-lang-btn]");
  const langBlocks = document.querySelectorAll("[data-lang]");
  const fields = document.querySelectorAll("[data-field]");
  const finishBtn = document.getElementById("finish");

  let currentStep = 0;
  let lang = localStorage.getItem("lang") || "de";
  let data = JSON.parse(localStorage.getItem("iso_data")) || {};

  function showStep(index) {
    steps.forEach((s, i) => s.classList.toggle("active", i === index));
    currentStep = index;
  }

  function saveData() {
    fields.forEach(f => data[f.dataset.field] = f.value);
    localStorage.setItem("iso_data", JSON.stringify(data));
  }

  function loadData() {
    fields.forEach(f => {
      if (data[f.dataset.field]) f.value = data[f.dataset.field];
    });
  }

  document.addEventListener("click", e => {
    if (e.target.classList.contains("next")) {
      saveData();
      showStep(currentStep + 1);
      loadData();
    }

    if (e.target.classList.contains("back")) {
      saveData();
      showStep(currentStep - 1);
      loadData();
    }
  });

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

  document.getElementById("confirm1").addEventListener("change", checkConfirm);
  document.getElementById("confirm2").addEventListener("change", checkConfirm);

  function checkConfirm() {
    finishBtn.disabled = !(
      document.getElementById("confirm1").checked &&
      document.getElementById("confirm2").checked
    );
  }

  updateLang();
  loadData();
})();
