import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, lathe, torus } from '../world/geo.js';
import { mat } from '../world/materials.js';
import { compactGroup } from '../world/kit.js';
import { canvasTexture, FONT_TITLE } from '../world/textures.js';

// Kuriositäten & Geheimnisse. Jedes Ding darf eine kleine Geschichte haben.
export default [
  defineProp({
    name: 'globe',
    create(f, opts, kit) {
      f.add(lathe([[0, 0], [0.22, 0], [0.2, 0.04], [0.05, 0.08], [0.04, 0.7], [0, 0.72]], 12), 'woodDark', [0, 0, 0]);
      const t = canvasTexture(256, 128, (g, w, h) => {
        g.fillStyle = '#c9b48a'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#6a7a4a';
        for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(Math.random() * w, 20 + Math.random() * (h - 40), 10 + Math.random() * 25, 6 + Math.random() * 14, Math.random() * 3, 0, 7); g.fill(); }
        g.strokeStyle = 'rgba(80,50,20,0.4)';
        for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
        for (let x = 0; x < w; x += 21) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
        g.fillStyle = '#7a2e3a'; g.font = `14px ${FONT_TITLE}`; g.fillText('Hic sunt dracones', 100, 90);
      }, { repeat: false });
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 16), new THREE.MeshLambertMaterial({ map: t }));
      const holder = new THREE.Group();
      holder.add(ball);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.012, 6, 32, Math.PI * 1.2), mat('brass'));
      ring.rotation.z = -0.4; holder.add(ring);
      holder.rotation.z = 0.41;
      f.object(holder, [0, 1.02, 0]);
      let spin = 0.15;
      kit.onUpdate((dt) => { ball.rotation.y += dt * spin; spin += (0.15 - spin) * dt * 0.5; });
      f.collider(0, 0, 0.5, 0.5);
      f.hitbox([0, 1.0, 0], [0.7, 0.7, 0.7], {
        label: 'Alter Globus', verb: 'Drehen', secret: opts.secret, secretName: 'Der Globus mit den Drachen',
        onInteract: () => { spin = 6; kit.services.audio?.play('whoosh'); kit.services.ui.toast('Der Globus wirbelt. Irgendwo ruft ein winziger Drache »Hey!«'); },
      });
    },
  }),

  defineProp({
    name: 'grandfatherClock',
    create(f, opts, kit) {
      f.add(box(0.6, 2.2, 0.38, 1), 'woodRed', [0, 1.1, 0]);
      f.add(box(0.7, 0.12, 0.44, 1), 'woodDark', [0, 2.26, 0]);
      f.add(box(0.5, 0.25, 0.34, 1), 'woodDark', [0, 2.42, 0]);
      f.add(box(0.7, 0.12, 0.44, 1), 'woodDark', [0, 0.06, 0]);
      f.add(box(0.36, 1.0, 0.02, 0), 'glass', [0, 0.9, 0.2]);
      const face = canvasTexture(256, 256, (g, w) => {
        g.fillStyle = '#efe2c4'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 4, 0, 7); g.fill();
        g.strokeStyle = '#c8963e'; g.lineWidth = 8; g.stroke();
        g.fillStyle = '#2a1a10'; g.font = `28px ${FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        const roman = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
        roman.forEach((r, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; g.fillText(r, w / 2 + Math.cos(a) * 95, w / 2 + Math.sin(a) * 95); });
      }, { repeat: false });
      const dial = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32), new THREE.MeshLambertMaterial({ map: face, emissive: '#2a2010' }));
      f.object(dial, [0, 1.85, 0.195]);
      const handM = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.18, 0.005), mat('black'));
      handM.geometry.translate(0, 0.09, 0);
      const handH = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.12, 0.005), mat('black'));
      handH.geometry.translate(0, 0.06, 0);
      f.object(handM, [0, 1.85, 0.2]); f.object(handH, [0, 1.85, 0.203]);
      const pend = new THREE.Group();
      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.7, 0.01), mat('brass')); rod.position.y = -0.35; pend.add(rod);
      const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16), mat('brass')); bob.rotation.x = Math.PI / 2; bob.position.y = -0.72; pend.add(bob);
      f.object(pend, [0, 1.55, 0.15]);
      const baseRotM = handM.rotation.z;
      kit.onUpdate((dt, t) => {
        const d = new Date();
        const mins = d.getMinutes() + d.getSeconds() / 60;
        const hrs = (d.getHours() % 12) + mins / 60;
        handM.rotation.z = baseRotM - (mins / 60) * Math.PI * 2;
        handH.rotation.z = baseRotM - (hrs / 12) * Math.PI * 2;
        pend.rotation.z = Math.sin(t * Math.PI) * 0.18;
      });
      f.collider(0, 0, 0.7, 0.45);
      f.hitbox([0, 1.3, 0.1], [0.7, 2.4, 0.5], {
        label: 'Standuhr', verb: 'Lauschen', secret: opts.secret, secretName: 'Die Uhr, die die echte Zeit kennt',
        onInteract: () => {
          const d = new Date();
          kit.services.audio?.play('tick');
          kit.services.ui.toast(`Tick, tack. Es ist ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} Uhr – auch draußen in deiner Welt.`);
        },
      });
    },
  }),

  defineProp({
    name: 'hourglass',
    create(f, opts, kit) {
      f.add(cyl(0.08, 0.08, 0.02, 8), 'woodDark', [0, 0.01, 0]);
      f.add(cyl(0.08, 0.08, 0.02, 8), 'woodDark', [0, 0.25, 0]);
      for (const a of [0, 2.1, 4.2]) f.add(cyl(0.008, 0.008, 0.24, 4), 'woodDark', [Math.cos(a) * 0.07, 0.13, Math.sin(a) * 0.07]);
      f.add(lathe([[0, 0.02], [0.055, 0.03], [0.05, 0.08], [0.008, 0.13], [0.05, 0.18], [0.055, 0.23], [0, 0.24]], 12), 'glass', [0, 0, 0]);
      const sand = f.mesh(new THREE.ConeGeometry(0.04, 0.04, 10), new THREE.MeshLambertMaterial({ color: '#e8c070', emissive: '#4a3000' }), [0, 0.05, 0]);
      const top = f.mesh(new THREE.ConeGeometry(0.04, 0.045, 10), new THREE.MeshLambertMaterial({ color: '#e8c070', emissive: '#4a3000' }), [0, 0.16, 0], [Math.PI, 0, 0]);
      kit.onUpdate((dt, t) => { const k = (t * 0.02) % 1; sand.scale.setScalar(0.3 + k * 0.7); top.scale.setScalar(1 - k * 0.7); });
    },
  }),

  defineProp({
    name: 'inkwell',
    create(f) {
      f.add(cyl(0.04, 0.05, 0.06, 10), 'black', [0, 0.03, 0]);
      f.add(cyl(0.025, 0.025, 0.02, 8), 'brass', [0, 0.07, 0]);
      // Feder
      f.add(cone(0.02, 0.3, 4), 'white', [0.03, 0.2, 0], [0, 0, -0.35], [0.4, 1, 1]);
      f.add(box(0.25, 0.005, 0.32, 0), 'paper', [0.25, 0.003, 0.05], [0, 0.2, 0]);
    },
  }),

  defineProp({
    name: 'typewriter',
    create(f, opts, kit) {
      f.add(box(0.42, 0.1, 0.32, 0), 'black', [0, 0.05, 0]);
      f.add(box(0.36, 0.09, 0.15, 0), 'black', [0, 0.13, -0.07], [-0.3, 0, 0]);
      f.add(cyl(0.035, 0.035, 0.46, 10), 'black', [0, 0.2, -0.12], [0, 0, Math.PI / 2]);
      f.add(box(0.25, 0.2, 0.005, 0), 'paper', [0, 0.3, -0.13], [-0.2, 0, 0]);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) f.add(cyl(0.012, 0.012, 0.012, 6), 'cream', [-0.14 + c * 0.035 + r * 0.01, 0.105 + r * 0.02, 0.1 - r * 0.035]);
      f.hitbox([0, 0.15, 0], [0.5, 0.35, 0.4], {
        label: 'Schreibmaschine', verb: 'Tippen', secret: opts.secret, secretName: 'Die Schreibmaschine, die zurückschreibt',
        onInteract: () => {
          kit.services.audio?.play('type');
          const lines = ['»Hallo? Ist da jemand?« – tippt die Maschine von selbst zurück.', '»Schreib mehr Apps!« steht plötzlich auf dem Blatt.', '»Die Idee von gestern war gut. Mach sie.«', '»Ich bin auch nur eine Metapher.«'];
          kit.services.ui.toast(lines[Math.floor(Math.random() * lines.length)]);
        },
      });
    },
  }),

  defineProp({
    name: 'telescope',
    create(f, opts, kit) {
      for (const a of [0, 2.1, 4.2]) f.add(cyl(0.015, 0.02, 1.25, 5), 'woodDark', [Math.cos(a) * 0.22, 0.6, Math.sin(a) * 0.22], [Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2]);
      const tube = new THREE.Group();
      const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.0, 14), mat('brass')); t1.rotation.x = Math.PI / 2; tube.add(t1);
      const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.3, 12), mat('brass')); t2.rotation.x = Math.PI / 2; t2.position.z = 0.6; tube.add(t2);
      tube.rotation.x = -0.5;
      f.object(tube, [0, 1.25, 0]);
      kit.onUpdate((dt, t) => { tube.rotation.y = Math.sin(t * 0.1) * 0.3; });
      f.collider(0, 0, 0.5, 0.5);
      f.hitbox([0, 1.2, 0], [0.6, 0.6, 1.0], {
        label: 'Teleskop', verb: 'Hindurchsehen', secret: opts.secret, secretName: 'Der Stern, der zurückwinkt',
        onInteract: () => kit.services.ui.toast('Du siehst einen kleinen Stern. Er winkt. Du winkst zurück. Niemand hat es gesehen.'),
      });
    },
  }),

  defineProp({
    name: 'gramophone',
    create(f, opts, kit) {
      f.add(box(0.4, 0.15, 0.4, 0), 'woodRed', [0, 0.075, 0]);
      f.add(cyl(0.17, 0.17, 0.01, 20), 'black', [0, 0.16, 0]);
      f.add(cyl(0.012, 0.012, 0.4, 6), 'brass', [0.15, 0.35, 0.1], [0.4, 0, 0.3]);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 18, 1, true), new THREE.MeshStandardMaterial({ color: '#c8963e', metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide }));
      f.object(horn, [0.1, 0.62, -0.1], [-0.7, 0, -0.3]);
      const rec = f.mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.005, 20), 'black', [0, 0.17, 0]);
      let playing = false;
      kit.onUpdate((dt) => { if (playing) rec.rotation.y += dt * 3; });
      f.hitbox([0, 0.4, 0], [0.5, 0.8, 0.5], {
        label: 'Grammophon', verb: 'Abspielen', secret: opts.secret, secretName: 'Die Melodie aus dem Grammophon',
        onInteract: () => {
          playing = !playing;
          if (playing) { kit.services.audio?.play('melody'); kit.services.ui.toast('♪ Eine knisternde Melodie erfüllt den Raum.'); }
        },
      });
    },
  }),

  defineProp({
    name: 'owl',
    create(f, opts, kit) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), mat('woodLight')); body.scale.set(1, 1.3, 0.9); g.add(body);
      const head = new THREE.Group(); head.position.y = 0.22; g.add(head);
      const hm = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), mat('woodLight')); head.add(hm);
      for (const x of [-0.05, 0.05]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd84a' })); eye.position.set(x, 0.02, 0.1); head.add(eye);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 6), mat('black')); pupil.position.set(x, 0.02, 0.13); head.add(pupil);
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 4), mat('woodLight')); ear.position.set(x * 1.6, 0.11, 0); head.add(ear);
      }
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.04, 4), mat('brass')); beak.rotation.x = Math.PI / 2 + 0.4; beak.position.set(0, -0.02, 0.12); head.add(beak);
      f.object(g, [0, 0.18, 0]);
      const wp = new THREE.Vector3();
      kit.onUpdate((dt, t, ctx) => {
        g.getWorldPosition(wp);
        const dx = ctx.player.x - wp.x, dz = ctx.player.z - wp.z;
        const target = Math.atan2(dx, dz) - g.rotation.y;
        head.rotation.y += (Math.max(-1.6, Math.min(1.6, wrap(target))) - head.rotation.y) * dt * 2;
        head.rotation.z = Math.sin(t * 0.7) * 0.15;
      });
      f.hitbox([0, 0.3, 0], [0.4, 0.6, 0.4], {
        label: 'Eule', verb: 'Grüßen', range: 6, secret: opts.secret, secretName: 'Die Eule, die alles sieht',
        onInteract: () => { kit.services.audio?.play('hoot'); kit.services.ui.toast('»Huhu!« Die Eule dreht den Kopf ganz, ganz weit. Angeberin.'); },
      });
    },
  }),

  defineProp({
    name: 'cat',
    create(f, opts, kit) {
      const fur = mat(opts.fur ?? 'fur');
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), fur); body.scale.set(1.3, 0.55, 0.9); body.position.y = 0.1; g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), fur); head.position.set(0.26, 0.08, 0.06); head.scale.set(1, 0.85, 1); g.add(head);
      for (const z of [0.0, 0.11]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 4), fur); ear.position.set(0.27, 0.16, z); g.add(ear); }
      const tail = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 6, 14, Math.PI * 1.1), fur); tail.rotation.x = Math.PI / 2; tail.position.set(-0.05, 0.04, 0.0); g.add(tail);
      // Details: Ohren innen rosa, Näschen, geschlossene Augen, Schnurrhaare, Pfoten, Schwanzspitze, ggf. Streifen
      const deco = new THREE.Group(); g.add(deco);
      const add = (geo, m, p, r, sc) => { const o = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m); o.position.set(...p); if (r) o.rotation.set(...r); if (sc) o.scale.set(...sc); deco.add(o); };
      for (const z of [0.0, 0.11]) add(new THREE.ConeGeometry(0.02, 0.045, 4), 'pastelPink', [0.285, 0.155, z], [0, 0, -0.15]);
      add(new THREE.SphereGeometry(0.012, 6, 4), 'pastelPink', [0.355, 0.075, 0.055]);
      for (const z of [0.02, 0.09]) add(new THREE.TorusGeometry(0.014, 0.0035, 4, 8, Math.PI), 'black', [0.34, 0.1, z], [0, Math.PI / 2, Math.PI]);
      for (const zs of [-1, 1]) for (const k of [-1, 0, 1]) add(new THREE.BoxGeometry(0.1, 0.0015, 0.0015), 'white', [0.36, 0.065 + k * 0.008, 0.055 + zs * 0.05], [0, zs * 0.5, k * 0.1]);
      for (const [x, z] of [[0.18, -0.06], [0.18, 0.16], [-0.12, -0.12], [-0.14, 0.14]]) add(new THREE.SphereGeometry(0.035, 8, 6), fur, [x, 0.02, z], null, [1.3, 0.6, 1]);
      add(new THREE.SphereGeometry(0.034, 8, 6), opts.tip ?? 'white', [-0.05 + Math.cos(Math.PI * 1.1) * 0.17, 0.04, -Math.sin(Math.PI * 1.1) * 0.17]);
      if (opts.stripes !== false && (opts.fur ?? 'fur') === 'fur') for (const x of [-0.12, -0.02, 0.08]) add(new THREE.TorusGeometry(0.19, 0.012, 4, 16, Math.PI), 'orange', [x, 0.1, 0], [0, Math.PI / 2, 0], [1, 0.55, 0.9]);
      compactGroup(deco);
      f.object(g, [0, 0, 0]);
      let purr = 0;
      kit.onUpdate((dt, t) => {
        const breathe = 1 + Math.sin(t * 1.6) * 0.04 + (purr > 0 ? Math.sin(t * 40) * 0.015 : 0);
        body.scale.set(1.3, 0.55 * breathe, 0.9);
        tail.rotation.z = Math.sin(t * 0.8) * 0.1;
        purr = Math.max(0, purr - dt);
      });
      f.hitbox([0, 0.15, 0], [0.7, 0.4, 0.5], {
        label: opts.name ?? 'Schlafende Katze', verb: 'Streicheln', secret: opts.secret, secretName: 'Die schlafende Bibliothekskatze',
        onInteract: () => { purr = 3; kit.services.audio?.play('purr'); kit.services.ui.toast(opts.quip ?? 'Prrrrr… Die Katze öffnet ein Auge, beschließt aber, dass du in Ordnung bist.'); },
      });
    },
  }),

  defineProp({
    name: 'teaSet',
    create(f, opts, kit) {
      f.add(lathe([[0, 0], [0.07, 0], [0.09, 0.05], [0.085, 0.1], [0.04, 0.13], [0.05, 0.14], [0, 0.15]], 14), 'ceramic', [0, 0, 0]);
      f.add(cyl(0.012, 0.02, 0.12, 6), 'ceramic', [0.1, 0.08, 0], [0, 0, -0.9]);
      f.add(torus(0.035, 0.01, 6, 10), 'ceramic', [-0.09, 0.08, 0], [0, 0, 0]);
      for (const [x, z] of [[0.22, 0.08], [-0.18, 0.14]]) {
        f.add(cyl(0.04, 0.03, 0.06, 10), 'ceramic', [x, 0.03, z]);
        f.add(cyl(0.06, 0.06, 0.008, 12), 'ceramic', [x, 0.004, z]);
        f.add(cyl(0.035, 0.035, 0.002, 10), 'woodRed', [x, 0.055, z]);
      }
      // Dampf
      const steam = [];
      for (let i = 0; i < 3; i++) steam.push(f.glow([0.17, 0.2 + i * 0.08, 0], { color: '#ffffff', size: 0.12, opacity: 0.12 }));
      kit.onUpdate((dt, t) => steam.forEach((s, i) => { const k = (t * 0.4 + i / 3) % 1; s.userData.y0 ??= s.position.y; s.position.y = s.userData.y0 + k * 0.25; s.material.opacity = 0.15 * (1 - k); }));
      f.hitbox([0, 0.1, 0], [0.5, 0.25, 0.4], {
        label: 'Tee', verb: 'Einen Schluck nehmen', secret: opts.secret, secretName: 'Tee, der nie kalt wird',
        onInteract: () => kit.services.ui.toast('Der Tee ist genau richtig warm. Er war es schon immer. Er wird es immer sein.'),
      });
    },
  }),

  defineProp({
    name: 'crystalBall',
    create(f, opts, kit) {
      f.add(cyl(0.08, 0.11, 0.06, 10), 'brass', [0, 0.03, 0]);
      const ball = f.mesh(new THREE.SphereGeometry(0.11, 20, 14), new THREE.MeshStandardMaterial({ color: '#b0a0ff', emissive: '#4030a0', transparent: true, opacity: 0.75, roughness: 0.05 }), [0, 0.17, 0]);
      const gl = f.glow([0, 0.17, 0], { color: '#a080ff', size: 0.7, opacity: 0.5 });
      kit.onUpdate((dt, t) => { ball.material.emissiveIntensity = 0.8 + Math.sin(t * 1.3) * 0.4; gl.material.opacity = 0.35 + Math.sin(t * 1.3) * 0.15; });
      if (opts.interact !== false) f.hitbox([0, 0.17, 0], [0.3, 0.3, 0.3], {
        label: 'Kristallkugel', verb: 'Hineinsehen',
        onInteract: () => kit.services.events.emit('crystalBall'),
      });
    },
  }),

  defineProp({
    name: 'bell',
    create(f, opts, kit) {
      f.add(cyl(0.06, 0.07, 0.015, 12), 'woodDark', [0, 0.008, 0]);
      f.add(lathe([[0, 0.09], [0.02, 0.088], [0.045, 0.06], [0.055, 0.02], [0.06, 0.015], [0, 0.015]], 14), 'brass', [0, 0, 0]);
      f.add(sphere(0.012, 6, 4), 'brass', [0, 0.1, 0]);
      f.hitbox([0, 0.06, 0], [0.18, 0.15, 0.18], {
        label: 'Tischglocke', verb: 'Läuten', range: 2.5,
        onInteract: () => { kit.services.audio?.play('bell'); kit.services.events.emit('bellRung'); kit.services.events.emit('summonWizard'); },
      });
    },
  }),

  defineProp({
    name: 'ideaJar',
    create(f, opts, kit) {
      f.add(lathe([[0, 0], [0.1, 0], [0.11, 0.05], [0.11, 0.25], [0.07, 0.3], [0.07, 0.33], [0, 0.33]], 14), 'glass', [0, 0, 0]);
      f.add(cyl(0.075, 0.075, 0.04, 12), 'cork', [0, 0.345, 0]);
      const flies = [];
      for (let i = 0; i < 6; i++) {
        const m = f.mesh(new THREE.SphereGeometry(0.008, 6, 4), 'glowGreen', [0, 0.15, 0]);
        flies.push(m);
      }
      const gl = f.glow([0, 0.15, 0], { color: '#b0ff90', size: 0.6, opacity: 0.4 });
      const base = f.point(0, 0.15, 0);
      kit.onUpdate((dt, t) => flies.forEach((m, i) => {
        m.position.set(base.x + Math.sin(t * (1 + i * 0.3) + i) * 0.06, base.y + Math.sin(t * (1.3 + i * 0.2) + i * 2) * 0.08, base.z + Math.cos(t * (0.9 + i * 0.25) + i) * 0.06);
        gl.material.opacity = 0.3 + Math.sin(t * 2) * 0.1;
      }));
      f.hitbox([0, 0.17, 0], [0.3, 0.4, 0.3], {
        label: 'Glas voller Geistesblitze', verb: 'Schütteln', secret: opts.secret, secretName: 'Das Glas voller Geistesblitze',
        onInteract: () => kit.services.events.emit('randomIdea'),
      });
    },
  }),

  defineProp({
    name: 'scroll',
    create(f, opts) {
      const len = opts.length ?? 0.35;
      f.add(cyl(0.035, 0.035, len, 10), 'paper', [0, 0.035, 0], [0, 0, Math.PI / 2]);
      for (const x of [-len / 2 - 0.02, len / 2 + 0.02]) f.add(cyl(0.012, 0.012, 0.05, 6), 'woodDark', [x, 0.035, 0], [0, 0, Math.PI / 2]);
      f.add(torus(0.037, 0.006, 4, 12), 'velvet', [0, 0.035, 0], [0, Math.PI / 2, 0]);
    },
  }),
];

function wrap(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
