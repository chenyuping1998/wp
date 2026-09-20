#!/usr/bin/env python3
"""Build and process all Wild Party Neon Y2K Disco assets per REDESIGN_NEON_Y2K.md.

Assets:
  1. Symbols (10 items):
     - h1.png: Liquid chrome mirrorball disco ball
     - h2.png: Champagne tower with pouring chrome bottle
     - h3.png: Neon martini glass with chrome pick
     - h4.png: Y2K flip phone with pixel heart screen
     - l1.png: Neon tube A in Magenta #FF2D95 + white core
     - l2.png: Neon tube K in Cyan #22E4FF + white core
     - l3.png: Neon tube Q in Lime #B6FF3D + white core
     - l4.png: Neon tube J in Violet #A96BFF + white core
     - w.png: 3D liquid chrome WILD block letters + magenta starburst
     - s.png: Vinyl record SCATTER + lime starburst
  2. Backgrounds (2 items):
     - bg_base.png (2304x1536): Base game Y2K nightclub, dark center 55%
     - bg_feature.png (2304x1536): Free spins Y2K nightclub, lime dominant
  3. Reels Frame (1 item):
     - reels_frame_v3.png (2048x1536): Brushed chrome frame with transparent center 64%
  4. Win Banners (5 items):
     - big.png, superwin.png, mega.png, epic.png, max.png (1536x512)
"""

from __future__ import annotations

import math
import os
import shutil
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

DESIGN = Path(__file__).resolve().parent
APP = DESIGN.parent
STATIC = APP / "static"
SPRITES = STATIC / "assets" / "sprites"
SOURCE = DESIGN / "source"
GEN_DIR = Path("/Users/stone/.gemini/antigravity-ide/brain/b70ab809-0eff-46e5-a52a-d15b26d622d5")

SOURCE.mkdir(parents=True, exist_ok=True)

# Board geometry, mirrored from src/game/constants.ts and measured off the running
# game (stateGameDerived.boardLayout() reports x=711 => a 1422-wide layout box).
# The frame rebuild below needs these to report the housing footprint it produces.
SYMBOL_SIZE = 144
BOARD_REELS = 5
BOARD_ROWS = 3
LAYOUT_WIDTH = 1422

AI_RAW = {
    "h1": GEN_DIR / "wp_h1_disco_ball_1786783441120.png",
    "h2": GEN_DIR / "wp_h2_champagne_tower_1786783559931.png",
    "h3": GEN_DIR / "wp_h3_neon_martini_1786783589065.png",
    "h4": GEN_DIR / "wp_h4_flip_phone_1786783605107.png",
    "w": GEN_DIR / "wp_w_wild_1786783620611.png",
    "s": GEN_DIR / "wp_s_scatter_1786783640000.png",
    "bg_base": GEN_DIR / "wp_bg_base_1786783657309.png",
    "bg_feature": GEN_DIR / "wp_bg_feature_1786783673285.png",
    "reels_frame": GEN_DIR / "wp_reels_frame_1786783924777.png",
}

# WildParty ships its own Orbitron under static/fonts (see src/game/fonts.ts).
# The old first choice, static/assets/fonts/, does not exist here, so this always
# silently fell through to HotMiami's copy — same file, but a cross-app path that
# breaks the moment that app moves.
FONT_ORBITRON = STATIC / "fonts" / "Orbitron.ttf"
if not FONT_ORBITRON.exists():
    FONT_ORBITRON = APP.parent / "HotMiami" / "static" / "fonts" / "Orbitron.ttf"

FONT_TITAN = APP.parent / "HotMiami" / "static" / "fonts" / "TitanOne.ttf"


def get_font(size: int, orbitron: bool = True) -> ImageFont.FreeTypeFont:
    path = FONT_ORBITRON if orbitron and FONT_ORBITRON.exists() else FONT_TITAN
    if not path.exists():
        return ImageFont.load_default()
    font = ImageFont.truetype(str(path), max(8, int(size)))
    try:
        font.set_variation_by_axes([900])
    except Exception:
        pass
    return font


def key_chroma(im: Image.Image, key_rgb: tuple[int, int, int] = (0, 255, 0), tol: int = 65, despill_edge: bool = True) -> Image.Image:
    """Key out green background with soft alpha edge and green despill."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    kr, kg, kb = key_rgb

    def is_key(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        return a > 0 and abs(r - kr) <= tol and abs(g - kg) <= tol and abs(b - kb) <= tol

    # Flood fill from image perimeter
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

    # Soft alpha ramp for fine edges
    band = tol * 2.2
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            d = max(abs(r - kr), abs(g - kg), abs(b - kb))
            if d < band:
                new_a = int(a * ((d / band) ** 2))
                px[x, y] = (r, g, b, new_a)

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


def key_chroma_center_hole(im: Image.Image, key_rgb: tuple[int, int, int] = (0, 255, 0), tol: int = 65) -> Image.Image:
    """Key out both the outer border AND the center hole of a frame."""
    im = key_chroma(im, key_rgb=key_rgb, tol=tol, despill_edge=True)
    w, h = im.size
    px = im.load()
    kr, kg, kb = key_rgb

    def is_key(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        return a > 0 and abs(r - kr) <= tol and abs(g - kg) <= tol and abs(b - kb) <= tol

    # Flood fill from center of image
    cx, cy = w // 2, h // 2
    stack = [(cx, cy)]
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

    # Soft alpha ramp in center
    band = tol * 2.2
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            d = max(abs(r - kr), abs(g - kg), abs(b - kb))
            if d < band:
                px[x, y] = (r, g, b, int(a * ((d / band) ** 2)))

    return im


def square_and_fit(im: Image.Image, size: int = 1024, margin: float = 0.09) -> Image.Image:
    box = im.getbbox()
    if box is None:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cropped = im.crop(box)
    inner = int(size * (1 - 2 * margin))
    cropped.thumbnail((inner, inner), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(cropped, ((size - cropped.width) // 2, (size - cropped.height) // 2), cropped)
    return canvas


# ===========================================================================
# Neon Tube Royals (L1..L4) per §4.5
# ===========================================================================
def tracked_text_width(draw, word, font, tracking: int) -> int:
    """Width of `word` when each glyph is advanced by its own width + tracking."""
    return sum(draw.textlength(ch, font=font) for ch in word) + tracking * (len(word) - 1)


def draw_tracked_text(draw, xy, word, font, tracking: int, **kw) -> None:
    """Draw text glyph by glyph with explicit letter spacing.

    PIL has no tracking control, and the banners were drawn as one string with
    very heavy outward strokes. A stroke fattens every glyph on all sides, so
    neighbouring letters merged and thin stems were swallowed whole: "BIG WIN"
    rendered as "BO WN" — the I disappeared between the W and the N, and the
    counters of B and G filled in solid. Positive tracking buys back the space
    the stroke eats.
    """
    x, y = xy
    for ch in word:
        draw.text((x, y), ch, font=font, **kw)
        x += draw.textlength(ch, font=font) + tracking


def olive_to_lime(im: Image.Image) -> Image.Image:
    """Pull yellow-green pixels onto the palette's LIME.

    The image generator rendered every "electric lime #B6FF3D" instruction as a
    dull olive — measured RGB(187,187,49) on the Scatter starburst, i.e. the
    green channel landed 68 points low. That matters most on the Scatter, which
    is the symbol a player must pick out of a full board instantly, and it also
    hit the lamp lenses on the reel frame.

    Targets pixels that are already yellow-green (G and R both well above B, G
    not far above R) and lifts them toward LIME while preserving each pixel's own
    shading, so the flat art keeps its cel steps instead of going poster-flat.
    """
    a = np.array(im.convert("RGBA")).astype(np.int16)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    is_olive = (al > 40) & (g > b + 45) & (r > b + 35) & (g >= r - 25) & (g < 235)
    # brightness of the source pixel, so shadowed facets stay shadowed
    lum = np.clip(np.maximum(g, r) / 200.0, 0.25, 1.0)
    tr, tg, tb = 182, 255, 61
    out = a.copy()
    for ch, target in ((0, tr), (1, tg), (2, tb)):
        blended = np.clip(target * lum, 0, 255)
        out[..., ch] = np.where(is_olive, blended, a[..., ch])
    return Image.fromarray(out.astype(np.uint8), "RGBA")


def fill_interior_holes(im: Image.Image, rgb: tuple[int, int, int], alpha: int = 255) -> Image.Image:
    """Flood the enclosed transparent regions of a line-art symbol with a colour.

    The martini and the champagne tower came back as pure outlines — the prompt
    asked for a flat magenta liquid field inside the glass and the generator drew
    only the rim. At 144px an unfilled wireframe has almost no ink: h3 measured
    16.3% opaque coverage against 15.7% for the Q, so a symbol that pays 3.9x
    looked exactly as substantial as one that pays 0.7x.

    Interior holes are found as transparent components that do NOT touch the
    image border, which distinguishes the inside of a glass from the background
    around it without needing per-symbol seed points.
    """
    a = np.array(im.convert("RGBA"))
    transparent = a[..., 3] < 40

    # 4-connected flood from the border marks everything that is "outside"
    h, w = transparent.shape
    outside = np.zeros_like(transparent)
    stack = [(0, x) for x in range(w) if transparent[0, x]]
    stack += [(h - 1, x) for x in range(w) if transparent[h - 1, x]]
    stack += [(y, 0) for y in range(h) if transparent[y, 0]]
    stack += [(y, w - 1) for y in range(h) if transparent[y, w - 1]]
    for y, x in stack:
        outside[y, x] = True
    while stack:
        y, x = stack.pop()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and transparent[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True
                stack.append((ny, nx))

    holes = transparent & ~outside
    out = a.copy()
    out[holes] = (*rgb, alpha)
    return Image.fromarray(out, "RGBA")


def rebuild_frame_nine_patch(edge: Image.Image, bezel_scale: float = 0.40) -> Image.Image:
    """Re-proportion the reel housing so its bezel is thin relative to its window.

    The problem this solves is geometric, not artistic. The game scales the whole
    frame texture until its window matches the board, so the drawn bezel is
    however thick the ART says it is, as a fraction of the window. This frame came
    back with a window only 67.5% of its width — a thick cabinet — which at a
    720px board puts the housing at 1109px across a 1422px layout box, running
    underneath the Buy Bonus CTA on one side and the readout plates on the other.

    Cropping cannot fix it: the corner bolts start 6px in and the lamp lenses sit
    at y 54..96, so there is no dead margin to remove — trimming the bezel means
    cutting features off. Scaling the frame down does not fix it either, because
    the window shrinks with it and the game just scales it back up.

    A nine-patch rebuild decouples the two. The four corners scale by
    bezel_scale, the four edge strips scale by bezel_scale across their thickness
    and stretch along their length, and the window becomes whatever size we ask
    for. At 0.40 the window lands at ~84% of the width, which puts the drawn
    housing back at ~890px — the footprint the side-rail layout was built around.

    The window is also rebuilt at the BOARD's aspect ratio (5:3). The source
    window is 1.91:1 against the board's 1.67:1, and the game was papering over
    that by scaling the sprite's width and height by different amounts, which
    stretched the chrome and the neon tube unevenly.
    """
    a = np.array(edge.convert("RGBA"))
    al = a[..., 3]
    h, w = al.shape

    # window = the transparent hole, found from the middle scanlines
    row = np.where(al[h // 2] > 128)[0]
    col = np.where(al[:, w // 2] > 128)[0]
    gx = np.where(np.diff(row) > 1)[0]
    gy = np.where(np.diff(col) > 1)[0]
    if not len(gx) or not len(gy):
        return edge
    x0, x1 = int(row[gx[0]]), int(row[gx[0] + 1])
    y0, y1 = int(col[gy[0]]), int(col[gy[0] + 1])

    L, R, T, B = x0, w - x1, y0, h - y1

    # target window: keep the native width, take the height from the board aspect
    win_w = x1 - x0
    win_h = int(round(win_w * BOARD_ROWS / BOARD_REELS))

    bl, br = int(round(L * bezel_scale)), int(round(R * bezel_scale))
    bt, bb = int(round(T * bezel_scale)), int(round(B * bezel_scale))
    out_w, out_h = win_w + bl + br, win_h + bt + bb
    out = Image.new("RGBA", (out_w, out_h), (0, 0, 0, 0))

    def piece(box, size):
        return edge.crop(box).resize(size, Image.LANCZOS)

    # corners
    out.paste(piece((0, 0, L, T), (bl, bt)), (0, 0))
    out.paste(piece((x1, 0, w, T), (br, bt)), (out_w - br, 0))
    out.paste(piece((0, y1, L, h), (bl, bb)), (0, out_h - bb))
    out.paste(piece((x1, y1, w, h), (br, bb)), (out_w - br, out_h - bb))
    # edges
    out.paste(piece((x0, 0, x1, T), (win_w, bt)), (bl, 0))
    out.paste(piece((x0, y1, x1, h), (win_w, bb)), (bl, out_h - bb))
    out.paste(piece((0, y0, L, y1), (bl, win_h)), (0, bt))
    out.paste(piece((x1, y0, w, y1), (br, win_h)), (out_w - br, bt))

    print(f"     nine-patch @ bezel {bezel_scale}: art {out_w}x{out_h}, "
          f"window {win_w}x{win_h} = {win_w / out_w * 100:.1f}% x {win_h / out_h * 100:.1f}%; "
          f"drawn housing {BOARD_REELS * SYMBOL_SIZE * 1.04 / (win_w / out_w):.0f}px wide "
          f"in a {LAYOUT_WIDTH}px layout box")
    return out


def build_interior_backdrop(width: int = 1296, height: int = 804) -> Image.Image:
    """The panel that sits behind the reels, inside the frame's window.

    Previously this came out of the reelsFrame atlas as `frame_bg.png`. The new
    frame art is a single standalone image with a transparent window, so there is
    no backdrop inside it any more and one has to be drawn.
    """
    im = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # vertical fall-off from VIOLET_DEEP to NIGHT, so the board floor reads as
    # lit from above like the rest of the scene
    for y in range(height):
        t = y / max(1, height - 1)
        r = int(30 * (1 - t) + 18 * t)
        g = int(11 * (1 - t) + 6 * t)
        b = int(54 * (1 - t) + 30 * t)
        d.line([(0, y), (width, y)], fill=(r, g, b, 255))
    # Faint cell lattice.
    #
    # This must divide the BOARD, not this texture. The backdrop is drawn larger
    # than the board on purpose — BoardFrame.svelte sizes it to boardWidth * 1.08
    # by boardWidth * 0.67 so it never peeks out from behind the housing — so
    # slicing the texture itself into 5x3 puts every line in the wrong place. It
    # did: the lines landed up to 17px off the real cell boundaries, which reads
    # as the symbols being off-centre when in fact the grid was.
    #
    # BG_W_RATIO / BG_H_RATIO must stay equal to the multipliers in
    # BoardFrame.svelte's frame_bg <Sprite>.
    BG_W_RATIO, BG_H_RATIO = 1.08, 0.67
    board_frac_w = 1.0 / BG_W_RATIO
    board_frac_h = (BOARD_ROWS / BOARD_REELS) / BG_H_RATIO  # board height / board width
    bw, bh = width * board_frac_w, height * board_frac_h
    x0, y0 = (width - bw) / 2, (height - bh) / 2
    for i in range(1, BOARD_REELS):
        x = int(x0 + bw * i / BOARD_REELS)
        d.line([(x, 0), (x, height)], fill=(70, 40, 110, 60), width=2)
    for i in range(1, BOARD_ROWS):
        y = int(y0 + bh * i / BOARD_ROWS)
        d.line([(0, y), (width, y)], fill=(70, 40, 110, 60), width=2)
    return im


def build_fs_counter_plate(width: int = 824, height: int = 622) -> Image.Image:
    """Free-spin counter plate, matching the reel frame's chrome + magenta neon.

    This used to be `Frame_FSCounter.png` in the reelsFrame atlas. Its rect sat
    at x=2724 in a 3182-wide sheet, so once the frame became a standalone
    2048-wide image the rect fell entirely outside it and the panel sampled
    nothing — the counter would have been invisible for the whole free-spin
    round, which is exactly when it matters.
    """
    ss = 2
    sw, sh = width * ss, height * ss
    im = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pad = int(18 * ss)
    box = [pad, pad, sw - pad, sh - pad]
    rad = int(46 * ss)
    # dark keyline
    d.rounded_rectangle(box, radius=rad, fill=(10, 4, 16, 255))
    # chrome body: horizontal bands with the palette's dark horizon in the middle
    inner = [box[0] + int(10 * ss), box[1] + int(10 * ss), box[2] - int(10 * ss), box[3] - int(10 * ss)]
    body = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    bd = ImageDraw.Draw(body)
    stops = [(0.00, (255, 255, 255)), (0.18, (216, 230, 255)), (0.42, (123, 143, 199)),
             (0.55, (42, 51, 85)), (0.68, (201, 182, 255)), (0.86, (255, 154, 213)), (1.00, (255, 255, 255))]
    y0, y1 = inner[1], inner[3]
    for y in range(y0, y1):
        t = (y - y0) / max(1, y1 - y0)
        for i in range(len(stops) - 1):
            if stops[i][0] <= t <= stops[i + 1][0]:
                k = (t - stops[i][0]) / max(1e-6, stops[i + 1][0] - stops[i][0])
                c0, c1 = stops[i][1], stops[i + 1][1]
                col = tuple(int(c0[j] * (1 - k) + c1[j] * k) for j in range(3))
                break
        bd.line([(inner[0], y), (inner[2], y)], fill=col + (255,))
    mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle(inner, radius=rad - int(8 * ss), fill=255)
    body.putalpha(mask)
    im = Image.alpha_composite(im, body)
    d = ImageDraw.Draw(im)
    # inset well the text sits in
    well = [inner[0] + int(28 * ss), inner[1] + int(28 * ss), inner[2] - int(28 * ss), inner[3] - int(28 * ss)]
    d.rounded_rectangle(well, radius=rad - int(20 * ss), fill=(30, 11, 54, 255), outline=(10, 4, 16, 255), width=int(6 * ss))
    # magenta neon tube with a white core, the frame's signature edge
    d.rounded_rectangle(well, radius=rad - int(20 * ss), outline=(255, 45, 149, 255), width=int(10 * ss))
    d.rounded_rectangle(well, radius=rad - int(20 * ss), outline=(255, 255, 255, 210), width=int(3 * ss))
    return im.resize((width, height), Image.LANCZOS)


def build_chrome_plate(
    width: int,
    height: int,
    corner_bolts: bool = False,
    well_inset: float = 0.055,
) -> Image.Image:
    """A chrome plate with a magenta neon tube around an inset well.

    Shared by the free-spin counter and the free-spin intro panel so both speak
    the reel housing's language — chrome body, dark horizon band through the
    middle, magenta tube with a white core.
    """
    ss = 2
    sw, sh = width * ss, height * ss
    im = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    pad = int(min(sw, sh) * 0.03)
    box = [pad, pad, sw - pad, sh - pad]
    rad = int(min(sw, sh) * 0.09)
    d.rounded_rectangle(box, radius=rad, fill=(10, 4, 16, 255))

    inner = [box[0] + int(10 * ss), box[1] + int(10 * ss), box[2] - int(10 * ss), box[3] - int(10 * ss)]
    body = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    bd = ImageDraw.Draw(body)
    stops = [(0.00, (255, 255, 255)), (0.18, (216, 230, 255)), (0.42, (123, 143, 199)),
             (0.55, (42, 51, 85)), (0.68, (201, 182, 255)), (0.86, (255, 154, 213)), (1.00, (255, 255, 255))]
    y0, y1 = inner[1], inner[3]
    for y in range(y0, y1):
        t = (y - y0) / max(1, y1 - y0)
        col = stops[-1][1]
        for i in range(len(stops) - 1):
            if stops[i][0] <= t <= stops[i + 1][0]:
                k = (t - stops[i][0]) / max(1e-6, stops[i + 1][0] - stops[i][0])
                c0, c1 = stops[i][1], stops[i + 1][1]
                col = tuple(int(c0[j] * (1 - k) + c1[j] * k) for j in range(3))
                break
        bd.line([(inner[0], y), (inner[2], y)], fill=col + (255,))
    mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle(inner, radius=max(2, rad - int(8 * ss)), fill=255)
    body.putalpha(mask)
    im = Image.alpha_composite(im, body)
    d = ImageDraw.Draw(im)

    ins = int(min(sw, sh) * well_inset) + int(18 * ss)
    well = [inner[0] + ins, inner[1] + ins, inner[2] - ins, inner[3] - ins]
    wrad = max(2, rad - int(14 * ss))
    d.rounded_rectangle(well, radius=wrad, fill=(30, 11, 54, 255), outline=(10, 4, 16, 255), width=int(6 * ss))
    d.rounded_rectangle(well, radius=wrad, outline=(255, 45, 149, 255), width=int(10 * ss))
    d.rounded_rectangle(well, radius=wrad, outline=(255, 255, 255, 210), width=int(3 * ss))

    if corner_bolts:
        r = int(min(sw, sh) * 0.032)
        off = ins // 2 + int(8 * ss)
        for cx, cy in ((inner[0] + off, inner[1] + off), (inner[2] - off, inner[1] + off),
                       (inner[0] + off, inner[3] - off), (inner[2] - off, inner[3] - off)):
            pts = [(cx + r * math.cos(math.radians(60 * k)), cy + r * math.sin(math.radians(60 * k)))
                   for k in range(6)]
            d.polygon(pts, fill=(160, 176, 214, 255), outline=(10, 4, 16, 255))
            d.polygon([(x * 0.999, y * 0.999) for x, y in pts], outline=(226, 236, 255, 200))
    return im.resize((width, height), Image.LANCZOS)


def recolour_anticipation(spine_dir: Path) -> None:
    """Turn the anticipation spine from the template's amber to this game's cyan.

    The anticipation column is the loudest thing on screen while a reel is being
    held, and it was still the sample game's amber-gold — measured RGB(210,155,77)
    on the dominant saturated pixels. Anticipation is CYAN in this palette (see
    palette.ts): it is the "the machine is telling you something" colour, used on
    the toggle states and nowhere else.

    This rotates hue rather than repainting. The atlas is a real spine sheet —
    named regions with offsets, several rotated 90° — so redrawing the art would
    mean rebuilding the packing and re-rigging. Every shape, every soft alpha edge
    and every bone binding is already correct; only the hue is wrong. A hue
    rotation preserves all of that and needs no atlas change at all.

    Both files are written: the atlas header points at the .webp, and the .png is
    the fallback some loaders take.
    """
    import colorsys
    import shutil

    TARGET_HUE = 187 / 360.0  # #22E4FF
    backup = SOURCE / "legacy" / "spines" / "anticipation_template"
    backup.mkdir(parents=True, exist_ok=True)
    for name in ("anticipation.png", "anticipation.webp"):
        path = spine_dir / name
        if not path.exists():
            continue
        # This rewrites in place, so keep the template original once — re-running
        # must not hue-rotate an already-rotated image.
        kept = backup / name
        if not kept.exists():
            shutil.copy2(path, kept)
        im = Image.open(kept).convert("RGBA")
        a = np.array(im).astype(np.float32)
        rgb, alpha = a[..., :3] / 255.0, a[..., 3]

        mx = rgb.max(2)
        mn = rgb.min(2)
        sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
        # Only move pixels that carry real colour. Whites and near-blacks are
        # structure — the hot core of the beam, the dark keyline — and moving
        # them would flatten the shape.
        movable = (sat > 0.18) & (alpha > 8)

        out = rgb.copy()
        idx = np.argwhere(movable)
        for y, x in idx:
            r, g, b = rgb[y, x]
            _, l, s = colorsys.rgb_to_hls(float(r), float(g), float(b))
            nr, ng, nb = colorsys.hls_to_rgb(TARGET_HUE, l, s)
            out[y, x] = (nr, ng, nb)

        res = np.dstack([np.clip(out * 255, 0, 255), alpha]).astype(np.uint8)
        Image.fromarray(res, "RGBA").save(path)
        print(f"[OK] anticipation {name}: {len(idx)} coloured px rotated to cyan")


def build_coin_sheet(atlas_json: Path, out_png: Path) -> None:
    """Repaint the big-win coin spritesheet in this game's language.

    What shipped was `SD2_Coin.png`: photorealistic 3D-rendered Japanese 5-yen
    coins, complete with a Shiba Inu head and the kanji 五円, carried over from an
    unrelated sample game. It is not a hidden asset either — WinCoins rains it
    across the screen on every big win, so the loudest moment in a Y2K disco slot
    was showering the player in rendered yen.

    That exact failure — sample-game art still shipping, on screen — is what the
    sibling Ember Forge lost its first review round to.

    The 12 frames are one rotation cycle: all 487px tall, with widths running
    487 -> 81 -> 487 as the coin turns edge-on. Painting into the SAME rects means
    the atlas JSON, and therefore the particle emitter, needs no change at all.
    """
    import json

    meta = json.loads(atlas_json.read_text())
    W, H = meta["meta"]["size"]["w"], meta["meta"]["size"]["h"]
    sheet = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    ss = 3
    for name, entry in meta["frames"].items():
        f = entry["frame"]
        w, h = f["w"], f["h"]
        cw, ch = w * ss, h * ss
        tile = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        d = ImageDraw.Draw(tile)

        # how far through the turn this frame is: 1.0 face-on, ~0.17 edge-on
        turn = w / h
        pad = int(ch * 0.04)
        box = [pad * turn, pad, cw - pad * turn, ch - pad]

        # rim, then face, in flat steps — no soft shading anywhere
        d.ellipse(box, fill=(10, 4, 16, 255))
        rim = [box[0] + cw * 0.055, box[1] + ch * 0.05, box[2] - cw * 0.055, box[3] - ch * 0.05]
        d.ellipse(rim, fill=(216, 230, 255, 255), outline=(10, 4, 16, 255), width=max(2, int(ch * 0.012)))
        face = [rim[0] + cw * 0.075, rim[1] + ch * 0.07, rim[2] - cw * 0.075, rim[3] - ch * 0.07]
        d.ellipse(face, fill=(255, 201, 77, 255), outline=(10, 4, 16, 255), width=max(2, int(ch * 0.012)))
        # A small glint in the upper left, not a band across the whole face. The
        # first version used a half-disc chord, which cuts a hard horizontal line
        # across the middle and reads as a half-filled glass rather than as light.
        fw, fh = face[2] - face[0], face[3] - face[1]
        d.ellipse(
            [
                face[0] + fw * 0.16,
                face[1] + fh * 0.12,
                face[0] + fw * 0.52,
                face[1] + fh * 0.34,
            ],
            fill=(255, 243, 207, 255),
        )

        # a four-point star, squashed with the turn so it reads as painted on
        cx, cy = cw / 2, ch / 2
        rx, ry = (face[2] - face[0]) * 0.30, (face[3] - face[1]) * 0.30
        waist = 0.26
        d.polygon(
            [
                (cx, cy - ry),
                (cx + rx * waist, cy - ry * waist),
                (cx + rx, cy),
                (cx + rx * waist, cy + ry * waist),
                (cx, cy + ry),
                (cx - rx * waist, cy + ry * waist),
                (cx - rx, cy),
                (cx - rx * waist, cy - ry * waist),
            ],
            fill=(10, 4, 16, 255),
        )

        sheet.paste(tile.resize((w, h), Image.LANCZOS), (f["x"], f["y"]))

    sheet.save(out_png)
    print(f"[OK] Coin sheet {W}x{H}, {len(meta['frames'])} frames repainted -> {out_png}")


def build_ui_icons(size: int = 256) -> dict[str, Image.Image]:
    """Drawn chrome icons for the bet-bar buttons.

    The bar was still using the template's text/emoji glyphs — `≡`, `⚙`, `🔊`.
    Certification called those out by name on the sibling game: an emoji renders
    in the viewer's own system font, ignores the canvas fill entirely, and so
    cannot be themed at all. Two players on different platforms see two different
    icon sets, neither of them this game's.

    Drawn as flat chrome-white shapes on transparent, at the same 256px the
    sibling ships, with a dark keyline so they hold up on a light plate too.
    """
    ss = 4
    S = size * ss
    ink = (10, 4, 16, 255)
    chrome = (226, 236, 255, 255)
    lw = int(S * 0.075)
    icons: dict[str, Image.Image] = {}

    def canvas():
        im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        return im, ImageDraw.Draw(im)

    def bar(d, cx, cy, w, h, r=None):
        r = r if r is not None else h // 2
        d.rounded_rectangle([cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2],
                            radius=r, fill=chrome, outline=ink, width=max(2, lw // 3))

    c = S // 2

    # menu — three bars
    im, d = canvas()
    for k in (-1, 0, 1):
        bar(d, c, c + k * int(S * 0.20), int(S * 0.56), lw)
    icons["menu"] = im

    # menuExit — an X
    im, d = canvas()
    for a in (45, -45):
        r = math.radians(a)
        dx, dy = math.cos(r) * S * 0.21, math.sin(r) * S * 0.21
        d.line([(c - dx, c - dy), (c + dx, c + dy)], fill=chrome, width=lw)
        d.line([(c - dx, c - dy), (c + dx, c + dy)], fill=ink, width=max(2, lw // 4))
        d.line([(c - dx, c - dy), (c + dx, c + dy)], fill=chrome, width=int(lw * 0.7))
    icons["menuExit"] = im

    # settings — a cog: ring plus eight teeth
    im, d = canvas()
    outer, inner = int(S * 0.30), int(S * 0.17)
    for k in range(8):
        a = math.radians(k * 45)
        tx, ty = c + math.cos(a) * outer, c + math.sin(a) * outer
        d.regular_polygon((tx, ty, int(S * 0.075)), 4, rotation=k * 45,
                          fill=chrome, outline=ink)
    d.ellipse([c - outer, c - outer, c + outer, c + outer], fill=chrome, outline=ink, width=lw // 2)
    d.ellipse([c - inner, c - inner, c + inner, c + inner], fill=(0, 0, 0, 0), outline=ink, width=lw)
    icons["settings"] = im

    # info — dot over a stem, inside a ring
    im, d = canvas()
    r = int(S * 0.33)
    d.ellipse([c - r, c - r, c + r, c + r], outline=chrome, width=lw)
    d.ellipse([c - int(S * 0.045), c - int(S * 0.20), c + int(S * 0.045), c - int(S * 0.11)], fill=chrome)
    bar(d, c, c + int(S * 0.07), int(S * 0.085), int(S * 0.30), r=int(S * 0.04))
    icons["info"] = im

    # payTable — a 3x3 grid of cells
    im, d = canvas()
    cell = int(S * 0.155)
    gap = int(S * 0.045)
    span = cell * 3 + gap * 2
    x0 = c - span // 2
    for row in range(3):
        for col in range(3):
            x = x0 + col * (cell + gap)
            y = c - span // 2 + row * (cell + gap)
            d.rounded_rectangle([x, y, x + cell, y + cell], radius=int(cell * 0.25),
                                fill=chrome if (row + col) % 2 == 0 else (0, 0, 0, 0),
                                outline=chrome, width=max(2, lw // 2))
    icons["payTable"] = im

    # sound on / off — speaker body plus arcs or a cross
    for name, on in (("soundOn", True), ("soundOff", False)):
        im, d = canvas()
        bx = c - int(S * 0.20)
        d.polygon([(bx, c - int(S * 0.09)), (bx + int(S * 0.10), c - int(S * 0.09)),
                   (bx + int(S * 0.24), c - int(S * 0.24)), (bx + int(S * 0.24), c + int(S * 0.24)),
                   (bx + int(S * 0.10), c + int(S * 0.09)), (bx, c + int(S * 0.09))],
                  fill=chrome, outline=ink)
        if on:
            for k, rr in enumerate((0.10, 0.17, 0.24)):
                box = [c + int(S * 0.05), c - int(S * rr), c + int(S * 0.05) + int(S * rr * 2), c + int(S * rr)]
                d.arc(box, start=-55, end=55, fill=chrome, width=lw)
        else:
            for a in (45, -45):
                rad = math.radians(a)
                dx, dy = math.cos(rad) * S * 0.10, math.sin(rad) * S * 0.10
                px = c + int(S * 0.20)
                d.line([(px - dx, c - dy), (px + dx, c + dy)], fill=chrome, width=lw)
        icons[name] = im

    # autoSpin / replay — both a circular arrow, but they must not be identical:
    # they are two different controls sitting in the same bar, and a player who
    # cannot tell them apart will press the wrong one. autoSpin carries a play
    # triangle in the centre (it starts a run), replay stays an empty loop.
    for name in ("autoSpin", "replay"):
        im, d = canvas()
        r = int(S * 0.28)
        d.arc([c - r, c - r, c + r, c + r], start=40, end=330, fill=chrome, width=lw)
        tipx, tipy = c + math.cos(math.radians(40)) * r, c + math.sin(math.radians(40)) * r
        h = int(S * 0.085)
        d.polygon([(tipx + h, tipy - h * 0.2), (tipx - h * 0.5, tipy - h),
                   (tipx - h * 0.2, tipy + h)], fill=chrome, outline=ink)
        if name == "autoSpin":
            t = int(S * 0.10)
            d.polygon([(c - t * 0.7, c - t), (c + t, c), (c - t * 0.7, c + t)],
                      fill=chrome, outline=ink)
        icons[name] = im

    return {k: v.resize((size, size), Image.LANCZOS) for k, v in icons.items()}


def build_neon_tube_royal(letter: str, neon_hex: str, size: int = 1024, size_boost: float = 1.0) -> Image.Image:
    """Build a bent glass neon tube capital letter with white core line, dark backing plate, and chrome mounting brackets."""
    ss = 2
    sw, sh = size * ss, size * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = sw // 2, int(sh * 0.50)

    # Convert hex to RGB
    h = neon_hex.lstrip("#")
    neon_rgb = tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))

    # Font. size_boost evens out the ink across the four royals: a J is a much
    # narrower glyph than an A or a Q, and at equal point size it measured the
    # thinnest symbol on the board (12.5% opaque coverage against 15.7% for Q).
    font = get_font(int(620 * ss * size_boost), orbitron=False)
    bbox = draw.textbbox((0, 0), letter, font=font, stroke_width=int(40 * ss))
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2 - bbox[0]
    ty = (sh - th) // 2 - bbox[1] - int(15 * ss)

    # 1. Dark Backing Plate (#1E0B36) with thick dark outline (#0A0410)
    shadow_off = int(24 * ss)
    draw.text((tx + shadow_off, ty + shadow_off), letter, font=font, fill=(10, 4, 16, 255), stroke_width=int(72 * ss), stroke_fill=(10, 4, 16, 255))
    draw.text((tx, ty), letter, font=font, fill=(10, 4, 16, 255), stroke_width=int(64 * ss), stroke_fill=(10, 4, 16, 255))
    draw.text((tx, ty), letter, font=font, fill=(30, 11, 54, 255), stroke_width=int(48 * ss), stroke_fill=(30, 11, 54, 255))

    # 2. Soft Neon Tube Outer Glow
    glow_mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(glow_mask).text((tx, ty), letter, font=font, fill=255, stroke_width=int(56 * ss), stroke_fill=255)
    glow_mask = glow_mask.filter(ImageFilter.GaussianBlur(16 * ss))
    glow_layer = Image.new("RGBA", (sw, sh), neon_rgb + (200,))
    glow_layer.putalpha(glow_mask)
    layer = Image.alpha_composite(layer, glow_layer)
    draw = ImageDraw.Draw(layer)

    # 3. Luminous Bent Glass Neon Tube Stroke
    draw.text((tx, ty), letter, font=font, fill=(0, 0, 0, 0), stroke_width=int(28 * ss), stroke_fill=neon_rgb + (255,))

    # 4. Pure White #FFFFFF Core Line down the center
    draw.text((tx, ty), letter, font=font, fill=(0, 0, 0, 0), stroke_width=int(8 * ss), stroke_fill=(255, 255, 255, 255))

    # The chrome mounting brackets that used to be drawn here are gone. They were
    # rendered correctly — flat plate, keyline, screw dot, exactly as briefed —
    # but they are ~90px wide on a 1024px canvas, so at the 144px the board
    # actually draws them at they collapse into a pair of grey specks above and
    # below the letter and read as dirt on the symbol rather than as hardware.
    # Detail that cannot survive the display size is worse than no detail.

    # Fit into 1024x1024 with 9% margin (82% subject)
    return square_and_fit(layer.resize((size, size), Image.LANCZOS), size=size, margin=0.09)


# ===========================================================================
# Win Banners (1536x512) per §4.11
# ===========================================================================
def build_liquid_chrome_text_banner(
    word: str,
    burst_rays: int,
    burst_colors: list[tuple[int, int, int]],
    is_gold: bool = False,
    extra_stars: int = 2,
    width: int = 1536,
    height: int = 512,
) -> Image.Image:
    """Build an escalating Y2K liquid chrome win banner."""
    ss = 2
    sw, sh = width * ss, height * ss
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = sw // 2, sh // 2

    # 1. Multi-point Starburst behind word
    reach_x = sw * 0.48
    reach_y = sh * 0.46
    for i in range(burst_rays):
        a0 = math.radians(i * (360.0 / burst_rays))
        a1 = a0 + math.radians((360.0 / burst_rays) * 0.48)
        col = burst_colors[i % len(burst_colors)]
        pts = [
            (cx, cy),
            (cx + math.cos(a0) * reach_x, cy + math.sin(a0) * reach_y),
            (cx + math.cos(a1) * reach_x, cy + math.sin(a1) * reach_y),
        ]
        draw.polygon(pts, fill=col + (220,), outline=(10, 4, 16, 255))

    # 2. Text layout.
    #
    # Every stroke width below used to be two to five times larger. A stroke
    # grows a glyph outward on all sides, so at stroke_width=26*ss the letters
    # collided into each other and their own counters filled in — "BIG WIN" came
    # out as "BO WN". The keyline and extrusion now use a weight that still reads
    # as a heavy outline at banner size, and TRACKING adds the space back between
    # glyphs so the I in WIN keeps clear air on both sides.
    font = get_font(int(140 * ss), orbitron=True)
    TRACKING = int(26 * ss)
    KEYLINE = int(9 * ss)
    bbox = draw.textbbox((0, 0), word, font=font)
    th = bbox[3] - bbox[1]
    tw = tracked_text_width(draw, word, font, TRACKING)
    tx = int((sw - tw) // 2)
    ty = (sh - th) // 2 - int(10 * ss)

    # 3. 3D Dark Violet (#31145A) Extrusion
    ext_depth = int(22 * ss)
    for d in range(ext_depth, 0, -2):
        draw_tracked_text(draw, (tx, ty + d), word, font, TRACKING,
                          fill=(49, 20, 90, 255), stroke_width=KEYLINE, stroke_fill=(10, 4, 16, 255))

    # 4. Thick Dark Keyline (#0A0410)
    draw_tracked_text(draw, (tx, ty), word, font, TRACKING,
                      fill=(10, 4, 16, 255), stroke_width=KEYLINE, stroke_fill=(10, 4, 16, 255))

    # 5. Liquid Chrome / Gold Gradient Fill
    #
    # The mask is what the gradient shows through, so its stroke decides the
    # final letterform. It was 14*ss — a 28px outward bleed that swallowed the
    # thin stems whole. It only needs to reach far enough to meet the keyline.
    mask = Image.new("L", (sw, sh), 0)
    draw_tracked_text(ImageDraw.Draw(mask), (tx, ty), word, font, TRACKING,
                      fill=255, stroke_width=int(2 * ss), stroke_fill=255)

    grad = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)

    for y in range(sh):
        t = (y - (ty - int(20 * ss))) / max(1, th + int(40 * ss))
        t = max(0.0, min(1.0, t))

        if is_gold:
            # Gold stops
            if t < 0.20:
                r, g, b = 255, 250, 210
            elif t < 0.50:
                k = (t - 0.20) / 0.30
                r, g, b = int(255 - 40 * k), int(201 - 30 * k), int(77 - 20 * k)
            elif t < 0.65:
                r, g, b = 180, 110, 20
            else:
                k = (t - 0.65) / 0.35
                r, g, b = int(255 * k + 180 * (1 - k)), int(220 * k + 110 * (1 - k)), int(90 * k + 20 * (1 - k))
        else:
            # Liquid chrome stops
            if t < 0.18:
                r, g, b = 255, 255, 255
            elif t < 0.42:
                k = (t - 0.18) / 0.24
                r = int(216 * (1 - k) + 123 * k)
                g = int(230 * (1 - k) + 143 * k)
                b = int(255 * (1 - k) + 199 * k)
            elif t < 0.55:
                # Dark horizon band #2A3355
                r, g, b = 42, 51, 85
            elif t < 0.68:
                k = (t - 0.55) / 0.13
                r = int(42 * (1 - k) + 201 * k)
                g = int(51 * (1 - k) + 182 * k)
                b = int(85 * (1 - k) + 255 * k)
            elif t < 0.86:
                k = (t - 0.68) / 0.18
                r = int(201 * (1 - k) + 255 * k)
                g = int(182 * (1 - k) + 154 * k)
                b = int(255 * (1 - k) + 213 * k)
            else:
                r, g, b = 255, 255, 255

        gdraw.line([(0, y), (sw, y)], fill=(r, g, b, 255))

    grad.putalpha(mask)
    layer = Image.alpha_composite(layer, grad)

    # 6. Hard-edged 4-point white sparkle stars
    sdraw = ImageDraw.Draw(layer)
    star_locs = [
        (tx - int(20 * ss), ty - int(10 * ss)),
        (tx + tw + int(10 * ss), ty + int(15 * ss)),
        (cx, ty + th + int(15 * ss)),
        (tx + int(40 * ss), ty + th + int(20 * ss)),
        (tx + tw - int(40 * ss), ty - int(15 * ss)),
        (cx - int(100 * ss), ty - int(20 * ss)),
        (cx + int(100 * ss), ty + th + int(25 * ss)),
        (tx - int(40 * ss), ty + th // 2),
    ]

    for i in range(min(extra_stars, len(star_locs))):
        sx, sy = star_locs[i]
        sr = int(22 * ss)
        s_pts = [
            (sx, sy - sr), (sx + int(5 * ss), sy - int(5 * ss)),
            (sx + sr, sy), (sx + int(5 * ss), sy + int(5 * ss)),
            (sx, sy + sr), (sx - int(5 * ss), sy + int(5 * ss)),
            (sx - sr, sy), (sx - int(5 * ss), sy - int(5 * ss)),
        ]
        sdraw.polygon(s_pts, fill=(255, 255, 255, 255), outline=(10, 4, 16, 255))

    return layer.resize((width, height), Image.LANCZOS)


# ===========================================================================
# Main Execution Pipeline
# ===========================================================================
def build_all():
    print("=== Processing Wild Party Neon Y2K Assets ===")

    sym_dir = SPRITES / "wildPartySymbols"
    bg_dir = SPRITES / "wildPartyBackground"
    frame_dir = SPRITES / "reelsFrame"
    win_dir = SPRITES / "winBanners"

    sym_dir.mkdir(parents=True, exist_ok=True)
    bg_dir.mkdir(parents=True, exist_ok=True)
    frame_dir.mkdir(parents=True, exist_ok=True)
    win_dir.mkdir(parents=True, exist_ok=True)

    # 1. H1..H4, W, S Symbols
    #
    # Two post-passes correct things the generator got wrong against the brief:
    #   - h2/h3 came back as bare outlines; the brief asked for a flat magenta
    #     liquid field inside the glassware. Without it they carry barely more
    #     ink than a low-value letter, inverting the pay hierarchy.
    #   - the Scatter's lime starburst rendered olive, leaving the one symbol a
    #     player must spot instantly as the dimmest thing on the board.
    LIQUID_MAGENTA = (255, 45, 149)
    for sym_key in ["h1", "h2", "h3", "h4", "w", "s"]:
        src = AI_RAW[sym_key]
        if src.exists():
            im = Image.open(src)
            keyed = key_chroma(im, tol=65, despill_edge=True)
            if sym_key in ("h2", "h3"):
                keyed = fill_interior_holes(keyed, LIQUID_MAGENTA, alpha=235)
            if sym_key == "s":
                keyed = olive_to_lime(keyed)
            fitted = square_and_fit(keyed, size=1024, margin=0.09)
            out_path = sym_dir / f"{sym_key}.png"
            fitted.save(out_path)
            fitted.save(SOURCE / f"{sym_key}.png")
            print(f"[OK] Symbol {sym_key}.png -> {out_path}")

    # 2. L1..L4 Neon Tube Royals
    # The J gets a brighter violet and a size boost. #A96BFF sits close enough to
    # the violet grounds of this palette that the letter receded into the board,
    # and a J is a narrow glyph so it carried the least ink of the four.
    royal_cfg = [
        ("l1", "A", "#FF2D95", 1.00),  # Magenta
        ("l2", "K", "#22E4FF", 1.00),  # Cyan
        ("l3", "Q", "#B6FF3D", 1.00),  # Lime
        ("l4", "J", "#C08BFF", 1.10),  # Violet, lifted off the background
    ]
    for file_key, letter, hex_col, boost in royal_cfg:
        sym_img = build_neon_tube_royal(letter, hex_col, size=1024, size_boost=boost)
        out_path = sym_dir / f"{file_key}.png"
        sym_img.save(out_path)
        sym_img.save(SOURCE / f"{file_key}.png")
        print(f"[OK] Royal {file_key}.png ({letter}) -> {out_path}")

    # 2b. Win-state spine pages.
    #
    # A symbol is drawn from TWO different assets: the static board uses the PNG
    # in wildPartySymbols/, but the moment it takes part in a win, SYMBOL_INFO_MAP
    # swaps to a spine (wpSp*) whose atlas page is a separate copy of the art.
    # Reskinning only the PNGs therefore left the game flipping to the OLD gold
    # artwork exactly when the player is looking hardest — on the win.
    #
    # Each atlas is a single untrimmed, unrotated region covering the whole
    # 256x256 page, so replacing the page with the new art at the same size keeps
    # every keyframe in the skeleton valid.
    spine_dir = STATIC / "assets" / "spines" / "wildPartySymbols"
    if spine_dir.exists():
        for sym_key in ["h1", "h2", "h3", "h4", "l1", "l2", "l3", "l4", "w", "s"]:
            page = spine_dir / f"{sym_key}.png"
            src_png = sym_dir / f"{sym_key}.png"
            if not page.exists() or not src_png.exists():
                continue
            size = Image.open(page).size
            Image.open(src_png).convert("RGBA").resize(size, Image.LANCZOS).save(page)
            print(f"[OK] Win spine page {sym_key}.png {size[0]}x{size[1]} -> {page}")

    # 3. Backgrounds (2304x1536)
    if AI_RAW["bg_base"].exists():
        im = Image.open(AI_RAW["bg_base"]).convert("RGB")
        im = im.resize((2304, 1536), Image.LANCZOS)
        out_base = bg_dir / "bg_base.png"
        im.save(out_base)
        print(f"[OK] Background bg_base.png -> {out_base}")

    if AI_RAW["bg_feature"].exists():
        im = Image.open(AI_RAW["bg_feature"]).convert("RGB")
        im = im.resize((2304, 1536), Image.LANCZOS)
        out_feat = bg_dir / "bg_feature.png"
        im.save(out_feat)
        print(f"[OK] Background bg_feature.png -> {out_feat}")

    # 4. Reel housing — THREE standalone PNGs, not an atlas.
    #
    # The game used to read this through reels_frame_v3.json, a sprite sheet
    # describing a 3182x976 image with three sub-frames. Dropping a standalone
    # 2048x1536 frame in as the sheet image left every rect pointing somewhere
    # arbitrary: frame_edge needed 2716px of width that did not exist, and
    # Frame_FSCounter's rect started at x=2724, entirely off the image, so it
    # sampled nothing at all. Standalone files remove the coupling between the
    # art's dimensions and the code's rects for good.
    if AI_RAW["reels_frame"].exists():
        im = Image.open(AI_RAW["reels_frame"])
        keyed = key_chroma_center_hole(im, tol=65)
        # the lamp lenses along the top rail came back olive like the Scatter
        keyed = olive_to_lime(keyed)
        edge = keyed.resize((2048, 1536), Image.LANCZOS)
        # Trim the fully transparent border (100px each side, 200px top and
        # bottom). It is pure padding, so nothing is lost — but the game sizes
        # the housing off the board, and padding inside the texture makes the
        # drawn frame proportionally larger than the chrome it contains. On the
        # side-rail layout that surplus width is what pushes the housing out
        # under the Buy Bonus CTA and the readout panels.
        bbox = edge.getbbox()
        if bbox:
            edge = edge.crop(bbox)
        # Re-proportion so the bezel is thin relative to the window — see the
        # function's docstring for why cropping and rescaling cannot do this.
        edge = rebuild_frame_nine_patch(edge, bezel_scale=0.40)
        out_edge = frame_dir / "frame_edge.png"
        edge.save(out_edge)
        print(f"[OK] Reel frame frame_edge.png -> {out_edge}")

        # Report the window geometry: BoardFrame.svelte's SPRITE_SCALE is derived
        # from these two numbers, so a regenerated frame that changes them has to
        # be followed by an update there or the housing will crop the board.
        a = np.array(edge)[..., 3]
        h, w = a.shape
        row = np.where(a[h // 2] > 128)[0]
        col = np.where(a[:, w // 2] > 128)[0]
        gx = np.where(np.diff(row) > 1)[0]
        gy = np.where(np.diff(col) > 1)[0]
        if len(gx) and len(gy):
            win_w = row[gx[0] + 1] - row[gx[0]]
            win_h = col[gy[0] + 1] - col[gy[0]]
            cy_win = (col[gy[0]] + col[gy[0] + 1]) / 2
            print(f"     window {win_w}x{win_h} = {win_w / w * 100:.1f}% x {win_h / h * 100:.1f}% of art; "
                  f"centre y offset {cy_win - h / 2:+.0f}px")

    backdrop = build_interior_backdrop()
    out_bg = frame_dir / "frame_bg.png"
    backdrop.save(out_bg)
    print(f"[OK] Reel frame frame_bg.png -> {out_bg}")

    plate = build_fs_counter_plate()
    out_fs = frame_dir / "frame_fs_counter.png"
    plate.save(out_fs)
    print(f"[OK] Reel frame frame_fs_counter.png -> {out_fs}")

    # 4b. Free-spin intro panel.
    #
    # The intro plaque was still the ornate gold-and-jewels panel from the old
    # theme — the same baroque language as the reel frame that got replaced, and
    # the loudest off-theme object left in the game now that everything around it
    # is chrome and neon. Rebuilt in the housing's language; the filename is
    # unchanged so assets.ts needs no edit.
    fs_dir = SPRITES / "fsOrnate"
    fs_panel = fs_dir / "fs_ornate_panel.png"
    if fs_panel.exists():
        size = Image.open(fs_panel).size
        build_chrome_plate(size[0], size[1], corner_bolts=True, well_inset=0.03).save(fs_panel)
        print(f"[OK] Free-spin intro panel {size[0]}x{size[1]} -> {fs_panel}")

    # 4b1. Anticipation spine — still the template's amber.
    recolour_anticipation(STATIC / "assets" / "spines" / "anticipation")

    # 4b2. Big-win coins — repaint over the sample game's yen coins.
    coin_dir = SPRITES / "coin"
    coin_json = coin_dir / "SD2_Coin.json"
    if coin_json.exists():
        build_coin_sheet(coin_json, coin_dir / "SD2_Coin.png")

    # 4c. Bet-bar icons — replaces the template's emoji/text glyphs.
    icon_dir = SPRITES / "wildPartyUiIcons"
    icon_dir.mkdir(parents=True, exist_ok=True)
    for name, img in build_ui_icons(256).items():
        out = icon_dir / f"{name}.png"
        img.save(out)
        print(f"[OK] UI icon {name}.png -> {out}")

    # 5. Win Banners (1536x512)
    win_tiers = [
        ("big.png", "BIG WIN", 6, [(255, 45, 149)], False, 2),
        ("superwin.png", "SUPER WIN", 8, [(255, 45, 149), (34, 228, 255)], False, 4),
        ("mega.png", "MEGA WIN", 12, [(255, 45, 149), (182, 255, 61)], False, 6),
        ("epic.png", "EPIC WIN", 16, [(255, 45, 149), (182, 255, 61), (34, 228, 255)], True, 8),
        ("max.png", "MAX WIN", 20, [(255, 201, 77), (255, 45, 149), (34, 228, 255)], True, 8),
    ]

    for fname, word, rays, cols, is_gold, stars in win_tiers:
        b_img = build_liquid_chrome_text_banner(word, rays, cols, is_gold=is_gold, extra_stars=stars)
        out_path = win_dir / fname
        b_img.save(out_path)
        print(f"[OK] Win Banner {fname} -> {out_path}")

    print("\n=== All Wild Party Neon Y2K Assets Built and Installed ===")


if __name__ == "__main__":
    build_all()
