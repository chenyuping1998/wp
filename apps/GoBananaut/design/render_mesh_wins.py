"""Offline render of the mesh wins, for LOOKING at them. Ported from GoBananubis.

The gate (check_mesh_wins.mjs) measures triangle area, which cannot see a limb
drawn to a point with its area intact, a light sweep that misses the subject,
or a shadow in the wrong place. This draws what SymbolMeshWin.svelte draws —
the dark board, drop shadow, the posed mesh, the flash and the baked light sweep
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
# must match make_symbol_layers.mjs
SHEEN_FRAMES, SHEEN_COLS, SHEEN_CELL = 24, 6, 128
# must match SymbolMeshWin.svelte
SHADOW_ALPHA, SHADOW_SPREAD, SHADOW_DROP = 0.45, 0.12, 3
# the board behind a cell (BoardBase's hull, roughly)
BOARD = (0.08, 0.10, 0.13)

# the parts that bend, per symbol, in canvas px
CROPS = {
    'H1': [('storm + bands', (80, 60, 190, 190))],
    'H2': [('rock + craters', (24, 96, 144, 214)), ('streaks', (100, 16, 240, 160))],
    'H3': [('buckles', (60, 80, 140, 145)), ('tread', (20, 140, 236, 196))],
    'H4': [('gauge + lamps', (150, 90, 230, 165)), ('knobs', (160, 165, 230, 195))],
    'L1': [('A', (30, 30, 226, 226))],
    'L2': [('K', (30, 30, 226, 226))],
    'L3': [('Q', (30, 30, 226, 226))],
    'L4': [('J', (30, 30, 226, 226))],
    'L5': [('10', (30, 30, 226, 226))],
    'W': [('cheeks + banana', (90, 130, 190, 230)), ('pods', (26, 46, 230, 110))],
    'S': [('bulb + cage', (92, 30, 230, 180))],
    'G': [('nose', (130, 0, 256, 130)), ('tail', (0, 120, 140, 256))],
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
    tint = np.array([(data['flashTint'] >> 16) & 255, (data['flashTint'] >> 8) & 255, data['flashTint'] & 255], float) / 255
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
        img = np.clip(img + lit[..., :3] * tint * frame['flash'], 0, 1)
        if data.get('featureTint') is not None and frame.get('feature', 0) > 0:
            ft = data['featureTint']
            ftint = np.array([(ft >> 16) & 255, (ft >> 8) & 255, ft & 255], float) / 255
            feat = np.asarray(Image.open(SPRITES / f"{data['symbol'].lower()}_feature.png").convert('RGBA'), float) / 255
            glow = rasterize(verts, uvs, indices, feat, size)
            img = np.clip(img + glow[..., :3] * ftint * frame['feature'], 0, 1)
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
        plate = np.full((size, size, 3), BOARD)
        textures = (plate, load(f'{key}.png'), None, load(f'{key}_sheen.png'), load(f'{key}_glow.png'))
    else:
        # Bananaut's cut-outs stand on no plate: the mesh draws the sprite itself
        # over the dark board
        plate = np.full((size, size, 3), BOARD)
        textures = (plate, load(f'{key}.png'), load(f'{key}_shadow.png'), load(f'{key}_sheen.png'), None)

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
