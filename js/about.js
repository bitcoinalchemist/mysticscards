/* About: Reference and Help & sources.
 * Classic script loaded after site.js, finder.js, lifescript.js, planetdata.js.
 * Uses the shared reading data; static editorial content lives in index.html.
 * Public API: window.openAboutTopic(category, entry?) opens a reference entry.
 * Stable routes: #about/reference and #about/reference/category/entry.
 */
(function () {
  'use strict';

  function initAbout() {
    var root = document.getElementById('shInfoPanel');
    if (!root) return;
    var section = 'reference', category = null, entry = null, lastCategory = null;
    var navCategory = null;
    var sections = { reference: 'infoReference' };
    var library = {};
    function el(id) { return document.getElementById(id); }
    function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    function visible(node, on) { node.hidden = !on; node.inert = !on; }

    library.planets = {
      name: 'Planets',
      entries: (window.PLANET_ORDER || []).concat(window.PLANET_DATA && window.PLANET_DATA.Crown ? ['Crown'] : []).map(function (name) {
        var data = (window.PLANET_DATA || {})[name];
        return data && { id: slug(name), name: name, keywords: data.synopsis || '', paragraphs: data.text || [] };
      }).filter(Boolean)
    };
    library.suits = {
      name: 'Suits',
      entries: ['hearts', 'clubs', 'diamonds', 'spades'].map(function (key) {
        var data = (window.CARD_SUIT_READINGS || {})[key];
        return data && { id: key, name: (data.symbol || '') + ' ' + key.charAt(0).toUpperCase() + key.slice(1), keywords: (data.keywords || []).join(' · '), paragraphs: [data.text] };
      }).filter(Boolean)
    };
    library.ranks = {
      name: 'Ranks',
      entries: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].map(function (key) {
        var data = (window.CARD_RANK_READINGS || {})[key];
        return data && { id: slug(key), name: data.name || key, keywords: (data.keywords || []).join(' · '), paragraphs: [data.text] };
      }).filter(Boolean)
    };
    library.zodiac = {
      name: 'Zodiac signs',
      entries: (window.ZODIAC_SIGN_MEANINGS || []).map(function (sign) {
        return { id: slug(sign.name), name: sign.glyph + ' ' + sign.name, keywords: '', paragraphs: [sign.description] };
      })
    };

    function populateInlineCategory(details) {
      if (details.dataset.loaded === 'true') return;
      var category = details.dataset.infoInlineCategory;
      var group = library[category];
      var content = details.querySelector('[data-info-category-content]');
      if (!group || !content) return;
      group.entries.forEach(function (item) {
        var disclosure = document.createElement('details');
        disclosure.className = 'info-kb-item';
        var summary = document.createElement('summary');
        summary.textContent = item.name;
        var body = document.createElement('div');
        if (item.keywords) {
          var keywords = document.createElement('p');
          keywords.className = 'info-reference-keywords';
          keywords.textContent = item.keywords;
          body.appendChild(keywords);
        }
        (item.paragraphs || []).filter(Boolean).forEach(function (text) {
          var paragraph = document.createElement('p');
          paragraph.textContent = text;
          body.appendChild(paragraph);
        });
        disclosure.appendChild(summary);
        disclosure.appendChild(body);
        content.appendChild(disclosure);
      });
      details.dataset.loaded = 'true';
    }
    root.addEventListener('toggle', function (event) {
      var details = event.target;
      if (details.matches('[data-info-inline-category]') && details.open) populateInlineCategory(details);
    }, true);

    function route() {
      return '#about/' + section + (section === 'reference' && category ? '/' + category + '/' + entry : '');
    }
    function saveRoute() {
      var hash = route();
      if (window.location.hash === hash) return;
      try { window.history.pushState(null, '', hash); }
      catch (error) { window.location.hash = hash; }
    }
    function render() {
      Object.keys(sections).forEach(function (key) { visible(el(sections[key]), key === section); });
      visible(el('infoReferenceIndex'), !category);
      visible(el('infoReferenceDetail'), !!category);
      if (!category) return;
      var group = library[category];
      var selected = group.entries.find(function (item) { return item.id === entry; });
      if (!selected) return;
      el('infoCategoryName').textContent = group.name;
      var nav = el('infoEntryNav');
      if (navCategory !== category) {
        nav.replaceChildren();
        group.entries.forEach(function (item) {
          var link = document.createElement('a');
          link.href = '#about/reference/' + category + '/' + item.id;
          link.textContent = item.name;
          link.dataset.infoEntry = item.id;
          nav.appendChild(link);
        });
        navCategory = category;
      }
      nav.setAttribute('aria-label', group.name + ' entries');
      nav.querySelectorAll('a').forEach(function (link) {
        if (link.dataset.infoEntry === entry) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      el('infoEntryHeading').textContent = selected.name;
      el('infoEntryKeywords').textContent = selected.keywords;
      el('infoEntryKeywords').hidden = !selected.keywords;
      var copy = el('infoEntryText');
      copy.replaceChildren();
      selected.paragraphs.filter(Boolean).forEach(function (text) {
        var paragraph = document.createElement('p');
        paragraph.textContent = text;
        copy.appendChild(paragraph);
      });
    }
    function readRoute(hash) {
      var parts = hash.split('/');
      if (parts[1] === 'learn' || parts[1] === 'help') parts[1] = 'reference';
      if (parts[0] !== '#about' || !Object.prototype.hasOwnProperty.call(sections, parts[1]) || parts.length > 4) return false;
      var nextCategory = parts[2] || null;
      if (parts[1] !== 'reference' && nextCategory) return false;
      if (nextCategory) {
        if (!Object.prototype.hasOwnProperty.call(library, nextCategory)) return false;
        var items = library[nextCategory].entries;
        var nextEntry = parts[3] || (items[0] && items[0].id);
        if (!items.some(function (item) { return item.id === nextEntry; })) return false;
        category = nextCategory;
        entry = nextEntry;
        lastCategory = category;
      } else if (parts[1] === 'reference') {
        category = null;
        entry = null;
      }
      section = parts[1];
      return true;
    }
    function openRoute(hash, focus) {
      if (!readRoute(hash)) return false;
      if (root.hidden && typeof window.showAppView === 'function') window.showAppView('info');
      render();
      if (focus) {
        var target = section === 'reference' && category ? el('infoEntryHeading')
          : section === 'reference' && lastCategory ? root.querySelector('[data-info-category="' + lastCategory + '"]')
          : el('infoReferenceHeading');
        if (target) target.focus();
      }
      return true;
    }
    root.addEventListener('click', function (event) {
      var action = event.target.closest('[data-info-view]');
      if (action && typeof window.showAppView === 'function') {
        var view = action.getAttribute('data-info-view');
        window.showAppView(view);
        var destination = document.querySelector('[data-app-view="' + view + '"]');
        if (destination) { destination.tabIndex = -1; destination.focus({ preventScroll: true }); }
        return;
      }
      var link = event.target.closest('a[href^="#about/"]');
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (openRoute(link.getAttribute('href'), true)) { event.preventDefault(); saveRoute(); }
    });
    function followHistory() {
      if (openRoute(window.location.hash, true)) return;
      // Back from the first About route returns to the app's default view.
      if (!window.location.hash && !root.hidden && typeof window.showAppView === 'function') {
        window.showAppView('finder');
        var finderButton = el('dockFinder');
        if (finderButton) finderButton.focus({ preventScroll: true });
      }
    }
    window.addEventListener('hashchange', followHistory);
    window.addEventListener('popstate', followHistory);
    window.openAboutTopic = function (name, key) {
      if (openRoute('#about/reference/' + name + (key ? '/' + key : ''), true)) saveRoute();
    };
    render();
    openRoute(window.location.hash, false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAbout);
  else initAbout();
})();
