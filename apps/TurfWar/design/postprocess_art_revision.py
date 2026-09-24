from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
SPRITES = APP / "static/assets/sprites"


def soften_low_symbol(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    data = np.asarray(image).copy()
    data[:, :, :3] = np.minimum(data[:, :, :3], 137)
    data[:, :, 3] = (data[:, :, 3].astype(np.float32) * 0.75).astype(np.uint8)
    Image.fromarray(data).save(path)


def lighten_h3_footprint(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    scaled = image.resize((384, 384), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    canvas.alpha_composite(scaled, (64, 64))
    canvas.save(path)


def soften_frame(path: Path, full: bool = False, additive: bool = False) -> None:
    image = Image.open(path).convert("RGBA")
    data = np.asarray(image).copy()
    alpha = data[:, :, 3].astype(np.float32)
    h, w = alpha.shape
    yy, xx = np.mgrid[:h, :w]
    square = np.maximum(abs(xx - (w - 1) / 2) / (w / 2), abs(yy - (h - 1) / 2) / (h / 2))
    radial = np.sqrt(((xx - (w - 1) / 2) / (w / 2)) ** 2 + ((yy - (h - 1) / 2) / (h / 2)) ** 2)
    if full:
        alpha[square < 0.83] = np.minimum(alpha[square < 0.83], 30)
        alpha[square >= 0.83] = np.minimum(alpha[square >= 0.83], 102 if not additive else 217)
    else:
        alpha[square < 0.72] = np.minimum(alpha[square < 0.72], 20)
        middle = (square >= 0.72) & (square < 0.86)
        alpha[middle] = np.minimum(alpha[middle], 115 if not additive else 85)
        alpha[square >= 0.86] = np.minimum(alpha[square >= 0.86], 217)
        alpha[radial < 0.52] = np.minimum(alpha[radial < 0.52], 20)
    data[:, :, 3] = alpha.astype(np.uint8)
    Image.fromarray(data).save(path)


for name in ("l1.png", "l2.png", "l3.png", "l4.png"):
    soften_low_symbol(SPRITES / "turfSymbols" / name)

lighten_h3_footprint(SPRITES / "turfSymbols/h3.png")

for name in ("frame_1x1.png", "frame_2x2.png", "frame_3x3.png", "frame_sticky.png"):
    soften_frame(SPRITES / "turfFrames" / name)
for name in ("frame_edge_1x1.png", "frame_edge_2x2.png", "frame_edge_3x3.png"):
    soften_frame(SPRITES / "turfFrames" / name, additive=True)
soften_frame(SPRITES / "turfFrames/frame_full.png", full=True)
soften_frame(SPRITES / "turfFrames/frame_full_edge.png", full=True, additive=True)
