"""Retarget a newly painted full character to the existing Spine acting timeline.

The body painting stays continuous while torso/root motion and all painted head
expressions still animate. This avoids old cut polygons splitting new clothing.
"""
from pathlib import Path
import json
import shutil
import sys
from PIL import Image


def build(folder: Path, cast: str) -> None:
    cut = folder / f'{cast}_cutout'
    preview = folder / f'{cast}_preview_spine'
    out = folder / f'{cast}_rigid_spine'
    out.mkdir(exist_ok=True)
    meta = json.loads((cut / 'layers.json').read_text())
    width, height = meta['canvas']
    full = Image.open(folder / f'{cast}_full.png').convert('RGBA').resize((width, height), Image.Resampling.LANCZOS)
    head_meta = next(x for x in meta['layers'] if x['name'] == 'head_2_face')
    head = Image.open(cut / 'head_2_face.png').convert('RGBA')
    body = full.copy()
    body_alpha = body.getchannel('A')
    head_alpha = Image.new('L', (width, height), 0)
    head_alpha.paste(head.getchannel('A'), (head_meta['x'], head_meta['y']))
    body_alpha.paste(0, (0, 0, width, height), head_alpha)
    body.putalpha(body_alpha)
    body.save(out / 'body_full.png')

    atlas_image = Image.open(preview / 'monkey.png').convert('RGBA')
    x, y = 2, atlas_image.height + 2
    atlas_new = Image.new('RGBA', (atlas_image.width, y + height + 2), (0, 0, 0, 0))
    atlas_new.alpha_composite(atlas_image, (0, 0))
    atlas_new.alpha_composite(body, (x, y))
    atlas_new.save(out / 'monkey.png')
    atlas = (preview / 'monkey.atlas').read_text()
    atlas = atlas.replace(f'size:{atlas_image.width},{atlas_image.height}', f'size:{atlas_new.width},{atlas_new.height}', 1)
    atlas += f'body_full\nbounds:{x},{y},{width},{height}\noffsets:0,0,{width},{height}\nindex:-1\n'
    (out / 'monkey.atlas').write_text(atlas)

    rig = json.loads((preview / 'monkey.json').read_text())
    skin = rig['skins'][0]['attachments']
    for slot in rig['slots']:
        if slot['name'] not in ('torso_0_trunk', 'head_2_face'):
            slot.pop('attachment', None)
            skin.pop(slot['name'], None)
    # Full canvas center in Spine space is (width/2-rootX, rootY-height/2).
    # Torso's world setup position comes from the rooted bone chain.
    by_name = {b['name']: b for b in rig['bones']}
    def world(name):
        b = by_name[name]
        px, py = world(b['parent']) if b.get('parent') else (0, 0)
        return px + b.get('x', 0), py + b.get('y', 0)
    tx, ty = world('torso')
    hx, hy = world('head')
    root = json.loads((cut / 'rig.json').read_text())['root']
    cx = width / 2 - root[0]
    cy = root[1] - height / 2
    skin['torso_0_trunk'] = {'body_full': {
        'type': 'region', 'path': 'body_full', 'x': cx - tx, 'y': cy - ty,
        'width': width, 'height': height,
    }}
    next(s for s in rig['slots'] if s['name'] == 'torso_0_trunk')['attachment'] = 'body_full'
    head_center_x = head_meta['x'] + head_meta['w'] / 2 - root[0]
    head_center_y = root[1] - head_meta['y'] - head_meta['h'] / 2
    for name, attachment in skin['head_2_face'].items():
        path = attachment.get('path', name)
        attachment.clear()
        attachment.update({'type': 'region', 'path': path,
                           'x': head_center_x - hx, 'y': head_center_y - hy,
                           'width': head_meta['w'], 'height': head_meta['h']})
    for animation in rig['animations'].values():
        # Keep the redrawn neck connected to its painted collar. The parent
        # torso still carries the head through the original body performance.
        animation.get('bones', {}).pop('head', None)
        if 'slots' in animation:
            animation['slots'] = {name: keys for name, keys in animation['slots'].items()
                                  if name in ('torso_0_trunk', 'head_2_face')}
    (out / 'monkey.json').write_text(json.dumps(rig, separators=(',', ':')))
    print(f'{folder.parent.parent.parent.name} {cast}: rigid body atlas {atlas_new.width}x{atlas_new.height}, pivot {cx-tx:.1f},{cy-ty:.1f}')


if __name__ == '__main__':
    build(Path(sys.argv[1]), sys.argv[2])
