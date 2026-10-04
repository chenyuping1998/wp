"""Cut each letter tile (l1..l5.png, A K Q J 10) into its LETTER and its PLATE.

Asked for 2026-10-03: "獎圖的網格法動態處理，必須是圖案本身動起來而不是整個板子動".
The letter tiles were PANEL-mode meshes: the whole stone face inside the bolts
was one mesh, so on a win the stone — cracks and all — moved with the letter,
and the tile itself read as wobbling. Now the letter is cut OFF the tile and
acts on its own (cut mode, lowLetters.ts) over a plate that does not move.

The letters are CARVED into pale stone: a recess (mid-grey, with a dark
shadow band under its top lip) inside a dark outline. So:

  LETTER  inside the letter's hull (lowLetters.ts' polygon, x4 to 1024px,
          grown), every pixel darker than the stone (luminance < STONE) —
          outline and recess together. Small holes are closed; the big ones
          (the A's, the Q's and the 0's stone islands) stay stone. Thin cracks
          that touch the outline are opened away. Its alpha runs a few px past
          the hard edge, so at rest it covers the plate's socket completely.

  PLATE   the tile with the letter's place made into the SOCKET it was carved
          from: the letter's own pixels blurred and darkened. When the letter
          lifts, what shows under it is its empty slot, not a hole of plain
          stone — and at rest the letter covers it, so letter over plate is the
          original tile.

Writes l{n}_letter.png and l{n}_plate.png next to l{n}.png (1024px), and
_cut_letters_preview.png in design/ (original | plate | letter on magenta).

Usage: python design/cut_letters.py      (numpy + Pillow: math-sdk/env)
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

APP = Path(__file__).resolve().parents[1]
DIR = APP / 'static/assets/sprites/goBananasSymbolsV3'
STONE = 166          # luminance: stone is brighter, the carved letter darker
                     # (150 lost the lit face of the A above its counter; the stone's shading that
                     # 168 took in comes off the letter now with keep_big)
GROW = 26            # px the hull is grown by (1024 scale)
SOCKET_DARK = 0.55   # how dark the empty slot is

# the hulls from lowLetters.ts, in its 256 canvas
HULLS = {
    'l1': [[[104, 44], [150, 44], [214, 211], [168, 211], [160, 172], [96, 172], [86, 211], [42, 211]]],
    'l2': [[[60, 44], [99, 44], [99, 108], [160, 44], [204, 44], [146, 108], [210, 210], [166, 210], [122, 140], [99, 164], [99, 210], [60, 210]]],
    'l3': [[[50, 34], [198, 34], [198, 176], [214, 196], [198, 212], [170, 204], [50, 204]]],
    'l4': [[[112, 44], [197, 44], [197, 176], [170, 211], [100, 211], [64, 188], [64, 142], [108, 142], [108, 170], [150, 172], [156, 70], [112, 70]]],
    'l5': [[[44, 44], [118, 44], [118, 210], [44, 210]], [[120, 44], [210, 44], [210, 212], [120, 212]]],
}


def morph(mask, size, op):
    img = Image.fromarray((mask * 255).astype(np.uint8))
    f = ImageFilter.MaxFilter(size) if op == 'dilate' else ImageFilter.MinFilter(size)
    return np.asarray(img.filter(f)) > 127


def keep_big(mask, n):
    """the n largest connected pieces of the mask. Labelled on a 256 copy by
    propagating the smallest label through each piece until nothing changes
    (vectorised: the flood-fill version crawled), then taken back to full size"""
    h, w = mask.shape
    small = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).resize((256, 256), Image.BILINEAR)) > 100
    big_int = 1 << 30
    lab = np.where(small, np.arange(256 * 256).reshape(256, 256), big_int)
    while True:
        nxt = lab.copy()
        nxt[1:, :] = np.minimum(nxt[1:, :], lab[:-1, :])
        nxt[:-1, :] = np.minimum(nxt[:-1, :], lab[1:, :])
        nxt[:, 1:] = np.minimum(nxt[:, 1:], lab[:, :-1])
        nxt[:, :-1] = np.minimum(nxt[:, :-1], lab[:, 1:])
        nxt = np.where(small, nxt, big_int)
        if np.array_equal(nxt, lab):
            break
        lab = nxt
    ids, counts = np.unique(lab[small], return_counts=True)
    top = ids[np.argsort(-counts)[:n]]
    keep = np.isin(lab, top) & small
    # back to full size, a little grown so the full-res edge is not clipped
    big = np.asarray(Image.fromarray((keep * 255).astype(np.uint8)).resize((w, h), Image.NEAREST)) > 127
    return mask & morph(big, 9, 'dilate')


def fill_small_holes(mask):
    """close the small gaps and specks inside the letter (a closing: grow, then
    shrink back). The stone islands of the A, the Q and the 0 are far wider than
    the closing and survive it."""
    return morph(morph(mask, 11, 'dilate'), 11, 'erode')


previews = []
for name, polys in HULLS.items():
    src = Image.open(DIR / f'{name}.png').convert('RGBA')
    W, H = src.size
    k = W / 256
    rgb = np.asarray(src.convert('RGB')).astype(np.float32)
    lum = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]

    hull_img = Image.new('L', (W, H), 0)
    hd = ImageDraw.Draw(hull_img)
    for poly in polys:
        hd.polygon([(x * k, y * k) for x, y in poly], fill=255)
    hull = morph(np.asarray(hull_img) > 127, GROW * 2 + 1, 'dilate')

    letter = hull & (lum < STONE)
    # cracks touching the outline are a few px wide; the letter's strokes are not
    letter = morph(morph(letter, 7, 'erode'), 7, 'dilate')
    # only the letter's own body (two for the 10): every other island of dark —
    # a crack, a patch of shadowed stone — is left on the plate
    letter = keep_big(letter, 2 if name == 'l5' else 1)
    letter = fill_small_holes(letter)
    # the stone ISLANDS inside a letter (the A's, the Q's, the 0's) stay on the
    # plate: the closing above can bridge the narrow tip of one, and a sliver of
    # stone then rode up with the letter, leaving a torn hole in its socket
    # (only the flat stone of an island: its lit bevel walls belong to the
    # letter's edge, and taking them too tore holes along the A's counter)
    islands = keep_big(hull & (lum > 190), 3)
    islands = morph(morph(islands, 7, 'erode'), 3, 'dilate')
    letter &= ~islands
    letter = morph(morph(letter, 5, 'erode'), 5, 'dilate')

    # the plate's socket reaches 2px past the hard edge; the letter's alpha
    # 3px, feathered — so at rest the letter covers the socket entirely
    socket_mask = morph(letter, 5, 'dilate')
    alpha = np.asarray(Image.fromarray((morph(letter, 7, 'dilate') * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
    alpha = np.maximum(alpha, socket_mask.astype(np.float32))

    letter_img = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    Image.fromarray(letter_img, 'RGBA').save(DIR / f'{name}_letter.png')

    # the socket: the letter's own pixels, blurred and darkened
    blurred = np.asarray(Image.fromarray(rgb.astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))).astype(np.float32)
    socket = blurred * SOCKET_DARK
    m = socket_mask[..., None].astype(np.float32)
    plate = rgb * (1 - m) + socket * m
    Image.fromarray(np.dstack([plate, np.full((H, W), 255.0)]).astype(np.uint8), 'RGBA').save(DIR / f'{name}_plate.png')

    # check: letter over plate must give the original back
    a3 = alpha[..., None]
    recon = rgb * a3 + plate * (1 - a3)
    err = np.abs(recon - rgb).max(axis=2)
    print(f'{name}: letter {letter.sum() / (W * H) * 100:.1f}% of the tile; recompose error max {err.max():.1f}, mean {err.mean():.3f}')

    mag = Image.new('RGBA', (W, H), (255, 0, 255, 255))
    mag.alpha_composite(Image.fromarray(letter_img, 'RGBA'))
    row = Image.new('RGB', (W * 3, H))
    row.paste(src.convert('RGB'), (0, 0))
    row.paste(Image.fromarray(plate.astype(np.uint8)), (W, 0))
    row.paste(mag.convert('RGB'), (W * 2, 0))
    previews.append(row.resize((W * 3 // 4, H // 4)))

sheet = Image.new('RGB', (previews[0].width, sum(p.height for p in previews)))
y = 0
for p in previews:
    sheet.paste(p, (0, y))
    y += p.height
sheet.save(APP / 'design/_cut_letters_preview.png')
print('ok')
