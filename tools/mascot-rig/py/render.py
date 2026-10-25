"""Offline renderer for mascot-rig: rasterizes every mesh triangle with numpy (barycentric, bilinear texture lookup),
slot by slot in draw order, over a dark stage with a ground shadow. No GPU, no Spine runtime needed: the vertex
positions come from the rigger (frames.bin), the textures are the delivery's own layer PNGs.

usage: python render.py <work dir (meta.json, frames.bin)> <layers dir> <out dir> [--no-gif] [--stills i,j,...]
   → <out>/預覽.gif, <out>/逐格.png (three frames from every move)
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

work, layers, out = sys.argv[1], sys.argv[2], sys.argv[3]
args = sys.argv[4:]
meta = json.load(open(os.path.join(work, "meta.json"), encoding="utf-8"))
nf, OW, OH = meta["frames"], meta["width"], meta["height"]
nv = sum(len(s["verts"]) for s in meta["slots"])
allv = np.fromfile(os.path.join(work, "frames.bin"), dtype=np.float32).reshape(nf, nv, 2)
os.makedirs(out, exist_ok=True)

Q = meta.get("texScale", 0.5)  # textures pre-shrunk toward the output size
tex = {}
for s in meta["slots"]:
    im = Image.open(os.path.join(layers, s["file"])).convert("RGBA")
    im = im.resize((max(1, int(im.width * Q)), max(1, int(im.height * Q))), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255.0
    a[..., :3] *= a[..., 3:4]  # premultiplied
    tex[s["name"]] = a


def font(size, bold=True):
    for f in (["C:/Windows/Fonts/msjhbd.ttc"] if bold else []) + ["C:/Windows/Fonts/msjh.ttc", "/System/Library/Fonts/PingFang.ttc",
                                                                   "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"]:
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


FONT, SMALL = font(20), font(13, False)


def sample(t, u, v):
    h, w = t.shape[:2]
    u = np.clip(u, 0, w - 1.001); v = np.clip(v, 0, h - 1.001)
    x0 = u.astype(np.int32); y0 = v.astype(np.int32); fx = (u - x0)[:, None]; fy = (v - y0)[:, None]
    return t[y0, x0] * (1 - fx) * (1 - fy) + t[y0, x0 + 1] * fx * (1 - fy) + t[y0 + 1, x0] * (1 - fx) * fy + t[y0 + 1, x0 + 1] * fx * fy


def raster_slot(buf, t, dst, uv, tris):
    """One slot into its own layer (overlaps inside a slot overwrite, never double-blend), then composited over."""
    P, U = dst[tris], uv[tris]
    x0 = np.clip(np.floor(P[..., 0].min(1)).astype(np.int32), 0, OW - 1); x1 = np.clip(np.ceil(P[..., 0].max(1)).astype(np.int32), 0, OW - 1)
    y0 = np.clip(np.floor(P[..., 1].min(1)).astype(np.int32), 0, OH - 1); y1 = np.clip(np.ceil(P[..., 1].max(1)).astype(np.int32), 0, OH - 1)
    w, h = x1 - x0 + 1, y1 - y0 + 1
    cnt = w * h
    tid = np.repeat(np.arange(len(tris)), cnt)
    off = np.arange(tid.size) - np.repeat(np.cumsum(cnt) - cnt, cnt)
    px, py = x0[tid] + off % w[tid], y0[tid] + off // w[tid]
    cx, cy = px + 0.5, py + 0.5
    a, b, c = P[tid, 0], P[tid, 1], P[tid, 2]
    den = (b[:, 1] - c[:, 1]) * (a[:, 0] - c[:, 0]) + (c[:, 0] - b[:, 0]) * (a[:, 1] - c[:, 1])
    den = np.where(np.abs(den) < 1e-9, 1e-9, den)
    l0 = ((b[:, 1] - c[:, 1]) * (cx - c[:, 0]) + (c[:, 0] - b[:, 0]) * (cy - c[:, 1])) / den
    l1 = ((c[:, 1] - a[:, 1]) * (cx - c[:, 0]) + (a[:, 0] - c[:, 0]) * (cy - c[:, 1])) / den
    l2 = 1 - l0 - l1
    inside = (l0 >= -1e-4) & (l1 >= -1e-4) & (l2 >= -1e-4)
    tid, px, py, l0, l1, l2 = tid[inside], px[inside], py[inside], l0[inside], l1[inside], l2[inside]
    ua, ub, uc = U[tid, 0], U[tid, 1], U[tid, 2]
    col = sample(t, l0 * ua[:, 0] + l1 * ub[:, 0] + l2 * uc[:, 0], l0 * ua[:, 1] + l1 * ub[:, 1] + l2 * uc[:, 1])
    layer = np.zeros((OH, OW, 4), np.float32)
    layer[py, px] = col
    buf *= 1 - layer[..., 3:4]
    buf += layer


slots, base = [], 0
for s in meta["slots"]:
    n = len(s["verts"])
    slots.append((s["name"], base, n, np.array(s["verts"], np.float32) * Q, np.array(s["tris"], np.int64).reshape(-1, 3)))
    base += n

grad = np.linspace(0, 1, OH)[:, None, None]
STAGE = np.concatenate([np.array([0.15, 0.16, 0.19]) * (1 - grad) + np.array([0.10, 0.11, 0.13]) * grad + np.zeros((OH, OW, 3)), np.ones((OH, OW, 1))], 2).astype(np.float32)
g = meta["ground"]
sh = Image.new("L", (OW, OH), 0)
ImageDraw.Draw(sh).ellipse([g[0] - 0.18 * OW - 40, g[1] - 10, g[0] + 0.18 * OW + 40, g[1] + 10], fill=110)
SHADOW = np.asarray(sh.filter(ImageFilter.GaussianBlur(8))).astype(np.float32)[..., None] / 255.0


def render(i):
    buf = STAGE.copy()
    buf[..., :3] *= 1 - 0.6 * SHADOW
    for name, b0, n, uv, tris in slots:
        raster_slot(buf, tex[name], allv[i, b0:b0 + n], uv, tris)
    img = Image.fromarray((np.clip(buf[..., :3], 0, 1) * 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    d.text((12, 8), meta["labels"][i], font=FONT, fill=(240, 240, 240))
    d.text((OW - 60, 8), f"#{i}", font=FONT, fill=(255, 220, 120))
    d.text((12, OH - 22), meta.get("footer", ""), font=SMALL, fill=(150, 150, 160))
    return img


if "--stills" in args:
    for i in [int(x) for x in args[args.index("--stills") + 1].split(",")]:
        render(i).save(os.path.join(out, f"frame_{i:04d}.png"))

# contact sheet: three moments from every move (a quarter, half and three quarters in)
picks = []
for seg in meta["segments"]:
    if seg["anim"] == "idle" and picks:
        continue
    picks += [seg["start"] + int(seg["n"] * f) for f in ((0.5,) if seg["anim"] == "idle" else (0.25, 0.5, 0.75))]
cells = [render(i) for i in picks]
cols = 6
sheet = Image.new("RGB", (OW * cols, OH * ((len(cells) + cols - 1) // cols)), (20, 20, 24))
for k, im in enumerate(cells):
    sheet.paste(im, ((k % cols) * OW, (k // cols) * OH))
sheet.save(os.path.join(out, "逐格.png"))

if "--no-gif" not in args:
    frames = [render(i) for i in range(nf)]
    frames[0].save(os.path.join(out, "預覽.gif"), save_all=True, append_images=frames[1:], duration=int(1000 / meta["fps"]), loop=0, optimize=False)
print(f"render: sheet {len(cells)} cells" + ("" if "--no-gif" in args else f", gif {nf} frames"))
