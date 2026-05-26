/*!
 * AlignedDocs · form.js — Multipage v2
 * Loaded only on /order/. Depends on core.js (which loads config + i18n + form.json data).
 * Builds wizard, validates input, renders review, handles submit + confirmation.
 */
(function () {
  "use strict";

  var ASSETS = "/assets/";
  var FORM = null;       // { industries, reasonOptions, sections: { en: [...], de: [...] } }
  var CONFIG = null;
  var T = null;
  var CL = "en";
  var DOC_LANG = "en";
  var DOC_LOCALE = "GB";   // GB | US (only matters when DOC_LANG === "en")
  var wzStep = 0;
  var lastEmail = "";
  var built = false;

  // Expose minimal API used by core.js (exit-intent gating)
  window.AD = window.AD || {};
  window.AD.formStep = function () { return wzStep; };

  // ─── HELPERS ──────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function fetchJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("Failed to load " + url);
      return r.json();
    });
  }
  function tx(key) {
    if (!T) return "";
    var d = T[CL] || T.en;
    return d[key] != null ? d[key] : "";
  }

  // ─── BUILD WIZARD ─────────────────────────────────────────────────
  function getSections() {
    if (!FORM) return [];
    return (FORM.sections && FORM.sections[CL]) || (FORM.sections && FORM.sections.en) || [];
  }
  function getOptions(key) {
    if (!FORM) return [];
    var bag = FORM[key];
    if (!bag) return [];
    return bag[CL] || bag.en || [];
  }

  function renderField(f) {
    var labelHtml = '<label class="fl">' + escHtml(f.l)
      + (f.r ? '<em class="req">*</em>' : '<span class="field-label-opt">' + tx("ui-optional") + '</span>')
      + '</label>';

    var hintHtml = f.hint ? '<div class="field-hint">' + escHtml(f.hint) + '</div>' : '';

    var inputHtml = "";
    var tp = f.tp || "input";

    if (tp === "input") {
      var typeAttr = (f.id === "femail") ? "email" : "text";
      inputHtml = '<input class="inp" id="' + escHtml(f.id) + '" placeholder="' + escHtml(f.ph || "") + '" type="' + typeAttr + '"'
        + (f.minlen ? ' data-minlen="' + f.minlen + '"' : '') + '>';
    }
    else if (tp === "ta") {
      inputHtml = '<textarea class="ta" id="' + escHtml(f.id) + '" placeholder="' + escHtml(f.ph || "") + '" rows="3"'
        + (f.minlen ? ' data-minlen="' + f.minlen + '"' : '') + '></textarea>';
    }
    else if (tp === "select") {
      var opts = getOptions(f.options_key);
      var optionsHtml = '<option value="">' + escHtml(f.ph || "") + '</option>'
        + opts.map(function (o) {
            return '<option value="' + escHtml(o.v) + '">' + escHtml(o.l) + '</option>';
          }).join("");
      inputHtml = '<select class="inp" id="' + escHtml(f.id) + '">' + optionsHtml + '</select>';
    }
    else if (tp === "radio") {
      var rOpts = getOptions(f.options_key);
      inputHtml = '<div class="radio-group" data-radio-name="' + escHtml(f.id) + '">'
        + rOpts.map(function (o, i) {
            return '<label class="radio-opt" for="' + escHtml(f.id) + '_' + i + '">'
              + '<input type="radio" name="' + escHtml(f.id) + '" id="' + escHtml(f.id) + '_' + i + '" value="' + escHtml(o.v) + '">'
              + '<span class="radio-mark"></span>'
              + '<span class="radio-txt">' + escHtml(o.l) + '</span>'
              + '</label>';
          }).join("")
        + '</div>';
    }
    else if (tp === "kpi") {
      var rows = f.rows || 3;
      var minReq = f.minRequired || 0;
      var rowsHtml = '';
      for (var i = 0; i < rows; i++) {
        var isReq = (i < minReq);
        rowsHtml += '<div class="kpi-row" data-kpi-row="' + i + '">'
          + '<div class="kpi-cell"><span class="kpi-cell-label">' + (i === 0 ? escHtml(tx("kpi-head-label").split("/")[0] || "Metric").trim() : "—") + '</span>'
          + '<input class="kpi-input" type="text" data-kpi-field="metric" data-kpi-row="' + i + '" id="' + escHtml(f.id) + '_m' + i + '" placeholder="' + escHtml(tx("kpi-metric-ph")) + '"' + (isReq ? ' data-kpi-req="1"' : '') + '></div>'
          + '<div class="kpi-cell"><span class="kpi-cell-label">' + (i === 0 ? escHtml((tx("kpi-head-label").split("/")[1] || "Current").trim()) : "—") + '</span>'
          + '<input class="kpi-input" type="text" data-kpi-field="current" data-kpi-row="' + i + '" id="' + escHtml(f.id) + '_c' + i + '" placeholder="' + escHtml(tx("kpi-current-ph")) + '"' + (isReq ? ' data-kpi-req="1"' : '') + '></div>'
          + '<div class="kpi-cell"><span class="kpi-cell-label">' + (i === 0 ? escHtml((tx("kpi-head-label").split("/")[2] || "Target").trim()) : "—") + '</span>'
          + '<input class="kpi-input" type="text" data-kpi-field="target" data-kpi-row="' + i + '" id="' + escHtml(f.id) + '_t' + i + '" placeholder="' + escHtml(tx("kpi-target-ph")) + '"' + (isReq ? ' data-kpi-req="1"' : '') + '></div>'
          + '<div class="kpi-cell"><span class="kpi-cell-label">' + (i === 0 ? escHtml((tx("kpi-head-label").split("/")[3] || "By when").trim()) : "—") + '</span>'
          + '<input class="kpi-input" type="text" data-kpi-field="bywhen" data-kpi-row="' + i + '" id="' + escHtml(f.id) + '_b' + i + '" placeholder="' + escHtml(tx("kpi-bywhen-ph")) + '"></div>'
          + '</div>';
      }
      inputHtml = '<div class="kpi-grid" id="' + escHtml(f.id) + '" data-kpi-group="1">' + rowsHtml + '</div>';
    }

    return '<div class="ff' + (f.full ? ' fg full' : '') + '">'
      + labelHtml
      + inputHtml
      + hintHtml
      + '</div>';
  }

  function buildForm() {
    var c = $("form-body");
    if (!c) return;
    var secs = getSections();
    wzStep = 0;

    var prog = '<div class="wz-prog">'
      + '<div class="wz-row">'
      + secs.map(function (s, i) {
          return '<div class="wz-s">'
            + '<div class="wz-dot' + (i === 0 ? " active" : "") + '" id="wd' + i + '" data-wz-jump="' + i + '">' + (i + 1) + '</div>'
            + (i < secs.length - 1 ? '<div class="wz-line" id="wl' + i + '"></div>' : '')
            + '</div>';
        }).join("")
      + '</div>'
      + '<div class="wz-bar-t"><div class="wz-bar-f" id="wbar" style="width:' + (100 / secs.length) + '%"></div></div>'
      + '<div class="wz-lbl" id="wlbl"></div>'
      + '</div>';

    var panels = secs.map(function (sec, si) {
      var fieldsHtml = sec.f.map(renderField).join("");
      var allFull = sec.f.every(function (x) { return x.full || x.tp === "kpi"; });
      var prevBtn = si > 0
        ? '<button class="btn btn-ghost" type="button" data-wz-action="prev">← ' + escHtml(tx("ui-back")) + '</button>'
        : '<div></div>';
      var nextLabel = (si < secs.length - 1)
        ? (escHtml(tx("ui-next")) + ' →')
        : (escHtml(tx("ui-review")));
      var nextAction = (si < secs.length - 1) ? "next" : "review";
      var nextBtn = '<button class="btn btn-gold" type="button" data-wz-action="' + nextAction + '">' + nextLabel + '</button>';

      return '<div class="fb' + (si === 0 ? " active" : "") + '" id="wp' + si + '">'
        + '<div class="fb-t">' + escHtml(sec.t) + '</div>'
        + '<div class="fb-s">' + escHtml(sec.s) + '</div>'
        + '<div class="fg' + (allFull ? " full" : "") + '">' + fieldsHtml + '</div>'
        + '<div class="wz-nav">' + prevBtn + nextBtn + '</div>'
        + '</div>';
    }).join("");

    c.innerHTML = prog + panels;
    wireWizardNav();
    updateWiz();
    built = true;
  }

  function wireWizardNav() {
    var c = $("form-body");
    if (!c) return;
    c.addEventListener("click", function (e) {
      var t = e.target;
      var act = t.closest && t.closest("[data-wz-action]");
      if (act) {
        var a = act.getAttribute("data-wz-action");
        if (a === "next") wzNext();
        else if (a === "prev") wzPrev();
        else if (a === "review") submitFormToReview();
        return;
      }
      var jmp = t.closest && t.closest("[data-wz-jump]");
      if (jmp) {
        var idx = parseInt(jmp.getAttribute("data-wz-jump"), 10);
        if (!isNaN(idx) && idx <= wzStep) showPanel(idx);
      }
    });
  }

  function updateWiz() {
    var secs = getSections();
    var n = secs.length;
    secs.forEach(function (_, i) {
      var d = $("wd" + i), l = $("wl" + i);
      if (d) {
        d.classList.remove("active", "done");
        if (i < wzStep) d.classList.add("done");
        else if (i === wzStep) d.classList.add("active");
      }
      if (l) l.classList.toggle("done", i < wzStep);
    });
    var bar = $("wbar");
    if (bar) bar.style.width = (((wzStep + 1) / n) * 100) + "%";
    var lbl = $("wlbl");
    if (lbl) {
      lbl.innerHTML = '<strong>' + tx("ui-step") + ' ' + (wzStep + 1) + ' ' + tx("ui-of") + ' ' + n + '</strong> – ' + escHtml(secs[wzStep].t);
    }
  }
  function showPanel(idx) {
    $$("[id^=wp]").forEach(function (p) { p.classList.remove("active"); });
    var p = $("wp" + idx);
    if (p) {
      p.classList.add("active");
      p.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    wzStep = idx;
    updateWiz();
  }
  function validateStep() {
    var sec = getSections()[wzStep];
    var first = null;
    sec.f.forEach(function (f) {
      var el = $(f.id);
      if (f.tp === "kpi") {
        // require at least minRequired full rows with metric+current+target
        var min = f.minRequired || 0;
        if (min > 0) {
          var ok = 0;
          for (var i = 0; i < (f.rows || 3); i++) {
            var m = $(f.id + "_m" + i), c = $(f.id + "_c" + i), t = $(f.id + "_t" + i);
            if (m && c && t && m.value.trim() && c.value.trim() && t.value.trim()) ok++;
          }
          if (ok < min) {
            // mark first row as error
            var firstRow = el && el.querySelector('[data-kpi-row="0"]');
            if (firstRow) {
              firstRow.classList.add("err-input");
              if (!first) first = firstRow.querySelector("input");
            }
          } else if (el) {
            var rows = el.querySelectorAll(".kpi-row");
            rows.forEach(function (r) { r.classList.remove("err-input"); });
          }
        }
      }
      else if (f.tp === "radio") {
        if (f.r) {
          var checked = document.querySelector('input[name="' + f.id + '"]:checked');
          if (!checked) {
            var group = document.querySelector('[data-radio-name="' + f.id + '"]');
            if (group) group.classList.add("err-input");
            if (!first && group) first = group;
          }
        }
      }
      else {
        if (f.r && el) {
          if (!el.value.trim()) {
            el.classList.add("err-input");
            if (!first) first = el;
          } else if (f.minlen && el.value.trim().length < f.minlen) {
            el.classList.add("err-input");
            if (!first) first = el;
          } else {
            el.classList.remove("err-input");
          }
        } else if (el) {
          el.classList.remove("err-input");
        }
      }
    });
    if (first) {
      try { first.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
      try { first.focus(); } catch (e) {}
    }
    return !first;
  }
  function wzNext() { if (validateStep()) showPanel(wzStep + 1); }
  function wzPrev() { showPanel(wzStep - 1); }
  function submitFormToReview() {
    if (!validateStep()) return;
    buildReview();
    showReview();
  }

  // ─── REVIEW ────────────────────────────────────────────────────────
  function collectAllValues() {
    var out = {};
    var secs = getSections();
    secs.forEach(function (sec) {
      sec.f.forEach(function (f) {
        if (f.tp === "kpi") {
          var arr = [];
          for (var i = 0; i < (f.rows || 3); i++) {
            var m = $(f.id + "_m" + i), c = $(f.id + "_c" + i), t = $(f.id + "_t" + i), b = $(f.id + "_b" + i);
            var entry = {
              metric:  m ? m.value.trim() : "",
              current: c ? c.value.trim() : "",
              target:  t ? t.value.trim() : "",
              bywhen:  b ? b.value.trim() : ""
            };
            if (entry.metric || entry.current || entry.target || entry.bywhen) arr.push(entry);
          }
          out[f.id] = arr;
        } else if (f.tp === "radio") {
          var ch = document.querySelector('input[name="' + f.id + '"]:checked');
          out[f.id] = ch ? ch.value : "";
        } else {
          var el = $(f.id);
          out[f.id] = el ? el.value.trim() : "";
        }
      });
    });
    return out;
  }

  function formatValue(f, val) {
    if (f.tp === "kpi") {
      if (!val || !val.length) return null;
      var rows = val.map(function (r) {
        var parts = [];
        if (r.metric)  parts.push(escHtml(r.metric));
        if (r.current) parts.push(CL === "de" ? "Ist: "    + escHtml(r.current) : "Current: " + escHtml(r.current));
        if (r.target)  parts.push(CL === "de" ? "Soll: "   + escHtml(r.target)  : "Target: "  + escHtml(r.target));
        if (r.bywhen)  parts.push(CL === "de" ? "bis "     + escHtml(r.bywhen)  : "by "       + escHtml(r.bywhen));
        return "• " + parts.join(" · ");
      });
      return rows.join("<br>");
    }
    if (f.tp === "radio") {
      if (!val) return null;
      var opts = getOptions(f.options_key);
      var found = opts.find(function (o) { return o.v === val; });
      return found ? escHtml(found.l) : escHtml(val);
    }
    if (f.tp === "select") {
      if (!val) return null;
      var sOpts = getOptions(f.options_key);
      var sFound = sOpts.find(function (o) { return o.v === val; });
      return sFound ? escHtml(sFound.l) : escHtml(val);
    }
    if (!val) return null;
    return escHtml(val).replace(/\n/g, "<br>");
  }

  function buildReview() {
    var secs = getSections();
    var empty = tx("ui-empty");
    var values = collectAllValues();
    var html = secs.map(function (sec) {
      return '<div class="rv-blk">'
        + '<div class="rv-blk-t">' + escHtml(sec.t) + '</div>'
        + sec.f.map(function (f) {
            var formatted = formatValue(f, values[f.id]);
            var isEmpty = !formatted;
            return '<div class="rv-row">'
              + '<div class="rv-lbl">' + escHtml(f.l) + '</div>'
              + '<div class="rv-val' + (isEmpty ? " empty" : "") + '">' + (isEmpty ? escHtml(empty) : formatted) + '</div>'
              + '</div>';
          }).join("")
        + '</div>';
    }).join("");
    var mount = $("rv-sections");
    if (mount) mount.innerHTML = html;
    // sync email-show field
    var em = $("femail"), es = $("em-show");
    if (em && es) es.value = em.value;
    // reset confirmation field if email changed
    var conf = $("em-conf");
    var currentEmail = em ? em.value.trim().toLowerCase() : "";
    if (conf) {
      if (currentEmail !== lastEmail) {
        conf.value = "";
        conf.classList.remove("err", "ok");
        var em_err = $("em-err"); if (em_err) em_err.classList.remove("show");
        var em_blk = $("em-blk"); if (em_blk) em_blk.classList.remove("err-blk");
      }
      lastEmail = currentEmail;
    }
    // sync doc-lang switch to current UI lang by default
    setDocLang(CL);
  }

  function showReview() {
    var fp = $("page-form"), rp = $("page-review");
    if (fp) fp.style.display = "none";
    if (rp) rp.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function backToForm() {
    var fp = $("page-form"), rp = $("page-review");
    if (rp) rp.style.display = "none";
    if (fp) fp.style.display = "block";
    setTimeout(function () { showPanel(wzStep); }, 30);
  }
  window.backToForm = backToForm;

  // ─── DOC LANGUAGE + LOCALE-SUB ─────────────────────────────────────
  function setDocLang(lang) {
    if (lang !== "de" && lang !== "en") return;
    DOC_LANG = lang;
    $$(".dl-opt").forEach(function (b) { b.classList.toggle("active", b.dataset.lang === lang); });
    var sw = document.querySelector(".doc-lang-switch");
    if (sw) sw.classList.toggle("de-active", lang === "de");
    // show/hide locale-sub when EN selected
    var sub = $("locale-sub");
    if (sub) sub.classList.toggle("show", lang === "en");
  }
  window.setDocLang = setDocLang;

  function setDocLocale(loc) {
    if (loc !== "GB" && loc !== "US") return;
    DOC_LOCALE = loc;
    $$(".locale-opt").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-locale") === loc); });
  }
  window.setDocLocale = setDocLocale;

  // ─── SUBMIT-BUTTON-STATE ──────────────────────────────────────────
  function updateSubmitState() {
    var b2b = $("chk-b2b"), agb = $("chk-agb"), btn = $("rv-sub");
    if (!b2b || !agb || !btn) return;
    var ok = b2b.checked && agb.checked;
    btn.disabled = !ok;
    btn.style.opacity = ok ? "" : ".5";
    btn.style.pointerEvents = ok ? "" : "none";
  }
  window.updateSubmitState = updateSubmitState;

  // ─── EMAIL-CONFIRM ────────────────────────────────────────────────
  function toggleEye() {
    var i = $("em-show"), s = $("eye-s"), h = $("eye-h");
    if (!i) return;
    if (i.type === "password") { i.type = "text"; if (s) s.style.display = "none"; if (h) h.style.display = "block"; }
    else { i.type = "password"; if (s) s.style.display = "block"; if (h) h.style.display = "none"; }
  }
  window.toggleEye = toggleEye;

  function checkEm() {
    var show = $("em-show"), conf = $("em-conf");
    var err = $("em-err"), blk = $("em-blk");
    if (!conf || !show) return;
    if (!conf.value) {
      conf.classList.remove("err", "ok");
      if (err) err.classList.remove("show");
      if (blk) blk.classList.remove("err-blk");
      return;
    }
    var match = show.value.trim().toLowerCase() === conf.value.trim().toLowerCase();
    conf.classList.toggle("err", !match);
    conf.classList.toggle("ok", match);
    if (err) err.classList.toggle("show", !match);
    if (blk) blk.classList.toggle("err-blk", !match);
  }
  window.checkEm = checkEm;

  // ─── ORDER ID + SUBMIT ────────────────────────────────────────────
  function makeOrderId() {
    var d = new Date();
    var ymd = d.getFullYear().toString()
      + (d.getMonth() + 1).toString().padStart(2, "0")
      + d.getDate().toString().padStart(2, "0");
    var rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "AD-" + ymd + "-" + rnd;
  }

  function finalSub() {
    if (!CONFIG) return;
    var show = $("em-show"), conf = $("em-conf");
    var err = $("em-err"), blk = $("em-blk");
    if (!conf || !show) return;
    if (!conf.value.trim()) {
      conf.classList.add("err");
      if (err) err.classList.add("show");
      if (blk) blk.classList.add("err-blk");
      conf.focus();
      return;
    }
    var match = show.value.trim().toLowerCase() === conf.value.trim().toLowerCase();
    if (!match) {
      conf.classList.add("err");
      if (err) err.classList.add("show");
      if (blk) blk.classList.add("err-blk");
      conf.focus();
      return;
    }

    // Honeypot
    var hp = $("hp-website");
    if (hp && hp.value.trim() !== "") {
      console.log("[honeypot] bot attempt blocked");
      return;
    }

    var data = collectAllValues();
    var orderId = makeOrderId();

    // Build payload with meta-fields prefixed by underscore (n8n-Konvention beibehalten)
    var payload = Object.assign({}, data);
    payload._order_id = orderId;
    payload._lang = CL;                      // UI language at time of order
    payload._doc_lang = DOC_LANG;            // desired document language
    payload._doc_locale = (DOC_LANG === "en") ? DOC_LOCALE : "";  // GB/US only when EN
    payload._ts = new Date().toISOString();
    payload._b2b_confirmed = true;
    payload._terms_accepted = true;
    payload._form_version = "v2-multipage";

    // Loading state
    var btn = $("rv-sub"), lbl = $("rv-sub-t");
    if (btn) { btn.style.opacity = ".6"; btn.style.pointerEvents = "none"; }
    if (lbl) lbl.textContent = tx("ui-sending");

    var supportEmail = CONFIG.support.email;

    fetch(CONFIG.webhooks.form, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      clearDraft();
      // Conversion-Tracking: nur bei erfolgreichem Submit (HTTP 2xx)
      try {
        if (window.AD && typeof window.AD.track === "function") {
          window.AD.track("order_submitted", {
            order_id: orderId,
            doc_lang: DOC_LANG,
            value: 179,
            currency: "EUR"
          });
        }
      } catch (te) { console.error("[finalSub] tracking failed:", te); }
      showConfirmation(orderId, data.femail);
    }).catch(function (e) {
      console.error("[finalSub] order submission failed:", e);
      var errBox = $("submit-err");
      var errTxt = $("submit-err-txt");
      if (errBox && errTxt) {
        errTxt.textContent = tx("submit-err-txt");
        errBox.classList.add("show");
        try { errBox.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e2) {}
      }
    }).finally(function () {
      if (btn) { btn.style.opacity = ""; btn.style.pointerEvents = ""; }
      if (lbl) lbl.textContent = tx("rv-sub-t");
    });
  }
  window.finalSub = finalSub;

  function showConfirmation(orderId, email) {
    var rp = $("page-review"), cp = $("page-confirm");
    if (rp) rp.style.display = "none";
    if (cp) {
      cp.style.display = "block";
      var oid = $("conf-oid"); if (oid) oid.textContent = orderId;
      var em = $("conf-em"); if (em) em.textContent = email || "";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ─── LANGUAGE-CHANGE HOOK (from core.js) ──────────────────────────
  function saveVals() {
    return collectAllValues();
  }
  function restoreVals(values) {
    if (!values) return;
    var secs = getSections();
    secs.forEach(function (sec) {
      sec.f.forEach(function (f) {
        var v = values[f.id];
        if (v == null) return;
        if (f.tp === "kpi") {
          if (Array.isArray(v)) {
            v.forEach(function (row, i) {
              var m = $(f.id + "_m" + i), c = $(f.id + "_c" + i), t = $(f.id + "_t" + i), b = $(f.id + "_b" + i);
              if (m) m.value = row.metric  || "";
              if (c) c.value = row.current || "";
              if (t) t.value = row.target  || "";
              if (b) b.value = row.bywhen  || "";
            });
          }
        } else if (f.tp === "radio") {
          if (v) {
            var input = document.querySelector('input[name="' + f.id + '"][value="' + v + '"]');
            if (input) input.checked = true;
          }
        } else {
          var el = $(f.id);
          if (el) el.value = v;
        }
      });
    });
  }
  window.onLangChange = function (lang) {
    if (!built) return;
    var saved = saveVals();
    var step = wzStep;
    CL = lang;
    built = false;
    buildForm();
    restoreVals(saved);
    showPanel(step);
  };

  // ─── DRAFT PERSISTENCE (survive navigation away from /order) ──────
  var DRAFT_KEY = "ad-form-draft-v1";
  function saveDraft() {
    if (!built) return;
    try {
      var draft = { v: collectAllValues(), step: wzStep, ts: Date.now() };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {}
  }
  function loadDraft() {
    try {
      var raw = sessionStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function clearDraft() {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) {}
  }

  // ─── BOOTSTRAP (called by core.js after core data is ready) ────────
  var coreInitDone = false;
  window.onCoreReady = function () {
    if (coreInitDone) return;   // guard against double invocation
    coreInitDone = true;
    CL = (window.AD && window.AD.getLang) ? window.AD.getLang() : "en";
    T = (window.AD && window.AD.getT) ? window.AD.getT() : null;
    CONFIG = (window.AD && window.AD.getConfig) ? window.AD.getConfig() : null;
    DOC_LANG = CL;
    fetchJSON(ASSETS + "form.json").then(function (f) {
      FORM = f;
      buildForm();
      // wire B2B/AGB
      var b2b = $("chk-b2b"), agb = $("chk-agb");
      if (b2b) b2b.addEventListener("change", updateSubmitState);
      if (agb) agb.addEventListener("change", updateSubmitState);
      updateSubmitState();
      // wire email-confirm
      var conf = $("em-conf");
      if (conf) conf.addEventListener("input", checkEm);
      // wire doc-lang switch
      $$(".dl-opt").forEach(function (b) {
        b.addEventListener("click", function () { setDocLang(this.dataset.lang); });
      });
      // wire locale-sub buttons
      $$(".locale-opt").forEach(function (b) {
        b.addEventListener("click", function () { setDocLocale(this.getAttribute("data-locale")); });
      });
      // wire review back button
      var rvb = $("rv-back"); if (rvb) rvb.addEventListener("click", backToForm);
      // wire final submit button
      var rvs = $("rv-sub"); if (rvs) rvs.addEventListener("click", finalSub);
      // wire eye toggle
      var eyeb = document.querySelector(".eye-btn"); if (eyeb) eyeb.addEventListener("click", toggleEye);
      setDocLang(CL);

      // ─── restore draft if user navigated away and came back ─────────
      var draft = loadDraft();
      if (draft && draft.v) {
        restoreVals(draft.v);
        if (typeof draft.step === "number" && draft.step >= 0) {
          wzStep = draft.step;
          showPanel(wzStep);
        }
      }

      // ─── autosave: on any input + before leaving the page ───────────
      var fc = $("form-body") || document;
      if (fc && fc.addEventListener) {
        fc.addEventListener("input", saveDraft);
        fc.addEventListener("change", saveDraft);
      }
      window.addEventListener("beforeunload", saveDraft);
      window.addEventListener("pagehide", saveDraft);
    }).catch(function (err) {
      console.error("[form] failed to load form.json:", err);
    });
  };

  // ─── COLD-CACHE RACE FIX ──────────────────────────────────────────
  // If core.js already finished its bootstrap BEFORE this script assigned
  // window.onCoreReady above, the original call was a no-op and the form
  // would never build (the "loads only on the second visit" bug).
  // Detect that case via the AD.coreReady flag and self-trigger now.
  if (window.AD && window.AD.coreReady === true) {
    window.onCoreReady();
  }
})();
