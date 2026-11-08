import { defineRoom } from '../registry.js';
import { box, cyl } from '../geo.js';

// Stube der Riesin: Alles ist riesig. Du bist winzig. Kletter einfach über die Bücher.
export default defineRoom({
  id: 'riesenstube',
  name: 'Stube der Riesin',
  description: 'Riesenbücher als Treppe, ein Bleistift wie ein Baumstamm und eine Teetasse zum Hineinspringen.',
  keywords: ['riese', 'riesin', 'groß', 'riesig', 'klettern', 'springen', 'bleistift', 'wolle', 'winzig'],
  cell: [2, 1],
  height: 9,
  spawn: { at: [-5, 0], yaw: -Math.PI / 2 },
  atmosphere: { fog: '#4a3a30', density: 0.01, ambient: 1.5, ambientColor: '#ffe8d4', moon: 0 },
  build(ctx) {
    const { hw, hd } = ctx;
    ctx.floor('parquet', { uv: 7 });
    ctx.ceiling('plaster', { uv: 6 });
    ctx.enclose({ inner: 'wpOchre', wainscot: false, trim: 'woodDark' });
    ctx.foundation();
    // Riesige Sockelleiste
    for (const side of ['east', 'south']) {
      const wf = ctx.wallFrame(side);
      for (const [a, c] of ctx.freeSpans(side, { margin: 0, doorClear: 0.15 })) wf.add(box(c - a, 0.7, 0.12, 2), 'white', [(a + c) / 2, 0.35, 0.46]);
    }

    // Buchtreppe an der Ostwand hinauf zum Regalbrett
    const stacks = [[5.6, 5.4, 1], [5.6, 3.6, 2], [5.6, 1.8, 3], [5.6, 0, 4], [5.6, -1.8, 5]];
    const cols = ['#c0405a', '#3a6ac0', '#3a9a6a', '#e0a030', '#9a5ad0', '#e06a3a'];
    let ci = 0;
    for (const [x, z, n] of stacks) {
      for (let i = 0; i < n; i++) ctx.place('giantBook', { at: [x + (i % 2 ? 0.1 : -0.1), i * 0.7, z], rot: (i % 3 - 1) * 0.06, width: 2.4, depth: 1.7, thick: 0.7, color: cols[ci++ % cols.length] });
    }
    // Riesenregalbrett oben (begehbar), mit Leseecke
    const sy = 4.2;
    ctx.add(box(4.6, 0.3, 4.4, 1), 'woodLight', [5.5, sy - 0.15, -5.6]);
    for (const [x, z] of [[3.4, -3.6], [3.4, -7.6]]) ctx.add(cyl(0.18, 0.18, sy - 0.3, 10), 'woodLight', [x, (sy - 0.3) / 2, z]);
    ctx.collider(5.5, -5.6, 4.6, 4.4, { top: sy, bottom: sy - 0.3 });
    ctx.collider(3.4, -3.6, 0.4, 0.4);
    ctx.collider(3.4, -7.6, 0.4, 0.4);
    ctx.place('armchair', { at: [6, sy, -6.4], rot: -Math.PI / 4, cushion: 'velvetGreen', quip: 'Ein ganz normaler Sessel. Für die Riesin ist das ein Puppenmöbel.' });
    ctx.place('floorLamp', { at: [7.2, sy, -4.2], intensity: 5 });
    ctx.place('goldenAcorn', { at: [4.4, sy, -6.8], label: 'Die Lesebrille-Putztuch-Eichel', secret: 'riesen-eichel', secretName: 'Die Eichel auf dem Riesenregal', quip: 'Oben angekommen! Von hier sieht die Riesin aus wie … nun ja, du siehst sie nicht. Sie ist gerade Tee holen.' });

    // Riesendinge auf dem Boden
    ctx.place('giantPencil', { at: [-3, 0, 3.0], rot: 0.25, length: 6, radius: 0.32 });
    ctx.place('giantGlasses', { at: [-3.4, 0, -1.4], rot: 0.5 });
    ctx.place('yarnBall', { at: [-5.4, 0, -5.4], radius: 0.95 });
    ctx.place('paintedEgg', { at: [-5.4, 1.86, -5.4], id: 'ei-wollknaeuel' });
    ctx.place('giantCup', { at: [0.6, 0, -4.4], radius: 1.3, height: 1.4 });
    ctx.place('rubberDuck', { at: [0.6, 0.78, -4.4], scale: 3.5, float: true, name: 'Badeente (riesig)', secret: 'riesen-ente', secretName: 'Die Ente im Riesentee', quip: 'QUAAAK. Selbst das Quietschen ist hier riesig.' });
    ctx.place('giantThimble', { at: [1.6, 0, 3.4] });
    ctx.place('giantButton', { at: [-0.8, 0, 0.8], radius: 0.9, material: 'pastelPink' });
    ctx.place('giantButton', { at: [-5.6, 0, 2], radius: 1.1, height: 0.35, material: 'pastelMint' });
    ctx.place('dustBunny', { at: [-1, 0, -2], area: 3, color: '#d8d0e0' });
    ctx.place('chandelier', { at: [0, 0, 0], y: 7.2, chain: 1.6, radius: 2, candles: 14, intensity: 22, distance: 18 });
    ctx.place('lantern', { at: [-5, 5.8, 5], hanging: true, chain: 2.6, intensity: 7, distance: 10 });
    ctx.place('standSign', { at: [-6.0, 0, 6.2], rot: Math.PI * 0.8, text: 'Bitte Füße abtreten. Alle. (Gilt auch für Riesinnen.)', size: 30, width: 1.2, signHeight: 0.4 });
    ctx.sign('Stube der Riesin – Klein ist, wer klein denkt', [0, 5.2, hd - 0.46], Math.PI, { w: 5, h: 0.65, size: 40 });
    ctx.place('dust', { area: [14, 7, 14] });
  },
});
