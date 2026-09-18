// solar-time.js — Solar-day birth-card correction for the Life Script stats.
//
// Added 2026-07-11, adapting the earlier "Super" astrology.html "Solar
// Day" feature. Given a birth date + clock time + birthplace, it uses the
// Astronomy Engine to find the Sun's lower transits (solar midnights) at
// the birth longitude; the solar day is named by the LOCAL DATE AT SOLAR
// NOON, and THAT date gives the birth card. A birth close to midnight can
// belong to the previous/next calendar day by the sun, which flips the
// card — this surfaces the correct one.
//
// The heavy engine (js/astronomy.js, ~116 KB) is LAZY-loaded on first use
// so it never touches page startup. Longitude comes from window.TZ_COORDS
// (js/tzcoords.js) keyed by the IANA zone the birthplace picker resolves
// to; the DST-aware UTC offset comes from the browser's own tz database.
//
// Reads SPREAD_CARDS + spreadCardPips + Finder's currentAge anchor as
// classic-script globals (loaded earlier), and window.TZ_COORDS from
// tzcoords.js. Quadrations keeps a separate quadAge.
//
// PUBLIC on window.SolarTime:
//   solarDate({year,month,day,hour,minute}, tz) -> Promise<{
//     civil:{y,m,d}, solar:{y,m,d}, differs, solarFrac, solarTimeMin,
//     offMin, lon,
//     prevMs, nextMs }>
//   zoneFor(text) -> canonical IANA zone (or null)
//   lonFor(tz)    -> longitude east (or null)
//   refresh()     -> re-render the Solar Time stats sub-panel

(function () {
  'use strict';

  var ZMAP = {};            // lowercased zone/city text -> canonical IANA zone
  var _enginePromise = null;
  var _renderToken = 0;     // invalidates calculations superseded by Finder changes

  // Lazy-load the Astronomy Engine on first use. No cache-buster query so
  // the sw.js precache entry (exact 'js/astronomy.js') still matches offline.
  function ensureEngine() {
    if (window.Astronomy) return Promise.resolve(window.Astronomy);
    if (_enginePromise) return _enginePromise;
    _enginePromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'js/astronomy.js';
      s.async = true;
      s.onload = function () {
        window.Astronomy ? resolve(window.Astronomy) : reject(new Error('engine unavailable'));
      };
      s.onerror = function () { reject(new Error('engine failed to load')); };
      document.head.appendChild(s);
    });
    return _enginePromise;
  }

  // Minutes east of UTC in zone tz at the given instant (DST-aware, via the
  // browser IANA database). Ported verbatim from the astrology page.
  function zoneOffsetMin(tz, date) {
    var dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    var p = {};
    dtf.formatToParts(date).forEach(function (x) { p[x.type] = x.value; });
    return (Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - date.getTime()) / 60000;
  }

  function localDateParts(ms) {
    var dd = new Date(ms);
    return { y: dd.getUTCFullYear(), m: dd.getUTCMonth() + 1, d: dd.getUTCDate() };
  }

  // Solar midnight = the Sun's lower transit (hour angle 12) at lonDeg.
  // Latitude does not affect transit times; 0 is safe. Returns the midnight
  // before + after the instant, and the solar noon of that solar day.
  function solarMidnights(A, t, lonDeg) {
    var obs = new A.Observer(0, lonDeg, 0);
    var search = t.AddDays(-1.6);
    var prev = null, next = null;
    for (var i = 0; i < 5; i++) {
      // Astronomy Engine takes the start time as its fourth argument;
      // direction defaults to forward when omitted.
      var ev = A.SearchHourAngle(A.Body.Sun, obs, 12, search);
      if (ev.time.ut <= t.ut) { prev = ev.time; search = ev.time.AddDays(0.2); }
      else { next = ev.time; break; }
    }
    if (!prev || !next) throw new Error('could not find surrounding solar midnights');
    var noon = A.SearchHourAngle(A.Body.Sun, obs, 0, prev).time;
    return { prev: prev, next: next, noon: noon };
  }

  function zoneFor(text) {
    if (!text) return null;
    return ZMAP[String(text).trim().toLowerCase()] || null;
  }
  function lonFor(tz) {
    return (tz && window.TZ_COORDS && window.TZ_COORDS[tz]) ? window.TZ_COORDS[tz][1] : null;
  }

  // Core: the solar-adjusted date for a birth.
  function solarDate(birth, tz) {
    return ensureEngine().then(function (A) {
      var lon = lonFor(tz);
      if (lon === null) throw new Error('no longitude for that place');
      var localGuess = Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute);
      // Two-pass offset: the offset depends on the instant, which depends on
      // the offset — one refinement pass is plenty away from a DST boundary.
      var offMin = zoneOffsetMin(tz, new Date(localGuess));
      offMin = zoneOffsetMin(tz, new Date(localGuess - offMin * 60000));
      var utcMs = localGuess - offMin * 60000;
      var t = A.MakeTime(new Date(utcMs));
      var sm = solarMidnights(A, t, lon);
      var solarFrac = (t.ut - sm.prev.ut) / (sm.next.ut - sm.prev.ut);
      var solar = localDateParts(sm.noon.date.getTime() + offMin * 60000);
      var civil = { y: birth.year, m: birth.month, d: birth.day };
      var differs = !(solar.y === civil.y && solar.m === civil.m && solar.d === civil.d);
      return {
        civil: civil, solar: solar, differs: differs, solarFrac: solarFrac,
        solarTimeMin: Math.round(solarFrac * 1440) % 1440,
        offMin: offMin, lon: lon, t: t,
        prevMs: sm.prev.date.getTime() + offMin * 60000,
        nextMs: sm.next.date.getTime() + offMin * 60000
      };
    });
  }

  // ── Solar Time stats sub-panel (#fSolar) ─────────────────────────
  var RANK_NAMES = { A: 'Ace', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five',
    '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine', '10': 'Ten',
    J: 'Jack', Q: 'Queen', K: 'King' };
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function cardForDate(m, d) {
    var sv = 55 - (2 * m + d);
    if (sv >= 1 && sv <= 52) {
      var c = SPREAD_CARDS[sv - 1];
      return { rank: c.rank, suit: c.suit, sym: c.sym };
    }
    return { rank: '✦', suit: 'joker', sym: '✦' };
  }
  function cardName(card) {
    if (card.suit === 'joker') return 'The Joker';
    var suit = card.suit.charAt(0).toUpperCase() + card.suit.slice(1);
    return (RANK_NAMES[card.rank] || card.rank) + ' of ' + suit;
  }
  function cardTile(card, label, dimmed) {
    // Full-size stats card face — same visual language as Life Script's
    // Ruling-card row. Joker uses spreadCardPips' built-in joker corners.
    var face = (typeof window.spreadCardPips === 'function')
      ? window.spreadCardPips(card)
      : (card.rank + card.sym);
    var idx = -1;
    if (typeof SPREAD_CARDS !== 'undefined' && card.suit !== 'joker') {
      for (var i = 0; i < SPREAD_CARDS.length; i++) {
        if (SPREAD_CARDS[i].rank === card.rank && SPREAD_CARDS[i].suit === card.suit) { idx = i; break; }
      }
    }
    var idxAttr = idx >= 0 ? ' data-idx="' + idx + '"' : '';
    var role = idx >= 0 ? ' role="button" tabindex="0"' : '';
    return '<div class="sol-card' + (dimmed ? ' dimmed' : '') + '">' +
      '<div class="sol-card-label">' + label + '</div>' +
      '<div class="spread-card ls-card ls-stat-card sol-card-face ' + card.suit + '"' + idxAttr + role +
        ' aria-label="Load ' + cardName(card) + ' in finder">' + face + '</div>' +
      '<div class="sol-card-name">' + cardName(card) + '</div></div>';
  }

  function bindSolCards(root) {
    if (!root) return;
    root.querySelectorAll('.ls-stat-card[data-idx]').forEach(function (el) {
      var idx = parseInt(el.dataset.idx, 10);
      if (!Number.isInteger(idx) || idx < 0) return;
      var open = function () {
        if (typeof window.loadCardInFinder === 'function') window.loadCardInFinder(idx);
      };
      el.style.cursor = 'pointer';
      el.onclick = open;
      el.onkeydown = function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        open();
      };
    });
  }
  function fmtD(p) { return p.d + ' ' + MON[p.m - 1] + ' ' + p.y; }
  function fmtClock(totalMin) {
    var mins = ((Number(totalMin) % 1440) + 1440) % 1440;
    var hour24 = Math.floor(mins / 60), minute = mins % 60;
    var suffix = hour24 >= 12 ? 'pm' : 'am';
    var hour12 = hour24 % 12 || 12;
    return hour12 + ':' + String(minute).padStart(2, '0') + ' ' + suffix;
  }

  // Birth date from the Finder (month/day) + the age anchor (birth year).
  function activeBirth() {
    var mEl = document.getElementById('fMonth'), dEl = document.getElementById('fDay');
    if (!mEl || !dEl) return null;
    var m = parseInt(mEl.value, 10), d = parseInt(dEl.value, 10);
    if (!m || !d) return null;
    var anchorAge = (typeof currentAge === 'number' ? currentAge : 0);
    var now = new Date();
    var refUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    var realLbYear = (Date.UTC(now.getFullYear(), m - 1, d) > refUTC) ? now.getFullYear() - 1 : now.getFullYear();
    return { year: realLbYear - anchorAge, month: m, day: d };
  }

  function el(id) { return document.getElementById(id); }

  function render() {
    var out = el('solOut');
    if (!out) return;
    var renderToken = ++_renderToken;
    var oldSky = out.querySelector('[data-sky-root]');
    if (oldSky && typeof oldSky._skyCleanup === 'function') oldSky._skyCleanup();
    var birth = activeBirth();
    if (!birth) {
      out.innerHTML = '<p class="sol-hint">Set a birth date first — a DD/MM plus an age, or a saved birthday.</p>';
      return;
    }
    var placeEl = el('solPlace'), timeEl = el('solTime');
    var tz = zoneFor(placeEl ? placeEl.value : '');
    var time = timeEl ? timeEl.value : '';
    if (!time || !tz) {
      out.innerHTML = '';
      return;
    }
    var hm = time.split(':');
    var b = { year: birth.year, month: birth.month, day: birth.day, hour: +hm[0] || 0, minute: +hm[1] || 0 };
    out.innerHTML = '<p class="sol-hint">Consulting the sun…</p>';
    solarDate(b, tz).then(function (res) {
      if (renderToken !== _renderToken) return;
      var solarCard = cardForDate(res.solar.m, res.solar.d);
      var verdictHTML, cardsHTML;
      if (res.differs) {
        var clockCard = cardForDate(res.civil.m, res.civil.d);
        verdictHTML = '<p class="sol-verdict">By the clock this birth is <strong>' + fmtD(res.civil) +
          '</strong>, but by the sun it belongs to <strong>' + fmtD(res.solar) +
          '</strong> — the solar day had not yet turned.</p>';
        cardsHTML = '<div class="sol-cards">' + cardTile(clockCard, 'Clock date', true) +
          cardTile(solarCard, 'Solar day', false) + '</div>';
      } else {
        verdictHTML = '<p class="sol-verdict">Clock and sun agree: this birth belongs to <strong>' + fmtD(res.civil) + '</strong>.</p>';
        cardsHTML = '<div class="sol-cards">' + cardTile(solarCard, 'Birth card', false) + '</div>';
      }
      // Personality Sun hexagram (gate) — hexagram only, computed from the
      // same birth instant. Owned by js/sun-gate.js; no-op if not loaded.
      var gatesBlock = (window.SunGate && typeof window.SunGate.html === 'function') ? window.SunGate.html(res.t, cardsHTML) : '';
      // Full natal chart table (Mind/Body, Planet, Card, Sign, Degree, House), owned by
      // js/chart-table.js. Only reachable from here, which is the point: it
      // needs a real birth instant (date + clock time + birthplace), and the
      // Moon's gate is meaningless without one. No-op if not loaded.
      var chartBlock = (window.ChartTable && typeof window.ChartTable.html === 'function')
        ? window.ChartTable.html(res.t, solarCard, tz) : '';
      var skyBlock = (window.Sky3D && typeof window.Sky3D.html === 'function') ? window.Sky3D.html() : '';
      var astroRail = skyBlock ?
        '<div class="astro-view-rail" data-astro-view-active="chart">' +
          '<div class="astro-view-tabs" role="tablist" aria-label="Astrology view">' +
            '<button type="button" class="astro-zodiac-tab astro-view-tab is-active" id="astroChartTab" role="tab" aria-selected="true" aria-controls="astroChartPanel" data-astro-view="chart">Natal Chart</button>' +
            '<button type="button" class="astro-zodiac-tab astro-view-tab" id="astroSkyTab" role="tab" aria-selected="false" aria-controls="astroSkyPanel" data-astro-view="sky">3D Map</button>' +
          '</div>' +
          '<div class="astro-view-panel" id="astroChartPanel" role="tabpanel" tabindex="0" aria-labelledby="astroChartTab" data-astro-view-panel="chart">' + chartBlock + '</div>' +
          '<div class="astro-view-panel astro-view-block" id="astroSkyPanel" role="tabpanel" tabindex="0" aria-labelledby="astroSkyTab" data-astro-view-panel="sky" hidden>' + skyBlock + '</div>' +
        '</div>' : chartBlock;
      var solarClockHTML = '<p class="sol-true-time">True solar time at birth: <strong>' +
        fmtClock(res.solarTimeMin) + '</strong>.</p>';
      out.innerHTML = verdictHTML + solarClockHTML + (gatesBlock || cardsHTML) + astroRail;
      bindSolCards(out);
      if (chartBlock && window.bindZodiacTabs) window.bindZodiacTabs(out);
      if (chartBlock && window.ChartTable && typeof window.ChartTable.bindGateToggle === 'function') window.ChartTable.bindGateToggle(out);
      if (chartBlock && window.ChartTable && typeof window.ChartTable.bindAstroOlneyPopup === 'function') window.ChartTable.bindAstroOlneyPopup(out);
      if (skyBlock && window.Sky3D) {
        var skyRoot = out.querySelector('.sky3d-block');
        // The zone is handed over too: Sky3D's ground view stands the camera
        // on the plane at the birth place, reading [lat, lon] from TZ_COORDS.
        // It falls back to the pole when a zone has no coordinates.
        window.Sky3D.bind(skyRoot, res.t, tz);
      }
      bindAstroViewRail(out);
    }).catch(function (e) {
      if (renderToken !== _renderToken) return;
      out.innerHTML = '<p class="sol-hint">Could not compute solar time (' + (e && e.message ? e.message : 'error') + ').</p>';
    });
  }

  function bindAstroViewRail(root) {
    var rail = root && root.querySelector('[data-astro-view-active]');
    if (!rail || rail.dataset.astroViewBound === 'true') return;
    rail.dataset.astroViewBound = 'true';
    var tabs = Array.prototype.slice.call(rail.querySelectorAll('[data-astro-view]'));
    function sync(view, focus) {
      rail.dataset.astroViewActive = view;
      tabs.forEach(function (tab) {
        var on = tab.dataset.astroView === view;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
      });
      rail.querySelectorAll('[data-astro-view-panel]').forEach(function (panel) {
        panel.hidden = panel.dataset.astroViewPanel !== view;
      });
      if (view === 'sky') {
        var skyRoot = rail.querySelector('[data-sky-root]');
        // The rail owns the view now: opening 3D Map should also start the
        // viewer, while an already-open scene is left running for quick tab
        // returns instead of being toggled closed.
        if (skyRoot && skyRoot.hidden && window.Sky3D && typeof window.Sky3D.open === 'function') {
          skyRoot.hidden = false;
          window.Sky3D.open(skyRoot.closest('.sky3d-block'), skyRoot._skyTime, skyRoot._skyZone);
        }
      }
      if (focus) focus.focus();
    }
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { sync(tab.dataset.astroView, null); });
      tab.addEventListener('keydown', function (event) {
        var i = tabs.indexOf(tab), next = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = tabs[(i + tabs.length - 1) % tabs.length];
        if (event.key === 'Home') next = tabs[0];
        if (event.key === 'End') next = tabs[tabs.length - 1];
        if (next) { event.preventDefault(); sync(next.dataset.astroView, next); }
      });
    });
    sync('chart', null);
  }

  function populateZones() {
    var dl = el('solZoneList');
    try {
      Intl.supportedValuesOf('timeZone').forEach(function (z) {
        ZMAP[z.toLowerCase()] = z;
        if (dl) { var o = document.createElement('option'); o.value = z; dl.appendChild(o); }
      });
    } catch (e) {
      // Older browser without supportedValuesOf — hide the birthplace field.
      var f = el('solPlace');
      if (f && f.closest('.it-solar-field')) f.closest('.it-solar-field').style.display = 'none';
    }
  }

  function wire() {
    var panel = el('fSolar'), body = el('solBody');
    if (!panel) return;
    populateZones();
    panel.classList.add('open');
    if (body) body.hidden = false;
    render();
    var t = el('solTime'), p = el('solPlace');
    if (t) t.addEventListener('input', render);
    if (p) p.addEventListener('input', render);
  }

  window.SolarTime = { solarDate: solarDate, zoneFor: zoneFor, lonFor: lonFor, refresh: render };
  document.addEventListener('DOMContentLoaded', wire);
})();
