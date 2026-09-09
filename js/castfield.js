/* Floating card background. Uses spreadCardPips from cardsdata.js to share
 * the chart's pip geometry, corners and existing court artwork.
 * Requires window.MC_AMBIENT (ambient-motion.js).
 * Public API: window.CASTING_PULSE() triggers a ripple when motion is enabled.
 */
var CASTFIELD_SUIT_SVG = {
  '♠': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50,8 C30,26 6,50 6,66 C6,82 22,90 36,82 C42,78 47,74 50,70 L40,95 L60,95 L50,70 C53,74 58,78 64,82 C78,90 94,82 94,66 C94,50 70,26 50,8 Z"/></svg>',
  '♥': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50,86 C45,79 15,58 15,34 C15,22 24,14 35,14 C43,14 48,20 50,27 C52,20 57,14 65,14 C76,14 85,22 85,34 C85,58 55,79 50,86 Z"/></svg>',
  '♦': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50,6 L86,50 L50,94 L14,50 Z"/></svg>',
  '♣': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="30" r="20"/><circle cx="27" cy="58" r="20"/><circle cx="73" cy="58" r="20"/><path d="M44,46 L40,96 L60,96 L56,46 Z"/></svg>'
};

(function () {
  'use strict';
  var field = document.querySelector('.castfield-stage .field');
  if (!field) return;

  var STORE_KEY = 'castfield_state';
  var SCHEMA = 2;
  function readSaved() {
    try {
      var raw = sessionStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || s.v !== SCHEMA || !Array.isArray(s.minis)) return null;
      return s;
    } catch (e) { return null; }
  }
  var saved = readSaved();

  var TUNE = {

    COUNT_DESKTOP: 26,
    COUNT_MOBILE:  26,
    SWAP_INTERVAL: 12,
    ORBIT_SPEED: 0.65,
    ROTATION_SPEED: 0.35,
    R_MIN: 230,
    R_SPAN: 380,
    SHELLS: 3,
    W_INNER: 0.30,
    W_FALLOFF: 1.15,
    EASE_RATE: 1.2,
    BREATHE: 0.025,
    SWOOP_SHARE: 0.12,
    FLIP_SPEED_MULT: 1.25,
    MODE: 3,

    MAG_RADIUS: 190,
    MAG_PUSH: 85,
    MAG_ATTACK: 7,
    MAG_RELEASE: 2.5,

    RIPPLE_SPEED: 520,
    RIPPLE_BAND: 95,
    RIPPLE_PUSH: 90,
    RIPPLE_LIFE: 1.15,
    CAST_PULSE: 1.6,

    DEPTH_SCALE: 0.2
  };

  var SUITS = [
    { n: 'spades',   g: '♠' },
    { n: 'hearts',   g: '♥' },
    { n: 'diamonds', g: '♦' },
    { n: 'clubs',    g: '♣' }
  ];
  var COURTS = ['J', 'Q', 'K'];
  var NUMS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

  var ALL_RANKS = NUMS.concat(COURTS);
  function buildDeck() {
    var d = [];
    for (var si = 0; si < SUITS.length; si++)
      for (var ri = 0; ri < ALL_RANKS.length; ri++)
        d.push({ rank: ALL_RANKS[ri], suit: SUITS[si].n, sym: SUITS[si].g });
    for (var i = d.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0, t = d[i]; d[i] = d[j]; d[j] = t;
    }
    return d;
  }

  function buildFront(card) {
    var side = document.createElement('div');
    side.className = 'side front';
    var face = document.createElement('div');
    face.className = 'spread-card ' + card.suit;
    face.innerHTML = spreadCardPips(card);
    side.appendChild(face);
    return side;
  }
  function buildBack() {
    var side = document.createElement('div');
    side.className = 'side card-back';
    var coin = document.createElement('span');
    coin.className = 'cb-coin';
    side.appendChild(coin);
    return side;
  }

  function shellYaw(shell)  { return [0.0, 0.9, -0.9][shell % 3]; }
  function shellFlat(shell) { return [0.58, 0.66, 0.74][shell % 3]; }
  function shellDir(shell)  { return TUNE.MODE === 3 ? (shell % 2 ? -1 : 1) : 1; }

  var small = window.innerWidth < 640;
  var COUNT = small ? TUNE.COUNT_MOBILE : TUNE.COUNT_DESKTOP;
  var sUnit = small ? 0.66 : 1;

  var deck = buildDeck();
  var minis = [];

  function pick(s, key, fresh) { return s && (key in s) ? s[key] : fresh; }
  for (var i = 0; i < COUNT; i++) {
    var s_i = saved && saved.minis[i] || null;

    var card = s_i && s_i.rank && s_i.suit && s_i.sym
      ? { rank: s_i.rank, suit: s_i.suit, sym: s_i.sym }
      : deck[i % deck.length];

    var el = document.createElement('div');
    el.className = 'mini';
    var flip = document.createElement('div');
    flip.className = 'flip';
    var front = buildFront(card), back = buildBack();
    flip.appendChild(front); flip.appendChild(back);
    el.appendChild(flip);
    field.appendChild(el);

    var frac = i / COUNT;
    var rFresh = (TUNE.R_MIN + (frac + (Math.random() - 0.5) * 0.12) * TUNE.R_SPAN) * sUnit;
    rFresh = Math.max(TUNE.R_MIN * sUnit, rFresh);
    var r = pick(s_i, 'r', rFresh);
    var shell = pick(s_i, 'shell', Math.min(TUNE.SHELLS - 1, Math.floor(frac * TUNE.SHELLS)));
    var wBase = pick(s_i, 'wBase', TUNE.W_INNER / Math.pow(r / (TUNE.R_MIN * sUnit), TUNE.W_FALLOFF));
    minis.push({
      card: card,
      el: el, flip: flip, front: front, back: back,
      r: r, shell: shell, wBase: wBase,
      a: pick(s_i, 'a', Math.random() * Math.PI * 2),
      w: pick(s_i, 'w', 0),
      yaw: pick(s_i, 'yaw', shellYaw(shell)),
      flat: pick(s_i, 'flat', shellFlat(shell)),
      yawJit: pick(s_i, 'yawJit', (Math.random() - 0.5) * 0.25),
      rz: pick(s_i, 'rz', (110 + r * 0.28) * sUnit),
      bob: pick(s_i, 'bob', 4 + Math.random() * 7),
      bobPhase: pick(s_i, 'bobPhase', Math.random() * Math.PI * 2),
      tiltZ: pick(s_i, 'tiltZ', (Math.random() * 2 - 1) * 9),
      breathe: pick(s_i, 'breathe', Math.random() * Math.PI * 2),
      spinRate: pick(s_i, 'spinRate', (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 18)),
      spinPhase: pick(s_i, 'spinPhase', Math.random() * 360),
      ySpinRate: pick(s_i, 'ySpinRate', (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 10)),
      ySpinPhase: pick(s_i, 'ySpinPhase', Math.random() * 360),
      xSpinRate: pick(s_i, 'xSpinRate', (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 8)),
      xSpinPhase: pick(s_i, 'xSpinPhase', Math.random() * 360),

      mx: 0, my: 0,
      swooper: pick(s_i, 'swooper', Math.random() < TUNE.SWOOP_SHARE),

      type: pick(s_i, 'type', (Math.random() < 0.52 ? 'rocker' : Math.random() < 0.5 ? 'flip' : 'flick')),

      restBase: pick(s_i, 'restBase', (Math.random() < 0.5 ? 180 : 0)),
      amp: pick(s_i, 'amp', 22 + Math.random() * 30),
      flipSpeed: pick(s_i, 'flipSpeed', (0.6 + Math.random() * 0.7) * TUNE.FLIP_SPEED_MULT),
      flipRate: pick(s_i, 'flipRate', (0.10 + Math.random() * 0.13) * TUNE.FLIP_SPEED_MULT),
      flickRate: pick(s_i, 'flickRate', (0.05 + Math.random() * 0.06) * TUNE.FLIP_SPEED_MULT),
      diag: pick(s_i, 'diag', (Math.random() < 0.5 ? 1 : -1) * (45 + Math.random() * 10)),
      flickSpin: pick(s_i, 'flickSpin', 16 + Math.random() * 26),
      dir: pick(s_i, 'dir', Math.random() < 0.5 ? -1 : 1),
      flipPhase: pick(s_i, 'flipPhase', Math.random()),
      flipX: pick(s_i, 'flipX', Math.random() < 0.22),
      scale: pick(s_i, 'scale', 0.72 + Math.random() * 0.72)
    });
  }

  var visibleKeys = {};
  for (var mv = 0; mv < minis.length; mv++) {
    var c0 = minis[mv].card;
    visibleKeys[c0.rank + '_' + c0.suit] = 1;
  }
  var reserve = deck.filter(function (c) {
    return !visibleKeys[c.rank + '_' + c.suit];
  });

  function writeSaved() {
    try {
      var dump = minis.map(function (o) {
        return {
          rank: o.card.rank, suit: o.card.suit, sym: o.card.sym,
          r: o.r, shell: o.shell, wBase: o.wBase, w: o.w,
          a: o.a, yaw: o.yaw, yawJit: o.yawJit,
          flat: o.flat, rz: o.rz,
          bob: o.bob, bobPhase: o.bobPhase, tiltZ: o.tiltZ,
          spinRate: o.spinRate, spinPhase: o.spinPhase,
          ySpinRate: o.ySpinRate, ySpinPhase: o.ySpinPhase,
          xSpinRate: o.xSpinRate, xSpinPhase: o.xSpinPhase,
          breathe: o.breathe,
          type: o.type, restBase: o.restBase, amp: o.amp,
          flipSpeed: o.flipSpeed, flipRate: o.flipRate, flickRate: o.flickRate,
          diag: o.diag, flickSpin: o.flickSpin, dir: o.dir,
          flipPhase: o.flipPhase, flipX: o.flipX, scale: o.scale,
          swooper: o.swooper
        };
      });
      sessionStorage.setItem(STORE_KEY, JSON.stringify({ v: SCHEMA, minis: dump }));
    } catch (e) {  }
  }
  window.addEventListener('pagehide', writeSaved);

  function step(o, dt, t) {

    var target = o.wBase * shellDir(o.shell) * TUNE.ORBIT_SPEED;
    o.w += (target - o.w) * Math.min(1, dt * TUNE.EASE_RATE);

    var yawT = shellYaw(o.shell) + o.yawJit;
    o.yaw += (yawT - o.yaw) * Math.min(1, dt * TUNE.EASE_RATE * 0.6);

    o.a += o.w * dt;

    var tx = 0, ty = 0;
    var breathe = 1 + Math.sin(t * 0.23 + o.breathe) * TUNE.BREATHE;
    var ox = Math.cos(o.a) * o.r * breathe;
    var oy = Math.sin(o.a) * o.r * breathe * o.flat;
    if (pointer.on) {
      var dx = ox - pointer.x, dy = oy - pointer.y;
      var d = Math.hypot(dx, dy);
      if (d < TUNE.MAG_RADIUS * sUnit) {
        var fall = 1 - d / (TUNE.MAG_RADIUS * sUnit);
        var push = TUNE.MAG_PUSH * sUnit * fall * fall;
        if (d > 0.5) { tx += dx / d * push; ty += dy / d * push; }
      }
    }
    for (var ri = 0; ri < ripples.length; ri++) {
      var rp = ripples[ri];
      var age = t - rp.t0;
      var rdx = ox - rp.x, rdy = oy - rp.y;
      var rd = Math.hypot(rdx, rdy);
      var front = age * TUNE.RIPPLE_SPEED * sUnit;
      var band = Math.max(0, 1 - Math.abs(rd - front) / (TUNE.RIPPLE_BAND * sUnit));
      var fade = 1 - age / TUNE.RIPPLE_LIFE;
      if (band > 0 && fade > 0 && rd > 0.5) {
        var rpush = TUNE.RIPPLE_PUSH * sUnit * band * band * fade * (rp.mult || 1);
        tx += rdx / rd * rpush; ty += rdy / rd * rpush;
      }
    }

    var rate = (Math.abs(tx) + Math.abs(ty) > Math.abs(o.mx) + Math.abs(o.my))
      ? TUNE.MAG_ATTACK : TUNE.MAG_RELEASE;
    o.mx += (tx - o.mx) * Math.min(1, dt * rate);
    o.my += (ty - o.my) * Math.min(1, dt * rate);

    paint(o, t);
  }

  function paint(o, t) {
    var breathe = 1 + Math.sin(t * 0.23 + o.breathe) * TUNE.BREATHE;
    var r = o.r * breathe;
    var x = Math.cos(o.a) * r + o.mx;
    var y = Math.sin(o.a) * r * o.flat + Math.sin(t * 1.4 + o.bobPhase) * o.bob + o.my;
    var z = Math.sin(o.a + o.yaw) * o.rz;
    // Match the stage's 1200px perspective; allow for the full rotated card.
    var projection = 1200 / (1200 - z);
    var screenX = window.innerWidth * 0.5 + x * projection;
    var screenY = window.innerHeight * 0.47 + y * projection;
    var padding = 120 * o.scale * projection;
    var offscreen = screenX < -padding || screenX > window.innerWidth + padding ||
      screenY < -padding || screenY > window.innerHeight + padding;
    if (offscreen !== o.offscreen) {
      o.el.style.visibility = offscreen ? 'hidden' : 'visible';
      o.offscreen = offscreen;
    }
    if (offscreen) { o.frontHidden = true; return; }
    var depth = (z + o.rz) / (2 * o.rz);

    var rotationTime = t * TUNE.ROTATION_SPEED;
    var yRot = o.restBase + o.ySpinPhase + rotationTime * o.ySpinRate;
    var xRot = o.xSpinPhase + rotationTime * o.xSpinRate;
    o.flip.style.transform = 'rotateY(' + yRot.toFixed(1) + 'deg) rotateX(' + xRot.toFixed(1) + 'deg)';
    // Only swap deep into a back-facing turn, clear of edge-on perspective.
    o.frontHidden = Math.cos(yRot * Math.PI / 180) * Math.cos(xRot * Math.PI / 180) < -0.85;

    var rotZ = o.spinPhase + rotationTime * o.spinRate + Math.sin(rotationTime * 0.6 + o.bobPhase) * o.tiltZ;
    var scale = o.scale * (1 - TUNE.DEPTH_SCALE / 2 + depth * TUNE.DEPTH_SCALE);
    o.el.style.transform =
      'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px)' +
      ' scale(' + scale.toFixed(3) + ') rotateZ(' + rotZ.toFixed(1) + 'deg)';

    var opacity = (0.18 + depth * 0.26).toFixed(3);
    if (opacity !== o.opacity) { o.el.style.opacity = opacity; o.opacity = opacity; }

  }

  var pointer = { x: 0, y: 0, on: false };
  var ripples = [];
  function toField(cx, cy) {
    return { x: cx - window.innerWidth * 0.5, y: cy - window.innerHeight * 0.47 };
  }
  window.addEventListener('pointermove', function (e) {
    var p = toField(e.clientX, e.clientY);
    pointer.x = p.x; pointer.y = p.y; pointer.on = true;
  }, { passive: true });
  window.addEventListener('pointerdown', function (e) {
    var p = toField(e.clientX, e.clientY);
    pointer.x = p.x; pointer.y = p.y; pointer.on = true;
    if (e.pointerType !== 'mouse') {
      ripples.push({ x: p.x, y: p.y, t0: window.MC_AMBIENT.now() });
      if (ripples.length > 4) ripples.shift();
    }
  }, { passive: true });
  window.addEventListener('pointerup', function (e) {
    if (e.pointerType !== 'mouse') pointer.on = false;
  }, { passive: true });
  document.addEventListener('pointerleave', function () { pointer.on = false; });
  window.addEventListener('blur', function () { pointer.on = false; });

  window.CASTING_PULSE = function () {
    window.MC_AMBIENT.wake();
    ripples.push({ x: 0, y: 0, t0: window.MC_AMBIENT.now(), mult: TUNE.CAST_PULSE });
    if (ripples.length > 4) ripples.shift();
  };

  var last = null, lastSwap = 0;
  function frame(t) {
    if (!document.body.classList.contains('bg-enabled')) {
      last = null;
      return;
    }
    var dt = last === null ? 0 : Math.min(0.05, t - last);
    last = t;

    for (var k = ripples.length - 1; k >= 0; k--)
      if (t - ripples[k].t0 > TUNE.RIPPLE_LIFE) ripples.splice(k, 1);

    for (var i = 0; i < minis.length; i++) step(minis[i], dt, t);

    if (reserve.length && t - lastSwap >= TUNE.SWAP_INTERVAL) {
      var hiddenMinis = minis.filter(function (o) { return o.frontHidden; });
      if (hiddenMinis.length) {
        lastSwap = t;
        var m = hiddenMinis[(Math.random() * hiddenMinis.length) | 0];
        var ri = (Math.random() * reserve.length) | 0;
        var incoming = reserve[ri];
        reserve[ri] = m.card;
        m.card = incoming;
        var newFront = buildFront(incoming);
        m.flip.replaceChild(newFront, m.front);
        m.front = newFront;
      }
    }

  }
  window.MC_AMBIENT.subscribe(frame);
  window.addEventListener('mc-bg-toggle', function (e) {
    last = null;
    if (e && e.detail && e.detail.enabled) window.MC_AMBIENT.wake();
  });
  window.addEventListener('resize', function () {
    minis.forEach(function (o) { paint(o, window.MC_AMBIENT.now()); });
  }, { passive: true });
})();
