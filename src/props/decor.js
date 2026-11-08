import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, torus, lathe } from '../world/geo.js';
import { mat, hdr } from '../world/materials.js';
import { canvasTexture, signTexture } from '../world/textures.js';
import { compactGroup } from '../world/kit.js';
import { makeRng } from '../core/rng.js';

// Kleine Details für alle Räume: Wimpelketten, Hängepflanzen, Kerzengruppen, Porträts der Bewohner,
// Mäusetüren, Zauberfenster, Goldfischglas, Kristalle, Papiersterne, Kissenberge, Schneekugeln,
// Federkieldosen und kleine Wandbretter. Wandprops zeigen mit lokal +z in den Raum.

const PASTELS = ['pastelPink', 'pastelMint', 'pastelSky', 'pastelLilac', 'pastelLemon', 'pastelPeach'];
const seedOf = (kit, opts, name) => `${name}:${kit.id}:${opts.seed ?? JSON.stringify(opts.at ?? [])}`;
const M = (geo, m, pos, rot, scale) => {
  const o = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m);
  if (pos) o.position.set(...pos);
  if (rot) o.rotation.set(...rot);
  if (scale) typeof scale === 'number' ? o.scale.setScalar(scale) : o.scale.set(...scale);
  return o;
};

// ---------------------------------------------------------------- Porträts der Bewohner
function drawFace(g, w, h, subject) {
  const cx = w / 2, cy = h * 0.52;
  const circle = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
  const ell = (x, y, rx, ry, c, rot = 0) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); };
  const eye = (x, y, r = 14) => { circle(x, y, r, '#fff'); circle(x + 2, y + 2, r * 0.55, '#1a1420'); circle(x + 5, y - 3, r * 0.2, '#fff'); };
  const tri = (pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.closePath(); g.fill(); };
  const whiskers = (y) => { g.strokeStyle = '#3a2a2a'; g.lineWidth = 2; for (const s of [-1, 1]) for (const d of [-8, 0, 8]) { g.beginPath(); g.moveTo(cx + s * 24, y); g.lineTo(cx + s * 70, y + d); g.stroke(); } };
  const blush = (y, dx = 46) => { for (const s of [-1, 1]) ell(cx + s * dx, y, 12, 7, 'rgba(255,120,150,0.5)'); };
  switch (subject) {
    case 'eule':
      ell(cx, cy + 20, 70, 85, '#8a6040'); ell(cx, cy + 40, 45, 55, '#e8d0a8');
      tri([[cx - 60, cy - 50], [cx - 40, cy - 95], [cx - 20, cy - 55]], '#8a6040'); tri([[cx + 60, cy - 50], [cx + 40, cy - 95], [cx + 20, cy - 55]], '#8a6040');
      circle(cx - 28, cy - 15, 26, '#f0e0c0'); circle(cx + 28, cy - 15, 26, '#f0e0c0'); eye(cx - 28, cy - 15, 18); eye(cx + 28, cy - 15, 18);
      g.strokeStyle = '#c8a040'; g.lineWidth = 4; g.beginPath(); g.arc(cx + 28, cy - 15, 24, 0, Math.PI * 2); g.stroke();
      tri([[cx - 9, cy + 8], [cx + 9, cy + 8], [cx, cy + 26]], '#f0a030'); break;
    case 'maus':
      circle(cx - 55, cy - 50, 34, '#a8a0a8'); circle(cx + 55, cy - 50, 34, '#a8a0a8'); circle(cx - 55, cy - 50, 22, '#f4b0c0'); circle(cx + 55, cy - 50, 22, '#f4b0c0');
      ell(cx, cy, 62, 56, '#b8b0b8'); eye(cx - 24, cy - 8); eye(cx + 24, cy - 8); circle(cx, cy + 20, 9, '#f07090'); whiskers(cy + 22); blush(cy + 18);
      g.strokeStyle = '#c8a040'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy + 60, 40, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); break;
    case 'katze':
      tri([[cx - 62, cy - 10], [cx - 50, cy - 85], [cx - 10, cy - 45]], '#f0a050'); tri([[cx + 62, cy - 10], [cx + 50, cy - 85], [cx + 10, cy - 45]], '#f0a050');
      ell(cx, cy, 66, 58, '#f4b060'); for (const d of [-20, 0, 20]) { g.fillStyle = '#d88a30'; g.fillRect(cx + d - 4, cy - 58, 8, 22); }
      eye(cx - 26, cy - 6, 15); eye(cx + 26, cy - 6, 15); tri([[cx - 8, cy + 16], [cx + 8, cy + 16], [cx, cy + 25]], '#f07090'); whiskers(cy + 24); blush(cy + 20); break;
    case 'igel':
      for (let i = 0; i < 14; i++) { const a = Math.PI + (i / 13) * Math.PI; tri([[cx + Math.cos(a) * 50, cy + Math.sin(a) * 50], [cx + Math.cos(a - 0.12) * 105, cy + Math.sin(a - 0.12) * 105], [cx + Math.cos(a + 0.2) * 50, cy + Math.sin(a + 0.2) * 50]], '#6a4a30'); }
      ell(cx, cy + 10, 70, 62, '#7a5a3a'); ell(cx, cy + 22, 50, 46, '#f0d8b0'); eye(cx - 22, cy + 6, 11); eye(cx + 22, cy + 6, 11); circle(cx, cy + 34, 9, '#2a1a1a'); blush(cy + 32, 36);
      ell(cx, cy - 58, 46, 10, '#5a8a3a'); ell(cx, cy - 72, 26, 18, '#5a8a3a'); break;
    case 'drache':
      tri([[cx - 40, cy - 50], [cx - 30, cy - 95], [cx - 14, cy - 55]], '#f0d870'); tri([[cx + 40, cy - 50], [cx + 30, cy - 95], [cx + 14, cy - 55]], '#f0d870');
      ell(cx, cy, 70, 60, '#7ac87a'); ell(cx, cy + 30, 46, 28, '#b8e8a8'); circle(cx - 14, cy + 26, 5, '#3a6a3a'); circle(cx + 14, cy + 26, 5, '#3a6a3a');
      eye(cx - 28, cy - 14, 15); eye(cx + 28, cy - 14, 15); blush(cy + 10, 52);
      g.strokeStyle = '#3a6a3a'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy + 34, 20, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); break;
    case 'teekanne':
      ell(cx, cy + 10, 70, 58, '#f4f0f8'); ell(cx, cy - 46, 30, 12, '#f4f0f8'); circle(cx, cy - 60, 9, '#e870a0');
      g.strokeStyle = '#f4f0f8'; g.lineWidth = 14; g.beginPath(); g.arc(cx + 78, cy + 8, 26, -1.4, 1.4); g.stroke();
      tri([[cx - 64, cy + 10], [cx - 112, cy - 20], [cx - 104, cy - 30], [cx - 58, cy - 6]], '#f4f0f8');
      for (const [x, y] of [[-30, 30], [10, 46], [36, 20]]) circle(cx + x, cy + y, 8, '#7ab0e8');
      eye(cx - 22, cy - 2, 12); eye(cx + 22, cy - 2, 12); blush(cy + 16, 40); break;
    case 'schaf':
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; circle(cx + Math.cos(a) * 62, cy + Math.sin(a) * 58, 28, '#fbf8f2'); }
      circle(cx, cy, 64, '#fbf8f2'); ell(cx, cy + 12, 36, 44, '#3a3040'); ell(cx - 48, cy - 2, 18, 9, '#3a3040', 0.4); ell(cx + 48, cy - 2, 18, 9, '#3a3040', -0.4);
      eye(cx - 14, cy + 2, 9); eye(cx + 14, cy + 2, 9); break;
    case 'zauberer':
    default:
      tri([[cx - 64, cy - 30], [cx + 64, cy - 30], [cx + 10, cy - 130]], '#5a4aa8'); for (const [x, y] of [[-20, -60], [14, -90], [24, -46]]) circle(cx + x, cy + y, 5, '#f0d070');
      ell(cx, cy - 30, 80, 12, '#4a3a98'); ell(cx, cy + 4, 44, 40, '#f4d0b0'); eye(cx - 16, cy - 2, 9); eye(cx + 16, cy - 2, 9); circle(cx, cy + 14, 7, '#e8a090');
      tri([[cx - 44, cy + 20], [cx + 44, cy + 20], [cx, cy + 110]], '#f0eef0'); blush(cy + 12, 30); break;
  }
}

const SUBJECTS = {
  eule: ['Professor Puschel', 'Öl auf Leinwand. Er besteht darauf, dass das Monokel nachträglich größer gemalt wurde.'],
  maus: ['Frau Fingerhut', 'Die Uhrmacher-Maus beim Mittagsschlaf. Sie behauptet, sie habe nur kurz die Augen ausgeruht.'],
  katze: ['Die Bibliothekskatze', 'Saß dem Maler drei Stunden Modell. Dann vier Stunden auf seiner Palette.'],
  igel: ['Gustav, Gärtner', 'Gustav mit seinem Lieblingshut. Der Hut ist die eigentliche Berühmtheit.'],
  drache: ['Funki, als er klein war', 'Noch kleiner als heute. Ein Funke, ein Niesen, ein Rahmen musste ersetzt werden.'],
  teekanne: ['Mirabelle', 'Mirabelle in ihrer besten Glasur. Bitte nicht nachschenken – es ist nur ein Bild.'],
  schaf: ['Wolle, das Leitschaf', 'Das Gemälde wirkt flauschiger, je länger man es ansieht.'],
  zauberer: ['Der erste Bibliothekar', 'Er ging kurz Tee holen. Das ist jetzt ein paar Jahrhunderte her.'],
};
const faceTex = new Map();

// ---------------------------------------------------------------- Zauberfenster-Himmel (kachelt horizontal)
const skyTex = new Map();
function windowSky(mode) {
  if (skyTex.has(mode)) return skyTex.get(mode);
  const r = makeRng(`sky:${mode}`);
  const t = canvasTexture(512, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    const cols = { day: ['#7cc4f4', '#d4f0ff'], night: ['#1a1a4a', '#4a3a7a'], sunset: ['#f49ab4', '#ffd890'], sea: ['#7cc4f4', '#d4f0ff'] }[mode] ?? ['#7cc4f4', '#d4f0ff'];
    grad.addColorStop(0, cols[0]); grad.addColorStop(1, cols[1]); g.fillStyle = grad; g.fillRect(0, 0, w, h);
    if (mode === 'night') {
      for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,250,220,${0.4 + r.next() * 0.6})`; const s = r.next() < 0.15 ? 3 : 1.6; g.fillRect(r.next() * w, r.next() * h * 0.8, s, s); }
      g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(w * 0.7, h * 0.3, 22, 0, Math.PI * 2); g.fill();
      g.fillStyle = cols[0]; g.beginPath(); g.arc(w * 0.7 + 9, h * 0.3 - 5, 19, 0, Math.PI * 2); g.fill();
    }
    // Wolken (wrap-around, damit die Textur nahtlos weiterzieht)
    const cloudCol = mode === 'night' ? 'rgba(200,190,255,0.35)' : mode === 'sunset' ? 'rgba(255,240,250,0.85)' : 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 7; i++) {
      const x = r.next() * w, y = h * (0.15 + r.next() * 0.45), s = 18 + r.next() * 18;
      for (const dx of [-w, 0, w]) for (let k = 0; k < 5; k++) { g.fillStyle = cloudCol; g.beginPath(); g.arc(x + dx + (k - 2) * s * 0.8, y + Math.abs(k - 2) * s * 0.25, s * (1 - Math.abs(k - 2) * 0.18), 0, Math.PI * 2); g.fill(); }
    }
    if (mode === 'sea') { g.fillStyle = '#4a9ad0'; g.fillRect(0, h * 0.7, w, h * 0.3); g.fillStyle = 'rgba(255,255,255,0.6)'; for (let i = 0; i < 30; i++) g.fillRect(r.next() * w, h * (0.72 + r.next() * 0.26), 10, 2); }
    else { g.fillStyle = mode === 'night' ? '#2a2a50' : '#8ac87a'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * 0.86 - Math.sin((x / w) * Math.PI * 6) * 10 - Math.sin((x / w) * Math.PI * 2) * 8); g.lineTo(w, h); g.fill(); }
  });
  t.wrapS = THREE.RepeatWrapping; t.repeat.set(0.5, 1);
  skyTex.set(mode, t);
  return t;
}

// Kristall-Materialien je Farbe teilen (ein Material = ein gemergter Draw Call pro Raum statt pro Kristall)
const crystalMats = new Map();
const crystalMat = (color) => {
  if (!crystalMats.has(color)) crystalMats.set(color, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.2, metalness: 0.1, flatShading: true }));
  return crystalMats.get(color);
};

export default [
  // Wimpelkette entlang lokal x (length), hängt durch
  defineProp({
    name: 'bunting',
    create(f, opts, kit) {
      const L = opts.length ?? 4, y = opts.y ?? 3, sag = opts.sag ?? 0.4;
      const cols = opts.colors ?? PASTELS;
      const Y = (x) => y - sag * (1 - (2 * x / L) ** 2);
      const n = Math.max(2, Math.round(L / 0.5));
      for (let i = 0; i < n; i++) {
        const x0 = -L / 2 + (i / n) * L, x1 = -L / 2 + ((i + 1) / n) * L;
        const len = Math.hypot(x1 - x0, Y(x1) - Y(x0));
        f.add(cyl(0.006, 0.006, len, 4), 'cream', [(x0 + x1) / 2, (Y(x0) + Y(x1)) / 2, 0], [0, 0, Math.PI / 2 + Math.atan2(Y(x1) - Y(x0), x1 - x0)]);
      }
      const k = Math.floor(L / 0.36);
      for (let i = 1; i < k; i++) {
        const x = -L / 2 + (i / k) * L;
        f.add(cone(0.11, 0.24, 3), cols[i % cols.length], [x, Y(x) - 0.12, 0], [0, 0, Math.PI], [1, 1, 0.15]);
      }
      if (opts.posts) for (const s of [-1, 1]) f.add(cyl(0.02, 0.02, 0.2, 6), 'brass', [s * L / 2, y, 0]);
    },
  }),

  // Hängepflanze im Makramee-Netz (top = Deckenhöhe relativ zum Boden)
  defineProp({
    name: 'hangingPlant',
    create(f, opts, kit) {
      const top = opts.top ?? 4, y = opts.y ?? top - 1.4, s = opts.scale ?? 1;
      const r = makeRng(seedOf(kit, opts, 'hangingPlant'));
      f.add(lathe([[0, 0], [0.1 * s, 0], [0.15 * s, 0.05 * s], [0.17 * s, 0.18 * s], [0.18 * s, 0.2 * s], [0, 0.2 * s]]), opts.pot ?? 'terracotta', [0, y, 0]);
      f.add(torus(0.04, 0.01, 4, 10), 'brass', [0, top - 0.05, 0], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2, px = Math.cos(a) * 0.17 * s, pz = Math.sin(a) * 0.17 * s;
        const dy = top - 0.05 - (y + 0.15 * s), len = Math.hypot(px, dy, pz);
        const dir = new THREE.Vector3(px, -dy, pz).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
        const e = new THREE.Euler().setFromQuaternion(q);
        f.add(cyl(0.006, 0.006, len, 4), 'cream', [px / 2, top - 0.05 - dy / 2, pz / 2], [e.x, e.y, e.z]);
      }
      f.add(sphere(0.17 * s, 10, 6), opts.leaf ?? 'leaves', [0, y + 0.22 * s, 0], [0, 0, 0], [1, 0.55, 1]);
      // herabhängende Ranken
      for (let v = 0; v < 6; v++) {
        const a = r.range(0, Math.PI * 2), len = r.range(0.3, 0.9) * s;
        for (let k = 0; k < len / 0.07; k++) f.add(sphere(0.035 * s, 6, 4), k % 3 ? (opts.leaf ?? 'leaves') : 'leavesPink', [Math.cos(a) * (0.18 * s + k * 0.006), y + 0.18 * s - k * 0.07, Math.sin(a) * (0.18 * s + k * 0.006)], [0, 0, 0], [1, 0.6, 1]);
      }
    },
  }),

  // Kerzengruppe auf einem Teller (ohne eigenes Licht, nur Schein)
  defineProp({
    name: 'candleCluster',
    create(f, opts, kit) {
      const r = makeRng(seedOf(kit, opts, 'candles'));
      const n = opts.count ?? 4;
      f.add(cyl(0.16, 0.17, 0.02, 16), opts.plate ?? 'brass', [0, 0.01, 0]);
      let top = 0;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r.range(0, 0.5), rr = n > 1 ? 0.08 : 0, h = r.range(0.08, 0.26);
        const x = Math.cos(a) * rr, z = Math.sin(a) * rr; top = Math.max(top, h);
        f.add(cyl(0.025, 0.027, h, 10), i % 2 ? 'wax' : (opts.wax ?? 'cream'), [x, 0.02 + h / 2, z]);
        f.add(sphere(0.012, 6, 5), 'wax', [x + 0.022, 0.02 + h - 0.03, z], [0, 0, 0], [1, 2, 1]);
        f.add(sphere(0.014, 6, 5), 'flame', [x, 0.02 + h + 0.03, z], [0, 0, 0], [1, 2.3, 1]);
      }
      f.glow([0, top + 0.1, 0], { color: '#ffaa55', size: 0.7, opacity: 0.45 });
      if (opts.light) f.light([0, top + 0.3, 0], { color: '#ffa850', intensity: 3, distance: 5, flicker: true });
    },
  }),

  // Porträt eines Bewohners an der Wand (lokal +z in den Raum)
  defineProp({
    name: 'portrait',
    create(f, opts, kit) {
      const subject = opts.subject ?? 'eule';
      const W = opts.width ?? 0.7, H = opts.height ?? 0.9;
      const bg = opts.bg ?? '#3a5a4a';
      const key = `${subject}:${bg}`;
      if (!faceTex.has(key)) faceTex.set(key, canvasTexture(256, 320, (g, w, h) => {
        const grad = g.createRadialGradient(w / 2, h * 0.45, 20, w / 2, h / 2, h * 0.7); grad.addColorStop(0, '#f8eed8'); grad.addColorStop(1, bg);
        g.fillStyle = grad; g.fillRect(0, 0, w, h); drawFace(g, w, h, subject);
      }, { repeat: false }));
      const frameMat = opts.frame ?? 'gold';
      f.add(box(W + 0.14, H + 0.14, 0.05, 0), frameMat, [0, 0, 0.025]);
      for (const [x, y, w, h] of [[0, H / 2 + 0.05, W + 0.2, 0.05], [0, -H / 2 - 0.05, W + 0.2, 0.05], [W / 2 + 0.05, 0, 0.05, H + 0.2], [-W / 2 - 0.05, 0, 0.05, H + 0.2]]) f.add(box(w, h, 0.03, 0), frameMat, [x, y, 0.06]);
      f.add(sphere(0.03, 8, 6), frameMat, [0, H / 2 + 0.1, 0.06]);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshLambertMaterial({ map: faceTex.get(key) }));
      f.object(m, [0, 0, 0.056]);
      const [title, caption] = SUBJECTS[subject] ?? SUBJECTS.zauberer;
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.7, 0.09), new THREE.MeshLambertMaterial({ map: signTexture(opts.title ?? title, { w: 384, h: 64, bg: '#c8a040', ink: '#3a2410', size: 34, border: false }) }));
      f.object(plate, [0, -H / 2 - 0.02, 0.08]);
      f.interactable(m, {
        label: `Porträt: ${opts.title ?? title}`, verb: 'Betrachten', range: 5, secret: opts.secret, secretName: opts.secretName,
        onInteract: () => kit.services.ui.note(opts.title ?? title, opts.caption ?? caption),
      });
    },
  }),

  // Winzige Mäusetür in der Fußleiste (Wandprop). Fünf verschiedene angeklopft → Osterei.
  defineProp({
    name: 'mouseDoor',
    create(f, opts, kit) {
      const svc = kit.services;
      const col = opts.color ?? 'woodRed';
      f.add(box(0.28, 0.24, 0.03, 0), 'stoneDark', [0, 0.12, 0.015]);
      f.add(new THREE.CircleGeometry(0.14, 16, 0, Math.PI), 'stoneDark', [0, 0.24, 0.031]);
      f.add(box(0.22, 0.2, 0.03, 0), col, [0, 0.11, 0.035]);
      f.add(new THREE.CircleGeometry(0.11, 14, 0, Math.PI), col, [0, 0.21, 0.051]);
      for (const x of [-0.05, 0.05]) f.add(box(0.005, 0.26, 0.005, 0), 'woodDark', [x, 0.14, 0.052]);
      f.add(sphere(0.012, 8, 6), 'brass', [0.07, 0.12, 0.058]);
      f.add(box(0.06, 0.012, 0.005, 0), 'brass', [0, 0.16, 0.053]);
      f.add(new THREE.CircleGeometry(0.03, 12), 'window', [0, 0.25, 0.057]);
      f.add(box(0.26, 0.008, 0.12, 0), 'carpetRed', [0, 0.004, 0.11]);
      f.add(cyl(0.012, 0.012, 0.03, 8), 'glass', [0.12, 0.2, 0.05]);
      f.add(sphere(0.008, 6, 4), 'flame', [0.12, 0.2, 0.05]);
      f.glow([0.12, 0.2, 0.06], { color: '#ffcc77', size: 0.18, opacity: 0.6 });
      if (opts.sign) {
        const s = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.04), new THREE.MeshLambertMaterial({ map: signTexture(opts.sign, { w: 256, h: 64, size: 30, bg: '#f4e8c8', ink: '#5a3020', border: false }) }));
        f.object(s, [0, 0.3, 0.04]);
      }
      const lines = opts.lines ?? [
        '»Niemand zu Hause!«, piepst es. »Und wenn doch, dann schläft er.«',
        '»Wir kaufen nichts! Außer Käse. Haben Sie Käse?«',
        'Ein Zettel wird unter der Tür durchgeschoben: »Bin Krümel suchen. Zurück um Viertel nach Kuchen.«',
        '»Psst! Hier wird gerade ein Buch gelesen. Ein sehr kleines.«',
        'Die Tür öffnet sich einen Spalt. Ein Schnurrbart lugt heraus. Die Tür schließt sich wieder.',
      ];
      const id = `${kit.id}:${opts.seed ?? JSON.stringify(opts.at ?? [])}`;
      const egg = 'mausetueren';
      svc.secrets.register(egg, 'An fünf Mäusetüren geklopft', null, 'egg');
      let n = Math.floor(makeRng(id).next() * lines.length);
      f.hitbox([0, 0.15, 0.08], [0.4, 0.34, 0.2], {
        label: 'Winzige Tür', verb: 'Anklopfen', range: 3,
        onInteract: () => {
          svc.audio.play('knock');
          svc.ui.toast(lines[n++ % lines.length], { ms: 5000 });
          if (svc.progress.mark('knocks', id) && svc.progress.count('knocks') >= 5) svc.secrets.found(egg);
        },
      });
    },
  }),

  // Zauberfenster in fensterlosen Räumen: Himmel zieht vorbei (Wandprop, Mitte auf Höhe y)
  defineProp({
    name: 'magicWindow',
    create(f, opts, kit) {
      const W = opts.width ?? 1.2, H = opts.height ?? 1.5, y = opts.y ?? 1.9;
      const mode = opts.mode ?? 'day';
      const frameM = opts.frame ?? 'white';
      const t = windowSky(mode);
      const sky = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(0.9, 0.9, 0.9) }));
      f.object(sky, [0, y, 0.02]);
      f.add(box(W + 0.16, 0.08, 0.14, 0), frameM, [0, y + H / 2 + 0.04, 0.07]);
      f.add(box(W + 0.3, 0.06, 0.26, 0), frameM, [0, y - H / 2 - 0.03, 0.13]);
      for (const s of [-1, 1]) f.add(box(0.08, H, 0.14, 0), frameM, [s * (W / 2 + 0.04), y, 0.07]);
      f.add(box(0.04, H, 0.04, 0), frameM, [0, y, 0.05]);
      f.add(box(W, 0.04, 0.04, 0), frameM, [0, y + H * 0.15, 0.05]);
      // Vorhänge
      const cur = opts.curtain ?? 'velvet';
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) f.add(cyl(0.06, 0.09, H + 0.25, 8), cur, [s * (W / 2 + 0.12 + k * 0.08), y - 0.05, 0.16], [0, 0, 0], [1, 1, 0.6]);
      f.add(cyl(0.02, 0.02, W + 0.9, 6), 'brass', [0, y + H / 2 + 0.16, 0.17], [0, 0, Math.PI / 2]);
      for (const s of [-1, 1]) f.add(sphere(0.04, 8, 6), 'brass', [s * (W / 2 + 0.45), y + H / 2 + 0.16, 0.17]);
      if (opts.flowers !== false) {
        f.add(box(W * 0.6, 0.12, 0.14, 0), 'terracotta', [0, y - H / 2 + 0.06, 0.18]);
        const r = makeRng(seedOf(kit, opts, 'window'));
        for (let i = 0; i < 6; i++) { const x = -W * 0.25 + (i / 5) * W * 0.5; f.add(sphere(0.045, 6, 5), r.pick(['flowerRed', 'flowerYellow', 'pastelPink', 'flowerBlue']), [x, y - H / 2 + 0.17 + r.range(0, 0.05), 0.18]); }
      }
      kit.onUpdate((dt, time) => { t.offset.x = (time * 0.006) % 1; });
      f.interactable(sky, {
        label: 'Zauberfenster', verb: 'Hinausschauen', range: 5,
        onInteract: () => kit.services.ui.toast(opts.quip ?? ({ night: 'Draußen ist immer gerade Nacht. Die Sterne winken dir zu.', sunset: 'Ein Sonnenuntergang, der nie zu Ende geht. Sehr gemütlich.', sea: 'Ein Meer, das es gar nicht gibt. Man hört es trotzdem leise rauschen.' }[mode] ?? 'Dieses Fenster zeigt immer den schönsten Himmel – egal, wo der Raum gerade ist.')),
      });
    },
  }),

  // Goldfischglas: Fische ziehen Kreise, füttern lässt sie hochschnellen
  defineProp({
    name: 'fishBowl',
    create(f, opts, kit) {
      const y = opts.y ?? 0.8, R = 0.2;
      if (opts.stand !== false) {
        f.add(cyl(0.1, 0.16, 0.04, 14), 'brass', [0, 0.02, 0]);
        f.add(cyl(0.025, 0.025, y - 0.08, 8), 'brass', [0, (y - 0.08) / 2 + 0.04, 0]);
        f.add(torus(0.12, 0.015, 5, 16), 'brass', [0, y - 0.04, 0], [Math.PI / 2, 0, 0]);
        f.collider(0, 0, 0.3, 0.3, { top: y + 0.3 });
      }
      f.add(new THREE.SphereGeometry(R * 0.96, 18, 12, 0, Math.PI * 2, 0.55, Math.PI - 0.55), 'water', [0, y + R * 0.8, 0]);
      const glass = new THREE.Mesh(new THREE.SphereGeometry(R, 20, 14, 0, Math.PI * 2, 0.45, Math.PI - 0.45), mat('glass'));
      f.object(glass, [0, y + R * 0.8, 0]);
      f.add(sphere(R * 0.7, 10, 4), 'grassBright', [0, y + 0.02, 0], [0, 0, 0], [1, 0.12, 1]);
      f.add(new THREE.ConeGeometry(0.04, 0.12, 5), 'leaves', [0.06, y + 0.07, 0.02]);
      f.add(box(0.05, 0.06, 0.05, 0), 'stoneLight', [-0.07, y + 0.04, -0.03], [0, 0.5, 0.2]);
      const fish = [];
      for (let i = 0; i < (opts.count ?? 2); i++) {
        const g = new THREE.Group();
        g.add(M(new THREE.SphereGeometry(0.03, 10, 8), 'orange', [0, 0, 0], null, [0.7, 0.8, 1.3]));
        g.add(M(new THREE.ConeGeometry(0.025, 0.04, 6), 'orange', [0, 0, -0.045], [-Math.PI / 2, 0, 0], [1, 1, 0.3]));
        g.add(M(new THREE.SphereGeometry(0.006, 6, 4), 'black', [0.015, 0.008, 0.025]));
        g.add(M(new THREE.SphereGeometry(0.006, 6, 4), 'black', [-0.015, 0.008, 0.025]));
        compactGroup(g); f.object(g); fish.push({ g, ph: i * 2.6, r: 0.09 + i * 0.03 });
      }
      const c = f.point(0, y + R * 0.75, 0);
      let feed = 0;
      kit.onUpdate((dt, t) => {
        feed = Math.max(0, feed - dt);
        for (const fi of fish) {
          const a = t * (0.8 + feed) + fi.ph;
          fi.g.position.set(c.x + Math.cos(a) * fi.r, c.y + Math.sin(t * 1.3 + fi.ph) * 0.03 + (feed > 0 ? 0.06 : 0), c.z + Math.sin(a) * fi.r);
          fi.g.rotation.y = -a + Math.PI;
        }
      });
      const quips = opts.quips ?? ['Die Goldfische schnappen nach den Krümeln und blubbern »Danke!« (glaubst du zumindest).', 'Blubb. Blubb blubb. (Übersetzung: »Noch mehr, bitte.«)', 'Einer der Fische macht einen Salto. Angeber.'];
      let qi = 0;
      f.hitbox([0, y + R, 0], [0.5, 0.5, 0.5], { label: opts.name ?? 'Goldfischglas', verb: 'Füttern', range: 3, onInteract: () => { feed = 3; kit.services.audio.play('bubble'); kit.services.ui.toast(quips[qi++ % quips.length]); } });
    },
  }),

  // Leuchtende Kristalle (sanft, nicht blendend)
  defineProp({
    name: 'crystalCluster',
    create(f, opts, kit) {
      const r = makeRng(seedOf(kit, opts, 'crystal'));
      const color = opts.color ?? '#b89aff', s = opts.scale ?? 1;
      const m = crystalMat(color);
      f.add(sphere(0.18 * s, 7, 5), 'stoneDark', [0, 0.02, 0], [0, 0, 0], [1.3, 0.4, 1]);
      for (let i = 0; i < (opts.count ?? 6); i++) {
        const a = r.range(0, Math.PI * 2), d = i ? r.range(0.03, 0.14) * s : 0, h = (i ? r.range(0.14, 0.3) : 0.42) * s;
        f.add(new THREE.ConeGeometry(0.045 * s, h, 6), m, [Math.cos(a) * d, h / 2 + 0.02, Math.sin(a) * d], [Math.sin(a) * d * 3, 0, -Math.cos(a) * d * 3]);
      }
      f.glow([0, 0.25 * s, 0], { color, size: 0.9 * s, opacity: 0.35 });
    },
  }),

  // Papiersterne an Fäden von der Decke (area [w, d], top = Deckenhöhe)
  defineProp({
    name: 'paperStars',
    create(f, opts, kit) {
      const r = makeRng(seedOf(kit, opts, 'stars'));
      const [w, d] = opts.area ?? [4, 4], top = opts.top ?? 4;
      const shape = new THREE.Shape();
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? 0.045 : 0.11; const p = [Math.cos(a) * rr, Math.sin(a) * rr]; if (i) shape.lineTo(...p); else shape.moveTo(...p); }
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false });
      geo.translate(0, 0, -0.01);
      for (let i = 0, tries = 0; i < (opts.count ?? 8) && tries < 200; i++, tries++) {
        const x = r.range(-w / 2, w / 2), z = r.range(-d / 2, d / 2);
        if (opts.avoid && Math.abs(x) < opts.avoid && Math.abs(z) < opts.avoid) { i--; continue; }
        const drop = r.range(0.5, opts.maxDrop ?? 1.6), s = r.range(0.8, 1.4);
        f.add(cyl(0.004, 0.004, drop, 3), 'cream', [x, top - drop / 2, z]);
        f.add(geo, r.pick(opts.colors ?? ['pastelLemon', 'gold', 'pastelPink', 'pastelSky']), [x, top - drop - 0.1 * s, z], [0, r.range(0, Math.PI), 0], s);
      }
    },
  }),

  // Kissenberg zum Hineinplumpsen
  defineProp({
    name: 'cushionPile',
    create(f, opts, kit) {
      const r = makeRng(seedOf(kit, opts, 'cushions'));
      const n = opts.count ?? 5;
      let y = 0;
      for (let i = 0; i < n; i++) {
        const big = i < 2, w = big ? 0.75 : 0.5, h = big ? 0.2 : 0.16;
        const x = big ? (i ? 0.25 : -0.25) : r.range(-0.2, 0.2), z = big ? r.range(-0.1, 0.1) : r.range(-0.2, 0.2);
        const yy = big ? h / 2 : y + h / 2;
        f.add(new THREE.SphereGeometry(0.5, 14, 8), r.pick(opts.colors ?? ['velvet', 'velvetBlue', 'velvetGreen', 'pastelPink', 'pastelLemon']), [x, yy, z], [0, r.range(0, 3), 0], [w, h, w * 0.9]);
        for (const [cx, cz] of [[-1, -1], [1, 1]]) f.add(sphere(0.025, 6, 4), 'gold', [x + cx * w * 0.42, yy, z + cz * w * 0.38]);
        y = Math.max(y, yy + h / 2 - 0.03);
      }
      f.collider(0, 0, 1.1, 0.8, { top: Math.min(0.45, y) });
    },
  }),

  // Schneekugel: schütteln!
  defineProp({
    name: 'snowGlobe',
    create(f, opts, kit) {
      const s = opts.scale ?? 1, R = 0.11 * s;
      f.add(cyl(0.1 * s, 0.12 * s, 0.07 * s, 14), 'woodDark', [0, 0.035 * s, 0]);
      f.add(torus(0.1 * s, 0.01 * s, 4, 16), 'gold', [0, 0.07 * s, 0], [Math.PI / 2, 0, 0]);
      const c = 0.07 * s + R * 0.9;
      f.add(box(0.06 * s, 0.05 * s, 0.05 * s, 0), opts.house ?? 'pastelPink', [0, 0.1 * s, 0]);
      f.add(new THREE.ConeGeometry(0.05 * s, 0.04 * s, 4), 'roof', [0, 0.145 * s, 0], [0, Math.PI / 4, 0]);
      f.add(new THREE.ConeGeometry(0.025 * s, 0.07 * s, 6), 'hedge', [0.06 * s, 0.11 * s, 0.02 * s]);
      f.add(sphere(R * 0.85, 10, 4), 'white', [0, 0.075 * s, 0], [0, 0, 0], [1, 0.12, 1]);
      const glass = new THREE.Mesh(new THREE.SphereGeometry(R, 18, 12), mat('glass'));
      f.object(glass, [0, c, 0]);
      const N = 40, pos = new Float32Array(N * 3), seeds = [];
      const r = makeRng(seedOf(kit, opts, 'globe'));
      for (let i = 0; i < N; i++) seeds.push([r.range(0, 6.28), r.range(0, R * 0.85), r.range(0, 1)]);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ffffff', size: 0.012 * s, sizeAttenuation: true }));
      pts.frustumCulled = false;
      f.object(pts, [0, c, 0]);
      let shake = 0;
      kit.onUpdate((dt, t) => {
        shake = Math.max(0, shake - dt * 0.25);
        for (let i = 0; i < N; i++) {
          const [a, rr, h] = seeds[i];
          const aa = a + t * shake * 3, yy = shake > 0 ? Math.sin(t * 2 + h * 6) * R * 0.6 * shake : -R * 0.6;
          pos[i * 3] = Math.cos(aa) * rr * (shake > 0 ? 1 : 0.9); pos[i * 3 + 1] = Math.max(-R * 0.62, yy + (h - 0.5) * R * shake); pos[i * 3 + 2] = Math.sin(aa) * rr;
        }
        geo.attributes.position.needsUpdate = true;
      });
      f.hitbox([0, c, 0], [0.3 * s, 0.35 * s, 0.3 * s], {
        label: opts.name ?? 'Schneekugel', verb: 'Schütteln', range: 3,
        onInteract: () => { shake = 1; kit.services.audio.play('chime'); if (opts.quip) kit.services.ui.toast(opts.quip); },
      });
    },
  }),

  // Federkieldose mit Schriftrollen
  defineProp({
    name: 'quillJar',
    create(f, opts, kit) {
      f.add(cyl(0.05, 0.045, 0.12, 12), opts.jar ?? 'porcelainBlue', [0, 0.06, 0]);
      f.add(torus(0.05, 0.006, 4, 14), 'gold', [0, 0.115, 0], [Math.PI / 2, 0, 0]);
      for (const [rx, rz, c] of [[0.2, 0.1, 'white'], [-0.15, 0.25, 'pastelPink'], [0.05, -0.2, 'pastelSky']]) {
        f.add(cyl(0.003, 0.003, 0.28, 4), 'cream', [Math.sin(rz) * 0.1, 0.2, Math.sin(rx) * 0.1], [rx, 0, rz]);
        f.add(new THREE.SphereGeometry(0.03, 8, 6), c, [Math.sin(rz) * 0.22, 0.31, Math.sin(rx) * 0.22], [rx, 0, rz], [0.35, 1.6, 0.08]);
      }
      if (opts.scrolls !== false) for (const [x, z, a] of [[0.14, 0.02, 0.3], [0.12, -0.08, -0.4]]) {
        f.add(cyl(0.022, 0.022, 0.2, 10), 'paper', [x, 0.022, z], [Math.PI / 2, a, 0]);
        f.add(torus(0.023, 0.004, 4, 10), 'velvet', [x, 0.022, z], [0, a, 0]);
      }
    },
  }),

  // Kleines Wandbrett mit Krimskrams (Wandprop, Brett auf Höhe y)
  defineProp({
    name: 'wallShelfSmall',
    create(f, opts, kit) {
      const W = opts.width ?? 1, y = opts.y ?? 1.6;
      const r = makeRng(seedOf(kit, opts, 'wallshelf'));
      f.add(box(W, 0.04, 0.22, 0), opts.wood ?? 'woodLight', [0, y, 0.11]);
      for (const s of [-1, 1]) f.add(box(0.03, 0.14, 0.16, 0), opts.wood ?? 'woodLight', [s * (W / 2 - 0.1), y - 0.08, 0.08]);
      let x = -W / 2 + 0.06;
      while (x < W / 2 - 0.1) {
        const kind = r.pick(['jar', 'jar', 'books', 'plant', 'ball', 'books']);
        if (kind === 'jar') {
          const h = r.range(0.08, 0.16); f.add(cyl(0.035, 0.035, h, 10), 'glass', [x + 0.04, y + 0.02 + h / 2, 0.11]);
          f.add(cyl(0.03, 0.03, h * 0.6, 10), r.pick(['potionPink', 'potionGreen', 'potionBlue', 'potionGold', 'candy']), [x + 0.04, y + 0.02 + h * 0.3, 0.11]);
          f.add(cyl(0.02, 0.02, 0.025, 8), 'woodDark', [x + 0.04, y + 0.03 + h, 0.11]); x += 0.1;
        } else if (kind === 'books') {
          const n = r.int(2, 4);
          for (let i = 0; i < n; i++) { const h = r.range(0.12, 0.18); f.add(box(0.035, h, 0.13, 0), r.pick(['velvet', 'velvetBlue', 'velvetGreen', 'woodRed', 'pastelLilac']), [x + 0.02 + i * 0.038, y + 0.02 + h / 2, 0.11], [0, 0, i === n - 1 ? -0.25 : 0]); }
          x += n * 0.04 + 0.06;
        } else if (kind === 'plant') {
          f.add(cyl(0.04, 0.03, 0.07, 10), 'terracotta', [x + 0.05, y + 0.055, 0.11]); f.add(sphere(0.06, 8, 6), 'leaves', [x + 0.05, y + 0.13, 0.11]); x += 0.12;
        } else {
          f.add(sphere(0.04, 10, 8), r.pick(PASTELS), [x + 0.04, y + 0.06, 0.11]); x += 0.1;
        }
      }
    },
  }),
];
