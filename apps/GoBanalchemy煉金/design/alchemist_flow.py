"""The alchemist's flowing accessories (2026-10-04), used by build_alchemist_mascot.py.

The body is ONE weighted mesh (no cut parts, so no seams). Its accessories get
their own bones painted into that mesh, hung on Spine physics and driven by the
`flutter` loop on track 1 (Mascot.svelte): both coat tails (two-link chains),
the green flask hanging off the right of the belt, the test-tube holster on the
left, the goggles on the brow, the banana in the mouth and the chin (Boom's
existing `banana` / `jaw` bones, which its flinch and chew already key), and that is all:
the rolled sleeve cuffs are stiff and stay with the arms.

All coordinates are alchemy_body.png pixels (560 x 884, y DOWN).
"""
from __future__ import annotations

import math
import numpy as np

COLS, ROWS = 28, 44  # 20px cells; Boom's 14 x 24 was 40px — too coarse to bend a coat tail
COAT_L = [(182, 600), (124, 636), (58, 668)]
COAT_R = [(458, 572), (486, 630), (508, 690)]
FLASK = [(395, 404), (428, 556)]
VIALS = [(212, 400), (212, 486)]
GOGGLES = [(236, 96), (330, 74)]
# 2026-10-16: the coat's front-left flap (hinged at the belt, beside the left
# fist) and the right skirt hanging behind the flask, between trouser and knee pad
FLAP_L = [(236, 492), (204, 600)]
SKIRT_R = [(392, 556), (396, 634)]
# 2026-10-16 (round 8): the fur and the goggle strap. Fur on the crown, the
# two sides of the head and the shaggy outer edge of each forearm; the strap
# from the left lens round to its buckle. Each hangs from the bone the skin
# under it already follows (head / goggles / torso), so it only ADDS a lag.
CROWN = [(288, 52), (285, 12)]
FUR_L = [(204, 140), (166, 138)]
FUR_R = [(382, 145), (404, 150)]
STRAP = [(262, 80), (198, 92)]
FUR_ARM_L = [(40, 372), (18, 490)]
FUR_ARM_R = [(522, 372), (546, 490)]
REGION = {
    # both start BELOW the hands (left hand to y ~600, right to ~562): a tail
    # region reaching up into a fist tore it on every arm swing
    'coatL': [(44, 616), (150, 612), (204, 604), (178, 644), (122, 672), (58, 674), (42, 642)],
    'coatR': [(448, 578), (472, 574), (518, 640), (518, 694), (498, 696), (456, 642), (446, 604)],
    'flask': [(380, 376), (404, 376), (412, 420), (446, 430), (452, 482), (442, 502), (442, 562), (414, 562), (404, 502), (384, 482), (378, 430)],
    'vials': [(166, 396), (262, 392), (264, 488), (168, 490)],
    'jaw': [(262, 214), (346, 206), (352, 242), (302, 254), (262, 242)],
    'flapL': [(184, 528), (232, 496), (258, 484), (256, 512), (226, 584), (206, 612), (186, 606)],
    'skirtR': [(354, 566), (424, 566), (428, 604), (414, 640), (378, 632), (356, 600)],
    'crown': [(226, 32), (250, 14), (290, 6), (330, 12), (346, 30), (334, 48), (250, 50)],
    'furL': [(160, 110), (192, 100), (206, 140), (200, 176), (166, 172), (158, 140)],
    'furR': [(380, 114), (402, 116), (410, 150), (402, 182), (384, 172)],
    'strap': [(192, 78), (240, 64), (262, 68), (262, 92), (222, 102), (194, 102)],
    'furArmL': [(6, 380), (40, 366), (50, 420), (46, 482), (30, 508), (10, 472)],
    'furArmR': [(518, 366), (550, 378), (558, 430), (554, 482), (532, 504), (514, 450)],
}
LENSES = [((300, 78), 33), ((365, 80), 29)]
BANANA = [(298, 210), (262, 214), (236, 232), (222, 268)]
NEW_BONES = [  # name, parent, sheet start, sheet tip
    ('coatL1', 'hip', COAT_L[0], COAT_L[1]), ('coatL2', 'coatL1', COAT_L[1], COAT_L[2]),
    ('coatR1', 'hip', COAT_R[0], COAT_R[1]), ('coatR2', 'coatR1', COAT_R[1], COAT_R[2]),
    ('flask', 'hip', FLASK[0], FLASK[1]),
    ('vials', 'hip', VIALS[0], VIALS[1]),
    ('goggles', 'head', GOGGLES[0], GOGGLES[1]),
    ('flapL', 'hip', FLAP_L[0], FLAP_L[1]),
    ('skirtR', 'hip', SKIRT_R[0], SKIRT_R[1]),
    ('crown', 'head', CROWN[0], CROWN[1]),
    ('furL', 'head', FUR_L[0], FUR_L[1]),
    ('furR', 'head', FUR_R[0], FUR_R[1]),
    ('strap', 'goggles', STRAP[0], STRAP[1]),
    ('furArmL', 'torso', FUR_ARM_L[0], FUR_ARM_L[1]),
    ('furArmR', 'torso', FUR_ARM_R[0], FUR_ARM_R[1]),
]
# inertia, strength, damping, mass — follow-through on top of the keyed flutter
FLOW_PHYSICS = {
    'coatL1': (0.35, 170, 0.86, 1.4), 'coatL2': (0.45, 120, 0.84, 1.4),
    'coatR1': (0.35, 170, 0.86, 1.4), 'coatR2': (0.45, 120, 0.84, 1.4),
    'flask': (0.45, 120, 0.82, 2.0),
    'vials': (0.35, 180, 0.84, 1.4),
    'goggles': (0.08, 900, 0.9, 1.5),
    'banana': (0.25, 260, 0.86, 1.0),
    'flapL': (0.45, 130, 0.82, 1.4),
    'skirtR': (0.5, 110, 0.8, 1.4),
    'crown': (0.12, 420, 0.9, 1.0),
    'furL': (0.15, 360, 0.88, 1.0),
    'furR': (0.12, 420, 0.9, 1.0),
    'strap': (0.45, 120, 0.78, 1.2),
    'furArmL': (0.45, 120, 0.8, 1.2),
    'furArmR': (0.45, 120, 0.8, 1.2),
}


ARMS = ('armL', 'armL_fore', 'armL_hand', 'armR', 'armR_fore', 'armR_hand')


def smooth(value: float) -> float:
    t = min(1.0, max(0.0, value))
    return t * t * (3 - 2 * t)


class Skeleton:
    def __init__(self, rig: dict, W: int, H: int):
        self.rig, self.W, self.H = rig, W, H
        self.bones = rig['bones']
        self.idx = {b['name']: i for i, b in enumerate(self.bones)}

    def to_world(self, x, y):
        return x - self.W / 2, self.H - y

    def world(self, name):
        """world position and rotation (degrees) of a bone in the setup pose"""
        b = self.bones[self.idx[name]]
        if 'parent' not in b:
            return b.get('x', 0.0), b.get('y', 0.0), b.get('rotation', 0.0)
        px, py, pr = self.world(b['parent'])
        c, s_ = math.cos(math.radians(pr)), math.sin(math.radians(pr))
        lx, ly = b.get('x', 0.0), b.get('y', 0.0)
        return px + c * lx - s_ * ly, py + s_ * lx + c * ly, pr + b.get('rotation', 0.0)

    def to_local(self, name, wx, wy):
        bx, by, br = self.world(name)
        c, s_ = math.cos(math.radians(br)), math.sin(math.radians(br))
        dx, dy = wx - bx, wy - by
        return c * dx + s_ * dy, -s_ * dx + c * dy

    def add_bones(self):
        """add (or re-place) the accessory bones. PHYSICS NEEDS A LENGTH AND A
        DIRECTION: a zero-length bone flings on every hip move (GoBananinja)."""
        for name, parent, a_, b_ in NEW_BONES:
            wx, wy = self.to_world(*a_)
            tx, ty = self.to_world(*b_)
            px, py, pr = self.world(parent)
            c, s_ = math.cos(math.radians(pr)), math.sin(math.radians(pr))
            dx, dy = wx - px, wy - py
            bone = {'name': name, 'parent': parent,
                    'x': round(c * dx + s_ * dy, 3), 'y': round(-s_ * dx + c * dy, 3),
                    'rotation': round(math.degrees(math.atan2(ty - wy, tx - wx)) - pr, 3),
                    'length': round(math.hypot(tx - wx, ty - wy), 3)}
            if name in self.idx:
                self.bones[self.idx[name]] = bone
            else:
                self.bones.append(bone)
                self.idx[name] = len(self.bones) - 1


def poly_dist(pts, p):
    """0 inside the polygon, else the distance to its edge"""
    inside = False
    best = 1e9
    for i in range(len(pts)):
        (xi, yi), (xj, yj) = pts[i], pts[i - 1]
        if (yi > p[1]) != (yj > p[1]) and p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi:
            inside = not inside
        dx, dy = xi - xj, yi - yj
        t = max(0.0, min(1.0, ((p[0] - xj) * dx + (p[1] - yj) * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(xj + t * dx - p[0], yj + t * dy - p[1]))
    return 0.0 if inside else best


def polyline_param(pts, p):
    """distance to a polyline and the arc-length fraction of its nearest point"""
    best, along, walked = 1e9, 0.0, 0.0
    for a_, b_ in zip(pts[:-1], pts[1:]):
        dx, dy = b_[0] - a_[0], b_[1] - a_[1]
        L = math.hypot(dx, dy)
        t = max(0.0, min(1.0, ((p[0] - a_[0]) * dx + (p[1] - a_[1]) * dy) / (L * L)))
        d = math.hypot(a_[0] + t * dx - p[0], a_[1] + t * dy - p[1])
        if d < best:
            best, along = d, walked + t * L
        walked += L
    return best, along / walked


def soft_in(d, feather=16.0):
    """1 inside, fading to 0 over `feather` px outside"""
    return 1 - smooth(d / feather)


def base_weights(x: float, y: float) -> dict[str, float]:
    """the body as it was (build_alchemist_mascot.py, first version)"""
    head = 0.78 * (1 - smooth((y - 210) / 150))
    arms_y = smooth((y - 155) / 100) * (1 - smooth((y - 560) / 140))
    lower_arm = smooth((y - 320) / 240)
    left = 0.35 * arms_y * smooth((215 - 45 * lower_arm - x) / (120 - 30 * lower_arm))
    right = 0.35 * arms_y * smooth((x - 345 - 75 * lower_arm) / (120 - 50 * lower_arm))
    legs_y = smooth((y - 490) / 170)
    leg_left = 0.77 * legs_y * smooth((280 - x) / 110)
    leg_right = 0.77 * legs_y * smooth((x - 280) / 110)
    used = head + left + right + leg_left + leg_right
    remaining = max(0.0, 1 - used)
    hip = remaining * smooth((y - 400) / 165)
    # Anatomical chains: elbow and wrist rotations must own the forearm and
    # hand, rather than being decorative bones while one shoulder drags it all.
    # Broad blends at the elbow/wrist retain the seamless painted silhouette.
    elbow_l = smooth((y - 340) / 105)
    elbow_r = smooth((y - 345) / 105)
    wrist_l = smooth((y - 470) / 80)
    wrist_r = smooth((y - 455) / 80)
    knee = smooth((y - 600) / 110)
    ankle = smooth((y - 745) / 70)
    return {'head': head,
            'armL': left * (1 - elbow_l),
            'armL_fore': left * elbow_l * (1 - wrist_l),
            'armL_hand': left * elbow_l * wrist_l,
            'armR': right * (1 - elbow_r),
            'armR_fore': right * elbow_r * (1 - wrist_r),
            'armR_hand': right * elbow_r * wrist_r,
            'legL': leg_left * (1 - knee),
            'legL_calf': leg_left * knee * (1 - ankle),
            'legL_foot': leg_left * knee * ankle,
            'legR': leg_right * (1 - knee),
            'legR_calf': leg_right * knee * (1 - ankle),
            'legR_foot': leg_right * knee * ankle,
            'hip': hip, 'torso': remaining - hip}


def take(w: dict, share: float, into: dict, spare=()) -> dict:
    """hand `share` of every existing weight to the bones in `into` (summing to
    1) — except the `spare` bones, which keep theirs: an accessory beside a fist
    must still follow the arm as much as it did, or the seam between them tears
    (the right fist's edge in the chest beat, the coat corner in the throw)."""
    if share <= 0:
        return w
    kept = sum(v for k, v in w.items() if k in spare)
    out = {k: (v if k in spare else v * (1 - share)) for k, v in w.items()}
    for k, v in into.items():
        out[k] = out.get(k, 0) + share * (1 - kept) * v
    return out


def chain2(names, s):
    """two links: the root owns the first half of the tail, blending into the tip"""
    tip = smooth((s - 0.35) / 0.4)
    return {names[0]: 1 - tip, names[1]: tip}


def weights(x: float, y: float) -> dict[str, float]:
    w = base_weights(x, y)
    # the first version normalised at the end; head + arm can pass 1 at the edge
    total = sum(w.values())
    w = {k: v / total for k, v in w.items()}
    p = (x, y)
    # the chin chews: lower lip and jaw below the mouth line
    w = take(w, 0.85 * soft_in(poly_dist(REGION['jaw'], p), 12) * smooth((y - 204) / 14), {'jaw': 1})
    # the goggles sit on the brow
    lens = max(soft_in(max(0.0, math.dist(p, c) - r), 12) for c, r in LENSES)
    w = take(w, 0.9 * lens, {'goggles': 1})
    # the banana hangs from the mouth: weight grows along it
    d, s = polyline_param(BANANA, p)
    # its tip lies ON the lapel, which the head barely moves: the tip keeps half
    # the body's weight, or a chest beat folded the lapel under it to 5%
    w = take(w, soft_in(max(0.0, d - 13), 7) * smooth((s - 0.08) / 0.3) * (1 - 0.5 * smooth((s - 0.45) / 0.5)), {'banana': 1}, ARMS)
    # the flask swings from the belt, the vials rock in their holster
    d, s = polyline_param(FLASK, p)
    # The arms keep their share: the right fist sweeps across the flask in the
    # chest beat, and a flask holding none of the arm tore the fist into teeth.
    w = take(w, soft_in(poly_dist(REGION['flask'], p), 10) * smooth((s - 0.04) / 0.22), {'flask': 1}, ARMS)
    d, s = polyline_param(VIALS, p)
    w = take(w, 0.8 * soft_in(poly_dist(REGION['vials'], p), 8) * smooth((s + 0.1) / 0.5), {'vials': 1}, ARMS)
    # the front flap and the inner skirt: weight grows down from the hinge.
    # The arms keep theirs — the left fist rests right against the flap.
    for name, pts in (('flapL', FLAP_L), ('skirtR', SKIRT_R)):
        d, s = polyline_param(pts, p)
        share = 0.9 * soft_in(poly_dist(REGION[name], p), 8) * smooth((s - 0.05) / 0.45)
        w = take(w, share, {name: 1}, ARMS)
    # the fur and the strap: weight grows from root to tip. ARMS are spared
    # (the forearm fur hangs off the torso: only the skin's NON-arm share goes
    # to it, so the fur keeps following the arm exactly as much as before)
    for name, pts, k in (('crown', CROWN, 0.8), ('furL', FUR_L, 0.85), ('furR', FUR_R, 0.85),
                         ('strap', STRAP, 0.9), ('furArmL', FUR_ARM_L, 0.9), ('furArmR', FUR_ARM_R, 0.9)):
        d, s = polyline_param(pts, p)
        share = k * soft_in(poly_dist(REGION[name], p), 8) * smooth((s - 0.05) / 0.5)
        w = take(w, share, {name: 1}, ARMS)
    # the coat tails: a two-link chain each, rooted where the skirt leaves the hip
    for side, pts in (('L', COAT_L), ('R', COAT_R)):
        d, s = polyline_param(pts, p)
        share = soft_in(poly_dist(REGION['coat' + side], p), 10) * smooth((s - 0.02) / 0.3)
        w = take(w, share, chain2([f'coat{side}1', f'coat{side}2'], s), ARMS)
    # NOT the rolled cuffs: they are stiff, and their stripe across a raised
    # arm inverted in the cheer when it rode the cuff physics (2026-10-04)
    return w


def body_mesh(sk: Skeleton) -> dict:
    W, H = sk.W, sk.H
    ring = ([(c, 0) for c in range(COLS)] + [(COLS, r) for r in range(ROWS)] +
            [(c, ROWS) for c in range(COLS, 0, -1)] + [(0, r) for r in range(ROWS, 0, -1)])
    inside = [(c, r) for r in range(1, ROWS) for c in range(1, COLS)]
    order = ring + inside
    index = {point: i for i, point in enumerate(order)}
    # Smooth skin weights over the dense mesh. A sharp mask at the fist/flask
    # or lapel boundary creates a hinge in the painted flesh instead of a
    # blended joint. Diffusion changes weights only, never bone rest lengths.
    names = list(sk.idx)
    field = np.zeros((ROWS + 1, COLS + 1, len(names)), dtype=float)
    for row in range(ROWS + 1):
        for col in range(COLS + 1):
            for name, share in weights(W * col / COLS, H * row / ROWS).items():
                field[row, col, names.index(name)] = share
    for _ in range(12):
        pad = np.pad(field, ((1, 1), (1, 1), (0, 0)), mode='edge')
        field = .36 * field + .16 * (pad[:-2, 1:-1] + pad[2:, 1:-1] + pad[1:-1, :-2] + pad[1:-1, 2:])
    field /= field.sum(axis=2, keepdims=True)
    uvs, vertices, triangles = [], [], []
    for col, row in order:
        x, y = W * col / COLS, H * row / ROWS
        wx, wy = sk.to_world(x, y)
        uvs.extend((round(col / COLS, 6), round(row / ROWS, 6)))
        parts = [(name, field[row, col, i]) for i, name in enumerate(names) if field[row, col, i] > .0001]
        total = sum(value for _, value in parts)
        assert abs(total - 1) < 1e-3, (x, y, parts)
        vertices.append(len(parts))
        for name, value in parts:
            lx, ly = sk.to_local(name, wx, wy)
            vertices.extend((sk.idx[name], round(lx, 4), round(ly, 4), round(value / total, 6)))
    for row in range(ROWS):
        for col in range(COLS):
            a, b = index[col, row], index[col + 1, row]
            d, e = index[col, row + 1], index[col + 1, row + 1]
            triangles.extend((a, b, e, a, e, d))
    return {'type': 'mesh', 'uvs': uvs, 'triangles': triangles, 'vertices': vertices,
            'hull': len(ring), 'width': W, 'height': H}


def loop(period, terms, n=24):
    """a seamless rotate timeline over `period` s: sum of (amp, cycles, phase)"""
    return [{'time': round(period * i / n, 4),
             'value': round(sum(a_ * math.sin(2 * math.pi * c_ * i / n + ph) for a_, c_, ph in terms), 3)}
            for i in range(n + 1)]


def add_motion(rig: dict):
    # every constraint its OWN order (spine-physics-order: only the first runs otherwise)
    phys = [c for c in rig.get('physics', []) if c['bone'] not in FLOW_PHYSICS]
    for bone_name, (inertia, strength, damping, mass) in FLOW_PHYSICS.items():
        phys.append({'name': f'{bone_name}_phys', 'bone': bone_name, 'rotate': 1, 'inertia': inertia,
                     'strength': strength, 'damping': damping, 'mass': mass})
    for order_, c in enumerate(phys):
        c['order'] = order_
    rig['physics'] = phys

    # TRACK 1 `flutter` (4.8s, Boom's loop length): the coat tails sway with the
    # tip ~2x its root and later, the flask swings like a pendulum, the holster
    # rocks, the goggles barely settle. 1/2/3 cycles inside the loop.
    P = 4.8
    flutter = rig['animations']['flutter']['bones']
    flutter['coatL1'] = {'rotate': loop(P, [(1.1, 1, 0.0), (0.4, 2, 1.1)])}
    flutter['coatL2'] = {'rotate': loop(P, [(2.2, 1, 0.6), (0.8, 2, 1.8)])}
    flutter['coatR1'] = {'rotate': loop(P, [(1.0, 1, 2.1), (0.4, 3, 0.4)])}
    flutter['coatR2'] = {'rotate': loop(P, [(2.0, 1, 2.7), (0.7, 3, 1.0)])}
    flutter['flask'] = {'rotate': loop(P, [(2.6, 2, 0.9), (0.6, 3, 2.2)])}
    flutter['vials'] = {'rotate': loop(P, [(2.2, 2, 2.4), (0.7, 1, 0.3)])}
    flutter['goggles'] = {'rotate': loop(P, [(0.5, 1, 1.4), (0.2, 3, 0.2)])}
    flutter['flapL'] = {'rotate': loop(P, [(2.0, 1, 1.6), (0.6, 2, 0.2)])}
    flutter['skirtR'] = {'rotate': loop(P, [(2.4, 1, 3.4), (0.8, 3, 1.5)])}
    flutter['crown'] = {'rotate': loop(P, [(0.9, 1, 0.7), (0.4, 3, 2.0)])}
    flutter['furL'] = {'rotate': loop(P, [(1.8, 1, 1.9), (0.6, 2, 0.4)])}
    flutter['furR'] = {'rotate': loop(P, [(1.4, 1, 4.1), (0.5, 2, 2.6)])}
    flutter['strap'] = {'rotate': loop(P, [(2.8, 2, 0.5), (0.9, 3, 1.7)])}
    flutter['furArmL'] = {'rotate': loop(P, [(2.0, 1, 2.9), (0.7, 3, 0.9)])}
    flutter['furArmR'] = {'rotate': loop(P, [(2.0, 1, 0.3), (0.7, 3, 2.4)])}
    # Boom's banana chew wagged a banana nothing was weighted to; now the
    # painted banana rides it, and lying on the lapel it only takes half the wag
    # (Boom's ±7 deg wag folded the lapel under its tip to 1% in the chest beat):
    # a small chewing wiggle instead, its physics stiffened to match
    flutter['banana'] = {'rotate': loop(P, [(1.6, 4, 0.0), (0.7, 7, 1.0)], n=48)}
