// All content lives in /content/*.json and is edited through /admin.
const FILES = ["site", "stats", "clients", "companies", "reviews", "projects", "tools"];

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// CMS stores uploads as "/assets/uploads/x.jpg"; make it relative so the site works from any sub-path.
const src = (p = "") => /^https?:/.test(p) ? p : p.replace(/^\/+/, "");
const initials = name => name.split(/\s+/).filter(w => /^[\p{L}\p{N}]/u.test(w)).slice(0, 2).map(w => w[0]).join("").toUpperCase();

// Line icons for services (keys match the "Icon" dropdown in admin/config.yml).
const ICONS = {
  podcast: '<rect x="9" y="2.5" width="6" height="11.5" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5M8.5 21.5h7"/>',
  youtube: '<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9.3v5.4l4.6-2.7z"/>',
  shortform: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.8"/><path d="M10.6 9.3v4.4l3.6-2.2zM10.5 18.3h3"/>',
  film: '<rect x="3" y="10" width="18" height="11" rx="2"/><path d="M3 10 19.6 5.6l-1.2-3.5L2.6 6.5zM7.5 5.3l2.4 3.4M12.3 4l2.4 3.4"/>',
  course: '<path d="M2 9.5 12 4.5l10 5-10 5zM6 11.5v4.8c0 1.4 2.7 3.2 6 3.2s6-1.8 6-3.2v-4.8M22 9.5v5.5"/>',
  color: '<circle cx="12" cy="12" r="9"/><path d="M12 3l3.6 6.2M21 12h-7.2M16.5 19.8 12.9 13.6M7.5 19.8l3.6-6.2M3 12h7.2M7.5 4.2l3.6 6.2"/>',
  camera: '<rect x="2.5" y="6.5" width="13" height="11" rx="2.5"/><path d="M15.5 10.5 21.5 7v10l-6-3.5z"/>',
  captions: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M6.5 12.5h5M13.5 12.5h4M6.5 15.5h8M16.5 15.5h1"/>',
  motion: '<path d="M4 18.5C10 18.5 10 5.5 20 5.5"/><circle cx="4" cy="18.5" r="1.6"/><circle cx="20" cy="5.5" r="1.6"/><path d="M4 5.5h4M16 18.5h4"/>',
  vfx: '<path d="M11 3l1.9 5.6L18.5 10.5l-5.6 1.9L11 18l-1.9-5.6L3.5 10.5l5.6-1.9zM18.5 14.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z"/>',
  music: '<path d="M9 18V5.5l11-2.5v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  audio: '<path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 6v12"/>',
  reframe: '<rect x="2.5" y="7" width="19" height="10" rx="2"/><rect x="8.5" y="3" width="7" height="18" rx="2"/>',
  clients: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M15.5 4.8a3.5 3.5 0 0 1 0 6.4M18 14.5c2.1.8 3.5 2.8 3.5 5.5"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 13.9 7 21.5l5-2.8 5 2.8-1.5-7.6"/>',
  layers: '<path d="M12 3 2.5 8 12 13l9.5-5zM2.5 12.5 12 17.5l9.5-5M2.5 16.5 12 21.5l9.5-5"/>'
};
const icon = key => `<svg viewBox="0 0 24 24" aria-hidden="true">${(ICONS[key] || ICONS.camera).replace(/\/>/g, ' pathLength="1"/>')}</svg>`;

async function load() {
  const data = {};
  await Promise.all(FILES.map(async name => {
    const res = await fetch(`content/${name}.json`, { cache: "no-store" });
    data[name] = await res.json();
  }));
  return data;
}

/* ---------- Render ---------- */

function renderSite(site) {
  const binds = { ...site, firstName: site.name.split(" ")[0] };
  document.querySelectorAll("[data-bind]").forEach(el => {
    const val = binds[el.dataset.bind];
    if (val) el.textContent = val;
  });
  $("#photo").src = src(site.photo);
  $("#edu-degree").textContent = site.education?.degree || "";
  $("#edu-school").textContent = site.education?.school || "";
  $("#about-text").innerHTML = (site.about || "").split(/\n\s*\n/).map(p => `<p>${esc(p)}</p>`).join("");

  if (site.showreel && videoInfo(site.showreel)) {
    const btn = $("#reel-btn");
    btn.hidden = false;
    btn.addEventListener("click", () => openPlayer(site.showreel));
  }

  $("#service-list").innerHTML = (site.services || []).map((s, i) => `
    <article class="service glass spot reveal" style="--d:${(i % 3) * .08}s">
      <div class="service-top">
        <span class="svc-icon">${icon(s.icon)}</span>
        <span class="num">${String(i + 1).padStart(2, "0")}</span>
      </div>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.text)}</p>
    </article>`).join("");

  document.querySelectorAll("[data-fiverr]").forEach(a => {
    a.hidden = !site.fiverr;
    if (site.fiverr) a.href = site.fiverr;
  });

  const creds = site.credentials || [];
  $("#creds").hidden = !creds.length;
  $("#creds").innerHTML = creds.map(c => `
    <li>
      <span class="svc-icon">${icon(c.icon)}</span>
      <div><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></div>
    </li>`).join("");

  renderSocial(site.social);

  const steps = site.process || [];
  $("#process").hidden = !steps.length;
  $("#steps").innerHTML = steps.map((s, i) => `
    <li class="step glass spot reveal" style="--d:${i * .08}s">
      <span class="step-num">${String(i + 1).padStart(2, "0")}</span>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.text)}</p>
    </li>`).join("");

  const c = site.contact || {};
  $("#contact-headline").textContent = c.headline || "";
  $("#contact-text").textContent = c.text || "";
  const links = [];
  if (c.email) links.push(`<a class="btn light" href="mailto:${esc(c.email)}">${esc(c.email)}</a>`);
  (c.links || []).forEach(l => links.push(`<a class="btn ghost" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`));
  if (site.refer?.button) links.push(`<button class="btn ghost" data-refer>${esc(site.refer.button)}</button>`);
  $("#contact-links").innerHTML = links.join("");
}

function renderSocial(social) {
  if (!social?.headline) return;
  $("#social").hidden = false;
  $("#social-headline").textContent = social.headline;
  $("#social-text").textContent = social.text || "";
  $("#social-points").innerHTML = (social.points || []).map((p, i) => `
    <div class="point glass spot reveal" style="--d:${(i % 2) * .08}s">
      <span class="svc-icon">${icon(p.icon)}</span>
      <div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div>
    </div>`).join("");

  const frames = social.frames || [];
  $(".phone-wrap").hidden = !frames.length;
  $("#social").classList.toggle("no-phone", !frames.length);
  $("#phone").innerHTML = frames.map((f, i) => `<img src="${esc(src(f))}" alt="" loading="lazy"${i ? "" : ' class="on"'}>`).join("");
  $("#phone-note").textContent = social.framesNote || "";
  // Cycle the frames like a feed.
  if (frames.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let i = 0;
    const imgs = document.querySelectorAll("#phone img");
    setInterval(() => {
      imgs[i].classList.remove("on");
      i = (i + 1) % imgs.length;
      imgs[i].classList.add("on");
    }, 2800);
  }
}

function renderStats(stats) {
  $("#stats").innerHTML = (stats.items || []).map((s, i) => `
    <li class="stat glass spot reveal" style="--d:${.3 + i * .08}s">
      <strong data-count="${Number(s.value) || 0}" data-prefix="${esc(s.prefix || "")}" data-suffix="${esc(s.suffix || "")}">${esc(s.prefix || "")}0${esc(s.suffix || "")}</strong>
      <span>${esc(s.label)}</span>
    </li>`).join("");
}

// "1.53M" -> 1530000, "581K" -> 581000
const parseCount = (s = "") => {
  const m = String(s).replace(",", ".").match(/([\d.]+)\s*([KM]?)/i);
  return m ? parseFloat(m[1]) * ({ K: 1e3, M: 1e6 }[m[2].toUpperCase()] || 1) : 0;
};
// Rounded down, so the "+" is always true.
const formatCount = n => n >= 1e6 ? Math.floor(n / 1e5) / 10 + "M+" : n >= 1e3 ? Math.floor(n / 1e3) + "K+" : n + "+";

let showClientWork = null; // set by renderProjects

function renderClients(clients, projects) {
  const items = clients.items || [];
  const videos = {};
  (projects.items || []).filter(p => p.client && videoInfo(p.video)).forEach(p => (videos[p.client] = (videos[p.client] || 0) + 1));
  $("#clients").hidden = !items.length;
  const reach = items.reduce((sum, c) => sum + parseCount(c.subscribers), 0);
  $("#reach").hidden = reach < 1e5;
  $("#reach strong").textContent = formatCount(reach);
  $("#client-list").innerHTML = items.map((c, i) => {
    const count = videos[c.name] || 0;
    // "Videos edited" overrides the count, e.g. for work that's no longer online.
    const label = c.videos ? `${c.videos} videos` : `${count} video${count > 1 ? "s" : ""}`;
    // Clients with videos open their work; otherwise the card links to the channel, if set.
    const tag = count ? "button" : c.url ? "a" : "div";
    const attrs = count ? ` data-client="${esc(c.name)}"` : c.url ? ` href="${esc(c.url)}" target="_blank" rel="noopener"` : "";
    const avatar = c.logo ? `<img src="${esc(src(c.logo))}" alt="" loading="lazy">` : esc(initials(c.name));
    return `
      <${tag} class="client glass spot reveal" style="--d:${(i % 4) * .06}s"${attrs}>
        <span class="avatar">${avatar}</span>
        <div>
          <h3>${esc(c.name)}</h3>
          ${c.subscribers ? `<p>${esc(c.subscribers)} subscribers</p>` : ""}
          ${count || c.manager ? `<div class="client-tags">
            ${count ? `<span class="client-videos">${esc(label)} →</span>` : ""}
            ${c.manager ? `<span class="client-role">Channel manager</span>` : ""}
          </div>` : ""}
        </div>
      </${tag}>`;
  }).join("");
  $("#client-list").onclick = e => {
    const card = e.target.closest("[data-client]");
    if (card && showClientWork) showClientWork(card.dataset.client);
  };
}

// Established companies, with a few facts about their size.
function renderCompanies(companies) {
  const items = companies.items || [];
  $("#companies").hidden = !items.length;
  $("#companies-headline").textContent = companies.headline || "";
  $("#companies-text").textContent = companies.text || "";
  $("#companies-note").textContent = companies.note || "";
  $("#company-list").innerHTML = items.map((c, i) => {
    const logo = c.logo ? `<img src="${esc(src(c.logo))}" alt="" loading="lazy">` : esc(initials(c.name));
    return `
      <article class="company glass spot reveal" style="--d:${(i % 3) * .08}s">
        <div class="company-top">
          <span class="avatar company-logo">${logo}</span>
          <div>
            <h3>${esc(c.name)}</h3>
            ${c.location ? `<p>${esc(c.location)}</p>` : ""}
          </div>
        </div>
        <p class="company-about">${esc(c.about || "")}</p>
        <dl class="company-stats">${(c.stats || []).map(s => `<div><dt>${esc(s.value)}</dt><dd>${esc(s.label)}</dd></div>`).join("")}</dl>
        ${c.url ? `<a class="company-link" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))} ↗</a>` : ""}
      </article>`;
  }).join("");
}

// A big project that can't be embedded (e.g. a course that is no longer online).
function renderFeatured(f, clients) {
  if (!f?.title) return;
  const c = (clients.items || []).find(x => x.name === f.client) || {};
  const avatar = c.logo ? `<img src="${esc(src(c.logo))}" alt="" loading="lazy">` : esc(initials(f.client || f.title));
  const images = f.images || [];
  const el = $("#featured");
  el.hidden = false;
  el.dataset.client = f.client || "";
  el.classList.toggle("has-media", images.length > 0);
  el.innerHTML = `
    <div class="featured-text">
      ${f.label ? `<span class="featured-label">${esc(f.label)}</span>` : ""}
      <h3>${esc(f.title)}</h3>
      ${f.client ? `<p class="featured-client"><span class="avatar">${avatar}</span><span>for <strong>${esc(f.client)}</strong>${c.subscribers ? ` · ${esc(c.subscribers)} subscribers` : ""}</span></p>` : ""}
      <p class="featured-desc">${esc(f.text || "")}</p>
      ${(f.topics || []).length ? `<ul class="featured-topics">${f.topics.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
    </div>
    <div class="featured-side">
      ${images.length ? `<div class="featured-media">${images.slice(0, 4).map(i => `<img src="${esc(src(i))}" alt="" loading="lazy">`).join("")}</div>` : ""}
      <dl class="featured-stats">${(f.stats || []).map(s => `<div><dt>${esc(s.value)}</dt><dd>${esc(s.label)}</dd></div>`).join("")}</dl>
    </div>
    ${f.note ? `<p class="featured-note">${esc(f.note)}</p>` : ""}`;
}

// Reviews reuse the client's avatar and subscriber count, matched by name.
function renderReviews(reviews, clients) {
  const items = reviews.items || [];
  const byName = Object.fromEntries((clients.items || []).map(c => [c.name, c]));
  $("#reviews").hidden = !items.length;
  // 4 reviews read better as 2×2 than as 3 + 1.
  $("#review-list").classList.toggle("two", items.length % 3 === 1 && items.length % 2 === 0);
  $("#reviews-sub").textContent = reviews.source ? `Left by clients on ${reviews.source}, word for word.` : "Word for word from my clients.";
  $("#review-list").innerHTML = items.map((r, i) => {
    const c = byName[r.name] || {};
    const avatar = c.logo ? `<img src="${esc(src(c.logo))}" alt="" loading="lazy">` : esc(initials(r.name));
    return `
      <figure class="review glass spot reveal" style="--d:${(i % 3) * .08}s">
        <span class="quote-mark" aria-hidden="true">“</span>
        <blockquote>
          <p>${esc(r.text)}</p>
          ${r.translation ? `<p class="translation">${esc(r.translation)} <span>· translated</span></p>` : ""}
        </blockquote>
        <figcaption>
          <span class="avatar">${avatar}</span>
          <div>
            <h3>${esc(r.name)}</h3>
            <p>${c.subscribers ? `${esc(c.subscribers)} subscribers` : ""}${c.subscribers && reviews.source ? " · " : ""}${reviews.source ? `via ${esc(reviews.source)}` : ""}</p>
          </div>
        </figcaption>
      </figure>`;
  }).join("");
}

function videoInfo(url = "") {
  const yt = url.match(/(?:youtu\.be\/|[?&]v=|shorts\/|embed\/|live\/)([\w-]{11})/);
  if (yt) return {
    embed: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1`,
    thumb: `https://i.ytimg.com/vi/${yt[1]}/maxresdefault.jpg`,
    fallback: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`,
    vertical: /shorts\//.test(url)
  };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { embed: `https://player.vimeo.com/video/${vm[1]}?autoplay=1`, thumb: "", vertical: false };
  return null;
}

function renderProjects(projects) {
  const items = (projects.items || []).filter(p => videoInfo(p.video));
  $("#work").hidden = !items.length;
  document.querySelectorAll('[data-section-link="work"]').forEach(a => (a.hidden = !items.length));
  if (!items.length) return;

  // Shorts links are vertical automatically; the "Vertical video" switch covers vertical uploads with normal links.
  const isVertical = p => !!(p.vertical || videoInfo(p.video).vertical);
  const card = (p, i) => {
    const v = videoInfo(p.video);
    const tall = isVertical(p);
    // Vertical videos only have letterboxed hqdefault thumbnails, which "cover" crops cleanly to 9:16.
    const thumb = p.thumbnail ? src(p.thumbnail) : tall ? v.fallback : v.thumb;
    const fallback = !p.thumbnail && !tall && v.fallback ? ` data-fallback="${esc(v.fallback)}"` : "";
    const meta = [p.client, p.views && `${p.views} views`].filter(Boolean).map(esc).join(" · ");
    return `
      <button class="project glass spot reveal in" style="--d:${(i % 3) * .06}s" data-video="${esc(p.video)}" data-vertical="${tall}">
        <div class="thumb">${thumb ? `<img src="${esc(thumb)}" alt="" loading="lazy"${fallback}>` : ""}<span class="play">▶</span></div>
        <div class="meta"><h3>${esc(p.title)}</h3>${meta ? `<p>${meta}</p>` : ""}</div>
      </button>`;
  };

  // Two independent filters (category + client) that combine.
  const filter = { cat: "All", client: "All" };
  // Long lists start short and grow with "Show more"; changing a filter starts over.
  const PAGE = { wide: 9, tall: 10 };
  let shown = { ...PAGE };
  const cats = ["All", ...new Set(items.map(p => p.category).filter(Boolean))];
  const clients = ["All", ...new Set(items.map(p => p.client).filter(Boolean))];
  const draw = (more = false) => {
    shown = more ? { wide: shown.wide + PAGE.wide, tall: shown.tall + PAGE.tall } : { ...PAGE };
    const list = items.filter(p => (filter.cat === "All" || p.category === filter.cat) && (filter.client === "All" || p.client === filter.client));
    const wide = list.filter(p => !isVertical(p)), tall = list.filter(isVertical);
    $("#project-list").innerHTML = wide.slice(0, shown.wide).map(card).join("");
    $("#shorts-list").innerHTML = tall.slice(0, shown.tall).map(card).join("");
    const left = Math.max(0, wide.length - shown.wide) + Math.max(0, tall.length - shown.tall);
    $("#work-more").hidden = !left;
    $("#work-more").textContent = `Show more · ${left} left`;
    $("#project-list").hidden = !wide.length;
    $("#shorts-list").hidden = !tall.length;
    // maxresdefault doesn't exist for every video; YouTube then serves a 120px placeholder.
    $("#work").querySelectorAll("img[data-fallback]").forEach(img => {
      const swap = () => { img.src = img.dataset.fallback; img.removeAttribute("data-fallback"); };
      img.addEventListener("error", swap, { once: true });
      img.addEventListener("load", () => img.naturalWidth <= 120 && img.dataset.fallback && swap(), { once: true });
    });
    $("#work-empty").hidden = list.length > 0;
  };
  tabs($("#work-filters"), cats.length > 2 ? cats : [], cat => { filter.cat = cat; draw(); });
  tabs($("#work-clients"), clients.length > 2 ? clients : [], client => { filter.client = client; draw(); });
  $("#work-cats-row").hidden = $("#work-filters").hidden;
  $("#work-clients-row").hidden = $("#work-clients").hidden;
  $("#work-more").onclick = () => draw(true);
  draw();

  // Lets the client cards jump straight to that client's videos.
  showClientWork = name => {
    filter.client = name;
    $("#work-clients").querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b.textContent === name));
    draw();
    // Land on the videos, not the section top (the featured card would fill the screen),
    // except for the featured project's client, whose biggest work is that card.
    const featured = $("#featured");
    const target = !featured.hidden && featured.dataset.client === name ? featured : $("#work-clients-row");
    scrollToEl(target);
  };
  $("#work").addEventListener("click", e => {
    const card = e.target.closest("[data-video]");
    if (card) openPlayer(card.dataset.video, card.dataset.vertical === "true");
  });
}

// Smooth-scrolls to el, then re-aims once scrolling stops in case images loading above it moved the layout.
function scrollToEl(el) {
  el.scrollIntoView({ behavior: "smooth" });
  const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + parseFloat(getComputedStyle(el).scrollMarginTop);
  let timer;
  const settle = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      removeEventListener("scroll", settle);
      if (Math.abs(el.getBoundingClientRect().top - offset) > 24) el.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };
  addEventListener("scroll", settle);
}

function tabs(root, labels, onSelect) {
  root.hidden = labels.length < 2;
  root.innerHTML = labels.map((l, i) => `<button role="tab" aria-selected="${i === 0}">${esc(l)}</button>`).join("");
  root.onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    root.querySelectorAll("button").forEach(x => x.setAttribute("aria-selected", x === b));
    onSelect(b.textContent);
  };
}

function renderTools(tools) {
  $("#software-list").innerHTML = (tools.software || []).map((s, i) => `
    <div class="app glass spot reveal" style="--d:${i * .08}s">
      <span class="app-icon">${esc(s.short || initials(s.name))}</span>
      <div><h3>${esc(s.name)}</h3>${s.note ? `<p>${esc(s.note)}</p>` : ""}</div>
    </div>`).join("");

  const subs = tools.subscriptions || [];
  $(".marquee").hidden = !subs.length;
  if (!subs.length) return;
  // Repeat so the strip is always wider than the screen, then double it for a seamless loop.
  let row = [];
  while (row.length < 12) row = row.concat(subs);
  const html = row.map(s => `<span class="glass">${s.logo ? `<img src="${esc(src(s.logo))}" alt="">` : ""}${esc(s.name)}</span>`).join("");
  $("#subs-track").innerHTML = html + html;
}

/* ---------- Interactions ---------- */

function openPlayer(url, vertical) {
  const v = videoInfo(url);
  if (!v) return;
  const frame = $("#player-frame");
  frame.classList.toggle("vertical", vertical ?? v.vertical);
  frame.innerHTML = `<iframe src="${esc(v.embed)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  $("#player").showModal();
}

function initPlayer() {
  const dlg = $("#player");
  dlg.addEventListener("close", () => ($("#player-frame").innerHTML = ""));
  dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest(".close")) dlg.close(); });
}

function initReveal() {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el));
}

function initCounters() {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, { prefix, suffix } = el.dataset;
    const decimals = (String(end).split(".")[1] || "").length;
    const t0 = performance.now(), dur = 1600;
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      const v = end * (1 - (1 - p) ** 3);
      el.textContent = prefix + v.toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .5 });
  document.querySelectorAll("[data-count]").forEach(el => io.observe(el));
}

function initSpotlight() {
  document.addEventListener("pointermove", e => {
    const card = e.target.closest?.(".spot");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", e.clientX - r.left + "px");
    card.style.setProperty("--my", e.clientY - r.top + "px");
  });
}

function initNav() {
  const nav = $(".nav"), btn = $("#menu");
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });
  $("#links").addEventListener("click", e => {
    if (e.target.closest("a")) { nav.classList.remove("open"); btn.setAttribute("aria-expanded", false); }
  });
}

/* ---------- Refer me: Instagram story card ---------- */

// Drawn in the browser from the site's own content, so the card stays current.
const STORY_W = 1080, STORY_H = 1920;
const FONT = '"Inter", -apple-system, "Segoe UI", sans-serif';
const REFER_LINES = ["My video editor", "Need a video editor?", "Looking for an editor? Here's mine."];

const loadImg = url => new Promise(res => {
  if (!url) return res(null);
  const img = new Image();
  img.onload = () => res(img);
  img.onerror = () => res(null);
  img.src = url;
});

// Cover-crops into w×h and turns it black and white by hand (Safari has no ctx.filter).
function mono(img, w, h, focusY = .5) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x = c.getContext("2d");
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const iw = img.naturalWidth * s, ih = img.naturalHeight * s;
  x.drawImage(img, (w - iw) / 2, (h - ih) * focusY, iw, ih);
  const d = x.getImageData(0, 0, w, h), p = d.data;
  for (let i = 0; i < p.length; i += 4) p[i] = p[i + 1] = p[i + 2] = (.299 * p[i] + .587 * p[i + 1] + .114 * p[i + 2] - 128) * 1.08 + 128;
  x.putImageData(d, 0, 0);
  return c;
}

const roundPath = (ctx, x, y, w, h, r) => {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const vgrad = (ctx, y0, y1, a, b) => {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
};

function setFont(ctx, size, weight = 400, track = 0, align = "left") {
  ctx.font = `${weight} ${size}px ${FONT}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${track}px`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
}

// Shrinks the font until the text fits on one line.
function fitFont(ctx, s, size, weight, max, track = 0, align = "left") {
  for (; size > 16; size -= 2) {
    setFont(ctx, size, weight, track, align);
    if (ctx.measureText(s).width <= max) break;
  }
  return size;
}

function wrapText(ctx, s, max) {
  const out = [];
  let line = "";
  for (const word of String(s).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > max) { out.push(line); line = word; } else line = next;
  }
  if (line) out.push(line);
  return out;
}

// Frosted card: shadow only outside the shape, translucent fill, bright hairline edge.
function glassBox(ctx, x, y, w, h, r, dark = false) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(-STORY_W, -STORY_H, STORY_W * 3, STORY_H * 3);
  roundPath(ctx, x, y, w, h, r);
  ctx.clip("evenodd");
  ctx.shadowColor = `rgba(0,0,0,${dark ? .5 : .13})`;
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 26;
  ctx.beginPath();
  roundPath(ctx, x, y, w, h, r);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  roundPath(ctx, x, y, w, h, r);
  ctx.fillStyle = dark ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.62)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = dark ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.95)";
  ctx.stroke();
}

// A rounded label; x is its centre (or its left edge with left: true). Returns its width.
function pill(ctx, s, x, y, { size = 30, weight = 600, track = 0, h = 76, pad = 38, fill, color = "#0a0a0a", glass, dark, dot, left } = {}) {
  setFont(ctx, size, weight, track);
  const w = ctx.measureText(s).width + pad * 2 + (dot ? 34 : 0);
  if (!left) x -= w / 2;
  if (glass) glassBox(ctx, x, y, w, h, h / 2, dark);
  else { ctx.beginPath(); roundPath(ctx, x, y, w, h, h / 2); ctx.fillStyle = fill; ctx.fill(); }
  ctx.fillStyle = color;
  if (dot) { ctx.beginPath(); ctx.arc(x + pad + 8, y + h / 2, 8, 0, Math.PI * 2); ctx.fill(); }
  ctx.textBaseline = "middle";
  ctx.fillText(s, x + pad + (dot ? 34 : 0), y + h / 2 + 2);
  return w;
}

function circleImg(ctx, img, cx, cy, r, ring, shadow) {
  if (shadow) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 6; ctx.strokeStyle = ring; ctx.stroke();
}

function blob(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(.68, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, STORY_W, STORY_H);
}

function lightBg(ctx) {
  ctx.fillStyle = vgrad(ctx, 0, STORY_H, "#fbfbfd", "#ececf0");
  ctx.fillRect(0, 0, STORY_W, STORY_H);
  blob(ctx, 100, 240, 1000, "0,0,0", .17);
  blob(ctx, 1080, 1250, 900, "0,0,0", .12);
  blob(ctx, 400, 1900, 800, "255,255,255", 1);
}

function darkBg(ctx) {
  const g = ctx.createRadialGradient(540, -200, 0, 540, -200, 1900);
  g.addColorStop(0, "#2a2a2e");
  g.addColorStop(.6, "#0b0b0c");
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, STORY_W, STORY_H);
  blob(ctx, 980, 1500, 900, "255,255,255", .07);
}

// Each design draws its content on a transparent layer and returns its [top, bottom],
// so render() can centre it over the background.

// Light: the hero photo in a tilted glass frame.
function drawPhotoCard(ctx, d) {
  pill(ctx, d.lines[0].toUpperCase(), 540, 190, { size: 28, track: 5, glass: true, color: "#424245", dot: true });

  ctx.save();
  ctx.translate(540, 730);
  ctx.rotate(.026);
  glassBox(ctx, -330, -412, 660, 824, 60);
  if (d.photo) {
    ctx.save();
    ctx.beginPath(); roundPath(ctx, -316, -398, 632, 796, 48); ctx.clip();
    ctx.drawImage(mono(d.photo, 632, 796, .3), -316, -398);
    ctx.restore();
  }
  ctx.restore();
  const spots = [[180, 470], [900, 840], [220, 1080]];
  d.chips.slice(0, 3).forEach((c, i) => pill(ctx, c, spots[i][0], spots[i][1], { size: 30, glass: true, h: 78, pad: 36 }));

  const size = fitFont(ctx, d.name, 136, 800, 960, -6, "center");
  ctx.fillStyle = vgrad(ctx, 1300 - size * .8, 1300, "#000", "#6e6e73");
  ctx.fillText(d.name, 540, 1300);
  fitFont(ctx, d.role.toUpperCase(), 28, 600, 960, 5, "center");
  ctx.fillStyle = "#86868b";
  ctx.fillText(d.role.toUpperCase(), 540, 1370);
  setFont(ctx, 50, 600, -1.5, "center");
  ctx.fillStyle = "#0a0a0a";
  wrapText(ctx, d.headline, 860).slice(0, 2).forEach((l, i) => ctx.fillText(l, 540, 1470 + i * 62));
  if (d.link) pill(ctx, d.link, 540, 1600, { size: 34, fill: "#0a0a0a", color: "#fff", h: 100, pad: 56 });
  return [190, d.link ? 1700 : 1540];
}

// Dark: big question, then the numbers.
function drawStatsCard(ctx, d) {
  setFont(ctx, 124, 800, -6);
  const head = wrapText(ctx, d.lines[1], 900).slice(0, 3);
  ctx.fillStyle = vgrad(ctx, 230, 330 + head.length * 124, "#fff", "#8e8e93");
  head.forEach((l, i) => ctx.fillText(l, 90, 330 + i * 124));
  let y = 330 + (head.length - 1) * 124 + 90;

  if (d.photo) circleImg(ctx, mono(d.photo, 300, 300, .25), 165, y + 75, 75, "rgba(255,255,255,.25)");
  fitFont(ctx, d.name, 60, 700, 720, -2);
  ctx.fillStyle = "#fff";
  ctx.fillText(d.name, 270, y + 70);
  fitFont(ctx, d.role.toUpperCase(), 24, 600, 720, 4);
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.fillText(d.role.toUpperCase(), 270, y + 116);
  y += 200;

  const stats = d.stats.slice(0, 4);
  stats.forEach((s, i) => {
    const x = 90 + (i % 2) * 465, top = y + Math.floor(i / 2) * 272;
    glassBox(ctx, x, top, 435, 248, 44, true);
    setFont(ctx, 112, 800, -6);
    ctx.fillStyle = vgrad(ctx, top + 40, top + 135, "#fff", "#a1a1a6");
    ctx.fillText(s.value, x + 40, top + 135);
    setFont(ctx, 29, 500);
    ctx.fillStyle = "rgba(255,255,255,.6)";
    wrapText(ctx, s.label, 355).slice(0, 2).forEach((l, j) => ctx.fillText(l, x + 40, top + 186 + j * 36));
  });
  y += Math.ceil(stats.length / 2) * 272 + 10;

  let x = 90;
  setFont(ctx, 27, 600);
  d.services.forEach(s => {
    const w = ctx.measureText(s).width + 64;
    if (x + w > 990) { x = 90; y += 82; }
    x += pill(ctx, s, x, y, { size: 27, glass: true, dark: true, color: "rgba(255,255,255,.85)", h: 66, pad: 32, left: true }) + 14;
  });
  y += 66;
  if (d.link) pill(ctx, d.link, 540, y + 64, { size: 34, fill: "#fff", color: "#000", h: 100, pad: 56 });
  return [235, d.link ? y + 164 : y];
}

// Light: client avatars and their combined reach.
function drawClientsCard(ctx, d) {
  setFont(ctx, 96, 800, -4.5, "center");
  const head = wrapText(ctx, d.lines[2], 940).slice(0, 3);
  ctx.fillStyle = vgrad(ctx, 240, 330 + head.length * 104, "#000", "#6e6e73");
  head.forEach((l, i) => ctx.fillText(l, 540, 320 + i * 104));
  let y = 320 + (head.length - 1) * 104 + 90;

  const logos = d.logos.slice(0, 8), per = 4, r = 88, gap = 34;
  logos.forEach((img, i) => {
    const row = Math.floor(i / per), inRow = Math.min(per, logos.length - row * per);
    circleImg(ctx, mono(img, 240, 240), 540 + ((i % per) - (inRow - 1) / 2) * (r * 2 + gap), y + r + row * (r * 2 + gap), r, "#fff", true);
  });
  y += Math.ceil(logos.length / per) * (r * 2 + gap) + 150;

  if (d.reach >= 1e5) {
    setFont(ctx, 180, 800, -8, "center");
    ctx.fillStyle = vgrad(ctx, y - 140, y, "#000", "#6e6e73");
    ctx.fillText(formatCount(d.reach), 540, y);
    setFont(ctx, 34, 500, 0, "center");
    ctx.fillStyle = "#424245";
    ctx.fillText("combined subscribers across these channels", 540, y + 64, 920);
    y += 130;
  }

  const top = y;
  glassBox(ctx, 90, top, 900, 230, 56);
  if (d.photo) circleImg(ctx, mono(d.photo, 280, 280, .25), 210, top + 115, 72, "#fff");
  fitFont(ctx, d.name, 56, 700, 640, -2);
  ctx.fillStyle = "#0a0a0a";
  ctx.fillText(d.name, 312, top + 88);
  fitFont(ctx, d.role.toUpperCase(), 22, 600, 640, 4);
  ctx.fillStyle = "#86868b";
  ctx.fillText(d.role.toUpperCase(), 312, top + 130);
  if (d.link) {
    fitFont(ctx, d.link, 32, 600, 640);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillText(d.link, 312, top + 184);
  }
  return [245, top + 230];
}

const DESIGNS = [
  { name: "Photo", bg: lightBg, draw: drawPhotoCard },
  { name: "Stats", bg: darkBg, draw: drawStatsCard },
  { name: "Clients", bg: lightBg, draw: drawClientsCard }
];

function initRefer(data) {
  const site = data.site, r = site.refer || {};
  $("#refer-cta").hidden = !r.button;
  if (!r.button) return;
  document.querySelectorAll("[data-refer]").forEach(b => (b.textContent = r.button));
  $("#refer-cta-title").textContent = r.title || "";
  $("#refer-cta-text").textContent = r.text || "";

  // Until the site is online its own address is localhost, so fall back to Fiverr.
  const local = location.protocol === "file:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const link = r.link || (local ? "" : location.origin + location.pathname.replace(/index\.html$/, "")) || site.fiverr || "";
  const shownLink = link.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const fileName = `${site.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-story.png`;

  let card;
  const cardData = async () => {
    if (card) return card;
    try { await Promise.all([500, 600, 700, 800].map(w => document.fonts.load(`${w} 40px Inter`))); } catch {}
    const clients = data.clients.items || [];
    const [photo, ...logos] = await Promise.all([loadImg(src(site.photo)), ...clients.filter(c => c.logo).map(c => loadImg(src(c.logo)))]);
    return (card = {
      name: site.name, role: site.role || "", headline: site.headline || "",
      link: shownLink && `${shownLink} ↗`,
      lines: REFER_LINES.map((t, i) => r.cards?.[i] || t),
      photo, logos: logos.filter(Boolean),
      chips: [...document.querySelectorAll(".hero-photo .chip")].map(c => c.textContent.trim()),
      stats: (data.stats.items || []).map(s => ({ value: `${s.prefix || ""}${s.value}${s.suffix || ""}`, label: s.label })),
      services: (site.services || []).map(s => s.title),
      reach: clients.reduce((n, c) => n + parseCount(c.subscribers), 0)
    });
  };

  const urls = {}, files = {};
  const render = async i => {
    if (!urls[i]) {
      const [c, layer] = [0, 0].map(() => Object.assign(document.createElement("canvas"), { width: STORY_W, height: STORY_H }));
      const [top, bottom] = DESIGNS[i].draw(layer.getContext("2d"), await cardData());
      const ctx = c.getContext("2d");
      DESIGNS[i].bg(ctx);
      // Centre the content, keeping it clear of Instagram's top and bottom bars.
      ctx.drawImage(layer, 0, Math.max(200 - top, Math.min(1720 - bottom, (STORY_H - top - bottom) / 2)));
      const blob = await new Promise(res => c.toBlob(res, "image/png"));
      files[i] = new File([blob], fileName, { type: "image/png" });
      urls[i] = URL.createObjectURL(blob);
    }
  };

  // The clients design needs a few avatars to look right.
  const logoCount = (data.clients.items || []).filter(c => c.logo).length;
  const avail = DESIGNS.map((_, i) => i).filter(i => DESIGNS[i].name !== "Clients" || logoCount >= 3);
  const dlg = $("#refer"), preview = $(".refer-preview");
  const defaultHint = shownLink ? `Tip: add a link sticker with ${shownLink} so people can find me.` : "";
  const hint = t => ($("#refer-hint").textContent = t);
  let current = avail[0];

  const show = async i => {
    current = i;
    $("#refer-designs").querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b.textContent === DESIGNS[i].name));
    preview.classList.add("loading");
    await render(i);
    if (current !== i) return;
    $("#refer-img").src = urls[i];
    $("#refer-save").href = urls[i];
    preview.classList.remove("loading");
  };
  tabs($("#refer-designs"), avail.map(i => DESIGNS[i].name), name => show(DESIGNS.findIndex(d => d.name === name)));
  $("#refer-save").download = fileName;
  $("#refer-copy").hidden = !link;

  // Phones get the share sheet (Instagram → Story, Save Image); computers download the file.
  const canShare = !!navigator.canShare?.({ files: [new File([""], "x.png", { type: "image/png" })] }) && matchMedia("(pointer: coarse)").matches;
  $("#refer-share").hidden = !canShare;
  $("#refer-save").classList.toggle("dark", !canShare);
  $("#refer-save").classList.toggle("glass", canShare);

  const copyLink = () => link && navigator.clipboard?.writeText(link).then(() => hint("Link copied. Paste it into a link sticker on your story."), () => {});
  $("#refer-copy").onclick = copyLink;
  $("#refer-share").onclick = () => {
    if (!files[current]) return;
    copyLink();
    navigator.share({ files: [files[current]] }).catch(() => {});
  };

  // Each open shows the next design, starting from a random one.
  document.addEventListener("click", e => {
    if (!e.target.closest("[data-refer]")) return;
    let n = Math.floor(Math.random() * avail.length);
    try {
      const last = localStorage.getItem("refer-design");
      if (last !== null) n = (+last + 1) % avail.length;
      localStorage.setItem("refer-design", n);
    } catch {}
    hint(defaultHint);
    dlg.showModal();
    show(avail[n]);
  });
  dlg.addEventListener("click", e => { if (e.target === dlg || e.target.closest(".close")) dlg.close(); });
}

/* ---------- Boot ---------- */

$("#year").textContent = new Date().getFullYear();
initNav();
initPlayer();
initSpotlight();

load().then(data => {
  renderSite(data.site);
  renderStats(data.stats);
  renderClients(data.clients, data.projects);
  renderCompanies(data.companies);
  renderReviews(data.reviews, data.clients);
  renderFeatured(data.site.featured, data.clients);
  renderProjects(data.projects);
  renderTools(data.tools);
  initRefer(data);
}).catch(err => {
  console.error("Could not load content. Open the site through a web server, not as a file.", err);
}).finally(() => {
  initReveal();
  initCounters();
});
