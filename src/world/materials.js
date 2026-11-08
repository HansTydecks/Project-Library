import * as THREE from 'three';
import { tex, bookwallTexture } from './textures.js';

// Geteilte Materialien. Schlüssel → Material. Neue Materialien einfach unten ergänzen.
const defs = {
  wood: () => new THREE.MeshLambertMaterial({ map: tex.wood('#6b4226') }),
  woodDark: () => new THREE.MeshLambertMaterial({ map: tex.wood('#3d2414') }),
  woodLight: () => new THREE.MeshLambertMaterial({ map: tex.wood('#9a6a3e') }),
  woodRed: () => new THREE.MeshLambertMaterial({ map: tex.wood('#5a2a1e') }),
  parquet: () => new THREE.MeshLambertMaterial({ map: tex.parquet() }),
  marble: () => new THREE.MeshLambertMaterial({ map: tex.marble() }),
  paneling: () => new THREE.MeshLambertMaterial({ map: tex.paneling() }),
  stone: () => new THREE.MeshLambertMaterial({ map: tex.stone() }),
  stoneLight: () => new THREE.MeshLambertMaterial({ map: tex.stone('#8f877a') }),
  stoneDark: () => new THREE.MeshLambertMaterial({ map: tex.stone('#3e3a36') }),
  plaster: () => new THREE.MeshLambertMaterial({ map: tex.plaster() }),
  roof: () => new THREE.MeshLambertMaterial({ map: tex.roof() }),
  grass: () => new THREE.MeshLambertMaterial({ map: tex.grass() }),
  hedge: () => new THREE.MeshLambertMaterial({ map: tex.leaves('#1f3d24') }),
  leaves: () => new THREE.MeshLambertMaterial({ map: tex.leaves('#2a5530') }),
  leavesAutumn: () => new THREE.MeshLambertMaterial({ map: tex.leaves('#8a4a20') }),
  leavesPink: () => new THREE.MeshLambertMaterial({ map: tex.leaves('#a0587a') }),
  bark: () => new THREE.MeshLambertMaterial({ map: tex.bark() }),
  paper: () => new THREE.MeshLambertMaterial({ map: tex.paper() }),
  pages: () => new THREE.MeshLambertMaterial({ map: tex.pages() }),
  cork: () => new THREE.MeshLambertMaterial({ map: tex.cork() }),
  wpGreen: () => new THREE.MeshLambertMaterial({ map: tex.wallpaper('#28402f', '#c9a85a') }),
  wpPurple: () => new THREE.MeshLambertMaterial({ map: tex.wallpaper('#3a2848', '#d9b8f0') }),
  wpRed: () => new THREE.MeshLambertMaterial({ map: tex.wallpaper('#4a1e22', '#d8a860') }),
  wpBlue: () => new THREE.MeshLambertMaterial({ map: tex.wallpaper('#1e2c46', '#a8c0e0') }),
  wpOchre: () => new THREE.MeshLambertMaterial({ map: tex.wallpaper('#5a4424', '#2a1a0a') }),
  carpetRed: () => new THREE.MeshLambertMaterial({ map: tex.carpet('#6b1f24') }),
  carpetBlue: () => new THREE.MeshLambertMaterial({ map: tex.carpet('#1f2a5a', '#d8b860') }),
  carpetGreen: () => new THREE.MeshLambertMaterial({ map: tex.carpet('#1f4a32', '#e0c070') }),
  brass: () => new THREE.MeshStandardMaterial({ color: '#c8963e', metalness: 0.8, roughness: 0.35 }),
  iron: () => new THREE.MeshStandardMaterial({ color: '#2a2a2e', metalness: 0.7, roughness: 0.5 }),
  gold: () => new THREE.MeshStandardMaterial({ color: '#f0c050', metalness: 1, roughness: 0.25, emissive: '#3a2a00' }),
  velvet: () => new THREE.MeshLambertMaterial({ color: '#6a1a2a' }),
  velvetGreen: () => new THREE.MeshLambertMaterial({ color: '#1f4a36' }),
  velvetBlue: () => new THREE.MeshLambertMaterial({ color: '#23305f' }),
  cream: () => new THREE.MeshLambertMaterial({ color: '#e8dcc0' }),
  white: () => new THREE.MeshLambertMaterial({ color: '#f0ece4' }),
  black: () => new THREE.MeshLambertMaterial({ color: '#141210' }),
  cloth: () => new THREE.MeshLambertMaterial({ color: '#5a4a7a' }),
  wax: () => new THREE.MeshLambertMaterial({ color: '#f2e6c8', emissive: '#3a2a10' }),
  flame: () => new THREE.MeshBasicMaterial({ color: '#ffd27a' }),
  glowWarm: () => new THREE.MeshBasicMaterial({ color: '#ffc77a' }),
  glowGreen: () => new THREE.MeshBasicMaterial({ color: '#9effb0' }),
  glowBlue: () => new THREE.MeshBasicMaterial({ color: '#9ad0ff' }),
  window: () => new THREE.MeshBasicMaterial({ color: '#ffb35a' }),
  lampShadeGreen: () => new THREE.MeshLambertMaterial({ color: '#2f7a4a', emissive: '#0e3a1e' }),
  lampShade: () => new THREE.MeshLambertMaterial({ color: '#e8c890', emissive: '#7a5020', side: THREE.DoubleSide }),
  glass: () => new THREE.MeshStandardMaterial({ color: '#a8d0e0', transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.1, depthWrite: false }),
  water: () => new THREE.MeshStandardMaterial({ map: tex.water(), color: '#7ab0d0', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85 }),
  terracotta: () => new THREE.MeshLambertMaterial({ color: '#a0502e' }),
  ceramic: () => new THREE.MeshLambertMaterial({ color: '#e6e0f0' }),
  fur: () => new THREE.MeshLambertMaterial({ color: '#d0884a' }),
  furDark: () => new THREE.MeshLambertMaterial({ color: '#2a2422' }),
  robe: () => new THREE.MeshLambertMaterial({ color: '#2a2a6a' }),
  robeTrim: () => new THREE.MeshLambertMaterial({ color: '#d8b04a', emissive: '#2a1a00' }),
  skin: () => new THREE.MeshLambertMaterial({ color: '#e0b090' }),
  beard: () => new THREE.MeshLambertMaterial({ color: '#eeeeea' }),
  flowerRed: () => new THREE.MeshLambertMaterial({ color: '#d0405a' }),
  flowerYellow: () => new THREE.MeshLambertMaterial({ color: '#f0d050' }),
  flowerBlue: () => new THREE.MeshLambertMaterial({ color: '#6080e0', emissive: '#101840' }),
  flowerWhite: () => new THREE.MeshLambertMaterial({ color: '#f4f0ff', emissive: '#202030' }),
  mushroom: () => new THREE.MeshLambertMaterial({ color: '#c03030', emissive: '#300808' }),
  bookwall0: () => new THREE.MeshLambertMaterial({ map: bookwallTexture(0) }),
  bookwall1: () => new THREE.MeshLambertMaterial({ map: bookwallTexture(1) }),
  bookwall2: () => new THREE.MeshLambertMaterial({ map: bookwallTexture(2) }),
  bookwall3: () => new THREE.MeshLambertMaterial({ map: bookwallTexture(3) }),
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
