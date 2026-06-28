(function () {
  "use strict";

  // Минимальное время показа скелетона (чтобы не мигал на быстрых соединениях)
  var MIN_SHOW_TIME = 600;
  var startTime = Date.now();
  var done = false;

  function revealContent() {
    if (done) return;
    done = true;

    var elapsed = Date.now() - startTime;
    var wait = Math.max(0, MIN_SHOW_TIME - elapsed);

    setTimeout(function () {
      // Плавно убираем скелетоны
      document.querySelectorAll("[data-skeleton]").forEach(function (sk) {
        sk.classList.add("skeleton-fade-out");
      });

      // Снимаем класс загрузки — реальный контент проявляется через CSS transition
      document.body.classList.remove("is-loading");

      // Полностью удаляем скелетоны из DOM после анимации затухания
      setTimeout(function () {
        document.querySelectorAll("[data-skeleton]").forEach(function (sk) {
          sk.remove();
        });
      }, 450);
    }, wait);
  }

  // Ждём загрузку i18n. Если в i18n.js есть свой колбэк/событие — используй его.
  // Здесь — универсальный вариант: ждём window.load + небольшой буфер на инициализацию.
  function init() {
    // Если переводы применяются по событию — слушаем его (опционально)
    document.addEventListener("i18n:ready", revealContent);

    // Основной триггер — полная загрузка страницы
    if (document.readyState === "complete") {
      revealContent();
    } else {
      window.addEventListener("load", revealContent);
    }

    // Страховка: показать контент максимум через 3.5 сек в любом случае
    setTimeout(revealContent, 3500);
  }

  init();
})();
