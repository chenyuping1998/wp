"""Cut the clouds out of the beach plate so they can drift (2026-11-01, user:
背景主要要讓雲漂動起來).

Reads static/assets/treasure/bg_base.jpg (never modified) and writes:
  bg_clean.jpg   the plate with the clouds in the drift window replaced by sky
  bg_clouds.png  the clouds of the window as one strip, un-mixed from the sky
                 (so they read the same over any part of the same row) and
                 faded at both ends so the strip wraps without a seam
  bg_horizon.png the land in that band (mountains, islands, headland rocks):
                 drawn OVER the drifting clouds, so they pass behind the land
                 exactly as they sit behind it in the painting
and src/game/treasureCloudBand.ts with the measured geometry.

At offset 0, clean + clouds + horizon recomposes the original plate.
Outside the window (the palms, the umbrella, the lighthouse) nothing changes.
"""
import os
import numpy as np
from PIL import Image, ImageFilter

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSET = os.path.join(APP, 'static/assets/treasure')
plate = np.asarray(Image.open(os.path.join(ASSET, 'bg_base.jpg')).convert('RGB')).astype(np.float32)
H, W = plate.shape[:2]

# drift window: from the lighthouse (it is land, so clouds pass behind it) to
# the cloud-free gap at x 1520, before the right palm and umbrella; rows from
# the open sky down to the sea line. Both ends sit in cloud-free columns, so
# every cloud inside comes out whole and nothing is left cut in half.
X0, X1 = 262, 1520
Y0, Y1 = 90, 284
FADE = 90  # px: the strip dissolves at both ends (its right end cuts into a cloud bank), so the wrap has no seam
SCREEN_FADE = 130  # px: clouds dissolve into/out of the window edges

band = plate[Y0:Y1, X0:X1]
R, G, B = band[..., 0], band[..., 1], band[..., 2]
sky_like = (B >= 238) & (G >= 165) & (G >= R)

# sky colour per row: the histogram mode among sky-like pixels (sky dominates
# every row; clouds are lighter and mountains darker than it), then smoothed
sky = np.zeros((Y1 - Y0, 3), np.float32)
prev_r = 0.0
for y in range(Y1 - Y0):
    # the sky only brightens toward the horizon: this keeps the darker distant
    # mountains (also blue) out of the estimate near the sea line
    m = sky_like[y] & (R[y] >= prev_r - 6)
    for c in range(3):
        vals = band[y, m, c] if m.sum() > 50 else band[y, :, c]
        hist, edges = np.histogram(vals, bins=64, range=(0, 256))
        k = hist.argmax()
        sel = vals[(vals >= edges[k] - 6) & (vals <= edges[k + 1] + 6)]
        sky[y, c] = np.median(sel) if len(sel) else np.median(vals)
    prev_r = sky[y, 0]
kernel = np.ones(9) / 9
for c in range(3):
    padded = np.pad(sky[:, c], 4, mode='edge')
    sky[:, c] = np.convolve(padded, kernel, mode='valid')
S = sky[:, None, :]

# cloud coverage: how much lighter than the row's sky, in sky-like pixels
light = (R - S[..., 0]) / np.maximum(1, 255 - S[..., 0])
alpha = np.clip((light - 0.04) / 0.22, 0, 1)
alpha = alpha * alpha * (3 - 2 * alpha)
alpha[~sky_like] = 0

# land in the band: not sky-like, or clearly darker than the row's sky
# (distant mountains) -- only regions connected to the sea line (mountains,
# islands, the headland and its lighthouse). Loose strokes inside the clouds
# are cloud, not land.
dark = (~sky_like) | (R < S[..., 0] - 14)
hh, ww = dark.shape
land = np.zeros_like(dark)
# the lighthouse's thin railing and lamp may not touch its rock in the mask:
# every dark pixel round the tower is land
LIGHTHOUSE = (240, 100, 306, 240)
lx0, ly0, lx1, ly1 = LIGHTHOUSE[0] - X0, LIGHTHOUSE[1] - Y0, LIGHTHOUSE[2] - X0, LIGHTHOUSE[3] - Y0
land[max(0, ly0):ly1, max(0, lx0):lx1] = dark[max(0, ly0):ly1, max(0, lx0):lx1]
stack = [(hh - 1, x) for x in range(ww) if dark[hh - 1, x]] + list(zip(*np.nonzero(land)))
land[:] = False
while stack:
    y, x = stack.pop()
    if y < 0 or x < 0 or y >= hh or x >= ww or land[y, x] or not dark[y, x]:
        continue
    land[y, x] = True
    stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
land_img = Image.fromarray((land * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
land_a = np.asarray(land_img).astype(np.float32) / 255
# cloud outlines and shading strokes (not sky-like, not land) belong to the
# cloud: fully opaque in it
alpha[dark & ~land] = 1
# the tower's light edge pixels look like cloud; they stay on the plate
alpha[max(0, ly0):ly1, max(0, lx0):lx1] = 0
# the flat haze along the sea line is sky, not cloud: in the last rows only
# real puffs (dense coverage) stay in the strip
haze = np.clip((np.arange(Y1 - Y0)[:, None] - (Y1 - Y0 - 18)) / 14, 0, 1)
alpha *= 1 - haze * (1 - np.clip((alpha - 0.45) / 0.3, 0, 1))

# un-mix: C*a + S*(1-a) = P  ->  C = (P - S(1-a)) / a
a3 = alpha[..., None]
cloud_rgb = np.where(a3 > 0.02, (band - S * (1 - a3)) / np.maximum(a3, 0.02), 255)
cloud_rgb = np.clip(cloud_rgb, 0, 255)

# behind the land the cloud continues a little: carry each column's lowest
# cloud colour/alpha down under the land, fading over ~16px, then soften it
# across columns so it reads as a soft cloud base rather than streaks
filled = np.zeros(alpha.shape, bool)
for x in range(X1 - X0):
    last_a, last_c = 0.0, None
    for y in range(Y1 - Y0):
        if land_a[y, x] > 0.5:
            if last_c is not None and last_a > 0.01:
                last_a *= 0.86
                alpha[y, x] = last_a
                cloud_rgb[y, x] = last_c
                filled[y, x] = True
        else:
            last_a, last_c = alpha[y, x], cloud_rgb[y, x].copy()
soft = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
alpha = np.where(filled, soft, alpha)

# ends of the strip fade out so the wrap has no seam
xs = np.arange(X1 - X0, dtype=np.float32)
end = np.clip(np.minimum(xs, X1 - X0 - 1 - xs) / FADE, 0, 1)
end = end * end * (3 - 2 * end)
strip_a = alpha * end[None, :]

# clean plate: the whole window's clouds come off the plate (a half-removed
# cloud left at a window edge shows a static seam once the strip moves). At
# rest the strip puts them back, less its dissolving ends.
clean = plate.copy()
cb = clean[Y0:Y1, X0:X1]
removed = alpha[..., None]
cb[:] = np.where(removed > 0, (band - cloud_rgb * removed) / np.maximum(1 - removed, 0.04), band)
# fully covered pixels cannot be solved; they are sky
cb[:] = np.where(removed > 0.96, S.repeat(X1 - X0, axis=1), cb)
cb[:] = np.clip(cb, 0, 255)
# at the window edges cross-fade back to the painted clouds over 80px, so the
# static clouds outside the window fade in rather than start on a line
edge = np.clip(np.minimum(xs, X1 - X0 - 1 - xs) / 80, 0, 1)
edge = (edge * edge * (3 - 2 * edge))[None, :, None]
cb[:] = band * (1 - edge) + cb * edge
# under the land the plate is unchanged (the land layer redraws it anyway)
cb[:] = cb * (1 - land_a[..., None]) + band * land_a[..., None]

Image.fromarray(clean.round().astype(np.uint8)).save(os.path.join(ASSET, 'bg_clean.jpg'), quality=92)
cloud = np.dstack([cloud_rgb, strip_a * 255]).round().astype(np.uint8)
Image.fromarray(cloud, 'RGBA').save(os.path.join(ASSET, 'bg_clouds.png'), optimize=True)
horizon = np.dstack([band, land_a * 255]).round().astype(np.uint8)
Image.fromarray(horizon, 'RGBA').save(os.path.join(ASSET, 'bg_horizon.png'), optimize=True)

with open(os.path.join(APP, 'src/game/treasureCloudBand.ts'), 'w', encoding='utf8') as f:
    f.write('// Generated by design/build_bg_clouds.py: the cloud drift window in\n')
    f.write('// bg_base.jpg px. Do not edit; rerun the script.\n')
    f.write(f'export const CLOUD_BAND={{x0:{X0},x1:{X1},y0:{Y0},y1:{Y1},fade:{SCREEN_FADE}}} as const;\n')

# check: recomposed at offset 0 equals the original plate
comp = clean[Y0:Y1, X0:X1] * (1 - removed * edge) + cloud_rgb * removed * edge
comp = comp * (1 - land_a[..., None]) + band * land_a[..., None]
err = np.abs(comp - band)
print(f'band {X1-X0}x{Y1-Y0}; cloud px {(strip_a>0.05).sum()}; land px {(land_a>0.5).sum()}; '
      f'recompose mean err {err.mean():.2f}, 99.9% {np.percentile(err, 99.9):.1f}')
