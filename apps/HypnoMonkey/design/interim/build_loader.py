"""Interim loader art from Hypno Monkey's own finished assets (house rule:
until the requested art lands, ship a transitional version, never Medusa).
Replaced by ART_REQUEST_DEMEDUSA.md section A when the real art arrives.

  python3 design/interim/build_loader.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math

A = Path(__file__).resolve().parents[2]
S = A / 'static/assets/sprites'
O = S / 'hypnoInterim'
O.mkdir(exist_ok=True)
FONT = str(A / 'static/fonts/TitanOne.ttf')
INK = (38, 24, 30, 255)


def rgba(path):
    im = Image.open(path).convert('RGBA')
    return im.crop(im.getchannel('A').point(lambda a: 255 if a > 10 else 0).getbbox())


def fit(im, h):
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def stripes(w, h, a=(196, 52, 52), b=(246, 231, 199)):
    """Circus tent stripes fanning from a point above the frame."""
    im = Image.new('RGBA', (w, h), b + (255,))
    d = ImageDraw.Draw(im)
    cx, cy, n = w / 2, -h * 0.9, 18
    for i in range(n):
        if i % 2:
            continue
        a0, a1 = math.pi * (0.18 + 0.64 * i / n), math.pi * (0.18 + 0.64 * (i + 1) / n)
        r = h * 3
        d.polygon([(cx, cy), (cx + r * math.cos(a0), cy + r * math.sin(a0)), (cx + r * math.cos(a1), cy + r * math.sin(a1))], fill=a + (255,))
    soft = Image.new('RGBA', (w, h), (255, 248, 230, 120))
    im.alpha_composite(soft)
    return im


def spiral_disc(size, color=(155, 61, 245)):
    im = Image.new('RGBA', (size, size))
    d = ImageDraw.Draw(im)
    d.ellipse((0, 0, size - 1, size - 1), fill=(246, 231, 199, 255), outline=INK, width=max(3, size // 40))
    pts = []
    for i in range(400):
        t = i / 400
        ang = t * 3.2 * 2 * math.pi
        r = t * size * 0.44
        pts.append((size / 2 + r * math.cos(ang), size / 2 + r * math.sin(ang)))
    d.line(pts, fill=color + (255,), width=max(4, size // 18), joint='curve')
    return im


def shadow(im, off=10):
    a = im.getchannel('A').filter(ImageFilter.GaussianBlur(8))
    sh = Image.new('RGBA', im.size, (40, 20, 30, 0))
    sh.putalpha(a.point(lambda v: v * 0.45))
    out = Image.new('RGBA', (im.width + off, im.height + off))
    out.alpha_composite(sh, (off, off))
    out.alpha_composite(im)
    return out


def card(fill):
    im = stripes(960, 720)
    fill(im)
    return im


# --- wordmark: HYPNO / MONKEY, carved-ticket letters, spiral emblem -------
logo = Image.new('RGBA', (1600, 600))
d = ImageDraw.Draw(logo)
for text, y, size in (('HYPNO', 40, 250), ('MONKEY', 300, 230)):
    f = ImageFont.truetype(FONT, size)
    w = d.textlength(text, font=f)
    x = 900 - w / 2
    d.text((x + 12, y + 14), text, font=f, fill=(120, 24, 36, 255), stroke_width=22, stroke_fill=(120, 24, 36, 255))
    d.text((x, y), text, font=f, fill=(255, 214, 102, 255), stroke_width=22, stroke_fill=INK)
emblem = shadow(spiral_disc(300))
logo.alpha_composite(emblem, (40, 150))
logo.save(O / 'logo.png')

# --- card 1: hypnotised tumble ---------------------------------------------
def c1(im):
    names = ['h1', 'h2', 'l2']
    for i, n in enumerate(names):
        s = fit(rgba(S / f'hypnoSymbols/{n}.png'), 230)
        x = 70 + i * 290
        disc = spiral_disc(250)
        disc.putalpha(disc.getchannel('A').point(lambda v: v * 0.55))
        im.alpha_composite(disc, (x - 10, 330))
        if i == 1:  # the hypnotised one, washed toward lavender and tearing
            wash = Image.new('RGBA', s.size, (217, 201, 255, 0))
            wash.putalpha(s.getchannel('A').point(lambda v: v * 0.55))
            s.alpha_composite(wash)
            left = s.crop((0, 0, s.width // 2, s.height)).rotate(9, expand=True)
            right = s.crop((s.width // 2, 0, s.width, s.height)).rotate(-11, expand=True)
            im.alpha_composite(shadow(left), (x - 20, 340))
            im.alpha_composite(shadow(right), (x + s.width // 2 + 20, 330))
        else:
            im.alpha_composite(shadow(s), (x, 350))
    drop = fit(rgba(S / 'hypnoSymbols/h4.png'), 190)
    im.alpha_composite(shadow(drop), (385, 60))
    d = ImageDraw.Draw(im)
    for k in range(3):
        d.line([(420 + k * 50, 20), (420 + k * 50, 50)], fill=INK, width=6)
card(c1).save(O / 'intro_1.png')

# --- card 2: the hypnotist and his watch ------------------------------------
def c2(im):
    cast = rgba(A / 'design/cast_mg/master.png')
    cast = cast.crop((0, 0, cast.width, int(cast.height * 0.62)))
    cast = fit(cast, 700)
    im.alpha_composite(shadow(cast), (960 - cast.width - 10, 30))
    watch = fit(rgba(S / 'hypnoWatches/watch-t4.png'), 300)
    d = ImageDraw.Draw(im)
    bolt = [(260, 0), (220, 150), (290, 170), (230, 330), (300, 350), (250, 470)]
    d.line(bolt, fill=(255, 196, 194, 255), width=34, joint='curve')
    d.line(bolt, fill=(255, 255, 255, 255), width=12, joint='curve')
    im.alpha_composite(shadow(watch), (110, 380))
card(c2).save(O / 'intro_2.png')

# --- card 3: free spins, watches stack on a running total -------------------
def c3(im):
    for i, t in enumerate([1, 2, 3, 4, 5]):
        w = fit(rgba(S / f'hypnoWatches/watch-t{t}.png'), 220 + i * 22)
        x = 20 + i * 160
        y = 430 - i * 68
        im.alpha_composite(shadow(w.rotate((i - 2) * -8, expand=True, resample=Image.BICUBIC)), (x, y))
    spot = Image.new('RGBA', im.size)
    ImageDraw.Draw(spot).polygon([(600, 0), (760, 0), (960, 720), (420, 720)], fill=(255, 250, 220, 70))
    im.alpha_composite(spot)
card(c3).save(O / 'intro_3.png')
print('interim loader art ->', O)
