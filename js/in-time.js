// in-time.js — the "Cycles" 5-card row (13-Year / 7-Year / Yearly /
// 52-Day / Daily) for the Finder's picked card, plus the
// date-scroll nav that lets you view the row "as of" any date.
//
// Each focused cycle renders two layers: a concise paragraph for the card,
// drawn from the shared About reading, followed by two sentences describing
// the planet's influence at that horizon. This avoids maintaining five large,
// near-duplicate card × planet matrices and keeps editorial changes coherent.
//
// The card math: for a given birth-card index B and current age A:
//   • 13-Year    → deckAtAge(⌊A/91⌋+1) at position B, offset ⌊(A%91)/13⌋
//   • 7-Year     → deckAtAge(⌊A/49⌋+1) at position B, offset ⌊(A%49)/7⌋
//   • Yearly     → deckAtAge(⌊A/7⌋+1)  at position B, offset A%7
//   • 52-Day     → deckAtAge(A+1)      at position B, offset ⌊daysSinceBday/52⌋
//   • Daily      → deckAtAge(weeksAlive%90+1) at position B, offset weekdayShift
// A (age) is derived from the viewed date and the complete birth date selected
// in Finder. The age-based cycles require a known birth year. Quadrations has
// its own independent age stepper.
//
// Reads deckAtAge / SPREAD_PLANETS / SPREAD_PLANET_SYM / CARDS /
// spreadCardPips via classic-script globals. Loaded after cardsdata.js
// and after spread-grid.js (which provides `deckAtAge`).
//
// PUBLIC on window:
//   window.renderInTime(card) — populates the inline `#fInTime` section. Returns TRUE
//     when there's real content; FALSE for the Joker.
//   window.yearlyCycleCardAtAge(card, age) — the established Yearly card
//     calculation for a card and whole-number age, without rendering.
//   window.currentYearlyCycleForBirth(card, birthDetails[, referenceDate]) —
//     resolves the active birthday-to-birthday Yearly card for a saved birth.
//   window.yearlyCycleAgesForCard(card, targetCard[, maxAge]) — age-based
//     Yearly-card recurrences, used by relationship connections.

(function () {
  'use strict';

  const WD_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const IT_DEFAULT_FOCUS = 'daily';

  const PLANET_CYCLE_ENERGY = {
    Mercury: {
      first: 'Mercury quickens thought, conversation, study, messages, and movement, bringing the card’s meaning into the realm of perception and exchange.',
      second: 'Stay curious and communicate clearly, while giving a fast-moving mind enough focus to recognise what truly matters.'
    },
    Venus: {
      first: 'Venus draws attention toward relationship, harmony, beauty, pleasure, and the values that make life feel worth sharing.',
      second: 'Let affection and cooperation soften the card’s experience, without using comfort or agreement to avoid an honest need.'
    },
    Mars: {
      first: 'Mars adds heat, courage, desire, conflict, and the pressure to act, making the card’s energy more immediate and difficult to ignore.',
      second: 'Use the available force deliberately, choosing clean action over impatience, needless struggle, or reaction for its own sake.'
    },
    Jupiter: {
      first: 'Jupiter expands whatever the card carries, opening possibilities through confidence, generosity, learning, influence, and a wider field of experience.',
      second: 'Welcome growth while keeping proportion, because opportunity becomes wisdom only when abundance is directed with discernment.'
    },
    Saturn: {
      first: 'Saturn brings responsibility, limits, patience, and consequence, asking the card’s promise to take a durable and accountable form.',
      second: 'Accept the necessary work and clarify the boundary, remembering that a delay can become structure rather than denial.'
    },
    Uranus: {
      first: 'Uranus unsettles the expected pattern through freedom, invention, sudden change, and an insistence that the card find a more authentic expression.',
      second: 'Leave room for surprise and revise what has become rigid, while resisting disruption that serves novelty rather than liberation.'
    },
    Neptune: {
      first: 'Neptune opens the card toward imagination, intuition, compassion, distance, and the unseen currents moving beneath ordinary events.',
      second: 'Listen to the dream without surrendering discernment, keeping enough practical ground beneath you to give inspiration a truthful form.'
    }
  };

  function horizonOpening(label) {
    switch ((label || '').toLowerCase()) {
      case '13-year': return 'Across this thirteen-year era';
      case '7-year':  return 'Across this seven-year chapter';
      case 'yearly':  return 'During this year';
      case '52-day':  return 'During this fifty-two-day period';
      default:        return 'Today';
    }
  }

  // ── Date-scroll state ────────────────────────────────────────────
  // viewDate is a local-midnight epoch (ms). renderInTime always shows
  // the row "as of" this date; the date input/Today button
  // shift it and re-render. _lastCard remembers the last card passed to
  // renderInTime so the date controls (which don't get a card reference
  // themselves) can trigger a re-render.
  let viewDate = localMidnight(new Date());
  let _lastCard = null;
  let _activeLabel = IT_DEFAULT_FOCUS;
  let _activeCards = [];
  let _expandedCycleRows = {};

  function isViewingToday() {
    return viewDate === localMidnight(new Date());
  }
  function formatViewDate(ms) {
    const d = new Date(ms);
    const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
    return `${d.getDate()} ${mo} ${d.getFullYear()}`;
  }
  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
  function favoriteBirthdays() {
    if (!window.CardsStore || typeof window.CardsStore.loadBirths !== 'function') return [];
    return window.CardsStore.loadBirths().filter(function (entry) {
      return entry && entry.favorite && Number.isInteger(Number(entry.id)) &&
        Number.isInteger(Number(entry.year)) && Number.isInteger(Number(entry.month)) && Number.isInteger(Number(entry.day));
    }).sort(function (a, b) {
      return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
    });
  }
  function favoriteListHTML() {
    const favorites = favoriteBirthdays();
    if (!favorites.length) return `<p class="it-wheel-favorites-empty">No favourites saved yet.</p><button type="button" data-it-open-favorites>Open contacts</button>`;
    return favorites.map(function (entry) {
      const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(entry.month) - 1];
      return `<button type="button" class="it-wheel-favorite" data-it-favorite-id="${Number(entry.id)}"><span>${escapeHTML(entry.name || 'Unnamed contact')}</span><small>${Number(entry.day)} ${month} ${Number(entry.year)}</small></button>`;
    }).join('');
  }
  function renderCycleFavorites() {
    const host = document.getElementById('itFavorites');
    if (!host) return;
    host.innerHTML = favoriteListHTML();
  }
  function loadFavoriteBirthday(id) {
    const entry = favoriteBirthdays().find(function (item) { return String(item.id) === String(id); });
    if (!entry || typeof window.loadDateInFinder !== 'function') return;
    window.loadDateInFinder(Number(entry.month), Number(entry.day), 'self', {
      name: entry.name,
      year: Number(entry.year),
      birthDetails: { year: Number(entry.year), month: Number(entry.month), day: Number(entry.day) }
    });
  }
  function isoFromMs(ms) {
    const d = new Date(ms);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function compactDate(ms) {
    const d = new Date(ms);
    const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
    return `${d.getDate()} ${mo}`;
  }
  function setViewDate(ms) {
    viewDate = localMidnight(new Date(ms));
    renderInTime(_lastCard);
  }
  function setActiveFocus(label, options) {
    options = options || {};
    _activeLabel = label || IT_DEFAULT_FOCUS;
    if (options.syncToStart) {
      const target = (_activeCards || []).find(function (pc) { return pc.slug === _activeLabel; });
      if (target && typeof target.startMs === 'number') {
        setViewDate(target.startMs);
        return;
      }
    }
    renderInTime(_lastCard);
  }
  function birthBoundaryMs() {
    const birth = readFinderDate();
    if (!birth || !Number.isInteger(birth.year)) return null;
    return localMidnight(new Date(birth.year, birth.m - 1, birth.d));
  }

  function shiftedHorizonMs(active, dir) {
    const startMs = typeof active.startMs === 'number' ? active.startMs : viewDate;
    if (_activeLabel === 'daily') {
      return addCalendarDays(startMs, dir);
    }
    if (_activeLabel === '52-day') {
      const birth = readFinderDate();
      const match = /period\s+(\d+)\/7/i.exec(active.sub || '');
      const periodNum = match ? parseInt(match[1], 10) : 0;
      if (!birth || !periodNum) {
        return addCalendarDays(startMs, dir * 52);
      }
      const cycleYear = lastBdayYearOf(startMs, birth.m, birth.d);
      if (dir > 0) {
        if (periodNum >= 7) {
          return localMidnight(new Date(cycleYear + 1, birth.m - 1, birth.d));
        } else {
          return addCalendarDays(startMs, 52);
        }
      }
      if (periodNum <= 1) {
        const previousCycleStart = localMidnight(new Date(cycleYear - 1, birth.m - 1, birth.d));
        return addCalendarDays(previousCycleStart, 6 * 52);
      } else {
        return addCalendarDays(startMs, -52);
      }
    }
    if (_activeLabel === 'yearly' || _activeLabel === '7-year' || _activeLabel === '13-year') {
      const years = _activeLabel === 'yearly' ? 1 : (_activeLabel === '7-year' ? 7 : 13);
      const d = new Date(startMs);
      d.setFullYear(d.getFullYear() + (dir * years));
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }
    return null;
  }

  function canShiftActiveHorizon(active, dir) {
    const nextMs = shiftedHorizonMs(active, dir);
    const boundary = birthBoundaryMs();
    return typeof nextMs === 'number' && (dir >= 0 || boundary == null || nextMs >= boundary);
  }

  function shiftActiveHorizon(dir) {
    if (!dir) return;
    const active = (_activeCards || []).find(function (pc) { return pc.slug === _activeLabel; });
    if (!active || !canShiftActiveHorizon(active, dir)) return;
    const nextMs = shiftedHorizonMs(active, dir);
    if (typeof nextMs === 'number') setViewDate(nextMs);
  }
  function dateNavHTML() {
    return `<div class="it-date-shell">
      <div class="it-date-head">
        <div class="it-date-row">
          <button class="it-date-label" type="button" title="Pick a date" aria-label="Pick a date">
            <span class="it-date-age">Date</span>
            <span class="it-date-value">${formatViewDate(viewDate)}</span>
          </button>
          <button class="it-date-today${isViewingToday() ? '' : ' visible'}" type="button" title="Reset to today">↻ Today</button>
        </div>
      </div>
      <button class="it-date-favorites-toggle" type="button" data-it-favorites-toggle data-it-date-favorites-toggle aria-label="Show favourite birthdays" aria-expanded="false" aria-controls="itDateFavorites">☆</button>
      <div class="it-date-favorites" id="itDateFavorites" aria-label="Favourite birthdays" hidden>${favoriteListHTML()}</div>
      <input class="it-date-input" type="date" tabindex="-1" aria-hidden="true" value="${isoFromMs(viewDate)}" />
    </div>`;
  }
  function wireDateNav() {
    const root = document.getElementById('fInTime');
    if (!root) return;
    let readingTouch = null;
    let readingWheelTotal = 0;
    let readingWheelUsed = false;
    let readingWheelCanRearm = false;
    let readingWheelDirection = 0;
    let readingWheelTimer = null;
    function closeFavoriteMenus(focusToggle) {
      root.querySelectorAll('.it-favorites, .it-date-favorites').forEach(function (menu) {
        const wasOpen = !menu.hidden;
        menu.hidden = true;
        const toggle = root.querySelector('[data-it-favorites-toggle][aria-controls="' + menu.id + '"]');
        if (toggle) {
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', 'Show favourite birthdays');
          if (focusToggle && wasOpen) toggle.focus({ preventScroll: true });
        }
      });
    }
    root.addEventListener('click', function (ev) {
      const favoritesToggle = ev.target.closest('[data-it-favorites-toggle]');
      if (favoritesToggle) {
        const favorites = document.getElementById(favoritesToggle.getAttribute('aria-controls'));
        if (favorites) {
          const open = favorites.hidden;
          closeFavoriteMenus(false);
          favorites.hidden = !open;
          favoritesToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
          favoritesToggle.setAttribute('aria-label', open ? 'Hide favourite birthdays' : 'Show favourite birthdays');
        }
        return;
      }
      const wheelFavorite = ev.target.closest('[data-it-favorite-id]');
      if (wheelFavorite) {
        const id = wheelFavorite.getAttribute('data-it-favorite-id');
        closeFavoriteMenus(false);
        loadFavoriteBirthday(id);
        return;
      }
      if (ev.target.closest('[data-it-open-favorites]')) {
        if (typeof window.showAppView === 'function') window.showAppView('finder');
        if (typeof window.openBirthPanel === 'function') window.openBirthPanel();
        return;
      }
      const focusBtn = ev.target.closest('[data-it-focus]');
      if (focusBtn) {
        setActiveFocus(focusBtn.getAttribute('data-it-focus') || IT_DEFAULT_FOCUS, { syncToStart: true });
        return;
      }
      const cycleBtn = ev.target.closest('[data-it-cycle]');
      if (cycleBtn) {
        const dir = parseInt(cycleBtn.getAttribute('data-it-cycle') || '0', 10);
        if (!dir) return;
        shiftActiveHorizon(dir);
        return;
      }
      const expandBtn = ev.target.closest('[data-it-expand]');
      if (expandBtn) {
        const slug = expandBtn.getAttribute('data-it-expand');
        if (!slug) return;
        _expandedCycleRows[slug] = !_expandedCycleRows[slug];
        renderInTime(_lastCard);
        return;
      }
      const todayBtn = ev.target.closest('.it-date-today');
      if (todayBtn) { setViewDate(Date.now()); return; }
      const label = ev.target.closest('.it-date-label');
      if (label) {
        const input = root.querySelector('.it-date-input');
        if (!input) return;
        if (typeof input.showPicker === 'function') {
          try { input.showPicker(); return; } catch (e) { /* fall through */ }
        }
        input.focus();
        input.click();
      }
    });
    root.addEventListener('input', function (ev) {
      const form = ev.target.closest('[data-it-birthday-form]');
      if (!form) return;
      form.elements.day.setCustomValidity('');
      if (ev.target.name === 'year' && ev.target.value.length === 4 &&
          form.elements.day.value && form.elements.month.value) {
        form.requestSubmit();
      }
    });
    root.addEventListener('submit', function (ev) {
      const form = ev.target.closest('[data-it-birthday-form]');
      if (!form) return;
      ev.preventDefault();
      form.elements.day.setCustomValidity('');
      if (!form.reportValidity()) return;
      const year = Number(form.elements.year.value);
      const month = Number(form.elements.month.value);
      const day = Number(form.elements.day.value);
      const daysInMonth = [0, 31, (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > daysInMonth[month]) {
        form.elements.day.setCustomValidity('Enter a valid birthday.');
        form.elements.day.reportValidity();
        return;
      }
      form.elements.day.setCustomValidity('');
      if (typeof window.loadDateInFinder === 'function') {
        window.loadDateInFinder(month, day, 'self', {
          year: year,
          birthDetails: { year: year, month: month, day: day }
        });
      }
    });
    root.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      const openMenu = root.querySelector('.it-favorites:not([hidden]), .it-date-favorites:not([hidden])');
      if (openMenu) closeFavoriteMenus(true);
    });
    root.addEventListener('pointerdown', function (ev) {
      const openMenu = root.querySelector('.it-favorites:not([hidden]), .it-date-favorites:not([hidden])');
      if (!openMenu || openMenu.contains(ev.target) || ev.target.closest('[data-it-favorites-toggle]')) return;
      closeFavoriteMenus(false);
    });
    root.addEventListener('change', function (ev) {
      const input = ev.target.closest('.it-date-input');
      if (!input || !input.value) return;
      const [y, m, d] = input.value.split('-').map(Number);
      setViewDate(new Date(y, m - 1, d).getTime());
    });
    root.addEventListener('touchstart', function (ev) {
      if (ev.touches.length !== 1 || !ev.target.closest('.it-reading') || ev.target.closest('button, input')) {
        readingTouch = null;
        return;
      }
      readingTouch = { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
    }, { passive: true });
    root.addEventListener('touchcancel', function () { readingTouch = null; }, { passive: true });
    root.addEventListener('touchend', function (ev) {
      if (!readingTouch || !ev.changedTouches.length) return;
      const dx = ev.changedTouches[0].clientX - readingTouch.x;
      const dy = ev.changedTouches[0].clientY - readingTouch.y;
      readingTouch = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        shiftActiveHorizon(dx < 0 ? 1 : -1);
      }
    }, { passive: true });
    root.addEventListener('wheel', function (ev) {
      if (!ev.target.closest('.it-reading') || ev.target.closest('button, input') || ev.ctrlKey ||
          Math.abs(ev.deltaX) <= Math.abs(ev.deltaY) * 1.25) return;
      ev.preventDefault();
      const unit = ev.deltaMode === 1 ? 16 : (ev.deltaMode === 2 ? window.innerWidth : 1);
      const delta = ev.deltaX * unit;
      const magnitude = Math.abs(delta);
      const direction = Math.sign(delta);
      if (readingWheelUsed) {
        if (magnitude <= 3) readingWheelCanRearm = true;
        if ((readingWheelCanRearm && magnitude >= 8) || (direction !== readingWheelDirection && magnitude >= 8)) {
          readingWheelTotal = 0;
          readingWheelUsed = false;
          readingWheelCanRearm = false;
        }
      }
      if (!readingWheelUsed) readingWheelTotal += delta;
      if (!readingWheelUsed && Math.abs(readingWheelTotal) >= 32) {
        readingWheelUsed = true;
        readingWheelDirection = Math.sign(readingWheelTotal);
        shiftActiveHorizon(readingWheelTotal > 0 ? 1 : -1);
      }
      if (readingWheelTimer !== null) window.clearTimeout(readingWheelTimer);
      readingWheelTimer = window.setTimeout(function () {
        readingWheelTotal = 0;
        readingWheelUsed = false;
        readingWheelCanRearm = false;
        readingWheelDirection = 0;
        readingWheelTimer = null;
      }, 90);
    }, { passive: false });
  }

  function pcReadCard(spreadIdx, birthCardIdx, posIdx) {
    const deck = deckAtAge(spreadIdx + 1);
    const p = deck.indexOf(birthCardIdx);
    return deck[(p + 1 + posIdx) % 52];
  }

  // Keep the relationship feature on precisely the same Yearly mathematics
  // used by the Cycles panel: one seven-year deck, then one planet position
  // for each age within that deck.
  function cardIndex(card) {
    if (!card || card.suit === 'joker') return -1;
    if (Number.isInteger(card.sv) && card.sv >= 1 && card.sv <= 52) return card.sv - 1;
    return CARDS.findIndex(function (candidate) { return candidate.rank === card.rank && candidate.suit === card.suit; });
  }

  function yearlyCycleCardAtAge(card, age) {
    const birthIdx = cardIndex(card);
    if (birthIdx < 0 || !Number.isInteger(age) || age < 0) return null;
    const spreadIdx = Math.floor(age / 7);
    const position = age % 7;
    const idx = pcReadCard(spreadIdx, birthIdx, position);
    return {
      idx: idx,
      card: CARDS[idx],
      age: age,
      planet: SPREAD_PLANETS[position],
      cycleStartAge: age - position,
      cycleEndAge: age - position + 6
    };
  }

  function currentYearlyCycleForBirth(card, birthDetails, referenceDate) {
    const details = birthDetails || {};
    const year = Number(details.year);
    const month = Number(details.month);
    const day = Number(details.day);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1 || day > 31) return null;
    const referenceMs = referenceDate instanceof Date ? referenceDate.getTime() : Date.now();
    const age = lastBdayYearOf(referenceMs, month, day) - year;
    return age < 0 ? null : yearlyCycleCardAtAge(card, age);
  }

  function yearlyCycleAgesForCard(card, targetCard, maxAge) {
    const targetIdx = cardIndex(targetCard);
    const limit = Number.isInteger(maxAge) && maxAge >= 0 ? maxAge : 90;
    if (targetIdx < 0) return [];
    const ages = [];
    for (let age = 0; age <= limit; age++) {
      const cycle = yearlyCycleCardAtAge(card, age);
      if (cycle && cycle.idx === targetIdx) ages.push(age);
    }
    return ages;
  }

  // Local-midnight epoch (ms) — keeps viewDate math stable so day
  // counts survive DST + timezone drift.
  function localMidnight(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }
  function addCalendarDays(ms, days) {
    const date = new Date(ms);
    date.setDate(date.getDate() + days);
    return localMidnight(date);
  }

  // The birthday of the calendar year `refMs` falls in, or the year
  // before if the birthday hasn't happened yet.
  function lastBdayYearOf(refMs, m, d) {
    const t = new Date(refMs);
    const ty = t.getFullYear();
    const refUTC = Date.UTC(ty, t.getMonth(), t.getDate());
    return (Date.UTC(ty, m - 1, d) > refUTC) ? ty - 1 : ty;
  }

  // Read the selected birthday from Finder. Year is null when the visitor
  // entered only a day and month, so age-based calculations can request it.
  function readFinderDate() {
    const monEl = document.getElementById('fMonth');
    const dayEl = document.getElementById('fDay');
    if (!monEl || !dayEl) return null;
    const m = parseInt(monEl.value, 10);
    const d = parseInt(dayEl.value, 10);
    if (!m || !d) return null;
    const details = window.finderBirthDetails;
    const year = details && Number.isInteger(details.year) &&
      Number(details.month) === m && Number(details.day) === d ? details.year : null;
    return { m, d, year };
  }

  function missingDateHTML() {
    return `<p class="it-lede">This section needs a birthday context.</p>
    <p class="it-empty-note">Add a <b>DD/MM</b>, load a contact, or pick a calendar date to see the age-based cycle cards for this selection.</p>`;
  }

  // Build the 45-card displacement wheel from the same relationship mapping
  // used in Life Script. Following the displaced-by link from J♦ gives the
  // printed order J♦ → J♣ → 10♥ and returns to J♦ after all 45 cards.
  function displacementWheelSVG() {
    if (typeof slDisplacedBy !== 'function' || !Array.isArray(SPREAD_CARDS)) return '';
    const start = SPREAD_CARDS.findIndex(function (card) { return card.rank === 'J' && card.suit === 'diamonds'; });
    if (start < 0) return '';

    const cards = [];
    const seen = new Set();
    let idx = start;
    while (!seen.has(idx) && cards.length < 52) {
      seen.add(idx);
      cards.push(SPREAD_CARDS[idx]);
      idx = slDisplacedBy(idx);
    }
    if (cards.length !== 45 || idx !== start) return '';

    const center = 260;
    const radius = 205;
    const cardW = 22;
    const cardH = 32;
    const cardMarkup = cards.map(function (card, position) {
      const angle = -Math.PI / 2 + (position * Math.PI * 2 / cards.length);
      const degrees = angle * 180 / Math.PI + 90;
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      const shade = card.suit === 'hearts' || card.suit === 'diamonds' ? 'red' : 'dark';
      return `<g class="it-wheel-card it-wheel-card--${shade}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${degrees.toFixed(2)})" aria-hidden="true">
        <rect x="${-cardW / 2}" y="${-cardH / 2}" width="${cardW}" height="${cardH}" rx="2" />
        <text x="0" y="2.7" text-anchor="middle">${card.rank}${card.sym}</text>
      </g>`;
    }).join('');

    return `<svg class="it-displacement-wheel-svg" viewBox="0 0 520 520" role="img" aria-labelledby="itWheelTitle itWheelDescription">
      <title id="itWheelTitle">45-card displacement wheel</title>
      <desc id="itWheelDescription">A circle of 45 cards ordered by displacement relationships. The seven fixed and semi-fixed cards are excluded.</desc>
      <circle class="it-wheel-orbit" cx="${center}" cy="${center}" r="${radius}" />
      ${cardMarkup}
    </svg>`;
  }

  function renderWheelCenter(date) {
    const host = document.getElementById('itWheelCenter');
    if (!host) return;
    const day = date ? String(date.d).padStart(2, '0') : '';
    const month = date ? String(date.m).padStart(2, '0') : '';
    const year = date && Number.isInteger(date.year) ? String(date.year).padStart(4, '0') : '';
    host.innerHTML = `<form class="it-wheel-date-form" data-it-birthday-form>
      <div class="finder-datepair it-wheel-datepair" role="group" aria-label="Birthday">
        <label class="finder-select-wrap"><input class="finder-select finder-day-input" name="day" type="text" inputmode="numeric" pattern="[0-9]{1,2}" maxlength="2" placeholder="DD" value="${day}" aria-label="Birth day" required></label>
        <span class="finder-datepair-slash" aria-hidden="true">/</span>
        <label class="finder-select-wrap"><input class="finder-select finder-day-input" name="month" type="text" inputmode="numeric" pattern="[0-9]{1,2}" maxlength="2" placeholder="MM" value="${month}" aria-label="Birth month" required></label>
        <span class="finder-datepair-slash" aria-hidden="true">/</span>
        <label class="finder-select-wrap it-wheel-year-wrap"><input class="finder-select finder-day-input" name="year" type="text" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="YYYY" value="${year}" aria-label="Birth year" required></label>
      </div>
    </form>`;
  }

  function birthdayPillHTML(date) {
    if (!date || !Number.isInteger(date.year)) return '';
    const day = String(date.d).padStart(2, '0');
    const month = String(date.m).padStart(2, '0');
    const year = String(date.year).padStart(4, '0');
    return `<div class="it-birthday-top" role="group" aria-label="Birth date"><span>${day}/${month}/${year}</span></div>`;
  }

  function initDisplacementWheel() {
    const host = document.getElementById('itDisplacementWheel');
    if (host) host.innerHTML = displacementWheelSVG();
    renderWheelCenter(readFinderDate());
    renderCycleFavorites();
  }

  function readingKey(card) {
    return card ? `${card.rank}_${card.suit}` : '';
  }

  function fallbackReadingHTML(card, label) {
    const body = fallbackReadingBodyHTML(card);
    return `<div class="it-reading-head">
      <div class="it-reading-kicker">${label}</div>
      <h4 class="it-reading-title">${card ? card.name : 'Card reading'}</h4>
    </div>
    <div class="it-reading-copy">${body}</div>`;
  }

  function cycleCardReadingHTML(card) {
    const key = readingKey(card);
    const reading = key && typeof CARD_READINGS !== 'undefined' ? CARD_READINGS[key] : null;
    return reading && reading.personality
      ? `<p>${reading.personality.split(/\n\n+/)[0]}</p>`
      : '<p>This card has no saved Cycles text for this horizon yet.</p>';
  }

  function planetCycleReadingHTML(pc) {
    const energy = pc.planet ? PLANET_CYCLE_ENERGY[pc.planet] : null;
    if (!energy) return '';
    return `<p class="it-reading-planet"><strong>${horizonOpening(pc.label)},</strong> ${energy.first} ${energy.second}</p>`;
  }

  function planetAbbr(planet) {
    const abbr = {
      Mercury: 'MER',
      Venus: 'VEN',
      Mars: 'MAR',
      Jupiter: 'JUP',
      Saturn: 'SAT',
      Uranus: 'URA',
      Neptune: 'NEP'
    };
    return abbr[planet] || '';
  }

  function cycleSequenceCardHTML(idx, planet, active, detail, currentLabel) {
    const c = CARDS[idx];
    if (!c) return '';
    const face = spreadCardPips(c);
    const glyph = planet ? `<span class="it-planet-glyph" title="${planet}">${SPREAD_PLANET_SYM[planet]}</span>` : '';
    const label = planetAbbr(planet);
    const sub = typeof detail === 'number' ? compactDate(detail) : (detail || '');
    const activeLabel = currentLabel || 'current cycle card';
    return `<div class="it-seq-col${active ? ' is-current' : ''}">
      <div class="it-seq-head" title="${planet || ''}">${glyph}<span class="it-seq-label">${label}</span></div>
      <button type="button" class="spread-card it-seq-card ${c.suit}" data-idx="${idx}" title="${c.name}" aria-label="${c.name}${active ? ', ' + activeLabel : ''}">${face}</button>
      <div class="it-seq-date">${sub}</div>
    </div>`;
  }

  function fiftyTwoDaySequenceHTML(birthIdx, spreadIdx, activePos, cycleStartMs) {
    if (!_expandedCycleRows['52-day']) return '';
    const cards = [];
    for (let i = 6; i >= 0; i--) {
      const startMs = addCalendarDays(cycleStartMs, i * 52);
      cards.push(cycleSequenceCardHTML(pcReadCard(spreadIdx, birthIdx, i), SPREAD_PLANETS[i], i === activePos, startMs, 'current 52-Day card'));
    }
    return `<div class="it-sequence" id="itSequence52" aria-label="All seven 52-Day cycle cards">
      ${cards.join('')}
    </div>`;
  }

  function yearlySequenceHTML(birthIdx, spreadIdx, activePos, firstAge) {
    if (!_expandedCycleRows.yearly) return '';
    const cards = [];
    for (let i = 6; i >= 0; i--) {
      cards.push(cycleSequenceCardHTML(pcReadCard(spreadIdx, birthIdx, i), SPREAD_PLANETS[i], i === activePos, 'age ' + (firstAge + i), 'current Yearly card'));
    }
    return `<div class="it-sequence" id="itSequenceYearly" aria-label="All seven Yearly cycle cards">
      ${cards.join('')}
    </div>`;
  }

  function sevenYearSequenceHTML(birthIdx, spreadIdx, activePos, firstAge) {
    if (!_expandedCycleRows['7-year']) return '';
    const cards = [];
    for (let i = 6; i >= 0; i--) {
      const start = firstAge + (i * 7);
      cards.push(cycleSequenceCardHTML(pcReadCard(spreadIdx, birthIdx, i), SPREAD_PLANETS[i], i === activePos, 'age ' + start + '-' + (start + 6), 'current 7-Year card'));
    }
    return `<div class="it-sequence" id="itSequence7Year" aria-label="All seven 7-Year cycle cards">
      ${cards.join('')}
    </div>`;
  }

  function thirteenYearSequenceHTML(birthIdx, spreadIdx, activePos, firstAge) {
    if (!_expandedCycleRows['13-year']) return '';
    const cards = [];
    for (let i = 6; i >= 0; i--) {
      const start = firstAge + (i * 13);
      cards.push(cycleSequenceCardHTML(pcReadCard(spreadIdx, birthIdx, i), SPREAD_PLANETS[i], i === activePos, 'age ' + start + '-' + (start + 12), 'current 13-Year card'));
    }
    return `<div class="it-sequence" id="itSequence13Year" aria-label="All seven 13-Year cycle cards">
      ${cards.join('')}
    </div>`;
  }

  function dailySequenceHTML(birthIdx, spreadIdx, activePos, cycleStartMs) {
    if (!_expandedCycleRows.daily) return '';
    const cards = [];
    for (let i = 6; i >= 0; i--) {
      const dayMs = addCalendarDays(cycleStartMs, i);
      cards.push(cycleSequenceCardHTML(pcReadCard(spreadIdx, birthIdx, i), SPREAD_PLANETS[i], i === activePos, compactDate(dayMs), 'current Daily card'));
    }
    return `<div class="it-sequence" id="itSequenceDaily" aria-label="All seven Daily cycle cards">
      ${cards.join('')}
    </div>`;
  }

  function inTimeReadingHTML(pc, canGoBack) {
    const c = CARDS[pc.idx];
    if (!c) return '';
    const headStart = `<div class="it-reading-head">
      <button type="button" class="it-reading-shift${canGoBack ? '' : ' is-disabled'}" data-it-cycle="-1" aria-label="Previous ${pc.label} card" title="${canGoBack ? 'Previous ' + pc.label + ' card' : 'Already at birthday'}"${canGoBack ? '' : ' disabled'}>‹</button>
      <div class="it-reading-head-copy">
      <div class="it-reading-kicker">${pc.label}</div>
      <h4 class="it-reading-title">${c.name}</h4>
      <div class="it-reading-meta">${pc.planet} · ${pc.sub}</div>
      </div>
      <button type="button" class="it-reading-shift" data-it-cycle="1" aria-label="Next ${pc.label} card" title="Next ${pc.label} card">›</button>
    </div>
    `;
    return headStart + `<div class="it-reading-copy">${cycleCardReadingHTML(c)}${planetCycleReadingHTML(pc)}</div>`;
  }

  function panelHTML(card) {
    const date = readFinderDate();
    if (!date) return missingDateHTML();
    if (!Number.isInteger(date.year)) return missingYearHTML();
    const birthSv = 55 - (2 * date.m + date.d);
    if (birthSv < 1 || birthSv > 52) return '';   // Joker guard (also handled by isEmpty in renderInTime)
    const birthIdx = birthSv - 1;

    // Use Finder's known birth year directly; Quadrations' age selector is
    // only a browsing control and is capped independently.
    const birthYear = date.year;
    const viewLbYear = lastBdayYearOf(viewDate, date.m, date.d);
    const age = Math.max(0, viewLbYear - birthYear);

    if (viewLbYear - birthYear < 0) {
      // Scrolled to before this birth date — nothing to compute, but keep
      // the nav bar live so the reader can scroll back into range.
      return `${birthdayPillHTML(date)}<p class="it-lede">That date is before this birthday.</p>
      ${dateNavHTML()}`;
    }

    // Date math (UTC to avoid DST drift on day counts)
    const now = new Date(viewDate);
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const lastBdayUTC   = Date.UTC(viewLbYear, date.m - 1, date.d);
    const daysSinceBday = Math.floor((todayUTC - lastBdayUTC) / 86400000);
    const birthUTC  = Date.UTC(birthYear, date.m - 1, date.d);
    const daysAlive = Math.floor((todayUTC - birthUTC) / 86400000);
    const weeksAlive = Math.floor(daysAlive / 7);
    const bornWD  = new Date(birthUTC).getUTCDay();
    const todayWD = new Date(todayUTC).getUTCDay();

    // Spread + position for each card type
    const tSpread = Math.floor(age / 91),           tPos = Math.floor((age % 91) / 13);
    const cSpread = Math.floor(age / 49),           cPos = Math.floor((age % 49) / 7);
    const ySpread = Math.floor(age / 7),            yPos = age % 7;
    const fSpread = age,                            fPos = Math.min(Math.floor(daysSinceBday / 52), 6);
    const dSpread = ((weeksAlive % 90) + 90) % 90,  dPos = (todayWD - bornWD + 7) % 7;

    const tIdx = pcReadCard(tSpread, birthIdx, tPos);
    const cIdx = pcReadCard(cSpread, birthIdx, cPos);
    const yearlyCycle = yearlyCycleCardAtAge(card, age);
    const yIdx = yearlyCycle ? yearlyCycle.idx : null;
    const fIdx = pcReadCard(fSpread, birthIdx, fPos);
    const dIdx = pcReadCard(dSpread, birthIdx, dPos);

    const tStart = Math.floor(age / 13) * 13, tEnd = tStart + 12;
    const cStart = Math.floor(age / 7)  * 7,  cEnd = cStart + 6;
    const tCycleStart = Math.floor(age / 91) * 91;
    const cCycleStart = Math.floor(age / 49) * 49;
    const tStartMs = localMidnight(new Date(birthYear + tStart, date.m - 1, date.d));
    const cStartMs = localMidnight(new Date(birthYear + cStart, date.m - 1, date.d));
    const yStartMs = localMidnight(new Date(viewLbYear, date.m - 1, date.d));
    const fStartMs = addCalendarDays(new Date(viewLbYear, date.m - 1, date.d).getTime(), fPos * 52);
    const dCycleStartMs = addCalendarDays(viewDate, -dPos);
    const dStartMs = viewDate;

    const cards = [
      { idx: tIdx,     label: '13-Year', planet: SPREAD_PLANETS[tPos],    sub: 'age ' + tStart + '–' + tEnd, slug: '13-year', startMs: tStartMs },
      { idx: cIdx,     label: '7-Year',  planet: SPREAD_PLANETS[cPos],    sub: 'age ' + cStart + '–' + cEnd, slug: '7-year',  startMs: cStartMs },
      { idx: yIdx,     label: 'Yearly',  planet: SPREAD_PLANETS[yPos],    sub: 'age ' + age,                  slug: 'yearly',  startMs: yStartMs },
      { idx: fIdx,     label: '52-Day',  planet: SPREAD_PLANETS[fPos],    sub: 'period ' + (fPos + 1) + '/7', slug: '52-day', startMs: fStartMs },
      { idx: dIdx,     label: 'Daily',   planet: SPREAD_PLANETS[dPos],    sub: WD_LONG[todayWD],              slug: 'daily',   startMs: dStartMs }
    ];

    _activeCards = cards;
    const availableLabels = cards.map(function (pc) { return pc.slug; });
    if (!availableLabels.includes(_activeLabel)) _activeLabel = IT_DEFAULT_FOCUS;
    const active = cards.find(function (pc) { return pc.slug === _activeLabel; }) || cards[cards.length - 1];

    const rowHTML = cards.map(pc => {
      const c = CARDS[pc.idx];
      const face = c ? spreadCardPips(c) : '';
      const glyph = pc.planet ? `<span class="it-planet-glyph" title="${pc.planet}">${SPREAD_PLANET_SYM[pc.planet]}</span>` : '<span class="it-planet-glyph it-planet-glyph-empty" aria-hidden="true">&#9679;</span>';
      const planetLine = pc.planet ? `<div class="it-planet-name" title="${pc.planet}">${pc.planet}</div>` : '';
      const slug = pc.slug;
      const sequenceIds = {
        '13-year': 'itSequence13Year',
        '7-year': 'itSequence7Year',
        yearly: 'itSequenceYearly',
        '52-day': 'itSequence52',
        daily: 'itSequenceDaily'
      };
      const controls = sequenceIds[slug] || '';
      const expand = controls
        ? `<button type="button" class="it-expand" data-it-expand="${slug}" aria-expanded="${_expandedCycleRows[slug] ? 'true' : 'false'}" aria-controls="${controls}" title="${_expandedCycleRows[slug] ? 'Hide' : 'Show'} all ${pc.label} cycle cards">${_expandedCycleRows[slug] ? '⌃' : '⌄'}</button>`
        : '<span class="it-expand-placeholder" aria-hidden="true"></span>';
      return `<div class="it-col" data-label="${slug}">
        ${glyph}
        <div class="it-label">${pc.label}</div>
        <button type="button" class="spread-card it-card ${c ? c.suit : ''}${slug === _activeLabel ? ' is-active' : ''}" data-it-focus="${slug}" title="${c ? c.name : ''}" aria-pressed="${slug === _activeLabel ? 'true' : 'false'}">${face}</button>
        ${planetLine}
        <div class="it-sub">${pc.sub}</div>
        ${expand}
      </div>`;
    }).join('');

    return `${birthdayPillHTML(date)}
    ${dateNavHTML()}
    <div class="it-row-wrap">
      <div class="it-row">${rowHTML}</div>
      ${thirteenYearSequenceHTML(birthIdx, tSpread, tPos, tCycleStart)}
      ${sevenYearSequenceHTML(birthIdx, cSpread, cPos, cCycleStart)}
      ${yearlySequenceHTML(birthIdx, ySpread, yPos, age - yPos)}
      ${fiftyTwoDaySequenceHTML(birthIdx, fSpread, fPos, yStartMs)}
      ${dailySequenceHTML(birthIdx, dSpread, dPos, dCycleStartMs)}
    </div>
    <div class="it-reading">${inTimeReadingHTML(active, canShiftActiveHorizon(active, -1))}</div>
    `;
  }

  function renderInTime(card) {
    const root = document.getElementById('fInTime');
    if (!root) return false;
    renderCycleFavorites();
    const inner = root.querySelector('.it-inner') || root;
    _lastCard = card || null;
    const date = readFinderDate();
    if (!card || card.suit === 'joker' || !date || !Number.isInteger(date.year)) {
      _activeCards = [];
      root.classList.add('is-empty');
      inner.innerHTML = '';
      renderWheelCenter(date);
      return false;
    }
    root.classList.remove('is-empty');
    const html = panelHTML(card);
    if (!html) {
      _activeCards = [];
      root.classList.add('is-empty');
      inner.innerHTML = '';
      renderWheelCenter(date);
      return false;
    }
    const focused = document.activeElement;
    let focusSelector = null;
    if (focused && inner.contains(focused)) {
      ['data-it-focus', 'data-it-cycle'].forEach(function (attr) {
        if (focused.hasAttribute(attr)) focusSelector = '[' + attr + '="' + focused.getAttribute(attr) + '"]';
      });
      ['it-date-label', 'it-date-input', 'it-date-today'].forEach(function (name) {
        if (focused.classList.contains(name)) focusSelector = '.' + name;
      });
    }
    inner.innerHTML = html;
    if (focusSelector) {
      const replacement = inner.querySelector(focusSelector);
      const destination = replacement && !replacement.disabled ? replacement : inner.querySelector('.it-date-label');
      if (destination) destination.focus({ preventScroll: true });
    }
    return true;
  }

  window.renderInTime = renderInTime;
  window.refreshInTime = function () { renderInTime(_lastCard); };
  window.yearlyCycleCardAtAge = yearlyCycleCardAtAge;
  window.currentYearlyCycleForBirth = currentYearlyCycleForBirth;
  window.yearlyCycleAgesForCard = yearlyCycleAgesForCard;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDisplacementWheel, { once: true });
  else initDisplacementWheel();
  document.addEventListener('DOMContentLoaded', wireDateNav);
})();
