"""Extract only the repaired high-resolution head and left arm.

The generated repair is never installed as a whole character.  This keeps the
PSD-authored torso, bat, right arm and legs unchanged while replacing the two
areas called out in review.
"""
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
from psd_tools import PSDImage

APP = Path(__file__).resolve().parent.parent
SRC = APP / "design/source/spine/guy_repair_generated.png"
CLEAN_HEAD = APP / "design/source/spine/guy_head_neck_clean_v2.png"
OUT = APP / "design/source/spine/repair_parts"
CANVAS = (224, 512)


def remove_checker(rgb):
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    # Checker cells are neutral and very bright. Keep only components connected
    # to an image border so white clothing enclosed by black outlines survives.
    candidate = ((hsv[:, :, 1] < 22) & (hsv[:, :, 2] > 222)).astype(np.uint8)
    count, labels = cv2.connectedComponents(candidate, connectivity=8)
    border_ids = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    bg = np.isin(labels, border_ids) & candidate.astype(bool)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    # Remove isolated checker islands which touch the border region diagonally
    # only after antialiasing, then feather the silhouette by one pixel.
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0.55)
    return np.dstack([rgb, alpha])


def polygon_part(rgba, points, name):
    mask = np.zeros(rgba.shape[:2], np.uint8)
    cv2.fillPoly(mask, [np.asarray(points, np.int32)], 255)
    out = rgba.copy()
    out[:, :, 3] = np.minimum(out[:, :, 3], mask)
    # Normalize the generated figure into the PSD's exact 224x512 coordinate
    # system. Its framing intentionally matches the reference closely.
    out = cv2.resize(out, CANVAS, interpolation=cv2.INTER_AREA)
    Image.fromarray(out, "RGBA").save(OUT / f"{name}_canvas.png")
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rgb = np.asarray(Image.open(SRC).convert("RGB"))
    rgba = remove_checker(rgb)
    # Screen-left arm: sleeve/upper arm/elbow/forearm/hand as one continuous
    # painted limb. Split at the elbow only after alignment in the rig builder.
    arm = polygon_part(rgba, [(28,330),(220,315),(330,520),(300,790),(250,1035),(145,1080),(45,790)], "left_arm_full")
    # This is a separately generated transparent head/neck asset — not a crop
    # from the full character — so it cannot contain any hidden bat pixels.
    clean_head = Image.open(CLEAN_HEAD).convert("RGBA")
    bbox = clean_head.getchannel("A").getbbox()
    clean_head = clean_head.crop(bbox).resize((78, 112), Image.Resampling.LANCZOS)
    head_image = Image.new("RGBA", CANVAS)
    head_image.alpha_composite(clean_head, (67, 2))
    head = np.asarray(head_image).copy()
    Image.fromarray(head, "RGBA").save(OUT / "head_crisp_canvas.png")
    Image.fromarray(cv2.resize(rgba, CANVAS, interpolation=cv2.INTER_AREA), "RGBA").save(OUT / "repair_aligned_preview.png")
    proof = Image.new("RGBA", (CANVAS[0] * 2, CANVAS[1]), (18, 18, 24, 255))
    proof.alpha_composite(Image.fromarray(arm, "RGBA"), (0, 0))
    proof.alpha_composite(Image.fromarray(head, "RGBA"), (CANVAS[0], 0))
    proof.save(OUT / "repair_parts_proof.png")
    installed = PSDImage.open(APP / "design/source/spine/psd/spine-pieces-project-1.psd").composite().convert("RGBA")
    installed.alpha_composite(Image.fromarray(arm, "RGBA"))
    installed.alpha_composite(Image.fromarray(head, "RGBA"))
    installed.save(OUT / "repair_over_psd_preview.png")
    print(OUT)

if __name__ == "__main__":
    main()
