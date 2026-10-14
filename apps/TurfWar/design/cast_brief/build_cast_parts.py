"""Build aligned Turf War cast cutouts from the approved source illustration.

The masks are intentionally explicit: an artist can replace any extracted PNG
without changing the canvas, order, or variant alpha contract.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from scipy.ndimage import binary_dilation, distance_transform_edt, label
from PIL import Image, ImageDraw, ImageFilter
from pytoshop import enums
from pytoshop.image_data import ImageData
from pytoshop.user.nested_layers import Image as PsdImage, nested_layers_to_psd
from psd_tools import PSDImage

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "source_master_v2.png"
BODY_SOURCE = HERE / "body_master.png"
BAT_SOURCE = HERE / "bat_master_v2.png"
OUT = HERE.parent / "cast_parts"
SIZE = (1024, 2048)
SCALE = 0.915
OFFSET = (135, 118)
ORDER = ["body", "arm_r", "prop_bat", "arm_l", "head", "dangle_chain", "dangle_mask", "fingers_r"]

# Coordinates are in the 887 x 1774 source illustration.
SHAPES = {
    "prop_bat": [(12, 214), (320, 269), (323, 335), (12, 276)],
    "arm_r": [(85, 374), (150, 292), (260, 260), (345, 295), (432, 348), (440, 457), (353, 590), (228, 605), (99, 550)],
    "arm_l": [(629, 345), (745, 365), (820, 490), (860, 730), (852, 899), (858, 1011), (735, 1031), (704, 945), (675, 810), (636, 631)],
    "head": [(389, 55), (535, 49), (642, 159), (648, 337), (609, 414), (405, 435), (369, 310), (374, 171)],
    "dangle_mask": [(558, 285), (603, 326), (627, 502), (570, 455), (546, 355)],
    "dangle_chain": [(446, 365), (480, 387), (486, 430), (518, 453), (552, 418), (555, 370), (572, 385), (569, 451), (515, 476), (453, 445)],
    "fingers_r": [(201, 256), (290, 250), (323, 306), (300, 344), (218, 336)],
}


def mask_polygon(points, size):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).polygon(points, fill=255)
    return m.filter(ImageFilter.GaussianBlur(1.1))


def shift_hanging_arm(layer):
    """Give the free forearm mesh a full clear cell without moving its shoulder."""
    src = np.asarray(layer)
    dst = np.zeros_like(src)
    for y in range(src.shape[0]):
        shift = round(45 * min(1, max(0, (y - 650) / 140)))
        if shift:
            dst[y, shift:] = src[y, :-shift]
        else:
            dst[y] = src[y]
    return Image.fromarray(dst, "RGBA")


def transform(rgb, variant):
    a = np.asarray(rgb, dtype=np.float32).copy()
    if variant == "feature":
        a[..., 0] = np.clip(a[..., 0] * 1.14 + 7, 0, 255)
        a[..., 1] = np.clip(a[..., 1] * 1.08 + 4, 0, 255)
        a[..., 2] = np.clip(a[..., 2] * 1.15 + 4, 0, 255)
    elif variant == "kingpin":
        # Only source edge-light pixels receive the blood-red shift.
        blue_edge = (a[..., 2] > a[..., 0] * 1.15) & (a[..., 2] > a[..., 1] * 1.08)
        a[..., 0] = np.clip(a[..., 0] * 1.07 + blue_edge * 95, 0, 255)
        a[..., 1] = np.clip(a[..., 1] * 0.89, 0, 255)
        a[..., 2] = np.clip(a[..., 2] * 0.82, 0, 255)
    result = Image.fromarray(a.astype("uint8"), "RGB")
    if variant == "kingpin":
        draw = ImageDraw.Draw(result)
        for x, y in ((232, 360), (250, 371), (281, 369), (308, 381), (336, 382)):
            draw.line([(x, y), (x + 12, y + 10)], fill=(93, 30, 24), width=2)
            draw.line([(x + 4, y - 2), (x + 15, y + 7)], fill=(67, 39, 28), width=1)
        for x, y in ((272, 380), (291, 383), (319, 389)):
            draw.ellipse((x, y, x + 5, y + 3), fill=(113, 32, 25))
    return result


def psd_from_layers(folder, layers, full):
    import pytoshop
    psd_layers = []
    for name in reversed(ORDER):
        ar = np.asarray(layers[name], dtype=np.uint8)
        channels = {enums.ChannelId.red: ar[:, :, 0], enums.ChannelId.green: ar[:, :, 1],
                    enums.ChannelId.blue: ar[:, :, 2], enums.ChannelId.transparency: ar[:, :, 3]}
        psd_layers.append(PsdImage(name=name, channels=channels, top=0, left=0))
    psd = nested_layers_to_psd(psd_layers, enums.ColorMode.rgb, size=SIZE, compression=enums.Compression.raw)
    psd.num_channels = 4
    psd.image_data = ImageData(channels=np.asarray(full, dtype=np.uint8).transpose(2, 0, 1), compression=enums.Compression.raw)
    with (folder / "cast.psd").open("wb") as fp:
        psd.write(fp)
    saved = PSDImage.open(folder / "cast.psd")
    for item in saved:
        item.name = item.name.rstrip("\x00")
    saved.save(folder / "cast.psd")


def main():
    src = Image.open(SOURCE).convert("RGBA")
    if src.size != (887, 1774):
        raise ValueError(f"Unexpected source dimensions: {src.size}")
    w, h = (round(src.width * SCALE), round(src.height * SCALE))
    base = Image.new("RGBA", SIZE)
    base.alpha_composite(src.resize((w, h), Image.Resampling.LANCZOS), OFFSET)
    source_alpha = base.getchannel("A")
    masks = {}
    for name, points in SHAPES.items():
        if name == "fingers_r":
            rgb = np.asarray(src)[:, :, :3].astype(np.int16)
            yy, xx = np.indices((src.height, src.width))
            skin = (xx >= 190) & (xx <= 330) & (yy >= 248) & (yy <= 365)
            skin &= (rgb[:, :, 0] > 62) & (rgb[:, :, 0] > rgb[:, :, 1] * 1.17) & (rgb[:, :, 0] > rgb[:, :, 2] * 1.2)
            skin = binary_dilation(skin, iterations=2)
            mask = Image.fromarray((skin * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(0.7)).resize((w, h), Image.Resampling.LANCZOS)
        elif name == "dangle_chain":
            raw = Image.new("L", src.size, 0)
            ImageDraw.Draw(raw).line([(458, 364), (473, 416), (506, 451), (536, 451), (556, 415), (561, 364)], fill=255, width=31, joint="curve")
            luminance = np.asarray(src.convert("L"), dtype=np.float32)
            bright = np.clip((luminance - 67) * 3.8, 0, 255).astype(np.uint8)
            mask = Image.fromarray(np.minimum(np.asarray(raw), bright), "L").filter(ImageFilter.GaussianBlur(0.6)).resize((w, h), Image.Resampling.LANCZOS)
        else:
            mask = mask_polygon(points, src.size).resize((w, h), Image.Resampling.LANCZOS)
        canvas = Image.new("L", SIZE, 0)
        canvas.paste(mask, OFFSET)
        masks[name] = canvas
    palm = mask_polygon([(183, 247), (327, 244), (340, 367), (185, 389)], src.size)
    palm_canvas = Image.new("L", SIZE, 0)
    palm_canvas.paste(palm.resize((w, h), Image.Resampling.LANCZOS), OFFSET)
    masks["arm_r"] = Image.fromarray(np.maximum(np.asarray(masks["arm_r"]), np.asarray(palm_canvas)).astype(np.uint8), "L")
    # Exclusive visible pixels reproduce the illustration without double exposure.
    remaining = np.asarray(source_alpha, dtype=np.uint8).astype(np.float32)
    assigned = {}
    for name in ["fingers_r", "dangle_mask", "dangle_chain", "head", "arm_l", "prop_bat", "arm_r"]:
        mask = np.asarray(masks[name], dtype=np.uint8).astype(np.float32) / 255
        take = np.rint(remaining * mask).astype(np.uint8)
        assigned[name] = Image.fromarray(take, "L")
        remaining = np.maximum(0, remaining - take)
    arm_clean = np.asarray(assigned["arm_l"]).copy()
    for y in range(650, 861):
        bound = round(710 + (y - 650) * 0.42)
        arm_clean[y, :bound] = 0
    assigned["arm_l"] = Image.fromarray(arm_clean, "L")
    body_src = Image.open(BODY_SOURCE).convert("RGBA")
    if body_src.size != src.size:
        raise ValueError("Body underpaint must match source canvas")
    aligned_body = Image.new("RGBA", src.size)
    aligned_body.alpha_composite(body_src, (25, 0))
    body_src = aligned_body
    clean_alpha = np.asarray(body_src.getchannel("A")).copy()
    clean_alpha[:275] = 0
    body_src.putalpha(Image.fromarray(clean_alpha, "L"))
    body_canvas = Image.new("RGBA", SIZE)
    body_canvas.alpha_composite(body_src.resize((w, h), Image.Resampling.LANCZOS), (OFFSET[0], OFFSET[1] + 1))
    assigned["body"] = body_canvas.getchannel("A")
    # Separate bat artwork is resized to the original grip/barrel perspective.
    bat_src = Image.open(BAT_SOURCE).convert("RGBA")
    if bat_src.size != src.size:
        raise ValueError("Bat source must match source canvas")
    bat_rgba = np.asarray(bat_src).copy()
    bat_rgba[600:, :, 3] = 0
    bat_src = Image.fromarray(bat_rgba, "RGBA")
    bat_src = bat_src.transform(src.size, Image.Transform.AFFINE,
                                (1 / 0.33, 0, -10 / 0.33, 0, 1 / 0.55, -50 / 0.55),
                                resample=Image.Resampling.BICUBIC)
    bat_canvas = Image.new("RGBA", SIZE)
    bat_canvas.alpha_composite(bat_src.resize((w, h), Image.Resampling.LANCZOS), OFFSET)
    assigned["prop_bat"] = bat_canvas.getchannel("A")
    # Keep the entire bat clear of the hood by the specified 60 px.
    head_distance = distance_transform_edt(np.asarray(assigned["head"]) < 8)
    separated = np.where(head_distance >= 60, np.asarray(assigned["prop_bat"]), 0).astype(np.uint8)
    components, count = label(separated > 8)
    if count:
        ids = np.arange(1, count + 1)
        sizes = np.bincount(components.ravel())[1:]
        left_ids = [i for i in ids if np.any(components[:, :450] == i)]
        keep = max(left_ids, key=lambda i: sizes[i - 1]) if left_ids else int(np.argmax(sizes) + 1)
        separated[components != keep] = 0
    assigned["prop_bat"] = Image.fromarray(separated, "L")
    template = json.loads((HERE / "layers.template.json").read_text())
    template["order"] = ORDER
    template["source"] = "source_master_v2.png"
    template["joints"] = {
        "neck": [594, 486], "chest": [591, 620], "waist": [580, 903],
        "hips": [582, 972], "head_top": [592, 177],
        "shoulder_r": [459, 465], "elbow_r": [245, 576], "wrist_r": [381, 400],
        "shoulder_l": [750, 474], "elbow_l": [902, 764], "wrist_l": [912, 977],
    }
    template["anchors"] = {"prop_bat": [374, 398], "dangle_chain": [604, 531], "dangle_mask": [669, 436]}
    for variant in ("base", "feature", "kingpin"):
        folder = OUT / variant
        folder.mkdir(parents=True, exist_ok=True)
        rgb = transform(base.convert("RGB"), variant)
        body_rgb = transform(body_canvas.convert("RGB"), variant)
        bat_rgb = transform(bat_canvas.convert("RGB"), variant)
        layers = {}
        full = Image.new("RGBA", SIZE)
        for name in ORDER:
            layer = (body_rgb if name == "body" else bat_rgb if name == "prop_bat" else rgb).copy().convert("RGBA")
            layer.putalpha(assigned[name])
            if name == "arm_l":
                layer = shift_hanging_arm(layer)
            # The source RGB fills the whole transparent canvas. Clear fully
            # transparent pixels so each shipped layer compresses as a cutout.
            pixels = np.asarray(layer).copy()
            pixels[pixels[:, :, 3] == 0, :3] = 0
            layer = Image.fromarray(pixels, "RGBA")
            layer.save(folder / f"{name}.png")
            layers[name] = layer
            full.alpha_composite(layer)
        full.save(folder / "full.png")
        (folder / "layers.json").write_text(json.dumps(template, ensure_ascii=False, indent=2) + "\n")
        psd_from_layers(folder, layers, full)
        print(variant, full.getbbox(), (folder / "cast.psd").stat().st_size)


if __name__ == "__main__":
    main()
