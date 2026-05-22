/*!
 * AlignedDocs · analytics.js
 * GDPR-konformes Google Analytics 4 mit Consent-Banner.
 * Selbstständig: GA4 lädt NUR nach ausdrücklicher Zustimmung.
 * Sprache (de/en) wird aus localStorage 'ad-lang' übernommen.
 */
(function () {
  "use strict";

  // ─── KONFIGURATION ────────────────────────────────────────────────
  var GA_ID = "G-YRW6P5X1G1";        // AlignedDocs Measurement ID
  var CONSENT_KEY = "ad-analytics-consent";
  var PRIVACY_URL = "/legal/privacy/";

  // ─── TEXTE (zweisprachig) ─────────────────────────────────────────
  var TXT = {
    de: {
      msg: "Wir nutzen Google Analytics für anonyme Statistiken, um unsere Website zu verbessern. IP-Adressen werden anonymisiert.",
      accept: "Akzeptieren",
      decline: "Ablehnen",
      more: "Datenschutz"
    },
    en: {
      msg: "We use Google Analytics for anonymous statistics to improve our website. IP addresses are anonymised.",
      accept: "Accept",
      decline: "Decline",
      more: "Privacy"
    }
  };

  function lang() {
    var l = localStorage.getItem("ad-lang");
    if (l === "de" || l === "en") return l;
    var nav = (navigator.language || "en").toLowerCase();
    return nav.indexOf("de") === 0 ? "de" : "en";
  }

  // ─── GA4 LADEN (nur nach Consent) ─────────────────────────────────
  function loadGA() {
    if (window.__adGaLoaded) return;
    window.__adGaLoaded = true;

    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", GA_ID, {
      anonymize_ip: true,
      allow_google_signals: false
    });

    // Minimal-API für Event-Tracking (optional nutzbar)
    window.AD = window.AD || {};
    window.AD.track = function (name, params) {
      if (typeof window.gtag === "function") {
        window.gtag("event", name, params || {});
      }
    };
  }

  // ─── BANNER ───────────────────────────────────────────────────────
  function buildBanner() {
    var t = TXT[lang()];

    var bar = document.createElement("div");
    bar.id = "ad-consent";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-label", "Cookie consent");
    bar.style.cssText = [
      "position:fixed", "bottom:0", "left:0", "right:0", "z-index:9999",
      "background:var(--bg2,#0D1017)",
      "border-top:1px solid var(--gold-b,rgba(201,168,76,.22))",
      "color:var(--tb,#cfd2d8)",
      "font-family:'Outfit',sans-serif", "font-size:13px", "line-height:1.5",
      "padding:16px 20px",
      "display:flex", "flex-wrap:wrap", "align-items:center",
      "justify-content:center", "gap:14px",
      "box-shadow:0 -4px 24px rgba(0,0,0,.35)"
    ].join(";");

    var msg = document.createElement("span");
    msg.style.cssText = "max-width:640px;flex:1 1 320px;min-width:240px";
    msg.innerHTML = t.msg +
      ' <a href="' + PRIVACY_URL + '" style="color:var(--gold,#C9A84C);text-decoration:underline">' +
      t.more + "</a>";

    var btns = document.createElement("div");
    btns.style.cssText = "display:flex;gap:10px;flex-shrink:0";

    var accept = document.createElement("button");
    accept.textContent = t.accept;
    accept.style.cssText = [
      "padding:9px 20px", "border:none", "border-radius:8px", "cursor:pointer",
      "font-family:'Outfit',sans-serif", "font-size:13px", "font-weight:500",
      "background:linear-gradient(135deg,var(--gold,#C9A84C),#A8782A)",
      "color:var(--bg,#080A0F)"
    ].join(";");

    var decline = document.createElement("button");
    decline.textContent = t.decline;
    decline.style.cssText = [
      "padding:9px 20px", "border-radius:8px", "cursor:pointer",
      "font-family:'Outfit',sans-serif", "font-size:13px", "font-weight:400",
      "background:transparent",
      "border:1px solid var(--gold-b,rgba(201,168,76,.22))",
      "color:var(--tm,#9aa0ab)"
    ].join(";");

    accept.addEventListener("click", function () {
      localStorage.setItem(CONSENT_KEY, "granted");
      remove();
      loadGA();
    });
    decline.addEventListener("click", function () {
      localStorage.setItem(CONSENT_KEY, "denied");
      remove();
    });

    btns.appendChild(decline);
    btns.appendChild(accept);
    bar.appendChild(msg);
    bar.appendChild(btns);
    document.body.appendChild(bar);
  }

  function remove() {
    var el = document.getElementById("ad-consent");
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  // ─── START ────────────────────────────────────────────────────────
  function init() {
    var consent = localStorage.getItem(CONSENT_KEY);
    if (consent === "granted") {
      loadGA();              // schon zugestimmt → direkt laden
    } else if (consent === "denied") {
      // nichts tun
    } else {
      buildBanner();         // noch keine Entscheidung → Banner zeigen
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
