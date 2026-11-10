"""Dragon Tide final art: cut, register and clean the gen-order-1109 delivery
(new-games/sea-dragon/art/gen-order-1109, 2026-11-09) into the shipped sprites.

Replaces the greyscale interim (design/interim). Every piece goes through the same
clean-up — faint generator haze (alpha < 10) zeroed, the near-opaque body (alpha >= 244)
made solid, stray specks (small disconnected islands) removed — and every resize is done
premultiplied, so no dark or white fringe appears round an edge.

Writes
  static/assets/sprites/dragonArt/        UI, panels, frames, pearls, banners, cards, backdrop props
  static/assets/sprites/dragonSymbols/    l1-l5, s, s_open (H1-H4 v3 stay as they are)
  src/game/artGeometry.json               text wells, windows, holes and hit shapes measured here,
                                          so the components place text on the art, not on guesses
  design/dragon-symbols-manifest.json     painted hulls for check_symbol_idle.mjs

  /Applications/anaconda3/bin/python3 design/art1109/build_final_art.py
"""
from pathlib import Path
import json
import numpy as np
import cv2
from PIL import Image, ImageDraw
from scipy import ndimage

APP = Path(__file__).resolve().parents[2]
SRC = Path('/Users/stone/stake-engine/new-games/sea-dragon/art/gen-order-1109')
OUT = APP / 'static/assets/sprites/dragonArt'
SYM = APP / 'static/assets/sprites/dragonSymbols'
GEO_PATH = APP / 'src/game/artGeometry.json'
for folder in (OUT, OUT / 'bg', SYM):
    folder.mkdir(parents=True, exist_ok=True)
GEO: dict = {}


# ---------------------------------------------------------------------------- basics

def load(name: str) -> Image.Image:
    return Image.open(SRC / name).convert('RGBA')


def clean(im: Image.Image, lo=10, hi=244, min_comp=300, solid=True) -> Image.Image:
    arr = np.array(im)
    a = arr[..., 3].astype(np.int32)
    a[a < lo] = 0
    if solid:
        a[a >= hi] = 255
    if min_comp:
        lab, n = ndimage.label(a > 0, structure=np.ones((3, 3)))
        if n > 1:
            sizes = ndimage.sum(np.ones_like(a), lab, range(1, n + 1))
            a[np.isin(lab, np.where(sizes < min_comp)[0] + 1)] = 0
    arr[..., 3] = a
    arr[a == 0, :3] = 0
    return Image.fromarray(arr)


def resize(im: Image.Image, size) -> Image.Image:
    size = (max(1, round(size[0])), max(1, round(size[1])))
    return im.convert('RGBa').resize(size, Image.LANCZOS).convert('RGBA')


def scaled(im: Image.Image, s: float) -> Image.Image:
    return resize(im, (im.width * s, im.height * s))


def crop_pad(im: Image.Image, pad=2) -> tuple[Image.Image, tuple[int, int, int, int]]:
    l, t, r, b = im.getbbox()
    box = (max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad))
    return im.crop(box), box


def place(canvas_size, im: Image.Image, x: float, y: float) -> Image.Image:
    """im's top-left at (x, y) on an empty canvas (negative offsets crop)."""
    canvas = Image.new('RGBA', canvas_size, (0, 0, 0, 0))
    canvas.paste(im, (round(x), round(y)))
    return canvas


def fit(im: Image.Image, size, align='center') -> tuple[Image.Image, float, tuple[float, float]]:
    """content scaled to fit `size`, centred (or bottom/top aligned); returns canvas, scale, offset"""
    s = min(size[0] / im.width, size[1] / im.height)
    r = scaled(im, s)
    x = (size[0] - r.width) / 2
    y = {'center': (size[1] - r.height) / 2, 'bottom': size[1] - r.height, 'top': 0}[align]
    return place(size, r, x, y), s, (round(x), round(y))


def save(im: Image.Image, path: Path):
    im.save(path, optimize=True)
    return im


def flat_regions(im: Image.Image, minsize=4000, std_max=6, alpha_min=240):
    """large flat-coloured areas (the plain wells left for text): [(n, box, colour)]"""
    arr = np.array(im.convert('RGBA')).astype(float)
    lum = arr[..., :3].mean(axis=2)
    mean = ndimage.uniform_filter(lum, 7)
    std = np.sqrt(np.maximum(ndimage.uniform_filter(lum * lum, 7) - mean * mean, 0))
    flat = (std < std_max) & (arr[..., 3] > alpha_min)
    lab, n = ndimage.label(flat)
    out = []
    for k, sl in enumerate(ndimage.find_objects(lab), 1):
        region = lab[sl] == k
        count = int(region.sum())
        if count < minsize:
            continue
        ys, xs = np.where(region)
        box = (sl[1].start + xs.min(), sl[0].start + ys.min(), sl[1].start + xs.max() + 1, sl[0].start + ys.max() + 1)
        colour = arr[sl][region][:, :3].mean(axis=0).astype(int).tolist()
        out.append((count, box, colour))
    out.sort(key=lambda r: -r[0])
    return out


def rect(box, w, h):
    """box in px -> normalised {x, y, w, h} (centre + size) of a w x h canvas"""
    l, t, r, b = box
    return {'x': round((l + r) / 2 / w, 4), 'y': round((t + b) / 2 / h, 4), 'w': round((r - l) / w, 4), 'h': round((b - t) / h, 4)}


def hole_edges(im: Image.Image, thr=128):
    """inner edges of a frame / ring found by walking out from the centre"""
    a = np.array(im.getchannel('A'))
    h, w = a.shape
    cy, cx = h // 2, w // 2

    def walk(arr, start, step):
        i = start
        while 0 <= i < len(arr) and arr[i] < thr:
            i += step
        return i
    return walk(a[cy], cx, -1) + 1, walk(a[:, cx], cy, -1) + 1, walk(a[cy], cx, 1), walk(a[:, cx], cy, 1)


def hull(im: Image.Image, canvas=512, offset=(0, 0), scale=1.0):
    a = np.array(im.getchannel('A')) > 16
    pts = cv2.convexHull(np.argwhere(a)[:, ::-1].astype(np.int32)).reshape(-1, 2)
    return [[round(float(x) * scale + offset[0], 1), round(float(y) * scale + offset[1], 1)] for x, y in pts]


# ---------------------------------------------------------------------------- symbols

SYMBOL_HULLS: dict = {}


def symbols():
    sizes = {'l1': 430, 'l2': 430, 'l3': 455, 'l4': 430, 'l5': 430}
    for name, size in sizes.items():
        im, _ = crop_pad(clean(load(f'{name}.png'), min_comp=400))
        s = size / max(im.size)
        canvas = place((512, 512), scaled(im, s), 256 - im.width * s / 2, 256 - im.height * s / 2)
        save(canvas, SYM / f'{name}.png')
        SYMBOL_HULLS[name.upper()] = {'hull': hull(canvas), 'source': f'dragonSymbols/{name}.png'}
    # the gate, shut and open, on one shared box so the swap does not jump
    shut, opened = clean(load('s.png'), min_comp=400), clean(load('s-open.png'), min_comp=400)
    l1, t1, r1, b1 = shut.getbbox(); l2, t2, r2, b2 = opened.getbbox()
    box = (min(l1, l2), min(t1, t2), max(r1, r2), max(b1, b2))
    s = 400 / max(box[2] - box[0], box[3] - box[1])
    for im, out in ((shut, 's.png'), (opened, 's_open.png')):
        c = im.crop(box)
        canvas = place((512, 512), scaled(c, s), 256 - c.width * s / 2, 256 - c.height * s / 2)
        save(canvas, SYM / out)
        if out == 's.png':
            SYMBOL_HULLS['S'] = {'hull': hull(canvas), 'source': 'dragonSymbols/s.png'}
    for i in range(1, 5):
        tile = Image.open(SYM / f'h{i}.png').convert('RGBA')   # v3 highs, 512 x 462, drawn centred in the cell
        SYMBOL_HULLS[f'H{i}'] = {'hull': hull(tile, offset=(0, (512 - tile.height) / 2)), 'source': f'dragonSymbols/h{i}.png'}


# ---------------------------------------------------------------------------- pearls

def pearl_circle(im: Image.Image):
    """centre and radius of the pearl body: its widest row below the wave crown"""
    a = np.array(im.getchannel('A')) >= 128
    h = a.shape[0]
    ys = np.where(a.any(axis=1))[0]
    best = None
    for y in range(int(h * 0.35), ys.max()):
        row = np.where(a[y])[0]
        if len(row) and (best is None or row.max() - row.min() > best[0]):
            best = (row.max() - row.min(), row.min(), row.max())
    width, left, right = best
    r = width / 2
    return (left + right) / 2, ys.max() - r, r


def pearls():
    for name, out in (('pearl-blank', 'pearl_blank'), ('pearl-t1', 'pearl_t1'), ('pearl-t2', 'pearl_t2'),
                      ('pearl-t3', 'pearl_t3'), ('pearl-t4', 'pearl_t4'), ('pearl-t5', 'pearl_t5')):
        im = clean(load(f'{name}.png'), min_comp=400)
        if name == 'pearl-t5':
            # the prism: centre on its cream heart, scale its gold bezel (r ~398) to the body size;
            # the gold flames run past it, which is what makes the top tier read bigger
            arr = np.array(im).astype(int)
            cream = (arr[..., 3] > 200) & (arr[..., 0] > 225) & (arr[..., 1] > 215) & (arr[..., 2] > 190) & (abs(arr[..., 0] - arr[..., 1]) < 30)
            lab, n = ndimage.label(cream)
            k = np.argmax(ndimage.sum(cream, lab, range(1, n + 1))) + 1
            ys, xs = np.where(lab == k)
            cx, cy, r = xs.mean(), ys.mean(), 398.0
            GEO['pearlT5Heart'] = round(float(np.sqrt(len(ys) / np.pi) / r), 3)   # cream heart radius / body radius
        else:
            cx, cy, r = pearl_circle(im)
        s = 150 / r
        save(place((512, 512), scaled(im, s), 256 - cx * s, 300 - cy * s), OUT / f'{out}.png')
    blank = Image.open(OUT / 'pearl_blank.png')
    SYMBOL_HULLS['M'] = {'hull': hull(blank), 'source': 'dragonArt/pearl_blank.png'}


# ---------------------------------------------------------------------------- frame, logo

def frames():
    GEO['frame'] = {}
    for name, key in (('frame-mg', 'mg'), ('frame-fg', 'fg')):
        im, _ = crop_pad(clean(load(f'{name}.png'), min_comp=400), pad=2)
        l, t, r, b = hole_edges(im)
        save(im, OUT / f'frame_{key}.png')
        w, h = im.size
        GEO['frame'][key] = {'width': w, 'height': h, 'hole': {'left': l, 'top': t, 'right': r, 'bottom': b},
                             # nine-slice cuts: the corner ornaments stay whole, the plain bars stretch
                             'slice': {'left': round(w * 0.24), 'right': round(w * 0.24), 'top': t + 6, 'bottom': h - b + 6}}


def logo():
    im, _ = crop_pad(clean(load('logo.png'), min_comp=600), pad=2)
    # 1200 x 450 (the template's 1600:600 aspect); the wordmark in the top ~72%: the frame takes the rest
    s = min(1170 / im.width, 322 / im.height)
    r = scaled(im, s)
    save(place((1200, 450), r, (1200 - r.width) / 2, 6), OUT / 'logo.png')
    # loading ring: the teal wave ring, small
    ring, _ = crop_pad(clean(load('portal-in.png'), min_comp=200))
    canvas, _, _ = fit(ring, (256, 256))
    save(canvas, OUT / 'loader.png')


# ---------------------------------------------------------------------------- bet bar, plates

def bar():
    im = clean(load('bar-strip.png'), min_comp=400)
    l, t, r, b = im.getbbox()
    panel = next(region for region in flat_regions(im, minsize=40000) if region[2][1] > region[2][0])  # the teal well
    pl, pt, pr, pb = panel[1]
    centre = (pt + pb) / 2
    top = t - 2
    bottom = round(centre + (centre - top))         # pad below so the panel sits on the strip's centre line
    strip = im.crop((l - 2, top, r + 2, max(bottom, b + 2)))
    save(strip, OUT / 'bar_strip.png')
    GEO['bar'] = {'width': strip.width, 'height': strip.height, 'slice': round(pl - (l - 2) + 60),
                  'panel': rect((pl - (l - 2), pt - top, pr - (l - 2), pb - top), strip.width, strip.height)}
    # ticker plate: the same language, on the template's 652 x 146 canvas
    tick, _ = crop_pad(clean(load('ticker.png'), min_comp=400))
    canvas, _, _ = fit(tick, (652, 146))
    save(canvas, OUT / 'ticker.png')


def buttons():
    for name, out in (('button', 'button'), ('button-lit', 'button_lit')):
        im, _ = crop_pad(clean(load(f'{name}.png'), min_comp=400), pad=0)
        d = max(im.size)
        s = 410 / d                                   # outer rim = the template disc (r 102.5 of 256), drawn at 2x
        r = scaled(im, s)
        save(place((512, 512), r, 256 - r.width / 2, 256 - r.height / 2), OUT / f'{out}.png')


def buy_bonus():
    plain, lit = clean(load('buybonus.png'), min_comp=400), clean(load('buybonus-lit.png'), min_comp=400)
    l1, t1, r1, b1 = plain.getbbox(); l2, t2, r2, b2 = lit.getbbox()
    box = (min(l1, l2) - 2, min(t1, t2) - 2, max(r1, r2) + 2, max(b1, b2) + 2)
    for im, out in ((plain, 'buybonus'), (lit, 'buybonus_lit')):
        canvas, s, (ox, oy) = fit(im.crop(box), (640, 640))
        save(canvas, OUT / f'{out}.png')
        if out == 'buybonus':
            well = flat_regions(canvas, minsize=8000)[0][1]
            a = np.array(canvas.getchannel('A')) > 128
            pts = cv2.convexHull(np.argwhere(a)[:, ::-1].astype(np.int32))
            poly = cv2.approxPolyDP(pts, 6, True).reshape(-1, 2)
            GEO['buyBonus'] = {'well': rect(well, 640, 640),
                               'hit': [[round(x / 640, 3), round(y / 640, 3)] for x, y in poly.tolist()]}


def total_plates():
    GEO['total'] = []
    for i in range(1, 5):
        im, _ = crop_pad(clean(load(f'total-{i}.png'), min_comp=400), pad=4)
        regions = flat_regions(im, minsize=60000)
        # the well is the widest flat region, the window the roundest one left of it
        well = max(regions, key=lambda r: (r[1][2] - r[1][0]))[1]
        window = min((r for r in regions if r[1][2] <= well[0] + 40), key=lambda r: abs((r[1][2] - r[1][0]) - (r[1][3] - r[1][1])))[1]
        s = 150 / (well[3] - well[1])
        out = scaled(im, s)
        save(out, OUT / f'total_{i}.png')
        k = lambda v: round(v * s, 1)
        GEO['total'].append({'width': out.width, 'height': out.height,
                             'well': {'x': k((well[0] + well[2]) / 2), 'y': k((well[1] + well[3]) / 2), 'w': k(well[2] - well[0]), 'h': k(well[3] - well[1])},
                             'window': {'x': k((window[0] + window[2]) / 2), 'y': k((window[1] + window[3]) / 2), 'r': k(min(window[2] - window[0], window[3] - window[1]) / 2)}})


def fs_counter():
    im, _ = crop_pad(clean(load('fs-counter.png'), min_comp=400), pad=2)
    canvas, _, _ = fit(im, (512, 320))
    save(canvas, OUT / 'fs_counter.png')
    bands = sorted(flat_regions(canvas, minsize=8000)[:2], key=lambda r: r[1][1])
    GEO['fsCounter'] = {'title': rect(bands[0][1], 512, 320), 'count': rect(bands[1][1], 512, 320)}


def fs_panels():
    for name, key in (('fs-intro', 'fsIntro'), ('fs-outro', 'fsOutro')):
        im, _ = crop_pad(clean(load(f'{name}.png'), min_comp=400), pad=2)
        # 1280 x 692 keeps the template's 1706:922 aspect at the most the panel is ever drawn (~1250 px on 4K)
        canvas, _, _ = fit(im, (1280, 692))
        save(canvas, OUT / f'{name.replace("-", "_")}.png')
        GEO[key] = rect(flat_regions(canvas, minsize=12000)[0][1], 1280, 692)


def banners():
    GEO['banners'] = {}
    for alias, name in (('big', 'banner-big'), ('superwin', 'banner-super'), ('mega', 'banner-mega'),
                        ('epic', 'banner-epic'), ('max', 'banner-max')):
        im, _ = crop_pad(clean(load(f'{name}.png'), min_comp=500), pad=2)
        out = scaled(im, 1500 / im.width)
        save(out, OUT / f'banner_{alias}.png')
        well = flat_regions(out, minsize=20000)[0][1]
        GEO['banners'][alias] = {'width': out.width, 'height': out.height,
                                 'textY': round(((well[1] + well[3]) / 2 - out.height / 2) / out.height, 4),
                                 'textHeight': round((well[3] - well[1]) / out.height, 4),
                                 'textWidth': round((well[2] - well[0]) / out.width, 4)}


def portals():
    GEO['portal'] = {}
    for name, key in (('portal-in', 'in'), ('portal-out', 'out')):
        im, _ = crop_pad(clean(load(f'{name}.png'), min_comp=60), pad=2)
        s = 1024 / max(im.size)
        out = scaled(im, s)
        save(out, OUT / f'portal_{key}.png')
        l, t, r, b = hole_edges(out, thr=96)
        GEO['portal'][key] = {'width': out.width, 'height': out.height,
                              'hole': {'x': round((l + r) / 2, 1), 'y': round((t + b) / 2, 1), 'rx': round((r - l) / 2, 1), 'ry': round((b - t) / 2, 1)}}


# ---------------------------------------------------------------------------- loading cards

CARD = (960, 720)


def card_one():
    """the tumble card: the delivery's two boards carry stand-in icons (lotus, cloud, swirl,
    coin); swap each for the game's own low symbol of the same colour, so the card shows
    the symbols the player will actually see"""
    src = np.array(Image.open(SRC / 'card-1.jpg').convert('RGB'))
    H, W = src.shape[:2]
    ours = {k: Image.open(SYM / f'{k}.png').convert('RGBA') for k in ('l1', 'l3', 'l4', 'l5')}
    hsv = cv2.cvtColor(src, cv2.COLOR_RGB2HSV).astype(int)

    def classify(cell):
        h, s, v = cell[..., 0], cell[..., 1], cell[..., 2]
        sat = (s > 70) & (v > 80)
        if sat.sum() < 150:
            return None
        hue = np.median(h[sat])                         # OpenCV hue 0-179
        if 12 <= hue < 35:
            return 'l1'                                 # gold coin  -> L1 gold scale disc
        if 35 <= hue < 95:
            return 'l4'                                 # green cloud -> L4 green shield
        if 95 <= hue < 125:
            return 'l5'                                 # blue lotus  -> L5 blue octagon
        if 125 <= hue < 170:
            return 'l3'                                 # purple swirl -> L3 purple diamond
        return None

    out = Image.fromarray(src)
    # the two board outlines, measured on the delivered card-1.jpg (darkest rows/columns
    # inside y 300-900): 6 x 5 cells of ~100 x 96 px each
    boards = [(74, 357, 674, 837), (776, 358, 1373, 837)]
    swaps = 0
    for left, top, right, bottom in boards:
        cw, ch = (right - left) / 6, (bottom - top) / 5
        for row in range(5):
            for col in range(6):
                cx, cy = left + (col + 0.5) * cw, top + (row + 0.5) * ch
                box = (int(cx - cw * 0.40), int(cy - ch * 0.40), int(cx + cw * 0.40), int(cy + ch * 0.40))
                kind = classify(hsv[box[1]:box[3], box[0]:box[2]])
                if not kind:
                    continue
                # repaint the cell's paper up to just inside its grid lines (the stand-in icons
                # run almost edge to edge); on the winning cells keep the gold corner brackets
                # by clearing a disc instead of the square
                ix, iy = cw * 0.465, ch * 0.465
                box = (int(cx - ix), int(cy - iy), int(cx + ix), int(cy + iy))
                inner = src[box[1]:box[3], box[0]:box[2]]
                paper = np.median(np.concatenate([inner[:3].reshape(-1, 3), inner[-3:].reshape(-1, 3),
                                                  inner[:, :3].reshape(-1, 3), inner[:, -3:].reshape(-1, 3)]), axis=0)
                patch = Image.new('RGB', (box[2] - box[0], box[3] - box[1]), tuple(int(v) for v in paper))
                mask = Image.new('L', patch.size, 0)
                if kind == 'l1':
                    ImageDraw.Draw(mask).ellipse((5, 5, patch.width - 5, patch.height - 5), fill=255)
                else:
                    mask.paste(255, (0, 0, patch.width, patch.height))
                out.paste(patch, box[:2], mask)
                size = int(min(cw, ch) * 0.86)
                tile = resize(ours[kind], (size, size))
                out.paste(tile, (int(cx - size / 2), int(cy - size / 2)), tile)
                swaps += 1
    # the three icons falling into the right-hand board: everything that differs from the
    # paper inside each icon's box is inpainted out, then ours is dropped in its place
    work = np.array(out)
    paper = np.median(work[95:125, 880:1320].reshape(-1, 3), axis=0)
    for (x0, y0, x1, y1) in ((872, 150, 994, 236), (1052, 166, 1165, 252), (1192, 128, 1332, 246)):
        piece = work[y0:y1, x0:x1].astype(int)
        diff = np.abs(piece - paper).sum(axis=2) > 22
        diff = ndimage.binary_dilation(diff, iterations=6)
        mask = np.zeros(work.shape[:2], np.uint8)
        mask[y0:y1, x0:x1][diff] = 255
        kind = classify(hsv[y0:y1, x0:x1]) or 'l5'
        work = cv2.inpaint(work, mask, 9, cv2.INPAINT_TELEA)
        ys, xs = np.where(diff)
        cx, cy = x0 + (xs.min() + xs.max()) / 2, y0 + (ys.min() + ys.max()) / 2
        size = int(min(x1 - x0, y1 - y0) * 0.86)
        tile = resize(ours[kind], (size, size))
        img = Image.fromarray(work)
        img.paste(tile, (int(cx - size / 2), int(cy - size / 2)), tile)
        work = np.array(img)
        swaps += 1
    out = Image.fromarray(work)
    out = out.resize(CARD, Image.LANCZOS)
    out.save(OUT / 'intro_1.jpg', quality=90)
    return swaps


def cards():
    swaps = card_one()
    for i in (2, 3):
        Image.open(SRC / f'card-{i}.jpg').convert('RGB').resize(CARD, Image.LANCZOS).save(OUT / f'intro_{i}.jpg', quality=90)
    sx = CARD[0] / 1448
    # card 2: the three pearls the king casts (cream hearts measured on the delivery)
    GEO['card2'] = [{'x': round(x * sx / CARD[0], 4), 'y': round(y * sx / CARD[1], 4), 'r': round(87 * sx / CARD[0], 4), 'value': v}
                    for (x, y), v in (((1084, 406), 5), ((838, 640), 10), ((1221, 648), 25))]
    # card 3: three small pearls flowing into the big TOTAL pearl
    GEO['card3'] = {'small': [{'x': round(x * sx / CARD[0], 4), 'y': round(y * sx / CARD[1], 4), 'value': v}
                              for (x, y), v in (((668, 230), 2), ((825, 290), 8), ((970, 352), 15))],
                    'total': {'x': round(1200 * sx / CARD[0], 4), 'y': round(540 * sx / CARD[1], 4), 'r': round(185 * sx / CARD[0], 4)}}
    return swaps


def buy_cards():
    for name in ('buy-fg', 'buy-super'):
        im, _ = crop_pad(clean(load(f'{name}.png'), min_comp=400), pad=2)
        canvas, _, _ = fit(im, (480, 600), align='bottom')   # shown ~180 px tall in the menu: 2x is plenty
        save(canvas, OUT / f'{name.replace("-", "_")}.png')


# ---------------------------------------------------------------------------- tumble burst

def burst():
    im = clean(load('burst-sheet.png'), lo=6, min_comp=12, solid=False)
    a = np.array(im.getchannel('A'))
    rows = np.where(a.max(axis=1) > 16)[0]
    top, bottom = rows.min() - 4, rows.max() + 4
    cols = np.where(a.max(axis=0) > 16)[0]
    left, right = cols.min(), cols.max() + 1
    step = (right - left) / 8
    # spray drops cross the column lines, so each separate piece is given to the frame
    # whose centre is nearest its own; every frame keeps one scale and a shared baseline
    lab, n = ndimage.label(a > 16, structure=np.ones((3, 3)))
    centres = ndimage.center_of_mass(a > 16, lab, range(1, n + 1))
    owner = np.zeros(n + 1, int)
    for k, (_, x) in enumerate(centres, 1):
        owner[k] = min(7, max(0, int((x - left) // step)))
    soft = ndimage.binary_dilation(lab > 0, iterations=2)      # keep each piece's soft rim with it
    near = ndimage.distance_transform_edt(lab == 0, return_distances=False, return_indices=True)
    nearest = lab[near[0], near[1]]
    arr = np.array(im)
    side = max(step * 1.25, bottom - top)
    k = 256 / side
    sheet = Image.new('RGBA', (256 * 8, 256), (0, 0, 0, 0))
    for i in range(8):
        mine = soft & (owner[nearest] == i)
        piece = arr.copy()
        piece[~mine] = 0
        cx = left + (i + 0.5) * step
        frame = Image.fromarray(piece).crop((round(cx - side / 2), top, round(cx + side / 2), bottom))
        cell = resize(frame, (frame.width * k, frame.height * k))
        sheet.paste(cell, (i * 256 + round((256 - cell.width) / 2), 256 - cell.height))
    save(sheet, OUT / 'burst_sheet.png')
    GEO['burst'] = {'frames': 8, 'size': 256}


# ---------------------------------------------------------------------------- backdrop props

def backdrop_props():
    GEO['props'] = {}
    for i in (1, 2, 3):
        im, _ = crop_pad(clean(load(f'mg-wave-{i}.png'), min_comp=200), pad=2)
        out = scaled(im, 1500 / im.width)
        save(out, OUT / f'bg/mg_wave_{i}.png')
        GEO['props'][f'mgWave{i}'] = [out.width, out.height]
    im, _ = crop_pad(clean(load('mg-lantern.png'), min_comp=200), pad=2)
    out = scaled(im, 256 / max(im.size)); save(out, OUT / 'bg/mg_lantern.png'); GEO['props']['mgLantern'] = [out.width, out.height]
    for i in (1, 2, 3):
        im, _ = crop_pad(clean(load(f'mg-fish-{i}.png'), min_comp=200), pad=2)
        out = scaled(im, 300 / im.width); save(out, OUT / f'bg/mg_fish_{i}.png'); GEO['props'][f'mgFish{i}'] = [out.width, out.height]
    # bubbles: eight separate pieces on one strip
    im = clean(load('fg-bubbles.png'), lo=8, min_comp=40, solid=False)
    a = np.array(im.getchannel('A')) > 24
    lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=3))
    objs = sorted(ndimage.find_objects(lab), key=lambda sl: -((sl[0].stop - sl[0].start) * (sl[1].stop - sl[1].start)))[:8]
    objs.sort(key=lambda sl: sl[1].start)
    biggest = max(max(sl[0].stop - sl[0].start, sl[1].stop - sl[1].start) for sl in objs) + 4
    for i, (ys, xs) in enumerate(objs, 1):
        piece = im.crop((xs.start - 2, ys.start - 2, xs.stop + 2, ys.stop + 2))
        save(scaled(piece, 96 / biggest), OUT / f'bg/fg_bubble_{i}.png')   # one scale: the sizes stay different
    GEO['props']['fgBubbles'] = len(objs)
    for i in (1, 2, 3):
        im, _ = crop_pad(clean(load(f'fg-seaweed-{i}.png'), min_comp=200), pad=2)
        out = scaled(im, 520 / im.height); save(out, OUT / f'bg/fg_seaweed_{i}.png'); GEO['props'][f'fgSeaweed{i}'] = [out.width, out.height]
    im = clean(load('fg-shaft.png'), lo=3, min_comp=60, solid=False)
    im, _ = crop_pad(im, pad=2)
    out = scaled(im, 900 / im.height); save(out, OUT / 'bg/fg_shaft.png'); GEO['props']['fgShaft'] = [out.width, out.height]


def icons():
    src = APP / 'static/assets/sprites/dragonInterim/icons'
    dst = OUT / 'icons'
    dst.mkdir(exist_ok=True)
    if src.exists():
        for p in sorted(src.glob('*.png')):
            Image.open(p).save(dst / p.name, optimize=True)


def compress():
    """256-colour palette (octree + Floyd-Steinberg) for every flat-painted PNG over 120 KB: the
    paper grain and ink survive (checked at 2x on magenta, 2026-11-10) at ~15% of the size. Kept
    only when the opaque colour error stays under 4 levels and the soft edges under 8; the light
    shaft and other soft gradients are left as they are."""
    saved = 0
    keep_soft = {'fg_shaft.png'}
    for path in sorted(list(OUT.rglob('*.png')) + list(SYM.glob('*.png'))):
        if path.name in keep_soft or path.stat().st_size < 120_000 or path.name.startswith('h'):
            continue
        src = Image.open(path).convert('RGBA')
        q = src.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
        back = np.array(q.convert('RGBA')).astype(int); orig = np.array(src).astype(int)
        solid, edge = orig[..., 3] > 200, (orig[..., 3] > 0) & (orig[..., 3] <= 200)
        colour = np.abs(back[..., :3] - orig[..., :3])[solid].mean() if solid.any() else 0
        soft = np.abs(back[..., 3] - orig[..., 3])[edge].mean() if edge.any() else 0
        if colour >= 4 or soft >= 8:
            print(f'  kept full colour: {path.name} (error {colour:.1f} / {soft:.1f})')
            continue
        before = path.stat().st_size
        q.save(path, optimize=True)
        saved += before - path.stat().st_size
    print(f'  palette PNGs: {saved / 1e6:.1f} MB saved')


def main():
    import sys
    only = set(sys.argv[1:])
    if only:   # rerun single steps, keeping the rest of the measured geometry
        GEO.update(json.loads(GEO_PATH.read_text()))
        SYMBOL_HULLS.update(json.loads((APP / 'design/dragon-symbols-manifest.json').read_text()))
    steps = [symbols, pearls, frames, logo, bar, buttons, buy_bonus, total_plates, fs_counter,
             fs_panels, banners, portals, cards, buy_cards, burst, backdrop_props, icons, compress]
    swaps = None
    for step in steps:
        if only and step.__name__ not in only:
            continue
        result = step()
        if step is cards:
            swaps = result
    GEO_PATH.write_text(json.dumps(GEO, indent=1) + '\n')
    (APP / 'design/dragon-symbols-manifest.json').write_text(json.dumps(SYMBOL_HULLS, indent=1) + '\n')
    print(f'final art written to {OUT.relative_to(APP)} (card 1: {swaps} icons swapped)')



if __name__ == '__main__':
    main()
