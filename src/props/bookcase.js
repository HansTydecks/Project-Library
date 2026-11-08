import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere } from '../world/geo.js';
import { fillRow } from '../world/books.js';
import { signTexture } from '../world/textures.js';
import { makeRng } from '../core/rng.js';

// Bücherregal. Vorderseite zeigt nach lokal +z. opts: { width, height, depth, levels, shelf, label, autoFill }
function bookcase(f, opts, kit) {
  const W = opts.width ?? 2, H = opts.height ?? 3.2, D = opts.depth ?? 0.45;
  const m = opts.material ?? 'wood';
  const levels = opts.levels ?? Math.max(2, Math.floor((H - 0.3) / 0.44));
  const side = 0.06, plinth = 0.14, top = 0.1;
  f.add(box(side, H, D, 1), m, [-W / 2 + side / 2, H / 2, 0]);
  f.add(box(side, H, D, 1), m, [W / 2 - side / 2, H / 2, 0]);
  f.add(box(W, plinth, D, 1), 'woodDark', [0, plinth / 2, 0.01]);
  f.add(box(W, top, D, 1), m, [0, H - top / 2, 0]);
  f.add(box(W + 0.12, 0.08, D + 0.08, 1), 'woodDark', [0, H + 0.04, 0.02]);
  f.add(box(W - 2 * side, H - plinth - top, 0.02, 1), 'woodDark', [0, (H + plinth - top) / 2, -D / 2 + 0.01]);
  const usable = H - plinth - top;
  const rowH = usable / levels;
  const rows = [];
  for (let k = 0; k < levels; k++) {
    const y = plinth + k * rowH;
    if (k > 0) f.add(box(W - 2 * side, 0.03, D - 0.03, 1), m, [0, y, 0.0]);
    rows.push({ frame: f, y: y + 0.015, x0: -W / 2 + side + 0.01, x1: W / 2 - side - 0.01, depth: D - 0.04, maxH: rowH - 0.06, worldY: y, texture: opts.texture === true || (opts.texture !== false && f.point(0, y, 0).y > (opts.textureAbove ?? 2.4)) });
  }
  // Kleine Messing-Details, Pilaster, Kranzgesims, Sockelleiste
  f.add(box(0.05, 0.05, 0.02, 0), 'brass', [-W / 2 + side / 2, H - 0.3, D / 2 + 0.005]);
  f.add(box(0.05, 0.05, 0.02, 0), 'brass', [W / 2 - side / 2, H - 0.3, D / 2 + 0.005]);
  for (const s of [-1, 1]) {
    f.add(box(0.09, H - plinth - 0.05, 0.025, 1), 'woodDark', [s * (W / 2 - 0.045), (H + plinth) / 2, D / 2 + 0.012]);
    f.add(box(0.11, 0.06, 0.04, 0), m, [s * (W / 2 - 0.045), H - 0.12, D / 2 + 0.02]);
  }
  f.add(box(W + 0.2, 0.05, D + 0.14, 1), m, [0, H + 0.105, 0.03]);
  f.add(box(W + 0.04, 0.03, 0.03, 1), 'brass', [0, plinth + 0.005, D / 2 + 0.02]);
  // Fundstücke oben auf dem Regal (deterministisch je Regal)
  if (opts.trinkets !== false && !opts.label) {
    const tr = makeRng(`trinket:${kit.id}:${f.point(0, 0, 0).toArray().map((v) => v.toFixed(1)).join(',')}`);
    const y = H + 0.13;
    const n = tr.int(0, 2);
    for (let i = 0; i < n; i++) {
      const x = tr.range(-W / 2 + 0.25, W / 2 - 0.25), kind = tr.int(0, 4);
      if (kind === 0) { f.add(cyl(0.07, 0.055, 0.12, 8), 'terracotta', [x, y + 0.06, 0]); for (let k = 0; k < 4; k++) f.add(sphere(0.06, 6, 4), tr.pick(['leaves', 'leavesPink']), [x + Math.cos(k * 1.6) * 0.04, y + 0.17, Math.sin(k * 1.6) * 0.04]); }
      else if (kind === 1) { f.add(cyl(0.05, 0.06, 0.02, 8), 'woodDark', [x, y + 0.01, 0]); f.add(sphere(0.08, 10, 8), 'pastelSky', [x, y + 0.12, 0]); }
      else if (kind === 2) { for (let k = 0; k < 3; k++) f.add(box(0.22 - k * 0.03, 0.05, 0.16, 0), tr.pick(['woodRed', 'velvetBlue', 'velvetGreen', 'velvet']), [x, y + 0.025 + k * 0.05, 0], [0, k * 0.2, 0]); }
      else if (kind === 3) { f.add(cyl(0.05, 0.05, 0.015, 8), 'brass', [x, y + 0.008, 0]); f.add(cyl(0.022, 0.022, 0.14, 8), 'wax', [x, y + 0.08, 0]); }
      else { f.add(box(0.09, 0.012, 0.09, 0), 'woodDark', [x, y + 0.006, 0]); f.add(new THREE.ConeGeometry(0.035, 0.07, 8), 'glass', [x, y + 0.045, 0], [Math.PI, 0, 0]); f.add(new THREE.ConeGeometry(0.035, 0.07, 8), 'glass', [x, y + 0.115, 0]); f.add(box(0.09, 0.012, 0.09, 0), 'woodDark', [x, y + 0.155, 0]); }
    }
  }
  f.collider(0, 0, W, D);

  if (opts.label) {
    const t = signTexture(opts.label, { w: 512, h: 96, bg: '#1e130b', size: 46 });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(W - 0.2, 1.6), 0.3), new THREE.MeshLambertMaterial({ map: t, emissive: '#3a2410' }));
    f.object(plate, [0, H + 0.26, 0.05]);
    f.add(box(Math.min(W - 0.1, 1.7), 0.38, 0.04, 0), 'woodDark', [0, H + 0.26, 0.02]);
  }

  if (opts.autoFill || !kit.services.shelves) {
    const r = makeRng(opts.seed ?? `${kit.id}:${f.point(0, 0, 0).toArray().join(',')}`);
    for (const row of rows) {
      if (r.chance(opts.emptyChance ?? 0)) continue;
      // Endlose Stapel/Galerien: überwiegend Textur, nur manche Reihen mit Einzelbüchern
      if (opts.autoFill && opts.texture !== false) row.texture = row.texture || !r.chance(opts.detail ?? 0.18);
      fillRow(row, [], r, () => {}, null);
    }
  } else {
    kit.services.shelves.register({ shelf: opts.shelf ?? '_deko', room: kit.room?.id ?? kit.id, kit, rows, mode: opts.mode, capacity: opts.capacity });
  }
  return { rows, width: W, height: H, depth: D };
}

export default [
  defineProp({ name: 'bookcase', create: bookcase }),

  defineProp({
    name: 'bookcaseDouble',
    create(f, opts, kit) {
      const D = opts.depth ?? 0.45;
      bookcase(f.frame([0, 0, D / 2 + 0.01], 0), { ...opts, label: opts.label }, kit);
      bookcase(f.frame([0, 0, -D / 2 - 0.01], Math.PI), { ...opts, label: opts.labelBack ?? opts.label, seed: opts.seed ? `${opts.seed}b` : undefined }, kit);
    },
  }),

  defineProp({
    name: 'ladder',
    create(f, opts) {
      const H = opts.height ?? 3.4, tilt = 0.28;
      const g = f.frame([0, 0, 0], 0);
      for (const x of [-0.25, 0.25]) g.add(box(0.06, H, 0.06, 0), 'woodLight', [x, H / 2 * Math.cos(tilt), H / 2 * Math.sin(tilt)], [-tilt, 0, 0]);
      for (let y = 0.3; y < H - 0.1; y += 0.35) {
        g.add(box(0.5, 0.04, 0.05, 0), 'woodLight', [0, y * Math.cos(tilt), y * Math.sin(tilt)], [-tilt, 0, 0]);
      }
      g.add(box(0.7, 0.04, 0.04, 0), 'brass', [0, H * Math.cos(tilt), H * Math.sin(tilt) - 0.05]);
      for (const x of [-0.25, 0.25]) g.add(cyl(0.05, 0.05, 0.04, 8), 'brass', [x, 0.05, H * Math.sin(tilt) + 0.02], [0, 0, Math.PI / 2]);
    },
  }),

  // Sortierwagen: hier landen Projekte ohne passendes Regal.
  defineProp({
    name: 'bookcart',
    create(f, opts, kit) {
      const W = 1.3, D = 0.55;
      f.add(box(W, 0.04, D, 1), 'woodRed', [0, 0.45, 0]);
      f.add(box(W, 0.04, D, 1), 'woodRed', [0, 0.95, 0]);
      for (const [x, z] of [[-W / 2 + 0.03, -D / 2 + 0.03], [W / 2 - 0.03, -D / 2 + 0.03], [-W / 2 + 0.03, D / 2 - 0.03], [W / 2 - 0.03, D / 2 - 0.03]]) {
        f.add(box(0.04, 1.0, 0.04, 0), 'brass', [x, 0.6, z]);
        f.add(cyl(0.07, 0.07, 0.04, 10), 'black', [x, 0.07, z], [Math.PI / 2, 0, 0]);
      }
      f.add(cyl(0.02, 0.02, D, 6), 'brass', [W / 2 + 0.1, 1.05, 0], [Math.PI / 2, 0, 0]);
      f.collider(0, 0, W + 0.2, D);
      const rows = [
        { frame: f, y: 0.97, x0: -W / 2 + 0.06, x1: W / 2 - 0.06, depth: D - 0.05, maxH: 0.4, worldY: 0.97 },
        { frame: f, y: 0.47, x0: -W / 2 + 0.06, x1: W / 2 - 0.06, depth: D - 0.05, maxH: 0.42, worldY: 0.47 },
      ];
      kit.services.shelves.register({ shelf: 'sortierwagen', room: kit.room.id, kit, rows, capacity: 24, fillerless: true });
      const t = signTexture('Noch einzusortieren', { w: 512, h: 96, bg: '#efe2c4', ink: '#3a2a1a', font: '"Caveat", cursive', size: 60, border: false });
      const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.12), new THREE.MeshLambertMaterial({ map: t }));
      f.object(tag, [0, 0.7, D / 2 + 0.01]);
    },
  }),

  // Neuerscheinungen-Pult: zeigt die neuesten Projekte (Kopien).
  defineProp({
    name: 'newArrivals',
    create(f, opts, kit) {
      f.add(box(1.4, 0.9, 0.6, 1), 'woodDark', [0, 0.45, 0]);
      f.add(box(1.5, 0.05, 0.7, 1), 'wood', [0, 0.92, 0]);
      f.add(box(1.4, 0.05, 0.3, 1), 'wood', [0, 1.02, -0.18], [-0.3, 0, 0]);
      f.collider(0, 0, 1.5, 0.7);
      const t = signTexture('Neuerscheinungen', { w: 512, h: 96 });
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.22), new THREE.MeshLambertMaterial({ map: t, emissive: '#2a1a0a' }));
      f.object(s, [0, 0.6, 0.305]);
      const rows = [{ frame: f.frame([0, 0, -0.05], 0), y: 0.945, x0: -0.6, x1: 0.6, depth: 0.5, maxH: 0.4, worldY: 0.95 }];
      kit.services.shelves.register({ shelf: '__neu', room: kit.room.id, kit, rows, mode: 'newest', capacity: opts.count ?? 4, fillerless: true });
    },
  }),
];
