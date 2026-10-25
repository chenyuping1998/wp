"""Placeholder monkey mascot drawn to the front-mascot template: continuous limbs, round shoulder tops centred on the
shoulder pivots, everything hidden painted. Use it to plan and review motions before any real art exists, and as the
reference for what a delivery should look like.

usage: python mannequin.py <template.json> <out dir>   → <out>/layers/*.png, joints.json, layers.json, composite.png
"""
import json
import math
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageEnhance

TEMPLATE, OUT = sys.argv[1], sys.argv[2]
T = json.load(open(TEMPLATE, encoding="utf-8"))
W, H = T["canvas"]
J = {j["id"]: tuple(j["xy"]) for j in T["joints"]}
TAIL = [tuple(p) for p in T["tail"]["points"]]
SS, OW = 2, 5
INK = (38, 26, 22, 255)
FUR, FUR_D = (150, 92, 52), (118, 70, 38)
FACE, FACE_D = (240, 212, 172), (222, 186, 146)
EAR_IN, VEST, GOLD, SHORTS = (232, 170, 150), (32, 128, 122), (236, 186, 64), (214, 84, 52)


def P(p):
    return (p[0] * SS, p[1] * SS)


def unit(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    n = math.hypot(dx, dy) or 1
    return dx / n, dy / n


def along(a, b, t):
    ux, uy = unit(a, b)
    return (a[0] + ux * t, a[1] + uy * t)


class Part:
    """Silhouette primitives drawn as one shape: the ink outline goes under every fill, so pieces merge seamlessly."""

    def __init__(self):
        self.ops, self.details = [], []

    def capsule(self, a, b, r1, r2, color):
        self.ops.append(("capsule", (a, b, r1, r2), color))

    def ellipse(self, c, rx, ry, color, angle=0):
        self.ops.append(("ellipse", (c, rx, ry, angle), color))

    def poly(self, pts, color):
        self.ops.append(("poly", (pts,), color))

    def detail(self, fn):
        self.details.append(fn)


def draw_op(d, kind, args, color, g):
    if kind == "capsule":
        a, b, r1, r2 = args
        ux, uy = unit(a, b)
        nx, ny = -uy, ux
        q = [(a[0] + nx * (r1 + g), a[1] + ny * (r1 + g)), (b[0] + nx * (r2 + g), b[1] + ny * (r2 + g)),
             (b[0] - nx * (r2 + g), b[1] - ny * (r2 + g)), (a[0] - nx * (r1 + g), a[1] - ny * (r1 + g))]
        d.polygon([P(p) for p in q], fill=color)
        for c, r in ((a, r1), (b, r2)):
            d.ellipse([P((c[0] - r - g, c[1] - r - g)), P((c[0] + r + g, c[1] + r + g))], fill=color)
    elif kind == "ellipse":
        c, rx, ry, ang = args
        t = math.radians(ang)
        pts = []
        for i in range(120):
            u = 2 * math.pi * i / 120
            x, y = (rx + g) * math.cos(u), (ry + g) * math.sin(u)
            pts.append(P((c[0] + x * math.cos(t) - y * math.sin(t), c[1] + x * math.sin(t) + y * math.cos(t))))
        d.polygon(pts, fill=color)
    elif kind == "poly":
        (pts,) = args
        d.polygon([P(p) for p in pts], fill=color)
        if g:
            d.line([P(p) for p in pts + [pts[0]]], fill=color, width=int(2 * g * SS), joint="curve")
            for p in pts:
                d.ellipse([P((p[0] - g, p[1] - g)), P((p[0] + g, p[1] + g))], fill=color)


def shifted(mask, dx, dy):
    out = Image.new("L", mask.size, 0)
    out.paste(mask, (int(dx * SS), int(dy * SS)))
    return out


def render(part):
    img = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for kind, args, color in part.ops:
        draw_op(d, kind, args, INK, OW)
    mask = Image.new("L", img.size, 0)
    md = ImageDraw.Draw(mask)
    for kind, args, color in part.ops:
        draw_op(d, kind, args, color + (255,), 0)
        draw_op(md, kind, args, 255, 0)
    shade = ImageChops.subtract(mask, shifted(mask, 14, -14))
    light = ImageChops.subtract(mask, shifted(mask, -6, 6))
    img = Image.composite(ImageEnhance.Brightness(img).enhance(0.8), img, shade)
    img = Image.composite(ImageEnhance.Brightness(img).enhance(1.12), img, light)
    d = ImageDraw.Draw(img)
    for fn in part.details:
        fn(d)
    return img.resize((W, H), Image.LANCZOS)


def line(d, pts, w, color=INK):
    d.line([P(p) for p in pts], fill=color, width=int(w * SS), joint="curve")


def dot(d, c, r, color):
    d.ellipse([P((c[0] - r, c[1] - r)), P((c[0] + r, c[1] + r))], fill=color)


def arc(d, c, rx, ry, a0, a1, w, color=INK):
    d.arc([P((c[0] - rx, c[1] - ry)), P((c[0] + rx, c[1] + ry))], a0, a1, fill=color, width=int(w * SS))


def catmull(pts, n=12):
    out = []
    Q = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(Q) - 2):
        p0, p1, p2, p3 = Q[i - 1], Q[i], Q[i + 1], Q[i + 2]
        for k in range(n):
            t = k / n
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t
                                    + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t ** 3) for j in (0, 1)))
    out.append(pts[-1])
    return out


def stroke(p, pts, r0, r1, color):
    """A tapered tube along a polyline: one silhouette, no joint caps inside."""
    n = len(pts) - 1
    for i in range(n):
        p.capsule(pts[i], pts[i + 1], r0 + (r1 - r0) * i / n, r0 + (r1 - r0) * (i + 1) / n, color)


parts = {}

p = Part()
tip = along(TAIL[-2], TAIL[-1], math.dist(TAIL[-2], TAIL[-1]) + 40)
stroke(p, catmull(TAIL + [tip]), 30, 13, FUR)
p.ellipse(tip, 20, 20, FUR_D)
parts["tail"] = p

for name, s in (("ear_l", "L"), ("ear_r", "R")):
    root, end = J[f"ear{s}root"], J[f"ear{s}tip"]
    p = Part()
    c = along(root, end, 70)
    p.capsule(root, c, 40, 50, FUR)
    p.ellipse(c, 58, 58, FUR)
    def ear(d, c=c, k=1 if s == "L" else -1):
        dot(d, (c[0] + k * 6, c[1] + 2), 34, EAR_IN + (255,))
        arc(d, (c[0] + k * 6, c[1] + 2), 34, 34, 0, 360, 3)
    p.detail(ear)
    parts[name] = p

for name, s, out in (("leg_l", "L", -1), ("leg_r", "R", 1)):
    hip, knee, ankle = J["hip" + s], J["knee" + s], J["ankle" + s]
    p = Part()
    stroke(p, [along(hip, knee, -40), hip, knee], 52, 44, FUR)
    stroke(p, [knee, ankle], 44, 38, FUR)
    p.ellipse((ankle[0] + out * 34, J["ground"][1] - 32), 70, 32, FACE, angle=out * 8)
    def foot(d, ankle=ankle, out=out):
        g = J["ground"][1]
        for k in (0, 1, 2):
            line(d, [(ankle[0] + out * (58 + k * 14), g - 52), (ankle[0] + out * (62 + k * 14), g - 28)], 3)
    p.detail(foot)
    parts[name] = p

cx = J["hip"][0]
p = Part()
p.poly([(cx - 102, 770), (cx + 102, 770), (cx + 114, 960), (cx + 68, 1000), (cx + 8, 985), (cx - 8, 985), (cx - 68, 1000), (cx - 114, 960)], SHORTS)
def pelvis_details(d):
    line(d, [(cx, 900), (cx, 985)], 4)
    line(d, [(cx - 102, 820), (cx + 102, 820)], 4, (170, 60, 36, 255))
p.detail(pelvis_details)
parts["pelvis"] = p

p = Part()
p.capsule((cx, J["headBase"][1] - 60), (cx, J["neckBase"][1] + 80), 56, 60, FUR_D)
parts["neck"] = p

p = Part()
p.capsule(J["shoulderL"], J["shoulderR"], 62, 62, FUR)
p.ellipse((cx, 715), 150, 160, FUR)
p.ellipse((cx, 735), 86, 112, FACE)
p.poly([(cx - 140, 600), (cx - 62, 570), (cx - 36, 640), (cx - 50, 850), (cx - 120, 846), (cx - 146, 720)], VEST)
p.poly([(cx + 140, 600), (cx + 62, 570), (cx + 36, 640), (cx + 50, 850), (cx + 120, 846), (cx + 146, 720)], VEST)
def torso_details(d):
    for y in (680, 760):
        dot(d, (cx - 42, y), 9, INK); dot(d, (cx - 42, y), 6, GOLD + (255,))
    line(d, [(cx - 28, 800), (cx, 812), (cx + 28, 800)], 3, FACE_D + (255,))
p.detail(torso_details)
parts["torso"] = p

for name, s, inward in (("arm_l", "L", 1), ("arm_r", "R", -1)):
    sh, el, wr = J["shoulder" + s], J["elbow" + s], J["wrist" + s]
    p = Part()
    stroke(p, [sh, el], 50, 42, FUR)
    stroke(p, [el, wr], 42, 36, FUR)
    p.capsule(along(wr, el, 34), wr, 40, 40, VEST)
    hc = along(el, wr, math.dist(el, wr) + 35)
    p.capsule(along(wr, el, 14), hc, 34, 40, FACE)
    p.ellipse((hc[0] + inward * 34, hc[1] - 18), 18, 26, FACE, angle=inward * -25)
    def hand(d, hc=hc, inward=inward):
        for k in (-1, 0, 1):
            line(d, [(hc[0] - inward * 4 + k * 14, hc[1] + 12), (hc[0] - inward * 4 + k * 14, hc[1] + 36)], 3)
    p.detail(hand)
    parts[name] = p

hc = (cx, J["headTop"][1] + 157)
p = Part()
p.ellipse(hc, 156, 150, FUR)
p.poly([(cx - 42, hc[1] - 140), (cx - 12, hc[1] - 176), (cx, hc[1] - 148), (cx + 18, hc[1] - 180), (cx + 40, hc[1] - 136)], FUR)
p.ellipse((cx - 50, hc[1] - 10), 70, 76, FACE)
p.ellipse((cx + 50, hc[1] - 10), 70, 76, FACE)
p.ellipse((cx, hc[1] + 70), 104, 70, FACE)
def head_details(d, y=hc[1]):
    for ex in (cx - 46, cx + 46):
        d.ellipse([P((ex - 24, y - 40)), P((ex + 24, y + 18))], fill=(255, 255, 255, 255))
        dot(d, (ex + 4, y - 6), 14, INK)
        dot(d, (ex + 9, y - 13), 5, (255, 255, 255, 255))
        line(d, [(ex - 30, y - 62), (ex + 22, y - 68)], 6)
    dot(d, (cx - 12, y + 50), 6, INK); dot(d, (cx + 12, y + 50), 6, INK)
    d.chord([P((cx - 60, y + 48)), P((cx + 60, y + 124))], 0, 180, fill=(90, 30, 30, 255))
    d.chord([P((cx - 32, y + 90)), P((cx + 32, y + 124))], 200, 340, fill=(226, 104, 104, 255))
    d.rectangle([P((cx - 42, y + 86)), P((cx + 42, y + 94))], fill=(255, 250, 240, 255))
    arc(d, (cx, y + 86), 60, 38, 0, 180, 4)
    line(d, [(cx - 60, y + 86), (cx + 60, y + 86)], 4)
p.detail(head_details)
parts["head"] = p

order = [l["name"] for l in T["layers"]]
os.makedirs(os.path.join(OUT, "layers"), exist_ok=True)
comp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
for name in order:
    im = render(parts[name])
    im.save(os.path.join(OUT, "layers", name + ".png"))
    comp.alpha_composite(im)
bg = Image.new("RGBA", (W, H), (44, 48, 58, 255))
bg.alpha_composite(comp)
bg.convert("RGB").save(os.path.join(OUT, "composite.png"))
joints = {k: list(v) for k, v in J.items()}
joints["tail"] = [list(p) for p in TAIL]
json.dump(joints, open(os.path.join(OUT, "joints.json"), "w"), indent=1)
json.dump({"order": order}, open(os.path.join(OUT, "layers.json"), "w"), indent=1)
print(f"mannequin: {len(order)} layers -> {OUT}")
