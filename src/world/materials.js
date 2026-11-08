import * as THREE from 'three';
import { tex, bookwallTexture } from './textures.js';

// Geteilte Materialien. Schlüssel → Material. Neue Materialien einfach unten ergänzen.
// Physikalisch basiert (MeshStandardMaterial): Rauheit + Relief (Bump aus der eigenen Textur),
// damit Holz, Stein und Marmor unter Kerzenlicht Struktur und dezenten Glanz zeigen.
function pbr(map, roughness = 0.85, { bump = 0, metalness = 0, ...rest } = {}) {
  const m = new THREE.MeshStandardMaterial({ map, roughness, metalness, ...rest });
  if (bump && map) { m.bumpMap = map; m.bumpScale = bump; }
  return m;
}
// Leuchtende Farben über 1.0 (HDR), damit der Bloom sie erfasst.
export const hdr = (hex, k) => new THREE.Color(hex).multiplyScalar(k);
const flat = (color, roughness = 0.9, rest = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...rest });

const defs = {
  wood: () => pbr(tex.wood('#6b4226'), 0.62, { bump: 1.2 }),
  woodDark: () => pbr(tex.wood('#3d2414'), 0.55, { bump: 1.2 }),
  woodLight: () => pbr(tex.wood('#9a6a3e'), 0.65, { bump: 1.2 }),
  woodRed: () => pbr(tex.wood('#5a2a1e'), 0.5, { bump: 1.2 }),
  parquet: () => pbr(tex.parquet(), 0.42, { bump: 1.6 }),
  marble: () => pbr(tex.marble(), 0.22),
  paneling: () => pbr(tex.paneling(), 0.55, { bump: 2 }),
  stone: () => pbr(tex.stone(), 0.92, { bump: 3 }),
  stoneLight: () => pbr(tex.stone('#8f877a'), 0.9, { bump: 3 }),
  stoneDark: () => pbr(tex.stone('#3e3a36'), 0.9, { bump: 3 }),
  plaster: () => pbr(tex.plaster(), 0.95, { bump: 1.5 }),
  roof: () => pbr(tex.roof(), 0.85, { bump: 2 }),
  grass: () => pbr(tex.grass(), 0.95, { bump: 2 }),
  hedge: () => pbr(tex.leaves('#1f3d24'), 0.8, { bump: 4 }),
  leaves: () => pbr(tex.leaves('#2a5530'), 0.75, { bump: 3 }),
  leavesAutumn: () => pbr(tex.leaves('#8a4a20'), 0.75, { bump: 3 }),
  leavesPink: () => pbr(tex.leaves('#a0587a'), 0.75, { bump: 3 }),
  bark: () => pbr(tex.bark(), 0.95, { bump: 4 }),
  paper: () => pbr(tex.paper(), 0.9),
  pages: () => pbr(tex.pages(), 0.9),
  cork: () => pbr(tex.cork(), 0.95, { bump: 3 }),
  wpGreen: () => pbr(tex.wallpaper('#28402f', '#c9a85a'), 0.8, { bump: 0.8 }),
  wpPurple: () => pbr(tex.wallpaper('#3a2848', '#d9b8f0'), 0.8, { bump: 0.8 }),
  wpRed: () => pbr(tex.wallpaper('#4a1e22', '#d8a860'), 0.8, { bump: 0.8 }),
  wpBlue: () => pbr(tex.wallpaper('#1e2c46', '#a8c0e0'), 0.8, { bump: 0.8 }),
  wpOchre: () => pbr(tex.wallpaper('#5a4424', '#2a1a0a'), 0.8, { bump: 0.8 }),
  carpetRed: () => pbr(tex.carpet('#6b1f24'), 1, { bump: 2.5 }),
  carpetBlue: () => pbr(tex.carpet('#1f2a5a', '#d8b860'), 1, { bump: 2.5 }),
  carpetGreen: () => pbr(tex.carpet('#1f4a32', '#e0c070'), 1, { bump: 2.5 }),
  brass: () => new THREE.MeshStandardMaterial({ color: '#c8963e', metalness: 0.8, roughness: 0.35 }),
  iron: () => new THREE.MeshStandardMaterial({ color: '#2a2a2e', metalness: 0.7, roughness: 0.5 }),
  gold: () => new THREE.MeshStandardMaterial({ color: '#f0c050', metalness: 1, roughness: 0.25, emissive: '#3a2a00' }),
  velvet: () => flat('#6a1a2a', 0.95),
  velvetGreen: () => flat('#1f4a36', 0.95),
  velvetBlue: () => flat('#23305f', 0.95),
  cream: () => flat('#e8dcc0'),
  white: () => flat('#f0ece4'),
  black: () => flat('#141210'),
  cloth: () => flat('#5a4a7a'),
  wax: () => flat('#f2e6c8', 0.85, { emissive: '#3a2a10' }),
  flame: () => new THREE.MeshBasicMaterial({ color: hdr('#ffd27a', 5) }),
  glowWarm: () => new THREE.MeshBasicMaterial({ color: hdr('#ffc77a', 2.6) }),
  glowGreen: () => new THREE.MeshBasicMaterial({ color: hdr('#9effb0', 2.2) }),
  glowBlue: () => new THREE.MeshBasicMaterial({ color: hdr('#9ad0ff', 2.2) }),
  window: () => new THREE.MeshBasicMaterial({ color: hdr('#ffb35a', 1.05) }),
  lampShadeGreen: () => flat('#2f7a4a', 0.85, { emissive: '#0e3a1e' }),
  lampShade: () => flat('#e8c890', 0.85, { emissive: '#7a5020', side: THREE.DoubleSide }),
  glass: () => new THREE.MeshStandardMaterial({ color: '#a8d0e0', transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.1, depthWrite: false }),
  water: () => new THREE.MeshStandardMaterial({ map: tex.water(), color: '#7ab0d0', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85 }),
  terracotta: () => flat('#a0502e'),
  ceramic: () => flat('#e6e0f0', 0.3),
  fur: () => flat('#d0884a'),
  furDark: () => flat('#2a2422'),
  robe: () => flat('#2a2a6a'),
  robeTrim: () => flat('#d8b04a', 0.85, { emissive: '#2a1a00' }),
  skin: () => flat('#e0b090'),
  beard: () => flat('#eeeeea'),
  flowerRed: () => flat('#d0405a'),
  flowerYellow: () => flat('#f0d050'),
  flowerBlue: () => flat('#6080e0', 0.85, { emissive: '#101840' }),
  flowerWhite: () => flat('#f4f0ff', 0.85, { emissive: '#202030' }),
  mushroom: () => flat('#c03030', 0.85, { emissive: '#300808' }),
  bookwall0: () => pbr(bookwallTexture(0), 0.75, { bump: 1.5 }),
  bookwall1: () => pbr(bookwallTexture(1), 0.75, { bump: 1.5 }),
  bookwall2: () => pbr(bookwallTexture(2), 0.75, { bump: 1.5 }),
  bookwall3: () => pbr(bookwallTexture(3), 0.75, { bump: 1.5 }),
  contactShadow: () => new THREE.MeshBasicMaterial({ color: '#000000', alphaMap: tex.softShadow(), transparent: true, opacity: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  aoFloor: () => new THREE.MeshBasicMaterial({ color: '#000000', alphaMap: tex.aoEdge(), transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  aoWall: () => new THREE.MeshBasicMaterial({ color: '#000000', alphaMap: tex.aoEdge(), transparent: true, opacity: 0.42, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  lightPool: () => new THREE.MeshBasicMaterial({ map: tex.glow(), color: '#ff9a4a', transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }),
  invisible: () => new THREE.MeshBasicMaterial({ visible: false }),
};

const cache = new Map();
export function mat(key) {
  if (key instanceof THREE.Material) return key;
  if (!cache.has(key)) {
    const def = defs[key];
    if (!def) { console.warn(`[materials] unbekannt: ${key}`); return mat('wood'); }
    cache.set(key, def());
  }
  return cache.get(key);
}

export function registerMaterial(key, factory) { defs[key] = factory; }
