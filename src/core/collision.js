// Kollision mit achsenparallelen Boxen in einem Spatial Hash (XZ-Ebene) – mit optionaler Höhe:
// box.top (Oberkante, darauf kann man stehen) und box.bottom (Unterkante, z. B. schwebende Plattformen).
// Boxen ohne Höhe sind unendlich hoch (Wände, Regale).
const BUCKET = 4;
const BODY_H = 1.75;  // Körperhöhe der Spielfigur
export const STEP = 0.3; // so hohe Kanten (Beckenrand, Teichufer, Stufen) steigt man einfach hinauf

export class CollisionWorld {
  constructor() {
    this.buckets = new Map();
    this.byOwner = new Map();
  }

  _key(ix, iz) {
    return ix * 73856093 ^ iz * 19349663;
  }

  /** box: {minX,maxX,minZ,maxZ}; owner: beliebiger Schlüssel zum späteren Entfernen */
  add(box, owner = 'static') {
    box.owner = owner;
    box.top ??= Infinity;
    box.bottom ??= -Infinity;
    const x0 = Math.floor(box.minX / BUCKET), x1 = Math.floor(box.maxX / BUCKET);
    const z0 = Math.floor(box.minZ / BUCKET), z1 = Math.floor(box.maxZ / BUCKET);
    box._keys = [];
    for (let ix = x0; ix <= x1; ix++) {
      for (let iz = z0; iz <= z1; iz++) {
        const k = this._key(ix, iz);
        let b = this.buckets.get(k);
        if (!b) this.buckets.set(k, (b = []));
        b.push(box);
        box._keys.push(k);
      }
    }
    if (!this.byOwner.has(owner)) this.byOwner.set(owner, []);
    this.byOwner.get(owner).push(box);
    return box;
  }

  removeOwner(owner) {
    const list = this.byOwner.get(owner);
    if (!list) return;
    for (const box of list) {
      for (const k of box._keys) {
        const b = this.buckets.get(k);
        if (!b) continue;
        const i = b.indexOf(box);
        if (i >= 0) b.splice(i, 1);
        if (!b.length) this.buckets.delete(k);
      }
    }
    this.byOwner.delete(owner);
  }

  query(x, z, r) {
    const out = new Set();
    const x0 = Math.floor((x - r) / BUCKET), x1 = Math.floor((x + r) / BUCKET);
    const z0 = Math.floor((z - r) / BUCKET), z1 = Math.floor((z + r) / BUCKET);
    for (let ix = x0; ix <= x1; ix++)
      for (let iz = z0; iz <= z1; iz++) {
        const b = this.buckets.get(this._key(ix, iz));
        if (b) for (const box of b) out.add(box);
      }
    return out;
  }

  /** Blockiert die Box einen Körper, dessen Füße auf Höhe y sind? */
  static blocks(b, y) {
    return y + STEP < b.top && y + BODY_H > b.bottom;
  }

  /** Schiebt einen Kreis (x,z,r) aus allen Boxen heraus, die auf Höhe y im Weg sind. Gibt {x,z} zurück. */
  resolve(x, z, r, y = 0) {
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      for (const b of this.query(x, z, r + 0.5)) {
        if (!CollisionWorld.blocks(b, y)) continue;
        const cx = Math.max(b.minX, Math.min(x, b.maxX));
        const cz = Math.max(b.minZ, Math.min(z, b.maxZ));
        let dx = x - cx, dz = z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        if (d2 > 1e-9) {
          const d = Math.sqrt(d2);
          x = cx + (dx / d) * r;
          z = cz + (dz / d) * r;
        } else {
          // Mittelpunkt in der Box: entlang der kürzesten Achse hinaus.
          const pushes = [
            [b.minX - r - x, 0], [b.maxX + r - x, 0],
            [0, b.minZ - r - z], [0, b.maxZ + r - z],
          ];
          pushes.sort((a, c) => Math.abs(a[0] + a[1]) - Math.abs(c[0] + c[1]));
          x += pushes[0][0];
          z += pushes[0][1];
        }
        moved = true;
      }
      if (!moved) break;
    }
    return { x, z };
  }

  /** Höchste begehbare Oberfläche unter (x,z), höchstens step über y. Boden = 0. */
  groundAt(x, z, r, y, step = STEP) {
    let g = 0;
    const m = r * 0.6;
    for (const b of this.query(x, z, r)) {
      if (b.top === Infinity || b.top > y + step) continue;
      if (x < b.minX - m || x > b.maxX + m || z < b.minZ - m || z > b.maxZ + m) continue;
      if (b.top > g) g = b.top;
    }
    return g;
  }

  /** Tiefste Unterkante über dem Kopf (für Kopfstoßen unter schwebenden Plattformen). */
  ceilingAt(x, z, y) {
    let c = Infinity;
    for (const b of this.query(x, z, 0.3)) {
      if (b.bottom === -Infinity || b.bottom < y + BODY_H - 0.25) continue;
      if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) continue;
      c = Math.min(c, b.bottom);
    }
    return c;
  }

  allBoxes() {
    const s = new Set();
    for (const b of this.buckets.values()) for (const box of b) s.add(box);
    return [...s];
  }
}
