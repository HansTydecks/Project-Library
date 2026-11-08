import * as THREE from 'three';

// Licht-Pool: Es existiert immer eine feste Anzahl PointLights (keine Shader-Neukompilierung).
// Räume/Chunks melden nur "Lichtpunkte" an; der Pool weist seine Lichter den nächsten Punkten zu.
// So kann die Bibliothek unendlich wachsen, ohne dass die Performance einbricht.
const POOL = 10;
const GAIN = 1.6;

export function createLightPool(scene) {
  const spots = new Set();
  const pool = [];
  for (let i = 0; i < POOL; i++) {
    const l = new THREE.PointLight('#ffb36b', 0, 8, 1.6);
    l.position.set(0, -100, 0);
    scene.add(l);
    pool.push({ light: l, spot: null, level: 0 });
  }
  let acc = 0;
  let desired = new Set();

  function score(spot, px, pz, room) {
    const p = spot.pos;
    const d = Math.hypot(p.x - px, p.z - pz);
    return d + (spot.room && spot.room !== room ? 7 : 0) - (spot.priority ?? 0);
  }

  function update(dt, t, player, roomId) {
    acc += dt;
    if (acc > 0.25) {
      acc = 0;
      const arr = [...spots].filter((s) => s.enabled !== false);
      arr.sort((a, b) => score(a, player.x, player.z, roomId) - score(b, player.x, player.z, roomId));
      desired = new Set(arr.slice(0, POOL));
    }
    const free = [...desired].filter((s) => !pool.some((p) => p.spot === s));
    for (const p of pool) {
      const want = p.spot && desired.has(p.spot);
      if (want) p.level = Math.min(1, p.level + dt * 2);
      else p.level = Math.max(0, p.level - dt * 3);
      if (!want && p.level <= 0) {
        p.spot = free.shift() ?? null;
        if (p.spot) {
          p.light.color.set(p.spot.color ?? '#ffb36b');
          p.light.distance = p.spot.distance ?? 8;
        }
      }
      if (p.spot) {
        const s = p.spot;
        p.light.position.copy(s.pos);
        let f = 1;
        if (s.flicker) f = 0.82 + 0.12 * Math.sin(t * 9.1 + s.seed) + 0.06 * Math.sin(t * 23.7 + s.seed * 3);
        p.light.intensity = (s.intensity ?? 6) * f * p.level * GAIN;
        if (s.onUpdate) s.onUpdate(f);
      } else {
        p.light.intensity = 0;
      }
    }
  }

  return {
    add(spot) {
      spot.seed ??= Math.random() * 100;
      spot.pos = spot.pos instanceof THREE.Vector3 ? spot.pos : new THREE.Vector3(...spot.pos);
      spots.add(spot);
      return spot;
    },
    remove(spot) {
      spots.delete(spot);
      desired.delete(spot);
      for (const p of pool) if (p.spot === spot) { p.spot = null; p.level = 0; p.light.intensity = 0; }
    },
    update,
  };
}
