import { el, esc } from './ui.js';

const TYPE = { project: 'Werk', idea: 'Idee', room: 'Raum' };
const CHIPS = ['Überrasch mich', 'Garten', 'Spiele', 'Blog', 'Ideen', 'Hilfe'];

/** Gespräch mit dem Bibliothekar. */
export function openWizardDialog(ui, { librarian, onGuide, onOpen, onClose, describe, greeting }) {
  const box = el('div', 'dialog');
  box.innerHTML = `
    <div class="who">Der Bibliothekar</div>
    <div class="say"></div>
    <form autocomplete="off"><input name="q" placeholder="Wonach suchst du? (Titel, Thema, Raum …)" aria-label="Suche" /><button class="btn primary">Fragen</button></form>
    <div class="chips">${CHIPS.map((c) => `<button type="button">${c}</button>`).join('')}</div>
    <ul class="results"></ul>
    <div class="close-row"><button class="btn" data-act="close">Danke, ich schau mich selbst um</button></div>`;
  const say = box.querySelector('.say');
  const list = box.querySelector('.results');
  const input = box.querySelector('input');
  const close = ui.openModal(box, { onClose });

  let typing;
  function speak(text) {
    clearInterval(typing);
    say.textContent = '';
    let i = 0;
    typing = setInterval(() => {
      say.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(typing);
    }, 14);
  }

  function show(res) {
    speak(res.text);
    list.innerHTML = '';
    for (const r of res.results) {
      const li = el('li');
      li.innerHTML = `<div><span class="t">${esc(r.title)}</span><span class="k">${TYPE[r.type]}${describe(r) ? ` · ${esc(describe(r))}` : ''}</span></div>
        <div class="acts"><button class="btn primary" data-a="guide">Weg zeigen</button>${r.type !== 'room' ? '<button class="btn" data-a="open" title="Im Notfall: direkt aufschlagen">Notfall ↗</button>' : ''}</div>`;
      li.querySelector('[data-a=guide]').addEventListener('click', () => { close(true); onGuide(r); });
      li.querySelector('[data-a=open]')?.addEventListener('click', () => { close(false); onOpen(r); });
      list.appendChild(li);
    }
  }

  box.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); show(librarian.ask(input.value)); input.select(); });
  box.querySelectorAll('.chips button').forEach((b) => b.addEventListener('click', () => { input.value = b.textContent; show(librarian.ask(b.textContent)); }));
  box.querySelector('[data-act=close]').addEventListener('click', () => close(true));
  speak(greeting);
  setTimeout(() => input.focus(), 50);
  return close;
}
