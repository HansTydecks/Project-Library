import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, torus } from '../world/geo.js';
import { mat } from '../world/materials.js';
import { tex } from '../world/textures.js';
import { compactGroup } from '../world/kit.js';

// Spielzeugkammer: Bücherzug, Buchstabenklötze, Schaukelpferd, Springteufel.
const BLOCK_COLORS = ['#e85a5a', '#4a8ae8', '#4ac08a', '#e8b03a', '#a86ae8', '#f0804a'];
const blockMats = new Map();
function blockMat(letter, color) {
  const k = letter + color;
  if (!blockMats.has(k)) blockMats.set(k, new THREE.MeshStandardMaterial({ map: tex.letterBlock(letter, color), roughness: 0.6 }));
  return blockMats.get(k);
}

export default [
  // Bücherzug auf einer Kreisbahn
  defineProp({
    name: 'bookTrain',
    create(f, opts, kit) {
      const R = opts.radius ?? 5, wagons = opts.wagons ?? 4;
      // Schienen (statisch, gemergt)
      f.add(torus(R - 0.18, 0.025, 4, 64), 'iron', [0, 0.04, 0], [Math.PI / 2, 0, 0]);
      f.add(torus(R + 0.18, 0.025, 4, 64), 'iron', [0, 0.04, 0], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 56; i++) { const a = (i / 56) * Math.PI * 2; f.add(box(0.12, 0.03, 0.55, 0), 'woodDark', [Math.cos(a) * R, 0.015, Math.sin(a) * R], [0, -a, 0]); }
      const cars = [];
      const loco = new THREE.Group();
      const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 14), mat('candy')); boiler.rotation.x = Math.PI / 2; boiler.position.y = 0.32; loco.add(boiler);
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.25), mat('porcelainBlue')); cab.position.set(0, 0.36, 0.25); loco.add(cab);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.32), mat('pastelLemon')); roof.position.set(0, 0.54, 0.25); loco.add(roof);
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.16, 10), mat('black')); chimney.position.set(0, 0.52, -0.15); loco.add(chimney);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.8), mat('black')); base.position.y = 0.14; loco.add(base);
      for (const z of [-0.25, 0.05, 0.3]) for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 12), mat('pastelLemon')); w.rotation.z = Math.PI / 2; w.position.set(s * 0.19, 0.1, z); loco.add(w); }
      eyesOn(loco, [0, 0.36, -0.42]);
      compactGroup(loco);
      kit.group.add(loco); cars.push(loco);
      const bookCols = ['#c0405a', '#3a6ac0', '#3a9a6a', '#e0a030', '#9a5ad0'];
      for (let i = 0; i < wagons; i++) {
        const w = new THREE.Group();
        const bed = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.6), mat(['pastelMint', 'pastelPink', 'pastelSky', 'pastelLilac'][i % 4])); bed.position.y = 0.18; w.add(bed);
        for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.16), new THREE.MeshStandardMaterial({ color: bookCols[(i + k) % 5], roughness: 0.6 })); b.position.set(-0.1 + k * 0.07, 0.36, (k % 2) * 0.1 - 0.05); w.add(b); }
        for (const z of [-0.18, 0.18]) for (const s of [-1, 1]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 10), mat('black')); wh.rotation.z = Math.PI / 2; wh.position.set(s * 0.19, 0.08, z); w.add(wh); }
        compactGroup(w);
        kit.group.add(w); cars.push(w);
      }
      // Dampfwölkchen
      const puffs = [];
      for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false })); kit.group.add(p); puffs.push({ p, k: i / 5, at: new THREE.Vector3() }); }
      const c0 = f.point(0, 0, 0);
      let speed = 0.25, a = 0;
      kit.onUpdate((dt, t) => {
        a += dt * speed / R * 4; speed += (0.25 - speed) * dt * 0.3;
        cars.forEach((c, i) => {
          const ai = a - i * (0.85 / R);
          c.position.set(c0.x + Math.cos(ai) * R, c0.y + Math.abs(Math.sin(t * 8 + i)) * 0.01, c0.z - Math.sin(ai) * R);
          c.rotation.y = ai; // Fahrtrichtung: Tangente
        });
        for (const o of puffs) {
          o.k += dt * 0.8;
          if (o.k > 1) { o.k = 0; o.at.copy(loco.position).add(new THREE.Vector3(0, 0.6, 0)).add(new THREE.Vector3(0, 0, -0.15).applyEuler(loco.rotation)); }
          o.p.position.set(o.at.x, o.at.y + o.k * 0.6, o.at.z);
          o.p.scale.setScalar(0.6 + o.k * 1.5); o.p.material.opacity = 0.6 * (1 - o.k);
        }
      });
      const hit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 1), mat('invisible')); hit.userData.hitbox = true; hit.position.y = 0.35; loco.add(hit);
      f.interactable(hit, {
        label: 'Bücherzug', verb: 'Pfeifen', secret: opts.secret, secretName: 'Der Bücherzug',
        onInteract: () => { speed = 1.6; kit.services.audio.play('choo'); kit.services.ui.toast('Tuuut! Der Bücherzug liefert Lesestoff im Kreis. Nächster Halt: wieder hier.'); },
      });
    },
  }),

  // Buchstabenklotz – begehbar und stapelbar
  defineProp({
    name: 'letterBlock',
    create(f, opts) {
      const s = opts.size ?? 0.8;
      const letter = opts.letter ?? 'A', color = opts.color ?? BLOCK_COLORS[letter.charCodeAt(0) % BLOCK_COLORS.length];
      f.add(new THREE.BoxGeometry(s, s, s), blockMat(letter, color), [0, s / 2, 0], [0, opts.spin ?? 0, 0]);
      f.collider(0, 0, s, s, { top: s, bottom: 0 });
    },
  }),

  defineProp({
    name: 'rockingHorse',
    create(f, opts, kit) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.45, 4, 10), mat(opts.color ?? 'pastelPink')); body.rotation.z = Math.PI / 2; body.position.y = 0.6; g.add(body);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.35, 8), mat(opts.color ?? 'pastelPink')); neck.position.set(-0.3, 0.8, 0); neck.rotation.z = 0.6; g.add(neck);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.14), mat(opts.color ?? 'pastelPink')); head.position.set(-0.45, 0.95, 0); head.rotation.z = -0.3; g.add(head);
      const mane = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.05), mat('pastelLilac')); mane.position.set(-0.27, 0.92, 0); mane.rotation.z = 0.6; g.add(mane);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 6), mat('pastelLilac')); tail.position.set(0.42, 0.6, 0); tail.rotation.z = -2.2; g.add(tail);
      const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.3), mat('candy')); saddle.position.set(0, 0.77, 0); g.add(saddle);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), mat('woodLight')); leg.position.set(sx * 0.2, 0.35, sz * 0.1); leg.rotation.x = sz * 0.2; g.add(leg); }
      for (const sz of [-1, 1]) { const rocker = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.025, 4, 16, 0.9), mat('woodLight')); rocker.rotation.set(0, 0, Math.PI + 1.12); rocker.position.set(0, 0.92, sz * 0.14); g.add(rocker); }
      eyesOn(g, [-0.56, 0.98, 0], true);
      compactGroup(g);
      f.object(g);
      let amp = 0.06, sp = 1.2;
      kit.onUpdate((dt, t) => { g.rotation.z = Math.sin(t * sp) * amp; amp += (0.06 - amp) * dt * 0.4; sp += (1.2 - sp) * dt * 0.4; });
      f.collider(0, 0, 1.0, 0.4, { top: 0.78 });
      f.hitbox([0, 0.7, 0], [1, 0.8, 0.4], {
        label: 'Schaukelpferd', verb: 'Anschubsen', secret: opts.secret, secretName: 'Das Schaukelpferd namens Galopp',
        onInteract: () => { amp = 0.3; sp = 3; kit.services.ui.toast('»Hüüü!« Das Schaukelpferd heißt Galopp. Es war noch nie woanders. Es ist trotzdem glücklich.'); },
      });
    },
  }),

  defineProp({
    name: 'jackInTheBox',
    create(f, opts, kit) {
      f.add(box(0.4, 0.4, 0.4, 0), blockMat('?', '#a86ae8'), [0, 0.2, 0]);
      const g = new THREE.Group();
      const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), mat('brass')); spring.position.y = 0.5; g.add(spring);
      const head = new THREE.Group(); g.add(head);
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), mat('cream')); head.add(face);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat('candy')); nose.position.z = 0.13; head.add(nose);
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 8), mat('pastelMint')); hat.position.y = 0.16; head.add(hat);
      for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), mat('black')); e.position.set(sx * 0.045, 0.03, 0.115); head.add(e); }
      compactGroup(head);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.42), mat('pastelLemon'));
      f.object(g, [0, 0.4, 0]);
      f.object(lid, [0, 0.415, 0]);
      const base = g.position.y, lid0 = lid.position.clone();
      let pop = 0, wob = 0;
      kit.onUpdate((dt, t) => {
        pop = Math.max(0, pop - dt * 0.25);
        const ext = pop > 0 ? Math.min(1, pop * 4) : 0;
        wob += dt * 10;
        spring.scale.y = Math.max(0.01, ext * (1 + Math.sin(wob) * 0.1 * pop));
        spring.position.y = 0.5 * spring.scale.y;
        head.position.y = spring.scale.y + 0.1; head.rotation.z = Math.sin(wob) * 0.2 * pop;
        g.visible = ext > 0.02;
        g.position.y = base;
        lid.position.set(lid0.x, lid0.y + ext * 0.02, lid0.z - ext * 0.22); lid.rotation.x = -ext * 1.6;
      });
      f.collider(0, 0, 0.45, 0.45, { top: 0.43 });
      f.hitbox([0, 0.3, 0], [0.5, 0.6, 0.5], {
        label: 'Kiste mit Kurbel', verb: 'Kurbeln', secret: opts.secret, secretName: 'Der Springteufel, der nie erschrecken will',
        onInteract: () => { pop = 1; wob = 0; kit.services.audio.play('boing'); kit.services.ui.toast('»Überraschung!« Der Springteufel entschuldigt sich sofort, falls du erschrocken bist.'); },
      });
    },
  }),

  defineProp({
    name: 'spinningTop',
    create(f, opts, kit) {
      const g = new THREE.Group();
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.25, 16), mat(opts.color ?? 'pastelSky')); top.rotation.x = Math.PI; top.position.y = 0.13; g.add(top);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16), mat('candy')); band.position.y = 0.27; g.add(band);
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 6), mat('woodLight')); stick.position.y = 0.36; g.add(stick);
      compactGroup(g);
      f.object(g);
      const c = g.position.clone();
      kit.onUpdate((dt, t) => { g.rotation.y += dt * 12; g.rotation.z = Math.sin(t * 1.5) * 0.08; g.position.set(c.x + Math.sin(t * 0.7) * 0.3, c.y, c.z + Math.cos(t * 0.9) * 0.3); });
    },
  }),

  // Drachen (Spielzeug-Flugdrachen) mit Schleifenschwanz
  defineProp({
    name: 'kite',
    create(f, opts, kit) {
      const g = new THREE.Group();
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.5, 0, -0.35, 0, 0, 0, -0.7, 0, 0, 0.5, 0, 0, -0.7, 0, 0.35, 0, 0], 3));
      geo.computeVertexNormals();
      const sail = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: opts.color ?? '#ff8ab0', side: THREE.DoubleSide, roughness: 0.7 })); g.add(sail);
      const bows = [];
      for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.01), mat(['pastelLemon', 'pastelSky', 'pastelMint'][i % 3])); b.position.y = -0.8 - i * 0.22; g.add(b); bows.push(b); }
      f.object(g, [0, opts.y ?? 4, 0], [0, opts.rot ?? 0, 0]);
      const p0 = g.position.clone();
      kit.onUpdate((dt, t) => {
        g.position.set(p0.x + Math.sin(t * 0.4) * 0.4, p0.y + Math.sin(t * 0.9) * 0.25, p0.z);
        g.rotation.z = Math.sin(t * 0.7) * 0.25;
        bows.forEach((b, i) => { b.position.x = Math.sin(t * 2 + i * 0.8) * 0.08 * (i + 1); });
      });
    },
  }),

  // Teddy (gerne als Belohnung oben auf etwas)
  defineProp({
    name: 'teddy',
    create(f, opts, kit) {
      const g = new THREE.Group();
      const s = opts.scale ?? 1;
      const add = (geo, m, x, y, z, sc) => { const o = new THREE.Mesh(geo, mat(m)); o.position.set(x * s, y * s, z * s); if (sc) o.scale.set(...sc); g.add(o); };
      add(new THREE.SphereGeometry(0.16 * s, 12, 10), 'teddy', 0, 0.18, 0, [1, 1.1, 0.9]);
      add(new THREE.SphereGeometry(0.12 * s, 12, 10), 'teddy', 0, 0.42, 0);
      add(new THREE.SphereGeometry(0.06 * s, 10, 8), 'cream', 0, 0.39, 0.1);
      for (const sx of [-1, 1]) {
        add(new THREE.SphereGeometry(0.045 * s, 8, 6), 'teddy', sx * 0.09, 0.52, 0);
        add(new THREE.SphereGeometry(0.018 * s, 6, 5), 'black', sx * 0.04, 0.45, 0.105);
        add(new THREE.SphereGeometry(0.06 * s, 8, 6), 'teddy', sx * 0.15, 0.22, 0.06);
        add(new THREE.SphereGeometry(0.07 * s, 8, 6), 'teddy', sx * 0.09, 0.04, 0.1);
      }
      add(new THREE.SphereGeometry(0.02 * s, 6, 5), 'black', 0, 0.41, 0.155);
      add(new THREE.TorusGeometry(0.06 * s, 0.015 * s, 6, 12), 'candy', 0, 0.32, 0.04);
      compactGroup(g);
      f.object(g, [0, 0, 0], [0, opts.rot ?? 0, 0]);
      kit.onUpdate((dt, t) => { g.rotation.z = Math.sin(t * 1.2) * 0.03; });
      f.hitbox([0, 0.3 * s, 0], [0.5 * s, 0.7 * s, 0.4 * s], {
        label: opts.name ?? 'Teddy', verb: 'Drücken', secret: opts.secret, secretName: opts.secretName ?? 'Der Teddy auf dem Klötzchenturm', range: 3,
        onInteract: () => { kit.services.audio.play('secret'); kit.services.ui.toast(opts.quip ?? 'Der Teddy brummt glücklich. Er hat auf dich gewartet – ganz oben, wo die Aussicht am schönsten ist.'); },
      });
    },
  }),
];

function eyesOn(parent, at, side = false) {
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat('white'));
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), mat('black'));
    if (side) { w.position.set(at[0], at[1], s * 0.07); p.position.set(at[0] - 0.01, at[1], s * 0.095); }
    else { w.position.set(at[0] + s * 0.07, at[1], at[2]); p.position.set(at[0] + s * 0.07, at[1], at[2] - 0.025); }
    parent.add(w, p);
  }
}
