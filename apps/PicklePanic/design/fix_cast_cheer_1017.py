"""Review 2026-10-17 ("Poor animations"): two bad beats in the big-win cheer.

FG (picklePepper): root scale.x went 1 -> 0.25 -> -1 -> -0.2 -> 1, a paper-flip
"turn" that flattens her to a one-pixel sliver twice. Replaced by a hop with
squash and stretch (no negative or near-zero x scale anywhere).

MG (pickleBoss): the hanging arms faded out while the raised arms faded in over
0.18-0.36 s, so for ~10 frames both pairs were half-transparent on top of each
other. Now a stepped swap at 0.14 s, at the bottom of the anticipation dip.

Idempotent: always starts from the backup taken on the first run.
"""
from pathlib import Path
import json, shutil
ROOT = Path(__file__).resolve().parents[1]
BK = ROOT / 'design/source/review_1017'
BK.mkdir(parents=True, exist_ok=True)

def load(folder):
    p = ROOT / 'static/assets/spines' / folder / 'cast.json'
    b = BK / f'{folder}_cast_before_1017.json'
    if not b.exists():
        shutil.copy2(p, b)
    return p, json.loads(b.read_text())

def step(keys):
    return [dict({'time': t, 'color': c}, **({'curve': 'stepped'} if i < len(keys) - 1 else {})) for i, (t, c) in enumerate(keys)]

# FG
p, d = load('picklePepper')
cheer = d['animations']['bigwin_cheer']
cheer['bones']['root'] = {'scale': [
    {'time': 0, 'x': 1, 'y': 1},
    {'time': 0.12, 'x': 1.07, 'y': 0.92},   # crouch
    {'time': 0.30, 'x': 0.94, 'y': 1.08},   # spring up
    {'time': 0.52, 'x': 1.03, 'y': 0.97},   # land
    {'time': 0.70, 'x': 0.99, 'y': 1.01},
    {'time': 0.90, 'x': 1, 'y': 1},
    {'time': 1.6, 'x': 1, 'y': 1},
]}
cheer['bones']['root']['rotate'] = [
    {'time': 0, 'value': 0}, {'time': 0.30, 'value': -3}, {'time': 0.55, 'value': 2},
    {'time': 0.85, 'value': -1}, {'time': 1.2, 'value': 0}, {'time': 1.6, 'value': 0},
]
p.write_text(json.dumps(d, separators=(',', ':')))

# MG
p, d = load('pickleBoss')
for name in ('bigwin_cheer',):
    slots = d['animations'][name]['slots']
    for s in ['left_arm_2_hand', 'left_arm_0_upper_arm', 'right_arm_2_hand', 'right_arm_0_upper_arm']:
        slots[s] = {'rgba': step([(0, 'ffffffff'), (0.14, 'ffffff00'), (1.6, 'ffffff00')])}
    for s in ['v2_raise_L', 'v2_raise_R']:
        slots[s] = {'rgba': step([(0, 'ffffff00'), (0.14, 'ffffffff'), (1.6, 'ffffffff')])}
p.write_text(json.dumps(d, separators=(',', ':')))
print('cast cheer fixed')
