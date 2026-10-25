"""Split tile_foreground.png into two standalone PNG images:
1. Guy (Man) standalone PNG (0 pixels of woman's hand)
2. Girl (Woman) standalone PNG (0 pixels of man's arm/sleeve)

Uses exact 4-band polygon cut line:
- y < 475: split at x = 528 (separates man sleeve from woman dress)
- 475 <= y < 528: split at x = 513 (separates man trousers from woman hand)
- 528 <= y < 835: split at x = 515 (separates man leg from woman hand/dress)
- y >= 835: split at x = 558 (separates man shoe from woman shoe)

Saves to:
- static/assets/sprites/hotMiamiCast/guy.png
- static/assets/sprites/hotMiamiCast/girl.png
- design/source/cast/guy_standalone.png
- design/source/cast/girl_standalone.png
"""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'static/assets/sprites/hotMiamiBrand/tile_foreground.png'
OUT_CAST = ROOT / 'static/assets/sprites/hotMiamiCast'
OUT_SOURCE = ROOT / 'design/source/cast'

OUT_CAST.mkdir(parents=True, exist_ok=True)
OUT_SOURCE.mkdir(parents=True, exist_ok=True)


def edge_at(y: int) -> int:
    """The exact 4-band polygon cut boundary separating man (left) and woman (right)."""
    if y < 475:
        return 528
    elif y < 528:
        return 513
    elif y < 835:
        return 515
    else:
        return 558


def mask_for(side: str, w: int, h: int) -> Image.Image:
    mask = Image.new('L', (w, h), 0)
    px = mask.load()
    for y in range(h):
        edge = edge_at(y)
        for x in range(w):
            inside = x < edge if side == 'left' else x >= edge
            if inside:
                px[x, y] = 255
    return mask


def split_figures():
    tile = Image.open(SRC).convert('RGBA')
    w, h = tile.size

    for side, name in (('left', 'guy'), ('right', 'girl')):
        cut = tile.copy()
        cut.putalpha(Image.composite(tile.getchannel('A'), Image.new('L', (w, h), 0), mask_for(side, w, h)))

        box = cut.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
        figure = cut.crop(box)

        out_cast_path = OUT_CAST / f'{name}.png'
        out_src_path = OUT_SOURCE / f'{name}_standalone.png'

        figure.save(out_cast_path)
        figure.save(out_src_path)

        print(f'Successfully split {name}: {figure.size[0]}x{figure.size[1]}px -> {out_cast_path}')


if __name__ == '__main__':
    split_figures()
