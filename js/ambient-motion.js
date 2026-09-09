/* Shared decorative animation clock. Loaded before stars.js and castfield.js.
 * Public API: window.MC_AMBIENT.subscribe(paint), .wake(), .now() (seconds).
 * Stops scheduling entirely while idle, hidden, unfocused or reduced-motion.
 */
(function () {
  'use strict';
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var callbacks = [], raf = null, timer = null;
  var last = null, elapsed = 0, activeUntil = 0;
  var focused = document.hasFocus();
  var INTERVAL = 1000 / 30, IDLE_MS = 30000;

  function allowed() {
    return focused && !document.hidden && !motion.matches && performance.now() < activeUntil;
  }
  function stop() {
    if (raf !== null) cancelAnimationFrame(raf);
    if (timer !== null) clearTimeout(timer);
    raf = timer = last = null;
  }
  function frame(ts) {
    raf = null;
    if (!allowed()) { stop(); return; }
    if (last !== null) elapsed += Math.min(0.05, (ts - last) / 1000);
    last = ts;
    callbacks.forEach(function (paint) { paint(elapsed); });
    // Sleep between paints instead of waking on every display refresh.
    timer = setTimeout(function () {
      timer = null;
      if (allowed()) raf = requestAnimationFrame(frame);
      else stop();
    }, Math.max(0, INTERVAL - (performance.now() - ts) - 2));
  }
  function wake() {
    activeUntil = performance.now() + IDLE_MS;
    if (allowed() && callbacks.length && raf === null && timer === null) {
      last = null;
      raf = requestAnimationFrame(frame);
    }
  }
  window.MC_AMBIENT = {
    subscribe: function (paint) { callbacks.push(paint); paint(elapsed); wake(); },
    wake: wake,
    now: function () { return elapsed; }
  };
  ['pointermove', 'pointerdown', 'keydown', 'scroll'].forEach(function (name) {
    window.addEventListener(name, wake, { passive: true });
  });
  window.addEventListener('blur', function () { focused = false; stop(); });
  window.addEventListener('focus', function () { focused = true; wake(); });
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', function () { focused = document.hasFocus(); wake(); });
  document.addEventListener('visibilitychange', function () {
    focused = document.hasFocus();
    if (document.hidden) stop(); else wake();
  });
  motion.addEventListener('change', function () { if (motion.matches) stop(); else wake(); });
})();
