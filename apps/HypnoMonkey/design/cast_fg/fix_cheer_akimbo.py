"""FG cheer: the hand on the hip stays on the hip
(Stone 2026-11-03: 「fg 角色慶祝時手不要繞一圈很噁心」).

At rest the front hand is on the hip with the elbow out to the side. Any raise
overhead from there turns the forearm ~180 degrees about the elbow; whether by
IK (the 10-29 complaint) or keyed directly (fix_cheer_fk.py) or along a fist
path close to the chest, on screen it is the hand circling round. The cheer
now leaves that arm akimbo; the watch hand, the bounce and the laugh carry it.

In win_big / win_big_loop / win_big_end the arm keeps its rest bend relative
to the chest (IK off, both bones at their setup rotation), so it rides the
body's bounce without sliding over the hip.

  python3 design/cast_fg/fix_cheer_akimbo.py && python3 design/cast_fg/build_runtime.py
"""
import json
from pathlib import Path

RIG = Path(__file__).resolve().parent / 'cast_fg_spine/cast_fg.json'
j = json.loads(RIG.read_text())
for name in ('win_big', 'win_big_loop', 'win_big_end'):
    bones = j['animations'][name]['bones']
    bones['upperArmF'] = {'rotate': [{'value': 0}]}
    bones['foreArmF'] = {'rotate': [{'value': 0}]}
    bones.pop('ik-fist-front', None)
    j['animations'][name]['ik']['arm-front'] = [{'mix': 0, 'bendPositive': False}]
RIG.write_text(json.dumps(j, indent=2) + '\n')
print('FG cheer: front hand stays akimbo in win_big / loop / end')
