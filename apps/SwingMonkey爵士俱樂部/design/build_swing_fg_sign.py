"""The free-game boards (fg_intro / fg_total), 2026-10-18.

The old boards were a flat cream panel in a red/black/gold frame with a dotted
row of studs and a monkey badge and a record pasted into the corners — plain,
and the pasted icons read as AI-made (the note the user gave Putt / Strike).
These are cut from the game's own illustration instead, as a GIG TICKET:

  - a window onto the stage, cropped from the game's own backdrop (the lit
    feature stage for the intro — the spotlit curtain, the drum kit, the
    double bass; the house for the total — table lamps and a cocktail)
  - under it the ticket's paper, with the stub's two half-moon notches and a
    perforation line torn across between them — the one thing that makes it a
    ticket, drawn in the board's own ink
  - ink / paper / red are the logo's (logo_board.png)

No icons are added and the decor layers are written empty, so nothing on the
board moves on its own; the board itself drops and settles and the stage's
spotlight swings across the window once (FreeSpinAnimation.svelte). Text is
drawn by the frontend on the paper inside the keyline; its safe rectangle is PAPER in
FreeSpinAnimation.svelte — re-measure both together.

Run: python design/build_swing_fg_sign.py
Originals are kept once in design/source/_pre_fg_sign/.
"""
from pathlib import Path
import shutil

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

APP = Path(__file__).resolve().parents[1]
V8 = APP / "static/assets/sprites/sushiV8"
BG = APP / "static/assets/sprites/sushiBackground"
BACKUP = APP / "design/source/_pre_fg_sign"

W, H = 1600, 1000
# measured on logo_board.png
INK = (36, 29, 28)
PAPER = (248, 232, 198)
RED = (170, 43, 56)
GOLD = (233, 190, 100)
MARGIN, INK_W, RADIUS = 16, 14, 46
SEAM_Y = 420  # window bottom / paper top (board px)
NOTCH_R = 46  # the stub's half-moon notches
NOTCH_DROP = 62  # notch centre below the seam


def rounded_mask(size, box, radius, scale=4):
    big = Image.new("L", (size[0] * scale, size[1] * scale), 0)
    ImageDraw.Draw(big).rounded_rectangle([v * scale for v in box], radius * scale, fill=255)
    return big.resize(size, Image.Resampling.LANCZOS)


def stroke_layer(size, draw_fn, colour, scale=4):
    big = Image.new("L", (size[0] * scale, size[1] * scale), 0)
    draw_fn(ImageDraw.Draw(big), scale)
    m = big.resize(size, Image.Resampling.LANCZOS)
    layer = Image.new("RGBA", size, colour + (255,))
    layer.putalpha(m)
    return layer


def view(src_path: Path, box, size, lift=1.0):
    """box: (x0, y0, x1) of the backdrop to show; height follows the window.
    lift > 1 brightens the stage a touch (the backdrop is painted dark to sit
    behind the reels; in a small window it needs to read)."""
    src = Image.open(src_path).convert("RGBA")
    x0, y0, x1 = box
    k = size[0] / (x1 - x0)
    h = round(size[1] / k)
    pic = src.crop((x0, y0, x1, y0 + h)).resize(size, Image.Resampling.LANCZOS)
    if lift != 1.0:
        a = np.asarray(pic).astype(np.float32)
        a[..., :3] = 255 * (a[..., :3] / 255) ** (1 / lift)
        pic = Image.fromarray(a.clip(0, 255).astype(np.uint8))
    return pic


def notches(im: Image.Image, y: int, r: int, ink_w: int, dash=None):
    """Bite a half-moon out of both side edges at y and ink the bite's rim, then
    (dash=(x0, x1, colour)) rule a perforation between the two bites."""
    w, h = im.size
    sc = 4
    a = np.asarray(im.getchannel("A")).astype(np.float32) / 255
    ring = Image.new("L", (w * sc, h * sc), 0)
    d = ImageDraw.Draw(ring)
    for cx in (0, w):
        d.ellipse([(cx - r - ink_w) * sc, (y - r - ink_w) * sc, (cx + r + ink_w) * sc, (y + r + ink_w) * sc], fill=255)
    ring = np.asarray(ring.resize((w, h), Image.Resampling.LANCZOS)).astype(np.float32) / 255
    hole = Image.new("L", (w * sc, h * sc), 0)
    d = ImageDraw.Draw(hole)
    for cx in (0, w):
        d.ellipse([(cx - r) * sc, (y - r) * sc, (cx + r) * sc, (y + r) * sc], fill=255)
    hole = np.asarray(hole.resize((w, h), Image.Resampling.LANCZOS)).astype(np.float32) / 255
    out = np.asarray(im).astype(np.float32).copy()
    ink = np.array(INK, np.float32)
    k = (ring * a)[..., None]
    out[..., :3] = out[..., :3] * (1 - k) + ink * k
    out[..., 3] = 255 * a * (1 - hole)
    res = Image.fromarray(out.clip(0, 255).astype(np.uint8))
    if dash:
        x0, x1, colour = dash
        seg, gap, th = round(r * 0.42), round(r * 0.3), max(3, round(ink_w * 0.4))
        res.alpha_composite(stroke_layer((w, h), lambda dr, s: [
            dr.rounded_rectangle([x * s, (y - th / 2) * s, min(x + seg, x1) * s, (y + th / 2) * s], th / 2 * s, fill=255)
            for x in range(x0, x1, seg + gap)], colour))
    return res


def board(bg: Path, box, size=(W, H), seam=SEAM_Y, k=1.0, lift=1.15, ticket=True) -> Image.Image:
    """k scales the frame and rules (the win plaques are 0.6 of a board)."""
    W, H = size
    m, ink, rad = round(MARGIN * k), round(INK_W * k), round(RADIUS * k)
    out = Image.new("RGBA", (W, H))
    out.paste(Image.new("RGBA", (W, H), PAPER + (255,)), (0, 0),
              rounded_mask((W, H), (0, 0, W - 1, H - 1), rad + m))

    # the window onto the stage, inside the ink frame, square at the seam
    win = (m + ink, m + ink, W - m - ink, seam)
    pic = view(bg, box, (win[2] - win[0], win[3] - win[1]), lift)
    mask = np.asarray(rounded_mask((W, H), (win[0], win[1], win[2], win[3] + rad), rad - ink)).copy()
    mask[seam:, :] = 0
    layer = Image.new("RGBA", (W, H))
    layer.paste(pic, (win[0], win[1]))
    out.paste(layer, (0, 0), Image.fromarray(mask))
    # a soft shade under the frame, as a picture behind glass
    sh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh).rounded_rectangle((win[0], win[1], win[2], win[3] + rad), rad - ink, outline=130, width=round(9 * k))
    sh = sh.filter(ImageFilter.GaussianBlur(7 * k))
    shm = np.asarray(sh).astype(np.float32) * (mask / 255.0)
    shade = Image.new("RGBA", (W, H), INK + (255,))
    shade.putalpha(Image.fromarray(shm.astype(np.uint8)))
    out.alpha_composite(shade)

    # ink: the outer frame, the rule under the window, and the logo's red
    # pinstripe under that
    def frame(d, s):
        d.rounded_rectangle([m * s, m * s, (W - m) * s - 1, (H - m) * s - 1], rad * s,
                            outline=255, width=round(ink * s))
        d.rectangle([(m + ink) * s, (seam - 2) * s, (W - m - ink) * s, (seam + round(10 * k)) * s], fill=255)
    out.alpha_composite(stroke_layer((W, H), lambda d, s: d.rectangle(
        [(m + ink) * s, (seam + round(10 * k)) * s, (W - m - ink) * s, (seam + round(17 * k)) * s], fill=255), RED))
    out.alpha_composite(stroke_layer((W, H), frame, INK))
    # the paper's keyline: the logo's red, inset under the perforation
    k_in = m + ink + round(26 * k)
    top = seam + round((NOTCH_DROP + 30) * k) if ticket else seam + round(26 * k)
    out.alpha_composite(stroke_layer((W, H), lambda d, s: d.rounded_rectangle(
        [k_in * s, top * s, (W - k_in) * s, (H - k_in) * s], round(28 * k) * s,
        outline=255, width=round(4 * k * s)), RED))
    if ticket:
        r = round(NOTCH_R * k)
        out = notches(out, seam + round(NOTCH_DROP * k), r, ink,
                      dash=(r + ink + round(18 * k), W - r - ink - round(18 * k), RED))
    return out


def counter_plate() -> Image.Image:
    """The FG spin counter (FreeSpinCounter.svelte, W:H = 2:1.6): the ticket's
    paper and ink frame, its header band a strip of the stage's own valance and
    spotlight instead of the old flat teal band over a red offset print."""
    cw, ch = 800, 640
    m, ink, rad = 6, 10, 30
    out = Image.new("RGBA", (cw, ch))
    out.paste(Image.new("RGBA", (cw, ch), PAPER + (255,)), (0, 0),
              rounded_mask((cw, ch), (0, 0, cw - 1, ch - 1), rad + m))
    band_h = round(ch * 0.235)
    win = (m + ink, m + ink, cw - m - ink, m + ink + band_h)
    # the valance's gold fringe over the spotlit curtain, darkened a touch so
    # the cream title reads on it
    pic = view(BG / "bg_feature.png", (300, 40, 1100), (win[2] - win[0], win[3] - win[1]), lift=0.85)
    mask = np.asarray(rounded_mask((cw, ch), (win[0], win[1], win[2], win[3] + rad), rad - ink)).copy()
    mask[win[3]:, :] = 0
    layer = Image.new("RGBA", (cw, ch))
    layer.paste(pic, (win[0], win[1]))
    out.paste(layer, (0, 0), Image.fromarray(mask))

    def frame(d, s):
        d.rounded_rectangle([m * s, m * s, (cw - m) * s - 1, (ch - m) * s - 1], rad * s, outline=255, width=ink * s)
        d.rectangle([(m + ink) * s, win[3] * s, (cw - m - ink) * s, (win[3] + 7) * s], fill=255)
    out.alpha_composite(stroke_layer((cw, ch), lambda d, s: d.rectangle(
        [(m + ink) * s, (win[3] + 7) * s, (cw - m - ink) * s, (win[3] + 12) * s], fill=255), RED))
    out.alpha_composite(stroke_layer((cw, ch), frame, INK))
    return out


def save(im: Image.Image, name: str):
    p = V8 / name
    BACKUP.mkdir(parents=True, exist_ok=True)
    if p.exists() and not (BACKUP / name).exists():
        shutil.copy2(p, BACKUP / name)
    im.save(p, optimize=True)
    print("wrote", p.relative_to(APP))


if __name__ == "__main__":
    # the spotlit curtain with the drums and the bass in the wings
    save(board(BG / "bg_feature.png", (0, 360, 1400)), "fg_intro.png")
    # after the set, the house: the stage's edge, table lamps, a cocktail
    save(board(BG / "bg_base.png", (0, 594, 1920), lift=1.12), "fg_total.png")
    save(counter_plate(), "fg_counter.png")
    # the level-up board (BanditMeter.svelte, W:H = 1:0.77): the dancer and the
    # card play on the stage in the window; the rungs sit on the ticket below.
    # Seam at 0.62 H so the rung rail (H*.20 below centre) is on the paper.
    save(board(BG / "bg_feature.png", (60, 120, 1500), size=(1000, 770), seam=478, k=0.7), "meter_board.png")
    for n in ("fg_intro_decor.png", "fg_total_decor.png"):
        save(Image.new("RGBA", (W, H)), n)
    print(f"paper text area: y {SEAM_Y + NOTCH_DROP + 36} .. {H - MARGIN - INK_W - 30}")
