import { defineRoom } from '../registry.js';

// Uhrmacherwerkstatt der verlorenen Minuten: Zahnräder drehen, Kuckucke rufen, Zeit wird gesammelt.
export default defineRoom({
  id: 'uhrwerk',
  name: 'Uhrmacherwerkstatt der verlorenen Minuten',
  description: 'Riesige Zahnräder, Kuckucksuhren, eine Bodenuhr mit echter Zeit und ein Glas voller verlorener Minuten.',
  keywords: ['uhr', 'uhren', 'zeit', 'zahnrad', 'werkstatt', 'kuckuck', 'mechanik', 'pendel', 'minuten', 'tüfteln'],
  cell: [-3, 0],
  height: 7.5,
  spawn: { at: [5, 0], yaw: Math.PI / 2 },
  atmosphere: { fog: '#3a3020', density: 0.011, ambient: 1.35, ambientColor: '#fff0d0', moon: 0 },
  build(ctx) {
    const { hd } = ctx;
    ctx.floor('parquet');
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'wpOchre', wainscot: 'paneling' });
    ctx.foundation();

    // Zahnräder an den Wänden (drehen in Gegenrichtung)
    const north = ctx.wallFrame('north', 0.42), west = ctx.wallFrame('west', 0.42), south = ctx.wallFrame('south', 0.42);
    north.place('gear', { at: [2.2, 0, 0], radius: 1.8, y: 3.2, dir: 1 });
    north.place('gear', { at: [4.9, 0, 0], radius: 1.0, y: 4.8, dir: -1, material: 'copper' });
    north.place('gear', { at: [-0.6, 0, 0], radius: 0.8, y: 1.5, dir: -1, material: 'copper' });
    west.place('gear', { at: [-2, 0, 0], radius: 1.4, y: 3.6, dir: 1 });
    west.place('gear', { at: [0.4, 0, 0], radius: 0.9, y: 5.2, dir: -1, material: 'copper' });
    west.place('gear', { at: [3.6, 0, 0], radius: 1.2, y: 2.4, dir: 1 });
    // Zahnrad-Stufen hinauf zur obersten Kuckucksuhr
    const steps = [[-2.0, 3.4, 0.8], [-4.0, 2.0, 1.6], [-5.6, 0.2, 2.4], [-5.6, -1.8, 3.2], [-4.6, -3.6, 4.0]];
    for (const [x, z, y] of steps) ctx.place('gear', { at: [x, y, z], flat: true, radius: 0.75, thick: 0.18, spin: 0.15 });
    ctx.place('gear', { at: [-4.6, 4.7, -5.7], flat: true, radius: 1.3, thick: 0.2, material: 'copper' });
    north.place('cuckooClock', { at: [-4.6, 0, 0], y: 5.9, scale: 1.4, bird: 'pastelSky', secret: 'hoechster-kuckuck', quip: '»Kuckuck! Du bist ganz oben angekommen. Hier oben geht die Zeit etwas langsamer – genieß sie.«' });
    // Kuckucksuhren an der Südwand
    [-5, -2.2, 2.2, 5].forEach((u, i) => south.place('cuckooClock', { at: [u, 0, 0], y: 2.3 + (i % 2) * 0.5, offset: i * 2.3, bird: ['pastelLemon', 'pastelPink', 'pastelMint', 'pastelLilac'][i] }));
    ctx.place('floorClock', { at: [1.6, 0, 1.2], radius: 2.2 });
    ctx.place('pendulumClock', { at: [6.8, 0, -5], rot: -Math.PI / 2 });
    ctx.place('pendulumClock', { at: [6.8, 0, 5], rot: -Math.PI / 2, material: 'woodDark' });
    // Werkbank
    ctx.place('table', { at: [3, 0, -5.4], width: 2.6, depth: 1.2, material: 'woodLight' });
    ctx.place('minuteJar', { at: [2.4, 0.81, -5.4], secret: 'verlorene-minuten' });
    ctx.place('hourglass', { at: [3.4, 0.81, -5.6] });
    ctx.place('bankerLamp', { at: [4, 0.81, -5.3] });
    ctx.place('bookPile', { at: [2.0, 0.81, -5.0], count: 3 });
    ctx.place('chair', { at: [3, 0, -4.4], rot: Math.PI });
    ctx.place('snail', { at: [-1, 0, 6.6], length: 3, shell: 'pastelLemon', quip: 'Die Schnecke ist Uhrmacherin. Sie arbeitet sehr genau. Und sehr langsam.' });
    ctx.place('standSign', { at: [4.2, 0, 2.6], rot: -0.6, text: 'Bitte keine Zeit verlieren. Gefundene Zeit an der Werkbank abgeben.', size: 28, width: 1.2, signHeight: 0.42 });
    ctx.place('chandelier', { at: [0, 0, 0], y: 5.8, chain: 1.6, radius: 1.2, candles: 10, intensity: 14 });
    ctx.sign('Uhrmacherwerkstatt – Zeit ist, was man daraus macht', [0, 4.6, hd - 0.46], Math.PI, { w: 4.8, h: 0.55, size: 36 });
    ctx.place('dust', { area: [14, 6.5, 14] });
  },
});
