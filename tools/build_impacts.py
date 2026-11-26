"""Sons de impacto (golpes, pancadas, aparar, ser atingida) feitos com gravações reais CC0 do OpenGameArt,
em camadas: corpo (soco/carne), material (metal, pedra, madeira, cera), grave (peso) e um brilho curto no ataque.
Cada som começa no instante do golpe (sem silêncio antes), é curto, e tem 3-4 versões para não soar repetido.
Gera: godot/audio/sfx/<nome>.ogg (+ <nome>_2.ogg, ...) e js/data/sfx_samples.js (as mesmas versões, para o jogo web).
Uso: python3 tools/build_impacts.py <pasta_com_os_pacotes_extraidos>
Pacotes (todos CC0): Independent.nu "37 hits/punches" e "8 wet squish, slurp impacts"; qubodup "Impact", "Punch";
rubberduck "75 CC0 breaking / falling / hit sfx"; StarNinjas "20 Sword Sound Effects (Attacks and Clashes)"."""
import base64, io, json, pathlib, subprocess, sys
import numpy as np
from scipy.signal import butter, sosfilt

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = pathlib.Path(sys.argv[1])
SR = 44100
rng = np.random.default_rng(7)

def load(rel):
    p = next(SRC.rglob(rel))
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    y = np.frombuffer(raw, np.float32).astype(float)
    pk = np.abs(y).max() or 1.0
    i = int(np.argmax(np.abs(y) > pk * 0.12))          # começa no golpe
    y = y[max(0, i - int(SR * 0.002)):]
    return y / pk

def cut(y, secs, fade=0.06):
    y = y[:int(SR * secs)].copy()
    f = min(len(y), int(SR * fade)); y[-f:] *= np.linspace(1, 0, f) ** 2
    return y

def hp(y, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), y)
def lp(y, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), y)

def thump(f0=70, f1=40, secs=0.18):
    t = np.arange(int(SR * secs)) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 16) * np.minimum(1, t / 0.002)

def mix(*layers):
    n = max(len(y) for y, _, _ in layers); o = np.zeros(n)
    for y, g, at in layers:
        i = int(SR * at); o[i:i + len(y)] += y[:n - i] * g
    return o

# quanto tempo o corpo do som demora a cair (s): golpes secos, pancadas com mais cauda
TAU = {'hit': .07, 'hit_heavy': .11, 'hit_metal': .12, 'hit_stone': .08, 'hit_wood': .07, 'hit_soft': .08,
       'enemy_hurt': .08, 'boss_hit': .12, 'hit_blunt': .09, 'hurt': .09, 'block': .09, 'shield': .1, 'parry': .2, 'crush': .22}

def finish(y, rms50, tau=0.1):
    t = np.arange(len(y)) / SR
    y = y * np.where(t < 0.015, 1.0, np.exp(-(t - 0.015) / tau))   # corpo seco: cai depressa depois do golpe
    y = np.tanh(y * 1.2) / np.tanh(1.2)                 # cola as camadas sem estalar
    w = y[:int(SR * 0.05)]
    y = y * (rms50 / (np.sqrt((w ** 2).mean()) + 1e-9))
    pk = np.abs(y).max()
    if pk > 0.95: y *= 0.95 / pk
    return y

# receitas: cada versão é uma lista de camadas (ficheiro, ganho, atraso, duração, filtro)
def L(name, g=1.0, at=0.0, secs=0.4, hi=None, lo=None):
    y = load(name)
    if hi: y = hp(y, hi)
    if lo: y = lp(y, lo)
    return (cut(y, secs), g, at)

RECIPES = {
    # golpe leve da protagonista num inimigo/chefe: soco seco + carne + brilho da lâmina
    'hit': (0.16, [
        lambda: [L('qubodupPunch01.flac', 1.0, 0, .28), L('hit12.mp3.flac', .55, 0, .25, hi=180), L('sword_clash.2.ogg', .10, 0, .06, hi=3000)],
        lambda: [L('qubodupPunch05.flac', 1.0, 0, .28), L('hit13.mp3.flac', .55, 0, .25, hi=180), L('sword_clash.4.ogg', .10, 0, .06, hi=3000)],
        lambda: [L('qubodupImpactMeat02.flac', 1.0, 0, .28), L('hit10.mp3.flac', .5, 0, .25, hi=180), L('sword_clash.5.ogg', .09, 0, .06, hi=3000)],
        lambda: [L('qubodupImpactMeat01.flac', 1.0, 0, .28), L('hit15.mp3.flac', .5, 0, .25, hi=180), L('sword_clash.3.ogg', .09, 0, .06, hi=3000)],
    ]),
    # golpe forte / riposta: soco grave + carne + grave sintético
    'hit_heavy': (0.30, [
        lambda: [L('qubodupPunch02.flac', 1.0, 0, .4), L('hit34.mp3.flac', .8, 0, .35), (thump(80, 42, .2), .9, 0), L('impactsplat03.mp3.flac', .25, .01, .25, lo=4000)],
        lambda: [L('qubodupPunch03.flac', 1.0, 0, .4), L('hit20.mp3.flac', .8, 0, .35), (thump(72, 40, .2), .9, 0), L('impactsplat04.mp3.flac', .25, .01, .25, lo=4000)],
        lambda: [L('qubodupPunch04.flac', 1.0, 0, .4), L('hit33.mp3.flac', .8, 0, .35), (thump(76, 38, .2), .9, 0), L('impactsplat07.mp3.flac', .25, .01, .25, lo=4000)],
    ]),
    # material: armadura / metal
    'hit_metal': (0.10, [
        lambda: [L('sword_clash.2.ogg', 1.0, 0, .35), L('qubodupImpactMetal.flac', .6, 0, .2)],
        lambda: [L('sword_clash.4.ogg', 1.0, 0, .35), L('bfh1_metal_hit_04.ogg', .6, 0, .25)],
        lambda: [L('sword_clash.5.ogg', 1.0, 0, .35), L('bfh1_metal_hit_06.ogg', .6, 0, .25)],
    ]),
    # material: pedra
    'hit_stone': (0.08, [
        lambda: [L('qubodupImpactStone.flac', 1.0, 0, .3), L('bfh1_rock_hit_01.ogg', .6, 0, .12), L('bfh1_rock_falling_02.ogg', .3, .04, .3)],
        lambda: [L('qubodupImpactStone.flac', .9, 0, .3, lo=3000), L('bfh1_rock_falling_08.ogg', .5, .01, .3)],
        lambda: [L('bfh1_hit_06.ogg', 1.0, 0, .3), L('bfh1_rock_hit_01.ogg', .5, 0, .12)],
    ]),
    # material: madeira
    'hit_wood': (0.08, [
        lambda: [L('bfh1_wood_hit_01.ogg', 1.0, 0, .25)],
        lambda: [L('bfh1_wood_hit_03.ogg', 1.0, 0, .3)],
        lambda: [L('qubodupImpactWood.flac', 1.0, 0, .3)],
    ]),
    # material: cera / mole
    'hit_soft': (0.09, [
        lambda: [L('impactsplat07.mp3.flac', 1.0, 0, .25, lo=3500)],
        lambda: [L('impactsplat04.mp3.flac', 1.0, 0, .25, lo=3500)],
    ]),
    # material: carne (camada por baixo do golpe)
    'enemy_hurt': (0.08, [
        lambda: [L('impactsplat03.mp3.flac', 1.0, 0, .22, lo=5000)],
        lambda: [L('impactsplat04.mp3.flac', 1.0, 0, .22, lo=5000)],
        lambda: [L('impactsplat07.mp3.flac', 1.0, 0, .22, lo=5000)],
    ]),
    # peso extra quando o golpe acerta num chefe
    'boss_hit': (0.20, [
        lambda: [L('bfh1_hit_02.ogg', 1.0, 0, .35), (thump(64, 36, .25), .8, 0)],
        lambda: [L('bfh1_hit_07.ogg', 1.0, 0, .35, lo=2500), (thump(60, 34, .25), .8, 0)],
        lambda: [L('bfh1_wood_hit_02.ogg', 1.0, 0, .3), (thump(66, 36, .25), .8, 0)],
    ]),
    # golpe contundente (martelos, maças)
    'hit_blunt': (0.20, [
        lambda: [L('qubodupPunch02.flac', 1.0, 0, .35), (thump(70, 40, .18), .6, 0)],
        lambda: [L('qubodupPunch04.flac', 1.0, 0, .35), (thump(70, 40, .18), .6, 0)],
    ]),
    # a protagonista é atingida
    'hurt': (0.24, [
        lambda: [L('hit19.mp3.flac', 1.0, 0, .35), L('qubodupPunch03.flac', .7, 0, .3), (thump(90, 50, .15), .6, 0)],
        lambda: [L('hit24.mp3.flac', 1.0, 0, .35), L('qubodupPunch02.flac', .7, 0, .3), (thump(86, 48, .15), .6, 0)],
        lambda: [L('hit35.mp3.flac', 1.0, 0, .35), L('qubodupPunch04.flac', .7, 0, .3), (thump(92, 50, .15), .6, 0)],
    ]),
    # bloquear com a guarda
    'block': (0.11, [
        lambda: [L('sword_clash.9.ogg', .8, 0, .3, lo=6000), L('bfh1_wood_hit_01.ogg', .7, 0, .2)],
        lambda: [L('sword_clash.7.ogg', .8, 0, .3, lo=6000), L('bfh1_wood_hit_03.ogg', .7, 0, .2)],
        lambda: [L('sword_clash.6.ogg', .8, 0, .3, lo=6000), L('qubodupImpactWood.flac', .7, 0, .2)],
    ]),
    # escudo (chefes com escudo)
    'shield': (0.09, [
        lambda: [L('bfh1_metal_hit_02.ogg', 1.0, 0, .35), L('qubodupImpactWood.flac', .6, 0, .2)],
        lambda: [L('bfh1_metal_hit_04.ogg', 1.0, 0, .35), L('bfh1_wood_hit_03.ogg', .6, 0, .2)],
    ]),
    # aparar: choque de lâminas brilhante com cauda a tilintar
    'parry': (0.22, [
        lambda: [L('sword_clash.1.ogg', 1.0, 0, .7), L('qubodupImpactMetal.flac', .5, 0, .2), (thump(110, 70, .1), .4, 0)],
        lambda: [L('sword_clash.8.ogg', 1.0, 0, .7), L('bfh1_metal_hit_06.ogg', .5, 0, .2), (thump(110, 70, .1), .4, 0)],
        lambda: [L('sword_clash.10.ogg', 1.0, 0, .7), L('qubodupImpactMetal.flac', .5, 0, .2), (thump(110, 70, .1), .4, 0)],
    ]),
    # pancada de chefe no chão
    'crush': (0.34, [
        lambda: [L('qubodupImpactStone.flac', 1.0, 0, .4), L('bfh1_hit_02.ogg', .9, 0, .5), (thump(60, 30, .5), 1.0, 0),
                 L('bfh1_rock_breaking_02.ogg', .35, .03, .7), L('bfh1_rock_falling_01.ogg', .25, .12, .7)],
        lambda: [L('qubodupImpactStone.flac', .9, 0, .4, lo=2500), L('bfh1_hit_07.ogg', .9, 0, .5), (thump(56, 28, .5), 1.0, 0),
                 L('bfh1_rock_breaking_03.ogg', .35, .03, .5), L('bfh1_rock_falling_09.ogg', .25, .1, .6)],
    ]),
}

def to_ogg(y, path=None):
    pcm = (np.clip(y, -1, 1) * 32767).astype('<i2').tobytes()
    out = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-',
                          '-c:a', 'libvorbis', '-q:a', '5', '-f', 'ogg', path or '-'], input=pcm, capture_output=True, check=True)
    return out.stdout

def main():
    sfx = ROOT / 'godot' / 'audio' / 'sfx'
    web = {}
    for name, (rms, variants) in RECIPES.items():
        web[name] = []
        for k, rec in enumerate(variants):
            y = finish(mix(*rec()), rms, TAU.get(name, .1))
            fn = f'{name}.ogg' if k == 0 else f'{name}_{k + 1}.ogg'
            to_ogg(y, str(sfx / fn))
            web[name].append(base64.b64encode(to_ogg(y)).decode())
            print(f'{fn:16s} {len(y) / SR:.2f}s')
    js = ("// Gerado por tools/build_impacts.py — sons de impacto gravados (CC0, OpenGameArt), em várias versões.\n"
          "'use strict';\nwindow.VS = window.VS || {};\nwindow.VS.SFX_SAMPLES = " + json.dumps(web) + ";\n")
    (ROOT / 'js' / 'data' / 'sfx_samples.js').write_text(js, encoding='utf-8')
    print('web:', round(len(js) / 1024), 'KB')

if __name__ == '__main__':
    main()
