"""Map the approved neon repaint onto Boom's original PSD body-part masks.

The original part bounds and layer order stay unchanged. This lets the
existing shoulder, elbow, hip, knee and jaw animation tracks remain valid.
"""
from pathlib import Path
import json
from PIL import Image, ImageFilter, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'design/source/monkey'
OUT = ROOT / 'design/source/monkey_neon'
OUT.mkdir(parents=True, exist_ok=True)
metadata = json.loads((SOURCE / 'layers.json').read_text(encoding='utf-8'))
canvas = tuple(metadata['canvas'])
paint = Image.open(SOURCE / 'neon_repaint_full.png').convert('RGBA').resize(canvas, Image.Resampling.LANCZOS)
paint.save(OUT / '_repaint_canvas.png')

# The shoes of the repaint extend beyond the work boots' trimmed PSD regions.
# Widen only the image regions; the Spine generator still reads the original
# metadata for joint positions, so ankles do not move.
VISUAL_BOUNDS = {
    'left_leg_2_foot': (75, 735, 170, 167),
    'right_leg_2_foot': (315, 735, 245, 167),
}
for part in metadata['layers']:
    if part['name'] in VISUAL_BOUNDS:
        part['x'], part['y'], part['w'], part['h'] = VISUAL_BOUNDS[part['name']]
(OUT / 'layers.json').write_text(json.dumps(metadata, indent=2), encoding='utf-8')

# These PSD layers were miner equipment, tiny tools or a banana hung from the
# jaw. Their bones and slots remain for compatibility, but the neon costume
# does not need that separate art. A transparent attachment preserves timing.
EMPTY = {
    'torso_2_decoration', 'torso_3_decoration', 'torso_4_decoration',
    'torso_5_decoration', 'left_arm_1_forearm', 'head_5_decoration',
}

preview = Image.new('RGBA', canvas, (0, 0, 0, 0))
for part in metadata['layers']:
    x, y, w, h = (part[k] for k in ('x', 'y', 'w', 'h'))
    name = part['name']
    old = Image.open(SOURCE / part['file']).convert('RGBA')
    if name not in VISUAL_BOUNDS and old.size != (w, h):
        raise ValueError(f'{name}: source bounds do not match PSD metadata')
    crop = paint.crop((x, y, x+w, y+h))
    if name in EMPTY:
        crop.putalpha(Image.new('L', (w, h), 0))
    elif name in {'left_arm_2_hand', 'right_arm_2_hand'}:
        # The approved repaint is a flattened pose. Behind its visible cuffs it
        # contains trouser pixels, which become exposed when the PSD wrists bend.
        # The original PSD's fur and fists have the same anatomy and keep the
        # existing elbow/wrist seams intact at every animation angle.
        crop = old.copy()
    elif name in VISUAL_BOUNDS:
        pass  # these bounds contain only the matching shoe and its ankle
    else:
        # Keep the original anatomical cut while allowing the new jacket and
        # headphones a few pixels of breathing room around old fabric edges.
        mask = old.getchannel('A').point(lambda v: 255 if v >= 12 else 0)
        mask = mask.filter(ImageFilter.MaxFilter(19)).filter(ImageFilter.GaussianBlur(1.4))
        crop.putalpha(ImageChops.multiply(crop.getchannel('A'), mask))
    crop.save(OUT / part['file'])
    preview.alpha_composite(crop, (x, y))

preview.save(OUT / '_assembled.png')
print(f'Neon costume split into {len(metadata["layers"])} original PSD attachments: {OUT}')
