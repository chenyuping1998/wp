"""Trim a cast's trunk where its underlay runs down behind the arms.

The trunk was cut with an underlay painted under every piece above it. At rest
the arms cover it, so nobody sees it; the moment an arm swings out, the smear
is left standing beside the body as a second arm (user 2026-10-16:
「FG 人物的手在動時會有一邊有殘影」). Gate: the game-reskin skill's
scripts/check_cast_underlay.py.

Two casts, two ways to find the body's edge:

  fg  The chef hangs her arms BESIDE a thin body, and the cut copied the arm's
      own pixels into the trunk, so they match the drawing and cannot be told
      from body by colour. The body line is measured by hand (LEFT_EDGE /
      RIGHT_EDGE). Left: everything outside it goes (a sliver also stood proud
      of the arm at rest). Right: only under the arm, because the apron's knot
      tail hangs out past the line.
  mg  The boss's arms lie ON a round body. Trunk pixels that still match the
      original drawing are body; close them (12px disc) into a silhouette and
      drop the invented pixels outside it that sit under an arm. Light pixels
      (apron, knot) are never dropped.

Both keep a disc round each shoulder pivot so the joint never opens a hole as
the upper arm turns. Writes design/source/<cast>/torso_0_trunk.png (original
kept as torso_0_trunk.pre_trim.png) and patches the same rectangle in the spine
atlas page, so no repack is needed.

    /Applications/anaconda3/bin/python3 design/trim_trunk_smear.py fg|mg
"""
from pathlib import Path
import json
import shutil
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

APP = Path(__file__).resolve().parents[1]
ATLAS = {'fg': 'picklePepper', 'mg': 'pickleBoss'}

# fg body outline in canvas coords (560x912): x of the body's edge at a given y.
LEFT_EDGE = [(260, 200), (330, 225), (380, 232), (430, 245), (460, 212), (500, 203), (620, 197)]
RIGHT_EDGE = [(260, 372), (300, 355), (350, 352), (400, 352), (440, 360), (620, 370)]
FG_SHOULDER_KEEP = 42  # px
MG_SHOULDER_KEEP = 0.4  # x upper-arm length
MG_CLOSE = 12  # px


def edge_x(table, y):
    return np.interp(y, [p[0] for p in table], [p[1] for p in table])


def main(cast):
    src = APP / 'design/source' / cast
    layers = json.loads((src / 'layers.json').read_text())
    rig = json.loads((src / 'rig.json').read_text())
    W, H = layers['canvas']
    lay = {l['name']: l for l in layers['layers']}

    def footprint(prefix):
        m = np.zeros((H, W), bool)
        for n in (k for k in lay if k.startswith(prefix)):
            l = lay[n]
            a = np.array(Image.open(src / l['file']).convert('RGBA'))[:, :, 3] > 8
            m[l['y']:l['y'] + l['h'], l['x']:l['x'] + l['w']] |= a
        return ndimage.binary_dilation(m, iterations=3 if cast == 'fg' else 2)

    left, right = footprint('left_arm'), footprint('right_arm')
    t = lay['torso_0_trunk']
    orig = src / 'torso_0_trunk.pre_trim.png'
    if not orig.exists():
        shutil.copy2(src / 'torso_0_trunk.png', orig)
    trunk = np.array(Image.open(orig).convert('RGBA'))
    opaque = trunk[:, :, 3] > 0

    yy, xx = np.mgrid[0:t['h'], 0:t['w']]
    cy, cx = yy + t['y'], xx + t['x']
    sl, sr = rig['shoulderL'], rig['shoulderR']
    in_left, in_right = left[cy, cx], right[cy, cx]

    if cast == 'fg':
        near_l = np.hypot(cx - sl[0], cy - sl[1]) <= FG_SHOULDER_KEEP
        near_r = np.hypot(cx - sr[0], cy - sr[1]) <= FG_SHOULDER_KEEP
        drop = ((cx < edge_x(LEFT_EDGE, cy)) & ~near_l) | (in_right & (cx > edge_x(RIGHT_EDGE, cy)) & ~near_r)
    else:
        drawing = np.array(Image.open(APP / f'design/cast_delivery/{cast}_full_source.png').convert('RGBA')).astype(int)
        o = drawing[t['y']:t['y'] + t['h'], t['x']:t['x'] + t['w']]
        real = (trunk[:, :, 3] > 8) & (np.abs(trunk[:, :, :3].astype(int) - o[:, :, :3]).sum(2) < 30) & (o[:, :, 3] > 200)
        r = MG_CLOSE
        yk, xk = np.mgrid[-r:r + 1, -r:r + 1]
        disc = xk ** 2 + yk ** 2 <= r * r
        body = ndimage.binary_fill_holes(ndimage.binary_closing(np.pad(real, r), structure=disc)[r:-r, r:-r])
        light = trunk[:, :, :3].astype(int).sum(2) > 450

        def near(side):
            sh, el = rig[f'shoulder{side}'], rig[f'elbow{side}']
            keep = MG_SHOULDER_KEEP * np.hypot(el[0] - sh[0], el[1] - sh[1])
            return np.hypot(cx - sh[0], cy - sh[1]) <= keep

        drop = ~real & ~body & ~light & ((in_left & ~near('L')) | (in_right & ~near('R')))
    drop &= opaque

    # soften the new edge by one pixel so it does not read as a hard cut
    keep_alpha = np.where(drop, 0, trunk[:, :, 3]).astype(float)
    edge = ndimage.binary_dilation(drop, iterations=1) & ~drop & opaque
    keep_alpha[edge] *= 0.6
    out = trunk.copy()
    out[:, :, 3] = keep_alpha.astype(np.uint8)
    out[drop] = 0
    Image.fromarray(out).save(src / 'torso_0_trunk.png')
    print(f'{cast} trunk: dropped {int(drop.sum())} px of {int(opaque.sum())}')

    atlas_dir = APP / 'static/assets/spines' / ATLAS[cast]
    atlas = (atlas_dir / 'cast.atlas').read_text().splitlines()
    i = atlas.index('torso_0_trunk')
    bx, by, bw, bh = map(int, atlas[i + 1].split(':')[1].split(','))
    assert (bw, bh) == (t['w'], t['h']), (bw, bh)
    page = Image.open(atlas_dir / 'cast.png').convert('RGBA')
    page.paste(Image.fromarray(out), (bx, by))
    page.save(atlas_dir / 'cast.png')
    print(f'{cast} atlas: patched torso_0_trunk at {bx},{by}')


if __name__ == '__main__':
    if len(sys.argv) != 2 or sys.argv[1] not in ATLAS:
        sys.exit(__doc__)
    main(sys.argv[1])
