import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, lathe, torus } from '../world/geo.js';
import { mat } from '../world/materials.js';
import { tex } from '../world/textures.js';

// Trankküche: blubbernde Kessel, leuchtende Fläschchen, ein Frosch mit Krone.
const POTIONS = [
  { m: 'potionGreen', c: '#5aff9a', name: 'Trank der plötzlichen Ideen', fx: 'Es riecht nach frisch gemähtem Einfall.' },
  { m: 'potionPink', c: '#ff7ad8', name: 'Elixier des Ach-wie-schön', fx: 'Kurz sieht alles aus wie ein Bilderbuch. Ach, Moment – tut es ja.' },
  { m: 'potionBlue', c: '#6ac8ff', name: 'Sud der ruhigen Montage', fx: 'Ein tiefes, zufriedenes Seufzen steigt auf.' },
  { m: 'potionGold', c: '#ffd86a', name: 'Goldbrühe des Fertigwerdens', fx: 'Selten. Sehr selten. Genieße den Anblick.' },
];

function glowPoints(n, color, size) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const m = new THREE.PointsMaterial({ color, size, map: tex.glow(), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
  return new THREE.Points(geo, m);
}

export default [
  defineProp({
    name: 'cauldron',
    create(f, opts, kit) {
      const R = opts.radius ?? 0.7;
      f.add(lathe([[0, 0.1], [R * 0.6, 0.05], [R * 0.95, 0.3], [R, 0.6], [R * 0.9, 0.9], [R * 0.95, 0.95], [R * 0.85, 0.95]], 20), 'iron', [0, 0.15, 0]);
      for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; f.add(cyl(0.05, 0.04, 0.3, 6), 'iron', [Math.cos(a) * R * 0.55, 0.15, Math.sin(a) * R * 0.55]); }
      // Feuer darunter
      for (let i = 0; i < 5; i++) { const a = i * 1.3; f.add(cyl(0.04, 0.05, 0.6, 6), 'woodDark', [Math.cos(a) * 0.15, 0.05, Math.sin(a) * 0.15], [Math.PI / 2, a, 0]); }
      const fire = f.glow([0, 0.12, 0], { color: '#ff8a3a', size: 1.2, opacity: 0.8 });
      let k = 0;
      const surf = new THREE.Mesh(new THREE.CircleGeometry(R * 0.86, 24), mat(POTIONS[0].m));
      f.object(surf, [0, 0.15 + 0.82, 0], [-Math.PI / 2, 0, 0]);
      const halo = f.glow([0, 1.25, 0], { color: POTIONS[0].c, size: 2.4, opacity: 0.45 });
      const bub = glowPoints(40, POTIONS[0].c, 0.12);
      f.object(bub, [0, 0, 0]);
      const c = f.point(0, 0.97, 0);
      const arr = bub.geometry.attributes.position.array;
      const st = Array.from({ length: 40 }, () => ({ a: Math.random() * 6, r: Math.random() * R * 0.7, y: Math.random() * 1.6, s: 0.3 + Math.random() * 0.5 }));
      const spot = f.light([0, 1.6, 0], { color: POTIONS[0].c, intensity: 6, distance: 7, flicker: true, pool: false });
      let puff = 0;
      kit.onUpdate((dt, t) => {
        for (let i = 0; i < st.length; i++) {
          const o = st[i];
          o.y += dt * o.s * (1 + puff * 4);
          if (o.y > 1.6) { o.y = 0; o.a = Math.random() * 6; o.r = Math.random() * R * 0.7; }
          arr[i * 3] = c.x + Math.cos(o.a + t * 0.5) * o.r * (1 + o.y * (0.3 + puff));
          arr[i * 3 + 1] = c.y + o.y;
          arr[i * 3 + 2] = c.z + Math.sin(o.a + t * 0.5) * o.r * (1 + o.y * (0.3 + puff));
        }
        bub.geometry.attributes.position.needsUpdate = true;
        surf.position.y = c.y + Math.sin(t * 3) * 0.01;
        fire.material.opacity = 0.6 + Math.sin(t * 11) * 0.15;
        puff = Math.max(0, puff - dt * 0.7);
        halo.scale.setScalar(2.4 + puff * 2);
      });
      f.collider(0, 0, R * 2, R * 2);
      f.hitbox([0, 0.9, 0], [R * 2, 1.2, R * 2], {
        label: 'Blubbernder Kessel', verb: 'Umrühren', secret: opts.secret, secretName: 'Der launische Kessel',
        onInteract: () => {
          k = (k + 1) % POTIONS.length;
          const p = POTIONS[k];
          surf.material = mat(p.m);
          bub.material.color.set(p.c); halo.material.color.set(p.c);
          spot.color = p.c;
          puff = 1.5;
          kit.services.audio.play('bubble');
          kit.services.ui.toast(`✦ ${p.name}! ${p.fx}`);
        },
      });
    },
  }),

  // Wandregal voller leuchtender Fläschchen (lokal +z zeigt in den Raum)
  defineProp({
    name: 'potionShelf',
    create(f, opts, kit) {
      const W = opts.width ?? 2.4, levels = opts.levels ?? 4, r = kit.services.rng(opts.seed ?? `potions${W}`).next;
      for (let l = 0; l < levels; l++) {
        const y = 0.5 + l * 0.55;
        f.add(box(W, 0.04, 0.3, 1), 'woodDark', [0, y, 0.15]);
        for (const s of [-1, 1]) f.add(box(0.03, 0.12, 0.03, 0), 'brass', [s * (W / 2 - 0.1), y - 0.07, 0.25]);
        let x = -W / 2 + 0.15;
        while (x < W / 2 - 0.15) {
          const p = POTIONS[Math.floor(r() * POTIONS.length)];
          const kind = r();
          const h = 0.12 + r() * 0.2;
          if (kind < 0.4) {
            f.add(sphere(0.07, 10, 8), p.m, [x, y + 0.09, 0.15]);
            f.add(cyl(0.02, 0.02, 0.08, 6), 'glass', [x, y + 0.19, 0.15]);
            f.add(cyl(0.023, 0.023, 0.03, 6), 'cork', [x, y + 0.24, 0.15]);
            x += 0.18;
          } else if (kind < 0.8) {
            f.add(cyl(0.045, 0.05, h, 8), p.m, [x, y + 0.02 + h / 2, 0.15]);
            f.add(cone(0.045, 0.06, 8), 'glass', [x, y + 0.05 + h, 0.15]);
            f.add(cyl(0.018, 0.018, 0.03, 6), 'cork', [x, y + 0.09 + h, 0.15]);
            x += 0.13;
          } else {
            f.add(box(0.1, h, 0.08, 0), p.m, [x, y + 0.02 + h / 2, 0.15]);
            f.add(box(0.06, 0.02, 0.05, 0), 'gold', [x, y + 0.03 + h, 0.15]);
            x += 0.15;
          }
          x += r() * 0.05;
        }
        f.glow([r() * W - W / 2, y + 0.15, 0.25], { color: POTIONS[l % POTIONS.length].c, size: 0.8, opacity: 0.4 });
      }
      f.collider(0, 0.15, W, 0.3);
    },
  }),

  // Getrocknete Kräuter an einer Stange
  defineProp({
    name: 'hangingHerbs',
    create(f, opts, kit) {
      const W = opts.width ?? 2.4, y = opts.y ?? 3.2;
      f.add(cyl(0.025, 0.025, W, 6), 'woodDark', [0, y, 0], [0, 0, Math.PI / 2]);
      const cols = ['leaves', 'leavesAutumn', 'leavesPink', 'hedge'];
      const bundles = [];
      for (let x = -W / 2 + 0.2; x < W / 2 - 0.1; x += 0.3) {
        const g = new THREE.Group();
        const str = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 3), mat('cream')); str.position.y = -0.1; g.add(str);
        const herb = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.35, 6), mat(cols[Math.floor(Math.abs(x * 7)) % cols.length])); herb.position.y = -0.36; g.add(herb);
        f.object(g, [x, y, 0]);
        bundles.push(g);
      }
      kit.onUpdate((dt, t) => { bundles.forEach((g, i) => { g.rotation.z = Math.sin(t * 0.9 + i) * 0.05; }); });
    },
  }),

  // Frosch mit Krone im Glas
  defineProp({
    name: 'frogJar',
    create(f, opts, kit) {
      f.add(cyl(0.2, 0.2, 0.03, 16), 'woodDark', [0, 0.015, 0]);
      f.add(cyl(0.18, 0.18, 0.45, 16), 'glass', [0, 0.255, 0]);
      f.add(cyl(0.19, 0.19, 0.04, 16), 'brass', [0, 0.5, 0]);
      const g = new THREE.Group();
      const green = new THREE.MeshStandardMaterial({ color: '#5ac85a', roughness: 0.4 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), green); body.scale.set(1.1, 0.75, 1); g.add(body);
      for (const s of [-1, 1]) {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), green); e.position.set(s * 0.045, 0.07, -0.04); g.add(e);
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 5), mat('black')); p.position.set(s * 0.045, 0.08, -0.065); g.add(p);
      }
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.04, 6, 1, true), mat('gold')); crown.position.y = 0.1; g.add(crown);
      f.object(g, [0, 0.1, 0]);
      kit.onUpdate((dt, t) => { body.scale.y = 0.75 + Math.max(0, Math.sin(t * 2)) * 0.05; g.rotation.y = Math.sin(t * 0.4) * 0.5; });
      f.hitbox([0, 0.25, 0], [0.4, 0.5, 0.4], {
        label: 'Froschkönig (im Ruhestand)', verb: 'Ansprechen', secret: opts.secret, secretName: 'Der Frosch, der nicht geküsst werden will',
        onInteract: () => { kit.services.audio.play('bubble'); kit.services.ui.toast('»Küssen? Nein danke. Ich habe ein Glas, eine Krone und WLAN. Mir geht es prächtig.«'); },
      });
    },
  }),

  // Besen, der von selbst fegt (und dabei Funken aufwirbelt)
  defineProp({
    name: 'magicBroom',
    create(f, opts, kit) {
      const R = opts.radius ?? 1.5;
      const g = new THREE.Group();
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.3, 6), mat('woodLight')); stick.position.y = 0.85; g.add(stick);
      const bristles = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 10), mat('pastelLemon')); bristles.position.y = 0.2; g.add(bristles);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 10), mat('candy')); band.position.y = 0.4; g.add(band);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 0.4), mat('invisible')); hit.userData.hitbox = true; hit.position.y = 0.75; g.add(hit);
      f.object(g);
      const c0 = f.point(0, 0, 0);
      const puff = f.glow([0, 0.05, 0], { color: '#fff0c0', size: 0.8, opacity: 0.4 });
      let a = 0, shy = 0;
      kit.onUpdate((dt, t) => {
        a += dt * (shy > 0 ? 2.2 : 0.6); shy = Math.max(0, shy - dt);
        const x = c0.x + Math.cos(a) * R, z = c0.z + Math.sin(a * 2) * R * 0.5;
        g.position.set(x, c0.y + Math.abs(Math.sin(t * 6)) * 0.04, z);
        g.rotation.z = Math.sin(t * 6) * 0.35; g.rotation.y = -a;
        puff.position.set(x, c0.y + 0.05, z); puff.material.opacity = 0.25 + Math.abs(Math.sin(t * 6)) * 0.3;
      });
      f.interactable(hit, {
        label: 'Fleißiger Besen', verb: 'Loben', secret: opts.secret, secretName: 'Der Besen mit Arbeitsmoral',
        onInteract: () => { shy = 3; kit.services.audio.play('whoosh'); kit.services.ui.toast('Der Besen wird rot (innerlich) und fegt vor Verlegenheit doppelt so schnell.'); },
      });
    },
  }),

  // Pult mit aufgeschlagenem Rezeptbuch
  defineProp({
    name: 'recipeLectern',
    create(f, opts, kit) {
      f.add(cyl(0.05, 0.08, 1.0, 8), 'woodDark', [0, 0.5, 0]);
      f.add(box(0.5, 0.04, 0.4, 0), 'woodDark', [0, 0.02, 0]);
      f.add(box(0.6, 0.03, 0.42, 0), 'woodRed', [0, 1.05, 0], [-0.4, 0, 0]);
      f.add(box(0.56, 0.03, 0.38, 0), 'pages', [0, 1.075, 0.01], [-0.4, 0, 0]);
      f.glow([0, 1.15, 0.05], { color: '#fff0a0', size: 0.7, opacity: 0.4 });
      f.collider(0, 0, 0.5, 0.45);
      f.hitbox([0, 1.05, 0], [0.7, 0.3, 0.5], {
        label: 'Rezeptbuch', verb: 'Lesen',
        onInteract: () => kit.services.ui.note('Rezept: Inspiration', '3 Löffel Neugier\n1 Prise Übermut\nEin Spaziergang (ungefiltert)\nEine Tasse Tee, vergessen und kalt geworden\n\nAlles verrühren, bis es »Ach, so geht das!« macht.\n\nAchtung: Nicht nach Mitternacht kochen. Dann wird es ein neues Projekt.'),
      });
    },
  }),
];
