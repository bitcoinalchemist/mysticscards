// birthdays.js — the saved-birthdays tray (list + manual add/edit
// form + export/import), rendered inline under the Finder alongside the
// other picker trays. Also owns the shared "You / Partner" pick target
// that this tray and js/finder-trays.js's Calendar both read
// from, so a chosen date/entry knows which Finder slot to fill.
//
// First pass (2026-07-09) — a deliberately simple Finder tray (no
// age-driven year prefill, no "For" toggle inside the deck browse — see
// js/finder-trays.js's header comment for why). Placement, visual design,
// and the Cycles panel's contextual add/list buttons are deferred until
// that lane opens; this is the functional first cut asked for in chat.
//
// Loaded as a classic script AFTER spread-grid.js (bare `setAge` global —
// anchors Finder's age-based panels to the picked person's current age)
// and AFTER finder.js (window.loadDateInFinder).
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

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function loadBirths() { return CardsStore.loadBirths(); }
  function saveBirths(list) { CardsStore.saveBirths(list); }

  function lastBdayYear(m, d) {
    const t = new Date();
    const ty = t.getFullYear();
    const todayUTC = Date.UTC(ty, t.getMonth(), t.getDate());
    return (Date.UTC(ty, m - 1, d) > todayUTC) ? ty - 1 : ty;
  }
  function ageFromBirthYear(birthYear, m, d) { return lastBdayYear(m, d) - birthYear; }

  function relOn() {
    const f = document.getElementById('finder');
    return !!(f && f.classList.contains('rel-on'));
  }

  // Which Finder slot a pick fills. Module-private; finder-trays.js reads/
  // sets it through the window accessors below.
  let _bdayTarget = 'self';
  let _editingBirthId = null;
  let _birthQuery = '';
  let _birthPage = 1;

  function loadBirth(entry, target, options) {
    options = options || {};
    // "You" picks carry the person's current age into Finder's age-based
    // panels. Quadrations keeps its own independent age stepper.
    if (target !== 'partner' && typeof setAge === 'function') {
      // The following loadDateInFinder call performs the combined Finder
      // render, so avoid refreshing Cycles once here and then rendering it
      // again immediately afterward.
      setAge(ageFromBirthYear(entry.year, entry.month, entry.day), { silent: true });
    }
    if (typeof window.loadDateInFinder !== 'function') return;
    window.loadDateInFinder(entry.month, entry.day, target, { name: entry.name });
    if (!options.keepTrayOpen && typeof window.closeFinderTray === 'function') window.closeFinderTray('bday');
  }

  // The person's Birth Card as a small parchment chip (rank + suit pip).
  // Dec 31 (solar value 0) is the Joker — a gold sparkle.
  function birthChip(e) {
    const sv = typeof window.solarValue === 'function' ? window.solarValue(e.month, e.day) : null;
    if (sv > 0 && typeof SPREAD_CARDS !== 'undefined' && SPREAD_CARDS[sv - 1]) {
      const c = SPREAD_CARDS[sv - 1];
      const red = c.suit === 'hearts' || c.suit === 'diamonds';
      return '<div class="bi-chip' + (red ? ' red' : '') + '">' + c.rank + c.sym + '</div>';
    }
    return '<div class="bi-chip bi-chip-joker">&#10022;</div>';
  }

  function renderBirthPanel() {
    const panel = document.getElementById('birthPanel');
    const badge = document.getElementById('finderBdayBadge');
    const count = document.getElementById('bdayCount');
    const searchWrap = document.getElementById('bdaySearchWrap');
    const search = document.getElementById('bdaySearch');
    const pager = document.getElementById('bdayPager');
    if (!panel) return;
    const list = loadBirths();
    if (badge) {
      if (list.length) { badge.textContent = list.length > 99 ? '99+' : String(list.length); badge.classList.add('visible'); }
      else { badge.textContent = ''; badge.classList.remove('visible'); }
    }
    if (count) count.textContent = list.length ? String(list.length) : '';
    if (searchWrap) searchWrap.hidden = !list.length;
    if (search && search.value !== _birthQuery) search.value = _birthQuery;
    if (!list.length) {
      panel.innerHTML = '<div class="birth-empty">No saved birthdays yet.</div>';
      if (pager) { pager.hidden = true; pager.innerHTML = ''; }
      return;
    }
    const query = _birthQuery.toLocaleLowerCase();
    const matches = query ? list.filter(e => [e.name, MONTHS_SHORT[e.month - 1], e.day, e.month, e.year]
      .filter(v => v != null).join(' ').toLocaleLowerCase().includes(query)) : list;
    const pageCount = Math.max(1, Math.ceil(matches.length / BIRTH_PAGE_SIZE));
    _birthPage = Math.min(_birthPage, pageCount);
    const start = (_birthPage - 1) * BIRTH_PAGE_SIZE;
    const visible = matches.slice(start, start + BIRTH_PAGE_SIZE);
    if (!matches.length) {
      panel.innerHTML = '<div class="birth-empty">No saved birthdays match that search.</div>';
    } else panel.innerHTML = visible.map(e =>
      '<div class="birth-item" data-id="' + e.id + '">' +
        birthChip(e) +
        '<div class="birth-item-body">' +
          '<div class="birth-name">' + escHtml(e.name) + '</div>' +
          '<div class="birth-date">' + MONTHS_SHORT[e.month - 1] + ' ' + e.day + ', ' + e.year +
            ' &middot; age ' + ageFromBirthYear(e.year, e.month, e.day) + '</div>' +
        '</div>' +
        '<button type="button" class="birth-edit" data-edit="' + e.id + '" title="Edit" aria-label="Edit ' + escHtml(e.name) + '">Edit</button>' +
        '<button type="button" class="birth-del" data-del="' + e.id + '" title="Delete" aria-label="Delete ' + escHtml(e.name) + '">&times;</button>' +
      '</div>'
    ).join('');
    panel.querySelectorAll('.birth-item').forEach(item => {
      item.addEventListener('click', ev => {
        if (ev.target.closest('[data-edit], [data-del]')) return;
        const id = +item.dataset.id;
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
        saveBirths(loadBirths().filter(x => x.id !== id));
        if (_editingBirthId === id) closeBirthAddPanel();
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
      if (prev) { prev.disabled = _birthPage === 1; prev.addEventListener('click', () => { _birthPage--; renderBirthPanel(); }); }
      if (next) { next.disabled = _birthPage === pageCount; next.addEventListener('click', () => { _birthPage++; renderBirthPanel(); }); }
    }
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
    if (saveBtn) saveBtn.textContent = entry ? 'Update' : 'Save';
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
    document.getElementById('birthAddPanel').classList.add('open');
    setTimeout(() => {
      const firstEmpty = ['baDay', 'baMonth', 'baYear', 'baName'].find(id => !document.getElementById(id).value);
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
    document.getElementById('birthAddPanel').classList.add('open');
    setTimeout(() => nEl.focus(), 0);
  }

  function closeBirthAddPanel() {
    const p = document.getElementById('birthAddPanel');
    if (p) p.classList.remove('open');
    const err = document.getElementById('birthAddError');
    if (err) err.textContent = '';
    setBirthFormMode(null);
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
    err.textContent = '';
    if (!name)                       { err.textContent = 'Name is required.'; nEl.focus(); return; }
    if (!d || d < 1 || d > 31)       { err.textContent = 'Day must be 1–31.'; dEl.focus(); return; }
    if (!m || m < 1 || m > 12)       { err.textContent = 'Month must be 1–12.'; mEl.focus(); return; }
    const yMax = new Date().getFullYear();
    if (!y || y < 1900 || y > yMax)  { err.textContent = 'Year must be 1900–' + yMax + '.'; yEl.focus(); return; }
    const test = new Date(y, m - 1, d);
    if (test.getFullYear() !== y || test.getMonth() !== m - 1 || test.getDate() !== d) {
      err.textContent = 'Not a valid date.'; dEl.focus(); return;
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (test.getTime() > today.getTime()) { err.textContent = 'Birthday can’t be in the future.'; dEl.focus(); return; }
    const wasEditing = _editingBirthId !== null;
    let entry = null;
    let list = loadBirths();
    if (wasEditing) {
      list = list.map(item => {
        if (item.id !== _editingBirthId) return item;
        entry = { id: item.id, name, day: d, month: m, year: y };
        return entry;
      });
      if (!entry) {
        closeBirthAddPanel();
        renderBirthPanel();
        bdayToast('That saved birthday was not found.', true);
        return;
      }
    } else {
      entry = { id: Date.now(), name, day: d, month: m, year: y };
      list.push(entry);
    }
    saveBirths(list);
    clearBirthForm();
    closeBirthAddPanel();
    renderBirthPanel();
    loadBirth(entry, _bdayTarget, { keepTrayOpen: wasEditing });
  }

  function wireAddFormAutoAdvance() {
    const seq = ['baDay', 'baMonth', 'baYear', 'baName'];
    seq.slice(0, 3).forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        el.value = el.value.replace(/\D/g, '');
        const maxLen = el.getAttribute('maxlength') | 0;
        if (el.value.length >= maxLen) document.getElementById(seq[i + 1]).focus();
      });
    });
    seq.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveManualBirth(); } });
    });
  }

  // ── Export / import (file only; import merges, never wipes) ────
  function exportBirths() {
    const payload = { app: 'mysticscards', type: 'birthdays', version: 1,
                      exported: new Date().toISOString(), births: loadBirths() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mysticscards-birthdays-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function validBirth(o) {
    const yMax = new Date().getFullYear();
    return o && typeof o.name === 'string' && o.name.trim() &&
      Number.isInteger(o.day)   && o.day   >= 1    && o.day   <= 31 &&
      Number.isInteger(o.month) && o.month >= 1    && o.month <= 12 &&
      Number.isInteger(o.year)  && o.year  >= 1900 && o.year  <= yMax;
  }
  function bdayToast(msg, isErr) {
    const note = document.querySelector('#bdayTrayWrap .bday-note');
    if (!note) return;
    if (note._orig == null) note._orig = note.textContent;
    note.textContent = msg;
    note.style.color = isErr ? '#e98a8a' : 'var(--gold-ink)';
    clearTimeout(note._t);
    note._t = setTimeout(() => { note.textContent = note._orig; note.style.color = ''; }, 3500);
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
      if (!incoming) { bdayToast('No birthdays found in that file.', true); return; }
      const clean = incoming.filter(validBirth).map(o => ({
        id: Number.isFinite(o.id) ? o.id : Date.now() + Math.floor(Math.random() * 1e6),
        name: o.name.trim(), day: o.day, month: o.month, year: o.year
      }));
      if (!clean.length) { bdayToast('No valid birthdays to import.', true); return; }
      const existing = loadBirths();
      const key = o => o.name.toLowerCase() + '|' + o.day + '|' + o.month + '|' + o.year;
      const seen = new Set(existing.map(key));
      let added = 0;
      clean.forEach(o => { if (!seen.has(key(o))) { seen.add(key(o)); existing.push(o); added++; } });
      saveBirths(existing);
      renderBirthPanel();
      bdayToast(added ? ('Imported ' + added + (added === 1 ? ' birthday.' : ' birthdays.'))
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
    const exportBtn = document.getElementById('bdayExportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportBirths);
    const importBtn = document.getElementById('bdayImportBtn');
    const importFile = document.getElementById('bdayImportFile');
    if (importBtn) importBtn.addEventListener('click', () => importFile.click());
    if (importFile) importFile.addEventListener('change', importBirthsFromFile);
    const search = document.getElementById('bdaySearch');
    if (search) search.addEventListener('input', () => {
      _birthQuery = search.value.trim();
      _birthPage = 1;
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
    wireAddFormAutoAdvance();
    renderBirthPanel();
  });
})();
