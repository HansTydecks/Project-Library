import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, torus, lathe } from '../world/geo.js';
import { mat, hdr } from '../world/materials.js';
import { tex } from '../world/textures.js';

// Sternwarte: Planetenmodell, Kometen unter der Decke, Mondlampe.
export default [
  defineProp({
    name: 'orrery',
    create(f, opts, kit) {
      const s = opts.scale ?? 1;
      f.add(lathe([[0, 0], [0.7, 0], [0.6, 0.1], [0.2, 0.2], [0.12, 1.0], [0.2, 1.1], [0, 1.15]].map(([x, y]) => [x * s, y * s]), 20), 'brass', [0, 0, 0]);
      const hub = new THREE.Group();
      f.object(hub, [0, 1.6 * s, 0]);
      const sun = new THREE.Mesh(new THREE.SphereGeometry(0.28 * s, 20, 14), mat('sun'));
      hub.add(sun);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.03 * s, 0.5 * s, 6), mat('brass')); rod.position.y = -0.35 * s; hub.add(rod);
      f.glow([0, 1.6 * s, 0], { color: '#ffc85a', size: 1.6 * s, opacity: 0.35 });
      f.light([0, 1.6 * s, 0], { color: '#ffd88a', intensity: 7, distance: 9, priority: 2, pool: false });
      const planets = [
        { r: 0.6, size: 0.07, m: 'planetRed', sp: 1.4 },
        { r: 0.95, size: 0.11, m: 'planetBlue', sp: 0.9, moon: true },
        { r: 1.35, size: 0.09, m: 'planetGreen', sp: 0.6 },
        { r: 1.8, size: 0.16, m: 'planetLilac', sp: 0.35, ring: true },
      ];
      const arms = [];
      for (const p of planets) {
        const arm = new THREE.Group();
        const bar = new THREE.Mesh(new THREE.BoxGeometry(p.r * s, 0.015 * s, 0.015 * s), mat('brass')); bar.position.x = p.r * s / 2; arm.add(bar);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008 * s, 0.008 * s, 0.15 * s, 4), mat('brass')); post.position.set(p.r * s, 0.07 * s, 0); arm.add(post);
        const pl = new THREE.Mesh(new THREE.SphereGeometry(p.size * s, 16, 12), mat(p.m)); pl.position.set(p.r * s, 0.15 * s + p.size * s, 0); arm.add(pl);
        if (p.ring) { const ring = new THREE.Mesh(new THREE.TorusGeometry(p.size * 1.7 * s, 0.012 * s, 4, 28), mat('pastelLemon')); ring.rotation.x = 1.2; pl.add(ring); }
        let moon = null;
        if (p.moon) { moon = new THREE.Mesh(new THREE.SphereGeometry(0.035 * s, 10, 8), mat('ivory')); pl.add(moon); }
        arm.rotation.y = Math.random() * 6;
        hub.add(arm);
        arms.push({ arm, pl, moon, sp: p.sp });
      }
      let boost = 1;
      kit.onUpdate((dt, t) => {
        for (const a of arms) {
          a.arm.rotation.y += dt * a.sp * 0.3 * boost;
          a.pl.rotation.y += dt;
          if (a.moon) a.moon.position.set(Math.cos(t * 2) * 0.2 * s, 0, Math.sin(t * 2) * 0.2 * s);
        }
        sun.scale.setScalar(1 + Math.sin(t * 2) * 0.03);
        boost += (1 - boost) * dt * 0.4;
      });
      f.collider(0, 0, 1.2 * s, 1.2 * s);
      f.hitbox([0, 1.3 * s, 0], [1.6 * s, 1.2 * s, 1.6 * s], {
        label: 'Planetenmaschine', verb: 'Anschubsen', secret: opts.secret, secretName: 'Das schnelle Sonnensystem',
        onInteract: () => { boost = 25; kit.services.audio.play('whoosh'); kit.services.ui.toast('Ein Jahr vergeht in drei Sekunden. Der lila Planet wird schwindelig.'); },
      });
    },
  }),

  // Komet, der unter der Sternendecke Bahnen zieht
  defineProp({
    name: 'comet',
    create(f, opts, kit) {
      const R = opts.radius ?? 5, y = opts.y ?? 7;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshBasicMaterial({ color: hdr('#d8f0ff', 2.5) }));
      f.object(head);
      const N = 24;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      const trail = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#a8d8ff', size: 0.35, map: tex.glow(), transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
      f.object(trail);
      const c0 = f.point(0, y, 0);
      const hist = [];
      kit.onUpdate((dt, t) => {
        const a = t * (opts.speed ?? 0.35);
        head.position.set(c0.x + Math.cos(a) * R, c0.y + Math.sin(a * 2) * 0.4, c0.z + Math.sin(a) * R * 0.6);
        hist.unshift(head.position.clone());
        if (hist.length > N) hist.pop();
        const arr = geo.attributes.position.array;
        for (let i = 0; i < N; i++) { const p = hist[Math.min(i, hist.length - 1)]; arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z; }
        geo.attributes.position.needsUpdate = true;
      });
    },
  }),

  // Leuchtender Mond als Stehlampe
  defineProp({
    name: 'moonLamp',
    create(f, opts, kit) {
      const h = opts.height ?? 1.6;
      f.add(cyl(0.2, 0.25, 0.05, 14), 'brass', [0, 0.025, 0]);
      f.add(cyl(0.015, 0.015, h - 0.35, 6), 'brass', [0, (h - 0.35) / 2, 0]);
      const moon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), new THREE.MeshBasicMaterial({ color: hdr('#fff4d8', 1.15) }));
      f.object(moon, [0, h, 0]);
      for (const [x, y, z, r] of [[0.1, 0.12, 0.24, 0.06], [-0.12, -0.05, 0.25, 0.08], [0.05, -0.15, 0.25, 0.04]]) {
        const c = new THREE.Mesh(new THREE.CircleGeometry(r, 12), new THREE.MeshBasicMaterial({ color: hdr('#e0d0b0', 1.1) }));
        c.position.set(x, y, z + 0.02); c.lookAt(c.position.clone().multiplyScalar(2)); moon.add(c);
      }
      f.glow([0, h, 0], { color: '#fff0c8', size: 2, opacity: 0.5 });
      f.light([0, h, 0.4], { color: '#e8ecff', intensity: 4, distance: 6, pool: false });
      f.collider(0, 0, 0.45, 0.45);
      kit.onUpdate((dt) => { moon.rotation.y += dt * 0.1; });
    },
  }),
];
