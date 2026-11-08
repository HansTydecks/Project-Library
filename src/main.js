import * as THREE from 'three';
import './ui/style.css';
import projectsData from '../content/projects.json';
import ideasData from '../content/ideas.json';

import { createEngine } from './core/engine.js';
import { createInput } from './core/input.js';
import { createPlayer } from './core/player.js';
import { CollisionWorld } from './core/collision.js';
import { createInteraction } from './core/interact.js';
import { createLightPool } from './core/lights.js';
import { createAudio } from './core/audio.js';
import { events } from './core/events.js';
import { makeRng } from './core/rng.js';

import { loadRooms, loadProps } from './world/registry.js';
import { buildRooms, roomBounds, worldToCell, cellKey, CELL, FLOOR_H, levelAt, roomLevels } from './world/world.js';
import { createShells } from './world/shells.js';
import { setMaxAnisotropy, signTexture, FONT_TITLE } from './world/textures.js';
import { createShelfRegistry, populateShelves, createBookMesh, setBookGlow } from './world/books.js';
import { fillerTitle, fillerLine } from './world/bookTitles.js';
import { createSky } from './world/sky.js';
import { createStacks } from './world/endless/stacks.js';
import { createBookViewer } from './world/bookViewer.js';
import { createDetailCuller } from './core/detail.js';

import { createLibrarian } from './npc/librarian.js';
import { createWisp, createPathfinder } from './npc/wisp.js';

import { createUI, el } from './ui/ui.js';
import { openProjectBook, openFillerBook, openIdeaNote } from './ui/bookPanel.js';
import { openWizardDialog } from './ui/dialog.js';
import { openJournal, openCatalog, openTravel } from './ui/journal.js';
import { createGames } from './state/games.js';
import { createProgress, createSecrets } from './state/progress.js';
import { createFriends } from './npc/friends.js';
import { createItems } from './state/items.js';
import { createSequenceWatcher, season, createRepeatCounter } from './core/eastereggs.js';
import { createConfetti } from './world/confetti.js';

const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');

// ---------------------------------------------------------------- Inhalte
const projects = (Array.isArray(projectsData) ? projectsData : projectsData.projects ?? []).filter((p) => p && p.id && p.title);
const ideas = (Array.isArray(ideasData) ? ideasData : ideasData.ideas ?? []).filter((i) => i && i.id && i.title);

// ---------------------------------------------------------------- Startbildschirm
const uiRoot = document.getElementById('ui');
const start = el('div', 'start');
start.innerHTML = `<div>
  <h1>Die Magische Bibliothek</h1>
  <div class="sub">Ein endloses Archiv voller Projekte, Ideen und Geheimnisse</div>
  <div class="enter loading">Die Kerzen werden angezündet …</div>
  <div class="keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> laufen · <kbd>Shift</kbd> rennen · <kbd>Leertaste</kbd> springen (2× in der Luft!) · Maus schauen · <kbd>E</kbd> / Klick interagieren · <kbd>Tab</kbd> Tagebuch · <kbd>M</kbd> Klang</div>
</div>`;
document.body.appendChild(start);

async function waitFonts() {
  if (!document.fonts?.load) return;
  const loads = [`32px ${FONT_TITLE}`, '32px "Caveat"', '20px "Crimson Pro"'].map((f) => document.fonts.load(f).catch(() => {}));
  await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 2500))]);
}

await waitFonts();

// ---------------------------------------------------------------- Kern
// ?lowfx: ohne Nachbearbeitung/Reflexionen (schwache Geräte); ?fixedres: keine adaptive Auflösung
const engine = createEngine(document.getElementById('app'), { lowFx: params.has('lowfx'), adaptive: !params.has('fixedres') });
const { scene, camera, renderer } = engine;
setMaxAnisotropy(Math.min(8, renderer.capabilities.getMaxAnisotropy()));
const input = createInput(renderer.domElement);
if (params.has('nolock')) input.state.dragLook = true;
const collision = new CollisionWorld();
const lights = createLightPool(scene);
const interaction = createInteraction({ camera, input });
const audio = createAudio();
const progress = createProgress();
const ui = createUI({ root: uiRoot, input });
const secrets = createSecrets({
  progress,
  onFound: (s) => { ui.toast(s.kind === 'egg' ? `🥚 Osterei gefunden: ${s.name}` : `✦ Geheimnis entdeckt: ${s.name}`, { secret: true, ms: 5500 }); audio.play('secret'); },
});

const hemi = new THREE.HemisphereLight('#ffd8b0', '#6a4868', 0.5);
scene.add(hemi);
const moon = new THREE.DirectionalLight('#a8b8ff', 0);
moon.position.set(60, 80, -30);
scene.add(moon);

const index = new Map();       // 'project:id' | 'idea:id' | 'room:id' → { obj?, pos?, room }
const rngFor = (seed) => makeRng(String(seed));
const shelves = createShelfRegistry();
const friends = createFriends({ progress });
const items = createItems({
  progress,
  onChange: (kind, id) => {
    ui.setInventory(items.list());
    const it = items.get(id);
    if (kind === 'give') { ui.toast(`${it.icon} In deiner Tasche: ${it.name}. ${it.desc}${id === 'brief' ? ' (Taste B oder antippen: lesen)' : ''}`, { ms: 6500 }); audio.play('pop'); }
  },
});
// Ostereier-Zustand: Jahreszeit (?season=winter|autumn|spring zum Testen), Feier-Timer, Kakaostunde (?cocoa)
const fx = { season: season(new Date(), params.get('season')), party: 0, cocoaHour: params.has('cocoa'), paintedEggs: 0 };
const games = createGames({ ui, progress, secrets, audio, interaction });
const services = {
  games,
  collision, lights, interaction, secrets, friends, items, events, progress, audio, index, fx,
  onTick: (fn) => engine.onUpdate(fn),
  get player() { return player; },
  props: loadProps(),
  shelves,
  content: { projects, ideas },
  ui,
  rng: rngFor,
  /** Figur kennenlernen (einmalig gefeiert). */
  meet(id) {
    if (!friends.meet(id)) return false;
    const f = friends.get(id);
    ui.toast(`☺ Neue Bekanntschaft: ${f.name}`, { secret: true, ms: 5000 });
    audio.play('chime');
    return true;
  },
  makeSign(text, opts) {
    return new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshLambertMaterial({ map: signTexture(text, opts), emissive: '#2a1a0a', transparent: true }));
  },
  onFillerMesh(im) {
    const c = new THREE.Color();
    im.userData.interact = {
      label: (hit) => `«${fillerTitle(im.userData.fillers[hit.instanceId].seed)}»`,
      verb: 'Herausziehen',
      onHover(hit) { im.getColorAt(hit.instanceId, c); im.userData.hoverColor = c.clone(); c.multiplyScalar(1.8); im.setColorAt(hit.instanceId, c); im.instanceColor.needsUpdate = true; },
      onHoverEnd(id) { if (im.userData.hoverColor && id != null) { im.setColorAt(id, im.userData.hoverColor); im.instanceColor.needsUpdate = true; } },
      onInteract(hit) {
        const f = im.userData.fillers[hit.instanceId];
        if (im.userData.hoverColor) { im.setColorAt(hit.instanceId, im.userData.hoverColor); im.instanceColor.needsUpdate = true; }
        audio.play('page');
        viewer.showInstance(im, hit.instanceId, f.color, (back) => {
          openFillerBook(ui, { title: fillerTitle(f.seed), line: fillerLine(f.seed) }, { onClose: back });
        });
      },
    };
    interaction.add(im);
  },
};

// ---------------------------------------------------------------- Welt bauen
const roomDefs = loadRooms();
const { kits, occ, doors, byId } = buildRooms(roomDefs, services, rngFor);
const stapelDef = roomDefs.find((d) => d.endless);

// Regale befüllen
const bookOf = new Map(); // project.id → Haupt-Mesh
const placedWhere = new Map(); // project.id → { room, shelf }
populateShelves({
  registry: shelves,
  projects,
  onRealBook(p, frame, pos, dims, shelf) {
    const mesh = createBookMesh(p, dims);
    mesh.userData.keepVisible = true; // echte Werke bleiben auch aus der Ferne sichtbar
    frame.object(mesh, pos);
    const copy = shelf?.mode === 'newest';
    frame.interactable(mesh, {
      label: `«${p.title}»`, verb: copy ? 'Neuerscheinung ansehen' : 'Herausziehen',
      onHover: () => setBookGlow(mesh, 1), onHoverEnd: () => setBookGlow(mesh, 0),
      onInteract: () => { setBookGlow(mesh, 0); events.emit('openProject', { project: p, mesh }); },
    });
    if (!copy && !bookOf.has(p.id)) {
      bookOf.set(p.id, mesh);
      placedWhere.set(p.id, { room: shelf.room, shelf: shelf.id });
      index.set(`project:${p.id}`, { obj: mesh, room: shelf.room });
    }
  },
});
for (const k of kits) { k.finalize(); scene.add(k.group); }
for (const d of roomDefs) {
  const b = roomBounds(d);
  const sp = d.spawn?.at ?? [0, 0];
  index.set(`room:${d.id}`, { pos: new THREE.Vector3(b.cx + sp[0], roomLevels(d)[0] * FLOOR_H + 1.4, b.cz + sp[1]), room: d.id });
}

const sky = createSky(scene);
const shells = createShells({ scene, kits });
const stacks = stapelDef ? createStacks({ def: stapelDef, occ, scene, services, projects }) : null;
const viewer = createBookViewer({ scene, camera, engine });
// Kleine Details in der Ferne ausblenden (spart Draw Calls beim Blick durch Türen); ?nocull zum Vergleichen
const detail = createDetailCuller({ camera, kits });
detail.enabled = !params.has('nocull');

function roomAt(x, z, y = 0) {
  const [cx, cz] = worldToCell(x, z);
  const id = occ.get(cellKey(cx, cz, levelAt(y)));
  if (id) return id;
  if (levelAt(y) > 0) return null;
  if (stacks?.isStack(cx, cz)) return stapelDef.id;
  return null;
}

const player = createPlayer({ camera, input, collision });
const confetti = createConfetti(scene);

// ---------------------------------------------------------------- Ostereier
const EGGS = {
  konami: 'Der geheime Tastentanz', federleicht: 'Der Federleicht-Zauber', hutfarbe: 'Abrakadabra (mit Hutfolgen)',
  kakao: 'Kakao vom Bibliothekar', hutflug: 'Der fliegende Hut', feier: 'Eine spontane Feier', zweiundvierzig: 'Die Antwort auf alles',
  klingel: 'Fünfmal geklingelt', 'alle-eier': 'Alle bemalten Eier gefunden', sternensprung: 'Sternenstaub für den Dreifachsprung',
};
for (const [id, name] of Object.entries(EGGS)) secrets.register(id, name, null, 'egg');
let featherTimer = 0;
function party(seconds = 12) { fx.party = engine.time + seconds; confetti.burst(player.pos, seconds); audio.play('secret'); }
const SPELL_FX = {
  feather: () => { player.setGravityScale(0.4); featherTimer = 30; secrets.found('federleicht'); },
  hat: () => { services.wizard?.hatColor(); secrets.found('hutfarbe'); audio.play('magic'); },
  cocoa: () => { services.wizard?.cocoa(); secrets.found('kakao'); },
  hatFly: () => { services.wizard?.hatFly(); secrets.found('hutflug'); audio.play('whoosh'); },
  party: () => { party(); secrets.found('feier'); },
  fortyTwo: () => secrets.found('zweiundvierzig'),
};
const konami = createSequenceWatcher((name) => {
  if (name !== 'konami' || !started) return;
  party(15); secrets.found('konami');
  ui.toast('↑↑↓↓←→←→BA – Die Bücher tanzen! Der Bibliothekar tut so, als hätte er nichts gesehen.', { ms: 6000 });
});
window.addEventListener('keydown', (e) => { if (!(e.target instanceof HTMLInputElement)) konami.push(e.code); });
const bellCounter = createRepeatCounter(5, 40);
events.on('bellRung', () => {
  if (bellCounter(engine.time)) { secrets.found('klingel'); setTimeout(() => ui.toast('Der Bibliothekar seufzt liebevoll: »Ja-ha, ich bin ja schon da! Seit 900 Jahren.«', { ms: 6000 }), 400); }
});
events.on('paintedEgg', ({ total }) => {
  const n = progress.count('eggs');
  ui.toast(n >= total ? 'Alle bemalten Eier gefunden! Die Bibliothek feiert dich.' : `Ein bemaltes Ei! (${n} von ${total})`, { ms: 4500 });
  audio.play('chime');
  if (n >= total) { secrets.found('alle-eier'); party(15); }
});
events.on('party', (s) => party(typeof s === 'number' ? s : 12));
function useItem(id) {
  if (id === 'brief') {
    const list = projects.filter((p) => placedWhere.has(p.id));
    const p = list[Math.floor(Math.random() * list.length)];
    if (p) { ui.toast('Du öffnest den Brief: »Liebe/r Besucher/in, schau dir doch mal das hier an. Herzlich, die Bibliothek.«', { ms: 6000 }); setTimeout(() => events.emit('openProject', { project: p }), 600); }
    return;
  }
  const it = items.get(id);
  if (it) ui.toast(`${it.icon} ${it.name}: ${it.desc}`, { ms: 5500 });
}
ui.onUseItem?.((id) => useItem(id));
input.onPress('KeyB', () => { if (!ui.modalOpen && started) { const l = items.list(); if (l.length) useItem(l.find((i) => i.id === 'brief')?.id ?? l[l.length - 1].id); } });
// Schnellreise über den Kartentisch (Osterei »schnellreise«)
secrets.register('schnellreise', 'Per Irrlicht-Schnellreise über die Karte gereist', 'kartenraum', 'egg');
events.on('openTravel', () => {
  const rooms = roomDefs.filter((r) => !r.hidden && !r.endless);
  openTravel(ui, {
    rooms, progress, current: currentRoom,
    onTravel: (r) => {
      const b = roomBounds(r), sp = r.spawn ?? { at: [0, 0], yaw: 0 };
      player.teleport(b.cx + sp.at[0], b.cz + sp.at[1], sp.yaw ?? 0, roomLevels(r)[0] * FLOOR_H + (sp.y ?? 0));
      audio.play('whoosh'); audio.play('magic');
      secrets.found('schnellreise');
      ui.toast(`Wusch! Ein Irrlicht wirbelt dich in: ${r.name}.`, { ms: 4000 });
      if (!ui.modalOpen) resume();
    },
  });
});
// Stundenkonzert: zur vollen Stunde rufen alle Kuckucksuhren gleichzeitig (?cuckoo zum Testen)
secrets.register('stundenkonzert', 'Das Kuckucks-Stundenkonzert zur vollen Stunde gehört', 'uhrwerk', 'egg');
{
  let lastHour = new Date().getHours(), test = params.has('cuckoo');
  engine.onUpdate(() => {
    const h = new Date().getHours();
    if ((h === lastHour && !test) || !started) return;
    lastHour = h; test = false;
    events.emit('cuckooConcert');
    audio.play('cuckoo'); setTimeout(() => audio.play('cuckoo'), 450); setTimeout(() => audio.play('cuckoo'), 900);
    secrets.found('stundenkonzert');
    ui.toast(`Kuckuck! Kuckuck! Es ist ${h} Uhr – und sämtliche Kuckucksuhren der Bibliothek rufen im Chor.`, { ms: 6000 });
  });
}
events.on('goHome', () => {
  const f = byId.get('foyer'); const b = roomBounds(f);
  player.teleport(b.cx + f.spawn.at[0], b.cz + f.spawn.at[1], f.spawn.yaw ?? 0);
  audio.play('whoosh');
  ui.toast('Die Tür führt … direkt ins Foyer. Der Bibliothekar zwinkert. »Willkommen zurück.«', { ms: 6000 });
});
const librarian = createLibrarian({ projects, ideas, rooms: roomDefs.filter((r) => !r.hidden) });
const findPath = createPathfinder({ doors, byId, roomAt });
const wisp = createWisp({ scene, lights, findPath });

// Spawn
const spawnRoom = byId.get(params.get('spawn')) ?? byId.get('foyer') ?? roomDefs[0];
{
  const b = roomBounds(spawnRoom);
  const sp = spawnRoom.spawn ?? { at: [0, 0], yaw: 0 };
  if (spawnRoom.endless) {
    const [cx, cz] = spawnRoom.cell;
    stacks.preload(cx * CELL, cz * CELL);
    player.teleport(cx * CELL, cz * CELL, 0);
  } else player.teleport(b.cx + sp.at[0], b.cz + sp.at[1], sp.yaw ?? 0, roomLevels(spawnRoom)[0] * FLOOR_H + (sp.y ?? 0));
}

// ---------------------------------------------------------------- Räume & Atmosphäre
const neighbors = new Map();
for (const d of doors) {
  for (const [a, b] of [[d.a, d.b], [d.b, d.a]]) { if (!neighbors.has(a)) neighbors.set(a, new Set()); neighbors.get(a).add(b); }
}
let currentRoom = null;
let activeKits = new Set(kits);
const atmo = { fog: new THREE.Color('#3a2630'), density: 0.012, ambient: 0.5, ambientColor: new THREE.Color('#ffd8b0'), moon: 0, outdoor: 0, skyHidden: 0 };
const atmoTarget = { ...atmo, fog: atmo.fog.clone(), ambientColor: atmo.ambientColor.clone() };

function doorBetween(a, b) { return doors.find((d) => (d.a === a && d.b === b) || (d.a === b && d.b === a)); }
function throughView(a, n, m) {
  const d1 = doorBetween(a, n), d2 = doorBetween(n, m);
  if (!d1 || !d2 || d1.axis !== d2.axis) return false;
  return d1.axis === 'x' ? Math.abs(d1.z - d2.z) < 6 : Math.abs(d1.x - d2.x) < 6;
}

let currentLevel = 0;
function enterRoom(id, level = 0) {
  const sameRoom = id === currentRoom;
  currentRoom = id; currentLevel = level;
  const def = byId.get(id);
  if (!def) return;
  const a = def.atmosphereByLevel?.[level] ?? def.atmosphere ?? {};
  atmoTarget.fog.set(a.fog ?? '#3a2630');
  atmoTarget.density = a.density ?? 0.014;
  atmoTarget.ambient = a.ambient ?? 1.3;
  atmoTarget.ambientColor.set(a.ambientColor ?? '#ffd8b0');
  atmoTarget.moon = a.moon ?? 0;
  atmoTarget.outdoor = (def.outdoorLevels?.includes(level) ?? def.outdoor) ? 1 : 0;
  atmoTarget.skyHidden = a.skyHidden ? 1 : 0;
  const near = new Set([id, ...(neighbors.get(id) ?? [])]);
  // Nachbarn zweiten Grades nur, wenn man durch zwei Türen in einer Linie hindurchsehen kann
  for (const n of neighbors.get(id) ?? []) for (const m of neighbors.get(n) ?? []) if (m !== id && throughView(id, n, m)) near.add(m);
  activeKits = new Set(kits.filter((k) => near.has(k.id)));
  for (const k of kits) k.group.visible = activeKits.has(k);
  shells.sync(kits);
  if (sameRoom) { const ln = def.levelNames?.[level]; if (ln) ui.banner(def.name, ln); return; }
  const first = progress.room(id);
  ui.banner(def.name, first ? 'Neu entdeckt!' : (def.description ?? ''));
  if (first && progress.count('rooms') > 1) audio.play('chime');
  events.emit('roomEntered', def);
}

// ---------------------------------------------------------------- Interaktion & Ereignisse
function describe(d) {
  if (d.type === 'room') return '';
  if (d.type === 'idea') return 'Pinnwand im Ideen-Kabinett';
  const w = placedWhere.get(d.id);
  if (!w) return 'irgendwo verirrt';
  const room = byId.get(w.room);
  if (w.shelf === 'sortierwagen') return `${room?.name ?? w.room} · Sortierwagen`;
  const label = room?.shelves?.find((s) => s.id === w.shelf)?.label ?? w.shelf;
  return `${room?.name ?? w.room} · Regal «${label}»`;
}

function guideTo(key, label) {
  const entry = index.get(key);
  if (!entry) { ui.toast('Hmm, das finde ich gerade nicht.'); return; }
  const pos = entry.pos ?? entry.obj.getWorldPosition(new THREE.Vector3());
  let approach = null;
  if (entry.obj) {
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(entry.obj.getWorldQuaternion(new THREE.Quaternion()));
    n.y = 0; n.normalize();
    approach = pos.clone().addScaledVector(n, 1.4);
  }
  const ok = wisp.guide(player.pos, {
    pos, approach, room: entry.room, label,
    onArrive: () => { if (entry.obj?.userData.glowMats) setBookGlow(entry.obj, 1.6); audio.play('magic'); },
    onEnd: () => { if (entry.obj?.userData.glowMats) setBookGlow(entry.obj, 0); },
  });
  if (ok) { ui.toast(`Ein Irrlicht erscheint. Folge ihm zu «${label}».`); audio.play('magic'); } else ui.toast('Das Irrlicht findet keinen Weg dorthin. Seltsam.');
}

function guideDoc(d) { guideTo(`${d.type}:${d.id}`, d.title); }

events.on('openProject', ({ project: p, mesh, lost }) => {
  const isNew = progress.book(p.id);
  audio.play('page');
  const open = (back) => openProjectBook(ui, p, {
    where: describe({ type: 'project', id: p.id }), lost,
    onGuide: placedWhere.has(p.id) && !lost && bookOf.get(p.id) !== mesh ? () => guideTo(`project:${p.id}`, p.title) : null,
    onClose: back,
  });
  if (mesh && !viewer.busy) viewer.showMesh(mesh, open); else open();
  if (isNew && progress.count('books') % 5 === 0) setTimeout(() => ui.toast(`Schon ${progress.count('books')} Werke entdeckt!`), 800);
});
events.on('openIdea', ({ idea }) => { progress.idea(idea.id); audio.play('page'); openIdeaNote(ui, idea); });
events.on('openCatalog', () => openCatalog(ui, { docs: librarian.docs, progress, describe, onGuide: guideDoc }));
events.on('randomIdea', () => {
  if (!ideas.length) return ui.toast('Das Glas ist leer. Zeit für neue Ideen!');
  const i = ideas[Math.floor(Math.random() * ideas.length)];
  audio.play('chime');
  progress.idea(i.id);
  openIdeaNote(ui, i);
});
events.on('crystalBall', () => {
  const list = projects.filter((p) => placedWhere.has(p.id));
  if (!list.length) return;
  const p = list[Math.floor(Math.random() * list.length)];
  ui.toast(`Die Kugel trübt sich … und zeigt «${p.title}».`);
  setTimeout(() => guideTo(`project:${p.id}`, p.title), 600);
});
events.on('summonWizard', () => {
  services.meet('bibliothekar');
  if (items.has('sternenstaub')) {
    items.take('sternenstaub'); player.setMaxAirJumps(2); secrets.found('sternensprung');
    services.wizard?.hatColor(); party(8);
    ui.toast('Der Bibliothekar pustet den Sternenstaub über dich: »So! Ab jetzt springst du dreimal. Zweimal davon in der Luft.«', { ms: 7000 });
    return;
  }
  services.wizard?.talk(3);
  services.wizard?.wave();
  const name = progress.visits > 1 ? 'Schön, dass du wieder da bist.' : 'Du bist neu hier, oder? Frag mich ruhig alles.';
  openWizardDialog(ui, {
    onAction: (a) => SPELL_FX[a]?.(),
    librarian, describe, greeting: `${librarian.greet()} ${name}`,
    onGuide: guideDoc,
    onOpen: (d) => {
      if (d.type === 'project') events.emit('openProject', { project: d.ref });
      else if (d.type === 'idea') events.emit('openIdea', { idea: d.ref });
    },
  });
});

interaction.onChange((hit) => {
  if (!hit) return ui.setHint(null);
  const ia = hit.object.userData.interact;
  ui.setHint({ label: typeof ia.label === 'function' ? ia.label(hit) : ia.label, verb: typeof ia.verb === 'function' ? ia.verb(hit) : ia.verb });
});
input.onPress('KeyE', () => interaction.trigger());
input.onPress('Space', () => { if (input.state.enabled && !ui.modalOpen) player.jump(); });
player.onJump((double) => audio.play(double ? 'sparkleJump' : 'jump'));
player.onLand((impact) => audio.play(impact > 9 ? 'thud' : 'land'));
input.onPress('Tab', () => { if (!ui.modalOpen && started) showJournal(); });
input.onPress('KeyJ', () => { if (!ui.modalOpen && started) showJournal(); });
input.onPress('KeyM', () => { const on = audio.toggle(); ui.toast(on ? '♪ Klänge an' : 'Klänge aus'); soundBtn.textContent = on ? '♪' : '♪̸'; });
renderer.domElement.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || !input.state.enabled) return;
  if (input.state.locked || input.state.dragLook) {
    if (input.state.locked) interaction.trigger();
  }
});
renderer.domElement.addEventListener('click', () => { if (input.state.dragLook && input.state.enabled && !dragged) interaction.trigger(); });
let dragged = false, downAt = null;
renderer.domElement.addEventListener('mousedown', (e) => { downAt = [e.clientX, e.clientY]; dragged = false; });
window.addEventListener('mousemove', (e) => { if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) dragged = true; });
window.addEventListener('mouseup', () => { downAt = null; });
input.onTap(() => interaction.trigger());
ui.touchButton.addEventListener('click', () => interaction.trigger());
ui.jumpButton.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); player.jump(); }, { passive: false });

function showJournal() {
  openJournal(ui, {
    rooms: roomDefs.filter((r) => !r.hidden || progress.has('rooms', r.id)), progress, secrets, friends, items, games, paintedEggs: fx.paintedEggs, audio,
    totalBooks: projects.length, totalIdeas: ideas.length,
    onHome: () => guideTo('room:foyer', 'Foyer'),
    onCatalog: () => events.emit('openCatalog'),
    onReset: () => { progress.reset(); ui.toast('Alles vergessen. Wie beim ersten Mal.'); },
  });
}
ui.addCornerButton('📖', 'Tagebuch (Tab)', () => showJournal());
const soundBtn = ui.addCornerButton(audio.enabled ? '♪' : '♪̸', 'Klang an/aus (M)', (b) => { const on = audio.toggle(); b.textContent = on ? '♪' : '♪̸'; });

player.onStep(() => audio.play('step'));

// ---------------------------------------------------------------- Start / Pause
let started = false;
function resume() {
  start.classList.add('hidden');
  input.state.enabled = true;
  ui.showHud(true);
  audio.unlock();
  if (!input.state.dragLook && !input.state.touch) {
    input.lock().then((ok) => { if (!ok && !input.state.locked) pause(); });
  }
  interaction.refresh();
}
function pause() {
  if (ui.modalOpen) return;
  input.state.enabled = false;
  start.querySelector('.enter').textContent = 'Klicke, um weiterzugehen';
  start.querySelector('.enter').classList.remove('loading');
  start.classList.remove('hidden');
}
start.addEventListener('click', () => {
  if (start.querySelector('.loading')) return;
  resume();
  if (!started) {
    started = true;
    setTimeout(() => {
      if (progress.visits <= 1) ui.toast('Der Bibliothekar winkt dir vom Tresen aus zu. Sprich ihn an, wenn du Hilfe brauchst.', { ms: 6500 });
      else ui.toast(`Willkommen zurück! Das ist dein ${progress.visits}. Besuch.`, { ms: 4500 });
    }, 1200);
  }
});
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && started && !ui.modalOpen && input.state.enabled) pause();
});
ui.onAllClosed((gesture) => {
  if (input.state.dragLook || input.state.touch) { input.state.enabled = true; return; }
  if (gesture) {
    input.state.enabled = true;
    input.lock().then((ok) => { if (!ok) pause(); });
  } else pause();
});
ui.showHud(false);
ui.setInventory(items.list());
if (progress.has('secrets', 'sternensprung')) player.setMaxAirJumps(2); // Belohnung bleibt

// ---------------------------------------------------------------- Loop
const ctxObj = { player: player.pos, camera, launch: (v) => player.launch(v), get grounded() { return player.grounded; } };
let fpsAcc = 0, fpsN = 0, fps = 0, detailAcc = 1;
engine.onUpdate((dt, t) => {
  player.update(dt);
  detail.update(dt);
  const id = roomAt(player.pos.x, player.pos.z, player.pos.y);
  const lvl = levelAt(player.pos.y);
  if (id && (id !== currentRoom || lvl !== currentLevel)) enterRoom(id, lvl);

  // Atmosphäre sanft überblenden
  const k = 1 - Math.exp(-dt * 1.5);
  atmo.fog.lerp(atmoTarget.fog, k);
  atmo.density += (atmoTarget.density - atmo.density) * k;
  atmo.ambient += (atmoTarget.ambient - atmo.ambient) * k;
  atmo.ambientColor.lerp(atmoTarget.ambientColor, k);
  atmo.moon += (atmoTarget.moon - atmo.moon) * k;
  atmo.outdoor += (atmoTarget.outdoor - atmo.outdoor) * k;
  scene.fog.color.copy(atmo.fog);
  scene.fog.density = atmo.density;
  hemi.intensity = atmo.ambient * 1.25;
  if (scene.environment) scene.environmentIntensity = 0.07 + 0.08 * atmo.outdoor;
  hemi.color.copy(atmo.ambientColor);
  moon.intensity = atmo.moon * 0.9;
  audio.setOutdoor(atmo.outdoor);
  atmo.skyHidden += (atmoTarget.skyHidden - atmo.skyHidden) * k;
  sky.setHidden(atmo.skyHidden, atmo.fog);

  for (const kit of activeKits) kit.update(dt, t, ctxObj);
  detailAcc += dt;
  if (detailAcc > 0.3) {
    detailAcc = 0;
    for (const kit of activeKits) {
      if (!kit.details || !kit.room) continue;
      const b = roomBounds(kit.room);
      const dx = Math.max(b.minX - player.pos.x, 0, player.pos.x - b.maxX), dz = Math.max(b.minZ - player.pos.z, 0, player.pos.z - b.maxZ);
      const y0 = kit.origin.y, y1 = y0 + (kit.room.height ?? 6);
      const dy = Math.max(y0 - player.pos.y - 1, 0, player.pos.y - y1);
      kit.details.visible = kit.id === currentRoom || Math.hypot(dx, dz, dy) < 10;
    }
  }
  stacks?.update(dt, t, player.pos, currentRoom);
  lights.update(dt, t, player.pos, currentRoom);
  interaction.update(dt);
  wisp.update(dt, t, player.pos);
  confetti.update(dt, t, player.pos);
  if (featherTimer > 0) { featherTimer -= dt; if (featherTimer <= 0) { player.setGravityScale(1); ui.toast('Der Federleicht-Zauber verfliegt. Du wiegst wieder so viel wie vorher. (Nicht mehr!)'); } }
  sky.update(dt, t, camera);

  if (currentRoom === stapelDef?.id) {
    const door = doors.find((d) => d.a === stapelDef.id || d.b === stapelDef.id);
    const dx = door.x - player.pos.x, dz = door.z - player.pos.z;
    const ang = Math.atan2(dx, -dz) + player.yaw;
    const dist = Math.hypot(dx, dz);
    ui.setCompass(`Lesesaal · ${Math.round(dist)} m`, ang);
  } else ui.setCompass(null);

  if (DEBUG) {
    fpsAcc += dt; fpsN++;
    if (fpsAcc > 0.5) { fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
    const info = renderer.info;
    ui.setDebug(`${fps} fps · ${info.render.calls} calls · ${info.render.triangles} tris\n${currentRoom} @ ${player.pos.x.toFixed(1)}, ${player.pos.z.toFixed(1)} · yaw ${player.yaw.toFixed(2)}\nchunks ${stacks?.count ?? 0}`);
  }
});

engine.start();
start.querySelector('.enter').textContent = input.state.touch ? 'Tippe, um einzutreten' : 'Klicke, um einzutreten';
start.querySelector('.enter').classList.remove('loading');

if (DEBUG || params.has('test')) {
  window.__lib = {
    THREE, scene, camera, player, input, interaction, events, wisp, ui, index, kits, collision, stacks, progress, librarian, detail, engine,
    teleport: (x, z, yaw, y) => player.teleport(x, z, yaw, y),
    look: (yaw, pitch) => player.look(yaw, pitch),
    guide: (key) => guideTo(key, key),
    roomAt: () => currentRoom,
    start: () => start.click(),
  };
}
