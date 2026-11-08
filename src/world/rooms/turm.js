import { defineRoom } from '../registry.js';
import { FLOOR_H } from '../world.js';
import { box, cyl } from '../geo.js';

// Der Wendelturm: drei Etagen, eine Treppe, ganz oben eine offene Aussichtsplattform mit Glocke.
const TOP_H = 6.5;

export default defineRoom({
  id: 'turm',
  name: 'Wendelturm',
  description: 'Eine Wendeltreppe hinauf in die oberen Etagen – und ganz oben eine Aussicht über die ganze Bibliothek.',
  keywords: ['turm', 'treppe', 'oben', 'etage', 'stockwerk', 'aussicht', 'glocke', 'dach', 'hoch', 'obergeschoss'],
  cell: [-3, -1],
  levels: [0, 1, 2],
  height: FLOOR_H * 2 + TOP_H,
  outdoorLevels: [2],
  levelNames: ['Erdgeschoss', '1. Obergeschoss – Buchbinderei & Dachgarten', 'Turmspitze – Aussichtsplattform'],
  spawn: { at: [4, 4], yaw: Math.PI / 2 },
  atmosphere: { fog: '#3a2e44', density: 0.01, ambient: 1.35, ambientColor: '#ffe6d0', moon: 0 },
  atmosphereByLevel: {
    1: { fog: '#3a3048', density: 0.01, ambient: 1.35, ambientColor: '#fff0e0', moon: 0.2 },
    2: { fog: '#2a3060', density: 0.004, ambient: 1.2, ambientColor: '#b8c4ff', moon: 1 },
  },
  build(ctx) {
    const hole = [0, 0, 3.9, 3.9];
    const stairs = { height: FLOOR_H, steps: 48, turns: 3.5, radius: 2.0, walk: 1.3, stepSize: 0.72, end: Math.PI, finial: false, poleTop: FLOOR_H };
    // ---- Erdgeschoss
    const l0 = ctx.level(0, FLOOR_H);
    l0.floor('marble', { uv: 4 });
    l0.enclose({ inner: 'wpBlue', wainscot: 'paneling', height: FLOOR_H });
    l0.foundation();
    l0.place('spiralStairs', stairs);
    l0.place('rug', { at: [4.2, 0, 4.2], width: 3, depth: 3, material: 'carpetRed' });
    l0.place('standSign', { at: [3.6, 0, -3.4], rot: -0.6, text: 'Wendelturm: 3 Etagen. Wer oben ankommt, darf läuten.', size: 30, width: 1.2, signHeight: 0.4 });
    l0.place('lantern', { at: [4.6, 8, -4.6], hanging: true, chain: 3.6, intensity: 8, distance: 14 });
    l0.place('armchair', { at: [5.6, 0, -5.6], rot: -2.4, cushion: 'velvetBlue', quip: 'Ein Sessel für alle, die die Treppe erst einmal anschauen möchten.' });
    l0.place('pottedPlant', { at: [-6.6, 0, 6.6], scale: 1.5 });
    l0.place('parcelStack', { at: [-6.4, 0, -6.4], count: 4 });
    l0.wallShelves('north', { id: '_turm0', unit: 2, height: 3.2, maxUnits: 6 });
    l0.wallShelves('west', { id: '_turm1', unit: 2, height: 3.2, maxUnits: 6 });
    ctx.sign('Wendelturm – immer im Kreis, immer nach oben', [0, 4.4, ctx.hd - 0.46], Math.PI, { w: 4.4, h: 0.55, size: 38 });

    // ---- 1. Obergeschoss
    const l1 = ctx.level(1, FLOOR_H);
    l1.floor('parquet', { hole });
    l1.enclose({ inner: 'wpPurple', wainscot: 'paneling', height: FLOOR_H });
    // Zweiter Lauf schließt nahtlos an (um einen Stufenwinkel versetzt, sonst liegen zwei Stufen übereinander)
    const stepA = (stairs.turns * Math.PI * 2) / (stairs.steps - 1);
    l1.place('spiralStairs', { ...stairs, end: Math.PI * 2 + stepA });
    l1.add(cyl(0.12, 0.12, 0.6, 8), 'brass', [0, 0.3, 0]);
    l1.wallFrame('west', 0.42).place('towerClock', { at: [0, 0, 0], y: 4.2, radius: 1.8 });
    l1.place('lantern', { at: [-4.6, 8, 4.6], hanging: true, chain: 3.6, intensity: 8, distance: 14 });
    l1.place('standSign', { at: [-3.2, 0, 3.4], rot: 0.7, text: '1. OG: Buchbinderei (Süden) · Dachgarten (Osten). Weiter hinauf: Treppe!', size: 26, width: 1.4, signHeight: 0.45 });
    l1.place('bench', { at: [-5.8, 0, -3], rot: Math.PI / 2 });
    l1.place('pottedPlant', { at: [5.8, 0, -6.4], scale: 1.3, leaf: 'leavesPink' });
    // Geländer um das Treppenauge
    // Geländer um das Treppenauge – Westseite offen (dort kommt die Treppe an und geht weiter)
    for (const [x, z, w, d] of [[0, -2.05, 4.2, 0.1], [0, 2.05, 4.2, 0.1], [2.05, 0, 0.1, 4.2]]) { l1.add(box(w, 0.06, d, 0), 'brass', [x, 1.0, z]); l1.collider(x, z, w, d, { top: 1.1, bottom: 0.1, shadow: false }); }
    for (let i = 0; i < 9; i++) for (const [x, z] of [[-2 + i * 0.5, -2.05], [-2 + i * 0.5, 2.05], [2.05, -2 + i * 0.5]]) l1.add(cyl(0.015, 0.015, 1, 4), 'brass', [x, 0.5, z]);

    // ---- Turmspitze (offen, mit Geländer und Dach)
    const l2 = ctx.level(2, TOP_H);
    l2.floor('stoneLight', { uv: 1.5, hole });
    l2.enclose({ neighbor: 'railing', open: 'railing', height: TOP_H });
    l2.place('towerRoof', { radius: 7.4, height: 5.5 });
    l2.place('treasureChest', { at: [-5.6, 0, -5.4], rot: 0.7 });
    l2.place('moonScope', { at: [5.6, 0, -5.6], rot: -0.8 });
    l2.place('friendOwl', { at: [5.8, 0, 5.8], rot: -2.4, perch: 1.1, friend: 'bim', crow: true });
    l2.place('standSign', { at: [-4.4, 0, 4.6], rot: 2.4, text: 'Bitte nicht hinunterwinken. Doch, bitte hinunterwinken!', size: 28, width: 1.2, signHeight: 0.42 });
    l2.place('paintedEgg', { at: [6.2, 0, 0.6], id: 'ei-turmspitze' });
    // Ostseite offen: dort endet die Treppe
    for (const [x, z, w, d] of [[0, -2.05, 4.2, 0.1], [0, 2.05, 4.2, 0.1], [-2.05, 0, 0.1, 4.2]]) { l2.add(box(w, 0.06, d, 0), 'brass', [x, 1.0, z]); l2.collider(x, z, w, d, { top: 1.1, bottom: 0.1, shadow: false }); }
    l2.place('dust', { area: [14, 5, 14], count: 120 });
    // Ein Licht unter dem Turmdach
    l2.light([0, 4.6, 0], { color: '#ffd8a0', intensity: 6, distance: 12 });
  },
});
