"""Cut a single full-body cast drawing into the rig's layers.

    python3 design/cut_cast_layers.py mg|fg

Sushi Monkey's two cast figures were delivered as ONE flat image each
(design/cast_delivery/<cast>_full_source.png, 983x1600), not as the layered
PSD the Boomana rig was built from. This does what extract_monkey_psd.py does
for a PSD, from polygons instead of layers:

  1. scale the drawing onto the rig's 560x912 canvas (the same aspect, so the
     body lands roughly where Boomana's did and the inherited animations fit)
  2. PARTITION every opaque pixel into exactly one piece by polygon (first
     match wins, in CUTS order); whatever no polygon claims is the trunk
  3. UNDERLAY: a piece drawn BELOW a neighbour is extended UNDER that
     neighbour by up to UNDERLAY px, painted with its own nearest colour, so
     when a limb rotates it uncovers more of the same cloth rather than a hole.
     (The sleeve covers the top of the forearm, the calf covers the bottom of
     the thigh, the trunk covers everything it hangs from.)
  4. write design/source/<cast>/<piece>.png trimmed to its alpha, layers.json
     (canvas + each piece's box and z) and _compare.png (source | rebuild) —
     check the compare first: it proves nothing was dropped.

Layer names follow the Boomana PSD's convention because generate_monkey_spine
resolves bones by those prefixes (torso_*, head_*, left_arm_0/2, left_leg_0/1/2…).
"""

import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANVAS = (560, 912)
UNDERLAY = 26
# Both drawings face screen-RIGHT, and the cast stands to the RIGHT of the board,
# so as delivered they turn their backs on it ("cast faces the board"). Mirror
# at cut time rather than flipping the skeleton: a flipped skeleton would also
# flip the throw, which has to go TOWARD the board (screen-left). Mirroring here
# keeps every animation as authored. Polygons and rig points below are written
# for the UNMIRRORED drawing (design/cast_cut/<cast>_grid.png); mirror() maps
# them and swaps left/right names.
MIRROR = False
ALPHA_FLOOR = 24

# (name, z, polygon on the 560x912 canvas, optional colour filter)
# z decides the draw order AND which neighbour hides which: the hand sits UNDER
# its sleeve (the cuff is drawn over the fur), legs and arms over the trunk.
CUTS = {'mg': [('head_2_face', 30, [(170, 0), (440, 0), (440, 200), (350, 211), (315, 226), (267, 210), (196, 211), (160, 180)], None), ('left_arm_0_upper_arm', 22, [(90, 265), (130, 250), (165, 232), (176, 245), (190, 282), (204, 305), (200, 318), (186, 326), (176, 330), (150, 313), (120, 309), (98, 306), (80, 296)], None), ('left_arm_2_hand', 20, [(80, 296), (98, 306), (120, 309), (150, 313), (176, 330), (187, 340), (188, 350), (188, 362), (178, 380), (190, 400), (170, 450), (156, 500), (165, 540), (164, 560), (161, 580), (153, 600), (150, 615), (140, 640), (20, 640), (20, 300)], None), ('right_arm_0_upper_arm', 26, [(392, 250), (430, 262), (470, 290), (470, 330), (456, 340), (440, 344), (420, 356), (400, 362), (396, 350), (394, 330), (394, 300), (392, 270)], None), ('right_arm_2_hand', 24, [(400, 362), (420, 356), (440, 344), (456, 340), (500, 330), (520, 640), (445, 642), (443, 620), (433, 610), (433, 590), (427, 580), (427, 570), (425, 560), (426, 540), (425, 500), (416, 480), (407, 460), (400, 440), (394, 420), (395, 400), (395, 390), (389, 380), (394, 372), (396, 366)], None), ('left_leg_2_foot', 12, [(60, 800), (288, 800), (290, 912), (60, 912)], None), ('right_leg_2_foot', 16, [(290, 808), (440, 808), (520, 812), (520, 912), (290, 912)], None), ('left_leg_1_calf', 11, [(150, 746), (290, 740), (288, 800), (130, 800)], None), ('right_leg_1_calf', 15, [(290, 740), (450, 745), (440, 808), (290, 808)], None), ('left_leg_0_thigh', 10, [(118, 646), (160, 646), (170, 657), (220, 657), (240, 662), (260, 666), (280, 669), (290, 670), (290, 740), (150, 746), (118, 700)], None), ('right_leg_0_thigh', 14, [(290, 670), (310, 671), (340, 671), (360, 669), (380, 667), (400, 664), (420, 659), (445, 655), (450, 745), (290, 740)], None)], 'fg': [('head_2_face', 30, [(141, 0), (438, 0), (438, 237), (356, 226), (330, 234), (289, 230), (248, 216), (165, 221), (141, 190)], None), ('left_arm_0_upper_arm', 22, [(150, 262), (190, 248), (214, 244), (226, 250), (230, 260), (234, 270), (236, 280), (240, 290), (238, 300), (236, 310), (232, 320), (225, 330), (217, 342), (200, 338), (180, 334), (158, 332), (140, 320)], None), ('left_arm_2_hand', 20, [(140, 320), (158, 332), (180, 334), (200, 338), (217, 342), (210, 350), (208, 360), (205, 370), (196, 380), (194, 390), (194, 440), (189, 450), (179, 460), (170, 470), (164, 480), (156, 490), (151, 500), (152, 510), (156, 520), (166, 530), (172, 540), (175, 560), (180, 580), (180, 625), (60, 625), (60, 320)], None), ('right_arm_0_upper_arm', 26, [(340, 248), (356, 246), (380, 260), (400, 290), (405, 340), (394, 348), (370, 352), (362, 354), (350, 354), (348, 348), (354, 340), (358, 330), (360, 320), (356, 300), (354, 280), (346, 260)], None), ('right_arm_2_hand', 24, [(350, 354), (362, 354), (370, 352), (394, 348), (405, 340), (480, 330), (500, 622), (410, 622), (408, 600), (410, 590), (404, 580), (404, 570), (405, 560), (405, 550), (404, 540), (409, 530), (418, 520), (421, 510), (417, 500), (412, 490), (406, 480), (399, 470), (390, 460), (388, 450), (387, 440), (379, 430), (377, 420), (375, 410), (368, 400), (362, 390), (352, 380), (349, 370), (350, 362)], None), ('left_leg_2_foot', 12, [(80, 742), (250, 742), (272, 760), (272, 912), (80, 912)], None), ('right_leg_2_foot', 16, [(272, 760), (330, 744), (410, 742), (480, 760), (480, 912), (272, 912)], None), ('left_leg_1_calf', 11, [(176, 644), (244, 644), (250, 700), (250, 742), (150, 742)], None), ('right_leg_1_calf', 15, [(321, 646), (390, 646), (400, 700), (410, 742), (330, 744)], None), ('left_leg_0_thigh', 10, [(186, 540), (205, 541), (240, 540), (260, 544), (280, 547), (296, 549), (296, 642), (244, 644), (176, 644), (184, 600)], None), ('right_leg_0_thigh', 14, [(296, 549), (310, 549), (320, 548), (340, 546), (360, 544), (370, 541), (380, 537), (392, 540), (404, 600), (390, 646), (321, 646), (300, 620)], None)]}
TRUNK = ("torso_0_trunk", 2)


def swap(name):
    if name.startswith("left_"):
        return "right_" + name[5:]
    if name.startswith("right_"):
        return "left_" + name[6:]
    return name


def mirror_rig(rig):
    """rig.json points for the mirrored drawing: x -> W - x, and L/R swapped."""
    W = CANVAS[0]
    mx = lambda pt: [W - pt[0], pt[1]]
    out = {}
    for k, v in rig.items():
        if k.startswith("_") or k == "out":
            out[k] = v
            continue
        nk = k[:-1] + ("R" if k.endswith("L") else "L") if k[-1:] in "LR" and k not in ("root",) else k
        out[nk] = {"at": mx(v["at"]), "dir": mx(v["dir"])} if isinstance(v, dict) else mx(v)
    # the thrown prop hangs off the LEFT hand bone whatever the mirror did
    out["prop"] = [out["handL"][0] + 5, out["handL"][1] + 18]
    return out


# Pieces whose area must be PAINTED on the piece below rather than just
# underlaid at the rim: a bubble that shrinks to nothing uncovers its whole
# footprint, not 26px of it. Only inside the head's own silhouette — where the
# bubble stood out into the air, nothing is painted.
INPAINT_UNDER = {}


def colour_ok(kind, rgb):
    if kind == "bubble":
        r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
        pink = (r > 215) & (g > 85) & (g < 135) & (b > 65) & (b < 110)
        lab, n = ndimage.label(pink)
        if n == 0:
            return pink
        sizes = ndimage.sum(pink, lab, range(1, n + 1))
        blob = ndimage.binary_fill_holes(lab == sizes.argmax() + 1)
        # one pixel more, for the anti-aliased rim
        return ndimage.binary_dilation(blob, iterations=1)
    if kind == "scarf":
        r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
        return (r > 140) & (r - g > 60) & (r - b > 70)
    return np.ones(rgb.shape[:2], bool)


def main(cast):
    src = os.path.join(APP, "design", "cast_delivery", f"{cast}_full_source.png")
    out = os.path.join(APP, "design", "source", cast)
    os.makedirs(out, exist_ok=True)
    for name in os.listdir(out):
        if name.endswith(".png") and not name.startswith("head_2_face_"):
            os.remove(os.path.join(out, name))

    im = Image.open(src).convert("RGBA").resize(CANVAS, Image.LANCZOS)
    cuts = CUTS[cast]
    if MIRROR:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
        cuts = [(swap(n), z, [(CANVAS[0] - x, y) for x, y in poly], kind) for n, z, poly, kind in cuts]
    px = np.array(im)
    alpha = px[..., 3] > ALPHA_FLOOR
    rgb = px[..., :3]

    owner = np.full(alpha.shape, -1, int)
    pieces = []
    for i, (name, z, poly, kind) in enumerate(cuts):
        m = Image.new("L", CANVAS, 0)
        ImageDraw.Draw(m).polygon(poly, fill=255)
        mask = (np.array(m) > 0) & alpha & (owner < 0) & colour_ok(kind, rgb)
        owner[mask] = i
        pieces.append((name, z))
    trunk_i = len(pieces)
    owner[alpha & (owner < 0)] = trunk_i
    pieces.append(TRUNK)

    # Scraps: a polygon edge that clips a boot lace or a trouser hem leaves a
    # small island in the wrong piece, which would then float with that piece.
    # Keep each piece's main body; hand every island under 3% of it to the
    # nearest OTHER piece.
    for _round in range(2):
        for k in range(len(pieces)):
            lab, n = ndimage.label(owner == k)
            if n <= 1:
                continue
            sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
            keep = sizes.max() * 0.03
            for idx, size in enumerate(sizes, start=1):
                if size >= keep:
                    continue
                isl = lab == idx
                other = (owner >= 0) & (owner != k)
                _, (iy, ix) = ndimage.distance_transform_edt(~other, return_indices=True)
                owner[isl] = owner[iy[isl], ix[isl]]

    layers = []
    rebuilt = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    by_z = sorted(range(len(pieces)), key=lambda k: pieces[k][1])
    for k in by_z:
        name, z = pieces[k]
        own = owner == k
        if not own.any():
            print(f"  WARNING {name}: empty")
            continue
        # underlay: under every piece drawn above this one, within UNDERLAY px
        above = np.zeros_like(own)
        for j, (_, zj) in enumerate(pieces):
            if zj > z:
                above |= owner == j
        dist, (iy, ix) = ndimage.distance_transform_edt(~own, return_indices=True)
        grow = above & (dist <= UNDERLAY)
        # a piece listed in INPAINT_UNDER gets its whole footprint painted on
        # this one, within this piece's own (closed) silhouette
        for top, under in INPAINT_UNDER.items():
            if under != name:
                continue
            tops = [j for j, (n2, _) in enumerate(pieces) if n2 == top]
            if not tops:
                continue
            foot = owner == tops[0]
            inside = ndimage.binary_closing(own | foot, iterations=14) & ndimage.binary_fill_holes(
                ndimage.binary_closing(own, iterations=18))
            grow = grow | (foot & inside)
        layer = np.zeros_like(px)
        layer[own] = px[own]
        layer[grow, :3] = px[iy[grow], ix[grow], :3]
        layer[grow, 3] = 255
        # SPECKS: underlay can reach past a gap of some other piece and land as
        # a detached fleck, which then floats beside the limb whenever it
        # moves (the green dots by the knees and hands). Keep only underlay
        # that touches this piece's own pixels.
        lab, n = ndimage.label(layer[..., 3] > 0)
        if n > 1:
            keep_ids = np.unique(lab[own])
            drop = (lab > 0) & ~np.isin(lab, keep_ids)
            layer[drop] = 0
        ys, xs = np.nonzero(layer[..., 3] > 0)
        x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        piece = Image.fromarray(layer[y0:y1, x0:x1])
        piece.save(os.path.join(out, f"{name}.png"))
        layers.append({"z": z, "name": name, "file": f"{name}.png", "x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0)})
        rebuilt.alpha_composite(piece, (int(x0), int(y0)))
        print(f"  {name:24s} z{z:<3d} box ({x0},{y0}) {x1 - x0}x{y1 - y0}  own {own.sum()}  underlay {grow.sum()}")

    layers.sort(key=lambda l: l["z"])
    rig = json.load(open(os.path.join(APP, "design", "cast_cut", f"{cast}_rig.json")))
    json.dump(mirror_rig(rig) if MIRROR else rig, open(os.path.join(out, "rig.json"), "w"), indent=1)
    json.dump({"canvas": list(CANVAS), "layers": layers}, open(os.path.join(out, "layers.json"), "w"), indent=1)

    # the proof nothing was dropped: source | rebuild | difference
    diff = np.abs(np.array(rebuilt).astype(int) - px.astype(int))[..., :3].sum(-1)
    lost = (alpha & (np.array(rebuilt)[..., 3] < 128)).sum()
    cmp_ = Image.new("RGBA", (CANVAS[0] * 2, CANVAS[1]), (70, 70, 70, 255))
    cmp_.alpha_composite(im, (0, 0))
    cmp_.alpha_composite(rebuilt, (CANVAS[0], 0))
    cmp_.save(os.path.join(out, "_compare.png"))
    print(f"{cast}: {len(layers)} pieces, opaque pixels lost {lost}, max colour diff in figure {int(diff[alpha].max())}")


if __name__ == "__main__":
    main(sys.argv[1])
