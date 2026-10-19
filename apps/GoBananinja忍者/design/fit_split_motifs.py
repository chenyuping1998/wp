"""Where the two motifs sit on each SPLIT tile (the katana's cut cell).

A split tile shows its symbol twice, smaller, overlapping on a diagonal: one
behind at the upper left, one in front at the lower right. They were painted,
not composed by a script, so their scale and position are MEASURED here by
matching the symbol's own cut subject (make_symbol_layers.py) against the split
art: the front motif first (fully visible), then the back one with the front's
pixels masked out.

Writes src/game/meshWin/splitFit.ts — SPLIT_FIT = { "H1": { "back": [s, x, y],
"front": [s, x, y] }, ... } (a .ts, so the gate can load it under bare node) in the rigs' 256 canvas: a motif point p maps to
(x + s*p.x, y + s*p.y). splitRig.ts builds the split rigs from it.

    E:/stake/math-sdk/env/Scripts/python.exe design/fit_split_motifs.py
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
MESH = APP / 'static/assets/sprites/goBananinjaMesh'
ART = APP / 'static/assets/sprites/goBananasSymbolsV3'
N = 128  # working resolution (canvas 256 -> 128: half)


def load_rgb(path, size):
    return np.asarray(Image.open(path).convert('RGB').resize((size, size), Image.LANCZOS), np.float32) / 255


def edges(img):
    g = img.mean(2)
    gx = np.zeros_like(g)
    gy = np.zeros_like(g)
    gx[:, 1:-1] = g[:, 2:] - g[:, :-2]
    gy[1:-1] = g[2:] - g[:-2]
    return np.hypot(gx, gy)


def fit(symbol, panel_alpha=None):
    k = symbol.lower()
    split = load_rgb(ART / f'{k}_split.png', N)
    sub = Image.open(MESH / f'{k}_subject.png').convert('RGBA') if panel_alpha is None else None
    full = Image.open(ART / f'{k}.png').convert('RGB').resize((N, N), Image.LANCZOS)
    alpha_full = (np.asarray(sub.getchannel('A').resize((N, N), Image.LANCZOS), np.float32) / 255) if sub is not None else panel_alpha
    target = split
    best = {}
    taken = np.zeros((N, N), bool)
    for which in ('front', 'back'):
        mirrored = symbol == 'W' and which == 'front'
        template = full.transpose(Image.Transpose.FLIP_LEFT_RIGHT) if mirrored else full
        alpha_template = np.fliplr(alpha_full) if mirrored else alpha_full
        top = (-1e9, None)
        for s in np.arange(0.5, 0.8, 0.01):
            m = int(round(N * s))
            tpl = np.asarray(template.resize((m, m), Image.LANCZOS), np.float32) / 255
            ta = np.asarray(Image.fromarray((alpha_template * 255).astype(np.uint8)).resize((m, m), Image.LANCZOS), np.float32) / 255
            w = ta > 0.5
            if w.sum() < 50:
                continue
            for y in range(0, N - m + 1, 2):
                for x in range(0, N - m + 1, 2):
                    region = target[y:y + m, x:x + m]
                    ww = w & ~taken[y:y + m, x:x + m]
                    if ww.sum() < 0.4 * w.sum():
                        continue
                    err = np.abs(region[ww] - tpl[ww]).mean()
                    score = -err
                    if score > top[0]:
                        top = (score, (float(s), x, y, m))
        s, x, y, m = top[1]
        # refine to 1px
        tpl = np.asarray(template.resize((m, m), Image.LANCZOS), np.float32) / 255
        ta = np.asarray(Image.fromarray((alpha_template * 255).astype(np.uint8)).resize((m, m), Image.LANCZOS), np.float32) / 255
        w = ta > 0.5
        bx, by, be = x, y, 1e9
        for yy in range(max(0, y - 2), min(N - m, y + 2) + 1):
            for xx in range(max(0, x - 2), min(N - m, x + 2) + 1):
                ww = w & ~taken[yy:yy + m, xx:xx + m]
                e = np.abs(target[yy:yy + m, xx:xx + m][ww] - tpl[ww]).mean()
                if e < be:
                    bx, by, be = xx, yy, e
        taken[by:by + m, bx:bx + m] |= w
        # back to the 256 canvas: canvas point p -> (x + s p)
        best[which] = [round(m / N, 4), bx * 256 / N, by * 256 / N, round(float(be), 4)]
    return best


if __name__ == '__main__':
    dest = APP / 'src/game/meshWin/splitFit.ts'
    selected = sys.argv[1].split(',') if len(sys.argv) > 1 else None
    old = dest.read_text(encoding='utf-8') if dest.exists() else ''
    out = json.loads(old[old.index('=') + 1:].strip().rstrip(';')) if selected else {}
    for sym in ['H1', 'H2', 'H3', 'H4', 'S', 'L1', 'L2', 'L3', 'L4', 'L5', 'W']:
        if selected and sym not in selected:
            continue
        portrait = None
        if sym == 'W':
            w = np.asarray(Image.open(ART / 'w.png').convert('RGB').resize((N, N), Image.LANCZOS), np.float32)
            ch = w.max(2) - w.min(2)
            portrait = ((ch > 42) | (w[..., 0] - w[..., 2] > -8) & (w.mean(2) > 120)).astype(np.float32)
            portrait[:6] = portrait[-6:] = 0
            portrait[:, :6] = portrait[:, -6:] = 0
        f = fit(sym, panel_alpha=portrait)
        out[sym] = {k: v[:3] for k, v in f.items()}
        print(sym, f, flush=True)
    dest.write_text('// Measured split motif transforms; foreground W is mirrored in splitRig.ts.\n'
                    'export const SPLIT_FIT: Record<string, Record<string, [number, number, number]>> = '
                    + json.dumps(out, indent='\t') + ';\n', encoding='utf-8')
