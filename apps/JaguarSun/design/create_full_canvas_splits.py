"""Create clean centered standalone images for both Guy and Girl on 512x1024 transparent canvases."""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_GUY = ROOT / 'design/source/cast/guy_standalone.png'
SRC_GIRL = ROOT / 'design/source/cast/girl_standalone.png'
OUT_DIR = ROOT / 'design/source/cast'


def create_centered_canvas():
    im_guy = Image.open(SRC_GUY)
    im_girl = Image.open(SRC_GIRL)

    # 512x1024 canvas for Guy
    c_guy = Image.new('RGBA', (512, 1024), (0, 0, 0, 0))
    gx = (512 - im_guy.size[0]) // 2
    gy = 1024 - im_guy.size[1] - 50
    c_guy.paste(im_guy, (gx, gy), im_guy)
    path_guy = OUT_DIR / 'guy_full_standalone.png'
    c_guy.save(path_guy)

    # 512x1024 canvas for Girl
    c_girl = Image.new('RGBA', (512, 1024), (0, 0, 0, 0))
    lx = (512 - im_girl.size[0]) // 2
    ly = 1024 - im_girl.size[1] - 50
    c_girl.paste(im_girl, (lx, ly), im_girl)
    path_girl = OUT_DIR / 'girl_full_standalone.png'
    c_girl.save(path_girl)

    print(f'Created centered guy image: {path_guy}')
    print(f'Created centered girl image: {path_girl}')


if __name__ == '__main__':
    create_centered_canvas()
