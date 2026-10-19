"""Repaint Boom's PSD cutout rig without changing its bone hierarchy.

Run with the bundled Python and psd_tools from math-sdk/env/Lib/site-packages.
Image generation paints the source; this script only crops, packs and binds it.
"""
import copy
import json
from collections import deque
from pathlib import Path

from PIL import Image
import numpy as np
from psd_tools import PSDImage
from psd_tools.api.layers import PixelLayer

ROOT = Path(__file__).resolve().parents[1]
BOOM = ROOT.parent / 'GoBoomana'
SRC = ROOT / 'design/source/ninja_reskin'
OUT = ROOT / 'static/assets/spines/goBananinjaMascot'
PAINT = Image.open(SRC / 'ninja_atlas_generated.png').convert('RGBA')
HEAD_PAINT = Image.open(SRC / 'ninja_head_v2.png').convert('RGBA')
META = json.loads((BOOM / 'design/source/monkey/layers.json').read_text())
# Explicit crop bounds are measured on the generated sheet, not inferred by
# scaling the original atlas: ImageGen can change whitespace between pieces.
BOXES = {
    'torso_0_trunk': (8,543,373,971),
    'torso_1_decoration': (235,964,498,1201),
    'left_arm_0_upper_arm': (621,950,781,1185),
    'left_leg_0_thigh': (140,1208,294,1419),
    'left_leg_1_calf': (4,1208,140,1418),
    'left_leg_2_foot': (283,1415,395,1545),
    'right_arm_0_upper_arm': (289,1209,401,1410),
    'right_leg_0_thigh': (401,1208,545,1414),
    'right_leg_1_calf': (545,1204,663,1418),
    'right_leg_2_foot': (481,1422,648,1538),
    'left_arm_1_forearm': (663,1421,753,1511),
}
# The painted hood includes a complete face, so its original hat/ear/jaw
# overlays must not also show a second face. All original bones remain.
HIDDEN = {'head_0_hair','head_1_hair','head_3_ear','head_4_hat',
          'torso_2_decoration','torso_3_decoration',
          'torso_4_decoration','torso_5_decoration'}
pieces = {}

def clean_piece(im):
    """Discard neighboring sprite flecks accidentally caught by a crop."""
    pixels = np.array(im)
    mask = pixels[:,:,3] > 24
    seen = np.zeros(mask.shape, bool)
    largest = []
    h,w = mask.shape
    for yy,xx in zip(*np.where(mask)):
        if seen[yy,xx]:
            continue
        queue = deque([(int(xx),int(yy))])
        seen[yy,xx] = True
        component = []
        while queue:
            x,y = queue.popleft()
            component.append((y,x))
            for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0<=nx<w and 0<=ny<h and mask[ny,nx] and not seen[ny,nx]:
                    seen[ny,nx] = True
                    queue.append((nx,ny))
        if len(component)>len(largest):
            largest=component
    keep=np.zeros(mask.shape,bool)
    for y,x in largest:
        keep[y,x]=True
    pixels[:,:,3][~keep]=0
    return Image.fromarray(pixels)

layout = copy.deepcopy(META)
for part in layout['layers']:
    name = part['name']
    if name in HIDDEN:
        im = Image.new('RGBA',(part['w'],part['h']))
    elif name == 'head_2_face':
        # The previous 289x202 painting was stretched to 300x330. Preserve
        # the new head's aspect ratio and anchor its chin at Boom's neck.
        head = clean_piece(HEAD_PAINT)
        head = head.crop(head.getchannel('A').getbbox())
        source_ratio = head.width / head.height
        head.thumbnail((280,280),Image.Resampling.LANCZOS)
        assert abs(head.width/head.height-source_ratio)<0.015
        part.update(x=round(284-head.width/2),y=300-head.height,w=head.width,h=head.height)
        im = head
    elif name == 'head_5_decoration':
        # Trim residual PSD haze, then place the banana end inside the new
        # mouth instead of below the lower lip at Boom's old mouth position.
        banana = clean_piece(Image.open(BOOM / 'design/source/monkey' / part['file']).convert('RGBA'))
        box = banana.getchannel('A').getbbox()
        im = banana.crop(box)
        part.update(x=part['x']+box[0]+18,y=part['y']+box[1]-17,w=im.width,h=im.height)
    elif name in BOXES:
        im = clean_piece(PAINT.crop(BOXES[name])).resize((part['w'],part['h']),Image.Resampling.LANCZOS)
    else:
        # Preserve the original exposed gorilla forearms, hands and banana.
        im = Image.open(BOOM / 'design/source/monkey' / part['file']).convert('RGBA')
    pieces[name] = im

# The waist wrap and its tails belong ABOVE the trousers. Boom's miner shirt
# was behind the thighs; keeping that order cut through the new red sash.
trunk = next(p for p in layout['layers'] if p['name']=='torso_0_trunk')
layout['layers'].remove(trunk)
layout['layers'].insert(next(i for i,p in enumerate(layout['layers']) if p['name']=='left_arm_1_forearm'),trunk)
shoulder_star = clean_piece(PAINT.crop((33,9,582,513)))
shoulder_star.thumbnail((110,110),Image.Resampling.LANCZOS)
SHOULDER = (37,148)
LIP_BOX = (300,216,326,230)
head_layer = next(p for p in layout['layers'] if p['name']=='head_2_face')
lip = pieces['head_2_face'].crop(tuple(v-head_layer['x' if i%2==0 else 'y'] for i,v in enumerate(LIP_BOX)))

original_psd = ROOT.parent / 'GoBananeon霓虹/design/source/monkey/boom_original.psd'
psd = PSDImage.open(original_psd)
names = [layer.name for layer in psd]
for layer in list(psd):
    psd.remove(layer)
assembled = Image.new('RGBA',tuple(META['canvas']))
for part in layout['layers']:
    im = pieces[part['name']]
    if part['name']=='torso_0_trunk':
        # The down-right blade is hidden by the shoulder cloth: a playful
        # costume gag, with the original holding hand now empty.
        psd.append(PixelLayer.frompil(shoulder_star,psd,name='Shoulder jade shuriken',top=SHOULDER[1],left=SHOULDER[0]))
        assembled.alpha_composite(shoulder_star,SHOULDER)
    psd.append(PixelLayer.frompil(im, psd, name=names[part['z']], top=part['y'], left=part['x']))
    assembled.alpha_composite(im,(part['x'],part['y']))
    if part['name']=='head_5_decoration':
        psd.append(PixelLayer.frompil(lip,psd,name='Lower lip over bitten banana',top=LIP_BOX[1],left=LIP_BOX[0]))
        assembled.alpha_composite(lip,LIP_BOX[:2])
    im.save(SRC / part['file'])
psd.save(SRC / 'GoBananinja_shinobi.psd')
assembled.save(SRC / 'ninja_assembled.png')
(SRC / 'layers.json').write_text(json.dumps(layout,indent=2))

rig = json.loads((BOOM / 'static/assets/spines/goBananasMonkey/monkey.json').read_text())
source_bones = copy.deepcopy(rig['bones'])
for slot in rig['slots']:
    if slot['name'] in HIDDEN:
        slot.pop('attachment',None)
# Fit a full hood/face cutout on the existing head bone; the rest of the rig
# keeps Boom's original meshes, joints, weights, animation curves and physics.
rig['skins'][0]['attachments']['head_2_face'] = {'head_2_face': {
    'x': head_layer['x']+pieces['head_2_face'].width/2-283,
    'y': 296-(head_layer['y']+pieces['head_2_face'].height/2),
    'width':pieces['head_2_face'].width, 'height':pieces['head_2_face'].height,
}}
trunk_slot = next(s for s in rig['slots'] if s['name']=='torso_0_trunk')
rig['slots'].remove(trunk_slot)
waist_index=next(i for i,s in enumerate(rig['slots']) if s['name']=='left_arm_1_forearm')
rig['slots'].insert(waist_index,trunk_slot)
rig['slots'].insert(waist_index,{'name':'shoulder_shuriken','bone':'armL','attachment':'shoulder_shuriken'})
rig['skins'][0]['attachments']['shoulder_shuriken']={'shoulder_shuriken':{
    'path':'dynamite','x':SHOULDER[0]+shoulder_star.width/2-106,
    'y':242-(SHOULDER[1]+shoulder_star.height/2),
    'width':shoulder_star.width,'height':shoulder_star.height,
}}
next(s for s in rig['slots'] if s['name']=='dynamite').pop('attachment',None)
# The new face is a single head cutout, so the banana and lip overlay must
# follow that same head transform. The old jaw/banana bone stays in the rig.
banana_layer=next(p for p in layout['layers'] if p['name']=='head_5_decoration')
next(s for s in rig['slots'] if s['name']=='head_5_decoration')['bone']='head'
rig['skins'][0]['attachments']['head_5_decoration']={'head_5_decoration':{
    'x':banana_layer['x']+banana_layer['w']/2-283,
    'y':296-(banana_layer['y']+banana_layer['h']/2),
    'width':banana_layer['w'],'height':banana_layer['h'],
}}
rig['slots'].append({'name':'mouth_grip','bone':'head','attachment':'mouth_grip'})
rig['skins'][0]['attachments']['mouth_grip']={'mouth_grip':{
    'x':(LIP_BOX[0]+LIP_BOX[2])/2-283,
    'y':296-(LIP_BOX[1]+LIP_BOX[3])/2,
    'width':lip.width,'height':lip.height,
}}
rig['animations']['dance'] = copy.deepcopy(rig['animations']['cheer'])
rig['animations']['slash'] = copy.deepcopy(rig['animations']['throwit'])
rig['animations']['scatter_slash'] = copy.deepcopy(rig['animations']['chestbeat'])
# The shoulder gag stays embedded during every gesture and throw.
for animation in rig['animations'].values():
    animation.get('slots',{}).pop('dynamite',None)
assert rig['bones'] == source_bones
from polish_ninja_motion import polish
polish(rig,pieces,layout)
assert rig['bones'][:len(source_bones)] == source_bones
from ninja_strap_motion import STRAPS
(SRC / 'strap_manifest.json').write_text(json.dumps([
    dict(name=name,slot=slot,parent=parent,root=root,tip=tip)
    for name,slot,parent,root,tip,*_ in STRAPS
],indent=2),encoding='utf-8')

pieces['dynamite'] = PAINT.crop((33,9,582,513))
pieces['mouth_grip'] = lip
atlas_image=Image.new('RGBA',(1024,2048))
atlas=['ninja.png','size:1024,2048','format:RGBA8888','filter:Linear,Linear','repeat:none']
x=y=2
row=0
for name,im in pieces.items():
    if x+im.width+2>1024:
        x=2; y+=row+4; row=0
    atlas_image.alpha_composite(im,(x,y))
    atlas += [name,f'bounds:{x},{y},{im.width},{im.height}',f'offsets:0,0,{im.width},{im.height}','index:-1']
    x+=im.width+4; row=max(row,im.height)
assert y+row<2048
atlas_image.save(OUT / 'ninja.png')
(OUT / 'ninja.atlas').write_text('\n'.join(atlas)+'\n')
(OUT / 'ninja.json').write_text(json.dumps(rig,separators=(',',':')))
print('Saved editable PSD;',len(source_bones),'original body bones unchanged,',len(rig['bones'])-len(source_bones),'cloth bones added.')
