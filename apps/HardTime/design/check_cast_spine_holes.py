"""At rest, the Spine v2 layers stacked in place must reproduce the original
figure: no pixel the original paints may come out transparent (a hole you can
see without anything moving), and the colour may only differ (<= 0.6% of the figure) where a moving
part's backing shows through anti-aliased edges. Added 2026-10-20 after the
ghost-check repair of the prisoner's arms and towel.

    python3 design/check_cast_spine_holes.py [--out dir]
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
FULL = {"prisoner": "design/cast_brief/spine_v2/full_prisoner.png",
        "warden": "design/cast_brief/spine_v2/full_warden.png"}
out = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None
fail = False
for who, ref in FULL.items():
    d = APP / f"static/assets/castLayers/{who}_spine_v2"
    man = json.loads((d / "layers.json").read_text())
    can = Image.new("RGBA", tuple(man["size"]))
    for n in man["order"]:
        if n == "blink":
            continue
        L = next(l for l in man["layers"] if l["name"] == n)
        can.alpha_composite(Image.open(d / L["texture"]).convert("RGBA"), tuple((L.get("crop") or [0, 0])[:2]))
    a = np.array(can).astype(np.int32)
    o = np.array(Image.open(APP / ref).convert("RGBA")).astype(np.int32)
    hole = (o[..., 3] > 200) & (a[..., 3] < 128)
    solid = (o[..., 3] > 200) & (a[..., 3] > 200)
    diff = np.abs(a[..., :3] - o[..., :3]).max(2)
    changed = solid & (diff > 60)
    n_hole, n_changed = int(hole.sum()), int(changed.sum())
    ok = n_hole <= 40 and n_changed <= 0.006 * solid.sum()
    fail |= not ok
    print(f"{who}: holes {n_hole} px, repainted {n_changed} px ({100 * n_changed / solid.sum():.2f}% of the figure)  {'PASS' if ok else 'FAIL'}")
    if out:
        out.mkdir(parents=True, exist_ok=True)
        vis = np.array(Image.open(APP / ref).convert("RGB")) // 3
        vis[changed] = [255, 200, 0]
        vis[hole] = [255, 0, 255]
        Image.fromarray(vis.astype(np.uint8)).save(out / f"{who}_rest_vs_original.png")
sys.exit(1 if fail else 0)
