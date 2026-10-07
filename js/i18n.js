// === Переводы ===
const translations = {
    ru: {
        // Мета-теги
        meta_title: "FistashkinBot",
        meta_og_title: "Fistashkin — Дискорд Бот!",
        meta_og_description: "Простой многоцелевой бот Discord созданный с любовью. Рейтинг, Автомод, Музыка и многое другое~",

        // Меню навигации
        menu_btn_home: " Главная",
        menu_btn_features: " Возможности",
        menu_btn_contributors: " Команда",
        menu_btn_docs: " Доки",
        menu_btn_change_lang: " Язык",

        // Главная секция
        home_content_text_1: "Привет, меня зовут",
        home_content_text_2: "Фисташкин",
        home_content_text_3: "и я ",
        home_cta_button: " Добавить в Discord",
        home_cta_button_back: " На главную",

        // Секция возможностей
        features_title: "Мои возможности",
        features_card1_title: "🛠️ Утилиты",
        features_card1_text: "Со стандартным набором команд Вы можете посмотреть информацию про участников сервера и про сам сервер, посмотреть аватар пользователя и саму информацию о боте, установить уникальный текст в свой профиль!",
        features_card2_title: "✨ Экономика",
        features_card2_text: "Вы можете стать аристократом по балансу или лидером в топе по уровню среди участников просто общаясь! Если хотите потратить свои сбережения - для вас есть настраиваемый магазин с ролями, но для азартных игроков тоже найдётся местечко!",
        features_card3_title: "🛡️ Модерация",
        features_card3_text: "Инструменты для поддержания порядка, безопасности и комфортной атмосферы на сервере: команды бана, кика и таймаута, а также другие инструменты модерации.",
        features_card4_title: "🧹 Автомодерация",
        features_card4_text: "Автоматическая модерация фильтрует спам, ссылки, упоминания и запрещённые слова по гибким правилам — сервер остаётся чистым без постоянного участия модераторов.",
        features_card5_title: "🔒 Приватные комнаты",
        features_card5_text: "Создавайте временные приватные текстовые и голосовые комнаты для себя и своих друзей — с гибкими правами доступа и автоматическим удалением, когда комната больше не нужна.",
        features_card6_title: "📋 Система аудита",
        features_card6_text: "Видит всё, что упускает стандартный аудит Discord: удаления и правки сообщений, вход и выход из голосовых каналов, смену ролей. Логи прилетают прямо к вам через вебхуки.",
        features_card7_title: "🎭 Развлечение",
        features_card7_text: "Обнимашки, подмигивания и другие реакции для общения с участниками сервера, свадьбы (бракосочетания), а также дуэли, крестики-нолики и другие мини-игры прямо в Discord!",
        features_card8_title: "🧠 ИИ-чат",
        features_card8_text: "Общайтесь с AI прямо в Discord и получайте ответы на вопросы без сторонних сервисов.",
        features_card9_title: "🏆 Рейтинг участников",
        features_card9_text: "Активность — это игра! Зарабатывайте фисташки за общение, поднимайтесь в топе лидеров и обменивайте статус на эксклюзивные роли.",

        // Секция команды
        contributors_title: "Команда",
        contributor_role_owner: " Владелец",
        contributor_role_developer: " Разработчик",
        contributor_role_helper: " Помощник",
        contributor_role_friend: " Друг",
        contributor_role_tester: " Бета тестер",
        contributor_role_supporter: " Сторонник",

        // Футер
        footer_not_affiliated: "Мы не являемся аффилированным лицом компании Discord Inc.",
        footer_social_title: "Присоединяйтесь к сообществу",
        footer_partners_title: "Партнёры",
        footer_docs_title: "Документация",
        footer_support_title: "Поддержка",
        footer_stored_data: "Хранящиеся данные",
        footer_permissions: "Разрешения на использования команд",
        footer_patreon: "Patreon",
        footer_support_server: "Сервер поддержки",
        footer_privacy: "Конфиденциальность",
        footer_terms: "Условия использования",
        footer_copyright: "Все права защищены",

        // Loader
        loader_loading: "Загрузка...",

        strings_typing: [
            "простой",
            "мощный",
            "лёгкий в использовании",
            "милый",
            "«сделан с любовью»",
            "горячий",
            "«хорошо развитый»",
            "хороший",
            "крутой",
            "классный"
        ],
        dropdown_navigation: "Навигация",
        dropdown_settings: "Настройки",
        dropdown_language: "Язык:",
        dropdown_theme_light: "Включить светлую тему",
        dropdown_theme_dark: "Включить тёмную тему",

        not_found_error_heading: "Ой... Страница потерялась",
        not_found_error_message: "Фисташкин немного заблудился... Мы уже ищем его. Попробуйте зайти позже.",
        internal_server_error_heading: "Внутренняя ошибка сервера",
        internal_server_error_message: "Фисташкин немного перегрелся... Мы уже чиним. Попробуй зайти позже.",

        docs_btn_copy: "Копировать",
        docs_btn_copy_copied: "Скопировано!",
        docs_btn_copy_page_copied: "Скопировано",
        docs_search_placeholder: "Поиск...",
        docs_input_search_placeholder: "Поиск в документации...",
        docs_input_search_empty: "Начните вводить текст для поиска...",
        docs_search_hint: "Ищите по заголовкам и названиям страниц",
        docs_search_no_results: "Ничего не найдено",
        docs_search_try_another: "Попробуйте изменить запрос",
        docs_search_on_page: "На этой странице",
        docs_search_other_pages: "На других страницах",
        docs_search_all_pages: "Результаты поиска",
        docs_search_kbd_nav: "— навигация",
        docs_search_kbd_go: "— перейти",

        docs_btn_page_nav_prev: "Предыдущая страница",
        docs_btn_page_nav_next: "Следующая страница",
        docs_page_nav_not_found: "Страница не найдена",

        docs_toc_title: "НА ЭТОЙ СТРАНИЦЕ",
        docs_last_updated: "Последнее обновление:",
        docs_last_updated_just_now: "только что",
        docs_reltime_minutes_ago: "мин. назад",
        docs_reltime_hours_ago: "ч. назад",
        docs_reltime_today: "сегодня",
        docs_reltime_days: "дн. назад",
        docs_reltime_months: "мес. назад",
        docs_reltime_years: "г. назад",
        docs_reltime_unknown: "неизвестно",
        docs_yesterday_at: "вчера в",

        docs_sidebar_made_with: "Made with ❤️",
        docs_load_error_heading: "Ошибка загрузки",
        docs_load_error_message: "Не удалось загрузить SUMMARY.md. Убедитесь, что файл существует в папке",
        docs_load_error_message_doc: "Не удалось загрузить документацию.",
        docs_page_not_found_heading: "Страница не найдена",
        docs_page_not_found_message: "Файл не найден в папке",

        // Секция статуса (Таймер)
        status_title_1: "Мы придем,",
        status_title_2: "но надо подождать",
        status_days: "Дней",
        status_hours: "Часов",
        status_minutes: "Минут",
        status_seconds: "Секунд",
        status_text: `
            На данный момент я (главный разработчик) пережил сложный этап в своей жизни и проект был перенесен. Но я и моя команда сейчас понемногу пытаемся продолжать работать над ним!
        `,
        status_image_src: "assets/stop-war-ru.jpg",
    },
    uk: {
        // Мета-теги
        meta_title: "FistashkinBot",
        meta_og_title: "Fistashkin — Discord-бот!",
        meta_og_description: "Простий багатофункціональний Discord-бот, створений з любов'ю. Рейтинг, Автомод, Музика та багато іншого~",

        // Меню навигации
        menu_btn_home: " Головна",
        menu_btn_features: " Можливості",
        menu_btn_contributors: " Команда",
        menu_btn_docs: " Документація",
        menu_btn_change_lang: " Мова",

        // Главная секция
        home_content_text_1: "Привіт, мене звуть",
        home_content_text_2: "Фісташкін",
        home_content_text_3: "і я ",
        home_cta_button: " Додати в Discord",
        home_cta_button_back: " На головну",

        // Секция возможностей
        features_title: "Мої можливості",
        features_card1_title: "🛠️ Утиліти",
        features_card1_text: "За допомогою стандартного набору команд ви можете переглянути інформацію про учасників сервера та про сам сервер, подивитися аватар користувача та інформацію про бота, встановити унікальний текст у свій профіль!",
        features_card2_title: "✨ Економіка",
        features_card2_text: "Ви можете стати аристократом за балансом або лідером у топі за рівнем просто спілкуючись! Якщо захочете витратити свої заощадження — для вас є налаштовуваний магазин з ролями, а для азартних гравців також знайдеться чим зайнятися!",
        features_card3_title: "🛡️ Модерація",
        features_card3_text: "Інструменти для підтримання порядку, безпеки та комфортної атмосфери на сервері: команди бану, кіку та таймауту, а також інші інструменти модерації.",
        features_card4_title: "🧹 Автомодерація",
        features_card4_text: "Автоматична модерація фільтрує спам, посилання, згадки та заборонені слова за гнучкими правилами — сервер залишається чистим без постійної участі модераторів.",
        features_card5_title: "🔒 Приватні кімнати",
        features_card5_text: "Створюйте тимчасові приватні текстові та голосові кімнати для себе та своїх друзів — із гнучкими правами доступу та автоматичним видаленням, коли кімната більше не потрібна.",
        features_card6_title: "📋 Система аудиту",
        features_card6_text: "Бачить усе, що пропускає стандартний аудит Discord: видалення й редагування повідомлень, вхід і вихід із голосових каналів, зміну ролей. Логи летять просто до вас через вебхуки.",
        features_card7_title: "🎭 Розваги",
        features_card7_text: "Обійняшки, підморгування та інші реакції для спілкування з учасниками сервера, весілля (одруження), а також дуелі, хрестики-нолики та інші міні-ігри прямо в Discord!",
        features_card8_title: "🧠 ШІ-чат",
        features_card8_text: "Спілкуйтеся з AI прямо в Discord та отримуйте відповіді на запитання без сторонніх сервісів.",
        features_card9_title: "🏆 Рейтинг учасників",
        features_card9_text: "Активність — це гра! Заробляйте фісташки за спілкування, підіймайтеся в топі лідерів та обмінюйте статус на ексклюзивні ролі.",

        // Секция команды
        contributors_title: "Команда",
        contributor_role_owner: " Власник",
        contributor_role_developer: " Розробник",
        contributor_role_helper: " Помічник",
        contributor_role_friend: " Друг",
        contributor_role_tester: " Бета-тестер",
        contributor_role_supporter: " Підтримувач",

        // Футер
        footer_not_affiliated: "Ми не є афілійованою особою компанії Discord Inc.",
        footer_social_title: "Приєднуйтесь до спільноти",
        footer_partners_title: "Партнери",
        footer_docs_title: "Документація",
        footer_support_title: "Підтримка",
        footer_stored_data: "Зберігані дані",
        footer_permissions: "Дозволи на використання команд",
        footer_patreon: "Patreon",
        footer_support_server: "Сервер підтримки",
        footer_privacy: "Конфіденційність",
        footer_terms: "Умови використання",
        footer_copyright: "Усі права захищено",

        // Loader
        loader_loading: "Завантаження...",

        strings_typing: [
            "простий",
            "потужний",
            "легкий у використанні",
            "милий",
            "«зроблений з любов'ю»",
            "гарячий",
            "«добре розвинений»",
            "хороший",
            "крутий",
            "класний"
        ],
        dropdown_navigation: "Навігація",
        dropdown_settings: "Налаштування",
        dropdown_language: "Мова:",
        dropdown_theme_light: "Увімкнути світлу тему",
        dropdown_theme_dark: "Увімкнути темну тему",

        not_found_error_heading: "Ой... Сторінка загубилася",
        not_found_error_message: "Фісташкін трохи заблукав... Ми вже шукаємо його. Спробуйте зайти пізніше.",
        internal_server_error_heading: "Внутрішня помилка сервера",
        internal_server_error_message: "Фисташкин трохи перегрівся... Ми вже чинимо. Спробуйте зайти пізніше.",

        docs_btn_copy: "Копіювати",
        docs_btn_copy_copied: "Скопійовано!",
        docs_btn_copy_page_copied: "Скопійовано",
        docs_search_placeholder: "Пошук...",
        docs_input_search_placeholder: "Пошук у документації...",
        docs_input_search_empty: "Почніть вводити текст для пошуку...",
        docs_search_hint: "Шукайте за заголовками та назвами сторінок",
        docs_search_no_results: "Нічого не знайдено",
        docs_search_try_another: "Спробуйте змінити запит",
        docs_search_on_page: "На цій сторінці",
        docs_search_other_pages: "На інших сторінках",
        docs_search_all_pages: "Результати пошуку",
        docs_search_kbd_nav: "— навігація",
        docs_search_kbd_go: "— перейти",

        docs_btn_page_nav_prev: "Попередня сторінка",
        docs_btn_page_nav_next: "Наступна сторінка",
        docs_page_nav_not_found: "Сторінку не знайдено",

        docs_toc_title: "НА ЦІЙ СТОРІНЦІ",
        docs_last_updated: "Останнє оновлення:",
        docs_last_updated_just_now: "щойно",
        docs_reltime_minutes_ago: "хв. тому",
        docs_reltime_hours_ago: "год. тому",
        docs_reltime_today: "сьогодні",
        docs_reltime_days: "дн. тому",
        docs_reltime_months: "міс. тому",
        docs_reltime_years: "р. тому",
        docs_reltime_unknown: "невідомо",
        docs_yesterday_at: "вчора о",

        docs_sidebar_made_with: "Made with ❤️",
        docs_load_error_heading: "Помилка завантаження",
        docs_load_error_message: "Не вдалося завантажити SUMMARY.md. Переконайтеся, що файл існує в папці",
        docs_load_error_message_doc: "Не вдалося завантажити документацію.",
        docs_page_not_found_heading: "Сторінку не знайдено",
        docs_page_not_found_message: "Файл не знайдено в папці",
        // Секция статуса (Таймер)
        status_title_1: "Ми прийдемо,",
        status_title_2: "але треба зачекати",
        status_days: "Днів",
        status_hours: "Годин",
        status_minutes: "Хвилин",
        status_seconds: "Секунд",
        status_text: `
            На даний момент я (головний розробник) пережив складний етап у своєму житті, і проєкт було перенесено. Але я та моя команда зараз потроху намагаємося продовжувати працювати над ним!
        `,
        status_image_src: "assets/stop-war-ru.jpg",
    },
    en: {
        // Meta tags
        meta_title: "FistashkinBot",
        meta_og_title: "Fistashkin — Discord Bot!",
        meta_og_description: "A simple multi-purpose Discord bot created with love. Rating, AutoMod, Music and much more~",

        // Navigation menu
        menu_btn_home: " Home",
        menu_btn_features: " Features",
        menu_btn_contributors: " Team",
        menu_btn_docs: " Docs",
        menu_btn_change_lang: " Language",

        // Home section
        home_content_text_1: "Hello, my name is",
        home_content_text_2: "Fistashkin",
        home_content_text_3: "and I am ",
        home_cta_button: " Add to Discord",
        home_cta_button_back: " Back to Home",

        // Features section
        features_title: "My Features",
        features_card1_title: "🛠️ Utilities",
        features_card1_text: "With a standard set of commands, you can view information about server members and the server itself, view a user's avatar and information about the bot, set a unique text in your profile!",
        features_card2_title: "✨ Economy",
        features_card2_text: "You can become an aristocrat by balance or a leader in the level top among participants just by chatting! If you want to spend your savings - there is a customizable store with roles, but there is also a place for gambling players!",
        features_card3_title: "🛡️ Moderation",
        features_card3_text: "Tools to keep your server orderly, safe, and welcoming: ban, kick, and timeout commands, plus other moderation tools.",
        features_card4_title: "🧹 Automod",
        features_card4_text: "Automatic moderation filters spam, links, mentions, and forbidden words using flexible rules — keeping your server clean without moderators having to watch it around the clock.",
        features_card5_title: "🔒 Private Rooms",
        features_card5_text: "Create temporary private text and voice rooms for you and your friends — with flexible access permissions and automatic deletion once the room is no longer needed.",
        features_card6_title: "📋 Audit System",
        features_card6_text: "Sees everything Discord's own audit log misses: message edits and deletions, voice channel joins and leaves, role changes — delivered straight to you via webhooks.",
        features_card7_title: "🎭 Entertainment",
        features_card7_text: "Hugs, winks and other reactions to interact with server members, marriages, plus duels, tic-tac-toe and other mini-games right in Discord!",
        features_card8_title: "🧠 AI Chat",
        features_card8_text: "Chat with AI right in Discord and get answers to your questions without third-party services.",
        features_card9_title: "🏆 Member Leaderboard",
        features_card9_text: "Activity is a game! Earn pistachios for chatting, climb the leaderboard, and cash in your status for exclusive roles.",

        // Contributors section
        contributors_title: "Team",
        contributor_role_owner: " Owner",
        contributor_role_developer: " Developer",
        contributor_role_helper: " Helper",
        contributor_role_friend: " Friend",
        contributor_role_tester: " Beta Tester",
        contributor_role_supporter: " Supporter",

        // Footer
        footer_not_affiliated: "We are not affiliated with Discord Inc.",
        footer_social_title: "Join the community",
        footer_partners_title: "Partners",
        footer_docs_title: "Documentation",
        footer_support_title: "Support",
        footer_stored_data: "Stored Data",
        footer_permissions: "Permissions to Use Commands",
        footer_patreon: "Patreon",
        footer_support_server: "Support Server",
        footer_privacy: "Privacy",
        footer_terms: "Terms of Use",
        footer_copyright: "All rights reserved",

        // Loader
        loader_loading: "Loading...",

        strings_typing: [
            "simple",
            "powerful",
            "easy to use",
            "cute",
            "«made with love»",
            "hot",
            "«well-developed»",
            "nice",
            "cool",
            "awesome"
        ],
        dropdown_navigation: "Navigation",
        dropdown_settings: "Settings",
        dropdown_language: "Language:",
        dropdown_theme_light: "Switch to light theme",
        dropdown_theme_dark: "Switch to dark theme",

        not_found_error_heading: "Oops... Page got lost",
        not_found_error_message: "Fistashkin got a bit lost... We're already looking for him. Try visiting later.",
        internal_server_error_heading: "Internal Server Error",
        internal_server_error_message: "Fistashkin got a bit overheated... We're already fixing it. Try visiting later.",

        docs_btn_copy: "Copy",
        docs_btn_copy_copied: "Copied!",
        docs_btn_copy_page_copied: "Copied",
        docs_search_placeholder: "Search...",
        docs_input_search_placeholder: "Search documentation...",
        docs_input_search_empty: "Start typing to search...",
        docs_search_hint: "Search by headings and page titles",
        docs_search_no_results: "Nothing found",
        docs_search_try_another: "Try a different query",
        docs_search_on_page: "On this page",
        docs_search_other_pages: "On other pages",
        docs_search_all_pages: "Search results",
        docs_search_kbd_nav: "— navigate",
        docs_search_kbd_go: "— open",

        docs_btn_page_nav_prev: "Previous page",
        docs_btn_page_nav_next: "Next page",
        docs_page_nav_not_found: "Page not found",
        docs_toc_title: "ON THIS PAGE",
        docs_last_updated: "Last updated:",
        docs_last_updated_just_now: "just now",
        docs_reltime_minutes_ago: "min ago",
        docs_reltime_hours_ago: "h ago",
        docs_reltime_today: "today",
        docs_reltime_days: "days ago",
        docs_reltime_months: "months ago",
        docs_reltime_years: "years ago",
        docs_reltime_unknown: "unknown",
        docs_yesterday_at: "yesterday at",

        docs_sidebar_made_with: "Made with ❤️",
        docs_load_error_heading: "Load Error",
        docs_load_error_message: "Failed to load SUMMARY.md. Make sure the file exists in the folder",
        docs_load_error_message_doc: "Failed to load documentation.",
        docs_page_not_found_heading: "Page not found",
        docs_page_not_found_message: "File not found in folder",
        // Status section (Timer)
        status_title_1: "We will come,",
        status_title_2: "but we need to wait",
        status_days: "Days",
        status_hours: "Hours",
        status_minutes: "Minutes",
        status_seconds: "Seconds",
        status_text: `
            At the moment I (the lead developer) have been through a difficult period in my life and the project was postponed. But my team and I are now slowly trying to keep working on it!
        `,
        status_image_src: "assets/stop-war-en.jpg",
    }
};

// === Обновление мета-тегов ===
function updateMetaTags(lang) {
    const t = translations[lang];
    if (!t) return;

    const map = {
        'title': ['textContent', t.meta_title],
        'meta[property="og:title"]': ['content', t.meta_og_title],
        'meta[property="og:description"]': ['content', t.meta_og_description],
    };

    Object.entries(map).forEach(([selector, [attr, value]]) => {
        const el = document.querySelector(selector);
        if (el && value) {
            attr === 'textContent'
                ? el.textContent = value
                : el.setAttribute(attr, value);
        }
    });
}

// Хелпер: получить строку перевода по ключу (с fallback на ru и сам ключ).
// Используется из docs.js, чтобы не дублировать проверки window.translations.
function t(key, lang) {
    lang = lang || window.getCurrentLanguage?.() || 'ru';
    const pack = (window.translations && window.translations[lang]) || {};
    const fallback = (window.translations && window.translations.ru) || {};
    return pack[key] != null ? pack[key] : (fallback[key] != null ? fallback[key] : key);
}

// === Основная функция перевода ===
function translatePage(lang) {
    const pack = translations[lang];
    if (!pack) return;

    // Обычный текст (безопасно, через textContent)
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (key in pack) el.textContent = pack[key];
    });

    // HTML-форматирование (через innerHTML) — для доверенных ключей
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.dataset.i18nHtml;
        if (key in pack) el.innerHTML = pack[key];
    });

    // Плейсхолдеры для input-полей
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (key in pack) el.placeholder = pack[key];
    });

    // src для картинок (зависит от языка)
    document.querySelectorAll('[data-i18n-src]').forEach(el => {
        const key = el.dataset.i18nSrc;
        if (key in pack) el.src = pack[key];
    });

    // Обновляем динамические части docs, если они уже отрендерены
    const copyBtn = document.getElementById('doc-copy-btn');
    if (copyBtn && pack.docs_btn_copy) {
        const span = copyBtn.querySelector('span[data-i18n="docs_btn_copy"]');
        if (span) span.textContent = pack.docs_btn_copy;
    }

    initTyped(lang);
    updateMetaTags(lang);
}

// Доступ к переводам/текущему языку для других скриптов (например theme.js)
window.translations = translations;
window.t = t;
window.getCurrentLanguage = function () {
    return document.documentElement.dataset.lang || localStorage.getItem('siteLanguage') || 'ru';
};

// === Плавная подмена текста при смене языка ===
const I18N_FADE_MS = 200;

function translatePageAnimated(lang, afterUpdate) {
    const elements = document.querySelectorAll(
        '[data-i18n], [data-i18n-html], [data-i18n-placeholder], [data-i18n-src], .typing, #current-flag'
    );

    const applyUpdate = () => {
        translatePage(lang);
        afterUpdate?.();
    };

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!elements.length || reduceMotion) {
        applyUpdate();
        return;
    }

    elements.forEach(el => el.classList.add('i18n-fading'));

    setTimeout(() => {
        applyUpdate();
        void document.body.offsetHeight;
        elements.forEach(el => el.classList.remove('i18n-fading'));
    }, I18N_FADE_MS);
}

// === Смена языка ===
function setLanguage(lang) {
    if (!translations[lang]) return;

    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;

    translatePageAnimated(lang, () => updateLanguageSwitcher(lang));
    localStorage.setItem('siteLanguage', lang);

    // Хук для перезагрузки документации при смене языка
    if (typeof window.__onDocLangChange === 'function') {
        window.__onDocLangChange(lang);
    }

    // Обновляем подпись кнопки переключения темы под новый язык
    if (typeof window.updateThemeToggleUI === 'function') {
        window.updateThemeToggleUI();
    }
}

// === Toast ===
const toastMessages = {
    ru: { flag: './assets/flags/flag-russia.svg', text: 'Язык изменён на Русский' },
    uk: { flag: './assets/flags/flag-ukraine.svg', text: 'Мову змінено на Українську' },
    en: { flag: './assets/flags/flag-united-states.svg', text: 'Language changed to English' }
};

function showLanguageToast(lang) {
    if (!window.toast) return;
    const msg = toastMessages[lang];

    window.toast.add({
        title: msg ? msg.text : 'Language changed',
        icon: msg ? msg.flag : undefined,
        timeout: 2600
    });
}

// === Typed ===
let typedInstance = null;

function initTyped(lang) {
    const el = document.querySelector('.typing');
    const strings = translations[lang]?.strings_typing;
    if (!el || !strings) return;

    if (typedInstance) typedInstance.destroy();

    typedInstance = new Typed(el, {
        strings,
        typeSpeed: 120,
        backSpeed: 80,
        loop: true,
    });
}

// === Language Switcher ===
const languages = {
    ru: { name: "Русский", flag: "./assets/flags/flag-russia.svg" },
    uk: { name: "Українська", flag: "./assets/flags/flag-ukraine.svg" },
    en: { name: "English", flag: "./assets/flags/flag-united-states.svg" }
};

let currentDropdown = null;
let isDropdownOpen = false;
let currentButton = null;
let rafId = null;

function createLanguageDropdown() {
    currentDropdown?.remove();

    const dropdown = document.createElement('div');
    dropdown.className = 'language-dropdown-js';
    dropdown.style.cssText = `
        position: fixed;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
    `;

    Object.entries(languages).forEach(([key, data]) => {
        const option = document.createElement('div');
        option.className = 'language-option';
        option.dataset.lang = key;

        option.style.cssText = `
            display: flex; align-items: center; gap: 12px;
            padding: 12px 18px; cursor: pointer;
            transition: 0.2s;
        `;

        option.innerHTML = `
            <img src="${data.flag}" style="
                width: 24px;
                height: 16px;
                object-fit: cover;
                border-radius: 4px;
                display: block;
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
            ">
            <span>${data.name}</span>
        `;

        option.onclick = e => {
            e.stopPropagation();
            const currentLang = document.documentElement.dataset.lang || localStorage.getItem('siteLanguage') || 'ru';
            if (key === currentLang) {
                return;
            }
            setLanguage(key);
            showLanguageToast(key);
            closeDropdown();
        };

        dropdown.appendChild(option);
    });

    document.body.appendChild(dropdown);
    return currentDropdown = dropdown;
}

function positionDropdown() {
    if (!currentDropdown || !currentButton) return;
    const rect = currentButton.getBoundingClientRect();

    currentDropdown.style.top = `${rect.bottom + 8}px`;
    currentDropdown.style.left = `${rect.left + rect.width / 2}px`;
}

function startTracking() {
    const loop = () => {
        if (!isDropdownOpen) return;
        positionDropdown();
        rafId = requestAnimationFrame(loop);
    };
    loop();
}

function stopTracking() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
}

function openDropdown(button) {
    if (!currentDropdown) createLanguageDropdown();

    currentButton = button;
    isDropdownOpen = true;
    button.classList.add('active');

    positionDropdown();
    startTracking();

    setTimeout(() => {
        currentDropdown.style.opacity = '1';
        currentDropdown.style.visibility = 'visible';
        currentDropdown.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
}

function closeDropdown() {
    if (!currentDropdown) return;

    isDropdownOpen = false;
    stopTracking();
    currentButton?.classList.remove('active');

    currentDropdown.style.opacity = '0';
    currentDropdown.style.transform = 'translateX(-50%) translateY(8px)';

    setTimeout(() => {
        if (!isDropdownOpen) currentDropdown.style.visibility = 'hidden';
    }, 250);
}

function updateLanguageSwitcher(lang) {
    const el = document.getElementById('current-flag');
    if (el && languages[lang]) {
        el.innerHTML = `<img src="${languages[lang].flag}" style="width:100%; height:100%; display:block; object-fit:cover;">`;
    }

    const label = document.getElementById('lang-switcher-label');
    if (label && languages[lang]) {
        const pack = translations[lang] || translations.ru;
        label.textContent = `${pack.dropdown_language} ${languages[lang].name}`;
    }

    renderInlineLangOptions(lang);
}

function renderInlineLangOptions(current) {
    const container = document.getElementById('lang-inline-list-inner');
    if (!container) return;

    container.innerHTML = '';

    Object.entries(languages).forEach(([key, data]) => {
        const option = document.createElement('div');
        option.className = 'lang-inline-option' + (key === current ? ' active' : '');
        option.dataset.lang = key;

        option.innerHTML = `
            <div class="flag"><img src="${data.flag}" style="width:100%;height:100%;display:block;object-fit:cover;"></div>
            <span>${data.name}</span>
            <svg class="lang-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        `;

        option.addEventListener('click', e => {
            e.stopPropagation();
            const currentLang = document.documentElement.dataset.lang || localStorage.getItem('siteLanguage') || 'ru';
            if (key === currentLang) {
                return;
            }
            setLanguage(key);
            showLanguageToast(key);
            toggleInlineLangAccordion(false);
        });

        container.appendChild(option);
    });
}

function toggleInlineLangAccordion(forceOpen) {
    const list = document.getElementById('lang-inline-list');
    const trigger = document.getElementById('lang-switcher-menu');
    if (!list || !trigger) return;

    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !list.classList.contains('open');
    list.classList.toggle('open', shouldOpen);
    trigger.classList.toggle('open', shouldOpen);
}

function initLanguageSwitcher() {
    const button = document.getElementById('lang-button');
    if (!button) return;

    document.getElementById('lang-dropdown')?.remove();

    button.onclick = e => {
        e.stopPropagation();
        isDropdownOpen ? closeDropdown() : openDropdown(button);
    };

    document.addEventListener('click', e => {
        if (currentDropdown && !button.contains(e.target)) closeDropdown();
    });
}

(function init() {
    const savedLang = localStorage.getItem('siteLanguage') || 'ru';

    translatePage(savedLang);
    initLanguageSwitcher();
    updateLanguageSwitcher(savedLang);

    document.querySelectorAll('.lang-switcher button').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            const currentLang = document.documentElement.dataset.lang || localStorage.getItem('siteLanguage') || 'ru';
            if (lang === currentLang) {
                return;
            }
            setLanguage(lang);
            showLanguageToast(lang);
        });
    });

    const langMenuItem = document.getElementById('lang-switcher-menu');
    if (langMenuItem) {
        langMenuItem.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            toggleInlineLangAccordion();
        });
    }
})();