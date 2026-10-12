"""Give the apron's hem back to the apron (Diner Monkey chef, 2026-10-10).

The cut's thigh polygons start at y 612, but the apron hangs to y 652-668, so
the hem's last 40-55 px were cut onto the THIGHS: every step or knee bend
carried a strip of apron away and left a square notch in it. And under the
thighs clean_cast_trunk.py painted flat trouser black all the way down, which
showed as a black tail hanging between the legs whenever they moved apart.

  1. every thigh pixel above the hem line (measured per column on the
     painting below) moves to the body layer, where it is drawn as it was;
  2. the trouser black under the thighs is kept only BAND px below the hem —
     enough that a step shows trousers at the crotch, not a dangling block.

Run after clean_cast_trunk.py (it starts from what that wrote):

    python design/clean_cast_trunk.py && python design/fix_apron_hem.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
SRC = APP / "design/source/mg"
# the apron's lowest painted row per canvas column (cast_delivery/mg_full_source.png at 560x912)
HEM = [(155, 640), (160, 642), (170, 654), (180, 654), (190, 653), (200, 652), (210, 653), (220, 654), (230, 656), (240, 659),
       (250, 661), (260, 663), (270, 664), (280, 666), (290, 667), (300, 667), (310, 668), (320, 668), (330, 668), (340, 668),
       (350, 667), (360, 666), (370, 665), (380, 664), (390, 663), (400, 661), (410, 658), (420, 656), (426, 650)]
PAD = 2
BAND = 22
# the trousers between the thighs, canvas x: from, to, and the split
CROTCH = (240, 335)
CROTCH_MID = 290


def main():
    meta = json.loads((SRC / "layers.json").read_text(encoding="utf-8"))
    layer = {l["name"]: l for l in meta["layers"]}
    W, H = meta["canvas"]

    def load(name):
        l = layer[name]
        out = np.zeros((H, W, 4), np.uint8)
        out[l["y"]:l["y"] + l["h"], l["x"]:l["x"] + l["w"]] = np.array(Image.open(SRC / l["file"]).convert("RGBA"))
        return out

    def save(name, img, keep_box=False):
        l = layer[name]
        if keep_box:
            # the body keeps its box: generate_monkey_spine.mjs reads the hem
            # (and the hip blend) off the box's bottom edge
            Image.fromarray(img[l["y"]:l["y"] + l["h"], l["x"]:l["x"] + l["w"]]).save(SRC / l["file"])
            return
        ys, xs = np.nonzero(img[..., 3] > 0)
        x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        Image.fromarray(img[y0:y1, x0:x1]).save(SRC / l["file"])
        l.update({"x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0)})

    xs = np.arange(W)
    hx, hy = zip(*HEM)
    hem = np.interp(xs, hx, hy)
    inside = (xs >= HEM[0][0]) & (xs <= HEM[-1][0])
    rows = np.arange(H)[:, None]
    above = (rows <= hem[None, :] + PAD) & inside[None, :]
    below_band = (rows > hem[None, :] + PAD + BAND) & inside[None, :]

    trunk = load("torso_0_trunk")
    moved = 0
    cover = np.zeros((H, W), bool)
    for name in ("left_leg_0_thigh", "right_leg_0_thigh"):
        img = load(name)
        a = img[..., 3] > 0
        take = a & above
        trunk[take] = img[take]
        img[take] = 0
        moved += int(take.sum())
        cover |= img[..., 3] > 24
        save(name, img)
    # 3. the crotch: the trousers between the two thigh polygons were left on the
    # body, so they stayed put while the legs moved and hung between them like a
    # tail. Below the hem they belong to the legs: split down the middle.
    below = (rows > hem[None, :] + PAD) & inside[None, :]
    crotch = below & (trunk[..., 3] > 0) & ~cover
    crotch[:, :CROTCH[0]] = False
    crotch[:, CROTCH[1]:] = False
    for name, cols in (("left_leg_0_thigh", slice(0, CROTCH_MID)), ("right_leg_0_thigh", slice(CROTCH_MID, W))):
        img = load(name)
        take = np.zeros_like(crotch)
        take[:, cols] = crotch[:, cols]
        img[take] = trunk[take]
        trunk[take] = 0
        moved += int(take.sum())
        cover |= img[..., 3] > 24
        save(name, img)
    # 2. the trouser black under the thighs, past the band
    drop = cover & below_band & (trunk[..., 3] > 0)
    trunk[drop] = 0
    save("torso_0_trunk", trunk, keep_box=True)
    (SRC / "layers.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    print(f"mg: apron hem back from the thighs {moved} px, trouser fill under the thighs trimmed {int(drop.sum())} px")


if __name__ == "__main__":
    main()
