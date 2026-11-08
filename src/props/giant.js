import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, torus } from '../world/geo.js';
import { mat } from '../world/materials.js';

// Stube der Riesin: Alltagsdinge in XXL. Man fühlt sich wie eine Maus – und kann auf alles klettern.
const BOOK_COLORS = ['#c0405a', '#3a6ac0', '#3a9a6a', '#e0a030', '#9a5ad0', '#e06a3a'];
const bookMats = new Map();
function bookMat(c) {
  if (!bookMats.has(c)) bookMats.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 }));
  return bookMats.get(c);
}

export default [
  // Liegendes Riesenbuch – begehbar (Treppenstufe)
  defineProp({
    name: 'giantBook',
    create(f, opts, kit) {
      const w = opts.width ?? 2.2, d = opts.depth ?? 1.6, h = opts.thick ?? 0.5;
      const c = opts.color ?? BOOK_COLORS[Math.abs(Math.round((opts.at?.[0] ?? 0) * 3 + (opts.at?.[2] ?? 0) * 7)) % BOOK_COLORS.length];
      f.add(box(w, 0.06, d, 0), bookMat(c), [0, 0.03, 0]);
      f.add(box(w, 0.06, d, 0), bookMat(c), [0, h - 0.03, 0]);
      f.add(box(0.08, h, d, 0), bookMat(c), [-w / 2 + 0.04, h / 2, 0]);
      f.add(box(w - 0.12, h - 0.1, d - 0.08, 1), 'pages', [0.03, h / 2, 0]);
      f.add(box(0.1, 0.01, d + 0.001, 0), 'gold', [-w / 2 + 0.3, h, 0]);
      f.collider(0, 0, w, d, { top: h, bottom: 0 }); // auch gestapelt begehbar
    },
  }),

  // Riesiger Bleistift (liegend, begehbar)
  defineProp({
    name: 'giantPencil',
    create(f, opts) {
      const L = opts.length ?? 5, r = opts.radius ?? 0.3;
      f.add(cyl(r, r, L, 6), 'pastelLemon', [0, r, 0], [0, 0, Math.PI / 2]);
      f.add(cone(r, 0.9, 6), 'woodLight', [L / 2 + 0.45, r, 0], [0, 0, -Math.PI / 2]);
      f.add(cone(r * 0.3, 0.27, 6), 'black', [L / 2 + 0.765, r, 0], [0, 0, -Math.PI / 2]);
      f.add(cyl(r * 1.02, r * 1.02, 0.35, 12), 'brass', [-L / 2 - 0.17, r, 0], [0, 0, Math.PI / 2]);
      f.add(cyl(r, r, 0.4, 12), 'pastelPink', [-L / 2 - 0.55, r, 0], [0, 0, Math.PI / 2]);
      f.collider(0, 0, L + 1.6, r * 1.8, { top: r * 2 });
    },
  }),

  // Riesenbrille auf dem Boden
  defineProp({
    name: 'giantGlasses',
    create(f) {
      for (const s of [-1, 1]) {
        f.add(torus(0.55, 0.06, 8, 32), 'black', [s * 0.7, 0.06, 0], [Math.PI / 2, 0, 0]);
        f.add(new THREE.CircleGeometry(0.5, 24), 'glass', [s * 0.7, 0.07, 0], [-Math.PI / 2, 0, 0]);
        f.add(box(0.08, 0.08, 1.8, 0), 'black', [s * 1.25, 0.06, -0.9]);
      }
      f.add(torus(0.18, 0.05, 6, 12, Math.PI), 'black', [0, 0.06, 0], [Math.PI / 2, 0, 0]);
    },
  }),

  // Riesiges Wollknäuel mit Faden (begehbar)
  defineProp({
    name: 'yarnBall',
    create(f, opts) {
      const R = opts.radius ?? 0.9, m = opts.material ?? 'pastelPink';
      f.add(sphere(R, 20, 14), m, [0, R, 0]);
      for (let i = 0; i < 6; i++) f.add(torus(R * 1.005, 0.04, 4, 32), 'pastelLilac', [0, R, 0], [i * 0.5, i * 1.1, 0]);
      f.add(cyl(0.04, 0.04, 3, 4), 'pastelLilac', [R + 1.4, 0.04, 0.3], [0, 0.3, Math.PI / 2]);
      f.collider(0, 0, R * 1.5, R * 1.5, { top: R * 1.9 });
    },
  }),

  // Riesenknopf als runde Plattform
  defineProp({
    name: 'giantButton',
    create(f, opts) {
      const R = opts.radius ?? 1, h = opts.height ?? 0.25;
      f.add(cyl(R, R, h, 24), opts.material ?? 'pastelSky', [0, h / 2, 0]);
      f.add(torus(R * 0.9, 0.05, 6, 24), opts.material ?? 'pastelSky', [0, h, 0], [Math.PI / 2, 0, 0]);
      for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) f.add(cyl(0.08, 0.08, 0.02, 10), 'black', [x * R, h + 0.005, z * R]);
      f.collider(0, 0, R * 1.6, R * 1.6, { top: h });
    },
  }),

  // Riesige Teetasse – man kann hineinspringen
  defineProp({
    name: 'giantCup',
    create(f, opts, kit) {
      const R = opts.radius ?? 1.3, H = opts.height ?? 1.4;
      f.add(cyl(R * 1.5, R * 1.2, 0.12, 28), 'porcelain', [0, 0.06, 0]);
      f.add(new THREE.LatheGeometry([[0, 0.12], [R * 0.7, 0.12], [R, H * 0.6], [R * 1.05, H], [R * 0.97, H], [R * 0.92, H * 0.6], [R * 0.65, 0.2], [0, 0.2]].map(([x, y]) => new THREE.Vector2(x, y)), 28), 'porcelain', [0, 0, 0]);
      f.add(torus(R * 0.4, 0.1, 8, 16), 'porcelain', [R * 1.1, H * 0.55, 0]);
      f.add(new THREE.CircleGeometry(R * 0.9, 24), 'tea', [0, H * 0.55, 0], [-Math.PI / 2, 0, 0]);
      f.add(torus(R * 1.01, 0.03, 4, 28), 'gold', [0, H * 0.85, 0], [Math.PI / 2, 0, 0]);
      f.collider(0, 0, R * 1.7, R * 1.7, { top: H * 0.55 });
      const steam = [];
      for (let i = 0; i < 4; i++) steam.push(f.glow([((i % 2) - 0.5) * 0.6, H + 0.4, 0], { color: '#ffffff', size: 0.9, opacity: 0.18 }));
      const by = f.point(0, 0, 0).y;
      kit.onUpdate((dt, t) => steam.forEach((s, i) => {
        const k = (t * 0.4 + i * 0.25) % 1;
        s.position.y = by + H + 0.3 + k * 1.2; s.material.opacity = 0.2 * (1 - k);
      }));
    },
  }),

  // Riesiger Fingerhut
  defineProp({
    name: 'giantThimble',
    create(f, opts) {
      const R = opts.radius ?? 0.7, H = opts.height ?? 1.1;
      f.add(cyl(R * 0.85, R, H, 24), 'brass', [0, H / 2, 0]);
      f.add(sphere(R * 0.85, 20, 8), 'brass', [0, H, 0], [0, 0, 0], [1, 0.35, 1]);
      f.collider(0, 0, R * 1.6, R * 1.6, { top: H + R * 0.28 });
    },
  }),
];
