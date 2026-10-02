// chat-panel.js — shared analytics chat panel (Graph + Canvas views)
// Drop <script src="chat-panel.js"> after Chart.js CDN, config.js and analytics.js. Requires #cp, #hist, #ci, #cs in the page.
(function () {

// ── CSS injection ──────────────────────────────────────────────────────────
const _s = document.createElement('style');
_s.textContent = `
#cp {
  position: fixed; top: 16px; right: 16px; width: 460px;
  max-height: calc(100vh - 32px);
  background: rgba(4,4,12,0.82); backdrop-filter: blur(22px);
  border: 1px solid rgba(200,168,75,0.32); border-radius: 14px;
  padding: 18px; z-index: 10; display: flex; flex-direction: column; gap: 10px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}
#cp h2 {
  font-size: .72rem; font-weight: 400; color: #c8a84b;
  letter-spacing: 1px; text-shadow: 0 0 14px rgba(200,168,75,.5);
}
@media (max-width: 768px) {
  #cp { top: auto; bottom: 8px; left: 8px; right: 8px; width: auto; max-height: 50vh; padding: 12px; }
  #cp #hist { max-height: 26vh; }
  #cp #ci { min-height: 56px; }
}
.cp-sug { display: flex; flex-wrap: wrap; gap: 6px; }
.cp-sug button, .cp-new {
  background: transparent; border: 1px solid rgba(200,168,75,.28); border-radius: 999px;
  color: #8a8578; font-size: .72rem; padding: 4px 10px; cursor: pointer; font-family: inherit; }
.cp-sug button:hover, .cp-new:hover { color: #e6dfcf; border-color: #c8a84b; }
.cp-new { align-self: flex-start; border-radius: 6px; }
#hist {
  flex: 1; overflow-y: auto; display: flex; flex-direction: column;
  gap: 10px; max-height: 528px;
  scrollbar-width: thin; scrollbar-color: rgba(200,168,75,.3) transparent;
}
#hist .q {
  font-size: .78rem; color: #8a8578;
  background: rgba(200,168,75,.07); border-left: 2px solid #c8a84b;
  padding: 7px 10px; border-radius: 4px;
}
#hist .a { font-size: .83rem; line-height: 1.55; color: #e6dfcf; }
#hist .a.streaming::after { content: '▋'; animation: cp-blink .8s step-end infinite; }
@keyframes cp-blink { 50% { opacity: 0; } }
#ci {
  width: 100%; min-height: 117px; padding: 9px 11px;   /* +20% de alto del panel */
  background: rgba(0,0,0,.38); color: #e6dfcf;
  border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;
  font-family: inherit; font-size: .85rem; resize: none;
}
#ci:focus { outline: none; border-color: #c8a84b; }
#cs {
  background: #c8a84b; color: #06080f; border: none;
  border-radius: 8px; padding: 9px; font-weight: 600; cursor: pointer;
  font-size: .85rem; width: 100%;
}
#cs:hover { background: #a88930; }
#cs:disabled { opacity: .5; cursor: not-allowed; }
.cp-cvs {
  display: inline-block; margin-top: 8px;
  background: transparent; border: 1px solid rgba(200,168,75,.4);
  color: #c8a84b; border-radius: 6px; padding: 3px 10px;
  font-size: .72rem; cursor: pointer; font-family: inherit;
}
.cp-cvs:hover { background: rgba(200,168,75,.1); }
.cp-cvs:disabled { opacity: .4; cursor: default; }
`;
document.head.appendChild(_s);

// ── State ─────────────────────────────────────────────────────────────────
let convId = localStorage.getItem('ragraph_conv_id') || null;
const HIST_KEY = 'ragraph_hist';

// ── Helpers ───────────────────────────────────────────────────────────────
function _esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _pushCanvas(spec) {
  let items = []; try { items = JSON.parse(localStorage.getItem('ragraph_canvas') || '[]'); } catch {}
  if (!items.find(w => w.id === spec.id)) items.push(spec);
  localStorage.setItem('ragraph_canvas', JSON.stringify(items));
  // Direct render when already on canvas page (storage event doesn't fire for same tab)
  if (typeof renderWidget === 'function') renderWidget(spec);
  if (typeof updateToolbar === 'function') updateToolbar(items.length);
}
function _cvsBtn(ae, spec) {
  const btn = document.createElement('button');
  btn.className = 'cp-cvs'; btn.textContent = '→ Canvas';
  btn.onclick = () => { _pushCanvas(spec); btn.textContent = '✓'; btn.disabled = true; };
  ae.appendChild(btn);
}

// ── History ───────────────────────────────────────────────────────────────
function _saveHist(role, text) {
  let h = []; try { h = JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch {}
  h.push({ role, text });
  if (h.length > 60) h = h.slice(-60);
  localStorage.setItem(HIST_KEY, JSON.stringify(h));
}
function _restoreHist(hist) {
  let h = []; try { h = JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch {}
  h.forEach(({ role, text }) => {
    const el = document.createElement('div'); el.className = role;
    el.innerHTML = role === 'a'
      ? (typeof linkifyEntities === 'function' ? linkifyEntities(text) : _esc(text).replace(/\n/g, '<br>'))
      : text;
    hist.appendChild(el);
  });
  if (hist.children.length) hist.scrollTop = hist.scrollHeight;
}

// ── ask() ─────────────────────────────────────────────────────────────────
async function ask() {
  const ci = document.getElementById('ci');
  const q = ci.value.trim(); if (!q) return;
  const cs = document.getElementById('cs');
  cs.disabled = true; ci.value = '';
  const hist = document.getElementById('hist');
  const qe = document.createElement('div'); qe.className = 'q'; qe.textContent = q; hist.appendChild(qe);
  const ae = document.createElement('div'); ae.className = 'a'; hist.appendChild(ae);
  hist.scrollTop = hist.scrollHeight;
  _saveHist('q', _esc(q));

  const aq = RAGraphAnalytics.detect(q);
  if (aq) {
    try {
      const r = await RAGraphAnalytics.run(aq);
      RAGraphAnalytics.render(ae, r);
      ae.insertAdjacentHTML('beforeend', '<p style="font-size:.7rem;margin-top:6px;opacity:.5">⚡ Grafo directo · sin LLM</p>');
      if (r.spec) _cvsBtn(ae, r.spec);
      _saveHist('a', r.plain);
    } catch (e) {
      ae.textContent = RAGraphAnalytics.errorMessage(e);
      _saveHist('a', ae.textContent);
    } finally { cs.disabled = false; hist.scrollTop = hist.scrollHeight; }
    return;
  }

  // LLM streaming
  ae.classList.add('streaming');
  try {
    const pay = { prompt: q }; if (convId) pay.conversation_id = convId;
    const res = await fetch(apiUrl('/api/ask_stream'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pay) });
    if (!res.ok) {
      ae.textContent = res.status===429 ? 'Demasiadas consultas. Esperá un momento.' : `Error ${res.status}`;
      ae.classList.remove('streaming'); return;
    }
    const rd = res.body.getReader(), dc = new TextDecoder('utf-8');
    let buf = '', ans = '', err = null;
    while (true) {
      const { value, done } = await rd.read(); if (done) break;
      buf += dc.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n\n')) !== -1) {
        const raw = buf.slice(0, i); buf = buf.slice(i + 2);
        const line = raw.split('\n').find(l => l.startsWith('data: ')); if (!line) continue;
        let ev; try { ev = JSON.parse(line.slice(6)); } catch { continue; }
        if (ev.event === 'token') { ans += ev.token || ''; ae.innerHTML = _esc(ans).replace(/\n/g, '<br>'); hist.scrollTop = hist.scrollHeight; }
        else if (ev.event === 'conversation_id') { convId = ev.conversation_id; localStorage.setItem('ragraph_conv_id', convId); }
        else if (ev.event === 'error') { err = ev.message || 'Error inesperado.'; }
      }
    }
    if (err) { ae.textContent = err; ae.classList.remove('streaming'); return; }
    const processed = typeof linkifyEntities === 'function' ? linkifyEntities(ans) : _esc(ans).replace(/\n/g, '<br>');
    ae.innerHTML = processed; ae.classList.remove('streaming');
    _cvsBtn(ae, RAGraphAnalytics.textSpec(q, ans));
    _saveHist('a', ans); // save raw text; linkifyEntities applied on restore
  } catch (e) {
    ae.innerHTML = `<span style="color:#d4324e">Error: ${e.message}</span>`; ae.classList.remove('streaming');
  } finally { cs.disabled = false; }
}

// ── Init ──────────────────────────────────────────────────────────────────
const _hist = document.getElementById('hist');
// Preguntas sugeridas: responden con gráfico desde el grafo (sin LLM), así se ve la función de Canvas
const SUGERENCIAS = ['Top 10 personajes más mencionados', 'Evolución de Voldemort a lo largo de los libros'];
function _newConversation() {
  localStorage.removeItem(HIST_KEY); localStorage.removeItem('ragraph_conv_id');
  convId = null; _hist.innerHTML = '';
}
if (_hist) {
  _restoreHist(_hist);
  const ci = document.getElementById('ci');
  const sug = document.createElement('div'); sug.className = 'cp-sug';
  SUGERENCIAS.forEach(s => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = s;
    b.onclick = () => { ci.value = s; ask(); };
    sug.appendChild(b);
  });
  ci.before(sug);
  const nc = document.createElement('button'); nc.type = 'button'; nc.className = 'cp-new'; nc.textContent = 'Nueva conversación';
  nc.onclick = _newConversation;
  document.querySelector('#cp h2').after(nc);
  document.getElementById('cs').addEventListener('click', ask);
  document.getElementById('ci').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); }
  });
}

window.addEventListener('storage', e => {
  if (e.key === 'ragraph_conv_id') convId = e.newValue;
});

})();
