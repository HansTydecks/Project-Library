import * as THREE from 'three';
import { roomBounds } from './world.js';
import { canvasTexture, tex } from './textures.js';
import { mat } from './materials.js';

// Außenhüllen: Für jeden Raum eine schlichte Box (nach außen gerichtet), die nur sichtbar ist, solange
// der Raum selbst ausgeblendet ist. So sieht man vom Dachgarten, Balkon oder Turm ganze Gebäude statt Leere.
// Von innen ist die Hülle unsichtbar (Rückseiten werden nicht gezeichnet). Fassade mit leuchtenden Fenstern.
let facadeMat = null;
function facade() {
  if (facadeMat) return facadeMat;
  const draw = (lit) => (g, w, h) => {
    g.fillStyle = lit ? '#000000' : '#bfb39c'; g.fillRect(0, 0, w, h);
    if (!lit) {
      g.strokeStyle = 'rgba(80,60,40,0.25)'; g.lineWidth = 2;
      for (let y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = (y / 16) % 2 ? 0 : 16; x < w; x += 32) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); } }
    }
    for (const x of [32, 160]) for (const y of [40, 150]) {
      if (!lit) { g.fillStyle = '#5a4a3a'; g.fillRect(x - 6, y - 6, 76, 92); }
      g.fillStyle = lit ? '#ffffff' : '#ffd890'; g.fillRect(x, y, 64, 80);
      g.fillStyle = lit ? '#000000' : '#5a4a3a'; g.fillRect(x + 30, y, 4, 80); g.fillRect(x, y + 30, 64, 4);
    }
  };
  const map = canvasTexture(256, 256, draw(false));
  const emissiveMap = canvasTexture(256, 256, draw(true));
  facadeMat = new THREE.MeshStandardMaterial({ map, emissiveMap, emissive: '#ffb35a', emissiveIntensity: 0.8, roughness: 0.9 });
  return facadeMat;
}

export function createShells({ scene, kits }) {
  const shells = new Map();
  for (const kit of kits) {
    const def = kit.room;
    if (!def || def.endless) continue;
    const b = roomBounds(def);
    const outdoor = def.outdoor && !def.levels;
    const inset = 0.12;
    const group = new THREE.Group();
    if (outdoor) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(b.w - inset * 2, 0.3, b.d - inset * 2), mat('grassBright'));
      slab.position.y = -0.36; group.add(slab);
    } else {
      const h = (def.height ?? 6) + 0.5, w = b.w - inset * 2, d = b.d - inset * 2;
      const geo = new THREE.BoxGeometry(w, h, d);
      // nur Seitenflächen behalten (Gruppen 0,1 = ±x, 4,5 = ±z) und UVs auf 8-m-Kacheln skalieren
      const idx = geo.index.array, keep = [];
      for (const gr of geo.groups) if (gr.materialIndex !== 2 && gr.materialIndex !== 3) for (let i = gr.start; i < gr.start + gr.count; i++) keep.push(idx[i]);
      geo.setIndex(keep); geo.clearGroups();
      const uv = geo.attributes.uv, n = geo.attributes.normal;
      for (let i = 0; i < uv.count; i++) { const along = Math.abs(n.getX(i)) > 0.5 ? d : w; uv.setXY(i, uv.getX(i) * along / 8, uv.getY(i) * h / 8); }
      const walls = new THREE.Mesh(geo, facade());
      walls.position.y = h / 2 - 0.02; group.add(walls);
      const roof = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat('roof'));
      roof.rotation.x = -Math.PI / 2; roof.position.y = h - 0.02; group.add(roof);
    }
    group.position.set(b.cx, kit.origin.y, b.cz);
    group.visible = false;
    group.traverse((o) => { o.matrixAutoUpdate = false; o.updateMatrix(); });
    group.matrixAutoUpdate = true;
    scene.add(group);
    shells.set(kit, group);
  }
  void tex;
  return {
    sync(list) { for (const k of list) { const s = shells.get(k); if (s) s.visible = !k.group.visible; } },
  };
}
