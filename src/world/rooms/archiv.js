import { defineRoom } from '../registry.js';
import { box } from '../geo.js';

// Das Archiv: Blog-Einträge, das digitale Archiv und das Register aller Werke.
export default defineRoom({
  id: 'archiv',
  name: 'Archiv & Blog',
  description: 'Blogeinträge, das digitale Archiv und der Zettelkatalog mit allen Werken.',
  keywords: ['blog', 'archiv', 'artikel', 'posts', 'texte', 'katalog', 'register', 'zeitung', 'geschichte'],
  cell: [1, 0],
  height: 5.5,
  spawn: { at: [0, 4], yaw: 0 },
  atmosphere: { fog: '#16120c', density: 0.032, ambient: 1.0, ambientColor: '#ffe0b0', moon: 0 },
  build(ctx) {
    ctx.floor('parquet');
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'wpOchre' });
    ctx.foundation();
    const { hw, hd } = ctx;

    ctx.place('rug', { at: [0, 0, 0], width: 5, depth: 6, material: 'carpetGreen' });
    ctx.wallShelves('north', { id: 'blog', unit: 2, height: 3.4 });
    ctx.wallShelves('south', { id: 'archiv', unit: 2, height: 3.4 });

    ctx.place('cardCatalog', { at: [0, 0, -2.0] });
    ctx.place('newspaperRack', { at: [-5.5, 0, 2.5], rot: Math.PI / 2 });
    ctx.place('gramophone', { at: [5.6, 0.62, 3.0], secret: 'grammophon' });
    ctx.place('sideTable', { at: [5.6, 0, 3.0] });
    ctx.place('safe', { at: [-6.6, 0, -5.0], rot: Math.PI / 2, secret: 'tresor' });
    ctx.place('filingBoxes', { at: [-6.7, 0, -3.8], rot: Math.PI / 2, count: 6 });
    ctx.place('filingBoxes', { at: [-6.7, 0, 5.8], rot: Math.PI / 2, count: 4 });
    ctx.place('table', { at: [1.5, 0, 3.0], width: 2.2, depth: 1.1 });
    ctx.place('chair', { at: [1.0, 0, 4.0], rot: Math.PI });
    ctx.place('bankerLamp', { at: [2.1, 0.81, 2.9] });
    ctx.place('bookPile', { at: [0.9, 0.81, 2.8], count: 5 });
    ctx.place('scroll', { at: [1.5, 0.81, 3.3] });
    ctx.place('candelabra', { at: [0, 1.62, -2.0], intensity: 6 });
    ctx.place('painting', { at: [hw - 0.46, 2.9, -3.5], rot: -Math.PI / 2, motif: 'cat', title: 'Ihre Hoheit, die Archivkatze', caption: 'Sie hat das Archiv 1802 gegründet. Sagt sie.', secret: 'katzenportraet', secretName: 'Das Porträt der Archivkatze' });
    ctx.place('chandelier', { at: [0, 0, 1], y: 4.2, chain: 1.2, radius: 0.8, candles: 8, intensity: 12 });
    ctx.sign('Archiv – Was war, bleibt.', [0, 4.2, hd - 0.46], Math.PI, { w: 3, h: 0.5 });
    ctx.place('dust', { area: [14, 4.5, 14] });
    ctx.add(box(0.8, 0.02, 0.6, 0), 'paper', [-1.2, 0.012, 1.2], [0, 0.4, 0]);
  },
});
