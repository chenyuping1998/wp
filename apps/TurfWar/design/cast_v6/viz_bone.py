"""Per-bone weight maps (grayscale) for one layer: viz_bone.py who slot out.jpg"""
import json, sys
from pathlib import Path
import numpy as np, cv2
from PIL import Image, ImageDraw
D = Path(__file__).resolve().parent
who, slot, out = sys.argv[1:4]
m = json.load(open(D / 'out' / who / f'{slot}.mesh.json')); W = np.load(D / 'out' / who / f'{slot}.weights.npy')
V = np.array(m['verts']); T = np.array(m['tris']); x0, y0, x1, y1 = m['box']
src = np.asarray(Image.open(D / 'out' / who / f'{slot}.png').convert('RGBA')).astype(float) / 255
tiles = []
for b, name in enumerate(m['names']):
  if W[:, b].max() < 0.01: continue
  img = np.zeros((y1 - y0, x1 - x0), np.float32)
  for (a, bb, c) in T:
    w = (W[a, b] + W[bb, b] + W[c, b]) / 3
    cv2.fillConvexPoly(img, np.round((np.stack([V[a], V[bb], V[c]]) - (x0, y0)) * 16).astype(np.int32), float(w), shift=4)
  rgb = np.stack([img, img * 0.6, 1 - img], 2) * (0.35 + 0.65 * src[..., :3].mean(2, keepdims=True))
  rgb = rgb * src[..., 3:4] + 0.1 * (1 - src[..., 3:4])
  im = Image.fromarray((rgb * 255).astype(np.uint8)); ImageDraw.Draw(im).text((4, 4), name, fill=(255, 255, 0))
  tiles.append(im)
w, h = tiles[0].size
sh = Image.new('RGB', (w * len(tiles), h))
for i, t in enumerate(tiles): sh.paste(t, (i * w, 0))
sh.save(out, quality=90); print(out, sh.size)
