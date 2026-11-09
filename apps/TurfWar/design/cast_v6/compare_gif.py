"""Side-by-side real-speed GIF: shipped v5 rig vs v6, same event sequence.
  python design/cast_v6/compare_gif.py <who mg|fg> <out.gif> [fps] [scale]"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, str(Path(__file__).resolve().parent))
import render as R
D = Path(__file__).resolve().parent; APP = D.parent.parent
who, out = sys.argv[1], Path(sys.argv[2])
fps = int(sys.argv[3]) if len(sys.argv) > 3 else 15
scale = float(sys.argv[4]) if len(sys.argv) > 4 else 0.25
variant = 'base' if who == 'mg' else 'fg'
EVENTS = 'win@2.2,winBig@4.4,trigger@7.2'
rigs = [('v5 (live)', APP / 'design/_legacy_assets/castLayers_v5_20261109/v5' / variant),
        ('v6 (new)', APP / 'static/assets/castLayers/turf/v6' / variant)]
cols = []
for label, rig in rigs:
  tmp = out.with_suffix(f'.{label[:2]}.json')
  subprocess.run(['node', str(D / 'sim.mjs'), str(rig), str(tmp), '--fps', str(fps), '--dur', '10', '--events', EVENTS],
                 cwd=APP, check=True, capture_output=True)
  data = json.load(open(tmp)); tmp.unlink()
  texs = [R.load_tex(rig / f"{h['name']}.png", min(1.0, scale * 1.5)) for h in data['header']]
  frames = []
  for f in data['frames']:
    im = Image.fromarray(R.render_frame(f['slots'], data['header'], texs, (0, 0, 1180, 1536), scale, (58, 61, 66)))
    d = ImageDraw.Draw(im); d.text((6, 6), f"{label}  {f['t']:.1f}s", fill=(255, 220, 0))
    frames.append(im)
  cols.append(frames)
n = min(len(c) for c in cols)
w, h = cols[0][0].size
gif = []
marks = {2.2: 'WIN', 4.4: 'BIG WIN', 7.2: 'FREE SPINS'}
for i in range(n):
  sheet = Image.new('RGB', (w * 2 + 6, h), (20, 20, 20))
  sheet.paste(cols[0][i], (0, 0)); sheet.paste(cols[1][i], (w + 6, 0))
  t = i / fps
  for at, txt in marks.items():
    if at <= t < at + 1.0:
      ImageDraw.Draw(sheet).text((w - 30, h - 20), txt, fill=(245, 137, 61))
  gif.append(sheet.convert('P', palette=Image.ADAPTIVE, colors=255))
gif[0].save(out, save_all=True, append_images=gif[1:], duration=int(1000 / fps), loop=0)
print(out, n, 'frames')
