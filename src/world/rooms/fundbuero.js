import { defineRoom } from '../registry.js';

// Geheimraum: nur über das Regal mit dem falschen Buch in der Sternwarte erreichbar.
export default defineRoom({
  id: 'fundbuero',
  name: 'Kabinett der verlorenen Dinge',
  description: 'Hier landet alles, was irgendwo verloren ging: Socken, Schirme, Schlüssel – und Gedanken.',
  keywords: ['verloren', 'fundbüro', 'socken', 'schlüssel', 'geheim'],
  cell: [3, -1],
  height: 5,
  hidden: true,
  secretDoors: ['sternwarte'],
  spawn: { at: [-5, 0], yaw: -Math.PI / 2 },
  atmosphere: { fog: '#3a2a48', density: 0.012, ambient: 1.35, ambientColor: '#f0d8ff', moon: 0 },
  build(ctx) {
    const { hd } = ctx;
    ctx.floor('parquet');
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'wpPurple', wainscot: 'paneling' });
    ctx.foundation();

    ctx.place('rug', { at: [0, 0, 0], width: 5, depth: 5, material: 'carpetBlue' });
    // Fundbüro-Schalter mit verschlafener Schnecke
    ctx.place('desk', { at: [3, 0, 0], rot: -Math.PI / 2, width: 2.6 });
    ctx.place('snail', { at: [3, 0.83, 0], length: 1.4, shell: 'pastelLilac', quip: 'Die Fundbüro-Schnecke stempelt deinen Besuch. Das dauert. Komm in einer Woche wieder.' });
    ctx.place('bell', { at: [2.8, 0.83, -0.9] });
    ctx.place('bookPile', { at: [3.2, 0.83, 0.9], count: 5 });
    ctx.place('sockPile', { at: [-3.5, 0, -4.5], secret: 'sockenberg' });
    ctx.place('umbrellaStand', { at: [5.8, 0, -5.8] });
    ctx.place('keyHeap', { at: [-1.5, 0, 0.4] });
    ctx.place('thoughtBox', { at: [0, 0, -5.8] });
    ctx.place('hatRack', { at: [5.8, 0, 5.6] });
    ctx.wallShelves('north', { id: '_fund', unit: 2, height: 3, maxUnits: 3 });
    ctx.wallShelves('south', { id: '_fund2', unit: 2, height: 3, maxUnits: 5 });
    ctx.place('rubberDuck', { at: [-3.5, 0.5, -4.4], name: 'Die verlorene Ente', secret: 'verlorene-ente', secretName: 'Die Ente, die sich verlaufen hat', quip: 'Sie hat sich nicht verlaufen. Sie wollte nur mal ihre Ruhe.' });
    ctx.place('teddy', { at: [-6.5, 0, 4], rot: 1.2, name: 'Teddy mit Fundzettel', secretName: 'Der Teddy im Fundbüro', secret: 'fundteddy', quip: 'Am Ohr hängt ein Zettel: »Gefunden unter einem Sofa, 1994. Wartet geduldig.«' });
    ctx.place('dustBunny', { at: [0, 0, 4], area: 3, color: '#e0d0f0' });
    ctx.place('standSign', { at: [-1.4, 0, 2.8], rot: 0.6, text: 'Fundbüro: Was du hier findest, hat dich gesucht.', size: 30, width: 1.1, signHeight: 0.38 });
    ctx.place('chandelier', { at: [0, 0, 0], y: 4, chain: 0.8, radius: 0.9, candles: 8, intensity: 11 });
    ctx.sign('Kabinett der verlorenen Dinge', [0, 3.6, hd - 0.46], Math.PI, { w: 3.8, h: 0.5, size: 40 });
    ctx.place('dust', { area: [14, 4, 14] });
  },
});
