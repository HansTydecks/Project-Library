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
  },
});
