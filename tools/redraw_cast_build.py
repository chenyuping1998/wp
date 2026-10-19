"""Rebuild one redrawn cast figure into the game (2026-10-16).

    python redraw_cast_build.py <Pocha|Swing|Strike|Mardi> <mg|fg> [--no-spine]

  1. first run only: design/source/<cast> -> design/source/_pre_redraw/<cast>
  2. design/cast_cut/<cast>_cuts.json + <cast>_rig.json from redraw_cast_spec.py
  3. design/cut_cast_layers.py <cast> design/redraw/v1/<cast>_norm.png
  4. face cels: the generated laugh/blink heads, registered onto the new head cel
  5. design/fill_cast_underlay.py, design/add_flows.py
  6. CAST=<cast> node design/generate_monkey_spine.mjs -> static/assets/spines
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

sys.path.insert(0, str(Path(__file__).parent))
import redraw_cast as R  # noqa: E402
from redraw_cast_spec import ORDER, PHYS, SPEC, UNDERLAY, Z  # noqa: E402

PY = sys.executable
NODE = 'E:/stake/tools/node-v22.23.1-win-x64/node.exe'
GEN = 'E:/stake/tools/gen'
OUT = {'mg': 'sushiMaster', 'fg': 'sushiApprentice'}


def run(cmd, cwd, env=None):
    import os
    e = dict(os.environ, **(env or {}))
    p = subprocess.run(cmd, cwd=cwd, env=e, capture_output=True, text=True, encoding='utf-8', errors='replace')
    out = (p.stdout + p.stderr).strip()
    if p.returncode:
        print(out)
        raise SystemExit(f'FAILED: {cmd}')
    return out


def patch_cutter(app):
    f = app / 'design/cut_cast_layers.py'
    s = f.read_text(encoding='utf-8')
    if 'redraw_cuts' in s:
        return
    hook = '''
# 2026-10-16 redraw: measured cuts for the redrawn paintings (wp/tools/redraw_cast_spec.py),
# on the uniformly scaled canvas design/redraw/v1/<cast>_norm.png
for _cast in ('mg', 'fg'):
    _p = os.path.join(APP, 'design', 'cast_cut', f'{_cast}_cuts.json')
    if os.path.exists(_p):  # redraw_cuts
        CUTS[_cast] = [(n, z, [tuple(pt) for pt in poly], kind) for n, z, poly, kind in json.load(open(_p))]
'''
    anchor = 'TRUNK = ("torso_0_trunk", 2)'
    assert anchor in s
    s = s.replace(anchor, hook.strip('\n') + '\n' + anchor, 1)
    old_src = 'src = src or os.path.join(APP, "design", "cast_delivery", f"{cast}_full_source.png")'
    assert old_src in s
    s = s.replace(old_src, '''_norm = os.path.join(APP, "design", "redraw", "v1", f"{cast}_norm.png")
    src = src or (_norm if os.path.exists(_norm) else os.path.join(APP, "design", "cast_delivery", f"{cast}_full_source.png"))''', 1)
    f.write_text(s, encoding='utf-8')


def faces(app, cast, spec):
    """Register the generated expression heads onto the new head cel."""
    src = app / 'design/source' / cast
    meta = json.loads((src / 'layers.json').read_text(encoding='utf-8'))
    hl = next(l for l in meta['layers'] if l['name'] == 'head_2_face')
    rest = Image.open(src / 'head_2_face.png').convert('RGBA')
    W, H = 560, 912
    # where the generated paintings belong: the first cut's head cel box, mapped
    _, t = R.transform(app, cast)
    old = json.loads((app / 'design/redraw/v1' / f'{cast}_cutout/layers.json').read_text(encoding='utf-8'))
    ob = next(l for l in old['layers'] if l['name'] == 'head_2_face')
    sx0, sy0 = ob['x'] * t['W'] / 560, ob['y'] * t['H'] / 912
    sx1, sy1 = (ob['x'] + ob['w']) * t['W'] / 560, (ob['y'] + ob['h']) * t['H'] / 912
    bx0, by0 = (sx0 - t['bx0']) * t['s'] + t['ox'], (sy0 - t['by0']) * t['s'] + t['oy']
    bx1, by1 = (sx1 - t['bx0']) * t['s'] + t['ox'], (sy1 - t['by0']) * t['s'] + t['oy']

    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).polygon([tuple(p) for p in spec['cuts']['head_2_face']], fill=255)
    mask = np.array(mask.filter(ImageFilter.MaxFilter(13))) > 0
    mask = mask[hl['y']:hl['y'] + hl['h'], hl['x']:hl['x'] + hl['w']]

    rest_a = np.array(rest)
    rest_ink = (rest_a[..., 3] > 128) & (rest_a[..., :3].astype(int).sum(-1) < 150)
    top = np.zeros_like(rest_ink)
    top[: int(hl['h'] * 0.55)] = True

    def place(img, dx=0.0, dy=0.0, k=1.0):
        w, h = (bx1 - bx0) * k, (by1 - by0) * k
        cx, cy = (bx0 + bx1) / 2 + dx, (by0 + by1) / 2 + dy
        x0, y0 = cx - w / 2, cy - h / 2
        big = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        im = img.resize((max(1, round(w)), max(1, round(h))), Image.LANCZOS)
        big.alpha_composite(im, (round(x0), round(y0))) if round(x0) >= 0 and round(y0) >= 0 else big.paste(im, (round(x0), round(y0)), im)
        return np.array(big)[hl['y']:hl['y'] + hl['h'], hl['x']:hl['x'] + hl['w']]

    laugh_src = Image.open(app / 'design/redraw/v1' / f'{cast}_laugh_generated.png').convert('RGBA')
    blink_src = Image.open(app / 'design/redraw/v1' / f'{cast}_blink_generated.png').convert('RGBA')

    def register(img):
        best = None
        for k in (0.94, 0.955, 0.97, 0.985, 1.0, 1.015, 1.03, 1.045, 1.06, 1.075):
            for dy in range(-14, 15, 2):
                for dx in range(-14, 15, 2):
                    a = place(img, dx, dy, k)
                    ink = (a[..., 3] > 128) & (a[..., :3].astype(int).sum(-1) < 150)
                    sil = ((a[..., 3] > 128) ^ (rest_a[..., 3] > 128)) & top
                    score = (ink & rest_ink & top).sum() * 2 - sil.sum()
                    if best is None or score > best[0]:
                        best = (score, dx, dy, k)
        _, dx, dy, k = best
        for ddy in (-1, 0, 1):
            for ddx in (-1, 0, 1):
                a = place(img, dx + ddx, dy + ddy, k)
                ink = (a[..., 3] > 128) & (a[..., :3].astype(int).sum(-1) < 150)
                sil = ((a[..., 3] > 128) ^ (rest_a[..., 3] > 128)) & top
                score = (ink & rest_ink & top).sum() * 2 - sil.sum()
                if score > best[0]:
                    best = (score, dx + ddx, dy + ddy, k)
        return best

    bl = register(blink_src)
    lg = register(laugh_src)
    print(f'  faces: blink offset {bl[1:]}, laugh offset {lg[1:]}')

    def cel(img, b):
        a = place(img, b[1], b[2], b[3])
        a[..., 3] = (a[..., 3] * mask).astype(np.uint8)
        return Image.fromarray(a)

    laugh, blink = cel(laugh_src, lg), cel(blink_src, bl)
    w, h = rest.size

    # Take from each painting only what the expression changes (the mouth, the
    # eyes): blobs where it differs from the rest cel. A thin line of difference
    # is the two paintings disagreeing by a pixel or two at a hat brim or an ear,
    # and swapping that in makes the outline shiver on every laugh beat.
    def changed(img, keep_px=220):
        a, b = np.array(img).astype(int), rest_a.astype(int)
        diff = (np.abs(a[..., :3] - b[..., :3]).sum(-1) > 90) | (np.abs(a[..., 3] - b[..., 3]) > 100)
        blob = ndimage.binary_opening(diff, iterations=3)
        lab, n = ndimage.label(blob)
        if n:
            sizes = ndimage.sum(blob, lab, range(1, n + 1))
            blob = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= keep_px])
        # an eye that closes changes its pupil and its lid line, not the white
        # between them (cream on cream): close the gaps so the whole eye swaps
        m = ndimage.binary_closing(np.pad(blob, 16), iterations=14)[16:-16, 16:-16]
        m = ndimage.binary_fill_holes(m)
        m = ndimage.binary_dilation(m, iterations=8)
        return Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))

    # the eyes: one solid patch over everything the blink changes in the upper
    # face (the convex hull), so no ring of the open eye survives the swap
    def hull(img, lower=False):
        # finer than changed(): the far eye is small, and its lid is a thin line.
        # Inside the face only (the silhouette eroded), so a brim or an ear that
        # sits a pixel off cannot stretch the hull out to the edge.
        a, r = np.array(img).astype(int), rest_a.astype(int)
        diff = (np.abs(a[..., :3] - r[..., :3]).sum(-1) > 120) & (r[..., 3] > 200) & (a[..., 3] > 200)
        if not lower:
            diff &= ndimage.binary_erosion(rest_a[..., 3] > 128, iterations=5)
        diff = ndimage.binary_opening(diff, iterations=1)
        lab, n = ndimage.label(diff)
        m = np.zeros_like(diff)
        if n:
            sizes = ndimage.sum(diff, lab, range(1, n + 1))
            m = np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz >= 25])
        if lower:
            m[: int(h * .45)] = False
        else:
            m[int(h * .72):] = False
        ys, xs = np.nonzero(m)
        if len(xs) < 3:
            return Image.fromarray((m * 255).astype(np.uint8))
        from scipy.spatial import ConvexHull
        pts = np.stack([xs, ys], 1)
        poly = [tuple(map(int, pts[v])) for v in ConvexHull(pts).vertices]
        out = Image.new('L', (w, h), 0)
        ImageDraw.Draw(out).polygon(poly, fill=255)
        return out.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(3))
    laugh = Image.composite(laugh, rest, hull(laugh, lower=True))
    eye = hull(blink)
    blink = Image.composite(blink, rest, eye)
    laugh_blink = Image.composite(blink, laugh, eye)
    # Two drawings, no cross-fades: a half-and-half blend of two different mouths
    # reads as a double exposure (two jaws, two snouts) on every laugh beat. The
    # in-between states snap to whichever drawing they are nearer, like a
    # cartoon's mouth chart.
    shut = ('rest', 'talk_closed', 'inhale', 'laugh_1', 'half', 'settle')
    wide = ('laugh_2', 'rising', 'laugh_3', 'open', 'laugh_4', 'peak', 'talk_open')
    for state in shut:
        rest.save(src / f'head_2_face_{state}.png')
    for state in wide:
        laugh.save(src / f'head_2_face_{state}.png')
    blink.save(src / 'head_2_face_blink.png')
    for state in ('peak_blink', 'laugh_4_blink', 'laugh_3_blink'):
        laugh_blink.save(src / f'head_2_face_{state}.png')
    sheet = Image.new('RGBA', (w * 4, h), (190, 190, 190, 255))
    for i, im in enumerate((rest, laugh, blink, laugh_blink)):
        sheet.alpha_composite(im, (i * w, 0))
    sheet.save(app / 'design/redraw/v1' / f'{cast}_faces_check.png')


def main(game, cast, spine=True):
    app = R.app_dir(game)
    spec = SPEC[(game, cast)]
    d = app / 'design'
    src = d / 'source' / cast
    bak = d / 'source/_pre_redraw' / cast
    if not bak.exists():
        shutil.copytree(src, bak)
        for f in (d / 'cast_cut' / f'{cast}_rig.json',):
            if f.exists():
                shutil.copy2(f, bak / f'_cast_cut_{f.name}')
    cuts = [[n, Z[n], spec['cuts'][n], None] for n in ORDER]
    (d / 'cast_cut' / f'{cast}_cuts.json').write_text(json.dumps(cuts), encoding='utf-8')
    rig = {'_note': f'{game} {cast} redraw (2026-10-16), measured on design/redraw/v1/{cast}_norm.png by Claude; see wp/tools/redraw_cast_spec.py',
           'out': OUT[cast], **{k: v for k, v in spec['rig'].items() if k != 'underlay'},
           'sleeveHem': False, 'gusset': {'from': 0.9, 'to': 1.4, 'max': 0},
           'underlay': {**UNDERLAY, **spec['rig']['underlay']}}
    (d / 'cast_cut' / f'{cast}_rig.json').write_text(json.dumps(rig, indent=1), encoding='utf-8')
    patch_cutter(app)
    if '--faces' in sys.argv:
        return faces(app, cast, spec)
    print(run([PY, 'design/cut_cast_layers.py', cast], app).splitlines()[-1])
    faces(app, cast, spec)
    print(run([PY, 'design/fill_cast_underlay.py', cast], app).splitlines()[-1])
    flows = [{**f, 'physics': f.get('physics', PHYS)} for f in spec['flows']]
    print(run([PY, 'design/add_flows.py', str(app), cast, json.dumps(flows)], app))
    if spine:
        out = run([NODE, 'design/generate_monkey_spine.mjs', GEN], app, {'CAST': cast})
        print('\n'.join(l for l in out.splitlines() if 'warn' in l.lower() or 'error' in l.lower() or 'atlas' in l.lower())[-1500:])


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], '--no-spine' not in sys.argv)
