"""
The prisoner's mesh rig, with arm bones that are actually ON his arms.

    python3 design/build_cast_guy_rig.py [--report] [--overlay out.png] [--dry-run]

WHY THIS EXISTS

Until 2026-09-17 Hard Time shipped `meshRigs/cast_guy/guy.rig.json` byte-identical
to Hot Miami's v0 `guy_full_standalone_sleeveless.rig.json` — a rig fitted to a
different man in a different pose. ART_AUDIO_BRIEF.md §1 asked for the prisoner to
be drawn to "the 441x1100 silhouette the mesh already verified", but the mesh rig
was never built on 441x1100: that was the flat sprite's size. The prisoner was
drawn wider, with his arms further out, and nobody re-fitted the rig.

What that did, measured on inked vertices only (mean weight of the arm's own two
bones):

    left sleeve, upper     0.13        right sleeve, upper     0.00
    left forearm + hand    0.32        right forearm + hand    0.13
                           (fore_l 0.03)                       (fore_r 0.00)

The arm bones owned a strip of jacket front and the tops of his trousers — where
Hot Miami's man kept his arms — and the real sleeves and hands rode the spine.
Every reaction table was bending his trousers.

WHAT THIS DOES

The same method as Capo Nostra's design/build_cast_guy_rig.py, which fixed the
same defect on the Don: the spine is `skin.build_rig` untouched, and the arms are
MEASURED JOINT POLYLINES (shoulder, elbow, wrist, fingertip) claimed by distance to
the polyline, with a per-segment radius, lattice smoothing and an explicit forearm
`axis`. 10 bones, 16x40 grid, same names and order, so nothing that indexes the rig
moves.

RIG SPACE IS 512x1024, NOT THE TEXTURE'S 441x1100

The texture that ships (`sprites/hardTimeCast/prisoner.png`, see game/assets.ts)
is 441x1100. The renderer maps UV = vertex / rig.size, so the prisoner has always
been drawn stretched into the rig's 512x1024 frame — about 16% wider and 7% shorter
than painted. Re-fitting at 441x1100 would correct that and visibly narrow him on
screen; keeping today's look was the user's call (2026-09-17). So the texture is
resampled into 512x1024 here and every coordinate below is in that frame.

`figure_box` is likewise KEPT at the shipped (134, 86, 403, 887).
CastFigureMesh.svelte sizes and places the figure from it (height / box height,
centred on the box, top at the box's y0); the prisoner's true silhouette box in
this frame is about (84, 42, 450, 890), and writing that would shrink him 5.5% and
drop his head ~40px. The spine, the plant line and the arm fade all use the TRUE
silhouette; only the stored layout box is held.
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RIG_DIR = ROOT / 'static/assets/meshRigs/cast_guy'
TEXTURE = ROOT / 'static/assets/sprites/hardTimeCast/prisoner.png'
RIG_SIZE = (512, 1024)
LAYOUT_BOX = [134, 86, 403, 887]
SKILL = Path.home() / '.claude/skills/hacksaw-character-motion/rig'
sys.path.insert(0, str(SKILL))
import skin  # noqa: E402

# ── measured joints, rig px (prisoner.png resampled to 512x1024) ────────────
#
# Read off the silhouette's row runs (alpha > 40):
#
#   LEFT ARM (viewer-left, arm_l / fore_l)
#     comes away from the body at y338: [94-163] -> centre 128, half-width 34.5;
#     y380 [88-153] 120 / 32.5; y420 [87-143] 115 / 28; cuff ends y455 [84-142];
#     hand y460..530, centre ~114, half-width ~22, fingertip (128, 532).
#     Above y338 the sleeve is merged with the jacket; its outer edge runs
#     129@210 -> 99@330, so the centre is that edge + 34.
#
#   RIGHT ARM (viewer-right, arm_r / fore_r) — the mirror, within 2px
#     y340 [372-442] 407 / 35; y380 [380-448] 414 / 34; y420 [390-448] 419 / 29;
#     hand centre ~415, fingertip (403, 532); outer edge 405@210 -> 438@330.
#
# The elbow is where the sleeve comes away from the body — a straight hanging arm
# has no visible bend to read it from, and the upper arm and forearm are the same
# length there (125 / 116 px).
#
# RADIUS per segment (shoulder->elbow, elbow->wrist, wrist->tip) is the sleeve's
# own half-width at that segment. The upper radius was swept against the jacket
# strip beside each arm (torso that must NOT move with an arm) and rule 10 with
# the shipped trigger:
#
#     upper r   arm cores (L up/fore, R up/fore)   jacket spill L/R   trigger fold
#       28        0.60 0.77 0.59 0.80                0.06 / 0.01        63.9%
#       31        0.63 0.78 0.61 0.80                0.06 / 0.02        63.9%
#       34        0.64 0.78 0.63 0.80                0.07 / 0.03        63.9%   <- shipped
#       38        0.67 0.78 0.65 0.80                0.10 / 0.05        63.9%
#
# (swept at one smoothing pass). It does not move the fold at all — the worst
# triangles are at the hands — so it is the plain trade of arm ownership against
# jacket spill, and 34 is the sleeve.
#
# SMOOTH is passes of lattice averaging (smooth_on_grid). The same trade Capo
# found — a cell is 32px and a sleeve 60-70px, so an arm is two lattice columns
# with no interior to keep rigid — plus one Capo did not have: THE HANDS HANG
# 5-10px FROM THE THIGHS. That gap is a third of a cell, so no vertex can sit in
# it, and every arm swing shears the triangles that hold both a hand and a
# trouser edge. The weights only choose WHERE that shear lands: a sharp fade puts
# it in the fingers (drawn to a point on one side, smeared fat on the other), a
# soft one spreads it over hand and trouser alike.
#
# Measured on this drawing. "hand" / "trouser" are the worst anisotropy (1.0 =
# rigid) of triangles covering each hand / the thigh beside it, arm_l and arm_r
# swung +-4deg alone; rule 10 uses the shipped tables, 8 trigger phases:
#
#   passes  arm cores     jacket   hand L/R    trouser L/R   idle    trigger       09-10 trigger
#           (L up/fore,   spill
#            R up/fore)   L/R
#     0     .74 .90 .71 .90  .02/.00  3.11/3.39   2.47/3.46     51.5%   33.0% 1.76x    0.7%  56 flips
#     1     .64 .78 .63 .80  .07/.03  1.66/1.75   1.66/1.67     75.2%   63.9% 1.41x   33.8%
#     2     .58 .69 .56 .72  .11/.07  1.36/1.36   1.36/1.35     83.6%   71.0% 1.28x   56.0%   <- shipped
#     3     .53 .63 .51 .66  .14/.10  1.25/1.23   1.23/1.24     86.6%   77.2% 1.25x   67.4%
#
# Two passes, chosen on RENDERS of the shipped trigger at its worst idle phase,
# not on the table: at one pass the driving hand's fingers visibly smear and the
# trouser edge beside it bulges; at two the hand only thickens, which is what
# the reference's driving arm is supposed to do. Three buys a little more hand
# (1.25) and leaves the right upper arm at 0.51 of its own — one step from
# half-welded to the torso again, the defect this file exists to fix.
#
# Giving the hand a wider radius instead (38, 46px) so the thigh edge rides WITH
# the hand was tried and is worse: the fingers stay rigid on the right but the
# trouser edge beside the left hand shears to 1.9-6.4.
ARMS = {
    'l': dict(joints=[(160, 215), (128, 340), (114, 455), (128, 532)], radius=[34.0, 31.0, 22.0],
              reach_up=0.10, feather=0.55, elbow_blend=0.45, smooth=2),
    'r': dict(joints=[(372, 215), (406, 340), (420, 455), (405, 532)], radius=[34.0, 31.0, 22.0],
              reach_up=0.10, feather=0.55, elbow_blend=0.45, smooth=2),
}
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
    """Diffuse a per-vertex field across the mesh lattice. Without it the claim's
    fade (r * feather, ~19px) lands between two vertices 32px apart: one vertex is
    100% arm, its neighbour 0%, and the triangle between them takes the whole
    shear — 56 inverted triangles on the old tables at 0 passes.

    Each pass is a weighted average of a vertex and its four lattice neighbours
    (self counted twice), so the core softens along with the rim; OWN_FLOOR is
    what stops that going too far."""
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


def texture_in_rig_space():
    """prisoner.png as the renderer shows it: stretched to the rig's frame."""
    img = Image.open(TEXTURE).convert('RGBA')
    return img.resize(RIG_SIZE, Image.BILINEAR) if img.size != RIG_SIZE else img


def build(arms=None):
    arms = arms or ARMS
    img = texture_in_rig_space()
    rig = skin.build_rig(img, cols=16, rows=40)
    x0, y0, x1, y1 = rig['figure_box']
    FH = y1 - y0
    verts = np.asarray(rig['verts'], float)
    W = np.asarray(rig['weights'], float)
    names = [b['name'] for b in rig['bones']]
    chest = names.index('chest')

    for side in ('l', 'r'):
        spec = arms[side]
        joints = spec['joints']
        radii = np.asarray(spec['radius'], float)
        s_at = arc_lengths(joints)
        s_elbow, s_tip = s_at[1], s_at[-1]
        (sx, sy), (ex, ey), (wx, wy) = joints[0], joints[1], joints[2]

        i_arm = len(rig['bones'])
        rig['bones'].append({'name': 'arm_%s' % side, 'x': float(sx), 'y': float(sy), 'parent': chest})
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

    rig['weights'] = W.tolist()
    rig['silhouette_box'] = rig['figure_box']
    rig['figure_box'] = LAYOUT_BOX
    rig['image'] = 'sprites/hardTimeCast/prisoner.png (441x1100, resampled to 512x1024)'
    return rig, img


def _inside(poly, V, size):
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
    and over the jacket strip beside it. Returns rows and whether every arm clears
    OWN_FLOOR."""
    # Ink is read the way the renderer and check_cast_motion.mjs read it: the
    # ORIGINAL texture, sampled at the vertex's UV, so both count the same vertices.
    tex = np.asarray(Image.open(TEXTURE).convert('RGBA'))[..., 3]
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
            m = _inside(poly, V, size) & ink
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
    print(f"\nsilhouette box {rig['silhouette_box']}, layout figure_box kept at {rig['figure_box']}")
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
    rig, img = build()
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
