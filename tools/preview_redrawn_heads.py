from pathlib import Path
from PIL import Image, ImageDraw

root = Path('E:/stake/wp/apps')
entries = sorted(root.glob('*/design/redraw/v1'))
canvas = Image.new('RGB', (1200, len(entries) * 450), '#d6d1c7')
draw = ImageDraw.Draw(canvas)
for row, folder in enumerate(entries):
    for ci, cast in enumerate(('mg', 'fg')):
        head = Image.open(folder / f'{cast}_cutout/head_2_face.png').convert('RGBA')
        laugh = Image.open(folder / f'{cast}_laugh_generated.png').convert('RGBA').resize(head.size, Image.Resampling.LANCZOS)
        blink = Image.open(folder / f'{cast}_blink_generated.png').convert('RGBA').resize(head.size, Image.Resampling.LANCZOS)
        for i, (title, image) in enumerate((('rest', head), ('laugh', laugh), ('blink', blink))):
            x = ci * 600 + i * 195
            y = row * 450 + 30
            canvas.paste(image, (x, y), image)
            draw.text((x, row * 450 + 5), f'{folder.parent.parent.parent.name[:15]} {cast} {title}', fill='#111111')
canvas.save('E:/stake/wp/tmp/redrawn_head_contact.png')
