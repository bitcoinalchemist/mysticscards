(function () {
  'use strict';

  let _qDisplayMode = 'none';
  const Q_SIZE_MIN = 60;
  const Q_SIZE_MAX = 120;

  function clampQuadSize(value) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return 100;
    return Math.min(Q_SIZE_MAX, Math.max(Q_SIZE_MIN, parsed));
  }

  function applyQuadSize(size, persist) {
    const nextSize = clampQuadSize(size);
    const grid = document.getElementById('annualGrid');
    const input = document.getElementById('qSize');

    if (grid) grid.style.setProperty('--quad-scale', String(nextSize / 100));
    if (input && input.value !== String(nextSize)) input.value = String(nextSize);
    if (input) input.setAttribute('aria-valuetext', nextSize + '%');
    const down = document.getElementById('qSizeDown');
    const up = document.getElementById('qSizeUp');
    if (down) down.disabled = nextSize <= Q_SIZE_MIN;
    if (up) up.disabled = nextSize >= Q_SIZE_MAX;
    if (persist) CardsStore.setQuadSize(nextSize);
  }

  function setButtonState(btn, on) {
    if (!btn) return;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
  }

  function qSyncDispBtn() {
    setButtonState(document.getElementById('qDisp'), _qDisplayMode === 'displacements');
  }

  function qSyncSolarBtn() {
    setButtonState(document.getElementById('qSolar'), _qDisplayMode === 'solar');
  }

  function qSyncAltBtn(on) {
    setButtonState(document.getElementById('qAlt'), on);
  }

  function syncSpreadLabel(age) {
    const el = document.getElementById('qModeCurrent');
    if (!el) return;
    if (age === 1) el.textContent = 'Earthly\nSpread';
    else if (age === 90) el.textContent = 'Spiritual\nSpread';
    else el.textContent = '';
  }

  // Put the endpoint label in the empty two-column crown-side immediately
  // before the first top-row card (the KS anchor), so it stays beside the
  // spread when the viewport changes.
  function alignSpreadLabel() {
    const el = document.getElementById('qModeCurrent');
    const home = document.querySelector('#annualGrid .crown-joker');
    if (el && home && el.parentElement !== home) home.appendChild(el);
  }

  function alignQuadControls() {
    // All controls stay above the chart; only the label belongs in the crown.
    alignSpreadLabel();
  }

  function qSetDisplayMode(mode, persist) {
    _qDisplayMode = mode;
    qSyncDispBtn();
    qSyncSolarBtn();
    const ctl = ensureSpreadCtl();
    ctl.showGhosts(mode === 'displacements' ? 'both' : null);
    ctl.showSolarValues(mode === 'solar');
    if (persist) {
      CardsStore.setQuadDisp(mode === 'displacements');
      CardsStore.setQuadSolar(mode === 'solar');
    }
  }
  function qToggleDisplace() {
    qSetDisplayMode(_qDisplayMode === 'displacements' ? 'none' : 'displacements', true);
  }
  function qToggleSolar() {
    qSetDisplayMode(_qDisplayMode === 'solar' ? 'none' : 'solar', true);
  }
  function qToggleAltCourts() {
    const on = document.body.classList.toggle('pips-only');
    qSyncAltBtn(on);
    CardsStore.setQuadAlt(on);
  }
  function restoreQuadToggles() {
    if (CardsStore.getQuadAlt()) {
      document.body.classList.add('pips-only');
      qSyncAltBtn(true);
    }
    const mode = CardsStore.getQuadSolar() ? 'solar' : (CardsStore.getQuadDisp() ? 'displacements' : 'none');
    qSetDisplayMode(mode, false);
  }

  function wireDelegatedControls() {
    const alt = document.getElementById('qAlt');
    if (alt) alt.addEventListener('click', qToggleAltCourts);
    const solar = document.getElementById('qSolar');
    if (solar) solar.addEventListener('click', qToggleSolar);
    const disp = document.getElementById('qDisp');
    if (disp) disp.addEventListener('click', qToggleDisplace);
    const size = document.getElementById('qSize');
    if (size) {
      size.addEventListener('change', function () {
        applyQuadSize(this.value, true);
      });
      size.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') applyQuadSize(size.value, true);
      });
      document.getElementById('qSizeDown').addEventListener('click', function () {
        applyQuadSize(clampQuadSize(size.value) - 5, true);
      });
      document.getElementById('qSizeUp').addEventListener('click', function () {
        applyQuadSize(clampQuadSize(size.value) + 5, true);
      });
    }
  }

  function wireQuadrationsInline() {
    const openBtn = document.getElementById('qOpen');
    const panel = document.getElementById('qInlinePanel');
    if (!openBtn || !panel) return;

    window.bindDisclosurePanel(openBtn, panel, {
      onOpen: function () {
        window.requestAnimationFrame(function () {
          alignQuadControls();
        });
      }
    });
  }

  window.syncSpreadLabel   = syncSpreadLabel;
  window.alignSpreadLabel  = alignSpreadLabel;
  window.alignQuadControls = alignQuadControls;

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('annualGrid')) return;
    wireDelegatedControls();
    wireQuadrationsInline();
    restoreQuadToggles();
    applyQuadSize(CardsStore.getQuadSize(), false);
    // Sync the endpoint label to whatever spread the spread-grid boot rendered.
    syncSpreadLabel((typeof quadAge === 'number' ? quadAge : 0) + 1);
    alignQuadControls();
    window.addEventListener('resize', alignQuadControls);
  });
})();
