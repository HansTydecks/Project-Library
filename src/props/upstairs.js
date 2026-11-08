import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, torus, lathe } from '../world/geo.js';
import { mat, hdr } from '../world/materials.js';
import { canvasTexture, FONT_TITLE } from '../world/textures.js';
import { compactGroup } from '../world/kit.js';
import { M, S } from './friends.js';

// Obere Etagen: Turmdach mit Glocke, Turmuhr, Truhe, Briefkasten, Pflanzstelle – und Items zum Aufheben.

/** Kleines Helferlein: Interaktion, die ein Item braucht. */
function needsItem(kit, item, { label, verbHas, verbNo, onUse, onNo }) {
  const items = kit.services.items;
  return {
    label,
    verb: () => (items.has(item) ? `${items.get(item).icon} ${verbHas}` : typeof verbNo === 'function' ? verbNo() : verbNo),
    onInteract: () => { if (items.has(item)) { items.take(item); onUse(); } else onNo(); },
  };
}

export default [
  // Gegenstand zum Aufheben (wird zum Item in der Tasche)
  defineProp({
    name: 'pickup',
    create(f, opts, kit) {
      const items = kit.services.items, it = items.get(opts.item);
      if (!it) return;
      const g = new THREE.Group();
      const kind = opts.item;
      if (kind === 'keks') { g.add(M(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 14), 'woodLight')); for (let i = 0; i < 5; i++) g.add(M(S(0.008, 5, 4), 'woodDark', [Math.cos(i * 1.3) * 0.035, 0.011, Math.sin(i * 1.3) * 0.035])); }
      else if (kind === 'zahnrad') { g.add(M(new THREE.CylinderGeometry(0.07, 0.07, 0.025, 12), 'brass')); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.add(M(new THREE.BoxGeometry(0.025, 0.025, 0.02), 'brass', [Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08], [0, -a, 0])); } }
      else if (kind === 'wolle') { g.add(M(S(0.1, 12, 10), 'pastelLilac')); g.add(M(new THREE.TorusGeometry(0.1, 0.012, 4, 16), 'pastelPink', null, [0.6, 0, 0])); }
      else if (kind === 'schluessel') { g.add(M(new THREE.TorusGeometry(0.04, 0.012, 6, 14), 'gold', [0, 0, -0.06])); g.add(M(new THREE.BoxGeometry(0.02, 0.02, 0.12), 'gold', [0, 0, 0.02])); g.add(M(new THREE.BoxGeometry(0.02, 0.04, 0.02), 'gold', [0, -0.02, 0.07])); }
      else g.add(M(S(0.07, 10, 8), 'gold'));
      compactGroup(g);
      f.object(g, [0, 0.08, 0]);
      const sp = f.glow([0, 0.1, 0], { color: '#fff0b0', size: 0.5, opacity: 0.4 });
      const hidden = () => items.seen(opts.item);
      if (hidden()) { g.visible = false; sp.visible = false; }
      const y0 = g.position.y;
      kit.onUpdate((dt, t) => { if (!g.visible) return; g.rotation.y += dt * 1.2; g.position.y = y0 + Math.sin(t * 2) * 0.02; });
      const hit = M(new THREE.BoxGeometry(0.35, 0.3, 0.35), 'invisible', [0, 0.05, 0]); hit.userData.hitbox = true; g.add(hit);
      f.interactable(hit, {
        label: `${it.icon} ${it.name}`, verb: 'Einstecken', range: 3.2, filter: () => g.visible,
        onInteract: () => { if (items.give(opts.item)) { g.visible = false; sp.visible = false; } },
      });
    },
  }),

  // Turmdach über der Aussichtsplattform: Säulen, Kegeldach, Wetterhahn, Glocke (3× läuten → Osterei)
  defineProp({
    name: 'towerRoof',
    create(f, opts, kit) {
      const R = opts.radius ?? 7.2, H = opts.height ?? 5.5;
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        f.add(cyl(0.3, 0.36, H, 12), 'stoneLight', [x * R, H / 2, z * R]);
        f.add(box(0.9, 0.3, 0.9, 1), 'stoneDark', [x * R, H - 0.15, z * R]);
      }
      f.add(box(R * 2 + 1.2, 0.4, R * 2 + 1.2, 2), 'stoneDark', [0, H + 0.2, 0]);
      f.add(new THREE.ConeGeometry(R * 1.15, 5, 4, 1), 'roof', [0, H + 2.9, 0], [0, Math.PI / 4, 0]);
      f.add(sphere(0.3, 10, 8), 'gold', [0, H + 5.5, 0]);
      // Wetterhahn
      const cock = new THREE.Group();
      cock.add(M(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 5), 'gold', [0, 0.45, 0]));
      cock.add(M(S(0.18, 10, 8), 'gold', [0, 1.0, 0], null, [1.4, 0.9, 0.4]));
      cock.add(M(new THREE.ConeGeometry(0.16, 0.4, 4), 'gold', [-0.3, 1.1, 0], [0, 0, 1.2], [1, 1, 0.3]));
      cock.add(M(S(0.08, 8, 6), 'gold', [0.25, 1.2, 0]));
      cock.add(M(new THREE.ConeGeometry(0.03, 0.08, 4), 'candy', [0.34, 1.2, 0], [0, 0, -Math.PI / 2]));
      compactGroup(cock);
      f.object(cock, [0, H + 5.7, 0]);
      kit.onUpdate((dt, t) => { cock.rotation.y = Math.sin(t * 0.13) * 2 + Math.sin(t * 0.7) * 0.2; });
      // Glocke
      const bell = new THREE.Group();
      bell.add(M(lathe([[0, 0], [0.5, 0], [0.45, 0.1], [0.32, 0.5], [0.28, 0.9], [0.1, 1.0], [0, 1.0]], 20), 'brass', [0, -1, 0]));
      bell.add(M(S(0.1, 8, 6), 'iron', [0, -0.95, 0]));
      bell.add(M(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 5), 'iron', [0, 0.25, 0]));
      compactGroup(bell);
      f.object(bell, [0, H - 0.4, 0]);
      let swing = 0;
      const rings = kit.services.fx;
      const egg = 'turmglocke';
      kit.services.secrets.register(egg, 'Dreimal die Turmglocke geläutet', kit.room?.id, 'egg');
      let stamps = [];
      kit.onUpdate((dt, t) => { swing = Math.max(0, swing - dt * 0.4); bell.rotation.z = Math.sin(t * 5) * 0.35 * swing; });
      f.hitbox([0, H - 1.0, 0], [1.4, 1.4, 1.4], {
        label: 'Turmglocke', verb: 'Läuten', range: 5,
        onInteract: () => {
          swing = 1; kit.services.audio.play('bell');
          const now = performance.now() / 1000;
          stamps = stamps.filter((s) => now - s < 12); stamps.push(now);
          if (stamps.length >= 3) { stamps = []; kit.services.secrets.found(egg); setTimeout(() => kit.services.ui.toast('Von ganz unten ruft der Bibliothekar: »Ich hab’s gehört! Ganz bis ins Foyer!«', { ms: 6000 }), 900); }
          void rings;
        },
      });
    },
  }),

  // Turmuhr (Wand, lokal +z in den Raum). Steht still, bis das kleine Zahnrad eingesetzt wird.
  defineProp({
    name: 'towerClock',
    create(f, opts, kit) {
      const R = opts.radius ?? 1.6, y = opts.y ?? 3.5;
      const face = canvasTexture(512, 512, (g, w) => {
        g.fillStyle = '#fbf0d8'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 6, 0, 7); g.fill();
        g.strokeStyle = '#c8963e'; g.lineWidth = 18; g.stroke();
        g.fillStyle = '#3a2410'; g.font = `60px ${FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        ['XII', 'III', 'VI', 'IX'].forEach((r, i) => { const a = (i / 4) * Math.PI * 2 - Math.PI / 2; g.fillText(r, w / 2 + Math.cos(a) * 185, w / 2 + Math.sin(a) * 185); });
        for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2; g.fillRect(w / 2 + Math.cos(a) * 225 - 2, w / 2 + Math.sin(a) * 225 - 2, i % 5 ? 4 : 8, i % 5 ? 4 : 8); }
      }, { repeat: false });
      f.add(cyl(R + 0.15, R + 0.15, 0.2, 32), 'woodDark', [0, y, 0.1], [Math.PI / 2, 0, 0]);
      const dial = new THREE.Mesh(new THREE.CircleGeometry(R, 40), new THREE.MeshStandardMaterial({ map: face, roughness: 0.7 }));
      f.object(dial, [0, y, 0.21]);
      const hands = [[R * 0.85, 0.05], [R * 0.55, 0.09]].map(([L, w], i) => { const h = new THREE.Mesh(new THREE.BoxGeometry(w, L, 0.02), mat('black')); h.geometry.translate(0, L / 2, 0); f.object(h, [0, y, 0.24 + i * 0.02]); return h; });
      hands[0].rotation.z = -2.1; hands[1].rotation.z = -0.7; // stehen geblieben: 10 nach 4
      const gap = M(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 10), 'black'); gap.rotation.x = Math.PI / 2; f.object(gap, [0, y - R * 0.5, 0.24]);
      const fx = kit.services.fx, egg = 'turmuhr';
      kit.services.secrets.register(egg, 'Die Turmuhr läuft wieder', kit.room?.id, 'egg');
      let running = kit.services.progress.has('secrets', egg);
      if (running) gap.material = mat('brass');
      kit.onUpdate(() => {
        if (!running) return;
        const now = new Date();
        hands[0].rotation.z = -(now.getMinutes() / 60 + now.getSeconds() / 3600) * Math.PI * 2;
        hands[1].rotation.z = -((now.getHours() % 12) / 12 + now.getMinutes() / 720) * Math.PI * 2;
      });
      f.hitbox([0, y, 0.3], [R * 2, R * 2, 0.4], {
        range: 5, ...needsItem(kit, 'zahnrad', {
          label: 'Turmuhr', verbHas: 'Zahnrad einsetzen', verbNo: 'Betrachten',
          onUse: () => {
            running = true; gap.material = mat('brass');
            kit.services.secrets.found(egg); kit.services.audio.play('tickTock'); setTimeout(() => kit.services.audio.play('bell'), 1500);
            kit.services.events.emit('party', 10);
            kit.services.ui.toast('*Tick* … *Tack* … Die Turmuhr läuft wieder! Über den Dächern regnet es Konfetti.', { ms: 6500 });
          },
          onNo: () => kit.services.ui.toast(running ? `Die Turmuhr zeigt ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}. Pünktlich wie nie.` : 'Die Uhr steht still. In der Mitte fehlt ein kleines Zahnrad. Die Uhrmacherin hat bestimmt eins übrig.'),
        }),
      });
      void fx;
    },
  }),

  // Truhe auf der Turmspitze – braucht den goldenen Schlüssel, enthält Sternenstaub
  defineProp({
    name: 'treasureChest',
    create(f, opts, kit) {
      f.add(box(1, 0.5, 0.65, 0), 'woodRed', [0, 0.25, 0]);
      for (const x of [-0.42, 0, 0.42]) f.add(box(0.06, 0.52, 0.67, 0), 'gold', [x, 0.25, 0]);
      // Deckel mit Scharnier an der Rückkante
      const lid = new THREE.Group(); lid.position.set(0, 0.5, -0.325);
      lid.add(M(new THREE.BoxGeometry(1.04, 0.16, 0.67), 'woodRed', [0, 0.08, 0.325]));
      for (const x of [-0.42, 0, 0.42]) lid.add(M(new THREE.BoxGeometry(0.06, 0.17, 0.69), 'gold', [x, 0.08, 0.325]));
      compactGroup(lid);
      lid.rotation.order = 'YXZ'; // Scharnier um die eigene x-Achse, auch wenn die Truhe gedreht steht
      f.object(lid);
      f.add(box(0.12, 0.14, 0.04, 0), 'gold', [0, 0.42, 0.34]);
      const glow = f.glow([0, 0.7, 0], { color: '#fff0a0', size: 1.6, opacity: 0 });
      f.collider(0, 0, 1, 0.65, { top: 0.6 });
      const items = kit.services.items;
      let open = items.seen('sternenstaub') ? 1 : 0, opening = 0;
      kit.onUpdate((dt, t) => {
        if (opening > 0) { opening = Math.min(1, opening + dt); open = opening; }
        lid.rotation.x = -open * 1.6;
        glow.material.opacity = open > 0 && !items.used('sternenstaub') ? 0.4 + Math.sin(t * 3) * 0.15 : 0;
      });
      f.hitbox([0, 0.4, 0], [1.1, 0.8, 0.8], {
        ...needsItem(kit, 'schluessel', {
          label: 'Verschlossene Truhe', verbHas: 'Aufschließen', verbNo: 'Rütteln',
          onUse: () => { opening = 0.01; kit.services.audio.play('secret'); setTimeout(() => items.give('sternenstaub'), 900); },
          onNo: () => kit.services.ui.toast(open ? 'Die Truhe ist leer. Bis auf ein Gefühl von Abenteuer.' : 'Abgeschlossen. Das Schlüsselloch ist golden. Wo landen verlorene Schlüssel?'),
        }),
      });
    },
  }),

  // Briefkasten der Eulenpost: mit Feder einen Brief schreiben → Antwort kommt als Item
  defineProp({
    name: 'owlMailbox',
    create(f, opts, kit) {
      f.add(cyl(0.05, 0.06, 1.0, 8), 'iron', [0, 0.5, 0]);
      f.add(box(0.5, 0.6, 0.4, 0), 'candy', [0, 1.3, 0]);
      f.add(cyl(0.25, 0.25, 0.4, 14, 1), 'candy', [0, 1.6, 0], [Math.PI / 2, 0, 0]);
      f.add(box(0.3, 0.04, 0.02, 0), 'black', [0, 1.45, 0.205]);
      f.add(box(0.2, 0.1, 0.01, 0), 'pastelLemon', [0, 1.2, 0.205]);
      f.collider(0, 0, 0.5, 0.45);
      const egg = 'eulenbrief';
      kit.services.secrets.register(egg, 'Ein Brief, der zurückkam', kit.room?.id, 'egg');
      f.hitbox([0, 1.35, 0], [0.6, 0.8, 0.5], {
        ...needsItem(kit, 'feder', {
          label: 'Briefkasten der Eulenpost', verbHas: 'Brief schreiben', verbNo: 'Hineinschauen',
          onUse: () => {
            kit.services.audio.play('page'); setTimeout(() => kit.services.audio.play('hoot'), 800);
            kit.services.ui.toast('Du schreibst »Liebe Bibliothek, …« – und eine Eule flattert sofort mit der Antwort zurück!', { ms: 6000 });
            kit.services.secrets.found(egg);
            setTimeout(() => kit.services.items.give('brief'), 2200);
          },
          onNo: () => kit.services.ui.toast('Leer. Für einen Brief bräuchtest du etwas zum Schreiben. Eine Feder vielleicht?'),
        }),
      });
    },
  }),

  // Wand mit Brieffächern (lokal +z in den Raum)
  defineProp({
    name: 'pigeonholes',
    create(f, opts, kit) {
      const cols = opts.cols ?? 8, rows = opts.rows ?? 5, c = 0.32;
      const W = cols * c, H = rows * c;
      f.add(box(W + 0.1, H + 0.1, 0.35, 1), 'woodDark', [0, 1 + H / 2, 0.17]);
      const r = kit.services.rng(`post${f.point(0, 0, 0).x.toFixed(1)}`);
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const x = -W / 2 + c * (i + 0.5), y = 1 + c * (j + 0.5);
        f.add(box(c - 0.04, c - 0.04, 0.02, 0), 'black', [x, y, 0.08]);
        const n = r.int(0, 3);
        for (let k = 0; k < n; k++) f.add(box(0.2, 0.13, 0.008, 0), r.pick(['white', 'cream', 'pastelPink', 'pastelSky']), [x + r.range(-0.03, 0.03), y - 0.06 + k * 0.03, 0.15 + k * 0.03], [-0.2, 0, r.range(-0.2, 0.2)]);
      }
      f.collider(0, 0.17, W + 0.1, 0.35);
    },
  }),

  // Pflanzstelle im Dachgarten: Samentüte → eine riesige Singblume wächst
  defineProp({
    name: 'plantSpot',
    create(f, opts, kit) {
      f.add(cyl(0.7, 0.8, 0.35, 16), 'terracotta', [0, 0.175, 0]);
      f.add(cyl(0.65, 0.65, 0.04, 16), 'woodDark', [0, 0.33, 0]);
      // Riesenblume: eigene Gruppe, damit sie wachsen kann
      const grow = new THREE.Group();
      grow.add(M(new THREE.CylinderGeometry(0.06, 0.09, 2.4, 8), 'leaves', [0, 1.2, 0]));
      for (const sd of [-1, 1]) grow.add(M(S(0.3, 8, 6), 'leaves', [sd * 0.25, 1.0, 0], [0, 0, sd * 0.6], [1, 0.25, 0.5]));
      const head = new THREE.Group(); head.position.y = 2.5; grow.add(head);
      head.add(M(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 20), 'woodLight', [0, 0, 0], [Math.PI / 2, 0, 0]));
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; head.add(M(S(0.22, 8, 6), 'pastelPink', [Math.cos(a) * 0.58, Math.sin(a) * 0.58, -0.01], [0, 0, a - Math.PI / 2], [0.5, 1, 0.2])); }
      for (const sx of [-1, 1]) { head.add(M(S(0.07, 10, 8), 'white', [sx * 0.15, 0.1, 0.06])); head.add(M(S(0.045, 8, 6), 'black', [sx * 0.15, 0.1, 0.1])); head.add(M(new THREE.CircleGeometry(0.06, 10), 'pastelPink', [sx * 0.25, -0.05, 0.055])); }
      const mouth = M(S(0.08, 10, 8), 'candy', [0, -0.12, 0.06], null, [1.3, 0.4, 0.3]); head.add(mouth);
      compactGroup(head, [mouth]); compactGroup(grow, [head]);
      f.object(grow, [0, 0.33, 0]);
      const egg = 'riesenblume';
      kit.services.secrets.register(egg, 'Eine Riesenblume gepflanzt', kit.room?.id, 'egg');
      let k = kit.services.progress.has('secrets', egg) ? 1 : 0, growing = 0, sing = 0;
      grow.visible = k > 0;
      kit.onUpdate((dt, t) => {
        if (growing) { k = Math.min(1, k + dt * 0.25); if (k >= 1) growing = 0; }
        grow.visible = k > 0.02; grow.scale.setScalar(Math.max(0.01, k));
        head.rotation.z = Math.sin(t * 0.8) * 0.08; head.rotation.y = Math.sin(t * 0.5) * 0.3;
        sing = Math.max(0, sing - dt); mouth.scale.y = sing > 0 ? 0.6 + Math.abs(Math.sin(t * 9)) : 0.4;
      });
      f.hitbox([0, 0.4, 0], [1.4, 0.6, 1.4], {
        ...needsItem(kit, 'samen', {
          label: 'Blumentopf', verbHas: 'Samen pflanzen', verbNo: () => (k > 0 ? 'Zuhören' : 'Erde fühlen'),
          onUse: () => { growing = 1; kit.services.secrets.found(egg); kit.services.audio.play('magic'); kit.services.ui.toast('Du pflanzt die Samen. Die Erde kichert. Und dann wächst etwas – sehr schnell, sehr groß.', { ms: 6500 }); },
          onNo: () => {
            if (k > 0) { sing = 2; kit.services.audio.play('sing'); kit.services.ui.toast('LAAA-LAAA! Die Riesenblume singt so laut, dass die Bienen mitsummen.'); }
            else kit.services.ui.toast('Gute, weiche Erde. Hier fehlen nur Samen.');
          },
        }),
      });
    },
  }),

  // Fernrohr auf der Turmspitze: zum Mond schauen (Osterei)
  defineProp({
    name: 'moonScope',
    create(f, opts, kit) {
      f.add(cyl(0.04, 0.05, 1.2, 8), 'iron', [0, 0.6, 0]);
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; f.add(cyl(0.02, 0.02, 0.9, 5), 'iron', [Math.cos(a) * 0.25, 0.4, Math.sin(a) * 0.25], [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]); }
      f.add(cyl(0.09, 0.13, 1.1, 14), 'brass', [0, 1.35, 0.1], [-1.0, 0, 0]);
      f.add(torus(0.13, 0.02, 6, 14), 'gold', [0, 1.62, 0.55], [-1.0 + Math.PI / 2, 0, 0]);
      f.collider(0, 0, 0.6, 0.6);
      const egg = 'mondblick';
      kit.services.secrets.register(egg, 'Durchs Fernrohr zum Mond geschaut', kit.room?.id, 'egg');
      f.hitbox([0, 1.2, 0], [0.6, 1.2, 1], {
        label: 'Messing-Fernrohr', verb: 'Hindurchschauen', range: 3,
        onInteract: () => { kit.services.secrets.found(egg); kit.services.audio.play('magic'); kit.services.ui.toast('Auf dem Mond sitzt jemand mit einem Buch und winkt zurück. Er hat auch ein Fernrohr.', { ms: 6500 }); },
      });
    },
  }),

  // Mond-Mobile unter der Decke der Traumkammer
  defineProp({
    name: 'moonMobile',
    create(f, opts, kit) {
      const g = new THREE.Group();
      g.add(M(new THREE.TorusGeometry(0.4, 0.05, 8, 24, Math.PI * 1.3), new THREE.MeshBasicMaterial({ color: hdr('#fff0b0', 1.1) }), [0, 0, 0], [0, 0, 0.8]));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2, L = 0.4 + (i % 3) * 0.2;
        g.add(M(new THREE.CylinderGeometry(0.004, 0.004, L, 3), 'cream', [Math.cos(a) * 0.8, -L / 2, Math.sin(a) * 0.8]));
        g.add(M(new THREE.OctahedronGeometry(0.1), new THREE.MeshBasicMaterial({ color: hdr(['#ffe68a', '#c8e0ff', '#ffc8e8'][i % 3], 1.1) }), [Math.cos(a) * 0.8, -L - 0.05, Math.sin(a) * 0.8]));
      }
      g.add(M(new THREE.CylinderGeometry(0.006, 0.006, 1.2, 3), 'cream', [0, 0.6, 0]));
      compactGroup(g);
      f.object(g, [0, opts.y ?? 3.6, 0]);
      kit.onUpdate((dt) => { g.rotation.y += dt * 0.15; });
    },
  }),

  // Deko: Honiggläser, Paketstapel, Leimtopf, Briefstapel
  defineProp({
    name: 'honeyJars',
    create(f, opts) {
      for (let i = 0; i < (opts.count ?? 4); i++) {
        const x = (i - 1.5) * 0.18;
        f.add(cyl(0.07, 0.07, 0.14, 12), 'potionGold', [x, 0.07, 0]);
        f.add(cyl(0.075, 0.075, 0.03, 12), 'pastelPink', [x, 0.155, 0]);
        f.add(box(0.07, 0.05, 0.005, 0), 'cream', [x, 0.07, 0.072]);
      }
    },
  }),
  defineProp({
    name: 'parcelStack',
    create(f, opts, kit) {
      const r = kit.services.rng(`parcel${f.point(0, 0, 0).x.toFixed(1)}${f.point(0, 0, 0).z.toFixed(1)}`);
      let y = 0;
      for (let i = 0; i < (opts.count ?? 4); i++) {
        const w = r.range(0.3, 0.55), h = r.range(0.18, 0.35), d = r.range(0.3, 0.5);
        f.add(box(w, h, d, 0), r.pick(['woodLight', 'paper', 'cream']), [r.range(-0.05, 0.05), y + h / 2, 0], [0, r.range(-0.3, 0.3), 0]);
        f.add(box(w + 0.01, 0.02, 0.05, 0), 'candy', [0, y + h + 0.002, 0]);
        f.add(box(0.05, 0.02, d + 0.01, 0), 'candy', [0, y + h + 0.002, 0]);
        y += h;
      }
      f.collider(0, 0, 0.55, 0.5, { top: y });
    },
  }),
  defineProp({
    name: 'gluePot',
    create(f) {
      f.add(cyl(0.12, 0.1, 0.18, 12), 'copper', [0, 0.09, 0]);
      f.add(cyl(0.105, 0.105, 0.01, 12), 'cream', [0, 0.17, 0]);
      f.add(cyl(0.01, 0.01, 0.3, 5), 'woodLight', [0.04, 0.25, 0], [0, 0, -0.3]);
    },
  }),
];
