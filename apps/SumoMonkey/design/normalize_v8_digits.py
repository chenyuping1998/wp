"""Drawn digit sets: every glyph PNG must be <table width> x 256.

2026-10-06. InkNumber.svelte draws each glyph at height = fontSize, so a glyph
delivered on a 512x512 canvas renders at half size (the FS counter's "9" in
"9 / 10"). The oversized ones carry the glyph at the same scale, centred on the
512 canvas, so a centred crop to the table's width x 256 restores them exactly.

  /Applications/anaconda3/bin/python3 design/normalize_v8_digits.py          # fix source + static
  /Applications/anaconda3/bin/python3 design/normalize_v8_digits.py --check  # report only
"""
import re
import sys
from pathlib import Path

from PIL import Image

APP = Path(__file__).resolve().parent.parent
TABLE = (APP / 'src/game/v8Digits.ts').read_text()
DIRS = [APP / 'design/source/v8', APP / 'static/assets/sprites/sushiV8']
check = '--check' in sys.argv

# key -> width from v8Digits.ts
widths = {k: int(w) for k, w in re.findall(r'"key": "v8Digit(\w+)",\s*"width": (\d+)', TABLE)}
bad = 0
for d in DIRS:
    for p in sorted(d.glob('digit_*.png')):
        role, idx = p.stem.split('_')[1:]
        w = widths.get(f'{role}{idx}')
        if w is None:
            continue
        im = Image.open(p).convert('RGBA')
        if im.size == (w, 256):
            continue
        bad += 1
        print(f'{p.relative_to(APP)}: {im.size} -> ({w}, 256)')
        if not check:
            cx, cy = im.width / 2, im.height / 2
            box = (round(cx - w / 2), round(cy - 128), round(cx - w / 2) + w, round(cy - 128) + 256)
            ink = im.getchannel('A').getbbox()
            assert ink and box[0] <= ink[0] and box[1] <= ink[1] and ink[2] <= box[2] and ink[3] <= box[3], (p, ink, box)
            im.crop(box).save(p)
# Punctuation sits on the digits' baseline: '.' (10) bottom on it, ',' (11)
# hanging 12% of a digit's height below it. Delivered, they floated mid-height
# and "$21.50" read as "$21·50".
for d in DIRS:
    for role in ('count', 'fs', 'plate', 'receipt'):
        zero = Image.open(d / f'digit_{role}_0.png').getchannel('A').getbbox()
        base, digit_h = zero[3], zero[3] - zero[1]
        for idx, want_bottom in ((10, base), (11, base + round(digit_h * 0.12))):
            p = d / f'digit_{role}_{idx}.png'
            im = Image.open(p).convert('RGBA')
            ink = im.getchannel('A').getbbox()
            dy = want_bottom - ink[3]
            if abs(dy) <= 2:
                continue
            bad += 1
            print(f'{p.relative_to(APP)}: punctuation bottom {ink[3]} -> {want_bottom}')
            if not check:
                out = Image.new('RGBA', im.size, (0, 0, 0, 0))
                out.paste(im, (0, dy))
                out.save(p)
print('ok' if not bad else f'{bad} glyph(s) {"wrong" if check else "fixed"}')
sys.exit(1 if check and bad else 0)
