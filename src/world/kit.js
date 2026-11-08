import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat } from './materials.js';
import { tex } from './textures.js';

// Ein Kit sammelt alles, was ein Raum (oder ein Chunk der Endlosen Stapel) baut:
// statische Geometrie (wird pro Material zusammengeführt → wenige Draw Calls),
// dynamische Objekte, Kollisionsboxen, Lichtpunkte, Interaktionen, Animationen.
// Frames sind lokale Koordinatensysteme (Position + Drehung um Y), beliebig schachtelbar.

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();

let fillerGeo = null;
let fillerMat = null;

export class Kit {
  constructor({ id, origin = [0, 0, 0], services, room = null }) {
    this.id = id;
    this.room = room;               // Raum-Definition (oder null für Chunks)
    this.services = services;       // { collision, lights, interaction, secrets, ui, ... }
    this.group = new THREE.Group();
    this.group.name = id;
    this.group.position.set(...origin);
    this.origin = new THREE.Vector3(...origin);
    this.buckets = new Map();
    this.fillers = [];              // { matrix, color, seed }
    this.updaters = [];
    this.spots = [];
    this.interactables = [];
    this.colliderOwner = `kit:${id}`;
    this.disposables = [];
    this.blockers = [];
    this.root = new Frame(this, new THREE.Matrix4(), 0);
  }

  frame(at = [0, 0, 0], rotY = 0) { return this.root.frame(at, rotY); }

  _addGeo(geo, material, matrix) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(matrix);
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    }
    const m = mat(material);
    if (!this.buckets.has(m)) this.buckets.set(m, []);
    this.buckets.get(m).push(g);
  }

  _collider(minX, maxX, minZ, maxZ) {
    const o = this.origin;
    this.services.collision.add({ minX: minX + o.x, maxX: maxX + o.x, minZ: minZ + o.z, maxZ: maxZ + o.z }, this.colliderOwner);
  }

  onUpdate(fn) { this.updaters.push(fn); }

  finalize() {
    for (const [m, list] of this.buckets) {
      const merged = mergeGeometries(list, false);
      for (const g of list) g.dispose();
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, m);
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      this.group.add(mesh);
      this.disposables.push(merged);
      if (m.visible !== false && !m.transparent) { this.services.interaction.addBlocker(mesh); this.blockers.push(mesh); }
    }
    this.buckets.clear();

    if (this.fillers.length) {
      if (!fillerGeo) {
        // Einheitsbox ohne Unter- und Rückseite (nie sichtbar) → 8 statt 12 Dreiecke
        fillerGeo = new THREE.BoxGeometry(1, 1, 1);
        const idx = Array.from(fillerGeo.index.array);
        fillerGeo.setIndex([...idx.slice(0, 18), ...idx.slice(24, 30)]);
        fillerGeo.clearGroups();
        fillerMat = new THREE.MeshStandardMaterial({ map: tex.fillerSpine(), roughness: 0.7 });
      }
      const im = new THREE.InstancedMesh(fillerGeo, fillerMat, this.fillers.length);
      const c = new THREE.Color();
      this.fillers.forEach((f, i) => {
        im.setMatrixAt(i, f.matrix);
        im.setColorAt(i, c.set(f.color));
      });
      im.instanceMatrix.needsUpdate = true;
      im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere();
      im.userData.fillers = this.fillers;
      im.userData.kit = this;
      this.fillerMesh = im;
      this.group.add(im);
      this.services.onFillerMesh?.(im, this);
    }
    for (const s of this.spots) this.services.lights.add(s);
    for (const o of this.interactables) this.services.interaction.add(o);
    this.group.updateMatrixWorld(true);
  }

  update(dt, t, ctx) {
    for (const fn of this.updaters) fn(dt, t, ctx);
  }

  dispose() {
    this.services.collision.removeOwner(this.colliderOwner);
    for (const s of this.spots) this.services.lights.remove(s);
    for (const o of this.interactables) this.services.interaction.remove(o);
    for (const o of this.blockers) this.services.interaction.removeBlocker(o);
    for (const g of this.disposables) g.dispose();
    if (this.fillerMesh) this.fillerMesh.dispose();
    this.group.removeFromParent();
  }
}

export class Frame {
  constructor(kit, matrix, rotY) {
    this.kit = kit;
    this.matrix = matrix;  // lokal → Kit-Gruppe
    this.rotY = rotY;
  }

  frame(at = [0, 0, 0], rotY = 0) {
    const m = new THREE.Matrix4().compose(_v.set(...at), _q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rotY), _s.set(1, 1, 1));
    return new Frame(this.kit, this.matrix.clone().multiply(m), this.rotY + rotY);
  }

  _local(at, rot, scale) {
    _e.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
    _q.setFromEuler(_e);
    if (typeof scale === 'number') _s.set(scale, scale, scale); else _s.set(...(scale || [1, 1, 1]));
    _m.compose(_v.set(...at), _q, _s);
    return this.matrix.clone().multiply(_m);
  }

  /** Statische Geometrie (wird gemergt). */
  add(geo, material, at = [0, 0, 0], rot = [0, 0, 0], scale = 1) {
    this.kit._addGeo(geo, material, this._local(at, rot, scale));
    return this;
  }

  /** Dynamisches Objekt (eigenes Mesh, kann animiert werden). */
  object(obj, at = [0, 0, 0], rot = [0, 0, 0], scale = 1) {
    obj.applyMatrix4(this._local(at, rot, scale));
    this.kit.group.add(obj);
    return obj;
  }

  mesh(geo, material, at, rot, scale) {
    return this.object(new THREE.Mesh(geo, mat(material)), at, rot, scale);
  }

  /** Lokale Koordinate → Kit-lokal (Vector3). */
  point(x, y, z) { return _v.set(x, y, z).applyMatrix4(this.matrix).clone(); }

  /** Lokale Koordinate → Welt. */
  world(x, y, z) { return this.point(x, y, z).add(this.kit.origin); }

  /** Kollisionsbox (lokal zentriert bei x,z mit Breite w (x) und Tiefe d (z)). */
  collider(x, z, w, d, { shadow = true } = {}) {
    // Kollision ist 2D: Dinge über Kopfhöhe (Galerie-Regale, Wandbretter) blockieren nicht.
    const base = this.point(x, 0, z).y;
    if (base > 1.5) return this;
    // Weicher Kontaktschatten unter allem, was auf dem Boden steht (gemergt → kaum Kosten).
    if (shadow && Math.abs(base) < 0.05) {
      const pad = Math.min(0.6, 0.25 + 0.15 * Math.min(w, d));
      this.add(new THREE.PlaneGeometry(w + pad, d + pad), 'contactShadow', [x, 0.022, z], [-Math.PI / 2, 0, 0]);
    }
    const corners = [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const [cx, cz] of corners) {
      const p = this.point(x + cx, 0, z + cz);
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    this.kit._collider(minX, maxX, minZ, maxZ);
    return this;
  }

  /** Lichtpunkt für den Licht-Pool. */
  light(at, { color = '#ffb36b', intensity = 6, distance = 8, flicker = false, priority = 0, onUpdate, pool = true } = {}) {
    const spot = { pos: this.world(...at), color, intensity, distance, flicker, priority, room: this.kit.room?.id ?? this.kit.id, onUpdate };
    // Gemalter Lichtkegel auf dem Boden unter hängenden Lampen: hält entfernte Bereiche warm,
    // auch wenn gerade keine echte Lichtquelle aus dem Pool dort ist.
    const p = this.point(...at);
    if (pool && p.y > 2.2) {
      const r = Math.min(distance * 0.42, 4.5);
      this.kit._addGeo(new THREE.PlaneGeometry(r * 2, r * 2), 'lightPool',
        new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(p.x, 0.03, p.z));
    }
    this.kit.spots.push(spot);
    return spot;
  }

  /** Leuchtender Halo (Sprite, additiv). */
  glow(at, { color = '#ffbb66', size = 0.6, opacity = 0.7 } = {}) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex.glow(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    s.scale.set(size, size, size);
    s.position.copy(this.point(...at));
    this.kit.group.add(s);
    return s;
  }

  /** Macht ein Objekt interaktiv. opts: { label, verb, onInteract, secret, range } */
  interactable(obj, opts) {
    const kit = this.kit;
    const ia = { ...opts };
    if (opts.secret) {
      const secrets = kit.services.secrets;
      secrets.register(opts.secret, opts.secretName ?? opts.label, kit.room?.id);
      const orig = opts.onInteract;
      ia.onInteract = (hit) => { orig?.(hit); secrets.found(opts.secret); };
    }
    obj.userData.interact = ia;
    kit.interactables.push(obj);
    return obj;
  }

  /** Unsichtbare Hitbox für Interaktion. */
  hitbox(at, size, opts) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat('invisible'));
    m.userData.hitbox = true;
    this.object(m, at);
    return this.interactable(m, opts);
  }

  /** Füllbuch (instanziert). Matrix lokal: Buch-Mittelpunkt, Maße w(Dicke) h d. */
  filler(at, size, color, seed, rot = [0, 0, 0]) {
    const m = this._local(at, rot, size);
    this.kit.fillers.push({ matrix: m, color, seed, at: this.point(...at), rotY: this.rotY + (rot[1] || 0) });
  }

  /** Prop aus der Registry platzieren. */
  place(name, opts = {}) {
    const prop = this.kit.services.props.get(name);
    if (!prop) { console.warn(`[kit] Prop unbekannt: ${name}`); return null; }
    const f = this.frame(opts.at ?? [0, 0, 0], opts.rot ?? 0);
    return prop.create(f, opts, this.kit);
  }
}
