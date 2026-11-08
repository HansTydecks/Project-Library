import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, torus } from '../world/geo.js';
import { mat } from '../world/materials.js';
import { compactGroup } from '../world/kit.js';

// Verspielte Kleinigkeiten: Dinge, die laufen, flattern, quaken und sich verstecken.
// Alles ist frei platzierbar: ctx.place('walkingBook', { at: [x, 0, z], radius: 2 }) usw.

/** Unsichtbare Klickfläche, die an einem bewegten Objekt hängt. */
function grab(parent, size, at = [0, 0, 0]) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat('invisible'));
  m.userData.hitbox = true;
  m.position.set(...at);
  parent.add(m);
  return m;
}

function eyes(parent, at, { r = 0.025, gap = 0.05, pupil = true } = {}) {
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat('white'));
    w.position.set(at[0] + s * gap / 2, at[1], at[2]);
    parent.add(w);
    if (pupil) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 8, 6), mat('black'));
      p.position.set(at[0] + s * gap / 2, at[1], at[2] + r * 0.7);
      parent.add(p);
    }
  }
}

const QUIPS_BOOK = [
  'Das Buch läuft weg. Es hat Angst vor Eselsohren.',
  'Es ist ein Reiseführer. Er nimmt seinen Beruf sehr ernst.',
  'Das Buch bleibt kurz stehen, blättert sich selbst um und läuft weiter.',
  '»Nicht jetzt, ich bin spät dran für mein eigenes Kapitel!«',
];

export default [
  // Ein Buch mit Beinchen, das seine Runden dreht
  defineProp({
    name: 'walkingBook',
    create(f, opts, kit) {
      const R = opts.radius ?? 2, speed = opts.speed ?? 0.35;
      const g = new THREE.Group();
      const color = opts.color ?? '#c0405a';
      const cm = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
      const body = new THREE.Group(); body.position.y = 0.32; g.add(body);
      const pages = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.2), mat('pages')); body.add(pages);
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.28, 0.21), cm); l.geometry.translate(0, 0, 0.105);
      const r = l.clone();
      const lp = new THREE.Group(); lp.position.set(-0.036, 0, -0.105); lp.add(l); body.add(lp);
      const rp = new THREE.Group(); rp.position.set(0.036, 0, -0.105); rp.add(r); body.add(rp);
      const spine = new THREE.Mesh(new THREE.BoxGeometry(0.084, 0.28, 0.014), cm); spine.position.z = -0.11; body.add(spine);
      eyes(body, [0, 0.05, -0.128], { r: 0.022, gap: 0.045 }); // Augen auf dem Buchrücken (vorn)
      const legs = [];
      for (const s of [-1, 1]) {
        const leg = new THREE.Group(); leg.position.set(s * 0.03, 0.19, 0);
        const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.17, 5), mat('black')); shin.position.y = -0.085; leg.add(shin);
        const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), mat('candy')); shoe.scale.set(1, 0.6, 1.6); shoe.position.set(0, -0.17, -0.015); leg.add(shoe);
        g.add(leg); legs.push(leg);
      }
      compactGroup(body, [lp, rp]);
      const hit = grab(g, [0.3, 0.5, 0.35], [0, 0.3, 0]);
      f.object(g);
      const c0 = f.point(0, 0, 0), baseRot = f.rotY;
      let a = Math.random() * 6, pause = 0, quip = 0;
      kit.onUpdate((dt, t) => {
        if (pause > 0) { pause -= dt; const k = Math.sin(t * 9) * 0.5; lp.rotation.y = 0.6 + k; rp.rotation.y = -0.6 - k; return; }
        if (kit.services.fx?.party > t) { g.rotation.y += dt * 8; g.position.y = c0.y + Math.abs(Math.sin(t * 10)) * 0.25; return; } // Feier: Tanz!
        a += dt * speed / R * 2;
        const ang = baseRot + a;
        g.position.set(c0.x + Math.cos(ang) * R, c0.y + Math.abs(Math.sin(t * 9)) * 0.03, c0.z - Math.sin(ang) * R);
        g.rotation.y = ang; // Blick in Laufrichtung (Tangente)
        legs[0].rotation.x = Math.sin(t * 9) * 0.6; legs[1].rotation.x = -Math.sin(t * 9) * 0.6;
        lp.rotation.y = 0.15 + Math.sin(t * 4.5) * 0.1; rp.rotation.y = -0.15 - Math.sin(t * 4.5) * 0.1;
      });
      f.interactable(hit, {
        label: opts.name ?? 'Ein Buch mit Beinen', verb: 'Anhalten', secret: opts.secret, secretName: 'Das Buch, das weglief',
        onInteract: () => { pause = 2.2; kit.services.audio.play('page'); kit.services.ui.toast(QUIPS_BOOK[quip++ % QUIPS_BOOK.length]); },
      });
    },
  }),

  // Papierflieger, die in Achten durch den Raum gleiten
  defineProp({
    name: 'paperPlanes',
    create(f, opts, kit) {
      const n = opts.count ?? 4, R = opts.radius ?? 4, y = opts.y ?? 3;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.18, -0.12, 0, 0.1, 0, -0.02, 0.1, 0, 0, -0.18, 0, -0.02, 0.1, 0.12, 0, 0.1], 3));
      geo.computeVertexNormals();
      const m = new THREE.MeshStandardMaterial({ color: '#fffaf0', side: THREE.DoubleSide, roughness: 0.8, emissive: '#3a3630' });
      const planes = [];
      const c0 = f.point(0, y, 0);
      for (let i = 0; i < n; i++) {
        const p = new THREE.Mesh(geo, m);
        f.object(p);
        planes.push({ p, ph: (i / n) * Math.PI * 2, s: 0.25 + Math.random() * 0.1, h: Math.random() });
      }
      kit.onUpdate((dt, t) => {
        for (const o of planes) {
          const a = t * o.s + o.ph;
          const px = o.p.position.x, pz = o.p.position.z;
          o.p.position.set(c0.x + Math.sin(a) * R, c0.y + o.h + Math.sin(a * 3) * 0.25, c0.z + Math.sin(a * 2) * R * 0.5);
          o.p.rotation.order = 'YXZ';
          o.p.rotation.y = Math.atan2(-(o.p.position.x - px), -(o.p.position.z - pz));
          o.p.rotation.z = Math.cos(a) * 0.5;
        }
      });
    },
  }),

  // Quietscheentchen (gerne in Brunnen und Kesseln)
  defineProp({
    name: 'rubberDuck',
    create(f, opts, kit) {
      const s = opts.scale ?? 1;
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), mat('duck')); body.scale.set(1, 0.75, 1.3); g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), mat('duck')); head.position.set(0, 0.1, -0.07); g.add(head);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 8), mat('orange')); beak.rotation.x = -Math.PI / 2; beak.position.set(0, 0.09, -0.14); beak.scale.set(1.3, 1, 0.6); g.add(beak);
      eyes(g, [0, 0.125, -0.125], { r: 0.012, gap: 0.06 });
      if (opts.crown) {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.035, 6, 1, true), mat('gold')); c.position.set(0, 0.175, -0.07); g.add(c);
      }
      compactGroup(g);
      g.scale.setScalar(s);
      const hit = grab(g, [0.25, 0.25, 0.35], [0, 0.05, -0.02]);
      f.object(g, [0, 0.06 * s, 0], [0, opts.rot ?? 0, 0]);
      const y0 = g.position.y, seed = Math.random() * 6;
      let wobble = 0;
      kit.onUpdate((dt, t) => {
        if (opts.float) { g.position.y = y0 + Math.sin(t * 1.6 + seed) * 0.015; g.rotation.z = Math.sin(t * 1.1 + seed) * 0.08; }
        if (wobble > 0) { wobble -= dt; g.rotation.x = Math.sin(wobble * 30) * 0.25 * wobble; }
      });
      f.interactable(hit, {
        label: opts.name ?? 'Quietscheentchen', verb: 'Drücken', secret: opts.secret, secretName: opts.secretName ?? 'Die Quietscheente',
        onInteract: () => { wobble = 0.8; kit.services.audio.play('quack'); kit.services.ui.toast(opts.quip ?? 'Quiek! Die Ente sieht dich vorwurfsvoll an.'); },
      });
    },
  }),

  // Kleines Schild auf einem Pfosten mit verschrobenem Text
  defineProp({
    name: 'standSign',
    create(f, opts, kit) {
      const h = opts.height ?? 1.1, w = opts.width ?? 0.9, sh = opts.signHeight ?? 0.32;
      f.add(cyl(0.025, 0.03, h, 6), 'woodDark', [0, h / 2, 0]);
      f.add(box(w + 0.06, sh + 0.06, 0.04, 0), 'woodDark', [0, h, -0.005]);
      const sign = kit.services.makeSign(opts.text ?? 'Bitte nicht die Bücher füttern.', { size: opts.size ?? 40, bg: opts.bg ?? '#f6ead0', ink: opts.ink ?? '#5a2a3a', w: 512, h: Math.round(512 * sh / w) });
      sign.scale.set(w, sh, 1);
      const back = sign.clone();
      f.object(sign, [0, h, 0.018]);
      if (opts.back !== false) f.object(back, [0, h, -0.028], [0, Math.PI, 0]);
      f.collider(0, 0, 0.12, 0.12);
    },
  }),

  // Schnecke mit Zylinder. Kriecht. Hat Zeit.
  defineProp({
    name: 'snail',
    create(f, opts, kit) {
      const len = opts.length ?? 1.5;
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.16, 4, 8), mat('pastelMint')); body.rotation.x = Math.PI / 2; body.position.y = 0.035; g.add(body);
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), mat(opts.shell ?? 'pastelPink')); shell.position.set(0, 0.1, 0.03); shell.scale.set(0.7, 1, 1); g.add(shell);
      const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 16), mat('pastelLilac')); swirl.rotation.y = Math.PI / 2; swirl.position.set(0.05, 0.1, 0.03); g.add(swirl);
      for (const s of [-1, 1]) {
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.07, 4), mat('pastelMint')); st.position.set(s * 0.015, 0.09, -0.1); st.rotation.x = -0.3; g.add(st);
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 5), mat('black')); e.position.set(s * 0.015, 0.125, -0.11); g.add(e);
      }
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.04, 10), mat('black')); hat.position.set(0, 0.195, 0.03); g.add(hat);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.005, 12), mat('black')); brim.position.set(0, 0.176, 0.03); g.add(brim);
      compactGroup(g, [body]);
      const hit = grab(g, [0.18, 0.25, 0.3], [0, 0.1, 0]);
      f.object(g);
      const a0 = f.point(-len / 2, 0, 0), a1 = f.point(len / 2, 0, 0);
      let k = Math.random(), dir = 1;
      kit.onUpdate((dt, t) => {
        k += dir * dt * 0.02 / len;
        if (k > 1 || k < 0) { dir *= -1; k = Math.max(0, Math.min(1, k)); }
        g.position.lerpVectors(a0, a1, k);
        g.rotation.y = f.rotY + (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
        body.scale.z = 1 + Math.sin(t * 3) * 0.08;
      });
      f.interactable(hit, {
        label: 'Schnecke mit Zylinder', verb: 'Grüßen', secret: opts.secret, secretName: 'Die Schneckenpost',
        onInteract: () => kit.services.ui.toast(opts.quip ?? 'Die Schnecke lüftet den Hut. Sie stellt Post zu. Lieferzeit: »bald«.'),
      });
    },
  }),

  // Seifenblasen, die langsam aufsteigen
  defineProp({
    name: 'bubbles',
    create(f, opts, kit) {
      const n = opts.count ?? 14, area = opts.area ?? [2, 3, 2];
      const list = [];
      const c0 = f.point(0, opts.y ?? 0.5, 0);
      for (let i = 0; i < n; i++) {
        const r = 0.04 + Math.random() * 0.08;
        const b = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), mat('bubble'));
        f.object(b);
        list.push({ b, x: (Math.random() - 0.5) * area[0], z: (Math.random() - 0.5) * area[2], y: Math.random() * area[1], s: 0.15 + Math.random() * 0.2, ph: Math.random() * 6 });
      }
      kit.onUpdate((dt, t) => {
        for (const o of list) {
          o.y += dt * o.s;
          if (o.y > area[1]) { o.y = 0; o.x = (Math.random() - 0.5) * area[0]; o.z = (Math.random() - 0.5) * area[2]; }
          o.b.position.set(c0.x + o.x + Math.sin(t + o.ph) * 0.15, c0.y + o.y, c0.z + o.z + Math.cos(t * 0.8 + o.ph) * 0.15);
          const fade = Math.min(1, o.y * 3, (area[1] - o.y) * 3);
          o.b.scale.setScalar(Math.max(0.01, fade));
        }
      });
    },
  }),

  // Staubmaus: flauschig, scheu, hüpft weg, wenn man näherkommt
  defineProp({
    name: 'dustBunny',
    create(f, opts, kit) {
      const area = opts.area ?? 3;
      const g = new THREE.Group();
      const fur = new THREE.MeshStandardMaterial({ color: opts.color ?? '#b8b0c8', roughness: 1, flatShading: true });
      const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 1), fur); ball.position.y = 0.1; g.add(ball);
      for (let i = 0; i < 8; i++) {
        const tuft = new THREE.Mesh(new THREE.IcosahedronGeometry(0.04, 0), fur);
        const a = (i / 8) * Math.PI * 2;
        tuft.position.set(Math.cos(a) * 0.09, 0.1 + Math.sin(a * 3) * 0.05, Math.sin(a) * 0.09); g.add(tuft);
      }
      eyes(g, [0, 0.14, -0.09], { r: 0.02, gap: 0.06 });
      compactGroup(g, [ball]);
      const hit = grab(g, [0.3, 0.3, 0.3], [0, 0.12, 0]);
      f.object(g);
      const home = f.point(0, 0, 0);
      const target = home.clone();
      let hop = 0;
      kit.onUpdate((dt, t, ctx) => {
        const p = ctx.player;
        const o = kit.origin; // g.position ist kit-lokal, der Spieler in Welt
        const dx = g.position.x + o.x - p.x, dz = g.position.z + o.z - p.z;
        const d = Math.hypot(dx, dz);
        if (d < 2.2 && hop <= 0) {
          // weghüpfen, aber im eigenen Revier bleiben
          const a = Math.atan2(dx, dz) + (Math.random() - 0.5);
          target.set(home.x + Math.sin(a) * area * Math.random(), 0, home.z + Math.cos(a) * area * Math.random());
          hop = 0.6;
        }
        if (hop > 0) {
          hop -= dt;
          g.position.x += (target.x - g.position.x) * Math.min(1, dt * 5);
          g.position.z += (target.z - g.position.z) * Math.min(1, dt * 5);
          g.position.y = home.y + Math.abs(Math.sin(hop * 15)) * 0.15;
          g.rotation.y = Math.atan2(-dx, -dz);
        } else {
          g.position.y = home.y;
          ball.scale.y = 1 + Math.sin(t * 4) * 0.04;
        }
      });
      g.position.copy(home);
      f.interactable(hit, {
        label: 'Staubmaus', verb: 'Streicheln', secret: opts.secret, secretName: 'Die scheue Staubmaus', range: 4,
        onInteract: () => { kit.services.audio.play('pop'); kit.services.ui.toast('Hatschi! Die Staubmaus niest sich selbst ein Stück kleiner.'); },
      });
    },
  }),

  // Bücher an Luftballons – »leichte Lektüre«
  defineProp({
    name: 'balloonBooks',
    create(f, opts, kit) {
      const n = opts.count ?? 3, y = opts.y ?? 2.6, R = opts.radius ?? 1.5;
      const cols = ['pastelPink', 'pastelSky', 'pastelLemon', 'pastelMint', 'pastelLilac'];
      const bookCols = ['#3a6ac0', '#c0405a', '#3a9a6a', '#9a5ad0'];
      const items = [];
      for (let i = 0; i < n; i++) {
        const g = new THREE.Group();
        const balloon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mat(cols[i % cols.length])); balloon.scale.y = 1.2; balloon.position.y = 1.0; g.add(balloon);
        const knot = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.05, 6), mat(cols[i % cols.length])); knot.position.y = 0.74; g.add(knot);
        const str = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.7, 3), mat('white')); str.position.y = 0.38; g.add(str);
        const bk = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.28), new THREE.MeshStandardMaterial({ color: bookCols[i % bookCols.length], roughness: 0.6 })); g.add(bk);
        compactGroup(g);
        const a = (i / n) * Math.PI * 2;
        f.object(g, [Math.cos(a) * R, y, Math.sin(a) * R]);
        items.push({ g, y0: g.position.y, ph: Math.random() * 6 });
      }
      if (items[0]) {
        const hit = grab(items[0].g, [0.5, 1.4, 0.5], [0, 0.6, 0]);
        f.interactable(hit, { label: 'Leichte Lektüre', verb: 'Lesen', onInteract: () => kit.services.ui.toast('Ein Buch über Ballonfahrt. Es hat sich selbst sehr ernst genommen.') });
      }
      kit.onUpdate((dt, t) => {
        for (const o of items) { o.g.position.y = o.y0 + Math.sin(t * 0.8 + o.ph) * 0.12; o.g.rotation.y = Math.sin(t * 0.3 + o.ph) * 0.4; o.g.rotation.z = Math.sin(t * 0.6 + o.ph) * 0.06; }
      });
    },
  }),

  // Bücherwurm mit Brille, der aus einem aufgeschlagenen Buch schaut
  defineProp({
    name: 'bookworm',
    create(f, opts, kit) {
      f.add(box(0.36, 0.035, 0.26, 0), 'pages', [0, 0.02, 0]);
      f.add(box(0.38, 0.015, 0.27, 0), 'woodRed', [0, 0.006, 0]);
      const g = new THREE.Group();
      const segs = [];
      for (let i = 0; i < 6; i++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.03 - i * 0.001, 10, 8), mat(i === 5 ? 'pastelMint' : 'pastelMint'));
        g.add(s); segs.push(s);
      }
      const head = segs[5];
      head.scale.setScalar(1.35);
      for (const sx of [-1, 1]) {
        const lens = new THREE.Mesh(new THREE.TorusGeometry(0.013, 0.003, 4, 12), mat('brass'));
        lens.position.set(sx * 0.017, 0.006, -0.036); head.add(lens);
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 5), mat('black')); e.position.set(sx * 0.017, 0.006, -0.034); head.add(e);
      }
      const hit = grab(g, [0.25, 0.3, 0.25], [0, 0.12, 0]);
      f.object(g, [0.05, 0.03, 0]);
      kit.onUpdate((dt, t) => {
        for (let i = 0; i < segs.length; i++) {
          const k = i / (segs.length - 1);
          segs[i].position.set(Math.sin(t * 1.3 + k * 2) * 0.03 * k, k * 0.2, Math.sin(t * 0.9) * 0.02 * k);
        }
        head.rotation.y = Math.sin(t * 0.7) * 0.6;
      });
      const lines = ['»Ich lese nicht, ich verkoste.«', '»Kapitel 3 war etwas trocken. Mit Pfeffer ginge es.«', '»Psst. Ich bin bei der spannenden Stelle.«'];
      let i = 0;
      f.interactable(hit, { label: 'Bücherwurm', verb: 'Stören', secret: opts.secret, secretName: 'Der Bücherwurm mit Brille', onInteract: () => kit.services.ui.toast(lines[i++ % lines.length]) });
    },
  }),

  // Bemaltes Ei – zwölf Stück sind in der Bibliothek versteckt (opts.id eindeutig!)
  defineProp({
    name: 'paintedEgg',
    create(f, opts, kit) {
      const fx = kit.services.fx; if (fx) fx.paintedEggs++;
      const prog = kit.services.progress;
      const cols = ['pastelPink', 'pastelSky', 'pastelLemon', 'pastelMint', 'pastelLilac', 'pastelPeach'];
      const seed = [...opts.id].reduce((a, c) => a + c.charCodeAt(0), 0);
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), mat(cols[seed % cols.length])));
      g.children[0].scale.y = 1.3;
      for (const y of [-0.04, 0.04]) { const band = new THREE.Mesh(new THREE.TorusGeometry(y ? 0.087 : 0.088, 0.01, 6, 20), mat(cols[(seed + 2) % cols.length])); band.rotation.x = Math.PI / 2; band.position.y = y; g.add(band); }
      for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 5), mat('white')); const a = (i / 6) * Math.PI * 2; d.position.set(Math.cos(a) * 0.088, 0, Math.sin(a) * 0.088); g.add(d); }
      compactGroup(g);
      const hit = grab(g, [0.3, 0.35, 0.3]);
      f.object(g, [0, 0.12, 0]);
      const sp = f.glow([0, 0.15, 0], { color: '#fff0c0', size: 0.4, opacity: 0.25 });
      if (prog.has('eggs', opts.id)) { g.visible = false; sp.visible = false; }
      const y0 = g.position.y;
      kit.onUpdate((dt, t) => { g.rotation.z = Math.sin(t * 2 + seed) * 0.12; g.position.y = y0 + Math.abs(Math.sin(t * 1.3 + seed)) * 0.01; });
      f.interactable(hit, {
        label: 'Ein bemaltes Ei', verb: 'Einsammeln', range: 3.5, filter: () => g.visible,
        onInteract: () => {
          if (!prog.egg(opts.id)) return;
          g.visible = false; sp.visible = false;
          kit.services.audio.play('pop');
          kit.services.events.emit('paintedEgg', { id: opts.id, total: fx?.paintedEggs ?? 12 });
        },
      });
    },
  }),

  // Freundlicher Kürbis mit Lächeln (Osterei im Oktober)
  defineProp({
    name: 'pumpkin',
    create(f, opts, kit) {
      const s = opts.scale ?? 1;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        f.add(new THREE.SphereGeometry(0.16 * s, 10, 8), 'orange', [Math.cos(a) * 0.1 * s, 0.17 * s, Math.sin(a) * 0.1 * s], [0, -a, 0], [0.7, 1, 1]);
      }
      f.add(new THREE.CylinderGeometry(0.025 * s, 0.035 * s, 0.1 * s, 6), 'leaves', [0, 0.36 * s, 0], [0.2, 0, 0.1]);
      // Gesicht: lächelnd, nicht gruselig
      for (const sx of [-1, 1]) f.add(new THREE.CircleGeometry(0.035 * s, 10), 'glowWarm', [sx * 0.08 * s, 0.22 * s, 0.255 * s]);
      f.add(new THREE.TorusGeometry(0.07 * s, 0.018 * s, 4, 12, Math.PI), 'glowWarm', [0, 0.15 * s, 0.25 * s], [0, 0, Math.PI]);
      f.glow([0, 0.2 * s, 0.3 * s], { color: '#ffb050', size: 0.6 * s, opacity: 0.35 });
      f.collider(0, 0, 0.45 * s, 0.45 * s, { top: 0.35 * s });
      f.hitbox([0, 0.2 * s, 0], [0.5 * s, 0.4 * s, 0.5 * s], { label: 'Fröhlicher Kürbis', verb: 'Zurücklächeln', onInteract: () => kit.services.ui.toast('Der Kürbis lächelt breiter. Er ist sehr stolz auf seine Zähne. Er hat keine.') });
    },
  }),

  // Sprungpilz: drauf springen → hoch hinaus! (Oberfläche begehbar)
  defineProp({
    name: 'jumpMushroom',
    create(f, opts, kit) {
      const s = opts.scale ?? 1, power = opts.power ?? 11;
      const H = 0.7 * s, R = 0.75 * s;
      f.add(cyl(0.22 * s, 0.3 * s, H, 12), 'mushroomStem', [0, H / 2, 0]);
      const cap = new THREE.Group();
      const capM = new THREE.Mesh(new THREE.SphereGeometry(R, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(opts.cap ?? 'mushroomCap'));
      capM.scale.y = 0.45; cap.add(capM);
      const under = new THREE.Mesh(new THREE.CircleGeometry(R, 20), mat('mushroomStem')); under.rotation.x = Math.PI / 2; cap.add(under);
      for (let i = 0; i < 7; i++) {
        const a = i * 2.4, rr = (i ? 0.55 : 0) * R;
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.09 * s, 8, 6), mat('dots'));
        const y = Math.sqrt(Math.max(0, 1 - (rr / R) ** 2)) * R * 0.45;
        d.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr); d.scale.y = 0.4; cap.add(d);
      }
      f.object(cap, [0, H, 0]);
      const top = H + R * 0.42;
      f.collider(0, 0, R * 1.4, R * 1.4, { top, bottom: 0 }); // bottom: auch auf Wolken nutzbar
      const c = f.world(0, 0, 0); // Weltkoordinaten (Spielerposition ist in Welt)
      const ty = c.y + top;
      let squish = 0;
      kit.onUpdate((dt, t, ctx) => {
        const p = ctx.player;
        if (Math.hypot(p.x - c.x, p.z - c.z) < R * 1.05 && Math.abs(p.y - ty) < 0.05) {
          ctx.launch(power); squish = 1; kit.services.audio.play('boing');
        }
        squish = Math.max(0, squish - dt * 2.5);
        cap.scale.set(1 + squish * 0.25, 1 - squish * 0.4 + Math.sin(t * 2 + c.x) * 0.01, 1 + squish * 0.25);
      });
      if (opts.light !== false) f.glow([0, H + 0.2, 0], { color: opts.glow ?? '#ff8ac8', size: 2.2 * s, opacity: 0.35 });
    },
  }),

  // Schwebende Plattform (Wolke oder Riesenbuch) – nur per Sprung erreichbar
  defineProp({
    name: 'floatingIsland',
    create(f, opts, kit) {
      const y = opts.y ?? 3, w = opts.width ?? 2.4, d = opts.depth ?? 2.4, kind = opts.kind ?? 'cloud';
      const g = new THREE.Group();
      if (kind === 'cloud') {
        const m = new THREE.MeshStandardMaterial({ color: '#fff6fb', roughness: 1, emissive: '#5a4a6a' });
        for (let i = 0; i < 7; i++) {
          const b = new THREE.Mesh(new THREE.SphereGeometry(0.55 + (i % 3) * 0.15, 12, 8), m);
          b.position.set(Math.cos(i) * w * 0.32, -0.15, Math.sin(i * 1.7) * d * 0.32); b.scale.y = 0.5; g.add(b);
        }
      } else {
        const bm = new THREE.MeshStandardMaterial({ color: opts.color ?? '#3a6ac0', roughness: 0.5 });
        const cover = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), bm); cover.position.y = -0.15; g.add(cover);
        const pg = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, 0.24, d - 0.15), mat('pages')); pg.position.set(0.04, -0.15, 0); g.add(pg);
      }
      f.object(g, [0, y, 0]);
      f.collider(0, 0, w * 0.95, d * 0.95, { top: y, bottom: y - 0.4, shadow: false });
      const y0 = g.position.y, ph = Math.random() * 6;
      kit.onUpdate((dt, t) => { g.position.y = y0 + Math.sin(t * 0.7 + ph) * 0.03; });
    },
  }),
];
