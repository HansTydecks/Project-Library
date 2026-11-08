import { defineRoom } from '../registry.js';
import { FLOOR_H } from '../world.js';
import { box, cyl } from '../geo.js';

// Bücherlift: ein Aufzug im Messingkäfig, vom Sternenbalkon hinauf in den Ostflügel und aufs Wolkencafé.
const TOP_H = 5;

export default defineRoom({
  id: 'buecherlift',
  name: 'Bücherlift',
  description: 'Ein Aufzug im Messingkäfig: vom Sternenbalkon hinauf in den Ostflügel und ganz oben ins Wolkencafé.',
  keywords: ['lift', 'aufzug', 'fahrstuhl', 'oben', 'etage', 'café', 'kakao', 'wolke', 'obergeschoss'],
  cell: [3, 0],
  levels: [0, 1, 2],
  height: FLOOR_H * 2 + TOP_H,
  outdoorLevels: [2],
  levelNames: ['Erdgeschoss – zum Sternenbalkon', '1. Obergeschoss – Musikzimmer, Luftschiffhafen, Fabelwesen', 'Wolkencafé'],
  spawn: { at: [-5, 0], yaw: -Math.PI / 2 },
  atmosphere: { fog: '#30304a', density: 0.01, ambient: 1.35, ambientColor: '#ffeedd', moon: 0 },
  atmosphereByLevel: {
    1: { fog: '#34304a', density: 0.01, ambient: 1.35, ambientColor: '#fff0e8', moon: 0.2 },
    2: { fog: '#2a3266', density: 0.004, ambient: 1.25, ambientColor: '#c8d0ff', moon: 1 },
  },
  build(ctx) {
    const hole = [0, 0, 3.7, 3.7];
    const railing = (lc) => {
      // Geländer um den Schacht; Südseite offen (dort steigt man ein)
      for (const [x, z, w, d] of [[0, -1.95, 3.9, 0.08], [-1.95, 0, 0.08, 3.9], [1.95, 0, 0.08, 3.9]]) { lc.add(box(w, 0.06, d, 0), 'brass', [x, 1.0, z]); lc.collider(x, z, w, d, { top: 1.1, bottom: 0.1, shadow: false }); }
    };
    // ---- Erdgeschoss
    const l0 = ctx.level(0, FLOOR_H);
    l0.floor('marble', { uv: 4 });
    l0.enclose({ inner: 'wpBlue', wainscot: 'paneling', height: FLOOR_H });
    l0.foundation();
    l0.place('bookLift', { stops: [0, FLOOR_H, FLOOR_H * 2], names: ['Erdgeschoss', '1. Obergeschoss', 'Wolkencafé'] });
    l0.place('rug', { at: [-4.5, 0, 0], width: 3, depth: 4, material: 'carpetRed' });
    l0.place('standSign', { at: [-3.4, 0, 3.4], rot: 0.6, text: 'Bücherlift: Knopf drücken, festhalten, staunen.', size: 30, width: 1.1, signHeight: 0.38 });
    l0.place('bench', { at: [-6, 0, -5], rot: Math.PI / 2 });
    l0.place('parcelStack', { at: [6.4, 0, 6.4], count: 4 });
    l0.wallShelves('east', { id: '_lift0', unit: 2, height: 3.2, maxUnits: 6 });
    l0.wallShelves('north', { id: '_lift1', unit: 2, height: 3.2, maxUnits: 6 });
    l0.place('lantern', { at: [-5, 7, 5], hanging: true, chain: 4, intensity: 8, distance: 14 });
    const s0 = l0.wallFrame('south', 0.42);
    s0.place('magicWindow', { at: [-3.6, 0, 0], y: 2.4, mode: 'sunset', curtain: 'velvetBlue' });
    s0.place('portrait', { at: [2.8, 2.3, 0], subject: 'zauberer', bg: '#3a3a6a' });
    s0.place('mouseDoor', { at: [0.6, 0, 0], sign: 'Liftmaus' });
    s0.place('wallShelfSmall', { at: [5.4, 0, 0], y: 1.7, width: 1.2 });
    l0.place('cushionPile', { at: [-6.2, 0, 4.9] });
    l0.place('fishBowl', { at: [5.6, 0, -3.4], name: 'Liftfische' });
    l0.place('crystalCluster', { at: [6.6, 0, 3.6], color: '#9ad8ff' });
    l0.place('paperStars', { area: [13, 13], top: 11.9, maxDrop: 8, count: 16, avoid: 2.4 });
    l0.place('hangingPlant', { at: [-6, 0, -2.6], top: 11.9, y: 3.4 });
    l0.place('sideTable', { at: [-6.6, 0, 2.8] });
    l0.place('snowGlobe', { at: [-6.6, 0.62, 2.8], quip: 'In der Kugel schneit es auf ein winziges Wolkencafé.' });
    l0.place('quillJar', { at: [-6.5, 0.62, 2.55] });
    l0.place('candleCluster', { at: [-6.75, 0.62, 3.05], count: 3 });
    l0.wallFrame('west', 0.42).place('bunting', { at: [-4.5, 0, 0], y: 3.6, length: 5, sag: 0.5 });
    ctx.sign('Bücherlift – Ostflügel & Wolkencafé', [0, 4.4, ctx.hd - 0.46], Math.PI, { w: 4, h: 0.5, size: 40 });
    // ---- 1. Obergeschoss
    const l1 = ctx.level(1, FLOOR_H);
    l1.floor('parquet', { hole });
    l1.enclose({ inner: 'wpPurple', wainscot: 'paneling', height: FLOOR_H });
    railing(l1);
    l1.place('standSign', { at: [-3.6, 0, 3.6], rot: 0.6, text: 'Norden: Musikzimmer · Süden: Luftschiffhafen & Fabelwesen', size: 26, width: 1.3, signHeight: 0.42 });
    l1.place('armchair', { at: [-5.6, 0, -5.4], rot: 0.8, cushion: 'velvetBlue' });
    l1.place('pottedPlant', { at: [6.6, 0, -6.6], scale: 1.4, leaf: 'leavesPink' });
    l1.place('lantern', { at: [5, 7, 5], hanging: true, chain: 4, intensity: 8, distance: 14 });
    // ---- Wolkencafé (offen)
    const l2 = ctx.level(2, TOP_H);
    l2.floor('tilesWhite', { uv: 1, hole });
    l2.enclose({ neighbor: 'railing', open: 'railing', height: TOP_H });
    railing(l2);
    l2.place('cloudBarista', { at: [-4.5, 0, -4.5], rot: 0.8, friend: 'woelkchen' });
    for (const [x, z] of [[4.5, -4.5], [4.5, 4.5], [-4.5, 4.5]]) {
      l2.place('table', { at: [x, 0, z], width: 1.2, depth: 1.2, material: 'woodLight' });
      l2.place('teacup', { at: [x + 0.2, 0.81, z], color: 'pastelPink' });
      l2.place('chair', { at: [x, 0, z + 0.9], rot: Math.PI, cushion: 'velvetBlue' });
      l2.place('chair', { at: [x, 0, z - 0.9], cushion: 'velvetGreen' });
    }
    l2.place('cake', { at: [4.5, 0.81, -4.5] });
    l2.place('balloonBooks', { at: [0, 0, 5.6], y: 3.4, count: 3, radius: 1.2 });
    l2.place('kite', { at: [6, 0, 0], y: 6.5, color: '#8ad8ff' });
    l2.place('paintedEgg', { at: [-6.4, 0, 6.4], id: 'ei-wolkencafe' });
    l2.place('standSign', { at: [0, 0, 3.4], text: 'Wolkencafé: Kakao mit Aussicht. Bitte nicht die Wolken anknabbern.', size: 26, width: 1.3, signHeight: 0.42 });
    l2.light([0, 3.5, 0], { color: '#ffe0b0', intensity: 5, distance: 12 });
    for (const [x, z] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) l2.add(cyl(0.08, 0.1, 2.2, 8), 'brass', [x, 1.1, z]);
    if (ctx.kit.services.fx?.season === 'winter') l2.place('snowfall', { area: [16, 8, 16] });
  },
});
