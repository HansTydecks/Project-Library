import * as THREE from 'three';
import { Kit } from '../kit.js';
import { CELL, WALL_T, cellKey, EDGE_STYLES } from '../world.js';
import { box, plane, cyl } from '../geo.js';
import { makeRng, hash2 } from '../../core/rng.js';
import { createBookMesh } from '../books.js';

// Die Endlosen Stapel: Jede Zelle nördlich der Eingangsreihe wird bei Bedarf aus ihrem
// Koordinaten-Seed erzeugt und wieder abgebaut, wenn man sich entfernt.
// Neue Chunk-Typen: einfach unten in CHUNK_TYPES ergänzen.
const H = 5.2;
const LOAD_R = 2;
const UNLOAD_R = 3;
const END_Z = -28; // »Das Ende der Bibliothek« (ein Osterei)

export function createStacks({ def, occ, scene, services, projects }) {
  const [ex, ez] = def.cell;         // Eingangszelle
  const loaded = new Map();
  const queue = [];
  const doorX = ex * CELL, doorZ = ez * CELL + CELL / 2;

  // Dunkler Schleier hinter der Eingangstür: verhindert, dass man aus der Ferne (Foyer)
  // durch die noch nicht geladenen Stapel in den Himmel schaut.
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: '#0e0b08' }));
  veil.position.set(doorX, 2, doorZ - 1.2);
  scene.add(veil);
  const entryNeighbor = occ.get(cellKey(ex, ez + 1));

  const isStack = (cx, cz) => cz <= ez && (!occ.has(cellKey(cx, cz)) || occ.get(cellKey(cx, cz)) === def.id);

  function build(cx, cz) {
    const kit = new Kit({ id: `stapel:${cx},${cz}`, origin: [cx * CELL, 0, cz * CELL], services, room: def });
    const f = kit.root;
    const r = makeRng(hash2(cx, cz, 4711));
    const isEntry = cx === ex && cz === ez;
    const h = CELL / 2;

    f.add(plane(CELL, CELL, 2), 'parquet', [0, 0, 0], [-Math.PI / 2, 0, 0]);
    f.add(plane(CELL, CELL, 3), 'plaster', [0, H, 0], [Math.PI / 2, 0, 0]);
    for (let z = -h + 2; z < h; z += 4) f.add(box(CELL, 0.3, 0.25, 1), 'woodDark', [0, H - 0.15, z]);
    f.collider(0, 0, CELL, CELL, { top: H + 0.5, bottom: H - 0.3, shadow: false }); // Decke

    // Südgrenze schließen, wenn dort kein Raum anschließt
    if (cz === ez && !occ.has(cellKey(cx, cz + 1))) {
      const wf = f.frame([0, 0, h], Math.PI);
      EDGE_STYLES.wall(wf, { u0: -h, u1: h, u: 0, door: null }, { inner: 'wpRed', outer: 'stone', wainscot: 'paneling', trim: 'woodDark', height: H });
    }

    const type = isEntry ? 'entry' : pickType(r, cx, cz);
    CHUNK_TYPES[type](f, r, { cx, cz, kit, services, projects, home: [doorX - cx * CELL, doorZ - cz * CELL] });

    // Hängelampen
    const lamps = type === 'dark' ? 0 : r.int(1, 2);
    for (let i = 0; i < lamps; i++) {
      const at = [r.pick([-h, 0]) + (i ? 0 : 0), H - 1.2, r.pick([-h, 0])];
      f.add(cyl(0.01, 0.01, 1.0, 4), 'iron', [at[0], H - 0.5, at[2]]);
      f.add(cyl(0.12, 0.35, 0.25, 12), 'lampShade', [at[0], at[1], at[2]]);
      f.add(box(0.1, 0.1, 0.1, 0), 'glowWarm', [at[0], at[1] - 0.1, at[2]]);
      f.glow([at[0], at[1] - 0.15, at[2]], { color: '#ffbb66', size: 1.4, opacity: 0.6 });
      f.light([at[0], at[1] - 0.3, at[2]], { color: '#ffb46a', intensity: 7, distance: 11, flicker: r.chance(0.35) });
    }
    kit.finalize();
    scene.add(kit.group);
    return kit;
  }

  function update(dt, t, player, roomId) {
    veil.visible = roomId !== def.id && roomId !== entryNeighbor;
    const pcx = Math.floor((player.x + CELL / 2) / CELL), pcz = Math.floor((player.z + CELL / 2) / CELL);
    // Laden
    for (let dz = -LOAD_R; dz <= LOAD_R; dz++) for (let dx = -LOAD_R; dx <= LOAD_R; dx++) {
      const cx = pcx + dx, cz = pcz + dz;
      if (!isStack(cx, cz)) continue;
      const k = cellKey(cx, cz);
      if (!loaded.has(k) && !queue.some((q) => q.k === k)) queue.push({ k, cx, cz, d: Math.abs(dx) + Math.abs(dz) });
    }
    queue.sort((a, b) => a.d - b.d);
    const next = queue.shift();
    if (next && !loaded.has(next.k)) loaded.set(next.k, build(next.cx, next.cz));
    // Abbauen
    for (const [k, kit] of loaded) {
      const [cx, cz] = k.split(',').map(Number);
      if (Math.abs(cx - pcx) > UNLOAD_R || Math.abs(cz - pcz) > UNLOAD_R) { kit.dispose(); loaded.delete(k); }
    }
    for (const kit of loaded.values()) kit.update(dt, t, { player });
  }

  return {
    update,
    isStack,
    get count() { return loaded.size; },
    /** Erzwingt sofortiges Laden um eine Position (z.B. beim Teleport). */
    preload(x, z) {
      const pcx = Math.floor((x + CELL / 2) / CELL), pcz = Math.floor((z + CELL / 2) / CELL);
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const cx = pcx + dx, cz = pcz + dz, k = cellKey(cx, cz);
        if (isStack(cx, cz) && !loaded.has(k)) loaded.set(k, build(cx, cz));
      }
    },
  };
}

function pickType(r, cx, cz) {
  // Feste Orte: Pip wohnt gleich neben dem Eingang, das »Ende« liegt tief im Norden
  if (cx === -1 && cz === -4) return 'wichtel';
  if (cx === 0 && cz === END_Z) return 'theEnd';
  const depth = -cz;
  const table = [
    ['aisles', 46], ['aislesZ', 20], ['nook', 8], ['door', 4], ['empty', 4 + Math.min(depth, 10) * 0.5],
    ['lost', 5], ['stairs', 3], ['pillars', 6], ['dark', 1 + Math.min(depth, 20) * 0.3], ['sign', 6],
    ['teatime', 4], ['bookTree', 4], ['duckPond', 3], ['bounce', 3], ['campfire', 3],
    ['wichtel', 1.5],
  ];
  const total = table.reduce((s, [, w]) => s + w, 0);
  let x = r.next() * total;
  for (const [k, w] of table) { x -= w; if (x <= 0) return k; }
  return 'aisles';
}

function rows(f, r, { along = 'x', count = 4, gapChance = 0.35 } = {}) {
  const h = CELL / 2;
  const unit = 2.2;
  for (let i = 0; i < count; i++) {
    const off = -h + 2.6 + i * ((CELL - 5.2) / (count - 1));
    const units = 5;
    const start = -(units * unit) / 2;
    const gap = r.chance(gapChance) ? r.int(0, units - 1) : -1;
    for (let k = 0; k < units; k++) {
      if (k === gap) continue;
      const u = start + unit * (k + 0.5);
      const at = along === 'x' ? [u, 0, off] : [off, 0, u];
      f.place('bookcaseDouble', { at, rot: along === 'x' ? 0 : Math.PI / 2, width: unit, height: r.pick([3.2, 3.6, 4.0]), autoFill: true, emptyChance: 0.06, seed: `${f.kit.id}:${i}:${k}` });
    }
  }
}

const CHUNK_TYPES = {
  entry(f, r, { kit, services }) {
    rows(f, r, { along: 'z', count: 2, gapChance: 0 });
    const s = services.makeSign('Willkommen in den Endlosen Stapeln. Merke dir den Weg. (Tust du eh nicht.)', { w: 1024, h: 128, size: 46 });
    f.object(s, [0, 3.4, 6.5], [0, 0, 0]).scale.set(5.5, 0.7, 1);
    f.place('signpost', { at: [1.5, 0, 4], signs: [['Zurück zum Lesesaal', -Math.PI / 2], ['Tiefer hinein …', Math.PI / 2]] });
  },
  aisles(f, r) { rows(f, r, { along: 'x', count: 4 }); },
  aislesZ(f, r) { rows(f, r, { along: 'z', count: 4 }); },
  nook(f, r) {
    rows(f, r, { along: 'x', count: 2, gapChance: 0 });
    f.place('rug', { at: [0, 0, 0], width: 3, depth: 2.4, material: r.pick(['carpetRed', 'carpetBlue', 'carpetGreen']) });
    f.place('armchair', { at: [-0.6, 0, 0.2], rot: 0.6, quip: r.pick(['Der Sessel ist noch warm. Wer saß hier gerade?', 'Ein perfekter Leseplatz. Niemand weiß, wie er hierher kam.']) });
    f.place('floorLamp', { at: [-1.5, 0, -0.6], intensity: 4 });
    f.place('sideTable', { at: [0.7, 0, -0.4] });
    f.place('candle', { at: [0.7, 0.62, -0.4], light: false });
    f.place('bookPile', { at: [0.9, 0, 0.8], count: 6 });
    if (r.chance(0.4)) f.place('cat', { at: [-0.6, 0.52, 0.25], rot: 0.6, fur: r.pick(['fur', 'furDark', 'beard']), name: 'Streunende Katze', quip: 'Eine Katze, weit weg von zu Hause. Sie wirkt nicht besorgt. Du solltest es vielleicht sein.' });
  },
  door(f, r, { services }) {
    rows(f, r, { along: 'x', count: 2, gapChance: 0.5 });
    // Eine Tür, die frei im Raum steht
    f.add(box(0.15, 2.4, 0.2, 0), 'woodDark', [-0.6, 1.2, 0]);
    f.add(box(0.15, 2.4, 0.2, 0), 'woodDark', [0.6, 1.2, 0]);
    f.add(box(1.35, 0.15, 0.2, 0), 'woodDark', [0, 2.45, 0]);
    f.add(box(1.05, 2.3, 0.06, 1), 'woodRed', [0, 1.15, 0]);
    f.add(box(0.06, 0.06, 0.1, 0), 'brass', [0.38, 1.1, 0.05]);
    f.collider(0, 0, 1.4, 0.3);
    f.hitbox([0, 1.2, 0], [1.2, 2.4, 0.4], {
      label: 'Eine einzelne Tür', verb: 'Klopfen',
      onInteract: () => { services.audio?.play('knock'); services.ui.toast(r.pick(['Von der anderen Seite klopft es höflich zurück.', 'Die Tür ist verschlossen. Auf der Rückseite ist auch nur … Rückseite.', '»Besetzt!«, ruft eine Stimme. Dann Stille.'])); services.progress.curio('tür'); },
    });
  },
  empty(f, r, { services }) {
    // Fast leer. Ein Stuhl. Er schaut dich an. (Liminal.)
    f.place('chair', { at: [r.range(-3, 3), 0, r.range(-3, 3)], rot: r.range(0, 6.28) });
    if (r.chance(0.5)) f.place('bookPile', { at: [r.range(-5, 5), 0, r.range(-5, 5)], count: 2 });
  },
  lost(f, r, { projects, services, kit, cx, cz }) {
    rows(f, r, { along: 'x', count: 2, gapChance: 0 });
    const list = projects.filter((p) => p.kind !== 'idea');
    if (!list.length) return CHUNK_TYPES.nook(f, r, {});
    const p = list[hash2(cx, cz, 99) % list.length];
    f.place('pedestal', { at: [0, 0, 0] });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      f.place('candle', { at: [Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2], height: 0.4, light: i === 0, intensity: 4 });
    }
    const book = createBookMesh(p);
    f.object(book, [0, 1.25, 0], [0, 0, 0]);
    const g = f.glow([0, 1.25, 0], { color: '#ffd890', size: 1.2, opacity: 0.4 });
    kit.onUpdate((dt, t) => { book.rotation.y += dt * 0.5; book.position.y = 1.25 + Math.sin(t * 1.5) * 0.05; g.material.opacity = 0.3 + Math.sin(t * 2) * 0.1; });
    f.interactable(book, {
      label: `Ein verirrtes Buch: «${p.title}»`, verb: 'Aufheben',
      onInteract: () => { services.progress.curio(`verirrt:${p.id}`); services.events.emit('openProject', { project: p, mesh: book, lost: true }); },
    });
  },
  stairs(f, r, { services }) {
    rows(f, r, { along: 'z', count: 2, gapChance: 0 });
    // Wendeltreppe, die in die Decke führt
    for (let i = 0; i < 22; i++) {
      const a = i * 0.45, y = 0.1 + i * 0.23;
      f.add(box(1.3, 0.08, 0.45, 0), 'woodLight', [Math.cos(a) * 0.75, y, Math.sin(a) * 0.75], [0, -a, 0]);
    }
    f.add(cyl(0.12, 0.12, H, 8), 'iron', [0, H / 2, 0]);
    f.collider(0, 0, 3, 3);
    f.hitbox([0, 1.2, 0], [3, 2.4, 3], {
      label: 'Wendeltreppe', verb: 'Hinaufsehen',
      onInteract: () => { services.ui.toast('Die Treppe führt in die Decke. Und weiter. Wohin, verrät sie nicht.'); services.progress.curio('treppe'); },
    });
  },
  pillars(f, r) {
    for (let x = -6; x <= 6; x += 4) for (let z = -6; z <= 6; z += 4) {
      if (r.chance(0.2)) continue;
      f.add(cyl(0.35, 0.4, H, 12), 'stoneLight', [x, H / 2, z]);
      f.collider(x, z, 0.8, 0.8);
    }
    if (r.chance(0.5)) f.place('bookPile', { at: [r.range(-4, 4), 0, r.range(-4, 4)] });
  },
  dark(f, r, { services }) {
    rows(f, r, { along: r.pick(['x', 'z']), count: 3 });
    f.hitbox([0, 1.5, 0], [CELL - 2, 3, 0.3], {
      label: 'Dunkelheit', verb: 'Lauschen',
      onInteract: () => services.ui.toast('Irgendwo blättert jemand eine Seite um. Dann noch eine.'),
    });
  },
  // Ein gedeckter Teetisch mitten im Labyrinth – für wen?
  teatime(f, r, { services }) {
    rows(f, r, { along: 'x', count: 2, gapChance: 0.3 });
    f.place('rug', { at: [0, 0, 0], width: 3, depth: 3, material: r.pick(['carpetRed', 'carpetBlue']) });
    f.place('table', { at: [0, 0, 0], width: 1.4, depth: 1.4, material: 'woodLight' });
    f.place('chair', { at: [0, 0, 1.0], rot: Math.PI });
    f.place('chair', { at: [0, 0, -1.0] });
    f.place('teapot', { at: [0, 0.81, 0], color: r.pick(['porcelainBlue', 'pastelPink']), scale: 0.8 });
    f.place('orbitingCups', { at: [0, 0, 0], y: 1.6, radius: 0.9, count: 5 });
    f.hitbox([0, 1, 0], [1.4, 0.6, 1.4], {
      label: 'Gedeckter Tisch', verb: 'Platz nehmen',
      onInteract: () => { services.ui.toast(r.pick(['Zwei Tassen. Eine ist noch warm. Die andere wartet auf dich.', 'Ein Zettel: »Bin gleich zurück. Seit 1923.«'])); services.progress.curio('teetisch'); },
    });
  },
  // Ein Zimmerbaum, dessen Blätter Bücher sind
  bookTree(f, r) {
    rows(f, r, { along: 'z', count: 2, gapChance: 0.3 });
    f.place('tree', { at: [0, 0, 0], lanterns: true });
    f.place('balloonBooks', { at: [0, 0, 0], y: 3.2, count: 4, radius: 1.6 });
    f.place('flowers', { at: [0, 0, 0], width: 3, depth: 3, kinds: ['pastelPink', 'pastelSky', 'flowerYellow'] });
    if (r.chance(0.5)) f.place('snail', { at: [1.4, 0, 1.6], length: 1.5 });
  },
  // Ein winziger Teich im Teppich. Mit Ente. Natürlich.
  duckPond(f, r) {
    rows(f, r, { along: 'x', count: 2, gapChance: 0.5 });
    f.place('lilyPond', { at: [0, 0, 0], radius: 1.3 });
    f.place('rubberDuck', { at: [0.6, 0.12, 0.4], float: true, scale: 1.2, name: 'Labyrinth-Ente', quip: 'Die Ente hat sich nicht verlaufen. Sie wohnt hier. Du hast dich verlaufen.' });
    f.place('standSign', { at: [1.8, 0, -1.4], rot: -0.5, text: 'Teich (sehr klein). Bitte nicht hineinfallen.', size: 30, width: 1.0, signHeight: 0.36 });
  },
  // Sprungpilz → Bücherinsel mit einem verirrten Werk obendrauf
  bounce(f, r, { projects, services, kit, cx, cz }) {
    rows(f, r, { along: 'x', count: 2, gapChance: 0.2 });
    f.place('jumpMushroom', { at: [-1.5, 0, 0], scale: 0.85, power: 9.5, cap: r.pick(['mushroomCap', 'mushroomCapBlue', 'mushroomCapGold']) });
    f.place('floatingIsland', { at: [1.4, 0, 0], y: 3.2, width: 2, depth: 2, kind: 'book', color: r.pick(['#c0405a', '#3a6ac0', '#3a9a6a']) });
    const list = projects.filter((p) => p.kind !== 'idea');
    if (!list.length) return;
    const p = list[hash2(cx, cz, 7) % list.length];
    const book = createBookMesh(p);
    f.object(book, [1.4, 3.6, 0]);
    kit.onUpdate((dt, t) => { book.rotation.y += dt * 0.6; });
    f.glow([1.4, 3.6, 0], { color: '#ffd890', size: 1, opacity: 0.4 });
    f.interactable(book, {
      label: `Hoch oben: «${p.title}»`, verb: 'Aufheben', range: 3,
      onInteract: () => { services.progress.curio(`hoch:${p.id}`); services.events.emit('openProject', { project: p, mesh: book, lost: true }); },
    });
  },
  // Lagerfeuer (ganz ungefährlich) mit Staubmäusen drumherum
  campfire(f, r, { services }) {
    rows(f, r, { along: 'z', count: 2, gapChance: 0.4 });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; f.add(box(0.25, 0.15, 0.2, 0), 'stoneLight', [Math.cos(a) * 0.6, 0.07, Math.sin(a) * 0.6], [0, -a, 0]); }
    f.place('candle', { at: [0, 0, 0], height: 0.05, intensity: 5 });
    f.glow([0, 0.3, 0], { color: '#ff9a4a', size: 1.6, opacity: 0.5 });
    for (let i = 0; i < 3; i++) { const a = i * 2.1; f.place('dustBunny', { at: [Math.cos(a) * 1.4, 0, Math.sin(a) * 1.4], area: 1.2 }); }
    f.place('bench', { at: [0, 0, 1.8], rot: Math.PI });
    f.hitbox([0, 0.3, 0], [1.4, 0.6, 1.4], {
      label: 'Lagerfeuer im Labyrinth', verb: 'Geschichte hören',
      onInteract: () => { services.ui.toast(r.pick(['Die Staubmäuse erzählen von einem Buch, das so lang ist, dass es zweimal endet.', 'Gruselgeschichten gibt es hier nicht. Nur Kuschelgeschichten. Mit Happy End.'])); services.progress.curio('lagerfeuer'); },
    });
  },
  // Pip, der Bücherwichtel, huscht zwischen den Regalen umher
  wichtel(f, r) {
    rows(f, r, { along: 'x', count: 2, gapChance: 0.6 });
    f.place('friendGnome', { at: [0, 0, 0], friend: 'pip', spots: [[0, 0], [4.5, 1.2], [-4.2, -1.4], [1.8, -2.2], [-2.4, 2.4]] });
    f.place('bookPile', { at: [-1.2, 0, 0.8], count: 7 });
    f.place('candle', { at: [-1.6, 0, 1.4], height: 0.3, intensity: 3 });
  },
  // Osterei: das »Ende« der Bibliothek, mit einer Tür zurück nach Hause
  theEnd(f, r, { services }) {
    f.place('rug', { at: [0, 0, 0], width: 4, depth: 4, material: 'carpetRed' });
    const s = services.makeSign('Hier ist das Ende der Bibliothek. (Nicht.)', { w: 1024, h: 128, size: 52 });
    f.object(s, [0, 3.2, -2.4]).scale.set(5, 0.62, 1);
    f.add(box(0.15, 2.4, 0.2, 0), 'woodDark', [-0.6, 1.2, 0]);
    f.add(box(0.15, 2.4, 0.2, 0), 'woodDark', [0.6, 1.2, 0]);
    f.add(box(1.35, 0.15, 0.2, 0), 'woodDark', [0, 2.45, 0]);
    f.add(box(1.05, 2.3, 0.06, 1), 'pastelSky', [0, 1.15, 0]);
    f.add(box(0.06, 0.06, 0.1, 0), 'gold', [0.38, 1.1, 0.05]);
    f.glow([0, 1.2, 0.2], { color: '#ffe8a0', size: 2.2, opacity: 0.35 });
    f.collider(0, 0, 1.4, 0.3);
    services.secrets.register('ende-der-bibliothek', 'Das Ende der Bibliothek (das keins ist)', 'stapel', 'egg');
    f.hitbox([0, 1.2, 0], [1.2, 2.4, 0.5], {
      label: 'Tür mit der Aufschrift »Nach Hause«', verb: 'Öffnen',
      onInteract: () => { services.secrets.found('ende-der-bibliothek'); services.events.emit('goHome'); },
    });
  },
  sign(f, r, { home }) {
    rows(f, r, { along: 'x', count: 2, gapChance: 0.8 });
    const rot = Math.atan2(-(home[1]), home[0]);
    f.place('signpost', { at: [0, 0, 0], signs: [['Zum Lesesaal', rot], [r.pick(['Weiter weg', 'Nirgendwo', 'Hier', 'Woanders']), rot + Math.PI * r.range(0.5, 1.5)]] });
  },
};
