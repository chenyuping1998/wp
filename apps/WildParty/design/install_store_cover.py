#!/usr/bin/env python3
"""Format and install the 16:9 Wild Party store cover tile and square store tile."""

from pathlib import Path
from PIL import Image

GEN_DIR = Path("/Users/stone/.gemini/antigravity-ide/brain/b70ab809-0eff-46e5-a52a-d15b26d622d5")
RAW_IMG = GEN_DIR / "wp_store_tile_cover_1786808074714.png"

WP_DIR = Path("/Users/stone/stake-engine/wp/apps/WildParty")
# design/, NOT static/. Store art is uploaded through the Stake back office as a
# separate step and is never fetched by the game, so a copy under static/ ships
# ~2.7MB of dead weight inside every player's download.
SOURCE_DIR = WP_DIR / "design" / "source"
SOURCE_DIR.mkdir(parents=True, exist_ok=True)


def main():
    if not RAW_IMG.exists():
        raise FileNotFoundError(f"Raw image {RAW_IMG} not found")

    im = Image.open(RAW_IMG).convert("RGB")

    # 1. 1024x1024 Square Store Tile
    tile_square = im.resize((1024, 1024), Image.LANCZOS)
    out_sq_src = SOURCE_DIR / "tile_1024.png"
    tile_square.save(out_sq_src)
    print(f"[OK] Square tile saved -> {out_sq_src}")

    # 2. 1920x1080 16:9 Landscape Cover
    # Extend / fit to 16:9 (1920x1080) with centered composition
    cover_16_9 = Image.new("RGB", (1920, 1080), (10, 4, 16))

    # Scale to fill height and center
    scale = 1080 / im.height
    w_new = int(im.width * scale)
    im_scaled = im.resize((w_new, 1080), Image.LANCZOS)

    # Paste in center
    offset_x = (1920 - w_new) // 2
    cover_16_9.paste(im_scaled, (offset_x, 0))

    # Fill the left and right wings.
    #
    # This used to take a 4px strip from each edge and stretch it across the whole
    # wing, which produced exactly what it sounds like: ~15% of each side of the
    # tile was horizontal smear. On a store tile that is the "low quality asset"
    # note waiting to happen.
    #
    # Mirroring the edge slab was tried and is worse: the wings are 420px and the
    # logo reaches into that band, so a mirrored slab prints a reversed copy of
    # "WILD PARTY" down each side.
    #
    # What works is filling each row with that row's own edge colour and easing it
    # down toward the outer edge. No texture is stretched and no content is
    # duplicated — the room simply falls away into the dark at both sides, which
    # is what the scene already does anyway.
    if offset_x > 0:
        px = im_scaled.load()
        out = cover_16_9.load()
        SAMPLE = 24  # average this many columns so a single neon line cannot set the tone
        for y in range(1080):
            lr = lg = lb = rr = rg = rb = 0
            for k in range(SAMPLE):
                r_, g_, b_ = px[k, y]
                lr += r_; lg += g_; lb += b_
                r_, g_, b_ = px[w_new - 1 - k, y]
                rr += r_; rg += g_; rb += b_
            lcol = (lr // SAMPLE, lg // SAMPLE, lb // SAMPLE)
            rcol = (rr // SAMPLE, rg // SAMPLE, rb // SAMPLE)
            for x in range(offset_x):
                # 1.0 at the seam, easing to 0.35 at the canvas edge
                fade = 0.35 + 0.65 * (x / offset_x)
                out[x, y] = tuple(int(c * fade) for c in lcol)
                fade_r = 0.35 + 0.65 * ((offset_x - 1 - x) / offset_x)
                out[offset_x + w_new + x, y] = tuple(int(c * fade_r) for c in rcol)

    out_16_9_src = SOURCE_DIR / "cover_16_9.png"
    cover_16_9.save(out_16_9_src)
    print(f"[OK] 16:9 cover tile saved -> {out_16_9_src}")


if __name__ == "__main__":
    main()
