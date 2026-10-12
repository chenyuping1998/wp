"""Draw the remaining Mardi Monkey signs in the comic parade-ticket style.

Lettering and changing values stay in Pixi so every supported language uses the
same artwork. Illustrations that move on the FG sign remain separate meshes.
"""

from pathlib import Path
from math import sin, pi
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
V8 = ROOT / "static/assets/sprites/sushiV8"
UI = ROOT / "static/assets/sprites/sushiUi"
S = 3
INK = "#24142F"
PLUM = "#3B1F5C"
PURPLE = "#71359B"
GREEN = "#2FAF5A"
GOLD = "#F4C430"
CORAL = "#FF5A8A"
PAPER = "#FFF3E0"
WELL = "#FFF9EB"
DOT = "#C8B3C8"


class Card:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new("RGBA", (w * S, h * S))
        self.d = ImageDraw.Draw(self.im)

    def pts(self, coords):
        return [(round(x * S), round(y * S)) for x, y in coords]

    def poly(self, coords, fill, stroke=None, sw=1):
        p = self.pts(coords)
        self.d.polygon(p, fill=fill)
        if stroke:
            self.d.line(p + [p[0]], fill=stroke, width=sw * S, joint="curve")

    def line(self, coords, color, sw=2):
        self.d.line(self.pts(coords), fill=color, width=sw * S, joint="curve")

    def oval(self, box, fill, stroke=None, sw=1):
        self.d.ellipse(tuple(round(n * S) for n in box), fill=fill, outline=stroke, width=sw * S)

    def dots(self, x, y, rows, cols, color=DOT, gap=12):
        for row in range(rows):
            for col in range(cols):
                if (row + col) % 4 == 0:
                    continue
                r = 1 + (row + col) % 2
                xx, yy = x + col * gap, y + row * gap
                self.oval((xx-r, yy-r, xx+r, yy+r), color)

    def beads(self, x0, x1, y, step=30, r=7):
        colors = (PURPLE, GREEN, GOLD, CORAL)
        count = max(1, round((x1-x0) / step))
        for i in range(count + 1):
            x = x0 + (x1-x0) * i / count
            yy = y + 5 * sin(i * pi / count)
            self.oval((x-r, yy-r, x+r, yy+r), colors[i % 4], INK, 2)

    def save(self, path):
        self.im.resize((self.w, self.h), Image.Resampling.LANCZOS).save(path, optimize=True)


def fg_intro():
    p = Card(1600, 1000)
    outline = [(134, 138), (401, 127), (803, 99), (1187, 126), (1464, 144),
               (1493, 789), (1433, 888), (1091, 912), (802, 896), (493, 914),
               (166, 888), (111, 806)]
    p.poly([(x+13,y+14) for x,y in outline], PLUM)
    p.poly(outline, PAPER, INK, 17)
    p.poly([(174, 177), (445, 163), (802, 139), (1159, 162), (1422, 177),
            (1448, 774), (1395, 853), (801, 859), (204, 853), (158, 778)],
           PAPER, PURPLE, 9)
    p.beads(259, 1342, 180, 31, 10)
    # The header, central stamped spin count, and AWARDED footer are each quiet.
    p.poly([(377, 326), (500, 305), (800, 293), (1118, 306), (1231, 331),
            (1198, 472), (1035, 488), (802, 482), (559, 489), (404, 471)],
           "#E9F2DD", INK, 10)
    p.line([(471, 346), (801, 333), (1139, 348)], GREEN, 7)
    p.poly([(420, 515), (1190, 512), (1234, 541), (1221, 729),
            (1181, 752), (419, 752), (379, 727), (382, 548)], WELL, INK, 9)
    p.line([(437, 548), (1178, 547)], GOLD, 7)
    p.poly([(584, 775), (1018, 775), (1056, 794), (1048, 847),
            (551, 847), (543, 796)], PAPER, PURPLE, 6)
    for x in (204, 1395):
        for y, col in ((354, PURPLE), (513, GREEN), (671, GOLD), (819, PURPLE)):
            p.oval((x-21,y-21,x+21,y+21), col, INK, 5)
    p.dots(224, 222, 9, 9)
    p.dots(1270, 671, 10, 8)
    p.save(V8 / "fg_intro.png")


def logo():
    p = Card(1600, 600)
    edge = [(132, 123), (329, 105), (585, 113), (801, 93), (1022, 111),
            (1281, 106), (1466, 124), (1509, 194), (1504, 449),
            (1450, 493), (1110, 498), (801, 487), (489, 499), (151, 489),
            (94, 443), (95, 194)]
    p.poly([(x+10,y+12) for x,y in edge], PLUM)
    p.poly(edge, PAPER, INK, 16)
    p.poly([(154, 156), (489, 143), (803, 126), (1100, 145), (1447, 156),
            (1464, 437), (1419, 465), (803, 458), (177, 464), (136, 428), (135, 197)],
           PAPER, PURPLE, 8)
    p.beads(250, 1350, 151, 36, 9)
    p.dots(167, 218, 10, 7)
    p.dots(1344, 291, 10, 7)
    # Blank central lettering field; edge motifs stay outside the game's name.
    for x in (170, 1430):
        for y, col in ((231, PURPLE), (314, GREEN), (397, GOLD)):
            p.oval((x-15,y-15,x+15,y+15), col, INK, 4)
    p.save(V8 / "logo_board.png")


def menu_frame(wide=False):
    w, h = (1200, 300) if wide else (740, 1024)
    p = Card(w, h)
    if wide:
        edge = [(31, 22), (283, 18), (612, 25), (1160, 21), (1182, 45),
                (1180, 263), (1155, 281), (610, 278), (287, 283), (26, 274), (18, 49)]
        inner = [(45, 39), (360, 34), (1142, 37), (1159, 52), (1156, 250),
                 (1136, 262), (55, 263), (38, 247), (35, 55)]
        p.poly([(x+6,y+7) for x,y in edge], PLUM)
        p.poly(edge, PAPER, INK, 7)
        p.poly(inner, PAPER, PURPLE, 4)
        p.beads(70, 1128, 37, 30, 4)
        p.dots(51, 203, 5, 6, gap=11)
        p.dots(1107, 193, 5, 5, gap=11)
        p.line([(41, 264), (343, 265)], GREEN, 4)
    else:
        edge = [(40, 31), (339, 24), (700, 31), (717, 54), (710, 963),
                (687, 993), (338, 1000), (38, 989), (22, 964), (23, 60)]
        p.poly([(x+7,y+8) for x,y in edge], PLUM)
        p.poly(edge, PAPER, INK, 8)
        p.poly([(52, 55), (341, 47), (685, 55), (693, 945), (676, 969),
                (346, 977), (62, 969), (46, 943), (45, 81)], PAPER, PURPLE, 5)
        p.beads(93, 649, 63, 30, 5)
        # Three illustration areas remain unframed and fully visible.
        p.line([(89, 581), (651, 581)], GREEN, 5)
        p.line([(91, 940), (651, 940)], PURPLE, 4)
        p.dots(61, 626, 7, 5, gap=12)
        p.dots(629, 829, 8, 5, gap=12)
        for x in (82, 659):
            for y, col in ((606, PURPLE), (954, GOLD)):
                p.oval((x-7,y-7,x+7,y+7), col, INK, 2)
    p.save(V8 / ("menu_frame_wide.png" if wide else "menu_frame.png"))


def buybonus(lit=False):
    p = Card(512, 512)
    edge = [(57, 43), (196, 35), (319, 39), (451, 46), (472, 70),
            (476, 429), (451, 465), (310, 472), (193, 467), (61, 471),
            (38, 440), (37, 73)]
    p.poly([(x+5,y+7) for x,y in edge], PLUM)
    p.poly(edge, PAPER, INK, 10)
    p.poly([(70, 64), (256, 55), (440, 66), (452, 85), (454, 419),
            (436, 448), (254, 452), (77, 451), (57, 427), (57, 85)],
           PAPER, GOLD if lit else PURPLE, 6)
    p.beads(91, 418, 74, 27, 4)
    p.dots(69, 110, 6, 5, gap=11)
    p.dots(391, 356, 6, 5, gap=11)
    for x in (79, 434):
        for y, color in ((147, PURPLE), (256, GREEN), (367, GOLD)):
            p.oval((x-6,y-6,x+6,y+6), color, INK, 2)
    # Small parade mask is a bottom-edge motif; no ink crosses the button copy.
    p.poly([(211, 428), (230, 417), (251, 429), (277, 416), (299, 426),
            (284, 444), (254, 448), (228, 443)], GREEN if lit else GOLD, INK, 3)
    p.oval((231, 430, 243, 436), PAPER, INK, 2)
    p.oval((267, 428, 279, 434), PAPER, INK, 2)
    p.save(UI / ("buybonus_plate_lit.png" if lit else "buybonus_plate.png"))


def ticker():
    p = Card(652, 146)
    edge = [(27, 14), (185, 10), (353, 13), (619, 12), (638, 32),
            (636, 111), (620, 132), (354, 135), (189, 132), (26, 134),
            (11, 114), (11, 35)]
    p.poly([(x+3,y+4) for x,y in edge], PLUM)
    p.poly(edge, PAPER, INK, 5)
    p.poly([(33, 28), (322, 23), (615, 27), (624, 37), (623, 108),
            (610, 119), (327, 123), (36, 118), (25, 108), (25, 40)],
           PAPER, GREEN, 4)
    for x, col in ((42, PURPLE), (60, GREEN), (78, GOLD), (574, GOLD), (592, GREEN), (610, PURPLE)):
        p.oval((x-4, 65, x+4, 73), col, INK, 1)
    p.save(UI / "ticker_plate.png")


def counter():
    p = Card(600, 480)
    edge = [(37, 22), (281, 16), (564, 23), (583, 43), (580, 434),
            (555, 459), (300, 453), (48, 460), (19, 435), (20, 47)]
    p.poly([(x+6,y+7) for x,y in edge], PLUM)
    p.poly(edge, PAPER, INK, 9)
    p.poly([(50, 40), (300, 33), (550, 41), (563, 59), (561, 418),
            (542, 438), (300, 434), (59, 440), (40, 420), (39, 58)],
           PAPER, PURPLE, 5)
    p.poly([(60, 48), (300, 40), (540, 48), (550, 66), (546, 126),
            (301, 130), (54, 126), (51, 68)], GREEN, INK, 5)
    p.beads(92, 508, 51, 27, 4)
    p.line([(75, 146), (526, 146)], GOLD, 4)
    p.line([(77, 324), (524, 324)], PURPLE, 3)
    p.dots(48, 197, 8, 5, gap=10)
    p.dots(507, 224, 8, 5, gap=10)
    p.save(V8 / "fg_counter.png")


fg_intro()
logo()
menu_frame()
menu_frame(wide=True)
buybonus()
buybonus(lit=True)
ticker()
counter()
