import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, torus } from '../world/geo.js';
import { mat } from '../world/materials.js';

// Lesebad: ein Becken, auf dessen Wasser man laufen kann, eine Wanne voller Schaum, trocknende Bücher.
export default [
  defineProp({
    name: 'bathPool',
    create(f, opts, kit) {
      const W = opts.width ?? 8, D = opts.depth ?? 6, rim = 0.25, T = 0.4, wy = 0.18;
      // Rand (begehbar, 25 cm hoch → ohne Sprung erreichbar)
      for (const [x, z, w, d] of [[0, -D / 2 - T / 2, W + 2 * T, T], [0, D / 2 + T / 2, W + 2 * T, T], [-W / 2 - T / 2, 0, T, D], [W / 2 + T / 2, 0, T, D]]) {
        f.add(box(w, rim, d, 1), 'tilesWhite', [x, rim / 2, z]);
        f.collider(x, z, w, d, { top: rim, bottom: 0 });
      }
      f.add(box(W, 0.04, D, 1), 'tilesBlue', [0, 0.02, 0]);
      const water = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat('waterPool'));
      water.material = water.material.clone();
      water.material.map = water.material.map.clone(); water.material.map.repeat.set(W / 3, D / 3); water.material.map.needsUpdate = true;
      f.object(water, [0, wy, 0], [-Math.PI / 2, 0, 0]);
      // Wasser ist »dicht beschrieben« – man kann darauf laufen
      f.collider(0, 0, W, D, { top: wy, bottom: 0, shadow: false });
      // Wellenringe unter den Füßen
      const rings = [];
      for (let i = 0; i < 5; i++) {
        const r = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.26, 24), new THREE.MeshBasicMaterial({ color: '#e8faff', transparent: true, opacity: 0, depthWrite: false }));
        r.rotation.x = -Math.PI / 2; kit.group.add(r); rings.push({ r, k: 1 });
      }
      const wc = f.world(0, 0, 0), lc = f.point(0, wy + 0.01, 0);
      const hw = W / 2, hd = D / 2, rot = f.rotY;
      let acc = 0, next = 0, last = null;
      kit.onUpdate((dt, t, ctx) => {
        water.material.map.offset.set(Math.sin(t * 0.1) * 0.1, t * 0.02);
        const p = ctx.player;
        const dx = p.x - wc.x, dz = p.z - wc.z;
        const lx = dx * Math.cos(rot) - dz * Math.sin(rot), lz = dx * Math.sin(rot) + dz * Math.cos(rot);
        const onWater = Math.abs(lx) < hw && Math.abs(lz) < hd && Math.abs(p.y - wy) < 0.05;
        acc += dt;
        if (onWater && acc > 0.35 && (!last || Math.hypot(p.x - last.x, p.z - last.z) > 0.25 || acc > 1.2)) {
          acc = 0; last = { x: p.x, z: p.z };
          const o = rings[next++ % rings.length]; o.k = 0;
          o.r.position.set(p.x - kit.origin.x, lc.y, p.z - kit.origin.z);
          if (Math.random() < 0.3) kit.services.audio.play('splash');
        }
        for (const o of rings) {
          if (o.k >= 1) { o.r.material.opacity = 0; continue; }
          o.k = Math.min(1, o.k + dt * 0.7);
          o.r.scale.setScalar(1 + o.k * 4); o.r.material.opacity = 0.6 * (1 - o.k);
        }
      });
    },
  }),

  // Klauenfuß-Wanne voller Schaum
  defineProp({
    name: 'clawTub',
    create(f, opts, kit) {
      const L = opts.length ?? 1.8;
      f.add(new THREE.CapsuleGeometry(0.42, L - 0.84, 6, 16), 'porcelain', [0, 0.62, 0], [0, 0, Math.PI / 2], [0.6, 1, 1]);
      f.add(box(L - 0.1, 0.04, 0.7, 0), 'pastelSky', [0, 0.82, 0]);
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) f.add(sphere(0.07, 8, 6), 'gold', [x * (L / 2 - 0.25), 0.1, z * 0.25]);
      for (let i = 0; i < 14; i++) f.add(sphere(0.12 + (i % 3) * 0.04, 8, 6), 'white', [Math.cos(i * 2.3) * (L / 2 - 0.4), 0.86 + (i % 2) * 0.05, Math.sin(i * 1.7) * 0.2]);
      f.add(cyl(0.03, 0.03, 0.4, 8), 'gold', [L / 2 - 0.1, 1.05, 0]);
      f.add(cyl(0.025, 0.025, 0.2, 8), 'gold', [L / 2 - 0.2, 1.24, 0], [0, 0, Math.PI / 2]);
      f.collider(0, 0, L, 0.9, { top: 0.86 });
      kit.services.props.get('bubbles').create(f.frame([0, 0.9, 0], 0), { area: [L - 0.4, 2.5, 0.5], count: 16, y: 0 }, kit);
      f.hitbox([0, 0.9, 0], [L, 0.6, 0.9], {
        label: 'Schaumbad', verb: 'Hineinpusten', secret: opts.secret, secretName: 'Das Schaumbad der Bücherwürmer',
        onInteract: () => { kit.services.audio.play('bubble'); kit.services.ui.toast('Pffff! Schaumflocken fliegen. Darunter: drei Bücherwürmer mit Badekappen. Sie winken.'); },
      });
    },
  }),

  // Wäscheleine mit trocknenden Büchern
  defineProp({
    name: 'clothesline',
    create(f, opts, kit) {
      const L = opts.length ?? 4, H = opts.height ?? 2;
      for (const s of [-1, 1]) { f.add(cyl(0.04, 0.05, H, 6), 'woodLight', [s * L / 2, H / 2, 0]); f.collider(s * L / 2, 0, 0.15, 0.15); }
      f.add(cyl(0.006, 0.006, L, 3), 'cream', [0, H - 0.1, 0], [0, 0, Math.PI / 2]);
      const cols = ['#c0405a', '#3a6ac0', '#e0a030', '#3a9a6a', '#9a5ad0'];
      const items = [];
      const n = opts.count ?? 5;
      for (let i = 0; i < n; i++) {
        const g = new THREE.Group();
        const cm = new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: 0.6 });
        for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.01), cm); c.position.set(0, -0.14, s * 0.06); c.rotation.x = s * 0.35; g.add(c); }
        const pg = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.27, 0.05), mat('pages')); pg.position.y = -0.15; pg.scale.z = 0.4; g.add(pg);
        const peg = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.02), mat('woodLight')); peg.position.y = 0.01; g.add(peg);
        f.object(g, [-L / 2 + (i + 0.5) * (L / n), H - 0.1, 0]);
        items.push(g);
      }
      kit.onUpdate((dt, t) => items.forEach((g, i) => { g.rotation.x = Math.sin(t * 1.3 + i) * 0.15; }));
      f.hitbox([0, H - 0.3, 0], [L, 0.5, 0.3], {
        label: 'Trocknende Bücher', verb: 'Prüfen', onInteract: () => kit.services.ui.toast('Diese Bücher sind in die Badewanne gefallen. Jetzt sind sie »durchgelesen«.'),
      });
    },
  }),

  // Stapel Handtücher
  defineProp({
    name: 'towelStack',
    create(f, opts) {
      const cols = ['pastelPink', 'pastelMint', 'pastelSky', 'pastelLemon'];
      for (let i = 0; i < (opts.count ?? 4); i++) f.add(box(0.5, 0.09, 0.35, 0), cols[i % 4], [0, 0.045 + i * 0.09, 0], [0, (i % 2) * 0.08, 0]);
    },
  }),
];
