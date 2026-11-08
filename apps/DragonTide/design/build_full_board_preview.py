"""Compose the complete 6x6 art preview from retained raster symbol sources.

The result is a concept board, not a game screenshot or a simulated outcome.
"""
from pathlib import Path
from collections import Counter
import argparse
import hashlib
import json
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--out', type=Path, default=ROOT / 'board_preview_v2')
parser.add_argument('--source', type=Path, default=ROOT / 'board_preview_v1/source')
parser.add_argument('--board-fill', default='#B8B1A4')
args = parser.parse_args()
OUT = args.out.resolve()
SOURCE = args.source.resolve()
OUT.mkdir(parents=True, exist_ok=True)
BOARD_FILL = args.board_fill
SPRITES = OUT / 'sprites'
SPRITES.mkdir(exist_ok=True)
INK, PAPER, RED, BLUE, GOLD, BROWN, VIOLET = (
    '#1B1716', '#F2E6CC', '#D2322D', '#24508C', '#E3A82B', '#8C5A3C', '#9B3DF5'
)
ORDER = ['H1', 'H2', 'H3', 'H4', 'H5', 'L1', 'L2', 'L3', 'L4', 'S']
LABELS = dict(zip(ORDER, ['大禮帽', '螺旋棒棒糖', '水晶球', '手搖鈴', '香蕉',
                          '星星票根', '月亮票根', '菱形票根', '愛心票根', '催眠螺旋盤']))
PALETTES = {
    'H1': [INK, PAPER, RED, GOLD], 'H2': [INK, PAPER, RED, BROWN, GOLD],
    'H3': [INK, PAPER, BLUE, GOLD], 'H4': [INK, PAPER, RED, GOLD, BROWN],
    'H5': [INK, PAPER, GOLD, BROWN], 'L1': [INK, PAPER, BLUE, GOLD],
    'L2': [INK, PAPER, RED], 'L3': [INK, PAPER, BLUE, GOLD],
    'L4': [INK, PAPER, BLUE, RED], 'S': [INK, PAPER, VIOLET, GOLD, BROWN],
    'WATCH': [INK, PAPER, VIOLET, GOLD, BROWN], 'MG': [INK, PAPER, RED, BROWN, VIOLET],
    'FG': [INK, PAPER, RED, BROWN, GOLD], 'BG': [INK, PAPER, RED, BLUE, GOLD],
}


def font(size, chinese=False):
    return ImageFont.truetype('/System/Library/Fonts/PingFang.ttc' if chinese
                              else str(ROOT.parent / 'static/fonts/TitanOne.ttf'), size)


def centered(canvas, xy, text, size, fill=INK, chinese=False, stroke=0, stroke_fill=PAPER):
    draw = ImageDraw.Draw(canvas)
    face = font(size, chinese)
    box = draw.textbbox((0, 0), text, font=face, stroke_width=stroke)
    draw.text((xy[0] - (box[0] + box[2]) / 2, xy[1] - (box[1] + box[3]) / 2), text,
              font=face, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)


def normalize(name):
    source = Image.open(SOURCE / f'{name}.png').convert('RGBA')
    rgb = source.convert('RGB')
    alpha = source.getchannel('A')
    if name != 'BG':
        alpha.putdata([0 if g > 145 and g > r * 1.65 and g > b * 1.65 else a
                       for r, g, b, a in source.getdata()])
    palette = Image.new('P', (1, 1))
    colors = [tuple(bytes.fromhex(c[1:])) for c in PALETTES[name]]
    palette.putpalette([v for color in colors for v in color] + list(colors[0]) * (256 - len(colors)))
    result = rgb.quantize(palette=palette, dither=Image.Dither.NONE).convert('RGBA')
    result.putalpha(alpha)
    if name != 'BG':
        bounds = result.getbbox()
        if not bounds:
            raise ValueError(f'Empty keyed image: {name}')
        result = result.crop(bounds)
    result.save(SPRITES / f'{name}.png')
    return result


art = {name: normalize(name) for name in PALETTES}


def place(canvas, name, box, anchor_bottom=False):
    original = art[name]
    im = ImageOps.contain(original, (box[2], box[3]), Image.Resampling.LANCZOS)
    x = box[0] + (box[2] - im.width) // 2
    y = box[1] + (box[3] - im.height if anchor_bottom else (box[3] - im.height) // 2)
    canvas.alpha_composite(im, (x, y))
    return (x, y, im.width, im.height)


canvas = Image.new('RGBA', (1920, 1440), PAPER)
background = ImageOps.fit(art['BG'], (1920, 1080), Image.Resampling.LANCZOS)
canvas.alpha_composite(background)
draw = ImageDraw.Draw(canvas)

# A circus sign and red wooden frame, using the same reserved spot colors.
draw.polygon([(456, 158), (1298, 158), (1318, 180), (1318, 936), (1296, 954),
              (456, 954), (440, 936), (440, 180)], fill=INK)
draw.rectangle((449, 169, 1307, 944), fill=RED)
draw.rectangle((465, 185, 1291, 928), fill=GOLD)
CELL, BX, BY = 124, 506, 185
SIDE = CELL * 6
# The complete set is deliberately distributed over all 36 cells. It is not
# drawn from a book and makes no claim about a payable or reachable outcome.
board = [
    ['H2', 'L1', 'H4', 'L3', 'H5', 'L2'],
    ['L4', 'H3', 'L2', 'H1', 'L1', 'H5'],
    ['H1', 'L3', 'S', 'L4', 'H2', 'L3'],
    ['L2', 'H5', 'L1', 'H3', 'L4', 'H4'],
    ['H4', 'L4', 'H2', 'L2', 'S', 'L1'],
    ['L3', 'H1', 'L4', 'H5', 'L1', 'H3'],
]
assert len(board) == 6 and all(len(row) == 6 for row in board)
assert set(sum(board, [])) == set(ORDER)
draw.rectangle((BX - 8, BY - 8, BX + SIDE + 8, BY + SIDE + 8), fill=INK)
for row, line in enumerate(board):
    for col, name in enumerate(line):
        x, y = BX + col * CELL, BY + row * CELL
        draw.rectangle((x + 2, y + 2, x + CELL - 2, y + CELL - 2), fill=BOARD_FILL)
        place(canvas, name, (x + 9, y + 9, CELL - 18, CELL - 18))

draw = ImageDraw.Draw(canvas)
draw.polygon([(482, 68), (1278, 68), (1300, 86), (1278, 145), (482, 145), (464, 126),
              (464, 86)], fill=PAPER, outline=INK, width=7)
centered(canvas, (883, 108), 'HYPNO MONKEY', 58)
centered(canvas, (881, 159), '6 x 6  /  CIRCUS HYPNOSIS', 17, PAPER, stroke=2, stroke_fill=INK)

# MG alone belongs on the base-game board. Bust art is presented in a portrait
# sign; the FG concept is kept in the reference strip outside the game scene.
draw.rounded_rectangle((1375, 222, 1840, 894), radius=18, fill=RED, outline=INK, width=8)
draw.rectangle((1390, 239, 1825, 827), fill=PAPER)
place(canvas, 'MG', (1402, 250, 411, 577), anchor_bottom=True)
centered(canvas, (1607, 858), 'THE HYPNOTIST', 28, PAPER)

# A ticket-booth entry sign and the stage watch are separate from paying icons.
draw = ImageDraw.Draw(canvas)
draw.polygon([(110, 398), (358, 398), (376, 420), (358, 553), (110, 553), (92, 531),
              (92, 420)], fill=RED, outline=INK, width=7)
centered(canvas, (234, 447), 'FREE SPINS', 28, PAPER)
centered(canvas, (234, 503), '100x', 34, GOLD)
place(canvas, 'WATCH', (126, 646, 220, 270))
watch = art['WATCH']
cream = tuple(bytes.fromhex(PAPER[1:]))
points = [(i % watch.width, i // watch.width) for i, p in enumerate(watch.getdata())
          if p[3] > 0 and p[:3] == cream]
if points:
    wx, wy, ww, wh = place(Image.new('RGBA', canvas.size), 'WATCH', (126, 646, 220, 270))
    fx = sum(x for x, _ in points) / len(points) / watch.width
    fy = sum(y for _, y in points) / len(points) / watch.height
    centered(canvas, (wx + fx * ww, wy + fy * wh), 'x10', 34, VIOLET)
centered(canvas, (234, 945), '倍率懷錶示意', 23, chinese=True)

# Readouts are illustrative UI values, not a real balance or a calculated win.
draw = ImageDraw.Draw(canvas)
draw.rounded_rectangle((468, 970, 1180, 1052), radius=12, fill=PAPER, outline=INK, width=6)
for x, title, value in [(580, 'BALANCE', '1,000.00'), (824, 'BET', '1.00'), (1060, 'WIN', '0.00')]:
    centered(canvas, (x, 992), title, 16)
    centered(canvas, (x, 1024), value, 25)
draw.ellipse((1208, 963, 1306, 1061), fill=RED, outline=INK, width=6)
draw.arc((1230, 985, 1284, 1039), 25, 315, fill=PAPER, width=8)
draw.polygon([(1287, 990), (1287, 1015), (1267, 1004)], fill=PAPER)

# The strip below the scene contains every regular symbol at a larger size.
draw.rectangle((0, 1080, 1920, 1440), fill=PAPER)
draw.line((0, 1080, 1920, 1080), fill=INK, width=8)
draw.text((35, 1100), '完整圖騰  H1–H5 高分圖騰  /  L1–L4 票根  /  S 散付',
          font=font(26, True), fill=INK)
for i, name in enumerate(ORDER):
    x = 35 + i * 168
    centered(canvas, (x + 80, 1162), name, 23)
    place(canvas, name, (x + 6, 1190, 148, 148))
    centered(canvas, (x + 80, 1371), LABELS[name], 21, chinese=True)
draw = ImageDraw.Draw(canvas)
draw.line((1730, 1145, 1730, 1395), fill=RED, width=4)
place(canvas, 'FG', (1750, 1177, 145, 180))
centered(canvas, (1822, 1371), 'FG 助手參考', 19, chinese=True)
draw.text((35, 1405), '盤面美術示意｜背景、角色及圖騰配置參考，非實際遊戲截圖',
          font=font(19, True), fill=INK)
canvas.convert('RGB').save(OUT / 'HypnoMonkey-full-board.jpg', quality=97, subsampling=0)
canvas.save(OUT / 'HypnoMonkey-full-board.png')

# Full-size symbols alone, useful for checking all ten without board clutter.
atlas = Image.new('RGBA', (1600, 790), PAPER)
ad = ImageDraw.Draw(atlas)
centered(atlas, (800, 43), 'HYPNO MONKEY / ALL 10 SYMBOLS', 37)
for i, name in enumerate(ORDER):
    x, y = 30 + (i % 5) * 316, 95 + (i // 5) * 335
    ad.rounded_rectangle((x, y, x + 295, y + 275), radius=10, fill=BOARD_FILL, outline=INK, width=4)
    place(atlas, name, (x + 35, y + 20, 225, 225))
    centered(atlas, (x + 147, y + 297), name + ' ' + LABELS[name], 23, chinese=True)
atlas.convert('RGB').save(OUT / 'HypnoMonkey-all-symbols.jpg', quality=97, subsampling=0)

manifest = {
    'purpose': 'complete 6x6 art concept with background and all ten symbols',
    'runtimeIntegrated': False,
    'boardFill': BOARD_FILL,
    'sourceDirectory': str(SOURCE),
    'board': board,
    'symbolCounts': dict(Counter(sum(board, []))),
    'symbols': LABELS,
    'note': 'Illustrative arrangement and UI values; not a book or game screenshot. FG portrait is a reference outside the base-game scene.',
    'sourceSha256': {n: hashlib.sha256((SOURCE / f'{n}.png').read_bytes()).hexdigest() for n in PALETTES},
    'scriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    'palettes': PALETTES,
}
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(OUT / 'HypnoMonkey-full-board.png')
