"""Painted materials for the multiplier wheel (DOM), cut from the bonus plate.

Why: MultiplierWheel.svelte drew every surface — brass rim, 20 brass tiles, the
teal tile faces, the hub — as CSS radial/linear gradients. That is the literal
"gradient fills" in the review's definition of Low quality assets, on the
feature's centrepiece, shown on every winning free spin. The wheel keeps its
CSS geometry; its surfaces now carry these textures, with the old gradients
reduced to light/shade laid over them.

  wheel_brass.jpg   the plate's brass band, levelled and mirror-tiled square
  wheel_enamel.jpg  the plate's dark teal inset, levelled and mirror-tiled

Run: python3 design/build_wheel_materials.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / "static/assets/deadwood/bonus_button.png"
OUT = HERE.parent / "static/assets/deadwood"

BRASS = (236, 906, 436, 946)  # plain mid-band brass (rows 904-948 measured flat)
ENAMEL = (200, 520, 1040, 820)  # dark teal inset, clear of the cyan lip
SIZE = 512


def level(a, r):
    """Divide out slow brightness drift so mirrored tiles do not show a beat."""
    def blur(x, axis):
        pad = [(0, 0)] * x.ndim
        pad[axis] = (r, r)
        p = np.pad(x, pad, mode="reflect")
        c = np.cumsum(p, axis=axis)
        c = np.concatenate([np.zeros_like(np.take(c, [0], axis=axis)), c], axis=axis)
        n = x.shape[axis]
        return (np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=axis) - np.take(c, np.arange(n), axis=axis)) / (2 * r + 1)

    b = blur(blur(a, 0), 1)
    return a / np.maximum(b, 1) * a.mean(axis=(0, 1))


def mirror_tile(img, w, h):
    tw, th = img.size
    out = Image.new(img.mode, (w, h))
    for j in range(0, h, th):
        for i in range(0, w, tw):
            t = img
            if (i // tw) % 2:
                t = ImageOps.mirror(t)
            if (j // th) % 2:
                t = ImageOps.flip(t)
            out.paste(t, (i, j))
    return out


def material(plate, box, scale, radius):
    a = np.asarray(plate.crop(box).convert("RGB")).astype(np.float32)
    im = Image.fromarray(level(a, radius).clip(0, 255).astype(np.uint8))
    im = im.resize((round(im.size[0] * scale), round(im.size[1] * scale)), Image.LANCZOS)
    # a second copy turned 90° and blended in breaks the strip's direction
    base = mirror_tile(im, SIZE, SIZE)
    turned = mirror_tile(im.rotate(90, expand=True), SIZE, SIZE)
    return Image.blend(base, turned, 0.35)


def main():
    plate = Image.open(SRC).convert("RGBA")
    material(plate, BRASS, 1.6, 20).save(OUT / "wheel_brass.jpg", quality=86)
    material(plate, ENAMEL, 1.0, 50).save(OUT / "wheel_enamel.jpg", quality=86)
    print("wheel_brass.jpg, wheel_enamel.jpg")


if __name__ == "__main__":
    main()
