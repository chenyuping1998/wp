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
CUTS = {'mg': [('head_2_face', 30, [(100, 0), (445, 0), (445, 210), (360, 270), (285, 305), (200, 305), (105, 270), (90, 210)], None), ('left_arm_0_upper_arm', 22, [(90, 330), (138, 304), (160, 300), (168, 318), (166, 340), (166, 370), (166, 400), (162, 408), (130, 412), (100, 420), (80, 400)], None), ('left_arm_2_hand', 20, [(80, 400), (100, 420), (130, 412), (162, 408), (156, 425), (146, 438), (138, 452), (134, 465), (130, 478), (130, 495), (131, 532), (126, 538), (122, 545), (116, 560), (120, 600), (132, 615), (140, 640), (130, 700), (20, 700), (20, 420)], None), ('right_arm_0_upper_arm', 26, [(318, 322), (345, 305), (372, 330), (396, 370), (390, 374), (352, 400), (338, 412), (326, 408), (318, 400), (314, 380), (312, 360), (312, 340)], None), ('right_arm_2_hand', 24, [(396, 370), (390, 374), (352, 400), (338, 412), (334, 420), (346, 428), (352, 436), (358, 445), (366, 460), (376, 480), (383, 500), (390, 520), (392, 532), (384, 540), (380, 560), (372, 578), (366, 600), (358, 618), (348, 640), (350, 700), (470, 700), (466, 610), (452, 600), (452, 560), (445, 530), (440, 450)], None), ('left_leg_2_foot', 12, [(40, 788), (150, 788), (262, 786), (278, 800), (278, 912), (40, 912)], None), ('right_leg_2_foot', 16, [(278, 800), (320, 803), (400, 798), (530, 800), (530, 912), (278, 912)], None), ('left_leg_1_calf', 11, [(140, 715), (246, 715), (262, 786), (150, 788), (140, 760)], None), ('right_leg_1_calf', 15, [(270, 715), (380, 715), (400, 798), (320, 803), (300, 760)], None), ('left_leg_0_thigh', 10, [(140, 555), (160, 567), (180, 578), (200, 584), (220, 584), (246, 580), (246, 640), (246, 715), (140, 715), (150, 600)], None), ('right_leg_0_thigh', 14, [(246, 580), (260, 574), (280, 567), (300, 557), (320, 548), (342, 548), (344, 600), (342, 640), (350, 690), (380, 715), (270, 715), (246, 640)], None)], 'fg': [('head_2_face', 30, [(141, 0), (438, 0), (438, 237), (356, 226), (330, 236), (306, 246), (290, 254), (262, 256), (240, 256), (224, 252), (190, 240), (141, 190)], None), ('left_arm_0_upper_arm', 22, [(186, 262), (246, 262), (250, 280), (250, 300), (244, 330), (232, 350), (220, 362), (214, 358), (205, 350), (196, 338), (186, 324), (172, 316), (168, 305), (178, 290)], None), ('left_arm_2_hand', 20, [(172, 316), (186, 324), (196, 338), (205, 350), (214, 358), (204, 368), (190, 378), (160, 392), (130, 410), (100, 450), (0, 460), (0, 320), (160, 296)], None), ('right_arm_0_upper_arm', 26, [(312, 282), (332, 282), (368, 326), (372, 360), (366, 368), (354, 372), (342, 378), (330, 382), (322, 382), (324, 368), (324, 350), (318, 330), (312, 310)], None), ('right_arm_2_hand', 24, [(366, 368), (354, 372), (342, 378), (330, 382), (340, 392), (346, 400), (352, 410), (358, 420), (364, 430), (372, 440), (384, 448), (396, 456), (404, 462), (406, 474), (416, 484), (430, 492), (442, 498), (450, 504), (458, 510), (461, 520), (461, 540), (470, 556), (530, 556), (530, 486), (500, 488), (486, 488), (474, 478), (470, 470), (460, 462), (450, 446), (430, 430), (395, 395)], None), ('left_leg_2_foot', 12, [(140, 722), (180, 722), (204, 728), (234, 728), (250, 716), (300, 722), (356, 760), (356, 880), (140, 880)], None), ('right_leg_2_foot', 16, [(356, 760), (360, 748), (380, 768), (404, 768), (424, 748), (560, 748), (560, 912), (356, 912)], None), ('left_leg_1_calf', 11, [(218, 645), (278, 645), (262, 690), (250, 716), (234, 728), (204, 728), (196, 700)], None), ('right_leg_1_calf', 15, [(316, 645), (372, 645), (392, 690), (404, 716), (424, 748), (404, 768), (380, 768), (360, 748), (342, 700)], None), ('left_leg_0_thigh', 10, [(236, 556), (297, 556), (297, 600), (278, 645), (218, 645), (230, 600)], None), ('right_leg_0_thigh', 14, [(297, 556), (345, 556), (352, 580), (362, 620), (372, 645), (316, 645), (300, 600)], None)]}
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



