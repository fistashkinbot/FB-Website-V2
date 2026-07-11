// ==================== GLOW CARDS ====================
// Много вариантов цвета свечения для карточек фич (.dm-glow-card).
// При каждой перезагрузке страницы карточкам случайно (и без повторов,
// пока цветов хватает) назначаются новые цвета из палитры ниже.

const GLOW_COLOR_PALETTE = [
    "rgba(168, 85, 247, 0.22)",  // фиолетовый
    "rgba(59, 130, 246, 0.22)",  // синий
    "rgba(239, 68, 68, 0.22)",   // красный
    "rgba(236, 72, 153, 0.22)",  // розовый
    "rgba(34, 197, 94, 0.22)",   // зелёный
    "rgba(192, 105, 78, 0.3)",   // терракотовый
    "rgba(6, 182, 212, 0.22)",   // бирюзовый
    "rgba(234, 179, 8, 0.22)",   // жёлтый
    "rgba(99, 102, 241, 0.22)",  // индиго
    "rgba(20, 184, 166, 0.22)",  // teal
    "rgba(244, 63, 94, 0.22)",   // малиновый
    "rgba(132, 204, 22, 0.22)",  // лайм
    "rgba(14, 165, 233, 0.22)",  // голубой
    "rgba(217, 70, 239, 0.22)",  // пурпурный
];

// Перемешивание Фишера — Йетса
function shuffleArray(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Раздаём каждой .dm-glow-card случайный цвет из палитры (инлайн-стиль
// переопределяет фиксированный --glow-color, заданный классом glow-* в CSS)
function applyRandomGlowColors() {
    const cards = document.querySelectorAll(".dm-glow-card");
    if (!cards.length) return;

    const palette = shuffleArray(GLOW_COLOR_PALETTE);
    cards.forEach((card, i) => {
        card.style.setProperty("--glow-color", palette[i % palette.length]);
    });
}

// Свечение следует за курсором внутри карточки
function initGlowTracking() {
    const glowEls = document.querySelectorAll(".dm-glow-card, .cardd");
    glowEls.forEach((card) => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--xPos", `${e.clientX - rect.left}px`);
            card.style.setProperty("--yPos", `${e.clientY - rect.top}px`);
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    applyRandomGlowColors();
    initGlowTracking();
});