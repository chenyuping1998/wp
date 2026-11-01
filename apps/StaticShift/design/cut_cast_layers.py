"""Cut a single full-body cast drawing into the rig's layers.

    python3 design/cut_cast_layers.py mg|fg

Static Shift's two cast figures (the MG DJ and the FG host) exist as ONE flat
image each (static/assets/sprites/staticShiftCastInk/<cast>.png, the ink-pass
art), not as the layered PSD the Boomana rig was built from. Until 2026-10-20
they were drawn as a single mesh whose head slid on the neck — the body read as
stretching, not moving (user: 「只是身體伸縮，超級怪」). This does what extract_monkey_psd.py does
for a PSD, from polygons instead of layers:

  1. scale the drawing onto the rig's 560x912 canvas by HEIGHT, centred (these
     figures are narrower than Boomana's, so the sides are padded rather than
     the figure stretched); polygons and rig points are written in SOURCE
     pixels (design/cast_rig/<cast>_grid.png) and mapped here
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
# Joint overlap is independent of z-neighbour selection. The old 26px ends
# pulled apart at the knees in the full cheer crouch; paint farther underneath
# the actual adjoining calf/foot instead of restricting the animation.
LEG_JOINT_UNDERLAY = 64
ARM_UNDERLAY = 6
FEATHER = 4
INTERIOR = 5
INK_EDGE = 2
SMOOTH = 7
INK = (21, 25, 31)
# (Pickle note, kept for the mirror machinery:) Pickle's drawings face screen-RIGHT,
# so as delivered they turn their backs on it ("cast faces the board"). Mirror
# at cut time rather than flipping the skeleton: a flipped skeleton would also
# flip the throw, which has to go TOWARD the board (screen-left). Mirroring here
# keeps every animation as authored. Polygons and rig points below are written
# for the UNMIRRORED drawing (design/cast_cut/<cast>_grid.png); mirror() maps
# them and swaps left/right names.
# Static Shift's figures already turn toward the board (screen-left), as drawn.
MIRROR = False
ALPHA_FLOOR = 24

# (name, z, polygon on the 560x912 canvas, optional colour filter)
# z decides the draw order AND which neighbour hides which: the hand sits UNDER
# its sleeve (the cuff is drawn over the fur), legs and arms over the trunk.
SRC_SIZE = {"mg": (487, 1117), "fg": (629, 1122)}
# (name, z, polygon in SOURCE pixels, optional colour filter). First match wins.
# z decides draw order and which neighbour hides which: forearm under its
# sleeve, limbs over the trunk. Headphone cups (MG) stay on the trunk — they
# rest on his shoulders. The FG mic and its cable belong to her right forearm.
CUTS = {
    "mg": [
        ("head_2_face", 30, [(110, 0), (345, 0), (345, 130), (322, 165), (300, 180), (282, 188), (265, 212), (235, 224), (210, 211), (180, 202), (151, 181), (146, 155), (137, 152), (118, 135)], None),
        ("left_arm_0_upper_arm", 22, [(55, 235), (100, 275), (104, 345), (95, 400), (82, 462), (0, 462), (0, 320), (18, 262)], None),
        ("left_arm_2_hand", 20, [(0, 450), (86, 450), (92, 520), (98, 600), (100, 640), (85, 674), (30, 674), (4, 620), (0, 560)], None),
        ("right_arm_0_upper_arm", 26, [(395, 240), (430, 250), (447, 330), (447, 370), (462, 440), (466, 492), (400, 492), (390, 420), (380, 375), (390, 320)], None),
        ("right_arm_2_hand", 24, [(401, 480), (470, 480), (482, 560), (487, 620), (484, 664), (445, 674), (421, 640), (411, 620), (423, 585), (425, 555), (412, 520)], None),
        ("left_leg_2_foot", 12, [(0, 1005), (238, 1005), (238, 1117), (0, 1117)], None),
        ("right_leg_2_foot", 16, [(238, 1005), (487, 1005), (487, 1117), (238, 1117)], None),
        ("left_leg_1_calf", 11, [(30, 790), (234, 790), (234, 1012), (30, 1012)], None),
        ("right_leg_1_calf", 15, [(234, 790), (460, 790), (460, 1012), (234, 1012)], None),
        ("left_leg_0_thigh", 10, [(55, 610), (234, 610), (234, 795), (55, 795)], None),
        ("right_leg_0_thigh", 14, [(234, 610), (430, 610), (430, 795), (234, 795)], None),
    ],
    "fg": [
        ("head_2_face", 30, [(118, 0), (385, 0), (385, 168), (366, 200), (322, 200), (300, 176), (270, 172), (255, 186), (215, 176), (205, 200), (150, 200), (118, 170)], None),
        ("left_arm_0_upper_arm", 22, [(125, 190), (165, 186), (195, 215), (198, 300), (200, 402), (150, 412), (98, 405), (96, 330), (106, 250)], None),
        ("left_arm_2_hand", 20, [(108, 395), (186, 395), (179, 470), (166, 520), (178, 560), (180, 594), (168, 620), (158, 640), (140, 630), (104, 600), (108, 520)], None),
        ("right_arm_0_upper_arm", 26, [(345, 198), (375, 200), (405, 250), (440, 310), (470, 335), (470, 425), (445, 432), (405, 415), (398, 340), (385, 270)], None),
        ("right_arm_2_hand", 24, [(450, 330), (520, 262), (570, 198), (629, 190), (629, 332), (600, 346), (596, 500), (592, 722), (528, 722), (546, 480), (544, 356), (530, 332), (470, 416), (452, 418)], None),
        ("left_leg_2_foot", 12, [(0, 932), (292, 932), (292, 1122), (0, 1122)], None),
        ("right_leg_2_foot", 16, [(292, 932), (540, 932), (540, 1122), (292, 1122)], None),
        ("left_leg_1_calf", 11, [(50, 752), (302, 752), (302, 940), (50, 940)], None),
        ("right_leg_1_calf", 15, [(302, 752), (520, 752), (520, 940), (302, 940)], None),
        ("left_leg_0_thigh", 10, [(120, 585), (305, 585), (305, 760), (120, 760)], None),
        ("right_leg_0_thigh", 14, [(305, 585), (500, 585), (500, 760), (305, 760)], None),
    ],
}


def fit(cast):
    """source px -> canvas px: scale by height, centre horizontally"""
    w, h = SRC_SIZE[cast]
    s = CANVAS[1] / h
    ox = (CANVAS[0] - w * s) / 2
    return s, ox


def to_canvas(cast, pt):
    s, ox = fit(cast)
    return (round(ox + pt[0] * s, 1), round(pt[1] * s, 1))


def rig_to_canvas(cast, rig):
    out = {}
    for k, v in rig.items():
        if k.startswith("_") or k == "out":
            out[k] = v
        elif isinstance(v, dict):
            out[k] = {"at": list(to_canvas(cast, v["at"])), "dir": list(to_canvas(cast, v["dir"]))}
        else:
            out[k] = list(to_canvas(cast, v))
    return out


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
    src = os.path.join(APP, "static", "assets", "sprites", "staticShiftCastInk", f"{cast}.png")
    out = os.path.join(APP, "design", "source", cast)
    os.makedirs(out, exist_ok=True)
    for name in os.listdir(out):
        if name.endswith(".png"):
            os.remove(os.path.join(out, name))

    raw = Image.open(src).convert("RGBA")
    assert raw.size == SRC_SIZE[cast], f"{cast}: source is {raw.size}, CUTS were drawn on {SRC_SIZE[cast]}"
    sc, ox = fit(cast)
    im = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    im.alpha_composite(raw.resize((round(raw.width * sc), CANVAS[1]), Image.LANCZOS), (round(ox), 0))
    cuts = [(n, z, [to_canvas(cast, p) for p in poly], kind) for n, z, poly, kind in CUTS[cast]]
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

    # A limb is ONE connected anatomical piece. The former 3% cutoff kept
    # large islands of the adjacent shirt/trousers on the forearms and thighs.
    # Find all main components first, then return islands to the closest OTHER
    # piece's main component (never to another unclassified island).
    cores = np.full_like(owner, -1)
    for k in range(len(pieces)):
        lab, n = ndimage.label(owner == k)
        if not n:
            continue
        sizes = np.bincount(lab.ravel()); sizes[0] = 0
        cores[lab == sizes.argmax()] = k
    for k in range(len(pieces)):
        islands = (owner == k) & (cores != k)
        other = (cores >= 0) & (cores != k)
        if islands.any() and other.any():
            _, (iy, ix) = ndimage.distance_transform_edt(~other, return_indices=True)
            owner[islands] = cores[iy[islands], ix[islands]]

    rig = rig_to_canvas(cast, json.load(open(os.path.join(APP, "design", "cast_cut", f"{cast}_rig.json"))))

    # BODY STRIPS IN THE SLEEVE (2026-10-23, user screenshot: a straight grey
    # edge on the jacket beside the elbow). An upper-arm polygon drawn past the
    # sleeve's ink outline took a strip of the jacket with it; the trunk was
    # left with a cut edge and no outline. Any region of the upper-arm piece
    # that ink separates from the arm's axis belongs to the body.
    ink_px = rgb.max(-1) < 80
    yy0, xx0 = np.mgrid[0:CANVAS[1], 0:CANVAS[0]]
    for side, key in (("L", "left_arm"), ("R", "right_arm")):
        up = [j for j, (n, _) in enumerate(pieces) if n == f"{key}_0_upper_arm"][0]
        sx, sy = rig[f"shoulder{side}"]
        ex, ey = rig[f"elbow{side}"]
        vx, vy = ex - sx, ey - sy
        t = np.clip(((xx0 - sx) * vx + (yy0 - sy) * vy) / (vx * vx + vy * vy), 0, 1)
        dseg = np.hypot(xx0 - (sx + t * vx), yy0 - (sy + t * vy))
        lab, nl = ndimage.label((owner == up) & ~ink_px)
        for i in range(1, nl + 1):
            comp = lab == i
            if comp.sum() >= 60 and dseg[comp].min() > 8:
                owner[comp] = trunk_i
                print(f"  {key}: {comp.sum()} px of body handed back to the trunk")
    arm_ids = [j for j, (n, _) in enumerate(pieces) if "_arm_" in n]
    # shoulder discs: the joint opens as the upper arm turns, so the trunk keeps
    # real underlay there (0.4 x upper-arm length, the Pickle Panic MG value)
    yy, xx = np.mgrid[0:CANVAS[1], 0:CANVAS[0]]
    shoulder_keep = np.zeros(alpha.shape, bool)
    for side in "LR":
        sx, sy = rig[f"shoulder{side}"]
        ex, ey = rig[f"elbow{side}"]
        r = 0.4 * np.hypot(ex - sx, ey - sy)
        shoulder_keep |= (xx - sx) ** 2 + (yy - sy) ** 2 <= r * r

    # ELBOW JOINTS (2026-10-23, user: 「手肘好像會分離，動作越大越明顯」).
    # Upper arm and forearm are cut along a straight line, and the forearm turns
    # about the elbow point: a wedge opened on the outside of every bend, its
    # floor the forearm's smeared underlay with no outline. Two fixes:
    #  1. the pivot is moved to the MIDDLE of the arm's cross-section (it sat
    #     5-12px off-centre, so one side swung much further than the other);
    #  2. the forearm carries a disc about that pivot, radius half the arm's
    #     width, wherever the upper arm hides it at rest, cut from the drawing
    #     itself; the upper arm's cut edge is feathered onto it. Turning about
    #     its own centre, the disc fills the wedge at any angle and reads as a
    #     rounded elbow. The forearm's underlay is confined to the disc, so no
    #     smeared band slides out past the upper arm's sides.
    elbow_disc = {}
    for side, key in (("L", "left_arm"), ("R", "right_arm")):
        ids = [j for j, (n, _) in enumerate(pieces) if n.startswith(key)]
        arm = np.isin(owner, ids)
        ex, ey = rig[f"elbow{side}"]
        hx, hy = rig[f"hand{side}"]
        ux, uy = hx - ex, hy - ey
        norm = np.hypot(ux, uy)
        vx, vy = -uy / norm, ux / norm
        inside = []
        for t in range(-90, 91):
            x, y = int(round(ex + vx * t)), int(round(ey + vy * t))
            inside.append(0 <= x < CANVAS[0] and 0 <= y < CANVAS[1] and arm[y, x])
        t0 = t1 = 90
        while t0 > 0 and inside[t0 - 1]:
            t0 -= 1
        while t1 < 180 and inside[t1 + 1]:
            t1 += 1
        mid = (t0 + t1) / 2 - 90
        cx, cy = ex + vx * mid, ey + vy * mid
        r = (t1 - t0) / 2
        rig[f"elbow{side}"] = [round(cx, 1), round(cy, 1)]
        elbow_disc[key] = (cx, cy, r)
        print(f"  elbow{side}: pivot moved {mid:+.1f}px onto the arm's centre line, disc r {r:.0f}")

    layers = []
    rebuilt = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    by_z = sorted(range(len(pieces)), key=lambda k: pieces[k][1])
    for k in by_z:
        name, z = pieces[k]
        own = owner == k
        if not own.any():
            print(f"  WARNING {name}: empty")
            continue
        # Underpaint only the anatomical neighbour at the joint. Z order alone
        # is not adjacency: growing a thigh under the OTHER calf, or a hand
        # under the shirt/trousers, produced precisely the stray edge strips.
        above = np.zeros_like(own)
        neighbours = set()
        if name == TRUNK[0]:
            neighbours = {n for n, _ in pieces if n == 'head_2_face' or
                          '_arm_0_' in n or '_leg_0_' in n}
        elif '_leg_0_thigh' in name:
            neighbours.add(name.replace('_0_thigh', '_1_calf'))
        elif '_leg_1_calf' in name:
            neighbours.add(name.replace('_1_calf', '_2_foot'))
        elif '_arm_2_hand' in name:
            neighbours.add(name.replace('_2_hand', '_0_upper_arm'))
        for j, (other_name, zj) in enumerate(pieces):
            if zj > z and other_name in neighbours:
                above |= owner == j
        dist = ndimage.distance_transform_edt(~own)
        overlap = LEG_JOINT_UNDERLAY if '_leg_' in name or name == TRUNK[0] else UNDERLAY
        grow = above & (dist <= overlap)
        disc = None
        if "_arm_2_hand" in name:
            cx, cy, r = elbow_disc[name.split("_arm_")[0] + "_arm"]
            rr = np.hypot(xx - cx, yy - cy)
            disc = rr <= r
            upper = owner == [j for j, (n2, _) in enumerate(pieces) if n2 == name.replace("_2_hand", "_0_upper_arm")][0]
            # the disc lives only where the upper arm hides it at rest
            grow = disc & upper & ~own
        # GHOST ARMS (Static Shift 2026-10-21, gate check_cast_underlay.py):
        # under an ARM the underlay is only the body's own edge (ARM_UNDERLAY
        # px) plus, on the trunk, the shoulder disc. A full 26px band followed
        # the arm down and stood beside the body as a smeared second arm the
        # moment the arm swung out.
        if "_arm_" not in name:
            under_arm = np.isin(owner, arm_ids)
            keep = (dist <= ARM_UNDERLAY) | (shoulder_keep if name == TRUNK[0] else False)
            grow &= ~under_arm | keep
        # paint underlay from the piece's INTERIOR, not its rim: the nearest
        # pixel at the edge is the black outline, which smeared into dark bars
        inner = ndimage.binary_erosion(own, iterations=INTERIOR)
        if inner.sum() < 50:
            inner = own
        _, (iy, ix) = ndimage.distance_transform_edt(~inner, return_indices=True)
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
        # a smoothed average of the interior, not the single nearest pixel:
        # nearest-pixel copying drew the cloth out into stripes along the cut
        w = ndimage.gaussian_filter(inner.astype(float), SMOOTH)
        fill = px[iy, ix, :3].astype(float)
        for ch in range(3):
            avg = ndimage.gaussian_filter(px[..., ch] * inner, SMOOTH) / np.maximum(w, 1e-6)
            fill[..., ch] = np.where(w > 0.02, avg, fill[..., ch])
        layer[grow, :3] = fill[grow].clip(0, 255).astype(np.uint8)
        layer[grow, 3] = 255
        if disc is not None:
            # the disc is the drawing's own elbow, not a smoothed average: at
            # rest it is identical to what the upper arm covers, so the feathered
            # cut below blends into real pixels, and in a bend the arm's own
            # side outline turns with it and closes the wedge
            layer[grow, :3] = px[grow, :3]
        if "_arm_0_upper_arm" in name:
            # feather the cut to the forearm (not the drawn ink): a hard straight
            # edge across bare skin read as the arm coming apart in every bend
            fore = owner == [j for j, (n2, _) in enumerate(pieces) if n2 == name.replace("_0_upper_arm", "_2_hand")][0]
            d_fore = ndimage.distance_transform_edt(~fore)
            ink = px[..., :3].max(-1) < 70
            soft = own & (d_fore <= FEATHER) & ~ink
            layer[soft, 3] = (255 * (d_fore[soft] - 0.5) / FEATHER).clip(60, 255).astype(np.uint8)
        # re-ink the underlay's open edge, so a body side uncovered by a
        # swinging arm ends in a drawn line like every other edge
        solid = own | grow
        edge = grow & ndimage.binary_dilation(~solid, iterations=INK_EDGE)
        if disc is not None:
            # no drawn rim: the disc carries the arm's own side outlines (real
            # pixels, below), and an inked circle showed through the feathered
            # cut as dark specks at rest
            edge = np.zeros_like(grow)
        layer[edge, :3] = INK
        layer[edge, 3] = 255
        # SPECKS: underlay can reach past a gap of some other piece and land as
        # a detached fleck, which then floats beside the limb whenever it
        # moves (the green dots by the knees and hands). Keep only underlay
        # that touches this piece's own pixels.
        lab, n = ndimage.label(layer[..., 3] > 0)
        if n > 1:
            # Keep the connected anatomical core, rather than every component
            # containing an original pixel: that repeated the old island bug.
            sizes = np.bincount(lab[own]); sizes[0] = 0
            keep_id = sizes.argmax()
            drop = (lab > 0) & (lab != keep_id)
            layer[drop] = 0
        ys, xs = np.nonzero(layer[..., 3] > 0)
        x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        piece = Image.fromarray(layer[y0:y1, x0:x1])
        piece.save(os.path.join(out, f"{name}.png"))
        layers.append({"z": z, "name": name, "file": f"{name}.png", "x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0)})
        # Rebuild after sorting by runtime z order below.
        print(f"  {name:24s} z{z:<3d} box ({x0},{y0}) {x1 - x0}x{y1 - y0}  own {own.sum()}  underlay {grow.sum()}")

    layers.sort(key=lambda l: l["z"])
    rebuilt = Image.new("RGBA", CANVAS)
    for l in layers:
        rebuilt.alpha_composite(Image.open(os.path.join(out, l["file"])).convert("RGBA"), (l["x"], l["y"]))
    rebuilt.save(os.path.join(out, "_assembled.png"))
    json.dump(mirror_rig(rig) if MIRROR else rig, open(os.path.join(out, "rig.json"), "w"), indent=1)
    json.dump({"canvas": list(CANVAS), "layers": layers}, open(os.path.join(out, "layers.json"), "w"), indent=1)

    # the proof nothing was dropped: source | rebuild | difference
    diff = np.abs(np.array(rebuilt).astype(int) - px.astype(int))[..., :3].sum(-1)
    lost = ((px[..., 3] >= 128) & (np.array(rebuilt)[..., 3] < 128)).sum()
    cmp_ = Image.new("RGBA", (CANVAS[0] * 2, CANVAS[1]), (70, 70, 70, 255))
    cmp_.alpha_composite(im, (0, 0))
    cmp_.alpha_composite(rebuilt, (CANVAS[0], 0))
    cmp_.save(os.path.join(out, "_compare.png"))
    print(f"{cast}: {len(layers)} pieces, opaque pixels lost {lost}, max colour diff in figure {int(diff[alpha].max())}")


if __name__ == "__main__":
    main(sys.argv[1])
