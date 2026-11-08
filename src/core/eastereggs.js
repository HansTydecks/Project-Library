// Ostereier: Tastenfolgen, Jahreszeiten, kleine Zähler. Die Effekte selbst verdrahtet main.js.

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

/** Erkennt Tastenfolgen. onSequence(name) wird aufgerufen, sobald eine Folge vollständig ist. */
export function createSequenceWatcher(onSequence, sequences = { konami: KONAMI }) {
  const buf = [];
  const max = Math.max(...Object.values(sequences).map((s) => s.length));
  function push(code) {
    buf.push(code);
    if (buf.length > max) buf.shift();
    for (const [name, seq] of Object.entries(sequences)) {
      if (buf.length < seq.length) continue;
      if (seq.every((c, i) => buf[buf.length - seq.length + i] === c)) { buf.length = 0; onSequence(name); }
    }
  }
  return { push };
}

/** Gemeinfreie Kinderlied-Anfänge als Tonfolgen (Tonnamen). */
export const MELODIES = {
  entchen: { name: 'Alle meine Entchen', notes: ['c', 'd', 'e', 'f', 'g', 'g', 'a', 'a', 'a', 'a', 'g'] },
  haenschen: { name: 'Hänschen klein', notes: ['g', 'e', 'e', 'f', 'd', 'd', 'c', 'd', 'e', 'f', 'g', 'g', 'g'] },
  tonleiter: { name: 'Die Tonleiter', notes: ['c', 'd', 'e', 'f', 'g', 'a', 'h', 'c2'] },
};

/** Prüft, ob die zuletzt gespielten Töne mit einer bekannten Melodie enden. Gibt deren Schlüssel oder null zurück. */
export function matchMelody(played, melodies = MELODIES) {
  for (const [key, m] of Object.entries(melodies)) {
    const n = m.notes.length;
    if (played.length < n) continue;
    if (m.notes.every((t, i) => played[played.length - n + i] === t)) return key;
  }
  return null;
}

/** Jahreszeit für Deko-Ostereier. override z. B. per ?season=winter. */
export function season(date = new Date(), override = null) {
  if (override) return override;
  const m = date.getMonth();
  if (m === 11 || m === 0) return 'winter';
  if (m === 9) return 'autumn';
  if (m === 3) return 'spring';
  return 'none';
}

export function isCocoaHour(date = new Date()) { return date.getHours() === 0; }

/** Zählt schnelle Wiederholungen (z. B. 5× Klingeln in 20 s). */
export function createRepeatCounter(times, windowSec) {
  let stamps = [];
  return (now) => {
    stamps = stamps.filter((s) => now - s < windowSec);
    stamps.push(now);
    if (stamps.length >= times) { stamps = []; return true; }
    return false;
  };
}
