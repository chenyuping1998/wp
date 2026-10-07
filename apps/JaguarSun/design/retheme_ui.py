"""Recolour the inherited UI sprite sets into the Hot Miami palette.

The reel frame, bet-bar plates, win banners and UI icons were carried over from
the sibling GoBananas app, whose art is jungle brass/olive. Rather than redraw
them, each is mapped through a luminance ramp built from the Miami palette so
the whole UI reads as one theme. Alpha is preserved untouched.

    python retheme_ui.py
"""

import os

from PIL import Image, ImageEnhance

from neon import PALETTE

HERE = os.path.dirname(os.path.abspath(__file__))
SPRITES = os.path.abspath(os.path.join(HERE, "..", "static", "assets", "sprites"))

# folder -> (shadow, midtone, highlight) ramp
RAMPS = {
    "hotMiamiFrame": ((18, 8, 46), (120, 30, 120), (255, 120, 190)),
    "hotMiamiUi": ((14, 8, 40), (86, 26, 108), (255, 150, 205)),
    "hotMiamiWinBanners": ((30, 6, 50), (196, 40, 120), (255, 220, 140)),
    "hotMiamiUiIcons": ((26, 12, 56), (150, 60, 190), (140, 240, 255)),
}

# FX textures are pure white and tinted at runtime - leave them alone.
SKIP = {"hotMiamiFx", "hotMiamiSymbols", "hotMiamiBackground", "hotMiamiBrand"}


def build_lut(shadow, mid, highlight):
    """256-entry per-channel LUT interpolating shadow -> mid -> highlight."""
    lut = []
    for channel in range(3):
        table = []
        for i in range(256):
            t = i / 255.0
            if t < 0.5:
                k = t / 0.5
                value = shadow[channel] + (mid[channel] - shadow[channel]) * k
            else:
                k = (t - 0.5) / 0.5
                value = mid[channel] + (highlight[channel] - mid[channel]) * k
            table.append(max(0, min(255, int(round(value)))))
        lut.extend(table)
    return lut


def retheme(path, ramp):
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    grey = image.convert("L")
    recoloured = Image.merge("RGB", (grey, grey, grey)).point(build_lut(*ramp))
    recoloured = ImageEnhance.Color(recoloured).enhance(1.15)
    out = recoloured.convert("RGBA")
    out.putalpha(alpha)
    out.save(path)


def main():
    total = 0
    for folder, ramp in RAMPS.items():
        directory = os.path.join(SPRITES, folder)
        if not os.path.isdir(directory):
            print(f"  skip {folder} (not present)")
            continue
        for name in sorted(os.listdir(directory)):
            if not name.lower().endswith(".png"):
                continue
            retheme(os.path.join(directory, name), ramp)
            total += 1
            print(f"  rethemed {folder}/{name}")
    print(f"done: {total} sprites")


if __name__ == "__main__":
    main()
