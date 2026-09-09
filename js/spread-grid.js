function buildSpreadGrid(gridEl, opts) {
  opts = opts || {};
  const onCardClick = opts.onCardClick || function () {};

  const spir = deckAtAge(90);
  const life = deckAtAge(1);
  const displaces   = slDisplaces;
  const displacedBy = slDisplacedBy;

  function posLabel(pos) {
    if (pos >= 49) return `Crown · ${52 - pos}`;
    return `${SPREAD_PLANETS[Math.floor(pos / 7)]} · ${SPREAD_PLANETS[pos % 7]}`;
  }

  let html = '';
  html += '<div class="crown-row">';
  html += '<div class="crown-side crown-joker"></div>';
  for (let i = 51; i >= 49; i--) html += `<div class="sl-seat" data-pos="${i}"></div>`;
  html += '<div class="crown-side crown-controls">';
  html += '<div class="q-crown-control-box">';
  html += '<div class="q-crown-age" role="group" aria-label="Age">';
  html += '<div class="age-controls">';
  html += '<button type="button" class="age-btn" id="ageDown" aria-label="Previous age">−</button>';
  html += '<input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" id="ageInput" class="age-input" value="0" aria-label="Age (0–89)">';
  html += '<button type="button" class="age-btn" id="ageUp" aria-label="Next age">+</button>';
  html += '</div></div>';
  html += '<button type="button" class="q-menu-toggle" id="qMenu" aria-expanded="false" aria-controls="qControlsMenu">';
  html += '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M7 14v6"/></svg><span>Menu</span>';
  html += '</button></div></div>';
  html += '</div>';
  for (let row = 0; row < 7; row++)
    for (let col = 6; col >= 0; col--)
      html += `<div class="sl-seat" data-pos="${row * 7 + col}"></div>`;
  [6,5,4,3,2,1,0].forEach((col) => {
    const pname = SPREAD_PLANETS[col];
    html += `<div class="spread-col-label planet-col-label" data-planet="${pname}">${SPREAD_PLANET_SYM[pname]}</div>`;
  });
  gridEl.innerHTML = html;

  const seats = {};
  gridEl.querySelectorAll('.sl-seat').forEach((s) => { seats[+s.dataset.pos] = s; });

  for (const pos in seats) {
    const row = document.createElement('div');
    row.className = 'sl-ghost-row';
    ['sl-ghost-d', 'sl-ghost-b'].forEach((variant) => {
      const chip = document.createElement('span');
      chip.className = 'sl-ghost ' + variant;
      chip.dataset.verb = variant === 'sl-ghost-d' ? 'Displaces ' : 'Displaced by ';
      row.appendChild(chip);
    });
    const solar = document.createElement('span');
    solar.className = 'sl-solar-value';
    row.appendChild(solar);
    seats[pos].appendChild(row);
  }
  function paintGhosts(deck) {
    for (const pos in seats) {
      const occupant = deck[pos];
      const dIdx = spir[pos];
      const bIdx = deck[spir.indexOf(occupant)];
      const row  = seats[pos].querySelector('.sl-ghost-row');
      [[row.children[0], dIdx], [row.children[1], bIdx]].forEach(([chip, idx]) => {
        const oc = SPREAD_CARDS[idx];
        chip.className = 'sl-ghost ' + (chip.dataset.verb === 'Displaces ' ? 'sl-ghost-d' : 'sl-ghost-b')
          + ' ' + oc.suit + (idx === occupant ? ' sl-ghost-self' : '');
        chip.textContent = oc.rank + oc.sym;
        chip.title = chip.dataset.verb + oc.rank + oc.sym;
      });
      const solar = row.querySelector('.sl-solar-value');
      solar.textContent = occupant + 1;
      solar.title = 'Solar Value: ' + (occupant + 1);
    }
  }

  const cards = {};
  for (let idx = 0; idx < 52; idx++) {
    const c  = SPREAD_CARDS[idx];
    const el = document.createElement('div');
    el.className = 'spread-card ' + c.suit;
    el.dataset.idx = idx;
    el.innerHTML = spreadCardPips(c);
    if (spir.indexOf(idx) === life.indexOf(idx)) el.classList.add('sl-fixed');
    else if (displaces(idx) === displacedBy(idx)) el.classList.add('sl-semi');
    el.addEventListener('click', () => onCardClick(idx));
    cards[idx] = el;
  }

  let _deck = null;
  function place(deck, animate) {
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doAnim = animate && !reduce && _deck;
    const first  = {};
    if (doAnim) for (const k in cards) first[k] = cards[k].getBoundingClientRect();
    deck.forEach((cardIdx, pos) => {
      const seat = seats[pos], el = cards[cardIdx];
      if (el && seat) {
        if (el.parentNode !== seat) seat.appendChild(el);
        el.title = posLabel(pos);
      }
    });
    paintGhosts(deck);
    _deck = deck;
    if (!doAnim) return;
    for (const k in cards) {
      const el = cards[k], f = first[k];
      if (!f) continue;
      const l = el.getBoundingClientRect();
      const dx = f.left - l.left, dy = f.top - l.top;
      if (!dx && !dy) continue;
      el.style.transition = 'none';
      el.style.transform  = `translate(${dx}px, ${dy}px)`;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      for (const k in cards) {
        const el = cards[k];
        if (!el.style.transform) continue;
        el.style.transition = 'transform .65s cubic-bezier(.22,1,.36,1)';
        el.style.transform  = '';
        el.addEventListener('transitionend', function te() {
          el.style.transition = '';
          el.removeEventListener('transitionend', te);
        });
      }
    }));
  }

  return {
    setDeck(deck, o) { o = o || {}; place(deck, o.animate !== false); },
    showGhosts(mode) {
      if (mode === true) mode = 'displaces';
      const both = mode === 'both';
      gridEl.classList.toggle('sl-ghosts',    both || mode === 'displaces');
      gridEl.classList.toggle('sl-ghosts-by', both || mode === 'displaced');
    },
    showSolarValues(on) { gridEl.classList.toggle('sl-solar-values', !!on); },
    setPick(rank, suit) {
      for (const k in cards) {
        const c = SPREAD_CARDS[k];
        cards[k].classList.toggle('finder-pick', !!(rank && c.rank === rank && c.suit === suit));
      }
    },
    setPickPartner(rank, suit, extraRank, extraSuit) {
      for (const k in cards) {
        const c = SPREAD_CARDS[k];
        const isMatch = !!(
          (rank && c.rank === rank && c.suit === suit) ||
          (extraRank && c.rank === extraRank && c.suit === extraSuit)
        );
        cards[k].classList.toggle('finder-pick-partner', isMatch);
      }
    },
    setScript(rank, suit) {
      for (const k in cards) {
        cards[k].classList.remove('ls-pick');
        cards[k].style.removeProperty('--ls-i');
      }
      if (!rank || suit === 'joker' || typeof LIFE_SCRIPTS === 'undefined') return;
      const script = LIFE_SCRIPTS[`${rank}_${suit}`];
      if (!script) return;
      script.forEach((str, i) => {
        const cc = lsParseCard(str);
        const idx = SPREAD_CARDS.findIndex(c => c.rank === cc.rank && c.suit === cc.suit);
        if (idx < 0 || !cards[idx]) return;
        cards[idx].classList.add('ls-pick');
        cards[idx].style.setProperty('--ls-i', i);
      });
    },
    cardEl(idx) { return cards[idx]; },
    getDeck() { return _deck; }
  };
}

let _spreadCtl = null;
function ensureSpreadCtl() {
  if (!_spreadCtl) {
    _spreadCtl = buildSpreadGrid(document.getElementById('annualGrid'), {
      onCardClick: function (idx) {
        if (typeof window.loadCardInFinder === 'function') window.loadCardInFinder(idx);
      }
    });
  }
  return _spreadCtl;
}

function buildAnnualGrid(age) {
  const ctl = ensureSpreadCtl();
  const isLife = age === 1;
  ctl.setDeck(deckAtAge(age));
  document.getElementById('annualGrid').classList.toggle('ls-lifespread', isLife);
  if (typeof window.syncSpreadLabel === 'function') window.syncSpreadLabel(age);
  if (typeof window.refreshFinderGridHighlights === 'function') window.refreshFinderGridHighlights();
}

let currentAge = 0;
let quadAge = 0;
function setAge(age, options) {
  options = options || {};
  age = Math.max(0, Math.min(89, Math.round(+age) || 0));
  currentAge = age;
  if (!options.silent && typeof window.refreshInTime === 'function') window.refreshInTime();
}
function setQuadAge(age) {
  age = Math.max(0, Math.min(89, Math.round(+age) || 0));
  quadAge = age;
  const inp = document.getElementById('ageInput');
  if (inp) inp.value = age;
  buildAnnualGrid(age + 1);
}
function changeAge(d) {
  let a = quadAge + d;
  if (a > 89) a = 0;
  if (a < 0)  a = 89;
  setQuadAge(a);
}

function wireQuadSwipe(grid) {
  if (!grid) return;
  let touch = null;
  let suppressClickUntil = 0;
  let wheelTotal = 0;
  let wheelGestureUsed = false;
  let wheelEndTimer = null;
  let wheelCanRearm = false;
  let wheelDirection = 0;

  grid.addEventListener('touchstart', function (event) {
    touch = event.touches.length === 1
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
      : null;
  }, { passive: true });
  grid.addEventListener('touchcancel', function () { touch = null; }, { passive: true });
  grid.addEventListener('touchend', function (event) {
    if (!touch || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touch.x;
    const dy = event.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy) * 1.4) return;
    suppressClickUntil = Date.now() + 450;
    changeAge(dx < 0 ? 1 : -1);
  }, { passive: true });
  grid.addEventListener('click', function (event) {
    if (Date.now() >= suppressClickUntil) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  grid.addEventListener('wheel', function (event) {
    if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.25) return;
    event.preventDefault();

    const unit = event.deltaMode === 1 ? 16 : (event.deltaMode === 2 ? window.innerWidth : 1);
    const delta = event.deltaX * unit;
    const magnitude = Math.abs(delta);
    const direction = Math.sign(delta);

    if (wheelGestureUsed) {
      if (magnitude <= 3) wheelCanRearm = true;
      if ((wheelCanRearm && magnitude >= 8) || (direction !== wheelDirection && magnitude >= 8)) {
        wheelTotal = 0;
        wheelGestureUsed = false;
        wheelCanRearm = false;
      }
    }

    if (!wheelGestureUsed) wheelTotal += delta;
    if (!wheelGestureUsed && Math.abs(wheelTotal) >= 32) {
      wheelGestureUsed = true;
      wheelDirection = Math.sign(wheelTotal);
      changeAge(wheelTotal > 0 ? 1 : -1);
    }

    if (wheelEndTimer !== null) window.clearTimeout(wheelEndTimer);
    wheelEndTimer = window.setTimeout(function () {
      wheelTotal = 0;
      wheelGestureUsed = false;
      wheelCanRearm = false;
      wheelDirection = 0;
      wheelEndTimer = null;
    }, 90);
  }, { passive: false });
}


function wireAgeSelectAll(input) {
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

document.addEventListener('DOMContentLoaded', function () {
  const grid = document.getElementById('annualGrid');
  if (!grid) return;
  buildAnnualGrid(1);
  wireQuadSwipe(grid);

  const down = document.getElementById('ageDown');
  const up   = document.getElementById('ageUp');
  const inp  = document.getElementById('ageInput');
  if (down) down.addEventListener('click', () => changeAge(-1));
  if (up)   up.addEventListener('click',   () => changeAge(+1));
  if (inp) {
    inp.addEventListener('input',  function () { if (this.value !== '') setQuadAge(this.value); });
    inp.addEventListener('change', function () { setQuadAge(this.value); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp')   { e.preventDefault(); changeAge(+1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); changeAge(-1); }
    });
    wireAgeSelectAll(inp);
  }
});
