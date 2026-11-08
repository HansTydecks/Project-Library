import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, torus } from '../world/geo.js';
import { mat, hdr } from '../world/materials.js';
import { tex } from '../world/textures.js';

// Pilzhain: Riesenpilze, Lichterketten, ein Teich mit Seerosen und ein singender Frosch.
export default [
  defineProp({
    name: 'giantMushroom',
    create(f, opts, kit) {
      const s = opts.scale ?? 1, H = (opts.height ?? 3) * s, R = (opts.radius ?? 1.6) * s;
      const cap = opts.cap ?? 'mushroomCap';
      f.add(cyl(0.25 * s, 0.4 * s, H, 14), 'mushroomStem', [0, H / 2, 0], [0, 0, opts.lean ?? 0]);
      f.add(new THREE.SphereGeometry(R, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), cap, [0, H - 0.05, 0], [0, 0, 0], [1, 0.5, 1]);
      f.add(new THREE.CircleGeometry(R, 24), 'mushroomStem', [0, H - 0.04, 0], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4, rr = (i ? 0.25 + (i % 3) * 0.2 : 0) * R;
        const y = Math.sqrt(Math.max(0, 1 - (rr / R) ** 2)) * R * 0.5;
        f.add(sphere(0.12 * s * (1 + (i % 2) * 0.4), 8, 6), 'dots', [Math.cos(a) * rr, H - 0.05 + y, Math.sin(a) * rr], [0, 0, 0], [1, 0.4, 1]);
      }
      const glowCol = opts.glow ?? '#ff9ad8';
      f.glow([0, H - 0.4, 0], { color: glowCol, size: R * 2.4, opacity: 0.3 });
      if (opts.light !== false) f.light([0, H - 0.6, 0], { color: glowCol, intensity: 5, distance: 8, pool: true });
      f.collider(0, 0, 0.7 * s, 0.7 * s);
    },
  }),

  // Lichterkette zwischen zwei Punkten (lokal: von [0,y,0] nach [length,y,0])
  defineProp({
    name: 'fairyLights',
    create(f, opts, kit) {
      const L = opts.length ?? 6, y = opts.y ?? 3, sag = opts.sag ?? 0.8, n = opts.count ?? Math.round(L * 3);
      const cols = ['#ffd86a', '#ff8ad8', '#8ad8ff', '#a8ff9a', '#c8a8ff'];
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      const c = new THREE.Color();
      for (let i = 0; i < n; i++) {
        const k = i / (n - 1);
        const p = f.point(k * L, y - Math.sin(k * Math.PI) * sag, 0);
        pos.set([p.x, p.y, p.z], i * 3);
        c.set(cols[i % cols.length]).multiplyScalar(1.6); col.set([c.r, c.g, c.b], i * 3);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.28, map: tex.glow(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      kit.group.add(pts);
      // Kabel
      for (let i = 0; i < 12; i++) {
        const k0 = i / 12, k1 = (i + 1) / 12;
        const a = [k0 * L, y - Math.sin(k0 * Math.PI) * sag], b = [k1 * L, y - Math.sin(k1 * Math.PI) * sag];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        f.add(new THREE.CylinderGeometry(0.008, 0.008, len, 3), 'black', [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0], [0, 0, Math.PI / 2 + Math.atan2(b[1] - a[1], b[0] - a[0])]);
      }
      kit.onUpdate((dt, t) => { pts.material.opacity = 0.75 + Math.sin(t * 2.2) * 0.2; });
    },
  }),

  // Teich mit Seerosen und einem Frosch, der Opernarien quakt
  defineProp({
    name: 'lilyPond',
    create(f, opts, kit) {
      const R = opts.radius ?? 2.2;
      f.add(cyl(R + 0.25, R + 0.3, 0.12, 28), 'stoneLight', [0, 0.06, 0]);
      const water = f.mesh(new THREE.CircleGeometry(R, 28), 'water', [0, 0.13, 0], [-Math.PI / 2, 0, 0]);
      const pads = [];
      for (let i = 0; i < 6; i++) {
        const a = i * 1.1, rr = R * (0.3 + (i % 3) * 0.2);
        const pad = new THREE.Mesh(new THREE.CircleGeometry(0.32, 14, 0.3, Math.PI * 2 - 0.4), mat('leaves'));
        pad.rotation.x = -Math.PI / 2;
        f.object(pad, [Math.cos(a) * rr, 0.145, Math.sin(a) * rr]);
        if (i % 2 === 0) {
          const fl = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.12, 6, 1, true), mat('pastelPink'));
          fl.position.copy(pad.position); fl.position.y += 0.06; fl.rotation.x = Math.PI; kit.group.add(fl);
        }
        pads.push(pad);
      }
      // Frosch auf dem größten Blatt
      const frog = new THREE.Group();
      const green = new THREE.MeshStandardMaterial({ color: '#6ad86a', roughness: 0.4 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), green); body.scale.set(1.1, 0.75, 1); frog.add(body);
      for (const sx of [-1, 1]) {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), green); e.position.set(sx * 0.06, 0.09, -0.05); frog.add(e);
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), mat('black')); p.position.set(sx * 0.06, 0.1, -0.085); frog.add(p);
      }
      const throat = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat('pastelLemon')); throat.position.set(0, -0.02, -0.09); frog.add(throat);
      f.object(frog, [0, 0.22, 0]);
      let sing = 0;
      kit.onUpdate((dt, t) => {
        water.rotation.z += dt * 0.02;
        pads.forEach((p, i) => { p.position.y = f.point(0, 0.145, 0).y + Math.sin(t + i) * 0.005; });
        sing = Math.max(0, sing - dt);
        throat.scale.setScalar(1 + (sing > 0 ? Math.abs(Math.sin(t * 10)) * 0.8 : Math.abs(Math.sin(t * 0.8)) * 0.15));
        frog.position.y = f.point(0, 0.22, 0).y + (sing > 0 ? Math.abs(Math.sin(t * 5)) * 0.08 : 0);
      });
      f.collider(0, 0, R * 2, R * 2, { top: 0.14 });
      f.hitbox([0, 0.3, 0], [0.5, 0.4, 0.5], {
        label: 'Opernfrosch', verb: 'Applaudieren', secret: opts.secret, secretName: 'Der Opernfrosch',
        onInteract: () => { sing = 2.5; kit.services.audio.play('melody'); kit.services.ui.toast('»Quaaa-haaa-haaa!« Der Frosch verbeugt sich. Er nimmt nur Applaus in Fliegen an.'); },
      });
    },
  }),

  // Schnecken-Briefkasten
  defineProp({
    name: 'snailMailbox',
    create(f, opts, kit) {
      f.add(cyl(0.04, 0.05, 1.1, 6), 'woodDark', [0, 0.55, 0]);
      f.add(box(0.4, 0.3, 0.55, 0), 'pastelSky', [0, 1.25, 0]);
      f.add(cyl(0.2, 0.2, 0.55, 12, 1), 'pastelSky', [0, 1.4, 0], [Math.PI / 2, 0, 0]);
      f.add(box(0.03, 0.25, 0.03, 0), 'candy', [0.22, 1.45, 0.15]);
      f.add(box(0.03, 0.08, 0.15, 0), 'candy', [0.22, 1.55, 0.22]);
      f.collider(0, 0, 0.3, 0.3);
      kit.services.props.get('snail').create(f.frame([0, 1.55, -0.05], Math.PI / 2), { length: 0.3, quip: 'Die Postschnecke macht Mittagspause. Seit Dienstag.' }, kit);
      f.hitbox([0, 1.3, 0], [0.5, 0.5, 0.65], {
        label: 'Schneckenpost', verb: 'Post holen',
        onInteract: () => kit.services.ui.note('Ein Brief', 'Liebe/r Besucher/in,\n\nwenn du das liest, bist du weiter gekommen als die meisten. Spring ruhig auf die Pilze – sie mögen das.\n\nHerzlich,\ndie Postschnecke\n\nPS: Der Brief wurde vor drei Jahren abgeschickt.'),
      });
    },
  }),

  // Goldene Eichel – ein Geheimnis, das gern hoch oben liegt
  defineProp({
    name: 'goldenAcorn',
    create(f, opts, kit) {
      const g = new THREE.Group();
      if (opts.kind === 'star') {
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: hdr('#ffe68a', 1.8) }));
        star.scale.set(1, 1.4, 0.5); g.add(star);
      } else {
        const nut = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), mat('gold')); nut.scale.y = 1.3; g.add(nut);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('woodLight')); cap.position.y = 0.06; g.add(cap);
      }
      f.object(g, [0, 0.3, 0]);
      f.glow([0, 0.3, 0], { color: '#ffd86a', size: 1, opacity: 0.6 });
      const y0 = g.position.y;
      kit.onUpdate((dt, t) => { g.rotation.y += dt; g.position.y = y0 + Math.sin(t * 2) * 0.05; });
      f.hitbox([0, 0.3, 0], [0.5, 0.6, 0.5], {
        label: opts.label ?? 'Goldene Eichel', verb: 'Bewundern', secret: opts.secret ?? 'goldene-eichel', secretName: opts.secretName ?? 'Die goldene Eichel ganz oben', range: 3,
        onInteract: () => { kit.services.audio.play('secret'); kit.services.ui.toast(opts.quip ?? 'Du hast es bis ganz nach oben geschafft! Die Eichel funkelt stolz – für dich.'); },
      });
    },
  }),
];
