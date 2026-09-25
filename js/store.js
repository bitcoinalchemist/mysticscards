(function () {
  'use strict';

  function _get(k)         { try { return localStorage.getItem(k);       } catch (e) { return null; } }
  function _set(k, v)      { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function _getCompat(k) {
    var value = _get(k);
    if (value !== null) return value;
    var legacy = _get(k.replace(/^mysticscards_/, 'cardsoflife_'));
    if (legacy !== null) { _set(k, legacy); return legacy; }
    return null;
  }
  function _flag(k)        { return _getCompat(k) === '1'; }
  function _setFlag(k, on) { _set(k, on ? '1' : '0'); }

  var K_ALT    = 'mysticscards_altCourts';
  var K_DISP   = 'mysticscards_showDisp';
  var K_SOLAR  = 'mysticscards_showSolarValues';
  var K_QSIZE  = 'mysticscards_quadSize';
  var K_QREADLTR = 'mysticscards_quadReadLtr';
  var K_BIRTHS = 'mysticscards_births';
  var K_CONTACT_TAGS = 'mysticscards_contactTags';
  var K_PRC_SYSTEM = 'mysticscards_prcSystem';

  window.CardsStore = {
    getQuadAlt:  function ()   { return _flag(K_ALT); },
    setQuadAlt:  function (on) { _setFlag(K_ALT, on); },
    getQuadDisp: function ()   { return _flag(K_DISP); },
    setQuadDisp: function (on) { _setFlag(K_DISP, on); },
    getQuadSolar: function ()   { return _flag(K_SOLAR); },
    setQuadSolar: function (on) { _setFlag(K_SOLAR, on); },
    getQuadSize: function () {
      var size = parseInt(_getCompat(K_QSIZE), 10);
      return Number.isFinite(size) ? size : 100;
    },
    setQuadSize: function (size) { _set(K_QSIZE, String(size)); },
    getQuadReadLtr: function () { return _flag(K_QREADLTR); },
    setQuadReadLtr: function (on) { _setFlag(K_QREADLTR, on); },
    getPrcSystem: function () {
      return _getCompat(K_PRC_SYSTEM) === 'sidereal' ? 'sidereal' : 'tropical';
    },
    setPrcSystem: function (system) {
      _set(K_PRC_SYSTEM, system === 'sidereal' ? 'sidereal' : 'tropical');
    },

    // Reading voice (Modern / Olney) is no longer persisted — it moved to
    // per-section rails in About + Card Elements (2026-07-23), each defaulting
    // to Modern on load.

    // ── Saved birthdays ──────────────────────────────────────────
    // JSON array of {id, name, day, month, year, time?, place?}, keyed
    // mysticscards_births. Legacy cardsoflife_births values are migrated
    // on first read so saved birthdays survive the rename. Corrupt JSON
    // resolves to an empty list rather than throwing.
    loadBirths: function () {
      var raw = _getCompat(K_BIRTHS);
      if (raw === null) return [];
      try {
        var parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        var yearMax = new Date().getFullYear();
        var usedIds = new Set();
        var replacementId = Number.MAX_SAFE_INTEGER;
        return parsed.filter(function (entry) {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry) ||
              !Number.isSafeInteger(Number(entry.id)) || Number(entry.id) <= 0 || typeof entry.name !== 'string' || !entry.name.trim() ||
              !Number.isInteger(entry.day) || !Number.isInteger(entry.month) || !Number.isInteger(entry.year) ||
              entry.day < 1 || entry.day > 31 || entry.month < 1 || entry.month > 12 ||
              entry.year < 1 || entry.year > yearMax) return false;
          var date = new Date(0);
          date.setUTCHours(0, 0, 0, 0);
          date.setUTCFullYear(entry.year, entry.month - 1, entry.day);
          if (date.getUTCFullYear() !== entry.year || date.getUTCMonth() !== entry.month - 1 ||
              date.getUTCDate() !== entry.day) return false;
          var today = new Date();
          if (entry.year > today.getFullYear() ||
              (entry.year === today.getFullYear() && entry.month > today.getMonth() + 1) ||
              (entry.year === today.getFullYear() && entry.month === today.getMonth() + 1 && entry.day > today.getDate())) return false;
          return true;
        }).map(function (entry) {
          var id = Number(entry.id);
          if (usedIds.has(id)) {
            while (usedIds.has(replacementId)) replacementId--;
            id = replacementId--;
          }
          usedIds.add(id);
          var clean = Object.assign({}, entry, { id: id, name: entry.name.trim(), favorite: !!entry.favorite });
          if (Array.isArray(entry.tags)) clean.tags = entry.tags.filter(function (tag) { return typeof tag === 'string' && tag.trim(); });
          else delete clean.tags;
          return clean;
        });
      } catch (e) { return []; }
    },
    saveBirths: function (list) {
      if (!Array.isArray(list)) return false;
      try { return _set(K_BIRTHS, JSON.stringify(list)); } catch (e) { return false; }
    },
    loadContactTags: function () {
      try {
        var parsed = JSON.parse(_get(K_CONTACT_TAGS));
        return Array.isArray(parsed) ? parsed.filter(function (tag) { return typeof tag === 'string' && tag.trim(); }) : [];
      } catch (e) { return []; }
    },
    saveContactTags: function (tags) {
      if (!Array.isArray(tags)) return false;
      try { return _set(K_CONTACT_TAGS, JSON.stringify(tags)); } catch (e) { return false; }
    }
  };
})();
