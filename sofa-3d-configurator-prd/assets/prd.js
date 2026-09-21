/* PRD interactive prototypes — all data is demo data */
(function () {
  'use strict';

  /* ============ shared ============ */
  var toastEl = document.getElementById('toast');
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }
  function fmt(v, sym) { return sym + v.toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
  function on(sel, ev, fn, root) { (root || document).addEventListener(ev, function (e) { var el = e.target.closest(sel); if (el) fn(el, e); }); }
  function setActive(container, el) {
    container.querySelectorAll('.is-active').forEach(function (n) { n.classList.remove('is-active'); });
    el.classList.add('is-active');
  }

  var COLORS = [
    { id: 'bone', hex: '#E8E1D6', name: 'Bone' },
    { id: 'fog', hex: '#B9C0C4', name: 'Fog' },
    { id: 'sage', hex: '#9AA68F', name: 'Sage' },
    { id: 'terra', hex: '#C07A5C', name: 'Terracotta' },
    { id: 'charcoal', hex: '#4A4A4D', name: 'Charcoal' },
    { id: 'navy', hex: '#37455C', name: 'Navy' }
  ];

  /* ============ 5.1 PLP ============ */
  var PRODUCTS = [
    { id: 1, name: 'Harper Cloud Modular', sub: '3–6 seats · modular', from: 1890, c: '#b9a48d', style: 'modern', min: 3, max: 6, feats: ['power'], tags: ['Modular', 'Power option'] },
    { id: 2, name: 'Oakford Reclining', sub: 'Power sectional · leather', from: 2650, c: '#6e5d4d', style: 'classic', min: 4, max: 5, feats: ['power', 'leather'], tags: ['Power', 'Leather'] },
    { id: 3, name: 'Linen Lounge', sub: 'Compact 3-seater', from: 1490, c: '#d8cfc0', style: 'modern', min: 3, max: 3, feats: [], tags: ['Compact', 'Fabric'] },
    { id: 4, name: 'Terra Performance', sub: 'Pet-friendly modular', from: 1980, c: '#c07a5c', style: 'modern', min: 3, max: 6, feats: ['pet'], tags: ['Pet-friendly', 'Performance'] },
    { id: 5, name: 'Grand Corner', sub: '6-seat leather corner', from: 3200, c: '#4a4a4d', style: 'classic', min: 6, max: 6, feats: ['leather'], tags: ['Leather', 'Large'] },
    { id: 6, name: 'Studio Armless Set', sub: '2–4 seat build-your-own', from: 1240, c: '#9aa68f', style: 'modern', min: 2, max: 4, feats: [], tags: ['Small space', 'Modular'] }
  ];
  var FX = { USD: { rate: 1, sym: '$' }, EUR: { rate: 0.92, sym: '€' }, GBP: { rate: 0.79, sym: '£' }, CAD: { rate: 1.36, sym: 'C$' }, AUD: { rate: 1.52, sym: 'A$' } };
  var plpFilters = {};
  var plpCurrency = 'USD';

  function renderPlp() {
    var grid = document.getElementById('plp-grid');
    if (!grid) return;
    var list = PRODUCTS.filter(function (p) {
      if (plpFilters.style && p.style !== plpFilters.style) return false;
      if (plpFilters.seats === 's4' && p.min > 4) return false;
      if (plpFilters.seats === 's5' && p.max < 5) return false;
      if (plpFilters.feat && p.feats.indexOf(plpFilters.feat) < 0) return false;
      return true;
    });
    var sort = document.getElementById('plp-sort').value;
    if (sort.indexOf('Low') >= 0) list.sort(function (a, b) { return a.from - b.from; });
    if (sort.indexOf('High') >= 0) list.sort(function (a, b) { return b.from - a.from; });
    var fx = FX[plpCurrency];
    if (!list.length) {
      grid.innerHTML = '<div class="plp-empty">No collections match these filters.<br><button class="p-btn p-btn--sm" style="margin-top:10px" id="plp-clear">Clear all filters</button></div>';
      var clr = document.getElementById('plp-clear');
      clr.onclick = function () { plpFilters = {}; document.querySelectorAll('.plp-filter').forEach(function (c) { c.classList.remove('is-active'); }); renderPlp(); };
      return;
    }
    grid.innerHTML = list.map(function (p) {
      var price = Math.round(p.from * fx.rate);
      return '<div class="plp-card"><div class="plp-img" style="--sofa:' + p.c + '"><span class="plp-badge">Bestseller</span><div class="plp-sofa"></div></div>' +
        '<div class="plp-info"><div class="plp-name">' + p.name + '</div><div class="plp-sub">' + p.sub + '</div>' +
        '<div class="plp-price">' + fmt(price, fx.sym) + ' <span>and up · made to order</span></div>' +
        '<div class="plp-tags">' + p.tags.map(function (t) { return '<span class="p-tag">' + t + '</span>'; }).join('') + '</div></div></div>';
    }).join('');
  }
  document.querySelectorAll('.plp-filter').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var g = chip.dataset.group, v = chip.dataset.value;
      var groupChips = document.querySelectorAll('.plp-filter[data-group="' + g + '"]');
      if (plpFilters[g] === v) { delete plpFilters[g]; chip.classList.remove('is-active'); }
      else { plpFilters[g] = v; groupChips.forEach(function (c) { c.classList.remove('is-active'); }); chip.classList.add('is-active'); }
      renderPlp();
    });
  });
  var sortEl = document.getElementById('plp-sort');
  if (sortEl) sortEl.addEventListener('change', renderPlp);
  var plpCur = document.getElementById('plp-currency');
  if (plpCur) plpCur.addEventListener('change', function () {
    var map = { 'USD $': 'USD', 'EUR €': 'EUR', 'GBP £': 'GBP', 'CAD $': 'CAD', 'AUD $': 'AUD' };
    plpCurrency = map[this.value] || 'USD'; renderPlp();
  });
  renderPlp();

  /* ============ 5.2 PDP ============ */
  var pdpSw = document.getElementById('pdp-swatches');
  if (pdpSw) {
    pdpSw.innerHTML = COLORS.map(function (c, i) {
      return '<div class="pdp-sw' + (i === 2 ? ' is-active' : '') + '" data-hex="' + c.hex + '" title="' + c.name + '" style="background:' + c.hex + '"></div>';
    }).join('');
    pdpSw.addEventListener('click', function (e) {
      var sw = e.target.closest('.pdp-sw'); if (!sw) return;
      setActive(pdpSw, sw);
      document.getElementById('pdp-main').style.setProperty('--sofa', sw.dataset.hex);
    });
  }
  on('.pdp-thumb', 'click', function (el) {
    setActive(document.querySelector('.pdp-thumbs'), el);
    document.getElementById('pdp-view-label').textContent = el.dataset.view;
  });
  var pdpSave = document.getElementById('pdp-save');
  if (pdpSave) pdpSave.addEventListener('click', function () { toast('Saved to your wishlist (demo)'); });
  var pdpSwatchBtn = document.getElementById('pdp-swatch-btn');
  if (pdpSwatchBtn) pdpSwatchBtn.addEventListener('click', function () { toast('Free swatch request form opened — up to 6, shipped free (demo)'); });

  /* ============ 5.3 Configurator ============ */
  var MOD = {
    laf:     { w: 33, d: 37, price: 620, seat: true,  terminal: true,  power: true,  name: 'LAF seat',       short: 'LAF', cls: '' },
    raf:     { w: 33, d: 37, price: 620, seat: true,  terminal: true,  power: true,  name: 'RAF seat',       short: 'RAF', cls: '' },
    arm:     { w: 24, d: 37, price: 480, seat: true,  terminal: false, power: true,  name: 'Armless seat',   short: 'ARM', cls: '' },
    corner:  { w: 37, d: 37, price: 540, seat: false, terminal: false, power: false, name: 'Corner',          short: 'CRN', cls: 'is-corner' },
    chaise:  { w: 37, d: 63, price: 720, seat: true,  terminal: true,  power: false, name: 'Chaise',          short: 'CHS', cls: 'is-chaise' },
    console: { w: 12, d: 37, price: 360, seat: false, terminal: false, power: false, name: 'Storage console', short: 'CON', cls: 'is-console' },
    ottoman: { w: 30, d: 24, price: 320, seat: false, terminal: true,  power: false, name: 'Ottoman',         short: 'OTT', cls: '' }
  };
  var TPL = {
    l4:    [{ t: 'laf' }, { t: 'arm' }, { t: 'corner' }, { t: 'arm' }, { t: 'raf' }],
    c5:    [{ t: 'laf' }, { t: 'arm' }, { t: 'arm' }, { t: 'chaise' }],
    power: [{ t: 'laf' }, { t: 'arm', power: true }, { t: 'console' }, { t: 'corner' }, { t: 'arm', power: true }, { t: 'raf' }]
  };
  var cfg = {
    modules: TPL.l4.map(function (m) { return { t: m.t, power: !!m.power }; }),
    color: '#9AA68F',
    grade: 1.0,
    legs: 0,
    currency: 'USD',
    selected: null,
    rot: 0,
    zoom: 1
  };
  var cfgRun = document.getElementById('cfg-run');

  // inject RAF add button
  (function () {
    var add = document.getElementById('cfg-add');
    if (!add) return;
    var btn = document.createElement('button');
    btn.dataset.add = 'raf'; btn.textContent = 'RAF seat';
    add.appendChild(btn);
  })();

  function dims(mods) {
    var ci = -1, i;
    for (i = 0; i < mods.length; i++) if (mods[i].t === 'corner') { ci = i; break; }
    var W, D;
    if (ci >= 0) {
      W = 0; for (i = 0; i <= ci; i++) W += MOD[mods[i].t].w;
      var post = 0; for (i = ci + 1; i < mods.length; i++) post += MOD[mods[i].t].w;
      D = 37 + post;
    } else {
      W = 0; for (i = 0; i < mods.length; i++) W += MOD[mods[i].t].w;
      D = mods.some(function (m) { return m.t === 'chaise'; }) ? 63 : 37;
    }
    return { W: W, D: D };
  }
  function validate(mods) {
    var errs = [];
    var count = function (t) { return mods.filter(function (m) { return m.t === t; }).length; };
    var seats = mods.filter(function (m) { return MOD[m.t].seat; }).length;
    if (mods.length < 2 || seats < 2) errs.push('A sectional needs at least 2 seat modules.');
    if (mods.length) {
      var first = MOD[mods[0].t], last = MOD[mods[mods.length - 1].t];
      if (!first.terminal) errs.push('Left end needs a terminal module (LAF seat or chaise). Console/corner cannot end a run.');
      if (!last.terminal) errs.push('Right end needs a terminal module (RAF seat, chaise or ottoman).');
    }
    if (count('corner') > 1) errs.push('Only 1 corner module is allowed per configuration.');
    if (count('chaise') > 1) errs.push('Only 1 chaise module is allowed per configuration.');
    if (count('console') > 2) errs.push('Up to 2 console modules per configuration.');
    var d = dims(mods);
    if (d.W > 160 || d.D > 160) errs.push('Overall size exceeds the 160" production limit for this series.');
    return errs;
  }
  function priceOf() {
    var base = 0, powerSeats = 0;
    cfg.modules.forEach(function (m) {
      base += MOD[m.t].price;
      if (m.power && MOD[m.t].power) { base += 280; powerSeats++; }
    });
    return { total: Math.round(base * cfg.grade + cfg.legs), powerSeats: powerSeats };
  }

  function renderCfg() {
    if (!cfgRun) return;
    cfgRun.innerHTML = cfg.modules.map(function (m, i) {
      var meta = MOD[m.t];
      var wpx = Math.max(34, meta.w * 2.2 + 10);
      var hpx = m.t === 'chaise' ? 104 : 48;
      return '<div class="cfg-mod ' + meta.cls + (cfg.selected === i ? ' is-selected' : '') + '" data-i="' + i +
        '" style="width:' + wpx + 'px;height:' + hpx + 'px" title="' + meta.name + '">' +
        (m.power ? '<span class="pwr">PWR</span>' : '') + meta.short + '</div>';
    }).join('');
    cfgRun.style.setProperty('--sofa', cfg.color);
    cfgRun.style.transform = 'rotate(' + cfg.rot + 'deg) scale(' + cfg.zoom + ')';

    var d = dims(cfg.modules);
    document.getElementById('cfg-dims').textContent = d.W + '"W × ' + d.D + '"D';

    // selected module panel
    var info = document.getElementById('cfg-sel-info');
    if (cfg.selected == null || !cfg.modules[cfg.selected]) {
      info.innerHTML = 'No module selected';
    } else {
      var m = cfg.modules[cfg.selected], meta = MOD[m.t];
      var html = '<div style="font-weight:600;color:#2a211c;margin-bottom:5px">' + meta.name + '</div>' +
        '<div style="color:#8a7c70;margin-bottom:7px">' + meta.w + '"W × ' + meta.d + '"D · $' + meta.price + '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap">';
      if (meta.power) html += '<button class="p-btn p-btn--sm" id="cfg-pwr">' + (m.power ? 'Remove power −$280' : 'Add power +$280') + '</button>';
      html += '<button class="p-btn p-btn--sm" id="cfg-del">Delete</button></div>';
      info.innerHTML = html;
      document.getElementById('cfg-del').onclick = function () { cfg.modules.splice(cfg.selected, 1); cfg.selected = null; renderCfg(); };
      var pwr = document.getElementById('cfg-pwr');
      if (pwr) pwr.onclick = function () { m.power = !m.power; renderCfg(); };
    }

    // warnings
    var errs = validate(cfg.modules);
    var wbox = document.getElementById('cfg-warnings');
    document.getElementById('cfg-warn-list').innerHTML = errs.map(function (e) { return '<li>' + e + '</li>'; }).join('');
    wbox.classList.toggle('has', errs.length > 0);
    document.getElementById('cfg-addcart').disabled = errs.length > 0;

    // price
    var p = priceOf();
    var fx = FX[cfg.currency];
    document.getElementById('cfg-total').firstChild.textContent = fmt(Math.round(p.total * fx.rate), fx.sym);
    var gradeLabel = document.getElementById('cfg-grade').selectedOptions[0].text.split(' —')[0];
    var summary = cfg.modules.length + ' modules · ' + gradeLabel + (p.powerSeats ? ' · ' + p.powerSeats + ' power seat' + (p.powerSeats > 1 ? 's' : '') : '');
    document.getElementById('cfg-summary').textContent = summary;
  }

  if (cfgRun) {
    // templates
    document.querySelectorAll('.cfg-tpl').forEach(function (tpl) {
      tpl.addEventListener('click', function () {
        var key = tpl.dataset.tpl;
        var apply = function () {
          cfg.modules = TPL[key].map(function (m) { return { t: m.t, power: !!m.power }; });
          cfg.selected = null;
          document.querySelectorAll('.cfg-tpl').forEach(function (t) { t.classList.remove('is-active'); });
          tpl.classList.add('is-active');
          renderCfg();
        };
        if (key !== 'l4') { if (window.confirm('Replace the current layout with this template? Your current edits will be lost.')) apply(); }
        else apply();
      });
      // sync template dimension labels
      var key = tpl.dataset.tpl, mods = TPL[key].map(function (m) { return m; });
      var dd = dims(mods), n = mods.length;
      tpl.querySelector('small').textContent = dd.W + '"W × ' + dd.D + '"D · ' + n + ' module' + (n > 1 ? 's' : '');
    });

    // add module
    document.getElementById('cfg-add').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-add]'); if (!btn) return;
      var t = btn.dataset.add;
      var at = cfg.selected != null ? cfg.selected + 1 : cfg.modules.length;
      cfg.modules.splice(at, 0, { t: t, power: false });
      cfg.selected = at;
      renderCfg();
    });
    // select module
    cfgRun.addEventListener('click', function (e) {
      var mod = e.target.closest('.cfg-mod'); if (!mod) return;
      cfg.selected = +mod.dataset.i;
      renderCfg();
    });
    // swatches
    var swBox = document.getElementById('cfg-swatches');
    swBox.innerHTML = COLORS.map(function (c, i) {
      return '<div class="cfg-sw' + (c.hex === cfg.color ? ' is-active' : '') + '" data-hex="' + c.hex + '" title="' + c.name + '" style="background:' + c.hex + '"></div>';
    }).join('');
    swBox.addEventListener('click', function (e) {
      var sw = e.target.closest('.cfg-sw'); if (!sw) return;
      setActive(swBox, sw); cfg.color = sw.dataset.hex; renderCfg();
    });
    // grade / legs / currency
    document.getElementById('cfg-grade').addEventListener('change', function () { cfg.grade = parseFloat(this.value); renderCfg(); });
    document.getElementById('cfg-legs').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      setActive(this, b); cfg.legs = +b.dataset.legs; renderCfg();
    });
    document.getElementById('cfg-currency').addEventListener('change', function () {
      cfg.currency = this.value; renderCfg();
      toast('Display currency switched to ' + this.value + ' — checkout settles in USD.');
    });
    // viewport tools
    document.getElementById('cfg-rot').addEventListener('click', function () { cfg.rot = (cfg.rot + 90) % 360; renderCfg(); });
    document.getElementById('cfg-zin').addEventListener('click', function () { cfg.zoom = Math.min(1.4, +(cfg.zoom + 0.1).toFixed(2)); renderCfg(); });
    document.getElementById('cfg-zout').addEventListener('click', function () { cfg.zoom = Math.max(0.6, +(cfg.zoom - 0.1).toFixed(2)); renderCfg(); });
    document.getElementById('cfg-view-seg').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      setActive(this, b);
      document.querySelector('.cfg-hint').textContent = b.dataset.view === 'top'
        ? 'Top-down schematic view (WebGL 3D on the live site)'
        : 'Tap a module to select · drag-add from left panel';
    });
    // bar actions
    document.getElementById('cfg-save').addEventListener('click', function () { toast('Design saved locally — cloud sync starts at sign-in (demo)'); });
    document.getElementById('cfg-addcart').addEventListener('click', function () {
      var errs = validate(cfg.modules);
      if (errs.length) { toast(errs[0]); return; }
      toast('Added to cart — price & BOM snapshot locked');
    });
    document.getElementById('cfg-ar-btn').addEventListener('click', function () { toast('AR opens on mobile — see prototype 5.5 below'); });
    document.getElementById('cfg-room-btn').addEventListener('click', function () { toast('Room planner carries this design — see prototype 5.6 below'); });
    document.getElementById('cfg-swatch-btn2').addEventListener('click', function () { toast('Free swatch request for this cover (demo)'); });

    renderCfg();
  }

  /* ============ 5.5 AR ============ */
  var arPlace = document.getElementById('ar-place');
  if (arPlace) {
    var arSofa = document.getElementById('ar-sofa'),
      arReticle = document.getElementById('ar-reticle'),
      arState = document.getElementById('ar-state'),
      arScale = document.getElementById('ar-scale'),
      arScaleVal = document.getElementById('ar-scale-val'),
      arRecenter = document.getElementById('ar-recenter'),
      arDesc = document.getElementById('ar-desc'),
      placed = false;
    var cfgD = dims(TPL.l4.map(function (m) { return m; }));
    arDesc.innerHTML = 'Move your phone slowly to let the camera detect the floor. The sofa appears at real-world scale (' + cfgD.W + '"W × ' + cfgD.D + '"D).';
    arPlace.addEventListener('click', function () {
      placed = true;
      arReticle.style.display = 'none';
      arSofa.style.display = 'block';
      arState.textContent = 'State: sofa placed at 1:1 scale';
      arScale.disabled = false;
      arRecenter.disabled = false;
      arPlace.textContent = 'Placed ✓';
      arPlace.disabled = true;
      arDesc.textContent = 'Drag to move, pinch to inspect. Release returns to true 100% scale — product dimensions never change.';
    });
    arScale.addEventListener('input', function () {
      var v = +this.value;
      arScaleVal.textContent = v + '%';
      arSofa.style.width = (170 * v / 100) + 'px';
    });
    arScale.addEventListener('change', function () {
      this.value = 100; arScaleVal.textContent = '100%'; arSofa.style.width = '170px';
      toast('Scale snapped back to true size (100%)');
    });
    arRecenter.addEventListener('click', function () {
      arScale.value = 100; arScaleVal.textContent = '100%'; arSofa.style.width = '170px';
      toast('Sofa recentered on detected floor');
    });
    document.getElementById('ar-back').addEventListener('click', function () { toast('Returned to configurator — design preserved'); });
  }

  /* ============ 5.6 Room planner ============ */
  var rpRoom = document.getElementById('rp-room'), rpSofa = document.getElementById('rp-sofa');
  if (rpRoom && rpSofa) {
    var SOFA_W = 94, SOFA_D = 94, PX = 2.4;
    function renderRoom() {
      var rw = +document.getElementById('rp-w').value || 0;
      var rd = +document.getElementById('rp-d').value || 0;
      rpRoom.style.width = Math.min(rw * PX, 620) + 'px';
      rpRoom.style.height = Math.min(rd * PX, 420) + 'px';
      rpSofa.style.width = SOFA_W * PX + 'px';
      rpSofa.style.height = SOFA_D * PX + 'px';
      var flag = document.getElementById('rp-flag');
      if (rw < SOFA_W || rd < SOFA_D) {
        flag.className = 'rp-flag bad';
        flag.textContent = 'Sofa (' + SOFA_W + '"×' + SOFA_D + '") does not fit inside a ' + rw + '"×' + rd + '" room.';
      } else if (rw - SOFA_W < 30 || rd - SOFA_D < 30) {
        flag.className = 'rp-flag bad';
        flag.textContent = 'Fits, but clearance is under the 30" recommended walkway.';
      } else {
        flag.className = 'rp-flag ok';
        flag.textContent = 'Fits with ≥30" walkway on at least one side.';
      }
    }
    document.getElementById('rp-w').addEventListener('input', renderRoom);
    document.getElementById('rp-d').addEventListener('input', renderRoom);
    renderRoom();

    // drag sofa, clamped inside room
    var dragging = false, startX = 0, startY = 0, origL = 0, origT = 0;
    rpSofa.addEventListener('pointerdown', function (e) {
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      origL = rpSofa.offsetLeft; origT = rpSofa.offsetTop;
      rpSofa.setPointerCapture(e.pointerId);
    });
    rpSofa.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var maxL = rpRoom.clientWidth - rpSofa.offsetWidth;
      var maxT = rpRoom.clientHeight - rpSofa.offsetHeight;
      var nl = Math.max(0, Math.min(maxL, origL + e.clientX - startX));
      var nt = Math.max(0, Math.min(maxT, origT + e.clientY - startY));
      rpSofa.style.left = nl + 'px';
      rpSofa.style.top = nt + 'px';
    });
    rpSofa.addEventListener('pointerup', function () { dragging = false; });
  }

  /* ============ 5.7 Checkout ============ */
  var coCountry = document.getElementById('co-country');
  if (coCountry) {
    var SUBTOTAL = 3657;
    var COUNTRY = {
      US: { rate: 0.07, label: 'Sales tax (US, demo 7%)', klarna: false, note: 'Demo flat 7% — live rate is calculated by state/ZIP via a tax service.' },
      CA: { rate: 0.05, label: 'GST (Canada 5%)', klarna: false, note: 'Provincial PST/HST added on top in participating provinces.' },
      UK: { rate: 0.20, label: 'VAT (United Kingdom 20%)', klarna: true, note: 'VAT and duty are prepaid (DDP) — nothing to pay on delivery.' },
      DE: { rate: 0.19, label: 'VAT (Germany 19%)', klarna: true, note: 'EU VAT and duty are prepaid (DDP) — nothing to pay on delivery.' },
      AU: { rate: 0.10, label: 'GST (Australia 10%)', klarna: false, note: 'GST 10% applied; import duty assessed by HS code.' }
    };
    function renderCo() {
      var c = COUNTRY[coCountry.value];
      var ship = +document.querySelector('input[name="ship"]:checked').value;
      var tax = SUBTOTAL * c.rate;
      var total = SUBTOTAL + ship + tax;
      document.getElementById('co-sub').textContent = fmt(SUBTOTAL, '$');
      document.getElementById('co-shipcost').textContent = ship === 0 ? 'Free' : fmt(ship, '+$');
      document.getElementById('co-tax-label').textContent = c.label;
      document.getElementById('co-tax').textContent = fmt(tax, '$');
      document.getElementById('co-total').textContent = fmt(total, '$');
      document.getElementById('co-line-price').textContent = fmt(SUBTOTAL, '$');
      document.getElementById('co-note').textContent = c.note;
      document.getElementById('co-klarna').style.display = c.klarna ? '' : 'none';
    }
    coCountry.addEventListener('change', renderCo);
    document.getElementById('co-ship').addEventListener('change', function (e) {
      document.querySelectorAll('#co-ship label').forEach(function (l) { l.classList.remove('is-active'); });
      e.target.closest('label').classList.add('is-active');
      renderCo();
    });
    document.getElementById('co-pay').addEventListener('click', function (e) {
      var b = e.target.closest('.is-pay'); if (!b) return;
      document.querySelectorAll('.is-pay').forEach(function (x) { x.classList.remove('p-btn--primary'); });
      b.classList.add('p-btn--primary');
    });
    renderCo();
  }

  /* ============ 5.9 Account / share ============ */
  var shareModal = document.getElementById('share-modal');
  if (shareModal) {
    document.querySelectorAll('.ac-share').forEach(function (b) {
      b.addEventListener('click', function () { shareModal.classList.add('show'); });
    });
    document.getElementById('close-share').addEventListener('click', function () { shareModal.classList.remove('show'); });
    shareModal.addEventListener('click', function (e) { if (e.target === shareModal) shareModal.classList.remove('show'); });
    document.getElementById('copy-link').addEventListener('click', function () {
      var input = document.getElementById('share-link');
      if (navigator.clipboard) { navigator.clipboard.writeText(input.value).then(function () { toast('Share link copied'); }); }
      else { input.select(); document.execCommand('copy'); toast('Share link copied'); }
    });
    document.getElementById('email-design').addEventListener('click', function () {
      shareModal.classList.remove('show');
      toast('Design email queued with render, BOM and pricing (demo)');
    });
  }

  /* ============ 5.10 Admin ============ */
  var savebar = document.getElementById('adm-savebar');
  var admTable = document.getElementById('adm-table');
  if (savebar && admTable) {
    function markDirty() {
      savebar.classList.add('show');
      document.getElementById('adm-dirty').textContent = 'Unsaved changes — not live on the storefront yet';
    }
    admTable.addEventListener('input', markDirty);
    admTable.addEventListener('change', markDirty);
    document.getElementById('adm-discard').addEventListener('click', function () {
      savebar.classList.remove('show');
      toast('Changes discarded');
    });
    document.getElementById('adm-publish').addEventListener('click', function () {
      savebar.classList.remove('show');
      toast('Published — new prices and statuses are now live');
    });
    document.getElementById('adm-add').addEventListener('click', function () {
      var tb = admTable.querySelector('tbody');
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>HC-NEW-0' + (tb.rows.length + 1) + '</td><td><input class="cell" style="width:130px" placeholder="Module name"></td>' +
        '<td><input class="cell" placeholder="W×D"></td><td><input class="cell" placeholder="0"></td><td>No</td>' +
        '<td><label class="switch"><input type="checkbox"><span class="sl"></span></label></td>' +
        '<td><button class="p-btn p-btn--sm adm-del">Remove</button></td>';
      tb.appendChild(tr);
      markDirty();
    });
    admTable.addEventListener('click', function (e) {
      var del = e.target.closest('.adm-del');
      if (del) { del.closest('tr').remove(); markDirty(); }
    });
  }
})();
