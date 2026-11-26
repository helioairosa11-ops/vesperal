"""Efeitos sonoros do Coveiro feitos por síntese (camadas de ruído filtrado, graves com queda de tom, detritos,
formantes de rosnado) — gravados em godot/audio/sfx/cov_*.ogg. Uso: python3 tools/sfx_coveiro.py"""
import pathlib, subprocess, tempfile
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
OUT = pathlib.Path(__file__).resolve().parents[1] / 'godot' / 'audio' / 'sfx'
rng = np.random.default_rng(3)

def t(d): return np.arange(int(round(SR * d))) / SR
def env(n, a, d, curve=3.0):
    x = np.arange(n) / SR
    e = np.minimum(1, x / max(a, 1e-4)) * np.exp(-np.maximum(0, x - a) * curve / max(d, 1e-4))
    return e
def bp(x, lo, hi, o=4): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, o=4): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=4): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def noise(d): return rng.uniform(-1, 1, int(round(SR * d)))
def sweep_sine(d, f0, f1, curve=4.0):
    x = t(d); f = f1 + (f0 - f1) * np.exp(-x * curve)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def mix(*parts):
    n = max(len(p) for p, _ in parts); o = np.zeros(n)
    for p, at in parts:
        i = int(at * SR); o[i:i + len(p)] += p[:n - i]
    return o
def debris(d, count, lo=900, hi=5000, start=0.0, spread=0.6):
    o = np.zeros(int(SR * d))
    for _ in range(count):
        at = start + abs(rng.normal(0, spread / 2.5))
        n = int(SR * rng.uniform(0.008, 0.05)); i = int(at * SR)
        if i + n >= len(o): continue
        g = bp(rng.uniform(-1, 1, n), rng.uniform(lo, lo * 2), rng.uniform(hi * 0.6, hi)) * env(n, 0.001, rng.uniform(0.01, 0.04), 3)
        o[i:i + n] += g * rng.uniform(0.2, 0.7) * np.exp(-at * 2.5)
    return o
def reverb(x, wet=0.25, length=1.2):
    ir = noise(length) * np.exp(-t(length) * 5.5)
    ir = lp(ir, 3500)
    y = np.convolve(x, ir)[:len(x) + int(SR * length * 0.6)]
    y /= np.max(np.abs(y)) + 1e-9
    xx = np.pad(x, (0, len(y) - len(x)))
    return xx * (1 - wet) + y * wet * np.max(np.abs(x))
def save(name, x, gain=0.92):
    x = np.tanh(x / (np.max(np.abs(x)) + 1e-9) * 1.6)
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    fade = int(SR * 0.02); x[-fade:] *= np.linspace(1, 0, fade)
    with tempfile.TemporaryDirectory() as td:
        w = pathlib.Path(td) / 'a.wav'
        wavfile.write(w, SR, (x * 32767).astype(np.int16))
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(w), '-c:a', 'libvorbis', '-q:a', '6', str(OUT / f'{name}.ogg')], check=True)
    print(name, round(len(x) / SR, 2), 's')

# pancada da pá na terra: grave a cair + estalo + terra a espalhar + cauda
def slam(fire=False):
    d = 1.6
    boom = sweep_sine(0.9, 120, 38, 6) * env(int(SR * 0.9), 0.002, 0.5, 3.5) * 1.0
    thud = lp(noise(0.25), 400) * env(int(SR * 0.25), 0.001, 0.09, 3) * 1.4
    crack = bp(noise(0.06), 1500, 6000) * env(int(SR * 0.06), 0.0005, 0.03, 3) * 0.6
    dirt = lp(hp(noise(1.2), 300), 2500) * env(int(SR * 1.2), 0.01, 0.6, 3.5) * 0.35
    parts = [(boom, 0), (thud, 0), (crack, 0), (dirt, 0.02), (debris(d, 46, start=0.05, spread=0.9), 0)]
    if fire:
        whoosh = bp(noise(1.1), 200, 2400) * env(int(SR * 1.1), 0.05, 0.7, 2.5) * 0.7
        crackle = debris(1.2, 60, 2000, 9000, start=0.05, spread=1.1) * 0.8
        parts += [(whoosh, 0.0), (crackle, 0.0)]
    return reverb(mix(*parts), 0.22)

# balanço pesado: sopro com subida e descida de tom (ar a ser cortado) + ranger do cabo
def swing(heavy=True, fire=False):
    d = 0.55 if heavy else 0.38
    x = t(d); n = len(x)
    centre = 300 + 1600 * np.sin(np.pi * x / d) ** 2
    nz = noise(d); out = np.zeros(n); step = 512
    for i in range(0, n, step):
        c = centre[min(i, n - 1)]
        out[i:i + step] = bp(nz[i:i + step + 1024], max(80, c * 0.55), c * 1.5)[:len(out[i:i + step])]
    out *= np.sin(np.pi * x / d) ** 1.5
    creak = sweep_sine(0.12, 180, 120, 2) * env(int(SR * 0.12), 0.01, 0.06, 2) * 0.15
    parts = [(out, 0), (creak, 0)]
    if fire:
        parts.append((bp(noise(d), 150, 1200) * np.sin(np.pi * x / d) * 0.6, 0))
    return mix(*parts) * (1.0 if heavy else 0.8)

# rosnado do coveiro: dente de serra grave com vibrato e formantes, ar e garganta
def roar(fire=False):
    d = 1.5; x = t(d)
    f0 = 70 + 25 * np.exp(-x * 1.5) + 4 * np.sin(2 * np.pi * 6 * x)
    ph = np.cumsum(f0) / SR
    saw = 2 * (ph % 1) - 1
    grit = 1 + 0.5 * rng.uniform(-1, 1, len(x))
    src = saw * grit
    voc = bp(src, 300, 900, 2) * 1.0 + bp(src, 1000, 1800, 2) * 0.6 + bp(src, 2300, 3200, 2) * 0.3
    breath = bp(noise(d), 500, 4000) * 0.35
    e = env(len(x), 0.12, 1.1, 2.2)
    sub = np.sin(2 * np.pi * np.cumsum(f0 / 2) / SR) * 0.5
    parts = [((voc + breath + sub) * e, 0)]
    if fire:
        parts.append((bp(noise(d), 120, 900) * e * 0.5, 0))
    return reverb(mix(*parts), 0.3, 1.6)

# enterrar-se / sair: rumor grave longo + terra a deslizar + pedras
def burrow(up=False):
    d = 1.4; x = t(d)
    rum = lp(noise(d), 160) * 2.2
    slide = bp(noise(d), 400, 2200) * 0.4
    e = np.where(x < 0.55, (x / 0.55) ** 1.5, np.exp(-(x - 0.55) * 2.5)) if up else np.exp(-x * 1.4)
    e = e * np.minimum(1, x / 0.05) * np.minimum(1, (d - x) / 0.2)
    burst = slam()[:int(SR * 0.9)] * 0.8 if up else np.zeros(1)
    return reverb(mix(((rum + slide) * e, 0), (debris(d, 50, spread=1.3), 0), (burst, 0.55 if up else 0)), 0.2)

# atordoado (parry/postura partida): impacto metálico grave + gemido curto
def stagger():
    clang = sum(np.sin(2 * np.pi * f * t(0.9)) * a for f, a in [(220, 1), (347, .6), (583, .4), (911, .25)]) * env(int(SR * .9), .001, .5, 4)
    groan = roar()[:int(SR * 0.7)] * np.linspace(1, 0, int(SR * 0.7)) * 0.6
    return reverb(mix((clang * 0.7, 0), (bp(noise(.08), 2000, 8000) * env(int(SR * .08), .0005, .04, 3), 0), (groan, 0.08)), 0.3)

# passos pesados (lama)
def step():
    thud = lp(noise(0.18), 250) * env(int(SR * .18), .002, .07, 3)
    squelch = bp(noise(0.12), 300, 1500) * env(int(SR * .12), .01, .06, 3) * 0.4
    return mix((thud, 0), (squelch, 0.01))

# morte: rosnado a cair, corpo a tombar, terra
def death():
    x = t(2.2)
    g = roar()
    g = np.interp(np.arange(len(g)) * 0.8, np.arange(len(g)), g)  # mais grave e lento
    fall = slam()[:int(SR * 1.3)]
    return mix((g * np.linspace(1, 0, len(g)), 0), (fall, 0.9))

if __name__ == '__main__':
    save('cov_slam', slam())
    save('cov_slam_fire', slam(True))
    save('cov_swing', swing(True))
    save('cov_swing_light', swing(False))
    save('cov_swing_fire', swing(True, True))
    save('cov_roar', roar())
    save('cov_roar_fire', roar(True))
    save('cov_burrow', burrow(False))
    save('cov_emerge', burrow(True))
    save('cov_stagger', stagger())
    save('cov_step', step(), 0.6)
    save('cov_death', death())
