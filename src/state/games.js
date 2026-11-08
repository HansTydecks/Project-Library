import { formatTime } from '../core/minigames.js';

/**
 * Minispiel-Zentrale: Anmeldung, Bestwerte (im Fortschritt), Anzeige oben, Klick-Übernahme und Sieg-Ostereier.
 * Immer nur ein Spiel gleichzeitig aktiv; ein neues beendet das alte (dessen onAbort wird gerufen).
 */
export function createGames({ ui, progress, secrets, audio, interaction }) {
  const reg = new Map();
  let active = null, lastHud = '';
  const MASTER = 'spielemeister';
  secrets.register(MASTER, 'Alle Minispiele gemeistert', null, 'egg');

  const fmt = (g, v) => (v === undefined ? '–' : g.unit === 's' ? formatTime(v) : `${v} ${g.unit}`);

  const api = {
    /** { name, room, unit ('s' = Zeit, sonst Einheit), lower (kleiner ist besser), egg, eggName } */
    register(id, def) {
      if (reg.has(id)) return reg.get(id);
      const g = { id, unit: 'Punkte', lower: false, ...def };
      reg.set(id, g);
      if (g.egg) secrets.register(g.egg, g.eggName ?? g.name, g.room, 'egg');
      return g;
    },
    list() { return [...reg.values()].map((g) => ({ ...g, best: progress.best(g.id), bestText: fmt(g, progress.best(g.id)) })); },
    get active() { return active?.id ?? null; },
    isActive: (id) => active?.id === id,
    /** Spiel starten. onAbort wird gerufen, wenn ein anderes Spiel startet. */
    start(id, { onAbort } = {}) {
      if (active && active.id !== id) { const a = active; active = null; a.onAbort?.(); }
      active = { id, onAbort };
      interaction.setCapture(null);
      const g = reg.get(id);
      lastHud = ''; ui.setGameHud(g?.name ?? id, '');
      return g;
    },
    hud(id, text) { if (active?.id === id && text !== lastHud) { lastHud = text; ui.setGameHud(reg.get(id)?.name ?? id, text); } },
    /** Klick/E übernehmen, solange das Spiel läuft (fn(currentHit) → false = normal weiter). */
    capture(id, fn) { if (active?.id === id) interaction.setCapture(fn); },
    end(id) {
      if (active?.id !== id) return;
      active = null;
      interaction.setCapture(null);
      ui.setGameHud(null);
    },
    /** Ergebnis melden: Rekord-Toast, Rückgabe true bei neuem Rekord. */
    record(id, value) {
      const g = reg.get(id);
      if (!g) return false;
      const before = progress.best(id);
      const rec = progress.record(id, value, { lower: g.lower });
      if (rec && before !== undefined) { audio.play('chime'); ui.toast(`🏆 Neuer Rekord bei „${g.name}“: ${fmt(g, value)} (vorher ${fmt(g, before)})`, { ms: 5000 }); }
      return rec;
    },
    /** Sieg-Osterei des Spiels auslösen (und ggf. »Spielemeister«). */
    win(id) {
      const g = reg.get(id);
      if (!g?.egg) return;
      secrets.found(g.egg);
      const eggs = [...reg.values()].filter((x) => x.egg);
      if (eggs.length >= 10 && eggs.every((x) => progress.has('secrets', x.egg))) secrets.found(MASTER);
    },
    fmt: (id, v) => fmt(reg.get(id) ?? { unit: '' }, v),
  };
  return api;
}
