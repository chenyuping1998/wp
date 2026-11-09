"""Turf War cast v6 rig (2026-11-09): own skeleton + harmonic weights.

v5 (rebuild_20261023) bound the four drawings to the spine-motion-kit
skeleton with distance-falloff weights and a stack of per-defect patches; every
new patch bought back seam safety by shrinking the motion. v6 starts over from
one rule set:

* Skeleton: hip > spine > chest > neck > head, a clavicle per side (shoulders
  shrug and roll), arm and leg chains, IK-planted shoes, physics chains for
  hanging accessories.
* Weights: per drawing, a harmonic (Laplace) field over that drawing's own mesh
  graph, pinned only on bone cores. Joints blend smoothly over the free
  vertices between cores, and parts that touch in the picture but not in the
  mesh (fist over chest) never leak into each other.
* Seams: where one drawing lies on another at a joint (head on collar, near
  sleeve on shoulder, body-painted bulb on the lead sleeve), the TOP drawing's
  vertices there are pinned to the BOTTOM drawing's own weights, so an edge
  never slides over the picture under it (no doubled outline, no gap).

Writes design/cast_v6/out/<who>/rig.base.json (no animations); motions.py adds
the clips, finalize.mjs checks and installs.
Run: /Applications/anaconda3/bin/python3 design/cast_v6/build_v6.py [mg|fg]
"""
from pathlib import Path
import json, sys, math, shutil
import numpy as np
from PIL import Image
import scipy.sparse as sp
import scipy.sparse.linalg as spla
from scipy.sparse.csgraph import connected_components, dijkstra
from scipy import ndimage

D = Path(__file__).resolve().parent
SRC = D.parent / 'rebuild_20261023' / 'cast'
OUT = D / 'out'
CELL = 14
CELLS = {'arm_far': 9, 'arm_near': 9, 'head': 10, 'body': 10}

# Canvas px, y down. F = lead arm / front leg (+x, toward the board after the
# game mirrors him), B = guard arm (drawn over the chest) / back leg.
SPEC = {
  'mg': {
    'origin': (512, 1456),
    'P': {
      'hip': (500, 770), 'waist': (500, 650), 'chest': (512, 480), 'neck': (548, 340),
      'head': (566, 305), 'headTop': (575, 40), 'face': (605, 185),
      'shoulderB': (305, 310), 'elbowB': (205, 482), 'wristB': (425, 425), 'fistB': (492, 388),
      'shoulderF': (640, 365), 'elbowF': (745, 548), 'wristF': (828, 465), 'fistF': (855, 405),
      'hipB': (420, 790), 'kneeB': (240, 1075), 'ankleB': (150, 1330), 'toeB': (70, 1455),
      'hipF': (590, 790), 'kneeF': (810, 1070), 'ankleF': (800, 1325), 'toeF': (965, 1445),
    },
    # the drawn armhole seam of the lead sleeve (body-painted bulb meets the
    # torso): torso side -> clavicle, arm side -> upper arm
    'armholeF': [(648, 290), (662, 360), (666, 430), (668, 495), (686, 514), (692, 560), (692, 630)],
    # hanging accessories on the body drawing, swung by Spine physics
    'chains': [
      {'name': 'strL', 'parent': 'chest', 'pts': [(513, 362), (518, 418), (524, 486)], 'width': 7, 'fall': 26, 'ramp': 'tip', 'rotate': 0.16, 'strength': 140, 'inertia': 0.5, 'damping': 0.85, 'limit': 350},
      {'name': 'strR', 'parent': 'chest', 'pts': [(572, 362), (571, 416), (570, 482)], 'width': 7, 'fall': 26, 'ramp': 'tip', 'rotate': 0.16, 'strength': 140, 'inertia': 0.5, 'damping': 0.85, 'limit': 350},
      {'name': 'chain', 'parent': 'hip', 'pts': [(416, 704), (352, 766), (282, 812)], 'width': 13, 'fall': 30, 'ramp': 'loop', 'rotate': 0.55, 'strength': 60, 'inertia': 0.7, 'damping': 0.9, 'limit': 300},
    ],
    'torso_half': 165,    # half width of the trunk at the waist band
    'chest_r': 125,       # chest core radius
  },
  'fg': {
    'origin': (512, 1456),
    'P': {
      'hip': (510, 672), 'waist': (510, 575), 'chest': (520, 420), 'neck': (548, 255),
      'head': (552, 235), 'headTop': (540, 25), 'face': (570, 130),
      'shoulderB': (307, 280), 'elbowB': (270, 532), 'wristB': (500, 398), 'fistB': (572, 362),
      'shoulderF': (678, 332), 'elbowF': (740, 515), 'wristF': (865, 440), 'fistF': (915, 395),
      'hipB': (430, 700), 'kneeB': (250, 990), 'ankleB': (215, 1345), 'toeB': (150, 1470),
      'hipF': (592, 700), 'kneeF': (755, 985), 'ankleF': (722, 1320), 'toeF': (905, 1400),
    },
    'armholeF': [(646, 228), (654, 290), (682, 345), (702, 357), (718, 400), (714, 450), (702, 490)],
    'chains': [
      {'name': 'tie', 'parent': 'chest', 'pts': [(566, 412), (597, 505), (628, 598)], 'width': 30, 'fall': 22, 'color': 'orange', 'ramp': 'loop', 'rotate': 0.35, 'strength': 45, 'inertia': 0.8, 'damping': 0.88, 'limit': 350},
    ],
    'torso_half': 170,
    'chest_r': 130,
  },
}

# name, parent, head, tail, extra
BONES = [
  ('hip', 'root', 'hip', 'waist', {}),
  ('spine', 'hip', 'waist', 'chest', {}),
  ('chest', 'spine', 'chest', 'neck', {}),
  ('neck', 'chest', 'neck', 'head', {}),
  ('head', 'neck', 'head', 'headTop', {}),
  ('clavB', 'chest', 'neck', 'shoulderB', {}),
  ('upperArmB', 'clavB', 'shoulderB', 'elbowB', {}),
  ('foreArmB', 'upperArmB', 'elbowB', 'wristB', {}),
  ('handB', 'foreArmB', 'wristB', 'fistB', {}),
  ('clavF', 'chest', 'neck', 'shoulderF', {}),
  # deltoid helper: keyed at half the upper arm's turn (assemble.py), it
  # carries the shoulder's blend so a raised arm rounds the shoulder top
  # instead of denting it (linear-blend collapse on the inside of the bend)
  ('deltF', 'clavF', 'shoulderF', 'elbowF', {}),
  ('upperArmF', 'clavF', 'shoulderF', 'elbowF', {}),
  ('foreArmF', 'upperArmF', 'elbowF', 'wristF', {}),
  ('handF', 'foreArmF', 'wristF', 'fistF', {}),
  ('thighB', 'hip', 'hipB', 'kneeB', {}),
  ('shinB', 'thighB', 'kneeB', 'ankleB', {}),
  ('footB', 'shinB', 'ankleB', 'toeB', {'inherit': 'noRotationOrReflection'}),
  ('thighF', 'hip', 'hipF', 'kneeF', {}),
  ('shinF', 'thighF', 'kneeF', 'ankleF', {}),
  ('footF', 'shinF', 'ankleF', 'toeF', {'inherit': 'noRotationOrReflection'}),
  ('ikFootB', 'root', 'ankleB', None, {}),
  ('ikFootF', 'root', 'ankleF', None, {}),
]
DEFORM = [b[0] for b in BONES if not b[0].startswith('ik')]

# slot, source image, bones it may use
LAYERS = [
  ('arm_far', 'arm_r', ['chest', 'spine', 'clavF', 'deltF', 'upperArmF', 'foreArmF', 'handF']),
  ('body', 'body', ['hip', 'spine', 'chest', 'neck', 'clavB', 'clavF', 'deltF', 'upperArmB', 'upperArmF', 'foreArmF',
                    'thighB', 'shinB', 'footB', 'thighF', 'shinF', 'footF']),
  ('head', 'head', ['chest', 'clavB', 'clavF', 'neck', 'head']),
  ('arm_near', 'arm_l', ['chest', 'clavB', 'upperArmB', 'foreArmB', 'handB']),
]


def main_alpha(who, img):
  """The drawing's alpha with its invisible stray specks removed (every
  delivered layer carries a few alpha 1-2 dust components; v6 neither meshes
  nor ships them)."""
  a = np.asarray(Image.open(SRC / who / f'{img}.png').convert('RGBA'))[:, :, 3].copy()
  lab, k = ndimage.label(a > 0, structure=np.ones((3, 3)))
  sizes = ndimage.sum(np.ones_like(a), lab, range(1, k + 1))
  mx = ndimage.maximum(a, lab, range(1, k + 1))
  main = int(np.argmax(sizes)) + 1
  for i in range(1, k + 1):
    if i != main:
      assert mx[i - 1] <= 4, f'{who}/{img}: detached visible fragment (alpha {mx[i-1]}, {sizes[i-1]} px)'
  a[lab != main] = 0
  return a


def seg_td(P, a, b):
  a, b = np.asarray(a, float), np.asarray(b, float)
  d = b - a
  t = ((P - a) @ d) / max(1e-9, d @ d)
  q = a + np.clip(t, 0, 1)[:, None] * d
  return t, np.linalg.norm(P - q, axis=1)


def grid_mesh(alpha, CELL):
  ys, xs = np.nonzero(alpha)
  x0, y0 = max(0, xs.min() - 2), max(0, ys.min() - 2)
  x1, y1 = min(alpha.shape[1], xs.max() + 3), min(alpha.shape[0], ys.max() + 3)
  nx, ny = -(-(x1 - x0) // CELL), -(-(y1 - y0) // CELL)
  gx = np.minimum(x0 + np.arange(nx + 1) * CELL, x1)
  gy = np.minimum(y0 + np.arange(ny + 1) * CELL, y1)
  index, verts, tris = {}, [], []

  def vid(i, k):
    if (i, k) not in index:
      index[(i, k)] = len(verts); verts.append((float(gx[i]), float(gy[k])))
    return index[(i, k)]
  for k in range(ny):
    for i in range(nx):
      if alpha[gy[k]:max(gy[k] + 1, gy[k + 1]), gx[i]:max(gx[i] + 1, gx[i + 1])].any():
        v00, v10, v01, v11 = vid(i, k), vid(i + 1, k), vid(i, k + 1), vid(i + 1, k + 1)
        tris += [v00, v10, v11, v00, v11, v01]
  return np.asarray(verts), np.asarray(tris, np.int64).reshape(-1, 3), (x0, y0, x1, y1)


def laplacian(n, tris):
  e = np.concatenate([tris[:, [0, 1]], tris[:, [1, 2]], tris[:, [2, 0]]])
  e = np.unique(np.sort(e, 1), axis=0)
  A = sp.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n))
  A = (A + A.T).tocsr(); A.data[:] = 1
  return sp.diags(np.asarray(A.sum(1)).ravel()) - A, A


ORPHANS = []
VERTS = None
CHAIN_PARENT = {}
SMOOTH_ZONE = []
HIDDEN = [None]


def arc_split(W, names, a, mid, b):
  """Re-split each vertex's a/b blend through a half-turn helper `mid`, keeping
  its turn fraction: 0..0.5 -> a/mid, 0.5..1 -> mid/b. Linear blending then
  follows the joint's arc instead of cutting its corner."""
  ia, im, ib = names.index(a), names.index(mid), names.index(b)
  S = W[:, ia] + W[:, ib]
  phi = np.where(S > 1e-9, W[:, ib] / np.maximum(S, 1e-9), 0)
  lo = phi < 0.5
  W[:, ia] = np.where(lo, S * (1 - 2 * phi), 0)
  W[:, im] = W[:, im] + np.where(lo, S * 2 * phi, S * (2 - 2 * phi))
  W[:, ib] = np.where(lo, 0, S * (2 * phi - 1))
  return W


def smooth_zone(V, T, W, zone, passes, reach):
  """Neighbour-average weights inside `zone` grown by `reach` px."""
  _, A = laplacian(len(V), T)
  deg = np.asarray(A.sum(1)).ravel().clip(min=1)
  near = geodesic(V, T, zone) <= reach
  for _ in range(passes):
    avg = (A @ W) / deg[:, None]
    W = np.where(near[:, None], 0.5 * W + 0.5 * avg, W)
  return W / W.sum(1, keepdims=True).clip(min=1e-9)


def harmonic(n, tris, anchors, nb):
  """anchors: dict vertex -> weight vector (nb). Returns n x nb."""
  L, A = laplacian(n, tris)
  W = np.zeros((n, nb))
  fixed = np.zeros(n, bool)
  for v, w in anchors.items():
    W[v] = w; fixed[v] = True
  ncomp, lab = connected_components(A, directed=False)
  orphans = []
  for c in range(ncomp):
    members = np.nonzero(lab == c)[0]
    if not fixed[members].any():
      orphans.append(members)
  ORPHANS.extend(orphans)
  for members in orphans:  # solved after, from the nearest solved vertex
    fixed[members] = True
  u = np.nonzero(~fixed)[0]; a = np.nonzero(fixed)[0]
  Luu = L[u][:, u].tocsc(); Lua = L[u][:, a]
  solve = spla.factorized(Luu)
  rhs = -(Lua @ W[a])
  for k in range(nb):
    W[u, k] = solve(np.ascontiguousarray(rhs[:, k]))
  W = np.clip(W, 0, None)
  if orphans:
    allo = np.concatenate(orphans); keep = np.setdiff1d(np.arange(n), allo)
    for members in orphans:
      for v in members:
        W[v] = W[keep[np.argmin(((VERTS[keep] - VERTS[v]) ** 2).sum(1))]]
  return W / W.sum(1, keepdims=True).clip(min=1e-9)


def side_dist(P, poly, toward):
  """Signed distance to a polyline, positive on the side of point `toward`."""
  poly = np.asarray(poly, float)
  best = np.full(len(P), np.inf); sgn = np.zeros(len(P))
  def cross_sign(Q, a, b):
    return np.sign((b[0] - a[0]) * (Q[:, 1] - a[1]) - (b[1] - a[1]) * (Q[:, 0] - a[0]))
  # orientation: which cross sign is "toward"
  i = np.argmin([np.linalg.norm(np.asarray(toward) - (poly[k] + poly[k + 1]) / 2) for k in range(len(poly) - 1)])
  ref = cross_sign(np.asarray([toward], float), poly[i], poly[i + 1])[0]
  for k in range(len(poly) - 1):
    a, b = poly[k], poly[k + 1]
    t, d = seg_td(P, a, b)
    upd = d < best
    best = np.where(upd, d, best)
    sgn = np.where(upd, cross_sign(P, a, b) * ref, sgn)
  # beyond the ends, extend the end segments as infinite lines
  return best * np.where(sgn == 0, 1, sgn)


def add_chains(V, W, names, chains):
  """Blend each hanging accessory's own bones into the body weights: full
  inside its drawn width, fading over `fall` px, ramped along its length
  ('tip': free end swings; 'loop': both ends fixed, middle sways)."""
  names = list(names)
  for ch in chains:
    pts = np.asarray(ch['pts'], float); nseg = len(pts) - 1
    seglen = np.linalg.norm(np.diff(pts, axis=0), axis=1); L = seglen.sum(); cum = np.concatenate([[0], np.cumsum(seglen)])
    best = np.full(len(V), np.inf); u = np.zeros(len(V))
    for k in range(nseg):
      t, d = seg_td(V, pts[k], pts[k + 1])
      upd = d < best; best = np.where(upd, d, best); u = np.where(upd, (cum[k] + np.clip(t, 0, 1) * seglen[k]) / L, u)
    if ch.get('mask') is not None:
      # the accessory's own drawn pixels (not a capsule): its rounded end
      # would otherwise drag the belt under the tie tip
      dist = ndimage.distance_transform_edt(~ch['mask'])
      xi = np.clip(V[:, 0].astype(int), 0, dist.shape[1] - 1); yi = np.clip(V[:, 1].astype(int), 0, dist.shape[0] - 1)
      f = np.clip((ch['fall'] - dist[yi, xi]) / ch['fall'], 0, 1)
    else:
      f = np.clip((ch['width'] + ch['fall'] - best) / ch['fall'], 0, 1)
    f = f * f * (3 - 2 * f)
    if ch['ramp'] == 'tip':
      r = np.clip(u / 0.35, 0, 1); r = r * r * (3 - 2 * r)
    else:
      r = np.sin(np.pi * np.clip(u, 0, 1)) ** 1.5
    a = f * r
    bones = [f"{ch['name']}{i + 1}" for i in range(nseg)]
    names += bones
    W = np.concatenate([W * (1 - a)[:, None], np.zeros((len(V), nseg))], 1)
    # hat functions along the length, centred on each bone's middle
    mids = (cum[:-1] + seglen / 2) / L
    hat = np.stack([np.clip(1 - np.abs(u - m) / (seglen[k] / L), 0, 1) for k, m in enumerate(mids)], 1)
    hat[u <= mids[0], 0] = 1; hat[u >= mids[-1], -1] = 1
    hat /= hat.sum(1, keepdims=True).clip(min=1e-9)
    W[:, -nseg:] = hat * a[:, None]
  return W, names


def geodesic(V, T, seeds):
  """Shortest distance along the mesh from any seed vertex."""
  e = np.concatenate([T[:, [0, 1]], T[:, [1, 2]], T[:, [2, 0]]])
  e = np.unique(np.sort(e, 1), axis=0)
  w = np.linalg.norm(V[e[:, 0]] - V[e[:, 1]], axis=1)
  G = sp.coo_matrix((w, (e[:, 0], e[:, 1])), shape=(len(V), len(V))).tocsr()
  return dijkstra(G, directed=False, indices=np.nonzero(seeds)[0], min_only=True)


def arm_marks(V, T, Pj, s):
  """Geodesic distance from the shoulder plus its value at elbow/wrist/fist."""
  sh = Pj['shoulder' + s]
  d0 = np.linalg.norm(V - sh, axis=1)
  g = geodesic(V, T, d0 <= d0.min() + 12)
  at = lambda p: g[np.argmin(np.linalg.norm(V - Pj[p + s], axis=1))]
  return g, at('elbow'), at('wrist'), at('fist')


def interp_weights(P, mesh, names_to):
  """Weights of a rest mesh (verts/tris/W/names) at canvas points P, as
  vectors over names_to. Points off the mesh take the nearest vertex."""
  V, T, W, names = mesh['verts'], mesh['tris'], mesh['W'], mesh['names']
  out = np.zeros((len(P), len(names_to)))
  parent = {b[0]: b[1] for b in BONES}
  parent.update(CHAIN_PARENT)
  def fold(n):
    while n not in names_to:
      n = parent[n]
      if n == 'root': return 'chest'
    return n
  col = [names_to.index(fold(n)) for n in names]
  # cells are axis-aligned squares: locate by grid
  x0, y0 = mesh['box'][:2]
  CELL = mesh['cell']
  cell = {}
  for ti, (a, b, c) in enumerate(T):
    i = int((V[a][0] - x0) // CELL); k = int((V[a][1] - y0) // CELL)
    cell.setdefault((i, k), []).append(ti)
  for pi, p in enumerate(P):
    key = (int((p[0] - x0) // CELL), int((p[1] - y0) // CELL))
    done = False
    for ti in cell.get(key, []):
      a, b, c = T[ti]
      pa, pb, pc = V[a], V[b], V[c]
      d = (pb[1] - pc[1]) * (pa[0] - pc[0]) + (pc[0] - pb[0]) * (pa[1] - pc[1])
      l1 = ((pb[1] - pc[1]) * (p[0] - pc[0]) + (pc[0] - pb[0]) * (p[1] - pc[1])) / d
      l2 = ((pc[1] - pa[1]) * (p[0] - pc[0]) + (pa[0] - pc[0]) * (p[1] - pc[1])) / d
      l3 = 1 - l1 - l2
      if min(l1, l2, l3) >= -1e-6:
        w = l1 * W[a] + l2 * W[b] + l3 * W[c]
        done = True; break
    if not done:
      w = W[np.argmin(((V - p) ** 2).sum(1))]
    np.add.at(out[pi], col, w)
  return out


def alpha_at(alpha, P):
  xi = np.clip(np.round(P[:, 0]).astype(int), 0, alpha.shape[1] - 1)
  yi = np.clip(np.round(P[:, 1]).astype(int), 0, alpha.shape[0] - 1)
  return alpha[yi, xi]


def covered(alpha, P, r=4):
  """True where the drawing is solid within r px of each point (all samples)."""
  ok = np.ones(len(P), bool)
  for dx in (-r, 0, r):
    for dy in (-r, 0, r):
      ok &= alpha_at(alpha, P + (dx, dy)) > 200
  return ok


def build(who):
  spec = SPEC[who]; Pj = {k: np.asarray(v, float) for k, v in spec['P'].items()}
  ox, oy = spec['origin']
  S = lambda p: (float(p[0]) - ox, oy - float(p[1]))
  # --- bones (world, Spine space) ---
  world = {'root': {'x': 0.0, 'y': 0.0, 'rot': 0.0}}
  bones = [{'name': 'root'}]
  for name, parent, h, t, extra in BONES:
    hx, hy = S(Pj[h])
    rot = 0.0; length = 0.0
    if t:
      tx, ty = S(Pj[t]); rot = math.degrees(math.atan2(ty - hy, tx - hx)); length = math.hypot(tx - hx, ty - hy)
    pw = world[parent]
    dx, dy = hx - pw['x'], hy - pw['y']
    c, s = math.cos(math.radians(-pw['rot'])), math.sin(math.radians(-pw['rot']))
    lx, ly = c * dx - s * dy, s * dx + c * dy
    world[name] = {'x': hx, 'y': hy, 'rot': rot}
    b = {'name': name, 'parent': parent, 'x': round(lx, 3), 'y': round(ly, 3), 'rotation': round(rot - pw['rot'], 3)}
    if length: b['length'] = round(length, 3)
    b.update(extra)
    if name.startswith('ik'): b['color'] = 'ff3f00ff'
    bones.append(b)
  for ch in spec.get('chains', []):
    parent = ch['parent']
    for i in range(len(ch['pts']) - 1):
      name = f"{ch['name']}{i + 1}"
      hx, hy = S(ch['pts'][i]); tx, ty = S(ch['pts'][i + 1])
      rot = math.degrees(math.atan2(ty - hy, tx - hx)); length = math.hypot(tx - hx, ty - hy)
      pw = world[parent]
      dx, dy = hx - pw['x'], hy - pw['y']
      c, s_ = math.cos(math.radians(-pw['rot'])), math.sin(math.radians(-pw['rot']))
      world[name] = {'x': hx, 'y': hy, 'rot': rot}
      CHAIN_PARENT[name] = parent
      bones.append({'name': name, 'parent': parent, 'x': round(c * dx - s_ * dy, 3), 'y': round(s_ * dx + c * dy, 3),
                    'rotation': round(rot - pw['rot'], 3), 'length': round(length, 3), 'color': '4cc9f0ff'})
      parent = name
  # noRotation feet keep world rotation = their own local rotation in Spine
  # terms (parent rotation ignored); store the world angle directly.
  for b in bones:
    if b.get('inherit') == 'noRotationOrReflection':
      b['rotation'] = round(world[b['name']]['rot'], 3)
  # --- layers ---
  alphas = {img: main_alpha(who, img) for _, img, _ in LAYERS}
  meshes = {}
  def core(P, a, b, t0, t1, r):
    t, d = seg_td(P, Pj[a], Pj[b]); return (t >= t0) & (t <= t1) & (d <= r)
  # arm_far is solved twice: its hidden root copies the body solved after it
  for slot, img, names in LAYERS + LAYERS[:1]:
    alpha = alphas[img]
    V, T, box = grid_mesh(alpha > 0, CELLS[slot])
    n, nb = len(V), len(names)
    anchors = {}
    def pin(mask, bone_or_w, overwrite=False):
      if isinstance(bone_or_w, str):
        w = np.zeros(nb); w[names.index(bone_or_w)] = 1
        rows = np.repeat(w[None], n, 0)
      else:
        rows = bone_or_w
      for v in np.nonzero(mask)[0]:
        if overwrite or v not in anchors: anchors[v] = rows[v]
    if slot in ('arm_far', 'arm_near'):
      side = 'F' if slot == 'arm_far' else 'B'
      g, gE, gW, gF = arm_marks(V, T, Pj, side)
      tU, dU = seg_td(V, Pj['shoulder' + side], Pj['elbow' + side])
      tL, dL = seg_td(V, Pj['elbow' + side], Pj['wrist' + side])
      tH, dH = seg_td(V, Pj['wrist' + side], Pj['fist' + side])
      if side == 'F':
        # torso side of the drawn armhole seam rides the clavicle
        out = side_dist(V, spec['armholeF'], Pj['elbowF'] + (60, 0))
        # only the root the torso really hides: visible sleeve underside near
        # the armpit must turn with the arm (FG jab left a sliver otherwise)
        # hidden = really under the torso AND a little way from any visible
        # sleeve: the band next to the visible edge rides out with the arm, so
        # the visible underside never carries the chest's weight
        cov = covered(alphas['body'], V, 3)
        far_from_open = geodesic(V, T, ~cov) > 34 if (~cov).any() else np.ones(len(V), bool)
        hidden = (out < -10) & cov & far_from_open & (g < 0.6 * gE)
        HIDDEN[:] = [hidden]
        if 'body' in meshes:
          # second pass: the hidden root moves exactly like the body over it,
          # so it can never peek out from under the vest / jacket edge
          pin(hidden, interp_weights(V, meshes['body'], names))
        else:
          pin(hidden, 'clav' + side)
        pin((out > 22) & (tU < 0.2) & (dU < 150) & (g < 0.6 * gE), 'deltF')
        # the visible sleeve underside at the armpit crease shares the half
        # turn too (a short arm-lift folded it into a spike at the vest edge)
        away = geodesic(V, T, hidden) > 22 if hidden.any() else np.ones(len(V), bool)
        ax = Pj['elbowF'] - Pj['shoulderF']
        cross = lambda Q: ax[0] * (Q[..., 1] - Pj['shoulderF'][1]) - ax[1] * (Q[..., 0] - Pj['shoulderF'][0])
        inner = np.sign(cross(V)) == np.sign(cross(Pj['chest']))
        pin(away & ~cov & inner & (tU > 0.18) & (tU < 0.42), 'deltF')
      else:
        HIDDEN[:] = [np.zeros(len(V), bool)]
        # guard arm: only the shoulder cap rides the clavicle; the sleeve that
        # hangs over the forearm belongs to the upper arm (half-clavicle web
        # there folded at the combo)
        pin(g < 32, 'clav' + side)
        out = np.full(len(V), 1e9)
      # each core only where its own segment is clearly the nearest one, so a
      # tightly folded elbow leaves the crease free to blend
      dmin = np.minimum(np.minimum(dU, dL), dH)
      own = lambda d: d <= dmin + 1e-6
      gap = lambda d, *others: np.min(np.stack(others), 0) - d > 18
      pin(own(dU) & gap(dU, dL, dH) & (tU > (0.6 if side == 'F' else 0.22)) & (tU < (0.8 if side == 'F' else 0.88)) & (dU < 150) & (g > 80) & ((out > 30) | (tU > 0.55)) & ~HIDDEN[0], 'upperArm' + side)
      pin(own(dL) & gap(dL, dU, dH) & (tL > (0.38 if side == 'F' else 0.22)) & (tL < 0.85) & (dL < 95), 'foreArm' + side)
      pin(own(dH) & (tH > 0.15) & (dH < 110) & (g > 0.7 * gW), 'hand' + side)
    elif slot == 'head':
      over = covered(alphas['body'], V, 3)
      pin(over, interp_weights(V, meshes['body'], names), overwrite=True)
      # the skull/face core stays 50 px (along the mesh) from anything that
      # rides the collar, so the hood/beard blend has room to stretch
      clear = geodesic(V, T, over) > 50 if over.any() else np.ones(len(V), bool)
      face = np.linalg.norm(V - Pj['face'], axis=1) < 95
      pin(face & ~over & clear, 'head')
      pin(core(V, 'head', 'headTop', 0.3, 1.0, 90) & ~over & clear, 'head')
    elif slot == 'body':
      # 1. where the lead sleeve lies under the body near its shoulder, the
      #    body takes the arm's weights (the painted bulb IS that sleeve)
      tU, dU = seg_td(V, Pj['shoulderF'], Pj['elbowF'])
      outF = side_dist(V, spec['armholeF'], Pj['elbowF'] + (60, 0))
      # only the arm side of the drawn armhole: that body paint IS the sleeve
      # (MG puffed bulb, FG shirt cap). The jacket front / vest on the torso
      # side is its own garment and lets the sleeve slide under it.
      # (where the arm drawing has no paint under the bulb, its nearest
      # vertex's weights carry on outward)
      under = (tU > -0.25) & (tU < 0.95) & (dU < 170) & (outF > 8)
      SMOOTH_ZONE[:] = [under]
      ys = [q[1] for q in spec['armholeF']]
      pin((outF < -22) & (outF > -60) & (V[:, 1] > min(ys) + 25) & (V[:, 1] < max(ys) - 40), 'chest')
      # hood back / collar under the head drawing rides the neck: the head
      # drawing copies these weights where it lies on them, so the face turns
      # inside the hood (MG) / over the collar (FG) instead of shearing it
      pin(covered(alphas['head'], V, 3) & (V[:, 1] < Pj['neck'][1] + 10), 'neck')
      pin(under, interp_weights(V, meshes['arm_far'], names))
      # 2. under the guard arm's root the shoulder follows the clavicle
      tB, dB = seg_td(V, Pj['shoulderB'], Pj['elbowB'])
      pin(covered(alphas['arm_l'], V) & (tB < 0.3) & (dB < 150), 'clavB')
      pin(np.linalg.norm(V - Pj['shoulderB'], axis=1) < 70, 'clavB')
      # 3. trunk
      pin(np.linalg.norm(V - Pj['chest'], axis=1) < spec['chest_r'], 'chest')
      h = spec['torso_half']
      band = (np.abs(V[:, 1] - Pj['waist'][1]) < 22) & (V[:, 0] > Pj['waist'][0] - h) & (V[:, 0] < Pj['waist'][0] + h + 40)
      pin(band, 'spine')
      pin(core(V, 'hipB', 'hipF', -0.3, 1.3, 45), 'hip')
      # 4. legs
      for s in 'BF':
        # thigh and shin each stay straight; only a short band at the knee
        # (and at the ankle) blends. Long harmonic hand-overs, and knee bones
        # placed 80-120 px below the drawn knee, bent the shins mid-way
        # whenever the knees flexed (Stone 11-09 「腿下半部不要不自然彎曲」).
        tT, dT = seg_td(V, Pj['hip' + s], Pj['knee' + s])
        tS, dS = seg_td(V, Pj['knee' + s], Pj['ankle' + s])
        pin((tT > 0.24) & (tT < 0.78) & (dT < 140) & (dT < dS - 25), 'thigh' + s)
        pin((tS > 0.24) & (tS < 0.88) & (dS < 140) & (dS < dT - 25), 'shin' + s)
        tA, dA = seg_td(V, Pj['ankle' + s], Pj['toe' + s])
        pin((tA > 0.12) & (dA < 110) & (V[:, 1] > Pj['ankle' + s][1] + 10), 'foot' + s)
    global VERTS
    VERTS = V; ORPHANS.clear()
    W = harmonic(n, T, anchors, nb)
    if slot == 'arm_far':
      # the drawn elbow is folded tight, so forearm and upper arm touch along
      # a crease far from the joint; harmonic weights leak across it and an
      # opening elbow then drags the upper arm's front. Away from the elbow,
      # the upper-arm side of the crease keeps no forearm/fist weight.
      upper_side = (dU < dL - 28) & (dU < dH - 28) & (np.linalg.norm(V - Pj['elbow' + side], axis=1) > 60)
      for bn in ('foreArm' + side, 'hand' + side):
        W[upper_side, names.index(bn)] = 0
      W = W / W.sum(1, keepdims=True).clip(min=1e-9)
      W = smooth_zone(V, T, W, upper_side & (np.linalg.norm(V - Pj['elbow' + side], axis=1) < 140), passes=6, reach=26)
      # the torso's weight belongs to the hidden root only: visible sleeve
      # (and sleeve under the body-painted bulb) keeps none of it
      if 'body' in meshes:
        sleeve = ((out > 0) | ~cov) & (geodesic(V, T, hidden) > 28 if hidden.any() else True)
        for bn in ('chest', 'spine'):
          W[sleeve, names.index(bn)] = 0
        W = W / W.sum(1, keepdims=True).clip(min=1e-9)
        W = smooth_zone(V, T, W, sleeve & (geodesic(V, T, hidden) < 70), passes=5, reach=20)
    for o in ORPHANS:
      print('  orphan island', slot, len(o), 'verts at', V[o].mean(0).round())
    if slot == 'body' and SMOOTH_ZONE:
      # copied sleeve weights come from two meshes with different cells (and
      # nearest-vertex extrapolation past the arm's paint): even them out
      W = smooth_zone(V, T, W, SMOOTH_ZONE[0], passes=6, reach=24)
      SMOOTH_ZONE.clear()
    if slot == 'body' and spec.get('chains'):
      chains = []
      for ch in spec['chains']:
        ch = dict(ch)
        if ch.get('color') == 'orange':
          rgb = np.asarray(Image.open(SRC / who / 'body.png').convert('RGB')).astype(int)
          xs_ = [q[0] for q in ch['pts']]; ys_ = [q[1] for q in ch['pts']]
          box_ = np.zeros(alpha.shape, bool); box_[min(ys_) - 40:max(ys_) + 20, min(xs_) - 60:max(xs_) + 40] = True
          orange = (rgb[..., 0] > 170) & (rgb[..., 1] > 70) & (rgb[..., 1] < 170) & (rgb[..., 2] < 90)
          m_ = ndimage.binary_closing(orange & box_, iterations=3)
          ch['mask'] = ndimage.binary_dilation(m_, iterations=4) & box_   # + its ink outline
        chains.append(ch)
      W, names = add_chains(V, W, names, chains)
    raw = np.asarray(Image.open(SRC / who / f'{img}.png').convert('RGBA'))[:, :, 3] > 0
    ys_, xs_ = np.nonzero(raw)
    crop = (max(0, int(xs_.min()) - 2), max(0, int(ys_.min()) - 2), min(1024, int(xs_.max()) + 3), min(1536, int(ys_.max()) + 3))
    meshes[slot] = {'verts': V, 'tris': T, 'W': W, 'names': names, 'box': box, 'crop': crop, 'img': img, 'anchors': len(anchors), 'cell': CELLS[slot]}
    print(who, slot, 'verts', n, 'tris', len(T), 'anchors', len(anchors))
  return bones, world, meshes, (ox, oy)


def emit(who):
  bones, world, meshes, (ox, oy) = build(who)
  out = OUT / who; out.mkdir(parents=True, exist_ok=True)
  attachments, slots, layers = {}, [], []
  for slot, img, _ in LAYERS:
    m = meshes[slot]
    V, T, W, names, box = m['verts'], m['tris'], m['W'], m['names'], m['box']
    # the texture is the delivered layer cropped exactly (its invisible alpha
    # 1-2 dust included, so the composition gate stays byte-exact); the mesh
    # covers only the drawing's main body, so the dust is never drawn
    x0, y0, x1, y1 = m['crop']
    im = Image.open(SRC / who / f'{img}.png').convert('RGBA').crop(m['crop'])
    shipped = D.parent / 'rebuild_20261023' / 'kit' / who / f'{slot}.png'
    if shipped.exists() and np.array_equal(np.asarray(Image.open(shipped).convert('RGBA')), np.asarray(im)):
      shutil.copyfile(shipped, out / f'{slot}.png')   # same pixels: keep the shipped bytes
    else:
      im.save(out / f'{slot}.png', optimize=True)
    verts = []
    weights_dump = []
    for v in range(len(V)):
      w = W[v].copy(); w[w < 0.015] = 0
      top = np.argsort(-w)[:4]; top = [k for k in top if w[k] > 0]
      s = sum(w[k] for k in top)
      verts.append(len(top))
      wd = []
      for k in top:
        bw = world[names[k]]
        px, py = V[v][0] - ox, oy - V[v][1]
        c, sn = math.cos(math.radians(-bw['rot'])), math.sin(math.radians(-bw['rot']))
        dx, dy = px - bw['x'], py - bw['y']
        lx, ly = c * dx - sn * dy, sn * dx + c * dy
        verts += [[b['name'] for b in bones].index(names[k]), round(lx, 3), round(ly, 3), round(w[k] / s, 4)]
        wd.append([names[k], round(w[k] / s, 4)])
      weights_dump.append(wd)
    uvs = []
    for x, y in V:
      uvs += [round((x - x0) / (x1 - x0), 6), round((y - y0) / (y1 - y0), 6)]
    attachments[slot] = {slot: {'type': 'mesh', 'path': slot, 'width': int(x1 - x0), 'height': int(y1 - y0),
                                'uvs': uvs, 'triangles': T.ravel().tolist(), 'vertices': verts}}
    slots.append({'name': slot, 'bone': 'root', 'attachment': slot})
    alpha = np.asarray(im)[:, :, 3] > 16
    ys, xs = np.nonzero(alpha)
    layers.append({'name': slot, 'crop': [int(x0), int(y0), int(x1 - x0), int(y1 - y0)],
                   'inkBox': [int(xs.min() + x0), int(ys.min() + y0), int(xs.max() + x0), int(ys.max() + y0)]})
    np.save(out / f'{slot}.weights.npy', W)
    json.dump({'names': names, 'verts': V.tolist(), 'tris': T.tolist(), 'box': [int(b) for b in box]}, open(out / f'{slot}.mesh.json', 'w'))
  rig = {
    'skeleton': {'spine': '4.3.13', 'x': -ox, 'y': -(1536 - oy), 'width': 1024, 'height': 1536, 'fps': 30, 'hash': f'turf_{who}_v6'},
    'bones': bones, 'slots': slots,
    'constraints': [
      {'name': 'legB', 'type': 'ik', 'bones': ['thighB', 'shinB'], 'target': 'ikFootB', 'bendPositive': True},
      {'name': 'legF', 'type': 'ik', 'bones': ['thighF', 'shinF'], 'target': 'ikFootF', 'bendPositive': True},
    ],
    'skins': [{'name': 'default', 'attachments': attachments}],
    'animations': {},
    'turf': {'layers': layers, 'origin': [ox, oy], 'world': world},
  }
  for ch in SPEC[who].get('chains', []):
    for i in range(len(ch['pts']) - 1):
      rig['constraints'].append({'name': f"phys_{ch['name']}{i + 1}", 'type': 'physics', 'bone': f"{ch['name']}{i + 1}",
                                 'rotate': ch['rotate'], 'inertia': ch.get('inertia', 0.5), 'strength': ch.get('strength', 100),
                                 'damping': ch.get('damping', 0.85), 'mass': 1, 'limit': ch.get('limit', 5000)})
  (out / 'rig.base.json').write_text(json.dumps(rig))
  print('wrote', out / 'rig.base.json')


if __name__ == '__main__':
  for w in sys.argv[1:] or ['mg', 'fg']:
    emit(w)
