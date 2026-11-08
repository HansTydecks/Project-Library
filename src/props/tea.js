import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, lathe, torus } from '../world/geo.js';
import { mat } from '../world/materials.js';
import { flame } from './lights.js';
import { compactGroup } from '../world/kit.js';

// Alles für den Teesalon: Kannen, die von selbst gießen, Tassen, die kreisen, Torten mit Kerzen.

function teacupGroup(color = 'porcelain', s = 1) {
  const g = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.035, 0], [0.05, 0.01], [0.06, 0.07], [0.058, 0.072], [0.045, 0.012], [0, 0.01]].map(([x, y]) => new THREE.Vector2(x * s, y * s)), 14), mat(color));
  cup.position.y = 0.012 * s; g.add(cup);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.02 * s, 0.006 * s, 5, 10), mat(color));
  handle.position.set(0.062 * s, 0.05 * s, 0); g.add(handle);
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.085 * s, 0.06 * s, 0.012 * s, 16), mat(color));
  g.add(saucer);
  const tea = new THREE.Mesh(new THREE.CircleGeometry(0.052 * s, 14), mat('tea'));
  tea.rotation.x = -Math.PI / 2; tea.position.y = 0.068 * s; g.add(tea);
  return g;
}

function teapotGroup(color = 'porcelainBlue', s = 1) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16 * s, 18, 12), mat(color)); body.scale.y = 0.8; g.add(body);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('porcelain')); lid.position.y = 0.12 * s; g.add(lid);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.022 * s, 8, 6), mat('gold')); knob.position.y = 0.19 * s; g.add(knob);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.018 * s, 0.035 * s, 0.2 * s, 8), mat(color));
  spout.position.set(-0.19 * s, 0.04 * s, 0); spout.rotation.z = 0.9; g.add(spout);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07 * s, 0.015 * s, 6, 14, Math.PI * 1.3), mat(color));
  handle.position.set(0.17 * s, 0.02 * s, 0); handle.rotation.z = -Math.PI * 0.65; g.add(handle);
  return g;
}

export default [
  defineProp({
    name: 'teacup',
    create(f, opts) {
      const g = teacupGroup(opts.color ?? 'porcelain', opts.scale ?? 1);
      f.addGroup(g, [0, 0, 0], [0, opts.rot ?? (f.point(0, 0, 0).x * 7) % 6, 0]);
    },
  }),

  defineProp({
    name: 'teapot',
    create(f, opts) {
      const g = teapotGroup(opts.color ?? 'porcelainBlue', opts.scale ?? 1);
      f.addGroup(g, [0, 0.13 * (opts.scale ?? 1), 0], [0, opts.rot ?? 0, 0]);
    },
  }),

  // Kanne schwebt, kippt und gießt endlos in eine Tasse, die nie voll wird
  defineProp({
    name: 'pouringTeapot',
    create(f, opts, kit) {
      const y = opts.y ?? 1.8;
      const pot = compactGroup(teapotGroup(opts.color ?? 'porcelainBlue', 1.6));
      f.object(pot, [0.3, y, 0]);
      const cup = compactGroup(teacupGroup('porcelain', 1.6));
      f.object(cup, [-0.12, y - 0.85, 0]);
      const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.62, 6), mat('tea'));
      f.object(stream, [-0.13, y - 0.42, 0]);
      const hit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), mat('invisible'));
      hit.userData.hitbox = true;
      f.object(hit, [0.05, y - 0.4, 0]);
      const p0 = pot.position.clone(), c0 = cup.position.clone(), s0 = stream.position.clone();
      const seed = Math.random() * 6;
      kit.onUpdate((dt, t) => {
        const b = Math.sin(t * 1.2 + seed) * 0.05;
        pot.position.y = p0.y + b; pot.rotation.z = 0.55 + Math.sin(t * 0.8) * 0.05;
        cup.position.y = c0.y + b * 0.6; cup.rotation.y += dt * 0.4;
        stream.position.y = s0.y + b * 0.8;
        stream.scale.x = stream.scale.z = 1 + Math.sin(t * 13) * 0.15;
      });
      f.interactable(hit, {
        label: 'Gießende Teekanne', verb: 'Nachschenken', secret: opts.secret, secretName: 'Die ewige Teekanne',
        onInteract: () => { kit.services.audio.play('slurp'); kit.services.ui.toast('Die Kanne gießt seit 1847. Die Tasse ist trotzdem nie voll. Niemand weiß, wohin der Tee geht.'); },
      });
    },
  }),

  // Ein Ring aus Tassen, der um einen Punkt kreist (gerne um einen Kronleuchter)
  defineProp({
    name: 'orbitingCups',
    create(f, opts, kit) {
      const n = opts.count ?? 8, R = opts.radius ?? 1.6, y = opts.y ?? 3;
      const ring = new THREE.Group();
      const cols = ['porcelain', 'pastelPink', 'pastelMint', 'pastelSky', 'pastelLemon', 'pastelLilac'];
      for (let i = 0; i < n; i++) {
        const c = teacupGroup(cols[i % cols.length], 1.4);
        const a = (i / n) * Math.PI * 2;
        c.position.set(Math.cos(a) * R, Math.sin(a * 2) * 0.15, Math.sin(a) * R);
        c.userData.ph = a;
        compactGroup(c);
        ring.add(c);
      }
      f.object(ring, [0, y, 0]);
      kit.onUpdate((dt, t) => {
        ring.rotation.y += dt * 0.25;
        for (const c of ring.children) { c.position.y = Math.sin(t * 1.3 + c.userData.ph * 2) * 0.15; c.rotation.z = Math.sin(t + c.userData.ph) * 0.15; }
      });
    },
  }),

  // Dreistöckige Torte mit Kerzen
  defineProp({
    name: 'cake',
    create(f, opts, kit) {
      const tiers = [[0.28, 0.14, 'pastelPink'], [0.2, 0.12, 'cream'], [0.12, 0.1, 'pastelMint']];
      let y = 0;
      f.add(cyl(0.34, 0.3, 0.02, 20), 'porcelain', [0, 0.01, 0]);
      y = 0.02;
      for (const [r, h, m] of tiers) {
        f.add(cyl(r, r, h, 20), m, [0, y + h / 2, 0]);
        f.add(torus(r, 0.018, 5, 20), 'white', [0, y + h, 0], [Math.PI / 2, 0, 0]);
        y += h;
      }
      f.add(sphere(0.04, 10, 8), 'candy', [0, y + 0.03, 0]);
      const parts = [];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const x = Math.cos(a) * 0.2, z = Math.sin(a) * 0.2, cy = 0.02 + 0.14 + 0.12;
        f.add(cyl(0.008, 0.008, 0.08, 6), i % 2 ? 'pastelSky' : 'pastelLemon', [x, cy + 0.04, z]);
        parts.push(flame(f, [x, cy + 0.1, z], 0.7));
      }
      kit.onUpdate((dt, t) => { for (const p of parts) p.m.scale.y = 2 + Math.sin(t * 12 + p.m.position.x * 40) * 0.3; });
      f.hitbox([0, 0.25, 0], [0.7, 0.5, 0.7], {
        label: 'Ungeburtstagstorte', verb: 'Auspusten', secret: opts.secret, secretName: 'Die Torte für jeden Tag',
        onInteract: () => {
          for (const p of parts) { p.m.visible = false; p.g.visible = false; }
          kit.services.audio.play('chime');
          kit.services.ui.toast('Fffft! Alles Gute zu … heute! Die Kerzen zünden sich kichernd wieder an.');
          setTimeout(() => { for (const p of parts) { p.m.visible = true; p.g.visible = true; } }, 2500);
        },
      });
    },
  }),

  // Turm aus Zuckerwürfeln, der leicht wackelt
  defineProp({
    name: 'sugarTower',
    create(f, opts, kit) {
      const n = opts.count ?? 9;
      const g = new THREE.Group();
      for (let i = 0; i < n; i++) {
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), mat('white'));
        c.position.set((Math.random() - 0.5) * 0.012, 0.025 + i * 0.05, (Math.random() - 0.5) * 0.012);
        c.rotation.y = Math.random() * 0.4;
        g.add(c);
      }
      f.object(g);
      kit.onUpdate((dt, t) => { g.rotation.z = Math.sin(t * 1.7) * 0.03; g.rotation.x = Math.sin(t * 1.3) * 0.02; });
    },
  }),
];

export { teacupGroup, teapotGroup };
