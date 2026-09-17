(function () {
  'use strict';

  const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS_IN_MONTH = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Populate CARDS[i].dates (mirrors the old buildDates helper) —
  // the CARDS array shipped with every entry's `dates` field as a stray
  // literal '', so nothing downstream (About header, Life Script) ever
  // had a birth-date list to show. Every real calendar date maps to
  // exactly one card via the solar-value formula, so walk the whole
  // year once and collect each card's dates. `solarValue` is a function
  // declaration below — hoisted, so it's already callable here.
  (function buildCardDates() {
    if (typeof CARDS === 'undefined' || !CARDS.length) return;
    const lists = Array.from({ length: 52 }, () => []);
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= DAYS_IN_MONTH[m]; d++) {
        const sv = solarValue(m, d);
        if (sv >= 1 && sv <= 52) lists[sv - 1].push(`${MONTH_NAMES[m]} ${d}`);
      }
    }
    CARDS.forEach((c, i) => { if (i < 52) c.dates = lists[i].join(', '); });
  })();

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
  const RANK_VALUES = {
    A: 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    J: 11,
    Q: 12,
    K: 13
  };

  let _renderMode = 'empty';
  let dom = null;
  let _selectedCard = null;
  let _selectedPartner = null;
  let _selectedComposite = null;
  let _finderOverride = null;
  let _finderSnapshot = null;
  let _finderBirthLabel = '';
  let _transitionSource = null;
  // When a snapshot is restored (reset button), this remembers which side
  // the overridden card came from so the solo→triptych entrance sends that
  // card back to its own slot instead of always replaying the left-card
  // entrance. Consumed + cleared on the next captureAnimationContext call.
  let _pendingEnterOrigin = null;

  const finderSnapshot = {
    has() {
      return !!_finderSnapshot;
    },
    clear() {
      _finderSnapshot = null;
    },
    capture() {
      if (!dom) return null;
      _finderSnapshot = {
        relOn: !!(dom.root && dom.root.classList.contains('rel-on')),
        you: {
          month: dom.you && dom.you.month ? dom.you.month.value : '',
          day: dom.you && dom.you.day ? dom.you.day.value : ''
        },
        partner: {
          month: dom.partner && dom.partner.month ? dom.partner.month.value : '',
          day: dom.partner && dom.partner.day ? dom.partner.day.value : ''
        }
      };
      return _finderSnapshot;
    },
    restore() {
      if (!dom || !_finderSnapshot) return false;
      const snap = _finderSnapshot;
      if (dom.you.month) dom.you.month.value = snap.you.month || '';
      if (dom.you.day) dom.you.day.value = snap.you.day || '';
      if (dom.partner.month) dom.partner.month.value = snap.partner.month || '';
      if (dom.partner.day) dom.partner.day.value = snap.partner.day || '';
      if (dom.you.month) syncMonthInput(dom.you.month);
      if (dom.you.day) syncDayInput(dom.you.day, +dom.you.month.value || null);
      if (dom.partner.month) syncMonthInput(dom.partner.month);
      if (dom.partner.day) syncDayInput(dom.partner.day, +dom.partner.month.value || null);
      setRelationshipMode(!!snap.relOn);
      _finderSnapshot = null;
      return true;
    }
  };

  function getFinderUiState() {
    const relOn = !!(dom && dom.root && dom.root.classList.contains('rel-on'));
    return {
      relOn,
      override: _finderOverride,
      snapshot: finderSnapshot.has()
    };
  }

  function cacheDom() {
    const root = document.getElementById('finder');
    if (!root) return null;
    return {
      root,
      results: root.querySelector('.finder-results'),
      relBtn: document.getElementById('fRelToggle'),
      resetBtn: document.getElementById('fDateReset'),
      shareBtn: document.getElementById('finderShareBtn'),
      you: {
        month: document.getElementById('fMonth'),
        day: document.getElementById('fDay'),
        result: document.getElementById('fResult')
      },
      partner: {
        month: document.getElementById('fpMonth'),
        day: document.getElementById('fpDay'),
        result: document.getElementById('fpResult')
      },
      composite: {
        result: document.getElementById('frResult')
      },
      about: {
        root:        document.getElementById('fAbout'),
        modern:      document.getElementById('fAboutModern'),
        cardHeading: document.getElementById('fAboutCardHeading'),
        cardValue:   document.getElementById('fAboutCardValue'),
        connections: document.getElementById('fRelationshipConnections'),
        longform:    document.getElementById('fAboutLongform'),
        personality: document.getElementById('fAboutPersonality'),
        suit:        document.getElementById('fAboutSuit'),
        rank:        document.getElementById('fAboutRank')
      },
      panels: {
        wrap: document.getElementById('fPanels'),
        tabs: document.querySelectorAll('[data-reading-tab]'),
        about: document.getElementById('fAbout'),
        map: document.getElementById('fCardMap'),
        cycles: document.getElementById('fInTime')
      }
    };
  }

  function setReadingTab(name, options) {
    if (!dom || !dom.panels || !dom.panels.wrap) return;
    options = options || {};
    const relationship = dom.panels.wrap.classList.contains('is-relationship');
    if (name === 'cycles' && relationship) name = 'about';
    const panels = { about: dom.panels.about, map: dom.panels.map, cycles: dom.panels.cycles };
    Object.keys(panels).forEach(function (key) {
      const panel = panels[key];
      if (panel) panel.hidden = key !== name || (key === 'cycles' && relationship);
    });
    Array.from(dom.panels.tabs || []).forEach(function (tab) {
      const active = tab.dataset.readingTab === name;
      const unavailable = tab.dataset.readingTab === 'cycles' && relationship;
      tab.hidden = unavailable;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
    dom.panels.wrap.dataset.activeReadingTab = name;
    if (options.focus && panels[name]) panels[name].focus({ preventScroll: true });
  }

  function wireReadingTabs() {
    if (!dom || !dom.panels || !dom.panels.tabs) return;
    Array.from(dom.panels.tabs).forEach(function (tab) {
      tab.addEventListener('click', function () { setReadingTab(tab.dataset.readingTab, { focus: true }); });
      tab.addEventListener('keydown', function (event) {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const available = Array.from(dom.panels.tabs).filter(function (item) { return !item.hidden; });
        const current = available.indexOf(tab);
        let next = current;
        if (event.key === 'ArrowLeft') next = (current - 1 + available.length) % available.length;
        if (event.key === 'ArrowRight') next = (current + 1) % available.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = available.length - 1;
        event.preventDefault();
        available[next].focus();
        setReadingTab(available[next].dataset.readingTab);
      });
    });
  }

  function resultCard(slot) {
    return slot.result ? slot.result.querySelector('.spread-card') : null;
  }

  function solarValue(month, day) {
    return 55 - (2 * month + day);
  }

  function findCardFromSv(sv) {
    if (sv === 0) return { rank: 'Joker', suit: 'joker', sym: '✦', sv: 0 };
    if (sv < 1 || sv > 52) return null;
    const c = SPREAD_CARDS[sv - 1];
    return { rank: c.rank, suit: c.suit, sym: c.sym, sv: sv };
  }
  function findCard(month, day) { return findCardFromSv(solarValue(month, day)); }

  function firstDateForSv(sv) {
    for (let m = 1; m <= 12; m++) {
      const d = 55 - (2 * m) - sv;
      if (d >= 1 && d <= DAYS_IN_MONTH[m]) return { month: m, day: d };
    }
    return null;
  }

  function compositeCard(a, b) {
    if (!a || !b || a.sv === 0 || b.sv === 0) return null;
    let sv = a.sv + b.sv;
    while (sv > 52) sv -= 52;
    return findCardFromSv(sv);
  }

  function suitName(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  const SUIT_READINGS = {
    hearts: {
      symbol: '♥', element: 'Water',
      keywords: ['Love', 'Feeling', 'Relationship', 'Creation'],
      text: 'Hearts begin the sequence with the living current of emotion: affection, belonging, and human connection. They govern our closest relationships, from family and friendship to romantic love, along with art, music, poetry, and the pursuit of beauty. At their best, Hearts are warm, devoted, generous, and welcoming; their lesson is to love deeply without allowing desire to become possessiveness or self-indulgence.'
    },
    clubs: {
      symbol: '♣', element: 'Air',
      keywords: ['Knowledge', 'Mind', 'Communication', 'Learning'],
      text: 'Clubs belong to the active realm of the mind. Their quest is knowledge, expressed through curiosity, education, language, inquiry, and the exchange of ideas. Clubs connect one mind to another and turn understanding into something that can be taught or shared. At their best, they are perceptive, informed, and wise in counsel; their challenge is to keep intellectual force from becoming argument, manipulation, or cleverness without integrity.'
    },
    diamonds: {
      symbol: '♦', element: 'Earth',
      keywords: ['Values', 'Abundance', 'Exchange', 'Stewardship'],
      text: 'Diamonds belong to the tangible world: the harvest produced by our effort and the resources placed in our care. Although often associated with money, their deeper subject is value—what we seek, what we cultivate, and what we consider truly worthwhile. At their best, Diamonds create prosperity and use it generously; their challenge is to remember that wealth is a means of sustaining life, not the sole measure of it.'
    },
    spades: {
      symbol: '♠', element: 'Fire',
      keywords: ['Labor', 'Wisdom', 'Discipline', 'Transformation'],
      text: 'Spades carry the transforming fire of work, experience, and initiation. They meet material life directly, breaking difficult ground to uncover what is buried and clear the way for renewal. At their best, Spades are disciplined, tireless, and devoted to truth; their challenge is to transform hardship into understanding rather than becoming trapped in drudgery, severity, or control.'
    }
  };

  const RANK_READINGS = {
    A: {
      name: 'Ace', keywords: ['Desire', 'Beginning', 'Individuality', 'Initiative'],
      text: 'The Ace is the first movement of the cycle: desire awakening and reaching toward experience. It brings initiative, self-discovery, and the need to define what is genuinely wanted. At its best, the Ace begins with courage and clarity; its challenge is to keep a powerful sense of self from narrowing into impatience or self-absorption.'
    },
    2: {
      name: 'Two', keywords: ['Union', 'Cooperation', 'Partnership', 'Balance'],
      text: 'The Two encounters relationship, bringing separate forces together through cooperation and exchange. It seeks its counterpart and learns through partnership, contrast, and mutual support. At its best, the Two creates harmony without erasing difference; its challenge is to remain whole while navigating dependence, approval, and the fear of standing alone.'
    },
    3: {
      name: 'Three', keywords: ['Choice', 'Expression', 'Possibility', 'Direction'],
      text: 'The Three opens more than one path and asks for conscious choice. Its abundance of possibilities feeds imagination, communication, and creative expression, but can also scatter attention and divide intention. At its best, the Three turns uncertainty into discovery; its challenge is to choose a direction and give its gifts a clear form.'
    },
    4: {
      name: 'Four', keywords: ['Foundation', 'Security', 'Structure', 'Building'],
      text: 'The Four establishes the foundation: a protected field in which something lasting can be built. It brings order, concentration, practicality, and the patience to make an idea solid. At its best, the Four creates dependable support; its challenge is to let structure provide stability without allowing security to harden into resistance or confinement.'
    },
    5: {
      name: 'Five', keywords: ['Change', 'Freedom', 'Experience', 'Movement'],
      text: 'The Five breaks open the settled pattern and sends life into motion. It learns through variety, travel, surprise, and direct experience, finding opportunity where familiar structures begin to loosen. At its best, the Five turns change into growth; its challenge is to distinguish meaningful freedom from restlessness, escape, or change pursued for its own sake.'
    },
    6: {
      name: 'Six', keywords: ['Responsibility', 'Harmony', 'Adjustment', 'Reciprocity'],
      text: 'The Six restores balance through responsibility, adjustment, and the honest consequences of past choices. It is concerned with harmony, service, home, and the obligations that bind people into a larger whole. At its best, the Six protects and steadies others; its challenge is to carry duty without becoming static, controlling, or burdened by what does not truly belong to it.'
    },
    7: {
      name: 'Seven', keywords: ['Faith', 'Reflection', 'Testing', 'Inner Victory'],
      text: 'The Seven pauses the outward journey for examination, asking what remains true when certainty falls away. It is a number of testing, insight, and the inward search for a deeper standard of success. At its best, the Seven finds wisdom through faith and reflection; its challenge is to keep doubt, suspicion, or perfectionism from obscuring the meaning hidden within experience.'
    },
    8: {
      name: 'Eight', keywords: ['Power', 'Expansion', 'Mastery', 'Stewardship'],
      text: 'The Eight carries power: the capacity to expand, influence, and bring substantial results into being. Its strength is neither inherently constructive nor destructive; everything depends on how the will is directed. At its best, the Eight uses mastery in service of something larger; its challenge is to hold authority without domination, excess, or attachment to power itself.'
    },
    9: {
      name: 'Nine', keywords: ['Fulfilment', 'Release', 'Completion', 'Service'],
      text: 'The Nine completes the single-number cycle, gathering its experience before releasing what has reached an end. It broadens personal concerns into compassion, contribution, and service to the whole. At its best, the Nine gives freely and makes endings meaningful; its challenge is to let go without turning disappointment, sacrifice, or attachment into a lasting identity.'
    },
    10: {
      name: 'Ten', keywords: ['Success', 'Accomplishment', 'Aspiration', 'Renewal'],
      text: 'The Ten is completion carried onto a new level: the individual standing beside a larger possibility. It brings the tools for accomplishment, leadership, and visible success, together with the question of what that success is meant to serve. At its best, the Ten joins ambition with purpose; its challenge is to look beyond attainment, recognition, or control toward a more enduring measure of achievement.'
    },
    J: {
      name: 'Jack', keywords: ['Mentality', 'Youth', 'Inspiration', 'Experience'],
      text: 'The Jack is the youthful mind in motion: curious, inventive, and willing to learn through experience. It carries the energy of the messenger, student, adventurer, and inspired beginner, with a crown still waiting to be earned. At its best, the Jack turns fresh perception into original expression; its challenge is to mature beyond distraction, avoidance, or cleverness without direction.'
    },
    Q: {
      name: 'Queen', keywords: ['Intuition', 'Receptivity', 'Judgment', 'Creation'],
      text: 'The Queen represents receptive authority: the capacity to perceive, conceive, and bring an inner knowing into form. Her power works through intuition, cooperation, discernment, and the patient development of what is not yet visible. At her best, the Queen joins insight with wise judgment; her challenge is to remain receptive without surrendering her own center or withholding the gifts she is meant to embody.'
    },
    K: {
      name: 'King', keywords: ['Authority', 'Leadership', 'Mastery', 'Responsibility'],
      text: 'The King brings the cycle to mature authority, activating what the preceding ranks have developed. He represents leadership, initiative, sound command, and the responsibility to build for more than personal advantage. At his best, the King leads through mastery and cooperation; his challenge is to exercise power without hardening into domination, pride, or certainty that no longer listens.'
    }
  };

  function populateMonth(sel) {
    if (!sel) return;
    sel.value = '';
    sel.placeholder = 'MM';
  }
  function syncMonthInput(input) {
    if (!input) return;
    input.value = input.value.replace(/\D+/g, '').slice(0, 2);
    const value = parseInt(input.value, 10);
    if (!Number.isInteger(value)) return;
    if (input.value.length < 2 && input.value === '0') return;
    if (value < 1) input.value = '1';
    else if (value > 12) input.value = '12';
  }
  function normalizeMonthInput(input) {
    if (!input) return;
    const digits = input.value.replace(/\D+/g, '').slice(0, 2);
    if (!digits) {
      input.value = '';
      return;
    }
    const value = parseInt(digits, 10);
    if (!Number.isInteger(value)) {
      input.value = '';
      return;
    }
    if (digits.length === 1) {
      if (digits === '0') return;
      input.value = value > 9 ? '9' : String(value);
      return;
    }
    if (value < 1) input.value = '01';
    else if (value > 12) input.value = '12';
    else input.value = digits.padStart(2, '0');
  }
  function normalizeDayInput(input, month) {
    if (!input) return;
    const digits = input.value.replace(/\D+/g, '').slice(0, 2);
    const days = month ? DAYS_IN_MONTH[month] : 31;
    input.max = String(days);
    if (!digits) {
      input.value = '';
      return;
    }
    const value = parseInt(digits, 10);
    if (!Number.isInteger(value)) {
      input.value = '';
      return;
    }
    if (digits.length === 1) {
      if (digits === '0') return;
      input.value = value > 9 ? '9' : String(value);
      return;
    }
    if (value < 1) input.value = '01';
    else if (value > days) input.value = String(days).padStart(2, '0');
    else input.value = digits.padStart(2, '0');
  }
  function focusEnd(input) {
    if (!input || typeof input.setSelectionRange !== 'function') return;
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }
  function wireSelectAllOnFocus(input) {
    if (!input) return;

    function selectAll() {
      if (document.activeElement !== input) return;
      requestAnimationFrame(function () {
        input.select();
      });
    }

    input.addEventListener('focus', selectAll);
    input.addEventListener('click', selectAll);
    input.addEventListener('pointerup', function (e) {
      if (document.activeElement !== input) return;
      e.preventDefault();
      selectAll();
    });
  }
  function wireDatePair(dayInput, monthInput) {
    if (!dayInput || !monthInput) return;

    dayInput.addEventListener('input', function () {
      const digits = this.value.replace(/\D+/g, '');
      if (digits.length >= 2) {
        monthInput.focus();
        focusEnd(monthInput);
      }
    });

    monthInput.addEventListener('keydown', function (e) {
      const start = this.selectionStart;
      const end = this.selectionEnd;
      const empty = !this.value;
      const atStart = start === 0 && end === 0;
      if (e.key === 'Backspace' && (empty || atStart)) {
        dayInput.focus();
        focusEnd(dayInput);
      }
    });
  }

  function syncDayInput(input, month) {
    if (!input) return;
    input.value = input.value.replace(/\D+/g, '').slice(0, 2);
    const days = month ? DAYS_IN_MONTH[month] : 31;
    const value = parseInt(input.value, 10);
    if (!Number.isInteger(value)) return;
    if (input.value.length < 2 && input.value === '0') return;
    if (value < 1) input.value = '1';
    else if (value > days) input.value = String(days);
  }
  function setFinderOverride(card) {
    _finderOverride = card || null;
    updateResetButton();
  }
  function clearFinderOverride() {
    _finderOverride = null;
    updateResetButton();
  }
  function discardFinderSnapshot() {
    finderSnapshot.clear();
  }
  function restoreFinderSnapshot() {
    return finderSnapshot.restore();
  }
  function updateResetButton() {
    if (!dom || !dom.resetBtn) return;
    const savedDate = _finderSnapshot && _finderSnapshot.you;
    const canRestore = !!(savedDate && savedDate.month && savedDate.day);
    const show = !!_finderOverride && canRestore;
    dom.resetBtn.hidden = !show;
    dom.resetBtn.classList.toggle('on', show);
  }

  function updateShareButton() {
    if (!dom || !dom.shareBtn) return;
    const show = !!(
      (dom.you.result && dom.you.result.classList.contains('has-card')) ||
      (dom.partner.result && dom.partner.result.classList.contains('has-card')) ||
      (dom.composite.result && dom.composite.result.classList.contains('has-card'))
    );
    dom.shareBtn.hidden = !show;
    dom.shareBtn.classList.toggle('is-active', false);
  }

  function finderShareUrl() {
    if (!dom) dom = cacheDom();
    const url = new URL(window.location.href);
    url.hash = '';
    ['m', 'd', 'rel', 'pm', 'pd', 'card'].forEach(function (key) {
      url.searchParams.delete(key);
    });
    const m = dom && dom.you.month ? parseInt(dom.you.month.value, 10) : 0;
    const d = dom && dom.you.day ? parseInt(dom.you.day.value, 10) : 0;
    if (m && d) {
      url.searchParams.set('m', String(m));
      url.searchParams.set('d', String(d));
    }
    if (_finderOverride && _finderOverride.sv) {
      url.searchParams.set('card', String(_finderOverride.sv));
    }
    const relOn = !!(dom && dom.root && dom.root.classList.contains('rel-on'));
    const pm = dom && dom.partner.month ? parseInt(dom.partner.month.value, 10) : 0;
    const pd = dom && dom.partner.day ? parseInt(dom.partner.day.value, 10) : 0;
    if (relOn && pm && pd) {
      url.searchParams.set('rel', '1');
      url.searchParams.set('pm', String(pm));
      url.searchParams.set('pd', String(pd));
    }
    return url.toString();
  }

  function showShareCopied() {
    if (!dom || !dom.shareBtn) return;
    const old = dom.shareBtn.getAttribute('title') || 'Share Finder link';
    dom.shareBtn.setAttribute('title', 'Link copied');
    dom.shareBtn.classList.add('is-active');
    window.setTimeout(function () {
      if (!dom || !dom.shareBtn) return;
      dom.shareBtn.setAttribute('title', old);
      dom.shareBtn.classList.remove('is-active');
    }, 1400);
  }

  function shareFinderLink() {
    const url = finderShareUrl();
    const title = 'Mystics Cards Finder';
    const text = _selectedCard && _selectedCard.name
      ? `${_selectedCard.name} on mysticscards.space`
      : 'Mystics Cards Finder on mysticscards.space';
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(showShareCopied).catch(function () {
        window.prompt('Copy this Finder link:', url);
      });
      return;
    }
    window.prompt('Copy this Finder link:', url);
  }

  function applySharedFinderState() {
    if (!dom) dom = cacheDom();
    if (!dom || !dom.you.month || !dom.you.day) return;
    const params = new URLSearchParams(window.location.search);
    const m = parseInt(params.get('m') || '', 10);
    const d = parseInt(params.get('d') || '', 10);
    const pm = parseInt(params.get('pm') || '', 10);
    const pd = parseInt(params.get('pd') || '', 10);
    const card = parseInt(params.get('card') || '', 10);
    if (m && d && m >= 1 && m <= 12 && d >= 1 && d <= DAYS_IN_MONTH[m]) {
      syncSlotDate(dom.you, m, d);
    }
    if (params.get('rel') === '1' && pm && pd && pm >= 1 && pm <= 12 && pd >= 1 && pd <= DAYS_IN_MONTH[pm]) {
      setRelationshipMode(true);
      syncSlotDate(dom.partner, pm, pd);
    }
    if (card >= 1 && card <= 53) {
      const c = SPREAD_CARDS[card - 1];
      if (c) setFinderOverride({ rank: c.rank, suit: c.suit, sym: c.sym, sv: card });
    }
  }

  function cardName(card) {
    return card.suit === 'joker'
      ? 'The Joker'
      : `${RANK_NAMES[card.rank] || card.rank} of ${suitName(card.suit)}`;
  }

  function cardFaceHTML(card) {
    return `<div class="spread-card ${card.suit}">${spreadCardPips(card)}</div>`;
  }

  function resultHTML(card) {
    return cardFaceHTML(card);
  }

  function renderResult(result, card) {
    if (!result) return;
    result.onclick = null;
    result.onkeydown = null;
    result.onmousedown = null;
    if (!card) {
      result.innerHTML = '';
      result.classList.remove('has-card');
      result.style.cursor = '';
      return;
    }
    result.classList.add('has-card');
    result.innerHTML = resultHTML(card);
    const face = result.querySelector('.spread-card');
    const isSideRelationshipCard = result.id === 'fResult' || result.id === 'fpResult';
    if (face && typeof window.loadCardInFinder === 'function' && card.suit !== 'joker' && isSideRelationshipCard) {
      const open = function (e) {
        if (e) e.preventDefault();
        window.loadCardInFinder(card.sv - 1, result);
      };
      face.style.cursor = 'pointer';
      result.style.cursor = 'pointer';
      face.onmousedown = function (e) { e.preventDefault(); };
      face.onclick = open;
    } else {
      result.style.cursor = '';
      if (face) {
        face.style.cursor = '';
        face.onclick = null;
        face.onmousedown = null;
      }
    }
  }

  // About panel — the card reading. Content populated whenever a
  // card is picked (solo or triptych); panel visibility is controlled
  // by the tab wrapper #fPanels. The Joker has a full reading entry
  // (CARD_READINGS['✦_joker']) so it renders personality /
  // its main interpretation the same as any other card.
  //
  // Returns true if the panel has renderable content, false if it
  // should be marked empty (used by the picker to grey out its chip).
  function renderAbout(card, rel) {
    const box = dom.about;
    if (!box || !box.root) return false;
    box.root.classList.remove('is-joker', 'is-empty', 'is-relationship');
    if (!card) {
      if (box.cardHeading) box.cardHeading.textContent = '';
      if (box.cardValue) {
        box.cardValue.textContent = '';
        box.cardValue.removeAttribute('aria-label');
      }
      box.root.classList.add('is-empty');
      return false;
    }
    if (box.connections && !rel) box.connections.innerHTML = '';
    if (box.cardHeading) box.cardHeading.textContent = cardName(card);
    if (box.cardValue) {
      const cardIndex = typeof CARDS !== 'undefined'
        ? CARDS.findIndex(c => c.rank === card.rank && c.suit === card.suit)
        : -1;
      const cardValue = Number.isInteger(card.sv) ? card.sv : cardIndex + 1;
      box.cardValue.textContent = cardValue > 0 ? cardValue : '';
      if (cardValue > 0) box.cardValue.setAttribute('aria-label', `Solar Value ${cardValue}`);
      else box.cardValue.removeAttribute('aria-label');
    }
    const key       = `${card.rank}_${card.suit === 'joker' ? 'joker' : card.suit}`;
    const jokerKey  = card.suit === 'joker' ? '✦_joker' : null;
    const reading   = (window.CARD_READINGS || {})[jokerKey || key] || null;
    const longform  = !rel ? (window.LONG_CARD_READINGS || {})[jokerKey || key] || null : null;
    if (!reading && card.suit !== 'joker') { box.root.classList.add('is-empty'); return false; }

    if (box.longform) {
      const paraHTML = arr => (arr || []).map(p => `<p>${p}</p>`).join('');
      box.longform.innerHTML = longform
        ? `<section class="finder-long-section" aria-labelledby="fLongCoreH">
             <h3 class="finder-long-h" id="fLongCoreH">Your core nature</h3>
             ${paraHTML((longform.core || []).slice(0, 1))}
             <h3 class="finder-long-h">Your gifts</h3>
             <ul class="finder-long-list finder-long-gifts">${(longform.gifts || []).map(x => `<li>${x}</li>`).join('')}</ul>
             ${paraHTML((longform.core || []).slice(1))}
           </section>
           <section class="finder-long-section">
             <h3 class="finder-long-h">The challenge</h3>
             ${paraHTML(longform.challengeIntro)}
             <ul class="finder-long-list finder-long-shadows">${(longform.shadows || []).map(x => `<li>${x}</li>`).join('')}</ul>
             ${paraHTML(longform.shadowText)}
           </section>
           <section class="finder-long-section finder-long-awakening">
             <h3 class="finder-long-h">Your deeper purpose</h3>
             ${paraHTML(longform.purpose)}
             ${paraHTML(longform.highest)}
           </section>
           <section class="finder-long-explore" aria-labelledby="fLongExploreH">
             <h3 class="finder-long-explore-h" id="fLongExploreH">Explore further</h3>
             <details class="finder-long-disclosure">
               <summary>Work and calling</summary>
               <div class="finder-long-disclosure-body">${paraHTML(longform.work)}</div>
             </details>
             <details class="finder-long-disclosure">
               <summary>Relationships</summary>
               <div class="finder-long-disclosure-body">${paraHTML(longform.relationships)}</div>
             </details>
           </section>`
        : '';
    }
    const olneyButton = box.modern && box.modern.querySelector('#fModernOlney');
    if (typeof window.resetYenlo === 'function') window.resetYenlo();
    if (olneyButton) {
      olneyButton.onclick = function () {
        if (typeof window.toggleYenlo === 'function') window.toggleYenlo(card);
      };
    }

    const personality = rel
      ? (window.RELATIONSHIP_READINGS || {})[key]
      : reading && reading.personality;
    const paras = personality
      ? personality.split(/\n\n+/).map(p => `<p>${p}</p>`).join('')
      : '';
    if (box.personality) box.personality.innerHTML = paras;
    if (box.suit) {
      const suit = !rel && card.suit !== 'joker' ? SUIT_READINGS[card.suit] : null;
      box.suit.innerHTML = suit
        ? `<div class="finder-about-suit-heading">
             <h3 id="fAboutSuitHeading"><span class="finder-about-suit-symbol ${card.suit}" aria-hidden="true">${suit.symbol}</span>${suitName(card.suit)}</h3>
             <span class="finder-about-suit-element">${suit.element}</span>
           </div>
           <p class="finder-about-suit-keywords">${suit.keywords.join(' · ')}</p>
           <p class="finder-about-suit-text">${suit.text}</p>`
        : '';
      if (suit) box.suit.setAttribute('aria-labelledby', 'fAboutSuitHeading');
      else box.suit.removeAttribute('aria-labelledby');
    }
    if (box.rank) {
      const rank = !rel && card.suit !== 'joker' ? RANK_READINGS[card.rank] : null;
      box.rank.innerHTML = rank
        ? `<div class="finder-about-rank-heading">
             <h3 id="fAboutRankHeading">${rank.name}</h3>
             <span class="finder-about-rank-label" aria-label="Numerology ${RANK_VALUES[card.rank]}">${RANK_VALUES[card.rank]}</span>
           </div>
           <p class="finder-about-rank-keywords">${rank.keywords.join(' · ')}</p>
           <p class="finder-about-rank-text">${rank.text}</p>`
        : '';
      if (rank) box.rank.setAttribute('aria-labelledby', 'fAboutRankHeading');
      else box.rank.removeAttribute('aria-labelledby');
    }
    box.root.classList.toggle('is-joker', !reading);
    box.root.classList.toggle('is-relationship', !!rel);
    box.root.classList.toggle('has-longform', !!longform);
    if (box.modern) box.modern.classList.add('is-active');
    return true;
  }

  function readPerson(personDom) {
    if (!personDom || !personDom.month || !personDom.day) return null;
    const m = +personDom.month.value;
    const d = +personDom.day.value;
    if (!m || !d || d < 1 || d > DAYS_IN_MONTH[m]) return null;
    return findCard(m, d);
  }

  function updateGridPick(card, mode, extraCard) {
    if (typeof ensureSpreadCtl !== 'function') return;
    const ctl = ensureSpreadCtl();
    const ok = card && card.suit !== 'joker';
    if (mode === 'secondary') {
      const extraOk = extraCard && extraCard.suit !== 'joker';
      ctl.setPickPartner(
        ok ? card.rank : null,
        ok ? card.suit : null,
        extraOk ? extraCard.rank : null,
        extraOk ? extraCard.suit : null
      );
    } else {
      ctl.setPick(ok ? card.rank : null, ok ? card.suit : null);
      if (typeof ctl.setScript === 'function') ctl.setScript(ok ? card.rank : null, ok ? card.suit : null);
    }
  }

  function refreshFinderGridHighlights() {
    if (_selectedComposite) {
      updateGridPick(_selectedComposite, 'primary');
      updateGridPick(_selectedCard, 'secondary', _selectedPartner);
      return;
    }
    updateGridPick(_selectedCard, 'primary');
    updateGridPick(_selectedPartner, 'secondary');
  }

  function preserveAnchorPosition(anchor, work) {
    const before = anchor ? anchor.getBoundingClientRect() : null;
    const root = document.documentElement;
    const prevAnchor = root.style.overflowAnchor;
    root.style.overflowAnchor = 'none';
    work();
    if (!before || !before.width) {
      root.style.overflowAnchor = prevAnchor;
      return;
    }
    requestAnimationFrame(function () {
      if (!anchor.isConnected) {
        root.style.overflowAnchor = prevAnchor;
        return;
      }
      const after = anchor.getBoundingClientRect();
      const delta = after.top - before.top;
      if (Math.abs(delta) >= 1) {
        window.scrollTo({ top: window.scrollY + delta, left: window.scrollX, behavior: 'instant' });
      }
      root.style.overflowAnchor = prevAnchor;
    });
  }

  function reduceMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function computeMode(relOn, you, partner, comp) {
    if (relOn && you && partner && comp) return 'triptych';
    if (you) return 'solo';
    return 'empty';
  }

  function readFinderState() {
    const ui = getFinderUiState();
    const relOn = ui.relOn;
    const youDate = readPerson(dom.you);
    const you = ui.override || youDate;
    const partner = relOn ? readPerson(dom.partner) : null;
    const comp = relOn ? compositeCard(you, partner) : null;
    const targetMode = computeMode(relOn, you, partner, comp);
    return { you, partner, comp, targetMode };
  }

  function setRelationshipMode(on) {
    if (!dom || !dom.root || !dom.relBtn) return;
    dom.root.classList.toggle('rel-on', !!on);
    dom.relBtn.classList.toggle('on', !!on);
    dom.relBtn.textContent = on ? '−' : '+';
    dom.relBtn.setAttribute('aria-label', on ? 'Remove partner' : 'Add partner');
    dom.relBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (typeof window.refreshFinderTrayTargets === 'function') window.refreshFinderTrayTargets();
  }

  function clearPartnerInputs() {
    if (!dom || !dom.partner) return;
    if (dom.partner.month) dom.partner.month.value = '';
    if (dom.partner.day) dom.partner.day.value = '';
  }

  function clearYouInputs() {
    if (!dom || !dom.you) return;
    if (dom.you.month) dom.you.month.value = '';
    if (dom.you.day) dom.you.day.value = '';
  }

  function clearYouTransientState() {
    clearFinderOverride();
    finderSnapshot.clear();
  }

  function syncSlotDate(slot, month, day) {
    if (!slot || !slot.month || !slot.day) return;
    slot.month.value = String(month);
    syncMonthInput(slot.month);
    syncDayInput(slot.day, month);
    slot.day.value = String(day);
  }

  function runFinderUpdate(options) {
    options = options || {};
    const state = readFinderState();
    const animation = options.animate === false ? null : captureAnimationContext(state.targetMode);
    renderFinderState(state);
    if (window.SolarTime && typeof window.SolarTime.refresh === 'function') {
      window.SolarTime.refresh();
    }
    if (animation) playFinderAnimation(animation);
  }

  function ghostAt(src, rect) {
    const g = src.cloneNode(true);
    g.style.cssText =
      'position:fixed;' +
      `left:${rect.left}px;top:${rect.top}px;` +
      `width:${rect.width}px;height:${rect.height}px;` +
      'margin:0;z-index:100;pointer-events:none;will-change:transform,opacity;';
    document.body.appendChild(g);
    return g;
  }

  function markTransitionSource(slotName, anchorEl) {
    if (!anchorEl || _renderMode !== 'triptych') {
      _transitionSource = null;
      return;
    }
    // Clone the CARD for the exit ghost, never its .finder-result wrapper.
    // The wrapper is a fixed-width column (inline-size clamp ~140px) that's
    // far wider than the 5:7 card it centers, so cloning it produced a
    // landscape, squashed ghost that scaled DOWN toward center. Resolve to
    // the inner .spread-card so the ghost keeps the card's aspect ratio and
    // grows into the solo slot like the other transition ghosts do.
    const cardEl = anchorEl.classList && anchorEl.classList.contains('spread-card')
      ? anchorEl
      : (anchorEl.querySelector && anchorEl.querySelector('.spread-card')) || anchorEl;
    const rect = cardEl.getBoundingClientRect();
    _transitionSource = rect && rect.width ? { slot: slotName, rect, el: cardEl } : null;
  }

  function flipEnterRel(soloRect, origin) {
    if (reduceMotion() || !soloRect || !soloRect.width) return;
    origin = origin === 'partner' ? 'partner' : 'you';
    const slots = {
      you:       resultCard(dom.you),
      composite: resultCard(dom.composite),
      partner:   resultCard(dom.partner)
    };
    // The card that was solo emanates from the centre back to its own
    // slot; the other two fade + scale in. `origin` tracks which side the
    // solo came from — a reset after clicking the RIGHT card sends it back
    // to the right rather than replaying the left-card entrance.
    const lead   = slots[origin];
    const others = [slots.composite, slots[origin === 'partner' ? 'you' : 'partner']];
    if (!lead) return;
    const leadRect = lead.getBoundingClientRect();
    if (!leadRect.width) return;
    const dx = Math.round((soloRect.left + soloRect.width  / 2) - (leadRect.left + leadRect.width  / 2));
    const dy = Math.round((soloRect.top  + soloRect.height / 2) - (leadRect.top  + leadRect.height / 2));
    const scaleUp = soloRect.width / leadRect.width;

    lead.style.zIndex     = '5';
    lead.style.transition = 'none';
    lead.style.transform  = `translate(${dx}px, ${dy}px) scale(${scaleUp})`;

    others.forEach((el) => {
      if (!el) return;
      el.style.transition = 'none';
      el.style.opacity    = '0';
      el.style.transform  = 'scale(.85)';
    });
    lead.getBoundingClientRect();
    requestAnimationFrame(() => {
      lead.style.transition = 'transform .55s cubic-bezier(.4,0,.2,1)';
      lead.style.transform  = '';
      others.forEach((el, i) => {
        if (!el) return;
        const delay = 0.15 + i * 0.08;
        el.style.transition =
          `opacity .5s ease ${delay}s, transform .5s cubic-bezier(.4,0,.2,1) ${delay}s`;
        el.style.opacity   = '';
        el.style.transform = '';
      });
    });
    setTimeout(() => {
      [lead].concat(others).forEach((el) => {
        if (!el) return;
        el.style.removeProperty('transition');
        el.style.removeProperty('transform');
        el.style.removeProperty('opacity');
        el.style.removeProperty('z-index');
      });
    }, 800);
  }

  function flipExitRel(sourceEl, sourceRect) {
    if (reduceMotion() || !sourceEl || !sourceRect || !sourceRect.width) return;
    const solo = resultCard(dom.you);
    if (!solo) return;
    const soloRect = solo.getBoundingClientRect();
    if (!soloRect.width) return;
    const dx = Math.round((soloRect.left + soloRect.width  / 2) - (sourceRect.left + sourceRect.width  / 2));
    const dy = Math.round((soloRect.top  + soloRect.height / 2) - (sourceRect.top  + sourceRect.height / 2));
    const scaleUp = soloRect.width / sourceRect.width;
    const ghost = ghostAt(sourceEl, sourceRect);

    solo.style.opacity = '0';
    solo.style.transition = 'none';
    ghost.style.transform = 'translate(0, 0) scale(1)';
    ghost.getBoundingClientRect();
    requestAnimationFrame(() => {
      ghost.style.transition = 'transform .55s cubic-bezier(.4,0,.2,1), opacity .2s ease .35s';
      ghost.style.transform  = `translate(${dx}px, ${dy}px) scale(${scaleUp})`;
      solo.style.transition = 'opacity .18s ease .38s';
      solo.style.opacity = '';
    });
    setTimeout(() => {
      ghost.remove();
      solo.style.removeProperty('transition');
      solo.style.removeProperty('opacity');
    }, 700);
  }

  function captureAnimationContext(targetMode) {
    const solo2trip = _renderMode === 'solo' && targetMode === 'triptych';
    const trip2solo = _renderMode === 'triptych' && targetMode === 'solo';
    const enterOrigin = _pendingEnterOrigin || 'you';
    _pendingEnterOrigin = null;
    const ctx = { solo2trip, trip2solo, enterOrigin, soloRect: null, sourceRect: null, sourceEl: null, ghosts: [] };

    if (solo2trip) {
      const soloEl = resultCard(dom.you);
      ctx.soloRect = soloEl ? soloEl.getBoundingClientRect() : null;
      return ctx;
    }

    if (!trip2solo) return ctx;

    const slotEls = {
      you: resultCard(dom.you),
      composite: resultCard(dom.composite),
      partner: resultCard(dom.partner)
    };
    const sourceSlot = _transitionSource && _transitionSource.slot ? _transitionSource.slot : 'you';
    const sourceEl = slotEls[sourceSlot] || slotEls.you;
    ctx.sourceEl = _transitionSource && _transitionSource.el ? _transitionSource.el : sourceEl;
    ctx.sourceRect = _transitionSource && _transitionSource.rect
      ? _transitionSource.rect
      : (sourceEl ? sourceEl.getBoundingClientRect() : null);

    if (!reduceMotion()) {
      Object.keys(slotEls).forEach(function (slot) {
        if (slot === sourceSlot) return;
        const el = slotEls[slot];
        const rect = el ? el.getBoundingClientRect() : null;
        if (!el || !rect || !rect.width) return;
        ctx.ghosts.push(ghostAt(el, rect));
      });
    }
    _transitionSource = null;
    return ctx;
  }

  function animateGhostExit(ghosts) {
    if (!ghosts || !ghosts.length) return;
    requestAnimationFrame(() => {
      ghosts.forEach((ghost, i) => {
        const delay = i * 0.06;
        ghost.style.transition = `transform .58s cubic-bezier(.4,0,.2,1) ${delay}s, opacity .48s ease ${delay}s`;
        ghost.style.transform  = i === 0
          ? 'scale(.5) translateY(-10px)'
          : 'translateX(56px) scale(.78) rotate(8deg)';
        ghost.style.opacity    = '0';
      });
    });
    setTimeout(() => { ghosts.forEach(g => g.remove()); }, 800);
  }

  function playFinderAnimation(ctx) {
    if (ctx.solo2trip && ctx.soloRect) {
      flipEnterRel(ctx.soloRect, ctx.enterOrigin);
      return;
    }
    if (ctx.trip2solo && ctx.sourceEl && ctx.sourceRect) {
      flipExitRel(ctx.sourceEl, ctx.sourceRect);
      animateGhostExit(ctx.ghosts);
    }
  }

  function renderFinderState(state) {
    renderResult(dom.you.result, state.you);
    renderResult(dom.composite.result, state.comp);
    renderResult(dom.partner.result, state.partner);
    if (dom.results) dom.results.classList.toggle('triptych', state.targetMode === 'triptych');
    _selectedCard = state.you;
    _selectedPartner = state.partner;
    _selectedComposite = state.targetMode === 'triptych' ? state.comp : null;
    updateShareButton();
    if (_selectedComposite) {
      updateGridPick(_selectedComposite, 'primary');
      updateGridPick(state.you, 'secondary', state.partner);
    } else {
      updateGridPick(state.you, 'primary');
      updateGridPick(state.partner, 'secondary');
    }
    _renderMode = state.targetMode;
    updateResetButton();
    // Each selected card opens on About. Card map and personal Cycles are
    // separate panels; Cycles needs a single birthday context.
    const isSolo = state.targetMode === 'solo';
    const isRelationship = state.targetMode === 'triptych' && !!state.comp;
    if (dom.panels.wrap) {
      const showPanels = !!state.you && (isSolo || isRelationship);
      dom.panels.wrap.hidden = !showPanels;
      dom.panels.wrap.classList.toggle('is-relationship', isRelationship);
      if (showPanels) {
        setReadingTab('about');
        renderAbout(isRelationship ? state.comp : state.you, isRelationship ? state : null);
        if (isRelationship) {
          if (typeof window.renderRelationshipConnections === 'function') {
            window.renderRelationshipConnections(state.you, state.partner);
          }
        } else if (typeof window.renderLifeScript === 'function') {
          window.renderLifeScript(state.you);
        }
        if (!isRelationship && typeof window.renderInTime === 'function') {
          window.renderInTime(state.you);
        }
      }
    }
  }

  function find() {
    runFinderUpdate();
  }
  window.refreshFinderFromSettings = find;

  function toggleRel() {
    const willBeOn = !getFinderUiState().relOn;
    setRelationshipMode(willBeOn);
    find();
  }

  function loadCardInFinder(idx, anchorEl) {
    if (!dom) dom = cacheDom();
    if (!dom || !dom.you.month || !dom.you.day) return;
    const c = SPREAD_CARDS[idx] || (idx === 52 ? { rank: '✦', suit: 'joker', sym: '✦' } : null);
    if (!c) return;
    const anchor = anchorEl || document.querySelector(`#annualGrid .spread-card[data-idx="${idx}"]`);
    const restoreFocus = anchor && anchor.contains(document.activeElement);
    const sourceSlot = anchorEl === dom.partner.result ? 'partner'
      : anchorEl === dom.composite.result ? 'composite'
      : 'you';
    markTransitionSource(sourceSlot, anchor);
    preserveAnchorPosition(anchor, function () {
      if (!getFinderUiState().override) {
        finderSnapshot.capture();
        if (_finderSnapshot) _finderSnapshot.sourceSlot = sourceSlot;
      }
      // A directly selected card supersedes the calendar choice. Keep that
      // choice only in the snapshot so the visible date cannot imply the
      // override was derived from it; the reset control restores it.
      clearYouInputs();
      clearPartnerInputs();
      setRelationshipMode(false);
      setFinderOverride({ rank: c.rank, suit: c.suit, sym: c.sym, sv: idx === 52 ? 0 : idx + 1 });
      runFinderUpdate();
    });
    if (restoreFocus && !anchor.isConnected && dom.you.result) {
      dom.you.result.tabIndex = -1;
      dom.you.result.focus({ preventScroll: true });
    }
  }

  // Mirror of loadCardInFinder for a specific day/month rather than a card
  // index — used by js/birthdays.js (saved birthdays + manual add) and
  // js/finder-trays.js (Calendar). target 'partner' fills the partner slot
  // (opening it via toggleRel() first if relationship mode is off);
  // anything else fills "you".
  function loadDateInFinder(month, day, target, options) {
    if (!dom) dom = cacheDom();
    if (!dom) return;
    options = options || {};
    const isPartner = target === 'partner';
    const slot = isPartner ? dom.partner : dom.you;
    if (!slot.month || !slot.day) return;
    if (isPartner && !getFinderUiState().relOn) setRelationshipMode(true);
    if (!isPartner) {
      _finderBirthLabel = options.name ? String(options.name).trim() : '';
      window.finderBirthLabel = _finderBirthLabel;
      clearYouTransientState();
    }
    syncSlotDate(slot, month, day);
    runFinderUpdate();
  }

  window.loadCardInFinder = loadCardInFinder;
  window.refreshFinderGridHighlights = refreshFinderGridHighlights;
  window.loadDateInFinder = loadDateInFinder;
  window.finderBirthLabel = _finderBirthLabel;
  // Small read-only helpers the new finder-adjacent modules (birthdays,
  // calendar, solar-value calculator) need but that otherwise live only in
  // this file's closure.
  window.solarValue    = solarValue;
  window.MONTH_NAMES   = MONTH_NAMES;
  window.DAYS_IN_MONTH = DAYS_IN_MONTH;

  document.addEventListener('DOMContentLoaded', function () {
    dom = cacheDom();
    if (!dom || !dom.you.month || !dom.you.day) return;
    wireReadingTabs();

    populateMonth(dom.you.month);
    syncMonthInput(dom.you.month);
    syncDayInput(dom.you.day, null);
    if (dom.partner.month && dom.partner.day) {
      populateMonth(dom.partner.month);
      syncMonthInput(dom.partner.month);
      syncDayInput(dom.partner.day, null);
    }
    applySharedFinderState();
    runFinderUpdate({ animate: false });

    dom.you.month.addEventListener('input', function () { clearFinderOverride(); discardFinderSnapshot(); syncDayInput(dom.you.day, +this.value); find(); });
    dom.you.month.addEventListener('change', function () { clearFinderOverride(); discardFinderSnapshot(); normalizeMonthInput(this); syncDayInput(dom.you.day, +this.value); find(); });
    dom.you.day.addEventListener('input', function () { clearFinderOverride(); discardFinderSnapshot(); syncDayInput(this, +dom.you.month.value); find(); });
    dom.you.day.addEventListener('change', function () { clearFinderOverride(); discardFinderSnapshot(); normalizeDayInput(this, +dom.you.month.value); find(); });
    wireSelectAllOnFocus(dom.you.day);
    wireSelectAllOnFocus(dom.you.month);
    wireDatePair(dom.you.day, dom.you.month);
    if (dom.partner.month && dom.partner.day) {
      dom.partner.month.addEventListener('input', function () { syncDayInput(dom.partner.day, +this.value); find(); });
      dom.partner.month.addEventListener('change', function () { normalizeMonthInput(this); syncDayInput(dom.partner.day, +this.value); find(); });
      wireSelectAllOnFocus(dom.partner.day);
      wireSelectAllOnFocus(dom.partner.month);
      wireDatePair(dom.partner.day, dom.partner.month);
    }
    if (dom.partner.day) {
      dom.partner.day.addEventListener('input', function () { syncDayInput(this, +dom.partner.month.value); find(); });
      dom.partner.day.addEventListener('change', function () { normalizeDayInput(this, +dom.partner.month.value); find(); });
    }
    if (dom.resetBtn) {
      dom.resetBtn.addEventListener('click', function () {
        _pendingEnterOrigin = (_finderSnapshot && _finderSnapshot.relOn && _finderSnapshot.sourceSlot) || null;
        clearFinderOverride();
        restoreFinderSnapshot();
        find();
      });
    }
    if (dom.relBtn) dom.relBtn.addEventListener('click', toggleRel);
    if (dom.shareBtn) dom.shareBtn.addEventListener('click', shareFinderLink);

    window.addEventListener('mc-voice-toggle', function () {
      runFinderUpdate();
    });
  });
})();
