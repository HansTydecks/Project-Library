import { defineRoom } from '../registry.js';

// Dachgarten der Bienen (1. Obergeschoss, draußen): Blumen, Bienen, Honig – und Aussicht über die Dächer.
export default defineRoom({
  id: 'dachgarten',
  name: 'Dachgarten der Bienen',
  description: 'Ein Garten auf dem Dach: Bienen summen von Blume zu Blume, unten liegen die Dächer der Bibliothek.',
  keywords: ['dach', 'dachgarten', 'bienen', 'honig', 'blumen', 'aussicht', 'draußen', 'garten', 'obergeschoss'],
  cell: [-2, -1],
  level: 1,
  outdoor: true,
  spawn: { at: [-5, 0], yaw: -Math.PI / 2 },
  atmosphere: { fog: '#2a3060', density: 0.005, ambient: 1.25, ambientColor: '#c8d4ff', moon: 0.9 },
  build(ctx) {
    ctx.floor('grassBright', { uv: 3 });
    ctx.enclose({ neighbor: 'facade', open: 'railing', facadeHeight: 6.5 });
    ctx.foundation();

    const beds = [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 1.5]];
    for (const [x, z] of beds) ctx.place('flowers', { at: [x, 0, z], width: 3, depth: 2.2, kinds: ['flowerYellow', 'pastelPink', 'flowerBlue', 'pastelLilac', 'flowerWhite'] });
    ctx.place('beehive', { at: [2.2, 0, -2.2] });
    ctx.place('queenBee', { at: [2.2, 0, -2.2], y: 1.7, friend: 'summ' });
    ctx.place('bees', { at: [0, 0, 0], count: 22, hive: [2.2, 0.7, -2.2], targets: beds.map(([x, z]) => [x, 0.5, z]) });
    ctx.place('plantSpot', { at: [-2.4, 0, 1.4] });
    ctx.place('table', { at: [5.2, 0, 5.4], width: 1.4, depth: 0.9, material: 'woodLight' });
    ctx.place('honeyJars', { at: [5.2, 0.81, 5.4] });
    ctx.place('bench', { at: [-3.4, 0, 6.6], rot: Math.PI });
    ctx.place('lamppost', { at: [-6.6, 0, -6.6] });
    ctx.place('lamppost', { at: [6.6, 0, -6.6] });
    ctx.place('butterflies', { at: [0, 0, 0], area: [12, 2, 12], count: 6, y: 0.8 });
    ctx.place('kite', { at: [6, 0, 2], y: 6, color: '#ffd86a' });
    ctx.place('standSign', { at: [-0.4, 0, -1.6], rot: 0.2, text: 'Bitte nicht die Bienen kitzeln. Sie lachen sonst den ganzen Tag.', size: 28, width: 1.2, signHeight: 0.42 });
    if (ctx.kit.services.fx?.season === 'winter') ctx.place('snowfall', { area: [16, 9, 16] });
    ctx.place('dust', { area: [14, 4, 14], count: 120 });

    // ---- Mehr Details: Hängematte, Gießkanne, Wimpel, Kübel am Geländer
    ctx.place('bunting', { at: [0, 0, -6.6], length: 13.2, y: 2.95, sag: 0.5, colors: ['pastelLemon', 'flowerYellow', 'white', 'pastelPeach'] });
    ctx.place('fairyLights', { at: [7.55, 0, -7], rot: -Math.PI / 2, length: 14, y: 1.3, sag: 0.1, count: 30 });
    ctx.place('hammock', { at: [5.4, 0, -1.5], rot: Math.PI / 2, length: 3 });
    ctx.place('planter', { at: [7.1, 0, 4.8], rot: Math.PI / 2, width: 2.4 });
    ctx.place('wateringCan', { at: [-1.8, 0, 2.1], y: 1.0, color: 'pastelMint' });
    ctx.place('hatCactus', { at: [2.8, 0, -6.6], hat: 'sombrero', name: 'Kaktus mit Sonnenhut', quip: 'Er trägt den Hut, damit die Bienen ihn nicht für eine Blume halten. Klappt nur so mittel.' });
    ctx.place('singingFlower', { at: [2.8, 0, 5.2], color: 'yellow', name: 'Summblume', quip: 'Die Blume summt mit den Bienen im Takt. Die Bienen tun so, als hätten sie es nicht bemerkt.' });
    ctx.place('pottedPlant', { at: [-6.8, 0, 6.8], scale: 1.3, leaf: 'leavesPink' });
    ctx.place('pottedPlant', { at: [6.8, 0, 6.8], scale: 1.2 });
    ctx.place('teapot', { at: [4.8, 0.81, 5.66], color: 'pastelLemon', scale: 0.8, rot: 0.6 });
    ctx.place('teacup', { at: [5.75, 0.81, 5.2], color: 'pastelPink' });
  },
});
