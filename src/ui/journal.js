import { el, esc } from './ui.js';

/** Das Entdeckungs-Tagebuch. */
export function openJournal(ui, { rooms, progress, secrets, totalBooks, totalIdeas, onHome, onCatalog, audio, onReset }) {
  const box = el('div', 'journal');
  const foundBooks = progress.count('books'), foundIdeas = progress.count('ideas');
  const sec = secrets.list();
  const pct = Math.round(((foundBooks + foundIdeas + sec.filter((s) => s.found).length) / Math.max(1, totalBooks + totalIdeas + sec.length)) * 100);
  box.innerHTML = `
    <h2>Dein Tagebuch</h2>
    <div style="font-style:italic;margin-bottom:10px">Besuch Nr. ${progress.visits} · erster Besuch am ${esc(progress.firstVisit)}</div>
    <div class="bar"><div style="width:${pct}%"></div></div>
    <div style="margin-top:4px">${pct}% der Bibliothek entdeckt</div>
    <h3>Räume</h3>
    <ul>${rooms.map((r) => progress.has('rooms', r.id) ? `<li>✦ ${esc(r.name)}</li>` : '<li class="unknown">??? (noch nicht betreten)</li>').join('')}</ul>
    <h3>Gelesen</h3>
    <div>${foundBooks} von ${totalBooks} Werken aufgeschlagen · ${foundIdeas} von ${totalIdeas} Ideen gelesen · ${progress.count('curios')} Kuriositäten in den Stapeln</div>
    <h3>Geheimnisse (${sec.filter((s) => s.found).length}/${sec.length})</h3>
    <ul>${sec.map((s) => s.found ? `<li>★ ${esc(s.name)}</li>` : '<li class="unknown">??? </li>').join('')}</ul>
    <div class="row">
      <button data-a="catalog">Zettelkatalog öffnen</button>
      <button data-a="home">Irrlicht nach Hause rufen</button>
      <button data-a="sound">${audio.enabled ? 'Klänge aus' : 'Klänge an'}</button>
      <button data-a="close">Schließen</button>
    </div>
    <div style="margin-top:14px;font-size:14px;opacity:.6">Steuerung: WASD laufen · Shift rennen · Maus schauen · E interagieren · Tab Tagebuch · M Klang · <a href="#" data-a="reset" style="color:inherit">Fortschritt zurücksetzen</a></div>`;
  const close = ui.openModal(box);
  box.querySelector('[data-a=close]').addEventListener('click', () => close(true));
  box.querySelector('[data-a=home]').addEventListener('click', () => { close(true); onHome(); });
  box.querySelector('[data-a=catalog]').addEventListener('click', () => { close(false); onCatalog(); });
  box.querySelector('[data-a=sound]').addEventListener('click', (e) => { audio.toggle(); e.target.textContent = audio.enabled ? 'Klänge aus' : 'Klänge an'; });
  box.querySelector('[data-a=reset]').addEventListener('click', (e) => { e.preventDefault(); if (confirm('Wirklich alles vergessen?')) { onReset(); close(true); } });
  return close;
}

/** Der Zettelkatalog: Register aller Werke, Ideen und Räume. */
export function openCatalog(ui, { docs, progress, describe, onGuide }) {
  const box = el('div', 'journal');
  box.innerHTML = `<h2>Zettelkatalog</h2><div style="font-style:italic">Das vollständige Register. Alphabetisch, wie es sich gehört.</div>
    <input placeholder="Filtern …" aria-label="Katalog filtern" /><div class="list"></div>
    <div class="row"><button data-a="close">Schublade schließen</button></div>`;
  const list = box.querySelector('.list');
  const input = box.querySelector('input');
  const sorted = docs.slice().sort((a, b) => a.title.localeCompare(b.title, 'de'));
  const close = ui.openModal(box);
  function render() {
    const q = input.value.toLowerCase();
    list.innerHTML = '';
    let letter = '';
    for (const d of sorted) {
      if (q && !`${d.title} ${d.tags} ${d.text}`.toLowerCase().includes(q)) continue;
      const L = d.title[0]?.toUpperCase() ?? '?';
      if (L !== letter) { letter = L; list.appendChild(el('h3', null, esc(L))); }
      const seen = d.type === 'project' ? progress.has('books', d.id) : d.type === 'idea' ? progress.has('ideas', d.id) : progress.has('rooms', d.id);
      const row = el('div', `catalog-row${seen ? ' seen' : ''}`);
      row.innerHTML = `<div><div class="t">${esc(d.title)}</div><div class="k">${{ project: 'Werk', idea: 'Idee', room: 'Raum' }[d.type]} · ${esc(describe(d))}</div></div><button>Weg zeigen</button>`;
      row.querySelector('button').addEventListener('click', () => { close(true); onGuide(d); });
      list.appendChild(row);
    }
  }
  input.addEventListener('input', render);
  render();
  box.querySelector('[data-a=close]').addEventListener('click', () => close(true));
  setTimeout(() => input.focus(), 50);
  return close;
}
