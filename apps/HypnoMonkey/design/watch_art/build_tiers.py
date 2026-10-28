"""Five watch tiers, one metal colour per multiplier band (Stone, 2026-10-28).

Same registration and six-band recolour as build.py, more bands:
  t1 bronze  x2-x5      t2 emerald x8-x10    t3 violet x15-x50
  t4 crimson x100       t5 gold    x250-x500
The cream dial stays cream so the dark value reads on every tier.

  python3 design/watch_art/build_tiers.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib, json

R = Path(__file__).resolve().parent
A = R.parents[1]
O = A / 'static/assets/sprites/hypnoWatches'
O.mkdir(exist_ok=True)

im = Image.open(R / 'source-bronze.png').convert('RGBA')
W, H = im.size
center = (W * .5, H * .602)  # dial centre, as build.py
scale = 430 / H
base = Image.new('RGBA', (512, 512))
small = im.resize((round(W * scale), round(H * scale)), Image.Resampling.LANCZOS)
base.alpha_composite(small, (round(256 - center[0] * scale), round(300 - center[1] * scale)))

DIAL = '#f6e7c7'
TIERS = {
    't1': ('bronze', '2-5', ['#261b17', '#74442c', '#a76a3a', '#c98c52', '#e9b879', '#f3d6a5']),
    't2': ('emerald', '8-10', ['#10201a', '#1f5a3d', '#2f8a57', '#46b26d', '#86d897', '#c9f0c6']),
    't3': ('violet', '15-50', ['#1d1328', '#4b2378', '#7136b5', '#9b3df5', '#c48bff', '#e8d3ff']),
    't4': ('crimson', '100', ['#250f12', '#6e1822', '#a82230', '#d9343f', '#f2747a', '#ffc4c2']),
    't5': ('gold', '250-500', ['#281c16', '#8b5124', '#bd7f27', '#e1aa35', '#f6cc65', '#ffe4a0']),
}

for key, (_, _, colors) in TIERS.items():
    out = []
    for red, green, blue, a in base.getdata():
        if a < 16:
            out.append((0, 0, 0, 0))
            continue
        lum = .2126 * red + .7152 * green + .0722 * blue
        if red > 220 and green > 205 and blue > 160:
            hexc = DIAL
        else:
            hexc = colors[0 if lum < 55 else 1 if lum < 105 else 2 if lum < 145 else 3 if lum < 185 else 4 if lum < 220 else 5]
        out.append((*bytes.fromhex(hexc[1:]), a))
    img = Image.new('RGBA', base.size)
    img.putdata(out)
    img.save(O / f'watch-{key}.png')

review = Image.new('RGB', (1500, 430), '#b8b1a4')
d = ImageDraw.Draw(review)
font = ImageFont.truetype(str(A / 'static/fonts/TitanOne.ttf'), 34)
for i, (key, (name, band, _)) in enumerate(TIERS.items()):
    img = Image.open(O / f'watch-{key}.png')
    img.thumbnail((270, 270))
    review.paste(img, (i * 300 + 15, 20), img)
    d.text((i * 300 + 150, 178), '×' + band.split('-')[0], font=font, fill='#261b17', anchor='mm')
    d.text((i * 300 + 150, 340), name, font=font, fill='#261b17', anchor='mm')
    d.text((i * 300 + 150, 385), '×' + band.replace('-', '–×'), font=font, fill='#261b17', anchor='mm')
review.save(R / 'tiers-5.jpg', quality=94)

meta = json.loads((R / 'manifest.json').read_text()) if (R / 'manifest.json').exists() else {}
meta['tiers5'] = {k: {'name': n, 'values': b, 'sha256': hashlib.sha256((O / f'watch-{k}.png').read_bytes()).hexdigest()} for k, (n, b, _) in TIERS.items()}
(R / 'manifest.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n')
print('five tiers ready')
