import * as THREE from 'three';

export function createEngine(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.55;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#120c08');
  scene.fog = new THREE.FogExp2('#1a120b', 0.03);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 260);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  const updaters = new Set();
  const clock = new THREE.Clock();
  let elapsed = 0;

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;
    for (const fn of updaters) fn(dt, elapsed);
    renderer.render(scene, camera);
  }

  return {
    renderer, scene, camera,
    onUpdate(fn) { updaters.add(fn); return () => updaters.delete(fn); },
    start() { renderer.setAnimationLoop(frame); },
    get time() { return elapsed; },
  };
}
