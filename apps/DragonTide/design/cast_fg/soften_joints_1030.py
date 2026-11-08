"""FG joints after restore_limbs_from_master: light specks out, burrs off, and a hinge at each
elbow and knee: creases that would cross a straightened limb melt into the fur, and the upper part
continues under the lower so a bend never opens a gap. Deliberately no ink ring: that reads as a ball joint.
Usage: soften_joints_1030.py <in dir> <out dir> <layers before repair>"""
import json, shutil, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import binary_closing, binary_dilation, binary_fill_holes, binary_opening, distance_transform_edt, gaussian_filter, label

D = Path(__file__).resolve().parent; I, O, B = map(Path, sys.argv[1:4]); O.mkdir(exist_ok=True, parents=True)
for f in I.glob('*.png'): shutil.copy2(f, O / f.name)
J = json.loads((D / 'joints.json').read_text())
Y, X = np.mgrid[:1536, :1024].astype(float)
INK = np.array([52, 26, 16.])
load = lambda n, d=O: np.array(Image.open(d / f'{n}.png').convert('RGBA')).astype(float)
def save(n, a):
    a = a.clip(0, 255).astype(np.uint8); a[a[..., 3] == 0] = 0; Image.fromarray(a).save(O / f'{n}.png')
def cloth(n):
    b = load(n, B); r, g, bl = b[..., 0], b[..., 1], b[..., 2]
    m = (b[..., 3] > 128) & (((r > 190) & (g > 170)) | ((r > 170) & (g > 110) & (bl < 110) & (g - bl > 50)) | (r > 150) & (g < 70))
    ids, k = label(m, np.ones((3, 3)))
    if not k: return np.zeros_like(m)
    big = np.nonzero(np.bincount(ids.ravel())[1:] >= 300)[0] + 1
    return binary_dilation(np.isin(ids, big), iterations=4)
def fur_near(a, where, src):
    _, n = distance_transform_edt(~src, return_indices=True)
    a[where, :3] = a[n[0][where], n[1][where], :3]

PARTS = ['leg_l_upper', 'leg_l_lower', 'leg_r_upper', 'leg_r_lower', 'arm_l_upper', 'arm_l_lower', 'arm_r_upper', 'arm_r_lower', 'tail_1', 'tail_2', 'tail_3']
# 1. light specks and fringes anywhere on fur become fur; at the very edge, ink.
for n in PARTS:
    a = load(n); c = cloth(n); m = a[..., 3] > 128
    light = (a[..., 3] > 0) & (a[..., :3].mean(-1) > 128) & ~c
    if light.any():
        src = m & ~binary_dilation(light, iterations=2) & ~c
        if src.any():
            fur_near(a, light, src)
            a[light & ~m, 3] = 0
    save(n, a)

def melt(a, where, src, sigma=9.):
    """Fill with the softly blurred colour of the nearby fur, keeping no hard facets."""
    w = gaussian_filter(src.astype(float), sigma)
    for ch in range(3):
        c = gaussian_filter(a[..., ch] * src, sigma) / np.maximum(w, 1e-3)
        a[..., ch] = np.where(where, c, a[..., ch])

# 2. joints
HINGES = [('elbowL', 'arm_l_upper', 'arm_l_lower', 'shoulderL', 'wristL'), ('elbowR', 'arm_r_upper', 'arm_r_lower', 'shoulderR', 'wristR'),
          ('kneeL', 'leg_l_upper', 'leg_l_lower', 'hipL', 'ankleL'), ('kneeR', 'leg_r_upper', 'leg_r_lower', 'hipR', 'ankleR')]
def seg_dist(p, q):
    p, q = np.array([p['x'], p['y']], float), np.array([q['x'], q['y']], float); v = q - p
    t = np.clip(((X - p[0]) * v[0] + (Y - p[1]) * v[1]) / (v @ v), 0, 1)
    return np.hypot(X - p[0] - v[0] * t, Y - p[1] - v[1] * t)
for joint, up, low, parent, child in HINGES:
    u, l = load(up), load(low); j = J[joint]; d = np.hypot(X - j['x'], Y - j['y'])
    union = binary_fill_holes((u[..., 3] > 128) | (l[..., 3] > 128))
    r = distance_transform_edt(union)[int(j['y']), int(j['x'])]
    # Each pixel near the joint lives on the bone it is nearest to, so nothing sticks out past the joint when it bends.
    du, dl = seg_dist(j, J[parent]), seg_dist(j, J[child])
    lim = (d > r) & (d < r + 70)
    near_up = du < dl
    c = lim & near_up & (u[..., 3] < l[..., 3]); u[c] = l[c]     # both parts own the shape at rest
    c = lim & ~near_up & (l[..., 3] < u[..., 3]); l[c] = u[c]
    OVERLAP = 34                                                 # and keep this much overlap, or bends crack
    l[lim & (du < dl - OVERLAP)] = 0
    u[lim & (dl < du - OVERLAP)] = 0
    # The lower part's near end fades out into the upper, so no step shows when the limb straightens.
    fade = np.clip((du - dl + OVERLAP) / OVERLAP, 0, 1)
    l[..., 3] = np.where(lim & near_up, l[..., 3] * fade, l[..., 3])
    zone = d < r + 26
    for a in (u, l):                                   # burrs and ticks around the joint
        m = a[..., 3] > 128
        a[m & ~binary_opening(m, iterations=7) & zone] = 0
    # lower: creases inside the limb go; its outer outline stays
    m = l[..., 3] > 128
    inside = distance_transform_edt(m) > 4
    crease = inside & (l[..., :3].mean(-1) < 78) & (d < r + 12)
    fur = m & (l[..., :3].mean(-1) >= 78) & ~binary_dilation(crease, iterations=3)
    if crease.any() and fur.any():
        melt(l, binary_dilation(crease, iterations=2) & m, fur)
    # upper: runs on under the lower, as plain fur
    m = u[..., 3] > 128
    furu = m & (u[..., :3].mean(-1) >= 78)
    new = (d < r) & ~m
    if new.any() and furu.any():
        melt(u, new, furu, 14.); u[new, 3] = 255
    # The upper's edge shows only when the joint bends: it needs its own ink there.
    m = u[..., 3] > 128; depth = distance_transform_edt(m)
    rim = (np.clip(3.9 - depth, 0, 1) * (d < r + 70) * ~cloth(up))[..., None]
    u[..., :3] = u[..., :3] * (1 - rim) + INK * rim
    # Fading can strand islands; a part is one piece.
    for a in (u, l):
        ids, k = label(a[..., 3] > 40, np.ones((3, 3)))
        if k > 1:
            sizes = np.bincount(ids.ravel()); sizes[0] = 0
            a[(ids != sizes.argmax())] = 0
    save(up, u); save(low, l)

# 2b. notches beside the cuffs: close them with fur and run the ink over the new edge
for n in ['arm_l_upper', 'arm_r_upper']:
    a = load(n); m = a[..., 3] > 128; c = cloth(n)
    zone = binary_dilation(c, iterations=45)
    closed = binary_closing(m, iterations=16) & zone
    new = closed & ~m
    if new.any():
        src = m & ~c & (a[..., :3].mean(-1) >= 78)
        melt(a, new, src, 8.); a[new, 3] = 255
        depth = distance_transform_edt(a[..., 3] > 128)
        rim = (np.clip(3.9 - depth, 0, 1) * binary_dilation(new, iterations=8) * ~c)[..., None]
        a[..., :3] = a[..., :3] * (1 - rim) + INK * rim
        print(n, 'notch px', int(new.sum()))
    save(n, a)

# 3. shorts: loose light bits along the edge
a = load('pelvis', B)
light = (a[..., 3] > 0) & (a[..., :3].mean(-1) > 165)
pale = (a[..., 3] > 0) & (a[..., :3].mean(-1) > 150) & (a[..., :3].max(-1) - a[..., :3].min(-1) < 70)
ok = (a[..., 3] > 128) & ~binary_dilation(pale, iterations=2)
_, nn = distance_transform_edt(~ok, return_indices=True)
a[pale, :3] = a[nn[0][pale], nn[1][pale], :3]
print('pelvis pale px', int(pale.sum()))
light = (a[..., 3] > 0) & (a[..., :3].mean(-1) > 200)
ids, k = label(light, np.ones((3, 3)))
if k:
    sizes = np.bincount(ids.ravel())
    small = np.isin(ids, np.nonzero(sizes < 120)[0]) & light
    a[small] = 0
    print('pelvis light bits', int(small.sum()))
    save('pelvis', a)
