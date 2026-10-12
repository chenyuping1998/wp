"""Clean the body layer where the arms cover it (both casts).

The cast were cut from one flat painting. The robe under each arm is complete,
with its own ink outline; but OUTSIDE that outline, where the arm lay, the cut
left SMEARS — edge pixels dragged sideways into horizontal streaks — with
transparent gaps between them. While the arms hang as drawn nobody sees them;
the moment an arm swings out (the throw, the cheer, the chest beat) they show
as black-and-white stripes and broken flaps beside the body
(design/check_cast_motion.mjs found them).

Painting over them was tried first (2026-10-09) and was wrong: a fill takes the
ARM's shape, so a robe-coloured flap stuck out where the arm had been, and it
cut the end off the sash. The robe needs nothing added. So this REMOVES them:

  1. smears: covered pixels in a horizontal run of SMEAR_RUN or more nearly
     identical pixels — real cloth is textured both ways, a smear is not;
  2. slivers: anything under an arm thinner than ~6px (an opening);
  3. islands: whatever is left in the covered area that is no longer joined
     to the body;
  4. gaps the robe encloses on both sides of a row are filled with cloth —
     the robe continues behind the forearm there;
  5. the edge this exposes is inked, like every edge in the painting.
(Rebuilding the robe's hidden side line by interpolation was tried and made
odd wedges; air between the arm and the robe is what is really there.)

Uncovered pixels are never touched, so the setup pose looks exactly as before.
The raw cut is kept as torso_0_trunk_raw.png; this always starts from it.

    python design/fill_cast_underlay.py
"""

import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

APP = Path(__file__).resolve().parents[1]
ARMS = ("left_arm_0_upper_arm", "left_arm_2_hand", "right_arm_0_upper_arm", "right_arm_2_hand")
# The robe's outline where the arms hid it, traced by hand on the painting
# (canvas px, 2026-10-09): rig.json `robeOutline` {left, right}. The left side's
# outline is drawn in both paintings; on the right the forearm covered it, and
# guessing it automatically made wedges. generate_monkey_spine.mjs reads the
# same lines and gives everything OUTSIDE them to the arms, so leftovers of the
# forearm that sit beside the robe at rest (fur, shadow) go with the arm.
SMEAR_RUN = 7
SMEAR_TOL = 10
THIN = 3


def largest_component(mask: np.ndarray) -> np.ndarray:
    h, w = mask.shape
    label = np.zeros((h, w), np.int32)
    best, best_n, n = 0, 0, 0
    for y0, x0 in zip(*np.nonzero(mask)):
        if label[y0, x0]:
            continue
        n += 1
        label[y0, x0] = n
        q = deque([(y0, x0)])
        size = 0
        while q:
            y, x = q.popleft()
            size += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not label[yy, xx]:
                    label[yy, xx] = n
                    q.append((yy, xx))
        if size > best_n:
            best, best_n = n, size
    return label == best


def clean(cast: str) -> None:
    src = APP / "design/source" / cast
    meta = json.loads((src / "layers.json").read_text(encoding="utf-8"))
    layer = {l["name"]: l for l in meta["layers"]}
    t = layer["torso_0_trunk"]
    raw_path = src / "torso_0_trunk_raw.png"
    if not raw_path.exists():
        raw_path.write_bytes((src / "torso_0_trunk.png").read_bytes())
    img = np.asarray(Image.open(raw_path).convert("RGBA")).astype(np.int32)
    h, w = img.shape[:2]
    outline = json.loads((src / "rig.json").read_text(encoding="utf-8"))["robeOutline"]

    # 0. THE ROBE STRIP IN THE RIGHT FOREARM PIECE. The cut put a strip of the
    #    robe's right edge into right_arm_2_hand, detached from the arm, so it
    #    swung away with the forearm. Every part of that piece not joined to
    #    the arm itself becomes its own piece, torso_1_strip — same pixels, same
    #    place, drawn at the forearm's own depth so the rest pose is identical —
    #    which generate_monkey_spine's /^torso_/ puts on the body.
    fa = layer["right_arm_2_hand"]
    fa_raw = src / "right_arm_2_hand_raw.png"
    if not fa_raw.exists():
        fa_raw.write_bytes((src / fa["file"]).read_bytes())
    arm = np.asarray(Image.open(fa_raw).convert("RGBA")).astype(np.int32)
    arm_main = largest_component(arm[..., 3] > 40)
    grown = arm_main.copy()
    for dy in range(-3, 4):
        for dx in range(-3, 4):
            grown |= np.roll(np.roll(arm_main, dy, 0), dx, 1)
    strip = (arm[..., 3] > 0) & ~grown
    meta["layers"] = [l for l in meta["layers"] if l["name"] != "torso_1_strip"]
    protected = np.zeros((h, w), bool)
    if strip.any():
        ys_, xs_ = np.nonzero(strip)
        y0, y1, x0, x1 = ys_.min(), ys_.max() + 1, xs_.min(), xs_.max() + 1
        px = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
        m = strip[y0:y1, x0:x1]
        px[m] = arm[y0:y1, x0:x1][m]
        Image.fromarray(px).save(src / "torso_1_strip.png", optimize=True)
        meta["layers"].append({"z": fa["z"] - 0.5, "name": "torso_1_strip", "file": "torso_1_strip.png",
                               "x": int(fa["x"] + x0), "y": int(fa["y"] + y0), "w": int(x1 - x0), "h": int(y1 - y0)})
        arm_clean = arm.copy()
        arm_clean[strip] = 0
        Image.fromarray(arm_clean.astype(np.uint8)).save(src / fa["file"], optimize=True)
        print(f"{cast}: split {int(strip.sum())} px of robe off the right forearm into torso_1_strip")

    cover = Image.new("L", (w, h), 0)
    for name in ARMS:
        a = layer[name]
        alpha = Image.open(src / a["file"]).convert("RGBA").getchannel("A").point(lambda v: 255 if v > 40 else 0)
        cover.paste(alpha, (a["x"] - t["x"], a["y"] - t["y"]), alpha)
    # pulled IN a little: the arm's soft fur edge is not where its cover ends
    cover = np.asarray(cover.filter(ImageFilter.MinFilter(3))) > 0

    # 1. smears: long horizontal runs of nearly the same pixel, under an arm
    opaque = img[..., 3] > 8
    same = np.zeros((h, w), bool)
    same[:, 1:] = (np.abs(img[:, 1:, :3] - img[:, :-1, :3]).sum(-1) < SMEAR_TOL) & opaque[:, 1:] & opaque[:, :-1]
    smear = np.zeros((h, w), bool)
    for y in range(h):
        run = 0
        for x in range(w):
            run = run + 1 if same[y, x] else 0
            if run >= SMEAR_RUN - 1:
                smear[y, x - run: x + 1] = True
    smear &= cover & ~protected

    out = img.copy()
    out[smear, 3] = 0

    # 3. slivers and scribbles: anything under an arm, outside the rebuilt
    #    robe, thinner than 2*THIN px (a morphological opening)
    solid = out[..., 3] > 128
    def shift_all(m, r, op):
        acc = m.copy()
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if dy * dy + dx * dx <= r * r:
                    sh = np.roll(np.roll(m, dy, 0), dx, 1)
                    acc = (acc & sh) if op == "and" else (acc | sh)
        return acc
    opened = shift_all(shift_all(solid, THIN, "and"), THIN, "or")
    thin = solid & ~opened & cover & ~protected
    out[thin, 3] = 0
    # 4. islands cut off from the body, inside the covered area
    body = largest_component(out[..., 3] > 128)
    stray = (out[..., 3] > 0) & ~body & cover
    out[stray, 3] = 0
    # 5. gaps ENCLOSED by robe on both sides of a row, under an arm: the
    #    robe continues behind the forearm there, so it is cloth, not air.
    #    Filled from the visible cloth round them (a diffusion fill). And on
    #    the right, out to the traced side line; beyond it, air.
    solid = out[..., 3] > 128
    hole = np.zeros((h, w), bool)
    for y in range(h):
        xs = np.where(solid[y])[0]
        if len(xs) > 1:
            hole[y, xs[0]: xs[-1] + 1] = True
    pts = [(x - t["x"], y - t["y"]) for x, y in outline["right"]]
    line = np.full(h, -1.0)
    ys = [p[1] for p in pts]
    for y in range(max(0, ys[0]), min(h, ys[-1] + 1)):
        line[y] = np.interp(y, ys, [p[0] for p in pts])
    beyond = np.zeros((h, w), bool)
    for y in range(h):
        if line[y] < 0:
            continue
        x = int(round(line[y]))
        hole[y, w // 2: x + 1] = True
        beyond[y, x + 1:] = True
    out[beyond & cover & ~protected, 3] = 0
    solid = out[..., 3] > 128
    hole &= ~solid & cover
    lum = img[..., :3] @ np.array([0.299, 0.587, 0.114])
    cloth = solid & ~cover & (lum > 150)
    rgb = img[..., :3].astype(np.float64).copy()
    have = cloth.copy()
    rgb[~have] = 0
    for _ in range(600):
        acc = np.zeros_like(rgb)
        cnt = np.zeros((h, w))
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            sh = np.roll(np.roll(have, dy, 0), dx, 1)
            acc += np.roll(np.roll(rgb, dy, 0), dx, 1) * sh[..., None]
            cnt += sh
        grow = (hole | (cover & solid & ~cloth)) & ~have & (cnt > 0)
        if not grow.any():
            break
        rgb[grow] = acc[grow] / cnt[grow][:, None]
        have |= grow
    out[hole, :3] = (rgb[hole] * 0.94).astype(np.int32)
    out[hole, 3] = 255

    # 6. ink the edge the cleanup exposed: wherever the robe now meets air
    #    that used to be smear, as every edge in the painting is drawn
    solid = out[..., 3] > 128
    was = img[..., 3] > 128
    exposed_air = ~solid & was
    near = np.zeros((h, w), bool)
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            if dy * dy + dx * dx <= 4:
                near |= np.roll(np.roll(exposed_air, dy, 0), dx, 1)
    rim = solid & near & cover
    out[rim, :3] = (40, 36, 32)

    # 7. once more, last: slivers and loose scraps under the arms — the fill
    #    and the inked edge can leave a one-pixel zigzag hanging off the robe
    solid = out[..., 3] > 128
    opened = shift_all(shift_all(solid, THIN, "and"), THIN, "or")
    late = solid & ~opened & cover & ~protected
    out[late, 3] = 0
    body = largest_component(out[..., 3] > 128)
    out[(out[..., 3] > 0) & ~body & cover, 3] = 0
    # soft leftovers (alpha 1..128) outside the solid robe, under the arms
    near_solid = shift_all(out[..., 3] > 128, 1, "or")
    out[(out[..., 3] > 0) & ~near_solid & cover, 3] = 0
    out[out[..., 3] == 0, :3] = 0
    # 8. LEFTOVERS OF THE LEFT ARM. Outside the robe's drawn left outline the
    #    trunk still holds bits of the forearm and its shadow (fur, strokes)
    #    that sit beside the robe at rest. Removing them opened a strip of
    #    background at rest; weighting them to the arm tore the mesh. So they
    #    MOVE into two small pieces of their own, rigid on the arm bones
    #    (left_arm_0_shade on the upper arm, left_arm_1_shade on the forearm,
    #    matched by generate_monkey_spine's /^left_arm_0/ and /^left_arm_(1|2)/),
    #    drawn just under the forearm. At rest nothing changes; in motion they
    #    go with the arm.
    lpts = [(x - t["x"], y - t["y"]) for x, y in outline["left"]]
    lys = [p[1] for p in lpts]
    leftover = np.zeros((h, w), bool)
    for y in range(max(0, lys[0]), min(h, lys[-1] + 1)):
        x = int(round(np.interp(y, lys, [p[0] for p in lpts])))
        leftover[y, : max(0, x - 1)] = True
    leftover &= out[..., 3] > 0
    fore = layer["left_arm_2_hand"]
    elbow = fore["y"] + 18 - t["y"]  # generate_monkey_spine jointOf (JOINT_INSET)
    meta["layers"] = [l for l in meta["layers"] if not l["name"].startswith(("left_arm_0_shade", "left_arm_1_shade"))]
    zs = {"left_arm_0_shade": layer["left_arm_2_hand"]["z"] - 2, "left_arm_1_shade": layer["left_arm_2_hand"]["z"] - 1}
    for name, band in (("left_arm_0_shade", leftover & (np.arange(h)[:, None] < elbow)),
                       ("left_arm_1_shade", leftover & (np.arange(h)[:, None] >= elbow))):
        if not band.any():
            continue
        ys_, xs_ = np.nonzero(band)
        y0, y1, x0, x1 = ys_.min(), ys_.max() + 1, xs_.min(), xs_.max() + 1
        piece_px = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
        sub = out[y0:y1, x0:x1].astype(np.uint8)
        m = band[y0:y1, x0:x1]
        piece_px[m] = sub[m]
        Image.fromarray(piece_px).save(src / f"{name}.png", optimize=True)
        meta["layers"].append({"z": zs[name], "name": name, "file": f"{name}.png",
                               "x": int(t["x"] + x0), "y": int(t["y"] + y0), "w": int(x1 - x0), "h": int(y1 - y0)})
    out[leftover, 3] = 0
    out[out[..., 3] == 0, :3] = 0
    (src / "layers.json").write_text(json.dumps(meta, indent=1, ensure_ascii=False) + chr(10), encoding="utf-8")
    print(f"{cast}: moved {int(leftover.sum())} px of left-arm leftovers onto the arm")

    Image.fromarray(out.astype(np.uint8)).save(src / "torso_0_trunk.png", optimize=True)
    print(f"{cast}: removed {int(smear.sum())} smeared + {int(thin.sum())} thin + {int(stray.sum())} stray px under the arms")


def main():
    for cast in ("mg", "fg"):
        clean(cast)


if __name__ == "__main__":
    main()
