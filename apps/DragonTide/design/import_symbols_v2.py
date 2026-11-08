"""Prepare generated RGBA art: uniform canvas/padding/downsample only, no painting.

Originals and prompts remain in design/source. Run after all ten images exist.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageStat
import hashlib
import json
import shutil

APP = Path(__file__).resolve().parent.parent
SOURCE = APP / 'design/source/medusagaze/symbols'
RUNTIME = APP / 'static/assets/sprites/medusaSymbols'
SHEETS = SOURCE.parent / '_sheets'
KEYS = ['s', 'h1', 'h2', 'h3', 'h4', 'h5', 'l1', 'l2', 'l3', 'l4']
LABELS = ['S · Aegis', 'H1 · Crown', 'H2 · Helmet', 'H3 · Lyre', 'H4 · Amphora', 'H5 · Laurel', 'L1 · Ruby', 'L2 · Sapphire', 'L3 · Aqua', 'L4 · Amber']
font_path = 'C:/Windows/Fonts/arial.ttf'
font = ImageFont.truetype(font_path, 20)
small = ImageFont.truetype(font_path, 15)
title = ImageFont.truetype(font_path, 28)
SHEETS.mkdir(parents=True, exist_ok=True)
metadata = []
prepared = {}
for key in KEYS:
    src = SOURCE / f'{key}_original.png'
    image = Image.open(src)
    assert image.mode == 'RGBA', f'{key}: real alpha required'
    alpha = image.getchannel('A')
    assert alpha.getextrema() == (0, 255), f'{key}: background must be transparent'
    full = alpha.getbbox()
    # Size by the visible silhouette; a few near-zero alpha generator specks
    # must not make the square sapphire smaller than the other gems.
    visible = alpha.point(lambda value: 255 if value >= 32 else 0).getbbox()
    target = 420 if key.startswith('h') else 408 if key == 's' else 392
    scale = target / max(visible[2] - visible[0], visible[3] - visible[1])
    size = tuple(round(v * scale) for v in image.size)
    resized = image.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (512, 512))
    offset = (round(256 - (visible[0] + visible[2]) / 2 * scale),
              round(256 - (visible[1] + visible[3]) / 2 * scale))
    canvas.alpha_composite(resized, offset)
    dest = SOURCE / f'{key}.png'
    canvas.save(dest, optimize=True)
    old = RUNTIME / f'{key}.png'
    archive = SOURCE / 'legacy-placeholders' / old.name
    if old.exists() and not archive.exists():
        archive.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(old, archive)
    shutil.copy2(dest, old)
    prepared[key] = canvas
    a = canvas.getchannel('A')
    bbox = a.point(lambda value: 255 if value >= 32 else 0).getbbox()
    rgb = Image.new('RGBA', canvas.size, '#1E4950')
    rgb.alpha_composite(canvas)
    opaque = a.point(lambda value: 255 if value >= 128 else 0)
    mean = ImageStat.Stat(canvas.convert('L'), opaque).mean[0]
    metadata.append({'name': key, 'original': src.name, 'originalSize': list(image.size), 'sourceAlphaBounds': full, 'sizingAlphaBounds': visible,
                     'runtimeSize': [512, 512], 'alphaBounds': bbox, 'scale': scale, 'offset': offset,
                     'opaqueMeanLuminance': round(mean, 2), 'bytes': old.stat().st_size,
                     'sha256': hashlib.sha256(old.read_bytes()).hexdigest(),
                     'processing': 'Proportional downsample and transparent canvas placement from visible alpha bounds (>=32). Full generated source retained; no artwork painting or colour correction.'})

# Presentation on the actual dark teal ground, including true game scale.
sheet = Image.new('RGB', (1440, 870), '#0c242c')
d = ImageDraw.Draw(sheet)
d.text((32, 22), 'MEDUSA GAZE / PRODUCTION SYMBOLS V2', fill='#f2c14e', font=title)
d.text((32, 63), 'Approved sample material direction · 512px RGBA · large view + 98px game-size check', fill='#b7cbd0', font=small)
for i, (key, label) in enumerate(zip(KEYS, LABELS)):
    x, y = 24 + i % 5 * 283, 109 + i // 5 * 366
    d.rounded_rectangle((x, y, x + 270, y + 351), radius=12, fill='#173d44', outline='#386069', width=1)
    im = prepared[key].resize((244, 244), Image.Resampling.LANCZOS)
    sheet.paste(im, (x + 13, y + 5), im)
    d.text((x + 15, y + 251), label, fill='#f4e8ce', font=font)
    im = prepared[key].resize((98, 98), Image.Resampling.LANCZOS)
    sheet.paste(im, (x + 151, y + 246), im)
    d.text((x + 15, y + 294), 'in-game 98px →', fill='#9ab9bd', font=small)
sheet_path = SHEETS / 'symbols_v2_contact.jpg'
sheet.save(sheet_path, quality=94, subsampling=0)

# Board composition proves colour separation and equal visual weight at 98px.
board = Image.new('RGB', (720, 788), '#0c242c')
d = ImageDraw.Draw(board)
d.text((34, 20), 'MEDUSA GAZE / 98px BOARD CHECK', fill='#f2c14e', font=title)
d.text((34, 60), 'Production symbols · no gameplay result implied', fill='#b7cbd0', font=small)
layout = [
    ['h1','h2','h3','h4','l1','h5'], ['l2','l3','l4','h1','h2','h4'],
    ['s','h5','l1','s','l2','h3'], ['h2','h4','h5','l3','h1','l4'],
    ['h3','l1','h4','h5','l4','h2'], ['l4','h3','l2','h1','l3','h5'],
]
for row, line in enumerate(layout):
    for col, key in enumerate(line):
        x, y = 36 + col * 108, 112 + row * 108
        d.rectangle((x, y, x + 108, y + 108), fill='#1E4950', outline='#8b7649', width=1)
        im = prepared[key].resize((98, 98), Image.Resampling.LANCZOS)
        board.paste(im, (x + 5, y + 5), im)
board.save(SHEETS / 'symbols_v2_board_98px.jpg', quality=95, subsampling=0)

report = {'tool': 'built-in image_gen', 'approvalEvidence': '風格樣張沒問題；獎圖要像樣張那樣子',
          'reference': '../style_ref.png', 'prompts': 'SYMBOL_PROMPTS.md', 'files': metadata,
          'runtimeBytes': sum(m['bytes'] for m in metadata),
          'contactSheet': '../_sheets/symbols_v2_contact.jpg', 'boardCheck': '../_sheets/symbols_v2_board_98px.jpg',
          'remaining': 'Final character art, separate character snake layers and Spine 4.3 are separate deliverables.'}
(SOURCE / 'manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'symbols': len(metadata), 'runtimeBytes': report['runtimeBytes'], 'contactSheet': str(sheet_path)}, indent=2))
