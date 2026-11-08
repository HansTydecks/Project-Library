import * as THREE from 'three';
import { tex } from '../world/textures.js';
import { hdr } from '../world/materials.js';
import { roomBounds } from '../world/world.js';

// Das Irrlicht: schwebt voraus, wartet auf dich, führt dich zum Ziel. Laufen musst du selbst.
export function createWisp({ scene, lights, findPath }) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshBasicMaterial({ color: hdr('#d8f0ff', 2.8) }));
  group.add(core);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.glow(), color: '#88c8ff', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.setScalar(0.9);
  group.add(halo);
  const TRAIL = 40;
  const tGeo = new THREE.BufferGeometry();
  const tPos = new Float32Array(TRAIL * 3);
  tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
  const trail = new THREE.Points(tGeo, new THREE.PointsMaterial({ map: tex.glow(), color: '#9ad8ff', size: 0.18, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
  trail.frustumCulled = false;
  scene.add(trail);
  trail.visible = false;

  const spot = { pos: new THREE.Vector3(0, -50, 0), color: '#9ad0ff', intensity: 0, distance: 7, priority: 50, enabled: false };
  lights.add(spot);

  let path = null, s = 0, total = 0, segs = [];
  let state = 'idle', arrivedT = 0, life = 0, target = null, onArrive = null;
  const pos = new THREE.Vector3();

  function setPath(points) {
    segs = [];
    total = 0;
    for (let i = 1; i < points.length; i++) {
      const len = points[i].distanceTo(points[i - 1]);
      segs.push({ a: points[i - 1], b: points[i], len, start: total });
      total += len;
    }
    path = points;
  }

  function pointAt(d) {
    for (const sg of segs) if (d <= sg.start + sg.len) return sg.a.clone().lerp(sg.b, (d - sg.start) / Math.max(sg.len, 1e-6));
    return path[path.length - 1].clone();
  }

  return {
    get active() { return state !== 'idle'; },
    /** target: { pos: Vector3, room, label, onArrive?, onEnd? } */
    guide(from, tgt) {
      const pts = findPath(from, tgt);
      if (!pts) return false;
      target = tgt;
      onArrive = tgt.onArrive;
      setPath(pts);
      s = 0; state = 'leading'; life = 0; arrivedT = 0;
      group.visible = true; trail.visible = true;
      spot.enabled = true;
      pos.copy(pts[0]);
      for (let i = 0; i < TRAIL; i++) tPos.set([pos.x, pos.y, pos.z], i * 3);
      return true;
    },
    stop() {
      if (target?.onEnd) target.onEnd();
      state = 'idle'; group.visible = false; trail.visible = false; spot.enabled = false; spot.intensity = 0; target = null;
    },
    update(dt, t, player) {
      if (state === 'idle') return;
      life += dt;
      const here = pointAt(s);
      const dPlayer = Math.hypot(here.x - player.x, here.z - player.z);
      if (state === 'leading') {
        const speed = dPlayer < 3.5 ? 4.2 : dPlayer < 6 ? 1.2 : 0;
        s = Math.min(total, s + speed * dt);
        if (s >= total - 0.01) { state = 'arrived'; onArrive?.(); }
        pos.lerp(pointAt(s), Math.min(1, dt * 6));
      } else if (state === 'arrived') {
        const end = path[path.length - 1];
        pos.set(end.x + Math.cos(t * 2.5) * 0.35, end.y + Math.sin(t * 3) * 0.1, end.z + Math.sin(t * 2.5) * 0.35);
        if (Math.hypot(end.x - player.x, end.z - player.z) < 2.2) arrivedT += dt;
        if (arrivedT > 4 || life > 180) this.stop();
      }
      if (life > 240) this.stop();
      group.position.set(pos.x, pos.y + Math.sin(t * 4) * 0.06, pos.z);
      halo.material.opacity = 0.7 + Math.sin(t * 6) * 0.2;
      halo.scale.setScalar(0.8 + Math.sin(t * 5) * 0.1);
      spot.pos.copy(group.position);
      spot.intensity = 4;
      // Schweif
      tPos.copyWithin(3, 0, (TRAIL - 1) * 3);
      tPos[0] = group.position.x + (Math.random() - 0.5) * 0.05;
      tPos[1] = group.position.y + (Math.random() - 0.5) * 0.05;
      tPos[2] = group.position.z + (Math.random() - 0.5) * 0.05;
      tGeo.attributes.position.needsUpdate = true;
    },
  };
}

/** Pfadsuche über das Raum-Türen-Netz (BFS). */
export function createPathfinder({ doors, byId, roomAt }) {
  const adj = new Map();
  for (const d of doors) {
    for (const [a, b] of [[d.a, d.b], [d.b, d.a]]) {
      if (!adj.has(a)) adj.set(a, []);
      adj.get(a).push({ to: b, door: d });
    }
  }
  return function findPath(from, target) {
    const start = roomAt(from.x, from.z);
    const goal = target.room;
    const eye = 1.5;
    const pts = [new THREE.Vector3(from.x, eye, from.z)];
    if (start && goal && start !== goal) {
      const prev = new Map([[start, null]]);
      const q = [start];
      while (q.length) {
        const cur = q.shift();
        if (cur === goal) break;
        for (const e of adj.get(cur) ?? []) if (!prev.has(e.to)) { prev.set(e.to, { from: cur, door: e.door }); q.push(e.to); }
      }
      if (!prev.has(goal)) return null;
      const chain = [];
      for (let n = goal; prev.get(n); n = prev.get(n).from) chain.unshift(prev.get(n));
      for (const step of chain) {
        const d = step.door;
        const fromRoom = byId.get(step.from);
        // Richtung vom Raum zur Tür
        const nx = d.axis === 'x' ? 1 : 0, nz = d.axis === 'z' ? 1 : 0;
        const c = fromRoom ? (({ cx, cz }) => ({ x: cx, z: cz }))(roomBounds(fromRoom)) : { x: from.x, z: from.z };
        const sign = ((d.x - c.x) * nx + (d.z - c.z) * nz) >= 0 ? 1 : -1;
        pts.push(new THREE.Vector3(d.x - nx * sign * 1.6, eye, d.z - nz * sign * 1.6));
        pts.push(new THREE.Vector3(d.x + nx * sign * 1.6, eye, d.z + nz * sign * 1.6));
      }
    }
    if (target.approach) pts.push(new THREE.Vector3(target.approach.x, eye, target.approach.z));
    pts.push(new THREE.Vector3(target.pos.x, Math.max(0.6, target.pos.y + 0.35), target.pos.z));
    return pts;
  };
}
