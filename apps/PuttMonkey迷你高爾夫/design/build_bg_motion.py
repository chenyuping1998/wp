"""Cut the moving parts out of the two background plates (Stake review 2026-10-24:
"the background is too static").

What moves, and why these:
  * the WINDMILL'S SAILS turn. A windmill that never turns is the most static
    thing a player can look at; it is the obvious one. Cut off the plate with
    the hole behind them filled, and drawn back over it at exactly angle 0, so
    the plate at rest is unchanged.
  * the SUN'S RAYS (base only) turn slowly: the classic cartoon sun. Same cut.
  * everything else (palms, umbrellas, flag, volcano plume) is a mesh over the
    plate itself, game/meshWin/bgProps.ts — no cut needed, borders pinned.
  * the feature's LAMPS and LAVA flicker: an additive copy of their bright
    pixels (glow maps), no geometry at all.

The originals are kept in design/source/backgrounds_static_20261024/; this script
always reads from there, so it can be re-run.

    python design/build_bg_motion.py [--preview DIR]
"""

import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
APP = HERE.parent
OUT = APP / "static" / "assets" / "sprites" / "sushiBackground"
SRC = HERE / "source" / "backgrounds_static_20261024"

# ── the windmill, in plate px (1920 x 1080) ─────────────────────────────────
HUB = (244.0, 311.7)
# the four sails, traced on the plate (outline included)
SAILS = [
    [(140, 237), (182, 205), (233, 278), (213, 297)],  # up-left
    [(311, 232), (339, 266), (279, 302), (259, 283)],  # up-right
    [(131, 370), (209, 322), (232, 349), (169, 412)],  # down-left
    [(256, 341), (275, 327), (338, 385), (316, 414)],  # down-right
]
SPOKE_W = 9
HUB_R = 13
# where the sails can reach while turning: the hole is the swept DISC minus
# what is in front of the sails (nothing: they are the front-most thing)
SAIL_R = 120

# ── the sun (base plate only) ───────────────────────────────────────────────
SUN = (284.0, 100.0)
SUN_RAYS_R = 160
# the fourteen rays, inner end -> outer end, traced on the plate
RAYS = [
    ((230, 47), (190, 10)), ((257, 27), (250, -4)), ((302, 22), (300, -4)),
    ((335, 37), (352, 10)), ((352, 62), (422, 21)), ((362, 90), (404, 85)),
    ((357, 120), (434, 141)), ((340, 152), (384, 194)), ((310, 172), (329, 217)),
    ((272, 175), (267, 212)), ((242, 167), (220, 207)), ((222, 147), (188, 177)),
    ((210, 117), (156, 135)), ((212, 80), (146, 66)),
]


def sail_mask(size):
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    for poly in SAILS:
        d.polygon(poly, fill=255)
        # the spoke from the hub to the sail's inner end
        inner = min(poly, key=lambda p: (p[0] - HUB[0]) ** 2 + (p[1] - HUB[1]) ** 2)
        cx = sum(p[0] for p in poly) / 4
        cy = sum(p[1] for p in poly) / 4
        d.line([HUB, (cx, cy)], fill=255, width=SPOKE_W)
        del inner
    d.ellipse([HUB[0] - HUB_R, HUB[1] - HUB_R, HUB[0] + HUB_R, HUB[1] + HUB_R], fill=255)
    return m.filter(ImageFilter.MaxFilter(5))


def ray_mask(img):
    """The rays: a band around each traced stroke, minus the sky in it.

    Traced rather than keyed on colour: the rays are the same cream as the
    clouds they run into, so a colour key takes a bite out of the clouds."""
    a = np.asarray(img.convert("RGB"), float)
    band = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(band)
    for p, q in RAYS:
        d.line([p, q], fill=255, width=17)
    band = np.asarray(band) > 0
    R, B = a[..., 0], a[..., 2]
    sky = B > R + 40
    m = Image.fromarray(((band & ~sky) * 255).astype(np.uint8))
    # wide enough to take the rays' pale anti-aliased fringe too, or each ray
    # leaves a ghost of itself on the sky as it turns away
    return m.filter(ImageFilter.MaxFilter(7))


def pushpull_fill(rgb, hole):
    """Fill `hole` (bool) from its surroundings: a push-pull pyramid, i.e. a
    smooth membrane over the gap. Grain is added afterwards to match the print."""
    levels = []
    c = rgb * (~hole)[..., None]
    w = (~hole).astype(float)
    while min(w.shape) > 4:
        levels.append((c, w))
        H, W = w.shape
        H2, W2 = H // 2 * 2, W // 2 * 2
        c = c[:H2, :W2].reshape(H2 // 2, 2, W2 // 2, 2, 3).sum((1, 3))
        w = w[:H2, :W2].reshape(H2 // 2, 2, W2 // 2, 2).sum((1, 3))
    filled = c / np.maximum(w, 1e-6)[..., None]
    for c, w in reversed(levels):
        H, W = w.shape
        up = np.repeat(np.repeat(filled, 2, 0), 2, 1)
        up = np.pad(up, ((0, max(0, H - up.shape[0])), (0, max(0, W - up.shape[1])), (0, 0)), mode="edge")[:H, :W]
        up = np.asarray(Image.fromarray(np.clip(up, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1)), float)
        known = w > 0
        mine = c / np.maximum(w, 1e-6)[..., None]
        filled = np.where(known[..., None] & (w[..., None] >= 0.999), mine, up)
    return filled


def grain_like(rgb, hole, around, seed):
    """Copy the print's grain (its high-pass) from a ring around the hole."""
    rng = np.random.default_rng(seed)
    blur = np.asarray(Image.fromarray(rgb.astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)), float)
    hp = rgb - blur
    ys, xs = np.nonzero(around & ~hole)
    # only the print's fine grain, never its ink lines: a dark outline
    # pixel copied into a sky-blue gap reads as dirt
    quiet = np.abs(hp).max(-1)[ys, xs] < 18
    ys, xs = ys[quiet], xs[quiet]
    out = rgb.copy()
    hy, hx = np.nonzero(hole)
    pick = rng.integers(0, len(ys), len(hy))
    out[hy, hx] += hp[ys[pick], xs[pick]] * 0.7
    return out


# The windmill's own body behind the sails. The membrane fill is fine for sky,
# cloud and trees (soft, far, and only seen while the sails are moving); the
# red cap and tower are not - smeared into the green they read as a stain - so
# they are repainted as flat shapes with an ink edge, and the membrane is built
# WITHOUT them so no red bleeds into the trees.
#
# Edges measured from the pixels the sails leave visible (rows 322/410-423 for
# the tower's flanks, the apex and the two brim corners for the cap) and run
# straight through the parts the sails hide.
MILL_TOWER = [(189, 320), (271, 320), (306, 424), (152, 424)]
MILL_CAP = [(233, 259), (241, 259), (287, 315), (178, 315)]
# where to take each shape's colour from, on the same plate (visible red)
MILL_SAMPLES = {"tower": (210, 412), "cap": (248, 282)}
INK = (38, 22, 20)


def mill_silhouette(size):
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    d.polygon(MILL_TOWER, fill=255)
    d.polygon(MILL_CAP, fill=255)
    return np.asarray(m.filter(ImageFilter.MaxFilter(3))) > 0


def repaint_mill(fill, rgb, hole):
    h, w = hole.shape
    layer = Image.fromarray(np.clip(fill, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(layer)
    for poly, key in ((MILL_TOWER, "tower"), (MILL_CAP, "cap")):
        sx, sy = MILL_SAMPLES[key]
        colour = tuple(int(v) for v in np.median(rgb[sy - 3 : sy + 4, sx - 3 : sx + 4].reshape(-1, 3), 0))
        d.polygon(poly, fill=colour, outline=INK, width=4)
    # the cap's underside is one heavy ink line across the tower top
    d.line([(178, 316), (287, 316)], fill=INK, width=5)
    painted = np.asarray(layer, float)
    inside = mill_silhouette((w, h))
    return np.where((inside & hole)[..., None], painted, fill), inside


def sail_only(rgb, m, center, box_r):
    """Trim the traced sail mask to the sails themselves (user 2026-10-31: the
    turning sails carried a rim of sky, tower red and tree green).

    The traced quads are coarse and dilated, so they hold background round
    every sail. Each sail is ringed by its own ink outline, so: flood the
    background in from outside the mask through anything that is not ink, and
    whatever the flood cannot reach is sail. The ink barrier is thickened 1px
    2px so an anti-aliased gap cannot let the flood into a sail; the light
    pixels that thickening kept are then peeled off the outside three times."""
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)
    ink = ((lum < 110) & (sat < 90)) | (lum < 75)
    x0, y0 = int(center[0] - box_r - 20), int(center[1] - box_r - 20)
    x1, y1 = int(center[0] + box_r + 20), int(center[1] + box_r + 20)
    sub_m = m[y0:y1, x0:x1] > 0.02
    sub_ink = ink[y0:y1, x0:x1]
    barrier = np.asarray(Image.fromarray((sub_ink * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
    grid = np.where(sub_m & barrier, 128, 0).astype(np.uint8)
    # .copy(): an image made by fromarray shares the array's read-only buffer
    # and floodfill silently writes nothing into it
    flood = Image.fromarray(grid).copy()
    ImageDraw.floodfill(flood, (0, 0), 255)
    bg = np.asarray(flood) == 255
    for _ in range(3):
        grown = np.asarray(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
        bg = bg | (grown & ~sub_ink)
    # the traced quads shrunk well inside the outline are sail whatever the
    # flood says: where an outline has a gap the flood leaks a corner in, and
    # that corner would also be smeared into the hole fill as a pale stain
    core = np.asarray(Image.fromarray((sub_m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(13))) > 0
    sail = np.zeros(m.shape, bool)
    sail[y0:y1, x0:x1] = (sub_m & ~bg) | core
    return sail


# measured across the clean up-left sail's outer edge, from outside in: ~4px
# of near-black ink, ~3px of red frame, then the cream panels
SAIL_FRAME, SAIL_INK = 3.5, 4.0
SAIL_INK_RGB = (8, 10, 8)


def _hull(pts):
    """convex hull of (x, y) points, counter-clockwise (monotone chain)"""
    pts = sorted(set(map(tuple, pts)))
    def half(seq):
        out = []
        for p in seq:
            while len(out) >= 2 and (out[-1][0] - out[-2][0]) * (p[1] - out[-2][1]) - (out[-1][1] - out[-2][1]) * (p[0] - out[-2][0]) <= 0:
                out.pop()
            out.append(p)
        return out
    lo, hi = half(pts), half(pts[::-1])
    return lo[:-1] + hi[:-1]


def _offset(poly, d):
    """a convex counter-clockwise polygon pushed out by d px, corners mitred"""
    n = len(poly)
    lines = []
    for i in range(n):
        (x0, y0), (x1, y1) = poly[i], poly[(i + 1) % n]
        ex, ey = x1 - x0, y1 - y0
        L = np.hypot(ex, ey) or 1
        nx, ny = ey / L, -ex / L  # outward for counter-clockwise in y-down
        lines.append(((x0 + nx * d, y0 + ny * d), (ex, ey)))
    out = []
    for i in range(n):
        (p, r), (q, s_) = lines[i - 1], lines[i]
        den = r[0] * s_[1] - r[1] * s_[0]
        if abs(den) < 1e-9:
            out.append(q)
            continue
        t = ((q[0] - p[0]) * s_[1] - (q[1] - p[1]) * s_[0]) / den
        out.append((p[0] + r[0] * t, p[1] + r[1] * t))
    return out


def _poly_mask(size, poly, sc=4):
    big = Image.new("L", (size[0] * sc, size[1] * sc), 0)
    ImageDraw.Draw(big).polygon([(x * sc + sc / 2, y * sc + sc / 2) for x, y in poly], fill=255)
    return np.asarray(big.resize(size, Image.Resampling.BOX), float) / 255


def rebuild_sails(rgb, flood):
    """Rebuild each sail from its cream panels (user 2026-10-31, second pass:
    two sails still turned with scraps of the tower's outline, and one had
    lost its own outline where it lay over the red tower). Peeling background
    off cannot tell a sail's outline from the tower's where they touch, so the
    sails' EDGES are now geometry: the convex hull of the panels, pushed out
    by the red frame (original pixels) and again by the outline, which is
    painted ink. The spokes and hub keep the peeled cut, but only the ink
    within 3px of their own light paint.

    Returns (alpha, colour) for the part."""
    h, w = flood.shape
    lum = rgb.mean(-1)
    sat = rgb.max(-1) - rgb.min(-1)
    # cream at noon (248,245,217), apricot at sunset (248,205,140)
    R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    cream = (R > 225) & (G > 175) & (B > 110) & flood
    # eroded 2px: drops stray specks AND the ~4px spokes, which entering the
    # hull drew the sails' inner ends to a point
    cream = np.asarray(Image.fromarray((cream * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5))) > 0
    alpha = np.zeros((h, w))
    colour = rgb.copy()
    covered = np.zeros((h, w))
    for poly in SAILS:
        zone = np.asarray(Image.fromarray(np.uint8(_poly_mask((w, h), poly) > 0.5) * 255).filter(ImageFilter.MaxFilter(7))) > 0
        ys, xs = np.nonzero(cream & zone)
        hull = _hull(np.stack([xs, ys], 1).tolist())
        inner = _poly_mask((w, h), _offset(hull, 0.5 + SAIL_FRAME))
        outer = _poly_mask((w, h), _offset(hull, 0.5 + SAIL_FRAME + SAIL_INK))
        band = np.clip(outer - inner, 0, 1)
        colour = colour * (1 - band[..., None]) + np.asarray(SAIL_INK_RGB, float) * band[..., None]
        alpha = np.maximum(alpha, outer)
        covered = np.maximum(covered, outer)
    # spokes and hub: the peeled cut outside the sails, ink only beside paint
    light = (R > 200) & (G > 160) & (B > 100) & flood
    near_light = np.asarray(Image.fromarray((light * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) > 0
    yy, xx = np.mgrid[0:h, 0:w]
    hub = np.hypot(xx - HUB[0], yy - HUB[1]) < HUB_R + 3
    rest = flood & (near_light | hub) & (covered < 0.5)
    alpha = np.maximum(alpha, rest.astype(float))
    return alpha, colour


def cut(name, plate, mask, center, box_r, seed, mill=False):
    """Return (plate with the hole filled, the cut part as RGBA sized 2*box_r)."""
    rgb = np.asarray(plate.convert("RGB"), float)
    m = np.asarray(mask, float) / 255
    paint = rgb
    reach = m
    if mill:
        peeled = sail_only(rgb, m, center, box_r)
        m, paint = rebuild_sails(rgb, peeled)
        # the hole covers the painted sails AND the art's own: a rebuilt edge
        # a pixel inside the art's left its last ink specks on the plate
        reach = np.maximum(m, peeled)
    # the part is cut with the mask as traced; the HOLE reaches 2px further,
    # or the outline's anti-aliased fringe stays on the plate and the sail
    # turns away from a thin dark ghost of its own edge
    # the windmill's hole reaches 4px: past the sail outline sits a pale halo
    # that sail_only peels off, and left on the plate it turned with nothing
    # (a ghost rim where the sails had been)
    grow = 9 if mill else 5
    hole = np.asarray(Image.fromarray(((reach > 0.02) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(grow))) > 0
    # the membrane only learns from what is BEHIND the mill, and never from
    # the ink lines ringing the hole (sail outlines): averaged into the gap
    # they come out as a grey bruise
    near = np.asarray(Image.fromarray((hole * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(21))) > 0
    ink = near & (rgb.mean(-1) < 55) & (rgb.max(-1) - rgb.min(-1) < 30)
    silhouette = mill_silhouette(plate.size) if mill else np.zeros(hole.shape, bool)
    invalid = hole | ink | silhouette
    if mill:
        # nor from that halo's cream just outside the hole: it smeared into the
        # tower's flank as a pale stain (2026-10-31)
        rim = np.asarray(Image.fromarray((hole * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
        # Below the hub only: above it the cream is the cloud, and the fill
        # behind the upper sails needs it or it comes out grey.
        below = (np.arange(rgb.shape[0]) > center[1])[:, None]
        invalid |= rim & below & (rgb.mean(-1) > 190) & (rgb.max(-1) - rgb.min(-1) < 70)
    # A patch-copy fill was tried for the trees (2026-10-24) and pasted fence
    # slats and umbrella stripes into the foliage - a mosaic reads worse than
    # a soft membrane does behind a moving sail. Membrane + fine grain it is.
    fill = pushpull_fill(rgb, invalid)
    yy, xx = np.mgrid[0 : rgb.shape[0], 0 : rgb.shape[1]]
    around = (np.hypot(xx - center[0], yy - center[1]) < box_r * 1.3)
    if mill:
        fill, inside = repaint_mill(fill, rgb, hole)
    fill = grain_like(fill, hole, around, seed)
    out = np.where(hole[..., None], fill, rgb)
    # the part: the ORIGINAL pixels under the mask, alpha = mask - plus the
    # outline's dark fringe in the 2px ring, as partial alpha, so at rest the
    # outline is as heavy as it was painted and moving it leaves nothing behind
    ring = hole & (m <= 0.02)
    lum = rgb.mean(-1)
    # only near-neutral dark pixels are outline; darkness alone also took the
    # tower's red and the trees' green into the sails (2026-10-31)
    sat = rgb.max(-1) - rgb.min(-1)
    fringe = np.where(ring & (sat < 45), np.clip((130 - lum) / 90, 0, 1), 0)
    # the windmill's outline is painted and anti-aliased now: its ring would
    # only bring the tower's ink back
    alpha = m if mill else np.maximum(m, fringe)
    x0, y0 = int(round(center[0] - box_r)), int(round(center[1] - box_r))
    part = Image.fromarray(np.dstack([paint, alpha * 255]).clip(0, 255).astype(np.uint8), "RGBA")
    part = part.crop((x0, y0, x0 + 2 * box_r, y0 + 2 * box_r))
    print(f"{name}: hole {int(hole.sum())} px, part box at ({x0},{y0}) {2*box_r}px, pivot {center}")
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)), part


def lava_glow(plate):
    """Additive copy of the volcano's molten pixels (crater, plume core, the
    streams down its flanks), cropped to LAVA. Its alpha throbbing IS the
    lava: no geometry moves."""
    x0, y0, x1, y1 = LAVA
    a = np.asarray(plate.convert("RGB"), float)[y0:y1, x0:x1]
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    # molten = red-hot with almost no blue (the streams are ~(240,75,0), the
    # crater yellow ~(255,220,40)); the sunset clouds are the same orange but
    # carry blue (~70) — that is what tells them apart
    hot = np.clip((R - 190) / 50, 0, 1) * np.clip((62 - B) / 30, 0, 1)
    # only the volcano: the sunset clouds either side are the same orange
    yy, xx = np.mgrid[0 : a.shape[0], 0 : a.shape[1]]
    cx, cy = CRATER[0] - x0, CRATER[1] - y0
    e = ((xx - cx) / 95) ** 2 + ((yy - cy - 40) / 150) ** 2
    hot *= np.clip(1.6 - e, 0, 1)
    # the cone only: it widens downward from the crater at ~45°, and the
    # sunset cloud right of it is the same orange
    cone = np.abs(xx - cx) < 40 + 1.05 * np.maximum(0, yy - cy)
    hot *= np.asarray(Image.fromarray((cone * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)), float) / 255
    # the crater and the streams only - not the plume above them, which is a
    # MESH that rolls (bgProps.ts bg:volcano): a still glow over a moving
    # plume shows the plume twice
    plume_edge = CRATER[1] - 22 - y0
    hot *= np.clip((yy - plume_edge) / 18, 0, 1)
    g = a * hot[..., None]
    return Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))


def soft_glow(size=128):
    """A warm, soft radial halo for the feature's lamp heads."""
    yy, xx = np.mgrid[0:size, 0:size]
    r = np.hypot(xx - (size - 1) / 2, yy - (size - 1) / 2) / (size / 2)
    f = np.clip(1 - r, 0, 1) ** 2.2
    rgb = np.dstack([255 * f, 196 * f, 96 * f])
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))


def main():
    preview = Path(sys.argv[sys.argv.index("--preview") + 1]) if "--preview" in sys.argv else None
    if not SRC.exists():
        SRC.mkdir(parents=True)
        for n in ("bg_base.png", "bg_feature.png"):
            shutil.copy2(OUT / n, SRC / n)
    for kind in ("base", "feature"):
        plate = Image.open(SRC / f"bg_{kind}.png").convert("RGB")
        plate, sails = cut(f"{kind} sails", plate, sail_mask(plate.size), HUB, SAIL_R, 1, mill=True)
        sails.save(OUT / f"{kind}_sails.png", optimize=True)
        if kind == "base":
            plate, rays = cut("base rays", plate, ray_mask(plate), SUN, SUN_RAYS_R, 2)
            rays.save(OUT / "base_sunrays.png", optimize=True)
        plate.save(OUT / f"bg_{kind}.png", optimize=True)
        if preview:
            plate.crop((0, 0, 700, 560)).save(preview / f"hole_{kind}.png")
    lava_glow(Image.open(SRC / "bg_feature.png")).save(OUT / "feature_lava_glow.png", optimize=True)
    soft_glow().save(OUT / "lamp_glow.png", optimize=True)
    stale = OUT / "feature_lamps_glow.png"
    if stale.exists():
        stale.unlink()


# the volcano on the feature plate (x0, y0, x1, y1); the lamp heads are in
# game/meshWin/bgMotion.ts, which is where the halos are drawn
LAVA = (1600, 0, 1920, 280)
CRATER = (1792, 118)

if __name__ == "__main__":
    main()
