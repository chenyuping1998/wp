"""Give the girl's mesh rig a hair bone, by painting weights — no new art.

    python3 design/add_hair_bone.py [--apply]

WHY THIS EXISTS

Hacksaw's Miami Mayhem cast was measured at body 1-3.3 degrees against hair at
27.5 — the body barely moves and the amplitude lives in whatever hangs off it
(docs/handoff/hot_miami.md, 2026-08-27, rule 2). Our rig had no appendage bone
at all, so every degree of motion had to come out of the body, which is the one
thing that rule says not to do.

The mesh pipeline makes this nearly free in a way the old Spine cutout rig did
not: a bone that moves the hair needs only WEIGHTS over the hair pixels of the
existing texture. Cutouts would have needed the hair drawn as its own layer.

WHAT IT DOES NOT DO

It does not touch the face. Hair and skin are separated by colour census per
grid cell (hair is dark, skin is warm and light), and only cells that are
hair-dominant with essentially no skin are taken. A hair weight bleeding onto
the face warps her features, which is worse than a stiff hairstyle.

THE RAMP IS THE FOLLOW-THROUGH

Weight rises with distance from the crown, so roots barely move and tips carry
the swing. That produces rule 3's follow-through (the tip travels further and
arrives later) out of ONE bone, because a vertex that is half hair and half head
lags a vertex that is all hair. A second bone buys very little on top of it.

Re-run this only if girl.png changes. It is idempotent — it refuses to add a
second hair bone to a rig that already has one.
"""

import json
import math
import os
import sys

import numpy as np
from PIL import Image

APP_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RIG_PATH = os.path.join(APP_ROOT, 'static/assets/meshRigs/cast_girl/girl.rig.json')
TEX_PATH = os.path.join(APP_ROOT, 'static/assets/meshRigs/cast_girl/girl.png')

# The crown: where the hair mass hangs from. Just above and behind the head
# bone, so the mass swings like a bell rather than pivoting through her face.
PIVOT = (386.5, 58.0)

# Weight ramp, in pixels from PIVOT to the cell's own centre.
RAMP_START = 25.0
RAMP_SPAN = 170.0
# Never a full 1.0: even the outermost curl stays partly welded to the head, or
# the hair reads as a separate object floating alongside her.
MAX_WEIGHT = 0.85

# A cell is hair if it is mostly dark and carries almost no skin.
MIN_DARK = 0.38
MAX_SKIN = 0.20
MIN_OPAQUE_PX = 80
# The hair mass only — below this the dark pixels are her dress and shadow.
MAX_Y = 200.0
# ...and it has to be NEAR HER HEAD. Colour alone is not enough: the raygun is
# dark and carries no skin either, so the first run of this script happily
# claimed a cell of the gun barrel at x=117 and would have welded it to her
# hair. Anything this far from the head bone is not hair whatever colour it is.
MAX_X_FROM_HEAD = 200.0


def census(tex, x0, y0, x1, y1):
    region = tex[y0:y1, x0:x1]
    opaque = region[..., 3] > 40
    count = int(opaque.sum())
    if count < MIN_OPAQUE_PX:
        return None
    px = region[opaque]
    r = px[..., 0].astype(int)
    g = px[..., 1].astype(int)
    b = px[..., 2].astype(int)
    dark = ((r + g + b) < 330).mean()
    skin = ((r > 150) & (r > g + 30) & (g > b)).mean()
    return dark, skin


def main(apply: bool) -> None:
    rig = json.load(open(RIG_PATH))
    names = [b['name'] for b in rig['bones']]
    if 'hair' in names:
        print('rig already has a hair bone — nothing to do')
        return

    tex = np.asarray(Image.open(TEX_PATH).convert('RGBA'), dtype=np.int16)
    height, width = tex.shape[0], tex.shape[1]
    cols, rows = rig['grid']
    cell_w, cell_h = width / cols, height / rows

    head_index = names.index('head')
    head_x = rig['bones'][head_index]['x']
    rig['bones'].append(
        {'name': 'hair', 'x': PIVOT[0], 'y': PIVOT[1], 'parent': head_index}
    )
    hair_index = len(rig['bones']) - 1
    weights = [list(w) + [0.0] for w in rig['weights']]

    painted = 0
    for index, (x, y) in enumerate(rig['verts']):
        if y > MAX_Y or abs(x + cell_w / 2 - head_x) > MAX_X_FROM_HEAD:
            continue
        x0, y0 = int(x), int(y)
        x1, y1 = min(width, int(x + cell_w)), min(height, int(y + cell_h))
        if x1 <= x0 or y1 <= y0:
            continue
        result = census(tex, x0, y0, x1, y1)
        if result is None:
            continue
        dark, skin = result
        if dark < MIN_DARK or skin > MAX_SKIN:
            continue

        distance = math.hypot(
            x + cell_w / 2 - PIVOT[0], y + cell_h / 2 - PIVOT[1]
        )
        weight = min(MAX_WEIGHT, max(0.0, (distance - RAMP_START) / RAMP_SPAN) * MAX_WEIGHT)
        if weight <= 0.01:
            continue
        row = weights[index]
        for k in range(len(row) - 1):
            row[k] *= 1.0 - weight
        row[hair_index] = weight
        painted += 1
        print(f'  hair cell at ({x:6.1f},{y:6.1f})  dark {dark:.2f}  weight {weight:.2f}')

    sums = [sum(w) for w in weights]
    assert abs(min(sums) - 1) < 1e-6 and abs(max(sums) - 1) < 1e-6, 'weights stopped summing to 1'
    print(f'\n{painted} vertices painted, weights still sum to 1')

    if not apply:
        print('dry run — pass --apply to write')
        return
    rig['weights'] = weights
    json.dump(rig, open(RIG_PATH, 'w'))
    print(f'wrote {RIG_PATH}')


if __name__ == '__main__':
    main('--apply' in sys.argv)
