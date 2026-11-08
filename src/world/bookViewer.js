import * as THREE from 'three';
import { tex } from './textures.js';

// Animiert ein Buch aus dem Regal vor die Kamera (und zurück).
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();

export function createBookViewer({ scene, camera, engine }) {
  let anim = null;

  function targetTransform() {
    const pos = new THREE.Vector3(0, -0.02, -0.55).applyMatrix4(camera.matrixWorld);
    // Deckel (+x des Buchs) zur Kamera drehen
    const q = camera.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2 + 0.25, 0.08)));
    return { pos, q };
  }

  function tween(mesh, from, to, dur, done) {
    anim = { mesh, from, to, t: 0, dur, done };
  }

  engine.onUpdate((dt) => {
    if (!anim) return;
    anim.t = Math.min(1, anim.t + dt / anim.dur);
    const k = anim.t < 0.5 ? 2 * anim.t * anim.t : 1 - (-2 * anim.t + 2) ** 2 / 2;
    const to = typeof anim.to === 'function' ? anim.to() : anim.to;
    const from = typeof anim.from === 'function' ? anim.from() : anim.from;
    anim.mesh.position.lerpVectors(from.pos, to.pos, k);
    anim.mesh.quaternion.slerpQuaternions(from.q, to.q, k);
    if (anim.t >= 1) { const d = anim.done; anim = null; d?.(); }
  });

  return {
    get busy() { return !!anim; },
    /** Echtes Buch (eigenes Mesh). open(): Panel öffnen; gibt Promise zurück, die nach dem Zurückstellen auflöst. */
    showMesh(mesh, openPanel) {
      if (anim) return;
      const parent = mesh.parent;
      const localPos = mesh.position.clone(), localQ = mesh.quaternion.clone();
      mesh.updateMatrixWorld();
      mesh.matrixWorld.decompose(_p, _q, _s);
      const start = { pos: _p.clone(), q: _q.clone() };
      // erst ein Stück herausziehen
      const pulled = { pos: start.pos.clone().add(new THREE.Vector3(0, 0, 0.18).applyQuaternion(start.q)), q: start.q.clone() };
      scene.attach(mesh);
      tween(mesh, start, pulled, 0.18, () => tween(mesh, pulled, targetTransform, 0.4, () => {
        openPanel(() => {
          const now = { pos: mesh.position.clone(), q: mesh.quaternion.clone() };
          tween(mesh, now, start, 0.45, () => {
            parent.add(mesh);
            mesh.position.copy(localPos); mesh.quaternion.copy(localQ);
          });
        });
      }));
    },
    /** Füllbuch aus einer InstancedMesh. */
    showInstance(im, id, color, openPanel) {
      if (anim) return;
      im.getMatrixAt(id, _m);
      const orig = _m.clone();
      const world = im.matrixWorld.clone().multiply(orig);
      world.decompose(_p, _q, _s);
      const size = _s.clone();
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ map: tex.fillerSpine(), color }));
      mesh.scale.copy(size);
      const start = { pos: _p.clone(), q: _q.clone() };
      mesh.position.copy(start.pos); mesh.quaternion.copy(start.q);
      scene.add(mesh);
      im.setMatrixAt(id, new THREE.Matrix4().makeScale(0, 0, 0));
      im.instanceMatrix.needsUpdate = true;
      const pulled = { pos: start.pos.clone().add(new THREE.Vector3(0, 0, 0.18).applyQuaternion(start.q)), q: start.q.clone() };
      tween(mesh, start, pulled, 0.18, () => tween(mesh, pulled, targetTransform, 0.4, () => {
        openPanel(() => {
          const now = { pos: mesh.position.clone(), q: mesh.quaternion.clone() };
          tween(mesh, now, start, 0.45, () => {
            mesh.removeFromParent(); mesh.geometry.dispose(); mesh.material.dispose();
            im.setMatrixAt(id, orig); im.instanceMatrix.needsUpdate = true;
          });
        });
      }));
    },
  };
}
