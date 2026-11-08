// Reine Logik (ohne three.js): Welches Projekt kommt in welches Regal?
// Testbar mit `npm test`.

export const CART = 'sortierwagen';

const KIND_DEFAULTS = {
  blog: { room: 'archiv', shelf: 'blog' },
  archive: { room: 'archiv', shelf: 'archiv' },
};

/**
 * @param {Array} projects  Einträge aus content/projects.json
 * @param {Array} shelves   [{ id, room, capacity, mode? }]
 * @returns {{ byShelf: Map<string, Array>, unplaced: Array, placedIn: Map<string,string> }}
 */
export function assignProjects(projects, shelves) {
  const key = (s) => `${s.room}/${s.id}`;
  const byShelf = new Map(shelves.map((s) => [key(s), []]));
  const placedIn = new Map();
  const unplaced = [];
  const normal = shelves.filter((s) => !s.mode);
  const cart = shelves.find((s) => s.id === CART);

  const find = (p) => {
    const wantShelf = p.shelf ?? KIND_DEFAULTS[p.kind]?.shelf;
    const wantRoom = p.room ?? (p.shelf ? undefined : KIND_DEFAULTS[p.kind]?.room);
    if (wantShelf) {
      return normal.find((s) => s.id === wantShelf && (!wantRoom || s.room === wantRoom));
    }
    if (wantRoom) {
      const inRoom = normal.filter((s) => s.room === wantRoom && s.id !== CART && !s.id.startsWith('_'));
      if (!inRoom.length) return undefined;
      // deterministisch verteilen
      let h = 0;
      for (const c of String(p.id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      return inRoom[h % inRoom.length];
    }
    return undefined;
  };

  for (const p of projects) {
    if (p.kind === 'idea' && !p.shelf && !p.room) continue; // Ideen hängen am Korkbrett
    let s = find(p);
    if (s && s.capacity != null && byShelf.get(key(s)).length >= s.capacity) s = undefined;
    if (!s) s = cart;
    if (s && (s.capacity == null || byShelf.get(key(s)).length < s.capacity)) {
      byShelf.get(key(s)).push(p);
      placedIn.set(p.id, key(s));
    } else {
      unplaced.push(p);
    }
  }

  // Sonder-Regale: "newest" bekommt Kopien der neuesten Einträge
  for (const s of shelves.filter((x) => x.mode === 'newest')) {
    const sorted = projects
      .filter((p) => p.kind !== 'idea')
      .map((p, i) => ({ p, i }))
      .sort((a, b) => (String(b.p.added ?? b.p.year ?? '').localeCompare(String(a.p.added ?? a.p.year ?? ''))) || b.i - a.i)
      .slice(0, s.capacity ?? 3)
      .map((x) => x.p);
    byShelf.set(key(s), sorted);
  }

  return { byShelf, unplaced, placedIn };
}
