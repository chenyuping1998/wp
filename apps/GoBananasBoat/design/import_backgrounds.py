"""Import generated background art into the game's sprite directory.

The game does NOT letterbox a background. Background.svelte stretches the sprite
to the canvas at 1.08 overscan, and the canvas is the player's window — so the
art is always distorted by whatever the window's aspect happens to be. There is
no aspect that is universally correct; the one to design against is 16:9, which
is what the previous assets were and what most desktop windows are.

This pack arrived at 1584x672, which is 2.36:1. Stretched to 16:9 that is a 33%
vertical stretch: on foliage it is survivable, but both of these paintings put a
COILED ROPE on the left branch, and a circle stretched by a third reads as an
error rather than as a style. So the width is centre-cropped to 16:9 instead.

The crop is symmetric on purpose. Each painting is composed around a dark hole
in the middle that the reels sit in, and moving that hole off-centre to save
edge detail would cost more than the detail is worth. What the crop removes at
these proportions is 195px of dark filler on each side; the composed elements
(the buttress trunk, the mossy branch, the rope) start further in than that.

Usage:  python design/import_backgrounds.py <source-dir> [--apply]

Without --apply it only reports and writes the check sheet. Nothing is
overwritten until asked.
"""

import os
import sys

from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)
DEST = os.path.join(APP, "static/assets/sprites/goBananasBackground")

TARGET = (1920, 1080)
ASPECT = TARGET[0] / TARGET[1]

# Source stem -> destination file. Named by src/game/assets.ts, not by whatever
# the generator called its output — this pack arrived as "bg_base.png.jpg".
MAPPING = {
    "bg_base": "bg_base.png",
    "bg_feature": "bg_feature.png",
    "bg_holdandspin": "bg_holdandspin.png",
}

# The reels and their housing cover roughly this much of the canvas, and the
# mascot stands in the right-hand margin. Art inside the quiet box is not seen;
# what matters is that it stays DARK and FLAT, because anything with structure
# in it shows around the edges of the frame and fights the symbols.
QUIET = (0.225, 0.15, 0.775, 0.85)  # left, top, right, bottom as fractions


# --- per-file highlight haze -----------------------------------------------
#
# The board has NO opaque backing (there is no rectangle behind the reels — see
# BoardMask, which only masks), and since the frame crop the high symbols, the
# wild and the scatter render frameless at 0.88 of a cell. So roughly a quarter
# of each of those cells is background showing through, and whatever is behind
# the top row is behind the highest-value symbols in the game.
#
# Measured per board row inside the reels' footprint, the delivered art reads:
#
#     row 1        mean   >200 luminance
#     bg_base      107     9.7%
#     bg_superspin 109    13.2%
#     bg_feature   198    59.7%      <- a white panel behind the top row
#
# The midday sun is the whole point of the feature background and it should stay
# hot ABOVE the board. It just cannot also be inside it. So one file gets a haze
# pass: a vertical ramp that starts above the reels and reaches full strength
# across the top row.
#
# Weighted by BRIGHTNESS, not applied flat. A flat multiply over a band darkens
# the leaves and the branch as much as the sky and leaves a visible horizontal
# edge where the band starts. Weighting by how blown out a pixel already is means
# the correction lands almost entirely on the sky, which is what reads as haze
# rather than as a gradient wiped across the picture.
HAZE = {
    # (ramp start, ramp end, strength) as fractions of height
    # Empty until a delivered plate needs it. gen-3's feature background had
    # 59.7% of the area behind the top row above luminance 200 — a white panel
    # under the highest-paying symbols — and needed this pass. The prompt set
    # (design/BACKGROUND_PROMPTS.md) now asks for a restrained upper-centre, so
    # measure first and only add an entry if the numbers say so.
}
# Below this a pixel is picture rather than blowout and is left alone, and the
# weight is SQUARED above it. The first pass used a floor of 140 and a linear
# weight, which put nearly as much correction on the backlit lime leaves (~200)
# as on the blown sky (~250) and turned the best thing in the painting a muddy
# grey-green. The sky is the only thing up near white; the floor sits just under
# it and the square keeps the falloff away from everything else.
HAZE_FLOOR = 186


def apply_haze(img, start, end, strength):
    """Ramp in from `start`, then HOLD to the bottom of the frame.

    The first version stopped at `end`, so the correction went from full strength
    to nothing across one row of pixels and painted a grey bar straight across the
    sun — the numbers said row 1 was fixed and the picture was worse than before.
    Holding costs nothing: below the sun there is almost nothing above the
    brightness floor for the pass to act on, so the ramp is the only part of this
    that does any work, and there is no longer an edge for it to end at.
    """
    rgb = img.convert("RGB")
    px = rgb.load()
    w, h = rgb.size
    y0, y1 = int(start * h), int(end * h)
    for y in range(y0, h):
        ramp = 1.0 if y >= y1 else (y - y0) / (y1 - y0)
        if ramp <= 0:
            continue
        for x in range(w):
            r, g, b = px[x, y]
            v = max(r, g, b)
            if v <= HAZE_FLOOR:
                continue
            # 0 at the floor, 1 at full white
            hot = ((v - HAZE_FLOOR) / (255 - HAZE_FLOOR)) ** 2
            f = 1.0 - strength * ramp * hot
            px[x, y] = (int(r * f), int(g * f), int(b * f))
    return rgb


# --- sharpening after the upscale -------------------------------------------
#
# This pack was delivered 1195px wide after the aspect crop and the game wants
# 1920. Lanczos resamples cleanly but it cannot invent detail, and measured as
# edge energy the upscale costs about half of what the native file had (10.2 ->
# 5.6). On screen that is the softness.
#
# An unsharp mask does not put the detail back — nothing can, the information is
# not in the file — but it restores the local contrast at edges that the
# resample spread out, which is the part the eye reads as focus. The threshold
# keeps it off the flat haze and the sky, where sharpening only finds JPEG
# blocking and grain.
#
# The real fix is a 16:9 source at 1920 or wider, and then this does nothing
# because UNSHARP is skipped whenever no upscale happened.
UNSHARP = {"radius": 1.5, "percent": 115, "threshold": 4}


def crop_to_aspect(img):
    w, h = img.size
    if abs(w / h - ASPECT) < 0.001:
        return img, 0
    if w / h > ASPECT:
        keep = int(round(h * ASPECT))
        off = (w - keep) // 2
        return img.crop((off, 0, off + keep, h)), off
    keep = int(round(w / ASPECT))
    off = (h - keep) // 2
    return img.crop((0, off, w, off + keep)), off


def stats(img):
    """Mean luminance and spread inside the quiet box vs the whole frame.

    A background that passes this is not automatically good, but one that fails
    it is definitely wrong: a bright or busy centre puts contrast directly behind
    the symbols, which is the one thing this art must not do.
    """
    g = img.convert("L")
    w, h = g.size
    box = (int(QUIET[0] * w), int(QUIET[1] * h), int(QUIET[2] * w), int(QUIET[3] * h))
    inner = g.crop(box)
    return {
        "inner_mean": sum(inner.get_flattened_data()) / (inner.width * inner.height),
        "frame_mean": sum(g.get_flattened_data()) / (w * h),
        "inner_max": max(inner.get_flattened_data()),
    }


def sheet(images, path):
    """Every imported background with the quiet box drawn on it, stacked."""
    tw, th = 640, 360
    out = Image.new("RGB", (tw, th * len(images) + 8 * (len(images) - 1)), (24, 24, 24))
    for i, (name, img) in enumerate(images):
        thumb = img.resize((tw, th), Image.LANCZOS).convert("RGB")
        d = ImageDraw.Draw(thumb)
        d.rectangle(
            (QUIET[0] * tw, QUIET[1] * th, QUIET[2] * tw, QUIET[3] * th),
            outline=(255, 80, 80),
            width=2,
        )
        d.text((6, 6), name, fill=(255, 255, 255))
        out.paste(thumb, (0, i * (th + 8)))
    out.save(path)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src_dir = sys.argv[1]
    apply_changes = "--apply" in sys.argv

    found = {}
    for name in os.listdir(src_dir):
        stem = name
        for ext in (".jpg", ".jpeg", ".png", ".webp"):
            if stem.lower().endswith(ext):
                stem = stem[: -len(ext)]
                break
        # the pack arrives as "bg_base.png.jpg"
        if stem.lower().endswith(".png"):
            stem = stem[:-4]
        if stem.lower() in MAPPING:
            found[stem.lower()] = os.path.join(src_dir, name)

    print(f"source: {src_dir}")
    print(f"dest:   {DEST}")
    print(f"mode:   {'APPLY' if apply_changes else 'dry run (pass --apply to write)'}\n")
    print(f"{'file':<16}{'source':<16}{'crop':<14}{'result':<13}{'size':>8}   quiet-box mean / max")
    print("-" * 96)

    imported = []
    for stem, dest_name in MAPPING.items():
        if stem not in found:
            print(f"{stem:<16}— MISSING —")
            continue
        src = found[stem]
        img = Image.open(src)
        img.load()
        before = img.size
        img, off = crop_to_aspect(img)
        cropped = img.size
        sharpened = ""
        if img.size != TARGET:
            upscaling = img.size[0] < TARGET[0]
            img = img.resize(TARGET, Image.LANCZOS)
            if upscaling:
                img = img.filter(ImageFilter.UnsharpMask(**UNSHARP))
                sharpened = "sharpened"
        hazed = ""
        if stem in HAZE:
            before_mean = stats(img)["inner_mean"]
            img = apply_haze(img, *HAZE[stem])
            hazed = f"hazed {before_mean:.0f}->{stats(img)['inner_mean']:.0f}"
        st = stats(img)
        dest = os.path.join(DEST, dest_name)

        if apply_changes:
            img.convert("RGB").save(dest, "PNG", optimize=True)
            size = os.path.getsize(dest)
        else:
            tmp = dest + ".probe"
            img.convert("RGB").save(tmp, "PNG", optimize=True)
            size = os.path.getsize(tmp)
            os.remove(tmp)

        note = "; ".join(x for x in (hazed, sharpened) if x)
        if cropped[0] < TARGET[0]:
            note = (note + "; " if note else "") + f"upscaled {cropped[0]}->{TARGET[0]}px"
        print(
            f"{dest_name:<16}{f'{before[0]}x{before[1]}':<16}"
            f"{f'-{off}px/side':<14}{f'{TARGET[0]}x{TARGET[1]}':<13}"
            f"{size/1024:7.0f}K   {st['inner_mean']:5.1f} / {st['inner_max']:3d}   {note}"
        )
        imported.append((dest_name, img))

    if imported:
        sheet_path = os.path.join(HERE, "source/_backgrounds.png")
        sheet(imported, sheet_path)
        print(f"\ncheck sheet (red box = the reels' footprint): "
              f"{os.path.relpath(sheet_path, APP)}")


if __name__ == "__main__":
    main()
