"""Wipe the ghost discs left on the bar's brass end caps (ui_bar_v2.png).

    /Applications/anaconda3/bin/python3 design/clean_bar_caps.py

The 10-15 rivet inpaint left two faint stacked circle outlines on each cap.
Brass pixels in the cap bodies are replaced by a normalised-convolution blur
of the brass only (ink edge and the notch rivets untouched), plus fine grain.
Source kept at design/_backup_icons_v2_1107/ui_bar_v2_pre_capclean.png.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

APP = Path(__file__).resolve().parents[1]
SRC = APP / "design/_backup_icons_v2_1107/ui_bar_v2_pre_capclean.png"
OUT = APP / "static/assets/pickle/ui_bar_v2.png"

im = np.asarray(Image.open(SRC).convert("RGBA"), float)
rgb, a = im[..., :3], im[..., 3]
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
brass = (r > 150) & (g > 110) & (b < 130) & (a > 250)
H, W = a.shape
zone = np.zeros_like(brass)
zone[:, 18:150] = True
zone[:, W - 150:W - 18] = True
m = brass & zone
# keep a 3px margin off the ink so the edge shading survives
mi = Image.fromarray((m * 255).astype("uint8")).filter(ImageFilter.MinFilter(7))
core = np.asarray(mi) > 0

def nblur(ch, mask, rad):
    from scipy.ndimage import gaussian_filter
    return gaussian_filter(ch * mask, rad) / np.maximum(gaussian_filter(mask, rad), 1e-3)

out = im.copy()
rng = np.random.default_rng(1107)
grain = rng.normal(0, 2.2, (H, W))
for c in range(3):
    sm = nblur(rgb[..., c], m.astype(float), 18)
    out[..., c] = np.where(core, sm + grain, rgb[..., c])
# feather the 3px margin between repainted core and original
fe = np.asarray(Image.fromarray((core * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(2)), float) / 255
# and fade the repaint out toward the notch so no vertical step is left
x = np.arange(W)[None, :].astype(float)
ramp = np.clip(np.minimum((128 - x) / 40, (x - (W - 128)) / 40 * -1 + 0), 0, 1)
ramp = np.where(x < W / 2, np.clip((146 - x) / 14, 0, 1), np.clip((x - (W - 146)) / 14, 0, 1))
fe = np.where(m, fe, 0) * ramp
fe = fe[..., None]
res = im[..., :3] * (1 - fe) + out[..., :3] * fe
im2 = np.dstack([res, a]).clip(0, 255).astype("uint8")
Image.fromarray(im2).save(OUT, optimize=True)
print("cleaned", int(core.sum()), "px")
