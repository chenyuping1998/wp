"""Cut the high pays off their stone plates, for the 'cut' mesh wins (2026-11-07).

The delivered symbols are one flat picture each: subject + teal stone plate +
gold corners. A mesh win drawn on the whole picture can only nudge the subject
a few pixels before the stone around it visibly stretches, which is why the
first pass moved ~1 %. Cut, the subject can hop, squash and swing ON a plate
that stays put (SymbolMeshWin.svelte's cut mode: plate, shadow, subject).

  H1 sarcophagus, H2 canopic jar, H3 yarn ball, H4 fish   cut here
  W  (bust running into the frame's bottom edge)          stays in panel mode
  S  (gold mask: the top band of lit stone will not part)  stays in panel mode
  lows (letters carved into the stone)                    stay in panel mode

The mask: GrabCut seeded with the frame band as sure plate and, inside a disc
round the centre, anything clearly not teal stone (bright, or saturated off
the teal hue) as sure subject. Outside the disc GrabCut decides alone — the
plates are lit from the top left, and that warm lit stone is "bright and not
teal" too, so the colour rule there would glue a slab of stone to the subject.
Holes are filled, only the largest island is kept.

Writes static/assets/sprites/mummySymbols/{n}_subject|_plate|_shadow.webp and
re-masks {n}_sheen.webp to the subject. At rest subject over plate recomposes
the original exactly (both come from the same 256 px runtime pixels).

Run with the system python (numpy, Pillow, OpenCV).
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'source/mummy_delivery/symbols'
RT = ROOT.parent / 'static/assets/sprites/mummySymbols'
PREVIEW = ROOT / 'preview_mummy_20261107'
DISC = {'h1': 190, 'h2': 190, 'h3': 215, 'h4': 200}

yy, xx = np.mgrid[0:512, 0:512]
rad = np.hypot(xx - 256, yy - 256)
sheet = []
for n, lim in DISC.items():
    a = np.array(Image.open(SRC / f'{n}.png').convert('RGB').resize((512, 512), Image.LANCZOS))
    hsv = cv2.cvtColor(a, cv2.COLOR_RGB2HSV)
    H, S, V = (hsv[:, :, i].astype(int) for i in range(3))
    m = np.full(a.shape[:2], cv2.GC_PR_BGD, np.uint8)
    # sure plate = the gold edge only: the subjects are painted right up to it
    # (the jar's and the sarcophagus's ear tips touch the gold itself)
    b = int(512 * (0.022 if n in ('h1', 'h2') else 0.04))
    inner = np.zeros(m.shape, bool)
    inner[b:-b, b:-b] = True
    m[~inner] = cv2.GC_BGD
    tealish = (H >= 68) & (H <= 108)
    sure = inner & (rad < lim) & ((V > (175 if n == 'h1' else 165)) | ((~tealish) & (S > 90) & (V > 70)))
    m[sure] = cv2.GC_FGD
    bgm, fgm_ = np.zeros((1, 65)), np.zeros((1, 65))
    cv2.grabCut(a, m, None, bgm, fgm_, 8, cv2.GC_INIT_WITH_MASK)
    fg = ((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD)).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    k, lab, st, _ = cv2.connectedComponentsWithStats(fg)
    fg = (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)
    inv = 1 - fg
    k2, lab2, st2, _ = cv2.connectedComponentsWithStats(inv)
    for i in range(1, k2):
        x, y, w, h, ar = st2[i]
        if x > 0 and y > 0 and x + w < 512 and y + h < 512 and ar < 6000:
            fg[lab2 == i] = 1

    # to the runtime size, a 1 px feather
    rt = np.array(Image.open(RT / f'{n}.webp').convert('RGB'))
    mask = cv2.resize(fg.astype(np.float32), (256, 256), interpolation=cv2.INTER_AREA)
    mask = cv2.GaussianBlur(mask, (0, 0), 0.6)
    alpha = np.clip(mask * 1.15 - 0.05, 0, 1)

    subject = np.dstack([rt, (alpha * 255).astype(np.uint8)])
    hard = (cv2.dilate((mask > 0.05).astype(np.uint8), np.ones((5, 5), np.uint8)) * 255)
    plate_rgb = cv2.inpaint(rt, hard, 7, cv2.INPAINT_TELEA)
    # the hollow the subject leaves reads as a recess: a touch darker
    dark = cv2.GaussianBlur(hard.astype(np.float32) / 255, (0, 0), 4)
    # inpainting drags the lit corner's warm light across the hollow in streaks;
    # pull the hollow toward the plate's own median stone colour, darker — it
    # reads as the recess the subject sat in
    ring = (cv2.dilate(hard, np.ones((15, 15), np.uint8)) > 0) & (hard == 0)
    stone = np.median(rt[ring], axis=0) * 0.62
    w_ = 0.7 * dark[..., None]
    plate_rgb = (plate_rgb * (1 - w_) + stone * w_).astype(np.uint8)
    plate = np.dstack([plate_rgb, np.full((256, 256), 255, np.uint8)])
    sh = cv2.GaussianBlur(mask, (0, 0), 5)
    shadow = np.dstack([np.zeros((256, 256, 3), np.uint8) + np.array([6, 18, 20], np.uint8), (np.clip(sh, 0, 1) * 170).astype(np.uint8)])

    Image.fromarray(subject, 'RGBA').save(RT / f'{n}_subject.webp', lossless=True)
    # a PNG copy for design/check_mesh_wins.mjs (pngjs cannot read WebP)
    (ROOT / 'source/mummy_delivery/symbols_cut').mkdir(exist_ok=True)
    Image.fromarray(subject, 'RGBA').save(ROOT / 'source/mummy_delivery/symbols_cut' / f'{n}_subject.png')
    Image.fromarray(plate, 'RGBA').save(RT / f'{n}_plate.webp', quality=92)
    Image.fromarray(shadow, 'RGBA').save(RT / f'{n}_shadow.webp', lossless=True)

    # sheen: a 3x2 sheet of 256 frames — keep only what falls on the subject
    sp = RT / f'{n}_sheen.webp'
    keep = ROOT / 'source/mummy_delivery/sheen_panel' / f'{n}_sheen.webp'  # the panel-mode sheet, kept so a rerun starts clean
    keep.parent.mkdir(exist_ok=True)
    if not keep.exists():
        keep.write_bytes(sp.read_bytes())
    sa = np.array(Image.open(keep).convert('RGBA')).astype(np.float32)
    tile = np.tile(alpha, (sa.shape[0] // 256, sa.shape[1] // 256))
    sa[:, :, 3] *= tile
    Image.fromarray(sa.astype(np.uint8), 'RGBA').save(sp, lossless=True)

    view = Image.new('RGBA', (256 * 3, 256), (30, 30, 36, 255))
    view.alpha_composite(Image.fromarray(plate, 'RGBA'), (0, 0))
    view.alpha_composite(Image.fromarray(subject, 'RGBA'), (256, 0))
    comp = Image.fromarray(plate, 'RGBA').copy()
    sub = Image.fromarray(subject, 'RGBA')
    comp.alpha_composite(sub)
    view.alpha_composite(comp, (512, 0))
    sheet.append(view)
    err = np.abs(np.array(comp.convert('RGB')).astype(int) - rt.astype(int)).mean()
    print(n, 'subject px', int((alpha > 0.5).sum()), 'recompose mean err', round(float(err), 2))

out = Image.new('RGBA', (768, 256 * len(sheet)))
for i, v in enumerate(sheet):
    out.alpha_composite(v, (0, i * 256))
out.convert('RGB').save(PREVIEW / 'symbol_cut_layers.png')

# ── the letters: the carved letter leaps out of its slot ─────────────────────
# l1..l5 are stone tiles with the letter carved in (a charcoal fill inside a lit
# bevel) and a bandage knot. The SUBJECT is the letter — its fill and bevel lip
# — and the PLATE is the whole tile unchanged, so when the letter jumps its slot
# stays behind, dark, and the letter reads as popping out of it. (2026-11-07:
# the user wants the picture itself to jump, as the other games' leaps do.)
for n in ['l1', 'l2', 'l3', 'l4', 'l5']:
    tile = np.array(Image.open(RT / f'{n}.webp').convert('RGBA'))
    hsv = cv2.cvtColor(tile[:, :, :3], cv2.COLOR_RGB2HSV)
    dark = ((tile[:, :, 3] > 200) & (hsv[:, :, 2] < 85)).astype(np.uint8)
    dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    k, lab, st, _ = cv2.connectedComponentsWithStats(dark)
    keep = np.zeros_like(dark)
    for i in range(1, k):
        if st[i, 4] > 2500:  # the letter's strokes; not the creases in the knot
            keep[lab == i] = 1
    keep = cv2.dilate(keep, np.ones((7, 7), np.uint8))  # take the bevel lip with it
    alpha = cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 0.8)
    subject = tile.copy()
    subject[:, :, 3] = (np.clip(alpha, 0, 1) * tile[:, :, 3]).astype(np.uint8)
    Image.fromarray(subject, 'RGBA').save(RT / f'{n}_letter.webp', lossless=True)
    Image.fromarray(subject, 'RGBA').save(ROOT / 'source/mummy_delivery/symbols_cut' / f'{n}_subject.png')
    sh = cv2.GaussianBlur(alpha, (0, 0), 4)
    shadow = np.dstack([np.zeros((256, 256, 3), np.uint8) + np.array([6, 10, 12], np.uint8), (np.clip(sh, 0, 1) * 160).astype(np.uint8)])
    Image.fromarray(shadow, 'RGBA').save(RT / f'{n}_shadow.webp', lossless=True)
    sp = RT / f'{n}_sheen.webp'
    keepf = ROOT / 'source/mummy_delivery/sheen_panel' / f'{n}_sheen.webp'
    if not keepf.exists():
        keepf.write_bytes(sp.read_bytes())
    sa = np.array(Image.open(keepf).convert('RGBA')).astype(np.float32)
    sa[:, :, 3] *= np.tile(np.clip(alpha, 0, 1), (sa.shape[0] // 256, sa.shape[1] // 256))
    Image.fromarray(sa.astype(np.uint8), 'RGBA').save(sp, lossless=True)
    print(n, 'letter px', int((alpha > 0.5).sum()))
