import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, cone, torus } from '../world/geo.js';
import { mat, hdr } from '../world/materials.js';
import { canvasTexture, FONT_TITLE, FONT_HAND } from '../world/textures.js';
import { roomBounds, CELL } from '../world/world.js';
import { compactGroup } from '../world/kit.js';

// Kartenraum: Die Karte zeichnet sich selbst aus dem Raster – neue Räume erscheinen automatisch darauf.
const PALETTE = ['#f4b8c8', '#b8e0f4', '#c8f0c0', '#f8e0a0', '#d8c8f4', '#f8c8a0', '#a8e8d8', '#f0c0e8'];

function mapBounds(occ) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const k of occ.keys()) {
    const [x, z] = k.split(',').map(Number);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  }
  return { minX, maxX, minZ: minZ - 1, maxZ }; // eine Reihe Platz für die Stapel
}

export default [
  defineProp({
    name: 'mapTable',
    create(f, opts, kit) {
      const { occ, byId } = opts.world;
      const W = opts.width ?? 3.6;
      const mb = mapBounds(occ);
      const cols = mb.maxX - mb.minX + 1, rows = mb.maxZ - mb.minZ + 1;
      const D = W * rows / cols;
      const px = 96;
      const tex = canvasTexture(cols * px, rows * px, (g, w, h) => {
        g.fillStyle = '#f4e6c4'; g.fillRect(0, 0, w, h);
        // Stapel-Reihe oben
        g.fillStyle = '#e0cca0';
        g.fillRect(0, 0, w, px);
        g.fillStyle = '#7a5a3a'; g.font = `italic 26px ${FONT_HAND}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('… hier beginnen die Endlosen Stapel …  ∞', w / 2, px / 2);
        const ids = [...new Set(occ.values())];
        const color = new Map(ids.map((id, i) => [id, PALETTE[i % PALETTE.length]]));
        for (const [k, id] of occ) {
          const [x, z] = k.split(',').map(Number);
          const cx = (x - mb.minX) * px, cz = (z - mb.minZ) * px;
          g.fillStyle = byId.get(id)?.endless ? '#d8c090' : color.get(id);
          g.fillRect(cx + 2, cz + 2, px - 4, px - 4);
          // Innenkanten zwischen Zellen desselben Raums schließen
          if (occ.get(`${x + 1},${z}`) === id) g.fillRect(cx + px - 4, cz + 2, 8, px - 4);
          if (occ.get(`${x},${z + 1}`) === id) g.fillRect(cx + 2, cz + px - 4, px - 4, 8);
        }
        g.strokeStyle = 'rgba(90,60,30,0.35)'; g.lineWidth = 1;
        for (let i = 0; i <= cols; i++) { g.beginPath(); g.moveTo(i * px, 0); g.lineTo(i * px, h); g.stroke(); }
        for (let i = 0; i <= rows; i++) { g.beginPath(); g.moveTo(0, i * px); g.lineTo(w, i * px); g.stroke(); }
        g.fillStyle = '#3a2410';
        for (const def of byId.values()) {
          if (def.hidden && !kit.services.progress.has('rooms', def.id)) { const [hx, hz] = def.cell; g.fillStyle = '#e8d8b0'; g.fillRect((hx - mb.minX) * px + 2, (hz - mb.minZ) * px + 2, px - 4, px - 4); g.fillStyle = '#3a2410'; g.font = `28px ${FONT_TITLE}`; g.fillText('???', (hx - mb.minX + 0.5) * px, (hz - mb.minZ + 0.5) * px); continue; }
          const [x, z] = def.cell, [sw, sd] = def.size ?? [1, 1];
          const cx = (x - mb.minX + sw / 2) * px, cz = (z - mb.minZ + sd / 2) * px;
          g.font = `${sw > 1 ? 22 : 16}px ${FONT_TITLE}`;
          const words = def.name.split(' ');
          const lines = []; let line = '';
          for (const wd of words) { if ((line + ' ' + wd).length > (sw > 1 ? 22 : 12) && line) { lines.push(line); line = wd; } else line = line ? `${line} ${wd}` : wd; }
          lines.push(line);
          lines.forEach((l, i) => g.fillText(l, cx, cz + (i - (lines.length - 1) / 2) * 18));
        }
        // Kompassrose in der Ecke
        g.save(); g.translate(w - 50, h - 50); g.strokeStyle = '#7a2e3a'; g.fillStyle = '#7a2e3a';
        for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, -38); g.lineTo(7, 0); g.lineTo(-7, 0); g.fill(); }
        g.font = `18px ${FONT_TITLE}`; g.fillText('N', 0, -46); g.restore();
      }, { repeat: false });
      // Tisch
      f.add(box(W + 0.3, 0.1, D + 0.3, 1), 'woodDark', [0, 0.92, 0]);
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) f.add(cyl(0.08, 0.06, 0.88, 8), 'woodDark', [x * W / 2, 0.44, z * D / 2]);
      f.add(box(W + 0.4, 0.04, D + 0.4, 1), 'brass', [0, 0.86, 0]);
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
      f.object(sheet, [0, 0.975, 0], [-Math.PI / 2, 0, 0]);
      f.collider(0, 0, W + 0.3, D + 0.3, { top: 0.98 });
      // »Du bist hier«-Marker
      const marker = new THREE.Group();
      const pin = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 8), new THREE.MeshBasicMaterial({ color: hdr('#ff5a8a', 1.3) }));
      pin.rotation.x = Math.PI; pin.position.y = 0.08; marker.add(pin);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: hdr('#ff8ab0', 1.3) })); head.position.y = 0.18; marker.add(head);
      f.object(marker);
      const halo = f.glow([0, 1.05, 0], { color: '#ff8ab0', size: 0.4, opacity: 0.5 });
      const o = kit.origin;
      kit.onUpdate((dt, t, ctx) => {
        // Weltposition → Kartenkoordinaten
        const u = ((ctx.player.x + CELL / 2) / CELL - mb.minX) / cols;
        const v = ((ctx.player.z + CELL / 2) / CELL - mb.minZ) / rows;
        const p = f.point((Math.min(1, Math.max(0, u)) - 0.5) * W, 0.98 + Math.abs(Math.sin(t * 3)) * 0.04, (Math.min(1, Math.max(0, v)) - 0.5) * D);
        marker.position.copy(p); halo.position.set(p.x, p.y + 0.18, p.z);
        void o;
      });
      f.hitbox([0, 1.0, 0], [W, 0.2, D], {
        label: 'Große Bibliothekskarte', verb: 'Studieren', secret: opts.secret, secretName: 'Die Karte, die sich selbst zeichnet',
        onInteract: () => kit.services.ui.toast(`Die Karte zeigt ${byId.size - 1} Räume – und zeichnet neue von selbst ein, sobald sie entstehen. Der rosa Punkt bist du.`),
      });
    },
  }),

  // Kompass, der immer zum nächsten unentdeckten Raum zeigt
  defineProp({
    name: 'wanderCompass',
    create(f, opts, kit) {
      const { byId } = opts.world;
      f.add(cyl(0.3, 0.34, 0.08, 24), 'brass', [0, 0.04, 0]);
      f.add(new THREE.CircleGeometry(0.28, 24), 'cream', [0, 0.085, 0], [-Math.PI / 2, 0, 0]);
      f.add(torus(0.3, 0.02, 6, 24), 'gold', [0, 0.09, 0], [Math.PI / 2, 0, 0]);
      const needle = new THREE.Group();
      const red = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.24, 4), mat('candy')); red.rotation.x = -Math.PI / 2; red.position.z = -0.12; needle.add(red);
      const blue = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 4), mat('porcelainBlue')); blue.rotation.x = Math.PI / 2; blue.position.z = 0.1; needle.add(blue);
      compactGroup(needle);
      f.object(needle, [0, 0.13, 0]);
      const glow = f.glow([0, 0.2, 0], { color: '#ffd86a', size: 0.7, opacity: 0.35 });
      const rooms = [...byId.values()].filter((d) => !d.endless && !d.hidden).map((d) => { const b = roomBounds(d); return { id: d.id, name: d.name, x: b.cx, z: b.cz }; });
      const wp = f.world(0, 0, 0);
      let target = null, acc = 1, ang = 0;
      const pick = (player) => {
        const prog = kit.services.progress;
        let best = null, bd = Infinity;
        for (const r of rooms) {
          if (prog.has('rooms', r.id)) continue;
          const d = Math.hypot(r.x - player.x, r.z - player.z);
          if (d < bd) { bd = d; best = r; }
        }
        return best;
      };
      kit.onUpdate((dt, t, ctx) => {
        acc += dt;
        if (acc > 1) { acc = 0; target = pick(ctx.player); }
        let want;
        if (target) want = Math.atan2(-(target.x - wp.x), -(target.z - wp.z)) - f.rotY + Math.sin(t * 2) * 0.05;
        else want = t * 1.5; // alles entdeckt: fröhliches Kreiseln
        ang += (want - ang) * Math.min(1, dt * 3);
        needle.rotation.y = ang + f.rotY;
        glow.material.opacity = 0.3 + Math.sin(t * 2) * 0.1;
      });
      f.hitbox([0, 0.12, 0], [0.7, 0.3, 0.7], {
        label: 'Fernweh-Kompass', verb: 'Befragen', secret: opts.secret, secretName: 'Der Kompass mit Fernweh', range: 3,
        onInteract: () => kit.services.ui.toast(target ? `Die Nadel zittert vor Neugier: Sie will zu »${target.name}«. Warst du da schon? Sie meint: nein.` : 'Die Nadel dreht sich vergnügt im Kreis. Du hast alle Räume entdeckt! (Bis morgen neue dazukommen.)'),
      });
    },
  }),

  // Heißluftballon-Modell, das unter der Decke schwebt
  defineProp({
    name: 'balloonModel',
    create(f, opts, kit) {
      const s = opts.scale ?? 1;
      const g = new THREE.Group();
      const cols = ['pastelPink', 'pastelLemon', 'pastelSky', 'pastelMint'];
      for (let i = 0; i < 8; i++) {
        const seg = new THREE.Mesh(new THREE.SphereGeometry(0.8 * s, 6, 14, (i / 8) * Math.PI * 2, Math.PI / 4), mat(cols[i % cols.length]));
        seg.scale.y = 1.2; g.add(seg);
      }
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * s, 0.18 * s, 0.25 * s, 10), mat('woodLight')); basket.position.y = -1.45 * s; g.add(basket);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.78;
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.6 * s, 3), mat('cream'));
        rope.position.set(Math.cos(a) * 0.2 * s, -1.1 * s, Math.sin(a) * 0.2 * s); g.add(rope);
      }
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.12 * s, 0.01), mat('candy')); flag.position.set(0.1 * s, 1.1 * s, 0); g.add(flag);
      compactGroup(g);
      f.object(g, [0, opts.y ?? 4.5, 0]);
      const y0 = g.position.y, x0 = g.position.x, z0 = g.position.z, R = opts.drift ?? 1.2;
      kit.onUpdate((dt, t) => {
        g.position.set(x0 + Math.sin(t * 0.13) * R, y0 + Math.sin(t * 0.7) * 0.15, z0 + Math.cos(t * 0.11) * R);
        g.rotation.y += dt * 0.1;
      });
    },
  }),

  // Kartenrollen im Schirmständer
  defineProp({
    name: 'mapRolls',
    create(f, opts, kit) {
      f.add(cyl(0.25, 0.22, 0.6, 14), 'copper', [0, 0.3, 0]);
      const r = kit.services.rng(`rolls${f.point(0, 0, 0).x.toFixed(1)}`);
      for (let i = 0; i < 7; i++) {
        const a = r.next() * 6.28, d = r.next() * 0.12, h = 0.7 + r.next() * 0.5;
        f.add(cyl(0.04, 0.04, h, 8), r.chance(0.5) ? 'paper' : 'cream', [Math.cos(a) * d, h / 2 + 0.05, Math.sin(a) * d], [r.range(-0.15, 0.15), 0, r.range(-0.15, 0.15)]);
      }
      f.collider(0, 0, 0.5, 0.5);
    },
  }),

  // Große Windrose auf dem Boden
  defineProp({
    name: 'compassRose',
    create(f, opts) {
      const R = opts.radius ?? 2.4;
      const t = canvasTexture(512, 512, (g, w, h) => {
        g.translate(w / 2, h / 2);
        g.fillStyle = 'rgba(240,226,190,0.95)'; g.beginPath(); g.arc(0, 0, 250, 0, 7); g.fill();
        g.strokeStyle = '#7a5a3a'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 236, 0, 7); g.stroke();
        for (let i = 0; i < 16; i++) {
          g.save(); g.rotate((i / 16) * Math.PI * 2);
          g.fillStyle = i % 4 === 0 ? '#c04060' : i % 2 ? '#d8b860' : '#3a6ac0';
          const L = i % 4 === 0 ? 220 : i % 2 ? 120 : 170;
          g.beginPath(); g.moveTo(0, -L); g.lineTo(i % 4 === 0 ? 26 : 14, 0); g.lineTo(i % 4 === 0 ? -26 : -14, 0); g.fill();
          g.restore();
        }
        g.fillStyle = '#3a2410'; g.font = `48px ${FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        [['N', 0, -195], ['O', 195, 0], ['S', 0, 195], ['W', -195, 0]].forEach(([l, x, y]) => g.fillText(l, x, y));
      }, { repeat: false });
      const m = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1 }));
      f.object(m, [0, 0.015, 0], [-Math.PI / 2, 0, 0]);
    },
  }),
];
