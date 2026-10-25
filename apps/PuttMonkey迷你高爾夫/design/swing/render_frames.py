"""Paint dump_frames.mjs's triangles into a contact sheet (one cell per frame).

    python -I design/swing/render_frames.py frames.json sheet.png [cols] [scale]
"""
import json
import sys

import numpy as np
from PIL import Image, ImageDraw

src, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
scale = float(sys.argv[4]) if len(sys.argv) > 4 else 0.45
d = json.load(open(src, encoding='utf-8'))
page = np.asarray(Image.open(d['page']).convert('RGBA'), float) / 255
PH, PW = page.shape[:2]
# the cell: skeleton x -700..440, y -40..1000 (room for a ball in flight)
X0, X1, Y0, Y1 = -700, 440, -40, 1000
CW, CH = int((X1 - X0) * scale), int((Y1 - Y0) * scale)


def raster(canvas, P, UV, alpha):
    """one textured triangle, nearest-texel, over the canvas (premultiplied over)"""
    x0, y0 = np.floor(P.min(0)).astype(int)
    x1, y1 = np.ceil(P.max(0)).astype(int)
    x0, y0 = max(x0, 0), max(y0, 0)
    x1, y1 = min(x1, canvas.shape[1] - 1), min(y1, canvas.shape[0] - 1)
    if x1 < x0 or y1 < y0:
        return
    (ax, ay), (bx, by), (cx, cy) = P
    det = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
    if abs(det) < 1e-9:
        return
    ys, xs = np.mgrid[y0:y1 + 1, x0:x1 + 1]
    px, py = xs + 0.5, ys + 0.5
    l1 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / det
    l2 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / det
    l3 = 1 - l1 - l2
    m = (l1 >= -1e-6) & (l2 >= -1e-6) & (l3 >= -1e-6)
    if not m.any():
        return
    u = l1 * UV[0, 0] + l2 * UV[1, 0] + l3 * UV[2, 0]
    v = l1 * UV[0, 1] + l2 * UV[1, 1] + l3 * UV[2, 1]
    tx = np.clip((u * PW).astype(int), 0, PW - 1)
    ty = np.clip((v * PH).astype(int), 0, PH - 1)
    texel = page[ty, tx]
    a = texel[..., 3] * alpha * m
    reg = canvas[y0:y1 + 1, x0:x1 + 1]
    reg[..., :3] = reg[..., :3] * (1 - a[..., None]) + texel[..., :3] * a[..., None]


n = len(d['frames'])
rows = (n + cols - 1) // cols
sheet = Image.new('RGB', (CW * cols, (CH + 22) * rows), (40, 90, 140))
draw = ImageDraw.Draw(sheet)
for i, f in enumerate(d['frames']):
    cv = np.zeros((CH, CW, 3))
    cv[...] = np.array([60, 110, 160]) / 255
    # ground line
    gy = int((Y1 - 0) * scale)
    cv[gy:gy + 2] = np.array([30, 70, 40]) / 255
    for dr in f['draws']:
        xy = np.array(dr['xy']).reshape(-1, 2)
        P = np.stack([(xy[:, 0] - X0) * scale, (Y1 - xy[:, 1]) * scale], 1)
        UV = np.array(dr['uv']).reshape(-1, 2)
        T = np.array(dr['tri']).reshape(-1, 3)
        for t in T:
            raster(cv, P[t], UV[t], dr['a'])
    cell = Image.fromarray((cv * 255).clip(0, 255).astype(np.uint8))
    x, y = (i % cols) * CW, (i // cols) * (CH + 22)
    sheet.paste(cell, (x, y + 22))
    draw.text((x + 6, y + 4), f"{f['clip']} {f['t']:.2f}s", fill=(255, 255, 255))
sheet.save(out)
