const canvas = document.getElementById('blobCanvas');
const ctx = canvas.getContext('2d');

let blobs = [];
let animationId = 0;
let running = false;
let heroVisible = true;
let lastW = 0;
let lastH = 0;
let W = 0; // логические размеры сцены (CSS px) — физика и рисование работают в них
let H = 0;

const isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
// На тач-устройствах рисуем в половинном разрешении: блобы — это мягкие
// градиенты, разницы глазом нет, а пикселей для заливки в 4 раза меньше.
const RENDER_SCALE = isTouch ? 0.5 : 1;

// FIX (мерцание в Chrome при скролле): пока палец/инерция скроллят страницу,
// не перерисовываем канвас — иначе главный поток и растеризация конкурируют
// с композитором, и слои моргают. Во время скролла показывается последний
// кадр, после остановки (120 мс) анимация продолжается.
let scrolling = false;
let scrollTimer = 0;

// FIX (мерцание блобов при скролле на мобайле):
// раньше canvas мерился по window.innerHeight и слушал window 'resize'.
// В мобильных браузерах (iOS Safari, Chrome Android) при скролле сворачивается
// адресная строка → innerHeight меняется → летит 'resize' → resizeCanvas()
// обнулял canvas.width/height (это стирает канвас) и пересоздавал ВСЕ блобы
// со случайными позициями и цветами. Отсюда «моргание» и смена цветов при
// скролле. Теперь:
//  1) размер берём у контейнера .home (у него height: 100vh — он стабилен);
//  2) реагируем только на реальное изменение размера (ResizeObserver);
//  3) блобы НЕ пересоздаём, а масштабируем координаты под новый размер;
//  4) сразу после смены размера канвас перерисовывается в том же кадре,
//     чтобы не было пустого кадра.
function getHostSize() {
  const host = canvas.parentElement;
  return {
    w: (host && host.clientWidth) || window.innerWidth,
    h: (host && host.clientHeight) || window.innerHeight,
  };
}

function resizeCanvas() {
  const { w, h } = getHostSize();
  if (!w || !h) return;
  if (w === lastW && h === lastH) return; // размер не менялся — ничего не трогаем

  const oldW = lastW;
  const oldH = lastH;
  lastW = w;
  lastH = h;

  W = w;
  H = h;
  canvas.width = Math.round(w * RENDER_SCALE);   // сброс размера очищает канвас — перерисуем ниже
  canvas.height = Math.round(h * RENDER_SCALE);
  ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);

  if (!blobs.length || !oldW || !oldH) {
    blobs = [];
    createBlobs();
  } else {
    const kx = w / oldW;
    const ky = h / oldH;
    const kr = Math.min(w, h) / Math.min(oldW, oldH);
    blobs.forEach(b => {
      b.x *= kx;
      b.targetX *= kx;
      b.y *= ky;
      b.targetY *= ky;
      b.radius *= kr;
    });
  }

  render(performance.now(), false); // без шага симуляции, просто вернуть картинку
}

if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
  new ResizeObserver(resizeCanvas).observe(canvas.parentElement);
} else {
  window.addEventListener('resize', resizeCanvas);
}

// Новая палитра (RGB)
const colors = [
  [168, 85, 247],   // фиолетовый
  [59, 130, 246],   // синий
  [239, 68, 68],    // красный
  [236, 72, 153],   // розовый
  [34, 197, 94],    // зелёный
  [192, 105, 78],   // терракотовый
  [6, 182, 212],    // бирюзовый
  [234, 179, 8],    // жёлтый
  [99, 102, 241],   // индиго
  [20, 184, 166],   // teal
  [244, 63, 94],    // малиновый
  [132, 204, 22],   // лайм
  [14, 165, 233],   // голубой
  [217, 70, 239],   // пурпурный
];

function lerpColor(c1, c2, t) {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return [r, g, b];
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function randomColorIndex(exclude = -1) {
  let idx;
  do {
    idx = Math.floor(Math.random() * colors.length);
  } while (idx === exclude && colors.length > 1);
  return idx;
}

function createBlobs() {
  const numBlobs = 5;
  const minDim = Math.min(W, H);

  for (let i = 0; i < numBlobs; i++) {
    const radius = minDim * 0.55 + Math.random() * minDim * 0.4;

    const colorIndex = randomColorIndex();
    const nextColorIndex = randomColorIndex(colorIndex);

    const centerX = W / 2;
    const centerY = H / 2;
    const spreadX = W * 0.35;
    const spreadY = H * 0.35;

    blobs.push({
      x: centerX + (Math.random() - 0.5) * spreadX * 2,
      y: centerY + (Math.random() - 0.5) * spreadY * 2,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      radius,
      targetX: centerX + (Math.random() - 0.5) * spreadX * 2,
      targetY: centerY + (Math.random() - 0.5) * spreadY * 2,
      colorIndex,
      nextColorIndex,
      colorProgress: Math.random(),
      colorSpeed: 0.0001 + Math.random() * 0.00007,
    });
  }
}

resizeCanvas();

function updateBlobColor(blob) {
  blob.colorProgress += blob.colorSpeed;
  if (blob.colorProgress >= 1) {
    blob.colorProgress = 0;
    blob.colorIndex = blob.nextColorIndex;
    blob.nextColorIndex = randomColorIndex(blob.colorIndex);
  }

  const t = easeInOutCubic(blob.colorProgress);
  const [r, g, b] = lerpColor(colors[blob.colorIndex], colors[blob.nextColorIndex], t);

  // Яркость уменьшена на ~50%
  blob.currentColor = `rgba(${r}, ${g}, ${b}, 0.32)`;
  blob.currentColorSoft = `rgba(${r}, ${g}, ${b}, 0.14)`;
}

function drawBlob(blob, time) {
  ctx.save();
  ctx.translate(blob.x, blob.y);
  ctx.globalCompositeOperation = 'lighter';

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, blob.radius);
  gradient.addColorStop(0, blob.currentColor);
  gradient.addColorStop(0.45, blob.currentColorSoft);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();

  const points = 70;
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const wave1 = Math.sin(angle * 3 + time * 0.0009) * (blob.radius * 0.06);
    const wave2 = Math.cos(angle * 2 + time * 0.0013) * (blob.radius * 0.045);
    const wave3 = Math.sin(angle * 4 + time * 0.0007) * (blob.radius * 0.03);
    const r = blob.radius + wave1 + wave2 + wave3;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function updateBlob(blob) {
  const dx = blob.targetX - blob.x;
  const dy = blob.targetY - blob.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 80) {
    const centerX = W / 2;
    const centerY = H / 2;
    const spreadX = W * 0.4;
    const spreadY = H * 0.4;

    blob.targetX = centerX + (Math.random() - 0.5) * spreadX * 2;
    blob.targetY = centerY + (Math.random() - 0.5) * spreadY * 2;
  }

  blob.vx += dx * 0.00008;
  blob.vy += dy * 0.00008;

  const maxSpeed = 1.1;
  const speed = Math.sqrt(blob.vx * blob.vx + blob.vy * blob.vy);
  if (speed > maxSpeed) {
    blob.vx = (blob.vx / speed) * maxSpeed;
    blob.vy = (blob.vy / speed) * maxSpeed;
  }

  blob.vx *= 0.992;
  blob.vy *= 0.992;

  blob.x += blob.vx;
  blob.y += blob.vy;

  const padding = blob.radius * 0.7;
  if (blob.x < -padding) blob.x = W + padding;
  if (blob.x > W + padding) blob.x = -padding;
  if (blob.y < -padding) blob.y = H + padding;
  if (blob.y > H + padding) blob.y = -padding;
}

function render(time, advance = true) {
  // clearRect очищает канвас в прозрачный, и сквозь него виден настоящий фон
  // темы (светлый или тёмный), а блобы просто добавляют цветное свечение
  // поверх (через 'lighter' composite при отрисовке).
  ctx.clearRect(0, 0, W, H);

  blobs.forEach(blob => {
    if (advance) {
      updateBlob(blob);
      updateBlobColor(blob);
    } else if (!blob.currentColor) {
      updateBlobColor(blob); // первый кадр после создания блобов
    }
    drawBlob(blob, time);
  });
}

function loop(time) {
  if (!heroVisible || document.hidden || scrolling) {
    running = false; // не жжём батарею: хиро не на экране / вкладка скрыта / идёт скролл
    return;
  }
  render(time);
  animationId = requestAnimationFrame(loop);
}

function startLoop() {
  if (running) return;
  running = true;
  animationId = requestAnimationFrame(loop);
}

if (typeof IntersectionObserver !== 'undefined' && canvas.parentElement) {
  new IntersectionObserver(entries => {
    heroVisible = entries[0].isIntersecting;
    if (heroVisible) startLoop();
  }).observe(canvas.parentElement);
}

if (isTouch) {
  window.addEventListener('scroll', () => {
    scrolling = true;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      scrolling = false;
      startLoop();
    }, 120);
  }, { passive: true });
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) startLoop();
});

startLoop();
