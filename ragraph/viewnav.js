// viewnav.js — navegación entre vistas (Chat · Grafo · Canvas): mismo lugar y mismo estilo en las 3 páginas.
// Incluye el botón "?" que relanza el recorrido de ayuda (help.js). Cargar al final del <body>.
(function () {

const css = `
#viewnav { position: fixed; bottom: 16px; left: 16px; display: flex; gap: 8px; z-index: 50;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; }
#viewnav a, #viewnav button {
  background: rgba(4,4,12,0.82); backdrop-filter: blur(16px);
  border: 1px solid rgba(200,168,75,0.32); border-radius: 8px;
  padding: 8px 14px; color: #8a8578; font-size: .8rem; font-family: inherit;
  line-height: 1.2; box-sizing: border-box;  /* no heredar de la página: misma altura en las 3 vistas */
  text-decoration: none; cursor: pointer; transition: color .15s, border-color .15s; }
#viewnav a:hover, #viewnav button:hover { color: #e6dfcf; border-color: #c8a84b; }
#viewnav a.active { color: #c8a84b; border-color: #c8a84b; }
#viewnav button { padding: 8px 12px; font-weight: 700; }
`;
const VIEWS = [
  { href: './', label: 'Chat', match: p => !/(graph|canvas)\.html$/.test(p) },
  { href: 'graph.html', label: 'Grafo', match: p => /graph\.html$/.test(p) },
  { href: 'canvas.html', label: 'Canvas', match: p => /canvas\.html$/.test(p) },
];

const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
const nav = document.createElement('nav'); nav.id = 'viewnav'; nav.setAttribute('aria-label', 'Vistas');
const path = location.pathname;
nav.innerHTML = VIEWS.map(v =>
  `<a href="${v.href}"${v.match(path) ? ' class="active" aria-current="page"' : ''}>${v.label}</a>`).join('') +
  '<button type="button" title="Ayuda: recorrido por esta vista" aria-label="Ayuda">?</button>';
nav.querySelector('button').onclick = () => window.RAGraphHelp && window.RAGraphHelp.start(true);
document.body.appendChild(nav);

})();
