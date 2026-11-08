import { defineRoom } from '../registry.js';

// Pflegestation für Fabelwesen (1. OG Ostflügel).
export default defineRoom({
  id: 'fabelwesen',
  name: 'Pflegestation für Fabelwesen',
  description: 'Baby-Drachen fliegen Runden, ein Phönixküken schläft im Nest, Quallen leuchten, ein Einhornfohlen wiehert.',
  keywords: ['drachen', 'drache', 'fabelwesen', 'tiere', 'einhorn', 'phönix', 'quallen', 'pflege', 'zoo', 'obergeschoss'],
  cell: [2, 1],
  level: 1,
  height: 7,
  spawn: { at: [5, 0], yaw: Math.PI / 2 },
  atmosphere: { fog: '#2a3a40', density: 0.011, ambient: 1.4, ambientColor: '#e8fff0', moon: 0 },
  build(ctx) {
    const { hd } = ctx;
    ctx.floor('grassBright', { uv: 3 });
    ctx.ceiling('glassRoof', { roof: false, beams: 'iron' });
    ctx.enclose({ inner: 'wpMint', wainscot: 'paneling', trim: 'white' });
    ctx.foundation();

    ctx.place('babyDragons', { at: [0, 0, 0], y: 3.6, radius: 4, count: 3 });
    ctx.place('petDragon', { at: [2, 0, -2.6], rot: Math.PI });
    ctx.place('phoenixNest', { at: [-4.6, 0, -4.6] });
    ctx.place('jellyfish', { at: [0, 0, 0], y: 4.6, count: 7, area: [10, 1.5, 10] });
    ctx.place('unicornFoal', { at: [4.8, 0, 5.2], rot: Math.PI });
    ctx.place('friendBear', { at: [-2, 0, 2.2], rot: 0.6, friend: 'tatze' });
    ctx.place('flowers', { at: [5.6, 0, -5.6], width: 3, depth: 2.2, kinds: ['pastelPink', 'flowerYellow', 'pastelSky'] });
    ctx.place('tree', { at: [-6.4, 0, 6.4], lanterns: true });
    ctx.place('mushrooms', { at: [6, 0, 1] });
    ctx.place('standSign', { at: [0.6, 0, 4.6], rot: -0.2, text: 'Bitte nicht füttern! (Außer mit Funkenbeeren. Und Liebe.)', size: 28, width: 1.2, signHeight: 0.42 });
    ctx.place('lantern', { at: [0, 4.6, 0], hanging: true, chain: 2, color: '#d8ffe8', intensity: 7, distance: 12 });
    ctx.sign('Pflegestation für Fabelwesen – Leise sein, hier wird gewachsen', [0, 4.4, hd - 0.46], Math.PI, { w: 5, h: 0.55, size: 34 });
    ctx.place('dust', { area: [14, 6, 14], color: '#d8ffe8' });

    // ---- Mehr Details: Kinderbild von Funki, Futterregal, Kuschelecke, Glitzerkristalle
    const north = ctx.wallFrame('north', 0.42);
    north.place('portrait', { at: [-1.2, 2.6, 0], subject: 'drache', bg: '#3a6a5a' });
    north.place('wallShelfSmall', { at: [3.0, 0, 0], y: 1.7, width: 1.6, wood: 'woodLight' });
    north.place('wallShelfSmall', { at: [3.0, 0, 0], y: 2.45, width: 1.2, wood: 'woodLight' });
    ctx.wallFrame('west', 0.42).place('magicWindow', { at: [0, 0, 0], y: 2.4, mode: 'day', curtain: 'velvetGreen', quip: 'Draußen grast eine Herde Wolkenpferdchen. Eins winkt mit dem Schweif.' });
    ctx.place('fishBowl', { at: [-6.7, 0, -2.5], y: 0.85, name: 'Goldfischglas', quips: ['Die Goldfische spielen Drache: Einer pustet eine Luftblase. Sehr furchteinflößend.', 'Blubb! Die Fische freuen sich über Besuch, der nicht fliegt.', 'Ein Babydrache schaut neidisch zu. Er darf nicht ins Glas.'] });
    ctx.place('crystalCluster', { at: [-6.6, 0, -6.5], color: '#ffb070', scale: 1.2 });
    ctx.place('crystalCluster', { at: [6.6, 0, 6.8], color: '#b0f0ff', scale: 0.9 });
    ctx.place('cushionPile', { at: [-3.9, 0, 5.5], colors: ['velvetGreen', 'pastelMint', 'pastelLemon', 'pastelSky', 'pastelPink'] });
    ctx.place('yarnBall', { at: [1.8, 0, 3.0], radius: 0.32, material: 'pastelLemon' });
    ctx.place('hangingPlant', { at: [5.4, 0, -2.6], top: 7, y: 4.4, leaf: 'leaves' });
    ctx.place('hangingPlant', { at: [-5.6, 0, 2.0], top: 7, y: 4.6, leaf: 'leavesPink' });
    ctx.place('wateringCan', { at: [4.4, 0, -4.2], y: 1.2, color: 'pastelPink' });
    ctx.place('sideTable', { at: [6.6, 0, -3.5] });
    ctx.place('bookPile', { at: [6.55, 0, -3.45], y: 0.62, count: 3 });
    ctx.place('quillJar', { at: [6.75, 0.62, -3.65], scrolls: false });
  },
});
