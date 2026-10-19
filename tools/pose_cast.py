"""Render a cast figure in a pose from its own Spine rig, transparent, for art.

    python pose_cast.py <Game> <mg|fg> <anim> <t seconds> <out.png> [scale]
    python pose_cast.py <Game> <mg|fg> <anim> sheet <out.png>   (contact sheet, 0.1s apart)

Poses come from the shipped skeleton (dump_cast_frames.mjs in Strike's design
folder, spine-core with physics), so a picture made from them matches what
the game plays. Rasterised with bilinear sampling at 2x and downsampled.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

APPS = Path(__file__).resolve().parents[1] / 'apps'
NODE = 'E:/stake/tools/node-v22.23.1-win-x64/node.exe'
DUMPER = next(APPS.glob('StrikeMonkey*')) / 'design/dump_cast_frames.mjs'


def dump(game, cast, anim):
    app = next(APPS.glob(f'{game}*'))
    sdir = app / 'static/assets/spines' / ('sushiMaster' if cast == 'mg' else 'sushiApprentice')
    out = Path(tempfile.gettempdir()) / f'pose_{game}_{cast}_{anim}.json'
    import os
    subprocess.run([NODE, str(DUMPER), cast, anim, str(out), '60'], check=True, capture_output=True,
                   env=dict(os.environ, SPINE_DIR=str(sdir)))
    return json.load(open(out)), np.asarray(Image.open(sdir / 'monkey.png').convert('RGBA')).astype(np.float32) / 255


def sample(page, u, v):
    PH, PW = page.shape[:2]
    x = np.clip(u * (PW - 1), 0, PW - 1.001)
    y = np.clip(v * (PH - 1), 0, PH - 1.001)
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    fx, fy = (x - x0)[..., None], (y - y0)[..., None]
    a, b = page[y0, x0], page[y0, x0 + 1]
    c, d = page[y0 + 1, x0], page[y0 + 1, x0 + 1]
    # premultiplied, so transparent texels do not bleed dark fringes
    pm = lambda p: np.concatenate([p[..., :3] * p[..., 3:], p[..., 3:]], -1)
    return pm(a) * (1 - fx) * (1 - fy) + pm(b) * fx * (1 - fy) + pm(c) * (1 - fx) * fy + pm(d) * fx * fy


def raster(frame, page, scale=1.0, ss=2):
    allv = np.concatenate([np.array(s['v']).reshape(-1, 2) for s in frame['slots']])
    x0, y0 = allv.min(0) - 6
    x1, y1 = allv.max(0) + 6
    k = scale * ss
    W, H = int((x1 - x0) * k) + 1, int((y1 - y0) * k) + 1
    img = np.zeros((H, W, 4), np.float32)  # premultiplied
    for s in frame['slots']:
        v = np.array(s['v']).reshape(-1, 2)
        px, py = (v[:, 0] - x0) * k, (y1 - v[:, 1]) * k
        uv = np.array(s['uv']).reshape(-1, 2)
        for a, b, c in np.array(s['tri']).reshape(-1, 3):
            xs, ys = px[[a, b, c]], py[[a, b, c]]
            bx0, bx1 = int(max(0, np.floor(xs.min()))), int(min(W - 1, np.ceil(xs.max())))
            by0, by1 = int(max(0, np.floor(ys.min()))), int(min(H - 1, np.ceil(ys.max())))
            if bx1 < bx0 or by1 < by0:
                continue
            gx, gy = np.meshgrid(np.arange(bx0, bx1 + 1) + 0.5, np.arange(by0, by1 + 1) + 0.5)
            dd = (ys[1] - ys[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (ys[0] - ys[2])
            if abs(dd) < 1e-9:
                continue
            l0 = ((ys[1] - ys[2]) * (gx - xs[2]) + (xs[2] - xs[1]) * (gy - ys[2])) / dd
            l1 = ((ys[2] - ys[0]) * (gx - xs[2]) + (xs[0] - xs[2]) * (gy - ys[2])) / dd
            l2 = 1 - l0 - l1
            m = (l0 >= -1e-4) & (l1 >= -1e-4) & (l2 >= -1e-4)
            if not m.any():
                continue
            u = l0 * uv[a, 0] + l1 * uv[b, 0] + l2 * uv[c, 0]
            w = l0 * uv[a, 1] + l1 * uv[b, 1] + l2 * uv[c, 1]
            col = sample(page, u, w) * m[..., None]
            reg = img[by0:by1 + 1, bx0:bx1 + 1]
            reg[:] = col + reg * (1 - col[..., 3:])
    out = img.copy()
    al = np.clip(out[..., 3:], 1e-6, 1)
    out[..., :3] = np.where(out[..., 3:] > 0, out[..., :3] / al, 0)
    im = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), 'RGBA')
    im = im.resize((W // ss, H // ss), Image.LANCZOS)
    # where the ground (skeleton y 0) is, in the output's pixels
    return im, (-x0 * scale, y1 * scale)


def pose(game, cast, anim, t, scale=1.0, face=None):
    """face: a head cel name ('laugh_4', 'blink', 'peak_blink'...). Every face
    cel is the same weighted mesh with its own UVs (generate_monkey_spine.mjs
    FACE_STATES), so the posed head takes that cel's UVs as they are."""
    data, page = dump(game, cast, anim)
    fr = min(data['frames'], key=lambda f: abs(f['t'] - t))
    if face:
        want = f'head_2_face_{face}'
        laugh, _ = dump(game, cast, 'chestbeat')
        uv = next((s['uv'] for f in laugh['frames'] for s in f['slots'] if s['att'] == want), None)
        if uv is None:
            raise SystemExit(f'no {want} in chestbeat')
        fr = {**fr, 'slots': [({**s, 'uv': uv} if s['slot'].startswith('head_2_face') else s) for s in fr['slots']]}
    return raster(fr, page, scale)


if __name__ == '__main__':
    game, cast, anim, t, out = sys.argv[1:6]
    if t == 'sheet':
        data, page = dump(game, cast, anim)
        fr = [f for f in data['frames'] if round(f['t'] * 10) == f['t'] * 10 or abs(f['t'] * 10 - round(f['t'] * 10)) < 0.01][::1]
        fr = [f for i, f in enumerate(data['frames']) if i % 6 == 0]
        tiles = [raster(f, page, 0.3, 1)[0] for f in fr]
        Wt, Ht = max(t.width for t in tiles), max(t.height for t in tiles)
        cols = 10
        sheet = Image.new('RGBA', (Wt * cols, (Ht + 14) * ((len(tiles) + cols - 1) // cols)), (120, 130, 125, 255))
        d = ImageDraw.Draw(sheet)
        for i, (tile, f) in enumerate(zip(tiles, fr)):
            x, y = (i % cols) * Wt, (i // cols) * (Ht + 14)
            sheet.alpha_composite(tile, (x, y + 14))
            d.text((x + 2, y), f"{f['t']:.1f}", fill=(255, 255, 0))
        sheet.save(out)
    else:
        im, ground = pose(game, cast, anim, float(t), float(sys.argv[6]) if len(sys.argv) > 6 else 1.0)
        im.save(out)
        print(out, im.size, 'ground', ground)
