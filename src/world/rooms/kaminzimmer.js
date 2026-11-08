import { defineRoom } from '../registry.js';
import { WALL_T } from '../world.js';

// Kaminzimmer der schläfrigen Sessel: Hier wird gelesen, gedöst und geschnarcht – auch vom Drachen.
export default defineRoom({
  id: 'kaminzimmer',
  name: 'Kaminzimmer der schläfrigen Sessel',
  description: 'Ein knisternder Kamin, ein schnarchender Minidrache und Strickzeug, das von selbst strickt.',
  keywords: ['kamin', 'feuer', 'lesen', 'gemütlich', 'drache', 'sessel', 'stricken', 'warm', 'winter', 'schlafen'],
  cell: [-2, 1],
  height: 5.5,
  spawn: { at: [5, 0], yaw: Math.PI / 2 },
  atmosphere: { fog: '#4a3028', density: 0.012, ambient: 1.3, ambientColor: '#ffdcc0', moon: 0 },
  build(ctx) {
    const { hd } = ctx;
    ctx.floor('parquet');
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'wpRed', wainscot: 'paneling' });
    ctx.foundation();

    const west = ctx.wallFrame('west', WALL_T);
    west.place('fireplace', { at: [0, 0, 0], width: 3, height: 1.6, intensity: 6 });
    west.place('cuckooClock', { at: [0, 0, 0.62], y: 3.4, scale: 1.1, offset: 2, bird: 'pastelPink', secret: 'kamin-kuckuck', secretName: 'Der Kuckuck über dem Kamin' });
    ctx.place('rug', { at: [-4.2, 0, 0], width: 4, depth: 5, material: 'carpetRed' });
    ctx.place('sleepyDragon', { at: [-5.0, 0, 0.2], rot: -Math.PI / 2, secret: 'minidrache' });
    ctx.place('petCat', { at: [-4.4, 0, -1.6], rot: 1.2, fur: 'fur', name: 'Kaminkatze' });
    // Sessel ums Feuer
    ctx.place('armchair', { at: [-2.3, 0, -2.4], rot: -Math.PI / 2 - 0.4, cushion: 'velvetGreen', quip: 'Dieser Sessel ist so bequem, dass er selbst eingeschlafen ist.' });
    ctx.place('armchair', { at: [-2.3, 0, 2.4], rot: -Math.PI / 2 + 0.4, cushion: 'velvet' });
    ctx.place('sideTable', { at: [-2.0, 0, 0] });
    ctx.place('teapot', { at: [-2.0, 0.62, 0.1], color: 'pastelPink', scale: 0.7 });
    ctx.place('teacup', { at: [-1.8, 0.62, -0.2] });
    // Schaukelstuhl mit Strickzeug
    ctx.place('rockingChair', { at: [-3.4, 0, 5.2], rot: -2.4, cushion: 'velvetBlue' });
    ctx.place('knitting', { at: [-2.4, 0, 5.6], y: 0.75, secret: 'endlosschal' });
    // Bücherturm hinauf zum Kaminsims
    ctx.place('giantBook', { at: [-5.4, 0, 2.6], width: 1.4, depth: 1.0, thick: 0.55, color: '#3a6ac0' });
    ctx.place('giantBook', { at: [-6.8, 0, 2.2], width: 1.4, depth: 1.0, thick: 0.55, color: '#e0a030' });
    ctx.place('giantBook', { at: [-6.75, 0.55, 2.25], width: 1.3, depth: 0.95, thick: 0.55, color: '#c0405a', rot: 0.08 });
    ctx.place('teddy', { at: [-7.0, 1.76, -0.9], rot: Math.PI / 2, scale: 0.9, name: 'Kaminteddy', secret: 'kaminteddy', secretName: 'Der Teddy auf dem Kaminsims', quip: 'Der Teddy wärmt sich die Pfoten. Er sagt, oben ist es am gemütlichsten.' });
    ctx.place('candle', { at: [-7.0, 1.76, 0.9], height: 0.25, intensity: 2 });

    ctx.wallShelves('south', { id: '_kamin', unit: 2, height: 3.0, maxUnits: 7 });
    ctx.wallShelves('north', { id: '_kamin2', unit: 2, height: 3.0, maxUnits: 6 });
    ctx.place('floorLamp', { at: [5.8, 0, -5.8], intensity: 4 });
    ctx.place('sofa', { at: [4.6, 0, 3.6], rot: -Math.PI / 2, cushion: 'velvetGreen' });
    ctx.place('bookPile', { at: [3.4, 0, 5.4], count: 6 });
    ctx.place('dustBunny', { at: [4, 0, -2], area: 2.5, color: '#e8c8b0' });
    ctx.place('standSign', { at: [1.2, 0, -2.8], rot: -0.4, text: 'Bitte den Drachen nicht wecken. Er schnarcht so schön.', size: 30, width: 1.1, signHeight: 0.38 });
    for (const z of [-4.5, 4.5]) west.place('sconce', { at: [z, 2.7, 0.02], intensity: 3 });
    // --- Kleine Kamindetails
    // Wimpel am Kaminsims und eine Kerzengruppe obendrauf
    west.place('bunting', { at: [0, 0, 1.18], y: 1.74, length: 3.2, sag: 0.1, colors: ['velvet', 'pastelLemon', 'velvetGreen', 'pastelPeach'] });
    ctx.place('candleCluster', { at: [-6.75, 1.77, 0.3], count: 3 });
    // Mäusetür neben dem Kamin (dort ist es schön warm)
    west.place('mouseDoor', { at: [3.0, 0, 0.1], sign: 'Kaminmaus', color: 'woodRed' });
    // Ostwand: Porträt des kleinen Funki und ein verschneites Zauberfenster über dem Sofa
    const east = ctx.wallFrame('east', 0.42);
    east.place('portrait', { at: [-4.2, 2.2, 0], subject: 'drache', bg: '#7a3a2a' });
    east.place('magicWindow', { at: [3.6, 0, 0], y: 2.4, width: 1.3, height: 1.3, mode: 'night', curtain: 'velvetGreen', quip: 'Draußen rieselt leise Schnee. Drinnen knistert der Kamin. Genau richtig so.' });
    // Sofaecke: Teppich, Beistelltisch mit Schneekugel, Kissenberg
    ctx.place('rug', { at: [3.2, 0, 3.6], width: 1.8, depth: 2.8, material: 'carpetBlue' });
    ctx.place('sideTable', { at: [5.2, 0, 5.4] });
    ctx.place('snowGlobe', { at: [5.2, 0.63, 5.4], house: 'pastelLemon', quip: 'In der Kugel schneit es auf ein winziges Kaminzimmer. Darin schnarcht ein winziger Drache.' });
    ctx.place('cushionPile', { at: [6.5, 0, 6.4], colors: ['velvet', 'velvetGreen', 'pastelPeach', 'pastelLemon'] });
    ctx.place('hangingPlant', { at: [5.4, 0, -5.4], top: 5.5, y: 3.7 });
    ctx.sign('Kaminzimmer – Hier darf man einschlafen', [0, 4.0, hd - 0.46], Math.PI, { w: 4.2, h: 0.5, size: 40 });
    ctx.place('dust', { area: [14, 4.5, 14] });
  },
});
