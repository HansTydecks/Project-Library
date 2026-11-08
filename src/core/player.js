import * as THREE from 'three';

const EYE = 1.65;
const RADIUS = 0.32;
const GRAVITY = 17;
const JUMP_V = 6.0;      // ≈ 1,05 m hoch
const DOUBLE_V = 5.2;    // magischer Doppelsprung in der Luft

export function createPlayer({ camera, input, collision }) {
  const pos = new THREE.Vector3(0, 0, 0);
  const vel = new THREE.Vector2(0, 0);
  let yaw = 0, pitch = 0;
  let bobT = 0, bobAmt = 0;
  let stepAcc = 0;
  const stepListeners = new Set();
  const jumpListeners = new Set();
  const landListeners = new Set();
  let vy = 0, grounded = true, airJumps = 0, airTime = 0;
  let wantJump = false;
  let gravityScale = 1; // < 1 = Federleicht-Zauber
  let maxAir = 1;        // Sprünge in der Luft (Sternenstaub: 2)
  let ride = null;       // { path(k, outVec3), dur, t, onEnd }

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

    // Mitfahrt (Luftschiff-Rundflug): Position kommt vom Pfad, Umsehen bleibt frei
    if (ride) {
      ride.t += dt;
      const k = Math.min(1, ride.t / ride.dur);
      ride.path(k, pos);
      vel.set(0, 0); vy = 0;
      camera.position.set(pos.x, pos.y + EYE, pos.z);
      camera.rotation.set(pitch, yaw, Math.sin(ride.t * 0.7) * 0.02);
      if (k >= 1) { const done = ride.onEnd; ride = null; grounded = false; done?.(); }
      return;
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
    const r = collision.resolve(nx, nz, RADIUS, pos.y);
    pos.x = r.x; pos.z = r.z;

    // Springen & Schwerkraft
    if (wantJump) {
      wantJump = false;
      if (grounded) { vy = JUMP_V; grounded = false; airJumps = maxAir; for (const fn of jumpListeners) fn(false); }
      else if (airJumps > 0) { vy = Math.max(vy, DOUBLE_V); airJumps--; for (const fn of jumpListeners) fn(true); }
    }
    const ground = collision.groundAt(pos.x, pos.z, RADIUS, pos.y);
    if (!grounded || pos.y > ground + 0.001) {
      if (grounded && pos.y - ground > 0.35) { grounded = false; airJumps = maxAir; } // von einer Kante gelaufen
      if (grounded) pos.y = ground; // kleine Stufe hinunter: einfach folgen
      else {
        vy -= GRAVITY * gravityScale * dt;
        pos.y += vy * dt;
        airTime += dt;
        const ceil = collision.ceilingAt(pos.x, pos.z, pos.y);
        if (vy > 0 && pos.y + 1.75 > ceil) { pos.y = ceil - 1.75; vy = 0; }
        if (pos.y <= ground) {
          const impact = -vy;
          pos.y = ground; vy = 0; grounded = true; airJumps = 0;
          if (airTime > 0.15) for (const fn of landListeners) fn(impact);
          airTime = 0;
        }
      }
    } else if (pos.y < ground) pos.y = ground; // kleine Stufe hinauf

    // Kopfwippen & Schritte
    const sp = vel.length();
    bobAmt += ((sp > 0.3 && grounded ? 1 : 0) - bobAmt) * Math.min(1, dt * 6);
    bobT += dt * sp * 2.1;
    stepAcc += dt * sp;
    if (grounded && stepAcc > (running ? 1.6 : 1.25)) {
      stepAcc = 0;
      for (const fn of stepListeners) fn(running);
    }

    camera.position.set(
      pos.x,
      pos.y + EYE + Math.sin(bobT * 2) * 0.035 * bobAmt,
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
    onJump(fn) { jumpListeners.add(fn); },
    onLand(fn) { landListeners.add(fn); },
    jump() { wantJump = true; },
    setGravityScale(k) { gravityScale = k; },
    get gravityScale() { return gravityScale; },
    /** Schleudert die Figur nach oben (Sprungpilze, Magie). */
    launch(v) { vy = v; grounded = false; airJumps = maxAir; airTime = 0.01; },
    setMaxAirJumps(n) { maxAir = n; },
    /** Fahrt auf einem Pfad: path(k∈[0,1], out) setzt die Fußposition. */
    ride(path, dur, onEnd) { ride = { path, dur, t: 0, onEnd }; },
    get riding() { return !!ride; },
    get grounded() { return grounded; },
    teleport(x, z, faceYaw = yaw, y = 0) {
      pos.set(x, y, z); vel.set(0, 0); yaw = faceYaw; pitch = 0; vy = 0; grounded = true;
      update(0);
    },
    look(newYaw, newPitch = 0) { yaw = newYaw; pitch = newPitch; },
    get speed() { return vel.length(); },
  };
}
