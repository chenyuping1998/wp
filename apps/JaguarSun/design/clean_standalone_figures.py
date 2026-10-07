"""Split tile_foreground.png into Guy and Girl standalone PNG images:
- Guy: 100% complete Hawaiian shirt and trousers without any notched cuts or missing edges
- Girl: 100% complete woman without any floating black spikes from man's sleeve

Saves to:
- static/assets/sprites/hotMiamiCast/guy.png
- static/assets/sprites/hotMiamiCast/girl.png
- design/source/cast/guy_standalone.png
- design/source/cast/girl_standalone.png
- design/source/cast/guy_full_standalone.png
- design/source/cast/girl_full_standalone.png
"""

from pathlib import Path
from PIL import Image
import numpy as np
import scipy.ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'static/assets/sprites/hotMiamiBrand/tile_foreground.png'
OUT_CAST = ROOT / 'static/assets/sprites/hotMiamiCast'
OUT_SOURCE = ROOT / 'design/source/cast'

OUT_CAST.mkdir(parents=True, exist_ok=True)
OUT_SOURCE.mkdir(parents=True, exist_ok=True)


def clean_main_component(image: Image.Image) -> Image.Image:
    """Isolate the single largest connected component in the alpha channel and zero out all floating chips."""
    arr = np.array(image.convert("RGBA"))
    alpha = arr[:, :, 3] > 10

    structure = np.ones((3, 3), dtype=int)
    labeled, num_features = scipy.ndimage.label(alpha, structure=structure)

    if num_features > 1:
        sizes = scipy.ndimage.sum(alpha, labeled, range(1, num_features + 1))
        main_label = np.argmax(sizes) + 1
        mask = (labeled == main_label)
        arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)

    clean_im = Image.fromarray(arr)
    bbox = clean_im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    return clean_im.crop(bbox)


def split_and_clean():
    tile = Image.open(SRC).convert("RGBA")
    w, h = tile.size

    # 1. GUY: Keep full Hawaiian shirt and trousers (x < 528 for y < 835, x < 558 for y >= 835)
    guy_mask = Image.new("L", (w, h), 0)
    gpx = guy_mask.load()
    for y in range(h):
        edge = 528 if y < 835 else 558
        for x in range(edge):
            gpx[x, y] = 255

    cut_guy = tile.copy()
    cut_guy.putalpha(Image.composite(tile.getchannel("A"), Image.new("L", (w, h), 0), guy_mask))
    cleaned_guy = clean_main_component(cut_guy)

    # 2. GIRL: Keep full woman figure without floating spikes from man's sleeve
    girl_mask = Image.new("L", (w, h), 0)
    rpx = girl_mask.load()
    for y in range(h):
        if y < 475:
            edge = 528
        elif y < 528:
            edge = 513
        elif y < 835:
            edge = 515
        else:
            edge = 558
        for x in range(edge, w):
            rpx[x, y] = 255

    cut_girl = tile.copy()
    cut_girl.putalpha(Image.composite(tile.getchannel("A"), Image.new("L", (w, h), 0), girl_mask))
    cleaned_girl = clean_main_component(cut_girl)

    figures = [("guy", cleaned_guy), ("girl", cleaned_girl)]

    for name, cleaned_fig in figures:
        out_cast_path = OUT_CAST / f"{name}.png"
        out_src_path = OUT_SOURCE / f"{name}_standalone.png"

        cleaned_fig.save(out_cast_path)
        cleaned_fig.save(out_src_path)

        canvas = Image.new("RGBA", (512, 1024), (0, 0, 0, 0))
        cx = (512 - cleaned_fig.size[0]) // 2
        cy = 1024 - cleaned_fig.size[1] - 50
        canvas.paste(cleaned_fig, (cx, cy), cleaned_fig)
        canvas_path = OUT_SOURCE / f"{name}_full_standalone.png"
        canvas.save(canvas_path)

        print(f"Cleaned and saved {name}: {cleaned_fig.size[0]}x{cleaned_fig.size[1]}px -> {out_cast_path}")


if __name__ == "__main__":
    split_and_clean()
