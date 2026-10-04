"""Create h2/head_blink.png by closing the eyes on h2/head.png to guarantee 100% perfect alignment."""

from pathlib import Path
from PIL import Image, ImageDraw

H2_DIR = Path(__file__).resolve().parent.parent / 'design/source/parts/h2'


def fix_h2_head_blink():
    head = Image.open(H2_DIR / 'head.png').convert('RGBA')
    blink = head.copy()
    draw = ImageDraw.Draw(blink)

    # Draw curved closed eyes / lashes over the sunglasses/eye region
    # Centroid of head is near (256, 160)
    draw.arc([220, 160, 250, 185], start=200, end=340, fill=(0, 0, 0, 255), width=4)
    draw.arc([262, 160, 292, 185], start=200, end=340, fill=(0, 0, 0, 255), width=4)

    out_path = H2_DIR / 'head_blink.png'
    blink.save(out_path)
    print(f'Fixed h2/head_blink.png -> {out_path}')


if __name__ == '__main__':
    fix_h2_head_blink()
