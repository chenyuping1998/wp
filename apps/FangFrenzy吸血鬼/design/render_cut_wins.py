"""Offline contact sheet of the cut-mode wins (2026-11-07).

  node design/check_mesh_wins.mjs H1 --dump <dir>/H1.json [ms,...]
  python design/render_cut_wins.py <dir> H1,H2,H3,H4 <out.png>

Composes what SymbolMeshWin.svelte draws: the plate (scaled by plateHit), the
shadow (alpha by `air`, spread a little as the subject rises), and the subject
warped through the mesh (piecewise affine per triangle, 2x supersampled), with
the additive flash. Not the game renderer — a check that the acting reads.
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
RT = ROOT.parent / 'static/assets/sprites/mummySymbols'
dump_dir, names, out = Path(sys.argv[1]), sys.argv[2].split(','), sys.argv[3]
S = 2  # supersample
rows = []
for n in names:
    d = json.loads((dump_dir / f'{n}.json').read_text())
    key = n.lower()
    low = key.startswith('l')  # the letters: the tile is the plate (on a teal board cell), the cut letter the subject
    if low:
        cell = np.dstack([np.full((256 * S, 256 * S, 3), [0.06, 0.19, 0.22], np.float32), np.ones((256 * S, 256 * S, 1), np.float32)])
        tile_ = np.array(Image.open(RT / f'{key}.webp').convert('RGBA').resize((256 * S, 256 * S))).astype(np.float32) / 255
        cell[:, :, :3] = cell[:, :, :3] * (1 - tile_[:, :, 3:]) + tile_[:, :, :3] * tile_[:, :, 3:]
        plate = cell
    else:
        plate = np.array(Image.open(RT / f'{key}_plate.webp').convert('RGBA').resize((256 * S, 256 * S))).astype(np.float32) / 255
    sub = np.array(Image.open(RT / (f'{key}_letter.webp' if low else f'{key}_subject.webp')).convert('RGBA').resize((256 * S, 256 * S))).astype(np.float32) / 255
    shadow = np.array(Image.open(RT / f'{key}_shadow.webp').convert('RGBA').resize((256 * S, 256 * S))).astype(np.float32) / 255
    uv = np.array(d['uvs'], np.float32).reshape(-1, 2) * 256 * S
    idx = np.array(d['indices']).reshape(-1, 3)
    tiles = []
    for f in d['frames']:
        v = np.array(f['verts'], np.float32).reshape(-1, 2) * S
        canvas = np.zeros((256 * S, 256 * S, 4), np.float32)
        # plate, knocked by plateHit about the centre
        k = f['plateHit']
        M = np.float32([[k, 0, 128 * S * (1 - k)], [0, k, 128 * S * (1 - k)]])
        canvas = cv2.warpAffine(plate, M, (256 * S, 256 * S))
        # shadow: stays on the stone, widens and darkens with air
        a = f['air']
        sh = shadow.copy()
        sh[:, :, 3] *= 0.25 + 0.55 * a
        sc = 1 + 0.06 * a
        M = np.float32([[sc, 0, 128 * S * (1 - sc)], [0, sc, d['feetY'] * S * (1 - sc)]])
        sh = cv2.warpAffine(sh, M, (256 * S, 256 * S))
        canvas[:, :, :3] = canvas[:, :, :3] * (1 - sh[:, :, 3:]) + sh[:, :, :3] * sh[:, :, 3:]
        # subject through the mesh
        warped = np.zeros_like(sub)
        for t in idx:
            src = uv[t]
            dst = v[t]
            x0, y0 = np.floor(dst.min(0)).astype(int) - 1
            x1, y1 = np.ceil(dst.max(0)).astype(int) + 1
            x0, y0 = max(x0, 0), max(y0, 0)
            x1, y1 = min(x1, 256 * S), min(y1, 256 * S)
            if x1 <= x0 or y1 <= y0:
                continue
            A = cv2.getAffineTransform(src.astype(np.float32), (dst - [x0, y0]).astype(np.float32))
            patch = cv2.warpAffine(sub, A, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
            m = np.zeros((y1 - y0, x1 - x0), np.uint8)
            cv2.fillConvexPoly(m, np.round((dst - [x0, y0]) * 4).astype(np.int32), 1, shift=2)
            region = warped[y0:y1, x0:x1]
            sel = m.astype(bool)
            region[sel] = patch[sel]
        # travelling props (MeshWinSpec.props), key -> file; none in use since the
        # scarab was dropped (2026-11-07)
        PROP_FILE = {}
        for pr in f.get('props', []):
            if pr['alpha'] <= 0.01 or pr['key'] not in PROP_FILE:
                continue
            im = Image.open(RT / PROP_FILE[pr['key']]).convert('RGBA')
            sz = max(1, int(pr['size'] * pr['scale'] * S))
            im = im.resize((sz, sz), Image.LANCZOS).rotate(-pr['rot'], expand=True, resample=Image.BICUBIC)
            arr = np.array(im).astype(np.float32) / 255
            arr[:, :, 3] *= pr['alpha']
            x0 = int(pr['x'] * S - arr.shape[1] / 2); y0 = int(pr['y'] * S - arr.shape[0] / 2)
            xa, ya = max(0, x0), max(0, y0); xb, yb = min(256 * S, x0 + arr.shape[1]), min(256 * S, y0 + arr.shape[0])
            if xb <= xa or yb <= ya:
                continue
            sub_a = arr[ya - y0:yb - y0, xa - x0:xb - x0]
            reg = warped[ya:yb, xa:xb]
            al_p = sub_a[:, :, 3:]
            reg[:, :, :3] = reg[:, :, :3] * (1 - al_p) + sub_a[:, :, :3] * al_p
            reg[:, :, 3:] = np.maximum(reg[:, :, 3:], al_p)
        fl = f['flash']
        warped[:, :, :3] = np.clip(warped[:, :, :3] + fl * np.array([0.95, 0.91, 0.82]), 0, 1)
        al = warped[:, :, 3:]
        canvas[:, :, :3] = canvas[:, :, :3] * (1 - al) + warped[:, :, :3] * al
        img = Image.fromarray((np.clip(canvas[:, :, :3], 0, 1) * 255).astype(np.uint8)).resize((192, 192), Image.LANCZOS)
        ImageDraw.Draw(img).text((4, 2), f"{n} {f['ms']}ms", fill=(255, 255, 0))
        tiles.append(img)
    row = Image.new('RGB', (192 * len(tiles), 192))
    for i, im in enumerate(tiles):
        row.paste(im, (i * 192, 0))
    rows.append(row)
sheet = Image.new('RGB', (rows[0].width, 192 * len(rows)))
for i, r in enumerate(rows):
    sheet.paste(r, (0, i * 192))
sheet.save(out)
print(out, sheet.size)
