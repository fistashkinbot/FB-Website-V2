const canvas = document.getElementById('blobCanvas');
const ctx = canvas.getContext('2d', { alpha: true });

let blobs = [];
let animationId;
let viewW = 0;   // логический (CSS) размер канваса
let viewH = 0;
let resizeTimer = null;

/* === FIX: берём размер из getBoundingClientRect(), а НЕ из window.innerHeight.
   window.innerHeight на мобилке прыгает при показе/скрытии адресной строки —
   именно это пересоздавало блобы во время скролла и вызывало мерцание.
   Размер самого элемента .home фиксирован (100vh) и стабилен. === */
function getCssSize() {
  const rect = canvas.getBoundingClientRect();
  return {
    w: Math.max(1, Math.round(rect.width)),
    h: Math.max(1, Math.round(rect.height)),
  };
}

function resizeCanvas({ force = false } = {}) {
  const { w, h } = getCssSize();

  // Пропускаем, если размер фактически не изменился
  if (!force && w === viewW && h === viewH) return;

  const wRatio = viewW ? Math.abs(w - viewW) / viewW : 1;
  const hRatio = viewH ? Math.abs(h - viewH) / viewH : 1;

  // Пересоздаём блобы только при значительном изменении (ориентация и т.п.),
  // иначе — просто подрезаем позиции по новым границам без "прыжка".
  const significant = force || blobs.length === 0 || wRatio > 0.15 || hRatio > 0.15;

  viewW = w;
  viewH = h;

  // DPR-масштаб для чёткости на retina, но не выше 2 — экономим fill rate
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (significant) {
    blobs = [];
    createBlobs();
  } else {
    // Мягко зажимаем блобы в новые границы — без пересоздания
    blobs.forEach((b) => {
      const pad = b.radius * 0.7;
      b.x = Math.min(Math.max(b.x, -pad), viewW + pad);
      b.y = Math.min(Math.max(b.y, -pad), viewH + pad);
      b.targetX = Math.min(Math.max(b.targetX, 0), viewW);
      b.targetY = Math.min(Math.max(b.targetY, 0), viewH);
    });
  }
}

/* === FIX: debounce resize. На мобилке resize стреляет десятки раз подряд
   во время анимации адресной строки — раньше каждый вызов пересоздавал блобы. === */
function scheduleResize() {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeTimer = null;
    resizeCanvas();
  }, 200);
}

window.addEventListener('resize', scheduleResize);
window.addEventListener('orientationchange', () => {
  // При повороте пересоздаём принудительно — там реально другой layout
  resizeCanvas({ force: true });
});

// Новая палитра (RGB)
const colors = [
  [168, 85, 247],
  [59, 130, 246],
  [239, 68, 68],
  [236, 72, 153],
  [34, 197, 94],
  [192, 105, 78],
  [6, 182, 212],
  [234, 179, 8],
  [99, 102, 241],
  [20, 184, 166],
  [244, 63, 94],
  [132, 204, 22],
  [14, 165, 233],
  [217, 70, 239],
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
  const minDim = Math.min(viewW, viewH);

  for (let i = 0; i < numBlobs; i++) {
    const radius = minDim * 0.55 + Math.random() * minDim * 0.4;

    const colorIndex = randomColorIndex();
    const nextColorIndex = randomColorIndex(colorIndex);

    const centerX = viewW / 2;
    const centerY = viewH / 2;
    const spreadX = viewW * 0.35;
    const spreadY = viewH * 0.35;

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

// Первичная инициализация
resizeCanvas({ force: true });

function updateBlobColor(blob) {
  blob.colorProgress += blob.colorSpeed;
  if (blob.colorProgress >= 1) {
    blob.colorProgress = 0;
    blob.colorIndex = blob.nextColorIndex;
    blob.nextColorIndex = randomColorIndex(blob.colorIndex);
  }

  const t = easeInOutCubic(blob.colorProgress);
  const [r, g, b] = lerpColor(colors[blob.colorIndex], colors[blob.nextColorIndex], t);

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
    const centerX = viewW / 2;
    const centerY = viewH / 2;
    const spreadX = viewW * 0.4;
    const spreadY = viewH * 0.4;

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

  // Wrap по логическим (CSS) границам
  const padding = blob.radius * 0.7;
  if (blob.x < -padding) blob.x = viewW + padding;
  if (blob.x > viewW + padding) blob.x = -padding;
  if (blob.y < -padding) blob.y = viewH + padding;
  if (blob.y > viewH + padding) blob.y = -padding;
}

function animate(time) {
  // clearRect тоже по логическим размерам — с учётом DPR-трансформа
  // это очищает ровно всю площадь канваса в device-пикселях.
  ctx.clearRect(0, 0, viewW, viewH);

  blobs.forEach((blob) => {
    updateBlob(blob);
    updateBlobColor(blob);
    drawBlob(blob, time);
  });

  animationId = requestAnimationFrame(animate);
}

animationId = requestAnimationFrame(animate);