// olney.js — the Richmond 1893 "Olney" reading, rendered as an
// inline panel inside the Finder About block. Reads window.RICHMOND
// (js/richmonddata.js) and renders into the About panel's Olney view
// when the Finder's primary "You" card is picked in solo mode.
//
// The reading is revealed inline under The Mystic Test Book button. Its historical data
// is loaded only when the visitor opens that section.
//
// Reads CARDS + spreadCardPips + window.RICHMOND via classic-script
// globals. Richmond's large data file is requested only when Olney mode is
// active, then this module announces readiness so Finder can rerender.
//
// PUBLIC on window:
//   window.renderOlney(card, mount) — called by finder.js's
//     renderFinderState; returns false when Richmond has no entry
//     (e.g. Joker or a card that hasn't been transcribed yet).

(function () {
  'use strict';

  const SUIT_FROM_SYM = { '♥': 'hearts', '♣': 'clubs', '♦': 'diamonds', '♠': 'spades' };
  const OLNEY_PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

  let richmondPromise = null;
  function ensureRichmond() {
    if (window.RICHMOND) return Promise.resolve();
    if (richmondPromise) return richmondPromise;
    richmondPromise = new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = 'js/richmonddata.js';
      script.onload = resolve;
      script.onerror = function () {
        richmondPromise = null;
        reject(new Error('js/richmonddata.js failed to load'));
      };
      document.head.appendChild(script);
    }).then(function () {
      window.dispatchEvent(new CustomEvent('mc-richmond-ready'));
    });
    return richmondPromise;
  }

  // Engraved sunburst masthead for the Grand Spread plate — identical
  // for every card, so the ray-fan is computed once.
  const OLNEY_RAYS = (function () {
    const cx = 100, cy = 120, n = 46; let s = '';
    for (let i = 0; i <= n; i++) {
      const a = Math.PI * (i / n);
      const inner = 20, outer = 96 + (Math.abs(i - n / 2) < 2 ? 12 : 0);
      const x1 = cx - Math.cos(a) * inner, y1 = cy - Math.sin(a) * inner;
      const x2 = cx - Math.cos(a) * outer, y2 = cy - Math.sin(a) * outer;
      s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
    }
    return s;
  })();
  const OLNEY_MAST =
    '<div class="olney-mast"><span class="olney-mast-t">The&nbsp;Mystic</span>' +
    '<svg class="olney-sunburst" viewBox="0 0 200 120" aria-hidden="true">' +
      `<g stroke="var(--plate-ink)" stroke-width="1.1" stroke-linecap="round">${OLNEY_RAYS}</g>` +
      '<path d="M100 120 a16 16 0 0 1 -32 0 z" fill="var(--plate-ink)" stroke="var(--plate-ink)" stroke-width="1.5"/>' +
      '<path d="M100 120 a16 16 0 0 0 32 0" fill="none" stroke="var(--plate-ink)" stroke-width="1.5"/>' +
    '</svg><span class="olney-mast-t">Test&nbsp;Book.</span></div>';

  // "10♠" → the matching entry in CARDS (for spreadCardPips). Reads
  // the leading card token, so a trailing note like "2♠ (under O.O.M.)"
  // still resolves to 2♠.
  function cardFromToken(tok) {
    const m = String(tok).trim().match(/^(10|[A2-9JQK])\s*([♥♣♦♠])/);
    if (!m) return null;
    const suit = SUIT_FROM_SYM[m[2]];
    return (typeof CARDS !== 'undefined' ? CARDS : []).find(c => c.rank === m[1] && c.suit === suit) || null;
  }

  function cellHTML(tok, cls) {
    const c = cardFromToken(tok);
    if (!c) return `<div class="spread-card ${cls || ''}"></div>`;
    return `<div class="spread-card ${c.suit} ${cls || ''}" title="${c.name}">${spreadCardPips(c)}</div>`;
  }

  function panelHTML(card, R) {
    let html = '';

    // Planet-by-planet delineation (top).
    if (R.planets) {
      html += '<div class="olney-delin">';
      html += '<div class="olney-bookhead">' +
        '<div class="olney-headrow">' +
          (card ? `<div class="olney-cardface spread-card ${card.suit}">${spreadCardPips(card)}</div>` : '') +
          '<dl class="olney-vals">' +
            `<div><dt>Solar Value</dt><dd>${R.solar}</dd></div>` +
            `<div><dt>Spirit Value</dt><dd>${R.spirit}</dd></div>` +
            `<div><dt>Astral Number</dt><dd>${R.astral}</dd></div>` +
          '</dl>' +
      '</div>' +
      '</div>';
      for (const pl of OLNEY_PLANETS) {
        if (R.planets[pl]) html += `<p class="olney-pl"><b>${pl} -</b> ${R.planets[pl]}</p>`;
      }
      html += '</div>';
    }

    // Grand Spread (below the delineation).
    html += '<div class="olney-spread">';
    if (R.spread) {
      const sp = R.spread;
      html += '<div class="olney-plate">';
      html += '<div class="olney-platehead">';
      html += OLNEY_MAST;
      html += '<div class="olney-head">' +
        '<div class="olney-hside left"><div class="olney-hlabel">Grand Spread,<br>Solar.</div><div class="olney-horn">— o —</div><div class="olney-hfp">Future.</div></div>' +
        '<div class="olney-sun">' +
          sp.sun.map((t, i) => cellHTML(t, i === 1 ? 'olney-focus' : '')).join('') +
        '</div>' +
        '<div class="olney-hside right"><div class="olney-hlabel">Quadrated to<br>Time.</div><div class="olney-horn">— o —</div><div class="olney-hfp">Past.</div></div>' +
        '</div>';
      html += '</div>';   // .olney-platehead
      html += '<div class="olney-grid">';
      for (const pl of OLNEY_PLANETS) {
        const row = (sp.lines && sp.lines[pl]) || [];
        html += '<div class="olney-row">' + row.map(t => cellHTML(t)).join('') + '</div>';
      }
      html += '</div>';
      html += '<div class="olney-spreadname">Independent Solar Spread</div>';
      html += '</div>';  // .olney-plate
    } else {
      html += '<div class="olney-note">Richmond\'s Grand Spread for this card hasn\'t been transcribed yet — coming soon.</div>';
    }
    html += '</div>';

    return html;
  }

  // Public renderer — called by finder.js's renderFinderState.
  //   card   — a SPREAD_CARDS-shaped {rank, suit, sym, sv} or null.
  //   mount  — optional element or element id to render into
  //
  // Populates the target with Richmond's reading if the pick has a
  // matching entry. Returns TRUE when there's real content and FALSE
  // otherwise, so the picker can disable the Olney chip for cards
  // Richmond didn't delineate (Joker, or a card not yet transcribed).
  function renderOlney(card, mount) {
    const root = typeof mount === 'string'
      ? document.getElementById(mount)
      : (mount || document.getElementById('fAboutOlney'));
    if (!root) return false;
    const inner = root.querySelector('.olney-inner') || root;
    root.classList.remove('is-empty');
    if (!card || card.suit === 'joker') { root.classList.add('is-empty'); inner.innerHTML = ''; return false; }
    if (!window.RICHMOND) {
      ensureRichmond().catch(function () { /* empty state stays visible */ });
      root.classList.add('is-empty');
      inner.innerHTML = '';
      return false;
    }
    const R = window.RICHMOND && window.RICHMOND[`${card.rank}_${card.suit}`];
    if (!R) { root.classList.add('is-empty'); inner.innerHTML = ''; return false; }
    // Look the CARDS reading up so the header shows the fuller
    // card face (the finder gave us a slim card object).
    const readingCard = (typeof CARDS !== 'undefined' ? CARDS : [])
      .find(c => c.rank === card.rank && c.suit === card.suit) || card;
    inner.innerHTML = panelHTML(readingCard, R);
    return true;
  }

  function renderYenlo(card) {
    const root = document.getElementById('fYenloPanel');
    const inner = root && root.querySelector('.olney-inner');
    if (!root || !inner || !card) return;
    const key = `${card.rank}_${card.suit}`;
    if (!window.RICHMOND) {
      inner.innerHTML = '<p class="olney-note">Loading The Mystic Test Book…</p>';
      ensureRichmond().then(function () {
        if (root.dataset.cardKey === key && !root.hidden) renderYenlo(card);
      }).catch(function () {
        if (root.dataset.cardKey === key) inner.innerHTML = '<p class="olney-note">The Mystic Test Book could not be loaded.</p>';
      });
      return;
    }
    if (!renderOlney(card, inner)) {
      inner.innerHTML = '<p class="olney-note">The Mystic Test Book has no delineation for this card yet.</p>';
    }
  }

  function resetYenlo() {
    const root = document.getElementById('fYenloPanel');
    const button = document.getElementById('fModernOlney');
    if (root) {
      root.hidden = true;
      root.dataset.cardKey = '';
      const inner = root.querySelector('.olney-inner');
      if (inner) inner.innerHTML = '';
    }
    if (button) {
      button.classList.remove('is-active');
      button.setAttribute('aria-expanded', 'false');
    }
  }

  function toggleYenlo(card) {
    const root = document.getElementById('fYenloPanel');
    const button = document.getElementById('fModernOlney');
    if (!root || !button || !card) return;
    if (!root.hidden) {
      resetYenlo();
      return;
    }
    root.hidden = false;
    root.dataset.cardKey = `${card.rank}_${card.suit}`;
    button.classList.add('is-active');
    button.setAttribute('aria-expanded', 'true');
    renderYenlo(card);
  }

  window.renderOlney = renderOlney;
  window.toggleYenlo = toggleYenlo;
  window.resetYenlo = resetYenlo;
})();
