"""Motion quality numbers from a sim.mjs dump sampled at 60 fps.

  python design/cast_v6/analyze.py <frames.json> <who>

Tracks landmark points (nearest mesh vertex on the named slot) and reports per
point: peak-to-peak travel (px, % of figure height), peak speed, the largest
frame-to-frame acceleration jump (a pop/twitch shows up here), and the count
of direction reversals per second (jitter). Also the physics swing: chain tip
travel relative to the vertex it hangs from.
"""
import json, sys
from pathlib import Path
import numpy as np

D = Path(__file__).resolve().parent
data = json.load(open(sys.argv[1])); who = sys.argv[2]
names = [h['name'] for h in data['header']]
mesh = {n: json.load(open(D / 'out' / who / f'{n}.mesh.json')) for n in names}
H = 1460.0
PTS = {
  'mg': {'head': ('head', (605, 150)), 'chest': ('body', (560, 470)), 'hip': ('body', (500, 760)),
         'fistF': ('arm_far', (855, 410)), 'fistB': ('arm_near', (490, 390)), 'kneeF': ('body', (848, 1140)),
         'shoeF': ('body', (900, 1440)), 'strL_tip': ('body', (523, 468)), 'strL_root': ('body', (513, 362)),
         'chain_mid': ('body', (352, 766)), 'chain_ring': ('body', (416, 704))},
  'fg': {'head': ('head', (560, 120)), 'chest': ('body', (520, 470)), 'hip': ('body', (510, 670)),
         'fistF': ('arm_far', (915, 400)), 'fistB': ('arm_near', (570, 365)), 'kneeF': ('body', (790, 1010)),
         'shoeF': ('body', (860, 1390)), 'tie_tip': ('body', (626, 590)), 'tie_root': ('body', (566, 415))},
}[who]
idx = {}
for k, (slot, p) in PTS.items():
  V = np.asarray(mesh[slot]['verts']); idx[k] = (names.index(slot), int(np.argmin(((V - p) ** 2).sum(1))))
t = np.array([f['t'] for f in data['frames']])
dt = np.median(np.diff(t))
track = {k: np.array([[f['slots'][si][2 * vi], f['slots'][si][2 * vi + 1]] for f in data['frames']]) for k, (si, vi) in idx.items()}
print(f'{len(t)} frames, dt {dt:.4f}s, {t[-1]-t[0]:.1f}s')
print(f"{'point':10s} {'p2p px':>8s} {'%H':>6s} {'vmax':>7s} {'jerk':>8s} {'rev/s':>6s}")
for k, P in track.items():
  span = P.max(0) - P.min(0); p2p = float(np.linalg.norm(span))
  v = np.diff(P, axis=0) / dt; sp = np.linalg.norm(v, axis=1)
  a = np.diff(v, axis=0) / dt; j = np.linalg.norm(np.diff(a, axis=0), axis=1)
  # reversals of the dominant axis
  ax = int(np.argmax(span)); vs = v[:, ax]; vs = vs[np.abs(vs) > 2]
  rev = int((np.diff(np.sign(vs)) != 0).sum())
  print(f'{k:10s} {p2p:8.1f} {100 * p2p / H:6.2f} {sp.max():7.0f} {j.max() * dt * dt:8.1f} {rev / (t[-1] - t[0]):6.2f}')
for tip, root in [('strL_tip', 'strL_root'), ('chain_mid', 'chain_ring'), ('tie_tip', 'tie_root')]:
  if tip in track:
    rel = track[tip] - track[root]
    print(f'swing {tip:10s} rel. to {root}: p2p {np.linalg.norm(rel.max(0) - rel.min(0)):.1f}px')
