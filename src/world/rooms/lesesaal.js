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
    // Lücke im westlichen Geländer: dort kommt die Wendeltreppe an
    const gap = [11.4, 13.6];
    for (const sx of [-1, 1]) {
      for (let z = -hd + 2; z <= hd - 1; z += 0.4) {
        if (sx < 0 && z > gap[0] && z < gap[1]) continue;
        ctx.add(box(0.05, 0.9, 0.05, 0), 'brass', [sx * (hw - 2), gy + 0.55, z]);
      }
      const spans = sx < 0 ? [[-hd + 2, gap[0]], [gap[1], hd - 1]] : [[-hd + 2, hd - 1]];
      for (const [z0, z1] of spans) {
        ctx.add(box(0.08, 0.06, z1 - z0, 1), 'brass', [sx * (hw - 2), gy + 1.0, (z0 + z1) / 2]);
        ctx.collider(sx * (hw - 2), (z0 + z1) / 2, 0.12, z1 - z0, { top: gy + 1.2, bottom: gy + 0.1, shadow: false });
      }
    }
    // Begehbare Galerie: Böden, Geländer, Regalfront
    ctx.collider(0, -hd + 1.2, ctx.b.w - 1, 1.6, { top: gy + 0.1, bottom: gy - 0.1, shadow: false });
    ctx.collider(-hw + 1.2, 0, 1.6, ctx.b.d - 1, { top: gy + 0.1, bottom: gy - 0.1, shadow: false });
    ctx.collider(hw - 1.2, 0, 1.6, ctx.b.d - 1, { top: gy + 0.1, bottom: gy - 0.1, shadow: false });
    ctx.collider(0, -hd + 2, ctx.b.w - 2, 0.12, { top: gy + 1.2, bottom: gy + 0.1, shadow: false });
    ctx.collider(0, -hd + 0.62, ctx.b.w, 0.45, { top: gy + 4, bottom: gy + 0.1, shadow: false });
    ctx.collider(-hw + 0.62, 0, 0.45, ctx.b.d, { top: gy + 4, bottom: gy + 0.1, shadow: false });
    ctx.collider(hw - 0.62, 0, 0.45, ctx.b.d, { top: gy + 4, bottom: gy + 0.1, shadow: false });
    // Wendeltreppe (Südwest) + Absatz zur Galerie
    ctx.place('spiralStairs', { at: [-20, 0, 12.5], height: gy + 0.1, steps: 22, turns: 1.35, radius: 1.5, end: Math.PI });
    // Absatz nur zwischen oberster Stufe und Galerie (sonst stößt man auf den letzten Stufen dagegen)
    ctx.add(box(0.95, 0.2, 2.2, 1), 'woodDark', [-21.62, gy, 12.5]);
    ctx.collider(-21.62, 12.5, 0.95, 2.2, { top: gy + 0.1, bottom: gy - 0.1, shadow: false });
    ctx.place('standSign', { at: [-17.6, 0, 14.4], rot: Math.PI * 0.85, text: 'Zur Galerie ↑ (Bitte nicht übers Geländer lehnen. Außer zum Winken.)', size: 26, width: 1.3, signHeight: 0.42 });
    // Oben auf der Galerie
    ctx.place('cat', { at: [6, gy + 0.1, -hd + 1.4], rot: 0.3, fur: 'beard', name: 'Galeriekatze', secret: 'galeriekatze', secretName: 'Die Katze auf der Galerie', quip: 'Die Galeriekatze hat den besten Überblick. Sie zählt die Leser. Du bist Nummer eins.' });
    ctx.place('paintedEgg', { at: [21, gy + 0.1, -hd + 1.5], id: 'ei-galerie' });
    ctx.place('friendKnight', { at: [-11, gy + 0.1, -hd + 1.5], friend: 'rostfrei' });
    ctx.place('bookPile', { at: [-6, gy + 0.1, -hd + 1.5], count: 5 });
    ctx.place('candle', { at: [-hw + 1.3, gy + 0.1, 4], height: 0.3, intensity: 3 });
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
    ctx.sign('Endlose Stapel – Betreten auf eigene Gefahr', [0, 4.75, -hd + 0.5], 0, { w: 4.6, h: 0.55, size: 44 });
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

    // Kleine Details: Wimpel unter der Galerie (Mitte frei, dort hängt das Stapel-Schild)
    for (let x = -hw + 2.4; x + 6 < hw - 2; x += 6) {
      if (x < 0 && x + 6 > 0) continue;
      ctx.place('bunting', { at: [x + 3, 0, -hd + 2.15], length: 5.6, y: gy - 0.18, sag: 0.4, colors: ['pastelLemon', 'pastelPink', 'pastelSky', 'pastelMint'] });
    }
    // Papiersterne über den Seitengängen
    for (const sx of [-1, 1]) ctx.place('paperStars', { at: [sx * 6.5, 0, 0], area: [4.5, 24], top: 10, maxDrop: 2.2, count: 10, colors: ['pastelLemon', 'gold', 'pastelPink', 'pastelSky'] });
    // Südwand (ohne Regale): Zauberfenster und Porträts zwischen den Türen
    const south = ctx.wallFrame('south', 0.42);
    south.place('magicWindow', { at: [-5.5, 0, 0], y: 3.4, width: 1.6, height: 2.4, mode: 'day', curtain: 'velvet', quip: 'Ein Fenster in einen Himmel, den es nur hier gibt. Perfektes Leselicht, jeden Tag.' });
    south.place('magicWindow', { at: [5.5, 0, 0], y: 3.4, width: 1.6, height: 2.4, mode: 'sunset', curtain: 'velvet', quip: 'Hier geht die Sonne nie ganz unter. Damit niemand mitten im Kapitel aufhören muss.' });
    south.place('portrait', { at: [9.5, 3.2, 0], subject: 'katze', width: 0.9, height: 1.15, bg: '#8a3a3a', caption: 'Die Bibliothekskatze, gemalt im Großen Lesesaal. Sie lag dabei auf dem Buch, das der Maler gerade las.' });
    south.place('portrait', { at: [-9.5, 3.2, 0], subject: 'schaf', width: 0.9, height: 1.15, bg: '#3a5a7a', title: 'Wolle beim Lesen', caption: 'Wolle liest am liebsten Bücher über Wolken. Sie hält sie für entfernte Verwandte.' });
    south.place('wallShelfSmall', { at: [-20.5, 0, 0], y: 1.85, width: 1.2, wood: 'woodDark' });
    // Leseecke Südost: Sessel, Kerzen, Goldfische
    ctx.place('armchair', { at: [6.4, 0, 13.0], rot: Math.PI + 0.35, cushion: 'velvetGreen', quip: 'Der gemütlichste Sessel im Saal. Wer hier sitzt, liest grundsätzlich »nur noch ein Kapitel«.' });
    ctx.place('sideTable', { at: [7.65, 0, 13.55] });
    ctx.place('candleCluster', { at: [7.65, 0.62, 13.55], count: 3 });
    ctx.place('fishBowl', { at: [8.8, 0, 14.4], y: 1.0, name: 'Goldfischglas der Leseratten' });
    // Kissenecke Südwest
    ctx.place('cushionPile', { at: [-7.4, 0, 13.9], colors: ['velvet', 'velvetGreen', 'pastelLemon', 'pastelPink', 'velvetBlue'] });
    ctx.place('bookPile', { at: [-6.2, 0, 14.5], count: 4 });
  },
});
