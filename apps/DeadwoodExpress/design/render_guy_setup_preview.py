"""Render the cast_guy setup pose directly from Spine JSON and source PNGs."""

import json
from pathlib import Path
from PIL import Image

APP = Path(__file__).resolve().parent.parent
DATA = json.loads((APP / "static/assets/spines/cast_guy/guy.json").read_text())
IMAGES = APP / "design/source/spine/images"
OUT = APP / "design/_review/cast_guy_bat_setup.png"
W, H = 1400, 2400
ORIGIN = (W // 2, H - 120)

bones = {}
for bone in DATA["bones"]:
    parent = bones.get(bone.get("parent"), (0, 0))
    bones[bone["name"]] = (parent[0] + bone.get("x", 0), parent[1] + bone.get("y", 0))

skin = DATA["skins"][0]["attachments"]
canvas = Image.new("RGBA", (W, H), (29, 24, 44, 255))
for slot in DATA["slots"]:
    name = slot["name"]
    attachment_name = slot["attachment"]
    attachment = skin[name][attachment_name]
    image = Image.open(IMAGES / f"{attachment_name}.png").convert("RGBA")
    bx, by = bones[slot["bone"]]
    cx = round(ORIGIN[0] + bx + attachment.get("x", 0))
    cy = round(ORIGIN[1] - by - attachment.get("y", 0))
    canvas.alpha_composite(image, (cx - image.width // 2, cy - image.height // 2))

OUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUT)
print(OUT)
