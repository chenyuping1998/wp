"""Colour each layer by its bone weights (blend of per-bone colours)."""
import json, sys, colorsys
from pathlib import Path
import numpy as np, cv2
from PIL import Image
D = Path(__file__).resolve().parent
who, out = sys.argv[1], sys.argv[2]
rig = json.load(open(D / 'out' / who / 'rig.base.json'))
names = [b['name'] for b in rig['bones']]
col = {n: np.array(colorsys.hsv_to_rgb((i * 0.618) % 1, 0.85, 1.0)) for i, n in enumerate(names)}
tiles = []
for L in rig['turf']['layers']:
  slot = L['name']; m = json.load(open(D / 'out' / who / f'{slot}.mesh.json'))
  W = np.load(D / 'out' / who / f'{slot}.weights.npy')
  V = np.array(m['verts']); T = np.array(m['tris']); x0, y0, x1, y1 = m['box']
  C = W @ np.stack([col[n] for n in m['names']])
  img = np.zeros((1536, 1024, 3), np.float32)
  # per-pixel barycentric colour
  ids = np.full((1536, 1024), -1, np.float32)
  for i, (a, b, c) in enumerate(T):
    cv2.fillConvexPoly(ids, np.round(np.stack([V[a], V[b], V[c]]) * 16).astype(np.int32), float(i), shift=4)
  yy, xx = np.nonzero(ids >= 0); ti = ids[yy, xx].astype(int)
  pa, pb, pc = V[T[ti, 0]], V[T[ti, 1]], V[T[ti, 2]]; px, py = xx + .5, yy + .5
  d = (pb[:, 1] - pc[:, 1]) * (pa[:, 0] - pc[:, 0]) + (pc[:, 0] - pb[:, 0]) * (pa[:, 1] - pc[:, 1])
  l1 = ((pb[:, 1] - pc[:, 1]) * (px - pc[:, 0]) + (pc[:, 0] - pb[:, 0]) * (py - pc[:, 1])) / d
  l2 = ((pc[:, 1] - pa[:, 1]) * (px - pc[:, 0]) + (pa[:, 0] - pc[:, 0]) * (py - pc[:, 1])) / d
  img[yy, xx] = l1[:, None] * C[T[ti, 0]] + l2[:, None] * C[T[ti, 1]] + (1 - l1 - l2)[:, None] * C[T[ti, 2]]
  src = np.zeros((1536, 1024, 4), np.uint8); src[y0:y1, x0:x1] = np.asarray(Image.open(D / 'out' / who / f'{slot}.png').convert('RGBA'))
  a = src[..., 3:4] / 255.0; lum = src[..., :3].mean(2, keepdims=True) / 255.0
  shown = (img * (0.45 + 0.55 * lum)) * a + 0.15 * (1 - a)
  tiles.append(Image.fromarray((shown * 255).astype(np.uint8)).resize((512, 768)))
sheet = Image.new('RGB', (512 * len(tiles), 768))
for i, t in enumerate(tiles): sheet.paste(t, (512 * i, 0))
sheet.save(out, quality=90); print(out)
