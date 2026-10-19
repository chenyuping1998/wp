from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path('E:/stake/wp/apps')
games = [
    ('MardiMonkey嘉年華', '嘉年華'),
    ('PochaMonkey韓式路邊攤', '韓式'),
    ('StrikeMonkey保齡球館', '保齡球館'),
    ('SwingMonkey爵士俱樂部', '爵士'),
]
out = Image.new('RGB', (680, 1440), '#f2ebdd')
draw = ImageDraw.Draw(out)
font_path = 'C:/Windows/Fonts/msjh.ttc'
font = ImageFont.truetype(font_path, 22)
for row, (folder, title) in enumerate(games):
    for col, (cast, caption) in enumerate((('mg', '主遊戲'), ('fg', 'FG'))):
        source = root / folder / 'design/redraw/v1' / f'{cast}_setup_rigid.png'
        figure = Image.open(source).convert('RGB')
        x = col * 340 + (340 - figure.width) // 2
        y = row * 360 + 10
        out.paste(figure, (x, y))
        draw.text((col * 340 + 24, row * 360 + 329), f'{title} · {caption}', fill='#272426', font=font)
out.save('E:/stake/wp/tmp/four_game_redraw_contact.png')
