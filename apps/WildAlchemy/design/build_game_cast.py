#!/usr/bin/env python3
"""Wild Alchemy cast → game assets (Spine 4.3, spine-motion-kit output). Ported from Static Shift.

The kit writes one full-canvas 1024×1536 PNG per attachment. This crops every attachment to its alpha
box, packs the crops into one atlas per figure (a Pixi `sprites` sheet) and moves each region
attachment's centre by the crop offset, so the rig draws exactly the same pixels in the same place.

  /Applications/anaconda3/bin/python3 design/build_game_cast.py

Inputs (new-games/wild-alchemy/art/2026-11-10-characters, stand34 robe template + flask motion set):
  alchemist   mg/spine/alchemist.json   + images/   (MG, 7 clips)
  homunculus  fg/spine/homunculus.json  + images/   (FG, 12 clips)
Outputs: static/assets/castSpine43/<who>/{cast.json, cast_atlas.json, cast_atlas.png}
"""
import hashlib, json, math, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.abspath(os.path.join(HERE, '..'))
ART = os.path.abspath(os.path.join(APP, '..', '..', '..', 'new-games', 'wild-alchemy', 'art', '2026-11-10-characters'))
CAST = {
    'alchemist': {'rig': 'mg/spine/alchemist.json', 'prefix': 'wa43mg_'},
    'homunculus': {'rig': 'fg/spine/homunculus.json', 'prefix': 'wa43fg_'},
}
PAD = 2          # transparent border kept around each crop (bilinear sampling)
GAP = 2          # space between crops in the atlas
ATLAS_W = 2048


def crop_box(im):
    bb = im.getchannel('A').getbbox()
    if bb is None:
        raise SystemExit(f'empty attachment image')
    x0, y0, x1, y1 = bb
    return max(0, x0 - PAD), max(0, y0 - PAD), min(im.width, x1 + PAD), min(im.height, y1 + PAD)


def pack(sizes):
    """Shelf packer, tallest first. Returns {name: (x, y)} and the atlas size."""
    order = sorted(sizes, key=lambda n: (-sizes[n][1], -sizes[n][0], n))
    pos, x, y, shelf = {}, 0, 0, 0
    for n in order:
        w, h = sizes[n]
        if x + w > ATLAS_W:
            x, y, shelf = 0, y + shelf + GAP, 0
        pos[n] = (x, y)
        x += w + GAP
        shelf = max(shelf, h)
    height = y + shelf
    h2 = 1
    while h2 < height:
        h2 *= 2
    return pos, (ATLAS_W, h2)


def build(who, cfg):
    rig_path = os.path.join(ART, cfg['rig'])
    rig = json.load(open(rig_path))
    img_dir = os.path.join(os.path.dirname(rig_path), rig['skeleton'].get('images', './images/'))
    if not rig['skeleton']['spine'].startswith('4.3.'):
        raise SystemExit(f'{who}: not a Spine 4.3 rig')
    skin = rig['skins'][0]['attachments']
    crops, sizes = {}, {}
    for slot, atts in skin.items():
        for name, att in atts.items():
            if att.get('type', 'region') != 'region':
                raise SystemExit(f'{who}: {slot}/{name} is not a region attachment')
            for k in att:
                if k not in ('x', 'y', 'rotation', 'width', 'height'):
                    raise SystemExit(f'{who}: {slot}/{name} has unsupported key {k}')
            if name in crops:
                continue
            im = Image.open(os.path.join(img_dir, att.get('path', name) + '.png')).convert('RGBA')
            if im.size != (att['width'], att['height']):
                raise SystemExit(f'{who}: {name} image {im.size} != attachment size')
            box = crop_box(im)
            crops[name] = (im.crop(box), box, im.size)
            sizes[name] = (box[2] - box[0], box[3] - box[1])

    pos, (aw, ah) = pack(sizes)
    atlas = Image.new('RGBA', (aw, ah), (0, 0, 0, 0))
    frames = {}
    for name, (crop, box, _) in crops.items():
        x, y = pos[name]
        atlas.paste(crop, (x, y))
        w, h = sizes[name]
        frames[cfg['prefix'] + name] = {
            'frame': {'x': x, 'y': y, 'w': w, 'h': h}, 'rotated': False, 'trimmed': False,
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'sourceSize': {'w': w, 'h': h}}

    # Move every region centre by its crop offset (image y runs down, attachment y up).
    for slot, atts in skin.items():
        for name, att in atts.items():
            _, (bx, by, bx1, by1), (iw, ih) = crops[name]
            w, h = bx1 - bx, by1 - by
            dx, dy = bx + w / 2 - iw / 2, ih / 2 - (by + h / 2)
            t = math.radians(att.get('rotation', 0))
            att['x'] = round(att.get('x', 0) + dx * math.cos(t) - dy * math.sin(t), 4)
            att['y'] = round(att.get('y', 0) + dx * math.sin(t) + dy * math.cos(t), 4)
            att['width'], att['height'] = w, h

    out = os.path.join(APP, 'static', 'assets', 'castSpine43', who)
    os.makedirs(out, exist_ok=True)
    atlas.save(os.path.join(out, 'cast_atlas.png'), optimize=True)
    sheet = {'frames': frames, 'meta': {'app': 'build_game_cast.py', 'image': 'cast_atlas.png',
             'format': 'RGBA8888', 'size': {'w': aw, 'h': ah}, 'scale': '1'}}
    json.dump(sheet, open(os.path.join(out, 'cast_atlas.json'), 'w'), indent=1)
    src_hash = hashlib.sha256(open(rig_path, 'rb').read()).hexdigest()[:16]
    rig['skeleton']['images'] = ''
    rig['wildAlchemy'] = {'prefix': cfg['prefix'], 'source': cfg['rig'], 'sourceSha256_16': src_hash}
    json.dump(rig, open(os.path.join(out, 'cast.json'), 'w'), separators=(',', ':'))
    used = sum(w * h for w, h in sizes.values())
    print(f'{who}: {len(crops)} images → atlas {aw}×{ah} ({used / (aw * ah):.0%} used), rig {src_hash}')
    return crops


def verify(who, crops):
    """The cropped rig must put every image pixel where the full-canvas rig did:
    map each crop's corners through both attachment frames and compare."""
    rig = json.load(open(os.path.join(ART, CAST[who]['rig'])))
    new = json.load(open(os.path.join(APP, 'static', 'assets', 'castSpine43', who, 'cast.json')))
    worst = 0.0
    for slot, atts in rig['skins'][0]['attachments'].items():
        for name, a in atts.items():
            b = new['skins'][0]['attachments'][slot][name]
            _, (bx, by, bx1, by1), (iw, ih) = crops[name]
            for px, py in ((bx, by), (bx1, by), (bx, by1), (bx1, by1)):
                def local(att, ox, oy, w, h):
                    u, v = px - ox - w / 2, (h / 2) - (py - oy)
                    t = math.radians(att.get('rotation', 0))
                    return att['x'] + u * math.cos(t) - v * math.sin(t), att['y'] + u * math.sin(t) + v * math.cos(t)
                p0 = local(a, 0, 0, iw, ih)
                p1 = local(b, bx, by, b['width'], b['height'])
                worst = max(worst, math.hypot(p0[0] - p1[0], p0[1] - p1[1]))
    print(f'{who}: max corner drift {worst:.4f} px')
    if worst > 0.01:
        raise SystemExit(f'{who}: crop offsets wrong')


if __name__ == '__main__':
    for who in (sys.argv[1:] or CAST):
        verify(who, build(who, CAST[who]))
