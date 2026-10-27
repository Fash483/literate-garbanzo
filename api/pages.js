const { sb, authed, newId, body } = require('../lib/db');

module.exports = async (req, res) => {
  try {
    if (!authed(req, res)) return;
    if (req.method === 'GET') {
      const rows = await sb('pages?select=id,name,chars,updated_at&order=created_at.asc');
      return res.status(200).json(rows);
    }
    if (req.method === 'POST') {
      const b = body(req);
      const content = String(b.content || '');
      const rows = await sb('pages?select=id,name,chars,updated_at', {
        method: 'POST',
        prefer: 'return=representation',
        body: { id: newId(), name: String(b.name || 'Untitled').slice(0, 120), content, chars: content.length },
      });
      return res.status(201).json(rows[0]);
    }
    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
