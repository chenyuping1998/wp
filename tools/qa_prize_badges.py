from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / 'apps'
VALUES = (1, 25, 250)

for folder, theme, center_y, ink in (
    ('StrikeMonkey保齡球館', 'strike', 335, '#8f2b16'),
    ('MardiMonkey嘉年華', 'mardi', 400, '#5c126f'),
):
    app = ROOT / folder
    art = Image.open(app / 'static/assets/sprites/sushiSymbols/p.png').convert('RGBA')
    font_path = app / 'static/fonts/sushi/Anton-Regular.ttf'
    sheet = Image.new('RGB', (3 * 240, 270), '#243139')
    for i, value in enumerate(VALUES):
        tile = art.resize((123, 123), Image.Resampling.LANCZOS)
        y = round(123 * center_y / 512)
        draw = ImageDraw.Draw(tile)
        font = ImageFont.truetype(str(font_path), 16 if value > 99 else 20)
        draw.text((61.5, y), f'{value}x', font=font, anchor='mm', fill=ink)
        large = tile.resize((210, 210), Image.Resampling.NEAREST)
        sheet.paste(large, (i * 240 + 15, 24), large)
    out = app / f'design/qa_{theme}_prize_badges.png'
    sheet.save(out)
    print(out)
