import * as THREE from 'three';

const EYE = 1.65;
const RADIUS = 0.32;

export function createPlayer({ camera, input, collision }) {
  const pos = new THREE.Vector3(0, 0, 0);
  const vel = new THREE.Vector2(0, 0);
  let yaw = 0, pitch = 0;
  let bobT = 0, bobAmt = 0;
  let stepAcc = 0;
  const stepListeners = new Set();

  function update(dt) {
    const s = input.state;
    if (s.enabled) {
      const look = input.consumeLook();
      const sens = 0.0022;
      yaw -= look.x * sens;
      pitch -= look.y * sens;
      pitch = Math.max(-1.45, Math.min(1.45, pitch));
    } else {
      input.consumeLook();
    }

    // Wunschrichtung
    let fx = 0, fz = 0;
    if (s.enabled) {
      if (input.isDown('KeyW', 'ArrowUp')) fz -= 1;
      if (input.isDown('KeyS', 'ArrowDown')) fz += 1;
      if (input.isDown('KeyA', 'ArrowLeft')) fx -= 1;
      if (input.isDown('KeyD', 'ArrowRight')) fx += 1;
      fx += s.moveX; fz += s.moveY;
    }
    const len = Math.hypot(fx, fz);
    if (len > 1) { fx /= len; fz /= len; }
    const running = input.isDown('ShiftLeft', 'ShiftRight') || Math.hypot(s.moveX, s.moveY) > 0.95;
    const speed = running ? 6.2 : 3.3;
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const wx = (fx * cos + fz * sin) * speed;
    const wz = (-fx * sin + fz * cos) * speed;
    const k = 1 - Math.exp(-dt * 10);
    vel.x += (wx - vel.x) * k;
    vel.y += (wz - vel.y) * k;

    const nx = pos.x + vel.x * dt, nz = pos.z + vel.y * dt;
    const r = collision.resolve(nx, nz, RADIUS);
    pos.x = r.x; pos.z = r.z;

    // Kopfwippen & Schritte
    const sp = vel.length();
    bobAmt += ((sp > 0.3 ? 1 : 0) - bobAmt) * Math.min(1, dt * 6);
    bobT += dt * sp * 2.1;
    stepAcc += dt * sp;
    if (stepAcc > (running ? 1.6 : 1.25)) {
      stepAcc = 0;
      for (const fn of stepListeners) fn(running);
    }

    camera.position.set(
      pos.x,
      EYE + Math.sin(bobT * 2) * 0.035 * bobAmt,
      pos.z,
    );
    camera.rotation.set(pitch + Math.sin(bobT * 2) * 0.004 * bobAmt, yaw, Math.sin(bobT) * 0.004 * bobAmt);
  }

  return {
    pos,
    get yaw() { return yaw; },
    get pitch() { return pitch; },
    update,
    onStep(fn) { stepListeners.add(fn); },
    teleport(x, z, faceYaw = yaw) {
      pos.set(x, 0, z); vel.set(0, 0); yaw = faceYaw; pitch = 0;
      update(0);
    },
    look(newYaw, newPitch = 0) { yaw = newYaw; pitch = newPitch; },
    get speed() { return vel.length(); },
  };
}
