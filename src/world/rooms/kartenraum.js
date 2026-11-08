import { defineRoom } from '../registry.js';

// Kartenraum: Eine Karte, die sich selbst zeichnet, und ein Kompass mit Fernweh.
export default defineRoom({
  id: 'kartenraum',
  name: 'Kartenraum',
  description: 'Eine Übersichtskarte der ganzen Bibliothek (mit dir darauf) und ein Kompass, der zu unentdeckten Räumen zeigt.',
  keywords: ['karte', 'übersicht', 'plan', 'kompass', 'weg', 'finden', 'orientierung', 'navigation', 'reise', 'ballon'],
  cell: [2, -2],
  height: 8,
  spawn: { at: [-5, 0], yaw: -Math.PI / 2 },
  atmosphere: { fog: '#3a3428', density: 0.01, ambient: 1.35, ambientColor: '#fff0d8', moon: 0 },
  build(ctx) {
    const { hd } = ctx;
    ctx.floor('parquet');
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'wpOchre', wainscot: 'paneling' });
    ctx.foundation();

    ctx.place('rug', { at: [0, 0, 0], width: 6, depth: 6.5, material: 'carpetGreen' });
    ctx.place('mapTable', { at: [0, 0, -0.4], width: 3.6, world: ctx.world_, secret: 'lebende-karte' });
    ctx.place('pedestal', { at: [3.6, 0, 4.2] });
    ctx.place('wanderCompass', { at: [3.6, 1.02, 4.2], world: ctx.world_, secret: 'fernweh-kompass' });
    ctx.place('balloonModel', { at: [-1, 0, 1], y: 5.6, scale: 1.2, drift: 1.5 });
    ctx.place('compassRose', { at: [-4.2, 0, 4.6], radius: 1.8 });
    ctx.place('friendOwl', { at: [-3.6, 0, 0.8], rot: 0.9, perch: 1.5, friend: 'puschel', gift: 'feder' });
    ctx.place('mapRolls', { at: [6.6, 0, -6.6] });
    ctx.place('mapRolls', { at: [-6.6, 0, -6.6] });
    ctx.place('globe', { at: [6, 0, 6] });
    ctx.wallShelves('north', { id: '_atlanten', unit: 2, height: 3.4, maxUnits: 6 });
    ctx.wallShelves('east', { id: '_reisen', unit: 2, height: 3.4, maxUnits: 6 });
    for (const [x, z, r] of [[-2.6, -3.6, 0], [2.6, -3.6, 0]]) ctx.place('chair', { at: [x, 0, z], rot: r });
    ctx.place('paperPlanes', { at: [0, 0, 0], y: 4.2, radius: 4, count: 4 });
    ctx.place('snail', { at: [2, 0, 6.8], length: 3, shell: 'pastelLemon', quip: 'Die Schnecke plant eine Weltreise. Abfahrt: nächstes Jahrzehnt.' });
    ctx.place('standSign', { at: [-2.4, 0, 3], rot: 0.5, text: 'Wer sich verläuft, ist einfach besonders gründlich.', size: 30, width: 1.1, signHeight: 0.38 });
    ctx.place('chandelier', { at: [0, 0, -0.4], y: 5.8, chain: 1.8, radius: 1.2, candles: 10, intensity: 14 });
    ctx.sign('Kartenraum – Du bist hier (ungefähr)', [0, 4.4, hd - 0.46], Math.PI, { w: 4, h: 0.55, size: 40 });
    ctx.place('dust', { area: [14, 6, 14] });
  },
});
