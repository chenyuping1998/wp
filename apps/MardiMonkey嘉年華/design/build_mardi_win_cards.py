"""Draw Mardi Gras comic win plaques without baking lettering into the art.

The illustrated tier decorations remain separate animated meshes. These plates
leave the runtime title and amount areas clean and keep their existing sizes.
"""

from pathlib import Path
from math import sin, pi
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "static/assets/sprites/sushiV8"
S = 3
INK = "#24142F"
PLUM = "#3B1F5C"
PURPLE = "#71359B"
VIOLET = "#A83FD6"
PAPER = "#FFF3E0"
WELL = "#FFF9EB"
GREEN = "#2FAF5A"
GOLD = "#F4C430"
CORAL = "#FF5A8A"


class Painter:
    def __init__(self, width: int, height: int):
        self.image = Image.new("RGBA", (width * S, height * S))
        self.draw = ImageDraw.Draw(self.image)

    def xy(self, points):
        return [(round(x * S), round(y * S)) for x, y in points]

    def poly(self, points, fill, outline=None, width=1):
        pts = self.xy(points)
        self.draw.polygon(pts, fill=fill)
        if outline:
            self.draw.line(pts + [pts[0]], fill=outline, width=width * S, joint="curve")

    def line(self, points, fill, width=2):
        self.draw.line(self.xy(points), fill=fill, width=width * S, joint="curve")

    def oval(self, box, fill, outline=None, width=1):
        self.draw.ellipse(tuple(round(v * S) for v in box), fill=fill, outline=outline, width=width * S)

    def arc(self, box, start, end, fill, width=2):
        self.draw.arc(tuple(round(v * S) for v in box), start, end, fill=fill, width=width * S)

    def save(self, path):
        self.image.resize((self.image.width // S, self.image.height // S), Image.Resampling.LANCZOS).save(path, optimize=True)


def beads(p, left, right, y, radius=7):
    colours = (PURPLE, GREEN, GOLD, CORAL)
    for i, x in enumerate(range(left, right + 1, 31)):
        cy = y + round(9 * sin(i * pi / max(1, (right - left) // 31)))
        p.oval((x - radius, cy - radius, x + radius, cy + radius), colours[i % 4], INK, 2)


def halftone(p, origin, rows, cols, colour):
    ox, oy = origin
    for row in range(rows):
        for col in range(cols):
            if (row + col) % 4 == 0:
                continue
            r = 1 + (row + col) % 2
            x, y = ox + col * 12, oy + row * 12
            p.oval((x-r, y-r, x+r, y+r), colour)


def tier(name, accent, strong=False):
    p = Painter(1000, 560)
    # A single printed parade ticket: uneven cut-paper silhouette, one ink keyline.
    outer = [(69, 73), (208, 65), (318, 69), (485, 61), (665, 68), (788, 64),
             (912, 74), (945, 101), (950, 452), (927, 494), (816, 507),
             (625, 500), (478, 511), (271, 504), (99, 510), (54, 477), (51, 123)]
    p.poly([(x+7, y+10) for x,y in outer], PLUM)
    p.poly(outer, PAPER, INK, 10)
    p.poly([(91, 99), (231, 93), (481, 89), (730, 94), (914, 101), (923, 447),
            (902, 473), (662, 477), (474, 482), (245, 474), (83, 475), (77, 137)],
           PAPER, accent, 6)
    # Sparse printed dots and a bead garland stay outside the lettering.
    halftone(p, (93, 123), 8, 8, "#C8B3C8")
    halftone(p, (795, 408), 5, 9, "#C8B3C8")
    beads(p, 113, 887, 89, 5)
    p.poly([(169, 145), (201, 122), (302, 129), (490, 116), (692, 126), (796, 122),
            (825, 146), (806, 230), (707, 241), (491, 234), (292, 242), (186, 232)],
           PLUM, INK, 7)
    p.poly([(203, 147), (281, 144), (490, 135), (694, 144), (786, 145),
            (770, 218), (690, 222), (490, 215), (301, 223), (213, 216)],
           accent, None)
    # Keep a broad, still paper field under the changing amount.
    p.poly([(267, 287), (735, 282), (780, 304), (778, 455), (743, 472),
            (257, 472), (228, 447), (231, 316)], WELL, INK, 6)
    p.line([(272, 304), (734, 301)], accent, 4)
    p.line([(275, 454), (732, 452)], accent, 4)
    for x in (116, 870):
        for y in (238, 447):
            p.oval((x-6, y-6, x+6, y+6), GOLD, INK, 2)
    # The game's inked trumpet illustration balances the animated cake on the
    # left. Its alpha is kept intact, so the amount remains entirely untouched.
    trumpet = Image.open(ROOT / "static/assets/sprites/sushiSymbols/h2.png").convert("RGBA")
    trumpet = trumpet.crop(trumpet.getbbox())
    trumpet.thumbnail((175 * S, 156 * S), Image.Resampling.LANCZOS)
    p.image.alpha_composite(trumpet, (round(790 * S), round(278 * S)))
    p.save(OUT / f"win_{name}.png")


def total():
    p = Painter(1600, 1000)
    outer = [(132, 150), (380, 126), (568, 137), (802, 102), (1042, 136),
             (1265, 123), (1464, 150), (1490, 812), (1427, 897), (1095, 915),
             (801, 901), (497, 918), (173, 897), (113, 823)]
    p.poly([(x+13,y+14) for x,y in outer], PLUM)
    p.poly(outer, PAPER, INK, 17)
    p.poly([(169, 180), (444, 163), (800, 143), (1174, 166), (1427, 181),
            (1448, 788), (1402, 863), (1053, 877), (802, 863), (506, 880),
            (204, 862), (159, 787)], PAPER, PURPLE, 9)
    beads(p, 260, 1340, 177, 10)
    # Light title cartouche: the runtime title is dark ink and never crosses trim.
    p.poly([(379, 339), (479, 314), (799, 305), (1118, 317), (1214, 341),
            (1181, 507), (1036, 523), (798, 513), (560, 524), (413, 507)],
           "#E9F2DD", INK, 10)
    p.line([(448, 355), (799, 339), (1144, 356)], GREEN, 8)
    # Count well is a wide sheet, not a second stacked sign.
    p.poly([(306, 557), (1255, 550), (1305, 581), (1295, 793), (1252, 815),
            (316, 815), (280, 786), (281, 595)], WELL, INK, 10)
    p.line([(345, 584), (1240, 584)], GOLD, 7)
    p.line([(344, 789), (1238, 789)], GREEN, 6)
    for x in (205, 1390):
        for y, colour in ((350, PURPLE), (505, GREEN), (668, GOLD), (820, PURPLE)):
            p.oval((x-22,y-22,x+22,y+22), colour, INK, 6)
    halftone(p, (222, 223), 10, 10, "#C8B3C8")
    halftone(p, (1264, 682), 11, 11, "#C8B3C8")
    p.save(OUT / "fg_total.png")


for tier_name, accent, strong in (
    ("big", PURPLE, False),
    ("super", GREEN, False),
    ("mega", VIOLET, False),
    ("epic", CORAL, True),
    ("max", GOLD, True),
):
    tier(tier_name, accent, strong)
total()
