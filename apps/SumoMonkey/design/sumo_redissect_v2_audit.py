"""Validate re-split source layers before installation; never redraw the art.

Usage: python sumo_redissect_v2_audit.py DELIVERY OUTPUT [mg|fg ...]
DELIVERY contains MG/ and FG/, each with 14 full-canvas PNGs and full.png.
Generates assembly/individual-layer proof and machine-readable checks.
"""
from pathlib import Path
import sys, json
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label, binary_opening

delivery, output = map(Path, sys.argv[1:3])
output.mkdir(parents=True, exist_ok=True)
order = ['arm_back_upper', 'leg_back_upper', 'leg_back_lower',
         'leg_front_upper', 'leg_front_lower', 'pelvis', 'neck', 'torso',
         'arm_back_lower', 'fist_back', 'head', 'arm_front_upper',
         'arm_front_lower', 'fist_front']
report = {}
casts = sys.argv[3:] or ['mg', 'fg']
for cast in casts:
    assert cast in ['mg', 'fg']
    folder = delivery / cast.upper()
    assert json.loads((folder / 'layers.json').read_text())['order'] == order
    assembled = Image.new('RGBA', (1024, 1536))
    sheet = Image.new('RGB', (4 * 300, 4 * 390), '#efeadc')
    checks = []
    for i, part in enumerate(order):
        image = Image.open(folder / f'{part}.png')
        assert image.mode == 'RGBA' and image.size == (1024, 1536), (cast, part, image.mode, image.size)
        alpha = np.asarray(image)[:, :, 3]
        ids, count = label(alpha > 8)
        sizes = np.bincount(ids.ravel())[1:]
        sizes = sorted((int(n) for n in sizes), reverse=True)
        # A few antialias pixels may be disconnected. A second visible island
        # is a real failed split (the previous rear upper arm was two balls).
        islands = [n for n in sizes if n >= max(32, sizes[0] * .0005)]
        check = {'part': part, 'bbox': image.getbbox(),
                 'visible_components': len(islands), 'component_areas': islands}
        if part.startswith('leg_'):
            rgba = np.asarray(image)
            bright = (rgba[:, :, :3].min(axis=2) > 170) & (alpha > 200)
            # Foot/sole remains ivory. Detect broad ivory patches above the
            # ankle only; narrow manga hatch strokes are not a filled patch.
            bright[1300:] = False
            bright = binary_opening(bright, structure=np.ones((7,7)))
            bright_ids, _ = label(bright)
            patches = np.bincount(bright_ids.ravel())[1:]
            check['large_ivory_patch_pixels_above_y1300'] = int(patches.max()) if patches.size else 0
        checks.append(check)
        assert len(islands) == 1, (cast, part, 'disconnected visible islands', islands)
        assembled.alpha_composite(image)
        thumb = image.crop(image.getbbox())
        thumb.thumbnail((280, 345), Image.Resampling.LANCZOS)
        x, y = (i % 4) * 300, (i // 4) * 390
        ImageDraw.Draw(sheet).text((x + 8, y + 8), part, fill='#282828')
        sheet.paste('#4b956c', (x + 8, y + 30, x + 292, y + 382))
        sheet.paste(thumb, (x + (300 - thumb.width)//2, y + 35 + (340-thumb.height)//2), thumb)
    full = Image.open(folder / 'full.png').convert('RGBA')
    diff = np.abs(np.asarray(full).astype('int16') - np.asarray(assembled).astype('int16'))
    exact = bool((diff == 0).all())
    assert exact, (cast, 'full.png differs from the delivered layer assembly', int(diff.max()))
    sheet.save(output / f'{cast}-individual-layers.png')
    assembled.save(output / f'{cast}-assembly.png')
    report[cast] = {'canvas': [1024, 1536], 'layers': checks, 'full_matches_assembly': exact}
(output / 'layer-audit.json').write_text(json.dumps(report, indent=2))
print(f'PASS: {14*len(casts)} full-canvas RGBA layers; each a single visible component; exact assemblies')
