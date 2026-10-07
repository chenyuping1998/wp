"""Acceptance check for a layered cast delivery (the brief's section 6, items 1-6).

    python archetype/layered/check_layered_art.py <delivery_dir> [--variants <dir> <dir> ...]
                                                  [--gap 48] [--runtime <dir>]

Reads <delivery_dir>/layers.json (order, size, joints, arms) and the layer PNGs.
layers.json may instead be the BUILT manifest (build_layered_rig.py's format,
which is what a game loads at runtime); the joints are then read off the bone
origins and both arms are treated as hanging unless it says otherwise.
Fails (exit 1) with a plain-language reason on the first broken rule; always
writes <delivery_dir>/delivery-check.json with every measurement.

    1. every layer is RGBA at exactly the canvas size; they stack to full.png
       pixel-for-pixel; a PSD beside them round-trips layer-for-layer
    2. body.png has no enclosed holes -- the torso behind the arms is painted
    3. each HANGING arm's forearm and hand keep >= --gap px from the body
    4. shoulder overlap >= 40 px, neck overlap >= 30 px (start values; the
       motion gate still has to show no seam at the extremes)
    5. every variant folder's layers have alpha identical to this one's
    6. every layer's edge is anti-aliased: at least half its contour pixels
       carry partial alpha. The mesh resamples each layer every frame, so a
       hard binary cut-out stair-steps the moment a limb turns. Flat styles
       (comic, noir, screenprint) are where this comes from: art drawn or
       palette-quantised at delivery size has 3-7 colours and a 0% soft edge;
       drawn at 2x and downscaled it keeps its flat look and gets the edge
       back. Fewer than 64 colours in a layer is reported as a warning.
    +  40 px of clear canvas on every side of the figure
"""
import argparse, glob, json, os, sys
import numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion, distance_transform_edt, label


def fail(msg):
    print('FAIL:', msg)
    sys.exit(1)


def spec_from_manifest(m):
    """A delivery folder can hold the BUILT manifest as its layers.json (the
    runtime format build_layered_rig.py writes: layers[].rig.bones, no joints)
    -- Hard Time's does, because the game loads that file and its delivery
    spec was never kept. The bone origins are the joints: arm_X sits on the
    shoulder, fore_X on the elbow, and fore_X's axis points down the forearm,
    which is all the forearm-clearance check needs from the wrist."""
    bones = {b['name']: b for b in m['layers'][0]['rig']['bones']}
    J = {n: [bones[n]['x'], bones[n]['y']] for n in ('hips', 'waist', 'chest', 'neck') if n in bones}
    for s in 'lr':
        if 'arm_' + s in bones:
            J['shoulder_' + s] = [bones['arm_' + s]['x'], bones['arm_' + s]['y']]
        f = bones.get('fore_' + s)
        if f:
            ax = f.get('axis', [0.0, 1.0])
            J['elbow_' + s] = [f['x'], f['y']]
            J['wrist_' + s] = [f['x'] + 100 * ax[0], f['y'] + 100 * ax[1]]
    return dict(m, joints=J)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('delivery')
    ap.add_argument('--variants', nargs='*', default=[])
    ap.add_argument('--gap', type=float, default=None, help='min forearm clearance, px (default 48 at 1024 wide)')
    ap.add_argument('--runtime', default=None, help='deployed copy that must be byte-identical')
    a = ap.parse_args()
    D = a.delivery
    spec = json.load(open(os.path.join(D, 'layers.json'), encoding='utf-8'))
    source = 'delivery spec'
    if 'joints' not in spec:
        if not spec.get('layers'):
            fail('layers.json has neither joints (a delivery spec) nor layers[].rig (a built manifest)')
        spec, source = spec_from_manifest(spec), 'built manifest (joints from bone origins)'
    W, H = spec['size']
    gap_min = a.gap if a.gap is not None else 48 * W / 1024
    order = spec['order']
    J = spec['joints']
    rep = dict(canvas=[W, H], order=order, spec=source)

    im = {}
    for n in order:
        p = os.path.join(D, n + '.png')
        if not os.path.exists(p):
            fail('%s.png is missing (layers.json lists it)' % n)
        x = Image.open(p)
        if x.mode != 'RGBA' or x.size != (W, H):
            fail('%s.png is %s %s; every layer must be RGBA %dx%d, in place on the full canvas' % (n, x.mode, x.size, W, H))
        im[n] = x
        if a.runtime and open(p, 'rb').read() != open(os.path.join(a.runtime, n + '.png'), 'rb').read():
            fail('%s.png in %s differs from the delivery' % (n, a.runtime))
    full = Image.new('RGBA', (W, H))
    for n in order:
        full.alpha_composite(im[n])
    fp = os.path.join(D, 'full.png')
    if os.path.exists(fp):
        if not np.array_equal(np.asarray(full), np.asarray(Image.open(fp).convert('RGBA'))):
            fail('the layers stacked in layers.json order do not reproduce full.png -- a layer moved, or the order is wrong')
        rep['composite'] = 'pixel-exact'
    psds = glob.glob(os.path.join(D, '*.psd'))
    if psds:
        try:
            from psd_tools import PSDImage
            psd = PSDImage.open(psds[0])
            # Turf War's cast.psd (written by pytoshop) reads back with every
            # layer name ending in a NUL; the name is otherwise right.
            names = [l.name.rstrip('\x00') for l in psd]
            if sorted(names) != sorted(order):
                fail('PSD layers %s do not match layers.json order %s' % (names, order))
            for l, name in zip(psd, names):
                pil = l.topil()
                canvas = Image.new('RGBA', (W, H))
                canvas.alpha_composite(pil.convert('RGBA'), (l.left, l.top))
                if not np.array_equal(np.asarray(canvas)[..., 3], np.asarray(im[name])[..., 3]):
                    fail('PSD layer %s does not match %s.png' % (name, name))
            rep['psd'] = 'layers match PNGs'
        except ImportError:
            rep['psd'] = 'not checked (pip install psd-tools)'

    A = {n: np.asarray(im[n])[..., 3] > 16 for n in order}
    body = A['body']
    # 2. holes in the body: transparent regions not connected to the border
    lab, k = label(~body)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    holes = [(i, int((lab == i).sum())) for i in range(1, k + 1) if i not in border]
    holes = [h for h in holes if h[1] > 200]
    if holes:
        ys, xs = np.nonzero(lab == max(holes, key=lambda h: h[1])[0])
        fail('body.png has %d unpainted hole(s); the largest (%d px) is around x=%d y=%d -- the torso behind the arms must be painted in full'
             % (len(holes), max(h[1] for h in holes), xs.mean(), ys.mean()))
    rep['body_holes'] = 0
    # 3 + 4. arms
    dist = distance_transform_edt(~body)
    arms = spec.get('arms', {})
    ys_i, xs_i = np.indices(body.shape)
    rep['arms'] = {}
    for s in ('l', 'r'):
        n = 'arm_' + s
        if n not in A:
            continue
        m = A[n]
        ov = (m & body).sum(axis=1).max()
        if ov < 40:
            fail('%s overlaps the torso by only %d px at the shoulder (need >= 40, painted under the seam)' % (n, ov))
        r = dict(shoulder_overlap_px=int(ov), kind=arms.get(s, 'hanging'))
        if arms.get(s, 'hanging') == 'hanging':
            E, Wr = np.array(J['elbow_' + s]), np.array(J['wrist_' + s])
            ax = (Wr - E) / max(np.linalg.norm(Wr - E), 1e-9)
            below = ((xs_i - E[0]) * ax[0] + (ys_i - E[1]) * ax[1]) > 0
            fm = m & below
            if fm.any():
                g = float(dist[fm].min())
                if g < gap_min:
                    ys, xs = np.nonzero(fm & (dist < gap_min))
                    fail('%s: forearm/hand comes within %.1f px of the body around x=%d y=%d (need >= %.0f) -- a hanging hand must not touch the body'
                         % (n, g, xs.mean(), ys.mean(), gap_min))
                r['forearm_clearance_px'] = round(g, 2)
        rep['arms'][n] = r
    if 'head' in A:
        rows = np.nonzero((A['head'] & body).any(axis=1))[0]
        depth = int(rows[-1] - rows[0] + 1) if len(rows) else 0
        if depth < 30:
            fail('head.png reaches only %d px under the collar (need >= 30) -- the neck will show a gap when the head turns' % depth)
        rep['neck_overlap_px'] = depth
    box = full.getchannel('A').point(lambda v: 255 if v > 16 else 0).getbbox()
    margin = min(box[0], W - box[2], box[1], H - box[3])
    if margin < 40:
        fail('the figure is %d px from the canvas edge (need >= 40; the motion throws it outward)' % margin)
    rep['figure_box'], rep['margin_px'] = list(box), int(margin)
    # 6. anti-aliased edges
    rep['edges'] = {}
    for n in order:
        x = np.asarray(im[n])
        on = x[..., 3] > 0
        contour = on & ~binary_erosion(on)
        soft = float((x[..., 3][contour] < 255).mean()) if contour.any() else 1.0
        colours = len(np.unique(x[x[..., 3] > 16][:, :3], axis=0))
        rep['edges'][n] = dict(contour_soft=round(soft, 3), colours=colours)
        if soft < 0.5:
            fail('%s.png has a hard cut-out edge (only %.0f%% of its contour is anti-aliased, need >= 50%%) -- it will '
                 'stair-step when the mesh turns it. Draw or quantise at 2x and downscale with Lanczos.' % (n, 100 * soft))
        if colours < 64:
            print('WARN: %s.png has only %d colours -- flat fills with no anti-aliasing inside will stair-step too; '
                  'draw or quantise at 2x and downscale' % (n, colours))
    # 5. variants
    for v in a.variants:
        for n in order:
            p = os.path.join(v, n + '.png')
            if not os.path.exists(p):
                fail('variant %s has no %s.png' % (v, n))
            if not np.array_equal(np.asarray(Image.open(p).convert('RGBA'))[..., 3], np.asarray(im[n])[..., 3]):
                fail('variant %s: %s.png alpha differs from %s -- variants may change colour and light only' % (v, n, D))
    rep['variants'] = a.variants
    json.dump(rep, open(os.path.join(D, 'delivery-check.json'), 'w'), indent=2)
    print(json.dumps(rep, indent=2))
    print('delivery OK')


if __name__ == '__main__':
    main()
