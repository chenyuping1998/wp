"""Cheer arm fix (Stone 2026-10-29: no unnatural angles), applied to the compiled rig.

build_motion.mjs carries the same numbers (ik-fist-front 260,490 -> 300,650; handF
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
NEW = {'x': 300, 'y': 650, 'w': 15}
if A['win_big']['bones']['handF']['rotate'][-1].get('value', 0) < 30:
    raise SystemExit('already patched')

def keys(anim, bone, channel):
    return A[anim]['bones'][bone][channel]

for anim in ('win_big', 'win_big_end'):
    for k in keys(anim, 'ik-fist-front', 'translatex'): k['value'] = k.get('value', 0) * NEW['x'] / OLD['x']
    for k in keys(anim, 'ik-fist-front', 'translatey'): k['value'] = k.get('value', 0) * NEW['y'] / OLD['y']
    for k in keys(anim, 'handF', 'rotate'): k['value'] = k.get('value', 0) * NEW['w'] / OLD['w']
for k in keys('win_big_loop', 'ik-fist-front', 'translatex'): k['value'] = k.get('value', 0) + NEW['x'] - OLD['x']
for k in keys('win_big_loop', 'ik-fist-front', 'translatey'): k['value'] = k.get('value', 0) + NEW['y'] - OLD['y']
for k in keys('win_big_loop', 'handF', 'rotate'): k['value'] = k.get('value', 0) + NEW['w'] - OLD['w']
P.write_text(json.dumps(j, indent=2) + '\n')
print('cheer arm: reach', NEW, 'from', OLD)
