"""Build the final male cast as one coherent, unsliced Spine attachment."""
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parent.parent
SRC = APP / "design/source/spine/guy_full_coherent_v3.png"
CLEAN = APP / "design/source/spine/guy_full_coherent_v3_transparent.png"
OUT = APP / "static/assets/spines/cast_guy"
PARTS = APP / "design/source/spine/images"
CAST_OUT = APP / "static/assets/sprites/hotMiamiCast/guy_spine.png"
PAGE_W = 1024
PAD = 2


def remove_connected_checker(rgb):
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    candidate = ((hsv[:, :, 1] < 24) & (hsv[:, :, 2] > 220)).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(candidate, connectivity=8)
    border_ids = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    bg = np.isin(labels, border_ids) & candidate.astype(bool)
    # Checker cells trapped inside the closed loop formed by bat/right arm/torso
    # cannot reach a border. Select that large upper-right neutral component;
    # never globally key neutral pixels because the tank top and shoes are white.
    for i in range(1, count):
        x, y, w, h, area = stats[i]
        if i not in border_ids and x > 500 and y < 700 and w > 50 and area > 1000:
            bg |= labels == i
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0.5)
    return np.dstack([rgb, alpha])


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    PARTS.mkdir(parents=True, exist_ok=True)
    rgb = np.asarray(Image.open(SRC).convert("RGB"))
    rgba = remove_connected_checker(rgb)
    image = Image.fromarray(rgba, "RGBA")
    bbox = image.getchannel("A").point(lambda a: 0 if a < 16 else a).getbbox()
    image = image.crop(bbox)
    image.save(CLEAN)
    image.save(PARTS / "guy_full.png")
    # The loading card uses the exact same coherent art as the Spine attachment.
    loading = image.copy()
    loading.thumbnail((1000, 1100), Image.Resampling.LANCZOS)
    loading.save(CAST_OUT, optimize=True)

    page_h = image.height + PAD * 2
    page = Image.new("RGBA", (PAGE_W, page_h))
    page.alpha_composite(image, (PAD, PAD))
    page.save(OUT / "cast_guy.png")
    atlas = (
        f"cast_guy.png\nsize: {PAGE_W},{page_h}\nformat: RGBA8888\n"
        f"filter: Linear,Linear\nrepeat: none\n"
        f"guy_full\nbounds: {PAD},{PAD},{image.width},{image.height}\n"
        f"offsets: 0,0,{image.width},{image.height}\nindex: -1\n"
    )
    (OUT / "cast_guy.atlas").write_text(atlas, encoding="utf-8")

    target_h = 512
    target_w = round(target_h * image.width / image.height)
    data = {
        "skeleton": {"hash":"guy-single-coherent-v3","spine":"4.2.74",
                     "x":-target_w/2,"y":0,"width":target_w,"height":target_h,"images":"./images/"},
        "bones": [{"name":"root"}],
        "slots": [{"name":"guy_full","bone":"root","attachment":"guy_full"}],
        "skins": [{"name":"default","attachments":{"guy_full":{"guy_full":{
            "y": target_h/2, "width":target_w, "height":target_h
        }}}}],
        "animations": {},
    }
    (OUT / "guy.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
    (APP / "design/source/spine/guy.spine").write_text(json.dumps(data, indent=2), encoding="utf-8")

    proof = Image.new("RGBA", image.size, (18,18,24,255)); proof.alpha_composite(image)
    proof.save(APP / "design/source/spine/guy_full_coherent_v3_proof.png")
    print(f"single attachment {image.width}x{image.height} -> Spine {target_w}x{target_h}")

if __name__ == "__main__": main()
