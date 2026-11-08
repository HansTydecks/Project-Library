// Tastatur, Maus (Pointer Lock oder Ziehen) und Touch (Joystick + Wischen).
export function createInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    lookDX: 0, lookDY: 0,       // Akkumulierte Blickbewegung seit letztem Frame
    moveX: 0, moveY: 0,         // Touch-Joystick (-1..1)
    locked: false,
    enabled: false,             // false, solange UI offen ist
    touch: matchMedia('(pointer: coarse)').matches,
    dragLook: false,            // Fallback ohne Pointer Lock
  };
  const pressHandlers = new Map(); // code → Set(fn)

  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (!keys.has(e.code)) {
      const set = pressHandlers.get(e.code);
      if (set) for (const fn of set) fn(e);
    }
    keys.add(e.code);
    if (['Tab', 'Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  document.addEventListener('pointerlockchange', () => {
    state.locked = document.pointerLockElement === canvas;
  });

  window.addEventListener('mousemove', (e) => {
    if (!state.enabled) return;
    if (state.locked || (state.dragLook && (e.buttons & 1))) {
      state.lookDX += e.movementX || 0;
      state.lookDY += e.movementY || 0;
    }
  });

  // ---- Touch ----
  let joyId = null, lookId = null, joyStart = null, lookLast = null, lookMoved = 0;
  const joyEl = document.createElement('div');
  joyEl.className = 'joystick hidden';
  joyEl.innerHTML = '<div class="knob"></div>';
  document.body.appendChild(joyEl);
  const knob = joyEl.firstChild;
  const tapHandlers = new Set();

  canvas.addEventListener('touchstart', (e) => {
    if (!state.enabled) return;
    for (const t of e.changedTouches) {
      if (t.clientX < window.innerWidth * 0.45 && joyId === null) {
        joyId = t.identifier;
        joyStart = { x: t.clientX, y: t.clientY };
        joyEl.style.left = `${t.clientX - 50}px`;
        joyEl.style.top = `${t.clientY - 50}px`;
        joyEl.classList.remove('hidden');
      } else if (lookId === null) {
        lookId = t.identifier;
        lookLast = { x: t.clientX, y: t.clientY };
        lookMoved = 0;
      }
    }
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) {
        let dx = (t.clientX - joyStart.x) / 50, dy = (t.clientY - joyStart.y) / 50;
        const l = Math.hypot(dx, dy);
        if (l > 1) { dx /= l; dy /= l; }
        state.moveX = dx; state.moveY = dy;
        knob.style.transform = `translate(${dx * 30}px, ${dy * 30}px)`;
      } else if (t.identifier === lookId) {
        const dx = t.clientX - lookLast.x, dy = t.clientY - lookLast.y;
        state.lookDX += dx * 2.2; state.lookDY += dy * 2.2;
        lookMoved += Math.abs(dx) + Math.abs(dy);
        lookLast = { x: t.clientX, y: t.clientY };
      }
    }
    e.preventDefault();
  }, { passive: false });

  const endTouch = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) {
        joyId = null; state.moveX = 0; state.moveY = 0;
        knob.style.transform = '';
        joyEl.classList.add('hidden');
      } else if (t.identifier === lookId) {
        lookId = null;
        if (lookMoved < 8) for (const fn of tapHandlers) fn();
      }
    }
  };
  canvas.addEventListener('touchend', endTouch);
  canvas.addEventListener('touchcancel', endTouch);

  return {
    state,
    isDown: (...codes) => codes.some((c) => keys.has(c)),
    onPress(code, fn) {
      if (!pressHandlers.has(code)) pressHandlers.set(code, new Set());
      pressHandlers.get(code).add(fn);
    },
    onTap(fn) { tapHandlers.add(fn); },
    consumeLook() {
      const d = { x: state.lookDX, y: state.lookDY };
      state.lookDX = 0; state.lookDY = 0;
      return d;
    },
    async lock() {
      if (state.touch || state.dragLook) return false;
      try {
        await canvas.requestPointerLock();
        return true;
      } catch {
        return false;
      }
    },
    unlock() {
      if (document.pointerLockElement) document.exitPointerLock();
    },
  };
}
