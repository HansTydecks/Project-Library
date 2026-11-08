import { defineRoom } from '../registry.js';

// Wintergarten der singenden Blumen: unter einem Glasdach wächst, was gute Laune hat.
export default defineRoom({
  id: 'wintergarten',
  name: 'Wintergarten der singenden Blumen',
  description: 'Unter dem Glasdach singen Blumen, Kakteen tragen Hüte und eine Gießkanne gießt von selbst.',
  keywords: ['pflanzen', 'blumen', 'garten', 'glas', 'gewächshaus', 'singen', 'kaktus', 'schmetterling', 'grün', 'natur'],
  cell: [1, 2],
  height: 6,
  spawn: { at: [0, -5], yaw: Math.PI },
  atmosphere: { fog: '#2a4a40', density: 0.01, ambient: 1.35, ambientColor: '#e0ffe8', moon: 0.5 },
  build(ctx) {
    const { hd } = ctx;
    ctx.floor('stoneLight', { uv: 1.5 });
    ctx.ceiling('glassRoof', { roof: false, beams: 'iron' });
    ctx.enclose({ inner: 'wpMint', wainscot: 'paneling', trim: 'white' });
    ctx.foundation();

    // Singende Blumen entlang der Südwand
    const cols = ['yellow', 'pink', 'blue', 'lilac', 'yellow'];
    cols.forEach((c, i) => ctx.place('singingFlower', { at: [-5 + i * 2.5, 0, 6.3], color: c, height: 1.2 + (i % 2) * 0.4, secret: i === 2 ? 'singende-blume' : undefined, name: i === 2 ? 'Die Diva' : undefined, quip: i === 2 ? 'Die Diva singt nur für Publikum. Heute: du. Sie ist begeistert.' : undefined }));
    // Kakteen auf dem Pflanztisch
    ctx.place('table', { at: [5, 0, -1], width: 2.4, depth: 1, material: 'woodLight' });
    ctx.place('hatCactus', { at: [4.3, 0.81, -1], hat: 'top', name: 'Herr Stachel' });
    ctx.place('hatCactus', { at: [5.1, 0.81, -1.1], hat: 'sombrero', height: 0.45, name: 'Señor Piks', quip: 'Señor Piks hat den Hut aus dem Urlaub. Er war noch nie im Urlaub.' });
    ctx.place('hatCactus', { at: [5.8, 0.81, -0.9], hat: 'party', height: 0.35, name: 'Feierkaktus', secret: 'feierkaktus', secretName: 'Der Kaktus mit Partyhut', quip: 'Heute ist sein Geburtstag. Jeden Tag. Er ist sehr glücklich.' });
    // Gießkanne über dem Beet
    ctx.place('flowers', { at: [-4.5, 0, -2], width: 4, depth: 2.4 });
    ctx.place('wateringCan', { at: [-4.5, 0, -2], y: 1.9, color: 'pastelPink' });
    ctx.place('friendGolem', { at: [-2, 0, -3.9], rot: 0.5, friend: 'moos' });
    ctx.place('hammock', { at: [-2.5, 0, 2.8], length: 3, secret: 'hängematte' });
    ctx.place('butterflies', { at: [0, 0, 0], area: [12, 2.5, 12], count: 10, y: 0.8 });
    ctx.place('tree', { at: [6.4, 0, 6.4], lanterns: true });
    ctx.place('tree', { at: [-6.4, 0, -6.4] });
    for (const [x, z] of [[6.6, -6.6], [-6.6, 6.6], [2, -6.6]]) ctx.place('pottedPlant', { at: [x, 0, z], scale: 1.5, leaf: x > 0 ? 'leaves' : 'leavesPink' });
    ctx.place('bench', { at: [1.5, 0, 3.6], rot: Math.PI });
    ctx.place('lilyPond', { at: [2.8, 0, -4.4], radius: 1.2 });
    ctx.place('standSign', { at: [-0.8, 0, 4.6], rot: 0.3, text: 'Bitte nicht mitsingen. (Doch. Bitte mitsingen.)', size: 30, width: 1.1, signHeight: 0.38 });
    ctx.place('lantern', { at: [0, 4.4, 0], hanging: true, chain: 1.2, color: '#ffe8a0', intensity: 7, distance: 11 });
    ctx.place('lantern', { at: [-4, 4.4, 4], hanging: true, chain: 1.2, color: '#ffc8e8', intensity: 5, distance: 8 });
    // --- Kleine Gewächshausdetails
    // Hängepflanzen unter dem Glasdach
    ctx.place('hangingPlant', { at: [4.6, 0, 3.4], top: 6, y: 3.9 });
    ctx.place('hangingPlant', { at: [-6.4, 0, 2.8], top: 6, y: 3.7, leaf: 'leavesPink', scale: 1.2 });
    ctx.place('hangingPlant', { at: [3.4, 0, -2.6], top: 6, y: 4.0, pot: 'porcelainBlue' });
    // Nordwand: zwei Bretter mit Ablegern und Krimskrams
    const north = ctx.wallFrame('north', 0.42), east = ctx.wallFrame('east', 0.42), south = ctx.wallFrame('south', 0.42);
    north.place('wallShelfSmall', { at: [-4.4, 0, 0], y: 1.6, width: 1.2, wood: 'white' });
    north.place('wallShelfSmall', { at: [4.4, 0, 0], y: 1.6, width: 1.2, wood: 'white' });
    // Westwand: Porträt des Gärtners Gustav
    ctx.wallFrame('west', 0.42).place('portrait', { at: [-4.6, 2.3, 0], subject: 'igel', bg: '#4a7a4a', frame: 'woodLight' });
    // Ostwand: Zauberfenster mit Blumenkästen darunter
    east.place('magicWindow', { at: [-4.6, 0, 0], y: 2.3, width: 1.4, height: 1.3, mode: 'day', curtain: 'velvetGreen', quip: 'Draußen blüht eine Wiese, die es gar nicht gibt. Die Blumen hier drin sind ein bisschen neidisch.' });
    ctx.place('planter', { at: [7.0, 0, -4.6], rot: Math.PI / 2, width: 1.6 });
    ctx.place('planter', { at: [7.0, 0, 4.4], rot: Math.PI / 2, width: 2.0 });
    // Gartenbücher auf dem Kakteentisch, Kissen neben der Hängematte
    ctx.place('bookPile', { at: [6.0, 0.81, -1.3], count: 3 });
    ctx.place('cushionPile', { at: [-5.6, 0, 4.6], colors: ['velvetGreen', 'pastelMint', 'pastelLemon', 'pastelPink'] });
    // Wimpel über dem Blumenchor
    south.place('bunting', { at: [0, 0, 0.1], y: 3.1, length: 13, sag: 0.45 });
    ctx.sign('Wintergarten – Hier wächst gute Laune', [0, 3.8, hd - 0.46], Math.PI, { w: 4, h: 0.5, size: 40 });
    ctx.place('dust', { area: [14, 5, 14] });
  },
});
