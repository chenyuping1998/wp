"""The title wordmark and the free-game boards, 2026-10-23 (user).

  logo_board.png   the loading / feature-card title. It was the game's name
                   in flat red on a cream panel with a saucer and a cow pasted
                   in its corners; the user wanted no board, only lettering,
                   and lettering worth looking at. Now a 1950s drive-in title:
                   SAUCER arched over MONKEY, a sunset gradient (yellow ->
                   orange -> red) with a halftone screen over its lower half,
                   a deep navy block extrusion, a navy ink line and a cream
                   keyline outside it all so it reads on the night backdrop.
                   Nothing but the letters: no panel, no icons.
  fg_intro.png     the free-game boards. They were a blank cream panel with a
  fg_total.png     ray gun, a saucer and a cow pinned in its corners (the user:
                   no stickers, design the board itself). Now cut from the
                   game's own illustration, like the Buy Bonus cards: the night
                   farm (the feature backdrop for the intro, the base backdrop
                   for the total) in a window across the top, its bottom edge
                   dissolving into the paper in a rough print screen like the
                   cards' own, the cards' paper grain below, a navy ink frame
                   and a red rule round the paper (the Super Bonus card's red).
  fg_*_decor.png   written empty: nothing is pinned on the boards any more.

Text on the boards is drawn by the frontend; its safe rectangle is PAPER in
src/components/FreeSpinAnimation.svelte — re-measure both together.

Run after build_saucer_art.py (it writes the old panels):
    python design/build_saucer_signs.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

APP = Path(__file__).resolve().parents[1]
SRC = APP / "design/source/saucer"
V8 = APP / "static/assets/sprites/sushiV8"
FONT = APP / "static/fonts/sushi/BowlbyOne-Regular.ttf"

INK = (20, 26, 51)
CREAM = (248, 236, 206)
RED = (229, 67, 47)


def save(im, name):
    im.save(V8 / name, optimize=True)
    print("wrote", (V8 / name).relative_to(APP))


# ── the wordmark ────────────────────────────────────────────────────────────
LW, LH = 1600, 600


def text_mask(text, size, stroke=0):
    """the line's letters (plus `stroke` px all round), centred on a LW-wide strip"""
    f = ImageFont.truetype(str(FONT), size)
    pad = stroke + 40
    x0, y0, x1, y1 = f.getbbox(text, stroke_width=stroke)
    w, h = x1 - x0, y1 - y0
    strip = Image.new("L", (LW, h + 2 * pad), 0)
    ImageDraw.Draw(strip).text(((LW - w) / 2 - x0, pad - y0), text, font=f, fill=255,
                               stroke_width=stroke, stroke_fill=255)
    return np.asarray(strip, float) / 255, pad


def arch(m, lift, centre_y):
    """shift every column up by lift*(1-u^2) (u = -1..1 across the strip),
    sampled with a linear blend so the letters stay smooth; lift < 0 sags"""
    h, w = m.shape
    out = np.zeros((LH, LW))
    u = (np.arange(w) - w / 2) / (w / 2)
    shift = lift * (1 - u ** 2)
    ys = np.arange(LH)[:, None]
    # where each output row samples the strip
    src = ys - (centre_y - h / 2) + shift[None, :]
    i0 = np.floor(src).astype(int)
    t = src - i0
    cols = np.arange(w)[None, :].repeat(LH, 0)
    def at(i):
        ok = (i >= 0) & (i < h)
        v = np.zeros((LH, w))
        v[ok] = m[np.clip(i, 0, h - 1)[ok], cols[ok]]
        return v
    return at(i0) * (1 - t) + at(i0 + 1) * t


def line_layers(text, size, centre_y, lift):
    """fill / ink line / cream keyline masks for one line, arched"""
    fill, p0 = text_mask(text, size)
    ink, p1 = text_mask(text, size, 13)
    key, p2 = text_mask(text, size, 13 + 9)
    # all three strips are centred on the same glyphs: their pads differ, so
    # their heights differ by 2*(pad difference) and centring keeps them aligned
    return [arch(m, lift, centre_y) for m in (fill, ink, key)]


def shifted(m, dx, dy):
    out = np.zeros_like(m)
    h, w = m.shape
    out[max(0, dy):h + min(0, dy), max(0, dx):w + min(0, dx)] = m[max(0, -dy):h - max(0, dy), max(0, -dx):w - max(0, dx)]
    return out


def wordmark():
    top = line_layers("SAUCER", 236, 248, 78)
    bot = line_layers("MONKEY", 176, 452, -10)
    fill, ink, key = (np.maximum(a, b) for a, b in zip(top, bot))
    # the block extrusion: the ink line stepped down and right
    ext = np.zeros_like(ink)
    DEPTH = 20
    for i in range(1, DEPTH + 1):
        ext = np.maximum(ext, shifted(ink, round(i * 0.45), i))
    keyline = np.maximum(key, shifted(key, round(DEPTH * 0.45), DEPTH))

    h, w = fill.shape
    ys, xs = np.mgrid[0:h, 0:w]
    out = np.zeros((h, w, 4))

    def over(rgb, a):
        a = np.clip(a, 0, 1)[..., None]
        out[..., :3] = out[..., :3] * (1 - a) + np.asarray(rgb, float) * a
        out[..., 3:] = out[..., 3:] + (1 - out[..., 3:]) * a

    # a faint green beam-glow behind the whole title (the saucer's light)
    glow = np.asarray(Image.fromarray((keyline * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(26)), float) / 255
    over((124, 240, 90), glow * 0.42)
    over(CREAM, keyline)
    # the extrusion darkens with depth: a lighter navy band near the face
    over((44, 58, 104), ext)
    over(INK, shifted(ext, 2, 4) * ext)
    over(INK, ink)

    # the face: a sunset gradient per line (each line has its own top/bottom)
    def band(y0, y1):
        k = np.clip((ys - y0) / (y1 - y0), 0, 1)
        stops = [(0.0, (255, 226, 92)), (0.42, (255, 172, 46)), (0.7, (242, 108, 34)), (1.0, (214, 52, 38))]
        rgb = np.zeros((h, w, 3))
        for (k0, c0), (k1, c1) in zip(stops, stops[1:]):
            t = np.clip((k - k0) / (k1 - k0), 0, 1)[..., None]
            seg = (k >= k0) & (k <= k1)
            rgb[seg] = (np.asarray(c0) * (1 - t) + np.asarray(c1) * t)[seg]
        return rgb
    rows_top = np.nonzero(top[0].max(1) > 0.5)[0]
    rows_bot = np.nonzero(bot[0].max(1) > 0.5)[0]
    face = np.where((ys < (rows_top.max() + rows_bot.min()) / 2)[..., None],
                    band(rows_top.min() + 30, rows_top.max() - 10), band(rows_bot.min() + 10, rows_bot.max() - 6))
    a = np.clip(fill, 0, 1)[..., None]
    out[..., :3] = out[..., :3] * (1 - a) + face * a

    # a halftone screen over each line's lower half, dots growing downward
    P = 9
    cx, cy = (xs % P) - P / 2 + 0.5, (ys % P) - P / 2 + 0.5
    r = np.hypot(cx, cy)
    def screen(rows):
        k = np.clip((ys - (rows.min() + rows.max()) / 2) / ((rows.max() - rows.min()) / 2), 0, 1)
        return np.clip((k * P * 0.42 - r) + 0.5, 0, 1) * (k > 0)
    dots = np.maximum(screen(rows_top) * (ys < rows_bot.min()), screen(rows_bot) * (ys >= rows_bot.min()))
    over((168, 30, 34), dots * fill * 0.55)

    # the glint: a cream line just inside each letter's top edge
    inner = np.clip(fill - shifted(fill, 0, 7), 0, 1) * shifted(fill, 0, -3)
    over((255, 248, 222), inner * 0.85)

    img = Image.fromarray((out[..., :3]).round().clip(0, 255).astype(np.uint8))
    img.putalpha(Image.fromarray((out[..., 3] * 255).round().clip(0, 255).astype(np.uint8)))
    return img


# ── the free-game boards ────────────────────────────────────────────────────
W, H = 1600, 1000
M, FRAME, R = 18, 11, 46          # outer paper margin, ink frame, outer corner
SPLIT = 470                        # where the view dissolves into the paper
RULE = (64, SPLIT + 46, W - 64, H - 58)


def rounded(size, box, radius, sc=4):
    big = Image.new("L", (size[0] * sc, size[1] * sc), 0)
    ImageDraw.Draw(big).rounded_rectangle([v * sc for v in box], radius * sc, fill=255)
    return np.asarray(big.resize(size, Image.Resampling.LANCZOS), float) / 255


def ring(size, box, radius, width, sc=4):
    big = Image.new("L", (size[0] * sc, size[1] * sc), 0)
    ImageDraw.Draw(big).rounded_rectangle([v * sc for v in box], radius * sc, outline=255, width=round(width * sc))
    return np.asarray(big.resize(size, Image.Resampling.LANCZOS), float) / 255


def paper():
    """the cards' own paper, grain and all (card_bonus.png's empty panel)"""
    card = Image.open(SRC / "cards/card_bonus.png").convert("RGB")
    p = card.crop((60, 1130, 1000, 1420)).resize((W, H), Image.Resampling.LANCZOS)
    return np.asarray(p, float)


def board(view_name, crop_top):
    out = np.zeros((H, W, 4))
    out[..., :3] = paper()
    out[..., 3] = rounded((W, H), (0, 0, W - 1, H - 1), R + M)

    # the view, inside the frame, down to the dissolve
    x0, y0, x1 = M + FRAME, M + FRAME, W - M - FRAME
    ww = x1 - x0
    src = Image.open(SRC / "backgrounds" / view_name).convert("RGB")
    k = ww / src.width
    scaled = np.asarray(src.resize((ww, round(src.height * k)), Image.Resampling.LANCZOS), float)
    wh = SPLIT + 40 - y0
    pic = np.zeros((H, W, 3))
    pic[y0:y0 + wh, x0:x1] = scaled[crop_top:crop_top + wh]

    # the dissolve: a ragged edge and a band of print speckle under it, the
    # way the cards' picture breaks up into their paper
    rng = np.random.default_rng(23)
    xs = np.arange(W)
    edge = SPLIT + 5 * np.sin(xs / 41.0) + 3 * np.sin(xs / 13.3 + 1.7)
    edge = edge + np.convolve(rng.normal(0, 2.2, W), np.ones(15) / 15, mode="same")
    ys = np.arange(H)[:, None]
    depth = (ys - (edge[None, :] - 30)) / 46          # 0 above the band, 1 at its foot
    noise = rng.random((H, W))
    # halftone-ish: coarse 3px clumps rather than single pixels
    clump = np.asarray(Image.fromarray((noise * 255).astype(np.uint8)).resize((W // 2, H // 2)).resize((W, H), Image.NEAREST), float) / 255
    show = np.where(depth <= 0, 1.0, np.where(depth >= 1, 0.0, (clump > np.clip(depth, 0, 1) ** 0.8).astype(float)))
    win = rounded((W, H), (x0, y0, x1, H), R - FRAME) * show
    # a darker print of the picture's own ink at the band (the screen is
    # heavier where it breaks up), then the picture
    a = win[..., None]
    out[..., :3] = out[..., :3] * (1 - a) + pic * a

    # inner shadow under the frame's top and sides
    sh = Image.fromarray((ring((W, H), (x0, y0, x1, H + 40), R - FRAME, 7) * 140).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))
    sha = np.asarray(sh, float) / 255 * win
    out[..., :3] = out[..., :3] * (1 - sha[..., None]) + np.asarray(INK, float) * sha[..., None]

    # the red rule round the paper, doubled thin like a ticket's
    for box, wdt in ((RULE, 5), ((RULE[0] + 11, RULE[1] + 11, RULE[2] - 11, RULE[3] - 11), 2)):
        rr = ring((W, H), box, 26 if wdt == 5 else 18, wdt)
        out[..., :3] = out[..., :3] * (1 - rr[..., None]) + np.asarray(RED, float) * rr[..., None]

    # the navy frame
    fr = ring((W, H), (M, M, W - 1 - M, H - 1 - M), R, FRAME)
    out[..., :3] = out[..., :3] * (1 - fr[..., None]) + np.asarray(INK, float) * fr[..., None]

    img = Image.fromarray(out[..., :3].round().clip(0, 255).astype(np.uint8))
    img.putalpha(Image.fromarray((out[..., 3] * 255).round().clip(0, 255).astype(np.uint8)))
    return img


if __name__ == "__main__":
    save(wordmark(), "logo_board.png")
    save(board("background_feature_v2.png", 0), "fg_intro.png")
    save(board("background_base.png", 40), "fg_total.png")
    for n in ("fg_intro_decor.png", "fg_total_decor.png"):
        save(Image.new("RGBA", (W, H)), n)
