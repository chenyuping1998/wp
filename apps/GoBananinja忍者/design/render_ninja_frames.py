"""Draw what design/dump_ninja_frames.mjs posed: every attachment's triangles
textured from the atlas page, frame by frame, plus an optional zoom box.

    node design/dump_ninja_frames.mjs idle 0.2,0.6,1.0 frames.json
    python design/render_ninja_frames.py frames.json out.png [x0,y0,x1,y1] [--wire]

The zoom box is in SHEET pixels (the 1024x1536 source; world = (x-512, 1510-y)).
"""
import json
import sys

import numpy as np
from PIL import Image, ImageDraw


def bilinear(tex, u, v):
    h, w = tex.shape[:2]
    x = np.clip(u * w - 0.5, 0, w - 1.001)
    y = np.clip(v * h - 0.5, 0, h - 1.001)
    x0, y0 = x.astype(int), y.astype(int)
    fx, fy = (x - x0)[:, None], (y - y0)[:, None]
    a = tex[y0, x0] * (1 - fx) + tex[y0, x0 + 1] * fx
    b = tex[y0 + 1, x0] * (1 - fx) + tex[y0 + 1, x0 + 1] * fx
    return a * (1 - fy) + b * fy


def draw(img, pts, uvs, tris, tex):
    H, W = img.shape[:2]
    for tri in tris.reshape(-1, 3):
        (ax, ay), (bx, by), (cx, cy) = pts[tri]
        x0, x1 = int(max(0, np.floor(min(ax, bx, cx)))), int(min(W - 1, np.ceil(max(ax, bx, cx))))
        y0, y1 = int(max(0, np.floor(min(ay, by, cy)))), int(min(H - 1, np.ceil(max(ay, by, cy))))
        if x1 < x0 or y1 < y0:
            continue
        den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(den) < 1e-9:
            continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        l1 = ((by - cy) * (xs - cx) + (cx - bx) * (ys - cy)) / den
        l2 = ((cy - ay) * (xs - cx) + (ax - cx) * (ys - cy)) / den
        l3 = 1 - l1 - l2
        inside = (l1 >= -1e-6) & (l2 >= -1e-6) & (l3 >= -1e-6)
        if not inside.any():
            continue
        uv = l1[inside, None] * uvs[tri[0]] + l2[inside, None] * uvs[tri[1]] + l3[inside, None] * uvs[tri[2]]
        col = bilinear(tex, uv[:, 0], uv[:, 1])
        a = col[:, 3:4]
        yy, xx = ys[inside].astype(int), xs[inside].astype(int)
        img[yy, xx] = col[:, :3] * a + img[yy, xx] * (1 - a)


def main():
    data = json.load(open(sys.argv[1], encoding='utf-8'))
    out = sys.argv[2]
    box = [int(v) for v in sys.argv[3].split(',')] if len(sys.argv) > 3 and not sys.argv[3].startswith('--') else [0, 0, 1024, 1536]
    wire = '--wire' in sys.argv
    tex = np.asarray(Image.open(data['page']).convert('RGBA'), float) / 255
    x0, y0, x1, y1 = box
    scale = min(600 / (x1 - x0), 900 / (y1 - y0))
    w, h = int((x1 - x0) * scale), int((y1 - y0) * scale)
    tiles = []
    for fr in data['frames']:
        img = np.zeros((h, w, 3)) + np.array([0.16, 0.18, 0.24])
        wires = []
        for s in fr['slots']:
            v = np.array(s['verts'], float).reshape(-1, 2)
            pts = np.column_stack([(v[:, 0] + 512 - x0) * scale, (1510 - v[:, 1] - y0) * scale])
            uvs = np.array(s['uvs'], float).reshape(-1, 2)
            tris = np.array(s['tris'], int)
            draw(img, pts, uvs, tris, tex)
            if wire and s['name'] in ('band_tails', 'sash_end', 'cord_end', 'charm'):
                wires.append((pts, tris))
        im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
        d = ImageDraw.Draw(im)
        for pts, tris in wires:
            for tri in tris.reshape(-1, 3):
                d.polygon([tuple(pts[k]) for k in tri], outline=(80, 255, 120))
        d.text((6, 6), f"{data['anim']} {fr['t']:.2f}s", fill=(255, 220, 120))
        tiles.append(im)
    cols = min(5, len(tiles))
    rows = -(-len(tiles) // cols)
    sheet = Image.new('RGB', (cols * w, rows * h), (20, 20, 24))
    for i, im in enumerate(tiles):
        sheet.paste(im, ((i % cols) * w, (i // cols) * h))
    sheet.save(out)
    print(out)


if __name__ == '__main__':
    main()
