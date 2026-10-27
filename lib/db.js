const crypto = require('crypto');

async function sb(path, { method = 'GET', body, prefer } = {}) {
  const base = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  const r = await fetch(`${base}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}

function authed(req, res) {
  const pw = process.env.NOTEBOOK_PASSWORD;
  if (!pw) { res.status(500).json({ error: 'NOTEBOOK_PASSWORD env var not set' }); return false; }
  const a = Buffer.from(String(req.headers['x-notebook-password'] || ''));
  const b = Buffer.from(pw);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}

const newId = () => crypto.randomBytes(6).toString('hex'); // 12 chars, stable forever
const okId = (s) => /^[A-Za-z0-9_-]{4,40}$/.test(String(s || ''));
const body = (req) => {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b || {};
};

module.exports = { sb, authed, newId, okId, body };
