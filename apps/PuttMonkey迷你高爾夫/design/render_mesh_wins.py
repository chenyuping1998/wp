"""Offline render of Jade Teahouse's mesh wins, for LOOKING at them.

The gate (check_mesh_wins.mjs) measures triangle area; it cannot tell whether
an act reads. This draws what SymbolMeshWin.svelte draws — the still card, the
drop shadow, the posed mesh — from vertices the gate dumps from the shipped
meshWin/*.ts, so there is no second copy of the motion to drift.

    node design/check_mesh_wins.mjs H1 --dump frames.json [ms,ms,...]
    python design/render_mesh_wins.py frames.json out.png

Each frame is drawn on its card, over a grey board, with the act's ms under it.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

APP = Path(__file__).resolve().parents[1]
SPR = APP / "static/assets/sprites"
SCALE = 1.25  # px per canvas unit in the render
CELL = round(256 * SCALE)

# must match Symbol.svelte (the card under each symbol) and assets.ts
# The low pays are a pennant on their own, with no card under them
# (Symbol.svelte draws none for a lowLetter): drawing another flag there put a
# still copy under the cloth and read as a ghost edge (2026-10-23).
CARD = {"H1": "sushiV8/back_h1.png", "H2": "sushiV8/back_h2.png", "S": "sushiV8/back_s.png"}
SUBJECT = {"H1": "sushiSymbols/h1.png", "H2": "sushiSymbols/h2.png", "H3": "sushiSymbols/h3.png",
           "H4": "sushiSymbols/h4.png", "W": "sushiSymbols/w.png", "S": "sushiSymbols/s.png",
           # the pennants as the game loads them (assets.ts gbL1..gbL5)
           **{f"L{n}": f"sushiSymbols/l{n}_flag_v2.png" for n in range(1, 6)}}
# must match SymbolMeshWin.svelte
SHADOW_ALPHA, SHADOW_SPREAD, SHADOW_DROP = 0.45, 0.12, 3
# the card is drawn SYMBOL_SIZE square; a high's painting is 0.88 of that
HIGH = {"H1", "H2", "H3", "H4", "W", "S"}


def raster(tex, uvs, verts, indices, size):
    """nearest-texel triangle fill, premultiplied over transparent"""
    out = np.zeros((size, size, 4), float)
    th, tw = tex.shape[:2]
    for k in range(0, len(indices), 3):
        ids = indices[k:k + 3]
        p = np.array([[verts[i * 2] * SCALE, verts[i * 2 + 1] * SCALE] for i in ids])
        uv = np.array([[uvs[i * 2], uvs[i * 2 + 1]] for i in ids])
        x0, y0 = np.floor(p.min(0)).astype(int)
        x1, y1 = np.ceil(p.max(0)).astype(int)
        x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, size - 1), min(y1, size - 1)
        if x1 < x0 or y1 < y0:
            continue
        ys, xs = np.mgrid[y0:y1 + 1, x0:x1 + 1]
        px, py = xs + 0.5, ys + 0.5
        (ax, ay), (bx, by), (cx, cy) = p
        d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(d) < 1e-9:
            continue
        l1 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / d
        l2 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / d
        l3 = 1 - l1 - l2
        m = (l1 >= -1e-6) & (l2 >= -1e-6) & (l3 >= -1e-6)
        if not m.any():
            continue
        u = l1 * uv[0, 0] + l2 * uv[1, 0] + l3 * uv[2, 0]
        v = l1 * uv[0, 1] + l2 * uv[1, 1] + l3 * uv[2, 1]
        tx = np.clip((u * tw).astype(int), 0, tw - 1)
        ty = np.clip((v * th).astype(int), 0, th - 1)
        out[ys[m], xs[m]] = tex[ty[m], tx[m]]
    return out


def main():
    dump = json.loads(Path(sys.argv[1]).read_text())
    sym = dump["symbol"].split(":")[0]
    subj = SUBJECT.get(sym, f"jadeMesh/{sym.lower()}_subject.png")
    tex = np.asarray(Image.open(SPR / subj).convert("RGBA"), float) / 255
    shadow_src = Image.open(SPR / f"jadeMesh/{sym.lower()}_shadow.png").convert("RGBA")
    card_src = Image.open(SPR / CARD[sym]).convert("RGBA") if sym in CARD else None
    fit = 0.88 if sym in HIGH else 1.0
    frames = dump["frames"]
    pad = 40
    sheet = Image.new("RGBA", (len(frames) * (CELL + 10), CELL + pad * 2 + 20), (46, 52, 48, 255))
    for i, f in enumerate(frames):
        cell = Image.new("RGBA", (CELL, CELL + pad * 2), (46, 52, 48, 255))
        if card_src is not None:
            card_px = round(CELL / fit)
            card = card_src.resize((card_px, card_px), Image.LANCZOS)
            cell.alpha_composite(card, ((CELL - card_px) // 2, pad + (CELL - card_px) // 2))
        air = f["air"]
        if air > 0:
            spread = 1 + SHADOW_SPREAD * air
            s = shadow_src.resize((round(CELL * spread), round(CELL * spread)), Image.LANCZOS)
            a = np.asarray(s, float)
            a[..., 3] *= SHADOW_ALPHA * air
            s = Image.fromarray(a.astype(np.uint8))
            feet = dump["feetY"] * SCALE
            sx = round(CELL / 2 - CELL * spread / 2 + f["rigid"]["dx"] * SCALE)
            sy = round(feet - feet * spread + SHADOW_DROP * air * SCALE) + pad
            cell.alpha_composite(s, (sx, sy))
        m = raster(tex, dump["uvs"], f["verts"], dump["indices"], CELL + 0)
        mesh = Image.fromarray((m * 255).astype(np.uint8))
        layer = Image.new("RGBA", cell.size, (0, 0, 0, 0))
        layer.paste(mesh, (0, pad))
        cell = Image.alpha_composite(cell, layer)
        sheet.alpha_composite(cell, (i * (CELL + 10), 0))
        ImageDraw.Draw(sheet).text((i * (CELL + 10) + 4, CELL + pad * 2 + 4), f"{f['ms']}ms", fill="white")
    sheet.convert("RGB").save(sys.argv[2])
    print("wrote", sys.argv[2])


if __name__ == "__main__":
    main()
