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
