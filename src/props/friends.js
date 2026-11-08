import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { mat } from '../world/materials.js';
import { compactGroup } from '../world/kit.js';
import { teapotGroup } from './tea.js';

// Bewohner der Bibliothek. Jede Figur: Modell aus Primitiven, Idle-Animation, schaut dich an,
// grüßt, wenn du näher kommst, und erzählt beim Ansprechen etwas (Sprüche in src/npc/friends.js).

const M = (geo, m, pos, rot, scale) => {
  const o = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m);
  if (pos) o.position.set(...pos);
  if (rot) o.rotation.set(...rot);
  if (scale) typeof scale === 'number' ? o.scale.setScalar(scale) : o.scale.set(...scale);
  return o;
};
const S = (r, w = 12, h = 10) => new THREE.SphereGeometry(r, w, h);

/** Augen mit Glanzpunkt. Gibt die Augengruppen zurück (zum Blinzeln: scale.y). */
function eyes(parent, { y, z, gap, r, color = 'black', white = true }) {
  const out = [];
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(s * gap / 2, y, z);
    if (white) g.add(M(S(r, 10, 8), 'white'));
    g.add(M(S(r * 0.62, 10, 8), color, [0, 0, r * (white ? 0.5 : 0)]));
    g.add(M(S(r * 0.18, 6, 5), 'white', [r * 0.2, r * 0.25, r * (white ? 1.02 : 0.55)]));
    parent.add(g); out.push(g);
  }
  return out;
}

/** Gemeinsames Verhalten: zum Spieler drehen, blinzeln, grüßen, ansprechen. */
function behave(f, kit, opts, { root, head, eyeList = [], hitSize, hitAt = [0, 0.5, 0], onGreet, onTalk, turn = 'head', range = 3.2 }) {
  const wp = () => root.getWorldPosition(new THREE.Vector3());
  const hit = M(new THREE.BoxGeometry(...hitSize), 'invisible', hitAt);
  hit.userData.hitbox = true;
  root.add(hit);
  const fr = kit.services.friends;
  const info = fr.get(opts.friend);
  let yaw = 0, blink = 2 + Math.random() * 3, near = false, cool = 0;
  const base = root.rotation.y;
  kit.onUpdate((dt, t, ctx) => {
    const p = wp();
    const dx = ctx.player.x - p.x, dz = ctx.player.z - p.z;
    const d = Math.hypot(dx, dz);
    // Kopf/Körper zum Spieler (Weltwinkel → relativ zur Grunddrehung)
    const target = d < 7 ? Math.atan2(dx, dz) - (turn === 'body' ? 0 : root.rotation.y) : (turn === 'body' ? base : 0);
    let diff = target - yaw; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const lim = turn === 'head' ? 1.2 : Math.PI;
    yaw += diff * Math.min(1, dt * 2.5);
    yaw = Math.max(-lim, Math.min(lim, yaw));
    if (turn === 'body') root.rotation.y = yaw; else if (head) head.rotation.y = yaw;
    // Blinzeln
    blink -= dt;
    const closed = blink < 0.12;
    for (const e of eyeList) e.scale.y = closed ? 0.12 : 1;
    if (blink < 0) blink = 2.5 + Math.random() * 3;
    // Grüßen beim Näherkommen
    cool = Math.max(0, cool - dt);
    if (d < range && !near && cool <= 0) { near = true; cool = 8; onGreet?.(); }
    if (d > range + 1.5) near = false;
  });
  if (turn === 'body') yaw = base;
  f.interactable(hit, {
    label: info?.name ?? opts.friend, verb: 'Ansprechen', friend: opts.friend, range: 4,
    onInteract: () => { onTalk?.(); kit.services.audio.play('chime'); kit.services.ui.toast(`${info?.name ?? ''}: »${fr.next(opts.friend)}«`, { ms: 6500 }); },
  });
}

export default [
  // Frau Fingerhut: Uhrmacher-Maus mit Lupe und Schürze
  defineProp({
    name: 'friendMouse',
    create(f, opts, kit) {
      const fur = new THREE.MeshStandardMaterial({ color: '#b8a8a0', roughness: 0.9 });
      const root = new THREE.Group();
      const body = new THREE.Group(); root.add(body);
      body.add(M(new THREE.CapsuleGeometry(0.09, 0.12, 4, 12), fur, [0, 0.16, 0]));
      body.add(M(S(0.085), fur, [0, 0.05, 0.01], null, [1.1, 0.7, 1]));
      // Schürze mit Tasche und Bändern
      body.add(M(new THREE.CylinderGeometry(0.085, 0.1, 0.16, 14, 1, true, -1.1, 2.2), 'cream', [0, 0.12, 0.005]));
      body.add(M(new THREE.BoxGeometry(0.05, 0.035, 0.01), 'pastelPink', [0.02, 0.1, 0.098]));
      body.add(M(new THREE.TorusGeometry(0.095, 0.006, 4, 18), 'pastelPink', [0, 0.2, 0], [Math.PI / 2, 0, 0]));
      // Füße
      for (const s of [-1, 1]) body.add(M(S(0.03, 8, 6), 'pastelPink', [s * 0.045, 0.01, 0.06], null, [1, 0.5, 1.6]));
      const head = new THREE.Group(); head.position.y = 0.33; root.add(head);
      head.add(M(S(0.085), fur));
      head.add(M(new THREE.ConeGeometry(0.055, 0.11, 12), fur, [0, -0.015, 0.09], [Math.PI / 2, 0, 0]));
      head.add(M(S(0.018, 8, 6), 'candy', [0, -0.015, 0.145]));
      for (const s of [-1, 1]) {
        head.add(M(new THREE.CylinderGeometry(0.06, 0.06, 0.012, 16), fur, [s * 0.075, 0.075, -0.01], [Math.PI / 2, 0, s * 0.3]));
        head.add(M(new THREE.CylinderGeometry(0.042, 0.042, 0.014, 16), 'pastelPink', [s * 0.075, 0.075, -0.003], [Math.PI / 2, 0, s * 0.3]));
        for (const k of [-1, 0, 1]) head.add(M(new THREE.BoxGeometry(0.07, 0.0015, 0.0015), 'black', [s * 0.07, -0.02 + k * 0.008, 0.115], [0, s * 0.3, k * 0.12 * s]));
      }
      const ey = eyes(head, { y: 0.02, z: 0.065, gap: 0.06, r: 0.016 });
      // Brille auf der Stirn
      for (const s of [-1, 1]) head.add(M(new THREE.TorusGeometry(0.018, 0.004, 4, 12), 'brass', [s * 0.026, 0.065, 0.06], [-0.4, 0, 0]));
      // Lupe in der rechten Hand
      const lupe = new THREE.Group(); lupe.position.set(0.12, 0.25, 0.08); root.add(lupe);
      lupe.add(M(new THREE.TorusGeometry(0.045, 0.006, 6, 20), 'brass'));
      lupe.add(M(new THREE.CircleGeometry(0.043, 20), 'glass'));
      lupe.add(M(new THREE.CylinderGeometry(0.006, 0.008, 0.09, 6), 'woodDark', [0, -0.09, 0]));
      for (const s of [-1, 1]) root.add(M(new THREE.CapsuleGeometry(0.018, 0.08, 3, 6), fur, [s * 0.1, 0.2, 0.04], [0.8, 0, -s * 0.4]));
      // Schwanz
      const tail = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 4, 16, Math.PI * 1.2), mat('pastelPink'));
      tail.position.set(0, 0.06, -0.1); tail.rotation.set(0, Math.PI / 2, 0); root.add(tail);
      compactGroup(body); compactGroup(head, ey);
      const s = opts.scale ?? 1.3; root.scale.setScalar(s);
      f.object(root, [0, 0, 0], [0, opts.rot ?? 0, 0]);
      kit.onUpdate((dt, t) => { lupe.position.y = 0.25 + Math.sin(t * 1.3) * 0.02; lupe.rotation.z = Math.sin(t * 0.9) * 0.2; tail.rotation.x = Math.sin(t * 2) * 0.25; body.scale.y = 1 + Math.sin(t * 2.2) * 0.015; });
      behave(f, kit, opts, { root, head, eyeList: ey, hitSize: [0.35, 0.5, 0.35], hitAt: [0, 0.22, 0], onGreet: () => { kit.services.audio.play('tickTock'); } });
    },
  }),

  // Professor Puschel: Eule mit Monokel auf einer Sitzstange
  defineProp({
    name: 'friendOwl',
    create(f, opts, kit) {
      const H = opts.perch ?? 1.5;
      const stand = new THREE.Group();
      stand.add(M(new THREE.CylinderGeometry(0.22, 0.26, 0.05, 16), 'woodDark', [0, 0.025, 0]));
      stand.add(M(new THREE.CylinderGeometry(0.025, 0.03, H, 8), 'woodDark', [0, H / 2, 0]));
      stand.add(M(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), 'brass', [0, H, 0], [0, 0, Math.PI / 2]));
      f.addGroup(stand);
      f.collider(0, 0, 0.4, 0.4);
      const root = new THREE.Group(); root.position.y = H + 0.02;
      const feather = new THREE.MeshStandardMaterial({ color: '#a8845a', roughness: 0.95 });
      const body = new THREE.Group(); root.add(body);
      body.add(M(S(0.16, 16, 12), feather, [0, 0.17, 0], null, [1, 1.25, 0.95]));
      body.add(M(S(0.12, 14, 10), 'cream', [0, 0.14, 0.06], null, [1, 1.2, 0.8]));
      for (let i = 0; i < 5; i++) body.add(M(new THREE.ConeGeometry(0.02, 0.03, 4), 'woodLight', [(i - 2) * 0.035, 0.12 + (i % 2) * 0.04, 0.15], [Math.PI, 0, 0]));
      for (const s of [-1, 1]) {
        body.add(M(S(0.1, 10, 8), feather, [s * 0.14, 0.16, -0.01], [0, 0, s * 0.2], [0.35, 1, 0.8]));
        for (let k = 0; k < 3; k++) body.add(M(new THREE.BoxGeometry(0.012, 0.03, 0.01), 'pastelLemon', [s * 0.03 + k * 0.012 * s, 0.0, 0.05]));
      }
      const head = new THREE.Group(); head.position.y = 0.42; root.add(head);
      head.add(M(S(0.14, 16, 12), feather, null, null, [1.1, 0.95, 1]));
      for (const s of [-1, 1]) {
        head.add(M(new THREE.CircleGeometry(0.06, 16), 'cream', [s * 0.058, 0.01, 0.125], [0, s * 0.25, 0]));
        head.add(M(new THREE.ConeGeometry(0.03, 0.09, 6), feather, [s * 0.085, 0.13, 0], [0, 0, -s * 0.3]));
      }
      const ey = eyes(head, { y: 0.01, z: 0.13, gap: 0.115, r: 0.035, color: 'black' });
      head.add(M(new THREE.ConeGeometry(0.018, 0.05, 6), 'orange', [0, -0.035, 0.145], [Math.PI / 2 + 0.6, 0, 0]));
      // Monokel mit Kettchen
      head.add(M(new THREE.TorusGeometry(0.045, 0.005, 6, 20), 'gold', [0.058, 0.01, 0.168]));
      head.add(M(new THREE.CylinderGeometry(0.002, 0.002, 0.18, 3), 'gold', [0.1, -0.08, 0.13], [0.3, 0, 0.4]));
      // Doktorhut
      head.add(M(new THREE.BoxGeometry(0.2, 0.015, 0.2), 'black', [0, 0.15, 0], [0, 0.78, 0]));
      head.add(M(new THREE.CylinderGeometry(0.06, 0.07, 0.05, 10), 'black', [0, 0.125, 0]));
      head.add(M(new THREE.CylinderGeometry(0.003, 0.003, 0.08, 3), 'pastelLemon', [0.07, 0.12, 0.07]));
      compactGroup(body); compactGroup(head, ey);
      f.object(root, [0, 0, 0], [0, opts.rot ?? 0, 0]);
      let spin = 0;
      kit.onUpdate((dt, t) => { body.scale.y = 1 + Math.sin(t * 1.8) * 0.02; if (spin > 0) { spin -= dt; head.rotation.z = Math.sin(spin * 6) * 0.15; } });
      behave(f, kit, opts, {
        root, head, eyeList: ey, hitSize: [0.45, 0.7, 0.45], hitAt: [0, 0.35, 0], range: 3.5,
        onGreet: () => kit.services.audio.play('hoot'),
        onTalk: () => { spin = 1.2; kit.services.audio.play('hoot'); },
      });
    },
  }),

  // Mirabelle: Teekanne mit Gesicht, die hüpft und mit dem Deckel klappert
  defineProp({
    name: 'friendTeapot',
    create(f, opts, kit) {
      const root = new THREE.Group();
      const tp = teapotGroup(opts.color ?? 'pastelPink', 1.3);
      tp.remove(tp.children[2]); tp.remove(tp.children[1]); // eigener, klappernder Deckel
      const pot = compactGroup(tp);
      pot.position.y = 0.17; root.add(pot);
      const face = new THREE.Group(); face.position.set(0, 0.17, 0); root.add(face);
      const ey = eyes(face, { y: 0.03, z: 0.19, gap: 0.09, r: 0.028 });
      for (const s of [-1, 1]) face.add(M(new THREE.CircleGeometry(0.025, 12), 'pastelPink', [s * 0.085, -0.02, 0.192]));
      face.add(M(new THREE.TorusGeometry(0.035, 0.007, 6, 14, Math.PI), 'candy', [0, -0.03, 0.195], [0, 0, Math.PI]));
      for (const s of [-1, 1]) face.add(M(new THREE.BoxGeometry(0.035, 0.006, 0.006), 'black', [s * 0.045, 0.07, 0.19], [0, 0, s * -0.25]));
      const lid = new THREE.Group(); lid.position.y = 0.17 + 0.16; root.add(lid);
      lid.add(M(new THREE.SphereGeometry(0.09, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), 'porcelain'));
      lid.add(M(S(0.028, 8, 6), 'gold', [0, 0.1, 0]));
      root.add(M(new THREE.CylinderGeometry(0.16, 0.13, 0.03, 18), 'gold', [0, 0.015, 0]));
      compactGroup(lid);
      f.object(root, [0, 0, 0], [0, opts.rot ?? 0, 0]);
      let hop = 0, chatter = 0;
      kit.onUpdate((dt, t) => {
        hop = Math.max(0, hop - dt); chatter = Math.max(0, chatter - dt);
        const h = hop > 0 ? Math.abs(Math.sin(hop * 9)) * 0.08 : Math.abs(Math.sin(t * 1.5)) * 0.01;
        pot.position.y = 0.17 + h; face.position.y = 0.17 + h;
        lid.position.y = 0.33 + h + (chatter > 0 ? Math.abs(Math.sin(t * 25)) * 0.02 : 0);
        lid.rotation.z = chatter > 0 ? Math.sin(t * 25) * 0.1 : 0;
      });
      behave(f, kit, opts, {
        root, eyeList: ey, turn: 'body', hitSize: [0.55, 0.55, 0.45], hitAt: [0, 0.25, 0],
        onGreet: () => { hop = 1; },
        onTalk: () => { chatter = 2; hop = 0.8; kit.services.audio.play('pop'); },
      });
    },
  }),

  // Ritter Rostfrei: kleine Rüstung, die salutiert
  defineProp({
    name: 'friendKnight',
    create(f, opts, kit) {
      const steel = new THREE.MeshStandardMaterial({ color: '#c8d0dc', metalness: 0.55, roughness: 0.3, emissive: '#101418' });
      const root = new THREE.Group();
      const body = new THREE.Group(); root.add(body);
      for (const s of [-1, 1]) {
        body.add(M(new THREE.CylinderGeometry(0.06, 0.055, 0.38, 10), steel, [s * 0.08, 0.21, 0]));
        body.add(M(S(0.06, 10, 8), steel, [s * 0.08, 0.4, 0.005]));
        body.add(M(new THREE.BoxGeometry(0.1, 0.06, 0.18), steel, [s * 0.08, 0.03, 0.03]));
      }
      body.add(M(new THREE.CylinderGeometry(0.17, 0.14, 0.36, 14), steel, [0, 0.62, 0]));
      body.add(M(new THREE.BoxGeometry(0.2, 0.22, 0.04), 'gold', [0, 0.65, 0.15]));
      body.add(M(new THREE.TorusGeometry(0.15, 0.015, 6, 20), 'gold', [0, 0.45, 0], [Math.PI / 2, 0, 0]));
      body.add(M(new THREE.ConeGeometry(0.2, 0.14, 14, 1, true), steel, [0, 0.4, 0], [Math.PI, 0, 0]));
      for (const s of [-1, 1]) body.add(M(S(0.08, 12, 8), steel, [s * 0.2, 0.78, 0], null, [1, 0.7, 1]));
      // Schild mit Buch-Wappen (links)
      body.add(M(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 18), 'porcelainBlue', [-0.24, 0.55, 0.1], [Math.PI / 2, 0, 0.1]));
      body.add(M(new THREE.BoxGeometry(0.1, 0.07, 0.02), 'cream', [-0.24, 0.56, 0.125]));
      body.add(M(new THREE.TorusGeometry(0.15, 0.012, 4, 20), 'gold', [-0.24, 0.55, 0.115], [0, 0, 0]));
      const head = new THREE.Group(); head.position.y = 0.92; root.add(head);
      head.add(M(S(0.13, 16, 12), steel, null, null, [1, 1.1, 1]));
      head.add(M(new THREE.BoxGeometry(0.17, 0.025, 0.04), 'black', [0, 0.01, 0.12]));
      head.add(M(new THREE.BoxGeometry(0.02, 0.1, 0.04), 'black', [0, -0.04, 0.12]));
      const ey = eyes(head, { y: 0.012, z: 0.135, gap: 0.07, r: 0.012, white: false, color: 'pastelSky' });
      for (let i = 0; i < 3; i++) head.add(M(new THREE.ConeGeometry(0.035, 0.22, 6), i === 1 ? 'candy' : 'pastelPink', [(i - 1) * 0.035, 0.22, -0.04], [-0.4, 0, (i - 1) * 0.3]));
      // Rechter Arm (salutiert)
      const arm = new THREE.Group(); arm.position.set(0.2, 0.78, 0); root.add(arm);
      arm.add(M(new THREE.CylinderGeometry(0.045, 0.04, 0.3, 8), steel, [0, -0.15, 0]));
      arm.add(M(S(0.05, 8, 6), steel, [0, -0.32, 0]));
      arm.add(M(new THREE.CylinderGeometry(0.008, 0.008, 0.45, 4), 'woodLight', [0, -0.3, 0.12], [Math.PI / 2, 0, 0]));
      arm.add(M(new THREE.ConeGeometry(0.03, 0.12, 4), 'white', [0, -0.3, 0.38], [Math.PI / 2, 0, 0]));
      compactGroup(body); compactGroup(head, ey); compactGroup(arm);
      f.object(root, [0, 0, 0], [0, opts.rot ?? 0, 0]);
      let salute = 0;
      kit.onUpdate((dt, t) => {
        salute = Math.max(0, salute - dt);
        const k = salute > 0 ? Math.sin(Math.min(1, (2 - salute) * 2) * Math.PI / 2) * (salute > 0.4 ? 1 : salute / 0.4) : 0;
        arm.rotation.x = -k * 2.4; arm.rotation.z = k * 0.4;
        body.position.y = Math.sin(t * 1.4) * 0.004;
      });
      behave(f, kit, opts, {
        root, head, eyeList: ey, hitSize: [0.55, 1.2, 0.45], hitAt: [0, 0.6, 0], range: 3.5,
        onGreet: () => { salute = 2; kit.services.audio.play('knock'); },
        onTalk: () => { salute = 2; },
      });
    },
  }),

  // Gustav: Gärtnerigel mit Strohhut und Schubkarre, der seine Runden dreht
  defineProp({
    name: 'friendHedgehog',
    create(f, opts, kit) {
      const L = opts.length ?? 5;
      const root = new THREE.Group();
      const walker = new THREE.Group(); root.add(walker);
      const spines = new THREE.Group(); walker.add(spines);
      spines.add(M(S(0.2, 14, 10), new THREE.MeshStandardMaterial({ color: '#6a4a34', roughness: 1 }), [0, 0.2, -0.02], null, [1, 0.9, 1.15]));
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2 * 7.3, k = (i / 60);
        const th = 0.3 + k * 2.2;
        const dir = new THREE.Vector3(Math.sin(th) * Math.cos(a), Math.cos(th) * 0.9, -Math.abs(Math.sin(th) * Math.sin(a)) * 0.3 - Math.sin(th) * 0.8).normalize();
        const c = M(new THREE.ConeGeometry(0.025, 0.12, 4), 'woodDark', [dir.x * 0.2, 0.2 + dir.y * 0.18, -0.02 + dir.z * 0.22]);
        c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); spines.add(c);
      }
      const face = new THREE.Group(); face.position.set(0, 0.17, 0.17); walker.add(face);
      face.add(M(S(0.12, 12, 10), 'pastelPeach', null, null, [0.9, 0.85, 1]));
      face.add(M(new THREE.ConeGeometry(0.06, 0.13, 10), 'pastelPeach', [0, -0.02, 0.1], [Math.PI / 2, 0, 0]));
      face.add(M(S(0.025, 8, 6), 'black', [0, -0.02, 0.17]));
      const ey = eyes(face, { y: 0.04, z: 0.08, gap: 0.08, r: 0.02 });
      for (const s of [-1, 1]) face.add(M(new THREE.CircleGeometry(0.02, 10), 'pastelPink', [s * 0.07, -0.01, 0.095], [0, s * 0.4, 0]));
      // Strohhut
      face.add(M(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 16), 'pastelLemon', [0, 0.12, -0.04], [-0.2, 0, 0]));
      face.add(M(new THREE.CylinderGeometry(0.07, 0.08, 0.07, 12), 'pastelLemon', [0, 0.16, -0.05], [-0.2, 0, 0]));
      face.add(M(new THREE.TorusGeometry(0.078, 0.01, 4, 14), 'candy', [0, 0.14, -0.045], [Math.PI / 2 - 0.2, 0, 0]));
      const feet = [];
      for (const s of [-1, 1]) for (const z of [0.1, -0.12]) { const ft = M(S(0.04, 8, 6), 'pastelPeach', [s * 0.1, 0.03, z], null, [1, 0.6, 1.3]); walker.add(ft); feet.push(ft); }
      // Schubkarre mit Blumen
      const barrow = new THREE.Group(); barrow.position.set(0, 0, 0.5); walker.add(barrow);
      barrow.add(M(new THREE.BoxGeometry(0.34, 0.16, 0.4), 'pastelMint', [0, 0.22, 0.05]));
      barrow.add(M(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12), 'black', [0, 0.08, 0.26], [0, 0, Math.PI / 2]));
      for (const s of [-1, 1]) barrow.add(M(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 4), 'woodLight', [s * 0.13, 0.22, -0.25], [Math.PI / 2 - 0.3, 0, 0]));
      ['flowerRed', 'flowerYellow', 'flowerBlue', 'pastelPink', 'flowerWhite'].forEach((m, i) => barrow.add(M(new THREE.IcosahedronGeometry(0.05, 0), m, [(i - 2) * 0.06, 0.34, 0.05 + (i % 2) * 0.08])));
      compactGroup(spines); compactGroup(face, ey); compactGroup(barrow);
      f.object(root);
      const a = f.point(-L / 2, 0, 0), b = f.point(L / 2, 0, 0);
      let k = 0.5, dir = 1, pause = 0;
      kit.onUpdate((dt, t) => {
        if (pause > 0) { pause -= dt; walker.position.y = 0; return; }
        k += dir * dt * 0.35 / L;
        if (k > 1 || k < 0) { dir *= -1; k = Math.max(0, Math.min(1, k)); pause = 2.5; }
        root.position.lerpVectors(a, b, k);
        walker.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; // relativ zur Grunddrehung
        walker.position.y = Math.abs(Math.sin(t * 8)) * 0.015;
        feet.forEach((ft, i) => { ft.position.y = 0.03 + Math.max(0, Math.sin(t * 8 + i * Math.PI / 2)) * 0.03; });
      });
      behave(f, kit, opts, { root, eyeList: ey, turn: 'none', hitSize: [0.6, 0.6, 1.1], hitAt: [0, 0.3, 0], onGreet: () => { pause = 3; kit.services.audio.play('pop'); } });
    },
  }),

  // Moos: winziger Moosgolem mit Blümchen auf dem Kopf und Gießkännchen
  defineProp({
    name: 'friendGolem',
    create(f, opts, kit) {
      const stone = new THREE.MeshStandardMaterial({ color: '#9a9a8a', roughness: 1, flatShading: true });
      const root = new THREE.Group();
      const body = new THREE.Group(); root.add(body);
      body.add(M(new THREE.IcosahedronGeometry(0.22, 1), stone, [0, 0.32, 0], null, [1, 0.9, 0.85]));
      for (const s of [-1, 1]) {
        body.add(M(new THREE.IcosahedronGeometry(0.09, 0), stone, [s * 0.1, 0.07, 0.02]));
        body.add(M(new THREE.IcosahedronGeometry(0.08, 0), stone, [s * 0.27, 0.3, 0.03]));
        body.add(M(new THREE.IcosahedronGeometry(0.07, 0), stone, [s * 0.3, 0.17, 0.08]));
      }
      for (let i = 0; i < 9; i++) body.add(M(S(0.05 + (i % 3) * 0.015, 8, 6), 'leaves', [Math.cos(i * 1.7) * 0.18, 0.3 + Math.sin(i * 2.3) * 0.14, Math.sin(i * 1.7) * 0.15 - 0.02], null, [1, 0.5, 1]));
      const head = new THREE.Group(); head.position.y = 0.62; root.add(head);
      head.add(M(new THREE.IcosahedronGeometry(0.14, 1), stone, null, null, [1.1, 0.9, 1]));
      head.add(M(new THREE.SphereGeometry(0.1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 'leaves', [0, 0.06, 0], null, [1.3, 0.6, 1.2]));
      const glowEye = new THREE.MeshBasicMaterial({ color: '#c8ffd0' });
      const ey = [];
      for (const s of [-1, 1]) { const e = M(S(0.022, 8, 6), glowEye, [s * 0.05, 0.0, 0.12]); head.add(e); ey.push(e); }
      head.add(M(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 4), 'leaves', [0.02, 0.18, 0]));
      ['flowerYellow', 'pastelPink', 'flowerWhite', 'pastelPink', 'flowerYellow'].forEach((m, i) => head.add(M(S(0.022, 6, 5), m, [0.02 + Math.cos(i * 1.256) * 0.035, 0.25, Math.sin(i * 1.256) * 0.035])));
      head.add(M(S(0.02, 6, 5), 'flowerYellow', [0.02, 0.25, 0]));
      const can = new THREE.Group(); can.position.set(0.32, 0.3, 0.12); root.add(can);
      can.add(M(new THREE.CylinderGeometry(0.06, 0.07, 0.11, 12), 'copper'));
      can.add(M(new THREE.CylinderGeometry(0.01, 0.015, 0.14, 6), 'copper', [0.08, 0.03, 0], [0, 0, 1]));
      compactGroup(body); compactGroup(head, ey); compactGroup(can);
      f.object(root, [0, 0, 0], [0, opts.rot ?? 0, 0]);
      kit.onUpdate((dt, t) => { root.position.y = f.point(0, 0, 0).y + Math.abs(Math.sin(t * 1.1)) * 0.01; can.rotation.z = -0.3 - Math.max(0, Math.sin(t * 0.7)) * 0.6; head.rotation.z = Math.sin(t * 0.6) * 0.08; });
      behave(f, kit, opts, { root, head, eyeList: ey, hitSize: [0.7, 0.9, 0.5], hitAt: [0, 0.45, 0] });
    },
  }),

  // Lesefrida: Bücherraupe mit Brille, die auf einem Baumstumpf liest
  defineProp({
    name: 'friendCaterpillar',
    create(f, opts, kit) {
      const stumpH = opts.stump ?? 0.6;
      f.add(new THREE.CylinderGeometry(0.4, 0.5, stumpH, 14), 'bark', [0, stumpH / 2, 0]);
      f.add(new THREE.CylinderGeometry(0.39, 0.39, 0.02, 14), 'woodLight', [0, stumpH + 0.005, 0]);
      for (let i = 0; i < 3; i++) f.add(new THREE.SphereGeometry(0.05, 8, 6), i % 2 ? 'mushroomCap' : 'mushroomCapBlue', [Math.cos(i * 2) * 0.45, 0.08, Math.sin(i * 2) * 0.45], [0, 0, 0], [1, 0.5, 1]);
      f.collider(0, 0, 0.9, 0.9, { top: stumpH });
      const root = new THREE.Group(); root.position.y = stumpH;
      const segs = [];
      const cols = ['pastelMint', 'leaves', 'pastelMint', 'leaves', 'pastelMint'];
      for (let i = 0; i < 5; i++) {
        const s = M(S(0.07 - i * 0.004, 12, 10), cols[i]);
        s.add(M(S(0.018, 6, 5), 'pastelLemon', [0, 0.05, 0.03]));
        for (const sd of [-1, 1]) s.add(M(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 4), 'pastelLemon', [sd * 0.05, -0.05, 0]));
        compactGroup(s);
        root.add(s); segs.push(s);
      }
      const head = new THREE.Group(); root.add(head);
      head.add(M(S(0.085, 14, 12), 'pastelMint'));
      const ey = eyes(head, { y: 0.02, z: 0.07, gap: 0.06, r: 0.018 });
      for (const s of [-1, 1]) {
        head.add(M(new THREE.TorusGeometry(0.022, 0.004, 4, 12), 'black', [s * 0.03, 0.02, 0.088]));
        head.add(M(new THREE.CylinderGeometry(0.004, 0.004, 0.1, 4), 'black', [s * 0.03, 0.11, -0.01], [0, 0, -s * 0.3]));
        head.add(M(S(0.014, 6, 5), 'candy', [s * 0.045, 0.16, -0.01]));
        head.add(M(new THREE.CircleGeometry(0.015, 10), 'pastelPink', [s * 0.055, -0.02, 0.075], [0, s * 0.5, 0]));
      }
      head.add(M(new THREE.TorusGeometry(0.02, 0.004, 4, 10, Math.PI), 'candy', [0, -0.03, 0.08], [0, 0, Math.PI]));
      const book = new THREE.Group(); root.add(book);
      for (const s of [-1, 1]) book.add(M(new THREE.BoxGeometry(0.07, 0.09, 0.006), 'pastelSky', [s * 0.035, 0, 0], [0, s * -0.3, 0]));
      const page = M(new THREE.BoxGeometry(0.065, 0.085, 0.002), 'paper'); page.geometry.translate(0.0325, 0, 0); book.add(page);
      compactGroup(head, ey);
      f.object(root, [0, 0, 0], [0, opts.rot ?? 0, 0]);
      kit.onUpdate((dt, t) => {
        segs.forEach((s, i) => s.position.set(0, 0.07 + Math.abs(Math.sin(t * 2 + i * 0.7)) * 0.03 * (i > 0 && i < 4 ? 1 : 0.3), -0.1 * i + 0.05));
        head.position.set(0, 0.2 + Math.sin(t * 1.3) * 0.01, 0.12);
        book.position.set(0, 0.15, 0.24); book.rotation.x = -0.5;
        page.rotation.y = -((t * 0.25) % 1) * Math.PI;
      });
      behave(f, kit, opts, { root, head, eyeList: ey, hitSize: [0.5, 0.5, 0.7], hitAt: [0, 0.2, 0] });
    },
  }),

  // Pip: Bücherwichtel mit Zipfelmütze und Bücherstapel – huscht weg, bis man ihn anspricht
  defineProp({
    name: 'friendGnome',
    create(f, opts, kit) {
      const root = new THREE.Group();
      const body = new THREE.Group(); root.add(body);
      body.add(M(new THREE.ConeGeometry(0.17, 0.34, 14), 'porcelainBlue', [0, 0.2, 0]));
      body.add(M(new THREE.TorusGeometry(0.15, 0.02, 4, 16), 'pastelLemon', [0, 0.08, 0], [Math.PI / 2, 0, 0]));
      for (const s of [-1, 1]) body.add(M(S(0.045, 8, 6), 'woodDark', [s * 0.07, 0.03, 0.04], null, [1, 0.6, 1.5]));
      const head = new THREE.Group(); head.position.y = 0.42; root.add(head);
      head.add(M(S(0.1, 14, 12), 'skin'));
      head.add(M(S(0.035, 8, 6), 'pastelPeach', [0, -0.01, 0.1]));
      const ey = eyes(head, { y: 0.025, z: 0.085, gap: 0.06, r: 0.02 });
      for (const s of [-1, 1]) {
        head.add(M(new THREE.ConeGeometry(0.035, 0.12, 6), 'skin', [s * 0.11, 0.02, 0], [0, 0, -s * 1.3]));
        head.add(M(new THREE.CircleGeometry(0.018, 10), 'pastelPink', [s * 0.055, -0.03, 0.088], [0, s * 0.5, 0]));
      }
      head.add(M(new THREE.TorusGeometry(0.03, 0.006, 4, 10, Math.PI), 'candy', [0, -0.045, 0.09], [0, 0, Math.PI]));
      head.add(M(new THREE.ConeGeometry(0.11, 0.3, 12), 'candy', [0.02, 0.17, -0.02], [-0.25, 0, -0.2]));
      head.add(M(S(0.025, 8, 6), 'white', [0.08, 0.3, -0.07]));
      // Bücherstapel auf dem Kopf? Nein – unter dem Arm.
      const books = new THREE.Group(); books.position.set(0.17, 0.22, 0.04); root.add(books);
      ['#c0405a', '#3a6ac0', '#e0a030'].forEach((c, i) => books.add(M(new THREE.BoxGeometry(0.1, 0.03, 0.14), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }), [0, i * 0.032, 0], [0, i * 0.15, 0])));
      compactGroup(body); compactGroup(head, ey); compactGroup(books);
      f.object(root);
      const spots = (opts.spots ?? [[0, 0], [4, 1.5], [-3.5, -2], [2, -4]]).map(([x, z]) => f.point(x, 0, z));
      let at = 0, move = 0, from = spots[0].clone(), tame = kit.services.friends.known('pip');
      root.position.copy(spots[0]);
      kit.onUpdate((dt, t, ctx) => {
        const o = kit.origin;
        const d = Math.hypot(root.position.x + o.x - ctx.player.x, root.position.z + o.z - ctx.player.z);
        if (!tame && move <= 0 && d < 2.6) { from = root.position.clone(); at = (at + 1) % spots.length; move = 0.7; kit.services.audio.play('pop'); }
        if (move > 0) {
          move -= dt;
          const k = 1 - Math.max(0, move) / 0.7;
          root.position.lerpVectors(from, spots[at], k);
          root.position.y = spots[at].y + Math.sin(k * Math.PI) * 0.5;
          root.scale.setScalar(k < 0.5 ? 1 - k : k);
        } else root.position.y = spots[at].y + Math.abs(Math.sin(t * 3)) * 0.02;
      });
      behave(f, kit, opts, { root, head, eyeList: ey, hitSize: [0.5, 0.7, 0.5], hitAt: [0, 0.35, 0], onTalk: () => { tame = true; } });
    },
  }),
];
