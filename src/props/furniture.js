import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, plane, lathe } from '../world/geo.js';
import { mat } from '../world/materials.js';

function legs(f, w, d, h, m = 'woodDark', t = 0.07) {
  for (const [x, z] of [[-w / 2 + t, -d / 2 + t], [w / 2 - t, -d / 2 + t], [-w / 2 + t, d / 2 - t], [w / 2 - t, d / 2 - t]]) {
    f.add(box(t, h, t, 0), m, [x, h / 2, z]);
  }
}

export default [
  defineProp({
    name: 'table',
    create(f, opts) {
      const w = opts.width ?? 2.4, d = opts.depth ?? 1.1, h = opts.height ?? 0.78;
      f.add(box(w, 0.06, d, 1), opts.material ?? 'woodRed', [0, h, 0]);
      f.add(box(w - 0.2, 0.1, d - 0.2, 1), 'woodDark', [0, h - 0.08, 0]);
      legs(f, w - 0.1, d - 0.1, h - 0.03);
      if (opts.felt) f.add(plane(w - 0.3, d - 0.3, 0), 'velvetGreen', [0, h + 0.031, 0], [-Math.PI / 2, 0, 0]);
      f.collider(0, 0, w, d, { top: h + 0.03 }); // man kann auf Tische springen
    },
  }),

  defineProp({
    name: 'chair',
    create(f, opts) {
      const m = opts.material ?? 'woodDark';
      f.add(box(0.46, 0.05, 0.46, 0), m, [0, 0.46, 0]);
      f.add(box(0.42, 0.03, 0.42, 0), opts.cushion ?? 'velvet', [0, 0.495, 0]);
      legs(f, 0.46, 0.46, 0.46, m, 0.05);
      f.add(box(0.05, 0.5, 0.05, 0), m, [-0.2, 0.75, -0.21]);
      f.add(box(0.05, 0.5, 0.05, 0), m, [0.2, 0.75, -0.21]);
      f.add(box(0.44, 0.18, 0.04, 0), m, [0, 0.88, -0.21]);
      f.add(box(0.3, 0.05, 0.03, 0), m, [0, 0.68, -0.21]);
      f.collider(0, 0, 0.5, 0.5, { top: 0.5 });
    },
  }),

  defineProp({
    name: 'armchair',
    create(f, opts, kit) {
      const c = opts.cushion ?? 'velvet';
      f.add(box(0.9, 0.42, 0.85, 0), c, [0, 0.26, 0]);
      f.add(box(0.9, 0.75, 0.22, 0), c, [0, 0.72, -0.34]);
      f.add(box(0.18, 0.32, 0.8, 0), c, [-0.42, 0.6, 0]);
      f.add(box(0.18, 0.32, 0.8, 0), c, [0.42, 0.6, 0]);
      f.add(box(0.64, 0.1, 0.6, 0), c, [0, 0.52, 0.06]);
      for (const x of [-0.4, 0.4]) for (const z of [-0.36, 0.36]) f.add(cyl(0.04, 0.03, 0.06, 6), 'woodDark', [x, 0.03, z]);
      // Wolldecke
      f.add(box(0.7, 0.03, 0.5, 0), opts.blanket ?? 'cloth', [0.05, 0.58, 0.1], [0, 0.2, 0.05]);
      f.collider(0, 0, 0.95, 0.9, { top: 0.5 });
      if (opts.interact !== false) {
        f.hitbox([0, 0.6, 0], [0.9, 0.8, 0.9], {
          label: 'Gemütlicher Sessel', verb: 'Hinsetzen',
          onInteract: () => kit.services.ui.toast(opts.quip ?? 'Du sinkst kurz in den Sessel. Ahh. Weiter geht\'s.'),
        });
      }
    },
  }),

  defineProp({
    name: 'sofa',
    create(f, opts) {
      const w = opts.width ?? 2.2, c = opts.cushion ?? 'velvetGreen';
      f.add(box(w, 0.42, 0.9, 0), c, [0, 0.26, 0]);
      f.add(box(w, 0.6, 0.22, 0), c, [0, 0.72, -0.35]);
      f.add(box(0.2, 0.3, 0.9, 0), c, [-w / 2 + 0.1, 0.6, 0]);
      f.add(box(0.2, 0.3, 0.9, 0), c, [w / 2 - 0.1, 0.6, 0]);
      for (let i = 0; i < 2; i++) f.add(box(w / 2 - 0.25, 0.1, 0.62, 0), c, [(i - 0.5) * (w / 2 - 0.15), 0.52, 0.07]);
      f.add(box(0.36, 0.3, 0.1, 0), 'velvet', [-w / 2 + 0.4, 0.7, -0.2], [0, 0.3, 0.2]);
      f.collider(0, 0, w, 0.95, { top: 0.5 });
    },
  }),

  defineProp({
    name: 'desk',
    create(f, opts) {
      const w = opts.width ?? 1.8, d = opts.depth ?? 0.85;
      f.add(box(w, 0.06, d, 1), 'woodRed', [0, 0.8, 0]);
      f.add(box(0.5, 0.77, d - 0.06, 1), 'woodDark', [-w / 2 + 0.27, 0.385, 0]);
      f.add(box(0.5, 0.77, d - 0.06, 1), 'woodDark', [w / 2 - 0.27, 0.385, 0]);
      for (const x of [-w / 2 + 0.27, w / 2 - 0.27]) for (const y of [0.2, 0.45, 0.68]) {
        f.add(box(0.44, 0.2, 0.01, 0), 'wood', [x, y, d / 2 - 0.02]);
        f.add(sphere(0.02, 6, 4), 'brass', [x, y, d / 2]);
      }
      f.add(plane(w - 0.3, d - 0.25, 0), 'velvetGreen', [0, 0.831, 0], [-Math.PI / 2, 0, 0]);
      f.collider(0, 0, w, d, { top: 0.82 });
    },
  }),

  defineProp({
    name: 'receptionDesk',
    create(f) {
      // Großer, geschwungener Empfangstresen (Front zeigt nach +z)
      const segs = 9, R = 2.6, arc = Math.PI * 0.75;
      for (let i = 0; i < segs; i++) {
        const a = -arc / 2 + (i + 0.5) * (arc / segs);
        const x = Math.sin(a) * R, z = Math.cos(a) * R - R + 0.4;
        const sw = (arc / segs) * R + 0.04;
        f.add(box(sw, 1.05, 0.12, 1), 'woodRed', [x, 0.525, z], [0, a, 0]);
        f.add(box(sw, 0.06, 0.6, 1), 'woodDark', [x - Math.sin(a) * 0.24, 1.08, z - Math.cos(a) * 0.24], [0, a, 0]);
        f.add(box(sw * 0.7, 0.6, 0.02, 0), 'paneling', [x + Math.sin(a) * 0.065, 0.55, z + Math.cos(a) * 0.065], [0, a, 0]);
        f.add(box(sw, 0.05, 0.05, 0), 'brass', [x + Math.sin(a) * 0.07, 0.9, z + Math.cos(a) * 0.07], [0, a, 0]);
        f.collider(x - Math.sin(a) * 0.2, z - Math.cos(a) * 0.2, sw * 0.9, 0.55);
      }
    },
  }),

  defineProp({
    name: 'bench',
    create(f, opts) {
      const w = opts.width ?? 1.8;
      for (let i = 0; i < 4; i++) f.add(box(w, 0.04, 0.1, 1), 'woodLight', [0, 0.45, -0.18 + i * 0.12]);
      for (let i = 0; i < 3; i++) f.add(box(w, 0.08, 0.03, 1), 'woodLight', [0, 0.65 + i * 0.13, -0.28], [-0.15, 0, 0]);
      for (const x of [-w / 2 + 0.1, w / 2 - 0.1]) {
        f.add(box(0.06, 0.45, 0.45, 0), 'iron', [x, 0.225, 0]);
        f.add(box(0.06, 0.5, 0.06, 0), 'iron', [x, 0.7, -0.29]);
      }
      f.collider(0, 0, w, 0.55, { top: 0.48 });
    },
  }),

  defineProp({
    name: 'rug',
    create(f, opts) {
      const w = opts.width ?? 3, d = opts.depth ?? 4;
      const m = mat(opts.material ?? 'carpetRed');
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
      f.object(mesh, [0, 0.012, 0], [-Math.PI / 2, 0, opts.rot2 ?? 0]);
    },
  }),

  defineProp({
    name: 'sideTable',
    create(f, opts) {
      f.add(cyl(0.32, 0.32, 0.04, 16), 'woodRed', [0, 0.6, 0]);
      f.add(cyl(0.04, 0.05, 0.58, 8), 'woodDark', [0, 0.3, 0]);
      f.add(cyl(0.2, 0.24, 0.04, 12), 'woodDark', [0, 0.02, 0]);
      f.collider(0, 0, 0.6, 0.6, { top: 0.62 });
    },
  }),

  defineProp({
    name: 'bookPile',
    create(f, opts, kit) {
      // Lose Stapel auf dem Boden/Tisch (Füllbücher)
      const r = kit.services.rng(`${kit.id}pile${f.point(0, 0, 0).x.toFixed(2)}`);
      let y = opts.y ?? 0;
      const n = opts.count ?? r.int(3, 7);
      for (let i = 0; i < n; i++) {
        const t = r.range(0.04, 0.08), w = r.range(0.2, 0.3), d = r.range(0.16, 0.22);
        f.filler([r.range(-0.03, 0.03), y + t / 2, r.range(-0.03, 0.03)], [w, t, d], r.pick(['#6b1f24', '#2b4a35', '#1f3a5a', '#6a4a20', '#4a2a5a', '#5a3a1a']), (r.next() * 1e9) | 0, [0, r.range(-0.4, 0.4), 0]);
        y += t;
      }
    },
  }),

  defineProp({
    name: 'pedestal',
    create(f, opts) {
      f.add(lathe([[0, 0], [0.32, 0], [0.32, 0.08], [0.22, 0.12], [0.18, 0.9], [0.26, 0.95], [0.3, 1.02], [0, 1.02]], 16), opts.material ?? 'stoneLight', [0, 0, 0]);
      f.collider(0, 0, 0.6, 0.6, { top: 0.95 });
    },
  }),
];
