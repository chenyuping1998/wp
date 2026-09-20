#!/usr/bin/env python3
"""Put a whole batch of incoming source art on one page, so it can be LOOKED AT.

check_source_art.py catches art drawn by a script. It cannot catch art that is
simply wrong — a pose that is not the pose asked for, a character who is not the
character. Nothing can; that check is a person's eyes, and the only reason it did
not happen on the 2026-08-27 batch is that opening 42 files one at a time is a
job nobody does.

So this makes it one file. Each image is keyed onto a neutral card, labelled with
its path, and grouped by folder — poses beside the base art they are supposed to
be a variant OF, which is the comparison that matters.

    python design/review_sheet.py                    # everything under source/
    python design/review_sheet.py parts cast         # only these subtrees

Writes design/_review/<subtree>.png.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'design/source'
OUT = ROOT / 'design/_review'

CELL = 260
PAD = 14
LABEL = 26
COLS = 6
# Neutral, and neither of the chroma keys: art is judged against the board it
# will sit on, not against the green it arrives on.
CARD = (44, 34, 62)
SHEET = (26, 20, 38)
INK = (236, 230, 244)


def keyed(path: Path) -> Image.Image:
    """The image with its chroma key knocked out, fitted to a cell."""
    image = Image.open(path).convert('RGBA')
    px = image.load()
    width, height = image.size
    corner = Image.open(path).convert('RGB').getpixel((2, 2))
    for y in range(height):
        for x in range(width):
            r, g, b, a = px[x, y]
            if abs(r - corner[0]) < 70 and abs(g - corner[1]) < 70 and abs(b - corner[2]) < 70:
                px[x, y] = (r, g, b, 0)
    image.thumbnail((CELL, CELL), Image.LANCZOS)
    return image


def font(size: int):
    for name in ('/System/Library/Fonts/Supplemental/Arial.ttf', '/Library/Fonts/Arial.ttf'):
        if Path(name).exists():
            return ImageFont.truetype(name, size)
    return ImageFont.load_default()


def sheet(paths: list[Path], title: str) -> Image.Image:
    rows = (len(paths) + COLS - 1) // COLS
    width = COLS * (CELL + PAD) + PAD
    height = rows * (CELL + LABEL + PAD) + PAD + 44
    canvas = Image.new('RGB', (width, height), SHEET)
    draw = ImageDraw.Draw(canvas)
    draw.text((PAD, 14), f'{title} — {len(paths)} images', fill=INK, font=font(20))

    for i, path in enumerate(paths):
        col, row = i % COLS, i // COLS
        x = PAD + col * (CELL + PAD)
        y = 44 + PAD + row * (CELL + LABEL + PAD)
        draw.rectangle([x, y, x + CELL, y + CELL], fill=CARD)
        art = keyed(path)
        canvas.paste(art, (x + (CELL - art.width) // 2, y + (CELL - art.height) // 2), art)
        rel = str(path.relative_to(SOURCE))
        draw.text((x + 2, y + CELL + 5), rel, fill=INK, font=font(13))
    return canvas


def main() -> int:
    wanted = [a for a in sys.argv[1:] if not a.startswith('-')]
    subtrees = [SOURCE / w for w in wanted] if wanted else sorted(
        p for p in SOURCE.iterdir() if p.is_dir()
    )
    OUT.mkdir(parents=True, exist_ok=True)
    for subtree in subtrees:
        if not subtree.exists():
            print(f'{subtree.relative_to(ROOT)}: nothing there')
            continue
        paths = sorted(subtree.rglob('*.png'))
        if not paths:
            continue
        target = OUT / f'{subtree.name}.png'
        sheet(paths, subtree.name).save(target)
        print(f'{target.relative_to(ROOT)}  ({len(paths)} images)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
