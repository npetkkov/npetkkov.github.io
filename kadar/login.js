'use strict';
(() => {
  const form = document.getElementById('login'), msg = document.getElementById('msg'), btn = document.getElementById('go');
  const LOCK = 'kadar.lock2';
  // Забавяне след грешни опити
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
  // Покажи паролата + предупреждения за Caps Lock и кирилица (най-честите причини за „грешна парола“)
  const pass = document.getElementById('pass'), user = document.getElementById('user'), eye = document.getElementById('eye'), warn = document.getElementById('warn');
  let caps = false;
  eye.addEventListener('click', () => {
    const show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    eye.textContent = show ? 'Скрий' : 'Покажи';
    eye.setAttribute('aria-pressed', String(show));
  });
  function check(e) {
    if (e && e.getModifierState) caps = e.getModifierState('CapsLock');
    const cyr = /[Ѐ-ӿ]/.test(user.value + pass.value);
    const w = [caps ? 'Caps Lock е включен.' : '', cyr ? 'Има букви на кирилица — превключи клавиатурата на латиница.' : ''].filter(Boolean).join(' ');
    warn.textContent = w; warn.hidden = !w;
  }
  for (const el of [user, pass]) { el.addEventListener('keyup', check); el.addEventListener('keydown', check); el.addEventListener('input', () => check()); }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const wait = lockedFor();
    if (wait > 0) { msg.textContent = `Твърде много опити. Опитай след ${Math.ceil(wait / 1000)} s.`; return; }
    // Интервали/нови редове при копиране и главни букви в името (телефон) не бива да провалят входа
    const user = document.getElementById('user').value.trim().toLowerCase(), pass = document.getElementById('pass').value.trim().normalize('NFC');
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
