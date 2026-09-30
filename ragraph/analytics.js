// analytics.js — lógica única de analytics (detección + consulta + gráfico + spec para Canvas).
// La usan index.html y chat-panel.js; cada vista solo decide dónde y con qué marco renderizar.
// Cargar después de Chart.js y config.js. Expone window.RAGraphAnalytics = { detect, run, render, errorMessage }.
(function () {

const PAL = ['#c8a84b','#7ec8e3','#e87070','#82c882','#b07ae8','#e8b07a','#7ac8e8','#e87ac8','#c8e87a','#e8c87a'];
const GOLD = '#c8a84b', DIM = '#3a3a5a', CARD_BG = '#12121a';

function _esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _scales() {
  return {
    x: { ticks: { color: '#7a7a9a', font: { size: 10 } }, grid: { color: '#2a2a3a' } },
    y: { ticks: { color: '#7a7a9a' }, grid: { color: '#2a2a3a' }, beginAtZero: true },
  };
}
function _hScales() {
  return {
    x: { ticks: { color: '#7a7a9a' }, grid: { color: '#2a2a3a' }, beginAtZero: true },
    y: { ticks: { color: '#c0c0d0', font: { size: 10 } }, grid: { color: '#2a2a3a' } },
  };
}
const _legendRight = { display: true, position: 'right', labels: { color: '#c0c0d0', font: { size: 11 }, boxWidth: 14 } };

const DESC = {
  mentions:   'Menciones por libro — cuántas veces aparece esta entidad en cada uno de los 7 libros. Usá los filtros para comparar el peso de libros específicos.',
  top:        'Ranking top-N — entidades con más menciones en toda la saga, ordenadas de mayor a menor. Refleja la centralidad narrativa de cada personaje.',
  compare:    'Comparativa — evolución de dos entidades a lo largo de los 7 libros. Permite ver en qué libro cada una tuvo mayor protagonismo.',
  proportion: 'Proporción de menciones — participación porcentual de las N entidades más mencionadas. El área de cada porción refleja su peso relativo en la saga.',
  timeline:   'Serie temporal — trayectoria de menciones a lo largo de los 7 libros. Muestra el arco narrativo de un personaje: cuándo surge, alcanza su pico y decae.',
  entityTypes:'Tipos de entidades — distribución del grafo por categoría (Persona, Lugar, Objeto, etc.). Muestra la composición estructural del grafo de conocimiento.',
  relTypes:   'Tipos de vínculos — cuántos vínculos verificados hay de cada tipo (familia, social, institucional, lugares). Cada uno sale de Wikidata, de la wiki de Harry Potter o de una cita literal del libro.',
};

// ── detect ────────────────────────────────────────────────────────────────
const _STOP = /(?:\s+(?:por|en)\s+(?:los\s+|cada\s+)?libros?|\s+a\s+lo\s+largo.*|\?|\.|\s*$)/i;

function detect(prompt) {
  function _trim(s) {
    return s
      .replace(/^(?:(?:ahora\s+)?(?:quiero|quería|quisiera)\s+(?:(?:ver|saber|conocer)\s+)?(?:(?:el|la|los|las|un|una)\s+)?)+/i, '')
      .replace(/^(?:dame\s+(?:el|la|los|las)?\s*)+/i, '')
      .replace(/^(?:(?:y|también)\s+)?(?:el|la|los|las)\s+/i, '')
      .trim();
  }
  // Compare — antes que mentions para evitar falsos positivos
  const cmpRe = [
    /compar(?:ar|[aá](?:me|nos)?)\s+(?:a\s+)?(.+?)\s+(?:y|con|vs\.?)\s+(?:a\s+)?(.+?)(?:\s+por\s+libro|\?|\.|\s*$)/i,
    /(.+?)\s+vs\.?\s+(.+?)(?:\s+por\s+libro|\?|\.|\s*$)/i,
    /(.+?)\s+contra\s+(.+?)(?:\s+por\s+libro|\?|\.|\s*$)/i,
    /comparaci[oó]n.+?entre\s+(?:a\s+)?(.+?)\s+y\s+(?:a\s+)?(.+?)(?:\?|\.|\s*$)/i,
    /comparaci[oó]n\s+(?:de|entre)\s+(.+?)\s+y\s+(.+?)(?:\s+por\s+libro|\?|\.|\s*$)/i,
    /entre\s+(?:a\s+)?(.+?)\s+y\s+(?:a\s+)?(.+?)\s+(?:por\s+libro|en\s+(?:cada|los)\s+libros?|a\s+lo\s+largo)/i,
  ];
  for (const p of cmpRe) {
    const m = prompt.match(p);
    if (m) {
      const a = _trim(m[1].trim().replace(/^a\s+/i, ''));
      const b = _trim(m[2].trim().replace(/^a\s+/i, ''));
      if (a.length >= 2 && b.length >= 2) return { type: 'compare', a, b };
    }
  }
  // Top-N
  const topRe = [
    /top\s*(\d+)\s*(?:personajes?|entidades?)?/i,
    /(\d+)\s*(?:personajes?|entidades?)\s+m[aá]s\s+mencionad[oa]s?/i,
    /ranking\s+(?:de\s+)?(?:personajes?|menciones?)/i,
    /qui[eé]nes?\s+(?:aparecen?|salen?|se\s+mencionan?)\s+m[aá]s/i,
    /m[aá]s\s+mencionad[oa]s?\s+(?:de\s+(?:la\s+)?(?:saga|serie)|del?\s+libros?)/i,
    /top\s+personajes?/i,
  ];
  for (const re of topRe) {
    const m = prompt.match(re);
    if (m) {
      const raw = m[1] ? parseInt(m[1]) : 10;
      return { type: 'top', n: Math.min(isNaN(raw) ? 10 : raw, 20) };
    }
  }
  // Introspection — schema
  const introRe = [
    { re: /qu[eé]\s+tipos?\s+de\s+(?:entidades?|nodos?|personajes?|elementos?)\s+(?:hay|existen)|tipos?\s+de\s+entidades?\s+(?:hay|existen)|qu[eé]\s+clases?\s+de\s+entidades?/i, sub: 'entity-types' },
    { re: /qu[eé]\s+tipos?\s+de\s+relaciones?\s+(?:hay|existen)|tipos?\s+de\s+relaciones?\s+(?:hay|existen)|qu[eé]\s+relaciones?\s+(?:hay|existen)\s+en\s+el\s+grafo/i, sub: 'rel-types' },
    { re: /cu[aá]nta[s]?\s+(?:entidades?|personajes?|nodos?)\s+(?:hay|tiene)|cu[aá]nta[s]?\s+relaciones?\s+(?:hay|tiene)|resumen\s+del\s+grafo|tama[ñn]o\s+del\s+grafo/i, sub: 'summary' },
  ];
  for (const { re, sub } of introRe) {
    if (re.test(prompt)) return { type: 'introspection', sub };
  }
  // Introspection — entity-relations
  const erm = prompt.match(/qu[eé]\s+relaciones?\s+(?:tiene|hay\s+(?:de|para|con))\s+(?:la\s+|el\s+)?(.{2,40}?)\s*\??$/i);
  if (erm) { const e = _trim(erm[1].trim()); if (e.length >= 2) return { type: 'introspection', sub: 'entity-relations', entity: e }; }
  // Proportion donut
  const propRe = [
    /proporci[oó]n\s+de\s+menciones?(?!\s+de\s)/i,
    /distribuci[oó]n\s+de\s+menciones?(?!\s+de\s)/i,
    /distribuci[oó]n\s+(?:proporcional|porcentual)/i,
    /qu[eé]\s+porcentaje\s+(?:de\s+menciones?|del?\s+total|tiene\s+cada)/i,
    /porcentaje\s+de\s+(?:menciones?|fragmentos?)\s+(?:de\s+)?(?:cada|los?|las?)\s+personajes?/i,
    /gr[aá]fico\s+(?:de\s+)?(?:pastel|dona|torta|circular)/i,
    /dona\s+(?:de\s+)?(?:menciones?|personajes?)/i,
  ];
  for (const re of propRe) {
    if (re.test(prompt)) {
      const raw = prompt.match(/top\s*(\d+)/i) || prompt.match(/(\d+)\s*personajes?/i);
      return { type: 'proportion', n: raw ? Math.min(parseInt(raw[1]), 20) : 10 };
    }
  }
  // Timeline
  const tlRe = [
    new RegExp('evoluci[oó]n\\s+de\\s+(?:(?:las?\\s+)?menciones?\\s+(?:de\\s+)?)?(.+?)' + _STOP.source, 'i'),
    new RegExp('trayectoria\\s+de\\s+(.+?)' + _STOP.source, 'i'),
    new RegExp('serie\\s+temporal\\s+de\\s+(.+?)' + _STOP.source, 'i'),
    /c[oó]mo\s+evoluciona\s+(?:a\s+)?(.+?)(?:\s+en\s+los\s+libros?|\s+a\s+lo\s+largo|\?|\.|\s*$)/i,
    /(?:menciones?\s+de\s+)?(.+?)\s+a\s+lo\s+largo\s+de\s+(?:la\s+saga|los\s+libros?)/i,
  ];
  for (const re of tlRe) {
    const m = prompt.match(re);
    if (m) {
      const entity = _trim(m[1].trim().replace(/^a\s+/i, ''));
      if (entity.length >= 2) return { type: 'timeline', entity };
    }
  }
  // Mentions
  const mentRe = [
    new RegExp('cu[aá]ntas?\\s+menciones?\\s+(?:tiene|hay\\s+(?:de|para))\\s+(?:a\\s+)?(.+?)' + _STOP.source, 'i'),
    new RegExp('cu[aá]ntas?\\s+veces\\s+(?:se\\s+)?(?:menciona|aparece|sale)\\s+(?:a\\s+)?(.+?)' + _STOP.source, 'i'),
    new RegExp('variaci[oó]n\\s+(?:de\\s+(?:las?\\s+)?)?menciones?\\s+(?:de\\s+)?(.+?)' + _STOP.source, 'i'),
    new RegExp('menciones?\\s+de\\s+(.+?)' + _STOP.source, 'i'),
    new RegExp('en\\s+qu[eé]\\s+libro\\s+(?:aparece|sale|se\\s+menciona)\\s+m[aá]s\\s+(?:a\\s+)?(.+?)' + _STOP.source, 'i'),
    new RegExp('cu[aá]nto\\s+(?:sale|aparece)\\s+(?:a\\s+)?(.+?)' + _STOP.source, 'i'),
    /(.+?)\s+(?:por\s+libro|en\s+cada\s+libro)(?:\?|\.|\s*$)/i,
  ];
  for (const p of mentRe) {
    const m = prompt.match(p);
    if (m) {
      const entity = m[1].trim().replace(/^a\s+/i, '').replace(/\s+en\s+(?:los\s+)?libros?\s*$/i, '').trim();
      return { type: 'mentions', entity };
    }
  }
  // Catálogo de visualizaciones
  const catalogRe = [
    /qu[eé]\s+(?:widgets?|gr[aá]ficos?|visualizaciones?|tipos?\s+de\s+(?:gr[aá]fico|visual))\s+(?:hay|est[aá]n|puedo\s+(?:pedir|ver|usar|crear))/i,
    /qu[eé]\s+puedo\s+(?:pedir|ver|visualizar|graficar)/i,
    /lista\s+de\s+(?:widgets?|gr[aá]ficos?|visualizaciones?)/i,
    /c[oó]mo\s+(?:pido|pedir|se\s+pide)\s+(?:un\s+)?gr[aá]fico/i,
    /qu[eé]\s+(?:an[aá]lisis|consultas?)\s+(?:puedo\s+hacer|est[aá]n\s+disponibles?)/i,
  ];
  for (const re of catalogRe) { if (re.test(prompt)) return { type: 'catalog' }; }
  return null;
}

// ── run ───────────────────────────────────────────────────────────────────
// Devuelve { html, plain, chart, spec }:
//   html  — resumen ya escapado        plain — texto para historial
//   chart — { type, data, options, tooltip, maxHeight } | null
//   spec  — widget para el Canvas | null
// Errores HTTP: lanza { status }.

async function _get(url) {
  const res = await fetch(apiUrl(url));
  if (!res.ok) throw { status: res.status };
  return res.json();
}

function _result(html, chart, specExtra) {
  const tmp = document.createElement('div'); tmp.innerHTML = html;
  const plain = tmp.textContent.replace(/\s+/g, ' ').trim();
  const spec = chart && specExtra ? {
    id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    chartType: chart.type,
    chartData: JSON.parse(JSON.stringify(chart.data)),
    chartOptions: chart.options,
    text: plain,
    ...specExtra,
  } : null;
  return { html, plain, chart, spec };
}

const _notFound = (what) => _result(`<p>No hay datos de ${what} en el grafo.</p>`, null, null);

function _topChart(d) {
  return { type: 'bar', maxHeight: d.n * 28,
    data: { labels: d.ranking.map(r => r.name), datasets: [{ data: d.ranking.map(r => r.total), backgroundColor: d.ranking.map((_, i) => i === 0 ? GOLD : DIM), borderRadius: 4 }] },
    options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: _hScales() },
    tooltip: { label: item => ` ${item.raw} fragmentos` } };
}

async function run(aq) {
  if (aq.type === 'mentions' || aq.type === 'timeline') {
    const d = await _get(`/api/analytics/mentions?entity=${encodeURIComponent(aq.entity)}`);
    if (!d.found) return _notFound(`<strong>${_esc(aq.entity)}</strong>`);
    const labels = d.by_book.map(b => b.short), counts = d.by_book.map(b => b.count);
    const tooltip = { title: items => d.by_book[items[0].dataIndex].full };
    if (aq.type === 'mentions') {
      let jump = '';
      if (d.max_jump) jump = ` Mayor variación: ${_esc(d.max_jump.from_)} → ${_esc(d.max_jump.to)} (${d.max_jump.pct > 0 ? '+' : ''}${d.max_jump.pct}%).`;
      return _result(
        `<p><strong>${_esc(d.entity)}</strong> aparece en <strong>${d.total}</strong> fragmentos a lo largo de los 7 libros. Pico en <em>${_esc(d.peak_book)}</em> con <strong>${d.peak_count}</strong> fragmentos.${jump}</p>`,
        { type: 'bar', maxHeight: 200, tooltip,
          data: { labels, datasets: [{ data: counts, backgroundColor: counts.map(c => c === d.peak_count ? GOLD : DIM), borderRadius: 4 }] },
          options: { responsive: true, scales: _scales(), plugins: { legend: { display: false } } } },
        { title: `${d.entity} — menciones por libro`, description: DESC.mentions });
    }
    return _result(
      `<p>Trayectoria de <strong>${_esc(d.entity)}</strong> a lo largo de la saga — <strong>${d.total}</strong> fragmentos en total. Pico: <em>${_esc(d.peak_book)}</em> (${d.peak_count} fragmentos).</p>`,
      { type: 'line', maxHeight: 220, tooltip,
        data: { labels, datasets: [{ label: d.entity, data: counts, borderColor: GOLD, backgroundColor: 'rgba(200,168,75,.15)', pointBackgroundColor: counts.map(c => c === d.peak_count ? GOLD : '#555570'), pointRadius: 4, tension: 0.3, fill: true }] },
        options: { responsive: true, scales: _scales(), plugins: { legend: { display: false } } } },
      { title: `Trayectoria de ${d.entity}`, description: DESC.timeline });
  }

  if (aq.type === 'top') {
    const d = await _get(`/api/analytics/top?n=${aq.n}`);
    return _result(`<p>Top ${d.n} entidades más presentes en la saga.</p>`, _topChart(d),
      { title: `Top ${d.n} entidades`, description: DESC.top });
  }

  if (aq.type === 'compare') {
    const d = await _get(`/api/analytics/compare?a=${encodeURIComponent(aq.a)}&b=${encodeURIComponent(aq.b)}`);
    if (!d.found) return _notFound(`<strong>${_esc(aq.a)}</strong> ni <strong>${_esc(aq.b)}</strong>`);
    const winner = d.total_a >= d.total_b ? d.entity_a : d.entity_b;
    return _result(
      `<p><strong>${_esc(d.entity_a)}</strong> (${d.total_a} fragmentos) vs <strong>${_esc(d.entity_b)}</strong> (${d.total_b} fragmentos). Más presente en la saga: <em>${_esc(winner)}</em>.</p>`,
      { type: 'bar', maxHeight: 220, tooltip: { title: items => d.by_book[items[0].dataIndex].full },
        data: { labels: d.by_book.map(b => b.short), datasets: [
          { label: d.entity_a, data: d.by_book.map(b => b.count_a), backgroundColor: GOLD, borderRadius: 4 },
          { label: d.entity_b, data: d.by_book.map(b => b.count_b), backgroundColor: '#7ec8e3', borderRadius: 4 }] },
        options: { responsive: true, scales: _scales(), plugins: { legend: { display: true, labels: { color: '#c0c0d0' } } } } },
      { title: `${d.entity_a} vs ${d.entity_b}`, description: DESC.compare });
  }

  if (aq.type === 'proportion') {
    const d = await _get(`/api/analytics/top?n=${aq.n}`);
    const total = d.ranking.reduce((s, r) => s + r.total, 0);
    return _result(
      `<p>Distribución proporcional — Top ${d.n} entidades (<strong>${total}</strong> fragmentos en total).</p>`,
      { type: 'doughnut', maxHeight: 280, tooltip: { label: item => ` ${item.raw} fragmentos (${Math.round(item.raw / total * 100)}%)` },
        data: { labels: d.ranking.map(r => `${r.name} (${Math.round(r.total / total * 100)}%)`), datasets: [{ data: d.ranking.map(r => r.total), backgroundColor: PAL.slice(0, d.ranking.length), borderColor: CARD_BG, borderWidth: 2 }] },
        options: { responsive: true, plugins: { legend: _legendRight } } },
      { title: `Distribución proporcional — Top ${d.n}`, description: DESC.proportion });
  }

  if (aq.type === 'introspection') {
    if (aq.sub === 'entity-types') {
      const d = await _get('/api/introspection/entity-types');
      return _result(`<p>Tipos de entidades en el corpus HP — <strong>${d.total}</strong> en total.</p>`,
        { type: 'doughnut', maxHeight: 240, tooltip: { label: item => ` ${item.raw} entidades` },
          data: { labels: d.types.map(t => `${t.type} (${t.n})`), datasets: [{ data: d.types.map(t => t.n), backgroundColor: PAL.slice(0, d.types.length), borderColor: CARD_BG, borderWidth: 2 }] },
          options: { responsive: true, plugins: { legend: _legendRight } } },
        { title: 'Tipos de entidades — corpus HP', description: DESC.entityTypes });
    }
    if (aq.sub === 'rel-types') {
      const d = await _get('/api/introspection/relationship-types');
      return _result(`<p>Tipos de vínculos verificados — <strong>${d.total}</strong> en total (familia, social, institucional y lugares).</p>`,
        { type: 'bar', maxHeight: Math.min(d.types.length * 26, 320), tooltip: { label: item => ` ${item.raw} vínculos` },
          data: { labels: d.types.map(t => t.type), datasets: [{ data: d.types.map(t => t.n), backgroundColor: d.types.map((_, i) => i === 0 ? GOLD : DIM), borderRadius: 4 }] },
          options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: _hScales() } },
        { title: 'Tipos de vínculos — corpus HP', description: DESC.relTypes });
    }
    if (aq.sub === 'summary') {
      const d = await _get('/api/introspection/summary');
      return _result(`<p>Resumen del grafo HP:</p><ul style="margin:8px 0 4px 18px;line-height:1.9"><li><strong>${d.entities}</strong> entidades únicas</li><li><strong>${d.vinculos}</strong> vínculos verificados (familia, social, instituciones, lugares)</li><li><strong>${d.semantic_rels}</strong> interacciones extraídas del texto (contexto del chat)</li><li><strong>${d.appearances}</strong> apariciones en fragmentos</li></ul>`, null, null);
    }
    const d = await _get(`/api/introspection/entity-relations?entity=${encodeURIComponent(aq.entity || '')}`);
    if (!d.entity) return _result(`<p>No encontré <strong>${_esc(aq.entity)}</strong> en el grafo.</p>`, null, null);
    if (!d.relations.length) return _result(`<p><strong>${_esc(d.entity)}</strong> no tiene vínculos verificados en el grafo.</p>`, null, null);
    // Todo leído desde la entidad ("madre de Harry Potter"), agrupado por categoría; la fuente va en el tooltip
    const groups = {};
    d.relations.forEach(r => (groups[r.categoria] ||= []).push(r));
    const rows = Object.entries(groups).map(([cat, rs]) =>
      `<p style="margin-top:8px;font-size:.88rem"><span style="color:#c8a84b">${_esc(cat)}:</span> ` +
      rs.map(r => `<span title="${_esc(r.evidencia || '')}">${_esc(r.type)} <strong>${_esc(r.other)}</strong></span>`).join(' · ') + `</p>`).join('');
    return _result(
      `<p>Vínculos de <strong>${_esc(d.entity)}</strong> <span style="opacity:.6">(${_esc(d.type || '')})</span>:</p>${rows}
       <p style="font-size:.72rem;margin-top:8px;opacity:.5">${d.relations.length} vínculos verificados · pasá el mouse para ver la fuente</p>`, null, null);
  }

  if (aq.type === 'catalog') {
    const d = await _get('/api/analytics/top?n=5');
    const row = (color, name, ex) => `<div><span style="color:${color}">▐</span> <strong>${name}</strong> &mdash; <em style="color:#7a7a9a">"${ex}"</em></div>`;
    return _result(
      `<p style="font-weight:600;margin-bottom:10px">Tipos de visualización disponibles:</p>
       <div style="display:flex;flex-direction:column;gap:7px;font-size:.85rem">
         ${row(GOLD, 'Menciones', 'cuántas veces aparece Dumbledore')}
         ${row('#7ec8e3', 'Ranking', 'top 10 personajes')}
         ${row('#82c882', 'Comparativa', 'comparar Harry Potter y Voldemort')}
         ${row('#b07ae8', 'Proporción', 'proporción de menciones')}
         ${row('#e87070', 'Serie temporal', 'serie temporal de Hermione')}
         ${row('#e8b07a', 'Introspección', 'qué tipos de entidades hay')}
       </div>
       <p style="margin-top:12px;font-size:.78rem;color:#7a7a9a">Ejemplo en vivo &mdash; Top 5:</p>`,
      _topChart(d), { title: 'Top 5 entidades (ejemplo)', description: DESC.top });
  }

  throw { status: 400 };
}

// ── render ────────────────────────────────────────────────────────────────
// Escribe el resumen + gráfico dentro de container. El marco (meta, botón Canvas) lo pone cada vista.
function render(container, r) {
  container.innerHTML = r.html + (r.chart ? `<canvas style="margin-top:12px;max-height:${r.chart.maxHeight}px"></canvas>` : '');
  if (!r.chart) return;
  const c = r.chart;
  const options = { ...c.options, plugins: { ...c.options.plugins, tooltip: { callbacks: c.tooltip || {} } } };
  new Chart(container.querySelector('canvas').getContext('2d'), { type: c.type, data: JSON.parse(JSON.stringify(c.data)), options });
}

function errorMessage(e) {
  if (e && e.status === 429) return 'Demasiadas consultas seguidas. Esperá un momento e intentá de nuevo.';
  if (e && e.status) return `Error ${e.status} al consultar el grafo.`;
  return `Error: ${e && e.message ? e.message : 'desconocido'}`;
}

window.RAGraphAnalytics = { detect, run, render, errorMessage };

})();
