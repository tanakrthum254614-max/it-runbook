import { api, esc, fmtDate, toast, setKey } from './common.js';

const $ = (s) => document.querySelector(s);
const view = $('#view');

let runbooks = [];
let cfg = { orgName: 'IT Helpdesk', ticketUrl: '', contact: '' };
let category = '';
let query = '';

const session = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} },
};

function setAdmin(on) {
  document.body.classList.toggle('admin', on);
  session.set('admin', on ? '1' : '');
  $('#btnAdmin').textContent = on ? '🚪 ออกจากโหมดแอดมิน' : '⚙ โหมดแอดมิน';
}
const isAdmin = () => document.body.classList.contains('admin');

// ---------- ค้นหา ----------
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ');

function search(list, q) {
  const terms = norm(q).split(' ').filter(Boolean);
  if (!terms.length) return list;
  return list
    .map((r) => {
      const title = norm(r.title);
      const hay = norm([r.title, r.category, (r.tags || []).join(' '), r.symptoms, r.steps].join(' '));
      if (!terms.every((t) => hay.includes(t))) return null;
      const score = terms.reduce((s, t) => s + (title.includes(t) ? 3 : 0) + ((r.tags || []).some((g) => norm(g).includes(t)) ? 2 : 0), 0);
      return { r, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.r);
}

const categories = () => [...new Set(runbooks.map((r) => r.category))].sort((a, b) => a.localeCompare(b, 'th'));
const stepsOf = (r) => r.steps.split('\n').map((s) => s.trim()).filter(Boolean);

// ---------- หน้า: รายการ ----------
function renderList() {
  view.innerHTML = `
    <section class="hero">
      <h2>มีปัญหาอะไรครับ?</h2>
      <p>ลองทำตามขั้นตอนนี้ก่อน ส่วนใหญ่แก้เองได้เร็วกว่ารอ IT</p>
      <input type="search" id="q" placeholder="พิมพ์อาการ เช่น ปริ้นไม่ออก, vpn, ลืมรหัส" value="${esc(query)}" autofocus>
    </section>
    <div class="chips">
      <button class="chip ${!category ? 'active' : ''}" data-cat="">ทั้งหมด</button>
      ${categories().map((c) => `<button class="chip ${c === category ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
    </div>
    <div class="toolbar admin-only flex" style="justify-content:center"><a class="btn" href="#/stats">📊 ดูว่า runbook ไหนควรปรับปรุง</a></div>
    <div class="list" id="results"></div>`;
  const q = $('#q');
  q.oninput = () => { query = q.value; renderResults(); };
  q.setSelectionRange(q.value.length, q.value.length);
  renderResults();
}

function renderResults() {
  const list = search(runbooks.filter((r) => !category || r.category === category), query);
  $('#results').innerHTML = list.length ? list.map((r) => `
    <a class="card rb" href="#/rb/${r.id}">
      <span class="badge">${esc(r.category)}</span>
      <h3>${esc(r.title)}</h3>
      <p>${esc(r.symptoms)}</p>
      <div class="meta">${stepsOf(r).length} ขั้นตอน</div>
    </a>`).join('')
    : `<div class="card empty" style="grid-column:1/-1">ไม่พบวิธีแก้ที่ตรงกับ “${esc(query)}”<br><br>${ticketButton('📨 แจ้ง IT โดยตรง')}</div>`;
}

function ticketButton(label) {
  return cfg.ticketUrl
    ? `<a class="btn primary" href="${esc(cfg.ticketUrl)}" target="_blank" rel="noopener">${label}</a>`
    : `<span class="hint">${esc(cfg.contact || 'ติดต่อทีม IT')}</span>`;
}

// ---------- หน้า: รายละเอียด ----------
function renderDetail(id) {
  const r = runbooks.find((x) => x.id === id);
  if (!r) { location.hash = ''; return; }
  if (!session.get(`viewed:${id}`)) {
    session.set(`viewed:${id}`, '1');
    api('/api/feedback', { method: 'POST', body: { id, action: 'view' } }).catch(() => {});
  }
  view.innerHTML = `
    <div class="detail">
      <p><a href="#">← กลับไปค้นหา</a></p>
      <article class="card">
        <span class="badge">${esc(r.category)}</span>
        <h2>${esc(r.title)}</h2>
        <p class="symptom">${esc(r.symptoms)}</p>
        <ol class="steps">${stepsOf(r).map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
        <p class="hint">แตะที่ขั้นตอนเพื่อติ๊กว่าทำแล้ว</p>
        <div class="outcome" id="outcome">
          <h3>ลองแล้วเป็นอย่างไรบ้าง?</h3>
          <div class="row">
            <button class="primary" data-out="solved">✅ แก้ได้แล้ว</button>
            <button data-out="escalated">😕 ยังไม่หาย</button>
          </div>
        </div>
        <div class="admin-only flex" style="gap:8px;margin-top:16px">
          <button data-edit="${r.id}">✏️ แก้ไข</button>
          <button class="danger" data-del="${r.id}">ลบ</button>
          <span class="hint" style="align-self:center">อ่าน ${r.views || 0} · แก้ได้ ${r.solved || 0} · เปิด ticket ${r.escalated || 0}${r.updatedAt ? ` · แก้ไขล่าสุด ${fmtDate(r.updatedAt)}` : ''}</span>
        </div>
      </article>
    </div>`;
  view.querySelectorAll('ol.steps li').forEach((li) => li.onclick = () => li.classList.toggle('done'));
  view.querySelectorAll('[data-out]').forEach((b) => b.onclick = () => outcome(r, b.dataset.out));
  window.scrollTo(0, 0);
}

function outcome(r, action) {
  api('/api/feedback', { method: 'POST', body: { id: r.id, action } }).catch(() => {});
  $('#outcome').innerHTML = action === 'solved'
    ? '<h3>🎉 เยี่ยมเลย! ขอบคุณที่ลองแก้เองก่อน</h3><a href="#">← กลับหน้าแรก</a>'
    : `<h3>ขออภัยที่ยังไม่หาย ส่งเรื่องให้ IT ได้เลย</h3>
       ${r.escalate ? `<div class="escalate">${esc(r.escalate)}</div>` : ''}
       <div class="row" style="margin-top:12px">${ticketButton('📨 เปิด ticket')}</div>
       <p class="hint">บอก IT ด้วยว่าลองทำตาม “${esc(r.title)}” แล้ว จะได้ไม่ต้องเริ่มถามใหม่</p>`;
}

// ---------- หน้า: สถิติ (แอดมิน) ----------
function renderStats() {
  if (!isAdmin()) { location.hash = ''; return; }
  const rate = (r) => (r.solved + r.escalated) ? r.escalated / (r.solved + r.escalated) : -1;
  const rows = [...runbooks].sort((a, b) => rate(b) - rate(a) || b.views - a.views);
  const total = runbooks.reduce((s, r) => ({ v: s.v + (r.views || 0), s: s.s + (r.solved || 0), e: s.e + (r.escalated || 0) }), { v: 0, s: 0, e: 0 });
  view.innerHTML = `
    <p><a href="#">← กลับ</a></p>
    <div class="stats">
      <div class="card stat"><div class="n">${total.v}</div><div class="l">ครั้งที่เปิดอ่าน</div></div>
      <div class="card stat"><div class="n days" style="color:var(--ok)">${total.s}</div><div class="l">user แก้เองได้ (ticket ที่ลดไป)</div></div>
      <div class="card stat"><div class="n" style="color:var(--warn)">${total.e}</div><div class="l">ยังต้องเปิด ticket</div></div>
    </div>
    <p class="hint">เรียงจาก runbook ที่ user ทำตามแล้ว “ยังไม่หาย” มากที่สุด ควรปรับปรุงรายการบน ๆ ก่อน</p>
    <div class="card table-scroll"><table class="stats-table">
      <thead><tr><th>Runbook</th><th>อ่าน</th><th>แก้ได้</th><th>ไม่หาย</th><th>% ไม่หาย</th></tr></thead>
      <tbody>${rows.map((r) => `<tr>
        <td><a href="#/rb/${r.id}">${esc(r.title)}</a></td>
        <td class="num">${r.views || 0}</td><td class="num">${r.solved || 0}</td><td class="num">${r.escalated || 0}</td>
        <td class="num">${rate(r) < 0 ? '–' : Math.round(rate(r) * 100) + '%'}</td></tr>`).join('')}</tbody>
    </table></div>`;
}

function route() {
  const [, page, id] = location.hash.split('/');
  if (page === 'rb') renderDetail(id);
  else if (page === 'stats') renderStats();
  else renderList();
}

// ---------- แก้ไข (แอดมิน) ----------
function openForm(r = {}) {
  const f = $('#form');
  f.reset();
  for (const k of ['id', 'title', 'category', 'symptoms', 'steps', 'escalate']) f[k].value = r[k] || '';
  f.tags.value = (r.tags || []).join(', ');
  $('#cats').innerHTML = categories().map((c) => `<option value="${esc(c)}">`).join('');
  $('#dlgTitle').textContent = r.id ? 'แก้ไข runbook' : 'เขียน runbook';
  $('#dlg').returnValue = '';
  $('#dlg').showModal();
}

$('#dlg').addEventListener('close', async () => {
  if ($('#dlg').returnValue !== 'save') return;
  try {
    const { runbook } = await api('/api/runbooks', { method: 'POST', body: Object.fromEntries(new FormData($('#form'))) });
    await load();
    toast('บันทึกแล้ว');
    location.hash = `#/rb/${runbook.id}`;
    route();
  } catch (e) { toast(e.message, true); }
});

document.addEventListener('click', async (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.cat !== undefined) { category = t.dataset.cat; return renderList(); }
  if (t.dataset.edit) return openForm(runbooks.find((r) => r.id === t.dataset.edit));
  if (t.dataset.del) {
    const r = runbooks.find((x) => x.id === t.dataset.del);
    if (!confirm(`ลบ “${r.title}” ?`)) return;
    try { await api(`/api/runbooks?id=${r.id}`, { method: 'DELETE' }); await load(); location.hash = ''; } catch (err) { toast(err.message, true); }
  }
});

$('#btnNew').onclick = () => openForm();
$('#btnAdmin').onclick = async () => {
  if (isAdmin()) { setAdmin(false); setKey(''); return route(); }
  try { await api('/api/auth'); setAdmin(true); route(); } catch (e) { toast(e.message, true); }
};

async function load() {
  ({ runbooks } = await api('/api/runbooks'));
}

window.addEventListener('hashchange', route);

(async () => {
  if (session.get('admin')) setAdmin(true);
  try {
    [cfg] = await Promise.all([fetch('/api/config').then((r) => r.json()), load()]);
    $('#org').textContent = cfg.orgName;
    document.title = `${cfg.orgName} · แก้ปัญหาด้วยตัวเอง`;
    $('#contact').textContent = cfg.contact;
    if (cfg.ticketUrl) Object.assign($('#ticketTop'), { href: cfg.ticketUrl, hidden: false });
  } catch (e) { toast(e.message, true); }
  route();
})();
