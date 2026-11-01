"""Remove trademark-like details the image model drew in by default.

Run after integrate_ink_pass.py (which writes the sprites from design/source-v2)
and before build_store_v2.py (which builds the store layers from the same cast).

2026-10-19 review: three details read as real products, which is both the most
recognisable "AI drew a sneaker" tell and a #253 resemblance risk:
  - MG engineer's sneakers carried three side stripes (Adidas).
  - FG host's boots had yellow welt stitching (Dr. Martens).
  - The L5 sneaker symbol had the white round ankle patch (Converse All Star).
Each fix is local and keeps the ink line and paper grain around it.

Also two ink3 palette corrections (mic enamel, host trousers), see their docstrings.

Idempotent: a second run finds nothing left to change. Originals are kept once
under research/staticshift/before-brand-retouch/.
"""
from pathlib import Path
import hashlib
import re
import shutil

import numpy as np
from PIL import Image
from scipy import ndimage

APP = Path(__file__).resolve().parents[1]
SP = APP / 'static/assets/sprites'
BACKUP = Path('/Users/stone/stake-engine/research/staticshift/before-brand-retouch')


def backup(p: Path):
    BACKUP.mkdir(parents=True, exist_ok=True)
    dst = BACKUP / (p.parent.name + '__' + p.name)
    if not dst.exists():
        shutil.copy2(p, dst)


def lum(a):
    return a[..., 0] * 0.2126 + a[..., 1] * 0.7152 + a[..., 2] * 0.0722


def boots(p: Path) -> int:
    """Yellow welt stitch on the soles -> the boot's own dark leather."""
    im = Image.open(p).convert('RGBA')
    a = np.asarray(im).astype(np.float32)
    h = a.shape[0]
    zone = np.zeros(a.shape[:2], bool)
    zone[h - 95:, :] = True  # soles only: eyelets, buckle and jewellery stay gold
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    yellow = zone & (a[..., 3] > 40) & (r > 120) & (g > 90) & (b < 0.62 * g) & (r - b > 60)
    yellow = ndimage.binary_dilation(yellow, iterations=1) & zone & (a[..., 3] > 40) & (r - b > 25)
    n = int(yellow.sum())
    if n:
        l = lum(a)[yellow]
        k = (l / max(l.max(), 1.0))[:, None]
        dark = np.array([74, 60, 52], np.float32)
        a[yellow, :3] = dark * (0.75 + 0.35 * k)
        Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(p)
    return n


def sneaker_patch(p: Path) -> int:
    """White round ankle patch -> a tonal red panel; its stitched outline stays."""
    im = Image.open(p).convert('RGBA')
    a = np.asarray(im).astype(np.float32)
    H, W = a.shape[:2]
    win = np.zeros((H, W), bool)
    win[190:310, 55:155] = True
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    cream = win & (a[..., 3] > 200) & (r > 170) & (g > 150) & (b > 120) & (np.abs(r - g) < 45)
    lab, n = ndimage.label(cream)
    if not n:
        return 0
    sizes = ndimage.sum(cream, lab, range(1, n + 1))
    patch = lab == (int(np.argmax(sizes)) + 1)
    if patch.sum() < 1500:  # already done
        return 0
    patch = ndimage.binary_fill_holes(patch)
    # the canvas red around the patch, as a tone ramp
    ring = ndimage.binary_dilation(patch, iterations=10) & ~ndimage.binary_dilation(patch, iterations=4)
    red = ring & (r > g + 50) & (a[..., 3] > 200)
    base = np.median(a[red, :3], axis=0)
    l = lum(a)
    lp = l[patch]
    k = (lp / np.median(lp))[:, None]  # keeps the patch's grain and shading
    a[patch, :3] = (base * np.clip(k, 0.55, 1.2))
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(p)
    return int(patch.sum())


def stripes(p: Path) -> int:
    """Three thick side stripes on the sneakers -> plain off-white leather.

    A stripe is a thick, neutral-dark band with leather on both sides (ring
    >= 40% leather): that rules out the jeans-hem shadows (navy, denim around
    them) and the toe-cap edge (wide, flat, little leather). Each stripe group
    is closed into one panel and refilled row by row with the median of the
    leather beside it, plus a little grain, so the panel keeps its shading.
    """
    im = Image.open(p).convert('RGBA')
    a = np.asarray(im).astype(np.float32)
    H, W = a.shape[:2]
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    l = lum(a)
    op = a[..., 3] > 200
    zone = np.zeros((H, W), bool)
    zone[H - 110:H - 35, :] = True  # the uppers, above the sole line
    leather = op & (l > 150) & (l < 235) & (b < r + 5)
    dark = zone & op & (l < 75) & (np.abs(r - b) < 30)
    thick = ndimage.binary_opening(dark, structure=np.ones((5, 5)))
    lab, n = ndimage.label(thick)
    keep = np.zeros_like(thick)
    for i in range(1, n + 1):
        c = lab == i
        if c.sum() < 40:
            continue
        ring = ndimage.binary_dilation(c, iterations=5) & ~ndimage.binary_dilation(c, iterations=1)
        if leather[ring].mean() < 0.4:
            continue
        keep |= c
    if not keep.any():
        return 0
    panel = ndimage.binary_closing(keep, structure=np.ones((9, 9)), iterations=2)
    inner = ndimage.binary_erosion(op, iterations=4)
    mask = ndimage.binary_dilation(panel, iterations=4) & inner & zone & (l < 215) & ~(b > r + 15)
    lab2, n2 = ndimage.label(ndimage.binary_dilation(mask, iterations=2))
    out = a.copy()
    rng = np.random.default_rng(3)
    for i in range(1, n2 + 1):
        m = (lab2 == i) & mask
        ring = ndimage.binary_dilation(m, iterations=7) & ~ndimage.binary_dilation(m, iterations=2) & leather
        if ring.sum() < 20:
            continue
        base = np.median(a[ring, :3], axis=0)
        for y in np.unique(np.nonzero(m)[0]):
            sel = ring[max(0, y - 6):y + 7]
            vals = a[max(0, y - 6):y + 7][sel][:, :3]
            c = np.median(vals, axis=0) if len(vals) > 5 else base
            xs = np.nonzero(m[y])[0]
            out[y, xs, :3] = c + rng.normal(0, 3.5, (len(xs), 1))
    Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(p)
    return int(mask.sum())


PALETTE_BACKUP = Path('/Users/stone/stake-engine/research/staticshift/before-ink3-palette')


def backup_palette(p: Path):
    PALETTE_BACKUP.mkdir(parents=True, exist_ok=True)
    dst = PALETTE_BACKUP / (p.parent.name + '__' + p.name)
    if not dst.exists():
        shutil.copy2(p, dst)


def hsv_arrays(a):
    rgb = a[..., :3] / 255.0
    mx = rgb.max(-1)
    mn = rgb.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    rm = m & (mx == r)
    gm = m & (mx == g) & ~rm
    bm = m & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = (b - r)[gm] / d[gm] + 2
    h[bm] = (r - g)[bm] / d[bm] + 4
    h = h / 6
    sat = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    return h, sat, mx


def mic_enamel(p: Path) -> int:
    """L3 microphone: blue-indigo enamel -> paper cream with a warm grey shade.

    ART_REQUEST_INK3 asked for #8294b6 / #535e88 enamel, which is the card's
    own colour family: 38% of the mic's pixels then sat within 1.5:1 of the
    lavender card, and three low pays (headphones, mic, cassette) read as one
    hue. The brief's paper ink separates it. Flat two-tone fills, so a
    luminance remap stays clean; black slots, tape and outline are untouched.
    """
    im = Image.open(p).convert('RGBA')
    a = np.asarray(im).astype(np.float32)
    h, sat, val = hsv_arrays(a)
    op = a[..., 3] > 20
    blue = op & (h > 0.55) & (h < 0.72) & (sat > 0.18) & (val > 0.25)
    n = int(blue.sum())
    if n < 500:
        return 0
    backup_palette(p)
    l = lum(a)
    lo, hi = np.percentile(l[blue], [8, 92])
    t = np.clip((l - lo) / max(hi - lo, 1.0), 0, 1)[..., None]
    shade = np.array([0xa3, 0x98, 0x82], np.float32)   # warm grey, from #baa583 toward ink
    light = np.array([0xe5, 0xe2, 0xd6], np.float32)   # paper #e5e2d6
    a[blue, :3] = (shade + (light - shade) * t)[blue]
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(p)
    return n


def host_pants(p: Path) -> int:
    """FG host's trousers: back from vivid violet to the cast's dark plum.

    The ink3 redraw doubled their value (median 0.24 -> 0.54) and they became
    the most saturated area on screen, louder than the board. Pull value and
    saturation back to the approved figure's plum, keeping the two-tone
    shading as relative steps. Only purple hues below the jacket line.
    """
    im = Image.open(p).convert('RGBA')
    a = np.asarray(im).astype(np.float32)
    H = a.shape[0]
    h, sat, val = hsv_arrays(a)
    zone = np.zeros(a.shape[:2], bool)
    zone[int(H * 0.26):int(H * 0.90), :] = True
    purple = zone & (a[..., 3] > 20) & (h > 0.72) & (h < 0.88) & (sat > 0.28)
    bright = purple & (val > 0.42)
    if int(bright.sum()) < 2000:
        return 0
    backup_palette(p)
    med = float(np.median(val[purple]))
    target = 0.30
    k = target / max(med, 1e-3)
    rgb = a[..., :3]
    out = rgb[purple] * k
    # pull saturation slightly toward a neutral of the same value
    grey = out.mean(-1, keepdims=True)
    out = grey + (out - grey) * 0.85
    a[purple, :3] = out
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(p)
    return int(purple.sum())


def bump_revisions():
    registry = APP / 'src/game/assets.ts'
    src = registry.read_text()

    def rev(m):
        rel = m.group(1)
        digest = hashlib.sha256((APP / 'static' / rel).read_bytes()).hexdigest()[:10]
        return "new URL('../../" + rel + "', import.meta.url).href + '?v=" + digest + "'"

    src = re.sub(
        r"new URL\('../../(assets/sprites/staticShift(?:Symbols|Cast|Background)Ink/[^']+)'\, import.meta.url\)\.href(?: \+ '\?v=[a-f0-9]+')?",
        rev, src)
    registry.write_text(src)


if __name__ == '__main__':
    targets = {
        'boots': SP / 'staticShiftCastInk/fg.png',
        'stripes': SP / 'staticShiftCastInk/mg.png',
        'patch': SP / 'staticShiftSymbolsInk/l5.png',
    }
    for p in targets.values():
        backup(p)
    print('boots   px changed:', boots(targets['boots']))
    print('stripes px changed:', stripes(targets['stripes']))
    print('patch   px changed:', sneaker_patch(targets['patch']))
    print('mic     px changed:', mic_enamel(SP / 'staticShiftSymbolsInk/l3.png'))
    print('pants   px changed:', host_pants(targets['boots']))
    bump_revisions()
