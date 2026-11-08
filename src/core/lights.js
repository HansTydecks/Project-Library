import * as THREE from 'three';

// Licht-Pool: Es existiert immer eine feste Anzahl PointLights (keine Shader-Neukompilierung).
// Räume/Chunks melden nur "Lichtpunkte" an; der Pool weist seine Lichter den nächsten Punkten zu.
// So kann die Bibliothek unendlich wachsen, ohne dass die Performance einbricht.
const POOL = 12;
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

  // Bonus für bereits zugewiesene Punkte (Hysterese): verhindert, dass Lichter beim Laufen
  // ständig zwischen zwei fast gleich weit entfernten Punkten hin- und herspringen.
  const HOLD = 4;

  function score(spot, px, pz, room, held) {
    const p = spot.pos;
    const d = Math.hypot(p.x - px, p.z - pz);
    return d + (spot.room && spot.room !== room ? 7 : 0) - (spot.priority ?? 0) - (held.has(spot) ? HOLD : 0);
  }

  function update(dt, t, player, roomId) {
    acc += dt;
    if (acc > 0.25) {
      acc = 0;
      const held = new Set(pool.filter((p) => p.spot && p.level > 0).map((p) => p.spot));
      const arr = [...spots].filter((s) => s.enabled !== false);
      const sc = new Map(arr.map((s) => [s, score(s, player.x, player.z, roomId, held)]));
      arr.sort((a, b) => sc.get(a) - sc.get(b));
      desired = new Set(arr.slice(0, POOL));
    }
    const free = [...desired].filter((s) => !pool.some((p) => p.spot === s));
    for (const p of pool) {
      const want = p.spot && desired.has(p.spot);
      // langsames, weiches Ein-/Ausblenden statt Aufploppen
      if (want) p.level = Math.min(1, p.level + dt * 0.9);
      else p.level = Math.max(0, p.level - dt * 1.2);
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
        if (s.flicker) {
          // Große Lichter (viele Kerzen) flackern kaum, einzelne Kerzen etwas mehr.
          const amp = (s.intensity ?? 6) > 8 ? 0.35 : 1;
          f = 1 - amp * (0.07 + 0.05 * Math.sin(t * 7.3 + s.seed) + 0.025 * Math.sin(t * 17.1 + s.seed * 3));
        }
        const e = p.level * p.level * (3 - 2 * p.level);
        p.light.intensity = (s.intensity ?? 6) * f * e * GAIN;
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
