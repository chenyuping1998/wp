"""Install and process guy_bat image:
1. Save solid green background 512x512 image to design/source/cast/guy_bat_green.png
2. Key chroma green background out and create guy_bat_transparent.png
3. Save to static/assets/sprites/hotMiamiCast/guy_bat.png
"""

from pathlib import Path
from PIL import Image
import numpy as np

BRAIN_DIR = Path('/Users/stone/.gemini/antigravity-ide/brain/d3abb547-1925-4fa8-a638-f3a48d261351')
GEN_FILE = BRAIN_DIR / 'guy_baseball_bat_1787995530546.png'

ROOT = Path(__file__).resolve().parent.parent
OUT_SRC = ROOT / 'design/source/cast'
OUT_STATIC = ROOT / 'static/assets/sprites/hotMiamiCast'

OUT_SRC.mkdir(parents=True, exist_ok=True)
OUT_STATIC.mkdir(parents=True, exist_ok=True)


def install_guy_bat():
    if not GEN_FILE.exists():
        print(f'Error: missing generated file {GEN_FILE}')
        return

    im = Image.open(GEN_FILE).convert('RGBA')
    im_512 = im.resize((512, 512), Image.BICUBIC)

    # 1. Save green background version to design/source/cast/guy_bat_green.png
    green_path = OUT_SRC / 'guy_bat_green.png'
    im_512.save(green_path)
    print(f'Saved green background image -> {green_path}')

    # 2. Key out chroma green (#00FF00)
    arr = np.array(im_512)
    r = arr[:, :, 0].astype(int)
    g = arr[:, :, 1].astype(int)
    b = arr[:, :, 2].astype(int)

    # Green key condition: high green, low red/blue
    is_green = (g > 180) & (g > r + 60) & (g > b + 60)
    arr[:, :, 3] = np.where(is_green, 0, arr[:, :, 3])

    trans_im = Image.fromarray(arr)

    # Save transparent PNG to design/source/cast/guy_bat.png and static/assets/sprites/hotMiamiCast/guy_bat.png
    trans_path_src = OUT_SRC / 'guy_bat.png'
    trans_path_static = OUT_STATIC / 'guy_bat.png'

    trans_im.save(trans_path_src)
    trans_im.save(trans_path_static)

    print(f'Saved transparent PNG -> {trans_path_src}')
    print(f'Saved static asset -> {trans_path_static}')


if __name__ == '__main__':
    install_guy_bat()
