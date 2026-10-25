"""Install newly AI-model generated Spine component PNGs into design/source/spine/images/."""

from pathlib import Path
from PIL import Image

BRAIN_DIR = Path('/Users/stone/.gemini/antigravity-ide/brain/d3abb547-1925-4fa8-a638-f3a48d261351')
GUY_IMG_DIR = Path(__file__).resolve().parent.parent / 'design/source/spine/images'

GUY_IMG_DIR.mkdir(parents=True, exist_ok=True)

ai_components = {
    'legs.png': (BRAIN_DIR / 'guy_spine_legs_model_1788014283861.png', (512, 512)),
    'torso.png': (BRAIN_DIR / 'guy_spine_torso_model_1788014306602.png', (512, 512)),
    'arm_upper_r.png': (BRAIN_DIR / 'guy_arm_upper_r_model_1788014328486.png', (256, 256)),
}

for name, (src, sz) in ai_components.items():
    if src.exists():
        im = Image.open(src).convert('RGBA')
        im_resized = im.resize(sz, Image.BICUBIC)
        out_path = GUY_IMG_DIR / name
        im_resized.save(out_path)
        print(f'Installed AI-generated {name}: {im_resized.size} -> {out_path}')
    else:
        print(f'Missing src file: {src}')
