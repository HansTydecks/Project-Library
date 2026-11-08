import { el, esc } from './ui.js';

const STATUS = {
  live: ['live', 'Veröffentlicht'],
  wip: ['wip', 'In Arbeit'],
  idea: ['idea', 'Nur eine Idee'],
  archived: ['archiv', 'Archiviert'],
};
const KIND = { app: 'App', blog: 'Blogeintrag', archive: 'Archivstück', idea: 'Idee', game: 'Spiel', tool: 'Werkzeug', site: 'Webseite' };

const MARGIN_NOTES = [
  'Hier hat jemand »Weiter so!« an den Rand gekritzelt.',
  'Am Rand: eine kleine Zeichnung von einer Katze mit Hut.',
  'Randnotiz: »Version 2 wird noch besser.«',
  'Ein Kaffeefleck in Form eines Sterns.',
  'Bleistift: »Das hier unbedingt nochmal anschauen!«',
];

/** Öffnet ein Projekt als aufgeschlagenes Buch. */
export function openProjectBook(ui, p, { where, onGuide, lost = false, onClose } = {}) {
  const [cls, label] = STATUS[p.status] ?? STATUS.live;
  const book = el('div', 'book');
  const note = MARGIN_NOTES[(p.id ?? '').length % MARGIN_NOTES.length];
  const tags = (p.tags ?? []).map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  book.innerHTML = `
    <div class="page">
      <h2>${esc(p.title)}</h2>
      <div class="meta">${esc(KIND[p.kind] ?? 'Werk')}${p.year ? ` · ${esc(p.year)}` : ''}${where ? ` · ${esc(where)}` : ''}</div>
      <span class="stamp ${cls}">${label}</span>
      <div class="tags">${tags}</div>
      ${lost ? '<p class="margin-note">Dieses Buch hat sich in die Endlosen Stapel verirrt. Wie schön, dass du es gefunden hast.</p>' : `<p class="margin-note">${esc(note)}</p>`}
      <div class="pagenum">— ${((p.id ?? '').length * 7) % 300 + 1} —</div>
    </div>
    <div class="page">
      <p class="drop">${esc(p.description ?? 'Über dieses Werk ist noch nichts geschrieben worden. Vielleicht von dir, demnächst?')}</p>
      <div class="actions">
        ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">Aufschlagen ↗</a>` : '<span class="meta">(Noch keine Adresse hinterlegt)</span>'}
        ${onGuide ? '<button class="ghost" data-act="guide">Wo steht es?</button>' : ''}
        <button class="ghost" data-act="close">Zurückstellen</button>
      </div>
      <div class="pagenum">— ${((p.id ?? '').length * 7) % 300 + 2} —</div>
    </div>`;
  const close = ui.openModal(book, { onClose });
  book.querySelector('[data-act=close]').addEventListener('click', () => close(true));
  book.querySelector('[data-act=guide]')?.addEventListener('click', () => { close(true); onGuide(); });
  return close;
}

/** Öffnet ein namenloses Füllbuch. */
export function openFillerBook(ui, { title, line }, { onClose } = {}) {
  const book = el('div', 'book');
  book.innerHTML = `
    <div class="page">
      <h2>${esc(title)}</h2>
      <div class="meta">Verfasser unbekannt · Auflage: vermutlich eine</div>
      <p class="margin-note">${esc(line)}</p>
    </div>
    <div class="page">
      <p class="drop">Dies ist eines der namenlosen Bücher der Bibliothek. Niemand weiß, wer sie schreibt. Manche sagen, die Bibliothek träumt sie, wenn niemand hinsieht.</p>
      <p>Wenn hier eines Tages dein nächstes Projekt steht, wird dieses Buch höflich Platz machen.</p>
      <div class="actions"><button data-act="close">Zurückstellen</button></div>
    </div>`;
  const close = ui.openModal(book, { onClose });
  book.querySelector('[data-act=close]').addEventListener('click', () => close(true));
  return close;
}

/** Öffnet eine Idee (Notizzettel). */
export function openIdeaNote(ui, idea, { onClose } = {}) {
  const card = el('div', 'note-card');
  card.innerHTML = `<h3>${esc(idea.title)}</h3><p>${esc(idea.text ?? '')}</p>
    ${(idea.tags ?? []).length ? `<p style="font-size:18px;opacity:.7">#${idea.tags.map(esc).join(' #')}</p>` : ''}
    ${idea.date ? `<p style="font-size:18px;opacity:.6">notiert am ${esc(idea.date)}</p>` : ''}`;
  const btn = el('button', 'btn', 'Zurück an die Pinnwand');
  card.appendChild(btn);
  const close = ui.openModal(card, { onClose });
  btn.addEventListener('click', () => close(true));
  return close;
}
