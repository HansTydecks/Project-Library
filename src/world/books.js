import * as THREE from 'three';
import { mat } from './materials.js';
import { spineTexture, coverTexture, shade } from './textures.js';
import { makeRng, hashString } from '../core/rng.js';
import { FILLER_COLORS } from './bookTitles.js';
import { assignProjects, CART } from './placement.js';

// Regal-Registry, Buch-Meshes und das Befüllen der Regale.

export function createShelfRegistry() {
  const units = []; // { shelf, room, kit, rows:[{frame, y, x0, x1, depth, maxH}], mode }
  return {
    units,
    register(unit) { units.push(unit); },
    shelves() {
      const map = new Map();
      for (const u of units) {
        const k = `${u.room}/${u.shelf}`;
        if (!map.has(k)) map.set(k, { id: u.shelf, room: u.room, capacity: 0, mode: u.mode, units: [] });
        const s = map.get(k);
        s.units.push(u);
        s.capacity += u.capacity ?? u.rows.length * 5;
      }
      return [...map.values()];
    },
  };
}

// Box mit nur 3 Materialgruppen (Deckel, Rücken, Rest per Vertexfarbe) → 3 statt 6 Draw Calls.
function bookGeometry(dims, color) {
  const g = new THREE.BoxGeometry(dims.t, dims.h, dims.d);
  const idx = g.index.array;
  const face = (f) => Array.from(idx.slice(f * 6, f * 6 + 6));
  // Faces: 0:+x 1:-x 2:+y 3:-y 4:+z 5:-z
  const order = [...face(0), ...face(4), ...face(1), ...face(2), ...face(3), ...face(5)];
  g.setIndex(order);
  g.clearGroups();
  g.addGroup(0, 6, 0); g.addGroup(6, 6, 1); g.addGroup(12, 24, 2);
  const cols = new Float32Array(g.attributes.position.count * 3);
  const c = new THREE.Color(shade(color, -0.05)), page = new THREE.Color('#e3d6b8');
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) (f === 1 ? c : page).toArray(cols, (f * 4 + v) * 3);
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  return g;
}

export function projectColor(p) {
  if (p.color) return p.color;
  return FILLER_COLORS[hashString(p.id ?? p.title) % FILLER_COLORS.length];
}

export function bookDims(p) {
  const len = (p.description ?? '').length;
  const t = 0.05 + Math.min(len / 500, 1) * 0.06;
  const r = makeRng(`dims:${p.id}`);
  return { t, h: r.range(0.29, 0.36), d: 0.23 };
}

/** Echtes Projekt-Buch als eigenes Mesh. */
export function createBookMesh(p, dims = bookDims(p)) {
  const color = projectColor(p);
  const gold = p.status !== 'wip';
  const spine = new THREE.MeshLambertMaterial({ map: spineTexture({ title: p.title, color, gold, year: p.year }) });
  const cover = new THREE.MeshLambertMaterial({ map: coverTexture({ title: p.title, color, gold, subtitle: p.kind === 'blog' ? 'Aus dem Blog' : (p.year ? String(p.year) : '') }) });
  const back = new THREE.MeshLambertMaterial({ vertexColors: true });
  const mesh = new THREE.Mesh(bookGeometry(dims, color), [cover, spine, back]);
  mesh.userData.project = p;
  mesh.userData.dims = dims;
  mesh.userData.glowMats = [spine, cover, back];
  if (p.status === 'wip') {
    // Lesezeichenband
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.12, 0.002), mat('velvet'));
    ribbon.position.set(0, -dims.h / 2 - 0.05, dims.d / 2 - 0.03);
    mesh.add(ribbon);
  }
  return mesh;
}

export function setBookGlow(mesh, amount) {
  for (const m of mesh.userData.glowMats ?? []) m.emissive.setRGB(amount * 0.35, amount * 0.25, amount * 0.08);
}

/** Verteilt Projekte auf Regale und befüllt alle Regalzeilen. */
export function populateShelves({ registry, projects, onRealBook }) {
  const shelves = registry.shelves();
  const { byShelf, unplaced } = assignProjects(projects, shelves);
  if (unplaced.length) console.warn('[books] Kein Platz für', unplaced.map((p) => p.id));
  for (const s of shelves) {
    const list = byShelf.get(`${s.room}/${s.id}`) ?? [];
    const rows = s.units.flatMap((u) => u.rows.map((r) => ({ ...r, unit: u })));
    const r = makeRng(`shelf:${s.room}/${s.id}`);
    // Echte Bücher auf Augenhöhe bevorzugen
    const order = rows
      .map((row, i) => ({ i, score: Math.abs(row.worldY + 0.15 - 1.35) + r.next() * 0.4 }))
      .sort((a, b) => a.score - b.score)
      .map((x) => x.i);
    const perRow = rows.map(() => []);
    list.forEach((p, k) => perRow[order[k % Math.max(order.length, 1)]]?.push(p));
    rows.forEach((row, i) => fillRow(row, perRow[i], r, onRealBook, s));
  }
  return { shelves, byShelf };
}

export function fillRow(row, reals, r, onRealBook, shelf) {
  const { frame: f, y, x0, x1, depth, maxH } = row;
  const width = x1 - x0;
  if (row.texture && !reals.length) {
    // Günstige Variante: eine Fläche mit Buchwand-Textur statt vieler Einzelbücher
    const hh = maxH * 0.94;
    const g = new THREE.PlaneGeometry(width, hh);
    const uv = g.attributes.uv;
    const off = r.next(), tile = 1.4;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (width / tile) + off);
    f.add(g, `bookwall${r.int(0, 3)}`, [(x0 + x1) / 2, y + hh / 2, depth / 2 - 0.12]);
    // ein paar echte Bücher, die vorstehen – für Tiefe
    if (r.chance(row.sprinkle ?? 0.25)) {
      const n = r.int(1, 3);
      for (let k = 0; k < n; k++) {
        const t = r.range(0.03, 0.07), h = Math.min(maxH - 0.03, r.range(0.22, maxH * 0.9)), d = 0.2;
        f.filler([r.range(x0 + 0.1, x1 - 0.1), y + h / 2, depth / 2 - d / 2 - r.range(0, 0.04)], [t, h, d], r.pick(FILLER_COLORS), (r.next() * 1e9) | 0, [0, 0, r.chance(0.2) ? -0.2 : 0]);
      }
    }
    return;
  }
  const fillerOnly = !row.unit?.fillerless;
  const items = reals.map((p) => ({ real: p, dims: bookDims(p) }));
  let used = items.reduce((s, it) => s + it.dims.t + 0.004, 0);
  const fillers = [];
  if (fillerOnly) {
    while (used < width - 0.1) {
      const t = r.range(0.025, 0.085);
      const kind = r.next();
      if (kind < 0.04) { fillers.push({ gap: r.range(0.05, 0.2) }); used += 0.12; continue; }
      fillers.push({ t, h: Math.min(maxH - 0.02, r.range(0.2, maxH * 0.95)), d: r.range(0.17, Math.min(0.3, depth - 0.04)), c: r.pick(FILLER_COLORS), seed: (r.next() * 1e9) | 0 });
      used += t + 0.003;
    }
  }
  // Echte Bücher zufällig einstreuen
  const seq = fillers.slice();
  for (const it of items) seq.splice(r.int(0, seq.length), 0, it);
  // Auf Breite kürzen
  let total = 0;
  const fitted = [];
  for (const it of seq) {
    const w = it.gap ?? (it.real ? it.dims.t + 0.004 : it.t + 0.003);
    if (total + w > width && !it.real) continue;
    fitted.push(it); total += w;
  }
  // Manchmal: liegender Stapel am Ende oder ein angelehntes Buch
  let x = x0 + Math.max(0, (width - total) * r.next() * 0.3);
  const zFront = depth / 2 - 0.02;
  for (let i = 0; i < fitted.length; i++) {
    const it = fitted[i];
    if (it.gap) { x += it.gap; continue; }
    if (it.real) {
      const d = it.dims;
      const pos = [x + d.t / 2, y + d.h / 2, zFront - d.d / 2];
      onRealBook(it.real, f, pos, d, shelf, row);
      x += d.t + 0.004;
    } else {
      const lean = (i === fitted.length - 1 && r.chance(0.3)) ? -0.25 : 0;
      f.filler([x + it.t / 2 + (lean ? 0.04 : 0), y + it.h / 2, zFront - it.d / 2 - r.range(0, 0.02)], [it.t, it.h, it.d], it.c, it.seed, [0, 0, lean]);
      x += it.t + 0.003;
    }
  }
  // Liegender Stapel im Restplatz
  const rest = x1 - x;
  if (rest > 0.3 && r.chance(0.5)) {
    let yy = y;
    const n = r.int(2, 4);
    for (let k = 0; k < n; k++) {
      const t = r.range(0.03, 0.06), w = r.range(0.2, 0.26);
      f.filler([x + 0.05 + w / 2 + r.range(-0.02, 0.02), yy + t / 2, zFront - 0.12], [t, w, r.range(0.17, 0.22)], r.pick(FILLER_COLORS), (r.next() * 1e9) | 0, [0, r.range(-0.2, 0.2), Math.PI / 2]);
      yy += t;
    }
  }
}

export { CART };
