"""Cut the golfer's arms and putter off his single drawing (2026-10-23), so the
swing can move them as far as a golf swing needs.

The golfer is one continuous mesh (wp/tools/build_cast_mesh.py): good for the
body and the eight face cels, but an arm that stays part of that mesh can only
turn a few degrees before it tears. spine-generator's rule for layered rigs
(E:/stake/spine-generator/docs/生圖交付規格.md) is followed here:

  1. what an arm hides is painted: the shirt shoulder under each sleeve, the
     stretch of tail behind the right forearm, the grip inside the left fist
  2. pieces overlap at the joints: each lower piece carries a round cap of the
     drawing's own fur under the piece above it
  3. nothing is cut flat at a joint that shows

Writes, under design/source/putt/cast/mg/swing/:
  parts/<name>.png     each piece cropped to its box
  cels/<expr>.png      every face cel with both arms removed and the hidden
                       parts painted (build_cast_mesh.py reads these instead
                       of registered/ when the spec says `cels: 'swing/cels'`)
  cut.json             joints, part boxes and draw order, for the rig

    python -I design/swing/cut_golfer_arms.py
"""
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
MG = HERE.parent / 'source/putt/cast/mg'
OUT = MG / 'swing'
W, H = 560, 912
INK = np.array([22, 20, 14], float)
SHIRT = np.array([248, 231, 186], float)  # the shirt's cream, sampled off the collar

# ── joints, on the 560x912 canvas (y down), read off design/swing/grid.py ────
J = {
    'shoulderL': (180, 342), 'elbowL': (142, 456), 'wristL': (112, 510),
    'shoulderR': (388, 345), 'elbowR': (430, 478), 'wristR': (464, 556),
    # the putter: its axis through the fist, the grip's top end, the head
    'gripTop': (107, 516), 'grip': (100, 562), 'gripLow': (94, 612), 'head': (62, 846),
}
ELBOW_CAP, WRIST_CAP = 46, 34  # the joint caps' radii (the bare arm is ~65px wide at the elbow)

# loose outlines of each whole arm (sleeve to fingertips), drawn along the
# body's own ink so the body keeps its outline; the flood fill below trims
# them to the arm itself
REGION = {
    'L': [(150, 298), (187, 305), (181, 325), (177, 345), (178, 375), (181, 405), (184, 430),
          (182, 470), (180, 500), (150, 510), (140, 530), (136, 560), (131, 600), (127, 625),
          (108, 680), (112, 905), (0, 905), (0, 296)],
    'R': [(358, 294), (354, 320), (353, 350), (355, 385), (362, 410), (373, 430), (383, 446),
          (394, 470), (404, 520), (446, 524), (440, 560), (432, 600), (436, 660), (540, 660),
          (520, 560), (494, 536), (480, 470), (478, 420), (470, 380), (452, 294)],
}


def load(p):
    return np.asarray(Image.open(p).convert('RGBA'), float)


def poly_mask(poly):
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon(poly, fill=255)
    return np.asarray(m) > 0


def disc(c, r):
    yy, xx = np.mgrid[0:H, 0:W]
    return (xx - c[0]) ** 2 + (yy - c[1]) ** 2 <= r * r


def dilate(m, r):
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * r + 1))) > 0


def erode(m, r):
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(2 * r + 1))) > 0


def flood(allowed, seeds):
    """4-connected fill of `allowed` from the seed points"""
    out = np.zeros_like(allowed)
    stack = [(y, x) for x, y in seeds if allowed[y, x]]
    while stack:
        y, x = stack.pop()
        if out[y, x] or not allowed[y, x]:
            continue
        # scan the run
        x0 = x
        while x0 > 0 and allowed[y, x0 - 1] and not out[y, x0 - 1]:
            x0 -= 1
        x1 = x
        while x1 < W - 1 and allowed[y, x1 + 1] and not out[y, x1 + 1]:
            x1 += 1
        out[y, x0:x1 + 1] = True
        for yy in (y - 1, y + 1):
            if 0 <= yy < H:
                row = allowed[yy, x0:x1 + 1] & ~out[yy, x0:x1 + 1]
                for i in np.flatnonzero(row):
                    stack.append((yy, x0 + i))
    return out


def axial(p, a, b):
    """how far along a->b the pixels lie (0 at a, 1 at b), for the whole canvas"""
    yy, xx = np.mgrid[0:H, 0:W]
    dx, dy = b[0] - a[0], b[1] - a[1]
    return ((xx - a[0]) * dx + (yy - a[1]) * dy) / (dx * dx + dy * dy)


def side_of(a, b):
    """signed side of the line a->b, for every pixel"""
    yy, xx = np.mgrid[0:H, 0:W]
    return (b[0] - a[0]) * (yy - a[1]) - (b[1] - a[1]) * (xx - a[0])


def cut_line(j, a, b):
    """the half-plane past joint j, perpendicular to a->b (True on b's side)"""
    yy, xx = np.mgrid[0:H, 0:W]
    dx, dy = b[0] - a[0], b[1] - a[1]
    return (xx - j[0]) * dx + (yy - j[1]) * dy >= 0


def harmonic_fill(img, hole, known, iters=300):
    """paint `hole` by relaxing toward its known neighbours (a soft inpaint),
    on the hole's own box"""
    ys, xs = np.nonzero(hole)
    if not len(ys):
        return img
    y0, y1, x0, x1 = max(0, ys.min() - 14), ys.max() + 15, max(0, xs.min() - 14), xs.max() + 15
    full = img.copy()
    full[y0:y1, x0:x1] = _relax(img[y0:y1, x0:x1], hole[y0:y1, x0:x1], known[y0:y1, x0:x1], iters)
    return full


def _relax(img, hole, known, iters):
    out = img.copy()
    rgb = out[..., :3]
    m = hole.copy()
    rgb[m] = 0
    have = known & ~hole
    for _ in range(iters):
        acc = np.zeros_like(rgb)
        n = np.zeros(m.shape)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            src = np.roll(np.roll(rgb, dy, 0), dx, 1)
            ok = np.roll(np.roll(have | m, dy, 0), dx, 1)
            acc += src * ok[..., None]
            n += ok
        upd = m & (n > 0)
        rgb[upd] = acc[upd] / n[upd, None]
    out[..., :3] = rgb
    return out


def main():
    OUT.mkdir(exist_ok=True)
    (OUT / 'parts').mkdir(exist_ok=True)
    (OUT / 'cels').mkdir(exist_ok=True)
    N = load(MG / 'normalized.png')
    A = N[..., 3] > 8
    lum = N[..., :3].mean(-1)
    ink = lum < 70

    # ── the arms ─────────────────────────────────────────────────────────────
    regL0 = poly_mask(REGION['L']) & A
    # seeds on the sleeve, the fur, the hand, the head, and all along the shaft
    # (it is thin: most of it is ink, so every light pixel near its axis seeds)
    seeds = [(140, 380), (160, 350), (130, 392), (165, 330), (150, 440), (125, 480), (90, 550), (60, 846), (40, 846)]
    for t in np.linspace(0, 1, 120):
        for o in range(-5, 6):
            x = J['gripLow'][0] + (J['head'][0] - J['gripLow'][0]) * t + o
            y = J['gripLow'][1] + (J['head'][1] - J['gripLow'][1]) * t
            seeds.append((int(round(x)), int(round(y))))
    fillL = flood(regL0 & ~ink, seeds)
    regL = fillL | (dilate(fillL, 6) & regL0 & ink)
    # the right arm: fill its paint (not its ink) from seeds on the sleeve, the
    # fur and the hand, then take the ink that rims it; that keeps the tail,
    # which crosses behind the forearm, out of the arm
    regR0 = poly_mask(REGION['R']) & A
    paint = regR0 & ~ink
    fill = flood(paint, [(420, 360), (440, 380), (430, 440), (450, 500), (466, 540), (470, 600), (480, 625)])
    regR = fill | (dilate(fill, 6) & regR0 & ink)
    # the tail's own paint is never the arm's, even when the rim reaches it
    tail_paint = flood(paint & ~fill, [(424, 545), (500, 420), (505, 470)])
    regR &= ~dilate(tail_paint, 1) | fill

    # ── split each arm into upper (with its sleeve), fore, hand ──────────────
    def split(reg, s, e, w):
        below_e = cut_line(e, s, e)
        below_w = cut_line(w, e, w)
        upper = reg & ~below_e
        fore = reg & below_e & ~below_w
        hand = reg & below_w
        return upper, fore, hand

    upL, foL, haL = split(regL, J['shoulderL'], J['elbowL'], J['wristL'])
    upR, foR, haR = split(regR, J['shoulderR'], J['elbowR'], J['wristR'])

    # the putter leaves the left hand: everything of the region that is the
    # shaft (a thin band about the putter's axis) below the fist, and the head
    ax = axial(None, J['gripTop'], J['head'])
    sd = side_of(J['gripTop'], J['head']) / math.dist(J['gripTop'], J['head'])
    shaft_band = (np.abs(sd) <= 9) & (ax >= 0) & (ax <= 1.02)
    head_box = poly_mask([(10, 812), (112, 812), (112, 880), (10, 880)])
    fist = poly_mask([(56, 500), (140, 500), (138, 606), (100, 608), (58, 560)])
    yy = np.mgrid[0:H, 0:W][0]
    club = regL & ((yy > 606) | shaft_band | head_box) & ~fist
    haL = haL & ~club

    # ── caps: each lower piece reaches under the one above it ────────────────
    # wider than the arm, so the round end covers its whole cross-section and
    # a bent joint never opens a notch at the outside of the elbow
    def capped(piece, reg, j, r):
        return piece | (reg & disc(j, r))

    foL_c = capped(capped(foL, regL & ~club, J['elbowL'], ELBOW_CAP), regL & ~club, J['wristL'], WRIST_CAP)
    foR_c = capped(capped(foR, regR, J['elbowR'], ELBOW_CAP), regR, J['wristR'], WRIST_CAP)

    # the grip inside the fist, swept from the visible grip's cross-section
    grip_rgba = sweep_grip(N, regL & shaft_band & ~fist)

    # ── pieces as images ─────────────────────────────────────────────────────
    def take(mask, src=N, soft=True):
        img = src.copy()
        a = mask.astype(float)
        if soft:
            a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)), float) / 255
            a = np.where(mask, np.maximum(a, 0.5), a)
        img[..., 3] = src[..., 3] * a
        return img

    club_img = take(club, N, False)
    # the swept grip goes under the visible shaft
    gm = grip_rgba[..., 3] > 0
    club_img = over(club_img, grip_rgba)

    # every edge a cut made gets finished, so no piece shows a torn edge when
    # it moves away from what it was cut from:
    #   against the body   inked (it is the arm's own silhouette now)
    #   a cap's round end  inked: it lies under the piece above at rest and
    #                      only shows as the drawn outline of a bent elbow
    #   a flat end on top  (the sleeve's, the hand's) feathered over the cap
    #                      under it, so it never reads as a straight cut
    masks = {'armL': upL, 'foreL': foL_c, 'handL': haL, 'armR': upR, 'foreR': foR_c, 'handR': haR}
    joint_of = {'armL': foL_c, 'foreL': upL | haL | club, 'handL': foL_c | club,
                'armR': foR_c, 'foreR': upR | haR, 'handR': foR_c}
    on_top = {'armL', 'handL', 'armR', 'handR'}

    def finish(name):
        m = masks[name]
        # smooth the silhouette: no one-pixel fur strands left hanging off a cut
        m = erode(dilate(m, 1), 1) & A
        m = dilate(erode(m, 1), 1) | (m & ~dilate(~A, 2))
        # no pinholes: a hole inside a piece would get an inked rim of its own
        m = ~flood(~m, [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)])
        img = N.copy()
        ring = dilate(m, 1) & ~m & A
        # a cut pixel outside the piece that was this arm is a joint; anything
        # else it was cut from is the body
        arm = regL if name.endswith('L') else regR
        joint = ring & dilate(joint_of[name], 1)
        body = ring & ~arm
        a = m.astype(float)
        ink_band = m & dilate(body, 3)
        if name not in on_top:
            # only across the arm, not where the cap meets its silhouette
            ink_band |= m & dilate(joint & erode(arm, 4), 3)
        else:
            # feather: alpha ramps up over 6px from the flat cut
            near = np.zeros(m.shape)
            for k in range(1, 7):
                near = np.where((near == 0) & dilate(joint, k) & m, k, near)
            a = np.where(near > 0, np.clip((near - 0.5) / 6, 0.05, 1), a)
        img[ink_band, :3] = INK
        a = np.where(ink_band, 1.0, a)
        img[..., 3] = 255 * a
        return img

    pieces = {n: finish(n) for n in masks}
    pieces['club'] = club_img
    boxes = {}
    for name, img in pieces.items():
        a = img[..., 3]
        ys, xs = np.nonzero(a > 4)
        x0, y0, x1, y1 = xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3
        x0, y0 = max(0, x0), max(0, y0)
        x1, y1 = min(W, x1), min(H, y1)
        Image.fromarray(img[y0:y1, x0:x1].round().clip(0, 255).astype(np.uint8)).save(OUT / 'parts' / f'{name}.png')
        boxes[name] = [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]

    # ── the body without its arms ────────────────────────────────────────────
    gone = regL | regR
    # slivers of the arms' ink left stranded on the body side of the cut: keep
    # only what still joins the body
    gone |= A & poly_mask([(430, 568), (462, 568), (462, 662), (430, 662)])  # the right hand's rim
    gone |= A & poly_mask([(426, 508), (446, 508), (446, 529), (426, 529)])  # the forearm's rim over the tail
    gone |= A & poly_mask([(110, 420), (179, 420), (179, 448), (175, 470), (174, 505), (173, 545), (110, 560)])  # the left arm's fur over the vest's edge
    body = flood(A & ~gone, [(280, 450), (500, 420), (505, 470), (500, 520)])
    gone |= A & ~body
    body_alpha = A & ~gone
    # paint what the arms hid: the shirt shoulder under each sleeve, and the
    # tail behind the right forearm
    shoulderL = poly_mask([(205, 298), (176, 309), (162, 326), (158, 356), (164, 390), (178, 414), (196, 424), (210, 400), (212, 330)])
    shoulderR = poly_mask([(340, 296), (368, 306), (388, 322), (400, 350), (400, 392), (392, 420), (378, 434), (360, 420), (345, 380), (340, 330)])
    tail_fill = bridge_tail(N, body_alpha, (436, 497), None, (505, 580))

    sleeve = N[330:390, 130:170, :3].reshape(-1, 3)
    sleeve = sleeve[sleeve.mean(1) > 180]
    rng = np.random.default_rng(7)
    GRAIN = (sleeve[rng.integers(0, len(sleeve), H * W)] - np.median(sleeve, 0)).reshape(H, W, 3)

    def paint_body(cel):
        out = cel.copy()
        out[..., 3] = np.where(gone, 0, out[..., 3])
        for m in (shoulderL, shoulderR):
            hole = m & ~body_alpha
            # flat shirt cream, a shade darker toward the armpit, ink on the
            # outside edge only (where it meets the background, not the vest)
            yy = np.mgrid[0:H, 0:W][0]
            ys = np.flatnonzero(hole.any(1))
            k = np.clip((yy - ys.min()) / max(1, ys.max() - ys.min()), 0, 1)
            col = SHIRT[None, None, :] * (1 - 0.16 * k[..., None] ** 1.5)
            # the shirt's own weave: its noise, borrowed from the sleeve
            out[hole, :3] = col[hole] + GRAIN[hole]
            out[hole, 3] = 255
            outside = ~(m | body_alpha)
            rim = hole & dilate(outside, 3)
            out[rim, :3] = INK
            out[rim, 3] = 255
        tm = tail_fill[..., 3] > 0
        out[tm] = tail_fill[tm]
        return out

    cels = sorted((MG / 'registered').glob('*.png'))
    for p in cels:
        Image.fromarray(paint_body(load(p)).round().clip(0, 255).astype(np.uint8)).save(OUT / 'cels' / p.name)

    # the ball he hits: white, dimpled, inked like everything else
    boxes['ball'] = draw_ball(OUT / 'parts' / 'ball.png')

    meta = {
        '_note': 'design/swing/cut_golfer_arms.py, 2026-10-23: the golfer\'s arms and putter as pieces over the arm-less body mesh.',
        'joints': J, 'boxes': boxes,
        # back to front, all in front of the body
        'order': ['foreR', 'armR', 'club', 'foreL', 'armL', 'handL', 'handR', 'ball'],
    }
    (OUT / 'cut.json').write_text(json.dumps(meta, indent=1))
    print('parts', boxes)


def draw_ball(path, d=38):
    S = 4  # supersampled
    n = d * S
    img = Image.new('RGBA', (n + 8 * S, n + 8 * S), (0, 0, 0, 0))
    g = ImageDraw.Draw(img)
    o = 4 * S
    g.ellipse([o, o, o + n, o + n], fill=(22, 20, 14, 255))
    r = 3.2 * S
    g.ellipse([o + r, o + r, o + n - r, o + n - r], fill=(246, 243, 232, 255))
    # shade on the lower right, a highlight up left
    g.pieslice([o + r, o + r, o + n - r, o + n - r], 300, 120, fill=(214, 210, 196, 255))
    g.ellipse([o + r + 4 * S, o + r + 2 * S, o + n - r - 5 * S, o + n - r - 6 * S], fill=(246, 243, 232, 255))
    rng = np.random.default_rng(11)
    for _ in range(26):
        a_, rr = rng.uniform(0, 2 * math.pi), rng.uniform(0, 0.36) * n
        cx, cy = o + n / 2 + rr * math.cos(a_), o + n / 2 + rr * math.sin(a_)
        g.ellipse([cx - 1.6 * S, cy - 1.6 * S, cx + 1.6 * S, cy + 1.6 * S], fill=(196, 192, 178, 255))
    g.ellipse([o + n * 0.26, o + n * 0.2, o + n * 0.42, o + n * 0.34], fill=(255, 255, 252, 255))
    img = img.resize((img.width // S, img.height // S), Image.LANCZOS)
    img.save(path)
    return [0, 0, img.width, img.height]


def over(a, b):
    """b under a"""
    aa, ba = a[..., 3:] / 255, b[..., 3:] / 255
    oa = aa + ba * (1 - aa)
    rgb = (a[..., :3] * aa + b[..., :3] * ba * (1 - aa)) / np.maximum(oa, 1e-6)
    return np.concatenate([rgb, oa * 255], -1)


def sweep_grip(N, visible):
    """continue the grip up through the fist: the cross-section of the grip
    just below the hand, swept along the putter's axis to the grip's top"""
    a, b = np.array(J['gripTop'], float), np.array(J['head'], float)
    d = (b - a) / np.linalg.norm(b - a)
    nrm = np.array([-d[1], d[0]])
    out = np.zeros((H, W, 4))
    # sample the profile 12px below the fist
    base = np.array(J['gripLow'], float) + d * 6
    prof = []
    for s in np.arange(-9, 9.5, 0.5):
        x, y = base + nrm * s
        xi, yi = int(round(x)), int(round(y))
        prof.append(N[yi, xi] if visible[yi, xi] else np.zeros(4))
    prof = np.array(prof)
    L = np.dot(np.array(J['gripLow'], float) - a, d) + 4
    for t in np.arange(-3, L, 0.5):
        for k, s in enumerate(np.arange(-9, 9.5, 0.5)):
            x, y = a + d * t + nrm * s
            xi, yi = int(round(x)), int(round(y))
            if prof[k, 3] > out[yi, xi, 3]:
                out[yi, xi] = prof[k]
    # a round end cap on the grip
    return out


def bridge_tail(N, body_alpha, xr, _unused, yr):
    """the tail runs behind the right forearm: rebuild the hidden stretch by
    blending the column where it goes in with the one where it comes out,
    shifted along the tail's centre line"""
    xa, xb = xr
    y0, y1 = yr
    out = np.zeros((H, W, 4))

    def column(x):
        col = body_alpha[y0:y1, x]
        ys = np.flatnonzero(col) + y0
        return ys

    ca, cb = column(xa), column(xb)
    if not len(ca) or not len(cb):
        return out
    ta, ba_ = ca.min(), ca.max()
    seg = N[ta + 6:ba_ - 5, xa - 30:xa, :3].reshape(-1, 3)
    fur = seg[(seg.mean(1) > 60) & (seg[:, 0] > seg[:, 2] + 30)]
    rng = np.random.default_rng(3)
    tb, bb = cb.min(), cb.max()
    for x in range(xa + 1, xb):
        u = (x - xa) / (xb - xa)
        u = u * u * (3 - 2 * u)
        top = ta + (tb - ta) * u
        bot = ba_ + (bb - ba_) * u
        for y in range(int(round(top)), int(round(bot)) + 1):
            # the tail's ink is ~4px either side; inside it, its fur: the
            # tail's own pixels in random order, lighter along the top
            # the visible stretch of tail, its rows stretched to this height:
            # the fur's strokes run along the tail, so they carry on
            v = (y - top) / max(1, bot - top)
            k = (x - xa) % 30  # back and forth over the visible stretch, no seam
            xs_ = xa - 4 - (k if k < 15 else 29 - k)
            cs = column(xs_)
            if len(cs):
                out[y, x] = N[int(round(cs.min() + v * (cs.max() - cs.min()))), xs_]
            out[y, x, 3] = 255
    return out


if __name__ == '__main__':
    main()
