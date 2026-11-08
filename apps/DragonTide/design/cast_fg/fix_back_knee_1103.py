"""Back knee: close the nick where the thigh's and the shin's outlines meet
(Stone 2026-11-03 「後膝也補」; character check 後膝 rest 288px²).

At rest the back of the knee showed 2-3 px of background between the end of
the thigh's ink line and the start of the shin's, and the front of the knee
had a small step. Each junction is closed with a small disc (a rounded fill
that follows both outlines, never a chord), painted on the shin layer that is
drawn over the thigh: the new rim pixels take the neighbouring ink, the inside
the neighbouring fur. Run before sync_source_images.py.
"""
import hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import binary_closing, binary_erosion, distance_transform_edt

D = Path(__file__).resolve().parent
L = D / 'layers'
up = np.array(Image.open(L / 'leg_l_upper.png').convert('RGBA')).astype(float)
lo = np.array(Image.open(L / 'leg_l_lower.png').convert('RGBA')).astype(float)
solid = lambda a: a[..., 3] > 128
both = solid(up) | solid(lo)
disc = lambda r: (lambda y, x: x * x + y * y <= r * r)(*np.mgrid[-r:r + 1, -r:r + 1])
WINDOWS = [(1050, 1080, 368, 398, 4), (1066, 1102, 280, 314, 9)]  # back crease, front step (y0,y1,x0,x1,radius)
added = np.zeros_like(both)
for y0, y1, x0, x1, r in WINDOWS:
    m = np.zeros_like(both)
    closed = binary_closing(np.pad(both, 12), structure=disc(r))[12:-12, 12:-12]
    m[y0:y1, x0:x1] = closed[y0:y1, x0:x1] & ~both[y0:y1, x0:x1]
    added |= m
if added.any():
    filled = both | added
    rim = added & ~binary_erosion(filled, structure=disc(2))
    # colour from the nearest existing pixel of the same kind
    comp = lo.copy()
    over = solid(up) & ~solid(lo)
    comp[over] = up[over]
    lum = comp[..., :3] @ [0.3, 0.59, 0.11]
    ink = both & (lum < 70)
    fur = both & (lum >= 70)
    for target, src in ((rim, ink), (added & ~rim, fur)):
        _, (iy, ix) = distance_transform_edt(~src, return_indices=True)
        lo[target, :3] = comp[iy[target], ix[target], :3]
        lo[target, 3] = 255
    Image.fromarray(lo.clip(0, 255).astype(np.uint8)).save(L / 'leg_l_lower.png')
    manifest = json.loads((D / 'source-manifest.json').read_text())
    manifest['layers']['leg_l_lower.png'] = hashlib.sha256((L / 'leg_l_lower.png').read_bytes()).hexdigest()
    (D / 'source-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'back knee: {int(added.sum())} px closed on leg_l_lower')
