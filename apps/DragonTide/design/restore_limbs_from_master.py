"""Rebuild limb layers from the approved drawing so the rest silhouette is the drawing's own.

Stone 2026-10-30: repaired limbs had stepped knees, ball elbows and tail patches.
Each limb pixel of the drawing goes to the limb part whose current visible area is
nearest; existing overlaps and everything hidden under other layers are kept, so rig,
joints and motion stay byte-identical. Only silhouette and fill change.
Usage: restore_limbs_from_master.py <cast dir> <master.png> <out dir>
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes, gaussian_filter, binary_dilation, binary_erosion, binary_propagation, distance_transform_edt, label

cast, master, out = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
SRC = Path(next(a for a in sys.argv if a.startswith('--src=')).split('=', 1)[1])  # the layers before this repair
out.mkdir(parents=True, exist_ok=True)
rig = json.loads((cast / f'{cast.name}_spine/{cast.name}.json').read_text())
order = [s['attachment'] for s in rig['slots'] if s.get('attachment')]
ANY = '--any-colour' in sys.argv   # the drawing was already masked to limbs (MG: sleeves are not fur)
LIMBS = [n for n in order if n.startswith(('leg_', 'arm_') if ANY else ('leg_', 'arm_', 'tail_')) or (ANY and n == 'pelvis')]
load = lambda n: np.array(Image.open(SRC / f'{n}.png').convert('RGBA'))
layers = {n: load(n) for n in order}
M = np.array(Image.open(master).convert('RGBA'))

def not_fur(a):
    if ANY: return np.zeros(a.shape[:2], bool)
    """Sleeve, cuff, chain, watch, shorts and hand colours: everything but fur brown and its ink."""
    r, g, b = [a[..., i].astype(float) for i in range(3)]
    ratio = g / np.maximum(r, 1)
    brown = (r < 205) & (ratio > .3) & (ratio < .64) & (b < g)
    ink = r < 75
    return ~(brown | ink)

def chain(a):
    if ANY: return np.zeros(a.shape[:2], bool)
    """Gold chain links, grown so their dark outline goes with them."""
    r, g, b = [a[..., i].astype(float) for i in range(3)]
    return binary_dilation((r > 120) & (g / np.maximum(r, 1) > .62) & (r - b > 70) & (a[..., 3] > 0), iterations=5)

# Where a chain or the hand covered the limb in the drawing there is no outline to copy:
# there the edge is smoothed and its ink drawn. part -> joint centre, radius.
J = json.loads((cast / 'joints.json').read_text())
RADIUS = 150
REDRAW = {'arm_l_lower': (J['wristL'], J['elbowL'], RADIUS), 'arm_r_lower': (J['wristR'], J['elbowR'], RADIUS)} if '--wrists' in sys.argv else {}
HAND = {'arm_l_lower': 'hand_l_hip', 'arm_r_lower': 'hand_r_pinch'}
INK = np.array([52, 26, 16.])

def redraw_edge(res, joint, elbow, radius, cur, hand):
    Y, X = np.mgrid[:res.shape[0], :res.shape[1]]
    # Past the wrist the forearm may not stick out beside the hand's own wrist.
    d = np.array([elbow['x'] - joint['x'], elbow['y'] - joint['y']], float); d /= np.hypot(*d)
    along = (X - joint['x']) * d[0] + (Y - joint['y']) * d[1]
    res = res.copy(); res[(along < 12) & ~binary_dilation(hand, iterations=2)] = 0
    t = np.clip((radius - np.hypot(X - joint['x'], Y - joint['y'])) / 40, 0, 1); w = t * t * (3 - 2 * t)
    m = res[..., 3] > 128
    sdf = distance_transform_edt(~m) - distance_transform_edt(m)
    smooth = gaussian_filter(sdf, 4.0)
    blended = (1 - w) * sdf + w * smooth
    out = res.copy().astype(float)
    alpha = np.clip(.5 - blended, 0, 1)
    fill = ~m & (alpha > 0)
    if fill.any():
        _, n = distance_transform_edt(~m, return_indices=True)
        out[fill, :3] = out[n[0][fill], n[1][fill], :3]
    out[..., 3] = np.where(w > 0, np.maximum(alpha * 255, res[..., 3] * (1 - w)) * (w < 1) + alpha * 255 * (w >= 1), res[..., 3])
    rim = np.clip((blended + 3.2) / 1.0, 0, 1) * w
    out[..., :3] = out[..., :3] * (1 - rim[..., None]) + INK * rim[..., None]
    return out.clip(0, 255).astype(np.uint8)

# Non-limb layers, plus each limb's own sleeve/cuff, stay exactly as they are.
keep = {}
above = {}   # part -> everything drawn over it at rest
for n in reversed(order):
    above[n] = np.zeros(M.shape[:2], bool)
others = np.zeros(M.shape[:2], bool)
for n in reversed(order):
    above[n] = others.copy()
    a = layers[n][..., 3] > 128
    if n in LIMBS:
        k = binary_dilation(not_fur(layers[n]) & a, iterations=3) & a if n.startswith('arm_') else np.zeros_like(a)
        ids, c = label(k, np.ones((3, 3)))
        if c: k = np.isin(ids, np.nonzero(np.bincount(ids.ravel())[1:] >= 300)[0] + 1)   # the sleeve, not stray highlights
        keep[n] = k
        others |= a
    else:
        others |= a
nonlimb = np.zeros(M.shape[:2], bool)
for n in order:
    if n not in LIMBS: nonlimb |= layers[n][..., 3] > 128
    else: nonlimb |= keep[n]

# Label each drawing pixel with the nearest limb part (top-most part wins where they overlap).
labels = np.full(M.shape[:2], -1)
for i, n in enumerate(LIMBS):
    labels[(layers[n][..., 3] > 128) & ~keep[n]] = i
dist, idx = distance_transform_edt(labels < 0, return_indices=True)
nearest = labels[idx[0], idx[1]]
painted_over = chain(M) | binary_dilation(not_fur(M) & (M[..., 3] > 128), iterations=1)
fur = (M[..., 3] > 0) & ~painted_over & (dist < (200 if ANY else 45))
# Hidden or chain-covered overlap keeps its old shape but takes the drawing's nearby fur colour,
# so no flat patch shows where a part peeks out.
body = fur & (M[..., :3].astype(int).sum(-1) > 150)
body = binary_erosion(body, iterations=2)
_, near = distance_transform_edt(~body, return_indices=True)
report = {}
covered = np.zeros(M.shape[:2], bool)
for n in reversed(order):
    if n not in LIMBS:
        covered |= layers[n][..., 3] > 128
        continue
    i = LIMBS.index(n)
    cur = layers[n]; own = cur[..., 3] > 128
    over = covered.copy()                       # everything drawn above this part at rest
    take = fur & ~over & ((nearest == i) | (own & ~keep[n]))
    # Misregistered ink lines from neighbouring clothes are thin threads: keep only what grows from solid fur.
    take &= binary_propagation(binary_erosion(take, iterations=3), mask=take & binary_dilation(binary_erosion(take, iterations=3), iterations=6))
    hidden = cur[..., 3] > 0
    hidden &= binary_dilation(over, iterations=2) | keep[n] | painted_over  # under other layers or the chain: keep the old paint
    res = np.zeros_like(cur)
    res[hidden] = cur[hidden]
    if not ANY:
        res[hidden, :3] = M[near[0][hidden], near[1][hidden], :3]
    res[take] = M[take]
    res[keep[n]] = cur[keep[n]]
    ids, k = label(res[..., 3] > 128, np.ones((3, 3)))
    if k:
        sizes = np.bincount(ids.ravel()); sizes[0] = 0
        res[~binary_dilation(ids == sizes.argmax(), iterations=2)] = 0
    holes = binary_fill_holes(res[..., 3] > 128) & (res[..., 3] <= 128)
    if holes.any():
        res[holes, :3] = (cur if ANY else M)[(near[0][holes], near[1][holes]) if not ANY else (holes,)][:, :3] if not ANY else cur[holes, :3]
        res[holes, 3] = 255
    if not ANY:      # light specks inside the fur
        solid = res[..., 3] > 128
        speck = solid & (res[..., :3].mean(-1) > 150) & (distance_transform_edt(solid) > 2) & ~keep[n]
        if speck.any():
            ok = solid & ~binary_dilation(speck, iterations=1)
            _, nn = distance_transform_edt(~ok, return_indices=True)
            res[speck, :3] = res[nn[0][speck], nn[1][speck], :3]
    if n in REDRAW:
        res = redraw_edge(res, *REDRAW[n], cur, layers[HAND[n]][..., 3] > 128)
    res[res[..., 3] == 0, :3] = 0
    covered |= res[..., 3] > 128
    Image.fromarray(res).save(out / f'{n}.png')
    report[n] = {'removed': int(((cur[..., 3] > 128) & (res[..., 3] <= 128)).sum()), 'added': int(((cur[..., 3] <= 128) & (res[..., 3] > 128)).sum())}
# Hand layers carry a flat, unlined wrist stub: give its sides the ink line and fade
# only its rounded end, which lies on the outlined forearm.
if '--wrists' in sys.argv:
    Y, X = np.mgrid[:M.shape[0], :M.shape[1]]
    for path in sorted(SRC.glob('hand_*.png')):
        side = path.stem.split('_')[1].upper()
        w, e = J[f'wrist{side}'], J[f'elbow{side}']
        d = np.array([e['x'] - w['x'], e['y'] - w['y']], float); d /= np.hypot(*d)
        along = (X - w['x']) * d[0] + (Y - w['y']) * d[1]
        t = np.clip((along - 8) / 26, 0, 1); fade = t * t * (3 - 2 * t)
        h8 = np.array(Image.open(path).convert('RGBA'))
        h = h8.astype(float)
        stub = (~not_fur(h8)) & (h8[..., 3] > 128) & (along > -30)
        m = h8[..., 3] > 128
        depth = distance_transform_edt(m)
        sides = 1 - np.clip((along + 14) / 18, 0, 1)
        rim = (np.clip(3.4 - depth, 0, 1) * stub * sides)[..., None]
        h[..., :3] = h[..., :3] * (1 - rim) + INK * rim
        h[..., 3] *= 1 - fade * ~not_fur(h8)
        h = h.clip(0, 255).astype(np.uint8); h[h[..., 3] == 0, :3] = 0
        Image.fromarray(h).save(out / path.name)
print(json.dumps(report, indent=0))
