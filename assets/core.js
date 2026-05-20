/*!
 * AlignedDocs · core.js — Multipage v2
 * Bootstrap, i18n, theme, nav, FAQ/Pipe builders, sample-wiring, reveal, exit-intent.
 * Form-specific logic lives in form.js (loaded only on /order/).
 */
(function () {
  "use strict";

  // ─── STATE ────────────────────────────────────────────────────────
  var T = null;          // i18n dictionary (loaded async)
  var FAQ = null;        // FAQ data
  var PIPE = null;       // Pipeline data
  var CONFIG = null;     // Webhooks, samples, pages
  var CL = "en";         // current UI language
  var ASSETS = "/assets/"; // base path for JSON
  var bootDone = false;

  // expose minimal API
  window.AD = window.AD || {};

  // ─── HELPERS ──────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function fetchJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("Failed to load " + url + " (HTTP " + r.status + ")");
      return r.json();
    });
  }
  function fetchText(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("Failed to load " + url + " (HTTP " + r.status + ")");
      return r.text();
    });
  }

  // ─── LANGUAGE ─────────────────────────────────────────────────────
  function detectLang() {
    var stored = localStorage.getItem("ad-lang");
    if (stored === "de" || stored === "en") return stored;
    var html = document.documentElement.lang;
    if (html === "de" || html === "en") return html;
    var nav = (navigator.language || "en").toLowerCase();
    return nav.indexOf("de") === 0 ? "de" : "en";
  }
  function applyT() {
    if (!T) return;
    var d = T[CL] || T.en;
    Object.keys(d).forEach(function (k) {
      // 1) data-t attribute (preferred)
      $$('[data-t="' + k + '"]').forEach(function (el) { el.innerHTML = d[k]; });
      // 2) id-based (legacy, kept for backward-compat)
      var el = $(k);
      if (el && !el.hasAttribute("data-t-skip")) el.innerHTML = d[k];
    });
    // placeholders via data-t-ph
    $$('[data-t-ph]').forEach(function (el) {
      var key = el.getAttribute("data-t-ph");
      if (d[key]) el.setAttribute("placeholder", d[key]);
    });
    // aria-label via data-t-aria
    $$('[data-t-aria]').forEach(function (el) {
      var key = el.getAttribute("data-t-aria");
      if (d[key]) el.setAttribute("aria-label", d[key]);
    });
    updateThemeTip();
    updateHtmlLang();
  }
  function updateHtmlLang() {
    document.documentElement.lang = CL;
  }
  function setL(lang) {
    if (lang !== "de" && lang !== "en") return;
    CL = lang;
    localStorage.setItem("ad-lang", lang);
    // toggle .on class on lang buttons
    var be = $("lb-e"), bd = $("lb-d");
    if (be) be.classList.toggle("on", lang === "en");
    if (bd) bd.classList.toggle("on", lang === "de");
    applyT();
    buildPipe();
    buildFAQ();
    wireSampleLinks();
    markActiveNav();
    // Hook for form.js (if loaded)
    if (typeof window.onLangChange === "function") {
      try { window.onLangChange(lang); } catch (e) { console.error("[core] onLangChange hook failed:", e); }
    }
  }
  window.AD.setL = setL;
  // backward-compatible global (some HTML still uses onclick="setL('en')")
  window.setL = setL;
  window.AD.getLang = function () { return CL; };
  window.AD.getT = function () { return T; };
  window.AD.getConfig = function () { return CONFIG; };

  // ─── PIPELINE ─────────────────────────────────────────────────────
  function buildPipe() {
    var c = $("pipeline");
    if (!c || !PIPE) return;
    var data = PIPE[CL] || PIPE.en;
    c.innerHTML = data.map(function (s, i) {
      return '<div class="ps">' +
        '<div class="pn"><svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.5" width="20" height="20"><path d="' + s.ic + '"/></svg></div>' +
        '<div class="pt">' + escHtml(s.t) + '</div>' +
        '<div class="pb">' + escHtml(s.s).replace(/\n/g, "<br>") + '</div>' +
        '</div>' +
        (i < data.length - 1 ? '<div class="pc"><div class="pc-line"><span class="pc-arr">›</span></div></div>' : '');
    }).join("");
  }

  // ─── FAQ ──────────────────────────────────────────────────────────
  function buildFAQ() {
    var c = $("faq-list");
    if (!c || !FAQ) return;
    var data = FAQ[CL] || FAQ.en;
    c.innerHTML = data.map(function (f, i) {
      return '<div class="fi" id="fi' + i + '">' +
        '<div class="fq" data-faq-idx="' + i + '">' +
        '<span>' + escHtml(f.q) + '</span>' +
        '<div class="fi-ico"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M7 2v10M2 7h10"/></svg></div>' +
        '</div>' +
        '<div class="fa">' + f.a + '</div>' +
        '</div>';
    }).join("");
    // delegate click
    c.querySelectorAll(".fq").forEach(function (el) {
      el.addEventListener("click", function () {
        var idx = this.getAttribute("data-faq-idx");
        var item = document.getElementById("fi" + idx);
        if (item) item.classList.toggle("open");
      });
    });
  }
  // legacy global (in case old HTML still references it)
  window.tFAQ = function (i) {
    var el = $("fi" + i);
    if (el) el.classList.toggle("open");
  };

  // ─── SAMPLE LINKS (sprach-sensitiv) ───────────────────────────────
  function wireSampleLinks() {
    if (!CONFIG || !CONFIG.samples) return;
    var url = CONFIG.samples[CL] || CONFIG.samples.en;
    $$('[data-sample-link]').forEach(function (a) {
      a.setAttribute("href", url);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
    });
  }

  // ─── NAVIGATION (Multipage) ───────────────────────────────────────
  function markActiveNav() {
    var path = window.location.pathname.replace(/\/+$/, "/");
    // normalise root
    if (path === "" || path === "/index.html") path = "/";
    $$('[data-nav-link]').forEach(function (a) {
      var href = a.getAttribute("href") || "";
      // exact match for home
      var isActive = (href === path) || (href === "/" && path === "/");
      // prefix match for sub-pages
      if (!isActive && href !== "/" && path.indexOf(href) === 0) isActive = true;
      a.classList.toggle("active", isActive);
    });
  }

  // ─── THEME ────────────────────────────────────────────────────────
  function applyTheme(t) {
    var moon = $("ico-moon"), sun = $("ico-sun");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (t === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      if (moon) moon.style.display = "none";
      if (sun)  sun.style.display = "block";
      if (meta) meta.content = "#F8F6F1";
    } else {
      document.documentElement.removeAttribute("data-theme");
      if (moon) moon.style.display = "block";
      if (sun)  sun.style.display = "none";
      if (meta) meta.content = "#080A0F";
    }
    updateThemeTip();
  }
  function toggleTheme() {
    var isL = document.documentElement.getAttribute("data-theme") === "light";
    var next = isL ? "dark" : "light";
    applyTheme(next);
    localStorage.setItem("ad-theme", next);
  }
  function updateThemeTip() {
    var tip = $("theme-tip"); if (!tip) return;
    var isL = document.documentElement.getAttribute("data-theme") === "light";
    tip.textContent = CL === "de"
      ? (isL ? "Dark Mode" : "Light Mode")
      : (isL ? "Switch to Dark Mode" : "Switch to Light Mode");
  }
  window.AD.toggleTheme = toggleTheme;
  window.toggleTheme = toggleTheme;
  function bootstrapTheme() {
    var s = localStorage.getItem("ad-theme");
    if (s) { applyTheme(s); return; }
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      applyTheme("light");
    }
  }

  // ─── REVEAL ───────────────────────────────────────────────────────
  function initReveal() {
    if (!("IntersectionObserver" in window)) {
      $$(".reveal").forEach(function (el) { el.classList.add("vis"); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add("vis"); });
    }, { threshold: 0.08 });
    $$(".reveal").forEach(function (el) { obs.observe(el); });
  }

  // ─── EXIT-INTENT (only on /order/ at step 2+) ─────────────────────
  var exShown = false, exCool = false, mTimer = null;
  function exitAllowed() {
    // form.js exposes a flag; otherwise never fire
    return !!(window.AD && window.AD.formStep && window.AD.formStep() >= 1);
  }
  function showExit() {
    if (exShown || exCool || !exitAllowed()) return;
    var ov = $("ex-ov"); if (!ov) return;
    exShown = true;
    ov.classList.add("show");
  }
  function resetMT() {
    clearTimeout(mTimer);
    mTimer = setTimeout(showExit, 45000);
  }
  function closeEx() {
    var ov = $("ex-ov"); if (ov) ov.classList.remove("show");
    exCool = true;
    setTimeout(function () { exCool = false; exShown = false; }, 120000);
  }
  window.closeEx = closeEx;
  function bindExitIntent() {
    if (!$("ex-ov")) return; // overlay not on this page
    document.addEventListener("mouseleave", function (e) {
      if (e.clientY <= 0) showExit();
    });
    ["touchstart", "touchend", "scroll"].forEach(function (ev) {
      document.addEventListener(ev, resetMT, { passive: true });
    });
    resetMT();
  }
  function submitContact() {
    if (!CONFIG) return;
    var name = ($("ex-name") || {}).value || "";
    var email = ($("ex-email") || {}).value || "";
    var msg = ($("ex-msg") || {}).value || "";
    var err = $("ex-err");
    name = name.trim(); email = email.trim(); msg = msg.trim();
    if (!email || !msg) { if (err) err.classList.add("show"); return; }
    if (err) err.classList.remove("show");
    var btn = document.querySelector("#ex-form .btn-gold");
    if (btn) { btn.style.opacity = ".6"; btn.style.pointerEvents = "none"; }
    var url = CONFIG.webhooks.contact;
    var supportEmail = CONFIG.support.email;
    function showOk() {
      var form = $("ex-form"), ok = $("ex-ok"), emEl = $("ex-ok-em");
      if (form) form.style.display = "none";
      if (emEl) emEl.textContent = email;
      if (ok) ok.style.display = "block";
      setTimeout(closeEx, 4000);
    }
    function fail() {
      if (btn) { btn.style.opacity = ""; btn.style.pointerEvents = ""; }
      alert(CL === "de"
        ? "⚠ Ihre Nachricht konnte nicht gesendet werden. Bitte schreiben Sie uns direkt an " + supportEmail + "."
        : "⚠ Your message could not be sent. Please write to us directly at " + supportEmail + ".");
    }
    // honest fallback if webhook is a placeholder
    if (!url || url.indexOf("YOUR_") === 0) {
      if (btn) { btn.style.opacity = ""; btn.style.pointerEvents = ""; }
      var mailto = "mailto:" + supportEmail
        + "?subject=" + encodeURIComponent("AlignedDocs question from " + (name || "website visitor"))
        + "&body=" + encodeURIComponent("From: " + (name || "") + " <" + email + ">\n\n" + msg);
      if (confirm(CL === "de"
        ? "Unser Kontaktformular ist gerade nicht verfügbar.\n\nMöchten Sie Ihre Nachricht stattdessen direkt per E-Mail an " + supportEmail + " senden?"
        : "Our contact form is currently unavailable.\n\nWould you like to send your message directly to " + supportEmail + " instead?")) {
        window.location.href = mailto;
      }
      return;
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, email: email, message: msg, source: "exit-intent", lang: CL })
    }).then(function (r) {
      if (btn) { btn.style.opacity = ""; btn.style.pointerEvents = ""; }
      if (!r.ok) { fail(); return; }
      showOk();
    }).catch(fail);
  }
  window.submitEx = submitContact;

  // ─── HEADER/FOOTER FRAGMENT LOADER ────────────────────────────────
  function loadFragment(mountId, url) {
    var m = $(mountId);
    if (!m) return Promise.resolve();
    return fetchText(url).then(function (html) { m.innerHTML = html; });
  }

  // ─── WIRE GLOBAL EVENTS (delegated) ───────────────────────────────
  function wireGlobalEvents() {
    document.addEventListener("click", function (e) {
      var t = e.target;
      // lang buttons
      var lb = t.closest && t.closest("[data-lang-btn]");
      if (lb) { e.preventDefault(); setL(lb.getAttribute("data-lang-btn")); return; }
      // theme button
      var tb = t.closest && t.closest("[data-theme-toggle]");
      if (tb) { e.preventDefault(); toggleTheme(); return; }
      // exit-overlay close (delegated)
      var xc = t.closest && t.closest("[data-exit-close]");
      if (xc) { e.preventDefault(); closeEx(); return; }
      // contact submit (delegated)
      var es = t.closest && t.closest("[data-exit-send]");
      if (es) { e.preventDefault(); submitContact(); return; }
    });
  }

  // ─── BOOTSTRAP ────────────────────────────────────────────────────
  function bootstrap() {
    if (bootDone) return Promise.resolve();
    bootDone = true;
    CL = detectLang();
    bootstrapTheme();

    // Mount points may exist on every page; load them in parallel
    var fragHead = loadFragment("header-mount", ASSETS + "header.html");
    var fragFoot = loadFragment("footer-mount", ASSETS + "footer.html");

    var data = Promise.all([
      fetchJSON(ASSETS + "config.json"),
      fetchJSON(ASSETS + "i18n.json"),
      fetchJSON(ASSETS + "faq.json"),
      fetchJSON(ASSETS + "pipe.json")
    ]).then(function (results) {
      CONFIG = results[0];
      T      = results[1];
      FAQ    = results[2];
      PIPE   = results[3];
    });

    return Promise.all([fragHead, fragFoot, data])
      .then(function () {
        // After header/footer are mounted, re-apply theme so the moon/sun icons
        // reflect the actual theme (icons did not exist during the first applyTheme call)
        var currentTheme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
        applyTheme(currentTheme);
        // mark lang button state
        var be = $("lb-e"), bd = $("lb-d");
        if (be) be.classList.toggle("on", CL === "en");
        if (bd) bd.classList.toggle("on", CL === "de");
        applyT();
        buildPipe();
        buildFAQ();
        wireSampleLinks();
        markActiveNav();
        wireGlobalEvents();
        bindExitIntent();
        initReveal();
        // Hook page-level initialiser if defined (e.g. form.js sets it)
        if (typeof window.onCoreReady === "function") {
          try { window.onCoreReady(); } catch (e) { console.error("[core] onCoreReady hook failed:", e); }
        }
      })
      .catch(function (err) {
        console.error("[AD core] bootstrap failed:", err);
      });
  }
  window.AD.bootstrap = bootstrap;
  window.AD.applyT = applyT;
  window.AD.wireSampleLinks = wireSampleLinks;

  // Auto-bootstrap on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
