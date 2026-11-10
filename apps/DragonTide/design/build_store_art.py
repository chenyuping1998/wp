"""Dragon Tide store art: 1024x1024 thumbnail and 1920x1080 cover, each as BG + transparent FG.

Cover: the delivered composition (cover-bg: the bright palace sea; cover-fg: the Dragon King and
the Dragon Princess together), scaled to 1920x1080 (top-right sky and bottom-left sea clear:
house rule). The cover may show both cast.
Thumbnail: ONE character only (Stone 2026-11-10, rule: the square thumbnail shows a single
character). The delivered cover-fg.png paints the pair touching, so it is not cut apart (that
would chord-cut robes/ribbons); the thumbnail uses the Stone-approved Dragon King master
(new-games/sea-dragon/art/characters/mg-dragon-king-master-v2-fit.png, same painting as the
in-game cast) on the palace-and-moon side of the sea, right of centre, bottom-left free for the
Silverstars logo, which ships as its own file. No text on either (the delivered store-thumb has the title painted in, so it is not
used: the platform shows the name). Store BG must not be dark (check_thumbnail.py).
Writes upload/DragonTide/{cover,thumbnail}/.

  /Applications/anaconda3/bin/python3 design/build_store_art.py
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = Path('/Users/stone/stake-engine/new-games/sea-dragon/art/gen-order-1109')
OUT = Path('/Users/stone/stake-engine/upload/DragonTide')
KING = Path('/Users/stone/stake-engine/new-games/sea-dragon/art/characters/mg-dragon-king-master-v2-fit.png')


def clean(im: Image.Image) -> Image.Image:
    """same clean-up as the in-game art: haze out, body solid, stray specks gone"""
    arr = np.array(im.convert('RGBA'))
    a = arr[..., 3].astype(np.int32)
    a[a < 10] = 0
    a[a >= 244] = 255
    lab, n = ndimage.label(a > 0, structure=np.ones((3, 3)))
    if n > 1:
        sizes = ndimage.sum(np.ones_like(a), lab, range(1, n + 1))
        a[np.isin(lab, np.where(sizes < 400)[0] + 1)] = 0
    arr[..., 3] = a
    arr[a == 0, :3] = 0
    return Image.fromarray(arr)


def resize(im: Image.Image, size) -> Image.Image:
    return im.convert('RGBa').resize((round(size[0]), round(size[1])), Image.LANCZOS).convert('RGBA')


def main():
    (OUT / 'cover').mkdir(parents=True, exist_ok=True); (OUT / 'thumbnail').mkdir(parents=True, exist_ok=True)
    bg = Image.open(SRC / 'cover-bg.png').convert('RGB')
    fg = clean(Image.open(SRC / 'cover-fg.png'))
    assert bg.size == fg.size, (bg.size, fg.size)
    king = clean(Image.open(KING))
    king = king.crop(king.getchannel('A').getbbox())
    # --- cover 1920x1080: the delivered layers (both cast), registered, scaled up together
    cover_bg = bg.resize((1920, 1080), Image.LANCZOS)
    cover_fg = resize(fg, (1920, 1080))
    cover_bg.save(OUT / 'cover/DragonTide-Cover-BG.png', optimize=True)
    cover_fg.save(OUT / 'cover/DragonTide-Cover-FG.png', optimize=True)
    prev = cover_bg.convert('RGBA'); prev.alpha_composite(cover_fg)
    prev.convert('RGB').save(OUT / 'cover/DragonTide-Cover-PREVIEW-only.png', optimize=True)
    # --- thumbnail 1024x1024: ONE character - palace + moon side of the sea, the king right of centre
    side = bg.height
    thumb_bg = bg.crop((0, 0, side, side)).resize((1024, 1024), Image.LANCZOS)
    thumb_bg.save(OUT / 'thumbnail/DragonTide-Thumbnail-BG.png', optimize=True)
    k = 960 / king.height
    fig = resize(king, (king.width * k, king.height * k))
    thumb_fg = Image.new('RGBA', (1024, 1024))
    thumb_fg.alpha_composite(fig, (1024 - fig.width - 20, 1014 - fig.height))
    thumb_fg.save(OUT / 'thumbnail/DragonTide-Thumbnail-FG.png', optimize=True)
    tp = thumb_bg.convert('RGBA'); tp.alpha_composite(thumb_fg)
    tp.convert('RGB').save(OUT / 'thumbnail/DragonTide-Thumbnail-PREVIEW-only.png', optimize=True)
    print('store art written to', OUT)


if __name__ == '__main__':
    main()
