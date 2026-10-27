// Public, stable, wget-friendly link:  /p/<pageid>.txt   -> returns ONLY the page content
const { sb, okId } = require('../lib/db');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const id = String(req.query.file || '').replace(/\.txt$/i, '');
    if (!okId(id)) return res.status(404).send('not found');
    const rows = await sb(`pages?id=eq.${encodeURIComponent(id)}&select=content`);
    if (!rows.length) return res.status(404).send('not found');
    return res.status(200).send(rows[0].content);
  } catch (e) {
    return res.status(500).send('error');
  }
};
