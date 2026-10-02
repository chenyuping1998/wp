"""Cut a single full-body cast drawing into the rig's layers.

    python3 design/cut_cast_layers.py mg|fg

Go Banandit's two cast figures were delivered as ONE flat image each
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
MIRROR = True
ALPHA_FLOOR = 24

# (name, z, polygon on the 560x912 canvas, optional colour filter)
# z decides the draw order AND which neighbour hides which: the hand sits UNDER
# its sleeve (the cuff is drawn over the fur), legs and arms over the trunk.
CUTS = {
    "mg": [
        ("head_2_face", 30, [(170, 20), (440, 20), (440, 165), (395, 205), (350, 250), (300, 276), (255, 262), (225, 236), (205, 206), (170, 176)], None),
        ("left_arm_0_upper_arm", 22, [(70, 245), (120, 222), (165, 240), (178, 300), (170, 380), (160, 440), (152, 478), (25, 478), (22, 420), (40, 330)], None),
        ("left_arm_2_hand", 20, [(22, 470), (152, 470), (174, 520), (178, 612), (132, 645), (62, 634), (32, 572), (22, 520)], None),
        ("right_arm_0_upper_arm", 26, [(388, 235), (440, 235), (495, 285), (522, 370), (534, 450), (530, 492), (410, 492), (400, 430), (392, 330), (380, 260)], None),
        ("right_arm_2_hand", 24, [(412, 482), (538, 482), (550, 560), (542, 628), (470, 645), (428, 612), (418, 540)], None),
        ("left_leg_2_foot", 12, [(85, 760), (310, 760), (310, 900), (80, 900)], None),
        ("right_leg_2_foot", 16, [(316, 752), (558, 752), (558, 900), (316, 900)], None),
        ("left_leg_1_calf", 11, [(108, 650), (296, 650), (306, 765), (108, 770)], None),
        ("right_leg_1_calf", 15, [(318, 650), (452, 650), (442, 760), (320, 762)], None),
        ("left_leg_0_thigh", 10, [(122, 515), (300, 515), (300, 570), (292, 656), (134, 666), (118, 590)], None),
        ("right_leg_0_thigh", 14, [(300, 515), (452, 515), (452, 590), (442, 656), (330, 660), (300, 570)], None),
    ],
    "fg": [
        ("head_2_face", 30, [(150, 4), (425, 4), (425, 120), (412, 166), (372, 186), (330, 200), (290, 205), (250, 215), (200, 236), (158, 232), (148, 150)], None),
        # the scarf's loose tail crosses the right shoulder: its own layer, drawn
        # OVER the arm, so the arm does not carry it off when it swings
        ("torso_3_decoration", 28, [(378, 212), (442, 212), (505, 248), (510, 292), (472, 318), (432, 348), (392, 348), (378, 300)], "scarf"),
        ("left_arm_0_upper_arm", 22, [(128, 222), (186, 204), (206, 236), (201, 300), (191, 360), (177, 408), (66, 408), (78, 330), (100, 258)], None),
        ("left_arm_2_hand", 20, [(56, 398), (178, 398), (172, 480), (162, 560), (168, 645), (108, 645), (82, 582), (56, 482)], None),
        ("right_arm_0_upper_arm", 26, [(368, 214), (410, 214), (452, 250), (472, 300), (482, 360), (488, 428), (398, 428), (393, 360), (386, 280)], None),
        ("right_arm_2_hand", 24, [(392, 414), (492, 414), (518, 500), (524, 562), (504, 645), (428, 645), (408, 562), (398, 480)], None),
        ("left_leg_2_foot", 12, [(100, 738), (312, 738), (312, 905), (100, 905)], None),
        ("right_leg_2_foot", 16, [(328, 732), (505, 732), (505, 905), (328, 905)], None),
        ("left_leg_1_calf", 11, [(138, 660), (296, 660), (302, 752), (138, 752)], None),
        ("right_leg_1_calf", 15, [(318, 660), (448, 665), (442, 748), (328, 748)], None),
        ("left_leg_0_thigh", 10, [(138, 500), (300, 500), (300, 560), (290, 672), (148, 676), (132, 590)], None),
        ("right_leg_0_thigh", 14, [(300, 500), (462, 500), (462, 590), (446, 672), (318, 674), (300, 560)], None),
    ],
}
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


def colour_ok(kind, rgb):
    if kind == "scarf":
        r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
        return (r > 140) & (r - g > 60) & (r - b > 70)
    return np.ones(rgb.shape[:2], bool)


def main(cast):
    src = os.path.join(APP, "design", "cast_delivery", f"{cast}_full_source.png")
    out = os.path.join(APP, "design", "source", cast)
    os.makedirs(out, exist_ok=True)
    for name in os.listdir(out):
        if name.endswith(".png"):
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
        layer = np.zeros_like(px)
        layer[own] = px[own]
        layer[grow, :3] = px[iy[grow], ix[grow], :3]
        layer[grow, 3] = 255
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
