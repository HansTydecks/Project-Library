import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, lathe, ico, torus } from '../world/geo.js';
import { mat } from '../world/materials.js';

// Pflanzen, Bäume, Brunnen – für Garten, Balkon und Innenräume.
export default [
  defineProp({
    name: 'pottedPlant',
    create(f, opts, kit) {
      const s = opts.scale ?? 1;
      f.add(lathe([[0, 0], [0.16, 0], [0.2, 0.32], [0.22, 0.34], [0, 0.34]].map(([x, y]) => [x * s, y * s]), 12), 'terracotta', [0, 0, 0]);
      const r = kit.services.rng(`plant${f.point(0, 0, 0).x.toFixed(1)}${f.point(0, 0, 0).z.toFixed(1)}`);
      const n = r.int(5, 9);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r.range(0, 0.5);
        const tilt = r.range(0.3, 0.8);
        const len = r.range(0.4, 0.8) * s;
        f.add(cone(0.08 * s, len, 4), opts.leaf ?? 'leaves', [Math.cos(a) * 0.08 * s, 0.34 * s + len / 2 * Math.cos(tilt), Math.sin(a) * 0.08 * s], [Math.sin(a) * tilt, 0, -Math.cos(a) * tilt], [1, 1, 0.3]);
      }
      f.collider(0, 0, 0.45 * s, 0.45 * s);
    },
  }),

  defineProp({
    name: 'tree',
    create(f, opts, kit) {
      const r = kit.services.rng(`tree${f.point(0, 0, 0).x.toFixed(1)}|${f.point(0, 0, 0).z.toFixed(1)}`);
      const h = opts.height ?? r.range(3.5, 5.5);
      const leaf = opts.leaf ?? r.pick(['leaves', 'leaves', 'leavesAutumn', 'leavesPink']);
      f.add(cyl(0.12, 0.22, h, 8), 'bark', [0, h / 2, 0]);
      const blobs = r.int(4, 7);
      for (let i = 0; i < blobs; i++) {
        const a = r.range(0, Math.PI * 2), d = r.range(0.2, 0.9);
        f.add(ico(r.range(0.8, 1.3), 1), leaf, [Math.cos(a) * d, h + r.range(-0.5, 0.6), Math.sin(a) * d], [r.next(), r.next(), 0]);
      }
      // Ast
      f.add(cyl(0.05, 0.08, 1.2, 6), 'bark', [0.4, h * 0.65, 0], [0, 0, -0.9]);
      f.collider(0, 0, 0.5, 0.5);
      if (opts.lanterns) {
        for (let i = 0; i < 2; i++) {
          const a = r.range(0, Math.PI * 2);
          f.place('lantern', { at: [Math.cos(a) * 1.1, h * 0.55, Math.sin(a) * 1.1], hanging: true, chain: 0.4, light: i === 0, intensity: 3, color: '#ffc070' });
        }
      }
    },
  }),

  defineProp({
    name: 'flowers',
    create(f, opts, kit) {
      const r = kit.services.rng(`flowers${f.point(0, 0, 0).x.toFixed(1)}|${f.point(0, 0, 0).z.toFixed(1)}`);
      const w = opts.width ?? 2, d = opts.depth ?? 1;
      const n = opts.count ?? Math.floor(w * d * 14);
      const kinds = opts.kinds ?? ['flowerRed', 'flowerYellow', 'flowerBlue', 'flowerWhite'];
      for (let i = 0; i < n; i++) {
        const x = r.range(-w / 2, w / 2), z = r.range(-d / 2, d / 2), h = r.range(0.15, 0.45);
        f.add(cyl(0.006, 0.008, h, 3), 'leaves', [x, h / 2, z]);
        f.add(ico(r.range(0.03, 0.055), 0), r.pick(kinds), [x, h, z]);
      }
    },
  }),

  defineProp({
    name: 'mushrooms',
    create(f, opts, kit) {
      const n = opts.count ?? 7, R = opts.radius ?? 0.8;
      const glows = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, h = 0.08 + (i % 3) * 0.04;
        f.add(cyl(0.02, 0.025, h, 6), 'cream', [Math.cos(a) * R, h / 2, Math.sin(a) * R]);
        f.add(sphere(0.06, 10, 6), 'mushroom', [Math.cos(a) * R, h, Math.sin(a) * R], [0, 0, 0], [1, 0.5, 1]);
        glows.push(f.glow([Math.cos(a) * R, h + 0.05, Math.sin(a) * R], { color: '#ff8090', size: 0.3, opacity: 0.25 }));
      }
      kit.onUpdate((dt, t) => glows.forEach((g, i) => { g.material.opacity = 0.18 + 0.12 * Math.sin(t * 1.5 + i); }));
      f.hitbox([0, 0.2, 0], [R * 2, 0.4, R * 2], {
        label: 'Feenring', verb: 'Hineintreten', secret: opts.secret, secretName: 'Der Feenring',
        onInteract: () => { kit.services.audio?.play('chime'); kit.services.ui.toast('Für einen Moment hörst du winzige Glöckchen. Dann ist alles wie vorher. Fast.'); },
      });
    },
  }),

  defineProp({
    name: 'fountain',
    create(f, opts, kit) {
      const R = opts.radius ?? 1.8;
      // Becken
      const segs = 16;
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        f.add(box((2 * Math.PI * R) / segs + 0.05, 0.55, 0.3, 1), 'stoneLight', [Math.cos(a) * R, 0.275, Math.sin(a) * R], [0, -a + Math.PI / 2, 0]);
      }
      f.add(cyl(R, R, 0.05, 24), 'stoneDark', [0, 0.02, 0]);
      const water = f.mesh(new THREE.CircleGeometry(R - 0.1, 32), 'water', [0, 0.42, 0], [-Math.PI / 2, 0, 0]);
      f.add(lathe([[0, 0], [0.35, 0], [0.25, 0.2], [0.15, 1.2], [0.5, 1.3], [0.55, 1.4], [0.1, 1.45], [0.08, 1.9], [0.25, 2.0], [0, 2.1]], 16), 'stoneLight', [0, 0, 0]);
      f.collider(0, 0, R * 2, R * 2, { top: 0.55 }); // Beckenrand (und: übers Wasser laufen!)
      // Tropfen-Partikel
      const N = 120;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 3), vel = [];
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#bfe8ff', size: 0.05, transparent: true, opacity: 0.8, depthWrite: false }));
      f.object(pts, [0, 0, 0]);
      const reset = (i) => {
        const a = Math.random() * Math.PI * 2, s = 0.5 + Math.random() * 0.5;
        pos[i * 3] = 0; pos[i * 3 + 1] = 2.05; pos[i * 3 + 2] = 0;
        vel[i] = [Math.cos(a) * s, 1 + Math.random(), Math.sin(a) * s];
      };
      for (let i = 0; i < N; i++) { reset(i); pos[i * 3 + 1] = Math.random() * 2; }
      kit.onUpdate((dt, t) => {
        water.material.map.offset.set(Math.sin(t * 0.1) * 0.1, t * 0.02);
        for (let i = 0; i < N; i++) {
          vel[i][1] -= 4 * dt;
          pos[i * 3] += vel[i][0] * dt; pos[i * 3 + 1] += vel[i][1] * dt; pos[i * 3 + 2] += vel[i][2] * dt;
          if (pos[i * 3 + 1] < 0.42) reset(i);
        }
        geo.attributes.position.needsUpdate = true;
      });
      f.hitbox([0, 0.6, 0], [R * 2, 1.2, R * 2], {
        label: 'Wunschbrunnen', verb: 'Münze werfen', secret: opts.secret, secretName: 'Der Wunschbrunnen',
        onInteract: () => { kit.services.audio?.play('splash'); kit.services.ui.toast('Pling! Dein Wunsch ist notiert. Bearbeitungszeit: unbestimmt, aber wohlwollend.'); },
      });
    },
  }),

  defineProp({
    name: 'lamppost',
    create(f, opts) {
      f.add(cyl(0.06, 0.09, 2.8, 8), 'iron', [0, 1.4, 0]);
      f.add(cyl(0.15, 0.2, 0.2, 8), 'iron', [0, 0.1, 0]);
      f.place('lantern', { at: [0, 3.0, 0], intensity: opts.intensity ?? 7, distance: 9, color: opts.color ?? '#ffc070' });
      f.collider(0, 0, 0.3, 0.3);
    },
  }),

  defineProp({
    name: 'stoneTablet',
    create(f, opts, kit) {
      f.add(box(1.0, 1.3, 0.25, 1), 'stoneLight', [0, 0.65, 0], [0, 0, 0.03]);
      f.add(box(1.2, 0.2, 0.4, 1), 'stoneDark', [0, 0.1, 0]);
      f.collider(0, 0, 1.2, 0.4);
      const text = opts.text ?? 'Wer sucht, wird finden. Wer schlendert, findet mehr.';
      f.hitbox([0, 0.7, 0], [1.1, 1.4, 0.5], {
        label: 'Gedenkstein', verb: 'Lesen', secret: opts.secret, secretName: opts.secretName ?? 'Die Inschrift im Garten',
        onInteract: () => kit.services.ui.note('Eine verwitterte Inschrift', text),
      });
    },
  }),

  defineProp({
    name: 'planter',
    create(f, opts, kit) {
      const w = opts.width ?? 1.6;
      f.add(box(w, 0.5, 0.5, 1), 'stoneLight', [0, 0.25, 0]);
      f.add(box(w - 0.1, 0.02, 0.4, 1), 'bark', [0, 0.49, 0]);
      f.place('flowers', { at: [0, 0.5, 0], width: w - 0.15, depth: 0.35, count: Math.floor(w * 12) });
      f.collider(0, 0, w, 0.5);
    },
  }),

  defineProp({
    name: 'archway',
    create(f, opts) {
      const w = opts.width ?? 2.4, h = opts.height ?? 2.8;
      for (const x of [-w / 2, w / 2]) { f.add(box(0.2, h, 0.2, 0), 'iron', [x, h / 2, 0]); f.collider(x, 0, 0.25, 0.25); }
      f.add(torus(w / 2, 0.06, 6, 20, Math.PI), 'iron', [0, h, 0]);
      for (let i = 0; i < 18; i++) {
        const a = (i / 17) * Math.PI;
        f.add(ico(0.22, 0), i % 3 ? 'leaves' : 'flowerWhite', [Math.cos(a) * w / 2, h + Math.sin(a) * w / 2, 0], [i, i, 0]);
      }
    },
  }),
];
