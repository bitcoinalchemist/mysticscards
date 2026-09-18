// chart-table.js — the natal chart table shown under the Solar Time birth
// card in the Finder's Astrology panel.
//
// One row per body: Mind/Body · Planet · Card · Sign · Degree · House.
//
//   Body   — the Human Design "Design" gate, read at the moment the Sun was
//            exactly 88° of ecliptic longitude before its birth position
//            (≈88 days earlier, the prenatal half of the BodyGraph).
//   Mind   — the "Personality" gate, read at the birth instant itself.
//   Card   — cardology: Earth carries the birth card; Moon and Pluto are
//            derived extension cards; Mercury→Neptune carry that card's Life
//            Script seats. Bodies with no cardology seat show a dot.
//   Sign / Degree — position in the selected zodiac.
//
// Adapted from the earlier standalone astrology page (kept in
// dev/astrology_code/) — this is the "unified chart table" from it, minus the
// House column, which needs an exact birth time AND place to mean anything.
//
// GATED ON A REAL BIRTH MOMENT. js/solar-time.js only calls in once it has
// resolved a birth instant from a date + clock time + birthplace, so there is
// no "approximate" mode: without a birth time the Moon alone can drift ~6°,
// which is wider than a whole gate (5.625°), and the table would be quietly
// wrong rather than obviously absent.
//
// Gates are DISPLAY ONLY here — figure + gate.line, not clickable. The
// hexagram reading text lives in js/ichingdata.js + js/linedata.js (~113 KB),
// which iching.html loads and index.html deliberately does not.
//
// Reads: window.Astronomy (lazy-loaded by solar-time.js before we're called),
// window.SunGate (gateOf / ayanamsa / hexFigSVG / KW_TO_VAL), and the
// classic-script globals CARDS, LIFE_SCRIPTS, SPREAD_PLANETS from cardsdata.js.
//
// PUBLIC on window.ChartTable:
//   html(t, birthCard) -> HTML string for the whole block, or '' if the
//                         engine or its inputs aren't available.
//   cardMap(birthCard) -> planet-name to CARDS index map for its cardology
//                         seats (also exposed for data-integrity checks).
//   ascendantLongitude(t, tz) -> tropical ascendant longitude for the zone.
//   bindGateToggle(root) -> bind the shared Mind/Body column toggle.
(function () {
  'use strict';

  var SIGNS = [
    ['Aries', '♈'], ['Taurus', '♉'], ['Gemini', '♊'], ['Cancer', '♋'],
    ['Leo', '♌'], ['Virgo', '♍'], ['Libra', '♎'], ['Scorpio', '♏'],
    ['Sagittarius', '♐'], ['Capricorn', '♑'], ['Aquarius', '♒'], ['Pisces', '♓']
  ];
  var TEXT_VARIATION = '\uFE0E';

  // Astronomy Engine bodies, in the order the table lists them. Earth is
  // derived from the Sun below and inserted between Sun and Moon.
  var PLANETS = [
    ['Sun', '☉'], ['Moon', '☽'], ['Mercury', '☿'], ['Venus', '♀'],
    ['Mars', '♂'], ['Jupiter', '♃'], ['Saturn', '♄'], ['Uranus', '♅'],
    ['Neptune', '♆'], ['Pluto', '♇']
  ];
  var D2R = Math.PI / 180;
  var EPS0 = 23.4392911 * D2R;

  // Chiron is not in Astronomy Engine, so it comes from JPL osculating
  // elements (epoch JD 2461200.5, J2000 ecliptic) by two-body Kepler, rotated
  // to a geocentric EQJ vector and run through the same Astronomy.Ecliptic()
  // the planets use — so it shares their exact frame. Good to ~an arcminute
  // near our era; drifts for dates far from the present.
  var CHIRON = {
    a: 13.68426760850124, e: 0.3797656311453571, iDeg: 6.930574468846328,
    omDeg: 209.2961258613147, wDeg: 339.2878326589729, M0: 216.7198966018106,
    nDeg: 0.0194702593257484, epoch: 2461200.5
  };

  function A() { return window.Astronomy; }

  function lonAt(name, t) {
    return A().Ecliptic(A().GeoVector(A().Body[name], t, true)).elon;
  }

  function chironHelioEcl(jdTT) {
    var M = (CHIRON.M0 + CHIRON.nDeg * (jdTT - CHIRON.epoch)) * D2R;
    var E = M;
    for (var k = 0; k < 60; k++) {
      var dE = (E - CHIRON.e * Math.sin(E) - M) / (1 - CHIRON.e * Math.cos(E));
      E -= dE;
      if (Math.abs(dE) < 1e-13) break;
    }
    var nu = 2 * Math.atan2(Math.sqrt(1 + CHIRON.e) * Math.sin(E / 2), Math.sqrt(1 - CHIRON.e) * Math.cos(E / 2));
    var r = CHIRON.a * (1 - CHIRON.e * Math.cos(E));
    var om = CHIRON.omDeg * D2R, w = CHIRON.wDeg * D2R, inc = CHIRON.iDeg * D2R, u = w + nu;
    return {
      x: r * (Math.cos(om) * Math.cos(u) - Math.sin(om) * Math.sin(u) * Math.cos(inc)),
      y: r * (Math.sin(om) * Math.cos(u) + Math.cos(om) * Math.sin(u) * Math.cos(inc)),
      z: r * (Math.sin(u) * Math.sin(inc))
    };
  }

  function chironLon(t) {
    var jdTT = 2451545.0 + t.tt;
    var earth = A().HelioVector(A().Body.Earth, t);
    var ce = Math.cos(EPS0), se = Math.sin(EPS0), lt = 0, gx, gy, gz;
    for (var it = 0; it < 3; it++) {
      var h = chironHelioEcl(jdTT - lt);
      var ex = h.x, ey = h.y * ce - h.z * se, ez = h.y * se + h.z * ce;
      gx = ex - earth.x; gy = ey - earth.y; gz = ez - earth.z;
      lt = Math.sqrt(gx * gx + gy * gy + gz * gz) * 0.0057755183;
    }
    var vec = (typeof A().Vector === 'function') ? new (A().Vector)(gx, gy, gz, t) : { x: gx, y: gy, z: gz, t: t };
    return A().Ecliptic(vec).elon;
  }

  // Mean lunar node — the same series the Vedic charts use for Rahu/Ketu.
  function meanNode(t) {
    var T = t.tt / 36525;
    return (((125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000) % 360) + 360) % 360;
  }

  // The Design instant: Sun exactly 88° of longitude before its birth
  // position. Newton-step on the Sun's longitude (mean motion ≈0.9856°/day);
  // the signed shortest difference handles the 0°/360° wrap.
  function findDesignTime(t) {
    var target = ((lonAt('Sun', t) - 88) % 360 + 360) % 360;
    var tt = t.AddDays(-88.5);
    for (var i = 0; i < 12; i++) {
      var diff = ((lonAt('Sun', tt) - target + 540) % 360) - 180;
      if (Math.abs(diff) < 1e-6) break;
      tt = tt.AddDays(-diff / 0.9856473);
    }
    return tt;
  }

  function retroOf(name, t, lon) {
    if (name === 'Sun' || name === 'Moon') return false;
    var d = lonAt(name, t.AddDays(0.5)) - lon;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d < 0;
  }

  function computeChart(t) {
    var chart = PLANETS.map(function (p) {
      var lon = lonAt(p[0], t);
      return { name: p[0], glyph: p[1], lon: lon, retro: retroOf(p[0], t, lon) };
    });
    // Earth sits opposite the Sun, directly beneath it in the table.
    var sun = chart.find(function (p) { return p.name === 'Sun'; });
    var moonIndex = chart.findIndex(function (p) { return p.name === 'Moon'; });
    chart.splice(moonIndex, 0, { name: 'Earth', glyph: '⊕', lon: (sun.lon + 180) % 360, retro: false });
    var chLon = chironLon(t);
    var chD = chironLon(t.AddDays(0.5)) - chLon;
    if (chD > 180) chD -= 360;
    if (chD < -180) chD += 360;
    chart.push({ name: 'Chiron', glyph: '⚷', lon: chLon, retro: chD < 0 });
    var nn = meanNode(t);
    chart.push({ name: 'North Node', glyph: '☊', lon: nn, retro: false });
    chart.push({ name: 'South Node', glyph: '☋', lon: (nn + 180) % 360, retro: false });
    return chart;
  }

  function signOf(lon) {
    var x = ((lon % 360) + 360) % 360;
    var i = Math.floor(x / 30);
    var within = x - i * 30;
    var deg = Math.floor(within);
    var min = Math.round((within - deg) * 60);
    if (min === 60) { min = 0; deg++; }
    return { name: SIGNS[i][0], glyph: SIGNS[i][1], deg: deg, min: min };
  }

  function norm(lon) { return ((lon % 360) + 360) % 360; }

  function horizontalAt(t, tz) {
    var coords = tz && window.TZ_COORDS && window.TZ_COORDS[tz];
    if (!coords || !A() || typeof A().Rotation_ECT_EQD !== 'function') return null;
    var observer = new (A().Observer)(coords[0], coords[1], 0);
    var ectEqd = A().Rotation_ECT_EQD(t);
    var eqdHor = A().Rotation_EQD_HOR(t, observer);
    return function (lon) {
      var r = lon * D2R;
      var ect = new (A().Vector)(Math.cos(r), Math.sin(r), 0, t);
      return A().RotateVector(eqdHor, A().RotateVector(ectEqd, ect));
    };
  }

  // Find a zero crossing on the ecliptic and retain the root selected by the
  // caller. This supplies both the eastern horizon (Ascendant) and the upper
  // meridian (Midheaven) needed by the supported house systems.
  function eclipticRoot(t, tz, axis, accept) {
    var horAt = horizontalAt(t, tz);
    if (!horAt) return null;
    var prevLon = 0, prev = horAt(0), roots = [];
    for (var lon = 1; lon <= 360; lon++) {
      var cur = horAt(lon % 360);
      if (prev[axis] === 0 || cur[axis] === 0 || prev[axis] * cur[axis] < 0) {
        var lo = prevLon, hi = lon, loValue = prev[axis];
        for (var n = 0; n < 40; n++) {
          var mid = (lo + hi) / 2;
          var midValue = horAt(mid % 360)[axis];
          if (loValue * midValue <= 0) hi = mid;
          else { lo = mid; loValue = midValue; }
        }
        var root = ((lo + hi) / 2) % 360;
        var hv = horAt(root);
        if (accept(hv)) roots.push(root);
      }
      prevLon = lon;
      prev = cur;
    }
    return roots.length ? roots[0] : null;
  }

  // HOR y is west-positive, so the eastern horizon has y < 0.
  function ascendantLongitude(t, tz) {
    return eclipticRoot(t, tz, 'z', function (v) { return v.y < 0; });
  }

  // The upper intersection of the ecliptic and local meridian is the MC.
  function midheavenLongitude(t, tz) {
    return eclipticRoot(t, tz, 'y', function (v) { return v.z > 0; });
  }

  function placidusCusps(t, tz, asc, mc) {
    var coords = tz && window.TZ_COORDS && window.TZ_COORDS[tz];
    if (!coords || asc == null || mc == null) return null;
    var latitude = coords[0] * D2R;
    var rotation = A().Rotation_ECT_EQD(t);
    function equatorial(lon) {
      var r = lon * D2R;
      var ect = new (A().Vector)(Math.cos(r), Math.sin(r), 0, t);
      var eq = A().RotateVector(rotation, ect);
      return {
        ra: norm(Math.atan2(eq.y, eq.x) / D2R),
        dec: Math.asin(Math.max(-1, Math.min(1, eq.z)))
      };
    }
    var armc = equatorial(mc).ra;
    function signed(angle) { return norm(angle + 180) - 180; }
    function value(lon, fraction, eastern) {
      var eq = equatorial(lon);
      var cosH0 = -Math.tan(latitude) * Math.tan(eq.dec);
      if (cosH0 < -1 || cosH0 > 1) return null;
      var semiArc = Math.acos(cosH0) / D2R;
      var hourAngle = signed(armc - eq.ra);
      return eastern ? hourAngle + fraction * semiArc : hourAngle - fraction * semiArc;
    }
    function solve(fraction, eastern) {
      var arc = eastern ? norm(asc - mc) : norm(mc - norm(asc + 180));
      var lo = 0, hi = 1;
      var loValue = value(mc, fraction, eastern);
      var endLon = norm(mc + (eastern ? 1 : -1) * arc);
      var hiValue = value(endLon, fraction, eastern);
      if (loValue == null || hiValue == null || loValue * hiValue > 0) return null;
      for (var i = 0; i < 60; i++) {
        var mid = (lo + hi) / 2;
        var lon = norm(mc + (eastern ? 1 : -1) * arc * mid);
        var midValue = value(lon, fraction, eastern);
        if (midValue == null) return null;
        if ((loValue <= 0 && midValue >= 0) || (loValue >= 0 && midValue <= 0)) hi = mid;
        else { lo = mid; loValue = midValue; }
      }
      return norm(mc + (eastern ? 1 : -1) * arc * ((lo + hi) / 2));
    }
    var cusp11 = solve(1 / 3, true);
    var cusp12 = solve(2 / 3, true);
    var cusp9 = solve(1 / 3, false);
    var cusp8 = solve(2 / 3, false);
    if ([cusp8, cusp9, cusp11, cusp12].some(function (v) { return v == null; })) return null;
    var cusps = [];
    cusps[0] = norm(asc);
    cusps[1] = norm(cusp8 + 180);
    cusps[2] = norm(cusp9 + 180);
    cusps[3] = norm(mc + 180);
    cusps[4] = norm(cusp11 + 180);
    cusps[5] = norm(cusp12 + 180);
    cusps[6] = norm(asc + 180);
    cusps[7] = cusp8;
    cusps[8] = cusp9;
    cusps[9] = norm(mc);
    cusps[10] = cusp11;
    cusps[11] = cusp12;
    return cusps;
  }

  function cuspHouse(lon, cusps) {
    if (!cusps || cusps.length !== 12) return null;
    for (var i = 0; i < 12; i++) {
      var span = norm(cusps[(i + 1) % 12] - cusps[i]);
      if (norm(lon - cusps[i]) < span) return i + 1;
    }
    return null;
  }

  function houseOf(lon, asc, system, mc, placidus) {
    if (asc == null || !isFinite(asc)) return null;
    lon = norm(lon);
    asc = norm(asc);
    if (system === 'whole') return norm(Math.floor(lon / 30) * 30 - Math.floor(asc / 30) * 30) / 30 + 1;
    if (system === 'placidus') return cuspHouse(lon, placidus) || houseOf(lon, asc, 'equal', mc, null);
    return Math.floor(norm(lon - asc) / 30) + 1;
  }

  // Earth = the birth card; Moon and Pluto extend its age-one Life Spread by
  // one seat on either side; Mercury→Neptune = its Life Script seats.
  // Seats are stored as 'A♦' style strings; lsParseCard (cardsdata.js) is the
  // one place that knows how to read them.
  function indexOfCard(c) {
    if (!c || typeof CARDS === 'undefined') return -1;
    // Match on rank+suit, not identity — callers hand us cards built by
    // cardForDate() and friends, which aren't the same objects as CARDS'.
    return CARDS.findIndex(function (x) { return x.rank === c.rank && x.suit === c.suit; });
  }

  function cardMap(birthCard) {
    var map = {};
    if (!birthCard || typeof CARDS === 'undefined') return map;
    var birthIdx = indexOfCard(birthCard);
    map.Sun = birthIdx;
    map.Earth = birthIdx;
    // CARDS indexes identify cards, but adjacency here comes from the Life
    // Spread permutation, not CARDS' ordinary Hearts→Spades rank order.
    // Using birthIdx - 1 made Jack of Clubs' Moon card Ten of Clubs instead
    // of its actual preceding Life-Spread seat, Queen of Spades.
    var life = (typeof deckAtAge === 'function') ? deckAtAge(1) : null;
    var birthPos = life && birthIdx >= 0 ? life.indexOf(birthIdx) : -1;
    if (birthPos >= 0) map.Moon = life[(birthPos + life.length - 1) % life.length];
    var ls = (typeof LIFE_SCRIPTS !== 'undefined') && LIFE_SCRIPTS[birthCard.rank + '_' + birthCard.suit];
    if (!ls || typeof SPREAD_PLANETS === 'undefined' || typeof lsParseCard !== 'function') return map;
    for (var j = 0; j < 7 && j < SPREAD_PLANETS.length; j++) {
      var cc = lsParseCard(ls[j]);
      if (!cc) continue;
      map[SPREAD_PLANETS[j]] = indexOfCard(cc);
    }
    var nep = lsParseCard(ls[6]);
    var nepIdx = indexOfCard(nep);
    var nepPos = life && nepIdx >= 0 ? life.indexOf(nepIdx) : -1;
    if (nepPos >= 0) map.Pluto = life[(nepPos + 1) % life.length];
    return map;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function gateInner(cls, kind, gate, hexFig, kwToVal) {
    var fig = (typeof hexFig === 'function' && kwToVal) ? hexFig(kwToVal[gate.gate], 0.5) : '';
    return '<span class="ct-gate-inner ' + cls + '" data-gate-kind="' + kind + '"><span class="ct-fig">' + fig + '</span>' +
      '<span class="ct-gl">' + gate.gate + '.' + gate.line + '</span></span>';
  }

  function gateCell(dGate, pGate, hexFig, kwToVal) {
    return '<td class="ct-gate">' +
      gateInner('ct-p', 'mind', pGate, hexFig, kwToVal) +
      gateInner('ct-d', 'body', dGate, hexFig, kwToVal) + '</td>';
  }

  function planetCell(p) {
    var label = '<span class="ct-pg" aria-hidden="true">' + p.glyph + TEXT_VARIATION + '</span>' + esc(p.name);
    return label;
  }

  // chart and design are PARALLEL slices of the same body list — row i of one
  // is always row i of the other. Do not reintroduce an index offset here:
  // the callers below slice both arrays together, so an extra offset walks
  // off the end of design and throws on `.lon`.
  function rowsHTML(chart, design, ay, cards, SG, asc, mc, placidus) {
    var shiftedAsc = asc == null ? null : norm(asc - ay);
    var shiftedMc = mc == null ? null : norm(mc - ay);
    var shiftedPlacidus = placidus && placidus.map(function (cusp) { return norm(cusp - ay); });
    return chart.map(function (p, i) {
      var pShift = ((p.lon - ay) % 360 + 360) % 360;
      var dShift = ((design[i].lon - ay) % 360 + 360) % 360;
      var pos = signOf(pShift);
      var houses = {
        equal: houseOf(pShift, shiftedAsc, 'equal', shiftedMc, shiftedPlacidus),
        whole: houseOf(pShift, shiftedAsc, 'whole', shiftedMc, shiftedPlacidus),
        placidus: houseOf(pShift, shiftedAsc, 'placidus', shiftedMc, shiftedPlacidus)
      };
      var ci = cards[p.name];
      var cardCell = '<span class="ct-nocard" aria-label="no card for this body">·</span>';
      var sharedBirthCard = p.name === 'Sun' && chart[i + 1] && chart[i + 1].name === 'Earth';
      if (sharedBirthCard && ci != null && ci >= 0 && typeof CARDS !== 'undefined' && CARDS[ci]) {
        var bc = CARDS[ci];
        cardCell = '<td class="ct-card ct-card--birth-axis" rowspan="2"><span class="ct-cardchip ct-cardchip--birth ' + bc.suit + '">' + bc.rank + bc.sym + '</span></td>';
      } else if (p.name === 'Earth' && chart[i - 1] && chart[i - 1].name === 'Sun') {
        cardCell = '';
      } else if (ci != null && ci >= 0 && typeof CARDS !== 'undefined' && CARDS[ci]) {
        var c = CARDS[ci];
        cardCell = '<td class="ct-card"><span class="ct-cardchip ' + c.suit + '">' + c.rank + c.sym + '</span></td>';
      } else {
        cardCell = '<td class="ct-card">' + cardCell + '</td>';
      }
      return '<tr>' +
        gateCell(SG.gateOf(dShift), SG.gateOf(pShift), SG.hexFigSVG, SG.KW_TO_VAL) +
        '<td class="ct-planet">' + planetCell(p) + '</td>' +
        cardCell +
        '<td class="ct-sign"><span aria-hidden="true">' + pos.glyph + TEXT_VARIATION + '</span> ' + esc(pos.name.slice(0, 3)) + '</td>' +
        '<td class="ct-house" data-house-equal="' + (houses.equal || '·') + '" data-house-whole="' + (houses.whole || '·') + '" data-house-placidus="' + (houses.placidus || '·') + '">' + (houses.equal || '·') + '</td>' +
        '<td class="ct-deg">' + pos.deg + '° ' + String(pos.min).padStart(2, '0') + '′' +
          (p.retro ? '<span class="ct-retro" title="retrograde">℞</span>' : '') + '</td>' +
      '</tr>';
    }).join('');
  }

  function astroOlneyHTML() {
    var notes = window.ASTRO_PLANET_NOTES || {};
    var order = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Moon', 'Earth'];
    var glyphs = { Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Earth: '⊕', Moon: '☽' };
    var suits = {
      Mercury: 'Hearts',
      Venus: 'Hearts',
      Mars: 'Clubs',
      Earth: 'Clubs',
      Jupiter: 'Diamonds',
      Neptune: 'Diamonds',
      Saturn: 'Spades',
      Uranus: 'Spades',
      Moon: 'Star'
    };
    var rows = order.map(function (name) {
      var note = notes[name];
      if (!note) return '';
      return '<article class="astro-olney-row"><span class="astro-olney-glyph" aria-hidden="true">' + glyphs[name] + '</span>' +
        '<div><h4>' + esc(name) + '<span class="astro-olney-suit">· ' + esc(suits[name] || '') + '</span></h4>' +
        '<p><strong>' + esc(note.title) + '.</strong> ' + esc(note.text) + '</p></div></article>';
    }).join('');
    return '<div class="astro-olney-inline">' +
      '<p class="astro-olney-intro"><strong>The Planets, Earth and Moon.</strong><span>For the benefit of numerous students of astralism who have the necessary knowledge and means of tracing these bodies in their revolution about the sun we give a very brief synopsis of their characteristic effects.</span></p>' +
      '<p class="astro-olney-suit-note"><strong>Planetary card suits:</strong> Mercury and Venus: Hearts; Mars and Earth: Clubs; Jupiter and Neptune: Diamonds; Saturn and Uranus: Spades; Moon: Star.</p>' +
      '<div class="astro-olney-list">' + rows + '</div>' +
    '</div>';
  }

  function tableHTML(chart, design, ay, cards, SG, kind, asc, mc, placidus) {
    var columns = '<colgroup>' +
      '<col class="ct-col-gate"><col class="ct-col-planet"><col class="ct-col-card">' +
      '<col class="ct-col-sign"><col class="ct-col-house"><col class="ct-col-degree">' +
      '</colgroup>';
    var heading = '<thead><tr>' +
      '<th scope="col"><span class="ct-header-control"><span class="ct-header-title">Hexagrams</span><button type="button" class="ct-header-toggle ct-gate-toggle" data-ct-gate-toggle>Personality</button></span></th><th scope="col">Planet</th>' +
      '<th scope="col">Card</th><th scope="col"><span class="ct-header-control"><span class="ct-header-title">Sign</span><button type="button" class="ct-header-toggle ct-zodiac-toggle" data-ct-zodiac-toggle>Tropical</button></span></th>' +
      '<th scope="col"><span class="ct-header-control"><span class="ct-header-title">House</span><button type="button" class="ct-header-toggle ct-house-toggle" data-ct-house-system="equal">Equal</button></span></th>' +
      '<th scope="col" class="ct-deg">Degree</th>' +
      '</tr></thead>';
    var note = '<p class="ct-note">Click <strong>Personality</strong> below Hexagrams to switch to Design, calculated 88° of solar arc before birth. Click <strong>Tropical</strong> below Sign to switch to Sidereal, which uses the Lahiri ayanamsa. Click the current House system to cycle through <strong>Equal</strong>, <strong>Whole Sign</strong> and <strong>Placidus</strong>. At extreme latitudes where Placidus has no valid cusp, the chart uses Equal houses. The Ascendant is an angle and has no card. <strong>℞</strong> marks retrograde motion.</p>';
    return '<table class="ct-table" data-zodiac-panel="' + kind + '">' +
      '<caption class="vh">Natal chart, ' + kind + ' zodiac</caption>' +
      columns +
      heading +
      '<tbody>' + rowsHTML(chart, design, ay, cards, SG, asc, mc, placidus) + '</tbody>' +
      '<tbody class="ct-more-row"><tr><td colspan="6"><div class="ct-more-actions">' +
        note +
        '<details class="ct-more ct-astro-olney"><summary>Yenlo</summary><div class="ct-more-body">' + astroOlneyHTML() + '</div></details>' +
      '</div></td></tr></tbody></table>';
  }

  // t is the birth AstroTime that solar-time.js already computed.
  function html(t, birthCard, tz) {
    var SG = window.SunGate;
    if (!window.Astronomy || !t || !SG || typeof SG.gateOf !== 'function' || typeof SG.ayanamsa !== 'function') return '';
    var chart, design, designTime;
    try {
      chart = computeChart(t);
      designTime = findDesignTime(t);
      design = computeChart(designTime);
    } catch (e) {
      return '';
    }
    var cards = cardMap(birthCard);
    var asc = ascendantLongitude(t, tz);
    var mc = midheavenLongitude(t, tz);
    var placidus = placidusCusps(t, tz, asc, mc);
    if (asc != null) {
      var designAsc = ascendantLongitude(designTime, tz);
      chart.push({ name: 'Ascendant', glyph: '↑', lon: asc, retro: false, isAngle: true });
      design.push({ name: 'Ascendant', glyph: '↑', lon: designAsc == null ? asc : designAsc, retro: false, isAngle: true });
    }
    var trop, sid;
    // Building the markup must never take the whole Solar Time panel down with
    // it — solar-time.js calls us inside its promise chain, so a throw here
    // would surface as a bogus "could not compute solar time" and wipe the
    // verdict, cards, gates and 3D sky as well. Degrade to no chart instead.
    try {
      trop = tableHTML(chart, design, 0, cards, SG, 'tropical', asc, mc, placidus);
      sid = tableHTML(chart, design, SG.ayanamsa('lahiri', t), cards, SG, 'sidereal', asc, mc, placidus);
    } catch (e) {
      return '';
    }
    return '<div class="ct-block" data-zodiac-group="astrology" data-zodiac-active="tropical" data-gate-active="mind">' +
      '<div class="ct-panel" id="ctPanelTropical" data-zodiac-panel="tropical">' + trop + '</div>' +
      '<div class="ct-panel" id="ctPanelSidereal" data-zodiac-panel="sidereal">' + sid + '</div>' +
    '</div>';
  }

  function bindGateToggle(root) {
    var block = root && root.querySelector('.ct-block[data-gate-active]');
    if (!block || block.dataset.gateBound === 'true') return;
    block.dataset.gateBound = 'true';
    block.querySelectorAll('[data-ct-gate-toggle]').forEach(function (button) {
      button.addEventListener('click', function () {
        var next = block.dataset.gateActive === 'mind' ? 'body' : 'mind';
        block.dataset.gateActive = next;
        block.querySelectorAll('[data-ct-gate-toggle]').forEach(function (other) {
          var label = next === 'mind' ? 'Personality' : 'Design';
          other.textContent = label;
          other.setAttribute('aria-label', 'Showing ' + label + ' gates; show ' + (next === 'mind' ? 'Design' : 'Personality') + ' gates');
        });
      });
      button.setAttribute('aria-label', 'Showing Personality gates; show Design gates');
    });
    block.querySelectorAll('[data-ct-zodiac-toggle]').forEach(function (button) {
      button.addEventListener('click', function () {
        var next = block.dataset.zodiacActive === 'tropical' ? 'sidereal' : 'tropical';
        var label = next === 'tropical' ? 'Tropical' : 'Sidereal';
        block.dataset.zodiacActive = next;
        block.querySelectorAll('[data-ct-zodiac-toggle]').forEach(function (other) {
          other.textContent = label;
          other.setAttribute('aria-label', 'Showing ' + label + ' signs; show ' + (next === 'tropical' ? 'Sidereal' : 'Tropical') + ' signs');
        });
      });
      button.setAttribute('aria-label', 'Showing Tropical signs; show Sidereal signs');
    });
    var houseSystems = ['equal', 'whole', 'placidus'];
    var houseLabels = { equal: 'Equal', whole: 'Whole Sign', placidus: 'Placidus' };
    block.querySelectorAll('[data-ct-house-system]').forEach(function (button) {
      button.addEventListener('click', function () {
        var current = button.dataset.ctHouseSystem || 'equal';
        var system = houseSystems[(houseSystems.indexOf(current) + 1) % houseSystems.length];
        block.querySelectorAll('[data-ct-house-system]').forEach(function (other) {
          other.dataset.ctHouseSystem = system;
          other.textContent = houseLabels[system];
          other.setAttribute('aria-label', 'Showing ' + houseLabels[system] + ' houses; show ' + houseLabels[houseSystems[(houseSystems.indexOf(system) + 1) % houseSystems.length]]);
        });
        block.querySelectorAll('.ct-house').forEach(function (cell) {
          cell.textContent = cell.getAttribute('data-house-' + system) || '·';
        });
      });
      button.setAttribute('aria-label', 'Showing Equal houses; show Whole Sign');
    });
  }

  window.ChartTable = { html: html, cardMap: cardMap, ascendantLongitude: ascendantLongitude, midheavenLongitude: midheavenLongitude, bindGateToggle: bindGateToggle, computeChart: computeChart, findDesignTime: findDesignTime, signOf: signOf };
})();
