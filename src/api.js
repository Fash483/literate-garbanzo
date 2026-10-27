const KEY = 'pony-pw';
let pw = '';
try { pw = localStorage.getItem(KEY) || ''; } catch { /* storage blocked */ }

export class AuthError extends Error {}

export function setPassword(p) {
  pw = p;
  try { localStorage.setItem(KEY, p); } catch { /* ignore */ }
}

export async function api(path, method = 'GET', body) {
  const r = await fetch('/api/' + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-notebook-password': pw },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let j = null;
  try { j = await r.json(); } catch { /* no body */ }
  if (r.status === 401) throw new AuthError('unauthorized');
  if (!r.ok) throw new Error((j && j.error) || 'HTTP ' + r.status);
  return j;
}
