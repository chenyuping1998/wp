"""Build Turf War's own cast rigs — one per drawing, because the three drawings are
two different poses and even the two shoulder poses hold the bat 25-30px apart.

    python design/rig/build_turf_rigs.py feature [--out DIR]

Why not Capo's rig: it was built for the Don (arms hanging at his sides). On Turf's
art its forearm bones land in empty space, the clasped hands and the bat are owned
by the chest/hips, and the shoulder bat by the head. See mesh-cast-rig SKILL.md.

Method (mesh-cast-rig §1-2, adapted):
  * finer grid (32x80, 16x12.8px cells) so a ~30px bat is two cells, not one
  * spine HEIGHTS by the skill's rule (root at the lowest opaque row, head 4.1% of
    the box below its top, five equal segments); spine X by hand from the torso —
    the row-midpoint rule is poisoned here by the bat and raised arm
  * parts painted as polygons over the art; every pixel gets a label, transparent
    pixels take their nearest opaque label, so a moving prop stretches the AIR
    around it rather than itself
  * a vertex's weight = fraction of labels in its cell-sized window; parts map to
    bones, the rest of the body blends between spine joints by height
  * rigid props: bat + hand + raised forearm share ONE bone, so the bat can never
    hinge at the wrist (the raygun bug, §2)
"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

APP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GRID = (32, 80)

SPINE_Y = {"root": 838.0, "hips": 693.8, "waist": 549.5, "chest": 405.3, "neck": 261.1, "head": 116.8}

CONFIG = {
    # 2026-09-14 redraw (ART_BRIEF_CAST_RIG.md): the bat belongs to ONE hand and never
    # passes behind the hood. Coordinates read off gridded crops of the delivered art.
    "feature": {
        "texture": "static/assets/sprites/turfCast/guy_feature.png",
        "spine_x": {"root": 300, "hips": 300, "waist": 305, "chest": 305, "neck": 302, "head": 305},
        "limbs": {  # bone: (x, y, parent)
            # The raised arm is folded flat — upper arm and forearm lie on top of each
            # other, one wedge from shoulder to elbow and back up to the fist. Splitting
            # it at the elbow would shear the wedge, so the whole arm rides arm_l and
            # fore_l pivots IN THE FIST: the bat rocks in the hand.
            "arm_l": (258, 262, "neck"),
            "fore_l": (238, 220, "arm_l"),
            "arm_r": (350, 255, "neck"),
            "fore_r": (388, 395, "arm_r"),
            "hair": (272, 445, "waist"),
        },
        # label -> (bone, polygon). Later entries win; the bat matte is applied last.
        "parts": [
            ("arm_l",  [(262, 210), (262, 260), (250, 330), (196, 340), (178, 300), (200, 245), (232, 215)]),
            ("fore_l", [(216, 186), (252, 186), (262, 212), (250, 236), (222, 238), (214, 212)]),   # fist
            ("arm_r",  [(330, 230), (372, 245), (400, 330), (400, 400), (365, 405), (340, 330)]),
            ("fore_r", [(356, 395), (402, 395), (398, 440), (362, 442)]),                          # cuff
            ("hips",   [(338, 425), (375, 425), (375, 472), (338, 472)]),                          # hand in pocket stays put
            ("hair",   [(266, 440), (286, 446), (256, 522), (238, 516)]),                          # wallet chain
        ],
        # Unit "along the bone" for squash and stretch (castMotion.ts boneAxes), measured
        # off the drawing 2026-09-18: upper arm shoulder->elbow, forearm elbow->wrist.
        # None of these can be derived: arm_l's first child is the fist ABOVE it, fore_l
        # is a leaf pivoting in the fist, fore_r's wrist turns in to the pocket.
        "axes": {
            "arm_l": (195 - 258, 318 - 262),     # the folded wedge's long side
            "fore_l": (225 - 195, 228 - 318),    # elbow up to the wrist; the bat crosses it
            "arm_r": (388 - 350, 395 - 255),
            "fore_r": (365 - 388, 440 - 395),
        },
        # Without this the air under the barrel took the sleeve's label and the bat
        # thickened when lifted and thinned when lowered.
        "bat_margin": 18,
        "chain": {"attach": (272, 445), "length": 75},
    },
    "base": {
        "texture": "static/assets/sprites/turfCast/guy.png",
        "spine_x": {"root": 297, "hips": 297, "waist": 295, "chest": 285, "neck": 290, "head": 290},
        "limbs": {
            "arm_l": (242, 235, "neck"),
            # The bat is PLANTED. Parented through the spine, a 4deg lean swung its foot
            # 30-60px and the air between bat and shoe smeared it into a whip. So the fist
            # and bat hang off ROOT and stay on the ground; the upper body's motion is
            # absorbed along the forearm (the arm_l>fore_l ramp below), which is how a man
            # leaning on a bat actually moves. fore_l pivots in the fist: the bat rocks.
            "fore_l": (190, 448, "root"),
            "arm_r": (330, 235, "neck"),
            "fore_r": (350, 365, "arm_r"),
            "hair": (322, 445, "waist"),
        },
        "parts": [
            ("arm_l",        [(236, 205), (250, 232), (244, 300), (236, 352), (222, 372), (190, 372), (192, 320), (205, 262)]),
            ("arm_l>fore_l", [(190, 350), (236, 350), (244, 392), (236, 425), (212, 440), (168, 440), (170, 400)]),
            ("fore_l",       [(165, 425), (215, 425), (212, 480), (165, 482)]),                    # fist
            ("arm_r",        [(318, 205), (348, 228), (372, 300), (368, 360), (334, 366), (328, 300), (322, 250)]),
            ("fore_r",       [(328, 352), (368, 352), (362, 425), (336, 428), (330, 390)]),
            ("hips",         [(316, 422), (360, 422), (358, 475), (318, 475)]),                    # hand in pocket
            ("hair",         [(316, 440), (330, 436), (362, 512), (350, 524)]),                    # wallet chain
        ],
        # measured 2026-09-18, see the feature entry. arm_l has no child on this rig (the
        # fist hangs off root), so its derived axis would point back at the neck.
        "axes": {
            "arm_l": (215 - 242, 360 - 234),
            "fore_l": (193 - 215, 425 - 360),
            "arm_r": (350 - 330, 365 - 234),
            "fore_r": (343 - 350, 428 - 365),
        },
        # label "a>b": weight shared between a and b, ramping from a at y0 to b at y1
        "ramps": {"arm_l>fore_l": (360, 440)},
        # air within this many px of the bat matte rides with the bat (the gap to the
        # shoe is ~30px, so keep it under half of that)
        "bat_margin": 12,
        "chain": {"attach": (322, 445), "length": 80},
    },
}

CONFIG["kingpin"] = {**CONFIG["feature"], "texture": "static/assets/sprites/turfCast/guy_kingpin.png"}


def build(name, cfg):
    tex = Image.open(os.path.join(APP, cfg["texture"])).convert("RGBA")
    W, H = tex.size
    alpha = np.asarray(tex)[..., 3] > 40

    bones = []
    order = ["root", "hips", "waist", "chest", "neck", "head"]
    for i, b in enumerate(order):
        bones.append({"name": b, "x": float(cfg["spine_x"][b]), "y": SPINE_Y[b], "parent": i - 1})
    idx = {b["name"]: i for i, b in enumerate(bones)}
    for b, (x, y, parent) in cfg["limbs"].items():
        idx[b] = len(bones)
        bones.append({"name": b, "x": float(x), "y": float(y), "parent": idx[parent]})
        if b in cfg.get("axes", {}):
            ax_, ay_ = cfg["axes"][b]; n = math.hypot(ax_, ay_)
            bones[-1]["axis"] = [ax_ / n, ay_ / n]
    names = [b["name"] for b in bones]

    # label map: 0 = body (spine-blended), k = index into LABEL_BONES
    label_bones = sorted({bone for bone, _ in cfg["parts"]} | {"fore_l"})
    lab = np.zeros((H, W), np.int16)
    for bone, poly in cfg["parts"]:
        m = Image.new("L", (W, H), 0)
        ImageDraw.Draw(m).polygon(poly, fill=1)
        lab[(np.asarray(m) > 0) & alpha] = 1 + label_bones.index(bone)
    # The delivered prop matte is authoritative and is applied last. This keeps the
    # whole bat rigid on fore_l even where coarse part polygons touch the grip.
    mask_name = os.path.splitext(os.path.basename(cfg["texture"]))[0] + "_bat_mask.png"
    # Rigging-only input: kept out of static/ so it never ships in the game bundle.
    mask_path = os.path.join(APP, "design/rig/masks", mask_name)
    if os.path.exists(mask_path):
        bat = np.asarray(Image.open(mask_path).convert("L")) > 40
        lab[bat & alpha] = 1 + label_bones.index("fore_l")
    # transparent pixels inherit the nearest OPAQUE pixel's label
    _, (iy, ix) = ndimage.distance_transform_edt(~alpha, return_indices=True)
    filled = lab[iy, ix]
    if os.path.exists(mask_path) and cfg.get("bat_margin"):
        near_bat = ndimage.distance_transform_edt(~bat) < cfg["bat_margin"]
        filled[near_bat & ~alpha] = 1 + label_bones.index("fore_l")

    gx, gy = GRID
    cw, ch = W / gx, H / gy
    verts = [(i * cw, j * ch) for j in range(gy + 1) for i in range(gx + 1)]
    tris = []
    for j in range(gy):
        for i in range(gx):
            a = j * (gx + 1) + i; b = a + 1; c = a + gx + 1; d = c + 1
            tris += [[a, b, d], [a, d, c]]

    spine_sorted = sorted(((SPINE_Y[b], b) for b in order), key=lambda t: t[0])  # head .. root
    def spine_weights(y):
        w = np.zeros(len(names))
        if y <= spine_sorted[0][0]:
            w[idx[spine_sorted[0][1]]] = 1; return w
        if y >= spine_sorted[-1][0]:
            w[idx[spine_sorted[-1][1]]] = 1; return w
        for (y0, b0), (y1, b1) in zip(spine_sorted, spine_sorted[1:]):
            if y0 <= y <= y1:
                t = (y - y0) / (y1 - y0); w[idx[b0]] = 1 - t; w[idx[b1]] = t; return w

    ax, ay = cfg["chain"]["attach"]; clen = cfg["chain"]["length"]
    weights = []
    for (vx, vy) in verts:
        x0, x1 = int(max(0, vx - cw)), int(min(W, vx + cw))
        y0, y1 = int(max(0, vy - ch)), int(min(H, vy + ch))
        win = filled[y0:y1, x0:x1].ravel()
        counts = np.bincount(win, minlength=1 + len(label_bones)) / max(1, win.size)
        w = counts[0] * spine_weights(vy)
        for k, bone in enumerate(label_bones):
            f = counts[1 + k]
            if f <= 0: continue
            if ">" in bone:
                a_bone, b_bone = bone.split(">")
                r0, r1 = cfg["ramps"][bone]
                t = min(1.0, max(0.0, (vy - r0) / (r1 - r0)))
                w[idx[a_bone]] += f * (1 - t)
                w[idx[b_bone]] += f * t
                continue
            if bone == "hair":
                # The chain is ~6px wide on 16px cells, so raw coverage never exceeds ~0.3 and
                # the bone barely moved even at 30deg. Normalise by that ceiling. This also
                # drags the jeans under the chain, so the chain's swing has to stay small.
                f_eff = min(1.0, f / 0.3)
                t = min(1.0, math.hypot(vx - ax, vy - ay) / clen)   # roots barely move, tip swings
                take = min(f_eff, 1.0)
                w *= (1 - take * t)                                   # make room
                w[idx["hair"]] += take * t
                continue
            else:
                w[idx[bone]] += f
        w[w < 0.01] = 0
        w = w / w.sum()
        assert abs(w.sum() - 1) < 1e-9
        weights.append([round(float(v), 5) for v in w])
    # re-normalise after rounding
    weights = [[v / sum(row) for v in row] for row in weights]
    assert all(abs(sum(r) - 1) < 1e-6 for r in weights), "weights must sum to 1"

    ys, xs = np.nonzero(np.asarray(tex)[..., 3] > 90)
    rig = {"size": [W, H], "grid": [gx, gy], "bones": bones, "verts": [list(v) for v in verts],
           "tris": tris, "weights": weights, "plant_y": float(ys.max()),
           "figure_box": [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1],
           "image": os.path.basename(cfg["texture"])}
    return rig, tex


def overlay(rig, tex, path):
    COL = {"root": (120, 120, 120), "hips": (70, 110, 255), "waist": (40, 180, 255), "chest": (0, 220, 160),
           "neck": (160, 220, 0), "head": (255, 220, 0), "arm_l": (255, 120, 0), "fore_l": (255, 30, 30),
           "arm_r": (220, 0, 220), "fore_r": (150, 60, 255), "hair": (255, 255, 255)}
    names = [b["name"] for b in rig["bones"]]
    W, H = rig["size"]; lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for t in rig["tris"]:
        dom = [max(range(len(names)), key=lambda j: rig["weights"][i][j]) for i in t]
        b = max(set(dom), key=dom.count)
        d.polygon([tuple(rig["verts"][i]) for i in t], fill=COL[names[b]] + (110,))
    masked = Image.new("RGBA", (W, H), (0, 0, 0, 0)); masked.paste(lay, (0, 0), tex.split()[3])
    out = Image.alpha_composite(tex, masked); dd = ImageDraw.Draw(out)
    for b in rig["bones"]:
        if b["parent"] >= 0:
            p = rig["bones"][b["parent"]]; dd.line([(p["x"], p["y"]), (b["x"], b["y"])], fill=(255, 255, 255, 230), width=2)
    for b in rig["bones"]:
        c = COL[b["name"]]; dd.ellipse([b["x"] - 7, b["y"] - 7, b["x"] + 7, b["y"] + 7], fill=c + (255,), outline=(0, 0, 0, 255), width=2)
    bg = Image.new("RGBA", out.size, (40, 40, 40, 255)); bg.alpha_composite(out)
    bg.convert("RGB").save(path)


if __name__ == "__main__":
    which = sys.argv[1]
    outdir = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else os.path.join(APP, "static/assets/meshRigs/cast_guy")
    rig, tex = build(which, CONFIG[which])
    os.makedirs(outdir, exist_ok=True)
    stem = {"base": "guy", "feature": "guy_feature", "kingpin": "guy_kingpin"}[which]
    json.dump(rig, open(os.path.join(outdir, f"{stem}.rig.json"), "w"))
    overlay(rig, tex, os.path.join(outdir, f"{stem}_weights.png"))
    print(f"{stem}: {len(rig['verts'])} verts, {len(rig['tris'])} tris, bones {[b['name'] for b in rig['bones']]}")
