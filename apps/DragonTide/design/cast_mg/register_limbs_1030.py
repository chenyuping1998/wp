"""Mask MG's limbs out of the original drawing and register the arms onto the current joints.
Output is a limbs-only 'master' for restore_limbs_from_master.py --any-colour.
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy.interpolate import RBFInterpolator
from scipy.ndimage import binary_dilation, binary_fill_holes, label, map_coordinates

D = Path(__file__).resolve().parent
R = np.array(Image.open(D / 'reference-master.png').convert('RGBA')).astype(float)
J = json.loads((D / 'joints.json').read_text())
r, g, b, a = [R[..., i] for i in range(4)]
ratio = g / np.maximum(r, 1)
solid = a > 40
ink = solid & (r < 62)
brown = solid & (r >= 62) & (ratio > .34) & (ratio < .75) & (r < 175)
red = solid & (r >= 62) & (ratio <= .34)
white = solid & (r > 190) & (g > 180)

def poly(points):
    im = Image.new('1', (1024, 1536)); ImageDraw.Draw(im).polygon(points, fill=1)
    return np.array(im)

def flood(cls, seeds, limit):
    ids, _ = label(cls & limit)
    keep = np.isin(ids, [ids[y, x] for x, y in seeds if ids[y, x] > 0])
    keep = binary_fill_holes(keep)
    return keep

def region(cls, seeds, limit, grow=7):
    m = flood(cls, seeds, limit)
    return (m | (binary_dilation(m, iterations=grow) & ink & limit))

legs = poly([(345, 775), (560, 775), (575, 870), (625, 1060), (680, 1150), (712, 1340), (620, 1340), (580, 1170), (555, 1090), (484, 925), (385, 1096), (440, 1195), (490, 1340), (365, 1340), (278, 1085), (340, 860)])
leg_mask = region(brown, [(330, 1000), (600, 1000), (450, 880), (400, 1250), (660, 1250)], legs)
arm_l = poly([(322, 495), (92, 668), (240, 795), (262, 806), (305, 732), (262, 700), (228, 665), (322, 628)])
arm_l_mask = region(red, [(230, 640), (180, 720)], arm_l) | region(white, [(255, 745)], arm_l, 4)
arm_r = poly([(570, 490), (625, 520), (625, 560), (735, 720), (732, 775), (680, 785), (590, 720), (548, 672), (580, 610), (570, 590)])
arm_r_mask = region(red, [(660, 650), (650, 730), (595, 540)], arm_r) | region(white, [(600, 660)], arm_r, 4)

def warp(mask, src, dst, width):
    """Thin-plate warp of the masked drawing: target -> reference through bone control points."""
    def ctrl(chain):
        out = []
        for (p, q) in zip(chain, chain[1:]):
            p, q = np.array(p, float), np.array(q, float); d = (q - p) / np.hypot(*(q - p)); n = np.array([-d[1], d[0]])
            for t in np.linspace(0, 1, 4):
                c = p + (q - p) * t
                out += [c, c + n * width, c - n * width]
        return np.array(out)
    S, T = ctrl(src), ctrl(dst)
    rbf = RBFInterpolator(T, S, kernel='thin_plate_spline', smoothing=1.0)
    ys, xs = np.nonzero(binary_dilation(mask, iterations=60))
    q = rbf(np.column_stack([xs, ys]).astype(float))
    out = np.zeros_like(R)
    for ch in range(4):
        layer = R[..., ch] * (mask if ch == 3 else 1)
        out[ys, xs, ch] = map_coordinates(layer, [q[:, 1], q[:, 0]], order=1)
    return out

P = lambda k: (J[k]['x'], J[k]['y'])
outl = warp(arm_l_mask, [(318, 565), (170, 668), (276, 755)], [P('shoulderL'), P('elbowL'), P('wristL')], 28)
outr = warp(arm_r_mask, [(590, 555), (680, 735), (575, 645)], [P('shoulderR'), P('elbowR'), P('wristR')], 22)
result = np.zeros_like(R)
result[leg_mask] = R[leg_mask]
for o in (outl, outr):
    m = o[..., 3] > 0
    result[m] = o[m]
Image.fromarray(result.clip(0, 255).astype(np.uint8)).save(sys.argv[1])
