"""Dragon Tide store art: 1024x1024 thumbnail and 1920x1080 cover, each as BG + transparent FG.

Approved art only: backgrounds v2 and the two cast masters (new-games/sea-dragon/art).
Cover: princess (mirrored, facing right) left of centre, king (as drawn, facing left) right of
centre, so they face each other; top-right and bottom-left are kept clear (house rule).
Thumbnail: the king alone over the palace side of the moonlit sea. No text on the BG; the
Silverstars logo ships as its own file. Store BG must not be dark (check_thumbnail.py).
Writes upload/DragonTide/{cover,thumbnail}/.
"""
from pathlib import Path
from PIL import Image

ART = Path('/Users/stone/stake-engine/new-games/sea-dragon/art')
OUT = Path('/Users/stone/stake-engine/upload/DragonTide')
KING = ART / 'characters/mg-dragon-king-master-v2-fit.png'
PRINCESS = ART / 'characters/fg-dragon-princess-master-v2-fit.png'
SEA = ART / 'backgrounds/mg-moonlit-sea-v2-1920x1080.png'


def figure(path, height, mirror=False):
    im = Image.open(path).convert('RGBA')
    im = im.crop(im.getchannel('A').getbbox())
    if mirror:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    return im.resize((round(im.width * height / im.height), height), Image.LANCZOS)


def place(canvas, fig, cx, feet):
    canvas.alpha_composite(fig, (round(cx - fig.width / 2), feet - fig.height))


def main():
    (OUT / 'cover').mkdir(parents=True, exist_ok=True); (OUT / 'thumbnail').mkdir(parents=True, exist_ok=True)
    sea = Image.open(SEA).convert('RGB')
    # --- cover 1920x1080
    sea.save(OUT / 'cover/DragonTide-Cover-BG.png', optimize=True)
    fg = Image.new('RGBA', (1920, 1080))
    place(fg, figure(PRINCESS, 880, mirror=True), 690, 1050)
    place(fg, figure(KING, 900), 1180, 1052)
    fg.save(OUT / 'cover/DragonTide-Cover-FG.png', optimize=True)
    prev = sea.convert('RGBA'); prev.alpha_composite(fg); prev.convert('RGB').save(OUT / 'cover/DragonTide-Cover-PREVIEW-only.png', optimize=True)
    # --- thumbnail 1024x1024: palace + moon side of the sea
    bg = sea.crop((0, 0, 1080, 1080)).resize((1024, 1024), Image.LANCZOS)
    bg.save(OUT / 'thumbnail/DragonTide-Thumbnail-BG.png', optimize=True)
    tfg = Image.new('RGBA', (1024, 1024))
    place(tfg, figure(KING, 930), 560, 1000)
    tfg.save(OUT / 'thumbnail/DragonTide-Thumbnail-FG.png', optimize=True)
    tp = bg.convert('RGBA'); tp.alpha_composite(tfg); tp.convert('RGB').save(OUT / 'thumbnail/DragonTide-Thumbnail-PREVIEW-only.png', optimize=True)
    print('store art written to', OUT)


if __name__ == '__main__':
    main()
