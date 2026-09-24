(function () {
  'use strict';

  // Chromium can reject an in-progress native document view transition when
  // another navigation interrupts it. It is harmless, but otherwise appears
  // as an unhandled rejection during rapid navigation.
  window.addEventListener('unhandledrejection', function (e) {
    var reason = e.reason;
    if (reason && reason.name === 'AbortError' && /transition was skipped/i.test(String(reason.message || ''))) {
      e.preventDefault();
    }
  });

  // Shared two-or-more-option segmented rail (the Modern/Olney voice rails in
  // About + Card Elements, and any future one). Operates on the buttons inside
  // `rail` that carry [data-seg-tab]; `onSelect(value, button)` fires on every
  // selection. Manages roving tabindex + arrow/Home/End keys and the is-active
  // class; sets aria-selected on role="tab" buttons and aria-pressed otherwise,
  // so the same helper serves a real tablist (About, with two panels) and a
  // toggle group (Elements, one re-rendered panel). Returns { select(value) }.
  window.bindSegmentedRail = function (rail, onSelect) {
    if (!rail) return { select: function () {} };
    var tabs = Array.prototype.slice.call(rail.querySelectorAll('[data-seg-tab]'));
    if (!tabs.length) return { select: function () {} };
    var isTab = tabs[0].getAttribute('role') === 'tab';
    function set(tab, focus, fire) {
      if (!tab || tab.disabled) return;
      tabs.forEach(function (b) {
        var on = b === tab;
        b.classList.toggle('is-active', on);
        b.setAttribute(isTab ? 'aria-selected' : 'aria-pressed', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
      if (focus) tab.focus();
      if (fire && typeof onSelect === 'function') onSelect(tab.dataset.segTab, tab);
    }
    tabs.forEach(function (t) {
      if (t.getAttribute(isTab ? 'aria-selected' : 'aria-pressed') !== 'true') t.tabIndex = -1;
    });
    rail.addEventListener('click', function (e) {
      set(e.target.closest('[data-seg-tab]'), false, true);
    });
    rail.addEventListener('keydown', function (e) {
      var t = e.target.closest('[data-seg-tab]');
      if (!t) return;
      var usable = tabs.filter(function (x) { return !x.disabled; });
      var i = usable.indexOf(t);
      if (i < 0) return;
      var last = usable.length - 1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); set(usable[(i + 1) % usable.length], true, true); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); set(usable[(i + last) % usable.length], true, true); }
      if (e.key === 'Home') { e.preventDefault(); set(usable[0], true, true); }
      if (e.key === 'End') { e.preventDefault(); set(usable[last], true, true); }
    });
    // Programmatic select without re-firing onSelect (used to sync markup to
    // state); pass fire=false so callers don't loop.
    return { select: function (value) { set(rail.querySelector('[data-seg-tab="' + value + '"]'), false, false); } };
  };

  window.bindDisclosurePanel = function (button, panel, options) {
    options = options || {};
    if (!button || !panel) return;
    var closeTimer = null;

    button.addEventListener('click', function () {
      var opening = !panel.classList.contains('is-open');
      if (closeTimer !== null) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }

      if (opening) {
        panel.hidden = false;
        panel.offsetHeight;
        panel.classList.add('is-open');
      } else {
        panel.classList.remove('is-open');
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          panel.hidden = true;
        } else {
          closeTimer = window.setTimeout(function () {
            panel.hidden = true;
            closeTimer = null;
          }, options.closeDelay || 190);
        }
      }

      button.classList.toggle('is-active', opening);
      button.setAttribute('aria-expanded', opening ? 'true' : 'false');
      if (opening && typeof options.onOpen === 'function') options.onOpen();
    });
  };

  var headerHtml =
    '<header class="site-header" id="siteHeader">' +
      '<div class="sh-inner">' +
        '<a href="index.html" class="sh-logo">mysticscards<span class="suit">.space</span></a>' +
      '</div>' +
    '</header>';

  var infoContent =
        '<div class="info-inline-content">' +
          '<h2 class="info-inline-heading">About Mystics Cards</h2>' +
          '<p class="info-kb-intro">Explore cardology as a symbolic language for reflection. Readings offer ideas to consider, not scientific findings or certain predictions.</p>' +
          '<section class="info-kb-group info-start-group" aria-labelledby="infoStartHeading"><h3 id="infoStartHeading">Start here</h3>' +
          '<ol class="info-start-steps">' +
          '<li><span class="info-start-number" aria-hidden="true">1</span><div><h4>Find a birth card</h4><p>Enter a day and month in Finder to see the birth card, Life Script, and related patterns. Add a second birthday to compare two readings.</p><button class="info-start-action" type="button" data-info-view="finder">Open Finder</button></div></li>' +
          '<li><span class="info-start-number" aria-hidden="true">2</span><div><h4>Follow its cycles</h4><p>Choose a cycle and move the date to see which card is active. Cycles needs a birth year; load a saved contact with a complete birthday.</p><button class="info-start-action" type="button" data-info-view="cycles">Open Cycles</button></div></li>' +
          '<li><span class="info-start-number" aria-hidden="true">3</span><div><h4>Browse the chart</h4><p>Use Spreads to look up the 52-card Quadration chart. Select options to show Solar Values, displacements, or pips.</p><button class="info-start-action" type="button" data-info-view="quadrations">Open Spreads</button></div></li>' +
          '</ol></section>' +
          '<div class="info-kb-group"><h3>Understanding cardology</h3>' +
          '<details class="info-kb-item"><summary>Birth cards and cardology</summary><div><p>Cardology uses a standard deck as a symbolic map of personal themes and cycles. A birth date identifies a birth card; its suit and rank provide a starting point for a reading, alongside the card’s Life Script and other correspondences.</p><p>Mystics Cards presents these meanings as a reflective language, not as scientific findings or certain predictions. The site brings traditional card correspondences together with its own explanatory writing.</p></div></details>' +
          '<details class="info-kb-item"><summary>The Life Script</summary><div><p>The Life Script is the seven-card reading linked to a birth card. Each card occupies one of seven planetary positions, from Mercury through Neptune. Each position adds a theme to the reading, and the cards are also considered together as one pattern.</p><p>Finder presents the Life Script with the birth card’s reading. In the Spreads chart, those same seven cards are highlighted within the wider 52-card arrangement.</p></div></details>' +
          '<details class="info-kb-item"><summary>Cycles through time</summary><div><p>Cycles follows the changing card pattern across five horizons: 13-Year, 7-Year, Yearly, 52-Day, and Daily. Each horizon has its own sequence. Select a period and move the viewed date to see which card is active at that point in the timeline. Cycles needs the actual birth year; day and month alone do not determine a person’s age.</p></div></details>' +
          '<details class="info-kb-item"><summary>Birth dates and card assignment</summary><div><p>Finder assigns a Solar Value from the month and day using <code>55 − (2 × month + day)</code>; a birth year is not needed for that lookup. December 31 has Solar Value 0 and maps to the Joker, which sits outside the 52-card sequence.</p><p>February 29 maps to Solar Value 22. For age-based Cycles, when a year has no February 29, the date calculation treats March 1 as the birthday boundary. Save a complete valid calendar date when a tool needs the birth year.</p></div></details>' +
          '<details class="info-kb-item"><summary>Planetary Ruling Cards</summary><div><p>A Planetary Ruling Card (PRC) connects a birthday’s zodiac sign with the playing card associated with that sign’s planetary ruler. The birth card and PRC are related but distinct parts of the reading. In Finder, choose Tropical or Sidereal to view the corresponding sign and ruling card. Scorpio shows both Mars and Pluto as rulers.</p><p>Birthdays near a sign boundary may also show a cusp alternative. Solar Time needs the birth year, time, and place. It estimates longitude from the selected time zone, so treat results near solar midnight as approximate.</p></div></details>' +
          '<details class="info-kb-item"><summary>Displacements</summary><div><p>A displacement is a relationship between two cards: one occupies the place associated with the other in the Life Script pattern. The displaced card remains part of the pattern; the cards are read together to consider how their themes meet.</p><p>Finder shows the cards a selected card displaces and the card that displaces it. Fixed cards hold their own place and have no separate displacement partner.</p></div></details>' +
          '<details class="info-kb-item"><summary>Yenlo and The Mystic Test Book</summary><div><p>Yenlo opens historical card readings drawn from Olney H. Richmond’s 1893 book, <em>The Mystic Test Book</em>, including its Grand Spread when one is available for the selected card. The wording and symbolism belong to Richmond’s source material and may differ from the site’s original readings; some cards have no transcribed entry.</p></div></details>' +
          '<details class="info-kb-item"><summary>Piano note correspondence</summary><div><p>Each card is assigned one white-key note in the standard 88-key piano range. Follow the Spiritual Spread order from A♥ through 10♠ to map 49 cards down from B7 to C1. The three crown cards are J♠ at C8, Q♠ at B0, and K♠ at A0. Together, the assignments use all 52 white keys once; Finder Details shows the note for the selected card.</p></div></details>' +
          '<details class="info-kb-item"><summary>Quadration and the 52-card chart</summary><div><p>Quadration is the repeatable rule used to arrange the 52 cards in the chart. Start with Natural Order—Ace through King in Hearts, Clubs, Diamonds, then Spades—and number the positions from 1 to 52. These position numbers are Solar Values. They label places in the chart; they are not times. Applying the same mapping repeatedly produces each successive arrangement.</p><p>Solar Time is a separate Finder tool. It uses the birth date and clock time with a time-zone reference longitude to estimate the local solar day at birth. Near solar midnight, that date can differ from the calendar date and produce a different birth card.</p><p>The mapping is a permutation: every position maps to one position, so no card is lost or duplicated. Its movements form six cycles:</p><ul><li><strong>Three fixed points:</strong> J♥, 8♣, and K♠ stay in place.</li><li><strong>Two alternating pairs:</strong> 2♥ and A♣ exchange places; 9♥ and 7♦ exchange places.</li><li><strong>One 45-card cycle:</strong> the other 45 cards move through the same positions before returning to their starting places.</li></ul><p>The cycle lengths account for the deck: <code>52 = 45 + 2 + 2 + 1 + 1 + 1</code>. The full arrangement repeats after <code>LCM(45, 2) = 90</code> applications. This describes the card movement mathematically; symbolic meanings are a separate layer of interpretation.</p></div></details>' +
          '<details class="info-kb-item"><summary>Cards and the calendar</summary><div><p>In this calendar symbolism, the four suits are associated with the year’s four quarters, and the 13 ranks in each suit with the weeks of a quarter. Together they give the deck a 52-part structure for thinking about the year.</p><p>This is a symbolic correspondence, not a literal calendar calculation: 52 weeks make 364 days, while a solar year has extra days. Cardology traditions differ in how they account for that difference.</p></div></details></div>' +
          '<div class="info-kb-group"><h3>Cardology reference</h3>' +
          '<details class="info-kb-item"><summary>Planets</summary><div><div id="shInfoPlanets" class="info-planets"></div></div></details>' +
          '<details class="info-kb-item"><summary>Zodiac signs</summary><div><div id="shInfoZodiacSigns" class="info-card-reference"></div></div></details>' +
          '<details class="info-kb-item"><summary>Suits</summary><div><div id="shInfoSuits" class="info-card-reference"></div></div></details>' +
          '<details class="info-kb-item"><summary>Ranks</summary><div><div id="shInfoRanks" class="info-card-reference"></div></div></details></div>' +
          '<div class="info-kb-group"><h3>Sources, credits &amp; legal</h3>' +
          '<details class="info-kb-item"><summary>Sources and method</summary><div><p>Cardology readings draw on public-domain source material and the site’s original interpretations. Solar-time features use the birth time and place when provided; they are optional and do not replace the ordinary card calculation.</p><p>Solar Time uses <a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noopener">Astronomy Engine by Don Cross</a> (MIT) to calculate the Sun’s position.</p></div></details>' +
          '<details class="info-kb-item"><summary>Legal and credits</summary><div>' +
          '<section><h3>Code</h3><p>The original source code is released under the <a href="LICENSE">MIT License</a>.</p></section>' +
          '<section><h3>Creative content</h3><p>The readings and original “Quinta Essentia” Joker artwork are licensed under <a href="NOTICES.md">CC BY-NC 4.0</a>. Attribution, a license link, and an indication of changes are required when reusing them.</p></section>' +
          '<section><h3>Credits</h3><ul>' +
            '<li><a href="https://opengameart.org/content/playing-cards-vector-png" target="_blank" rel="noopener">Byron Knoll playing-card artwork</a> — CC0 public-domain dedication.</li>' +
            '<li><a href="https://tile.loc.gov/storage-services/public/gdcmassbookdig/mystictestbook01rich/mystictestbook01rich.pdf" target="_blank" rel="noopener">Olney H. Richmond, <em>The Mystic Test Book</em></a> (1893) — public-domain source material for the Olney readings.</li>' +
          '</ul><p class="sh-info-note">Complete source notes are in <a href="NOTICES.md">NOTICES.md</a>.</p></section>' +
          '<section><h3>Disclaimer</h3><p>Cardology readings and solar-time calculations are offered for reflection and entertainment. They are not medical, legal, financial, or mental-health advice.</p></section>' +
          '</div></details>' +
          '<details class="info-kb-item"><summary>Contact</summary><div><section class="sh-info-contact"><p>Questions, feedback, or corrections are welcome.</p><a href="mailto:mysticscards@proton.me">mysticscards@proton.me</a></section></div></details></div>' +
        '</div>';

  var skipHtml = '<a href="#main" class="skip-link">Skip to content</a>';
  document.currentScript.insertAdjacentHTML('beforebegin', skipHtml + headerHtml);

  var header = document.getElementById('siteHeader');

  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  function initInfoPanel() {
    var panel = document.getElementById('shInfoPanel');
    if (!panel) return;
    panel.innerHTML = '<div class="utility-slide-min">' + infoContent + '</div>';
    panel.addEventListener('click', function (event) {
      var action = event.target.closest('[data-info-view]');
      if (!action || typeof window.showAppView !== 'function') return;
      window.showAppView(action.getAttribute('data-info-view'));
    });
    var zodiac = panel.querySelector('#shInfoZodiacSigns');
    var planets = panel.querySelector('#shInfoPlanets');
    var suits = panel.querySelector('#shInfoSuits');
    var ranks = panel.querySelector('#shInfoRanks');
    var data = window.PLANET_DATA || {};
    var order = (window.PLANET_ORDER || ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']).slice();
    if (data.Crown) order.push('Crown');
    function esc(value) {
      return String(value == null ? '' : value).replace(/[&<>\"]/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
      });
    }
    if (zodiac) {
      zodiac.innerHTML = (window.ZODIAC_SIGN_MEANINGS || []).map(function (sign) {
        return '<section class="info-reference-entry"><h4>' + esc(sign.glyph + ' ' + sign.name) + '</h4>' +
          '<p>' + esc(sign.description) + '</p></section>';
      }).join('');
    }
    if (planets) {
      planets.innerHTML = order.map(function (planet) {
        var entry = data[planet];
        if (!entry) return '';
        var paragraphs = (entry.text || []).map(function (copy) {
          return '<p>' + esc(copy) + '</p>';
        }).join('');
        return '<section class="info-planet-entry"><h4>' + esc(planet) + '</h4>' +
          '<p class="info-planet-synopsis">' + esc(entry.synopsis || '') + '</p>' + paragraphs + '</section>';
      }).join('');
    }
    function renderReference(target, entries, order, nameFor) {
      if (!target || !entries) return;
      target.innerHTML = order.map(function (key) {
        var entry = entries[key];
        if (!entry) return '';
        return '<section class="info-reference-entry"><h4>' + esc(nameFor(key, entry)) + '</h4>' +
          '<p class="info-reference-keywords">' + esc((entry.keywords || []).join(' · ')) + '</p>' +
          '<p>' + esc(entry.text || '') + '</p></section>';
      }).join('');
    }
    renderReference(suits, window.CARD_SUIT_READINGS, ['hearts', 'clubs', 'diamonds', 'spades'], function (key, entry) {
      return (entry.symbol || '') + ' ' + key.charAt(0).toUpperCase() + key.slice(1);
    });
    renderReference(ranks, window.CARD_RANK_READINGS, ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], function (key, entry) {
      return entry.name || key;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initInfoPanel);
  else initInfoPanel();

  function initUtilityDock() {
    var finder = document.getElementById('finder');
    var main = document.getElementById('main');
    var cycles = document.getElementById('fInTime');
    var quadrations = document.getElementById('qInlinePanel');
    var info = document.getElementById('shInfoPanel');
    var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-dock-target]'));
    if (!finder || !main || !cycles || !quadrations || !info || !buttons.length) return;

    function promote(view, name) {
      view.dataset.appView = name;
      view.classList.add('app-view');
      view.hidden = name !== 'finder';
      view.inert = name !== 'finder';
      if (view.parentElement !== main) main.appendChild(view);
    }
    finder.dataset.appView = 'finder';
    finder.classList.add('app-view');
    quadrations.classList.remove('quadrations-inline', 'utility-slide-panel', 'is-open');
    info.classList.remove('info-inline', 'utility-slide-panel', 'is-open');
    promote(cycles, 'cycles');
    promote(quadrations, 'quadrations');
    promote(info, 'info');

    function setActive(name) {
      buttons.forEach(function (button) {
        var active = button.dataset.dockTarget === name;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }
    window.showAppView = function (name) {
      var target = main.querySelector('[data-app-view="' + name + '"]');
      if (!target) return;
      Array.prototype.slice.call(main.querySelectorAll('[data-app-view]')).forEach(function (view) {
        var active = view === target;
        view.hidden = !active;
        view.inert = !active;
      });
      if (name === 'cycles' && typeof window.refreshInTime === 'function') window.refreshInTime();
      setActive(name);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
    buttons.forEach(function (button) {
      button.addEventListener('click', function () { window.showAppView(button.dataset.dockTarget); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUtilityDock);
  else initUtilityDock();

  // Offline support + PWA install.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* no-op */ });
    });
  }

  window.toggleSection = function (id) {
    var section = document.getElementById(id);
    if (!section) return;
    var open = section.classList.toggle('section-open');
    var b = section.querySelector(':scope > .section-heading > .section-toggle, :scope > .section-toggle');
    var body = section.querySelector(':scope > .section-bodywrap > .section-bodymin');
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (body) body.inert = !open;
    try { localStorage.setItem('mc-section-' + id, open ? '1' : '0'); } catch (e) {}
  };
  document.addEventListener('click', function (e) {
    var toggle = e.target && e.target.closest && e.target.closest('.section-toggle[data-section]');
    if (toggle) window.toggleSection(toggle.getAttribute('data-section'));
  });
  function _restoreSections() {
    document.querySelectorAll('.page-section').forEach(function (section) {
      var b = section.querySelector(':scope > .section-heading > .section-toggle, :scope > .section-toggle');
      if (!b) return;
      var saved = null;
      try { saved = localStorage.getItem('mc-section-' + section.id); } catch (e) {}
      var startClosed = section.classList.contains('section-start-closed');
      var open = saved !== null ? (saved !== '0') : !startClosed;
      section.classList.toggle('section-open', open);
      if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
      var body = section.querySelector(':scope > .section-bodywrap > .section-bodymin');
      if (body) body.inert = !open;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _restoreSections);
  else _restoreSections();
})();

(function () {
  'use strict';
  var mm = window.matchMedia;
  var reduce = mm && mm('(prefers-reduced-motion: reduce)').matches;
  var nativeVT = ('onpagereveal' in window);

  function external(a) {
    if (!a) return true;
    if (a.target && a.target !== '_self') return true;
    if (a.hasAttribute('download')) return true;
    var raw = a.getAttribute('href') || '';
    if (!raw || raw.charAt(0) === '#') return true;
    if (/^(mailto:|tel:|sms:|javascript:|data:)/i.test(raw)) return true;
    var url;
    try { url = new URL(a.href, location.href); } catch (e) { return true; }
    if (url.origin !== location.origin) return true;
    if (url.href.split('#')[0] === location.href.split('#')[0]) return true;
    return false;
  }

  var seen = {};
  function prefetch(a) {
    if (external(a) || seen[a.href]) return;
    seen[a.href] = true;
    var l = document.createElement('link'); l.rel = 'prefetch'; l.href = a.href;
    document.head.appendChild(l);
  }
  ['pointerover', 'focusin'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[href]');
      if (a) prefetch(a);
    }, { passive: true });
  });

  if (reduce || nativeVT) return;

  var veil;
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    if (external(a)) return;
    var href = a.href;
    e.preventDefault();
    if (!veil) {
      veil = document.createElement('div');
      veil.className = 'pg-veil'; veil.setAttribute('aria-hidden', 'true');
      (document.body || document.documentElement).appendChild(veil);
    }
    requestAnimationFrame(function () { veil.classList.add('show'); });
    var done = false;
    function go() { if (done) return; done = true; location.href = href; }
    veil.addEventListener('transitionend', go, { once: true });
    setTimeout(go, 480);
  });
  window.addEventListener('pageshow', function () { if (veil) veil.classList.remove('show'); });
})();
