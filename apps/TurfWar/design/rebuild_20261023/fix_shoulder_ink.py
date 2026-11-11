"""Lift the body layer's drawn shoulder outline where it lies over the lead arm
(2026-11-07 「turf手肩膀這邊還是有黑線分離感」, MG hoodie bulb + FG shirt shoulder).

The body layer paints the lead sleeve's shoulder (MG jacket bulb, FG shirt
cap) with a full ink contour. The arm layer sits UNDER the body, so the part
of that contour that already overlaps the arm at rest is an outline inside
one sleeve: at full reach (punch) and with the arm raised (celebrate) it reads
as a black seam across the fabric. 拆圖重疊處不要描邊 → repaint those ink
pixels with the sleeve fabric next to them (cv2 Telea inpaint from the
sleeve's own interior). Alpha is untouched, so the silhouette over the
background keeps its ink and nothing is cut.

Reads cast/<who>/body_pre_ink_20261107.png (made on first run), writes
cast/<who>/body.png and cast/<who>/full.png (the layer composite;
full_pre_ink_20261107.png keeps the delivered one). Run:
  /Applications/anaconda3/bin/python3 design/rebuild_20261023/fix_shoulder_ink.py [--debug DIR]
then regen_motion.sh.
"""
from pathlib import Path
import sys, shutil, json
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage as ndi

D = Path(__file__).resolve().parent
sys.path.insert(0, str(D))
from split_kit_layers import CHARS

BAND = 9        # px inside the body's edge that count as the contour
INK_LUM = 95    # darker than this inside the band = ink
SHADE = 0.82    # x sleeve fabric median: darker rim shading goes with the ink
SHADE_REACH = 16  # px from the removed ink over which that shading is lifted
RIM_SHADE_ALL = ('fg',)
GROW = 2        # grow the ink mask so its anti-aliased fringe goes too


def main():
  dbg = Path(sys.argv[sys.argv.index('--debug') + 1]) if '--debug' in sys.argv else None
  for who in ('mg', 'fg'):
    src = D / 'cast' / who / 'body_pre_ink_20261107.png'
    if not src.exists():
      shutil.copy2(D / 'cast' / who / 'body.png', src)
    b = np.asarray(Image.open(src).convert('RGBA')).copy()
    arm = np.asarray(Image.open(D / 'cast' / who / 'arm_r.png').convert('RGBA'))
    ba = b[..., 3] > 8
    edge = ndi.distance_transform_edt(ba) <= BAND
    under = ndi.binary_dilation(arm[..., 3] > 40, iterations=3)  # the arm is beneath (its own rim included: no straight cut where it ends)
    c = CHARS[who]; j = c['j']
    e0, e1 = (np.asarray(p, float) for p in c['sleeve_edge'])
    en = np.array([e1[1] - e0[1], -(e1[0] - e0[0])]); en /= np.linalg.norm(en)
    if en @ (np.asarray(j['elbowF'], float) - e0) < 0: en = -en
    yy, xx = np.mgrid[:b.shape[0], :b.shape[1]]
    P = np.stack([xx, yy], -1).astype(float)
    sh = np.asarray(j['shoulderF'], float); el = np.asarray(j['elbowF'], float); d = el - sh
    t = ((P - sh) @ d) / (d @ d)
    bulb = c['sleeve_bulb']
    # the painted sleeve only: arm side of the drawn seam, shoulder half of the upper arm
    sleeve = ((P - e0) @ en > 6) & (t < bulb['t'] + 0.15)
    lum = b[..., :3].astype(float).mean(-1)
    ink = ba & edge & under & sleeve & (lum < INK_LUM)
    ink = ndi.binary_dilation(ink, iterations=GROW) & ba & under & sleeve & edge
    # the rim's own shade band (FG's tan crescent) read as a smudge beside the
    # arm's clean sleeve at full reach: lift what is clearly darker than the
    # sleeve fabric, but only in a band touching the ink just removed
    fab = np.median(lum[ba & sleeve & under & ~edge & (lum >= INK_LUM + 30)])
    near_ink = ndi.binary_dilation(ink, iterations=SHADE_REACH)
    # (shade reaches a little past the arm: at full reach the arm swings up
    # under the rim's upper crescent too; the ink there stays, it is silhouette)
    shade_zone = ndi.binary_dilation(under, iterations=14)
    ink |= ba & shade_zone & sleeve & near_ink & (lum < SHADE * fab) & (lum >= INK_LUM)
    if who in RIM_SHADE_ALL:
      # FG's cap is a thin crescent whose whole rim is a tan shade band; the
      # raised arm sits behind its top too, so the band goes all along the cap
      dist = ndi.distance_transform_edt(ba)
      ink |= ba & sleeve & (dist <= 14) & (lum < SHADE * fab) & (lum >= INK_LUM)
    # fill from the sleeve's own fabric next to it: normalised blur of the
    # light (non-ink) sleeve pixels, so shading carries over but no grey smear
    known = (ba & ~ink & sleeve & (lum >= 0.9 * fab)).astype(np.float32)
    rgbf = b[..., :3].astype(np.float32)
    fill = np.zeros_like(rgbf)
    for sg in (4, 8, 16):   # widen until every ink pixel has fabric nearby
      wk = cv2.GaussianBlur(known, (0, 0), sg)
      fk = cv2.GaussianBlur(rgbf * known[..., None], (0, 0), sg) / np.maximum(wk, 1e-6)[..., None]
      todo = (fill.sum(-1) == 0) & (wk > 0.05)
      fill[todo] = fk[todo]
    fill = np.clip(fill, 0, 255).astype(np.uint8)
    # feathered: the repaint fades into the original over ~2 px, no hard border
    w = np.clip(cv2.GaussianBlur(ink.astype(np.float32), (0, 0), 1.5) * 1.6, 0, 1)
    w = np.where(ink, 1.0, w) * (ba & sleeve) * (fill.sum(-1) > 0)
    b[..., :3] = np.clip(b[..., :3] * (1 - w[..., None]) + fill * w[..., None], 0, 255).astype(np.uint8)
    Image.fromarray(b).save(D / 'cast' / who / 'body.png', optimize=True)
    # full.png is the composite of the layers (check_cast_proportions.py)
    full_src = D / 'cast' / who / 'full_pre_ink_20261107.png'
    if not full_src.exists():
      shutil.copy2(D / 'cast' / who / 'full.png', full_src)
    order = json.loads((D / 'cast' / who / 'layers.json').read_text())['order']
    full = Image.new('RGBA', (b.shape[1], b.shape[0]))
    for n in order:
      full.alpha_composite(Image.fromarray(b) if n == 'body' else Image.open(D / 'cast' / who / f'{n}.png').convert('RGBA'))
    old = np.asarray(Image.open(full_src).convert('RGBA')).astype(int)
    print(who, 'full.png rebuilt; pixels changed vs delivered full:', int((np.abs(np.asarray(full).astype(int) - old).max(-1) > 1).sum()))
    full.save(D / 'cast' / who / 'full.png', optimize=True)
    print(who, 'repainted', int(ink.sum()), 'px; alpha unchanged:',
          bool(np.array_equal(b[..., 3], np.asarray(Image.open(src).convert('RGBA'))[..., 3])))
    if dbg:
      dbg.mkdir(parents=True, exist_ok=True)
      x0, y0 = int(sh[0]) - 90, int(sh[1]) - 110
      box = (x0, y0, x0 + 260, y0 + 280)
      before = np.asarray(Image.open(src).convert('RGBA'))
      tiles = []
      for img, mark in ((before, True), (b, False)):
        for bg in ((40, 44, 54), (225, 215, 195)):
          t_ = Image.new('RGB', (b.shape[1], b.shape[0]), bg)
          rgb_ = img[..., :3].copy()
          if mark: rgb_[ink] = (255, 0, 0)
          t_.paste(Image.fromarray(rgb_), (0, 0), Image.fromarray(img[..., 3]))
          tiles.append(t_.crop(box).resize((520, 560)))
      sheet = Image.new('RGB', (520 * 4, 560))
      for i, t_ in enumerate(tiles): sheet.paste(t_, (i * 520, 0))
      sheet.save(dbg / f'ink_{who}.png')


if __name__ == '__main__':
  main()
