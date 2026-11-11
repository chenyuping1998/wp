#!/usr/bin/env python3
"""Street-sticker restyle, everything that is not a UI plate: symbols, frames, FX, scenes.

Three kinds of output, all in the ART_BRIEF.md v2 §0 sticker language:

  final        the approved style-frame pieces (design/style_frame/): h1, w, sw, l1, bg_base
  drawn        code-drawn art that the brief does not ask anyone to generate: duct-tape
               Loot Bag frames and their glow layers, the sticky mark, the Bruiser's
               swing / beam / locked tape / splat / scraps, the coin, the roller shutter
               and padlock for the FG transition
  interim      render-era symbols turned into stickers in their PLANNED main colour
               (posterised luminance -> ink / dark / main / light, white border, ink
               line) until batch 1 lands, so no render colour stays on the board
               (feedback: restyle means everything; grey/interim before new art)

Generated deliveries replace interim/drawn files simply by being installed later
(build_street_batch.py output copied over these). Originals are backed up once to
design/_legacy_assets/render_assets_20261015/.

  build_street_interim.py            -> design/_street/interim/<sprite path>
  build_street_interim.py --install  -> also copy into static/assets/sprites/
"""

from __future__ import annotations

import argparse
import json
import math
import random
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from build_street_ui import (ACID, BOARD, CLEAR, CYAN, GREY_D, GREY_L, GREY_M, INK, MAGENTA, RED, SOD, SOD_D,
                             SOD_L, TAG_FONT, WHITE, Canvas, grain, place_text, tape, text_layer)

APP = Path(__file__).resolve().parent.parent
DESIGN = APP / "design"
OUT = DESIGN / "_street/interim"
SPRITES = APP / "static/assets/sprites"
BACKUP = DESIGN / "_legacy_assets/render_assets_20261015"
FRAME = DESIGN / "style_frame"
RED_D = (0x6E, 0x14, 0x14, 255)

# ------------------------------------------------------------------ helpers


def rgb(c):
    return np.array(c[:3], float)


def outline_sticker(rgba: np.ndarray, white_px: int, ink_px: int) -> np.ndarray:
    """Add an ink line and a white sticker rim around an alpha shape (works at any size)."""
    hard = Image.fromarray(((rgba[..., 3] > 110) * 255).astype(np.uint8))
    ink = hard.filter(ImageFilter.MaxFilter(ink_px * 2 + 1))
    white = ink.filter(ImageFilter.MaxFilter(white_px * 2 + 1)).filter(ImageFilter.GaussianBlur(1.0))
    ink = ink.filter(ImageFilter.GaussianBlur(0.8))
    h, w = rgba.shape[:2]
    out = np.zeros((h, w, 4), float)
    out[..., :3] = rgb(WHITE)
    out[..., 3] = np.asarray(white, float)
    ia = np.asarray(ink, float)[..., None] / 255
    out[..., :3] = out[..., :3] * (1 - ia) + rgb(INK) * ia
    out[..., 3] = np.maximum(out[..., 3], ia[..., 0] * 255)
    fa = rgba[..., 3:4] / 255
    out[..., :3] = out[..., :3] * (1 - fa) + rgba[..., :3] * fa
    out[..., 3] = np.maximum(out[..., 3], rgba[..., 3])
    return out


def stickerise(src: Path, inks: list[tuple], size=512) -> Image.Image:
    """Interim: posterise a render's luminance onto `inks` (dark -> light), then rim it."""
    work = 1024
    im = Image.open(src).convert("RGBA").resize((work, work), Image.LANCZOS)
    a = np.asarray(im).astype(float)
    # shrink the art a little so the new rim fits the old footprint
    lum = (a[..., :3] @ np.array([0.299, 0.587, 0.114]))
    lum = np.asarray(Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.MedianFilter(13)), float)
    vis = a[..., 3] > 110
    edges = np.quantile(lum[vis], np.linspace(0, 1, len(inks) + 1)[1:-1]) if vis.any() else []
    idx = np.digitize(lum, edges)
    pal = np.array([c[:3] for c in inks], float)
    out = np.zeros_like(a)
    out[..., :3] = pal[idx]
    out[..., 3] = np.where(a[..., 3] > 110, 255, 0)
    # ink detail lines where luminance jumps
    e = np.asarray(Image.fromarray(idx.astype(np.uint8) * 60).filter(ImageFilter.FIND_EDGES), float) > 0
    e = np.asarray(Image.fromarray((e * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)), float) > 0
    out[e & vis, :3] = rgb(INK)
    shrink = Image.fromarray(out.astype(np.uint8)).resize((int(work * 0.90),) * 2, Image.LANCZOS)
    canvas = Image.new("RGBA", (work, work), CLEAR)
    canvas.alpha_composite(shrink, ((work - shrink.width) // 2,) * 2)
    res = outline_sticker(np.asarray(canvas).astype(float), white_px=30, ink_px=14)
    return Image.fromarray(res.clip(0, 255).astype(np.uint8)).resize((size, size), Image.LANCZOS)


def crisp_tag(src: Path, size=512) -> Image.Image:
    """Interim low pay: the old soft spray stencil as a crisp flat grey marker shape."""
    im = Image.open(src).convert("RGBA").resize((1024, 1024), Image.LANCZOS)
    a = np.asarray(im.split()[-1].filter(ImageFilter.GaussianBlur(3)), float)
    hard = np.clip((a - 90) * 6, 0, 255)
    out = np.zeros((1024, 1024, 4), np.uint8)
    out[..., :3] = GREY_M[:3]
    out[..., 3] = hard.astype(np.uint8)
    return Image.fromarray(out).resize((size, size), Image.LANCZOS)


def frame_ring(c: Canvas, w, h, band, seed, colour=SOD, money=True, tag_text="$"):
    """Loot Bag: four strips of duct tape making a square ring, the centre open."""
    rng = random.Random(seed)
    m = band * 0.55
    L = w - 2 * m
    tape(c, w / 2 + rng.uniform(-6, 6), m, L * 1.02, band, rng.uniform(-2, 2), colour, seed)
    tape(c, w / 2 + rng.uniform(-6, 6), h - m, L * 1.02, band, rng.uniform(-2, 2), colour, seed + 1)
    tape(c, m, h / 2, (h - 2 * m) * 1.02, band, 90 + rng.uniform(-2, 2), colour, seed + 2)
    tape(c, w - m, h / 2, (h - 2 * m) * 1.02, band, 90 + rng.uniform(-2, 2), colour, seed + 3)
    if money:
        t = text_layer(tag_text, TAG_FONT, band * 1.5, ACID, max(3, band * 0.06), max(4, band * 0.10))
        place_text(c, t, w - band * 0.9, h - band * 0.95, angle=-12)


# ------------------------------------------------------------------ pieces


def symbols(out):
    for n in ("h1", "w", "sw", "l1"):
        out[f"turfSymbols/{n}.png"] = Image.open(FRAME / f"{n}.png").convert("RGBA").resize((512, 512), Image.LANCZOS)
    S = BACKUP / "turfSymbols" if (BACKUP / "turfSymbols/h2.png").exists() else SPRITES / "turfSymbols"
    plan = {
        "h2": [INK, (0x1C, 0x7E, 0x80, 255), CYAN, (0xA6, 0xE6, 0xE6, 255)],
        "h3": [INK, (0x5E, 0x8A, 0x1E, 255), ACID, (0xD6, 0xEE, 0xA8, 255)],
        "h4": [INK, (0x8E, 0x1C, 0x55, 255), MAGENTA, (0xF4, 0xA8, 0xCC, 255)],
        "h5": [INK, GREY_D, GREY_M, SOD],
        "fs": [INK, (0x8E, 0x1C, 0x55, 255), CYAN, WHITE],
    }
    for n, inks in plan.items():
        out[f"turfSymbols/{n}.png"] = stickerise(S / f"{n}.png", inks)
    for n in ("l2", "l3", "l4"):
        out[f"turfSymbols/{n}.png"] = crisp_tag(S / f"{n}.png")


def frames(out):
    # hollow share per size from the brief (68/78/84%): band = (1 - hollow)/2 of the side
    for name, size, hollow, seed in (("1x1", 256, 0.68, 101), ("2x2", 512, 0.78, 102), ("3x3", 768, 0.84, 103)):
        band = size * (1 - hollow) / 2 * 0.62
        c = Canvas(size, size)
        frame_ring(c, size, size, band, seed)
        out[f"turfFrames/frame_{name}.png"] = c.done()
        # glow layer for the additive flash: the same ring, flat light orange, softened
        a = np.asarray(out[f"turfFrames/frame_{name}.png"].split()[-1])
        g = Image.fromarray(a).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(size / 120))
        edge = Image.new("RGBA", (size, size), SOD_L)
        edge.putalpha(Image.fromarray((np.asarray(g, float) * 0.85).astype(np.uint8)))
        out[f"turfFrames/frame_edge_{name}.png"] = edge

    # Big Score: tape around the whole board (squashed to 5:4 in game, straight strips only)
    c = Canvas(1280, 1280)
    frame_ring(c, 1280, 1280, 92, 104, money=False)
    for x, y in ((92, 92), (1188, 92), (92, 1188), (1188, 1188)):  # grommets, pre-stretched 1.25 tall
        c.ellipse((x - 26, y - 32, x + 26, y + 32), INK)
        c.ellipse((x - 16, y - 20, x + 16, y + 20), GREY_M)
    out["turfFrames/frame_full.png"] = c.done()
    a = np.asarray(out["turfFrames/frame_full.png"].split()[-1])
    g = Image.fromarray(a).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(10))
    edge = Image.new("RGBA", (1280, 1280), SOD_L)
    edge.putalpha(Image.fromarray((np.asarray(g, float) * 0.8).astype(np.uint8)))
    out["turfFrames/frame_full_edge.png"] = edge

    # sticky mark: acid-green sprayed tick-circle sticker
    c = Canvas(256, 256)
    c.ellipse((18, 18, 238, 238), WHITE)
    c.ellipse((30, 30, 226, 226), INK)
    c.ellipse((40, 40, 216, 216), ACID)
    c.ellipse((70, 70, 186, 186), INK)
    c.ellipse((80, 80, 176, 176), ACID)
    c.d.line(c.s(88, 132, 118, 164, 172, 96), fill=INK, width=22 * 2, joint="curve")
    grain(c, 105, 3)
    out["turfFrames/frame_sticky.png"] = c.done()


def bruiser_fx(out):
    # swing: three flat red speed arcs, sticker-rimmed, plus an impact star
    c = Canvas(512, 512)
    for i, (r, wdt) in enumerate(((330, 46), (270, 36), (215, 26))):
        box = (256 - r, 300 - r, 256 + r, 300 + r)
        c.d.arc(c.s(*box), 200, 300, fill=WHITE, width=int((wdt + 18) * 2))
    for i, (r, wdt) in enumerate(((330, 46), (270, 36), (215, 26))):
        box = (256 - r, 300 - r, 256 + r, 300 + r)
        c.d.arc(c.s(*box), 202, 298, fill=INK, width=int((wdt + 8) * 2))
        c.d.arc(c.s(*box), 204, 296, fill=RED, width=int(wdt * 2))
    star(c, 400, 120, 90, 40, WHITE, INK, SOD_L)
    out["turfFx/sw_bat_swing.png"] = c.done()

    # column beam: flat red paint stripe with drips (drawn additive in game -> keep it mid red)
    c = Canvas(256, 1024)
    c.rrect((70, 0, 186, 930), 50, RED_D)
    c.rrect((88, 0, 168, 900), 36, RED)
    rng = random.Random(7)
    for x in (92, 120, 150):
        ln = rng.uniform(60, 110)
        c.rrect((x - 8, 880, x + 8, 900 + ln), 8, RED)
        c.ellipse((x - 12, 890 + ln, x + 12, 912 + ln), RED)
    out["turfFx/sw_column_beam.png"] = c.done()

    # locked column (Kingpin): red tape crosses down the reel
    c = Canvas(256, 1024)
    for k, cy in enumerate((128, 384, 640, 896)):
        tape(c, 128, cy, 250, 54, 45, RED, 200 + k)
        tape(c, 128, cy, 250, 54, -45, RED, 210 + k)
    out["turfFx/sw_locked.png"] = c.done()

    # splat instead of cracks: flat ink spray splatter
    c = Canvas(512, 512)
    rng = random.Random(9)
    for _ in range(9):
        a = rng.uniform(0, 2 * math.pi)
        d = rng.uniform(90, 200)
        r = rng.uniform(10, 30)
        x, y = 256 + math.cos(a) * d, 256 + math.sin(a) * d
        c.ellipse((x - r, y - r, x + r, y + r), INK)
        c.d.line(c.s(256 + math.cos(a) * 60, 256 + math.sin(a) * 60, x, y), fill=INK, width=int(r * 0.9 * 2))
    out["turfFx/sw_cracks.png"] = c.done()

    # debris: a scrap of sticker paper
    c = Canvas(64, 64)
    c.poly([(8, 14), (54, 6), (58, 46), (16, 58)], INK)
    c.poly([(13, 18), (50, 11), (53, 42), (19, 52)], WHITE)
    c.poly([(20, 24), (45, 18), (47, 37), (24, 45)], SOD)
    out["turfFx/sw_debris.png"] = c.done()

    # sparkle: flat four-point star instead of a soft lens star
    c = Canvas(128, 128)
    star(c, 64, 64, 58, 14, WHITE, INK, None, points=4)
    out["turfFx/fx_star.png"] = c.done()


def star(c: Canvas, cx, cy, r_out, r_in, fill, line, core, points=8):
    def pts(k):
        res = []
        for i in range(points * 2):
            a = math.pi * i / points - math.pi / 2
            r = (r_out if i % 2 == 0 else r_in) * k
            res.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
        return res
    c.poly(pts(1.0), line)
    c.poly(pts(0.82), fill)
    if core:
        c.poly(pts(0.45), core)


def coin(out):
    """12-frame spinning coin: a flat orange token with a crown tag."""
    sheet = Image.new("RGBA", (128 * 12, 128), CLEAR)
    for i in range(12):
        k = abs(math.cos(math.pi * i / 12))
        c = Canvas(128, 128)
        rx = max(6, 52 * k)
        c.ellipse((64 - rx - 6, 6, 64 + rx + 6, 122), WHITE)
        c.ellipse((64 - rx - 1, 11, 64 + rx + 1, 117), INK)
        c.ellipse((64 - rx + 4, 16, 64 + rx - 4, 112), SOD if i < 6 or i > 9 else SOD_D)
        if k > 0.45:
            w = 30 * k
            c.poly([(64 - w, 80), (64 - w, 50), (64 - w * 0.5, 64), (64, 44), (64 + w * 0.5, 64), (64 + w, 50), (64 + w, 80)], INK)
        sheet.alpha_composite(c.done(), (i * 128, 0))
    out["turfCoin/coin_sheet.png"] = sheet
    out["turfCoin/coin.png"] = sheet.crop((0, 0, 128, 128))


def scenes(out):
    bg = Image.open(FRAME / "bg_base.png").convert("RGB").resize((1920, 1080), Image.LANCZOS)
    out["turfBackground/bg_base.png"] = bg
    # interim FG / Kingpin backgrounds: the same alley on a warmer and a sodium-washed paper
    a = np.asarray(bg, float)
    for name, tint, k in (("bg_feature", SOD_L, 0.10), ("bg_epic", SOD, 0.16)):
        t = a * (1 - k) + rgb(tint) * k
        out[f"turfBackground/{name}.png"] = Image.fromarray(t.clip(0, 255).astype(np.uint8))
    for name in ("bg_base_near", "bg_feature_near", "bg_epic_near"):
        out[f"turfBackground/{name}.png"] = Image.new("RGBA", (1920, 1080), CLEAR)

    # roller shutter halves: light slats, ink lines, the game's own stickers pasted on
    stickers = [Image.open(FRAME / f"{n}.png").convert("RGBA") for n in ("h1", "w", "l1", "sw")]
    for side in ("l", "r"):
        c = Canvas(1024, 1536, GREY_L)
        for y in range(0, 1536, 64):
            c.d.rectangle(c.s(0, y, 1024, y + 6), fill=GREY_M)
            c.d.rectangle(c.s(0, y + 44, 1024, y + 48), fill=GREY_D)
        # outer edge rail (inner edge must stay a clean straight cut)
        x0 = 0 if side == "l" else 984
        c.d.rectangle(c.s(x0, 0, x0 + 40, 1536), fill=GREY_D)
        c.d.rectangle(c.s(x0 + 12, 0, x0 + 28, 1536), fill=INK)
        rng = random.Random(1 if side == "l" else 2)
        picks = stickers[:2] if side == "l" else stickers[2:]
        for j, st in enumerate(picks):
            s = rng.randint(300, 380)
            im = st.resize((s * 2, s * 2), Image.LANCZOS).rotate(rng.uniform(-14, 14), resample=Image.BICUBIC, expand=True)
            iw = im.width // 2
            x = rng.randint(140, 1024 - 140 - iw) if side == "l" else rng.randint(60, 1024 - 200 - iw)
            y = 360 + j * 440 + rng.randint(-40, 40)
            c.paste(im, (x, y))
        tape(c, 512, 330, 420, 90, -6 if side == "l" else 5, SOD, 300 + (side == "r"))
        grain(c, 11 if side == "l" else 12, 4)
        out[f"turfFx/shutter_{side}.png"] = c.done()

    # padlock sticker, round composition centred
    c = Canvas(1024, 1024)
    c.d.arc(c.s(300, 150, 724, 600), 180, 360, fill=WHITE, width=150 * 2)
    c.d.arc(c.s(318, 168, 706, 582), 180, 360, fill=INK, width=114 * 2)
    c.d.arc(c.s(330, 180, 694, 570), 180, 360, fill=GREY_M, width=90 * 2)
    c.rrect((200, 360, 824, 880), 70, WHITE)
    c.rrect((222, 382, 802, 858), 54, INK)
    c.rrect((240, 400, 784, 840), 44, SOD)
    c.rrect((240, 760, 784, 840), 44, SOD_D)
    c.ellipse((462, 520, 562, 620), INK)
    c.poly([(490, 590), (534, 590), (548, 720), (476, 720)], INK)
    grain(c, 13, 3)
    out["turfFx/lock.png"] = c.done()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--install", action="store_true")
    a = ap.parse_args()
    out: dict[str, Image.Image] = {}
    symbols(out)
    frames(out)
    bruiser_fx(out)
    coin(out)
    scenes(out)
    for rel, im in out.items():
        p = OUT / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        im.save(p)
        if a.install:
            dst = SPRITES / rel
            bak = BACKUP / rel
            if dst.exists() and not bak.exists():
                bak.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(dst, bak)
            shutil.copy2(p, dst)
    print(f"{len(out)} files{' installed' if a.install else ''} -> {OUT}")


if __name__ == "__main__":
    main()
