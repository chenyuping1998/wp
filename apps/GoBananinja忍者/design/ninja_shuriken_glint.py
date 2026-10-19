"""The shuriken stuck in the ninja's shoulder: crisp, and catching the light now
and then (2026-10-17, user: 「插在身上的手裡劍要做清晰一點，可以偶爾讓他閃過光」).

CRISP. Its attachment pointed at the whole 549x504 source painting (the
`dynamite` region) and drew it at 110x101 — a 5x shrink on a Spine page that has
no mip chain, so the GPU sampled a scattering of texels and the blades came out
grainy and shimmering. Now it has its own region, Lanczos-reduced once to twice
its drawn size and lightly sharpened, which the GPU only has to halve.

THE GLINT. Every 6 s (`glint`, looping on track 3 in Mascot.svelte) the steel
flares once — an additive copy of the shuriken brightens and fades — and a
four-point star opens on the visible upper-left blade tip, turns a little and
closes. 0.4 s of light, 5.6 s of nothing: one beat, then stillness.

Run by boost_ninja_flow.mjs after cut_ninja_straps.py and before ninja_blink.py;
it replaces its own regions, slots, bone and animation each time.
"""
import json
import math
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

APP = Path(__file__).resolve().parents[1]
DIR = APP / 'static/assets/spines/goBananinjaMascot'
JSON = DIR / 'ninja.json'
ATLAS = DIR / 'ninja.atlas'
PAGE = DIR / 'ninja.png'

DRAWN = (110, 101)                      # the attachment's on-rig size
CRISP = (DRAWN[0] * 2, DRAWN[1] * 2)    # stored at 2x
STAR = 72
PERIOD = 6.0
FLASH = 4.6                              # when in the loop the light comes


def star_texture(n=STAR):
    ss = 4
    N = n * ss
    ys, xs = np.mgrid[0:N, 0:N]
    c = (N - 1) / 2
    dx, dy = (xs - c) / c, (ys - c) / c
    r = np.hypot(dx, dy)
    # four long thin rays and two short diagonal ones, on a soft core
    ray = lambda ax, ay, w: np.exp(-((ax / w) ** 2)) * np.clip(1 - np.abs(ay), 0, 1) ** 2.2
    a = np.maximum.reduce([
        ray(dx, dy, 0.035), ray(dy, dx, 0.035),
        0.55 * ray((dx - dy) / 1.414, (dx + dy) / 1.414 * 1.8, 0.04),
        0.55 * ray((dx + dy) / 1.414, (dx - dy) / 1.414 * 1.8, 0.04),
        np.exp(-(r / 0.16) ** 2),
    ])
    img = np.dstack([np.ones_like(a), np.ones_like(a) * 0.98, np.ones_like(a) * 0.9, np.clip(a, 0, 1)])
    return Image.fromarray((img * 255).astype(np.uint8), 'RGBA').resize((n, n), Image.LANCZOS)


def main():
    atlas = ATLAS.read_text()
    page = Image.open(PAGE).convert('RGBA')
    atlas = re.sub(r'\n(shuriken_crisp|glint_star)\nbounds:[^\n]*\noffsets:[^\n]*\nindex:-1', '', atlas)
    x, y, w, h = map(int, re.search(r'^dynamite\nbounds:(\d+),(\d+),(\d+),(\d+)', atlas, re.M).groups())
    src = page.crop((x, y, x + w, y + h))
    crisp = src.resize(CRISP, Image.LANCZOS)
    rgb = crisp.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.0, percent=70, threshold=1))
    crisp = Image.merge('RGBA', (*rgb.split(), crisp.getchannel('A')))
    star = star_texture()

    # free space for both, below everything else on the page
    occ = np.zeros((page.height, page.width), bool)
    for bx, by, bw, bh in re.findall(r'bounds:(\d+),(\d+),(\d+),(\d+)', atlas):
        bx, by, bw, bh = map(int, (bx, by, bw, bh))
        occ[max(0, by - 2):by + bh + 2, max(0, bx - 2):bx + bw + 2] = True
    occ |= np.asarray(page)[..., 3] > 0
    occ[0:100, 870:1024] = True  # ninja_blink.py's lids

    def place(wd, ht):
        for yy in range(1784, page.height - ht, 4):
            for xx in range(4, page.width - wd - 4, 4):
                if not occ[yy - 2:yy + ht + 2, xx - 2:xx + wd + 2].any():
                    occ[yy - 2:yy + ht + 2, xx - 2:xx + wd + 2] = True
                    return xx, yy
        raise SystemExit('atlas page is full')

    regions = ''
    for name, im in (('shuriken_crisp', crisp), ('glint_star', star)):
        px, py = place(*im.size)
        page.paste(Image.new('RGBA', im.size), (px, py))
        page.alpha_composite(im, (px, py))
        regions += f'\n{name}\nbounds:{px},{py},{im.width},{im.height}\noffsets:0,0,{im.width},{im.height}\nindex:-1'
        print(name, (px, py), im.size)
    page.save(PAGE)
    ATLAS.write_text(atlas.rstrip('\n') + regions + '\n')

    rig = json.loads(JSON.read_text(encoding='utf-8'))
    skin = rig['skins'][0]['attachments']
    att = skin['shoulder_shuriken']['shoulder_shuriken']
    att['path'] = 'shuriken_crisp'
    # source px -> the attachment's bone-local space
    sx = att['width'] / w

    def local(px, py):
        return att['x'] + (px - w / 2) * sx, att['y'] - (py - h / 2) * sx

    tip = local(29, 11)  # the upper-left blade's point, measured on the painting
    rig['bones'] = [b for b in rig['bones'] if b['name'] != 'shuriken_glint']
    rig['bones'].append({'name': 'shuriken_glint', 'parent': 'armL', 'x': round(tip[0], 3), 'y': round(tip[1], 3)})
    rig['slots'] = [s for s in rig['slots'] if s['name'] not in ('shuriken_shine', 'shuriken_spark')]
    at = next(i for i, s in enumerate(rig['slots']) if s['name'] == 'shoulder_shuriken')
    rig['slots'][at + 1:at + 1] = [
        {'name': 'shuriken_shine', 'bone': 'armL', 'color': 'ffffff00', 'attachment': 'shuriken_shine', 'blend': 'additive'},
        {'name': 'shuriken_spark', 'bone': 'shuriken_glint', 'color': 'ffffff00', 'attachment': 'glint_star', 'blend': 'additive'},
    ]
    skin['shuriken_shine'] = {'shuriken_shine': {**att, 'path': 'shuriken_crisp'}}
    skin['shuriken_spark'] = {'glint_star': {'path': 'glint_star', 'width': 46, 'height': 46}}

    f = FLASH
    rig['animations']['glint'] = {
        'slots': {
            'shuriken_shine': {'rgba': [
                {'time': 0, 'color': 'ffffff00'}, {'time': f, 'color': 'ffffff00'},
                {'time': f + 0.12, 'color': 'ffffff8c'}, {'time': f + 0.42, 'color': 'ffffff00'},
                {'time': PERIOD, 'color': 'ffffff00'}]},
            'shuriken_spark': {'rgba': [
                {'time': 0, 'color': 'ffffff00'}, {'time': f + 0.06, 'color': 'ffffff00'},
                {'time': f + 0.16, 'color': 'ffffffff'}, {'time': f + 0.4, 'color': 'ffffff00'},
                {'time': PERIOD, 'color': 'ffffff00'}]},
        },
        'bones': {'shuriken_glint': {
            'rotate': [{'time': 0, 'value': 0}, {'time': f + 0.06, 'value': 0}, {'time': f + 0.4, 'value': 40},
                       {'time': f + 0.41, 'value': 0}, {'time': PERIOD, 'value': 0}],
            'scale': [{'time': 0, 'x': 0.2, 'y': 0.2}, {'time': f + 0.06, 'x': 0.2, 'y': 0.2},
                      {'time': f + 0.18, 'x': 1.15, 'y': 1.15}, {'time': f + 0.4, 'x': 0.35, 'y': 0.35},
                      {'time': PERIOD, 'x': 0.2, 'y': 0.2}],
        }},
    }
    for name, anim in rig['animations'].items():
        if name != 'glint':
            for key in ('shuriken_shine', 'shuriken_spark'):
                anim.get('slots', {}).pop(key, None)
    JSON.write_text(json.dumps(rig, separators=(',', ':')), encoding='utf-8')
    print('glint: tip at', tuple(round(v, 1) for v in tip), '-> ', JSON)


if __name__ == '__main__':
    main()
