(function(){

  /* Sprache */
  function setLanguage(lang){
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
    document.querySelectorAll("[data-lang]").forEach(el=>{
      el.style.display = el.getAttribute("data-lang") === lang ? "" : "none";
    });
    document.querySelectorAll("[data-setlang]").forEach(btn=>{
      btn.classList.toggle("is-active", btn.dataset.setlang === lang);
    });
  }

  const saved = localStorage.getItem("lang") || "de";
  setLanguage(saved);

  document.addEventListener("click", e=>{
    const btn = e.target.closest("[data-setlang]");
    if(btn) setLanguage(btn.dataset.setlang);
  });

  /* Accordion */
  document.querySelectorAll(".accordion-item").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const content = btn.nextElementSibling;
      const icon = btn.querySelector(".accordion-icon");
      const open = content.style.display === "block";
      content.style.display = open ? "none" : "block";
      icon.textContent = open ? "+" : "–";
    });
  });

})();
