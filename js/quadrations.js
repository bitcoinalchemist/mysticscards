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
    const slider = document.getElementById('qSizeSlider');

    if (grid) grid.style.setProperty('--quad-scale', String(nextSize / 100));
    centerSpreadInViewport();
    if (input && input.value !== String(nextSize)) input.value = String(nextSize);
    if (input) input.setAttribute('aria-valuetext', nextSize + '%');
    if (slider && slider.value !== String(nextSize)) slider.value = String(nextSize);
    if (slider) slider.setAttribute('aria-valuetext', nextSize + '%');
    const down = document.getElementById('qSizeDown');
    const up = document.getElementById('qSizeUp');
    if (down) down.disabled = nextSize <= Q_SIZE_MIN;
    if (up) up.disabled = nextSize >= Q_SIZE_MAX;
    if (persist) CardsStore.setQuadSize(nextSize);
  }

  // Keep an oversized spread's midpoint in the viewport. When it fits, the
  // grid's auto margins provide centering without creating horizontal scroll.
  function centerSpreadInViewport() {
    const wrap = document.querySelector('.spread-wrap');
    const grid = document.getElementById('annualGrid');
    if (!wrap || !grid || wrap.clientWidth === 0) return;
    const wrapRect = wrap.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    const centerOffset = (gridRect.left + gridRect.width / 2) - (wrapRect.left + wrapRect.width / 2);
    if (Math.abs(centerOffset) > 0.25) wrap.scrollLeft += centerOffset;
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
    // The spread endpoint label remains aligned in the crown; age and menu
    // controls are placed above the chart in the page shell.
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
    const slider = document.getElementById('qSizeSlider');
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
    if (slider) {
      slider.addEventListener('input', function () { applyQuadSize(this.value, false); });
      slider.addEventListener('change', function () { applyQuadSize(this.value, true); });
    }
  }

  function wireQuadrationsMenu() {
    const button = document.getElementById('qMenu');
    const panel = document.getElementById('qControlsMenu');
    if (!button || !panel) return function () {};

    function positionMenu() {
      if (panel.hidden) return;
      const anchor = button.getBoundingClientRect();
      panel.style.position = 'fixed';
      panel.style.left = '0px';
      panel.style.top = '0px';
      panel.style.visibility = 'hidden';
      const menu = panel.getBoundingClientRect();
      const margin = 12;
      const left = Math.max(margin, Math.min(anchor.left, window.innerWidth - menu.width - margin));
      const below = anchor.bottom + 8;
      const top = below + menu.height <= window.innerHeight - margin
        ? below
        : Math.max(margin, anchor.top - menu.height - 8);
      panel.style.left = left + 'px';
      panel.style.top = top + 'px';
      panel.style.visibility = '';
    }

    function setOpen(open, focusButton) {
      panel.hidden = !open;
      button.classList.toggle('on', open);
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) positionMenu();
      else panel.style.visibility = '';
      if (focusButton) button.focus({ preventScroll: true });
    }
    button.addEventListener('click', function () { setOpen(panel.hidden); });
    panel.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false, true);
    });
    document.addEventListener('pointerdown', function (event) {
      if (!panel.hidden && !panel.contains(event.target) && !button.contains(event.target)) setOpen(false);
    });
    window.addEventListener('resize', positionMenu);
    window.addEventListener('scroll', positionMenu, true);
    setOpen(false);
    return function () { setOpen(false); };
  }

  function wireQuadPinch() {
    const grid = document.getElementById('annualGrid');
    const size = document.getElementById('qSize');
    if (!grid || !size) return;
    let startDistance = 0;
    let startSize = 100;
    let pinching = false;

    function distance(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    }
    grid.addEventListener('touchstart', function (event) {
      if (event.touches.length !== 2) return;
      startDistance = distance(event.touches);
      startSize = clampQuadSize(size.value);
      pinching = startDistance > 0;
    }, { passive: true });
    grid.addEventListener('touchmove', function (event) {
      if (!pinching || event.touches.length !== 2) return;
      event.preventDefault();
      const next = Math.round((startSize * distance(event.touches) / startDistance) / 5) * 5;
      applyQuadSize(next, false);
      alignQuadControls();
    }, { passive: false });
    grid.addEventListener('touchend', function (event) {
      if (!pinching || event.touches.length > 1) return;
      pinching = false;
      applyQuadSize(size.value, true);
    });
    grid.addEventListener('touchcancel', function () { pinching = false; });
  }

  window.syncSpreadLabel   = syncSpreadLabel;
  window.alignSpreadLabel  = alignSpreadLabel;
  window.alignQuadControls = alignQuadControls;

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('annualGrid')) return;
    wireDelegatedControls();
    wireQuadrationsMenu();
    wireQuadPinch();
    restoreQuadToggles();
    applyQuadSize(CardsStore.getQuadSize(), false);
    const spreadWrap = document.querySelector('.spread-wrap');
    if (spreadWrap && 'ResizeObserver' in window) {
      const spreadResizeObserver = new ResizeObserver(centerSpreadInViewport);
      spreadResizeObserver.observe(spreadWrap);
    }
    // Sync the endpoint label to whatever spread the spread-grid boot rendered.
    syncSpreadLabel((typeof quadAge === 'number' ? quadAge : 0) + 1);
    alignQuadControls();
    window.addEventListener('resize', function () {
      alignQuadControls();
      centerSpreadInViewport();
    });
  });
})();
