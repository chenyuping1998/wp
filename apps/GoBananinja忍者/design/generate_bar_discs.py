"""The bet bar's round controls as washi-paper discs (2026-10-17, user: 「uibar
改得更順眼一點，顏色可以不用太多種，autoplay的按鈕可以參考diner的樣式」).

Diner Monkey's round controls are paper discs with an ink ring and dark ink
icons, and an ON toggle is the same disc in one bright colour. Same
construction here, in the ninja's three colours only:

    lacquer navy  #13222c   the ring and every icon
    washi paper   #efe4ca   the face at rest
    brass         #d9b56b   the rim, and the whole face when a toggle is ON

(crimson is kept for the one thing that should shout: the spin button)

Writes, drawn at 2x and reduced so the edges stay clean:
  static/assets/sprites/goBananasUi/button_washi.png      256  (sprites.button)
  static/assets/sprites/goBananasUi/button_washi_on.png   256  (sprites.buttonActive)
  static/assets/sprites/goBananinjaUiIconsInk/ink_*.png   256  Diner's print icon
      shapes (DinerMonkey/static/assets/sprites/sushiIcons/print_*.png),
      re-inked navy

    E:/stake/math-sdk/env/Scripts/python.exe design/generate_bar_discs.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
UI = APP / 'static/assets/sprites/goBananasUi'
ICONS = APP / 'static/assets/sprites/goBananinjaUiIconsInk'
DINER_ICONS = APP.parent / 'DinerMonkey美式餐館/static/assets/sprites/sushiIcons'

NAVY = np.array([19, 34, 44]) / 255
WASHI = np.array([239, 228, 202]) / 255
BRASS = np.array([217, 181, 107]) / 255
BRASS_DARK = np.array([122, 92, 44]) / 255
BRASS_LIGHT = np.array([247, 226, 168]) / 255

SS = 512
rng = np.random.default_rng(20261017)


def disc(face_rgb, lit):
    ys, xs = np.mgrid[0:SS, 0:SS]
    c = (SS - 1) / 2
    dx, dy = (xs - c) / c, (ys - c) / c
    r = np.hypot(dx, dy)
    img = np.zeros((SS, SS, 4))
    aa = 1.6 / c  # one output pixel of edge softness

    def ring(r0, r1):
        return np.clip((r - r0) / aa + 0.5, 0, 1) * np.clip((r1 - r) / aa + 0.5, 0, 1)

    # brass rim, lit from the top-left
    light = np.clip(0.5 - 0.5 * (dx * 0.6 + dy * 0.8), 0, 1)[..., None]
    rim = BRASS_DARK * (1 - light) + BRASS_LIGHT * light
    # the face: paper tooth + a soft dome
    tooth = rng.normal(0, 1, (SS // 4, SS // 4))
    tooth = np.asarray(Image.fromarray(((tooth * 0.5 + 0.5).clip(0, 1) * 255).astype(np.uint8)).resize((SS, SS), Image.BICUBIC), float) / 255
    dome = (1.06 - 0.16 * np.clip(r, 0, 1) ** 2 - 0.06 * dy)[..., None]
    face = face_rgb * dome + (tooth[..., None] - 0.5) * (0.03 if not lit else 0.02)
    layers = [
        (ring(0.0, 1.0), rim),          # rim, to the edge
        (ring(-1, 0.905), NAVY[None, None, :] * np.ones((SS, SS, 1))),   # ink ring
        (ring(-1, 0.83), face),         # face
    ]
    for a, rgb in layers:
        a = a[..., None]
        img[..., :3] = img[..., :3] * (1 - a) + np.broadcast_to(rgb, img[..., :3].shape) * a
        img[..., 3:] = np.maximum(img[..., 3:], a)
    # a fine highlight on the rim's upper arc
    hi = ring(0.955, 0.975)[..., None] * np.clip(-dy, 0, 1)[..., None] * 0.55
    img[..., :3] = img[..., :3] * (1 - hi) + hi
    out = Image.fromarray((img.clip(0, 1) * 255).astype(np.uint8), 'RGBA')
    return out.resize((256, 256), Image.LANCZOS)


UI.mkdir(parents=True, exist_ok=True)
disc(WASHI, False).save(UI / 'button_washi.png', optimize=True)
disc(BRASS, True).save(UI / 'button_washi_on.png', optimize=True)
print('discs ->', UI)

ICONS.mkdir(parents=True, exist_ok=True)
for src in sorted(DINER_ICONS.glob('print_*.png')):
    im = np.asarray(Image.open(src).convert('RGBA'), float) / 255
    im[..., :3] = NAVY
    name = src.name.replace('print_', 'ink_')
    Image.fromarray((im * 255).astype(np.uint8), 'RGBA').save(ICONS / name, optimize=True)
    print('icon', name)
