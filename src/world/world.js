import * as THREE from 'three';
import { Kit, Frame } from './kit.js';
import { box, plane } from './geo.js';
import { mat } from './materials.js';
import { signTexture } from './textures.js';

// Die Welt ist ein Raster aus Zellen (CELL × CELL Meter). Räume belegen eine oder mehrere Zellen.
// Zwischen benachbarten Zellen verschiedener Räume entstehen automatisch Türen.
export const CELL = 16;
export const WALL_T = 0.4;
export const DOOR_W = 2.6;
export const DOOR_H = 3.3;

export const SIDES = {
  north: { dir: [0, -1], rot: 0 },
  south: { dir: [0, 1], rot: Math.PI },
  east: { dir: [1, 0], rot: -Math.PI / 2 },
  west: { dir: [-1, 0], rot: Math.PI / 2 },
};

export function cellKey(cx, cz) { return `${cx},${cz}`; }
export function worldToCell(x, z) {
  return [Math.floor((x + CELL / 2) / CELL), Math.floor((z + CELL / 2) / CELL)];
}

export function roomBounds(def) {
  const [cx, cz] = def.cell;
  const [w, d] = def.size ?? [1, 1];
  return {
    minX: cx * CELL - CELL / 2, maxX: (cx + w) * CELL - CELL / 2,
    minZ: cz * CELL - CELL / 2, maxZ: (cz + d) * CELL - CELL / 2,
    w: w * CELL, d: d * CELL,
    cx: (cx + (w - 1) / 2) * CELL, cz: (cz + (d - 1) / 2) * CELL,
  };
}

/** Berechnet Belegung und Türen. Pure Logik. */
export function layout(defs) {
  const occ = new Map();
  for (const def of defs) {
    const [cx, cz] = def.cell;
    const [w, d] = def.size ?? [1, 1];
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
      const k = cellKey(cx + i, cz + j);
      if (occ.has(k)) console.warn(`[world] Zelle ${k} doppelt belegt: ${occ.get(k)} & ${def.id}`);
      occ.set(k, def.id);
    }
  }
  const byId = new Map(defs.map((d) => [d.id, d]));
  const doors = [];
  const seen = new Set();
  for (const [k, id] of occ) {
    const [cx, cz] = k.split(',').map(Number);
    for (const [nx, nz, axis] of [[cx + 1, cz, 'x'], [cx, cz + 1, 'z']]) {
      const other = occ.get(cellKey(nx, nz));
      if (!other || other === id) continue;
      const a = byId.get(id), b = byId.get(other);
      if (a.closedTo?.includes(other) || b.closedTo?.includes(id)) continue;
      const dk = `${k}|${nx},${nz}`;
      if (seen.has(dk)) continue;
      seen.add(dk);
      const x = axis === 'x' ? cx * CELL + CELL / 2 : cx * CELL;
      const z = axis === 'z' ? cz * CELL + CELL / 2 : cz * CELL;
      doors.push({ a: id, b: other, x, z, axis });
    }
  }
  return { occ, doors, byId };
}

/** Raum-Kontext: ein Frame (Raum-lokal, Ursprung = Raummitte) plus Komfort-Methoden. */
export class RoomCtx extends Frame {
  constructor(kit, def, worldInfo) {
    super(kit, new THREE.Matrix4(), 0);
    this.def = def;
    this.b = roomBounds(def);
    this.hw = this.b.w / 2;
    this.hd = this.b.d / 2;
    this.height = def.height ?? 6;
    this.world_ = worldInfo;
    this.rng = worldInfo.rngFor(def.id);
  }

  get content() { return this.kit.services.content; }

  /** Segmente einer Seite: [{ u0, u1, neighbor, door: u|null }] in Wand-Koordinaten (u entlang der Wand). */
  segments(side) {
    const { b } = this;
    const { occ, doors } = this.world_;
    const horizontal = side === 'north' || side === 'south';
    const len = horizontal ? b.w : b.d;
    const n = Math.round(len / CELL);
    const out = [];
    for (let i = 0; i < n; i++) {
      // Zellmitte in Weltkoordinaten
      let wx, wz, nx, nz;
      if (horizontal) {
        wx = b.minX + CELL * (i + 0.5);
        wz = side === 'north' ? b.minZ + CELL / 2 : b.maxZ - CELL / 2;
        nx = wx; nz = wz + (side === 'north' ? -CELL : CELL);
      } else {
        wz = b.minZ + CELL * (i + 0.5);
        wx = side === 'west' ? b.minX + CELL / 2 : b.maxX - CELL / 2;
        nz = wz; nx = wx + (side === 'west' ? -CELL : CELL);
      }
      const [ncx, ncz] = [Math.round(nx / CELL), Math.round(nz / CELL)];
      const neighbor = occ.get(cellKey(ncx, ncz)) ?? null;
      const door = neighbor && doors.some((d) => Math.abs(d.x - (wx + nx) / 2) < 0.01 && Math.abs(d.z - (wz + nz) / 2) < 0.01);
      // u-Koordinate der Zellmitte
      const lx = wx - b.cx, lz = wz - b.cz;
      const u = { north: lx, south: -lx, east: lz, west: -lz }[side];
      out.push({ u0: u - CELL / 2, u1: u + CELL / 2, u, neighbor, door: door ? u : null });
    }
    out.sort((a, c) => a.u0 - c.u0);
    return out;
  }

  /** Frame an einer Wand: lokales x entlang der Wand, lokales +z zeigt in den Raum. */
  wallFrame(side, inset = 0) {
    const { hw, hd } = this;
    const at = { north: [0, 0, -hd], south: [0, 0, hd], east: [hw, 0, 0], west: [-hw, 0, 0] }[side];
    const f = this.frame(at, SIDES[side].rot);
    return inset ? f.frame([0, 0, inset], 0) : f;
  }

  /** Freie Intervalle entlang einer Wand (ohne Türen), mit Randabstand. */
  freeSpans(side, { margin = 0.6, doorClear = 1.2 } = {}) {
    const segs = this.segments(side);
    const len = segs.length * CELL;
    let spans = [[-len / 2 + WALL_T + margin, len / 2 - WALL_T - margin]];
    for (const s of segs) {
      if (s.door == null) continue;
      const a = s.door - DOOR_W / 2 - doorClear, c = s.door + DOOR_W / 2 + doorClear;
      spans = spans.flatMap(([x0, x1]) => {
        if (c <= x0 || a >= x1) return [[x0, x1]];
        const r = [];
        if (a > x0) r.push([x0, a]);
        if (c < x1) r.push([c, x1]);
        return r;
      });
    }
    return spans.filter(([a, c]) => c - a > 0.5);
  }

  floor(material = 'parquet', { uv = 2, y = 0 } = {}) {
    this.add(plane(this.b.w, this.b.d, uv), material, [0, y, 0], [-Math.PI / 2, 0, 0]);
    return this;
  }

  ceiling(material = 'plaster', { uv = 3, roof = 'roof', beams = 'woodDark' } = {}) {
    const h = this.height;
    this.add(plane(this.b.w, this.b.d, uv), material, [0, h, 0], [Math.PI / 2, 0, 0]);
    // Dach (von außen sichtbar)
    this.add(box(this.b.w + 0.6, 0.5, this.b.d + 0.6, 2), roof, [0, h + 0.25, 0]);
    if (beams) {
      const n = Math.floor(this.b.d / 4);
      for (let i = 1; i < n; i++) {
        const z = -this.hd + (i * this.b.d) / n;
        this.add(box(this.b.w, 0.35, 0.3, 1), beams, [0, h - 0.17, z]);
      }
    }
    return this;
  }

  /** Fundament unter dem Raum (die Bibliothek schwebt auf einem Felsen über den Wolken). */
  foundation({ depth = 30, material = 'stoneDark' } = {}) {
    this.add(box(this.b.w, depth, this.b.d, 3), material, [0, -depth / 2 - 0.01, 0]);
    return this;
  }

  /**
   * Umrandung des Raums.
   * opts: { inner, outer, wainscot, trim, neighbor: 'wall'|'facade', open: 'wall'|'hedge'|'railing'|'none', height }
   */
  enclose(opts = {}) {
    const o = {
      inner: 'wpGreen', outer: 'stone', wainscot: 'paneling', trim: 'woodDark',
      neighbor: 'wall', open: 'wall', height: this.height, ...opts,
    };
    for (const side of Object.keys(SIDES)) {
      const wf = this.wallFrame(side);
      for (const seg of this.segments(side)) {
        const style = seg.neighbor ? o.neighbor : o.open;
        if (typeof style === 'function') style(wf, seg, this, side);
        else EDGE_STYLES[style]?.(wf, seg, o, this, side);
      }
    }
    return this;
  }

  /** Wandregale entlang aller freien Wandstücke einer Seite. */
  wallShelves(side, { id, unit = 2, height = 3.2, depth = 0.45, material = 'wood', levels, margin = 0.6, maxUnits = 99 } = {}) {
    const wf = this.wallFrame(side, WALL_T + 0.02);
    let count = 0;
    for (const [a, c] of this.freeSpans(side, { margin })) {
      const n = Math.floor((c - a) / unit);
      if (!n) continue;
      const start = (a + c) / 2 - (n * unit) / 2;
      for (let i = 0; i < n && count < maxUnits; i++, count++) {
        wf.place('bookcase', { at: [start + unit * (i + 0.5), 0, depth / 2], width: unit, height, depth, material, levels, shelf: id });
      }
    }
    return this;
  }

  /** Hängendes Schild mit Text. */
  sign(text, at, rotY = 0, { w = 2.4, h = 0.6, ...style } = {}) {
    const t = signTexture(text, style);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: t, emissive: '#2a1a0a' }));
    this.frame(at, rotY).object(m);
    this.frame(at, rotY).add(box(w + 0.1, h + 0.1, 0.05, 0), 'woodDark', [0, 0, -0.03]);
    return m;
  }
}

// --- Kantenstile ------------------------------------------------------------
function wallPieces(seg, height, withDoor) {
  // Liefert Stücke [u0,u1,y0,y1] einer Wand, ggf. mit Türöffnung.
  const pieces = [];
  if (withDoor && seg.door != null) {
    const a = seg.door - DOOR_W / 2, c = seg.door + DOOR_W / 2;
    pieces.push([seg.u0, a, 0, height], [c, seg.u1, 0, height], [a, c, DOOR_H, height]);
  } else pieces.push([seg.u0, seg.u1, 0, height]);
  return pieces;
}

function doorCasing(wf, seg, trim, depth = WALL_T) {
  if (seg.door == null) return;
  const u = seg.door, t = 0.16;
  wf.add(box(t, DOOR_H + t, 0.12, 0.5), trim, [u - DOOR_W / 2 - t / 2, (DOOR_H + t) / 2, depth + 0.04]);
  wf.add(box(t, DOOR_H + t, 0.12, 0.5), trim, [u + DOOR_W / 2 + t / 2, (DOOR_H + t) / 2, depth + 0.04]);
  wf.add(box(DOOR_W + 2 * t + 0.2, 0.22, 0.16, 0.5), trim, [u, DOOR_H + t + 0.05, depth + 0.05]);
  // Laibung
  wf.add(box(0.04, DOOR_H, depth, 0.5), trim, [u - DOOR_W / 2 + 0.02, DOOR_H / 2, depth / 2]);
  wf.add(box(0.04, DOOR_H, depth, 0.5), trim, [u + DOOR_W / 2 - 0.02, DOOR_H / 2, depth / 2]);
  wf.add(box(DOOR_W, 0.04, depth, 0.5), trim, [u, DOOR_H - 0.02, depth / 2]);
  // Schlussstein
  wf.add(box(0.3, 0.36, 0.2, 0), 'brass', [u, DOOR_H + 0.25, depth + 0.1]);
}

export const EDGE_STYLES = {
  wall(wf, seg, o) {
    const H = o.height, T = WALL_T;
    const wh = o.wainscot ? 1.15 : 0;
    for (const [u0, u1, y0, y1] of wallPieces(seg, H, true)) {
      const w = u1 - u0;
      if (w <= 0.01) continue;
      const uc = (u0 + u1) / 2;
      wf.add(box(w, y1 - y0, T, 2), o.outer, [uc, (y0 + y1) / 2, T / 2]);
      wf.collider(uc, T / 2, w, T);
      // Innenfläche
      const iy0 = Math.max(y0, wh);
      if (y1 - iy0 > 0.01) wf.add(plane(w, y1 - iy0, 1.4), o.inner, [uc, (iy0 + y1) / 2, T + 0.005]);
      if (wh && y0 < wh) {
        wf.add(box(w, wh, 0.05, 1.1), o.wainscot, [uc, wh / 2, T + 0.025]);
        wf.add(box(w, 0.06, 0.09, 1), o.trim, [uc, wh, T + 0.045]);
      }
      if (o.trim && y0 === 0) wf.add(box(w, 0.16, 0.06, 1), o.trim, [uc, 0.08, T + 0.06]);
      if (o.trim && y1 === H) wf.add(box(w, 0.22, 0.14, 1), o.trim, [uc, H - 0.11, T + 0.07]);
    }
    doorCasing(wf, seg, o.trim ?? 'woodDark');
  },

  facade(wf, seg, o) {
    // Steinfassade (von außen gesehen) mit leuchtenden Fenstern
    const H = o.facadeHeight ?? 9, T = WALL_T;
    for (const [u0, u1, y0, y1] of wallPieces(seg, H, true)) {
      const w = u1 - u0;
      if (w <= 0.01) continue;
      const uc = (u0 + u1) / 2;
      wf.add(box(w, y1 - y0, T, 2), o.facadeMaterial ?? 'stoneLight', [uc, (y0 + y1) / 2, T / 2]);
      wf.collider(uc, T / 2, w, T);
    }
    // Sockel & Gesims
    wf.add(box(seg.u1 - seg.u0, 0.25, 0.25, 1), 'stoneDark', [(seg.u0 + seg.u1) / 2, H - 0.12, T + 0.12]);
    // Fenster
    for (const du of [-5.2, -2.6, 2.6, 5.2]) {
      const u = seg.u + du;
      if (seg.door != null && Math.abs(u - seg.door) < 2.2) continue;
      for (const y of [2.2, 5.6]) {
        if (y + 1.2 > H - 0.5) continue;
        wf.add(box(1.0, 1.7, 0.05, 0), 'window', [u, y, T + 0.01]);
        wf.add(box(1.2, 0.12, 0.2, 0), 'stoneDark', [u, y - 0.9, T + 0.08]);
        wf.add(box(0.06, 1.7, 0.08, 0), 'woodDark', [u, y, T + 0.04]);
        wf.add(box(1.0, 0.06, 0.08, 0), 'woodDark', [u, y + 0.2, T + 0.04]);
        // Rundbogen-Andeutung
        wf.add(box(1.2, 0.14, 0.12, 0), 'stoneDark', [u, y + 0.92, T + 0.06]);
      }
    }
    if (seg.door != null) {
      doorCasing(wf, seg, 'stoneDark');
      wf.glow([seg.door - 1.7, 2.8, T + 0.35], { color: '#ffaa55', size: 0.9, opacity: 0.8 });
      wf.glow([seg.door + 1.7, 2.8, T + 0.35], { color: '#ffaa55', size: 0.9, opacity: 0.8 });
      wf.add(box(0.12, 0.3, 0.12, 0), 'glowWarm', [seg.door - 1.7, 2.8, T + 0.35]);
      wf.add(box(0.12, 0.3, 0.12, 0), 'glowWarm', [seg.door + 1.7, 2.8, T + 0.35]);
      wf.light([seg.door, 3, 1.5], { color: '#ffaa55', intensity: 5, distance: 9, flicker: true });
    }
  },

  hedge(wf, seg, o) {
    const H = 2.6, T = 1.4;
    for (const [u0, u1] of wallPieces(seg, H, true).filter((p) => p[2] === 0)) {
      const w = u1 - u0, uc = (u0 + u1) / 2;
      wf.add(box(w, H, T, 1.5), 'hedge', [uc, H / 2, T / 2]);
      wf.add(box(w - 0.2, 0.3, T - 0.3, 1.5), 'hedge', [uc, H + 0.12, T / 2]);
      wf.collider(uc, T / 2, w, T);
    }
  },

  railing(wf, seg) {
    const H = 1.05, w = seg.u1 - seg.u0, uc = (seg.u0 + seg.u1) / 2;
    wf.add(box(w, 0.12, 0.34, 1), 'stoneLight', [uc, H, 0.2]);
    wf.add(box(w, 0.18, 0.34, 1), 'stoneLight', [uc, 0.09, 0.2]);
    for (let u = seg.u0 + 0.25; u < seg.u1; u += 0.5) {
      wf.add(box(0.14, H - 0.12, 0.14, 0), 'stoneLight', [u, (H) / 2, 0.2]);
    }
    wf.collider(uc, 0.2, w, 0.4);
  },

  none() {},
};

/** Baut alle Räume. Gibt Kits und Metadaten zurück. */
export function buildRooms(defs, services, rngFor) {
  const { occ, doors, byId } = layout(defs);
  const worldInfo = { occ, doors, rngFor };
  const kits = [];
  for (const def of defs) {
    if (def.endless) continue;
    const b = roomBounds(def);
    const kit = new Kit({ id: def.id, origin: [b.cx, 0, b.cz], services, room: def });
    const ctx = new RoomCtx(kit, def, worldInfo);
    try {
      def.build(ctx);
    } catch (err) {
      console.error(`[world] Raum ${def.id} konnte nicht gebaut werden`, err);
    }
    kits.push(kit);
  }
  return { kits, occ, doors, byId };
}
