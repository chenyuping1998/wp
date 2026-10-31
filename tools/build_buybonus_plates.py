"""Buy Bonus plates for Purrfia and Parrot Radio, rebuilt the Medusa way (user 2026-10-31).

Medusa's plate is one object that fills its square, with its own blank panel carrying the caption, and a lit copy
of the same outline that the shared ButtonBuyBonus swaps in on hover. The two cat-family plates were a small object
in the middle of a 640 square (44% of it) with the caption in a separate HTML box underneath, although both objects
already have a blank cream label painted on them.

  - the object is scaled to fill the square, the caption goes on its painted label;
  - plate and lit copy are placed so their labels coincide (the caption does not jump on hover);
  - Purrfia's painted lit box opens its lid and so has a different outline: drawn over the closed box it leaves the
    closed lid showing. Its lit copy is the closed box itself, lit: eyes bloom, light leaks round the box, sparkles.
  - Parrot's painted lit radio has the same outline and is used as painted.

Writes static/assets/sprites/<ui>/buybonus_plate(_lit).png and prints the uiTheme numbers (label offset, hit area).
The painted sources stay in design/source/<game>/ui/.
  python tools/build_buybonus_plates.py
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

APPS = Path(__file__).resolve().parents[1] / 'apps'
OUT = 640
GAMES = {
    'purrfia': dict(app='Purrfia喵菲亞家族', src='design/source/purrfia/ui', ui='static/assets/sprites/purrfiaUi',
                    # painted label centres, in the 640 sources
                    label=(285, 389), label_lit=None, label_size=(170, 64), glow=(255, 196, 92), slit=(200, 290, 380, 350)),
    'parrot': dict(app='ParrotRadio鸚鵡電台', src='design/source/parrot/ui', ui='static/assets/sprites/parrotUi',
                   label=(323, 425), label_lit=(319, 433), label_size=(168, 34), glow=None),
}
PLATE_SCALE = 1.08  # uiTheme.buyBonusPlateScale


def rgba(path):
    return Image.open(path).convert('RGBA')


def star(size, color):
    """four-point sparkle, soft core"""
    s = size * 4
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = s / 2
    d.ellipse((c - s * 0.16, c - s * 0.16, c + s * 0.16, c + s * 0.16), fill=color + (110,))
    for w, a in ((s * 0.11, 120), (s * 0.05, 255)):
        d.polygon([(c, 0), (c + w, c - w), (s, c), (c + w, c + w), (c, s), (c - w, c + w), (0, c), (c - w, c - w)],
                  fill=color + (a,))
    im = im.filter(ImageFilter.GaussianBlur(s * 0.012))
    return im.resize((size, size), Image.LANCZOS)


def light_up(plate, glow, slit):
    """the same object, lit: warm halo outside its outline, eyes blooming, a touch brighter overall"""
    a = np.asarray(plate).astype(np.float32)
    alpha = plate.getchannel('A')
    halo_mask = alpha.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(16))
    halo = Image.new('RGBA', plate.size, glow + (0,))
    halo.putalpha(halo_mask.point(lambda v: int(v * 0.9)))
    body = a.copy()
    body[..., :3] = np.clip(body[..., :3] * 1.07 + np.array([10, 6, -2]), 0, 255)
    # the yellow eyes in the slit (saturated yellow inside the slit's box: the cardboard is tan, not yellow)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    ys, xs = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    x0, y0, x1, y1 = slit
    eyes = ((r > 215) & (g > 175) & (b < 70) & (r - b > 170) & (a[..., 3] > 200)
            & (xs >= x0) & (xs <= x1) & (ys >= y0) & (ys <= y1)).astype(np.uint8) * 255
    eyes_img = Image.fromarray(eyes, 'L')
    body = Image.fromarray(body.astype(np.uint8), 'RGBA')
    # additive bloom, premultiplied: colour × its own strength
    strength = np.asarray(eyes_img.filter(ImageFilter.GaussianBlur(5))).astype(np.float32)[..., None] / 255 * 0.8
    out = np.asarray(Image.alpha_composite(halo, body)).astype(np.float32)
    out[..., :3] = np.clip(out[..., :3] + strength * np.array([255, 226, 110]), 0, 255)
    out = Image.fromarray(out.astype(np.uint8), 'RGBA')
    out.putalpha(ImageChops.lighter(halo.getchannel('A'), alpha))
    bb = alpha.getbbox()
    for (u, v, size) in ((0.04, 0.12, 46), (0.95, 0.30, 34), (0.86, 0.95, 40)):
        st = star(size, (255, 246, 210))
        out.alpha_composite(st, (int(bb[0] + u * (bb[2] - bb[0]) - size / 2), int(bb[1] + v * (bb[3] - bb[1]) - size / 2)))
    return out


def place(im, scale, anchor_src, anchor_out):
    """scale `im` about the origin, then translate so anchor_src lands on anchor_out, on a 640 canvas"""
    big = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    canvas = Image.new('RGBA', (OUT, OUT), (0, 0, 0, 0))
    canvas.alpha_composite(big, (round(anchor_out[0] - anchor_src[0] * scale), round(anchor_out[1] - anchor_src[1] * scale)))
    return canvas


report = {}
for name, g in GAMES.items():
    app = APPS / g['app']
    plate, lit = rgba(app / g['src'] / 'buybonus_plate.png'), rgba(app / g['src'] / 'buybonus_plate_lit.png')
    bb = plate.getchannel('A').getbbox()
    # fill 600 of the 640 square by the larger side, centred
    scale = 600 / max(bb[2] - bb[0], bb[3] - bb[1])
    centre = ((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2)
    label_out = (OUT / 2 + (g['label'][0] - centre[0]) * scale, OUT / 2 + (g['label'][1] - centre[1]) * scale)
    out_plate = place(plate, scale, g['label'], label_out)
    lit_src = light_up(plate, g['glow'], g['slit']) if g['label_lit'] is None else lit
    out_lit = place(lit_src, scale, g['label'] if g['label_lit'] is None else g['label_lit'], label_out)
    ui = app / g['ui']
    out_plate.save(ui / 'buybonus_plate.png', optimize=True)
    out_lit.save(ui / 'buybonus_plate_lit.png', optimize=True)
    obb = out_plate.getchannel('A').getbbox()
    lw, lh = g['label_size'][0] * scale / OUT, g['label_size'][1] * scale / OUT
    report[name] = {
        'labelOffsetX': round((label_out[0] / OUT - 0.5) * PLATE_SCALE, 3),
        'labelOffsetY': round((label_out[1] / OUT - 0.5) * PLATE_SCALE, 3),
        'labelBox(plate fractions)': [round(lw, 3), round(lh, 3)],
        'hitArea': {'x': round(obb[0] / OUT, 3), 'y': round(obb[1] / OUT, 3), 'width': round((obb[2] - obb[0]) / OUT, 3),
                    'height': round((obb[3] - obb[1]) / OUT, 3)},
    }
print(json.dumps(report, indent=1))
