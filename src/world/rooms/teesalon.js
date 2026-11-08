import * as THREE from 'three';
import { defineRoom } from '../registry.js';
import { Frame } from '../kit.js';
import { box } from '../geo.js';

// Teesalon der schwebenden Tassen: Hier ist immer Viertel nach Teezeit.
export default defineRoom({
  id: 'teesalon',
  name: 'Teesalon der schwebenden Tassen',
  description: 'Kannen gießen von selbst, Tassen fliegen im Kreis, und an der Decke sitzt jemand verkehrt herum.',
  keywords: ['tee', 'teesalon', 'kuchen', 'torte', 'tasse', 'kanne', 'pause', 'gemütlich', 'kaffee'],
  cell: [-2, 0],
  height: 6,
  spawn: { at: [5, 0], yaw: Math.PI / 2 },
  atmosphere: { fog: '#4a3044', density: 0.012, ambient: 1.45, ambientColor: '#ffd8ea', moon: 0 },
  build(ctx) {
    const H = ctx.height;
    ctx.floor('parquet');
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'wpPink', trim: 'white', wainscot: 'paneling' });
    ctx.foundation();

    ctx.place('rug', { at: [-1.5, 0, 1], width: 4, depth: 8, material: 'carpetBlue' });
    // Lange Teetafel (entlang z)
    ctx.place('table', { at: [-1.5, 0, 1], width: 6.4, depth: 1.5, rot: Math.PI / 2, material: 'woodLight' });
    ctx.add(box(1.7, 0.02, 6.6, 0), 'tablecloth', [-1.5, 0.82, 1]);
    for (const z of [-2, 0, 2, 4]) ctx.add(box(1.72, 0.25, 0.02, 0), 'tablecloth', [-1.5, 0.7, z]);
    const chairMats = ['velvet', 'velvetGreen', 'velvetBlue', 'velvet'];
    [-1.4, 0.2, 1.8, 3.4].forEach((z, i) => {
      ctx.place('chair', { at: [-2.6, 0, z], rot: -Math.PI / 2, cushion: chairMats[i] });
      ctx.place('chair', { at: [-0.4, 0, z + 0.4], rot: Math.PI / 2, cushion: chairMats[(i + 1) % 4], material: i % 2 ? 'woodLight' : 'woodDark' });
    });
    ctx.place('armchair', { at: [-1.5, 0, 5.2], rot: Math.PI, cushion: 'velvet', quip: 'Der Ehrenplatz. Auf dem Kissen steht »Für den Gast, der zu spät kommt«. Passt.' });
    // Gedeck
    const ty = 0.83;
    ctx.place('cake', { at: [-1.5, ty, 1], secret: 'torte' });
    ctx.place('teapot', { at: [-1.5, ty, -1.2], rot: 0.4 });
    ctx.place('teapot', { at: [-1.6, ty, 3.4], rot: 2, color: 'pastelPink', scale: 0.8 });
    ctx.place('friendTeapot', { at: [-1.5, ty, -0.25], rot: Math.PI / 2, friend: 'mirabelle', wants: { item: 'honig', egg: 'honigtee', eggName: 'Honigtee für Mirabelle', text: 'Honig! Vom Dach? Oh, ich koche sofort einen Honigtee. Für alle! Für immer!' } });
    ctx.place('pickup', { at: [3.55, 0.62, 6.8], item: 'keks' });
    ctx.place('sugarTower', { at: [-1.2, ty, 2.3] });
    for (const z of [-1.8, -0.4, 0.4, 2.0, 2.9, 3.8]) {
      ctx.place('teacup', { at: [-2.05, ty, z], color: z > 1 ? 'pastelMint' : 'porcelain' });
      ctx.place('teacup', { at: [-0.95, ty, z + 0.3], color: z > 1 ? 'porcelain' : 'pastelPink' });
    }
    ctx.place('paintedEgg', { at: [-1.5, 0, 2.6], id: 'ei-teetisch' });
    ctx.place('bookPile', { at: [-1.2, ty, -2], count: 3 });

    // Kopfüber-Ecke: Tisch und Stühle kleben an der Decke
    const up = new Frame(ctx.kit, ctx.matrix.clone().multiply(new THREE.Matrix4().makeTranslation(3.6, H, -3.6)).multiply(new THREE.Matrix4().makeRotationZ(Math.PI)), 0);
    up.place('table', { width: 1.4, depth: 1.4, material: 'woodLight' });
    up.place('chair', { at: [0, 0, 1.0], rot: Math.PI, cushion: 'velvetGreen' });
    up.place('chair', { at: [0, 0, -1.0], cushion: 'velvetBlue' });
    up.place('teaSet', { at: [0, 0.8, 0] });
    ctx.place('standSign', { at: [3.6, 0, -1.6], text: 'Kopfüber-Ecke: Für Gäste, die die Welt gern anders sehen.', size: 30, width: 1.2, signHeight: 0.4 });

    // Magie: Kanne gießt endlos, Tassen kreisen um den Kronleuchter
    ctx.place('pouringTeapot', { at: [4.2, 0, 3.5], y: 2.0, secret: 'ewige-kanne' });
    ctx.place('pedestal', { at: [4.2, 0, 3.5] });
    ctx.place('chandelier', { at: [-1.5, 0, 1], y: 4.6, chain: 1.2, radius: 1, candles: 10, intensity: 16 });
    ctx.place('orbitingCups', { at: [-1.5, 0, 1], y: 3.4, radius: 2.2, count: 9 });

    // Riesentasse mit Ente
    ctx.place('teacup', { at: [5.5, 0, -6], scale: 4, color: 'pastelSky' });
    ctx.place('rubberDuck', { at: [5.5, 0.12, -6], scale: 1.2, float: true, name: 'Tee-Ente', quip: 'Die Ente badet in Kamillentee. Sie sagt, das sei gut für die Federn.' });

    // Gemütliche Ecke & Regale
    ctx.place('sofa', { at: [5.6, 0, 6.6], rot: Math.PI, cushion: 'velvet' });
    ctx.place('sideTable', { at: [3.8, 0, 6.6] });
    ctx.place('teacup', { at: [3.8, 0.62, 6.6] });
    ctx.place('floorLamp', { at: [7, 0, 5], intensity: 5 });
    ctx.wallShelves('west', { id: '_tee', unit: 2, height: 2.6, maxUnits: 6 });
    ctx.place('pottedPlant', { at: [6.6, 0, -6.6], scale: 1.4, leaf: 'leavesPink' });
    ctx.place('pottedPlant', { at: [-6.8, 0, 6.8], scale: 1.2, leaf: 'leavesPink' });
    ctx.place('painting', { at: [2.5, 3.2, ctx.hd - 0.46], rot: Math.PI, motif: 'cat', title: 'Lady Earl Grey', caption: 'Sie trinkt ihren Tee nur bei exakt 82 Grad. Und nur aus deiner Tasse.' });
    ctx.place('dustBunny', { at: [-1.5, 0, 0.5], area: 2.5, color: '#f0c8e0', secret: 'staubmaus-tee' });
    ctx.sign('Teesalon – Hier ist immer Viertel nach Teezeit', [0, 4.7, ctx.hd - 0.46], Math.PI, { w: 4.4, h: 0.55, size: 40 });
    for (const [x, z, r] of [[-7.55, -3, Math.PI / 2], [-7.55, 4, Math.PI / 2]]) ctx.place('sconce', { at: [x, 2.6, z], rot: r, light: false });
    ctx.place('dust', { area: [14, 5, 14] });
  },
});
