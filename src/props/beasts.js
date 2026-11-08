import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, torus } from '../world/geo.js';
import { mat, hdr } from '../world/materials.js';
import { tex } from '../world/textures.js';
import { compactGroup } from '../world/kit.js';
import { behave, eyes, M, S } from './friends.js';

// Fabelwesen & weitere Tiere: Baby-Drachen, Phönixküken, Quallen, Einhornfohlen, Bärin, Pinguin, Wühlmaus,
// Schildkröte und eine Café-Wolke.

/** Baby-Drachen-Modell. Gibt { g, wings, head, eyeList } zurück. */
function dragonModel(color = 'dragon', s = 1) {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  body.add(M(S(0.18, 14, 12), color, [0, 0, 0], null, [1, 0.9, 1.3]));
  body.add(M(S(0.13, 12, 10), 'dragonBelly', [0, -0.04, 0.06], null, [0.9, 0.8, 1.1]));
  for (let i = 0; i < 4; i++) body.add(M(S(0.08 - i * 0.015, 8, 6), color, [0, 0.02 - i * 0.02, -0.22 - i * 0.1]));
  body.add(M(new THREE.ConeGeometry(0.05, 0.1, 4), 'pastelPink', [0, -0.05, -0.62], [-Math.PI / 2, 0, 0]));
  for (let i = 0; i < 4; i++) body.add(M(new THREE.ConeGeometry(0.03, 0.07, 4), 'pastelLemon', [0, 0.17 - i * 0.02, 0.08 - i * 0.12]));
  const head = new THREE.Group(); head.position.set(0, 0.12, 0.24); g.add(head);
  head.add(M(S(0.13, 14, 12), color));
  head.add(M(S(0.08, 10, 8), color, [0, -0.03, 0.1], null, [1, 0.8, 1]));
  const eyeList = eyes(head, { y: 0.04, z: 0.1, gap: 0.1, r: 0.032 });
  for (const sx of [-1, 1]) { head.add(M(new THREE.ConeGeometry(0.025, 0.09, 6), 'pastelLemon', [sx * 0.06, 0.12, -0.03], [-0.4, 0, sx * 0.3])); head.add(M(S(0.01, 6, 4), 'black', [sx * 0.03, -0.02, 0.18])); }
  const wings = [];
  for (const sx of [-1, 1]) { const w = new THREE.Group(); w.position.set(sx * 0.12, 0.1, 0); w.add(M(new THREE.ConeGeometry(0.2, 0.35, 3), 'pastelLilac', [sx * 0.18, 0, 0], [0, 0, sx * -Math.PI / 2], [1, 1, 0.15])); g.add(w); wings.push(w); }
  compactGroup(body); compactGroup(head, eyeList);
  g.scale.setScalar(s);
  return { g, wings, head, eyeList };
}

function sparkPoints(n, color, size = 0.06) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color, size, map: tex.glow(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
}

export default [
  // Baby-Drachen, die in Achten durch die Station fliegen und Funken niesen
  defineProp({
    name: 'babyDragons',
    create(f, opts, kit) {
      const n = opts.count ?? 3, R = opts.radius ?? 3.5, y = opts.y ?? 3;
      const cols = ['dragon', 'pastelPink', 'pastelSky'];
      const list = [];
      for (let i = 0; i < n; i++) { const d = dragonModel(cols[i % 3], 1.2); f.object(d.g); list.push({ ...d, ph: (i / n) * Math.PI * 2, sp: 0.3 + i * 0.05 }); }
      const sparks = sparkPoints(30, '#ffb060'); kit.group.add(sparks);
      const st = Array.from({ length: 30 }, () => ({ k: 1, p: new THREE.Vector3(), v: new THREE.Vector3() }));
      const c0 = f.point(0, y, 0);
      let sneeze = 3;
      kit.onUpdate((dt, t) => {
        for (const d of list) {
          const a = t * d.sp + d.ph, px = d.g.position.x, pz = d.g.position.z;
          d.g.position.set(c0.x + Math.sin(a) * R, c0.y + Math.sin(a * 3) * 0.4, c0.z + Math.sin(a * 2) * R * 0.5);
          d.g.rotation.y = Math.atan2(d.g.position.x - px, d.g.position.z - pz);
          const fl = Math.sin(t * 9 + d.ph) * 0.7; d.wings[0].rotation.z = fl; d.wings[1].rotation.z = -fl;
        }
        sneeze -= dt;
        if (sneeze < 0) { sneeze = 2 + Math.random() * 3; const d = list[Math.floor(Math.random() * list.length)]; const head = d.head.getWorldPosition(new THREE.Vector3()); kit.group.worldToLocal(head); for (const s of st) { s.k = 0; s.p.copy(head); s.v.set((Math.random() - 0.5) * 1.5, Math.random() * 0.8, (Math.random() - 0.5) * 1.5); } }
        const arr = sparks.geometry.attributes.position.array;
        st.forEach((s, i) => { s.k = Math.min(1, s.k + dt * 0.8); s.p.addScaledVector(s.v, dt); arr[i * 3] = s.p.x; arr[i * 3 + 1] = s.p.y; arr[i * 3 + 2] = s.p.z; });
        sparks.geometry.attributes.position.needsUpdate = true; sparks.material.opacity = 1 - (st[0]?.k ?? 1);
      });
    },
  }),

  // Funki: Baby-Drache, der nach einer Funkenbeere mit dir fliegt (zweites Haustier)
  defineProp({
    name: 'petDragon',
    create(f, opts, kit) {
      const svc = kit.services, items = svc.items, egg = 'drachenfreund';
      const d = dragonModel(opts.color ?? 'pastelMint', 1.1);
      const { g, wings } = d;
      f.object(g, [0, 0.4, 0], [0, opts.rot ?? 0, 0]);
      svc.secrets.register(egg, 'Ein Drache, der mit dir fliegt', kit.room?.id, 'egg');
      let following = svc.progress.has('secrets', egg);
      const home = g.position.clone();
      function adopt() { const wp = g.getWorldPosition(new THREE.Vector3()); const scene = kit.group.parent; if (!scene) return; scene.add(g); g.position.copy(wp); following = true; }
      if (following) setTimeout(adopt, 0);
      kit.onUpdate((dt, t) => { if (following) return; g.position.y = home.y + Math.sin(t * 2) * 0.05; const fl = Math.sin(t * 3) * 0.3; wings[0].rotation.z = fl; wings[1].rotation.z = -fl; });
      const target = new THREE.Vector3();
      svc.onTick((dt, t) => {
        if (!following || g.parent === kit.group || g.parent === kit.details) return;
        const p = svc.player.pos, yaw = svc.player.yaw;
        // schwebt rechts über der Schulter
        target.set(p.x + Math.cos(yaw) * 0.9 - Math.sin(yaw) * 0.3, p.y + 2.1 + Math.sin(t * 2) * 0.12, p.z - Math.sin(yaw) * 0.9 - Math.cos(yaw) * 0.3);
        const dist = g.position.distanceTo(target);
        if (dist > 15) g.position.copy(target);
        g.position.lerp(target, Math.min(1, dt * 2.5));
        g.rotation.y = yaw + Math.PI + Math.sin(t) * 0.3;
        const fl = Math.sin(t * 10) * 0.7; wings[0].rotation.z = fl; wings[1].rotation.z = -fl;
      });
      const hit = M(new THREE.BoxGeometry(0.6, 0.5, 0.8), 'invisible'); hit.userData.hitbox = true; g.add(hit);
      f.interactable(hit, {
        label: () => (following ? 'Funki (dein Drache)' : 'Funki, der kleine Drache'),
        verb: () => (!following && items.has('beere') ? '🫐 Funkenbeere geben' : 'Kraulen'),
        onInteract: () => {
          svc.audio.play('roar');
          if (!following && items.has('beere')) { items.take('beere'); svc.secrets.found(egg); adopt(); svc.ui.toast('Funki mampft die Funkenbeere, niest ein Feuerwerk – und flattert ab jetzt neben dir her!', { ms: 7000 }); }
          else svc.ui.toast(following ? 'Funki brummt zufrieden und pustet ein winziges Rauchherz.' : 'Funki schnuppert hungrig. Funkenbeeren wachsen dort, wo Pilze leuchten …');
        },
      });
    },
  }),

  // Phönixküken im Nest: schläft; geweckt → Funkenregen (Osterei)
  defineProp({
    name: 'phoenixNest',
    create(f, opts, kit) {
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; f.add(cyl(0.03, 0.03, 0.5, 4), 'bark', [Math.cos(a) * 0.35, 0.12, Math.sin(a) * 0.35], [Math.PI / 2, 0, a + 0.7]); }
      f.add(cyl(0.38, 0.28, 0.12, 14), 'woodLight', [0, 0.06, 0]);
      const g = new THREE.Group();
      g.add(M(S(0.15, 14, 12), 'orange', [0, 0.15, 0]));
      g.add(M(S(0.1, 12, 10), 'pastelLemon', [0, 0.28, 0.05]));
      const ey = eyes(g, { y: 0.3, z: 0.13, gap: 0.06, r: 0.018 });
      for (const e of ey) e.scale.y = 0.12;
      g.add(M(new THREE.ConeGeometry(0.02, 0.05, 5), 'gold', [0, 0.27, 0.15], [Math.PI / 2, 0, 0]));
      for (let i = 0; i < 3; i++) g.add(M(new THREE.ConeGeometry(0.02, 0.12, 5), 'candy', [(i - 1) * 0.04, 0.4, 0], [0, 0, (i - 1) * 0.4]));
      compactGroup(g, ey);
      f.object(g, [0, 0.05, 0]);
      const glow = f.glow([0, 0.3, 0], { color: '#ffb050', size: 0.9, opacity: 0.35 });
      const sparks = sparkPoints(40, '#ffc060', 0.08); kit.group.add(sparks);
      const c = f.point(0, 0.35, 0);
      const st = Array.from({ length: 40 }, (_, i) => ({ a: i * 0.9, r: 0, y: 0 }));
      let awake = 0;
      const egg = 'phoenix';
      kit.services.secrets.register(egg, 'Das Phönixküken geweckt', kit.room?.id, 'egg');
      kit.onUpdate((dt, t) => {
        awake = Math.max(0, awake - dt);
        for (const e of ey) e.scale.y = awake > 0 ? 1 : 0.12;
        g.scale.setScalar(1 + Math.sin(t * 1.4) * 0.03 + (awake > 0 ? 0.1 : 0));
        glow.material.opacity = 0.3 + (awake > 0 ? 0.3 : 0) + Math.sin(t * 3) * 0.05;
        const arr = sparks.geometry.attributes.position.array;
        st.forEach((s, i) => {
          if (awake > 0) { s.y += dt * (1 + (i % 5) * 0.3); s.r += dt * 0.3; if (s.y > 2.5) { s.y = 0; s.r = 0; } } else { s.y = 0; s.r = 0; }
          arr[i * 3] = c.x + Math.cos(s.a + t) * s.r; arr[i * 3 + 1] = c.y + s.y; arr[i * 3 + 2] = c.z + Math.sin(s.a + t) * s.r;
        });
        sparks.geometry.attributes.position.needsUpdate = true; sparks.visible = awake > 0;
      });
      f.collider(0, 0, 0.8, 0.8, { top: 0.15 });
      f.hitbox([0, 0.25, 0], [0.8, 0.5, 0.8], {
        label: 'Schlafendes Phönixküken', verb: 'Sanft anpusten',
        onInteract: () => { awake = 6; kit.services.secrets.found(egg); kit.services.audio.play('magic'); kit.services.ui.toast('Das Küken blinzelt, gähnt – und versprüht vor Freude einen Funkenregen. Danach schläft es sofort weiter.'); },
      });
    },
  }),

  // Schwebende Quallen-Lampen (instanziert, pulsieren)
  defineProp({
    name: 'jellyfish',
    create(f, opts, kit) {
      const n = opts.count ?? 6, area = opts.area ?? [10, 2, 10], y = opts.y ?? 3;
      const bell = new THREE.InstancedMesh(new THREE.SphereGeometry(0.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: hdr('#c8a8ff', 1.1), transparent: true, opacity: 0.55, depthWrite: false }), n);
      const tent = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.02, 0.7, 8, 1, true), new THREE.MeshBasicMaterial({ color: hdr('#a8e0ff', 1.0), transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }), n);
      const c = new THREE.Color();
      for (let i = 0; i < n; i++) { bell.setColorAt(i, c.set(['#ffffff', '#ffd0f0', '#d0f0ff'][i % 3])); }
      f.object(bell); f.object(tent);
      const c0 = f.point(0, y, 0);
      const st = Array.from({ length: n }, (_, i) => ({ x: (Math.cos(i * 2.4) * 0.5) * area[0], z: (Math.sin(i * 1.7) * 0.5) * area[2], ph: i * 1.3 }));
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p = new THREE.Vector3();
      kit.onUpdate((dt, t) => {
        st.forEach((o, i) => {
          const pulse = 1 + Math.sin(t * 2 + o.ph) * 0.12;
          p.set(c0.x + o.x + Math.sin(t * 0.2 + o.ph) * 0.5, c0.y + Math.sin(t * 0.5 + o.ph) * area[1] * 0.4, c0.z + o.z + Math.cos(t * 0.17 + o.ph) * 0.5);
          s3.set(pulse, 2 - pulse, pulse); m4.compose(p, q, s3); bell.setMatrixAt(i, m4);
          p.y -= 0.32; s3.set(1, 1 + Math.sin(t * 2 + o.ph + 1) * 0.15, 1); m4.compose(p, q, s3); tent.setMatrixAt(i, m4);
        });
        bell.instanceMatrix.needsUpdate = true; tent.instanceMatrix.needsUpdate = true;
      });
    },
  }),

  // Einhornfohlen im Stall: scharrt, schüttelt die Mähne, wiehert beim Streicheln
  defineProp({
    name: 'unicornFoal',
    create(f, opts, kit) {
      // Stall
      f.add(box(2.6, 0.06, 2.2, 1), 'woodLight', [0, 0.03, 0]);
      for (const [x, z, w, d] of [[0, -1.1, 2.6, 0.08], [-1.3, 0, 0.08, 2.2], [1.3, 0, 0.08, 2.2]]) { f.add(box(w, 1.1, d, 1), 'woodLight', [x, 0.55, z]); f.collider(x, z, w, d); }
      f.add(box(2.8, 0.1, 2.4, 1), 'roof', [0, 2.4, -0.1], [0.15, 0, 0]);
      for (const x of [-1.3, 1.3]) f.add(cyl(0.05, 0.05, 2.4, 6), 'woodDark', [x, 1.2, 1.1]);
      for (let i = 0; i < 10; i++) f.add(sphere(0.12, 6, 4), 'pastelLemon', [Math.cos(i) * 0.8, 0.08, -0.6 + Math.sin(i * 2) * 0.3], [0, 0, 0], [1.5, 0.4, 1]);
      const g = new THREE.Group();
      const white = new THREE.MeshStandardMaterial({ color: '#fbf6ff', roughness: 0.6 });
      g.add(M(new THREE.CapsuleGeometry(0.2, 0.4, 4, 10), white, [0, 0.62, 0], [Math.PI / 2, 0, 0]));
      for (const [x, z] of [[-0.1, 0.22], [0.1, 0.22], [-0.1, -0.22], [0.1, -0.22]]) { g.add(M(new THREE.CylinderGeometry(0.035, 0.03, 0.45, 6), white, [x, 0.25, z])); g.add(M(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 6), 'gold', [x, 0.03, z])); }
      const head = new THREE.Group(); head.position.set(0, 0.95, 0.35); g.add(head);
      head.add(M(new THREE.CapsuleGeometry(0.09, 0.15, 4, 8), white, [0, 0, 0.05], [1.1, 0, 0]));
      head.add(M(S(0.07, 8, 6), 'pastelPink', [0, -0.08, 0.17]));
      const ey = eyes(head, { y: 0.05, z: 0.08, gap: 0.12, r: 0.022 });
      head.add(M(new THREE.ConeGeometry(0.025, 0.2, 8), 'gold', [0, 0.16, 0.06], [-0.3, 0, 0]));
      for (const sx of [-1, 1]) head.add(M(new THREE.ConeGeometry(0.03, 0.07, 4), white, [sx * 0.06, 0.12, -0.04]));
      const mane = new THREE.Group(); g.add(mane);
      ['pastelPink', 'pastelSky', 'pastelLilac', 'pastelMint', 'pastelLemon'].forEach((m, i) => mane.add(M(S(0.06, 8, 6), m, [0, 0.95 - i * 0.07, 0.25 - i * 0.07])));
      const tail = M(new THREE.ConeGeometry(0.06, 0.35, 6), 'pastelLilac', [0, 0.6, -0.42], [-2.4, 0, 0]); g.add(tail);
      compactGroup(head, ey); compactGroup(mane); compactGroup(g, [head, mane, tail]);
      f.object(g, [0, 0, 0.1], [0, opts.rot ?? 0.3, 0]);
      const sp = f.glow([0, 1.2, 0.4], { color: '#ffd0f8', size: 0.8, opacity: 0 });
      let happy = 0;
      kit.onUpdate((dt, t) => {
        happy = Math.max(0, happy - dt);
        head.rotation.x = Math.sin(t * 0.7) * 0.1 + (happy > 0 ? Math.sin(t * 10) * 0.15 : 0);
        mane.rotation.z = Math.sin(t * 1.3) * 0.05; tail.rotation.z = Math.sin(t * 2) * 0.3;
        g.position.y = f.point(0, 0, 0).y + (happy > 0 ? Math.abs(Math.sin(t * 8)) * 0.1 : 0);
        sp.material.opacity = happy > 0 ? 0.5 : 0;
      });
      f.hitbox([0, 0.7, 0.2], [0.8, 1.2, 1.2], {
        label: 'Einhornfohlen', verb: 'Streicheln', secret: opts.secret, secretName: 'Das Einhornfohlen mit der Regenbogenmähne',
        onInteract: () => { happy = 2.5; kit.services.audio.play('neigh'); kit.services.ui.toast('Das Fohlen wiehert glücklich. Aus seiner Mähne rieseln kleine Regenbögen.'); },
      });
    },
  }),

  // Tante Tatze: Bärin mit Schürze und Haube (Pflegerin der Fabelwesen)
  defineProp({
    name: 'friendBear',
    create(f, opts, kit) {
      const fur = new THREE.MeshStandardMaterial({ color: '#a8784a', roughness: 1 });
      const root = new THREE.Group();
      const body = new THREE.Group(); root.add(body);
      body.add(M(S(0.42, 16, 12), fur, [0, 0.55, 0], null, [1, 1.15, 0.9]));
      body.add(M(new THREE.CylinderGeometry(0.3, 0.38, 0.6, 14, 1, true, -1.1, 2.2), 'white', [0, 0.5, 0.05]));
      body.add(M(new THREE.BoxGeometry(0.16, 0.12, 0.02), 'pastelPink', [0.06, 0.45, 0.38]));
      for (const sx of [-1, 1]) { body.add(M(S(0.14, 10, 8), fur, [sx * 0.2, 0.1, 0.12], null, [1, 0.6, 1.3])); body.add(M(new THREE.CapsuleGeometry(0.09, 0.25, 4, 8), fur, [sx * 0.42, 0.65, 0.1], [0.4, 0, sx * 0.4])); }
      const head = new THREE.Group(); head.position.y = 1.18; root.add(head);
      head.add(M(S(0.27, 16, 12), fur));
      head.add(M(S(0.12, 12, 10), 'pastelPeach', [0, -0.06, 0.22], null, [1, 0.8, 0.8]));
      head.add(M(S(0.04, 8, 6), 'black', [0, -0.02, 0.32]));
      const ey = eyes(head, { y: 0.07, z: 0.22, gap: 0.14, r: 0.03 });
      for (const sx of [-1, 1]) { head.add(M(S(0.08, 10, 8), fur, [sx * 0.2, 0.2, -0.02])); head.add(M(S(0.05, 8, 6), 'pastelPeach', [sx * 0.2, 0.2, 0.02])); head.add(M(new THREE.CircleGeometry(0.04, 10), 'pastelPink', [sx * 0.16, -0.05, 0.25], [0, sx * 0.5, 0])); }
      head.add(M(new THREE.CylinderGeometry(0.2, 0.22, 0.08, 14), 'white', [0, 0.24, -0.02], [-0.2, 0, 0]));
      head.add(M(new THREE.BoxGeometry(0.08, 0.03, 0.02), 'candy', [0, 0.26, 0.17], [-0.2, 0, 0]));
      compactGroup(body); compactGroup(head, ey);
      f.object(root, [0, 0, 0], [0, opts.rot ?? 0, 0]);
      kit.onUpdate((dt, t) => { body.scale.y = 1 + Math.sin(t * 1.2) * 0.015; });
      f.collider(0, 0, 0.8, 0.7);
      behave(f, kit, opts, { root, head, eyeList: ey, hitSize: [0.9, 1.5, 0.8], hitAt: [0, 0.75, 0] });
    },
  }),

  // Pingo: Pinguin am Beckenrand. Anstupsen → rutscht auf dem Bauch übers Wasser. Fischkeks → Freudentanz.
  defineProp({
    name: 'penguin',
    create(f, opts, kit) {
      const root = new THREE.Group();
      const body = new THREE.Group(); root.add(body);
      body.add(M(S(0.2, 14, 12), 'pianoBlack', [0, 0.28, 0], null, [1, 1.35, 0.9]));
      body.add(M(S(0.16, 12, 10), 'white', [0, 0.25, 0.07], null, [1, 1.3, 0.7]));
      for (const sx of [-1, 1]) { body.add(M(new THREE.BoxGeometry(0.04, 0.22, 0.1), 'pianoBlack', [sx * 0.2, 0.3, 0], [0, 0, sx * 0.25])); body.add(M(S(0.05, 8, 6), 'orange', [sx * 0.07, 0.02, 0.06], null, [1, 0.4, 1.6])); }
      body.add(M(new THREE.TorusGeometry(0.13, 0.03, 6, 14), 'candy', [0, 0.45, 0.01], [Math.PI / 2, 0, 0]));
      const head = new THREE.Group(); head.position.y = 0.55; root.add(head);
      head.add(M(S(0.13, 14, 12), 'pianoBlack'));
      head.add(M(S(0.09, 10, 8), 'white', [0, -0.01, 0.07], null, [1, 0.9, 0.7]));
      const ey = eyes(head, { y: 0.03, z: 0.1, gap: 0.07, r: 0.02 });
      head.add(M(new THREE.ConeGeometry(0.03, 0.08, 6), 'orange', [0, -0.02, 0.16], [Math.PI / 2, 0, 0]));
      compactGroup(body); compactGroup(head, ey);
      f.object(root, [0, 0, 0], [0, opts.rot ?? 0, 0]);
      const a = f.point(...(opts.from ?? [0, 0, 0])), b = f.point(...(opts.to ?? [4, 0, 0]));
      const svc = kit.services, egg = 'pinguinrutsche';
      svc.secrets.register(egg, 'Pingo rutscht übers Becken', kit.room?.id, 'egg');
      let mode = 'walk', k = 0, dir = 1, slide = 0, dance = 0;
      kit.onUpdate((dt, t) => {
        dance = Math.max(0, dance - dt);
        if (dance > 0) { root.rotation.y += dt * 8; root.position.y = a.y + Math.abs(Math.sin(t * 10)) * 0.15; return; }
        if (mode === 'slide') {
          slide += dt * 0.5;
          const s = Math.min(1, slide);
          root.position.lerpVectors(a, b, dir > 0 ? s : 1 - s);
          root.position.y = a.y + 0.05; body.rotation.x = Math.PI / 2 * 0.9; head.position.set(0, 0.25, 0.4);
          if (s >= 1) { mode = 'walk'; k = dir > 0 ? 1 : 0; body.rotation.x = 0; head.position.set(0, 0.55, 0); }
          return;
        }
        k += dir * dt * 0.08;
        if (k > 1 || k < 0) { dir *= -1; k = Math.max(0, Math.min(1, k)); }
        root.position.lerpVectors(a, b, k);
        root.position.y = a.y + Math.abs(Math.sin(t * 6)) * 0.02;
        root.rotation.y = Math.atan2((b.x - a.x) * dir, (b.z - a.z) * dir);
        root.rotation.z = Math.sin(t * 6) * 0.12;
      });
      const wantsWrap = opts.wants ? { ...opts.wants, onGift: () => { dance = 4; } } : undefined;
      behave(f, kit, { ...opts, wants: wantsWrap }, {
        root, head, eyeList: ey, turn: 'none', hitSize: [0.5, 0.8, 0.5], hitAt: [0, 0.4, 0],
        onTalk: () => { if (mode === 'walk' && !(opts.wants && svc.items.has(opts.wants.item))) { mode = 'slide'; slide = 0; dir = k > 0.5 ? -1 : 1; svc.audio.play('splash'); svc.secrets.found(egg); } },
      });
    },
  }),

  // Bücher-Wühlmaus: taucht aus Erdlöchern auf. Fünfmal erwischt → Osterei + Funkenbeere.
  defineProp({
    name: 'moleGame',
    create(f, opts, kit) {
      const holes = (opts.holes ?? [[0, 0], [1.6, 0.6], [-1.4, 1.0], [0.6, -1.6], [-1.0, -1.2]]);
      for (const [x, z] of holes) { f.add(new THREE.CircleGeometry(0.22, 14), 'black', [x, 0.025, z], [-Math.PI / 2, 0, 0]); f.add(torus(0.24, 0.06, 5, 14), 'woodDark', [x, 0.02, z], [Math.PI / 2, 0, 0], [1, 1, 0.5]); }
      const g = new THREE.Group();
      g.add(M(new THREE.CapsuleGeometry(0.12, 0.15, 4, 10), new THREE.MeshStandardMaterial({ color: '#8a6a5a', roughness: 1 }), [0, 0.15, 0]));
      g.add(M(S(0.06, 8, 6), 'pastelPink', [0, 0.25, 0.1]));
      eyes(g, { y: 0.3, z: 0.09, gap: 0.07, r: 0.018 });
      for (const sx of [-1, 1]) g.add(M(new THREE.TorusGeometry(0.025, 0.005, 4, 10), 'brass', [sx * 0.035, 0.3, 0.115]));
      g.add(M(new THREE.BoxGeometry(0.1, 0.03, 0.08), 'woodRed', [0.1, 0.12, 0.1], [0, 0.4, 0.3]));
      compactGroup(g);
      f.object(g);
      const hit = M(new THREE.BoxGeometry(0.4, 0.5, 0.4), 'invisible', [0, 0.2, 0]); hit.userData.hitbox = true; g.add(hit);
      const pts = holes.map(([x, z]) => f.point(x, 0, z));
      const svc = kit.services, egg = 'wuehlmaus';
      svc.secrets.register(egg, 'Die Bücher-Wühlmaus fünfmal erwischt', kit.room?.id, 'egg');
      let cur = 0, timer = 1, up = 0, caught = 0, cool = 0;
      kit.onUpdate((dt, t) => {
        timer -= dt; cool = Math.max(0, cool - dt);
        if (timer <= 0) { cur = (cur + 1 + Math.floor(Math.random() * (pts.length - 1))) % pts.length; timer = 1.6 + Math.random() * 1.2; }
        const showing = timer > 0.4 && timer < 1.4 && cool <= 0;
        up += ((showing ? 1 : 0) - up) * Math.min(1, dt * 10);
        g.position.set(pts[cur].x, pts[cur].y - 0.4 + up * 0.4, pts[cur].z);
        g.rotation.y = Math.sin(t * 3) * 0.5;
        g.visible = up > 0.05;
      });
      f.interactable(hit, {
        label: 'Bücher-Wühlmaus', verb: 'Erwischen!', range: 4.5, filter: () => up > 0.5,
        onInteract: () => {
          if (up < 0.5) return;
          caught++; cool = 0.8; timer = 0.5; svc.audio.play('pop');
          if (caught === 5) {
            svc.secrets.found(egg);
            svc.ui.toast('Erwischt – zum fünften Mal! Die Wühlmaus gibt sich geschlagen und schenkt dir eine leuchtende Beere.', { ms: 6500 });
            setTimeout(() => svc.items.give('beere'), 1200);
          } else svc.ui.toast(caught < 5 ? `Erwischt! (${caught}/5) Die Wühlmaus kichert und taucht ab.` : 'Die Wühlmaus winkt. Ihr seid jetzt Freunde.', { ms: 1800 });
        },
      });
    },
  }),

  // Erna: Schildkröte mit Bücherstapel auf dem Panzer – sehr, sehr langsam unterwegs
  defineProp({
    name: 'turtle',
    create(f, opts, kit) {
      const root = new THREE.Group();
      const body = new THREE.Group(); root.add(body);
      body.add(M(new THREE.SphereGeometry(0.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 'leaves', [0, 0.12, 0], null, [1, 0.7, 1.2]));
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; body.add(M(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 6), 'hedge', [Math.cos(a) * 0.22, 0.3, Math.sin(a) * 0.26], [0.3 * Math.sin(a), 0, -0.3 * Math.cos(a)])); }
      body.add(M(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 18), 'pastelLemon', [0, 0.12, 0], null, [1, 1, 1.2]));
      for (const sx of [-1, 1]) for (const z of [-0.3, 0.3]) body.add(M(S(0.08, 8, 6), 'pastelMint', [sx * 0.32, 0.06, z], null, [1, 0.6, 1.3]));
      ['#c0405a', '#3a6ac0', '#e0a030'].forEach((c, i) => body.add(M(new THREE.BoxGeometry(0.28 - i * 0.03, 0.06, 0.2), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }), [0, 0.42 + i * 0.06, 0], [0, i * 0.3, 0])));
      const head = new THREE.Group(); head.position.set(0, 0.16, 0.5); root.add(head);
      head.add(M(S(0.12, 12, 10), 'pastelMint'));
      const ey = eyes(head, { y: 0.04, z: 0.09, gap: 0.08, r: 0.02 });
      for (const sx of [-1, 1]) head.add(M(new THREE.TorusGeometry(0.025, 0.005, 4, 10), 'black', [sx * 0.04, 0.04, 0.115]));
      compactGroup(body); compactGroup(head, ey);
      f.object(root);
      const a = f.point(...(opts.from ?? [-3, 0, 0])), b = f.point(...(opts.to ?? [3, 0, 0]));
      let k = 0.3, dir = 1;
      kit.onUpdate((dt, t) => {
        k += dir * dt * 0.012;
        if (k > 1 || k < 0) { dir *= -1; k = Math.max(0, Math.min(1, k)); }
        root.position.lerpVectors(a, b, k);
        root.rotation.y = Math.atan2((b.x - a.x) * dir, (b.z - a.z) * dir);
        head.position.z = 0.5 + Math.sin(t * 0.8) * 0.04;
      });
      behave(f, kit, opts, { root, head, eyeList: ey, turn: 'none', hitSize: [0.9, 0.7, 1.2], hitAt: [0, 0.3, 0] });
    },
  }),

  // Wölkchen: Café-Wolke mit Schürze, die Kakao serviert
  defineProp({
    name: 'cloudBarista',
    create(f, opts, kit) {
      const root = new THREE.Group();
      const body = new THREE.Group(); root.add(body);
      const puff = new THREE.MeshStandardMaterial({ color: '#fbf8ff', roughness: 1, emissive: '#4a4858' });
      for (let i = 0; i < 9; i++) body.add(M(S(0.25 + (i % 3) * 0.06, 12, 10), puff, [Math.cos(i * 0.7) * 0.3, 1.2 + Math.sin(i * 1.9) * 0.15, Math.sin(i * 1.3) * 0.15]));
      body.add(M(new THREE.BoxGeometry(0.4, 0.3, 0.02), 'pastelPink', [0, 1.05, 0.33]));
      const head = new THREE.Group(); head.position.set(0, 1.3, 0.3); root.add(head);
      const ey = eyes(head, { y: 0.04, z: 0.05, gap: 0.14, r: 0.035 });
      for (const sx of [-1, 1]) head.add(M(new THREE.CircleGeometry(0.04, 10), 'pastelPink', [sx * 0.13, -0.05, 0.06]));
      head.add(M(new THREE.TorusGeometry(0.04, 0.008, 6, 12, Math.PI), 'black', [0, -0.05, 0.07], [0, 0, Math.PI]));
      const cup = new THREE.Group(); cup.position.set(0.45, 1.05, 0.2); root.add(cup);
      cup.add(M(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 12), 'pastelPink'));
      cup.add(M(S(0.055, 10, 6), 'white', [0, 0.06, 0], null, [1, 0.5, 1]));
      compactGroup(body); compactGroup(head, ey); compactGroup(cup);
      f.object(root, [0, 0, 0], [0, opts.rot ?? 0, 0]);
      const y0 = root.position.y;
      kit.onUpdate((dt, t) => { root.position.y = y0 + Math.sin(t * 1.2) * 0.08; cup.rotation.z = Math.sin(t * 0.9) * 0.1; });
      behave(f, kit, opts, { root, head, eyeList: ey, hitSize: [1, 1, 0.8], hitAt: [0, 1.2, 0] });
    },
  }),
];
