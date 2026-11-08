import { defineRoom } from '../registry.js';
import { cyl, sphere } from '../geo.js';

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
    ctx.place('paintedEgg', { at: [2.8, 4.6, 4.6], id: 'ei-pilzwolke' });
    ctx.place('goldenAcorn', { at: [-3.6, 6.6, 6.0], secret: 'goldene-eichel' });
    ctx.place('standSign', { at: [-0.4, 0, -3.4], rot: 0.3, text: 'Sprungpilze: Draufspringen erlaubt. Sie sind kitzlig.', size: 30, width: 1.1, signHeight: 0.4 });

    ctx.place('friendCaterpillar', { at: [4.6, 0, -5.4], rot: -2.6, friend: 'lesefrida' });
    if (ctx.kit.services.fx?.season === 'winter') ctx.place('snowfall', { area: [16, 9, 16] });
    if (ctx.kit.services.fx?.season === 'autumn') ctx.place('pumpkin', { at: [-2.6, 0, -5.4], scale: 1.6 });
    ctx.place('lilyPond', { at: [4.2, 0, -0.8], radius: 2, secret: 'opernfrosch' });
    ctx.place('snailMailbox', { at: [-6.4, 0, -3.4], rot: Math.PI / 2 });
    ctx.place('moleGame', { at: [-3, 0, -3.4] });
    ctx.place('bench', { at: [-3.4, 0, -6.6] });
    ctx.place('fairyLights', { at: [-5, 0, -4], rot: -0.3, length: 10, y: 3.2, sag: 0.9 });
    ctx.place('fairyLights', { at: [-5.6, 0, 3.6], rot: 0.1, length: 11, y: 2.8, sag: 0.7 });
    ctx.place('mushrooms', { at: [-2.5, 0, -6] });
    ctx.place('flowers', { at: [5.8, 0, -7], width: 3, depth: 1.2 });
    ctx.place('flowers', { at: [-6.8, 0, 6.8], width: 2, depth: 2 });
    // --- Kleine Haindetails
    // Leuchtkristalle zwischen den Pilzen (sanft, ohne eigenes Licht)
    ctx.place('crystalCluster', { at: [7.0, 0, 2.4], color: '#ff9ad8' });
    ctx.place('crystalCluster', { at: [-2.0, 0, 7.0], color: '#9ad8ff', scale: 1.2 });
    ctx.place('crystalCluster', { at: [3.4, 0, -7.0], color: '#ffd86a', scale: 0.9 });
    // Wimpelkette zwischen zwei Riesenpilzen
    ctx.place('bunting', { at: [5.7, 0, -0.3], rot: -Math.PI / 2, length: 8.0, y: 3.1, sag: 0.5 });
    // Wichteltür im Stiel des größten Pilzes
    ctx.place('mouseDoor', { at: [5.685, 0, 3.79], rot: -2.155, sign: 'Pilzwichtel', color: 'pastelLilac' });
    ctx.place('flowers', { at: [-6.6, 0, -6.6], width: 1.4, depth: 1.2 });
    ctx.place('flowers', { at: [6.9, 0, -2.8], width: 1.2, depth: 1.2 });
    // Pilz-Teetisch mit zwei Pilzhockern
    const tea = ctx.frame([-2.4, 0, 4.6], 0.3);
    tea.add(cyl(0.12, 0.18, 0.6, 10), 'mushroomStem', [0, 0.3, 0]);
    tea.add(sphere(0.48, 16, 8), 'mushroomCapGold', [0, 0.6, 0], [0, 0, 0], [1, 0.25, 1]);
    tea.add(cyl(0.5, 0.48, 0.1, 18), 'mushroomCapGold', [0, 0.64, 0]);
    for (let i = 0; i < 5; i++) tea.add(sphere(0.05, 8, 5), 'dots', [Math.cos(i * 1.3) * 0.32, 0.69, Math.sin(i * 1.3) * 0.32], [0, 0, 0], [1, 0.3, 1]);
    tea.collider(0, 0, 0.9, 0.9, { top: 0.69 });
    for (const [x, z, cap] of [[-0.85, 0.1, 'mushroomCap'], [0.75, 0.5, 'mushroomCapBlue']]) {
      tea.add(cyl(0.07, 0.1, 0.32, 8), 'mushroomStem', [x, 0.16, z]);
      tea.add(cyl(0.22, 0.2, 0.08, 14), cap, [x, 0.34, z]);
      tea.collider(x, z, 0.4, 0.4, { top: 0.38 });
    }
    tea.place('teapot', { at: [0.08, 0.7, -0.12], color: 'pastelMint', scale: 0.6 });
    tea.place('teacup', { at: [-0.25, 0.7, 0.16], color: 'pastelPink' });
    tea.place('teacup', { at: [0.28, 0.7, 0.2] });
    // Wegweiser am Eingang
    ctx.place('signpost', { at: [2.3, 0, -6.0], signs: [['Wintergarten', 0], ['Lesebad', Math.PI], ['Mondgarten', Math.PI / 2]] });

    ctx.place('fireflies', { area: [14, 4, 14], count: 90, color: '#ffb8f0' });
    ctx.place('dust', { area: [14, 6, 14], count: 200 });
  },
});
