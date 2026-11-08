import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, lathe, torus } from '../world/geo.js';
import { mat, hdr } from '../world/materials.js';
import { tex } from '../world/textures.js';

// Kerzen, Lampen, Kronleuchter, Laternen.
function flame(f, at, size = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.018 * size, 8, 6), mat('flame'));
  m.scale.set(1, 2.2, 1);
  f.object(m, at);
  const g = f.glow([at[0], at[1] + 0.01, at[2]], { color: '#ffaa44', size: 0.35 * size, opacity: 0.8 });
  return { m, g };
}

function flickerUpdate(kit, parts, seed) {
  kit.onUpdate((dt, t) => {
    const f = 0.85 + 0.1 * Math.sin(t * 11 + seed) + 0.05 * Math.sin(t * 27 + seed * 2);
    for (const { m, g } of parts) {
      m.scale.y = 2.2 * f; g.material.opacity = 0.6 + 0.3 * f;
    }
  });
}

export default [
  defineProp({
    name: 'candle',
    create(f, opts, kit) {
      const h = opts.height ?? 0.18;
      f.add(cyl(0.025, 0.028, h, 10), 'wax', [0, h / 2, 0]);
      f.add(cyl(0.05, 0.06, 0.02, 12), 'brass', [0, 0.01, 0]);
      const p = flame(f, [0, h + 0.03, 0]);
      flickerUpdate(kit, [p], Math.random() * 10);
      if (opts.light !== false) f.light([0, h + 0.15, 0], { color: '#ffa850', intensity: opts.intensity ?? 3, distance: 5, flicker: true });
    },
  }),

  defineProp({
    name: 'candelabra',
    create(f, opts, kit) {
      f.add(lathe([[0, 0], [0.12, 0], [0.1, 0.03], [0.03, 0.06], [0.025, 0.35], [0.05, 0.38], [0, 0.4]]), 'brass', [0, 0, 0]);
      const parts = [];
      for (const x of [-0.16, 0, 0.16]) {
        const y = x === 0 ? 0.52 : 0.45;
        if (x) f.add(box(Math.abs(x), 0.02, 0.02, 0), 'brass', [x / 2, 0.38, 0]);
        f.add(cyl(0.04, 0.02, 0.04, 8), 'brass', [x, y - 0.06, 0]);
        f.add(cyl(0.02, 0.022, 0.14, 8), 'wax', [x, y + 0.03, 0]);
        parts.push(flame(f, [x, y + 0.13, 0]));
      }
      flickerUpdate(kit, parts, Math.random() * 10);
      f.light([0, 0.75, 0], { color: '#ffa850', intensity: opts.intensity ?? 5, distance: 7, flicker: true });
    },
  }),

  defineProp({
    name: 'bankerLamp',
    create(f, opts) {
      f.add(cyl(0.08, 0.1, 0.03, 12), 'brass', [0, 0.015, 0]);
      f.add(cyl(0.012, 0.012, 0.32, 6), 'brass', [0, 0.17, 0]);
      f.add(cyl(0.03, 0.17, 0.12, 14, 1), 'lampShadeGreen', [0, 0.36, 0.02], [0.15, 0, 0]);
      f.add(box(0.25, 0.01, 0.04, 0), 'glowWarm', [0, 0.3, 0.02]);
      f.glow([0, 0.28, 0.05], { color: '#ffd090', size: 0.5, opacity: 0.5 });
      if (opts.light !== false) f.light([0, 0.45, 0.2], { color: '#ffd29a', intensity: 3.5, distance: 4.5 });
    },
  }),

  defineProp({
    name: 'chandelier',
    create(f, opts, kit) {
      const y = opts.y ?? 5;
      const r = opts.radius ?? 0.9;
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 6, 32), mat('brass')));
      g.children[0].rotation.x = Math.PI / 2;
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, opts.chain ?? 2, 4), mat('iron'));
      chain.position.y = (opts.chain ?? 2) / 2; g.add(chain);
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), mat('brass'));
      g.add(center);
      const n = opts.candles ?? 8;
      const parts = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(r, 0.02, 0.02), mat('brass'));
        arm.position.set(x / 2, 0, z / 2); arm.rotation.y = -a; g.add(arm);
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.16, 8), mat('wax'));
        c.position.set(x, 0.1, z); g.add(c);
        const fl = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), mat('flame'));
        fl.scale.set(1, 2.2, 1); fl.position.set(x, 0.21, z); g.add(fl);
        const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.glow(), color: '#ffaa44', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
        gl.scale.setScalar(0.4); gl.position.copy(fl.position); g.add(gl);
        parts.push({ m: fl, g: gl });
      }
      f.object(g, [0, y, 0]);
      const seed = Math.random() * 10;
      kit.onUpdate((dt, t) => {
        g.rotation.y = Math.sin(t * 0.3 + seed) * 0.03;
        g.rotation.z = Math.sin(t * 0.5 + seed) * 0.01;
        for (const p of parts) { const k = 0.85 + 0.15 * Math.sin(t * 13 + p.m.position.x * 10); p.m.scale.y = 2.2 * k; p.g.material.opacity = 0.5 + 0.35 * k; }
      });
      f.light([0, y - 0.2, 0], { color: '#ffb060', intensity: opts.intensity ?? 14, distance: opts.distance ?? 13, flicker: true, priority: 3 });
    },
  }),

  defineProp({
    name: 'lantern',
    create(f, opts, kit) {
      // Hängende oder stehende Laterne
      const y = opts.y ?? 0;
      const g = new THREE.Group();
      const frame = mat('iron');
      for (const [x, z] of [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]]) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.02), frame); p.position.set(x, 0, z); g.add(p);
      }
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.14, 4), frame); top.position.y = 0.23; top.rotation.y = Math.PI / 4; g.add(top);
      const bottom = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.24), frame); bottom.position.y = -0.16; g.add(bottom);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 4, 10), frame); ring.position.y = 0.33; g.add(ring);
      const core = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.26, 0.17), new THREE.MeshBasicMaterial({ color: hdr(opts.color ?? '#ffb050', 2.4), transparent: true, opacity: 0.85 }));
      g.add(core);
      if (opts.hanging) {
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, opts.chain ?? 1, 4), frame);
        chain.position.y = 0.33 + (opts.chain ?? 1) / 2; g.add(chain);
      }
      f.object(g, [0, y, 0]);
      const gl = f.glow([0, y, 0], { color: opts.color ?? '#ffaa44', size: 1.2, opacity: 0.6 });
      const seed = Math.random() * 10;
      kit.onUpdate((dt, t) => {
        if (opts.hanging) g.rotation.z = Math.sin(t * 0.8 + seed) * 0.05;
        gl.material.opacity = 0.5 + 0.12 * Math.sin(t * 7 + seed);
      });
      if (opts.light !== false) f.light([0, y, 0], { color: opts.color ?? '#ffaa50', intensity: opts.intensity ?? 5, distance: opts.distance ?? 7, flicker: true });
    },
  }),

  defineProp({
    name: 'floorLamp',
    create(f, opts) {
      f.add(cyl(0.18, 0.22, 0.05, 14), 'brass', [0, 0.025, 0]);
      f.add(cyl(0.02, 0.02, 1.5, 6), 'brass', [0, 0.78, 0]);
      f.add(cyl(0.16, 0.3, 0.32, 16, 1), 'lampShade', [0, 1.6, 0]);
      f.add(sphere(0.06, 8, 6), 'glowWarm', [0, 1.52, 0]);
      f.glow([0, 1.55, 0], { color: '#ffcc88', size: 1.1, opacity: 0.55 });
      f.light([0, 1.5, 0], { color: '#ffcc88', intensity: opts.intensity ?? 5, distance: 6 });
      f.collider(0, 0, 0.4, 0.4);
    },
  }),

  defineProp({
    name: 'sconce',
    create(f, opts, kit) {
      // Wandleuchte; lokal +z zeigt in den Raum
      f.add(box(0.12, 0.25, 0.04, 0), 'brass', [0, 0, 0.02]);
      f.add(box(0.03, 0.03, 0.2, 0), 'brass', [0, -0.04, 0.12]);
      f.add(cyl(0.05, 0.03, 0.05, 8), 'brass', [0, -0.03, 0.22]);
      f.add(cyl(0.02, 0.022, 0.12, 8), 'wax', [0, 0.04, 0.22]);
      const p = flame(f, [0, 0.13, 0.22]);
      flickerUpdate(kit, [p], Math.random() * 10);
      if (opts.light !== false) f.light([0, 0.2, 0.5], { color: '#ffa850', intensity: opts.intensity ?? 3.5, distance: 6, flicker: true });
    },
  }),
];

export { flame };
