/* =================================================================================
   docs.js — Логика документации FistashkinBot (ФИНАЛЬНАЯ ВЕРСИЯ)
   ================================================================================= */

// ─── ХЕЛПЕР ПЕРЕВОДА ───
function tr(key, lang) {
  const fallbackLang = lang || getDocLang();
  if (typeof window.t === "function") return window.t(key, fallbackLang);
  const pack = (window.translations && translations[fallbackLang]) || {};
  const fb = (window.translations && translations.ru) || {};
  return pack[key] != null ? pack[key] : (fb[key] != null ? fb[key] : key);
}

// ─── МОБИЛЬНОЕ МЕНЮ ───
function toggleMobileMenu() {
  const menu = document.getElementById("docs-menu");
  if (menu) menu.classList.toggle("open");
}

// ─── ЯЗЫК И ПУТИ ───
function getDocLang() {
  return localStorage.getItem("siteLanguage") || "ru";
}

// ─── ИСТОЧНИК MD-ФАЙЛОВ (репозиторий документации на GitHub) ───
const DOCS_REPO_OWNER = "fistashkinbot";
const DOCS_REPO_NAME = "fistashkin-docs";
const DOCS_REPO_BRANCH = "main";

function getBasePath(lang) {
  return `https://raw.githubusercontent.com/${DOCS_REPO_OWNER}/${DOCS_REPO_NAME}/${DOCS_REPO_BRANCH}/docs/${lang || getDocLang()}/`;
}

function getDocsRepoPath(lang, file) {
  return `${lang || getDocLang()}/${file}`;
}

// ─── MANIFEST ───
let manifestPromise = null;
function loadManifest() {
  if (!manifestPromise) {
    const url = `https://raw.githubusercontent.com/${DOCS_REPO_OWNER}/${DOCS_REPO_NAME}/${DOCS_REPO_BRANCH}/docs/manifest.json`;
    manifestPromise = fetch(url)
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return manifestPromise;
}

// ─── FALLBACK: дата последнего коммита через GitHub API ───
// Если manifest.json недоступен или в нём нет ключа для файла — спрашиваем
// у GitHub API дату последнего коммита, затронувшего этот файл.
// Кэш — чтобы не дёргать API повторно для одной и той же страницы.
const githubCommitDateCache = {};
async function getLastModifiedFromGitHub(file, lang) {
  const key = `${lang}/${file}`;
  if (githubCommitDateCache[key] !== undefined) return githubCommitDateCache[key];

  const path = `docs/${lang}/${file}`;
  const url = `https://api.github.com/repos/${DOCS_REPO_OWNER}/${DOCS_REPO_NAME}/commits?path=${encodeURIComponent(path)}&page=1&per_page=1`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      githubCommitDateCache[key] = null;
      return null;
    }
    const data = await resp.json();
    const date = Array.isArray(data) && data[0] && data[0].commit && data[0].commit.committer
      ? data[0].commit.committer.date
      : null;
    githubCommitDateCache[key] = date;
    return date;
  } catch (e) {
    console.warn("GitHub API last-modified fallback failed:", e);
    githubCommitDateCache[key] = null;
    return null;
  }
}

// ─── КЭШ ───
const pageCache = {};
function getLangCache(lang) {
  if (!pageCache[lang]) pageCache[lang] = {};
  return pageCache[lang];
}

// ─── НАВИГАЦИЯ ───
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
    if (childM && grp) {
      grp.children.push({ title: childM[1], file: childM[2] });
    }
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
  if (!s) return ALL[0] && ALL[0].file;
  const slug = s.toLowerCase();
  let found = ALL.find((p) => slugFile(p.file) === slug);
  if (found) return found.file;
  found = ALL.find((p) => p.file.toLowerCase().includes(slug));
  return found ? found.file : (ALL[0] && ALL[0].file);
}

// ─── ДАТА ───
function formatLastUpdated(dateStr, lang = getDocLang()) {
  if (!dateStr) return tr("docs_reltime_unknown", lang);

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return tr("docs_reltime_unknown", lang);

  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);

  if (diffMin < 60) {
    if (diffMin < 1) return tr("docs_last_updated_just_now", lang);
    return `${diffMin} ${tr("docs_reltime_minutes_ago", lang)}`;
  }
  if (diffHours < 24) {
    return `${diffHours} ${tr("docs_reltime_hours_ago", lang)}`;
  }
  if (date.toDateString() === now.toDateString()) {
    return `${tr("docs_reltime_today", lang)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `${tr("docs_yesterday_at", lang)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  return date.toLocaleDateString(lang === "uk" ? "uk-UA" : lang === "en" ? "en-GB" : "ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── СКЕЛЕТОН ───
function renderDocSkeleton() {
  return `
    <div class="doc-skeleton" aria-hidden="true">
      <div class="sk-shimmer doc-sk-h1"></div>
      <div class="sk-shimmer doc-sk-line doc-sk-w100"></div>
      <div class="sk-shimmer doc-sk-line doc-sk-w90"></div>
      <div class="sk-shimmer doc-sk-line doc-sk-w70"></div>
      <div class="sk-shimmer doc-sk-h2"></div>
      <div class="sk-shimmer doc-sk-line doc-sk-w100"></div>
      <div class="sk-shimmer doc-sk-line doc-sk-w90"></div>
      <div class="sk-shimmer doc-sk-hint"></div>
      <div class="sk-shimmer doc-sk-h3"></div>
      <div class="sk-shimmer doc-sk-line doc-sk-w100"></div>
      <div class="sk-shimmer doc-sk-line doc-sk-w90"></div>
      <div class="sk-shimmer doc-sk-line doc-sk-w50"></div>
      <div class="sk-shimmer doc-sk-code"></div>
      <div class="sk-shimmer doc-sk-h2"></div>
      <div class="sk-shimmer doc-sk-line doc-sk-w100"></div>
      <div class="sk-shimmer doc-sk-line doc-sk-w90"></div>
      <div class="sk-shimmer doc-sk-line doc-sk-w70"></div>
    </div>
  `;
}

function applySkeletonDelays(root) {
  root.querySelectorAll(".sk-shimmer").forEach((node) => {
    node.style.setProperty("--sk-dur", (1.05 + Math.random() * 0.7).toFixed(2) + "s");
    node.style.setProperty("--sk-delay", (-Math.random() * 1.6).toFixed(2) + "s");
  });
}

function playFadeIn(el) {
  if (!el) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.classList.remove("doc-fade-in");
  void el.offsetWidth;
  el.classList.add("doc-fade-in");
}

// ─── ХЕЛПЕРЫ ───
function isMobileViewport() {
  return window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
}

function headingId(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\wа-яёa-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .substring(0, 64);
}

function extractHeadings(md) {
  const headings = [];
  const lines = md.split("\n");
  let inCode = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^```/.test(line)) { inCode = !inCode; continue; }
    if (inCode) continue;
    const m = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (m) {
      const title = m[2].replace(/[*_`~]/g, "").trim();
      if (title) headings.push({ level: m[1].length, title, id: headingId(title) });
    }
  }
  return headings;
}

// ─── ПОИСКОВЫЙ ИНДЕКС ───
const SEARCH_INDEX = {};
function getSearchIndexBucket(lang) {
  if (!SEARCH_INDEX[lang]) SEARCH_INDEX[lang] = { items: [], built: false, building: null };
  return SEARCH_INDEX[lang];
}

async function fetchInBatches(urls, concurrency, onEach) {
  let idx = 0;
  const workers = new Array(Math.min(concurrency, urls.length)).fill(0).map(async () => {
    while (idx < urls.length) {
      const i = idx++;
      await onEach(urls[i], i);
    }
  });
  await Promise.all(workers);
}

async function buildSearchIndex(lang) {
  lang = lang || getDocLang();
  const bucket = getSearchIndexBucket(lang);
  if (bucket.built) return bucket.items;
  if (bucket.building) return bucket.building;

  const base = getBasePath(lang);
  const cache = getLangCache(lang);
  const files = ALL.map((p) => p.file);
  const items = [];

  bucket.building = (async () => {
    await fetchInBatches(files, 6, async (file) => {
      const pageMeta = ALL.find((p) => p.file === file);
      let raw = cache[file] && cache[file].content;
      if (!raw) {
        try {
          const resp = await fetch(base + file);
          if (!resp.ok) return;
          raw = await resp.text();
          cache[file] = { content: raw };
        } catch { return; }
      }
      const headings = extractHeadings(raw);
      for (const h of headings) {
        items.push({
          file,
          pageTitle: (pageMeta && pageMeta.title) || file,
          section: (pageMeta && pageMeta.section) || "",
          title: h.title,
          id: h.id,
          level: h.level,
        });
      }
    });
    const order = new Map(files.map((f, i) => [f, i]));
    items.sort((a, b) => order.get(a.file) - order.get(b.file));
    bucket.items = items;
    bucket.built = true;
    bucket.building = null;
    return items;
  })();

  return bucket.building;
}

async function ensureSearchIndex(lang) {
  const bucket = getSearchIndexBucket(lang);
  if (bucket.built) return bucket.items;
  return buildSearchIndex(lang);
}

// ─── ИНИЦИАЛИЗАЦИЯ ───
async function initDocs(lang) {
  lang = lang || getDocLang();
  const BASE_PATH = getBasePath(lang);

  const docEl = document.getElementById("doc-content");
  if (docEl) {
    docEl.innerHTML = renderDocSkeleton();
    applySkeletonDelays(docEl);
  }

  (function initSearchKbd() {
    const row = document.querySelector(".doc-search-row");
    const inp = document.getElementById("doc-s-inp");
    if (row && inp && !row.querySelector(".doc-search-kbd")) {
      const kbd = document.createElement("span");
      kbd.className = "doc-search-kbd";
      kbd.textContent = "ESC";
      row.appendChild(kbd);
    }
  })();

  (function initSearchPlaceholder() {
    const res = document.getElementById("doc-s-res");
    if (res) res.innerHTML = renderSearchEmpty();
  })();

  try {
    const resp = await fetch(BASE_PATH + "SUMMARY.md");
    if (!resp.ok) throw new Error("SUMMARY.md not found");

    const text = await resp.text();
    NAV = parseSummary(text);
    ALL = buildAllFromNav(NAV);
    buildSidebar();

    delete SEARCH_INDEX[lang];

    const hash = location.hash.slice(1);
    const startFile = fileFromSlug(hash);
    if (startFile) await loadDocPage(startFile, lang);

    buildSearchIndex(lang).catch((e) => console.warn("Search index build failed:", e));
  } catch (e) {
    console.error("Failed to load SUMMARY.md", e);
    if (docEl) {
      docEl.innerHTML = `
        <h1>${tr("docs_load_error_heading", lang)}</h1>
        <div class="gitbook-hint hint-danger">
          <div class="hint-icon"><i class="fa-solid fa-exclamation-triangle"></i></div>
          <div class="hint-content"><p>${tr("docs_load_error_message_doc", lang)}</p></div>
        </div>
      `;
    }
  }
}

window.__onDocLangChange = async function (newLang) {
  await initDocs(newLang);
};

// ─── САЙДБАР ───
function buildSidebar() {
  const body = document.getElementById("sb-nav-body");
  if (!body) return;
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
            ${item.children.map((c) =>
              `<div class="sb-child" data-file="${c.file}" onclick="loadDocPage('${c.file}')">${c.title}</div>`
            ).join("")}
          </div>`;
      } else {
        html += `<div class="sb-item" data-file="${item.file}" onclick="loadDocPage('${item.file}')">${item.title}</div>`;
      }
    });
  });
  body.innerHTML = html;
  playFadeIn(body);
}

function toggleGroup(gid) {
  const t = document.getElementById("tog_" + gid);
  const c = document.getElementById("ch_" + gid);
  if (t) t.classList.toggle("open");
  if (c) c.classList.toggle("open");
}

function setActive(file) {
  document.querySelectorAll(".sb-item,.sb-child").forEach((el) => {
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
  const sb = document.getElementById("docs-sidebar");
  const ov = document.getElementById("doc-sb-overlay");
  if (sb) sb.classList.toggle("open");
  if (ov) ov.classList.toggle("open");
}

// ─── ХИНТЫ ───
const HINT_ICONS = {
  info: "fa-info-circle",
  tip: "fa-lightbulb",
  danger: "fa-exclamation-triangle",
  working: "fa-wrench",
  success: "fa-check-circle",
  warning: "fa-exclamation-circle",
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
    if (headM) { html += `<h4>${renderInline(headM[2])}</h4>`; i++; continue; }
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
      const hl = lang && hljs.getLanguage(lang)
        ? hljs.highlight(code, { language: lang }).value
        : hljs.highlightAuto(code).value;
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
    const iconClass = HINT_ICONS[s] || "fa-info-circle";
    const icon = `<div class="hint-icon"><i class="fa-solid ${iconClass}"></i></div>`;
    const ph = `\x00H${placeholders.length}\x00`;
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

// ─── СТРАНИЦА ───
let currentDocFile = null;
let tocObserver = null;
let pendingAnchor = null;

async function loadDocPage(file, lang) {
  if (!file) return;
  lang = lang || getDocLang();
  const BASE_PATH = getBasePath(lang);
  currentDocFile = file;

  history.pushState({ file }, "", "#" + slugFile(file));
  setActive(file);

  const sb = document.getElementById("docs-sidebar");
  const ov = document.getElementById("doc-sb-overlay");
  if (sb) sb.classList.remove("open");
  if (ov) ov.classList.remove("open");
  closeDocSearch();

  const doc = document.getElementById("doc-content");
  if (!doc) return;
  doc.innerHTML = renderDocSkeleton();
  applySkeletonDelays(doc);

  const tocList = document.getElementById("doc-toc-list");
  const pnav = document.getElementById("doc-pnav");
  const lu = document.getElementById("doc-last-updated");
  const tb = document.getElementById("doc-toolbar");
  if (tocList) tocList.innerHTML = "";
  if (pnav) pnav.style.display = "none";
  if (lu) lu.style.display = "none";
  if (tb) tb.style.display = "none";

  const cache = getLangCache(lang);
  let raw = cache[file] && cache[file].content;

  if (!raw) {
    try {
      const results = await Promise.all([
        fetch(BASE_PATH + file),
        loadManifest(),
      ]);
      const resp = results[0];
      const manifest = results[1];
      if (!resp.ok) throw new Error("not ok");
      raw = await resp.text();
      cache[file] = { content: raw };
      let lastModified = manifest[getDocsRepoPath(lang, file)];
      // Fallback: если в manifest.json нет ключа — спрашиваем GitHub API.
      if (!lastModified) {
        lastModified = await getLastModifiedFromGitHub(file, lang);
      }
      if (lastModified) cache[file].lastModified = lastModified;
    } catch (e) {
      doc.innerHTML = `<h1>${tr("docs_page_not_found_heading", lang)}</h1>`;
      return;
    }
  } else if (!cache[file].lastModified) {
    // Файл взят из кэша, но даты в кэше нет — запрашиваем API.
    const lastModified = await getLastModifiedFromGitHub(file, lang);
    if (lastModified) cache[file].lastModified = lastModified;
  }

  doc.innerHTML = `<div data-aos="fade-up" data-aos-duration="600" data-aos-once="true">${renderDocMd(raw)}</div>`;

  doc.querySelectorAll("h1,h2,h3,h4").forEach((h) => {
    h.id = headingId(h.textContent);
  });

  doc.querySelectorAll("pre").forEach((pre) => {
    const btn = document.createElement("button");
    btn.className = "code-copy";
    btn.textContent = tr("docs_btn_copy", lang);
    btn.onclick = () => {
      navigator.clipboard.writeText(pre.textContent).catch(() => {});
      const old = btn.textContent;
      btn.textContent = tr("docs_btn_copy_copied", lang);
      setTimeout(() => (btn.textContent = old), 2000);
    };
    pre.appendChild(btn);
  });

  doc.querySelectorAll("pre code").forEach((b) => hljs.highlightElement(b));

  const lm = cache[file] && cache[file].lastModified;
  if (lu) lu.style.display = "block";
  const luText = document.getElementById("doc-lu-text");
  if (luText) {
    luText.textContent = formatLastUpdated(lm, lang);
    playFadeIn(luText);
  }

  if (tb) tb.style.display = "flex";

  buildDocTOC();
  buildDocPageNav(file);

  if (pendingAnchor) {
    const target = pendingAnchor;
    pendingAnchor = null;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToDocAnchor(target));
    });
  } else {
    window.scrollTo(0, 0);
  }

  if (typeof AOS !== "undefined") AOS.refreshHard();
}

// ─── TOC ───
function buildDocTOC() {
  if (tocObserver) tocObserver.disconnect();
  const headings = Array.from(document.querySelectorAll("#doc-content h2,#doc-content h3"));
  const list = document.getElementById("doc-toc-list");
  if (!list) return;
  if (!headings.length) {
    list.innerHTML = '<li style="font-size:12px;color:var(--doc-text-dim)">—</li>';
    playFadeIn(list);
    return;
  }
  list.innerHTML = headings.map((h) =>
    `<li><a class="toc-link ${h.tagName === "H3" ? "h3" : ""}" data-anchor="${h.id}" href="#${h.id}">${h.textContent}</a></li>`
  ).join("");
  playFadeIn(list);

  list.onclick = (e) => {
    const link = e.target.closest(".toc-link");
    if (!link) return;
    e.preventDefault();
    const id = link.dataset.anchor;
    if (id) scrollToDocAnchor(id);
  };

  const links = Array.from(list.querySelectorAll(".toc-link"));
  tocObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((l) => l.classList.remove("active"));
        const sel = list.querySelector('a[data-anchor="' + e.target.id + '"]');
        if (sel) sel.classList.add("active");
      }
    });
  }, { rootMargin: "-8% 0px -70% 0px" });
  headings.forEach((h) => tocObserver.observe(h));
}

// ─── ПАГИНАЦИЯ ───
function buildDocPageNav(file) {
  const i = ALL.findIndex((p) => p.file === file);
  const prev = i > 0 ? ALL[i - 1] : null;
  const next = i < ALL.length - 1 ? ALL[i + 1] : null;
  const nav = document.getElementById("doc-pnav");
  if (!nav) return;
  if (!prev && !next) { nav.style.display = "none"; return; }
  const lang = getDocLang();
  nav.style.display = "flex";
  nav.innerHTML = `
    ${prev ? `<div class="page-nav-btn" onclick="loadDocPage('${prev.file}')">
        <div class="pnav-label"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg> ${tr("docs_btn_page_nav_prev", lang)}</div>
        <div class="pnav-title">${prev.title}</div>
      </div>` : "<div></div>"}
    ${next ? `<div class="page-nav-btn right" onclick="loadDocPage('${next.file}')">
        <div class="pnav-label">${tr("docs_btn_page_nav_next", lang)} <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>
        <div class="pnav-title">${next.title}</div>
      </div>` : "<div></div>"}
  `;
  playFadeIn(nav);
}

// ─── ПОИСК ───
let docSearchCloseTimer = null;
let searchActiveIndex = -1;

function openDocSearch() {
  const overlay = document.getElementById("doc-search-overlay");
  if (!overlay) return;
  if (docSearchCloseTimer) { clearTimeout(docSearchCloseTimer); docSearchCloseTimer = null; }
  overlay.classList.remove("closing");
  overlay.classList.add("open");

  const res = document.getElementById("doc-s-res");
  const inp = document.getElementById("doc-s-inp");
  if (inp) inp.value = "";
  if (res) res.innerHTML = renderSearchEmpty();
  searchActiveIndex = -1;

  setTimeout(() => { if (inp) inp.focus(); }, 120);
  ensureSearchIndex(getDocLang()).catch(() => {});
}

function closeDocSearch() {
  const overlay = document.getElementById("doc-search-overlay");
  const input = document.getElementById("doc-s-inp");
  const res = document.getElementById("doc-s-res");
  if (!overlay) return;
  if (!overlay.classList.contains("open")) return;
  overlay.classList.add("closing");
  if (docSearchCloseTimer) clearTimeout(docSearchCloseTimer);
  docSearchCloseTimer = setTimeout(() => {
    overlay.classList.remove("open", "closing");
    if (input) input.value = "";
    if (res) res.innerHTML = renderSearchEmpty();
    searchActiveIndex = -1;
    docSearchCloseTimer = null;
  }, 220);
}

function renderSearchEmpty() {
  const lang = getDocLang();
  const title = tr("docs_input_search_empty", lang);
  const hint = tr("docs_search_hint", lang);
  const kbdBlock = isMobileViewport() ? "" : `
      <div class="doc-s-empty-kbd">
        <kbd>↑</kbd><kbd>↓</kbd>
        <span style="font-size:11px;opacity:.7">${tr("docs_search_kbd_nav", lang)}</span>
        <kbd>↵</kbd>
        <span style="font-size:11px;opacity:.7">${tr("docs_search_kbd_go", lang)}</span>
      </div>`;
  return `
    <div class="doc-s-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <div class="doc-s-empty-title">${title}</div>
      <div class="doc-s-empty-hint">${hint}</div>
      ${kbdBlock}
    </div>
  `;
}

function getSearchOnPageText() { return tr("docs_search_on_page", getDocLang()); }
function getSearchAllText() { return tr("docs_search_all_pages", getDocLang()); }
function getSearchOtherPagesText() { return tr("docs_search_other_pages", getDocLang()); }

(function initOverlayClick() {
  const ov = document.getElementById("doc-search-overlay");
  if (!ov) return;
  ov.addEventListener("click", (e) => { if (e.target === e.currentTarget) closeDocSearch(); });
})();

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const q = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try {
    return escaped.replace(new RegExp("(" + q + ")", "gi"), '<mark class="doc-s-hl">$1</mark>');
  } catch { return escaped; }
}

function getCurrentPageHeadings() {
  const nodes = Array.from(document.querySelectorAll("#doc-content h2, #doc-content h3"));
  return nodes.map((h) => ({
    title: h.textContent.trim(),
    id: h.id,
    level: h.tagName === "H3" ? 3 : 2,
  })).filter((h) => h.title && h.id);
}

function scrollToDocAnchor(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const navbar = document.querySelector(".docs-navbar");
  const offset = (navbar ? navbar.getBoundingClientRect().height : 72) + 24;
  const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
  window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  if (history.replaceState) history.replaceState(null, "", "#" + id);
}

function goToDocAnchor(id) {
  closeDocSearch();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => scrollToDocAnchor(id));
  });
}

function goToDocAnchorOnPage(file, id) {
  closeDocSearch();
  if (file === currentDocFile) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToDocAnchor(id));
    });
  } else {
    pendingAnchor = id;
    loadDocPage(file);
  }
}

function animateSearchResults(container) {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const items = container.querySelectorAll(".doc-s-item");
  items.forEach((item, i) => {
    item.style.setProperty("--s-delay", Math.min(i * 25, 300) + "ms");
    item.classList.remove("doc-s-item-anim");
    void item.offsetWidth;
    item.classList.add("doc-s-item-anim");
  });
}

const SEARCH_RESULTS_PER_PAGE = 5;
const SEARCH_TOTAL_LIMIT = 40;

function renderSearchResults(q) {
  const res = document.getElementById("doc-s-res");
  if (!res) return;
  const lang = getDocLang();

  if (!q) {
    res.innerHTML = renderSearchEmpty();
    searchActiveIndex = -1;
    return;
  }

  const ql = q.toLowerCase();

  const currentHeadings = getCurrentPageHeadings().filter((h) =>
    h.title.toLowerCase().indexOf(ql) !== -1
  );

  const bucket = getSearchIndexBucket(lang);
  const otherHeadings = (bucket.items || []).filter((h) => {
    if (h.file === currentDocFile) return false;
    return (
      h.title.toLowerCase().indexOf(ql) !== -1 ||
      h.pageTitle.toLowerCase().indexOf(ql) !== -1 ||
      h.section.toLowerCase().indexOf(ql) !== -1
    );
  });

  const pageMatches = ALL.filter((p) =>
    p.file !== currentDocFile &&
    (p.title.toLowerCase().indexOf(ql) !== -1 || p.section.toLowerCase().indexOf(ql) !== -1)
  );

  const hasAny = currentHeadings.length || otherHeadings.length || pageMatches.length;
  if (!hasAny) {
    res.innerHTML = `<div class="doc-s-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
      <div class="doc-s-empty-title">${tr("docs_search_no_results", lang)}</div>
      <div class="doc-s-empty-hint">${tr("docs_search_try_another", lang)}</div>
    </div>`;
    searchActiveIndex = -1;
    return;
  }

  let html = "";
  let totalRendered = 0;

  if (currentHeadings.length) {
    html += `<div class="doc-s-group-head">${getSearchOnPageText()}</div>`;
    const slice = currentHeadings.slice(0, SEARCH_RESULTS_PER_PAGE);
    html += slice.map((h) =>
      `<div class="doc-s-item doc-s-item-heading" data-action="anchor" data-id="${h.id}" onclick="goToDocAnchor('${h.id}')">
        <div class="doc-s-item-title">
          <span class="doc-s-anchor-icon">#</span>
          ${highlightMatch(h.title, q)}
        </div>
      </div>`
    ).join("");
    totalRendered += slice.length;
  }

  if (otherHeadings.length && totalRendered < SEARCH_TOTAL_LIMIT) {
    const groups = new Map();
    for (const h of otherHeadings) {
      if (!groups.has(h.file)) {
        groups.set(h.file, { file: h.file, pageTitle: h.pageTitle, section: h.section, items: [] });
      }
      const g = groups.get(h.file);
      if (g.items.length < SEARCH_RESULTS_PER_PAGE) g.items.push(h);
    }
    if (groups.size) {
      html += `<div class="doc-s-group-head">${getSearchOtherPagesText()}</div>`;
      groups.forEach((g) => {
        if (totalRendered >= SEARCH_TOTAL_LIMIT) return;
        html += `
          <div class="doc-s-page-group">
            <div class="doc-s-page-head" data-action="anchor-page" data-file="${g.file}" data-id="${g.items[0].id}" onclick="goToDocAnchorOnPage('${g.file}', '${g.items[0].id}')">
              <span class="doc-s-page-title">${highlightMatch(g.pageTitle, q)}</span>
              ${g.section ? `<span class="doc-s-page-sec">${escapeHtml(g.section)}</span>` : ""}
            </div>
            ${g.items.map((h) =>
              `<div class="doc-s-item doc-s-item-heading doc-s-item-nested" data-action="anchor-page" data-file="${g.file}" data-id="${h.id}" onclick="goToDocAnchorOnPage('${g.file}', '${h.id}')">
                <div class="doc-s-item-title">
                  <span class="doc-s-anchor-icon">#</span>
                  ${highlightMatch(h.title, q)}
                </div>
              </div>`
            ).join("")}
          </div>
        `;
        totalRendered += g.items.length;
      });
    }
  }

  if (pageMatches.length && totalRendered < SEARCH_TOTAL_LIMIT) {
    const shownFiles = new Set(
      (bucket.items || []).filter((h) => h.file !== currentDocFile).map((h) => h.file)
    );
    const remaining = pageMatches.filter((p) => !shownFiles.has(p.file));
    const fallback = remaining.filter((p) => !(bucket.items || []).some((h) => h.file === p.file));
    if (fallback.length) {
      html += `<div class="doc-s-group-head">${getSearchAllText()}</div>`;
      html += fallback.slice(0, SEARCH_TOTAL_LIMIT - totalRendered).map((p) =>
        `<div class="doc-s-item" data-action="page" data-file="${p.file}" onclick="loadDocPage('${p.file}'); closeDocSearch();">
          <div class="doc-s-item-title">${highlightMatch(p.title, q)}</div>
          <div class="doc-s-item-sec">${highlightMatch(p.section, q)}</div>
        </div>`
      ).join("");
    }
  }

  res.innerHTML = html;
  searchActiveIndex = -1;
  animateSearchResults(res);
}

function getSearchItemNodes() {
  const res = document.getElementById("doc-s-res");
  if (!res) return [];
  return Array.from(res.querySelectorAll(".doc-s-item"));
}

function moveSearchSelection(delta) {
  const items = getSearchItemNodes();
  if (!items.length) return;

  if (searchActiveIndex >= 0 && items[searchActiveIndex]) {
    items[searchActiveIndex].classList.remove("doc-s-item--active");
  }

  if (searchActiveIndex === -1) {
    searchActiveIndex = delta > 0 ? 0 : items.length - 1;
  } else {
    searchActiveIndex = (searchActiveIndex + delta + items.length) % items.length;
  }

  const active = items[searchActiveIndex];
  active.classList.add("doc-s-item--active");

  const container = document.getElementById("doc-s-res");
  if (container) {
    const cRect = container.getBoundingClientRect();
    const iRect = active.getBoundingClientRect();
    const TOP_GAP = 14;
    const BOTTOM_GAP = 4;
    if (iRect.top < cRect.top + TOP_GAP) {
      container.scrollTop -= (cRect.top + TOP_GAP - iRect.top);
    } else if (iRect.bottom > cRect.bottom - BOTTOM_GAP) {
      container.scrollTop += (iRect.bottom - cRect.bottom + BOTTOM_GAP);
    }
  }
}

(function initSearchInput() {
  const inp = document.getElementById("doc-s-inp");
  if (!inp) return;
  let debounce = null;
  inp.addEventListener("input", (e) => {
    const q = e.target.value.trim();
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(async () => {
      try { await ensureSearchIndex(getDocLang()); } catch (err) { /* ignore */ }
      renderSearchResults(q);
    }, 80);
  });

  inp.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      moveSearchSelection(e.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (e.key === "Enter") {
      const items = getSearchItemNodes();
      if (searchActiveIndex >= 0 && items[searchActiveIndex]) {
        e.preventDefault();
        items[searchActiveIndex].click();
      }
      return;
    }
  });
})();

document.addEventListener("mousedown", (e) => {
  const item = e.target.closest && e.target.closest(".doc-s-item, .doc-s-page-head");
  if (!item) return;
  const items = getSearchItemNodes();
  if (searchActiveIndex >= 0 && items[searchActiveIndex]) {
    items[searchActiveIndex].classList.remove("doc-s-item--active");
  }
  searchActiveIndex = -1;
});

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement && document.activeElement.tagName;
  if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
    e.preventDefault();
    openDocSearch();
  }
  if (e.key === "Escape") closeDocSearch();
});

// ─── КОПИРОВАНИЕ ───
(function initCopyBtn() {
  const btn = document.getElementById("doc-copy-btn");
  if (!btn) return;

  const ICON_COPY = `
    <svg class="doc-copy-icon doc-copy-icon--copy" xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round"
         stroke-linejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>`;
  const ICON_CHECK = `
    <svg class="doc-copy-icon doc-copy-icon--check" xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
         stroke-linejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`;

  let labelSpan = btn.querySelector('span[data-i18n="docs_btn_copy"]');
  if (!labelSpan) {
    labelSpan = document.createElement("span");
    labelSpan.setAttribute("data-i18n", "docs_btn_copy");
    labelSpan.textContent = tr("docs_btn_copy", getDocLang());
  }

  const iconWrap = document.createElement("span");
  iconWrap.className = "doc-copy-icon-wrap";
  iconWrap.innerHTML = ICON_COPY + ICON_CHECK;

  btn.innerHTML = "";
  btn.appendChild(iconWrap);
  btn.appendChild(labelSpan);

  let resetTimer = null;
  btn.addEventListener("click", () => {
    const content = document.getElementById("doc-content");
    if (content) navigator.clipboard.writeText(content.innerText).catch(() => {});

    labelSpan.textContent = tr("docs_btn_copy_page_copied", getDocLang());
    btn.classList.add("is-copied");

    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      labelSpan.textContent = tr("docs_btn_copy", getDocLang());
      btn.classList.remove("is-copied");
      resetTimer = null;
    }, 2000);
  });

  window.__refreshCopyBtn = () => {
    if (!btn.classList.contains("is-copied")) {
      labelSpan.textContent = tr("docs_btn_copy", getDocLang());
    }
  };
})();

// ─── МАРШРУТИЗАЦИЯ ───
window.addEventListener("popstate", (e) => {
  const hash = location.hash.slice(1);
  if (hash && hash.indexOf("--") === -1) {
    const el = document.getElementById(hash);
    if (el) {
      scrollToDocAnchor(hash);
    } else {
      const file = (e.state && e.state.file) || fileFromSlug(hash);
      if (file && file !== currentDocFile) loadDocPage(file);
    }
  } else {
    const file = (e.state && e.state.file) || fileFromSlug(hash);
    if (file && file !== currentDocFile) loadDocPage(file);
  }
});

// ─── ЛОАДЕР ───
function hideLoader() {
  const l = document.getElementById("loader");
  if (l) {
    l.classList.add("hidden");
    setTimeout(() => (l.style.display = "none"), 400);
  }
}
window.addEventListener("load", hideLoader);
window.addEventListener("pageshow", hideLoader);
setTimeout(hideLoader, 3500);

// ─── СТАРТ ───
initDocs();