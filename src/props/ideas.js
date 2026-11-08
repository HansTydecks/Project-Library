import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { box, cyl, sphere } from '../world/geo.js';
import { noteTexture } from '../world/textures.js';

const NOTE_COLORS = ['#f3e6c4', '#f6efb0', '#f2d0c8', '#d8ecd0', '#d6e2f2'];

function ideaNote(kit, idea, i) {
  const t = noteTexture(idea.title, idea.text ?? '', { color: NOTE_COLORS[i % NOTE_COLORS.length] });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide, emissive: '#1a1408' }));
  m.userData.idea = idea;
  return m;
}

function interactIdea(f, kit, m, idea) {
  f.interactable(m, {
    label: `Notiz: «${idea.title}»`, verb: 'Lesen',
    onInteract: () => kit.services.events.emit('openIdea', { idea, mesh: m }),
    onHover: () => m.material.emissive.set('#4a3a18'),
    onHoverEnd: () => m.material.emissive.set('#1a1408'),
  });
  kit.services.index.set(`idea:${idea.id}`, { obj: m, room: kit.room?.id });
}

export default [
  // Korkbrett: lokal +z zeigt in den Raum. opts: { width, height, filter(idea) }
  defineProp({
    name: 'corkboard',
    create(f, opts, kit) {
      const W = opts.width ?? 3.2, H = opts.height ?? 1.8;
      f.add(box(W + 0.12, H + 0.12, 0.05, 1), 'woodDark', [0, 0, 0.025]);
      f.add(box(W, H, 0.03, 1), 'cork', [0, 0, 0.05]);
      const ideas = kit.services.content.ideas.filter(opts.filter ?? (() => true)).slice(0, opts.max ?? 18);
      const maxCols = Math.max(1, Math.floor(W / 0.5)), maxRows = Math.max(1, Math.floor(H / 0.5));
      const cols = Math.min(maxCols, Math.max(1, Math.ceil(Math.sqrt(ideas.length * W / H))));
      const rows = Math.min(maxRows, Math.max(1, Math.ceil(ideas.length / cols)));
      const r = kit.services.rng('cork');
      ideas.forEach((idea, i) => {
        if (i >= cols * rows) return;
        const c = i % cols, rr = Math.floor(i / cols);
        const x = -W / 2 + (c + 0.5) * (W / cols) + r.range(-0.05, 0.05);
        const y = H / 2 - (rr + 0.5) * (H / rows) + r.range(-0.04, 0.04);
        const m = ideaNote(kit, idea, i);
        f.object(m, [x, y, 0.075], [0, 0, r.range(-0.12, 0.12)]);
        f.add(sphere(0.018, 6, 4), r.pick(['flowerRed', 'flowerBlue', 'flowerYellow']), [x, y + 0.17, 0.09]);
        interactIdea(f, kit, m, idea);
      });
      // rote Fäden zwischen verwandten Ideen – Verschwörungsbrett-Charme
      for (let i = 1; i < Math.min(ideas.length, 7); i += 2) {
        const a = (i - 1) % cols, b = i % cols;
        const ya = H / 2 - (Math.floor((i - 1) / cols) + 0.5) * (H / rows) + 0.17;
        const yb = H / 2 - (Math.floor(i / cols) + 0.5) * (H / rows) + 0.17;
        const xa = -W / 2 + (a + 0.5) * (W / cols), xb = -W / 2 + (b + 0.5) * (W / cols);
        const len = Math.hypot(xb - xa, yb - ya);
        f.add(box(len, 0.006, 0.004, 0), 'flowerRed', [(xa + xb) / 2, (ya + yb) / 2, 0.095], [0, 0, Math.atan2(yb - ya, xb - xa)]);
      }
    },
  }),

  // Schwebende Notizzettel, die durch den Raum gleiten
  defineProp({
    name: 'floatingNotes',
    create(f, opts, kit) {
      const ideas = kit.services.content.ideas.filter(opts.filter ?? (() => true)).slice(opts.offset ?? 0, (opts.offset ?? 0) + (opts.count ?? 8));
      const R = opts.radius ?? 2.5, y = opts.y ?? 2.2;
      const c0 = f.point(0, y, 0);
      const notes = ideas.map((idea, i) => {
        const m = ideaNote(kit, idea, i + 3);
        m.scale.setScalar(0.8);
        f.object(m, [0, y, 0]);
        interactIdea(f, kit, m, idea);
        return { m, a: (i / ideas.length) * Math.PI * 2, ph: i * 1.7 };
      });
      kit.onUpdate((dt, t) => {
        for (const n of notes) {
          n.a += dt * 0.07;
          n.m.position.set(c0.x + Math.cos(n.a) * R, c0.y + Math.sin(t * 0.6 + n.ph) * 0.35, c0.z + Math.sin(n.a) * R);
          n.m.rotation.set(Math.sin(t * 0.8 + n.ph) * 0.2, -n.a + Math.PI / 2 + Math.PI, Math.sin(t * 0.5 + n.ph) * 0.15);
        }
      });
    },
  }),
];
