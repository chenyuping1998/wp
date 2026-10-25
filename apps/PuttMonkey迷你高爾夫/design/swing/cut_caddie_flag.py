"""Cut the caddie's flag hand off his drawing (2026-10-23): the fist with the
whole flagpole, and the pennant, as pieces over his mesh.

Only the hand comes off, not the arm. His arm is held out from the body, so the
mesh (wp/tools/build_cast_mesh.py) already bends it a little without a seam;
cutting it would trade that for joints that show (the golfer's arms needed
three kinds of edge repair before they stopped tearing). The wrist is the one
joint: the forearm keeps a round end of the drawing under the fist, so turning
the hand never opens a gap there.

Writes design/source/putt/cast/fg/swing/ in the same layout as the golfer's
(cut_golfer_arms.py): parts/, cels/, cut.json — with a `rig` block, because
these pieces hang on the mesh's own forearm instead of on IK arms.

    python -I design/swing/cut_caddie_flag.py
"""
import json
import math
from pathlib import Path

import sys

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))  # -I leaves the script's folder off the path
from cut_golfer_arms import H, INK, W, dilate, disc, erode, flood, load, poly_mask

HERE = Path(__file__).resolve().parent
FG = HERE.parent / 'source/putt/cast/fg'
OUT = FG / 'swing'

J = {
    'wrist': (102, 494),     # where the fist meets the forearm's fur
    'poleTop': (52, 300), 'poleLow': (70, 560),
    'pennantRoot': (66, 372), 'pennantTip': (160, 370),
}
WRIST_CAP = 24

HAND = [(22, 284), (82, 284), (82, 446), (106, 452), (106, 534), (84, 540), (84, 578), (22, 578)]
PENNANT = [(64, 316), (176, 364), (176, 376), (64, 432)]


def main():
    (OUT / 'parts').mkdir(parents=True, exist_ok=True)
    (OUT / 'cels').mkdir(exist_ok=True)
    N = load(FG / 'normalized.png')
    A = N[..., 3] > 8
    pen = poly_mask(PENNANT) & A
    hand = poly_mask(HAND) & A & ~pen

    def piece(m, inked_against):
        """the piece, inked wherever it was cut out of something opaque"""
        m = ~flood(~m, [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)])
        img = N.copy()
        ring = dilate(m, 1) & ~m & A & inked_against
        band = m & dilate(ring, 3)
        img[band, :3] = INK
        img[..., 3] = np.where(m, np.where(band, 255, N[..., 3]), 0)
        return img

    # the pennant's root edge goes under the pole (drawn behind it): no ink
    # there; the fist is inked where it was cut off the forearm, the forearm
    # end is hidden under it at rest
    pieces = {'pennant': piece(pen, ~hand), 'handL': piece(hand, ~pen & ~disc(J['wrist'], 40))}
    boxes = {}
    for name, img in pieces.items():
        ys, xs = np.nonzero(img[..., 3] > 4)
        x0, y0, x1, y1 = max(0, xs.min() - 2), max(0, ys.min() - 2), min(W, xs.max() + 3), min(H, ys.max() + 3)
        Image.fromarray(img[y0:y1, x0:x1].round().clip(0, 255).astype(np.uint8)).save(OUT / 'parts' / f'{name}.png')
        boxes[name] = [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]

    # the body loses the flag and the fist, but keeps a round end of the
    # drawing at the wrist for the forearm to end in under the fist
    gone = (hand | pen) & ~disc(J['wrist'], WRIST_CAP)
    for p in sorted((FG / 'registered').glob('*.png')):
        cel = load(p)
        cel[..., 3] = np.where(gone, 0, cel[..., 3])
        Image.fromarray(cel.round().clip(0, 255).astype(np.uint8)).save(OUT / 'cels' / p.name)

    def ang(a, b):
        return math.degrees(math.atan2(-(b[1] - a[1]), b[0] - a[0]))

    meta = {
        '_note': "design/swing/cut_caddie_flag.py, 2026-10-23: the caddie's flag hand and pennant as pieces on his mesh forearm.",
        'joints': J, 'boxes': boxes,
        'order': ['pennant', 'handL'],
        'ik_arms': [],
        'rig': {'bones': [
            # the hand turns at the wrist; its axis runs up the pole
            {'name': 'handL', 'parent': 'foreL', 'at': J['wrist'], 'angle': ang(J['poleLow'], J['poleTop']), 'length': 60},
            {'name': 'pennant', 'parent': 'handL', 'at': J['pennantRoot'], 'angle': ang(J['pennantRoot'], J['pennantTip']),
             'length': round(math.dist(J['pennantRoot'], J['pennantTip']), 2)},
        ]},
    }
    (OUT / 'cut.json').write_text(json.dumps(meta, indent=1))
    print('parts', boxes)


if __name__ == '__main__':
    main()
