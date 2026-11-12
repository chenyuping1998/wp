"""Look at the symbol set the way a player does, and measure it.

    /Applications/anaconda3/bin/python contact_sheet.py

Renders every SHIPPED symbol PNG at its true on-reel size on the real board
colour, writes three sheets into `design/_contact/`, and prints the measurements
the 2026-08-06 art audit established as the baseline:

    pay <-> contrast Spearman        was +0.25 (p=0.51) - carried no pay info
    body-vs-board dE                 l4's body bottom was 4.9 - invisible
    premium plate dE at midpoint     was 3.70 - crossed the board's luminance
    silhouette IoU matrix            h4/h5 was 0.60, target < 0.45
    identity hue separation          12 symbols in 4 families, 4 within 8 deg

Why these numbers and not "it looks fine":

* **True reel cell = 105 px**, not 118. `game/constants.ts:11` SYMBOL_SIZE = 118
  times `game/stateGame.svelte.ts:145` BOARD_SHRINK = 0.89. With the tier ratios
  at `constants.ts:63-65` the drawn sizes are high 102 / low 84 / special 113.
* **Board colour = RGB(40,10,66)**, sampled from hotMiamiFrame/frame_bg.png,
  whose inner 1000x1000 is 100% opaque - so symbol contrast is identical in the
  base game, free spins and Ocean Drive.
* **Downscaling must be premultiplied.** A naive resize of straight RGBA bleeds
  the RGB of fully transparent pixels into the edges; measured at up to 255 per
  channel on the old h1.
"""

import itertools
import os

import numpy as np
from PIL import Image, ImageDraw

from generate_art import royal_font
from neon import render_chrome_letter, render_object, render_word
from symbols import PAY_RANK, PREMIUMS, ROYALS, SPECIALS, SYMBOLS

HERE = os.path.dirname(os.path.abspath(__file__))
SPRITES = os.path.abspath(os.path.join(HERE, "..", "static", "assets", "sprites", "hotMiamiSymbols"))
OUT = os.path.join(HERE, "_contact")

BOARD = (40, 10, 66)
CELL = 105
DRAWN = {"high": 102, "low": 84, "special": 113}
TIER = dict(
    [(k, "high") for k in PREMIUMS] + [(k, "low") for k in ROYALS] + [("w", "special"), ("c", "special")]
)
TIER["fs"] = "special"  # hmS -> fs.png; s.png is the identical orphan copy
ORDER = ["h1", "h2", "h3", "h4", "h5", "l1", "l2", "l3", "l4", "w", "fs", "c"]


# ---------------------------------------------------------------------------
def premultiplied_resize(img, size):
    arr = np.asarray(img.convert("RGBA"), dtype=np.float64)
    alpha = arr[..., 3:4] / 255.0
    arr[..., :3] *= alpha
    small = Image.fromarray(arr.astype(np.uint8), "RGBA").resize((size, size), Image.LANCZOS)
    out = np.asarray(small, dtype=np.float64)
    a = np.clip(out[..., 3:4] / 255.0, 1e-6, None)
    out[..., :3] = np.clip(out[..., :3] / a, 0, 255)
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def on_board(img, cell=CELL):
    plate = Image.new("RGBA", (cell, cell), BOARD + (255,))
    x = (cell - img.size[0]) // 2
    plate.alpha_composite(img, (x, x))
    return plate


def _srgb_to_lab(rgb):
    """CIE Lab from 8-bit sRGB, D65. Array-shaped (..., 3)."""
    c = np.asarray(rgb, dtype=np.float64) / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ m.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16.0 / 116.0)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def delta_e(rgb_a, rgb_b):
    return np.sqrt(((_srgb_to_lab(rgb_a) - _srgb_to_lab(rgb_b)) ** 2).sum(-1))


def spearman(a, b):
    """Rank correlation plus a two-sided p from the t approximation."""
    def rank(v):
        order = np.argsort(v)
        r = np.empty(len(v), dtype=np.float64)
        r[order] = np.arange(len(v), dtype=np.float64)
        # average ties
        for value in set(v):
            idx = [i for i, x in enumerate(v) if x == value]
            if len(idx) > 1:
                r[idx] = np.mean(r[idx])
        return r

    ra, rb = rank(list(a)), rank(list(b))
    rho = float(np.corrcoef(ra, rb)[0, 1])
    n = len(ra)
    if n < 4 or abs(rho) >= 1.0:
        return rho, float("nan")
    t = rho * np.sqrt((n - 2) / (1 - rho * rho))
    # two-sided p from a normal approximation to the t distribution
    import math as py_math

    p = 2 * (1 - 0.5 * (1 + py_math.erf(abs(t) / np.sqrt(2))))
    return rho, float(p)


def hue_sat(img):
    arr = np.asarray(img.convert("RGBA"), dtype=np.float64)
    a = arr[..., 3] / 255.0
    rgb = arr[..., :3] / 255.0
    mx, mn = rgb.max(-1), rgb.min(-1)
    chroma = mx - mn
    sat = np.where(mx > 0, chroma / np.maximum(mx, 1e-6), 0)
    weight = a * chroma * (mx > 0.18)
    if weight.sum() < 1e-6:
        return float("nan"), 0.0
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    hue = np.zeros_like(mx)
    safe = chroma > 1e-6
    hue = np.where(safe & (mx == r), ((g - b) / np.where(safe, chroma, 1)) % 6, hue)
    hue = np.where(safe & (mx == g), (b - r) / np.where(safe, chroma, 1) + 2, hue)
    hue = np.where(safe & (mx == b), (r - g) / np.where(safe, chroma, 1) + 4, hue)
    ang = np.radians(hue * 60)
    mean = np.arctan2((np.sin(ang) * weight).sum(), (np.cos(ang) * weight).sum())
    return float(np.degrees(mean) % 360), float((sat * weight).sum() / weight.sum())


def hue_gap(a, b):
    d = abs(a - b) % 360
    return min(d, 360 - d)


def artwork_only(name):
    """Re-render a symbol with its backing plate suppressed."""
    key = "s" if name == "fs" else name
    spec = SYMBOLS[key]
    if spec["kind"] == "royal":
        return render_chrome_letter(spec["text"], royal_font, size=256,
                                    coverage=spec["coverage"], rim=(186, 200, 220))
    if spec["kind"] == "object":
        return render_object(spec, size=256, plate=False)
    return render_word(spec, royal_font, size=256, plate=False)


# ---------------------------------------------------------------------------
def main():
    os.makedirs(OUT, exist_ok=True)
    cells, alphas, rows = {}, {}, []

    for name in ORDER:
        src = Image.open(os.path.join(SPRITES, f"{name}.png")).convert("RGBA")
        drawn = premultiplied_resize(src, DRAWN[TIER[name]])
        cell = on_board(drawn)
        cells[name] = cell

        # Artwork-only alpha at a common size, for silhouette IoU. This has to
        # be RE-RENDERED with the plate off: the shipped PNG's alpha is the
        # plate, so measuring it compares rounded rectangles and every pair
        # scores 1.00. The 2026-08-06 audit's 0.60 for h4/h5 was artwork-only.
        # Measured at the symbol's TRUE drawn size inside the 105px cell, not at
        # a common size: a royal really is drawn 20% smaller than a premium and
        # normalising that away throws the size cue in the bin.
        art = premultiplied_resize(artwork_only(name), DRAWN[TIER[name]])
        pad = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
        pad.alpha_composite(art, ((CELL - art.size[0]) // 2,) * 2)
        alphas[name] = np.asarray(pad.getchannel("A"), dtype=np.float64) > 128

        arr = np.asarray(cell.convert("RGB"), dtype=np.float64)
        de = delta_e(arr, np.array(BOARD, dtype=np.float64))
        visible = de > 6
        a = np.asarray(drawn.getchannel("A"), dtype=np.float64) / 255.0
        hue, sat = hue_sat(drawn)
        rows.append({
            "name": name,
            "pay": PAY_RANK.get(name),
            "drawn": DRAWN[TIER[name]],
            "ink": 100.0 * (a > 0.5).sum() / (CELL * CELL),
            "coverage": 100.0 * visible.sum() / visible.size,
            "de_ink": float(de[visible].mean()) if visible.any() else 0.0,
            "energy": float(de.mean()),
            "hue": hue,
            "sat": sat,
        })

    # ---- sheets ----------------------------------------------------------
    _sheet(cells, ORDER, 1, os.path.join(OUT, "sheet_reel_105.png"))
    _sheet(cells, ORDER, 6, os.path.join(OUT, "sheet_reel_105_x6.png"))
    _glance(cells, ORDER, os.path.join(OUT, "sheet_glance_26.png"))
    _board(cells, os.path.join(OUT, "board_5x4.png"))

    # ---- table -----------------------------------------------------------
    print(f"\n{'sym':<5}{'pay':>6}{'drawn':>7}{'ink%':>7}{'lit%':>7}{'dE ink':>8}{'energy':>8}{'hue':>7}{'sat':>6}")
    for r in rows:
        pay = "-" if r["pay"] is None else f"{r['pay']}x"
        print(f"{r['name']:<5}{pay:>6}{r['drawn']:>7}{r['ink']:>7.1f}{r['coverage']:>7.1f}"
              f"{r['de_ink']:>8.1f}{r['energy']:>8.1f}{r['hue']:>7.0f}{r['sat']:>6.2f}")

    paying = [r for r in rows if r["pay"] is not None]
    pays = [r["pay"] for r in paying]
    for label, key in (("ink coverage", "ink"), ("contrast (dE ink)", "de_ink"),
                       ("cell energy (mean dE)", "energy")):
        rho, p = spearman(pays, [r[key] for r in paying])
        print(f"  Spearman(pay, {label:<22}) = {rho:+.2f}   p={p:.3f}")

    # ---- silhouette IoU --------------------------------------------------
    print("\nsilhouette IoU (artwork only, plate off, alpha > 0.5, true drawn size in a 105px cell):")
    paying_keys = [k for k in ORDER if k not in ("w", "fs", "c")]
    pairs = []
    for a, b in itertools.combinations(ORDER, 2):
        inter = np.logical_and(alphas[a], alphas[b]).sum()
        union = np.logical_or(alphas[a], alphas[b]).sum()
        pairs.append((inter / max(1, union), a, b))
    pairs.sort(reverse=True)
    print("  paying symbols (must be < 0.45):")
    for iou, a, b in [p for p in pairs if p[1] in paying_keys and p[2] in paying_keys][:8]:
        flag = "  <-- OVER 0.45" if iou >= 0.45 else ""
        print(f"    {a:>3} / {b:<3} {iou:.2f}{flag}")
    print("  specials (deliberately ONE family - a shared plate+ribbon is the cue):")
    for iou, a, b in [p for p in pairs if p[1] in ("w", "fs", "c") and p[2] in ("w", "fs", "c")]:
        print(f"    {a:>3} / {b:<3} {iou:.2f}")
    h4h5 = next(i for i, a, b in pairs if {a, b} == {"h4", "h5"})
    print(f"  h4/h5 = {h4h5:.2f} (baseline 0.60, target < 0.45)")

    # ---- hue separation --------------------------------------------------
    print("\nidentity hue separation (deg) - closest pairs:")
    hues = {r["name"]: r["hue"] for r in rows}
    gaps = sorted(
        (hue_gap(hues[a], hues[b]), a, b)
        for a, b in itertools.combinations(ORDER, 2)
        if a not in ROYALS and b not in ROYALS
    )
    for gap, a, b in gaps[:6]:
        flag = "  <-- UNDER 25" if gap < 25 else ""
        print(f"  {a:>3} / {b:<3} {gap:5.0f}{flag}")

    print(f"\nsheets in {OUT}")


def _sheet(cells, order, zoom, path):
    pad, cols = 10, 6
    rows = (len(order) + cols - 1) // cols
    w = cols * (CELL * zoom + pad) + pad
    h = rows * (CELL * zoom + pad + 14) + pad
    sheet = Image.new("RGB", (w, h), (18, 18, 22))
    draw = ImageDraw.Draw(sheet)
    for i, name in enumerate(order):
        cx = pad + (i % cols) * (CELL * zoom + pad)
        cy = pad + (i // cols) * (CELL * zoom + pad + 14)
        img = cells[name].convert("RGB")
        if zoom > 1:
            img = img.resize((CELL * zoom, CELL * zoom), Image.NEAREST)
        sheet.paste(img, (cx, cy))
        draw.text((cx + 2, cy + CELL * zoom + 2), name, fill=(200, 200, 210))
    sheet.save(path)


def _glance(cells, order, path):
    pad = 8
    w = len(order) * (26 + pad) + pad
    sheet = Image.new("RGB", (w, 26 + 2 * pad), (18, 18, 22))
    for i, name in enumerate(order):
        sheet.paste(cells[name].convert("RGB").resize((26, 26), Image.LANCZOS), (pad + i * (26 + pad), pad))
    sheet.save(path)


def _board(cells, path):
    """A 5x4 board of real cells - the layout a player actually stares at."""
    layout = [
        ["h1", "l1", "h3", "l2", "w"],
        ["l3", "h2", "l4", "h4", "l1"],
        ["h5", "l2", "fs", "l3", "h2"],
        ["l4", "h4", "l1", "c", "h3"],
    ]
    gap = 4
    w = 5 * (CELL + gap) + gap
    h = 4 * (CELL + gap) + gap
    board = Image.new("RGB", (w, h), (26, 6, 44))
    for r, row in enumerate(layout):
        for c, name in enumerate(row):
            board.paste(cells[name].convert("RGB"), (gap + c * (CELL + gap), gap + r * (CELL + gap)))
    board.save(path)


if __name__ == "__main__":
    main()
