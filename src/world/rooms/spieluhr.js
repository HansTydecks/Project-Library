import { defineRoom } from '../registry.js';

// Spieluhrsaal: Instrumente, die nicht auf Musiker warten.
export default defineRoom({
  id: 'spieluhr',
  name: 'Spieluhrsaal',
  description: 'Ein Flügel spielt von selbst, eine Eule tanzt auf der Spieluhr, Noten schweben durch die Luft.',
  keywords: ['musik', 'klavier', 'flügel', 'spieluhr', 'noten', 'lied', 'tanz', 'konzert', 'sound', 'audio'],
  cell: [-2, -2],
  height: 7,
  spawn: { at: [5, 0], yaw: Math.PI / 2 },
  atmosphere: { fog: '#2c2c58', density: 0.012, ambient: 1.35, ambientColor: '#e0dcff', moon: 0 },
  build(ctx) {
    const { hw, hd } = ctx;
    ctx.floor('marble', { uv: 4 });
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'wpBlue', wainscot: 'paneling', trim: 'woodDark' });
    ctx.foundation();

    ctx.place('rug', { at: [0, 0, 0], width: 7, depth: 7, material: 'carpetBlue' });
    ctx.place('giantButton', { at: [0, 0, 0], radius: 1.8, height: 0.3, material: 'pastelLilac' });
    ctx.place('musicBox', { at: [0, 0.3, 0], scale: 1.3, secret: 'spieluhr-eule' });
    ctx.place('piano', { at: [-4.2, 0, -3.8], rot: 0.5, secret: 'fluegel' });
    ctx.place('gramophone', { at: [5.4, 0.62, -5.6] });
    ctx.place('sideTable', { at: [5.4, 0, -5.6] });
    ctx.place('floatingMusicNotes', { at: [0, 0, 0], area: [12, 4, 12], count: 22, y: 1 });
    const west = ctx.wallFrame('west', 0.42);
    for (const [u, tilt] of [[-4, 0.25], [-2.6, -0.2], [3, 0.15], [4.5, -0.25]]) west.place('violin', { at: [u, 2.6, 0], tilt });
    west.place('sconce', { at: [0, 2.8, 0], light: false });
    ctx.wallShelves('north', { id: '_noten', unit: 2, height: 3.0, maxUnits: 6 });
    for (const [x, z] of [[-5, 4], [5, 4]]) ctx.place('armchair', { at: [x, 0, z], rot: Math.PI + (x < 0 ? -0.5 : 0.5), cushion: 'velvetBlue' });
    ctx.place('balloonBooks', { at: [4, 0, 2], y: 3.2, count: 3, radius: 1 });
    ctx.place('chandelier', { at: [0, 0, 0], y: 5.4, chain: 1.6, radius: 1.3, candles: 12, intensity: 18, distance: 15 });
    ctx.place('floorLamp', { at: [-6.6, 0, 6.6], intensity: 5 });
    ctx.place('floorLamp', { at: [6.6, 0, 6.6], intensity: 5 });
    ctx.place('standSign', { at: [2.4, 0, 2.6], rot: -0.6, text: 'Tanzfläche: Bitte nur im Takt hüpfen.', size: 32, width: 1.1, signHeight: 0.36 });
    ctx.place('walkingBook', { at: [-2, 0, 3.5], radius: 1.3, color: '#3a6ac0', name: 'Ein Liederbuch auf Wanderschaft' });
    ctx.sign('Spieluhrsaal – Musik, die sich selbst spielt', [0, 4.6, hd - 0.46], Math.PI, { w: 4.2, h: 0.55, size: 40 });
    ctx.place('dust', { area: [14, 6, 14] });
  },
});
