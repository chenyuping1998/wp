"""Build reproducible review sheets; generated originals stay untouched.

This is a style mockup, not a production game screenshot or motion acceptance.
"""
from pathlib import Path
import argparse
import json
import hashlib
import os
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, default=ROOT / 'style_test')
parser.add_argument('--label', default='')
parser.add_argument('--status', default='style_test_pending_selection')
parser.add_argument('--mg-caption', default='MG / THE OVERCONFIDENT HYPNOTIST')
parser.add_argument('--fg-caption', default='FG / THE MISCHIEVOUS ASSISTANT')
args = parser.parse_args()
SOURCE = args.source.resolve()
OUT = SOURCE / 'review'
OUT.mkdir(exist_ok=True)
COLORS = ['#1B1716', '#F2E6CC', '#D2322D', '#24508C', '#E3A82B', '#8C5A3C', '#9B3DF5']
palette_rules = json.loads((SOURCE / 'palette.json').read_text()) if (SOURCE / 'palette.json').exists() else {}
NAMES = ['01_h1', '02_l1', '03_scatter', '04_watch', '05_background', '06_mg_head', '07_fg_head']
FONT = ROOT.parent / 'static/fonts/TitanOne.ttf'


def font(size):
    return ImageFont.truetype(str(FONT), size)


def normalize(name):
    original = Image.open(SOURCE / f'{name}.png').convert('RGB')
    # Key only the known green screen. Quantize after keying so green never
    # contaminates a palette index. Original art remains available for review.
    alpha = Image.new('L', original.size, 255)
    if name != '05_background':
        alpha.putdata([0 if g > 145 and g > r * 1.65 and g > b * 1.65 else 255
                       for r, g, b in original.getdata()])
    palette = Image.new('P', (1, 1))
    allowed = COLORS if name in ['03_scatter', '04_watch', '06_mg_head'] else COLORS[:-1]
    allowed = palette_rules.get(name, allowed)
    rgb = [tuple(bytes.fromhex(color[1:])) for color in allowed]
    palette.putpalette([v for color in rgb for v in color] + list(rgb[0]) * (256 - len(rgb)))
    result = original.quantize(palette=palette, dither=Image.Dither.NONE).convert('RGBA')
    if name == '06_mg_head':
        # Four colored inks + black: cream replaces gold spectacle rims, and
        # tiny blue anti-alias colors become ink. Violet stays exclusive to eyes.
        result.putdata([(242, 230, 204, a) if (r, g, b) == (227, 168, 43)
                        else (27, 23, 22, a) if (r, g, b) == (36, 80, 140)
                        else (r, g, b, a) for r, g, b, a in result.getdata()])
    result.putalpha(alpha)
    if name != '05_background':
        result = result.crop(result.getbbox())
    result.save(OUT / f'{name}.png')
    return result


art = {name: normalize(name) for name in NAMES}


def place(canvas, name, box):
    image = ImageOps.contain(art[name], (box[2], box[3]), Image.Resampling.LANCZOS)
    canvas.alpha_composite(image, (box[0] + (box[2] - image.width) // 2,
                                   box[1] + (box[3] - image.height) // 2))


# Catalog: both backgrounds expose any green fringe left by the key.
sheet = Image.new('RGBA', (1440, 990), COLORS[1])
d = ImageDraw.Draw(sheet)
d.text((25, 16), 'HYPNO MONKEY / SCREENPRINT STYLE TEST ' + args.label, font=font(27), fill=COLORS[0])
for index, name in enumerate(NAMES):
    x, y = 20 + (index % 4) * 355, 75 + (index // 4) * 430
    d.rectangle((x, y, x + 335, y + 345), fill=COLORS[0] if index % 2 else '#FFFFFF')
    place(sheet, name, (x + 12, y + 12, 311, 321))
    d.text((x, y + 355), name, font=font(18), fill=COLORS[0])
d.text((25, 945), 'STYLE MOCKUP / NOT PRODUCTION ART OR ANIMATION ACCEPTANCE', font=font(19), fill=COLORS[0])
sheet.convert('RGB').save(OUT / 'contact.jpg', quality=95)

# Six-by-six geometry and 70px symbols. Repeated samples deliberately do not
# pretend the remaining nine-symbol set has been drawn.
mock = ImageOps.fit(art['05_background'], (1400, 900)).convert('RGBA')
d = ImageDraw.Draw(mock)
d.rectangle((0, 0, 1400, 65), fill=COLORS[1])
d.text((25, 12), 'HYPNO MONKEY / 6 x 6 STYLE MOCKUP', font=font(31), fill=COLORS[0])
d.rectangle((330, 125, 956, 751), fill=COLORS[0], outline=COLORS[4], width=12)
for row in range(6):
    for col in range(6):
        name = ['01_h1', '02_l1', '02_l1', '01_h1', '03_scatter'][(row * 7 + col * 3) % 5]
        x, y = 343 + col * 100, 138 + row * 100
        d.rectangle((x, y, x + 99, y + 99), fill=COLORS[3], outline=COLORS[0], width=2)
        place(mock, name, (x + 15, y + 15, 70, 70))
place(mock, '06_mg_head', (990, 180, 350, 450))
place(mock, '04_watch', (1050, 640, 200, 200))
d = ImageDraw.Draw(mock)
d.text((335, 785), 'SAMPLE SYMBOLS AT 70px', font=font(23), fill=COLORS[0])
d.rectangle((0, 845, 1400, 900), fill=COLORS[1])
d.text((25, 860), 'ART DIRECTION ONLY / THREE SAMPLE SYMBOLS REPEATED / NO GAMEPLAY CLAIM', font=font(18), fill=COLORS[0])
mock.convert('RGB').save(OUT / 'board-mockup.jpg', quality=95)

# Actual target sizes, with no upscaling in the review sheet.
small = Image.new('RGBA', (900, 440), COLORS[1])
d = ImageDraw.Draw(small)
d.text((20, 15), '70px SYMBOLS / 200px STORE COMPOSITES', font=font(22), fill=COLORS[0])
for i, name in enumerate(['01_h1', '02_l1', '03_scatter', '04_watch']):
    x = 20 + i * 105
    d.rectangle((x, 85, x + 90, 175), fill=COLORS[0])
    place(small, name, (x + 10, 95, 70, 70))
for i, name in enumerate(['06_mg_head', '07_fg_head']):
    tile = ImageOps.fit(art['05_background'], (200, 200)).convert('RGBA')
    place(tile, name, (10, 10, 180, 190))
    small.alpha_composite(tile, (465 + i * 215, 80))
d.text((20, 330), 'ORIGINALS + PALETTE NORMALIZATION / ' + ('APPROVAL PENDING' if args.status == 'style_test_pending_selection' else 'CHARACTER REVISION'), font=font(18), fill=COLORS[0])
small.convert('RGB').save(OUT / 'size-check.jpg', quality=96)

pair = Image.new('RGBA', (1100, 740), COLORS[1])
d = ImageDraw.Draw(pair)
d.text((25, 18), 'HYPNO MONKEY / CHARACTER REVISION ' + args.label, font=font(29), fill=COLORS[0])
for i, name in enumerate(['06_mg_head', '07_fg_head']):
    place(pair, name, (30 + i * 550, 80, 490, 580))
d.text((55, 680), args.mg_caption, font=font(18), fill=COLORS[0])
d.text((595, 680), args.fg_caption, font=font(18), fill=COLORS[0])
pair.convert('RGB').save(OUT / 'characters.jpg', quality=96)

manifest = {
    'status': args.status,
    'productionInstalled': False,
    'tool': 'built-in image_gen',
    'brief': os.path.relpath(ROOT / 'STYLE_TEST_SCREENPRINT.md', OUT),
    'processing': 'green-screen key; fixed seven-color palette; resize and composite only',
    'processingScriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    'perAssetPalette': palette_rules,
    'limitations': ['Only three symbol types sampled', 'No full-body layered characters or animation acceptance',
                    'Board image is an art mockup, not a runtime screenshot'],
    'sources': {name: hashlib.sha256((SOURCE / f'{name}.png').read_bytes()).hexdigest() for name in NAMES},
}
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(OUT)
