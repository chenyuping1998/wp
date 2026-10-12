"""Rasterizes design/dump_cast_frames.mjs output into a contact sheet — the
cast's real posed meshes, so seams, gaps and tears are visible offline.

    python design/render_cast_frames.py <dump.json> <atlas png> <out.png> [cols] [scale]
"""
import json
import sys

import numpy as np
from PIL import Image

dump = json.load(open(sys.argv[1]))
page = np.asarray(Image.open(sys.argv[2]).convert("RGBA")).astype(np.float32) / 255
out = sys.argv[3]
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 6
scale = float(sys.argv[5]) if len(sys.argv) > 5 else 0.5
PH, PW = page.shape[:2]
import os, zlib
TINT = os.environ.get("TINT") == "1"
SLOT_COL = {}
for f_ in dump["frames"]:
    for s_ in f_["slots"]:
        h_ = zlib.crc32(s_["slot"].encode())
        SLOT_COL[s_["slot"]] = np.array([(h_ & 255) / 255, ((h_ >> 8) & 255) / 255, ((h_ >> 16) & 255) / 255], np.float32)
if TINT:
    print({k: (v * 255).astype(int).tolist() for k, v in SLOT_COL.items()})

frames = dump["frames"]
allv = np.concatenate([np.array(s["v"]).reshape(-1, 2) for f in frames for s in f["slots"]])
x0, y0 = allv.min(0) - 10
x1, y1 = allv.max(0) + 10
W, H = int((x1 - x0) * scale) + 1, int((y1 - y0) * scale) + 1


def draw(fr):
    img = np.zeros((H, W, 4), np.float32)
    img[..., :3] = (0.55, 0.62, 0.6)
    img[..., 3] = 1
    for s in fr["slots"]:
        v = np.array(s["v"]).reshape(-1, 2)
        # spine is y-up
        px = (v[:, 0] - x0) * scale
        py = (y1 - v[:, 1]) * scale
        uv = np.array(s["uv"]).reshape(-1, 2) * (PW - 1, PH - 1)
        tri = np.array(s["tri"]).reshape(-1, 3)
        for a, b, c in tri:
            xs, ys = px[[a, b, c]], py[[a, b, c]]
            bx0, bx1 = int(max(0, np.floor(xs.min()))), int(min(W - 1, np.ceil(xs.max())))
            by0, by1 = int(max(0, np.floor(ys.min()))), int(min(H - 1, np.ceil(ys.max())))
            if bx1 < bx0 or by1 < by0:
                continue
            gx, gy = np.meshgrid(np.arange(bx0, bx1 + 1) + 0.5, np.arange(by0, by1 + 1) + 0.5)
            d = (ys[1] - ys[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (ys[0] - ys[2])
            if abs(d) < 1e-9:
                continue
            l0 = ((ys[1] - ys[2]) * (gx - xs[2]) + (xs[2] - xs[1]) * (gy - ys[2])) / d
            l1 = ((ys[2] - ys[0]) * (gx - xs[2]) + (xs[0] - xs[2]) * (gy - ys[2])) / d
            l2 = 1 - l0 - l1
            m = (l0 >= -1e-4) & (l1 >= -1e-4) & (l2 >= -1e-4)
            if not m.any():
                continue
            u = l0 * uv[a, 0] + l1 * uv[b, 0] + l2 * uv[c, 0]
            vv = l0 * uv[a, 1] + l1 * uv[b, 1] + l2 * uv[c, 1]
            sx = np.clip(u.round().astype(int), 0, PW - 1)
            sy = np.clip(vv.round().astype(int), 0, PH - 1)
            col = page[sy, sx]
            if TINT:
                # identify the slot: its own flat colour, the art's alpha
                col = col.copy()
                col[..., :3] = SLOT_COL[s["slot"]]
            al = col[..., 3:4] * m[..., None]
            reg = img[by0:by1 + 1, bx0:bx1 + 1]
            reg[..., :3] = reg[..., :3] * (1 - al) + col[..., :3] * al
    return (np.clip(img, 0, 1) * 255).astype(np.uint8)


rows = (len(frames) + cols - 1) // cols
sheet = Image.new("RGBA", (W * cols, H * rows), (40, 40, 40, 255))
for i, fr in enumerate(frames):
    sheet.paste(Image.fromarray(draw(fr), "RGBA"), ((i % cols) * W, (i // cols) * H))
sheet.save(out)
print("wrote", out, len(frames), "frames", W, "x", H)
