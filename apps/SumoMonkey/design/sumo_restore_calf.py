"""Restore FG calf volume that 補畫_v5 trimmed away, keeping v5's knee tuck.
Per row: interpolate silhouette edges from v5 (at the knee) to v2 (calf), fringe = v2 fringe shifted."""
import sys, numpy as np
from PIL import Image
v2dir, v5dir, outdir, y0off = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
FR = 18  # fringe width taken from v2 edge
for n in ['leg_back_lower', 'leg_front_lower']:
    a = np.array(Image.open(f'{v2dir}/{n}.png').convert('RGBA')).astype(float)
    b = np.array(Image.open(f'{v5dir}/{n}.png').convert('RGBA')).astype(float)
    u = np.array(Image.open(f'{v5dir}/{n.replace("lower","upper")}.png'))[..., 3]
    v2only = (a[..., 3] > 0) & (b[..., 3] == 0)
    rows = np.where(v2only.any(1))[0]
    ylast = rows.max() + 6
    y0 = np.where(u > 0)[0].max() - y0off      # start reopening just above thigh bottom
    out = b.copy()
    for y in range(rows.min(), ylast + 1):
        t = np.clip((y - y0) / max(1, ylast - 30 - y0), 0, 1)
        w = t * t * (3 - 2 * t)
        if w <= 0: continue
        r5 = np.where(b[y, :, 3] > 128)[0]; r2 = np.where(a[y, :, 3] > 128)[0]
        if len(r2) == 0: continue
        L2, R2 = r2.min(), r2.max()
        L5, R5 = (r5.min(), r5.max()) if len(r5) else ((L2 + R2) // 2, (L2 + R2) // 2)
        Ln = int(round(L5 + w * (L2 - L5))); Rn = int(round(R5 + w * (R2 - R5)))
        new = np.zeros_like(a[y])
        # interior: v5 where solid, else v2
        inner = np.arange(Ln, Rn + 1)
        src = np.where(b[y, inner, 3][:, None] > 200, b[y, inner], a[y, inner])
        new[inner] = src
        # fringes: v2 edge profile shifted to new edge
        for x in range(Ln - FR, Ln + FR // 2):
            sx = x - (Ln - L2)
            if 0 <= x < new.shape[0] and 0 <= sx < new.shape[0] and (x < Ln or a[y, sx, 3] < new[x, 3]):
                new[x] = a[y, sx]
        for x in range(Rn - FR // 2, Rn + FR):
            sx = x - (Rn - R2)
            if 0 <= x < new.shape[0] and 0 <= sx < new.shape[0] and (x > Rn or a[y, sx, 3] < new[x, 3]):
                new[x] = a[y, sx]
        # keep anything v5 already had (knee tuck / v5 fur) where it is stronger
        keep = b[y, :, 3] >= new[:, 3]
        new[keep] = b[y, keep]
        out[y] = new
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(f'{outdir}/{n}.png')
    print(n, 'y0', y0, 'ylast', ylast)
