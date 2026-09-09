// finder-trays.js — the Finder's inline Saved Birthdays tray.
// Loaded as a classic script after birthdays.js, which provides the shared
// self/partner target helpers used when the tray opens.
(function () {
  'use strict';

  function relOn() {
    const f = document.getElementById('finder');
    return !!(f && f.classList.contains('rel-on'));
  }

  // ── Tray accordion ───────────────────────────────────────────────
  const TRAYS = { bday: 'finderBdayBtn' };
  function trayBtn(key) { return document.getElementById(TRAYS[key]); }

  function closeTray(key) {
    const tray = document.getElementById(key + 'TrayWrap');
    const button = trayBtn(key);

    if (tray) tray.classList.remove('open');
    if (button) {
      button.classList.remove('is-active');
      button.setAttribute('aria-expanded', 'false');
    }
  }

  function closeOtherTrays(except) {
    Object.keys(TRAYS).forEach(k => { if (k !== except) closeTray(k); });
  }

  function openTray(key) {
    closeOtherTrays(key);
    if (typeof window.prepareBirthTray === 'function') window.prepareBirthTray();
    const tgt = document.getElementById(key + 'Target');
    if (tgt) tgt.hidden = !relOn();
    if (typeof window.setBdayTarget === 'function') {
      window.setBdayTarget(relOn() && typeof window.defaultTarget === 'function' ? window.defaultTarget() : 'self');
    }
    const tray = document.getElementById(key + 'TrayWrap');
    const button = trayBtn(key);

    if (tray) tray.classList.add('open');
    if (button) {
      button.classList.add('is-active');
      button.setAttribute('aria-expanded', 'true');
    }
  }

  function toggleTray(key) {
    const tray = document.getElementById(key + 'TrayWrap');
    if (!tray) return;
    tray.classList.contains('open') ? closeTray(key) : openTray(key);
  }
  window.toggleFinderTray = toggleTray;
  window.openFinderTray = openTray;
  window.closeFinderTray = closeTray;
  window.refreshFinderTrayTargets = function refreshFinderTrayTargets() {
    Object.keys(TRAYS).forEach(key => {
      const tray = document.getElementById(key + 'TrayWrap');
      const target = document.getElementById(key + 'Target');
      if (!tray || !target || !tray.classList.contains('open')) return;
      target.hidden = !relOn();
      if (typeof window.setBdayTarget === 'function') {
        window.setBdayTarget(relOn() && typeof window.defaultTarget === 'function' ? window.defaultTarget() : 'self');
      }
    });
  };

  function wire() {
    [['finderBdayBtn', 'bday']].forEach(pair => {
      const b = document.getElementById(pair[0]);
      if (b) b.addEventListener('click', () => toggleTray(pair[1]));
    });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      Object.keys(TRAYS).forEach(k => {
        const t = document.getElementById(k + 'TrayWrap');
        if (t && t.classList.contains('open')) closeTray(k);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('finderBdayBtn')) return;
    wire();
  });
})();
