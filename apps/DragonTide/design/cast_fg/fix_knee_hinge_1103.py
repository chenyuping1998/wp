"""Knee hinge on both FG legs (Stone 2026-11-03 「後膝也補」).

Checked in thigh space over every exported frame (back knee -10..+2.7 deg,
front knee -14.5..+3.7 deg). Two rigid parts 45 px from the pivot always
shift ~8 px against each other on the deepest bend; at the concave crease
that reads as the knee's fold and is left alone. Fixed here:
  1. straightening opened the crease to background: the thigh now continues
     under the shin near the crease (the rest composite, outline included,
     within 8 px), so the opening shows the leg's own edge;
  2. leftover ink: a 3x3 dot on the front thigh (614,1082) and the back
     shin's cut-edge stroke running into the leg (row 1065, x 376-381),
     repainted with the surrounding fur (local mean of fur-toned pixels,
     feathered). The outline itself is not touched.
Thigh ink hidden under the shin at rest becomes fur too.
At rest only step 2 and one outline pixel at (382,1064) change. Run after fix_back_knee_1103.py.
"""
import hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, gaussian_filter, label, distance_transform_edt

D = Path(__file__).resolve().parent
L = D / 'layers'
CREASE = {'l': (383, 1062), 'r': (628, 1071)}
# leftover ink boxes (layer, x0, x1, y0, y1), inclusive; inside the silhouette, clear of the outline
STRAYS = [('leg_r_upper', 612, 617, 1080, 1084), ('leg_l_lower', 376, 381, 1064, 1067)]
Y, X = np.mgrid[:1536, :1024]
load = lambda n: np.array(Image.open(L / f'{n}.png').convert('RGBA')).astype(float)
layers = {n: load(n) for n in ('leg_l_upper', 'leg_l_lower', 'leg_r_upper', 'leg_r_lower')}
lum = lambda a: a[..., :3] @ [0.3, 0.59, 0.11]

for name, x0, x1, y0, y1 in STRAYS:
    a = layers[name]
    solid = a[..., 3] > 128
    box = (X >= x0) & (X <= x1) & (Y >= y0) & (Y <= y1)
    ink = solid & box & (lum(a) < 70)
    ring = solid & ~box & (np.abs(X - (x0 + x1) / 2) <= (x1 - x0) / 2 + 6) & (np.abs(Y - (y0 + y1) / 2) <= (y1 - y0) / 2 + 6) & (lum(a) >= 70) & (lum(a) < 110)
    mean = a[ring, :3].mean(0)
    w = np.clip(gaussian_filter(ink.astype(float), 0.7) * 1.6, 0, 1)[..., None] * solid[..., None]
    a[..., :3] = a[..., :3] * (1 - w) + mean * w
    print(f'{name}: {int(ink.sum())} px ink -> fur {mean.round()}')

# one fur pixel broke the back knee's outline at rest, between the thigh's and the shin's ink
a = layers['leg_l_lower']
a[1064, 382, :3] = a[1064, 383:385, :3].mean(0)
print('leg_l_lower: outline pixel (382,1064) inked')

# the thigh's ink hidden under the shin at rest showed as lines and dots once the
# knee straightened; never meant to be seen, it becomes fur (outline band kept)
PIVOT = {'l': (333, 1058), 'r': (580, 1077)}
for side, (px, py) in PIVOT.items():
    up, lo = layers[f'leg_{side}_upper'], layers[f'leg_{side}_lower']
    uS, lS = up[..., 3] > 128, lo[..., 3] > 250
    U = uS | (lo[..., 3] > 128)
    hidden = uS & lS & (lum(up) < 75) & (distance_transform_edt(U) > 4) & ((X - px) ** 2 + (Y - py) ** 2 <= 70 ** 2)
    fur = uS & (lum(up) >= 70) & (lum(up) < 110)
    _, (iy, ix) = distance_transform_edt(~fur, return_indices=True)
    up[hidden, :3] = up[iy[hidden], ix[hidden], :3]
    print(f'leg_{side}_upper: {int(hidden.sum())} px hidden ink -> fur')

for side, (cx, cy) in CREASE.items():
    up, lo = layers[f'leg_{side}_upper'], layers[f'leg_{side}_lower']
    uS, lS = up[..., 3] > 128, lo[..., 3] > 128
    alpha = lo[..., 3:4] / 255
    comp = up[..., :3] * (1 - alpha) + lo[..., :3] * alpha
    under = lS & ~uS & ((X - cx) ** 2 + (Y - cy) ** 2 <= 8 ** 2)
    up[under, :3] = comp[under]; up[under, 3] = lo[under, 3]
    print(f'leg_{side}: thigh continues under the shin, {int(under.sum())} px')

manifest = json.loads((D / 'source-manifest.json').read_text())
for name, a in layers.items():
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(L / f'{name}.png')
    manifest['layers'][name + '.png'] = hashlib.sha256((L / f'{name}.png').read_bytes()).hexdigest()
(D / 'source-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
