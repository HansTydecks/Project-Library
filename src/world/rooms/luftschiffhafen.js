import { defineRoom } from '../registry.js';

// Luftschiffhafen (1. OG, schwebende Plattform): Hier legt der »Wolkenwal« zum Rundflug ab.
export default defineRoom({
  id: 'luftschiffhafen',
  name: 'Luftschiffhafen',
  description: 'Eine schwebende Plattform, an der das Luftschiff »Wolkenwal« zu Rundflügen über die Bibliothek ablegt.',
  keywords: ['luftschiff', 'hafen', 'fliegen', 'rundflug', 'zeppelin', 'reise', 'möwe', 'ticket', 'draußen', 'obergeschoss'],
  cell: [3, 1],
  level: 1,
  outdoor: true,
  spawn: { at: [-5, -5], yaw: -Math.PI * 0.75 },
  atmosphere: { fog: '#2a3266', density: 0.004, ambient: 1.25, ambientColor: '#c8d0ff', moon: 1 },
  build(ctx) {
    ctx.floor('woodLight', { uv: 1.2 });
    ctx.enclose({ neighbor: 'facade', open: 'railing', facadeHeight: 6.5 });
    ctx.foundation({ skirt: false });
    ctx.place('airship', { at: [3.2, 0, 0.5], y: 0.2 });
    ctx.place('friendGull', { at: [-1.2, 0, -2.6], rot: 0.6, friend: 'moewenstein', gift: 'ticket' });
    ctx.place('seagulls', { at: [3.2, 0, 0.5], y: 8, radius: 6, count: 3 });
    ctx.place('parcelStack', { at: [-5.8, 0, 5.6], count: 4 });
    ctx.place('parcelStack', { at: [-4.8, 0, 6.4], count: 2 });
    ctx.place('umbrellaStand', { at: [-6.6, 0, -1] });
    ctx.place('bench', { at: [-6.4, 0, 2.2], rot: Math.PI / 2 });
    ctx.place('lamppost', { at: [-2.6, 0, 6.6] });
    ctx.place('lamppost', { at: [-2.6, 0, -6.6] });
    ctx.place('standSign', { at: [-2.4, 0, -0.4], rot: -0.6, text: 'Abflug: jetzt. Ankunft: genau hier. Dazwischen: Aussicht.', size: 28, width: 1.2, signHeight: 0.42 });
    ctx.place('kite', { at: [-5, 0, -5], y: 7, color: '#ffd86a' });
    if (ctx.kit.services.fx?.season === 'winter') ctx.place('snowfall', { area: [16, 8, 16] });
    ctx.place('dust', { area: [14, 4, 14], count: 100 });

    // ---- Mehr Details: Wegweiser, Fahrplan, Wimpel zum Abflug, Windrose auf den Planken
    ctx.place('bunting', { at: [-2.6, 0, 0], rot: Math.PI / 2, length: 13.2, y: 2.95, sag: 0.6, colors: ['pastelSky', 'white', 'pastelLemon', 'pastelPink'] });
    ctx.place('fairyLights', { at: [-7, 0, 7.55], length: 14, y: 1.3, sag: 0.1, count: 30 });
    ctx.place('signpost', { at: [-4.6, 0, -3.4], signs: [['Wolkenwal', 0], ['Bücherlift', Math.PI / 2], ['Fabelwesen', Math.PI], ['Mond: weit', -Math.PI / 2]] });
    ctx.place('compassRose', { at: [-4.2, 0, 3.6], radius: 1.2 });
    ctx.place('balloonModel', { at: [-5.9, 0, -5.2], y: 3.6, scale: 0.8 });
    ctx.place('mapRolls', { at: [-6.6, 0, -6.4] });
    ctx.place('planter', { at: [-0.4, 0, 7.1], width: 2.6 });
    ctx.place('planter', { at: [7.1, 0, -5.4], rot: Math.PI / 2, width: 2.2 });
    ctx.place('standSign', { at: [-6.8, 0, 4.6], rot: Math.PI / 2, text: 'Fahrplan: Abflug, wann du willst. Ankunft: kurz danach. Verspätung nur aus Staunen.', size: 26, width: 1.2, signHeight: 0.46 });
    ctx.place('teacup', { at: [-6.35, 0.47, 2.8], color: 'pastelSky' });
    ctx.place('pottedPlant', { at: [6.8, 0, 6.8], scale: 1.3 });
  },
});
