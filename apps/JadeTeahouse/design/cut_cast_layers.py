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
CUTS = {'mg': [('head_2_face', 30, [(170, 0), (440, 0), (440, 200), (350, 211), (315, 226), (267, 210), (196, 211), (160, 180)], None), ('left_arm_0_upper_arm', 22, [(150, 200), (200, 205), (198, 255), (194, 280), (194, 300), (192, 320), (192, 340), (190, 358), (187, 372), (140, 378), (100, 384), (60, 394), (40, 380), (80, 290), (130, 220)], None), ('left_arm_2_hand', 20, [(40, 380), (60, 394), (100, 384), (140, 378), (187, 372), (192, 385), (190, 400), (182, 415), (178, 430), (170, 460), (150, 500), (153, 520), (160, 540), (164, 560), (160, 580), (155, 600), (156, 625), (20, 625), (20, 380)], None), ('right_arm_0_upper_arm', 26, [(360, 205), (392, 232), (388, 260), (388, 290), (390, 320), (388, 350), (392, 370), (395, 390), (394, 420), (396, 440), (412, 440), (424, 422), (440, 408), (456, 400), (495, 396), (520, 380), (500, 280), (420, 220)], None), ('right_arm_2_hand', 24, [(396, 440), (412, 440), (424, 422), (440, 408), (456, 400), (495, 396), (520, 380), (520, 640), (432, 640), (432, 620), (430, 600), (424, 590), (421, 580), (418, 570), (417, 560), (424, 540), (428, 520), (424, 500), (414, 480), (408, 470), (404, 460), (400, 450)], None), ('left_leg_2_foot', 12, [(30, 822), (250, 820), (300, 830), (300, 912), (30, 912)], None), ('right_leg_2_foot', 16, [(300, 830), (340, 822), (440, 822), (540, 830), (540, 912), (300, 912)], None), ('left_leg_1_calf', 11, [(130, 742), (266, 736), (250, 820), (140, 822)], None), ('right_leg_1_calf', 15, [(306, 736), (445, 742), (440, 822), (350, 822)], None), ('left_leg_0_thigh', 10, [(160, 545), (180, 546), (220, 546), (260, 546), (270, 549), (280, 551), (290, 554), (294, 556), (294, 740), (130, 742), (150, 640), (160, 600)], None), ('right_leg_0_thigh', 14, [(294, 556), (300, 556), (310, 557), (330, 558), (340, 572), (350, 573), (360, 580), (370, 587), (380, 586), (390, 612), (400, 608), (406, 560), (420, 548), (430, 600), (445, 742), (306, 736), (294, 620)], None)], 'fg': [('head_2_face', 30, [(141, 0), (438, 0), (438, 237), (356, 226), (330, 234), (289, 230), (248, 216), (165, 221), (141, 190)], None), ('left_arm_0_upper_arm', 22, [(170, 232), (212, 240), (212, 250), (214, 290), (216, 310), (218, 330), (216, 350), (214, 365), (212, 392), (196, 384), (176, 372), (150, 368), (120, 364), (100, 350), (150, 260)], None), ('left_arm_2_hand', 20, [(100, 350), (120, 364), (150, 368), (176, 372), (196, 384), (212, 392), (214, 400), (205, 420), (200, 440), (190, 460), (176, 480), (166, 500), (161, 520), (168, 530), (174, 540), (168, 550), (172, 560), (172, 570), (170, 580), (163, 590), (162, 600), (160, 625), (30, 625), (30, 350)], None), ('right_arm_0_upper_arm', 26, [(340, 232), (380, 240), (430, 300), (445, 380), (440, 390), (420, 394), (394, 402), (376, 410), (356, 412), (355, 395), (354, 375), (356, 360), (358, 350), (360, 340), (360, 320), (360, 300), (358, 270), (352, 246)], None), ('right_arm_2_hand', 24, [(356, 412), (376, 410), (394, 402), (420, 394), (440, 390), (445, 380), (500, 380), (500, 630), (412, 630), (410, 610), (406, 600), (407, 590), (403, 580), (402, 570), (403, 560), (404, 550), (401, 540), (401, 530), (411, 520), (413, 510), (409, 500), (404, 490), (398, 480), (392, 470), (385, 460), (378, 450), (372, 440), (368, 430), (362, 420)], None), ('left_leg_2_foot', 12, [(60, 822), (250, 820), (290, 830), (290, 912), (60, 912)], None), ('right_leg_2_foot', 16, [(290, 830), (310, 822), (400, 820), (470, 830), (470, 912), (290, 912)], None), ('left_leg_1_calf', 11, [(136, 722), (290, 720), (250, 820), (140, 822)], None), ('right_leg_1_calf', 15, [(280, 722), (412, 722), (400, 820), (310, 822)], None), ('left_leg_0_thigh', 10, [(176, 526), (230, 528), (240, 543), (250, 551), (260, 554), (270, 558), (280, 563), (290, 566), (290, 720), (136, 722), (165, 640), (176, 600)], None), ('right_leg_0_thigh', 14, [(290, 566), (300, 568), (310, 572), (320, 575), (330, 578), (340, 592), (350, 594), (360, 624), (370, 630), (376, 600), (380, 572), (390, 564), (400, 558), (412, 600), (412, 722), (280, 722), (290, 640)], None)]}
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
