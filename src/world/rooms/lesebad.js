import { defineRoom } from '../registry.js';

// Lesebad: Das Becken ist so dicht beschrieben, dass man auf dem Wasser laufen kann.
export default defineRoom({
  id: 'lesebad',
  name: 'Lesebad',
  description: 'Ein Becken, auf dessen Wasser man laufen kann, Bücherflöße, eine Enten-Armada und ein Schaumbad.',
  keywords: ['bad', 'wasser', 'baden', 'schwimmen', 'enten', 'schaum', 'becken', 'pool', 'entspannen', 'wellness'],
  cell: [-1, 2],
  height: 6,
  spawn: { at: [0, -5.5], yaw: Math.PI },
  atmosphere: { fog: '#2a4458', density: 0.01, ambient: 1.4, ambientColor: '#e0f4ff', moon: 0 },
  build(ctx) {
    const { hd } = ctx;
    ctx.floor('tilesWhite', { uv: 1 });
    ctx.ceiling('plaster');
    ctx.enclose({ inner: 'tilesBlue', wainscot: false, trim: 'white' });
    ctx.foundation();

    ctx.place('bathPool', { at: [-1.2, 0, 0], width: 8, depth: 6 });
    // Bücherflöße → Leseinsel
    for (const [x, z, c] of [[-4, 1.4, '#c0405a'], [-2.4, -1.2, '#3a6ac0'], [-0.6, 1.2, '#3a9a6a']]) ctx.place('floatingIsland', { at: [x, 0, z], y: 0.55, width: 1.3, depth: 1.0, kind: 'book', color: c });
    ctx.place('floatingIsland', { at: [1.4, 0, -1], y: 0.75, width: 2.0, depth: 2.0, kind: 'book', color: '#e0a030' });
    ctx.place('rubberDuck', { at: [1.4, 0.75, -1], scale: 2, crown: true, name: 'Kapitänsente', secret: 'kapitaensente', secretName: 'Die Kapitänin der Enten-Armada', quip: '»Alle Enten an Deck!« Die Armada salutiert. Quiek.' });
    // Enten-Armada
    for (let i = 0; i < 7; i++) ctx.place('rubberDuck', { at: [-4.4 + i * 0.9, 0.12, -2.2 + (i % 3) * 0.3], float: true, rot: Math.PI / 2, scale: 1.1, name: 'Matrosenente', quip: 'Die Matrosenente quiekt im Takt. Sie probt für die Parade.' });
    ctx.place('clawTub', { at: [4.6, 0, 5], length: 1.8, secret: 'schaumbad' });
    ctx.place('clothesline', { at: [-3.6, 0, 5.8], length: 4.5, height: 2.1, count: 6 });
    ctx.place('towelStack', { at: [6.6, 0, -6.6] });
    ctx.place('towelStack', { at: [6.6, 0, 1.6], count: 3 });
    ctx.place('penguin', { at: [0, 0, 0], friend: 'pingo', from: [-5.2, 0, -4.2], to: [3, 0, -4.2],
      wants: { item: 'fischkeks', egg: 'pingo-fisch', eggName: 'Pingo einen Fischkeks geschenkt', text: 'Pingo schnappt sich den Fischkeks, schluckt ihn in einem Happs – und tanzt vor Freude im Kreis!' } });
    ctx.place('bubbles', { at: [-1, 0, 0], y: 0.3, area: [7, 4, 5], count: 18 });
    ctx.place('pottedPlant', { at: [-6.6, 0, -6.6], scale: 1.4 });
    ctx.place('pottedPlant', { at: [6.6, 0, 6.8], scale: 1.2, leaf: 'leavesPink' });
    ctx.place('armchair', { at: [5.4, 0, -4.6], rot: -2.2, cushion: 'velvetBlue', quip: 'Ein Bademantel liegt über der Lehne. Er ist bestickt: »Lies dich warm.«' });
    ctx.place('standSign', { at: [4.2, 0, -2.8], rot: -0.5, text: 'Bitte nicht vom Beckenrand lesen. Nur im Becken.', size: 30, width: 1.1, signHeight: 0.38 });
    ctx.place('lantern', { at: [-1.2, 4.2, 0], hanging: true, chain: 1.4, color: '#c8eeff', intensity: 8, distance: 12 });
    ctx.place('lantern', { at: [5, 4.2, 5], hanging: true, chain: 1.4, color: '#ffe0f0', intensity: 5, distance: 8 });
    // --- Kleine Baddetails
    const west = ctx.wallFrame('west', 0.42), north = ctx.wallFrame('north', 0.42);
    west.place('magicWindow', { at: [0, 0, 0], y: 2.5, width: 1.8, height: 1.4, mode: 'sea', curtain: 'velvetBlue', quip: 'Ein Meer ohne Ufer. Die Enten-Armada plant schon die Überfahrt.' });
    north.place('wallShelfSmall', { at: [-4.8, 0, 0], y: 1.5, width: 1.4, wood: 'white' });
    ctx.place('fishBowl', { at: [-6.8, 0, 3.2], name: 'Badegoldfische', quips: ['Die Goldfische finden das große Becken nebenan etwas angeberisch.', 'Blubb. (Übersetzung: »Wir baden auch. Immer.«)', 'Ein Fisch trägt eine winzige Badekappe. Sagt er.'] });
    // Signalflaggen der Enten-Armada quer durch den Raum
    ctx.place('bunting', { at: [0, 0, -3.0], y: 4.5, length: 15.1, sag: 0.8, colors: ['pastelSky', 'white', 'pastelPink', 'pastelLemon', 'pastelMint'] });
    ctx.place('hangingPlant', { at: [-6.6, 0, -6.4], top: 6, y: 3.8, scale: 1.2 });
    ctx.place('hangingPlant', { at: [6.5, 0, 3.4], top: 6, y: 3.6, leaf: 'leavesPink' });
    ctx.place('crystalCluster', { at: [-7.0, 0, 7.0], color: '#9ad8ff' });
    ctx.place('sideTable', { at: [6.7, 0, -3.2] });
    ctx.place('snowGlobe', { at: [6.7, 0.63, -3.2], house: 'pastelSky', quip: 'In der Kugel schneit es auf ein winziges Badehaus. Pingo hätte auch gern so eins.' });
    ctx.sign('Lesebad – Bücher bitte nicht tunken', [0, 3.8, hd - 0.46], Math.PI, { w: 4, h: 0.5, size: 40 });
    ctx.place('dust', { area: [14, 5, 14], color: '#d8f4ff' });
    ctx.place('fishingSpot', { at: [0.6, 0, 3.6], rot: Math.PI }); // Minispiel: Bücher-Angeln
  },
});
