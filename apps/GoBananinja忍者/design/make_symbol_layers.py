"""The winning symbols split into the layers their mesh wins are drawn from
(src/game/meshWin/*, SymbolMeshWin.svelte) — Go Bananas Boat's method
(wp/.claude/skills/mesh-cast-rig, "The same method on reel SYMBOLS"), ported to
this game's art. What differs is the PLATE, and every rule below follows from it.

For every CUT-mode symbol (h1-h4, s, l1-l5) it writes, at 512px:

    {n}_plate.png    the slate tile with the subject lifted off it
    {n}_subject.png  the subject alone: what the mesh deforms
    {n}_shadow.png   a soft dark silhouette (quarter size), drawn on the slate
                     under the subject while it is in the air
    {n}_sheen.png    24 frames of light crossing the subject, pre-clipped to it

and for the PANEL-mode Wild (the ninja's portrait fills its tile; it cannot be
cut out of it): w_glow.png and w_sheen.png, masked to the portrait.

HOW A SUBJECT IS FOUND. The slate is DARK (lum 20-45) and nearly neutral, a
touch blue (b over r); the ink round every subject is as dark as the slate, and
each subject has a painted drop shadow on it. So, unlike Boat, ink cannot be a
wall. What separates subject from slate is colour: the slate is low-chroma and
never warm. Each subject is a generous hand-traced HULL (in the rigs' 256
canvas) and a flood from outside it walks through everything slate-like, but
only BAND px in from the hull's edge. The outline is then taken back as the
dark pixels in a thin ring round what the flood left. The parts of a subject
that ARE slate-coloured — the bomb's black-purple body, the fan's dark ribs —
are `solid`: subject by fiat.

THE PLATE UNDER IT. Boat rebuilt corrugated steel column by column. Slate has
no direction, so here the hole takes its LOW frequencies from the tile itself
(a push-pull fill of the rim, which keeps each tile's own tone and the dark
contact shade round where the subject sat) and its HIGH frequencies — the
grain and the cracks — from a DONOR tile at the same position: the first of
the other tiles of the same kind whose own subject does not cover that pixel
(the empty X tile is always one for the slate tiles). The letters' recessed
panels donate to each other the same way.

Usage: E:/stake/math-sdk/env/Scripts/python.exe design/make_symbol_layers.py [h1,l1,...]
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

APP = Path(__file__).resolve().parents[1]
SRC = APP / 'static/assets/sprites/goBananasSymbolsV3'
OUT = APP / 'static/assets/sprites/goBananinjaMesh'
OUT.mkdir(parents=True, exist_ok=True)

SIZE = 512          # the layers
CANVAS = 256        # the rigs
K = SIZE / CANVAS
SHEEN_FRAMES, SHEEN_COLS, SHEEN_CELL = 24, 6, 128


def read(name: str) -> np.ndarray:
    return np.asarray(Image.open(SRC / f'{name}.png').convert('RGB').resize((SIZE, SIZE), Image.LANCZOS), np.float32)


def save(name: str, rgba: np.ndarray):
    Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA').save(OUT / name, optimize=True)


# --- shapes in canvas px ---------------------------------------------------------
YY, XX = np.mgrid[0:SIZE, 0:SIZE]
CX, CY = (XX + 0.5) / K, (YY + 0.5) / K


def poly(pts):
    pts = np.asarray(pts, float)
    inside = np.zeros((SIZE, SIZE), bool)
    j = len(pts) - 1
    for i in range(len(pts)):
        xi, yi = pts[i]
        xj, yj = pts[j]
        cond = (yi > CY) != (yj > CY)
        with np.errstate(divide='ignore', invalid='ignore'):
            xcross = (xj - xi) * (CY - yi) / (yj - yi) + xi
        inside ^= cond & (CX < xcross)
        j = i
    return inside


def circ(c, r):
    return (CX - c[0]) ** 2 + (CY - c[1]) ** 2 <= r * r


def line(pts, half):
    out = np.zeros((SIZE, SIZE), bool)
    for (ax, ay), (bx, by) in zip(pts[:-1], pts[1:]):
        dx, dy = bx - ax, by - ay
        t = np.clip(((CX - ax) * dx + (CY - ay) * dy) / (dx * dx + dy * dy), 0, 1)
        out |= np.hypot(ax + t * dx - CX, ay + t * dy - CY) <= half
    return out


def sector(c, r0, r1, a0, a1):
    """a ring sector about c, angles in degrees (0 right, -90 up)"""
    r = np.hypot(CX - c[0], CY - c[1])
    a = np.degrees(np.arctan2(CY - c[1], CX - c[0]))
    return (r >= r0) & (r <= r1) & (a >= a0) & (a <= a1)


def union(*masks):
    out = np.zeros((SIZE, SIZE), bool)
    for m in masks:
        out |= m
    return out


# --- morphology --------------------------------------------------------------------
def dilate(mask, r):
    r = int(round(r))
    if r <= 0:
        return mask.copy()
    im = Image.fromarray(mask.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(2 * r + 1))
    return np.asarray(im) > 127


def erode(mask, r):
    return ~dilate(~mask, r)


def blur(a, r):
    im = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))
    return np.asarray(im, np.float32) / 255


def _box(a, r, axis):
    """box blur of radius r along an axis, edge-clamped"""
    r = max(1, int(round(r)))
    pad = [(0, 0)] * a.ndim
    pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode='edge'), axis=axis, dtype=np.float64)
    hi = np.take(c, np.arange(2 * r + 1, c.shape[axis]), axis=axis)
    lo = np.take(c, np.arange(0, c.shape[axis] - 2 * r - 1), axis=axis)
    return ((hi - lo) / (2 * r + 1)).astype(np.float32)


def blur_f(a, r):
    """a gaussian-ish blur (three box passes) of any float image, per channel"""
    b = max(1.0, r * 0.85)
    for _ in range(3):
        a = _box(_box(a, b, 0), b, 1)
    return a


def components(mask):
    """label 4-connected components (small images; iterative flood)"""
    lab = np.zeros(mask.shape, np.int32)
    n = 0
    H, W = mask.shape
    for y0, x0 in zip(*np.nonzero(mask)):
        if lab[y0, x0]:
            continue
        n += 1
        stack = [(y0, x0)]
        lab[y0, x0] = n
        while stack:
            y, x = stack.pop()
            for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n
                    stack.append((yy, xx))
    return lab, n


def depth_inside(mask, cap):
    d = np.zeros(mask.shape, np.float32)
    ring = mask.copy()
    for k in range(1, cap + 1):
        ring = erode(ring, 1)
        if not ring.any():
            break
        d[ring] = k
    return d


def lum(img):
    return img.mean(2)


def chroma(img):
    return img.max(2) - img.min(2)


# --- what each subject is (canvas px) -----------------------------------------------
# `hull` is traced a few px OUTSIDE the subject; `solid` is subject whatever its
# colour; `never` is plate whatever its colour.
FAN_PIVOT = (127, 183)
SUBJECTS = {
    # the kabuto: horns, bowl, crest, visor, side guards, neck plates, cord and knot
    'h1': dict(
        hull=[
            poly([[6, 30], [40, 14], [70, 18], [100, 6], [118, 22], [128, 18], [138, 22], [156, 6], [186, 18], [216, 14], [250, 30],
                  [226, 50], [206, 86], [252, 100], [254, 186], [232, 206], [176, 210], [166, 246], [92, 246], [80, 210],
                  [24, 206], [2, 186], [4, 100], [50, 86], [30, 50]]),
        ],
        solid=[poly([[66, 140], [190, 140], [196, 178], [60, 178]])],
    ),
    # the shuriken: four blades and the hub
    'h2': dict(
        hull=[
            poly([[12, 10], [100, 74], [128, 62], [156, 74], [246, 10], [182, 100], [194, 128], [182, 156], [248, 236],
                  [156, 184], [128, 196], [100, 184], [8, 236], [74, 156], [62, 128], [74, 100]]),
            circ((128, 129), 44),
        ],
        solid=[circ((128, 129), 22)],
    ),
    # the smoke bomb: the ball, its neck and fuse, and the clouds
    'h3': dict(
        hull=[
            poly([[26, 52], [56, 22], [100, 8], [150, 10], [196, 22], [214, 42], [222, 70], [236, 92], [242, 120], [240, 160],
                  [236, 196], [212, 206], [196, 226], [150, 236], [100, 234], [64, 214], [40, 200], [14, 170], [10, 140],
                  [12, 100], [20, 74]]),
        ],
        solid=[circ((132, 152), 70), poly([[140, 70], [176, 60], [196, 90], [170, 110], [146, 104]])],
    ),
    # the fan: the paper, the guard sticks, the ribs, the rivet, the cords and tassels
    'h4': dict(
        hull=[
            poly([[2, 108], [16, 76], [40, 50], [80, 28], [128, 18], [176, 28], [216, 50], [242, 78], [254, 118], [254, 144],
                  [200, 172], [150, 190], [136, 196], [170, 200], [206, 216], [204, 246], [150, 246], [128, 216],
                  [104, 246], [50, 246], [50, 214], [84, 200], [118, 196], [100, 190], [60, 160], [2, 130]]),
        ],
        solid=[sector(FAN_PIVOT, 0, 74, -160, -20), circ(FAN_PIVOT, 14)],
    ),
    # the bananas and their rope
    's': dict(
        hull=[
            poly([[100, 18], [120, 8], [140, 16], [150, 6], [182, 14], [184, 44], [200, 70], [226, 104], [244, 150], [242, 196],
                  [228, 230], [180, 236], [150, 226], [134, 222], [80, 216], [36, 208], [32, 186], [56, 172], [26, 166],
                  [6, 140], [6, 110], [40, 100], [86, 78], [100, 52]]),
        ],
    ),
}
LETTERS = ['l1', 'l2', 'l3', 'l4', 'l5']
# the letters' recessed panel (the frame of brushed steel round it is never subject)
LETTER_PANEL = (36, 36, 220, 220)
INNER = (10, 10, 246, 246)
GROW = 6      # canvas px the hull is grown by before use
BAND = 26     # canvas px the flood may run in from the hull's edge


def plate_like(img):
    """the slate: dark-to-mid, low chroma, never warm"""
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    L = lum(img)
    return (chroma(img) < 42) & (b - r > -8) & (L < 120)


def finish(hard, img, ring=1.6):
    """islands, small holes, the outline back, a feathered edge"""
    lab, n = components(hard)
    if n:
        sizes = np.bincount(lab.ravel())
        keep = np.isin(lab, np.nonzero(sizes >= 50 * K * K)[0]) & hard
    else:
        keep = hard
    # fill small enclosed holes
    lab2, n2 = components(~keep)
    if n2:
        border = set(np.unique(np.concatenate([lab2[0], lab2[-1], lab2[:, 0], lab2[:, -1]])))
        sizes = np.bincount(lab2.ravel())
        for i in range(1, n2 + 1):
            if i not in border and sizes[i] < 80 * K * K:
                keep |= lab2 == i
    # the outline: dark pixels in a thin ring round the body
    near = dilate(keep, ring * K) & ~keep
    keep |= near & (lum(img) < 46)
    grown = dilate(keep, 1)
    return blur(grown.astype(np.float32), 1.2)


def cut(img, spec):
    inner = (CX >= INNER[0]) & (CX < INNER[2]) & (CY >= INNER[1]) & (CY < INNER[3])
    hull = dilate(union(*spec['hull']), GROW * K) & inner
    depth = depth_inside(hull, int(BAND * K) + 1)
    passable = plate_like(img)
    solid = union(*spec.get('solid', []))
    passable &= ~solid
    # flood from outside the hull through slate, within the band
    outside = ~hull
    frontier = dilate(outside, 1) & hull & passable & (depth <= BAND * K)
    reach = passable & (depth <= BAND * K)
    seen = outside.copy()
    stack = list(zip(*np.nonzero(frontier)))
    for y, x in stack:
        seen[y, x] = True
    while stack:
        y, x = stack.pop()
        for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= yy < SIZE and 0 <= xx < SIZE and not seen[yy, xx] and reach[yy, xx]:
                seen[yy, xx] = True
                stack.append((yy, xx))
    hard = hull & ~seen
    hard |= solid & inner
    for m in spec.get('never', []):
        hard &= ~m
    return finish(hard, img)


def cut_letter(img):
    """raised steel letter (light face + dark bevel) on a mottled recessed panel"""
    x0, y0, x1, y1 = LETTER_PANEL
    panel = (CX >= x0) & (CX < x1) & (CY >= y0) & (CY < y1)
    L = lum(img)
    vals = L[panel]
    # the face is the bright mode; the panel tops out ~120 with a few chalky flecks
    face = panel & (L > max(128, np.percentile(vals, 70))) & (chroma(img) < 40)
    face = erode(dilate(face, 2 * K), 2 * K)
    lab, n = components(face)
    sizes = np.bincount(lab.ravel())
    face = np.isin(lab, np.nonzero(sizes >= 900 * K * K)[0]) & face
    # the bevel: the dark band hugging the face
    bevel = dilate(face, 7 * K) & ~face & (L < 70) & panel
    hard = face | bevel
    hard = erode(dilate(hard, 1 * K), 1 * K)
    return finish(hard, img, ring=0.6)


# --- the plate ---------------------------------------------------------------------
def push_pull(img, known):
    """fill unknown pixels from the known ones, smooth at every scale"""
    levels = []
    c = img * known[..., None]
    w = known.astype(np.float32)
    while c.shape[0] > 4:
        levels.append((c, w))
        H, W = c.shape[:2]
        c = c.reshape(H // 2, 2, W // 2, 2, 3).sum((1, 3))
        w = w.reshape(H // 2, 2, W // 2, 2).sum((1, 3))
    col = c / np.maximum(w, 1e-6)[..., None]
    for c2, w2 in reversed(levels):
        H, W = c2.shape[:2]
        up = np.stack([np.asarray(Image.fromarray(col[..., k].astype(np.float32), 'F').resize((W, H), Image.BILINEAR)) for k in range(3)], -1)
        own = c2 / np.maximum(w2, 1e-6)[..., None]
        a = np.clip(w2, 0, 1)[..., None]
        col = own * a + up * (1 - a)
    return col


def fill_plate(img, alpha, donors):
    """donors: [(image, hole mask)] in priority order"""
    hole = dilate(alpha > 0.02, 3 * K)
    # the subject's own light painted on the slate round it (the shuriken's
    # green rim glow, a blade's glint) goes with it: coloured or bright pixels
    # near the subject are not slate
    hole |= dilate(alpha > 0.02, 12 * K) & ~plate_like(img)
    hole = dilate(hole, 1 * K)
    soft_hole = blur(hole.astype(np.float32), 3 * K)
    # The rim is mostly the subject's painted DROP SHADOW — near black — and a
    # pure push-pull filled the whole hole with it. Deep inside the hole the
    # tone is the tile's typical slate; the rim colour only reaches in a little.
    rim = push_pull(img, ~hole)
    plate_px = ~dilate(hole, 8 * K) & (CX > 14) & (CX < 242) & (CY > 14) & (CY < 242)
    typical = np.median(img[plate_px], axis=0)
    d = depth_inside(hole, int(40 * K))
    k_rim = np.exp(-d / (6 * K))[..., None]
    low = rim * k_rim + typical * (1 - k_rim)
    low = blur_f(low, 3 * K)
    hf = np.zeros_like(img)
    have = np.zeros((SIZE, SIZE), bool)
    for dimg, dhole in donors:
        take = ~have & ~dilate(dhole, 2 * K)
        detail = dimg - blur_f(dimg, 4 * K)
        hf[take] = detail[take]
        have |= take
    # a touch darker toward the middle of the hole: the contact shade
    d = depth_inside(hole, int(16 * K))
    shade = 1 - 0.12 * np.clip(d / (14 * K), 0, 1)
    filled = (low + hf * 0.9) * shade[..., None]
    out = img * (1 - soft_hole[..., None]) + filled * soft_hole[..., None]
    return np.clip(out, 0, 255)


# --- the sheen (Boat's bake, numpy) ----------------------------------------------------
def bake_sheen(img, alpha):
    C, S = SHEEN_CELL, SIZE // SHEEN_CELL
    rows = -(-SHEEN_FRAMES // SHEEN_COLS)
    atlas = np.zeros((rows * C, SHEEN_COLS * C, 4), np.float32)
    Lm = 0.3 * img[..., 0] + 0.59 * img[..., 1] + 0.11 * img[..., 2]
    ls = np.sort(Lm[alpha > 0.5])
    median, top = ls[len(ls) // 2], ls[int(len(ls) * 0.98)]
    gloss = 0.45 + 0.55 * np.clip((Lm - median) / max(1, top - median), 0, 1)
    dd = XX + YY
    on = alpha > 0.5
    dmin, dmax = dd[on].min(), dd[on].max()
    late = (alpha > 0.9) & (dd >= dmin + (dmax - dmin) * 0.55)
    gi = np.argmax(np.where(late, Lm, -1))
    gy, gx = divmod(gi, SIZE)
    band_w = 26 * K
    for f in range(SHEEN_FRAMES):
        t = f / (SHEEN_FRAMES - 1)
        centre = dmin - band_w + t * (dmax - dmin + 2 * band_w)
        glint = max(0.0, 1 - abs(t - 0.8) / 0.2)
        u = (dd - centre) / band_w
        band = np.exp(-u * u * 2.2)
        dx, dy = (XX - gx) / K, (YY - gy) / K
        r = np.hypot(dx, dy)
        cross = np.exp(-dx * dx / 3) * np.exp(-dy * dy / 400) + np.exp(-dy * dy / 3) * np.exp(-dx * dx / 400)
        star = glint * (np.exp(-r * r / 30) + 0.8 * cross)
        v = alpha * np.minimum(1, band * gloss + star)
        v = v.reshape(C, S, C, S).mean((1, 3))
        ox, oy = (f % SHEEN_COLS) * C, (f // SHEEN_COLS) * C
        atlas[oy:oy + C, ox:ox + C, 0] = 255
        atlas[oy:oy + C, ox:ox + C, 1] = 250
        atlas[oy:oy + C, ox:ox + C, 2] = 232
        atlas[oy:oy + C, ox:ox + C, 3] = 255 * np.minimum(1, v)
    return atlas


def write_layers(name, img, alpha, donors, shadow=True):
    a255 = np.round(alpha * 255)
    subject = np.zeros((SIZE, SIZE, 4), np.float32)
    m = a255 > 0
    subject[m, :3] = img[m]
    subject[..., 3] = a255
    save(f'{name}_subject.png', subject)
    plate = fill_plate(img, alpha, donors)
    save(f'{name}_plate.png', np.concatenate([plate, np.full((SIZE, SIZE, 1), 255, np.float32)], -1))
    if shadow:
        soft = blur(blur(alpha, 5 * K), 5 * K)
        q = soft.reshape(SIZE // 4, 4, SIZE // 4, 4).mean((1, 3))
        sh = np.zeros((SIZE // 4, SIZE // 4, 4), np.float32)
        sh[..., 0], sh[..., 1], sh[..., 2] = 6, 8, 12
        sh[..., 3] = 255 * np.minimum(1, q * 1.15)
        save(f'{name}_shadow.png', sh)
    save(f'{name}_sheen.png', bake_sheen(img, alpha))
    print(f'{name}: subject {int((alpha > 0.5).sum() / (K * K))} canvas px')


def main():
    only = sys.argv[1].split(',') if len(sys.argv) > 1 else None
    want = lambda n: only is None or n in only
    imgs = {n: read(n) for n in ['h1', 'h2', 'h3', 'h4', 's', 'm', 'x', 'w'] + LETTERS}
    # the katana tile is mostly plate; its blade is the only thing on it
    m_hole = dilate(line([[10, 236], [160, 90], [244, 6]], 24), 2)
    holes = {'x': np.zeros((SIZE, SIZE), bool), 'm': m_hole}
    alphas = {}
    for n, spec in SUBJECTS.items():
        alphas[n] = cut(imgs[n], spec)
        holes[n] = alphas[n] > 0.02
    for n in LETTERS:
        alphas[n] = cut_letter(imgs[n])
        holes[n] = alphas[n] > 0.02
    slate_donors = ['x', 'h2', 's', 'h4', 'h3', 'h1']
    for n in SUBJECTS:
        if not want(n):
            continue
        donors = [(imgs[d], holes[d]) for d in slate_donors if d != n]
        write_layers(n, imgs[n], alphas[n], donors)
    for n in LETTERS:
        if not want(n):
            continue
        # every letter sits in the middle of its panel, so the middle is under a
        # letter on all five tiles; past the other tiles, the panels donate
        # SHIFTED, sideways and up/down by ~60px, so that mottle comes from
        # elsewhere on a panel of the same kind
        x0, y0, x1, y1 = LETTER_PANEL
        off_panel = ~((CX >= x0 + 4) & (CX < x1 - 4) & (CY >= y0 + 4) & (CY < y1 - 4))
        donors = [(imgs[d], holes[d]) for d in LETTERS if d != n]
        for dx, dy in [(64, 0), (-64, 0), (0, 64), (0, -64), (64, 64), (-64, -64), (64, -64), (-64, 64)]:
            sx, sy = int(dx * K), int(dy * K)
            for d in LETTERS:
                donors.append((np.roll(imgs[d], (sy, sx), (0, 1)), np.roll(holes[d] | off_panel, (sy, sx), (0, 1))))
        write_layers(n, imgs[n], alphas[n], donors)
    # THE SPLIT TILES (the katana's cut cell: the symbol twice, smaller, on a
    # diagonal). Each motif's mask is the symbol's own cut, scaled and placed
    # where design/fit_split_motifs.py measured it (src/game/meshWin/
    # splitFit.json), grown a little and checked against the split art's own
    # colour, so the two painted motifs come off their slate together.
    import json
    fit_src = (APP / 'src/game/meshWin/splitFit.ts').read_text(encoding='utf-8')
    fit = json.loads(fit_src[fit_src.index('= ') + 2:fit_src.rindex(';')])
    for n in list(SUBJECTS) + LETTERS:
        sym = n.upper()
        if sym not in fit or not want(n + 's'):
            continue
        img = read(f'{n}_split')
        union_a = np.zeros((SIZE, SIZE), np.float32)
        for motif in fit[sym].values():
            sc, x, y = motif
            m = int(round(SIZE * sc))
            a_m = np.asarray(Image.fromarray((alphas[n] * 255).astype(np.uint8)).resize((m, m), Image.LANCZOS), np.float32) / 255
            ox, oy = int(round(x * K)), int(round(y * K))
            x0, y0 = max(0, ox), max(0, oy)
            x1, y1 = min(SIZE, ox + m), min(SIZE, oy + m)
            union_a[y0:y1, x0:x1] = np.maximum(union_a[y0:y1, x0:x1], a_m[y0 - oy:y1 - oy, x0 - ox:x1 - ox])
        inner = (CX >= INNER[0]) & (CX < INNER[2]) & (CY >= INNER[1]) & (CY < INNER[3])
        if n in LETTERS:
            x0, y0, x1, y1 = LETTER_PANEL
            inner &= (CX >= x0) & (CX < x1) & (CY >= y0) & (CY < y1)
        hard = dilate(union_a > 0.3, 2 * K) & inner & (~plate_like(img) | (union_a > 0.6) | (lum(img) > 128))
        a_s = finish(hard, img)
        holes[n + 's'] = a_s > 0.02
        donors = [(imgs[d], holes[d]) for d in (LETTERS if n in LETTERS else slate_donors) if d != n]
        write_layers(n + 's', img, a_s, donors)
    if want('ws'):
        img = read('w_split')
        inner = (CX >= 12) & (CX < 244) & (CY >= 12) & (CY < 244)
        hard = erode(dilate(inner & ~plate_like(img), 2 * K), 2 * K)
        mask = blur(hard.astype(np.float32), 3 * K)
        save('ws_glow.png', np.concatenate([img, (mask * 255)[..., None]], -1))
        save('ws_sheen.png', bake_sheen(img, mask))
        print('ws: panel -> ws_{glow,sheen}.png')

    if want('w'):
        # the portrait: everything inside the tile's edge that is not slate
        img = imgs['w']
        inner = (CX >= 12) & (CX < 244) & (CY >= 12) & (CY < 244)
        hard = inner & ~plate_like(img)
        hard = erode(dilate(hard, 2 * K), 2 * K)
        mask = blur(hard.astype(np.float32), 3 * K)
        glow = np.concatenate([img, (mask * 255)[..., None]], -1)
        save('w_glow.png', glow)
        save('w_sheen.png', bake_sheen(img, mask))
        print('w: panel -> w_{glow,sheen}.png')


if __name__ == '__main__':
    main()
