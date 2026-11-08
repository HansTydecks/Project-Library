import { defineRoom } from '../registry.js';

// Sternwarte: Ein Sternenhimmel unter dem Dach, ein Sonnensystem zum Anschubsen und eine Wolkentreppe.
export default defineRoom({
  id: 'sternwarte',
  name: 'Sternwarte',
  description: 'Ein Planetenmodell, Kometen unter der Sternendecke und eine Wolkentreppe nach oben.',
  keywords: ['sterne', 'sternwarte', 'planeten', 'weltall', 'kosmos', 'astronomie', 'komet', 'mond', 'nacht', 'wolken'],
  cell: [2, -1],
  height: 9,
  spawn: { at: [-5, 0], yaw: -Math.PI / 2 },
  atmosphere: { fog: '#1e1e4a', density: 0.008, ambient: 1.2, ambientColor: '#c8d0ff', moon: 0 },
  build(ctx) {
    const { hw, hd } = ctx;
    ctx.floor('parquet');
    ctx.ceiling('starCeiling', { uv: 8, beams: null });
    ctx.enclose({ inner: 'wpNight', trim: 'woodDark' });
    ctx.foundation();

    ctx.place('rug', { at: [0, 0, 0], width: 6, depth: 6, material: 'carpetBlue' });
    ctx.place('orrery', { at: [0, 0, 0], scale: 1.3, secret: 'planeten' });
    ctx.place('comet', { at: [0, 0, 0], y: 7.4, radius: 5.5, speed: 0.3 });
    ctx.place('comet', { at: [1, 0, -1], y: 6.4, radius: 4, speed: -0.22 });
    ctx.place('telescope', { at: [5.4, 0, -5.4], rot: -Math.PI / 4 });
    ctx.place('moonLamp', { at: [-6.4, 0, -6.4] });
    ctx.place('moonLamp', { at: [6.4, 0, 6.4] });
    ctx.place('globe', { at: [-6, 0, 5.6] });
    ctx.wallShelves('north', { id: '_sterne', unit: 2, height: 3.2, maxUnits: 6 });
    ctx.wallShelves('east', { id: '_karten', unit: 2, height: 3.2, maxUnits: 6 });

    // Wolkentreppe im Kreis nach oben (Springen!) – oben wartet ein Stern
    const steps = [[3.2, 3.2, 0.8], [4.8, 0.6, 1.6], [3.8, -2.6, 2.4], [1.0, -4.6, 3.2], [-2.2, -4.4, 4.0], [-4.6, -2.0, 4.8]];
    for (const [x, z, y] of steps) ctx.place('floatingIsland', { at: [x, 0, z], y, width: 1.9, depth: 1.9 });
    ctx.place('paintedEgg', { at: [3.8, 2.4, -2.6], id: 'ei-wolkentreppe' });
    ctx.place('floatingIsland', { at: [-5.2, 0, 1.4], y: 5.6, width: 2.6, depth: 2.6 });
    ctx.place('goldenAcorn', { at: [-5.2, 5.6, 1.4], kind: 'star', label: 'Gefallener Stern', secret: 'sternschnuppe', secretName: 'Der Stern auf der Wolkentreppe', quip: 'Ein kleiner Stern, der zu spät zum Himmel kam. Er wartet hier auf die nächste Nacht.' });
    ctx.place('standSign', { at: [2.0, 0, 4.4], rot: -0.4, text: 'Wolkentreppe: Leertaste drücken. Oben zweimal.', size: 32, width: 1.1, signHeight: 0.36 });
    ctx.place('snail', { at: [-2, 0, 6.8], length: 2.4, shell: 'pastelLilac', quip: 'Die Schnecke ist Astronomin. Sie beobachtet den Mond. Er bewegt sich ihr zu schnell.' });
    ctx.place('dust', { area: [14, 8, 14] });
    ctx.sign('Sternwarte – Bitte nicht nach den Sternen greifen (außer einem)', [0, 4.6, hd - 0.46], Math.PI, { w: 4.8, h: 0.55, size: 36 });
  },
});
