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
CUTS = {'mg': [('head_2_face', 30, [(100, 0), (380, 0), (380, 236), (300, 244), (262, 250), (256, 262), (236, 276), (232, 283), (208, 287), (160, 286), (120, 252), (100, 232)], None), ('left_arm_0_upper_arm', 22, [(135, 300), (178, 314), (185, 338), (164, 348), (161, 360), (159, 370), (159, 380), (157, 390), (155, 400), (147, 410), (143, 420), (139, 430), (135, 440), (131, 450), (127, 458), (124, 463), (60, 458), (80, 420), (110, 350)], None), ('left_arm_2_hand', 20, [(60, 458), (124, 463), (121, 470), (117, 480), (121, 490), (123, 500), (119, 510), (114, 520), (112, 530), (116, 540), (118, 550), (120, 560), (124, 570), (130, 580), (135, 590), (140, 600), (141, 700), (20, 700), (20, 520), (45, 470)], None), ('right_arm_0_upper_arm', 26, [(298, 286), (345, 284), (385, 350), (415, 410), (440, 476), (358, 452), (352, 450), (346, 440), (341, 430), (336, 420), (331, 410), (327, 400), (321, 390), (307, 380), (305, 370), (301, 360), (300, 340), (304, 300)], None), ('right_arm_2_hand', 24, [(358, 452), (440, 476), (446, 520), (450, 555), (451, 580), (455, 595), (461, 605), (465, 615), (464, 660), (452, 700), (335, 700), (335, 650), (340, 620), (345, 610), (364, 600), (365, 590), (363, 580), (360, 570), (364, 560), (365, 550), (370, 540), (373, 530), (372, 520), (370, 510), (369, 500), (366, 490), (362, 480), (357, 470), (356, 460)], None), ('left_leg_2_foot', 12, [(60, 798), (176, 798), (186, 812), (256, 812), (270, 800), (276, 912), (60, 912)], None), ('right_leg_2_foot', 16, [(270, 806), (330, 818), (392, 818), (424, 800), (424, 912), (270, 912)], None), ('left_leg_1_calf', 11, [(148, 716), (242, 700), (260, 790), (256, 812), (186, 812), (176, 798), (150, 790)], None), ('right_leg_1_calf', 15, [(286, 723), (366, 708), (398, 800), (392, 818), (330, 818), (318, 800)], None), ('left_leg_0_thigh', 10, [(146, 606), (246, 606), (246, 640), (242, 700), (148, 716)], None), ('right_leg_0_thigh', 14, [(254, 606), (322, 600), (366, 708), (286, 723), (254, 640)], None)], 'fg': [('head_2_face', 30, [(150, 0), (390, 0), (390, 200), (340, 238), (296, 250), (286, 258), (268, 262), (248, 256), (238, 256), (222, 250), (196, 232), (170, 200), (150, 150)], None), ('left_arm_0_upper_arm', 22, [(186, 250), (244, 250), (240, 284), (236, 300), (233, 316), (227, 324), (221, 333), (216, 348), (208, 358), (204, 366), (172, 342), (160, 336), (176, 300), (186, 270)], None), ('left_arm_2_hand', 20, [(160, 336), (172, 342), (204, 366), (200, 380), (190, 400), (150, 450), (0, 460), (0, 330)], None), ('right_arm_0_upper_arm', 26, [(318, 282), (345, 280), (372, 330), (395, 371), (343, 401), (335, 390), (331, 382), (327, 374), (327, 366), (328, 358), (331, 350), (331, 342), (333, 334), (338, 326), (336, 318), (328, 300)], None), ('right_arm_2_hand', 24, [(343, 401), (395, 371), (437, 438), (452, 458), (472, 476), (500, 498), (548, 515), (548, 580), (488, 580), (468, 552), (458, 536), (456, 508), (447, 501), (426, 498), (400, 497), (380, 470), (360, 430)], None), ('left_leg_2_foot', 12, [(150, 722), (244, 720), (262, 740), (350, 745), (352, 870), (150, 870)], None), ('right_leg_2_foot', 16, [(352, 748), (356, 746), (400, 742), (420, 745), (548, 760), (548, 912), (352, 912)], None), ('left_leg_1_calf', 11, [(214, 656), (262, 648), (256, 700), (248, 720), (206, 724), (200, 700)], None), ('right_leg_1_calf', 15, [(310, 660), (366, 648), (392, 700), (404, 720), (400, 742), (356, 746), (336, 700)], None), ('left_leg_0_thigh', 10, [(247, 540), (289, 540), (289, 560), (288, 575), (282, 600), (268, 630), (262, 648), (214, 656), (226, 610), (234, 580), (244, 560)], None), ('right_leg_0_thigh', 14, [(289, 540), (336, 540), (334, 560), (346, 580), (352, 600), (362, 640), (366, 648), (310, 660), (300, 620), (290, 575)], None)]}
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
