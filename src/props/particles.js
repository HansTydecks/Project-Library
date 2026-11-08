import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { tex } from '../world/textures.js';
import { mat } from '../world/materials.js';

const SPARKLE = ['#ffe6a0', '#ffb8e0', '#a8f0ff', '#d8b8ff', '#fff4d8'];

function points(n, area, color, size, opacity, palette = null) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * area[0];
    pos[i * 3 + 1] = Math.random() * area[1];
    pos[i * 3 + 2] = (Math.random() - 0.5) * area[2];
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  if (palette) {
    const col = new Float32Array(n * 3), c = new THREE.Color();
    for (let i = 0; i < n; i++) { c.set(palette[i % palette.length]); col.set([c.r, c.g, c.b], i * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const m = new THREE.PointsMaterial({ color: palette ? '#ffffff' : color, vertexColors: !!palette, size, map: tex.glow(), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  return new THREE.Points(geo, m);
}

export default [
  // Staub, der im Licht tanzt
  defineProp({
    name: 'dust',
    create(f, opts, kit) {
      const area = opts.area ?? [10, 4, 10];
      const n = opts.count ?? 260;
      // Standard: bunte Funken (magischer Staub). opts.color → einfarbig.
      const p = points(n, area, opts.color ?? '#ffe0b0', opts.color ? 0.04 : 0.07, 0.75, opts.color ? null : SPARKLE);
      f.object(p, [0, opts.y ?? 0.3, 0]);
      const pos = p.geometry.attributes.position.array;
      const seeds = Array.from({ length: n }, () => Math.random() * 100);
      kit.onUpdate((dt, t) => {
        for (let i = 0; i < n; i++) {
          const s = seeds[i];
          pos[i * 3] += Math.sin(t * 0.2 + s) * dt * 0.05;
          pos[i * 3 + 1] += (Math.sin(t * 0.3 + s * 2) * 0.03 - 0.008) * dt;
          pos[i * 3 + 2] += Math.cos(t * 0.17 + s) * dt * 0.05;
          if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = area[1];
        }
        p.geometry.attributes.position.needsUpdate = true;
        p.material.opacity = 0.6 + 0.2 * Math.sin(t * 1.7);
      });
    },
  }),

  defineProp({
    name: 'fireflies',
    create(f, opts, kit) {
      const area = opts.area ?? [20, 3, 14];
      const n = opts.count ?? 70;
      const p = points(n, area, opts.color ?? '#c8ff7a', 0.14, 0.9);
      f.object(p, [0, 0.2, 0]);
      const base = Float32Array.from(p.geometry.attributes.position.array);
      const pos = p.geometry.attributes.position.array;
      kit.onUpdate((dt, t) => {
        for (let i = 0; i < n; i++) {
          const s = i * 1.37;
          pos[i * 3] = base[i * 3] + Math.sin(t * 0.3 + s) * 1.2;
          pos[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.5 + s * 2) * 0.5;
          pos[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.27 + s) * 1.2;
        }
        p.material.opacity = 0.7 + Math.sin(t * 2.3) * 0.2;
        p.geometry.attributes.position.needsUpdate = true;
      });
    },
  }),

  // Bücher, die unter der Decke kreisen und flattern
  defineProp({
    name: 'floatingBooks',
    create(f, opts, kit) {
      const n = opts.count ?? 9, R = opts.radius ?? 4, y = opts.y ?? 5;
      const books = [];
      const colors = ['#c0405a', '#3a9a6a', '#3a6ac0', '#e0a030', '#9a5ad0'];
      for (let i = 0; i < n; i++) {
        const g = new THREE.Group();
        const c = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.6, emissive: colors[i % colors.length], emissiveIntensity: 0.15 });
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.3), c); l.geometry.translate(0.11, 0, 0);
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.3), c); r.geometry.translate(-0.11, 0, 0);
        const pg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.28), mat('pages'));
        g.add(l, r, pg);
        f.object(g, [0, y, 0]);
        books.push({ g, l, r, a: (i / n) * Math.PI * 2, s: 0.15 + Math.random() * 0.1, h: Math.random() * 1.2, ph: Math.random() * 6 });
      }
      const c0 = f.point(0, y, 0);
      kit.onUpdate((dt, t) => {
        for (const b of books) {
          b.a += dt * b.s;
          b.g.position.set(c0.x + Math.cos(b.a) * R, c0.y + b.h + Math.sin(t + b.ph) * 0.3, c0.z + Math.sin(b.a) * R);
          b.g.rotation.y = -b.a;
          const flap = 0.35 + Math.sin(t * 5 + b.ph) * 0.3;
          b.l.rotation.z = flap; b.r.rotation.z = -flap;
        }
      });
    },
  }),
];
