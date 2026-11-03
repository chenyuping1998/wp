"""MG back knee (Stone 2026-11-03 「後膝也補」, checked on both casts).

The back knee's outer outline is a band of the shin's ink beside the thigh's.
The shin's part ran up past the junction (rows 1077-1089), so on the deepest
bend (-21.5 deg) its top rode over the trouser as a loose stroke. That ink
now belongs to the thigh: the thigh layer is inked under it and the shin's
copy is removed, so the rest pose is identical and the bend leaves no stroke.
The front knee already had the thigh inked under the shin. Run before
build_runtime.py.
"""
from pathlib import Path
import numpy as np
from PIL import Image

D = Path(__file__).resolve().parent / 'layers'
up = np.array(Image.open(D / 'leg_l_upper.png').convert('RGBA'))
lo = np.array(Image.open(D / 'leg_l_lower.png').convert('RGBA'))
Y, X = np.mgrid[:1536, :1024]
lum = lo[..., :3].astype(float) @ [0.3, 0.59, 0.11]
stroke = (lo[..., 3] > 0) & (lum < 60) & (Y >= 1070) & (Y <= 1089) & (X >= 360) & (X <= 381) & (up[..., 3] > 128)
up[stroke, :3] = lo[stroke, :3]
up[stroke, 3] = np.maximum(up[stroke, 3], lo[stroke, 3])
lo[stroke, 3] = 0
Image.fromarray(up).save(D / 'leg_l_upper.png')
Image.fromarray(lo).save(D / 'leg_l_lower.png')
print(f'MG back knee: {int(stroke.sum())} px of outline moved from shin to thigh')
