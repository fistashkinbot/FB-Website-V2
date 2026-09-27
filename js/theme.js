// ==================== THEME TOGGLE ====================

const html = document.documentElement; // Лучше использовать <html>
const body = document.body;

const lightBtn = document.getElementById('light-btn');
const darkBtn = document.getElementById('dark-btn');
const themeToggleItemEl = document.getElementById('theme-toggle-item');

// Тексты тоста о смене темы (тот же паттерн, что и у языкового тоста в i18n.js)
const themeToastMessages = {
    ru: { light: 'Включена светлая тема', dark: 'Включена тёмная тема' },
    uk: { light: 'Увімкнено світлу тему', dark: 'Увімкнено темну тему' },
    en: { light: 'Light theme enabled', dark: 'Dark theme enabled' }
};

function showThemeToast(theme) {
    if (!window.toast) return;
    const lang = (window.getCurrentLanguage && window.getCurrentLanguage()) || 'ru';
    const msg = themeToastMessages[lang] || themeToastMessages.ru;

    // Та же иконка, что и в дропдауне (fa-sun / fa-moon), см. updateThemeToggleUI()
    const iconEl = document.createElement('i');
    iconEl.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';

    window.toast.add({
        title: theme === 'dark' ? msg.dark : msg.light,
        icon: iconEl,
        timeout: 2600
    });
}

// Основная функция переключения
function setTheme(theme, saveToStorage = true) {
    if (theme === 'dark') {
        html.classList.add('dark');
        body.classList.add('dark'); // на всякий случай
        lightBtn?.classList.remove('active');
        darkBtn?.classList.add('active');
    } else {
        html.classList.remove('dark');
        body.classList.remove('dark');
        darkBtn?.classList.remove('active');
        lightBtn?.classList.add('active');
    }

    // Тост только при реальном переключении пользователем, не при
    // восстановлении сохранённой/системной темы на загрузке страницы
    // (initTheme() всегда вызывает setTheme с saveToStorage=false).
    if (saveToStorage) {
        localStorage.setItem('theme', theme);
        showThemeToast(theme);
    }

    updateThemeToggleUI();
}

// Определение начальной темы
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        setTheme(savedTheme, false);
    } else {
        // Если нет сохранённой — используем системную
        setTheme(prefersDark ? 'dark' : 'light', false);
    }
}

// Обновление текста и иконки в дропдауне
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

// ==================== Обработчики ====================

// Кнопки Светлая / Тёмная (если есть)
lightBtn?.addEventListener('click', () => setTheme('light'));
darkBtn?.addEventListener('click', () => setTheme('dark'));

// Основная кнопка в дропдауне
if (themeToggleItemEl) {
    themeToggleItemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCurrentlyDark = html.classList.contains('dark');
        setTheme(isCurrentlyDark ? 'light' : 'dark');
    });
}

// Слушаем изменение системной темы (если пользователь меняет в настройках ОС)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateThemeToggleUI();
});