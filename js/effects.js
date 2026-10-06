(() => {
  'use strict';
  document.documentElement.classList.add('js');

  /* 1. NAVBAR — класс при скролле (пропусти, если это уже есть в script.js) */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* 2. СПОТЛАЙТ ПОД КУРСОРОМ */
  const glow = document.getElementById('cursorGlow');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (glow && canHover && !reduceMotion) {
    const half = glow.offsetWidth / 2;
    let x = 0, y = 0, raf = 0;

    const render = () => {
      glow.style.transform = `translate3d(${x - half}px, ${y - half}px, 0)`;
      raf = 0;
    };

    window.addEventListener('mousemove', (e) => {
      x = e.clientX;
      y = e.clientY;
      glow.style.opacity = '1';
      if (!raf) raf = requestAnimationFrame(render);
    }, { passive: true });

    document.documentElement.addEventListener('mouseleave', () => {
      glow.style.opacity = '0';
    });
  }

  /* 3. ПОЯВЛЕНИЕ ЭЛЕМЕНТОВ ПРИ СКРОЛЛЕ */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        // небольшая задержка даёт эффект «каскада»
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }
})();