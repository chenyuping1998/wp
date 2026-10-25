"""Cut H1's sails off the windmill so the WIN can turn them a whole round
(2026-10-24, user: 繼續優化). As a mesh bone the sails could only rock ±8°
before the cap and tower tore under them.

Writes, next to h1.png (which stays the still symbol, untouched):
  h1_house.png   the windmill with the sails removed and the cap / brim /
                 tower repainted flat under them (seen only while they turn)
  h1_sails.png   the sails, hub and spars alone, on the same 512 canvas, so
                 the game turns them about HUB with nothing else to align

At angle 0 the two composite back to h1.png exactly (checked below).

    python design/build_h1_sails.py [--preview out.png]
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

APP = Path(__file__).resolve().parents[1]
DIR = APP / "static/assets/sprites/sushiSymbols"
HUB = (257.5, 212.0)
# the four arms' directions (deg, from the hub to the sail's tip, measured)
ARMS = [-142.8, -36.7, 30.7, 147.1]
INK = (22, 26, 24)
HUB_PLATE = 52

# the house, traced on the 512 art: cap triangle, brim, tower, base slab
CAP = [(258, 128), (354, 219), (161, 219)]
BRIM = [(166, 219), (350, 219), (350, 242), (166, 242)]
TOWER = [(180, 242), (338, 242), (374, 420), (148, 420)]
SAMPLES = {"cap": (300, 196), "brim": (330, 232), "tower": (300, 300)}


def sail_mask(a):
    R, G, B, A = (a[..., i] for i in range(4))
    cream = (R > 215) & (G > 195) & (B > 150) & (A > 200)
    yy, xx = np.mgrid[: a.shape[0], : a.shape[1]]
    ang = np.degrees(np.arctan2(yy - HUB[1], xx - HUB[0]))
    r = np.hypot(xx - HUB[0], yy - HUB[1])
    band = np.zeros(cream.shape, bool)
    for d in ARMS:
        dd = (ang - d + 180) % 360 - 180
        band |= (np.abs(dd) < 24) & (r > 44) & (r < 262)
    # the house's own cream (brim, base, arch) is not sail
    house = Image.new("L", (512, 512), 0)
    ImageDraw.Draw(house).polygon(BRIM, fill=255)
    ImageDraw.Draw(house).rectangle([120, 400, 400, 470], fill=255)
    ImageDraw.Draw(house).ellipse([190, 320, 330, 470], fill=255)
    house = np.asarray(house) > 0
    sail = cream & band & ~house
    # the spars: cream bars near the hub, along each arm
    spar = cream & (r < 135) & (r > 22) & ~house
    # the spars leave the hub as a true X (±45°/±135°) and bend toward the
    # sails' painted directions further out: a band wide enough for both
    near_arm = np.zeros(cream.shape, bool)
    for d in ARMS + [-135.0, -45.0, 45.0, 135.0]:
        dd = (ang - d + 180) % 360 - 180
        near_arm |= np.abs(dd) < 16
    sail |= spar & near_arm
    m = Image.fromarray((sail * 255).astype(np.uint8))
    # close the red grid lines inside each sail
    m = m.filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.MinFilter(11))
    d = ImageDraw.Draw(m)
    d.ellipse([HUB[0] - 25, HUB[1] - 25, HUB[0] + 25, HUB[1] + 25], fill=255)
    core = np.asarray(m) > 0
    # the ink outline round it: grow into DARK pixels only (and the empty
    # canvas), never into the red cap or tower beside a sail
    lum = a[..., :3].mean(-1)
    body = Image.new("L", (512, 512), 0)
    for poly in (CAP, BRIM, TOWER):
        ImageDraw.Draw(body).polygon(poly, fill=255)
    body = np.asarray(body) > 0
    # red outside the house's silhouette is the sails' own grid at their edge
    sail_red = (R > 170) & (G < 110) & ~body
    # ink is dark AND grey; the cap's shaded red is dark too but saturated
    sat = a[..., :3].max(-1) - a[..., :3].min(-1)
    ink = (lum < 95) & (sat < 60)
    # the outline's anti-aliased fringe against the empty canvas
    fringe = (A < 250) & ~body
    # only along the arms: grown freely, the outline ran on round the cap's
    # own ink edge and the sails carried whiskers of it
    along = np.zeros(cream.shape, bool)
    for d in ARMS:
        dd = (ang - d + 180) % 360 - 180
        along |= np.abs(dd) < 27
    # the shadow each sail casts on the cap and tower: dark red right under
    # it. It goes round with the sail (a turning shadow reads right; one left
    # behind on the wall reads as a scratch)
    # (a sail is wide: its long edge sits up to ~40° off the arm's axis)
    broad = np.zeros(cream.shape, bool)
    for d in ARMS:
        dd = (ang - d + 180) % 360 - 180
        broad |= np.abs(dd) < 42
    shade = (R > 90) & (R - G > 50) & (lum < 120) & along
    takeable = (ink & along) | (A < 8) | sail_red | fringe
    grown = core.copy()
    for _ in range(15):
        g = np.asarray(Image.fromarray((grown * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
        grown = grown | (g & takeable)
    # outside the house's silhouette, everything along an arm IS sail: take
    # it whole, so not one fringe pixel of an outline stays behind
    wide = np.zeros(cream.shape, bool)
    for d in ARMS:
        dd = (ang - d + 180) % 360 - 180
        wide |= (np.abs(dd) < 34) & (r > 20) & (r < 270)
    # padded by the house's own outline (~8px), which is house, not sail
    body_pad = np.asarray(Image.fromarray((body * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(21))) > 0
    base = np.zeros(cream.shape, bool)
    base[396:, :] = True
    grown |= wide & ~body_pad & ~base
    # loose light specks just off the house's edge, along an arm (the sails'
    # anti-aliasing): sail, not house
    grown |= wide & ~body & ~base & (lum > 140) & (A > 0)
    # the hub plate: everything within HUB_PLATE turns with the sails, so the
    # spars' ink edges that run into the cap go round with them instead of
    # leaving a starburst of stubs on the cap
    grown |= r < HUB_PLATE
    return grown & (A > 0)


def main():
    src = Image.open(DIR / "h1.png").convert("RGBA")
    a = np.asarray(src, float)
    mask = sail_mask(a)
    # what the grow missed: thin lines hugging a sail's edge on the cap and
    # tower that are far from their row's colour (a sail's long edge). Taken
    # into the sails, they turn with them instead of staying on the wall.
    near = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(13))) > 0
    for poly in (CAP, TOWER):
        im = Image.new("L", (512, 512), 0)
        ImageDraw.Draw(im).polygon(poly, fill=255)
        part = np.asarray(im.filter(ImageFilter.MinFilter(9))) > 0  # off its own outline
        for y in np.unique(np.nonzero(part & near & ~mask)[0]):
            row = part[y] & ~mask[y]
            med = np.median(a[y, row, :3], 0)
            # DARKER than the row only: the arch and brim are lighter and
            # belong to the house
            far = a[y, :, :3].mean(-1) < med.mean() - 40
            mask[y] |= row & near[y] & far
    # one solid outline, not a comb of whiskers: close the mask, but never
    # across the hub disc's rim into the cap (that is already all sail)
    closed = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    mask = (np.asarray(closed) > 0) & (a[..., 3] > 0)
    sails = a.copy()
    sails[..., 3] = np.where(mask, a[..., 3], 0)

    # the house under the sails, ROW BY ROW: each hole pixel inside the house
    # takes the nearest visible house pixel of its own row (same part: cap,
    # brim or tower). The tower's stripes and the cap's shading run across
    # rows, so they carry straight through the hole instead of going flat.
    parts = []
    for poly in (CAP, BRIM, TOWER):
        im = Image.new("L", (512, 512), 0)
        ImageDraw.Draw(im).polygon(poly, fill=255)
        parts.append(np.asarray(im) > 0)
    house = a.copy()
    house[mask, 3] = 0
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    red = (R > 140) & (R - G > 60)
    cream = (R > 200) & (G > 180) & (B > 130)
    flat = {}
    for name, part, kind in (("cap", parts[0], red), ("brim", parts[1], cream), ("tower", parts[2], red)):
        hole = part & mask
        donors = part & ~mask & kind
        whole = np.median(a[donors][:, :3], 0) if donors.any() else np.array([200.0, 50, 40])
        flat[name] = whole
        rows = np.unique(np.nonzero(hole)[0])
        for y in rows:
            # the MEDIAN of the row's own visible pixels (a band of 3 rows):
            # the tower's dark stripes come through, a stray pixel cannot
            band = donors[max(0, y - 1) : y + 2]
            vals = a[max(0, y - 1) : y + 2][band][:, :3]
            colour = np.median(vals, 0) if len(vals) >= 6 else whole
            xs = np.nonzero(hole[y])[0]
            house[y, xs, :3] = colour
            house[y, xs, 3] = 255

    # the part edges the hole crossed get their ink back
    layer = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for poly in (TOWER, CAP, BRIM):
        d.polygon(poly, outline=INK + (255,), width=6)
    edge = np.asarray(layer, float)
    on_edge = (edge[..., 3] > 0) & mask
    house[on_edge] = edge[on_edge]

    Image.fromarray(np.clip(sails, 0, 255).astype(np.uint8), "RGBA").save(DIR / "h1_sails.png", optimize=True)
    Image.fromarray(np.clip(house, 0, 255).astype(np.uint8), "RGBA").save(DIR / "h1_house.png", optimize=True)

    # at rest the two put h1.png back
    back = Image.open(DIR / "h1_house.png").convert("RGBA")
    back.alpha_composite(Image.open(DIR / "h1_sails.png").convert("RGBA"))
    diff = np.abs(np.asarray(back, int) - np.asarray(src, int))
    vis = (np.asarray(src)[..., 3] > 8)
    print("sail px", int(mask.sum()), "| rest diff >8 on", int(((diff[..., :3].max(-1) > 8) & vis).sum()), "visible px")

    if "--preview" in sys.argv:
        out = Path(sys.argv[sys.argv.index("--preview") + 1])
        tiles = []
        for ang in (0, 30, 60, 100):
            im = Image.new("RGBA", (512, 512), (70, 90, 110, 255))
            im.alpha_composite(Image.open(DIR / "h1_house.png").convert("RGBA"))
            s = Image.open(DIR / "h1_sails.png").convert("RGBA").rotate(-ang, center=HUB, resample=Image.BICUBIC)
            im.alpha_composite(s)
            tiles.append(im)
        sheet = Image.new("RGBA", (512 * 4, 512))
        for i, t in enumerate(tiles):
            sheet.paste(t, (512 * i, 0))
        sheet.convert("RGB").resize((1536, 384)).save(out)


if __name__ == "__main__":
    main()
