// Kadar Beta — вход и разшифроване (всичко става в браузъра).
// data.enc.json е AES-256-GCM шифрован текст. Ключът се изчислява от потребителско име + парола с
// PBKDF2-SHA256 (600 000 итерации). Без тях файлът е безполезен — в сайта и в GitHub няма нищо четимо.
'use strict';
const KadarAuth = (() => {
  const SKEY = 'kadar.k', SEXP = 'kadar.exp';
  const SESSION_MS = 8 * 60 * 60 * 1000;
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

  async function fetchBlob() {
    const r = await fetch('/kadar/data.enc.json', { cache: 'no-store', credentials: 'omit' });
    if (!r.ok) throw new Error('data');
    return r.json();
  }

  async function deriveKey(user, pass, blob) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(user + '\0' + pass), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(blob.salt), iterations: blob.iter }, base, 256);
    return bits;
  }

  async function decrypt(rawKey, blob) {
    const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(blob.iv) }, key, b64(blob.ct));
    return JSON.parse(new TextDecoder().decode(pt));
  }

  /** Вход: true при правилни данни (ключът остава само в този раздел до затварянето му, най-много 8 ч). */
  async function login(user, pass) {
    const blob = await fetchBlob();
    const raw = await deriveKey(user, pass, blob);
    await decrypt(raw, blob); // грешни данни → хвърля
    try {
      sessionStorage.setItem(SKEY, toB64(raw));
      sessionStorage.setItem(SEXP, String(Date.now() + SESSION_MS));
    } catch { /* без sessionStorage входът важи само за тази страница */ }
    return true;
  }

  /** Данните за таблото или null (няма вход / изтекъл / сменен ключ). */
  async function load() {
    let k = null, exp = 0;
    try { k = sessionStorage.getItem(SKEY); exp = +sessionStorage.getItem(SEXP) || 0; } catch { /* */ }
    if (!k || Date.now() > exp) { logout(); return null; }
    try { return await decrypt(b64(k), await fetchBlob()); }
    catch { logout(); return null; }
  }

  function logout() {
    try { sessionStorage.removeItem(SKEY); sessionStorage.removeItem(SEXP); } catch { /* */ }
  }

  return { login, load, logout };
})();
