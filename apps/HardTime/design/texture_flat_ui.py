"""Give Hard Time's flat vector UI the painted material its symbols already have.

Why: every UI plate, the feature titles, the logo, the big-win banners and the
four low-pay suits were flat fills of three colours (steel 151,158,162 / iron
18,20,21 / rust 132,70,37, plus tan 166,148,112 in the logo) next to painted
rusted-steel premiums — two styles on one screen, which is what Stake's "Low
quality assets" tag describes (Deadwood was rejected on it, 2026-09-26).

How: the SHAPES stay exactly as drawn (same canvas, same alpha, so every
anchor, inset measurement and hit area in the code is unchanged). Only the
FILL changes. Each flat colour is a region; each region gets a material made
from the game's own painted art:

  grunge   luminance of the painted cell-block wall at the centre of
           bg_base.jpg (840×480 of AI-painted weathered plaster/metal)
  specks   the rust-and-scratch surface of the strongbox symbol (h3.png)

  steel  → grunge gradient-mapped to weathered steel, rust specks soft-lit in
  iron   → the same, gradient-mapped dark
  rust   → the original rust colour modulated by grunge
  tan    → grunge mapped to aged brass (logo "TIME")
  inset  → the wall itself, darkened; its translucency is kept

then every region is bevelled from its own mask (light from top-left), so rims,
rivets and letters read as raised metal instead of flat vector.

usage: python3 design/texture_flat_ui.py [--preview OUT.png] [--write]
  default only previews; --write backs up originals to
  design/_legacy_assets/flat_ui_20260929/ (once) and overwrites in place.
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageOps

APP = Path(__file__).resolve().parent.parent
SPRITES = APP / "static/assets/sprites"
BACKUP = APP / "design/_legacy_assets/flat_ui_20260929"

TARGETS = [
    "hardTimeUi/buybonus_plate.png",
    "hardTimeUi/ticker_plate.png",
    "hardTimeUi/button_plate.png",
    "hardTimeUi/spin_plate.png",
    "hardTimeBoardFrame/frame_bg.png",
    "hardTimeBoardFrame/frame_edge.png",
    "hardTimeBoardFrame/fs_sign.png",
    "hardTimeBoardFrame/fs_counter_panel.png",
    "hardTimeWinBanners/big.png",
    "hardTimeWinBanners/superwin.png",
    "hardTimeWinBanners/mega.png",
    "hardTimeWinBanners/epic.png",
    "hardTimeWinBanners/max.png",
    "hardTimeSplash/title_lockdown.png",
    "hardTimeSplash/title_riot.png",
    "hardTimeSplash/title_breakout.png",
    "hardTimeBrand/logo.png",
    "hardTimeSymbols/l1.png",
    "hardTimeSymbols/l2.png",
    "hardTimeSymbols/l3.png",
    "hardTimeSymbols/l4.png",
]

SYMBOL_DIM = 0.76

PALETTE = {
    "steel": (151, 158, 162),
    "iron": (18, 20, 21),
    "rust": (132, 70, 37),
    "tan": (166, 148, 112),
    # the red suits (hearts, diamonds)
    "copper": (181, 137, 108),
}


def load_sources():
    wall = Image.open(SPRITES / "hardTimeBackground/bg_base.jpg").convert("RGB").crop((550, 320, 1310, 800))
    grunge = ImageOps.autocontrast(ImageOps.grayscale(wall), cutoff=1)
    h3 = Image.open(SPRITES / "hardTimeSymbols/h3.png").convert("RGB")
    a = h3.crop((95, 290, 185, 372))
    b = h3.crop((250, 300, 336, 368)).resize(a.size)
    speck = Image.new("RGB", (a.width * 2, a.height * 2))
    speck.paste(a, (0, 0))
    speck.paste(ImageOps.mirror(b), (a.width, 0))
    speck.paste(ImageOps.flip(b), (0, a.height))
    speck.paste(ImageOps.mirror(ImageOps.flip(a)), (a.width, a.height))
    # Texture only, no darkening: stretch, then pull toward mid-grey so a
    # soft-light pass adds scratches and rust flecks around 128 instead of
    # dimming everything it touches (the first pass came out near-black).
    speck = ImageOps.autocontrast(speck, cutoff=2)
    speck = Image.blend(Image.new("RGB", speck.size, (128, 128, 128)), speck, 0.55)
    return wall, grunge, speck


def cover(img: Image.Image, size: tuple[int, int], scale: float = 1.0) -> Image.Image:
    """Resize to cover `size` (optionally larger grain), centre-crop."""
    w, h = size
    s = max(w / img.width, h / img.height) * scale
    r = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.Resampling.LANCZOS)
    x, y = (r.width - w) // 2, (r.height - h) // 2
    return r.crop((x, y, x + w, y + h))


def tile(img: Image.Image, size: tuple[int, int], scale: float) -> Image.Image:
    t = img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.Resampling.LANCZOS)
    out = Image.new("RGB", size)
    for y in range(0, size[1], t.height):
        for x in range(0, size[0], t.width):
            flip = ((x // t.width) + (y // t.height)) % 2
            out.paste(ImageOps.mirror(t) if flip else t, (x, y))
    return out


def gradient_map(gray: Image.Image, stops: list[tuple[float, tuple[int, int, int]]]) -> Image.Image:
    lut = []
    for ch in range(3):
        for v in range(256):
            t = v / 255
            for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
                if t0 <= t <= t1:
                    k = (t - t0) / (t1 - t0) if t1 > t0 else 0
                    lut.append(round(c0[ch] + (c1[ch] - c0[ch]) * k))
                    break
    return Image.merge("RGB", [gray] * 3).point(lut)


def region_masks(src: Image.Image) -> dict[str, Image.Image]:
    """Soft membership of each flat colour, from the un-premultiplied source."""
    w, h = src.size
    px = src.load()
    masks = {k: Image.new("L", (w, h)) for k in (*PALETTE, "inset")}
    mp = {k: m.load() for k, m in masks.items()}
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if a < 250 and max(r, g, b) < 70:
                mp["inset"][x, y] = 255
                continue
            best, bd = None, 1e9
            for k, (pr, pg, pb) in PALETTE.items():
                d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
                if d < bd:
                    best, bd = k, d
            if best == "iron" and max(r, g, b) > 45:
                # anti-aliased steel/rust edge on iron: split by brightness
                best = "steel" if abs(r - b) < 20 else "rust"
            mp[best][x, y] = 255
    return masks


def bevel(mask: Image.Image, radius: float, depth: int, strength: float) -> Image.Image:
    """Grey shading layer (128 = no change) lit from the top-left."""
    hmap = mask.filter(ImageFilter.GaussianBlur(radius))
    lit = ImageChops.subtract(ImageChops.offset(hmap, depth, depth), ImageChops.offset(hmap, -depth, -depth))
    shade = ImageChops.subtract(ImageChops.offset(hmap, -depth, -depth), ImageChops.offset(hmap, depth, depth))
    base = Image.new("L", mask.size, 128)
    out = ImageChops.add(base, lit.point(lambda v: min(255, int(v * strength))))
    out = ImageChops.subtract(out, shade.point(lambda v: min(255, int(v * strength))))
    return out


def texture(path: Path, sources) -> Image.Image:
    wall, grunge, speck = sources
    # Always from the flat original: once --write has run, the file in
    # static/ is textured and its colours no longer classify.
    rel = path.relative_to(SPRITES)
    src = Image.open(BACKUP / rel if (BACKUP / rel).exists() else path).convert("RGBA")
    w, h = src.size
    ref = min(w, h)
    masks = region_masks(src)

    # grain scaled to the element, so a 256px button and a 1280px sign get the
    # same apparent grain on screen rather than the same pixels
    g = cover(grunge, (w, h), scale=max(1.0, 700 / max(w, h)))
    g_fine = cover(grunge, (w, h), scale=max(1.6, 1300 / max(w, h)))
    sp = tile(speck, (w, h), scale=max(0.6, ref / 520))

    # weathered, not polished: the premiums are dark rusted steel, and a
    # bright chrome rim read as a different material from them
    steel = gradient_map(g, [(0, (72, 72, 68)), (0.4, (122, 122, 116)), (0.8, (166, 162, 152)), (1, (204, 194, 176))])
    steel = ImageChops.soft_light(steel, sp)
    iron = gradient_map(g_fine, [(0, (14, 15, 16)), (0.6, (40, 42, 43)), (1, (82, 80, 74))])
    iron = ImageChops.soft_light(iron, sp)
    rust_base = Image.new("RGB", (w, h), PALETTE["rust"])
    rust = ImageChops.multiply(rust_base, gradient_map(g_fine, [(0, (150, 150, 150)), (1, (255, 240, 225))]))
    rust = ImageChops.soft_light(rust, sp)
    tan = gradient_map(g, [(0, (96, 78, 48)), (0.5, (160, 136, 92)), (1, (214, 190, 140))])
    tan = ImageChops.soft_light(tan, sp)
    copper = gradient_map(g, [(0, (108, 58, 36)), (0.45, (168, 102, 66)), (0.8, (206, 150, 108)), (1, (232, 190, 150))])
    copper = ImageChops.soft_light(copper, sp)
    inset = ImageChops.multiply(cover(wall, (w, h)), Image.new("RGB", (w, h), (120, 118, 112)))

    out = Image.new("RGB", (w, h), (0, 0, 0))
    for name, mat in (("iron", iron), ("inset", inset), ("rust", rust), ("steel", steel), ("tan", tan), ("copper", copper)):
        out = Image.composite(mat, out, masks[name])

    # raised metal: rims, rivets and letters catch light on their top-left
    # edges; the inset sits below the rim (inner shadow)
    raised = masks["steel"]
    for k in ("tan", "rust", "copper"):
        raised = ImageChops.lighter(raised, masks[k])
    r = max(1.0, ref / 260)
    shade = bevel(raised, radius=r * 1.4, depth=max(1, round(r)), strength=1.6)
    out = ImageChops.overlay(out, Image.merge("RGB", [shade] * 3))
    # inner shadow: the band just inside the inset's edge, where the rim
    # overhangs it
    edge = ImageChops.subtract(masks["inset"], masks["inset"].filter(ImageFilter.GaussianBlur(r * 5)))
    edge = edge.point(lambda v: min(255, v * 3))
    out = Image.composite(ImageChops.multiply(out, Image.new("RGB", (w, h), (60, 60, 60))), out, edge)

    if "hardTimeSymbols" in str(rel):
        # Low-pay suits sit one step below the premiums: design/check_symbol_weight.py
        # fails any L whose brightest 15% out-contrasts the dimmest H on the board
        # plate. The bevel highlights alone put the steel suits at ~11:1 against
        # H3's 6.75:1, so the suits are dimmed as a whole — shading kept.
        out = out.point(lambda v: int(v * SYMBOL_DIM))

    result = out.convert("RGBA")
    result.putalpha(src.getchannel("A"))
    return result


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview")
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--only", nargs="*")
    args = ap.parse_args()
    sources = load_sources()
    todo = [t for t in TARGETS if not args.only or any(o in t for o in args.only)]
    done = []
    for rel in todo:
        path = SPRITES / rel
        img = texture(path, sources)
        done.append((rel, img))
        if args.write:
            backup = BACKUP / rel
            if not backup.exists():
                backup.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(path, backup)
            img.save(path, optimize=True)
        print(("wrote " if args.write else "ok    ") + rel)
    if args.preview:
        cell = 320
        cols = 4
        rows = (len(done) + cols - 1) // cols
        sheet = Image.new("RGB", (cell * cols, cell * rows), (70, 66, 60))
        for i, (rel, img) in enumerate(done):
            im = img.copy()
            im.thumbnail((cell - 12, cell - 12))
            bg = Image.new("RGBA", (cell, cell), (70, 66, 60, 255))
            bg.alpha_composite(im, ((cell - im.width) // 2, (cell - im.height) // 2))
            sheet.paste(bg.convert("RGB"), ((i % cols) * cell, (i // cols) * cell))
        sheet.save(args.preview)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
