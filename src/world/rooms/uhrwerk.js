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
    north.place('gear', { at: [4.0, 0, 0], radius: 1.8, y: 3.6, dir: 1 }); // Mitte frei: Tür zum Wendelturm
    north.place('gear', { at: [6.6, 0, 0], radius: 1.0, y: 5.8, dir: -1, material: 'copper' });
    north.place('gear', { at: [-2.4, 0, 0], radius: 0.8, y: 2.0, dir: -1, material: 'copper' });
    west.place('gear', { at: [-2, 0, 0], radius: 1.4, y: 3.6, dir: 1 });
    west.place('gear', { at: [0.4, 0, 0], radius: 0.9, y: 5.2, dir: -1, material: 'copper' });
    west.place('gear', { at: [3.6, 0, 0], radius: 1.2, y: 2.4, dir: 1 });
    // Zahnrad-Stufen hinauf zur obersten Kuckucksuhr
    const steps = [[-2.0, 3.4, 0.8], [-4.0, 2.0, 1.6], [-5.6, 0.2, 2.4], [-5.6, -1.8, 3.2], [-4.6, -3.6, 4.0]];
    for (const [x, z, y] of steps) ctx.place('gear', { at: [x, y, z], flat: true, radius: 0.75, thick: 0.18, spin: 0.15 });
    ctx.place('gear', { at: [-4.6, 4.7, -5.7], flat: true, radius: 1.3, thick: 0.2, material: 'copper' });
    ctx.place('paintedEgg', { at: [-5.6, 3.38, -1.8], id: 'ei-zahnrad' });
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
    ctx.place('friendMouse', { at: [3.0, 0.81, -5.25], friend: 'fingerhut' });
    ctx.place('pickup', { at: [3.75, 0.81, -4.95], item: 'zahnrad' });
    ctx.place('chair', { at: [3, 0, -4.4], rot: Math.PI });
    ctx.place('snail', { at: [-1, 0, 6.6], length: 3, shell: 'pastelLemon', quip: 'Die Schnecke ist Uhrmacherin. Sie arbeitet sehr genau. Und sehr langsam.' });
    ctx.place('standSign', { at: [4.2, 0, 2.6], rot: -0.6, text: 'Bitte keine Zeit verlieren. Gefundene Zeit an der Werkbank abgeben.', size: 28, width: 1.2, signHeight: 0.42 });
    ctx.place('chandelier', { at: [0, 0, 0], y: 5.8, chain: 1.6, radius: 1.2, candles: 10, intensity: 14 });
    ctx.sign('Uhrmacherwerkstatt – Zeit ist, was man daraus macht', [0, 4.6, hd - 0.46], Math.PI, { w: 4.8, h: 0.55, size: 36 });
    ctx.place('dust', { area: [14, 6.5, 14] });

    // Kleine Details: Feierabend-Fenster, Porträt der Uhrmacherin, Mäusetür, Riesen-Fingerhut
    // (Bereich um (−4.2, 3.4) bleibt frei für ein Spiel)
    south.place('magicWindow', { at: [0, 0, 0], y: 2.45, width: 1.3, height: 1.45, mode: 'sunset', frame: 'woodLight', curtain: 'velvetGreen', quip: 'Draußen ist immer Feierabend. Die Uhren hier drin wissen davon zum Glück nichts.' });
    south.place('portrait', { at: [5.3, 4.6, 0], subject: 'maus', width: 0.7, height: 0.9, bg: '#a88a4a' });
    ctx.wallFrame('south', 0.7).place('bunting', { at: [0, 0, 0], length: 14.2, y: 6.95, sag: 0.4, colors: ['pastelLemon', 'pastelPink', 'pastelMint', 'pastelLilac'] });
    ctx.wallFrame('south', 0.5).place('mouseDoor', { at: [-3.6, 0, 0], sign: 'Tick & Tack', color: 'pastelSky' });
    west.place('wallShelfSmall', { at: [-6.0, 0, 0], y: 1.9, width: 1.0, wood: 'woodRed' });
    ctx.place('giantThimble', { at: [5.6, 0, -2.6], radius: 0.42, height: 0.65 });
    ctx.place('hangingPlant', { at: [6.3, 0, 6.5], top: 7.5, y: 4.6 });
    ctx.place('paperStars', { at: [0, 0, 0], area: [11, 11], top: 7.5, maxDrop: 1.3, count: 10, avoid: 2.4, colors: ['gold', 'pastelLemon', 'copper'] });
    ctx.place('gearPuzzle', { at: [-4.2, 0, 3.4], rot: Math.PI / 2 }); // Minispiel: Zahnrad-Tresor
  },
});
