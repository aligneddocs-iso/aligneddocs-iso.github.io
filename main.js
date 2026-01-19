(function () {
  const steps = document.querySelectorAll(".step");
  let current = 0;

  const data = JSON.parse(localStorage.getItem("iso_form")) || {};

  function showStep(index) {
    steps.forEach((s, i) => s.classList.toggle("active", i === index));
    current = index;
  }

  function saveInputs() {
    document.querySelectorAll("input, textarea").forEach(el => {
      if (el.name) data[el.name] = el.value;
    });
    localStorage.setItem("iso_form", JSON.stringify(data));
  }

  function loadInputs() {
    document.querySelectorAll("input, textarea").forEach(el => {
      if (el.name && data[el.name]) el.value = data[el.name];
    });
  }

  document.addEventListener("click", e => {
    if (e.target.classList.contains("next")) {
      saveInputs();
      showStep(current + 1);
      loadInputs();
    }

    if (e.target.classList.contains("back")) {
      saveInputs();
      showStep(current - 1);
      loadInputs();
    }
  });

  document.getElementById("confirm_truth")?.addEventListener("change", checkConfirm);
  document.getElementById("confirm_living")?.addEventListener("change", checkConfirm);

  function checkConfirm() {
    const ok =
      document.getElementById("confirm_truth").checked &&
      document.getElementById("confirm_living").checked;
    document.getElementById("finish").disabled = !ok;
  }

  loadInputs();
})();
