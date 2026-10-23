"""Composite dump_kit_poses.mjs output at full resolution (QA only).
   python render_kit_poses.py <base|fg> poses.json out.png [crop x0,y0,x1,y1] [scale]"""
import sys, json
from pathlib import Path
from PIL import Image
APP = Path(__file__).resolve().parents[2]
variant, poses, out = sys.argv[1:4]
crop = tuple(map(int, sys.argv[4].split(','))) if len(sys.argv) > 4 else (0, 0, 1024, 1536)
scale = float(sys.argv[5]) if len(sys.argv) > 5 else 0.5
frames = json.load(open(poses))
tiles = []
for f in frames:
  canvas = Image.new('RGBA', (1024, 1536), (32, 36, 46, 255))
  for s in f['slots']:
    img = Image.open(APP / 'static/assets/castLayers/turf/v4' / variant / f"{s['name']}.png").convert('RGBA')
    bl, tl, tr, br = s['quad']
    w, h = img.size
    # canvas point -> image point: invert the affine through TL, TR, BL.
    ax, ay = (tr[0] - tl[0]) / w, (tr[1] - tl[1]) / w
    bx, by = (bl[0] - tl[0]) / h, (bl[1] - tl[1]) / h
    det = ax * by - ay * bx
    a, b, c = by / det, -bx / det, 0
    d, e = -ay / det, ax / det
    coeffs = (a, b, -(a * tl[0] + b * tl[1]), d, e, -(d * tl[0] + e * tl[1]))
    canvas.alpha_composite(img.transform((1024, 1536), Image.Transform.AFFINE, coeffs, Image.Resampling.BICUBIC))
  tiles.append(canvas.crop(crop).resize((int((crop[2] - crop[0]) * scale), int((crop[3] - crop[1]) * scale))))
if out.endswith('.gif'):
  # one frame per pose; side-by-side variants are joined by make step
  tiles[0].save(out, save_all=True, append_images=tiles[1:], duration=int(sys.argv[6]) if len(sys.argv) > 6 else 66, loop=0, disposal=2)
  sys.exit()
W, H = tiles[0].size
sheet = Image.new('RGB', (W * len(tiles), H))
for i, t in enumerate(tiles): sheet.paste(t.convert('RGB'), (i * W, 0))
sheet.save(out)
