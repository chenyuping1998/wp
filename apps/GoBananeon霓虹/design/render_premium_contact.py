"""Render a review sheet of the actual premium symbol sources; no asset edits."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

APP = Path(__file__).resolve().parents[1]
ROOT = APP / 'design/source/neon_premium'
FONT = str(APP / 'static/fonts/TitanOne.ttf')
items = [('h1', 'BASSBOX'), ('h2', 'CYBER HELMET'), ('h3', 'PAINT'), ('h4', 'HIGH TOP'), ('w', 'DJ WILD'),
         ('s', 'GOLD SCATTER'), ('b', 'PULSE BOMB'), ('p', 'PRIZE'), ('l1', 'A'), ('l2', 'K'),
         ('l3', 'Q'), ('l4', 'J'), ('l5', '10'), ('x', 'EMPTY')]
cols, cell, gap, margin = 5, 230, 14, 28
width = margin * 2 + cols * cell + (cols - 1) * gap
height = 112 + 3 * (cell + 38) + 24
sheet = Image.new('RGB', (width, height), '#0a1025')
d = ImageDraw.Draw(sheet)
d.text((margin, 24), 'NEON / PREMIUM SYMBOLS', font=ImageFont.truetype(FONT, 32), fill='#d6f6ff')
d.text((margin, 70), 'ORIGINAL ART  /  TRANSPARENT SILHOUETTES  /  COHERENT MOTION LAYERS', font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 14), fill='#8496b8')
for i, (key, label) in enumerate(items):
    x = margin + (i % cols) * (cell + gap)
    y = 112 + (i // cols) * (cell + 38)
    d.rounded_rectangle((x, y, x + cell, y + cell), radius=18, fill='#121b36', outline='#263354', width=1)
    image = Image.open(ROOT / 'symbols' / f'{key}.png').convert('RGBA')
    image.thumbnail((cell - 24, cell - 24), Image.Resampling.LANCZOS)
    sheet.paste(image, (x + (cell - image.width) // 2, y + (cell - image.height) // 2), image)
    d.text((x + 6, y + cell + 9), label, font=ImageFont.truetype(FONT, 13), fill='#8de5ef' if key not in ('s', 'b') else '#e7c67f')
out = ROOT / 'premium_symbols_contact.jpg'
sheet.save(out, quality=94, subsampling=0)
print(out)
