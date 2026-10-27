import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { api, AuthError, setPassword } from './api.js';
import { makeZip } from './zip.js';

const THEMES = [
  ['galaxy', '🌌 Galaxy'],
  ['pastel', '🍬 Pastel'],
  ['sunset', '🌅 Sunset'],
  ['mint', '🌿 Mint'],
  ['neon', '🌈 Neon'],
];
const STICKERS = [
  ['🦄', { left: '2%', top: '12%' }, 0], ['🌈', { right: '3%', top: '10%' }, 1],
  ['⭐', { left: '4%', bottom: '10%' }, 2], ['🎀', { right: '4%', bottom: '8%' }, 3],
  ['💖', { left: '46%', bottom: '2%' }, 1.5], ['🍎', { right: '1%', top: '48%' }, 2.5],
  ['✨', { left: '1%', top: '52%' }, 0.8], ['🌸', { left: '30%', top: '1%' }, 2.2],
];

const hashId = () => (location.hash.match(/p=([\w-]+)/) || [])[1];
const wget = (id) => `wget -O page.txt "${location.origin}/p/${id}.txt"`;
const stamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export default function App() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('pony-theme') || 'galaxy'; } catch { return 'galaxy'; } });
  const [pages, setPages] = useState([]);
  const [cur, setCur] = useState(null);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [tagOn, setTagOn] = useState(true);
  const [tag, setTag] = useState('');
  const [saved, setSaved] = useState('—');
  const [toast, setToast] = useState('');

  const ta = useRef(null), caret = useRef(null), bmRef = useRef(null);
  const live = useRef({ id: null, name: '', content: '', paste_n: 0 });
  const dirty = useRef(false), timer = useRef(), chain = useRef(Promise.resolve());
  const opening = useRef(0), ready = useRef(false), seen = useRef({}), toastT = useRef();
  const h = useRef({});

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('pony-theme', theme); } catch { /* ignore */ }
  }, [theme]);

  function say(m, ms = 2200) {
    setToast(m);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(''), ms);
  }

  /* ---------- saving ---------- */
  function flush() {
    clearTimeout(timer.current);
    if (!dirty.current) return chain.current;
    chain.current = chain.current.then(async () => {
      if (!dirty.current) return;
      dirty.current = false;
      const l = { ...live.current };
      try {
        await api('page?id=' + encodeURIComponent(l.id), 'PUT', { name: l.name, content: l.content, paste_n: l.paste_n });
        setSaved(new Date().toLocaleTimeString());
      } catch (e) {
        dirty.current = true;
        if (e instanceof AuthError) { setLocked(true); return; }
        setSaved('⚠️ failed');
        say('⚠️ Save failed: ' + e.message, 4000);
        timer.current = setTimeout(() => h.current.flush(), 5000);
      }
    });
    return chain.current;
  }
  function mark(patch) {
    Object.assign(live.current, patch);
    dirty.current = true;
    setSaved('…');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => h.current.flush(), 900);
    const l = live.current;
    setPages((ps) => ps.map((p) => (p.id === l.id ? { ...p, name: l.name || 'Untitled', chars: l.content.length } : p)));
  }

  /* ---------- pages ---------- */
  async function open(id) {
    const my = ++opening.current;
    await flush();
    setLoading(true);
    try {
      const f = await api('page?id=' + encodeURIComponent(id));
      if (my !== opening.current) return;
      live.current = { id, name: f.name, content: f.content, paste_n: f.paste_n || 0 };
      dirty.current = false;
      setCur(id); setName(f.name); setText(f.content);
      history.replaceState(null, '', '#p=' + id);
      try { localStorage.setItem('pony-last', id); } catch { /* ignore */ }
    } catch (e) {
      if (e instanceof AuthError) setLocked(true); else say('⚠️ ' + e.message, 4000);
    } finally {
      if (my === opening.current) setLoading(false);
    }
  }
  async function boot() {
    try {
      setLoading(true);
      let rows = await api('pages');
      if (!rows.length) rows = [await api('pages', 'POST', { name: 'My first page 🌸' })];
      setPages(rows);
      setLocked(false);
      let last = null;
      try { last = localStorage.getItem('pony-last'); } catch { /* ignore */ }
      const want = [hashId(), last].find((x) => x && rows.some((r) => r.id === x)) || rows[0].id;
      await open(want);
      ready.current = true;
    } catch (e) {
      setLoading(false);
      if (e instanceof AuthError) setLocked(true); else say('⚠️ ' + e.message, 8000);
    }
  }
  async function newPage() {
    try {
      await flush();
      const r = await api('pages', 'POST', { name: 'Page ' + (pages.length + 1) });
      setPages((ps) => [...ps, r]);
      await open(r.id);
    } catch (e) { say('⚠️ ' + e.message, 4000); }
  }
  async function delPage() {
    if (!confirm('Delete this page for good?')) return;
    const id = cur;
    try {
      await api('page?id=' + encodeURIComponent(id), 'DELETE');
      dirty.current = false;
      let rest = pages.filter((p) => p.id !== id);
      if (!rest.length) rest = [await api('pages', 'POST', { name: 'My first page 🌸' })];
      setPages(rest);
      await open(rest[0].id);
    } catch (e) { say('⚠️ ' + e.message, 4000); }
  }
  function clearPage() {
    if (!confirm('Clear all content on this page?')) return;
    setText('');
    mark({ content: '', paste_n: 0 });
    say('🧹 Cleared!');
  }

  /* ---------- editor ---------- */
  function onText(e) { setText(e.target.value); mark({ content: e.target.value }); }
  function onName(e) { setName(e.target.value); mark({ name: e.target.value || 'Untitled' }); }
  function onPaste(e) {
    const t = e.clipboardData.getData('text');
    if (!t || !live.current.id) return;           // nothing usable: let the browser paste normally
    e.preventDefault();
    const el = e.target, v = el.value, s = el.selectionStart, en = el.selectionEnd, pre = v.slice(0, s);
    const n = live.current.paste_n + 1;
    let ins = pre && !pre.endsWith('\n') ? '\n' : '';                    // every paste starts on its own line
    if (tagOn) ins += `[paste #${n}${tag.trim() ? ' · ' + tag.trim() : ''} · ${stamp()}]\n`;
    ins += t + '\n';                                                     // ...and ends with a newline
    const nv = pre + ins + v.slice(en);
    caret.current = s + ins.length;
    setText(nv);
    mark({ content: nv, paste_n: n });
  }
  useLayoutEffect(() => {
    if (caret.current != null && ta.current) {
      ta.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [text]);

  /* ---------- downloads ---------- */
  const downloadTxt = () => download(cur + '.txt', new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const copyWget = () => navigator.clipboard.writeText(wget(cur)).then(() => say('📋 wget command copied'), () => say('Select the command below & copy'));
  async function downloadAll() {
    try {
      await flush();
      say('📦 Gathering pages…');
      const enc = new TextEncoder(), files = [];
      for (const p of pages) {
        const f = await api('page?id=' + encodeURIComponent(p.id));
        files.push({ name: ((f.name || '').replace(/[^\w\- ]+/g, '').trim() || 'page') + '-' + p.id + '.txt', data: enc.encode(f.content) });
      }
      download('pony-notebook-all.zip', makeZip(files));
      say('📦 Zip ready!');
    } catch (e) { say('⚠️ ' + e.message, 4000); }
  }

  /* ---------- bookmarklet ---------- */
  const bm = useMemo(() => {
    const u = location.origin + location.pathname;
    return "javascript:(function(){var t=(getSelection().toString()||document.body.innerText),n=Date.now()+'-'+Math.random(),w=window.open(" +
      JSON.stringify(u) + "),k=0,i=setInterval(function(){try{w.postMessage({mlp:1,nonce:n,title:document.title,url:location.href,text:t},'*')}catch(e){}if(++k>30)clearInterval(i)},400)})();";
  }, []);
  useEffect(() => { if (bmRef.current) bmRef.current.setAttribute('href', bm); }, [bm, locked]);

  /* ---------- lifecycle ---------- */
  h.current = { flush, open, pages, cur, say };
  useEffect(() => { boot(); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    const onMsg = async (e) => {
      const d = e.data;
      if (!d || d.mlp !== 1 || typeof d.text !== 'string' || seen.current[d.nonce] || !ready.current) return;
      seen.current[d.nonce] = 1;                     // sender retries until we're ready, so unready messages are just ignored
      const H = h.current;
      try {
        await H.flush();
        const r = await api('pages', 'POST', { name: (d.title || 'Snapshot').slice(0, 60), content: d.text });
        setPages((ps) => [...ps, r]);
        await H.open(r.id);
        H.say('🌟 Snapshot saved — wget command is shown below', 4000);
      } catch (err) { H.say('⚠️ ' + err.message, 5000); }
    };
    const onHash = () => {
      const id = hashId(), H = h.current;
      if (id && id !== H.cur && H.pages.some((p) => p.id === id)) H.open(id);
    };
    const onUnload = (e) => { if (dirty.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('message', onMsg);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('message', onMsg);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, []);

  async function login(e) {
    e.preventDefault();
    setPassword(pwInput);
    setPwErr('');
    try { await api('pages'); setPwInput(''); await boot(); }
    catch (err) { setPwErr(err instanceof AuthError ? 'Wrong password 🙈' : err.message); }
  }

  const stickers = (
    <div aria-hidden="true">
      {STICKERS.map(([e, pos, delay]) => (
        <div key={e} className="sticker" style={{ ...pos, animationDelay: delay + 's' }}>{e}</div>
      ))}
    </div>
  );

  if (locked) {
    return (
      <>
        {stickers}
        <header><h1><span>🦄</span> <span className="ttl">Pony Notebook</span> <span>🌈</span></h1></header>
        <form className="login panel" onSubmit={login}>
          <div style={{ fontSize: 40 }}>🔐</div>
          <p>Enter your notebook password</p>
          <input id="pw" type="password" autoFocus value={pwInput} onChange={(e) => setPwInput(e.target.value)} placeholder="password" />
          <button id="login" className="pink" type="submit">Unlock ✨</button>
          {pwErr && <div className="err">{pwErr}</div>}
        </form>
      </>
    );
  }

  return (
    <>
      {stickers}
      <header><h1><span>🦄</span> <span className="ttl">Pony Notebook</span> <span>🌈</span></h1></header>
      <div className="wrap">
        <aside className="side panel">
          <div className="row"><button className="pink" id="new" onClick={newPage}>✨ New page</button></div>
          <div id="list">
            {pages.map((p) => (
              <div key={p.id} className={'pg' + (p.id === cur ? ' on' : '')} onClick={() => open(p.id)}>
                <span>📄</span><b>{p.name}</b><small>{(p.chars || 0).toLocaleString()}</small>
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 12 }}><button className="mint" id="all" onClick={downloadAll}>📦 Download all (.zip)</button></div>
          <div className="cfg">
            <div className="row"><button className="sky" onClick={() => navigator.clipboard.writeText(bm).then(() => say('🔖 Bookmarklet copied'))}>🔖 Copy bookmarklet</button></div>
            <a ref={bmRef} href="#" onClick={(e) => { e.preventDefault(); say('Drag it to your bookmarks bar 🔖'); }} style={{ fontSize: 12 }}>⭐ Drag me to your bookmarks bar</a>
            <div style={{ marginTop: 12 }}>🎨 Theme</div>
            <div className="themes">
              {THEMES.map(([k, label]) => (
                <button key={k} className={'th' + (theme === k ? ' act' : '')} data-theme-btn={k} onClick={() => setTheme(k)}>{label}</button>
              ))}
            </div>
          </div>
        </aside>

        <main className="main panel2">
          <div className="row">
            <input type="text" id="name" placeholder="Page name" value={name} onChange={onName} disabled={loading || !cur} style={{ flex: 1, minWidth: 140 }} />
            <button className="mint" id="dl" onClick={downloadTxt} disabled={!cur}>⬇️ Download .txt</button>
            <button className="sky" id="cp" onClick={copyWget} disabled={!cur}>📋 Copy wget</button>
            <button className="red" id="clr" onClick={clearPage} disabled={!cur}>🧹 Clear page</button>
            <button className="red" id="del" onClick={delPage} disabled={!cur}>🗑️ Delete</button>
          </div>
          <div className="row">
            <label><input type="checkbox" id="tg" checked={tagOn} onChange={(e) => setTagOn(e.target.checked)} /> 🏷️ Tag each paste</label>
            <input type="text" id="tag" placeholder="tag (optional)" value={tag} onChange={(e) => setTag(e.target.value)} style={{ width: 140 }} />
            <span className="hint">↵ Every paste automatically starts on its own line</span>
          </div>
          <textarea id="txt" ref={ta} value={text} onChange={onText} onPaste={onPaste} disabled={loading || !cur}
            placeholder="Paste or write here… (500,000+ characters is fine) 🌸" spellCheck={false} />
          <div className="meta"><span id="cnt">{text.length.toLocaleString()}</span> chars · saved <span id="sv">{saved}</span> · id <b id="pid">{cur || ''}</b></div>
          <code id="wg">{cur ? wget(cur) : ''}</code>
        </main>
      </div>
      {toast && <div id="toast">{toast}</div>}
    </>
  );
}
