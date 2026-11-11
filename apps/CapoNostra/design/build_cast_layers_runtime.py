"""Pack the delivered cast layers (design/cast_parts/) into what the game loads.

The delivery is full-canvas 1024x2048 RGBA per layer, which is what the rig
tools and check_layered_cast.mjs read. Shipping it that way would put 33
full-canvas textures in GPU memory (about 260 MB). So each layer is cropped to
its alpha bbox plus a small pad, and the crop goes into the runtime manifest;
layeredFigure.ts maps the mesh's canvas-space vertices into the crop for UVs.
The mesh itself is untouched: vertices stay in canvas space, so the motion
gate's numbers still describe what ships.

Variants (the FG tiers) share geometry and alpha with the base figure, which
design/cast_parts/variant-check.json and check_layered_art.py both confirm, so
they reuse the base crop boxes and only their pixels differ.

    python design/build_cast_layers_runtime.py
"""
import json
from pathlib import Path

from PIL import Image

APP = Path(__file__).resolve().parent.parent
SRC = APP / 'design' / 'cast_parts'
OUT = APP / 'static' / 'assets' / 'castLayers'
PAD = 4
# figure id -> (delivery folder, variant subfolders)
FIGURES = {
    'don': ('mg', []),
    'hostess': ('fg', ['capo', 'don']),
}


def crop_box(img):
    box = img.getchannel('A').point(lambda a: 255 if a > 0 else 0).getbbox()
    if box is None:
        raise SystemExit(f'empty layer: {img.filename}')
    x0, y0, x1, y1 = box
    w, h = img.size
    return [max(0, x0 - PAD), max(0, y0 - PAD), min(w, x1 + PAD), min(h, y1 + PAD)]


def main():
    for fid, (folder, variants) in FIGURES.items():
        src = SRC / folder
        manifest = json.loads((src / 'layers.manifest.json').read_text())
        dst = OUT / fid
        dst.mkdir(parents=True, exist_ok=True)
        for layer in manifest['layers']:
            img = Image.open(src / layer['texture']).convert('RGBA')
            x0, y0, x1, y1 = crop_box(img)
            layer['crop'] = [x0, y0, x1 - x0, y1 - y0]
            img.crop((x0, y0, x1, y1)).save(dst / layer['texture'], optimize=True)
            for v in variants:
                vimg = Image.open(src / v / layer['texture']).convert('RGBA')
                if vimg.getchannel('A').tobytes() != img.getchannel('A').tobytes():
                    raise SystemExit(f'{fid}/{v}/{layer["texture"]}: alpha differs from the base layer')
                (dst / v).mkdir(exist_ok=True)
                vimg.crop((x0, y0, x1, y1)).save(dst / v / layer['texture'], optimize=True)
        manifest['variants'] = variants
        (dst / 'layers.json').write_text(json.dumps(manifest, separators=(',', ':')))
        # flat preview for the loading screen: the composited figure, cropped to its ink
        full = Image.open(src / 'full.png').convert('RGBA')
        fx0, fy0, fx1, fy1 = manifest['figure_box']
        full.crop((fx0, fy0, fx1, fy1)).save(dst / 'full.png', optimize=True)
        if fid == 'don':
            # The opening card's cutout (IntroFeatures.svelte) is the same drawing
            # as the board's MG figure, cropped to its alpha box: the card's CSS is
            # height-driven with the feet on the image's bottom edge. This replaces
            # design/build_intro_boss.py, which cut the retired v3 Don.
            ink = full.getchannel('A').getbbox()
            full.crop(ink).save(APP / 'static/assets/sprites/capoCast/intro_don_v4.png', optimize=True)
        size = sum(p.stat().st_size for p in dst.rglob('*.png'))
        print(f'{fid}: {len(manifest["layers"])} layers, variants {variants or "-"}, {size / 1e6:.1f} MB png')


if __name__ == '__main__':
    main()
