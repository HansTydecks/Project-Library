import { defineRoom } from '../registry.js';
import { box, cyl } from '../geo.js';

// Das Foyer: Hier beginnt alles. Der Bibliothekar wartet hinter dem Tresen.
export default defineRoom({
  id: 'foyer',
  name: 'Foyer',
  description: 'Der Eingang. Hier sitzt der Bibliothekar.',
  keywords: ['eingang', 'start', 'empfang', 'bibliothekar', 'zauberer', 'anfang'],
  cell: [0, 0],
  height: 6.5,
  spawn: { at: [0, 5.5], yaw: 0 },
  atmosphere: { fog: '#3a2630', density: 0.012, ambient: 1.4, ambientColor: '#ffd8b0', moon: 0 },
  build(ctx) {
    ctx.floor('marble', { uv: 4 });
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'wpGreen' });
    ctx.foundation();

    // Läufer vom Eingang zum Tresen
    ctx.place('rug', { at: [0, 0, 3], width: 2.4, depth: 7, material: 'carpetRed' });
    ctx.place('rug', { at: [0, 0, -3.8], width: 5, depth: 3.2, material: 'carpetBlue' });

    // Empfangstresen + Bibliothekar
    ctx.place('receptionDesk', { at: [0, 0, -1.2] });
    ctx.place('wizard', { at: [0, 0, -3.1] });
    ctx.place('bell', { at: [0.9, 1.11, -1.0] });
    ctx.place('candelabra', { at: [-1.3, 1.11, -1.4] });
    ctx.place('crystalBall', { at: [0, 1.11, -1.0], interact: false });
    ctx.place('hourglass', { at: [1.6, 1.11, -1.6] });
    ctx.place('bookPile', { at: [-0.8, 1.11, -1.05], count: 4 });
    // Gästebuch
    ctx.add(box(0.5, 0.04, 0.35, 0), 'cream', [-0.35, 1.13, -0.8], [0, 0.2, 0]);
    ctx.add(box(0.52, 0.02, 0.37, 0), 'velvet', [-0.35, 1.115, -0.8], [0, 0.2, 0]);
    ctx.hitbox([-0.35, 1.15, -0.8], [0.6, 0.15, 0.45], {
      label: 'Gästebuch', verb: 'Lesen',
      onInteract: () => ctx.kit.services.ui.note('Gästebuch', '»War hier. Habe mich verlaufen. Würde es wieder tun.« – Ein Besucher\n\n»Die Katze im Ideen-Kabinett hat mich ignoriert. 10/10.« – Noch ein Besucher\n\n»Wo ist der Ausgang?« – Ein dritter Besucher (Seite 1 von 1.204)'),
    });

    // Sortierwagen & Neuerscheinungen
    ctx.place('bookcart', { at: [-5.6, 0, 4.2], rot: Math.PI / 2 });
    ctx.place('newArrivals', { at: [4.6, 0, 3.0], rot: -Math.PI / 2 - 0.3, count: 4 });

    // Wandregale links/rechts der Türen
    for (const side of ['east', 'west']) ctx.wallShelves(side, { id: '_foyer', unit: 1.8, height: 3.4, margin: 0.3 });
    ctx.place('grandfatherClock', { at: [-6.6, 0, -6.6], rot: Math.PI / 4, secret: 'standuhr' });
    ctx.place('globe', { at: [6.2, 0, -6.2], secret: 'globus' });
    ctx.place('pottedPlant', { at: [-6.8, 0, 6.8], scale: 1.4 });
    ctx.place('pottedPlant', { at: [6.8, 0, 6.8], scale: 1.4 });
    ctx.place('pottedPlant', { at: [-2.2, 0, 7.0] });
    ctx.place('pottedPlant', { at: [2.2, 0, 7.0] });
    ctx.place('armchair', { at: [5.2, 0, -4.5], rot: -Math.PI / 2 - 0.5, cushion: 'velvetGreen' });
    ctx.place('sideTable', { at: [6.0, 0, -3.3] });
    ctx.place('teaSet', { at: [6.0, 0.62, -3.3], secret: 'tee' });

    // Gemälde
    ctx.place('painting', { at: [-2.8, 3.6, -7.55], motif: 'wizard', title: 'Porträt: Der Bibliothekar (jung)', caption: 'Er behauptet, das sei vor 900 Jahren gemalt worden. Der Hut sei »damals modern« gewesen.' });
    ctx.place('painting', { at: [2.8, 3.6, -7.55], motif: 'library', title: 'Die Bibliothek von außen', caption: 'Niemand weiß, wer das gemalt hat. Von außen hat sie noch nie jemand gesehen.' });

    // Licht
    ctx.place('chandelier', { at: [0, 0, 1.5], y: 4.9, chain: 1.6, radius: 1.1, candles: 10, intensity: 16 });
    for (const [x, z, r] of [[-7.55, 2, Math.PI / 2], [7.55, 2, -Math.PI / 2], [-7.55, -4, Math.PI / 2], [7.55, -4, -Math.PI / 2]]) {
      ctx.place('sconce', { at: [x, 2.6, z], rot: r, light: false });
    }
    ctx.sign('Willkommen! Bitte leise wandeln.', [0, 4.5, -7.5], 0, { w: 3.4, h: 0.55, size: 48 });
    // Verspielte Mitbewohner
    ctx.place('walkingBook', { at: [4.6, 0, 5.6], radius: 1.1, secret: 'laufbuch' });
    ctx.place('standSign', { at: [1.9, 0, 6.4], rot: -0.3, text: 'Bitte nicht die Bücher füttern.' });
    ctx.place('dustBunny', { at: [-5.8, 0, -1.5], area: 2.5, secret: 'staubmaus' });
    ctx.place('balloonBooks', { at: [-4.2, 0, 0.5], y: 3.6, count: 3, radius: 0.9 });
    ctx.place('paperPlanes', { at: [0, 0, 2], y: 4.0, radius: 4.5, count: 3 });
    ctx.place('dust', { area: [14, 5, 14] });

    // Säulen
    for (const [x, z] of [[-3.5, 1.5], [3.5, 1.5]]) {
      ctx.add(cyl(0.32, 0.38, 6.5, 14), 'stoneLight', [x, 3.25, z]);
      ctx.add(box(0.9, 0.3, 0.9, 1), 'stoneDark', [x, 0.15, z]);
      ctx.add(box(0.9, 0.3, 0.9, 1), 'stoneDark', [x, 6.35, z]);
      ctx.collider(x, z, 0.8, 0.8);
    }
  },
});
