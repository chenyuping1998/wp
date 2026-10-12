"""Export the current Swing Monkey cast as transparent, tightly cropped PNGs.

Uses the actual rig source pieces and their draw order. This preserves the
comic ink, clothing and pose without segmenting the dark source background.
Run: python design/build_jazz_character_cutouts.py
"""
import json
from pathlib import Path

from PIL import Image

APP = Path(__file__).resolve().parents[1]
OUT = APP / 'design/cover'
CANVAS = (560, 912)


def export(cast, label):
    root = APP / 'design/source' / cast
    layers = json.loads((root / 'layers.json').read_text())['layers']
    image = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
    for layer in sorted(layers, key=lambda x: x['z']):
        piece = Image.open(root / layer['file']).convert('RGBA')
        image.alpha_composite(piece, (layer['x'], layer['y']))

    bounds = image.getchannel('A').getbbox()
    assert bounds, f'{cast}: empty alpha mask'
    pad = 18
    x0, y0, x1, y1 = bounds
    crop = image.crop((max(0, x0-pad), max(0, y0-pad), min(CANVAS[0], x1+pad), min(CANVAS[1], y1+pad)))
    # 2x is convenient for covers; native rig pixels remain the source of truth.
    crop = crop.resize((crop.width * 2, crop.height * 2), Image.Resampling.LANCZOS)
    dest = OUT / f'SwingMonkey-Character-{label}-Transparent.png'
    crop.save(dest)
    print(dest.name, crop.size, 'alpha', crop.getchannel('A').getextrema())


if __name__ == '__main__':
    export('mg', 'Base')
    export('fg', 'FreeGame')
