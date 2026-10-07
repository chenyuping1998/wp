# -*- coding: utf-8 -*-
"""
The core: one mesh, a bone chain, linear blend skinning, and a renderer.

The whole design rests on one decision. A character cut into rigid layers ALWAYS
separates at a joint when it rotates -- the pixels on one side move and the ones
on the other side do not, so a wedge of nothing opens between them. That is
geometry, not craftsmanship, and no amount of care removes it.

So the figure is not cut. A single grid mesh is laid over the whole image and
the bones deform it. Every vertex is influenced by several bones with a smooth
falloff, so the mesh stretches where a cut-out would tear. There is no seam
because there is no boundary. That is what makes "no visible seams" structural
rather than something to be careful about.

The reference game does the same thing, and the numbers say so: 86% of the
vertices in `character_main_guy` are bound to more than one bone, up to six on
the chain. Only two attachments in the whole character are rigid, and both are
tiny end pieces (5 and 6 vertices) at places that never bend.

Cut-out layers still exist, in parts.py, but only for things that need to be in
front of or behind the body -- a held object, hair over a face. Those are the
cases where a cut is unavoidable, and they are also the cases where the part
hangs free and there is nothing behind it to uncover.
"""
from __future__ import print_function
import json
import numpy as np


# --------------------------------------------------------------------------
# rig construction
# --------------------------------------------------------------------------

def silhouette(img):
    """alpha mask of the figure"""
    return np.asarray(img)[..., 3] > 8


def figure_box(mask):
    ys, xs = np.where(mask)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def centre_line(mask, ys):
    """horizontal centroid of the silhouette at each of the given rows"""
    out = []
    H = mask.shape[0]
    for y in ys:
        lo, hi = max(0, int(y) - 6), min(H, int(y) + 7)
        band = mask[lo:hi]
        xs = np.where(band.any(0))[0]
        out.append(float((xs.min() + xs.max()) / 2.0) if len(xs) else np.nan)
    out = np.array(out)
    # a row that misses the figure entirely borrows its neighbours
    if np.isnan(out).any():
        idx = np.arange(len(out))
        good = ~np.isnan(out)
        out[~good] = np.interp(idx[~good], idx[good], out[good])
    return out


DEFAULT_CHAIN = ['root', 'hips', 'waist', 'chest', 'neck', 'head']


def build_bones(mask, names=None, top_pad=0.04):
    """A vertical chain from the feet up.

    Six joints is enough for an idle: the sway lives in hips->chest and the
    head leads it. More joints do not add life, they add ways to go wrong.
    """
    names = names or DEFAULT_CHAIN
    x0, y0, x1, y1 = figure_box(mask)
    h = y1 - y0
    n = len(names)
    # root at the feet, last joint just inside the top of the head
    ys = np.linspace(y1 - 1, y0 + h * top_pad, n)
    xs = centre_line(mask, ys)
    bones = []
    for i, nm in enumerate(names):
        bones.append({'name': nm, 'x': float(xs[i]), 'y': float(ys[i]),
                      'parent': i - 1})
    return bones


def grid_mesh(size, cols=16, rows=40):
    """A plain rectangular grid over the whole image.

    Over the WHOLE image, not just the silhouette: the transparent cells deform
    along with everything else and cost nothing, and using the full rectangle
    means there is no outline to triangulate and no chance of a hole.
    """
    W, H = size
    xs = np.linspace(0, W, cols + 1)
    ys = np.linspace(0, H, rows + 1)
    verts = np.array([[x, y] for y in ys for x in xs], dtype=np.float64)
    tris = []
    stride = cols + 1
    for r in range(rows):
        for c in range(cols):
            a = r * stride + c
            b = a + 1
            d = a + stride
            e = d + 1
            tris.append((a, b, d))
            tris.append((b, e, d))
    return verts, np.array(tris, dtype=np.int32)


def smoothstep(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3 - 2 * t)


def bone_weights(verts, bones, softness=1.6, plant=None, plant_ramp=0.10):
    """Weight every vertex over the chain by height, with a soft overlap.

    Height alone is the right variable for a chain that runs up the body: a
    vertex at chest height should follow the chest, and blend into the waist
    below and the neck above. `softness` widens that blend past the immediate
    neighbours -- at 1.6 a vertex is typically touched by three or four bones,
    which is the same spread the reference character uses.

    The weights are what make this seamless. Two vertices either side of an
    imaginary joint line get almost the same weights, so they move almost
    together; the mesh shears instead of splitting.
    """
    by = np.array([b['y'] for b in bones])
    order = np.argsort(-by)                      # feet first, head last
    span = abs(by.max() - by.min()) / max(1, len(bones) - 1)
    sigma = span * softness
    W = np.zeros((len(verts), len(bones)))
    for j, b in enumerate(bones):
        d = np.abs(verts[:, 1] - b['y'])
        W[:, j] = smoothstep(1.0 - d / (sigma * 2.0))
    # a vertex above the head or below the feet still needs an owner
    dead = W.sum(1) <= 1e-6
    if dead.any():
        nearest = np.argmin(np.abs(verts[dead][:, None, 1] - by[None, :]), axis=1)
        W[np.where(dead)[0], nearest] = 1.0
    W /= W.sum(1, keepdims=True)

    # Plant the feet. Without this the waist still has a little influence down
    # at the shoes and the figure slides as it sways -- small, but a standing
    # character whose feet drift is the thing people notice without being able
    # to say why. Below `plant` the vertices are pure root; above it they ramp
    # back to the skinned weights over `plant_ramp` of the figure's height.
    if plant is not None:
        span = abs(by.max() - by.min())
        k = smoothstep((plant - verts[:, 1]) / max(1.0, span * plant_ramp))
        k = np.clip(k, 0.0, 1.0)[:, None]            # 1 above the line, 0 below
        root = np.zeros_like(W)
        root[:, 0] = 1.0
        W = W * k + root * (1 - k)
        W /= W.sum(1, keepdims=True)
    return W, order


def build_rig(img, cols=16, rows=40, names=None, softness=1.6, plant=0.06):
    mask = silhouette(img)
    bones = build_bones(mask, names)
    verts, tris = grid_mesh(img.size, cols, rows)
    x0, y0, x1, y1 = figure_box(mask)
    plant_y = y1 - (y1 - y0) * plant if plant else None
    W, _ = bone_weights(verts, bones, softness, plant_y)
    return {
        'size': list(img.size),
        'grid': [cols, rows],
        'bones': bones,
        'verts': verts.tolist(),
        'tris': tris.tolist(),
        'weights': W.tolist(),
        'plant_y': plant_y,
        'figure_box': [x0, y0, x1, y1],
    }


def _row_runs(row):
    xs = np.where(row)[0]
    if not len(xs):
        return []
    out, st, pv = [], xs[0], xs[0]
    for x in xs[1:]:
        if x > pv + 1:
            out.append((st, pv))
            st = x
        pv = x
    out.append((st, pv))
    return out


def find_arms(mask, min_rows=6):
    """Trace each arm's centre line from the rows where it is a separate run.

    An arm shows up as its own run of silhouette once there is daylight between
    it and the body. Walking those rows gives the centre line and the half-width
    for free, which is all the weighting needs. Rows where the arm is still
    merged with the torso are skipped -- the weights fade out up there anyway,
    because the shoulder has to stay part of the body.
    """
    x0, y0, x1, y1 = figure_box(mask)
    mid = (x0 + x1) / 2.0
    sides = {'l': [], 'r': []}
    for y in range(y0, y1):
        rr = _row_runs(mask[y])
        if len(rr) < 2:
            continue
        a, b = rr[0], rr[-1]
        if (a[0] + a[1]) / 2.0 < mid - (x1 - x0) * .08:
            sides['l'].append((y, (a[0] + a[1]) / 2.0, (a[1] - a[0]) / 2.0))
        if (b[0] + b[1]) / 2.0 > mid + (x1 - x0) * .08:
            sides['r'].append((y, (b[0] + b[1]) / 2.0, (b[1] - b[0]) / 2.0))
    out = {}
    for k, v in sides.items():
        v.sort()
        # Below the hips the LEGS are separate runs too, and they are lateral,
        # so a naive scan follows the arm into the leg and puts the hand at the
        # shoe. Split wherever the centre line jumps or rows are missing, and
        # keep the topmost segment -- the arm starts above the legs.
        segs, cur = [], []
        for i, p in enumerate(v):
            if cur and (p[0] - cur[-1][0] > 3 or abs(p[1] - cur[-1][1]) > 10):
                segs.append(cur)
                cur = []
            cur.append(p)
        if cur:
            segs.append(cur)
        segs = [sg for sg in segs if len(sg) >= min_rows]
        if not segs:
            continue
        sg = min(segs, key=lambda t: t[0][0])   # topmost: arms sit above legs
        out[k] = dict(ys=np.array([p[0] for p in sg], float),
                      cx=np.array([p[1] for p in sg], float),
                      r=np.array([p[2] for p in sg], float))
    return out


def add_arm_bones(rig, mask, parent='chest', reach_up=0.10, feather=0.55):
    """Give each arm its own two bones INSIDE the same mesh.

    No cutting. The arm is already part of the one mesh; all that changes is
    which bones pull those vertices. A vertex near an arm's centre line hands
    its weight over to the arm bones, and the handover fades to nothing at the
    shoulder, so the shoulder itself still belongs to the torso and the arm
    cannot detach from it -- there is no boundary for it to detach at.
    """
    arms = find_arms(mask)
    if not arms:
        return rig, []
    x0, y0, x1, y1 = rig['figure_box']
    FH = y1 - y0
    verts = np.asarray(rig['verts'])
    W = np.asarray(rig['weights'])
    names = [b['name'] for b in rig['bones']]
    pidx = names.index(parent) if parent in names else len(names) - 1
    added = []
    for side, a in arms.items():
        top, bot = a['ys'][0], a['ys'][-1]
        elbow_y = top + (bot - top) * .45
        shoulder_y = top - FH * reach_up
        sx = float(np.interp(shoulder_y, a['ys'], a['cx']))
        ex = float(np.interp(elbow_y, a['ys'], a['cx']))
        i0 = len(rig['bones'])
        rig['bones'].append({'name': 'arm_%s' % side, 'x': sx, 'y': float(shoulder_y),
                             'parent': pidx})
        rig['bones'].append({'name': 'fore_%s' % side, 'x': ex, 'y': float(elbow_y),
                             'parent': i0})
        added += ['arm_%s' % side, 'fore_%s' % side]

        # how much of each vertex the arm claims
        cx = np.interp(verts[:, 1], a['ys'], a['cx'])
        rr = np.interp(verts[:, 1], a['ys'], a['r'])
        near = smoothstep((rr * (1 + feather) - np.abs(verts[:, 0] - cx))
                          / np.maximum(rr * feather, 1.0))
        below = smoothstep((verts[:, 1] - shoulder_y) / max(1.0, FH * reach_up))
        above = smoothstep((bot + FH * .03 - verts[:, 1]) / max(1.0, FH * .03))
        claim = np.clip(near * below * above, 0, 1)[:, None]

        # inside the arm, blend upper vs forearm along its length
        t = smoothstep((verts[:, 1] - elbow_y) / max(1.0, (bot - top) * .45))
        arm_w = np.zeros((len(verts), len(rig['bones'])))
        arm_w[:, i0] = 1 - t
        arm_w[:, i0 + 1] = t
        W = np.hstack([W, np.zeros((len(verts), 2))])
        W = W * (1 - claim) + arm_w * claim
        W /= W.sum(1, keepdims=True)
    rig['weights'] = W.tolist()
    return rig, added


# --------------------------------------------------------------------------
# posing
# --------------------------------------------------------------------------

def bone_axes(bones):
    """Unit vector along each bone, pivot -> child (or parent -> self at a leaf).

    The rig stores a bone as a pivot and a parent, with no length or direction,
    because rotation about a pivot does not need one. Squash and stretch does:
    "along the bone" and "across the bone" are different directions and have to
    be scaled by different amounts, or the limb just gets bigger instead of
    getting longer.
    """
    child = {}
    for i, b in enumerate(bones):
        if b['parent'] >= 0:
            child.setdefault(b['parent'], i)
    axes = []
    for i, b in enumerate(bones):
        j = child.get(i)
        if j is not None:
            d = np.array([bones[j]['x'] - b['x'], bones[j]['y'] - b['y']], float)
        elif b['parent'] >= 0:
            p = bones[b['parent']]
            d = np.array([b['x'] - p['x'], b['y'] - p['y']], float)
        else:
            d = np.array([0.0, -1.0])
        n = np.linalg.norm(d)
        axes.append(d / n if n > 1e-9 else np.array([0.0, -1.0]))
    return axes


def bone_matrices(bones, angles_deg, offsets=None, scales=None, axes=None,
                  want_chain=False, inherit=None):
    """World 2x3 matrices for the chain, child inheriting parent.

    `offsets` adds a translation per bone. A translation on the root moves the
    whole figure with zero distortion -- no triangle changes shape at all -- so
    it is the one channel that has no amplitude ceiling. That is why the
    reference's reaction puts its biggest numbers there and not in joint
    rotation.

    `scales` is a per-bone `(along, across)` pair applied about the same pivot,
    in the bone's own frame: `along` stretches or compresses it end to end,
    `across` widens or narrows it. Unlike a rotation, this changes the shape of
    every triangle it touches, so it is NOT free -- the gate measures it. It is
    here because the reference's peak pose is mostly this: `arm_r` at 1.00x1.23,
    `arm_l_2` at 1.06x0.80, `biceps_r` at 1.52x1.56, against joint rotations
    that never exceed 20 deg.

    **Scale does not inherit by default.** A child composes against its parent's
    rotation and translation only. Letting it inherit was tried first and it
    inverts triangles at the far end of the chain: stretching an upper arm drags
    the forearm's whole frame with it, and the taper toward the wrist means those
    triangles are tiny and fold. Measured on the example, inheritance holds
    together only up to a sixth of the shipped amplitude.

    The reference does BOTH, and picks per bone. Down the right arm -- the one
    doing the big stretch -- it blocks inheritance at every joint:

        arm_r   (scales)  ->  arm_r_2   noScaleOrReflection
        arm_r_2 (scales)  ->  hand_r    noScale
        hand_r  (scales)  ->  fingers_r, big_finger_r   noScale

    while on the left it lets it through (`arm_l` scales, `arm_l_2` is
    `normal`), and the muscle bones `biceps_l` / `biceps_r` are normal children
    of the arms so their bulge rides along.

    `inherit` is that switch: a set of bone names whose scale DOES pass to their
    children. Default is none, which is what the shipped amplitudes were swept
    against.

    `want_chain` also returns that scale-free chain. Props use it: a prop is
    rigid, so inheriting a limb's squash and stretch would shear it. It gets
    its own stretch from REACTION_PROP instead.
    """
    if scales is not None and axes is None:
        axes = bone_axes(bones)
    mats = []      # what skins the mesh: includes this bone's own scale
    chain = []     # what children inherit: rotation and translation only
    for i, b in enumerate(bones):
        th = np.radians(angles_deg[i])
        c, s = np.cos(th), np.sin(th)
        px, py = b['x'], b['y']
        ox, oy = (offsets[i] if offsets else (0.0, 0.0))
        R = np.array([[c, -s], [s, c]])
        RS = R
        if scales is not None:
            sa, sc = scales[i]
            if sa != 1.0 or sc != 1.0:
                u = axes[i]
                A = np.array([[u[0], -u[1]], [u[1], u[0]]])   # bone frame
                RS = R @ A @ np.diag([sa, sc]) @ A.T

        def about(M):
            t = np.array([px, py]) - M @ np.array([px, py]) + np.array([ox, oy])
            return np.hstack([M, t.reshape(2, 1)])

        local_skin, local_chain = about(RS), about(R)
        # A bone whose name is in `inherit` passes its scale down; otherwise
        # its children compose against rotation and translation only.
        passes = inherit is not None and b['name'] in inherit
        if b['parent'] < 0:
            mats.append(local_skin)
            chain.append(local_skin if passes else local_chain)
        else:
            P = np.vstack([chain[b['parent']], [0, 0, 1]])
            mats.append((P @ np.vstack([local_skin, [0, 0, 1]]))[:2])
            chain.append((P @ np.vstack([local_skin if passes else local_chain,
                                         [0, 0, 1]]))[:2])
    return (mats, chain) if want_chain else mats


def pose(rig, angles_deg, offsets=None, scales=None, inherit=None):
    """Skinned vertex positions for a set of bone angles."""
    verts = np.asarray(rig['verts'])
    W = np.asarray(rig['weights'])
    mats = bone_matrices(rig['bones'], angles_deg, offsets, scales,
                         inherit=inherit)
    homo = np.hstack([verts, np.ones((len(verts), 1))])
    out = np.zeros_like(verts)
    for j, M in enumerate(mats):
        out += (homo @ M.T) * W[:, j:j + 1]
    return out


# --------------------------------------------------------------------------
# rendering
# --------------------------------------------------------------------------

def _bary_warp(src, dst_img, tri_src, tri_dst):
    """Inverse-map one triangle: for every destination pixel inside it, find the
    source pixel and sample bilinearly."""
    x0 = int(np.floor(tri_dst[:, 0].min()))
    x1 = int(np.ceil(tri_dst[:, 0].max())) + 1
    y0 = int(np.floor(tri_dst[:, 1].min()))
    y1 = int(np.ceil(tri_dst[:, 1].max())) + 1
    H, W = dst_img.shape[:2]
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(W, x1), min(H, y1)
    if x1 <= x0 or y1 <= y0:
        return
    yy, xx = np.mgrid[y0:y1, x0:x1]
    p = np.stack([xx.ravel(), yy.ravel()], 1).astype(np.float64)

    a, b, c = tri_dst
    T = np.array([[b[0] - a[0], c[0] - a[0]],
                  [b[1] - a[1], c[1] - a[1]]])
    det = T[0, 0] * T[1, 1] - T[0, 1] * T[1, 0]
    if abs(det) < 1e-9:
        return
    inv = np.array([[T[1, 1], -T[0, 1]], [-T[1, 0], T[0, 0]]]) / det
    uv = (p - a) @ inv.T
    u, v = uv[:, 0], uv[:, 1]
    inside = (u >= -1e-6) & (v >= -1e-6) & (u + v <= 1 + 1e-6)
    if not inside.any():
        return

    sa, sb, sc = tri_src
    su = sa[0] + u[inside] * (sb[0] - sa[0]) + v[inside] * (sc[0] - sa[0])
    sv = sa[1] + u[inside] * (sb[1] - sa[1]) + v[inside] * (sc[1] - sa[1])

    sh, sw = src.shape[:2]
    su = np.clip(su, 0, sw - 1.001)
    sv = np.clip(sv, 0, sh - 1.001)
    x0i, y0i = np.floor(su).astype(int), np.floor(sv).astype(int)
    fx, fy = (su - x0i)[:, None], (sv - y0i)[:, None]
    x1i, y1i = x0i + 1, y0i + 1
    val = (src[y0i, x0i] * (1 - fx) * (1 - fy) + src[y0i, x1i] * fx * (1 - fy)
           + src[y1i, x0i] * (1 - fx) * fy + src[y1i, x1i] * fx * fy)

    tgt = dst_img[y0:y1, x0:x1].reshape(-1, 4)
    tgt[inside] = val
    dst_img[y0:y1, x0:x1] = tgt.reshape(y1 - y0, x1 - x0, 4)


def render(rig, img, angles_deg, pad=0, prop_imgs=None, prop_angles=None,
           offsets=None, prop_scales=None, scales=None, inherit=None):
    """Deform `img` by the rig and return a new RGBA image.

    `prop_imgs` maps a prop name to its full-canvas RGBA image. Props are rigid
    -- they are not in the mesh -- so they are drawn by applying their parent
    bone's world matrix, and they are composited before or after the figure
    according to their `z`. That z-order is the whole reason they are separate:
    one continuous mesh cannot put a bat behind a hand and in front of a body.
    """
    from PIL import Image
    import props as _props
    src = np.asarray(img.convert('RGBA')).astype(np.float64)
    W, H = rig['size']
    dst = np.zeros((H + 2 * pad, W + 2 * pad, 4), np.float64)
    v0 = np.asarray(rig['verts'])
    v1 = pose(rig, angles_deg, offsets, scales, inherit) + pad
    for t in rig['tris']:
        _bary_warp(src, dst, v0[list(t)], v1[list(t)])
    figure = Image.fromarray(np.clip(dst, 0, 255).astype('uint8'), 'RGBA')
    if not prop_imgs:
        return figure

    _, chain = bone_matrices(rig['bones'], angles_deg, offsets, scales,
                             want_chain=True, inherit=inherit)
    back = Image.new('RGBA', figure.size, (0, 0, 0, 0))
    front = Image.new('RGBA', figure.size, (0, 0, 0, 0))
    for pr in rig.get('props', []):
        im = prop_imgs.get(pr['name'])
        if im is None:
            continue
        # The bone matrices are in unpadded figure coordinates. Shifting only
        # their translation is wrong once they rotate: the rotation would then
        # be taken about the padded origin. Conjugate instead --
        # T(pad) . M . T(-pad) -- so the same rotation happens about the same
        # point, expressed in the padded frame.
        M0 = np.array(chain[pr['parent']], float)
        M = M0.copy()
        M[:, 2] = M0[:, :2] @ np.array([-pad, -pad]) + M0[:, 2] + pad
        ang = (prop_angles or {}).get(pr['name'], 0.0)
        sc = (prop_scales or {}).get(pr['name'], 1.0)
        if sc != 1.0:
            # stretch about the pivot -- the reference smears its bat tip 3x on
            # the fast part of the reaction, which is what sells the speed
            S = np.array([[sc, 0, pr['pivot'][0] * (1 - sc)],
                          [0, sc, pr['pivot'][1] * (1 - sc)], [0, 0, 1]])
            inv = np.linalg.inv(S)
            im = im.transform(im.size, Image.AFFINE, tuple(inv[:2].flatten()),
                              resample=Image.BICUBIC)
        big = Image.new('RGBA', figure.size, (0, 0, 0, 0))
        big.alpha_composite(im, (pad, pad))
        (back if pr['z'] == 'behind' else front).alpha_composite(
            _props.render_prop(big, (pr['pivot'][0] + pad, pr['pivot'][1] + pad),
                               M, ang, figure.size))
    out = back
    out.alpha_composite(figure)
    out.alpha_composite(front)
    return out


def save_rig(rig, path):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(rig, f, separators=(',', ':'))


def load_rig(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)
