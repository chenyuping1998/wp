"""Undo 補畫_v5's straight chord cuts on MG legs: blend silhouettes (signed distance)
from v5 at the knee to the 重拆_v2 drawing away from it. RGB: v5 where v5 is solid, else v2."""
import sys, json, numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, gaussian_filter
v2d, v5d, outd, r0, r1 = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5])
SMOOTH = float(sys.argv[6]) if len(sys.argv) > 6 else 3.0
J = json.load(open(f'{v5d}/joints.json'))
KNEE = {'leg_back_upper': 'kneeB', 'leg_back_lower': 'kneeB', 'leg_front_upper': 'kneeF', 'leg_front_lower': 'kneeF'}
Y, X = np.mgrid[:1536, :1024]
def sdf(m):  # negative inside
    return distance_transform_edt(~m) - distance_transform_edt(m)
for n, k in KNEE.items():
    a = np.array(Image.open(f'{v2d}/{n}.png').convert('RGBA')).astype(float)
    b = np.array(Image.open(f'{v5d}/{n}.png').convert('RGBA')).astype(float)
    t = np.clip((np.hypot(X - J[k]['x'], Y - J[k]['y']) - r0) / (r1 - r0), 0, 1); w = t * t * (3 - 2 * t)
    s = (1 - w) * sdf(b[..., 3] > 128) + w * sdf(a[..., 3] > 128)
    m = np.clip(0.5 - gaussian_filter(s, SMOOTH), 0, 1)          # smooth, anti-aliased blended silhouette
    alpha = np.where(w >= 0.999, a[..., 3], np.maximum(np.minimum(a[..., 3], m * 255), np.where(w <= 0.001, b[..., 3], 0)))
    alpha = np.maximum(alpha, np.minimum(b[..., 3], m * 255))  # v5 kept inside the blended shape
    # feather v5's retextured fur into the restored v2 fur so no patch edge shows
    d5 = sdf(b[..., 3] > 200)
    f = np.clip((d5 + 6) / 18, 0, 1)[..., None]
    f = np.where((a[..., 3] > 200)[..., None], f, 0.0)          # where v2 has no paint keep v5
    rgb = (1 - f) * b[..., :3] + f * a[..., :3]
    out = np.dstack([rgb, alpha]).clip(0, 255).astype(np.uint8); out[out[..., 3] == 0, :3] = 0
    Image.fromarray(out).save(f'{outd}/{n}.png')
