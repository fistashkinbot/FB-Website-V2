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

// FIX: на мобильных (iOS / Chrome iOS) View Transitions API рисует страницу как набор
// «плоских» снимков — backdrop-filter (блюр) и часть эффектов в них пропадают на всё
// время анимации, а dropdown выглядит сломанным. На тач-устройствах круговой reveal
// заменён плавным переходом цветов по ЖИВОМУ DOM: блюр, тени и анимации дропдауна
// работают всё время переключения.
//
// Как это устроено: все цветовые токены темы (--bg, --nav-bg, --hero-* и т.д.) один
// раз регистрируются как <color> через CSS.registerProperty. Такие переменные браузер
// умеет интерполировать, а раз они наследуются — достаточно повесить transition на
// <html>, и все элементы, использующие эти переменные, плавно меняют цвет. Никаких
// глобальных `* { transition: ... !important }`, которые ломали бы собственные
// transition дропдауна/навбара.
const THEME_SOFT_MS = 350;
const IS_TOUCH_DEVICE =
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(hover: none)').matches ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS в режиме «как на Mac»
let softThemeTimer = null;
let themeColorTokens = null;

function collectThemeColorTokens() {
    if (themeColorTokens) return themeColorTokens;
    themeColorTokens = [];
    if (!(window.CSS && typeof CSS.registerProperty === 'function')) return themeColorTokens;

    const themeSelector = /(^|[\s,>+~])(:root|html)(?![\w-])|\.dark(?![\w-])/;
    const colorValue = /^\s*(#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|hwb\(|lab\(|lch\(|oklab\(|oklch\(|color\()/i;
    const found = new Set();

    const visit = rules => {
        for (const rule of rules) {
            if (rule.style && rule.selectorText) {
                if (!themeSelector.test(rule.selectorText)) continue;
                for (let i = 0; i < rule.style.length; i++) {
                    const name = rule.style[i];
                    if (name.startsWith('--') && colorValue.test(rule.style.getPropertyValue(name))) {
                        found.add(name);
                    }
                }
            } else if (rule.cssRules) {
                try { visit(rule.cssRules); } catch (_) {}
            }
        }
    };

    for (const sheet of document.styleSheets) {
        try { visit(sheet.cssRules); } catch (_) {} // чужие stylesheet (CDN) недоступны — пропускаем
    }

    const rootStyle = getComputedStyle(html);
    found.forEach(name => {
        try {
            CSS.registerProperty({
                name,
                syntax: '<color>',
                inherits: true,
                initialValue: rootStyle.getPropertyValue(name).trim() || 'transparent'
            });
            themeColorTokens.push(name);
        } catch (_) {} // уже зарегистрирован или значение не подошло — не критично
    });
    return themeColorTokens;
}

function applyThemeSoft(apply) {
    const tokens = collectThemeColorTokens();
    clearTimeout(softThemeTimer);
    html.style.transition = tokens.map(n => `${n} ${THEME_SOFT_MS}ms ease`).join(', ');
    void html.offsetWidth; // зафиксировать transition до смены темы, иначе он не запустится
    apply();
    softThemeTimer = setTimeout(() => { html.style.transition = ''; }, THEME_SOFT_MS + 60);
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
        // FIX: раньше updateThemeToggleUI() вызывался сразу после startViewTransition,
        // то есть ДО выполнения apply() (callback запускается асинхронно) — иконка и
        // подпись пункта «тема» показывали состояние прошлой темы.
        updateThemeToggleUI();
    };

    const supportsVT = typeof document.startViewTransition === 'function';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Тач-устройства: без View Transitions, см. комментарий у THEME_SOFT_MS
    if (saveToStorage && IS_TOUCH_DEVICE && !reducedMotion) {
        lastSwitchTime = performance.now();
        cancelActiveTransition();
        applyThemeSoft(apply);
        localStorage.setItem('theme', theme);
        showThemeToast(theme);
        return;
    }

    if (!saveToStorage || !supportsVT || reducedMotion) {
        apply();
        if (saveToStorage) {
            localStorage.setItem('theme', theme);
            showThemeToast(theme);
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
