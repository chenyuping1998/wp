"""Background motion layers (2026-10-14): cut-outs, masks and the flow map
that src/components/BackgroundFx.svelte animates. Everything is derived from
the approved background plates, so nothing new is painted.

  bg_fx_brine.png     FS plate, only the green brine (+ its own ink edges)
  bg_fx_flowmap.png   256² tileable flow noise for the displacement filter
  bg_fx_tankmask.png  MG plate, the two pink fermentation tanks as an alpha mask
  bg_fx_meta.json     crop offsets + star positions found in the MG sky

  /Applications/anaconda3/bin/python3 design/build_bg_fx.py
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

APP = Path(__file__).resolve().parents[1]
A = APP / 'static/assets/pickle'
meta = {}

# ── brine cut-out (FS) ──────────────────────────────────────────────────────
fs = np.array(Image.open(A / 'bg_feature_v2.webp').convert('RGBA'))
f = fs[..., :3].astype(float) / 255
r, g, b = f[..., 0], f[..., 1], f[..., 2]
mx, mn = f.max(-1), f.min(-1)
green = (g > r * 1.08) & (g > b * 1.15) & ((mx - mn) / (mx + 1e-6) > 0.35) & (mx > 0.3)
green[:, 1010:] = False
green = ndimage.binary_opening(green, iterations=1)
# keep blobs of real size only (a stray green pixel on a pipe is not brine)
lab, n = ndimage.label(green)
sizes = ndimage.sum(green, lab, range(1, n + 1))
keep = np.isin(lab, 1 + np.where(sizes > 400)[0])
# grow 5 px so the brine's own ink outline moves with it; feather the edge
grown = ndimage.binary_dilation(keep, iterations=5)
alpha = ndimage.gaussian_filter(grown.astype(float), 1.2)
ys, xs = np.where(grown)
x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
cut = fs[y0:y1, x0:x1].copy()
cut[..., 3] = (np.clip(alpha[y0:y1, x0:x1], 0, 1) * 255).astype(np.uint8)
Image.fromarray(cut).save(A / 'bg_fx_brine.png', optimize=True)
meta['brine'] = {'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0)}

# ── flow map: tileable, streaked along the flow (down and a little left) ────
rng = np.random.default_rng(14)
N = 256
def periodic_noise(stretch):
    spec = np.fft.fft2(rng.standard_normal((N, N)))
    ky, kx = np.meshgrid(np.fft.fftfreq(N), np.fft.fftfreq(N), indexing='ij')
    # anisotropic low-pass: long along y (the flow), short across it
    k = np.sqrt((kx * 1.0) ** 2 + (ky * stretch) ** 2)
    filt = np.exp(-(k / 0.035) ** 2)
    out = np.real(np.fft.ifft2(spec * filt))
    return (out - out.min()) / (out.max() - out.min())
rgch = np.stack([periodic_noise(3.2), periodic_noise(3.2), np.full((N, N), 0.5)], -1)
Image.fromarray((rgch * 255).astype(np.uint8)).save(A / 'bg_fx_flowmap.png', optimize=True)

# ── tank mask (MG) ─────────────────────────────────────────────────────────
base = np.array(Image.open(A / 'bg_base.webp').convert('RGB')).astype(float) / 255
r, g, b = base[..., 0], base[..., 1], base[..., 2]
pink = (r > 0.75) & (g > 0.35) & (g < 0.7) & (b < 0.6) & (r - b > 0.3)
pink[:, 560:] = False
pink[900:, :] = False
pink = ndimage.binary_closing(pink, iterations=6)
pink = ndimage.binary_fill_holes(pink)
lab, n = ndimage.label(pink)
sizes = ndimage.sum(pink, lab, range(1, n + 1))
pink = np.isin(lab, 1 + np.where(sizes > 3000)[0])
pink = ndimage.binary_erosion(pink, iterations=4)  # keep bubbles inside the glass
ys, xs = np.where(pink)
x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
m = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
m[..., :3] = 255
m[..., 3] = (ndimage.gaussian_filter(pink[y0:y1, x0:x1].astype(float), 1.0) * 255).astype(np.uint8)
Image.fromarray(m).save(A / 'bg_fx_tankmask.png', optimize=True)
meta['tanks'] = {'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0)}
# tank columns, for spawning bubbles where the glass actually is
cols = pink.sum(0)
meta['tankSpan'] = [int(xs.min()), int(xs.max())]
# per 8px column: liquid top and bottom inside the glass, so bubbles rise from
# the bottom of THEIR column and pop at its surface (2026-10-22)
cols = []
for c0 in range(0, x1 - x0, 8):
    rows = pink[y0:y1, x0 + c0:x0 + c0 + 8].any(1).nonzero()[0]
    cols.append([int(rows.min()), int(rows.max())] if len(rows) and rows.max() - rows.min() > 120 else None)
meta['tankCols'] = {'step': 8, 'cols': cols}

# ── stars in the MG sky ────────────────────────────────────────────────────
bright = (base.min(-1) > 0.82) & (base[..., 2] > 0.6)
bright[170:, :] = False
bright[:, :300] = False
bright[:, 830:] = False
lab, n = ndimage.label(bright)
stars = []
for i, sl in enumerate(ndimage.find_objects(lab)):
    area = (lab[sl] == i + 1).sum()
    if 12 <= area <= 400:
        cy, cx = ndimage.center_of_mass(lab[sl] == i + 1)
        stars.append({'x': int(sl[1].start + cx), 'y': int(sl[0].start + cy), 'r': int(max(sl[0].stop - sl[0].start, sl[1].stop - sl[1].start) / 2)})
meta['stars'] = stars
(A / 'bg_fx_meta.json').write_text(json.dumps(meta, indent=1))
print(json.dumps({k: v for k, v in meta.items() if k != 'stars'}), len(stars), 'stars')
