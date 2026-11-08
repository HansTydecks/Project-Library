import * as THREE from 'three';

// Raycast vom Fadenkreuz. Interaktive Objekte tragen userData.interact = {
//   label: string | (hit) => string,  verb?: string,  onInteract(hit), range?: number }
export function createInteraction({ camera, input }) {
  const raycaster = new THREE.Raycaster();
  raycaster.far = 6;
  const targets = new Set();
  const blockers = new Set();
  const center = new THREE.Vector2(0, 0);
  let current = null;
  let acc = 0;
  const listeners = new Set();

  function setCurrent(hit) {
    const prevObj = current?.object, prevId = current?.instanceId;
    current = hit;
    if (prevObj !== hit?.object || prevId !== hit?.instanceId) {
      if (prevObj?.userData.interact?.onHoverEnd) prevObj.userData.interact.onHoverEnd(prevId);
      if (hit?.object.userData.interact?.onHover) hit.object.userData.interact.onHover(hit);
      for (const fn of listeners) fn(hit);
    }
  }

  function update(dt) {
    acc += dt;
    if (acc < 0.08) return;
    acc = 0;
    if (!input.state.enabled) { setCurrent(null); return; }
    raycaster.setFromCamera(center, camera);
    const list = [];
    for (const o of targets) if (o.parent && isShown(o)) list.push(o);
    const hits = raycaster.intersectObjects(list, false);
    // Verdeckung durch Wände/Möbel (statische Geometrie)
    let blockDist = Infinity;
    if (hits.length) {
      const bl = [];
      for (const o of blockers) if (o.parent && isShown(o)) bl.push(o);
      raycaster.far = Math.min(6, hits[0].distance + 0.01);
      const bh = raycaster.intersectObjects(bl, false);
      raycaster.far = 6;
      if (bh.length) blockDist = bh[0].distance;
    }
    let found = null;
    for (const h of hits) {
      const ia = h.object.userData.interact;
      if (!ia) continue;
      if (ia.filter && !ia.filter(h)) continue;
      if (h.distance > (ia.range ?? 3.6)) continue;
      if (h.distance > blockDist + 0.06) break;
      found = h;
      break;
    }
    setCurrent(found);
  }

  function isShown(o) {
    while (o) { if (o.visible === false && !o.userData.hitbox) return false; o = o.parent; }
    return true;
  }

  let capture = null;
  function trigger() {
    // Minispiel übernimmt Klick/E (z. B. Werfen, Angeln). Gibt die Übernahme false zurück, geht es normal weiter.
    if (capture && input.state.enabled && capture(current) !== false) return true;
    if (!current || !input.state.enabled) return false;
    const ia = current.object.userData.interact;
    ia.onInteract?.(current);
    return true;
  }

  return {
    add(obj) { targets.add(obj); },
    addBlocker(obj) { blockers.add(obj); },
    removeBlocker(obj) { blockers.delete(obj); },
    remove(obj) { targets.delete(obj); if (current?.object === obj) setCurrent(null); },
    update,
    trigger,
    setCapture(fn) { capture = fn ?? null; },
    get current() { return current; },
    onChange(fn) { listeners.add(fn); },
    refresh() { acc = 1; },
  };
}
