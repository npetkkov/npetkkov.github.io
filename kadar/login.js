'use strict';
(() => {
  const form = document.getElementById('login'), msg = document.getElementById('msg'), btn = document.getElementById('go');
  const LOCK = 'kadar.lock';
  // Забавяне след грешни опити (самото криптиране е истинската защита — това само спира натискането подред)
  function lockedFor() {
    try { const l = JSON.parse(localStorage.getItem(LOCK) || '{}'); return Math.max(0, (l.until || 0) - Date.now()); } catch { return 0; }
  }
  function fail() {
    try {
      const l = JSON.parse(localStorage.getItem(LOCK) || '{}');
      l.n = (l.n || 0) + 1;
      if (l.n >= 5) { l.until = Date.now() + Math.min(15 * 60, 30 * 2 ** (l.n - 5)) * 1000; }
      localStorage.setItem(LOCK, JSON.stringify(l));
    } catch { /* */ }
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const wait = lockedFor();
    if (wait > 0) { msg.textContent = `Твърде много опити. Опитай след ${Math.ceil(wait / 1000)} s.`; return; }
    const user = document.getElementById('user').value.trim(), pass = document.getElementById('pass').value;
    if (!user || !pass) { msg.textContent = 'Попълни потребител и парола.'; return; }
    btn.disabled = true; msg.textContent = 'Проверява…';
    const t0 = Date.now();
    let ok = false;
    try { ok = await KadarAuth.login(user, pass); } catch { ok = false; }
    // Еднакво време за отговор при грешка
    const left = 900 - (Date.now() - t0); if (!ok && left > 0) await new Promise((r) => setTimeout(r, left));
    if (ok) {
      try { localStorage.removeItem(LOCK); } catch { /* */ }
      document.getElementById('pass').value = '';
      location.replace('/kadar/dash/');
      return;
    }
    fail();
    btn.disabled = false;
    msg.textContent = 'Грешен потребител или парола.';
    document.getElementById('pass').select();
  });
})();
