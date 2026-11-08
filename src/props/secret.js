import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, torus } from '../world/geo.js';
import { mat } from '../world/materials.js';
import { compactGroup } from '../world/kit.js';

// Geheimregal (verschiebbar) und die Fundstücke im Kabinett der verlorenen Dinge.
const at = (mesh, x, y, z) => { mesh.position.set(x, y, z); return mesh; };
const BOOK_COLS = ['#7a2e3a', '#2b4a35', '#1f3a5a', '#6a4a20', '#4a2a5a', '#3a5a6a'];

export default [
  // Regal, das eine Geheimtür verdeckt. Ein Buch steht etwas vor – daran ziehen!
  defineProp({
    name: 'secretShelf',
    create(f, opts, kit) {
      const W = 2.7, H = 3.0, D = 0.42;
      const g = new THREE.Group();
      const wood = mat('woodDark');
      for (const s of [-1, 1]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.06, H, D), wood), s * (W / 2 - 0.03), H / 2, 0));
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, D + 0.04), wood), 0, H, 0));
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, H, 0.03), mat('woodRed')), 0, H / 2, -D / 2 + 0.02));
      const r = kit.services.rng(opts.id ?? 'geheimregal');
      for (let l = 0; l < 5; l++) {
        const y = 0.08 + l * 0.6;
        g.add(at(new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, 0.04, D - 0.04), wood), 0, y, 0));
        let x = -W / 2 + 0.12;
        while (x < W / 2 - 0.15) {
          const w = 0.04 + r.next() * 0.05, h = 0.32 + r.next() * 0.18;
          const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.26), mat(['woodRed', 'velvet', 'velvetGreen', 'velvetBlue', 'woodLight'][Math.floor(r.next() * 5)]));
          b.position.set(x + w / 2, y + 0.02 + h / 2, 0.02); g.add(b);
          x += w + 0.008;
        }
      }
      compactGroup(g);
      // Das »falsche« Buch: rot, steht etwas heraus
      const trick = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 0.28), new THREE.MeshStandardMaterial({ color: '#e04050', roughness: 0.5, emissive: '#2a0408' }));
      trick.position.set(0.35, 1.3 + 0.23, 0.12); g.add(trick);
      // Scharnier am linken Rand: das Regal schwingt wie eine Tür in den Raum
      const pivot = new THREE.Group();
      g.position.x = W / 2; pivot.add(g);
      f.object(pivot, [-W / 2, 0, 0]);
      const owner = `geheim:${opts.id}`;
      const open = () => kit.services.collision.removeOwner(owner);
      f.collider(0, 0, W, D, { owner, shadow: false });
      const base = pivot.rotation.y;
      const secrets = kit.services.secrets;
      secrets.register(opts.id, 'Das Regal mit dem falschen Buch', kit.room?.id, 'egg');
      let k = kit.services.progress.has('secrets', opts.id) ? 1 : 0, opening = false;
      if (k) { open(); pivot.rotation.y = base - 1.45; trick.rotation.x = -0.4; }
      kit.onUpdate((dt) => {
        if (!opening || k >= 1) return;
        k = Math.min(1, k + dt * 0.45);
        const e = k * k * (3 - 2 * k);
        pivot.rotation.y = base - e * 1.45;
        g.position.y = Math.sin(k * Math.PI * 12) * 0.01 * (1 - k);
        if (k >= 1) open();
      });
      f.interactable(trick, {
        label: 'Ein Buch, das nicht ganz drinsteht', verb: 'Daran ziehen', range: 3,
        onInteract: () => {
          if (k > 0) return kit.services.ui.toast('Das Buch heißt »Wie man Geheimgänge versteckt«. Ironisch.');
          trick.rotation.x = -0.4; opening = true; open(); // Durchgang sofort frei, das Regal schwingt hinterher
          kit.services.audio.play('knock'); setTimeout(() => kit.services.audio.play('whoosh'), 300);
          secrets.found(opts.id);
          kit.services.ui.toast('*Klick* … Das Regal schwingt auf wie eine Tür. Dahinter: ein Raum, den es nicht gibt.', { ms: 6000 });
        },
      });
    },
  }),

  // Haufen einzelner Socken
  defineProp({
    name: 'sockPile',
    create(f, opts, kit) {
      const r = kit.services.rng(`socks${f.point(0, 0, 0).x.toFixed(1)}`);
      const cols = ['pastelPink', 'pastelSky', 'pastelMint', 'pastelLemon', 'candy', 'porcelainBlue', 'pastelLilac'];
      const n = opts.count ?? 24;
      for (let i = 0; i < n; i++) {
        const a = r.next() * 6.28, d = Math.sqrt(r.next()) * (opts.radius ?? 0.7), y = 0.05 + (1 - d / (opts.radius ?? 0.7)) * 0.35 * r.next();
        const c = cols[Math.floor(r.next() * cols.length)];
        f.add(new THREE.CapsuleGeometry(0.05, 0.18, 3, 6), c, [Math.cos(a) * d, y, Math.sin(a) * d], [Math.PI / 2, a, 0]);
        f.add(new THREE.CapsuleGeometry(0.05, 0.08, 3, 6), c, [Math.cos(a) * d + Math.cos(a + 1.57) * 0.08, y, Math.sin(a) * d + Math.sin(a + 1.57) * 0.08], [Math.PI / 2, a + 1.57, 0]);
        if (i % 3 === 0) f.add(new THREE.TorusGeometry(0.05, 0.012, 4, 10), 'white', [Math.cos(a) * d - Math.cos(a) * 0.12, y, Math.sin(a) * d - Math.sin(a) * 0.12], [0, a, 0]);
      }
      f.collider(0, 0, 1.3, 1.3, { top: 0.35 });
      f.hitbox([0, 0.25, 0], [1.4, 0.5, 1.4], {
        label: 'Einzelne Socken', verb: 'Paare suchen', secret: opts.secret, secretName: 'Der Sockenberg',
        onInteract: () => kit.services.ui.toast('Hunderte Socken, kein einziges Paar. Die Waschmaschinen dieser Welt schicken sie hierher.'),
      });
    },
  }),

  // Schirmständer voller vergessener Regenschirme
  defineProp({
    name: 'umbrellaStand',
    create(f, opts, kit) {
      f.add(cyl(0.22, 0.2, 0.55, 14), 'copper', [0, 0.275, 0]);
      const cols = ['candy', 'pastelSky', 'pastelLemon', 'black', 'pastelMint'];
      for (let i = 0; i < 5; i++) {
        const a = i * 1.26, tilt = 0.12;
        const x = Math.cos(a) * 0.09, z = Math.sin(a) * 0.09;
        f.add(cone(0.08, 0.75, 8), cols[i], [x, 0.55 + 0.37, z], [Math.cos(a) * tilt, 0, -Math.sin(a) * tilt]);
        f.add(cyl(0.008, 0.008, 0.3, 4), 'woodDark', [x, 1.38, z]);
        f.add(torus(0.035, 0.008, 4, 8, Math.PI), 'woodDark', [x + 0.035, 1.53, z], [0, 0, 0]);
      }
      f.collider(0, 0, 0.45, 0.45);
    },
  }),

  // Ein Berg verlorener Schlüssel
  defineProp({
    name: 'keyHeap',
    create(f, opts, kit) {
      const r = kit.services.rng('keys');
      for (let i = 0; i < 40; i++) {
        const a = r.next() * 6.28, d = Math.sqrt(r.next()) * 0.35, y = 0.02 + (1 - d / 0.35) * 0.12 * r.next();
        const m = r.chance(0.7) ? 'gold' : 'brass';
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        f.add(torus(0.025, 0.007, 4, 10), m, [x, y, z], [Math.PI / 2 + r.range(-0.4, 0.4), 0, 0]);
        f.add(box(0.07, 0.008, 0.012, 0), m, [x + Math.cos(a) * 0.06, y, z + Math.sin(a) * 0.06], [0, -a, 0]);
      }
      f.hitbox([0, 0.08, 0], [0.8, 0.2, 0.8], {
        label: 'Verlorene Schlüssel', verb: 'Durchwühlen',
        onInteract: () => kit.services.ui.toast('Ein Schlüssel für jede Tür, die es nie gab. Und einer für den Kühlschrank von 1987.'),
      });
    },
  }),

  // Kiste »Verlorene Gedanken« – gibt eine zufällige Idee aus content/ideas.json heraus
  defineProp({
    name: 'thoughtBox',
    create(f, opts, kit) {
      f.add(box(0.7, 0.45, 0.5, 0), 'woodLight', [0, 0.225, 0]);
      f.add(box(0.74, 0.04, 0.54, 0), 'woodDark', [0, 0.47, 0]);
      const sign = kit.services.makeSign('Verlorene Gedanken', { size: 44, w: 512, h: 96, bg: '#f6ead0', ink: '#5a2a3a' });
      sign.scale.set(0.6, 0.12, 1); f.object(sign, [0, 0.3, 0.255]);
      f.glow([0, 0.55, 0], { color: '#ffe8a0', size: 0.8, opacity: 0.3 });
      f.collider(0, 0, 0.7, 0.5, { top: 0.49 });
      f.hitbox([0, 0.3, 0], [0.8, 0.6, 0.6], {
        label: 'Kiste mit verlorenen Gedanken', verb: 'Einen herausnehmen',
        onInteract: () => {
          const ideas = kit.services.content.ideas;
          if (!ideas.length) return kit.services.ui.toast('Die Kiste ist leer. Alle Gedanken wurden schon wiedergefunden!');
          kit.services.events.emit('openIdea', { idea: ideas[Math.floor(Math.random() * ideas.length)] });
        },
      });
    },
  }),

  // Hutständer mit vergessenen Hüten
  defineProp({
    name: 'hatRack',
    create(f, opts) {
      f.add(cyl(0.03, 0.04, 1.8, 8), 'woodDark', [0, 0.9, 0]);
      f.add(cyl(0.25, 0.28, 0.05, 12), 'woodDark', [0, 0.025, 0]);
      const hats = [['black', 'top'], ['pastelLemon', 'straw'], ['candy', 'beret'], ['porcelainBlue', 'wizard']];
      hats.forEach(([m, kind], i) => {
        const a = (i / 4) * Math.PI * 2, x = Math.cos(a) * 0.22, z = Math.sin(a) * 0.22, y = 1.55 + (i % 2) * 0.15;
        f.add(cyl(0.01, 0.01, 0.25, 4), 'woodDark', [x / 2, y - 0.05, z / 2], [Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]);
        if (kind === 'top') { f.add(cyl(0.14, 0.14, 0.01, 14), m, [x, y, z]); f.add(cyl(0.08, 0.08, 0.16, 12), m, [x, y + 0.08, z]); }
        else if (kind === 'straw') { f.add(cyl(0.18, 0.18, 0.01, 14), m, [x, y, z]); f.add(sphere(0.08, 10, 6), m, [x, y + 0.02, z], [0, 0, 0], [1, 0.7, 1]); }
        else if (kind === 'beret') f.add(sphere(0.12, 12, 6), m, [x, y, z], [0, 0, 0.3], [1, 0.3, 1]);
        else f.add(cone(0.11, 0.35, 12), m, [x, y + 0.15, z], [0, 0, 0.3]);
      });
      f.collider(0, 0, 0.4, 0.4);
    },
  }),
];
