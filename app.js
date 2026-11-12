'use strict';
// ================= util =================
const $ = s => document.querySelector(s);
const enc = new TextEncoder(), dec = new TextDecoder();
const LEGACY = 'focus_vault_v1';
const b64 = buf => { let s = '', a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode(...a.subarray(i, i + 8192)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = v => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const num = v => v == null || v === '' || isNaN(Number(v)) ? null : Number(v);
const kmf = n => n == null ? '—' : Number(n).toLocaleString('pt-BR');
const pd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fd = d => d ? (typeof d === 'string' ? pd(d) : d).toLocaleDateString('pt-BR') : '—';
const today = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d, n) => { const r = new Date(d.getFullYear(), d.getMonth() + n, 1); const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate(); r.setDate(Math.min(d.getDate(), last)); return r; };
const uid = () => Math.random().toString(36).slice(2, 10);

// ================= ícones (Lucide, ISC) =================
const ICONS = {"gauge": "<path d=\"m12 14 4-4\" /> <path d=\"M3.34 19a10 10 0 1 1 17.32 0\" />", "wrench": "<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z\" />", "receipt": "<path d=\"M12 17V7\" /> <path d=\"M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8\" /> <path d=\"M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z\" />", "store": "<path d=\"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5\" /> <path d=\"M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244\" /> <path d=\"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05\" />", "settings": "<path d=\"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />", "plus": "<path d=\"M5 12h14\" /> <path d=\"M12 5v14\" />", "minus": "<path d=\"M5 12h14\" />", "check": "<path d=\"M20 6 9 17l-5-5\" />", "trash-2": "<path d=\"M10 11v6\" /> <path d=\"M14 11v6\" /> <path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6\" /> <path d=\"M3 6h18\" /> <path d=\"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\" />", "download": "<path d=\"M12 15V3\" /> <path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /> <path d=\"m7 10 5 5 5-5\" />", "upload": "<path d=\"M12 3v12\" /> <path d=\"m17 8-5-5-5 5\" /> <path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" />", "lock": "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\" /> <path d=\"M7 11V7a5 5 0 0 1 10 0v4\" />", "eye": "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\" /> <circle cx=\"12\" cy=\"12\" r=\"3\" />", "eye-off": "<path d=\"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49\" /> <path d=\"M14.084 14.158a3 3 0 0 1-4.242-4.242\" /> <path d=\"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143\" /> <path d=\"m2 2 20 20\" />", "search": "<path d=\"m21 21-4.34-4.34\" /> <circle cx=\"11\" cy=\"11\" r=\"8\" />", "triangle-alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\" /> <path d=\"M12 9v4\" /> <path d=\"M12 17h.01\" />", "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 6v6l4 2\" />", "log-out": "<path d=\"m16 17 5-5-5-5\" /> <path d=\"M21 12H9\" /> <path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\" />", "car-front": "<path d=\"m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8\" /> <path d=\"M7 14h.01\" /> <path d=\"M17 14h.01\" /> <rect width=\"18\" height=\"8\" x=\"3\" y=\"10\" rx=\"2\" /> <path d=\"M5 18v2\" /> <path d=\"M19 18v2\" />", "banknote": "<rect width=\"20\" height=\"12\" x=\"2\" y=\"6\" rx=\"2\" /> <circle cx=\"12\" cy=\"12\" r=\"2\" /> <path d=\"M6 12h.01M18 12h.01\" />", "route": "<path d=\"M9 5h8.5a1 1 0 010 7h-11a1 1 0 000 7H15\" /> <circle cx=\"18\" cy=\"19\" r=\"3\" /> <circle cx=\"6\" cy=\"5\" r=\"3\" />", "shield-check": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" /> <path d=\"m9 12 2 2 4-4\" />", "disc-3": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M6 12c0-1.7.7-3.2 1.8-4.2\" /> <circle cx=\"12\" cy=\"12\" r=\"2\" /> <path d=\"M18 12c0 1.7-.7 3.2-1.8 4.2\" />", "cog": "<path d=\"M11 10.27 7 3.34\" /> <path d=\"m11 13.73-4 6.93\" /> <path d=\"M12 22v-2\" /> <path d=\"M12 2v2\" /> <path d=\"M14 12h8\" /> <path d=\"m17 20.66-1-1.73\" /> <path d=\"m17 3.34-1 1.73\" /> <path d=\"M2 12h2\" /> <path d=\"m20.66 17-1.73-1\" /> <path d=\"m20.66 7-1.73 1\" /> <path d=\"m3.34 17 1.73-1\" /> <path d=\"m3.34 7 1.73 1\" /> <circle cx=\"12\" cy=\"12\" r=\"2\" /> <circle cx=\"12\" cy=\"12\" r=\"8\" />", "fuel": "<path d=\"M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5\" /> <path d=\"M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16\" /> <path d=\"M2 21h13\" /> <path d=\"M3 9h11\" />", "droplet": "<path d=\"M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z\" />", "crosshair": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <line x1=\"22\" x2=\"18\" y1=\"12\" y2=\"12\" /> <line x1=\"6\" x2=\"2\" y1=\"12\" y2=\"12\" /> <line x1=\"12\" x2=\"12\" y1=\"6\" y2=\"2\" /> <line x1=\"12\" x2=\"12\" y1=\"22\" y2=\"18\" />", "zap": "<path d=\"M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z\" />", "snowflake": "<path d=\"m10 20-1.25-2.5L6 18\" /> <path d=\"M10 4 8.75 6.5 6 6\" /> <path d=\"m14 20 1.25-2.5L18 18\" /> <path d=\"m14 4 1.25 2.5L18 6\" /> <path d=\"m17 21-3-6h-4\" /> <path d=\"m17 3-3 6 1.5 3\" /> <path d=\"M2 12h6.5L10 9\" /> <path d=\"m20 10-1.5 2 1.5 2\" /> <path d=\"M22 12h-6.5L14 15\" /> <path d=\"m4 10 1.5 2L4 14\" /> <path d=\"m7 21 3-6-1.5-3\" /> <path d=\"m7 3 3 6h4\" />", "tag": "<path d=\"M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z\" /> <circle cx=\"7.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" />", "chevron-down": "<path d=\"m6 9 6 6 6-6\" />", "pencil": "<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\" /> <path d=\"m15 5 4 4\" />", "x": "<path d=\"M18 6 6 18\" /> <path d=\"m6 6 12 12\" />", "calendar": "<path d=\"M8 2v3\" /> <path d=\"M16 2v3\" /> <rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\" /> <path d=\"M3 9h18\" />", "chevrons-up-down": "<path d=\"m7 15 5 5 5-5\" /> <path d=\"m7 9 5-5 5 5\" />", "circle-dot": "<circle cx=\"12\" cy=\"12\" r=\"1\" /> <circle cx=\"12\" cy=\"12\" r=\"10\" />", "battery-charging": "<path d=\"m11 7-3 5h4l-3 5\" /> <path d=\"M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935\" /> <path d=\"M22 14v-4\" /> <path d=\"M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936\" />", "filter": "<path d=\"M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z\" />", "thermometer": "<path d=\"M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z\" />", "user": "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\" /> <circle cx=\"12\" cy=\"7\" r=\"4\" />", "warehouse": "<path d=\"M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11\" /> <path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z\" /> <path d=\"M6 13h12\" /> <path d=\"M6 17h12\" />", "info": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 16v-4\" /> <path d=\"M12 8h.01\" />", "calendar-check": "<path d=\"M8 2v3\" /> <path d=\"M16 2v3\" /> <rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\" /> <path d=\"M3 9h18\" /> <path d=\"m9 15 2 2 4-4\" />"};
const ic = (n, c = '') => `<svg class="i ${c}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.wrench}</svg>`;
const MARK = "<svg class=\"mark\" viewBox=\"0 0 400 150\" aria-hidden=\"true\"><path fill=\"#D8321F\" d=\"M14 96 C20 70 62 60 116 54 C170 24 262 12 326 48 C352 62 372 80 386 100 C344 78 306 66 262 62 C212 58 172 76 128 88 C86 100 48 94 14 96 Z\"/><path fill=\"currentColor\" d=\"M52 112 C118 98 168 92 232 92 C298 92 346 94 376 106 C386 110 392 116 394 124 C356 112 318 112 276 116 C214 122 150 128 100 126 C80 125 64 120 52 112 Z\"/></svg>";
const CATS = ['Revisão', 'Motor', 'Alimentação', 'Freios', 'Suspensão', 'Alinhamento', 'Pneus', 'Elétrica', 'Conforto', 'Outros'];
const CATIC = { 'Revisão': 'droplet', 'Motor': 'cog', 'Alimentação': 'fuel', 'Freios': 'disc-3', 'Suspensão': 'chevrons-up-down', 'Alinhamento': 'crosshair', 'Pneus': 'circle-dot', 'Elétrica': 'zap', 'Conforto': 'snowflake', 'Outros': 'wrench' };
const catIc = c => ic(CATIC[c] || 'wrench');
// plano padrão (referências gerais de mercado; confirmar no manual do veículo)
const TEMPLATE = [
  ['Óleo do motor e filtro de óleo', 'Revisão', 10000, 12], ['Filtro de ar do motor', 'Motor', 10000, 12],
  ['Filtro de ar-condicionado (cabine)', 'Conforto', 10000, 12], ['Filtro de combustível', 'Alimentação', 20000, 12],
  ['Velas de ignição', 'Motor', 30000, 36], ['Fluido de freio', 'Freios', null, 24],
  ['Pastilhas de freio', 'Freios', 30000, 24], ['Discos de freio', 'Freios', 60000, 48],
  ['Alinhamento e balanceamento', 'Alinhamento', 10000, 12], ['Rodízio e calibragem dos pneus', 'Pneus', 10000, 6],
  ['Troca dos pneus', 'Pneus', 50000, 60], ['Líquido de arrefecimento', 'Motor', 50000, 36],
  ['Correias de acessórios', 'Motor', 40000, 36], ['Correia dentada e tensor', 'Motor', 60000, 48],
  ['Amortecedores e kits', 'Suspensão', 60000, 60], ['Bateria', 'Elétrica', null, 36], ['Palhetas do limpador', 'Conforto', null, 12]
];
const FORMAS = ['Dinheiro', 'Pix', 'Cartão de crédito', 'Cartão de débito', 'Boleto', 'Transferência', 'Outro'];
const tplPlan = () => TEMPLATE.map(([item, cat, intKm, intMeses]) => ({ id: uid(), item, cat, ultima: null, kmTroca: null, intKm, intMeses, obs: '' }));

// ================= criptografia =================
async function deriveKey(user, pass, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(user.trim().toLowerCase() + '\u0000' + pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encryptData(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
  return { iv: b64(iv), ct: b64(ct) };
}
async function decryptData(key, v) { return JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(v.iv) }, key, unb64(v.ct)))); }
async function vkey(u) { const h = await crypto.subtle.digest('SHA-256', enc.encode(u.trim().toLowerCase())); return 'revisa_v2:' + [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24); }

// ================= dados =================
function fixV(v) {
  v.id ||= uid(); v.km = Number(v.km) || 0;
  ['plano', 'hist', 'visitas'].forEach(k => { if (!Array.isArray(v[k])) v[k] = []; });
  v.plano.forEach(p => p.id ||= uid());
  v.visitas.forEach(x => { if (!Array.isArray(x.pagamentos)) x.pagamentos = []; if (x.garantia == null) x.garantia = 90; x.obs ||= ''; x.feito ||= ''; });
  return v;
}
function migrate(d) {
  if (d && Array.isArray(d.vehicles)) { d.v = 2; d.vehicles.forEach(fixV); if (!d.vehicles.some(x => x.id === d.cur)) d.cur = d.vehicles[0]?.id || null; return d; }
  if (d && Array.isArray(d.plano) && Array.isArray(d.hist)) { // formato antigo (1 veículo)
    const v = fixV({ nome: 'Meu veículo', marca: '', modelo: '', ano: '', placa: '', km: d.km, plano: d.plano, hist: d.hist, visitas: d.visitas || [] });
    return { v: 2, cur: v.id, vehicles: [v] };
  }
  return null;
}
const S = { key: null, salt: null, vk: null, user: null, data: null, tab: 'painel' };
const V = () => S.data && (S.data.vehicles.find(x => x.id === S.data.cur) || S.data.vehicles[0] || null);
async function save() {
  const e = await encryptData(S.key, S.data);
  localStorage.setItem(S.vk, JSON.stringify({ v: 1, u: S.vk.slice(10), salt: b64(S.salt), ...e }));
}

// ================= cálculo =================
function avgKmDay(v) {
  const pts = v.visitas.filter(x => x.data && x.km).map(x => ({ data: x.data, km: x.km }));
  if (v.ref) pts.push(v.ref);
  if (!pts.length) return 0;
  const first = pts.sort((a, b) => a.data.localeCompare(b.data))[0];
  const days = Math.round((today() - pd(first.data)) / 864e5);
  return days > 0 ? Math.max(v.km - first.km, 0) / days : 0;
}
function calc(v, p) {
  const t = today(), avg = avgKmDay(v);
  const kmT = num(p.kmTroca), G = kmT != null && p.intKm ? kmT + Number(p.intKm) : null;
  const Hd = p.ultima && p.intMeses ? addMonths(pd(p.ultima), Number(p.intMeses)) : null;
  const I = G != null ? G - v.km : null;
  const J = I != null && avg > 0 ? addDays(t, Math.round(Math.max(I, 0) / avg)) : null;
  const K = [Hd, J].filter(Boolean).sort((a, b) => a - b)[0] || null;
  const L = K ? Math.round((K - t) / 864e5) : null;
  let st;
  if (!p.ultima) st = 'SEM REGISTRO';
  else if (!K) st = 'SÓ SE FALHAR';
  else if (K <= t || (I != null && I <= 0)) st = 'VENCIDO';
  else if (L <= 45 || (I != null && I <= 1500)) st = 'EM BREVE';
  else st = 'EM DIA';
  let used = 0;
  if (kmT != null && p.intKm) used = Math.max(used, (v.km - kmT) / p.intKm);
  if (p.ultima && p.intMeses) used = Math.max(used, (t - pd(p.ultima)) / (Hd - pd(p.ultima)));
  return { G, Hd, I, J, K, L, st, used: Math.min(Math.max(used, 0), 1) };
}
const cls = s => s === 'EM DIA' ? 'ok' : s === 'EM BREVE' ? 'warn' : s === 'VENCIDO' ? 'bad' : '';
const sico = s => s === 'EM DIA' ? 'check' : s === 'EM BREVE' ? 'clock' : s === 'VENCIDO' ? 'triangle-alert' : 'tag';
const tag = (s, label) => `<span class="tag ${cls(s)}">${ic(sico(s))}${label || s}</span>`;
const lineTotal = h => (h.qtd || 0) * (h.unit || 0) - (h.desconto || 0);
const visitTotal = (v, x) => v.hist.filter(h => h.os === x.os && h.data === x.data).reduce((a, h) => a + lineTotal(h), 0);
const payTotal = x => (x.pagamentos || []).reduce((a, p) => a + (Number(p.valor) || 0), 0);
const payText = p => p.parcelas > 1 ? `${esc(p.forma)} · ${p.parcelas}× de ${brl(p.valor / p.parcelas)} (${brl(p.valor)})` : `${esc(p.forma)} · ${brl(p.valor)}`;
const plate = p => p ? `<span class="plate"><i>BRASIL</i><b>${esc(String(p).toUpperCase())}</b></span>` : '';
const vDesc = v => [v.marca, v.modelo, v.ano].filter(Boolean).join(' · ');

// ================= UI helpers =================
const UI = { mode: 'login', pf: 'todos', hq: '', hc: '' };
const toast = (m, i = 'check') => { const t = $('#toast'); t.innerHTML = ic(i) + esc(m); t.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 2200); };
const dlg = document.createElement('dialog'); document.body.append(dlg);
function sheet(title, body) { dlg.innerHTML = `<div class="sh"><header><h3>${title}</h3><button class="icon-btn" data-close aria-label="Fechar">${ic('x')}</button></header><div class="sb">${body}</div></div>`; if (!dlg.open) dlg.showModal(); }
const closeSheet = () => dlg.open && dlg.close();
const catOpts = (sel, extra = []) => [...new Set([...CATS, ...extra])].map(c => `<option ${c === sel ? 'selected' : ''}>${esc(c)}</option>`).join('');

// ================= login =================
function showLogin(msg = '') {
  $('#app').classList.add('hidden'); $('#login').classList.remove('hidden');
  const create = UI.mode === 'create';
  document.querySelectorAll('.only-setup').forEach(e => e.classList.toggle('hidden', !create));
  $('#loginBtn').textContent = create ? 'Criar minha conta' : 'Entrar';
  $('#loginMsg').innerHTML = create ? 'Crie seu usuário e senha. Seus veículos ficam criptografados neste aparelho e só você vê.' : 'Entre com seu usuário e senha.';
  $('#pass').autocomplete = create ? 'new-password' : 'current-password';
  $('#pass').value = $('#pass2').value = ''; $('#loginErr').textContent = msg;
  $('#switchMode').textContent = create ? 'Já tenho conta' : 'Primeiro acesso? Criar conta';
}
async function afterAuth() {
  $('#login').classList.add('hidden'); $('#app').classList.remove('hidden');
  $('#pass').value = ''; S.tab = 'painel'; UI.pf = 'todos'; UI.hq = ''; UI.hc = ''; render();
}
$('#loginForm').addEventListener('submit', async ev => {
  ev.preventDefault();
  const btn = $('#loginBtn'), err = $('#loginErr'); err.textContent = '';
  const user = $('#user').value.trim(), pass = $('#pass').value;
  const label = btn.textContent; btn.disabled = true; btn.textContent = 'Aguarde…';
  try {
    const vk = await vkey(user);
    if (UI.mode === 'create') {
      if (localStorage.getItem(vk)) throw new Error('Esse usuário já existe neste aparelho. Use “Já tenho conta”.');
      if (pass.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
      if (pass !== $('#pass2').value) throw new Error('As senhas não conferem.');
      let data = { v: 2, cur: null, vehicles: [] };
      const f = $('#seed').files[0];
      if (f) {
        const parsed = JSON.parse(await f.text());
        if (parsed.salt && parsed.iv && parsed.ct) { localStorage.setItem(parsed.u ? 'revisa_v2:' + parsed.u : LEGACY, JSON.stringify(parsed)); UI.mode = 'login'; showLogin('Backup importado. Entre com seu usuário e senha.'); return; }
        data = migrate(parsed); if (!data) throw new Error('Arquivo de dados inválido.');
      }
      S.salt = crypto.getRandomValues(new Uint8Array(16)); S.key = await deriveKey(user, pass, S.salt); S.vk = vk; S.data = data; S.user = user;
      await save();
    } else {
      let raw = localStorage.getItem(vk), legacy = false;
      if (!raw && localStorage.getItem(LEGACY)) { raw = localStorage.getItem(LEGACY); legacy = true; }
      if (!raw) throw new Error('Usuário não encontrado neste aparelho. Crie a conta ou importe seu backup.');
      const v = JSON.parse(raw), salt = unb64(v.salt), key = await deriveKey(user, pass, salt);
      let d; try { d = await decryptData(key, v); } catch { throw new Error('Usuário ou senha incorretos.'); }
      S.data = migrate(d); if (!S.data) throw new Error('Dados corrompidos. Importe seu backup.');
      S.salt = salt; S.key = key; S.vk = vk; S.user = user;
      await save(); if (legacy) localStorage.removeItem(LEGACY);
    }
    await afterAuth();
  } catch (e) { err.textContent = e.message; }
  finally { btn.disabled = false; btn.textContent = label; }
});
$('#switchMode').onclick = () => { UI.mode = UI.mode === 'create' ? 'login' : 'create'; showLogin(); };
$('#importVault').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(t => { const v = JSON.parse(t); if (!v.salt || !v.iv || !v.ct) throw 0; localStorage.setItem(v.u ? 'revisa_v2:' + v.u : LEGACY, t); UI.mode = 'login'; showLogin('Backup importado. Entre com seu usuário e senha.'); })
    .catch(() => { $('#loginErr').textContent = 'Arquivo de backup inválido.'; });
});
function logout() { S.key = S.data = S.vk = null; closeSheet(); $('#user').value = ''; UI.mode = 'login'; showLogin(); }

// ================= telas =================
const noVehicle = () => `<div class="panel empty"><h2>Nenhum veículo</h2><p>Cadastre seu primeiro veículo para começar o controle de manutenção.</p><button class="btn primary" data-act="add-vehicle">${ic('plus')} Adicionar veículo</button></div>`;

function viewPainel(v) {
  const items = v.plano.map(p => ({ p, c: calc(v, p) }));
  const total = v.hist.reduce((a, h) => a + lineTotal(h), 0);
  const venc = items.filter(i => i.c.st === 'VENCIDO'), breve = items.filter(i => i.c.st === 'EM BREVE');
  const prox = items.filter(i => i.c.K).sort((a, b) => a.c.K - b.c.K).slice(0, 5);
  const cats = {}; v.hist.forEach(h => cats[h.cat] = (cats[h.cat] || 0) + lineTotal(h));
  const catRows = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const avg = avgKmDay(v);
  const alert = venc.length ? `<div class="alert bad" data-go="plano" data-pf="VENCIDO">${ic('triangle-alert')}<div><b>${venc.length} item(ns) vencido(s)</b><span>${venc.map(i => esc(i.p.item)).join(' · ')}</span></div></div>`
    : breve.length ? `<div class="alert warn" data-go="plano" data-pf="EM BREVE">${ic('clock')}<div><b>${breve.length} item(ns) vencendo em breve</b><span>${breve.map(i => esc(i.p.item)).join(' · ')}</span></div></div>`
    : `<div class="alert ok" data-go="plano">${ic('shield-check')}<div><b>Manutenção em dia</b><span>Nenhum item vencido ou próximo do vencimento.</span></div></div>`;
  return `
  <div class="ident"><div><h1>${esc(v.nome)}</h1><p class="muted">${esc(vDesc(v)) || '&nbsp;'}</p></div>${plate(v.placa)}</div>
  <div class="odo"><div class="lab">${ic('gauge')} Hodômetro</div>
    <div class="odo-row"><button data-km="-100" aria-label="menos 100 km">−100</button><input id="km" type="number" inputmode="numeric" value="${v.km}" aria-label="Quilometragem atual"><u>KM</u><button data-km="100" aria-label="mais 100 km">+100</button></div>
    <p>${avg > 0 ? `Média de ${Math.round(avg * 30).toLocaleString('pt-BR')} km por mês` : 'A média de uso aparece depois de alguns registros.'}</p></div>
  ${alert}
  <div class="stats">
    <button class="stat" data-go="hist"><div class="lab">Investido</div><b>${brl(total)}</b></button>
    <button class="stat" data-go="visitas"><div class="lab">Visitas</div><b>${v.visitas.length}</b></button>
    <button class="stat bad" data-go="plano" data-pf="VENCIDO"><div class="lab">Vencidos</div><b>${venc.length}</b></button>
    <button class="stat warn" data-go="plano" data-pf="EM BREVE"><div class="lab">Em breve</div><b>${breve.length}</b></button>
    <button class="stat" data-go="plano" data-pf="todos"><div class="lab">Itens no plano</div><b>${v.plano.length}</b></button>
  </div>
  <div class="sec"><div class="lab">${ic('wrench')} Próximas manutenções</div>
    <div class="rows">${prox.map(({ p, c }) => `<div class="row2 link" data-go="plano" data-pf="todos"><div class="ico">${catIc(p.cat)}</div><div class="grow"><b>${esc(p.item)}</b><span>até ${fd(c.K)} · ${c.L} dias${c.I != null ? ' · ' + kmf(c.I) + ' km' : ''}</span></div>${tag(c.st)}</div>`).join('') || `<div class="empty" style="padding:22px">Registre a última troca dos itens no Plano para ver os prazos.</div>`}</div></div>
  ${catRows.length ? `<div class="sec"><div class="lab">${ic('banknote')} Gastos por categoria</div><div class="panel" style="padding:14px 14px 4px">
    ${catRows.map(([c, x]) => `<div class="cat" data-go="hist" data-hc="${esc(c)}"><p><span class="cn">${catIc(c)}${esc(c)}</span><span class="cv">${brl(x)} · ${(x / total * 100 || 0).toFixed(0)}%</span></p><div class="bar"><i style="width:${x / total * 100 || 0}%"></i></div></div>`).join('')}</div></div>` : ''}`;
}

function viewPlano(v) {
  let rows = v.plano.map(p => ({ p, c: calc(v, p) }));
  const cnt = s => rows.filter(r => r.c.st === s).length, all = rows.length;
  if (UI.pf !== 'todos') rows = rows.filter(r => r.c.st === UI.pf);
  rows.sort((a, b) => (a.c.K ? +a.c.K : 8e15) - (b.c.K ? +b.c.K : 8e15));
  const chip = (k, l, n) => `<button class="chip ${UI.pf === k ? 'on' : ''}" data-pf="${k}">${l} <span style="opacity:.7">${n}</span></button>`;
  return `<div class="pageh"><h1>Plano de manutenção</h1><button class="btn primary sm" data-act="add-plan">${ic('plus')} Item</button></div>
  <div class="chips">${chip('todos', 'Todos', all)}${chip('VENCIDO', 'Vencidos', cnt('VENCIDO'))}${chip('EM BREVE', 'Em breve', cnt('EM BREVE'))}${chip('EM DIA', 'Em dia', cnt('EM DIA'))}${chip('SEM REGISTRO', 'Sem registro', cnt('SEM REGISTRO'))}</div>
  <div class="rows">${rows.map(({ p, c }) => `<div class="row2 item ${cls(c.st)}"><div class="grow">
    <div class="top"><div><b>${esc(p.item)}</b><span>${catIc(p.cat)} ${esc(p.cat)}</span></div>${tag(c.st)}</div>
    <div class="bar ${cls(c.st)}"><i style="width:${Math.round(c.used * 100)}%"></i></div>
    <div class="meta"><span>${c.K ? 'Fazer até ' + fd(c.K) + ' · ' + c.L + ' dias' : (p.ultima ? 'Sem prazo definido' : 'Registre a última troca')}</span><span>${c.I != null ? kmf(c.I) + ' km' : ''}</span></div>
    ${p.obs ? `<span style="margin-top:4px">${esc(p.obs)}</span>` : ''}
    <div class="acts"><button class="btn sm" data-done="${p.id}">${ic('check')} Feito hoje · ${kmf(v.km)} km</button><button class="btn sm" data-act="edit-plan" data-id="${p.id}">${ic('pencil')} Editar</button></div>
  </div></div>`).join('') || '<div class="empty">Nenhum item nesta categoria.</div>'}</div>`;
}

function viewHist(v) {
  const q = UI.hq.toLowerCase();
  const list = v.hist.map((h, i) => ({ h, i })).filter(({ h }) => (!UI.hc || h.cat === UI.hc) && (!q || (h.desc + ' ' + h.os + ' ' + h.oficina + ' ' + h.cat).toLowerCase().includes(q)))
    .sort((a, b) => b.h.data.localeCompare(a.h.data) || b.i - a.i);
  const shown = list.reduce((a, { h }) => a + lineTotal(h), 0);
  const used = [...new Set(v.hist.map(h => h.cat))];
  return `<div class="pageh"><h1>Histórico</h1><button class="btn primary sm" data-act="add-hist">${ic('plus')} Lançamento</button></div>
  <div class="toolbar"><div class="search">${ic('search')}<input id="hq" placeholder="Buscar peça, serviço, oficina…" value="${esc(UI.hq)}"></div></div>
  <div class="chips"><button class="chip ${!UI.hc ? 'on' : ''}" data-hc="">Todas</button>${used.map(c => `<button class="chip ${UI.hc === c ? 'on' : ''}" data-hc="${esc(c)}">${catIc(c)}${esc(c)}</button>`).join('')}</div>
  <div class="lab">${list.length} itens · ${brl(shown)}</div>
  <div class="rows">${list.map(({ h, i }) => `<div class="row2 link" data-act="edit-hist" data-i="${i}"><div class="ico">${catIc(h.cat)}</div><div class="grow"><b>${esc(h.desc)}</b><span>${fd(h.data)} · ${esc(h.cat)} · OS ${esc(h.os)}${h.qtd > 1 ? ' · ' + h.qtd + '×' : ''}</span></div><div class="val">${brl(lineTotal(h))}</div><button class="icon-btn" style="width:32px;height:32px;border:0;color:var(--mut)" data-del="${i}" aria-label="Apagar">${ic('trash-2')}</button></div>`).join('') || '<div class="empty">Nenhum lançamento.</div>'}</div>`;
}

function viewVisitas(v) {
  const list = v.visitas.map((x, i) => ({ x, i })).sort((a, b) => b.x.data.localeCompare(a.x.data));
  return `<div class="pageh"><h1>Visitas à oficina</h1><button class="btn primary sm" data-act="add-visit">${ic('plus')} Visita</button></div>` + (list.map(({ x, i }) => {
    const gar = x.garantia > 0 ? addDays(pd(x.data), x.garantia) : null, vig = gar && gar >= today();
    const tot = visitTotal(v, x), pago = payTotal(x), itens = v.hist.filter(h => h.os === x.os && h.data === x.data);
    const st = !x.pagamentos.length ? ['SEM REGISTRO', 'Pagamento não informado'] : Math.abs(pago - tot) < 0.01 ? ['EM DIA', 'Quitado'] : pago < tot ? ['EM BREVE', 'Falta ' + brl(tot - pago)] : ['EM BREVE', 'Pago a mais: ' + brl(pago - tot)];
    return `<div class="panel" style="padding:14px;margin-bottom:12px">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><div class="lab" style="margin-bottom:4px">${ic('store')} ${fd(x.data)} · OS ${esc(x.os)}</div><b>${esc(x.oficina)}</b><div class="muted" style="font-size:13px">${kmf(x.km)} km</div></div><div class="val" style="font-size:26px">${brl(tot)}</div></div>
    ${x.feito ? `<p style="margin:10px 0 0;font-size:14px">${esc(x.feito)}</p>` : ''}
    ${itens.length ? `<p class="muted" style="font-size:12.5px;margin-top:6px">${itens.length} item(ns) lançado(s) no histórico</p>` : ''}
    <div style="margin:12px 0 4px" class="lab">${ic('banknote')} Pagamento</div>
    ${x.pagamentos.map(p => `<p style="font-size:14px;margin:2px 0">${payText(p)}</p>`).join('') || (x.pagamento && x.pagamento !== '—' ? `<p style="font-size:14px;margin:2px 0">${esc(x.pagamento)}</p>` : '')}
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${tag(st[0], st[1])}${gar ? tag(vig ? 'EM DIA' : 'SÓ SE FALHAR', vig ? 'Garantia até ' + fd(gar) : 'Garantia encerrada') : ''}</div>
    ${x.obs ? `<p class="muted" style="font-size:13px;margin-top:8px">${esc(x.obs)}</p>` : ''}
    <div style="margin-top:12px"><button class="btn sm" data-act="edit-visit" data-i="${i}">${ic('pencil')} Editar visita e pagamento</button></div></div>`;
  }).join('') || '<div class="panel empty">As visitas aparecem aqui conforme você faz lançamentos no Histórico, ou toque em “Visita” para criar uma.</div>');
}

function viewMais() {
  const v = V();
  return `<div class="pageh"><h1>Mais</h1></div>
  <div class="sec"><div class="lab">${ic('car-front')} Seus veículos</div>
    ${S.data.vehicles.map(x => `<button class="vrow ${x.id === v?.id ? 'on' : ''}" data-sw="${x.id}"><div class="grow"><b>${esc(x.nome)}</b><span>${esc(vDesc(x))} · ${kmf(x.km)} km</span></div>${plate(x.placa)}</button>`).join('')}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"><button class="btn primary" data-act="add-vehicle">${ic('plus')} Adicionar veículo</button>${v ? `<button class="btn" data-act="edit-vehicle">${ic('pencil')} Editar atual</button>` : ''}</div></div>
  <div class="sec"><div class="lab">${ic('user')} Conta</div><div class="panel" style="padding:14px">
    <p>Conectado como <b>${esc(S.user)}</b></p><p class="muted" style="font-size:13px;margin-top:4px">Cada usuário tem seus próprios dados, criptografados e guardados só neste aparelho. Ninguém mais vê os seus veículos.</p></div></div>
  <div class="sec"><div class="lab">${ic('download')} Backup</div><div class="panel" style="padding:14px">
    <p class="muted" style="font-size:13px;margin-bottom:10px">Arquivo criptografado com seu usuário e senha, para guardar ou levar a outro aparelho.</p>
    <button class="btn" data-act="export">${ic('download')} Baixar backup</button>
    <label style="margin:14px 0 0">Restaurar backup (substitui os dados desta conta)<input id="imp" type="file" accept=".json"></label></div></div>
  <div class="sec"><div class="lab">${ic('lock')} Segurança</div><div class="panel" style="padding:14px">
    <label>Nova senha<input id="np" type="password" autocomplete="new-password" minlength="6"></label>
    <button class="btn" data-act="chg-pass">${ic('lock')} Alterar senha</button></div></div>
  <div class="sec"><button class="btn danger" data-act="wipe">${ic('trash-2')} Apagar todos os dados desta conta</button></div>`;
}

// ================= folhas (formulários) =================
function vehicleForm(v) {
  const n = !v;
  return `<form data-form="${n ? 'vehicle-add' : 'vehicle-edit'}">
    <label>Apelido do veículo<input name="nome" required placeholder="Ex.: Carro da família" value="${esc(v?.nome)}"></label>
    <div class="row"><label>Marca<input name="marca" value="${esc(v?.marca)}"></label><label>Modelo<input name="modelo" value="${esc(v?.modelo)}"></label></div>
    <div class="row"><label>Ano<input name="ano" inputmode="numeric" maxlength="4" value="${esc(v?.ano)}"></label><label>Placa<input name="placa" autocapitalize="characters" maxlength="8" value="${esc(v?.placa)}"></label>
    <label>KM atual<input name="km" type="number" inputmode="numeric" required value="${v?.km ?? ''}"></label></div>
    ${n ? `<label class="chk"><input type="checkbox" name="tpl" checked> Começar com o plano de manutenção padrão</label><p class="muted" style="font-size:12.5px;margin:-4px 0 14px">Intervalos de referência de mercado. Você pode editar ou excluir qualquer item depois.</p>` : ''}
    <button class="btn primary wide">${ic('check')} ${n ? 'Cadastrar veículo' : 'Salvar'}</button>
    ${!n ? `<button type="button" class="btn danger wide" style="margin-top:8px" data-act="del-vehicle">${ic('trash-2')} Excluir este veículo</button>` : ''}</form>`;
}
function planForm(p) {
  const n = !p;
  return `<form data-form="${n ? 'plan-add' : 'plan-edit'}" data-id="${p?.id || ''}">
    <label>Item<input name="item" required placeholder="Ex.: Óleo do câmbio" value="${esc(p?.item)}"></label>
    <label>Categoria<select name="cat">${catOpts(p?.cat || 'Outros')}</select></label>
    <div class="row"><label>Última troca<input name="ultima" type="date" value="${p?.ultima || ''}"></label><label>KM na troca<input name="kmTroca" type="number" inputmode="numeric" value="${p?.kmTroca ?? ''}"></label></div>
    <div class="row"><label>Intervalo (km)<input name="intKm" type="number" inputmode="numeric" value="${p?.intKm ?? ''}"></label><label>Intervalo (meses)<input name="intMeses" type="number" inputmode="numeric" value="${p?.intMeses ?? ''}"></label></div>
    <label>Observação<input name="obs" value="${esc(p?.obs)}"></label>
    <button class="btn primary wide">${ic('check')} Salvar</button>
    ${!n ? `<button type="button" class="btn danger wide" style="margin-top:8px" data-act="del-plan" data-id="${p.id}">${ic('trash-2')} Excluir item</button>` : ''}</form>`;
}
function histForm(v, h, i) {
  const n = !h;
  return `<form data-form="${n ? 'hist-add' : 'hist-edit'}" data-i="${i ?? ''}">
    <div class="row"><label>Data<input name="data" type="date" required value="${h?.data || iso(today())}"></label><label>KM<input name="km" type="number" inputmode="numeric" required value="${h?.km ?? v.km}"></label></div>
    <div class="row"><label>Nº OS<input name="os" value="${esc(h?.os || 'S/N')}"></label><label>Oficina<input name="oficina" placeholder="Nome da oficina" value="${esc(h?.oficina === 'Oficina não informada' ? '' : h?.oficina)}"></label></div>
    <div class="row"><label>Tipo<select name="tipo">${['Peça', 'Serviço', 'Peça + serviço'].map(t => `<option ${t === (h?.tipo || 'Serviço') ? 'selected' : ''}>${t}</option>`).join('')}</select></label><label>Categoria<select name="cat">${catOpts(h?.cat || 'Revisão', v.hist.map(x => x.cat))}</select></label></div>
    <label>Descrição<input name="desc" required value="${esc(h?.desc)}"></label>
    <div class="row"><label>Qtd<input name="qtd" type="number" min="1" value="${h?.qtd ?? 1}" required></label><label>Valor unitário (R$)<input name="unit" type="number" step="0.01" inputmode="decimal" required value="${h?.unit ?? ''}"></label><label>Desconto (R$)<input name="desconto" type="number" step="0.01" inputmode="decimal" value="${h?.desconto ?? 0}"></label></div>
    <label>Observação<input name="obs" value="${esc(h?.obs)}"></label>
    <p class="muted" style="font-size:12.5px;margin:-4px 0 12px">A forma de pagamento é definida na visita (aba Visitas).</p>
    <button class="btn primary wide">${ic('check')} ${n ? 'Adicionar' : 'Salvar'}</button>
    ${!n ? `<button type="button" class="btn danger wide" style="margin-top:8px" data-del="${i}">${ic('trash-2')} Excluir lançamento</button>` : ''}</form>`;
}
const payRow = (p = { forma: 'Pix', valor: '', parcelas: 1 }) => `<div class="payrow row" style="grid-template-columns:1.3fr 1fr .6fr auto;align-items:end;margin-bottom:8px">
  <label style="margin:0">Forma<select name="pf">${FORMAS.map(f => `<option ${f === p.forma ? 'selected' : ''}>${f}</option>`).join('')}</select></label>
  <label style="margin:0">Valor (R$)<input name="pv" type="number" step="0.01" inputmode="decimal" value="${p.valor ?? ''}"></label>
  <label style="margin:0">Parc.<input name="pp" type="number" min="1" value="${p.parcelas || 1}"></label>
  <button type="button" class="icon-btn" data-act="del-pay" aria-label="Remover pagamento">${ic('x')}</button></div>`;
function visitForm(v, x, i) {
  const n = !x, tot = x ? visitTotal(v, x) : 0;
  return `<form data-form="${n ? 'visit-add' : 'visit-edit'}" data-i="${i ?? ''}">
    <div class="row"><label>Data<input name="data" type="date" required value="${x?.data || iso(today())}"></label><label>KM<input name="km" type="number" inputmode="numeric" value="${x?.km ?? v.km}"></label></div>
    <div class="row"><label>Nº OS<input name="os" value="${esc(x?.os || 'S/N')}"></label><label>Oficina<input name="oficina" value="${esc(x?.oficina === 'Oficina não informada' ? '' : x?.oficina)}"></label><label>Garantia (dias)<input name="garantia" type="number" min="0" value="${x?.garantia ?? 90}"></label></div>
    <label>O que foi feito<textarea name="feito" rows="3">${esc(x?.feito)}</textarea></label>
    <div class="lab" style="margin-top:4px">${ic('banknote')} Pagamento${tot ? ` · total ${brl(tot)}` : ''}</div>
    <div id="pays">${(x?.pagamentos || []).map(payRow).join('')}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"><button type="button" class="btn sm" data-act="add-pay">${ic('plus')} Forma de pagamento</button>${tot ? `<button type="button" class="btn sm" data-act="pay-total" data-total="${tot}">Pagar o total (${brl(tot)})</button>` : ''}</div>
    ${x && !x.pagamentos.length && x.pagamento && x.pagamento !== '—' ? `<p class="muted" style="font-size:12.5px;margin:-6px 0 12px">Anotação antiga: ${esc(x.pagamento)}</p>` : ''}
    <label>Observações<input name="obs" value="${esc(x?.obs)}"></label>
    <button class="btn primary wide">${ic('check')} Salvar</button>
    ${!n ? `<button type="button" class="btn danger wide" style="margin-top:8px" data-act="del-visit" data-i="${i}">${ic('trash-2')} Excluir visita e lançamentos</button>` : ''}</form>`;
}
function switcher() {
  sheet('Meus veículos', S.data.vehicles.map(x => `<button class="vrow ${x.id === S.data.cur ? 'on' : ''}" data-sw="${x.id}"><div class="grow"><b>${esc(x.nome)}</b><span>${esc(vDesc(x))} · ${kmf(x.km)} km</span></div>${plate(x.placa)}</button>`).join('') + `<button class="btn wide" style="margin-top:6px" data-act="add-vehicle">${ic('plus')} Adicionar veículo</button>`);
}

// ================= render =================
const TABS = [['painel', 'gauge', 'Painel'], ['plano', 'wrench', 'Plano'], ['hist', 'receipt', 'Histórico'], ['visitas', 'store', 'Visitas'], ['mais', 'settings', 'Mais']];
function render() {
  const v = V();
  $('#vsel').innerHTML = v ? `${ic('car-front')}<span>${esc(v.nome)}</span>${ic('chevron-down')}` : `${ic('plus')}<span>Adicionar veículo</span>`;
  const nv = v ? v.plano.filter(p => calc(v, p).st === 'VENCIDO').length : 0;
  $('#tabs').innerHTML = TABS.map(([k, i, l]) => `<button data-t="${k}" class="${S.tab === k ? 'on' : ''}">${ic(i)}${l}${k === 'plano' && nv ? `<span class="dot">${nv}</span>` : ''}</button>`).join('');
  $('#view').innerHTML = S.tab === 'mais' ? viewMais() : !v ? noVehicle() : { painel: viewPainel, plano: viewPlano, hist: viewHist, visitas: viewVisitas }[S.tab](v);
}
const go = t => { S.tab = t; render(); window.scrollTo({ top: 0 }); };

// ================= eventos =================
$('#logout').innerHTML = ic('log-out'); $('#eye').innerHTML = ic('eye'); $('#loginMark').innerHTML = MARK; $('#hMark').innerHTML = MARK;
$('#eye').onclick = () => { const p = $('#pass'); p.type = p.type === 'password' ? 'text' : 'password'; };
$('#logout').onclick = logout; $('#vsel').onclick = () => S.data.vehicles.length ? switcher() : sheet('Novo veículo', vehicleForm());

document.addEventListener('input', e => { if (e.target.id === 'hq') { UI.hq = e.target.value; const pos = e.target.selectionStart; render(); const n = $('#hq'); n.focus(); n.setSelectionRange(pos, pos); } });
document.addEventListener('change', async e => {
  const t = e.target, v = V(); if (!S.data) return;
  if (t.id === 'km') { v.km = Math.max(0, Number(t.value) || 0); await save(); render(); toast('Quilometragem atualizada', 'gauge'); }
  else if (t.dataset.vs != null) { v.visitas[t.dataset.vs][t.dataset.f] = t.value; await save(); toast('Salvo'); }
  else if (t.id === 'imp') {
    const f = t.files[0]; if (!f) return;
    try { const b = JSON.parse(await f.text()); const d = migrate(await decryptData(S.key, b)); if (!d) throw 0; S.data = d; S.salt = unb64(b.salt); await save(); render(); toast('Backup restaurado'); }
    catch { toast('Backup inválido ou de outro usuário/senha', 'triangle-alert'); }
  }
});
document.addEventListener('click', async e => {
  if (e.target === dlg || e.target.closest('[data-close]')) return closeSheet();
  if (!S.data) return;
  const v = V(), d = S.data;
  const el = e.target.closest('[data-act],[data-km],[data-done],[data-del],[data-sw],[data-t],[data-pf],[data-hc],[data-go]');
  if (!el) return;
  const D = el.dataset;
  if (D.t) return go(D.t);
  if (D.sw) { d.cur = D.sw; await save(); closeSheet(); render(); return toast('Veículo: ' + V().nome, 'car-front'); }
  if (D.km) { v.km = Math.max(0, v.km + Number(D.km)); await save(); return render(); }
  if (D.done) { const p = v.plano.find(x => x.id === D.done); p.ultima = iso(today()); p.kmTroca = v.km; await save(); render(); return toast(`${p.item}: feito hoje`); }
  if (D.del != null) { if (confirm('Apagar este lançamento?')) { v.hist.splice(D.del, 1); await save(); closeSheet(); render(); toast('Lançamento apagado', 'trash-2'); } return; }
  if (D.go) { if (D.pf != null) UI.pf = D.pf; else if (D.go === 'plano') UI.pf = 'todos'; if (D.hc != null) UI.hc = D.hc; else if (D.go === 'hist') UI.hc = ''; return go(D.go); }
  if (D.pf != null) { UI.pf = D.pf; return render(); }
  if (D.hc != null) { UI.hc = D.hc; return render(); }
  switch (D.act) {
    case 'add-vehicle': return sheet('Novo veículo', vehicleForm());
    case 'edit-vehicle': return sheet('Editar veículo', vehicleForm(v));
    case 'del-vehicle': if (confirm(`Excluir "${v.nome}" e todo o histórico dele?`)) { d.vehicles = d.vehicles.filter(x => x.id !== v.id); d.cur = d.vehicles[0]?.id || null; await save(); closeSheet(); render(); toast('Veículo excluído', 'trash-2'); } return;
    case 'add-plan': return sheet('Novo item do plano', planForm());
    case 'edit-plan': return sheet('Editar item', planForm(v.plano.find(x => x.id === D.id)));
    case 'del-plan': if (confirm('Excluir este item do plano?')) { v.plano = v.plano.filter(x => x.id !== D.id); await save(); closeSheet(); render(); toast('Item excluído', 'trash-2'); } return;
    case 'add-hist': return sheet('Novo lançamento', histForm(v));
    case 'edit-hist': return sheet('Editar lançamento', histForm(v, v.hist[D.i], D.i));
    case 'add-visit': return sheet('Nova visita', visitForm(v));
    case 'edit-visit': return sheet('Editar visita', visitForm(v, v.visitas[D.i], D.i));
    case 'add-pay': $('#pays').insertAdjacentHTML('beforeend', payRow()); return;
    case 'pay-total': $('#pays').insertAdjacentHTML('beforeend', payRow({ forma: 'Pix', valor: Number(D.total), parcelas: 1 })); return;
    case 'del-pay': el.closest('.payrow').remove(); return;
    case 'del-visit': { const x = v.visitas[D.i]; if (confirm('Excluir esta visita e os lançamentos dela no histórico?')) { v.hist = v.hist.filter(h => !(h.os === x.os && h.data === x.data)); v.visitas.splice(D.i, 1); await save(); closeSheet(); render(); toast('Visita excluída', 'trash-2'); } return; }
    case 'export': { const blob = new Blob([localStorage.getItem(S.vk)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `revisa-backup-${iso(today())}.json`; a.click(); return toast('Backup baixado', 'download'); }
    case 'chg-pass': { const np = $('#np').value; if (np.length < 6) return toast('Mínimo de 6 caracteres', 'triangle-alert'); S.salt = crypto.getRandomValues(new Uint8Array(16)); S.key = await deriveKey(S.user, np, S.salt); await save(); $('#np').value = ''; return toast('Senha alterada', 'lock'); }
    case 'wipe': if (confirm('Apagar TODOS os dados desta conta neste aparelho? Não dá para desfazer.')) { localStorage.removeItem(S.vk); logout(); } return;
  }
});
dlg.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target, kind = form.dataset.form, f = Object.fromEntries(new FormData(form)), d = S.data, v = V();
  if (kind === 'vehicle-add') {
    const nv = fixV({ nome: f.nome.trim(), marca: f.marca.trim(), modelo: f.modelo.trim(), ano: f.ano.trim(), placa: f.placa.trim().toUpperCase(), km: Number(f.km), plano: f.tpl ? tplPlan() : [], hist: [], visitas: [], ref: { data: iso(today()), km: Number(f.km) } });
    d.vehicles.push(nv); d.cur = nv.id; S.tab = 'painel'; toast('Veículo cadastrado', 'car-front');
  } else if (kind === 'vehicle-edit') {
    Object.assign(v, { nome: f.nome.trim(), marca: f.marca.trim(), modelo: f.modelo.trim(), ano: f.ano.trim(), placa: f.placa.trim().toUpperCase(), km: Number(f.km) }); toast('Veículo atualizado');
  } else if (kind === 'plan-add' || kind === 'plan-edit') {
    const o = { item: f.item.trim(), cat: f.cat, ultima: f.ultima || null, kmTroca: num(f.kmTroca), intKm: num(f.intKm), intMeses: num(f.intMeses), obs: f.obs.trim() };
    if (kind === 'plan-add') v.plano.push({ id: uid(), ...o }); else Object.assign(v.plano.find(x => x.id === form.dataset.id), o);
    toast('Plano atualizado', 'wrench');
  } else if (kind === 'hist-add' || kind === 'hist-edit') {
    const h = { data: f.data, os: f.os || 'S/N', oficina: f.oficina || 'Oficina não informada', km: Number(f.km), tipo: f.tipo, cat: f.cat, desc: f.desc, qtd: Number(f.qtd), unit: Number(f.unit), desconto: Number(f.desconto) || 0, obs: (f.obs || '').trim() };
    if (kind === 'hist-add') v.hist.push(h); else Object.assign(v.hist[form.dataset.i], h);
    const x = v.visitas.find(x => x.os === h.os && x.data === h.data);
    if (!x) v.visitas.push({ data: h.data, os: h.os, oficina: h.oficina, km: h.km, feito: h.desc, pagamentos: [], garantia: 90, obs: '' });
    else if (kind === 'hist-add' && !x.feito.includes(h.desc)) x.feito = x.feito ? x.feito + '; ' + h.desc : h.desc;
    if (h.km > v.km) v.km = h.km;
    toast(kind === 'hist-add' ? 'Lançamento adicionado' : 'Lançamento atualizado', 'check');
  } else if (kind === 'visit-add' || kind === 'visit-edit') {
    const fdta = new FormData(form), pv = fdta.getAll('pv'), pp = fdta.getAll('pp');
    const pays = fdta.getAll('pf').map((forma, k) => ({ forma, valor: Number(pv[k]) || 0, parcelas: Math.max(1, Number(pp[k]) || 1) })).filter(p => p.valor > 0);
    const o = { data: f.data, os: f.os || 'S/N', oficina: f.oficina.trim() || 'Oficina não informada', km: Number(f.km) || v.km, garantia: Number(f.garantia) || 0, feito: f.feito.trim(), obs: f.obs.trim(), pagamentos: pays };
    if (kind === 'visit-add') v.visitas.push(o);
    else { const x = v.visitas[form.dataset.i]; if (x.os !== o.os || x.data !== o.data) v.hist.forEach(h => { if (h.os === x.os && h.data === x.data) { h.os = o.os; h.data = o.data; } }); Object.assign(x, o); if (pays.length) delete x.pagamento; }
    toast('Visita salva', 'store');
  }
  await save(); closeSheet(); render();
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
showLogin();
