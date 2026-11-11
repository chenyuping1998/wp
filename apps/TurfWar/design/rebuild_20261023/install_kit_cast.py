"""Install the spine-motion-kit boxer rigs (kit/<who>/spine) into the game.

Each kit image is a full 1024x1536 canvas; 13 of them per figure would cost
~80 MB of GPU memory, so every image is cropped to its alpha box and the region
attachment's centre is moved by the same amount (rotated into the bone frame).
Adds the `turf` block CastFigureMesh needs (canvas-space figure box / origin);
the motion envelope is filled in by measure_kit_cast.mjs.

Run: /Applications/anaconda3/bin/python3 design/rebuild_20261023/install_kit_cast.py
"""
from pathlib import Path
import json, math, shutil
from PIL import Image
import numpy as np
from scipy import ndimage

D = Path(__file__).resolve().parent
APP = D.parent.parent
OUT = APP / 'static/assets/castLayers/turf/v4'

for who, variant in (('mg', 'base'), ('fg', 'fg')):
  kit = D / 'kit' / who / 'spine'
  rig = json.loads((kit / f'turf_{who}.json').read_text())
  dest = OUT / variant
  if dest.exists(): shutil.rmtree(dest)
  dest.mkdir(parents=True)
  sk = rig['skeleton']
  # The kit slides the head ±21 px sideways in the weave and turns it 11° in the
  # punch; with no neck layer that reads as a detached head (「脖子分離」
  # 2026-10-23). Keep the head riding the chest: translate ×0.25, rotate ×0.45.
  for anim in rig['animations'].values():
    for prop, keys in anim.get('bones', {}).get('head', {}).items():
      k = 0.45 if prop == 'rotate' else 0.25
      for key in keys:
        for f in ('value', 'x', 'y'):
          if f in key: key[f] = round(key[f] * k, 3)
        if 'curve' in key:  # bezier handles carry values too: [t, v, t, v, ...]
          key['curve'] = [c * k if i % 2 else c for i, c in enumerate(key['curve'])]
  hull = {}
  # Spine y-up skeleton space -> delivered canvas (y down): canvas = (x - sx, sy + h - y)
  origin = [-sk['x'], sk['y'] + sk['height']]
  for skin in rig['skins']:
    for slot, entries in skin['attachments'].items():
      for name, att in entries.items():
        assert att.get('type', 'region') == 'region', (slot, name)
        img = Image.open(kit / 'images' / f"{att.get('path', name)}.png").convert('RGBA')
        x0, y0, x1, y1 = img.getchannel('A').getbbox()
        pad = 2
        x0, y0, x1, y1 = max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)
        crop = img.crop((x0, y0, x1, y1)); crop.save(dest / f'{name}.png', optimize=True)
        # Silhouette outline as (u, v) in the crop, for measuring the posed ink.
        m = np.asarray(crop.getchannel('A')) > 32
        edge = np.argwhere(m & ~ndimage.binary_erosion(m))[::2]
        hull[name] = [[round(float(x) / crop.width, 4), round(float(y) / crop.height, 4)] for y, x in edge]
        sx, sy = att.get('scaleX', 1), att.get('scaleY', 1)
        dx = ((x0 + x1) / 2 - img.width / 2) * sx
        dy = -((y0 + y1) / 2 - img.height / 2) * sy
        r = math.radians(att.get('rotation', 0))
        att['x'] = round(att.get('x', 0) + dx * math.cos(r) - dy * math.sin(r), 3)
        att['y'] = round(att.get('y', 0) + dx * math.sin(r) + dy * math.cos(r), 3)
        att['width'], att['height'] = x1 - x0, y1 - y0
  full = Image.open(D / 'cast' / who / 'full.png')
  rig['turf'] = {
    'figureBox': list(full.getchannel('A').getbbox()),
    'origin': origin,
    'envelope': [0, 1024],
    'generator': 'spine-motion-kit character (boxer template) / Spine ' + sk['spine'],
  }
  (D / 'kit' / who / 'outline.json').write_text(json.dumps(hull))
  (dest / 'cast.spine.json').write_text(json.dumps(rig, separators=(',', ':')))
  print(variant, 'slots', len(rig['slots']), 'origin', origin, 'figureBox', rig['turf']['figureBox'])
