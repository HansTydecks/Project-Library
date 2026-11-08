// Automatische Registrierung: Jede Datei in rooms/ und props/ wird gefunden.
// Neue Räume/Props = neue Datei. Fertig.
const roomModules = import.meta.glob('./rooms/*.js', { eager: true });
const propModules = import.meta.glob('../props/*.js', { eager: true });

export function defineRoom(def) { return def; }
export function defineProp(def) { return def; }

export function loadRooms() {
  return Object.values(roomModules).map((m) => m.default).filter(Boolean);
}

export function loadProps() {
  const map = new Map();
  for (const [path, m] of Object.entries(propModules)) {
    const list = Array.isArray(m.default) ? m.default : [m.default];
    for (const p of list) {
      if (!p?.name) { console.warn(`[registry] Prop ohne Namen in ${path}`); continue; }
      map.set(p.name, p);
    }
  }
  return map;
}
