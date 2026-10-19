"""A K Q J 10 in coloured enamel (2026-10-16, review: low quality asset).

The five low pays were grey steel letters on a grey slate plate — the spec
(NINJA_ART_PALETTE.md) asked for low-saturation grey so they would not compete
with the high pays. On the board that made two thirds of every spin a field of
grey on grey: nothing to read at a glance, and the whole board looked flat and
dull. Seen live in the local replay harness, it was the first thing the eye met.

Now each letter is a different enamel, lit from above, on the same slate:

    A  crimson     K  jade     Q  violet     J  steel blue     10  amber

They stay below the high pays because they are still metal LETTERS on a plate
— the high pays are painted objects in fully saturated colour — and every
letter differs from the others in both shape and colour.

Only the letter is recoloured. Its pixels come from the mesh layer cut for the
wins (goBananinjaMesh/l*_subject.png), so the plate, its rivets and the bevel
shadow are untouched; the full-size tiles use that cut's alpha, upscaled, as
the mask. The mesh layers (static, split, win) all go through the same
function, so a letter does not change colour when it starts to act.

Originals are kept in design/source/low_letters_grey/ and are what this reads,
so re-running it is safe.

    E:/stake/math-sdk/env/Scripts/python.exe design/recolor_low_letters.py
"""
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
MESH = APP / 'static/assets/sprites/goBananinjaMesh'
TILES = APP / 'static/assets/sprites/goBananasSymbolsV3'
KEEP = APP / 'design/source/low_letters_grey'

TINT = {
    'l1': (0.86, 0.36, 0.30),  # A  crimson
    'l2': (0.36, 0.74, 0.52),  # K  jade
    'l3': (0.62, 0.48, 0.88),  # Q  violet
    'l4': (0.34, 0.64, 0.88),  # J  steel blue
    'l5': (0.90, 0.60, 0.30),  # 10 amber
}


def recolor_rgb(rgb, mask, tint):
    """rgb, mask: float arrays 0..1 (h,w,3) and (h,w,1). Grey metal -> enamel."""
    h = rgb.shape[0]
    L = (rgb * [0.299, 0.587, 0.114]).sum(-1, keepdims=True)
    t = np.array(tint)
    ys = np.where(mask[..., 0].max(1) > 0.5)[0]
    y0, y1 = (ys.min(), ys.max()) if len(ys) else (0, h)
    yy = np.clip((np.arange(h)[:, None, None] - y0) / max(1, y1 - y0), 0, 1)
    sheen = 1.22 - 0.42 * yy  # enamel, lit from above
    lo = np.clip(L / 0.66, 0, 1) ** 1.35
    hi = np.clip((L - 0.66) / 0.34, 0, 1) ** 1.5
    out = t * lo * sheen * (1 - hi) + (t * 0.25 + 0.75) * hi
    # a little of the original grey keeps the metal grain
    return np.clip(out * 0.88 + rgb * 0.12, 0, 1)


def load(path):
    return np.asarray(Image.open(path).convert('RGBA'), float) / 255


def save(arr, path):
    Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8), 'RGBA').save(path, optimize=True)


def original(path):
    """the grey original, kept once"""
    KEEP.mkdir(parents=True, exist_ok=True)
    kept = KEEP / f'{path.parent.name}__{path.name}'
    if not kept.exists():
        shutil.copy2(path, kept)
    return kept


for n, tint in TINT.items():
    for cut, tile in ((f'{n}_subject.png', f'{n}.png'), (f'{n}s_subject.png', f'{n}_split.png')):
        # the cut letter layer (win/landing/idle mesh)
        sub_path = MESH / cut
        sub = load(original(sub_path))
        alpha = sub[..., 3:]
        sub[..., :3] = recolor_rgb(sub[..., :3], alpha, tint)
        save(sub, sub_path)
        # the full tile on the reel, masked by the cut's alpha
        tile_path = TILES / tile
        full = load(original(tile_path))
        size = full.shape[1], full.shape[0]
        mask = np.asarray(Image.fromarray((alpha[..., 0] * 255).astype(np.uint8)).resize(size, Image.LANCZOS), float)[..., None] / 255
        full[..., :3] = full[..., :3] * (1 - mask) + recolor_rgb(full[..., :3], mask, tint) * mask
        save(full, tile_path)
        print(f'{n}: {cut} + {tile}')
