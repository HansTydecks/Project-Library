import { defineRoom } from '../registry.js';
import { box } from '../geo.js';

// Ideen-Kabinett: lose Gedanken, Skizzen, halbe Pläne (content/ideas.json).
export default defineRoom({
  id: 'ideen',
  name: 'Ideen-Kabinett',
  description: 'Lose Ideen, Skizzen und halbe Pläne – an der Pinnwand und in der Luft.',
  keywords: ['ideen', 'idee', 'notizen', 'skizzen', 'gedanken', 'pläne', 'brainstorm'],
  cell: [-1, 0],
  height: 5.5,
  spawn: { at: [3, 3], yaw: Math.PI / 2 },
  atmosphere: { fog: '#3a2448', density: 0.014, ambient: 1.4, ambientColor: '#e8c8ff', moon: 0 },
  build(ctx) {
    ctx.floor('parquet');
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'wpPurple' });
    ctx.foundation();
    const { hw, hd } = ctx;

    ctx.place('rug', { at: [0, 0, 0], width: 6, depth: 5, material: 'carpetBlue' });
    // Große Pinnwand an der Westwand
    const west = ctx.wallFrame('west', 0.42);
    // (Mitte bleibt frei: dort ist die Tür zum Teesalon)
    west.place('corkboard', { at: [-4.4, 2.2, 0], width: 5, height: 2.6, max: 30 });
    west.place('sconce', { at: [-1.6, 2.8, 0], light: false });
    west.place('sconce', { at: [-7.2, 2.8, 0], light: false });

    // Schreibtisch mit Schreibmaschine
    ctx.place('desk', { at: [-4.8, 0, -5.2], rot: Math.PI / 2 });
    ctx.place('typewriter', { at: [-4.8, 0.83, -5.2], rot: Math.PI / 2, secret: 'schreibmaschine' });
    ctx.place('inkwell', { at: [-4.7, 0.83, -4.4] });
    ctx.place('chair', { at: [-3.8, 0, -5.2], rot: -Math.PI / 2 });
    ctx.place('bankerLamp', { at: [-5.0, 0.83, -6.0], rot: Math.PI / 2 });

    // Skizzen-Regal (Ideen mit "room": "ideen" & "shelf": "skizzen" in projects.json)
    ctx.wallShelves('east', { id: 'skizzen', unit: 2, height: 3.0, margin: 1, maxUnits: 2 });
    ctx.wallShelves('north', { id: '_ideen', unit: 2, height: 3.0, margin: 0.6, maxUnits: 4 });

    // Schwebende Zettel über dem Teppich
    ctx.place('floatingNotes', { at: [1, 0, 0.5], y: 2.4, radius: 2.4, count: 9, offset: 0 });
    ctx.place('ideaJar', { at: [2.0, 0.62, 5.4], secret: 'geistesblitze' });
    ctx.place('sideTable', { at: [2.0, 0, 5.4] });
    ctx.place('armchair', { at: [3.4, 0, 5.6], rot: Math.PI + 0.5, cushion: 'velvetBlue', blanket: 'velvet', quip: 'In diesem Sessel kommen einem die besten Ideen. Leider auch die schlechtesten.' });
    ctx.place('floorLamp', { at: [4.6, 0, 6.6], intensity: 4 });
    ctx.place('cat', { at: [-4.8, 0.83, -6.3], rot: Math.PI / 2, secret: 'katze-ideen', name: 'Rote Katze' });
    ctx.place('pottedPlant', { at: [-6.6, 0, 6.6], scale: 1.2, leaf: 'leavesPink' });
    ctx.place('painting', { at: [3, 2.9, -hd + 0.46], motif: 'abstract', title: '»Idee Nr. 7« (unvollendet)', caption: 'Der Künstler hatte eine Idee, wurde aber unterbrochen. Seitdem wartet das Bild.' });

    // Leuchtende Glühbirne unter der Decke (Ideen-Symbol)
    ctx.add(box(0.02, 1.4, 0.02, 0), 'iron', [1, 4.8, 0.5]);
    ctx.place('lantern', { at: [1, 3.9, 0.5], hanging: true, chain: 0.9, color: '#ffe68a', intensity: 9, distance: 10 });
    ctx.place('bubbles', { at: [1, 0, 0.5], y: 0.6, area: [4, 4, 4], count: 16 });
    ctx.place('paperPlanes', { at: [1, 0, 0.5], y: 3.2, radius: 3, count: 4 });
    ctx.place('standSign', { at: [5.6, 0, -3], rot: -0.6, text: 'Ideen bitte frei herumlaufen lassen.', size: 32, width: 1.0, signHeight: 0.36 });
    ctx.place('singingFlower', { at: [6.4, 0, 6.4], color: 'lilac', height: 1.1, name: 'Ideenblume', quip: 'Die Ideenblume singt nur Lieder, die es noch nicht gibt. Dieses hier ist neu. Gerade eben.' });
    ctx.place('dust', { area: [14, 4.5, 14], color: '#e8d0ff' });
  },
});
