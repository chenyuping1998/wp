"""Give the high-pay picture symbols (H1-H4) a tile like the royals'.

Stone 10-27: the big symbols looked odd floating without a frame while the
royals sit on paper tiles and the prize medallions on round frames. Each
h{n}_tile.png is the royals' low_label paper tile, a salmon inner rule that
marks it as a premium, and the original art scaled to sit inside the rule.
Originals h{n}.png stay untouched; assets.ts points gbH1-gbH4 at the tiles.
"""
from pathlib import Path
from PIL import Image, ImageDraw

D = Path(__file__).resolve().parents[1] / 'static/assets/sprites/sumoSymbols'
SALMON = (198, 118, 92, 255)
INSET, RULE, PAD = 34, 7, 16  # rule inset from tile edge, rule width, art gap inside rule

tile = Image.open(D / 'low_label.png').convert('RGBA')
x0, y0, x1, y1 = tile.getchannel('A').getbbox()
rule_box = (x0 + INSET, y0 + INSET, x1 - INSET, y1 - INSET)
# 11-03 review (5.3 "Low quality assets"): fitted inside the rule the art
# filled ~60% of the cell and the board read empty. The art now breaks out of
# the salmon rule (premium pop-out) and fills ART_FILL of the paper tile.
ART_FILL = 0.94
inner = round((x1 - x0) * ART_FILL)
for n in range(1, 5):
    out = tile.copy()
    ImageDraw.Draw(out).rounded_rectangle(rule_box, radius=18, outline=SALMON, width=RULE)
    art = Image.open(D / f'h{n}.png').convert('RGBA')
    art = art.crop(art.getchannel('A').getbbox())
    s = inner / max(art.size)
    art = art.resize((round(art.width * s), round(art.height * s)), Image.LANCZOS)
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    out.alpha_composite(art, (cx - art.width // 2, cy - art.height // 2))
    out.save(D / f'h{n}_tile.png')
    print(f'h{n}_tile.png', art.size)
