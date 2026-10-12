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
CUTS = {'mg': [('head_2_face', 30, [(120, 0), (430, 0), (430, 140), (340, 165), (333, 176), (326, 185), (316, 205), (300, 212), (200, 210), (170, 200), (130, 175)], None), ('left_arm_0_upper_arm', 22, [(40, 215), (110, 212), (150, 228), (165, 240), (165, 240), (148, 270), (146, 290), (146, 310), (147, 320), (150, 330), (153, 340), (158, 350), (163, 360), (165, 370), (166, 382), (166, 400), (140, 398), (120, 393), (102, 382), (70, 377), (40, 372), (40, 200)], None), ('left_arm_2_hand', 20, [(40, 372), (70, 377), (102, 382), (120, 393), (140, 398), (166, 400), (162, 420), (160, 440), (152, 460), (140, 480), (136, 500), (134, 520), (134, 560), (130, 600), (126, 640), (0, 640), (0, 372)], None), ('right_arm_0_upper_arm', 26, [(352, 246), (372, 238), (420, 222), (470, 234), (520, 262), (545, 330), (545, 360), (512, 364), (486, 371), (460, 382), (444, 392), (432, 400), (414, 402), (400, 394), (392, 382), (393, 370), (388, 360), (384, 350), (380, 340), (375, 330), (372, 320), (366, 300), (362, 290), (358, 275)], None), ('right_arm_2_hand', 24, [(414, 402), (432, 400), (444, 392), (460, 382), (486, 371), (512, 364), (545, 360), (545, 640), (432, 640), (432, 620), (428, 600), (417, 580), (415, 560), (416, 550), (418, 540), (425, 520), (425, 500), (422, 490), (424, 480), (425, 470), (418, 460), (410, 440), (412, 420), (414, 410)], None), ('left_leg_2_foot', 12, [(100, 778), (170, 778), (272, 772), (272, 870), (100, 870)], None), ('right_leg_2_foot', 16, [(372, 792), (455, 790), (500, 800), (500, 912), (372, 912)], None), ('left_leg_1_calf', 11, [(152, 712), (270, 705), (272, 772), (170, 778), (150, 760)], None), ('right_leg_1_calf', 15, [(318, 710), (450, 700), (455, 790), (380, 792), (325, 770)], None), ('left_leg_0_thigh', 10, [(130, 636), (168, 636), (240, 646), (256, 656), (278, 656), (270, 705), (152, 712), (130, 700)], None), ('right_leg_0_thigh', 14, [(278, 656), (300, 656), (320, 650), (372, 640), (430, 640), (450, 700), (318, 710), (278, 690)], None)], 'fg': [('head_2_face', 30, [(170, 0), (400, 0), (400, 190), (320, 200), (280, 212), (262, 222), (248, 222), (230, 218), (210, 205), (190, 180), (170, 150)], None), ('left_arm_0_upper_arm', 22, [(200, 240), (244, 244), (240, 262), (238, 280), (236, 300), (236, 320), (237, 340), (238, 360), (238, 380), (237, 392), (236, 410), (236, 418), (196, 424), (196, 300)], None), ('left_arm_2_hand', 20, [(150, 424), (196, 424), (236, 418), (233, 430), (231, 440), (222, 460), (218, 480), (214, 500), (214, 520), (214, 540), (213, 560), (219, 575), (221, 590), (222, 622), (150, 622)], None), ('right_arm_0_upper_arm', 26, [(290, 232), (332, 228), (360, 270), (362, 330), (362, 380), (372, 428), (326, 434), (322, 410), (320, 390), (318, 370), (309, 360), (307, 350), (302, 342), (300, 332), (296, 300), (290, 262)], None), ('right_arm_2_hand', 24, [(326, 434), (372, 428), (378, 470), (380, 520), (380, 550), (381, 560), (378, 570), (381, 580), (377, 590), (372, 600), (368, 622), (330, 622), (332, 610), (334, 600), (332, 590), (338, 580), (327, 570), (321, 550), (322, 520), (324, 500), (326, 470), (326, 450)], None), ('left_leg_2_foot', 12, [(170, 772), (240, 772), (282, 772), (292, 780), (298, 890), (170, 890)], None), ('right_leg_2_foot', 16, [(300, 772), (360, 770), (400, 790), (400, 900), (300, 900)], None), ('left_leg_1_calf', 11, [(226, 686), (282, 682), (282, 772), (240, 772)], None), ('right_leg_1_calf', 15, [(286, 684), (346, 682), (360, 770), (306, 772)], None), ('left_leg_0_thigh', 10, [(223, 568), (276, 568), (276, 644), (282, 682), (226, 686), (223, 640)], None), ('right_leg_0_thigh', 14, [(276, 568), (326, 568), (326, 612), (334, 644), (346, 682), (286, 684), (276, 644)], None)]}
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
