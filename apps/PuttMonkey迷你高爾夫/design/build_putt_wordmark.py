"""The title wordmark, 2026-10-31 (user: take the board away, make the lettering fun).

  logo_board.png        the loading / feature-card title. It was "PUTT MONKEY"
  logo_board_titled.png in flat red on a cream panel with a flag and a ball
                        pasted in its corners. Now lettering only, in the
                        game's 1960s holiday-postcard voice:
                          PUTT    big, red, every letter bounced up or down and
                                  tipped a few degrees like a hand-cut sign,
                                  with a cream sign-painter's inline
                          MONKEY  sunny yellow on a gentle wave, its O the
                                  game's own golf ball
                        Both share a dark green ink line, a deep green block
                        extrusion, and a cream keyline outside everything so
                        the title reads on the bright sky backdrop.

Same 1600x600 canvas as the old board, so LoadingScreen / FeatureIntro sizes
and the loading bar under it need no change. The letters stay inside
y 30..570.

Run after build_putt_art.py (it writes the old board):
    python design/build_putt_wordmark.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

APP = Path(__file__).resolve().parents[1]
V8 = APP / "static/assets/sprites/sushiV8"
BALL = APP / "static/assets/sprites/sushiSymbols/p_white_v2.png"
FONT = APP / "static/fonts/sushi/BowlbyOne-Regular.ttf"

LW, LH = 1600, 600
INK = (27, 42, 34)
EXT = (31, 74, 44)
CREAM = (255, 246, 223)
INK_W, KEY_W = 10, 15  # ink line, then the cream keyline beyond it


def glyph_masks(ch, size, angle):
    """fill / ink / keyline masks for one letter, rotated about its centre"""
    f = ImageFont.truetype(str(FONT), size)
    pad = KEY_W + 30
    x0, y0, x1, y1 = f.getbbox(ch)
    w, h = x1 - x0, y1 - y0
    out = []
    for stroke in (0, INK_W, KEY_W):
        m = Image.new("L", (w + 2 * pad, h + 2 * pad), 0)
        ImageDraw.Draw(m).text((pad - x0, pad - y0), ch, font=f, fill=255,
                               stroke_width=stroke, stroke_fill=255)
        out.append(m.rotate(angle, Image.Resampling.BICUBIC, expand=True))
    return out, w, h


def ball_masks(d, angle):
    """the golf ball as a letter: its art plus ink/keyline rings from its alpha"""
    src = Image.open(BALL).convert("RGBA")
    src = src.crop(src.getchannel("A").getbbox()).resize((d, d), Image.Resampling.LANCZOS)
    pad = KEY_W + 30
    art = Image.new("RGBA", (d + 2 * pad, d + 2 * pad))
    art.alpha_composite(src, (pad, pad))
    a = art.getchannel("A")
    ink = a.filter(ImageFilter.MaxFilter(2 * INK_W + 1))
    key = a.filter(ImageFilter.MaxFilter(2 * KEY_W + 1))
    rot = lambda im: im.rotate(angle, Image.Resampling.BICUBIC, expand=True)
    return rot(art), [rot(a), rot(ink), rot(key)]


def line(text, size, cy, bounce, tilt, track, ball_at=None):
    """lay one line out letter by letter; returns fill/ink/key masks, the
    pasted ball art layer, and the line's letter boxes"""
    layers = [Image.new("L", (LW, LH), 0) for _ in range(3)]
    art_layer = Image.new("RGBA", (LW, LH))
    f = ImageFont.truetype(str(FONT), size)
    cap = f.getbbox("H")[3] - f.getbbox("H")[1]
    items = []
    for i, ch in enumerate(text):
        if i == ball_at:
            d = round(cap * 1.04)
            art, masks = ball_masks(d, tilt[i])
            items.append((masks, d, art))
        else:
            masks, w, _ = glyph_masks(ch, size, tilt[i])
            items.append((masks, w, None))
    total = sum(w for _, w, _ in items) + track * (len(items) - 1)
    x = (LW - total) / 2
    for i, (masks, w, art) in enumerate(items):
        mx = round(x + w / 2 - masks[0].width / 2)
        my = round(cy + bounce[i] - masks[0].height / 2)
        for layer, m in zip(layers, masks):
            layer.paste(Image.fromarray(np.maximum(np.asarray(layer.crop((mx, my, mx + m.width, my + m.height))), np.asarray(m))), (mx, my))
        if art is not None:
            art_layer.alpha_composite(art, (mx, my))
        x += w + track
    return [np.asarray(m, float) / 255 for m in layers], art_layer


def shifted(m, dx, dy):
    out = np.zeros_like(m)
    h, w = m.shape
    out[max(0, dy):h + min(0, dy), max(0, dx):w + min(0, dx)] = m[max(0, -dy):h - max(0, dy), max(0, -dx):w - max(0, dx)]
    return out


def eroded(m, px):
    im = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(2 * px + 1))
    return np.asarray(im, float) / 255


def gradient(ys, rows, stops):
    k = np.clip((ys - rows.min()) / max(1, rows.max() - rows.min()), 0, 1)
    rgb = np.zeros(ys.shape + (3,))
    for (k0, c0), (k1, c1) in zip(stops, stops[1:]):
        t = np.clip((k - k0) / (k1 - k0), 0, 1)[..., None]
        seg = (k >= k0) & (k <= k1)
        rgb[seg] = (np.asarray(c0) * (1 - t) + np.asarray(c1) * t)[seg]
    return rgb


def wordmark():
    (pf, pi, pk), _ = line("PUTT", 250, 178,
                           bounce=[-14, 10, -6, 12], tilt=[5, -4, 3, -6], track=18)
    (mf, mi, mk), ball = line("MONKEY", 150, 418,
                              bounce=[6, -6, -10, -6, 4, 10], tilt=[-3, 2, 0, -2, 3, -4],
                              track=10, ball_at=1)
    ball_a = np.asarray(ball.getchannel("A"), float) / 255
    mf_letters = np.clip(mf - ball_a, 0, 1)  # the ball is its own face
    fill = np.maximum(pf, mf)
    ink = np.maximum(pi, mi)
    key = np.maximum(pk, mk)

    DEPTH = 16
    ext = np.zeros_like(ink)
    for i in range(1, DEPTH + 1):
        ext = np.maximum(ext, shifted(ink, round(i * 0.5), i))
    keyline = np.maximum(key, shifted(key, round(DEPTH * 0.5), DEPTH))

    h, w = fill.shape
    ys = np.mgrid[0:h, 0:w][0].astype(float)
    out = np.zeros((h, w, 4))

    def over(rgb, a):
        a = np.clip(a, 0, 1)[..., None]
        rgb = np.asarray(rgb, float)
        out[..., :3] = out[..., :3] * (1 - a) + rgb * a
        out[..., 3:] = out[..., 3:] + (1 - out[..., 3:]) * a

    # soft shadow on the backdrop, then the cream keyline, extrusion, ink
    shadow = np.asarray(Image.fromarray((shifted(keyline, 10, 14) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14)), float) / 255
    over((10, 30, 20), shadow * 0.35)
    over(CREAM, keyline)
    over(EXT, ext)
    # extrusion stripes: a lighter band every few px reads as stacked card
    stripe = ((ys % 7) < 2).astype(float)
    over((52, 104, 64), ext * stripe * 0.45)
    over(INK, ink)

    # PUTT: postcard red, light at the top
    rows_p = np.nonzero(pf.max(1) > 0.5)[0]
    face_p = gradient(ys, rows_p, [(0, (255, 120, 84)), (0.45, (234, 70, 46)), (1, (190, 40, 28))])
    a = pf[..., None]
    out[..., :3] = out[..., :3] * (1 - a) + face_p * a
    # sign-painter inline: a cream line set inside every letter
    inline = np.clip(eroded(pf, 17) - eroded(pf, 20), 0, 1)
    over(CREAM, inline * 0.9)

    # MONKEY: sunny yellow to marigold
    rows_m = np.nonzero(mf_letters.max(1) > 0.5)[0]
    face_m = gradient(ys, rows_m, [(0, (255, 236, 120)), (0.55, (255, 200, 52)), (1, (236, 146, 22))])
    a = mf_letters[..., None]
    out[..., :3] = out[..., :3] * (1 - a) + face_m * a
    # a cream glint along each letter's top edge
    glint = np.clip(mf_letters - shifted(mf_letters, 0, 6), 0, 1) * shifted(mf_letters, 0, -3)
    over((255, 252, 230), glint * 0.8)
    glint_p = np.clip(pf - shifted(pf, 0, 7), 0, 1) * shifted(pf, 0, -3)
    over((255, 214, 190), glint_p * 0.7)

    img = Image.fromarray(out[..., :3].round().clip(0, 255).astype(np.uint8))
    img.putalpha(Image.fromarray((out[..., 3] * 255).round().clip(0, 255).astype(np.uint8)))
    img.alpha_composite(ball)
    return img


if __name__ == "__main__":
    im = wordmark()
    box = im.getchannel("A").getbbox()
    print("letters span", box)
    assert box[1] >= 20 and box[3] <= LH - 20 and box[0] >= 10 and box[2] <= LW - 10, box
    for name in ("logo_board.png", "logo_board_titled.png"):
        im.save(V8 / name, optimize=True)
        print("wrote", (V8 / name).relative_to(APP))
