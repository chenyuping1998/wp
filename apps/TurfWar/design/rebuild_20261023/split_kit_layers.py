"""Cut the delivered 4-layer cast (cast/{mg,fg}) into spine-motion-kit's
boxer template layers (docs/生圖交付規格.md), so `spine-motion character`
can rig the real fighting idle / punch / celebrate set.

Each limb pixel goes to the bone segment it is nearest to; every piece is then
grown into its neighbours (inside the original silhouette) so joints overlap.
Nothing is repainted or moved: composite of the output == cast/<who>/full.png.

Run: /Applications/anaconda3/bin/python3 design/rebuild_20261023/split_kit_layers.py
Out: design/rebuild_20261023/kit/<who>/layers/*.png + layers.json + joints.json
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy import ndimage

D = Path(__file__).resolve().parent

# Canvas px, y down. The extended far arm (arm_r, behind the body) is the kit's
# FRONT (lead/jab) arm; the near guard arm (arm_l, over the chest) is the BACK
# arm. layers.json keeps the near arm drawn on top. Legs: the
# right-hand (+x) leg is the lead/front leg, as in the kit template.
CHARS = {
  'mg': {
    'hem': 690, 'overlap': 30,
    # body-painted upper sleeve: within r px of the lead upper arm, right of x
    'sleeve_bulb': {'r': 95, 'x': 640, 't': 0.6},
    # where the body-painted sleeve meets the torso (inner seam of the bulb)
    'sleeve_edge': ((612, 300), (650, 480)),
    'j': {
      'hip': (505, 800), 'waist': (500, 660), 'neckBase': (532, 362), 'headBase': (545, 330),
      'headTop': (565, 30),
      'shoulderB': (300, 295), 'elbowB': (212, 480), 'wristB': (430, 420), 'fistB': (495, 385),
      'shoulderF': (640, 360), 'elbowF': (735, 545), 'wristF': (822, 462), 'fistF': (850, 400),
      'hipF': (590, 805), 'kneeF': (848, 1140), 'ankleF': (800, 1325), 'toeF': (960, 1440),
      'hipB': (425, 805), 'kneeB': (250, 1145), 'ankleB': (150, 1330), 'toeB': (75, 1450),
    },
  },
  'fg': {
    'hem': 612, 'overlap': 30,
    'sleeve_bulb': {'r': 80, 'x': 690, 't': 0.6},
    'sleeve_edge': ((688, 270), (692, 440)),  # the vest's armhole
    'j': {
      'hip': (510, 690), 'waist': (510, 575), 'neckBase': (540, 440), 'headBase': (548, 405),
      'headTop': (540, 25),
      'shoulderB': (307, 275), 'elbowB': (273, 530), 'wristB': (500, 398), 'fistB': (575, 360),
      'shoulderF': (675, 330), 'elbowF': (737, 515), 'wristF': (865, 440), 'fistF': (918, 392),
      'hipF': (592, 700), 'kneeF': (790, 1015), 'ankleF': (722, 1320), 'toeF': (905, 1400),
      'hipB': (428, 700), 'kneeB': (282, 1130), 'ankleB': (215, 1345), 'toeB': (150, 1465),
    },
  },
}


def seg_dist(shape, a, b):
  h, w = shape
  yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
  ax, ay = a; bx, by = b
  dx, dy = bx - ax, by - ay
  t = np.clip(((xx - ax) * dx + (yy - ay) * dy) / max(1e-6, dx * dx + dy * dy), 0, 1)
  return np.hypot(xx - (ax + t * dx), yy - (ay + t * dy))


def nearest(alpha, segs):
  """segs: {name: [(a,b), ...]} -> {name: bool mask} partition of alpha>0."""
  names = list(segs)
  dist = np.stack([np.min([seg_dist(alpha.shape, a, b) for a, b in segs[n]], axis=0) for n in names])
  win = dist.argmin(0)
  return {n: (win == i) & (alpha > 0) for i, n in enumerate(names)}


def grow(mask, alpha, r):
  if r <= 0: return mask
  disk = np.hypot(*np.mgrid[-r:r + 1, -r:r + 1]) <= r
  return ndimage.binary_dilation(mask, structure=disk) & (alpha > 0)


def disk(shape, c, r):
  yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
  return np.hypot(xx - c[0], yy - c[1]) <= r


def chain(alpha, joints, R):
  """Cut a limb (list of joints root..tip) into pieces, root first.
  The piece drawn ON TOP at each joint keeps only a tube of its own thickness
  plus a disk centred on the joint: both stay inside the parent when it
  rotates, so cuffs / elbow flesh never swing out (2026-10-23, 「手肘肉會跑出來」).
  What the tube refuses (bunched sleeve, elbow bulk) stays with the parent,
  which is drawn underneath and also gets the joint disk."""
  segs = list(zip(joints[:-1], joints[1:]))
  part = nearest(alpha, {i: [sg] for i, sg in enumerate(segs)})
  edt = ndimage.distance_transform_edt(alpha > 32)
  at = lambda p: float(edt[min(alpha.shape[0] - 1, int(p[1])), min(alpha.shape[1] - 1, int(p[0]))])
  masks = [part[i].copy() for i in range(len(segs))]
  for i in range(len(segs) - 1, 0, -1):
    a, b = segs[i]
    # thickness from the far half of the bone (the near half sits in the cuff)
    r = max(at((a[0] * .3 + b[0] * .7, a[1] * .3 + b[1] * .7)), at((a[0] * .5 + b[0] * .5, a[1] * .5 + b[1] * .5)) * .8) * 1.3 + 4
    rj = at(a) + 2
    keep = masks[i] & ((seg_dist(alpha.shape, a, b) <= r) | disk(alpha.shape, a, rj))
    masks[i - 1] |= masks[i] & ~keep
    masks[i] = keep | (disk(alpha.shape, a, rj) & (alpha > 0))
    masks[i - 1] |= disk(alpha.shape, a, rj + 12) & (alpha > 0)
  masks[0] = grow(masks[0], alpha, R)
  return masks


def cut(img, mask):
  out = img.copy(); out[~mask] = 0
  return Image.fromarray(out)


def main():
  for who, cfg in CHARS.items():
    src = D / 'cast' / who
    out = D / 'kit' / who / 'layers'; out.mkdir(parents=True, exist_ok=True)
    j, R = cfg['j'], cfg['overlap']
    load = lambda n: np.asarray(Image.open(src / f'{n}.png').convert('RGBA')).copy()
    body, head, near, far = load('body'), load('head'), load('arm_l'), load('arm_r')
    layers = {}

    # Body: torso is everything above the jacket/vest hem; below it, nearest bone.
    a = body[:, :, 3]
    yy = np.mgrid[0:a.shape[0], 0:a.shape[1]][0]
    torso = (yy < cfg['hem']) & (a > 0)
    lower = nearest(np.where(torso, 0, a), {
      'pelvis': [(j['hipB'], j['hipF']), (j['waist'], j['hip'])],
      'leg_back': [(j['hipB'], j['kneeB']), (j['kneeB'], j['ankleB']), (j['ankleB'], j['toeB'])],
      'leg_front': [(j['hipF'], j['kneeF']), (j['kneeF'], j['ankleF']), (j['ankleF'], j['toeF'])],
    })
    # Pelvis tucks up under the torso; thighs into the pelvis; shins into thighs.
    pelvis = lower['pelvis'] | ((yy >= cfg['hem'] - 60) & (yy < cfg['hem']) & (a > 0) & (np.abs(np.mgrid[0:a.shape[0], 0:a.shape[1]][1] - j['hip'][0]) < 260))
    layers['torso'] = cut(body, grow(torso, a, 4))
    layers['pelvis'] = cut(body, grow(pelvis, a, R))
    for side, key in (('B', 'back'), ('F', 'front')):
      la = np.where(lower[f'leg_{key}'], a, 0)
      # shin carries the foot: hip-knee-ankle chain, toe folded into the shin tube via the ankle disk
      up, low = chain(la, [j['hip' + side], j['knee' + side], j['ankle' + side]], R)
      foot = nearest(la, {'f': [(j['ankle' + side], j['toe' + side])], 'o': [(j['hip' + side], j['ankle' + side])]})['f']
      low = low | foot
      up = up & ~(foot & ~low)
      layers[f'leg_{key}_upper'] = cut(body, grow(up, a, R) & ~foot)
      layers[f'leg_{key}_lower'] = cut(body, low)

    for img, side in ((far, 'F'), (near, 'B')):
      key = 'front' if side == 'F' else 'back'
      up, low, fist = chain(img[:, :, 3], [j['shoulder' + side], j['elbow' + side], j['wrist' + side], j['fist' + side]], R)
      layers[f'arm_{key}_upper'] = cut(img, up)
      layers[f'arm_{key}_lower'] = cut(img, low)
      layers[f'fist_{key}'] = cut(img, fist)
    layers['head'] = Image.fromarray(head)

    order = ['arm_front_upper', 'arm_front_lower', 'fist_front', 'leg_back_upper', 'leg_back_lower',
             'pelvis', 'leg_front_upper', 'leg_front_lower', 'torso', 'head',
             'arm_back_upper', 'arm_back_lower', 'fist_back']
    full = Image.new('RGBA', (1024, 1536))
    for n in order:
      layers[n].save(out / f'{n}.png'); full.alpha_composite(layers[n])
    (out / 'layers.json').write_text(json.dumps({'order': [f'{n}.png' for n in order]}, indent=1))
    joints = {k: {'x': v[0], 'y': v[1]} for k, v in j.items() if k in (
      'hip', 'waist', 'neckBase', 'headBase', 'headTop', 'shoulderF', 'elbowF', 'wristF',
      'shoulderB', 'elbowB', 'wristB', 'hipF', 'kneeF', 'ankleF', 'hipB', 'kneeB', 'ankleB')}
    hx, hy = j['headTop']
    joints['hairRoot'] = {'x': hx - 10, 'y': hy + 30}; joints['hairTip'] = {'x': hx - 60, 'y': hy + 90}
    (out / 'joints.json').write_text(json.dumps(joints, indent=1))
    # Registration proof: the stacked pieces must equal the delivered figure.
    ref = np.asarray(Image.open(src / 'full.png').convert('RGBA')).astype(int)
    diff = np.abs(np.asarray(full).astype(int) - ref)
    print(who, 'max RGBA diff vs full.png', int(diff[ref[:, :, 3] > 250].max()),
          'alpha-px mismatch', int(((np.asarray(full)[:, :, 3] > 0) != (ref[:, :, 3] > 0)).sum()))


if __name__ == '__main__':
  main()
