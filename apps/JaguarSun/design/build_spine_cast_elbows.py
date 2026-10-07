"""Build two-layer cast rigs: coherent body plus one elbow-controlled limb."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFilter

APP = Path(__file__).resolve().parent.parent
PAD = 2
ASSET_REV = "r2"

RIGS = {
    "guy": {
        "src": APP / "design/source/spine/guy_full_coherent_v3_transparent.png",
        "out": APP / "static/assets/spines/cast_guy",
        "images": APP / "design/source/spine/images",
        # right forearm + gripping hand; the bat stays in the coherent base.
        "polygon": [(475, 315), (735, 300), (740, 520), (645, 535),
                    (610, 690), (525, 705), (480, 620), (500, 500)],
        "pivot": (550, 645),
		# The gripping hand crosses the bat. Any elbow cut necessarily slices a
		# small piece of the bat too, which opens a visible seam as soon as the limb
		# rotates. Keep the man as one coherent painted layer; his trigger reaction
		# is driven by the root bone instead. The woman retains her elbow layer.
		"rigid": True,
    },
    "girl": {
        "src": APP / "design/source/spine/girl_full_coherent_v3_transparent.png",
        "out": APP / "static/assets/spines/cast_girl",
        "images": APP / "design/source/spine/images_girl",
        # outward-pointing toy, hand and forearm; upper arm remains on the body.
        "polygon": [(0, 210), (245, 210), (315, 315), (365, 405),
                    (350, 515), (285, 545), (185, 490), (80, 410), (0, 390)],
        "pivot": (340, 490),
    },
}


def split_layers(image, polygon, pivot):
    mask = Image.new("L", image.size)
    ImageDraw.Draw(mask).polygon(polygon, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.1))
    original_alpha = image.getchannel("A")
    limb_alpha = Image.new("L", image.size)
    limb_alpha = Image.composite(original_alpha, limb_alpha, mask)
    limb = image.copy()
    limb.putalpha(limb_alpha)

    # Retain a small opaque overlap around the elbow under the moving layer.
    keep = Image.new("L", image.size)
    d = ImageDraw.Draw(keep)
    r = 34
    d.ellipse((pivot[0] - r, pivot[1] - r, pivot[0] + r, pivot[1] + r), fill=255)
    erase = Image.new("L", image.size)
    erase = Image.composite(mask, erase, Image.eval(keep, lambda p: 255 - p))
    base_alpha = Image.composite(Image.new("L", image.size, 0), original_alpha, erase)
    base = image.copy()
    base.putalpha(base_alpha)
    return base, limb


def build(name, cfg):
    image = Image.open(cfg["src"]).convert("RGBA")
    if cfg.get("rigid"):
        base = image.copy()
        limb = Image.new("RGBA", image.size)
    else:
        base, limb = split_layers(image, cfg["polygon"], cfg["pivot"])
    cfg["out"].mkdir(parents=True, exist_ok=True)
    cfg["images"].mkdir(parents=True, exist_ok=True)
    base.save(cfg["images"] / f"{name}_base.png")
    limb.save(cfg["images"] / f"{name}_forearm.png")

    page_w = image.width + PAD * 2
    page_h = image.height * 2 + PAD * 3
    page = Image.new("RGBA", (page_w, page_h))
    base_y = PAD
    limb_y = image.height + PAD * 2
    page.alpha_composite(base, (PAD, base_y))
    page.alpha_composite(limb, (PAD, limb_y))
    page_name = f"cast_{name}.png"
    page.save(cfg["out"] / page_name)
    atlas = (
        f"{page_name}\nsize: {page_w},{page_h}\nformat: RGBA8888\n"
        f"filter: Linear,Linear\nrepeat: none\n"
        f"{name}_base\nbounds: {PAD},{base_y},{image.width},{image.height}\n"
        f"offsets: 0,0,{image.width},{image.height}\nindex: -1\n"
        f"{name}_forearm\nbounds: {PAD},{limb_y},{image.width},{image.height}\n"
        f"offsets: 0,0,{image.width},{image.height}\nindex: -1\n"
    )
    (cfg["out"] / f"cast_{name}.atlas").write_text(atlas, encoding="utf-8")

    # Versioned runtime aliases prevent a deployed browser/CDN from pairing a
    # newly built skeleton with yesterday's cached atlas page.
    versioned_page_name = f"cast_{name}_{ASSET_REV}.png"
    page.save(cfg["out"] / versioned_page_name)
    versioned_atlas = atlas.replace(page_name, versioned_page_name, 1)
    (cfg["out"] / f"cast_{name}_{ASSET_REV}.atlas").write_text(versioned_atlas, encoding="utf-8")

    target_h = 512
    scale = target_h / image.height
    target_w = round(image.width * scale)
    px, py = cfg["pivot"]
    bone_x = px * scale - target_w / 2
    bone_y = target_h - py * scale
    data = {
        "skeleton": {"hash": f"{name}-coherent-elbow-v1", "spine": "4.2.74",
                     "x": -target_w / 2, "y": 0, "width": target_w, "height": target_h},
        "bones": [{"name": "root"}, {"name": "elbow", "parent": "root", "x": bone_x, "y": bone_y}],
        "slots": [
            {"name": f"{name}_base", "bone": "root", "attachment": f"{name}_base"},
            {"name": f"{name}_forearm", "bone": "elbow", "attachment": f"{name}_forearm"},
        ],
        "skins": [{"name": "default", "attachments": {
            f"{name}_base": {f"{name}_base": {"y": target_h / 2, "width": target_w, "height": target_h}},
            f"{name}_forearm": {f"{name}_forearm": {
                "x": -bone_x, "y": target_h / 2 - bone_y, "width": target_w, "height": target_h
            }},
        }}],
        "animations": {},
    }
    (cfg["out"] / f"{name}.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
    (cfg["out"] / f"{name}_{ASSET_REV}.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
    (APP / f"design/source/spine/{name}.spine").write_text(json.dumps(data, indent=2), encoding="utf-8")

    proof = Image.new("RGBA", image.size, (18, 18, 24, 255))
    proof.alpha_composite(base)
    proof.alpha_composite(limb)
    proof.save(APP / f"design/source/spine/{name}_elbow_rig_proof.png")
    print(name, image.size, "pivot", cfg["pivot"])


def main():
    for name, cfg in RIGS.items():
        build(name, cfg)


if __name__ == "__main__":
    main()
