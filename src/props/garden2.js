import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, torus } from '../world/geo.js';
import { mat } from '../world/materials.js';
import { tex } from '../world/textures.js';
import { compactGroup } from '../world/kit.js';

// Wintergarten: Blumen mit Gesicht, Kakteen mit Hut, Schmetterlinge, eine Gießkanne mit Pflichtgefühl.
const PETALS = { yellow: 'flowerYellow', pink: 'pastelPink', blue: 'pastelSky', lilac: 'pastelLilac' };

export default [
  defineProp({
    name: 'singingFlower',
    create(f, opts, kit) {
      const H = opts.height ?? 1.4, s = opts.scale ?? 1;
      f.add(cyl(0.025 * s, 0.035 * s, H, 6), 'leaves', [0, H / 2, 0]);
      for (const sd of [-1, 1]) f.add(sphere(0.12 * s, 8, 6), 'leaves', [sd * 0.1 * s, H * 0.45, 0], [0, 0, sd * 0.6], [1, 0.25, 0.5]);
      f.add(cyl(0.2 * s, 0.16 * s, 0.3 * s, 10), 'terracotta', [0, 0.15 * s, 0]);
      const head = new THREE.Group();
      const face = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.16 * s, 0.05 * s, 16), mat('woodLight')); face.rotation.x = Math.PI / 2; head.add(face);
      const petal = PETALS[opts.color ?? 'yellow'];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.09 * s, 8, 6), mat(petal));
        p.scale.set(0.5, 1, 0.2); p.position.set(Math.cos(a) * 0.22 * s, Math.sin(a) * 0.22 * s, -0.005); p.rotation.z = a - Math.PI / 2; head.add(p);
      }
      for (const sx of [-1, 1]) {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.025 * s, 8, 6), mat('black')); e.position.set(sx * 0.055 * s, 0.04 * s, -0.03 * s); head.add(e);
        const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.025 * s, 10), mat('pastelPink')); cheek.position.set(sx * 0.09 * s, -0.01 * s, -0.027 * s); cheek.rotation.y = Math.PI; head.add(cheek);
      }
      const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.035 * s, 10, 8), mat('candy')); mouth.position.set(0, -0.045 * s, -0.028 * s); mouth.scale.set(1.2, 0.3, 0.3); head.add(mouth);
      compactGroup(head, [mouth]);
      f.object(head, [0, H + 0.05, 0]);
      const hp = f.world(0, H, 0);
      let sing = 0, yaw = 0;
      kit.onUpdate((dt, t, ctx) => {
        const want = Math.atan2(-(ctx.player.x - hp.x), -(ctx.player.z - hp.z)); // Gesicht (-z) zum Spieler
        let d = want - yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
        yaw += d * Math.min(1, dt * 1.5);
        head.rotation.set(Math.sin(t * 0.9 + hp.x) * 0.06, yaw, Math.sin(t * 1.3 + hp.z) * 0.08);
        sing = Math.max(0, sing - dt);
        mouth.scale.y = sing > 0 ? 0.6 + Math.abs(Math.sin(t * 10)) * 0.9 : 0.3;
        head.position.y = f.point(0, H + 0.05, 0).y + (sing > 0 ? Math.sin(t * 6) * 0.03 : 0);
      });
      f.collider(0, 0, 0.4, 0.4);
      f.hitbox([0, H, 0], [0.6, 0.6, 0.4], {
        label: opts.name ?? 'Singende Blume', verb: 'Um ein Lied bitten', secret: opts.secret, secretName: opts.secretName ?? 'Die Blume mit der schönsten Stimme',
        onInteract: () => { sing = 1.8; kit.services.audio.play('sing'); kit.services.ui.toast(opts.quip ?? '»La-la-laaa!« Die Blume singt dir ein Ständchen. Die Nachbarblume verdreht die Blütenblätter.'); },
      });
    },
  }),

  defineProp({
    name: 'hatCactus',
    create(f, opts, kit) {
      const H = opts.height ?? 0.6, hat = opts.hat ?? 'black';
      f.add(cyl(0.2, 0.16, 0.25, 10), 'terracotta', [0, 0.125, 0]);
      f.add(cyl(0.11, 0.12, H, 8), 'leaves', [0, 0.25 + H / 2, 0]);
      f.add(sphere(0.11, 8, 6), 'leaves', [0, 0.25 + H, 0]);
      f.add(cyl(0.05, 0.05, 0.2, 6), 'leaves', [0.16, 0.25 + H * 0.5, 0], [0, 0, -1.2]);
      f.add(cyl(0.05, 0.05, 0.18, 6), 'leaves', [0.22, 0.25 + H * 0.62, 0]);
      for (let i = 0; i < 5; i++) f.add(sphere(0.015, 4, 3), 'pastelPink', [Math.cos(i) * 0.1, 0.35 + i * H * 0.15, Math.sin(i) * 0.1]);
      const ty = 0.25 + H + 0.08;
      if (hat === 'sombrero') { f.add(cyl(0.22, 0.22, 0.015, 16), 'pastelLemon', [0, ty, 0]); f.add(cone(0.08, 0.12, 10), 'pastelLemon', [0, ty + 0.06, 0]); }
      else if (hat === 'party') f.add(cone(0.07, 0.2, 10), 'pastelLilac', [0, ty + 0.08, 0]);
      else { f.add(cyl(0.12, 0.12, 0.012, 14), 'black', [0, ty, 0]); f.add(cyl(0.07, 0.07, 0.12, 12), 'black', [0, ty + 0.06, 0]); }
      f.collider(0, 0, 0.4, 0.4);
      f.hitbox([0, 0.5, 0], [0.4, 1, 0.4], {
        label: opts.name ?? 'Kaktus mit Hut', verb: 'Umarmen (vorsichtig)', secret: opts.secret, secretName: opts.secretName,
        onInteract: () => kit.services.ui.toast(opts.quip ?? 'Der Kaktus lüftet den Hut. Er umarmt nicht – aus Rücksicht.'),
      });
    },
  }),

  defineProp({
    name: 'butterflies',
    create(f, opts, kit) {
      const n = opts.count ?? 8, area = opts.area ?? [8, 2, 8], y = opts.y ?? 1;
      const cols = ['pastelPink', 'pastelSky', 'pastelLemon', 'pastelLilac', 'orange'];
      const list = [];
      const c0 = f.point(0, y, 0);
      for (let i = 0; i < n; i++) {
        const g = new THREE.Group();
        const wm = mat(cols[i % cols.length]);
        const l = new THREE.Mesh(new THREE.CircleGeometry(0.06, 8), wm); l.geometry.translate(-0.05, 0, 0);
        const r = new THREE.Mesh(new THREE.CircleGeometry(0.06, 8), wm); r.geometry.translate(0.05, 0, 0);
        l.material = r.material = wm.clone(); l.material.side = THREE.DoubleSide;
        g.add(l, r);
        kit.group.add(g);
        list.push({ g, l, r, ph: i * 1.9, sx: 0.2 + (i % 3) * 0.07, ax: (i % 4 - 1.5) * area[0] * 0.2, az: (i % 3 - 1) * area[2] * 0.25 });
      }
      kit.onUpdate((dt, t) => {
        for (const o of list) {
          const a = t * o.sx + o.ph;
          o.g.position.set(c0.x + o.ax + Math.sin(a) * area[0] * 0.3, c0.y + Math.sin(a * 2.3) * area[1] * 0.3 + area[1] * 0.3, c0.z + o.az + Math.cos(a * 0.8) * area[2] * 0.3);
          o.g.rotation.set(-Math.PI / 2 + 0.3, a, 0);
          const flap = Math.sin(t * 14 + o.ph) * 1.1;
          o.l.rotation.y = flap; o.r.rotation.y = -flap;
        }
      });
    },
  }),

  // Gießkanne, die schwebt und eine Pflanze gießt
  defineProp({
    name: 'wateringCan',
    create(f, opts, kit) {
      const y = opts.y ?? 1.6;
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.28, 14), mat(opts.color ?? 'pastelMint')); g.add(body);
      const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.4, 8), mat(opts.color ?? 'pastelMint')); spout.position.set(-0.22, 0.06, 0); spout.rotation.z = 1; g.add(spout);
      const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.04, 10), mat('copper')); rose.position.set(-0.39, 0.17, 0); rose.rotation.z = 1; g.add(rose);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 6, 14, Math.PI), mat(opts.color ?? 'pastelMint')); handle.position.y = 0.14; g.add(handle);
      compactGroup(g);
      f.object(g, [0.3, y, 0]);
      const N = 30;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      const drops = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#a8e0ff', size: 0.05, map: tex.glow(), transparent: true, depthWrite: false }));
      kit.group.add(drops);
      const src = f.point(-0.1, y - 0.15, 0);
      const st = Array.from({ length: N }, (_, i) => ({ k: i / N, x: Math.sin(i * 7) * 0.05, z: Math.cos(i * 5) * 0.05 }));
      const y0 = g.position.y;
      kit.onUpdate((dt, t) => {
        g.position.y = y0 + Math.sin(t) * 0.04; g.rotation.z = -0.5 + Math.sin(t * 0.8) * 0.06;
        const a = geo.attributes.position.array;
        st.forEach((o, i) => { o.k = (o.k + dt * 0.9) % 1; a[i * 3] = src.x + o.x; a[i * 3 + 1] = src.y - o.k * (y - 0.6); a[i * 3 + 2] = src.z + o.z; });
        geo.attributes.position.needsUpdate = true;
      });
    },
  }),

  // Hängematte zwischen zwei Pfosten, darin ein schlafendes Buch
  defineProp({
    name: 'hammock',
    create(f, opts, kit) {
      const L = opts.length ?? 3;
      for (const s of [-1, 1]) { f.add(cyl(0.07, 0.08, 1.8, 8), 'woodLight', [s * L / 2, 0.9, 0]); f.collider(s * L / 2, 0, 0.2, 0.2); }
      const g = new THREE.Group();
      const net = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, L - 0.4, 14, 1, true, Math.PI * 0.75, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: '#f8d8a0', roughness: 1, side: THREE.DoubleSide }));
      net.rotation.z = Math.PI / 2; net.position.y = 0.45; g.add(net);
      for (const s of [-1, 1]) { const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 3), mat('cream')); rope.position.set(s * (L / 2 - 0.15), 0.6, 0); rope.rotation.z = s * 1.1; g.add(rope); }
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.22), new THREE.MeshStandardMaterial({ color: '#9a5ad0', roughness: 0.6 })); book.position.y = 0.06; g.add(book);
      f.object(g, [0, 0.95, 0]);
      const zz = f.glow([0.2, 1.4, 0], { color: '#ffffff', size: 0.2, opacity: 0.5 });
      const zp = zz.position.clone();
      kit.onUpdate((dt, t) => {
        g.rotation.x = Math.sin(t * 0.9) * 0.12;
        const k = (t * 0.3) % 1; zz.position.set(zp.x + k * 0.3, zp.y + k * 0.6, zp.z); zz.material.opacity = 0.5 * (1 - k);
      });
      f.hitbox([0, 1.1, 0], [L - 0.4, 0.5, 0.8], {
        label: 'Hängematte', verb: 'Leise sein', secret: opts.secret, secretName: 'Das Buch im Mittagsschlaf',
        onInteract: () => { kit.services.audio.play('snore'); kit.services.ui.toast('Ein Buch hält Mittagsschlaf. Es träumt von einer Fortsetzung.'); },
      });
    },
  }),
];
