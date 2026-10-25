"""Contact sheet of a cut: the arm-less cel, the pieces put back, and the
pieces pulled apart.   python -I design/arms/preview_cut.py <mg|fg> out.png"""
import json
import sys
from pathlib import Path

from PIL import Image

cast, dst = sys.argv[1], sys.argv[2]
D = Path(__file__).resolve().parent.parent / 'source/saucer/cast' / cast / 'arms'
meta = json.loads((D / 'cut.json').read_text())
body = Image.open(D / 'cels/neutral.png').convert('RGBA')
W, H = body.size
sheet = Image.new('RGBA', (W * 3, H), (40, 90, 140, 255))
sheet.alpha_composite(body, (0, 0))
full = body.copy()
for n in meta['order']:
    if n.startswith('light'):
        continue
    x, y, w, h = meta['boxes'][n]
    full.alpha_composite(Image.open(D / 'parts' / f'{n}.png'), (x, y))
sheet.alpha_composite(full, (W, 0))
ex = body.copy()
for n in meta['order']:
    x, y, w, h = meta['boxes'][n]
    k = {'sleeve': 0, 'fore': 1, 'hand': 2, 'light': 2}[n.rstrip('LRx')]
    dx = (-1 if n.endswith(('L', 'Lx')) else 1) * 22 * k
    ex.alpha_composite(Image.open(D / 'parts' / f'{n}.png'), (max(0, x + dx), y + 14 * k))
sheet.alpha_composite(ex, (2 * W, 0))
sheet.save(dst)
