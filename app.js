/* ============================================================
   WillYouDateMe
   All copy lives in content.json. This file is behaviour only.
   ============================================================ */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const pad2 = (n) => String(n).padStart(2, '0');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));

/* >>> FALLBACK-CONTENT — generated from content.json by build.py, do not edit */
const FALLBACK = {
  "_readme": "Every word in the app lives here. Edit, save, reload..",
  "note": {
    "lines": [
      "Hey little fairy,",
      "I like spending time with you,",
      "let's go on a date"
    ],
    "signature": "— Simo"
  },
  "buttons": {
    "yes": "Yes",
    "no": "No"
  },
  "refusals": [
    "No",
    "Nope",
    "Not this one",
    "Try again",
    "Almost!",
    "Nice try",
    "Hmm no",
    "Catch me",
    "Nah",
    "Still no",
    "You sure?",
    "Give up?"
  ],
  "nudges": [
    "",
    "",
    "the no button is shy.",
    "",
    "it really does not want to be pressed.",
    "",
    "",
    "you can stop chasing it, you know.",
    "",
    "it is getting smaller. take the hint."
  ],
  "nickname": {
    "label": "What nickname did you give me?",
    "placeholder": "you know the one",
    "answer": "Mo",
    "hint": "The nickname first.",
    "wrongTitle": "You're not Tati!",
    "wrongBody": "Go away you harlot! Shoo shoo! 😝",
    "dismiss": "oops — let me try again"
  },
  "sound": {
    "track": "bunnyhop.mp3",
    "volume": 0.2,
    "defaultOn": true,
    "onTitle": "Sound on",
    "offTitle": "Sound off"
  },
  "plan": {
    "title": "So — when?",
    "subtitle": "Four small things and it's official.",
    "messageLabel": "Say something back",
    "messagePlaceholder": "Anything you want. Or nothing at all.",
    "dayLabel": "Pick a day",
    "timeLabel": "Pick a time",
    "otherTime": "Other",
    "customTimeLabel": "Your time",
    "confirm": "Confirm",
    "sendingLabel": "Sending…",
    "emptyHint": "Pick a day and a time.",
    "dayOnlyHint": "Now a time.",
    "tomorrow": "Tmrw",
    "daysAhead": 31
  },
  "times": [
    {
      "time": "10:00",
      "label": "coffee"
    },
    {
      "time": "12:30",
      "label": "lunch"
    },
    {
      "time": "15:00",
      "label": "a walk"
    },
    {
      "time": "18:30",
      "label": "golden hour"
    },
    {
      "time": "20:00",
      "label": "dinner"
    },
    {
      "time": "22:00",
      "label": "stargazing"
    }
  ],
  "secret": {
    "enabled": false,
    "latch": "🔩",
    "latchLabel": "There is one more thing you could pick",
    "activity": "come build furniture",
    "sub": "allen key included",
    "unpicked": "the boring way"
  },
  "done": {
    "heartLines": [
      "yes",
      "♡"
    ],
    "title": "It's a *date.*",
    "whenLabel": "When",
    "whatLabel": "What",
    "noteLabel": "You said",
    "codeLabel": "Your code",
    "codeHint": "keep this to change the plan later",
    "fallbackActivity": "just the two of you",
    "sending": "Sending the note…",
    "sent": "The note is on its way",
    "mockNote": "(mocked — logged to the console)",
    "failed": "The note did not get through",
    "again": "start over"
  },
  "calendar": {
    "button": "Add to calendar",
    "glyph": "🌷",
    "title": "It's a date ♡",
    "durationMinutes": 90,
    "filename": "its-a-date.ics",
    "noteLabel": "They said:",
    "codeLabel": "Date code"
  },
  "edit": {
    "glyph": "🖊",
    "openLabel": "Change a plan you already made",
    "title": "Change the plan",
    "body": "The code from your note, and the nickname.",
    "codeLabel": "Code",
    "codePlaceholder": "000",
    "nickLabel": "Nickname",
    "nickPlaceholder": "you know the one",
    "unlock": "Open it",
    "cancel": "never mind",
    "notFound": "Nothing matches that code and nickname.",
    "trouble": "Could not reach it. Try again in a moment.",
    "stale": "This plan changed while you had it open. Open it again.",
    "expired": "That took a while — open it again.",
    "confirmEdit": "Save the change"
  },
  "api": {
    "_comment": "The Cloudflare Worker that stores the plans. Public by nature — the nickname is checked on its side, not here.",
    "base": "https://willyoudateme-api.simo-hakim.workers.dev"
  },
  "email": {
    "recipient": "herbrax212@gmail.com",
    "endpoint": null,
    "emailjs": {
      "publicKey": "GBk_Bz7_Q8cZU6TcT",
      "serviceId": "service_hzaatpy",
      "templateId": "template_ih5vxot"
    },
    "fromName": "Hey Little Fairy",
    "subjectPrefix": "It's a date",
    "subjectPrefixEdited": "Plan changed",
    "opening": "They said yes.",
    "openingEdited": "They changed the plan.",
    "codeLabel": "Code",
    "noteLabel": "Their note:",
    "signoff": "— sent from the heart-shaped post-it"
  }
};
/* <<< FALLBACK-CONTENT */

/* Deep-merge so a half-finished content.json can never blank the page. */
function merge(base, over) {
  if (Array.isArray(over)) return over.slice();
  if (over && typeof over === 'object' && !Array.isArray(base)) {
    const out = { ...base };
    for (const k of Object.keys(over)) out[k] = merge(base?.[k], over[k]);
    return out;
  }
  return over === undefined ? base : over;
}

function loadContent() {
  // build.py compiles content.json into FALLBACK above, and into the
  // window.__CONTENT__ block of the single-file build in dist/. Nothing is
  // fetched, so file://, GitHub Pages and the custom domain all behave alike.
  return merge(FALLBACK, window.__CONTENT__ || {});
}

/* ── flowers & hearts ─────────────────────────────────────── */

const Fx = (() => {
  const canvas = $('#fx');
  const ctx = canvas.getContext('2d');
  const FLOWERS = ['🌸', '🌷', '🌼', '🌺', '💐', '🌹'];
  const HEARTS  = ['💖', '💗', '💞', '💘', '❤️'];
  const ALL = [...FLOWERS, ...HEARTS];

  let W = 0, H = 0, dpr = 1;
  const parts = [];
  let last = performance.now();
  let ambientAt = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const pick = (a) => a[(Math.random() * a.length) | 0];
  const cap = window.innerWidth < 520 ? 320 : 700;

  function spawn(o) {
    parts.push({
      x: o.x, y: o.y, vx: o.vx, vy: o.vy,
      g: o.g ?? 0.035,
      drag: o.drag ?? 0.992,
      size: o.size ?? 14 + Math.random() * 18,
      char: o.char ?? pick(ALL),
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.09,
      sway: 0.6 + Math.random() * 1.6,
      swayAmp: o.swayAmp ?? 0.35,
      seed: Math.random() * 100,
      life: o.life ?? 1,
      fade: o.fade ?? 0.0016,
      alpha: o.alpha ?? 1,
    });
    if (parts.length > cap) parts.splice(0, parts.length - cap);
  }

  function burst(x, y, n = 40, pool = ALL) {
    const k = window.innerWidth < 520 ? 0.65 : 1;
    for (let i = 0; i < n * k; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 3 + Math.random() * 11;
      spawn({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 3,
        g: 0.14, drag: 0.965,
        size: 15 + Math.random() * 21,
        char: pick(pool),
        fade: 0.004,
      });
    }
  }

  // Flowers only, thrown upward in a fan rather than a sphere, so it reads as
  // a bouquet opening out of the button instead of an explosion.
  function bloom(x, y, n = 30) {
    const k = window.innerWidth < 520 ? 0.7 : 1;
    for (let i = 0; i < n * k; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.1;
      const sp = 4 + Math.random() * 9;
      spawn({
        x: x + (Math.random() - 0.5) * 40, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        g: 0.11, drag: 0.972,
        size: 13 + Math.random() * 18,
        char: pick(FLOWERS),
        swayAmp: 0.7, fade: 0.0026,
      });
    }
  }

  function rain(duration = 4200) {
    const started = performance.now();
    const per = window.innerWidth < 520 ? 2 : 3;
    (function tick() {
      if (performance.now() - started > duration) return;
      for (let i = 0; i < per; i++) {
        spawn({
          x: Math.random() * W, y: -40,
          vx: (Math.random() - 0.5) * 1.4,
          vy: 1 + Math.random() * 2.4,
          g: 0.012, drag: 0.999,
          size: 14 + Math.random() * 21,
          swayAmp: 0.9, fade: 0.0008,
        });
      }
      requestAnimationFrame(tick);
    })();
  }

  function celebrate() {
    if (reduced) { burst(W / 2, H * 0.42, 24); return; }
    burst(W / 2, H * 0.46, 90);
    setTimeout(() => burst(W * 0.18, H * 0.55, 45), 160);
    setTimeout(() => burst(W * 0.82, H * 0.55, 45), 300);
    setTimeout(() => burst(W * 0.5,  H * 0.28, 55), 460);
    rain();
  }

  function frame(now) {
    const dt = Math.min(32, now - last);
    last = now;
    ctx.clearRect(0, 0, W, H);

    if (!reduced && now - ambientAt > 1400 && parts.length < 40) {
      ambientAt = now;
      spawn({
        x: Math.random() * W, y: -30,
        vx: (Math.random() - 0.5) * 0.6, vy: 0.4 + Math.random() * 0.7,
        g: 0.004, drag: 1,
        size: 12 + Math.random() * 12,
        char: pick(FLOWERS),
        swayAmp: 0.8, alpha: 0.42, fade: 0.0004,
      });
    }

    const k = dt / 16.67;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy += p.g * k;
      p.vx *= p.drag; p.vy *= p.drag;
      p.x += (p.vx + Math.sin((now / 700) * p.sway + p.seed) * p.swayAmp) * k;
      p.y += p.vy * k;
      p.rot += p.vr * k;
      p.life -= p.fade * dt;

      if (p.life <= 0 || p.y > H + 70 || p.x < -140 || p.x > W + 140) {
        parts.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = clamp(p.life, 0, 1) * p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.font = `${p.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.char, 0, 0);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return { burst, bloom, celebrate };
})();

/* ── a little sound ───────────────────────────────────────── */

const Sound = (() => {
  let on = false;
  let actx = null;
  let cfg = {};
  const btn = $('#soundToggle');
  const music = $('#music');

  const ensure = () => {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  };

  function tone(freq, delay = 0, dur = 0.35, type = 'sine', gain = 0.05) {
    if (!on) return;
    const a = ensure();
    const t = a.currentTime + delay;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(a.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  const paint = () => {
    btn.setAttribute('aria-pressed', String(on));
    btn.title = on ? cfg.onTitle : cfg.offTitle;
  };

  const play = () => (on && music.src ? music.play() : Promise.resolve());

  // Browsers grant user activation when a gesture *completes* — pointerup,
  // click, touchend, keyup — not when it starts, and the No button's
  // pointerdown handler calls preventDefault(), which suppresses activation
  // for taps that land on it. So listen wide, listen on the capture phase so
  // nothing downstream can swallow the event, and keep listening until a
  // play() actually resolves rather than assuming the first try took.
  const GESTURES = ['pointerup', 'click', 'touchend', 'keyup', 'pointerdown', 'keydown'];

  function armUnlock() {
    const disarm = () => GESTURES.forEach((ev) => window.removeEventListener(ev, unlock, true));
    function unlock() {
      if (!on) { disarm(); return; }
      play().then(disarm).catch(() => {});   // still refused — wait for the next one
    }
    GESTURES.forEach((ev) => window.addEventListener(ev, unlock, true));
  }

  function init(sound) {
    cfg = sound;
    music.src = sound.track;
    music.loop = true;
    music.volume = clamp(sound.volume ?? 0.2, 0, 1);
    on = Boolean(sound.defaultOn);
    paint();
    if (on) play().catch(armUnlock);
  }

  btn.addEventListener('click', () => {
    on = !on;
    paint();
    if (on) { ensure(); play().catch(armUnlock); tone(880, 0, 0.18, 'triangle', 0.04); }
    else music.pause();          // pause, not stop: it picks up where it left off
  });

  return {
    init,
    blip: () => tone(720 + Math.random() * 240, 0, 0.09, 'triangle', 0.03),
    yay:  () => [659.25, 987.77].forEach((f, i) => tone(f, i * 0.08, 0.3, 'sine', 0.05)),
    chime: () => [523.25, 659.25, 783.99, 1046.5, 1318.5]
      .forEach((f, i) => tone(f, i * 0.1, 0.75, 'sine', 0.045)),
  };
})();

/* ── the app ──────────────────────────────────────────────── */

(function start() {
  const C = loadContent();
  Sound.init(C.sound);
  const state = { nick: '', message: '', day: null, time: null, label: null, furniture: false };

  const scenes = { ask: $('#sceneAsk'), plan: $('#scenePlan'), done: $('#sceneDone') };
  const setScene = (name) => {
    for (const [key, el] of Object.entries(scenes)) {
      const on = key === name;
      el.classList.toggle('is-active', on);
      el.hidden = !on;
    }
    // The credit line is pinned to the bottom of the window, so it only works
    // while the scene is short enough not to reach it. CSS reads this.
    document.body.dataset.scene = name;
  };

  /* ── copy from content.json ─────────────────────────────── */

  $('#noteText').innerHTML = C.note.lines.map((l) => `<span>${esc(l)}</span>`).join('');
  $('#noteSign').textContent = C.note.signature || '';
  $('#yesBtn').textContent = C.buttons.yes;
  $('#noBtn').textContent = C.buttons.no;

  $('#planTitle').textContent = C.plan.title;
  $('#planSub').textContent = C.plan.subtitle;
  $('#lblNick').textContent = C.nickname.label;
  $('#nickname').placeholder = C.nickname.placeholder;
  $('#lblMessage').textContent = C.plan.messageLabel;
  $('#message').placeholder = C.plan.messagePlaceholder;
  $('#lblDay').textContent = C.plan.dayLabel;
  $('#days').setAttribute('aria-label', C.plan.dayLabel);
  $('#lblTime').textContent = C.plan.timeLabel;
  $('#times').setAttribute('aria-label', C.plan.timeLabel);
  $('#lblCustom').textContent = C.plan.customTimeLabel;
  $('#confirmBtn').textContent = C.plan.confirm;

  $('#lblCode').textContent = C.done.codeLabel;
  $('#lblCodeHint').textContent = C.done.codeHint;
  $('#secretGlyph').textContent = C.secret.latch;
  $('#lblSecretLatch').textContent = C.secret.latchLabel;
  $('#lblSecret').textContent = C.secret.activity;
  $('#lblSecretSub').textContent = C.secret.sub;

  $('#editGlyph').textContent = C.edit.glyph;
  $('#unlockGlyph').textContent = C.edit.glyph;
  $('#lblEditOpen').textContent = C.edit.openLabel;
  $('#editOpen').title = C.edit.openLabel;
  $('#unlockTitle').textContent = C.edit.title;
  $('#unlockBody').textContent = C.edit.body;
  $('#lblUnlockCode').textContent = C.edit.codeLabel;
  $('#unlockCode').placeholder = C.edit.codePlaceholder;
  $('#lblUnlockNick').textContent = C.edit.nickLabel;
  $('#unlockNick').placeholder = C.edit.nickPlaceholder;
  $('#unlockBtn').textContent = C.edit.unlock;
  $('#unlockCancel').textContent = C.edit.cancel;

  $('#shooTitle').textContent = C.nickname.wrongTitle;
  $('#shooBody').textContent = C.nickname.wrongBody;
  $('#shooBtn').textContent = C.nickname.dismiss;

  $('#doneHeart').innerHTML = C.done.heartLines.map((l) => `<span>${esc(l)}</span>`).join('');
  // "It's a *date.*" — the starred part is set in italic
  $('#doneTitle').innerHTML = esc(C.done.title).replace(/\*(.+?)\*/g, '<em>$1</em>');
  $('#lblWhen').textContent = C.done.whenLabel;
  $('#lblWhat').textContent = C.done.whatLabel;
  $('#lblNote').textContent = C.done.noteLabel;
  $('#againBtn').textContent = C.done.again;

  const sendingHTML = `<span class="dot" aria-hidden="true"></span> ${esc(C.done.sending)}`;
  $('#mailStatus').innerHTML = sendingHTML;

  /* ── the "no" button, which will not be pressed ──────────── */

  const noBtn  = $('#noBtn');
  const noSlot = $('#noSlot');
  const yesBtn = $('#yesBtn');
  const hint   = $('#hint');

  let dx = 0, dy = 0, tilt = 0, escapes = 0, lastMove = 0;

  // The slot keeps the button's home position: transforms never move it.
  const home = () => {
    const r = noSlot.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, r };
  };

  function limits(h) {
    const pad = 12;
    return {
      minX: pad - h.r.left,
      maxX: window.innerWidth - pad - h.r.right,
      minY: pad - h.r.top,
      maxY: window.innerHeight - pad - h.r.bottom,
    };
  }

  function paint() {
    const scale = clamp(1 - escapes * 0.035, 0.58, 1);
    noBtn.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${tilt.toFixed(1)}deg) scale(${scale})`;
  }

  function escaped() {
    escapes += 1;
    noBtn.textContent = C.refusals[Math.min(escapes, C.refusals.length - 1)];
    yesBtn.style.setProperty('--yes-scale', clamp(1 + escapes * 0.045, 1, 1.4));
    const nudge = C.nudges[Math.min(escapes - 1, C.nudges.length - 1)];
    if (nudge) { hint.textContent = nudge; hint.classList.add('is-on'); }
    Sound.blip();
  }

  // Cornered? Take a longer jump to the emptiest spot we can find.
  function hop(px, py) {
    const h = home(), lim = limits(h);
    let best = { x: dx, y: dy }, bestD = -1;
    for (let i = 0; i < 12; i++) {
      const nx = lim.minX + Math.random() * (lim.maxX - lim.minX);
      const ny = lim.minY + Math.random() * (lim.maxY - lim.minY);
      const d = Math.hypot(h.x + nx - px, h.y + ny - py);
      if (d > bestD) { bestD = d; best = { x: nx, y: ny }; }
    }
    tilt = (Math.random() * 24 - 12);
    dx = best.x; dy = best.y;
    paint();
  }

  // Ordinary case: shove it directly away from the cursor, a short hop
  // at a time, so it scoots around the screen instead of teleporting.
  function repel(px, py, force = false) {
    const now = performance.now();
    if (now - lastMove < 70) return;

    const h = home();
    const cx = h.x + dx, cy = h.y + dy;
    const gap = Math.hypot(cx - px, cy - py);
    const reach = Math.max(h.w, h.h) * 0.7 + 60;
    if (!force && gap > reach) return;

    lastMove = now;
    const lim = limits(h);
    const angle = Math.atan2(cy - py, cx - px) + (Math.random() - 0.5) * 1.0;
    const push = (reach - Math.min(gap, reach)) * 1.2 + 80 + Math.random() * 70;

    const wantX = dx + Math.cos(angle) * push;
    const wantY = dy + Math.sin(angle) * push;
    const nx = clamp(wantX, lim.minX, lim.maxX);
    const ny = clamp(wantY, lim.minY, lim.maxY);

    // Pinned against an edge with nowhere to slide — jump instead.
    if (Math.hypot(nx - dx, ny - dy) < push * 0.45) { hop(px, py); escaped(); return; }

    tilt = clamp((nx - dx) * 0.09, -16, 16);
    dx = nx; dy = ny;
    paint();
    escaped();
  }

  window.addEventListener('pointermove', (e) => {
    if (scenes.ask.hidden) return;
    repel(e.clientX, e.clientY);
  }, { passive: true });

  // No hover on a phone: the escape has to happen on touch-down,
  // before the tap can land.
  noBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    repel(e.clientX, e.clientY, true);
  });
  noBtn.addEventListener('click', (e) => { e.preventDefault(); hop(-200, -200); escaped(); });
  noBtn.addEventListener('focus', () => { hop(-200, -200); escaped(); });

  window.addEventListener('resize', () => {
    if (!escapes) return;
    const lim = limits(home());
    dx = clamp(dx, lim.minX, lim.maxX);
    dy = clamp(dy, lim.minY, lim.maxY);
    paint();
  });

  function resetNo() {
    escapes = 0; dx = 0; dy = 0; tilt = 0;
    noBtn.style.transform = '';
    noBtn.textContent = C.buttons.no;
    yesBtn.style.removeProperty('--yes-scale');
    hint.textContent = '';
    hint.classList.remove('is-on');
  }

  /* ── yes ────────────────────────────────────────────────── */

  yesBtn.addEventListener('click', () => {
    const r = yesBtn.getBoundingClientRect();
    Fx.burst(r.left + r.width / 2, r.top + r.height / 2, reduced ? 14 : 46);
    Sound.yay();
    resetNo();
    setScene('plan');
    window.scrollTo({ top: 0 });
  });

  /* ── the plan ───────────────────────────────────────────── */

  const daysEl = $('#days');
  const timesEl = $('#times');
  const summary = $('#summary');
  const confirmBtn = $('#confirmBtn');
  const message = $('#message');
  const count = $('#count');

  (function buildDays() {
    const today = new Date();
    const dow = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
    const mon = new Intl.DateTimeFormat(undefined, { month: 'short' });

    for (let i = 1; i <= (C.plan.daysAhead || 12); i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'day';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.dataset.iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      btn.innerHTML =
        `<span class="day__dow">${i === 1 ? esc(C.plan.tomorrow) : dow.format(d)}</span>` +
        `<span class="day__num">${d.getDate()}</span>` +
        `<span class="day__mon">${mon.format(d)}</span>`;
      btn.addEventListener('click', () => {
        $$('.day', daysEl).forEach((b) => b.setAttribute('aria-checked', 'false'));
        btn.setAttribute('aria-checked', 'true');
        state.day = btn.dataset.iso;
        btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        Sound.blip();
        refresh();
      });
      daysEl.append(btn);
    }
  })();

  (function buildTimes() {
    const make = (headline, value, sub) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'time';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.innerHTML = `<b>${esc(headline)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}`;
      if (sub) btn.dataset.label = sub;
      btn.addEventListener('click', () => {
        $$('.time', timesEl).forEach((b) => b.setAttribute('aria-checked', 'false'));
        btn.setAttribute('aria-checked', 'true');
        const custom = value === 'custom';
        $('#customWrap').hidden = !custom;
        state.time = custom ? $('#customTime').value : value;
        if (!state.furniture) state.label = custom ? null : (sub || null);
        Sound.blip();
        refresh();
      });
      timesEl.append(btn);
    };
    C.times.forEach((s) => make(s.time, s.time, s.label));
    make(C.plan.otherTime, 'custom', '');
  })();

  $('#customTime').addEventListener('input', (e) => { state.time = e.target.value; refresh(); });

  const nickname = $('#nickname');
  const shoo = $('#shoo');
  const normalise = (v) => v.trim().toLowerCase();
  const nickOk = () => normalise(nickname.value) === normalise(C.nickname.answer);

  nickname.addEventListener('input', () => {
    state.nick = nickname.value.trim();
    nickname.closest('.field').classList.remove('has-error');
    refresh();
  });

  /* ── changing a plan already made ───────────────────────── */

  const unlockBox = $('#unlock');
  const unlockCode = $('#unlockCode');
  const unlockNick = $('#unlockNick');
  const unlockError = $('#unlockError');
  const unlockBtn = $('#unlockBtn');

  // Holds { id, token } while a stored plan is open for changes, and is null
  // the rest of the time. Confirm reads it to decide which way to send.
  let editing = null;

  function openUnlock() {
    unlockError.textContent = '';
    unlockCode.value = '';
    unlockNick.value = '';
    unlockBox.hidden = false;
    requestAnimationFrame(() => unlockBox.classList.add('is-on'));
    unlockCode.focus();
  }

  function closeUnlock() {
    unlockBox.classList.remove('is-on');
    setTimeout(() => { unlockBox.hidden = true; }, 180);
  }

  $('#editOpen').addEventListener('click', () => { Sound.blip(); openUnlock(); });
  $('#unlockCancel').addEventListener('click', closeUnlock);
  unlockBox.addEventListener('click', (e) => { if (e.target === unlockBox) closeUnlock(); });

  $('#unlockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!(C.api && C.api.base)) return;

    unlockBtn.disabled = true;
    unlockError.textContent = '';
    try {
      const res = await fetch(`${C.api.base}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: unlockCode.value.trim(), nickname: unlockNick.value.trim() }),
      });
      // The worker answers 404 for a wrong code and a wrong nickname alike, so
      // this cannot be used to find out which codes exist.
      if (res.status === 404) { unlockError.textContent = C.edit.notFound; return; }
      if (!res.ok) { unlockError.textContent = C.edit.trouble; return; }

      const { id, date, token } = await res.json();
      editing = { id, token };
      fillPlan(date, unlockNick.value.trim());
      closeUnlock();
      setScene('plan');
      window.scrollTo({ top: 0 });
      Sound.blip();
    } catch {
      unlockError.textContent = C.edit.trouble;
    } finally {
      unlockBtn.disabled = false;
    }
  });

  // Puts a stored plan back into the form it was made with.
  function fillPlan(date, nick) {
    state.nick = nick;
    nickname.value = nick;
    nickname.closest('.field').classList.remove('has-error');

    state.message = date.message || '';
    message.value = state.message;
    count.textContent = String(state.message.length);

    state.day = date.dayISO || null;
    $$('.day', daysEl).forEach((b) => {
      const on = Boolean(state.day) && b.dataset.iso === state.day;
      b.setAttribute('aria-checked', String(on));
      if (on) b.scrollIntoView({ block: 'nearest', inline: 'center' });
    });

    state.time = date.timeISO || null;
    state.label = date.label || null;
    const chips = $$('.time', timesEl);
    chips.forEach((b) => b.setAttribute('aria-checked', 'false'));
    const match = chips.find((b) => b.querySelector('b').textContent === state.time);
    if (match) {
      match.setAttribute('aria-checked', 'true');
      $('#customWrap').hidden = true;
    } else if (state.time) {
      // A time none of the chips offer — the custom field is where it belongs.
      chips[chips.length - 1].setAttribute('aria-checked', 'true');
      $('#customWrap').hidden = false;
      $('#customTime').value = state.time;
    }

    confirmBtn.textContent = C.edit.confirmEdit;
    refresh();
  }

  function stopEditing() {
    editing = null;
    confirmBtn.textContent = C.plan.confirm;
  }

  function openShoo() {
    const field = nickname.closest('.field');
    field.classList.remove('has-error');
    void field.offsetWidth;          // restart the shake on a second wrong guess
    field.classList.add('has-error');
    shoo.hidden = false;
    // Wait a frame so the transition has a state to animate away from.
    requestAnimationFrame(() => shoo.classList.add('is-on'));
    $('#shooBtn').focus();
  }

  function closeShoo() {
    shoo.classList.remove('is-on');
    setTimeout(() => { shoo.hidden = true; }, 220);
    nickname.focus();
    nickname.select();
  }

  $('#shooBtn').addEventListener('click', closeShoo);
  shoo.addEventListener('click', (e) => { if (e.target === shoo) closeShoo(); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !shoo.hidden) closeShoo();
  });

  /* ── the option that does not advertise itself ───────────── */

  const secretLatch = $('#secretLatch');
  const secretChip  = $('#secretChip');

  // Switched off from content.json rather than torn out: the screw is hidden
  // and nothing is wired, but the markup, the styles and the copy all stay
  // where they are. Set secret.enabled back to true to bring it back.
  if (C.secret.enabled === false) {
    $('.secret').hidden = true;
  } else {
    secretLatch.addEventListener('click', () => {
      secretChip.hidden = false;
      secretLatch.setAttribute('aria-expanded', 'true');
      secretLatch.classList.add('is-open');
      Sound.blip();
      secretChip.focus();
    });

    secretChip.addEventListener('click', () => {
      state.furniture = !state.furniture;
      secretChip.setAttribute('aria-checked', String(state.furniture));
      // The time chips own the label the rest of the time; while furniture is
      // on it wins, and switching it off hands the label back.
      state.label = state.furniture
        ? C.secret.activity
        : ($$('.time[aria-checked="true"]', timesEl)[0]?.dataset.label || null);
      Sound.blip();
      refresh();
    });
  }

  message.addEventListener('input', () => {
    state.message = message.value.trim();
    count.textContent = message.value.length;
  });

  function prettyWhen() {
    if (!state.day || !state.time) return null;
    const [y, m, d] = state.day.split('-').map(Number);
    const [hh, mm] = state.time.split(':').map(Number);
    const dt = new Date(y, m - 1, d, hh, mm);
    return {
      dt,
      day: new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(dt),
      time: new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(dt),
      get text() { return `${this.day} at ${this.time}`; },
    };
  }

  function refresh() {
    const when = prettyWhen();
    const ready = Boolean(when) && state.nick.length > 0;
    confirmBtn.disabled = !ready;
    // Any change clears a failed-save message rather than leaving it red.
    summary.classList.remove('is-error');
    summary.classList.toggle('is-set', Boolean(when));
    summary.textContent = when
      ? `${when.text}${state.label ? ` — ${state.label}` : ''}`
      : (state.day ? C.plan.dayOnlyHint : C.plan.emptyHint);
    if (when && !state.nick) summary.textContent = C.nickname.hint;
  }

  /* ── confirm → mock email ───────────────────────────────── */

  /* ── storing the plan ───────────────────────────────────── */

  // The Worker keeps the plan and hands back the code she needs to change it
  // later. The nickname is checked on its side — the check in this file is
  // only there to be rude quickly, and decides nothing.
  // day/time are the words she'd read; dayISO/timeISO are the same moment in a
  // form the pickers can be put back to when the plan is opened again.
  const planBody = (when) => ({
    day: when.day,
    time: when.time,
    dayISO: state.day,
    timeISO: state.time,
    message: state.message,
    label: state.label || C.done.fallbackActivity,
  });

  async function saveDate(when) {
    const base = C.api && C.api.base;
    if (!base) return null;

    const res = await fetch(`${base}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: state.nick, date: planBody(when) }),
    });
    if (!res.ok) throw new Error(`the worker replied ${res.status}`);
    return res.json();
  }

  // Unlike saving a new plan, this one is not allowed to fail quietly: if it
  // does not land, she must not be shown a receipt saying it did.
  async function saveEdit(when) {
    const res = await fetch(`${C.api.base}/date`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: editing.token, date: planBody(when) }),
    });
    if (res.status === 409) throw new Error(C.edit.stale);
    if (res.status === 401) throw new Error(C.edit.expired);
    if (!res.ok) throw new Error(C.edit.trouble);
    return res.json();
  }

  async function sendDateRequest(payload) {
    if (C.email.endpoint) {
      const res = await fetch(C.email.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Mail service replied ${res.status}`);
      return res.json();
    }

    // ── EmailJS ─────────────────────────────────────────────
    // Same account and template as simohakim.com, so the four fields the
    // template knows about — from_name, email_id, subject, message — are
    // what the date has to be poured into. to_email rides along for the
    // template's To field if it is set to a variable.
    const E = C.email.emailjs || {};
    if (E.publicKey && E.serviceId && E.templateId && typeof emailjs !== 'undefined') {
      emailjs.init({ publicKey: E.publicKey });
      await emailjs.send(E.serviceId, E.templateId, {
        from_name: payload.from,
        email_id: payload.to,
        to_email: payload.to,
        reply_to: payload.to,
        subject: payload.subject,
        message: payload.body,
      });
      return { ok: true, id: `emailjs_${Date.now()}` };
    }

    // ── MOCK ────────────────────────────────────────────────
    // Reached when the EmailJS ids are blank or its CDN is blocked. Prints
    // the mail it would have sent and keeps a copy in localStorage.
    console.groupCollapsed('%c💌  mock email', 'color:#FFC46B;font-weight:700');
    console.log('to      ', payload.to);
    console.log('subject ', payload.subject);
    console.log('body\n' + payload.body);
    console.groupEnd();

    const outbox = JSON.parse(localStorage.getItem('willyoudateme.outbox') || '[]');
    outbox.push(payload);
    localStorage.setItem('willyoudateme.outbox', JSON.stringify(outbox));

    await sleep(1100);
    return { ok: true, id: `mock_${Date.now()}`, mocked: true };
  }

  /* ── add to calendar ────────────────────────────────────── */

  // RFC 5545. Times are written without a zone or a trailing Z, which makes
  // them "floating": 6:30pm stays 6:30pm wherever the calendar is read, which
  // is what a date at golden hour means.
  const icsTime = (d) => [
    d.getFullYear(), pad2(d.getMonth() + 1), pad2(d.getDate()), 'T',
    pad2(d.getHours()), pad2(d.getMinutes()), '00',
  ].join('');

  const icsText = (v) => String(v)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

  // Lines cap at 75 octets, continuations start with a space.
  const utf8 = new TextEncoder();
  const fold = (line) => {
    const out = [];
    let buf = '';
    for (const ch of line) {
      const next = buf + ch;
      if (utf8.encode(next).length > 74) { out.push(buf); buf = ' ' + ch; }
      else buf = next;
    }
    out.push(buf);
    return out.join('\r\n');
  };

  function buildIcs(when, code) {
    const end = new Date(when.dt.getTime() + (C.calendar.durationMinutes || 90) * 60000);
    const stamp = new Date().toISOString().replace(/[-:]|\.\d{3}/g, '');

    const desc = [`${C.done.whatLabel}: ${state.label || C.done.fallbackActivity}`];
    if (state.message) desc.push(`${C.calendar.noteLabel} "${state.message}"`);
    // Put the code in the event too, so it survives in her calendar even if
    // the mail and the page are both long gone.
    if (code) desc.push(`${C.calendar.codeLabel}: ${code}`);

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//willyoudateme//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${stamp}-${Math.random().toString(36).slice(2, 10)}@willyoudateme`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsTime(when.dt)}`,
      `DTEND:${icsTime(end)}`,
      `SUMMARY:${icsText(C.calendar.title)}`,
      `DESCRIPTION:${icsText(desc.join('\n'))}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      `DESCRIPTION:${icsText(C.calendar.title)}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  const calBtn = $('#calBtn');
  let calUrl = null;

  const glyph = document.createElement('span');
  glyph.className = 'btn__glyph';
  glyph.setAttribute('aria-hidden', 'true');
  glyph.textContent = C.calendar.glyph;
  const label = document.createElement('span');
  label.textContent = C.calendar.button;
  calBtn.replaceChildren(glyph, label);

  // The receipt appears before the code does. Rather than hand her a file that
  // is missing it — or one whose URL is revoked mid-click when the real event
  // replaces it — the button waits until there is something worth downloading.
  function calendarWaiting(on) {
    calBtn.classList.toggle('is-waiting', on);
    calBtn.setAttribute('aria-disabled', String(on));
    if (on) calBtn.removeAttribute('href');
  }

  function offerCalendar(when, code) {
    if (calUrl) URL.revokeObjectURL(calUrl);
    calUrl = URL.createObjectURL(new Blob([buildIcs(when, code)], { type: 'text/calendar;charset=utf-8' }));
    calBtn.href = calUrl;
    calBtn.download = C.calendar.filename;
    calendarWaiting(false);
  }

  calBtn.addEventListener('click', (e) => {
    // No href yet: the event is not built. Swallow the click rather than let
    // it read as a download that silently did nothing.
    if (calBtn.getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; }
    const r = calBtn.getBoundingClientRect();
    Fx.bloom(r.left + r.width / 2, r.top + r.height / 2, reduced ? 10 : 34);
    calBtn.classList.remove('is-picked');
    void calBtn.offsetWidth;                 // restart the squish on a second press
    calBtn.classList.add('is-picked');
    Sound.yay();
  });

  // bob-cal is infinite so it never fires this — only the press squish does,
  // and dropping the class hands the idle bob back.
  calBtn.addEventListener('animationend', () => calBtn.classList.remove('is-picked'));

  function buildPayload(when, code, edited) {
    const lines = [edited ? C.email.openingEdited : C.email.opening, '',
                   `When:  ${when.text}`,
                   `What:  ${state.label || C.done.fallbackActivity}`,
                   `Nickname:  ${state.nick}`];
    // The code only exists if the Worker answered. It rides along in the mail
    // so it is not lost the moment she closes the page.
    if (code) lines.push(`${C.email.codeLabel}:  ${code}`);
    if (state.message) lines.push('', C.email.noteLabel, `  "${state.message}"`);
    lines.push('', C.email.signoff);

    // An edit is a different mail from a first yes — the subject has to say so
    // at a glance, and carry the code of the plan that moved.
    const prefix = edited
      ? `${C.email.subjectPrefixEdited}${code ? ` (${code})` : ''}`
      : C.email.subjectPrefix;

    return {
      to: C.email.recipient,
      from: C.email.fromName,
      subject: `${prefix} — ${when.day} at ${when.time}`,
      body: lines.join('\n'),
      date: state.day,
      time: state.time,
      activity: state.label,
      nickname: state.nick,
      message: state.message,
      sentAt: new Date().toISOString(),
    };
  }

  $('#planForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const when = prettyWhen();
    if (!when) return;

    if (!nickOk()) { openShoo(); return; }

    confirmBtn.classList.add('is-sending');
    confirmBtn.textContent = C.plan.sendingLabel;

    // A change has to land before it is celebrated — a receipt for an edit
    // that did not save would be a lie. A brand new plan is the other way
    // round further down: the moment matters more than the record.
    if (editing) {
      try {
        await saveEdit(when);
      } catch (err) {
        summary.textContent = err.message;
        summary.classList.add('is-error');
        confirmBtn.classList.remove('is-sending');
        confirmBtn.textContent = C.edit.confirmEdit;
        return;
      }
    }

    $('#rWhen').textContent = when.text;
    $('#rWhat').textContent = state.label || C.done.fallbackActivity;
    if (state.message) {
      $('#rNote').textContent = `“${state.message}”`;
      $('#rNoteRow').hidden = false;
    }

    calendarWaiting(true);

    setScene('done');
    window.scrollTo({ top: 0 });
    Fx.celebrate();
    Sound.chime();

    const status = $('#mailStatus');

    // Storing the plan is allowed to fail. A worker that is down, blocked or
    // slow must not cost her the email or the flowers — she just does not get
    // a code, and the plan lives only in the mail.
    const wasEditing = Boolean(editing);
    let saved = editing ? { id: editing.id } : null;
    if (!editing) {
      try {
        saved = await saveDate(when);
      } catch (err) {
        console.warn('the plan was not stored:', err);
      }
    }
    stopEditing();

    const code = saved && saved.id;
    if (code) {
      $('#rCode').textContent = code;
      $('#rCodeRow').hidden = false;
    }
    // Always — a save that failed still deserves a calendar entry, it just
    // goes in without a code.
    offerCalendar(when, code);

    try {
      const res = await sendDateRequest(buildPayload(when, code, wasEditing));
      status.classList.add('is-sent');
      status.innerHTML = `<span class="dot" aria-hidden="true"></span> ${esc(C.done.sent)}` +
        (res.mocked ? ` <em class="muted">${esc(C.done.mockNote)}</em>` : '');
    } catch (err) {
      status.innerHTML = `<span class="dot" aria-hidden="true"></span> ${esc(C.done.failed)}: ${esc(err.message)}`;
      console.error(err);
    } finally {
      confirmBtn.classList.remove('is-sending');
      confirmBtn.textContent = C.plan.confirm;
    }
  });

  $('#againBtn').addEventListener('click', () => {
    stopEditing();
    state.nick = ''; state.message = ''; state.day = null;
    state.time = null; state.label = null; state.furniture = false;
    nickname.value = ''; nickname.closest('.field').classList.remove('has-error');
    message.value = ''; count.textContent = '0';
    secretChip.hidden = true;
    secretChip.setAttribute('aria-checked', 'false');
    secretLatch.setAttribute('aria-expanded', 'false');
    secretLatch.classList.remove('is-open');
    $$('.day, .time').forEach((b) => b.setAttribute('aria-checked', 'false'));
    $('#customWrap').hidden = true;
    $('#rNoteRow').hidden = true;
    $('#rCodeRow').hidden = true;
    $('#mailStatus').classList.remove('is-sent');
    $('#mailStatus').innerHTML = sendingHTML;
    refresh();
    resetNo();
    setScene('ask');
  });

  refresh();
})();
