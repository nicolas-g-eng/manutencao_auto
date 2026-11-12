'use strict';
// ---------- util ----------
const $ = s => document.querySelector(s);
const enc = new TextEncoder(), dec = new TextDecoder();
const VAULT = 'focus_vault_v1';
const b64 = buf => { let s = '', a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode(...a.subarray(i, i + 8192)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = v => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const num = v => v == null || v === '' ? null : Number(v);
const pd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fd = d => d ? (typeof d === 'string' ? pd(d) : d).toLocaleDateString('pt-BR') : '—';
const today = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d, n) => { const r = new Date(d.getFullYear(), d.getMonth() + n, 1); const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate(); r.setDate(Math.min(d.getDate(), last)); return r; };

// ---------- crypto ----------
async function deriveKey(user, pass, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(user.trim().toLowerCase() + '\u0000' + pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encryptData(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
  return { iv: b64(iv), ct: b64(ct) };
}
async function decryptData(key, v) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(v.iv) }, key, unb64(v.ct));
  return JSON.parse(dec.decode(pt));
}

// ---------- state ----------
const S = { key: null, salt: null, user: null, data: null, tab: 'painel' };
async function save() {
  const e = await encryptData(S.key, S.data);
  localStorage.setItem(VAULT, JSON.stringify({ v: 1, salt: b64(S.salt), ...e }));
}
const hasVault = () => !!localStorage.getItem(VAULT);

// ---------- login ----------
function showLogin() {
  $('#app').classList.add('hidden'); $('#login').classList.remove('hidden');
  const setup = !hasVault();
  document.querySelectorAll('.only-setup').forEach(e => e.classList.toggle('hidden', !setup));
  $('#loginBtn').textContent = setup ? 'Criar conta neste aparelho' : 'Entrar';
  $('#loginMsg').textContent = setup ? 'Primeiro acesso: escolha usuário e senha. Seus dados ficam criptografados neste aparelho.' : 'Controle de manutenção';
  $('#pass').autocomplete = setup ? 'new-password' : 'current-password';
  $('#pass').value = $('#pass2').value = ''; $('#loginErr').textContent = '';
}
$('#loginForm').addEventListener('submit', async ev => {
  ev.preventDefault();
  const btn = $('#loginBtn'), err = $('#loginErr'); err.textContent = '';
  const user = $('#user').value, pass = $('#pass').value;
  btn.disabled = true; const label = btn.textContent; btn.textContent = 'Aguarde…';
  try {
    if (!hasVault()) {
      if (pass.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
      if (pass !== $('#pass2').value) throw new Error('As senhas não conferem.');
      let data = { km: 0, plano: [], hist: [], visitas: [] };
      const f = $('#seed').files[0];
      if (f) {
        const parsed = JSON.parse(await f.text());
        if (parsed.salt && parsed.iv && parsed.ct) { localStorage.setItem(VAULT, JSON.stringify(parsed)); showLogin(); $('#loginErr').textContent = 'Cofre importado. Agora entre com seu usuário e senha.'; return; }
        if (!Array.isArray(parsed.plano) || !Array.isArray(parsed.hist)) throw new Error('Arquivo de dados inválido.');
        data = parsed;
      }
      S.salt = crypto.getRandomValues(new Uint8Array(16));
      S.key = await deriveKey(user, pass, S.salt); S.data = data; S.user = user;
      await save();
    } else {
      const v = JSON.parse(localStorage.getItem(VAULT));
      const salt = unb64(v.salt), key = await deriveKey(user, pass, salt);
      try { S.data = await decryptData(key, v); } catch { throw new Error('Usuário ou senha incorretos.'); }
      if (!Array.isArray(S.data.plano)) { S.data = null; throw new Error('Dados corrompidos neste aparelho. Importe o cofre em “Backup / outro aparelho”.'); }
      S.salt = salt; S.key = key; S.user = user;
    }
    $('#login').classList.add('hidden'); $('#app').classList.remove('hidden');
    $('#pass').value = ''; render();
  } catch (e) { err.textContent = e.message; }
  finally { btn.disabled = false; btn.textContent = label; }
});
$('#importVault').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try { const v = JSON.parse(await f.text()); if (!v.salt || !v.iv || !v.ct) throw 0; localStorage.setItem(VAULT, JSON.stringify(v)); showLogin(); toast('Backup importado. Entre com seu usuário e senha.'); }
  catch { $('#loginErr').textContent = 'Arquivo de backup inválido.'; }
});
$('#logout').onclick = () => { S.key = S.data = null; $('#user').value = ''; showLogin(); };

// ---------- ícones ----------
const P = {
  gauge: '<path d="M4 17a9 9 0 1116 0"/><path d="M12 14l4-5"/><circle cx="12" cy="14" r="1"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 00-5.2 5.2L3 18l3 3 6.5-6.5a4 4 0 005.2-5.2l-2.7 2.7-2.4-.6-.6-2.4z"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  shop: '<path d="M3 21V9l9-6 9 6v12"/><path d="M8 21v-6h8v6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  check: '<path d="M5 12l5 5 9-10"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  down: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', up: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', out: '<path d="M10 4H5v16h5M15 8l5 4-5 4M20 12H9"/>',
  car: '<path d="M4 16V12l2-5h12l2 5v4M3 16h18v3h-3v-2H6v2H3z"/><circle cx="7.5" cy="13" r=".8"/><circle cx="16.5" cy="13" r=".8"/>',
  money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
  road: '<path d="M8 3L4 21M16 3l4 18M12 4v3M12 11v3M12 18v3"/>', shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  spring: '<path d="M8 3h8M8 7h8M8 11h8M8 15h8M8 19h8M6 5c0 1 12 1 12 2M6 9c0 1 12 1 12 2M6 13c0 1 12 1 12 2M6 17c0 1 12 1 12 2"/>',
  fuel: '<path d="M5 21V4h9v17M3 21h13M14 9h3a2 2 0 012 2v6a1.5 1.5 0 003 0V8l-3-3M7 8h5"/>',
  drop: '<path d="M12 3s6 7 6 11a6 6 0 01-12 0c0-4 6-11 6-11z"/>',
  align: '<path d="M6 4v16M18 4v16M6 12h12M3 7l3-3 3 3M15 17l3 3 3-3"/>',
  bolt: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>', snow: '<path d="M12 2v20M4 7l16 10M20 7L4 17"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1"/>'
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || P.wrench}</svg>`;
const CAT = { 'Freios': 'disc', 'Motor': 'cog', 'Suspensão': 'spring', 'Alimentação': 'fuel', 'Revisão': 'drop', 'Alinhamento': 'align', 'Elétrica': 'bolt', 'Conforto': 'snow' };
const catIc = c => ic(CAT[c] || 'wrench');
const toast = (m, i = 'check') => { const t = $('#toast'); t.innerHTML = ic(i) + esc(m); t.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 2200); };

// ---------- cálculo (espelha a planilha) ----------
function avgKmDay() {
  const v = S.data.visitas.filter(x => x.data && x.km); if (!v.length) return 0;
  const minKm = Math.min(...v.map(x => x.km)), minD = new Date(Math.min(...v.map(x => pd(x.data))));
  const days = Math.round((today() - minD) / 864e5); return days > 0 ? (S.data.km - minKm) / days : 0;
}
function calc(p) {
  const t = today(), avg = avgKmDay();
  const kmT = num(p.kmTroca), G = kmT != null && p.intKm ? kmT + Number(p.intKm) : null;
  const Hd = p.ultima && p.intMeses ? addMonths(pd(p.ultima), Number(p.intMeses)) : null;
  const I = G != null ? G - S.data.km : null;
  const J = I != null && avg > 0 ? addDays(t, Math.round(Math.max(I, 0) / avg)) : null;
  const K = [Hd, J].filter(Boolean).sort((a, b) => a - b)[0] || null;
  const L = K ? Math.round((K - t) / 864e5) : null;
  let st;
  if (!p.ultima) st = 'SEM REGISTRO';
  else if (!K) st = 'SÓ SE FALHAR';
  else if (K <= t || (I != null && I <= 0)) st = 'VENCIDO';
  else if (L <= 45 || (I != null && I <= 1500)) st = 'EM BREVE';
  else st = 'EM DIA';
  // % do intervalo já consumido (maior entre km e tempo)
  let used = 0;
  if (kmT != null && p.intKm) used = Math.max(used, (S.data.km - kmT) / p.intKm);
  if (p.ultima && p.intMeses) used = Math.max(used, (t - pd(p.ultima)) / (Hd - pd(p.ultima)));
  return { G, Hd, I, J, K, L, st, used: Math.min(Math.max(used, 0), 1) };
}
const cls = s => s === 'EM DIA' ? 'ok' : s === 'EM BREVE' ? 'warn' : s === 'VENCIDO' ? 'bad' : '';
const sico = s => s === 'EM DIA' ? 'check' : s === 'EM BREVE' ? 'clock' : s === 'VENCIDO' ? 'alert' : 'tag';
const tag = (s, label) => `<span class="tag ${cls(s)}">${ic(sico(s))}${label || s}</span>`;
const lineTotal = h => (h.qtd || 0) * (h.unit || 0) - (h.desconto || 0);
const visitTotal = v => S.data.hist.filter(h => h.os === v.os && h.data === v.data).reduce((a, h) => a + lineTotal(h), 0);
const kmf = n => n == null ? '—' : n.toLocaleString('pt-BR');

// ---------- views ----------
const UI = { pf: 'todos', hq: '', hc: '' };
function viewPainel() {
  const d = S.data, items = d.plano.map(p => ({ p, c: calc(p) }));
  const total = d.hist.reduce((a, h) => a + lineTotal(h), 0);
  const venc = items.filter(i => i.c.st === 'VENCIDO'), breve = items.filter(i => i.c.st === 'EM BREVE');
  const prox = items.filter(i => i.c.K).sort((a, b) => a.c.K - b.c.K).slice(0, 5);
  const cats = {}; d.hist.forEach(h => cats[h.cat] = (cats[h.cat] || 0) + lineTotal(h));
  const catRows = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const alert = venc.length ? `<div class="alert bad" data-go="plano" data-pf="VENCIDO">${ic('alert')}<div><b>${venc.length} item(ns) vencido(s)</b><span>${venc.map(i => esc(i.p.item)).join(', ')}</span></div></div>`
    : breve.length ? `<div class="alert warn" data-go="plano" data-pf="EM BREVE">${ic('clock')}<div><b>${breve.length} item(ns) vencendo em breve</b><span>${breve.map(i => esc(i.p.item)).join(', ')}</span></div></div>`
    : `<div class="alert ok" data-go="plano">${ic('shield')}<div><b>Tudo em dia</b><span>Nenhuma manutenção vencida ou próxima.</span></div></div>`;
  return `
  <div class="card hero"><h2>${ic('gauge')} KM atual</h2>
    <div class="kmrow"><button data-km="-100" aria-label="menos 100">−100</button><input id="km" type="number" inputmode="numeric" value="${d.km}"><button data-km="100" aria-label="mais 100">+100</button></div></div>
  ${alert}
  <div class="grid" style="margin-bottom:14px">
    <button class="kpi" data-go="hist">${ic('money')}<b>${brl(total)}</b><span>Total investido</span></button>
    <button class="kpi" data-go="visitas">${ic('shop')}<b>${d.visitas.length}</b><span>Visitas à oficina</span></button>
    <button class="kpi bad" data-go="plano" data-pf="VENCIDO">${ic('alert')}<b>${venc.length}</b><span>Vencidos</span></button>
    <button class="kpi warn" data-go="plano" data-pf="EM BREVE">${ic('clock')}<b>${breve.length}</b><span>Em breve</span></button>
    <div class="kpi" style="cursor:default">${ic('road')}<b>${Math.round(avgKmDay() * 30).toLocaleString('pt-BR')}</b><span>km por mês (${avgKmDay().toFixed(1).replace('.', ',')}/dia)</span></div>
  </div>
  <div class="card"><h2>${ic('wrench')} Próximas manutenções</h2>
    ${prox.map(({ p, c }) => `<div class="hi" data-go="plano" style="cursor:pointer"><div class="ico">${catIc(p.cat)}</div><div class="d"><b>${esc(p.item)}</b><span>até ${fd(c.K)} · ${c.L} dias${c.I != null ? ' · ' + kmf(c.I) + ' km' : ''}</span></div>${tag(c.st)}</div>`).join('')}
  </div>
  <div class="card"><h2>${ic('money')} Gastos por categoria <span class="muted" style="text-transform:none;letter-spacing:0">(toque para filtrar)</span></h2>
    ${catRows.map(([c, v]) => `<div class="catrow" data-go="hist" data-hc="${esc(c)}"><p><span>${catIc(c)}${esc(c)}</span><span>${brl(v)} · ${(v / total * 100 || 0).toFixed(0)}%</span></p><div class="bar"><i style="width:${v / total * 100 || 0}%"></i></div></div>`).join('')}
  </div>`;
}
function viewPlano() {
  let rows = S.data.plano.map((p, i) => ({ p, i, c: calc(p) }));
  const cnt = s => rows.filter(r => r.c.st === s).length;
  if (UI.pf !== 'todos') rows = rows.filter(r => r.c.st === UI.pf);
  rows.sort((a, b) => (a.c.K ? a.c.K : 8e15) - (b.c.K ? b.c.K : 8e15));
  const chip = (k, l, n) => `<button class="chip ${UI.pf === k ? 'on' : ''}" data-pf="${k}">${l}${n != null ? ` (${n})` : ''}</button>`;
  return `<div class="chips">${chip('todos', 'Todos', S.data.plano.length)}${chip('VENCIDO', 'Vencidos', cnt('VENCIDO'))}${chip('EM BREVE', 'Em breve', cnt('EM BREVE'))}${chip('EM DIA', 'Em dia', cnt('EM DIA'))}${chip('SEM REGISTRO', 'Sem registro', cnt('SEM REGISTRO'))}</div>
  <div class="plist">${rows.map(({ p, i, c }) => `<div class="card pc">
    <div class="top"><div class="ico">${catIc(p.cat)}</div><div class="nm">${esc(p.item)}<br><span class="muted" style="font-weight:400;font-size:12px">${esc(p.cat)}</span></div>${tag(c.st)}</div>
    <div class="bar ${cls(c.st)}"><i style="width:${Math.round(c.used * 100)}%"></i></div>
    <div class="meta"><span>${c.K ? 'Fazer até ' + fd(c.K) + ' · ' + c.L + ' dias' : '—'}</span><span>${c.I != null ? kmf(c.I) + ' km' : ''}</span></div>
    ${p.obs ? `<div class="obs">${esc(p.obs)}</div>` : ''}
    <button class="btn primary small" data-done="${i}">${ic('check')} Feito hoje (${kmf(S.data.km)} km)</button>
    <details><summary>${ic('wrench')} Editar dados</summary>
      <div class="row"><label>Última troca<input type="date" data-pl="${i}" data-f="ultima" value="${p.ultima || ''}"></label>
      <label>KM na troca<input type="number" inputmode="numeric" data-pl="${i}" data-f="kmTroca" value="${p.kmTroca ?? ''}"></label>
      <label>Intervalo (km)<input type="number" inputmode="numeric" data-pl="${i}" data-f="intKm" value="${p.intKm ?? ''}"></label>
      <label>Intervalo (meses)<input type="number" inputmode="numeric" data-pl="${i}" data-f="intMeses" value="${p.intMeses ?? ''}"></label></div></details>
  </div>`).join('') || '<div class="card empty">Nada nesta categoria.</div>'}</div>`;
}
function viewHist() {
  const all = S.data.hist.map((h, i) => ({ h, i }));
  const cats = [...new Set(['Freios', 'Revisão', 'Motor', 'Suspensão', 'Alimentação', 'Alinhamento', 'Elétrica', 'Conforto'].concat(S.data.hist.map(h => h.cat)))];
  const q = UI.hq.toLowerCase();
  const list = all.filter(({ h }) => (!UI.hc || h.cat === UI.hc) && (!q || (h.desc + ' ' + h.os + ' ' + h.oficina + ' ' + h.cat).toLowerCase().includes(q)))
    .sort((a, b) => b.h.data.localeCompare(a.h.data) || b.i - a.i);
  const shown = list.reduce((a, { h }) => a + lineTotal(h), 0);
  return `<details class="card" id="newItem"><summary style="cursor:pointer;font-weight:600;color:var(--acc)">${ic('plus')} Novo lançamento</summary><form id="hForm" style="margin-top:12px"><div class="row">
    <label>Data<input name="data" type="date" required value="${iso(today())}"></label>
    <label>Nº OS<input name="os" value="S/N"></label>
    <label>Oficina<input name="oficina" placeholder="Nome da oficina"></label>
    <label>KM<input name="km" type="number" inputmode="numeric" required value="${S.data.km}"></label>
    <label>Tipo<select name="tipo"><option>Peça</option><option selected>Serviço</option><option>Peça + serviço</option></select></label>
    <label>Categoria<select name="cat">${cats.map(c => `<option>${esc(c)}</option>`).join('')}</select></label></div>
    <label>Descrição<input name="desc" required></label>
    <div class="row"><label>Qtd<input name="qtd" type="number" min="1" value="1" required></label>
    <label>Valor unitário (R$)<input name="unit" type="number" step="0.01" inputmode="decimal" required></label>
    <label>Desconto (R$)<input name="desconto" type="number" step="0.01" inputmode="decimal" value="0"></label></div>
    <button class="btn primary wide">${ic('plus')} Adicionar</button></form></details>
  <div class="search">${ic('search')}<input id="hq" placeholder="Buscar peça, oficina, OS…" value="${esc(UI.hq)}"></div>
  <div class="chips"><button class="chip ${!UI.hc ? 'on' : ''}" data-hc="">Todas</button>${cats.map(c => `<button class="chip ${UI.hc === c ? 'on' : ''}" data-hc="${esc(c)}">${catIc(c)}${esc(c)}</button>`).join('')}</div>
  <div class="card"><h2>${ic('receipt')} ${list.length} itens · ${brl(shown)}</h2>
    ${list.map(({ h, i }) => `<div class="hi"><div class="ico">${catIc(h.cat)}</div><div class="d"><b>${esc(h.desc)}</b><span>${fd(h.data)} · ${esc(h.cat)} · OS ${esc(h.os)}${h.qtd > 1 ? ' · ' + h.qtd + '×' : ''}</span></div><div class="v">${brl(lineTotal(h))}</div><button class="btn small danger" data-del="${i}" aria-label="Apagar">${ic('trash')}</button></div>`).join('') || '<div class="empty">Nenhum lançamento.</div>'}
  </div>`;
}
function viewVisitas() {
  const list = [...S.data.visitas].map((v, i) => ({ v, i })).sort((a, b) => b.v.data.localeCompare(a.v.data));
  return list.map(({ v, i }) => {
    const gar = addDays(pd(v.data), 90), vig = gar >= today();
    return `<div class="card vis"><div class="grow"><h2 style="margin:0">${ic('shop')} ${fd(v.data)} · OS ${esc(v.os)}</h2>${tag(vig ? 'EM DIA' : 'SÓ SE FALHAR', vig ? 'Garantia vigente' : 'Garantia encerrada')}</div>
    <p style="margin:8px 0 2px"><b>${esc(v.oficina)}</b> · ${brl(visitTotal(v))} · ${kmf(v.km)} km</p><p class="muted" style="margin:0 0 10px;font-size:13px">Garantia até ${fd(gar)}</p>
    <label>O que foi feito<textarea rows="3" data-vs="${i}" data-f="feito">${esc(v.feito)}</textarea></label>
    <label>Forma de pagamento<input data-vs="${i}" data-f="pagamento" value="${esc(v.pagamento)}"></label></div>`;
  }).join('') || '<div class="card empty">Nenhuma visita ainda.</div>';
}
function viewConta() {
  return `<div class="card"><h2>${ic('user')} Conta</h2><p style="margin:0">Conectado como <b>${esc(S.user)}</b></p><p class="muted" style="font-size:13px">Dados criptografados e guardados só neste navegador.</p></div>
  <div class="card"><h2>${ic('down')} Backup</h2>
    <p class="muted" style="margin-top:0">Arquivo criptografado com seu usuário e senha, para levar a outro aparelho ou guardar.</p>
    <button class="btn" id="exp">${ic('down')} Baixar backup</button>
    <p><label>Restaurar backup (substitui os dados deste aparelho)<input id="imp" type="file" accept=".json"></label></p></div>
  <div class="card"><h2>${ic('lock')} Alterar senha</h2>
    <label>Nova senha<input id="np" type="password" autocomplete="new-password" minlength="6"></label>
    <button class="btn" id="chg">${ic('lock')} Alterar</button></div>
  <div class="card"><h2>${ic('trash')} Zona de perigo</h2><button class="btn danger" id="wipe">${ic('trash')} Apagar todos os dados deste aparelho</button></div>`;
}

// ---------- render + eventos ----------
const TABS = [['painel', 'gauge', 'Painel'], ['plano', 'wrench', 'Plano'], ['hist', 'receipt', 'Histórico'], ['visitas', 'shop', 'Visitas'], ['conta', 'user', 'Conta']];
function render() {
  const nv = S.data.plano.filter(p => calc(p).st === 'VENCIDO').length;
  $('#tabs').innerHTML = TABS.map(([k, i, l]) => `<button data-t="${k}" class="${S.tab === k ? 'on' : ''}">${ic(i)}${l}${k === 'plano' && nv ? `<span class="dot">${nv}</span>` : ''}</button>`).join('');
  const v = $('#view'); v.style.animation = 'none'; void v.offsetWidth; v.style.animation = '';
  v.innerHTML = { painel: viewPainel, plano: viewPlano, hist: viewHist, visitas: viewVisitas, conta: viewConta }[S.tab]();
}
function go(t) { S.tab = t; render(); window.scrollTo({ top: 0 }); }
$('#tabs').onclick = e => { const b = e.target.closest('button'); if (b) go(b.dataset.t); };
$('#logout').innerHTML = ic('out'); $('#eye').innerHTML = ic('eye');
$('#eye').onclick = () => { const p = $('#pass'); p.type = p.type === 'password' ? 'text' : 'password'; };

const view = $('#view');
view.addEventListener('input', e => { if (e.target.id === 'hq') { UI.hq = e.target.value; const pos = e.target.selectionStart; render(); const n = $('#hq'); n.focus(); n.setSelectionRange(pos, pos); } });
view.addEventListener('change', async e => {
  const t = e.target, d = S.data;
  if (t.id === 'km') { d.km = Number(t.value) || 0; await save(); render(); toast('KM atualizado', 'gauge'); }
  else if (t.dataset.pl != null) { const p = d.plano[t.dataset.pl], f = t.dataset.f; p[f] = f === 'ultima' ? (t.value || null) : num(t.value); await save(); render(); toast('Salvo'); }
  else if (t.dataset.vs != null) { d.visitas[t.dataset.vs][t.dataset.f] = t.value; await save(); toast('Salvo'); }
  else if (t.id === 'imp') {
    const f = t.files[0]; if (!f) return;
    try { const v = JSON.parse(await f.text()); S.data = await decryptData(S.key, v); S.salt = unb64(v.salt); await save(); render(); toast('Backup restaurado'); }
    catch { toast('Backup inválido ou de outro usuário/senha', 'alert'); }
  }
});
view.addEventListener('click', async e => {
  const d = S.data;
  const g = e.target.closest('[data-go]');
  const t = e.target.closest('button');
  if (t && t.dataset.km) { d.km = Math.max(0, d.km + Number(t.dataset.km)); await save(); render(); return; }
  if (t && t.dataset.done != null) { const p = d.plano[t.dataset.done]; p.ultima = iso(today()); p.kmTroca = d.km; await save(); render(); toast(`${p.item}: feito hoje`); return; }
  if (t && t.dataset.del != null) { if (confirm('Apagar este lançamento?')) { d.hist.splice(t.dataset.del, 1); await save(); render(); toast('Apagado', 'trash'); } return; }
  if (t && t.dataset.pf != null && !t.dataset.go) { UI.pf = t.dataset.pf; render(); return; }
  if (t && t.dataset.hc != null && !t.dataset.go) { UI.hc = t.dataset.hc; render(); return; }
  if (t && t.id === 'exp') { const blob = new Blob([localStorage.getItem(VAULT)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `focus-backup-${iso(today())}.json`; a.click(); toast('Backup baixado', 'down'); return; }
  if (t && t.id === 'chg') { const np = $('#np').value; if (np.length < 6) return toast('Mínimo 6 caracteres', 'alert'); S.salt = crypto.getRandomValues(new Uint8Array(16)); S.key = await deriveKey(S.user, np, S.salt); await save(); $('#np').value = ''; toast('Senha alterada', 'lock'); return; }
  if (t && t.id === 'wipe') { if (confirm('Apagar TODOS os dados deste aparelho? Não dá para desfazer.')) { localStorage.removeItem(VAULT); S.key = S.data = null; showLogin(); } return; }
  if (g) { if (g.dataset.pf != null) UI.pf = g.dataset.pf; else if (g.dataset.go === 'plano') UI.pf = 'todos'; if (g.dataset.hc != null) UI.hc = g.dataset.hc; else if (g.dataset.go === 'hist') UI.hc = ''; go(g.dataset.go); }
});
view.addEventListener('submit', async e => {
  if (e.target.id !== 'hForm') return; e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target)), d = S.data;
  const h = { data: f.data, os: f.os || 'S/N', oficina: f.oficina || 'Oficina não informada', km: Number(f.km), tipo: f.tipo, cat: f.cat, desc: f.desc, qtd: Number(f.qtd), unit: Number(f.unit), desconto: Number(f.desconto) || 0 };
  d.hist.push(h);
  const v = d.visitas.find(v => v.os === h.os && v.data === h.data);
  if (!v) d.visitas.push({ data: h.data, os: h.os, oficina: h.oficina, km: h.km, feito: h.desc, pagamento: '—' });
  else if (!v.feito.includes(h.desc)) v.feito += '; ' + h.desc;
  if (h.km > d.km) d.km = h.km;
  await save(); render(); toast('Lançamento adicionado', 'plus');
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
showLogin();
