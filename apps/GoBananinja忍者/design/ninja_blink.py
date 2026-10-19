"""The ninja blinks (2026-10-16, user: 「人物眨眼」).

The eyes are painted into head_2_face, ~26x13 and ~18x12 px on its 280x271
canvas — far too small for the face mesh to fold a lid out of. So the lids are
PAINTED: a half-closed and a closed lid for each eye, in the lid skin sampled
round that eye, with a dark lash crease.

They are REGION attachments on the head bone, on a new `lids` slot right above
the face. That is exact rather than approximate: every face-mesh vertex round
the eyes is weighted 100% to `head` (the headband weights stop at the knot), so
face canvas (u, v) is simply head-local (u - 139, 267 - v) - main() checks this
against the mesh before it writes anything.

(A first attempt copied the whole face mesh onto whitespace-stripped regions.
Wrong: a stripped region only works when the mesh stays inside it, and the
copied mesh's UVs ran across the neighbouring atlas parts.)

`blink` (loops on track 2, Mascot.svelte) owns the slot: no other animation may
key `lids`.

Run AFTER design/boost_ninja_flow.mjs (which rebuilds ninja.json from its
pre-boost copy). Re-running this is safe: it replaces its own slot, regions and
animation each time.

    E:/stake/math-sdk/env/Scripts/python.exe design/ninja_blink.py
"""
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / 'static/assets/spines/goBananinjaMascot'
JSON = DIR / 'ninja.json'
ATLAS = DIR / 'ninja.atlas'
PAGE = DIR / 'ninja.png'

FACE = 'head_2_face'
# Measured on the face canvas (design: 8x zoom with a 10px grid). cx, cy,
# half-width, half-height of the visible eye opening, and how far the brow
# sits above it (where the lid skin is sampled).
EYES = [
    (164.5, 111.5, 14.0, 7.5),
    (221.0, 119.0, 10.5, 6.5),
]
# One crop on the face canvas that holds both eyes with room for the soft edge.
CROP = (144, 98, 244, 136)  # x0, y0, x1, y1 -> 100 x 38
# Where the two lid regions go on the atlas page (verified empty below).
PLACE = {'lids_half': (880, 4), 'lids_closed': (880, 48)}
SS = 4  # supersampling for the lid edges


def face_canvas(page, atlas_text):
    m = re.search(rf'^{FACE}\nbounds:(\d+),(\d+),(\d+),(\d+)', atlas_text, re.M)
    x, y, w, h = map(int, m.groups())
    return page.crop((x, y, x + w, y + h)), (w, h)


def lid_skin(face, cx, cy, hw, hh):
    """Median of the warm, mid-value skin in a band just above the eye."""
    a = np.asarray(face.convert('RGB'), float)
    ys, xs = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    d = ((xs - cx) / (hw + 7)) ** 2 + ((ys - (cy - 2)) / (hh + 7)) ** 2
    e = ((xs - cx) / (hw + 1)) ** 2 + ((ys - cy) / (hh + 1)) ** 2
    ring = (d <= 1) & (e > 1) & (ys < cy)
    px = a[ring]
    lum = px.mean(1)
    keep = px[(lum > np.percentile(lum, 35)) & (lum < np.percentile(lum, 92))]
    return np.median(keep, 0), np.percentile(px.mean(1), 15)


def paint(face, closed):
    x0, y0, x1, y1 = CROP
    w, h = (x1 - x0) * SS, (y1 - y0) * SS
    out = np.zeros((h, w, 4))
    ys, xs = np.mgrid[0:h, 0:w]
    fx = xs / SS + x0 + 0.5 / SS
    fy = ys / SS + y0 + 0.5 / SS
    for cx, cy, hw, hh in EYES:
        skin, dark = lid_skin(face, cx, cy, hw, hh)
        # the lid covers the opening plus a pixel, so no white or iris rims
        ex, ey = hw + 1.6, hh + 1.6
        u = (fx - cx) / ex
        v = (fy - cy) / ey
        inside = u * u + v * v
        # the lid's lower edge: closed sits a little below centre (a lid comes
        # DOWN over the eye), half-closed covers the top half and the iris top
        edge = 0.32 if closed else -0.05
        sag = edge + 0.18 * (1 - u * u)  # the edge bows down in the middle
        lid = (inside <= 1) & (v <= sag)
        # soft outer edge, 1 face px
        rim = np.clip((1 - np.sqrt(inside)) * ex * 1.2, 0, 1)
        cut = np.clip((sag - v) * ey * 1.6, 0, 1)
        alpha = np.where(lid | (cut > 0), rim * cut, 0)
        # shading: lighter at the top of the lid (it is a dome), darker into
        # the crease and the corners
        shade = 1.08 - 0.22 * np.clip((v + 1) / (sag + 1), 0, 1) - 0.12 * u * u
        # The lid's SURFACE is the painted skin just above the eye, pulled down
        # over it (a lid is that skin), toned halfway to the sampled median so
        # brow creases that land inside it do not read as a second eye.
        src = np.asarray(face.convert('RGB'), float)
        sx = np.clip(np.round(fx).astype(int), 0, src.shape[1] - 1)
        sy = np.clip(np.round(fy - (ey * 1.25 + 1)).astype(int), 0, src.shape[0] - 1)
        texture = src[sy, sx] * 0.55 + skin[None, None, :] * 0.45
        col = texture * shade[..., None]
        # the lash line: a dark arc along the lid's lower edge
        lash = np.exp(-(((v - sag) * ey) / 0.9) ** 2) * (np.abs(u) < 1.02)
        lash *= np.clip(1.15 - u * u * 0.6, 0, 1)
        lash_col = np.array([dark * 0.35, dark * 0.25, dark * 0.2])
        col = col * (1 - lash[..., None] * 0.85) + lash_col * lash[..., None] * 0.85
        a = np.maximum(alpha, lash * rim * (inside <= 1.05))
        sel = a > out[..., 3]
        out[sel, :3] = col[sel]
        out[sel, 3] = a[sel]
    # colours are 0-255 (sampled straight off the page), alpha is 0-1
    rgba = np.dstack([np.clip(out[..., :3], 0, 255), np.clip(out[..., 3], 0, 1) * 255])
    img = Image.fromarray(rgba.astype(np.uint8), 'RGBA')
    return img.resize((x1 - x0, y1 - y0), Image.LANCZOS)


def main():
    atlas_text = ATLAS.read_text()
    page = Image.open(PAGE).convert('RGBA')
    face, (fw, fh) = face_canvas(page, atlas_text)
    x0, y0, x1, y1 = CROP
    cw, ch = x1 - x0, y1 - y0

    # strip our own regions from a previous run, then check the space is free
    atlas_text = re.sub(r'\nlids_(half|closed)\nbounds:[^\n]*\noffsets:[^\n]*\nindex:-1', '', atlas_text)
    occupied = np.zeros((page.height, page.width), bool)
    for x, y, w, h in re.findall(r'bounds:(\d+),(\d+),(\d+),(\d+)', atlas_text):
        x, y, w, h = map(int, (x, y, w, h))
        occupied[max(0, y - 2):y + h + 2, max(0, x - 2):x + w + 2] = True
    for name, (px, py) in PLACE.items():
        assert not occupied[py:py + ch, px:px + cw].any(), f'{name} would overlap a region'

    regions = ''
    for name, (px, py) in PLACE.items():
        lid = paint(face, closed=name == 'lids_closed')
        page.paste(Image.new('RGBA', (cw, ch)), (px, py))
        page.alpha_composite(lid, (px, py))
        regions += f'\n{name}\nbounds:{px},{py},{cw},{ch}\noffsets:0,0,{cw},{ch}\nindex:-1'
    page.save(PAGE)
    ATLAS.write_text(atlas_text.rstrip('\n') + regions + '\n')

    rig = json.loads(JSON.read_text(encoding='utf-8'))
    rig['slots'] = [s for s in rig['slots'] if s['name'] != 'lids']
    at = next(i for i, s in enumerate(rig['slots']) if s['name'] == FACE)
    face_slot = rig['slots'][at]
    rig['slots'].insert(at + 1, {'name': 'lids', 'bone': face_slot['bone']})
    mesh = rig['skins'][0]['attachments'][FACE][FACE]
    head = next(i for i, b in enumerate(rig['bones']) if b['name'] == face_slot['bone'])
    # verify the mapping on every face vertex inside the crop
    verts, cursor = mesh['vertices'], 0
    for i in range(len(mesh['uvs']) // 2):
        count = int(verts[cursor]); cursor += 1
        ws = [verts[cursor + 4 * k:cursor + 4 * k + 4] for k in range(count)]
        cursor += 4 * count
        u, v = mesh['uvs'][2 * i] * fw, mesh['uvs'][2 * i + 1] * fh
        if not (x0 - 4 <= u <= x1 + 4 and y0 - 4 <= v <= y1 + 4):
            continue
        assert count == 1 and int(ws[0][0]) == head, f'face vertex {i} is not pure head'
        assert abs(ws[0][1] - (u - 139)) < 0.6 and abs(ws[0][2] - (267 - v)) < 0.6, (i, u, v, ws)
    centre = ((x0 + x1) / 2 - 139, 267 - (y0 + y1) / 2)
    rig['skins'][0]['attachments']['lids'] = {
        name: {'path': name, 'x': centre[0], 'y': centre[1], 'width': cw, 'height': ch} for name in PLACE
    }
    # A blink every ~4.2s, a double blink once a loop. Each is half -> closed
    # -> half -> open over ~130ms: two frames of half lid either side is what
    # stops it reading as the eyes switching off.
    keys = [{'time': 0, 'name': None}]
    for start in (1.6, 4.4, 4.62):
        keys += [
            {'time': round(start, 3), 'name': 'lids_half'},
            {'time': round(start + 0.04, 3), 'name': 'lids_closed'},
            {'time': round(start + 0.10, 3), 'name': 'lids_half'},
            {'time': round(start + 0.14, 3), 'name': None},
        ]
    keys.append({'time': 5.6, 'name': None})
    for anim in rig['animations'].values():
        anim.get('slots', {}).pop('lids', None)
    rig['animations']['blink'] = {'slots': {'lids': {'attachment': keys}}}
    JSON.write_text(json.dumps(rig, separators=(',', ':')), encoding='utf-8')
    for name in PLACE:
        print(name, 'region', PLACE[name], (cw, ch))
    print('blink: lids slot above', FACE, '->', JSON)


if __name__ == '__main__':
    main()
