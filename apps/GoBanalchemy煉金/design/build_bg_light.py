"""The light in the three backgrounds, made to live (Stake review 2026-10-24:
"the background is too static").

The lanterns themselves stay STILL - the user had them swaying and asked for
them to stop (2026-10-16). What moves now is what light and air do:

  * FLAME   every lantern, candle and furnace mouth: an additive copy of its
            own brightest pixels, cut from the plate, whose alpha flickers.
            The painting is the source of the light, so the flicker cannot be
            the wrong shape or colour.
  * GLOW    the green elixirs and (feature) the crystal banks: the same, but
            breathing slowly instead of flickering.
  * FOG     soft noise banks drifting through where the painting already has
            green fog (base, feature). Generated here, tinted in the game.
  * GLINT   (vault) a four-point star that pops on a coin now and then; the
            candidate points are the coin pile's brightest pixels.

Reads the SHIPPED (already brightness-lifted) plates, so re-run it after
design/sharpen_backgrounds.py. Writes the sprites to static/ and their
placements to src/game/bgLight.ts (1920 x 1080 space, like BG_POTIONS).

    python design/build_bg_light.py
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

APP = Path(__file__).resolve().parents[1]
PLATES = APP / "static/assets/sprites/goBanalchemyBackground"
OUT = APP / "static/assets/sprites/goBanalchemyLight"
TS = APP / "src/game/bgLight.ts"
SPACE = (1920, 1080)

# (id, kind, box x0 y0 x1 y1 in 1920 space). Measured on the plates.
LIGHTS = {
    "bg_base": [
        ("lanternL", "flame", (262, 140, 368, 352)),
        ("lanternR", "flame", (1548, 140, 1656, 352)),
        ("candles", "flame", (0, 560, 90, 660)),
        ("elixirL", "green", (95, 560, 240, 700)),
        ("bottleL", "green", (0, 320, 70, 500)),
        ("flaskR", "green", (1760, 120, 1880, 240)),
        ("stillR", "green", (1660, 560, 1780, 720)),
    ],
    "bg_holdandspin": [
        ("lanternL", "flame", (320, 30, 430, 220)),
        ("lanternR", "flame", (1655, 20, 1775, 215)),
        ("furnace", "flame", (330, 520, 420, 615)),
        ("lamp", "flame", (250, 650, 330, 760)),
        ("crystalJar", "green", (0, 390, 95, 510)),
        ("bottleL", "green", (0, 120, 75, 270)),
        ("flaskL", "green", (0, 700, 130, 880)),
        ("crystalsR", "green", (1540, 450, 1640, 570)),
        ("crystalBowl", "green", (1750, 570, 1860, 690)),
        ("jarR", "green", (1610, 730, 1700, 840)),
    ],
    "bg_feature": [
        ("bankL", "green", (0, 0, 700, 1080)),
        ("bankR", "green", (1260, 0, 1920, 1080)),
    ],
}

# where the painting already has green fog: (x, y, w, h) of each bank, 1920 space.
# The last bank of each is the tunnel floor at the CENTRE: a portrait phone is
# cover-cropped to plate x ~650-1270, where none of the lights are - the floor
# fog is the motion that layout gets.
FOG = {
    "bg_base": [(430, 420, 420, 260), (500, 700, 380, 220), (1240, 300, 420, 260), (1260, 640, 420, 240), (1600, 520, 260, 200), (740, 720, 440, 230)],
    "bg_feature": [(330, 560, 360, 220), (1230, 560, 380, 220), (0, 860, 520, 200), (1400, 860, 520, 200), (760, 790, 400, 180)],
}

COIN_PILE = (345, 790, 650, 965)

# Feature crystals that are MESHES (bgProps.ts crystalBed: floor, corner,
# right, in its 256 x 144 canvas x 7.5). They swell up to ~15px; a still glow
# over them would show each one twice, so the banks' glow leaves them out.
MESH_CRYSTALS = [(62, 100, 90, 136), (0, 114, 30, 144), (166, 76, 210, 136)]

# steam vents: (x, y, dx, dy, period s, phase s) - where a puff leaves, which
# way it travels (px over its life), how often. Measured on the plates: the
# base's two valve wheels and the elbow on the right-hand pipes; the vault's
# still (its finial) and the gooseneck beside it.
STEAM = {
    "bg_base": [(1502, 462, 90, -70, 7.0, 1.2), (1500, 645, 80, -60, 9.5, 5.4), (1432, 505, -30, -110, 11.0, 8.1)],
    "bg_holdandspin": [(372, 342, 10, -120, 8.0, 2.0), (456, 362, 30, -100, 10.5, 6.3)],
}


def plate(name):
    im = Image.open(PLATES / f"{name}.jpg").convert("RGB")
    return im, im.width / SPACE[0]


def glow_crop(im, k, box, kind, avoid=()):
    x0, y0, x1, y1 = (int(round(v * k)) for v in box)
    a = np.asarray(im.crop((x0, y0, x1, y1)), float)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    v = a.max(-1)
    if kind == "flame":
        hot = np.clip((v - 150) / 90, 0, 1) * np.clip((R - B - 40) / 80, 0, 1)
    else:
        hot = np.clip((G - 120) / 100, 0, 1) * np.clip((G - R - 20) / 70, 0, 1)
    # feather the crop edge so a box never shows as a rectangle when it flares
    h, w = hot.shape
    yy, xx = np.mgrid[0:h, 0:w]
    edge = np.minimum.reduce([xx, w - 1 - xx, yy, h - 1 - yy]) / max(4, 0.08 * min(w, h))
    hot *= np.clip(edge, 0, 1)
    for r in avoid:
        # feathered over ~12px so the glow's edge is not a box
        bx0, by0, bx1, by1 = (v * 7.5 * k for v in r)
        d = np.maximum.reduce([bx0 - (xx + x0), (xx + x0) - bx1, by0 - (yy + y0), (yy + y0) - by1])
        hot *= np.clip(d / (12 * k), 0, 1)
    g = Image.fromarray(np.clip(a * hot[..., None], 0, 255).astype(np.uint8))
    return g.filter(ImageFilter.GaussianBlur(1.2 * k))


def fbm(w, h, seed, octaves=5):
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w))
    amp, total = 1.0, 0.0
    for o in range(octaves):
        cells = 3 * 2**o
        g = rng.random((cells + 1, cells * 2 + 1))
        layer = np.asarray(Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), float) / 255
        out += amp * layer
        total += amp
        amp *= 0.5
    return out / total


def fog_bank(seed, w=768, h=384):
    n = fbm(w, h, seed)
    yy, xx = np.mgrid[0:h, 0:w]
    # an elongated soft blob, ragged by the noise: no edge ever reaches the box
    r = np.hypot((xx - w / 2) / (w / 2), (yy - h / 2) / (h / 2))
    shape = np.clip(1 - r, 0, 1) ** 1.4
    a = np.clip((n - 0.38) * 2.2, 0, 1) * shape
    a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)))
    rgba = np.dstack([np.full((h, w), 255, np.uint8)] * 3 + [a])
    return Image.fromarray(rgba, "RGBA")


def star(size=96):
    yy, xx = np.mgrid[0:size, 0:size]
    c = (size - 1) / 2
    dx, dy = np.abs(xx - c) / c, np.abs(yy - c) / c
    arms = np.clip(1 - dx * 6, 0, 1) * np.clip(1 - dy, 0, 1) ** 2 + np.clip(1 - dy * 6, 0, 1) * np.clip(1 - dx, 0, 1) ** 2
    core = np.clip(1 - np.hypot(dx, dy) * 2.2, 0, 1) ** 2
    v = np.clip(arms + core, 0, 1)
    rgb = np.dstack([255 * v, 236 * v, 170 * v])
    return Image.fromarray(rgb.astype(np.uint8))


def coin_points(im, k, n=28, seed=5):
    x0, y0, x1, y1 = (int(round(v * k)) for v in COIN_PILE)
    a = np.asarray(im.crop((x0, y0, x1, y1)), float)
    bright = (a.mean(-1) > 200) & (a[..., 0] > a[..., 2] + 60)
    ys, xs = np.nonzero(bright)
    rng = np.random.default_rng(seed)
    pick, pts = rng.permutation(len(xs)), []
    for i in pick:
        p = ((xs[i] + x0) / k, (ys[i] + y0) / k)
        if all(np.hypot(p[0] - q[0], p[1] - q[1]) > 26 for q in pts):
            pts.append(p)
        if len(pts) == n:
            break
    return [[round(x, 1), round(y, 1)] for x, y in pts]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    table = {}
    for name, lights in LIGHTS.items():
        im, k = plate(name)
        rows = []
        for lid, kind, box in lights:
            key = f"light_{name[3:]}_{lid}"
            avoid = MESH_CRYSTALS if name == "bg_feature" else ()
            glow_crop(im, k, box, kind, avoid).save(OUT / f"{key}.png", optimize=True)
            rows.append({"key": key, "kind": kind, "rect": list(box)})
        table[name] = rows
    for i in range(3):
        fog_bank(11 + i).save(OUT / f"fog_{i}.png", optimize=True)
    star().save(OUT / "glint.png", optimize=True)
    im, k = plate("bg_holdandspin")
    coins = coin_points(im, k)

    ts = [
        "/** GENERATED by design/build_bg_light.py - do not edit by hand.",
        " *  The plates' light sources as additive crops, the fog banks and the",
        " *  vault's coin glints, in the 1920 x 1080 space BG_POTIONS uses. */",
        "export type BgLight = { key: string; kind: 'flame' | 'green'; rect: [number, number, number, number] };",
        "export type FogBank = [number, number, number, number];",
        "export type SteamVent = [number, number, number, number, number, number];",
        f"export const BG_LIGHTS: Record<'base' | 'feature' | 'vault', BgLight[]> = {json.dumps({'base': table['bg_base'], 'feature': table['bg_feature'], 'vault': table['bg_holdandspin']})};",
        f"export const BG_FOG: Record<'base' | 'feature', FogBank[]> = {json.dumps({'base': FOG['bg_base'], 'feature': FOG['bg_feature']})};",
        f"export const COIN_GLINTS: [number, number][] = {json.dumps(coins)};",
        f"export const BG_STEAM: Record<'base' | 'feature' | 'vault', SteamVent[]> = {json.dumps({'base': STEAM['bg_base'], 'feature': [], 'vault': STEAM['bg_holdandspin']})};",
        "",
    ]
    TS.write_text("\n".join(ts), encoding="utf-8")
    keys = [r["key"] for rows in table.values() for r in rows]
    print(f"{len(keys)} light crops, 3 fog banks, glint, {len(coins)} coin points")
    print("asset keys:", ", ".join(keys))


if __name__ == "__main__":
    main()
