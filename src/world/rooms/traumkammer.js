import { defineRoom } from '../registry.js';

// Traumkammer (1. Obergeschoss): Hier schlafen die Bücher. Schäfchenwolken helfen beim Einschlafen.
export default defineRoom({
  id: 'traumkammer',
  name: 'Traumkammer',
  description: 'Bücher schlafen in kleinen Bettchen, Schäfchenwolken springen über einen Zaun, ein Mond-Mobile dreht sich.',
  keywords: ['traum', 'schlafen', 'nacht', 'schafe', 'schäfchen', 'bett', 'müde', 'mond', 'ruhe', 'obergeschoss'],
  cell: [-2, -2],
  level: 1,
  height: 6,
  spawn: { at: [0, 5], yaw: 0 },
  atmosphere: { fog: '#22224a', density: 0.012, ambient: 1.15, ambientColor: '#c8c8ff', moon: 0 },
  build(ctx) {
    const { hd } = ctx;
    ctx.floor('parquet');
    ctx.ceiling('starCeiling', { uv: 8, beams: null });
    ctx.enclose({ inner: 'wpNight', wainscot: 'paneling' });
    ctx.foundation();

    ctx.place('rug', { at: [0, 0, 0], width: 7, depth: 6, material: 'carpetBlue' });
    const cols = ['#c0405a', '#3a6ac0', '#3a9a6a', '#e0a030'];
    [-5, -2, 2, 5].forEach((x, i) => ctx.place('sleepingBook', { at: [x, 0, -6.6], color: cols[i], blanket: ['pastelSky', 'pastelPink', 'pastelMint', 'pastelLemon'][i] }));
    ctx.place('sheepFence', { at: [0, 0, 0.6], rot: Math.PI / 2, width: 3, count: 4 });
    ctx.place('friendSheep', { at: [3.6, 0, 2.2], rot: -0.8, friend: 'wolle', wants: { item: 'wolle', egg: 'wolle-geschenk', eggName: 'Ein Wollknäuel für Wolle', text: 'Ein Wollknäuel! Mäh-ravillös! Jetzt kann ich endlich gut schlafen. Und du darfst mitzählen.' } });
    ctx.place('moonMobile', { at: [0, 0, 0.6], y: 4.4 });
    ctx.place('moonLamp', { at: [-6.4, 0, 6.4], height: 1.3 });
    ctx.place('moonLamp', { at: [6.4, 0, 6.4], height: 1.3 });
    ctx.place('armchair', { at: [-5.2, 0, 3.4], rot: 2.2, cushion: 'velvetBlue', blanket: 'pastelLilac', quip: 'Der Sessel gähnt. Das ist ansteckend.' });
    ctx.place('standSign', { at: [1.6, 0, 4.6], rot: -0.3, text: 'Pssst! Hier wird geträumt. (Schnarchen erlaubt.)', size: 30, width: 1.1, signHeight: 0.38 });
    ctx.place('floatingMusicNotes', { at: [0, 0, -5], area: [10, 2, 2], count: 6, y: 1.2 });
    ctx.sign('Traumkammer – Gute Nacht, liebe Bücher', [0, 4.2, hd - 0.46], Math.PI, { w: 4, h: 0.5, size: 40 });
    ctx.place('dust', { area: [14, 5, 14], color: '#c8d8ff' });
  },
});
