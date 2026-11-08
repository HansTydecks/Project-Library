import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, torus } from '../world/geo.js';
import { mat, hdr } from '../world/materials.js';
import { canvasTexture } from '../world/textures.js';

// Spieluhrsaal: Klavier, das von selbst spielt, eine riesige Spieluhr, schwebende Noten.
let noteTex = null;
function noteTexture() {
  if (!noteTex) {
    noteTex = ['♪', '♫', '♩', '♬'].map((ch) => canvasTexture(64, 64, (g, w, h) => {
      g.font = '52px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#ffffff'; g.fillText(ch, w / 2, h / 2 + 2);
    }, { repeat: false }));
  }
  return noteTex;
}
const NOTE_COLORS = ['#ffd86a', '#ff9ad8', '#9ad8ff', '#c8a8ff', '#9affc8'];

export default [
  defineProp({
    name: 'floatingMusicNotes',
    create(f, opts, kit) {
      const n = opts.count ?? 16, area = opts.area ?? [8, 3, 8], y = opts.y ?? 1.2;
      const texs = noteTexture();
      const list = [];
      const c0 = f.point(0, y, 0);
      for (let i = 0; i < n; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texs[i % texs.length], color: hdr(NOTE_COLORS[i % NOTE_COLORS.length], 1.6), transparent: true, depthWrite: false }));
        s.scale.setScalar(0.3 + Math.random() * 0.2);
        kit.group.add(s);
        list.push({ s, x: (Math.random() - 0.5) * area[0], z: (Math.random() - 0.5) * area[2], y: Math.random() * area[1], ph: Math.random() * 6 });
      }
      kit.onUpdate((dt, t) => {
        for (const o of list) {
          o.y += dt * 0.15;
          if (o.y > area[1]) o.y = 0;
          o.s.position.set(c0.x + o.x + Math.sin(t * 0.7 + o.ph) * 0.4, c0.y + o.y, c0.z + o.z + Math.cos(t * 0.5 + o.ph) * 0.4);
          o.s.material.opacity = Math.min(1, o.y * 2, (area[1] - o.y) * 2);
          o.s.material.rotation = Math.sin(t * 2 + o.ph) * 0.3;
        }
      });
    },
  }),

  // Flügel, der auf Klick ein Stück spielt (Tasten drücken sich von selbst)
  defineProp({
    name: 'piano',
    create(f, opts, kit) {
      f.add(box(1.6, 0.35, 1.9, 0), 'pianoBlack', [0, 0.85, 0]);
      f.add(box(1.6, 0.04, 1.9, 0), 'pianoBlack', [0, 1.03, 0]);
      for (const [x, z] of [[-0.7, -0.8], [0.7, -0.8], [0, 0.8]]) f.add(cyl(0.05, 0.04, 0.68, 8), 'pianoBlack', [x, 0.34, z]);
      // aufgestellter Deckel
      f.add(box(1.55, 0.03, 1.8, 0), 'pianoBlack', [0.35, 1.55, 0], [0, 0, 0.75]);
      f.add(cyl(0.01, 0.01, 0.7, 4), 'brass', [-0.4, 1.35, 0], [0, 0, 0.1]);
      // Notenpult
      f.add(box(0.8, 0.35, 0.02, 0), 'pianoBlack', [0, 1.25, -0.82], [-0.2, 0, 0]);
      f.add(box(0.5, 0.3, 0.005, 0), 'paper', [0, 1.26, -0.832], [-0.2, 0, 0]);
      // Tasten (vorne, lokal -z)
      f.add(box(1.5, 0.08, 0.2, 0), 'pianoBlack', [0, 0.72, -1.02]);
      const keys = [];
      const N = 20;
      // Tasten als InstancedMesh: 20 bewegliche Tasten, ein Draw Call
      const keyMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4 / N - 0.006, 0.03, 0.16), mat('ivory'), N);
      f.object(keyMesh);
      const km = new THREE.Matrix4();
      for (let i = 0; i < N; i++) {
        const p = f.point(-0.7 + (i + 0.5) * (1.4 / N), 0.77, -1.06);
        keys.push({ p, rot: f.rotY, down: 0 });
        if ([0, 1, 3, 4, 5].includes(i % 7) && i < N - 1) { // schwarze Tasten wie beim echten Klavier
          f.add(box(0.035, 0.03, 0.09, 0), 'pianoBlack', [-0.7 + (i + 1) * (1.4 / N), 0.8, -1.02]);
        }
      }
      f.add(box(0.7, 0.05, 0.35, 0), 'velvet', [0, 0.5, -1.55]);
      f.add(box(0.7, 0.45, 0.3, 0), 'pianoBlack', [0, 0.25, -1.55]);
      f.collider(0, 0, 1.7, 2.1);
      f.collider(0, -1.55, 0.7, 0.35, { top: 0.53 });
      let playing = 0;
      kit.onUpdate((dt, t) => {
        if (playing > 0) {
          playing -= dt;
          const idx = Math.floor((playing * 6.2) % N);
          if (Math.random() < 0.5) keys[(idx * 7) % N].down = 1;
        }
        keys.forEach((o, i) => {
          o.down = Math.max(0, o.down - dt * 5);
          km.makeRotationY(o.rot).setPosition(o.p.x, o.p.y - o.down * 0.015, o.p.z);
          keyMesh.setMatrixAt(i, km);
        });
        keyMesh.instanceMatrix.needsUpdate = true;
      });
      f.hitbox([0, 0.9, -1.0], [1.6, 0.6, 0.5], {
        label: 'Selbstspielender Flügel', verb: 'Zuhören', secret: opts.secret, secretName: 'Der Flügel mit Eigensinn',
        onInteract: () => { playing = 3.2; kit.services.audio.play('piano'); kit.services.events.emit('musicPlayed'); kit.services.ui.toast('Der Flügel spielt ein Lied. Er behauptet, er habe es selbst komponiert. Gestern.'); },
      });
    },
  }),

  // Riesige Spieluhr: Walze dreht, oben tanzt eine kleine Eule im Kreis
  defineProp({
    name: 'musicBox',
    create(f, opts, kit) {
      const s = opts.scale ?? 1;
      f.add(box(1.4 * s, 0.6 * s, 0.9 * s, 0), 'woodRed', [0, 0.3 * s, 0]);
      f.add(box(1.46 * s, 0.06 * s, 0.96 * s, 0), 'gold', [0, 0.62 * s, 0]);
      f.add(box(1.46 * s, 0.06 * s, 0.96 * s, 0), 'gold', [0, 0.03 * s, 0]);
      // aufgeklappter Deckel mit Spiegel
      f.add(box(1.4 * s, 0.9 * s, 0.05 * s, 0), 'woodRed', [0, 1.1 * s, 0.47 * s], [-0.25, 0, 0]);
      f.add(box(1.2 * s, 0.7 * s, 0.01 * s, 0), 'glass', [0, 1.1 * s, 0.44 * s], [-0.25, 0, 0]);
      // Walze & Kamm
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.12 * s, 0.9 * s, 16), mat('brass'));
      drum.rotation.z = Math.PI / 2;
      f.object(drum, [0, 0.72 * s, -0.2 * s]);
      for (let i = 0; i < 12; i++) f.add(box(0.035 * s, 0.01 * s, 0.25 * s, 0), 'gold', [(-0.4 + i * 0.073) * s, 0.86 * s, -0.12 * s]);
      // Tanzbühne mit Eule
      const stage = new THREE.Group();
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * s, 0.25 * s, 0.03 * s, 20), mat('pastelPink')); stage.add(plate);
      const owl = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.1 * s, 12, 10), mat('pastelLilac')); body.scale.y = 1.25; body.position.y = 0.13 * s; owl.add(body);
      for (const sx of [-1, 1]) {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.03 * s, 8, 6), mat('white')); e.position.set(sx * 0.04 * s, 0.19 * s, -0.08 * s); owl.add(e);
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.015 * s, 6, 5), mat('black')); p.position.set(sx * 0.04 * s, 0.19 * s, -0.105 * s); owl.add(p);
      }
      const tutu = new THREE.Mesh(new THREE.ConeGeometry(0.16 * s, 0.08 * s, 16, 1, true), mat('pastelPink')); tutu.position.y = 0.08 * s; tutu.rotation.x = Math.PI; owl.add(tutu);
      owl.position.x = 0.12 * s; stage.add(owl);
      f.object(stage, [0, 0.67 * s, 0.1 * s]);
      let speed = 0.6;
      kit.onUpdate((dt, t) => {
        stage.rotation.y += dt * speed * 2;
        owl.rotation.y += dt * speed * 4;
        owl.position.y = Math.abs(Math.sin(t * speed * 6)) * 0.03 * s;
        drum.rotation.x += dt * speed;
        speed += (0.6 - speed) * dt * 0.3;
      });
      f.collider(0, 0, 1.46 * s, 0.96 * s, { top: 0.65 * s });
      f.hitbox([0, 0.8 * s, 0], [1.5 * s, 0.6 * s, 1.0 * s], {
        label: 'Riesige Spieluhr', verb: 'Aufziehen', secret: opts.secret, secretName: 'Die tanzende Eule',
        onInteract: () => { speed = 3; kit.services.audio.play('musicbox'); kit.services.ui.toast('Die Eule tanzt Pirouetten. Sie übt für ihren großen Auftritt. Seit Jahren.'); },
      });
    },
  }),

  // Hängende Trompete/Geige als Wandschmuck
  defineProp({
    name: 'violin',
    create(f, opts) {
      const g = new THREE.Group();
      const wood = mat('woodLight');
      const a = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), wood); a.scale.set(1, 1.15, 0.3); a.position.y = -0.12; g.add(a);
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), wood); b.scale.set(1, 1.1, 0.3); b.position.y = 0.14; g.add(b);
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.03), mat('black')); neck.position.y = 0.42; g.add(neck);
      const scroll = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.012, 5, 10), mat('woodDark')); scroll.position.y = 0.64; g.add(scroll);
      for (const sx of [-0.012, -0.004, 0.004, 0.012]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.75, 0.002), mat('cream')); st.position.set(sx, 0.2, 0.05); g.add(st); }
      f.object(g, [0, 0, 0.06], [0, 0, opts.tilt ?? 0.2]);
    },
  }),
];
