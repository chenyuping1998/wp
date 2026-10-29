"""Cheer arm fix (Stone 2026-10-29: no unnatural angles), applied to the compiled rig.

build_motion.mjs carries the same numbers (ik-fist-front 260,490 -> 240,560 inside the arm's reach; handF
55 -> 15). This patch reproduces them on cast_fg.json without re-running the
stand34 template: pose keys ease from 0 to the target, so they scale; the loop's
wave keys sit on a constant offset, so they shift.

  python3 design/cast_fg/fix_cheer_arm.py && python3 design/cast_fg/build_runtime.py
"""
import json
from pathlib import Path

P = Path(__file__).resolve().parent / 'cast_fg_spine/cast_fg.json'
j = json.loads(P.read_text())
A = j['animations']
OLD = {'x': 260, 'y': 490, 'w': 55}
NEW = {'x': 240, 'y': 560, 'w': 15}
if A['win_big']['bones']['handF']['rotate'][-1].get('value', 0) < 30:
    raise SystemExit('already patched')

def keys(anim, bone, channel):
    return A[anim]['bones'][bone][channel]


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
    remap(keys(anim, 'ik-fist-front', 'translatex'), lambda v: v * NEW['x'] / OLD['x'])
    remap(keys(anim, 'ik-fist-front', 'translatey'), lambda v: v * NEW['y'] / OLD['y'])
    remap(keys(anim, 'handF', 'rotate'), lambda v: v * NEW['w'] / OLD['w'])
remap(keys('win_big_loop', 'ik-fist-front', 'translatex'), lambda v: v + NEW['x'] - OLD['x'])
remap(keys('win_big_loop', 'ik-fist-front', 'translatey'), lambda v: v + NEW['y'] - OLD['y'])
remap(keys('win_big_loop', 'handF', 'rotate'), lambda v: v + NEW['w'] - OLD['w'])
P.write_text(json.dumps(j, indent=2) + '\n')
print('cheer arm: reach', NEW, 'from', OLD)
