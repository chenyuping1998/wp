"""Dragon Tide greyscale interim art (house rule 換畫風＝整體: until the new art lands, nothing
on screen keeps the old circus colours).

  * plain plates / frame / bar / banners / curtain: the Hypno pieces converted to greyscale by
    luminance (shapes stay so the layout can be checked; colour is gone)
  * theme-specific pieces are replaced, not greyed: logo (DRAGON TIDE type), low symbols
    L1-L5 (five plaque shapes), S (palace gate), pearl mounts, feature cards (new art + grey)
  * H1-H4 v3 and the two v2 backdrops are the approved new art, copied as they are

Writes static/assets/sprites/dragon{Interim,Symbols,Background}/. Rerun after any source change.
"""
from pathlib import Path
import math, re
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

APP = Path(__file__).resolve().parents[2]
SPRITES = APP / 'static/assets/sprites'
ART = Path('/Users/stone/stake-engine/new-games/sea-dragon/art')
INTERIM = SPRITES / 'dragonInterim'; SYMBOLS = SPRITES / 'dragonSymbols'; BACKGROUND = SPRITES / 'dragonBackground'
for folder in (INTERIM, SYMBOLS, BACKGROUND):
    folder.mkdir(parents=True, exist_ok=True)
INK, PAPER = (43, 43, 43, 255), (236, 233, 226, 255)
FONT = str(APP / 'static/fonts/TitanOne.ttf')


def grey(src: Path, dst: Path):
    image = Image.open(src).convert('RGBA')
    alpha = image.getchannel('A')
    luma = ImageOps.grayscale(image.convert('RGB'))
    out = Image.merge('RGBA', (luma, luma, luma, alpha))
    out.save(dst, optimize=True)


def grey_svg(src: Path, dst: Path):
    text = src.read_text()
    def to_grey(m):
        h = m.group(1); r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        v = round(0.299 * r + 0.587 * g + 0.114 * b)
        return f'#{v:02x}{v:02x}{v:02x}'
    dst.write_text(re.sub(r'#([0-9a-fA-F]{6})\b', to_grey, text))


def supersample(draw_fn, size, scale=3):
    big = Image.new('RGBA', (size[0] * scale, size[1] * scale), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(big), scale)
    return big.resize(size, Image.LANCZOS)


def polygon(cx, cy, r, sides, rotation=0.0):
    return [(cx + r * math.cos(rotation + 2 * math.pi * i / sides), cy + r * math.sin(rotation + 2 * math.pi * i / sides)) for i in range(sides)]


def plaque(shape: str, tone: int):
    """512x512 jade-scale plaque placeholder: distinct silhouette per low symbol, scale rows inside."""
    def draw(d, k):
        c, r = 256 * k, 190 * k
        fill = (tone, tone, tone, 255); inner = (min(255, tone + 28),) * 3 + (255,)
        if shape == 'disc':
            outline = [(c + r * math.cos(a / 90 * math.pi), c + r * 0.92 * math.sin(a / 90 * math.pi)) for a in range(180)]
        elif shape == 'hex':
            outline = polygon(c, c, r, 6, math.pi / 6)
        elif shape == 'diamond':
            outline = [(c, c - r * 1.05), (c + r * 0.86, c), (c, c + r * 1.05), (c - r * 0.86, c)]
        elif shape == 'shield':
            outline = [(c - r * 0.82, c - r * 0.8), (c + r * 0.82, c - r * 0.8), (c + r * 0.82, c + r * 0.05)] + \
                      [(c + r * 0.82 * math.cos(a / 40 * math.pi / 2), c + r * 0.05 + r * 0.95 * math.sin(a / 40 * math.pi / 2)) for a in range(1, 40)] + \
                      [(c - r * 0.82 * math.sin(a / 40 * math.pi / 2), c + r * 0.05 + r * 0.95 * math.cos(a / 40 * math.pi / 2)) for a in range(0, 40)]
        else:  # octagon
            outline = polygon(c, c, r, 8, math.pi / 8)
        d.polygon(outline, fill=INK)
        shrink = lambda pts, f: [(c + (x - c) * f, c + (y - c) * f) for x, y in pts]
        d.polygon(shrink(outline, 0.93), fill=fill)
        d.polygon(shrink(outline, 0.80), fill=inner)
        # dragon-scale rows: overlapping arcs, clipped by drawing only inside the inner shape
        mask = Image.new('L', (512 * k, 512 * k), 0); ImageDraw.Draw(mask).polygon(shrink(outline, 0.74), fill=255)
        scales = Image.new('RGBA', (512 * k, 512 * k), (0, 0, 0, 0)); sd = ImageDraw.Draw(scales)
        step = 46 * k
        for row, y in enumerate(range(int(c - r), int(c + r), int(step * 0.62))):
            off = (row % 2) * step / 2
            for x in range(int(c - r - step), int(c + r + step), int(step)):
                sd.arc([x + off - step / 2, y - step / 2, x + off + step / 2, y + step / 2], 0, 180, fill=(tone - 40,) * 3 + (255,), width=4 * k)
        d._image.paste(scales, (0, 0), Image.composite(scales, Image.new('RGBA', scales.size), mask))
    return supersample(draw, (512, 512))


def gate():
    """S: palace gate placeholder (roof, two door leaves with ring knockers, studs)."""
    def draw(d, k):
        s = lambda *v: [x * k for x in v]
        d.polygon(s(70, 150, 442, 150, 400, 96, 112, 96), fill=INK)            # roof
        d.polygon(s(84, 144, 428, 144, 392, 106, 120, 106), fill=(120, 120, 120, 255))
        d.rectangle(s(92, 150, 420, 176), fill=INK); d.rectangle(s(100, 154, 412, 170), fill=(150, 150, 150, 255))
        d.rectangle(s(110, 170, 402, 440), fill=INK)                              # door frame
        for x0 in (120, 260):
            d.rectangle(s(x0, 182, x0 + 132, 430), fill=(96, 96, 96, 255))       # leaves
            for yy in range(205, 420, 42):
                for xx in range(x0 + 22, x0 + 120, 30):
                    d.ellipse(s(xx - 6, yy - 6, xx + 6, yy + 6), fill=(200, 200, 200, 255))
        for cx in (232, 280):
            d.ellipse(s(cx - 20, 290, cx + 20, 330), outline=(225, 225, 225, 255), width=7 * k)  # knockers
        d.rectangle(s(90, 440, 422, 462), fill=INK)
    return supersample(draw, (512, 512))


def pearl_mount(tone: int):
    """Pearl mount: ring centred at (256, 300) like the watch dial it replaces; wave crests on top."""
    def draw(d, k):
        cx, cy = 256 * k, 300 * k
        for r, col in ((178, INK), (170, (tone, tone, tone, 255)), (152, INK)):
            d.ellipse([cx - r * k, cy - r * k, cx + r * k, cy + r * k], fill=col)
        d.ellipse([cx - 146 * k, cy - 146 * k, cx + 146 * k, cy + 146 * k], fill=(0, 0, 0, 0))
        for i, a in enumerate((-0.5, 0.0, 0.5)):                                 # three wave crests
            x = cx + math.sin(a) * 178 * k; y = cy - math.cos(a) * 178 * k
            d.pieslice([x - 34 * k, y - 46 * k, x + 34 * k, y + 22 * k], 180, 360, fill=INK)
            d.pieslice([x - 26 * k, y - 38 * k, x + 26 * k, y + 16 * k], 180, 360, fill=(tone, tone, tone, 255))
    return supersample(draw, (512, 512))


def logo():
    image = Image.new('RGBA', (1600, 600), (0, 0, 0, 0)); d = ImageDraw.Draw(image)
    # text kept in the top ~65% of the canvas: the board frame draws the logo over its top beam
    for text, size, y in (('DRAGON', 220, 10), ('TIDE', 190, 220)):
        font = ImageFont.truetype(FONT, size); w = d.textlength(text, font=font)
        d.text(((1600 - w) / 2, y), text, font=font, fill=(70, 70, 70, 255), stroke_width=16, stroke_fill=(240, 240, 236, 255))
    return image


def pearl_in_mount(tone: int, size: int):
    """mount + a plain grey pearl where the game draws the tier gem (cards only)"""
    image = pearl_mount(tone)
    def draw(d, k):
        cx, cy = 256 * k, 300 * k
        for i in range(40, 0, -1):  # soft radial shading
            v = int(150 + (40 - i) * 2.6); r = 146 * k * i / 40
            d.ellipse([cx - r - (40 - i) * 0.6 * k, cy - r - (40 - i) * 0.9 * k, cx + r - (40 - i) * 0.6 * k, cy + r - (40 - i) * 0.9 * k], fill=(v, v, v, 255))
    image.alpha_composite(supersample(draw, (512, 512)))
    image.alpha_composite(pearl_mount(tone))
    return image.resize((size, size), Image.LANCZOS)


def card(index: int):
    """960x720 feature card: paper + ink border, new art where it exists, grey placeholders elsewhere."""
    image = Image.new('RGBA', (960, 720), PAPER); d = ImageDraw.Draw(image)
    d.rectangle([10, 10, 950, 710], outline=INK, width=8)
    if index == 1:   # pay anywhere: the four high symbols
        for i in range(4):
            tile = Image.open(ART / f'symbols/v3/h{i + 1}-v3.png').convert('RGBA'); tile.thumbnail((380, 340))
            image.alpha_composite(tile, (70 + (i % 2) * 430, 40 + (i // 2) * 330))
    elif index == 2:  # the king casts a pearl
        king = Image.open(ART / 'characters/mg-dragon-king-master-v2-fit.png').convert('RGBA').crop((0, 60, 1024, 1500)); king.thumbnail((640, 690))
        image.alpha_composite(king, (330, 20))
        image.alpha_composite(pearl_in_mount(150, 260), (70, 200))
    else:             # free game: pearls add up to TOTAL
        for i, tone in enumerate((150, 165, 180, 195, 215)):
            image.alpha_composite(pearl_in_mount(tone, 200), (40 + i * 178, 260))
    return image


def main():
    hypno = Path(__file__).resolve().parent / 'source'  # Hypno-era originals, greyed below (not shipped)
    for src, name in [('hypnoBackground/curtain.png', 'curtain.png'), ('hypnoFrame/corner.png', 'frame_corner.png'),
                      ('hypnoFrame/top.png', 'frame_top.png'), ('hypnoFrame/side.png', 'frame_side.png'),
                      ('hypnoUi/bar_strip.png', 'bar_strip.png'), ('hypnoUi/buybonus_plate.png', 'buybonus_plate.png'),
                      ('hypnoUi/buybonus_plate_lit.png', 'buybonus_plate_lit.png'), ('hypnoUi/fs_counter_panel.png', 'fs_counter_panel.png'),
                      ('hypnoUi/fs_sign.png', 'fs_sign.png'), ('hypnoUi/ticker_plate.png', 'ticker_plate.png'),
                      ('hypnoUi/total_plate.png', 'total_plate.png'), ('hypnoUi/total_plate_mid.png', 'total_plate_mid.png'),
                      ('hypnoUi/total_plate_high.png', 'total_plate_high.png')] + \
                     [(f'hypnoWinBanners/{n}.png', f'banner_{n}.png') for n in ('big', 'superwin', 'mega', 'epic', 'max')]:
        grey(hypno / src, INTERIM / name)
    for name in ('button_single.svg', 'button_single_on.svg'):
        grey_svg(hypno / 'hypnoUi' / name, INTERIM / name)
    for folder in ('medusaUiIcons',):
        out = INTERIM / 'icons'; out.mkdir(exist_ok=True)
        for p in sorted((hypno / folder).glob('*.png')):
            grey(p, out / p.name)
    logo().save(INTERIM / 'logo.png', optimize=True)
    princess = Image.open(ART / 'characters/fg-dragon-princess-master-v2-fit.png').convert('RGBA')
    princess.resize((683, 1024), Image.LANCZOS).save(INTERIM / 'buy_princess.png', optimize=True)  # buy modal figure (new art)
    for i in (1, 2, 3):
        card(i).convert('RGB').save(INTERIM / f'intro_{i}.jpg', quality=90)
    for i, tone in enumerate((150, 170, 190, 205, 220), 1):
        pearl_mount(tone).save(INTERIM / f'pearl_t{i}.png', optimize=True)
    pearl_mount(185).save(INTERIM / 'pearl_blank.png', optimize=True)
    # symbols: v3 highs as delivered (512 wide keeps the aspect), interim lows and gate
    for i in range(1, 5):
        tile = Image.open(ART / f'symbols/v3/h{i}-v3.png').convert('RGBA')
        tile.resize((512, round(512 * tile.height / tile.width)), Image.LANCZOS).save(SYMBOLS / f'h{i}.png', optimize=True)
    for i, (shape, tone) in enumerate((('disc', 200), ('hex', 176), ('diamond', 160), ('shield', 186), ('octagon', 146)), 1):
        plaque(shape, tone).save(SYMBOLS / f'l{i}.png', optimize=True)
    gate().save(SYMBOLS / 's.png', optimize=True)
    for src, dst in (('mg-moonlit-sea-v2-1920x1080.png', 'bg_base.jpg'), ('fg-palace-v2-1920x1080.png', 'bg_free.jpg')):
        Image.open(ART / 'backgrounds' / src).convert('RGB').save(BACKGROUND / dst, quality=90)
    print('interim art written')


if __name__ == '__main__':
    main()
