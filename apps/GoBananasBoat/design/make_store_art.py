"""Store art for Go Bananas Boat: the game tile (background + foreground, which
Stake composites with the provider logo) and the 16:9 thumbnail.

Stake review 2026-10-04:
  1. "Please make sure that the game tile is generally bright and does not
     clash with the Stake background."  The submitted tile was a dark harbour
     at night under a navy-uniformed captain — the lobby's own dark blue-grey,
     so the tile sank into it.
  2. "Please make sure to add a 16:9 thumbnail, as it is mandatory."

So both are lifted and pushed WARM: exposure up, the shadows opened, a golden
dusk glow behind the character, and a warm rim light round him so the navy
coat separates from anything behind it. No lettering on any layer (the tile
guideline; the 16:9 follows it too). The captain stays inside a safe margin on
every side — the first Go Bananas was sent back for a character running edge
to edge.

Sources (the user's generated art, kept outside the repo):
  C:/Users/cheny/Downloads/BOAT/Gemini_..._r2kd....jpg   the tile background
  C:/Users/cheny/Downloads/BOAT/船長.png                  the captain cut out
  C:/Users/cheny/Downloads/BOAT/Gemini_..._c6v7....jpg   the dusk dock (16:9)

Writes thumbnail/GoBananasBoat-BG.png, GoBananasBoat-FG.png,
GoBananasBoat-16x9.png (1920x1080) and a preview of the tile composite.
Usage: python design/make_store_art.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SRC = Path('C:/Users/cheny/Downloads/BOAT')
OUT = Path(__file__).resolve().parents[1] / 'thumbnail'
OUT.mkdir(exist_ok=True)


def lift(im: Image.Image, gamma=0.72, gain=1.12, warm=(1.06, 1.0, 0.9), sat=1.12):
    """exposure up (gamma opens the shadows), a warm shift, a touch more colour"""
    a = np.asarray(im.convert('RGB'), float) / 255
    a = np.clip(a ** gamma * gain, 0, 1)
    a *= np.array(warm)[None, None, :]
    grey = a.mean(axis=2, keepdims=True)
    a = grey + (a - grey) * sat
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def glow(size, centre, radius, colour, strength):
    """a soft additive pool of light"""
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.hypot(xx - centre[0], yy - centre[1]) / radius
    k = np.clip(1 - d, 0, 1) ** 2 * strength
    return k[..., None] * np.array(colour)[None, None, :] / 255


def add_light(im, light):
    a = np.asarray(im, float) / 255
    a = 1 - (1 - a) * (1 - light)  # screen
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def rim(fg: Image.Image, colour=(255, 196, 110), px=10, strength=0.85):
    """a warm outline of light round a cut-out: its alpha, dilated and blurred,
    minus itself, laid under it"""
    a = fg.split()[3]
    halo = a.filter(ImageFilter.MaxFilter(px * 2 + 1)).filter(ImageFilter.GaussianBlur(px))
    halo = Image.fromarray((np.asarray(halo, float) * strength).astype(np.uint8))
    layer = Image.new('RGBA', fg.size, colour + (0,))
    layer.putalpha(halo)
    layer.alpha_composite(fg)
    return layer


# ---- the captain (foreground) ---------------------------------------------------
cap = Image.open(SRC / '船長.png').convert('RGBA')
rgb = lift(cap, gamma=0.8, gain=1.1, warm=(1.04, 1.0, 0.94), sat=1.08)
cap_lit = rgb.convert('RGBA')
cap_lit.putalpha(cap.split()[3])
# a margin round him so the rim light is not cut at the canvas edge
pad = 40
canvas = Image.new('RGBA', (cap.width + pad * 2, cap.height + pad * 2), (0, 0, 0, 0))
canvas.alpha_composite(cap_lit, (pad, pad))
fg = rim(canvas)
fg.save(OUT / 'GoBananasBoat-FG.png', optimize=True)

# ---- the tile background ----------------------------------------------------------
bg = lift(Image.open(SRC / 'Gemini_Generated_Image_r2kdmkr2kdmkr2kd.jpg'))
bg = add_light(bg, glow(bg.size, (bg.width * 0.5, bg.height * 0.42), bg.height * 0.62, (255, 190, 110), 0.55))
bg.save(OUT / 'GoBananasBoat-BG.png', optimize=True)

# preview of how the tile composites (not a deliverable: Stake composites it)
prev = bg.convert('RGBA')
f = fg.copy()
f.thumbnail((int(bg.width * 0.82), int(bg.height * 0.86)))
prev.alpha_composite(f, ((bg.width - f.width) // 2, bg.height - f.height - int(bg.height * 0.04)))
prev.convert('RGB').save(OUT / '_preview_tile.jpg', quality=88)

# ---- the 16:9 thumbnail -------------------------------------------------------------
W, H = 1920, 1080
dock = Image.open(SRC / 'Gemini_Generated_Image_c6v72kc6v72kc6v7.jpg').convert('RGB')
# cover-fit to 16:9 (the source is 1376x768, 1.79:1)
s = max(W / dock.width, H / dock.height)
dock = dock.resize((round(dock.width * s), round(dock.height * s)), Image.LANCZOS)
dock = dock.crop(((dock.width - W) // 2, (dock.height - H) // 2, (dock.width - W) // 2 + W, (dock.height - H) // 2 + H))
dock = lift(dock, gamma=0.75, gain=1.1)
dock = add_light(dock, glow((W, H), (W * 0.5, H * 0.45), H * 0.75, (255, 186, 105), 0.6))
wide = dock.convert('RGBA')
c = fg.copy()
# inside a safe margin: 6% top, 4% bottom
c.thumbnail((W, int(H * 0.9)))
wide.alpha_composite(c, ((W - c.width) // 2, H - c.height - int(H * 0.04)))
wide.convert('RGB').save(OUT / 'GoBananasBoat-16x9.png', optimize=True)

for name in ['GoBananasBoat-BG.png', 'GoBananasBoat-16x9.png', '_preview_tile.jpg']:
    a = np.asarray(Image.open(OUT / name).convert('L'), float)
    print(f'{name}: mean luminance {a.mean():.0f}')
print('BG+FG bytes', (OUT / 'GoBananasBoat-BG.png').stat().st_size + (OUT / 'GoBananasBoat-FG.png').stat().st_size)
