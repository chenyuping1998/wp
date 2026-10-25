"""Continuous-mesh cast figures for Saucer / Putt (2026-10-17), replacing the
first build's geometric weights (an arm was "everything right of the
shoulder", appendages Gaussian blobs owning 3-10 vertices) and its tiny,
generic motion (5-10px in a 900px figure).

  * weights from the drawing: a soft-min over measured body chains (spine,
    legs, arms) and appendage polygons (cast_mesh_spec.py), each chain split
    between its bones with a ramp across every joint
  * motion with weight: the whole figure lifts and squashes on the root and
    hips (free for the mesh), arms reach within their measured limits, and the
    appendages carry the follow-through. Each action plays once and settles;
    the idle is nearly still (user, 2026-10-16: no constant wobble)
  * the laugh follows src/game/laughTiming.json, the same clock the HA!
    captions and the laugh audio use (the first build laughed on six beats a
    second apart while the captions popped on ten)

    python build_cast_mesh.py <Saucer|Putt> [mg|fg]
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from cast_mesh_spec import SPEC  # noqa: E402

APPS = Path(__file__).resolve().parents[1] / 'apps'
W, H = 560, 912
ROOT = (280, 904)
COLS, ROWS = 40, 64
SOFT = 9.0
EXPR = ('neutral', 'blink', 'grin', 'shock', 'laugh_inhale', 'laugh_rising', 'laugh_peak', 'laugh_settle')


def smooth(v):
    v = max(0.0, min(1.0, v))
    return v * v * (3 - 2 * v)


def hump(t, a, ln):
    u = (t - a) / ln
    return 0.0 if u <= 0 or u >= 1 else math.sin(math.pi * u)


def flick(t, t0, hz, decay):
    if t < t0:
        return 0.0
    s = t - t0
    return math.exp(-decay * s) * math.sin(2 * math.pi * hz * s)


def key(t, pts):
    """piecewise smoothstep through (time, value) keys"""
    if t <= pts[0][0]:
        return pts[0][1]
    for (t0, v0), (t1, v1) in zip(pts, pts[1:]):
        if t <= t1:
            return v0 + (v1 - v0) * smooth((t - t0) / (t1 - t0))
    return pts[-1][1]


# ── geometry ────────────────────────────────────────────────────────────────
def seg_dist(p, a, b):
    ax, ay = a
    dx, dy = b[0] - ax, b[1] - ay
    L2 = dx * dx + dy * dy or 1
    u = max(0.0, min(1.0, ((p[0] - ax) * dx + (p[1] - ay) * dy) / L2))
    return math.hypot(ax + u * dx - p[0], ay + u * dy - p[1]), u


def poly_dist(p, poly):
    inside = False
    n = len(poly)
    best = 1e9
    for i in range(n):
        a, b = poly[i], poly[(i + 1) % n]
        if (a[1] > p[1]) != (b[1] > p[1]) and p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]:
            inside = not inside
        best = min(best, seg_dist(p, a, b)[0])
    return 0.0 if inside else best


class Region:
    """a polygon that belongs wholly to one bone (a bag strapped on the back)"""

    def __init__(self, poly, bone):
        self.poly, self.bone = poly, bone

    def dist(self, p):
        return poly_dist(p, self.poly), None

    def split(self, p, at):
        return {self.bone: 1.0}


class App:
    """an appendage: competes in the soft-min like any part, and hands its
    share back to its parent near the pivot"""

    def __init__(self, a):
        self.a = a

    def dist(self, p):
        return poly_dist(p, self.a['poly']), None

    def split(self, p, at):
        a = self.a
        keep = smooth((math.dist(p, a['pivot']) - 4) / a['ramp'])
        return {a['name']: keep, a['parent']: 1 - keep}


class Chain:
    """a polyline with a half-width per point and a bone per segment"""

    def __init__(self, pts, hws, bones, ramps):
        self.pts, self.hws, self.bones, self.ramps = pts, hws, bones, ramps

    def dist(self, p):
        best, at = 1e9, (0, 0.0)
        for i in range(len(self.pts) - 1):
            d, u = seg_dist(p, self.pts[i], self.pts[i + 1])
            hw = self.hws[i] + (self.hws[i + 1] - self.hws[i]) * u
            if d - hw < best:
                best, at = d - hw, (i, u)
        return max(0.0, best), at

    def split(self, p, at):
        """the chain's weight at p, by bone: a ramp across each joint"""
        out = {}
        i, u = at
        # signed distance along the chain from each inner joint
        for j in range(1, len(self.pts) - 1):
            pass
        # position along: segment i, fraction u -> distance to joints i (start) and i+1 (end)
        seg_len = math.dist(self.pts[i], self.pts[i + 1])
        w = {self.bones[i]: 1.0}
        if i > 0:  # near the joint at the segment's start
            r = self.ramps[i - 1]
            k = smooth(0.5 + (u * seg_len) / (2 * r))
            w = {self.bones[i]: k}
            w[self.bones[i - 1]] = w.get(self.bones[i - 1], 0) + 1 - k
        if i < len(self.pts) - 2:  # near the joint at its end
            r = self.ramps[i]
            k = smooth(0.5 + ((1 - u) * seg_len) / (2 * r))
            w = {b: v * k for b, v in w.items()}
            w[self.bones[i + 1]] = w.get(self.bones[i + 1], 0) + 1 - k
        for b, v in w.items():
            out[b] = out.get(b, 0) + v
        return out


def build_parts(s):
    sp = [p for p, _, _ in s['spine']]
    hw = [h for _, h, _ in s['spine']]
    parts = [('body', Chain(sp, hw, ['hip', 'torso', 'torso', 'head', 'head'], [36, 40, 40, 34]), 0)]
    for side in 'LR':
        lg = s['legs'][side]
        parts.append((f'leg{side}', Chain(lg, [s['legs']['hw']] * 4, [f'leg{side}', f'shin{side}', 'root'], [30, 26]), 0))
        if side in s.get('ik_arms', ()):
            continue  # this arm is separate pieces on IK (Cut below), not part of the mesh
        ar = s['arms'][side]
        hwa = s['arms']['hw']
        parts.append((f'arm{side}', Chain(ar, [hwa + 2, hwa, hwa - 2, hwa - 6], [f'arm{side}', f'fore{side}', f'fore{side}'], [24, 30]), 4))
    for bone, poly, pri in s.get('extras', []):
        parts.append((f'extra:{bone}', Region(poly, bone), pri))
    for a in s['apps']:
        parts.append((a['name'], App(a), a.get('priority', 3)))
    return parts


def weights_at(p, parts, apps):
    ds = []
    for name, ch, pri in parts:
        d, at = ch.dist(p)
        ds.append((d - pri, name, ch, at))
    dmin = min(d for d, *_ in ds)
    acc = {}
    tot = 0
    for d, name, ch, at in ds:
        k = math.exp(-(d - dmin) / SOFT)
        if k < 1e-4:
            continue
        tot += k
        for b, v in ch.split(p, at).items():
            acc[b] = acc.get(b, 0) + k * v
    acc = {b: v / tot for b, v in acc.items()}
    s = sum(acc.values())
    acc = {b: v / s for b, v in acc.items() if v / s > 1e-4}
    s = sum(acc.values())
    return {b: v / s for b, v in acc.items()}


# ── motion ──────────────────────────────────────────────────────────────────
LAUGH = None


def motions(s, cast, theme):
    """each action as a function t -> {bone: (rot, tx, ty, sx, sy)}"""
    P, O = s['prop'], s['out']   # prop arm, the sign that swings it OUT
    Q = 'R' if P == 'L' else 'L'
    qo = -O
    apps = [a['name'] for a in s['apps']]
    toward = -1  # the board is to screen-left of the cast: -x

    def base():
        return {}

    def put(d, b, rot=0, tx=0, ty=0, sx=1, sy=1):
        r0, x0, y0, sx0, sy0 = d.get(b, (0, 0, 0, 1, 1))
        d[b] = (r0 + rot, x0 + tx, y0 + ty, sx0 * sx, sy0 * sy)

    def squash(d, k):
        """the whole figure squashes on its feet (k > 0) or stretches (k < 0):
        a scale on the root, so no triangle changes shape against another"""
        put(d, 'root', sx=1 + 0.05 * k, sy=1 - 0.08 * k)

    def squat(d, depth):
        """the hips drop, the knees bend outward, the feet stay"""
        put(d, 'hip', ty=-depth)
        put(d, 'legL', rot=-0.35 * depth)
        put(d, 'shinL', rot=0.7 * depth)
        put(d, 'legR', rot=0.35 * depth)
        put(d, 'shinR', rot=-0.7 * depth)

    def apps_kick(d, t, t0, amp, hz=1.8, decay=3.2):
        for i, a in enumerate(s['apps']):
            put(d, a['name'], rot=a['flip'] * amp * (1.6 if a['name'] in ('antenna', 'pompom', 'pennant') else 1) * flick(t, t0 + 0.05 * i, hz, decay))

    def idle(t):
        d = base()
        b = math.sin(2 * math.pi * t / 4.8)
        put(d, 'torso', sx=1 + 0.006 * b, sy=1 + 0.012 * b)
        put(d, 'head', rot=0.5 * math.sin(2 * math.pi * (t - 0.4) / 4.8))
        return d

    def cheer(t):
        d = base()
        # anticipation squat, the hop, a squash on landing, settle
        squash(d, hump(t, 0.0, 0.4) - 0.7 * hump(t, 0.32, 0.36) + 0.9 * hump(t, 0.86, 0.3))
        put(d, 'root', ty=34 * hump(t, 0.3, 0.6))
        reach = key(t, [(0, 0), (0.2, -0.25), (0.48, 1), (1.05, 1), (1.5, 0)])
        put(d, f'arm{P}', rot=O * 11 * reach)
        put(d, f'fore{P}', rot=O * 16 * reach + O * 4 * flick(t, 0.5, 2.6, 4))
        pump = key(t, [(0, 0), (0.25, 0), (0.5, 1), (0.66, 0.4), (0.82, 1), (1.3, 0)])
        put(d, f'arm{Q}', rot=qo * 7 * pump)
        put(d, f'fore{Q}', rot=qo * 12 * pump)
        put(d, 'torso', rot=-O * 2.5 * reach)
        put(d, 'head', rot=O * 4 * key(t, [(0, 0), (0.45, 1), (1.1, 0.6), (1.6, 0)]))
        apps_kick(d, t, 0.32, 10)
        return d

    def throwit(t):
        d = base()
        wind = key(t, [(0, 0), (0.38, 1), (0.52, 1), (0.62, -1), (0.8, -0.6), (1.0, 0)])
        squash(d, 0.6 * hump(t, 0.1, 0.4) - 0.4 * hump(t, 0.5, 0.25))
        put(d, 'root', tx=toward * 10 * max(0, -wind), ty=4 * hump(t, 0.5, 0.3))
        put(d, 'torso', rot=-toward * 3 * wind * -1)
        put(d, f'arm{P}', rot=-O * 9 * max(0, wind) + O * 12 * max(0, -wind))
        put(d, f'fore{P}', rot=-O * 12 * max(0, wind) + O * 16 * max(0, -wind))
        put(d, f'arm{Q}', rot=qo * 5 * max(0, -wind))
        put(d, 'head', rot=toward * 3 * max(0, -wind))
        apps_kick(d, t, 0.58, 9, 2.0, 3.4)
        return d

    beats = [(LAUGH['startMs'] + i * LAUGH['gapMs']) / 1000 for i in range(LAUGH['beats'])]
    laugh_end = LAUGH['endMs'] / 1000

    G = s.get('laugh_gain', 1.0)

    gap = LAUGH['gapMs'] / 1000
    # a laugh whose first HA comes early (Putt: a recorded laugh, 2026-10-19)
    # must already be on by then, and a fast one's humps must not merge into
    # a blur; at Saucer's 480/280 timing both are the original numbers
    on_from = min(0.25, beats[0] - 0.2)

    def chestbeat(t):
        d = base()
        on = smooth((t - on_from) / 0.25) * (1 - smooth((t - laugh_end + 0.25) / 0.45))
        bounce = sum(hump(t, b - 0.02, min(0.24, gap)) for b in beats)
        # a belly laugh shakes the whole body: each HA heaves the shoulders up
        # and drops them, the trunk rocks side to side every other beat
        squash(d, 0.3 * G * bounce * on)
        if G > 1:
            # the joints have little room (the torso tears past ~4 deg), so the
            # extra shake is the root's: a hop on each HA and a rock on the feet
            # every other beat, which moves the whole figure without deforming it
            rock = math.sin(2 * math.pi * (t - beats[0] + 0.07) / (2 * LAUGH['gapMs'] / 1000))
            put(d, 'root', rot=1.6 * (G - 1) * rock * on, ty=11 * (G - 1) * bounce * on)
        put(d, 'torso', rot=1.6 * G * math.sin(2 * math.pi * (t - beats[0]) / (2 * LAUGH['gapMs'] / 1000)) * on, sx=1 + 0.02 * G * bounce * on, sy=1 - 0.03 * G * bounce * on)
        put(d, 'head', rot=(-4 * on) + 2 * G * bounce * on)  # thrown back, nodding with each HA
        put(d, f'arm{P}', rot=-O * 3 * on + O * 1.5 * (G - 1) * bounce * on)
        put(d, f'fore{P}', rot=O * 6 * on + O * 2 * G * bounce * on)
        put(d, f'arm{Q}', rot=qo * 3 * on + qo * 1.5 * (G - 1) * bounce * on)
        put(d, f'fore{Q}', rot=qo * 8 * on)
        # the hats, capes and tails keep their old swing: the shake is the body's
        # (scaled up they tear where they overlap a hand, Saucer fg's tail)
        for i, a in enumerate(s['apps']):
            put(d, a['name'], rot=a['flip'] * 3 * bounce * on)
        return d

    def nod(t):
        d = base()
        n = key(t, [(0, 0), (0.18, -0.3), (0.36, 1), (0.52, -0.2), (0.8, 0)])
        put(d, 'head', rot=toward * -6 * n)
        put(d, 'torso', rot=toward * -1.2 * n)
        squash(d, 0.35 * hump(t, 0.2, 0.4))
        apps_kick(d, t, 0.36, 5)
        return d

    def flinch(t):
        d = base()
        j = key(t, [(0, 0), (0.06, 1), (0.22, 0.8), (0.6, 0)])
        put(d, 'root', tx=-toward * 8 * j)
        put(d, 'torso', rot=toward * 3 * j)
        put(d, 'head', rot=toward * 4 * j)
        put(d, f'arm{P}', rot=O * 5 * j)
        put(d, f'arm{Q}', rot=qo * 5 * j)
        apps_kick(d, t, 0.04, 8, 2.4, 4)
        return d

    def alert(t):
        d = base()
        a = key(t, [(0, 0), (0.12, -0.3), (0.3, 1), (0.6, 1), (0.8, 0)])
        put(d, 'root', ty=6 * max(0, a))
        put(d, 'torso', sy=1 + 0.02 * max(0, a))
        put(d, 'head', rot=toward * -3 * a)
        apps_kick(d, t, 0.3, 6)
        return d

    def glance(t):
        d = base()
        g = key(t, [(0, 0), (0.3, 1), (0.8, 1), (1.2, 0)])
        put(d, 'head', rot=toward * -5 * g)
        put(d, 'torso', rot=toward * -1 * g)
        return d

    def flutter(t):
        """the second track: the appendages sway once, then hang still"""
        d = base()
        for i, a in enumerate(s['apps']):
            u = (t + 0.6 * i) % 7.2
            put(d, a['name'], rot=a['flip'] * 3.0 * math.sin(2 * math.pi * u / 2.4) * hump(u, 0, 2.4))
        return d

    return {
        'idle': (4.8, idle), 'cheer': (1.7, cheer), 'chestbeat': (laugh_end + 0.35, chestbeat), 'nod': (0.8, nod),
        'throwit': (1.0, throwit), 'flinch': (0.6, flinch), 'alert': (0.8, alert), 'glance': (1.2, glance),
        'flutter': (7.2, flutter),
    }


def face_keys(name, dur, teeth=False, teeth_hold=False):
    seq = [(0, 'neutral')]
    if name == 'idle':
        seq += [(2.1, 'blink'), (2.24, 'neutral'), (4.0, 'blink'), (4.15, 'neutral')]
    elif name == 'chestbeat':
        beats = [(LAUGH['startMs'] + i * LAUGH['gapMs']) / 1000 for i in range(LAUGH['beats'])]
        seq += [(min(0.2, beats[0] - 0.1), 'laugh_inhale')]
        hold = min(0.15, LAUGH['gapMs'] / 1000 * 0.6)
        if teeth and teeth_hold:
            # the grin stays bared from the first HA until the last has
            # faded (Mascot.svelte's HA_LIFE_MS), so no caption is ever up
            # over a closed mouth (Saucer, user 2026-10-23)
            seq += [(beats[0], 'laugh_teeth')]
            seq += [(max(LAUGH['endMs'] / 1000 - 0.15, beats[-1] + 0.42), 'laugh_settle')]
        else:
            for i, b in enumerate(beats):
                seq += [(b, 'laugh_teeth' if teeth else 'laugh_peak'), (b + hold, 'laugh_rising')]
            seq += [(LAUGH['endMs'] / 1000 - 0.15, 'laugh_settle')]
    elif name == 'cheer':
        seq += [(0.12, 'grin'), (0.45, 'laugh_rising'), (0.6, 'laugh_peak'), (1.2, 'laugh_settle'), (1.5, 'grin')]
    elif name in ('alert', 'flinch'):
        seq += [(0.05, 'shock'), (dur * 0.8, 'blink')]
    elif name in ('nod', 'throwit'):
        seq += [(0.12, 'grin')]
    elif name == 'glance':
        seq += [(0.9, 'blink'), (1.0, 'neutral')]
    seq += [(dur, 'neutral')]
    return [{'time': round(t, 4), 'name': 'figure' if e == 'neutral' else 'figure_' + e} for t, e in seq]


def to_spine(p):
    return (p[0] - ROOT[0], ROOT[1] - p[1])


# -- cut pieces (2026-10-23, Putt's golfer) ------------------------------------
class Cut:
    """Arms and props cut off the drawing (the app's design/swing/
    cut_golfer_arms.py) and hung on their own bones in front of the mesh:
    two-bone IK arms reaching for `tgtL`/`tgtR` (children of the torso), a hand
    on each forearm, the putter in the left hand, a ball on the root. Their
    motion is written afterwards by the app's design/swing/build_golfer_swing.mjs."""

    def __init__(self, folder):
        self.folder = folder
        self.meta = json.loads((folder / 'cut.json').read_text(encoding='utf-8'))
        self.j = {k: tuple(v) for k, v in self.meta['joints'].items()}
        self.boxes = self.meta['boxes']
        self.order = self.meta['order']
        # arms cut off whole and hung on IK; the default is the golfer's two
        self.ik_arms = self.meta.get('ik_arms', ['L', 'R'])

    @staticmethod
    def ang(a, b):
        """world angle of a->b in Spine's frame (y up), degrees"""
        return math.degrees(math.atan2(-(b[1] - a[1]), b[0] - a[0]))

    def rig_bones(self, bones, piv):
        j = self.j
        by = {b['name']: b for b in bones}
        world = {}  # name -> (canvas pivot, world angle)
        self.bend = {}

        def local(name, parent, p, a, length=None):
            pp, pa = world[parent] if parent in world else (piv[parent], 0.0)
            dx, dy = to_spine(p)[0] - to_spine(pp)[0], to_spine(p)[1] - to_spine(pp)[1]
            c, s_ = math.cos(math.radians(-pa)), math.sin(math.radians(-pa))
            b = by.get(name) or {'name': name}
            b.update(parent=parent, x=round(dx * c - dy * s_, 3), y=round(dx * s_ + dy * c, 3))
            r = (a - pa + 540) % 360 - 180
            b.pop('rotation', None)
            if abs(r) > 1e-6:
                b['rotation'] = round(r, 3)
            if length:
                b['length'] = round(length, 2)
            if name not in by:
                bones.append(b)
                by[name] = b
            world[name] = (p, a)

        if 'rig' in self.meta:
            # pieces on the mesh's own bones, as cut.json lists them
            for b in self.meta['rig']['bones']:
                local(b['name'], b['parent'], tuple(b['at']), b['angle'], b.get('length'))
            self.world = world
            return
        for side in 'LR':
            S, E, Wr = j[f'shoulder{side}'], j[f'elbow{side}'], j[f'wrist{side}']
            local(f'arm{side}', 'torso', S, self.ang(S, E), math.dist(S, E))
            local(f'fore{side}', f'arm{side}', E, self.ang(E, Wr), math.dist(E, Wr))
        # the left hand points down the putter, so turning it turns the club
        local('handL', 'foreL', j['wristL'], self.ang(j['grip'], j['head']), math.dist(j['wristL'], j['grip']))
        local('club', 'handL', j['grip'], self.ang(j['grip'], j['head']), math.dist(j['grip'], j['head']))
        local('handR', 'foreR', j['wristR'], self.ang(j['wristR'], (472, 640)), 80)
        for side in 'LR':
            local(f'tgt{side}', 'torso', j[f'wrist{side}'], 0.0)
        # the ball sits on the ground in front of him until a swing sends it
        local('ball', 'root', (250, 876), 0.0)
        # an empty bone for the second track (see build_golfer_swing.mjs)
        local('beat', 'root', piv['root'], 0.0)
        self.world = world
        # bend each elbow the way it is drawn
        self.bend = {side: ((self.ang(j[f'elbow{side}'], j[f'wrist{side}']) - self.ang(j[f'shoulder{side}'], j[f'elbow{side}']) + 540) % 360 - 180) > 0 for side in 'LR'}

    def row_height(self):
        return max(h for _, _, _, h in self.boxes.values()) + 4

    def pack(self, page, y0):
        txt = ''
        x = 2
        for name in self.order:
            img = Image.open(self.folder / 'parts' / f'{name}.png').convert('RGBA')
            page.alpha_composite(img, (x, y0 + 2))
            txt += f'part_{name}\nbounds:{x},{y0 + 2},{img.width},{img.height}\nindex:-1\n'
            x += img.width + 4
        assert x <= page.width, 'the cut pieces do not fit one row of the atlas'
        return txt

    def rig_slots(self, rig):
        skin = rig['skins'][0]['attachments']
        for name in self.order:
            p, a = self.world[name]
            bx, by_, w, h = self.boxes[name]
            # each piece where it was cut from; the ball centred on its bone
            cx, cy = p if name == 'ball' else (bx + w / 2, by_ + h / 2)
            dx, dy = to_spine((cx, cy))[0] - to_spine(p)[0], to_spine((cx, cy))[1] - to_spine(p)[1]
            c, s_ = math.cos(math.radians(-a)), math.sin(math.radians(-a))
            slot = {'name': name, 'bone': name}
            if name != 'ball':  # hidden until a swing shows it
                slot['attachment'] = f'part_{name}'
            rig['slots'].append(slot)
            att = {'x': round(dx * c - dy * s_, 3), 'y': round(dx * s_ + dy * c, 3), 'width': w, 'height': h}
            if abs(a) > 1e-6:
                att['rotation'] = round(-a, 3)
            skin[name] = {f'part_{name}': att}
        if not self.ik_arms:
            return
        rig['ik'] = [
            {'name': f'ik{side}', 'order': i, 'bones': [f'arm{side}', f'fore{side}'], 'target': f'tgt{side}', 'bendPositive': self.bend[side], 'softness': 2}
            for i, side in enumerate(self.ik_arms)
        ]


def build(game, cast):
    global LAUGH
    app = next(APPS.glob(f'{game}Monkey*'))
    theme = game.lower()
    s = SPEC[(theme, cast)]
    LAUGH = json.loads((app / 'src/game/laughTiming.json').read_text(encoding='utf-8'))
    folder = app / 'design/source' / theme / 'cast' / cast
    cut = Cut(folder / s['cut']) if s.get('cut') else None
    if cut:
        s = dict(s, ik_arms=cut.ik_arms)
    cels = folder / s['cut'] / 'cels' if cut else folder / 'registered'
    full = Image.open(cels / 'neutral.png' if cut else folder / 'normalized.png').convert('RGBA')
    expr = EXPR
    if 'teeth_split' in s:
        # the toothy laugh: laugh_peak's squeezed eyes over grin's bared teeth,
        # crossfaded over 8px below the nose (the cels are registered)
        peak = np.asarray(Image.open(cels / 'laugh_peak.png').convert('RGBA'), float)
        grin = np.asarray(Image.open(cels / 'grin.png').convert('RGBA'), float)
        y = np.arange(H, dtype=float)[:, None, None]
        k = np.clip((y - (s['teeth_split'] - 4)) / 8, 0, 1)
        k = k * k * (3 - 2 * k)
        Image.fromarray((peak * (1 - k) + grin * k).round().astype(np.uint8)).save(cels / 'laugh_teeth.png')
        expr = EXPR + ('laugh_teeth',)
    sp = [p for p, _, _ in s['spine']]

    # bones: (name, parent, pivot on the canvas)
    piv = {'root': ROOT, 'hip': sp[1], 'torso': sp[1], 'head': sp[3]}
    par = {'hip': 'root', 'torso': 'hip', 'head': 'torso'}
    for side in 'LR':
        lg, ar = s['legs'][side], s['arms'][side]
        if side in s.get('ik_arms', ()):
            ar = [cut.j[f'shoulder{side}'], cut.j[f'elbow{side}']]
        piv[f'leg{side}'], par[f'leg{side}'] = lg[0], 'hip'
        piv[f'shin{side}'], par[f'shin{side}'] = lg[1], f'leg{side}'
        piv[f'arm{side}'], par[f'arm{side}'] = ar[0], 'torso'
        piv[f'fore{side}'], par[f'fore{side}'] = ar[1], f'arm{side}'
    for a in s['apps']:
        piv[a['name']], par[a['name']] = a['pivot'], a['parent']
    order = ['root', 'hip', 'torso', 'head', 'armL', 'foreL', 'armR', 'foreR', 'legL', 'shinL', 'legR', 'shinR'] + [a['name'] for a in s['apps']]
    bones = []
    for n in order:
        x, y = to_spine(piv[n])
        b = {'name': n}
        if n in par:
            px, py = to_spine(piv[par[n]])
            b.update(parent=par[n], x=round(x - px, 3), y=round(y - py, 3))
        a = next((a for a in s['apps'] if a['name'] == n), None)
        if a:
            b['length'] = round(math.dist(a['pivot'], a['tip']), 2)
        bones.append(b)
    if cut:
        cut.rig_bones(bones, piv)
    idx = {n: i for i, n in enumerate(order)}

    # mesh
    parts = build_parts(s)
    uvs, verts, tris = [], [], []
    owned = {}
    V_rest, V_w = [], []
    alpha = np.asarray(full)[..., 3]
    for r in range(ROWS + 1):
        for c in range(COLS + 1):
            x, y = W * c / COLS, H * r / ROWS
            uvs += [round(c / COLS, 6), round(r / ROWS, 6)]
            w = weights_at((x, y), parts, s['apps'])
            assert abs(sum(w.values()) - 1) < 1e-6, (x, y, w)
            verts.append(len(w))
            V_rest.append(to_spine((x, y)))
            V_w.append(w)
            for b, v in w.items():
                bx, by = to_spine(piv[b])
                sx, sy = to_spine((x, y))
                verts += [idx[b], round(sx - bx, 3), round(sy - by, 3), round(v, 6)]
            if alpha[min(H - 1, int(y)), min(W - 1, int(x))] > 40:
                dom = max(w, key=w.get)
                owned[dom] = owned.get(dom, 0) + 1
    for r in range(ROWS):
        for c in range(COLS):
            a = r * (COLS + 1) + c
            tris += [a, a + 1, a + COLS + 2, a, a + COLS + 2, a + COLS + 1]
    mesh = dict(type='mesh', uvs=uvs, triangles=tris, vertices=verts, hull=(COLS + ROWS) * 2, width=W, height=H)

    # atlas: the eight face cels
    page = Image.new('RGBA', ((W + 4) * 4, (H + 4) * math.ceil(len(expr) / 4) + (cut.row_height() if cut else 0)))
    atlas = f'monkey.png\nsize:{page.width},{page.height}\nfilter:Linear,Linear\npma:false\n'
    atts = {}
    for i, e in enumerate(expr):
        cel = Image.open(cels / f'{e}.png').convert('RGBA')
        x, y = (i % 4) * (W + 4) + 2, (i // 4) * (H + 4) + 2
        page.alpha_composite(cel, (x, y))
        region = 'figure' if e == 'neutral' else 'figure_' + e
        atlas += f'{region}\nbounds:{x},{y},{W},{H}\noffsets:0,0,{W},{H}\nindex:-1\n'
        atts[region] = dict(mesh, path=region)
    if cut:
        atlas += cut.pack(page, (H + 4) * math.ceil(len(expr) / 4))

    # ── the mesh budget: pose with the same skinning Spine does and measure
    # every inked triangle (rest area, >= 0.55x, <= 1.55x, no flips)
    rest = np.array(V_rest, float)
    B = len(order)
    Wm = np.zeros((len(rest), B))
    for i, w in enumerate(V_w):
        for b, v in w.items():
            Wm[i, idx[b]] = v
    T = np.array(tris).reshape(-1, 3)
    cu = (np.array(uvs).reshape(-1, 2)[T].mean(1) * [W - 1, H - 1]).astype(int)
    inked_t = alpha[cu[:, 1], cu[:, 0]] > 128
    T = T[inked_t]
    setup = np.array([to_spine(piv[n]) for n in order], float)

    def area(P):
        a, b, c = P[T[:, 0]], P[T[:, 1]], P[T[:, 2]]
        return (b[:, 0] - a[:, 0]) * (c[:, 1] - a[:, 1]) - (b[:, 1] - a[:, 1]) * (c[:, 0] - a[:, 0])

    A0 = area(rest)

    def skin(pose):
        mats = {}
        for n in order:
            r0, tx, ty, sx, sy = pose.get(n, (0, 0, 0, 1, 1))
            if n in par:
                lx, ly = setup[idx[n]] - setup[idx[par[n]]]
            else:
                lx, ly = setup[idx[n]]
            th = math.radians(r0)
            L = np.array([[math.cos(th) * sx, -math.sin(th) * sy, lx + tx], [math.sin(th) * sx, math.cos(th) * sy, ly + ty], [0, 0, 1]])
            mats[n] = mats[par[n]] @ L if n in par else L
        out = np.zeros_like(rest)
        for n in order:
            wcol = Wm[:, idx[n]]
            if not wcol.any():
                continue
            M = mats[n]
            loc = rest - setup[idx[n]]
            out += wcol[:, None] * (loc @ M[:2, :2].T + M[:2, 2])
        return out

    def worst(pose):
        r = area(skin(pose)) / A0
        return r.min(), r.max()

    def ok(lo, hi):
        return lo >= 0.58 and hi <= 1.5

    # each joint alone: how far it turns before the drawing gives
    limit = {}
    for n in order[1:]:
        lim = []
        for sgn in (-1, 1):
            a = 0.0
            while a < 30 and ok(*worst({n: (sgn * (a + 1), 0, 0, 1, 1)})):
                a += 1
            lim.append(a)
        limit[n] = (-lim[0], lim[1])
    print(game, cast, 'joint limits', {k: v for k, v in limit.items()})

    flut = motions(s, cast, theme)['flutter'][1]

    def scaled(fn, kb):
        """kb: an amplitude factor per bone (rotation, its translation, its scale)"""
        def g(t):
            d = fn(t)
            out = {}
            for b, (r0, tx, ty, sx, sy) in d.items():
                k = kb.get(b, 1.0)
                lo, hi = limit.get(b, (-30, 30))
                r0 = max(lo * 0.85, min(hi * 0.85, r0)) * k
                if b != 'root':
                    tx, ty = tx * k, ty * k
                out[b] = (r0, tx, ty, 1 + (sx - 1) * k, 1 + (sy - 1) * k)
            return out
        return g

    # animations, sampled at 30fps, each scaled down until it fits the mesh
    anims = {}
    tuned = {}
    anim_fn = {}
    for name, (dur, fn0) in motions(s, cast, theme).items():
        # shrink only the bones that break the drawing: find the worst triangle,
        # turn down whichever moving bone owns most of it, again
        kb = {}
        n = max(1, round(dur * 30))
        moving = sorted(set(b for j in range(n + 1) for b in fn0(dur * j / n)) - {'root'})

        def frame_pose(fn, t):
            pose = dict(fn(t))
            if name != 'flutter':
                for b, v in flut(t % 7.2).items():
                    r0, *rr = pose.get(b, (0, 0, 0, 1, 1))
                    pose[b] = (r0 + v[0], *rr)
            return pose

        def dev_of(pose):
            r = area(skin(pose)) / A0
            # a flipped triangle still ranks by how far it flipped, so turning a
            # bone down shows as progress before it unflips
            dev = np.where(r > 1e-3, np.maximum(1 / np.maximum(r, 1e-3), r), 1000 * (1 + 1e-3 - r))
            return float(dev.max()), r.min(), r.max()

        for it in range(80):
            fn = scaled(fn0, kb)
            worst_d, worst_t, lo, hi = 1.0, 0.0, 9, 0
            for j in range(n + 1):
                t = dur * j / n
                d_, a_, b_ = dev_of(frame_pose(fn, t))
                lo, hi = min(lo, a_), max(hi, b_)
                if d_ > worst_d:
                    worst_d, worst_t = d_, t
            if ok(lo, hi):
                break
            # which bone, turned down, helps the worst frame most
            best, gain = None, 0
            for b in moving:
                trial = dict(kb)
                trial[b] = trial.get(b, 1.0) * 0.8
                d_, *_ = dev_of(frame_pose(scaled(fn0, trial), worst_t))
                if worst_d - d_ > gain:
                    best, gain = b, worst_d - d_
            if best is None:
                import os
                if os.environ.get('DBG'):
                    pose = frame_pose(fn, worst_t)
                    r = area(skin(pose)) / A0
                    i = int(np.maximum(1 / np.maximum(r, 1e-3), r).argmax())
                    tw = Wm[T[i]].mean(0)
                    print('  stuck', name, f't={worst_t:.2f}', f'{r[i]:.2f}', [(order[b], round(tw[b], 2)) for b in np.argsort(-tw)[:4]], rest[T[i]].mean(0).round(), {b: tuple(round(x, 2) for x in v) for b, v in pose.items()})
                break
            kb[best] = kb.get(best, 1.0) * 0.8
        k = min(kb.values()) if kb else 1.0
        fn = scaled(fn0, kb)
        tuned[name] = (f'{lo:.2f}..{hi:.2f}', {b: round(v, 2) for b, v in kb.items()})
        tl = {}
        n = max(2, round(dur * 30))
        for k in range(n + 1):
            t = dur * k / n
            pose = fn(t)
            for b in order:
                r0, tx, ty, sx, sy = pose.get(b, (0, 0, 0, 1, 1))
                ch = tl.setdefault(b, {'rotate': [], 'translate': [], 'scale': []})
                ch['rotate'].append({'time': round(t, 4), 'value': round(r0, 3)})
                ch['translate'].append({'time': round(t, 4), 'x': round(tx, 3), 'y': round(ty, 3)})
                ch['scale'].append({'time': round(t, 4), 'x': round(sx, 4), 'y': round(sy, 4)})
        # drop channels that never leave rest
        out = {}
        for b, chs in tl.items():
            keep = {}
            if any(abs(k['value']) > 1e-3 for k in chs['rotate']):
                keep['rotate'] = chs['rotate']
            if any(abs(k['x']) > 1e-3 or abs(k['y']) > 1e-3 for k in chs['translate']):
                keep['translate'] = chs['translate']
            if any(abs(k['x'] - 1) > 1e-4 or abs(k['y'] - 1) > 1e-4 for k in chs['scale']):
                keep['scale'] = chs['scale']
            if keep:
                out[b] = keep
        if cut:
            # the IK arms' motion is the app's design/swing/ script's
            out = {b: v for b, v in out.items() if not (b[-1] in cut.ik_arms and b[:-1] in ('arm', 'fore'))}
        anim = {'bones': out}
        if name != 'flutter':
            anim['slots'] = {'figure': {'attachment': face_keys(name, dur, 'laugh_teeth' in expr, s.get('teeth_hold', False))}}
        anims[name] = anim

    rig = {'skeleton': {'spine': '4.2.40', 'width': W, 'height': H, 'x': -280, 'y': 0},
           'bones': bones, 'slots': [{'name': 'figure', 'bone': 'root', 'attachment': 'figure'}],
           'skins': [{'name': 'default', 'attachments': {'figure': atts}}], 'animations': anims}
    if cut:
        cut.rig_slots(rig)
    out = app / 'static/assets/spines' / ('sushiMaster' if cast == 'mg' else 'sushiApprentice')
    page.save(out / 'monkey.png')
    (out / 'monkey.atlas').write_text(atlas)
    (out / 'monkey.json').write_text(json.dumps(rig, separators=(',', ':')))
    meta = {'_note': 'Continuous mesh, weights from measured chains (wp/tools/build_cast_mesh.py, cast_mesh_spec.py), 2026-10-17.',
            'out': out.name, 'root': ROOT, 'flow': [{'name': a['name'], 'links': 1} for a in s['apps']],
            'canvas': [W, H], 'bones': {n: list(piv[n]) for n in order}}
    (app / 'design/source' / cast / 'rig.json').write_text(json.dumps(meta, indent=2))
    print(game, cast, "tuned", tuned)


if __name__ == '__main__':
    g = sys.argv[1]
    for c in (sys.argv[2:] or ['mg', 'fg']):
        build(g, c)
