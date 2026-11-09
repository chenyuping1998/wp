"""Render sim.mjs output the way Pixi draws it: every mesh triangle textured
with bilinear sampling, premultiplied alpha, layers in slot order.

  python design/cast_v6/render.py <frames.json> <outdir> [--scale 0.5]
         [--crop x0,y0,x1,y1] [--bg 58,61,66] [--sheet cols] [--gif] [--png]
         [--label] [--every N]

Texture per slot is <rigdir>/<slot>.png (rigdir from frames.json).
"""
import argparse, json, os
from pathlib import Path
import numpy as np
import cv2
cv2.setNumThreads(1)
from PIL import Image, ImageDraw


def load_tex(path, s=1.0):
  im = Image.open(path).convert('RGBA')
  if s < 1.0:
    # premultiply before shrinking so transparent texels do not bleed colour
    t = np.asarray(im).astype(np.float32) / 255.0
    t[..., :3] *= t[..., 3:4]
    w, h = max(2, round(im.width * s)), max(2, round(im.height * s))
    return cv2.resize(t, (w, h), interpolation=cv2.INTER_AREA)
  t = np.asarray(im).astype(np.float32) / 255.0
  t[..., :3] *= t[..., 3:4]  # premultiply, as Pixi uploads it
  return t


def render_frame(slots, header, texs, crop, scale, bg):
  x0, y0, x1, y1 = crop
  W, H = int(round((x1 - x0) * scale)), int(round((y1 - y0) * scale))
  out = np.zeros((H, W, 3), np.float32); out[...] = np.asarray(bg, np.float32) / 255.0
  for verts, hd, tex in zip(slots, header, texs):
    V = (np.asarray(verts, np.float32).reshape(-1, 2) - (x0, y0)) * scale
    UV = np.asarray(hd['uvs'], np.float32).reshape(-1, 2)
    T = np.asarray(hd['tris'], np.int32).reshape(-1, 3)
    ids = np.full((H, W), -1, np.float32)
    P = np.round(V * 16).astype(np.int32)
    for i, (a, b, c) in enumerate(T):
      cv2.fillConvexPoly(ids, np.stack([P[a], P[b], P[c]]), float(i), lineType=cv2.LINE_8, shift=4)
    m = ids >= 0
    if not m.any():
      continue
    yy, xx = np.nonzero(m)
    ti = ids[m].astype(np.int64)
    pa, pb, pc = V[T[ti, 0]], V[T[ti, 1]], V[T[ti, 2]]
    px, py = xx + 0.5, yy + 0.5
    d = (pb[:, 1] - pc[:, 1]) * (pa[:, 0] - pc[:, 0]) + (pc[:, 0] - pb[:, 0]) * (pa[:, 1] - pc[:, 1])
    d = np.where(np.abs(d) < 1e-9, 1e-9, d)
    l1 = ((pb[:, 1] - pc[:, 1]) * (px - pc[:, 0]) + (pc[:, 0] - pb[:, 0]) * (py - pc[:, 1])) / d
    l2 = ((pc[:, 1] - pa[:, 1]) * (px - pc[:, 0]) + (pa[:, 0] - pc[:, 0]) * (py - pc[:, 1])) / d
    l3 = 1 - l1 - l2
    ua, ub, uc = UV[T[ti, 0]], UV[T[ti, 1]], UV[T[ti, 2]]
    u = l1 * ua[:, 0] + l2 * ub[:, 0] + l3 * uc[:, 0]
    v = l1 * ua[:, 1] + l2 * ub[:, 1] + l3 * uc[:, 1]
    th, tw = tex.shape[:2]
    mapx = np.full((H, W), -10, np.float32); mapy = np.full((H, W), -10, np.float32)
    mapx[m] = u * tw - 0.5; mapy[m] = v * th - 0.5
    layer = cv2.remap(tex, mapx, mapy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    out = layer[..., :3] + out * (1 - layer[..., 3:4])
  return (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)


_CTX = {}


def _job(slots):
  c = _CTX
  return render_frame(slots, c['header'], c['texs'], c['crop'], c['scale'], c['bg'])


def main():
  ap = argparse.ArgumentParser()
  ap.add_argument('frames'); ap.add_argument('outdir')
  ap.add_argument('--scale', type=float, default=0.5)
  ap.add_argument('--crop', default='0,0,1024,1536')
  ap.add_argument('--bg', default='58,61,66')
  ap.add_argument('--sheet', type=int, default=0)
  ap.add_argument('--gif', action='store_true')
  ap.add_argument('--png', action='store_true')
  ap.add_argument('--label', action='store_true')
  ap.add_argument('--every', type=int, default=1)
  ap.add_argument('--name', default='')
  ap.add_argument('--tex', default='')
  a = ap.parse_args()
  data = json.load(open(a.frames))
  rig = Path(a.tex or data['dir'])
  texs = [load_tex(rig / f"{h['name']}.png", min(1.0, a.scale * 1.5)) for h in data['header']]
  crop = list(map(int, a.crop.split(','))); bg = tuple(map(int, a.bg.split(',')))
  out = Path(a.outdir); out.mkdir(parents=True, exist_ok=True)
  name = a.name or Path(a.frames).stem
  frames = data['frames'][::a.every]
  ims = []
  for f in frames:
    im = Image.fromarray(render_frame(f['slots'], data['header'], texs, crop, a.scale, bg))
    if a.label:
      ImageDraw.Draw(im).text((4, 4), f"{f['t']:.2f}", fill=(255, 220, 0))
    ims.append(im)
    if a.png:
      im.save(out / f"{name}_{f['t']:06.3f}.png")
  if a.sheet:
    cols = a.sheet; rows = -(-len(ims) // cols); w, h = ims[0].size
    sh = Image.new('RGB', (w * cols, h * rows), (0, 0, 0))
    for i, im in enumerate(ims):
      sh.paste(im, ((i % cols) * w, (i // cols) * h))
    sh.save(out / f'{name}_sheet.jpg', quality=90)
  if a.gif:
    dt = (frames[1]['t'] - frames[0]['t']) if len(frames) > 1 else 0.05
    pal = [im.convert('P', palette=Image.ADAPTIVE, colors=255) for im in ims]
    pal[0].save(out / f'{name}.gif', save_all=True, append_images=pal[1:], duration=int(round(dt * 1000)), loop=0, optimize=False)
  print(out, name, len(ims))


if __name__ == '__main__':
  main()
