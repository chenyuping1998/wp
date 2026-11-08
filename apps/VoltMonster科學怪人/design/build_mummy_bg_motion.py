"""Background motion parts (2026-11-07).

The far plates are clean stone; the props layers carry the fires (and, in the
base game, two hanging linen swags) painted on top. Until now the base game drew
the props AND a second copy of the linen, and turned that copy about the screen
centre — so the swags slid against their own static double. Here:

  base     each swag its own sprite (the cream only — the linen layer is a
           block of wall WITH the swags, and turning it moved the wall), hung
           from the ceiling and swaying about its top
  all      every flame cut out of its props layer (warm, bright, above the bowl)
           as its own sprite anchored at the flame's base, drawn OVER the
           painted flame — so it can lick upward (scale >= 1) without ever
           uncovering the painted one

Writes static/assets/sprites/mummyBackground/{linen_*, flame_*}.webp and src/game/bgMotionParts.ts (positions in the
1920 x 1080 plate). Run with the system python (numpy, Pillow, OpenCV).
"""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
BG = ROOT.parent / 'static/assets/sprites/mummyBackground'
OUT_TS = ROOT.parent / 'src/game/bgMotionParts.ts'


def load(n):
    return np.array(Image.open(BG / f'{n}.webp').convert('RGBA'))


def save(a, n):
    Image.fromarray(a, 'RGBA').save(BG / f'{n}.webp', quality=90)


parts = {'base': {'linen': [], 'flames': []}, 'feature': {'flames': []}, 'hold': {'flames': []}}

# ── linen: two swags, hung from the top edge ────────────────────────────────────
linen = load('bg_base_linen')
# the linen layer is a soft-edged block of wall WITH the swags on it: the swag
# itself is the cream — bright and warm-lit (S ~110-150), the wall saturated orange (S 180+)
lhsv = cv2.cvtColor(linen[:, :, :3], cv2.COLOR_RGB2HSV)
cream = (linen[:, :, 3] > 100) & (lhsv[:, :, 1] < 160) & (lhsv[:, :, 2] > 140)
cream = cv2.morphologyEx(cream.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
lm = cv2.morphologyEx(cream, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
k, lab, st, _ = cv2.connectedComponentsWithStats(lm)
pieces = sorted([i for i in range(1, k) if st[i, 4] > 800], key=lambda i: st[i, 0])
for j, i in enumerate(pieces):
    x, y, w, h, _ = st[i]
    pad = 4
    x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(1920, x + w + pad), min(1080, y + h + pad)
    piece = linen[y0:y1, x0:x1].copy()
    keep = (lab[y0:y1, x0:x1] == i).astype(np.float32)
    keep = cv2.GaussianBlur(cv2.dilate(keep, np.ones((3, 3), np.uint8)), (0, 0), 1.0)
    piece[:, :, 3] = (piece[:, :, 3] * np.clip(keep * 1.4, 0, 1)).astype(np.uint8)
    save(piece, f'linen_{j}')
    parts['base']['linen'].append({'key': f'mummyBaseLinen{j}', 'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0),
                                   # hung from the ceiling: sway about the top middle
                                   'ax': 0.5, 'ay': 0.0})

# ── flames: an additive copy of each painted flame ─────────────────────────────
# Cutting the flames out does not work: the base game's left torch lights its
# whole wall to near white, and no colour test parts fire from that wall. So
# each flame is an ADDITIVE copy of the painting's own flame, masked to a soft
# teardrop over it and to its bright pixels, licking up from its base and
# flickering. Additive, a misregistration only adds light — it can never
# uncover anything. Boxes measured on the plates (flamegrid, 2026-11-07):
#   (centre x, base y, height, width) in the 1920 x 1080 plate
FLAMES = {
    'base': ('bg_base', [(100, 160, 170, 150), (1850, 330, 150, 110)]),
    'feature': ('bg_feature', [(375, 600, 100, 84), (1630, 668, 100, 80)]),
    'hold': ('bg_holdandspin', [(487, 90, 100, 112), (1547, 90, 100, 112)]),
}
for mode, (plate, boxes) in FLAMES.items():
    full = np.array(Image.open(BG / f'{plate}.webp').convert('RGB'))
    for j, (cx, by, h, w) in enumerate(boxes):
        x0, x1 = max(0, cx - w // 2 - 8), min(1920, cx + w // 2 + 8)
        y0, y1 = max(0, by - h - 8), min(1080, by + 6)
        rgb = full[y0:y1, x0:x1]
        yy, xx = np.mgrid[y0:y1, x0:x1]
        # a teardrop: widest a third of the way up, pointed at the top
        u = (yy - (by - h)) / h  # 0 top .. 1 base
        half = (w / 2) * np.clip(np.sqrt(np.clip(u, 0, 1)) * 1.15, 0, 1) * np.clip((1.06 - u) * 4, 0, 1)
        d = np.abs(xx - cx) / np.maximum(half, 1)
        shape = np.clip(1 - d, 0, 1) ** 0.7
        hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
        bright = np.clip((hsv[:, :, 2].astype(np.float32) - 150) / 90, 0, 1)
        a = cv2.GaussianBlur(shape * bright, (0, 0), 2)
        out = np.dstack([rgb, (np.clip(a, 0, 1) * 255).astype(np.uint8)])
        save(out, f'flame_{mode}_{j}')
        parts[mode]['flames'].append({'key': f'mummyFlame{mode.capitalize()}{j}', 'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0),
                                      'ax': round((cx - x0) / (x1 - x0), 3), 'ay': round((by - y0) / (y1 - y0), 3)})

ts = (
    '// Generated by design/build_mummy_bg_motion.py — do not edit by hand.\n'
    '// Positions are in the 1920 x 1080 background plate; (ax, ay) is the anchor\n'
    '// the part moves about (linen: its top; a flame: its base).\n'
    'export type BgPart = { key: string; x: number; y: number; w: number; h: number; ax: number; ay: number };\n'
    f'export const BG_MOTION_PARTS: Record<\'base\' | \'feature\' | \'hold\', {{ linen?: BgPart[]; flames: BgPart[] }}> = {json.dumps(parts, indent=1)};\n'
)
OUT_TS.write_text(ts, encoding='utf-8')
print(json.dumps({m: {k: len(v) for k, v in p.items()} for m, p in parts.items()}))
