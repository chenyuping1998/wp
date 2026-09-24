#!/usr/bin/env python3
"""Contact sheet and verification script for Wild Party Neon Y2K assets.

Renders 5x3 board and 144px reel symbols against dark board RGB(18, 6, 30).
"""

from __future__ import annotations

import os
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

DESIGN = Path(__file__).resolve().parent
APP = DESIGN.parent
STATIC = APP / "static"
SPRITES = STATIC / "assets" / "sprites"
OUT_DIR = DESIGN / "_contact"
OUT_DIR.mkdir(parents=True, exist_ok=True)

BOARD_BG = (18, 6, 30)  # #12061E NIGHT token

SYMBOLS = [
    ("H1", "h1.png", "Liquid Chrome Disco Ball"),
    ("H2", "h2.png", "Champagne Tower"),
    ("H3", "h3.png", "Neon Martini Glass"),
    ("H4", "h4.png", "Y2K Flip Phone"),
    ("L1", "l1.png", "Neon Tube A"),
    ("L2", "l2.png", "Neon Tube K"),
    ("L3", "l3.png", "Neon Tube Q"),
    ("L4", "l4.png", "Neon Tube J"),
    ("W", "w.png", "Liquid Chrome WILD"),
    ("S", "s.png", "Vinyl Record SCATTER"),
]


def render_board_5x3():
    cell_w, cell_h = 144, 144
    cols, rows = 5, 3
    margin = 32
    gap = 8

    bw = margin * 2 + cols * cell_w + (cols - 1) * gap
    bh = margin * 2 + rows * cell_h + (rows - 1) * gap

    sheet = Image.new("RGB", (bw, bh), BOARD_BG)
    draw = ImageDraw.Draw(sheet)

    sym_files = [s[1] for s in SYMBOLS]
    idx = 0

    for r in range(rows):
        for c in range(cols):
            x = margin + c * (cell_w + gap)
            y = margin + r * (cell_h + gap)

            # Draw cell backing plate
            draw.rounded_rectangle([x, y, x + cell_w, y + cell_h], radius=10, fill=(30, 11, 54), outline=(49, 20, 90), width=2)

            fname = sym_files[idx % len(sym_files)]
            idx += 1

            sym_path = SPRITES / "wildPartySymbols" / fname
            if sym_path.exists():
                im = Image.open(sym_path).convert("RGBA")
                target = int(cell_w * 0.84)
                im.thumbnail((target, target), Image.LANCZOS)
                ox = x + (cell_w - im.width) // 2
                oy = y + (cell_h - im.height) // 2
                sheet.paste(im, (ox, oy), im)

    out_path = OUT_DIR / "board_5x3.png"
    sheet.save(out_path)
    print(f"[OK] Saved contact board 5x3 -> {out_path}")


def main():
    print("=== Wild Party Asset Verification ===")
    all_exist = True
    for key, fname, desc in SYMBOLS:
        p = SPRITES / "wildPartySymbols" / fname
        if not p.exists():
            print(f"[ERROR] Missing {p}")
            all_exist = False
        else:
            im = Image.open(p)
            print(f"[OK] {key} ({fname}): {im.size}, mode={im.mode}")

    # Check backgrounds
    for bg in ["bg_base.png", "bg_feature.png"]:
        p = SPRITES / "wildPartyBackground" / bg
        if not p.exists():
            print(f"[ERROR] Missing {p}")
            all_exist = False
        else:
            im = Image.open(p)
            print(f"[OK] Background {bg}: {im.size}, mode={im.mode}")

    # Check reels frame
    rf = SPRITES / "reelsFrame" / "reels_frame_v3.png"
    if rf.exists():
        im = Image.open(rf)
        print(f"[OK] Frame reels_frame_v3.png: {im.size}, mode={im.mode}")

    # Check win banners
    for wb in ["big.png", "superwin.png", "mega.png", "epic.png", "max.png"]:
        p = SPRITES / "winBanners" / wb
        if not p.exists():
            print(f"[ERROR] Missing {p}")
            all_exist = False
        else:
            im = Image.open(p)
            print(f"[OK] Win Banner {wb}: {im.size}, mode={im.mode}")

    render_board_5x3()
    print("\n=== Verification Completed ===")


if __name__ == "__main__":
    main()
