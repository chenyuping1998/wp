"""Pack the accepted r11 Dragon King / Dragon Princess layers for the app-owned 4.3 renderer.

Source of truth: new-games/sea-dragon/art/cast-layers-1105/r11/{mg,fg}/layers (built by
build_r11.sh) and the Spine 4.3 exports in r11/spine/{mg,fg}. Every Spine image must be the
same bytes as its source layer, so the game never draws an older revision than the rig.

Each 1024x1536 layer is cropped to its alpha box and packed (skyline, full resolution) into
one 2048x2048 page per character. The renderer draws the crop at (cropX, cropY) inside the
attachment's full canvas, so the rig's attachment sizes stay 1024x1536.
"""
from pathlib import Path
import hashlib, json, shutil
from PIL import Image

HERE = Path(__file__).resolve().parent
APP = HERE.parents[1]
R11 = Path('/Users/stone/stake-engine/new-games/sea-dragon/art/cast-layers-1105/r11')
PAGE = 2048
CAST = {
    'mg': ('dragon_king', 'dragonKing'),
    'fg': ('dragon_princess', 'dragonPrincess'),
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def skyline(rects):
    """Bottom-left skyline packing; rects = [(name, w, h)] already padded."""
    sky = [(0, 0, PAGE)]
    place = {}
    for name, w, h in sorted(rects, key=lambda r: (r[2], r[1]), reverse=True):
        best = None
        for i, (x, _, _) in enumerate(sky):
            if x + w > PAGE:
                continue
            top, span, j = 0, 0, i
            while span < w and j < len(sky):
                top = max(top, sky[j][1]); span += sky[j][2]; j += 1
            if span < w:
                continue
            if best is None or top + h < best[0]:
                best = (top + h, x, top)
        assert best and best[0] <= PAGE, f'atlas overflow at {name}'
        bottom, x, top = best
        place[name] = (x, top)
        new = []
        for sx, sy, sw in sky:
            a, b = sx, sx + sw
            if b <= x or a >= x + w:
                new.append((sx, sy, sw)); continue
            if a < x: new.append((a, sy, x - a))
            if b > x + w: new.append((x + w, sy, b - x - w))
        new.append((x, bottom, w)); new.sort()
        merged = []
        for s in new:
            if merged and merged[-1][1] == s[1] and merged[-1][0] + merged[-1][2] == s[0]:
                merged[-1] = (merged[-1][0], merged[-1][1], merged[-1][2] + s[2])
            else:
                merged.append(s)
        sky = merged
    return place


def build(who: str):
    stem, key = CAST[who]
    spine = R11 / 'spine' / who
    layers = R11 / who / 'layers'
    rig = json.loads((spine / f'{stem}.json').read_text())
    entries = {}
    for path in sorted((spine / 'images').glob('*.png')):
        source = layers / path.name
        assert source.exists() and sha(source) == sha(path), f'Spine image differs from r11 layer: {path.name}'
        image = Image.open(path).convert('RGBA')
        box = image.getchannel('A').getbbox()
        entries[path.stem] = (image.crop(box), box, sha(path))
    used = {name for slot in rig['skins'][0]['attachments'].values() for name in slot}
    assert used <= set(entries), f'rig needs images that are missing: {sorted(used - set(entries))}'
    place = skyline([(n, im.width + 4, im.height + 4) for n, (im, _, _) in entries.items()])
    atlas = Image.new('RGBA', (PAGE, PAGE))
    parts = {}
    for name, (image, box, digest) in entries.items():
        x, y = place[name]; x += 2; y += 2
        atlas.alpha_composite(image, (x, y))
        parts[name] = {'x': x, 'y': y, 'width': image.width, 'height': image.height,
                       'cropX': box[0], 'cropY': box[1], 'sourceSha256': digest}
    folder = APP / 'static/assets/sprites/dragonCast'; folder.mkdir(parents=True, exist_ok=True)
    out = folder / f'{who}-atlas.png'
    atlas.save(out, optimize=True)
    game = APP / 'src/game'
    (game / f'{key}Atlas.json').write_text(json.dumps({'width': PAGE, 'height': PAGE, 'parts': parts}, indent=1) + '\n')
    shutil.copy2(spine / f'{stem}.json', game / f'{key}Data.json')
    # Figure metrics in canvas pixels (y down), from the setup assembly the kit verified.
    assembled = Image.open(R11 / who / 'assembled.png').getchannel('A').getbbox()
    return {'atlas': str(out.relative_to(APP)), 'atlasSha256': sha(out), 'spine': str(spine / f'{stem}.json'),
            'spineSha256': sha(spine / f'{stem}.json'), 'layers': len(parts), 'assembledInkBox': assembled,
            'usedPixels': sum(p['width'] * p['height'] for p in parts.values())}


if __name__ == '__main__':
    manifest = {who: build(who) for who in CAST}
    (HERE / 'runtime-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    for who, m in manifest.items():
        print(who, m['layers'], 'layers ->', m['atlas'], 'ink box', m['assembledInkBox'], f"fill {m['usedPixels'] / PAGE / PAGE:.0%}")
