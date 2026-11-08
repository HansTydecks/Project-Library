import * as THREE from 'three';
import { tex } from './textures.js';

// Konfetti-Regen rund um die Spielfigur (für Feiern und Ostereier).
export function createConfetti(scene) {
  const N = 500;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const palette = ['#ff8ab0', '#8ad8ff', '#ffd86a', '#a8ff9a', '#c8a8ff', '#ffb08a'].map((c) => new THREE.Color(c));
  for (let i = 0; i < N; i++) { const c = palette[i % palette.length]; col.set([c.r, c.g, c.b], i * 3); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.09, map: tex.glow(), vertexColors: true, transparent: true, depthWrite: false }));
  pts.visible = false; pts.frustumCulled = false;
  scene.add(pts);
  const vel = new Float32Array(N);
  let left = 0;
  return {
    burst(center, seconds = 10) {
      left = seconds; pts.visible = true;
      for (let i = 0; i < N; i++) {
        pos[i * 3] = center.x + (Math.random() - 0.5) * 12;
        pos[i * 3 + 1] = center.y + 2 + Math.random() * 5;
        pos[i * 3 + 2] = center.z + (Math.random() - 0.5) * 12;
        vel[i] = 0.4 + Math.random() * 0.8;
      }
    },
    update(dt, t, center) {
      if (left <= 0) return;
      left -= dt;
      for (let i = 0; i < N; i++) {
        pos[i * 3 + 1] -= vel[i] * dt;
        pos[i * 3] += Math.sin(t * 2 + i) * dt * 0.3;
        if (pos[i * 3 + 1] < center.y && left > 1.5) pos[i * 3 + 1] = center.y + 6;
      }
      geo.attributes.position.needsUpdate = true;
      pts.material.opacity = Math.min(1, left / 1.5);
      if (left <= 0) pts.visible = false;
    },
  };
}
