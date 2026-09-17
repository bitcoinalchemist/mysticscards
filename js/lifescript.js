// lifescript.js — the Finder Life Script panel (2026-07-10, extracted
// from cardsdata.js's renderLifeScriptInto; dates + displacement
// chips added 2026-07-10).
//
// Reads LIFE_SCRIPTS + SPREAD_PLANETS + SPREAD_PLANET_SYM + spreadCardPips
// + CARDS + CARD_READINGS + SPREAD_CARDS + slDisplaces + slDisplacedBy
// via classic-script globals. Loaded after cardsdata.js.
//
// The picked card has seven "ruling" cards, one for each of the seven
// classical planets in the site's cardology system. Rendered in reverse
// order (Neptune → Mercury) so the wheel reads outward-inward like
// Richmond's plates. The selected birth card's own dates, displacement,
// and planetary correspondences render once in a compact stats block,
// instead of repeating under every ruling card.
//
// PUBLIC on window:
//   window.renderLifeScript(card) — stages the Life Script details and
//     moves the concise summary into About. Returns TRUE when there is
//     real content.
//   window.trimLifeDetailsForRelationship() — removes person-specific
//     planetary-ruler, Life Script, and displacement details when About is
//     showing a combined relationship card.

(function () {
  'use strict';

  const SUIT_FROM_SYM = { '♥':'hearts', '♦':'diamonds', '♣':'clubs', '♠':'spades' };
  // Primary sign rulers use modern outer-planet rulerships. The decan
  // tables below intentionally retain their classical/traditional system.
  const ZODIAC = [
    { name: 'Capricorn', glyph: '♑', ruler: 'Saturn', start: [12, 22], end: [1, 19] },
    { name: 'Aquarius', glyph: '♒', ruler: 'Uranus', start: [1, 20], end: [2, 18] },
    { name: 'Pisces', glyph: '♓', ruler: 'Neptune', start: [2, 19], end: [3, 20] },
    { name: 'Aries', glyph: '♈', ruler: 'Mars', start: [3, 21], end: [4, 19] },
    { name: 'Taurus', glyph: '♉', ruler: 'Venus', start: [4, 20], end: [5, 20] },
    { name: 'Gemini', glyph: '♊', ruler: 'Mercury', start: [5, 21], end: [6, 20] },
    { name: 'Cancer', glyph: '♋', ruler: 'Moon', start: [6, 21], end: [7, 22] },
    { name: 'Leo', glyph: '♌', ruler: 'Sun', start: [7, 23], end: [8, 22] },
    { name: 'Virgo', glyph: '♍', ruler: 'Mercury', start: [8, 23], end: [9, 22] },
    { name: 'Libra', glyph: '♎', ruler: 'Venus', start: [9, 23], end: [10, 22] },
    { name: 'Scorpio', glyph: '♏', ruler: 'Pluto', start: [10, 23], end: [11, 21] },
    { name: 'Sagittarius', glyph: '♐', ruler: 'Jupiter', start: [11, 22], end: [12, 21] }
  ];
  const TEXT_VARIATION = '\uFE0E';
  ZODIAC.forEach(function (sign) { sign.glyph += TEXT_VARIATION; });
  const SIDEREAL_LAHIRI_DAY_SHIFT = -24;

  // Decan tables — 3 decans per sign, 36 total.
  //
  // Chaldean / Egyptian decans: a fixed 7-planet rotation starting at
  // Aries 0–10° = Mars. Order = Mars, Sun, Venus, Mercury, Moon, Saturn,
  // Jupiter (the Chaldean weekday order). Each global decan (0..35) picks
  // CHALDEAN_ORDER[globalDecan % 7].
  const CHALDEAN_ORDER = ['Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter'];

  // Ptolemaic / triplicity decans: 1st decan = sign's own classical
  // ruler, 2nd = next sign of same element's ruler, 3rd = third sign of
  // same element's ruler. Uses only classical rulers (so Scorpio stays
  // Mars-Jupiter-Moon here even though its Zodiac-line ruler is set to
  // Pluto/modern). Indexed in astrological sign order (0 = Aries).
  const PTOLEMAIC_DECANS = [
    ['Mars',    'Sun',     'Jupiter'],   // Aries       — Fire (Mars, Sun, Jupiter)
    ['Venus',   'Mercury', 'Saturn'],    // Taurus      — Earth (Venus, Mercury, Saturn)
    ['Mercury', 'Venus',   'Saturn'],    // Gemini      — Air (Mercury, Venus, Saturn)
    ['Moon',    'Mars',    'Jupiter'],   // Cancer      — Water (Moon, Mars, Jupiter)
    ['Sun',     'Jupiter', 'Mars'],      // Leo         — Fire
    ['Mercury', 'Saturn',  'Venus'],     // Virgo       — Earth
    ['Venus',   'Saturn',  'Mercury'],   // Libra       — Air
    ['Mars',    'Jupiter', 'Moon'],      // Scorpio     — Water
    ['Jupiter', 'Mars',    'Sun'],       // Sagittarius — Fire
    ['Saturn',  'Venus',   'Mercury'],   // Capricorn   — Earth
    ['Saturn',  'Mercury', 'Venus'],     // Aquarius    — Air
    ['Jupiter', 'Moon',    'Mars']       // Pisces      — Water
  ];

  // Sign name → astrological index (0 = Aries … 11 = Pisces).
  const SIGN_ASTRO_IDX = {
    Aries: 0, Taurus: 1, Gemini: 2, Cancer: 3, Leo: 4, Virgo: 5,
    Libra: 6, Scorpio: 7, Sagittarius: 8, Capricorn: 9, Aquarius: 10, Pisces: 11
  };
  const DECAN_ORDINAL = ['1st', '2nd', '3rd'];
  const RANK_NAMES = {
    A: 'Ace',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
    '10': 'Ten',
    J: 'Jack',
    Q: 'Queen',
    K: 'King'
  };

  function parseCard(str) {
    const sym = str.slice(-1);
    return { rank: str.slice(0, -1), sym, suit: SUIT_FROM_SYM[sym] };
  }

  function fullCardName(card) {
    return `${RANK_NAMES[card.rank] || card.rank} of ${card.suit[0].toUpperCase() + card.suit.slice(1)}`;
  }

  function readsLeftToRight() {
    return false;
  }

  function dateNumber(month, day) {
    return (month * 100) + day;
  }

  function zodiacForDate(month, day) {
    const value = dateNumber(month, day);
    return ZODIAC.find(function (sign) {
      const start = dateNumber(sign.start[0], sign.start[1]);
      const end = dateNumber(sign.end[0], sign.end[1]);
      return start <= end
        ? value >= start && value <= end
        : value >= start || value <= end;
    }) || null;
  }

  function tropicalCuspSignForDate(sign, month, day) {
    if (!sign) return null;
    const idx = ZODIAC.indexOf(sign);
    if (idx < 0) return null;
    const value = dateNumber(month, day);
    if (value === dateNumber(sign.start[0], sign.start[1])) {
      return ZODIAC[(idx - 1 + ZODIAC.length) % ZODIAC.length];
    }
    if (value === dateNumber(sign.end[0], sign.end[1])) {
      return ZODIAC[(idx + 1) % ZODIAC.length];
    }
    return null;
  }

  function shiftedDate(month, day, shiftDays) {
    const dt = new Date(Date.UTC(2001, month - 1, day + shiftDays));
    return { month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
  }

  function dateFromInputs(monthElId, dayElId, card) {
    const mEl = document.getElementById(monthElId);
    const dEl = document.getElementById(dayElId);
    const month = mEl ? parseInt(mEl.value, 10) : NaN;
    const day = dEl ? parseInt(dEl.value, 10) : NaN;
    if (!month || !day || typeof window.solarValue !== 'function') return null;
    if (window.solarValue(month, day) !== card.sv) return null;
    return { month, day };
  }
  function selectedBirthDateForCard(card) {
    return dateFromInputs('fMonth', 'fDay', card);
  }
  // Same as selectedBirthDateForCard, but reads the Finder's partner
  // date fields — used by the relationship Connections' zodiac-ruler
  // check, which (unlike the other connection types) needs an actual
  // calendar date, not just a card.
  function selectedPartnerDateForCard(card) {
    return dateFromInputs('fpMonth', 'fpDay', card);
  }

  // Moon / Sun / Pluto cards, derived from the Life Spread (not in the
  // hand-authored LIFE_SCRIPTS table).
  //
  // For a given birth card, LIFE_SCRIPTS[i] happens to line up with the
  // seven consecutive Life-Spread positions RIGHT AFTER the birth card
  // (birth_pos+1 … birth_pos+7 in deckAtAge(1)'s linear order). Reading
  // Neptune → Mercury for display puts Mercury adjacent to the birth
  // card on one side. Moon and Pluto extend that consecutive slice by
  // one card on each end:
  //   Sun    = the birth card itself (Leo's classical ruler is the Sun).
  //   Moon   = the card at (birth pos − 1) mod 52 — the seat on the
  //            birth card's opposite side from Mercury (visually to the
  //            right of the birth card in the default Neptune → Mercury
  //            display direction).
  //   Pluto  = the card at (Neptune-card pos + 1) mod 52, equivalently
  //            (birth pos + 8) mod 52 — the seat immediately after
  //            Neptune (used as the modern Scorpio ruler).
  function derivedCardFor(planet, card, script) {
    if (typeof deckAtAge !== 'function' || typeof SPREAD_CARDS === 'undefined' ||
        typeof CARDS === 'undefined') return null;
    const life = deckAtAge(1);
    const birthIdx = CARDS.findIndex(function (x) { return x.rank === card.rank && x.suit === card.suit; });
    if (birthIdx < 0) return null;
    if (planet === 'Sun') {
      const sc = SPREAD_CARDS[birthIdx];
      return sc ? { rank: sc.rank, suit: sc.suit, sym: sc.sym } : null;
    }
    let anchorIdx = -1, step = 0;
    if (planet === 'Moon') { anchorIdx = birthIdx; step = -1; }
    else if (planet === 'Pluto') {
      const nep = script && script[6] ? parseCard(script[6]) : null;
      if (!nep) return null;
      anchorIdx = CARDS.findIndex(function (x) { return x.rank === nep.rank && x.suit === nep.suit; });
      step = 1;
    }
    if (anchorIdx < 0) return null;
    const anchorPos = life.indexOf(anchorIdx);
    if (anchorPos < 0) return null;
    const targetPos = (anchorPos + step + 52) % 52;
    const targetIdx = life[targetPos];
    const sc = SPREAD_CARDS[targetIdx];
    return sc ? { rank: sc.rank, suit: sc.suit, sym: sc.sym } : null;
  }

  // Moon / Pluto relationship connection: does `toCard` equal `fromCard`'s
  // single derived Moon or Pluto card (see derivedCardFor above)? Unlike
  // lifeScriptConnection / spiritSpreadConnection, this resolves to at most
  // one card rather than a seat among seven, so the result carries no idx.
  function derivedConnection(planet, fromCard, toCard) {
    const key = `${fromCard.rank}_${fromCard.suit}`;
    const script = (typeof LIFE_SCRIPTS !== 'undefined' ? LIFE_SCRIPTS : {})[key];
    const cc = derivedCardFor(planet, fromCard, script);
    if (!cc || cc.rank !== toCard.rank || cc.suit !== toCard.suit) return null;
    return { planet };
  }

  // Moon and Pluto also extend the seven Spiritual Spread seats by one card
  // on either side: Moon is before Mercury and Pluto is after Neptune.
  function spiritDerivedCardFor(planet, card) {
    if (typeof SPREAD_CARDS === 'undefined') return null;
    const idx = SPREAD_CARDS.findIndex(function (x) {
      return x.rank === card.rank && x.suit === card.suit;
    });
    const offset = planet === 'Moon' ? -1 : planet === 'Pluto' ? 8 : null;
    if (idx < 0 || offset === null) return null;
    const sc = SPREAD_CARDS[(idx + offset + 52) % 52];
    return sc ? { rank: sc.rank, suit: sc.suit, sym: sc.sym } : null;
  }

  function spiritDerivedConnection(planet, fromCard, toCard) {
    const cc = spiritDerivedCardFor(planet, fromCard);
    if (!cc || cc.rank !== toCard.rank || cc.suit !== toCard.suit) return null;
    return { planet };
  }

  function displacementConnections(fromCard, toCard) {
    const cards = window.CARDS || (typeof CARDS !== 'undefined' ? CARDS : null);
    if (typeof slDisplaces !== 'function' || typeof slDisplacedBy !== 'function' || !cards) return [];
    const idx = cards.findIndex(function (x) { return x.rank === fromCard.rank && x.suit === fromCard.suit; });
    if (idx < 0) return [];
    const pairs = [
      { kind: 'displaces', label: 'Displaces', idx: slDisplaces(idx) },
      { kind: 'displaced-by', label: 'Displaced by', idx: slDisplacedBy(idx) }
    ];
    const seen = {};
    return pairs.reduce(function (matches, pair) {
      if (pair.idx === idx || seen[pair.idx]) return matches;
      seen[pair.idx] = true;
      const cc = cards[pair.idx];
      if (cc && cc.rank === toCard.rank && cc.suit === toCard.suit) matches.push(pair);
      return matches;
    }, []);
  }

  function pushDisplacementSections(sections, fromCard, toCard, matches) {
    if (!matches || !matches.length) return;
    matches.forEach(function (match) {
      const displacer = match.kind === 'displaces' ? fromCard : toCard;
      const displaced = match.kind === 'displaces' ? toCard : fromCard;
      const duplicate = sections.some(function (section) {
        return section && section.type === 'displacement' &&
          section.displacer.rank === displacer.rank && section.displacer.suit === displacer.suit &&
          section.displaced.rank === displaced.rank && section.displaced.suit === displaced.suit;
      });
      if (!duplicate) sections.push({ type: 'displacement', displacer, displaced });
    });
  }

  // Does `toCard` match `fromCard`'s tropical (or sidereal) zodiac ruling
  // card, given `fromDate` — an actual birthdate, since (unlike every
  // other connection check) a zodiac sign needs a real calendar date, not
  // just a card. Cancer's ruler (Moon) is skipped: its ruling card is
  // already rendered as a standalone Earthly Spread Moon connection.
  // Leo's ruler (Sun) resolves to the birth card itself
  // (see derivedCardFor), so it only ever fires when both people share
  // the exact same card.
  function zodiacKindConnection(fromCard, fromDate, toCard, kind) {
    if (!fromDate) return null;
    let sign;
    if (kind === 'sidereal') {
      const sd = shiftedDate(fromDate.month, fromDate.day, SIDEREAL_LAHIRI_DAY_SHIFT);
      sign = zodiacForDate(sd.month, sd.day);
    } else {
      sign = zodiacForDate(fromDate.month, fromDate.day);
    }
    if (!sign || sign.ruler === 'Moon') return null;
    const key = `${fromCard.rank}_${fromCard.suit}`;
    const script = (typeof LIFE_SCRIPTS !== 'undefined' ? LIFE_SCRIPTS : {})[key];
    const cc = cardForRuler(sign.ruler, script, fromCard);
    if (!cc || cc.rank !== toCard.rank || cc.suit !== toCard.suit) return null;
    return { planet: sign.ruler, sign: sign.name, glyph: sign.glyph, kind };
  }

  function prcSignForDate(date, kind) {
    if (!date) return null;
    if (kind === 'sidereal') {
      const sd = shiftedDate(date.month, date.day, SIDEREAL_LAHIRI_DAY_SHIFT);
      return zodiacForDate(sd.month, sd.day);
    }
    if (kind === 'cusp') {
      const sign = zodiacForDate(date.month, date.day);
      return tropicalCuspSignForDate(sign, date.month, date.day);
    }
    return zodiacForDate(date.month, date.day);
  }

  function prcKindLabel(kind) {
    if (kind === 'sidereal') return 'sidereal';
    if (kind === 'cusp') return 'cusp';
    return 'tropical';
  }

  // Planetary-ruling-card path connection: find `fromCard`'s tropical
  // sign ruler, resolve that planet to its ruling card, then check whether
  // `toCard` sits in that ruling card's Earthly or Spiritual spread row.
  function tropicalRulingPathConnection(fromCard, fromDate, toCard, spread) {
    return rulingPathConnection(fromCard, fromDate, toCard, spread, 'tropical');
  }

  function rulingPathConnection(fromCard, fromDate, toCard, spread, kind) {
    const checker = spread === 'Spiritual Spread'
      ? window.spiritSpreadConnection
      : window.lifeScriptConnection;
    if (!fromDate || typeof checker !== 'function') return null;
    const sign = prcSignForDate(fromDate, kind);
    if (!sign) return null;
    const key = `${fromCard.rank}_${fromCard.suit}`;
    const script = (typeof LIFE_SCRIPTS !== 'undefined' ? LIFE_SCRIPTS : {})[key];
    const rulingCard = cardForRuler(sign.ruler, script, fromCard);
    if (!rulingCard || (rulingCard.rank === fromCard.rank && rulingCard.suit === fromCard.suit)) return null;
    const seat = checker(rulingCard, toCard);
    if (!seat) return null;
    return {
      planet: seat.planet,
      idx: seat.idx,
      spread: spread || 'Earthly Spread',
      ruler: sign.ruler,
      sign: sign.name,
      glyph: sign.glyph,
      kind: kind || 'tropical',
      rulingCard
    };
  }

  function tropicalRulingDerivedConnection(fromCard, fromDate, toCard, spread, planet) {
    return rulingDerivedConnection(fromCard, fromDate, toCard, spread, planet, 'tropical');
  }

  function rulingDerivedConnection(fromCard, fromDate, toCard, spread, planet, kind) {
    if (!fromDate || !planet) return null;
    const sign = prcSignForDate(fromDate, kind);
    if (!sign) return null;
    const key = `${fromCard.rank}_${fromCard.suit}`;
    const script = (typeof LIFE_SCRIPTS !== 'undefined' ? LIFE_SCRIPTS : {})[key];
    const rulingCard = cardForRuler(sign.ruler, script, fromCard);
    if (!rulingCard || (rulingCard.rank === fromCard.rank && rulingCard.suit === fromCard.suit)) return null;
    const match = spread === 'Spiritual Spread'
      ? spiritDerivedConnection(planet, rulingCard, toCard)
      : derivedConnection(planet, rulingCard, toCard);
    if (!match) return null;
    return {
      planet: planet,
      spread: spread || 'Earthly Spread',
      ruler: sign.ruler,
      sign: sign.name,
      glyph: sign.glyph,
      kind: kind || 'tropical',
      rulingCard
    };
  }

  function tropicalRulingCardFor(card, date) {
    return rulingCardForKind(card, date, 'tropical');
  }

  function rulingCardForKind(card, date, kind) {
    if (!date) return null;
    const sign = prcSignForDate(date, kind);
    if (!sign) return null;
    const key = `${card.rank}_${card.suit}`;
    const script = (typeof LIFE_SCRIPTS !== 'undefined' ? LIFE_SCRIPTS : {})[key];
    const rulingCard = cardForRuler(sign.ruler, script, card);
    if (!rulingCard || (rulingCard.rank === card.rank && rulingCard.suit === card.suit)) return null;
    return { rulingCard: rulingCard, ruler: sign.ruler, sign: sign.name, glyph: sign.glyph, kind: kind || 'tropical' };
  }

  function prcAsDerivedConnection(fromCard, otherCard, otherDate, spread, planet) {
    return prcAsDerivedConnectionKind(fromCard, otherCard, otherDate, spread, planet, 'tropical');
  }

  function prcAsDerivedConnectionKind(fromCard, otherCard, otherDate, spread, planet, kind) {
    if (!planet) return null;
    const prc = rulingCardForKind(otherCard, otherDate, kind);
    if (!prc) return null;
    const match = spread === 'Spiritual Spread'
      ? spiritDerivedConnection(planet, fromCard, prc.rulingCard)
      : derivedConnection(planet, fromCard, prc.rulingCard);
    if (!match) return null;
    return {
      planet: planet,
      spread: spread || 'Earthly Spread',
      ruler: prc.ruler,
      sign: prc.sign,
      glyph: prc.glyph,
      kind: kind || 'tropical',
      rulingCard: prc.rulingCard
    };
  }

  // Days in a zodiac sign's date range, handling the year-wrap for
  // Capricorn (Dec 22 → Jan 19).
  function signDayCount(sign) {
    // Base year 2001 (non-leap) so Feb has 28 days consistently.
    const start = Date.UTC(2001, sign.start[0] - 1, sign.start[1]);
    const endMonth = sign.end[0];
    const endYear  = (endMonth < sign.start[0]) ? 2002 : 2001;
    const end   = Date.UTC(endYear, endMonth - 1, sign.end[1]);
    return Math.round((end - start) / 86400000) + 1;
  }

  // Which decan (0 / 1 / 2) contains (month, day) inside `sign`?
  // Uses an even day-split within the sign's date range — accurate to within
  // a day or so, which is sufficient for 10°-wide buckets.
  function decanIdxForDate(sign, month, day) {
    if (!sign) return -1;
    const total = signDayCount(sign);
    const baseYear = 2001;
    const startMs = Date.UTC(baseYear, sign.start[0] - 1, sign.start[1]);
    const wrap = (sign.end[0] < sign.start[0]);
    const dayYear = (wrap && month <= sign.end[0]) ? baseYear + 1 : baseYear;
    const dayMs   = Date.UTC(dayYear, month - 1, day);
    const daysIn  = Math.round((dayMs - startMs) / 86400000);
    if (daysIn < 0) return -1;
    return Math.min(2, Math.floor(daysIn * 3 / total));
  }

  // Full-size stats card face — same visual language as the Ruling-card
  // row above the stats block (parchment face, pip layout, rank/suit
  // corners, sized by --ls-card-w which mirrors Quadrations).
  // Clickable: data-idx is picked up by bindLifeScriptCardClicks.
  function statsCardHTML(cc, opts) {
    opts = opts || {};
    if (!cc) return '';
    const face = typeof spreadCardPips === 'function'
      ? spreadCardPips(cc)
      : `<span class="ls-token">${cc.rank}${cc.sym}</span>`;
    const idx = (typeof CARDS !== 'undefined')
      ? CARDS.findIndex(function (x) { return x.rank === cc.rank && x.suit === cc.suit; })
      : -1;
    const extra = opts.extraCls ? ' ' + opts.extraCls : '';
    const title = opts.title || fullCardName(cc);
    return `<div class="spread-card ls-card ls-stat-card ${cc.suit}${extra}" data-idx="${idx}" role="button" tabindex="0" aria-label="Load ${fullCardName(cc)} in finder" title="${title}">${face}</div>`;
  }

  // A card's seat for any of the seven Life Script planets (via the
  // LIFE_SCRIPTS table) or Sun/Moon/Pluto (via derivedCardFor's Life
  // Spread extension). Shared by the Zodiac stats row and the
  // relationship Connections' zodiac-ruler check.
  function cardForRuler(ruler, script, birthCard) {
    const planetIdx = SPREAD_PLANETS.indexOf(ruler);
    if (planetIdx >= 0 && script && script[planetIdx]) return parseCard(script[planetIdx]);
    if (ruler === 'Moon' || ruler === 'Sun' || ruler === 'Pluto') return derivedCardFor(ruler, birthCard, script);
    return null;
  }

  function zodiacCardSlotHTML(label, ruler, script, birthCard, title, extraCls) {
    const glyph = SPREAD_PLANET_SYM[ruler] || '';
    const rulerLabel = ruler.slice(0, 3).toUpperCase();
    const cc = cardForRuler(ruler, script, birthCard);
    const cardHTML = cc ? statsCardHTML(cc, { title: `${ruler} ruling card` }) : '';
    const labelHTML = label && typeof label === 'object'
      ? `<span class="ls-zodiac-card-label">${label.primary}<small>${label.secondary}</small></span>`
      : (label ? `<span class="ls-zodiac-card-label">${label}</span>` : '');
    return `<div class="ls-zodiac-card-slot${extraCls ? ' ' + extraCls : ''}">
      ${labelHTML}
      <span class="ls-planet-glyph" title="${title}">${glyph}</span>
      <span class="ls-planet-name" title="${title}">${rulerLabel}</span>
      ${cardHTML}
    </div>`;
  }

  function decanCardSlotsHTML(sign, decanIdx, script, birthCard) {
    if (!sign || decanIdx < 0) return '';
    const signIdx = SIGN_ASTRO_IDX[sign.name];
    if (signIdx === undefined) return '';
    const globalDecan = signIdx * 3 + decanIdx;
    const chaldean  = CHALDEAN_ORDER[globalDecan % 7];
    const ptolemaic = PTOLEMAIC_DECANS[signIdx][decanIdx];
    const label = `${DECAN_ORDINAL[decanIdx]} decan`;
    const variantHTML = function (kind, decanLabel, ruler, hidden) {
      const glyph = SPREAD_PLANET_SYM[ruler] || '';
      const rulerText = glyph ? `${glyph} ${ruler}` : ruler;
      const cc = cardForRuler(ruler, script, birthCard);
      const cardHTML = cc ? statsCardHTML(cc, { title: `${label}: ${ruler} — ${decanLabel}` }) : '';
      const nextKind = kind === 'ptolemaic' ? 'Chaldean' : 'Ptolemaic';
      const arrow = kind === 'ptolemaic' ? '→' : '←';
      return `<div class="ls-decan-variant" data-decan-kind="${kind}"${hidden ? ' hidden' : ''}>
        <span class="ls-zodiac-card-label">${decanLabel}</span>
        <span class="ls-stat-chip" title="${label}: ${ruler} — ${decanLabel}">${rulerText}</span>
        <div class="ls-decan-card-line">
          ${cardHTML}
          <button type="button" class="ls-decan-cycle" data-decan-cycle aria-label="Show ${nextKind} decan" title="Show ${nextKind} decan">${arrow}</button>
        </div>
      </div>`;
    };
    return {
      slot: `<div class="ls-zodiac-card-slot ls-decan-slot" data-decan-switch>
        ${variantHTML('ptolemaic', 'Ptolemaic decan', ptolemaic, false)}
        ${variantHTML('chaldean', 'Chaldean decan', chaldean, true)}
      </div>`
    };
  }

  function rulingCardSlotHTML(sign, script, birthCard) {
    if (!sign) return '';
    const ruler = sign.ruler;
    return zodiacCardSlotHTML('', ruler, script, birthCard, `${ruler} planetary ruling card`, 'ls-prc-slot');
  }

  function cuspCardSlotHTML(sign, script, birthCard) {
    if (!sign) return '';
    const ruler = sign.ruler;
    const title = `Tropical cusp possibility: ${sign.glyph} ${sign.name}, ${ruler} ruling card`;
    return zodiacCardSlotHTML({ primary: 'Cusp', secondary: `${sign.glyph} ${sign.name}` }, ruler, script, birthCard, title, 'ls-prc-slot ls-prc-cusp-slot');
  }

  function prcCardletHTML(kind, sign, signTitle, script, birthCard, opts) {
    opts = opts || {};
    const cuspHTML = opts.cuspSign ? cuspCardSlotHTML(opts.cuspSign, script, birthCard) : '';
    return `<section class="ls-prc-cardlet">
      <div class="ls-prc-sign">
        <span class="ls-zodiac-kind">${kind}</span>
        <span class="ls-stat-chip" title="${signTitle}">${sign.glyph} ${sign.name}</span>
      </div>
      <div class="ls-prc-card-row${cuspHTML ? ' has-cusp' : ''}">
        ${cuspHTML}
        ${rulingCardSlotHTML(sign, script, birthCard)}
      </div>
    </section>`;
  }

  function zodiacStatsHTML(card, script) {
    const date = selectedBirthDateForCard(card);
    if (!date) return '';
    const sign = zodiacForDate(date.month, date.day);
    if (!sign) return '';
    const siderealDate = shiftedDate(date.month, date.day, SIDEREAL_LAHIRI_DAY_SHIFT);
    const siderealSign = zodiacForDate(siderealDate.month, siderealDate.day);
    const cuspSign = tropicalCuspSignForDate(sign, date.month, date.day);

    const tropicalHTML = prcCardletHTML('Tropical', sign, 'Tropical sun sign', script, card, { cuspSign });
    const siderealHTML = siderealSign
      ? prcCardletHTML('Sidereal', siderealSign, 'Sidereal sign, Lahiri-style birthday approximation', script, card)
      : '';
    return `<div class="ls-stat-block ls-zodiac-block">
      <div class="ls-zodiac-heading">
        <h3 class="ls-stat-label">Planetary Ruling Cards</h3>
      </div>
      <div class="ls-prc-grid">
        ${tropicalHTML}
        ${siderealHTML}
      </div>
    </div>`;
  }

  // Displacement ghost chips for one ruling card — mirrors the
  // Quadrations grid's .sl-ghost pair (Displaces / Displaced).
  // `idx` is the card's position in CARDS/SPREAD_CARDS' shared solar
  // order (what slDisplaces/slDisplacedBy expect). Fixed/semi-fixed
  // cards (where the seat displaces itself) render a note instead of an
  // empty-looking pair.
  function ghostRowHTML(idx) {
    if (typeof slDisplaces !== 'function' || typeof slDisplacedBy !== 'function' ||
        typeof SPREAD_CARDS === 'undefined' || idx < 0) return '';
    const displacesIdx = slDisplaces(idx);
    const displacedByIdx = slDisplacedBy(idx);
    if (displacesIdx === idx && displacedByIdx === idx) {
      return '<p class="ls-displacement-note">No displacement pair. This card holds its own seat in the Life Spread.</p>';
    }
    const isMutualPair = displacesIdx === displacedByIdx;
    const pairs = [
      ['Displaces', displacesIdx],
      ['Displaced', displacedByIdx]
    ];
    const chips = pairs.map(function (pair) {
      const verb = pair[0], oIdx = pair[1];
      const oc = SPREAD_CARDS[oIdx];
      if (!oc) return '';
      const selfCls = oIdx === idx ? ' ls-ghost-self' : '';
      const cardHTML = statsCardHTML(oc, {
        extraCls: 'ls-ghost' + selfCls,
        title: `${verb} ${fullCardName(oc)}`
      });
      return `<div class="ls-ghost-pair">
        <div class="ls-ghost-label">${verb}</div>
        ${cardHTML}
      </div>`;
    }).join('');
    const mutualNote = isMutualPair
      ? '<p class="ls-displacement-note ls-displacement-note--pair">Semi-fixed pair. These two cards exchange places with each other in the Life Spread.</p>'
      : '';
    return `<div class="ls-ghost-row">${chips}</div>${mutualNote}`;
  }

  function earthlySeatPlanetsHTML(card) {
    if (typeof deckAtAge !== 'function' || typeof CARDS === 'undefined') return '';
    const idx = CARDS.findIndex(function (x) { return x.rank === card.rank && x.suit === card.suit; });
    if (idx < 0) return '';
    const life = deckAtAge(1);
    const pos = life.indexOf(idx);
    if (pos < 0) return '';
    if (pos >= 49) return planetButtonHTML('Crown', 'Crown row');
    const rowPlanet = SPREAD_PLANETS[Math.floor(pos / 7)];
    const colPlanet = SPREAD_PLANETS[pos % 7];
    const planets = (window.PLANET_ORDER || SPREAD_PLANETS).map(function (planet) {
      if (planet !== rowPlanet && planet !== colPlanet) return '';
      const positions = [];
      if (pos < 49 && planet === rowPlanet) positions.push('Row');
      if (pos < 49 && planet === colPlanet) positions.push('Column');
      return planetButtonHTML(planet, positions.join(' + '));
    }).join('');
    return planets;
  }

  function planetButtonHTML(planet, title) {
    const glyph = SPREAD_PLANET_SYM[planet] || '';
    return `<button type="button" class="ls-stat-chip ls-planet-link" data-planet="${planet}" aria-expanded="false" aria-controls="fAboutPlanetInfo" aria-label="Read about ${planet}${title ? ', ' + title : ''}"><span>${glyph ? glyph + ' ' : ''}${planet}</span>${title ? `<small>${title}</small>` : ''}</button>`;
  }

  function escHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>\"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  let planetWheelTotal = 0;
  let planetWheelUsed = false;
  let planetWheelCanRearm = false;
  let planetWheelDirection = 0;
  let planetWheelTimer = null;

  function clearPlanetInfo() {
    document.querySelectorAll('.ls-planet-link').forEach(function (button) {
      button.setAttribute('aria-expanded', 'false');
    });
    const panel = document.getElementById('fAboutPlanetInfo');
    if (!panel) return;
    panel.hidden = true;
    panel.innerHTML = '';
  }

  function renderPlanetInfo(planet) {
    const data = window.PLANET_DATA && window.PLANET_DATA[planet];
    const panel = document.getElementById('fAboutPlanetInfo');
    if (!data || !panel) return;
    panel.dataset.planet = planet;
    const paragraphs = (data.text || []).map(function (paragraph) {
      return `<p class="about-planet-copy">${escHTML(paragraph)}</p>`;
    }).join('');
    panel.innerHTML = `<div id="fAboutPlanetReading" tabindex="0">
      <div class="about-planet-head">
        <button type="button" class="age-btn" data-planet-step="-1" aria-label="Previous planet">‹</button>
        <span class="about-planet-glyph" aria-hidden="true">${escHTML(data.glyph || (SPREAD_PLANET_SYM[planet] || ''))}</span>
        <div><h4>${escHTML(planet)}</h4><p>${escHTML(data.epithet || '')}</p></div>
        <button type="button" class="age-btn" data-planet-step="1" aria-label="Next planet">›</button>
      </div>
      <p class="about-planet-synopsis">${escHTML(data.synopsis || '')}</p>
      ${paragraphs}
    </div>`;
    function movePlanet(direction, focusButton) {
      const order = (window.PLANET_ORDER || SPREAD_PLANETS).slice();
      if (!order.includes('Crown')) order.push('Crown');
      const next = order[(order.indexOf(planet) + direction + order.length) % order.length];
      openPlanetFromStats(next);
      if (focusButton) panel.querySelector(`[data-planet-step="${direction}"]`).focus({ preventScroll: true });
    }
    panel.querySelectorAll('[data-planet-step]').forEach(function (button) {
      button.addEventListener('click', function () { movePlanet(Number(button.dataset.planetStep), true); });
    });
    const reading = panel.querySelector('#fAboutPlanetReading');
    let touch = null;
    reading.addEventListener('touchstart', function (event) {
      touch = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
    }, { passive: true });
    reading.addEventListener('touchcancel', function () { touch = null; }, { passive: true });
    reading.addEventListener('touchend', function (event) {
      if (!touch || !event.changedTouches.length) return;
      const dx = event.changedTouches[0].clientX - touch.x;
      const dy = event.changedTouches[0].clientY - touch.y;
      touch = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) movePlanet(dx < 0 ? 1 : -1, false);
    }, { passive: true });
    reading.addEventListener('wheel', function (event) {
      if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.25) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : (event.deltaMode === 2 ? window.innerWidth : 1);
      const delta = event.deltaX * unit;
      const magnitude = Math.abs(delta);
      const direction = Math.sign(delta);
      if (planetWheelUsed) {
        if (magnitude <= 3) planetWheelCanRearm = true;
        if ((planetWheelCanRearm && magnitude >= 8) ||
            (direction !== planetWheelDirection && magnitude >= 8)) {
          planetWheelTotal = 0;
          planetWheelUsed = false;
          planetWheelCanRearm = false;
        }
      }
      if (!planetWheelUsed) planetWheelTotal += delta;
      if (!planetWheelUsed && Math.abs(planetWheelTotal) >= 32) {
        planetWheelUsed = true;
        planetWheelDirection = Math.sign(planetWheelTotal);
        movePlanet(planetWheelTotal > 0 ? 1 : -1, false);
      }
      if (planetWheelTimer !== null) window.clearTimeout(planetWheelTimer);
      planetWheelTimer = window.setTimeout(function () {
        planetWheelTotal = 0;
        planetWheelUsed = false;
        planetWheelCanRearm = false;
        planetWheelDirection = 0;
        planetWheelTimer = null;
      }, 90);
    }, { passive: false });
    reading.addEventListener('keydown', function (event) {
      if (event.target !== reading) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        movePlanet(event.key === 'ArrowLeft' ? -1 : 1, false);
        panel.querySelector('#fAboutPlanetReading').focus({ preventScroll: true });
      }
    });
  }

  function openPlanetFromStats(planet) {
    const data = window.PLANET_DATA && window.PLANET_DATA[planet];
    const panel = document.getElementById('fAboutPlanetInfo');
    if (!data || !panel) return;
    if (!panel.hidden && panel.dataset.planet === planet) {
      clearPlanetInfo();
      return;
    }
    renderPlanetInfo(planet);
    panel.hidden = false;
    document.querySelectorAll('.ls-planet-link').forEach(function (button) {
      button.setAttribute('aria-expanded', String(button.dataset.planet === planet));
    });
  }

  function datesHTML(dates) {
    if (!dates) return '';
    const items = String(dates).split(/\s*,\s*/).filter(Boolean);
    const rows = [];
    for (let i = 0; i < items.length; i += 6) rows.push(items.slice(i, i + 6));
    return `<div class="ls-date-grid">${rows.map(function (row) {
      return `<div class="ls-date-row">${row.map(function (date) {
        const parsed = parseCardDate(date);
        if (!parsed) return `<span class="ls-date-item">${escHTML(date)}</span>`;
        return `<button type="button" class="ls-date-item" data-ls-date-month="${parsed.month}" data-ls-date-day="${parsed.day}" aria-label="Load ${escHTML(date)} in Finder">${escHTML(date)}</button>`;
      }).join('')}</div>`;
    }).join('')}</div>`;
  }

  function parseCardDate(value) {
    const match = /^([A-Za-z]{3})\s+(\d{1,2})$/.exec(String(value || '').trim());
    if (!match) return null;
    const months = {
      Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
      Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
    };
    const month = months[match[1]];
    const day = parseInt(match[2], 10);
    if (!month || !day) return null;
    return { month: month, day: day };
  }

  function birthStatsHTML(card, script) {
    const key = `${card.rank}_${card.suit}`;
    const entry = (window.CARD_READINGS || {})[key];
    const dates = entry && entry.dates ? entry.dates : '';
    const idx = (typeof CARDS !== 'undefined')
      ? CARDS.findIndex(function (x) { return x.rank === card.rank && x.suit === card.suit; })
      : -1;
    const planetsHTML = earthlySeatPlanetsHTML(card);

    return `<div class="ls-stats">
      ${dates ? `<div class="ls-stat-block">
        <div class="ls-stat-label">Dates</div>
        ${datesHTML(dates)}
      </div>` : ''}
      <div class="ls-stat-block">
        <div class="ls-stat-label">Quadration Chart Position</div>
        <div class="ls-stat-chips qcp-planets" role="group" aria-label="Planetary readings">${planetsHTML}</div>
      </div>
      <div class="ls-stat-block">
        <div class="ls-stat-label">Displacements</div>
        ${ghostRowHTML(idx)}
      </div>
      ${zodiacStatsHTML(card, script)}
    </div>`;
  }

  function scriptRowHTML(card, highlight) {
    const key = `${card.rank}_${card.suit}`;
    const script = (typeof LIFE_SCRIPTS !== 'undefined' ? LIFE_SCRIPTS : {})[key];
    if (!script) return '';
    const ltr = readsLeftToRight();
    const displayScript = ltr ? [...script] : [...script].reverse();
    const planetOrder = ltr ? [0,1,2,3,4,5,6] : [6,5,4,3,2,1,0];
    return displayScript.map((cardStr, i) => {
      const cc = parseCard(cardStr);
      const planet = SPREAD_PLANETS[planetOrder[i]];
      const label = planet.slice(0, 3).toUpperCase();
      const sym = SPREAD_PLANET_SYM[planet];
      const isPick = highlight && cc.rank === highlight.rank && cc.suit === highlight.suit;
      const face = typeof spreadCardPips === 'function'
        ? spreadCardPips(cc)
        : `<span class="ls-token">${cc.rank}${cc.sym}</span>`;
      const idx = (typeof CARDS !== 'undefined')
        ? CARDS.findIndex(function (x) { return x.rank === cc.rank && x.suit === cc.suit; })
        : -1;
      return `<div class="ls-col" data-planet="${planet}">
        <span class="ls-planet-glyph" title="${planet}">${sym}</span>
        <span class="ls-planet-name" title="${planet}">${label}</span>
        <div class="spread-card ls-card ${cc.suit}${isPick ? ' ls-conn-pick' : ''}" data-idx="${idx}" role="button" tabindex="0" aria-label="Load ${fullCardName(cc)} in finder">${face}</div>
      </div>`;
    }).join('');
  }

  // Same shape as scriptRowHTML, but the 7-card row is the seven cards
  // that immediately follow `card` in the standard 52-card cycle
  // (SPREAD_CARDS order, wrapping past the King of Spades back to the
  // Ace of Hearts) rather than its fixed LIFE_SCRIPTS entry, so it stays
  // in sync with spiritSpreadConnection.
  function spiritRowHTML(card, highlight) {
    if (typeof SPREAD_CARDS === 'undefined') return '';
    const idx = SPREAD_CARDS.findIndex(function (c) { return c.rank === card.rank && c.suit === card.suit; });
    if (idx < 0) return '';
    const rowCards = [];
    for (let i = 1; i <= 7; i++) rowCards.push(SPREAD_CARDS[(idx + i) % 52]);
    const ltr = readsLeftToRight();
    const displayScript = ltr ? rowCards : [...rowCards].reverse();
    const planetOrder = ltr ? [0,1,2,3,4,5,6] : [6,5,4,3,2,1,0];
    return displayScript.map((cc, i) => {
      const planet = SPREAD_PLANETS[planetOrder[i]];
      const label = planet.slice(0, 3).toUpperCase();
      const sym = SPREAD_PLANET_SYM[planet];
      const isPick = highlight && cc.rank === highlight.rank && cc.suit === highlight.suit;
      const face = typeof spreadCardPips === 'function'
        ? spreadCardPips(cc)
        : `<span class="ls-token">${cc.rank}${cc.sym}</span>`;
      const cardIdx = (typeof CARDS !== 'undefined')
        ? CARDS.findIndex(function (x) { return x.rank === cc.rank && x.suit === cc.suit; })
        : -1;
      return `<div class="ls-col" data-planet="${planet}">
        <span class="ls-planet-glyph" title="${planet}">${sym}</span>
        <span class="ls-planet-name" title="${planet}">${label}</span>
        <div class="spread-card ls-card ${cc.suit}${isPick ? ' ls-conn-pick' : ''}" data-idx="${cardIdx}" role="button" tabindex="0" aria-label="Load ${fullCardName(cc)} in finder">${face}</div>
      </div>`;
    }).join('');
  }

  // Single-card counterpart to scriptRowHTML/spiritRowHTML: same `.ls-col`
  // markup (planet glyph + label + card face) but just one card, not a
  // 7-card row. Used for Moon and Pluto (single derived seats)
  // and for the zodiac-ruler connection (a single ruling card for
  // whichever planet governs the person's sign, via cardForRuler).
  function singleSeatHTML(planet, cc, highlight) {
    if (!cc) return '';
    const label = planet.slice(0, 3).toUpperCase();
    const sym = SPREAD_PLANET_SYM[planet];
    const isPick = highlight && cc.rank === highlight.rank && cc.suit === highlight.suit;
    const face = typeof spreadCardPips === 'function'
      ? spreadCardPips(cc)
      : `<span class="ls-token">${cc.rank}${cc.sym}</span>`;
    const cardIdx = (typeof CARDS !== 'undefined')
      ? CARDS.findIndex(function (x) { return x.rank === cc.rank && x.suit === cc.suit; })
      : -1;
    return `<div class="ls-col" data-planet="${planet}">
      <span class="ls-planet-glyph" title="${planet}">${sym}</span>
      <span class="ls-planet-name" title="${planet}">${label}</span>
      <div class="spread-card ls-card ${cc.suit}${isPick ? ' ls-conn-pick' : ''}" data-idx="${cardIdx}" role="button" tabindex="0" aria-label="Load ${fullCardName(cc)} in finder">${face}</div>
    </div>`;
  }

  function derivedSeatHTML(planet, card, highlight) {
    const key = `${card.rank}_${card.suit}`;
    const script = (typeof LIFE_SCRIPTS !== 'undefined' ? LIFE_SCRIPTS : {})[key];
    return singleSeatHTML(planet, cardForRuler(planet, script, card), highlight);
  }

  function spiritDerivedSeatHTML(planet, card, highlight) {
    return singleSeatHTML(planet, spiritDerivedCardFor(planet, card), highlight);
  }

  function panelHTML(card) {
    if (card.suit === 'joker') {
      return `<div class="ls-header">
        <h3 class="ls-title">Life Script</h3>
        <p class="ls-lede">The Joker's script</p>
      </div>
      <p class="ls-joker-note">The Joker sits above the Sun Line in every Master Script and belongs to no single planetary influence. The 52 cards account for 52 weeks, leaving 1&frac14; days as remainder. Without a fixed life path, the Joker's work is to consciously choose which card to embody.</p>`;
    }
    const key = `${card.rank}_${card.suit}`;
    const script = (typeof LIFE_SCRIPTS !== 'undefined' ? LIFE_SCRIPTS : {})[key];
    if (!script) return '';

    const rowHTML = scriptRowHTML(card);

    return `<div class="ls-row">${rowHTML}</div>
    ${birthStatsHTML(card, script)}`;
  }

  // Split the generated reading into the compact birth data at the top and
  // the interpretive card map below. Quadration Chart Position closes the map.
  function clearAboutLifeScript() {
    clearPlanetInfo();
    const target = document.getElementById('fAboutLifeScript');
    const topTarget = document.getElementById('fAboutModernStats');
    const planetInfo = document.getElementById('fAboutPlanetInfo');
    // The panel is moved into the Quadration Chart Position stat block after
    // each render. Detach
    // it before clearing that block so later card selections can still reuse it.
    if (planetInfo) planetInfo.remove();
    if (target) target.innerHTML = '';
    if (topTarget) topTarget.innerHTML = '';
    if (planetInfo && target) target.appendChild(planetInfo);
    return target;
  }

  function splitAboutLifeScript(root) {
    const target = document.getElementById('fAboutLifeScript');
    const topTarget = document.getElementById('fAboutModernStats');
    const inner = root && root.querySelector('.ls-inner');
    if (!target || !topTarget || !inner) return;
    const planetInfo = document.getElementById('fAboutPlanetInfo');
    target.innerHTML = '';
    topTarget.innerHTML = '';
    const header = inner.querySelector('.ls-header');
    const row = inner.querySelector('.ls-row');
    const stats = inner.querySelector('.ls-stats');
    if (!row && !stats) {
      while (inner.firstChild) target.appendChild(inner.firstChild);
      return;
    }
    if (stats) {
      const statBlocks = {};
      Array.from(stats.children).forEach(function (block) {
        const label = block.querySelector('.ls-stat-label');
        const text = label ? label.textContent.trim() : '';
        if (text === 'Dates' || text === 'Displacements' || text === 'Quadration Chart Position') statBlocks[text] = block;
      });
      const topStats = document.createElement('div');
      topStats.className = 'ls-stats ls-stats--about';
      ['Dates'].forEach(function (label) {
        if (statBlocks[label]) topStats.appendChild(statBlocks[label]);
      });
      if (topStats.children.length) topTarget.appendChild(topStats);

      const zodiac = stats.querySelector('.ls-zodiac-block');
      if (zodiac) target.appendChild(zodiac);

      if (header) target.appendChild(header);

      if (row) {
        const rulingCardsBlock = document.createElement('section');
        rulingCardsBlock.className = 'ls-stat-block ls-ruling-cards-block';
        rulingCardsBlock.setAttribute('aria-label', 'Life Script');
        rulingCardsBlock.innerHTML = '<h3 class="ls-stat-label">Life Script</h3>';
        rulingCardsBlock.appendChild(row);
        target.appendChild(rulingCardsBlock);
      }

      const lowerStats = document.createElement('div');
      lowerStats.className = 'ls-stats ls-stats--about';
      if (statBlocks.Displacements) lowerStats.appendChild(statBlocks.Displacements);
      if (lowerStats.children.length) target.appendChild(lowerStats);

      if (statBlocks['Quadration Chart Position']) {
        if (planetInfo) statBlocks['Quadration Chart Position'].appendChild(planetInfo);
        target.appendChild(statBlocks['Quadration Chart Position']);
      }
    }
  }

  function bindZodiacTabs(root) {
    const scope = root || document;
    const groupBlocks = function () {
      return Array.prototype.slice.call(scope.querySelectorAll('[data-zodiac-group="astrology"]'));
    };
    const primary = groupBlocks().find(function (block) { return block.querySelector('[data-zodiac-tab]'); });
    if (!primary) return;

    function sync(kind, focusTab) {
      groupBlocks().forEach(function (block) {
        block.dataset.zodiacActive = kind;
        block.querySelectorAll('[data-zodiac-tab]').forEach(function (button) {
          const on = button.dataset.zodiacTab === kind;
          button.classList.toggle('is-active', on);
          button.setAttribute('aria-selected', on ? 'true' : 'false');
          button.tabIndex = on ? 0 : -1;
        });
      });
      if (focusTab) focusTab.focus();
    }

    groupBlocks().forEach(function (block) {
      if (block.dataset.zodiacBound === 'true') return;
      block.dataset.zodiacBound = 'true';
      const tabs = Array.prototype.slice.call(block.querySelectorAll('[data-zodiac-tab]'));
      tabs.forEach(function (tab) {
        if (tab.getAttribute('aria-selected') !== 'true') tab.tabIndex = -1;
      });

      block.addEventListener('click', function (event) {
        const tab = event.target.closest('[data-zodiac-tab]');
        if (tab && !tab.disabled) sync(tab.dataset.zodiacTab, null);
      });
      block.addEventListener('keydown', function (event) {
        const tab = event.target.closest('[data-zodiac-tab]');
        if (!tab) return;
        const usable = tabs.filter(function (t) { return !t.disabled; });
        const i = usable.indexOf(tab);
        if (i < 0 || !usable.length) return;
        let next = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = usable[(i + 1) % usable.length];
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = usable[(i + usable.length - 1) % usable.length];
        if (event.key === 'Home') next = usable[0];
        if (event.key === 'End') next = usable[usable.length - 1];
        if (next) {
          event.preventDefault();
          sync(next.dataset.zodiacTab, next);
        }
      });
    });

    sync(primary.dataset.zodiacActive || 'tropical', null);
  }

  function renderLifeScript(card) {
    clearAboutLifeScript();
    if (!card) return false;
    // Joker has its own prose note, which now lives in About with the rest
    // of the selected card's reading.
    if (card.suit === 'joker') {
      const jokerStage = document.createElement('div');
      jokerStage.innerHTML = '<div class="ls-inner">' + panelHTML(card) + '</div>';
      splitAboutLifeScript(jokerStage);
      return true;
    }
    const key = `${card.rank}_${card.suit}`;
    if (!(typeof LIFE_SCRIPTS !== 'undefined' && LIFE_SCRIPTS[key])) {
      return false;
    }
    const stage = document.createElement('div');
    stage.innerHTML = '<div class="ls-inner">' + panelHTML(card) + '</div>';
    splitAboutLifeScript(stage);
    bindLifeScriptCardClicks(document.getElementById('fAboutLifeScript'));
    bindLifeScriptCardClicks(document.getElementById('fAboutModernStats'));
    bindLifeScriptDateClicks(document.getElementById('fAboutModernStats'));
    return true;
  }

  function trimLifeDetailsForRelationship() {
    const topTarget = document.getElementById('fAboutModernStats');
    const target = document.getElementById('fAboutLifeScript');
    if (topTarget) {
      topTarget.querySelectorAll('.ls-zodiac-block').forEach(function (block) { block.remove(); });
    }
    if (!target) return;
    target.querySelectorAll('.ls-zodiac-block, .ls-header, .ls-ruling-cards-block').forEach(function (block) { block.remove(); });
    target.querySelectorAll('.ls-stat-block').forEach(function (block) {
      const label = block.querySelector('.ls-stat-label');
      if (label && label.textContent.trim() === 'Displacements') block.remove();
    });
    target.querySelectorAll('.ls-stats:empty').forEach(function (block) { block.remove(); });
  }

  function bindLifeScriptCardClicks(root) {
    if (!root) return;
    root.querySelectorAll('.ls-planet-link[data-planet]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openPlanetFromStats(btn.dataset.planet);
      });
    });
    root.querySelectorAll('.ls-card[data-idx]').forEach(function (el) {
      const idx = +el.dataset.idx;
      if (!Number.isInteger(idx) || idx < 0) return;
      const open = function () {
        if (typeof window.loadCardInFinder === 'function') window.loadCardInFinder(idx, el);
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

  function bindLifeScriptDateClicks(root) {
    if (!root || root.dataset.boundLsDates) return;
    root.addEventListener('click', function (ev) {
      const button = ev.target.closest('[data-ls-date-month][data-ls-date-day]');
      if (!button || !root.contains(button)) return;
      const month = parseInt(button.dataset.lsDateMonth || '0', 10);
      const day = parseInt(button.dataset.lsDateDay || '0', 10);
      if (!month || !day || typeof window.loadDateInFinder !== 'function') return;
      window.loadDateInFinder(month, day);
      const mapTab = document.getElementById('fReadingMapTab');
      if (mapTab) mapTab.click();
    });
    root.dataset.boundLsDates = '1';
  }

  function bindDecanCycles(root) {
    if (!root) return;
    root.querySelectorAll('[data-decan-cycle]').forEach(function (button) {
      if (button.dataset.decanBound === 'true') return;
      button.dataset.decanBound = 'true';
      button.addEventListener('click', function () {
        const slot = button.closest('[data-decan-switch]');
        if (!slot) return;
        const active = slot.querySelector('.ls-decan-variant:not([hidden])');
        const nextKind = active && active.dataset.decanKind === 'chaldean' ? 'ptolemaic' : 'chaldean';
        slot.querySelectorAll('.ls-decan-variant').forEach(function (variant) {
          variant.hidden = variant.dataset.decanKind !== nextKind;
        });
        // Deliberately NO label rewriting here. Each variant carries its own
        // button, already generated pointing at the other system, and after
        // this flip the clicked button belongs to the variant we just HID —
        // so rewriting it both named the wrong system (the one now showing)
        // and updated a button the visitor can no longer see, which left the
        // visible one permanently stale.
      });
    });
  }

  // One "X sits in Y's Z seat" block. `rowHTML` is either scriptRowHTML's
  // or spiritRowHTML's output; `spreadLabel` names which spread the seat
  // was found in, since the same planet name can turn up in both.
  function connectionSectionHTML(spreadLabel, fromCard, toCard, result, rowHTML, single, notesHTML) {
    return `<section class="ls-connection">
      <p class="ls-connection-title"><b>${fullCardName(toCard)}</b> sits in <b>${fullCardName(fromCard)}</b>'s <b>${result.planet}</b> seat of the ${spreadLabel}.</p>
      ${notesHTML || ''}
      <div class="ls-row${single ? ' ls-row--single' : ''}">${rowHTML}</div>
      <p class="ls-connection-gloss">${(window.PLANET_CONN_TEXT || {})[result.planet] || ''}</p>
    </section>`;
  }

  function zodiacKindLabel(result) {
    return `${result.kind === 'sidereal' ? 'Sidereal' : 'Tropical'} ${result.glyph} ${result.sign}`;
  }

  function zodiacNoteHTML(matches) {
    if (!matches || !matches.length) return '';
    const labels = matches.map(zodiacKindLabel).join(' and ');
    return `<p class="ls-connection-note">Also ${matches.length > 1 ? 'the ' : ''}${labels} ruling card.</p>`;
  }

  function zodiacMatchesSeat(zod, seat) {
    return !!(zod && seat && zod.planet === seat.planet);
  }

  // Zodiac-ruler connection section — phrased around rulership rather
  // than a Life Script "seat", since the match comes from an actual
  // birthdate's sign rather than the card cycle.
  function zodiacConnectionSectionHTML(fromCard, toCard, result, rowHTML) {
    const kindLabel = result.kind === 'sidereal' ? 'Sidereal' : 'Tropical';
    return `<section class="ls-connection">
      <p class="ls-connection-title"><b>${fullCardName(toCard)}</b> is <b>${fullCardName(fromCard)}</b>'s <b>${result.planet}</b> ruling card &mdash; ${kindLabel} ${result.glyph} ${result.sign}.</p>
      <div class="ls-row ls-row--single">${rowHTML}</div>
      <p class="ls-connection-gloss">${(window.PLANET_CONN_TEXT || {})[result.planet] || ''}</p>
    </section>`;
  }

  function rulingPathConnectionSectionHTML(fromCard, toCard, result) {
    const rowHTML = result.spread === 'Spiritual Spread'
      ? spiritRowHTML(result.rulingCard, toCard)
      : scriptRowHTML(result.rulingCard, toCard);
    const label = prcKindLabel(result.kind);
    return `<section class="ls-connection">
      <p class="ls-connection-title"><b>${fullCardName(toCard)}</b> sits in the <b>${result.planet}</b> seat of <b>${fullCardName(result.rulingCard)}</b>'s ${result.spread} &mdash; <b>${fullCardName(fromCard)}</b>'s ${label} ${result.glyph} ${result.sign} / ${result.ruler} ruling card.</p>
      <div class="ls-row">${rowHTML}</div>
      <p class="ls-connection-gloss">${(window.PLANET_CONN_TEXT || {})[result.planet] || ''}</p>
    </section>`;
  }

  function rulingDerivedConnectionSectionHTML(fromCard, toCard, result) {
    const rowHTML = result.spread === 'Spiritual Spread'
      ? spiritDerivedSeatHTML(result.planet, result.rulingCard, toCard)
      : derivedSeatHTML(result.planet, result.rulingCard, toCard);
    const label = prcKindLabel(result.kind);
    return `<section class="ls-connection">
      <p class="ls-connection-title"><b>${fullCardName(toCard)}</b> sits in the <b>${result.planet}</b> extension of <b>${fullCardName(result.rulingCard)}</b>'s ${result.spread} &mdash; <b>${fullCardName(fromCard)}</b>'s ${label} ${result.glyph} ${result.sign} / ${result.ruler} ruling card.</p>
      <div class="ls-row ls-row--single">${rowHTML}</div>
      <p class="ls-connection-gloss">${(window.PLANET_CONN_TEXT || {})[result.planet] || ''}</p>
    </section>`;
  }

  function prcAsDerivedConnectionSectionHTML(fromCard, otherCard, result) {
    const rowHTML = result.spread === 'Spiritual Spread'
      ? spiritDerivedSeatHTML(result.planet, fromCard, result.rulingCard)
      : derivedSeatHTML(result.planet, fromCard, result.rulingCard);
    const label = prcKindLabel(result.kind);
    return `<section class="ls-connection">
      <p class="ls-connection-title"><b>${fullCardName(otherCard)}</b>'s ${label} ${result.glyph} ${result.sign} / ${result.ruler} ruling card, <b>${fullCardName(result.rulingCard)}</b>, sits in the <b>${result.planet}</b> extension of <b>${fullCardName(fromCard)}</b>'s ${result.spread}.</p>
      <div class="ls-row ls-row--single">${rowHTML}</div>
      <p class="ls-connection-gloss">${(window.PLANET_CONN_TEXT || {})[result.planet] || ''}</p>
    </section>`;
  }

  function addPrcVariantSections(sections, kind, card, partner, yourDate, partnerDate, spread) {
    const forwardPath = yourDate ? rulingPathConnection(card, yourDate, partner, spread, kind) : null;
    const backwardPath = partnerDate ? rulingPathConnection(partner, partnerDate, card, spread, kind) : null;
    const forwardMoon = yourDate ? rulingDerivedConnection(card, yourDate, partner, spread, 'Moon', kind) : null;
    const backwardMoon = partnerDate ? rulingDerivedConnection(partner, partnerDate, card, spread, 'Moon', kind) : null;
    const forwardPluto = yourDate ? rulingDerivedConnection(card, yourDate, partner, spread, 'Pluto', kind) : null;
    const backwardPluto = partnerDate ? rulingDerivedConnection(partner, partnerDate, card, spread, 'Pluto', kind) : null;
    const otherMoonForward = partnerDate ? prcAsDerivedConnectionKind(card, partner, partnerDate, spread, 'Moon', kind) : null;
    const otherMoonBackward = yourDate ? prcAsDerivedConnectionKind(partner, card, yourDate, spread, 'Moon', kind) : null;
    const otherPlutoForward = partnerDate ? prcAsDerivedConnectionKind(card, partner, partnerDate, spread, 'Pluto', kind) : null;
    const otherPlutoBackward = yourDate ? prcAsDerivedConnectionKind(partner, card, yourDate, spread, 'Pluto', kind) : null;
    let count = 0;
    if (forwardPath) { sections.push(rulingPathConnectionSectionHTML(card, partner, forwardPath)); count++; }
    if (backwardPath) { sections.push(rulingPathConnectionSectionHTML(partner, card, backwardPath)); count++; }
    if (forwardMoon) { sections.push(rulingDerivedConnectionSectionHTML(card, partner, forwardMoon)); count++; }
    if (backwardMoon) { sections.push(rulingDerivedConnectionSectionHTML(partner, card, backwardMoon)); count++; }
    if (forwardPluto) { sections.push(rulingDerivedConnectionSectionHTML(card, partner, forwardPluto)); count++; }
    if (backwardPluto) { sections.push(rulingDerivedConnectionSectionHTML(partner, card, backwardPluto)); count++; }
    if (otherMoonForward) { sections.push(prcAsDerivedConnectionSectionHTML(card, partner, otherMoonForward)); count++; }
    if (otherMoonBackward) { sections.push(prcAsDerivedConnectionSectionHTML(partner, card, otherMoonBackward)); count++; }
    if (otherPlutoForward) { sections.push(prcAsDerivedConnectionSectionHTML(card, partner, otherPlutoForward)); count++; }
    if (otherPlutoBackward) { sections.push(prcAsDerivedConnectionSectionHTML(partner, card, otherPlutoBackward)); count++; }
    return count;
  }

  function displacementConnectionSectionHTML(result) {
    return `<section class="ls-connection ls-connection--displacement">
      <p class="ls-connection-title"><b>${fullCardName(result.displacer)}</b> displaces <b>${fullCardName(result.displaced)}</b>.</p>
      <div class="ls-row ls-row--single">${singleSeatHTML('Karma', result.displacer, result.displacer)}</div>
      <p class="ls-connection-gloss">This is a displacement connection: one card occupies the other's karmic exchange point in the Life Spread. It can feel consequential, as though the relationship asks both people to notice what is being inherited, exchanged, or worked through rather than simply chosen.</p>
    </section>`;
  }

  function renderRelationshipConnections(card, partner) {
    const root = document.getElementById('fRelationshipConnections');
    if (!root) return false;
    clearAboutLifeScript();
    const inner = root.querySelector('.ls-inner') || root;
    root.classList.remove('is-empty');
    if (!card || !partner || card.suit === 'joker' || partner.suit === 'joker') {
      root.classList.add('is-empty');
      inner.innerHTML = '';
      return false;
    }

    const lsForward     = typeof window.lifeScriptConnection === 'function' ? window.lifeScriptConnection(card, partner) : null;
    const lsBackward    = typeof window.lifeScriptConnection === 'function' ? window.lifeScriptConnection(partner, card) : null;
    // Moon shares a card with the other person's Mercury seat, but has its
    // own relational meaning, so it is intentionally shown as a connection.
    const moonForward   = derivedConnection('Moon', card, partner);
    const moonBackward  = derivedConnection('Moon', partner, card);
    const plutoForward  = derivedConnection('Pluto', card, partner);
    const plutoBackward = derivedConnection('Pluto', partner, card);
    const displacementForward = displacementConnections(card, partner);
    const displacementBackward = displacementConnections(partner, card);
    const spForward     = typeof window.spiritSpreadConnection === 'function' ? window.spiritSpreadConnection(card, partner) : null;
    const spBackward     = typeof window.spiritSpreadConnection === 'function' ? window.spiritSpreadConnection(partner, card) : null;
    const spMoonForward  = spiritDerivedConnection('Moon', card, partner);
    const spMoonBackward = spiritDerivedConnection('Moon', partner, card);
    const spPlutoForward  = spiritDerivedConnection('Pluto', card, partner);
    const spPlutoBackward = spiritDerivedConnection('Pluto', partner, card);

    // Zodiac-ruler connections only run once BOTH people have a real
    // birthdate entered (not just a directly-picked card) — a zodiac
    // sign needs an actual calendar date. Tropical and sidereal are
    // checked independently in both directions, same as the other types.
    const yourDate    = selectedBirthDateForCard(card);
    const partnerDate = selectedPartnerDateForCard(partner);
    const zodDatesOK  = !!yourDate && !!partnerDate;
    const zodTropForward  = zodDatesOK ? zodiacKindConnection(card, yourDate, partner, 'tropical') : null;
    const zodSidForward   = zodDatesOK ? zodiacKindConnection(card, yourDate, partner, 'sidereal') : null;
    const zodTropBackward = zodDatesOK ? zodiacKindConnection(partner, partnerDate, card, 'tropical') : null;
    const zodSidBackward  = zodDatesOK ? zodiacKindConnection(partner, partnerDate, card, 'sidereal') : null;
    const prcEarthForward  = yourDate ? tropicalRulingPathConnection(card, yourDate, partner, 'Earthly Spread') : null;
    const prcEarthBackward = partnerDate ? tropicalRulingPathConnection(partner, partnerDate, card, 'Earthly Spread') : null;
    const prcSpiritForward  = yourDate ? tropicalRulingPathConnection(card, yourDate, partner, 'Spiritual Spread') : null;
    const prcSpiritBackward = partnerDate ? tropicalRulingPathConnection(partner, partnerDate, card, 'Spiritual Spread') : null;
    const prcEarthMoonForward = yourDate ? tropicalRulingDerivedConnection(card, yourDate, partner, 'Earthly Spread', 'Moon') : null;
    const prcEarthMoonBackward = partnerDate ? tropicalRulingDerivedConnection(partner, partnerDate, card, 'Earthly Spread', 'Moon') : null;
    const prcEarthPlutoForward = yourDate ? tropicalRulingDerivedConnection(card, yourDate, partner, 'Earthly Spread', 'Pluto') : null;
    const prcEarthPlutoBackward = partnerDate ? tropicalRulingDerivedConnection(partner, partnerDate, card, 'Earthly Spread', 'Pluto') : null;
    const prcSpiritMoonForward = yourDate ? tropicalRulingDerivedConnection(card, yourDate, partner, 'Spiritual Spread', 'Moon') : null;
    const prcSpiritMoonBackward = partnerDate ? tropicalRulingDerivedConnection(partner, partnerDate, card, 'Spiritual Spread', 'Moon') : null;
    const prcSpiritPlutoForward = yourDate ? tropicalRulingDerivedConnection(card, yourDate, partner, 'Spiritual Spread', 'Pluto') : null;
    const prcSpiritPlutoBackward = partnerDate ? tropicalRulingDerivedConnection(partner, partnerDate, card, 'Spiritual Spread', 'Pluto') : null;
    const partnerPrcEarthMoonForward = partnerDate ? prcAsDerivedConnection(card, partner, partnerDate, 'Earthly Spread', 'Moon') : null;
    const partnerPrcEarthMoonBackward = yourDate ? prcAsDerivedConnection(partner, card, yourDate, 'Earthly Spread', 'Moon') : null;
    const partnerPrcEarthPlutoForward = partnerDate ? prcAsDerivedConnection(card, partner, partnerDate, 'Earthly Spread', 'Pluto') : null;
    const partnerPrcEarthPlutoBackward = yourDate ? prcAsDerivedConnection(partner, card, yourDate, 'Earthly Spread', 'Pluto') : null;
    const partnerPrcSpiritMoonForward = partnerDate ? prcAsDerivedConnection(card, partner, partnerDate, 'Spiritual Spread', 'Moon') : null;
    const partnerPrcSpiritMoonBackward = yourDate ? prcAsDerivedConnection(partner, card, yourDate, 'Spiritual Spread', 'Moon') : null;
    const partnerPrcSpiritPlutoForward = partnerDate ? prcAsDerivedConnection(card, partner, partnerDate, 'Spiritual Spread', 'Pluto') : null;
    const partnerPrcSpiritPlutoBackward = yourDate ? prcAsDerivedConnection(partner, card, yourDate, 'Spiritual Spread', 'Pluto') : null;
    const earthForwardSeats = [moonForward, lsForward, plutoForward];
    const earthBackwardSeats = [moonBackward, lsBackward, plutoBackward];
    const zodTropForwardMerged  = earthForwardSeats.some(function (seat) { return zodiacMatchesSeat(zodTropForward, seat); });
    const zodSidForwardMerged   = earthForwardSeats.some(function (seat) { return zodiacMatchesSeat(zodSidForward, seat); });
    const zodTropBackwardMerged = earthBackwardSeats.some(function (seat) { return zodiacMatchesSeat(zodTropBackward, seat); });
    const zodSidBackwardMerged  = earthBackwardSeats.some(function (seat) { return zodiacMatchesSeat(zodSidBackward, seat); });
    const prcEarthExtraSections = [];
    const prcSpiritExtraSections = [];
    const prcExtraCount =
      addPrcVariantSections(prcEarthExtraSections, 'sidereal', card, partner, yourDate, partnerDate, 'Earthly Spread') +
      addPrcVariantSections(prcEarthExtraSections, 'cusp', card, partner, yourDate, partnerDate, 'Earthly Spread') +
      addPrcVariantSections(prcSpiritExtraSections, 'sidereal', card, partner, yourDate, partnerDate, 'Spiritual Spread') +
      addPrcVariantSections(prcSpiritExtraSections, 'cusp', card, partner, yourDate, partnerDate, 'Spiritual Spread');

    if (!lsForward && !lsBackward && !moonForward && !moonBackward && !plutoForward && !plutoBackward &&
        !displacementForward.length && !displacementBackward.length && !spForward && !spBackward &&
        !spMoonForward && !spMoonBackward && !spPlutoForward && !spPlutoBackward &&
        !zodTropForward && !zodSidForward && !zodTropBackward && !zodSidBackward &&
        !prcEarthForward && !prcEarthBackward && !prcSpiritForward && !prcSpiritBackward &&
        !prcEarthMoonForward && !prcEarthMoonBackward && !prcEarthPlutoForward && !prcEarthPlutoBackward &&
        !prcSpiritMoonForward && !prcSpiritMoonBackward && !prcSpiritPlutoForward && !prcSpiritPlutoBackward &&
        !partnerPrcEarthMoonForward && !partnerPrcEarthMoonBackward && !partnerPrcEarthPlutoForward && !partnerPrcEarthPlutoBackward &&
        !partnerPrcSpiritMoonForward && !partnerPrcSpiritMoonBackward && !partnerPrcSpiritPlutoForward && !partnerPrcSpiritPlutoBackward &&
        !prcExtraCount) {
      root.classList.add('is-empty');
      inner.innerHTML = '';
      return false;
    }

    const sections = [];
    if (moonForward)   sections.push(connectionSectionHTML('Earthly Spread', card, partner, moonForward, derivedSeatHTML('Moon', card, partner), true, zodiacNoteHTML([zodiacMatchesSeat(zodTropForward, moonForward) && zodTropForward, zodiacMatchesSeat(zodSidForward, moonForward) && zodSidForward].filter(Boolean))));
    if (moonBackward)  sections.push(connectionSectionHTML('Earthly Spread', partner, card, moonBackward, derivedSeatHTML('Moon', partner, card), true, zodiacNoteHTML([zodiacMatchesSeat(zodTropBackward, moonBackward) && zodTropBackward, zodiacMatchesSeat(zodSidBackward, moonBackward) && zodSidBackward].filter(Boolean))));
    if (lsForward)     sections.push(connectionSectionHTML('Earthly Spread', card, partner, lsForward, scriptRowHTML(card, partner), false, zodiacNoteHTML([zodiacMatchesSeat(zodTropForward, lsForward) && zodTropForward, zodiacMatchesSeat(zodSidForward, lsForward) && zodSidForward].filter(Boolean))));
    if (lsBackward)    sections.push(connectionSectionHTML('Earthly Spread', partner, card, lsBackward, scriptRowHTML(partner, card), false, zodiacNoteHTML([zodiacMatchesSeat(zodTropBackward, lsBackward) && zodTropBackward, zodiacMatchesSeat(zodSidBackward, lsBackward) && zodSidBackward].filter(Boolean))));
    if (plutoForward)  sections.push(connectionSectionHTML('Earthly Spread', card, partner, plutoForward, derivedSeatHTML('Pluto', card, partner), true, zodiacNoteHTML([zodiacMatchesSeat(zodTropForward, plutoForward) && zodTropForward, zodiacMatchesSeat(zodSidForward, plutoForward) && zodSidForward].filter(Boolean))));
    if (plutoBackward) sections.push(connectionSectionHTML('Earthly Spread', partner, card, plutoBackward, derivedSeatHTML('Pluto', partner, card), true, zodiacNoteHTML([zodiacMatchesSeat(zodTropBackward, plutoBackward) && zodTropBackward, zodiacMatchesSeat(zodSidBackward, plutoBackward) && zodSidBackward].filter(Boolean))));
    if (zodTropForward && !zodTropForwardMerged)  sections.push(zodiacConnectionSectionHTML(card, partner, zodTropForward, derivedSeatHTML(zodTropForward.planet, card, partner)));
    if (zodSidForward && !zodSidForwardMerged)   sections.push(zodiacConnectionSectionHTML(card, partner, zodSidForward, derivedSeatHTML(zodSidForward.planet, card, partner)));
    if (zodTropBackward && !zodTropBackwardMerged) sections.push(zodiacConnectionSectionHTML(partner, card, zodTropBackward, derivedSeatHTML(zodTropBackward.planet, partner, card)));
    if (zodSidBackward && !zodSidBackwardMerged)  sections.push(zodiacConnectionSectionHTML(partner, card, zodSidBackward, derivedSeatHTML(zodSidBackward.planet, partner, card)));
    if (prcEarthForward)  sections.push(rulingPathConnectionSectionHTML(card, partner, prcEarthForward));
    if (prcEarthBackward) sections.push(rulingPathConnectionSectionHTML(partner, card, prcEarthBackward));
    if (prcEarthMoonForward) sections.push(rulingDerivedConnectionSectionHTML(card, partner, prcEarthMoonForward));
    if (prcEarthMoonBackward) sections.push(rulingDerivedConnectionSectionHTML(partner, card, prcEarthMoonBackward));
    if (prcEarthPlutoForward) sections.push(rulingDerivedConnectionSectionHTML(card, partner, prcEarthPlutoForward));
    if (prcEarthPlutoBackward) sections.push(rulingDerivedConnectionSectionHTML(partner, card, prcEarthPlutoBackward));
    if (partnerPrcEarthMoonForward) sections.push(prcAsDerivedConnectionSectionHTML(card, partner, partnerPrcEarthMoonForward));
    if (partnerPrcEarthMoonBackward) sections.push(prcAsDerivedConnectionSectionHTML(partner, card, partnerPrcEarthMoonBackward));
    if (partnerPrcEarthPlutoForward) sections.push(prcAsDerivedConnectionSectionHTML(card, partner, partnerPrcEarthPlutoForward));
    if (partnerPrcEarthPlutoBackward) sections.push(prcAsDerivedConnectionSectionHTML(partner, card, partnerPrcEarthPlutoBackward));
    prcEarthExtraSections.forEach(function (section) { sections.push(section); });
    if (spMoonForward)  sections.push(connectionSectionHTML('Spiritual Spread', card, partner, spMoonForward, spiritDerivedSeatHTML('Moon', card, partner), true));
    if (spMoonBackward) sections.push(connectionSectionHTML('Spiritual Spread', partner, card, spMoonBackward, spiritDerivedSeatHTML('Moon', partner, card), true));
    if (spForward)     sections.push(connectionSectionHTML('Spiritual Spread', card, partner, spForward, spiritRowHTML(card, partner)));
    if (spBackward)    sections.push(connectionSectionHTML('Spiritual Spread', partner, card, spBackward, spiritRowHTML(partner, card)));
    if (spPlutoForward)  sections.push(connectionSectionHTML('Spiritual Spread', card, partner, spPlutoForward, spiritDerivedSeatHTML('Pluto', card, partner), true));
    if (spPlutoBackward) sections.push(connectionSectionHTML('Spiritual Spread', partner, card, spPlutoBackward, spiritDerivedSeatHTML('Pluto', partner, card), true));
    if (prcSpiritForward)  sections.push(rulingPathConnectionSectionHTML(card, partner, prcSpiritForward));
    if (prcSpiritBackward) sections.push(rulingPathConnectionSectionHTML(partner, card, prcSpiritBackward));
    if (prcSpiritMoonForward) sections.push(rulingDerivedConnectionSectionHTML(card, partner, prcSpiritMoonForward));
    if (prcSpiritMoonBackward) sections.push(rulingDerivedConnectionSectionHTML(partner, card, prcSpiritMoonBackward));
    if (prcSpiritPlutoForward) sections.push(rulingDerivedConnectionSectionHTML(card, partner, prcSpiritPlutoForward));
    if (prcSpiritPlutoBackward) sections.push(rulingDerivedConnectionSectionHTML(partner, card, prcSpiritPlutoBackward));
    if (partnerPrcSpiritMoonForward) sections.push(prcAsDerivedConnectionSectionHTML(card, partner, partnerPrcSpiritMoonForward));
    if (partnerPrcSpiritMoonBackward) sections.push(prcAsDerivedConnectionSectionHTML(partner, card, partnerPrcSpiritMoonBackward));
    if (partnerPrcSpiritPlutoForward) sections.push(prcAsDerivedConnectionSectionHTML(card, partner, partnerPrcSpiritPlutoForward));
    if (partnerPrcSpiritPlutoBackward) sections.push(prcAsDerivedConnectionSectionHTML(partner, card, partnerPrcSpiritPlutoBackward));
    prcSpiritExtraSections.forEach(function (section) { sections.push(section); });
    pushDisplacementSections(sections, card, partner, displacementForward);
    pushDisplacementSections(sections, partner, card, displacementBackward);

    inner.innerHTML = `<div class="ls-connections-wrap">
      <div class="ls-connections-head">
        <h3 class="ls-title">Connections</h3>
      </div>
      ${sections.map(function (section) {
        return typeof section === 'string' ? section : displacementConnectionSectionHTML(section);
      }).join('')}
    </div>`;
    bindLifeScriptCardClicks(inner);
    return true;
  }

  window.renderLifeScript = renderLifeScript;
  window.trimLifeDetailsForRelationship = trimLifeDetailsForRelationship;
  window.renderRelationshipConnections = renderRelationshipConnections;
  window.bindZodiacTabs = bindZodiacTabs;
})();
