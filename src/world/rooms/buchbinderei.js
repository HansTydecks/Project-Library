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

    // ---- Mehr Details: Werkzeugbrett, Meisterporträt, Papierschnipsel, Heftzwirn
    const north = ctx.wallFrame('north', 0.42);
    north.place('wallShelfSmall', { at: [4.8, 0, 0], y: 1.7, width: 1.8, wood: 'woodRed' });
    north.place('wallShelfSmall', { at: [4.8, 0, 0], y: 2.4, width: 1.4 });
    north.place('portrait', { at: [-4.8, 2.5, 0], subject: 'igel', bg: '#6a4a2a', title: 'Meister Stachel', caption: 'Der erste Buchbinder der Bibliothek. Er lochte die Seiten mit seinen eigenen Stacheln – heute nimmt man dafür eine Ahle.' });
    north.place('mouseDoor', { at: [-3.2, 0, 0], sign: 'Leimfrei', color: 'woodLight', lines: [
      '»Wir binden hier winzige Bücher! Das kleinste hat nur eine Seite. Und die ist leer.«',
      '»Vorsicht, frisch geleimt!«, piepst es. Die Tür klebt ein bisschen.',
      'Durch das Schlüsselloch duftet es nach Papier und Käsebrot.',
    ] });
    ctx.wallFrame('east', 0.42).place('magicWindow', { at: [-4.8, 0, 0], y: 2.3, mode: 'day', curtain: 'velvetGreen', frame: 'woodLight', quip: 'Draußen üben frisch gebundene Bücher das Fliegen. Eins winkt mit dem Lesebändchen.' });
    ctx.wallFrame('west', 0.6).place('bunting', { at: [0, 0, 0], length: 14, y: 4.6, sag: 0.4, colors: ['pastelPink', 'pastelLemon', 'pastelSky', 'pastelMint', 'pastelPeach'] });
    ctx.place('paperStars', { area: [13, 13], top: 6, maxDrop: 1.3, count: 14, avoid: 1.8, colors: ['paper', 'cream', 'pastelLemon', 'pastelSky'] });
    ctx.place('hangingPlant', { at: [-6.4, 0, -6.2], top: 6, y: 3.9 });
    ctx.place('bookPile', { at: [-6.4, 0, -4.6], count: 6 });
    ctx.place('bookPile', { at: [4.3, 0, -3.3], count: 4 });
    ctx.place('yarnBall', { at: [-5.8, 0, -3.4], radius: 0.28, material: 'cream', rot: -Math.PI / 2 });
    ctx.place('quillJar', { at: [1.35, 0.81, -3.3], scrolls: false });
    ctx.place('candleCluster', { at: [3.0, 0.81, -4.0], count: 3 });
  },
});
