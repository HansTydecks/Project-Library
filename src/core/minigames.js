// Reine Spiellogik der Minispiele (ohne three.js, testbar in Node).

/** Hütchenspiel: Folge von Vertauschungen [a, b] zwischen n Bechern. */
export function shellSwaps(rng, count, cups = 3) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const a = Math.floor(rng() * cups);
    let b = Math.floor(rng() * (cups - 1));
    if (b >= a) b++;
    out.push([a, b]);
  }
  return out;
}

/** Wo landet die Kugel, die unter Becher-Platz `start` lag? (Plätze werden vertauscht.) */
export function followBall(start, swaps) {
  let p = start;
  for (const [a, b] of swaps) { if (p === a) p = b; else if (p === b) p = a; }
  return p;
}

/** Simon-Prinzip (Trank-Rezept, Spatzen-Echo): Folge merken und nachmachen. */
export function createSequenceGame(rng, symbols) {
  const seq = [];
  let pos = 0;
  return {
    get sequence() { return seq.slice(); },
    get length() { return seq.length; },
    /** Neue Runde: ein Symbol mehr, Eingabe von vorn. */
    grow() { seq.push(symbols[Math.floor(rng() * symbols.length)]); pos = 0; return seq.slice(); },
    reset() { seq.length = 0; pos = 0; },
    /** Eingabe prüfen: 'ok' | 'round' (Folge komplett) | 'wrong' */
    input(sym) {
      if (!seq.length) return 'wrong';
      if (seq[pos] !== sym) { pos = 0; return 'wrong'; }
      pos++;
      if (pos >= seq.length) { pos = 0; return 'round'; }
      return 'ok';
    },
  };
}

/** Memory: gemischtes Deck aus Paaren und Aufdeck-Logik. */
export function createMemory(rng, pairs) {
  const deck = [];
  for (let i = 0; i < pairs; i++) deck.push(i, i);
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const solved = new Set();
  let open = [], moves = 0;
  return {
    deck,
    get moves() { return moves; },
    get open() { return open.slice(); },
    get done() { return solved.size === deck.length; },
    isSolved: (i) => solved.has(i),
    /** Karte i aufdecken. Ergebnis: { type: 'first'|'match'|'miss'|'invalid', cards } – bei 'miss' müssen beide Karten wieder zu. */
    flip(i) {
      if (i < 0 || i >= deck.length || solved.has(i) || open.includes(i) || open.length >= 2) return { type: 'invalid' };
      open.push(i);
      if (open.length === 1) return { type: 'first', cards: [i] };
      moves++;
      const [a, b] = open;
      open = [];
      if (deck[a] === deck[b]) { solved.add(a); solved.add(b); return { type: 'match', cards: [a, b] }; }
      return { type: 'miss', cards: [a, b] };
    },
  };
}

/**
 * Zahnrad-Rätsel: Jedes Rad hat `steps` Stellungen (0 = Pfeil oben). Drehen eines Rads dreht seine
 * verzahnten Nachbarn mit. links: Array von Nachbar-Listen.
 */
export function turnGear(state, i, links, steps = 4) {
  const s = state.slice();
  for (const k of [i, ...links[i]]) s[k] = (s[k] + 1) % steps;
  return s;
}
export const gearsSolved = (state) => state.every((v) => v === 0);
/** Lösbares Startbild: vom gelösten Zustand rückwärts verdrehen (jede Drehung ist umkehrbar durch steps−1 Drehungen). */
export function scrambleGears(rng, links, moves = 6, steps = 4) {
  let s = links.map(() => 0);
  for (let m = 0; m < moves; m++) s = turnGear(s, Math.floor(rng() * links.length), links, steps);
  if (gearsSolved(s)) s = turnGear(s, 0, links, steps);
  return s;
}

/** Sternbild nachzeichnen: Linien zwischen Sternen ziehen, bis alle Kanten da sind. */
export function createConstellation(edges) {
  const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const todo = new Set(edges.map(([a, b]) => key(a, b)));
  const drawn = [];
  let last = null;
  return {
    get last() { return last; },
    get drawn() { return drawn.slice(); },
    get done() { return todo.size === 0; },
    /** Ergebnis: 'start' | 'line' | 'done' | 'jump' (Stift neu angesetzt) | 'same' */
    click(star) {
      if (last === null) { last = star; return 'start'; }
      if (star === last) return 'same';
      const k = key(last, star);
      if (todo.has(k)) { todo.delete(k); drawn.push([last, star]); last = star; return todo.size ? 'line' : 'done'; }
      last = star; return 'jump';
    },
  };
}

/** Wurfparabel: Ball einen Zeitschritt weiterbewegen (Position/Geschwindigkeit als {x,y,z}). */
export function ballStep(b, dt, g = 9.8, drag = 0.02) {
  b.vy -= g * dt;
  const k = 1 - drag * dt;
  b.vx *= k; b.vz *= k;
  b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
  return b;
}

/** Fällt der Ball (von oben kommend) in einen runden Korb? */
export function inBasket(prevY, b, basket) {
  const r = Math.hypot(b.x - basket.x, b.z - basket.z);
  return prevY >= basket.y && b.y < basket.y && r < basket.r;
}

/** Ring durchflogen? (Abstand Spielerkörper → Ringmitte) */
export const throughRing = (p, ring, r = 1) => Math.hypot(p.x - ring[0], p.y - ring[1], p.z - ring[2]) < r;

/** Sekunden schön formatiert: 12.3 → „12,3 s“, 75 → „1:15 min“ */
export function formatTime(s) {
  if (s < 60) return `${s.toFixed(1).replace('.', ',')} s`;
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')} min`;
}

/** Angeln: Was hängt am Haken? Gewichtete Tabelle, rng() ∈ [0,1). */
export function pickCatch(table, x) {
  const total = table.reduce((s, t) => s + t.w, 0);
  let acc = 0;
  for (const t of table) { acc += t.w / total; if (x < acc) return t; }
  return table[table.length - 1];
}
