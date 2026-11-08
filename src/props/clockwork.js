import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, torus } from '../world/geo.js';
import { mat, hdr } from '../world/materials.js';
import { tex, canvasTexture, FONT_TITLE } from '../world/textures.js';
import { compactGroup } from '../world/kit.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Uhrmacherwerkstatt: Zahnräder, Kuckucksuhren, Pendel und ein Glas voller verlorener Minuten.
const gearGeos = new Map();
function gearGeometry(R, teeth, thick) {
  const k = `${R}|${teeth}|${thick}`;
  if (gearGeos.has(k)) return gearGeos.get(k);
  const parts = [];
  const disc = new THREE.CylinderGeometry(R, R, thick, Math.max(16, teeth * 2)); parts.push(disc.toNonIndexed());
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const tooth = new THREE.BoxGeometry(R * 0.22, thick, R * 0.2);
    tooth.translate(R + R * 0.08, 0, 0); tooth.rotateY(a);
    parts.push(tooth.toNonIndexed());
  }
  const hub = new THREE.CylinderGeometry(R * 0.18, R * 0.18, thick * 1.6, 12); parts.push(hub.toNonIndexed());
  for (const g of parts) { for (const n of Object.keys(g.attributes)) if (!['position', 'normal'].includes(n)) g.deleteAttribute(n); }
  const geo = mergeGeometries(parts, false);
  gearGeos.set(k, geo);
  return geo;
}

export default [
  // Zahnrad: an der Wand (vertical) drehend oder flach liegend als begehbare Stufe
  defineProp({
    name: 'gear',
    create(f, opts, kit) {
      const R = opts.radius ?? 1, teeth = opts.teeth ?? Math.round(R * 14), thick = opts.thick ?? 0.18;
      const m = new THREE.Mesh(gearGeometry(R, teeth, thick), mat(opts.material ?? 'brass'));
      if (opts.flat) {
        f.object(m, [0, thick / 2, 0]);
        f.collider(0, 0, R * 1.6, R * 1.6, { top: thick, bottom: 0 });
        if (opts.spin) kit.onUpdate((dt) => { m.rotation.y += dt * opts.spin; });
      } else {
        const g = new THREE.Group(); g.add(m); m.rotation.x = Math.PI / 2;
        f.object(g, [0, opts.y ?? R + 0.3, thick / 2 + 0.02]);
        const sp = opts.spin ?? (0.25 / R) * (opts.dir ?? 1);
        kit.onUpdate((dt) => { g.rotation.z += dt * sp; });
      }
    },
  }),

  // Kuckucksuhr an der Wand (lokal +z in den Raum); der Vogel kommt alle paar Sekunden heraus
  defineProp({
    name: 'cuckooClock',
    create(f, opts, kit) {
      const s = opts.scale ?? 1, y = opts.y ?? 2.2;
      const b = f.frame([0, y, 0], 0);
      b.add(box(0.5 * s, 0.6 * s, 0.25 * s, 0), 'woodDark', [0, 0, 0.13 * s]);
      b.add(box(0.36 * s, 0.05 * s, 0.32 * s, 0), 'woodLight', [-0.15 * s, 0.38 * s, 0.13 * s], [0, 0, 0.6]);
      b.add(box(0.36 * s, 0.05 * s, 0.32 * s, 0), 'woodLight', [0.15 * s, 0.38 * s, 0.13 * s], [0, 0, -0.6]);
      b.add(box(0.12 * s, 0.12 * s, 0.02, 0), 'black', [0, 0.18 * s, 0.26 * s]);
      for (let i = 0; i < 5; i++) b.add(sphere(0.03 * s, 6, 5), i % 2 ? 'leaves' : 'pastelPink', [(-0.2 + i * 0.1) * s, -0.26 * s, 0.26 * s]);
      const face = canvasTexture(128, 128, (g, w) => {
        g.fillStyle = '#fff6e0'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 7); g.fill();
        g.fillStyle = '#3a2410'; g.font = `18px ${FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; g.fillText(String(i), w / 2 + Math.cos(a) * 48, w / 2 + Math.sin(a) * 48); }
      }, { repeat: false });
      const dial = new THREE.Mesh(new THREE.CircleGeometry(0.15 * s, 24), new THREE.MeshStandardMaterial({ map: face, roughness: 0.8 }));
      b.object(dial, [0, -0.03 * s, 0.262 * s]);
      const hands = [0.11, 0.08].map((L, i) => { const h = new THREE.Mesh(new THREE.BoxGeometry(0.012 * s, L * s, 0.004), mat('black')); h.geometry.translate(0, L * s / 2, 0); b.object(h, [0, -0.03 * s, 0.266 * s + i * 0.003]); return h; });
      // Pendel und Gewichte
      const pend = new THREE.Group();
      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.5 * s, 0.01), mat('brass')); rod.position.y = -0.25 * s; pend.add(rod);
      const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * s, 0.06 * s, 0.015, 14), mat('gold')); bob.rotation.x = Math.PI / 2; bob.position.y = -0.5 * s; pend.add(bob);
      compactGroup(pend);
      b.object(pend, [0, -0.3 * s, 0.27 * s]);
      for (const sx of [-0.08, 0.08]) b.add(cyl(0.025 * s, 0.025 * s, 0.14 * s, 8), 'brass', [sx * s, -0.75 * s, 0.2 * s]);
      // Vogel
      const bird = new THREE.Group();
      const bd = new THREE.Mesh(new THREE.SphereGeometry(0.05 * s, 10, 8), mat(opts.bird ?? 'pastelLemon')); bird.add(bd);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.015 * s, 0.04 * s, 6), mat('orange')); beak.rotation.x = Math.PI / 2; beak.position.z = 0.055 * s; bird.add(beak);
      compactGroup(bird);
      b.object(bird, [0, 0.18 * s, 0.2 * s]);
      const bz = bird.position.clone(), out = new THREE.Vector3(0, 0, 0.14 * s).applyAxisAngle(THREE.Object3D.DEFAULT_UP, f.rotY);
      let next = 3 + (opts.offset ?? 0), pop = 0;
      const wp = f.world(0, y, 0);
      kit.services.events.on('cuckooConcert', () => { pop = 1.2; next = 9; });
      kit.onUpdate((dt, t, ctx) => {
        const now = new Date();
        hands[0].rotation.z = -(now.getMinutes() / 60) * Math.PI * 2;
        hands[1].rotation.z = -((now.getHours() % 12) / 12 + now.getMinutes() / 720) * Math.PI * 2;
        pend.rotation.z = Math.sin(t * 3) * 0.3;
        next -= dt;
        if (next <= 0) {
          next = 9 + (opts.offset ?? 0) * 0.7; pop = 1.2;
          if (Math.hypot(ctx.player.x - wp.x, ctx.player.z - wp.z) < 7) kit.services.audio.play('cuckoo');
        }
        pop = Math.max(0, pop - dt);
        const k = pop > 0 ? Math.sin(Math.min(1, (1.2 - pop) / 1.2) * Math.PI) : 0;
        bird.position.copy(bz).addScaledVector(out, k);
        bird.rotation.x = -Math.abs(Math.sin(t * 12)) * 0.4 * k;
      });
      b.hitbox([0, 0, 0.2 * s], [0.6 * s, 0.8 * s, 0.4 * s], {
        label: 'Kuckucksuhr', verb: 'Fragen, wie spät', secret: opts.secret, secretName: opts.secretName ?? 'Die Kuckucksuhr ganz oben', range: 3.5,
        onInteract: () => { pop = 1.2; kit.services.audio.play('cuckoo'); kit.services.ui.toast(opts.quip ?? `»Kuckuck! Es ist ${new Date().getHours()} Uhr ${new Date().getMinutes()}. Ungefähr. Ich runde gern.«`); },
      });
    },
  }),

  // Standuhr mit großem Pendel
  defineProp({
    name: 'pendulumClock',
    create(f, opts, kit) {
      f.add(box(0.7, 2.4, 0.4, 1), opts.material ?? 'woodRed', [0, 1.2, 0]);
      f.add(box(0.5, 1.3, 0.02, 0), 'glass', [0, 0.95, 0.21]);
      f.add(new THREE.CircleGeometry(0.25, 24), 'cream', [0, 2.05, 0.205]);
      f.add(torus(0.25, 0.02, 6, 24), 'gold', [0, 2.05, 0.21]);
      const pend = new THREE.Group();
      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.0, 0.01), mat('brass')); rod.position.y = -0.5; pend.add(rod);
      const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 20), mat('gold')); bob.rotation.x = Math.PI / 2; bob.position.y = -1.0; pend.add(bob);
      compactGroup(pend);
      f.object(pend, [0, 1.65, 0.15]);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.2, 0.005), mat('black')); hand.geometry.translate(0, 0.1, 0);
      f.object(hand, [0, 2.05, 0.215]);
      kit.onUpdate((dt, t) => { pend.rotation.z = Math.sin(t * 2.1) * 0.22; hand.rotation.z = -t * 0.1; });
      f.collider(0, 0, 0.75, 0.45);
    },
  }),

  // Große Bodenuhr (begehbar), Zeiger zeigen die echte Zeit
  defineProp({
    name: 'floorClock',
    create(f, opts, kit) {
      const R = opts.radius ?? 2.4;
      const t = canvasTexture(512, 512, (g, w, h) => {
        g.translate(w / 2, h / 2);
        g.fillStyle = '#fbf0d8'; g.beginPath(); g.arc(0, 0, 250, 0, 7); g.fill();
        g.strokeStyle = '#c8963e'; g.lineWidth = 14; g.beginPath(); g.arc(0, 0, 240, 0, 7); g.stroke();
        g.fillStyle = '#3a2410'; g.font = `56px ${FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        const roman = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
        roman.forEach((r, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; g.fillText(r, Math.cos(a) * 190, Math.sin(a) * 190); });
      }, { repeat: false });
      f.add(cyl(R + 0.1, R + 0.15, 0.12, 48), 'brass', [0, 0.06, 0]);
      const dial = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }));
      f.object(dial, [0, 0.125, 0], [-Math.PI / 2, 0, 0]);
      f.collider(0, 0, R * 1.7, R * 1.7, { top: 0.12, bottom: 0 });
      const hands = [[R * 0.85, 0.06, 'black'], [R * 0.6, 0.1, 'porcelainBlue']].map(([L, wd, m], i) => {
        const h = new THREE.Mesh(new THREE.BoxGeometry(wd, 0.02, L), mat(m)); h.geometry.translate(0, 0, -L / 2);
        f.object(h, [0, 0.14 + i * 0.02, 0]); return h;
      });
      const rot = f.rotY;
      kit.onUpdate(() => {
        const now = new Date();
        hands[0].rotation.y = rot - (now.getMinutes() / 60 + now.getSeconds() / 3600) * Math.PI * 2;
        hands[1].rotation.y = rot - ((now.getHours() % 12) / 12 + now.getMinutes() / 720) * Math.PI * 2;
      });
    },
  }),

  // Glas der verlorenen Minuten
  defineProp({
    name: 'minuteJar',
    create(f, opts, kit) {
      f.add(cyl(0.16, 0.16, 0.36, 16), 'glass', [0, 0.18, 0]);
      f.add(cyl(0.17, 0.17, 0.04, 16), 'copper', [0, 0.38, 0]);
      const N = 30;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ffe68a', size: 0.05, map: tex.glow(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      kit.group.add(pts);
      const c = f.point(0, 0.18, 0);
      f.glow([0, 0.2, 0], { color: '#ffd86a', size: 0.8, opacity: 0.35 });
      kit.onUpdate((dt, t) => {
        const a = geo.attributes.position.array;
        for (let i = 0; i < N; i++) { const k = t * (0.4 + (i % 5) * 0.1) + i; a[i * 3] = c.x + Math.cos(k) * 0.1; a[i * 3 + 1] = c.y + Math.sin(k * 1.3) * 0.14; a[i * 3 + 2] = c.z + Math.sin(k) * 0.1; }
        geo.attributes.position.needsUpdate = true;
      });
      let found = 0;
      f.hitbox([0, 0.2, 0], [0.4, 0.5, 0.4], {
        label: 'Glas der verlorenen Minuten', verb: 'Eine Minute nehmen', secret: opts.secret, secretName: 'Die verlorenen Minuten',
        onInteract: () => { found++; kit.services.audio.play('chime'); kit.services.ui.toast(found === 1 ? 'Du hast eine verlorene Minute gefunden. Benutze sie weise – zum Beispiel für Tee.' : `Schon ${found} Minuten! Die Uhrmacherin wird sie nicht vermissen. Sie hat sie selbst verloren.`); },
      });
    },
  }),
];
