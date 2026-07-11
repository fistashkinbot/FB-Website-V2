// ==================== THEME TOGGLE ====================
const lightBtn = document.getElementById('light-btn');
const darkBtn = document.getElementById('dark-btn');
const body = document.body;

function setTheme(theme) {
    if (theme === 'dark') {
        body.classList.add('dark');
        if (lightBtn) lightBtn.classList.remove('active');
        if (darkBtn) darkBtn.classList.add('active');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark');
        if (darkBtn) darkBtn.classList.remove('active');
        if (lightBtn) lightBtn.classList.add('active');
        localStorage.setItem('theme', 'light');
    }
    updateThemeToggleUI();
}

// Load saved theme or default to dark
const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

if (lightBtn) lightBtn.addEventListener('click', () => setTheme('light'));
if (darkBtn) darkBtn.addEventListener('click', () => setTheme('dark'));

// ==================== SINGLE THEME TOGGLE (именно та кнопка, которую ты показал) ====================
function updateThemeToggleUI() {
    const toggleItem = document.getElementById('theme-toggle-item');
    const icon = document.getElementById('theme-toggle-icon');
    const textEl = document.getElementById('theme-toggle-text');
    if (!toggleItem || !icon || !textEl) return;

    const isDark = body.classList.contains('dark');
    const currentLang = (window.getCurrentLanguage && window.getCurrentLanguage()) || 'ru';
    const t = window.translations || {};
    const langTranslations = t[currentLang] || t.ru || {};

    if (isDark) {
        icon.className = 'fa-solid fa-sun';
        textEl.dataset.i18n = 'dropdown_theme_light';
        textEl.textContent = langTranslations.dropdown_theme_light || 'Включить светлую тему';
    } else {
        icon.className = 'fa-solid fa-moon';
        textEl.dataset.i18n = 'dropdown_theme_dark';
        textEl.textContent = langTranslations.dropdown_theme_dark || 'Включить тёмную тему';
    }
}

// Initial update
updateThemeToggleUI();

// Клик именно на ту кнопку, которую ты показал
const themeToggleItemEl = document.getElementById('theme-toggle-item');
if (themeToggleItemEl) {
    themeToggleItemEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCurrentlyDark = body.classList.contains('dark');
        const newTheme = isCurrentlyDark ? 'light' : 'dark';
        setTheme(newTheme);
    });
}
