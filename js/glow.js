// ==================== GLOW CARDS ====================

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

// Назначаем случайные цвета из палитры
function applyRandomGlowColors() {
    const cards = document.querySelectorAll(".dm-glow-card");
    if (!cards.length) return;

    const palette = shuffleArray(GLOW_COLOR_PALETTE);
    cards.forEach((card, i) => {
        card.style.setProperty("--glow-color", palette[i % palette.length]);
    });
}

// Плавное следование свечения за курсором (lerp)
function initGlowTracking() {
    const cards = document.querySelectorAll(".dm-glow-card");

    cards.forEach(card => {
        let targetX = 0, targetY = 0;
        let currentX = 0, currentY = 0;
        let isAnimating = false;
        const lerpFactor = 0.05; // чем меньше — тем плавнее

        function animate() {
            if (!isAnimating) return;

            currentX += (targetX - currentX) * lerpFactor;
            currentY += (targetY - currentY) * lerpFactor;

            card.style.setProperty("--xPos", `${currentX}px`);
            card.style.setProperty("--yPos", `${currentY}px`);

            requestAnimationFrame(animate);
        }

        card.addEventListener("mouseenter", () => {
            isAnimating = true;
            animate();
        });

        card.addEventListener("mouseleave", () => {
            isAnimating = false;
        });

        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            targetX = e.clientX - rect.left;
            targetY = e.clientY - rect.top;
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    applyRandomGlowColors();
    initGlowTracking();
});