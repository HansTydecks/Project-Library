// 2D-Kollision (XZ-Ebene) mit achsenparallelen Boxen in einem Spatial Hash.
const BUCKET = 4;

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

  /** Schiebt einen Kreis (x,z,r) aus allen Boxen heraus. Gibt {x,z} zurück. */
  resolve(x, z, r) {
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      for (const b of this.query(x, z, r + 0.5)) {
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

  allBoxes() {
    const s = new Set();
    for (const b of this.buckets.values()) for (const box of b) s.add(box);
    return [...s];
  }
}
