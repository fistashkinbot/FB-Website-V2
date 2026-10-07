// ==================== THEME TOGGLE ====================

const html = document.documentElement;
const body = document.body;

const lightBtn = document.getElementById('light-btn');
const darkBtn = document.getElementById('dark-btn');
const themeToggleItemEl = document.getElementById('theme-toggle-item');

const themeToastMessages = {
    ru: { light: 'Включена светлая тема', dark: 'Включена тёмная тема' },
    uk: { light: 'Увімкнено світлу тему', dark: 'Увімкнено темну тему' },
    en: { light: 'Light theme enabled', dark: 'Dark theme enabled' }
};

function showThemeToast(theme) {
    if (!window.toast) return;
    const lang = (window.getCurrentLanguage && window.getCurrentLanguage()) || 'ru';
    const msg = themeToastMessages[lang] || themeToastMessages.ru;

    const iconEl = document.createElement('i');
    iconEl.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';

    window.toast.add({
        title: theme === 'dark' ? msg.dark : msg.light,
        icon: iconEl,
        timeout: 2600
    });
}

// ==================== ПЕРЕКЛЮЧЕНИЕ ТЕМЫ (clip-path circle) ====================
/*
  View Transitions API + анимация clip-path: circle() из точки клика.

  Пока идёт transition, браузер подменяет e.target события на <html>.
  Из-за этого:
    • кнопку темы нельзя найти через e.target.closest — ищем по координатам;
    • outside-click handler в dropdown.js видит «клик вне меню» и закрывает
      его, хотя пользователь кликнул по пункту меню.

  Оба случая ловим в pointerdown (capture-фаза, до того как браузер
  заморозит ввод) и гасим событие + проксируем click на настоящий элемент
  под курсором.

  Кулдаун (THEME_COOLDOWN_MS) применяется ТОЛЬКО к кнопке переключения
  темы. Клики по другим элементам дропдауна не блокируются — иначе
  пользователь не сможет быстро переключить язык или другой пункт.
*/

const THEME_ANIM_MS = 750;
const THEME_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const THEME_COOLDOWN_MS = 750;

/*
  FIX (мобильный блюр): во время View Transition браузер рисует страницу
  из снимков (::view-transition-old/new), а в снимках backdrop-filter
  теряется — особенно в iOS Safari. Поэтому на сенсорных устройствах и в
  iOS Safari вместо View Transition используется отдельный слой-оверлей
  (см. runOverlayReveal): страница не снимается в картинку, blur живой.
  Десктоп по-прежнему использует View Transition.
*/
function isTouchOrIOS() {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const isIOSWebKit =
        typeof CSS !== 'undefined' &&
        CSS.supports &&
        CSS.supports('-webkit-touch-callout', 'none');
    return isTouch || isIOSWebKit;
}

// Пересоздаёт слои с backdrop-filter. Inline-значения (например, у .dropdown,
// которому blur задаётся через style.cssText в dropdown.js) сохраняются
// и восстанавливаются, а не стираются.
function refreshBackdropBlur() {
    const targets = [];
    document.querySelectorAll('*').forEach((el) => {
        const cs = getComputedStyle(el);
        const bf = cs.backdropFilter || cs.webkitBackdropFilter;
        if (bf && bf !== 'none') {
            targets.push({
                el,
                inline: el.style.getPropertyValue('backdrop-filter'),
                inlineWebkit: el.style.getPropertyValue('-webkit-backdrop-filter')
            });
        }
    });
    if (!targets.length) return;

    targets.forEach(({ el }) => {
        el.style.setProperty('-webkit-backdrop-filter', 'none');
        el.style.setProperty('backdrop-filter', 'none');
    });

    void document.body.offsetWidth; // принудительный reflow

    requestAnimationFrame(() => {
        targets.forEach(({ el, inline, inlineWebkit }) => {
            if (inlineWebkit) el.style.setProperty('-webkit-backdrop-filter', inlineWebkit);
            else el.style.removeProperty('-webkit-backdrop-filter');

            if (inline) el.style.setProperty('backdrop-filter', inline);
            else el.style.removeProperty('backdrop-filter');
        });
    });
}

let activeTransition = null;
let activeAnim = null;
let animGeneration = 0;
let lastSwitchTime = 0;

let suppressNextClick = false;
let suppressClickTimer = null;

// ==================== ОВЕРЛЕЙ-КРУГ ДЛЯ МОБИЛЬНЫХ ====================
/*
  Круг рисуется отдельным fixed-слоем поверх страницы:
    1. круг цвета НОВОЙ темы раскрывается из точки касания (с акцентным
       свечением по краю);
    2. когда круг закрыл экран — под ним мгновенно применяется тема;
    3. слой плавно гаснет, открывая уже новую тему; иконка в меню
       «проворачивается».
  Страница сама не снимается в картинку, поэтому backdrop-filter живой.

  Что сделано ради плавности на iOS:
    • круг анимируется через transform: scale() — это композитная
      GPU-анимация, без перерисовки (clip-path на весь экран её требует);
    • на время смены темы отключаются все CSS-transition
      (html.theme-switching), иначе под слоем цвета «доезжают» по 0.3 с,
      нагружают GPU и заметно мерцают при затухании;
    • тема применяется, пока слой полностью непрозрачен, а затухание
      стартует только после двух отрисованных кадров.

  Цвета = --bg-page из style.css (светлая #f8f9fa, тёмная #09090b).
*/
const OVERLAY_COLORS = { light: '#f8f9fa', dark: '#09090b' };
const OVERLAY_ACCENT_RGB = '192, 105, 78'; // --accent: #c0694e
const OVERLAY_GROW_MS = 650;
const OVERLAY_FADE_MS = 380;

let activeOverlay = null; // { el, animations, applied, apply, finalize }

function injectOverlayStyles() {
    if (document.getElementById('theme-overlay-style')) return;
    const st = document.createElement('style');
    st.id = 'theme-overlay-style';
    st.textContent = `
        html.theme-switching *,
        html.theme-switching *::before,
        html.theme-switching *::after {
            transition: none !important;
        }
    `;
    document.head.appendChild(st);
}

// Небольшая «прокрутка» иконки солнца/луны после смены темы
function spinThemeIcon() {
    const icon = document.getElementById('theme-toggle-icon');
    if (!icon || typeof icon.animate !== 'function') return;
    if (getComputedStyle(icon).display === 'inline') {
        icon.style.display = 'inline-block'; // transform не работает на inline
    }
    icon.animate(
        [
            { transform: 'rotate(-140deg) scale(0.4)', opacity: 0 },
            { transform: 'rotate(0deg) scale(1)', opacity: 1 }
        ],
        { duration: 480, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
    );
}

function cancelOverlay() {
    if (!activeOverlay) return;
    const o = activeOverlay;
    activeOverlay = null;
    o.animations.forEach((a) => {
        try { a.cancel(); } catch (_) {}
    });
    o.el.remove();
    // Если тема ещё не применилась — применяем, чтобы состояние не рассинхронизировалось
    if (!o.applied) {
        o.applied = true;
        o.apply();
    }
    html.classList.remove('theme-switching');
    o.finalize();
}

function runOverlayReveal(theme, apply, x, y, onApplied) {
    cancelOverlay();
    injectOverlayStyles();
    const gen = ++animGeneration;

    const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
    );
    const color = OVERLAY_COLORS[theme] || OVERLAY_COLORS.dark;

    // Контейнер: прозрачный, на весь экран, им управляем затуханием
    const wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = [
        'position: fixed',
        'top: 0',
        'left: 0',
        'width: 100%',
        'height: 100%',
        'overflow: hidden',
        'z-index: 2147483647',
        'pointer-events: none',
        'will-change: opacity'
    ].join(';');

    // Круг: размером с «радиус до самого дальнего угла», растёт через scale
    const circle = document.createElement('div');
    circle.style.cssText = [
        'position: absolute',
        `left: ${x - radius}px`,
        `top: ${y - radius}px`,
        `width: ${radius * 2}px`,
        `height: ${radius * 2}px`,
        'border-radius: 50%',
        `background: ${color}`,
        `box-shadow: 0 0 0 2px rgba(${OVERLAY_ACCENT_RGB}, 0.55), 0 0 40px 12px rgba(${OVERLAY_ACCENT_RGB}, 0.35)`,
        'transform: translate3d(0, 0, 0) scale(0)',
        'will-change: transform',
        'backface-visibility: hidden',
        '-webkit-backface-visibility: hidden'
    ].join(';');

    wrap.appendChild(circle);
    document.body.appendChild(wrap);

    // Уведомление (тост/иконка) должно сработать ровно один раз
    let notified = false;
    const notify = () => {
        if (notified) return;
        notified = true;
        if (onApplied) onApplied();
    };

    const state = {
        el: wrap,
        animations: [],
        applied: false,
        apply,
        finalize: () => {
            notify();
            refreshBackdropBlur();
        }
    };
    activeOverlay = state;

    // Лёгкий тактильный отклик там, где он поддерживается (Android)
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (_) {}

    const grow = circle.animate(
        [
            { transform: 'translate3d(0, 0, 0) scale(0)' },
            { transform: 'translate3d(0, 0, 0) scale(1)' }
        ],
        { duration: OVERLAY_GROW_MS, easing: THEME_EASING, fill: 'forwards' }
    );
    state.animations.push(grow);

    grow.finished
        .then(() => {
            if (gen !== animGeneration || activeOverlay !== state) return;

            // Экран полностью закрыт — меняем тему без каких-либо transition
            html.classList.add('theme-switching');
            state.applied = true;
            apply();
            void html.offsetWidth; // форсируем пересчёт стилей под слоем

            // Ждём два отрисованных кадра, затем плавно гасим слой
            requestAnimationFrame(() => requestAnimationFrame(() => {
                if (gen !== animGeneration || activeOverlay !== state) return;

                html.classList.remove('theme-switching');
                notify();
                spinThemeIcon();

                const fade = wrap.animate(
                    { opacity: [1, 0] },
                    { duration: OVERLAY_FADE_MS, easing: 'ease-out', fill: 'forwards' }
                );
                state.animations.push(fade);

                fade.finished
                    .then(() => {
                        if (activeOverlay !== state) return;
                        activeOverlay = null;
                        wrap.remove();
                        refreshBackdropBlur();
                    })
                    .catch(() => {});
            }));
        })
        .catch(() => {});
}

function getThemeButtonAtPoint(x, y) {
    const buttons = document.querySelectorAll('#light-btn, #dark-btn, #theme-toggle-item');
    for (const btn of buttons) {
        const r = btn.getBoundingClientRect();
        if (x >= r.left && x < r.right && y >= r.top && y < r.bottom) {
            return btn;
        }
    }
    return null;
}

function getOpenDropdownAtPoint(x, y) {
    const menus = document.querySelectorAll('.dropdown.show');
    for (const menu of menus) {
        const r = menu.getBoundingClientRect();
        if (x >= r.left && x < r.right && y >= r.top && y < r.bottom) {
            return menu;
        }
    }
    return null;
}

function findDropdownItemAt(x, y) {
    const els = document.elementsFromPoint(x, y);
    for (const el of els) {
        if (el && el.closest) {
            const item = el.closest('.dropdown-item');
            if (item) return item;
        }
    }
    return null;
}

// Помечаем, что следующий click надо проглотить, чтобы outside-click
// в dropdown.js не закрыл меню. Вызывается из pointerdown.
function markNextClickSuppressed() {
    suppressNextClick = true;
    clearTimeout(suppressClickTimer);
    suppressClickTimer = setTimeout(() => { suppressNextClick = false; }, 500);
}

function cancelActiveTransition() {
    cancelOverlay();
    if (activeAnim) {
        try { activeAnim.cancel(); } catch (_) {}
        activeAnim = null;
    }
    if (activeTransition) {
        try { activeTransition.skipTransition(); } catch (_) {}
        activeTransition = null;
    }
}

function isCoolingDown() {
    return performance.now() - lastSwitchTime < THEME_COOLDOWN_MS;
}

function setTheme(theme, event, saveToStorage = true) {
    const isDark = theme === 'dark';

    const currentIsDark = html.classList.contains('dark');
    if (saveToStorage && currentIsDark === isDark) return;
    if (saveToStorage && isCoolingDown()) return;

    const apply = () => {
        html.classList.toggle('dark', isDark);
        body.classList.toggle('dark', isDark);
        lightBtn?.classList.toggle('active', !isDark);
        darkBtn?.classList.toggle('active', isDark);
    };

    const supportsVT = typeof document.startViewTransition === 'function';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Телефоны/iOS: круг рисуем отдельным слоем, без View Transition (иначе пропадает blur)
    const overlayMode =
        isTouchOrIOS() && typeof document.documentElement.animate === 'function';

    if (!saveToStorage || reducedMotion || (!supportsVT && !overlayMode)) {
        apply();
        if (saveToStorage) {
            lastSwitchTime = performance.now();
            localStorage.setItem('theme', theme);
            showThemeToast(theme);
            // Страховка для iOS: пересоздаём blur-слои после смены темы
            requestAnimationFrame(refreshBackdropBlur);
        }
        updateThemeToggleUI();
        return;
    }

    lastSwitchTime = performance.now();

    let x, y;
    if (event && (event.clientX || event.clientY)) {
        x = event.clientX;
        y = event.clientY;
    } else {
        const anchor = themeToggleItemEl || darkBtn || lightBtn;
        if (anchor) {
            const r = anchor.getBoundingClientRect();
            x = r.left + r.width / 2;
            y = r.top + r.height / 2;
        } else {
            x = window.innerWidth / 2;
            y = window.innerHeight / 2;
        }
    }

    cancelActiveTransition();

    if (overlayMode) {
        localStorage.setItem('theme', theme);
        runOverlayReveal(theme, apply, x, y, () => {
            showThemeToast(theme);
            updateThemeToggleUI();
        });
        return;
    }

    const gen = ++animGeneration;

    const transition = document.startViewTransition(() => {
        apply();
    });
    activeTransition = transition;

    transition.ready
        .then(() => {
            if (gen !== animGeneration) return;

            const right = window.innerWidth - x;
            const bottom = window.innerHeight - y;
            const maxRadius = Math.hypot(Math.max(x, right), Math.max(y, bottom));

            try {
                activeAnim = document.documentElement.animate(
                    {
                        clipPath: [
                            `circle(0px at ${x}px ${y}px)`,
                            `circle(${maxRadius}px at ${x}px ${y}px)`
                        ]
                    },
                    {
                        duration: THEME_ANIM_MS,
                        easing: THEME_EASING,
                        pseudoElement: '::view-transition-new(root)'
                    }
                );
            } catch (_) {}
        })
        .catch(() => {});

    transition.finished
        .catch(() => {})
        .finally(() => {
            if (activeTransition === transition) activeTransition = null;
            if (gen === animGeneration) activeAnim = null;
        });

    localStorage.setItem('theme', theme);
    showThemeToast(theme);
    updateThemeToggleUI();
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

function __onReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
        fn();
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(savedTheme || (prefersDark ? 'dark' : 'light'), null, false);
}

function updateThemeToggleUI() {
    const icon = document.getElementById('theme-toggle-icon');
    const textEl = document.getElementById('theme-toggle-text');

    if (!icon || !textEl) return;

    const isDark = html.classList.contains('dark');
    const currentLang = (window.getCurrentLanguage && window.getCurrentLanguage()) || 'ru';
    const t = window.translations || {};
    const langTranslations = t[currentLang] || t.ru || {};

    if (isDark) {
        icon.className = 'fa-solid fa-sun';
        textEl.dataset.i18n = 'dropdown_theme_light';
        textEl.textContent = langTranslations.dropdown_theme_light || 'Светлая тема';
    } else {
        icon.className = 'fa-solid fa-moon';
        textEl.dataset.i18n = 'dropdown_theme_dark';
        textEl.textContent = langTranslations.dropdown_theme_dark || 'Тёмная тема';
    }
}

// ==================== ОБРАБОТЧИКИ ====================

lightBtn?.addEventListener('click', (e) => setTheme('light', e));
darkBtn?.addEventListener('click', (e) => setTheme('dark', e));

if (themeToggleItemEl) {
    themeToggleItemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCurrentlyDark = html.classList.contains('dark');
        setTheme(isCurrentlyDark ? 'light' : 'dark', e);
    });
}

/*
  Перехват pointerdown во время анимации.

  Ключевой порядок операций в ветке themeBtn:
    1. Сначала markNextClickSuppressed() — гарантированно глушим click,
       даже если он придёт после preventDefault. Без этого dropdown.js
       закроет меню, думая, что клик был снаружи.
    2. Потом проверяем кулдаун. Если он ещё идёт — просто выходим,
       событие уже погашено и click не долетит.
    3. Если не кулдаун — запускаем setTheme().
*/
window.addEventListener('pointerdown', (e) => {
    if (!activeTransition) return;

    const themeBtn = getThemeButtonAtPoint(e.clientX, e.clientY);

    if (themeBtn) {
        e.preventDefault();
        e.stopPropagation();

        // КРИТИЧНО: гасим click ДО проверки кулдауна, иначе при кулдауне
        // click долетает до document и dropdown.js закрывает меню.
        markNextClickSuppressed();

        // Кулдаун — только для кнопки темы. Дропдаун не трогаем.
        if (isCoolingDown()) return;

        let newTheme;
        if (themeBtn.id === 'light-btn') {
            newTheme = 'light';
        } else if (themeBtn.id === 'dark-btn') {
            newTheme = 'dark';
        } else {
            newTheme = html.classList.contains('dark') ? 'light' : 'dark';
        }

        setTheme(newTheme, e);
        return;
    }

    // Клик по элементу открытого дропдауна. Кулдаун тут НЕ проверяем —
    // пользователь вправе быстро переключать язык или другой пункт.
    const menu = getOpenDropdownAtPoint(e.clientX, e.clientY);
    if (menu) {
        e.stopPropagation();
        markNextClickSuppressed();

        const item = findDropdownItemAt(e.clientX, e.clientY);
        if (item) {
            setTimeout(() => item.click(), 0);
        }
    }
}, true);

// Гасим click, если он всё-таки долетел до window.
window.addEventListener('click', (e) => {
    if (!suppressNextClick) return;
    suppressNextClick = false;
    e.stopPropagation();
}, true);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light', null);
    }
});

// ==================== ЗАПУСК ====================

__onReady(() => {
    initTheme();
    updateThemeToggleUI();
});

window.addEventListener('load', updateThemeToggleUI);

new MutationObserver(updateThemeToggleUI)
    .observe(html, { attributes: true, attributeFilter: ['class'] });