#!/usr/bin/env python3
"""Side-profile car for the scene transition.

    /Applications/anaconda3/envs/math-sdk/bin/python design/build_transition_car.py

The transition drives a car across a blacked-out screen. It was using `hmH5`,
the car SYMBOL — which is drawn three-quarter front-on, because that is the
angle that reads in a 132px reel cell. Slid horizontally it looks like a car
pointed at you being dragged sideways, which is exactly what it is.

A car charging past needs a side profile, so this draws one. Not generated:
vector-drawn here, so it can be reissued at any size and there is no third-party
or stock provenance attached to it.

Deliberately a silhouette rather than an illustration. In the transition the car
is dark, moving fast, and lit from its own headlights against a black screen —
the classic outrun image is a black wedge with light coming off its edges, and a
fully rendered body would fight the beams the transition draws over it. So:
near-black body, a cyan rim along the top silhouette (the sky), a magenta rim
underneath (the neon it is driving past), lamps at both ends, and wheels. Shape
does the work, which is what survives being 260px wide and moving.

Facing right, matching the drive direction, so the component never mirrors it.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

DESIGN = Path(__file__).resolve().parent
OUT_DIR = DESIGN.parent / "static" / "assets" / "sprites" / "hotMiamiFx"
OUT_DIR.mkdir(parents=True, exist_ok=True)

W, H = 1024, 512
SS = 2

BODY = (16, 6, 30)
BODY_LIT = (44, 18, 66)
RIM_TOP = (77, 232, 224)   # cyan
RIM_LOW = (255, 46, 136)   # magenta
GLASS = (60, 30, 92)
GLASS_LIT = (150, 220, 255)
TYRE = (10, 4, 18)
HUB = (120, 96, 150)
LAMP = (255, 244, 208)
TAIL = (255, 46, 90)

# One wedge, rear (left) to nose (right). Ground line at y=330 in a 400-tall
# body band; the canvas is 512 so there is room for the glow to bleed.
GROUND = 330
PROFILE = [
    (62, 300), (48, 252), (96, 232), (150, 224), (300, 220),
    (368, 168), (556, 164), (664, 220), (858, 232), (972, 248),
    (1002, 274), (984, 302), (62, 302),
]
WHEELS = [(258, 300, 64), (804, 300, 64)]
GLASS_POLY = [(378, 176), (548, 173), (636, 216), (392, 220)]


def draw_car() -> Image.Image:
    w, h = W * SS, H * SS
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = lambda pts: [(x * SS, (y + 56) * SS) for x, y in pts]

    # wheels first so the body sits over the top of them
    for cx, cy, r in WHEELS:
        cx, cy, r = cx * SS, (cy + 56) * SS, r * SS
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=TYRE + (255,))
        # The tyre is near-black on black, so without a rim the wheels simply are
        # not there — which is what the first render looked like.
        d.arc([cx - r, cy - r, cx + r, cy + r], start=20, end=160,
              fill=RIM_LOW + (255,), width=int(5 * SS))
        d.arc([cx - r, cy - r, cx + r, cy + r], start=200, end=340,
              fill=RIM_TOP + (200,), width=int(4 * SS))
        d.ellipse([cx - r * 0.46, cy - r * 0.46, cx + r * 0.46, cy + r * 0.46], fill=HUB + (255,))
        # five spokes, so the wheel is not a flat disc when it is caught still
        for k in range(5):
            a = k * math.tau / 5
            d.line(
                [cx, cy, cx + math.cos(a) * r * 0.42, cy + math.sin(a) * r * 0.42],
                fill=TYRE + (255,), width=int(7 * SS),
            )

    d.polygon(s(PROFILE), fill=BODY + (255,))
    # a lighter panel low on the flank so the body is not one flat shape
    d.polygon(
        s([(120, 268), (300, 250), (700, 252), (940, 268), (940, 292), (120, 292)]),
        fill=BODY_LIT + (255,),
    )
    d.polygon(s(GLASS_POLY), fill=GLASS + (255,))
    # windscreen catching the sky
    d.polygon(s([(548, 175), (636, 216), (592, 218), (516, 178)]), fill=GLASS_LIT + (110,))

    # rim light: the profile stroked twice, offset up for the sky and down for
    # the neon. Drawn as open paths so the underside does not get a cyan edge.
    top = s(PROFILE[1:10])
    # The sill light runs only BETWEEN the wheels. Run edge to edge it became a
    # straight magenta rule drawn across both tyres, which read as an underline
    # under the car rather than neon catching its sill.
    low = s([(330, 300), (734, 300)])
    d.line([(x, y - 4 * SS) for x, y in top], fill=RIM_TOP + (255,), width=int(6 * SS), joint="curve")
    d.line([(x, y + 3 * SS) for x, y in low], fill=RIM_LOW + (255,), width=int(7 * SS))

    # lamps
    d.ellipse([(986 - 26) * SS, (262 + 56 - 16) * SS, (986 + 26) * SS, (262 + 56 + 16) * SS],
              fill=LAMP + (255,))
    d.ellipse([(70 - 20) * SS, (256 + 56 - 13) * SS, (70 + 20) * SS, (256 + 56 + 13) * SS],
              fill=TAIL + (255,))

    img = img.resize((W, H), Image.LANCZOS)

    # a soft bloom off the rim lights, so the edges read as light and not paint
    glow = img.filter(ImageFilter.GaussianBlur(9))
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out = Image.alpha_composite(out, Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 0)), glow, 0.5))
    return Image.alpha_composite(out, img)


def main():
    car = draw_car()
    path = OUT_DIR / "car_side.png"
    car.save(path)

    # how it actually appears: 260px wide, on black
    sheet = Image.new("RGB", (900, 260), (5, 2, 10))
    for i, w in enumerate((520, 260, 130)):
        c = car.copy()
        c.thumbnail((w, w), Image.LANCZOS)
        sheet.paste(c, (20 + sum((520, 260, 130)[:i]) + i * 20, (260 - c.height) // 2), c)
    sheet.save(DESIGN / "_contact" / "car_side.png")
    print(f"[OK] {path.name} {car.size} {path.stat().st_size / 1024:.0f}KB")
    print(f"     size ladder -> design/_contact/car_side.png")


if __name__ == "__main__":
    main()
