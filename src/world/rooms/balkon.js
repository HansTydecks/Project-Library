import { defineRoom } from '../registry.js';
import { box, cyl, lathe } from '../geo.js';

// Der Balkon über dem Wolkenmeer.
export default defineRoom({
  id: 'balkon',
  name: 'Sternenbalkon',
  description: 'Ein Balkon über dem Wolkenmeer, mit Teleskop und Blick auf den Mond.',
  keywords: ['balkon', 'aussicht', 'mond', 'wolken', 'teleskop', 'sterne', 'himmel', 'draußen'],
  cell: [2, 0],
  outdoor: true,
  spawn: { at: [-5, 0], yaw: -Math.PI / 2 },
  atmosphere: { fog: '#2a3060', density: 0.005, ambient: 1.15, ambientColor: '#a0b4ff', moon: 1 },
  build(ctx) {
    const { hw, hd } = ctx;
    ctx.floor('stoneLight', { uv: 1.5 });
    ctx.enclose({ neighbor: 'facade', open: 'railing', facadeHeight: 7.2 });
    // Schwebende Platte mit Konsolen statt Felsen
    ctx.add(box(ctx.b.w, 0.6, ctx.b.d, 2), 'stoneLight', [0, -0.31, 0]);
    for (let z = -hd + 2; z < hd; z += 4) {
      ctx.add(box(0.8, 2.5, 0.8, 1), 'stoneDark', [-hw + 0.4, -1.8, z]);
      ctx.add(box(3, 0.8, 0.8, 1), 'stoneDark', [-hw + 1.5, -0.9, z], [0, 0, -0.4]);
    }
    ctx.place('telescope', { at: [5.6, 0, -4.5], rot: -Math.PI / 2, secret: 'teleskop' });
    ctx.place('table', { at: [0, 0, 3], width: 1.2, depth: 1.2, height: 0.72, material: 'iron' });
    ctx.place('teaSet', { at: [0, 0.75, 3] });
    ctx.place('chair', { at: [-0.9, 0, 3], rot: Math.PI / 2, material: 'iron', cushion: 'velvetBlue' });
    ctx.place('chair', { at: [0.9, 0, 3], rot: -Math.PI / 2, material: 'iron', cushion: 'velvetBlue' });
    ctx.place('candle', { at: [0.3, 0.75, 2.8], intensity: 3 });
    for (const [x, z] of [[-6.8, -6.8], [6.8, -6.8], [-6.8, 6.8], [6.8, 6.8]]) ctx.place('pottedPlant', { at: [x, 0, z], scale: 1.5 });
    for (const z of [-3, 3]) ctx.place('planter', { at: [7.2, 0, z], rot: Math.PI / 2, width: 3 });
    ctx.place('lamppost', { at: [-5, 0, -6.6], intensity: 6 });
    ctx.place('lamppost', { at: [-5, 0, 6.6], intensity: 6 });
    ctx.place('armchair', { at: [3.8, 0, 4.4], rot: Math.PI * 0.75, cushion: 'velvetBlue', quip: 'Von hier sieht man die Wolken unter sich ziehen. Eine wohlige Gänsehaut.' });
    ctx.place('floatingIsland', { at: [3.5, 0, 0], y: 1.6, width: 2.2, depth: 2.2 });
    ctx.place('rubberDuck', { at: [3.5, 1.6, 0], name: 'Wolkenente', quip: 'Wie kommt die Ente auf die Wolke? Sie sagt: »Gute Frage.«', secret: 'wolkenente', secretName: 'Die Ente auf der Wolke' });
    ctx.place('standSign', { at: [-2.6, 0, 5.6], rot: 2.6, text: 'Bitte nicht die Wolken füttern. Sie werden sonst Gewitter.', size: 30, width: 1.1, signHeight: 0.38 });
    ctx.place('kite', { at: [6, 0, 6], y: 6.5, color: '#ff8ab0' });
    ctx.place('crystalBall', { at: [-1.6, 1.02, -1.2], interact: true });
    ctx.place('pedestal', { at: [-1.6, 0, -1.2] });
  },
});
