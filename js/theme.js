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
  теряется — особенно в iOS Safari. Отсюда «пропал весь блюр» при смене
  темы на телефоне (и иногда он не возвращается после анимации).
  На сенсорных устройствах и в iOS Safari анимацию круга не запускаем:
  тему меняем напрямую, а blur-слои после этого принудительно пересоздаём.
*/
function shouldSkipViewTransition() {
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

    if (!saveToStorage || !supportsVT || reducedMotion || shouldSkipViewTransition()) {
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
