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


def cut(name, plate, mask, center, box_r, seed, mill=False):
    """Return (plate with the hole filled, the cut part as RGBA sized 2*box_r)."""
    rgb = np.asarray(plate.convert("RGB"), float)
    m = np.asarray(mask, float) / 255
    # the part is cut with the mask as traced; the HOLE reaches 2px further,
    # or the outline's anti-aliased fringe stays on the plate and the sail
    # turns away from a thin dark ghost of its own edge
    hole = np.asarray(Image.fromarray(((m > 0.02) * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
    # the membrane only learns from what is BEHIND the mill, and never from
    # the ink lines ringing the hole (sail outlines): averaged into the gap
    # they come out as a grey bruise
    near = np.asarray(Image.fromarray((hole * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(21))) > 0
    ink = near & (rgb.mean(-1) < 55) & (rgb.max(-1) - rgb.min(-1) < 30)
    silhouette = mill_silhouette(plate.size) if mill else np.zeros(hole.shape, bool)
    invalid = hole | ink | silhouette
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
    fringe = np.where(ring, np.clip((150 - lum) / 110, 0, 1), 0)
    alpha = np.maximum(m, fringe)
    x0, y0 = int(round(center[0] - box_r)), int(round(center[1] - box_r))
    part = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")
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
