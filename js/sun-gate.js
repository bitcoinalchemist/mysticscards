// sun-gate.js — the "personality Sun" hexagram (Human Design gate) shown
// under the Solar Time output in the Cycles section.
//
// Added 2026-07-11, adapting the earlier astrology page's Gates section. The Sun's
// geocentric ecliptic longitude at the birth instant maps onto the Human
// Design rave mandala (64 gates × 5.625°, anchored at Gate 41 = 302°) to
// give a gate + line; the gate IS an I Ching hexagram. The detailed
// tropical/sidereal gate values are now shown in the natal chart below; this
// module only preserves the solar birth-card wrapper used by Solar Time.
//
// "Hexagram only" scope: gate number + figure + hexagram number + name.
// No reading text, so this needs NO data file — the 64 King Wen names are
// baked in below (matching js/ichingdata.js's HEX_DATA names). Reuses the
// already-vendored Astronomy Engine (window.Astronomy); the caller passes
// the birth AstroTime it already computed for Solar Time.
//
// PUBLIC on window.SunGate:
//   html(t, centerHTML?) -> HTML string for the solar birth-card wrapper.
//   gateOf(lon)    -> { gate, line }
//   sunLonAt(t)    -> tropical ecliptic longitude of the Sun (degrees)
//   ayanamsa(mode, t) -> degrees to subtract for 'lahiri' | 'fagan'
//   hexFigSVG(val, size) -> small hexagram figure for a binary line value
//   KW_TO_VAL      -> King Wen number -> binary line value
// (the last three are shared with js/chart-table.js, which draws the same
//  gate figures for every body rather than just the Sun)

(function () {
  'use strict';

  // 64 gates of 5.625° around the TROPICAL wheel, in mandala order.
  // Gate 41 anchors at 2°00′ Aquarius (302°). Verified vs published tables.
  var GATE_ORDER = [41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,8,20,16,35,45,12,15,52,39,53,62,56,31,33,7,4,29,59,40,64,47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,38,54,61,60];

  // Binary value (bit5 = line1/bottom … bit0 = line6/top) → King Wen number.
  var VAL_TO_KW = [2,23,8,20,16,35,45,12,15,52,39,53,62,56,31,33,
                   7,4,29,59,40,64,47,6,46,18,48,57,32,50,28,44,
                   24,27,3,42,51,21,17,25,36,22,63,37,55,30,49,13,
                   19,41,60,61,54,38,58,10,11,26,5,9,34,14,43,1];
  var KW_TO_VAL = [];
  VAL_TO_KW.forEach(function (kw, v) { KW_TO_VAL[kw] = v; });

  // King Wen hexagram names, index 0 = hexagram 1 (from js/ichingdata.js).
  var HEX_NAMES = ["The Creative","The Receptive","Difficulty at the Beginning","Youthful Folly","Waiting","Conflict","The Army","Holding Together","The Taming Power of the Small","Treading","Peace","Standstill","Fellowship with Men","Possession in Great Measure","Modesty","Enthusiasm","Following","Work on What Has Been Spoiled","Approach","Contemplation","Biting Through","Grace","Splitting Apart","Return","Innocence","The Taming Power of the Great","The Corners of the Mouth","Preponderance of the Great","The Abysmal","The Clinging","Influence","Duration","Retreat","The Power of the Great","Progress","Darkening of the Light","The Family","Opposition","Obstruction","Deliverance","Decrease","Increase","Break-through","Coming to Meet","Gathering Together","Pushing Upward","Oppression","The Well","Revolution","The Caldron","The Arousing","Keeping Still","Development","The Marrying Maiden","Abundance","The Wanderer","The Gentle","The Joyous","Dispersion","Limitation","Inner Truth","Preponderance of the Small","After Completion","Before Completion"];

  // Sidereal ayanamsa (degrees), anchored at J2000 + IAU 2006 precession.
  var AYAN_J2000 = { lahiri: 23.85320, fagan: 24.73667 };
  function ayanamsa(mode, t) {
    var T = t.tt / 36525;
    return AYAN_J2000[mode] + (5028.796195 * T + 1.1054348 * T * T) / 3600;
  }

  function sunLonAt(t) {
    return window.Astronomy.Ecliptic(window.Astronomy.GeoVector(window.Astronomy.Body.Sun, t, true)).elon;
  }

  function gateOf(lon) {
    var x = ((lon - 302) % 360 + 360) % 360;
    var idx = Math.floor(x / 5.625);
    var line = Math.min(6, Math.floor((x - idx * 5.625) / 0.9375) + 1);
    return { gate: GATE_ORDER[idx], line: line };
  }

  // Small hexagram figure (same bit convention as iching.html's hexagramSVG).
  function hexFigSVG(val, size) {
    var lineH = 5 * size, gap = 4 * size, w = 36 * size, segW = 14 * size;
    var svgH = 6 * lineH + 5 * gap;
    var paths = [];
    for (var i = 0; i < 6; i++) {
      var bit = (val >> (5 - i)) & 1;
      var y = svgH - lineH - i * (lineH + gap);
      if (bit === 1) {
        paths.push('<rect x="0" y="' + y + '" width="' + w + '" height="' + lineH + '" rx="' + 1.5 * size + '" fill="var(--yang)"/>');
      } else {
        paths.push('<rect x="0" y="' + y + '" width="' + segW + '" height="' + lineH + '" rx="' + 1.5 * size + '" fill="var(--yang)"/>');
        paths.push('<rect x="' + (w - segW) + '" y="' + y + '" width="' + segW + '" height="' + lineH + '" rx="' + 1.5 * size + '" fill="var(--yang)"/>');
      }
    }
    return '<svg width="' + w + '" height="' + svgH + '" viewBox="0 0 ' + w + ' ' + svgH + '" aria-hidden="true">' + paths.join('') + '</svg>';
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function html(t, centerHTML) {
    if (!t || !window.Astronomy || !centerHTML) return '';
    return '<div class="sun-gate"><div class="sun-gate-center">' + centerHTML + '</div></div>';
  }

  window.SunGate = {
    html: html, gateOf: gateOf, sunLonAt: sunLonAt,
    // Shared with js/chart-table.js so the gate maths has one home.
    ayanamsa: ayanamsa, hexFigSVG: hexFigSVG, KW_TO_VAL: KW_TO_VAL
  };
})();
