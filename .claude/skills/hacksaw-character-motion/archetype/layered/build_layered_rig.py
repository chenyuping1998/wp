"""Delivered layer PNGs + layers.json  ->  runtime manifest (one mesh per layer,
one shared skeleton).

    python archetype/layered/build_layered_rig.py <delivery_dir> [--out <dir>] [--cell 20]

<delivery_dir> holds what the brief asked for: every layer as a full-canvas
PNG (e.g. body.png, head.png, arm_l.png, arm_r.png, fingers_r.png,
prop_bat.png, dangle_chain.png), full.png, and layers.json (brief.py's
layers.template.json with the artist's real pivots filled in).

Writes <out>/layers.manifest.json:
    {version, size, figure_box, order, layers: [{name, texture, rig}]}
where every rig shares one bone list:
    root hips waist chest neck head arm_l fore_l arm_r fore_r
    + one bone per prop (child of the forearm that holds it)
    + one bone per dangle (child of the nearest of head/chest/hips)
Bone names match the game's castMotion tables, and a dangle's bone is named
after its layer, so `IDLE.dangle_chain` in the game drives `dangle_chain.png`.

Weights are by LAYER ROLE, which is the whole point of cutting the figure up:
    body     chest / waist / hips / root in bands down the torso -- NO arm bone
    head     chest below the collar, head above it (the hidden neck follows the torso)
    arm_X    arm_X on the upper arm, fore_X on the forearm, blended over the
             elbow by DISTANCE to the two segments (works for hanging, raised
             and crossed arms alike); the hand is all fore_X
    fingers  all fore_X (rigid with the hand)
    prop     all its own bone (rigid, follows the hand)
    dangle   its parent at the anchor, fading into its own bone along its length
So an arm can never pull the shirt with it, and the shirt can never bend an arm.
"""
import argparse, json, math, os
import numpy as np
from PIL import Image

ARMS = ('l', 'r')


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def seg_dist(p, a, b):
    p, a, b = map(np.asarray, (p, a, b))
    ab = b - a
    t = max(0.0, min(1.0, float(np.dot(p - a, ab) / max(np.dot(ab, ab), 1e-9))))
    return float(np.linalg.norm(p - (a + t * ab)))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('delivery')
    ap.add_argument('--out', default=None)
    ap.add_argument('--cell', type=float, default=20.0, help='mesh cell size in canvas px')
    ap.add_argument('--elbow-blend', type=float, default=65.0, help='half-width of the elbow blend, px')
    a = ap.parse_args()
    D = a.delivery
    out = a.out or D
    spec = json.load(open(os.path.join(D, 'layers.json'), encoding='utf-8'))
    W, H = spec['size']
    J = {k: tuple(v) for k, v in spec['joints'].items()}
    anchors = {k: tuple(v) for k, v in spec.get('anchors', {}).items()}
    order = spec['order']
    for need in ('neck', 'chest', 'hips', 'shoulder_l', 'shoulder_r', 'elbow_l', 'elbow_r', 'wrist_l', 'wrist_r'):
        if need not in J:
            raise SystemExit('layers.json joints is missing %r' % need)
    waist = J.get('waist', ((J['chest'][0] + J['hips'][0]) / 2, (J['chest'][1] + J['hips'][1]) / 2))
    feet = spec.get('feet_y', H - 40)

    images = {}
    for n in order:
        im = Image.open(os.path.join(D, n + '.png')).convert('RGBA')
        if im.size != (W, H):
            raise SystemExit('%s.png is %s, expected %dx%d' % (n, im.size, W, H))
        images[n] = im
    full = Image.new('RGBA', (W, H))
    for n in order:
        full.alpha_composite(images[n])
    box = full.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()

    bones = []

    def bone(name, p, parent, **kw):
        bones.append(dict(name=name, x=round(float(p[0]), 3), y=round(float(p[1]), 3), parent=parent, **kw))
        return len(bones) - 1
    root = bone('root', (J['hips'][0], feet), -1)
    hips = bone('hips', J['hips'], root)
    wst = bone('waist', waist, hips)
    chest = bone('chest', J['chest'], wst)
    neck = bone('neck', J['neck'], chest)
    # The head turns about a point in the lower skull, not about its top:
    # 30% of the way from the neck joint to the crown (Hard Time's rig, which
    # shipped, sits at 0.33).
    top = J.get('head_top', (J['neck'][0], J['neck'][1] - 200))
    bone('head', (J['neck'][0] + 0.3 * (top[0] - J['neck'][0]), J['neck'][1] + 0.3 * (top[1] - J['neck'][1])), neck)
    for s in ARMS:
        up = bone('arm_' + s, J['shoulder_' + s], chest)
        e, w = np.array(J['elbow_' + s]), np.array(J['wrist_' + s])
        ax = (w - e) / max(np.linalg.norm(w - e), 1e-9)
        bone('fore_' + s, e, up, axis=[round(float(ax[0]), 6), round(float(ax[1]), 6)])
    names = [b['name'] for b in bones]
    # props follow the forearm whose wrist is nearest their grip anchor
    for n in order:
        if n.startswith('prop_'):
            grip = anchors.get(n)
            if grip is None:
                raise SystemExit('anchors.%s (the grip point) is missing from layers.json' % n)
            s = min(ARMS, key=lambda s: math.dist(grip, J['wrist_' + s]))
            bone(n, grip, names.index('fore_' + s))
            names = [b['name'] for b in bones]
    for n in order:
        if n.startswith('dangle_'):
            at = anchors.get(n)
            if at is None:
                raise SystemExit('anchors.%s (where it hangs from) is missing from layers.json' % n)
            # hangs from whatever it is attached to: above the collar the head,
            # down to the waist the chest, below that the hips
            par = 'head' if at[1] < J['neck'][1] else 'chest' if at[1] < waist[1] else 'hips'
            bone(n, at, names.index(par))
            names = [b['name'] for b in bones]
    NB = len(bones)
    ix = {n: i for i, n in enumerate(names)}

    def body_w(x, y):
        w = [0.0] * NB
        cy, wy, hy = J['chest'][1], waist[1], J['hips'][1]
        if y < cy + 0.3 * (wy - cy):
            w[ix['chest']] = 1
        elif y < wy:
            t = smooth((y - (cy + 0.3 * (wy - cy))) / (0.7 * (wy - cy)))
            w[ix['chest']], w[ix['waist']] = 1 - t, t
        elif y < hy:
            t = smooth((y - wy) / max(hy - wy, 1))
            w[ix['waist']], w[ix['hips']] = 1 - t, t
        else:
            t = smooth((y - hy) / max(0.5 * (feet - hy), 1))
            w[ix['hips']], w[ix['root']] = 1 - t, t
        return w

    def head_w(x, y):
        w = [0.0] * NB
        t = smooth((J['neck'][1] + 20 - y) / 90)
        w[ix['chest']], w[ix['head']] = 1 - t, t
        return w

    def arm_w(s):
        S, E, Wr = J['shoulder_' + s], J['elbow_' + s], J['wrist_' + s]

        def f(x, y):
            w = [0.0] * NB
            du, df = seg_dist((x, y), S, E), seg_dist((x, y), E, Wr)
            t = smooth((du - df + a.elbow_blend) / (2 * a.elbow_blend))
            # beyond the wrist the hand is all forearm
            if seg_dist((x, y), Wr, Wr) < seg_dist((x, y), E, E) and np.dot(np.subtract((x, y), Wr), np.subtract(Wr, E)) > 0:
                t = 1.0
            w[ix['arm_' + s]], w[ix['fore_' + s]] = 1 - t, t
            return w
        return f

    def rigid(name):
        def f(x, y):
            w = [0.0] * NB
            w[ix[name]] = 1
            return w
        return f

    def dangle_w(n):
        b = bones[ix[n]]
        par = bones[b['parent']]['name']
        at = anchors[n]
        alpha = np.asarray(images[n].getchannel('A')) > 16
        ys, xs = np.nonzero(alpha)
        reach = float(np.max(np.hypot(xs - at[0], ys - at[1]))) if len(xs) else 100.0

        def f(x, y):
            w = [0.0] * NB
            t = smooth(math.hypot(x - at[0], y - at[1]) / max(reach * 0.6, 1))
            w[ix[par]], w[ix[n]] = 1 - t, t
            return w
        return f

    def weigher(n):
        if n == 'body':
            return body_w
        if n == 'head':
            return head_w
        if n.startswith('arm_'):
            return arm_w(n[-1])
        if n.startswith('fingers_'):
            return rigid('fore_' + n[-1])
        if n.startswith('prop_'):
            return rigid(n)
        if n.startswith('dangle_'):
            return dangle_w(n)
        raise SystemExit('unknown layer role: %s (expected body/head/arm_*/fingers_*/prop_*/dangle_*)' % n)

    layers = []
    for n in order:
        x0, y0, x1, y1 = images[n].getchannel('A').getbbox()
        x0, y0, x1, y1 = max(0, x0 - 4), max(0, y0 - 4), min(W, x1 + 4), min(H, y1 + 4)
        cols, rows = max(4, math.ceil((x1 - x0) / a.cell)), max(4, math.ceil((y1 - y0) / a.cell))
        f = weigher(n)
        verts, weights, tris = [], [], []
        for j in range(rows + 1):
            for i in range(cols + 1):
                x, y = x0 + (x1 - x0) * i / cols, y0 + (y1 - y0) * j / rows
                w = [v if v > 0.002 else 0.0 for v in f(x, y)]
                tot = sum(w)
                verts.append([round(x, 3), round(y, 3)])
                weights.append([round(v / tot, 6) for v in w])
        for j in range(rows):
            for i in range(cols):
                p = j * (cols + 1) + i
                tris += [[p, p + 1, p + cols + 1], [p + 1, p + cols + 2, p + cols + 1]]
        layers.append(dict(name=n, texture=n + '.png', rig=dict(size=[W, H], figure_box=list(box), verts=verts, tris=tris, weights=weights, bones=bones)))
    manifest = dict(version=1, archetype=spec.get('archetype'), size=[W, H], figure_box=list(box), order=order,
                    layers=layers, anatomical_sides=True)
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, 'layers.manifest.json')
    json.dump(manifest, open(path, 'w'), separators=(',', ':'))
    print('wrote %s  (%d layers, %d bones: %s)' % (path, len(layers), NB, ' '.join(names)))


if __name__ == '__main__':
    main()
