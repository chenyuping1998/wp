"""Split the store tile's two-figure cut-out into one PNG per figure.

The intro card already shows these two, as one image drawn twice and clipped in
CSS. Putting them BESIDE THE BOARD needs them as separate pixi textures, so the
same measured split is done once, here, into files.

Why the split line is a polygon and not a straight cut: measured off the alpha
channel, the narrowest column between the two figures is x=527 (51.46%) — but
only above the ankles. In the band y840-930 the alpha resolves into four separate
feet at x 309-374, 431-536, 588-664 and 675-728: his right shoe reaches 536 and
hers does not start until 588. A single vertical line at 51.46% leaves an 8px
chip of his shoe stranded beside her foot. The step drops to 54.5% (x=558) below
82% height, i.e. between the two. Those numbers are IntroFeatures.svelte's, and
this script is where they stop being duplicated by hand.

These are PLACEHOLDERS for the cast slot: one flat layer each, so they can only
sway as a body (game/idleSway.ts rule 2 says that is the safe half anyway). The
rigged versions land in design/source/cast/<name>/ — see
docs/art-prompts-hot-miami-parts.md section 14 — and replace them part for part.

    python design/build_cast_figures.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'static/assets/sprites/hotMiamiBrand/tile_foreground.png'
OUT = ROOT / 'static/assets/sprites/hotMiamiCast'

SPLIT_X = 0.5146
STEP_X = 0.545
STEP_Y = 0.82


def mask_for(side: str, w: int, h: int) -> Image.Image:
    """The same polygon the intro card clips with, as an alpha mask."""
    split, step, step_y = SPLIT_X * w, STEP_X * w, STEP_Y * h
    mask = Image.new('L', (w, h), 0)
    px = mask.load()
    for y in range(h):
        edge = split if y < step_y else step
        for x in range(w):
            inside = x < edge if side == 'left' else x >= edge
            if inside:
                px[x, y] = 255
    return mask


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    tile = Image.open(SRC).convert('RGBA')
    w, h = tile.size
    for side, name in (('left', 'guy'), ('right', 'girl')):
        cut = tile.copy()
        cut.putalpha(Image.composite(tile.getchannel('A'), Image.new('L', (w, h), 0), mask_for(side, w, h)))
        # Trim to the figure's own ink. A full-canvas PNG per figure would put
        # most of a 1024 square of nothing into the atlas, and — worse — the
        # sway pivot is "the floor under this person", which is only meaningful
        # once the box is the person.
        box = cut.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
        figure = cut.crop(box)
        figure.save(OUT / f'{name}.png')
        print(f'{name}.png  {figure.size[0]}x{figure.size[1]}  from {box}')


if __name__ == '__main__':
    main()
