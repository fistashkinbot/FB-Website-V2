/* =================================================================================
   docs.js — Логика документации FistashkinBot (ФИНАЛЬНАЯ ВЕРСИЯ)
   ================================================================================= */

// ─── МОБИЛЬНОЕ МЕНЮ ───
function toggleMobileMenu() {
  const menu = document.getElementById("docs-menu");
  menu.classList.toggle("open");
}

// ─── ЯЗЫК И ПУТИ ───
function getDocLang() {
  return localStorage.getItem("siteLanguage") || "ru";
}
function getBasePath(lang) {
  return `docs/${lang || getDocLang()}/`;
}

// Кэш
const pageCache = {};
function getLangCache(lang) {
  if (!pageCache[lang]) pageCache[lang] = {};
  return pageCache[lang];
}

// ─── ПАРСИНГ SUMMARY.md ───
let NAV = [];
let ALL = [];

function parseSummary(md) {
  const sections = [];
  let sec = null, grp = null;
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    const secM = line.match(/^##\s+(.+)/);
    if (secM) {
      sec = { title: secM[1], items: [] };
      sections.push(sec);
      grp = null;
      continue;
    }
    const itemM = line.match(/^\*\s+\[(.+?)\]\((.+?)\)/);
    if (itemM && sec) {
      grp = { title: itemM[1], file: itemM[2], children: [] };
      sec.items.push(grp);
      continue;
    }
    const childM = line.match(/^\s+\*\s+\[(.+?)\]\((.+?)\)/);
    if (childM && grp)
      grp.children.push({ title: childM[1], file: childM[2] });
  }
  return sections;
}

function buildAllFromNav(nav) {
  const all = [];
  nav.forEach((s) =>
    s.items.forEach((item) => {
      all.push({ title: item.title, file: item.file, section: s.title });
      item.children.forEach((c) =>
        all.push({ title: c.title, file: c.file, section: s.title })
      );
    })
  );
  return all;
}

function slugFile(f) {
  return f.replace(/\//g, "--").replace(/\.md$/, "").toLowerCase();
}

function fileFromSlug(s) {
  if (!s) return ALL[0]?.file;
  const slug = s.toLowerCase();
  let found = ALL.find(p => slugFile(p.file) === slug);
  if (found) return found.file;
  found = ALL.find(p => p.file.toLowerCase().includes(slug));
  return found ? found.file : ALL[0]?.file;
}

// ─── ИНИЦИАЛИЗАЦИЯ ───
async function initDocs(lang) {
  lang = lang || getDocLang();
  const BASE_PATH = getBasePath(lang);
  try {
    const resp = await fetch(BASE_PATH + "SUMMARY.md");
    if (!resp.ok) throw new Error("SUMMARY.md not found");

    const text = await resp.text();
    NAV = parseSummary(text);
    ALL = buildAllFromNav(NAV);
    buildSidebar();

    const hash = location.hash.slice(1);
    const startFile = fileFromSlug(hash);
    if (startFile) await loadDocPage(startFile, lang);
  } catch (e) {
    console.error("Failed to load SUMMARY.md", e);
    const t = (typeof translations !== "undefined" && translations[lang]) || {};
    document.getElementById("doc-content").innerHTML = `
      <h1>${t.docs_load_error_heading || "Ошибка загрузки"}</h1>
      <div class="gitbook-hint hint-danger">
        <div class="hint-icon"><i class="fa-solid fa-exclamation-triangle"></i></div>
        <div class="hint-content"><p>Не удалось загрузить документацию.</p></div>
      </div>
    `;
  }
}

window.__onDocLangChange = async function (newLang) {
  await initDocs(newLang);
};

// ─── ЛЕВАЯ САЙДБАР ───
function buildSidebar() {
  const body = document.getElementById("sb-nav-body");
  let html = "";
  NAV.forEach((sec, si) => {
    html += `<div class="sb-section-head">${sec.title}</div>`;
    sec.items.forEach((item, ii) => {
      const gid = `g${si}_${ii}`;
      if (item.children.length) {
        html += `
          <div class="sb-group-toggle" id="tog_${gid}" onclick="toggleGroup('${gid}')">
            <span>${item.title}</span><span class="sb-arrow">&#9658;</span>
          </div>
          <div class="sb-group-children" id="ch_${gid}">
            <div class="sb-child" data-file="${item.file}" onclick="loadDocPage('${item.file}')">${item.title}</div>
            ${item.children.map(c => 
              `<div class="sb-child" data-file="${c.file}" onclick="loadDocPage('${c.file}')">${c.title}</div>`
            ).join("")}
          </div>`;
      } else {
        html += `<div class="sb-item" data-file="${item.file}" onclick="loadDocPage('${item.file}')">${item.title}</div>`;
      }
    });
  });
  body.innerHTML = html;
}

function toggleGroup(gid) {
  document.getElementById("tog_" + gid).classList.toggle("open");
  document.getElementById("ch_" + gid).classList.toggle("open");
}

function setActive(file) {
  document.querySelectorAll(".sb-item,.sb-child").forEach(el => {
    const dataFile = el.dataset.file;
    const isActive = dataFile === file || 
                     (dataFile && file && slugFile(dataFile) === slugFile(file));
    el.classList.toggle("active", isActive);
    if (isActive) {
      const group = el.closest(".sb-group-children");
      if (group) {
        group.classList.add("open");
        const toggle = document.getElementById(group.id.replace("ch_", "tog_"));
        if (toggle) toggle.classList.add("open");
      }
    }
  });
}

function toggleDocSidebar() {
  document.getElementById("docs-sidebar").classList.toggle("open");
  document.getElementById("doc-sb-overlay").classList.toggle("open");
}

// ─── РЕНДЕРИНГ ХИНТОВ (ТОЧНО ПО ТРЕБОВАНИЮ) ───
const HINT_ICONS = {
  info: 'fa-info-circle',
  tip: 'fa-lightbulb',
  danger: 'fa-exclamation-triangle',
  working: 'fa-wrench',
  success: 'fa-check-circle',
  warning: 'fa-exclamation-circle'
};

function renderInline(text) {
  return text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1"/>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/==(.+?)==/g, "<mark>$1</mark>");
}

function renderHintBody(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const hasBlocks = /^#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.\s|^\s*```/m.test(trimmed);
  if (!hasBlocks) return "<p>" + renderInline(trimmed) + "</p>";

  const lines = trimmed.split("\n");
  let html = "", i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const headM = line.match(/^(#{1,6})\s+(.+)/);
    if (headM) {
      html += `<h4>${renderInline(headM[2])}</h4>`;
      i++;
      continue;
    }
    if (/^\s*[-*+]\s/.test(line)) {
      html += "<ul>";
      while (i < lines.length && /^\s*[-*+]\s/.test(lines[i]))
        html += "<li>" + renderInline(lines[i++].replace(/^\s*[-*+]\s/, "")) + "</li>";
      html += "</ul>";
      continue;
    }
    if (/^\s*\d+\.\s/.test(line)) {
      html += "<ol>";
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i]))
        html += "<li>" + renderInline(lines[i++].replace(/^\s*\d+\.\s/, "")) + "</li>";
      html += "</ol>";
      continue;
    }
    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, "").trim();
      i++;
      let code = "";
      while (i < lines.length && !/^```/.test(lines[i])) code += lines[i++] + "\n";
      i++;
      const hl = lang && hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : hljs.highlightAuto(code).value;
      html += `<pre style="margin:8px 0;border-radius:5px;background:#0d1117;padding:12px;overflow-x:auto;border:1px solid rgba(255,255,255,.08)"><code class="hljs">${hl}</code></pre>`;
      continue;
    }
    if (!line.trim()) { i++; continue; }
    let para = "";
    while (i < lines.length && lines[i].trim() && !/^#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.\s|^```/.test(lines[i]))
      para += (para ? " " : "") + lines[i++].trim();
    if (para) html += "<p>" + renderInline(para) + "</p>";
  }
  return html;
}

function renderDocMd(raw) {
  const placeholders = [];
  
  raw = raw.replace(/\{%\s*hint\s+style="(\w+)"\s*%\}([\s\S]*?)\{%\s*endhint\s*%\}/g, (_, style, body) => {
    const allowed = ["info", "success", "warning", "danger", "tip", "working"];
    const s = allowed.includes(style) ? style : "info";
    
    const iconClass = HINT_ICONS[s] || 'fa-info-circle';
    const icon = `<div class="hint-icon"><i class="fa-solid ${iconClass}"></i></div>`;
    
    const ph = `\x00H${placeholders.length}\x00`;
    // Точная структура как в примере пользователя
    placeholders.push(`<div class="gitbook-hint hint-${s}">${icon}<div class="hint-content">${renderHintBody(body)}</div></div>`);
    return ph;
  });
  
  marked.setOptions({ breaks: true, gfm: true });
  let html = marked.parse(raw);
  
  placeholders.forEach((h, i) => {
    html = html.replace(`<p>\x00H${i}\x00</p>`, h).replace(`\x00H${i}\x00`, h);
  });
  
  return html;
}

// ─── ЗАГРУЗКА СТРАНИЦЫ ───
let currentDocFile = null;
let tocObserver = null;

async function loadDocPage(file, lang) {
  if (!file) return;
  lang = lang || getDocLang();
  const BASE_PATH = getBasePath(lang);
  currentDocFile = file;

  history.pushState({ file }, "", "#" + slugFile(file));
  setActive(file);

  document.getElementById("docs-sidebar").classList.remove("open");
  document.getElementById("doc-sb-overlay").classList.remove("open");
  closeDocSearch();

  const doc = document.getElementById("doc-content");
  doc.innerHTML = '<div class="doc-spinner"></div>';

  document.getElementById("doc-toc-list").innerHTML = "";
  document.getElementById("doc-pnav").style.display = "none";
  document.getElementById("doc-last-updated").style.display = "none";
  document.getElementById("doc-toolbar").style.display = "none";

  const cache = getLangCache(lang);
  let raw = cache[file] ? cache[file].content : null;

  if (!raw) {
    try {
      const resp = await fetch(BASE_PATH + file);
      if (!resp.ok) throw new Error();
      raw = await resp.text();
      cache[file] = { content: raw };
    } catch (e) {
      doc.innerHTML = `<h1>Страница не найдена</h1>`;
      return;
    }
  }

  doc.innerHTML = renderDocMd(raw);

  // Якоря для заголовков
  doc.querySelectorAll("h1,h2,h3,h4").forEach((h) => {
    h.id = h.textContent.trim()
      .toLowerCase()
      .replace(/[^\wа-яёa-z0-9\s-]/gi, "")
      .replace(/\s+/g, "-")
      .substring(0, 64);
  });

  // Кнопки копирования кода
  doc.querySelectorAll("pre").forEach(pre => {
    const btn = document.createElement("button");
    btn.className = "code-copy";
    btn.textContent = "Copy";
    btn.onclick = () => {
      navigator.clipboard.writeText(pre.textContent).catch(() => {});
      const old = btn.textContent;
      btn.textContent = "Copied ✓";
      setTimeout(() => btn.textContent = old, 2000);
    };
    pre.appendChild(btn);
  });

  doc.querySelectorAll("pre code").forEach(b => hljs.highlightElement(b));

  document.getElementById("doc-toolbar").style.display = "flex";
  document.getElementById("doc-last-updated").style.display = "block";
  document.getElementById("doc-lu-text").textContent = "только что";

  buildDocTOC();
  buildDocPageNav(file);
  window.scrollTo(0, 0);
}

// ─── ПРАВАЯ ПАНЕЛЬ ───
function buildDocTOC() {
  if (tocObserver) tocObserver.disconnect();
  const headings = [...document.querySelectorAll("#doc-content h2,#doc-content h3")];
  const list = document.getElementById("doc-toc-list");
  if (!headings.length) {
    list.innerHTML = '<li style="font-size:12px;color:var(--doc-text-dim)">—</li>';
    return;
  }
  list.innerHTML = headings.map(h => 
    `<li><a class="toc-link ${h.tagName === "H3" ? "h3" : ""}" href="#${h.id}">${h.textContent}</a></li>`
  ).join("");

  const links = [...list.querySelectorAll(".toc-link")];
  tocObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove("active"));
        list.querySelector(`a[href="#${e.target.id}"]`)?.classList.add("active");
      }
    });
  }, { rootMargin: "-8% 0px -70% 0px" });
  headings.forEach(h => tocObserver.observe(h));
}

// ─── ПАГИНАЦИЯ ───
function buildDocPageNav(file) {
  const i = ALL.findIndex((p) => p.file === file);
  const prev = i > 0 ? ALL[i - 1] : null;
  const next = i < ALL.length - 1 ? ALL[i + 1] : null;
  const nav = document.getElementById("doc-pnav");
  if (!prev && !next) {
    nav.style.display = "none";
    return;
  }
  const lang = getDocLang();
  const t = (typeof translations !== "undefined" && translations[lang]) || {};
  const lblPrev = t.docs_btn_page_nav_prev || "Previous";
  const lblNext = t.docs_btn_page_nav_next || "Next";
  nav.style.display = "flex";
  nav.innerHTML = `
    ${prev ? `<div class="page-nav-btn" onclick="loadDocPage('${prev.file}')">
        <div class="pnav-label"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg> ${lblPrev}</div>
        <div class="pnav-title">${prev.title}</div>
      </div>` : "<div></div>"}
    ${next ? `<div class="page-nav-btn right" onclick="loadDocPage('${next.file}')">
        <div class="pnav-label">${lblNext} <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>
        <div class="pnav-title">${next.title}</div>
      </div>` : "<div></div>"}
  `;
}

// ─── ПОИСК ───
function openDocSearch() {
  document.getElementById("doc-search-overlay").classList.add("open");
  setTimeout(() => document.getElementById("doc-s-inp").focus(), 50);
}

function closeDocSearch() {
  const overlay = document.getElementById("doc-search-overlay");
  const input = document.getElementById("doc-s-inp");
  const res = document.getElementById("doc-s-res");
  overlay.classList.remove("open");
  input.value = "";
  res.innerHTML = `<div class="doc-s-empty">Начните вводить для поиска</div>`;
}

document.getElementById("doc-search-overlay").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeDocSearch();
});

document.getElementById("doc-s-inp").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  const res = document.getElementById("doc-s-res");
  if (!q) {
    res.innerHTML = `<div class="doc-s-empty">Начните вводить для поиска</div>`;
    return;
  }
  const matches = ALL.filter(p => 
    p.title.toLowerCase().includes(q) || p.section.toLowerCase().includes(q)
  ).slice(0, 12);
  res.innerHTML = matches.length 
    ? matches.map(p => `
        <div class="doc-s-item" onclick="loadDocPage('${p.file}'); closeDocSearch();">
          <div class="doc-s-item-title">${p.title}</div>
          <div class="doc-s-item-sec">${p.section}</div>
        </div>`).join("")
    : `<div class="doc-s-empty">Ничего не найдено</div>`;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)) {
    e.preventDefault();
    openDocSearch();
  }
  if (e.key === "Escape") closeDocSearch();
});

// ─── КОПИРОВАНИЕ ───
document.getElementById("doc-copy-btn").addEventListener("click", () => {
  navigator.clipboard.writeText(document.getElementById("doc-content").innerText).catch(() => {});
  const btn = document.getElementById("doc-copy-btn");
  const orig = btn.innerHTML;
  btn.innerHTML = "✅ Copied";
  setTimeout(() => btn.innerHTML = orig, 2000);
});

// ─── МАРШРУТИЗАЦИЯ ───
window.addEventListener("popstate", (e) => {
  const hash = location.hash.slice(1);
  if (hash && !hash.includes("--")) {
    document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
  } else {
    const file = e.state?.file || fileFromSlug(hash);
    if (file && file !== currentDocFile) loadDocPage(file);
  }
});

// ─── ЛОАДЕР ───
function hideLoader() {
  const l = document.getElementById("loader");
  if (l) {
    l.classList.add("hidden");
    setTimeout(() => l.style.display = "none", 400);
  }
}
window.addEventListener("load", hideLoader);
window.addEventListener("pageshow", hideLoader);
setTimeout(hideLoader, 3500);

// ─── СТАРТ ───
initDocs();
