/* Ontdek Friesland – kaart, filters, afvinken en planning. Geen build-stap nodig. */
(function () {
  'use strict';

  // ---------- Thema's ----------
  var CATS = [
    { id: 'mus', n: 'Musea', i: '🏛️', c: '#7b4bb7' },
    { id: 'erf', n: 'Erfgoed & monumenten', i: '🏰', c: '#8d5a2b' },
    { id: 'ker', n: 'Kerken & kloosters', i: '⛪', c: '#607089' },
    { id: 'std', n: 'Elf steden', i: '🏙️', c: '#c62828' },
    { id: 'ftn', n: '11Fountains', i: '⛲', c: '#0097a7' },
    { id: 'drp', n: 'Dorpen', i: '🏡', c: '#c9651b' },
    { id: 'nat', n: 'Natuur & nationale parken', i: '🌳', c: '#2e7d32' },
    { id: 'tui', n: 'Tuinen & parken', i: '🌷', c: '#d81b60' },
    { id: 'uit', n: 'Uitzicht & vuurtorens', i: '🔭', c: '#c98a00' },
    { id: 'wan', n: 'Wandelroutes', i: '🥾', c: '#5d4037' },
    { id: 'wad', n: 'Wadlopen', i: '👣', c: '#00796b' },
    { id: 'fie', n: 'Fietsen', i: '🚲', c: '#455a64' },
    { id: 'wat', n: 'Water & varen', i: '⛵', c: '#1565c0' },
    { id: 'str', n: 'Stranden & zwemplekken', i: '🏖️', c: '#ef6c00' },
    { id: 'att', n: 'Attracties & familie', i: '🎡', c: '#e91e63' },
    { id: 'die', n: 'Dieren', i: '🐾', c: '#00838f' },
    { id: 'bin', n: 'Binnen, zwemmen & wellness', i: '🏊', c: '#3949ab' },
    { id: 'spo', n: 'Friese sporten & tradities', i: '🏆', c: '#ad1457' },
    { id: 'evt', n: 'Evenementen', i: '🎪', c: '#6a1b9a' },
    { id: 'eet', n: 'Eten & drinken', i: '🍽️', c: '#bf360c' },
    { id: 'vee', n: 'Veerboten', i: '⛴️', c: '#37474f' }
  ];
  var CAT = {};
  CATS.forEach(function (c, ix) { c.ix = ix; CAT[c.id] = c; });

  var REGIONS = ['Leeuwarden e.o.', 'Noordwest', 'Noordoost', 'Friese Wouden', 'Zuidwest', 'Friese Meren en Gaasterland', 'Zuidoost'];
  var ISLANDS = ['Vlieland', 'Terschelling', 'Ameland', 'Schiermonnikoog'];
  var KIND = { law: 'Lange-afstandsroute', rond: 'Rondwandeling', eiland: 'Eilandwandeling', wad: 'Wadlooproute', fiets: 'Fietsroute' };
  var ROND_COLORS = ['#6a4c93', '#1982c4', '#3a7d44', '#b5651d', '#c44569', '#00809d', '#7a5c00', '#5b5f97'];

  // ---------- Gegevens ----------
  var ITEMS = [];
  (window.FRL_PLACES || []).forEach(function (p) {
    p.flags = p.flags || '';
    ITEMS.push(p);
  });
  var rondIx = 0;
  (window.FRL_ROUTES || []).forEach(function (r) {
    var cat = r.kind === 'wad' ? 'wad' : r.kind === 'fiets' ? 'fie' : 'wan';
    var color = r.color || (r.kind === 'wad' ? '#00796b' : ROND_COLORS[rondIx++ % ROND_COLORS.length]);
    ITEMS.push({
      id: r.id, name: r.name, cat: cat, town: r.town, reg: r.reg, regs: r.regs,
      lat: r.start[0], lon: r.start[1], desc: r.desc, flags: r.flags || '', url: r.url,
      route: r, color: color
    });
  });
  var BY = {};
  ITEMS.forEach(function (it) {
    BY[it.id] = it;
    it._hay = norm([it.name, it.town, it.gem, it.reg, CAT[it.cat].n, it.route ? KIND[it.route.kind] : ''].join(' '));
  });

  // ---------- Opslag ----------
  var KEY = 'ontdek-friesland-v1';
  var S = { visited: {}, plans: {}, custom: [], ui: {} };
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var o = JSON.parse(raw);
      S.visited = o.visited || {}; S.plans = o.plans || {}; S.custom = o.custom || []; S.ui = o.ui || {};
    }
  } catch (e) { /* opslag niet beschikbaar: de app werkt, maar onthoudt niets */ }
  function save() {
    S.ui = { cats: Array.from(F.cats), status: F.status, region: F.region };
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Opslaan lukt niet in deze browser.'); }
  }

  var F = {
    cats: new Set((S.ui.cats || []).filter(function (c) { return CAT[c]; })),
    status: S.ui.status || 'all',
    region: S.ui.region || '',
    q: ''
  };
  var SEL = null;

  // ---------- Hulpjes ----------
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function parseISO(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  var fmtLong = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  var fmtShort = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' });
  var fmtMid = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'long' });
  function dLong(iso) { return fmtLong.format(parseISO(iso)); }
  function dShort(iso) { return fmtShort.format(parseISO(iso)).replace('.', ''); }
  function dMid(iso) { return fmtMid.format(parseISO(iso)); }
  function daysFromToday(iso) { return Math.round((parseISO(iso) - parseISO(todayISO())) / 86400000); }
  function isMobile() { return window.matchMedia('(max-width: 859px)').matches; }
  function kmText(km) { return String(km).replace('.', ',') + ' km'; }
  var toastTimer;
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  function passes(it) {
    if (F.cats.size && !F.cats.has(it.cat)) return false;
    if (F.status === 'todo' && S.visited[it.id]) return false;
    if (F.status === 'done' && !S.visited[it.id]) return false;
    if (F.status === 'plan' && !S.plans[it.id]) return false;
    if (F.region) {
      var regs = it.regs || [it.reg];
      var want = F.region === '__eilanden' ? ISLANDS : [F.region];
      if (!regs.some(function (r) { return want.indexOf(r) >= 0; })) return false;
    }
    if (F.q) {
      var words = F.q.split(/\s+/);
      for (var i = 0; i < words.length; i++) if (words[i] && it._hay.indexOf(words[i]) < 0) return false;
    }
    return true;
  }
  function filtersActive() { return F.cats.size || F.status !== 'all' || F.region || F.q; }

  // ---------- Kaart ----------
  var FRL = L.latLngBounds([52.80, 4.83], [53.53, 6.45]);
  var map = L.map('map', {
    zoomControl: false, minZoom: 8, maxZoom: 19,
    maxBounds: [[50.6, 1.5], [55.6, 9.8]], maxBoundsViscosity: 0.7
  });
  L.control.zoom({ position: 'bottomright', zoomInTitle: 'Inzoomen', zoomOutTitle: 'Uitzoomen' }).addTo(map);
  L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>-bijdragers'
  }).addTo(map);
  map.attributionControl.setPrefix(false);
  map.fitBounds(FRL);

  var routeLayer = L.layerGroup().addTo(map);
  var cluster = L.markerClusterGroup({
    maxClusterRadius: 44, disableClusteringAtZoom: 15, showCoverageOnHover: false,
    spiderfyOnMaxZoom: false, chunkedLoading: true,
    iconCreateFunction: function (c) {
      return L.divIcon({ html: '<div class="clu">' + c.getChildCount() + '</div>', className: '', iconSize: [38, 38] });
    }
  }).addTo(map);

  function pinIcon(it) {
    var cat = CAT[it.cat];
    var cls = 'pinwrap', badge = '';
    if (S.visited[it.id]) { cls += ' done'; badge = '<span class="bdg done">✓</span>'; }
    else if (S.plans[it.id]) { badge = '<span class="bdg plan">' + (+S.plans[it.id].date.slice(8)) + '</span>'; }
    if (it.flags.indexOf('s') >= 0) cls += ' star';
    if (SEL === it.id) cls += ' sel';
    return L.divIcon({
      className: '', iconSize: [34, 42], iconAnchor: [17, 40],
      html: '<div class="' + cls + '"><div class="pin" style="--c:' + (it.color || cat.c) + '"><i>' + cat.i + '</i></div>' + badge + '</div>'
    });
  }

  function routeStyle(it, selected, dimmed) {
    var k = it.route.kind;
    var w = k === 'law' ? 4 : 3.5;
    var st = { color: it.color, weight: selected ? w + 3 : w, opacity: dimmed ? 0.3 : (selected ? 1 : 0.85), lineCap: 'round', lineJoin: 'round' };
    if (k === 'wad') st.dashArray = selected ? '2 12' : '2 9';
    if (k === 'fiets') st.dashArray = selected ? '10 9' : '8 7';
    return st;
  }

  ITEMS.forEach(function (it) {
    it.marker = L.marker([it.lat, it.lon], { icon: pinIcon(it), title: it.name, alt: it.name, riseOnHover: true });
    it.marker.on('click', function () { select(it.id, { from: 'map' }); });
    if (it.route) {
      it.casing = L.polyline(it.route.lines, { color: '#fff', weight: 7, opacity: 0.75, interactive: false, lineCap: 'round' });
      it.line = L.polyline(it.route.lines, Object.assign({ interactive: false }, routeStyle(it, false, false)));
      it.hit = L.polyline(it.route.lines, { color: '#000', weight: 22, opacity: 0, lineCap: 'round' });
      it.hit.on('click', function (ev) { L.DomEvent.stopPropagation(ev); select(it.id, { from: 'line' }); });
      it.hit.bindTooltip(it.name, { sticky: true, direction: 'top', opacity: 0.95 });
      it.group = L.layerGroup([it.casing, it.line, it.hit]);
    }
  });
  map.on('click', function () { if (SEL) deselect(); });

  function refreshMap() {
    var shown = [];
    ITEMS.forEach(function (it) {
      var ok = passes(it) || it.id === SEL;
      it._shown = ok;
      if (ok) shown.push(it.marker);
      if (it.group) {
        if (ok && !routeLayer.hasLayer(it.group)) routeLayer.addLayer(it.group);
        if (!ok && routeLayer.hasLayer(it.group)) routeLayer.removeLayer(it.group);
      }
    });
    cluster.clearLayers();
    cluster.addLayers(shown);
    styleRoutes();
  }
  function styleRoutes() {
    var selRoute = SEL && BY[SEL].route;
    ITEMS.forEach(function (it) {
      if (!it.route) return;
      var sel = it.id === SEL;
      it.line.setStyle(routeStyle(it, sel, selRoute && !sel));
      it.casing.setStyle({ weight: sel ? 12 : 7, opacity: sel ? 1 : (selRoute ? 0.2 : 0.75) });
      if (sel) { it.casing.bringToFront(); it.line.bringToFront(); it.hit.bringToFront(); }
    });
  }
  function refreshIcon(id) { var it = BY[id]; if (it) it.marker.setIcon(pinIcon(it)); }

  function focusPoint(lat, lon, zoom) {
    var z = zoom || map.getZoom();
    var pt = map.project([lat, lon], z);
    var size = map.getSize();
    var off = isMobile() ? L.point(0, size.y * 0.22) : L.point(-200, 0);
    map.flyTo(map.unproject(pt.add(off), z), z, { duration: 0.6 });
  }
  function focusRoute(it) {
    var b = L.latLngBounds([]);
    it.route.lines.forEach(function (l) { b.extend(L.latLngBounds(l)); });
    var size = map.getSize();
    map.flyToBounds(b, {
      paddingTopLeft: isMobile() ? [24, 70] : [420, 30],
      paddingBottomRight: isMobile() ? [24, Math.round(size.y * 0.52) + 16] : [60, 30],
      duration: 0.7, maxZoom: 15
    });
  }

  // ---------- Selecteren ----------
  function select(id, opts) {
    var it = BY[id]; if (!it) return;
    opts = opts || {};
    var prev = SEL; SEL = id;
    if (prev && prev !== id) refreshIcon(prev);
    if (!passes(it) || (prev && prev !== id && !passes(BY[prev]))) refreshMap(); else styleRoutes();
    refreshIcon(id);
    renderDetail();
    if (isMobile() && document.body.dataset.screen !== 'kaart') go('kaart');
    if (it.route) focusRoute(it);
    else if (opts.from === 'map') focusPoint(it.lat, it.lon);
    else focusPoint(it.lat, it.lon, Math.max(map.getZoom(), it.cat === 'std' ? 13 : 15));
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* niet erg */ }
  }
  function deselect() {
    var prev = SEL; SEL = null;
    $('detail').hidden = true;
    if (prev) { refreshIcon(prev); if (!passes(BY[prev])) refreshMap(); else styleRoutes(); }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* niet erg */ }
  }

  function renderDetail() {
    var it = BY[SEL], el = $('detail');
    if (!it) { el.hidden = true; return; }
    var cat = CAT[it.cat], vis = S.visited[it.id], plan = S.plans[it.id], fl = it.flags;
    var h = '<button type="button" class="close" data-act="close" aria-label="Sluiten">×</button>';
    h += '<div class="d-cat" style="--c:' + (it.color || cat.c) + '"><span class="dot"></span>' + cat.i + ' ' + esc(cat.n) + (it.route ? ' · ' + KIND[it.route.kind] : '') + '</div>';
    h += '<h2>' + esc(it.name) + '</h2>';
    var where = [it.town, it.gem && it.gem !== it.town ? 'gemeente ' + it.gem : '', it.route ? it.reg : ''].filter(Boolean).join(' · ');
    h += '<div class="d-where">' + esc(where) + '</div>';
    var b = '';
    if (fl.indexOf('s') >= 0) b += '<span class="badge star">★ Must-see</span>';
    if (fl.indexOf('u') >= 0) b += '<span class="badge unesco">UNESCO-werelderfgoed</span>';
    if (fl.indexOf('k') >= 0) b += '<span class="badge">👪 Leuk met kinderen</span>';
    if (fl.indexOf('g') >= 0) b += '<span class="badge warn">Net over de grens</span>';
    if (fl.indexOf('w') >= 0) b += '<span class="badge warn">Status niet gecontroleerd</span>';
    if (b) h += '<div class="badges">' + b + '</div>';
    if (it.route) {
      h += '<div class="d-facts"><span>Lengte op de kaart: <b>' + kmText(it.route.km) + '</b></span></div>';
    }
    h += '<p class="d-desc">' + esc(it.desc) + '</p>';
    if (it.route && it.route.stages) {
      h += '<details class="stages"><summary>Etappes (' + it.route.stages.length + ')</summary><ol>';
      it.route.stages.forEach(function (s) { h += '<li>' + esc(s[0]) + (s[1] ? ' <span>· ' + kmText(s[1]) + '</span>' : '') + '</li>'; });
      h += '</ol></details>';
    }
    if (it.approx) h += '<p class="d-note">De speld staat in het dorp, niet op het exacte adres.</p>';

    h += '<div class="actions">';
    h += vis
      ? '<button type="button" class="btn done" data-act="visit">✓ ' + (it.route ? 'Gedaan' : 'Bezocht') + ' op ' + esc(dShort(vis)) + ' · ongedaan maken</button>'
      : '<button type="button" class="btn primary" data-act="visit">' + (it.route ? 'Afvinken als gedaan' : 'Afvinken als bezocht') + '</button>';
    h += '<div class="planbox' + (plan ? ' has' : '') + '">';
    h += '<h3>' + (plan ? '📅 Gepland op ' + esc(dLong(plan.date)) : '📅 Inplannen') + '</h3>';
    h += '<div class="formrow">';
    h += '<label class="sr" for="planDate">Datum</label><input id="planDate" type="date" value="' + esc(plan ? plan.date : '') + '">';
    h += '<label class="sr" for="planNote">Notitie</label><input id="planNote" type="text" maxlength="120" placeholder="Notitie, bv. met wie of hoe laat" value="' + esc(plan ? plan.note || '' : '') + '">';
    h += '<div class="btnrow"><button type="button" class="btn small primary" data-act="plan-save">' + (plan ? 'Bijwerken' : 'Inplannen') + '</button>';
    if (plan) h += '<button type="button" class="btn small" data-act="plan-del">Plan verwijderen</button>';
    h += '</div></div></div>';
    h += '</div>';

    h += '<div class="links">';
    if (it.route) h += '<button type="button" class="btn small" data-act="fit">Toon hele route</button>';
    if (it.url) h += '<a class="btn small" href="' + esc(it.url) + '" target="_blank" rel="noopener">Website</a>';
    h += '<a class="btn small" href="https://www.google.com/maps/dir/?api=1&destination=' + it.lat + ',' + it.lon + '" target="_blank" rel="noopener">' + (it.route ? 'Route naar startpunt' : 'Route ernaartoe') + '</a>';
    h += '<a class="btn small" href="https://www.google.com/search?q=' + encodeURIComponent(it.name.replace(/\s*\(.*?\)\s*/g, ' ').trim() + ' ' + (it.town || 'Friesland')) + '" target="_blank" rel="noopener">Meer info zoeken</a>';
    h += '</div>';
    el.innerHTML = h;
    el.hidden = false;
    el.scrollTop = 0;
  }

  // ---------- Afvinken en plannen ----------
  function toggleVisit(id) {
    var it = BY[id];
    if (S.visited[id]) { delete S.visited[id]; toast('Vinkje weggehaald'); }
    else {
      S.visited[id] = todayISO();
      if (S.plans[id]) { delete S.plans[id]; toast('Afgevinkt en uit de planning gehaald'); }
      else toast(it.route ? 'Afgevinkt als gedaan' : 'Afgevinkt als bezocht');
    }
    afterChange(id);
  }
  function savePlan(id, date, note) {
    if (!date) { toast('Kies eerst een datum'); var d = $('planDate'); if (d) d.focus(); return; }
    S.plans[id] = { date: date, note: (note || '').trim() };
    toast('Ingepland op ' + dMid(date));
    afterChange(id);
  }
  function afterChange(id) {
    save();
    if (id) refreshIcon(id);
    if (F.status !== 'all') refreshMap();
    if (SEL) renderDetail();
    renderList(); renderCats(); renderPlan(); renderProgress();
  }

  // ---------- Lijst en filters ----------
  function counts() {
    var c = {};
    CATS.forEach(function (k) { c[k.id] = { n: 0, v: 0 }; });
    ITEMS.forEach(function (it) { c[it.cat].n++; if (S.visited[it.id]) c[it.cat].v++; });
    return c;
  }
  function renderCats() {
    var c = counts(), h = '', ch = '';
    CATS.forEach(function (k) {
      var on = F.cats.has(k.id);
      h += '<button type="button" class="cat' + (on ? ' on' : '') + '" style="--c:' + k.c + '" data-act="cat" data-cat="' + k.id + '" aria-pressed="' + on + '">' +
        '<span class="ico">' + k.i + '</span><span>' + esc(k.n) + '</span><small>' + c[k.id].v + '/' + c[k.id].n + '</small></button>';
      ch += '<button type="button" class="chip' + (on ? ' on' : '') + '" data-act="cat" data-cat="' + k.id + '" aria-pressed="' + on + '">' + k.i + ' ' + esc(k.n) + '</button>';
    });
    var grid = $('catGrid');
    grid.innerHTML = h;
    grid.classList.toggle('filtered', F.cats.size > 0);
    $('catsAll').hidden = !F.cats.size;
    var allOn = !F.cats.size;
    $('chips').innerHTML = '<button type="button" class="chip" data-act="search" aria-label="Zoeken">🔍 Zoek</button>' +
      '<button type="button" class="chip' + (allOn ? ' on' : '') + '" data-act="cats-all">Alles</button>' + ch;
  }
  function renderList() {
    var rows = ITEMS.filter(passes);
    rows.sort(function (a, b) {
      return (CAT[a.cat].ix - CAT[b.cat].ix) ||
        ((b.flags.indexOf('s') >= 0) - (a.flags.indexOf('s') >= 0)) ||
        a.name.localeCompare(b.name, 'nl');
    });
    $('resultCount').textContent = rows.length + (rows.length === 1 ? ' plek' : ' plekken') + (filtersActive() ? ' gevonden' : '');
    $('resetBtn').hidden = !filtersActive();
    if (!rows.length) {
      $('list').innerHTML = '<p class="empty">Niets gevonden met deze filters. Kies een ander thema of wis de filters.</p>';
      return;
    }
    var h = '', last = null;
    rows.forEach(function (it) {
      var cat = CAT[it.cat];
      if (it.cat !== last) { h += '<div class="grp">' + cat.i + ' ' + esc(cat.n) + '</div>'; last = it.cat; }
      var vis = S.visited[it.id], plan = S.plans[it.id];
      var st = vis ? '<span class="st done">✓ ' + esc(dShort(vis)) + '</span>' : plan ? '<span class="st plan">' + esc(dShort(plan.date)) + '</span>' : '';
      var sub = [it.town, it.route ? kmText(it.route.km) : ''].filter(Boolean).join(' · ');
      h += '<button type="button" class="row' + (vis ? ' done' : '') + '" style="--c:' + (it.color || cat.c) + '" data-act="sel" data-id="' + it.id + '">' +
        '<span class="ico">' + cat.i + '</span><span><span class="rn">' + esc(it.name) + (it.flags.indexOf('s') >= 0 ? ' <span class="star-s" title="Must-see">★</span>' : '') + '</span><span class="rs">' + esc(sub) + '</span></span>' + st + '</button>';
    });
    $('list').innerHTML = h;
  }
  function renderStatus() {
    document.querySelectorAll('.seg button').forEach(function (b) { b.classList.toggle('on', b.dataset.status === F.status); });
  }
  function buildRegionSelect() {
    var h = '<option value="">Heel Friesland</option><optgroup label="Vasteland">';
    REGIONS.forEach(function (r) { h += '<option>' + esc(r) + '</option>'; });
    h += '</optgroup><optgroup label="Waddeneilanden"><option value="__eilanden">Alle eilanden</option>';
    ISLANDS.forEach(function (r) { h += '<option>' + esc(r) + '</option>'; });
    h += '</optgroup><option>Net over de grens</option>';
    var sel = $('region'); sel.innerHTML = h; sel.value = F.region;
    if (sel.value !== F.region) { F.region = ''; sel.value = ''; }
  }
  function applyFilters() {
    save(); refreshMap(); renderCats(); renderList(); renderStatus();
  }

  // ---------- Planning ----------
  function renderPlan() {
    var today = todayISO(), entries = [];
    Object.keys(S.plans).forEach(function (id) {
      var it = BY[id]; if (!it) return;
      entries.push({ id: id, it: it, date: S.plans[id].date, note: S.plans[id].note });
    });
    S.custom.forEach(function (c) { entries.push({ custom: c, date: c.date, note: '' }); });
    entries.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var upcoming = entries.filter(function (e) { return e.date >= today; });
    var past = entries.filter(function (e) { return e.date < today; }).reverse();

    var n = upcoming.length;
    $('tabPlanCount').hidden = !n; $('tabPlanCount').textContent = n;
    $('navPlanDot').hidden = !n;

    function block(list, isPast) {
      var h = '', lastDate = null;
      list.forEach(function (e) {
        if (e.date !== lastDate) {
          if (lastDate) h += '</div>';
          var diff = daysFromToday(e.date);
          var rel = diff === 0 ? 'vandaag' : diff === 1 ? 'morgen' : diff > 1 ? 'over ' + diff + ' dagen' : diff === -1 ? 'gisteren' : (-diff) + ' dagen geleden';
          h += '<div class="day' + (isPast ? ' past' : '') + '"><h3>' + esc(dLong(e.date)) + ' <small>' + rel + '</small></h3>';
          lastDate = e.date;
        }
        if (e.custom) {
          h += '<div class="pitem"><span class="ico">📝</span><div><div class="pn">' + esc(e.custom.text) + '</div><div class="ps">Eigen plan</div>' +
            '<div class="btnrow"><button type="button" class="btn small" data-act="custom-del" data-id="' + esc(e.custom.id) + '">' + (isPast ? 'Opruimen' : 'Verwijderen') + '</button></div></div></div>';
        } else {
          var cat = CAT[e.it.cat];
          h += '<div class="pitem" style="--c:' + (e.it.color || cat.c) + '"><span class="ico">' + cat.i + '</span><div>' +
            '<button type="button" class="pn" data-act="sel" data-id="' + e.id + '">' + esc(e.it.name) + '</button>' +
            '<div class="ps">' + esc([cat.n, e.it.town].filter(Boolean).join(' · ')) + (e.note ? '<br>' + esc(e.note) : '') + '</div>' +
            '<div class="btnrow"><button type="button" class="btn small primary" data-act="plan-done" data-id="' + e.id + '">✓ Gedaan</button>' +
            '<button type="button" class="btn small" data-act="sel" data-id="' + e.id + '">Op de kaart</button>' +
            '<button type="button" class="btn small" data-act="plan-del" data-id="' + e.id + '">Verwijderen</button></div></div></div>';
        }
      });
      if (lastDate) h += '</div>';
      return h;
    }
    var h = '';
    if (!entries.length) {
      h = '<p class="empty">Nog niets gepland. Tik op een plek op de kaart, kies een datum en druk op <strong>Inplannen</strong>.</p>';
    } else {
      if (upcoming.length) h += '<div class="sect">Komende plannen</div>' + block(upcoming, false);
      if (past.length) h += '<div class="sect">Datum voorbij</div>' + block(past, true);
    }
    $('planList').innerHTML = h;
  }

  // ---------- Voortgang ----------
  function renderProgress() {
    var c = counts(), tot = 0, vis = 0;
    CATS.forEach(function (k) { tot += c[k.id].n; vis += c[k.id].v; });
    var pct = tot ? Math.round(vis / tot * 100) : 0;
    $('brandProgress').textContent = vis ? vis + ' van ' + tot + ' afgevinkt' : tot + ' plekken en routes om te ontdekken';
    var h = '<div class="card"><h2>Jouw voortgang</h2><div class="bigstat"><b>' + vis + '</b><span>van ' + tot + ' afgevinkt (' + pct + '%)</span></div>' +
      '<div class="bar"><i style="width:' + pct + '%"></i></div></div><div class="card"><h2>Per thema</h2>';
    CATS.forEach(function (k) {
      var p = c[k.id].n ? c[k.id].v / c[k.id].n * 100 : 0;
      h += '<button type="button" class="prow" data-act="cat-only" data-cat="' + k.id + '"><span>' + k.i + '</span><span class="pm">' + esc(k.n) +
        '<span class="bar"><i style="width:' + p + '%;--c:' + k.c + '"></i></span></span><small>' + c[k.id].v + ' / ' + c[k.id].n + '</small></button>';
    });
    h += '</div>';
    $('progress').innerHTML = h;
  }

  // ---------- Schermen ----------
  function go(v) {
    var body = document.body;
    body.dataset.screen = v;
    if (v !== 'kaart') body.dataset.side = v;
    document.querySelectorAll('#bottomnav button').forEach(function (b) { b.classList.toggle('on', b.dataset.go === v); });
    document.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('on', b.dataset.go === body.dataset.side); });
    if (v !== 'kaart') $('side').scrollTop = 0;
  }

  // ---------- Back-up ----------
  function exportData() {
    var data = { app: 'ontdek-friesland', versie: 1, opgeslagen: new Date().toISOString(), visited: S.visited, plans: S.plans, custom: S.custom };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ontdek-friesland-backup-' + todayISO() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('Back-up opgeslagen in je downloads');
  }
  function importData(file) {
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var o = JSON.parse(rd.result);
        if (!o || o.app !== 'ontdek-friesland') throw new Error('x');
        S.visited = o.visited || {}; S.plans = o.plans || {}; S.custom = o.custom || [];
        save(); refreshAll();
        toast('Back-up teruggezet');
      } catch (e) { toast('Dit bestand is geen back-up van deze app.'); }
    };
    rd.readAsText(file);
  }
  function refreshAll() {
    ITEMS.forEach(function (it) { it.marker.setIcon(pinIcon(it)); });
    refreshMap(); renderCats(); renderList(); renderPlan(); renderProgress(); renderStatus();
    if (SEL) renderDetail();
  }

  // ---------- Mijn locatie ----------
  var meMarker = null;
  map.on('locationfound', function (e) {
    if (!meMarker) meMarker = L.marker(e.latlng, { icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), interactive: false, zIndexOffset: 1000 }).addTo(map);
    else meMarker.setLatLng(e.latlng);
    $('locate').classList.add('active');
    map.flyTo(e.latlng, Math.max(map.getZoom(), 13), { duration: 0.6 });
  });
  map.on('locationerror', function () { toast('Je locatie is niet beschikbaar. Sta locatietoegang toe in je browser.'); });

  // ---------- Bediening ----------
  var wipeArmed = false;
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-act]'); if (!t) return;
    var act = t.dataset.act, id = t.dataset.id;
    switch (act) {
      case 'go': go(t.dataset.go); break;
      case 'sel': select(id); break;
      case 'close': deselect(); break;
      case 'visit': toggleVisit(SEL); break;
      case 'plan-save': savePlan(SEL, $('planDate').value, $('planNote').value); break;
      case 'plan-del': {
        var pid = id || SEL;
        delete S.plans[pid]; toast('Plan verwijderd'); afterChange(pid); break;
      }
      case 'plan-done': {
        S.visited[id] = todayISO(); delete S.plans[id]; toast('Afgevinkt'); afterChange(id); break;
      }
      case 'custom-del': {
        S.custom = S.custom.filter(function (c) { return c.id !== id; }); save(); renderPlan(); break;
      }
      case 'fit': if (SEL && BY[SEL].route) focusRoute(BY[SEL]); break;
      case 'cat': {
        ev.preventDefault();
        var c = t.dataset.cat;
        if (F.cats.has(c)) F.cats.delete(c); else F.cats.add(c);
        applyFilters(); break;
      }
      case 'cat-only': F.cats = new Set([t.dataset.cat]); applyFilters(); go('lijst'); break;
      case 'cats-all': ev.preventDefault(); F.cats.clear(); applyFilters(); break;
      case 'status': F.status = t.dataset.status; applyFilters(); break;
      case 'reset':
        F.cats.clear(); F.status = 'all'; F.region = ''; F.q = ''; $('q').value = ''; $('region').value = '';
        applyFilters(); break;
      case 'search': go('lijst'); setTimeout(function () { $('q').focus(); }, 50); break;
      case 'locate': map.locate({ enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }); break;
      case 'home': map.flyToBounds(FRL, { duration: 0.6 }); break;
      case 'export': exportData(); break;
      case 'import': $('importFile').click(); break;
      case 'wipe':
        if (!wipeArmed) {
          wipeArmed = true; t.textContent = 'Weet je het zeker? Tik nog een keer om alles te wissen';
          setTimeout(function () { wipeArmed = false; t.textContent = 'Alles wissen'; }, 5000);
        } else {
          wipeArmed = false; t.textContent = 'Alles wissen';
          S.visited = {}; S.plans = {}; S.custom = []; save(); refreshAll(); toast('Alle vinkjes en plannen zijn gewist');
        }
        break;
    }
  });
  $('q').addEventListener('input', function () { F.q = norm(this.value.trim()); refreshMap(); renderList(); });
  $('region').addEventListener('change', function () { F.region = this.value; applyFilters(); });
  $('importFile').addEventListener('change', function () { if (this.files[0]) importData(this.files[0]); this.value = ''; });
  $('customForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var d = $('customDate').value, txt = $('customText').value.trim();
    if (!d || !txt) return;
    S.custom.push({ id: 'c' + Date.now().toString(36), date: d, text: txt });
    $('customText').value = '';
    save(); renderPlan(); toast('Toegevoegd op ' + dMid(d));
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && SEL) deselect();
    if (ev.key === 'Enter' && ev.target && ev.target.id === 'planNote') savePlan(SEL, $('planDate').value, $('planNote').value);
  });
  window.addEventListener('resize', function () { map.invalidateSize(); });

  // ---------- Start ----------
  buildRegionSelect();
  $('customDate').value = todayISO();
  if (window.matchMedia('(max-width: 859px)').matches) $('themes').open = true;
  refreshAll();
  go('kaart');
  var start = decodeURIComponent((location.hash || '').slice(1));
  if (start && BY[start]) setTimeout(function () { select(start); }, 300);

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline gebruik is een extraatje */ });
  }
})();
