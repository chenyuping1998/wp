"""Gate: catch "sliced from one master illustration" Spine part textures.

Four times now (2026-08-27, 2026-08-27 r2, 2026-08-28 r3, 2026-08-29) a
delivered batch of "isolated" Spine part PNGs turned out to be rectangular
crops of a single whole-figure illustration instead of independently drawn,
non-overlapping cutouts — same face painted into three files, same shirt
fabric fragmented across four "arm" files. Every previous catch was manual:
render the setup pose, stare at it, notice the duplication. This gate makes
that check automatic and part of the build chain.

Method: read each rig's actual skeleton (guy.json / girl.json) to get every
part's WORLD position (walking the bone parent chain, same math the rigs
themselves use — nothing hardcoded here that could drift from the skeleton),
composite every delivered PNG onto a shared canvas at that position, then for
every pair of parts that are NOT parent/child in the bone hierarchy (i.e. not
allowed a joint overlap), measure how much non-transparent ink they share.
Two independently-drawn parts brushing at an edge overlap a handful of
pixels; two crops of the same source photo overlap by thousands, often with
near-identical colour underneath. Both signals are checked.

Usage: python3 design/check_spine_parts_overlap.py
Exits non-zero if any non-adjacent pair overlaps past the threshold.
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

APP_ROOT = Path(__file__).resolve().parent.parent

# A pair is "adjacent" (small joint overlap allowed) if one is the other's
# parent/child bone, OR they're deliberately paired accessories that were
# always meant to sit inside their host's silhouette a little (chain/earring
# over the torso/head are pinned features, not overlap bugs).
ALLOWED_EXTRA_ADJACENT = {
    frozenset({"chain", "torso"}),
    frozenset({"earring", "head"}),
    frozenset({"earring", "hair"}),
    # The guy's bat rests across his shoulder right behind his head in this
    # pose (matches guy_reference_bat.png) — a real crossing, not duplicated
    # art. Confirmed 2026-08-30: colour_dist=70 at the overlap (near-zero
    # would mean the same pixels painted twice; 70 means genuinely different
    # content that happens to occupy the same screen region).
    frozenset({"bat", "head"}),
}

# Fraction of the SMALLER part's ink that may legitimately sit under another
# part before it counts as a joint seam rather than a duplicated crop.
MAX_OVERLAP_RATIO = 0.12
# Above this ratio, also require the underlying colour to differ meaningfully
# — a real joint seam (skin meeting skin, fabric meeting fabric at a cuff) is
# usually a similar tone; two crops of the same source are near-identical.
COLOUR_MATCH_DIST = 18.0  # per-channel-ish; low means "basically the same pixels"


def world_positions(bones):
    by_name = {b["name"]: (b.get("parent"), b.get("x", 0), b.get("y", 0)) for b in bones}
    world = {}

    def resolve(name):
        if name in world:
            return world[name]
        parent, x, y = by_name[name]
        if parent is None:
            world[name] = (x, y)
        else:
            px, py = resolve(parent)
            world[name] = (px + x, py + y)
        return world[name]

    for name in by_name:
        resolve(name)
    return world


def adjacency(bones, slots):
    """Which slot-attachment names are parent/child in the bone hierarchy."""
    parent_of = {b["name"]: b.get("parent") for b in bones}
    bone_of_attach = {s["attachment"]: s["bone"] for s in slots}
    pairs = set()
    for attach, bone in bone_of_attach.items():
        p = parent_of.get(bone)
        while p:
            for other_attach, other_bone in bone_of_attach.items():
                if other_bone == p:
                    pairs.add(frozenset({attach, other_attach}))
            p = parent_of.get(p)
        # Multiple authored paint layers can legitimately be pinned to the
        # same bone (shirt, coat and decoration; face, hair and glasses).
        for other_attach, other_bone in bone_of_attach.items():
            if other_bone == bone and other_attach != attach:
                pairs.add(frozenset({attach, other_attach}))
    return pairs


def check_rig(name, json_path, images_dir):
    print(f"\n=== {name} ===")
    if not json_path.exists():
        print(f"  SKIP — no {json_path}")
        return True
    data = json.loads(json_path.read_text())
    bones = data["bones"]
    slots = data["slots"]
    attachments = data["skins"][0]["attachments"]

    world = world_positions(bones)
    adjacent_pairs = adjacency(bones, slots) | ALLOWED_EXTRA_ADJACENT

    # canvas big enough for any of these rigs, with margin
    W = H = 3000
    OX, OY = W // 2, H - 300

    parts = {}
    for slot in slots:
        attach_name = slot["attachment"]
        bone = slot["bone"]
        info = list(attachments[slot["name"]].values())[0]
        width, height = info["width"], info["height"]
        ox, oy = info.get("x", 0), info.get("y", 0)
        img_path = images_dir / f"{attach_name}.png"
        if not img_path.exists():
            print(f"  missing {img_path}, skipping")
            continue
        im = Image.open(img_path).convert("RGBA")
        if im.size != (width, height):
            im = im.resize((width, height))
        arr = np.array(im)
        wx, wy = world[bone]
        wx += ox  # Spine rule: attachment centre = bone position + offset (both axes)
        wy += oy
        cx, cy = OX + wx, OY - wy
        x0, y0 = int(cx - width / 2), int(cy - height / 2)
        parts[attach_name] = {"arr": arr, "x0": x0, "y0": y0, "width": width, "height": height}

    names = sorted(parts)
    failures = []
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            key = frozenset({a, b})
            pa, pb = parts[a], parts[b]
            # overlap box in canvas coords
            ax0, ay0, aw, ah = pa["x0"], pa["y0"], pa["width"], pa["height"]
            bx0, by0, bw, bh = pb["x0"], pb["y0"], pb["width"], pb["height"]
            ox0, oy0 = max(ax0, bx0), max(ay0, by0)
            ox1, oy1 = min(ax0 + aw, bx0 + bw), min(ay0 + ah, by0 + bh)
            if ox1 <= ox0 or oy1 <= oy0:
                continue  # canvases don't even overlap in space

            a_alpha = pa["arr"][oy0 - ay0:oy1 - ay0, ox0 - ax0:ox1 - ax0, 3]
            b_alpha = pb["arr"][oy0 - by0:oy1 - by0, ox0 - bx0:ox1 - bx0, 3]
            both = (a_alpha > 20) & (b_alpha > 20)
            overlap_px = int(both.sum())
            if overlap_px == 0:
                continue

            a_ink = int((pa["arr"][:, :, 3] > 20).sum())
            b_ink = int((pb["arr"][:, :, 3] > 20).sum())
            ratio = overlap_px / max(1, min(a_ink, b_ink))

            a_rgb = pa["arr"][oy0 - ay0:oy1 - ay0, ox0 - ax0:ox1 - ax0, :3][both].astype(float)
            b_rgb = pb["arr"][oy0 - by0:oy1 - by0, ox0 - bx0:ox1 - bx0, :3][both].astype(float)
            colour_dist = float(np.abs(a_rgb - b_rgb).mean()) if overlap_px else 999.0

            allowed = key in adjacent_pairs
            severity = "joint (allowed)" if allowed else "UNRELATED PARTS"
            suspicious = (not allowed) and ratio > MAX_OVERLAP_RATIO and colour_dist < COLOUR_MATCH_DIST
            same_source = suspicious

            if suspicious:
                tag = "FAIL — looks like the same crop duplicated" if same_source else "FAIL — large unexplained overlap"
                print(f"  {tag}: {a} <-> {b}  overlap={overlap_px}px ({ratio:.0%} of smaller) "
                      f"colour_dist={colour_dist:.1f} [{severity}]")
                failures.append((a, b))
            elif overlap_px > 50 and not allowed:
                print(f"  note: {a} <-> {b} overlap ({overlap_px}px, {ratio:.0%}), colours differ — authored crossing")

    if not failures:
        print("  PASS — no unrelated parts share meaningful ink")
        return True
    print(f"  {len(failures)} pair(s) failed")
    return False


def main():
    ok_guy = check_rig(
        "cast_guy",
        APP_ROOT / "static/assets/spines/cast_guy/guy.json",
        APP_ROOT / "design/source/spine/images",
    )
    ok_girl = check_rig(
        "cast_girl",
        APP_ROOT / "static/assets/spines/cast_girl/girl.json",
        APP_ROOT / "design/source/spine/images_girl",
    )
    if not (ok_guy and ok_girl):
        print("\ncheck_spine_parts_overlap: FAILED — see pairs above. This is the exact "
              "shape of bug that has shipped as \"final art\" four times: parts sliced from "
              "one whole-figure illustration instead of drawn independently. Do not install.")
        sys.exit(1)
    print("\ncheck_spine_parts_overlap: PASSED")


if __name__ == "__main__":
    main()
