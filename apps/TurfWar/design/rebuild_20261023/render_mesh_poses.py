"""Rasterise dump_mesh_poses.mjs output at full resolution (QA only).
   python render_mesh_poses.py <base|fg> poses.json out.png x0,y0,x1,y1 scale"""
import sys, json
from pathlib import Path
import numpy as np
from PIL import Image
APP = Path(__file__).resolve().parents[2]
variant, poses, out = sys.argv[1:4]
crop = tuple(map(int, sys.argv[4].split(','))); scale = float(sys.argv[5])
x0c, y0c, x1c, y1c = crop
W, H = x1c - x0c, y1c - y0c
tiles = []
for f in json.load(open(poses)):
  canvas = np.zeros((H, W, 4), np.float32); canvas[..., :3] = (32, 36, 46); canvas[..., 3] = 255
  for s in f['slots']:
    tex = np.asarray(Image.open(APP / 'static/assets/castLayers/turf/v5' / variant / f"{s['name']}.png").convert('RGBA')).astype(np.float32)
    th, tw = tex.shape[:2]
    V = np.asarray(s['verts']) - (x0c, y0c); UV = np.asarray(s['uvs']).reshape(-1, 2); T = np.asarray(s['tris']).reshape(-1, 3)
    layer = np.zeros((H, W, 4), np.float32)
    for a, b, c in T:
      pa, pb, pc = V[a], V[b], V[c]
      bx0, by0 = np.floor(np.minimum(np.minimum(pa, pb), pc)).astype(int); bx1, by1 = np.ceil(np.maximum(np.maximum(pa, pb), pc)).astype(int)
      bx0, by0 = max(bx0, 0), max(by0, 0); bx1, by1 = min(bx1, W - 1), min(by1, H - 1)
      if bx1 < bx0 or by1 < by0: continue
      yy, xx = np.mgrid[by0:by1 + 1, bx0:bx1 + 1] + 0.5
      d = (pb[1] - pc[1]) * (pa[0] - pc[0]) + (pc[0] - pb[0]) * (pa[1] - pc[1])
      if abs(d) < 1e-9: continue
      l1 = ((pb[1] - pc[1]) * (xx - pc[0]) + (pc[0] - pb[0]) * (yy - pc[1])) / d
      l2 = ((pc[1] - pa[1]) * (xx - pc[0]) + (pa[0] - pc[0]) * (yy - pc[1])) / d
      l3 = 1 - l1 - l2
      m = (l1 >= -1e-4) & (l2 >= -1e-4) & (l3 >= -1e-4)
      if not m.any(): continue
      u = l1 * UV[a, 0] + l2 * UV[b, 0] + l3 * UV[c, 0]; v = l1 * UV[a, 1] + l2 * UV[b, 1] + l3 * UV[c, 1]
      px = np.clip((u * tw).astype(int), 0, tw - 1); py = np.clip((v * th).astype(int), 0, th - 1)
      sub = layer[by0:by1 + 1, bx0:bx1 + 1]
      sub[m] = tex[py[m], px[m]]
    al = layer[..., 3:4] / 255
    canvas[..., :3] = layer[..., :3] * al + canvas[..., :3] * (1 - al)
  tiles.append(Image.fromarray(canvas.astype(np.uint8)).resize((int(W * scale), int(H * scale))))
sheet = Image.new('RGBA', (tiles[0].width * len(tiles), tiles[0].height))
for i, t in enumerate(tiles): sheet.paste(t, (i * t.width, 0))
sheet.convert('RGB').save(out)
