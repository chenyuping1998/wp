"""Repaint the body layer where the arms hide it (Swing Monkey, 2026-10-10).

cut_cast_layers.py extends every piece UNDER the pieces drawn above it by
copying each hidden pixel's nearest visible colour. Beside the Bandleader's
vest that copies the vest's stripes and ink sideways into streaks, and the
moment an arm swings out they show as a striped, broken flap beside the body
(design/source/<cast>/rig.json `underlay`). So, only where an arm or a glove
covers the body layer (never a pixel you can see at rest):

  1. the hidden band is repainted in plain fur, at most BAND px out from the
     body's own visible edge — the side of a monkey under its arm is fur;
  2. the band's new outer edge is inked like every edge in the painting;
  3. `hidden` strokes in rig.json are painted in: the Bandleader's tail runs
     behind his right glove and that stretch was never drawn, so whenever the
     hand moved the tail broke in two.

Works from the cut's own output, so run it after cut_cast_layers.py:

    python design/cut_cast_layers.py mg && python design/fill_cast_underlay.py mg
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

APP = Path(__file__).resolve().parents[1]
COVER = ("left_arm_0_upper_arm", "left_arm_2_hand", "right_arm_0_upper_arm", "right_arm_2_hand")


def main(cast: str) -> None:
    src = APP / "design/source" / cast
    rig = json.loads((src / "rig.json").read_text(encoding="utf-8"))
    cfg = rig.get("underlay")
    if not cfg:
        print(f"{cast}: no `underlay` in rig.json, nothing to do")
        return
    meta = json.loads((src / "layers.json").read_text(encoding="utf-8"))
    layer = {l["name"]: l for l in meta["layers"]}
    W, H = meta["canvas"]

    def canvas(name):
        l = layer[name]
        out = np.zeros((H, W, 4), np.uint8)
        out[l["y"]:l["y"] + l["h"], l["x"]:l["x"] + l["w"]] = np.array(Image.open(src / l["file"]).convert("RGBA"))
        return out

    trunk_l = layer["torso_0_trunk"]
    raw = src / "torso_0_trunk_raw.png"
    if not raw.exists():
        Image.open(src / trunk_l["file"]).save(raw)
    trunk = np.zeros((H, W, 4), np.uint8)
    trunk[trunk_l["y"]:trunk_l["y"] + trunk_l["h"], trunk_l["x"]:trunk_l["x"] + trunk_l["w"]] = np.array(Image.open(raw).convert("RGBA"))

    covered = np.zeros((H, W), bool)
    for name in COVER:
        if name in layer:
            covered |= canvas(name)[..., 3] > 24
    body = trunk[..., 3] > 24
    seen = body & ~covered            # what you see of the body at rest

    # 0. strays: fur strands of an arm that cross the narrow air beside the body
    # were cut onto the body; at rest they are part of the arm's edge, and once
    # the arm moves they stay behind as scratches. Hand every small piece of the
    # visible body that sits within STRAY px of an arm to that arm.
    stray_px = cfg.get("stray", 0)
    moved = 0
    arms = {n: canvas(n) for n in COVER if n in layer}
    if stray_px:
        lab, n = ndimage.label(seen)
        if n > 1:
            sizes = ndimage.sum(seen, lab, range(1, n + 1))
            main_id = int(sizes.argmax()) + 1
            for idx in range(1, n + 1):
                if idx == main_id or sizes[idx - 1] > cfg.get("strayMax", 400):
                    continue
                comp = lab == idx
                near = ndimage.binary_dilation(comp, iterations=stray_px)
                best = max(arms, key=lambda a: int((near & (arms[a][..., 3] > 24)).sum()))
                if not (near & (arms[best][..., 3] > 24)).any():
                    continue
                arms[best][comp] = trunk[comp]
                trunk[comp] = 0
                moved += int(comp.sum())
        for name, img in arms.items():
            l = layer[name]
            ys, xs = np.nonzero(img[..., 3] > 0)
            x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
            Image.fromarray(img[y0:y1, x0:x1]).save(src / l["file"])
            l.update({"x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0)})
        body = trunk[..., 3] > 24
        seen = body & ~covered
    hidden = body & covered           # what the arms hide

    fur = np.array(cfg["fur"], np.uint8)
    ink = np.array(cfg.get("ink", [22, 16, 12]), np.uint8)
    band = cfg.get("band", 14)
    edge = cfg.get("edge", 3)

    # 1. the hidden band: fur, within BAND px of the visible body. `bandNear`
    # (a colour distance) grows it only from visible body of that colour, so a
    # black jacket's band does not wrap the brown tail beside it.
    grow_from = seen
    if cfg.get("bandNear"):
        rgb = trunk[..., :3].astype(int)
        grow_from = seen & (np.abs(rgb - fur.astype(int)).sum(-1) <= cfg["bandNear"])
    dist = ndimage.distance_transform_edt(~grow_from)
    # `bandUnder`: only behind these pieces (the sleeves). Beside a forearm there
    # is real air between arm and body, and a band there is a stray dash.
    band_cover = covered
    if cfg.get("bandUnder"):
        band_cover = np.zeros((H, W), bool)
        for name in cfg["bandUnder"]:
            band_cover |= canvas(name)[..., 3] > 24
    keep = hidden & band_cover & (dist <= band)
    # a smooth outline: the arm's footprint is ragged with fur strands, and an
    # inked ragged edge reads as scratches beside the body
    if cfg.get("smooth", 0):
        r = cfg["smooth"]
        keep = ndimage.binary_opening(ndimage.binary_closing(keep | seen, iterations=r), iterations=r) & hidden
    # `legBand`: the same under the thighs and calves. Hidden at rest, but the
    # cut's fill there is crushed against the leg whenever the leg moves.
    if cfg.get("legBand") is not None:
        under_legs = np.zeros((H, W), bool)
        for name in ("left_leg_0_thigh", "left_leg_1_calf", "right_leg_0_thigh", "right_leg_1_calf"):
            if name in layer:
                under_legs |= canvas(name)[..., 3] > 24
        under_legs &= body & ~covered
        far_leg = under_legs & (ndimage.distance_transform_edt(~(body & ~covered & ~under_legs)) > cfg["legBand"])
    else:
        far_leg = np.zeros((H, W), bool)
    # drop any piece of band that does not touch the body that shows
    lab, n = ndimage.label(keep | seen)
    if n > 1:
        keep &= np.isin(lab, np.unique(lab[seen]))
    out = trunk.copy()
    out[hidden] = 0
    out[far_leg] = 0
    # `headBand`: under the head, keep only that much of the body's underlay
    # next to what shows; past it the cut's nearest-colour fill made a flap in
    # the jaw's shape that stuck out whenever the head turned
    if cfg.get("headBand") is not None and "head_2_face" in layer:
        under_head = body & (canvas("head_2_face")[..., 3] > 24) & ~covered
        far = under_head & (ndimage.distance_transform_edt(~(body & ~covered & ~under_head)) > cfg["headBand"])
        out[far] = 0
    out[keep, :3] = fur
    out[keep, 3] = 255

    # 3. hidden strokes (a tail behind a glove): fur with an inked rim, only under cover
    for stroke in cfg.get("hidden", []):
        m = Image.new("L", (W, H), 0)
        d = ImageDraw.Draw(m)
        pts = [tuple(p) for p in stroke["path"]]
        d.line(pts, fill=255, width=stroke["width"], joint="curve")
        for p in (pts[0], pts[-1]):
            r = stroke["width"] / 2
            d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=255)
        # a few px past the cover too: the glove's own ink is drawn ACROSS the
        # tail there, and left on the tail it shows as a dark wedge once the hand moves
        tail = (np.array(m) > 0) & ndimage.binary_dilation(covered, iterations=stroke.get("over", 0))
        # `box`: inside it the stretch is redrawn whole, one clean stroke, and
        # whatever the cut left there (slivers of the glove's ink) goes
        if stroke.get("box"):
            bx0, by0, bx1, by1 = stroke["box"]
            inbox = np.zeros((H, W), bool)
            inbox[by0:by1, bx0:bx1] = True
            out[inbox & ~covered & ~(np.array(m) > 0)] = 0
            tail = tail | ((np.array(m) > 0) & inbox)
        out[tail, :3] = np.array(stroke.get("fill", cfg["fur"]), np.uint8)
        out[tail, 3] = 255
        keep |= tail

    # 2. ink the new edge: repainted pixels within EDGE px of the air
    solid = out[..., 3] > 24
    near_air = ndimage.distance_transform_edt(solid) <= edge
    rim = keep & near_air
    out[rim, :3] = ink

    ys, xs = np.nonzero(out[..., 3] > 0)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    Image.fromarray(out[y0:y1, x0:x1]).save(src / trunk_l["file"])
    trunk_l.update({"x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0)})
    (src / "layers.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    print(f"{cast}: strays moved to arms {moved} px")
    print(f"{cast}: body under the arms {int(hidden.sum())} px -> fur band {int(keep.sum())} px, inked {int(rim.sum())}")


if __name__ == "__main__":
    main(sys.argv[1])
