"""Cut the MAX big-win plaque (win_max_base.png) into three layers so the two
cooks can move (house rule, 2026-10-16: no still character at a feature beat;
pre-submission self-check 2026-10-20 flagged the MAX plaque and the intro MAX
card).

Both cooks stand BEHIND the sign and grip its edges, so:
  * win_max_sign.png  - everything inside the sign's outer rectangle, minus the
                        cooks' hands; the rim under each hand is filled from the
                        surrounding rim pixels so a hand can slide a few px.
  * win_max_mg.png    - the boss: everything left of centre outside the sign,
                        plus his hands where they lie over the sign.
  * win_max_fg.png    - the chef, the same on the right.
All three keep the 1600x900 canvas, so they register by stacking. The body
parts hidden behind the sign stay hidden as long as the cooks move vertically
(their cut seam runs along the sign's vertical edges) - the runtime motion is
designed around that.

Reads current production art; the first-run backup remains recoverable.
"""
from pathlib import Path
import shutil
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'static/assets/pickle'
SRC = ART / 'win_max_base.png'
BK = ROOT / 'design/source/review_1020'
BK.mkdir(parents=True, exist_ok=True)
orig = BK / 'win_max_base_original.png'
if not orig.exists():
    shutil.copy2(SRC, orig)

a = np.array(Image.open(SRC).convert('RGBA'))
r, g, b, al = [a[..., i].astype(int) for i in range(4)]
H, W = al.shape
opaque = al > 8

# sign's outer rectangle, ink outline included (measured from the yellow rim)
X0, X1, Y0, Y1 = 282, 1328, 162, 818
yy, xx = np.mgrid[0:H, 0:W]
inside = (xx >= X0) & (xx <= X1) & (yy >= Y0) & (yy <= Y1)

green = (g > r + 12) & (g > b + 12) & (g > 60) & opaque
yellow = (r > 190) & (g > 140) & (b < 120)
cream = (r > 225) & (g > 210) & (b > 165)

# hands over the sign = green blobs inside the rectangle, grown to take their
# ink outline but never the sign's yellow rim or cream panel
hand_core = green & inside
hand_core = ndimage.binary_opening(hand_core, iterations=1)
hand = ndimage.binary_dilation(hand_core, iterations=9) & inside & opaque & ~yellow & ~cream
hand = ndimage.binary_closing(hand, iterations=2) & opaque

# the sign's own ink outline and drop line run a few px past the rectangle:
# dark pixels in that band belong to the sign, not to the cook beside it
band = ~inside & (xx >= X0 - 8) & (xx <= X1 + 8) & (yy >= Y0 - 8) & (yy <= Y1 + 10)
lum = (r * 299 + g * 587 + b * 114) // 1000
edge = band & opaque & (lum < 80) & ~ndimage.binary_dilation(green & ~inside, iterations=2)
inside = inside | edge

left = xx < W // 2
mg = opaque & left & (~inside | hand)
fg = opaque & ~left & (~inside | hand)
sign = opaque & inside & ~hand


def layer(mask, rgba):
    out = rgba.copy()
    out[..., 3] = np.where(mask, rgba[..., 3], 0)
    return out


# fill the sign under the hands: repeated 3x3 averaging of known rim pixels
fill = a.astype(float).copy()
known = sign.copy()
hole = hand & inside
for _ in range(60):
    if not hole.any():
        break
    acc = np.zeros((H, W, 4))
    cnt = np.zeros((H, W))
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            k = np.roll(np.roll(known, dy, 0), dx, 1)
            v = np.roll(np.roll(fill, dy, 0), dx, 1)
            acc += v * k[..., None]
            cnt += k
    grow = hole & (cnt > 0)
    fill[grow] = acc[grow] / cnt[grow][:, None]
    known = known | grow
    hole = hole & ~grow
sign_rgba = fill.round().clip(0, 255).astype(np.uint8)
sign_rgba[..., 3] = np.where(sign | (hand & inside), 255, 0)

Image.fromarray(sign_rgba).save(ART / 'win_max_sign.png')
Image.fromarray(layer(mg, a)).save(ART / 'win_max_mg.png')
Image.fromarray(layer(fg, a)).save(ART / 'win_max_fg.png')

# sanity: the three layers stacked reproduce the original wherever it is opaque
stack = Image.new('RGBA', (W, H))
for n in ('win_max_sign', 'win_max_mg', 'win_max_fg'):
    stack.alpha_composite(Image.open(ART / f'{n}.png'))
d = np.abs(np.array(stack).astype(int) - a.astype(int))[opaque].max(axis=1)
print('hand px', int(hand.sum()), 'mg px', int(mg.sum()), 'fg px', int(fg.sum()),
      'restack max diff', int(d.max()), 'pixels >8:', int((d > 8).sum()))
