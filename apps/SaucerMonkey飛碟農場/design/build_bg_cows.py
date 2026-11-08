"""The cows that wander the field at night (user 2026-11-06: 讓獎圖的那隻牛在背景走來走去 → 切說明圖乳牛來做).

The prize symbol is a bust (no legs), so the walking cow is cut from the intro card that has three full-body cows
in the same hand and the same red collar: design/source/saucer/intro/intro_collect.png, the middle one (her legs are the nearest to standing).

    1. crop it, and remove the tractor beam behind it: a flood fill from outside the crop through every pixel that is
       not ink stops at the cow's own keyline; the largest piece left is the cow (the cow above pokes a hoof in)
    2. the beam lights her belly and far legs green — re-light those as moonlit shadow (a dark cool blue-grey of the
       same value), so the far legs read as in shade, which is what they are
    3. level her: in the card she is rising up the beam, tilted nose-up; a cow walking a field stands level
    4. grade her into the night plate (cooler, a touch darker) and pad onto a square canvas, hooves on FEET_Y

Writes static/assets/sprites/saucerNight/cow_walk.png (CANVAS x CANVAS) and, with --grid, a measuring sheet to the
path given (hips, knees and the tail root for the rig are read off that).
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
SRC = APP / 'design/source/saucer/intro/intro_collect.png'
OUT = APP / 'static/assets/sprites/saucerNight/cow_walk.png'
CROP = (1050, 415, 1385, 668)
LEVEL_DEG = -12.0  # PIL rotates counter-clockwise for positive angles; she is nose-up, so turn her clockwise
INK_LUM, BARRIER = 95, 1
CANVAS = 320


def enclosed_by_cow(keep):
    # placeholder: every kept pixel counts as the cow's own (the far legs are lit the beam's green)
    return keep


def outside_light(rgb):
    # the beam and the pale halo round the cow: light pixels that are green-leaning
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return (g > r + 8) & (g > 120)
FEET_Y = 292
FAR_HIND = (80, 218, 94, 254)  # x0, y0, x1, y1


# hand hints in crop px, read off a 3x measuring grid of the crop: strokes down the middle of every leg, the
# tail and its tuft, and the body and head — GrabCut finds the real edge from there. Needed because the keyline has
# gaps and the beam lights her far legs the beam's own green, so neither a flood nor a colour key can separate them.
FG_STROKES = [
    [(67, 167), (65, 200), (63, 228)],          # near hind leg
    [(97, 185), (98, 207)],                     # far hind leg (green-lit)
    [(150, 160), (145, 200), (138, 238)],       # near front leg
    [(203, 155), (190, 180), (173, 207)],       # far front leg (green-lit)
    [(68, 100), (35, 110), (20, 130), (30, 150), (40, 160)],  # tail
    [(23, 175), (30, 185)],                     # tuft
    [(80, 120), (120, 100), (170, 95), (200, 70)],  # body to neck
    [(230, 50), (260, 60), (285, 75), (255, 95)],   # head
    [(232, 130)],                               # bell
]
FG_BLOBS = [((120, 120), (50, 22)), ((250, 70), (28, 22)), ((200, 110), (22, 22))]
BG_RECTS = [(203, 207, 335, 253), (110, 0, 140, 18), (0, 0, 14, 40), (29, 147, 39, 163)]  # the cow below, the hoof above, the corner, the beam inside the tail's curl


def cut():
    import cv2
    im = np.array(Image.open(SRC).convert('RGBA').crop(CROP))
    h, w = im.shape[:2]
    bgr = np.ascontiguousarray(im[..., [2, 1, 0]])
    m = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    cv2.rectangle(m, (6, 6), (w - 7, h - 7), cv2.GC_PR_FGD, -1)
    r, g, b = (im[..., i].astype(int) for i in range(3))
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    m[(g > r + 35) & (g > b + 35) & (lum > 165)] = cv2.GC_PR_BGD
    for (cx, cy), (rx, ry) in FG_BLOBS:
        cv2.ellipse(m, (cx, cy), (rx, ry), 0, 0, 360, cv2.GC_FGD, -1)
    for stroke in FG_STROKES:
        if len(stroke) == 1:
            cv2.circle(m, stroke[0], 6, cv2.GC_FGD, -1)
        for p0, p1 in zip(stroke, stroke[1:]):
            cv2.line(m, p0, p1, cv2.GC_FGD, 4)
    for x0, y0, x1, y1 in BG_RECTS:
        m[y0:y1, x0:x1] = cv2.GC_BGD
    m[:3], m[-3:], m[:, :3], m[:, -3:] = cv2.GC_BGD, cv2.GC_BGD, cv2.GC_BGD, cv2.GC_BGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, m, None, bgd, fgd, 8, cv2.GC_INIT_WITH_MASK)
    mask = ((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD)).astype(np.uint8)
    # largest piece, holes filled, a hair smoothed
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    if n > 1:
        mask = (lab == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    return im.astype(np.int32), mask.astype(bool)


def relight(im, mask):
    out = im.astype(np.float64).copy()
    rgb = out[..., :3]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # 2. green-lit cow: green clearly above both others → the same value as a cool blue-grey shadow
    greenish = mask & (g > r + 12) & (g > b + 6)
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    k = np.clip((g - np.maximum(r, b)) / 60, 0, 1)  # how green: blend fully only where it is plainly the beam's light
    shade = np.stack([lum * 0.42, lum * 0.46, lum * 0.64], axis=-1)
    blend = (greenish * k)[..., None]
    rgb[:] = rgb * (1 - blend) + shade * blend
    # 4. into the night: cooler and a touch down (the plate's own creams sit about here)
    rgb[:] = rgb * np.array([0.72, 0.76, 0.92])
    out[..., 3] = np.where(mask, im[..., 3], 0)
    return np.clip(out, 0, 255).astype(np.uint8)


def main():
    im, mask = cut()
    cow = Image.fromarray(relight(im, mask), 'RGBA')
    # 3. level her
    cow = cow.rotate(LEVEL_DEG, resample=Image.BICUBIC, expand=True)
    bbox = cow.getbbox()
    cow = cow.crop(bbox)
    # on the square canvas, centred, hooves on FEET_Y
    canvas = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    scale = min((CANVAS - 20) / cow.width, (FEET_Y - 10) / cow.height, 1.0)
    if scale < 1:
        cow = cow.resize((round(cow.width * scale), round(cow.height * scale)), Image.LANCZOS)
    canvas.alpha_composite(cow, ((CANVAS - cow.width) // 2, FEET_Y - cow.height))
    # 5. the far hind leg: a short stub peeking from behind the udder. Standing, the near hind leg swings over
    #    it, and one mesh cannot pass a leg over another without folding — so it goes; from the side the near
    #    hind leg covers where it would be. (canvas px, read off the --grid sheet; the pink udder is kept)
    arr = np.array(canvas)
    ys, xs = np.mgrid[0:CANVAS, 0:CANVAS]
    r, g = arr[..., 0].astype(int), arr[..., 1].astype(int)
    stub = (xs >= FAR_HIND[0]) & (xs <= FAR_HIND[2]) & (ys >= FAR_HIND[1]) & (ys <= FAR_HIND[3]) & ~(r > g + 25)
    arr[stub, 3] = 0
    canvas = Image.fromarray(arr, 'RGBA')
    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT)
    print(f'{OUT.name}: cow {cow.width}x{cow.height} on {CANVAS}x{CANVAS}, hooves at y {FEET_Y}')
    if '--grid' in sys.argv:
        sheet = Image.new('RGBA', (CANVAS * 3, CANVAS * 3), (40, 52, 96, 255))
        big = canvas.resize((CANVAS * 3, CANVAS * 3), Image.NEAREST)
        sheet.alpha_composite(big)
        px = sheet.load()
        for v in range(0, CANVAS, 10):
            col = (255, 80, 80, 255) if v % 50 == 0 else (120, 140, 190, 255)
            for i in range(CANVAS * 3):
                px[v * 3, i] = col
                px[i, v * 3] = col
        sheet.convert('RGB').save(sys.argv[sys.argv.index('--grid') + 1])


if __name__ == '__main__':
    main()
