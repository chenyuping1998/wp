"""Redraw MG's flat-painted limbs on the rig's joints, with the drawing's widths and taper.

The original drawing's limbs do not sit on the rig's joints (right knee is ~45 px off), so
copying it breaks the ink at every bend. Each segment is one complete shape around its bone.
A joint is a hinge: the part below ends in a round end with an ink ring, the part above it
ends in a slightly smaller inkless cap of the same colour, so the outline holds at any angle.
Usage: rebuild_limbs_1030.py <out dir> <dir with warped cuffs> <layers before repair>
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.interpolate import PchipInterpolator
from scipy.ndimage import binary_dilation, binary_fill_holes, gaussian_filter, label

D = Path(__file__).resolve().parent; O = Path(sys.argv[1]); CUFF = Path(sys.argv[2]); O.mkdir(exist_ok=True, parents=True)
J = {k: np.array([v['x'], v['y']], float) for k, v in json.loads((D / 'joints.json').read_text()).items()}
Y, X = np.mgrid[:1536, :1024].astype(float)
INK = np.array([18, 14, 14.]); FUR = np.array([112, 62, 38.]); RED = np.array([196, 22, 36.]); DARK = np.array([139, 15, 30.])
W = 7.0  # ink width

def field(p, q, left, right, cap0, cap1):
    """Signed inside-distance around bone p->q; left/right are (t, radius) profiles. Returns f, t, side."""
    d = q - p; L = np.hypot(*d); d /= L; n = np.array([-d[1], d[0]])
    along = (X - p[0]) * d[0] + (Y - p[1]) * d[1]; perp = (X - p[0]) * n[0] + (Y - p[1]) * n[1]
    t = np.clip(along / L, 0, 1)
    rl = PchipInterpolator(*zip(*left))(t); rr = PchipInterpolator(*zip(*right))(t)
    f = np.where(perp < 0, rl + perp, rr - perp)
    f = np.where(along < 0, cap0 - np.hypot(X - p[0], Y - p[1]), f)
    f = np.where(along > L, cap1 - np.hypot(X - q[0], Y - q[1]), f)
    return f, along / L, perp, L

def paint(f, base, ink_mask=None, shade=None, W=W):
    """Colour a field: base fill, optional shade, ink inside the edge where ink_mask says."""
    a = np.clip(f + .5, 0, 1)
    rgb = np.ones((1536, 1024, 3)) * base
    if shade is not None: rgb = rgb * (1 - shade[..., None]) + DARK * shade[..., None]
    rim = np.clip(W + .5 - f, 0, 1)
    if ink_mask is not None: rim = rim * ink_mask
    rgb = rgb * (1 - rim[..., None]) + INK * rim[..., None]
    out = np.dstack([rgb, a * 255]).clip(0, 255).astype(np.uint8); out[out[..., 3] == 0] = 0
    return out

def ramp(v, a, b): return np.clip((v - a) / (b - a), 0, 1)
def save(name, arr): Image.fromarray(arr).save(O / f'{name}.png')

# ---- pelvis: the seat the thighs hang from; the vest covers its top ----
cx, cy = (J['hipL'] + J['hipR']) / 2 + np.array([0, -14.])
rx, ry = 92., 66.
e = ((np.abs(X - cx) / rx) ** 2.6 + (np.abs(Y - cy) / ry) ** 2.6) ** (1 / 2.6)
pf = (1 - e) * min(rx, ry)
pf = np.where((Y < cy) & (np.abs(X - cx) < rx - 8), np.maximum(pf, 40 - (cy - 90 - Y) * (Y < cy - 90)), pf)

# ---- legs: thigh under calf at the knee; calf top is the inkless cap ----
def leg(hip, knee, ankle, name, thigh_in, thigh_out, calf_in, calf_out, inked_hip):
    rk = thigh_out[-1][1]
    f, t, perp, L = field(J[hip], J[knee], thigh_in, thigh_out, thigh_in[0][1], rk)
    ink = None if inked_hip else np.maximum(ramp(t, .06, .22), gaussian_filter((pf < -1).astype(float), 1.5))
    save(f'leg_{name}_upper', paint(f, FUR, ink))
    f, t, perp, L = field(J[knee], J[ankle], calf_in, calf_out, rk - W, 26)
    save(f'leg_{name}_lower', paint(f, FUR, ramp(t, -.005, .012)))

# left leg bends outward at the knee: out = the side away from the crotch
leg('hipL', 'kneeL', 'ankleL', 'l',
    [(0, 68), (.5, 54), (1, 42)], [(0, 66), (.5, 54), (1, 42)],
    [(0, 42), (.28, 44), (.7, 31), (1, 26)], [(0, 42), (.28, 39), (.7, 31), (1, 26)], True)
leg('hipR', 'kneeR', 'ankleR', 'r',
    [(0, 64), (.5, 54), (1, 40)], [(0, 66), (.5, 54), (1, 40)],
    [(0, 40), (.3, 43), (.7, 31), (1, 26)], [(0, 40), (.3, 39), (.7, 31), (1, 26)], False)

thighs = np.array(Image.open(O / 'leg_l_upper.png'))[..., 3] > 128
thighs |= np.array(Image.open(O / 'leg_r_upper.png'))[..., 3] > 128
save('pelvis', paint(pf, FUR, gaussian_filter((~binary_dilation(thighs, iterations=2)).astype(float), 1.5)))

# ---- sleeves ----
def sleeve(shoulder, elbow, wrist, name, up_in, up_out, low_in, low_out, shade_side, inked_shoulder, extra=None):
    re = up_out[-1][1]
    f, t, perp, L = field(J[shoulder], J[elbow], up_in, up_out, up_in[0][1], re)
    if extra is not None: f = gaussian_filter(np.maximum(f, extra), 5)
    shade = np.clip(1 - ((f - 8) / 22).clip(0, 1), 0, 1) * ramp(shade_side * perp, 0, 14) * .75
    ink = None
    if not inked_shoulder:
        torso = np.array(Image.open(Path(sys.argv[3]) / 'torso.png'))[..., 3] > 128
        ink = np.maximum(ramp(t, 0, .08), gaussian_filter((~binary_dilation(torso, iterations=3)).astype(float), 2))
    save(f'arm_{name}_upper', paint(f, RED, ink, gaussian_filter(shade, 1.5)))
    f, t, perp, L = field(J[elbow], J[wrist], low_in, low_out, re - W, 30)
    shade = np.clip(1 - ((f - 8) / 20).clip(0, 1), 0, 1) * ramp(shade_side * perp, 0, 12) * .75
    low = paint(f, RED, ramp(t, -.005, .012), gaussian_filter(shade, 1.5))
    # the cuff: white band across the wrist with its button, one clean ink line
    d = J[wrist] - J[elbow]; Lw = np.hypot(*d); d /= Lw; n = np.array([-d[1], d[0]])
    al = (X - J[wrist][0]) * d[0] + (Y - J[wrist][1]) * d[1]; pe = (X - J[wrist][0]) * n[0] + (Y - J[wrist][1]) * n[1]
    a0, a1, rc = -46., 12., 37.
    fc = np.minimum(np.minimum(al - a0, a1 - al), rc - np.abs(pe))
    cuff_f = paint(fc, np.array([250, 243, 228.]), None, None, W=4.0).astype(float)
    sh = (np.clip(1 - (fc / 10), 0, 1) * ramp(shade_side * pe, 0, 10) * .35)[..., None]
    cuff_f[..., :3] = cuff_f[..., :3] * (1 - sh) + np.array([190, 180, 165.]) * sh
    bc = J[wrist] + d * (-16) + n * (shade_side * 12)
    db = np.hypot(X - bc[0], Y - bc[1])
    ba = np.clip(10.5 - db, 0, 1)[..., None]; bi = np.clip(db - 7.5, 0, 1)[..., None]
    cuff_f[..., :3] = cuff_f[..., :3] * (1 - ba) + (np.array([248, 205, 150.]) * (1 - bi) + np.array([60, 40, 25.]) * bi) * ba
    ca = cuff_f[..., 3:] / 255
    low = low.astype(float)
    low[..., :3] = low[..., :3] * (1 - ca) + cuff_f[..., :3] * ca
    low[..., 3] = np.maximum(low[..., 3], cuff_f[..., 3])
    cuff = fc > -1
    # sleeve stops at the cuff: nothing of it may poke past the cuff's far side
    d = J[wrist] - J[elbow]; d /= np.hypot(*d)
    past = (((X - J[wrist][0]) * d[0] + (Y - J[wrist][1]) * d[1]) > -6) & ~cuff
    low[past] = 0
    low = low.clip(0, 255).astype(np.uint8); low[low[..., 3] == 0] = 0
    save(f'arm_{name}_lower', low)

# Left arm: the sleeve carries on under chin and collar.
pl, ql = np.array([292., 565.]), np.array([405., 565.])
ex, _, _, _ = field(pl, ql, [(0, 34), (1, 44)], [(0, 34), (1, 44)], 34, 44)
sleeve('shoulderL', 'elbowL', 'wristL', 'l',
       [(0, 52), (.5, 46), (1, 38)], [(0, 52), (.5, 46), (1, 38)],
       [(0, 38), (.5, 36), (1, 30)], [(0, 38), (.5, 36), (1, 30)], -1, True, ex)
sleeve('shoulderR', 'elbowR', 'wristR', 'r',
       [(0, 44), (.5, 44), (1, 38)], [(0, 44), (.5, 44), (1, 38)],
       [(0, 38), (.5, 36), (1, 30)], [(0, 38), (.5, 36), (1, 30)], 1, False)
