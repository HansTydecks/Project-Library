import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, torus } from '../world/geo.js';
import { mat, hdr } from '../world/materials.js';
import { tex } from '../world/textures.js';
import { compactGroup } from '../world/kit.js';
import { behave, eyes, M, S } from './friends.js';

// Kreaturen, die etwas tun: Wichtel arbeiten, Eulen tragen Post, Bienen sammeln, Schäfchen springen,
// Bücher schlafen, Ameisen schleppen Buchstaben – und eine Katze, die dir folgt.

const BOOK_COLS = ['#c0405a', '#3a6ac0', '#3a9a6a', '#e0a030', '#9a5ad0', '#e06a3a'];
const bookMat = new Map();
const bm = (c) => { if (!bookMat.has(c)) bookMat.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })); return bookMat.get(c); };

/** Wichtel-Modell (Zipfelmütze, Schürze). Gibt { root, head, armR, armL, eyeList } zurück. */
function gnomeModel({ hat = 'candy', coat = 'porcelainBlue', apron = 'cream', s = 1 } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  body.add(M(new THREE.ConeGeometry(0.17, 0.36, 14), coat, [0, 0.2, 0]));
  body.add(M(new THREE.CylinderGeometry(0.1, 0.14, 0.22, 12, 1, true, -1, 2), apron, [0, 0.16, 0.02]));
  body.add(M(new THREE.TorusGeometry(0.13, 0.015, 4, 14), 'woodDark', [0, 0.24, 0], [Math.PI / 2, 0, 0]));
  for (const sx of [-1, 1]) body.add(M(S(0.045, 8, 6), 'woodDark', [sx * 0.07, 0.03, 0.04], null, [1, 0.6, 1.5]));
  const head = new THREE.Group(); head.position.y = 0.44; root.add(head);
  head.add(M(S(0.1, 14, 12), 'skin'));
  head.add(M(S(0.035, 8, 6), 'pastelPeach', [0, -0.01, 0.1]));
  const eyeList = eyes(head, { y: 0.025, z: 0.085, gap: 0.06, r: 0.019 });
  for (const sx of [-1, 1]) head.add(M(new THREE.ConeGeometry(0.03, 0.1, 6), 'skin', [sx * 0.1, 0.02, 0], [0, 0, -sx * 1.3]));
  head.add(M(new THREE.ConeGeometry(0.1, 0.06, 14), 'beard', [0, -0.08, 0.05], [Math.PI, 0, 0]));
  head.add(M(new THREE.ConeGeometry(0.11, 0.3, 12), hat, [0.02, 0.17, -0.02], [-0.25, 0, -0.2]));
  head.add(M(S(0.025, 8, 6), 'white', [0.08, 0.3, -0.07]));
  const arm = (sx) => { const a = new THREE.Group(); a.position.set(sx * 0.13, 0.3, 0.02); a.add(M(new THREE.CapsuleGeometry(0.03, 0.12, 3, 6), coat, [0, -0.08, 0])); a.add(M(S(0.035, 8, 6), 'skin', [0, -0.17, 0])); root.add(a); return a; };
  const armR = arm(1), armL = arm(-1);
  compactGroup(body); compactGroup(head, eyeList);
  root.scale.setScalar(s);
  return { root, head, armR, armL, eyeList };
}

export default [
  // Arbeitender Wichtel: task 'hammer' | 'glue' | 'carry' (trägt Bücher zwischen zwei Punkten)
  defineProp({
    name: 'workerGnome',
    create(f, opts, kit) {
      const task = opts.task ?? 'hammer';
      const g = gnomeModel({ hat: opts.hat ?? 'candy', coat: opts.coat ?? 'porcelainBlue', s: opts.scale ?? 1.3 });
      const { root, armR, armL, head } = g;
      let tool;
      if (task === 'hammer') {
        tool = new THREE.Group(); armR.add(tool); tool.position.y = -0.17;
        tool.add(M(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 5), 'woodLight', [0, -0.06, 0.04], [Math.PI / 2, 0, 0]));
        tool.add(M(new THREE.BoxGeometry(0.06, 0.035, 0.035), 'iron', [0, -0.06, 0.12]));
      } else if (task === 'glue') {
        tool = M(new THREE.CylinderGeometry(0.01, 0.02, 0.12, 6), 'woodLight', [0, -0.2, 0.03]); armR.add(tool);
      }
      const books = new THREE.Group(); root.add(books); books.position.set(0, 0.34, 0.16); books.visible = task === 'carry';
      BOOK_COLS.slice(0, 3).forEach((c, i) => books.add(M(new THREE.BoxGeometry(0.16, 0.04, 0.12), bm(c), [0, i * 0.042, 0], [0, i * 0.2, 0])));
      f.object(root, [0, 0, 0], [0, opts.rot ?? 0, 0]);
      const a = f.point(...(opts.from ?? [0, 0, 0])), b = f.point(...(opts.to ?? [2, 0, 0]));
      let k = 0, dir = 1, wait = 0;
      const sfx = kit.services.audio, wp = f.world(0, 0, 0);
      kit.onUpdate((dt, t, ctx) => {
        if (task === 'hammer') {
          const ph = (t * 2.2) % 1;
          armR.rotation.x = -Math.max(0, Math.sin(ph * Math.PI * 2)) * 1.6 + 0.2;
          if (ph < 0.05 && Math.hypot(ctx.player.x - wp.x, ctx.player.z - wp.z) < 6 && Math.random() < 0.6) sfx.play('tick');
          head.rotation.x = 0.25;
        } else if (task === 'glue') {
          armR.rotation.x = -0.9 + Math.sin(t * 3) * 0.3; armR.rotation.z = Math.sin(t * 3) * 0.4; head.rotation.x = 0.3;
        } else if (task === 'carry') {
          if (wait > 0) { wait -= dt; books.visible = dir > 0; return; }
          k += dir * dt * 0.25;
          if (k > 1 || k < 0) { dir *= -1; k = Math.max(0, Math.min(1, k)); wait = 1.5; }
          root.position.lerpVectors(a, b, k);
          root.position.y += Math.abs(Math.sin(t * 9)) * 0.03;
          root.rotation.y = Math.atan2((b.x - a.x) * dir, (b.z - a.z) * dir);
          armR.rotation.x = armL.rotation.x = -1.2;
        }
        armL.rotation.x = task === 'carry' ? -1.2 : Math.sin(t * 1.3) * 0.1;
      });
      if (opts.friend) behave(f, kit, opts, { root, head, eyeList: g.eyeList, turn: 'none', hitSize: [0.5, 0.8, 0.5], hitAt: [0, 0.35, 0] });
    },
  }),

  // Fließband: Bücher wandern vorbei. Hebel: Tempo 1–4, bei 4 fliegen die Bücher im Bogen in den Korb.
  defineProp({
    name: 'conveyorBelt',
    create(f, opts, kit) {
      const L = opts.length ?? 5, H = 0.8;
      f.add(box(L, 0.1, 0.7, 1), 'iron', [0, H, 0]);
      f.add(box(L, 0.02, 0.6, 1), 'black', [0, H + 0.06, 0]);
      for (let x = -L / 2 + 0.2; x < L / 2; x += 0.45) f.add(cyl(0.06, 0.06, 0.72, 8), 'brass', [x, H - 0.04, 0], [Math.PI / 2, 0, 0]);
      for (const x of [-L / 2 + 0.2, L / 2 - 0.2]) for (const z of [-0.3, 0.3]) f.add(box(0.08, H, 0.08, 0), 'iron', [x, H / 2, z]);
      // Korb am Ende
      f.add(cyl(0.45, 0.35, 0.5, 14), 'woodLight', [L / 2 + 0.8, 0.25, 0]);
      f.collider(0, 0, L, 0.8, { top: H + 0.07 });
      f.collider(L / 2 + 0.8, 0, 0.9, 0.9, { top: 0.5 });
      const N = 7;
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.24, 0.3), new THREE.MeshStandardMaterial({ roughness: 0.6 }), N);
      const c = new THREE.Color();
      for (let i = 0; i < N; i++) im.setColorAt(i, c.set(BOOK_COLS[i % BOOK_COLS.length]));
      f.object(im);
      const st = Array.from({ length: N }, (_, i) => ({ k: i / N, fly: -1, fx: 0, fy: 0, spin: 0 }));
      // Hebel
      const lever = new THREE.Group();
      lever.add(M(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), 'iron', [0, 0.3, 0]));
      lever.add(M(S(0.06, 10, 8), 'candy', [0, 0.62, 0]));
      f.add(box(0.3, 0.2, 0.3, 0), 'woodDark', [-L / 2 - 0.6, 0.1, 0.5]);
      f.object(lever, [-L / 2 - 0.6, 0.2, 0.5]);
      let speed = 1;
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
      const egg = opts.egg ?? 'buecherflug';
      kit.services.secrets.register(egg, 'Bücher im Höhenflug', kit.room?.id, 'egg');
      kit.onUpdate((dt, t) => {
        lever.rotation.z = -0.6 + (speed - 1) * 0.4;
        for (let i = 0; i < N; i++) {
          const o = st[i];
          if (o.fly >= 0) {
            o.fly += dt;
            const k = Math.min(1, o.fly / 1.1);
            p.set(L / 2 + k * 0.8, H + 0.2 + Math.sin(k * Math.PI) * 2.2 - k * 0.4, 0);
            e.set(o.spin * k * 6, 0, o.spin * k * 4); q.setFromEuler(e);
            if (o.fly > 1.1) { o.fly = -1; o.k = 0; }
          } else {
            o.k += dt * 0.08 * speed;
            if (o.k >= 1) { if (speed >= 4) { o.fly = 0; o.spin = (i % 2 ? 1 : -1); } else o.k = 0; }
            p.set(-L / 2 + Math.min(1, o.k) * L, H + 0.19, 0);
            q.identity();
          }
          m4.compose(f.point(p.x, p.y, p.z), q.multiply(new THREE.Quaternion().setFromAxisAngle(THREE.Object3D.DEFAULT_UP, f.rotY)), one);
          im.setMatrixAt(i, m4);
        }
        im.instanceMatrix.needsUpdate = true;
      });
      f.hitbox([-L / 2 - 0.6, 0.5, 0.5], [0.5, 0.9, 0.5], {
        label: 'Hebel am Fließband', verb: () => (speed >= 4 ? 'Zurückstellen' : 'Schneller!'),
        onInteract: () => {
          speed = speed >= 4 ? 1 : speed + 1;
          kit.services.audio.play(speed >= 4 ? 'boing' : 'tick');
          if (speed >= 4) { kit.services.secrets.found(egg); kit.services.ui.toast('Volle Kraft! Die Bücher fliegen in hohem Bogen in den Korb. Meister Kleister tut so, als wäre das geplant.'); }
          else kit.services.ui.toast(`Fließband: Stufe ${speed} von 4`);
        },
      });
    },
  }),

  // Buchpresse mit Spindel, die sich auf und ab bewegt
  defineProp({
    name: 'bookPress',
    create(f, opts, kit) {
      f.add(box(1, 0.1, 0.7, 0), 'iron', [0, 0.85, 0]);
      for (const x of [-0.42, 0.42]) f.add(box(0.08, 1.6, 0.08, 0), 'iron', [x, 0.8, 0]);
      f.add(box(1, 0.12, 0.2, 0), 'iron', [0, 1.6, 0]);
      f.add(box(0.5, 0.2, 0.36, 0), bm('#3a6ac0'), [0, 0.98, 0]);
      const plate = new THREE.Group();
      plate.add(M(new THREE.BoxGeometry(0.7, 0.06, 0.5), 'brass'));
      plate.add(M(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), 'brass', [0, 0.35, 0]));
      plate.add(M(new THREE.TorusGeometry(0.18, 0.02, 6, 16), 'brass', [0, 0.7, 0], [Math.PI / 2, 0, 0]));
      f.object(plate, [0, 1.15, 0]);
      const y0 = plate.position.y;
      kit.onUpdate((dt, t) => { const k = (Math.sin(t * 0.9) + 1) / 2; plate.position.y = y0 + k * 0.12; plate.rotation.y = k * 3; });
      f.collider(0, 0, 1, 0.7);
    },
  }),

  // Posteulen fliegen Briefe zwischen Punkten hin und her
  defineProp({
    name: 'postOwls',
    create(f, opts, kit) {
      const n = opts.count ?? 3, R = opts.radius ?? 4, y = opts.y ?? 3.2;
      const owls = [];
      const feather = ['#a8845a', '#c8b8a0', '#8a7a6a'];
      for (let i = 0; i < n; i++) {
        const g = new THREE.Group();
        const fm = new THREE.MeshStandardMaterial({ color: feather[i % 3], roughness: 0.9 });
        g.add(M(S(0.12, 12, 10), fm, [0, 0, 0], null, [1, 1.1, 1.2]));
        g.add(M(S(0.09, 12, 10), fm, [0, 0.13, 0.05]));
        eyes(g, { y: 0.15, z: 0.12, gap: 0.07, r: 0.022 });
        g.add(M(new THREE.ConeGeometry(0.015, 0.04, 6), 'orange', [0, 0.12, 0.15], [Math.PI / 2, 0, 0]));
        g.add(M(new THREE.BoxGeometry(0.1, 0.07, 0.01), 'white', [0, -0.12, 0.05], [0.3, 0, 0]));
        const wings = [];
        for (const sx of [-1, 1]) { const w = new THREE.Group(); w.position.set(sx * 0.1, 0.03, 0); w.add(M(new THREE.BoxGeometry(0.28, 0.015, 0.16), fm, [sx * 0.14, 0, 0])); g.add(w); wings.push(w); }
        compactGroup(g, wings);
        f.object(g);
        owls.push({ g, wings, ph: (i / n) * Math.PI * 2, sp: 0.35 + i * 0.07 });
      }
      const c0 = f.point(0, y, 0);
      kit.onUpdate((dt, t) => {
        for (const o of owls) {
          const a = t * o.sp + o.ph;
          const px = o.g.position.x, pz = o.g.position.z;
          o.g.position.set(c0.x + Math.sin(a) * R, c0.y + Math.sin(a * 2) * 0.6, c0.z + Math.sin(a * 2) * R * 0.45);
          o.g.rotation.y = Math.atan2(o.g.position.x - px, o.g.position.z - pz);
          const fl = Math.sin(t * 14 + o.ph) * 0.7;
          o.wings[0].rotation.z = fl; o.wings[1].rotation.z = -fl;
        }
      });
    },
  }),

  // Bienen fliegen zwischen Blumen und Stock (InstancedMesh: wenige Draw Calls)
  defineProp({
    name: 'bees',
    create(f, opts, kit) {
      const n = opts.count ?? 18;
      const targets = (opts.targets ?? [[0, 0.6, 0]]).map((p) => f.point(...p));
      const hive = f.point(...(opts.hive ?? [0, 1, 0]));
      const body = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 8, 6), mat('duck'), n);
      const wing = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.004, 0.035), new THREE.MeshBasicMaterial({ color: '#f4faff', transparent: true, opacity: 0.7 }), n);
      f.object(body); f.object(wing);
      const st = Array.from({ length: n }, (_, i) => ({ from: hive.clone(), to: targets[i % targets.length].clone(), k: (i * 0.37) % 1, sp: 0.25 + (i % 5) * 0.05, ph: i * 1.7 }));
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s1 = new THREE.Vector3(1, 0.85, 1.3), sw = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
      kit.onUpdate((dt, t) => {
        for (let i = 0; i < n; i++) {
          const o = st[i];
          o.k += dt * o.sp;
          if (o.k >= 1) { o.k = 0; o.from.copy(o.to); o.to.copy(Math.random() < 0.3 ? hive : targets[Math.floor(Math.random() * targets.length)]); }
          p.lerpVectors(o.from, o.to, o.k);
          p.y += Math.sin(o.k * Math.PI) * 0.6 + Math.sin(t * 9 + o.ph) * 0.04;
          p.x += Math.sin(t * 7 + o.ph) * 0.06;
          q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, Math.atan2(o.to.x - o.from.x, o.to.z - o.from.z));
          m4.compose(p, q, s1); body.setMatrixAt(i, m4);
          p.y += 0.035; sw.set(1, 1, 1 + Math.sin(t * 40 + i) * 0.4); m4.compose(p, q, sw); wing.setMatrixAt(i, m4);
        }
        body.instanceMatrix.needsUpdate = true; wing.instanceMatrix.needsUpdate = true;
      });
    },
  }),

  // Bienenkönigin (Bekanntschaft) über dem Stock
  defineProp({
    name: 'queenBee',
    create(f, opts, kit) {
      const root = new THREE.Group();
      const body = new THREE.Group(); root.add(body);
      body.add(M(S(0.14, 14, 12), 'duck', [0, 0, -0.08], null, [1, 0.9, 1.3]));
      for (const z of [-0.12, -0.02]) body.add(M(new THREE.TorusGeometry(0.125, 0.025, 6, 16), 'black', [0, 0, z], null, [1, 0.9, 1]));
      const head = new THREE.Group(); head.position.set(0, 0.06, 0.12); root.add(head);
      head.add(M(S(0.1, 14, 12), 'duck'));
      const ey = eyes(head, { y: 0.02, z: 0.08, gap: 0.07, r: 0.022 });
      head.add(M(new THREE.CylinderGeometry(0.05, 0.06, 0.05, 6, 1, true), 'gold', [0, 0.11, 0]));
      for (const sx of [-1, 1]) { head.add(M(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 4), 'black', [sx * 0.04, 0.12, 0.03], [0.4, 0, sx * 0.4])); head.add(M(S(0.014, 6, 5), 'candy', [sx * 0.065, 0.17, 0.06])); }
      const wings = [];
      for (const sx of [-1, 1]) { const w = M(new THREE.CircleGeometry(0.12, 12), new THREE.MeshBasicMaterial({ color: '#f4faff', transparent: true, opacity: 0.6, side: THREE.DoubleSide }), [sx * 0.12, 0.1, -0.05]); root.add(w); wings.push(w); }
      compactGroup(body); compactGroup(head, ey);
      f.object(root, [0, opts.y ?? 1.6, 0]);
      const y0 = root.position.y;
      kit.onUpdate((dt, t) => { root.position.y = y0 + Math.sin(t * 1.6) * 0.08; wings[0].rotation.y = 0.6 + Math.sin(t * 40) * 0.4; wings[1].rotation.y = -0.6 - Math.sin(t * 40) * 0.4; });
      behave(f, kit, opts, { root, head, eyeList: ey, turn: 'body', hitSize: [0.5, 0.5, 0.6], hitAt: [0, 0, 0] });
    },
  }),

  // Bienenstock (Strohkorb) – gibt einmal ein Glas Honig
  defineProp({
    name: 'beehive',
    create(f, opts, kit) {
      f.add(cyl(0.35, 0.4, 0.5, 12), 'woodDark', [0, 0.25, 0]);
      for (let i = 0; i < 5; i++) f.add(torus(0.36 - i * 0.06, 0.06, 6, 16), 'pastelLemon', [0, 0.55 + i * 0.1, 0], [Math.PI / 2, 0, 0]);
      f.add(sphere(0.1, 8, 6), 'pastelLemon', [0, 1.05, 0]);
      f.add(cyl(0.06, 0.06, 0.02, 10), 'black', [0, 0.62, 0.33], [Math.PI / 2, 0, 0]);
      f.collider(0, 0, 0.8, 0.8);
      const items = kit.services.items;
      f.hitbox([0, 0.7, 0], [0.8, 0.9, 0.8], {
        label: 'Bienenstock', verb: () => (items.seen('honig') ? 'Lauschen' : 'Honig nehmen (höflich)'),
        onInteract: () => { kit.services.audio.play('bubble'); if (!items.give('honig')) kit.services.ui.toast('Ssssss. Die Bienen summen ein Lied über Klee.'); },
      });
    },
  }),

  // Schlafendes Buch im Bettchen. Anklicken weckt es kurz. Alle wecken → Osterei.
  defineProp({
    name: 'sleepingBook',
    create(f, opts, kit) {
      const col = opts.color ?? BOOK_COLS[Math.abs(Math.round(f.point(0, 0, 0).x * 3)) % BOOK_COLS.length];
      f.add(box(0.9, 0.25, 0.55, 0), 'woodLight', [0, 0.125, 0]);
      f.add(box(0.06, 0.55, 0.6, 0), 'woodLight', [-0.45, 0.28, 0]);
      f.add(box(0.06, 0.4, 0.6, 0), 'woodLight', [0.45, 0.2, 0]);
      f.add(box(0.2, 0.08, 0.4, 0), 'white', [-0.3, 0.29, 0]);
      const blanket = M(new THREE.BoxGeometry(0.55, 0.06, 0.52), opts.blanket ?? 'pastelSky'); f.object(blanket, [0.1, 0.3, 0]);
      const g = new THREE.Group();
      g.add(M(new THREE.BoxGeometry(0.22, 0.05, 0.3), bm(col)));
      const ey = eyes(g, { y: 0.03, z: 0.15, gap: 0.08, r: 0.02 });
      for (const e of ey) e.scale.y = 0.12;
      f.object(g, [-0.3, 0.36, 0], [0, Math.PI / 2, 0]);
      const zz = f.glow([-0.2, 0.6, 0], { color: '#ffffff', size: 0.15, opacity: 0.4 });
      const zp = zz.position.clone();
      let awake = 0;
      const reg = kit.services.fx; reg.sleepers = reg.sleepers ?? new Map();
      const id = `${kit.id}:${f.point(0, 0, 0).x.toFixed(1)}`;
      reg.sleepers.set(id, 0);
      const egg = 'alle-wach';
      kit.services.secrets.register(egg, 'Alle Bücher gleichzeitig geweckt', kit.room?.id, 'egg');
      kit.onUpdate((dt, t) => {
        awake = Math.max(0, awake - dt);
        const br = Math.sin(t * 1.3 + zp.x);
        blanket.scale.y = 1 + br * 0.15;
        g.rotation.x = awake > 0 ? -0.5 : 0;
        for (const e of ey) e.scale.y = awake > 0 ? 1 : 0.12;
        const k = (t * 0.35 + zp.x) % 1;
        zz.visible = awake <= 0; zz.position.set(zp.x + k * 0.2, zp.y + k * 0.5, zp.z); zz.material.opacity = 0.5 * (1 - k);
      });
      f.collider(0, 0, 0.95, 0.6, { top: 0.32 });
      f.hitbox([0, 0.35, 0], [0.9, 0.5, 0.6], {
        label: 'Schlafendes Buch', verb: 'Sanft wecken',
        onInteract: () => {
          awake = 8; reg.sleepers.set(id, kit.services.fx.now?.() ?? performance.now() / 1000);
          kit.services.audio.play('page');
          const now = performance.now() / 1000;
          const all = [...reg.sleepers.values()].every((v) => now - v < 8);
          if (all) { kit.services.secrets.found(egg); kit.services.ui.toast('Alle Bücher sind wach! Sie gähnen im Chor und schlafen sofort wieder ein.'); }
          else kit.services.ui.toast('»Hmmm? Noch fünf Kapitel …« Das Buch blinzelt und zieht die Decke hoch.');
        },
      });
    },
  }),

  // Schäfchenwolken springen über einen Zaun. Zehn Sprünge anklicken → Osterei (nachdem Wolle die Wolle bekam).
  defineProp({
    name: 'sheepFence',
    create(f, opts, kit) {
      const W = opts.width ?? 3;
      for (const x of [-W / 2, 0, W / 2]) f.add(box(0.08, 0.6, 0.08, 0), 'woodLight', [x, 0.3, 0]);
      for (const y of [0.25, 0.5]) f.add(box(W, 0.06, 0.04, 0), 'woodLight', [0, y, 0]);
      f.collider(0, 0, W, 0.2, { top: 0.6 });
      const n = opts.count ?? 4;
      const sheep = [];
      for (let i = 0; i < n; i++) {
        const g = new THREE.Group();
        const wool = new THREE.MeshStandardMaterial({ color: '#fbf8ff', roughness: 1, emissive: '#3a3848' });
        for (let k = 0; k < 6; k++) g.add(M(S(0.13, 10, 8), wool, [Math.cos(k) * 0.12, 0.3 + Math.sin(k * 2) * 0.05, Math.sin(k * 1.3) * 0.1]));
        const head = M(S(0.08, 10, 8), 'black', [0, 0.32, 0.2]); g.add(head);
        eyes(head, { y: 0.02, z: 0.06, gap: 0.05, r: 0.014 });
        for (const sx of [-1, 1]) for (const z of [-0.08, 0.1]) g.add(M(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 5), 'black', [sx * 0.07, 0.1, z]));
        compactGroup(g, [head]);
        const hit = M(new THREE.BoxGeometry(0.45, 0.45, 0.5), 'invisible', [0, 0.3, 0]); hit.userData.hitbox = true; g.add(hit);
        f.object(g, [0, 0, 0], [0, Math.PI / 2, 0]);
        sheep.push({ g, hit, k: i / n });
      }
      const a = f.point(0, 0, -2.4), b = f.point(0, 0, 2.4);
      const egg = opts.egg ?? 'schaefchen-zaehlen';
      kit.services.secrets.register(egg, 'Zehn Schäfchen gezählt', kit.room?.id, 'egg');
      let count = 0;
      kit.onUpdate((dt) => {
        for (const s of sheep) {
          s.k = (s.k + dt * 0.12) % 1;
          s.g.position.lerpVectors(b, a, s.k);
          const j = Math.abs(s.k - 0.5) < 0.12 ? Math.cos(((s.k - 0.5) / 0.12) * Math.PI / 2) : 0;
          s.g.position.y = f.point(0, 0, 0).y + j * 0.9;
          s.g.rotation.x = (s.k - 0.5) * j * 2;
        }
      });
      for (const s of sheep) f.interactable(s.hit, {
        label: 'Schäfchenwolke', verb: 'Zählen',
        onInteract: () => {
          count++;
          kit.services.audio.play('note');
          if (count === 10) { kit.services.secrets.found(egg); kit.services.ui.toast('Zehn! Du bist jetzt offiziell sehr müde. (Bist du nicht. Aber die Schafe sind stolz auf dich.)', { ms: 6500 }); }
          else kit.services.ui.toast(`${count} …`, { ms: 1200 });
        },
      });
    },
  }),

  // Wolle, das Leitschaf (Bekanntschaft) – mit Glöckchen und Schlafmütze
  defineProp({
    name: 'friendSheep',
    create(f, opts, kit) {
      const root = new THREE.Group();
      const body = new THREE.Group(); root.add(body);
      const wool = new THREE.MeshStandardMaterial({ color: '#fbf8ff', roughness: 1, emissive: '#3a3848' });
      for (let k = 0; k < 9; k++) body.add(M(S(0.17, 10, 8), wool, [Math.cos(k * 0.7) * 0.18, 0.42 + Math.sin(k * 2) * 0.07, Math.sin(k * 1.3) * 0.15 - 0.05]));
      for (const sx of [-1, 1]) for (const z of [-0.12, 0.14]) body.add(M(new THREE.CylinderGeometry(0.022, 0.022, 0.3, 5), 'black', [sx * 0.1, 0.15, z]));
      body.add(M(new THREE.TorusGeometry(0.09, 0.015, 6, 14), 'candy', [0, 0.38, 0.22], [0.3, 0, 0]));
      body.add(M(new THREE.SphereGeometry(0.035, 8, 6), 'gold', [0, 0.3, 0.29]));
      const head = new THREE.Group(); head.position.set(0, 0.5, 0.3); root.add(head);
      head.add(M(S(0.11, 12, 10), 'black', null, null, [0.9, 1, 1.1]));
      const ey = eyes(head, { y: 0.03, z: 0.09, gap: 0.07, r: 0.02 });
      for (const sx of [-1, 1]) head.add(M(new THREE.SphereGeometry(0.05, 8, 6), 'black', [sx * 0.11, 0.03, -0.02], null, [1, 0.4, 0.7]));
      head.add(M(new THREE.ConeGeometry(0.1, 0.25, 12), 'pastelSky', [0.03, 0.18, -0.02], [-0.3, 0, -0.4]));
      head.add(M(S(0.03, 6, 5), 'white', [0.12, 0.27, -0.07]));
      compactGroup(body); compactGroup(head, ey);
      f.object(root, [0, 0, 0], [0, opts.rot ?? 0, 0]);
      kit.onUpdate((dt, t) => { body.scale.y = 1 + Math.sin(t * 1.4) * 0.02; });
      behave(f, kit, opts, { root, head, eyeList: ey, hitSize: [0.6, 0.8, 0.8], hitAt: [0, 0.4, 0], onGreet: () => kit.services.audio.play('note') });
    },
  }),

  // Bücherameisen: eine Ameisenstraße, die Buchstaben trägt (instanziert)
  defineProp({
    name: 'antTrail',
    create(f, opts, kit) {
      const L = opts.length ?? 4, n = opts.count ?? 24;
      const ant = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 6, 4), mat('black'), n);
      const load = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.035, 0.008), mat('white'), n);
      f.object(ant); f.object(load);
      const a = f.point(-L / 2, 0.02, 0), b = f.point(L / 2, 0.02, 0);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(THREE.Object3D.DEFAULT_UP, f.rotY + Math.PI / 2), s = new THREE.Vector3(1, 0.7, 1.8), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
      kit.onUpdate((dt, t) => {
        for (let i = 0; i < n; i++) {
          const k = ((i / n) + t * 0.03) % 1;
          p.lerpVectors(a, b, k); p.z += Math.sin(k * 20 + i) * 0.02; p.y += Math.abs(Math.sin(t * 12 + i)) * 0.004;
          m4.compose(p, q, s); ant.setMatrixAt(i, m4);
          p.y += 0.035; m4.compose(p, q, one); load.setMatrixAt(i, m4);
        }
        ant.instanceMatrix.needsUpdate = true; load.instanceMatrix.needsUpdate = true;
      });
      f.hitbox([0, 0.05, 0], [L, 0.12, 0.25], {
        label: 'Ameisenstraße', verb: 'Genau hinsehen',
        onInteract: () => kit.services.ui.toast('Die Ameisen tragen Buchstaben ins Archiv. Heute: lauter »E«. Morgen vermutlich »N«.'),
      });
    },
  }),

  // Haustier: Katze, die nach einem Keks mit dir kommt (wechselt mit dir die Räume)
  defineProp({
    name: 'petCat',
    create(f, opts, kit) {
      const fur = mat(opts.fur ?? 'fur');
      const g = new THREE.Group();
      const body = M(S(0.2, 14, 10), fur, [0, 0.2, 0], null, [0.9, 0.7, 1.3]); g.add(body);
      const head = new THREE.Group(); head.position.set(0, 0.34, 0.24); g.add(head);
      head.add(M(S(0.11, 12, 10), fur));
      for (const sx of [-1, 1]) { head.add(M(new THREE.ConeGeometry(0.04, 0.08, 4), fur, [sx * 0.06, 0.1, 0])); head.add(M(new THREE.ConeGeometry(0.022, 0.05, 4), 'pastelPink', [sx * 0.06, 0.1, 0.015])); }
      const ey = eyes(head, { y: 0.02, z: 0.09, gap: 0.07, r: 0.02, color: 'leaves' });
      head.add(M(S(0.014, 6, 4), 'pastelPink', [0, -0.02, 0.11]));
      for (const sx of [-1, 1]) for (const k of [-1, 1]) head.add(M(new THREE.BoxGeometry(0.1, 0.0015, 0.0015), 'white', [sx * 0.07, -0.025 + k * 0.006, 0.09], [0, -sx * 0.4, k * 0.1]));
      const legs = [];
      for (const sx of [-1, 1]) for (const z of [-0.14, 0.14]) { const l = M(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 6), fur, [sx * 0.09, 0.08, z]); g.add(l); legs.push(l); }
      const tail = M(new THREE.CylinderGeometry(0.025, 0.02, 0.35, 6), fur, [0, 0.35, -0.3], [0.8, 0, 0]); g.add(tail);
      compactGroup(head, ey);
      f.object(g, [0, 0, 0], [0, opts.rot ?? 0, 0]);
      const svc = kit.services, items = svc.items, egg = 'haustier';
      svc.secrets.register(egg, 'Eine Katze, die dir folgt', kit.room?.id, 'egg');
      let following = svc.progress.has('secrets', egg), sit = 0, idle = 0;
      const wp = new THREE.Vector3(), target = new THREE.Vector3();
      function adopt() {
        following = true;
        // In die Szene umziehen, damit sie mit dir durch alle Räume kommt
        g.getWorldPosition(wp);
        const scene = kit.group.parent; if (!scene) return;
        scene.add(g); g.position.copy(wp); g.scale.setScalar(1);
      }
      if (following) setTimeout(() => adopt(), 0);
      kit.onUpdate((dt, t) => { if (!following) { body.scale.y = 0.7 + Math.sin(t * 1.5) * 0.02; tail.rotation.z = Math.sin(t) * 0.3; } });
      svc.onTick((dt, t) => {
        if (!following || !g.parent || g.parent === kit.group) return;
        const p = svc.player.pos;
        const back = new THREE.Vector3(Math.sin(svc.player.yaw), 0, Math.cos(svc.player.yaw)).multiplyScalar(1.3);
        target.set(p.x + back.x + 0.6 * Math.cos(svc.player.yaw), p.y, p.z + back.z - 0.6 * Math.sin(svc.player.yaw));
        const d = g.position.distanceTo(target);
        if (d > 12) g.position.copy(target); // zu weit weg (z. B. teleportiert): hinterherzaubern
        const moving = d > 0.4;
        if (moving) {
          const step = Math.min(d, dt * Math.min(7, 1.5 + d * 1.6));
          const dir = target.clone().sub(g.position).normalize();
          g.position.addScaledVector(dir, step);
          g.rotation.y = Math.atan2(dir.x, dir.z);
          legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 14 + i * Math.PI / 2) * 0.6; });
          sit = Math.max(0, sit - dt * 3);
        } else { sit = Math.min(1, sit + dt * 2); legs.forEach((l) => { l.rotation.x = 0; }); }
        g.position.y += (p.y - g.position.y) * Math.min(1, dt * 8);
        body.rotation.x = -sit * 0.4; tail.rotation.z = Math.sin(t * 2) * 0.5;
        idle = moving ? 0 : idle + dt;
        if (idle > 25 && Math.random() < dt * 0.1) { svc.audio.play('purr'); idle = 0; }
      });
      const hit = M(new THREE.BoxGeometry(0.5, 0.5, 0.7), 'invisible', [0, 0.25, 0]); hit.userData.hitbox = true; g.add(hit);
      f.interactable(hit, {
        label: () => (following ? 'Deine Katze' : opts.name ?? 'Kaminkatze'),
        verb: () => (following ? 'Streicheln' : items.has('keks') ? '🍪 Keks geben' : 'Streicheln'),
        onInteract: () => {
          svc.audio.play('purr');
          if (!following && items.has('keks')) {
            items.take('keks'); svc.secrets.found(egg); adopt();
            svc.ui.toast('Die Katze knuspert den Keks, schaut dich lange an – und beschließt, dass ihr jetzt zusammengehört.', { ms: 7000 });
          } else svc.ui.toast(following ? 'Prrrrr. Sie folgt dir überallhin. Außer ins Lesebad.' : 'Die Katze schnuppert an deiner Tasche. Sie scheint etwas Knuspriges zu erwarten.');
        },
      });
    },
  }),
];
