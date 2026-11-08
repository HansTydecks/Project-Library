// Prozedurale Klänge per WebAudio – keine Audiodateien. Standardmäßig aus (Taste M).
export function createAudio() {
  let ctx = null, master = null, ambient = null, crickets = null;
  let enabled = false;
  let outdoor = 0;
  try { enabled = localStorage.getItem('bib:sound') === '1'; } catch { /* */ }

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination);
    // Raumton: braunes Rauschen, tiefpassgefiltert
    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
    ambient = ctx.createGain(); ambient.gain.value = 0.12;
    src.connect(lp).connect(ambient).connect(master); src.start();
    // Grillen draußen
    crickets = ctx.createGain(); crickets.gain.value = 0; crickets.connect(master);
    const osc = ctx.createOscillator(); osc.frequency.value = 4400;
    const am = ctx.createOscillator(); am.frequency.value = 28;
    const amG = ctx.createGain(); amG.gain.value = 0.5;
    const cg = ctx.createGain(); cg.gain.value = 0.5;
    am.connect(amG).connect(cg.gain);
    const chirp = ctx.createOscillator(); chirp.frequency.value = 0.7; chirp.type = 'square';
    const chirpG = ctx.createGain(); chirpG.gain.value = 0.5;
    chirp.connect(chirpG).connect(cg.gain);
    osc.connect(cg).connect(crickets);
    osc.start(); am.start(); chirp.start();
    return true;
  }

  function noise(dur, { freq = 1000, q = 1, type = 'bandpass', gain = 0.3, attack = 0.005 } = {}) {
    const n = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = n;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(master); s.start();
  }

  function tone(freq, dur, { type = 'sine', gain = 0.2, delay = 0, glide } = {}) {
    const o = ctx.createOscillator(); o.type = type;
    const g = ctx.createGain();
    const t = ctx.currentTime + delay;
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
  }

  const sounds = {
    step: () => noise(0.09, { freq: outdoor > 0.5 ? 2200 : 500, q: 0.8, gain: 0.12 }),
    page: () => noise(0.35, { freq: 3000, q: 0.5, gain: 0.12, attack: 0.08 }),
    purr: () => { for (let i = 0; i < 12; i++) noise(0.12, { freq: 120, q: 2, type: 'lowpass', gain: 0.25 }); for (let i = 0; i < 10; i++) tone(26, 0.25, { gain: 0.15, delay: i * 0.25, type: 'sawtooth' }); },
    hoot: () => { tone(420, 0.35, { glide: 380, gain: 0.2 }); tone(400, 0.6, { glide: 340, gain: 0.2, delay: 0.45 }); },
    tick: () => { noise(0.03, { freq: 4000, q: 4, gain: 0.3 }); setTimeout(() => noise(0.03, { freq: 3000, q: 4, gain: 0.25 }), 500); },
    bell: () => { tone(1320, 1.6, { gain: 0.18 }); tone(2640, 1.0, { gain: 0.06 }); tone(1980, 1.2, { gain: 0.05 }); },
    chime: () => [0, 4, 7, 12].forEach((s, i) => tone(660 * 2 ** (s / 12), 1.2, { gain: 0.1, delay: i * 0.09 })),
    secret: () => [0, 7, 12, 16, 19].forEach((s, i) => tone(523 * 2 ** (s / 12), 1.5, { gain: 0.09, delay: i * 0.07, type: 'triangle' })),
    whoosh: () => noise(0.8, { freq: 600, q: 0.6, gain: 0.25, attack: 0.2 }),
    type: () => { for (let i = 0; i < 8; i++) setTimeout(() => noise(0.03, { freq: 2500, q: 3, gain: 0.25 }), i * 90 + Math.random() * 40); },
    knock: () => [0, 180, 360].forEach((d) => setTimeout(() => noise(0.08, { freq: 180, q: 3, gain: 0.5, type: 'lowpass' }), d)),
    splash: () => noise(0.6, { freq: 1800, q: 0.7, gain: 0.25, attack: 0.01 }),
    magic: () => [0, 3, 7, 10, 14].forEach((s, i) => tone(392 * 2 ** (s / 12), 0.9, { gain: 0.07, delay: i * 0.05, type: 'sine' })),
    jump: () => tone(300, 0.18, { glide: 520, gain: 0.07, type: 'triangle' }),
    sparkleJump: () => [0, 5, 9, 14].forEach((st, i) => tone(784 * 2 ** (st / 12), 0.35, { gain: 0.05, delay: i * 0.035 })),
    land: () => noise(0.08, { freq: outdoor > 0.5 ? 1500 : 350, q: 0.8, gain: 0.16 }),
    thud: () => { noise(0.18, { freq: 180, q: 0.8, gain: 0.3, type: 'lowpass' }); tone(70, 0.2, { gain: 0.15 }); },
    boing: () => { tone(160, 0.5, { glide: 640, gain: 0.14, type: 'sine' }); tone(330, 0.35, { glide: 900, gain: 0.05, type: 'triangle', delay: 0.04 }); },
    bubble: () => { for (let i = 0; i < 6; i++) tone(300 + Math.random() * 500, 0.12, { glide: 900 + Math.random() * 600, gain: 0.05, delay: i * 0.08 + Math.random() * 0.05 }); },
    pop: () => { noise(0.05, { freq: 1200, q: 2, gain: 0.25 }); tone(880, 0.12, { glide: 1400, gain: 0.06 }); },
    quack: () => { tone(520, 0.14, { glide: 380, type: 'sawtooth', gain: 0.07 }); tone(500, 0.16, { glide: 360, type: 'sawtooth', gain: 0.07, delay: 0.18 }); },
    slurp: () => noise(0.5, { freq: 700, q: 3, gain: 0.15, attack: 0.1 }),
    snore: () => { noise(1.2, { freq: 260, q: 1.5, gain: 0.12, attack: 0.5 }); },
    note: () => tone(523 * 2 ** (Math.floor(Math.random() * 8) * 2 / 12), 0.8, { type: 'triangle', gain: 0.1 }),
    musicbox: () => {
      const notes = [12, 7, 4, 7, 12, 14, 16, 14, 12, 7, 9, 7, 4, 2, 0];
      notes.forEach((st, i) => { tone(523 * 2 ** (st / 12), 0.9, { gain: 0.07, delay: i * 0.22 }); tone(1046 * 2 ** (st / 12), 0.4, { gain: 0.02, delay: i * 0.22 }); });
    },
    piano: () => {
      const notes = [0, 4, 7, 12, 7, 4, 5, 9, 12, 17, 12, 9, 7, 11, 14, 19, 14, 11, 12];
      notes.forEach((st, i) => tone(262 * 2 ** (st / 12), 0.7, { gain: 0.09, delay: i * 0.16, type: 'triangle' }));
    },
    cuckoo: () => { tone(740, 0.22, { gain: 0.1, type: 'triangle' }); tone(587, 0.35, { gain: 0.1, type: 'triangle', delay: 0.28 }); },
    crackle: () => { for (let i = 0; i < 10; i++) setTimeout(() => noise(0.03, { freq: 1500 + Math.random() * 2500, q: 2, gain: 0.08 }), Math.random() * 900); },
    choo: () => { noise(0.5, { freq: 900, q: 1.2, gain: 0.12, attack: 0.05 }); tone(460, 0.5, { gain: 0.05, type: 'square' }); tone(580, 0.5, { gain: 0.04, type: 'square' }); },
    sing: () => {
      const notes = [0, 2, 4, 5, 7, 9, 7, 4, 0];
      notes.forEach((st, i) => tone(659 * 2 ** (st / 12), 0.35, { gain: 0.07, delay: i * 0.18, type: 'sine' }));
    },
    tickTock: () => { for (let i = 0; i < 4; i++) setTimeout(() => noise(0.03, { freq: i % 2 ? 2400 : 3200, q: 5, gain: 0.25 }), i * 500); },
    melody: () => {
      const notes = [0, 4, 7, 9, 7, 4, 2, 4, 0, -3, 0];
      notes.forEach((s, i) => { tone(392 * 2 ** (s / 12), 0.5, { gain: 0.1, delay: i * 0.35, type: 'triangle' }); });
      for (let i = 0; i < 20; i++) setTimeout(() => noise(0.02, { freq: 5000, q: 1, gain: 0.03 }), i * 200 + Math.random() * 100);
    },
  };

  return {
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem('bib:sound', enabled ? '1' : '0'); } catch { /* */ }
      if (enabled && ensure()) ctx.resume();
      else if (ctx) ctx.suspend();
      return enabled;
    },
    unlock() { if (enabled && ensure()) ctx.resume(); },
    play(name) {
      if (!enabled || !ensure() || ctx.state !== 'running') return;
      sounds[name]?.();
    },
    setOutdoor(v) {
      outdoor = v;
      if (!ctx) return;
      crickets.gain.setTargetAtTime(enabled ? v * 0.015 : 0, ctx.currentTime, 0.8);
      ambient.gain.setTargetAtTime(0.12 * (1 - v * 0.6), ctx.currentTime, 0.8);
    },
  };
}
