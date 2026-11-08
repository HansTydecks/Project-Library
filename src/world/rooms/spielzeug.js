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
    ctx.sign('Spielzeugkammer – Spielen ist auch Lesen (mit den Händen)', [0, 4.4, hd - 0.46], Math.PI, { w: 5, h: 0.55, size: 36 });
    ctx.place('dust', { area: [14, 6, 14] });
  },
});
