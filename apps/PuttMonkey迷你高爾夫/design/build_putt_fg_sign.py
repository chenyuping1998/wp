"""The free-game boards (fg_intro / fg_total), 2026-10-18.

The first boards were a plain cream panel with a windmill, a ball and a flag
pasted into three corners — the user called them bare, and the pasted icons
"AI-feeling". These are cut from the game's own illustration instead: a
landscape version of the Buy Bonus postcard (design/source/putt/cards/
card_bonus.png), so the boards share the hand-drawn ink frame, the grass band
with hibiscus and the grass tufts in the paper's bottom corners:

  - the card's paper panel is three-sliced: both
    corner columns keep their drawing 1:1, only the plain middle stretches
  - above it a view of the course, cropped from the scene backdrop (sunset for
    the intro, the daytime course for the total, which hands back to the base
    game), sitting on the panel's top ink line like the card's own picture.
    (The card's grass band was tried first: fading it into the view left
    ghost hibiscus, and cutting it hard cut the flowers in half.)
  - ink frame, outer paper margin and corner radius are measured on the card

No icons are added and the decor layers are written empty, so nothing on the
board moves on its own; the board itself drops and settles
(FreeSpinAnimation.svelte). Text is drawn by the frontend on the paper; its
safe rectangle is PAPER in FreeSpinAnimation.svelte — re-measure both together.

Run: python design/build_putt_fg_sign.py   (after build_putt_art.py)
"""
from pathlib import Path
import shutil

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

APP = Path(__file__).resolve().parents[1]
SRC = APP / "design/source/putt"
V8 = APP / "static/assets/sprites/sushiV8"
BACKUP = SRC / "_previous_runtime/sushiV8"

W, H = 1600, 1000
S = 1.2  # card px -> board px
# measured on card_bonus.png (1060x1484)
CARD_INK = (10, 58, 36)
CARD_PAPER = (254, 244, 210)
MARGIN, INK_W, RADIUS = 14, 9, 40  # card px: outer paper, ink frame, outer corner
STRIP_Y0 = 998  # just above the paper panel's top ink line (card y ~1008)
LEFT_X1, RIGHT_X0 = 330, 730  # corner columns (flowers, tufts) kept 1:1


def three_slice(strip: Image.Image, width: int, S: float = S) -> Image.Image:
    w, h = strip.size
    l = strip.crop((0, 0, LEFT_X1, h))
    m = strip.crop((LEFT_X1, 0, RIGHT_X0, h))
    r = strip.crop((RIGHT_X0, 0, w, h))
    sl = l.resize((round(l.width * S), round(h * S)), Image.Resampling.LANCZOS)
    sr = r.resize((round(r.width * S), round(h * S)), Image.Resampling.LANCZOS)
    sm = m.resize((width - sl.width - sr.width, round(h * S)), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (width, sl.height))
    out.paste(sl, (0, 0))
    out.paste(sm, (sl.width, 0))
    out.paste(sr, (sl.width + sm.width, 0))
    return out


def rounded_mask(size, box, radius, scale=4):
    big = Image.new("L", (size[0] * scale, size[1] * scale), 0)
    ImageDraw.Draw(big).rounded_rectangle([v * scale for v in box], radius * scale, fill=255)
    return big.resize(size, Image.Resampling.LANCZOS)


def board(view: Path, crop_y: float, size=(W, H), S: float = S, view_box=None) -> Image.Image:
    """view_box: (x0, x1) of the view's source to fill the window with (the
    window's aspect sets the height; crop_y picks how far down), default all."""
    W, H = size
    card = Image.open(SRC / "cards/card_bonus.png").convert("RGBA")
    strip = three_slice(card.crop((0, STRIP_Y0, card.width, card.height)), W, S)
    sy = H - strip.height  # where the strip starts on the board

    m, ink, rad = round(MARGIN * S), round(INK_W * S), round(RADIUS * S)
    out = Image.new("RGBA", (W, H))
    # outer paper with the card's rounded corners
    paper = Image.new("RGBA", (W, H), CARD_PAPER + (255,))
    out.paste(paper, (0, 0), rounded_mask((W, H), (0, 0, W - 1, H - 1), rad + m))

    # the view, inside the ink frame, cropped to fill the window
    win = (m + ink, m + ink, W - m - ink, sy + round(14 * S))
    ww, wh = win[2] - win[0], win[3] - win[1]
    src = Image.open(view).convert("RGBA")
    if view_box:
        src = src.crop((view_box[0], 0, view_box[1], src.height))
    k = ww / src.width
    scaled = src.resize((ww, round(src.height * k)), Image.Resampling.LANCZOS)
    top = round((scaled.height - wh) * crop_y)
    pic = scaled.crop((0, top, ww, top + wh))
    win_mask = rounded_mask((W, H), win, rad - ink)
    layer = Image.new("RGBA", (W, H))
    layer.paste(pic, (win[0], win[1]))
    out.paste(layer, (0, 0), win_mask)

    # the strip over the view: its top few rows (the band's last grass,
    # above the panel's ink line) fade into the view's own lawn
    a = np.asarray(strip).copy()
    fade = round(9 * S)
    ramp = np.clip(np.arange(strip.height) / fade, 0, 1) ** 1.6
    a[..., 3] = (a[..., 3] * ramp[:, None]).astype(np.uint8)
    # keep the strip's own outer paper and ink sides opaque all the way up,
    # so the frame reads as one line
    side = round((MARGIN + INK_W + 2) * S)
    a[:, :side, 3] = np.asarray(strip)[:, :side, 3]
    a[:, -side:, 3] = np.asarray(strip)[:, -side:, 3]
    out.alpha_composite(Image.fromarray(a), (0, sy))

    # the ink frame above the strip: sides and the rounded top, drawn at 4x
    sc = 4
    big = Image.new("L", (W * sc, H * sc), 0)
    d = ImageDraw.Draw(big)
    # pil strokes inward from the box, so the box is the frame's OUTER edge
    d.rounded_rectangle([m * sc, m * sc, (W - m) * sc - 1, (H - m) * sc - 1], rad * sc,
                        outline=255, width=round(ink * sc))
    frame = big.resize((W, H), Image.Resampling.LANCZOS)
    # only above the strip's opaque rows; the strip draws its own frame below
    fm = np.asarray(frame).astype(np.float32)
    fm[sy + fade:, :] = 0
    fm[sy:sy + fade, :] *= (1 - np.clip(np.arange(fade) / fade, 0, 1))[:, None]
    ink_layer = Image.new("RGBA", (W, H), CARD_INK + (255,))
    ink_layer.putalpha(Image.fromarray(fm.astype(np.uint8)))
    out.alpha_composite(ink_layer)

    # a thin inner shadow under the frame's top, as the card's picture has
    sh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh).rounded_rectangle(win, rad - ink, outline=110, width=6)
    sh = sh.filter(ImageFilter.GaussianBlur(5))
    shade = Image.new("RGBA", (W, H), (0, 30, 18, 255))
    shm = np.asarray(sh).astype(np.float32) * (np.asarray(win_mask) / 255.0)
    shm[sy:, :] = 0
    shade.putalpha(Image.fromarray(shm.astype(np.uint8)))
    out.alpha_composite(shade)
    return out


def counter_plate() -> Image.Image:
    """The FG spin counter (FreeSpinCounter.svelte, W:H = 2:1.6): the card's
    paper and ink frame, with a header band cut from the card's own drawn lawn
    instead of the old flat colour band and red offset print."""
    cw, ch = 800, 640
    card = Image.open(SRC / "cards/card_bonus.png").convert("RGBA")
    m, ink, rad = 6, 9, 30
    out = Image.new("RGBA", (cw, ch))
    out.paste(Image.new("RGBA", (cw, ch), CARD_PAPER + (255,)), (0, 0),
              rounded_mask((cw, ch), (0, 0, cw - 1, ch - 1), rad + m))
    # header: plain lawn from the band's middle (no flowers, no hole)
    band_h = round(ch * 0.235)
    lawn = card.crop((340, 930, 720, 1000)).resize((cw, band_h + 20), Image.Resampling.LANCZOS)
    hdr = Image.new("RGBA", (cw, ch))
    hdr.paste(lawn, (0, m + ink - 4))
    mask = rounded_mask((cw, ch), (m + ink, m + ink, cw - m - ink, m + ink + band_h), rad - ink)
    # square off the band's bottom corners: only the top follows the frame
    mk = np.asarray(mask).copy()
    mk[m + ink + rad: m + ink + band_h, m + ink: cw - m - ink] = 255
    out.paste(hdr, (0, 0), Image.fromarray(mk))
    sc = 4
    big = Image.new("L", (cw * sc, ch * sc), 0)
    d = ImageDraw.Draw(big)
    d.rounded_rectangle([m * sc, m * sc, (cw - m) * sc - 1, (ch - m) * sc - 1], rad * sc, outline=255, width=ink * sc)
    y = (m + ink + band_h) * sc
    d.rectangle([(m + ink) * sc, y, (cw - m - ink) * sc, y + 7 * sc], fill=255)
    frame = big.resize((cw, ch), Image.Resampling.LANCZOS)
    il = Image.new("RGBA", (cw, ch), CARD_INK + (255,))
    il.putalpha(frame)
    out.alpha_composite(il)
    return out


def save(im: Image.Image, name: str):
    p = V8 / name
    BACKUP.mkdir(parents=True, exist_ok=True)
    if p.exists() and not (BACKUP / name).exists():
        shutil.copy2(p, BACKUP / name)
    im.save(p, optimize=True)
    print("wrote", p.relative_to(APP))


if __name__ == "__main__":
    save(board(SRC / "backgrounds/background_feature_v2.png", 0.16), "fg_intro.png")
    save(board(SRC / "backgrounds/background_base.png", 0.16), "fg_total.png")
    save(counter_plate(), "fg_counter.png")
    for n in ("fg_intro_decor.png", "fg_total_decor.png"):
        save(Image.new("RGBA", (W, H)), n)
