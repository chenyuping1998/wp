#!/usr/bin/env python3
"""Find trunk underlay that will show as a ghost arm when the cast moves.

A cast cut from one full-body drawing has nothing behind its arms, so the cut
paints an underlay onto the trunk where the arms were. If that underlay follows
the arm all the way down, the arm swings out and leaves a smeared second arm
standing beside the body (Pickle Panic FG, user 2026-10-16:
「FG 人物的手在動時會有一邊有殘影」). At rest the arm covers it exactly, so
nobody sees it in a still or in the idle loop.

The test: trunk pixels inside an arm's REST footprint that sit further from the
shoulder pivot than the joint needs. Some underlay round the shoulder is right
(the joint opens as the upper arm turns); underlay past the elbow is the ghost.

    python3 check_cast_underlay.py <layers dir> [<layers dir> ...] [--out overlay_dir]

<layers dir> holds layers.json ({canvas:[w,h], layers:[{name,file,x,y,w,h,z}]})
and rig.json (shoulderL/R, elbowL/R) — the format the #7 own-rig cut writes
(design/source/<cast>/ in Pickle Panic / Sushi Monkey / Go Banandit).

FAIL: trunk underlay sits behind more than 10% of an arm's footprint below the
      elbow (Pickle FG before the fix: 41%).
WARN: more than 1% — thin slivers at the body edge; render the arm-swing
      motions and look before deciding (Pickle MG: 4-7%, not visible).
Writes <out>/<cast>_underlay.png with the offending pixels in red over the
trunk, for a human to look at before trimming. Then render the arm-swing
motions in the game and look: this measures the cause, not the picture.
"""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


def footprint(src, lay, names, shape):
    m = np.zeros(shape, bool)
    for n in names:
        l = lay.get(n)
        if not l:
            continue
        a = np.array(Image.open(src / l['file']).convert('RGBA'))[:, :, 3] > 8
        m[l['y']:l['y'] + l['h'], l['x']:l['x'] + l['w']] |= a
    return ndimage.binary_dilation(m, iterations=2)


def check(src: Path, out: Path | None):
    layers = json.loads((src / 'layers.json').read_text())
    rig = json.loads((src / 'rig.json').read_text())
    W, H = layers['canvas']
    lay = {l['name']: l for l in layers['layers']}
    trunk_name = next((n for n in lay if 'trunk' in n or n.startswith('torso_0')), None)
    if not trunk_name:
        return 'SKIP', [f'{src}: no trunk layer']
    t = lay[trunk_name]
    trunk = np.zeros((H, W), bool)
    ta = np.array(Image.open(src / t['file']).convert('RGBA'))[:, :, 3] > 8
    trunk[t['y']:t['y'] + t['h'], t['x']:t['x'] + t['w']] = ta

    verdict, lines = 'PASS', []
    ghost_all = np.zeros((H, W), bool)
    yy, xx = np.mgrid[0:H, 0:W]
    for side, prefix in (('L', 'left_arm'), ('R', 'right_arm')):
        arms = [n for n in lay if n.startswith(prefix)]
        sh, el = rig.get(f'shoulder{side}'), rig.get(f'elbow{side}')
        if not arms or not sh or not el:
            lines.append(f'  {side}: no arm layers or no shoulder/elbow in rig.json — skipped')
            continue
        upper = float(np.hypot(el[0] - sh[0], el[1] - sh[1]))
        keep = 0.35 * upper  # what the turning joint needs
        foot = footprint(src, lay, arms, (H, W))
        d = np.hypot(xx - sh[0], yy - sh[1])
        hidden = trunk & foot & (d > keep)
        ghost_all |= hidden
        # The share of the arm's own footprint BELOW the elbow that has trunk
        # underlay behind it. Underlay near the shoulder is the joint doing its
        # job; below the elbow it is a painted second forearm. Calibrated
        # 2026-10-16: Pickle FG before the trim 41% (the reported ghost), after 0%;
        # Pickle MG 4-7% (thin slivers at the body edge, not visible in motion;
        # 4% after its trim — the rest is real body under arms that lie on it).
        below = foot & (d > upper)
        share = float((hidden & below).sum()) / max(1, int(below.sum()))
        v = 'FAIL' if share > 0.10 else 'WARN' if share > 0.01 else 'PASS'
        lines.append(f'  {side}: underlay behind {share:.1%} of the arm below the elbow ({int(hidden.sum())} px hidden past the joint)  {v}')
        if v == 'FAIL' or (v == 'WARN' and verdict == 'PASS'):
            verdict = v
    if out is not None:
        out.mkdir(parents=True, exist_ok=True)
        img = Image.new('RGBA', (W, H), (40, 44, 52, 255))
        tl = Image.open(src / t['file']).convert('RGBA')
        img.alpha_composite(tl, (t['x'], t['y']))
        a = np.array(img)
        a[ghost_all] = (a[ghost_all] * 0.3 + np.array([255, 0, 0, 255]) * 0.7).astype(np.uint8)
        tag = '_'.join(src.resolve().parts[-4:])  # app/design/source/<cast> — cast names repeat across games
        p = out / f'{tag}_underlay.png'
        Image.fromarray(a).save(p)
        lines.append(f'  overlay: {p}')
    return verdict, lines


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('dirs', nargs='+', type=Path)
    ap.add_argument('--out', type=Path)
    args = ap.parse_args()
    worst = 'PASS'
    rank = {'PASS': 0, 'SKIP': 0, 'WARN': 1, 'FAIL': 2}
    for d in args.dirs:
        v, lines = check(d, args.out)
        print(f'{d}: {v}')
        print('\n'.join(lines))
        if rank[v] > rank[worst]:
            worst = v
    sys.exit(1 if worst == 'FAIL' else 0)


if __name__ == '__main__':
    main()
