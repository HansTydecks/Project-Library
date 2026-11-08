import * as THREE from 'three';
import { tex } from './textures.js';

// Nachthimmel mit Sternen, Mond, Wolkenmeer und Sternschnuppen.
export function createSky(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#050a24') }, mid: { value: new THREE.Color('#1a1f4a') }, bottom: { value: new THREE.Color('#4a3a6a') }, hideColor: { value: new THREE.Color('#000') }, hide: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; uniform vec3 hideColor; uniform float hide; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.6)) : mix(mid, bottom, pow(-h, 0.5));
      gl_FragColor = vec4(mix(c, hideColor, hide), 1.0); }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), skyMat);
  dome.renderOrder = -10;
  group.add(dome);

  // Sterne
  const N = 1800;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const u = Math.random(), v = Math.random() * 0.9 + 0.1;
    const th = u * Math.PI * 2, ph = Math.acos(1 - v);
    const r = 180;
    pos[i * 3] = Math.sin(ph) * Math.cos(th) * r;
    pos[i * 3 + 1] = Math.cos(ph) * r * 0.9 + 10;
    pos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
    const c = new THREE.Color().setHSL(0.55 + Math.random() * 0.15, 0.5, 0.75 + Math.random() * 0.25);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.4, vertexColors: true, map: tex.glow(), transparent: true, depthWrite: false, fog: false, sizeAttenuation: true, blending: THREE.AdditiveBlending }));
  group.add(stars);

  // Mond
  const moonTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(128, 128, 60, 128, 128, 128);
    grd.addColorStop(0, '#fff8e0'); grd.addColorStop(0.5, '#fff0c8'); grd.addColorStop(0.52, 'rgba(255,240,200,0.35)'); grd.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    g.fillStyle = 'rgba(180,160,120,0.35)';
    for (const [x, y, r] of [[105, 110, 14], [150, 140, 20], [120, 160, 9], [160, 100, 8]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, fog: false, depthWrite: false, transparent: true }));
  moon.scale.setScalar(38);
  moon.position.set(120, 70, -60);
  group.add(moon);

  // Wolkenmeer unter der Bibliothek
  const cloudMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { t: { value: 0 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float t; varying vec2 vUv; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0.0, a = 0.5; for(int i=0;i<5;i++){ s += a*n(p); p *= 2.03; a *= 0.5; } return s; }
      void main(){ vec2 p = vW.xz * 0.02 + vec2(t*0.01, t*0.004);
        float c = fbm(p) * 0.8 + fbm(p*2.7 - t*0.01) * 0.4;
        float d = length(vW.xz) / 220.0;
        vec3 col = mix(vec3(0.16,0.18,0.36), vec3(0.75,0.72,0.9), smoothstep(0.35, 0.95, c));
        float a = smoothstep(0.25, 0.7, c) * (1.0 - smoothstep(0.6, 1.0, d));
        gl_FragColor = vec4(col, a * 0.95 + 0.05 * (1.0 - d)); }`,
  });
  const clouds = new THREE.Mesh(new THREE.PlaneGeometry(460, 460, 1, 1), cloudMat);
  clouds.rotation.x = -Math.PI / 2;
  clouds.position.y = -22;
  group.add(clouds);

  // Sternschnuppen
  const shoot = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.15), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, fog: false, blending: THREE.AdditiveBlending, depthWrite: false }));
  group.add(shoot);
  let shootT = -1, shootDir = new THREE.Vector3();

  return {
    /** 0 = Himmel sichtbar, 1 = Himmel in Nebelfarbe (z.B. in den Endlosen Stapeln). */
    setHidden(v, fogColor) {
      skyMat.uniforms.hide.value = v;
      // Nebelfarbe ist sRGB-lin. – Shader-Ausgabe wird nicht tonemapped, daher leicht abdunkeln
      skyMat.uniforms.hideColor.value.copy(fogColor).multiplyScalar(0.9);
      stars.material.opacity = 1 - v;
      moon.material.opacity = 1 - v;
      clouds.visible = v < 0.99;
      shoot.visible = v < 0.99;
    },
    update(dt, t, camera) {
      group.position.set(camera.position.x, 0, camera.position.z);
      clouds.position.x = 0; // im Gruppenraum zentriert
      cloudMat.uniforms.t.value = t;
      stars.rotation.y = t * 0.002;
      if (shootT < 0 && Math.random() < dt * 0.08) {
        shootT = 0;
        const a = Math.random() * Math.PI * 2;
        shoot.position.set(Math.cos(a) * 120, 60 + Math.random() * 40, Math.sin(a) * 120);
        shootDir.set(-Math.sin(a) + (Math.random() - 0.5), -0.4, Math.cos(a)).normalize();
        shoot.lookAt(shoot.position.clone().add(new THREE.Vector3(0, 0, 1)));
        shoot.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), shootDir);
      }
      if (shootT >= 0) {
        shootT += dt;
        shoot.position.addScaledVector(shootDir, dt * 90);
        shoot.material.opacity = Math.sin(Math.min(shootT / 1.2, 1) * Math.PI) * 0.9;
        if (shootT > 1.2) { shootT = -1; shoot.material.opacity = 0; }
      }
    },
  };
}
