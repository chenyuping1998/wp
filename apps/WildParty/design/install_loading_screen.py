#!/usr/bin/env python3
"""Fit the generated loading-screen key visual to 16:9 and install it.

The generator returns 1024x1024 whatever the aspect is asked for. The intro card
uses this as a full-bleed CSS background, so a square source on a 16:9 viewport
gets `background-size: cover` treatment — scaled to width, then cropped top and
bottom, which throws away the mirrorball that the whole composition hangs on.

So the wings are built here instead. Unlike the store cover, this image carries
no lettering, and the room is symmetrical by construction — speaker towers and
neon columns down both walls, floor grid converging on the centre. That makes a
MIRRORED slab the right fill: it reads as more of the same room, and nothing is
stretched, so no pixel is resampled along one axis only.

(The store tile could not do this: its wings overlapped the logo, so mirroring
printed a reversed "WILD PARTY" down each side. See install_store_cover.py, which
falls back to a per-row edge colour for that reason.)
"""

from pathlib import Path
from PIL import Image

GEN_DIR = Path("/Users/stone/.gemini/antigravity-ide/brain/f228d53a-9376-475a-8418-6ca43cd123ff")
RAW_IMG = GEN_DIR / "wp_loading_screen_1786885004421.png"

WP_DIR = Path("/Users/stone/stake-engine/wp/apps/WildParty")
OUT_DIR = WP_DIR / "static" / "assets" / "sprites" / "wildPartyBackground"
SOURCE_DIR = WP_DIR / "design" / "source"

OUT_W, OUT_H = 1920, 1080


def main() -> None:
    if not RAW_IMG.exists():
        raise FileNotFoundError(f"Raw image {RAW_IMG} not found")

    im = Image.open(RAW_IMG).convert("RGB")

    # scale to fill the height, so the mirrorball and the floor both survive
    scale = OUT_H / im.height
    w_new = int(round(im.width * scale))
    im_scaled = im.resize((w_new, OUT_H), Image.LANCZOS)

    out = Image.new("RGB", (OUT_W, OUT_H), (10, 4, 16))
    offset_x = (OUT_W - w_new) // 2
    out.paste(im_scaled, (offset_x, 0))

    # Mirroring was tried first and rejected. The floor is a receding perspective
    # grid, and mirroring it folds the convergence back on itself: the wings grow
    # a hard V-shaped chevron across every floor line, right where the card's copy
    # sits. Symmetry of the ROOM is not symmetry of the PERSPECTIVE.
    #
    # Filling each row with that row's own edge colour, eased down toward the
    # canvas edge, has no such problem: the walls continue as flat dark violet and
    # the floor rows continue as their own muted line colour, so the room simply
    # runs off into the dark.
    if offset_x > 0:
        px = im_scaled.load()
        dst = out.load()
        SAMPLE = 24
        for y in range(OUT_H):
            lr = lg = lb = rr = rg = rb = 0
            for k in range(SAMPLE):
                r_, g_, b_ = px[k, y]
                lr += r_; lg += g_; lb += b_
                r_, g_, b_ = px[w_new - 1 - k, y]
                rr += r_; rg += g_; rb += b_
            lcol = (lr // SAMPLE, lg // SAMPLE, lb // SAMPLE)
            rcol = (rr // SAMPLE, rg // SAMPLE, rb // SAMPLE)
            for x in range(offset_x):
                fade = 0.35 + 0.65 * (x / offset_x)
                dst[x, y] = tuple(int(c * fade) for c in lcol)
                fade_r = 0.35 + 0.65 * ((offset_x - 1 - x) / offset_x)
                dst[offset_x + w_new + x, y] = tuple(int(c * fade_r) for c in rcol)

    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    out.save(SOURCE_DIR / "loading_screen.png")
    out.save(OUT_DIR / "loading_screen.png")
    print(f"[OK] Loading screen {OUT_W}x{OUT_H} -> {OUT_DIR / 'loading_screen.png'}")


if __name__ == "__main__":
    main()
