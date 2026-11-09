"""Coverage of points by the layers drawn above them (posed meshes + texture
alpha). stdin: {"dir": rigDir, "records": [{"above": [{"name", "verts", "uvs",
"tris"}], "points": [[x, y], ...]}]} -> stdout: [min coverage per record].
Used by check_spine_motion_cast.mjs: a squashed/flipped triangle of a lower
layer is only acceptable if the layers over it hide it completely."""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image

req = json.load(sys.stdin)
root = Path(req['dir'])
tex = {}
def alpha(name):
  if name not in tex:
    tex[name] = np.asarray(Image.open(root / f'{name}.png').convert('RGBA'))[:, :, 3].astype(float) / 255
  return tex[name]

out = []
for rec in req['records']:
  worst = 1.0
  for px, py in rec['points']:
    clear = 1.0
    for L in rec['above']:
      V = np.asarray(L['verts'], float).reshape(-1, 2); UV = np.asarray(L['uvs'], float).reshape(-1, 2)
      T = np.asarray(L['tris'], int).reshape(-1, 3)
      a, b, c = V[T[:, 0]], V[T[:, 1]], V[T[:, 2]]
      d = (b[:, 1] - c[:, 1]) * (a[:, 0] - c[:, 0]) + (c[:, 0] - b[:, 0]) * (a[:, 1] - c[:, 1])
      ok = np.abs(d) > 1e-9; d = np.where(ok, d, 1)
      l1 = ((b[:, 1] - c[:, 1]) * (px - c[:, 0]) + (c[:, 0] - b[:, 0]) * (py - c[:, 1])) / d
      l2 = ((c[:, 1] - a[:, 1]) * (px - c[:, 0]) + (a[:, 0] - c[:, 0]) * (py - c[:, 1])) / d
      l3 = 1 - l1 - l2
      hit = np.nonzero(ok & (l1 >= 0) & (l2 >= 0) & (l3 >= 0))[0]
      A = alpha(L['name']); h, w = A.shape
      cov = 0.0
      for i in hit:
        u = l1[i] * UV[T[i, 0], 0] + l2[i] * UV[T[i, 1], 0] + l3[i] * UV[T[i, 2], 0]
        v = l1[i] * UV[T[i, 0], 1] + l2[i] * UV[T[i, 1], 1] + l3[i] * UV[T[i, 2], 1]
        cov = max(cov, A[min(h - 1, max(0, int(v * h))), min(w - 1, max(0, int(u * w)))])
      clear *= 1 - cov
    worst = min(worst, 1 - clear)
  out.append(round(worst, 4))
print(json.dumps(out))
