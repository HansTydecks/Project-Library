import { defineRoom } from '../registry.js';
import { box } from '../geo.js';

// Trankküche: Hier werden Ideen eingekocht. Manchmal kocht etwas über.
export default defineRoom({
  id: 'trankkueche',
  name: 'Trankküche',
  description: 'Ein blubbernder Kessel, Regale voller leuchtender Tränke und ein Frosch mit Krone.',
  keywords: ['trank', 'tränke', 'küche', 'alchemie', 'kessel', 'zaubertrank', 'labor', 'experiment', 'frosch', 'rezept'],
  cell: [-2, -1],
  height: 5.5,
  spawn: { at: [5, 0], yaw: Math.PI / 2 },
  atmosphere: { fog: '#243e36', density: 0.014, ambient: 1.35, ambientColor: '#d8ffe8', moon: 0 },
  build(ctx) {
    const { hw, hd } = ctx;
    ctx.floor('stoneLight', { uv: 1.5 });
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'wpMint', wainscot: 'paneling' });
    ctx.foundation();

    ctx.place('cauldron', { at: [0, 0, 0], radius: 0.8, secret: 'kessel' });
    ctx.place('rug', { at: [0, 0, 0], width: 4, depth: 4, material: 'carpetGreen' });
    // Tränke an den Wänden
    const west = ctx.wallFrame('west', 0.42);
    // (Mitte der Westwand frei: Tür zum Wendelturm)
    for (const u of [-5.6, -3.0, 3.0, 5.6]) west.place('potionShelf', { at: [u, 0, 0], width: 2.4, seed: `w${u}` });
    const north = ctx.wallFrame('north', 0.42);
    for (const u of [-5, 5]) north.place('potionShelf', { at: [u, 0, 0], width: 2.6, seed: `n${u}` });
    west.place('paintedEgg', { at: [5.75, 2.17, 0.15], id: 'ei-traenke' });
    // Kräuter unter der Decke
    ctx.place('hangingHerbs', { at: [0, 0, -3], width: 5, y: 4.3 });
    ctx.place('hangingHerbs', { at: [0, 0, 3], width: 5, y: 4.3 });
    // Arbeitstisch mit Frosch & Mörser
    ctx.place('table', { at: [4.5, 0, -4.8], width: 2.6, depth: 1.2 });
    ctx.place('frogJar', { at: [4.0, 0.81, -4.8], secret: 'froschkoenig' });
    ctx.place('bookPile', { at: [5.3, 0.81, -4.7], count: 4 });
    ctx.place('candle', { at: [5.0, 0.81, -5.2], intensity: 3 });
    ctx.add(box(0.2, 0.12, 0.2, 0), 'stoneDark', [4.9, 0.87, -4.4]);
    ctx.place('recipeLectern', { at: [-3.2, 0, 3.4], rot: 0.6 });
    ctx.place('bubbles', { at: [0, 0, 0], y: 1.1, area: [1.2, 3, 1.2], count: 12 });
    ctx.place('magicBroom', { at: [3, 0, 3], radius: 1.6 });
    ctx.place('standSign', { at: [-1.6, 0, -2.2], rot: 0.5, text: 'Nicht kosten! (Außer den grünen. Die sind lecker.)', size: 30, width: 1.1, signHeight: 0.4 });
    ctx.place('lantern', { at: [-4.5, 3.6, -4.5], hanging: true, chain: 1, color: '#9affc8', intensity: 6, distance: 8 });
    ctx.place('lantern', { at: [4.5, 3.6, 4.5], hanging: true, chain: 1, color: '#ff9ad8', intensity: 6, distance: 8 });
    ctx.place('pottedPlant', { at: [6.6, 0, 6.6], scale: 1.2 });
    ctx.place('rubberDuck', { at: [-6.6, 0, 6.6], crown: true, name: 'Die Herzogin', secret: 'herzogin', secretName: 'Die Herzogin der Enten', quip: 'Eine Ente mit Krone. Sie ist hier die Chefin. Der Frosch bestreitet das.' });
    ctx.sign('Trankküche – Hier wird gekocht, was noch keinen Namen hat', [0, 4.6, hd - 0.46], Math.PI, { w: 4.6, h: 0.5, size: 36 });
    ctx.place('dust', { area: [14, 4.5, 14] });
  },
});
