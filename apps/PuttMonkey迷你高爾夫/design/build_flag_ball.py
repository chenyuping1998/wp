"""Cut the golf ball off the low-pay pennants so the WIN can putt it into the
cup (2026-10-31, user: the low pays need more when they score — roll the ball
into the hole).

Writes, next to l{n}_flag_v2.png (which stays the still symbol, untouched):
  l{n}_flag_noball.png  the pennant with the ball removed and the turf, its
                        ink edge and the air behind it repainted
                        (seen only while the ball is away)
  flag_ball.png         the ball alone, 128x128, centred on its own middle, so
                        the game rolls it about its centre with nothing to align

All five pennants put the ball in the same place (checked), so the ball is cut
once. At rest the ball back over each base composites to the original
(checked below).

    python design/build_flag_ball.py [--preview out.png]
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

APP = Path(__file__).resolve().parents[1]
DIR = APP / "static/assets/sprites/sushiSymbols"
# on the 512 art; puttFlags.ts uses half of these (its 256 canvas)
BALL_C = (355.5, 369.0)
BALL_R = 48  # the ball with its whole ink ring (measured: top 322, right 403)
SIDE = 128


def ball_mask(a):
    """the ball is a clean disk drawn over everything round it; only the tee's
    red, which pokes in at its right edge, is not ball. (Telling ball from grass
    by colour fails: its dimples and ink are blue-green.)"""
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    yy, xx = np.mgrid[: a.shape[0], : a.shape[1]]
    r = np.hypot(xx - BALL_C[0], yy - BALL_C[1])
    disk = np.clip(BALL_R + 0.5 - r, 0, 1)
    tee = (R > 160) & (G < 120) & (B < 110)
    return disk * ~tee


def grass_top(a, x):
    # from y 330: above that, left of the ball, the column meets the cloth
    col = a[:, x, 3]
    return int(np.argmax(col[330:] > 128)) + 330


def fill_grass(a, hole):
    """behind the ball: the air above the turf's top edge, the edge's ink line,
    and turf. The edge runs straight between where it shows left of the ball
    and in the gap before the tee. The turf is painted, not copied: each row's
    median clean turf colour from left of the ball (not its shadow, not ink),
    with the fine grain the print has. Blending neighbours along the row (tried
    first) streaked the shadow and the ink across it."""
    out = a.copy()
    R, G, B, A = (a[..., i] for i in range(4))
    xl, xr = int(BALL_C[0] - BALL_R - 7), int(BALL_C[0] + BALL_R + 3)
    tl, tr = grass_top(a, xl), grass_top(a, xr)
    ink = np.median(a[tl:tl + 3, xl - 6:xl + 6].reshape(-1, 4), 0)
    clean = (G > R + 50) & (G > 100) & (A > 240)
    src = slice(xl - 90, xl)
    rows = {}
    for y in range(tl, a.shape[0]):
        px = a[y, src][clean[y, src]]
        if len(px) > 8:
            rows[y] = np.median(px, 0)
    rng = np.random.default_rng(7)
    for y, x in zip(*np.nonzero(hole)):
        top = tl + (tr - tl) * (x - xl) / (xr - xl)
        if y < top - 0.5:
            out[y, x] = 0
        elif y < top + 3.5:
            out[y, x] = ink
        else:
            near = min(rows, key=lambda r: abs(r - y))
            c = rows[near].copy()
            c[:3] *= 1 + rng.normal(0, 0.05)
            if rng.random() < 0.05:
                c[:3] *= 0.62
            out[y, x] = c
    return out


def main():
    preview = Path(sys.argv[sys.argv.index("--preview") + 1]) if "--preview" in sys.argv else None
    first = np.asarray(Image.open(DIR / "l1_flag_v2.png").convert("RGBA"), float)
    m = ball_mask(first)
    x0, y0 = int(BALL_C[0] - SIDE / 2), int(BALL_C[1] - SIDE / 2)
    ball = first.copy()
    ball[..., 3] *= m
    Image.fromarray(ball.round().clip(0, 255).astype(np.uint8)).crop((x0, y0, x0 + SIDE, y0 + SIDE)).save(DIR / "flag_ball.png", optimize=True)
    # the hole reaches 2px past the mask, so no rim of ball is left behind
    hole = np.asarray(Image.fromarray(((m > 0.02) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
    sheets = []
    for n in range(1, 6):
        a = np.asarray(Image.open(DIR / f"l{n}_flag_v2.png").convert("RGBA"), float)
        crop = (slice(y0, y0 + SIDE), slice(x0, x0 + SIDE))
        assert np.abs(a[crop] - first[crop]).max() < 1, f"L{n}'s ball differs from L1's"
        base = fill_grass(a, hole)
        img = Image.fromarray(base.round().clip(0, 255).astype(np.uint8))
        img.save(DIR / f"l{n}_flag_noball.png", optimize=True)
        # at rest, base + ball = the original
        back = img.copy()
        back.alpha_composite(Image.open(DIR / "flag_ball.png"), (x0, y0))
        diff = np.abs(np.asarray(back, float) - a)[..., :3] * (a[..., 3:] / 255)
        print(f"L{n}: hole {int(hole.sum())} px, rest mismatch mean {diff.mean():.3f} max {diff.max():.0f}")
        sheets.append(img)
    if preview:
        sheet = Image.new("RGBA", (1024, 512), (255, 0, 255, 255))
        sheet.alpha_composite(sheets[0], (0, 0))
        sheet.alpha_composite(Image.open(DIR / "flag_ball.png").resize((256, 256)), (640, 128))
        sheet.save(preview)


if __name__ == "__main__":
    main()
