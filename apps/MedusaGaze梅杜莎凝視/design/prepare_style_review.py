"""Preserve generated originals and normalize the review canvas only.

No production sprite is installed here. Run after an image_gen sample has been
visually inspected. The approval state is deliberately not changed by this tool.
"""
from pathlib import Path
import argparse
import json
import shutil
from PIL import Image, ImageOps, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent / 'source' / 'medusagaze'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('--kind', choices=['screen', 'character'], default='screen')
    args = parser.parse_args()
    ROOT.mkdir(parents=True, exist_ok=True)
    originals = ROOT / 'concept'
    originals.mkdir(exist_ok=True)
    name = 'style_test_v1' if args.kind == 'screen' else 'medusa_hybrid_test_v1'
    target_size = (1920, 1080) if args.kind == 'screen' else (1024, 2048)
    original = originals / f'{name}_original.png'
    shutil.copy2(args.source, original)
    with Image.open(original) as im:
        source_size, source_mode = im.size, im.mode
        # A tiny aspect difference is center-cropped; the original stays intact.
        canvas = ImageOps.fit(im, target_size, method=Image.Resampling.LANCZOS)
        canvas.save(ROOT / f'{name}.png')
    record = {
        'asset': name, 'tool': 'built-in image_gen',
        'original': str(original.relative_to(ROOT)),
        'originalSize': list(source_size), 'originalMode': source_mode,
        'reviewSize': list(target_size), 'approval': 'pending_user_review',
        'productionInstalled': False,
        'processing': 'Canvas normalization only; full generated original retained.',
    }
    (ROOT / f'{name}.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if args.kind == 'screen':
        sheets = ROOT / '_sheets'
        sheets.mkdir(exist_ok=True)
        sheet = Image.new('RGB', (1920, 1250), '#122c34')
        draw = ImageDraw.Draw(sheet)
        font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 26)
        small = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 20)
        draw.text((40, 22), 'MEDUSA GAZE / STYLE REVIEW v1 / APPROVAL PENDING', font=font, fill='#f2c14e')
        sheet.paste(canvas.resize((1280, 720), Image.Resampling.LANCZOS), (40, 75))
        face = canvas.crop((1290, 145, 1720, 650))
        face.thumbnail((500, 590), Image.Resampling.LANCZOS)
        sheet.paste(face, (1380, 75))
        draw.text((1380, 680), 'Face and material detail (crop)', font=small, fill='#efe8d8')
        board = canvas.crop((290, 80, 1180, 510))
        board.thumbnail((1120, 370), Image.Resampling.LANCZOS)
        sheet.paste(board, (40, 835))
        draw.text((40, 800), 'Symbol detail - concept crop; production assets not installed', font=small, fill='#efe8d8')
        palette = [('Face', '#FFD83A'), ('Hair', '#19B5AE'), ('Gold', '#F2C14E'), ('Marble', '#EFE8D8'), ('Board', '#1E4950'), ('Gaze', '#B8FF5A')]
        for index, (label, color) in enumerate(palette):
            px, py = 1380 + (index % 2) * 245, 800 + (index // 2) * 125
            draw.rounded_rectangle((px, py, px + 210, py + 65), radius=12, fill=color)
            draw.text((px, py + 72), f'{label} {color}', font=small, fill='#efe8d8')
        sheet.save(sheets / 'style_test_v1_contact.jpg', quality=94)
    print(json.dumps(record, ensure_ascii=False))

if __name__ == '__main__':
    main()
