"""Pack a Spine texture atlas (.png + .atlas) from a rig's per-part PNGs.

Reads the actual "slots" list out of the rig's own guy.json/girl.json (not a
hardcoded part list that can drift out of sync with it), packs every part
that has real art into one atlas image with a simple shelf layout, and
writes the matching libGDX-format .atlas text file spine-pixi-v8 expects.

Usage:
  python3 design/pack_spine_atlas.py guy
  python3 design/pack_spine_atlas.py girl
"""

import json
import sys
from pathlib import Path

from PIL import Image

APP_ROOT = Path(__file__).resolve().parent.parent

RIGS = {
    "guy": {
        "json": APP_ROOT / "static/assets/spines/cast_guy/guy.json",
        "images": APP_ROOT / "design/source/spine/images",
        "out_dir": APP_ROOT / "static/assets/spines/cast_guy",
        "atlas_name": "cast_guy",
    },
    "girl": {
        "json": APP_ROOT / "static/assets/spines/cast_girl/girl.json",
        "images": APP_ROOT / "design/source/spine/images_girl",
        "out_dir": APP_ROOT / "static/assets/spines/cast_girl",
        "atlas_name": "cast_girl",
    },
}


def pack(rig_key: str) -> None:
    rig = RIGS[rig_key]
    data = json.loads(rig["json"].read_text())
    attachments = data["skins"][0]["attachments"]

    parts = []  # (attach_name, size, image)
    missing = []
    for slot in data["slots"]:
        attach_name = slot["attachment"]
        size = list(attachments[slot["name"]].values())[0]["width"]
        img_path = rig["images"] / f"{attach_name}.png"
        if not img_path.exists():
            missing.append(attach_name)
            continue
        img = Image.open(img_path).convert("RGBA")
        if img.size != (size, size):
            img = img.resize((size, size), Image.LANCZOS)
        parts.append((attach_name, size, img))

    if missing:
        print(f"{rig_key}: NOT packing — missing art for {missing}")
        print("  (this rig's slots list defines what must exist; add art or drop the slot deliberately)")
        return

    # Simple shelf packer: sort tallest-first, fill left-to-right until the
    # row is full, start a new row. Atlas width fixed at 1024; height grows
    # to fit.
    ATLAS_W = 1024
    parts.sort(key=lambda p: -p[1])
    x = y = row_h = 0
    placements = {}
    for name, size, img in parts:
        if x + size > ATLAS_W:
            x = 0
            y += row_h
            row_h = 0
        placements[name] = (x, y, size)
        x += size
        row_h = max(row_h, size)
    atlas_h = y + row_h

    atlas_img = Image.new("RGBA", (ATLAS_W, atlas_h), (0, 0, 0, 0))
    for name, size, img in parts:
        px, py, _ = placements[name]
        atlas_img.paste(img, (px, py))

    out_dir = rig["out_dir"]
    out_dir.mkdir(parents=True, exist_ok=True)
    png_name = f"{rig['atlas_name']}.png"
    atlas_img.save(out_dir / png_name)

    lines = [png_name, f"size: {ATLAS_W},{atlas_h}", "format: RGBA8888", "filter: Linear,Linear", "repeat: none"]
    for name, size, _ in parts:
        px, py, _ = placements[name]
        lines += [name, "  rotate: false", f"  xy: {px}, {py}", f"  size: {size}, {size}",
                  f"  orig: {size}, {size}", "  offset: 0, 0", "  index: -1"]
    (out_dir / f"{rig['atlas_name']}.atlas").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"{rig_key}: packed {len(parts)} parts into {out_dir / png_name} ({ATLAS_W}x{atlas_h})")


if __name__ == "__main__":
    keys = sys.argv[1:] or list(RIGS)
    for k in keys:
        pack(k)
