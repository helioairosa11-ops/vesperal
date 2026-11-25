"""Grava o áudio do jogo web (efeitos, músicas, ambientes), gerado pelo motor js/core/audio.js, em ficheiros .ogg
para a versão Godot — o som fica exatamente igual ao do browser.
Uso: python3 tools/render_audio_godot.py  → godot/audio/{sfx,music,amb}/*.ogg"""
import base64, json, pathlib, subprocess, sys
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'godot' / 'audio'
for d in ('sfx', 'music', 'amb'):
    (OUT / d).mkdir(parents=True, exist_ok=True)

JS = r"""async ([kind, id, secs, intensity]) => {
  const A = VS.Audio, RATE = 44100;
  if (A.timer) clearInterval(A.timer);
  A.ctx = null; A.current = null; A.old = null; A.amb = null; A.ambId = null; A.currentId = null; A.lastSfx = {}; A.voices = 0;
  const off = new OfflineAudioContext(2, Math.ceil(RATE * secs), RATE);
  Object.defineProperty(off, 'state', { get: () => 'running' });
  off.resume = () => Promise.resolve(); off.suspend = () => Promise.resolve();
  const OldAC = window.AudioContext;
  window.AudioContext = function () { return off; };
  A.init();
  window.AudioContext = OldAC;
  if (A.timer) clearInterval(A.timer);
  A.vol = { master: 0.8, music: 0.7, sfx: 0.8, amb: 0.6 }; A.mute = { music: false, sfx: false, amb: false }; A.applyVolumes();
  A.intensity = intensity || 0;
  if (kind === 'sfx') A.sfx(id);
  else if (kind === 'music') { A.playMusic(id, { fade: 0.01 }); if (A.current) { A.current.out.gain.cancelScheduledValues(0); A.current.out.gain.setValueAtTime(1, 0); A.current.schedule(secs); } }
  else if (kind === 'amb') { A.setAmbience(id); if (A.amb) { for (let t = 0; t < secs; t += 0.05) A.amb.tick(t); } }
  const buf = await off.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1), n = buf.length;
  const out = new Int16Array(n * 2);
  for (let i = 0; i < n; i++) { out[i * 2] = Math.max(-1, Math.min(1, L[i])) * 32767; out[i * 2 + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
  let s = ''; const u8 = new Uint8Array(out.buffer);
  for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
  return { b64: btoa(s), n, loopBeats: A.current ? A.current.lengthBeats : 0, beat: A.current ? A.current.beatDur : 0 };
}"""

def save(path, b64, start=0, length=None):
    raw = base64.b64decode(b64)
    pcm = path.with_suffix('.raw'); pcm.write_bytes(raw)
    args = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', '44100', '-ac', '2', '-i', str(pcm)]
    if start or length:
        args += ['-ss', f'{start:.4f}'] + (['-t', f'{length:.4f}'] if length else [])
    args += ['-af', 'silenceremove=stop_periods=1:stop_threshold=-70dB:stop_duration=0.3' if path.parent.name == 'sfx' else 'anull',
             '-c:a', 'libvorbis', '-q:a', '6', str(path)]
    subprocess.run(args, check=True); pcm.unlink()

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); pg = b.new_page()
    pg.goto((ROOT / 'index.html').as_uri() + '?debug=1'); pg.wait_for_timeout(2500)
    only = set(sys.argv[1:])
    sfx = pg.evaluate('Object.keys(VS.Audio.SFX)')
    music = pg.evaluate('Object.keys(VS.MUSIC || {})')
    amb = pg.evaluate('Object.keys(VS.AMBIENCE || {})')
    meta = {'sfx': sfx, 'music': {}, 'amb': amb}
    if not only or 'sfx' in only:
        for name in sfx:
            r = pg.evaluate(JS, ['sfx', name, 4.0, 0])
            save(OUT / 'sfx' / f'{name}.ogg', r['b64'])
        print('sfx', len(sfx))
    if not only or 'music' in only:
        for name in music:
            info = pg.evaluate(f"(() => {{ const s = VS.MUSIC['{name}']; return {{ bpm: s.bpm, parts: s.parts.map((p) => [VS.Audio.parseNotes(p.notes).reduce((a, e) => a + e.dur, 0), p.minInt || 0]) }}; }})()")
            beat = 60.0 / info['bpm']; loop_beats = max(x[0] for x in info['parts']) or 16
            loop = loop_beats * beat
            while loop < 20: loop *= 2
            ints = sorted(set([0] + [x[1] for x in info['parts'] if x[1]]))
            meta['music'][name] = {'loop': round(loop, 4), 'layers': ints}
            for it in ints:
                r = pg.evaluate(JS, ['music', name, loop * 2 + 2, it])
                save(OUT / 'music' / (f'{name}.ogg' if it == 0 else f'{name}_i{it}.ogg'), r['b64'], start=loop, length=loop)
        print('music', len(music))
    if not only or 'amb' in only:
        for name in amb:
            r = pg.evaluate(JS, ['amb', name, 34.0, 0])
            save(OUT / 'amb' / f'{name}.ogg', r['b64'], start=3, length=30)
        print('amb', len(amb))
    b.close()
(OUT / 'audio.json').write_text(json.dumps(meta), encoding='utf-8')
