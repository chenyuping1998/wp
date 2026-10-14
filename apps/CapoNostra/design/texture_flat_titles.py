"""Give Capo Nostra's flat logo and feature titles the painted gold the UI has.

Why: capoBrand/logo.png and capoSplash/title_{soldier,capo,don}.png were three
flat fills (gold 201,162,39 / cream 230,223,209 / dark 20,16,13) — the only
un-painted lettering in a game whose plates, rings and ornaments are painted
brass. Stake's "Low quality assets" tag names exactly this; the review-tag
checker (game-reskin scripts/check_review_tags.py) flags it as flat-fill art.

How (same method as HardTime/design/texture_flat_ui.py): the SHAPES stay as
drawn — same canvas, same alpha — and each flat colour is re-filled with a
material taken from this game's own painted art:

  gold   the brass of the spin-button ring (capoUiPlates/spin_plate.png),
         tiled, over a large-scale grunge from bg_base.png so it never repeats
  cream  ivory with the same grain, faint
  dark   the ring's dark lacquer well

then bevelled from its own mask, light from the top-left.

usage: python3 design/texture_flat_titles.py [--preview OUT.png] [--write]
  --write backs the flat originals up to design/_legacy_assets/flat_titles_20260929/
  (once) and always reads from there, so it can be re-run.
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageOps

APP = Path(__file__).resolve().parent.parent
SPRITES = APP / "static/assets/sprites"
BACKUP = APP / "design/_legacy_assets/flat_titles_20260929"

TARGETS = [
    "capoBrand/logo.png",
    "capoSplash/title_soldier.png",
    "capoSplash/title_capo.png",
    "capoSplash/title_don.png",
]

PALETTE = {
    "gold": (201, 162, 39),
    "cream": (230, 223, 209),
    "dark": (20, 16, 13),
}


def load_sources():
    ring = Image.open(SPRITES / "capoUiPlates/spin_plate.png").convert("RGB")
    band = ring.crop((44, 120, 84, 200))  # left side of the ring, near-flat
    band = ImageOps.autocontrast(band, cutoff=1)
    gold_tile = Image.new("RGB", (band.width * 2, band.height * 2))
    gold_tile.paste(band, (0, 0))
    gold_tile.paste(ImageOps.mirror(band), (band.width, 0))
    gold_tile.paste(ImageOps.flip(band), (0, band.height))
    gold_tile.paste(ImageOps.mirror(ImageOps.flip(band)), (band.width, band.height))
    well = ring.crop((170, 170, 340, 340))
    bg = Image.open(SPRITES / "capoBackground/bg_base.png").convert("RGB")
    grunge = ImageOps.autocontrast(ImageOps.grayscale(bg), cutoff=1)
    return gold_tile, well, grunge


def cover(img, size, scale=1.0):
    w, h = size
    s = max(w / img.width, h / img.height) * scale
    r = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.Resampling.LANCZOS)
    x, y = (r.width - w) // 2, (r.height - h) // 2
    return r.crop((x, y, x + w, y + h))


def tile(img, size, scale):
    t = img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.Resampling.LANCZOS)
    out = Image.new("RGB", size)
    for y in range(0, size[1], t.height):
        for x in range(0, size[0], t.width):
            out.paste(t, (x, y))
    return out


def gradient_map(gray, stops):
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


def region_masks(src):
    w, h = src.size
    px = src.load()
    masks = {k: Image.new("L", (w, h)) for k in PALETTE}
    mp = {k: m.load() for k, m in masks.items()}
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            best = min(PALETTE, key=lambda k: sum((c - p) ** 2 for c, p in zip((r, g, b), PALETTE[k])))
            mp[best][x, y] = 255
    return masks


def bevel(mask, radius, depth, strength):
    hmap = mask.filter(ImageFilter.GaussianBlur(radius))
    lit = ImageChops.subtract(ImageChops.offset(hmap, depth, depth), ImageChops.offset(hmap, -depth, -depth))
    shade = ImageChops.subtract(ImageChops.offset(hmap, -depth, -depth), ImageChops.offset(hmap, depth, depth))
    out = ImageChops.add(Image.new("L", mask.size, 128), lit.point(lambda v: min(255, int(v * strength))))
    return ImageChops.subtract(out, shade.point(lambda v: min(255, int(v * strength))))


def texture(rel: str, sources) -> Image.Image:
    gold_tile, well, grunge = sources
    src = Image.open(BACKUP / rel if (BACKUP / rel).exists() else SPRITES / rel).convert("RGBA")
    w, h = src.size
    masks = region_masks(src)
    g = cover(grunge, (w, h), scale=1.4)

    # brass: the ring's own grain, lifted into the logo's gold range and
    # modulated by a big, non-repeating grunge so no tile edge shows
    grain = tile(gold_tile, (w, h), scale=max(1.0, h / 180))
    base = gradient_map(g, [(0, (122, 88, 22)), (0.5, (198, 158, 52)), (1, (246, 214, 120))])
    gold = ImageChops.soft_light(base, grain)
    cream = gradient_map(g, [(0, (196, 186, 164)), (0.6, (230, 222, 204)), (1, (248, 242, 228))])
    dark = ImageChops.multiply(cover(well, (w, h)), Image.new("RGB", (w, h), (150, 140, 130)))

    out = Image.new("RGB", (w, h))
    for name, mat in (("dark", dark), ("cream", cream), ("gold", gold)):
        out = Image.composite(mat, out, masks[name])
    raised = ImageChops.lighter(masks["gold"], masks["cream"])
    r = max(1.0, min(w, h) / 200)
    shade = bevel(raised, radius=r * 1.3, depth=max(1, round(r)), strength=1.8)
    out = ImageChops.overlay(out, Image.merge("RGB", [shade] * 3))

    result = out.convert("RGBA")
    result.putalpha(src.getchannel("A"))
    return result


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview")
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()
    sources = load_sources()
    done = []
    for rel in TARGETS:
        img = texture(rel, sources)
        done.append(img)
        if args.write:
            backup = BACKUP / rel
            if not backup.exists():
                backup.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(SPRITES / rel, backup)
            img.save(SPRITES / rel, optimize=True)
        print(("wrote " if args.write else "ok    ") + rel)
    if args.preview:
        cell_w, cell_h = 600, 240
        sheet = Image.new("RGB", (cell_w * 2, cell_h * 2), (44, 22, 24))
        for i, img in enumerate(done):
            im = img.copy()
            im.thumbnail((cell_w - 10, cell_h - 10))
            sheet.paste(im, ((i % 2) * cell_w + (cell_w - im.width) // 2, (i // 2) * cell_h + (cell_h - im.height) // 2), im)
        sheet.save(args.preview)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
