(function () {
  'use strict';

  function _get(k)         { try { return localStorage.getItem(k);       } catch (e) { return null; } }
  function _set(k, v)      { try { localStorage.setItem(k, v);           } catch (e) {} }
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
  var K_BIRTHS = 'mysticscards_births';
  var K_CONTACT_TAGS = 'mysticscards_contactTags';

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

    // Reading voice (Modern / Olney) is no longer persisted — it moved to
    // per-section rails in About + Card Elements (2026-07-23), each defaulting
    // to Modern on load.

    // ── Saved birthdays ──────────────────────────────────────────
    // JSON array of {id, name, day, month, year, time?, place?}, keyed
    // mysticscards_births. Legacy cardsoflife_births values are migrated
    // on first read so saved birthdays survive the rename. Corrupt JSON
    // resolves to an empty list rather than throwing.
    loadBirths: function () {
      try { return JSON.parse(_getCompat(K_BIRTHS)) || []; } catch (e) { return []; }
    },
    saveBirths: function (list) { _set(K_BIRTHS, JSON.stringify(list)); },
    loadContactTags: function () {
      try { return JSON.parse(_get(K_CONTACT_TAGS)) || []; } catch (e) { return []; }
    },
    saveContactTags: function (tags) { _set(K_CONTACT_TAGS, JSON.stringify(tags)); }
  };
})();
