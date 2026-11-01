"""MG finishing after rebuild_limbs_1030: neck beside the chin, clean hand edges, torso hem.
Usage: finish_limbs_1030.py <dir with restored layers>; writes neck and hand layers there too."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_closing, binary_erosion, binary_fill_holes, distance_transform_edt, gaussian_filter, label

D = Path(__file__).resolve().parent; O = Path(sys.argv[1]); SRC = Path(sys.argv[2])
INK = np.array([18, 14, 14.])
load = lambda p: np.array(Image.open(p).convert('RGBA')).astype(float)
def nearest_fill(a, new, source):
    _, n = distance_transform_edt(~source, return_indices=True)
    a[new, :3] = a[n[0][new], n[1][new], :3]; a[new, 3] = 255
def poly(points):
    im = Image.new('1', (1024, 1536)); ImageDraw.Draw(im).polygon(points, fill=1); return np.array(im)
def rim(a, region, width=4.0):
    m = a[..., 3] > 128; depth = distance_transform_edt(m)
    w = (np.clip(width + .5 - depth, 0, 1) * region * m)[..., None]
    a[..., :3] = a[..., :3] * (1 - w) + INK * w

# Neck: no square corner beside the chin; the shoulder lies behind it now.
a = load(SRC / 'neck.png')
Y, X = np.mgrid[:1536, :1024]
curve = 372 + (560 - Y).clip(0, 60) * .25
cut = (X < curve) & (Y > 500) & (Y < 600)
t = np.clip(curve - X, 0, 1.5) / 1.5
a[..., 3] *= 1 - t * cut
rim(a, cut | ((X < curve + 6) & (Y > 500) & (Y < 600)))
a[a[..., 3] == 0, :3] = 0
Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(O / 'neck.png')

# Hands: light specks in the edge fringe become ink; loose specks go.
for path in sorted(SRC.glob('hand_*.png')):
    a = load(path); m = a[..., 3] > 0
    edge = m & ~binary_erosion(m, iterations=5)
    light = edge & (a[..., :3].mean(-1) > 118)
    a[light, :3] = INK
    ids, k = label(a[..., 3] > 128, np.ones((3, 3)))
    if k > 1:
        sizes = np.bincount(ids.ravel()); sizes[0] = 0
        keep = ids == sizes.argmax()
        a[(ids > 0) & ~keep] = 0
    a[a[..., 3] == 0, :3] = 0
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(O / path.name)

# Torso hem: olive specks from the first cut.
a = load(SRC / 'torso.png')
zone = poly([(325, 790), (385, 790), (385, 880), (325, 880)])
olive = zone & (a[..., 3] > 0) & (a[..., 1] > 70) & (a[..., 2] < 110) & (a[..., 0] - a[..., 1] < 110) & (a[..., 0] > 60)
src = zone & (a[..., 3] > 128) & (a[..., 0] > 120) & (a[..., 1] < 50)
print('olive px', int(olive.sum()))
if olive.any() and src.any():
    _, n = distance_transform_edt(~src, return_indices=True)
    a[olive, :3] = a[n[0][olive], n[1][olive], :3]
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(O / 'torso.png')
