import * as THREE from 'three';
import { mulberry32 } from '../core/rng.js';

// Alle Texturen werden prozedural auf Canvas gemalt – keine externen Assets nötig.
export const FONT_TITLE = '"IM Fell English", Georgia, serif';
export const FONT_HAND = '"Caveat", "Segoe Print", cursive';
export const FONT_BODY = '"Crimson Pro", Georgia, serif';

let maxAniso = 4;
export function setMaxAnisotropy(n) { maxAniso = n; }

export function canvasTexture(w, h, draw, { repeat = true, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = maxAniso;
  return t;
}

function shade(hex, amt) {
  const c = new THREE.Color(hex);
  const hsl = {}; c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amt)));
  return `#${c.getHexString()}`;
}
export { shade };

function speckle(g, w, h, n, color, alpha, seed = 1, size = 1.5) {
  const r = mulberry32(seed);
  g.fillStyle = color;
  for (let i = 0; i < n; i++) {
    g.globalAlpha = alpha * r();
    g.fillRect(r() * w, r() * h, size * (0.5 + r()), size * (0.5 + r()));
  }
  g.globalAlpha = 1;
}

const cache = new Map();
function cached(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

export const tex = {
  wood: (base = '#6b4226') => cached(`wood${base}`, () => canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const r = mulberry32(7);
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = r() > 0.5 ? shade(base, -0.08) : shade(base, 0.05);
      g.globalAlpha = 0.25 + r() * 0.4;
      g.lineWidth = 0.5 + r() * 2;
      g.beginPath();
      const y = r() * h;
      g.moveTo(0, y);
      for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.03 + i) * 3 + (r() - 0.5) * 2);
      g.stroke();
    }
    g.globalAlpha = 1;
    speckle(g, w, h, 400, shade(base, -0.15), 0.3, 3);
  })),

  parquet: () => cached('parquet', () => canvasTexture(512, 512, (g, w, h) => {
    const r = mulberry32(11);
    const pw = 64, ph = 16;
    for (let y = 0; y < h; y += ph) {
      const off = (y / ph) % 2 ? pw / 2 : 0;
      for (let x = -pw; x < w + pw; x += pw) {
        const l = r() * 0.08 - 0.04;
        g.fillStyle = shade('#7a4b2a', l);
        g.fillRect(x + off, y, pw - 1, ph - 1);
        g.strokeStyle = shade('#7a4b2a', -0.1);
        g.globalAlpha = 0.3;
        for (let k = 0; k < 3; k++) {
          g.beginPath();
          const yy = y + 3 + r() * (ph - 6);
          g.moveTo(x + off, yy); g.lineTo(x + off + pw, yy + (r() - 0.5) * 2);
          g.stroke();
        }
        g.globalAlpha = 1;
      }
    }
    g.fillStyle = '#2a170c';
    for (let y = 0; y < h; y += ph) g.fillRect(0, y + ph - 1, w, 1);
  })),

  marble: () => cached('marble', () => canvasTexture(512, 512, (g, w, h) => {
    const s = w / 4;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      g.fillStyle = (i + j) % 2 ? '#2b2420' : '#d9cbb3';
      g.fillRect(i * s, j * s, s, s);
    }
    const r = mulberry32(5);
    g.globalAlpha = 0.18;
    for (let k = 0; k < 25; k++) {
      g.strokeStyle = r() > 0.5 ? '#ffffff' : '#7a6a5a';
      g.lineWidth = 0.5 + r() * 1.5;
      g.beginPath();
      let x = r() * w, y = r() * h;
      g.moveTo(x, y);
      for (let n = 0; n < 12; n++) { x += (r() - 0.4) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); }
      g.stroke();
    }
    g.globalAlpha = 0.5;
    g.strokeStyle = '#1a1410';
    for (let i = 0; i <= 4; i++) { g.strokeRect(i * s, 0, 0, h); g.strokeRect(0, i * s, w, 0); }
    g.globalAlpha = 1;
  })),

  wallpaper: (base = '#2f4a3a', motif = '#c9a85a') => cached(`wp${base}${motif}`, () => canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    // Streifen
    g.fillStyle = shade(base, -0.04);
    for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 12, h);
    // Damast-ähnliches Motiv
    g.strokeStyle = motif; g.fillStyle = motif;
    g.globalAlpha = 0.28;
    for (const [cx, cy] of [[64, 64], [192, 192], [192, 64], [64, 192]]) {
      const small = (cx + cy) % 256 !== 128;
      const sz = small ? 10 : 22;
      g.beginPath();
      g.moveTo(cx, cy - sz * 1.6);
      g.bezierCurveTo(cx + sz, cy - sz, cx + sz, cy + sz * 0.5, cx, cy + sz * 1.6);
      g.bezierCurveTo(cx - sz, cy + sz * 0.5, cx - sz, cy - sz, cx, cy - sz * 1.6);
      g.fill();
      g.beginPath(); g.arc(cx, cy, sz * 0.35, 0, Math.PI * 2); g.globalAlpha = 0.45; g.fill(); g.globalAlpha = 0.28;
    }
    g.globalAlpha = 1;
    speckle(g, w, h, 600, '#000', 0.12, 9);
  })),

  paneling: () => cached('paneling', () => canvasTexture(256, 256, (g, w, h) => {
    g.drawImage(tex.wood('#4a2c18').image, 0, 0);
    g.strokeStyle = '#2a170c'; g.lineWidth = 6;
    g.strokeRect(20, 20, w - 40, h - 40);
    g.strokeStyle = '#7a5030'; g.lineWidth = 2;
    g.strokeRect(26, 26, w - 52, h - 52);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, w, 6); g.fillRect(0, 0, 6, h);
  })),

  carpet: (base = '#6b1f24', border = '#c9a85a') => cached(`carpet${base}`, () => canvasTexture(256, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.strokeStyle = border; g.lineWidth = 8; g.strokeRect(12, 12, w - 24, h - 24);
    g.lineWidth = 2; g.strokeRect(28, 28, w - 56, h - 56);
    g.fillStyle = shade(base, 0.08);
    for (let y = 60; y < h - 40; y += 64) {
      g.save(); g.translate(w / 2, y); g.rotate(Math.PI / 4);
      g.fillRect(-18, -18, 36, 36);
      g.restore();
    }
    g.fillStyle = border; g.globalAlpha = 0.6;
    for (let y = 60; y < h - 40; y += 64) { g.beginPath(); g.arc(w / 2, y, 6, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    speckle(g, w, h, 3000, '#000', 0.15, 4, 1);
  }, { repeat: false })),

  stone: (base = '#6d655c') => cached(`stone${base}`, () => canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = shade(base, -0.15); g.fillRect(0, 0, w, h);
    const r = mulberry32(21);
    const bh = 32;
    for (let y = 0; y < h; y += bh) {
      const off = (y / bh) % 2 ? 32 : 0;
      for (let x = -64; x < w; x += 64) {
        g.fillStyle = shade(base, (r() - 0.5) * 0.1);
        g.fillRect(x + off + 2, y + 2, 60, bh - 4);
      }
    }
    speckle(g, w, h, 1500, '#000', 0.2, 22);
    speckle(g, w, h, 600, '#fff', 0.08, 23);
  })),

  plaster: () => cached('plaster', () => canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#c9b89a'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 2500, '#6a5a40', 0.12, 31, 2);
    g.strokeStyle = 'rgba(80,60,30,0.35)'; g.lineWidth = 5;
    g.strokeRect(0, 0, w, h);
    g.lineWidth = 2; g.strokeRect(14, 14, w - 28, h - 28);
  })),

  roof: () => cached('roof', () => canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#3b2a26'; g.fillRect(0, 0, w, h);
    const r = mulberry32(41);
    for (let y = 0; y < h; y += 20) for (let x = (y / 20) % 2 ? -16 : 0; x < w; x += 32) {
      g.fillStyle = shade('#5a3a30', (r() - 0.5) * 0.1);
      g.beginPath(); g.ellipse(x + 16, y + 14, 15, 12, 0, 0, Math.PI); g.fill();
    }
  })),

  grass: () => cached('grass', () => canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#1f3a1e'; g.fillRect(0, 0, w, h);
    const r = mulberry32(51);
    for (let i = 0; i < 3500; i++) {
      g.strokeStyle = shade('#2f5a2a', (r() - 0.5) * 0.2);
      g.globalAlpha = 0.6;
      const x = r() * w, y = r() * h;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 4); g.stroke();
    }
    g.globalAlpha = 1;
  })),

  leaves: (base = '#24452a') => cached(`leaves${base}`, () => canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = shade(base, -0.08); g.fillRect(0, 0, w, h);
    const r = mulberry32(61);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = shade(base, (r() - 0.4) * 0.18);
      g.beginPath();
      g.ellipse(r() * w, r() * h, 3 + r() * 5, 2 + r() * 2, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  })),

  bark: () => cached('bark', () => canvasTexture(128, 256, (g, w, h) => {
    g.fillStyle = '#3a2a1e'; g.fillRect(0, 0, w, h);
    const r = mulberry32(71);
    for (let i = 0; i < 60; i++) {
      g.strokeStyle = r() > 0.5 ? '#251a12' : '#4d3a2a';
      g.lineWidth = 1 + r() * 3;
      const x = r() * w;
      g.beginPath(); g.moveTo(x, 0);
      for (let y = 0; y < h; y += 20) g.lineTo(x + (r() - 0.5) * 6, y);
      g.stroke();
    }
  })),

  paper: () => cached('paper', () => canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#efe2c4'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 1200, '#8a6a3a', 0.12, 81, 2);
    const grd = g.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.75);
    grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(120,80,30,0.35)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  })),

  cork: () => cached('cork', () => canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#a77a4a'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 4000, '#5a3a1a', 0.5, 91, 2);
    speckle(g, w, h, 2000, '#d9aa70', 0.4, 92, 2);
  })),

  pages: () => cached('pages', () => canvasTexture(64, 64, (g, w, h) => {
    g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,90,50,0.35)';
    for (let y = 0; y < h; y += 2) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  })),

  // Weißer Buchrücken mit Goldbändern – wird per Instanzfarbe eingefärbt.
  fillerSpine: () => cached('fillerSpine', () => canvasTexture(64, 256, (g, w, h) => {
    g.fillStyle = '#d8d0c4'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 300, '#000', 0.25, 101, 2);
    g.fillStyle = '#f2d27a';
    for (const y of [18, 26, h - 30, h - 22]) g.fillRect(0, y, w, 3);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(w * 0.25, h * 0.35, w * 0.5, h * 0.3);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);
  }, { repeat: false })),

  glow: () => cached('glow', () => canvasTexture(128, 128, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.2, 'rgba(255,255,255,0.6)');
    grd.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }, { repeat: false })),

  // Weicher, rechteckiger Schatten (Alpha in Grün) für Kontaktschatten unter Möbeln.
  softShadow: () => cached('softShadow', () => canvasTexture(64, 64, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = Math.max(0, Math.abs(x + 0.5 - w / 2) / (w / 2) - 0.45) / 0.55;
      const dy = Math.max(0, Math.abs(y + 0.5 - h / 2) / (h / 2) - 0.45) / 0.55;
      const d = Math.min(1, Math.hypot(dx, dy));
      const a = Math.round(255 * (1 - d) ** 2);
      const i = (y * w + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = a; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, { repeat: false, srgb: false })),

  // Verlauf (oben dunkel → unten frei) für Umgebungsverdeckung an Wandfuß und Decke.
  aoEdge: () => cached('aoEdge', () => canvasTexture(4, 64, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      const t = y / (h - 1);
      const a = Math.round(255 * (1 - t) ** 2.2);
      for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = a; img.data[i + 3] = 255; }
    }
    g.putImageData(img, 0, 0);
  }, { repeat: false, srgb: false })),

  // Sternenhimmel für Kuppeln/Decken
  starfield: () => cached('starfield', () => canvasTexture(512, 512, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#141a4a'); grd.addColorStop(0.5, '#2a1a5a'); grd.addColorStop(1, '#10284a');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    const r = mulberry32(99);
    for (let i = 0; i < 40; i++) {
      g.globalAlpha = 0.08; g.fillStyle = r() > 0.5 ? '#ff9ad8' : '#7ad8ff';
      g.beginPath(); g.arc(r() * w, r() * h, 20 + r() * 60, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    for (let i = 0; i < 500; i++) {
      const s = r() < 0.92 ? 0.6 + r() : 1.6 + r() * 1.5;
      g.fillStyle = ['#ffffff', '#fff2c0', '#c8e4ff', '#ffd0f0'][Math.floor(r() * 4)];
      g.beginPath(); g.arc(r() * w, r() * h, s, 0, 7); g.fill();
    }
    g.strokeStyle = 'rgba(255,230,160,0.5)'; g.lineWidth = 1;
    for (let k = 0; k < 6; k++) {
      g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y);
      for (let j = 0; j < 4; j++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; g.lineTo(x, y); g.fillStyle = '#fff6c8'; g.fillRect(x - 1.5, y - 1.5, 3, 3); }
      g.stroke();
    }
  })),

  water: () => cached('water', () => canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#1b3d55'; g.fillRect(0, 0, w, h);
    const r = mulberry32(111);
    g.strokeStyle = 'rgba(180,220,255,0.35)';
    for (let i = 0; i < 40; i++) {
      g.lineWidth = 1 + r() * 2;
      g.beginPath();
      g.arc(r() * w, r() * h, 10 + r() * 30, r() * 3, r() * 3 + 1.2);
      g.stroke();
    }
  })),
};

/** Buchwand: viele Buchrücken auf einer Textur (für hohe/ferne Regalreihen). */
export function bookwallTexture(variant = 0) {
  return cached(`bookwall${variant}`, () => canvasTexture(512, 128, (g, w, h) => {
    const r = mulberry32(1000 + variant * 17);
    g.fillStyle = '#140b06'; g.fillRect(0, 0, w, h);
    const cols = ['#6b1f24', '#7a2e3a', '#2b4a35', '#1f3a5a', '#4a2a5a', '#6a4a20', '#3a2a1a', '#5a3a1a', '#20343a', '#7a5a2a', '#401818', '#2a2a4a', '#4a5a2a', '#8a3a20'];
    let x = 0;
    while (x < w) {
      const bw = 6 + r() * 14;
      if (r() < 0.04) { x += 6 + r() * 14; continue; }
      const bh = h * (0.62 + r() * 0.36);
      const c = cols[Math.floor(r() * cols.length)];
      g.fillStyle = c; g.fillRect(x, h - bh, bw - 1, bh);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, h - bh, 1.5, bh); g.fillRect(x + bw - 2.5, h - bh, 1.5, bh);
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x + bw * 0.3, h - bh, 1.5, bh);
      if (r() < 0.6) { g.fillStyle = '#e0bc68'; g.fillRect(x + 1, h - bh + 6, bw - 3, 1.5); g.fillRect(x + 1, h - 10, bw - 3, 1.5); }
      if (r() < 0.3) { g.fillStyle = 'rgba(240,210,140,0.5)'; g.fillRect(x + bw / 2 - 1, h - bh * 0.7, 2, bh * 0.35); }
      x += bw;
    }
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, 'rgba(0,0,0,0.55)'); grd.addColorStop(0.35, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }));
}

/** Buchrücken mit Titel (vertikal). */
export function spineTexture({ title, color, gold = true, year }) {
  return canvasTexture(96, 512, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 500, '#000', 0.25, title.length, 2);
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, 'rgba(0,0,0,0.45)'); grd.addColorStop(0.3, 'rgba(255,255,255,0.08)');
    grd.addColorStop(0.7, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    const ink = gold ? '#f0cf74' : '#efe4cf';
    g.fillStyle = ink;
    for (const y of [24, 34, h - 40, h - 30]) g.fillRect(6, y, w - 12, 3);
    g.save();
    g.translate(w / 2, h / 2);
    g.rotate(-Math.PI / 2);
    let size = 44;
    g.font = `${size}px ${FONT_TITLE}`;
    while (g.measureText(title).width > h - 120 && size > 18) { size -= 2; g.font = `${size}px ${FONT_TITLE}`; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 3;
    g.fillText(title, 0, 2);
    g.restore();
    if (year) {
      g.font = `20px ${FONT_TITLE}`; g.textAlign = 'center';
      g.fillText(String(year), w / 2, h - 56);
    }
  }, { repeat: false });
}

/** Buchdeckel (Vorderseite). */
export function coverTexture({ title, color, gold = true, subtitle = '' }) {
  return canvasTexture(320, 448, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 1500, '#000', 0.2, title.length + 3, 2);
    const ink = gold ? '#f0cf74' : '#efe4cf';
    g.strokeStyle = ink; g.lineWidth = 4; g.strokeRect(18, 18, w - 36, h - 36);
    g.lineWidth = 1.5; g.strokeRect(28, 28, w - 56, h - 56);
    // Ecken-Ornamente
    g.fillStyle = ink;
    for (const [x, y] of [[28, 28], [w - 28, 28], [28, h - 28], [w - 28, h - 28]]) {
      g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill();
    }
    g.font = `40px ${FONT_TITLE}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const words = title.split(' ');
    const lines = [];
    let line = '';
    for (const wd of words) {
      const test = line ? `${line} ${wd}` : wd;
      if (g.measureText(test).width > w - 80 && line) { lines.push(line); line = wd; } else line = test;
    }
    lines.push(line);
    const y0 = h * 0.38 - (lines.length - 1) * 22;
    g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 4;
    lines.forEach((l, i) => g.fillText(l, w / 2, y0 + i * 46));
    g.shadowBlur = 0;
    // Stern-Emblem
    g.save(); g.translate(w / 2, h * 0.68);
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 10 : 26;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath(); g.fill(); g.restore();
    if (subtitle) {
      g.font = `italic 20px ${FONT_TITLE}`;
      g.fillText(subtitle, w / 2, h * 0.84);
    }
  }, { repeat: false });
}

/** Text auf Pergament/Schild. */
export function signTexture(text, { w = 512, h = 128, bg = '#2a1a10', ink = '#f0cf74', font = FONT_TITLE, size = 54, border = true } = {}) {
  return canvasTexture(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (bg !== 'transparent') speckle(g, w, h, 600, '#000', 0.3, text.length, 2);
    if (border) { g.strokeStyle = ink; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16); }
    g.fillStyle = ink;
    let s = size;
    g.font = `${s}px ${font}`;
    while (g.measureText(text).width > w - 40 && s > 12) { s -= 2; g.font = `${s}px ${font}`; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 2);
  }, { repeat: false });
}

/** Handgeschriebene Notiz. */
export function noteTexture(title, text, { color = '#f3e6c4' } = {}) {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 500, '#8a6a3a', 0.15, title.length, 2);
    g.fillStyle = '#2b2a55';
    g.font = `700 34px ${FONT_HAND}`;
    g.textAlign = 'left'; g.textBaseline = 'top';
    wrap(g, title, 16, 14, w - 32, 34, 3);
    g.font = `500 22px ${FONT_HAND}`;
    g.fillStyle = '#3b3a5a';
    wrap(g, text, 16, 100, w - 32, 24, 6);
  }, { repeat: false });
}

function wrap(g, text, x, y, maxW, lh, maxLines) {
  const words = String(text).split(/\s+/);
  let line = '', n = 0;
  for (const wd of words) {
    const test = line ? `${line} ${wd}` : wd;
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, y + n * lh); n++; line = wd;
      if (n >= maxLines) return;
    } else line = test;
  }
  if (line && n < maxLines) g.fillText(line, x, y + n * lh);
}
