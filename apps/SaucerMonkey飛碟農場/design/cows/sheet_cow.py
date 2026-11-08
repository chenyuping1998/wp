"""Contact sheet of the field cow's frames over a patch of the real night field:
   python design/cows/sheet_cow.py dump.json out.png [scale]"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
APP = Path(__file__).resolve().parents[2]
d = json.load(open(sys.argv[1])); out = sys.argv[2]; S = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
tex = np.asarray(Image.open(APP / 'static/assets/sprites/saucerNight/cow_walk.png').convert('RGBA'), float)
plate = Image.open(APP / 'static/assets/sprites/sushiBackground/bg_base.png').convert('RGB')
cw = d['canvas'][0]
T = int(cw * S)
def raster(verts):
    out = np.zeros((T, T, 4)); th, tw = tex.shape[:2]; idx = d['indices']; uvs = d['uvs']
    for k in range(0, len(idx), 3):
        ids = idx[k:k + 3]
        p = np.array([[verts[i * 2] * S, verts[i * 2 + 1] * S] for i in ids]); uv = np.array([[uvs[i * 2], uvs[i * 2 + 1]] for i in ids])
        x0, y0 = np.floor(p.min(0)).astype(int); x1, y1 = np.ceil(p.max(0)).astype(int)
        x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, T - 1), min(y1, T - 1)
        if x1 < x0 or y1 < y0: continue
        ys, xs = np.mgrid[y0:y1 + 1, x0:x1 + 1]; px, py = xs + .5, ys + .5
        (ax, ay), (bx, by), (cx, cy) = p
        den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(den) < 1e-9: continue
        l1 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / den; l2 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / den; l3 = 1 - l1 - l2
        m = (l1 >= -1e-6) & (l2 >= -1e-6) & (l3 >= -1e-6)
        if not m.any(): continue
        u = l1 * uv[0, 0] + l2 * uv[1, 0] + l3 * uv[2, 0]; v = l1 * uv[0, 1] + l2 * uv[1, 1] + l3 * uv[2, 1]
        tx = np.clip((u * tw).astype(int), 0, tw - 1); ty = np.clip((v * th).astype(int), 0, th - 1)
        out[ys[m], xs[m]] = tex[ty[m], tx[m]]
    return out
bg = plate.crop((800, 470, 800 + T, 470 + T)).resize((T, T))
tiles = []
for f in d['frames']:
    a = raster(f['verts']).astype(np.uint8)
    t = bg.copy().convert('RGBA'); t.alpha_composite(Image.fromarray(a, 'RGBA'))
    dr = ImageDraw.Draw(t); gy = d['ground'] * S
    dr.line([(0, gy), (T, gy)], fill=(255, 90, 90, 160)); dr.text((4, 4), f['label'], fill=(255, 230, 120, 255))
    tiles.append(t)
cols = min(6, len(tiles)); rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (cols * T, rows * T), (20, 20, 30))
for i, t in enumerate(tiles): sheet.paste(t.convert('RGB'), ((i % cols) * T, (i // cols) * T))
sheet.save(out); print(out, sheet.size)
