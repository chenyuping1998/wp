"""Replace the cast's idle with a 2.0 s breathing loop (review 2026-10-22, 5.7/9).

The old idle (generate_pickle_spine.mjs) ran 5.4 s and moved the HIP 4 units -
the legs hang off the hip, so the feet bobbed with it - while everything above
barely moved. Measured against Xposed's Iron Jaw (3 stars,
wp/.claude/skills/game-reskin/references/iron-jaw-transcript.md):

  * one 2.00 s loop, shared with the board's resting breath (idleLife.svelte.ts)
  * the legs and hip carry no keys, so the feet stay planted on the floor line
  * the TORSO breathes: bob +-3.5 units (~0.8% of the 862-unit figure) with a
    small squash/stretch
  * every link further from the body arrives later - head 0.067 s, shoulders
    0.133 s, forearms 0.2 s (Iron Jaw's per-segment lag) - so the motion runs
    up the body instead of everything pulsing together
  * forearms hang: they counter-rotate at 70% of the shoulder (the rule in
    generate_pickle_spine.mjs), so the arms never stiffen into planks

Run AFTER generate_pickle_spine.mjs and Codex's clip appends; it only touches
animations.idle, and keeps a copy of the previous file next to this script.

  /Applications/anaconda3/bin/python3 design/upgrade_cast_idle.py
"""
import json
import math
import os
import shutil

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CASTS = ['pickleBoss', 'picklePepper']
LOOP = 2.0
STEP = 1 / 15
LAG_HEAD, LAG_ARM, LAG_FORE = 0.067, 0.133, 0.2
BOB = 3.5


def wave(t, lag=0.0, phase=0.0):
    return math.sin(2 * math.pi * (t - lag) / LOOP + phase)


def times():
    n = round(LOOP / STEP)
    return [round(i * LOOP / n, 4) for i in range(n + 1)]


def build_idle():
    T = times()
    def rot(fn):
        return [{'time': t, 'value': round(fn(t), 3)} for t in T]

    def tr(fy, fx=lambda t: 0.0):
        return [{'time': t, 'x': round(fx(t), 3), 'y': round(fy(t), 3)} for t in T]

    def sc(fx, fy):
        return [{'time': t, 'x': round(fx(t), 4), 'y': round(fy(t), 4)} for t in T]

    shoulder = 1.8
    return {
        'bones': {
            'torso': {
                'translate': tr(lambda t: BOB * wave(t)),
                'scale': sc(lambda t: 1 - 0.006 * wave(t), lambda t: 1 + 0.012 * wave(t)),
                'rotate': rot(lambda t: 0.5 * wave(t, phase=0.9)),
            },
            'head': {
                'translate': tr(lambda t: 2.5 * wave(t, LAG_HEAD)),
                'rotate': rot(lambda t: 1.2 * wave(t, LAG_ARM, 0.6)),
            },
            'armL': {'rotate': rot(lambda t: -shoulder * wave(t, LAG_ARM))},
            'armR': {'rotate': rot(lambda t: shoulder * wave(t, LAG_ARM))},
            'armL_fore': {'rotate': rot(lambda t: 0.7 * shoulder * wave(t, LAG_FORE))},
            'armR_fore': {'rotate': rot(lambda t: -0.7 * shoulder * wave(t, LAG_FORE))},
        }
    }


def main():
    idle = build_idle()
    for cast in CASTS:
        p = os.path.join(APP, 'static/assets/spines', cast, 'cast.json')
        backup = os.path.join(APP, 'design', f'{cast}_cast.pre_idle2s.json')
        if not os.path.exists(backup):
            shutil.copy2(p, backup)
        d = json.load(open(p))
        names = {b['name'] for b in d['bones']}
        missing = [b for b in idle['bones'] if b not in names]
        assert not missing, (cast, missing)
        d['animations']['idle'] = idle
        json.dump(d, open(p, 'w'), separators=(',', ':'))
        print(cast, 'idle ->', LOOP, 's,', len(idle['bones']), 'bones keyed')


if __name__ == '__main__':
    main()
