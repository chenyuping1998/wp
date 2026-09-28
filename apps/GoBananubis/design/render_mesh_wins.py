"""Offline render of the high-pay mesh wins, for LOOKING at them.

The gate (check_mesh_wins.mjs) measures triangle area, which cannot see a limb
drawn to a point with its area intact, a light sweep that misses the subject,
or a shadow in the wrong place. This draws what SymbolMeshWin.svelte draws —
plate, drop shadow, the posed mesh, the gold flash and the baked light sweep
through the same mesh — from vertices the gate dumps from the shipped
meshWin/*.ts, so there is no second copy of the motion to drift.

    node design/check_mesh_wins.mjs H2 --dump frames.json
    python design/render_mesh_wins.py frames.json out.png

Writes out.png (the beat, frame by frame) and out_zoom.png (the
deformation-only pose, rigid move removed, zoomed on the parts that bend).
Needs numpy + Pillow (math-sdk/env has both).
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

APP = Path(__file__).resolve().parents[1]
SPRITES = APP / 'static/assets/sprites/goBananasSymbolsV3'
SCALE = 3
GOLD = np.array([0xff, 0xd7, 0x5e], float) / 255
# must match make_symbol_layers.mjs
SHEEN_FRAMES, SHEEN_COLS, SHEEN_CELL = 24, 6, 128
# must match SymbolMeshWin.svelte
SHADOW_ALPHA, SHADOW_SPREAD, SHADOW_DROP = 0.55, 0.12, 3

# the parts that bend, per symbol, in canvas px
CROPS = {
    'H1': [('forelegs', (64, 46, 192, 110)), ('left legs', (62, 110, 112, 206)), ('right legs', (144, 110, 194, 206))],
    'H2': [('eye + brow', (80, 60, 216, 142)), ('tail + curl', (38, 126, 150, 200)), ('teardrop', (150, 120, 190, 200))],
    'H3': [('lid', (42, 46, 214, 100)), ('bananas', (46, 80, 214, 120))],
    'H4': [('loop', (80, 30, 176, 122)), ('arms', (64, 104, 192, 152)), ('shaft', (96, 140, 160, 226))],
    'L1': [('A', (30, 30, 226, 226))],
    'L2': [('K', (30, 30, 226, 226))],
    'L3': [('Q', (30, 30, 226, 226))],
    'L4': [('J', (30, 30, 226, 226))],
    'L5': [('10', (30, 30, 226, 226))],
    'W': [('ears + cobra', (50, 0, 210, 100)), ('mouth + banana', (50, 150, 190, 232))],
    'S': [('bow', (110, 40, 214, 110)), ('bunch', (36, 90, 214, 214))],
    'M': [('seal + eye', (60, 56, 204, 196))],
    'P': [('coin', (30, 30, 226, 226))],
}


def bilinear(tex, u, v):
    h, w = tex.shape[:2]
    x = np.clip(u * w - 0.5, 0, w - 1.001)
    y = np.clip(v * h - 0.5, 0, h - 1.001)
    x0, y0 = x.astype(int), y.astype(int)
    fx, fy = (x - x0)[:, None], (y - y0)[:, None]
    a = tex[y0, x0] * (1 - fx) + tex[y0, x0 + 1] * fx
    b = tex[y0 + 1, x0] * (1 - fx) + tex[y0 + 1, x0 + 1] * fx
    return a * (1 - fy) + b * fy


def rasterize(verts, uvs, indices, tex, size):
    """straight-alpha RGBA of the textured mesh composited over nothing"""
    out = np.zeros((size, size, 4), float)
    p = verts.reshape(-1, 2) * SCALE
    t = uvs.reshape(-1, 2)
    for tri in indices.reshape(-1, 3):
        (ax, ay), (bx, by), (cx, cy) = p[tri]
        x0, x1 = int(max(0, np.floor(min(ax, bx, cx)))), int(min(size - 1, np.ceil(max(ax, bx, cx))))
        y0, y1 = int(max(0, np.floor(min(ay, by, cy)))), int(min(size - 1, np.ceil(max(ay, by, cy))))
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
        uv = l1[inside, None] * t[tri[0]] + l2[inside, None] * t[tri[1]] + l3[inside, None] * t[tri[2]]
        col = bilinear(tex, uv[:, 0], uv[:, 1])
        a = col[:, 3:4]
        yy, xx = ys[inside].astype(int), xs[inside].astype(int)
        out[yy, xx, :3] = col[:, :3] * a + out[yy, xx, :3] * (1 - a)
        out[yy, xx, 3:4] = a + out[yy, xx, 3:4] * (1 - a)
    return out  # premultiplied rgb


def sheen_uvs(uvs, progress):
    f = int(round(progress * (SHEEN_FRAMES - 1)))
    col, row = f % SHEEN_COLS, f // SHEEN_COLS
    rows = -(-SHEEN_FRAMES // SHEEN_COLS)
    aw, ah = SHEEN_COLS * SHEEN_CELL, rows * SHEEN_CELL
    u = uvs.reshape(-1, 2)
    return np.column_stack([(col * SHEEN_CELL + u[:, 0] * SHEEN_CELL) / aw, (row * SHEEN_CELL + u[:, 1] * SHEEN_CELL) / ah]).ravel()


def compose(frame, data, textures, local=False):
    size = data['canvas'] * SCALE
    uvs = np.array(data['uvs'], float)
    indices = np.array(data['indices'], int)
    plate, subject, shadow, sheen, glow = textures
    img = plate.copy()
    verts = np.array(frame['local' if local else 'verts'], float)
    air = 0 if local else frame['air']
    if air > 0.001 and shadow is not None:
        # the drop shadow: stays on the stone, spreads and darkens as the subject
        # rises; follows the subject sideways, never up
        s = 1 + SHADOW_SPREAD * air
        feet = data['feetY'] * SCALE
        w = int(round(size * s))
        sh = Image.fromarray((shadow * 255).astype(np.uint8)).resize((w, w), Image.LANCZOS)
        sh = np.asarray(sh, float) / 255
        ox = int(round(size / 2 - w / 2 + frame['rigid']['dx'] * SCALE))
        oy = int(round(feet - feet * s + SHADOW_DROP * air * SCALE))
        canvas = np.zeros((size, size, 4))
        xs0, ys0 = max(0, ox), max(0, oy)
        xs1, ys1 = min(size, ox + w), min(size, oy + w)
        canvas[ys0:ys1, xs0:xs1] = sh[ys0 - oy:ys1 - oy, xs0 - ox:xs1 - ox]
        a = canvas[..., 3:4] * SHADOW_ALPHA * air
        img = img * (1 - a) + canvas[..., :3] * a
    mesh = rasterize(verts, uvs, indices, subject, size)
    img = img * (1 - mesh[..., 3:4]) + mesh[..., :3]
    if not local:
        lit = mesh if glow is None else rasterize(verts, uvs, indices, glow, size)
        img = np.clip(img + lit[..., :3] * GOLD * frame['flash'], 0, 1)
        if frame['sheen'] >= 0:
            light = rasterize(verts, sheen_uvs(uvs, frame['sheen']), indices, sheen, size)
            img = np.clip(img + light[..., :3], 0, 1)
    im = Image.fromarray((img * 255).astype(np.uint8))
    hit = 1 if local else frame['plateHit']
    if abs(hit - 1) > 1e-4:
        s = int(round(size * hit))
        big = im.resize((s, s), Image.LANCZOS)
        o = (s - size) // 2
        im = big.crop((o, o, o + size, o + size))
    return im


def main(dump, out_path):
    data = json.loads(Path(dump).read_text())
    sym = data['symbol']
    key = sym.lower()
    size = data['canvas'] * SCALE
    load = lambda n: np.asarray(Image.open(SPRITES / n).convert('RGBA'), float) / 255
    if data.get('mode') == 'panel':
        # the whole inside of the frame is the mesh, drawn from the art itself;
        # behind it, the reel's own dark cell
        plate = np.full((size, size, 3), 0.08)
        textures = (plate, load(f'{key}.png'), None, load(f'{key}_sheen.png'), load(f'{key}_glow.png'))
    else:
        plate = np.asarray(Image.open(SPRITES / f'{key}_plate.png').convert('RGB').resize((size, size), Image.LANCZOS), float) / 255
        textures = (plate, load(f'{key}_subject.png'), load(f'{key}_shadow.png'), load(f'{key}_sheen.png'), None)

    frames = [(f['ms'], compose(f, data, textures), compose(f, data, textures, local=True)) for f in data['frames']]

    cols = 5
    rows = -(-len(frames) // cols)
    cell = size // 2
    sheet = Image.new('RGB', (cols * cell, rows * (cell + 16)), (20, 20, 24))
    d = ImageDraw.Draw(sheet)
    for i, (ms, im, _) in enumerate(frames):
        x, y = (i % cols) * cell, (i // cols) * (cell + 16)
        sheet.paste(im.resize((cell, cell), Image.LANCZOS), (x, y + 16))
        d.text((x + 4, y + 2), f'{sym} {ms}ms', fill=(255, 220, 120))
    sheet.save(out_path)

    crops = CROPS[sym]
    k = 3
    widths = [(b[2] - b[0]) * k for _, b in crops]
    heights = [(b[3] - b[1]) * k for _, b in crops]
    row_h = max(heights) + 16
    zoom = Image.new('RGB', (sum(widths) + 8 * len(crops), len(frames) * row_h), (20, 20, 24))
    dz = ImageDraw.Draw(zoom)
    for r, (ms, _, loc) in enumerate(frames):
        x = 0
        for (name, (a, b, c, e)), w, h in zip(crops, widths, heights):
            piece = loc.crop((a * SCALE, b * SCALE, c * SCALE, e * SCALE)).resize((w, h), Image.LANCZOS)
            zoom.paste(piece, (x, r * row_h + 16))
            dz.text((x + 4, r * row_h + 2), f'{ms}ms {name}', fill=(255, 220, 120))
            x += w + 8
    zoom_path = Path(out_path).with_name(Path(out_path).stem + '_zoom.png')
    zoom.save(zoom_path)
    print(f'{out_path}\n{zoom_path}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
