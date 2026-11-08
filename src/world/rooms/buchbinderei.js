import { defineRoom } from '../registry.js';

// Buchbinderei der Wichtel (1. Obergeschoss): Hier entstehen die Bücher der Bibliothek.
export default defineRoom({
  id: 'buchbinderei',
  name: 'Buchbinderei der Wichtel',
  description: 'Wichtel hämmern, leimen und schleppen, ein Fließband trägt frische Bücher vorbei.',
  keywords: ['buchbinderei', 'werkstatt', 'wichtel', 'bücher machen', 'fließband', 'leim', 'handwerk', 'obergeschoss'],
  cell: [-3, 0],
  level: 1,
  height: 6,
  spawn: { at: [0, -5], yaw: Math.PI },
  atmosphere: { fog: '#3a2c24', density: 0.011, ambient: 1.4, ambientColor: '#ffe8d0', moon: 0 },
  build(ctx) {
    const { hd } = ctx;
    ctx.floor('parquet');
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'wpOchre', wainscot: 'paneling' });
    ctx.foundation();

    ctx.place('conveyorBelt', { at: [-3.4, 0, 0.4], rot: Math.PI / 2, length: 5 });
    ctx.place('workerGnome', { at: [-2.1, 0, -0.8], rot: -Math.PI / 2, task: 'glue', hat: 'pastelMint', coat: 'velvet' });
    ctx.place('table', { at: [2.4, 0, -3.6], width: 2.6, depth: 1.2, material: 'woodLight' });
    ctx.place('workerGnome', { at: [2.4, 0, -2.6], rot: Math.PI, task: 'hammer', friend: 'kleister' });
    ctx.place('gluePot', { at: [1.6, 0.81, -3.7] });
    ctx.place('bookPile', { at: [3.2, 0.81, -3.6], count: 5 });
    ctx.place('workerGnome', { at: [0, 0, 0], task: 'carry', from: [-1.4, 0, 4.8], to: [4.8, 0, 4.8], hat: 'pastelLemon', coat: 'velvetGreen' });
    ctx.place('bookPress', { at: [5.4, 0, -0.6], rot: -Math.PI / 2 });
    ctx.place('parcelStack', { at: [6.4, 0, 5.6], count: 5 });
    ctx.place('parcelStack', { at: [5.4, 0, 6.4], count: 3 });
    ctx.wallShelves('south', { id: '_binderei', unit: 2, height: 3, maxUnits: 6 });
    ctx.wallShelves('west', { id: '_binderei2', unit: 2, height: 3, maxUnits: 5 });
    ctx.place('standSign', { at: [0.6, 0, 2.2], rot: 0.4, text: 'Bitte nicht in den Leim treten. Er ist sehr anhänglich.', size: 28, width: 1.2, signHeight: 0.42 });
    ctx.place('chandelier', { at: [0, 0, 0], y: 4.7, chain: 1, radius: 1, candles: 8, intensity: 12 });
    ctx.sign('Buchbinderei – Jedes Buch ein Unikat', [0, 4.4, hd - 0.46], Math.PI, { w: 4, h: 0.5, size: 40 });
    ctx.place('dust', { area: [14, 5, 14] });
  },
});
