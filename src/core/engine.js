import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createPost } from './post.js';

// Renderer, Szene, Kamera, Nachbearbeitung und eine adaptive Auflösung,
// die auf schwächeren Geräten die Pixeldichte senkt, statt zu ruckeln.
export function createEngine(container, { lowFx = false, adaptive = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: lowFx, powerPreference: 'high-performance' });
  const maxRatio = Math.min(window.devicePixelRatio, lowFx ? 1.25 : 1.5);
  let ratio = maxRatio;
  renderer.setPixelRatio(ratio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.6;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.info.autoReset = false; // Statistik über alle Passes eines Bildes
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#120c08');
  scene.fog = new THREE.FogExp2('#3a2630', 0.012);

  // Sanfte Umgebungsreflexionen (Messing, Marmor, Lack glänzen dezent)
  if (!lowFx) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.1;
    pmrem.dispose();
  }

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 260);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  const post = lowFx ? null : createPost({ renderer, scene, camera });

  const updaters = new Set();
  const clock = new THREE.Clock();
  let elapsed = 0;

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    post?.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // Adaptive Auflösung: alle 2 s die Bildrate prüfen.
  let perfT = 0, perfN = 0, settle = 3;
  function adapt(rawDt) {
    perfT += rawDt; perfN++;
    if (perfT < 2) return;
    const fps = perfN / perfT;
    perfT = 0; perfN = 0;
    if (settle > 0) { settle--; return; }
    let next = ratio;
    if (fps < 42) next = Math.max(0.6, ratio - 0.15);
    else if (fps > 58) next = Math.min(maxRatio, ratio + 0.1);
    if (Math.abs(next - ratio) > 0.01) {
      ratio = next;
      renderer.setPixelRatio(ratio);
      onResize();
    }
  }

  function frame() {
    const raw = clock.getDelta();
    const dt = Math.min(raw, 0.05);
    elapsed += dt;
    if (adaptive && !document.hidden) adapt(raw);
    for (const fn of updaters) fn(dt, elapsed);
    renderer.info.reset();
    if (post) post.render(elapsed); else renderer.render(scene, camera);
  }

  return {
    renderer, scene, camera, post,
    onUpdate(fn) { updaters.add(fn); return () => updaters.delete(fn); },
    start() { renderer.setAnimationLoop(frame); },
    get time() { return elapsed; },
    get pixelRatio() { return ratio; },
  };
}
