"""Create a visual comparison skin from the existing Fangtastic study artwork."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
FANG = ROOT.parent / 'FangtasticNight測試' / 'static' / 'assets'
SPRITES = ROOT / 'static' / 'assets' / 'sprites'

def fit(name: str) -> Image.Image:
    return ImageOps.fit(Image.open(FANG / name).convert('RGB'), (1920, 1080), Image.Resampling.LANCZOS)

def save(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)

base = fit('courtyard.webp')
save(base, SPRITES / 'goBanalchemyBackground/bg_base.png')
save(Image.blend(base, Image.new('RGB', base.size, (117, 12, 54)), 0.47),
     SPRITES / 'goBanalchemyBackground/bg_feature.png')
save(Image.blend(base, Image.new('RGB', base.size, (40, 15, 77)), 0.52),
     SPRITES / 'goBanalchemyBackground/bg_holdandspin.png')

SHEET_X, SHEET_Y = 635, 166
CELL_W, CELL_H = 130.6, 131.8
MAP = {
    'h1': ('bonus.webp', 3, 4),  # ghost
    'h2': ('base.webp', 4, 2),   # pumpkin
    'h3': ('base.webp', 1, 2),   # cat
    'h4': ('base.webp', 2, 1),   # potion
    'l1': ('base.webp', 3, 0),   # A
    'l2': ('base.webp', 4, 1),   # K
    'l3': ('base.webp', 1, 0),   # Q
    'l4': ('base.webp', 0, 2),   # J
    'l5': ('base.webp', 0, 3),   # 10
    's': ('base.webp', 2, 2),    # bonus coffin
    'w': ('bonus.webp', 1, 3),   # wild
    'b': ('bonus.webp', 2, 2),   # bat
    'p': ('base.webp', 1, 3),   # garlic
    'x': ('base.webp', 0, 3),   # empty/10
    'reagent_prop': ('base.webp', 2, 1),
}
sheets = {name: Image.open(FANG / name).convert('RGB') for name in {entry[0] for entry in MAP.values()}}
for name, (sheet_name, col, row) in MAP.items():
    x = round(SHEET_X + col * CELL_W)
    y = round(SHEET_Y + row * CELL_H)
    crop = sheets[sheet_name].crop((x, y, x + 131, y + 132))
    if name == 'h1':
        # The full size capture has a mouse pointer over the ghost. The clean
        # reference frame shows the same symbol without it.
        crop = Image.open(FANG / 'bonus-clean.webp').convert('RGB').crop((888, 608, 1000, 722))
    tile = crop.resize((1254, 1254), Image.Resampling.LANCZOS)
    save(tile, SPRITES / f'goBanalchemySymbols/{name}.png')

def purple_shift(path: Path, lo: int, hi: int) -> None:
    original = ROOT.parent / 'GoBanalchemy煉金' / 'static' / 'assets' / 'sprites' / path.relative_to(SPRITES)
    image = Image.open(original).convert('RGBA')
    hsv = np.asarray(image.convert('RGB').convert('HSV')).copy()
    hue = hsv[:, :, 0]
    sat = hsv[:, :, 1]
    mask = (hue >= lo) & (hue <= hi) & (sat > 25)
    hue[mask] = 197
    sat[mask] = np.maximum(sat[mask], 95)
    rgb = Image.fromarray(hsv, 'HSV').convert('RGB')
    rgb.putalpha(image.getchannel('A'))
    save(rgb, path)

for relative, lo, hi in [
    ('goBananasFrame/frame_bg.png', 40, 160),
    ('goBananasFrame/frame_edge.png', 55, 160),
    ('goBananasUi/ticker_plate.png', 26, 150),
    ('goBananasUi/buybonus_plate.png', 26, 150),
    ('goBananasUi/buybonus_stone.png', 26, 150),
    ('goBananasUi/buybonus_stone_lit.png', 26, 150),
]:
    purple_shift(SPRITES / relative, lo, hi)

fang_folder = ROOT / 'static' / 'assets' / 'fang'
fang_folder.mkdir(parents=True, exist_ok=True)
for name in ('vampire.webp', 'vampire-blink.webp', 'vampire-gesture.webp'):
    (fang_folder / name).write_bytes((FANG / name).read_bytes())

print('Fangtastic skin assets created in', ROOT)
