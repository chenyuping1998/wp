"""Loading-page title with NO signboard (2026-10-18, user: 讀取頁標題不要底板).

The loading page used sushiV8/logo_board_titled.png — the title baked onto the
painted sign. This bakes the title alone in the game's print style: cream
letters, a heavy ink keyline, and the red misregistered plate every card in
the game has, offset down-right. FeatureIntro keeps the sign.

    python design/bake_loading_title.py
"""
import os

from PIL import Image, ImageDraw, ImageFont

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TITLE = 'STRIKE MONKEY'
font = ImageFont.truetype(os.path.join(APP, 'static/fonts/sushi/BowlbyOne-Regular.ttf'), 150)
INK, CREAM, RED = '#14262e', '#fff4de', '#e8502e'
STROKE, OFF, PAD = 14, 12, 24
l, t, r, b = ImageDraw.Draw(Image.new('L', (1, 1))).textbbox((0, 0), TITLE, font=font, stroke_width=STROKE)
W, H = r - l + OFF + PAD * 2, b - t + OFF + PAD * 2
im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
x, y = PAD - l, PAD - t
d.text((x + OFF, y + OFF), TITLE, font=font, fill=RED, stroke_width=STROKE, stroke_fill=RED)
d.text((x, y), TITLE, font=font, fill=CREAM, stroke_width=STROKE, stroke_fill=INK)
out = os.path.join(APP, 'static/assets/sprites/sushiV8/logo_title.png')
im.save(out)
print(out, im.size, 'aspect', round(W / H, 4))
