"""Prepara as faixas licenciadas dos chefes: corta o silêncio do início e do fim, termina com um desvanecer curto,
iguala o volume (-24 LUFS, pico -1.5 dB) e grava em OGG para o jogo web (assets/audio/music) e para o Godot
(godot/audio/music). Uso: python3 tools/prep_music.py <origem> <id> [segundos_max | loop]"""
import subprocess, sys, pathlib, shutil
import numpy as np
ROOT = pathlib.Path(__file__).resolve().parents[1]

def pcm(src):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', '11025', '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(float) / 32768, 11025

def bounds(src):
    y, sr = pcm(src)
    hop = 512
    n = len(y) // hop
    rms = np.sqrt((y[:n * hop].reshape(n, hop) ** 2).mean(1))
    med = np.median(rms)
    on = rms > 0.25 * med
    s = np.argmax(on) * hop / sr
    e = (n - np.argmax(on[::-1])) * hop / sr
    return max(0.0, s - 0.05), e, len(y) / sr

def main():
    src, mid = sys.argv[1], sys.argv[2]
    loop = len(sys.argv) > 3 and sys.argv[3] == 'loop'      # faixa já feita para repetir sem costura
    cap = float(sys.argv[3]) if len(sys.argv) > 3 and not loop else 1e9
    s, e, total = bounds(src)
    if loop:
        s, e = 0.0, total
    e = min(e, s + cap)
    fade = 2.0 if total - e > 0.5 or cap < 1e9 else 0.6
    out = ROOT / 'assets' / 'audio' / 'music' / f'{mid}.ogg'
    out.parent.mkdir(parents=True, exist_ok=True)
    af = 'loudnorm=I=-24:TP=-1.5:LRA=11' if loop else f'atrim={s:.2f}:{e:.2f},asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st={e - s - fade:.2f}:d={fade},' \
         'loudnorm=I=-24:TP=-1.5:LRA=11'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af, '-ar', '44100', '-ac', '2',
                    '-c:a', 'libvorbis', '-q:a', '5', str(out)], check=True)
    shutil.copy(out, ROOT / 'godot' / 'audio' / 'music' / f'{mid}.ogg')
    print(mid, f'{s:.1f}-{e:.1f}s de {total:.1f}s', out.stat().st_size // 1024, 'KB')

if __name__ == '__main__':
    main()
