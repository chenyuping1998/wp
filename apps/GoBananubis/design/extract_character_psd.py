"""Split the supplied character PSD into one trimmed PNG per body part.

    py -3 design/extract_character_psd.py "<path to the psd>" [out-name]

Writes design/source/<out-name>/*.png plus layers.json, which records each
piece's position on the original canvas. The matching generate_*_spine.mjs reads
that file to place the attachments, so the rig inherits the artist's own layout
instead of anything being eyeballed here.

Both characters this game has shipped come from the same character generator and
so use the same layer naming ("<part> - <n> - <role>" with a non-ASCII dash) and
the same 560-wide canvas, which is why one script serves both. What differs is
WHICH roles are present - the gorilla has a coat and a belt, the jackal has ears
and a nemes - so nothing here may assume a fixed set of layer names.

Needs psd-tools:  py -3 -m pip install psd-tools

Two things about this PSD that the obvious version of this script gets wrong:

  · Every layer carries a residual alpha of 1-11 across the whole canvas -
    invisible when composited, but enough that a naive bounding box is the full
    560x912 for half the layers, and enough to leave a grey haze in the atlas.
    ALPHA_FLOOR discards it.

  · PIL's getbbox() on an RGBA image counts colour under fully transparent
    pixels, so it reports the full canvas even for cleanly keyed layers. The
    bounds have to come from the alpha channel alone.

Some layers in these files contain nothing but that haze - no pixel above alpha
11 anywhere - or are empty outright. They are dropped, and the script proves
nothing was lost by rebuilding the character from the pieces it kept and writing
_compare.png next to the PSD's own flatten.
"""

import json
import os
import re
import sys

from PIL import Image
from psd_tools import PSDImage

ALPHA_FLOOR = 12

APP_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main(psd_path: str, out_name: str) -> None:
    OUT = os.path.join(APP_ROOT, 'design', 'source', out_name)
    os.makedirs(OUT, exist_ok=True)
    for name in os.listdir(OUT):
        if name.endswith('.png'):
            os.remove(os.path.join(OUT, name))

    psd = PSDImage.open(psd_path)
    rebuilt = Image.new('RGBA', (psd.width, psd.height), (0, 0, 0, 0))
    layers = []

    for z, layer in enumerate(psd):
        image = layer.topil()
        if image is None:
            print(f'  dropped (empty layer): {layer.name}')
            continue
        image = image.convert('RGBA')
        alpha = image.getchannel('A').point(lambda v: 0 if v < ALPHA_FLOOR else v)
        image.putalpha(alpha)

        box = alpha.getbbox()
        # layer names are "<part> - <index> - <role>" with a non-ASCII dash
        slug = '_'.join(x.strip() for x in re.split(r'[^\x20-\x7e]+', layer.name) if x.strip())
        slug = slug.replace(' ', '')
        if box is None:
            print(f'  dropped (nothing above alpha {ALPHA_FLOOR}): {slug}')
            continue

        ox, oy = layer.offset
        x, y = ox + box[0], oy + box[1]
        piece = image.crop(box)
        piece.save(os.path.join(OUT, f'{slug}.png'))
        rebuilt.alpha_composite(piece, (x, y))
        layers.append(
            {'z': z, 'name': slug, 'file': f'{slug}.png',
             'x': x, 'y': y, 'w': box[2] - box[0], 'h': box[3] - box[1]}
        )
        print(f'{slug:28s} pos=({x:3d},{y:3d}) size={box[2]-box[0]:3d}x{box[3]-box[1]:3d}')

    with open(os.path.join(OUT, 'layers.json'), 'w') as f:
        json.dump({'canvas': [psd.width, psd.height], 'layers': layers}, f, indent=1)

    # Proof that dropping those layers lost nothing: the PSD's own flatten on the
    # left, the same character rebuilt from the kept pieces on the right.
    ground = (18, 22, 10, 255)
    ref = psd.composite().convert('RGBA')
    sheet = Image.new('RGBA', (psd.width * 2 + 20, psd.height), (30, 30, 30, 255))
    sheet.alpha_composite(Image.alpha_composite(Image.new('RGBA', ref.size, ground), ref), (0, 0))
    sheet.alpha_composite(
        Image.alpha_composite(Image.new('RGBA', ref.size, ground), rebuilt), (psd.width + 20, 0)
    )
    sheet.convert('RGB').save(os.path.join(OUT, '_compare.png'))
    print(f'\n{len(layers)} pieces -> {OUT}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'monkey')
