"""Flat cut-paper replacements for the template's soft FX textures."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / 'static/assets/sprites/bananditFx'
OUT.mkdir(parents=True, exist_ok=True)
INK = (255, 255, 255, 255)  # neutral mask: Pixi tint supplies the named spot ink

def canvas(name, draw):
    im = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    draw(ImageDraw.Draw(im))
    im.save(OUT / name)

canvas('fx_glow.png', lambda d: d.ellipse((27, 27, 101, 101), fill=INK))
canvas('fx_star.png', lambda d: d.polygon([(64, 7), (75, 53), (121, 64), (75, 75), (64, 121), (53, 75), (7, 64), (53, 53)], fill=INK))
canvas('fx_streak.png', lambda d: d.polygon([(10, 55), (118, 55), (118, 73), (10, 73)], fill=INK))
canvas('fx_leaf.png', lambda d: d.polygon([(15, 91), (31, 51), (86, 20), (112, 17), (101, 66), (65, 105)], fill=INK))
Image.new('RGBA', (128, 128), (0, 0, 0, 0)).save(OUT / 'fx_vignette.png')
print('wrote five flat cut-paper FX textures')
