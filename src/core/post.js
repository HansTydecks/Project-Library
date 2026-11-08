import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Nachbearbeitung: weiches Glühen (Bloom) für Kerzen & Magie, warme Farbstimmung,
// Vignette und ein Hauch Filmkorn. Läuft im linearen HDR-Raum vor dem Tone Mapping.
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 0.12 },
    uWarm: { value: new THREE.Vector3(1.04, 1.0, 0.94) },
    uGrain: { value: 0.0 },
    uSat: { value: 1.18 },
    uLift: { value: new THREE.Vector3(0.012, 0.008, 0.02) },
    uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime, uVignette, uGrain, uSat;
    uniform vec3 uWarm, uLift;
    uniform vec2 uRes;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 col = c.rgb * uWarm;
      // Schatten leicht ins Blau-Violette, Lichter warm (Split-Toning)
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      // Märchenhaft: kräftigere Farben und leicht violett aufgehellte Schatten (nie pechschwarz)
      col = mix(vec3(l), col, uSat);
      col += uLift * (1.0 - smoothstep(0.0, 0.3, l));
      // Vignette (elliptisch, weich)
      vec2 q = vUv - 0.5;
      q.x *= uRes.x / uRes.y * 0.75;
      float v = 1.0 - uVignette * smoothstep(0.15, 0.85, length(q) * 1.25);
      col *= v;
      // Filmkorn (nur in dunklen/mittleren Tönen sichtbar)
      float g = hash(vUv * uRes + fract(uTime * 7.31) * 100.0) - 0.5;
      col += g * uGrain * (1.0 - smoothstep(0.0, 1.2, l)) * max(l, 0.04) * 4.0;
      gl_FragColor = vec4(max(col, 0.0), c.a);
    }`,
};

export function createPost({ renderer, scene, camera }) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, {
    type: THREE.HalfFloatType,
    samples: renderer.capabilities.isWebGL2 === false ? 0 : 4, // MSAA trotz Nachbearbeitung
  });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.75, 0.7, 0.78);
  composer.addPass(bloom);

  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  let enabled = true;

  function setSize(w, h) {
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
    grade.uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
  }
  setSize(window.innerWidth, window.innerHeight);

  return {
    composer, bloom, grade,
    get enabled() { return enabled; },
    set enabled(v) { enabled = v; },
    setSize,
    render(t) {
      if (!enabled) { renderer.render(scene, camera); return; }
      grade.uniforms.uTime.value = t;
      composer.render();
    },
  };
}
