"""The alchemist blinks (2026-10-16, user: 「人物要能眨眼」).

His eyes are ~20 x 12 px on the 560 x 884 painting, one cell of the 20px body
mesh: pressing the lid shut through that mesh would fold the whole brow. So the
lids are PAINTED: two small images (half shut, shut) made from the brow skin
just above each eye, laid over the face by a mesh attachment `lids` whose
vertices are the body mesh's OWN grid points under the eyes, with the body's
exact weights — whatever the face does (nod, chest beat, flinch, goggles), the
lids ride it to the pixel.

The `blink` animation (track 2 in Mascot.svelte, looping) only swaps the
slot's attachment: a single blink, then later a double one. Nothing else may
key the `lids` slot: an attachment timeline on track 2 sets the slot every
frame, so a key on track 0 (a squint in the flinch) would never show.

Called by refine_alchemist_motion.py after the body mesh is rebuilt (the rig
is regenerated from its backup every run, so this must run every time too).
Writes static/assets/spines/goBananasMonkey/alchemy_lids.png and adds its page
to monkey.atlas once.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

import alchemist_flow as flow

APP = Path(__file__).resolve().parents[1]
SPINE = APP / 'static/assets/spines/goBananasMonkey'
BODY_PNG = SPINE / 'alchemy_body.png'
LIDS_PNG = SPINE / 'alchemy_lids.png'
ATLAS = SPINE / 'monkey.atlas'

# the body grid's cells under the eyes (20px cells): cols 13..18, rows 6..8
C0, C1, R0, R1 = 13, 18, 6, 8
CELL_W, CELL_H = 560 / flow.COLS, 884 / flow.ROWS
X0, Y0 = C0 * CELL_W, R0 * CELL_H
LW, LH = round((C1 - C0) * CELL_W), round((R1 - R0) * CELL_H)

# each eye in body pixels: centre, half-width, half-height (measured on the
# painting: the iris and white inside the dark socket)
EYES = [((291.0, 130.8), 12.0, 6.6), ((348.0, 137.5), 9.0, 5.0)]
SS = 4  # supersampling for clean edges

SLOT = 'lids'
HALF, SHUT = 'lids_half', 'lids_closed'


def paint(shut: float) -> np.ndarray:
    """the lids over both eyes, `shut` 0..1 of the way down, as RGBA (LH x LW)"""
    body = np.asarray(Image.open(BODY_PNG).convert('RGBA'), np.float32)
    return paint_region(body, EYES, X0, Y0, LW, LH, shut)


def paint_region(body, eyes, X0, Y0, LW, LH, shut: float) -> np.ndarray:
    """lids painted from `body` (float RGBA array) over `eyes` ((cx, cy), rx,
    ry in body px), for the region LW x LH at (X0, Y0) of it. Shared with the
    Wild symbol's blink (design/w_blink.py)."""
    H, W = LH * SS, LW * SS
    out = np.zeros((H, W, 4), np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    bx = X0 + (xx + 0.5) / SS  # body px of every supersample
    by = Y0 + (yy + 0.5) / SS
    from scipy import ndimage as ndi
    for (cx, cy), rx, ry in eyes:
        rx_, ry_ = rx + 1.2, ry + 0.9
        u = (bx - cx) / rx_
        v = (by - cy) / ry_
        r = np.sqrt(u * u + v * v)
        # the lid's lower edge: an arc that comes down with `shut`, curving
        # with the eye (lower at the middle); shut, it meets the lower lid
        half_h = ry_ * np.sqrt(np.clip(1 - u * u, 0, 1))
        top, bottom = cy - half_h, cy + half_h
        edge = top + (bottom - top) * (0.12 + 0.86 * shut)
        # ONE tone for the lid: the median of the skin in a ring round the
        # socket (per-column samples striped it with the brow's wrinkles)
        ys, xs = np.mgrid[int(cy - ry_ - 6):int(cy + ry_ + 6), int(cx - rx_ - 6):int(cx + rx_ + 6)]
        rr = np.sqrt(((xs - cx) / (rx_ + 3)) ** 2 + ((ys - cy) / (ry_ + 3)) ** 2)
        ring = body[ys[(rr > 1) & (rr < 1.6)], xs[(rr > 1) & (rr < 1.6)], :3]
        lum = ring.mean(1)
        ring = ring[(lum > np.percentile(lum, 25)) & (lum < np.percentile(lum, 80))]
        tone = np.median(ring, 0)
        # a little of the face's own grain, so it is not a flat sticker
        patch = body[int(cy - 30):int(cy - 30) + 40, int(cx - 20):int(cx - 20) + 40, :3].mean(-1)
        grain = patch - ndi.gaussian_filter(patch, 2)
        gy = np.clip(((by - cy) * 1 + 20).astype(int), 0, 39)
        gx = np.clip(((bx - cx) * 1 + 20).astype(int), 0, 39)
        depth = np.clip((by - top) / np.maximum(1e-3, edge - top), 0, 1)[..., None]
        skin = tone[None, None, :] * (1.06 - 0.3 * depth) + 0.5 * grain[gy, gx][..., None]
        # alpha: soft over ~1px at the rim, the lid stops at its lash edge
        rim = np.clip((1 - r) * min(rx_, ry_) / 1.2, 0, 1)
        lower = np.clip((edge - by) / 0.8 + 0.5, 0, 1)
        alpha = rim * lower
        put = alpha > out[..., 3] / 255
        out[put, :3] = skin[put]
        out[put, 3] = 255 * alpha[put]
        # the lash line along the edge
        lash = np.clip(1 - np.abs(by - edge) / 0.9, 0, 1) * np.clip((0.97 - np.abs(u)) * 6, 0, 1) * (r <= 1.02)
        lash = lash * (0.6 + 0.4 * shut)
        m = lash > 0
        out[m, :3] = out[m, :3] * (1 - lash[m, None]) + np.array([34, 20, 12]) * lash[m, None]
        out[m, 3] = np.maximum(out[m, 3], 255 * lash[m])
    small = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA').resize((LW, LH), Image.LANCZOS)
    return np.asarray(small)


def write_texture():
    half, shut = paint(0.5), paint(1.0)
    page = np.zeros((LH * 2 + 2, LW, 4), np.uint8)
    page[:LH] = half
    page[LH + 2:] = shut
    Image.fromarray(page, 'RGBA').save(LIDS_PNG, optimize=True)
    text = ATLAS.read_text(encoding='utf-8')
    if 'alchemy_lids.png' not in text:
        text = text.rstrip('\n') + '\n' + (
            f'alchemy_lids.png\nsize:{LW},{LH * 2 + 2}\nformat:RGBA8888\nfilter:Linear,Linear\nrepeat:none\n'
            f'{HALF}\nbounds:0,0,{LW},{LH}\noffsets:0,0,{LW},{LH}\nindex:-1\n'
            f'{SHUT}\nbounds:0,{LH + 2},{LW},{LH}\noffsets:0,0,{LW},{LH}\nindex:-1\n')
        ATLAS.write_text(text, encoding='utf-8')


def body_entries(att: dict) -> list[list[float]]:
    """the body mesh's weighted vertices, one flat entry list each"""
    v, out, i = att['vertices'], [], 0
    while i < len(v):
        n = int(v[i])
        out.append(v[i:i + 1 + 4 * n])
        i += 1 + 4 * n
    return out


def body_index(col: int, row: int) -> int:
    """where body_mesh put grid point (col, row): the ring first, then inside"""
    C, R = flow.COLS, flow.ROWS
    ring = ([(c, 0) for c in range(C)] + [(C, r) for r in range(R)] +
            [(c, R) for c in range(C, 0, -1)] + [(0, r) for r in range(R, 0, -1)])
    if (col, row) in ring:
        return ring.index((col, row))
    return len(ring) + (row - 1) * (C - 1) + (col - 1)


def add_blink(rig: dict):
    write_texture()
    body = rig['skins'][0]['attachments']['alchemy_body']['alchemy_body']
    entries = body_entries(body)
    cols, rows = C1 - C0, R1 - R0
    ring = ([(c, 0) for c in range(cols)] + [(cols, r) for r in range(rows)] +
            [(c, rows) for c in range(cols, 0, -1)] + [(0, r) for r in range(rows, 0, -1)])
    inside = [(c, r) for r in range(1, rows) for c in range(1, cols)]
    order = ring + inside
    at = {p: i for i, p in enumerate(order)}
    uvs, verts, tris = [], [], []
    for c, r in order:
        uvs += [round(c / cols, 6), round(r / rows, 6)]
        verts += entries[body_index(C0 + c, R0 + r)]
    for r in range(rows):
        for c in range(cols):
            a, b, d, e = at[c, r], at[c + 1, r], at[c, r + 1], at[c + 1, r + 1]
            tris += [a, b, e, a, e, d]
    mesh = {'type': 'mesh', 'uvs': uvs, 'triangles': tris, 'vertices': verts,
            'hull': len(ring), 'width': LW, 'height': LH}
    rig['skins'][0]['attachments'][SLOT] = {HALF: dict(mesh), SHUT: dict(mesh)}
    slots = [s for s in rig['slots'] if s['name'] != SLOT]
    at_body = next(i for i, s in enumerate(slots) if s['name'] == 'alchemy_body')
    slots.insert(at_body + 1, {'name': SLOT, 'bone': 'head'})
    rig['slots'] = slots

    def blink(t: float, double=False):
        beats = [(0, HALF), (0.05, SHUT), (0.12, HALF), (0.17, None)]
        keys = [(t + dt, a) for dt, a in beats]
        if double:
            keys += [(t + 0.28 + dt, a) for dt, a in beats]
        return keys

    keys = [(0, None)] + blink(1.3) + blink(3.9, double=True) + [(5.6, None)]
    rig['animations']['blink'] = {'slots': {SLOT: {'attachment': [
        {'time': round(t, 3), 'name': a} if t else {'name': a} for t, a in keys]}}}
