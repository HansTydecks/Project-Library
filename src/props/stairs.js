import { defineProp } from '../world/registry.js';
import { box, cyl, sphere } from '../world/geo.js';

// Wendeltreppe zum Hinauflaufen (Stufen < 0,3 m → kein Springen nötig).
// opts: height, steps, turns, radius, end (Winkel der obersten Stufe, lokal: 0 = +x, π = −x)
export default [
  defineProp({
    name: 'spiralStairs',
    create(f, opts) {
      const H = opts.height ?? 4.9, N = opts.steps ?? 22, turns = opts.turns ?? 1.4, R = opts.radius ?? 1.4;
      const end = opts.end ?? Math.PI, start = end - turns * Math.PI * 2;
      const rise = H / N;
      for (let i = 0; i < N; i++) {
        const k = i / (N - 1), a = start + k * (end - start), y = (i + 1) * rise;
        f.add(box(R - 0.1, 0.08, 0.5, 0), opts.material ?? 'woodLight', [Math.cos(a) * (R / 2 + 0.05), y - 0.04, Math.sin(a) * (R / 2 + 0.05)], [0, -a, 0]);
        // Geländerstab außen
        if (i % 2 === 0) f.add(cyl(0.015, 0.015, 0.9, 4), 'brass', [Math.cos(a) * (R - 0.05), y + 0.45, Math.sin(a) * (R - 0.05)]);
        // Begehbare Stufe (dünne Platte, darunter läuft man durch)
        f.collider(Math.cos(a) * R * 0.62, Math.sin(a) * R * 0.62, 0.62, 0.62, { top: y, bottom: Math.max(0, y - 0.12), shadow: false });
      }
      f.add(cyl(0.12, 0.12, H + 1.1, 10), opts.pole ?? 'brass', [0, (H + 1.1) / 2, 0]);
      f.add(sphere(0.16, 10, 8), 'gold', [0, H + 1.15, 0]);
      f.collider(0, 0, 0.3, 0.3);
    },
  }),
];
