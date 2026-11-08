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
  atmosphere: { fog: '#3a2a22', density: 0.014, ambient: 1.35, ambientColor: '#ffe0b0', moon: 0 },
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
    ctx.sign('Archiv – Was war, bleibt.', [0, 4.65, hd - 0.46], Math.PI, { w: 3, h: 0.5 });
    ctx.place('dustBunny', { at: [-4.5, 0, 0.5], area: 3 });
    ctx.place('dustBunny', { at: [4.5, 0, -4.5], area: 2, color: '#c8c0b0' });
    ctx.place('standSign', { at: [-2.4, 0, -5.4], rot: 0.4, text: 'Hier wird nichts weggeworfen. Auch nicht dieses Schild.', size: 30, width: 1.1, signHeight: 0.38 });
    ctx.place('snail', { at: [3, 0, 6.6], length: 3, shell: 'pastelSky', quip: 'Die Archivschnecke sortiert alphabetisch. Sie ist bei »A«.' });
    ctx.wallFrame('east', 0.42).place('cuckooClock', { at: [5.4, 0, 0], y: 3.0, offset: 4, bird: 'pastelMint' });
    ctx.place('butterflies', { at: [0, 0, 0], area: [6, 1.5, 6], count: 3, y: 2.2 });
    ctx.place('paintedEgg', { at: [1.8, 0, 3.1], id: 'ei-archivtisch' });
    ctx.place('antTrail', { at: [-2, 0, -7.2], length: 9, count: 30 });
    ctx.place('dust', { area: [14, 4.5, 14] });
    ctx.add(box(0.8, 0.02, 0.6, 0), 'paper', [-1.2, 0.012, 1.2], [0, 0.4, 0]);

    // Kleine Details: Zeitungs-Wimpel, Porträt, Nachtfenster, Krümelarchiv der Mäuse
    ctx.wallFrame('north', 1.0).place('bunting', { at: [0, 0, 0], length: 14.2, y: 5.1, sag: 0.35, colors: ['paper', 'pastelLemon', 'cream', 'pastelSky'] });
    const west = ctx.wallFrame('west', 0.42);
    west.place('portrait', { at: [4.4, 2.75, 0], subject: 'eule', width: 0.8, height: 1.0, bg: '#6a5a3a', caption: 'Professor Puschel hat das Archiv einmal komplett gelesen. Rückwärts. Er sagt, das Ende sei besser als der Anfang.' });
    west.place('magicWindow', { at: [-4.4, 0, 0], y: 2.65, width: 1.1, height: 1.5, mode: 'night', curtain: 'velvetGreen', frame: 'woodLight', quip: 'Draußen ist Nacht. Im Archiv ist es immer ein bisschen Nacht – da schlafen die alten Geschichten besser.' });
    west.place('wallShelfSmall', { at: [-6.5, 0, 0], y: 1.65, width: 0.7, wood: 'woodDark' });
    ctx.wallFrame('east', 0.5).place('mouseDoor', { at: [-5.8, 0, 0], sign: 'Krümelarchiv', color: 'woodRed' });
    ctx.place('hangingPlant', { at: [6.3, 0, -6.3], top: 5.5, y: 3.7 });
    ctx.place('quillJar', { at: [0.55, 0.81, 3.3], jar: 'porcelain' });
    ctx.place('candleCluster', { at: [1.55, 0.81, 2.7], count: 3 });
    ctx.place('paperStars', { at: [0, 0, 1], area: [8, 7], top: 5.5, maxDrop: 0.9, count: 8, avoid: 1.5, colors: ['paper', 'cream', 'pastelLemon'] });
  },
});
