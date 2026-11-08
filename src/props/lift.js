import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, torus } from '../world/geo.js';
import { mat, hdr } from '../world/materials.js';
import { compactGroup } from '../world/kit.js';
import { M, S } from './friends.js';

// Bücherlift: Messingkäfig mit fahrender Plattform. Die Plattform ist eine echte Kollisionsbox, die mitfährt –
// wer draufsteht, wird über groundAt() mitgenommen. Bedienknopf auf der Plattform, Rufknöpfe auf jeder Etage.
export default [
  defineProp({
    name: 'bookLift',
    create(f, opts, kit) {
      const stops = opts.stops ?? [0, 12, 24];
      const S2 = opts.size ?? 3.2, top = stops[stops.length - 1];
      const svc = kit.services;
      // Schacht-Käfig (statisch)
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) f.add(cyl(0.06, 0.06, top + 3.5, 8), 'brass', [x * (S2 / 2 + 0.15), (top + 3.5) / 2, z * (S2 / 2 + 0.15)]);
      for (let y = 3; y < top + 3; y += 3) for (const [x, z, w, d] of [[0, -1, S2 + 0.3, 0.05], [0, 1, S2 + 0.3, 0.05], [-1, 0, 0.05, S2 + 0.3], [1, 0, 0.05, S2 + 0.3]]) {
        if (stops.some((s) => Math.abs(s - y) < 0.4)) continue;
        f.add(box(w, 0.05, d, 0), 'brass', [x * (S2 / 2 + 0.15), y, z * (S2 / 2 + 0.15)]);
      }
      f.add(box(S2 + 0.6, 0.3, S2 + 0.6, 1), 'stoneDark', [0, top + 3.6, 0]);
      f.add(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16), 'iron', [0, top + 3.3, 0], [Math.PI / 2, 0, 0]);
      // Plattform (fährt)
      const plat = new THREE.Group();
      plat.add(M(new THREE.BoxGeometry(S2, 0.18, S2), mat('woodLight'), [0, -0.09, 0]));
      plat.add(M(new THREE.BoxGeometry(S2 + 0.04, 0.04, S2 + 0.04), mat('brass'), [0, -0.19, 0]));
      for (const [x, z, w, d] of [[0, -1, S2, 0.04], [-1, 0, 0.04, S2], [1, 0, 0.04, S2]]) plat.add(M(new THREE.BoxGeometry(w, 0.04, d), mat('brass'), [x * (S2 / 2 - 0.02), 1.0, z * (S2 / 2 - 0.02)]));
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) plat.add(M(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 6), mat('brass'), [x * (S2 / 2 - 0.03), 0.5, z * (S2 / 2 - 0.03)]));
      // Bedienpult
      plat.add(M(new THREE.BoxGeometry(0.3, 1.1, 0.2), mat('woodDark'), [S2 / 2 - 0.3, 0.55, -S2 / 2 + 0.25]));
      const knob = M(S(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: hdr('#ff8ab0', 1.3) }), [S2 / 2 - 0.3, 1.15, -S2 / 2 + 0.33]); plat.add(knob);
      plat.add(M(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 14), mat('pastelSky'), [0, 0.01, 0]));
      const lampGlow = M(S(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: hdr('#ffe0a0', 1.3) }), [0, 2.2, 0]); plat.add(lampGlow);
      plat.add(M(new THREE.CylinderGeometry(0.005, 0.005, 1.0, 3), mat('iron'), [0, 2.75, 0]));
      compactGroup(plat, [knob]);
      f.object(plat, [0, stops[0], 0]);
      const w0 = f.world(0, 0, 0), half = S2 / 2;
      const box3 = { minX: w0.x - half, maxX: w0.x + half, minZ: w0.z - half, maxZ: w0.z + half, top: w0.y + stops[0], bottom: w0.y + stops[0] - 0.3 };
      svc.collision.add(box3, `lift:${kit.id}`);
      const base = f.point(0, 0, 0).y;
      let y = stops[0], target = stops[0], moving = false, rides = 0;
      const egg = 'liftfahrt';
      svc.secrets.register(egg, 'Mit dem Bücherlift bis ganz nach oben', kit.room?.id, 'egg');
      const goTo = (lvl) => {
        if (moving) return;
        target = stops[lvl]; if (Math.abs(target - y) < 0.01) return;
        moving = true; svc.audio.play('tick');
      };
      kit.onUpdate((dt, t) => {
        if (moving) {
          const d = target - y, step = Math.sign(d) * Math.min(Math.abs(d), dt * (0.6 + Math.min(2.4, Math.abs(d) * 0.8)));
          y += step;
          if (Math.abs(target - y) < 0.005) {
            y = target; moving = false; svc.audio.play('bell'); rides++;
            if (y === top) svc.secrets.found(egg);
          }
        }
        plat.position.y = base + y + Math.sin(t * 3) * 0.002;
        svc.collision.moveBox(box3, w0.y + y, w0.y + y - 0.3);
        knob.scale.setScalar(moving ? 1 + Math.sin(t * 10) * 0.2 : 1);
      });
      // Bedienknopf auf der Plattform: fährt zur nächsten Etage (oben angekommen wieder nach unten)
      const hit = M(new THREE.BoxGeometry(0.5, 0.5, 0.5), 'invisible', [S2 / 2 - 0.3, 1.1, -S2 / 2 + 0.3]); hit.userData.hitbox = true; plat.add(hit);
      const names = opts.names ?? stops.map((_, i) => (i === 0 ? 'Erdgeschoss' : `${i}. Etage`));
      const nextIdx = () => { const cur = stops.indexOf(target); return cur >= stops.length - 1 ? 0 : cur + 1; };
      f.interactable(hit, {
        label: 'Bücherlift', range: 3,
        verb: () => (moving ? 'Fährt …' : `Nach: ${names[nextIdx()]}`),
        onInteract: () => goTo(nextIdx()),
      });
      // Rufknöpfe an jeder Etage (vor dem Schacht, Südseite)
      stops.forEach((s, i) => {
        f.add(box(0.2, 1.2, 0.2, 0), 'woodDark', [half + 0.6, s + 0.6, half + 0.6]);
        f.add(sphere(0.06, 8, 6), 'candy', [half + 0.6, s + 1.25, half + 0.6]);
        f.hitbox([half + 0.6, s + 1.1, half + 0.6], [0.5, 0.6, 0.5], {
          label: `Rufknopf (${names[i]})`, verb: 'Lift rufen', range: 3,
          onInteract: () => { goTo(i); svc.ui.toast(moving ? 'Der Lift kommt! *Bing*' : 'Der Lift ist schon da.'); },
        });
      });
      void rides;
    },
  }),
];
