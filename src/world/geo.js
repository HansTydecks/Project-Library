import * as THREE from 'three';

// Geometrie-Helfer: Boxen/Flächen mit welt-skalierten UVs (Texturen kacheln pro Meter).
export function box(w, h, d, uvScale = 1) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (uvScale) {
    const uv = g.attributes.uv;
    const faces = [
      [d, h], [d, h], // ±x
      [w, d], [w, d], // ±y
      [w, h], [w, h], // ±z
    ];
    for (let f = 0; f < 6; f++) {
      const [su, sv] = faces[f];
      for (let i = 0; i < 4; i++) {
        const idx = f * 4 + i;
        uv.setXY(idx, uv.getX(idx) * su / uvScale, uv.getY(idx) * sv / uvScale);
      }
    }
  }
  return g;
}

export function plane(w, h, uvScale = 1) {
  const g = new THREE.PlaneGeometry(w, h);
  if (uvScale) {
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / uvScale, uv.getY(i) * h / uvScale);
  }
  return g;
}

export const cyl = (rt, rb, h, seg = 12) => new THREE.CylinderGeometry(rt, rb, h, seg);
export const sphere = (r, ws = 12, hs = 8) => new THREE.SphereGeometry(r, ws, hs);
export const cone = (r, h, seg = 12) => new THREE.ConeGeometry(r, h, seg);
export const torus = (r, t, rs = 8, ts = 16, arc = Math.PI * 2) => new THREE.TorusGeometry(r, t, rs, ts, arc);
export const lathe = (pts, seg = 16) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
export const ico = (r, d = 0) => new THREE.IcosahedronGeometry(r, d);
