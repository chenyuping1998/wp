"""Mummy cat rig v3: joints measured off the art, a real neck, a collar overlay,
and no teal rim at the seams. (2026-11-07, user: "the head isn't on straight,
the neck doesn't join, nor do the limbs".)

Reads   source/mummy_delivery/mascot_versions/v2_before_joints/  (v2 as delivered)
Writes  source/mummy_delivery/mascot_v3/       (layers/, joints.json, layers.json, mascot.json)
        source/mummy_delivery/mascot_v3/fix_report.json

What was wrong in v2, measured:
  * joints were assumed numbers, not measured. The shoulder balls' real centres
    sit ~11 px below the assumed ones and the hip balls 20-30 px off, so a
    rotating limb slid off its socket.
  * headBase/neckBase were 25 px apart at the chin: every head turn pivoted on
    the chin, so the headcloth lappets slid across the collar and the open
    collar ring (the torso is drawn as an open tube) showed through.
  * every part carries the art's teal rim light on ALL its edges; where an arm
    or a leg lies over the body, that rim is a visible seam line.

Fixes:
  1. shoulders: circle fit to the top cap of each arm (hips stay: see below).
  2. head pivots at the collar (headBase 560, neckBase 610), so a turn swings
     the face and keeps the lappet tips on the collar.
  3. torso: the open collar ring is filled with a bandaged neck column that
     runs up under the chin; the ring's front lip stays in front of it.
  4. 'neck' layer = the teal collar alone, drawn ABOVE the arms and the head,
     so shoulder caps and lappet tips tuck under it instead of lying on it.
  5. rim: on each part, teal-shifted pixels along an edge that another part
     covers in the rest pose are recoloured from the bandage just inside.
     The outer silhouette keeps its rim.

Run with a Python that has numpy, Pillow and scipy (the system python here).
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent
# v2 as delivered (mascot/ itself now holds v3)
SRC = ROOT / 'source/mummy_delivery/mascot_versions/v2_before_joints'
OUT = ROOT / 'source/mummy_delivery/mascot_v3'
(OUT / 'layers').mkdir(parents=True, exist_ok=True)

NAMES = ['tail', 'leg_l', 'leg_r', 'pelvis', 'torso', 'arm_l', 'arm_r', 'head']
L = {n: np.array(Image.open(SRC / 'layers' / f'{n}.png').convert('RGBA')).astype(np.float32) for n in NAMES}
joints = json.loads((SRC / 'joints.json').read_text())
report = {'joints_before': {}, 'joints_after': {}}


def alpha(n):
    return L[n][:, :, 3] > 128


# ── 1. shoulder / hip balls: least-squares circle through the top cap ────────
def cap_centre(n, depth_frac=0.55):
    m = alpha(n)
    ys, xs = np.nonzero(m)
    top = ys.min()
    # cap radius ~ half the limb width just below the cap
    row = np.nonzero(m[top + 60])[0]
    r0 = (row.max() - row.min()) / 2
    pts = []
    for y in range(top, int(top + r0 * depth_frac * 2)):
        r = np.nonzero(m[y])[0]
        if len(r):
            pts += [(r.min(), y), (r.max(), y)]
    for x in range(int(xs.min()), int(xs.max()) + 1):
        c = np.nonzero(m[:, x])[0]
        if len(c) and c.min() < top + r0 * depth_frac:
            pts.append((x, c.min()))
    p = np.array(pts, float)
    A = np.c_[2 * p[:, 0], 2 * p[:, 1], np.ones(len(p))]
    b = (p ** 2).sum(1)
    cx, cy, c = np.linalg.lstsq(A, b, rcond=None)[0]
    return [round(cx), round(cy)], round(float(np.sqrt(c + cx * cx + cy * cy)), 1)


# Shoulders only. The legs' tops are not balls: the template has them run up
# inside the shorts, so a circle fit lands low and straightens the leg (tried:
# legs 99.6 % straight, feet sliding 5.5 px). The hips keep their v2 values.
for side, arm in (('L', 'arm_l'), ('R', 'arm_r')):
    for key, part in (('shoulder' + side, arm),):
        c, r = cap_centre(part)
        # x from the fit, y kept at v2: moving it down even 3 px shortened the
        # upper arm enough to fold elbow triangles in the wave (built and checked)
        c = [c[0], joints[key][1]]
        report['joints_before'][key] = joints[key]
        joints[key] = c
        report['joints_after'][key] = {'centre': c, 'radius': r}

# ── 2. head pivots at the collar ───────────────────────────────────────────────
for k, v in (('headBase', [512, 560]), ('neckBase', [512, 610])):
    report['joints_before'][k] = joints[k]
    joints[k] = v
    report['joints_after'][k] = v

# ── 3. neck column inside the open collar ring ─────────────────────────────────
torso = L['torso']
H, W = torso.shape[:2]
yy, xx = np.mgrid[0:H, 0:W]
# inner opening of the ring (measured on a 4x grid): centre (512,537), 123 x 18
RING_C, RING_RX, RING_RY = (512, 537), 121, 17
inner = ((xx - RING_C[0]) / RING_RX) ** 2 + ((yy - RING_C[1]) / RING_RY) ** 2 <= 1
NECK_HALF = 96  # at the top, under the chin
column_top = 452
# the neck flares into the ring: half-width runs from NECK_HALF at the top to
# the ring's own half-width at its centre line, so no gap shows at the sides
k = np.clip((yy - (RING_C[1] - 40)) / 40.0, 0, 1)
half_w = NECK_HALF + (RING_RX + 2 - NECK_HALF) * k ** 2
column = (np.abs(xx - 512) <= half_w) & (yy >= column_top) & (yy <= RING_C[1])
neck_mask = (column | inner) & ~((yy > RING_C[1]) & ~inner)
# bandage texture: a horizontal strip of chest wraps (no navel, no collar)
HW = RING_RX + 6
patch = torso[700:700 + 120, 512 - HW:512 + HW + 1, :3]
tex = np.zeros((H, W, 3), np.float32)
for y in range(column_top - 4, RING_C[1] + RING_RY + 2):
    tex[y, 512 - HW:512 + HW + 1] = patch[(y - column_top) % patch.shape[0]]
# a cylinder: darker at the sides, and in the chin's shadow at the top
u = np.clip((xx - 512) / np.maximum(half_w, 1.0), -1, 1)
shade = 0.55 + 0.45 * np.sqrt(np.clip(1 - u ** 2, 0, 1))
shade *= 0.72 + 0.28 * np.clip((yy - column_top) / 70.0, 0, 1)
tex *= shade[:, :, None]
soft = ndi.gaussian_filter(neck_mask.astype(np.float32), 1.0)
new_torso = torso.copy()
for c in range(3):
    new_torso[:, :, c] = np.where(neck_mask, tex[:, :, c], torso[:, :, c]) * soft + torso[:, :, c] * (1 - soft)
new_torso[:, :, 3] = np.maximum(torso[:, :, 3], soft * 255)
L['torso'] = new_torso

# ── 4. the collar on its own layer, above arms and head ────────────────────────
r, g, b = torso[:, :, 0], torso[:, :, 1], torso[:, :, 2]
teal = (torso[:, :, 3] > 200) & (g > r + 25) & (b > r + 10) & (yy > RING_C[1] + 8) & (yy < 700)
collar = np.zeros((H, W), bool)
for x in range(W):
    c = np.nonzero(teal[:, x])[0]
    if len(c) > 6:
        # the collar is ~65 px deep; a longer teal run is the rim light going
        # down the shoulder, which stays on the torso
        collar[max(c.min() - 3, 0):min(c.max() + 7, c.min() + 72), x] = True
collar &= torso[:, :, 3] > 8
collar = ndi.binary_closing(collar, iterations=3) & (torso[:, :, 3] > 8)
# keep the collar itself: the largest connected piece (the rim light down the
# shoulders is teal too, and must stay on the torso)
lab, nlab = ndi.label(collar)
if nlab > 1:
    sizes = ndi.sum(collar, lab, range(1, nlab + 1))
    collar = lab == (int(np.argmax(sizes)) + 1)
collar &= np.abs(xx - 512) < 184
feather = ndi.gaussian_filter(collar.astype(np.float32), 0.8)
neck_layer = torso.copy()
neck_layer[:, :, 3] = torso[:, :, 3] * feather
L['neck'] = neck_layer
report['collar_rows'] = [int(np.nonzero(collar.any(1))[0].min()), int(np.nonzero(collar.any(1))[0].max())]

# ── 5. teal rim off the covered edges ──────────────────────────────────────────
ORDER = ['tail', 'leg_l', 'leg_r', 'pelvis', 'torso', 'arm_l', 'arm_r', 'head', 'neck']
cover = {n: L[n][:, :, 3] > 128 for n in ORDER}
rim_report = {}
for n in ['tail', 'leg_l', 'leg_r', 'pelvis', 'torso', 'arm_l', 'arm_r']:
    a = L[n]
    m = a[:, :, 3] > 24
    others = np.zeros_like(m)
    for o in ORDER:
        if o != n:
            others |= cover[o]
    band = m & ~ndi.binary_erosion(m, iterations=7)
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    tealish = (G + B) / 2 > R - 18
    # an edge is a seam where, one step outward, some other part is drawn
    out_ring = ndi.binary_dilation(m, iterations=6) & ~m
    seam_zone = ndi.binary_dilation(out_ring & others, iterations=9)
    fix = band & tealish & seam_zone
    if n == 'torso':
        fix &= ~collar & (yy > 590)  # the collar is meant to be teal
    good = m & ~band
    _, (iy, ix) = ndi.distance_transform_edt(~good, return_indices=True)
    for c in range(3):
        a[:, :, c] = np.where(fix, a[iy, ix, c], a[:, :, c])
    rim_report[n] = int(fix.sum())
report['rim_pixels_recoloured'] = rim_report

for n, a in L.items():
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(OUT / 'layers' / f'{n}.png')
(OUT / 'joints.json').write_text(json.dumps(joints, indent=2))
(OUT / 'layers.json').write_text(json.dumps({'order': ORDER}))
cfg = json.loads((SRC / 'mascot.json').read_text())
(OUT / 'mascot.json').write_text(json.dumps(cfg))
comp = Image.new('RGBA', (W, H))
for n in ORDER:
    comp.alpha_composite(Image.open(OUT / 'layers' / f'{n}.png'))
comp.save(OUT / 'assembled.png')
(OUT / 'fix_report.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=1))
