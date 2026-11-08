// Fortschritt: Entdeckte Räume, gelesene Bücher, gefundene Geheimnisse.
// Liegt im localStorage – funktioniert aber auch ohne (dann nur für diese Sitzung).
const KEY = 'magische-bibliothek:v1';

export function createProgress() {
  let data = { rooms: [], books: [], ideas: [], secrets: [], curios: [], visits: 0, firstVisit: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = { ...data, ...JSON.parse(raw) };
  } catch { /* privat/blockiert */ }
  const sets = Object.fromEntries(['rooms', 'books', 'ideas', 'secrets', 'curios'].map((k) => [k, new Set(data[k])]));
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
    has: (k, id) => sets[k].has(id),
    count: (k) => sets[k].size,
    get visits() { return data.visits; },
    get firstVisit() { return data.firstVisit; },
    reset() { for (const s of Object.values(sets)) s.clear(); save(); },
  };
}

/** Geheimnis-Registry: Props melden sich an, Fundstücke werden gefeiert. */
export function createSecrets({ progress, onFound }) {
  const all = new Map();
  return {
    register(id, name, room) { if (!all.has(id)) all.set(id, { id, name, room }); },
    found(id) { if (progress.secret(id)) onFound(all.get(id) ?? { id, name: id }); },
    list() { return [...all.values()].map((s) => ({ ...s, found: progress.has('secrets', s.id) })); },
  };
}
