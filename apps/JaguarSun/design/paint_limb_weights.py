"""Give every limb bone the whole limb, by asking the pixels which bone they belong to.

    python3 design/paint_limb_weights.py <guy|girl> [--apply]

THE BUG THIS EXISTS TO FIX

Twice now a limb has been half-attached. The girl's raygun rode the torso while
her forearm swung (the grip and barrel visibly hinged at her wrist), and the
man's arms straddle two grid columns with only ONE of them weighted to the arm —
so at any real amplitude the outer half stayed put and the triangles between the
halves stretched his hand into a dark blade.

Both were invisible until the motion got big enough to expose them, and both
were found by looking at a render rather than by reading the rig. A weight that
covers most of a limb looks completely fine standing still.

THE RULE

A pixel belongs to whichever BONE SEGMENT it is nearest to. That is the whole
idea, and it is the thing the original weighting got wrong by working in grid
cells and rough regions instead of in pixels.

Each cell then takes limb weight equal to the FRACTION of its own opaque pixels
that chose that limb, so a cell straddling the shoulder gets a partial weight
and the blend is smooth by construction rather than by a hand-tuned falloff.

WHY IT ALSO HANDLES A HELD PROP

The raygun is nowhere near the forearm's bone, but it is much further still from
the spine, so nearest-segment puts it on the forearm — which is exactly where a
held object belongs. No special case, no hand-listed cells.

WHAT IT WILL NOT TOUCH

Weight already assigned to a bone that is not part of the spine or a limb — the
hair, for one. That is painted by add_hair_bone.py from colour, which is a
question about the artwork rather than about the skeleton, and this script has
no business overruling it.

ALWAYS RENDER AFTERWARDS. Weights that sum to 1 and cover the silhouette can
still look wrong in motion; the only test that has ever caught these is a
picture. See design/README_mesh_rig.md.
"""

import json
import os
import sys

import numpy as np
from PIL import Image

APP_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SPINE = ['root', 'hips', 'waist', 'chest', 'neck', 'head']
LIMBS = [('arm_l', 'fore_l'), ('arm_r', 'fore_r')]
# Bones that are painted from the ARTWORK rather than from the skeleton, and so
# are left exactly as they are.
PROTECTED = ['hair']

ALPHA = 40
# A limb's last bone has no child to point at, so its segment is extended along
# its own direction to cover the hand. A HAND, not a leg: the first version used
# 2.2 and ran the forearm's segment down to his ankles, which handed his shins
# to his elbow.
TIP_EXTEND = 0.55

# Nearest-segment alone is not enough, and the reason is worth keeping: a man
# standing with his arms down has hands that are genuinely closer to his THIGHS
# than his spine is, so pure proximity gives his legs to his arms. A pixel is
# claimed by a limb only if it is also either
#
#   · inside that limb's own thickness (limbs are thin; the body is not), or
#   · overwhelmingly closer to the limb than to the spine — which is how a HELD
#     PROP gets picked up. The raygun sits ~200px from her forearm and ~450px
#     from her spine; her thigh sits 42 from the forearm and 70 from the spine.
#     The ratio separates them where the raw distance cannot.
THICKNESS_FRACTION = 0.13
DOMINANT_RATIO = 2.0

# HOW THE LIMB SPLITS BETWEEN ITS OWN TWO BONES.
#
# Not by nearest segment. Nearest-segment is a hard yes/no at the elbow, and a
# joint with no blend zone tears the moment it bends — it produces exactly the
# stair-step the good hand-made weights did not have (0.90/0.10, 0.54/0.46,
# 0.16/0.84 across three cells). So the split is a smooth ramp along the limb's
# own axis, centred on the elbow and this wide as a fraction of limb length.
ELBOW_BLEND = 0.18


def segments(bones_by_name):
    """(name, p0, p1) for every bone segment, spine and limb alike."""
    out = []
    for a, b in zip(SPINE, SPINE[1:]):
        if a in bones_by_name and b in bones_by_name:
            out.append((a, bones_by_name[a], bones_by_name[b]))
    for upper, lower in LIMBS:
        if upper not in bones_by_name or lower not in bones_by_name:
            continue
        p_up, p_lo = bones_by_name[upper], bones_by_name[lower]
        out.append((upper, p_up, p_lo))
        # the forearm, extended past its own joint to reach the hand
        direction = p_lo - p_up
        out.append((lower, p_lo, p_lo + direction * TIP_EXTEND))
    return out


def distance_to_segments(px, py, segs):
    """(n_pixels, n_segments) point-to-segment distances."""
    result = np.empty((px.size, len(segs)), dtype=np.float32)
    for i, (_, p0, p1) in enumerate(segs):
        dx, dy = p1[0] - p0[0], p1[1] - p0[1]
        length2 = dx * dx + dy * dy
        if length2 < 1e-9:
            result[:, i] = np.hypot(px - p0[0], py - p0[1])
            continue
        t = np.clip(((px - p0[0]) * dx + (py - p0[1]) * dy) / length2, 0.0, 1.0)
        result[:, i] = np.hypot(px - (p0[0] + t * dx), py - (p0[1] + t * dy))
    return result


def rest_total_of(row, names, index_of, limb_names):
    return sum(row[index_of[n]] for n in names if n not in limb_names and n not in PROTECTED)


def limb_axis_t(px, py, shoulder, elbow):
    """How far along the limb each pixel sits, 0 at the shoulder and 1 at the
    hand, measured along the shoulder->elbow->hand polyline."""
    a = np.asarray(elbow) - np.asarray(shoulder)
    upper_len = float(np.hypot(*a))
    lower_len = upper_len * TIP_EXTEND
    total = upper_len + lower_len
    hand = np.asarray(elbow) + a * TIP_EXTEND

    def project(p0, p1):
        d = np.asarray(p1) - np.asarray(p0)
        length2 = float(d @ d)
        if length2 < 1e-9:
            return np.zeros(px.size), np.hypot(px - p0[0], py - p0[1])
        t = np.clip(((px - p0[0]) * d[0] + (py - p0[1]) * d[1]) / length2, 0.0, 1.0)
        return t, np.hypot(px - (p0[0] + t * d[0]), py - (p0[1] + t * d[1]))

    t_up, d_up = project(shoulder, elbow)
    t_lo, d_lo = project(elbow, hand)
    on_upper = d_up <= d_lo
    s = np.where(on_upper, t_up * upper_len, upper_len + t_lo * lower_len)
    return s / max(total, 1e-9)


def main(who: str, apply: bool) -> None:
    folder = 'cast_guy' if who == 'guy' else 'cast_girl'
    stem = 'guy' if who == 'guy' else 'girl'
    rig_path = os.path.join(APP_ROOT, f'static/assets/meshRigs/{folder}/{stem}.rig.json')
    tex_path = os.path.join(APP_ROOT, f'static/assets/meshRigs/{folder}/{stem}.png')

    rig = json.load(open(rig_path))
    names = [b['name'] for b in rig['bones']]
    index_of = {n: i for i, n in enumerate(names)}
    positions = {b['name']: np.array([b['x'], b['y']], dtype=np.float64) for b in rig['bones']}

    alpha = np.asarray(Image.open(tex_path).convert('RGBA').getchannel('A'))
    height, width = alpha.shape
    cols, rows = rig['grid']
    cell_w, cell_h = width / cols, height / rows

    segs = segments(positions)
    limb_names = {n for pair in LIMBS for n in pair if n in index_of}
    spine_indices = [i for i, (n, _, _) in enumerate(segs) if n not in limb_names]
    limb_indices = [i for i, (n, _, _) in enumerate(segs) if n in limb_names]
    box = rig['figure_box']
    thickness = (box[2] - box[0]) * THICKNESS_FRACTION

    weights = [list(w) for w in rig['weights']]
    changed = 0
    report = []

    for vertex, (vx, vy) in enumerate(rig['verts']):
        x0, y0 = int(vx), int(vy)
        x1, y1 = min(width, int(vx + cell_w)), min(height, int(vy + cell_h))
        if x1 <= x0 or y1 <= y0:
            continue
        cell = alpha[y0:y1, x0:x1]
        ys, xs = np.nonzero(cell > ALPHA)
        if xs.size < 30:
            continue
        px = xs.astype(np.float32) + x0
        py = ys.astype(np.float32) + y0

        distances = distance_to_segments(px, py, segs)
        nearest = np.argmin(distances, axis=1)
        spine_best = distances[:, spine_indices].min(axis=1) if spine_indices else np.full(px.size, np.inf)
        limb_best = distances[:, limb_indices].min(axis=1) if limb_indices else np.full(px.size, np.inf)
        within_thickness = limb_best <= thickness
        dominant = spine_best >= limb_best * DOMINANT_RATIO
        claimed = np.isin(nearest, limb_indices) & (within_thickness | dominant)
        # A HELD PROP is claimed by dominance while sitting outside the limb's
        # own thickness — and it does NOT lie along the limb's axis, so the
        # along-the-limb split below reads it as sitting near the elbow and
        # hands half of it to the upper arm. That is the raygun hinging at the
        # wrist all over again. Anything held goes wholly to the hand end.
        held = claimed & ~within_thickness
        share = {}
        if claimed.any():
            # which limb (left or right) each claimed pixel belongs to, then how
            # far along THAT limb it sits
            for upper, lower in LIMBS:
                if upper not in index_of or lower not in index_of:
                    continue
                own = [i for i, (n, _, _) in enumerate(segs) if n in (upper, lower)]
                mine = claimed & np.isin(nearest, own)
                if not mine.any():
                    continue
                t = limb_axis_t(px[mine], py[mine], positions[upper], positions[lower])
                elbow = 1.0 / (1.0 + TIP_EXTEND)
                upper_share = np.clip((elbow + ELBOW_BLEND - t) / (2 * ELBOW_BLEND), 0.0, 1.0)
                upper_share[held[mine]] = 0.0
                share[upper] = share.get(upper, 0.0) + float(upper_share.sum()) / px.size
                share[lower] = share.get(lower, 0.0) + float((1.0 - upper_share).sum()) / px.size

        row = weights[vertex]
        protected = sum(row[index_of[p]] for p in PROTECTED if p in index_of)
        budget = 1.0 - protected
        if budget <= 1e-6:
            continue

        wanted = {n: min(v, 1.0) * budget for n, v in share.items() if v > 0.02}
        total_limb = sum(wanted.values())
        if total_limb > budget:
            scale = budget / total_limb
            wanted = {n: v * scale for n, v in wanted.items()}
            total_limb = budget

        # Nothing claimed AND nothing else to fall back on: the cell is entirely
        # limb weight that this pass does not recognise (a held prop the guards
        # rejected, most likely). Leaving it alone is right; zeroing the row is
        # what the first version did, and it deleted the raygun's attachment.
        if total_limb <= 1e-9 and rest_total_of(row, names, index_of, limb_names) <= 1e-9:
            continue

        before = {n: row[index_of[n]] for n in limb_names}
        if all(abs(before.get(n, 0.0) - wanted.get(n, 0.0)) < 0.02 for n in limb_names):
            continue

        # everything that is not a limb and not protected keeps its shape, scaled
        # into whatever the limbs left behind
        rest_names = [n for n in names if n not in limb_names and n not in PROTECTED]
        rest_total = sum(row[index_of[n]] for n in rest_names)
        # A cell that was ALL limb has no spine weight to scale the leftover
        # into, so the leftover would simply vanish and the row would stop
        # summing to 1 — caught by the assertion at the end, which is why it is
        # there. Deep inside a limb the honest answer is that the limb takes all
        # of it.
        if rest_total <= 1e-9 and total_limb > 1e-9:
            scale = budget / total_limb
            wanted = {n: v * scale for n, v in wanted.items()}
            total_limb = budget
        remaining = budget - total_limb
        for n in rest_names:
            row[index_of[n]] = (row[index_of[n]] / rest_total * remaining) if rest_total > 1e-9 else 0.0
        for n in limb_names:
            row[index_of[n]] = wanted.get(n, 0.0)

        changed += 1
        moved = {n: (round(before.get(n, 0), 2), round(wanted.get(n, 0), 2)) for n in limb_names
                 if abs(before.get(n, 0.0) - wanted.get(n, 0.0)) >= 0.02}
        report.append(f'  ({vx:6.1f},{vy:6.1f})  ' + '  '.join(f'{n} {a}->{b}' for n, (a, b) in moved.items()))

    sums = [sum(w) for w in weights]
    assert abs(min(sums) - 1) < 1e-5 and abs(max(sums) - 1) < 1e-5, f'weights stopped summing to 1: {min(sums)}..{max(sums)}'

    print('\n'.join(report))
    print(f'\n{who}: {changed} vertices re-weighted, all rows still sum to 1')

    if not apply:
        print('dry run — pass --apply to write')
        return
    rig['weights'] = weights
    json.dump(rig, open(rig_path, 'w'))
    print(f'wrote {rig_path}')


if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] not in ('guy', 'girl'):
        sys.exit(__doc__)
    main(sys.argv[1], '--apply' in sys.argv)
