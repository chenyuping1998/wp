"""Build the coherent female cast as one unsliced Spine attachment."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parent.parent
SRC = APP / "design/source/spine/girl_full_coherent_v3.png"
CLEAN = APP / "design/source/spine/girl_full_coherent_v3_transparent.png"
OUT = APP / "static/assets/spines/cast_girl"
PARTS = APP / "design/source/spine/images_girl"
CAST_OUT = APP / "static/assets/sprites/hotMiamiCast/girl_spine.png"
PAD = 2


def remove_connected_checker(rgb):
    hi = rgb.max(axis=2)
    lo = rgb.min(axis=2)
    candidate = ((hi - lo <= 5) & (lo >= 238)).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(candidate, connectivity=8)
    border_ids = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    bg = np.isin(labels, border_ids) & candidate.astype(bool)
    # The triangle enclosed by her bent hip arm cannot reach the canvas border.
    # Remove only that large neutral checker component; do not globally key white,
    # because her belt and shoes are deliberately white.
    for i in range(1, count):
        x, y, w, h, area = stats[i]
        if i not in border_ids and x > 550 and 340 < y < 460 and area > 10000:
            bg |= labels == i
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0.45)
    return Image.fromarray(np.dstack([rgb, alpha]), "RGBA")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    PARTS.mkdir(parents=True, exist_ok=True)
    raw = Image.open(SRC)
    if "A" not in raw.getbands() or raw.getchannel("A").getextrema()[0] == 255:
        image = remove_connected_checker(np.asarray(raw.convert("RGB")))
    else:
        image = raw.convert("RGBA")
    bbox = image.getchannel("A").point(lambda a: 0 if a < 8 else a).getbbox()
    if not bbox:
        raise RuntimeError("generated woman has no visible alpha")
    image = image.crop(bbox)
    image.save(CLEAN)
    image.save(PARTS / "girl_full.png")
    loading = image.copy()
    loading.thumbnail((1000, 1100), Image.Resampling.LANCZOS)
    loading.save(CAST_OUT, optimize=True)

    page_w, page_h = image.width + PAD * 2, image.height + PAD * 2
    page = Image.new("RGBA", (page_w, page_h))
    page.alpha_composite(image, (PAD, PAD))
    page.save(OUT / "cast_girl.png")
    atlas = (
        f"cast_girl.png\nsize: {page_w},{page_h}\nformat: RGBA8888\n"
        f"filter: Linear,Linear\nrepeat: none\n"
        f"girl_full\nbounds: {PAD},{PAD},{image.width},{image.height}\n"
        f"offsets: 0,0,{image.width},{image.height}\nindex: -1\n"
    )
    (OUT / "cast_girl.atlas").write_text(atlas, encoding="utf-8")

    target_h = 512
    target_w = round(target_h * image.width / image.height)
    data = {
        "skeleton": {"hash": "girl-single-coherent-v3-safe-muzzle", "spine": "4.2.74",
                     "x": -target_w / 2, "y": 0, "width": target_w,
                     "height": target_h, "images": "./images/"},
        "bones": [{"name": "root"}],
        "slots": [{"name": "girl_full", "bone": "root", "attachment": "girl_full"}],
        "skins": [{"name": "default", "attachments": {"girl_full": {"girl_full": {
            "y": target_h / 2, "width": target_w, "height": target_h
        }}}}],
        "animations": {},
    }
    (OUT / "girl.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
    (APP / "design/source/spine/girl.spine").write_text(json.dumps(data, indent=2), encoding="utf-8")
    proof = Image.new("RGBA", image.size, (18, 18, 24, 255))
    proof.alpha_composite(image)
    proof.save(APP / "design/source/spine/girl_full_coherent_v3_proof.png")
    print(f"single attachment {image.width}x{image.height} -> Spine {target_w}x{target_h}")


if __name__ == "__main__":
    main()
