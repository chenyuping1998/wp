"""Import a generated symbol pack into the game's sprite directory.

Generated art never arrives in the shape the game needs. This pack came as a mix
of 1024x1031 JPEGs, 1024x1024 JPEGs and two ~410px PNGs, several megabytes each.
The game needs square 1024x1024 PNGs of a sane size, so the conversion is
mechanical and belongs in a script rather than in someone's memory of what they
clicked in an image editor.

What it does, and why each step is here rather than assumed:

  * SQUARE. The 1024x1031 files are 7px taller than they are wide. Left alone,
    every one of those symbols would sit 3px high in its cell relative to the
    square ones, which is exactly the kind of misalignment nobody can name but
    everybody can see. Cropped from the centre rather than squashed.
  * 1024x1024, because that is the size the game's asset registry expects.
    Anything arriving smaller is REPORTED rather than silently passed, since
    upscaling a 500px source produces a 1024px file that is still a 500px
    picture and it is better to know.

    That report is INFORMATION, NOT A BLOCKER. An earlier version of this file
    claimed certification returned gen-2 for "low quality asset" because of
    symbol resolution; that was my inference and it is wrong — the two are
    unrelated. The only test that decides whether art needs regenerating is
    whether it reads at the size the game actually draws it (140px here).
  * PNG, optimised. The sources total ~41 MB. They are opaque framed tiles, so
    the alpha channel is dropped where it is fully opaque and the palette is
    left to PNG's own filtering.

Usage:  python design/import_symbols.py <source-dir> [--apply]

Without --apply it only reports. Nothing is overwritten until asked.
"""

import os
import shutil
import sys

from PIL import Image

TARGET = 1024
HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)
DEST = os.path.join(APP, "static/assets/sprites/goBananasSymbolsV3")

# Source stem -> destination file. The game's asset registry names these, so the
# mapping is fixed by src/game/assets.ts, not by whatever the generator called
# its output.
MAPPING = {
    "b": "b.png",
    "h1": "h1.png",
    "h2": "h2.png",
    "h3": "h3.png",
    "h4": "h4.png",
    "l1": "l1.png",
    "l2": "l2.png",
    "l3": "l3.png",
    "l4": "l4.png",
    "l5": "l5.png",
    "s": "s.png",
    "w": "w.png",
}


def load(path):
    img = Image.open(path)
    img.load()
    return img


def to_tile(img, source_px=None):
    """Centre-crop to square, then resize to TARGET. Returns (image, note).

    `source_px` is the size of the ORIGINAL file, before any frame crop. The
    low-resolution warning is about what the generator produced, not about a
    crop this script chose to make — conflating the two made h2-h4 report as
    under-resolution when their sources were a full 1024.
    """
    w, h = img.size
    note = ""
    if w != h:
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        img = img.crop((left, top, left + side, top + side))
        note = f"cropped {w}x{h} -> {side}x{side}"
        w = h = side

    # TARGET IS A CEILING, NOT A SIZE.
    #
    # A tile that comes out of the frame crop at 902px used to be resampled back
    # up to 1024, which invents no detail and costs a resampling pass — the high
    # symbols were visibly softer than the royals, which are never cropped. Now
    # anything at or under the ceiling is left exactly as it is and only
    # oversized art is brought down.
    origin = source_px if source_px is not None else w
    if origin < TARGET:
        note = (note + "; " if note else "") + f"source {origin}px, under the {TARGET} ceiling (FYI)"
    elif w > TARGET:
        note = (note + "; " if note else "") + f"downscaled from {w}px"

    if w > TARGET:
        img = img.resize((TARGET, TARGET), Image.LANCZOS)
    return img, note


# --- per-symbol plate colour correction ------------------------------------
#
# The generator did not hold the inner plate colour steady across the set. h1's
# plate came out at #383E27 against #415134 for h2/h3/h4/m — darker and browner,
# which is small in isolation and obvious once the symbols sit side by side on a
# reel.
#
# Corrected here rather than in an image editor so that re-importing a symbol
# cannot silently undo it, and so the target is a number someone can check.
#
# The shift is WEIGHTED BY COLOUR DISTANCE rather than masked. A hard mask needs
# the subject cut out of the plate, and the helmet carries mossy patches that are
# genuinely plate-coloured; a weight that falls off with distance moves the plate
# fully, the moss slightly (which is right — it should match the plate), and
# leaves steel, leather and the red star essentially untouched.
# Re-measured on the CROPPED tiles. The framed-tile figure (65, 81, 53) was
# sampled at coordinates that no longer point at the same part of the picture.
# Mine slate, #3A362C. gen-3's was a rainforest moss green (65, 77, 52) and
# would read as off-theme against coal and rusted iron.
#
# PLATE_FIX names the tiles whose plate is pulled toward this. It is empty
# because the prompt set (design/SYMBOL_PROMPTS.md) specifies the colour to the
# generator, which is where it should be fixed — gen-3 had to correct h1 here
# because its plate came back a different colour from the other three, and a
# correction applied after the fact can only ever approximate.
#
# Put a stem in here if one comes back off-colour anyway.
PLATE_TARGET = (58, 54, 44)
PLATE_FIX: set[str] = set()
# Inner plate bounds in the 1024 tile, with a feathered edge so the correction
# does not stop on a visible line inside the stone frame.
PLATE_BOX = (180, 180, 845, 845)
PLATE_FEATHER = 30
# How far a pixel's colour may sit from the plate colour before the shift stops
# reaching it. 45 keeps the helmet's steel and the red star out of it.
PLATE_SIGMA = 45.0

# --- frame crop -------------------------------------------------------------
#
# The generated tiles carry a heavy ornate stone frame, and on a 4x5 board at
# 140px a cell the subject inside it ends up small enough that H1 and H2 are
# hard to tell apart in motion. Cropping the frame away and rescaling gives the
# subject the whole cell.
#
# The HIGH symbols, the Wild and the Scatter are cropped. The royals keep their
# frames on purpose: with the specials frameless and the royals plated, rank is
# legible at a glance from the tile shape alone, which is what the size
# difference used to do in gen-1 before the art went opaque.
#
# Cropped symbols also render at HIGH_SYMBOL_SIZE / SPECIAL_SYMBOL_SIZE (0.88)
# rather than 1, so their art has air around it. At 1 a frameless tile runs edge
# to edge and touches its neighbour with nothing between them.
#
# 0.06, measured on THIS pack by cropping at 0, 6, 8 and 10 percent and looking
# at the result (design/source/_framecrop.png).
#
# It was 0.16, which was right for gen-3's heavy ornate stone frame and is a
# disaster on this one's thin riveted metal edge: at 16% the gorilla lost the top
# of his hard hat, both pick heads were cut off, and the dynamite lost the arcing
# lit fuse — which is the entire reason that symbol's outline is distinguishable
# from the Scatter.
#
# 6% clears the frame with air to spare. 10% is already touching the helmet and
# the fuse spark, so this is not a number to nudge upward without looking again.
FRAME_CROP = 0.06
FRAME_CROP_SYMBOLS = {"h1", "h2", "h3", "h4", "s", "w", "b"}


def crop_frame(img, fraction=FRAME_CROP):
    w, h = img.size
    inset = int(round(min(w, h) * fraction))
    return img.crop((inset, inset, w - inset, h - inset))


def plate_median(img, boxes=((195, 195, 275, 275), (750, 195, 830, 275),
                             (195, 750, 275, 830), (750, 750, 830, 830))):
    import statistics
    px = []
    for b in boxes:
        px += list(img.convert("RGB").crop(b).get_flattened_data())
    return tuple(int(statistics.median(p[i] for p in px)) for i in range(3))


def match_plate(img, target=PLATE_TARGET):
    """Pull the inner plate toward `target`, leaving the subject alone."""
    import math

    rgb = img.convert("RGB")
    src = plate_median(rgb)
    delta = [target[i] - src[i] for i in range(3)]
    if max(abs(d) for d in delta) < 2:
        return img, src, src

    px = rgb.load()
    x0, y0, x1, y1 = PLATE_BOX
    inv2sig2 = 1.0 / (2.0 * PLATE_SIGMA * PLATE_SIGMA)
    for y in range(y0, y1):
        # feather vertically
        fy = min(1.0, (y - y0) / PLATE_FEATHER, (y1 - y) / PLATE_FEATHER)
        for x in range(x0, x1):
            fx = min(1.0, (x - x0) / PLATE_FEATHER, (x1 - x) / PLATE_FEATHER)
            edge = max(0.0, min(fx, fy))
            if edge <= 0:
                continue
            r, g, b = px[x, y]
            d2 = (r - src[0]) ** 2 + (g - src[1]) ** 2 + (b - src[2]) ** 2
            w = edge * math.exp(-d2 * inv2sig2)
            if w < 0.01:
                continue
            px[x, y] = (
                max(0, min(255, int(r + delta[0] * w))),
                max(0, min(255, int(g + delta[1] * w))),
                max(0, min(255, int(b + delta[2] * w))),
            )
    return rgb, src, plate_median(rgb)


def save(img, path):
    if img.mode == "RGBA":
        alpha = img.getchannel("A")
        # A framed tile is opaque; keeping a dead alpha channel costs a third
        # more file for nothing.
        if alpha.getextrema() == (255, 255):
            img = img.convert("RGB")
    else:
        img = img.convert("RGB")
    img.save(path, "PNG", optimize=True)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src_dir = sys.argv[1]
    apply_changes = "--apply" in sys.argv

    found = {}
    for name in os.listdir(src_dir):
        stem, ext = os.path.splitext(name)
        if ext.lower() in (".png", ".jpg", ".jpeg", ".webp"):
            found[stem.lower()] = os.path.join(src_dir, name)

    missing = [k for k in MAPPING if k not in found]
    extra = [k for k in found if k not in MAPPING]

    print(f"source: {src_dir}")
    print(f"dest:   {DEST}")
    print(f"mode:   {'APPLY' if apply_changes else 'dry run (pass --apply to write)'}\n")

    print(f"{'symbol':<8}{'source':<26}{'result':<14}{'size':>9}   notes")
    print("-" * 92)

    problems = []
    total_before = total_after = 0
    for stem, dest_name in MAPPING.items():
        if stem not in found:
            print(f"{stem:<8}{'— MISSING —':<26}")
            continue
        src = found[stem]
        before = os.path.getsize(src)
        img = load(src)
        source_px = min(img.size)
        if stem in FRAME_CROP_SYMBOLS:
            before_size = img.size
            img = crop_frame(img)
            note_crop = f"frame cropped {before_size[0]}px -> {img.size[0]}px"
        else:
            note_crop = ""
        img, note = to_tile(img, source_px=source_px)
        if note_crop:
            note = (note_crop + "; " + note) if note else note_crop
        if stem in PLATE_FIX:
            img, was, now = match_plate(img)
            note = (note + "; " if note else "") + (
                f"plate #{was[0]:02X}{was[1]:02X}{was[2]:02X}"
                f" -> #{now[0]:02X}{now[1]:02X}{now[2]:02X}"
            )
        dest = os.path.join(DEST, dest_name)

        if apply_changes:
            save(img, dest)
            after = os.path.getsize(dest)
        else:
            tmp = dest + ".probe"
            save(img, tmp)
            after = os.path.getsize(tmp)
            os.remove(tmp)

        total_before += before
        total_after += after
        if "FYI)" in note:
            problems.append(stem)
        print(
            f"{stem:<8}{os.path.basename(src):<26}{f'{img.width}x{img.height}':<14}"
            f"{after/1024:8.0f}K   {note}"
        )

    print(f"\n{total_before/1024/1024:.1f} MB in -> {total_after/1024/1024:.1f} MB out")

    if missing:
        print(f"\nMISSING from the pack: {', '.join(missing)}")
        print("  Those symbols keep whatever is already in the game directory.")
    if extra:
        print(f"\nIgnored (no slot in the asset registry): {', '.join(sorted(extra))}")
    if problems:
        print(f"\nBelow the {TARGET}px ceiling in the source: {', '.join(problems)}")
        print("  Informational, not a blocker. Judge these by whether they read at")
        print("  the size the game draws them, not by the number.")


if __name__ == "__main__":
    main()
