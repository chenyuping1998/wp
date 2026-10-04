from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).parent / "source" / "neon_delivery"
REQUIRED = {
    "symbols": "h1 h2 h3 h4 w s b l1 l2 l3 l4 l5 p bomb_prop".split(),
    "backgrounds": "bg_base bg_feature bg_holdandspin".split(),
    "frame": "frame_edge frame_bg fs_sign fs_counter_panel".split(),
    "banners": "big superwin mega epic max".split(),
    "ui": "buybonus_stone buybonus_stone_lit ticker_plate buy_art_bonus buy_art_holdandspin".split(),
    "mascot": ["mascot_full"],
    "thumbnail": "thumb_bg thumb_fg".split(),
}

expected = {
    f"{group}/{name}.{'jpg' if name.startswith('buy_art') else 'png'}"
    for group, names in REQUIRED.items()
    for name in names
}
actual = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob("*") if p.is_file() and p.parent.name != "audio"}
assert actual == expected, ("missing", expected - actual, "extra", actual - expected)

for name in ["h1", "h2", "h3", "h4"]:
    image = np.asarray(Image.open(ROOT / "symbols" / f"{name}.png").convert("L"))
    middle = image[205:819, 205:819]
    assert middle.mean() >= 70, (name, middle.mean())

for name in ["p", "bomb_prop"]:
    image = Image.open(ROOT / "symbols" / f"{name}.png")
    assert image.size == (1024, 1024) and image.getpixel((0, 0))[3] == 0

for name in REQUIRED["backgrounds"]:
    image = Image.open(ROOT / "backgrounds" / f"{name}.png")
    assert image.size == (1920, 1080)
    luminance = np.asarray(image.convert("L"))
    board_zone = luminance[162:918, 432:1488]
    assert board_zone.mean() < luminance.mean(), (name, board_zone.mean(), luminance.mean())

frame = Image.open(ROOT / "frame" / "frame_edge.png")
assert frame.size == (1280, 1280) and frame.getpixel((640, 640))[3] == 0

mascot = Image.open(ROOT / "mascot" / "mascot_full.png")
assert mascot.width >= 1024 and mascot.height >= 1700

thumb = np.asarray(Image.open(ROOT / "thumbnail" / "thumb_bg.png").convert("L").resize((200, 200)))
assert thumb.mean() >= 80
assert np.percentile(thumb, 10) >= 35
assert (thumb < 32).mean() <= 0.3

print(f"PASS: {len(expected)} files, high symbols bright, backgrounds quiet at center, required transparency and sizes, thumbnail brightness")
