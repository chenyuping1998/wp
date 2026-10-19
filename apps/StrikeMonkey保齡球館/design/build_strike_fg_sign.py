"""The free-game boards (fg_intro / fg_total) and the FG spin counter plate,
2026-10-18.

The old boards were a plain cream octagon with a pin, a ball, a trophy and a
badge pasted into the corners — the pasted icons read as AI-made (the same
note the user gave Putt Monkey's boards). These are cut from the game's own
illustration instead, as a lane-side marquee:

  - a window onto the alley, cropped from the game's own backdrop (the violet
    night lanes for the intro, the house lights for the total, which hands
    back to the base game): the score screens, the X band, the pin decks
  - under it the Buy Bonus card's paper (cream, ink frame, the teal keyline the
    Spare Round card is ruled in), where the frontend writes the text
  - ink, paper and keyline colours are the card's (card_bonus.png)

No icons are added and the decor layers are written empty, so nothing on the
board moves on its own; the board itself drops and settles
(FreeSpinAnimation.svelte). Text is drawn by the frontend on the paper; its
safe rectangle is PAPER in FreeSpinAnimation.svelte — re-measure both together.

Run: python design/build_strike_fg_sign.py
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
# measured on card_bonus.png
INK = (20, 38, 46)
PAPER = (247, 234, 208)
TEAL = (63, 196, 168)
RED = (232, 80, 46)
MARGIN, INK_W, RADIUS = 16, 14, 46
SEAM_Y = 430  # window bottom / paper top (board px)


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


def view(src_path: Path, box, size):
    """box: (x0, y0, x1) of the backdrop to show; height follows the window."""
    src = Image.open(src_path).convert("RGBA")
    x0, y0, x1 = box
    k = size[0] / (x1 - x0)
    h = round(size[1] / k)
    return src.crop((x0, y0, x1, y0 + h)).resize(size, Image.Resampling.LANCZOS)


def board(bg: Path, box, size=(W, H), seam=SEAM_Y, k=1.0) -> Image.Image:
    """k scales the frame, rules and keyline (the win plaques are 0.6 of a board)."""
    W, H = size
    m, ink, rad = round(MARGIN * k), round(INK_W * k), round(RADIUS * k)
    out = Image.new("RGBA", (W, H))
    # outer paper with the card's rounded corners
    out.paste(Image.new("RGBA", (W, H), PAPER + (255,)), (0, 0),
              rounded_mask((W, H), (0, 0, W - 1, H - 1), rad + m))

    # the window onto the alley, inside the ink frame, square at the seam
    win = (m + ink, m + ink, W - m - ink, seam)
    pic = view(bg, box, (win[2] - win[0], win[3] - win[1]))
    mask = np.asarray(rounded_mask((W, H), (win[0], win[1], win[2], win[3] + rad), rad - ink)).copy()
    mask[seam:, :] = 0
    layer = Image.new("RGBA", (W, H))
    layer.paste(pic, (win[0], win[1]))
    out.paste(layer, (0, 0), Image.fromarray(mask))
    # a soft shade under the frame's top and sides, as a picture behind glass
    sh = Image.new("L", (W, H), 0)
    ImageDraw.Draw(sh).rounded_rectangle((win[0], win[1], win[2], win[3] + rad), rad - ink, outline=120, width=round(8 * k))
    sh = sh.filter(ImageFilter.GaussianBlur(6 * k))
    shm = np.asarray(sh).astype(np.float32) * (mask / 255.0)
    shade = Image.new("RGBA", (W, H), INK + (255,))
    shade.putalpha(Image.fromarray(shm.astype(np.uint8)))
    out.alpha_composite(shade)

    # the paper's keyline: the Spare Round card's teal rule, inset in the paper
    k_in = m + ink + round(26 * k)
    out.alpha_composite(stroke_layer((W, H), lambda d, s: d.rounded_rectangle(
        [k_in * s, (seam + round(26 * k)) * s, (W - k_in) * s, (H - k_in) * s], round(28 * k) * s,
        outline=255, width=round(5 * k * s)), TEAL))

    # ink: the outer frame, and the rule under the window (with a red pin-stripe
    # beneath it, the card's sweater stripe)
    def frame(d, s):
        d.rounded_rectangle([m * s, m * s, (W - m) * s - 1, (H - m) * s - 1], rad * s,
                            outline=255, width=round(ink * s))
        d.rectangle([(m + ink) * s, (seam - 2) * s, (W - m - ink) * s, (seam + round(10 * k)) * s], fill=255)
    out.alpha_composite(stroke_layer((W, H), lambda d, s: d.rectangle(
        [(m + ink) * s, (seam + round(10 * k)) * s, (W - m - ink) * s, (seam + round(17 * k)) * s], fill=255), RED))
    out.alpha_composite(stroke_layer((W, H), frame, INK))
    return out


def counter_plate() -> Image.Image:
    """The FG spin counter (FreeSpinCounter.svelte, W:H = 2:1.6): the card's
    paper and ink frame, with a header band that is a strip of the alley's own
    score screens instead of the old flat green band and red offset print."""
    cw, ch = 800, 640
    m, ink, rad = 6, 10, 30
    out = Image.new("RGBA", (cw, ch))
    out.paste(Image.new("RGBA", (cw, ch), PAPER + (255,)), (0, 0),
              rounded_mask((cw, ch), (0, 0, cw - 1, ch - 1), rad + m))
    band_h = round(ch * 0.235)
    win = (m + ink, m + ink, cw - m - ink, m + ink + band_h)
    pic = view(BG / "bg_feature.png", (560, 190, 1360), (win[2] - win[0], win[3] - win[1]))
    mask = np.asarray(rounded_mask((cw, ch), (win[0], win[1], win[2], win[3] + rad), rad - ink)).copy()
    mask[win[3]:, :] = 0
    layer = Image.new("RGBA", (cw, ch))
    layer.paste(pic, (win[0], win[1]))
    out.paste(layer, (0, 0), Image.fromarray(mask))

    def frame(d, s):
        d.rounded_rectangle([m * s, m * s, (cw - m) * s - 1, (ch - m) * s - 1], rad * s, outline=255, width=ink * s)
        d.rectangle([(m + ink) * s, win[3] * s, (cw - m - ink) * s, (win[3] + 7) * s], fill=255)
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
    # the lanes from just under the starburst lamps: score screens, X band, pin decks
    save(board(BG / "bg_feature.png", (150, 150, 1770)), "fg_intro.png")
    save(board(BG / "bg_base.png", (150, 150, 1770)), "fg_total.png")
    save(counter_plate(), "fg_counter.png")
    for n in ("fg_intro_decor.png", "fg_total_decor.png"):
        save(Image.new("RGBA", (W, H)), n)
