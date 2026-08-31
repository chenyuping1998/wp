"""Install the generated h1 pose images into wp/apps/HotMiami/design/source/parts/h1/."""

from pathlib import Path
from PIL import Image

BRAIN_DIR = Path('/Users/stone/.gemini/antigravity-ide/brain/d3abb547-1925-4fa8-a638-f3a48d261351')
DEST_DIR = Path(__file__).resolve().parent.parent / 'design/source/parts/h1'

DEST_DIR.mkdir(parents=True, exist_ok=True)

files_map = {
    'pose_wind.png': BRAIN_DIR / 'h1_pose_wind_1787971024321.png',
    'pose_peak.png': BRAIN_DIR / 'h1_pose_peak_1787971041063.png',
    'pose_settle.png': BRAIN_DIR / 'h1_pose_settle_1787971084879.png',
}

for name, src in files_map.items():
    if src.exists():
        im = Image.open(src).convert('RGB')
        im_resized = im.resize((512, 512), Image.BICUBIC)
        out_path = DEST_DIR / name
        im_resized.save(out_path)
        print(f'Installed h1 {name}: {im_resized.size} -> {out_path}')
    else:
        print(f'Missing src: {src}')
