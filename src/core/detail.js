import * as THREE from 'three';

/**
 * Detail-Ausblendung: Kleine Einzelobjekte (Tassen, Glühwürmchen, Halos, Schilder …) werden ab einer
 * größenabhängigen Entfernung nicht mehr gezeichnet – vor allem beim Blick durch Türen in Nachbarräume
 * spart das viele Draw Calls. Gesteuert über Kamera-Layer, damit `visible` frei für Spiel-Logik bleibt.
 * Gemergte statische Geometrie ist groß und bleibt immer sichtbar.
 *   opts.maxRadius – nur Objekte bis zu diesem Radius (m)
 *   Sichtweite = near + radius * perMeter (mit 8 % Hysterese)
 */
export function createDetailCuller({ camera, kits, maxRadius = 0.8, near = 8, perMeter = 28, interval = 0.2 }) {
  const groups = [];
  const v = new THREE.Vector3(), s = new THREE.Vector3();
  let total = 0;
  for (const k of kits) {
    k.group.updateMatrixWorld(true);
    const items = [];
    k.group.traverse((o) => {
      if (!(o.isMesh || o.isSprite || o.isPoints) || o.isInstancedMesh || o.userData.keepDetail) return;
      let r, c;
      if (o.isSprite) { r = Math.max(o.scale.x, o.scale.y) * 0.5; c = new THREE.Vector3(); }
      else {
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
        const bs = o.geometry.boundingSphere;
        o.matrixWorld.decompose(v, new THREE.Quaternion(), s);
        r = bs.radius * Math.max(Math.abs(s.x), Math.abs(s.y), Math.abs(s.z)); c = bs.center.clone();
      }
      if (!(r > 0) || r > maxRadius) return;
      const d = near + r * perMeter;
      items.push({ o, c, d2: d * d, h2: (d * 1.08) ** 2, hidden: false });
    });
    total += items.length;
    groups.push({ k, items });
  }
  let acc = interval;
  const cam = new THREE.Vector3();
  const api = {
    enabled: true,
    get count() { return total; },
    get hidden() { let n = 0; for (const g of groups) for (const it of g.items) if (it.hidden) n++; return n; },
    update(dt) {
      acc += dt;
      if (acc < interval) return;
      acc = 0;
      camera.getWorldPosition(cam);
      for (const g of groups) {
        if (!g.k.group.visible) continue;
        for (const it of g.items) {
          let hide = false;
          if (api.enabled) {
            v.copy(it.c).applyMatrix4(it.o.matrixWorld);
            const q = v.distanceToSquared(cam);
            hide = it.hidden ? q > it.d2 : q > it.h2;
          }
          if (hide !== it.hidden) { it.hidden = hide; if (hide) it.o.layers.disable(0); else it.o.layers.enable(0); }
        }
      }
    },
  };
  return api;
}
