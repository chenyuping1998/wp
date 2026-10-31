"""Light masks cut from Purrfia's and Parrot Radio's own background paintings (user 2026-10-31: 加強背景光影動態).

Medusa animates its plaza with separate painted pieces (clouds, braziers, statues). These two sets are single
paintings, so the moving light is cut from the paintings themselves, never painted over them:
  purrfia base: `sunlit` (the sun patches on floor, sill and window frame — dimmed when a cloud passes);
  purrfia free: the three neon signs (`neonCat`, `neonFish`, `neonPaw`, as cut-out colour for an additive pulse),
                their reflections in the wet street (`reflectPink`, `reflectCyan`), and where the cat's eyes are;
Parrot Radio's moving light is drawn in code (sea, palms, deck); it needs no cut.
White masks are white with the mask in alpha; cut-outs keep the painting's colour. Everything is at half resolution
(the set is 1920×1080) and cropped to its content; src/game/backgroundFx.json says where each goes (1920 space).
  python tools/build_bg_light_masks.py
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageFilter

APPS = Path(__file__).resolve().parents[1] / 'apps'


def smooth(a, b, v):
    t = np.clip((v - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def load(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float32)


def box(mask, x0, y0, x1, y1, feather=0):
    """keep the mask inside a rectangle, with an optional soft edge"""
    h, w = mask.shape
    ys, xs = np.mgrid[0:h, 0:w]
    if not feather:
        return mask * ((xs >= x0) & (xs < x1) & (ys >= y0) & (ys < y1))
    f = smooth(x0, x0 + feather, xs) * (1 - smooth(x1 - feather, x1, xs)) * smooth(y0, y0 + feather, ys) * (1 - smooth(y1 - feather, y1, ys))
    return mask * f


def save(out_dir, name, rgb, alpha, layout, blur=1.2):
    """half resolution, cropped to content; rgb None = white mask"""
    a = Image.fromarray((np.clip(alpha, 0, 1) * 255).astype(np.uint8), 'L')
    if blur:
        a = a.filter(ImageFilter.GaussianBlur(blur))
    bb = a.point(lambda v: 255 if v > 6 else 0).getbbox()
    if bb is None:
        raise SystemExit(f'{name}: empty mask')
    x0, y0, x1, y1 = (bb[0] // 2 * 2, bb[1] // 2 * 2, min(1920, (bb[2] + 1) // 2 * 2), min(1080, (bb[3] + 1) // 2 * 2))
    colour = Image.new('RGB', a.size, (255, 255, 255)) if rgb is None else Image.fromarray(rgb.astype(np.uint8), 'RGB')
    im = colour.copy()
    im.putalpha(a)
    im = im.crop((x0, y0, x1, y1)).resize(((x1 - x0) // 2, (y1 - y0) // 2), Image.LANCZOS)
    im.save(out_dir / f'fx_{name}.png', optimize=True)
    layout[name] = [x0, y0, x1 - x0, y1 - y0]


def purrfia(app):
    out = app / 'static/assets/sprites/purrfiaBackground'
    layout = {'base': {}, 'free': {}}
    px = load(out / 'bg_base.jpg')
    r, g, b = px[..., 0], px[..., 1], px[..., 2]
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    warm = smooth(25, 70, r - b)
    sunlit = smooth(150, 212, lum) * warm
    # the floor and the window side; not the wall stripes (behind the board) nor the safe
    h, w = lum.shape
    ys, xs = np.mgrid[0:h, 0:w]
    region = np.maximum((ys >= 690).astype(np.float32) * smooth(660, 700, ys), (xs < 640) * (ys < 700) * 1.0)
    save(out, 'sunlit', None, sunlit * region, layout['base'])

    px = load(out / 'bg_free.jpg')
    r, g, b = px[..., 0], px[..., 1], px[..., 2]
    pink = smooth(60, 140, np.minimum(r, b) - g) * smooth(170, 230, r)
    cyan = smooth(40, 110, np.minimum(g, b) - r) * smooth(150, 220, g)
    for name, mask, rect in (('neonCat', pink, (40, 20, 340, 300)), ('neonPaw', pink, (1720, 80, 1920, 300)),
                             ('neonFish', cyan, (370, 140, 560, 360))):
        save(out, name, px, box(mask, *rect), layout['free'])
    save(out, 'reflectPink', px, box(pink, 0, 760, 760, 1080, 40), layout['free'], blur=2)
    save(out, 'reflectCyan', px, box(cyan, 0, 760, 760, 1080, 40), layout['free'], blur=2)
    # the cat in the box: its two yellow eyes
    eyes = (r > 200) & (g > 170) & (b < 90) & (xs > 130) & (xs < 230) & (ys > 500) & (ys < 570)
    lab_y, lab_x = np.nonzero(eyes)
    left, right = lab_x < 181, (lab_x >= 181) & (lab_x < 206) & (lab_y > 520) & (lab_y < 550)
    layout['free']['eyes'] = [[round(float(lab_x[s].mean()), 1), round(float(lab_y[s].mean()), 1),
                               round(float(lab_x[s].max() - lab_x[s].min() + 1), 1), round(float(lab_y[s].max() - lab_y[s].min() + 1), 1)]
                              for s in (left, right)]
    return layout


data = {'purrfia': purrfia(APPS / 'Purrfia喵菲亞家族')}
for app in ('Purrfia喵菲亞家族', 'ParrotRadio鸚鵡電台'):
    (APPS / app / 'src/game/backgroundFx.json').write_text(json.dumps(data, indent=1) + '\n', encoding='utf8')
print(json.dumps(data))
