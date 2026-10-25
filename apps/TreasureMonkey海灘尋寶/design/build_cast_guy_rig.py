"""
The Don's mesh rig, with arm bones that are actually ON his arms.

    python3 design/build_cast_guy_rig.py [--report] [--overlay out.png] [--dry-run]

WHY THIS EXISTS

`rig/build.py` from hacksaw-character-motion builds the spine by construction and
then finds the arms automatically (`skin.find_arms`): row by row, the leftmost
and rightmost runs of silhouette that have come away from the body, keeping the
TOPMOST such segment so the scan does not follow an arm down into a leg.

On the v3 drawing that heuristic picked the wrong thing on both sides, and the
review that caught it was 「人物整個像紙片一樣軟軟的」:

    find_arms['l']  rows 241..246, 6 rows, centre x 226, half-width 70
                    -> the shoulder/lapel block, the instant the head's outline
                       comes away from the collar. The real arm is rows
                       342..556, centre x 155 -> 104, half-width 19.5.
    find_arms['r']  rows 241..321, centre x 399..412, half-width 1..12
                    -> the CIGAR SMOKE. The real arm is folded: the upper arm
                       runs down the torso's side, bends at y~405, and the
                       forearm comes back UP to the fist. A folded arm is not a
                       function of y, so no row scan can ever trace it.

The weights that came out of that, measured on inked vertices only:

    hanging arm, upper   chest .30  neck .30  waist .18  head .17   arm_l  0
    hanging arm, fore    chest .31  waist .27  neck .21  hips .13   fore_l 0
    cigar arm, fore      neck .28   chest .28  head .17  waist .16  fore_r .07
    scarf, left strand   ...                                         arm_l .09

The arms were welded to the spine. Every reaction table ever written for this
figure was moving the scarf and the chest while both arms rode along as dead
weight — and rotating `arm_l` 0 -> 12 degrees visibly swung the scarf and left
the hand where it was.

WHAT THIS DOES INSTEAD

The spine is still `skin.build_rig`, untouched — the reference pipeline builds it
and nothing about it was wrong. The arms are given as MEASURED JOINT POLYLINES
(shoulder, elbow, wrist, fingertip), read off the silhouette's own run data
rather than eyeballed, and claimed by DISTANCE TO THE POLYLINE instead of by a
per-row centre line. That generalises `skin.add_arm_bones` — same feathered
claim, same fade-in below the shoulder so the shoulder stays part of the body,
same upper/fore split at the elbow — to an arm that points in any direction,
including one that folds back on itself.

Each forearm also carries an explicit `axis` (elbow -> wrist). `bone_axes`
derives a leaf's axis from parent -> self, which is right for an arm hanging
straight and wrong for the cigar arm, whose forearm points ~130 degrees away
from its upper arm: squash and stretch along the derived axis would lengthen
the forearm in the direction of the upper arm. castMotion.ts `boneAxes` prefers
`axis` when it is present and derives it exactly as before when it is not.

Bone count, names, order and the grid are unchanged (10 bones, 16x40), so
nothing that indexes the rig moves.
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RIG_DIR = ROOT / 'static/assets/meshRigs/cast_guy'
SKILL = Path.home() / '.claude/skills/hacksaw-character-motion/rig'
sys.path.insert(0, str(SKILL))
import skin  # noqa: E402

# ── measured joints, texture px on the 512x1024 v3 sheet ────────────────────
#
# Every point below is read off `skin._row_runs` for the shipped guy.png:
#
#   HANGING ARM (viewer-left, arm_l / fore_l)
#     outer edge 160 @ y240 -> 129 @ y350, where it separates as [129-176];
#     separate segment rows 342..556, centre 155 -> 104, half-width 19.5.
#     Shoulder is the edge + half the sleeve width at the top of the arm.
#
#   CIGAR ARM (viewer-right, arm_r / fore_r)
#     upper arm is the torso's own right edge, 307 @ y250 -> 348 @ y350;
#     the elbow is the one row where the sleeve comes loose underneath,
#     y410 [337-358]; the forearm's outer edge runs 388 @ y400 -> 403 @ y360;
#     the wrist separates at y350 [371-407]; the fist is y330..340 around x395.
#     Rows 250..310 at x396..415 are the smoke, and are NOT the arm.
#
# RADIUS IS PER SEGMENT (shoulder->elbow, elbow->wrist, wrist->tip). The cigar
# arm needs it: in this pose its upper arm is mostly hidden behind the scarf's
# right strand, so only ~23px of sleeve shows, while the fist holding the cigar
# is ~35px across. One radius cannot serve both. Swept on the shipped sheet:
#
#     uniform r   scarf verts claimed   fist owned by fore_r
#        20           3 (max 0.99)             1.00     <- drags the scarf
#        14           0 (max 0.06)             0.62     <- loses the fist
#     13 / 18 / 20    see --report                        <- shipped
#
# The hanging arm has daylight all round it and takes one radius end to end.
#
# SMOOTH is passes of lattice averaging on the arm's weights (see
# smooth_on_grid). Swept against check_cast_motion rule 10 with the reference
# trigger verbatim, reading how much of each arm still belongs to its own bones:
#
#   self  passes   idle    trigger          arm cores (hang up/fore, cigar up/fist)
#    -      0      56.9%    0.0%  20 flips  1.00 1.00 0.70 1.00   <- weight cliff
#    2      1      72.7%   71.4%  0 flips   0.79 0.82 0.51 0.66   <- shipped
#    2      2      81.6%   80.7%  0 flips   0.67 0.70 0.42 0.53
#    4      1      68.8%   53.6%  0 flips   0.85 0.86 0.55 0.74   <- margin too thin
#    8      3      76.7%   69.2%  0 flips   0.75 0.77 0.48 0.63
#
# It is a real trade and it cannot be escaped on this grid: a cell is 32px and
# each arm is 40-50px wide, so an arm is ONE OR TWO lattice columns. There is no
# interior to keep rigid while the rim softens — every arm vertex is a rim
# vertex, and shear is weight-difference times rotation. The shipped setting
# leaves the trigger 21 points of fold margin, which is what absorbs the flutter
# and the trigger landing on any idle phase, while keeping the arms mostly their
# own. The cigar arm's upper arm is the weak one at 0.51, and that is the drawing:
# in this pose it is almost entirely behind the scarf, ~23px of sleeve showing.
ARMS = {
    'l': dict(joints=[(178, 245), (133, 400), (112, 480), (100, 556)], radius=[22.0, 22.0, 22.0],
              reach_up=0.10, feather=0.55, elbow_blend=0.45, smooth=1),
    'r': dict(joints=[(305, 250), (347, 405), (389, 358), (397, 330)], radius=[13.0, 18.0, 20.0],
              reach_up=0.10, feather=0.55, elbow_blend=0.45, smooth=1),
}
# same constants as skin.add_arm_bones, so the claim behaves the same way
REACH_UP = 0.10
FEATHER = 0.55
SELF_WEIGHT = 2.0

# Where the arms are — shared with check_cast_motion.mjs rule 11, so the gate
# and this script cannot disagree about what "on the arm" means.
_REGIONS = json.loads((Path(__file__).resolve().parent / 'cast_guy_arm_regions.json').read_text())
REGIONS = [(r['label'], r['side'], [tuple(p) for p in r['poly']]) for r in _REGIONS['arms']]
SPILL = [(r['label'], r['side'], [tuple(p) for p in r['poly']]) for r in _REGIONS['spill']]
# An arm whose own bones own less than this of it is welded to the spine again.
OWN_FLOOR = _REGIONS['own_floor']


def smoothstep(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def polyline_distance(points, joints):
    """Distance from every point to a polyline, the arc length along it of the
    nearest point on it, and which segment that nearest point lies on."""
    joints = np.asarray(joints, float)
    best_d = np.full(len(points), np.inf)
    best_s = np.zeros(len(points))
    best_seg = np.zeros(len(points), int)
    walked = 0.0
    for seg, (a, b) in enumerate(zip(joints[:-1], joints[1:])):
        ab = b - a
        length = float(np.hypot(*ab))
        t = np.clip(((points - a) @ ab) / max(length * length, 1e-9), 0.0, 1.0)
        nearest = a + t[:, None] * ab
        d = np.hypot(*(points - nearest).T)
        closer = d < best_d
        best_d[closer] = d[closer]
        best_s[closer] = walked + t[closer] * length
        best_seg[closer] = seg
        walked += length
    return best_d, best_s, best_seg


def smooth_on_grid(values, cols, rows, iterations):
    """Diffuse a per-vertex field across the mesh lattice.

    The claim that hands a vertex to an arm bone fades out over `r * feather`
    pixels — 12px at r=22 — and a grid cell is 32 x 25.6px. The whole fade lands
    BETWEEN two vertices, so no vertex ever samples it: one vertex is 100% arm,
    its neighbour is 0% arm, and the triangle between them is sheared by the
    full difference. Every one of the worst triangles measured on this rig had
    exactly that signature (fore_l.100 | fore_l.100 | waist.30+chest.29).

    Each pass is a weighted plain average on the (rows+1) x (cols+1) lattice: a
    vertex counted twice (SELF_WEIGHT) plus its four neighbours, over 6, with the
    border padded by edge values. The transition spreads outward across whole
    cells, and the arm's core softens along with the rim — it does NOT keep full
    ownership. That is the trade in the SMOOTH sweep above; OWN_FLOOR, checked by
    --report here and by check_cast_motion.mjs rule 11, is what stops it going
    far enough to weld an arm back to the torso.
    """
    if iterations <= 0:
        return values
    g = values.reshape(rows + 1, cols + 1).copy()
    for _ in range(iterations):
        p = np.pad(g, 1, mode='edge')
        g = (SELF_WEIGHT * p[1:-1, 1:-1] + p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:]) / (SELF_WEIGHT + 4.0)
    return g.reshape(-1)


def arc_lengths(joints):
    joints = np.asarray(joints, float)
    return np.concatenate([[0.0], np.cumsum(np.hypot(*np.diff(joints, axis=0).T))])


def build(arms=None):
    global ARMS
    if arms is not None:
        ARMS = arms
    img = Image.open(RIG_DIR / 'guy.png').convert('RGBA')
    rig = skin.build_rig(img, cols=16, rows=40)
    mask = skin.silhouette(img)
    x0, y0, x1, y1 = rig['figure_box']
    FH = y1 - y0
    verts = np.asarray(rig['verts'], float)
    W = np.asarray(rig['weights'], float)
    names = [b['name'] for b in rig['bones']]
    chest = names.index('chest')

    for side in ('l', 'r'):
        spec = ARMS[side]
        joints = spec['joints']
        radii = np.asarray(spec['radius'], float)
        s_at = arc_lengths(joints)
        s_elbow, s_tip = s_at[1], s_at[-1]
        (sx, sy), (ex, ey), (wx, wy) = joints[0], joints[1], joints[2]

        i_arm = len(rig['bones'])
        rig['bones'].append({'name': 'arm_%s' % side, 'x': float(sx), 'y': float(sy),
                             'parent': chest})
        fore_axis = np.array([wx - ex, wy - ey], float)
        fore_axis /= np.linalg.norm(fore_axis)
        rig['bones'].append({'name': 'fore_%s' % side, 'x': float(ex), 'y': float(ey),
                             'parent': i_arm, 'axis': [float(fore_axis[0]), float(fore_axis[1])]})

        d, s, seg = polyline_distance(verts, joints)
        r = radii[seg]
        feather = spec.get('feather', FEATHER)
        reach_up = spec.get('reach_up', REACH_UP)
        near = smoothstep((r * (1 + feather) - d) / np.maximum(r * feather, 1.0))
        below = smoothstep(s / max(1.0, FH * reach_up))
        above = smoothstep((s_tip + FH * .03 - s) / max(1.0, FH * .03))
        claim = np.clip(near * below * above, 0, 1)

        t = smoothstep((s - s_elbow) / max(1.0, s_elbow * spec.get('elbow_blend', .45)))
        cols, rows = rig['grid']
        passes = spec.get('smooth', 0)
        upper = smooth_on_grid(claim * (1 - t), cols, rows, passes)
        fore = smooth_on_grid(claim * t, cols, rows, passes)
        # growing both fields can overlap past 1 at the elbow; share it out
        total = upper + fore
        over = total > 1
        upper[over] /= total[over]
        fore[over] /= total[over]
        claim = np.clip(upper + fore, 0, 1)[:, None]
        arm_w = np.zeros((len(verts), len(rig['bones'])))
        arm_w[:, i_arm] = upper
        arm_w[:, i_arm + 1] = fore
        W = np.hstack([W, np.zeros((len(verts), 2))])
        W = W * (1 - claim) + arm_w
        W = np.clip(W, 0, None)
        W /= W.sum(1, keepdims=True)

    # the order every consumer expects: spine first, then arm_l, fore_l, arm_r, fore_r
    rig['weights'] = W.tolist()
    rig['image'] = 'guy.png'
    return rig, img, mask


def _inside(poly, V):
    """Which vertices lie inside a polygon, edges included — the exact test
    check_cast_motion.mjs rule 11 uses, on the exact vertex coordinates, so the
    two count the same vertices."""
    def one(x, y):
        n = len(poly)
        for i in range(n):
            ax, ay = poly[i - 1]
            bx, by = poly[i]
            cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax)
            dot = (x - ax) * (bx - ax) + (y - ay) * (by - ay)
            if abs(cross) < 1e-6 and 0 <= dot <= (bx - ax) ** 2 + (by - ay) ** 2:
                return True
        hit = False
        for i in range(n):
            xj, yj = poly[i - 1]
            xi, yi = poly[i]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                hit = not hit
        return hit
    return np.array([one(x, y) for x, y in V])


def ownership(rig, img):
    """Mean weight of each arm's own two bones over the inked vertices of that arm,
    and over the scarf beside it. Returns rows and whether every arm clears
    OWN_FLOOR."""
    # Ink is read the way the renderer and check_cast_motion.mjs read it: the
    # texture's alpha sampled at the vertex's UV, rounded, so both count the same
    # vertices. guy.png is the rig's own 512x1024, so UV x size is the vertex.
    tex = np.asarray(img)[..., 3]
    th, tw = tex.shape
    V = np.asarray(rig['verts'])
    Wt = np.asarray(rig['weights'])
    names = [b['name'] for b in rig['bones']]
    size = tuple(rig['size'])

    def alpha_at(x, y):
        px = min(tw - 1, max(0, int(np.floor(x * tw / size[0] + 0.5))))
        py = min(th - 1, max(0, int(np.floor(y * th / size[1] + 0.5))))
        return tex[py, px]
    ink = np.array([alpha_at(x, y) > 8 for x, y in V])
    rows, ok = [], True
    for kind, regions in (('arm', REGIONS), ('spill', SPILL)):
        for label, side, poly in regions:
            m = _inside(poly, V) & ink
            own = Wt[m][:, [names.index('arm_' + side), names.index('fore_' + side)]].sum(1).mean() if m.any() else float('nan')
            avg = Wt[m].mean(0) if m.any() else np.zeros(len(names))
            top = np.argsort(-avg)[:3]
            rows.append((kind, label, int(m.sum()), own, [(names[i], avg[i]) for i in top]))
            if kind == 'arm' and not own >= OWN_FLOOR:
                ok = False
    return rows, ok


def report(rig, img):
    print('bones:')
    for b in rig['bones']:
        extra = f"  axis ({b['axis'][0]:+.2f},{b['axis'][1]:+.2f})" if 'axis' in b else ''
        print(f"  {b['name']:7s} ({b['x']:6.1f},{b['y']:6.1f}){extra}")
    rows, ok = ownership(rig, img)
    print('\nwho owns the arms (inked vertices, mean weight of the arm\'s own two bones, top 3):')
    for kind, label, n, own, top in rows:
        tag = 'arm  ' if kind == 'arm' else 'spill'
        print(f'  {tag} {label:26s} n={n:2d}  own {own:.2f}   ' + '  '.join(f'{nm} {w:.2f}' for nm, w in top))
    print(f"\narms {'all own' if ok else 'DO NOT all own'} at least {OWN_FLOOR} of themselves")
    return ok


def overlay(rig, img, path):
    V = np.asarray(rig['verts'])
    W = np.asarray(rig['weights'])
    names = [b['name'] for b in rig['bones']]
    colours = {'arm_l': (255, 90, 90), 'fore_l': (255, 190, 60),
               'arm_r': (90, 170, 255), 'fore_r': (120, 255, 200)}
    bg = Image.new('RGBA', img.size, (24, 20, 16, 255))
    bg.alpha_composite(img)
    d = ImageDraw.Draw(bg, 'RGBA')
    for name, col in colours.items():
        i = names.index(name)
        for (x, y), w in zip(V, W[:, i]):
            if w > 0.05:
                rad = 2 + 5 * w
                d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=col + (int(255 * min(1, w)),))
    for side in ('l', 'r'):
        d.line([tuple(p) for p in ARMS[side]['joints']], fill=(255, 255, 255, 230), width=2)
    bg.convert('RGB').save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--report', action='store_true')
    ap.add_argument('--overlay')
    ap.add_argument('--dry-run', action='store_true', help='measure, do not write the rig')
    args = ap.parse_args()
    rig, img, _ = build()
    ok = report(rig, img) if args.report else ownership(rig, img)[1]
    if args.overlay:
        overlay(rig, img, args.overlay)
        print(f'\noverlay -> {args.overlay}')
    if not ok:
        print('\nrefusing to write: an arm is not owned by its own bones', file=sys.stderr)
        return 1
    if not args.dry_run:
        (RIG_DIR / 'guy.rig.json').write_text(json.dumps(rig))
        print(f'\nwrote {(RIG_DIR / "guy.rig.json").relative_to(ROOT)}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
