"""The ninja's FLOWING ACCESSORIES — the headband tails, the sash end, the
braided cord and the banana charm — as their own weighted meshes on bone
chains with Spine physics, plus the apron's hem bones the body mesh is
weighted to (add_ninja_body_mesh.py).

Used by build_ninja_puppet.py:

    body_source, flow_parts = cut(body_source)     # before packing the atlas
    BONES                                            # appended to the skeleton
    add(rig, positions)                              # meshes, physics, `flutter`

WHY SEPARATE MESHES. The body is one continuous image on a coarse mesh (cells
~49px). A headband tail is ~40px thick and streams 250px off the head over
empty air; weighting the body grid there would give each tail one column of
cells and drag the air (and the ear) with it. Cut out, each accessory gets its
own fine grid weighted along its own chain, so the free end can swing 4-8x
what the body does — mesh-cast-rig §3: the body barely moves, the amplitude
goes to what hangs off it; each link ~2x the last and later.

WHAT IS BEHIND THEM. The tails hang over air: they are simply removed from the
body texture (with a short overlap at the root, where the tail mesh is
weighted to the head and both copies coincide). The sash end, the cord and the
charm hang over the apron: the apron under them is repainted (push-pull fill
of the surrounding cloth plus its grain from a neighbouring patch), so a swing
uncovers cloth, not a hole.

Coordinates: the source sheet's pixels (1024x1536, y down). Spine world is
(x - 512, 1510 - y); bones have no setup rotation, so a vertex's local
position for a bone is world minus the bone's world position.
"""
from __future__ import annotations

import math

import numpy as np
from PIL import Image, ImageFilter

SHEET = (1024, 1536)
H, W = SHEET[1], SHEET[0]
YY, XX = np.mgrid[0:H, 0:W]


def to_world(x: float, y: float) -> tuple[float, float]:
    return x - 512, 1510 - y


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def poly_mask(pts):
    from PIL import ImageDraw
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in pts], fill=255)
    return np.asarray(m) > 127


def dilate(mask, r):
    im = Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(2 * r + 1))
    return np.asarray(im) > 127


# --- the accessories, traced on the sheet -------------------------------------------
# Each chain: bone names root->tip and the polyline they sit on (sheet px).
TAIL_UP = [(436, 124), (380, 134), (330, 158), (285, 186), (222, 196)]
# the gap between the two tails: points above/left of it belong to the upper
# tail. Nearest-polyline ownership put the seam through the upper tail's end
# blob, where the two tails swinging apart folded the ink.
DIVIDER = [(440, 140), (360, 181), (300, 215), (262, 236), (240, 290)]
TAIL_LO = [(436, 150), (380, 196), (330, 236), (288, 262)]
SASH = [(624, 688), (618, 760), (610, 838)]
CORD = [(652, 690), (690, 728), (730, 764)]
CHARM_PIVOT = (512, 672)

PARTS = {
    # over air: cut, nothing to repaint
    'band_tails': dict(box=(190, 92, 446, 286), poly=[(446, 96), (446, 176), (300, 286), (270, 286), (190, 196), (190, 150), (300, 100)], repaint=False),
    # over the apron
    'sash_end': dict(box=(580, 684, 668, 852), poly=[(586, 690), (664, 690), (664, 850), (580, 850)], repaint=True, shift=(-74, 0)),
    'cord_end': dict(box=(640, 676, 748, 778), poly=[(640, 684), (668, 676), (748, 750), (742, 778), (712, 772), (640, 712)], repaint=True, shift=(0, 92)),
    'charm': dict(box=(446, 668, 540, 808), poly=[(498, 670), (528, 670), (540, 700), (540, 808), (446, 808), (446, 760), (490, 700)], repaint=True, shift=(-92, 0)),
}
# where the root of each over-air cut fades back into the body (the overlap)
TAIL_ROOT_X = (418, 436)


def _components(mask):
    """the largest 4-connected component of a mask"""
    ys, xs = np.nonzero(mask)
    if not len(ys):
        return None
    seen = np.zeros(mask.shape, bool)
    best = None
    for y0, x0 in zip(ys, xs):
        if seen[y0, x0]:
            continue
        stack, comp = [(y0, x0)], []
        seen[y0, x0] = True
        while stack:
            y, x = stack.pop()
            comp.append((y, x))
            for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= yy < mask.shape[0] and 0 <= xx < mask.shape[1] and mask[yy, xx] and not seen[yy, xx]:
                    seen[yy, xx] = True
                    stack.append((yy, xx))
        if best is None or len(comp) > len(best):
            best = comp
    out = np.zeros(mask.shape, bool)
    by, bx = zip(*best)
    out[list(by), list(bx)] = True
    return out


def part_mask(img: np.ndarray, name: str) -> np.ndarray:
    r, g, b, a = [img[..., k].astype(np.float32) for k in range(4)]
    spec = PARTS[name]
    inside = poly_mask(spec['poly'])
    if name in ('band_tails', 'sash_end', 'cord_end'):
        red = (r > 90) & (r > g * 1.6) & (r > b * 1.4)
        if name == 'band_tails':
            # the knot and the band round the head stay on the body
            red &= XX < TAIL_ROOT_X[1]
        m = red & inside & (a > 0)
    else:
        # the charm and its cord: the bright gold and red CORE, and only the dark
        # outline within 4px of it — the shadow under the sash is warm-dark too,
        # and came away as a bar across the top of the cord
        core = inside & (a > 0) & (r > 110) & (r > b + 40)
        m = inside & (a > 0) & (r > b + 12) & dilate(core, 4)
        # right under the sash, only the cord itself (its shade there is the sash's)
        m &= ~((YY < CHARM_PIVOT[1] + 14) & ((r + g + b) / 3 < 80))
        # one piece: the cord and the charm; drop stray warm flecks on the apron
        lab = _components(m)
        if lab is not None:
            m = lab
    # close pinholes, take the antialiased rim with it
    m = dilate(m, 2)
    m = ~dilate(~m, 1)
    m = dilate(m, 1) & inside & (a > 0)
    return m


def push_pull(rgb: np.ndarray, known: np.ndarray) -> np.ndarray:
    h, w = known.shape
    P = 1 << math.ceil(math.log2(max(h, w)))
    c = np.zeros((P, P, 3), np.float64)
    k = np.zeros((P, P), np.float64)
    c[:h, :w] = rgb * known[..., None]
    k[:h, :w] = known
    levels = []
    while c.shape[0] > 2:
        levels.append((c, k))
        n = c.shape[0] // 2
        c = c.reshape(n, 2, n, 2, 3).sum((1, 3))
        k = k.reshape(n, 2, n, 2).sum((1, 3))
    col = c / np.maximum(k, 1e-6)[..., None]
    for c2, k2 in reversed(levels):
        n = c2.shape[0]
        up = col.repeat(2, 0).repeat(2, 1)
        own = c2 / np.maximum(k2, 1e-6)[..., None]
        a = np.clip(k2, 0, 1)[..., None]
        col = own * a + up * (1 - a)
    return col[:h, :w]


def cut(body: Image.Image):
    """remove the accessories from the body sheet; returns (body, {name: (image, box)})"""
    img = np.array(body.convert('RGBA'))
    out = img.copy()
    parts = {}
    for name, spec in PARTS.items():
        m = part_mask(img, name)
        x0, y0, x1, y1 = spec['box']
        part = np.zeros_like(img)
        part[m] = img[m]
        parts[name] = (Image.fromarray(part[y0:y1, x0:x1]), spec['box'])
        if not spec['repaint']:
            # over air: gone from the body, except a short overlap at the root
            fade = smooth((XX - TAIL_ROOT_X[0]) / (TAIL_ROOT_X[1] - TAIL_ROOT_X[0]))
            keep = np.where(m, fade, 1.0)
            out[..., 3] = (out[..., 3] * keep).astype(np.uint8)
            continue
        # over the apron: repaint the cloth behind
        hole = dilate(m, 3)
        pad = 40
        bx0, by0, bx1, by1 = max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)
        rgb = img[by0:by1, bx0:bx1, :3].astype(np.float64)
        known = (~hole[by0:by1, bx0:bx1]) & (img[by0:by1, bx0:bx1, 3] > 200)
        low = push_pull(rgb, known)
        low = np.asarray(Image.fromarray(np.clip(low, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4)), np.float64)
        sx, sy = spec['shift']
        donor = img[by0 + sy:by1 + sy, bx0 + sx:bx1 + sx, :3].astype(np.float64)
        donor_low = np.asarray(Image.fromarray(donor.astype(np.uint8)).filter(ImageFilter.GaussianBlur(5)), np.float64)
        fill = np.clip(low + (donor - donor_low) * 0.9, 0, 255)
        soft = np.asarray(Image.fromarray(hole[by0:by1, bx0:bx1].astype(np.uint8) * 255).filter(ImageFilter.GaussianBlur(2)), np.float64)[..., None] / 255
        region = out[by0:by1, bx0:bx1, :3].astype(np.float64)
        out[by0:by1, bx0:bx1, :3] = np.clip(region * (1 - soft) + fill * soft, 0, 255).astype(np.uint8)
        out[by0:by1, bx0:bx1, 3] = np.where(hole[by0:by1, bx0:bx1], 255, out[by0:by1, bx0:bx1, 3])
    return Image.fromarray(out), parts


# --- the skeleton -------------------------------------------------------------------
def _angle(a, b) -> float:
    """world angle (degrees, Spine's y-up) from sheet point a to sheet point b"""
    return math.degrees(math.atan2(-(b[1] - a[1]), b[0] - a[0]))


def _chain(prefix: str, parent: str, pts) -> list[dict]:
    # PHYSICS NEEDS A LENGTH AND A DIRECTION. A rotate constraint swings the
    # bone's TIP; a zero-length bone pointing nowhere turned every translation
    # of the hip into an 85-degree fling. Each link points at the next point.
    return [
        {'name': f'{prefix}{i + 1}', 'parent': parent if i == 0 else f'{prefix}{i}', 'px': p,
         'angle': _angle(p, pts[i + 1]), 'length': math.dist(p, pts[i + 1])}
        for i, p in enumerate(pts[:-1])
    ]


# bones with their sheet position; build_ninja_puppet converts to local offsets
FLOW_BONES = (
    _chain('tailU', 'head', TAIL_UP)
    + _chain('tailL', 'head', TAIL_LO)
    + _chain('sash', 'hip', SASH)
    + _chain('cord', 'hip', CORD)
    + [{'name': 'charm', 'parent': 'hip', 'px': CHARM_PIVOT, 'angle': -90.0, 'length': 140.0}]
    # the apron's front panel and the two side flaps, for the body mesh
    + [
        {'name': 'apronF', 'parent': 'hip', 'px': (430, 760), 'angle': -90.0, 'length': 300.0},
        {'name': 'apronL', 'parent': 'hip', 'px': (300, 840), 'angle': -90.0, 'length': 220.0},
        {'name': 'apronR', 'parent': 'hip', 'px': (540, 860), 'angle': -90.0, 'length': 140.0},
    ]
)
SLOTS = ['band_tails', 'charm', 'sash_end', 'cord_end']


def bone_world(rig_bones, name):
    """world position and rotation (degrees) of a bone in setup pose"""
    idx = {b['name']: b for b in rig_bones}
    b = idx[name]
    if 'parent' not in b:
        return b.get('x', 0.0), b.get('y', 0.0), b.get('rotation', 0.0)
    px, py, pr = bone_world(rig_bones, b['parent'])
    c, s_ = math.cos(math.radians(pr)), math.sin(math.radians(pr))
    lx, ly = b.get('x', 0.0), b.get('y', 0.0)
    return px + c * lx - s_ * ly, py + s_ * lx + c * ly, pr + b.get('rotation', 0.0)


def to_local(rig_bones, name, wx, wy):
    """a world point in a bone's own (rotated) setup frame"""
    bx, by, br = bone_world(rig_bones, name)
    c, s_ = math.cos(math.radians(br)), math.sin(math.radians(br))
    dx, dy = wx - bx, wy - by
    return c * dx + s_ * dy, -s_ * dx + c * dy


def _polyline_param(p, pts):
    """distance to a polyline and arc-length fraction along it of the nearest point"""
    best, along, walked = 1e9, 0.0, 0.0
    total = sum(math.dist(a, b) for a, b in zip(pts[:-1], pts[1:]))
    for a, b in zip(pts[:-1], pts[1:]):
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy)
        t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (L * L)))
        d = math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1])
        if d < best:
            best, along = d, walked + t * L
        walked += L
    return best, along / total


def _side(pts, p):
    """signed distance to a polyline, + on its left (sheet coords, y down)"""
    best, sign = 1e9, 1.0
    for a, b in zip(pts[:-1], pts[1:]):
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy)
        t = max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (L * L)))
        d = math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1])
        if d < best:
            best = d
            sign = 1.0 if dx * (p[1] - a[1]) - dy * (p[0] - a[0]) < 0 else -1.0
    return best * sign


def _chain_weights(s: float, bones: list[str], root: str, root_fade: float) -> dict[str, float]:
    """hat functions along the chain (bone i owns s = i/n), the root share fading out"""
    n = len(bones)
    w = {}
    pos = s * n  # bone i sits at s = i/n; past the last bone the last owns it
    for i, name in enumerate(bones):
        w[name] = max(0.0, 1 - abs(pos - i)) if i < n - 1 else max(0.0, min(1.0, pos - (n - 2)))
    total = sum(w.values()) or 1.0
    w = {k: v / total for k, v in w.items()}
    r = float(1 - smooth(s / root_fade)) if root_fade > 0 else 0.0
    out = {k: v * (1 - r) for k, v in w.items()}
    out[root] = out.get(root, 0) + r
    return out


def _mesh(rig_bones, bone_index, box, cols, rows, weigh):
    x0, y0, x1, y1 = box
    width, height = x1 - x0, y1 - y0
    ring = [(c, 0) for c in range(cols)] + [(cols, r) for r in range(rows)] + [(c, rows) for c in range(cols, 0, -1)] + [(0, r) for r in range(rows, 0, -1)]
    inside = [(c, r) for r in range(1, rows) for c in range(1, cols)]
    order = ring + inside
    index = {p: i for i, p in enumerate(order)}
    uvs, verts, tris = [], [], []
    for c, r in order:
        x = x0 + width * c / cols
        y = y0 + height * r / rows
        wx, wy = to_world(x, y)
        uvs += [round(c / cols, 6), round(r / rows, 6)]
        ws = {k: v for k, v in weigh(x, y).items() if v > 1e-4}
        total = sum(ws.values())
        assert abs(total - 1) < 1e-3 or total > 0, (x, y, ws)
        verts.append(len(ws))
        for name, v in ws.items():
            lx, ly = to_local(rig_bones, name, wx, wy)
            verts += [bone_index[name], round(lx, 4), round(ly, 4), round(v / total, 6)]
    for r in range(rows):
        for c in range(cols):
            a, b = index[c, r], index[c + 1, r]
            d, e = index[c, r + 1], index[c + 1, r + 1]
            tris += [a, b, e, a, e, d]
    return {'type': 'mesh', 'uvs': uvs, 'triangles': tris, 'vertices': verts, 'hull': len(ring), 'width': width, 'height': height}


def add(rig: dict):
    bones = rig['bones']
    bone_index = {b['name']: i for i, b in enumerate(bones)}
    tailU = [b['name'] for b in FLOW_BONES if b['name'].startswith('tailU')]
    tailL = [b['name'] for b in FLOW_BONES if b['name'].startswith('tailL')]
    sash = [b['name'] for b in FLOW_BONES if b['name'].startswith('sash')]
    cord = [b['name'] for b in FLOW_BONES if b['name'].startswith('cord')]

    def weigh_tails(x, y):
        _, su = _polyline_param((x, y), TAIL_UP)
        _, sl = _polyline_param((x, y), TAIL_LO)
        ku = 1 / (1 + math.exp(_side(DIVIDER, (x, y)) / 12))
        wu = _chain_weights(su, tailU, 'head', 0.1)
        wl = _chain_weights(sl, tailL, 'head', 0.1)
        out = {}
        for k, v in wu.items():
            out[k] = out.get(k, 0) + v * ku
        for k, v in wl.items():
            out[k] = out.get(k, 0) + v * (1 - ku)
        return out

    def weigh_chain(pts, names, root, fade):
        return lambda x, y: _chain_weights(_polyline_param((x, y), pts)[1], names, root, fade)

    skin = rig['skins'][0]['attachments']
    skin['band_tails'] = {'band_tails': _mesh(bones, bone_index, PARTS['band_tails']['box'], 22, 16, weigh_tails)}
    skin['sash_end'] = {'sash_end': _mesh(bones, bone_index, PARTS['sash_end']['box'], 6, 14, weigh_chain(SASH, sash, 'hip', 0.12))}
    skin['cord_end'] = {'cord_end': _mesh(bones, bone_index, PARTS['cord_end']['box'], 9, 9, weigh_chain(CORD, cord, 'hip', 0.12))}
    # the charm swings rigidly from its cord: a plain mesh on one bone
    skin['charm'] = {'charm': _mesh(bones, bone_index, PARTS['charm']['box'], 4, 8, lambda x, y: {'charm': 1.0})}

    # PHYSICS: follow-through on top of the keyed flutter, every constraint its
    # own order (spine-physics-order: only the first runs otherwise). Stiffer at
    # the root, looser at the tip — each link later than the last.
    phys = []
    order = 0

    def constraint(bone, inertia, strength, damping, mass=1.5, x=0.0):
        nonlocal order
        c = {'name': f'{bone}_phys', 'order': order, 'bone': bone, 'rotate': 1, 'inertia': inertia, 'strength': strength, 'damping': damping, 'mass': mass}
        if x:
            c['x'] = x
        phys.append(c)
        order += 1

    for chain in (tailU, tailL):
        for i, name in enumerate(chain):
            constraint(name, 0.12 + 0.06 * i, 260 - 50 * i, 0.86)
    for chain in (sash, cord):
        for i, name in enumerate(chain):
            constraint(name, 0.18 + 0.1 * i, 300 - 80 * i, 0.85)
    constraint('charm', 0.3, 160, 0.85, mass=2)
    rig['physics'] = phys

    rig['animations']['flutter'] = flutter_animation(tailU, tailL, sash, cord)


def _loop(period: float, terms, n=24):
    """a seamless rotate timeline over `period` s: sum of (amp, cycles, phase)"""
    keys = []
    for i in range(n + 1):
        t = period * i / n
        v = sum(a * math.sin(2 * math.pi * (c * t / period) + ph) for a, c, ph in terms)
        keys.append({'time': round(t, 4), 'value': round(v, 3)})
    return keys


def flutter_animation(tailU, tailL, sash, cord):
    """TRACK 1, looping forever: the tails stream in a breeze, the sash and cord
    sway, the charm swings, the apron hem breathes. Every chain link has its own
    phase lag and ~2x its parent's amplitude (mesh-cast-rig §3). One 4.8s loop;
    the components inside it are 1, 2, 3 cycles so no two parts realign often."""
    P = 4.8
    bones = {}
    # the headband tails: streaming, big at the tips
    for chain, base, ph in ((tailU, 2.8, 0.0), (tailL, 2.5, 0.2)):
        for i, name in enumerate(chain):
            amp = base * (1.6 ** i)
            lag = ph + 0.55 * i
            bones[name] = {'rotate': _loop(P, [(amp, 2, lag), (amp * 0.35, 3, lag + 0.7), (amp * 0.2, 1, lag * 0.5)])}
    for chain, base, ph in ((sash, 3.2, 0.4), (cord, 3.8, 1.6)):
        for i, name in enumerate(chain):
            bones[name] = {'rotate': _loop(P, [(base * (1.7 ** i), 1, ph + 0.6 * i), (base * 0.4 * (1.7 ** i), 2, ph + 1.3 + 0.6 * i)])}
    bones['charm'] = {'rotate': _loop(P, [(6.0, 1, 2.2), (1.6, 3, 0.4)])}
    bones['apronF'] = {'rotate': _loop(P, [(0.9, 1, 0.9), (0.3, 2, 2.0)])}
    bones['apronL'] = {'rotate': _loop(P, [(1.2, 1, 0.2), (0.4, 3, 1.4)])}
    bones['apronR'] = {'rotate': _loop(P, [(1.1, 1, 2.6), (0.35, 2, 0.5)])}
    return {'bones': bones}
