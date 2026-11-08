"""Open-palm cheer fix (Stone 2026-10-29: no unnatural angles), on the compiled rig.

In win_big / win_big_loop / win_big_end the left hand swaps to hand_l_open. The
forearm pointed down-left, so the palm stood 90deg off it and sat on the middle
of the forearm with the cuff sticking out past it. Now the forearm reaches up
and out (ik-fist-back -221,312 -> -191,442) and the open hand sits on the cuff
(handB translate 0,50 while hand_l_open is shown).

  python3 design/cast_mg/fix_open_palm.py && python3 design/cast_mg/build_runtime.py
"""
import json
from pathlib import Path

P = Path(__file__).resolve().parent / 'cast_mg_spine/cast_mg.json'
j = json.loads(P.read_text())
A = j['animations']
OLD = (-221, 312)
NEW = (-191, 442)
SEAT = {'x': 0, 'y': 50}

if 'handB' in A['win_big_loop'].get('bones', {}):
    raise SystemExit('already patched')

def ik(anim):
    return A[anim]['bones']['ik-fist-back']


def remap(keys, f):
    """Apply f to every key value AND to its bezier handles: Spine 4.3 stores the
    handles' values absolutely ([t1, v1, t2, v2]), so changing only 'value'
    leaves each segment swinging back to the old pose between keys (a twitch)."""
    for k in keys:
        k['value'] = f(k.get('value', 0))
        c = k.get('curve')
        if isinstance(c, list):
            for i in range(1, len(c), 2):
                c[i] = f(c[i])

for anim in ('win_big', 'win_big_end'):
    remap(ik(anim)['translatex'], lambda v: v * NEW[0] / OLD[0])
    remap(ik(anim)['translatey'], lambda v: v * NEW[1] / OLD[1])
remap(ik('win_big_loop')['translatex'], lambda v: v + NEW[0] - OLD[0])
remap(ik('win_big_loop')['translatey'], lambda v: v + NEW[1] - OLD[1])

# seat the open hand on the cuff for exactly as long as it is drawn
A['win_big']['bones']['handB'] = {
    'translate': [{'time': 0, 'x': 0, 'y': 0, 'curve': 'stepped'}, {'time': 0.5, **SEAT}]}
A['win_big_loop']['bones']['handB'] = {'translate': [{'time': 0, **SEAT}]}
A['win_big_end']['bones']['handB'] = {
    'translate': [{'time': 0, **SEAT, 'curve': 'stepped'}, {'time': 0.7, 'x': 0, 'y': 0}]}
P.write_text(json.dumps(j, indent=2) + '\n')
print('open palm: reach', NEW, 'from', OLD, 'hand seated', SEAT)
