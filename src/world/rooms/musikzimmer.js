import { defineRoom } from '../registry.js';

// Musikzimmer zum Selberspielen (1. OG Ostflügel).
export default defineRoom({
  id: 'musikzimmer',
  name: 'Musikzimmer zum Selberspielen',
  description: 'Xylophon, Trommel, Harfe und Orgel warten darauf, gespielt zu werden – ein Spatzenchor singt mit.',
  keywords: ['musik', 'spielen', 'xylophon', 'trommel', 'harfe', 'orgel', 'lied', 'singen', 'instrument', 'obergeschoss'],
  cell: [3, -1],
  level: 1,
  height: 7,
  spawn: { at: [0, 5], yaw: 0 },
  atmosphere: { fog: '#30284a', density: 0.011, ambient: 1.4, ambientColor: '#fff0f8', moon: 0 },
  build(ctx) {
    const { hd } = ctx;
    ctx.floor('marble', { uv: 4 });
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'wpPink', wainscot: 'paneling', trim: 'white' });
    ctx.foundation();

    ctx.place('rug', { at: [0, 0, 0], width: 7, depth: 6, material: 'carpetBlue' });
    ctx.place('xylophone', { at: [0, 0, 0.4] });
    ctx.place('bigDrum', { at: [-4.2, 0, 1.6] });
    ctx.place('harp', { at: [4.2, 0, 1.4], rot: -0.6 });
    ctx.wallFrame('north', 0.42).place('organPipes', { at: [0, 0, 0] });
    ctx.place('sparrowChoir', { at: [-3.2, 0, -2.4], friend: 'zwitscher' });
    ctx.place('chair', { at: [4.6, 0, -4.4], rot: 0.8 });
    ctx.wallFrame('east', 0.42).place('violin', { at: [2, 2.6, 0], tilt: -0.3 });
    ctx.wallFrame('west', 0.42).place('violin', { at: [-2, 2.6, 0], tilt: 0.3 });
    ctx.place('floatingMusicNotes', { at: [0, 0, 0], area: [12, 4, 10], count: 14, y: 1.4 });
    ctx.place('standSign', { at: [2.4, 0, 3.4], rot: -0.4, text: 'Bitte nur schöne falsche Töne.', size: 32, width: 1.1, signHeight: 0.36 });
    ctx.place('chandelier', { at: [0, 0, 0], y: 5.4, chain: 1.4, radius: 1.2, candles: 10, intensity: 13 });
    ctx.place('paintedEgg', { at: [-6.4, 0, 6.4], id: 'ei-musik' });
    ctx.sign('Musikzimmer – Hier spielt die Musik (du!)', [0, 4.6, hd - 0.46], Math.PI, { w: 4.4, h: 0.55, size: 38 });
    ctx.place('dust', { area: [14, 6, 14] });

    // ---- Mehr Details: Grammophon-Ecke, Notenwimpel, Mäusechor hinter der Fußleiste
    const east = ctx.wallFrame('east', 0.42);
    east.place('portrait', { at: [-1.6, 2.6, 0], subject: 'maus', bg: '#7a3a5a', title: 'Maestra Fingerhut', caption: 'Dirigiert den Spatzenchor mit einem Zahnstocher. Die Spatzen tun so, als würden sie hinsehen.' });
    east.place('mouseDoor', { at: [-4.2, 0, 0], sign: 'Mäusechor', color: 'pastelPink', lines: [
      '»Do-Re-Mi-Fa-Käse!«, singt es hinter der Tür.',
      '»Psst! Wir proben gerade unseren Kanon. Er hört nie auf.«',
      'Hinter der Tür quietscht eine winzige Geige. Ziemlich gut sogar.',
    ] });
    const west = ctx.wallFrame('west', 0.42);
    west.place('magicWindow', { at: [2.6, 0, 0], y: 2.4, mode: 'sunset', curtain: 'velvet', quip: 'Draußen singen die Wolken im Abendrot. Leider etwas zu tief.' });
    west.place('wallShelfSmall', { at: [5.4, 0, 0], y: 1.8, width: 1.2, wood: 'woodRed' });
    ctx.wallFrame('south', 0.42).place('violin', { at: [4.6, 2.4, 0], tilt: 0.25 });
    ctx.place('bunting', { at: [0, 0, 4.6], length: 15.1, y: 4.9, sag: 0.6, colors: ['pastelPink', 'pastelLilac', 'pastelSky', 'pastelLemon', 'white'] });
    ctx.place('sideTable', { at: [6.4, 0, -6.3] });
    ctx.place('gramophone', { at: [6.4, 0.62, -6.3], rot: -2.4 });
    ctx.place('cushionPile', { at: [6.2, 0, 4.2], colors: ['velvet', 'pastelPink', 'pastelLilac', 'velvetBlue', 'pastelLemon'] });
    ctx.place('hangingPlant', { at: [-6.3, 0, -6.2], top: 7, y: 4.6, leaf: 'leavesPink' });
    ctx.place('bookPile', { at: [5.6, 0, -3.3], count: 3 });
  },
});
