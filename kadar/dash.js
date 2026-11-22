'use strict';
// Kadar Beta — таблото. Всичко от данните се показва с textContent (никакъв innerHTML — никовете идват от тестърите).
(async () => {
  const data = await KadarAuth.load();
  if (!data) { location.replace('/kadar/'); return; }

  const $ = (id) => document.getElementById(id);
  const SVG = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nf = new Intl.NumberFormat('bg-BG');
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const sv = (tag, attrs) => { const e = document.createElementNS(SVG, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const arr = (k) => (Array.isArray(data[k]) ? data[k] : []);
  const online = arr('online'), reports = arr('reports'), problems = arr('problems'), games = arr('games');
  const daily = arr('daily'), cats = arr('categories'), testers = arr('testers'), versions = arr('versions');

  $('logout').addEventListener('click', () => { KadarAuth.logout(); location.replace('/kadar/'); });
  $('app').hidden = false;
  const gen = data.generated ? new Date(data.generated) : null;
  $('updated').textContent = gen ? 'Обновено ' + gen.toLocaleString('bg-BG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  // ---------- Подсказка ----------
  const tip = $('tip');
  function showTip(ev, title, line) {
    tip.replaceChildren(el('b', null, title), el('span', null, line));
    tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.min(ev.clientX + 14, innerWidth - w - 8) + 'px';
    tip.style.top = Math.min(ev.clientY + 16, innerHeight - h - 8) + 'px';
  }
  const hideTip = () => { tip.hidden = true; };

  // ---------- Броене нагоре ----------
  function countUp(node, to) {
    if (reduce || to === 0) { node.textContent = nf.format(to); return; }
    const t0 = performance.now(), dur = 900;
    const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); node.textContent = nf.format(Math.round(to * e)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  const grow = (fill, pct) => requestAnimationFrame(() => requestAnimationFrame(() => fill.style.setProperty('width', pct + '%')));

  // ---------- Обобщение ----------
  const onNow = online.filter((r) => r.status === 'онлайн');
  const redTotal = reports.reduce((a, r) => a + (+r.red || 0), 0);
  const manual = reports.filter((r) => r.kind === 'доклад').length;
  countUp($('kOnline'), onNow.length);
  $('kOnlineS').textContent = `от ${nf.format(online.length)} компютъра в бетата`;
  countUp($('kTesters'), testers.length);
  $('kTestersS').textContent = versions.length ? `${versions.length} различни версии` : '';
  countUp($('kReports'), reports.length);
  $('kReportsS').textContent = manual === 1 ? '1 ръчен доклад' : manual ? `${manual} ръчни доклада` : 'само дневни';
  countUp($('kRed'), redTotal);

  const lead = $('lead');
  lead.replaceChildren();
  const b = (t) => el('b', null, t);
  lead.append('Онлайн сега: ', b(nf.format(onNow.length)), ` от ${nf.format(online.length)} компютъра. `);
  if (cats.length) lead.append('Най-много проблеми има в ', b(cats[0].category.toLowerCase()), ` (${nf.format(cats[0].count)} реда)`);
  if (reports.length) lead.append(`, а последният отчет е от ${reports[0].at}.`); else lead.append('.');

  // ---------- Мини графика (проблеми по дни) ----------
  (() => {
    const s = $('kSpark'); if (daily.length < 2) return;
    const max = Math.max(1, ...daily.map((d) => d.red));
    const pts = daily.map((d, i) => [i / (daily.length - 1) * 200, 38 - (d.red / max) * 32]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    s.append(sv('path', { d: line + ' L200 40 L0 40 Z', fill: 'rgba(255,92,92,.14)' }), sv('path', { d: line, fill: 'none', stroke: '#FF5C5C', 'stroke-width': 1.6 }));
  })();

  // ---------- Кой е онлайн ----------
  (() => {
    const ul = $('onlineList');
    $('onlineChip').textContent = `${onNow.length} онлайн`;
    if (!online.length) { ul.append(el('li', 'k-empty', 'Още никой не се е обадил. Статусът идва от Kadar 1.9.2 нататък.')); return; }
    for (const r of online) {
      const li = el('li', r.status === 'онлайн' ? '' : 'off');
      li.append(el('span', 'k-dot' + (r.status === 'онлайн' ? ' on' : '')));
      const who = el('div', 'who');
      who.append(el('b', null, r.nick || r.pc), el('span', null, [r.nick ? r.pc : '', r.version ? 'v' + r.version : '', r.state, r.game ? '🎮 ' + r.game : ''].filter(Boolean).join(' · ')));
      li.append(who);
      const m = +r.seen_min || 0;
      li.append(el('span', 'when', r.status === 'онлайн' ? 'сега' : m >= 1440 ? `преди ${Math.floor(m / 1440)} д` : m >= 60 ? `преди ${Math.floor(m / 60)} ч` : `преди ${m} мин`));
      ul.append(li);
    }
  })();

  // ---------- Поничка: проблеми по вид ----------
  (() => {
    const svg = $('donut'), leg = $('legend');
    const colors = ['#FF5C5C', '#FF8A3D', '#F2B84B', '#7C5CFF', '#34D399', '#4CC9F0', '#C084FC', '#8A90A0'];
    const total = cats.reduce((a, c) => a + c.count, 0);
    if (!total) { leg.append(el('li', 'k-muted', 'Няма проблеми.')); return; }
    const R = 80, r = 52, cx = 100, cy = 100;
    let a0 = -Math.PI / 2;
    cats.forEach((c, i) => {
      const frac = c.count / total, a1 = a0 + frac * Math.PI * 2 - (cats.length > 1 ? 0.02 : 0);
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const p = (rad, ang) => [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)];
      const [x0, y0] = p(R, a0), [x1, y1] = p(R, a1), [x2, y2] = p(r, a1), [x3, y3] = p(r, a0);
      const d = frac >= 0.999
        ? `M${cx} ${cy - R} A${R} ${R} 0 1 1 ${cx - 0.01} ${cy - R} L${cx - 0.01} ${cy - r} A${r} ${r} 0 1 0 ${cx} ${cy - r} Z`
        : `M${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${r} ${r} 0 ${large} 0 ${x3} ${y3} Z`;
      const seg = sv('path', { d, fill: colors[i % colors.length] });
      seg.style.setProperty('opacity', reduce ? '1' : '0');
      seg.style.setProperty('transition', `opacity .5s ${i * 0.08}s`);
      seg.addEventListener('pointermove', (ev) => showTip(ev, c.category, `${nf.format(c.count)} реда · ${Math.round(frac * 100)}%`));
      seg.addEventListener('pointerleave', hideTip);
      svg.append(seg);
      requestAnimationFrame(() => requestAnimationFrame(() => seg.style.setProperty('opacity', '1')));
      const li = el('li'); const sw = el('i'); sw.style.setProperty('background', colors[i % colors.length]);
      li.append(sw, el('span', null, c.category), el('span', 'v', `${nf.format(c.count)} · ${Math.round(frac * 100)}%`));
      leg.append(li);
      a0 = a0 + frac * Math.PI * 2;
    });
    const t1 = sv('text', { x: cx, y: cy - 2, 'text-anchor': 'middle', fill: '#E8EAEE', 'font-size': 24, 'font-weight': 600 }); t1.textContent = nf.format(total);
    const t2 = sv('text', { x: cx, y: cy + 17, 'text-anchor': 'middle', fill: '#8A90A0', 'font-size': 11 }); t2.textContent = 'проблема';
    svg.append(t1, t2);
  })();

  // ---------- Активност по дни (стълбове) ----------
  function drawDays() {
    const host = $('dayChart'); host.replaceChildren();
    if (!daily.length) { host.append(el('div', 'k-empty', 'Още няма данни по дни.')); return; }
    const W = Math.max(300, host.clientWidth), H = 230, padL = 38, padB = 26, padT = 10;
    const max = Math.max(1, ...daily.map((d) => d.red + d.amber));
    const nice = Math.pow(10, Math.floor(Math.log10(max))), top = Math.ceil(max / nice) * nice;
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Проблеми и предупреждения по дни' });
    const y = (v) => padT + (H - padT - padB) * (1 - v / top);
    for (let i = 0; i <= 4; i++) {
      const v = top * i / 4, yy = y(v);
      svg.append(sv('line', { x1: padL, x2: W, y1: yy, y2: yy, class: 'k-grid-line' }));
      const t = sv('text', { x: padL - 8, y: yy + 4, 'text-anchor': 'end', class: 'k-axis' }); t.textContent = nf.format(v); svg.append(t);
    }
    const n = daily.length, slot = (W - padL) / n, bw = Math.max(6, Math.min(44, slot * 0.62));
    const labelEvery = Math.ceil(n / Math.max(1, Math.floor((W - padL) / 58)));
    daily.forEach((d, i) => {
      const x = padL + i * slot + (slot - bw) / 2;
      const g = sv('g', {});
      const hr = (H - padT - padB) * d.red / top, ha = (H - padT - padB) * d.amber / top;
      const base = H - padB;
      const rr = sv('rect', { x, width: bw, rx: 4, fill: '#FF5C5C', y: base, height: 0 });
      const ra = sv('rect', { x, width: bw, rx: 4, fill: '#F2B84B', y: base, height: 0 });
      g.append(rr, ra);
      const hit = sv('rect', { x: padL + i * slot, y: padT, width: slot, height: H - padT - padB, fill: 'transparent' });
      const [yy, mm, dd] = d.day.split('-');
      hit.addEventListener('pointermove', (ev) => showTip(ev, `${+dd}.${mm}.${yy}`, `${nf.format(d.red)} проблема · ${nf.format(d.amber)} предупреждения · ${d.testers} тестър(и)`));
      hit.addEventListener('pointerleave', hideTip);
      g.append(hit);
      svg.append(g);
      if (i % labelEvery === 0 || i === n - 1) { const t = sv('text', { x: x + bw / 2, y: H - 8, 'text-anchor': 'middle', class: 'k-axis' }); t.textContent = `${+dd}.${mm}`; svg.append(t); }
      const set = () => {
        rr.setAttribute('y', base - hr); rr.setAttribute('height', Math.max(hr, d.red ? 2 : 0));
        ra.setAttribute('y', base - hr - ha); ra.setAttribute('height', Math.max(ha, d.amber ? 2 : 0));
      };
      if (reduce) set();
      else {
        const t0 = performance.now() + i * 40, dur = 700;
        const step = (t) => {
          const p = Math.max(0, Math.min(1, (t - t0) / dur)), e = 1 - Math.pow(1 - p, 3);
          rr.setAttribute('y', base - hr * e); rr.setAttribute('height', Math.max(hr * e, d.red && p > 0 ? 2 : 0));
          ra.setAttribute('y', base - (hr + ha) * e); ra.setAttribute('height', Math.max(ha * e, d.amber && p > 0 ? 2 : 0));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    });
    host.append(svg);
  }
  drawDays();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawDays, 150); });

  // ---------- Ленти (проблеми, версии) ----------
  function bars(ol, rows, label, value, tipLine) {
    if (!rows.length) { ol.append(el('li', 'k-empty', 'Няма данни.')); return; }
    const max = Math.max(1, ...rows.map(value));
    rows.forEach((r) => {
      const li = el('li');
      li.append(el('span', 'lbl', label(r)), el('span', 'val', nf.format(value(r))));
      const tr = el('span', 'track'), fi = el('span', 'fill'); tr.append(fi); li.append(tr);
      li.addEventListener('pointermove', (ev) => showTip(ev, label(r), tipLine(r)));
      li.addEventListener('pointerleave', hideTip);
      ol.append(li);
      grow(fi, (value(r) / max) * 100);
    });
  }
  bars($('probBars'), problems.slice(0, 12), (r) => r.problem, (r) => +r.count, (r) => `${nf.format(+r.count)} пъти · ${r.testers} тестър(и): ${r.who}`);
  bars($('verBars'), versions, (r) => 'v' + r.version, (r) => +r.count, (r) => `${r.count} компютъра`);

  // ---------- Игри ----------
  (() => {
    const ul = $('gameList');
    if (!games.length) { ul.append(el('li', 'k-muted', 'Няма засичащи игри.')); return; }
    for (const g of games) { const li = el('li', null, g.game); li.append(el('span', null, `${g.testers} · ${g.who}`)); ul.append(li); }
  })();

  // ---------- Таблици ----------
  (() => {
    const tb = $('testerRows'), max = Math.max(1, ...testers.map((t) => +t.red || 0));
    if (!testers.length) { const tr = el('tr'); const td = el('td', 'k-muted', 'Още няма тестъри.'); td.colSpan = 5; tr.append(td); tb.append(tr); }
    for (const t of testers) {
      const tr = el('tr');
      const who = el('td'); who.append(el('div', null, t.tester)); if (t.pc && t.pc !== t.tester) who.append(el('div', 'k-muted k-small', t.pc));
      const ver = el('td'); ver.append(el('span', 'k-pill ver', t.version ? 'v' + t.version : '—'));
      const red = el('td'); const mini = el('div', 'k-mini'); const track = el('span', 'track'), fill = el('span', 'fill'); track.append(fill);
      mini.append(track, el('span', 'k-small', nf.format(+t.red || 0))); red.append(mini); grow(fill, ((+t.red || 0) / max) * 100);
      tr.append(who, ver, el('td', 'n', nf.format(t.reports)), red, el('td', 'k-muted', t.last || '—'));
      tb.append(tr);
    }
  })();
  (() => {
    const tb = $('reportRows');
    if (!reports.length) { const tr = el('tr'); const td = el('td', 'k-muted', 'Още няма отчети.'); td.colSpan = 7; tr.append(td); tb.append(tr); }
    for (const r of reports) {
      const tr = el('tr');
      const who = el('td'); who.append(el('div', null, r.tester)); if (r.pc && r.pc !== r.tester) who.append(el('div', 'k-muted k-small', r.pc));
      const kind = el('td'); kind.append(el('span', 'k-pill' + (r.kind === 'доклад' ? ' rep' : ''), r.kind));
      tr.append(el('td', null, r.at), who, el('td', null, r.version ? 'v' + r.version : '—'), kind,
        el('td', 'n k-bad', nf.format(+r.red || 0)), el('td', 'n', nf.format(+r.amber || 0)), el('td', 'note', r.note || '—'));
      tb.append(tr);
    }
  })();
})();
