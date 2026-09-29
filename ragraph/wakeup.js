// wakeup.js — aviso "mágico" mientras el backend arranca en frío (Cloud Run escala a cero sin tráfico).
// Consulta /health al cargar: si responde rápido no muestra nada; si tarda, muestra el aviso
// y reintenta hasta que el servidor y Neo4j estén listos. Cargar en el <head>, después de config.js.
(function () {

const SHOW_AFTER_MS = 700;     // si /health responde antes, el usuario no ve nada
const RETRY_EVERY_MS = 1500;
const GIVE_UP_AFTER_MS = 90000;

const css = `
#wk { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(ellipse at center, rgba(20,16,6,.92) 0%, rgba(4,4,10,.97) 70%);
  backdrop-filter: blur(6px); opacity: 0; transition: opacity .6s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color: #e6dfcf; }
#wk.on { opacity: 1; }
#wk .box { text-align: center; max-width: 380px; padding: 0 20px; }
#wk .orb { position: relative; width: 150px; height: 150px; margin: 0 auto 26px; }
#wk .core { position: absolute; inset: 58px; border-radius: 50%; background: #f5e3a3;
  box-shadow: 0 0 18px 6px rgba(200,168,75,.75), 0 0 60px 18px rgba(200,168,75,.35);
  animation: wk-pulse 1.8s ease-in-out infinite; }
#wk .ring { position: absolute; inset: 0; border-radius: 50%; border: 1px dashed rgba(200,168,75,.45);
  animation: wk-spin 14s linear infinite; }
#wk .ring.r2 { inset: 22px; border-style: dotted; border-color: rgba(200,168,75,.3); animation-duration: 9s; animation-direction: reverse; }
#wk .orbit { position: absolute; inset: 0; animation: wk-spin 3.2s linear infinite; }
#wk .orbit i { position: absolute; top: -3px; left: 50%; width: 6px; height: 6px; margin-left: -3px; border-radius: 50%;
  background: #fff4c8; box-shadow: 0 0 10px 3px rgba(245,227,163,.9); }
#wk .orbit.o2 { inset: 30px; animation-duration: 2.1s; animation-direction: reverse; }
#wk .spark { position: absolute; bottom: 40%; width: 3px; height: 3px; border-radius: 50%; background: #f5e3a3;
  box-shadow: 0 0 6px 2px rgba(200,168,75,.8); opacity: 0; animation: wk-rise 2.6s ease-out infinite; }
#wk h2 { font-family: Georgia, 'Times New Roman', serif; font-weight: 400; font-style: italic; font-size: 1.9rem;
  color: #c8a84b; letter-spacing: 1px; text-shadow: 0 0 18px rgba(200,168,75,.55); margin-bottom: 10px; }
#wk p { font-size: .9rem; line-height: 1.55; color: #b8b0a0; }
#wk .t { margin-top: 14px; font-size: .75rem; color: #7a7466; letter-spacing: .5px; }
#wk button { margin-top: 16px; background: #c8a84b; color: #06080f; border: none; border-radius: 8px;
  padding: 8px 18px; font-weight: 600; cursor: pointer; font-family: inherit; }
@keyframes wk-spin { to { transform: rotate(360deg); } }
@keyframes wk-pulse { 50% { transform: scale(1.18); box-shadow: 0 0 26px 10px rgba(200,168,75,.9), 0 0 80px 26px rgba(200,168,75,.4); } }
@keyframes wk-rise { 0% { opacity: 0; transform: translate(0,0) scale(1); } 15% { opacity: 1; }
  100% { opacity: 0; transform: translate(var(--dx), -95px) scale(.3); } }
#wk.nox .core { background: #4a4236; box-shadow: 0 0 10px 2px rgba(200,168,75,.15); animation: none; }
#wk.nox .orbit, #wk.nox .spark { display: none; }
#wk.nox .ring { animation-play-state: paused; opacity: .4; }
@media (prefers-reduced-motion: reduce) { #wk * { animation: none !important; } }
`;

let overlay = null, t0 = performance.now(), timer = null;

function show() {
  if (overlay) return;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const sparks = Array.from({ length: 10 }, (_, i) =>
    `<span class="spark" style="left:${38 + (i * 7) % 26}%;--dx:${(i % 2 ? 1 : -1) * (8 + i * 3)}px;animation-delay:${(i * 0.26).toFixed(2)}s"></span>`
  ).join('');
  overlay = document.createElement('div'); overlay.id = 'wk';
  overlay.setAttribute('role', 'status'); overlay.setAttribute('aria-live', 'polite');
  overlay.innerHTML = `
    <div class="box">
      <div class="orb">
        <div class="ring"></div><div class="ring r2"></div>
        <div class="orbit"><i></i></div><div class="orbit o2"><i></i></div>
        ${sparks}<div class="core"></div>
      </div>
      <h2>Lumos…</h2>
      <p id="wk-msg">El castillo estaba dormido. Como es la primera visita en un rato, el sistema está despertando — en unos segundos se abre.</p>
      <div class="t" id="wk-t"></div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('on'));
  timer = setInterval(() => {
    const el = document.getElementById('wk-t');
    if (el) el.textContent = `${Math.round((performance.now() - t0) / 1000)} s`;
  }, 500);
}

function hide() {
  clearInterval(timer);
  if (!overlay) return;
  document.querySelector('#wk h2').textContent = '¡Listo!';
  overlay.classList.remove('on');
  setTimeout(() => overlay && overlay.remove(), 650);
}

function giveUp() {
  clearInterval(timer);
  overlay.classList.add('nox');
  document.querySelector('#wk h2').textContent = 'Nox';
  document.getElementById('wk-msg').textContent = 'El sistema no respondió a tiempo. Puede que la base de conocimiento esté en mantenimiento.';
  document.getElementById('wk-t').innerHTML = '<button onclick="location.reload()">Reintentar</button>';
}

async function ping() {
  try {
    const res = await fetch(apiUrl('/health'), { cache: 'no-store' });
    if (res.ok && (await res.json()).neo4j) return true;
  } catch (e) { /* servidor todavía arrancando */ }
  return false;
}

async function wake() {
  const showTimer = setTimeout(() => document.body ? show() : addEventListener('DOMContentLoaded', show), SHOW_AFTER_MS);
  while (!(await ping())) {
    if (performance.now() - t0 > GIVE_UP_AFTER_MS) { show(); giveUp(); return; }
    await new Promise(r => setTimeout(r, RETRY_EVERY_MS));
  }
  clearTimeout(showTimer);
  hide();
}

wake();

})();
