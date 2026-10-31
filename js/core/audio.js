// Vesperal — motor de áudio: síntese, sequenciador musical, efeitos e ambientes (Web Audio API)
'use strict';
(function (VS) {
  const U = VS.U;
  const A = {
    ctx: null, ready: false, buses: {}, current: null, currentId: null, intensity: 0,
    pendingMusic: null, pendingAmb: null, ambId: null, amb: null, overrides: {},
    vol: { master: 0.8, music: 0.7, sfx: 0.8, amb: 0.6 }, mute: { music: false, sfx: false, amb: false },
    lastSfx: {}, voices: 0, fallbackStart: performance.now(),
  };
  let c = null, noiseBuf = null;

  // ---------- utilidades ----------
  const NOTE_IDX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  A.noteFreq = function (n) {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
    if (!m) return 0;
    let semi = NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const midi = (parseInt(m[3], 10) + 1) * 12 + semi;
    return 440 * Math.pow(2, (midi - 69) / 12);
  };
  function makeNoise() {
    const len = c.sampleRate * 2;
    const b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function makeIR(seconds, decay) {
    const rate = c.sampleRate, len = Math.floor(rate * seconds);
    const b = c.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        // reflexões iniciais + cauda difusa
        const early = i < rate * 0.08 && Math.random() < 0.004 ? (Math.random() * 2 - 1) * 0.8 : 0;
        d[i] = ((Math.random() * 2 - 1) * Math.pow(1 - t, decay) + early) * 0.6;
      }
    }
    return b;
  }
  function noiseSrc(t, dur) {
    const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
    return s;
  }
  function gainNode(v) { const g = c.createGain(); g.gain.value = v; return g; }
  function filt(type, f, q) { const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; if (q !== undefined) fl.Q.value = q; return fl; }
  function osc(type, f, t, end) { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(end); return o; }
  // envelope ADSR — devolve tempo final
  function env(g, t, dur, a, s, r, peak) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    if (s < 1) g.gain.setTargetAtTime(peak * s, t + a, Math.max(0.02, dur * 0.3));
    const rel = t + Math.max(dur, a + 0.01);
    g.gain.setTargetAtTime(0.0001, rel, r / 4);
    return rel + r + 0.05;
  }
  function percEnv(g, t, peak, decay, attack) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + (attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + (attack || 0.004) + decay);
    return t + decay + 0.06;
  }
  function vibrato(target, t, end, rate, depth, delay) {
    const l = osc('sine', rate, t, end); const lg = gainNode(0);
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(depth, t + (delay || 0.3));
    l.connect(lg); lg.connect(target);
  }

  // ---------- instrumentos ----------
  const INST = {};
  INST.organ = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const end = env(g, t, dur, 0.04, 0.92, 0.3, v * 0.16);
    [[1, 1], [2, 0.5], [3, 0.32], [4, 0.2], [6, 0.08], [0.5, 0.35]].forEach(([m, a]) => {
      const o = osc('sine', f * m, t, end); const og = gainNode(a); o.connect(og); og.connect(g);
    });
  };
  function formantVoice(d, t, f, dur, v, f1, f2, peak, att, rel) {
    const g = gainNode(0); d && g.connect(d);
    const end = env(g, t, dur, att, 0.9, rel, v * peak);
    const lp = filt('lowpass', 2600, 0.5);
    const b1 = filt('bandpass', f1, 5), b2 = filt('bandpass', f2, 7), b3 = filt('bandpass', 2600, 9);
    const g1 = gainNode(1), g2 = gainNode(0.6), g3 = gainNode(0.25);
    [-9, 0, 8].forEach((det) => {
      const o = osc('sawtooth', f, t, end); o.detune.value = det;
      vibrato(o.detune, t, end, 4.6 + Math.random(), 9, 0.4);
      o.connect(lp);
    });
    lp.connect(b1); lp.connect(b2); lp.connect(b3);
    b1.connect(g1); b2.connect(g2); b3.connect(g3); g1.connect(g); g2.connect(g); g3.connect(g);
    return g;
  }
  INST.choir = (d, t, f, dur, v) => formantVoice(d, t, f, dur, v, 750, 1150, 0.5, 0.45, 1.0);
  INST.choirlow = (d, t, f, dur, v) => formantVoice(d, t, f, dur, v, 420, 820, 0.6, 0.5, 1.2);
  INST.strings = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const end = env(g, t, dur, 0.28, 0.85, 0.6, v * 0.075);
    const lp = filt('lowpass', Math.min(4200, f * 5), 0.6); lp.connect(g);
    [-7, 0, 6].forEach((det) => { const o = osc('sawtooth', f, t, end); o.detune.value = det; vibrato(o.detune, t, end, 5.2, 7, 0.35); o.connect(lp); });
  };
  INST.cello = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const end = env(g, t, dur, 0.18, 0.85, 0.5, v * 0.11);
    const lp = filt('lowpass', Math.min(2000, f * 3.2), 0.8); lp.connect(g);
    [-5, 4].forEach((det) => { const o = osc('sawtooth', f, t, end); o.detune.value = det; vibrato(o.detune, t, end, 5, 8, 0.25); o.connect(lp); });
  };
  INST.brass = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const end = env(g, t, dur, 0.06, 0.8, 0.25, v * 0.09);
    const lp = filt('lowpass', f * 1.5, 1.5); lp.connect(g);
    lp.frequency.setValueAtTime(f * 1.2, t); lp.frequency.linearRampToValueAtTime(Math.min(5000, f * 6), t + 0.12); lp.frequency.setTargetAtTime(f * 3, t + 0.15, 0.2);
    [-4, 4].forEach((det) => { const o = osc('sawtooth', f, t, end); o.detune.value = det; o.connect(lp); });
  };
  INST.bell = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const len = Math.max(2.2, dur * 1.5);
    const end = percEnv(g, t, v * 0.16, len, 0.003);
    const car = osc('sine', f, t, end); const mod = osc('sine', f * 2.76, t, end); const mg = gainNode(0);
    mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.05 + 1, t + len * 0.7);
    mod.connect(mg); mg.connect(car.frequency); car.connect(g);
    const o2 = osc('sine', f * 2.01, t, end); const g2 = gainNode(0.2); o2.connect(g2); g2.connect(g);
  };
  INST.bigbell = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const end = percEnv(g, t, v * 0.22, 6, 0.004);
    [[1, 1], [2.0, 0.6], [2.4, 0.4], [3.0, 0.3], [4.2, 0.2], [0.5, 0.5]].forEach(([m, a]) => {
      const o = osc('sine', f * m, t, end); const og = gainNode(a); o.connect(og); og.connect(g);
    });
  };
  INST.glass = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const end = env(g, t, dur, 0.12, 0.7, 1.2, v * 0.1);
    const o = osc('sine', f, t, end); const o2 = osc('sine', f * 2.005, t, end); const g2 = gainNode(0.3);
    o.connect(g); o2.connect(g2); g2.connect(g);
    const trem = osc('sine', 6, t, end); const tg = gainNode(v * 0.03); trem.connect(tg); tg.connect(g.gain);
  };
  INST.harp = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const end = percEnv(g, t, v * 0.2, 1.6, 0.003);
    const lp = filt('lowpass', f * 6, 0.5); lp.connect(g);
    lp.frequency.setValueAtTime(f * 8, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + 1.2);
    const o = osc('triangle', f, t, end); o.connect(lp);
    const o2 = osc('sine', f * 2, t, end); const g2 = gainNode(0.25); o2.connect(g2); g2.connect(lp);
  };
  INST.lute = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const end = percEnv(g, t, v * 0.13, 0.9, 0.002);
    const lp = filt('lowpass', 3200, 2); lp.connect(g);
    lp.frequency.setValueAtTime(3600, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.35);
    const o = osc('sawtooth', f, t, end); o.connect(lp);
    const o2 = osc('square', f * 1.003, t, end); const g2 = gainNode(0.3); o2.connect(g2); g2.connect(lp);
  };
  INST.piano = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const len = Math.min(3.5, 1.2 + dur);
    const end = percEnv(g, t, v * 0.17, len, 0.004);
    [[1, 1, 'triangle'], [2, 0.3, 'sine'], [3, 0.12, 'sine'], [4, 0.06, 'sine']].forEach(([m, a, ty]) => {
      const o = osc(ty, f * m, t, end); const og = gainNode(a); o.connect(og); og.connect(g);
    });
    const r = t + dur + 0.05; if (r < end) g.gain.setTargetAtTime(0.0001, r, 0.12);
  };
  INST.flute = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const end = env(g, t, dur, 0.09, 0.85, 0.2, v * 0.11);
    const o = osc('sine', f, t, end); vibrato(o.frequency, t, end, 5.4, f * 0.006, 0.25); o.connect(g);
    const o3 = osc('sine', f * 2, t, end); const g3 = gainNode(0.08); o3.connect(g3); g3.connect(g);
    const n = noiseSrc(t, end - t); const bp = filt('bandpass', f, 10); const ng = gainNode(0.25); n.connect(bp); bp.connect(ng); ng.connect(g);
  };
  INST.bass = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const end = env(g, t, dur, 0.02, 0.8, 0.2, v * 0.24);
    const lp = filt('lowpass', 700, 0.8); lp.connect(g);
    const o = osc('triangle', f, t, end); o.connect(lp);
    const o2 = osc('sawtooth', f, t, end); const g2 = gainNode(0.25); o2.connect(g2); g2.connect(lp);
  };
  INST.drone = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const end = env(g, t, dur, 1.2, 1, 2, v * 0.09);
    const lp = filt('lowpass', 380, 1.5); lp.connect(g);
    const l = osc('sine', 0.12, t, end); const lg = gainNode(160); l.connect(lg); lg.connect(lp.frequency);
    [f, f * 1.004, f * 2.002].forEach((ff, i) => { const o = osc('sawtooth', ff, t, end); const og = gainNode(i === 2 ? 0.3 : 1); o.connect(og); og.connect(lp); });
  };
  INST.pad = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const end = env(g, t, dur, 0.7, 0.9, 1.5, v * 0.07);
    const lp = filt('lowpass', 1400, 0.7); lp.connect(g);
    [-10, 0, 10].forEach((det) => { const o = osc('triangle', f, t, end); o.detune.value = det; o.connect(lp); });
    const o = osc('sawtooth', f / 2, t, end); const og = gainNode(0.25); o.connect(og); og.connect(lp);
  };
  INST.timp = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const end = percEnv(g, t, v * 0.5, 1.1, 0.003);
    const o = osc('sine', f * 1.5, t, end); o.frequency.exponentialRampToValueAtTime(f, t + 0.08); o.connect(g);
    const n = noiseSrc(t, 0.3); const lp = filt('lowpass', 400); const ng = gainNode(0); percEnv(ng, t, v * 0.35, 0.2); n.connect(lp); lp.connect(ng); ng.connect(d);
  };
  INST.taiko = (d, t, f, dur, v) => {
    const g = gainNode(0); g.connect(d);
    const end = percEnv(g, t, v * 0.75, 0.55, 0.002);
    const o = osc('sine', 120, t, end); o.frequency.exponentialRampToValueAtTime(42, t + 0.3); o.connect(g);
    const n = noiseSrc(t, 0.15); const lp = filt('lowpass', 900); const ng = gainNode(0); percEnv(ng, t, v * 0.3, 0.08); n.connect(lp); lp.connect(ng); ng.connect(d);
  };
  INST.snare = (d, t, f, dur, v) => {
    const n = noiseSrc(t, 0.25); const hp = filt('highpass', 1400); const g = gainNode(0); percEnv(g, t, v * 0.22, 0.16); n.connect(hp); hp.connect(g); g.connect(d);
    const o = osc('triangle', 190, t, t + 0.12); const og = gainNode(0); percEnv(og, t, v * 0.18, 0.08); o.connect(og); og.connect(d);
  };
  INST.hat = (d, t, f, dur, v) => {
    const n = noiseSrc(t, 0.1); const hp = filt('highpass', 7000); const g = gainNode(0); percEnv(g, t, v * 0.09, 0.045); n.connect(hp); hp.connect(g); g.connect(d);
  };
  INST.gong = (d, t, f, dur, v) => {
    const n = noiseSrc(t, 4.5); const bp = filt('bandpass', 320, 1.5); const g = gainNode(0); percEnv(g, t, v * 0.22, 4, 0.02); n.connect(bp); bp.connect(g); g.connect(d);
    const o = osc('sine', f || 82, t, t + 4); const og = gainNode(0); percEnv(og, t, v * 0.25, 3.5); o.connect(og); og.connect(d);
  };
  INST.heart = (d, t, f, dur, v) => {
    [0, 0.18].forEach((off, i) => {
      const g = gainNode(0); g.connect(d); const e = percEnv(g, t + off, v * (i ? 0.35 : 0.5), 0.25, 0.005);
      const o = osc('sine', 70, t + off, e); o.frequency.exponentialRampToValueAtTime(38, t + off + 0.2); o.connect(g);
    });
  };
  A.INST = INST;

  // ---------- notação musical ----------
  // "D4:2 F4 A4:0.5! r:1 D3+F3+A3:4"  (duração em tempos; ! = acento)
  A.parseNotes = function (str) {
    const out = [];
    str.split(/\s+/).forEach((tok) => {
      if (!tok || tok === '|') return;
      let accent = false;
      if (tok.endsWith('!')) { accent = true; tok = tok.slice(0, -1); }
      const [n, durS] = tok.split(':');
      const dur = durS ? parseFloat(durS) : 1;
      const notes = n === 'r' ? [] : n.split('+');
      out.push({ notes, dur, accent });
    });
    return out;
  };

  class Track {
    constructor(spec, id) {
      this.id = id; this.spec = spec; this.beatDur = 60 / spec.bpm;
      this.out = gainNode(0); this.out.connect(A.buses.music);
      this.parts = spec.parts.map((p) => {
        const events = A.parseNotes(p.notes);
        const len = events.reduce((s, e) => s + e.dur, 0);
        let dest = gainNode(p.vol !== undefined ? p.vol : 1);
        if (c.createStereoPanner && p.pan) { const pn = c.createStereoPanner(); pn.pan.value = p.pan; dest.connect(pn); pn.connect(this.out); } else dest.connect(this.out);
        return Object.assign({}, p, { events, len, idx: 0, next: 0, dest });
      });
      this.lengthBeats = Math.max(...this.parts.map((p) => p.len));
      this.stopped = false;
    }
    start(t) {
      this.startTime = t;
      this.parts.forEach((p) => { p.idx = 0; p.next = t + (p.delay || 0) * this.beatDur; });
      this.out.gain.setValueAtTime(0.0001, t);
      this.out.gain.linearRampToValueAtTime(1, t + (this.spec.fadeIn || 1.2));
    }
    schedule(until) {
      if (this.stopped) return;
      for (const p of this.parts) {
        if (!p.events.length || p.len <= 0) continue;
        let guard = 0;
        while (p.next < until && guard++ < 64) {
          const ev = p.events[p.idx];
          const on = A.intensity >= (p.minInt || 0) && A.intensity <= (p.maxInt === undefined ? 99 : p.maxInt);
          if (on && ev.notes.length) {
            const fn = INST[p.inst] || INST.organ;
            const v = (ev.accent ? 1 : 0.72) * (p.velocity || 1);
            const dur = ev.dur * this.beatDur * (p.legato || 0.95);
            const hum = p.humanize ? (Math.random() - 0.5) * p.humanize : 0;
            for (const n of ev.notes) {
              const f = A.noteFreq(n) * Math.pow(2, p.oct || 0);
              if (f > 0 && A.voices < 90) {
                A.voices++; setTimeout(() => A.voices--, (dur + 1.5) * 1000);
                try { fn(p.dest, Math.max(c.currentTime, p.next + hum), f, dur, v); } catch (e) { /* ignorar nota */ }
              }
            }
          }
          p.next += ev.dur * this.beatDur;
          p.idx = (p.idx + 1) % p.events.length;
        }
      }
    }
    stop(fade) {
      const t = c.currentTime;
      this.out.gain.cancelScheduledValues(t);
      this.out.gain.setValueAtTime(this.out.gain.value, t);
      this.out.gain.linearRampToValueAtTime(0.0001, t + (fade || 1.2));
      setTimeout(() => { this.stopped = true; try { this.out.disconnect(); } catch (e) { } }, (fade || 1.2) * 1000 + 200);
      this.stopping = true;
    }
  }

  // Faixa substituída por ficheiro áudio (ver js/data/audio_overrides.js)
  class FileTrack {
    constructor(url, id) {
      this.id = id; this.el = new Audio(url); this.el.loop = true; this.el.crossOrigin = 'anonymous';
      this.out = gainNode(0); this.out.connect(A.buses.music);
      try { this.src = c.createMediaElementSource(this.el); this.src.connect(this.out); } catch (e) { this.src = null; }
      this.beatDur = 0.5; this.stopped = false;
    }
    start(t) { this.startTime = t; this.out.gain.setValueAtTime(0.0001, t); this.out.gain.linearRampToValueAtTime(1, t + 1); this.el.play().catch(() => { this.failed = true; }); }
    schedule() { }
    stop(fade) { const t = c.currentTime; this.out.gain.setValueAtTime(this.out.gain.value, t); this.out.gain.linearRampToValueAtTime(0.0001, t + (fade || 1)); setTimeout(() => { this.el.pause(); this.stopped = true; }, (fade || 1) * 1000 + 100); }
  }

  // ---------- inicialização ----------
  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { A.ctx = c = new AC(); } catch (e) { return; }
    noiseBuf = makeNoise();
    A.master = gainNode(A.vol.master);
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -12; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
    A.master.connect(comp); comp.connect(c.destination);
    A.reverb = c.createConvolver(); A.reverb.buffer = makeIR(3.4, 2.4);
    const rg = gainNode(0.85); A.reverb.connect(rg); rg.connect(A.master);
    const sends = { music: 0.32, sfx: 0.14, amb: 0.35 };
    ['music', 'sfx', 'amb'].forEach((b) => {
      const g = gainNode(1); g.connect(A.master);
      const s = gainNode(sends[b]); g.connect(s); s.connect(A.reverb);
      A.buses[b] = g;
    });
    A.applyVolumes();
    A.ready = true;
    A.timer = setInterval(A.tick, 25);
    document.addEventListener('visibilitychange', () => { if (!c) return; if (document.hidden) c.suspend(); else c.resume(); });
    if (A.pendingMusic) { const p = A.pendingMusic; A.pendingMusic = null; A.playMusic(p.id, p.opts); }
    if (A.pendingAmb) { const p = A.pendingAmb; A.pendingAmb = null; A.setAmbience(p); }
  };

  A.setSettings = function (s) {
    A.vol = Object.assign({}, s.vol); A.mute = Object.assign({}, s.mute);
    A.applyVolumes();
  };
  A.applyVolumes = function () {
    if (!c) return;
    const t = c.currentTime;
    A.master.gain.setTargetAtTime(A.vol.master, t, 0.05);
    ['music', 'sfx', 'amb'].forEach((b) => A.buses[b].gain.setTargetAtTime(A.mute[b] ? 0 : A.vol[b], t, 0.05));
  };

  A.tick = function () {
    if (!c || c.state !== 'running') return;
    const until = c.currentTime + 0.15;
    if (A.current) A.current.schedule(until);
    if (A.old) { A.old.schedule(until); if (A.old.stopped) A.old = null; }
    if (A.amb) A.amb.tick(c.currentTime);
  };

  // ---------- música ----------
  A.playMusic = function (id, opts) {
    opts = opts || {};
    if (!c) { A.pendingMusic = { id, opts }; A.currentId = id; return; }
    if (A.currentId === id && A.current && !A.current.stopping && !opts.restart) return;
    if (A.current) { if (A.old) { A.old.stopped = true; try { A.old.out.disconnect(); } catch (e) { } } A.old = A.current; A.old.stop(opts.fade || 1.5); }
    A.current = null; A.currentId = id;
    if (!id) return;
    const spec = VS.MUSIC && VS.MUSIC[id];
    const url = (VS.AUDIO_OVERRIDES || {})[id];
    let tr;
    if (url) tr = new FileTrack(url, id);
    else if (spec) tr = new Track(spec, id);
    else { console.warn('música inexistente', id); return; }
    A.intensity = opts.intensity || 0;
    tr.start(c.currentTime + 0.08);
    A.current = tr;
  };
  A.stopMusic = function (fade) { A.playMusic(null, { fade }); };
  A.setIntensity = function (n) { A.intensity = n; };
  // posição em tempos da faixa atual (para chefes rítmicos)
  A.beat = function () {
    if (c && A.current && A.current.startTime !== undefined) return (c.currentTime - A.current.startTime) / A.current.beatDur;
    const spec = VS.MUSIC && VS.MUSIC[A.currentId];
    const bd = spec ? 60 / spec.bpm : 0.5;
    return (performance.now() - A.fallbackStart) / 1000 / bd;
  };
  A.beatDur = function () { if (A.current) return A.current.beatDur; const spec = VS.MUSIC && VS.MUSIC[A.currentId]; return spec ? 60 / spec.bpm : 0.5; };
  A.resetFallbackClock = function () { A.fallbackStart = performance.now(); };

  // pequena frase musical única (fanfarras, eventos)
  A.stinger = function (notes, inst, bpm, vol) {
    if (!c) return;
    const evs = A.parseNotes(notes); let t = c.currentTime + 0.03; const bd = 60 / (bpm || 100);
    const dest = gainNode(vol || 0.8); dest.connect(A.buses.music);
    evs.forEach((ev) => { ev.notes.forEach((n) => (INST[inst] || INST.bell)(dest, t, A.noteFreq(n), ev.dur * bd, ev.accent ? 1 : 0.75)); t += ev.dur * bd; });
  };

  // ---------- efeitos sonoros ----------
  const SFX = {};
  function out(vol, pan) {
    const g = gainNode(vol);
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = U.clamp(pan, -1, 1); g.connect(p); p.connect(A.buses.sfx); }
    else g.connect(A.buses.sfx);
    return g;
  }
  function nburst(d, t, type, f, q, peak, decay, attack) {
    const n = noiseSrc(t, decay + 0.1); const fl = filt(type, f, q); const g = gainNode(0); percEnv(g, t, peak, decay, attack); n.connect(fl); fl.connect(g); g.connect(d); return fl;
  }
  function tone(d, t, type, f0, f1, peak, decay, attack) {
    const g = gainNode(0); const e = percEnv(g, t, peak, decay, attack); const o = osc(type, f0, t, e);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + decay); o.connect(g); g.connect(d); return o;
  }
  // saturação suave (dá corpo e "peso" aos impactos) — uma curva por intensidade, guardada
  const shapeCurves = {};
  function sat(d, k, lvl) {
    const ws = c.createWaveShaper(); const key = k || 4;
    if (!shapeCurves[key]) { const n = 1024, cv = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; cv[i] = Math.tanh(key * x) / Math.tanh(key); } shapeCurves[key] = cv; }
    ws.curve = shapeCurves[key]; ws.oversample = '2x';
    if (lvl !== undefined && lvl !== 1) { const g = gainNode(lvl); ws.connect(g); g.connect(d); } else ws.connect(d);
    return ws;
  }
  // variação de afinação: nenhum golpe soa exatamente igual ao anterior
  const vr = (a) => 1 + (Math.random() - 0.5) * (a || 0.12);
  // envio para a reverberação (cauda curta própria dos impactos grandes)
  function verb(d, t, amt) { if (!A.reverb) return d; const g = gainNode(amt * (A.vol ? A.vol.sfx : 1)); g.connect(A.reverb); const m = gainNode(1); m.connect(d); m.connect(g); return m; }
  SFX.swing = (d, t) => { const v = vr(0.16); const f = nburst(d, t, 'bandpass', 650 * v, 1.1, 0.95, 0.18, 0.025); f.frequency.exponentialRampToValueAtTime(3800 * v, t + 0.13); nburst(d, t + 0.025, 'highpass', 5400, 0.7, 0.16, 0.09, 0.02); tone(d, t, 'sine', 300 * v, 180, 0.06, 0.1, 0.02); };
  SFX.swing_heavy = (d, t) => { const v = vr(0.1); const f = nburst(d, t, 'bandpass', 220 * v, 0.9, 0.95, 0.34, 0.07); f.frequency.exponentialRampToValueAtTime(1500 * v, t + 0.27); tone(d, t, 'sine', 96 * v, 52, 0.26, 0.3, 0.05); nburst(d, t + 0.06, 'lowpass', 480, 0.7, 0.22, 0.22, 0.05); };
  SFX.hit = (d, t) => { const v = vr(0.14), s2 = sat(d, 3, 0.55); nburst(d, t, 'highpass', 3200, 0.7, 0.28, 0.022, 0.001); tone(s2, t, 'sine', 196 * v, 50, 0.72, 0.13, 0.002); nburst(s2, t + 0.003, 'bandpass', 1500 * v, 1.4, 0.42, 0.075, 0.002); nburst(d, t + 0.01, 'lowpass', 760, 0.8, 0.2, 0.12, 0.004); };
  SFX.hit_heavy = (d, t) => { const v = vr(0.08), s2 = sat(verb(d, t, 0.25), 5, 0.62); nburst(d, t, 'highpass', 2600, 0.7, 0.38, 0.03, 0.001); tone(s2, t, 'sine', 150 * v, 32, 1.0, 0.27, 0.002); tone(s2, t, 'triangle', 300 * v, 78, 0.3, 0.12, 0.002); nburst(s2, t + 0.004, 'bandpass', 1100 * v, 1.2, 0.56, 0.16, 0.002); nburst(d, t + 0.02, 'lowpass', 420, 0.7, 0.34, 0.32, 0.01); };
  // armas e materiais
  SFX.swing_light = (d, t) => { const v = vr(0.18); const f = nburst(d, t, 'bandpass', 1500 * v, 1.6, 0.72, 0.09, 0.012); f.frequency.exponentialRampToValueAtTime(6000 * v, t + 0.07); nburst(d, t + 0.02, 'highpass', 7000, 0.7, 0.12, 0.05, 0.01); };
  SFX.spirit_swing = (d, t) => { const f = nburst(d, t, 'bandpass', 700, 2, 0.3, 0.22, 0.03); f.frequency.exponentialRampToValueAtTime(2600, t + 0.18); INST.glass(d, t + 0.02, 1320 + Math.random() * 120, 0.12, 0.5); };
  SFX.swing_royal = (d, t) => { const f = nburst(d, t, 'bandpass', 240, 0.9, 0.55, 0.34, 0.07); f.frequency.exponentialRampToValueAtTime(1100, t + 0.3); tone(d, t, 'sine', 70, 48, 0.2, 0.32); SFX.fire(d, t + 0.05); };
  SFX.hit_metal = (d, t) => { const v = vr(0.1); tone(d, t, 'square', 1250 * v, 900, 0.07, 0.18); tone(d, t, 'triangle', 2650 * v, 2100, 0.06, 0.32); tone(d, t, 'sine', 4100 * v, 3900, 0.03, 0.4); nburst(d, t, 'highpass', 5000, 1, 0.24, 0.07); };
  SFX.hit_stone = (d, t) => { nburst(d, t, 'lowpass', 1400, 1, 0.45, 0.1); for (let i = 0; i < 3; i++) nburst(d, t + 0.02 + i * 0.03, 'bandpass', 2400 + Math.random() * 1200, 3, 0.12, 0.04); };
  SFX.hit_spirit = (d, t) => { INST.glass(d, t, 1760 * (1 + Math.random() * 0.06), 0.25, 0.5); const f = nburst(d, t, 'bandpass', 1800, 3, 0.18, 0.3, 0.02); f.frequency.exponentialRampToValueAtTime(600, t + 0.3); };
  SFX.hit_glass = (d, t) => { for (let i = 0; i < 4; i++) tone(d, t + Math.random() * 0.06, 'sine', 3000 + Math.random() * 3000, 2400, 0.05, 0.16); nburst(d, t, 'highpass', 4500, 1, 0.2, 0.1); };
  SFX.hit_soft = (d, t) => { nburst(d, t, 'lowpass', 900, 0.8, 0.35, 0.09); tone(d, t, 'sine', 140, 80, 0.2, 0.08); };
  SFX.hit_wood = (d, t) => { nburst(d, t, 'bandpass', 900, 3, 0.4, 0.07); tone(d, t, 'triangle', 220, 160, 0.2, 0.08); };
  SFX.hit_blunt = (d, t) => { const v = vr(0.08), s2 = sat(d, 6, 0.5); tone(s2, t, 'sine', 92 * v, 36, 0.95, 0.26, 0.002); nburst(s2, t, 'lowpass', 760, 0.8, 0.62, 0.18, 0.002); for (let i = 0; i < 3; i++) nburst(d, t + 0.02 + i * 0.03, 'bandpass', 1800 + Math.random() * 1400, 3, 0.12, 0.04, 0.002); };
  SFX.equip = (d, t) => { tone(d, t, 'triangle', 700, 520, 0.08, 0.08); nburst(d, t + 0.04, 'bandpass', 3200, 6, 0.12, 0.06); INST.bell(d, t + 0.08, 880, 0.18, 0.4); };
  SFX.charge_ready = (d, t) => { INST.bell(d, t, 1175, 0.5, 0.7); INST.glass(d, t + 0.03, 2350, 0.25, 0.6); };
  SFX.hurt = (d, t) => { const s2 = sat(d, 4, 0.6); nburst(d, t, 'highpass', 2800, 0.7, 0.26, 0.03, 0.001); tone(s2, t, 'sine', 120, 38, 0.8, 0.3, 0.002); nburst(s2, t + 0.004, 'bandpass', 900, 1.1, 0.5, 0.16, 0.003); voice(d, t + 0.01, 230 * vr(0.08), [[0.12, 180]], 0.16, 0.15, [[700, 6, 1], [1150, 8, 0.6]], 0.1); };
  SFX.block = (d, t) => { const v = vr(0.08); tone(d, t, 'square', 560 * v, 400, 0.1, 0.14); tone(d, t, 'triangle', 1700 * v, 1500, 0.06, 0.24); nburst(d, t, 'bandpass', 2400, 4, 0.32, 0.08); tone(d, t, 'sine', 150, 90, 0.32, 0.12); };
  SFX.shield = (d, t) => { tone(d, t, 'triangle', 300, 260, 0.25, 0.18); nburst(d, t, 'bandpass', 1500, 6, 0.35, 0.12); };
  SFX.parry = (d, t) => {
    // aço contra aço: estalo brilhante, a lâmina a raspar ("shing"), o metal a vibrar em parciais inarmónicos,
    // um "tiiing" que fica a soar e um baque grave — com uma cauda própria na reverberação
    nburst(d, t, 'bandpass', 4200, 1.2, 0.6, 0.03, 0.001);
    nburst(d, t, 'highpass', 7600, 0.7, 0.35, 0.045, 0.001);
    const sh = nburst(d, t + 0.004, 'bandpass', 9500, 9, 0.28, 0.17, 0.003); sh.frequency.exponentialRampToValueAtTime(3000, t + 0.17);
    const f0 = 830;
    [[1, 0.32, 1.0], [2.76, 0.22, 0.7], [5.4, 0.13, 0.42], [8.93, 0.07, 0.24]].forEach(([r, a, dec]) => {
      const g = gainNode(0); percEnv(g, t, a, dec, 0.0015);
      const o = osc('sine', f0 * r, t, t + dec + 0.1); o.frequency.exponentialRampToValueAtTime(f0 * r * 0.996, t + dec);
      o.connect(g); g.connect(d);
    });
    [2490, 2497].forEach((f) => tone(d, t + 0.002, 'sine', f, f, 0.075, 1.5, 0.002));
    tone(d, t, 'sine', 170, 55, 0.55, 0.14, 0.0015);
    if (A.reverb) { const g = gainNode(0); percEnv(g, t, 0.16 * (A.vol ? A.vol.sfx : 1), 1.1, 0.002); const o = osc('triangle', f0 * 2.76, t, t + 1.2); o.connect(g); g.connect(A.reverb); }
  };
  SFX.parry_tell = (d, t) => { const o = tone(d, t, 'sine', 2100, 3400, 0.09, 0.28, 0.02); tone(d, t + 0.03, 'sine', 4200, 5200, 0.04, 0.2, 0.02); nburst(d, t, 'highpass', 7000, 1, 0.05, 0.25, 0.08); };
  SFX.danger_tell = (d, t) => { [110, 116.5, 164.8].forEach((f) => { const g = gainNode(0); percEnv(g, t, 0.11, 0.5, 0.03); const o = osc('sawtooth', f, t, t + 0.6); const lp = filt('lowpass', 900); o.connect(lp); lp.connect(g); g.connect(d); }); };
  SFX.dodge = (d, t) => { const v = vr(0.12); const f = nburst(d, t, 'bandpass', 380 * v, 1, 0.8, 0.26, 0.05); f.frequency.exponentialRampToValueAtTime(2600 * v, t + 0.18); nburst(d, t + 0.02, 'lowpass', 900, 0.7, 0.22, 0.12, 0.02); for (let i = 0; i < 3; i++) nburst(d, t + 0.02 + i * 0.04, 'bandpass', 1700 + i * 300, 3, 0.08, 0.03, 0.004); };
  SFX.jump = (d, t) => { const v = vr(0.12); const f = nburst(d, t, 'bandpass', 480 * v, 1, 0.42, 0.11, 0.01); f.frequency.exponentialRampToValueAtTime(1700 * v, t + 0.1); nburst(d, t, 'lowpass', 600, 0.8, 0.2, 0.05, 0.002); };
  SFX.land = (d, t) => { const v = vr(0.12); tone(d, t, 'sine', 115 * v, 48, 0.34, 0.11, 0.002); nburst(d, t, 'lowpass', 1000, 1, 0.28, 0.08, 0.002); nburst(d, t + 0.015, 'bandpass', 2400, 2, 0.06, 0.05, 0.004); };
  SFX.step_stone = (d, t) => { nburst(d, t, 'bandpass', 1800 + Math.random() * 600, 2, 0.16, 0.05); tone(d, t, 'sine', 90, 60, 0.12, 0.05); };
  SFX.step_wood = (d, t) => { nburst(d, t, 'bandpass', 700 + Math.random() * 200, 3, 0.2, 0.07); tone(d, t, 'triangle', 180, 150, 0.12, 0.06); };
  SFX.step_metal = (d, t) => { tone(d, t, 'square', 900 + Math.random() * 300, 700, 0.03, 0.08); nburst(d, t, 'bandpass', 3000, 6, 0.1, 0.06); };
  SFX.step_water = (d, t) => { const f = nburst(d, t, 'bandpass', 800, 1.5, 0.25, 0.14); f.frequency.exponentialRampToValueAtTime(2400, t + 0.12); tone(d, t + 0.02, 'sine', 600, 1100, 0.05, 0.06); };
  SFX.step_soft = (d, t) => { nburst(d, t, 'lowpass', 900, 0.7, 0.18, 0.07); };
  // ---------- a Carpideira: grito de sofrimento (síntese de voz por formantes), soluços e o choro ao longe ----------
  function voice(d, t, f0, curve, dur, peak, formants, breath) {
    const out = gainNode(0); env(out, t, dur, 0.08, 0.85, 0.35, peak); out.connect(d);
    const end = t + dur + 0.5;
    for (const det of [-6, 7]) {
      const o = osc('sawtooth', f0, t, end); o.detune.value = det;
      curve.forEach(([dt, f]) => o.frequency.exponentialRampToValueAtTime(f, t + dt));
      vibrato(o.frequency, t, end, 5.6, f0 * 0.035, 0.25);
      for (const [ff, q, g0] of formants) { const bp = filt('bandpass', ff, q), g = gainNode(g0); o.connect(bp); bp.connect(g); g.connect(out); }
    }
    if (breath) { const n = noiseSrc(t, dur + 0.3), hp = filt('bandpass', 2400, 0.8), g = gainNode(0); env(g, t, dur, 0.05, 0.6, 0.3, breath); n.connect(hp); hp.connect(g); g.connect(out); }
    if (A.reverb) { const g = gainNode(peak * 0.9); out.connect(g); g.connect(A.reverb); }
    return out;
  }
  const AH = [[760, 6, 1.0], [1220, 8, 0.55], [2650, 10, 0.3]];
  SFX.wail = (d, t) => {
    voice(d, t, 420, [[0.25, 760], [0.7, 900], [1.15, 640], [1.6, 360]], 1.5, 0.32, AH, 0.12);
    voice(d, t + 0.04, 280, [[0.3, 500], [0.8, 610], [1.3, 420], [1.7, 240]], 1.55, 0.18, [[620, 6, 1], [1040, 8, 0.5], [2400, 10, 0.25]], 0);
    tone(d, t, 'sine', 90, 50, 0.25, 1.2, 0.05);
  };
  SFX.sob = (d, t) => {
    for (let i = 0; i < 3; i++) {
      const tt = t + i * 0.22 + Math.random() * 0.04;
      nburst(d, tt, 'bandpass', 1300, 1.2, 0.12, 0.12, 0.02);
      voice(d, tt + 0.02, 360 - i * 30, [[0.12, 300 - i * 25]], 0.16, 0.1, AH, 0.03);
    }
  };
  // ao longe: abafado, mais baixo, quase só reverberação — ouve-se antes de a ver
  SFX.wail_far = (d, t) => {
    const lp = filt('lowpass', 850, 0.7), g = gainNode(0.7); lp.connect(g); g.connect(d);
    voice(lp, t, 380, [[0.4, 620], [1.1, 700], [1.7, 420], [2.3, 300]], 2.2, 0.22, AH, 0.05);
  };
  // passada de um bicho enorme: baque surdo e pó
  SFX.step_heavy = (d, t) => { tone(d, t, 'sine', 72, 36, 0.34, 0.18); nburst(d, t, 'lowpass', 420, 0.8, 0.24, 0.14); };
  SFX.enemy_hurt = (d, t) => { const v = vr(0.2); voice(d, t, 210 * v, [[0.1, 150 * v]], 0.14, 0.13, [[620, 6, 1], [1050, 8, 0.6]], 0.18); nburst(d, t, 'lowpass', 1900, 1, 0.22, 0.08); };
  SFX.enemy_die = (d, t) => { const v = vr(0.15); voice(d, t, 170 * v, [[0.35, 70]], 0.42, 0.16, [[520, 5, 1], [900, 7, 0.6]], 0.25); const f = nburst(d, t + 0.08, 'highpass', 1800, 0.5, 0.2, 0.9, 0.2); f.frequency.exponentialRampToValueAtTime(7000, t + 0.9); tone(d, t, 'sine', 90, 40, 0.3, 0.3); };
  SFX.boss_hit = (d, t) => { const g = gainNode(0.62); g.connect(d); SFX.hit_heavy(g, t); tone(sat(d, 4, 0.32), t, 'sine', 68 * vr(0.06), 34, 0.5, 0.24, 0.002); };
  SFX.boss_die = (d, t) => { const m = verb(d, t, 0.6); tone(m, t, 'sine', 82, 24, 0.8, 2.8); tone(sat(m, 3, 0.55), t, 'sawtooth', 55, 30, 0.25, 2.2); nburst(m, t, 'lowpass', 700, 0.7, 0.7, 2.6, 0.01); const f = nburst(m, t + 0.3, 'highpass', 1500, 0.5, 0.28, 3, 0.8); f.frequency.exponentialRampToValueAtTime(8000, t + 3); ['D3', 'A3', 'D4'].forEach((n, i) => INST.choir(m, t + 0.4 + i * 0.25, A.noteFreq(n), 2.2, 0.55)); for (let i = 0; i < 8; i++) nburst(m, t + 0.2 + i * 0.12 + Math.random() * 0.05, 'bandpass', 900 + Math.random() * 2400, 3, 0.18, 0.08); };
  SFX.stagger = (d, t) => { tone(d, t, 'triangle', 680, 210, 0.2, 0.38); nburst(d, t, 'bandpass', 1200, 3, 0.32, 0.22); INST.bell(d, t + 0.02, 1320 * vr(0.04), 0.5, 0.35); };
  SFX.heal = (d, t) => { ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => INST.glass(d, t + i * 0.07, A.noteFreq(n), 0.5, 0.9)); const f = nburst(d, t, 'bandpass', 400, 1, 0.12, 0.6, 0.2); f.frequency.exponentialRampToValueAtTime(3000, t + 0.6); };
  SFX.pickup = (d, t) => { ['E5', 'B5'].forEach((n, i) => INST.bell(d, t + i * 0.06, A.noteFreq(n), 0.4, 0.6)); };
  SFX.ash = (d, t) => { INST.glass(d, t, A.noteFreq('A5') * (1 + Math.random() * 0.1), 0.1, 0.4); };
  SFX.pickup_big = (d, t) => { ['D4', 'A4', 'D5', 'F#5', 'A5'].forEach((n, i) => INST.harp(d, t + i * 0.09, A.noteFreq(n), 1, 0.9)); INST.choir(d, t + 0.1, A.noteFreq('D4'), 1.4, 0.5); };
  SFX.ui_move = (d, t) => { tone(d, t, 'sine', 1400, 1200, 0.05, 0.04); };
  SFX.ui_ok = (d, t) => { INST.bell(d, t, A.noteFreq('A5'), 0.3, 0.5); };
  SFX.ui_back = (d, t) => { tone(d, t, 'sine', 700, 450, 0.08, 0.08); };
  SFX.ui_open = (d, t) => { const f = nburst(d, t, 'bandpass', 600, 1, 0.1, 0.25, 0.05); f.frequency.exponentialRampToValueAtTime(2000, t + 0.2); INST.bell(d, t + 0.05, A.noteFreq('E5'), 0.3, 0.4); };
  SFX.ui_tab = (d, t) => { tone(d, t, 'triangle', 900, 1100, 0.06, 0.05); };
  SFX.door = (d, t) => { const n = noiseSrc(t, 1.4); const lp = filt('lowpass', 350, 2); const g = gainNode(0); env(g, t, 1.0, 0.1, 1, 0.3, 0.5); const l = osc('sine', 7, t, t + 1.4); const lg = gainNode(120); l.connect(lg); lg.connect(lp.frequency); n.connect(lp); lp.connect(g); g.connect(d); tone(d, t + 1.1, 'sine', 90, 40, 0.6, 0.3); };
  SFX.lever = (d, t) => { tone(d, t, 'square', 300, 200, 0.08, 0.06); for (let i = 0; i < 4; i++) nburst(d, t + 0.05 + i * 0.05, 'bandpass', 2500, 5, 0.12, 0.03); tone(d, t + 0.25, 'sine', 120, 60, 0.4, 0.15); };
  SFX.secret = (d, t) => { ['G4', 'D5', 'G5', 'B5', 'D6', 'G6'].forEach((n, i) => INST.glass(d, t + i * 0.08, A.noteFreq(n), 0.6, 0.7)); };
  SFX.break = (d, t) => { for (let i = 0; i < 6; i++) nburst(d, t + i * 0.04 + Math.random() * 0.03, 'lowpass', 600 + Math.random() * 1200, 1, 0.35, 0.12); tone(d, t, 'sine', 100, 35, 0.6, 0.3); };
  SFX.spike = (d, t) => { tone(d, t, 'sawtooth', 1800, 900, 0.05, 0.12); nburst(d, t, 'highpass', 4000, 1, 0.2, 0.08); };
  SFX.fire = (d, t) => { const f = nburst(d, t, 'bandpass', 280, 0.8, 0.28, 0.55, 0.05); f.frequency.exponentialRampToValueAtTime(1900, t + 0.32); tone(sat(d, 3, 0.4), t, 'sine', 90, 50, 0.25, 0.3, 0.02); for (let i = 0; i < 7; i++) nburst(d, t + Math.random() * 0.45, 'highpass', 2800 + Math.random() * 3000, 1, 0.07, 0.02); };
  SFX.spell = (d, t) => { SFX.fire(d, t); tone(d, t, 'triangle', 300, 900, 0.1, 0.3); };
  SFX.shoot = (d, t) => { const v = vr(0.14); const f = nburst(d, t, 'bandpass', 1300 * v, 2, 0.42, 0.13, 0.008); f.frequency.exponentialRampToValueAtTime(380, t + 0.12); tone(d, t, 'triangle', 700 * v, 300, 0.1, 0.08, 0.004); };
  SFX.bolt = (d, t) => { tone(d, t, 'triangle', 600, 200, 0.12, 0.1); nburst(d, t, 'highpass', 3000, 1, 0.12, 0.05); };
  SFX.rest = (d, t) => { const f = nburst(d, t, 'lowpass', 200, 1, 0.5, 0.8, 0.05); f.frequency.exponentialRampToValueAtTime(1500, t + 0.4); ['D4', 'A4', 'F5'].forEach((n) => INST.choir(d, t + 0.2, A.noteFreq(n), 2, 0.6)); };
  SFX.death = (d, t) => { const m = verb(d, t, 0.6); tone(m, t, 'sine', 120, 28, 0.8, 2.2); tone(sat(m, 2), t, 'sawtooth', 300, 38, 0.12, 1.8); nburst(m, t, 'lowpass', 500, 1, 0.5, 1.6, 0.01); voice(m, t + 0.05, 200, [[0.6, 110]], 0.7, 0.18, [[600, 6, 1], [1000, 8, 0.6]], 0.3); INST.choir(m, t + 0.6, A.noteFreq('D3'), 2.2, 0.4); };
  SFX.shade = (d, t) => { const f = nburst(d, t, 'bandpass', 600, 8, 0.3, 1.2, 0.3); f.frequency.exponentialRampToValueAtTime(1600, t + 1); };
  SFX.roar = (d, t) => { const s2 = sat(verb(d, t, 0.35), 3); [70, 73.5, 104].forEach((f0) => { const g = gainNode(0); env(g, t, 1.25, 0.08, 0.9, 0.5, 0.13); const o = osc('sawtooth', f0 * vr(0.06), t, t + 2); o.frequency.linearRampToValueAtTime(f0 * 1.25, t + 0.35); o.frequency.linearRampToValueAtTime(f0 * 0.82, t + 1.4); vibrato(o.frequency, t, t + 2, 9, 7, 0.08); const bp = filt('bandpass', 520, 1.6); o.connect(bp); bp.connect(g); g.connect(s2); }); const f = nburst(s2, t, 'bandpass', 420, 0.8, 0.42, 1.3, 0.08); f.frequency.linearRampToValueAtTime(900, t + 0.4); f.frequency.linearRampToValueAtTime(300, t + 1.3); };
  SFX.bell = (d, t) => { INST.bigbell(d, t, A.noteFreq('C3'), 3, 1); };
  SFX.bell_small = (d, t) => { INST.bell(d, t, A.noteFreq('G5'), 1, 0.8); };
  SFX.thunder = (d, t) => { const n = noiseSrc(t, 4); const lp = filt('lowpass', 300, 0.5); const g = gainNode(0); percEnv(g, t, 0.7, 3.5, 0.05); lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(120, t + 3); n.connect(lp); lp.connect(g); g.connect(d); };
  SFX.splash = (d, t) => { const f = nburst(d, t, 'bandpass', 700, 1, 0.4, 0.4); f.frequency.exponentialRampToValueAtTime(2500, t + 0.3); };
  SFX.explode = (d, t) => { const m = verb(d, t, 0.45), s2 = sat(m, 6, 0.72); tone(s2, t, 'sine', 104, 26, 1.0, 0.7); nburst(s2, t, 'lowpass', 1500, 0.5, 0.85, 0.8, 0.003); const f = nburst(m, t + 0.05, 'bandpass', 2400, 0.7, 0.26, 0.9, 0.05); f.frequency.exponentialRampToValueAtTime(300, t + 0.9); for (let i = 0; i < 10; i++) nburst(d, t + 0.1 + Math.random() * 0.6, 'highpass', 3000, 1, 0.07, 0.02); };
  SFX.glass = (d, t) => { for (let i = 0; i < 8; i++) tone(d, t + Math.random() * 0.15, 'sine', 2500 + Math.random() * 3500, 2000, 0.05, 0.25); nburst(d, t, 'highpass', 4000, 1, 0.3, 0.2); };
  SFX.note = (d, t, o) => { INST.lute(d, t, A.noteFreq(o && o.note ? o.note : 'A4'), 0.3, 1); };
  SFX.whip = (d, t) => { const v = vr(0.14); const f = nburst(d, t, 'bandpass', 1800 * v, 2, 0.5, 0.1, 0.015); f.frequency.exponentialRampToValueAtTime(6500 * v, t + 0.08); nburst(d, t + 0.085, 'highpass', 4500, 1, 0.45, 0.03, 0.001); };
  SFX.howl = (d, t) => { const UU = [[480, 5, 1], [900, 6, 0.45], [2400, 8, 0.12]]; voice(d, t, 300 * vr(0.06), [[0.55, 520], [1.3, 500], [1.9, 330]], 1.8, 0.3, UU, 0.05); voice(d, t + 0.18, 250 * vr(0.06), [[0.6, 430], [1.4, 410], [2.0, 280]], 1.7, 0.17, UU, 0); };
  SFX.wind = (d, t) => { const f = nburst(d, t, 'bandpass', 400, 1, 0.4, 1.0, 0.3); f.frequency.exponentialRampToValueAtTime(1200, t + 0.8); };
  SFX.chime = (d, t) => { INST.bell(d, t, A.noteFreq('D6'), 1, 0.6); };
  SFX.charge = (d, t) => { tone(d, t, 'triangle', 200, 800, 0.08, 0.5, 0.3); };
  SFX.crush = (d, t) => { const m = verb(d, t, 0.3), s2 = sat(m, 5, 0.7); tone(s2, t, 'sine', 94, 28, 1.0, 0.45, 0.002); nburst(s2, t, 'lowpass', 950, 0.6, 0.75, 0.32, 0.002); for (let i = 0; i < 5; i++) nburst(d, t + 0.03 + i * 0.035 + Math.random() * 0.02, 'bandpass', 700 + Math.random() * 1600, 2.5, 0.16, 0.06, 0.002); };
  SFX.drip = (d, t) => { tone(d, t, 'sine', 1400 + Math.random() * 800, 600, 0.05, 0.12); };
  SFX.crackle = (d, t) => { nburst(d, t, 'highpass', 2500 + Math.random() * 3000, 1, 0.05 + Math.random() * 0.05, 0.015); };
  SFX.moth = (d, t) => { for (let i = 0; i < 6; i++) { const tt = t + i * 0.032 + Math.random() * 0.006; nburst(d, tt, 'bandpass', 320 + Math.random() * 120, 1.6, 0.34, 0.035, 0.004); tone(d, tt, 'sine', 70, 50, 0.06, 0.03, 0.003); } nburst(d, t, 'highpass', 3000, 0.7, 0.05, 0.22, 0.04); };
  // bichos do mundo: bater de asas, grasnar de corvo, guincho de rato
  SFX.flap = (d, t) => { for (let i = 0; i < 5; i++) nburst(d, t + i * 0.055 + Math.random() * 0.01, 'bandpass', 520 + Math.random() * 160, 2.5, 0.12, 0.04); };
  SFX.caw = (d, t) => { for (let i = 0; i < 2; i++) { const tt = t + i * 0.24; tone(d, tt, 'sawtooth', 620, 430, 0.07, 0.16, 0.01); nburst(d, tt, 'bandpass', 1300, 3, 0.1, 0.15, 0.01); } };
  SFX.squeak = (d, t) => { tone(d, t, 'sine', 2600, 3600, 0.05, 0.07, 0.005); tone(d, t + 0.09, 'sine', 2900, 3900, 0.04, 0.06, 0.005); };
  // onda de choque dos chefes ("larga-me!"): rosnar que sobe e o estrondo que empurra
  SFX.repel_charge = (d, t) => {
    const f = nburst(d, t, 'bandpass', 220, 1.2, 0.34, 0.36, 0.26); f.frequency.exponentialRampToValueAtTime(1700, t + 0.34);
    const g = gainNode(0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    const o = osc('sawtooth', 52, t, t + 0.45); o.frequency.exponentialRampToValueAtTime(96, t + 0.36); const lp = filt('lowpass', 420, 3); o.connect(lp); lp.connect(g); g.connect(d);
  };
  SFX.repel = (d, t) => {
    tone(d, t, 'sine', 120, 30, 0.95, 0.5); tone(d, t, 'triangle', 240, 60, 0.25, 0.25);
    nburst(d, t, 'lowpass', 1800, 0.7, 0.85, 0.38, 0.002); nburst(d, t, 'highpass', 3200, 0.8, 0.3, 0.07, 0.001);
    const f = nburst(d, t + 0.02, 'bandpass', 1400, 1.2, 0.3, 0.5, 0.02); f.frequency.exponentialRampToValueAtTime(300, t + 0.5);
  };
  // Ama Elowen: escavar, o chão a tremer por baixo, raízes a romper, anel de espinhos
  SFX.burrow = (d, t) => {
    for (let i = 0; i < 7; i++) nburst(d, t + i * 0.065 + Math.random() * 0.03, 'lowpass', 500 + Math.random() * 500, 0.9, 0.3, 0.09, 0.004);
    tone(d, t, 'sine', 70, 40, 0.4, 0.6); const f = nburst(d, t, 'bandpass', 900, 0.8, 0.18, 0.5, 0.1); f.frequency.exponentialRampToValueAtTime(260, t + 0.5);
  };
  SFX.rumble = (d, t) => {
    const n = noiseSrc(t, 0.8); const lp = filt('lowpass', 130, 1.4); const g = gainNode(0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.75, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
    n.connect(lp); lp.connect(g); g.connect(d); tone(d, t, 'sine', 48, 36, 0.35, 0.7, 0.1);
  };
  SFX.root_burst = (d, t) => {
    tone(d, t, 'sine', 110, 34, 0.85, 0.35); nburst(d, t, 'lowpass', 1200, 0.8, 0.6, 0.25, 0.002);
    for (let i = 0; i < 6; i++) nburst(d, t + 0.01 + i * 0.022 + Math.random() * 0.02, 'bandpass', 900 + Math.random() * 1600, 4, 0.2, 0.05, 0.001);
    nburst(d, t, 'highpass', 3500, 0.9, 0.22, 0.08, 0.001);
  };
  SFX.thorn_ring = (d, t) => {
    const f = nburst(d, t, 'bandpass', 500, 1.4, 0.4, 0.35, 0.02); f.frequency.exponentialRampToValueAtTime(2600, t + 0.3);
    for (let i = 0; i < 10; i++) nburst(d, t + 0.03 + i * 0.025, 'bandpass', 2400 + Math.random() * 2400, 6, 0.1, 0.03, 0.001);
    tone(d, t, 'sine', 160, 70, 0.3, 0.2);
  };
  // Custódio: o eclipse (um coro grave que desce e a luz a apagar-se)
  SFX.eclipse = (d, t) => {
    [65.4, 98, 130.8].forEach((f0, i) => { const g = gainNode(0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6); const o = osc(i ? 'triangle' : 'sawtooth', f0 * 2, t, t + 1.7); o.frequency.exponentialRampToValueAtTime(f0, t + 1.2); const lp = filt('lowpass', 900, 2); lp.frequency.exponentialRampToValueAtTime(180, t + 1.4); o.connect(lp); lp.connect(g); g.connect(d); });
    const f = nburst(d, t, 'bandpass', 3200, 1.4, 0.2, 1.1, 0.05); f.frequency.exponentialRampToValueAtTime(240, t + 1.1);
    INST.choir(d, t + 0.05, A.noteFreq('D3'), 1.2, 0.5);
  };
  // Eco de Seraphine: o tempo a parar (tique-taque que abranda, e um silêncio de vidro) e a voltar
  SFX.timestop = (d, t) => {
    for (let i = 0; i < 5; i++) { const tt = t + i * (0.09 + i * 0.03); tone(d, tt, 'square', 2400, 2200, 0.05, 0.03, 0.001); nburst(d, tt, 'highpass', 6000, 1, 0.06, 0.02, 0.001); }
    const f = nburst(d, t, 'bandpass', 600, 2, 0.25, 0.9, 0.6); f.frequency.exponentialRampToValueAtTime(5200, t + 0.75);
    INST.glass(d, t + 0.72, 2637, 1.2, 0.6); INST.glass(d, t + 0.74, 1975, 1.2, 0.4);
  };
  SFX.timeresume = (d, t) => {
    const f = nburst(d, t, 'bandpass', 5000, 1.2, 0.35, 0.5, 0.005); f.frequency.exponentialRampToValueAtTime(400, t + 0.45);
    tone(d, t, 'sine', 180, 60, 0.4, 0.4); INST.glass(d, t, 1318, 0.5, 0.4);
  };
  SFX.rewind = (d, t) => {
    const f = nburst(d, t, 'bandpass', 300, 3, 0.3, 0.55, 0.45); f.frequency.exponentialRampToValueAtTime(3600, t + 0.5);
    const g = gainNode(0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12, t + 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    const o = osc('triangle', 220, t, t + 0.62); o.frequency.exponentialRampToValueAtTime(880, t + 0.5); vibrato(o.frequency, t, t + 0.6, 14, 40, 0.05); o.connect(g); g.connect(d);
  };
  // projétil cortado pela arma: um tinido de vidro e um estalo
  SFX.proj_break = (d, t) => { INST.glass(d, t, 1600 + Math.random() * 500, 0.18, 0.55); nburst(d, t, 'highpass', 3800, 1, 0.22, 0.06, 0.001); tone(d, t, 'triangle', 900, 500, 0.08, 0.08); };
  SFX.choir_hit = (d, t) => { ['D3', 'A3', 'D4', 'F4'].forEach((n) => INST.choir(d, t, A.noteFreq(n), 1.2, 0.9)); };
  SFX.light = (d, t) => { tone(d, t, 'sine', 600, 2400, 0.08, 0.5, 0.2); INST.glass(d, t, A.noteFreq('E6'), 0.6, 0.6); };
  // o Juízo do Rei: um coro grave que sobe durante a preparação (1,6 s) e o estrondo que o fecha
  SFX.judgement = (d, t) => {
    [55, 55.6, 82.4].forEach((f0) => { const g = gainNode(0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 1.5); g.gain.setTargetAtTime(0.0001, t + 1.6, 0.08); const o = osc('sawtooth', f0, t, t + 2); o.frequency.exponentialRampToValueAtTime(f0 * 2, t + 1.6); const lp = filt('lowpass', 260, 4); lp.frequency.exponentialRampToValueAtTime(2600, t + 1.6); o.connect(lp); lp.connect(g); g.connect(d); });
    ['D3', 'A3', 'D4'].forEach((n, i) => INST.choir(d, t + 0.2 + i * 0.35, A.noteFreq(n), 1.4 - i * 0.35, 0.55));
    const f = nburst(d, t, 'bandpass', 300, 2, 0.18, 1.6, 1.4); f.frequency.exponentialRampToValueAtTime(5000, t + 1.6);
  };
  SFX.judgement_slam = (d, t) => {
    tone(d, t, 'sine', 120, 28, 1.1, 1.4); tone(d, t, 'sawtooth', 70, 35, 0.35, 0.8);
    nburst(d, t, 'lowpass', 2400, 0.6, 0.9, 1.1, 0.002); INST.bigbell(d, t, A.noteFreq('D2'), 3, 0.6);
  };
  A.SFX = SFX;

  A.sfx = function (name, opts) {
    if (!c || c.state !== 'running' || A.mute.sfx) return;
    const fn = SFX[name]; if (!fn) { console.warn('sfx inexistente', name); return; }
    const now = c.currentTime;
    if (A.lastSfx[name] && now - A.lastSfx[name] < 0.03) return; // evita empilhamento no mesmo frame
    A.lastSfx[name] = now;
    opts = opts || {};
    try { fn(out(opts.vol !== undefined ? opts.vol : 1, opts.pan || 0), now + (opts.delay || 0), opts); } catch (e) { console.warn(e); }
  };

  // ---------- ambientes ----------
  class Ambience {
    constructor(def) {
      this.def = def; this.nodes = []; this.out = gainNode(0); this.out.connect(A.buses.amb);
      const t = c.currentTime;
      this.out.gain.linearRampToValueAtTime(1, t + 2);
      const add = (n) => { this.nodes.push(n); return n; };
      const loopNoise = () => { const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(t, Math.random()); add(s); return s; };
      if (def.wind) {
        const n = loopNoise(); const bp = filt('bandpass', 500, 0.8); const g = gainNode(def.wind * 0.35);
        const l = osc('sine', 0.07 + Math.random() * 0.05, t, t + 36000); const lg = gainNode(300); l.connect(lg); lg.connect(bp.frequency); add(l);
        const l2 = osc('sine', 0.11, t, t + 36000); const l2g = gainNode(def.wind * 0.2); l2.connect(l2g); l2g.connect(g.gain); add(l2);
        n.connect(bp); bp.connect(g); g.connect(this.out);
      }
      if (def.rain) {
        const n = loopNoise(); const hp = filt('highpass', 1200, 0.5); const lp = filt('lowpass', 8000); const g = gainNode(def.rain * 0.22);
        n.connect(hp); hp.connect(lp); lp.connect(g); g.connect(this.out);
        const n2 = loopNoise(); const lp2 = filt('lowpass', 500); const g2 = gainNode(def.rain * 0.12); n2.connect(lp2); lp2.connect(g2); g2.connect(this.out);
      }
      if (def.rumble) {
        const n = loopNoise(); const lp = filt('lowpass', 110, 1); const g = gainNode(def.rumble * 0.6);
        const l = osc('sine', 0.2, t, t + 36000); const lg = gainNode(def.rumble * 0.25); l.connect(lg); lg.connect(g.gain); add(l);
        n.connect(lp); lp.connect(g); g.connect(this.out);
      }
      if (def.water) {
        const n = loopNoise(); const bp = filt('bandpass', 900, 0.6); const g = gainNode(def.water * 0.12);
        const l = osc('sine', 0.3, t, t + 36000); const lg = gainNode(400); l.connect(lg); lg.connect(bp.frequency); add(l);
        n.connect(bp); bp.connect(g); g.connect(this.out);
      }
      if (def.hum) {
        const g = gainNode(def.hum * 0.5); g.connect(this.out);
        (def.humNotes || ['D3', 'A3']).forEach((nn) => { const f = A.noteFreq(nn); [0, 4].forEach((det) => { const o = osc('sine', f, t, t + 36000); o.detune.value = det; o.connect(g); add(o); }); });
        const l = osc('sine', 0.05, t, t + 36000); const lg = gainNode(def.hum * 0.3); l.connect(lg); lg.connect(g.gain); add(l);
      }
      this.timers = { thunder: U.rand(6, 14), drip: U.rand(1, 3), crackle: 0.2, bell: U.rand(5, 12), gust: U.rand(4, 10), choir: U.rand(8, 16), bird: U.rand(6, 15) };
      this.last = c.currentTime;
    }
    tick(now) {
      const dt = Math.min(0.2, now - this.last); this.last = now;
      const d = this.def, T = this.timers;
      const evt = (k, lo, hi, fn) => { T[k] -= dt; if (T[k] <= 0) { T[k] = U.rand(lo, hi); fn(); } };
      const ambOut = () => { const g = gainNode(1); g.connect(this.out); return g; };
      if (d.thunder) evt('thunder', 9, 22, () => { SFX.thunder(ambOut(), now + 0.4); if (VS.events) VS.events.emit('lightning'); });
      if (d.drips) evt('drip', 0.6, 2.8, () => SFX.drip(ambOut(), now));
      if (d.fire) evt('crackle', 0.05, 0.4, () => SFX.crackle(ambOut(), now));
      if (d.bells) evt('bell', 9, 20, () => INST.bell(ambOut(), now, A.noteFreq(U.pick(['C4', 'G3', 'Eb4'])), 2, 0.35));
      if (d.gusts) evt('gust', 5, 12, () => SFX.wind(ambOut(), now));
      if (d.choir) evt('choir', 10, 20, () => INST.choir(ambOut(), now, A.noteFreq(U.pick(['D4', 'F4', 'A3', 'C4'])), 4, 0.25));
      if (d.birds) evt('bird', 7, 16, () => { const g = ambOut(); const tt = now; for (let i = 0; i < 3; i++) tone(g, tt + i * 0.12, 'sine', 2400, 1800, 0.02, 0.1); });
    }
    stop() {
      const t = c.currentTime;
      this.out.gain.setValueAtTime(this.out.gain.value, t); this.out.gain.linearRampToValueAtTime(0.0001, t + 1.5);
      setTimeout(() => { this.nodes.forEach((n) => { try { n.stop(); } catch (e) { } }); try { this.out.disconnect(); } catch (e) { } }, 1700);
    }
  }
  A.setAmbience = function (id) {
    if (!c) { A.pendingAmb = id; A.ambId = id; return; }
    if (A.ambId === id && A.amb) return;
    if (A.amb) A.amb.stop();
    A.amb = null; A.ambId = id;
    const def = id && VS.AMBIENCE && VS.AMBIENCE[id];
    if (def) A.amb = new Ambience(def);
  };

  VS.Audio = A;
})(window.VS);
