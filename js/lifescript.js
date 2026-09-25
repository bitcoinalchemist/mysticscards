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
//   window.ZODIAC_SIGN_MEANINGS — ordered sign names, symbols, concise Finder
//     descriptions, and expanded reference readings.
//   window.trimLifeDetailsForRelationship() — removes person-specific
//     planetary-ruler, Life Script, and displacement details when About is
//     showing a combined relationship card.

(function () {
  'use strict';

  const SUIT_FROM_SYM = { '♥':'hearts', '♦':'diamonds', '♣':'clubs', '♠':'spades' };
  let _renderedLifeScriptCard = null;
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
    { name: 'Leo', glyph: '♌', ruler: 'Sun', coRuler: 'Uranus', start: [7, 23], end: [8, 22] },
    { name: 'Virgo', glyph: '♍', ruler: 'Mercury', start: [8, 23], end: [9, 22] },
    { name: 'Libra', glyph: '♎', ruler: 'Venus', start: [9, 23], end: [10, 22] },
    { name: 'Scorpio', glyph: '♏', ruler: 'Mars', coRuler: 'Pluto', start: [10, 23], end: [11, 21] },
    { name: 'Sagittarius', glyph: '♐', ruler: 'Jupiter', start: [11, 22], end: [12, 21] }
  ];
  const ZODIAC_SIGN_MEANINGS = [
    {
      name: 'Aries', glyph: '♈︎',
      description: 'Aries brings initiative and courage, meeting life through direct action and the willingness to begin.',
      reference: [
        'As a cardinal fire sign, Aries speaks to the impulse to begin. Its energy favors direct action, experimentation, and the courage to move before every detail is settled. In a reading, Aries can point to where initiative restores momentum and where a desire is ready to be expressed plainly.',
        'Aries works best when its speed has a chosen purpose. Acting first can open a path, while listening and adjusting help that path remain useful. The sign invites courage without turning every delay into an obstacle or every difference into a contest.'
      ]
    },
    {
      name: 'Taurus', glyph: '♉︎',
      description: 'Taurus values steadiness, patience, and care for what has lasting worth, building security through consistent attention.',
      reference: [
        'As a fixed earth sign, Taurus is concerned with what can be tended and sustained. It notices material needs, bodily comfort, beauty, and the value of consistent effort. In a reading, Taurus may describe the patient work of building trust, protecting resources, or allowing a good thing time to take root.',
        'Steadiness becomes a strength when it remains responsive to change. Taurus can hold on to a familiar arrangement long after it has stopped nourishing anyone. Its lesson is to distinguish lasting value from simple habit, and to share the security it creates.'
      ]
    },
    {
      name: 'Gemini', glyph: '♊︎',
      description: 'Gemini explores ideas through curiosity, conversation, and flexible thinking, finding connections between people and perspectives.',
      reference: [
        'As a mutable air sign, Gemini learns by asking, comparing, and exchanging ideas. It brings movement to language and finds links between subjects that seemed separate. In a reading, Gemini can highlight a conversation, a new question, or the need to see a situation from more than one angle.',
        'Its flexibility is most valuable when curiosity has room to deepen. Too many possibilities can scatter attention or keep a difficult feeling at a distance. Gemini grows by listening as carefully as it speaks, then carrying a useful insight into action.'
      ]
    },
    {
      name: 'Cancer', glyph: '♋︎',
      description: 'Cancer centers care, memory, and belonging, creating emotional safety while learning to honor personal boundaries.',
      reference: [
        'As a cardinal water sign, Cancer begins from feeling and the wish to care for what matters. Home, memory, family, and chosen forms of belonging can carry special weight. In a reading, Cancer may point to a need for safety, a bond that asks for attention, or the courage involved in expressing a vulnerable need.',
        'Care is strongest when it includes the person offering it. Cancer can become so alert to others’ moods that its own needs are hard to hear. Clear boundaries make tenderness more dependable and allow relationships to be sustained by mutual choice.'
      ]
    },
    {
      name: 'Leo', glyph: '♌︎',
      description: 'Leo gives creative self-expression and generosity a visible form, bringing warmth and heart to what it chooses to share.',
      reference: [
        'As a fixed fire sign, Leo gives warmth, creativity, and conviction a visible form. It wants to make something heartfelt and share it with others. In a reading, Leo may speak to the confidence needed to take a place in the room, lead with generosity, or let a talent be seen.',
        'Recognition can encourage Leo, but it cannot carry the whole weight of self-worth. When praise becomes the only measure, expression can turn into performance. Leo is at its strongest when it creates for the joy and purpose of the work while leaving space for others to shine.'
      ]
    },
    {
      name: 'Virgo', glyph: '♍︎',
      description: 'Virgo notices patterns and practical needs, refining skills and showing care through thoughtful, useful work.',
      reference: [
        'As a mutable earth sign, Virgo pays attention to how things work in practice. It notices patterns, details, and the small adjustments that make a process more useful. In a reading, Virgo can suggest learning a craft, caring through service, or bringing order to something that has become difficult to manage.',
        'Discernment helps Virgo improve what matters; relentless criticism can make even good work feel unfinished. The sign asks which details truly serve the whole. Rest, proportion, and acceptance give skill room to mature without requiring perfection.'
      ]
    },
    {
      name: 'Libra', glyph: '♎︎',
      description: 'Libra seeks balance, fairness, and mutual understanding, using dialogue and perspective to shape relationships and shared choices.',
      reference: [
        'As a cardinal air sign, Libra begins through relationship and dialogue. It weighs different perspectives, looks for fairness, and considers how a choice will affect everyone involved. In a reading, Libra may draw attention to an agreement, a partnership, or the work of making shared decisions with care.',
        'The wish for harmony can make disagreement feel costly. Libra finds firmer balance when it names its own position as clearly as it hears another person’s. Fairness sometimes requires a difficult conversation, a boundary, or a choice that cannot please everyone.'
      ]
    },
    {
      name: 'Scorpio', glyph: '♏︎',
      description: 'Scorpio meets intensity, trust, and change directly, looking beneath appearances and making room for renewal.',
      reference: [
        'As a fixed water sign, Scorpio is drawn to depth, trust, and what remains unspoken. It may stay with a difficult feeling long enough to understand its roots. In a reading, Scorpio can point to a change that asks for honesty, a bond that needs real trust, or a truth that is ready to surface.',
        'Intensity becomes constructive when it has somewhere safe to go. Fear of betrayal can encourage secrecy or control, even when openness would help. Scorpio’s capacity for renewal grows through discernment, shared vulnerability, and the willingness to release what has run its course.'
      ]
    },
    {
      name: 'Sagittarius', glyph: '♐︎',
      description: 'Sagittarius reaches toward discovery and meaning, growing through learning, exploration, candor, and beliefs tested by experience.',
      reference: [
        'As a mutable fire sign, Sagittarius searches for a wider horizon. Travel, study, storytelling, and encounters with unfamiliar ideas can all expand its sense of possibility. In a reading, Sagittarius may signal a question of meaning, an opportunity to learn, or the need to move beyond a limiting assumption.',
        'Its candor and optimism bring energy, especially when they leave room for other experiences. A compelling belief can become too certain or too broad to fit the facts. Sagittarius grows by testing its convictions in life and remaining willing to revise them.'
      ]
    },
    {
      name: 'Capricorn', glyph: '♑︎',
      description: 'Capricorn builds through responsibility, patience, and structure, turning long aims into work that can endure.',
      reference: [
        'As a cardinal earth sign, Capricorn gives ambition a practical structure. It considers time, resources, and the obligations involved in making something last. In a reading, Capricorn can describe a long project, a responsibility that calls for maturity, or a goal that becomes possible through steady effort.',
        'Discipline is easier to sustain when it includes rest and support. Capricorn may carry too much alone or measure worth only by what has been achieved. Its deeper strength lies in building reliable forms that serve life beyond the task itself.'
      ]
    },
    {
      name: 'Aquarius', glyph: '♒︎',
      description: 'Aquarius imagines freer ways of living together, valuing originality, shared ideals, and change that benefits the wider community.',
      reference: [
        'As a fixed air sign, Aquarius holds a vision of how people might live together differently. It values independent thought, friendship, and ideas that reach beyond a familiar circle. In a reading, Aquarius may highlight a community, an unconventional choice, or a pattern ready for thoughtful change.',
        'Distance can make a new perspective easier to see, but it can also hide the needs of people close at hand. Aquarius gives its ideals substance by listening to lived experience and turning invention into something others can use.'
      ]
    },
    {
      name: 'Pisces', glyph: '♓︎',
      description: 'Pisces is receptive to imagination, empathy, and subtle feeling, learning how clear boundaries can make compassion sustainable.',
      reference: [
        'As a mutable water sign, Pisces is sensitive to mood, image, and possibilities that are difficult to put into words. It can bring compassion, imagination, and a sense of connection to a reading. Pisces may point toward a creative impulse, a need for quiet, or a feeling that deserves gentle attention.',
        'Sensitivity needs a workable container. Without clear limits, Pisces can absorb burdens that belong elsewhere or mistake hope for a settled reality. Rest, honest questions, and practical acts of care help its empathy remain generous and grounded.'
      ]
    }
  ];
  window.ZODIAC_SIGN_MEANINGS = ZODIAC_SIGN_MEANINGS;
  const TEXT_VARIATION = '\uFE0E';
  ZODIAC.forEach(function (sign) { sign.glyph += TEXT_VARIATION; });
  const SIDEREAL_LAHIRI_DAY_SHIFT = -24;
  const ASTRO_ZODIAC_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const PLANETARY_ENERGIES = {
    Sun: 'self-expression, confidence, and the way a person is called to shine',
    Moon: 'emotional needs, belonging, and instinctive responses',
    Mercury: 'thought, language, learning, and exchange',
    Venus: 'attraction, values, harmony, and what is worth tending',
    Mars: 'initiative, courage, desire, and decisive action',
    Jupiter: 'growth, meaning, confidence, and widening possibility',
    Saturn: 'responsibility, boundaries, patience, and lasting structure',
    Uranus: 'change, originality, freedom, and awakening',
    Neptune: 'imagination, intuition, sensitivity, and spiritual longing',
    Pluto: 'transformation, power, truth, and deep renewal'
  };

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

  function cardThemeKeywords(card) {
    const reading = card && (window.CARD_READINGS || {})[`${card.rank}_${card.suit}`];
    return reading && Array.isArray(reading.kws) && reading.kws.length
      ? reading.kws.slice(0, 3).join(', ').toLowerCase()
      : 'its central themes';
  }

  function displacementMeaningText(displacer, displaced) {
    if (!displacer || !displaced) {
      return 'In the Life Spread, a displacement marks an exchange of expression: one card occupies the place associated with another, bringing its own themes into that position. The displaced card is not erased; the two cards are read through the way their patterns meet.';
    }
    return `In the Life Spread, a displacement marks an exchange of expression: ${fullCardName(displacer)} occupies the place associated with ${fullCardName(displaced)}. It brings themes of ${cardThemeKeywords(displacer)} into that place, where they meet ${fullCardName(displaced)}’s themes of ${cardThemeKeywords(displaced)}. The displaced card is not erased; its qualities remain part of the pattern, now encountered through the displacer’s style. Together, these cards point to a place where one pattern can redirect, challenge, or open a new route for the other.`;
  }

  function readsLeftToRight() {
    return !!(window.CardsStore && typeof window.CardsStore.getQuadReadLtr === 'function' && window.CardsStore.getQuadReadLtr());
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
  function zodiacKindConnection(fromCard, fromDate, toCard, kind, exactTropicalSign, rulerOverride) {
    if (!fromDate) return null;
    let sign;
    if (kind === 'sidereal') {
      const sd = shiftedDate(fromDate.month, fromDate.day, SIDEREAL_LAHIRI_DAY_SHIFT);
      sign = zodiacForDate(sd.month, sd.day);
    } else {
      sign = exactTropicalSign || zodiacForDate(fromDate.month, fromDate.day);
    }
    const ruler = rulerOverride || (sign && sign.ruler);
    if (!sign || ruler === 'Moon') return null;
    const key = `${fromCard.rank}_${fromCard.suit}`;
    const script = (typeof LIFE_SCRIPTS !== 'undefined' ? LIFE_SCRIPTS : {})[key];
    const cc = cardForRuler(ruler, script, fromCard);
    if (!cc || cc.rank !== toCard.rank || cc.suit !== toCard.suit) return null;
    return { planet: ruler, sign: sign.name, glyph: sign.glyph, kind, exact: kind === 'tropical' && !!exactTropicalSign };
  }

  function prcSignForDate(date, kind, exactTropicalSign) {
    if (!date) return null;
    if (kind === 'sidereal') {
      const sd = shiftedDate(date.month, date.day, SIDEREAL_LAHIRI_DAY_SHIFT);
      return zodiacForDate(sd.month, sd.day);
    }
    if (kind === 'cusp') {
      const sign = zodiacForDate(date.month, date.day);
      return tropicalCuspSignForDate(sign, date.month, date.day);
    }
    return exactTropicalSign || zodiacForDate(date.month, date.day);
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

  function rulingPathConnection(fromCard, fromDate, toCard, spread, kind, exactTropicalSign, rulerOverride) {
    const checker = spread === 'Spiritual Spread'
      ? window.spiritSpreadConnection
      : window.lifeScriptConnection;
    if (!fromDate || typeof checker !== 'function') return null;
    const sign = prcSignForDate(fromDate, kind, exactTropicalSign);
    if (!sign) return null;
    const key = `${fromCard.rank}_${fromCard.suit}`;
    const script = (typeof LIFE_SCRIPTS !== 'undefined' ? LIFE_SCRIPTS : {})[key];
    const ruler = rulerOverride || sign.ruler;
    const rulingCard = cardForRuler(ruler, script, fromCard);
    if (!rulingCard || (rulingCard.rank === fromCard.rank && rulingCard.suit === fromCard.suit)) return null;
    const seat = checker(rulingCard, toCard);
    if (!seat) return null;
    return {
      planet: seat.planet,
      idx: seat.idx,
      spread: spread || 'Earthly Spread',
      ruler: ruler,
      sign: sign.name,
      glyph: sign.glyph,
      kind: kind || 'tropical',
      exact: (kind || 'tropical') === 'tropical' && !!exactTropicalSign,
      rulingCard
    };
  }

  function tropicalRulingDerivedConnection(fromCard, fromDate, toCard, spread, planet) {
    return rulingDerivedConnection(fromCard, fromDate, toCard, spread, planet, 'tropical');
  }

  function rulingDerivedConnection(fromCard, fromDate, toCard, spread, planet, kind, exactTropicalSign, rulerOverride) {
    if (!fromDate || !planet) return null;
    const sign = prcSignForDate(fromDate, kind, exactTropicalSign);
    if (!sign) return null;
    const key = `${fromCard.rank}_${fromCard.suit}`;
    const script = (typeof LIFE_SCRIPTS !== 'undefined' ? LIFE_SCRIPTS : {})[key];
    const ruler = rulerOverride || sign.ruler;
    const rulingCard = cardForRuler(ruler, script, fromCard);
    if (!rulingCard || (rulingCard.rank === fromCard.rank && rulingCard.suit === fromCard.suit)) return null;
    const match = spread === 'Spiritual Spread'
      ? spiritDerivedConnection(planet, rulingCard, toCard)
      : derivedConnection(planet, rulingCard, toCard);
    if (!match) return null;
    return {
      planet: planet,
      spread: spread || 'Earthly Spread',
      ruler: ruler,
      sign: sign.name,
      glyph: sign.glyph,
      kind: kind || 'tropical',
      exact: (kind || 'tropical') === 'tropical' && !!exactTropicalSign,
      rulingCard
    };
  }

  function tropicalRulingCardFor(card, date) {
    return rulingCardForKind(card, date, 'tropical');
  }

  function rulingCardsForKind(card, date, kind, exactTropicalSign) {
    if (!date) return null;
    const sign = prcSignForDate(date, kind, exactTropicalSign);
    if (!sign) return null;
    const key = `${card.rank}_${card.suit}`;
    const script = (typeof LIFE_SCRIPTS !== 'undefined' ? LIFE_SCRIPTS : {})[key];
    return [sign.ruler].concat(sign.coRuler ? [sign.coRuler] : []).reduce(function (cards, ruler) {
      const rulingCard = cardForRuler(ruler, script, card);
      if (!rulingCard || (rulingCard.rank === card.rank && rulingCard.suit === card.suit) || cards.some(function (item) { return item.rulingCard.rank === rulingCard.rank && item.rulingCard.suit === rulingCard.suit; })) return cards;
      cards.push({ rulingCard: rulingCard, ruler: ruler, sign: sign.name, glyph: sign.glyph, kind: kind || 'tropical', exact: (kind || 'tropical') === 'tropical' && !!exactTropicalSign });
      return cards;
    }, []);
  }

  function rulingCardForKind(card, date, kind, exactTropicalSign) {
    return (rulingCardsForKind(card, date, kind, exactTropicalSign) || [])[0] || null;
  }

  function prcAsDerivedConnection(fromCard, otherCard, otherDate, spread, planet) {
    return prcAsDerivedConnectionKind(fromCard, otherCard, otherDate, spread, planet, 'tropical');
  }

  function prcAsDerivedConnectionKind(fromCard, otherCard, otherDate, spread, planet, kind, exactTropicalSign, rulerOverride) {
    if (!planet) return null;
    const prc = (rulingCardsForKind(otherCard, otherDate, kind, exactTropicalSign) || []).find(function (item) { return !rulerOverride || item.ruler === rulerOverride; });
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
      exact: !!prc.exact,
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
    const interpretation = opts.interpretation || '';
    const controls = opts.controls ? ` aria-controls="${escHTML(opts.controls)}"` : '';
    const relation = opts.relationRole
      ? ` data-ls-relation="${escHTML(opts.relationRole)}" data-ls-pair-idx="${escHTML(opts.relationIdx)}"`
      : '';
    const prc = opts.prc ? ` data-ls-sign="${escHTML(opts.prc.sign)}" data-ls-ruler="${escHTML(opts.prc.ruler)}" data-ls-zodiac-kind="${escHTML(opts.prc.kind)}" data-ls-cusp="${opts.prc.cusp ? 'true' : 'false'}" data-ls-prc-role="${escHTML(opts.prc.role || 'primary')}"` : '';
    const interactive = interpretation
      ? ` data-idx="${idx}" data-ls-interpret="${escHTML(interpretation)}"${relation}${prc} aria-expanded="false"${controls} aria-label="${escHTML(opts.ariaLabel || `Read ${fullCardName(cc)} in this position`)}"`
      : ` data-idx="${idx}" aria-label="Load ${escHTML(fullCardName(cc))} in finder"`;
    return `<div class="spread-card ls-card ls-stat-card ${cc.suit}${extra}"${interactive} role="button" tabindex="0" title="${escHTML(title)}">${face}</div>`;
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

  function zodiacCardSlotHTML(label, ruler, script, birthCard, title, extraCls, prcContext) {
    const glyph = SPREAD_PLANET_SYM[ruler] || '';
    const rulerLabel = ruler.slice(0, 3).toUpperCase();
    const cc = cardForRuler(ruler, script, birthCard);
    const cardHTML = cc ? statsCardHTML(cc, prcContext ? {
      title: `${ruler} ruling card`,
      interpretation: 'prc',
      controls: prcContext.panelId,
      ariaLabel: `Read ${fullCardName(cc)} as the ${ruler} ruling card for ${prcContext.sign.name}`,
      prc: { sign: prcContext.sign.name, ruler: ruler, kind: prcContext.kind, cusp: prcContext.role === 'cusp' || !!label, role: prcContext.role }
    } : { title: `${ruler} ruling card` }) : '';
    const labelHTML = label && typeof label === 'object'
      ? `<span class="ls-zodiac-card-label ls-prc-sign-label"${label.title ? ` title="${escHTML(label.title)}"` : ''}>${label.primary ? `${label.primary}<small>${label.secondary}</small>` : label.secondary}</span>`
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

  function cuspCardSlotHTML(sign, script, birthCard, prcContext) {
    if (!sign) return '';
    const ruler = sign.ruler;
    const title = `Cusp possibility: ${sign.glyph} ${sign.name}, ${ruler} ruling card`;
    const signLabel = { primary: '', secondary: sign.name, title: title };
    return zodiacCardSlotHTML(signLabel, ruler, script, birthCard, title, 'ls-prc-slot ls-prc-cusp-slot', Object.assign({}, prcContext, { sign: sign, role: 'cusp' }));
  }

  function prcCardletHTML(sign, signTitle, script, birthCard, opts) {
    opts = opts || {};
    const rulers = [sign.ruler].concat(sign.coRuler ? [sign.coRuler] : []);
    const context = { sign: sign, kind: opts.kind, panelId: opts.panelId };
    const cuspHTML = opts.cuspSign ? cuspCardSlotHTML(opts.cuspSign, script, birthCard, context) : '';
    const mainRuler = rulers[0];
    const signLabel = { primary: '', secondary: sign.name, title: signTitle };
    const mainHTML = zodiacCardSlotHTML(signLabel, mainRuler, script, birthCard, `${mainRuler} planetary ruling card`, 'ls-prc-slot ls-prc-main is-prc-centered', Object.assign({}, context, { role: 'primary' }));
    const alternativeHTML = rulers.slice(1).map(function (ruler) {
      return zodiacCardSlotHTML(signLabel, ruler, script, birthCard, `${ruler} planetary ruling card`, 'ls-prc-slot ls-prc-alternative', Object.assign({}, context, { role: 'alternative' }));
    }).join('');
    return `<section class="ls-prc-cardlet">
      <div class="ls-prc-card-row${cuspHTML ? ' has-cusp' : ''}" data-prc-card-row>
        <div class="ls-prc-cusp-group">${cuspHTML}</div>
        ${mainHTML.replace(' is-prc-centered', '')}
        <div class="ls-prc-alternative-group">${alternativeHTML}</div>
        ${cuspHTML ? `<div class="ls-prc-cusp-check"><button type="button" data-prc-solar-link aria-label="Cusp Card - Check Solar Time">Check Solar Time</button></div>` : ''}
      </div>
    </section>`;
  }

  const CHINESE_ANIMALS = [
    'Rat', 'Ox', 'Tiger', 'Cat', 'Dragon', 'Snake',
    'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'
  ];
  const CHINESE_ELEMENTS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

  function chineseYearProfile(year, month, day) {
    if (!Number.isInteger(year) || year < 1900 || year > 9999) return null;
    try {
      const date = new Date(Date.UTC(year, month - 1, day, 12));
      const parts = new Intl.DateTimeFormat('en-u-ca-chinese', {
        year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC'
      }).formatToParts(date);
      const yearPart = parts.find(function (part) { return part.type === 'relatedYear'; });
      const lunarYear = yearPart ? parseInt(yearPart.value, 10) : NaN;
      if (!Number.isInteger(lunarYear)) return null;
      const cycleIndex = ((lunarYear - 1984) % 60 + 60) % 60;
      const stemIndex = cycleIndex % 10;
      return {
        lunarYear: lunarYear,
        animal: CHINESE_ANIMALS[cycleIndex % 12],
        element: CHINESE_ELEMENTS[Math.floor(stemIndex / 2)],
        polarity: stemIndex % 2 === 0 ? 'Yang' : 'Yin'
      };
    } catch (e) {
      return null;
    }
  }
  window.chineseYearProfile = chineseYearProfile;

  function planetaryRulingCardsHTML(card, script) {
    const date = selectedBirthDateForCard(card);
    if (!date) return '';
    const sign = zodiacForDate(date.month, date.day);
    if (!sign) return '';
    const siderealDate = shiftedDate(date.month, date.day, SIDEREAL_LAHIRI_DAY_SHIFT);
    const siderealSign = zodiacForDate(siderealDate.month, siderealDate.day);
    const cuspSign = tropicalCuspSignForDate(sign, date.month, date.day);
    const tropicalHTML = prcCardletHTML(sign, 'Tropical sun sign', script, card, { cuspSign: cuspSign, kind: 'Tropical', panelId: 'prcTropicalReading' });
    const siderealHTML = siderealSign
      ? prcCardletHTML(siderealSign, 'Sidereal sign, Lahiri-style birthday approximation', script, card, { cuspSign: tropicalCuspSignForDate(siderealSign, siderealDate.month, siderealDate.day), kind: 'Sidereal', panelId: 'prcSiderealReading' })
      : '';
    return `<div class="ls-stat-block ls-zodiac-block">
      <div class="ls-zodiac-heading">
        <h3 class="ls-stat-label">Planetary Ruling Cards</h3>
      </div>
      <div class="ls-prc-toggle" role="group" aria-label="Planetary ruling card zodiac">
        <span>Tropical</span>
        <label class="ls-switch">
          <input type="checkbox" data-prc-toggle aria-label="Use sidereal zodiac">
          <span class="ls-switch-track" aria-hidden="true"></span>
        </label>
        <span>Sidereal</span>
      </div>
      <section class="ls-prc-panel" id="prcTropicalPanel" role="tabpanel" aria-labelledby="prcTropicalTab" data-prc-panel="tropical">
        ${tropicalHTML}
        <div class="ls-local-reading ls-prc-reading" id="prcTropicalReading" data-ls-local-reading hidden></div>
      </section>
      <section class="ls-prc-panel" id="prcSiderealPanel" role="tabpanel" aria-labelledby="prcSiderealTab" data-prc-panel="sidereal" hidden>
        ${siderealHTML}
        ${siderealSign ? '<div class="ls-local-reading ls-prc-reading" id="prcSiderealReading" data-ls-local-reading hidden></div>' : ''}
      </section>
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
      return '<p class="ls-displacement-note">This is a fixed card in the Life Spread: it holds its own seat, so no separate displacement pair is shown.</p>';
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
        title: `${verb} ${fullCardName(oc)}`,
        interpretation: verb === 'Displaces' ? 'displaces' : 'displaced',
        relationRole: verb === 'Displaces' ? 'displaces' : 'displaced',
        relationIdx: idx,
        controls: 'lsDisplacementReading'
      });
      return `<div class="ls-ghost-pair">
        <div class="ls-ghost-label">${verb}</div>
        ${cardHTML}
      </div>`;
    }).join('');
    const mutualNote = isMutualPair
      ? '<p class="ls-displacement-note ls-displacement-note--pair">These cards form a mutual displacement pair: each occupies the other’s place, so both themes remain active and are read through one another.</p>'
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
    if (pos >= 49) return planetButtonHTML('Crown', 'Crown row', fullCardName(card));
    const rowPlanet = SPREAD_PLANETS[Math.floor(pos / 7)];
    const colPlanet = SPREAD_PLANETS[pos % 7];
    return planetButtonHTML(rowPlanet, `${colPlanet} card in the ${rowPlanet} row`, fullCardName(card), colPlanet);
  }

  function planetButtonHTML(planet, title, cardLabel, columnPlanet) {
    const glyph = SPREAD_PLANET_SYM[planet] || '';
    const primary = cardLabel || `${glyph ? glyph + ' ' : ''}${planet}`;
    return `<button type="button" class="ls-stat-chip ls-planet-link" data-planet="${planet}"${columnPlanet ? ` data-column-planet="${columnPlanet}"` : ''}${cardLabel ? ` data-card-label="${escHTML(cardLabel)}"` : ''} aria-expanded="false" aria-controls="fAboutPlanetInfo" aria-label="Read about ${planet}${title ? ', ' + title : ''}"><span>${primary}</span>${title ? `<small>${title}</small>` : ''}</button>`;
  }

  function escHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>\"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function clearPlanetInfo() {
    document.querySelectorAll('.ls-planet-link').forEach(function (button) {
      button.setAttribute('aria-expanded', 'false');
    });
    const panel = document.getElementById('fAboutPlanetInfo');
    if (!panel) return;
    panel.hidden = true;
    panel.innerHTML = '';
  }

  function renderPlanetInfo(planet, columnPlanet, cardLabel) {
    const data = window.PLANET_DATA && window.PLANET_DATA[planet];
    const panel = document.getElementById('fAboutPlanetInfo');
    if (!data || !panel) return;
    panel.dataset.planet = planet;
    panel.dataset.columnPlanet = columnPlanet || '';
    panel.dataset.cardLabel = cardLabel || '';
    const positionText = window.QUADRATION_POSITION_DATA && window.QUADRATION_POSITION_DATA[planet]
      && window.QUADRATION_POSITION_DATA[planet][columnPlanet];
    const paragraphs = (positionText ? [positionText] : (data.text || [])).map(function (paragraph) {
      return `<p class="about-planet-copy">${escHTML(paragraph)}</p>`;
    }).join('');
    panel.innerHTML = `<div id="fAboutPlanetReading">
      <div class="about-planet-head">
        <span class="about-planet-glyph" aria-hidden="true">${escHTML(data.glyph || (SPREAD_PLANET_SYM[planet] || ''))}</span>
        <div><h4>${escHTML(cardLabel ? `${cardLabel} · ${columnPlanet ? `${columnPlanet} in ${planet}` : planet}` : (positionText ? `${columnPlanet} card in the ${planet} row` : planet))}</h4>${positionText ? '' : `<p>${escHTML(data.epithet || '')}</p>`}</div>
      </div>
      ${positionText ? '' : `<p class="about-planet-synopsis">${escHTML(data.synopsis || '')}</p>`}
      ${paragraphs}
    </div>`;
  }

  function openPlanetFromStats(planet, columnPlanet, cardLabel) {
    const data = window.PLANET_DATA && window.PLANET_DATA[planet];
    const panel = document.getElementById('fAboutPlanetInfo');
    if (!data || !panel) return;
    if (!panel.hidden && panel.dataset.planet === planet && panel.dataset.columnPlanet === (columnPlanet || '') && panel.dataset.cardLabel === (cardLabel || '')) {
      clearPlanetInfo();
      return;
    }
    renderPlanetInfo(planet, columnPlanet, cardLabel);
    panel.hidden = false;
    document.querySelectorAll('.ls-planet-link').forEach(function (button) {
      button.setAttribute('aria-expanded', String(button.dataset.planet === planet && (button.dataset.columnPlanet || '') === (columnPlanet || '')));
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
        return `<span class="ls-date-item">${escHTML(date)}</span>`;
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
      ${planetaryRulingCardsHTML(card, script)}
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
        <div class="ls-local-reading" id="lsDisplacementReading" data-ls-local-reading hidden></div>
      </div>
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
      const lsColors = ['#e58b8b', '#e5b56f', '#d8d86f', '#8fcf91', '#7fc5d7', '#9da5e8', '#c99bdc'];
      const lsColor = lsColors[planetOrder[i]];
      const face = typeof spreadCardPips === 'function'
        ? spreadCardPips(cc)
        : `<span class="ls-token">${cc.rank}${cc.sym}</span>`;
      const idx = (typeof CARDS !== 'undefined')
        ? CARDS.findIndex(function (x) { return x.rank === cc.rank && x.suit === cc.suit; })
        : -1;
      return `<div class="ls-col" data-planet="${planet}">
        <span class="ls-planet-glyph" title="${planet}">${sym}</span>
        <span class="ls-planet-name" title="${planet}">${label}</span>
        <div class="spread-card ls-card ${cc.suit}${isPick ? ' ls-conn-pick' : ''}" style="--ls-color: ${lsColor}" data-idx="${idx}" data-ls-interpret="life-script" data-ls-position="${planet}" role="button" tabindex="0" aria-expanded="false" aria-controls="lsScriptReading" aria-label="Read ${fullCardName(cc)} in the ${planet} position">${face}</div>
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
  function singleSeatHTML(planet, cc, highlight, options) {
    if (!cc) return '';
    options = options || {};
    const label = options.label || planet.slice(0, 3).toUpperCase();
    const sym = options.symbol || SPREAD_PLANET_SYM[planet];
    const title = options.title || planet;
    const isPick = highlight && cc.rank === highlight.rank && cc.suit === highlight.suit;
    const face = typeof spreadCardPips === 'function'
      ? spreadCardPips(cc)
      : `<span class="ls-token">${cc.rank}${cc.sym}</span>`;
    const cardIdx = (typeof CARDS !== 'undefined')
      ? CARDS.findIndex(function (x) { return x.rank === cc.rank && x.suit === cc.suit; })
      : -1;
    return `<div class="ls-col" data-planet="${planet}">
      <span class="ls-planet-glyph" title="${title}">${sym}</span>
      <span class="ls-planet-name" title="${title}">${label}</span>
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

    return `<div class="ls-life-script-group"><div class="ls-row">${rowHTML}</div>
    <div class="ls-local-reading" id="lsScriptReading" data-ls-local-reading hidden></div></div>
    ${birthStatsHTML(card, script)}`;
  }

  // Keep all selected-card material in About. Quadration Chart Position closes
  // the cardology group.
  function clearAboutLifeScript() {
    clearPlanetInfo();
    const aboutTarget = document.getElementById('fAboutCardology');
    const planetInfo = document.getElementById('fAboutPlanetInfo');
    const cardFacts = document.getElementById('fAboutCardFacts');
    const cardDates = document.getElementById('fAboutDates');
    // The panel is moved into the Quadration Chart Position stat block after
    // each render. Detach both reusable panels before clearing that block so
    // later card selections can still reuse them.
    if (planetInfo) planetInfo.remove();
    if (cardFacts) cardFacts.remove();
    if (cardDates) { cardDates.replaceChildren(); cardDates.hidden = true; }
    if (aboutTarget) aboutTarget.innerHTML = '';
    if (planetInfo && aboutTarget) aboutTarget.appendChild(planetInfo);
    if (cardFacts && aboutTarget) aboutTarget.appendChild(cardFacts);
    return aboutTarget;
  }

  function splitAboutLifeScript(root) {
    const aboutTarget = document.getElementById('fAboutCardology');
    const inner = root && root.querySelector('.ls-inner');
    if (!aboutTarget || !inner) return;
    const planetInfo = document.getElementById('fAboutPlanetInfo');
    const cardFacts = document.getElementById('fAboutCardFacts');
    const cardDates = document.getElementById('fAboutDates');
    aboutTarget.innerHTML = '';
    const header = inner.querySelector('.ls-header');
    const row = inner.querySelector('.ls-row');
    const lifeScriptGroup = inner.querySelector('.ls-life-script-group');
    const stats = inner.querySelector('.ls-stats');
    if (!row && !stats) {
      while (inner.firstChild) aboutTarget.appendChild(inner.firstChild);
      if (cardFacts) aboutTarget.appendChild(cardFacts);
      return;
    }
    if (stats) {
      const statBlocks = {};
      Array.from(stats.children).forEach(function (block) {
        const label = block.querySelector('.ls-stat-label');
        const text = label ? label.textContent.trim() : '';
        if (text === 'Dates' || text === 'Displacements' || text === 'Quadration Chart Position' || text === 'Planetary Ruling Cards') statBlocks[text] = block;
      });
      const topStats = document.createElement('div');
      topStats.className = 'ls-stats ls-stats--about';
      if (statBlocks.Dates) {
        if (cardDates) {
          cardDates.replaceChildren(statBlocks.Dates);
          cardDates.hidden = false;
        } else topStats.appendChild(statBlocks.Dates);
      }
      if (statBlocks['Planetary Ruling Cards']) topStats.appendChild(statBlocks['Planetary Ruling Cards']);
      if (topStats.children.length) aboutTarget.appendChild(topStats);

      if (header) aboutTarget.appendChild(header);

      if (row) {
        const rulingCardsBlock = document.createElement('section');
        rulingCardsBlock.className = 'ls-stat-block ls-ruling-cards-block';
        rulingCardsBlock.setAttribute('aria-label', 'Life Script');
        rulingCardsBlock.innerHTML = '<h3 class="ls-stat-label">Life Script</h3>';
        rulingCardsBlock.appendChild(lifeScriptGroup || row);
        aboutTarget.appendChild(rulingCardsBlock);
      }

      const lowerStats = document.createElement('div');
      lowerStats.className = 'ls-stats ls-stats--about';
      if (statBlocks.Displacements) lowerStats.appendChild(statBlocks.Displacements);
      if (lowerStats.children.length) aboutTarget.appendChild(lowerStats);

      if (statBlocks['Quadration Chart Position']) {
        if (planetInfo) statBlocks['Quadration Chart Position'].appendChild(planetInfo);
        if (cardFacts) statBlocks['Quadration Chart Position'].appendChild(cardFacts);
        aboutTarget.appendChild(statBlocks['Quadration Chart Position']);
      } else if (cardFacts) aboutTarget.appendChild(cardFacts);
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

  function bindPrcTabs(root) {
    if (!root) return;
    function select(kind, focus) {
      const toggle = root.querySelector('[data-prc-toggle]');
      const panels = Array.prototype.slice.call(root.querySelectorAll('[data-prc-panel]'));
      if (!toggle || !panels.length) return;
      toggle.checked = kind === 'sidereal';
      panels.forEach(function (panel) { panel.hidden = panel.dataset.prcPanel !== kind; });
    }
    if (root.dataset.prcBound !== 'true') {
      root.dataset.prcBound = 'true';
      root.addEventListener('change', function (event) {
        if (!event.target.matches('[data-prc-toggle]')) return;
        const kind = event.target.checked ? 'sidereal' : 'tropical';
        if (window.CardsStore && typeof window.CardsStore.setPrcSystem === 'function') {
          window.CardsStore.setPrcSystem(kind);
        }
        select(kind);
      });
    }
    const savedKind = window.CardsStore && typeof window.CardsStore.getPrcSystem === 'function'
      ? window.CardsStore.getPrcSystem()
      : 'tropical';
    select(savedKind);
  }

  function renderLifeScript(card) {
    _renderedLifeScriptCard = card || null;
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
    const aboutCardology = document.getElementById('fAboutCardology');
    bindPrcTabs(aboutCardology);
    bindLifeScriptCardClicks(aboutCardology);
    return true;
  }

  function refreshLifeScriptDirection() {
    const about = document.getElementById('fAbout');
    if (!about || about.classList.contains('is-relationship') || !_renderedLifeScriptCard) return;
    renderLifeScript(_renderedLifeScriptCard);
  }

  function trimLifeDetailsForRelationship() {
    const targets = [
      document.getElementById('fAboutCardology')
    ].filter(Boolean);
    targets.forEach(function (target) {
      target.querySelectorAll('.ls-header, .ls-ruling-cards-block').forEach(function (block) { block.remove(); });
      target.querySelectorAll('.ls-stat-block').forEach(function (block) {
        const label = block.querySelector('.ls-stat-label');
        if (label && label.textContent.trim() === 'Displacements') block.remove();
      });
      target.querySelectorAll('.ls-stats:empty').forEach(function (block) { block.remove(); });
    });
  }

  function bindLifeScriptCardClicks(root) {
    if (!root) return;
    if (root.dataset.prcSolarLinkBound !== 'true') {
      root.dataset.prcSolarLinkBound = 'true';
      root.addEventListener('click', function (event) {
        const solarLink = event.target.closest('[data-prc-solar-link]');
        if (!solarLink || !root.contains(solarLink)) return;
        const solarPanel = document.getElementById('fSolar');
        const solarToggle = document.getElementById('fSolarToggle');
        if (!solarPanel || !solarToggle) return;
        if (solarPanel.hidden) solarToggle.click();
        solarPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const timeField = document.getElementById('solTime');
        if (timeField) timeField.focus({ preventScroll: true });
      });
    }
    root.querySelectorAll('.ls-planet-link[data-planet]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openPlanetFromStats(btn.dataset.planet, btn.dataset.columnPlanet, btn.dataset.cardLabel);
      });
    });
    function cardForIndex(idx) {
      const cards = window.CARDS || (typeof CARDS !== 'undefined' ? CARDS : []);
      return cards[idx] || null;
    }
    function lifeScriptPositionText(entry, planet, cardName) {
      const keywords = Array.isArray(entry.kws) && entry.kws.length
        ? entry.kws.slice(0, 2).join(' and ').toLowerCase()
        : 'its central themes';
      const lenses = {
        Mercury: `The ${cardName} brings ${keywords} into thought, language and exchange. In this position, its questions are learned, named, communicated and put to practical use.`,
        Venus: `The ${cardName} brings ${keywords} into relationship, attraction and value. In this position, its questions are felt through affection, belonging, pleasure and the choices that create harmony.`,
        Mars: `The ${cardName} brings ${keywords} into action, desire and constructive conflict. In this position, its questions ask for courage, effort, boundaries and a clear response to resistance.`,
        Jupiter: `The ${cardName} brings ${keywords} into growth, opportunity and influence. In this position, its questions open through confidence, generosity, teaching and the willingness to let experience become wisdom.`,
        Saturn: `The ${cardName} brings ${keywords} into responsibility, limits and endurance. In this position, its questions are answered through patience, consequence, practice and the work of making something last.`,
        Uranus: `The ${cardName} brings ${keywords} into freedom, disruption and awakening. In this position, its questions open an inherited pattern to experiment, invention and a more useful future.`,
        Neptune: `The ${cardName} brings ${keywords} into imagination, compassion and the unseen. In this position, its questions move through ideals, intuition and the work of giving vision a grounded form.`
      };
      return lenses[planet] || `The ${cardName} expresses ${keywords} through this position.`;
    }
    function localReadingHTML(card, kind, position, relation) {
      const entry = (window.CARD_READINGS || {})[`${card.rank}_${card.suit}`] || {};
      const teaser = entry.teaser || `${fullCardName(card)} brings its own distinct quality to this position.`;
      if (kind === 'prc') {
        const trigger = relation && relation.trigger;
        const sign = trigger && trigger.dataset.lsSign || 'the selected sign';
        const ruler = trigger && trigger.dataset.lsRuler || 'planetary';
        const zodiacKind = trigger && trigger.dataset.lsZodiacKind || 'zodiac';
        const isCusp = trigger && trigger.dataset.lsCusp === 'true';
        const signMeaning = ZODIAC_SIGN_MEANINGS.find(function (entry) { return entry.name === sign; });
        const signRulership = ZODIAC.find(function (entry) { return entry.name === sign; });
        const rulerRole = signRulership && signRulership.coRuler
          ? `one of ${sign}’s rulers`
          : `the ruler of ${sign}`;
        const signContext = isCusp
          ? `${sign} is shown as a cusp alternative for this birthday.`
          : `${sign} is the ${zodiacKind.toLowerCase()} sign for this reading.`;
        const signDescription = signMeaning ? ` ${signMeaning.description}` : '';
        const energy = PLANETARY_ENERGIES[ruler] || 'the distinctive themes associated with this planet';
        return `<h4 class="ls-local-card">${escHTML(fullCardName(card))}</h4><p class="ls-local-card-text">${escHTML(teaser)}</p><h5 class="ls-local-position-title">Sign</h5><p class="ls-local-position">${escHTML(signContext + signDescription)}</p><p class="ls-local-position">${escHTML(ruler + ', ' + rulerRole + ', brings ' + energy + '.')}</p>`;
      }
      if (kind === 'life-script') {
        const planet = position || 'Life Script';
        const meaning = lifeScriptPositionText(entry, planet, fullCardName(card));
        return `<h4 class="ls-local-card">${escHTML(fullCardName(card))}</h4><p class="ls-local-card-text">${escHTML(teaser)}</p><h5 class="ls-local-position-title">${escHTML(planet)} position</h5><p class="ls-local-position">${escHTML(meaning)}</p>`;
      }
      const cardIdx = relation && relation.pairIdx != null
        ? +relation.pairIdx
        : -1;
      const otherIdx = cardIdx;
      const otherCard = (typeof SPREAD_CARDS !== 'undefined' && otherIdx >= 0)
        ? SPREAD_CARDS[otherIdx]
        : null;
      const label = otherCard
        ? (relation && relation.role === 'displaces'
          ? `${fullCardName(otherCard)} displaces ${fullCardName(card)}`
          : `${fullCardName(card)} displaces ${fullCardName(otherCard)}`)
        : (kind === 'displaces' ? 'Displaces' : 'Displaced by');
      const otherIsDisplacer = relation && relation.role === 'displaces';
      const displacer = otherIsDisplacer ? otherCard : card;
      const displaced = otherIsDisplacer ? card : otherCard;
      const meaning = displacementMeaningText(displacer, displaced);
      return `<h4 class="ls-local-card">${escHTML(fullCardName(card))}</h4><p class="ls-local-card-text">${escHTML(teaser)}</p><h5 class="ls-local-position-title">${escHTML(label)}</h5><p class="ls-local-position">${escHTML(meaning)}</p>`;
    }
    function localPanelFor(el) {
      const scriptGroup = el.closest('.ls-life-script-group');
      if (scriptGroup) return scriptGroup.querySelector('[data-ls-local-reading]');
      const prcPanel = el.closest('.ls-prc-panel');
      if (prcPanel) return prcPanel.querySelector('[data-ls-local-reading]');
      const statBlock = el.closest('.ls-stat-block');
      return statBlock ? statBlock.querySelector('[data-ls-local-reading]') : null;
    }
    function openLocalReading(el) {
      const card = cardForIndex(+el.dataset.idx);
      const panel = localPanelFor(el);
      if (!card || !panel) return;
      const isOpen = !panel.hidden && panel.dataset.sourceIdx === String(el.dataset.idx) && panel.dataset.kind === el.dataset.lsInterpret;
      panel.hidden = true;
      panel.innerHTML = '';
      delete panel.dataset.sourceIdx;
      delete panel.dataset.kind;
      root.querySelectorAll('.ls-card[data-ls-interpret]').forEach(function (other) {
        if (localPanelFor(other) !== panel) return;
        other.classList.remove('is-local-active');
        other.setAttribute('aria-expanded', 'false');
      });
      if (isOpen) return;
      panel.innerHTML = localReadingHTML(card, el.dataset.lsInterpret, el.dataset.lsPosition, {
        role: el.dataset.lsRelation,
        pairIdx: el.dataset.lsPairIdx,
        trigger: el
      });
      panel.dataset.sourceIdx = String(el.dataset.idx);
      panel.dataset.kind = el.dataset.lsInterpret;
      panel.hidden = false;
      el.classList.add('is-local-active');
      el.setAttribute('aria-expanded', 'true');
    }
    // Finder rerenders replace the card nodes. Keep activation on the stable
    // container so the first click always reaches the currently rendered card.
    if (root.dataset.lsCardClicksBound !== 'true') {
      root.dataset.lsCardClicksBound = 'true';
      root.addEventListener('click', function (event) {
        const el = event.target.closest('.ls-card[data-ls-interpret], .ls-card[data-idx]:not([data-ls-interpret])');
        if (!el || !root.contains(el)) return;
        if (el.matches('[data-ls-interpret]')) {
          openLocalReading(el);
          return;
        }
        const idx = +el.dataset.idx;
        if (Number.isInteger(idx) && idx >= 0 && typeof window.loadCardInFinder === 'function') {
          window.loadCardInFinder(idx, el);
        }
      });
      root.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const el = event.target.closest('.ls-card[data-ls-interpret], .ls-card[data-idx]:not([data-ls-interpret])');
        if (!el || !root.contains(el)) return;
        event.preventDefault();
        if (el.matches('[data-ls-interpret]')) {
          openLocalReading(el);
          return;
        }
        const idx = +el.dataset.idx;
        if (Number.isInteger(idx) && idx >= 0 && typeof window.loadCardInFinder === 'function') {
          window.loadCardInFinder(idx, el);
        }
      });
    }
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
      <div class="ls-row ls-row--single">${singleSeatHTML('Karma', result.displacer, result.displacer, {
        symbol: '↔', label: 'Karma', title: 'Karmic displacement'
      })}</div>
      <p class="ls-connection-gloss">${escHTML(displacementMeaningText(result.displacer, result.displaced))}</p>
    </section>`;
  }

  /*
   * Connection result model
   * -----------------------
   * calculateRelationshipConnections() is deliberately DOM-free apart from
   * the two optional Finder dates. Each result says who owns the checked
   * spread, which role is in that spread, the seat, direction, and every
   * zodiac source that produced the same connection. Rendering below only
   * groups and presents those results. Public API:
   * window.calculateRelationshipConnections(card, partner, options)
   */
  function personLabel(side) {
    if (side === 'you') return window.finderBirthLabel || 'You';
    return window.finderPartnerLabel || 'They';
  }

  function possessivePerson(side) {
    const label = personLabel(side);
    if (side === 'you' && label === 'You') return 'Your';
    if (side !== 'you' && label === 'They') return 'Their';
    return /s$/i.test(label) ? `${label}'` : `${label}'s`;
  }

  function connectionModel(side, ownerCard, matchCard, ownerRole, matchRole, spread, seat, variant, extra) {
    const result = {
      side, ownerCard, matchCard, ownerRole, matchRole, spread,
      seat: seat || null, planet: seat && seat.planet, idx: seat && seat.idx,
      type: ownerRole === 'birth' && matchRole === 'birth' ? 'birth' : 'ruling',
      sourceVariants: variant ? [variant] : []
    };
    return Object.assign(result, extra || {});
  }

  function addConnection(results, result) {
    if (!result) return;
    // Tropical and sidereal are alternate sources for one established
    // connection. A cusp is deliberately kept separate so it can remain an
    // optional possibility rather than silently strengthening that result.
    const sourceBucket = result.sourceVariants[0] && result.sourceVariants[0].kind === 'cusp' ? 'cusp' : 'standard';
    const key = [result.type, result.side, result.ownerRole, result.matchRole,
      result.spread, result.planet || result.displacement || '',
      result.ownerCard.rank, result.ownerCard.suit, result.matchCard.rank, result.matchCard.suit, sourceBucket].join('|');
    const found = results.find(function (item) { return item._key === key; });
    if (found) {
      result.sourceVariants.forEach(function (variant) {
        if (!found.sourceVariants.some(function (old) { return old.kind === variant.kind && old.sign === variant.sign && old.ruler === variant.ruler; })) found.sourceVariants.push(variant);
      });
      return;
    }
    result._key = key;
    results.push(result);
  }

  function prcAsSeatConnection(fromCard, otherCard, otherDate, spread, kind, exactTropicalSign) {
    const prc = rulingCardForKind(otherCard, otherDate, kind, exactTropicalSign);
    const checker = spread === 'Spiritual Spread' ? window.spiritSpreadConnection : window.lifeScriptConnection;
    if (!prc || typeof checker !== 'function') return null;
    const seat = checker(fromCard, prc.rulingCard);
    if (!seat) return null;
    return Object.assign(seat, prc, { spread });
  }

  function variantFrom(result, kind) {
    return result ? { kind: kind, sign: result.sign, glyph: result.glyph, ruler: result.ruler, exact: !!result.exact } : null;
  }

  function exactTropicalSign(details, card) {
    if (!details || !details.year || !details.time || !details.place ||
        !window.SolarTime || typeof window.SolarTime.birthInstant !== 'function') return Promise.resolve(null);
    if (typeof window.solarValue === 'function' && window.solarValue(details.month, details.day) !== card.sv) return Promise.resolve(null);
    return window.SolarTime.birthInstant(details).then(function (instant) {
      if (!instant || !window.Astronomy || typeof window.Astronomy.Ecliptic !== 'function') return null;
      const longitude = window.Astronomy.Ecliptic(window.Astronomy.GeoVector(window.Astronomy.Body.Sun, instant.t, true)).elon;
      const signName = ASTRO_ZODIAC_NAMES[Math.floor((((longitude % 360) + 360) % 360) / 30)];
      const sign = ZODIAC.find(function (item) { return item.name === signName; });
      return sign ? Object.assign({}, sign, { exact: true }) : null;
    }).catch(function () { return null; });
  }

  function resolveExactTropicalSigns(card, partner) {
    return Promise.all([
      exactTropicalSign(window.finderBirthDetails, card),
      exactTropicalSign(window.finderPartnerBirthDetails, partner)
    ]).then(function (signs) { return { you: signs[0], them: signs[1] }; });
  }

  function prcPairVariant(kind, ownerPrc, matchPrc) {
    const owner = personLabel('you');
    const match = personLabel('them');
    return {
      kind: kind,
      exact: !!(ownerPrc.exact || matchPrc.exact),
      label: `${owner} ${ownerPrc.glyph} ${ownerPrc.sign} / ${ownerPrc.ruler} · ${match} ${matchPrc.glyph} ${matchPrc.sign} / ${matchPrc.ruler}`,
      ownerSign: ownerPrc.sign,
      ownerGlyph: ownerPrc.glyph,
      ownerRuler: ownerPrc.ruler,
      matchSign: matchPrc.sign,
      matchGlyph: matchPrc.glyph,
      matchRuler: matchPrc.ruler
    };
  }

  function addPrcToPrcConnections(results, yourCard, partnerCard, yourDate, partnerDate, yourExact, partnerExact, system) {
    const kinds = system === 'sidereal' ? ['sidereal', 'cusp']
      : system === 'both' ? ['tropical', 'sidereal', 'cusp']
        : ['tropical', 'cusp'];
    kinds.forEach(function (kind) {
      const yourPrcs = kind === 'cusp' && yourExact ? [] : (rulingCardsForKind(yourCard, yourDate, kind, yourExact) || []);
      const partnerPrcs = kind === 'cusp' && partnerExact ? [] : (rulingCardsForKind(partnerCard, partnerDate, kind, partnerExact) || []);
      if (!yourPrcs.length || !partnerPrcs.length) return;
      yourPrcs.forEach(function (yourPrc) { partnerPrcs.forEach(function (partnerPrc) {
      const variant = prcPairVariant(kind, yourPrc, partnerPrc);
      if (yourPrc.rulingCard.rank === partnerPrc.rulingCard.rank && yourPrc.rulingCard.suit === partnerPrc.rulingCard.suit) {
        addConnection(results, connectionModel('you', yourPrc.rulingCard, partnerPrc.rulingCard, 'ruling', 'ruling', 'Same ruling card', { planet: 'Same PRC' }, variant, { type: 'prc', samePrc: true }));
      }
      [
        { side: 'you', owner: yourPrc.rulingCard, match: partnerPrc.rulingCard },
        { side: 'them', owner: partnerPrc.rulingCard, match: yourPrc.rulingCard }
      ].forEach(function (pair) {
        ['Earthly Spread', 'Spiritual Spread'].forEach(function (spread) {
          const checker = spread === 'Spiritual Spread' ? window.spiritSpreadConnection : window.lifeScriptConnection;
          const seat = typeof checker === 'function' ? checker(pair.owner, pair.match) : null;
          if (seat) addConnection(results, connectionModel(pair.side, pair.owner, pair.match, 'ruling', 'ruling', spread, seat, variant, { type: 'prc' }));
          ['Moon', 'Pluto'].forEach(function (planet) {
            const derived = spread === 'Spiritual Spread' ? spiritDerivedConnection(planet, pair.owner, pair.match) : derivedConnection(planet, pair.owner, pair.match);
            if (derived) addConnection(results, connectionModel(pair.side, pair.owner, pair.match, 'ruling', 'ruling', spread, derived, variant, { type: 'prc' }));
          });
        });
        displacementConnections(pair.owner, pair.match).forEach(function (match) {
          const displacer = match.kind === 'displaces' ? pair.owner : pair.match;
          const displaced = match.kind === 'displaces' ? pair.match : pair.owner;
          addConnection(results, connectionModel(pair.side, displacer, displaced, 'ruling', 'ruling', 'Displacement', null, variant, { type: 'prc', displacement: 'displaces' }));
        });
      });
      }); });
    });
  }

  function prcSourceVariant(kind, sourcePrc, yourPrc, partnerPrc) {
    return {
      kind: kind,
      sign: sourcePrc.sign,
      glyph: sourcePrc.glyph,
      ruler: sourcePrc.ruler,
      exact: !!sourcePrc.exact,
      ownerSign: yourPrc && yourPrc.sign,
      ownerGlyph: yourPrc && yourPrc.glyph,
      matchSign: partnerPrc && partnerPrc.sign,
      matchGlyph: partnerPrc && partnerPrc.glyph
    };
  }

  function addPrcConnectionResults(results, card, partner, options, yourDate, partnerDate) {
    const exactSigns = {
      you: options.youTropicalSign || null,
      them: options.themTropicalSign || null
    };
    const people = [
      { side: 'you', owner: card, other: partner, ownDate: yourDate, otherDate: partnerDate, ownExact: exactSigns.you, otherExact: exactSigns.them },
      { side: 'them', owner: partner, other: card, ownDate: partnerDate, otherDate: yourDate, ownExact: exactSigns.them, otherExact: exactSigns.you }
    ];
    const kinds = options.prcSystem === 'sidereal' ? ['sidereal', 'cusp']
      : options.prcSystem === 'both' ? ['tropical', 'sidereal', 'cusp']
        : ['tropical', 'cusp'];
    people.forEach(function (person) {
      if (!person.ownDate) return;
      kinds.forEach(function (kind) {
        if (kind === 'cusp' && person.ownExact) return;
        const ownExact = kind === 'tropical' ? person.ownExact : null;
        const otherExact = kind === 'tropical' ? person.otherExact : null;
        const ownPrcs = rulingCardsForKind(person.owner, person.ownDate, kind, ownExact) || [];
        const otherPrcs = rulingCardsForKind(person.other, person.otherDate, kind, otherExact) || [];
        if (!ownPrcs.length) return;
        ownPrcs.forEach(function (ownPrc) {
        const yourPrc = person.side === 'you' ? ownPrc : (otherPrcs[0] || null);
        const partnerPrc = person.side === 'them' ? ownPrc : (otherPrcs[0] || null);
        const variant = prcSourceVariant(kind, ownPrc, yourPrc, partnerPrc);
        const direct = zodiacKindConnection(person.owner, person.ownDate, person.other, kind, ownExact, ownPrc.ruler);
        if (direct) {
          addConnection(results, connectionModel(person.side, person.owner, person.other,
            'birth', 'ruling', 'Ruling card', { planet: direct.planet }, variant, { type: 'prc' }));
        }
        ['Earthly Spread', 'Spiritual Spread'].forEach(function (spread) {
          const path = rulingPathConnection(person.owner, person.ownDate, person.other, spread, kind, ownExact, ownPrc.ruler);
          if (path) addConnection(results, connectionModel(person.side, path.rulingCard, person.other,
            'ruling', 'birth', spread, { planet: path.planet, idx: path.idx }, variant, { type: 'prc' }));
          ['Moon', 'Pluto'].forEach(function (planet) {
            const ownExtension = rulingDerivedConnection(person.owner, person.ownDate, person.other, spread, planet, kind, ownExact, ownPrc.ruler);
            if (ownExtension) addConnection(results, connectionModel(person.side, ownExtension.rulingCard, person.other,
              'ruling', 'birth', spread, { planet: planet }, variant, { type: 'prc' }));
            if (kind === 'cusp' && person.otherExact) return;
            otherPrcs.forEach(function (otherPrc) {
              const otherExtension = prcAsDerivedConnectionKind(person.owner, person.other, person.otherDate, spread, planet, kind, otherExact, otherPrc.ruler);
              if (!otherExtension) return;
              const otherVariant = prcSourceVariant(kind, otherExtension, yourPrc, partnerPrc);
              addConnection(results, connectionModel(person.side, person.owner, otherExtension.rulingCard,
                'birth', 'ruling', spread, { planet: planet }, otherVariant, { type: 'prc' }));
            });
          });
        });
        });
      });
    });
    if (yourDate && partnerDate) {
      addPrcToPrcConnections(results, card, partner, yourDate, partnerDate, exactSigns.you, exactSigns.them, options.prcSystem);
    }
  }

  // Moon intentionally shares Mercury's matching card in these spread
  // extensions. Keep both meanings, but make the visitor read one connection
  // rather than two visually identical results.
  function mergeMercuryMoonConnections(results) {
    const sourceKey = function (result) {
      return result.sourceVariants.map(function (source) {
        return [source.kind, source.sign || '', source.ruler || '', source.label || ''].join(':');
      }).sort().join('|');
    };
    const sameCard = function (left, right) { return left.rank === right.rank && left.suit === right.suit; };
    const used = {};
    return results.reduce(function (merged, result, index) {
      if (used[index]) return merged;
      if (result.planet !== 'Mercury' && result.planet !== 'Moon') {
        merged.push(result);
        return merged;
      }
      const otherIndex = results.findIndex(function (other, candidateIndex) {
        return candidateIndex !== index && !used[candidateIndex] &&
          ((result.planet === 'Mercury' && other.planet === 'Moon') || (result.planet === 'Moon' && other.planet === 'Mercury')) &&
          result.type === other.type && result.spread === other.spread &&
          result.ownerRole === other.matchRole && result.matchRole === other.ownerRole &&
          sameCard(result.ownerCard, other.matchCard) && sameCard(result.matchCard, other.ownerCard) &&
          sourceKey(result) === sourceKey(other);
      });
      if (otherIndex < 0) {
        merged.push(result);
        return merged;
      }
      const mercury = result.planet === 'Mercury' ? result : results[otherIndex];
      mercury.planets = ['Mercury', 'Moon'];
      mercury.planet = 'Mercury / Moon';
      used[index] = true;
      used[otherIndex] = true;
      merged.push(mercury);
      return merged;
    }, []);
  }

  function calculateRelationshipConnections(card, partner, options) {
    options = options || {};
    if (!card || !partner || card.suit === 'joker' || partner.suit === 'joker') return { results: [], missingBirthdays: false, joker: true };
    const yourDate = options.yourDate || selectedBirthDateForCard(card);
    const partnerDate = options.partnerDate || selectedPartnerDateForCard(partner);
    const results = [];
    const pairs = [
      { side: 'you', owner: card, match: partner },
      { side: 'them', owner: partner, match: card }
    ];
    pairs.forEach(function (pair) {
      ['Earthly Spread', 'Spiritual Spread'].forEach(function (spread) {
        const checker = spread === 'Spiritual Spread' ? window.spiritSpreadConnection : window.lifeScriptConnection;
        const seat = typeof checker === 'function' ? checker(pair.owner, pair.match) : null;
        if (seat) addConnection(results, connectionModel(pair.side, pair.owner, pair.match, 'birth', 'birth', spread, seat));
        ['Moon', 'Pluto'].forEach(function (planet) {
          const derived = spread === 'Spiritual Spread' ? spiritDerivedConnection(planet, pair.owner, pair.match) : derivedConnection(planet, pair.owner, pair.match);
          if (derived) addConnection(results, connectionModel(pair.side, pair.owner, pair.match, 'birth', 'birth', spread, derived));
        });
      });
      displacementConnections(pair.owner, pair.match).forEach(function (match) {
        const displacer = match.kind === 'displaces' ? pair.owner : pair.match;
        const displaced = match.kind === 'displaces' ? pair.match : pair.owner;
        addConnection(results, connectionModel(pair.side, displacer, displaced, 'birth', 'birth', 'Displacement', null, null, { displacement: 'displaces' }));
      });
    });
    if (options.includePrcConnections !== false) addPrcConnectionResults(results, card, partner, options, yourDate, partnerDate);
    const includePluto = options.includePlutoConnections !== false;
    const visibleResults = includePluto ? results : results.filter(function (result) {
      if (result.type !== 'prc') return true;
      return result.planet !== 'Pluto' && !result.sourceVariants.some(function (source) {
        return source.ruler === 'Pluto' || source.ownerRuler === 'Pluto' || source.matchRuler === 'Pluto';
      });
    });
    return {
      results: mergeMercuryMoonConnections(visibleResults),
      missingBirthdays: options.includePrcConnections !== false && (!yourDate || !partnerDate),
      joker: false
    };
  }

  function sourceLabels(result) {
    if (result.type === 'prc') return result.sourceVariants.map(function (source) {
      const mode = source.kind === 'sidereal' ? 'Sidereal' : source.kind === 'cusp' ? 'Cusp alternative' : (source.exact ? 'Exact tropical' : 'Tropical');
      if (source.label) return `${mode}: ${source.label}`;
      const sign = source.sign ? `${source.glyph || ''} ${source.sign}`.trim() : '';
      return `${mode}${sign ? ` ${sign}` : ''}${source.ruler ? ` · ${source.ruler} ruling card` : ''}`;
    }).join(' · ');
    return result.sourceVariants.filter(function (source) { return source.kind === 'sidereal' || source.kind === 'cusp' || source.exact; }).map(function (source) {
      const label = source.kind === 'sidereal' ? 'Sidereal (birthday approximation)' : source.kind === 'cusp' ? 'Cusp alternative' : 'Exact tropical';
      return `${label}${source.label ? ` ${source.label}` : source.sign ? ` ${source.glyph} ${source.sign}` : ''}`;
    }).join(' · ');
  }

  function connectionSummaryHTML(result) {
    if (result.samePrc) {
      const source = result.sourceVariants[0] || {};
      const yourSign = source.ownerSign ? `${source.ownerSign} ` : '';
      const theirSign = source.matchSign ? `${source.matchSign} ` : '';
      return `<p class="ls-connection-title"><b>${possessivePerson('you')} ${yourSign}planetary ruling card and ${possessivePerson('them')} ${theirSign}planetary ruling card are both ${result.ownerCard.rank}${result.ownerCard.sym}</b>.</p>`;
    }
    if (result.displacement) return `<p class="ls-connection-title"><b>${fullCardName(result.ownerCard)}</b> displaces <b>${fullCardName(result.matchCard)}</b>.</p>`;
    const owner = possessivePerson(result.side);
    const match = possessivePerson(result.side === 'you' ? 'them' : 'you');
    const zodiacTitle = function (side) {
      const source = result.sourceVariants[0];
      if (!source) return '';
      if (source.ownerSign) return side === 'you' ? `${source.ownerSign} ` : `${source.matchSign} `;
      return source.sign ? `${source.sign} ` : '';
    };
    const ownerRole = result.ownerRole === 'birth' ? 'birth card' : `${zodiacTitle(result.side)}planetary ruling card`;
    const matchRole = result.matchRole === 'birth' ? 'birth card' : `${zodiacTitle(result.side === 'you' ? 'them' : 'you')}planetary ruling card`;
    return `<p class="ls-connection-title"><b>${owner} ${ownerRole} ${result.ownerCard.rank}${result.ownerCard.sym}</b> → <b>${match} ${matchRole} ${result.matchCard.rank}${result.matchCard.sym}</b>.</p><p class="ls-connection-context">${result.spread} · ${result.planet}</p>`;
  }

  function connectionDiagramHTML(result) {
    if (result.samePrc) return `<div class="ls-row ls-row--single">${singleSeatHTML('PRC', result.ownerCard, result.ownerCard, { label: 'PRC', symbol: '✦', title: 'Shared planetary ruling card' })}</div>`;
    if (result.displacement) return `<div class="ls-row ls-row--single">${singleSeatHTML('Karma', result.ownerCard, result.ownerCard, { symbol: '↔', label: 'Karma', title: 'Karmic displacement' })}</div>`;
    if (result.spread === 'Ruling card') return `<div class="ls-row ls-row--single">${singleSeatHTML(result.planet, result.matchCard, result.matchCard)}</div>`;
    const single = result.planet === 'Moon' || result.planet === 'Pluto';
    const row = result.spread === 'Spiritual Spread'
      ? (single ? spiritDerivedSeatHTML(result.planet, result.ownerCard, result.matchCard) : spiritRowHTML(result.ownerCard, result.matchCard))
      : (single ? derivedSeatHTML(result.planet, result.ownerCard, result.matchCard) : scriptRowHTML(result.ownerCard, result.matchCard));
    return `<div class="ls-row${single ? ' ls-row--single' : ''}">${row}</div>`;
  }

  function connectionSectionModelHTML(result) {
    const gloss = result.displacement
      ? escHTML(displacementMeaningText(result.ownerCard, result.matchCard))
      : ((window.PLANET_CONN_TEXT || {})[result.planet] || '');
    const labels = sourceLabels(result);
    const source = labels ? `<p class="ls-connection-note">${labels}</p>` : '';
    const reading = result.planets ? ((window.PLANET_CONN_TEXT || {}).MercuryMoon || '') : gloss;
    const readingHTML = `<p class="ls-connection-gloss">${reading}</p>`;
    return `<section class="ls-connection">${connectionSummaryHTML(result)}${source}<details class="ls-connection-details"><summary aria-label="Show spread and interpretation"><span aria-hidden="true">⌄</span></summary>${connectionDiagramHTML(result)}${readingHTML}</details></section>`;
  }

  function relationshipConnectionsHTML(model, options) {
    options = options || {};
    const birth = model.results.filter(function (result) { return result.type === 'birth'; });
    const prc = model.results.filter(function (result) { return result.type === 'prc'; });
    const message = model.results.length ? '' : '<p class="ls-connection-empty">No connections found within the available connection types. This does not indicate compatibility.</p>';
    const info = `<details class="ls-connection-info"><summary aria-label="About connection types">i</summary><p><strong>Earthly Spread.</strong> Everyday expression: how the connection may show up through practical life, shared circumstances and visible relating.</p><p><strong>Spiritual Spread.</strong> Inner development: the meaning, growth and subtler learning the connection may invite.</p></details>`;
    const menuOpen = options.prcOptionsOpen ? ' open' : '';
    const connectionToggle = `<label class="ls-prc-connections-toggle"><input type="checkbox" data-prc-connections-toggle${options.includePrcConnections ? ' checked' : ''}><span>Include Planetary Ruling Card connections</span></label>`;
    const menu = `<details class="ls-connection-options" data-prc-options-menu${menuOpen}><summary aria-label="Connection options">Options <span aria-hidden="true">⌄</span></summary><div class="ls-connection-options-panel"><fieldset class="ls-prc-connection-system" aria-label="Planetary Ruling Card zodiac system"${options.includePrcConnections ? '' : ' disabled'}><legend>Zodiac system</legend><label><input type="radio" name="prc-connection-system" value="tropical" data-prc-connection-system${options.prcSystem !== 'sidereal' && options.prcSystem !== 'both' ? ' checked' : ''}><span>Tropical</span></label><label><input type="radio" name="prc-connection-system" value="sidereal" data-prc-connection-system${options.prcSystem === 'sidereal' ? ' checked' : ''}><span>Sidereal</span></label><label><input type="radio" name="prc-connection-system" value="both" data-prc-connection-system${options.prcSystem === 'both' ? ' checked' : ''}><span>Both</span></label></fieldset><label class="ls-prc-pluto-toggle"><input type="checkbox" data-prc-pluto-toggle${options.includePlutoConnections !== false ? ' checked' : ''}${options.includePrcConnections ? '' : ' disabled'}><span>Include Pluto connections</span></label></div></details>`;
    const prcMessage = options.includePrcConnections && model.missingBirthdays
      ? '<p class="ls-connection-empty">Enter both birthdays in Finder to calculate their PRC connections.</p>'
      : (options.includePrcConnections && !prc.length ? '<p class="ls-connection-empty">No Planetary Ruling Card connections were found for these birthdays.</p>' : '');
    const group = `<section class="ls-connection-group"><div class="ls-connection-group-head"><h4>Birth card connections</h4><div class="ls-connection-group-controls">${connectionToggle}${menu}${info}</div></div>${birth.map(connectionSectionModelHTML).join('')}${options.includePrcConnections ? `<div class="ls-prc-connection-group"><h5>Planetary Ruling Card connections</h5>${prcMessage}${prc.map(connectionSectionModelHTML).join('')}</div>` : ''}</section>`;
    return `<div class="ls-connections-wrap">${message}${group}</div>`;
  }

  function renderConnectionModel(root, inner, model) {
    const context = root._relationshipContext || {};
    inner.innerHTML = relationshipConnectionsHTML(model, context.options);
    bindLifeScriptCardClicks(inner);
    const optionsMenu = root.querySelector('[data-prc-options-menu]');
    if (optionsMenu && optionsMenu.dataset.bound !== 'true') {
      optionsMenu.dataset.bound = 'true';
      optionsMenu.addEventListener('toggle', function () {
        root.dataset.prcOptionsOpen = optionsMenu.open ? 'true' : 'false';
        if (root._relationshipContext) root._relationshipContext.options.prcOptionsOpen = optionsMenu.open;
      });
    }
    root._connectionModel = model;
  }

  function renderRelationshipConnections(card, partner) {
    const root = document.getElementById('fRelationshipConnections');
    if (!root) return false;
    clearAboutLifeScript();
    const inner = root.querySelector('.ls-inner') || root;
    root.classList.remove('is-empty');
    const includePrc = root.dataset.includePrcConnections === 'true';
    const context = {
      card: card,
      partner: partner,
      options: {
        includePrcConnections: includePrc,
        prcSystem: ['sidereal', 'both'].includes(root.dataset.prcConnectionSystem) ? root.dataset.prcConnectionSystem : 'tropical',
        includePlutoConnections: root.dataset.includePlutoConnections !== 'false',
        prcOptionsOpen: root.dataset.prcOptionsOpen === 'true',
        yourDate: selectedBirthDateForCard(card),
        partnerDate: selectedPartnerDateForCard(partner)
      }
    };
    root._relationshipContext = context;
    const model = calculateRelationshipConnections(card, partner, context.options);
    if (model.joker) {
      root.classList.add('is-empty');
      inner.innerHTML = '<p class="ls-connection-empty">Connections are not calculated for Joker selections.</p>';
      return false;
    }
    renderConnectionModel(root, inner, model);
    if (root.dataset.prcConnectionsToggleBound !== 'true') {
      root.dataset.prcConnectionsToggleBound = 'true';
      root.addEventListener('change', function (event) {
        const control = event.target.closest('[data-prc-connections-toggle], [data-prc-connection-system], [data-prc-pluto-toggle]');
        if (!control || !root.contains(control) || !root._relationshipContext) return;
        const current = root._relationshipContext;
        const requestId = (root._prcSignRequestId || 0) + 1;
        root._prcSignRequestId = requestId;
        const isPrcToggle = control.hasAttribute('data-prc-connections-toggle');
        const isPlutoToggle = control.hasAttribute('data-prc-pluto-toggle');
        if (isPrcToggle) {
          current.options.includePrcConnections = control.checked;
          root.dataset.includePrcConnections = control.checked ? 'true' : 'false';
        } else if (isPlutoToggle) {
          current.options.includePlutoConnections = control.checked;
          root.dataset.includePlutoConnections = control.checked ? 'true' : 'false';
        } else {
          current.options.prcSystem = control.value;
          root.dataset.prcConnectionSystem = control.value;
        }
        current.options.youTropicalSign = null;
        current.options.themTropicalSign = null;
        const update = function () {
          const updated = calculateRelationshipConnections(current.card, current.partner, current.options);
          renderConnectionModel(root, root.querySelector('.ls-inner') || root, updated);
        };
        update();
        const replacementControl = isPrcToggle
          ? root.querySelector('[data-prc-connections-toggle]')
          : (isPlutoToggle ? root.querySelector('[data-prc-pluto-toggle]') : root.querySelector(`[data-prc-connection-system][value="${current.options.prcSystem}"]`));
        if (replacementControl) replacementControl.focus({ preventScroll: true });
        if (!current.options.includePrcConnections || (current.options.prcSystem !== 'tropical' && current.options.prcSystem !== 'both')) return;
        resolveExactTropicalSigns(current.card, current.partner).then(function (signs) {
          if (root._prcSignRequestId !== requestId || root.dataset.includePrcConnections !== 'true' || root._relationshipContext !== current) return;
          current.options.youTropicalSign = signs.you;
          current.options.themTropicalSign = signs.them;
          update();
        });
      });
    }
    return model.results.length > 0;

    /* Legacy assembly retained below temporarily for reference during the
       rollout; unreachable after the result-model renderer above. */

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
  window.refreshLifeScriptDirection = refreshLifeScriptDirection;
  window.trimLifeDetailsForRelationship = trimLifeDetailsForRelationship;
  window.renderRelationshipConnections = renderRelationshipConnections;
  window.calculateRelationshipConnections = calculateRelationshipConnections;
  window.bindZodiacTabs = bindZodiacTabs;
})();
