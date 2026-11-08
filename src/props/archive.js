import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere, torus } from '../world/geo.js';
import { canvasTexture, signTexture, FONT_TITLE, FONT_HAND } from '../world/textures.js';
import { mat } from '../world/materials.js';
import { mulberry32 } from '../core/rng.js';

export default [
  // Zettelkatalog: das vollständige Register der Bibliothek
  defineProp({
    name: 'cardCatalog',
    create(f, opts, kit) {
      const W = 1.6, H = 1.3, D = 0.6;
      f.add(box(W, H, D, 1), 'woodRed', [0, H / 2 + 0.15, 0]);
      for (const [x, z] of [[-W / 2 + 0.08, -D / 2 + 0.08], [W / 2 - 0.08, -D / 2 + 0.08], [-W / 2 + 0.08, D / 2 - 0.08], [W / 2 - 0.08, D / 2 - 0.08]]) f.add(box(0.08, 0.15, 0.08, 0), 'woodDark', [x, 0.075, z]);
      f.add(box(W + 0.08, 0.05, D + 0.08, 1), 'woodDark', [0, H + 0.175, 0]);
      const cols = 6, rows = 7;
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
        const x = -W / 2 + (c + 0.5) * (W / cols), y = 0.15 + (r + 0.5) * (H / rows);
        f.add(box(W / cols - 0.03, H / rows - 0.03, 0.02, 0), 'wood', [x, y, D / 2 + 0.01]);
        f.add(box(0.06, 0.02, 0.02, 0), 'brass', [x, y - 0.04, D / 2 + 0.03]);
        f.add(box(0.1, 0.04, 0.005, 0), 'paper', [x, y + 0.03, D / 2 + 0.023]);
      }
      // Eine Schublade steht offen
      f.add(box(W / cols - 0.04, H / rows - 0.04, 0.4, 0), 'wood', [-W / 2 + 2.5 * (W / cols), 0.15 + 4.5 * (H / rows), D / 2 + 0.2]);
      for (let k = 0; k < 8; k++) f.add(box(W / cols - 0.08, 0.12, 0.004, 0), 'paper', [-W / 2 + 2.5 * (W / cols), 0.15 + 4.5 * (H / rows) + 0.06, D / 2 + 0.05 + k * 0.04]);
      f.collider(0, 0, W, D + 0.4);
      f.hitbox([0, 0.85, 0.1], [W, H, D + 0.3], {
        label: 'Zettelkatalog (Register aller Werke)', verb: 'Durchstöbern',
        onInteract: () => kit.services.events.emit('openCatalog'),
      });
    },
  }),

  // Zeitungsständer: zeigt die neuesten Blog-Einträge
  defineProp({
    name: 'newspaperRack',
    create(f, opts, kit) {
      f.add(box(0.05, 1.5, 0.05, 0), 'brass', [-0.5, 0.75, 0]);
      f.add(box(0.05, 1.5, 0.05, 0), 'brass', [0.5, 0.75, 0]);
      f.add(box(1.05, 0.05, 0.4, 0), 'brass', [0, 0.05, 0]);
      const posts = kit.services.content.projects.filter((p) => p.kind === 'blog').slice(-4).reverse();
      const n = Math.max(posts.length, 3);
      for (let i = 0; i < n; i++) {
        const p = posts[i];
        const y = 1.35 - i * 0.32;
        f.add(cyl(0.012, 0.012, 1.0, 6), 'woodDark', [0, y, 0.02], [0, 0, Math.PI / 2]);
        const t = canvasTexture(256, 160, (g, w, h) => {
          g.fillStyle = '#e8e0cc'; g.fillRect(0, 0, w, h);
          g.fillStyle = '#1a1a1a'; g.font = `bold 22px ${FONT_TITLE}`; g.textAlign = 'center';
          g.fillText('Der Bibliotheksbote', w / 2, 24);
          g.fillRect(10, 32, w - 20, 2);
          g.font = `18px ${FONT_TITLE}`;
          g.fillText(p ? p.title.slice(0, 26) : 'Sonderausgabe: Nichts passiert', w / 2, 58);
          g.fillStyle = '#555';
          for (let l = 0; l < 7; l++) { g.fillRect(14, 74 + l * 11, 110, 4); g.fillRect(132, 74 + l * 11, 110, 4); }
        }, { repeat: false });
        const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.4), new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide }));
        f.object(paper, [0, y - 0.2, 0.03], [0, 0, 0]);
        if (p) {
          f.interactable(paper, { label: `Zeitung: «${p.title}»`, verb: 'Lesen', onInteract: () => kit.services.events.emit('openProject', { project: p }) });
        } else {
          f.interactable(paper, { label: 'Zeitung', verb: 'Lesen', onInteract: () => kit.services.ui.note('Der Bibliotheksbote', 'Schlagzeile: »Bibliothek wächst um weitere Regalmeter – Bibliothekar verlangt mehr Tee.«') });
        }
      }
      f.collider(0, 0, 1.1, 0.4);
    },
  }),

  defineProp({
    name: 'filingBoxes',
    create(f, opts, kit) {
      const r = kit.services.rng(`files${f.point(0, 0, 0).x.toFixed(1)}`);
      const n = opts.count ?? 6;
      let y = 0;
      for (let i = 0; i < n; i++) {
        const w = r.range(0.38, 0.45);
        f.add(box(w, 0.28, 0.32, 0), r.pick(['cream', 'paper', 'woodLight']), [r.range(-0.03, 0.03), y + 0.14, 0], [0, r.range(-0.15, 0.15), 0]);
        f.add(box(0.12, 0.06, 0.005, 0), 'white', [0, y + 0.16, 0.162]);
        y += 0.28;
      }
      f.collider(0, 0, 0.5, 0.4);
    },
  }),

  defineProp({
    name: 'safe',
    create(f, opts, kit) {
      f.add(box(0.7, 0.8, 0.6, 0), 'iron', [0, 0.4, 0]);
      f.add(cyl(0.09, 0.09, 0.04, 16), 'brass', [0, 0.45, 0.32], [Math.PI / 2, 0, 0]);
      f.add(box(0.06, 0.18, 0.04, 0), 'brass', [0.22, 0.45, 0.32]);
      f.collider(0, 0, 0.7, 0.6);
      let tries = 0;
      f.hitbox([0, 0.4, 0.1], [0.75, 0.85, 0.7], {
        label: 'Alter Tresor', verb: 'Am Rad drehen', secret: opts.secret, secretName: 'Der Tresor, der Geduld belohnt',
        onInteract: () => {
          tries++;
          kit.services.audio?.play('tick');
          if (tries < 3) kit.services.ui.toast(`Klick… klick… (${tries}/3) Nichts passiert.`);
          else kit.services.ui.note('Im Tresor liegt ein Zettel', '»Das wertvollste in dieser Bibliothek sind die Ideen, die du noch nicht hattest.« – Darunter, kleiner: »Und Kekse. Die Kekse sind hinten links.«');
        },
      });
    },
  }),

  // Gemälde mit prozeduralen Motiven & Bildunterschrift
  defineProp({
    name: 'painting',
    create(f, opts, kit) {
      const W = opts.width ?? 1.2, H = opts.height ?? 1.5;
      const motif = opts.motif ?? 'moon';
      const t = canvasTexture(256, 320, (g, w, h) => paint(g, w, h, motif), { repeat: false });
      f.add(box(W + 0.16, H + 0.16, 0.06, 0), 'gold', [0, 0, 0.03]);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshLambertMaterial({ map: t }));
      f.object(m, [0, 0, 0.065]);
      f.interactable(m, {
        label: opts.title ?? 'Gemälde', verb: 'Betrachten', range: 5, secret: opts.secret, secretName: opts.secretName,
        onInteract: () => kit.services.ui.note(opts.title ?? 'Gemälde', opts.caption ?? 'Öl auf Leinwand. Der Künstler war nach eigener Aussage »ziemlich müde«.'),
      });
    },
  }),

  // Wegweiser mit Pfeilen
  defineProp({
    name: 'signpost',
    create(f, opts) {
      f.add(cyl(0.05, 0.06, 2.4, 6), 'woodDark', [0, 1.2, 0]);
      (opts.signs ?? [['Foyer', 0]]).forEach(([label, rot], i) => {
        const t = signTexture(label, { w: 384, h: 96, bg: '#5a3a1e', ink: '#f2e2c0', size: 50, border: false });
        const g = f.frame([0, 2.1 - i * 0.32, 0], rot);
        const s = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.22), new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide }));
        g.object(s, [0.5, 0, 0.04]);
        g.add(box(1.0, 0.24, 0.05, 0), 'woodDark', [0.48, 0, 0]);
      });
      f.collider(0, 0, 0.2, 0.2);
    },
  }),
];

function paint(g, w, h, motif) {
  const r = mulberry32(motif.length * 77);
  const sky = g.createLinearGradient(0, 0, 0, h);
  if (motif === 'moon' || motif === 'library') {
    sky.addColorStop(0, '#0d1838'); sky.addColorStop(1, '#3a2a5a');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,230,${r()})`; g.fillRect(r() * w, r() * h * 0.6, 1.5, 1.5); }
    g.fillStyle = '#f2e8c0'; g.beginPath(); g.arc(w * 0.7, h * 0.25, 30, 0, 7); g.fill();
    g.fillStyle = '#0d1838'; g.beginPath(); g.arc(w * 0.7 + 12, h * 0.25 - 6, 26, 0, 7); g.fill();
    g.fillStyle = '#1a1424';
    if (motif === 'library') {
      g.fillRect(w * 0.2, h * 0.45, w * 0.6, h * 0.55);
      g.beginPath(); g.moveTo(w * 0.15, h * 0.46); g.lineTo(w * 0.5, h * 0.3); g.lineTo(w * 0.85, h * 0.46); g.fill();
      g.fillStyle = '#ffb050';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) g.fillRect(w * 0.27 + i * w * 0.13, h * 0.52 + j * h * 0.13, 12, 20);
    } else {
      g.beginPath(); g.moveTo(0, h); g.quadraticCurveTo(w * 0.3, h * 0.6, w * 0.6, h * 0.8); g.quadraticCurveTo(w * 0.8, h * 0.7, w, h * 0.75); g.lineTo(w, h); g.fill();
    }
  } else if (motif === 'cat') {
    sky.addColorStop(0, '#5a3a1e'); sky.addColorStop(1, '#2a1a0e');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d0884a';
    g.beginPath(); g.ellipse(w / 2, h * 0.65, 70, 80, 0, 0, 7); g.fill();
    g.beginPath(); g.arc(w / 2, h * 0.38, 52, 0, 7); g.fill();
    g.beginPath(); g.moveTo(w / 2 - 48, h * 0.3); g.lineTo(w / 2 - 30, h * 0.18); g.lineTo(w / 2 - 12, h * 0.3); g.fill();
    g.beginPath(); g.moveTo(w / 2 + 48, h * 0.3); g.lineTo(w / 2 + 30, h * 0.18); g.lineTo(w / 2 + 12, h * 0.3); g.fill();
    g.fillStyle = '#1a1a1a'; g.fillRect(w / 2 - 25, h * 0.37, 12, 4); g.fillRect(w / 2 + 13, h * 0.37, 12, 4);
    g.fillStyle = '#2a1a4a'; g.beginPath(); g.moveTo(w / 2 - 30, h * 0.22); g.lineTo(w / 2, h * 0.02); g.lineTo(w / 2 + 30, h * 0.22); g.fill();
    g.fillStyle = '#f0d050'; g.fillRect(w / 2 - 3, h * 0.08, 6, 6);
  } else if (motif === 'wizard') {
    sky.addColorStop(0, '#2a1a4a'); sky.addColorStop(1, '#120a20');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a2a6a'; g.beginPath(); g.moveTo(w * 0.2, h); g.lineTo(w * 0.5, h * 0.35); g.lineTo(w * 0.8, h); g.fill();
    g.fillStyle = '#e0b090'; g.beginPath(); g.arc(w / 2, h * 0.35, 28, 0, 7); g.fill();
    g.fillStyle = '#eee'; g.beginPath(); g.moveTo(w / 2 - 26, h * 0.38); g.lineTo(w / 2, h * 0.65); g.lineTo(w / 2 + 26, h * 0.38); g.fill();
    g.fillStyle = '#2a2a6a'; g.beginPath(); g.moveTo(w / 2 - 40, h * 0.3); g.lineTo(w / 2 + 10, h * 0.02); g.lineTo(w / 2 + 40, h * 0.3); g.fill();
    g.fillStyle = '#f0d050'; for (let i = 0; i < 5; i++) g.fillRect(w / 2 - 20 + r() * 40, h * 0.1 + r() * h * 0.15, 4, 4);
  } else {
    // abstrakt
    g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { g.fillStyle = ['#7a2e3a', '#1f3a5a', '#f0c050', '#2b4a35'][i % 4]; g.globalAlpha = 0.8; g.fillRect(r() * w * 0.8, r() * h * 0.8, 20 + r() * 80, 20 + r() * 80); }
    g.globalAlpha = 1;
  }
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 6; g.strokeRect(0, 0, w, h);
}
