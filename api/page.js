const { sb, authed, okId, body } = require('../lib/db');

module.exports = async (req, res) => {
  try {
    if (!authed(req, res)) return;
    const id = String(req.query.id || '');
    if (!okId(id)) return res.status(400).json({ error: 'bad id' });
    const q = `pages?id=eq.${encodeURIComponent(id)}`;
    if (req.method === 'GET') {
      const rows = await sb(`${q}&select=id,name,content,paste_n,chars,updated_at`);
      return rows.length ? res.status(200).json(rows[0]) : res.status(404).json({ error: 'not found' });
    }
    if (req.method === 'PUT') {
      const b = body(req);
      const content = String(b.content || '');
      const rows = await sb(`${q}&select=id,chars,updated_at`, {
        method: 'PATCH',
        prefer: 'return=representation',
        body: {
          name: String(b.name || 'Untitled').slice(0, 120),
          content,
          chars: content.length,
          paste_n: Number(b.paste_n) || 0,
          updated_at: new Date().toISOString(),
        },
      });
      return rows.length ? res.status(200).json(rows[0]) : res.status(404).json({ error: 'not found' });
    }
    if (req.method === 'DELETE') {
      await sb(q, { method: 'DELETE' });
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
