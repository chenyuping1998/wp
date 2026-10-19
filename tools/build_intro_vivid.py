"""The three intro-card pictures (FeatureIntro.svelte), redone 2026-10-16 for
Pocha / Swing / Strike / Mardi (user: 三張說明卡的圖都必須鮮明有趣).

Each card is a little scene with the redrawn cast ACTING it, posed from the
game's own Spine rig (pose_cast.py) with its laughing face:

  intro_collect   the W character laughing as the P symbols come flying at
                  him, smeared like a cartoon throw; the last one bounces off
                  his hand with a pop
  intro_slice     the free-spin helper doing a card trick: 10 and J flip in
                  the air and come down as a P
  intro_receipt   both of them cheering in front of the game's own poster,
                  10,000x printed on it, confetti in the game's inks

One bold backdrop shape per card in the game's accent, one ink outline: no
trim, no borders (user, 2026-10-16). 1024 x 640, transparent.

    python build_intro_vivid.py <Pocha|Swing|Strike|Mardi>
"""
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, str(Path(__file__).parent))
import pose_cast  # noqa: E402

APPS = Path(__file__).resolve().parents[1] / 'apps'
W, H = 1024, 640
K = 2  # supersampling for everything drawn here

THEMES = {
    'Pocha': dict(ink=(32, 38, 56), paper=(255, 244, 232), a1=(220, 73, 61), a2=(40, 141, 145), a3=(244, 196, 48),
                  font='BlackHanSans-Regular.ttf', title="TONIGHT'S TAB"),
    'Swing': dict(ink=(22, 20, 18), paper=(243, 233, 210), a1=(217, 52, 43), a2=(214, 170, 90), a3=(246, 222, 160),
                  font='Shrikhand-Regular.ttf', title='HEADLINER', a3x=(236, 178, 52)),
    'Strike': dict(ink=(20, 38, 46), paper=(255, 244, 222), a1=(232, 80, 46), a2=(63, 196, 168), a3=(240, 190, 40),
                   font='BowlbyOne-Regular.ttf', title='SCORE CARD'),
    'Mardi': dict(ink=(59, 31, 92), paper=(255, 243, 224), a1=(168, 63, 214), a2=(47, 175, 90), a3=(240, 190, 40),
                  font='Fascinate-Regular.ttf', title='PARADE PASS'),
}

GAME = sys.argv[1]
APP = next(APPS.glob(f'{GAME}Monkey*'))
SPR = APP / 'static/assets/sprites'
T = THEMES[GAME]
INK, PAPER, A1, A2, A3 = T['ink'], T['paper'], T['a1'], T['a2'], T['a3']
FONT = str(APP / 'static/fonts/sushi' / T['font'])
GAME_ID = f'{GAME}Monkey'


def rgba(c, a=255):
    return (c[0], c[1], c[2], a)


def shade(c, k):
    return tuple(max(0, min(255, round(v * k))) for v in c)


def load(rel):
    return Image.open(SPR / rel).convert('RGBA')


def fit_h(im, h):
    return im.resize((max(1, round(im.width * h / im.height)), round(h)), Image.LANCZOS)


def trim(im):
    return im.crop(im.getchannel('A').getbbox())


def canvas():
    return Image.new('RGBA', (W * K, H * K), (0, 0, 0, 0))


def finish(c):
    return c.resize((W, H), Image.LANCZOS)


def paste(c, im, cx, cy, scale=1.0, rot=0.0, alpha=1.0):
    """centre `im` at (cx, cy) in card px, scaled by K"""
    im = im.resize((max(1, round(im.width * scale * K)), max(1, round(im.height * scale * K))), Image.LANCZOS)
    if rot:
        im = im.rotate(rot, resample=Image.BICUBIC, expand=True)
    if alpha < 1:
        im.putalpha(im.getchannel('A').point(lambda v: round(v * alpha)))
    c.alpha_composite(im, (round(cx * K - im.width / 2), round(cy * K - im.height / 2)))


def shadow(c, cx, cy, rx, ry, a=80):
    sh = Image.new('RGBA', c.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([(cx - rx) * K, (cy - ry) * K, (cx + rx) * K, (cy + ry) * K], fill=rgba(INK, a))
    c.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6 * K)))


def burst(c, cx, cy, r, base, rays=18, spin=0.0):
    """the backdrop: a disc of the accent with darker rays, one ink line"""
    d = ImageDraw.Draw(c)
    box = [(cx - r) * K, (cy - r) * K, (cx + r) * K, (cy + r) * K]
    layer = Image.new('RGBA', c.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.ellipse(box, fill=rgba(base))
    dark = shade(base, 0.86)
    for i in range(rays):
        a0 = spin + 2 * math.pi * i / rays
        a1 = a0 + math.pi / rays
        ld.polygon([(cx * K, cy * K), ((cx + 2 * r * math.cos(a0)) * K, (cy + 2 * r * math.sin(a0)) * K),
                    ((cx + 2 * r * math.cos(a1)) * K, (cy + 2 * r * math.sin(a1)) * K)], fill=rgba(dark))
    mask = Image.new('L', c.size, 0)
    ImageDraw.Draw(mask).ellipse(box, fill=255)
    clip = Image.new('RGBA', c.size, (0, 0, 0, 0))
    clip.paste(layer, (0, 0), mask)
    c.alpha_composite(clip)
    d.ellipse(box, outline=rgba(INK), width=7 * K)


def speed(d, pts, width, col=None):
    col = col or INK
    n = len(pts) - 1
    for i in range(n):
        w = max(1, round(width * K * (0.25 + 0.75 * (i + 1) / n)))
        d.line([(pts[i][0] * K, pts[i][1] * K), (pts[i + 1][0] * K, pts[i + 1][1] * K)], fill=rgba(col), width=w)


def star(d, cx, cy, r, fill, n=8, inner=0.42, rot=0.0, line=4):
    pts = []
    for i in range(n * 2):
        rr = r if i % 2 == 0 else r * inner
        a = rot + math.pi / n * i - math.pi / 2
        pts.append(((cx + rr * math.cos(a)) * K, (cy + rr * math.sin(a)) * K))
    d.polygon(pts, fill=rgba(fill), outline=rgba(INK), width=line * K)


def cast(who, anim, t, face, h, mirror=False):
    im, _ = pose_cast.pose(GAME_ID, who, anim, t, 1.0, face)
    im = trim(im)
    if mirror:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    return fit_h(im, h)


def place_cast(c, im, cx, feet):
    """by its feet, card px (im is already at card scale)"""
    big = im.resize((im.width * K, im.height * K), Image.LANCZOS)
    c.alpha_composite(big, (round(cx * K - big.width / 2), round(feet * K - big.height)))


def sym(name):
    return trim(load(f'sushiSymbols/{name}.png'))


def low_card(n):
    """10 (l5), J (l4), Q (l3): the label with its glyph"""
    card = load(f'sushiSymbols/l{n}.png')
    card.alpha_composite(load(f'jadeMesh/l{n}_subject.png').resize(card.size, Image.LANCZOS))
    return trim(card)


# ── 1. the W collects every P ────────────────────────────────────────────────
def collect():
    c = canvas()
    burst(c, 640, 330, 300, A1, spin=0.2)
    who = cast('mg', 'throwit', 0.6, 'laugh_4', 590)
    shadow(c, 660, 618, 170, 16)
    place_cast(c, who, 660, 624)
    d = ImageDraw.Draw(c)
    p = sym('p')
    # three Ps on one arc from the left toward his hands, each smeared behind
    arc = [(110, 470), (190, 340), (310, 255), (430, 262), (520, 330)]
    for i, (t, size, rot) in enumerate(((0.10, 150, -18), (0.42, 175, -8), (0.80, 200, 6))):
        k = t * (len(arc) - 1)
        j = min(int(k), len(arc) - 2)
        f = k - j
        x = arc[j][0] + (arc[j + 1][0] - arc[j][0]) * f
        y = arc[j][1] + (arc[j + 1][1] - arc[j][1]) * f
        # the smear: three fading copies back along the arc
        for g in (3, 2, 1):
            kk = max(0, k - g * 0.16)
            jj = min(int(kk), len(arc) - 2)
            ff = kk - jj
            gx = arc[jj][0] + (arc[jj + 1][0] - arc[jj][0]) * ff
            gy = arc[jj][1] + (arc[jj + 1][1] - arc[jj][1]) * ff
            paste(c, p, gx, gy, size / max(p.size) * (1 - 0.06 * g), rot - 6 * g, alpha=0.12 * (4 - g) / 3)
        for dy, ln, w in ((-size * 0.32, 90, 7), (0, 120, 9), (size * 0.32, 70, 6)):
            speed(d, [(x - size * 0.55 - ln, y + dy + 14), (x - size * 0.55 - ln * 0.4, y + dy + 6), (x - size * 0.55, y + dy)], w)
        paste(c, p, x, y, size / max(p.size), rot)
    # the pop where the last one lands
    star(d, 548, 300, 52, A3, n=9, rot=0.3)
    star(d, 548, 300, 22, PAPER, n=9, rot=0.3, line=3)
    for a in (-0.9, -0.3, 0.3):
        d.line([((548 + 70 * math.cos(a)) * K, (300 + 70 * math.sin(a)) * K), ((548 + 104 * math.cos(a)) * K, (300 + 104 * math.sin(a)) * K)], fill=rgba(INK), width=6 * K)
    return finish(c)


# ── 2. the helper turns 10 / J / Q into P ────────────────────────────────────
def slice_card():
    c = canvas()
    burst(c, 330, 330, 290, A2, spin=0.5)
    who = cast('fg', 'throwit', 0.55, 'laugh_2', 600, mirror=True)
    shadow(c, 300, 620, 150, 15)
    place_cast(c, who, 300, 626)
    d = ImageDraw.Draw(c)
    ten, jack, queen, p = low_card(5), low_card(4), low_card(3), sym('p')
    # the trick's path: off the hand, up and over, down to the right
    path = [(470, 300), (560, 170), (690, 140), (820, 210), (880, 360)]
    for i in range(len(path) - 1):
        a, b = path[i], path[i + 1]
        for s in range(0, 10, 2):
            u0, u1 = s / 10, (s + 1) / 10
            d.line([((a[0] + (b[0] - a[0]) * u0) * K, (a[1] + (b[1] - a[1]) * u0) * K),
                    ((a[0] + (b[0] - a[0]) * u1) * K, (a[1] + (b[1] - a[1]) * u1) * K)], fill=rgba(INK), width=5 * K)
    # 10 just thrown, J spinning edge-on, Q caught mid-change, P landed
    paste(c, ten, 540, 210, 128 / ten.height, 16)
    j = jack.resize((max(1, round(jack.width * 0.28)), jack.height), Image.LANCZOS)
    paste(c, j, 690, 150, 132 / jack.height, -8)
    for dx in (-34, 34):
        d.arc([(690 + dx - 40) * K, (150 - 70) * K, (690 + dx + 40) * K, (150 + 70) * K],
              start=200 if dx < 0 else -20, end=340 if dx < 0 else 120, fill=rgba(INK), width=5 * K)
    half = queen.crop((0, 0, queen.width // 2, queen.height))
    paste(c, half, 800, 238, 132 / queen.height, -14)
    shadow(c, 870, 590, 100, 12)
    paste(c, p, 870, 450, 250 / max(p.size), 4)
    star(d, 812, 258, 40, A3, n=8, rot=0.2)
    for sx, sy, r in ((950, 330, 20), (800, 420, 14), (960, 560, 16)):
        star(d, sx, sy, r, PAPER, n=4, inner=0.3, line=3)
    return finish(c)


# ── 3. 10,000x on the game's poster ──────────────────────────────────────────
def poster():
    w, h = 500, 340
    im = Image.new('RGBA', ((w + 40) * K, (h + 40) * K), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    o = 20 * K
    d.rounded_rectangle([o + 12 * K, o + 14 * K, o + w * K + 12 * K, o + h * K + 14 * K], 18 * K, fill=rgba(INK))
    d.rounded_rectangle([o, o, o + w * K, o + h * K], 18 * K, fill=rgba(PAPER), outline=rgba(INK), width=7 * K)
    d.rectangle([o + 26 * K, o + 28 * K, o + (w - 26) * K, o + 104 * K], fill=rgba(A1), outline=rgba(INK), width=5 * K)
    size = 54
    while True:
        f = ImageFont.truetype(FONT, size * K)
        if d.textlength(T['title'], font=f) <= (w - 90) * K:
            break
        size -= 2
    d.text((o + w * K / 2, o + 66 * K), T['title'], font=f, anchor='mm', fill=rgba(PAPER), stroke_width=3 * K, stroke_fill=rgba(INK))
    size = 112
    while True:
        f = ImageFont.truetype(FONT, size * K)
        if d.textlength('10,000×', font=f) <= (w - 70) * K:
            break
        size -= 2
    d.text((o + w * K / 2 + 6 * K, o + 222 * K + 6 * K), '10,000×', font=f, anchor='mm', fill=rgba(A2))
    d.text((o + w * K / 2, o + 222 * K), '10,000×', font=f, anchor='mm', fill=rgba(INK))
    return im


def receipt():
    c = canvas()
    burst(c, 512, 300, 330, T.get('a3x', A3), rays=22, spin=0.1)
    rnd = random.Random(7)
    d = ImageDraw.Draw(c)
    pst = poster()
    pst = pst.rotate(-4, resample=Image.BICUBIC, expand=True)
    c.alpha_composite(pst, (512 * K - pst.width // 2, 252 * K - pst.height // 2))
    fg = cast('fg', 'idle', 0.0, 'laugh_4', 420, mirror=True)
    mg = cast('mg', 'chestbeat', 2.48, 'laugh_4', 450)
    shadow(c, 40 + fg.width / 2, 622, fg.width * 0.4, 12)
    shadow(c, 984 - mg.width / 2, 622, mg.width * 0.4, 12)
    place_cast(c, fg, 40 + fg.width / 2, 628)
    place_cast(c, mg, 984 - mg.width / 2, 628)
    d = ImageDraw.Draw(c)
    for _ in range(46):
        x, y = rnd.uniform(40, 990), rnd.uniform(20, 470)
        if 250 < x < 780 and 90 < y < 420:
            continue
        a = rnd.uniform(0, math.pi)
        s = rnd.uniform(8, 15)
        col = rnd.choice((A1, A2, PAPER))
        pts = [(x + s * math.cos(a + k * math.pi / 2) * (1.6 if k % 2 == 0 else 0.6), y + s * math.sin(a + k * math.pi / 2) * (1.6 if k % 2 == 0 else 0.6)) for k in range(4)]
        d.polygon([(px * K, py * K) for px, py in pts], fill=rgba(col), outline=rgba(INK), width=2 * K)
    return finish(c)


def main():
    out = SPR / 'sushiV8'
    keep = APP / 'design/source/intro_pre_vivid'
    keep.mkdir(parents=True, exist_ok=True)
    for name, build in (('intro_collect', collect), ('intro_slice', slice_card), ('intro_receipt', receipt)):
        for ext in ('png', 'svg'):
            f = out / f'{name}.{ext}'
            if f.exists() and not (keep / f.name).exists():
                (keep / f.name).write_bytes(f.read_bytes())
        build().save(out / f'{name}.png', optimize=True)
        print(GAME, 'wrote', name)


if __name__ == '__main__':
    main()
