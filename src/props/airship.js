import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, torus } from '../world/geo.js';
import { mat } from '../world/materials.js';
import { compactGroup } from '../world/kit.js';
import { eyes, M, S, behave } from './friends.js';

// Luftschiff am Steg: schaukelt, Propeller drehen. Mit Flugticket einsteigen → Rundflug über die ganze Bibliothek.
function airshipModel() {
  const g = new THREE.Group();
  const cols = ['pastelPink', 'pastelSky', 'pastelLemon', 'pastelMint'];
  for (let i = 0; i < 8; i++) {
    const seg = M(new THREE.SphereGeometry(2.2, 8, 16, (i / 8) * Math.PI * 2, Math.PI / 4), cols[i % 4]);
    // Streifen laufen der Länge nach: Kugelachse (lokal y) zeigt nach vorn (z)
    seg.scale.set(1, 2.4, 0.8); seg.rotation.x = Math.PI / 2; seg.position.y = 4.2; g.add(seg);
  }
  for (const z of [-3.8, 0, 3.8]) g.add(M(new THREE.TorusGeometry(1.95, 0.06, 6, 24), 'gold', [0, 4.2, z], [0, 0, 0], [1, 0.82, 1]));
  // Leitwerk
  for (const [rx, rz] of [[0, 0], [0, Math.PI / 2]]) g.add(M(new THREE.BoxGeometry(0.08, 1.6, 1.4), 'candy', [0, 4.2, -5.0], [rx, 0, rz]));
  // Gondel
  g.add(M(new THREE.BoxGeometry(1.8, 0.7, 3.6), 'woodLight', [0, 0.35, 0]));
  g.add(M(new THREE.BoxGeometry(1.9, 0.08, 3.7), 'woodDark', [0, 0.72, 0]));
  for (const x of [-0.9, 0.9]) for (const z of [-1.7, 1.7]) g.add(M(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 4), 'cream', [x * 0.9, 2.0, z * 0.9], [z > 0 ? 0.2 : -0.2, 0, x > 0 ? -0.15 : 0.15]));
  for (let i = 0; i < 4; i++) g.add(M(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 10), 'glass', [0.91, 0.45, -1.2 + i * 0.8], [0, 0, Math.PI / 2]));
  g.add(M(new THREE.BoxGeometry(1.2, 0.9, 0.06), 'woodDark', [0, 1.1, 1.8]));
  compactGroup(g);
  const props = [];
  for (const sx of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(sx * 1.4, 0.6, -1.6);
    p.add(M(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8), 'brass', [0, 0, 0], [Math.PI / 2, 0, 0]));
    for (let b = 0; b < 3; b++) p.add(M(new THREE.BoxGeometry(0.06, 0.7, 0.03), 'woodDark', [0, 0, -0.16], [0, 0, (b / 3) * Math.PI * 2]));
    g.add(p); props.push(p);
  }
  return { g, props };
}

export default [
  defineProp({
    name: 'airship',
    create(f, opts, kit) {
      const svc = kit.services, items = svc.items;
      const { g, props } = airshipModel();
      f.object(g, [0, opts.y ?? 0.2, 0], [0, opts.rot ?? 0, 0]);
      const home = g.position.clone(), homeRot = g.rotation.y;
      let riding = false;
      const egg = 'rundflug';
      svc.secrets.register(egg, 'Ein Rundflug über die Bibliothek', kit.room?.id, 'egg');
      kit.onUpdate((dt, t) => {
        for (const p of props) p.rotation.z += dt * (riding ? 18 : 2);
        if (riding) return;
        g.position.y = home.y + Math.sin(t * 0.8) * 0.12;
        g.rotation.z = Math.sin(t * 0.6) * 0.03; g.rotation.y = homeRot + Math.sin(t * 0.3) * 0.03;
      });
      // Rundflug
      const C = new THREE.Vector3(0, 0, -4), R = opts.radius ?? 50, H = opts.height ?? 34;
      const dock = f.world(0, 0.75, 0);
      const a0 = Math.atan2(dock.z - C.z, dock.x - C.x);
      const P0 = new THREE.Vector3(C.x + Math.cos(a0) * R, H, C.z + Math.sin(a0) * R);
      const ease = (x) => x * x * (3 - 2 * x);
      const tmp = new THREE.Vector3(), prev = new THREE.Vector3();
      function path(k, out) {
        if (k < 0.1) out.lerpVectors(dock, P0, ease(k / 0.1));
        else if (k > 0.9) out.lerpVectors(P0, dock, ease((k - 0.9) / 0.1));
        else { const a = a0 + ((k - 0.1) / 0.8) * Math.PI * 2; out.set(C.x + Math.cos(a) * R, H + Math.sin(a * 3) * 3, C.z + Math.sin(a) * R); }
        // Luftschiff mitführen (Spieler steht in der Gondel)
        prev.copy(g.position);
        g.position.set(out.x, out.y - 0.75, out.z);
        tmp.copy(g.position).sub(prev);
        if (tmp.lengthSq() > 1e-6) g.rotation.y = Math.atan2(tmp.x, tmp.z);
      }
      function start() {
        riding = true;
        // ins Szenen-Root umziehen, damit das Schiff überall sichtbar bleibt
        const scene = kit.group.parent; g.getWorldPosition(prev); scene.add(g); g.position.copy(prev);
        svc.audio.play('whoosh');
        svc.ui.toast('Leinen los! Kapitänin Möwenstein steuert eine Runde über die ganze Bibliothek. (Umsehen mit der Maus.)', { ms: 7000 });
        svc.player.ride(path, opts.duration ?? 55, () => {
          riding = false; kit.details.add(g); g.position.copy(home); g.rotation.set(0, homeRot, 0);
          svc.secrets.found(egg);
          svc.ui.toast('Sanft gelandet. Die Kapitänin verbeugt sich: »Beehren Sie uns bald wieder!«');
        });
      }
      const hit = M(new THREE.BoxGeometry(2.2, 1.6, 4), 'invisible', [0, 0.8, 0]); hit.userData.hitbox = true; g.add(hit);
      f.interactable(hit, {
        label: 'Luftschiff »Wolkenwal«', range: 4,
        verb: () => (svc.player?.riding ? '' : svc.progress.has('secrets', egg) || items.has('ticket') ? 'Einsteigen' : 'Ohne Ticket? Hmm …'),
        onInteract: () => {
          if (svc.player.riding) return;
          if (svc.progress.has('secrets', egg)) return start();
          if (items.has('ticket')) { items.take('ticket'); return start(); }
          svc.ui.toast('»Ticket, bitte!« Die Kapitänin am Steg verkauft welche. Bezahlung in Lächeln.');
        },
      });
      f.collider(0, 0, 2, 3.8, { top: 0.75 });
    },
  }),

  // Kapitänin Möwenstein (Bekanntschaft): große Möwe mit Kapitänsmütze am Steg, verschenkt das Flugticket
  defineProp({
    name: 'friendGull',
    create(f, opts, kit) {
      const root = new THREE.Group();
      const body = new THREE.Group(); root.add(body);
      body.add(M(S(0.3, 14, 12), 'white', [0, 0.55, 0], null, [1, 1.2, 1]));
      body.add(M(new THREE.BoxGeometry(0.1, 0.4, 0.3), 'pianoBlack', [0.28, 0.6, -0.05], [0, 0, -0.2]));
      body.add(M(new THREE.BoxGeometry(0.1, 0.4, 0.3), 'pianoBlack', [-0.28, 0.6, -0.05], [0, 0, 0.2]));
      for (const sx of [-1, 1]) body.add(M(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 5), 'orange', [sx * 0.1, 0.12, 0]));
      for (const sx of [-1, 1]) body.add(M(new THREE.BoxGeometry(0.1, 0.02, 0.14), 'orange', [sx * 0.1, 0.01, 0.05]));
      body.add(M(new THREE.TorusGeometry(0.16, 0.03, 6, 14), 'porcelainBlue', [0, 0.85, 0.02], [Math.PI / 2, 0, 0]));
      const head = new THREE.Group(); head.position.y = 1.05; root.add(head);
      head.add(M(S(0.19, 14, 12), 'white'));
      const ey = eyes(head, { y: 0.05, z: 0.15, gap: 0.12, r: 0.03 });
      head.add(M(new THREE.ConeGeometry(0.04, 0.2, 6), 'pastelLemon', [0, -0.02, 0.25], [Math.PI / 2, 0, 0]));
      head.add(M(new THREE.CylinderGeometry(0.16, 0.18, 0.1, 14), 'porcelainBlue', [0, 0.18, 0]));
      head.add(M(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 16), 'pianoBlack', [0, 0.14, 0.06]));
      head.add(M(new THREE.BoxGeometry(0.06, 0.05, 0.01), 'gold', [0, 0.19, 0.17]));
      compactGroup(body); compactGroup(head, ey);
      f.object(root, [0, 0, 0], [0, opts.rot ?? 0, 0]);
      f.collider(0, 0, 0.6, 0.6);
      behave(f, kit, opts, { root, head, eyeList: ey, hitSize: [0.7, 1.4, 0.7], hitAt: [0, 0.7, 0], onGreet: () => kit.services.audio.play('honk') });
    },
  }),

  // Möwen, die über dem Steg kreisen
  defineProp({
    name: 'seagulls',
    create(f, opts, kit) {
      const n = opts.count ?? 2, R = opts.radius ?? 5, y = opts.y ?? 6;
      const birds = [];
      for (let i = 0; i < n; i++) {
        const g = new THREE.Group();
        g.add(M(S(0.12, 10, 8), 'white', [0, 0, 0], null, [1, 0.9, 1.6]));
        g.add(M(S(0.08, 10, 8), 'white', [0, 0.06, 0.16]));
        g.add(M(new THREE.ConeGeometry(0.02, 0.08, 5), 'pastelLemon', [0, 0.05, 0.27], [Math.PI / 2, 0, 0]));
        eyes(g, { y: 0.09, z: 0.21, gap: 0.07, r: 0.012, white: false });
        const wings = [];
        for (const sx of [-1, 1]) { const w = new THREE.Group(); w.position.set(sx * 0.08, 0.04, 0); w.add(M(new THREE.BoxGeometry(0.5, 0.015, 0.16), 'white', [sx * 0.25, 0, 0])); w.add(M(new THREE.BoxGeometry(0.12, 0.016, 0.16), 'black', [sx * 0.46, 0, 0])); g.add(w); wings.push(w); }
        compactGroup(g, wings);
        f.object(g);
        birds.push({ g, wings, ph: i * Math.PI });
      }
      const c0 = f.point(0, y, 0);
      kit.onUpdate((dt, t) => {
        for (const b of birds) {
          const a = t * 0.4 + b.ph;
          b.g.position.set(c0.x + Math.cos(a) * R, c0.y + Math.sin(a * 2) * 0.5, c0.z + Math.sin(a) * R);
          b.g.rotation.set(0, -a, Math.sin(a) * 0.2 - 0.3);
          const fl = Math.sin(t * 5 + b.ph) * 0.5; b.wings[0].rotation.z = fl; b.wings[1].rotation.z = -fl;
        }
      });
    },
  }),
];
