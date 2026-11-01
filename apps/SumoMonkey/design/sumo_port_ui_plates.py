"""Bet-bar and Buy Bonus plates taken from the approved Sushi Monkey build.

Stone 10-25: reskins must keep the approved layout; only the skin may change.
The earlier Sumo plates drew a small salmon disc with a diamond inside the 256px
canvas, so every round button rendered ~25% smaller than Sushi's and the diamond
hid the -, +, menu, autoplay and turbo icons. These are Sushi's own plates
(full-canvas ivory disc, ink ring, heavy-framed bar strip, hanging Buy Bonus
sign) with the salmon moved to Sumo's 0xc47d60; ink and paper are shared.
Usage: python3 design/sumo_port_ui_plates.py
"""
from pathlib import Path
import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
SRC = APP.parent / 'SushiMonkey/static/assets/sprites/sushiUi'
DST = APP / 'static/assets/sprites/sumoUi'
NAMES = ['bar_strip', 'button_plate', 'button_print', 'button_print_on', 'spin_plate',
         'buybonus_plate', 'buybonus_plate_lit']
SUSHI_SALMON = np.array([0xb8, 0x7b, 0x60], np.float32)
SUMO_SALMON = np.array([0xc4, 0x7d, 0x60], np.float32)

for name in NAMES:
    im = np.asarray(Image.open(SRC / f'{name}.png').convert('RGBA')).astype(np.float32)
    rgb = im[:, :, :3]
    # weight 1 on the salmon itself, fading to 0 by 70 levels away
    w = np.clip(1 - np.linalg.norm(rgb - SUSHI_SALMON, axis=2) / 70, 0, 1)[:, :, None]
    im[:, :, :3] = rgb + w * (SUMO_SALMON - SUSHI_SALMON)
    Image.fromarray(im.round().clip(0, 255).astype(np.uint8)).save(DST / f'{name}.png')
    print(name, 'ported')
