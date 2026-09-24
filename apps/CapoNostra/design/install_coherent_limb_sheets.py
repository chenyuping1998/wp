"""Install coherent limb segments from independently drawn exploded sheets.

Each source cell already contains one isolated animation part. This script
only crops the fixed sheet cells, chroma-keys green, scales proportionally,
and centres the part in its established Spine canvas.
"""

from pathlib import Path
import numpy as np
from PIL import Image, ImageOps

APP = Path(__file__).resolve().parent.parent
GENERATED = Path("/Users/stone/.codex/generated_images/01a04df9-9c61-7831-bdcd-3d4b5eca55d9")
SOURCE_OUT = APP / "design/source/spine/coherent_limb_sources"

SHEETS = {
    "girl": GENERATED / "exec-b39d7513-8a3a-4147-946b-f478dc7b8504.png",
    "guy": GENERATED / "exec-72428843-5270-46a5-bd2a-dcf9e12f4211.png",
}

# (row, column, flip horizontally, flip vertically). Female left upper reuses the coherent
# right-upper drawing mirrored, instead of the malformed top-left whole arm.
CELLS = {
    "girl": {
        "arm_upper_l": (1, 0, True, False),
        "arm_lower_l": (0, 1, True, False),
        "hand_l": (0, 2, False, False),
        "arm_upper_r": (1, 0, False, False),
        "arm_lower_r": (1, 1, False, False),
        "hand_r": (1, 2, False, False),
    },
    "guy": {
        "arm_upper_l": (0, 0, True, False),
        "arm_lower_l": (0, 1, False, False),
        "arm_upper_r": (1, 0, False, False),
        "arm_lower_r": (1, 1, False, True),
    },
}


def key_green(image: Image.Image) -> Image.Image:
    arr = np.asarray(image.convert("RGBA")).copy()
    rgb = arr[:, :, :3].astype(np.int32)
    distance = np.sqrt(rgb[:, :, 0] ** 2 + (rgb[:, :, 1] - 255) ** 2 + rgb[:, :, 2] ** 2)
    arr[:, :, 3] = np.clip((distance - 72) * 4.0, 0, 255).astype(np.uint8)
    cap = np.maximum(arr[:, :, 0], arr[:, :, 2])
    fringe = (arr[:, :, 3] > 0) & (arr[:, :, 1] > cap)
    arr[:, :, 1] = np.where(fringe, cap, arr[:, :, 1])
    # Keep only the largest connected foreground island. Image generation can
    # leave a tiny stray fragment in an otherwise valid exploded-sheet cell;
    # it must never become part of the rig texture.
    mask = arr[:, :, 3] > 20
    seen = np.zeros(mask.shape, dtype=bool)
    largest: list[tuple[int, int]] = []
    height, width = mask.shape
    for start_y, start_x in zip(*np.where(mask & ~seen)):
        if seen[start_y, start_x]:
            continue
        stack = [(int(start_y), int(start_x))]
        seen[start_y, start_x] = True
        component: list[tuple[int, int]] = []
        while stack:
            y, x = stack.pop()
            component.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
        if len(component) > len(largest):
            largest = component
    keep = np.zeros(mask.shape, dtype=bool)
    for y, x in largest:
        keep[y, x] = True
    arr[:, :, 3] = np.where(keep, arr[:, :, 3], 0)
    ys, xs = np.where(arr[:, :, 3] > 20)
    if not len(xs):
        raise RuntimeError("empty keyed cell")
    return Image.fromarray(arr).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def install(character: str) -> None:
    sheet = Image.open(SHEETS[character]).convert("RGBA")
    out_dir = APP / ("design/source/spine/images_girl" if character == "girl" else "design/source/spine/images")
    source_dir = SOURCE_OUT / character
    source_dir.mkdir(parents=True, exist_ok=True)
    for name, (row, col, flip_x, flip_y) in CELLS[character].items():
        x0, x1 = round(col * sheet.width / 3), round((col + 1) * sheet.width / 3)
        y0, y1 = round(row * sheet.height / 2), round((row + 1) * sheet.height / 2)
        subject = key_green(sheet.crop((x0, y0, x1, y1)))
        if flip_x:
            subject = ImageOps.mirror(subject)
        if flip_y:
            subject = ImageOps.flip(subject)
        subject.save(source_dir / f"{name}.png")
        if "hand" in name:
            limit = 70
        else:
            limit = 145 if character == "girl" else 155
        scale = min(limit / subject.width, limit / subject.height)
        size = (round(subject.width * scale), round(subject.height * scale))
        subject = subject.resize(size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (256 if "hand" not in name else 128,) * 2, (0, 0, 0, 0))
        x = (canvas.width - subject.width) // 2
        y = (canvas.height - subject.height) // 2
        if subject.width > canvas.width or subject.height > canvas.height:
            raise RuntimeError(f"{character}/{name} does not fit {canvas.size}: {subject.size}")
        canvas.alpha_composite(subject, (x, y))
        canvas.save(out_dir / f"{name}.png")
        print(f"{character}/{name}: {subject.size} at {(x, y)}")


if __name__ == "__main__":
    install("girl")
    install("guy")
