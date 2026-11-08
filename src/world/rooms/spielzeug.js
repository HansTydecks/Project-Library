import { defineRoom } from '../registry.js';

// Spielzeugkammer: Ein Bücherzug fährt im Kreis, Klötze werden zur Kletterwand.
export default defineRoom({
  id: 'spielzeug',
  name: 'Spielzeugkammer',
  description: 'Ein Bücherzug auf Schienen, ein Klötzchenturm zum Hinaufspringen und ein höflicher Springteufel.',
  keywords: ['spielzeug', 'spielen', 'zug', 'eisenbahn', 'klötze', 'teddy', 'kinder', 'spaß', 'pferd', 'drachen'],
  cell: [2, 2],
  height: 7,
  spawn: { at: [0, -5], yaw: Math.PI },
  atmosphere: { fog: '#4a3448', density: 0.01, ambient: 1.45, ambientColor: '#fff0f8', moon: 0 },
  build(ctx) {
    const { hd } = ctx;
    ctx.floor('parquet', { uv: 3 });
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'wpPink', wainscot: 'paneling', trim: 'white' });
    ctx.foundation();

    ctx.place('rug', { at: [0, 0, 0], width: 7, depth: 7, material: 'carpetBlue' });
    ctx.place('bookTrain', { at: [0, 0, 0], radius: 5, wagons: 4, secret: 'buecherzug' });
    // Klötzchenturm an der Ostwand → Regalbrett mit Teddy
    const steps = [[6.8, 6.4, 1], [6.8, 5.4, 2], [6.8, 4.4, 3], [6.8, 3.4, 4], [6.8, 2.4, 5]];
    const letters = 'BIBLIOTHEKZAUBERN';
    let li = 0;
    for (const [x, z, n] of steps) for (let i = 0; i < n; i++) ctx.place('letterBlock', { at: [x, i * 0.8, z], letter: letters[li++ % letters.length], spin: (i % 2) * 0.08 });
    const sy = 4.6;
    ctx.place('floatingIsland', { at: [6.6, 0, 0.6], y: sy, width: 1.8, depth: 2.6, kind: 'book', color: '#e8b03a' });
    ctx.place('teddy', { at: [6.6, sy, 0.4], rot: -Math.PI / 2, secret: 'klotzteddy' });
    // Spielsachen
    ctx.place('rockingHorse', { at: [-5.6, 0, -5.4], rot: 0.6, secret: 'schaukelpferd' });
    ctx.place('paintedEgg', { at: [6.6, 0, -6.6], id: 'ei-spielzeug' });
    ctx.place('jackInTheBox', { at: [-6, 0, 5.6], secret: 'springteufel' });
    ctx.place('spinningTop', { at: [0.6, 0, 0.4], color: 'pastelSky' });
    ctx.place('spinningTop', { at: [-0.8, 0, -0.6], color: 'pastelPink' });
    'LESEN'.split('').forEach((l, i) => ctx.place('letterBlock', { at: [-1.6 + i * 0.8, 0, 1.8], letter: l, size: 0.6, spin: (i % 2 ? 0.1 : -0.1) }));
    ctx.place('kite', { at: [-3, 0, 3], y: 4.8, color: '#ff8ab0' });
    ctx.place('kite', { at: [3, 0, -3], y: 5.2, color: '#8ad8ff', rot: 1 });
    ctx.place('balloonBooks', { at: [-4, 0, -2], y: 3.8, count: 4, radius: 1.2 });
    ctx.wallShelves('south', { id: '_spiele', unit: 2, height: 2.6, maxUnits: 5 });
    ctx.place('giantButton', { at: [-5.8, 0, 1.8], radius: 0.8, material: 'pastelLemon' });
    ctx.place('dustBunny', { at: [3, 0, 5.6], area: 2, color: '#f8d8e8' });
    ctx.place('standSign', { at: [-2.4, 0, -6], rot: 0.2, text: 'Aufräumen? Morgen. Ganz bestimmt. Vielleicht.', size: 30, width: 1.1, signHeight: 0.38 });
    ctx.place('chandelier', { at: [0, 0, 0], y: 5.4, chain: 1.6, radius: 1.2, candles: 10, intensity: 15 });
    // --- Kleine Spielzeugdetails
    ctx.place('paperStars', { area: [13, 13], top: 7, count: 22, maxDrop: 2.2, avoid: 2.2 });
    const north = ctx.wallFrame('north', 0.42);
    north.place('bunting', { at: [0, 0, 0.1], y: 4.9, length: 14.6, sag: 0.7 });
    north.place('wallShelfSmall', { at: [-4.4, 0, 0], y: 1.8, width: 1.3, wood: 'pastelSky' });
    north.place('magicWindow', { at: [3.8, 0, 0], y: 2.5, width: 1.3, height: 1.4, mode: 'day', curtain: 'pastelPink', quip: 'Draußen steigt ein Drachen. Oder fliegt da ein Drache? Beide winken.' });
    ctx.wallFrame('west', 0.42).place('portrait', { at: [4.6, 2.4, 0], subject: 'schaf', bg: '#c86a9a', caption: 'Wolle hat für dieses Bild stillgehalten. Fast. Ein bisschen gehüpft hat sie schon.' });
    ctx.place('cushionPile', { at: [4.6, 0, 6.6], colors: ['pastelPink', 'pastelSky', 'pastelLemon', 'pastelMint', 'velvetBlue'] });
    // Teeparty für Kuscheltiere
    ctx.place('table', { at: [-6.4, 0, -3.4], width: 1.0, depth: 0.8, height: 0.45, material: 'pastelMint' });
    ctx.place('teapot', { at: [-6.4, 0.49, -3.4], color: 'pastelPink', scale: 0.5 });
    ctx.place('teacup', { at: [-6.15, 0.49, -3.15], scale: 0.8 });
    ctx.place('teacup', { at: [-6.7, 0.49, -3.62], color: 'pastelSky', scale: 0.8 });
    ctx.place('teddy', { at: [-6.4, 0, -2.6], rot: Math.PI, scale: 0.7, name: 'Gastgeberteddy', quip: 'Der Teddy gießt dir unsichtbaren Tee ein. Er schmeckt nach Himbeere. Sagt er.' });
    // ABC-Klötze an der Westwand
    ctx.place('letterBlock', { at: [-6.9, 0, 3.5], letter: 'A', size: 0.5, spin: 0.1 });
    ctx.place('letterBlock', { at: [-6.9, 0, 4.05], letter: 'B', size: 0.5, spin: -0.08 });
    ctx.place('letterBlock', { at: [-6.9, 0.51, 3.78], letter: 'C', size: 0.5, spin: 0.25 });
    ctx.sign('Spielzeugkammer – Spielen ist auch Lesen (mit den Händen)', [0, 4.4, hd - 0.46], Math.PI, { w: 5, h: 0.55, size: 36 });
    ctx.place('dust', { area: [14, 6, 14] });
  },
});
