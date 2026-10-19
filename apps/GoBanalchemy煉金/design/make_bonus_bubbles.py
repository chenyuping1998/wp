"""The Buy Bonus plate SIMMERS (2026-10-16): bubbles rise inside its teal glass
and pop at the top, like the reagents on the board.

The shared button (components-ui-pixi ButtonBuyBonus) draws one plate sprite
from uiTheme.sprites.buyBonus and has no way to animate it; per-game looks stay
in the app (see the repo memory on shared packages). So this bakes FRAMES of the
plate with the bubbles painted in, and src/game/buyBonusBubbles.ts points the
theme slot at the next frame on a timer — the button re-reads one texture key,
nothing else changes. The hover sprite reads the same slot, so it bubbles too.

The loop is seamless: every bubble rises exactly once (or twice) per loop and
fades in at the bottom and out at the top.

Also shrinks the plate: the source is 1254px for a button drawn at ~120 CSS px.
FRAMES x 320px x RGBA is ~8 MB of texture, about what the one 1254px plate was.

Usage: python design/make_bonus_bubbles.py
"""
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

APP = Path(__file__).resolve().parents[1]
SRC = APP / 'static/assets/sprites/goBananasUi/buybonus_plate.png'
OUT = APP / 'static/assets/sprites/goBanalchemyUi'
FRAMES = 20
SIZE = 320
SS = 3  # supersampled bubbles
# the teal glass inside the copper frame, as a fraction of the plate
INNER = (0.11, 0.11, 0.89, 0.89)
COUNT = 13

plate = Image.open(SRC).convert('RGBA').resize((SIZE, SIZE), Image.LANCZOS)
rng = np.random.default_rng(7)
bubbles = [
    dict(x=rng.uniform(0.18, 0.82), seed=rng.uniform(), laps=1 + (i % 3 == 0),
         r=rng.uniform(0.012, 0.03), wob=rng.uniform(0.004, 0.012), ph=rng.uniform(0, 6.28))
    for i in range(COUNT)
]

x0, y0, x1, y1 = (v * SIZE for v in INNER)
for f in range(FRAMES):
    u = f / FRAMES
    big = SIZE * SS
    over = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    for b in bubbles:
        life = (b['seed'] + u * b['laps']) % 1
        y = y1 - 6 - life * (y1 - y0 - 14)
        x = x0 + (x1 - x0) * b['x'] + math.sin(2 * math.pi * (u * b['laps'] * 2) + b['ph']) * b['wob'] * SIZE
        r = b['r'] * SIZE * (0.75 + 0.5 * life)
        env = min(1, life * 6) * min(1, (1 - life) * 7)
        a = 0.55 * env
        X, Y, R = x * SS, y * SS, r * SS
        d.ellipse([X - R, Y - R, X + R, Y + R], fill=(24, 120, 104, int(70 * a)),
                  outline=(200, 255, 236, int(230 * a)), width=max(1, SS))
        g = R * 0.32
        d.ellipse([X - R * 0.35 - g, Y - R * 0.4 - g, X - R * 0.35 + g, Y - R * 0.4 + g],
                  fill=(240, 255, 250, int(210 * a)))
    frame = plate.copy()
    frame.alpha_composite(over.resize((SIZE, SIZE), Image.LANCZOS))
    frame.save(OUT / f'bonus_plate_{f:02d}.png', optimize=True)
print(f'{FRAMES} frames, {SIZE}px')

# the readout plate behind Balance / Bet / Win: 2170px wide for a strip a few
# hundred CSS px across. Half size, same art.
TICKER = APP / 'static/assets/sprites/goBananasUi/ticker_plate.png'
im = Image.open(TICKER)
if im.width > 1100:
    keep = APP / 'design/source/ticker_plate_full.png'
    if not keep.exists():
        im.save(keep)
    im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(TICKER, optimize=True)
    print('ticker plate halved to', im.width // 2)
