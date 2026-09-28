"""Art for GoBananasBoat's own feature-buy menu (src/components/ui/ModalBuyBonus.svelte).

GoBoomana's menu layout: one card per buy, a SCENE with the CARGO on it. The
page stacks the pieces written here and animates them in CSS, so the tiers
read at a glance — more bundles, more loot popping out of them:

    card        scene                    cargo
    BONUS100    the dock at dusk         1 bundle, the helmet
    BONUS200    the storm                2 bundles, helmet and lantern
    BONUS300    the storm                3 bundles, all four high pays
    HOLDANDSPIN the hold                 a pile of Coins

The three free-spin tiers differ in crate density and Full Shipment chance
(game_config.py: FRB1/2/3 at 28/31/34%, 3.5/4.0/4.5%), so the pile is the one
thing that grows from card to card.

Writes to static/assets/sprites/goBananasUi/:
    buy_scene_{dock,storm,hold}.jpg   800x600 crops of the background plates
    buy_hero_holdandspin.png          640x480, the Coin pile
    buy_bundle.png, buy_loot_{h1..h4,coin}.png   the pieces the page stacks
    buy_crate.png, buy_coin.png       the meter's icons

Usage: python design/generate_buy_art.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

APP = Path(__file__).resolve().parents[1]
SPR = APP / 'static/assets/sprites'
OUT = SPR / 'goBananasUi'
W, H = 640, 480  # the hero canvas: the scene box's 16:12


# ---------------------------------------------------------------------------
# the props

def crate(size):
    im = Image.open(SPR / 'goBananasSymbolsV3/m_subject.png').convert('RGBA')
    im = im.crop(im.getbbox())
    return im.resize((size, round(im.height * size / im.width)), Image.LANCZOS)


def coin(size):
    """the Coin off its panel: the gold disc, cut round"""
    src = Image.open(SPR / 'goBananasSymbolsV3/p.png').convert('RGBA')
    n = src.width
    r = n * 0.345
    c = n / 2
    mask = Image.new('L', src.size, 0)
    ImageDraw.Draw(mask).ellipse([c - r, c - r, c + r, c + r], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.5))
    src.putalpha(mask)
    src = src.crop((int(c - r - 2), int(c - r - 2), int(c + r + 2), int(c + r + 2)))
    return src.resize((size, size), Image.LANCZOS)


def shadowed(canvas, im, xy, blur=10, drop=(6, 10), alpha=0.6):
    """paste with a soft drop shadow, so props sit ON the scene"""
    sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    a = im.split()[3].point(lambda v: int(v * alpha))
    blk = Image.new('RGBA', im.size, (0, 0, 0, 255))
    blk.putalpha(a)
    sh.alpha_composite(blk, (xy[0] + drop[0], xy[1] + drop[1]))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur)))
    canvas.alpha_composite(im, xy)


# ---------------------------------------------------------------------------
# scenes

def scene(plate, box, name):
    im = Image.open(SPR / 'goBananasBackground' / plate).convert('RGB').crop(box).resize((800, 600), Image.LANCZOS)
    im.save(OUT / f'buy_scene_{name}.jpg', quality=86)


scene('bg_base.png', (360, 60, 1560, 960), 'dock')
scene('bg_feature.png', (360, 40, 1560, 940), 'storm')
scene('bg_holdandspin.png', (300, 40, 1500, 940), 'hold')

# ---------------------------------------------------------------------------
# scenes

def scene(plate, box, name):
    im = Image.open(SPR / 'goBananasBackground' / plate).convert('RGB').crop(box).resize((800, 600), Image.LANCZOS)
    im.save(OUT / f'buy_scene_{name}.jpg', quality=86)


scene('bg_base.png', (360, 60, 1560, 960), 'dock')
scene('bg_feature.png', (360, 40, 1560, 940), 'storm')
scene('bg_holdandspin.png', (300, 40, 1500, 940), 'hold')

# the Coin pile for Hold and Spin
cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
for (x, y, sz, r) in [(200, 330, 150, -14), (440, 330, 150, 12), (320, 250, 170, 0), (250, 410, 130, 8), (390, 415, 130, -8)]:
    c = coin(sz).rotate(r, resample=Image.BICUBIC, expand=True)
    shadowed(cv, c, (int(x - c.width / 2), int(y - c.height / 2)), blur=8, drop=(4, 8))
cv.save(OUT / 'buy_hero_holdandspin.png', optimize=True)

# ---------------------------------------------------------------------------
# THE CARGO, NOT THE CAPTAIN (2026-09-27).
#
# The captain on the cards did nothing for the choice (his rig is small; four
# near-identical little men). The cards are now told by the cargo itself: the
# page (ModalBuyBonus.svelte) stacks tarp BUNDLES — the Mystery crate off the
# board — and the high pays pop out of them, jack-in-the-box, in turn. More
# tier, more bundles, more loot:
#
#   BONUS100    1 bundle    the helmet
#   BONUS200    2 bundles   the helmet, the lantern
#   BONUS300    3 bundles   helmet, mine, lantern, flags on top of the pile
#   HOLDANDSPIN the pile of Coins (buy_hero_holdandspin.png), Coins hopping
#
# Here: the bundle and each loot, trimmed and small, for the page to stack.

def trimmed(path, height):
    im = Image.open(path).convert('RGBA')
    im = im.crop(im.getbbox())
    return im.resize((round(im.width * height / im.height), height), Image.LANCZOS)


trimmed(SPR / 'goBananasSymbolsV3/m_subject.png', 220).save(OUT / 'buy_bundle.png', optimize=True)
for k in ('h1', 'h2', 'h3', 'h4'):
    trimmed(SPR / f'goBananasSymbolsV3/{k}_subject.png', 200).save(OUT / f'buy_loot_{k}.png', optimize=True)
coin(120).save(OUT / 'buy_loot_coin.png', optimize=True)

# the meter icons: one crate (a tier's load) and one Coin (a respin)
crate(96).save(OUT / 'buy_crate.png', optimize=True)
coin(96).save(OUT / 'buy_coin.png', optimize=True)
print('buy art written to', OUT)
