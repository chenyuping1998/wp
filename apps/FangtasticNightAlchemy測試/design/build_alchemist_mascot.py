"""Skin the alchemist portrait to Boom's existing 25-bone Spine animation rig.

The high-resolution generated painting remains in design/source.  This script
also writes an editable PSD with separated reference parts and a display master.
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw
from psd_tools import PSDImage
from psd_tools.api.layers import PixelLayer

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
import alchemist_flow as flow  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'design/source/alchemist_mascot_v1.png'
OUT = ROOT / 'static/assets/spines/goBananasMonkey'
IMAGE = OUT / 'alchemy_body.png'
ATLAS = OUT / 'monkey.atlas'
SKELETON = OUT / 'monkey.json'
W, H = 560, 884

portrait = Image.open(SOURCE).convert('RGBA')
body = portrait.resize((W, H), Image.Resampling.LANCZOS)
body.save(IMAGE)

# Reuse Boom's reserved prop atlas rectangle so its throw slot displays a
# reagent bundle while keeping all existing attachment timing intact.
prop_source = ROOT / 'static/assets/sprites/goBanalchemySymbols/reagent_prop.png'
if prop_source.exists():
    prop = Image.open(prop_source).convert('RGBA')
    prop.thumbnail((672, 618), Image.Resampling.LANCZOS)
    prop_region = Image.new('RGBA', (672, 618))
    prop_region.alpha_composite(prop, ((672 - prop.width) // 2, (618 - prop.height) // 2))
    atlas_page = Image.open(OUT / 'monkey.png').convert('RGBA')
    atlas_page.paste(prop_region, (2, 2))
    atlas_page.save(OUT / 'monkey.png')

# Keep an exact composite plus independently editable part references.  The
# source painting is seamless; showing all cuts at once would double pixels at
# overlapping shoulder and waist regions, so part layers start hidden.
psd = PSDImage.new('RGBA', (W, H), color=(0, 0, 0, 0))
parts = {
    'head': (0, 0, W, 284),
    'left arm': (0, 170, 245, 680),
    'right arm': (315, 170, W, 680),
    'torso and coat': (95, 215, 465, 670),
    'left leg': (58, 505, 295, H),
    'right leg': (275, 505, 535, H),
}
for name, box in parts.items():
    cut = Image.new('RGBA', (W, H))
    cut.paste(body.crop(box), box)
    layer = PixelLayer.frompil(cut, psd, name=name)
    layer.visible = False
    psd.append(layer)
psd.append(PixelLayer.frompil(body, psd, name='Alchemist monkey - finished master'))
psd.save(ROOT / 'design/source/GoBanalchemy_alchemist.psd')

atlas = ATLAS.read_text(encoding='utf-8')
if '\nalchemy_body.png\n' not in atlas:
    atlas += f'\nalchemy_body.png\nsize:{W},{H}\nformat:RGBA8888\nfilter:Linear,Linear\nrepeat:none\nalchemy_body\nbounds:0,0,{W},{H}\noffsets:0,0,{W},{H}\nindex:-1\n'
ATLAS.write_text(atlas, encoding='utf-8')

rig = json.loads(SKELETON.read_text(encoding='utf-8'))
# the body mesh, its accessory bones, their physics and flutter (alchemist_flow.py)
sk = flow.Skeleton(rig, W, H)
sk.add_bones()
body_mesh = flow.body_mesh(sk)
flow.add_motion(rig)

for slot in rig['slots']:
    if slot['name'] != 'dynamite':
        slot.pop('attachment', None)
rig['slots'] = [slot for slot in rig['slots'] if slot['name'] != 'alchemy_body']
prop_slot = next((i for i, slot in enumerate(rig['slots']) if slot['name'] == 'dynamite'), len(rig['slots']))
rig['slots'].insert(prop_slot, {'name': 'alchemy_body', 'bone': 'root', 'attachment': 'alchemy_body'})
rig['skins'][0]['attachments']['alchemy_body'] = {'alchemy_body': body_mesh}
SKELETON.write_text(json.dumps(rig, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(f"Built alchemist PSD and weighted Spine mesh: {len(body_mesh['uvs']) // 2} vertices, {len(body_mesh['triangles']) // 3} triangles.")
