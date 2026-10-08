"""Export the two flat-art cuts as 24 named, full-canvas delivery layers.

The runtime Spine atlas keeps its compact trimmed cut in design/source/{mg,fg}.
This exporter makes the art handoff promised by ART_BRIEF.md §1: every layer is
560x912 RGBA, with optional decoration slots present even when empty. Facial
accessories and fists are separated from the compact cut for future re-rigging.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parent.parent
SIZE = (560, 912)
HEAD = [f'head_{i}_{s}' for i, s in enumerate(['hair', 'hair', 'face', 'ear', 'hat', 'decoration'])]
TORSO = ['torso_0_trunk'] + [f'torso_{i}_decoration' for i in range(1, 6)]
LIMBS = [f'{side}_arm_{i}_{s}' for side in ('left', 'right') for i, s in enumerate(['upper_arm', 'forearm', 'hand'])]
LEGS = [f'{side}_leg_{i}_{s}' for side in ('left', 'right') for i, s in enumerate(['thigh', 'calf', 'foot'])]
NAMES = HEAD + TORSO + LIMBS + LEGS
assert len(NAMES) == 24


def full(src: Path, spec: dict):
    im = Image.new('RGBA', SIZE)
    im.alpha_composite(Image.open(src / spec['file']).convert('RGBA'), (spec['x'], spec['y']))
    return np.array(im)


def split_head(px, cast):
    h, w = px.shape[:2]
    yy, xx = np.indices((h, w))
    # Coordinates are on the MIRRORED delivery image (both figures face the board).
    if cast == 'mg':
        hat = yy < 119
        mask = (yy >= 120) & (yy < 189) & (xx > 155) & (xx < 403) & (px[..., :3].mean(-1) < 120)
        ears = (yy >= 110) & (yy < 214) & ((xx < 192) | (xx > 370))
        hair0 = (xx < 250) & (yy >= 188)
        hair1 = (xx >= 250) & (yy >= 188)
    else:
        hat = yy < 112  # flight goggles on the forehead
        mask = (yy >= 152) & (yy < 212) & (xx < 185)  # gum bubble
        ears = (yy >= 105) & (yy < 225) & ((xx < 174) | (xx > 392))
        hair0 = (xx < 215) & (yy >= 110)
        hair1 = (xx > 360) & (yy >= 110)
    chosen = np.zeros((h, w), bool)
    out = {}
    for name, region in [
        ('head_4_hat', hat), ('head_5_decoration', mask), ('head_3_ear', ears),
        ('head_0_hair', hair0), ('head_1_hair', hair1),
    ]:
        take = region & ~chosen & (px[..., 3] > 0)
        layer = np.zeros_like(px); layer[take] = px[take]
        out[name] = layer; chosen |= take
    layer = np.zeros_like(px); layer[~chosen] = px[~chosen]
    out['head_2_face'] = layer
    return out


def split_arm(px, cast):
    yy = np.indices(px.shape[:2])[0]
    wrist = 550 if cast == 'mg' else 565
    fore = np.zeros_like(px); hand = np.zeros_like(px)
    fore[yy < wrist + 16] = px[yy < wrist + 16]
    hand[yy >= wrist - 16] = px[yy >= wrist - 16]
    return fore, hand


def export(cast):
    src = APP / 'design/source' / cast
    dest = APP / 'design/cast_delivery' / f'{cast}_layers'
    dest.mkdir(parents=True, exist_ok=True)
    meta = json.loads((src / 'layers.json').read_text())
    pieces = {x['name']: full(src, x) for x in meta['layers']}
    out = {name: np.zeros((SIZE[1], SIZE[0], 4), np.uint8) for name in NAMES}
    for name, px in pieces.items():
        if name == 'head_2_face':
            out.update(split_head(px, cast))
        elif name.endswith('_arm_2_hand'):
            side = name.split('_')[0]
            out[f'{side}_arm_1_forearm'], out[name] = split_arm(px, cast)
        else:
            out[name] = px
    for name in NAMES:
        Image.fromarray(out[name]).save(dest / f'{name}.png')
    info = {'canvas': list(SIZE), 'layers': NAMES, 'nonempty': [n for n in NAMES if out[n][..., 3].max() > 0],
            'empty_decorations': [n for n in NAMES if out[n][..., 3].max() == 0]}
    assert all('decoration' in n for n in info['empty_decorations']), info['empty_decorations']
    (dest / 'manifest.json').write_text(json.dumps(info, indent=2) + '\n')
    # The two cuts use the same original visual pixels; the delivery just changes layer layout.
    print(cast, len(NAMES), 'layers,', len(info['nonempty']), 'with art,', len(info['empty_decorations']), 'empty decorations')


if __name__ == '__main__':
    export('mg'); export('fg')
