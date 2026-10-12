"""Lock Sushi Monkey style-test art to the brief's spot-ink palette.

Source images remain in style_frame/*_source.png. This script writes separate
review PNGs; it never replaces runtime art before the style-frame approval.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageOps
import numpy as np


ROOT = Path(__file__).resolve().parent / "style_frame"
PALETTE = {
    "paper": (242, 232, 208),
    "green": (31, 92, 74),
    "red": (210, 74, 44),
    "black": (30, 27, 26),
    "brown": (78, 46, 34),
    "yellow": (244, 194, 27),
}
TARGETS = {
    "H1": (512, 512),
    "H2": (512, 512),
    "H3": (512, 512),
    "H4": (512, 512),
    "P": (512, 512),
    "S": (512, 512),
    "W": (512, 512),
    "low_label": (512, 512),
    "bg_base_crop": (960, 540),
    "bg_base": (1920, 1080),
    "bg_feature": (1920, 1080),
    "mg_face": (512, 512),
}


def finish(name: str, size: tuple[int, int]) -> None:
    if name == "low_label":
        # The generated candidates kept inventing a central emblem, which
        # occupies the runtime letter. This simple sewn plate is intentional.
        scale = 2
        im = Image.new("RGBA", (size[0] * scale, size[1] * scale))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle((38, 52, 985, 971), radius=92, fill=PALETTE["green"])
        d.rounded_rectangle((25, 25, 970, 956), radius=92, fill=PALETTE["paper"])
        # Broken stitches: approximately one 70px-preview pixel wide.
        for x in range(83, 915, 59):
            d.rounded_rectangle((x, 68, x + 30, 80), radius=5, fill=PALETTE["green"])
            d.rounded_rectangle((x, 897, x + 30, 909), radius=5, fill=PALETTE["green"])
        for y in range(112, 864, 59):
            d.rounded_rectangle((68, y, 80, y + 30), radius=5, fill=PALETTE["green"])
            d.rounded_rectangle((914, y, 926, y + 30), radius=5, fill=PALETTE["green"])
        im.resize(size, Image.Resampling.LANCZOS).save(ROOT / "low_label.png")
        return
    source = Image.open(ROOT / f"{name}_source.png").convert("RGBA")
    # Crop only transparent margin; keep the model's printed card or object intact.
    if not name.startswith("bg_"):
        box = source.getchannel("A").point(lambda x: 255 if x > 48 else 0).getbbox()
        if box:
            source = source.crop(box)
    # A full background is already larger than the model source; processing it
    # at output size avoids a giant 4K×five-colour distance tensor.
    max_size = size if size[0] > 1024 else (size[0] * 2, size[1] * 2)
    if name.startswith("bg_") and size[0] > 1024:
        source = ImageOps.fit(source, max_size, Image.Resampling.LANCZOS)
    else:
        source.thumbnail(max_size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", max_size, (0, 0, 0, 0))
    x = (max_size[0] - source.width) // 2
    y = (max_size[1] - source.height) // 2
    canvas.alpha_composite(source, (x, y))
    arr = np.asarray(canvas).copy()
    colors = np.array(
        [rgb for key, rgb in PALETTE.items()
         if (name == "P" or key != "yellow") and (not name.startswith("bg_") or key != "black")],
        dtype=np.int32,
    )
    rgb = arr[:, :, :3].astype(np.int32)
    # Flat nearest-ink assignment. Squared RGB distance is intentional: it keeps
    # the output deterministic and prevents unplanned fourth/fifth paint colors.
    distance = ((rgb[:, :, None, :] - colors[None, None, :, :]) ** 2).sum(axis=3)
    choice = distance.argmin(axis=2)
    arr[:, :, :3] = colors[choice]
    if name.startswith("bg_"):
        arr[:, :, 3] = 255
    else:
        arr[:, :, 3] = np.where(arr[:, :, 3] < 24, 0, arr[:, :, 3])
    # Full-screen art stays hard-edged after lock-colour; resizing the palette
    # again would introduce dozens of intermediate bins along every crate edge.
    locked = Image.fromarray(arr, "RGBA")
    result = locked if size == max_size else locked.resize(size, Image.Resampling.LANCZOS)
    result.save(ROOT / f"{name}.png")


if __name__ == "__main__":
    for name, size in TARGETS.items():
        finish(name, size)
