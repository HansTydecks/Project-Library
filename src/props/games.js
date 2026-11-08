import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, torus, lathe, ico } from '../world/geo.js';
import { mat, hdr } from '../world/materials.js';
import { canvasTexture, tex } from '../world/textures.js';
import { compactGroup } from '../world/kit.js';
import { mulberry32, makeRng } from '../core/rng.js';
import {
  shellSwaps, createSequenceGame, createMemory, turnGear, gearsSolved, scrambleGears,
  createConstellation, ballStep, inBasket, throughRing, formatTime, pickCatch,
} from '../core/minigames.js';

// Minispiele. Jedes Spiel meldet sich bei kit.services.games an (Bestwerte im Tagebuch, Anzeige oben,
// Sieg-Osterei). Lokal +z zeigt jeweils zur Seite, von der aus man spielt.

const M = (geo, m, pos, rot, scale) => {
  const o = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m);
  if (pos) o.position.set(...pos);
  if (rot) o.rotation.set(...rot);
  if (scale) typeof scale === 'number' ? o.scale.setScalar(scale) : o.scale.set(...scale);
  return o;
};
const freshRng = () => mulberry32((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
const ease = (x) => x * x * (3 - 2 * x);
const glowMat = (color, k = 1.3) => new THREE.MeshBasicMaterial({ color: hdr(color, k) });

/** Kleiner Zeitplaner pro Spiel: later(sek, fn), clear(); läuft über kit.onUpdate. */
function scheduler(kit) {
  let list = [];
  kit.onUpdate((dt) => {
    if (!list.length) return;
    const due = [];
    for (const j of list) { j.t -= dt; if (j.t <= 0) due.push(j); }
    if (due.length) { list = list.filter((j) => j.t > 0); for (const j of due) j.fn(); }
  });
  return { later: (t, fn) => list.push({ t, fn }), clear: () => { list = []; } };
}

/** Bricht ein laufendes Spiel ab, wenn man sich zu weit entfernt. */
function watchDistance(kit, f, at, r, isOn, abort) {
  const w = f.world(...at);
  let acc = 0;
  kit.onUpdate((dt) => {
    acc += dt; if (acc < 0.5) return; acc = 0;
    if (!isOn()) return;
    const p = kit.services.player?.pos;
    if (p && (Math.hypot(p.x - w.x, p.z - w.z) > r || Math.abs(p.y - w.y) > 6)) abort();
  });
}

function sign(kit, text, w, size = 34) {
  const s = kit.services.makeSign(text, { size: size * 1.15, w: 640, h: 96, bg: '#f6ead0', ink: '#5a2a3a' });
  s.scale.set(w * 1.3, w * 1.3 * 0.15, 1);
  return s;
}

export default [
  // ------------------------------------------------------------------ 1. Hütchenspiel mit Teetassen
  defineProp({
    name: 'shellGame',
    create(f, opts, kit) {
      const svc = kit.services, games = svc.games, ID = 'huetchen';
      games.register(ID, { name: 'Hütchenspiel', room: kit.room?.id, unit: 'richtig in Folge', egg: 'huetchen-meister', eggName: 'Dreimal hintereinander das Zuckerstück gefunden' });
      const TY = 0.77, X = [-0.36, 0, 0.36];
      f.add(cyl(0.62, 0.62, 0.05, 24), 'woodRed', [0, 0.72, 0]);
      f.add(cyl(0.66, 0.66, 0.02, 24), 'tablecloth', [0, 0.755, 0]);
      f.add(cyl(0.06, 0.08, 0.7, 10), 'woodDark', [0, 0.35, 0]);
      f.add(cyl(0.3, 0.34, 0.04, 16), 'woodDark', [0, 0.02, 0]);
      f.collider(0, 0, 1.3, 1.3, { top: 0.77 });
      f.add(cyl(0.012, 0.012, 0.5, 6), 'brass', [0, 1.0, -0.5]);
      f.object(sign(kit, 'Hütchenspiel – wo ist das Zuckerstück?', 0.95), [0, 1.3, -0.5]);
      const cupMat = new THREE.MeshStandardMaterial({ color: '#fbf6fc', roughness: 0.35, side: THREE.DoubleSide });
      const root = f.object(new THREE.Group());
      const cups = [0, 1, 2].map((i) => {
        const g = new THREE.Group();
        g.add(M(lathe([[0.15, 0], [0.145, 0.03], [0.12, 0.15], [0.07, 0.19], [0, 0.195]]), cupMat));
        g.add(M(torus(0.15, 0.012, 5, 20), 'gold', [0, 0.005, 0], [Math.PI / 2, 0, 0]));
        g.add(M(torus(0.05, 0.012, 5, 12, Math.PI), cupMat, [0.14, 0.09, 0], [0, 0, -Math.PI / 2]));
        g.add(M(sphere(0.03, 8, 6), ['pastelPink', 'pastelSky', 'pastelMint'][i], [0, 0.07, 0.13], null, [1, 1, 0.3]));
        compactGroup(g); root.add(g);
        return { g, slot: i, lift: 0, liftTo: 0, x: X[i], z: 0.05 };
      });
      const sugar = M(box(0.07, 0.07, 0.07, 0), 'white'); root.add(sugar);
      const sch = scheduler(kit);
      let state = 'idle', streak = 0, ballCup = 1, anim = null, queue = [];
      const place = () => { for (const c of cups) c.g.position.set(c.x, TY + c.lift * 0.24, c.z); const b = cups[ballCup]; sugar.position.set(b.x, TY + 0.036, b.z); };
      place();
      kit.onUpdate((dt) => {
        for (const c of cups) c.lift += (c.liftTo - c.lift) * Math.min(1, dt * 9);
        if (anim) {
          anim.t += dt / anim.dur;
          const k = ease(Math.min(1, anim.t));
          for (const m of anim.moves) { m.c.x = X[m.from] + (X[m.to] - X[m.from]) * k; m.c.z = 0.05 + m.side * Math.sin(k * Math.PI) * 0.2; }
          if (anim.t >= 1) { for (const m of anim.moves) { m.c.slot = m.to; m.c.x = X[m.to]; m.c.z = 0.05; } anim = null; nextSwap(); }
        }
        place();
      });
      function nextSwap() {
        if (!queue.length) { state = 'guess'; games.hud(ID, `Serie ${streak} · Unter welcher Tasse?`); return; }
        const [a, b] = queue.shift();
        const ca = cups.find((c) => c.slot === a), cb = cups.find((c) => c.slot === b);
        anim = { t: 0, dur: Math.max(0.2, 0.5 - streak * 0.06), moves: [{ c: ca, from: a, to: b, side: 1 }, { c: cb, from: b, to: a, side: -1 }] };
        svc.audio.play('tick');
      }
      function round() {
        state = 'show';
        games.hud(ID, `Serie ${streak} · Gut aufpassen …`);
        const b = cups[ballCup];
        b.liftTo = 1;
        sch.later(1.3, () => { b.liftTo = 0; });
        sch.later(1.9, () => { queue = shellSwaps(freshRng(), 4 + streak * 2); nextSwap(); });
      }
      function stop() { sch.clear(); anim = null; queue = []; for (const c of cups) c.liftTo = 0; state = 'idle'; }
      f.hitbox([0, 0.95, 0], [1.2, 0.4, 1.0], {
        label: 'Hütchenspiel', verb: 'Mitspielen', range: 3.2, filter: () => state === 'idle',
        onInteract: () => {
          games.start(ID, { onAbort: stop });
          streak = 0; ballCup = Math.floor(Math.random() * 3);
          svc.ui.toast('Mirabelle kichert: »Ich schiebe die Tassen ganz langsam. Versprochen. Meistens.«');
          round();
        },
      });
      for (const c of cups) {
        const hit = M(box(0.34, 0.26, 0.34, 0), 'invisible', [0, 0.1, 0]); hit.userData.hitbox = true; c.g.add(hit);
        f.interactable(hit, {
          label: 'Teetasse', verb: 'Hier drunter!', range: 3.2, filter: () => state === 'guess',
          onInteract: () => {
            if (state !== 'guess') return;
            state = 'reveal'; c.liftTo = 1;
            const idx = cups.indexOf(c);
            if (idx === ballCup) {
              streak++; svc.audio.play('chime');
              games.record(ID, streak);
              if (streak >= 3) games.win(ID);
              games.hud(ID, `Richtig! Serie ${streak}`);
              sch.later(1.2, () => { c.liftTo = 0; });
              sch.later(1.8, round);
            } else {
              cups[ballCup].liftTo = 1; svc.audio.play('pop');
              svc.ui.toast(streak ? `Daneben! Das Zuckerstück war woanders. Deine Serie: ${streak}.` : 'Daneben! Mirabelle tut so, als hätte sie nicht geschummelt.');
              games.hud(ID, `Daneben · Serie ${streak}`);
              sch.later(2.2, () => { stop(); games.end(ID); });
            }
          },
        });
      }
      watchDistance(kit, f, [0, 0, 0], 8, () => state !== 'idle', () => { stop(); games.end(ID); });
    },
  }),

  // ------------------------------------------------------------------ 2. Trank-Memo (Simon mit Zutaten)
  defineProp({
    name: 'potionSimon',
    create(f, opts, kit) {
      const svc = kit.services, games = svc.games, ID = 'trankmemo';
      games.register(ID, { name: 'Trank-Memo', room: kit.room?.id, unit: 'Runden', egg: 'meisterbrauer', eggName: 'Ein Rezept mit sechs Zutaten fehlerfrei gebraut' });
      const JARS = [
        { c: '#ff6a9a', n: 'c', name: 'Rosenwasser' }, { c: '#6ad86a', n: 'e', name: 'Froschlaich-Limo' },
        { c: '#6ab0ff', n: 'g', name: 'Mondtau' }, { c: '#ffd04a', n: 'c2', name: 'Sonnenhonig' },
      ];
      f.add(box(1.8, 0.9, 0.7, 1), 'woodDark', [0, 0.45, 0]);
      f.add(box(1.9, 0.05, 0.8, 1), 'stoneLight', [0, 0.925, 0]);
      f.collider(0, 0, 1.9, 0.8, { top: 0.95 });
      const TOP = 0.95, jx = [-0.66, -0.22, 0.22, 0.66];
      const liquids = JARS.map((j, i) => {
        f.add(new THREE.CylinderGeometry(0.12, 0.12, 0.32, 16, 1, true), 'glass', [jx[i], TOP + 0.16, 0.14]);
        f.add(cyl(0.065, 0.075, 0.06, 10), 'woodLight', [jx[i], TOP + 0.35, 0.14]);
        const m = new THREE.MeshStandardMaterial({ color: j.c, emissive: j.c, emissiveIntensity: 0.15, roughness: 0.3 });
        const liq = f.mesh(cyl(0.105, 0.105, 0.24, 14), m, [jx[i], TOP + 0.125, 0.14]);
        return { m, liq, flash: 0 };
      });
      f.add(lathe([[0, 0], [0.12, 0.01], [0.18, 0.08], [0.19, 0.16], [0.2, 0.2]]), 'iron', [0, TOP, -0.17]);
      for (const a of [0, 2.1, 4.2]) f.add(cyl(0.015, 0.015, 0.06, 5), 'iron', [Math.cos(a) * 0.1, TOP + 0.01, -0.17 + Math.sin(a) * 0.1]);
      const soupM = new THREE.MeshStandardMaterial({ color: '#8a7a9a', emissive: '#8a7a9a', emissiveIntensity: 0.3, roughness: 0.4 });
      f.mesh(new THREE.CircleGeometry(0.18, 18), soupM, [0, TOP + 0.17, -0.17], [-Math.PI / 2, 0, 0]);
      f.object(sign(kit, 'Trank-Memo: Merk dir das Rezept!', 1.1), [0, TOP + 0.75, -0.36]);
      f.add(box(0.03, 0.4, 0.03, 0), 'woodDark', [-0.5, TOP + 0.4, -0.37]); f.add(box(0.03, 0.4, 0.03, 0), 'woodDark', [0.5, TOP + 0.4, -0.37]);
      const sch = scheduler(kit);
      let state = 'idle', seq = null, rounds = 0;
      const soupTo = new THREE.Color('#8a7a9a');
      kit.onUpdate((dt) => {
        for (const l of liquids) { l.flash = Math.max(0, l.flash - dt * 2.5); l.m.emissiveIntensity = 0.15 + l.flash * 0.9; l.liq.scale.y = 1 + l.flash * 0.08; }
        soupM.color.lerp(soupTo, Math.min(1, dt * 6)); soupM.emissive.copy(soupM.color);
      });
      const hit = (i) => { liquids[i].flash = 1; soupTo.set(JARS[i].c); svc.audio.note(JARS[i].n, { type: 'sine', gain: 0.1 }); };
      function demo() {
        state = 'demo';
        const s = seq.grow(), step = Math.max(0.35, 0.7 - s.length * 0.04);
        games.hud(ID, `Runde ${s.length} · Gut zuschauen …`);
        s.forEach((i, k) => sch.later(0.6 + k * step, () => hit(i)));
        sch.later(0.6 + s.length * step + 0.2, () => { state = 'input'; soupTo.set('#8a7a9a'); games.hud(ID, `Runde ${s.length} · Jetzt du!`); });
      }
      function stop() { sch.clear(); state = 'idle'; soupTo.set('#8a7a9a'); }
      f.hitbox([0, TOP + 0.18, -0.17], [0.45, 0.35, 0.45], {
        label: 'Rezeptkessel', verb: 'Neues Rezept', range: 3, filter: () => state === 'idle',
        onInteract: () => { games.start(ID, { onAbort: stop }); seq = createSequenceGame(freshRng(), [0, 1, 2, 3]); rounds = 0; svc.audio.play('bubble'); demo(); },
      });
      JARS.forEach((j, i) => f.hitbox([jx[i], TOP + 0.18, 0.14], [0.28, 0.4, 0.28], {
        label: j.name, verb: 'Hineingeben', range: 3, filter: () => state === 'input',
        onInteract: () => {
          if (state !== 'input') return;
          hit(i);
          const r = seq.input(i);
          if (r === 'round') {
            rounds = seq.length; games.record(ID, rounds); svc.audio.play('bubble');
            if (rounds >= 6) games.win(ID);
            state = 'demo'; games.hud(ID, `Runde ${rounds} geschafft!`);
            sch.later(0.9, demo);
          } else if (r === 'wrong') {
            state = 'over'; soupTo.set('#7ad87a'); svc.audio.play('pop'); games.hud(ID, `Puff! Geschafft: ${rounds} Runden`);
            svc.ui.toast(`Puff! Ein grasgrünes Wölkchen steigt auf. Der Trank riecht jetzt nach Socken. Geschafft: ${rounds} Runden.`, { ms: 5500 });
            sch.later(2, () => { stop(); games.end(ID); });
          }
        },
      }));
      watchDistance(kit, f, [0, 0, 0], 8, () => state !== 'idle', () => { stop(); games.end(ID); });
    },
  }),

  // ------------------------------------------------------------------ 3. Papierkorb-Weitwurf
  defineProp({
    name: 'paperToss',
    create(f, opts, kit) {
      const svc = kit.services, games = svc.games, ID = 'papierkorb';
      games.register(ID, { name: 'Papierkorb-Weitwurf', room: kit.room?.id, unit: 'Treffer', egg: 'papierkorb-profi', eggName: 'Sieben von zehn Ideen im Papierkorb versenkt' });
      const dist = opts.distance ?? 3.5, BZ = -dist / 2, PZ = dist / 2, BH = 0.5;
      const wick = new THREE.MeshStandardMaterial({ color: '#c8965a', roughness: 0.95, side: THREE.DoubleSide });
      f.add(new THREE.CylinderGeometry(0.29, 0.22, BH, 18, 1, true), wick, [0, BH / 2, BZ]);
      f.add(new THREE.CircleGeometry(0.22, 16), 'woodDark', [0, 0.02, BZ], [-Math.PI / 2, 0, 0]);
      for (const y of [0.12, 0.3]) f.add(torus(0.22 + y * 0.14, 0.012, 4, 20), 'woodDark', [0, y, BZ], [Math.PI / 2, 0, 0]);
      f.add(torus(0.29, 0.025, 5, 22), 'woodDark', [0, BH, BZ], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 3; i++) f.add(ico(0.06, 0), 'paper', [Math.cos(i * 2) * 0.1, 0.08 + i * 0.03, BZ + Math.sin(i * 2) * 0.1]);
      f.collider(0, BZ, 0.6, 0.6, { top: BH });
      f.add(cyl(0.012, 0.012, 1.1, 6), 'brass', [0.34, 0.55, BZ]);
      f.object(sign(kit, 'Papierkorb der verworfenen Ideen', 0.9, 32), [0.34, 1.2, BZ], [0, 0, 0]);
      // Stapel zerknüllter Zettel auf einem Hocker
      f.add(cyl(0.22, 0.22, 0.05, 14), 'woodLight', [0, 0.45, PZ]);
      for (const [x, z] of [[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]]) f.add(cyl(0.025, 0.025, 0.44, 6), 'woodLight', [x, 0.22, PZ + z]);
      for (let i = 0; i < 7; i++) f.add(ico(0.06, 0), 'paper', [Math.cos(i * 2.4) * 0.1 * (i % 3), 0.53 + (i > 3 ? 0.07 : 0), PZ + Math.sin(i * 2.4) * 0.1 * (i % 3)], [i, i * 2, 0]);
      f.collider(0, PZ, 0.45, 0.45, { top: 0.48 });
      const origin = kit.origin, floorY = f.world(0, 0, 0).y;
      const basket = f.world(0, BH, BZ); basket.r = 0.25;
      const balls = [0, 1, 2].map(() => { const m = M(ico(0.06, 0), 'paper'); m.visible = false; kit.group.add(m); return { m, on: false, rest: 0 }; });
      let state = 'idle', thrown = 0, hits = 0;
      const N = 10;
      const hud = () => games.hud(ID, `Wurf ${thrown}/${N} · Treffer ${hits} · Klick = werfen`);
      function finish() {
        state = 'idle'; svc.ui.setGameHud?.(null);
        games.record(ID, hits);
        if (hits >= 7) games.win(ID);
        svc.ui.toast(hits >= 7 ? `${hits} von ${N}! Der Papierkorb applaudiert raschelnd.` : `${hits} von ${N} Treffern. Die übrigen Ideen liegen jetzt … auch irgendwo.`, { ms: 5000 });
        games.end(ID);
      }
      function stop() { state = 'idle'; for (const b of balls) { b.on = false; b.m.visible = false; } }
      function throwBall() {
        if (thrown >= N) return true;
        const b = balls.find((x) => !x.on) ?? balls[0];
        const p = svc.player, yaw = p.yaw, pitch = p.pitch;
        const dir = new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
        Object.assign(b, { on: true, rest: 0, x: p.pos.x + dir.x * 0.4, y: p.pos.y + 1.5 + dir.y * 0.4, z: p.pos.z + dir.z * 0.4, vx: dir.x * 5.2, vy: dir.y * 5.2 + 1.6, vz: dir.z * 5.2 });
        b.m.visible = true; thrown++; svc.audio.play('whoosh'); hud();
        return true;
      }
      kit.onUpdate((dt) => {
        if (state !== 'play') return;
        let flying = 0;
        for (const b of balls) {
          if (!b.on) continue;
          if (b.rest > 0) { b.rest -= dt; if (b.rest <= 0) { b.on = false; b.m.visible = false; } continue; }
          flying++;
          const py = b.y;
          ballStep(b, dt);
          if (inBasket(py, b, basket)) { hits++; b.rest = 0.01; b.m.visible = false; svc.audio.play('pop'); hud(); continue; }
          // Raumgrenzen (grob): abprallen
          for (const ax of ['x', 'z']) if (Math.abs(b[ax] - origin[ax]) > 7.5) { b[ax] = origin[ax] + Math.sign(b[ax] - origin[ax]) * 7.5; b['v' + ax] *= -0.3; }
          if (b.y < floorY + 0.06) { b.y = floorY + 0.06; b.rest = 1.2; }
          b.m.position.set(b.x - origin.x, b.y - origin.y, b.z - origin.z);
          b.m.rotation.x += dt * 6;
        }
        if (thrown >= N && !flying && balls.every((b) => !b.on || b.rest > 0)) { state = 'done'; setTimeout(finish, 900); }
      });
      f.hitbox([0, 0.6, PZ], [0.6, 0.4, 0.6], {
        label: 'Zerknüllte Ideen', verb: '10 Würfe auf den Papierkorb', range: 3, filter: () => state === 'idle',
        onInteract: () => {
          games.start(ID, { onAbort: stop });
          state = 'play'; thrown = 0; hits = 0; hud();
          svc.ui.toast('Ziel: der Papierkorb. Schau hin und klicke zum Werfen – je höher du zielst, desto weiter fliegt die Idee.', { ms: 5500 });
          games.capture(ID, () => (state === 'play' ? throwBall() : false));
        },
      });
      watchDistance(kit, f, [0, 0, 0], 10, () => state === 'play', () => { stop(); games.end(ID); });
    },
  }),

  // ------------------------------------------------------------------ 4. Glühwürmchen-Jagd
  defineProp({
    name: 'fireflyHunt',
    create(f, opts, kit) {
      const svc = kit.services, games = svc.games, ID = 'gluehwuermchen';
      games.register(ID, { name: 'Glühwürmchen-Jagd', room: kit.room?.id, unit: 'Glühwürmchen', egg: 'gluehwuermchen-glas', eggName: 'Alle zwölf Glühwürmchen ins Glas gelockt' });
      const N = 12, TIME = 45, R = opts.radius ?? 7;
      f.add(cyl(0.3, 0.34, 0.5, 14), 'bark', [0, 0.25, 0]);
      f.add(cyl(0.3, 0.3, 0.02, 14), 'woodLight', [0, 0.505, 0]);
      f.add(new THREE.CylinderGeometry(0.13, 0.13, 0.3, 16, 1, true), 'glass', [0, 0.67, 0]);
      f.add(cyl(0.14, 0.14, 0.04, 16), 'brass', [0, 0.84, 0]);
      f.add(torus(0.05, 0.008, 4, 10), 'brass', [0, 0.89, 0], [0, 0, 0]);
      f.collider(0, 0, 0.7, 0.7, { top: 0.5 });
      const jarGlow = f.glow([0, 0.67, 0], { color: '#e8ff8a', size: 0.2, opacity: 0.0 });
      f.object(sign(kit, 'Glühwürmchen-Glas: Fang sie alle!', 0.8, 32), [0, 1.05, 0.15]);
      const root = f.object(new THREE.Group());
      const bodyM = glowMat('#eaff9a', 1.4), spr = new THREE.SpriteMaterial({ map: tex.glow(), color: '#d8ff7a', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
      const flies = [];
      for (let i = 0; i < N; i++) {
        const g = new THREE.Group();
        g.add(M(sphere(0.04, 8, 6), bodyM));
        const s = new THREE.Sprite(spr); s.scale.setScalar(0.45); g.add(s);
        const hit = M(sphere(0.35, 6, 4), 'invisible'); hit.userData.hitbox = true; g.add(hit);
        g.visible = false; root.add(g);
        const fl = { g, c: new THREE.Vector3(), ph: i * 1.7, sp: 0.5 + (i % 4) * 0.15, caught: false, fly: 0, from: new THREE.Vector3() };
        flies.push(fl);
        f.interactable(hit, {
          label: 'Glühwürmchen', verb: 'Fangen!', range: 5, filter: () => state === 'play' && !fl.caught,
          onInteract: () => {
            if (fl.caught || state !== 'play') return;
            fl.caught = true; fl.fly = 1; fl.from.copy(g.position); count++;
            svc.audio.play('chime'); jarGlow.material.opacity = 0.2 + count * 0.05; jarGlow.scale.setScalar(0.3 + count * 0.05);
            hud();
            if (count >= N) end(true);
          },
        });
      }
      let state = 'idle', t0 = 0, left = TIME, count = 0;
      const hud = () => games.hud(ID, `${count}/${N} gefangen · noch ${Math.ceil(left)} s`);
      function end(all) {
        state = 'idle'; games.record(ID, count);
        if (all) { games.win(ID); svc.ui.toast(`Alle ${N} Glühwürmchen im Glas – nach ${formatTime(TIME - left)}! Das Glas leuchtet wie eine kleine Laterne.`, { ms: 6000 }); }
        else svc.ui.toast(`Die Zeit ist um: ${count} von ${N} Glühwürmchen. Die anderen tanzen frech weiter.`, { ms: 5000 });
        for (const fl of flies) fl.g.visible = false;
        setTimeout(() => { jarGlow.material.opacity = 0; }, 8000);
        games.end(ID);
      }
      const jar = new THREE.Vector3(0, 0.7, 0);
      kit.onUpdate((dt, t) => {
        if (state !== 'play') return;
        left -= dt;
        if (Math.floor(left + dt) !== Math.floor(left)) hud();
        for (const fl of flies) {
          if (fl.caught) {
            if (fl.fly > 0) { fl.fly = Math.max(0, fl.fly - dt * 1.6); fl.g.position.lerpVectors(jar, fl.from, ease(fl.fly)); fl.g.scale.setScalar(0.4 + fl.fly * 0.6); if (!fl.fly) fl.g.visible = false; }
            continue;
          }
          const a = t * fl.sp + fl.ph;
          fl.g.position.set(fl.c.x + Math.sin(a) * 1.3, fl.c.y + Math.sin(a * 1.7) * 0.35, fl.c.z + Math.cos(a * 0.8) * 1.3);
        }
        if (left <= 0) end(false);
      });
      function stop() { state = 'idle'; for (const fl of flies) fl.g.visible = false; }
      f.hitbox([0, 0.7, 0], [0.5, 0.5, 0.5], {
        label: 'Glühwürmchen-Glas', verb: '45 Sekunden Glühwürmchen fangen', range: 3, filter: () => state === 'idle',
        onInteract: () => {
          games.start(ID, { onAbort: stop });
          const r = freshRng();
          flies.forEach((fl, i) => {
            const a = (i / N) * Math.PI * 2 + r() * 0.4, d = 2 + r() * (R - 2);
            fl.c.set(Math.cos(a) * d, 0.8 + r() * 1.4, Math.sin(a) * d * 0.6);
            fl.caught = false; fl.fly = 0; fl.g.visible = true; fl.g.scale.setScalar(1);
          });
          state = 'play'; left = TIME; count = 0; jarGlow.material.opacity = 0.2; hud();
          svc.ui.toast('Die Glühwürmchen schwärmen aus! Schau sie an und klicke, um sie sanft ins Glas zu locken.', { ms: 5000 });
        },
      });
      watchDistance(kit, f, [0, 0, 0], R + 9, () => state === 'play', () => { stop(); games.end(ID); });
    },
  }),

  // ------------------------------------------------------------------ 5. Memory-Wand (Wandprop)
  defineProp({
    name: 'memoryWall',
    create(f, opts, kit) {
      const svc = kit.services, games = svc.games, ID = 'memory';
      games.register(ID, { name: 'Spielzeug-Memory', room: kit.room?.id, unit: 'Züge', lower: true, egg: 'memory-meister', eggName: 'Memory in höchstens elf Zügen gelöst' });
      const COLS = 4, ROWS = 3, S = 0.6, GAP = 0.12, Y = opts.y ?? 1.85;
      const W = COLS * S + (COLS - 1) * GAP + 0.3, H = ROWS * S + (ROWS - 1) * GAP + 0.3;
      f.add(box(W, H, 0.06, 0), 'woodRed', [0, Y, 0.03]);
      for (const [x, y, w, h] of [[0, Y + H / 2, W + 0.1, 0.08], [0, Y - H / 2, W + 0.1, 0.08], [W / 2, Y, 0.08, H + 0.1], [-W / 2, Y, 0.08, H + 0.1]]) f.add(box(w, h, 0.09, 0), 'gold', [x, y, 0.05]);
      f.object(sign(kit, 'Memory der Spielzeugkammer', 1.4, 36), [0, Y + H / 2 + 0.22, 0.08]);
      const back = canvasTexture(128, 128, (g, w, h) => {
        g.fillStyle = '#f490b8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#ffe08a'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
        g.fillStyle = '#ffe08a'; g.font = '64px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', w / 2, h / 2 + 4);
      }, { repeat: false });
      const draw = [
        (g, w) => { g.fillStyle = '#f0c030'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 18 : 42; g.lineTo(w / 2 + Math.cos(a) * r, w / 2 + Math.sin(a) * r); } g.fill(); },
        (g, w) => { g.fillStyle = '#e8406a'; g.beginPath(); g.moveTo(w / 2, w * 0.8); g.bezierCurveTo(w * 0.05, w * 0.45, w * 0.3, w * 0.12, w / 2, w * 0.35); g.bezierCurveTo(w * 0.7, w * 0.12, w * 0.95, w * 0.45, w / 2, w * 0.8); g.fill(); },
        (g, w) => { g.fillStyle = '#f4e070'; g.beginPath(); g.arc(w / 2, w / 2, 40, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff8ec'; g.beginPath(); g.arc(w / 2 + 18, w / 2 - 10, 36, 0, Math.PI * 2); g.fill(); },
        (g, w) => { g.fillStyle = '#ffd040'; g.beginPath(); g.ellipse(w / 2 + 4, w * 0.62, 36, 22, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(w * 0.38, w * 0.38, 20, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f08020'; g.beginPath(); g.moveTo(w * 0.22, w * 0.38); g.lineTo(w * 0.1, w * 0.42); g.lineTo(w * 0.22, w * 0.45); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(w * 0.35, w * 0.34, 4, 0, 7); g.fill(); },
        (g, w) => { g.fillStyle = '#d02a2a'; g.beginPath(); g.ellipse(w / 2, w * 0.45, 44, 30, 0, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; for (const [x, y] of [[-18, -12], [12, -20], [22, -4]]) { g.beginPath(); g.arc(w / 2 + x, w * 0.45 + y, 6, 0, 7); g.fill(); } g.fillStyle = '#f4e8d0'; g.fillRect(w / 2 - 12, w * 0.45, 24, 34); },
        (g, w) => { g.fillStyle = '#4a7ad0'; g.fillRect(w * 0.22, w * 0.25, w * 0.56, w * 0.5); g.fillStyle = '#fff6e0'; g.fillRect(w * 0.27, w * 0.29, w * 0.46, w * 0.42); g.fillStyle = '#4a7ad0'; g.fillRect(w / 2 - 2, w * 0.25, 4, w * 0.5); g.strokeStyle = '#9a8a70'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(w * 0.3, w * 0.36 + i * 10); g.lineTo(w * 0.46, w * 0.36 + i * 10); g.moveTo(w * 0.54, w * 0.36 + i * 10); g.lineTo(w * 0.7, w * 0.36 + i * 10); g.stroke(); } },
      ];
      const fronts = draw.map((fn) => new THREE.MeshLambertMaterial({ map: canvasTexture(128, 128, (g, w, h) => { g.fillStyle = '#fff8ec'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c8a040'; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10); fn(g, w); }, { repeat: false }) }));
      const backM = new THREE.MeshLambertMaterial({ map: back });
      const plane = new THREE.PlaneGeometry(S, S);
      const cards = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const x = -((COLS - 1) * (S + GAP)) / 2 + c * (S + GAP), y = Y + ((ROWS - 1) * (S + GAP)) / 2 - r * (S + GAP);
        const g = new THREE.Group();
        g.add(new THREE.Mesh(plane, backM));
        const fr = new THREE.Mesh(plane, fronts[0]); fr.rotation.y = Math.PI; fr.position.z = -0.004; g.add(fr);
        f.object(g, [x, y, 0.1]);
        const card = { g, fr, rot: 0, to: 0, i: cards.length, x, y };
        cards.push(card);
        f.hitbox([x, y, 0.13], [S, S, 0.06], {
          label: 'Memory-Karte', verb: 'Umdrehen', range: 4,
          filter: () => !busy && !(mem && (mem.isSolved(card.i) || mem.open.includes(card.i))),
          onInteract: () => flip(card.i),
        });
      }
      kit.onUpdate((dt) => { for (const c of cards) { c.rot += (c.to - c.rot) * Math.min(1, dt * 10); c.g.rotation.y = c.rot; } });
      let mem = null, busy = false, playing = false;
      const sch = scheduler(kit);
      const hud = () => games.hud(ID, `Züge ${mem.moves} · Paare ${cards.filter((c) => mem.isSolved(c.i)).length / 2}/6`);
      function newGame() {
        mem = createMemory(freshRng(), 6);
        cards.forEach((c) => { c.fr.material = fronts[mem.deck[c.i]]; c.to = 0; });
        playing = true; busy = false;
        games.start(ID, { onAbort: stop });
        hud();
      }
      function stop() { sch.clear(); playing = false; busy = false; mem = null; for (const c of cards) c.to = 0; }
      function flip(i) {
        if (busy) return;
        if (!playing) { if (mem && mem.done) { for (const c of cards) c.to = 0; } newGame(); }
        const r = mem.flip(i);
        if (r.type === 'invalid') return;
        cards[i].to = Math.PI; svc.audio.play('page');
        if (r.type === 'first') return;
        hud();
        if (r.type === 'match') {
          svc.audio.play('chime');
          if (mem.done) {
            playing = false; const mv = mem.moves;
            games.record(ID, mv);
            if (mv <= 11) games.win(ID);
            svc.ui.toast(`Alle Paare gefunden – in ${mv} Zügen! Der Teddy klatscht in die Tatzen.`, { ms: 5000 });
            sch.later(1.5, () => games.end(ID));
            sch.later(6, () => { if (!playing) for (const c of cards) c.to = 0; });
          }
        } else {
          busy = true;
          sch.later(1.0, () => { for (const k of r.cards) cards[k].to = 0; busy = false; });
        }
      }
      watchDistance(kit, f, [0, 0, 1], 9, () => playing, () => { stop(); games.end(ID); });
    },
  }),

  // ------------------------------------------------------------------ 6. Spatzen-Echo (mit dem Xylophon nachspielen)
  defineProp({
    name: 'echoStand',
    create(f, opts, kit) {
      const svc = kit.services, games = svc.games, ID = 'spatzenecho';
      games.register(ID, { name: 'Spatzen-Echo', room: kit.room?.id, unit: 'Runden', egg: 'spatzen-echo', eggName: 'Dem Spatzenchor sechs Runden lang fehlerfrei nachgespielt' });
      const NOTES = ['c', 'd', 'e', 'f', 'g', 'a'];
      f.add(cyl(0.2, 0.22, 0.03, 12), 'iron', [0, 0.015, 0]);
      f.add(cyl(0.015, 0.015, 1.05, 6), 'iron', [0, 0.53, 0]);
      f.add(box(0.6, 0.42, 0.02, 0), 'iron', [0, 1.2, 0.02], [-0.35, 0, 0]);
      f.add(box(0.62, 0.03, 0.06, 0), 'iron', [0, 0.99, 0.1], [-0.35, 0, 0]);
      const s = sign(kit, 'Spatzen-Echo: Hör zu – und spiel es auf dem Xylophon nach!', 0.56, 26);
      s.scale.set(0.56, 0.38, 1); f.object(s, [0, 1.21, 0.04], [-0.35, 0, 0]);
      f.add(lathe([[0, 0.1], [0.06, 0.09], [0.08, 0.02], [0.09, 0]]), 'gold', [0.36, 0.92, 0.05]);
      f.add(sphere(0.02, 8, 6), 'gold', [0.36, 1.03, 0.05]);
      f.collider(0, 0, 0.4, 0.4);
      const sch = scheduler(kit);
      let state = 'idle', seq = null, rounds = 0;
      function demo() {
        state = 'demo';
        const notes = seq.grow(), step = Math.max(0.42, 0.75 - notes.length * 0.04);
        games.hud(ID, `Runde ${notes.length} · Die Spatzen singen vor …`);
        notes.forEach((n, k) => sch.later(0.8 + k * step, () => {
          svc.audio.note(n, { type: 'sine', gain: 0.1, dur: 0.5 }); svc.audio.play('chirp');
          svc.events.emit('xyloFlash', n); svc.events.emit('sparrowsSing');
        }));
        sch.later(0.8 + notes.length * step + 0.2, () => { state = 'input'; games.hud(ID, `Runde ${notes.length} · Jetzt du – am Xylophon!`); });
      }
      function stop() { sch.clear(); state = 'idle'; }
      svc.events.on('notePlayed', (n) => {
        if (state !== 'input' || !NOTES.includes(n) || !games.isActive(ID)) return;
        const r = seq.input(n);
        if (r === 'round') {
          rounds = seq.length; games.record(ID, rounds);
          if (rounds >= 6) games.win(ID);
          state = 'demo'; games.hud(ID, `Runde ${rounds} geschafft! Die Spatzen tschilpen begeistert.`);
          sch.later(1.0, demo);
        } else if (r === 'wrong') {
          state = 'over'; svc.audio.play('honk'); games.hud(ID, `Schief! Geschafft: ${rounds} Runden`);
          svc.ui.toast(`Schief! Die Spatzen kichern in die Flügel. Geschafft: ${rounds} Runden.`, { ms: 5000 });
          sch.later(1.5, () => { stop(); games.end(ID); });
        }
      });
      f.hitbox([0.36, 0.98, 0.05], [0.3, 0.3, 0.3], {
        label: 'Glöckchen am Notenständer', verb: 'Spatzen-Echo starten', range: 3, filter: () => state === 'idle',
        onInteract: () => { games.start(ID, { onAbort: stop }); seq = createSequenceGame(freshRng(), NOTES); rounds = 0; svc.audio.play('bell'); demo(); },
      });
      watchDistance(kit, f, [0, 0, 0], 8, () => state !== 'idle', () => { stop(); games.end(ID); });
    },
  }),

  // ------------------------------------------------------------------ 7. Sternbilder nachzeichnen
  defineProp({
    name: 'starChart',
    create(f, opts, kit) {
      const svc = kit.services, games = svc.games, ID = 'sternbilder';
      games.register(ID, { name: 'Sternbilder nachzeichnen', room: kit.room?.id, unit: 'Sternbilder', egg: 'sternbild-zeichnerin', eggName: 'Alle drei Sternbilder an der Sternkarte nachgezeichnet' });
      const SETS = [
        { name: 'Großer Wagen', stars: [[-1.0, 0.3], [-0.6, 0.4], [-0.25, 0.28], [0.08, 0.15], [0.12, -0.28], [0.72, -0.34], [0.78, 0.08]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
        { name: 'Kassiopeia', stars: [[-0.9, 0.3], [-0.45, -0.3], [0, 0.1], [0.45, -0.35], [0.9, 0.25]], edges: [[0, 1], [1, 2], [2, 3], [3, 4]] },
        { name: 'Die Teekanne', stars: [[-0.45, 0.22], [-0.05, 0.52], [0.35, 0.22], [0.35, -0.42], [-0.45, -0.42], [0.88, 0.18], [-0.88, -0.08]], edges: [[0, 1], [1, 2], [0, 2], [2, 3], [3, 4], [4, 0], [2, 5], [5, 3], [0, 6], [6, 4]] },
      ];
      const Y = 1.55, Wd = 2.5, Hd = 1.7;
      for (const s of [-1, 1]) f.add(box(0.06, 2.2, 0.06, 0), 'woodDark', [s * 0.9, 1.1, -0.15], [0.12, 0, 0]);
      f.add(box(0.06, 2.0, 0.06, 0), 'woodDark', [0, 1.0, -0.55], [-0.3, 0, 0]);
      f.add(box(Wd + 0.1, 0.06, 0.12, 0), 'woodDark', [0, Y - Hd / 2 - 0.05, 0.02]);
      const boardTex = canvasTexture(512, 352, (g, w, h) => {
        const gr = g.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.7); gr.addColorStop(0, '#2a2a6a'); gr.addColorStop(1, '#141436');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        const r = makeRng('sternkarte'); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,250,230,${0.15 + r.next() * 0.35})`; g.fillRect(r.next() * w, r.next() * h, 1.5, 1.5); }
        g.strokeStyle = '#c8a040'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
      }, { repeat: false });
      f.mesh(new THREE.PlaneGeometry(Wd, Hd), new THREE.MeshBasicMaterial({ map: boardTex, color: new THREE.Color(0.85, 0.85, 0.85) }), [0, Y, 0.0]);
      f.add(box(Wd + 0.08, Hd + 0.08, 0.04, 0), 'woodDark', [0, Y, -0.03]);
      const P = (st) => [st[0] * 1.1, Y + st[1] * 1.15, 0.03];
      const starM = glowMat('#fff2b0', 1.3), guideM = new THREE.MeshBasicMaterial({ color: '#5a6aaa' }), lineM = glowMat('#ffd86a', 1.15);
      const line = (a, b, m, w, dz = -0.008) => { const dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy); const o = M(box(l, w, 0.006, 0), m, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2] + dz]); o.rotation.z = Math.atan2(dy, dx); return o; };
      const groups = SETS.map((set) => {
        const g = f.object(new THREE.Group());
        const stars = set.stars.map((st, i) => {
          const m = M(sphere(0.045, 10, 8), starM, P(st)); g.add(m);
          const hit = M(sphere(0.13, 6, 4), 'invisible', P(st)); hit.userData.hitbox = true; g.add(hit);
          f.interactable(hit, { label: `Stern im Bild „${set.name}“`, verb: 'Linie ziehen', range: 4.5, onInteract: () => click(i) });
          return m;
        });
        for (const [a, b] of set.edges) g.add(line(P(set.stars[a]), P(set.stars[b]), guideM, 0.012));
        const lbl = sign(kit, set.name, 0.9, 40); lbl.position.set(0, Y + Hd / 2 + 0.16, 0.02); g.add(lbl);
        g.visible = false;
        return { g, stars };
      });
      const drawn = f.object(new THREE.Group());
      let cur = 0, con = null, playing = false, doneCount = 0, busy = false;
      const show = (k) => { groups.forEach((x, i) => { x.g.visible = i === k; }); drawn.clear(); con = createConstellation(SETS[k].edges); for (const s of groups[k].stars) s.scale.setScalar(1); };
      show(0);
      const sch = scheduler(kit);
      kit.onUpdate((dt, t) => { const k = groups[cur]; k.stars.forEach((s, i) => { s.scale.setScalar(con.last === i ? 1.6 + Math.sin(t * 6) * 0.2 : 1 + Math.sin(t * 2 + i) * 0.08); }); });
      const hud = () => games.hud(ID, `${SETS[cur].name}: ${con.drawn.length}/${SETS[cur].edges.length} Linien`);
      function click(i) {
        if (busy) return;
        if (!playing) { games.start(ID, { onAbort: stop }); playing = true; doneCount = 0; }
        const r = con.click(i);
        svc.audio.note(['c', 'd', 'e', 'f', 'g', 'a', 'h'][i % 7], { type: 'sine', gain: 0.07, dur: 0.5 });
        if (r === 'line' || r === 'done') { const [a, b] = con.drawn.at(-1); drawn.add(line(P(SETS[cur].stars[a]), P(SETS[cur].stars[b]), lineM, 0.025, 0.002)); }
        hud();
        if (r === 'done') {
          doneCount++; busy = true; svc.audio.play('magic');
          svc.ui.toast(`✦ „${SETS[cur].name}“ leuchtet auf! Irgendwo oben in der Kuppel zwinkert das echte Sternbild zurück.`, { ms: 4500 });
          games.record(ID, doneCount);
          if (doneCount >= SETS.length) games.win(ID);
          sch.later(2.2, () => { busy = false; cur = (cur + 1) % SETS.length; show(cur); if (doneCount >= SETS.length) { playing = false; games.end(ID); } else hud(); });
        }
      }
      function stop() { sch.clear(); playing = false; busy = false; show(cur); }
      watchDistance(kit, f, [0, 0, 1], 8, () => playing, () => { stop(); games.end(ID); });
    },
  }),

  // ------------------------------------------------------------------ 8. Ringflug-Parcours (Prop bei Raum-Ursprung platzieren)
  defineProp({
    name: 'ringRace',
    create(f, opts, kit) {
      const svc = kit.services, games = svc.games, ID = 'ringflug';
      games.register(ID, { name: 'Ringflug durch den Pilzhain', room: kit.room?.id, unit: 's', lower: true, egg: 'ringflug-ass', eggName: 'Den Ringflug in unter einer Minute geschafft' });
      const flag = opts.flag ?? [0, 0, 0], rings = opts.rings ?? [];
      f.add(cyl(0.04, 0.05, 2.4, 8), 'woodLight', [flag[0], 1.2, flag[2]]);
      f.add(sphere(0.07, 8, 6), 'gold', [flag[0], 2.43, flag[2]]);
      f.add(cone(0.35, 0.7, 3), 'candy', [flag[0] + 0.33, 2.05, flag[2]], [0, 0, -Math.PI / 2], [1, 1, 0.12]);
      f.collider(flag[0], flag[2], 0.2, 0.2);
      f.object(sign(kit, 'Ringflug: Durch alle Ringe – so schnell du kannst!', 1.0, 30), [flag[0], 1.45, flag[2] + 0.06]);
      const ringObjs = rings.map((p, i) => {
        const prev = i ? rings[i - 1] : flag, dx = p[0] - prev[0], dz = p[2] - prev[2];
        const m = new THREE.MeshStandardMaterial({ color: '#c8a8ff', emissive: '#c8a8ff', emissiveIntensity: 0.2, roughness: 0.4 });
        const o = f.mesh(torus(0.85, 0.06, 8, 30), m, p, [0, Math.atan2(dx, dz), 0]);
        return { o, m, w: f.world(...p) };
      });
      let state = 'idle', next = 0, time = 0;
      const col = (r, c, k) => { r.m.color.set(c); r.m.emissive.set(c); r.m.emissiveIntensity = k; };
      const resetRings = () => ringObjs.forEach((r) => { col(r, '#c8a8ff', 0.2); r.o.scale.setScalar(1); });
      const body = new THREE.Vector3();
      kit.onUpdate((dt, t) => {
        if (state !== 'play') return;
        time += dt;
        const p = svc.player.pos; body.set(p.x, p.y + 0.9, p.z);
        const r = ringObjs[next];
        r.o.scale.setScalar(1 + Math.sin(t * 6) * 0.06);
        if (throughRing(body, [r.w.x, r.w.y, r.w.z], 1.05)) {
          col(r, '#7ae8a8', 0.5); r.o.scale.setScalar(1); svc.audio.play('chime'); next++;
          if (next >= ringObjs.length) {
            state = 'idle'; svc.audio.play('magic');
            const rec = games.record(ID, time);
            if (time < 60) games.win(ID);
            svc.ui.toast(`Ziel! ${formatTime(time)}${rec ? ' – Bestzeit!' : ''} Die Pilze wackeln anerkennend mit den Hüten.`, { ms: 5500 });
            setTimeout(resetRings, 4000);
            games.end(ID); return;
          }
          col(ringObjs[next], '#ffd86a', 0.7);
        }
        games.hud(ID, `Ring ${next + 1}/${ringObjs.length} · ${formatTime(time)}`);
        if (time > 180) { stop(); games.end(ID); svc.ui.toast('Der Ringflug ist eingeschlafen. Versuch es nochmal an der Startfahne!'); }
      });
      function stop() { state = 'idle'; resetRings(); }
      f.hitbox([flag[0], 1.3, flag[2]], [0.6, 2.4, 0.6], {
        label: 'Startfahne', verb: 'Ringflug starten', range: 3, filter: () => state === 'idle',
        onInteract: () => {
          games.start(ID, { onAbort: stop });
          resetRings(); next = 0; time = 0; state = 'play'; col(ringObjs[0], '#ffd86a', 0.7);
          svc.audio.play('whoosh');
          svc.ui.toast('Los! Spring durch den goldenen Ring – die Sprungpilze helfen dir hoch hinaus.', { ms: 4500 });
        },
      });
      watchDistance(kit, f, flag, 22, () => state === 'play', () => { stop(); games.end(ID); });
    },
  }),

  // ------------------------------------------------------------------ 9. Angeln im Lesebad
  defineProp({
    name: 'fishingSpot',
    create(f, opts, kit) {
      const svc = kit.services, games = svc.games, ID = 'angeln';
      games.register(ID, { name: 'Bücher-Angeln', room: kit.room?.id, unit: 'Fänge in Folge', egg: 'goldenes-buch', eggName: 'Das Goldene Buch vom Beckengrund geangelt' });
      const WY = opts.waterY ?? 0.2, BZ = opts.reach ?? 2.4;
      f.add(box(0.9, 0.08, 0.5, 0), 'woodLight', [0, 0.32, -0.2]);
      for (const x of [-0.38, 0.38]) f.add(box(0.06, 0.32, 0.4, 0), 'woodLight', [x, 0.16, -0.2]);
      f.add(new THREE.CylinderGeometry(0.17, 0.14, 0.3, 14, 1, true), 'porcelainBlue', [0.7, 0.15, -0.3]);
      f.add(new THREE.CircleGeometry(0.14, 12), 'water', [0.7, 0.24, -0.3], [-Math.PI / 2, 0, 0]);
      f.add(cone(0.05, 0.1, 3), 'orange', [0.72, 0.33, -0.3], [0.3, 0, 0], [1, 1, 0.3]);
      f.collider(0, -0.2, 0.9, 0.5, { top: 0.36 });
      const A = new THREE.Vector3(0.15, 0.4, -0.1), T = new THREE.Vector3(0, 1.9, 1.5);
      const rod = new THREE.Mesh(cyl(0.012, 0.022, A.distanceTo(T), 6), mat('woodDark'));
      rod.position.copy(A).add(T).multiplyScalar(0.5);
      rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), T.clone().sub(A).normalize());
      f.object(rod);
      f.add(torus(0.04, 0.01, 4, 10), 'brass', [0.12, 0.6, 0.06], [0, Math.PI / 2, 0]);
      const root = f.object(new THREE.Group());
      const bob = new THREE.Group();
      bob.add(M(new THREE.SphereGeometry(0.05, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 'candy'));
      bob.add(M(new THREE.SphereGeometry(0.05, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 'white'));
      bob.add(M(cyl(0.006, 0.006, 0.08, 4), 'black', [0, 0.07, 0]));
      compactGroup(bob); root.add(bob);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([T, T]);
      const ln = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#f4f0e0' })); ln.frustumCulled = false; root.add(ln);
      const ring = M(torus(0.12, 0.008, 4, 20), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 }), [0, WY + 0.01, BZ], [Math.PI / 2, 0, 0]); root.add(ring);
      const CATCH = [
        { w: 5, t: 'einen Fisch, der gerade ein Buch liest. Er ist empört und hüpft zurück ins Becken.' },
        { w: 4, t: 'eine einzelne, sehr nasse Socke. Sie gehört bestimmt in die Sockenkiste im Fundbüro.' },
        { w: 4, t: 'eine Flaschenpost: »Wellen schwappen, Seiten klappen.« Ein Gedicht! Ein kurzes.' },
        { w: 3, t: 'eine Quietscheente, die behauptet, Kapitänin zu sein. Sie salutiert.' },
        { w: 3, t: 'einen Badeschwamm mit Lesebrille. Er war gerade an einer spannenden Stelle.' },
        { w: 2, t: 'eine Seifenblase, die partout nicht platzen will.' },
        { w: 2, t: 'ein Lesezeichen, das sich verschwommen hat. Du gibst ihm die Richtung.' },
      ];
      let state = 'idle', timer = 0, streak = 0, k = 0;
      const idleP = new THREE.Vector3(T.x, T.y - 0.6, T.z);
      const bobP = new THREE.Vector3().copy(idleP);
      const target = new THREE.Vector3(0, WY, BZ);
      const hud = () => games.hud(ID, state === 'bite' ? 'ES BEISST! Jetzt klicken!' : `Fangserie ${streak} · Warten … (zu früh ziehen verscheucht den Fisch)`);
      kit.onUpdate((dt, t) => {
        if (state === 'cast') { k = Math.min(1, k + dt * 1.8); bobP.lerpVectors(idleP, target, ease(k)); bobP.y += Math.sin(k * Math.PI) * 0.6; if (k >= 1) { state = 'wait'; timer = 2 + Math.random() * 4; svc.audio.play('splash'); hud(); } }
        else if (state === 'wait') { bobP.copy(target); bobP.y += Math.sin(t * 2.5) * 0.012; timer -= dt; if (timer <= 0) { state = 'bite'; timer = 0.9; svc.audio.play('splash'); hud(); } }
        else if (state === 'bite') { bobP.copy(target); bobP.y -= 0.05 + Math.abs(Math.sin(t * 20)) * 0.03; ring.material.opacity = 0.7; timer -= dt; if (timer <= 0) miss('Platsch – entwischt! Das war wohl ein sehr schneller Fisch.'); }
        else if (state === 'idle') { bobP.lerp(idleP, Math.min(1, dt * 4)); }
        ring.material.opacity = Math.max(0, ring.material.opacity - dt * 0.8);
        ring.scale.setScalar(1 + (0.7 - ring.material.opacity) * 1.5);
        bob.position.copy(bobP);
        const pos = lineGeo.attributes.position; pos.setXYZ(1, bobP.x, bobP.y + 0.04, bobP.z); pos.needsUpdate = true;
      });
      function miss(text) { streak = 0; state = 'idle'; svc.ui.toast(text, { ms: 3500 }); games.end(ID); }
      function reel() {
        streak++; state = 'idle'; svc.audio.play('splash');
        const gold = streak >= 5 && !svc.progress.has('secrets', 'goldenes-buch');
        const c = gold ? { t: 'das GOLDENE BUCH vom Grund des Beckens! Es glitzert, tropft und gähnt zufrieden.' } : pickCatch(CATCH, Math.random());
        svc.ui.toast(`Du ziehst … ${c.t}`, { ms: 5500 });
        games.record(ID, streak);
        if (gold) { games.win(ID); svc.audio.play('magic'); }
        games.end(ID);
      }
      f.hitbox([0.1, 1.0, 0.6], [0.6, 1.6, 1.4], {
        label: 'Angel', verb: 'Auswerfen', range: 3, filter: () => state === 'idle',
        onInteract: () => {
          games.start(ID, { onAbort: () => { state = 'idle'; } });
          state = 'cast'; k = 0; svc.audio.play('whoosh'); hud();
          games.capture(ID, () => {
            if (state === 'bite') { reel(); return true; }
            if (state === 'wait') { miss('Zu früh gezogen! Der Fisch erschrickt und liest woanders weiter.'); return true; }
            return state === 'cast';
          });
        },
      });
      watchDistance(kit, f, [0, 0, 0], 8, () => state !== 'idle', () => { state = 'idle'; games.end(ID); });
    },
  }),

  // ------------------------------------------------------------------ 10. Zahnrad-Tresor
  defineProp({
    name: 'gearPuzzle',
    create(f, opts, kit) {
      const svc = kit.services, games = svc.games, ID = 'zahnradtresor';
      games.register(ID, { name: 'Zahnrad-Tresor', room: kit.room?.id, unit: 'Züge', lower: true, egg: 'zahnrad-tresor', eggName: 'Den Zahnrad-Tresor geknackt' });
      const POS = [[-0.58, 1.32], [0, 1.15], [0.58, 1.32], [-0.12, 0.56], [0.72, 0.74]];
      const LINKS = [[1], [0, 2, 3], [1, 4], [1], [2]];
      f.add(box(2.1, 1.75, 0.42, 1), 'woodRed', [0.07, 0.95, -0.21]);
      f.add(box(1.95, 1.55, 0.02, 0), 'copper', [0.07, 0.95, 0.01]);
      f.add(box(2.2, 0.08, 0.5, 0), 'woodDark', [0.07, 1.86, -0.21]);
      f.add(box(2.2, 0.08, 0.5, 0), 'woodDark', [0.07, 0.04, -0.21]);
      f.collider(0.07, -0.21, 2.1, 0.44);
      // Kleines Fach oben mit Tür
      f.add(box(0.5, 0.36, 0.3, 0), 'woodDark', [0.07, 2.08, -0.2]);
      const prize = f.mesh(sphere(0.06, 10, 8), glowMat('#ffe8a0', 1.3), [0.07, 2.06, -0.12]);
      const door = new THREE.Group(); door.add(M(box(0.42, 0.3, 0.03, 0), 'brass', [0.21, 0, 0])); door.add(M(sphere(0.02, 6, 4), 'gold', [0.36, 0, 0.02]));
      compactGroup(door); f.object(door, [-0.14, 2.08, -0.04]);
      f.object(sign(kit, 'Zahnrad-Tresor: Alle Pfeile nach oben!', 1.0, 32), [0.07, 1.74, 0.03]);
      const gears = POS.map(([x, y], i) => {
        const g = new THREE.Group();
        g.add(M(cyl(0.24, 0.24, 0.05, 20), 'brass', [0, 0, 0], [Math.PI / 2, 0, 0]));
        for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; g.add(M(box(0.06, 0.07, 0.05, 0), 'brass', [Math.cos(a) * 0.26, Math.sin(a) * 0.26, 0], [0, 0, a])); }
        g.add(M(cyl(0.05, 0.05, 0.07, 10), 'iron', [0, 0, 0.02], [Math.PI / 2, 0, 0]));
        g.add(M(box(0.03, 0.15, 0.01, 0), 'candy', [0, 0.09, 0.035]));
        g.add(M(cone(0.05, 0.08, 3), 'candy', [0, 0.19, 0.035], null, [1, 1, 0.2]));
        compactGroup(g); f.object(g, [x, y, 0.06]);
        return { g, ang: 0, to: 0 };
      });
      const rng = makeRng(`tresor:${kit.id}`);
      let state = scrambleGears(rng.next, LINKS, 7), moves = 0, playing = false, solved = false, doorK = 0;
      const sync = (snap) => gears.forEach((gr, i) => { gr.to = -state[i] * Math.PI / 2; if (snap) gr.ang = gr.to; });
      sync(true);
      kit.onUpdate((dt) => {
        for (const gr of gears) { gr.ang += (gr.to - gr.ang) * Math.min(1, dt * 8); gr.g.rotation.z = gr.ang; }
        doorK += ((solved ? 1 : 0) - doorK) * Math.min(1, dt * 4); door.rotation.y = -doorK * 1.6; prize.visible = doorK > 0.2;
      });
      prize.visible = false;
      function turn(i) {
        if (solved) { solved = false; state = scrambleGears(freshRng(), LINKS, 7); moves = 0; sync(false); }
        if (!playing) { games.start(ID, { onAbort: () => { playing = false; } }); playing = true; moves = 0; }
        const before = state;
        state = turnGear(state, i, LINKS);
        for (const k of [i, ...LINKS[i]]) gears[k].to -= Math.PI / 2;
        void before;
        moves++; svc.audio.play('tick');
        games.hud(ID, `Züge ${moves}`);
        if (gearsSolved(state)) {
          solved = true; playing = false; svc.audio.play('chime');
          games.record(ID, moves); games.win(ID);
          svc.ui.toast(`Klick-klack – das Fach springt auf! Darin glimmt eine verlorene Minute. (${moves} Züge)`, { ms: 5500 });
          setTimeout(() => games.end(ID), 1500);
        }
      }
      gears.forEach((gr, i) => f.hitbox([POS[i][0], POS[i][1], 0.1], [0.55, 0.55, 0.12], {
        label: 'Zahnrad', verb: () => (solved ? 'Neu mischen' : 'Drehen'), range: 3.5, onInteract: () => turn(i),
      }));
      watchDistance(kit, f, [0, 0, 1], 8, () => playing, () => { playing = false; games.end(ID); });
    },
  }),
];
