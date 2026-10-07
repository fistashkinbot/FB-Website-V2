(function () {
  "use strict";

  var INITIAL_MS = 600;   // первая загрузка
  var LANG_MS    = 500;   // смена языка

  var t0 = Date.now(), initialDone = false;

  function revealInitial() {
    if (initialDone) return;
    initialDone = true;
    setTimeout(function () {
      document.querySelectorAll("[data-skeleton]").forEach(function (e) {
        e.classList.add("skeleton-fade-out");
      });
      document.body.classList.remove("is-loading");
      setTimeout(function () {
        document.querySelectorAll("[data-skeleton]").forEach(function (e) { e.remove(); });
      }, 450);
    }, Math.max(0, INITIAL_MS - (Date.now() - t0)));
  }

  var overlay = null, hideTimer = null;

  function build() {
    if (overlay && overlay.isConnected) return overlay;

    overlay = document.createElement("div");
    overlay.className = "skeleton-overlay";
    overlay.setAttribute("aria-hidden", "true");

    // Компактная разметка: navbar + hero + features-grid
    overlay.innerHTML =
      '<div class="sk-navbar"><div class="sk-navbar-inner">' +
        '<div class="sk-shimmer sk-logo"></div>' +
        '<div class="sk-navbar-links">' +
          '<div class="sk-shimmer sk-link"></div>'.repeat(4) +
        '</div>' +
        '<div class="sk-shimmer sk-btn-sm"></div>' +
      '</div></div>' +
      '<div class="sk-home"><div class="sk-home-inner">' +
        '<div class="sk-shimmer sk-line-1"></div>' +
        '<div class="sk-shimmer sk-line-2"></div>' +
        '<div class="sk-shimmer sk-line-3"></div>' +
        '<div class="sk-shimmer sk-cta"></div>' +
      '</div></div>' +
      '<div class="sk-features">' +
        '<div class="sk-shimmer sk-features-title"></div>' +
        '<div class="sk-features-grid">' +
          '<div class="sk-shimmer sk-card"></div>'.repeat(6) +
        '</div>' +
      '</div>';

    // Каждому элементу — свой ритм и своя фаза
    overlay.querySelectorAll(".sk-shimmer").forEach(function (node, i) {
      node.style.setProperty("--i", i);
      node.style.setProperty("--sk-dur",   (1.05 + Math.random() * 0.7).toFixed(2) + "s");
      node.style.setProperty("--sk-delay", (-Math.random() * 1.6).toFixed(2) + "s");
    });

    document.body.appendChild(overlay);
    return overlay;
  }

  function show(duration) {
    var node = build();
    clearTimeout(hideTimer);
    void node.offsetHeight;              // reflow — чтобы transition сработал
    node.classList.add("is-visible");
    hideTimer = setTimeout(function () {
      node.classList.remove("is-visible");
    }, duration);
  }

  window.skeleton = {
    show: show,
    hide: function () {
      clearTimeout(hideTimer);
      if (overlay) overlay.classList.remove("is-visible");
    }
  };

  // i18n.js вызывает эту функцию перед применением переводов
  window.__beforeLangChange = function () { show(LANG_MS); };

  // Первая загрузка
  document.addEventListener("i18n:ready", revealInitial);
  if (document.readyState === "complete") revealInitial();
  else window.addEventListener("load", revealInitial);
  setTimeout(revealInitial, 3500);
})();