"""Build the Hard Time cast as Spine 4.2 skeletons (prisoner + warden).

Why Spine, and why built this way (2026-10-20):
  Xposed Studios' Iron Jaw (3 stars on Stake) was measured frame by frame and
  then its rig files were read: two boxers flanking the board, Spine 4.2, every
  attachment a mesh weighted to several bones, both legs on IK so the feet stay
  planted while the hips bob, hair / jacket / tie on physics chains, and an
  idle that keys only 9-13 bones. Everything else that reads as "fluid" is
  solved by the runtime. See
  wp/.claude/skills/game-reskin/references/iron-jaw-transcript.md.

  The first pass did this with Hard Time's coarse layers (preserved below as
  the source configurations). The current v2 build upgrades those configs via
  cast_spine_v2_config.py and consumes the 15/20 repaired, cropped layers from
  build_cast_spine_v2_layers.py. Arms, towel, accessories and the two leg
  segments are now independent attachments; the weighted-body heuristics below
  are retained for the original build and torso weighting only.

  The first pass used:
    - every layer becomes a weighted grid mesh (no rigid parts, no seams)
    - the body layer gets leg bones cut out of it by weight (hip -> knee ->
      ankle), on IK, feet pinned to the ground
    - things that should swing (prisoner's towel, warden's whistle, radio cord
      and key ring) get physics chains, weighted out of the layer they live in
    - motion tables are OUR numbers, written against Iron Jaw's measured ones
      (2.0 s idle, segment lag 0.067 s, 1.0 s reaction with a 0.1 s strike)

Output: static/assets/spines/htCast/<who>.{json,atlas,png}

  /Applications/anaconda3/bin/python3 design/build_cast_spine.py
"""

import json
import hashlib
import math
import os
import sys

import numpy as np
from PIL import Image

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAYERS = os.path.join(APP, "static/assets/castLayers")
OUT = os.path.join(APP, "static/assets/spines/htCast")

IDLE = 2.0  # seconds, shared clock (Iron Jaw: 2.00)
FPS = 30  # key density for sampled timelines
LAG = 0.067  # per chain segment (Iron Jaw: body .167 -> upper arm .233 -> fore .3)
CELL = 22  # mesh grid cell, art px
BOB = 16  # idle hip drop, art px (10 read stiff next to Iron Jaw's 18, 2026-10-21)


def smooth(e0, e1, v):
    t = min(1.0, max(0.0, (v - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


# ── characters ──────────────────────────────────────────────────────────────
# Canvas coordinates (1024x2048 art space, y down). Joints for the upper body
# come from the existing layered rigs; legs were measured off the body alpha
# (row scans, 2026-10-20).

PRISONER = {
    "name": "prisoner",
    "src": "prisoner_crossed",
    "dir": -1,  # board is to screen-left
    "root": (541, 1773),
    "bones": [
        # name, parent, head(x,y), tail(x,y) or None
        ("hips", "root", (541, 956), (541, 788)),
        ("waist", "hips", (541, 788), (541, 525)),
        ("chest", "waist", (541, 525), (541, 399)),
        ("neck", "chest", (541, 399), (541, 331)),
        ("head", "neck", (541, 331), (541, 190)),
        ("arms", "chest", (541, 640), (760, 640)),
        ("towel1", "chest", (705, 430), (735, 615)),
        ("towel2", "towel1", (735, 615), (752, 835)),
        ("leg_l", "hips", (440, 1000), (420, 1690)),
        ("foot_l", "root", (420, 1690), None),
        ("leg_r", "hips", (625, 1000), (705, 1690)),
        ("foot_r", "root", (705, 1690), None),
    ],
    "crotch": 1045,
    "legs": {"l": ("leg_l", "foot_l"), "r": ("leg_r", "foot_r")},
    "midline": 532,
    "torso": ["hips", "waist", "chest", "neck"],
    "order": ["body", "head"],
    "layer_bones": {"head": "head"},
    # swingers weighted out of the body layer: (chain, colour test, box)
    "swing": [(["towel1", "towel2"], "towel", (615, 395, 800, 860))],
    "arms_band": (300, 555, 800, 735),
    "physics": {"towel1": dict(rotate=0.55, damping=0.85, inertia=0.5, limit=60),
                "towel2": dict(rotate=0.75, damping=0.85, inertia=0.5, limit=60)},
}

WARDEN = {
    "name": "warden",
    "src": "warden",
    "dir": 1,  # board is to screen-right (he stands left of it, drawn facing right)
    "root": (495, 1875),
    "bones": [
        ("hips", "root", (495, 962), (495, 783)),
        ("waist", "hips", (495, 783), (495, 522)),
        ("chest", "waist", (495, 522), (495, 378)),
        ("neck", "chest", (495, 378), (491, 286)),
        ("head", "neck", (491, 286), (491, 120)),
        ("arm_l", "chest", (686, 479), (781, 772)),
        ("fore_l", "arm_l", (781, 772), (800, 1060)),
        ("arm_r", "chest", (363, 449), (236, 610)),
        ("fore_r", "arm_r", (236, 610), (317, 392)),
        ("bat", "fore_r", (317, 392), (230, 280)),
        ("whistle", "chest", (490, 545), (490, 665)),
        ("cord1", "chest", (628, 420), (640, 585)),
        ("cord2", "cord1", (640, 585), (650, 750)),
        ("keys", "hips", (300, 838), (300, 985)),
        ("leg_l", "hips", (395, 1000), (372, 1775)),
        ("foot_l", "root", (372, 1775), None),
        ("leg_r", "hips", (585, 1000), (668, 1775)),
        ("foot_r", "root", (668, 1775), None),
    ],
    "crotch": 1045,
    "legs": {"l": ("leg_l", "foot_l"), "r": ("leg_r", "foot_r")},
    "midline": 487,
    "torso": ["hips", "waist", "chest", "neck"],
    "order": ["arm_r", "prop_bat", "body", "arm_l", "dangle_chain", "head", "dangle_mask", "fingers_r"],
    "layer_bones": {"head": "head", "prop_bat": "bat", "fingers_r": "fore_r"},
    "arm_layers": {"arm_l": ("arm_l", "fore_l"), "arm_r": ("arm_r", "fore_r")},
    "chain_layers": {"dangle_chain": ["whistle"], "dangle_mask": ["cord1", "cord2"]},
    "swing": [(["keys"], "brass", (240, 815, 360, 1000))],
    "physics": {"whistle": dict(rotate=0.8, damping=0.8, inertia=0.6, limit=60),
                "cord1": dict(rotate=0.35, damping=0.85, inertia=0.5, limit=60),
                "cord2": dict(rotate=0.6, damping=0.85, inertia=0.5, limit=60),
                "keys": dict(rotate=1.0, damping=0.75, inertia=0.7, limit=80)},
}


# ── geometry helpers ─────────────────────────────────────────────────────────

class Skeleton:
    def __init__(self, cfg):
        self.cfg = cfg
        rx, ry = cfg["root"]
        self.toS = lambda x, y: (x - rx, ry - y)
        self.head = {"root": (0.0, 0.0)}
        self.rot = {"root": 0.0}
        self.length = {"root": 0.0}
        self.parent = {}
        self.order = ["root"]
        for name, parent, h, t in cfg["bones"]:
            hx, hy = self.toS(*h)
            self.head[name] = (hx, hy)
            self.parent[name] = parent
            if t is None:
                self.rot[name] = self.rot[parent]
                self.length[name] = 0.0
            else:
                tx, ty = self.toS(*t)
                self.rot[name] = math.degrees(math.atan2(ty - hy, tx - hx))
                self.length[name] = math.hypot(tx - hx, ty - hy)
            self.order.append(name)

    def local_of(self, bone, X, Y):
        hx, hy = self.head[bone]
        r = math.radians(-self.rot[bone])
        dx, dy = X - hx, Y - hy
        return dx * math.cos(r) - dy * math.sin(r), dx * math.sin(r) + dy * math.cos(r)

    def bones_json(self):
        out = [{"name": "root"}]
        for name in self.order[1:]:
            p = self.parent[name]
            px, py = self.head[p]
            hx, hy = self.head[name]
            r = math.radians(-self.rot[p])
            dx, dy = hx - px, hy - py
            lx = dx * math.cos(r) - dy * math.sin(r)
            ly = dx * math.sin(r) + dy * math.cos(r)
            b = {"name": name, "parent": p, "x": round(lx, 2), "y": round(ly, 2),
                 "rotation": round(self.rot[name] - self.rot[p], 3)}
            if self.length[name]:
                b["length"] = round(self.length[name], 2)
            out.append(b)
        return out


def seg_param(p, a, b):
    ax, ay = a
    bx, by = b
    vx, vy = bx - ax, by - ay
    L2 = vx * vx + vy * vy
    t = ((p[0] - ax) * vx + (p[1] - ay) * vy) / L2
    return t, math.sqrt(L2)


def chain_weights(cfg, chain, x, y, top_parent, fade=30):
    """Weights along a chain of bones, canvas point (x, y)."""
    pts = []
    bones = {b[0]: b for b in cfg["bones"]}
    for name in chain:
        _, _, h, t = bones[name]
        pts.append((name, h, t))
    # arc-length position along the chain
    acc = 0.0
    best = None
    for name, h, t in pts:
        u, L = seg_param((x, y), h, t)
        uc = min(1, max(0, u))
        px, py = h[0] + (t[0] - h[0]) * uc, h[1] + (t[1] - h[1]) * uc
        d = math.hypot(x - px, y - py)
        if best is None or d < best[0]:
            best = (d, acc + u * L)
        acc += L
    s = best[1]
    w = {}
    # parent region near the root of the chain
    wp = 1 - smooth(0, fade * 1.5, s)
    if wp > 0:
        w[top_parent] = wp
    rest = 1 - wp
    acc = 0.0
    lens = []
    for name, h, t in pts:
        lens.append(math.hypot(t[0] - h[0], t[1] - h[1]))
    joints = np.cumsum(lens)[:-1]
    # membership by arc length with blends at joints
    member = []
    for i, name in enumerate(chain):
        lo = joints[i - 1] if i > 0 else -1e9
        hi = joints[i] if i < len(joints) else 1e9
        m = smooth(lo - fade, lo + fade, s) * (1 - smooth(hi - fade, hi + fade, s))
        member.append(m)
    tot = sum(member) or 1.0
    for name, m in zip(chain, member):
        if m > 1e-3:
            w[name] = w.get(name, 0) + rest * m / tot
    return w


def torso_weights(sk, cfg, y):
    names = cfg["torso"]
    ys = [cfg["root"][1] - sk.head[n][1] for n in names]  # canvas y of each head
    w = {}
    if y >= ys[0]:
        return {names[0]: 1.0}
    if y <= ys[-1]:
        return {names[-1]: 1.0}
    for i in range(len(names) - 1):
        y0, y1 = ys[i], ys[i + 1]
        if y1 <= y <= y0:
            t = smooth(0, 1, (y0 - y) / (y0 - y1))
            w[names[i]] = 1 - t
            w[names[i + 1]] = t
            return w
    return {names[0]: 1.0}


def leg_weights(cfg, x, y):
    # One bone per leg, hip to ankle, on one-bone IK with compress + stretch.
    # A straight-standing figure that bobs flexes its knees TOWARD the camera,
    # which in 2D is the leg getting shorter, not a knee poking sideways: the
    # two-bone version bowed both knees out ~80px for an 18px hip drop.
    side = "l" if x < cfg["midline"] else "r"
    leg, foot = cfg["legs"][side]
    bones = {b[0]: b for b in cfg["bones"]}
    ankle = bones[leg][3]
    wf = smooth(ankle[1] - 25, ankle[1] + 35, y)
    return {foot: wf, leg: 1 - wf}


def colour_mask(rgb, kind):
    r, g, b = [rgb[..., i].astype(np.float32) for i in range(3)]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = (mx - mn) / (mx + 1e-3)
    if kind == "towel":
        return (mx > 150) & (sat < 0.22)
    if kind == "brass":
        return (r > g) & (g > b) & (sat > 0.25) & (mx > 80)
    raise ValueError(kind)


def dilate(m, r):
    out = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy <= r * r:
                out |= np.roll(np.roll(m, dy, 0), dx, 1)
    return out


def merge(*parts):
    w = {}
    for scale, d in parts:
        for k, v in d.items():
            w[k] = w.get(k, 0) + scale * v
    return w


def normalise(w, limit=4):
    items = sorted(((k, v) for k, v in w.items() if v > 1e-3), key=lambda kv: -kv[1])[:limit]
    tot = sum(v for _, v in items)
    return [(k, v / tot) for k, v in items]


# ── per-layer weighting ──────────────────────────────────────────────────────

def body_weigher(sk, cfg, swing_masks):
    crotch = cfg["crotch"]

    def f(x, y):
        wt = torso_weights(sk, cfg, y)
        wl = smooth(crotch - 70, crotch + 50, y)
        w = merge((1 - wl, wt), (wl, leg_weights(cfg, x, y))) if wl > 0 else wt
        if "arms_band" in cfg:
            x0, y0, x1, y1 = cfg["arms_band"]
            wa = smooth(y0, y0 + 40, y) * (1 - smooth(y1 - 40, y1, y)) * smooth(x0, x0 + 40, x) * (1 - smooth(x1 - 40, x1, x))
            if wa > 0:
                w = merge((1 - 0.85 * wa, w), (0.85 * wa, {"arms": 1.0}))
        for chain, mask, top in swing_masks:
            xi, yi = int(round(x)), int(round(y))
            if 0 <= yi < mask.shape[0] and 0 <= xi < mask.shape[1] and mask[yi, xi] > 0:
                ws = mask[yi, xi]
                w = merge((1 - ws, w), (ws, chain_weights(cfg, chain, x, y, top)))
        return w

    return f


def build_swing_masks(cfg, full_rgba):
    out = []
    bones = {b[0]: b for b in cfg["bones"]}
    for chain, kind, (x0, y0, x1, y1) in cfg.get("swing", []):
        m = np.zeros(full_rgba.shape[:2], bool)
        sub = full_rgba[y0:y1, x0:x1]
        m[y0:y1, x0:x1] = colour_mask(sub[..., :3], kind) & (sub[..., 3] > 40)
        # keep only below the chain's top joint
        top_y = bones[chain[0]][2][1]
        m[: int(top_y) + 8] = False
        m = dilate(m, 6)
        # soft edge: blur by box average
        f = m.astype(np.float32)
        k = 9
        pad = np.pad(f, k, mode="edge")
        cs = pad.cumsum(0).cumsum(1)
        s = (cs[2 * k:, 2 * k:] - cs[:-2 * k, 2 * k:] - cs[2 * k:, :-2 * k] + cs[:-2 * k, :-2 * k]) / (2 * k) ** 2
        s = np.clip(s[: f.shape[0], : f.shape[1]] * 1.6, 0, 1)
        out.append((chain, s, bones[chain[0]][1]))
    return out


# ── mesh building ────────────────────────────────────────────────────────────

def grid_mesh(alpha, crop, cell):
    """Grid over the layer's alpha bbox. Returns verts (canvas), uvs, tris."""
    cx, cy = crop[0], crop[1]
    a = alpha > 8
    ys, xs = np.nonzero(a)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    nx = max(2, int(math.ceil((x1 - x0) / cell)) + 1)
    ny = max(2, int(math.ceil((y1 - y0) / cell)) + 1)
    gx = np.linspace(x0, x1, nx)
    gy = np.linspace(y0, y1, ny)
    keep = np.zeros((ny - 1, nx - 1), bool)
    for j in range(ny - 1):
        for i in range(nx - 1):
            xa, xb = int(gx[i]) - 3, int(math.ceil(gx[i + 1])) + 3
            ya, yb = int(gy[j]) - 3, int(math.ceil(gy[j + 1])) + 3
            keep[j, i] = a[max(0, ya):yb, max(0, xa):xb].any()
    index = {}
    verts = []
    tris = []

    def vid(i, j):
        if (i, j) not in index:
            index[(i, j)] = len(verts)
            verts.append((gx[i], gy[j]))
        return index[(i, j)]

    for j in range(ny - 1):
        for i in range(nx - 1):
            if not keep[j, i]:
                continue
            a0, a1, a2, a3 = vid(i, j), vid(i + 1, j), vid(i + 1, j + 1), vid(i, j + 1)
            tris += [a0, a1, a2, a0, a2, a3]
    return [(float(x + cx), float(y + cy)) for x, y in verts], [int(i) for i in tris]


# ── motion ──────────────────────────────────────────────────────────────────

def wave(t, peak, period=IDLE):
    """0 at peak-half, 1 at peak: raised cosine, loops on `period`."""
    return 0.5 - 0.5 * math.cos(2 * math.pi * (t - peak + period / 2) / period)


def sample(fn, duration, loop):
    """Keys every 1/FPS with the exact slope at each key, emitted below as
    Spine bezier curves (cubic Hermite). The first version wrote dense LINEAR
    keys at 30 fps: velocity then changed every other frame on a 60 Hz screen,
    and the user saw the figures twitch (2026-10-21). With slopes the motion is
    C1-smooth at any frame rate."""
    n = int(round(duration * FPS))
    e = 1e-3

    def at(t):
        if loop:
            t = t % duration
        return fn(min(max(t, 0.0), duration))

    def slope(t):
        lo, hi = (t - e, t + e) if loop else (max(0.0, t - e), min(duration, t + e))
        a, b = at(lo), at(hi)
        if isinstance(a, tuple):
            return tuple((y - x) / (hi - lo) for x, y in zip(a, b))
        return (b - a) / (hi - lo)

    keys = []
    for i in range(n + 1):
        t = i / FPS
        tt = 0.0 if (loop and i == n) else t
        keys.append((round(t, 4), at(tt), slope(tt)))
    return keys


def _bez(t0, v0, m0, t1, v1, m1):
    h = t1 - t0
    return [round(t0 + h / 3, 4), round(v0 + m0 * h / 3, 3), round(t1 - h / 3, 4), round(v1 - m1 * h / 3, 3)]


def rot_track(keys):
    out = []
    for i, (t, v, m) in enumerate(keys):
        k = {"time": t, "value": round(v, 3)}
        if i + 1 < len(keys):
            t1, v1, m1 = keys[i + 1]
            k["curve"] = _bez(t, v, m, t1, v1, m1)
        out.append(k)
    return out


def tr_track(keys):
    out = []
    for i, (t, v, m) in enumerate(keys):
        k = {"time": t, "x": round(v[0], 2), "y": round(v[1], 2)}
        if i + 1 < len(keys):
            t1, v1, m1 = keys[i + 1]
            k["curve"] = _bez(t, v[0], m[0], t1, v1[0], m1[0]) + _bez(t, v[1], m[1], t1, v1[1], m1[1])
        out.append(k)
    return out


def idle_anim(cfg):
    d = cfg["dir"]
    lean = lambda t, lag=0.0: wave(t, 1.0 + lag)  # 0..1, deepest at t=1 (+lag)
    bones = {
        # hips drop BOB at t=1.0 (Iron Jaw body.y -18 on a bent-knee boxing stance;
        # ours stand straight, so less) and lean toward the board
        "hips": {
            "translate": tr_track(sample(lambda t: (0.0, -BOB * lean(t)), IDLE, True)),
            "rotate": rot_track(sample(lambda t: -d * 3.2 * lean(t), IDLE, True)),
        },
        # chest swings toward the board one segment later
        "chest": {
            "translate": tr_track(sample(lambda t: (d * 14 * (lean(t, LAG) - 0.5), 0.0), IDLE, True)),
            "rotate": rot_track(sample(lambda t: -d * 1.6 * lean(t, 2 * LAG), IDLE, True)),
        },
        # head counter-rotates (eyes stay on the board), two segments late
        # plus a small nod at twice the rate, so the head is not a plain pendulum
        "head": {"rotate": rot_track(sample(lambda t: d * 5.0 * (lean(t, 3 * LAG) - 0.5) + 1.1 * (wave(t, 0.35, IDLE / 2) - 0.5), IDLE, True))},
    }
    if cfg["name"] == "prisoner" and 'knee_targets' not in cfg:
        bones["arms"] = {
            "rotate": rot_track(sample(lambda t: -d * 1.2 * (lean(t, 3 * LAG) - 0.5), IDLE, True)),
            "translate": tr_track(sample(lambda t: (0.0, 3.5 * (0.5 - lean(t, 2 * LAG))), IDLE, True)),
        }
    else:
        # free arm hangs and trails; baton arm barely moves (it carries weight)
        bones["arm_l"] = {"rotate": rot_track(sample(lambda t: -d * 4.5 * (lean(t, 3 * LAG) - 0.5), IDLE, True))}
        bones["fore_l"] = {"rotate": rot_track(sample(lambda t: -d * 6.5 * (lean(t, 4 * LAG) - 0.5), IDLE, True))}
        bones["arm_r"] = {"rotate": rot_track(sample(lambda t: 2.4 * (lean(t, 3 * LAG) - 0.5), IDLE, True))}
        bones["fore_r"] = {"rotate": rot_track(sample(lambda t: -3.2 * (lean(t, 4 * LAG) - 0.5), IDLE, True))}
    if 'knee_targets' in cfg:
        if cfg['name'] == 'prisoner':
            # Each forearm now moves on its own; keep the crossed hands close.
            for name, amount in [('arm_r',1.0),('arm_l',-1.0),('fore_r',-1.4),('fore_l',1.4)]:
                bones[name] = {'rotate': rot_track(sample(lambda t,a=amount: a*(lean(t,3*LAG)-0.5), IDLE, True))}
        for target in cfg['knee_targets'].values():
            bones[target] = {'translate':tr_track(sample(lambda t:(0,-BOB*0.5*lean(t)),IDLE,True))}
    return {"bones": bones}


def pose_track(poses, duration=1.0):
    """poses: (time, value, ease). Each segment is written as ONE exact bezier:
    smoothstep is the cubic Hermite with zero end slopes, and the 'snap'
    ease-out 1-(1-u)^3 is the Hermite starting at slope 3*dv/h and landing at
    zero - so the strike keeps its shape without dense keys."""
    keys = []
    for i, (t, v, ease) in enumerate(poses):
        keys.append((t, v))
    out = []
    for i in range(len(poses)):
        t0, v0, _ = poses[i]
        if i + 1 == len(poses):
            out.append((t0, v0, None))
            break
        t1, v1, ease = poses[i + 1]
        out.append((t0, v0, (t1, v1, ease)))
    return out


def _pose_curve(t0, a, t1, b, ease):
    h = t1 - t0
    m0 = 3 * (b - a) / h if ease == "snap" else 0.0
    return [round(t0 + h / 3, 4), round(a + m0 * h / 3, 3), round(t1 - h / 3, 4), round(b, 3)]


def pose_rot(poses):
    out = []
    for t0, v0, nxt in pose_track(poses):
        k = {"time": round(t0, 4), "value": round(v0, 3)}
        if nxt:
            k["curve"] = _pose_curve(t0, v0, *nxt[:2], nxt[2])
        out.append(k)
    return out


def pose_tr(poses):
    out = []
    for t0, v0, nxt in pose_track(poses):
        k = {"time": round(t0, 4), "x": round(v0[0], 2), "y": round(v0[1], 2)}
        if nxt:
            t1, v1, ease = nxt
            k["curve"] = _pose_curve(t0, v0[0], t1, v1[0], ease) + _pose_curve(t0, v0[1], t1, v1[1], ease)
        out.append(k)
    return out


# Reaction timing, Iron Jaw `active`: 0.333 wind-up, 0.1 strike, hold to .667,
# recover by 1.0.
W, S, H, E = 0.333, 0.433, 0.667, 1.0


def react_anim(cfg, big=False):
    d = cfg["dir"]
    k = 1.35 if big else 1.0

    def keys(wind, strike, hold):
        return [(0.0, 0.0 if not isinstance(wind, tuple) else (0.0, 0.0), "ease"),
                (W, wind, "ease"), (S, strike, "snap"), (H, hold, "ease"),
                (E, 0.0 if not isinstance(wind, tuple) else (0.0, 0.0), "ease")]

    b = {}
    b["hips"] = {
        "translate": pose_tr(keys((-d * 8 * k, -8), (d * 30 * k, -16), (d * 27 * k, -15))),
        "rotate": pose_rot(keys(d * 1.8 * k, -d * 4.2 * k, -d * 3.8 * k)),
    }
    b["chest"] = {"rotate": pose_rot(keys(d * 1.5 * k, -d * 2.8 * k, -d * 2.4 * k))}
    b["head"] = {"rotate": pose_rot(keys(d * 6 * k, -d * 7 * k, -d * 6 * k))}
    if cfg["name"] == "prisoner" and 'knee_targets' not in cfg:
        # crossed arms: chest out on the wind-up, a hard shrug into the stare
        b["arms"] = {"rotate": pose_rot(keys(d * 1.5, -d * 2.5 * k, -d * 2.0 * k)),
                     "translate": pose_tr(keys((0.0, 4.0), (0.0, 9.0 * k), (0.0, 7.0 * k)))}
        b["neck"] = {"rotate": pose_rot(keys(d * 2.0, -d * 3.0 * k, -d * 2.5 * k))}
    elif cfg['name'] == 'warden':
        # The baton arm is drawn BEHIND the body, so a chop toward the board
        # disappears behind his chest (tried 10-20). Instead the baton lifts
        # off the shoulder and slaps back down, while the free arm - the one on
        # the board side, drawn in front - points at the reels.
        # (positive = counter-clockwise; the free arm hangs down-right, so
        # raising it toward the board is counter-clockwise)
        b["arm_r"] = {"rotate": pose_rot(keys(2 * k, -2 * k, -1 * k))}
        b["fore_r"] = {"rotate": pose_rot(keys(4 * k, -3 * k, -2 * k))}
        b["bat"] = {"rotate": pose_rot(keys(7 * k, -5 * k, -3 * k))}
        b["arm_l"] = {"rotate": pose_rot(keys(-d * 6, d * 36 * k, d * 32 * k))}
        b["fore_l"] = {"rotate": pose_rot(keys(-d * 6, d * 16 * k, d * 13 * k))}
    if 'knee_targets' in cfg:
        if cfg['name'] == 'prisoner':
            # Tighten, release, settle. Separate bones avoid stretching sleeves.
            for name,sign in [('arm_r',1),('arm_l',-1),('fore_r',-1),('fore_l',1)]:
                b[name] = {'rotate':pose_rot(keys(-sign*0.7,sign*2*k,sign*1.4*k))}
        else:
            # Forearm, hand and baton are in FRONT of the chest in v2.
            # Clockwise from the raised shoulder pose is a real downward chop.
            b['arm_r'] = {'rotate':pose_rot(keys(-7*k,12*k,9*k))}
            b['fore_r'] = {'rotate':pose_rot(keys(-12*k,42*k,35*k))}
            b['bat'] = {'rotate':pose_rot(keys(-8*k,22*k,16*k))}
            b['arm_l'] = {'rotate':pose_rot(keys(-2,8*k,6*k))}
            b['fore_l'] = {'rotate':pose_rot(keys(-2,5*k,3*k))}
            b['hand_l'] = {'rotate':pose_rot(keys(2,-7*k,-4*k))}
        for target in cfg['knee_targets'].values():
            b[target] = {'translate':pose_tr(keys((-d*4*k,-4),(d*15*k,-8),(d*13.5*k,-7.5)))}
    return {"bones": b}


# ── atlas ───────────────────────────────────────────────────────────────────

def pack(regions, width=1024):
    """regions: name -> PIL image. Shelf pack by height. Returns page, rects."""
    items = sorted(regions.items(), key=lambda kv: -kv[1].height)
    pad = 2
    x = y = shelf = 0
    rects = {}
    for name, im in items:
        if x + im.width + pad > width:
            x = 0
            y += shelf + pad
            shelf = 0
        rects[name] = (int(x), int(y), im.width, im.height)
        x += im.width + pad
        shelf = max(shelf, im.height)
    height = y + shelf
    h2 = 1
    while h2 < height:
        h2 *= 2
    page = Image.new("RGBA", (width, h2), (0, 0, 0, 0))
    for name, im in regions.items():
        px, py, _, _ = rects[name]
        page.paste(im, (px, py))
    return page, rects


# ── build ───────────────────────────────────────────────────────────────────

def source_fingerprint(src):
    manifest = json.load(open(os.path.join(src, 'layers.json')))
    digest = hashlib.sha256(json.dumps(manifest, sort_keys=True).encode())
    for layer in manifest['layers']:
        digest.update(open(os.path.join(src, layer['texture']), 'rb').read())
    return digest.hexdigest()[:16]

def build(cfg):
    sk = Skeleton(cfg)
    src = os.path.join(LAYERS, cfg["src"])
    manifest = json.load(open(os.path.join(src, "layers.json")))
    layers = {l["name"]: l for l in manifest["layers"]}
    W_, H_ = manifest["size"]

    # composite of every layer in canvas space (for colour masks)
    full = np.zeros((H_, W_, 4), np.uint8)
    imgs = {}
    for name in cfg["order"]:
        L = layers[name]
        im = Image.open(os.path.join(src, L["texture"])).convert("RGBA")
        crop = L.get("crop", [0, 0, W_, H_])
        imgs[name] = (im, crop)
        if name == "body" or name in cfg.get('torso_layers', []):
            arr = np.array(im)
            full[crop[1]:crop[1] + arr.shape[0], crop[0]:crop[0] + arr.shape[1]] = arr
    swing = build_swing_masks(cfg, full)

    regions = {}
    attachments = {}
    for name in cfg["order"]:
        im, crop = imgs[name]
        arr = np.array(im)
        alpha = arr[..., 3]
        ys, xs = np.nonzero(alpha > 8)
        bx0, by0, bx1, by1 = max(0, xs.min() - 2), max(0, ys.min() - 2), min(im.width, xs.max() + 3), min(im.height, ys.max() + 3)
        region = im.crop((bx0, by0, bx1, by1))
        regions[name] = region
        rcrop = tuple(int(v) for v in (crop[0] + bx0, crop[1] + by0, bx1 - bx0, by1 - by0))
        verts, tris = grid_mesh(np.array(region)[..., 3], rcrop, CELL)

        if name == "body" or name in cfg.get('torso_layers', []):
            weigher = body_weigher(sk, cfg, swing)
        elif name in cfg.get("arm_layers", {}):
            up, fore = cfg["arm_layers"][name]
            weigher = lambda x, y, up=up, fore=fore: chain_weights(cfg, [up, fore], x, y, "chest", fade=40)
        elif name in cfg.get("chain_layers", {}):
            ch = cfg["chain_layers"][name]
            weigher = lambda x, y, ch=ch: chain_weights(cfg, ch, x, y, "chest", fade=25)
        else:
            bone = cfg["layer_bones"][name]
            if bone == "head":
                neck_y = cfg["root"][1] - sk.head["neck"][1]
                weigher = lambda x, y, ny=neck_y: merge((1 - smooth(ny - 20, ny + 40, y), {"head": 1.0}), (smooth(ny - 20, ny + 40, y), {"neck": 1.0}))
            else:
                weigher = lambda x, y, bone=bone: {bone: 1.0}

        vdata = []
        uvs = []
        for (x, y) in verts:
            X, Y = sk.toS(x, y)
            ws = normalise(weigher(x, y))
            vdata.append(len(ws))
            for bone, w in ws:
                lx, ly = sk.local_of(bone, X, Y)
                vdata += [sk.order.index(bone), round(lx, 2), round(ly, 2), round(w, 4)]
            uvs += [round((x - rcrop[0]) / rcrop[2], 5), round((y - rcrop[1]) / rcrop[3], 5)]
        attachments[name] = {name: {
            "type": "mesh", "uvs": uvs, "triangles": tris, "vertices": vdata, "hull": 0,
            "width": rcrop[2], "height": rcrop[3],
        }}

    page, rects = pack(regions)
    os.makedirs(OUT, exist_ok=True)
    who = cfg["name"]
    page.save(os.path.join(OUT, f"{who}.png"), optimize=True)
    lines = [f"{who}.png", f"size:{page.width},{page.height}", "filter:Linear,Linear"]
    for name in cfg["order"]:
        x, y, w, h = rects[name]
        lines += [name, f"bounds:{x},{y},{w},{h}"]
    open(os.path.join(OUT, f"{who}.atlas"), "w").write("\n".join(lines) + "\n")

    fb = manifest["figure_box"]
    bx0, by1 = sk.toS(fb[0], fb[3])
    bx1, by0 = sk.toS(fb[2], fb[1])
    ik = []
    order = 0
    for side, (leg, foot) in cfg["legs"].items():
        targets = [(leg,foot)] if 'knee_targets' not in cfg else [
            (leg,cfg['knee_targets'][side]), (cfg['shins'][side],foot)]
        for bone,target in targets:
            ik.append({"name": f"ik_{bone}", "order": order, "bones": [bone], "target": target,
                       "compress": True, "stretch": True})
            order += 1
    physics = []
    for bone, p in cfg["physics"].items():
        physics.append({"name": f"phys_{bone}", "order": order, "bone": bone, **p})
        order += 1
    skel = {
        "skeleton": {"hash": who+'-'+source_fingerprint(src), "spine": "4.2.43", "x": round(bx0, 1), "y": round(by1, 1),
                     "width": round(bx1 - bx0, 1), "height": round(by0 - by1, 1), "images": "./"},
        "bones": sk.bones_json(),
        "slots": [{"name": n, "bone": "root", **({} if n == 'blink' else {"attachment": n})} for n in cfg["order"]],
        "ik": ik,
        "physics": physics,
        "skins": [{"name": "default", "attachments": attachments}],
        "animations": {
            "idle": idle_anim(cfg),
            "react": react_anim(cfg),
            "reactBig": react_anim(cfg, big=True),
            **({'blink':{'slots':{'blink':{'attachment':[
                {'time':0,'name':'blink'}, {'time':0.13,'name':None}]}}}} if 'blink' in cfg['order'] else {}),
        },
    }
    json.dump(skel, open(os.path.join(OUT, f"{who}.json"), "w"), separators=(",", ":"))
    nverts = sum(len(a[n]["uvs"]) // 2 for n, a in attachments.items())
    print(f"{who}: {len(sk.order)} bones, {len(cfg['order'])} meshes, {nverts} verts, "
          f"{len(ik)} ik, {len(physics)} physics, page {page.width}x{page.height}")


if __name__ == "__main__":
    from cast_spine_v2_config import upgrade
    which = sys.argv[1:] or ["prisoner", "warden"]
    for cfg in (PRISONER, WARDEN):
        if cfg["name"] in which:
            build(upgrade(cfg))
