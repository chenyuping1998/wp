"""Cheer arm as a plain raise (Stone 2026-10-29: 「手直接轉一圈 頂多舉高就好」).

The cheer clips moved the raised arm by its IK target. On the way from the
hand-on-hip rest to overhead the two-bone solution flips the elbow, so the
forearm swung ~200 degrees, a windmill. In win_big / win_big_loop / win_big_end
the raised arm's IK is now switched off (mix 0) and the upper arm and forearm
are keyed directly, the short way: the upper arm lifts, the elbow straightens,
nothing turns past the target.

Values are local rotations relative to each bone's setup rotation, measured
from the rest pose (idle) and the raised pose the IK used to reach. The elbow
leads: on the way up the upper arm lifts first and the forearm only extends in
the last part of the rise; on the way down the elbow bends first. Moving both
together swung the hand through a low arc past the hip.

  python3 design/cast_fg/fix_cheer_fk.py && python3 design/cast_fg/build_runtime.py \
    && python3 design/cast_mg/build_runtime.py
"""
import json
import math
from pathlib import Path

APP = Path(__file__).resolve().parents[2]
RIGS = {
    # FG assistant: front arm, rest -136/-96 -> raised -35/-10 (setup -137/-96)
    APP / 'design/cast_fg/cast_fg_spine/cast_fg.json': dict(
        ik='arm-front', upper='upperArmF', fore='foreArmF', raised=(102, 86),
        rise=(0.26, 0.65), lower=(0.4, 1.25)),
    # MG hypnotist: open-palm back arm, rest 122/111 -> raised 27/30 (setup 123/110)
    APP / 'design/cast_mg/cast_mg_spine/cast_mg.json': dict(
        ik='arm-back', upper='upperArmB', fore='foreArmB', raised=(-96, -80),
        rise=(0.47, 0.8), lower=(0.2, 0.8)),
}
STEP = 1 / 30


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def ramp(t0, t1, a, b, hold_from=0.0, hold_to=None):
    """Keys holding a until t0, easing to b by t1, holding b to hold_to."""
    keys = []
    if t0 > hold_from:
        keys.append((hold_from, a))
    n = max(2, round((t1 - t0) / STEP))
    for i in range(n + 1):
        t = t0 + (t1 - t0) * i / n
        keys.append((round(t, 4), a + (b - a) * smooth(i / n)))
    if hold_to and hold_to > t1:
        keys.append((hold_to, b))
    return keys


def sway(duration, base, amp, phase=0.0):
    n = round(duration / STEP)
    return [(round(duration * i / n, 4), base + amp * math.sin(2 * math.pi * i / n + phase)) for i in range(n + 1)]


def timeline(keys):
    return [{'time': t, 'value': round(v, 3)} if t else {'value': round(v, 3)} for t, v in keys]


for path, r in RIGS.items():
    j = json.loads(path.read_text())
    A = j['animations']
    up, fo = r['raised']
    dur = {name: max((k.get('time', 0) for b in A[name].get('bones', {}).values() for ch in b.values() for k in ch), default=1)
           for name in ('win_big', 'win_big_loop', 'win_big_end')}
    r0, r1 = r['rise']
    l0, l1 = r['lower']
    late = r0 + (r1 - r0) * 0.55   # forearm extends once the elbow is up
    early = l0 + (l1 - l0) * 0.5   # forearm folds before the upper arm drops
    clips = {
        'win_big': (ramp(r0, r1, 0, up, hold_to=dur['win_big']), ramp(late, r1 + 0.05, 0, fo, hold_to=dur['win_big'])),
        'win_big_loop': (sway(dur['win_big_loop'], up, 4), sway(dur['win_big_loop'], fo, 6)),
        'win_big_end': (ramp(l0, l1, up, 0, hold_to=dur['win_big_end']), ramp(l0 - 0.1 if l0 > 0.1 else 0.0, early, fo, 0, hold_to=dur['win_big_end'])),
    }
    for name, (upper, fore) in clips.items():
        bones = A[name].setdefault('bones', {})
        bones[r['upper']] = {'rotate': timeline(upper)}
        bones[r['fore']] = {'rotate': timeline(fore)}
        # keep the constraint's own bend direction: the key's default (positive)
        # flipped the elbow for one crossfade when it differed from the rig's
        bend = next(c.get('bendPositive', True) for c in j['constraints'] if c['name'] == r['ik'])
        A[name].setdefault('ik', {})[r['ik']] = [{'mix': 0, 'bendPositive': bend}]
    path.write_text(json.dumps(j, indent=2) + '\n')
    print(path.name, 'raised arm keyed directly, IK off in the cheer clips:', r['upper'], r['fore'], r['raised'])
