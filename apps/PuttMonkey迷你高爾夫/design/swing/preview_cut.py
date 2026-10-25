"""Contact sheet of the arm cut: the arm-less body, the pieces put back, and
the pieces pulled apart.   python -I design/swing/preview_cut.py out.png"""
import json
import sys
from pathlib import Path

from PIL import Image

MG = Path(__file__).resolve().parent.parent / 'source/putt/cast/mg/swing'
meta = json.loads((MG / 'cut.json').read_text())
body = Image.open(MG / 'cels/neutral.png').convert('RGBA')
W, H = body.size
sheet = Image.new('RGBA', (W * 3, H), (40, 90, 140, 255))
sheet.alpha_composite(body, (0, 0))
full = body.copy()
for n in meta['order']:
    x, y, w, h = meta['boxes'][n]
    full.alpha_composite(Image.open(MG / 'parts' / f'{n}.png'), (x, y))
sheet.alpha_composite(full, (W, 0))
SPREAD = {'armL': (-10, -10), 'foreL': (-25, 0), 'handL': (-40, 15), 'club': (-60, 30),
          'armR': (10, -10), 'foreR': (25, 0), 'handR': (40, 15)}
ex = Image.new('RGBA', (W, H), (0, 0, 0, 0))
for n in meta['order']:
    x, y, w, h = meta['boxes'][n]
    dx, dy = SPREAD.get(n, (0, 0))
    ex.alpha_composite(Image.open(MG / 'parts' / f'{n}.png'), (max(0, x + dx + 40), y + dy))
sheet.alpha_composite(ex, (2 * W, 0))
sheet.save(sys.argv[1])
