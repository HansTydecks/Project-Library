import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, torus } from '../world/geo.js';
import { mat } from '../world/materials.js';
import { tex } from '../world/textures.js';
import { compactGroup } from '../world/kit.js';

// Kaminzimmer: knisterndes Feuer, ein schnarchender Minidrache, Strickzeug mit Eigenleben.
export default [
  // Kamin an der Wand (lokal +z zeigt in den Raum). Der Sims ist begehbar.
  defineProp({
    name: 'fireplace',
    create(f, opts, kit) {
      const W = opts.width ?? 3, H = opts.height ?? 1.6;
      f.add(box(W, H, 0.9, 1), 'brick', [0, H / 2, 0.45]);
      f.add(box(W * 0.55, H * 0.6, 0.5, 0), 'black', [0, H * 0.3, 0.68]);
      f.add(box(W + 0.3, 0.16, 1.2, 1), 'woodDark', [0, H + 0.08, 0.55]);
      f.add(box(W * 0.7, 2.6, 0.6, 1), 'brick', [0, H + 1.45, 0.3]);
      f.add(box(W * 0.75, 0.05, 1.4, 1), 'stoneLight', [0, 0.025, 1.35]);
      for (let i = 0; i < 3; i++) f.add(cyl(0.07, 0.08, W * 0.4, 8), 'bark', [0, 0.1 + (i === 2 ? 0.12 : 0), 0.7 + (i - 1) * 0.12 * (i === 2 ? 0 : 1)], [0, i * 0.3, Math.PI / 2]);
      // Flammen
      const flames = [];
      for (let i = 0; i < 7; i++) {
        const m = new THREE.Mesh(new THREE.ConeGeometry(0.09 + (i % 3) * 0.03, 0.5, 7), mat(i % 2 ? 'fire' : 'fireCore'));
        f.object(m, [(i - 3) * W * 0.07, 0.38, 0.72 + ((i % 2) - 0.5) * 0.08]);
        flames.push({ m, y0: m.position.y, ph: i * 1.7 });
      }
      const glow = f.glow([0, 0.45, 0.85], { color: '#ff9a4a', size: 1.6, opacity: 0.55 });
      // Funken
      const N = 24;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      const sparks = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ffb060', size: 0.06, map: tex.glow(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      kit.group.add(sparks);
      const base = f.point(0, 0.4, 0.72);
      const st = Array.from({ length: N }, (_, i) => ({ y: (i / N) * 1.2, x: 0, z: 0, s: 0.3 + (i % 5) * 0.08 }));
      f.light([0, 0.9, 1.3], { color: '#ff9a50', intensity: opts.intensity ?? 6, distance: 9, flicker: true, priority: 2, pool: false });
      kit.onUpdate((dt, t) => {
        for (const o of flames) {
          const k = 0.75 + Math.sin(t * 9 + o.ph) * 0.15 + Math.sin(t * 23 + o.ph * 2) * 0.1;
          o.m.scale.set(1, k, 1); o.m.position.y = o.y0 + (k - 1) * 0.25;
        }
        glow.material.opacity = 0.45 + Math.sin(t * 7) * 0.08;
        const a = geo.attributes.position.array;
        st.forEach((o, i) => {
          o.y += dt * o.s;
          if (o.y > 1.3) { o.y = 0; o.x = (Math.sin(i * 7 + t) * 0.5) * W * 0.25; o.z = Math.cos(i * 3 + t) * 0.1; }
          a[i * 3] = base.x + o.x + Math.sin(t * 3 + i) * 0.05; a[i * 3 + 1] = base.y + o.y; a[i * 3 + 2] = base.z + o.z;
        });
        geo.attributes.position.needsUpdate = true;
      });
      f.collider(0, 0.45, W, 0.9, { top: H + 0.16 });
      f.collider(0, 0.3, W * 0.7, 0.6);
      f.hitbox([0, 0.5, 0.9], [W * 0.6, 0.9, 0.4], {
        label: 'Knisterndes Kaminfeuer', verb: 'Hände wärmen',
        onInteract: () => { kit.services.audio.play('crackle'); kit.services.ui.toast('Das Feuer knistert zufrieden. Es verbrennt nur Holz und schlechte Laune.'); },
      });
    },
  }),

  // Kleiner Drache, der eingerollt schläft und Rauchkringel schnarcht
  defineProp({
    name: 'sleepyDragon',
    create(f, opts, kit) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), mat('dragon')); body.scale.set(1.3, 0.7, 1); body.position.y = 0.22; g.add(body);
      const belly = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), mat('dragonBelly')); belly.scale.set(1.2, 0.6, 0.9); belly.position.set(0, 0.18, 0.12); g.add(belly);
      const head = new THREE.Group(); head.position.set(-0.42, 0.18, 0.25); g.add(head);
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), mat('dragon')); skull.scale.set(1.2, 0.85, 1); head.add(skull);
      const snout = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat('dragon')); snout.position.set(-0.14, -0.03, 0.04); head.add(snout);
      for (const s of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 6), mat('pastelLemon')); horn.position.set(0.04, 0.13, s * 0.06); horn.rotation.z = 0.5; head.add(horn);
        const lid = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.02), mat('black')); lid.position.set(-0.08, 0.04, s * 0.09 + 0.02); head.add(lid);
      }
      for (let i = 0; i < 5; i++) {
        const seg = new THREE.Mesh(new THREE.SphereGeometry(0.11 - i * 0.017, 10, 8), mat('dragon'));
        const a = 0.4 + i * 0.5;
        seg.position.set(Math.cos(a) * 0.45, 0.1, Math.sin(a) * 0.42 - 0.05); g.add(seg);
      }
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), mat('pastelPink')); tip.position.set(Math.cos(2.9) * 0.45, 0.1, Math.sin(2.9) * 0.42); tip.rotation.z = Math.PI / 2; g.add(tip);
      for (const s of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 3), mat('pastelLilac')); wing.position.set(0.05, 0.42, s * 0.12); wing.rotation.set(s * 1.2, 0, 0.4); wing.scale.z = 0.2; g.add(wing);
      }
      compactGroup(head);
      compactGroup(g, [body, head]);
      f.object(g, [0, 0, 0], [0, opts.rot ?? 0, 0]);
      // Rauchkringel
      const rings = [];
      for (let i = 0; i < 3; i++) {
        const r = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 16), new THREE.MeshStandardMaterial({ color: '#f0f0f8', transparent: true, opacity: 0, depthWrite: false, roughness: 1 }));
        kit.group.add(r); rings.push({ r, k: i / 3 });
      }
      const nose = new THREE.Vector3();
      let loud = 0;
      kit.onUpdate((dt, t) => {
        const br = Math.sin(t * 1.4);
        body.scale.set(1.3 + br * 0.03, 0.7 + br * 0.04, 1 + br * 0.03);
        head.position.y = 0.18 + br * 0.01;
        g.updateMatrixWorld();
        nose.set(-0.6, 0.18, 0.3); g.localToWorld(nose); kit.group.worldToLocal(nose);
        loud = Math.max(0, loud - dt);
        for (const o of rings) {
          o.k = (o.k + dt * (loud > 0 ? 0.6 : 0.25)) % 1;
          o.r.position.set(nose.x - o.k * 0.2, nose.y + o.k * 0.9, nose.z);
          o.r.scale.setScalar(1 + o.k * (loud > 0 ? 5 : 2.5));
          o.r.rotation.x = Math.PI / 2 + Math.sin(o.k * 6) * 0.2;
          o.r.material.opacity = 0.55 * Math.sin(o.k * Math.PI);
        }
      });
      f.collider(0, 0, 1.1, 1.0, { top: 0.45 });
      f.hitbox([0, 0.3, 0], [1.2, 0.7, 1.1], {
        label: opts.name ?? 'Schlafender Minidrache', verb: 'Sanft kraulen', secret: opts.secret, secretName: 'Der Drache, der in C-Dur schnarcht',
        onInteract: () => { loud = 2.5; kit.services.audio.play('snore'); kit.services.ui.toast(opts.quip ?? 'Der Drache schnarcht in C-Dur und murmelt »… noch fünf Jahrhunderte …«'); },
      });
    },
  }),

  // Stricknadeln, die von selbst stricken – der Schal wird immer länger (und wieder kürzer)
  defineProp({
    name: 'knitting',
    create(f, opts, kit) {
      f.add(sphere(0.12, 12, 10), opts.yarn ?? 'pastelPink', [0.25, 0.12, 0]);
      for (let i = 0; i < 4; i++) f.add(torus(0.121, 0.008, 4, 20), 'pastelLilac', [0.25, 0.12, 0], [i * 0.8, i * 0.5, 0]);
      const g = new THREE.Group();
      const n1 = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.4, 5), mat('brass')); n1.rotation.z = 0.5; g.add(n1);
      const n2 = n1.clone(); n2.rotation.z = -0.5; g.add(n2);
      const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1, 0.02), mat(opts.scarf ?? 'pastelMint')); g.add(scarf);
      f.object(g, [0, opts.y ?? 0.6, 0]);
      kit.onUpdate((dt, t) => {
        n1.rotation.z = 0.5 + Math.sin(t * 8) * 0.2; n2.rotation.z = -0.5 - Math.sin(t * 8) * 0.2;
        const L = 0.1 + ((t * 0.02) % 1) * 0.7;
        scarf.scale.y = L; scarf.position.y = -L / 2 - 0.05;
      });
      f.hitbox([0, (opts.y ?? 0.6) - 0.2, 0], [0.5, 0.7, 0.3], {
        label: 'Strickzeug mit Eigenleben', verb: 'Zuschauen', secret: opts.secret, secretName: 'Der Schal ohne Ende',
        onInteract: () => kit.services.ui.toast('Die Nadeln stricken einen Schal für den Drachen. Er ist schon 3 Kilometer lang. Der Drache ist 80 Zentimeter.'),
      });
    },
  }),

  // Schaukelstuhl, der leise vor sich hin schaukelt
  defineProp({
    name: 'rockingChair',
    create(f, opts, kit) {
      const g = new THREE.Group();
      const wood = mat(opts.material ?? 'woodLight');
      for (const s of [-1, 1]) {
        const rocker = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.025, 4, 16, 0.9), wood); rocker.rotation.set(0, Math.PI / 2, Math.PI / 2 - 0.45 + Math.PI); rocker.position.set(s * 0.25, 0.92, 0); g.add(rocker);
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.04), wood); leg.position.set(s * 0.25, 0.25, 0.2); g.add(leg);
        const leg2 = leg.clone(); leg2.position.z = -0.2; g.add(leg2);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 0.04), wood); back.position.set(s * 0.25, 0.85, 0.26); back.rotation.x = -0.2; g.add(back);
      }
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.05, 0.5), wood); seat.position.y = 0.47; g.add(seat);
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.44), mat(opts.cushion ?? 'velvet')); cushion.position.y = 0.52; g.add(cushion);
      for (let i = 0; i < 5; i++) { const slat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.02), wood); slat.position.set(0, 0.7 + i * 0.13, 0.28 + i * 0.026); g.add(slat); }
      const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.02), mat(opts.blanket ?? 'pastelPink')); blanket.position.set(0, 0.85, 0.3); blanket.rotation.x = -0.2; g.add(blanket);
      compactGroup(g);
      f.object(g);
      let speed = 1, amp = 0.08;
      kit.onUpdate((dt, t) => { g.rotation.x = Math.sin(t * speed * 1.6) * amp; amp += (0.08 - amp) * dt * 0.3; speed += (1 - speed) * dt * 0.3; });
      f.collider(0, 0, 0.6, 0.7, { top: 0.52 });
      f.hitbox([0, 0.7, 0], [0.7, 1.2, 0.8], {
        label: 'Schaukelstuhl', verb: 'Anstupsen',
        onInteract: () => { speed = 2.5; amp = 0.25; kit.services.ui.toast(opts.quip ?? 'Der Schaukelstuhl schaukelt beleidigt schneller. Er war gerade am Einschlafen.'); },
      });
    },
  }),
];
