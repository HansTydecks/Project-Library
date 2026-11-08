import * as THREE from 'three';
import { defineProp } from '../world/registry.js';
import { mat } from '../world/materials.js';
import { tex } from '../world/textures.js';

// Der Bibliothekar. Aus Primitiven gebaut: Robe, Sternenhut, Bart, Stab mit Orb.
export default defineProp({
  name: 'wizard',
  create(f, opts, kit) {
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);
    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.5, 16, 1, true), mat('robe'));
    robe.position.y = 0.75; body.add(robe);
    const robeBottom = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), mat('robe')); robeBottom.rotation.x = Math.PI / 2; robeBottom.position.y = 0.01; body.add(robeBottom);
    const trim = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.03, 6, 24), mat('robeTrim')); trim.rotation.x = Math.PI / 2; trim.position.y = 0.06; body.add(trim);
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), mat('robe')); chest.scale.set(1, 1.1, 0.85); chest.position.y = 1.35; body.add(chest);
    // Sterne auf der Robe
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), mat('robeTrim'));
      const a = Math.random() * Math.PI * 2, y = 0.3 + Math.random() * 1.0;
      const r = 0.55 * (1 - y / 1.5) + 0.01;
      s.position.set(Math.sin(a) * r, y, Math.cos(a) * r); body.add(s);
    }
    const head = new THREE.Group(); head.position.y = 1.72; body.add(head);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), mat('skin')); head.add(face);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat('skin')); nose.position.set(0, -0.01, 0.17); nose.scale.set(1, 1.2, 1); head.add(nose);
    const eyes = [];
    for (const x of [-0.06, 0.06]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), mat('black')); e.position.set(x, 0.04, 0.15); head.add(e); eyes.push(e);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.03), mat('beard')); brow.position.set(x, 0.085, 0.15); brow.rotation.z = x > 0 ? -0.2 : 0.2; head.add(brow);
    }
    // Brille
    for (const x of [-0.06, 0.06]) {
      const g = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.006, 4, 14), mat('brass')); g.position.set(x, 0.04, 0.17); head.add(g);
    }
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.6, 12), mat('beard'));
    beard.rotation.x = Math.PI; beard.position.set(0, -0.3, 0.07); head.add(beard);
    const moustache = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 10, Math.PI), mat('beard')); moustache.position.set(0, -0.06, 0.16); moustache.rotation.z = Math.PI; head.add(moustache);
    // Hut
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 20), mat('robe')); brim.position.y = 0.13; head.add(brim);
    const hat = new THREE.Group(); hat.position.y = 0.14; head.add(hat);
    const segs = 5;
    let y = 0, r = 0.2, tilt = 0;
    for (let i = 0; i < segs; i++) {
      const h = 0.16;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.78, r, h, 14), mat('robe'));
      c.position.set(Math.sin(tilt) * 0.0 + i * i * 0.012, y + h / 2, 0); c.rotation.z = -i * 0.12; hat.add(c);
      y += h * 0.95; r *= 0.78; tilt += 0.1;
    }
    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), mat('gold')); tip.position.set(0.22, y + 0.02, 0); hat.add(tip);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.02, 4, 16), mat('robeTrim')); band.rotation.x = Math.PI / 2; band.position.y = 0.04; hat.add(band);
    // Arme + Stab
    for (const sx of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.6, 8), mat('robe'));
      arm.position.set(sx * 0.3, 1.2, 0.12); arm.rotation.set(-0.6, 0, sx * 0.35); body.add(arm);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat('skin')); hand.position.set(sx * 0.4, 0.98, 0.32); body.add(hand);
    }
    const staff = new THREE.Group(); staff.position.set(0.55, 0, 0.25); root.add(staff);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 2.1, 6), mat('woodDark')); pole.position.y = 1.05; staff.add(pole);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshBasicMaterial({ color: '#9ad0ff' })); orb.position.y = 2.15; staff.add(orb);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.glow(), color: '#7ab8ff', transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.setScalar(0.9); halo.position.y = 2.15; staff.add(halo);
    for (let i = 0; i < 3; i++) {
      const prong = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 4, 10, Math.PI), mat('brass'));
      prong.position.y = 2.15; prong.rotation.y = (i / 3) * Math.PI; staff.add(prong);
    }

    f.object(root, [0, 0, 0]);
    f.collider(0, 0, 1.2, 1.0);
    f.light([0.55, 2.2, 0.5], { color: '#8ab8ff', intensity: 4, distance: 6, priority: 2 });

    const wp = new THREE.Vector3();
    let talk = 0, wave = 0, blinkT = 2;
    kit.onUpdate((dt, t, ctx) => {
      body.position.y = Math.sin(t * 1.2) * 0.015;
      chest.scale.y = 1.1 + Math.sin(t * 1.2) * 0.02;
      orb.material.color.setHSL(0.58 + Math.sin(t * 0.5) * 0.05, 0.8, 0.75 + Math.sin(t * 2) * 0.05);
      halo.material.opacity = 0.55 + Math.sin(t * 2) * 0.15;
      staff.rotation.z = Math.sin(t * 0.7) * 0.03;
      // Kopf folgt dem Besucher
      root.getWorldPosition(wp);
      const dx = ctx.player.x - wp.x, dz = ctx.player.z - wp.z;
      const dist = Math.hypot(dx, dz);
      let target = Math.atan2(dx, dz) - root.rotation.y;
      while (target > Math.PI) target -= Math.PI * 2; while (target < -Math.PI) target += Math.PI * 2;
      target = dist < 12 ? Math.max(-1.1, Math.min(1.1, target)) : 0;
      head.rotation.y += (target - head.rotation.y) * Math.min(1, dt * 3);
      head.rotation.x = talk > 0 ? Math.sin(t * 9) * 0.05 : Math.sin(t * 0.6) * 0.03;
      talk = Math.max(0, talk - dt);
      if (wave > 0) { wave -= dt; staff.rotation.z = Math.sin(wave * 10) * 0.2; }
      blinkT -= dt;
      const blink = blinkT < 0.12 && blinkT > 0;
      for (const e of eyes) e.scale.y = blink ? 0.1 : 1;
      if (blinkT < 0) blinkT = 2 + Math.random() * 4;
    });

    const api = {
      talk(sec = 2) { talk = sec; },
      wave() { wave = 1.2; },
      orbWorld() { return orb.getWorldPosition(new THREE.Vector3()); },
    };
    kit.services.wizard = api;
    // Großzügige Hitbox, die über den Tresen reicht
    f.hitbox([0, 1.3, 1.0], [3.0, 2.6, 3.4], {
      label: 'Der Bibliothekar', verb: 'Ansprechen', range: 5,
      onInteract: () => kit.services.events.emit('summonWizard'),
    });
    return api;
  },
});
