"""Free-game transition art v2 (2026-11-05): roller shutter + padlock.

The shipped shutter_l/r.png and lock.png were the 10-16 restyle's interim
placeholders (install_street_skin.py: flat light-grey stripes with old sticker
symbols pasted on, a padlock built from an orange rectangle and a white U).
Real shutter art was never delivered. This paints the shutter in the
background's own manner (bg_base.png's left-hand shutters): blue-grey steel
slats, an ink line in every groove, flat sodium-rust patches, one diagonal cel
shadow, a kick rail with a centre hasp, and the game's own logo sprayed on.
One 2048x1536 shutter is painted and split, so the seam always matches.

The padlock is the round disc padlock generated for this game on 09-06
(design/turf-art-manifest.json "lock" source): ink outline and cel shading, the
same treatment as the symbols. Resized onto the 1024 canvas.

Run: /Applications/anaconda3/bin/python3 design/shutter_20261105/build_shutter_v2.py
Writes static/assets/sprites/turfFx/{shutter_l,shutter_r,lock}.png and a
review sheet next to this file. The previous files are kept in
design/_legacy_assets/turfFx_interim_20261016/.
"""
from pathlib import Path
import shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
APP = HERE.parent.parent
FX = APP / 'static/assets/sprites/turfFx'
LEGACY = APP / 'design/_legacy_assets/turfFx_interim_20261016'
LOCK_SRC = Path('/Users/stone/.codex/generated_images/01a07518-43b2-7671-b251-b8b437e9ba6d/'
                'exec-3d4432fc-a6ec-42e3-ba83-3b75e8cae06d.png')
LOGO = APP / 'static/assets/sprites/turfBrand/logo.png'
SHUTTER_SRC = [LOCK_SRC.parent / 'exec-5080a036-0ab3-4e3a-9746-12d347d5e6a8.png',
               LOCK_SRC.parent / 'exec-021cb441-3f4b-4ffd-84b0-c3d8232ac7ab.png']

W, H = 2048, 1536
SS = 2                      # supersample, then downsize: clean ink edges
PITCH = 46                  # slat pitch at final size (≈ bg_base's 22 px at 1080p, on screen)
RAIL_H = 110                # kick rail at the leading (bottom) edge

INK = (27, 29, 33)
STEEL_HI = (176, 186, 192)
STEEL = (128, 139, 147)
STEEL_LO = (92, 102, 110)
STEEL_SH = (64, 71, 79)     # cel shadow tone
RUST = (196, 106, 44)
RUST_LO = (143, 71, 32)
RUST_SH = (112, 58, 30)
SHINE = (214, 220, 222)

rng = np.random.default_rng(20261105)


def blob_field(w, h, scale, seed):
    """Smooth noise, stretched along the slats like the painted rust."""
    r = np.random.default_rng(seed)
    small = r.random((max(2, h // (scale // 3)), max(2, w // scale)))
    img = Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.Resampling.BICUBIC)
    return np.asarray(img.filter(ImageFilter.GaussianBlur(scale / 6)), float) / 255


def paint_shutter():
    w, h, p = W * SS, H * SS, PITCH * SS
    rail_top = h - RAIL_H * SS
    y = np.arange(h)[:, None].repeat(w, 1)
    x = np.arange(w)[None, :].repeat(h, 0)
    phase = (y % p) / p                         # 0 at a groove, rising through the slat
    img = np.zeros((h, w, 3), float)
    # three flat tones per slat (light top, body, dark bottom) — cel, not gradient
    img[:] = STEEL
    img[phase < 0.28] = STEEL_HI
    img[phase > 0.74] = STEEL_LO

    # rust: two flat levels, clipped per slat with a small per-slat offset
    slat = (y // p).astype(int)
    # several octaves, so patches break up into the flakes bg_base paints
    field = (0.55 * blob_field(w, h, 300 * SS, 7) + 0.3 * blob_field(w, h, 90 * SS, 8)
             + 0.15 * blob_field(w, h, 26 * SS, 9))
    jitter = rng.normal(0, 0.035, size=slat.max() + 2)[slat]
    vertical = np.clip((y / h - 0.2) / 0.8, 0, 1) ** 1.3      # more rust low down
    r = field + jitter + 0.16 * vertical
    rust = r > 0.66
    deep = r > 0.72
    rim = (r > 0.64) & ~rust                                  # dark painted edge round each flake
    img[rim] = img[rim] * 0.55 + np.array(RUST_SH) * 0.45
    img[rust] = RUST
    img[deep] = RUST_LO
    # per-slat value drift: no two slats are quite the same steel
    img *= (1 + rng.normal(0, 0.035, size=slat.max() + 2)[slat])[..., None]
    img[rust & (phase < 0.28)] = np.array(RUST) * 0.55 + np.array(STEEL_HI) * 0.45
    # drips running down from the rust, a slat or two
    for _ in range(90):
        cx = int(rng.uniform(0, w)); cy = int(rng.uniform(h * 0.2, rail_top))
        if r[cy, cx] < 0.7:
            continue
        L = int(rng.uniform(1.0, 2.4) * p); t = int(rng.uniform(2, 5) * SS)
        img[cy:cy + L, cx:cx + t] = RUST_LO

    # one diagonal cel shadow, as the alley light falls in bg_base
    shadow = (x * 0.62 + y) > (w * 0.86 + h * 0.18)
    img[shadow] = img[shadow] * 0.64 + np.array(STEEL_SH) * 0.08

    # grooves: an ink line and a thin shine just under it
    groove = (y % p) < 3 * SS
    img[groove] = INK
    img[((y % p) >= 3 * SS) & ((y % p) < 5 * SS) & ~shadow] = SHINE

    # wear: fine scratches (short light/dark ticks along the slats)
    for _ in range(1400):
        cx = int(rng.uniform(0, w)); cy = int(rng.uniform(0, rail_top))
        L = int(rng.uniform(6, 30) * SS)
        tone = INK if rng.random() < 0.6 else SHINE
        img[cy:cy + SS, cx:cx + L] = img[cy:cy + SS, cx:cx + L] * 0.4 + np.array(tone) * 0.6

    # grit: the high frequencies of the shutter generated for this game on
    # 09-06 (its tone and colour are the rejected dark-rust look; only its
    # scratches and pitting are kept), laid over the flat paint
    # left half + its mirror: the two generated halves do not continue across
    # their edges, and butted together they left a faint line down the middle
    grit_src = np.asarray(Image.open(SHUTTER_SRC[0]).convert('L'))[:, 60:-60]   # its edge bands too
    grit_src = Image.fromarray(np.hstack([grit_src, grit_src[:, ::-1]]))
    grit_src = grit_src.resize((w, h), Image.Resampling.BICUBIC)
    g = np.asarray(grit_src, float)
    hp = g - np.asarray(grit_src.filter(ImageFilter.GaussianBlur(10 * SS)), float)
    img += (hp * 0.55)[..., None]
    out = Image.fromarray(img.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(out)
    # kick rail: steel bar with ink outline, highlight and two pull handles
    d.rectangle((0, rail_top, w, h), fill=(70, 77, 85), outline=INK, width=6 * SS)
    d.rectangle((0, rail_top + 6 * SS, w, rail_top + 16 * SS), fill=(150, 160, 166))
    d.line((0, rail_top, w, rail_top), fill=INK, width=7 * SS)
    for hx in (0.22, 0.78):
        cx = int(w * hx)
        d.rounded_rectangle((cx - 70 * SS, rail_top + 30 * SS, cx + 70 * SS, rail_top + 86 * SS),
                            radius=26 * SS, outline=INK, width=16 * SS)
        d.rounded_rectangle((cx - 70 * SS, rail_top + 30 * SS, cx + 70 * SS, rail_top + 86 * SS),
                            radius=26 * SS, outline=(150, 160, 166), width=6 * SS)
    # centre hasp: a riveted plate on each half with a staple — the padlock
    # (drawn by the game at the seam) hangs from it
    hy = int(h * 0.5)
    for side in (-1, 1):
        x0 = w // 2 + side * 14 * SS
        x1 = w // 2 + side * 150 * SS
        d.rectangle((min(x0, x1), hy - 70 * SS, max(x0, x1), hy + 70 * SS), fill=(84, 92, 100), outline=INK, width=8 * SS)
        d.line((min(x0, x1), hy - 58 * SS, max(x0, x1), hy - 58 * SS), fill=(160, 170, 176), width=6 * SS)
        for ry in (-40, 40):
            rx = (x0 + x1) // 2 + side * 40 * SS
            d.ellipse((rx - 13 * SS, hy + ry * SS - 13 * SS, rx + 13 * SS, hy + ry * SS + 13 * SS), fill=(150, 160, 166), outline=INK, width=5 * SS)
    out = out.resize((W, H), Image.Resampling.LANCZOS)

    # the logo, sprayed on: slightly rotated, paint broken up by the slats
    logo = Image.open(LOGO).convert('RGBA')
    lw = int(W * 0.33)
    logo = logo.resize((lw, int(logo.height * lw / logo.width)), Image.Resampling.LANCZOS).rotate(-4, expand=True, resample=Image.Resampling.BICUBIC)
    la = np.asarray(logo, float)
    yy = np.arange(la.shape[0])[:, None]
    # high enough to clear the padlock (0.32 of the screen height, centred)
    # at 16:9, where the closed shutter shows its middle 75%, and in portrait
    oy = int(H * 0.235) - la.shape[0] // 2
    ox = W // 2 - la.shape[1] // 2
    groove_mask = (((yy + oy) % PITCH) < 4)
    wear = blob_field(la.shape[1], la.shape[0], 90, 11)
    alpha = la[..., 3] / 255 * np.where(groove_mask, 0.35, 0.92) * np.clip(0.55 + wear, 0, 1)
    la[..., 3] = alpha * 255
    out_rgba = out.convert('RGBA')
    out_rgba.alpha_composite(Image.fromarray(la.clip(0, 255).astype(np.uint8)), (ox, oy))
    return out_rgba.convert('RGB')


def build_lock():
    src = Image.open(LOCK_SRC).convert('RGBA')
    bbox = src.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    crop = src.crop(bbox)
    side = int(1024 * 0.9)
    k = side / max(crop.size)
    crop = crop.resize((round(crop.width * k), round(crop.height * k)), Image.Resampling.LANCZOS)
    out = Image.new('RGBA', (1024, 1024))
    out.alpha_composite(crop, ((1024 - crop.width) // 2, (1024 - crop.height) // 2))
    return out


def main():
    LEGACY.mkdir(parents=True, exist_ok=True)
    for n in ('shutter_l', 'shutter_r', 'lock'):
        if not (LEGACY / f'{n}.png').exists():
            shutil.copy2(FX / f'{n}.png', LEGACY / f'{n}.png')
    full = paint_shutter()
    full.crop((0, 0, W // 2, H)).save(FX / 'shutter_l.png', optimize=True)
    full.crop((W // 2, 0, W, H)).save(FX / 'shutter_r.png', optimize=True)
    lock = build_lock()
    lock.save(FX / 'lock.png', optimize=True)
    # review sheet: the closed shutter at 16:9 framing with the lock on the seam
    sheet = full.copy().convert('RGBA')
    # in game the lock is 0.32 of the screen height; a 16:9 door is drawn at
    # width/2/1024 scale, so 0.32 x 720 px on screen = ~369 px of door art
    lk = lock.resize((369, 369), Image.Resampling.LANCZOS)
    sheet.alpha_composite(lk, (W // 2 - lk.width // 2, H // 2 - lk.height // 2))
    sheet.convert('RGB').resize((W // 2, H // 2)).save(HERE / 'shutter_v2_review.jpg', quality=88)
    print('ok')


if __name__ == '__main__':
    main()
