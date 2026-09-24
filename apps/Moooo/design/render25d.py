#!/usr/bin/env python3
"""A 2.5D shading toolkit — flat masks in, glossy rendered volumes out.

The reference style for Moooo is chunky cartoon 3D: thick volumes, soft graded
shading, a wet specular highlight, a cool rim light, and a contact shadow. None
of that needs a 3D package. All of it falls out of one idea:

    blur a silhouette -> that blurred image IS a heightmap
    the gradient of a heightmap IS its surface normal
    once you have normals you can light it

So a symbol is authored as a flat SHAPE (a mask), and this module turns it into
a lit object. Shapes stay easy to edit and describe; the look comes from the
lighting, applied identically to every symbol, which is also what makes twelve
symbols feel like one set.

Everything is numpy float in 0..1 and PIL only at the edges.

Light comes from the upper left, which is the reference's convention and the one
the whole set must share — a symbol lit from elsewhere reads as pasted on.
"""

import numpy as np
from PIL import Image, ImageFilter

LIGHT = np.array([-0.45, -0.62, 0.64])  # upper-left, toward viewer
LIGHT /= np.linalg.norm(LIGHT)
VIEW = np.array([0.0, 0.0, 1.0])


def _to_array(image: Image.Image) -> np.ndarray:
    return np.asarray(image, dtype=np.float32) / 255.0


def alpha_of(image: Image.Image) -> np.ndarray:
    return _to_array(image.convert("RGBA"))[..., 3]


def blur_f(arr: np.ndarray, radius: float) -> np.ndarray:
    """Gaussian-ish blur that stays in float.

    PIL's GaussianBlur refuses mode "F", and going through 8-bit is what put
    contour rings in the first render — a gradient of a quantised image turns
    every step into a ridge. Three box blurs approximate a Gaussian closely
    enough for shading and cost two cumulative sums each.
    """
    if radius < 0.5:
        return arr
    out = arr.astype(np.float32)
    k = max(1, int(round(radius / 1.5)))
    for _ in range(3):
        for axis in (0, 1):
            pad = [(0, 0), (0, 0)]
            pad[axis] = (k, k)
            padded = np.pad(out, pad, mode="edge")
            csum = np.cumsum(padded, axis=axis)
            lo = np.take(csum, range(0, out.shape[axis]), axis=axis)
            hi = np.take(csum, range(2 * k, 2 * k + out.shape[axis]), axis=axis)
            out = (hi - lo) / (2.0 * k)
    return out


def heightmap(mask: np.ndarray, radius: float, plateau: float = 1.9) -> np.ndarray:
    """Turn a silhouette into a rounded, inflated form.

    A blurred silhouette IS a heightmap: it ramps up across the edge and levels
    off inside. Blurring in FLOAT is the whole trick — the first attempt blurred
    through 8-bit and the render came out banded like a contour map, because a
    gradient of a quantised image turns every quantisation step into a ridge.

    A chamfer distance transform was tried in between and was worse: the metric
    is not isotropic, so a circle rendered with an octagonal plateau and a hard
    diagonal seam. A Gaussian is isotropic by construction, which is the
    property that actually matters here.

    `radius` sets how far in from the edge the surface keeps climbing — small is
    a thin plate, large is a balloon. `plateau` pushes the middle flat so the
    form reads as a chunky cartoon volume rather than a billiard ball.
    """
    h = blur_f(mask, radius)
    h = np.clip(h * plateau, 0.0, 1.0)
    return blur_f(h, max(radius * 0.35, 2.0))


def normals(height: np.ndarray, strength: float = 2.4) -> np.ndarray:
    """Surface normals from a heightmap, as an (h, w, 3) array."""
    gy, gx = np.gradient(height)
    nx, ny = -gx * strength * 255.0, -gy * strength * 255.0
    nz = np.ones_like(nx)
    n = np.stack([nx, ny, nz], axis=-1)
    return n / np.linalg.norm(n, axis=-1, keepdims=True)


def shade(
    mask: np.ndarray,
    color,
    *,
    fat: float = 26.0,
    strength: float = 2.4,
    ambient: float = 0.42,
    diffuse: float = 0.72,
    spec: float = 0.55,
    shininess: float = 28.0,
    rim: float = 0.34,
    rim_color=(0.62, 0.78, 1.0),
) -> np.ndarray:
    """Light a flat mask into a glossy volume. Returns RGBA float (h, w, 4).

    `spec` and `rim` are what make it read as rendered rather than drawn: the
    highlight says "this surface is smooth and wet", and the cool rim along the
    unlit edge separates the object from a dark background — the reference leans
    on both heavily.
    """
    height = heightmap(mask, fat)
    n = normals(height, strength)

    lambert = np.clip(n @ LIGHT, 0.0, 1.0)
    half = LIGHT + VIEW
    half /= np.linalg.norm(half)
    specular = np.clip(n @ half, 0.0, 1.0) ** shininess

    facing = np.clip(n @ VIEW, 0.0, 1.0)
    rim_term = (1.0 - facing) ** 2.2

    base = np.array(color, dtype=np.float32) / 255.0
    lit = base[None, None, :] * (ambient + diffuse * lambert)[..., None]
    lit = lit + spec * specular[..., None]
    lit = lit + rim * rim_term[..., None] * np.array(rim_color, dtype=np.float32)[None, None, :]

    out = np.clip(lit, 0.0, 1.0)
    return np.dstack([out, np.clip(mask, 0.0, 1.0)])


def outline(mask: np.ndarray, width: float = 2.0) -> np.ndarray:
    """A soft dark edge just inside the silhouette — the reference's thin keyline."""
    img = Image.fromarray((np.clip(mask, 0, 1) * 255).astype(np.uint8), "L")
    eroded = _to_array(img.filter(ImageFilter.MinFilter(int(width) * 2 + 1)))
    return np.clip(mask - eroded, 0.0, 1.0)


def contact_shadow(mask: np.ndarray, drop: int = 14, blur: float = 12.0, alpha: float = 0.5) -> np.ndarray:
    """The blurred, offset dark blob that makes an object sit rather than float."""
    img = Image.fromarray((np.clip(mask, 0, 1) * 255).astype(np.uint8), "L")
    shadow = Image.new("L", img.size, 0)
    shadow.paste(img, (0, drop))
    return _to_array(shadow.filter(ImageFilter.GaussianBlur(blur))) * alpha


def compose(layers) -> Image.Image:
    """Alpha-over a stack of RGBA float layers, bottom first."""
    h, w = layers[0].shape[:2]
    out = np.zeros((h, w, 4), dtype=np.float32)
    for layer in layers:
        a = layer[..., 3:4]
        out[..., :3] = layer[..., :3] * a + out[..., :3] * (1 - a)
        out[..., 3:4] = a + out[..., 3:4] * (1 - a)
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), "RGBA")


def darken(layer: np.ndarray, amount: float) -> np.ndarray:
    out = layer.copy()
    out[..., :3] *= 1.0 - amount
    return out


def mask_from(draw_fn, size: int) -> np.ndarray:
    """Run a PIL drawing function on a blank L image and return it as a mask."""
    from PIL import ImageDraw

    img = Image.new("L", (size, size), 0)
    draw_fn(ImageDraw.Draw(img))
    return _to_array(img)


def solid(color, shape) -> np.ndarray:
    """A flat RGBA layer of one colour, shaped by `shape` (a mask)."""
    rgb = np.array(color, dtype=np.float32) / 255.0
    return np.dstack([np.broadcast_to(rgb, (*shape.shape, 3)).copy(), shape])
