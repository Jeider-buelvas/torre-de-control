'use strict';
const fs = require('fs');
function colNum(s) { let n = 0; for (const ch of s) n = n * 26 + ch.charCodeAt(0) - 64; return n; }
function colLet(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function dec(v) { return (v && typeof v === 'object' && v.d) ? new Date(v.d) : v; }
function encV(v) { if (v instanceof Date) { const p = n => String(n).padStart(2, '0'); return { d: `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}T00:00:00` }; } return v; }
const REF = /((?:'[^']+'|[A-Za-z_][A-Za-z0-9_. ]*?)!)?(\$?)([A-Z]{1,3})(\$?)(\d+)(?::(\$?)([A-Z]{1,3})(\$?)(\d+))?/g;
function moverFormula(f, hojaFormula, hojaMovida, fn, fnRango) {
  const partes = f.split(/("[^"]*")/);
  for (let i = 0; i < partes.length; i += 2) {
    partes[i] = partes[i].replace(REF, (m, pref, d1, c1, d2, r1, d3, c2, d4, r2, off, str) => {
      const sig = str[off + m.length]; if (!pref && sig === '(') return m;
      const prev = off > 0 ? str[off - 1] : ''; if (!pref && /[A-Za-z0-9_.]/.test(prev)) return m;
      const hoja = pref ? pref.slice(0, -1).replace(/^'|'$/g, '') : hojaFormula; if (hoja !== hojaMovida) return m;
      if (r2 === undefined) { const n = fn(Number(r1)); if (n === null) return '#REF!'; return (pref || '') + d1 + c1 + d2 + n; }
      const [a, b] = fnRango(Number(r1), Number(r2)); if (a === null) return '#REF!';
      return (pref || '') + d1 + c1 + d2 + a + ':' + d3 + c2 + d4 + b;
    });
  }
  return partes.join('');
}
class Range {
  constructor(sh, r, c, nr, nc) { this.sh = sh; this.r = r; this.c = c; this.nr = nr; this.nc = nc;
    const px = new Proxy(this, { get: (t, p) => (p in t ? t[p] : (typeof p === 'string' ? (() => px) : undefined)) }); this._px = px; return px; }
  getRow() { return this.r; } getColumn() { return this.c; } getNumRows() { return this.nr; } getNumColumns() { return this.nc; } getSheet() { return this.sh; }
  _each(fn) { const out = []; for (let i = 0; i < this.nr; i++) { const f = []; for (let j = 0; j < this.nc; j++) f.push(fn(this.r + i, this.c + j)); out.push(f); } return out; }
  getValues() { return this._each((r, c) => this.sh._valor(r, c, 0)); } getValue() { return this.getValues()[0][0]; }
  getDisplayValues() { return this.getValues().map(f => f.map(v => String(v))); }
  getFormulas() { return this._each((r, c) => { const x = this.sh.cells.get(r + ',' + c); return x && x.f ? x.f : ''; }); } getFormula() { return this.getFormulas()[0][0]; }
  _set(r, c, val) { this.sh._crecer(r, c);
    if (val === '' || val === null || val === undefined) { this.sh.cells.delete(r + ',' + c); return; }
    if (typeof val === 'string' && val.startsWith('=')) this.sh.cells.set(r + ',' + c, { v: undefined, f: val });
    else this.sh.cells.set(r + ',' + c, { v: val instanceof Date ? new Date(val.getTime()) : val, f: null }); }
  setValue(v) { this._each((r, c) => this._set(r, c, v)); return this._px; }
  setValues(m) { if (m.length !== this.nr || m.some(f => f.length !== this.nc)) throw new Error('setValues: dimensiones'); this._each((r, c) => this._set(r, c, m[r - this.r][c - this.c])); return this._px; }
  setFormula(f) { return this.setValue(f); }
  clearContent() { this._each((r, c) => this.sh.cells.delete(r + ',' + c)); return this._px; }
}
class Sheet {
  constructor(ss, name, data) { this.ss = ss; this.name = name; this.cells = new Map(); this.hidden = false; this.maxR = (data && data.maxR) || 1000; this.maxC = (data && data.maxC) || 60;
    if (data) for (const [k, [v, f]] of Object.entries(data.cells)) this.cells.set(k, { v, f });
    const px = new Proxy(this, { get: (t, p) => (p in t ? t[p] : (typeof p === 'string' ? (() => px) : undefined)) }); this._px = px; return px; }
  _valor(r, c) { const x = this.cells.get(r + ',' + c); if (!x) return ''; if (x.f && (x.v === undefined || x.v === null)) return ''; return x.v === null || x.v === undefined ? '' : dec(x.v); }
  _crecer(r, c) { if (r > this.maxR) this.maxR = r; if (c > this.maxC) this.maxC = c; }
  appendRow(r) { const f = this.getLastRow() + 1; this.getRange(f, 1, 1, r.length).setValues([r]); return this._px; } getName() { return this.name; } setName(n) { this.name = n; return this._px; } getParent() { return this.ss; } getIndex() { return this.ss.sheets.indexOf(this._px) + 1; }
  getMaxRows() { return this.maxR; } getMaxColumns() { return this.maxC; }
  getLastRow() { let m = 0; for (const [k, x] of this.cells) { if ((x.v === '' || x.v == null) && !x.f) continue; const r = +k.split(',')[0]; if (r > m) m = r; } return m; }
  getLastColumn() { let m = 0; for (const [k, x] of this.cells) { if ((x.v === '' || x.v == null) && !x.f) continue; const c = +k.split(',')[1]; if (c > m) m = c; } return m; }
  getRange(a, b, c, d) { if (typeof a === 'string') { const m = a.match(/^([A-Z]+)(\d+)$/); return new Range(this._px, +m[2], colNum(m[1]), 1, 1); }
    if (a < 1 || b < 1 || (c !== undefined && c < 1) || (d !== undefined && d < 1)) throw new Error('getRange fuera de límites: ' + [a, b, c, d]); return new Range(this._px, a, b, c || 1, d || 1); }
  _moverFilas(desde, n) { const nuevo = new Map();
    for (const [k, x] of this.cells) { const [r, c] = k.split(',').map(Number);
      if (n > 0) nuevo.set((r >= desde ? r + n : r) + ',' + c, x); else { const fin = desde - n - 1; if (r >= desde && r <= fin) continue; nuevo.set((r > fin ? r + n : r) + ',' + c, x); } }
    this.cells = nuevo; this.maxR += n;
    const fn = n > 0 ? (r => (r >= desde ? r + n : r)) : (r => { const fin = desde - n - 1; if (r >= desde && r <= fin) return null; return r > fin ? r + n : r; });
    const fnR = n > 0 ? ((a, b) => [a >= desde ? a + n : a, b >= desde ? b + n : b]) : ((a, b) => { const fin = desde - n - 1; let a2 = a > fin ? a + n : (a >= desde ? desde : a), b2 = b > fin ? b + n : (b >= desde ? desde - 1 : b); return b2 < a2 ? [null, null] : [a2, b2]; });
    for (const sh of this.ss.sheets) for (const x of sh.cells.values()) if (x.f) x.f = moverFormula(x.f, sh.name, this.name, fn, fnR); }
  getDataRange() { return this.getRange(1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  getRangeList(l) { const rs = l.map(a => this.getRange(a)); return { setValue: v => { rs.forEach(r => r.setValue(v)); } }; }
  insertRowsBefore(r, n) { this._moverFilas(r, n); return this._px; } insertRowsAfter(r, n) { this._moverFilas(r + 1, n); return this._px; }
  deleteRows(r, n) { this._moverFilas(r, -n); return this._px; }
  clearContents() { this.cells = new Map(); return this._px; }
  clear() { this.cells = new Map(); return this._px; }
  getFilter() { return null; }
  hideSheet() { this.hidden = true; return this._px; }
  copyTo(ss) { const c = new Sheet(ss, 'Copia de ' + this.name, null); for (const [k, x] of this.cells) c.cells.set(k, { v: x.v, f: x.f }); c.maxR = this.maxR; c.maxC = this.maxC; ss.sheets.push(c); return c; } insertColumnsAfter(c, n) { this.maxC += n; return this._px; }
}
class Spreadsheet {
  constructor(id, data, nombre) { this.id = id; this.nombre = nombre; this.sheets = []; this.toasts = []; if (data) for (const [n, h] of Object.entries(data)) this.sheets.push(new Sheet(this, n, h)); this.activa = this.sheets[0];
    const px = new Proxy(this, { get: (t, p) => (p in t ? t[p] : (typeof p === 'string' ? (() => px) : undefined)) }); return px; }
  getName() { return this.nombre || this.id; } getId() { return this.id; } getSheets() { return this.sheets.slice(); } getSheetByName(n) { return this.sheets.find(s => s.name === n) || null; }
  toast(m) { this.toasts.push(String(m)); } setActiveSheet(s) { this.activa = s; return s; } getActiveSheet() { return this.activa; }
  deleteSheet(s) { this.sheets = this.sheets.filter(x => x !== s); }
  moveActiveSheet(i) { const s = this.activa; this.sheets = this.sheets.filter(x => x !== s); this.sheets.splice(i - 1, 0, s); }
  insertSheet(n) { const s = new Sheet(this, n, null); this.sheets.push(s); this.activa = s; return s; }
  toJSON() { const o = {}; for (const s of this.sheets) { const cells = {}; for (const [k, x] of s.cells) cells[k] = [encV(x.v === undefined ? null : x.v), x.f || null]; o[s.name] = { cells }; } return o; }
}
function entorno(archivos, activo, op) {
  op = op || {}; const alertas = [], logs = [], docProps = op.docProps || {};
  const chain = () => { const p = new Proxy(function () {}, { get: (t, k) => (k === 'build' ? () => ({}) : () => p), apply: () => p }); return p; };
  return { G: { SpreadsheetApp: { getActiveSpreadsheet: () => activo, openById: id => archivos[id], getActive: () => activo, getUi: () => { if (op.sinUi) throw new Error('sin UI'); return { alert: (a, b) => { alertas.push(String(b && typeof b === 'string' ? a + ' | ' + b : a)); return 'YES'; }, prompt: () => ({ getSelectedButton: () => 'OK', getResponseText: () => (op.respuesta || '') }), Button: { YES: 'YES', OK: 'OK' }, ButtonSet: {} }; }, newDataValidation: chain, BorderStyle: {} },
    LockService: { getDocumentLock: () => ({ tryLock: () => true, releaseLock() {} }) }, ScriptApp_: {}, Session: { getActiveUser: () => ({ getEmail: () => 'x@polyuprotec.com' }), getEffectiveUser: () => ({ getEmail: () => 'x@polyuprotec.com' }), getScriptTimeZone: () => 'America/Bogota' },
    Utilities: { formatDate: (d, tz, f) => { const p = n => String(n).padStart(2, '0'); return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + (/HH/.test(f || '') ? ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) : ''); }, sleep() {} }, Logger: { log: m => logs.push(String(m)) }, PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }), getUserProperties: () => ({ getProperty: () => null, setProperty() {}, deleteProperty() {} }), getDocumentProperties: () => ({ getProperty: k => (k in docProps ? docProps[k] : null), setProperty: (k, v) => { docProps[k] = v; } }) },
    CacheService: { getDocumentCache: () => ({ get: () => null, put() {}, remove() {} }) }, HtmlService: {}, ScriptApp: {}, UrlFetchApp: {} }, alertas, logs, docProps };
}
function cargar(ruta, env, nombres, extra) { const src = fs.readFileSync(ruta, 'utf8') + '\n' + (extra || '') + ';return {' + nombres.map(n => n + ':(typeof ' + n + "!=='undefined'?" + n + ':undefined)').join(',') + '};'; return new Function(...Object.keys(env.G), src)(...Object.values(env.G)); }
module.exports = { Spreadsheet, entorno, cargar, colLet };
