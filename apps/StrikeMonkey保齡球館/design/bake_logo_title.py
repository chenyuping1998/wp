"""Bake the title onto the intro signboard (2026-10-16).

FeatureIntro and LoadingScreen used to lay a pixi Text over sushiV8/logo_board.png.
The title now acts through the board's mesh (src/game/meshWin/signs.ts), so it
has to be IN the texture: this draws it the way the Text did (same font, size
logoWidth*0.095 of a 1600px board, centred, ink fill, a thin paper keyline)
into sushiV8/logo_board_titled.png, and prints each letter's box for the rig.

    python design/bake_logo_title.py
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TITLE, FONT, FILL = sys.argv[1], sys.argv[2], sys.argv[3]
board = Image.open(os.path.join(APP, 'static/assets/sprites/sushiV8/logo_board.png')).convert('RGBA')
W, H = board.size
# the Text's size, unless that runs past the board's inner panel: Bowlby One at
# 0.095 spilled over the end rivets. Fit it inside MAX_W instead.
MAX_W = 1100
size = round(W * 0.095)
while True:
    font = ImageFont.truetype(os.path.join(APP, 'static/fonts/sushi', FONT), size)
    l, t, r, b = ImageDraw.Draw(Image.new('L', (1, 1))).textbbox((0, 0), TITLE, font=font, stroke_width=4)
    if r - l <= MAX_W:
        break
    size -= 2
print('font px', size)
layer = Image.new('RGBA', board.size, (0, 0, 0, 0))
d = ImageDraw.Draw(layer)
d.text((W / 2, H / 2), TITLE, font=font, anchor='mm', fill=FILL, stroke_width=4, stroke_fill='#fff4de')
board.alpha_composite(layer)
board.save(os.path.join(APP, 'static/assets/sprites/sushiV8/logo_board_titled.png'))
a = np.array(layer)[..., 3] > 40
lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=1))
boxes = sorted((s[1].start, s[0].start, s[1].stop, s[0].stop) for s in ndimage.find_objects(lab))
print(TITLE, len(boxes), boxes)
# each letter's box, from the font's own advances (the stroke joins them, so
# the alpha cannot separate them)
l, t, r, b = d.textbbox((W / 2, H / 2), TITLE, font=font, anchor='mm')
x0 = l
letters = []
for i, ch in enumerate(TITLE):
    a0 = x0 + font.getlength(TITLE[:i])
    a1 = x0 + font.getlength(TITLE[: i + 1])
    if ch.strip():
        letters.append([ch, round(a0), round(a1)])
print('letters y', t, b, letters)
