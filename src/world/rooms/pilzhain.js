import { defineRoom } from '../registry.js';

// Pilzhain: leuchtende Riesenpilze, Sprungpilze und Wolken, auf denen man stehen kann.
export default defineRoom({
  id: 'pilzhain',
  name: 'Leuchtender Pilzhain',
  description: 'Riesenpilze leuchten in allen Farben. Auf den Sprungpilzen geht es hoch hinaus.',
  keywords: ['pilze', 'pilz', 'hain', 'wald', 'springen', 'hüpfen', 'leuchten', 'frosch', 'teich', 'draußen', 'natur'],
  cell: [0, 2],
  outdoor: true,
  spawn: { at: [0, -5], yaw: Math.PI },
  atmosphere: { fog: '#2c2254', density: 0.009, ambient: 1.3, ambientColor: '#d0b8ff', moon: 0.8 },
  build(ctx) {
    ctx.floor('grassBright', { uv: 3 });
    ctx.enclose({ neighbor: 'hedge', neighborOutdoor: 'hedge', open: 'hedge' });
    ctx.foundation();

    // Riesenpilze im Kreis
    const big = [[-5, -4, 4.2, 'mushroomCap', '#ff8ad8'], [5.4, -4.6, 3.4, 'mushroomCapBlue', '#8ad8ff'], [-5.6, 3.6, 3.0, 'mushroomCapGold', '#ffd86a'], [6, 4, 4.8, 'mushroomCap', '#ff9ac8'], [0.5, 6.4, 2.6, 'mushroomCapBlue', '#9ab8ff']];
    for (const [x, z, h, cap, glow] of big) ctx.place('giantMushroom', { at: [x, 0, z], height: h, radius: 1.4 + h * 0.15, cap, glow, lean: (x % 2) * 0.05 });
    // Sprungpilze → Wolken → goldene Eichel
    ctx.place('jumpMushroom', { at: [-1.6, 0, -1], scale: 0.9, power: 10.5, cap: 'mushroomCap' });
    ctx.place('jumpMushroom', { at: [2.2, 0, 1.2], scale: 0.9, power: 10.5, cap: 'mushroomCapBlue', glow: '#8ad8ff' });
    ctx.place('floatingIsland', { at: [-1.2, 0, 2.8], y: 3.4, width: 2.4, depth: 2.2 });
    ctx.place('floatingIsland', { at: [2.8, 0, 4.6], y: 4.6, width: 2.2, depth: 2.2 });
    ctx.place('jumpMushroom', { at: [-1.2, 3.4, 2.8], scale: 0.6, power: 9, cap: 'mushroomCapGold', glow: '#ffd86a', light: false });
    ctx.place('floatingIsland', { at: [-3.6, 0, 6.0], y: 6.6, width: 2.6, depth: 2.2 });
    ctx.place('goldenAcorn', { at: [-3.6, 6.6, 6.0], secret: 'goldene-eichel' });
    ctx.place('standSign', { at: [-0.4, 0, -3.4], rot: 0.3, text: 'Sprungpilze: Draufspringen erlaubt. Sie sind kitzlig.', size: 30, width: 1.1, signHeight: 0.4 });

    ctx.place('lilyPond', { at: [4.2, 0, -0.8], radius: 2, secret: 'opernfrosch' });
    ctx.place('snailMailbox', { at: [-6.4, 0, -3.4], rot: Math.PI / 2 });
    ctx.place('bench', { at: [-3.4, 0, -6.6] });
    ctx.place('fairyLights', { at: [-5, 0, -4], rot: -0.3, length: 10, y: 3.2, sag: 0.9 });
    ctx.place('fairyLights', { at: [-5.6, 0, 3.6], rot: 0.1, length: 11, y: 2.8, sag: 0.7 });
    ctx.place('mushrooms', { at: [-2.5, 0, -6] });
    ctx.place('flowers', { at: [5.8, 0, -7], width: 3, depth: 1.2 });
    ctx.place('flowers', { at: [-6.8, 0, 6.8], width: 2, depth: 2 });
    ctx.place('fireflies', { area: [14, 4, 14], count: 90, color: '#ffb8f0' });
    ctx.place('dust', { area: [14, 6, 14], count: 200 });
  },
});
