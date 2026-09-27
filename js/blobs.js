const canvas = document.getElementById('blobCanvas');
const ctx = canvas.getContext('2d');

let blobs = [];
let animationId;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  blobs = [];
  createBlobs();
}

window.addEventListener('resize', resizeCanvas);

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
  const minDim = Math.min(canvas.width, canvas.height);

  for (let i = 0; i < numBlobs; i++) {
    const radius = minDim * 0.55 + Math.random() * minDim * 0.4;

    const colorIndex = randomColorIndex();
    const nextColorIndex = randomColorIndex(colorIndex);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const spreadX = canvas.width * 0.35;
    const spreadY = canvas.height * 0.35;

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
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const spreadX = canvas.width * 0.4;
    const spreadY = canvas.height * 0.4;

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
  if (blob.x < -padding) blob.x = canvas.width + padding;
  if (blob.x > canvas.width + padding) blob.x = -padding;
  if (blob.y < -padding) blob.y = canvas.height + padding;
  if (blob.y > canvas.height + padding) blob.y = -padding;
}

function animate(time) {
  // FIX: раньше здесь был ctx.fillStyle = '#0a0a0a'; ctx.fillRect(...) —
  // канвас каждый кадр заново красился в непрозрачный почти-чёрный цвет.
  // Это полностью перекрывало собственный CSS-фон .home (--hero-grad-*),
  // из-за чего на светлой теме хиро-секция выглядела серо-тёмной вместо
  // светлой. clearRect очищает канвас в прозрачный, и сквозь него виден
  // настоящий фон темы — светлый или тёмный, — а блобы просто добавляют
  // цветное свечение поверх (через 'lighter' composite при отрисовке).
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  blobs.forEach(blob => {
    updateBlob(blob);
    updateBlobColor(blob);
    drawBlob(blob, time);
  });

  animationId = requestAnimationFrame(animate);
}

animationId = requestAnimationFrame(animate);