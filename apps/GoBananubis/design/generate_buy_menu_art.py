"""Art for the feature-buy menu (src/components/ui/ModalBuyBonus.svelte).

Go Boomana's layout, this game's tomb: every card is a SCENE with its HEROES
standing in it. Both are cut from art the game already ships, never drawn
beside it — a card made of the game's own pieces cannot drift out of its style,
and follows the art the next time it is regenerated.

  scenes   16:12 crops of the three background plates, one per kind of buy:
             buy_scene_hall.jpg      the dusk colonnade (bg_base)      100x
             buy_scene_sanctum.jpg   the burning inner door (bg_feature) 200x / 500x
             buy_scene_crypt.jpg     the cold treasure crypt (bg_superspin) Super Spin
           Each crop is the plate's own point of interest (the light shaft, the
           burning door, the treasure pile), which the board covers in the game.
  heroes   the symbols, trimmed to their pixels:
             buy_tablet.png  the Sealed Tablet (m.png — it is a slab, so it keeps its plate)
             buy_scarab.png  H1's cut-out (h1_subject)
             buy_eye.png     H2's cut-out
             buy_chest.png   H3's cut-out
             buy_anubis.png  the Wild's head (w_glow: the art masked to the subject)
             buy_coin.png    the Super Spin coin (p_glow)
             buy_scatter.png the Scatter tile, whole — the meter's pip. The
                             bunch alone does not cut clean: its gold is too
                             close to the parchment's (s_glow loses the bow).

Usage: python design/generate_buy_menu_art.py
"""
from pathlib import Path

from PIL import Image

APP = Path(__file__).resolve().parents[1]
SYM = APP / 'static/assets/sprites/goBananasSymbolsV3'
BG = APP / 'static/assets/sprites/goBananasBackground'
OUT = APP / 'static/assets/sprites/goBananasUi'
OUT.mkdir(parents=True, exist_ok=True)

SCENE_W, SCENE_H = 640, 480  # 16:12, the card's scene box

# (source plate, centre of interest as a fraction of the plate, crop width fraction)
SCENES = {
    'buy_scene_hall.jpg': ('bg_base.png', (0.34, 0.44), 0.40),
    'buy_scene_sanctum.jpg': ('bg_feature.png', (0.45, 0.45), 0.40),
    'buy_scene_crypt.jpg': ('bg_superspin.png', (0.32, 0.50), 0.42),
}

for name, (src, (cx, cy), wf) in SCENES.items():
    im = Image.open(BG / src).convert('RGB')
    w = round(im.width * wf)
    h = round(w * SCENE_H / SCENE_W)
    x0 = min(max(0, round(im.width * cx - w / 2)), im.width - w)
    y0 = min(max(0, round(im.height * cy - h / 2)), im.height - h)
    im.crop((x0, y0, x0 + w, y0 + h)).resize((SCENE_W, SCENE_H), Image.LANCZOS).save(
        OUT / name, quality=86, optimize=True, progressive=True
    )
    print(f'{name}: {src} crop {w}x{h} at ({x0},{y0})')

HEROES = {
    'buy_tablet.png': 'm.png',
    'buy_scarab.png': 'h1_subject.png',
    'buy_eye.png': 'h2_subject.png',
    'buy_chest.png': 'h3_subject.png',
    'buy_anubis.png': 'w_glow.png',
    'buy_coin.png': 'p_glow.png',
    'buy_scatter.png': 's.png',
}
for name, src in HEROES.items():
    im = Image.open(SYM / src).convert('RGBA')
    # trim to what is drawn, keeping a 2px margin so a drop shadow is not clipped
    box = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if box:
        l, t, r, b = box
        im = im.crop((max(0, l - 2), max(0, t - 2), min(im.width, r + 2), min(im.height, b + 2)))
    im.save(OUT / name, optimize=True)
    print(f'{name}: {src} -> {im.size[0]}x{im.size[1]}')
