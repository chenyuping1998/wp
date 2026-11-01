"""Write qa/final-preview.gif and the Spine folder's 預覽.gif from current layers and evaluated matrices."""
from pathlib import Path
from PIL import Image
import json, shutil
R = Path(__file__).resolve().parent
spec = json.loads((R / 'qa/motion-frames.json').read_text()); W, H = spec['width'], spec['height']
images = {p.stem: Image.open(p).convert('RGBA') for p in (R / 'layers').glob('*.png')}
frames = []
for f in spec['frames']:
    o = Image.new('RGBA', (W, H), (236, 228, 210, 255))
    for n, (A, B, C, D, E, F) in f['slots']:
        det = A * D - B * C
        o.alpha_composite(images[n].transform((W, H), Image.Transform.AFFINE, (D / det, -B / det, (B * F - D * E) / det, -C / det, A / det, (C * E - A * F) / det), Image.Resampling.BILINEAR))
    frames.append(o.convert('P', palette=Image.Palette.ADAPTIVE, colors=128))
frames[0].save(R / 'qa/final-preview.gif', save_all=True, append_images=frames[1:], duration=40, loop=0, disposal=1)
shutil.copy2(R / 'qa/final-preview.gif', R / 'cast_mg_spine/預覽.gif')
print(len(frames), 'frames')
