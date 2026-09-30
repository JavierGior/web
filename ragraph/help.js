// help.js — ayuda contextual de RAGraph.
//  · Un "?" junto a cada parte importante de la interfaz: al pasar el mouse (o tocarlo) explica qué es y para qué sirve.
//  · Un recorrido guiado la primera vez que se abre cada vista (Siguiente / Saltar). Se relanza con el "?" de la navegación.
// Uso: cada página llama RAGraphHelp.register('vista', [{ sel, title, text, badge?, tour?, center? }, ...]).
//   sel: selector CSS; si matchea varios elementos se usa el área que ocupan juntos.
//   badge:false → sin "?" (solo en el recorrido) · tour:false → solo "?" · center:true → globo centrado, sin resaltar.
(function () {

const css = `
.hb { position: fixed; z-index: 60; width: 18px; height: 18px; border-radius: 50%; padding: 0;
  border: 1px solid rgba(200,168,75,.55); background: rgba(4,4,12,.85); color: #c8a84b;
  font: 700 11px/16px -apple-system, 'Segoe UI', system-ui, sans-serif; text-align: center; cursor: help;
  box-shadow: 0 0 8px rgba(200,168,75,.25); transition: transform .15s, box-shadow .15s; }
.hb:hover, .hb:focus-visible { transform: scale(1.15); box-shadow: 0 0 12px rgba(200,168,75,.6); outline: none; }
.hbub { position: fixed; z-index: 9001; max-width: 290px; padding: 12px 14px; border-radius: 10px;
  background: #14121c; border: 1px solid rgba(200,168,75,.5); color: #d9d2c2;
  font: 13px/1.5 -apple-system, 'Segoe UI', system-ui, sans-serif; box-shadow: 0 8px 30px rgba(0,0,0,.55);
  opacity: 0; transition: opacity .15s; pointer-events: none; }
.hbub.on { opacity: 1; }
.hbub.tour { pointer-events: auto; max-width: 320px; }
.hbub b { display: block; color: #c8a84b; font-size: 13.5px; margin-bottom: 3px; }
.hbub .ht-foot { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.hbub .ht-n { flex: 1; font-size: 11px; color: #7a7466; }
.hbub button { font: inherit; font-size: 12px; border-radius: 6px; padding: 5px 12px; cursor: pointer; }
.hbub .ht-skip { background: transparent; border: 1px solid #3a3a4a; color: #8a8578; }
.hbub .ht-next { background: #c8a84b; border: none; color: #06080f; font-weight: 600; }
.hspot { position: fixed; z-index: 9000; border-radius: 10px; pointer-events: none;
  box-shadow: 0 0 0 9999px rgba(2,2,8,.62), 0 0 0 2px #c8a84b, 0 0 18px 4px rgba(200,168,75,.45);
  transition: all .25s ease; }
`;

let page = '', items = [], badges = [], bubble = null, spot = null, tour = null;

function els(it) { return [...document.querySelectorAll(it.sel)].filter(e => e.getClientRects().length); }
function rectOf(it) {
  const list = els(it);
  if (!list.length) return null;
  const rs = list.map(e => e.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
  if (!rs.length) return null;
  const l = Math.min(...rs.map(r => r.left)), t = Math.min(...rs.map(r => r.top));
  const r = Math.max(...rs.map(r => r.right)), b = Math.max(...rs.map(r => r.bottom));
  return { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t };
}

function place(el, target, gap = 10) {
  // Globo abajo del objetivo si entra; si no, arriba; siempre dentro de la pantalla.
  const bw = el.offsetWidth, bh = el.offsetHeight, W = innerWidth, H = innerHeight;
  let x, y;
  if (!target) { x = (W - bw) / 2; y = (H - bh) / 2; }
  else {
    x = target.left + target.width / 2 - bw / 2;
    y = target.bottom + gap;
    if (y + bh > H - 8) y = target.top - bh - gap;
    if (y < 8) { y = Math.min(Math.max(8, target.top), H - bh - 8); x = target.right + gap; if (x + bw > W - 8) x = target.left - bw - gap; }
  }
  el.style.left = Math.max(8, Math.min(x, W - bw - 8)) + 'px';
  el.style.top = Math.max(8, Math.min(y, H - bh - 8)) + 'px';
}

function getBubble() {
  if (!bubble) { bubble = document.createElement('div'); bubble.className = 'hbub'; bubble.setAttribute('role', 'tooltip'); document.body.appendChild(bubble); }
  return bubble;
}
function showTip(it, anchor) {
  if (tour) return;
  const b = getBubble(); b.className = 'hbub'; b.innerHTML = `<b>${it.title}</b>${it.text}`;
  place(b, anchor.getBoundingClientRect(), 8); b.classList.add('on');
}
function hideTip() { if (bubble && !tour) bubble.classList.remove('on'); }

function positionBadges() {
  badges.forEach(({ it, el }) => {
    const r = rectOf(it);
    el.style.display = r && !tour ? '' : 'none';
    if (r) { el.style.left = (r.right - 10) + 'px'; el.style.top = (r.top - 8) + 'px'; }
  });
}

function buildBadges() {
  items.filter(it => it.badge !== false).forEach(it => {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'hb'; el.textContent = '?'; el.setAttribute('aria-label', 'Ayuda: ' + it.title);
    el.onmouseenter = el.onfocus = () => showTip(it, el);
    el.onmouseleave = el.onblur = hideTip;
    el.onclick = e => { e.stopPropagation(); bubble && bubble.classList.contains('on') ? hideTip() : showTip(it, el); };
    document.body.appendChild(el); badges.push({ it, el });
  });
  positionBadges();
  addEventListener('resize', positionBadges); addEventListener('scroll', positionBadges, true);
  setInterval(positionBadges, 700);  // paneles que cambian de tamaño (chat, widgets)
  document.addEventListener('click', hideTip);
}

// ── recorrido ─────────────────────────────────────────────────────────────
function endTour(done) {
  if (!tour) return;
  if (done) { try { localStorage.setItem('ragraph_tour_' + page, '1'); } catch (e) { /* sin storage: se repetirá */ } }
  tour = null; spot && spot.remove(); spot = null;
  if (bubble) bubble.classList.remove('on', 'tour');
  removeEventListener('keydown', onKey); positionBadges();
}
function onKey(e) {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName)) return;  // no robar Enter al chat
  if (e.key === 'Escape') endTour(true);
  if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); step(tour.i + 1); }
}
function step(i) {
  const steps = tour.steps;
  if (i >= steps.length) return endTour(true);
  tour.i = i;
  const it = steps[i], r = it.center ? null : rectOf(it);
  if (!spot) { spot = document.createElement('div'); spot.className = 'hspot'; document.body.appendChild(spot); }
  const pad = 6;
  Object.assign(spot.style, r
    ? { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' }
    : { left: innerWidth / 2 + 'px', top: innerHeight / 2 + 'px', width: '0px', height: '0px' });
  const b = getBubble();
  b.className = 'hbub tour on';
  b.innerHTML = `<b>${it.title}</b>${it.text}
    <div class="ht-foot"><span class="ht-n">${i + 1} / ${steps.length}</span>
    <button type="button" class="ht-skip">Saltar</button>
    <button type="button" class="ht-next">${i + 1 === steps.length ? 'Listo' : 'Siguiente'}</button></div>`;
  b.querySelector('.ht-skip').onclick = e => { e.stopPropagation(); endTour(true); };
  b.querySelector('.ht-next').onclick = e => { e.stopPropagation(); step(i + 1); };
  place(b, r ? { left: r.left - pad, top: r.top - pad, right: r.right + pad, bottom: r.bottom + pad, width: r.width + pad * 2, height: r.height + pad * 2 } : null, 12);
  b.querySelector('.ht-next').focus();
}
function start(force) {
  let seen = false;
  try { seen = localStorage.getItem('ragraph_tour_' + page) === '1'; } catch (e) { /* sin storage */ }
  if ((seen && !force) || tour) return;
  const steps = items.filter(it => it.tour !== false && (it.center || rectOf(it)));
  if (!steps.length) return;
  hideTip(); tour = { steps, i: 0 }; positionBadges();
  addEventListener('keydown', onKey); step(0);
}
function autoStart() {
  // Esperar a que no esté el aviso de arranque en frío (wakeup.js) y a que la vista se acomode.
  if (document.getElementById('wk')) return setTimeout(autoStart, 500);
  setTimeout(() => start(false), 900);
}

function register(name, list) {
  page = name; items = list;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const init = () => { buildBadges(); autoStart(); };
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', init) : init();
}

window.RAGraphHelp = { register, start };

})();
