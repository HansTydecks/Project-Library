// HUD + Modal-Verwaltung. Alles DOM, kein Framework.
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
export { el };

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function createUI({ root, input }) {
  root.appendChild(el('div', 'vignette'));
  const cross = root.appendChild(el('div', 'crosshair'));
  const hint = root.appendChild(el('div', 'hint'));
  const banner = root.appendChild(el('div', 'room-banner'));
  const toasts = root.appendChild(el('div', 'toasts'));
  const compass = root.appendChild(el('div', 'compass hidden'));
  const debug = root.appendChild(el('div', 'debug hidden'));
  const corner = root.appendChild(el('div', 'corner'));
  const bag = root.appendChild(el('div', 'bag hidden'));
  const gameHud = root.appendChild(el('div', 'game-hud hidden'));
  const touchBtn = root.appendChild(el('button', 'touch-act hidden', '✋'));
  touchBtn.setAttribute('aria-label', 'Interagieren');
  const jumpBtn = root.appendChild(el('button', 'touch-jump hidden', '⤒'));
  jumpBtn.setAttribute('aria-label', 'Springen');

  const stack = [];
  const listeners = { allClosed: new Set(), opened: new Set() };
  let bannerTimer;

  function openModal(content, { onClose, closeOnBackdrop = true } = {}) {
    const wrap = el('div', 'modal');
    wrap.appendChild(content);
    root.appendChild(wrap);
    const entry = { wrap, onClose, t: performance.now() };
    stack.push(entry);
    input.state.enabled = false;
    input.unlock();
    for (const fn of listeners.opened) fn();
    if (closeOnBackdrop) wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(true); });
    function close(gesture = false) {
      const i = stack.indexOf(entry);
      if (i < 0) return;
      stack.splice(i, 1);
      wrap.remove();
      onClose?.();
      if (!stack.length) for (const fn of listeners.allClosed) fn(gesture);
    }
    entry.close = close;
    return close;
  }

  window.addEventListener('keydown', (e) => {
    if (!stack.length || e.repeat || performance.now() - stack.at(-1).t < 200) return;
    if (e.code === 'Escape' || (e.code === 'KeyE' && !(e.target instanceof HTMLInputElement)) || (e.code === 'Tab' && stack.at(-1).wrap.querySelector('.journal'))) {
      e.preventDefault();
      stack.at(-1).close(true);
    }
  });

  const ui = {
    get modalOpen() { return stack.length > 0; },
    openModal,
    closeAll(gesture = false) { while (stack.length) stack.at(-1).close(gesture); },
    onAllClosed(fn) { listeners.allClosed.add(fn); },
    onOpened(fn) { listeners.opened.add(fn); },

    toast(text, { secret = false, ms = 4200 } = {}) {
      const t = el('div', `toast${secret ? ' secret' : ''}`);
      t.textContent = text;
      toasts.appendChild(t);
      while (toasts.children.length > 3) toasts.firstChild.remove();
      setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 700); }, ms);
    },

    note(title, text) {
      const card = el('div', 'note-card');
      card.innerHTML = `<h3>${esc(title)}</h3><p>${esc(text)}</p>`;
      const btn = el('button', 'btn', 'Weiterlesen … nein, weitergehen');
      card.appendChild(btn);
      const close = openModal(card);
      btn.addEventListener('click', () => close(true));
    },

    banner(name, sub = '') {
      banner.innerHTML = `${esc(name)}${sub ? `<small>${esc(sub)}</small>` : ''}`;
      banner.classList.add('show');
      clearTimeout(bannerTimer);
      bannerTimer = setTimeout(() => banner.classList.remove('show'), 3200);
    },

    setHint(h) {
      if (!h) { hint.innerHTML = ''; cross.classList.remove('active'); touchBtn.classList.add('hidden'); return; }
      const key = input.state.touch ? '✋' : 'E';
      hint.innerHTML = `<kbd>${key}</kbd>${esc(h.label)}${h.verb ? `<span class="verb">${esc(h.verb)}</span>` : ''}`;
      cross.classList.add('active');
      if (input.state.touch) touchBtn.classList.remove('hidden');
    },

    setCompass(text, angle) {
      if (text == null) { compass.classList.add('hidden'); return; }
      compass.classList.remove('hidden');
      compass.innerHTML = `<span class="arrow" style="transform: rotate(${angle}rad)">↑</span> ${esc(text)}`;
    },

    /** Minispiel-Anzeige oben in der Mitte (null blendet aus). */
    setGameHud(title, text = '') {
      if (title == null) { gameHud.classList.add('hidden'); return; }
      gameHud.classList.remove('hidden');
      gameHud.innerHTML = `<b>${esc(title)}</b>${text ? `<span>${esc(text)}</span>` : ''}`;
    },

    setDebug(text) { debug.classList.remove('hidden'); debug.textContent = text; },

    addCornerButton(label, title, fn) {
      const b = el('button', null, label);
      b.title = title;
      b.addEventListener('click', (e) => { e.stopPropagation(); fn(b); });
      corner.appendChild(b);
      return b;
    },

    touchButton: touchBtn,
    jumpButton: jumpBtn,
    /** Tasche (Inventar) unten links: [{ icon, name, desc }] */
    setInventory(list) {
      bag.innerHTML = list.map((i) => `<span class="item" data-id="${esc(i.id)}" title="${esc(i.name)} – ${esc(i.desc)}">${i.icon}</span>`).join('');
      bag.dataset.empty = list.length ? '0' : '1';
    },
    onUseItem(fn) { bag.addEventListener('click', (e) => { const id = e.target.closest('[data-id]')?.dataset.id; if (id) { e.stopPropagation(); fn(id); } }); },
    showHud(on) {
      for (const n of [cross, hint, corner]) n.classList.toggle('hidden', !on);
      bag.classList.toggle('hidden', !on);
      jumpBtn.classList.toggle('hidden', !on || !input.state.touch);
    },
  };
  return ui;
}
