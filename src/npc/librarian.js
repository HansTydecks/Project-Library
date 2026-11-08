import Fuse from 'fuse.js';

// Das Gehirn des Bibliothekars: Suche + Persönlichkeit. Ohne three.js → testbar.
const GREETINGS = {
  morning: ['Guten Morgen! Der Tee ist noch heiß.', 'Ah, ein Frühaufsteher. Die Bücher schlafen noch halb.'],
  day: ['Willkommen, willkommen! Wonach steht dir der Sinn?', 'Schön, dich zu sehen. Was suchen wir heute?'],
  evening: ['Guten Abend. Die Kerzen sind angezündet.', 'Ein Abendbesuch – die schönste Zeit zum Stöbern.'],
  night: ['Psst… es ist spät. Die Bücher flüstern schon.', 'Mitternachtsleser! Mein Lieblingspublikum.'],
};
const FOUND = [
  'Ah, «{t}»! Ich weiß genau, wo es steht. Folge dem Licht.',
  '«{t}»… ich rieche noch die frische Tinte. Hier entlang!',
  'Natürlich, «{t}». Ein feines Werk. Ich schicke dir ein Irrlicht.',
  '«{t}»? Gute Wahl. Ich hätte es selbst empfohlen.',
];
const NOT_FOUND = [
  'Hmm. Davon habe ich noch nie gehört – und ich habe von *allem* gehört. Fast.',
  'Das steht in keinem meiner Register. Vielleicht wurde es noch nicht geschrieben?',
  'Nichts. Nada. Vielleicht in den Endlosen Stapeln … aber dort findet man eher, was man nicht sucht.',
];
const HELP = 'Lauf mit W A S D (Shift zum Rennen), schau mit der Maus. Mit E (oder Klick) ziehst du Bücher aus dem Regal. Tab öffnet dein Tagebuch, M schaltet Klänge an. Und wenn du dich verirrst: frag mich. Laufen musst du aber selbst!';

export function timeOfDay(h = new Date().getHours()) {
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 18) return 'day';
  if (h >= 18 && h < 23) return 'evening';
  return 'night';
}

export function createLibrarian({ projects = [], ideas = [], rooms = [], random = Math.random }) {
  const docs = [
    ...projects.map((p) => ({ type: 'project', id: p.id, title: p.title, text: p.description ?? '', tags: (p.tags ?? []).join(' '), extra: `${p.kind ?? ''} ${p.shelf ?? ''} ${p.room ?? ''} ${p.year ?? ''}`, ref: p })),
    ...ideas.map((i) => ({ type: 'idea', id: i.id, title: i.title, text: i.text ?? '', tags: (i.tags ?? []).join(' '), extra: 'idee', ref: i })),
    ...rooms.map((r) => ({ type: 'room', id: r.id, title: r.name, text: r.description ?? '', tags: (r.keywords ?? []).join(' '), extra: 'raum', ref: r })),
  ];
  const fuse = new Fuse(docs, {
    keys: [{ name: 'title', weight: 3 }, { name: 'tags', weight: 2 }, { name: 'text', weight: 1 }, { name: 'extra', weight: 0.5 }],
    threshold: 0.38, ignoreLocation: true, includeScore: true, minMatchCharLength: 2,
  });
  const pick = (arr) => arr[Math.floor(random() * arr.length)];

  function greet(name) {
    return pick(GREETINGS[timeOfDay()]) + (name ? ` ${name}` : '');
  }

  function ask(raw) {
    const q = String(raw ?? '').trim();
    const l = q.toLowerCase();
    if (!q) return { text: 'Du musst mir schon sagen, wonach du suchst. Ich bin Bibliothekar, kein Gedankenleser. Meistens.', results: [] };
    if (/^(hilfe|help|\?|wie geht das|steuerung)/.test(l)) return { text: HELP, results: [] };
    if (/(überrasch|zufall|irgendwas|egal|random|inspir)/.test(l)) {
      const pool = docs.filter((d) => d.type !== 'room');
      const d = pool.length ? pick(pool) : null;
      return d ? { text: `Lass mich überlegen … wie wäre es mit «${d.title}»?`, results: [d] } : { text: 'Die Regale sind noch leer!', results: [] };
    }
    if (/(ausgang|raus|nach hause|exit|heim)/.test(l)) {
      return { text: 'Einen Ausgang? *lacht leise* Den hat noch niemand gebraucht. Aber das Foyer zeig ich dir gern.', results: docs.filter((d) => d.type === 'room' && d.id === 'foyer') };
    }
    if (/(wer bist du|dein name|wie heißt du)/.test(l)) return { text: 'Ich bin der Bibliothekar. Ich war schon hier, bevor das erste Buch geschrieben wurde. Damals war es sehr ruhig.', results: [] };
    if (/(katze|katzen)/.test(l)) return { text: 'Die Katzen? Es sind mehr, als man denkt. Sie wohnen hier. Ich wohne bei ihnen. Such in den gemütlichen Ecken.', results: [] };
    if (/(geheim|secret|versteckt)/.test(l)) return { text: 'Geheimnisse verrät man nicht – man findet sie. Kleiner Tipp: Fass Dinge an. Uhren, Globen, Tee …', results: [] };
    if (/(danke|merci|thx)/.test(l)) return { text: 'Gern geschehen! Dafür bin ich da. Und für den Tee.', results: [] };

    const hits = fuse.search(q).slice(0, 6).map((h) => h.item);
    if (!hits.length) return { text: pick(NOT_FOUND), results: [] };
    const top = hits[0];
    let text;
    if (top.type === 'room') text = `Der Raum «${top.title}»? ${top.text} Ich zeig dir den Weg.`;
    else if (top.type === 'idea') text = `Eine Idee namens «${top.title}» hängt im Ideen-Kabinett. Ich leuchte dir.`;
    else text = pick(FOUND).replace('{t}', top.title);
    if (hits.length > 1) text += ' Ich habe noch mehr gefunden:';
    return { text, results: hits };
  }

  return { greet, ask, docs };
}
