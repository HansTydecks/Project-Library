import { defineRoom } from '../registry.js';

// Eulenpost (1. Obergeschoss): Eulen fliegen Briefe, eine Postmeisterin sortiert.
export default defineRoom({
  id: 'eulenpost',
  name: 'Eulenpost',
  description: 'Eulen flattern mit Briefen zwischen den Fächern, am Schalter sortiert die Postmeisterin.',
  keywords: ['post', 'eule', 'eulen', 'brief', 'briefe', 'paket', 'schreiben', 'nachricht', 'obergeschoss'],
  cell: [-2, 0],
  level: 1,
  height: 6.5,
  spawn: { at: [-5, 0], yaw: -Math.PI / 2 },
  atmosphere: { fog: '#34303a', density: 0.011, ambient: 1.4, ambientColor: '#fff0e0', moon: 0 },
  build(ctx) {
    const { hd } = ctx;
    ctx.floor('parquet');
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'wpGreen', wainscot: 'paneling' });
    ctx.foundation();

    ctx.wallFrame('east', 0.42).place('pigeonholes', { at: [0, 0, 0], cols: 12, rows: 6 });
    ctx.wallFrame('south', 0.42).place('pigeonholes', { at: [-3, 0, 0], cols: 8, rows: 5 });
    ctx.place('desk', { at: [3.6, 0, 0], rot: -Math.PI / 2, width: 3 });
    ctx.place('friendOwl', { at: [4.4, 0.83, -0.8], rot: -Math.PI / 2, perch: 0.5, friend: 'federleicht' });
    ctx.place('bell', { at: [3.4, 0.83, 0.9] });
    ctx.place('parcelStack', { at: [3.6, 0.83, 0.4], count: 2 });
    ctx.place('postOwls', { at: [0, 0, 0], y: 3.6, radius: 4.5, count: 3 });
    ctx.place('owlMailbox', { at: [-2.4, 0, 3.2], rot: 0.5 });
    ctx.place('parcelStack', { at: [-6.2, 0, -6.2], count: 5 });
    ctx.place('parcelStack', { at: [-5.2, 0, -6.6], count: 3 });
    ctx.place('rug', { at: [0, 0, 0], width: 5, depth: 4, material: 'carpetRed' });
    ctx.place('standSign', { at: [-1.2, 0, -2.6], rot: -0.5, text: 'Eilpost: wird gestern zugestellt.', size: 32, width: 1.1, signHeight: 0.36 });
    ctx.place('chandelier', { at: [0, 0, 0], y: 5.2, chain: 1.1, radius: 1, candles: 8, intensity: 12 });
    ctx.sign('Eulenpost – Wir finden jeden. Auch dich.', [0, 4.7, -hd + 0.46], 0, { w: 4, h: 0.5, size: 40 });
    ctx.place('dust', { area: [14, 5.5, 14] });

    // ---- Mehr Details: Briefleine, Wartebank, Schreibzeug, Papierflieger
    const east = ctx.wallFrame('east', 0.42);
    east.place('portrait', { at: [-4.6, 2.5, 0], subject: 'eule', bg: '#2a5a4a', title: 'Postmeister Puschel', caption: 'Hat in seiner Laufbahn 1.000.000 Briefe zugestellt. 999.999 davon an die richtige Adresse.' });
    east.place('wallShelfSmall', { at: [4.6, 0, 0], y: 1.7, width: 1.6, wood: 'woodLight' });
    ctx.wallFrame('south', 0.42).place('magicWindow', { at: [3, 0, 0], y: 2.4, mode: 'sunset', curtain: 'velvetGreen', quip: 'Am Horizont fliegt eine Eule mit einem Paket, das größer ist als sie selbst. Sie schafft das.' });
    ctx.place('bunting', { at: [0, 0, 3.2], length: 15.1, y: 4.9, sag: 0.6, colors: ['white', 'cream', 'pastelSky', 'pastelPink', 'paper'] });
    ctx.place('paperPlanes', { at: [0, 0, 0], count: 4, radius: 2.6, y: 4.2 });
    ctx.place('bench', { at: [-6.9, 0, 4.6], rot: Math.PI / 2, width: 1.8 });
    ctx.place('scroll', { at: [-6.85, 0.47, 4.2], length: 0.36, rot: Math.PI / 2 });
    ctx.place('umbrellaStand', { at: [-6.9, 0, 6.5] });
    ctx.place('snailMailbox', { at: [-6.6, 0, -3.9] });
    ctx.place('inkwell', { at: [3.4, 0.835, -0.15] });
    ctx.place('quillJar', { at: [3.45, 0.83, -1.0], jar: 'pastelPink' });
    ctx.place('hangingPlant', { at: [6.3, 0, -6.3], top: 6.5, y: 4.2, leaf: 'leavesPink' });
  },
});
