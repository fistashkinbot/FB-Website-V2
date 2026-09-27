/* =====================================================================
   TOAST — стек уведомлений (порт shadcn/ui Toast на нативный JS)
   Стили: css/toast.css

   toast.add({ title, description, type, icon, timeout, actionProps, onClose, id })
     type:    'default' | 'success' | 'info' | 'warning' | 'error' | 'loading'
     icon:    DOM-узел или URL картинки (перекрывает иконку типа)
     timeout: мс до автозакрытия (0 — не закрывать; для loading по умолчанию 0)
     id:      повторный add() с тем же id обновляет существующий тост
   toast.update(id, options)   toast.close(id)   toast.closeAll()
   toast.promise(promise, { loading, success, error })
   toast.config({ position, mobilePosition, limit, timeout, gap })
   ===================================================================== */
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PATHS = {
    success: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    warning: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    error: '<path d="m15 9-6 6"/><path d="M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z"/><path d="m9 9 6 6"/>',
    loading: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
  };
  const icon = (name, cls = '') =>
    `<svg class="${cls}" xmlns="${SVG_NS}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`;

  const cfg = {
    position: 'bottom-right',        // десктоп
    mobilePosition: 'bottom-center', // мобильный (как у старого тоста)
    mobileQuery: '(max-width: 950px)', // тот же брейкпоинт, что и в style.css
    limit: 3,
    timeout: 5000,
    gap: 14
  };
  const PEEK = 14;          // visible edge of stacked toasts (px)
  const SCALE_STEP = 0.05;  // scale reduction per stack level
  const SWIPE_THRESHOLD = 45;
  const SWIPE_VELOCITY = 0.11;

  const toasts = [];
  const state = { hovered: false, swiping: 0 };
  let container = null;
  let uid = 0;
  let resizeObserver = null;
  let mobileMQ = null;

  // Текущая позиция с учётом мобильного брейкпоинта
  const pos = () => (mobileMQ && mobileMQ.matches ? cfg.mobilePosition : cfg.position);

  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const find = (id) => toasts.find((t) => t.id === id);

  /* ---------- viewport ---------- */
  function ensureContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.className = 'toaster';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Notifications');
    container.tabIndex = -1;
    mobileMQ = matchMedia(cfg.mobileQuery); // до applyPosition(), чтобы сразу выбрать мобильную позицию
    applyPosition();

    container.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      state.hovered = true;
      layout();
    });
    container.addEventListener('pointerleave', () => {
      state.hovered = false;
      layout();
    });
    container.addEventListener('focusin', layout);
    container.addEventListener('focusout', () => setTimeout(layout, 0));
    document.addEventListener('visibilitychange', syncTimers);

    mobileMQ.addEventListener('change', () => { applyPosition(); layout(); });

    resizeObserver = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const t = toasts.find((x) => x.inner === entry.target);
        if (!t) continue;
        const h = entry.target.offsetHeight;
        if (h && h !== t.height) { t.height = h; changed = true; }
      }
      if (changed) layout();
    });

    document.body.appendChild(container);
    return container;
  }

  function exitDir() {
    const p = pos();
    if (p.endsWith('right')) return { axis: 'x', sign: 1 };
    if (p.endsWith('left')) return { axis: 'x', sign: -1 };
    return { axis: 'y', sign: p.startsWith('top') ? -1 : 1 };
  }

  function applyPosition() {
    if (!container) return;
    container.dataset.position = pos();
    container.dataset.swipe = exitDir().axis;
    container.style.setProperty('--gap', cfg.gap + 'px');
  }

  function focusVisibleInside() {
    const ae = document.activeElement;
    return !!(container && ae && ae !== document.body && container.contains(ae) && ae.matches(':focus-visible'));
  }

  /* ---------- layout (stack / expanded) ---------- */
  function layout() {
    if (!container) return;
    const live = toasts.filter((t) => !t.closing);
    const n = live.length;
    if (!n) state.hovered = false;

    const expanded = state.hovered || focusVisibleInside();
    container.dataset.expanded = String(expanded);

    const sign = pos().startsWith('bottom') ? -1 : 1;
    const frontH = n ? live[n - 1].height : 0;
    let offset = 0;

    for (let i = 0; i < n; i++) {
      const t = live[n - 1 - i];
      const el = t.el;
      const hidden = i >= cfg.limit;
      const level = Math.min(i, cfg.limit - 1);

      t.hidden = hidden;
      el.dataset.front = String(i === 0);
      el.dataset.hidden = String(hidden);

      const h = expanded || i === 0 ? t.height : frontH;
      const y = expanded ? offset : level * PEEK;
      const s = expanded ? 1 : 1 - level * SCALE_STEP;

      el.style.height = h + 'px';
      el.style.setProperty('--y', sign * y + 'px');
      el.style.setProperty('--s', s);
      el.style.setProperty('--z', 1000 - i);

      if (!hidden) offset += t.height + cfg.gap;
    }
    syncTimers();
  }

  /* ---------- timers ---------- */
  function startTimer(t) {
    if (!t.timeout || t.timer || t.closing) return;
    t.startedAt = performance.now();
    t.timer = setTimeout(() => close(t.id), Math.max(0, t.remaining));
  }
  function stopTimer(t) {
    if (!t.timer) return;
    clearTimeout(t.timer);
    t.timer = null;
    t.remaining = Math.max(0, t.remaining - (performance.now() - t.startedAt));
  }
  function syncTimers() {
    const paused = state.hovered || state.swiping > 0 || document.hidden || focusVisibleInside();
    for (const t of toasts) {
      if (t.closing) continue;
      if (!paused && !t.hidden) startTimer(t); else stopTimer(t);
    }
  }

  /* ---------- rendering ---------- */
  function setContent(node, value) {
    if (value instanceof Node) node.replaceChildren(value);
    else node.textContent = value == null ? '' : String(value);
  }

  function render(t) {
    const o = t.options;
    const type = o.type || 'default';
    const el = t.el;

    el.dataset.type = type;
    el.setAttribute('role', type === 'error' || type === 'warning' ? 'alert' : 'status');

    const iconEl = el.querySelector('.toast-icon');
    if (o.icon) {
      // icon: DOM-узел или URL картинки (например, флаг языка)
      if (o.icon instanceof Node) {
        iconEl.replaceChildren(o.icon);
      } else {
        const img = document.createElement('img');
        img.src = String(o.icon);
        img.alt = '';
        iconEl.replaceChildren(img);
      }
      iconEl.hidden = false;
    } else if (PATHS[type] && type !== 'close') {
      iconEl.innerHTML = icon(type, type === 'loading' ? 'toast-spin' : '');
      iconEl.hidden = false;
    } else {
      iconEl.innerHTML = '';
      iconEl.hidden = true;
    }

    const titleEl = el.querySelector('.toast-title');
    const descEl = el.querySelector('.toast-description');
    setContent(titleEl, o.title);
    setContent(descEl, o.description);
    titleEl.hidden = !o.title;
    descEl.hidden = !o.description;

    let btn = el.querySelector('.toast-action');
    if (o.actionProps) {
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        t.inner.appendChild(btn);
      }
      const { children, onClick, className, ...rest } = o.actionProps;
      btn.className = 'toast-action' + (className ? ' ' + className : '');
      setContent(btn, children ?? 'Action');
      btn.onclick = (e) => { e.stopPropagation(); if (onClick) onClick(e); };
      for (const key of Object.keys(rest)) if (key in btn) btn[key] = rest[key];
    } else if (btn) {
      btn.remove();
    }
  }

  /* ---------- swipe to dismiss ---------- */
  function attachSwipe(t) {
    const el = t.el;
    let drag = null;

    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('button, a, input, textarea, select')) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, time: performance.now(), active: false, d: 0 };
    });

    el.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dir = exitDir();
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      const main = (dir.axis === 'x' ? dx : dy) * dir.sign;
      const cross = dir.axis === 'x' ? dy : dx;

      if (!drag.active) {
        if (Math.abs(cross) > 10 && Math.abs(cross) > Math.abs(main)) { drag = null; return; }
        if (main <= 4) return;
        drag.active = true;
        el.setPointerCapture(e.pointerId);
        el.dataset.swiping = '';
        state.swiping++;
        syncTimers();
      }
      drag.d = main;
      const shown = main > 0 ? main : main * 0.1;
      el.style.setProperty(dir.axis === 'x' ? '--dx' : '--dy', dir.sign * shown + 'px');
    });

    const finish = (e, cancelled) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      if (!d.active) return;

      delete el.dataset.swiping;
      state.swiping = Math.max(0, state.swiping - 1);

      const velocity = d.d / Math.max(1, performance.now() - d.time);
      if (!cancelled && (d.d >= SWIPE_THRESHOLD || (d.d > 10 && velocity > SWIPE_VELOCITY))) {
        close(t.id);
      } else {
        el.style.setProperty('--dx', '0px');
        el.style.setProperty('--dy', '0px');
        syncTimers();
      }
    };
    el.addEventListener('pointerup', (e) => finish(e, false));
    el.addEventListener('pointercancel', (e) => finish(e, true));
  }

  /* ---------- public API ---------- */
  function resolveTimeout(o) {
    if (o.timeout !== undefined) return o.timeout;
    return o.type === 'loading' ? 0 : cfg.timeout;
  }

  function add(options = {}) {
    if (typeof options === 'string') options = { title: options };
    ensureContainer();

    if (options.id != null && find(options.id)) {
      update(options.id, options);
      return options.id;
    }

    const id = options.id != null ? options.id : `toast-${++uid}`;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML =
      '<div class="toast-card"><div class="toast-inner">' +
        '<span class="toast-icon" hidden></span>' +
        '<div class="toast-content"><div class="toast-title"></div><div class="toast-description"></div></div>' +
      '</div></div>' +
      `<button type="button" class="toast-close" aria-label="Close">${icon('close')}</button>`;

    const t = {
      id, el, options: { ...options },
      inner: el.querySelector('.toast-inner'),
      height: 0, closing: false, hidden: false,
      timeout: 0, remaining: 0, timer: null, startedAt: 0
    };
    t.timeout = resolveTimeout(t.options);
    t.remaining = t.timeout;

    el.querySelector('.toast-close').addEventListener('click', () => close(id));
    el.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(id); });

    render(t);
    container.appendChild(el);
    t.height = t.inner.offsetHeight;
    toasts.push(t);
    resizeObserver.observe(t.inner);
    attachSwipe(t);

    layout();
    void el.offsetWidth;            // commit the "enter" state before animating
    el.dataset.mounted = '';
    return id;
  }

  function update(id, options = {}) {
    const t = find(id);
    if (!t || t.closing) return id;
    const prevType = t.options.type;
    Object.assign(t.options, options);

    stopTimer(t);
    if ('timeout' in options) t.timeout = options.timeout;
    else if (options.type && options.type !== prevType) t.timeout = resolveTimeout({ type: options.type });
    t.remaining = t.timeout;

    render(t);
    t.height = t.inner.offsetHeight;
    layout();
    return id;
  }

  function close(id) {
    const t = find(id);
    if (!t || t.closing) return;
    t.closing = true;
    stopTimer(t);
    if (resizeObserver) resizeObserver.unobserve(t.inner);

    const ae = document.activeElement;
    if (ae && t.el.contains(ae)) ae.blur();

    delete t.el.dataset.swiping;
    t.el.dataset.closing = '';

    const dir = exitDir();
    const size = (dir.axis === 'x' ? t.el.offsetWidth : t.el.offsetHeight) + 32;
    t.el.style.setProperty(dir.axis === 'x' ? '--dx' : '--dy', dir.sign * size + 'px');

    if (typeof t.options.onClose === 'function') t.options.onClose(id);
    layout();

    setTimeout(() => {
      t.el.remove();
      const i = toasts.indexOf(t);
      if (i > -1) toasts.splice(i, 1);
      layout();
    }, reduceMotion() ? 0 : 420);
  }

  function closeAll() {
    toasts.slice().forEach((t) => close(t.id));
  }

  function toOptions(value, arg) {
    if (typeof value === 'function') value = value(arg);
    if (value == null || value === false) return null;
    return typeof value === 'object' && !(value instanceof Node) ? value : { title: value };
  }

  function promise(input, messages = {}) {
    const p = typeof input === 'function' ? input() : input;
    const loading = toOptions(messages.loading) || {};
    const id = add({ ...loading, type: 'loading', timeout: 0 });

    p.then(
      (data) => {
        const o = toOptions(messages.success, data);
        if (o) update(id, { ...o, type: 'success', timeout: cfg.timeout });
        else close(id);
      },
      (err) => {
        const o = toOptions(messages.error, err);
        if (o) update(id, { ...o, type: 'error', timeout: cfg.timeout });
        else close(id);
      }
    );
    return p;
  }

  function config(options = {}) {
    Object.assign(cfg, options);
    applyPosition();
    for (const t of toasts) {
      t.el.style.setProperty('--dx', '0px');
      t.el.style.setProperty('--dy', '0px');
    }
    layout();
  }

  window.toast = { add, update, close, closeAll, promise, config };
})();