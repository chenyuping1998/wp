"""Extract cast_guy Spine parts from the player-supplied layered source.

design/source/spine/psd/spine-pieces-project-1.psd is a real layered file —
one body part per layer, 224x512, everything already mutually aligned since
it's one drawing. This pulls out the parts that are actually finished art
(not everything in the file is: see the module-level notes below) and drops
them straight into design/source/spine/images/, scaled and centred so each
one's bone offset in build_spine_guy_bat_pose.py can be (0, 0).

What's usable from this PSD (2026-08-30 inspection):
  torso, legs (left+right leg layers combined), head (face, with the hair
  mass baked in — no separate hair layer exists, just a small loose curl),
  that curl (used as hair_tip), and the whole right arm chain (upper arm,
  forearm, hand, bat).

What's NOT in this batch, still needed from someone:
  - left upper arm: no layer for it exists in the file at all.
  - left forearm / left hand: layers exist but are flat, undetailed colour
    blobs — placeholder quality, not finished art like everything else here.
  - a separate hair mass (independent of the face) and a separate chain —
    both are currently baked into other layers, which is fine visually but
    means they can't sway independently once real art is delivered for them.

The PSD's own layer NAMES are unreliable — "head · 3 — hat" is actually the
sunglasses, and right_arm's "hand"(0)/"forearm"(2) layers are swapped versus
their names (0 is the forearm, 2 is the fist). Every mapping below was
confirmed by looking at the actual pixel content and its position in the
full composite, not by trusting the layer name.

Usage: python3 design/extract_psd_parts.py
"""

from pathlib import Path

from PIL import Image
from psd_tools import PSDImage

APP_ROOT = Path(__file__).resolve().parent.parent
PSD_PATH = APP_ROOT / "design/source/spine/psd/spine-pieces-project-1.psd"
OUT_DIR = APP_ROOT / "design/source/spine/images"

# Uniform scale from PSD pixels to Spine world units. Chosen so the leg
# content (bbox height ~283px) fits inside the established 512-unit legs
# canvas with margin — same reasoning applies to every other part since they
# all share this one scale.
K = 1.6

# name -> (canvas size, list of PSD layer names to flatten together)
PARTS = {
    "torso": (512, [
        "torso · 1 — trunk", "torso · 0 — decoration", "torso · 2 — decoration",
        "torso · 3 — decoration", "torso · 4 — coat", "torso · 5 — coat",
    ]),
    "legs": (512, [
        "left_leg · 0 — thigh", "left_leg · 1 — calf", "left_leg · 2 — foot",
        "right_leg · 0 — thigh", "right_leg · 1 — calf", "right_leg · 2 — foot",
    ]),
    "head": (256, ["head · 5 — face"]),
    "hair_tip": (128, ["head · 0 — hair"]),  # the one loose curl, not the hair mass
    "arm_upper_r": (256, ["right_arm · 1 — upper_arm"]),
    "arm_lower_r": (256, ["right_arm · 0 — hand"]),   # mislabeled: this is the forearm
    "hand_r": (128, ["right_arm · 2 — forearm"]),      # mislabeled: this is the fist
    "bat": (384, ["Left weapon"]),
}


def load_layers(psd):
    layers = {}

    def walk(node):
        for l in node:
            if l.is_group():
                walk(l)
            else:
                layers[l.name] = l

    walk(psd)
    return layers


def layer_on_canvas(layer, canvas_size):
    canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    x0, y0, x1, y1 = layer.bbox
    img = layer.composite()
    if img is not None:
        canvas.alpha_composite(img, (x0, y0))
    return canvas


def content_bbox(img, threshold=60, pad=6):
    import numpy as np
    arr = np.asarray(img)
    ys, xs = np.where(arr[:, :, 3] > threshold)
    if len(xs) == 0:
        return 0, 0, img.width, img.height
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, img.width)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, img.height)
    return x0, y0, x1, y1


def make_part_canvas(source_img, target_size):
    # Crop to actual content FIRST (source_img is padded to the full PSD
    # canvas) — centering the uncropped canvas instead of the content was a
    # real bug here: every part landed at the PSD canvas's geometric middle
    # rather than its own position, scattering the whole rig.
    bbox = content_bbox(source_img)
    cropped = source_img.crop(bbox)
    w, h = cropped.size
    scaled = cropped.resize((round(w * K), round(h * K)), Image.LANCZOS)
    canvas = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    sw, sh = scaled.size
    canvas.alpha_composite(scaled, ((target_size - sw) // 2, (target_size - sh) // 2))
    return canvas


def main():
    if not PSD_PATH.exists():
        raise SystemExit(f"missing {PSD_PATH} — copy the source PSD there first")

    psd = PSDImage.open(PSD_PATH)
    layers = load_layers(psd)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for part_name, (size, layer_names) in PARTS.items():
        combined = Image.new("RGBA", psd.size, (0, 0, 0, 0))
        for name in layer_names:
            combined.alpha_composite(layer_on_canvas(layers[name], psd.size))
        out = make_part_canvas(combined, size)
        out_path = OUT_DIR / f"{part_name}.png"
        out.save(out_path)
        print(f"wrote {out_path} ({size}x{size})")

    print("\nStill needed (not in this PSD, or placeholder quality):")
    print("  arm_upper_l  — no layer for it exists in the file")
    print("  arm_lower_l  — flat colour blob, not finished art")
    print("  hand_l       — flat colour blob, not finished art")
    print("  chain        — baked into torso; fine for now but can't sway independently")
    print("  hair         — main mass baked into head/face; fine for now, same caveat")


if __name__ == "__main__":
    main()
