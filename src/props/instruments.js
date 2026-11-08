import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, torus, lathe } from '../world/geo.js';
import { mat } from '../world/materials.js';
import { compactGroup } from '../world/kit.js';
import { matchMelody, MELODIES } from '../core/eastereggs.js';
import { eyes, M, S, behave } from './friends.js';

// Musikzimmer zum Selberspielen: Xylophon, Trommel, Harfe, Orgel – und ein Spatzenchor, der mitsingt.
const NOTES = ['c', 'd', 'e', 'f', 'g', 'a', 'h', 'c2'];
const BAR_COLS = ['#e85a5a', '#f0904a', '#f0d050', '#6ac86a', '#4ab0e0', '#6a7ae8', '#b07ae8', '#e86ab0'];

/** Gemeinsames Melodie-Gedächtnis aller Instrumente (für die Lied-Ostereier). */
function played(kit, note) {
  const fx = kit.services.fx;
  fx.melody = fx.melody ?? [];
  fx.melody.push(note);
  if (fx.melody.length > 24) fx.melody.shift();
  kit.services.events.emit('notePlayed', note);
  const hit = matchMelody(fx.melody);
  if (hit) {
    fx.melody.length = 0;
    const egg = `lied-${hit}`;
    kit.services.secrets.found(egg);
    kit.services.events.emit('party', 10);
    kit.services.ui.toast(`♪ Du hast »${MELODIES[hit].name}« gespielt! Der Spatzenchor jubelt, und irgendwo quaken Enten im Takt.`, { ms: 7000 });
  }
}

export default [
  // Xylophon mit 8 bunten Klangstäben (jede Taste einzeln anklickbar)
  defineProp({
    name: 'xylophone',
    create(f, opts, kit) {
      const W = 2.4;
      f.add(box(W + 0.2, 0.08, 1.0, 1), 'woodDark', [0, 0.7, 0]);
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) f.add(cyl(0.04, 0.04, 0.7, 6), 'woodDark', [x * (W / 2), 0.35, z * 0.4]);
      for (const z of [-0.32, 0.32]) f.add(cyl(0.02, 0.02, W, 6), 'brass', [0, 0.76, z], [0, 0, Math.PI / 2]);
      for (const m of Object.values(MELODIES)) void m;
      for (const key of Object.keys(MELODIES)) kit.services.secrets.register(`lied-${key}`, `»${MELODIES[key].name}« gespielt`, kit.room?.id, 'egg');
      const bars = [];
      NOTES.forEach((n, i) => {
        const len = 0.95 - i * 0.07;
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, len), new THREE.MeshStandardMaterial({ color: BAR_COLS[i], roughness: 0.35 }));
        bar.userData.hitbox = false;
        f.object(bar, [-W / 2 + 0.17 + i * (W - 0.34) / 7, 0.8, 0]);
        const y0 = bar.position.y;
        bars.push({ bar, y0, hit: 0 });
        f.interactable(bar, {
          label: `Klangstab »${n === 'c2' ? 'c’' : n}«`, verb: 'Anschlagen', range: 3.5,
          onInteract: () => { bars[i].hit = 1; kit.services.audio.note(n); played(kit, n); },
        });
      });
      // Schlägel
      for (const sx of [-1, 1]) { f.add(cyl(0.01, 0.01, 0.4, 5), 'woodLight', [sx * 0.3, 0.76, 0.6], [Math.PI / 2, 0, 0.3]); f.add(sphere(0.04, 8, 6), 'candy', [sx * 0.3 + 0.06, 0.76, 0.8]); }
      kit.onUpdate((dt) => { for (const b of bars) { b.hit = Math.max(0, b.hit - dt * 4); b.bar.position.y = b.y0 - b.hit * 0.02; b.bar.material.emissive?.setScalar(b.hit * 0.35); } });
      f.collider(0, 0, W + 0.2, 1.0);
      const sign = kit.services.makeSign('Tipp: c d e f g g a a a a g', { size: 40, w: 512, h: 96, bg: '#f6ead0', ink: '#5a2a3a' });
      sign.scale.set(0.9, 0.17, 1); f.object(sign, [0, 0.66, 0.51]);
    },
  }),

  defineProp({
    name: 'bigDrum',
    create(f, opts, kit) {
      f.add(cyl(0.55, 0.55, 0.7, 20), 'candy', [0, 0.5, 0]);
      for (const y of [0.17, 0.83]) f.add(torus(0.56, 0.03, 6, 24), 'gold', [0, y, 0], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; f.add(cyl(0.01, 0.01, 0.68, 4), 'white', [Math.cos(a) * 0.56, 0.5, Math.sin(a) * 0.56], [0.5 * Math.cos(a), 0, 0.5 * Math.sin(a)]); }
      const skin = new THREE.Mesh(new THREE.CircleGeometry(0.54, 24), mat('cream')); skin.rotation.x = -Math.PI / 2;
      f.object(skin, [0, 0.86, 0]);
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; f.add(cyl(0.025, 0.025, 0.2, 5), 'woodDark', [Math.cos(a) * 0.4, 0.07, Math.sin(a) * 0.4]); }
      let boom = 0;
      kit.onUpdate((dt, t) => { boom = Math.max(0, boom - dt * 3); skin.position.y = f.point(0, 0.86, 0).y - Math.sin(boom * 20) * 0.01 * boom; });
      f.collider(0, 0, 1.1, 1.1, { top: 0.87 });
      f.hitbox([0, 0.9, 0], [1.1, 0.3, 1.1], { label: 'Große Trommel', verb: 'Trommeln', onInteract: () => { boom = 1; kit.services.audio.play('drum'); kit.services.events.emit('notePlayed', 'bum'); } });
    },
  }),

  defineProp({
    name: 'harp',
    create(f, opts, kit) {
      f.add(box(0.5, 0.1, 0.3, 0), 'gold', [0, 0.05, 0]);
      f.add(cyl(0.05, 0.06, 1.8, 8), 'gold', [-0.35, 0.95, 0], [0, 0, 0.08]);
      f.add(torus(0.6, 0.05, 6, 20, Math.PI * 0.9), 'gold', [0.05, 1.55, 0], [0, 0, 0.1]);
      f.add(box(0.06, 1.6, 0.08, 0), 'woodLight', [0.45, 0.85, 0], [0, 0, -0.35]);
      const strings = [];
      for (let i = 0; i < 9; i++) {
        const x = -0.25 + i * 0.075, h = 1.3 - Math.abs(i - 4) * 0.06;
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, h, 3), mat('cream'));
        f.object(st, [x, 0.15 + h / 2, 0]); strings.push(st);
      }
      let strum = 0;
      kit.onUpdate((dt, t) => { strum = Math.max(0, strum - dt); strings.forEach((s, i) => { s.position.z = Math.sin(t * 40 + i) * 0.01 * strum; }); });
      f.collider(0, 0, 0.6, 0.4);
      f.hitbox([0, 0.9, 0], [0.9, 1.6, 0.4], { label: 'Goldene Harfe', verb: 'Zupfen', onInteract: () => { strum = 1.5; kit.services.audio.play('harp'); kit.services.events.emit('notePlayed', 'harfe'); } });
    },
  }),

  // Orgelpfeifen an der Wand (lokal +z in den Raum)
  defineProp({
    name: 'organPipes',
    create(f, opts, kit) {
      const n = opts.count ?? 9;
      f.add(box(3.6, 1.0, 0.7, 1), 'woodRed', [0, 0.5, 0.35]);
      f.add(box(3.4, 0.06, 0.5, 0), 'ivory', [0, 1.02, 0.55]);
      for (let i = 0; i < 14; i++) f.add(box(0.05, 0.03, 0.18, 0), 'pianoBlack', [-1.5 + i * 0.23, 1.05, 0.6]);
      for (let i = 0; i < n; i++) {
        const h = 1.6 + Math.sin((i / (n - 1)) * Math.PI) * 1.8, x = -1.5 + i * (3 / (n - 1));
        f.add(cyl(0.12, 0.12, h, 12), 'brass', [x, 1.0 + h / 2, 0.15]);
        f.add(new THREE.ConeGeometry(0.12, 0.2, 12), 'brass', [x, 0.95, 0.15], [Math.PI, 0, 0]);
        f.add(box(0.1, 0.05, 0.02, 0), 'black', [x, 1.25, 0.27]);
      }
      f.collider(0, 0.35, 3.6, 0.7);
      f.hitbox([0, 1.2, 0.6], [3.4, 0.6, 0.5], { label: 'Orgel', verb: 'Einen Akkord spielen', onInteract: () => { kit.services.audio.play('organ'); kit.services.events.emit('notePlayed', 'orgel'); kit.services.ui.toast('BWAAAH! Die Orgel brummt so tief, dass die Spatzen kurz vom Stängchen hopsen.'); } });
    },
  }),

  // Spatzenchor auf einer Stange: hüpft und zwitschert, wenn jemand musiziert
  defineProp({
    name: 'sparrowChoir',
    create(f, opts, kit) {
      const n = opts.count ?? 4;
      f.add(cyl(0.03, 0.03, 1.6, 6), 'woodDark', [0, 0.8, 0]);
      f.add(cyl(0.02, 0.02, 1.4, 6), 'woodDark', [0, 1.6, 0], [0, 0, Math.PI / 2]);
      f.collider(0, 0, 0.2, 0.2);
      const birds = [];
      const cols = ['#b08a60', '#a07a50', '#c09a70', '#987050'];
      for (let i = 0; i < n; i++) {
        const g = new THREE.Group();
        const fm = new THREE.MeshStandardMaterial({ color: cols[i % 4], roughness: 0.9 });
        g.add(M(S(0.06, 10, 8), fm, [0, 0.06, 0], null, [1, 0.9, 1.2]));
        g.add(M(S(0.045, 10, 8), fm, [0, 0.12, 0.04]));
        g.add(M(S(0.03, 8, 6), 'cream', [0, 0.05, 0.04]));
        eyes(g, { y: 0.135, z: 0.07, gap: 0.04, r: 0.011 });
        g.add(M(new THREE.ConeGeometry(0.012, 0.03, 5), 'orange', [0, 0.12, 0.09], [Math.PI / 2, 0, 0]));
        g.add(M(new THREE.BoxGeometry(0.04, 0.01, 0.08), fm, [0, 0.07, -0.08], [0.4, 0, 0]));
        compactGroup(g);
        f.object(g, [-0.55 + i * (1.1 / (n - 1)), 1.62, 0]);
        birds.push({ g, y0: g.position.y, hop: 0, ph: i * 1.3 });
      }
      kit.services.events.on('notePlayed', () => { for (const b of birds) b.hop = 0.5 + Math.random() * 0.3; if (Math.random() < 0.6) kit.services.audio.play('chirp'); });
      kit.onUpdate((dt, t) => {
        for (const b of birds) {
          b.hop = Math.max(0, b.hop - dt);
          b.g.position.y = b.y0 + Math.abs(Math.sin(b.hop * 12)) * 0.08 * (b.hop > 0 ? 1 : 0);
          b.g.rotation.y = Math.sin(t * 0.8 + b.ph) * 0.4;
        }
      });
      if (opts.friend) {
        const hb = new THREE.Group(); f.object(hb, [0, 1.6, 0]);
        behave(f, kit, opts, { root: hb, turn: 'none', hitSize: [1.4, 0.4, 0.4], hitAt: [0, 0.1, 0] });
      }
    },
  }),
];
