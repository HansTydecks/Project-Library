// Fortschritt: Entdeckte Räume, gelesene Bücher, gefundene Geheimnisse.
// Liegt im localStorage – funktioniert aber auch ohne (dann nur für diese Sitzung).
const KEY = 'magische-bibliothek:v1';

export function createProgress() {
  let data = { rooms: [], books: [], ideas: [], secrets: [], curios: [], friends: [], eggs: [], items: [], itemsUsed: [], pilze: [], knocks: [], scores: {}, visits: 0, firstVisit: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = { ...data, ...JSON.parse(raw) };
  } catch { /* privat/blockiert */ }
  const sets = Object.fromEntries(['rooms', 'books', 'ideas', 'secrets', 'curios', 'friends', 'eggs', 'items', 'itemsUsed', 'pilze', 'knocks'].map((k) => [k, new Set(data[k] ?? [])]));
  data.visits = (data.visits ?? 0) + 1;
  data.firstVisit ??= new Date().toISOString().slice(0, 10);

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...data, ...Object.fromEntries(Object.entries(sets).map(([k, s]) => [k, [...s]])) }));
    } catch { /* egal */ }
  }
  save();

  const mark = (k) => (id) => { if (sets[k].has(id)) return false; sets[k].add(id); save(); return true; };
  return {
    room: mark('rooms'), book: mark('books'), idea: mark('ideas'), secret: mark('secrets'), curio: mark('curios'),
    friend: mark('friends'), egg: mark('eggs'),
    has: (k, id) => sets[k].has(id),
    mark: (k, id) => mark(k)(id),
    remove: (k, id) => { if (sets[k].delete(id)) save(); },
    count: (k) => sets[k].size,
    /** Bestwert eines Minispiels (undefined, wenn noch nie gespielt). */
    best: (game) => data.scores?.[game],
    /** Neuen Wert melden; lower = true, wenn kleiner besser ist (Zeiten). Gibt true bei neuem Rekord zurück. */
    record(game, value, { lower = false } = {}) {
      data.scores ??= {};
      const old = data.scores[game];
      if (old !== undefined && (lower ? value >= old : value <= old)) return false;
      data.scores[game] = value; save(); return true;
    },
    get visits() { return data.visits; },
    get firstVisit() { return data.firstVisit; },
    reset() { for (const s of Object.values(sets)) s.clear(); data.scores = {}; save(); },
  };
}

/** Geheimnis-Registry: Props melden sich an, Fundstücke werden gefeiert. */
export function createSecrets({ progress, onFound }) {
  const all = new Map();
  return {
    /** kind: 'secret' (Geheimnis im Raum) oder 'egg' (Osterei: Code, Zauberspruch, versteckte Mechanik) */
    register(id, name, room, kind = 'secret') { if (!all.has(id)) all.set(id, { id, name, room, kind }); },
    found(id) { if (progress.secret(id)) onFound(all.get(id) ?? { id, name: id }); },
    list(kind) { return [...all.values()].filter((s) => !kind || s.kind === kind).map((s) => ({ ...s, found: progress.has('secrets', s.id) })); },
  };
}
