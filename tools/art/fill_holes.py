"""Tapa os buracos transparentes dentro das figuras (a máscara e a gema da protagonista ficaram recortadas
quando se tirou o fundo). Só tapa buracos fechados cuja orla é clara (máscara) ou quente (brasa do peito);
os vãos escuros entre braços e corpo ficam como estão. Pinta por "inpainting" a partir das cores à volta."""
import json, sys, numpy as np, pathlib, cv2
from PIL import Image
from scipy import ndimage

meta = json.load(open(sys.argv[1])); folder = pathlib.Path(sys.argv[2])
for nm in sys.argv[3:]:
    p = folder / f'{nm}.png'
    orig = pathlib.Path(__file__).parent / 'orig' / f'{nm}.png'
    if not orig.exists(): Image.open(p).save(orig)
    im = np.array(Image.open(p).convert('RGBA'))
    n_fixed = 0
    for f in meta[nm]['frames']:
        y0, x0, h, w = f['y'], f['x'], f['h'], f['w']
        sub = im[y0:y0+h, x0:x0+w]
        a = sub[..., 3] > 40
        # buracos fechados e também entalhes abertos para fora (fecho morfológico) — a máscara ficou roída pela borda
        st = ndimage.generate_binary_structure(2, 1)
        closed = ndimage.binary_closing(np.pad(a, 6), structure=st, iterations=5)[6:-6, 6:-6]
        holes = (ndimage.binary_fill_holes(a) | closed) & ~a
        lab, n = ndimage.label(holes)
        mask = np.zeros(a.shape, np.uint8)
        for k in range(1, n + 1):
            hk = lab == k
            ring = ndimage.binary_dilation(hk, iterations=2) & a
            if ring.sum() < 4: continue
            rc = sub[ring][:, :3].astype(float)
            lum = (rc @ [0.3, 0.59, 0.11]).mean()
            warm = (rc[:, 0] - rc[:, 2]).mean()
            if (lum > 115 and hk.sum() >= 3) or (warm > 60 and lum > 70):
                mask[ndimage.binary_dilation(hk, iterations=1) & ~a | hk] = 255
        if mask.any():
            rgb = cv2.cvtColor(sub[..., :3].copy(), cv2.COLOR_RGB2BGR)
            # píxeis transparentes têm cor lixo: marca-os todos para inpaint além do buraco, mas só pinta o buraco
            fillm = mask.copy(); fillm[~a] = 255
            out = cv2.inpaint(rgb, fillm, 3, cv2.INPAINT_TELEA)
            out = cv2.cvtColor(out, cv2.COLOR_BGR2RGB)
            m = mask > 0
            sub[m, :3] = out[m]; sub[m, 3] = 255
            n_fixed += int(m.sum())
    Image.fromarray(im).save(p)
    print(nm, 'píxeis tapados:', n_fixed)
