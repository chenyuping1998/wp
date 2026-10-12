"""Render the complete reel alphabet at its in-game visual size."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
folder = root / 'static/assets/sprites/goBanalavaSymbols'
names = ['h1', 'h2', 'h3', 'h4', 'l1', 'l2', 'l3', 'l4', 'l5', 'w', 's', 'b', 'p', 'x']
cell_w, cell_h = 180, 205
sheet = Image.new('RGB', (cell_w * 7, cell_h * 2), '#17181c')
draw = ImageDraw.Draw(sheet)
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 18)
for i, name in enumerate(names):
    icon = Image.open(folder / f'{name}.png').convert('RGBA')
    icon.thumbnail((140, 140), Image.Resampling.LANCZOS)
    x = (i % 7) * cell_w + (cell_w - icon.width) // 2
    y = (i // 7) * cell_h + 20
    sheet.paste(icon, (x, y), icon)
    draw.text(((i % 7) * cell_w + 16, (i // 7) * cell_h + 174), name.upper(), font=font, fill='#ffcf9c')
out = root / 'design/banalava_symbols_140.png'
sheet.save(out)
print(out)
