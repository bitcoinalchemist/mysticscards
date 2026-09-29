// birthdays.js — the saved-birthdays tray (list + manual add/edit
// form + export/import), rendered inline under the Finder alongside the
// other picker trays. Also owns the shared "You / Partner" pick target
// that this tray and js/finder-trays.js's Calendar both read
// from, so a chosen date/entry knows which Finder slot to fill.
//
// Saved birth details supply Finder's personal cycle and Solar Time tools.
// The tray also owns the You / Partner target shared with the calendar tray.
//
// Loaded as a classic script AFTER spread-grid.js and AFTER finder.js
// (window.loadDateInFinder).
//
// PUBLIC on window — read by finder-trays.js:
//   window.openBirthPanel()  — opens the Saved Birthdays inline tray.
//   window.prepareBirthTray() — refreshes list + target state before the
//                               tray is shown.
//   window.setBdayTarget(t)  — 'self' | 'partner'; also flips the You/
//                              Partner toggle in the Calendar tray.
//   window.bdayTarget()      — getter, current target.
//   window.defaultTarget()   — starting target when a picker opens.
(function () {
  'use strict';

  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const BIRTH_PAGE_SIZE = 10;
  const DEFAULT_CONTACT_TAGS = ['Family', 'Friend', 'Partner', 'Work'];

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function loadBirths() { return CardsStore.loadBirths(); }
  function saveBirths(list) { return CardsStore.saveBirths(list) === true; }
  function loadContactTags() { return typeof CardsStore.loadContactTags === 'function' ? CardsStore.loadContactTags() : []; }
  function saveContactTags(tags) { return typeof CardsStore.saveContactTags === 'function' && CardsStore.saveContactTags(tags) === true; }

  function lastBdayYear(m, d) {
    const t = new Date();
    const ty = t.getFullYear();
    const todayUTC = Date.UTC(ty, t.getMonth(), t.getDate());
    return (Date.UTC(ty, m - 1, d) > todayUTC) ? ty - 1 : ty;
  }
  function ageFromBirthYear(birthYear, m, d) { return lastBdayYear(m, d) - birthYear; }
  function lifePathNumber(year, month, day) {
    const sum = String(day).padStart(2, '0').split('').concat(String(month).padStart(2, '0').split(''), String(year).split(''))
      .reduce((total, digit) => total + Number(digit), 0);
    let reduced = sum;
    while (reduced > 9) reduced = String(reduced).split('').reduce((total, digit) => total + Number(digit), 0);
    return sum + '/' + reduced;
  }

  function cleanTags(value) {
    const raw = Array.isArray(value) ? value : String(value || '').split(',');
    const seen = new Set();
    const tags = [];
    raw.forEach(value => {
      const tag = String(value || '').trim().replace(/\s+/g, ' ').slice(0, 32);
      const key = tag.toLocaleLowerCase();
      if (tag && !seen.has(key)) { seen.add(key); tags.push(tag); }
    });
    return tags;
  }

  function contactTagOptions(list) {
    const tags = DEFAULT_CONTACT_TAGS.concat(loadContactTags());
    (list || loadBirths()).forEach(function (entry) { tags.push.apply(tags, cleanTags(entry.tags)); });
    return cleanTags(tags).sort(function (a, b) { return a.localeCompare(b, undefined, { sensitivity: 'base' }); });
  }

  function rememberContactTags(tags) {
    const current = contactTagOptions([]);
    return saveContactTags(cleanTags(current.concat(tags)));
  }

  function removeContactTag(tag) {
    const key = tag.toLocaleLowerCase();
    const entries = loadBirths().map(function (entry) {
      const tags = cleanTags(entry.tags).filter(function (value) { return value.toLocaleLowerCase() !== key; });
      return Object.assign({}, entry, { tags: tags.length ? tags : undefined });
    });
    if (!saveBirths(entries)) { bdayToast('Couldn’t save contact changes. Check browser storage and try again.', true); return false; }
    if (!saveContactTags(loadContactTags().filter(function (value) { return String(value).toLocaleLowerCase() !== key; }))) {
      bdayToast('Contact tags could not be saved. Check browser storage and try again.', true);
      return false;
    }
    return true;
  }

  function birthTags(entry) {
    const tags = cleanTags(entry.tags);
    return tags.length ? '<span class="birth-tags">' + tags.map(tag =>
      '<span class="birth-tag">' + escHtml(tag) + '</span>').join('') + '</span>' : '';
  }

  function relOn() {
    const f = document.getElementById('finder');
    return !!(f && f.classList.contains('rel-on'));
  }

  // Which Finder slot a pick fills. Module-private; finder-trays.js reads/
  // sets it through the window accessors below.
  let _bdayTarget = 'self';
  let _editingBirthId = null;
  let _birthQuery = '';
  let _birthSort = 'name';
  let _birthTags = [];
  let _tagFiltersOpen = false;
  let _birthPage = 1;
  let _birthPageCount = 1;
  let _birthLoadTimer = null;
  let _formTags = [];
  let _tagCreatorOpen = false;

  function changeBirthPage(direction) {
    const next = Math.max(1, Math.min(_birthPageCount, _birthPage + direction));
    if (next === _birthPage) return;
    _birthPage = next;
    renderBirthPanel();
  }

  function loadBirth(entry, target, options) {
    options = options || {};
    if (typeof window.loadDateInFinder !== 'function') return;
    const reveal = function () {
      _birthLoadTimer = null;
      window.loadDateInFinder(entry.month, entry.day, target, {
        name: entry.name, year: entry.year,
        birthDetails: { year: entry.year, month: entry.month, day: entry.day }
      });
    };
    if (options.keepTrayOpen || typeof window.closeFinderTray !== 'function') {
      reveal();
      return;
    }
    // The tray's close transition changes the Finder's layout. Waiting until
    // it settles lets Finder measure the actual result position and keeps the
    // card reveal completely in place.
    window.closeFinderTray('bday');
    window.clearTimeout(_birthLoadTimer);
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveal();
    } else {
      _birthLoadTimer = window.setTimeout(reveal, 210);
    }
  }

  // The person's Birth Card as a small parchment chip (rank + suit pip).
  // Dec 31 (solar value 0) is the Joker — a gold sparkle.
  function birthChip(e) {
    const sv = typeof window.solarValue === 'function' ? window.solarValue(e.month, e.day) : null;
    if (sv > 0 && typeof SPREAD_CARDS !== 'undefined' && SPREAD_CARDS[sv - 1]) {
      const c = SPREAD_CARDS[sv - 1];
      const red = c.suit === 'hearts' || c.suit === 'diamonds';
      const suitMark = typeof window.pipMark === 'function' ? window.pipMark(c.sym) : c.sym;
      return '<span class="bi-chip' + (red ? ' red' : '') + '"><span class="bi-rank">' + c.rank + '</span><span class="bi-suit">' + suitMark + '</span></span>';
    }
    return '<span class="bi-chip bi-chip-joker">&#10022;</span>';
  }
  function birthCardSearchText(e) {
    const sv = typeof window.solarValue === 'function' ? window.solarValue(e.month, e.day) : null;
    if (!sv || typeof SPREAD_CARDS === 'undefined' || !SPREAD_CARDS[sv - 1]) return 'joker';
    const card = SPREAD_CARDS[sv - 1];
    const suitNames = { hearts: 'Hearts', diamonds: 'Diamonds', clubs: 'Clubs', spades: 'Spades' };
    const rankNames = { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' };
    const rankName = rankNames[card.rank] || card.rank;
    const suitName = suitNames[card.suit] || card.suit;
    const suitCode = suitName.charAt(0).toLowerCase();
    return [card.rank + suitCode, card.rank + card.sym, rankName + ' of ' + suitName, rankName + ' ' + suitName].join(' ');
  }
  function birthDateSearchText(e) {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const day = String(e.day);
    const paddedDay = day.padStart(2, '0');
    const month = String(e.month);
    const paddedMonth = month.padStart(2, '0');
    const shortMonth = MONTHS_SHORT[e.month - 1] || '';
    const longMonth = months[e.month - 1] || '';
    return [
      `${day} ${month}`, `${day} ${paddedMonth}`, `${paddedDay} ${month}`, `${paddedDay} ${paddedMonth}`,
      `${shortMonth} ${day}`, `${longMonth} ${day}`, `${day} ${shortMonth}`, `${day} ${longMonth}`,
      `${day}/${month}`, `${paddedDay}/${paddedMonth}`, `${day}-${month}`, `${paddedDay}-${paddedMonth}`,
      `${paddedMonth}/${paddedDay}`, `${paddedMonth}-${paddedDay}`, `${e.year}-${paddedMonth}-${paddedDay}`
      ,`${day} ${month} ${e.year}`, `${paddedDay} ${paddedMonth} ${e.year}`,
      `${month} ${day} ${e.year}`, `${paddedMonth} ${paddedDay} ${e.year}`
    ].join(' ');
  }

  function renderBirthPanel() {
    const panel = document.getElementById('birthPanel');
    const badge = document.getElementById('finderBdayBadge');
    const count = document.getElementById('bdayCount');
    const searchWrap = document.getElementById('bdaySearchWrap');
    const search = document.getElementById('bdaySearch');
    const activeFilters = document.getElementById('bdayActiveFilters');
    const activeFilterSummary = document.getElementById('bdayActiveFilterSummary');
    const sortWrap = document.getElementById('bdaySortWrap');
    const sortSelect = document.getElementById('bdaySort');
    const tagToggle = document.getElementById('bdayTagsToggle');
    const tagFilters = document.getElementById('bdayTagFilters');
    const pager = document.getElementById('bdayPager');
    if (!panel) return;
    const list = loadBirths();
    if (badge) {
      if (list.length) { badge.textContent = list.length > 99 ? '99+' : String(list.length); badge.classList.add('visible'); }
      else { badge.textContent = ''; badge.classList.remove('visible'); }
    }
    if (count) count.textContent = list.length + (list.length === 1 ? ' contact' : ' contacts');
    if (searchWrap) searchWrap.hidden = !list.length;
    if (sortWrap) sortWrap.hidden = !list.length;
    if (sortSelect && sortSelect.value !== _birthSort) sortSelect.value = _birthSort;
    if (search && search.value !== _birthQuery) search.value = _birthQuery;
    const tagNames = contactTagOptions(list).map(function (label) {
      return { key: label.toLocaleLowerCase(), label: label };
    });
    const assignedTags = list.reduce(function (tags, entry) { return tags.concat(cleanTags(entry.tags)); }, []);
    const savedCustomTags = loadContactTags().filter(function (tag) {
      return !DEFAULT_CONTACT_TAGS.some(function (defaultTag) { return defaultTag.toLocaleLowerCase() === String(tag).toLocaleLowerCase(); });
    });
    const managedTags = cleanTags(savedCustomTags.concat(assignedTags)).sort(function (a, b) {
      return a.localeCompare(b, undefined, { sensitivity: 'base' });
    });
    const tagKeys = new Set(tagNames.map(function (tag) { return tag.key; }));
    _birthTags = _birthTags.filter(function (tag) { return tag === '__untagged__' || tagKeys.has(tag); });
    if (tagToggle) {
      tagToggle.setAttribute('aria-expanded', _tagFiltersOpen ? 'true' : 'false');
      const label = tagToggle.querySelector('[data-tags-label]');
      if (label) label.textContent = _birthTags.length ? 'Tags (' + _birthTags.length + ')' : 'Tags';
    }
    if (tagFilters) {
      tagFilters.hidden = !list.length || !_tagFiltersOpen;
      tagFilters.innerHTML = list.length ?
        '<button type="button" class="bday-tag-filter' + (!_birthTags.length ? ' is-active' : '') + '" data-tag="">All</button>' +
        '<button type="button" class="bday-tag-filter' + (_birthTags.includes('__untagged__') ? ' is-active' : '') + '" data-tag="__untagged__">Untagged</button>' +
        tagNames.map(tag => '<button type="button" class="bday-tag-filter' + (_birthTags.includes(tag.key) ? ' is-active' : '') +
          '" data-tag="' + escHtml(tag.key) + '">' + escHtml(tag.label) + '</button>').join('') +
        '<button type="button" class="bday-tag-create" data-create-contact-tag>' + (_tagCreatorOpen ? 'Done managing' : 'Manage tags') + '</button>' +
        '<div class="bday-tag-manager"' + (_tagCreatorOpen ? '' : ' hidden') + '>' +
          (managedTags.length
            ? '<div class="bday-managed-tag-list" aria-label="Existing tags">' + managedTags.map(tag =>
                '<div class="bday-managed-tag"><span>' + escHtml(tag) + '</span><button type="button" data-remove-managed-tag="' + escHtml(tag) + '">Remove</button></div>').join('') + '</div>'
            : '<p class="bday-managed-tag-empty">No saved tags yet.</p>') +
          '<form class="bday-tag-add-form" data-contact-tag-form>' +
            '<label for="bdayNewTag">New tag</label><input id="bdayNewTag" type="text" maxlength="32" autocomplete="off">' +
            '<button type="submit" data-tag-action="add" disabled>Add tag</button></form>' +
        '</div>' : '';
      tagFilters.querySelectorAll('[data-tag]').forEach(button => button.addEventListener('click', () => {
        const tag = button.dataset.tag;
        if (!tag) _birthTags = [];
        else if (tag === '__untagged__') _birthTags = _birthTags.includes(tag) ? [] : [tag];
        else {
          _birthTags = _birthTags.filter(function (value) { return value !== '__untagged__'; });
          _birthTags = _birthTags.includes(tag)
            ? _birthTags.filter(function (value) { return value !== tag; })
            : _birthTags.concat(tag);
        }
        _birthPage = 1;
        renderBirthPanel();
      }));
      const create = tagFilters.querySelector('[data-create-contact-tag]');
      if (create) create.addEventListener('click', function () {
        _tagCreatorOpen = !_tagCreatorOpen;
        renderBirthPanel();
        if (_tagCreatorOpen) {
          const input = document.getElementById('bdayNewTag');
          if (input) input.focus();
        }
      });
      tagFilters.querySelectorAll('[data-remove-managed-tag]').forEach(button => button.addEventListener('click', function () {
        const tag = button.dataset.removeManagedTag;
        if (!tag || !removeContactTag(tag)) return;
        const key = tag.toLocaleLowerCase();
        _birthTags = _birthTags.filter(function (selected) { return selected !== key; });
        _formTags = _formTags.filter(function (selected) { return selected.toLocaleLowerCase() !== key; });
        renderBirthPanel();
        renderFormTagPicker();
      }));
      const form = tagFilters.querySelector('[data-contact-tag-form]');
      if (form) form.addEventListener('submit', function (event) {
        event.preventDefault();
        const input = form.querySelector('input');
        const tag = cleanTags(input && input.value)[0];
        if (!tag) { if (input) input.focus(); return; }
        const existing = contactTagOptions(loadBirths()).some(function (value) {
          return value.toLocaleLowerCase() === tag.toLocaleLowerCase();
        });
        if (existing) { if (input) input.focus(); return; }
        rememberContactTags([tag]);
        _tagCreatorOpen = false;
        renderBirthPanel();
        renderFormTagPicker();
      });
      if (form) {
        const input = form.querySelector('input');
        const addButton = form.querySelector('[data-tag-action="add"]');
        const syncAddTagAction = function () {
          const value = cleanTags(input && input.value)[0] || '';
          const existing = value && contactTagOptions(loadBirths()).some(function (tag) {
            return tag.toLocaleLowerCase() === value.toLocaleLowerCase();
          });
          if (addButton) addButton.disabled = !value || !!existing;
        };
        if (input) input.addEventListener('input', syncAddTagAction);
        syncAddTagAction();
      }
    }
    if (activeFilters && activeFilterSummary) {
      const activeLabels = [];
      if (_birthQuery.trim()) activeLabels.push('<span class="bday-active-filter">Search: ' + escHtml(_birthQuery.trim()) + '</span>');
      _birthTags.forEach(function (key) {
        const tag = key === '__untagged__'
          ? 'Untagged'
          : ((tagNames.find(function (item) { return item.key === key; }) || {}).label || key);
        activeLabels.push('<span class="bday-active-filter">' + escHtml(tag) + '</span>');
      });
      activeFilterSummary.innerHTML = activeLabels.join('');
      activeFilters.hidden = !activeLabels.length;
    }
    if (!list.length) {
      _birthPageCount = 1;
      panel.innerHTML = '<div class="birth-empty">No contacts yet.</div>';
      if (pager) { pager.hidden = true; pager.innerHTML = ''; }
      return;
    }
    const compareName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base', numeric: true });
    const cardOrder = entry => {
      const value = typeof window.solarValue === 'function' ? window.solarValue(entry.month, entry.day) : null;
      return value === 0 ? 52 : (Number.isInteger(value) && value > 0 ? value - 1 : 53);
    };
    const pathParts = entry => lifePathNumber(entry.year, entry.month, entry.day).split('/').map(Number);
    const chineseAnimal = entry => {
      const profile = typeof window.chineseYearProfile === 'function'
        ? window.chineseYearProfile(entry.year, entry.month, entry.day)
        : null;
      return profile && profile.animal ? profile.animal : '';
    };
    const animalCycle = ['Rat', 'Ox', 'Tiger', 'Cat', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
    const lifePathById = new Map();
    const animalOrderById = new Map();
    if (_birthSort === 'lifePath') list.forEach(entry => lifePathById.set(entry.id, pathParts(entry)));
    if (_birthSort === 'animal') list.forEach(entry => {
      const index = animalCycle.indexOf(chineseAnimal(entry));
      animalOrderById.set(entry.id, index < 0 ? animalCycle.length : index);
    });
    const ordered = list.slice().sort((a, b) => {
      const favoriteOrder = Number(!!b.favorite) - Number(!!a.favorite);
      if (favoriteOrder) return favoriteOrder;
      if (_birthSort === 'birthday') {
        return (a.month - b.month) || (a.day - b.day) || compareName(a, b) || (a.year - b.year) || (a.id - b.id);
      }
      if (_birthSort === 'age') {
        return (a.year - b.year) || (a.month - b.month) || (a.day - b.day) || compareName(a, b) || (a.id - b.id);
      }
      if (_birthSort === 'card') {
        return (cardOrder(a) - cardOrder(b)) || compareName(a, b) || (a.year - b.year) || (a.id - b.id);
      }
      if (_birthSort === 'lifePath') {
        const aPath = lifePathById.get(a.id), bPath = lifePathById.get(b.id);
        return (aPath[1] - bPath[1]) || (aPath[0] - bPath[0]) || compareName(a, b) || (a.id - b.id);
      }
      if (_birthSort === 'animal') {
        return (animalOrderById.get(a.id) - animalOrderById.get(b.id)) || compareName(a, b) || (a.year - b.year) || (a.id - b.id);
      }
      return compareName(a, b) || (a.year - b.year) || (a.month - b.month) || (a.day - b.day) || (a.id - b.id);
    });
    const query = _birthQuery.trim().toLocaleLowerCase();
    const compactQuery = query.replace(/\s+/g, '');
    const matches = ordered.filter(e => {
      const tags = cleanTags(e.tags);
      const tagMatch = !_birthTags.length || (_birthTags.includes('__untagged__')
        ? !tags.length
        : _birthTags.every(selected => tags.some(tag => tag.toLocaleLowerCase() === selected)));
      const cardText = birthCardSearchText(e);
      const dateText = birthDateSearchText(e);
      const searchableText = [e.name, e.year, tags.join(' '), cardText, dateText]
        .filter(v => v != null).join(' ').toLocaleLowerCase();
      const compactDateText = dateText.replace(/[\s\/-]+/g, '').toLocaleLowerCase();
      const queryMatch = !query || searchableText.includes(query) ||
        cardText.replace(/\s+/g, '').toLocaleLowerCase().includes(compactQuery) ||
        compactDateText.includes(compactQuery);
      return tagMatch && queryMatch;
    });
    const pageCount = Math.max(1, Math.ceil(matches.length / BIRTH_PAGE_SIZE));
    _birthPageCount = pageCount;
    _birthPage = Math.min(_birthPage, pageCount);
    const start = (_birthPage - 1) * BIRTH_PAGE_SIZE;
    const visible = matches.slice(start, start + BIRTH_PAGE_SIZE);
    if (!matches.length) {
      panel.innerHTML = '<div class="birth-empty">No contacts match that search.</div>';
    } else {
      let lastFavoriteGroup = null;
      panel.innerHTML = visible.map(e => {
      const chinese = typeof window.chineseYearProfile === 'function'
        ? window.chineseYearProfile(e.year, e.month, e.day)
        : null;
      const isFavorite = !!e.favorite;
      const groupHeading = isFavorite !== lastFavoriteGroup
        ? '<div class="birth-group-label">' + (isFavorite ? 'Favourites' : 'Contacts') + '</div>'
        : '';
      lastFavoriteGroup = isFavorite;
      return groupHeading + '<div class="birth-item" data-id="' + e.id + '">' +
        '<button type="button" class="birth-open" aria-label="Open reading for ' + escHtml(e.name) + '">' +
          birthChip(e) +
          '<span class="birth-item-body">' +
            '<span class="birth-name">' + escHtml(e.name) + '</span>' +
            '<span class="birth-date birth-date-primary">' + MONTHS_SHORT[e.month - 1] + ' ' + e.day + ', ' + e.year +
              ' &middot; age ' + ageFromBirthYear(e.year, e.month, e.day) + '</span>' +
            '<span class="birth-date birth-date-secondary">Life path ' + lifePathNumber(e.year, e.month, e.day) +
              (chinese ? ' &middot; ' + escHtml(chinese.animal) : '') + '</span>' +
            birthTags(e) +
          '</span>' +
        '</button>' +
        '<button type="button" class="birth-favorite' + (e.favorite ? ' is-favorite' : '') + '" data-favorite="' + e.id + '" aria-pressed="' + (e.favorite ? 'true' : 'false') + '" aria-label="' + (e.favorite ? 'Remove ' : 'Add ') + escHtml(e.name) + (e.favorite ? ' from favourites' : ' to favourites') + '">&#9733;</button>' +
        '<details class="birth-actions"><summary aria-label="Actions for ' + escHtml(e.name) + '">&#183;&#183;&#183;</summary>' +
          '<div class="birth-actions-menu"><button type="button" data-edit="' + e.id + '">Edit contact</button>' +
          '<button type="button" data-del="' + e.id + '">Delete contact</button></div></details>' +
      '</div>';
      }).join('');
    }
    panel.querySelectorAll('.birth-open').forEach(button => {
      button.addEventListener('click', () => {
        const item = button.closest('.birth-item');
        const id = item ? +item.dataset.id : NaN;
        const entry = loadBirths().find(x => x.id === id);
        if (entry) loadBirth(entry, _bdayTarget);
      });
    });
    panel.querySelectorAll('[data-edit]').forEach(b => {
      b.addEventListener('click', ev => {
        ev.stopPropagation();
        const entry = loadBirths().find(x => x.id === +b.dataset.edit);
        if (entry) openBirthEditPanel(entry);
      });
    });
    panel.querySelectorAll('[data-del]').forEach(b => {
      b.addEventListener('click', ev => {
        ev.stopPropagation();
        const id = +b.dataset.del;
        if (!saveBirths(loadBirths().filter(x => x.id !== id))) {
          bdayToast('Couldn’t save contact changes. Check browser storage and try again.', true);
          return;
        }
        if (_editingBirthId === id) closeBirthAddPanel();
        renderBirthPanel();
      });
    });
    panel.querySelectorAll('[data-favorite]').forEach(b => {
      b.addEventListener('click', ev => {
        ev.stopPropagation();
        const id = +b.dataset.favorite;
        if (!saveBirths(loadBirths().map(function (entry) {
          return entry.id === id ? Object.assign({}, entry, { favorite: !entry.favorite }) : entry;
        }))) {
          bdayToast('Couldn’t save contact changes. Check browser storage and try again.', true);
          return;
        }
        renderBirthPanel();
      });
    });
    if (pager) {
      pager.hidden = pageCount < 2;
      pager.innerHTML = pageCount < 2 ? '' :
        '<button type="button" class="bday-page-btn" data-page="prev">Previous</button>' +
        '<span class="bday-page-status">Page ' + _birthPage + ' of ' + pageCount + '</span>' +
        '<button type="button" class="bday-page-btn" data-page="next">Next</button>';
      const prev = pager.querySelector('[data-page="prev"]');
      const next = pager.querySelector('[data-page="next"]');
      if (prev) { prev.disabled = _birthPage === 1; prev.addEventListener('click', () => changeBirthPage(-1)); }
      if (next) { next.disabled = _birthPage === pageCount; next.addEventListener('click', () => changeBirthPage(1)); }
    }
  }

  function wireBirthPaging() {
    const panel = document.getElementById('birthPanel');
    if (!panel) return;
    let touch = null;
    let suppressClickUntil = 0;
    let wheelTotal = 0;
    let wheelUsed = false;
    let wheelCanRearm = false;
    let wheelDirection = 0;
    let wheelTimer = null;

    panel.addEventListener('touchstart', function (event) {
      if (_birthPageCount < 2 || event.touches.length !== 1 || event.target.closest('button, input')) {
        touch = null;
        return;
      }
      touch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }, { passive: true });
    panel.addEventListener('touchcancel', function () { touch = null; }, { passive: true });
    panel.addEventListener('touchend', function (event) {
      if (!touch || !event.changedTouches.length) return;
      const dx = event.changedTouches[0].clientX - touch.x;
      const dy = event.changedTouches[0].clientY - touch.y;
      touch = null;
      if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy) * 1.4) return;
      suppressClickUntil = Date.now() + 450;
      changeBirthPage(dx < 0 ? 1 : -1);
    }, { passive: true });
    panel.addEventListener('click', function (event) {
      if (Date.now() >= suppressClickUntil) return;
      event.preventDefault();
      event.stopPropagation();
    }, true);
    panel.addEventListener('wheel', function (event) {
      if (_birthPageCount < 2 || event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.25) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : (event.deltaMode === 2 ? window.innerWidth : 1);
      const delta = event.deltaX * unit;
      const magnitude = Math.abs(delta);
      const direction = Math.sign(delta);
      if (wheelUsed) {
        if (magnitude <= 3) wheelCanRearm = true;
        if ((wheelCanRearm && magnitude >= 8) || (direction !== wheelDirection && magnitude >= 8)) {
          wheelTotal = 0;
          wheelUsed = false;
          wheelCanRearm = false;
        }
      }
      if (!wheelUsed) wheelTotal += delta;
      if (!wheelUsed && Math.abs(wheelTotal) >= 32) {
        wheelUsed = true;
        wheelDirection = Math.sign(wheelTotal);
        changeBirthPage(wheelTotal > 0 ? 1 : -1);
      }
      if (wheelTimer !== null) window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(function () {
        wheelTotal = 0;
        wheelUsed = false;
        wheelCanRearm = false;
        wheelDirection = 0;
        wheelTimer = null;
      }, 90);
    }, { passive: false });
  }

  // Start pickers on the first empty slot when relationship mode is on:
  // prefer You, then Partner, else fall back to You. In solo mode we
  // always target You.
  function defaultTarget() {
    if (!relOn()) return 'self';
    const selfFilled = !!((document.getElementById('fMonth') || {}).value && (document.getElementById('fDay') || {}).value);
    const partnerFilled = !!((document.getElementById('fpMonth') || {}).value && (document.getElementById('fpDay') || {}).value);
    if (!selfFilled) return 'self';
    if (!partnerFilled) return 'partner';
    return 'self';
  }

  function setBdayTarget(t) {
    _bdayTarget = t === 'partner' ? 'partner' : 'self';
    [['bdayTargetSelf', 'bdayTargetPartner'],
     ['deckTargetSelf', 'deckTargetPartner']].forEach(pair => {
      const s = document.getElementById(pair[0]), p = document.getElementById(pair[1]);
      if (s) s.classList.toggle('is-active', _bdayTarget === 'self');
      if (p) p.classList.toggle('is-active', _bdayTarget === 'partner');
    });
  }

  function prepareBirthTray() {
    renderBirthPanel();
    const tgt = document.getElementById('bdayTarget');
    if (relOn()) { if (tgt) tgt.hidden = false; setBdayTarget(defaultTarget()); }
    else { if (tgt) tgt.hidden = true; setBdayTarget('self'); }
  }

  function openBirthPanel() {
    prepareBirthTray();
    if (typeof window.openFinderTray === 'function') window.openFinderTray('bday');
  }

  // ── Manual birthday entry (DD / MM / YYYY) ─────────────────────
  function setBirthFormMode(entry) {
    _editingBirthId = entry ? entry.id : null;
    const saveBtn = document.getElementById('birthAddSave');
    const heading = document.getElementById('birthFormHeading');
    if (saveBtn) saveBtn.textContent = entry ? 'Save changes' : 'Add contact';
    if (heading) heading.textContent = entry ? 'Edit contact' : 'Add contact';
  }

  function renderFormTagPicker() {
    const picker = document.getElementById('baTagPicker');
    if (!picker) return;
    const selected = new Set(_formTags.map(function (tag) { return tag.toLocaleLowerCase(); }));
    picker.innerHTML = contactTagOptions().map(function (tag) {
      const on = selected.has(tag.toLocaleLowerCase());
      return '<button type="button" class="birth-tag-option' + (on ? ' is-selected' : '') + '" data-form-tag="' + escHtml(tag) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + escHtml(tag) + '</button>';
    }).join('');
    picker.querySelectorAll('[data-form-tag]').forEach(function (button) {
      button.addEventListener('click', function () {
        const tag = button.dataset.formTag;
        const key = tag.toLocaleLowerCase();
        _formTags = _formTags.filter(function (item) { return item.toLocaleLowerCase() !== key; });
        if (!selected.has(key)) _formTags.push(tag);
        renderFormTagPicker();
      });
    });
  }

  function clearBirthForm() {
    const dEl = document.getElementById('baDay');
    const mEl = document.getElementById('baMonth');
    const yEl = document.getElementById('baYear');
    const nEl = document.getElementById('baName');
    if (dEl) dEl.value = '';
    if (mEl) mEl.value = '';
    if (yEl) yEl.value = '';
    if (nEl) nEl.value = '';
    _formTags = [];
    renderFormTagPicker();
  }

  function openBirthAddPanel() {
    const dEl = document.getElementById('baDay');
    const mEl = document.getElementById('baMonth');
    const fMonth = document.getElementById('fMonth');
    const fDay = document.getElementById('fDay');
    const fM = fMonth ? parseInt(fMonth.value, 10) : NaN;
    const fD = fDay ? parseInt(fDay.value, 10) : NaN;
    setBirthFormMode(null);
    clearBirthForm();
    if (fD && fM) {
      dEl.value = String(fD).padStart(2, '0');
      mEl.value = String(fM).padStart(2, '0');
    }
    const panel = document.getElementById('birthAddPanel');
    panel.classList.add('open');
    panel.inert = false;
    document.getElementById('bdayAddBtn').setAttribute('aria-expanded', 'true');
    renderFormTagPicker();
    setTimeout(() => {
      const firstEmpty = ['baName', 'baDay', 'baMonth', 'baYear'].find(id => !document.getElementById(id).value);
      document.getElementById(firstEmpty || 'baName').focus();
    }, 0);
  }

  function openBirthEditPanel(entry) {
    const dEl = document.getElementById('baDay');
    const mEl = document.getElementById('baMonth');
    const yEl = document.getElementById('baYear');
    const nEl = document.getElementById('baName');
    setBirthFormMode(entry);
    dEl.value = String(entry.day).padStart(2, '0');
    mEl.value = String(entry.month).padStart(2, '0');
    yEl.value = String(entry.year);
    nEl.value = entry.name;
    _formTags = cleanTags(entry.tags);
    const panel = document.getElementById('birthAddPanel');
    panel.classList.add('open');
    panel.inert = false;
    document.getElementById('bdayAddBtn').setAttribute('aria-expanded', 'true');
    renderFormTagPicker();
    setTimeout(() => nEl.focus(), 0);
  }

  function closeBirthAddPanel() {
    const p = document.getElementById('birthAddPanel');
    const restoreFocus = !!(p && p.contains(document.activeElement));
    if (p) { p.classList.remove('open'); p.inert = true; }
    const addButton = document.getElementById('bdayAddBtn');
    if (addButton) addButton.setAttribute('aria-expanded', 'false');
    const err = document.getElementById('birthAddError');
    if (err) err.textContent = '';
    setBirthFormMode(null);
    if (restoreFocus && addButton) addButton.focus();
  }

  function isValidBirthDate(day, month, year) {
    const yMax = new Date().getFullYear();
    if (!Number.isInteger(day) || day < 1 || day > 31 ||
        !Number.isInteger(month) || month < 1 || month > 12 ||
        !Number.isInteger(year) || year < 1 || year > yMax) return false;
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return date.getTime() <= today.getTime();
  }

  function nextBirthId(list) {
    const used = new Set(list.map(function (entry) { return entry.id; }));
    let id = Date.now();
    while (used.has(id)) id++;
    return id;
  }

  function saveManualBirth() {
    const dEl = document.getElementById('baDay');
    const mEl = document.getElementById('baMonth');
    const yEl = document.getElementById('baYear');
    const nEl = document.getElementById('baName');
    const err = document.getElementById('birthAddError');
    const d = parseInt(dEl.value, 10);
    const m = parseInt(mEl.value, 10);
    const y = parseInt(yEl.value, 10);
    const name = (nEl.value || '').trim();
    const tags = cleanTags(_formTags);
    err.textContent = '';
    if (!name)                       { err.textContent = 'Name is required.'; nEl.focus(); return; }
    if (!d || d < 1 || d > 31)       { err.textContent = 'Day must be 1–31.'; dEl.focus(); return; }
    if (!m || m < 1 || m > 12)       { err.textContent = 'Month must be 1–12.'; mEl.focus(); return; }
    const yMax = new Date().getFullYear();
    if (!y || y < 1 || y > yMax)  { err.textContent = 'Year must be 1–' + yMax + '.'; yEl.focus(); return; }
    if (!isValidBirthDate(d, m, y)) {
      err.textContent = 'Not a valid date, or birthday is in the future.'; dEl.focus(); return;
    }
    const wasEditing = _editingBirthId !== null;
    let entry = null;
    let list = loadBirths();
    if (wasEditing) {
      list = list.map(item => {
        if (item.id !== _editingBirthId) return item;
        entry = { id: item.id, name, day: d, month: m, year: y, favorite: !!item.favorite };
        if (tags.length) entry.tags = tags;
        return entry;
      });
      if (!entry) {
        closeBirthAddPanel();
        renderBirthPanel();
        bdayToast('That contact was not found.', true);
        return;
      }
    } else {
      entry = { id: Date.now(), name, day: d, month: m, year: y };
      if (tags.length) entry.tags = tags;
      list.push(entry);
    }
    if (!saveBirths(list)) {
      bdayToast('Couldn’t save contact. Check browser storage and try again.', true);
      return;
    }
    rememberContactTags(tags);
    clearBirthForm();
    closeBirthAddPanel();
    renderBirthPanel();
    loadBirth(entry, _bdayTarget, { keepTrayOpen: wasEditing });
  }

  function wireAddFormAutoAdvance() {
    const numericSeq = ['baDay', 'baMonth', 'baYear'];
    numericSeq.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        el.value = el.value.replace(/\D/g, '');
        const maxLen = el.getAttribute('maxlength') | 0;
        if (el.value.length >= maxLen) document.getElementById(numericSeq[i + 1] || 'birthAddSave').focus();
      });
    });
    ['baName'].concat(numericSeq).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveManualBirth(); } });
    });
  }

  // ── Export / import (file only; import merges, never wipes) ────
  function exportBirths() {
    const payload = { app: 'mysticscards', type: 'birthdays', version: 2,
                      exported: new Date().toISOString(), births: loadBirths() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mysticscards-contacts-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function validBirth(o) {
    return o && typeof o.name === 'string' && o.name.trim() &&
      isValidBirthDate(o.day, o.month, o.year);
  }
  function bdayToast(msg, isErr) {
    const note = document.querySelector('#bdayTrayWrap .bday-note');
    if (!note) return;
    if (note._orig == null) note._orig = note.textContent;
    note.hidden = false;
    note.textContent = msg;
    note.style.color = isErr ? '#e98a8a' : 'var(--gold-ink)';
    clearTimeout(note._t);
    note._t = setTimeout(() => { note.textContent = note._orig; note.style.color = ''; note.hidden = true; }, 3500);
  }
  function importBirthsFromFile(ev) {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try { data = JSON.parse(reader.result); }
      catch (e) { bdayToast('That file isn’t valid JSON.', true); return; }
      const incoming = Array.isArray(data) ? data
        : (data && Array.isArray(data.births) ? data.births : null);
      if (!incoming) { bdayToast('No contacts found in that file.', true); return; }
      const clean = incoming.filter(validBirth).map(o => ({
        name: o.name.trim(),
        day: o.day,
        month: o.month,
        year: o.year,
        favorite: !!o.favorite,
        tags: cleanTags(o.tags) || undefined
      }));
      if (!clean.length) { bdayToast('No valid contacts to import.', true); return; }
      const existing = loadBirths();
      const key = o => o.name.toLowerCase() + '|' + o.day + '|' + o.month + '|' + o.year;
      const seen = new Set(existing.map(key));
      let added = 0;
      clean.forEach(o => {
        if (!seen.has(key(o))) {
          seen.add(key(o));
          o.id = nextBirthId(existing);
          existing.push(o);
          added++;
        }
      });
      if (!saveBirths(existing)) {
        bdayToast('Couldn’t import contacts. Check browser storage and try again.', true);
        return;
      }
      rememberContactTags(clean.reduce(function (tags, entry) { return tags.concat(entry.tags || []); }, []));
      renderBirthPanel();
      bdayToast(added ? ('Imported ' + added + (added === 1 ? ' contact.' : ' contacts.'))
                     : 'Everything in that file was already saved.', false);
    };
    reader.onerror = () => bdayToast('Couldn’t read that file.', true);
    reader.readAsText(file);
  }

  function wireTray() {
    const addToggle = document.getElementById('bdayAddBtn');
    if (addToggle) addToggle.addEventListener('click', () => {
      const p = document.getElementById('birthAddPanel');
      p.classList.contains('open') ? closeBirthAddPanel() : openBirthAddPanel();
    });
    const saveBtn = document.getElementById('birthAddSave');
    if (saveBtn) saveBtn.addEventListener('click', saveManualBirth);
    const cancelBtn = document.getElementById('birthAddCancel');
    if (cancelBtn) cancelBtn.addEventListener('click', function () {
      clearBirthForm();
      closeBirthAddPanel();
      const addToggle = document.getElementById('bdayAddBtn');
      if (addToggle) addToggle.focus();
    });
    const exportBtn = document.getElementById('bdayExportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportBirths);
    const importBtn = document.getElementById('bdayImportBtn');
    const importFile = document.getElementById('bdayImportFile');
    if (importBtn) importBtn.addEventListener('click', () => importFile.click());
    if (importFile) importFile.addEventListener('change', importBirthsFromFile);
    [exportBtn, importBtn].forEach(button => {
      if (!button) return;
      button.addEventListener('click', () => {
        const menu = button.closest('.bday-more-menu');
        if (menu) window.setTimeout(() => { menu.open = false; }, 0);
      });
    });
    const infoBtn = document.getElementById('bdayInfoBtn');
    const note = document.getElementById('bdayNote');
    if (infoBtn && note) infoBtn.addEventListener('click', () => {
      const open = note.hidden;
      note.hidden = !open;
      infoBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      const menu = infoBtn.closest('.bday-more-menu');
      if (menu) menu.open = false;
    });
    const search = document.getElementById('bdaySearch');
    if (search) search.addEventListener('input', () => {
      _birthQuery = search.value;
      _birthPage = 1;
      renderBirthPanel();
    });
    const clearFilters = document.getElementById('bdayClearFilters');
    if (clearFilters) clearFilters.addEventListener('click', () => {
      _birthQuery = '';
      _birthTags = [];
      _birthPage = 1;
      renderBirthPanel();
      if (search) search.focus();
    });
    const sortSelect = document.getElementById('bdaySort');
    if (sortSelect) sortSelect.addEventListener('change', () => {
      _birthSort = ['name', 'birthday', 'card', 'lifePath', 'animal', 'age'].includes(sortSelect.value) ? sortSelect.value : 'name';
      _birthPage = 1;
      renderBirthPanel();
    });
    const tagToggle = document.getElementById('bdayTagsToggle');
    if (tagToggle) tagToggle.addEventListener('click', () => {
      _tagFiltersOpen = !_tagFiltersOpen;
      renderBirthPanel();
    });
    ['bdayTargetSelf', 'bdayTargetPartner', 'deckTargetSelf', 'deckTargetPartner'].forEach(id => {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', () => setBdayTarget(b.dataset.target));
    });
  }

  window.openBirthPanel = openBirthPanel;
  window.prepareBirthTray = prepareBirthTray;
  window.setBdayTarget  = setBdayTarget;
  window.defaultTarget  = defaultTarget;
  window.bdayTarget     = () => _bdayTarget;

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('birthPanel')) return;
    wireTray();
    wireBirthPaging();
    wireAddFormAutoAdvance();
    renderBirthPanel();
  });
})();
