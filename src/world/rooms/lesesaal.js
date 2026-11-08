import { defineRoom } from '../registry.js';
import { box, cyl } from '../geo.js';

// Der große Lesesaal: Hauptregale, nach Kategorien sortiert.
// Regal-IDs (für content/projects.json → "shelf"): apps, spiele, web, werkzeuge, kreativ, experimente
const BAYS = [
  { id: 'apps', label: 'Apps' },
  { id: 'spiele', label: 'Spiele' },
  { id: 'web', label: 'Webseiten' },
  { id: 'werkzeuge', label: 'Werkzeuge' },
  { id: 'kreativ', label: 'Kreatives' },
  { id: 'experimente', label: 'Experimente' },
];

export default defineRoom({
  id: 'lesesaal',
  name: 'Großer Lesesaal',
  description: 'Hohe Regale mit allen Apps & Projekten, nach Kategorien sortiert.',
  keywords: ['apps', 'projekte', 'regale', 'saal', 'spiele', 'werkzeuge', 'tools', 'web'],
  cell: [-1, -2],
  size: [3, 2],
  height: 10,
  spawn: { at: [0, 13], yaw: 0 },
  atmosphere: { skyHidden: true, fog: '#3a2a2a', density: 0.01, ambient: 1.35, ambientColor: '#ffd0a0', moon: 0 },
  shelves: BAYS,
  build(ctx) {
    ctx.floor('parquet', { uv: 2.5 });
    ctx.ceiling('plaster', { uv: 4 });
    ctx.enclose({ inner: 'wpRed' });
    ctx.foundation();
    const { hw, hd } = ctx;

    // Wände ringsum mit Regalen (Deko-Füllung)
    ctx.wallShelves('north', { id: '_nord', unit: 2, height: 4.2, margin: 0.4 });
    ctx.wallShelves('east', { id: '_ost', unit: 2, height: 4.2, margin: 0.4 });
    ctx.wallShelves('west', { id: '_west', unit: 2, height: 4.2, margin: 0.4 });

    // Galerie (umlaufende Empore, dekorativ)
    const gy = 4.9;
    for (const [x, z, w, d] of [[0, -hd + 1.2, ctx.b.w - 1, 1.6], [-hw + 1.2, 0, 1.6, ctx.b.d - 1], [hw - 1.2, 0, 1.6, ctx.b.d - 1]]) {
      ctx.add(box(w, 0.2, d, 2), 'woodDark', [x, gy, z]);
    }
    for (let x = -hw + 1; x <= hw - 1; x += 0.4) ctx.add(box(0.05, 0.9, 0.05, 0), 'brass', [x, gy + 0.55, -hd + 2]);
    ctx.add(box(ctx.b.w - 2, 0.06, 0.08, 1), 'brass', [0, gy + 1.0, -hd + 2]);
    for (const sx of [-1, 1]) {
      for (let z = -hd + 2; z <= hd - 1; z += 0.4) ctx.add(box(0.05, 0.9, 0.05, 0), 'brass', [sx * (hw - 2), gy + 0.55, z]);
      ctx.add(box(0.08, 0.06, ctx.b.d - 3, 1), 'brass', [sx * (hw - 2), gy + 1.0, 0.5]);
    }
    // Obere Regale auf der Galerie
    for (const side of ['north', 'east', 'west']) {
      const wf = ctx.wallFrame(side, 0.42);
      const L = side === 'north' ? ctx.b.w : ctx.b.d;
      for (let u = -L / 2 + 2; u < L / 2 - 2; u += 2) wf.place('bookcase', { at: [u + 1, gy + 0.1, 0.23], width: 2, height: 3.6, autoFill: true });
    }
    // Säulen unter der Galerie
    for (let x = -hw + 2.4; x < hw - 2; x += 6) ctx.add(cyl(0.15, 0.18, gy, 8), 'woodDark', [x, gy / 2, -hd + 2]);

    // Buchten mit freistehenden Doppelregalen: 3 links, 3 rechts vom Mittelgang
    BAYS.forEach((bay, i) => {
      const sx = i < 3 ? -1 : 1;
      const k = i % 3;
      const z = -hd + 6 + k * 8.5;
      const x = sx * 13;
      ctx.place('bookcaseDouble', { at: [x, 0, z], width: 2.2, height: 3.6, shelf: bay.id, label: bay.label });
      ctx.place('bookcaseDouble', { at: [x - 2.2, 0, z], width: 2.2, height: 3.6, shelf: bay.id });
      ctx.place('bookcaseDouble', { at: [x + 2.2, 0, z], width: 2.2, height: 3.6, shelf: bay.id });
      // Hängendes Kategorieschild
      ctx.sign(bay.label, [x, 4.4, z + 1.4], 0, { w: 2.2, h: 0.5 });
      ctx.add(cyl(0.01, 0.01, 5.4, 4), 'iron', [x - 0.9, 7.35, z + 1.4]);
      ctx.add(cyl(0.01, 0.01, 5.4, 4), 'iron', [x + 0.9, 7.35, z + 1.4]);
      ctx.place('ladder', { at: [x + sx * 1.6, 0, z + 0.47 + 0.95], rot: Math.PI });
    });

    // Lesetische im Mittelgang mit grünen Lampen
    for (let k = 0; k < 3; k++) {
      const z = -hd + 7 + k * 8;
      ctx.place('table', { at: [0, 0, z], width: 4.2, depth: 1.3, felt: true });
      for (const x of [-1.3, 1.3]) {
        ctx.place('bankerLamp', { at: [x, 0.81, z], light: x < 0 });
        ctx.place('chair', { at: [x, 0, z + 1.0], rot: Math.PI });
        ctx.place('chair', { at: [x, 0, z - 1.0] });
      }
      ctx.place('bookPile', { at: [0.2, 0.81, z + 0.2], count: 3 + k });
    }
    ctx.place('inkwell', { at: [-0.6, 0.81, -hd + 7.2] });
    ctx.place('cat', { at: [1.6, 0.81, -hd + 15.2], rot: 0.6, fur: 'furDark', name: 'Schwarze Katze', secret: 'katze-lesesaal', quip: 'Die schwarze Katze liegt auf genau dem Buch, das du lesen wolltest. Natürlich.' });

    // Eule oben auf einem Regal
    ctx.place('owl', { at: [hw - 0.8, gy + 3.8, -4], rot: -Math.PI / 2, secret: 'eule' });

    // Kronleuchter & schwebende Bücher
    ctx.place('chandelier', { at: [0, 0, -6], y: 7.0, chain: 2.6, radius: 1.5, candles: 12, intensity: 22, distance: 18 });
    ctx.place('chandelier', { at: [0, 0, 8], y: 7.0, chain: 2.6, radius: 1.5, candles: 12, intensity: 22, distance: 18 });
    ctx.place('floatingBooks', { at: [0, 0, 1], y: 6.2, radius: 5, count: 12 });
    ctx.place('dust', { area: [40, 8, 28], count: 500 });

    // Tor zu den Endlosen Stapeln
    ctx.sign('Endlose Stapel – Betreten auf eigene Gefahr', [0, 4.2, -hd + 0.5], 0, { w: 4.6, h: 0.55, size: 44 });
    ctx.place('signpost', { at: [2.6, 0, -hd + 2.6], signs: [['Endlose Stapel', Math.PI / 2], ['Foyer', -Math.PI / 2]] });

    // Kleine Wunder zwischen den Regalen
    ctx.place('paperPlanes', { at: [0, 0, 2], y: 5.2, radius: 9, count: 6 });
    ctx.place('bookworm', { at: [1.1, 0.81, -hd + 23.2], secret: 'buecherwurm' });
    ctx.place('walkingBook', { at: [0, 0, 11], radius: 2.2, color: '#3a9a6a', name: 'Ein Lexikon auf Morgenspaziergang' });
    ctx.place('snail', { at: [-6, 0, -hd + 2.2], length: 5, quip: 'Die Schnecke will zu den Endlosen Stapeln. Sie ist optimistisch.' });
    ctx.place('standSign', { at: [-2.6, 0, hd - 2.6], rot: 0.3, text: 'Ruhe bitte! (Flüstern erlaubt, Kichern geduldet.)', size: 32, width: 1.1, signHeight: 0.36 });
    ctx.place('balloonBooks', { at: [8, 0, -4], y: 6.6, count: 4, radius: 1.4 });
    // Wandleuchter an den Säulen
    for (let x = -hw + 5.4; x < hw - 2; x += 6) ctx.place('sconce', { at: [x, 3.2, -hd + 1.85], light: false });
  },
});
