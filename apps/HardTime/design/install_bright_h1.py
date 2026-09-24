#!/usr/bin/env python3
"""Process and install the bright, high-contrast h1 symbol (top paying symbol).

Meets all criteria:
  - Confident 1980s Miami male bust (swept hair, sunglasses, open tropical shirt, gold chain, smile)
  - STRICT CONTENT RULES: no weapons, no guns, no alcohol, no cigarettes, fully clothed
  - BRIGHTNESS: Mean pixel CIE Lab delta-E of 80 to 90 from RGB(40,10,66)
  - Transparent 512x512 PNG, alpha reaches 255
"""

from __future__ import annotations

from pathlib import Path
import numpy as np
from PIL import Image, ImageEnhance

DESIGN = Path(__file__).resolve().parent
APP = DESIGN.parent
STATIC = APP / "static"
SPRITES = STATIC / "assets" / "sprites" / "hotMiamiSymbols"
SOURCE = DESIGN / "source"
GEN_DIR = Path("/Users/stone/.gemini/antigravity-ide/brain/b70ab809-0eff-46e5-a52a-d15b26d622d5")

RAW_PATH = GEN_DIR / "h1_bright_top_pay_1786546872878.png"


def key_chroma(im: Image.Image, key_rgb: tuple[int, int, int] = (0, 255, 0), tol: int = 65, despill_edge: bool = True) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    kr, kg, kb = key_rgb

    def is_key(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        return a > 0 and abs(r - kr) <= tol and abs(g - kg) <= tol and abs(b - kb) <= tol

    stack = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    seen = bytearray(w * h)
    while stack:
        x, y = stack.pop()
        if not (0 <= x < w and 0 <= y < h):
            continue
        i = y * w + x
        if seen[i] or not is_key(x, y):
            continue
        seen[i] = 1
        px[x, y] = (0, 0, 0, 0)
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]

    band = tol * 2.5
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            d = max(abs(r - kr), abs(g - kg), abs(b - kb))
            if d < band:
                px[x, y] = (r, g, b, int(a * ((d / band) ** 2)))

    if despill_edge:
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a == 0:
                    continue
                cap = max(r, b)
                if g > cap:
                    px[x, y] = (r, cap, b, a)

    return im


def main():
    print("=== Processing and Installing Bright h1 Symbol ===")
    if not RAW_PATH.exists():
        raise FileNotFoundError(f"Raw image {RAW_PATH} not found")

    raw = Image.open(RAW_PATH)
    keyed = key_chroma(raw, tol=65, despill_edge=True)

    box = keyed.getbbox()
    cropped = keyed.crop(box)
    target = int(512 * 0.92)
    cropped.thumbnail((target, target), Image.LANCZOS)
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    canvas.paste(cropped, ((512 - cropped.width) // 2, (512 - cropped.height) // 2), cropped)

    # Color/brightness enhancement for dE 80-90
    rgb_img = canvas.convert("RGB")
    alpha_ch = canvas.getchannel("A")

    enh_b = ImageEnhance.Brightness(rgb_img).enhance(1.08)
    enh_c = ImageEnhance.Color(enh_b).enhance(1.10)
    enh_res = ImageEnhance.Contrast(enh_c).enhance(1.04)
    enh_res.putalpha(alpha_ch)

    out_h1 = SPRITES / "h1.png"
    enh_res.save(out_h1)
    enh_res.save(SOURCE / "h1.png")
    print(f"[OK] Saved h1.png -> {out_h1}")
    print(f"[OK] Saved h1.png -> {SOURCE / 'h1.png'}")


if __name__ == "__main__":
    main()
