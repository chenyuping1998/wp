#!/usr/bin/env python3
"""Turn painted source art into game-ready symbol sprites.

Reads `design/source/<key>.png`, keys out the flat chroma background, trims to
the subject, squares it with an even margin, and writes 512x512 straight-alpha
PNGs to a STAGING folder — `design/_painted/`.

    python design/process_source_art.py --all
    python design/process_source_art.py h3 --key-colour 00FF00
    python design/process_source_art.py --all --install     # only when happy

Nothing goes near `static/assets/` without `--install`, and `--install`
refuses to run unless `design/_backup_pre_rebuild/` exists, because the
procedural generator that produced the currently-shipped art cannot recreate
a previous state once overwritten.

After staging, judge the result the only way that means anything here:

    python design/contact_sheet.py

which renders the registry at the true 105px reel cell on the board's own
RGB(40,10,66). Reviewing symbol art at 512px on white is how this project got
a set whose lowest-paying symbol was its loudest object.
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.exit("PIL missing — design/ needs the anaconda python, not system python3.")

DESIGN = Path(__file__).resolve().parent
SOURCE = DESIGN / "source"
STAGE = DESIGN / "_painted"
BACKUP = DESIGN / "_backup_pre_rebuild"
SHIPPED = DESIGN.parent / "static/assets/sprites/hotMiamiSymbols"

OUT_PX = 512
MARGIN = 0.04  # fraction of the square left clear on every side

KEYS = ["h1", "h2", "h3", "h4", "h5", "w", "s", "c"]


def key_out(im: Image.Image, key_rgb: tuple[int, int, int], tol: int) -> Image.Image:
    """Flood the chroma background to transparent, from the edges inward.

    Edge-seeded rather than global so that a legitimate use of the key colour
    *inside* the subject is not punched out. Model output is never perfectly
    flat, hence the tolerance.
    """
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    kr, kg, kb = key_rgb

    def is_key(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        return a > 0 and abs(r - kr) <= tol and abs(g - kg) <= tol and abs(b - kb) <= tol

    stack = [(x, y) for x in range(w) for y in (0, h - 1)]
    stack += [(x, y) for y in range(h) for x in (0, w - 1)]
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

    # Soft edge. A binary flood fill is fine for a hard-edged subject, but a
    # NEON GLOW is semi-transparent over the chroma, so its surviving pixels are
    # a pink/green blend that reads as a dirty khaki halo — clearly visible on
    # the tile even after despill, because r≈g≈b there and clamping one channel
    # cannot recover it. Ramp alpha by distance from the key colour instead, so
    # the glow fades out the way it was actually painted.
    band = tol * 3
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            d = max(abs(r - kr), abs(g - kg), abs(b - kb))
            if d < band:
                px[x, y] = (r, g, b, int(a * (d / band) ** 2))
    return im


def despill(im: Image.Image) -> Image.Image:
    """Clamp the key channel where it dominates — removes the olive fringe.

    Keying a soft glow off green leaves the green mixed *into* the surviving
    edge pixels, which reads as a dirty khaki outline. Standard despill: where
    green exceeds both neighbours, pull it down to the larger of them.

    DO NOT run this on a legitimately green subject — h5 is a lime car and this
    would eat it. Hence opt-in.
    """
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            cap = max(r, b)
            if g > cap:
                px[x, y] = (r, cap, b, a)
    return im


def square_and_fit(im: Image.Image) -> Image.Image:
    box = im.getbbox()
    if box is None:
        sys.exit("image is fully transparent after keying — wrong --key-colour?")
    im = im.crop(box)
    inner = int(OUT_PX * (1 - 2 * MARGIN))
    im.thumbnail((inner, inner), Image.LANCZOS)
    canvas = Image.new("RGBA", (OUT_PX, OUT_PX), (0, 0, 0, 0))
    canvas.paste(im, ((OUT_PX - im.width) // 2, (OUT_PX - im.height) // 2), im)
    return canvas


def coverage(im: Image.Image) -> float:
    a = im.getchannel("A")
    hist = a.histogram()
    return 100.0 * sum(hist[128:]) / (im.width * im.height)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("keys", nargs="*")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--key-colour", default="00FF00", help="chroma background, hex without #")
    ap.add_argument("--tol", type=int, default=60, help="per-channel match tolerance")
    ap.add_argument("--install", action="store_true", help="copy staged art over the shipped symbols")
    ap.add_argument(
        "--despill",
        action="store_true",
        help="suppress green fringing on the surviving edge pixels. Do NOT use on "
        "a green subject (h5 is a lime car).",
    )
    ap.add_argument(
        "--tile",
        action="store_true",
        help="process design/source/tile_foreground.png at 1024 for the store tile "
        "instead of the 512 symbol pipeline",
    )
    args = ap.parse_args()

    hexs = args.key_colour.lstrip("#")
    key_rgb = tuple(int(hexs[i : i + 2], 16) for i in (0, 2, 4))

    if args.tile:
        # Stake's Tile Editor lays its own gradient between the Background Image
        # and the Foreground Element, so the foreground MUST carry real alpha.
        # A file with no transparent pixels covers the background entirely — and
        # that is precisely how a raw green-screen render shipped once.
        src = SOURCE / "tile_foreground.png"
        if not src.exists():
            sys.exit(f"no {src} — put the painted hero there first")
        im = key_out(Image.open(src), key_rgb, args.tol)
        if args.despill:
            im = despill(im)
        box = im.getbbox()
        if box is None:
            sys.exit("fully transparent after keying — wrong --key-colour?")
        im = im.crop(box)
        side = 1024
        inner = int(side * 0.92)
        im.thumbnail((inner, inner), Image.LANCZOS)
        canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
        STAGE.mkdir(parents=True, exist_ok=True)
        out = STAGE / "tile_foreground.png"
        canvas.save(out)
        # Measure a < 16, not a == 0. A soft neon glow sitting on the chroma
        # leaves a faint non-zero alpha after keying, so counting only exact
        # zeros understates the cut-out badly and cries wolf on a good result.
        hist = canvas.getchannel("A").histogram()
        clear = 100.0 * sum(hist[:16]) / (side * side)
        print(f"tile: staged {out.relative_to(DESIGN.parent)}  effectively clear {clear:.1f}%")
        if clear < 40:
            print("WARNING: very little transparency — the key probably did not take.")
        if args.install:
            dst = DESIGN.parent / "static/assets/sprites/hotMiamiBrand/tile_foreground.png"
            shutil.copy2(out, dst)
            print(f"tile: installed to {dst.relative_to(DESIGN.parent)}")
        else:
            print("Staged only. Re-run with --install to ship.")
        return

    keys = KEYS if args.all else args.keys
    if not keys:
        ap.error("give symbol keys or --all")

    STAGE.mkdir(parents=True, exist_ok=True)
    done = []
    for key in keys:
        # Gemini only emits JPEG; hand-supplied art may be PNG.
        src = next((SOURCE / f"{key}{e}" for e in (".jpg", ".jpeg", ".png")
                    if (SOURCE / f"{key}{e}").exists()), None)
        if src is None:
            print(f"{key}: no {key}.(jpg|png) in design/source — skipped")
            continue
        keyed = key_out(Image.open(src), key_rgb, args.tol)
        if args.despill:
            if key == "h5":
                print("h5: skipping --despill, the car is legitimately green")
            else:
                keyed = despill(keyed)
        im = square_and_fit(keyed)
        out = STAGE / f"{key}.png"
        im.save(out)
        done.append(key)
        print(f"{key}: staged {out.relative_to(DESIGN.parent)}  ink {coverage(im):.1f}% of cell")

    if not done:
        sys.exit("nothing processed")

    print(
        "\nInk coverage should land near 60-80% — that is Hacksaw's range and what "
        "the current procedural premiums hit (79-80%). Much below and the symbol "
        "has no mass at reel size."
    )

    if not args.install:
        print("\nStaged only. Review, then re-run with --install to ship.")
        return

    if not BACKUP.exists():
        sys.exit(
            "refusing to --install: design/_backup_pre_rebuild/ is missing. That "
            "backup is the only way back to the current art, because the generator "
            "state that produced it is not recoverable."
        )
    for key in done:
        shutil.copy2(STAGE / f"{key}.png", SHIPPED / f"{key}.png")
        print(f"{key}: installed to static/assets/sprites/hotMiamiSymbols/")
    print(
        "\nNow: python design/contact_sheet.py   (judge at 105px on RGB(40,10,66))\n"
        "Then: pnpm --filter hot-miami build    (three gates)\n"
        "Asset keys are unchanged, so no src/ edit is needed — but note that\n"
        "check_sprite_keys.mjs cannot see the symbols' dynamic keys either way."
    )


if __name__ == "__main__":
    main()
