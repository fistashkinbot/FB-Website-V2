// ==================== DROPDOWN MENU LOGIC (универсально для всех дропдаунов) ====================
// Раньше тут был один дропдаун (настройки: язык/тема). Теперь этой же логикой
// пользуются два дропдауна: настройки и мобильное меню навигации (вместо
// старого полноэкранного .navbar .menu.active). Оба независимы, но открытие
// одного закрывает другой, и оба закрываются кликом снаружи / по Escape.

const registeredDropdowns = [];

function closeAllDropdowns(exceptMenu) {
    registeredDropdowns.forEach((d) => {
        if (d.menu !== exceptMenu) d.close();
    });
}

function initDropdown(trigger, menu) {
    if (!trigger || !menu) return null;

    // Переносим меню в конец <body>: .navbar сам position: fixed и при .sticky
    // получает свой backdrop-filter, а вложенные backdrop-filter конфликтуют между собой —
    // именно из-за этого блюр пропадал при скролле. Вне навбара конфликта нет.
    document.body.appendChild(menu);

    // Фон/блюр/бордер/тень + позиционирование заданы через inline, как и у языкового
    // флайаута в i18n.js (нужно для fixed + JS positioning).
    menu.style.cssText += `
        position: fixed;
        background-color: var(--dropdown-lang-bg);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(16px) saturate(150%);
        -webkit-backdrop-filter: blur(16px) saturate(150%);
        line-height: 1;
    `;

    let rafId = null;
    const icon = trigger.querySelector('i');

    function positionMenu() {
        const rect = trigger.getBoundingClientRect();
        const menuWidth = menu.offsetWidth || 220;
        const menuHeight = menu.offsetHeight || 0;

        // Прижимаем к правому краю экрана, если меню не помещается справа от триггера
        // (актуально для мобильного бургера, он у самого края навбара)
        let left = rect.left;
        if (left + menuWidth > window.innerWidth - 8) {
            left = Math.max(8, window.innerWidth - menuWidth - 8);
        }

        // Если снизу не хватает места — открываем меню вверх от триггера
        let top = rect.bottom + 8;
        if (top + menuHeight > window.innerHeight - 8 && rect.top - menuHeight - 8 > 0) {
            top = rect.top - menuHeight - 8;
        }

        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
    }

    function startTracking() {
        const loop = () => {
            if (!menu.classList.contains('show')) return;
            positionMenu();
            rafId = requestAnimationFrame(loop);
        };
        loop();
    }

    function stopTracking() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
    }

    function open() {
        closeAllDropdowns(menu);
        positionMenu();
        menu.classList.add('show');
        trigger.setAttribute('aria-expanded', 'true');
        if (icon) icon.classList.add('active');
        startTracking();
    }

    function close() {
        menu.classList.remove('show');
        trigger.setAttribute('aria-expanded', 'false');
        if (icon) icon.classList.remove('active');
        stopTracking();
    }

    // Toggle menu
    trigger.addEventListener('click', (e) => {
        e.stopImmediatePropagation();
        menu.classList.contains('show') ? close() : open();
    });

    // Bonus: keyboard support (Enter/Space on trigger)
    trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            menu.classList.contains('show') ? close() : open();
        }
    });

    // Close menu when clicking on any item
    const items = menu.querySelectorAll('.dropdown-item');
    items.forEach((item) => {
        item.addEventListener('click', () => {
            // Пункты переключения языка и темы не должны закрывать меню
            if (item.dataset.keepOpen === 'true') {
                return;
            }

            close();

            // Demo action for Log out
            if (item.id === 'logout-item') {
                alert('Вы вышли из аккаунта (демо)');
            }
        });
    });

    const api = { trigger, menu, open, close };
    registeredDropdowns.push(api);
    return api;
}

// Close when clicking outside any registered dropdown
document.addEventListener('click', (e) => {
    registeredDropdowns.forEach((d) => {
        if (
            !d.trigger.contains(e.target) &&
            !d.menu.contains(e.target) &&
            !e.target.closest('.language-dropdown-js')
        ) {
            d.close();
        }
    });
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        registeredDropdowns.forEach((d) => d.close());
    }
});

// === Инициализация дропдаунов страницы ===

// Дропдаун настроек (язык/тема + на мобильном — пункты навигации,
// см. .dropdown-mobile-nav в index.html/style.css)
initDropdown(
    document.getElementById('dropdown-trigger'),
    document.getElementById('dropdown-menu')
);

// ==================== ПЛАВНАЯ СМЕНА ИКОНКИ БАРОВ ====================

// ==================== ОЧЕНЬ ПЛАВНЫЙ ПЕРЕХОД ИКОНКИ БАРОВ ====================

// ==================== ПЛАВНАЯ СМЕНА БЕЗ МЕРЦАНИЯ ====================

document.addEventListener("DOMContentLoaded", function () {
    const trigger = document.getElementById("dropdown-trigger");
    const icon = document.getElementById("dropdown-icon") || trigger?.querySelector("i");

    if (!trigger || !icon) return;

    let timeoutId = null;

    const style = document.createElement('style');
    style.textContent = `
        #dropdown-icon {
            transition: opacity 0.28s ease-in-out;
        }
    `;
    document.head.appendChild(style);

    function updateBarsIcon() {
        clearTimeout(timeoutId);

        const isOpen = trigger.getAttribute("aria-expanded") === "true";

        icon.style.opacity = "0";

        timeoutId = setTimeout(() => {
            icon.className = isOpen ? "fa-solid fa-bars-staggered" : "fa-solid fa-bars";
            icon.style.opacity = "1";
        }, 130);
    }

    // Обновляем только при клике по кнопке
    trigger.addEventListener("click", () => {
        setTimeout(updateBarsIcon, 40);
    });

    // Начальное состояние
    setTimeout(() => {
        const isOpen = trigger.getAttribute("aria-expanded") === "true";
        icon.className = isOpen ? "fa-solid fa-bars-staggered" : "fa-solid fa-bars";
    }, 100);
});