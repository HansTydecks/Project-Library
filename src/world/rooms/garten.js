import { defineRoom } from '../registry.js';
import { box, cyl, plane } from '../geo.js';

// Der Innenhof-Garten unter dem Sternenhimmel.
export default defineRoom({
  id: 'garten',
  name: 'Mondgarten',
  description: 'Ein Innenhof unter Sternen: Brunnen, Glühwürmchen, Laternen.',
  keywords: ['garten', 'draußen', 'brunnen', 'natur', 'sterne', 'bäume', 'blumen', 'pause'],
  cell: [-1, 1],
  size: [3, 1],
  outdoor: true,
  spawn: { at: [0, -5], yaw: Math.PI },
  atmosphere: { fog: '#28305a', density: 0.008, ambient: 1.15, ambientColor: '#9ab0ff', moon: 0.9 },
  build(ctx) {
    const { hw, hd } = ctx;
    ctx.floor('grass', { uv: 3 });
    ctx.enclose({ neighbor: 'facade', neighborOutdoor: 'hedge', open: 'hedge', facadeHeight: 7.2 });
    ctx.foundation();

    // Kieswege
    ctx.add(plane(2.6, ctx.b.d - 1, 1.2), 'stoneLight', [0, 0.01, 0], [-Math.PI / 2, 0, 0]);
    ctx.add(plane(ctx.b.w - 3, 2.2, 1.2), 'stoneLight', [0, 0.011, 0], [-Math.PI / 2, 0, 0]);
    for (const x of [-16, 16]) ctx.add(plane(2.2, ctx.b.d - 1, 1.2), 'stoneLight', [x, 0.01, 0], [-Math.PI / 2, 0, 0]);

    ctx.place('fountain', { at: [0, 0, 0], radius: 1.9, secret: 'wunschbrunnen' });
    ctx.place('mushrooms', { at: [-19, 0, 4.5], secret: 'feenring' });
    ctx.place('stoneTablet', { at: [19.5, 0, 5.5], rot: -0.4, secret: 'inschrift', text: '»Diese Bibliothek wird nie fertig. Das ist kein Fehler, sondern der Plan.«\n\n– eingemeißelt vom ersten Bibliothekar, kurz bevor er Tee holen ging.' });

    // Bäume
    for (const [x, z, l] of [[-8, -4, true], [8, -4, true], [-8, 5, false], [8, 5, false], [-21, -4, false], [21, -4, false], [-12, 1, false], [12, 1, false]]) {
      ctx.place('tree', { at: [x, 0, z], lanterns: l });
    }
    // Blumenbeete
    for (const x of [-4.5, 4.5]) for (const z of [-4.5, 4.5]) ctx.place('flowers', { at: [x, 0, z], width: 3.5, depth: 2.2 });
    for (const x of [-20, 20]) ctx.place('flowers', { at: [x, 0, 0], width: 4, depth: 6 });

    // Bänke und Laternen
    ctx.place('bench', { at: [0, 0, 4.6], rot: Math.PI });
    ctx.place('bench', { at: [-3.4, 0, 0], rot: Math.PI / 2 });
    ctx.place('bench', { at: [3.4, 0, 0], rot: -Math.PI / 2 });
    for (const [x, z] of [[-1.9, -6], [1.9, -6], [-1.9, 6], [1.9, 6], [-14.5, 0], [14.5, 0]]) ctx.place('lamppost', { at: [x, 0, z] });

    // Rosenbögen über den Wegen
    ctx.place('archway', { at: [-16, 0, -2.5] });
    ctx.place('archway', { at: [16, 0, -2.5] });
    ctx.place('archway', { at: [0, 0, 6.8], width: 2.8 });

    // Bücherschrank im Freien (Tauschregal)
    ctx.place('bookcase', { at: [-10.5, 0, hd - 1.8], rot: Math.PI, width: 1.6, height: 2.2, shelf: 'garten', label: 'Tauschregal' });
    ctx.add(box(1.9, 0.12, 0.8, 1), 'roof', [-10.5, 2.35, hd - 1.8]);
    ctx.place('cat', { at: [12, 0.45, 4.6], rot: Math.PI, fur: 'beard', name: 'Weiße Katze', secret: 'katze-garten', quip: 'Die weiße Katze zählt Sterne. Du störst. Sie verzeiht dir.' });
    ctx.place('bench', { at: [12, 0, 4.6], rot: Math.PI });

    ctx.place('rubberDuck', { at: [0.9, 0.42, 0.6], float: true, scale: 1.2, name: 'Brunnenente', secret: 'brunnenente', secretName: 'Die Ente im Wunschbrunnen', quip: 'Die Ente wünscht sich auch etwas. Sie verrät es aber nicht.' });
    ctx.place('jumpMushroom', { at: [-12, 0, -5.4], scale: 0.8, power: 9.5 });
    ctx.place('jumpMushroom', { at: [12, 0, -5.4], scale: 0.8, power: 9.5, cap: 'mushroomCapBlue', glow: '#8ad8ff' });
    ctx.place('snail', { at: [-6, 0, -6.6], length: 3 });
    ctx.place('standSign', { at: [1.8, 0, 3.6], rot: 0.2, text: 'Rasen betreten erlaubt. Hüpfen ausdrücklich erwünscht.', size: 30, width: 1.1, signHeight: 0.38 });
    ctx.place('fairyLights', { at: [-8, 0, -4], length: 16, y: 4.2, sag: 1.2 });
    ctx.place('butterflies', { at: [0, 0, 0], area: [30, 2, 12], count: 10, y: 0.8 });
    ctx.place('kite', { at: [-14, 0, 3], y: 7.5, color: '#ffd86a' });
    ctx.place('kite', { at: [10, 0, -2], y: 8.5, color: '#8ad8ff', rot: 0.8 });
    ctx.place('fireflies', { area: [ctx.b.w - 4, 3, ctx.b.d - 3], count: 120 });
  },
});
