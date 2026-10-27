// Tiny "store" (no compression) zip writer - no dependencies.
const CT = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (b) => {
  let c = ~0;
  for (let i = 0; i < b.length; i++) c = CT[(c ^ b[i]) & 255] ^ (c >>> 8);
  return ~c >>> 0;
};

export function makeZip(files) {
  const enc = new TextEncoder();
  const parts = [], central = [];
  let off = 0, cs = 0;
  for (const f of files) {
    const nm = enc.encode(f.name), data = f.data, c = crc32(data), sz = data.length;
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x800, true);
    h.setUint16(12, 0x21, true); h.setUint32(14, c, true); h.setUint32(18, sz, true);
    h.setUint32(22, sz, true); h.setUint16(26, nm.length, true);
    parts.push(h, nm, data);
    const d = new DataView(new ArrayBuffer(46));
    d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true);
    d.setUint16(8, 0x800, true); d.setUint16(14, 0x21, true); d.setUint32(16, c, true);
    d.setUint32(20, sz, true); d.setUint32(24, sz, true); d.setUint16(28, nm.length, true);
    d.setUint32(42, off, true);
    central.push(d, nm);
    cs += 46 + nm.length;
    off += 30 + nm.length + sz;
  }
  const z = new DataView(new ArrayBuffer(22));
  z.setUint32(0, 0x06054b50, true); z.setUint16(8, files.length, true);
  z.setUint16(10, files.length, true); z.setUint32(12, cs, true); z.setUint32(16, off, true);
  return new Blob([...parts, ...central, z], { type: 'application/zip' });
}
