#!/usr/bin/env python3
"""Card royals, v5 — neon tube letters.

    /Applications/anaconda3/envs/math-sdk/bin/python design/build_card_royals_v5.py

Why there is a v5 at all
------------------------

v4 built each royal as a flat slab letter with a black comic outline and a thin
art-deco sunburst fan behind it. Every one of those decisions is defensible in
isolation; together, on the board, they produced the thing Stake's review notes
call "mismatched art styles":

* The five premiums are illustrated cut-outs — a drawn person, a car, a
  boombox — and the royals were typography. Two different crafts on one grid.
* The sunburst is a generic device. Eleven dark-violet rays behind a letter is
  what a stock asset pack ships, and at reel size it does not resolve into rays
  at all; it resolves into a smudge that makes the letter look dirty.
* Nothing about them said *neon*, in a game whose entire mechanic is called
  Neon Frames and whose board is a neon sign.

v5 keeps the letterforms and the colour identities — a returning player must not
have to relearn which letter is which — and rebuilds the object around them. The
royals are now the same thing the rest of the game is: bent glass tube, lit,
mounted on nothing, cut out on transparency exactly like the premiums.

Construction, identical for all four
------------------------------------

Only the hue changes between A, K, Q and J. Everything else — the keyline
weight, the tube weight, the core weight, the bloom radius, the shadow offset —
is one set of constants shared by the four, because "consistent set" has to be a
property of the code, not of four hand-tuned configs that happen to look alike
today.

    1. hard offset shadow   near-black, no blur, down-right
    2. outer bloom          accent, heavy blur — the light the tube throws
    3. keyline band         near-black — the same #12041f the intro card's panels
                            and the character art use as their outline
    4. rim band             accent lightened — the glass wall catching its own
                            light, which is what makes it read as a tube and not
                            as a sticker
    5. body                 accent at full saturation

Bands, not layers, and the distinction cost a render. PIL's `stroke_width`
dilates the whole glyph, so each pass is a *solid* letterform, not an outline —
a smaller pass drawn after a larger one repaints the entire interior rather than
sitting inside it as a ring. The first attempt stacked keyline → tube → inner →
core in that order and the last pass won the body, so all four royals came out
with near-white interiors and only a thread of their own colour at the edge:
washed out on the board and no longer telling A from Q at a glance. Ordering
widest-to-narrowest and letting each pass claim the annulus the next one does
not cover is the whole technique.

The keyline is what marries them to the premiums: those are drawn with a thick
black outline, so the royals get the same outline, at the same relative weight.

Checked at reel size, not at 512
--------------------------------

Run `contact_sheet.py` afterwards. It renders every shipped symbol at its true
drawn size on the real board colour and prints the audit numbers. A neon
treatment is exactly the kind of thing that looks superb at 512 and turns to
mush at 105, so the sheet is the check that matters — in particular the
body-vs-board dE, which is what "invisible on the board" looks like as a number.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

DESIGN = Path(__file__).resolve().parent
APP = DESIGN.parent
SPRITES = APP / "static" / "assets" / "sprites" / "hotMiamiSymbols"
SOURCE = DESIGN / "source"
FONT_PATH = APP / "static" / "fonts" / "TitanOne.ttf"

SPRITES.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)

# The outline colour the character art and the intro panels already use. Reusing
# it rather than plain black is the difference between "outlined" and "outlined
# in the same ink as everything else".
KEYLINE = (18, 4, 31)

SIZE = 512
SS = 2  # supersample; everything below is in 512-space and scaled by SS

# One set of weights for all four letters.
#
# These are small on purpose. `stroke_width` dilates the glyph from BOTH sides of
# every counter, so the widths that felt right at 512 (30 / 20 / 13) closed the
# bowl of Q, the triangle of A and the aperture of J completely: at the 84px a
# low symbol is actually drawn, all four became coloured blobs. Titan One is
# already a very heavy face and needs almost no help. The rule to keep: any
# dilation approaching half the narrowest counter destroys the letter, and the
# only place that is visible is the reel-size sheet.
FONT_SIZE = 320
# Widest to narrowest. The visible band for each is the gap to the next one, so
# these read as: 7px of black keyline, 5px of rim light, and everything inside is
# the letter's own colour.
KEYLINE_W = 16
RIM_W = 9
BODY_W = 4
RIM_LIGHTEN = 0.45
SHADOW_OFFSET = 11
BLOOM_W = 26
BLOOM_BLUR = 22
BLOOM_ALPHA = 175


def lighten(rgb: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(c + (255 - c) * t) for c in rgb)


def build_royal(letter: str, accent: tuple[int, int, int], core: tuple[int, int, int]) -> Image.Image:
    sw = sh = SIZE * SS
    layer = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))

    font = ImageFont.truetype(str(FONT_PATH), FONT_SIZE * SS)
    measure = ImageDraw.Draw(layer)
    bbox = measure.textbbox((0, 0), letter, font=font, stroke_width=KEYLINE_W * SS)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (sw - tw) // 2 - bbox[0]
    ty = (sh - th) // 2 - bbox[1]

    def stamp(target, dx, dy, width, fill):
        ImageDraw.Draw(target).text(
            (tx + dx * SS, ty + dy * SS),
            letter,
            font=font,
            fill=fill,
            stroke_width=int(width * SS),
            stroke_fill=fill,
        )

    # 2. bloom — drawn first so everything else sits inside its light. Built as a
    #    mask and blurred, rather than as blurred colour, so the glow keeps a
    #    single hue instead of darkening towards its edge.
    bloom_mask = Image.new("L", (sw, sh), 0)
    ImageDraw.Draw(bloom_mask).text(
        (tx, ty), letter, font=font, fill=255, stroke_width=BLOOM_W * SS, stroke_fill=255
    )
    bloom_mask = bloom_mask.filter(ImageFilter.GaussianBlur(BLOOM_BLUR * SS))
    bloom_mask = bloom_mask.point(lambda v: int(v * BLOOM_ALPHA / 255))
    bloom = Image.new("RGBA", (sw, sh), accent + (255,))
    bloom.putalpha(bloom_mask)
    layer = Image.alpha_composite(layer, bloom)

    # 1. hard shadow — no blur. A blurred shadow is a UI idiom; the character art
    #    and the intro panels both use a hard offset block, so these do too.
    shadow = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    stamp(shadow, SHADOW_OFFSET, SHADOW_OFFSET, KEYLINE_W, KEYLINE + (215,))
    layer = Image.alpha_composite(layer, shadow)

    # 3-5. the tube: widest first, each pass keeping only the annulus the next
    #      one does not repaint. `core` is what the rim band is mixed towards, so
    #      the highlight stays the letter's own hue rather than going grey.
    body = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    stamp(body, 0, 0, KEYLINE_W, KEYLINE + (255,))
    stamp(body, 0, 0, RIM_W, lighten(accent, RIM_LIGHTEN) + (255,))
    stamp(body, 0, 0, BODY_W, accent + (255,))
    layer = Image.alpha_composite(layer, body)

    return layer.resize((SIZE, SIZE), Image.LANCZOS)


# Colour identities carried over from v4 unchanged — a returning player must not
# have to relearn the set — but moved onto the exact neon values the rest of the
# game ships (game/uiTheme.ts and the intro card's palette), instead of the
# slightly muddied approximations v4 used.
CONFIGS = [
    ("l1", "A", (255, 46, 136), (255, 226, 242)),   # hot magenta
    ("l2", "K", (77, 232, 224), (226, 255, 253)),   # cyan
    ("l3", "Q", (255, 215, 94), (255, 248, 216)),   # gold
    ("l4", "J", (176, 107, 255), (238, 222, 255)),  # violet
]


def main():
    for key, letter, accent, core in CONFIGS:
        img = build_royal(letter, accent, core)
        img.save(SPRITES / f"{key}.png")
        img.save(SOURCE / f"{key}.png")
        print(f"[OK] {key}.png  {letter}  accent={accent}")


if __name__ == "__main__":
    main()
