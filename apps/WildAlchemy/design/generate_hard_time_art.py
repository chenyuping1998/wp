#!/usr/bin/env python3
"""Build deterministic Hard Time UI/typography/FX around generated source art."""

from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps
import colorsys

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "design/source/hardTime/generated"
OUT = ROOT / "static/assets/sprites"
FONT = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
FONT_WIDE = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

STEEL = (72, 80, 86, 255)
STEEL_HI = (151, 158, 162, 255)
INK = (18, 20, 21, 255)
CONCRETE = (45, 45, 42, 255)
KHAKI = (166, 148, 112, 255)
RUST = (132, 70, 37, 255)
LIGHT = (220, 232, 240, 255)


def mkdir(name):
    p = OUT / name
    p.mkdir(parents=True, exist_ok=True)
    return p


def contain(src, size, pad=0, bg=(0, 0, 0, 0)):
    im = Image.open(src).convert("RGBA")
    box = (size[0] - pad * 2, size[1] - pad * 2)
    im.thumbnail(box, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, bg)
    canvas.alpha_composite(im, ((size[0] - im.width) // 2, (size[1] - im.height) // 2))
    return canvas


def centered_text(canvas, text, font_path, size, y, fill, stroke=0, stroke_fill=INK):
    d = ImageDraw.Draw(canvas)
    font = ImageFont.truetype(font_path, size)
    box = d.textbbox((0, 0), text, font=font, stroke_width=stroke)
    x = (canvas.width - (box[2] - box[0])) // 2
    d.text((x, y), text, font=font, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)


def bevel_panel(size, radius, border=14, inset=28):
    im = Image.new("RGBA", size)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((2, 2, size[0]-3, size[1]-3), radius, fill=INK, outline=STEEL_HI, width=border)
    d.rounded_rectangle((inset, inset, size[0]-inset-1, size[1]-inset-1), max(4, radius-inset//2), fill=(34, 35, 33, 245), outline=RUST, width=max(3, border//3))
    for x, y in ((inset, inset), (size[0]-inset, inset), (inset, size[1]-inset), (size[0]-inset, size[1]-inset)):
        r = max(5, border//2)
        d.ellipse((x-r, y-r, x+r, y+r), fill=STEEL_HI, outline=INK, width=2)
    return im


def main():
    sym = mkdir("hardTimeSymbols")
    bg = mkdir("hardTimeBackground")
    brand = mkdir("hardTimeBrand")
    splash = mkdir("hardTimeSplash")
    ui = mkdir("hardTimeUi")
    fx = mkdir("hardTimeFx")
    frame = mkdir("hardTimeBoardFrame")
    banners = mkdir("hardTimeWinBanners")
    icons = mkdir("hardTimeUiIcons")
    cast_out = mkdir("hardTimeCast")

    # Generated hero/symbol art, normalized to runtime dimensions.
    for name in ("h1", "h2", "h3", "h4", "h5", "w", "sw", "fs"):
        art = contain(SRC / f"{name}.png", (512, 512), 12)
        if name == "h3":
            rgb = ImageEnhance.Brightness(art.convert("RGB")).enhance(1.22).convert("RGBA")
            rgb.putalpha(art.getchannel("A"))
            art = rgb
        art.save(sym / f"{name}.png", optimize=True)
    contain(SRC / "cast_alpha.png", (441, 1100), 0).save(cast_out / "prisoner.png", optimize=True)

    # Preserve the four card suits while retheming them to stamped prison tokens.
    suits = {"l1": "♠", "l2": "♥", "l3": "♦", "l4": "♣"}
    for idx, (name, mark) in enumerate(suits.items()):
        im = Image.new("RGBA", (512, 512))
        color = (154, 154, 148, 255) if idx in (0, 3) else (181, 137, 108, 255)
        centered_text(im, mark, "/System/Library/Fonts/Supplemental/Arial Unicode.ttf", 226, 135, color, 5, INK)
        im.save(sym / f"{name}.png", optimize=True)

    # Four final scene plates.
    for name in ("base", "lockdown", "riot", "breakout"):
        plate = ImageOps.fit(Image.open(SRC / f"bg_{name}.png").convert("RGB"), (1920, 1080), Image.Resampling.LANCZOS)
        plate.save(bg / f"bg_{name}.jpg", quality=91, optimize=True, progressive=True)

    # Searchlight beam: one stretchable source, rendered at 1/2/3/4 cell heights.
    beam = Image.new("RGBA", (256, 1024))
    pix = beam.load()
    for y in range(1024):
        half = 34 + 90 * (y / 1023)
        for x in range(256):
            dist = abs(x - 127.5) / half
            if dist >= 1:
                continue
            edge = (1 - dist) ** 1.8
            core = max(0, 1 - abs(x - 127.5) / max(12, half * .22))
            alpha = int(min(166, 28 + 102 * edge + 36 * core))  # peak 65.1%
            pix[x, y] = (220, 232, 240, alpha)
    beam = beam.filter(ImageFilter.GaussianBlur(2.2))
    beam.save(fx / "searchlight_beam.png", optimize=True)

    # Per-cell multiplier frame.
    cell = Image.new("RGBA", (256, 256))
    d = ImageDraw.Draw(cell)
    d.rounded_rectangle((10, 10, 245, 245), 22, fill=(143, 180, 200, 18), outline=(220, 232, 240, 205), width=8)
    d.rounded_rectangle((22, 22, 233, 233), 15, outline=(143, 180, 200, 125), width=4)
    cell.save(fx / "lit_cell_frame.png", optimize=True)

    # Board housing and free-spin panels.
    board = bevel_panel((1280, 1280), 72, 24, 54)
    board.save(frame / "frame_bg.png", optimize=True)
    edge = Image.new("RGBA", (1280, 1280))
    ed = ImageDraw.Draw(edge)
    ed.rounded_rectangle((12, 12, 1267, 1267), 68, outline=STEEL_HI, width=22)
    ed.rounded_rectangle((44, 44, 1235, 1235), 45, outline=RUST, width=8)
    edge.save(frame / "frame_edge.png", optimize=True)
    sign = bevel_panel((1280, 1002), 62, 24, 62)
    sign.save(frame / "fs_sign.png", optimize=True)
    panel = bevel_panel((1280, 966), 56, 22, 54)
    panel.save(frame / "fs_counter_panel.png", optimize=True)

    # UI plates and responsive buy-card frame.
    bevel_panel((1206, 165), 36, 9, 19).save(ui / "ticker_plate.png", optimize=True)
    bevel_panel((640, 640), 86, 20, 45).save(ui / "buybonus_plate.png", optimize=True)
    bevel_panel((256, 256), 62, 12, 28).save(ui / "button_plate.png", optimize=True)
    bevel_panel((512, 512), 150, 22, 48).save(ui / "spin_plate.png", optimize=True)
    (ui / "buy_card_frame.svg").write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect x="10" y="10" width="880" height="1180" rx="58" fill="#222321" stroke="#979ea2" stroke-width="20"/><rect x="42" y="42" width="816" height="1116" rx="38" fill="none" stroke="#844625" stroke-width="8"/><g fill="#979ea2" stroke="#121415" stroke-width="4"><circle cx="52" cy="52" r="13"/><circle cx="848" cy="52" r="13"/><circle cx="52" cy="1148" r="13"/><circle cx="848" cy="1148" r="13"/></g></svg>''')

    # Existing icon geometry, recolored from Capo gold into brushed steel.
    # SUPERSEDED 2026-09-15: this recoloured Capo's pre-redraw heavy set, whose
    # fused strokes blob at bet-bar size. The shipped icons now come from
    # design/generate_hard_time_ui_icons.py; capoUiIcons no longer exists here,
    # so this loop is a no-op — do not restore that folder to 'fix' it.
    old_icons = OUT / "capoUiIcons"
    for src in old_icons.glob("*.png"):
        im = Image.open(src).convert("RGBA")
        grey = ImageOps.grayscale(im)
        recolored = ImageOps.colorize(grey, black=(19, 21, 22), white=(194, 199, 201)).convert("RGBA")
        recolored.putalpha(im.getchannel("A"))
        recolored.save(icons / src.name, optimize=True)

    # Exact runtime typography, rendered deterministically.
    logo = Image.new("RGBA", (1200, 520))
    centered_text(logo, "HARD", FONT, 235, 6, STEEL_HI, 12, INK)
    centered_text(logo, "TIME", FONT, 235, 206, KHAKI, 12, INK)
    ld = ImageDraw.Draw(logo)
    ld.line((240, 250, 960, 250), fill=RUST, width=10)
    logo.save(brand / "logo.png", optimize=True)

    for name, text in (("lockdown", "LOCKDOWN"), ("riot", "RIOT"), ("breakout", "BREAKOUT")):
        im = Image.new("RGBA", (1024, 360))
        centered_text(im, text, FONT, 228 if len(text) < 6 else 176, 58, STEEL_HI, 13, INK)
        ImageDraw.Draw(im).line((170, 282, 854, 282), fill=RUST, width=10)
        im.save(splash / f"title_{name}.png", optimize=True)

    for name, text, color in (("big", "BIG WIN", STEEL_HI), ("superwin", "SUPER WIN", KHAKI), ("mega", "MEGA WIN", (190, 133, 72, 255)), ("epic", "EPIC WIN", (190, 99, 56, 255)), ("max", "MAX WIN", LIGHT)):
        im = bevel_panel((1000, 560), 76, 18, 48)
        centered_text(im, text, FONT, 170 if len(text) <= 8 else 145, 155, color, 9, INK)
        im.save(banners / f"{name}.png", optimize=True)

    # Store tile and thumbnail layers.
    # The store tile is deliberately a bright overcast prison yard rather than
    # the in-game night scene. Platform thumbnails are judged at ~200 px and the
    # old moonlit background measured only Y=25.2 with 83.6% crushed dark pixels.
    tile_bg = ImageOps.fit(Image.open(SRC / "tile_background_bright.png").convert("RGB"), (1024, 1024), Image.Resampling.LANCZOS)
    tile_bg.save(brand / "tile_background.jpg", quality=91, optimize=True)
    # Store FG is character-only. The platform composites title/provider layers;
    # baking either into FG makes the upload layer fail review.
    fg = ImageOps.fit(
        Image.open(SRC / "tile_foreground_character.png").convert("RGBA"),
        (1024, 1024),
        Image.Resampling.LANCZOS,
    )
    fg.save(brand / "tile_foreground.png", optimize=True)

    print("Hard Time art generated")


if __name__ == "__main__":
    main()
