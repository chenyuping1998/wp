"""Validate actual delivery and shipped textures, including PSD layer roundtrip."""
from pathlib import Path
import json, hashlib
import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt
from psd_tools import PSDImage
APP=Path(__file__).resolve().parents[1]
P=APP/'design/cast_parts/base';R=APP/'static/assets/castLayers/prisoner'
m=json.loads((P/'layers.json').read_text());images={}
for k in m['order']:
 im=Image.open(P/f'{k}.png');assert im.mode=='RGBA' and im.size==(1024,2048),k
 assert (P/f'{k}.png').read_bytes()==(R/f'{k}.png').read_bytes(),k
 images[k]=im
full=Image.new('RGBA',(1024,2048))
for k in m['order']:full.alpha_composite(images[k])
assert np.array_equal(np.array(full),np.array(Image.open(P/'full.png'))),'composite differs'
assert (P/'layers.json').read_bytes()==(R/'layers.json').read_bytes(),'manifest differs'
psd=PSDImage.open(P/'prisoner.psd');assert [x.name for x in psd]==m['order']
preview=psd.composite()
assert preview.mode=='RGBA' and preview.size==full.size
assert preview.getchannel('A').tobytes()==full.getchannel('A').tobytes(),'PSD merged transparency'
for layer,k in zip(psd,m['order']):assert np.array_equal(np.array(layer.topil()),np.array(images[k])),f'PSD {k}'
body=np.array(images['body'])[:,:,3]>16;distance=distance_transform_edt(~body);ys=np.indices(body.shape)[0]
checks={}
for side in ['l','r']:
 k='arm_'+side;a=np.array(images[k])[:,:,3]>16
 elbow=next(b for b in m['layers'][0]['rig']['bones'] if b['name']=='fore_'+side)
 gap=float(distance[a&(ys>=elbow['y'])].min())
 overlap=a&body;width=int(overlap.sum(axis=1).max())
 assert gap>=48,(k,gap);assert width>=40,(k,width)
 checks[k]=dict(forearm_min_clearance_px=gap,shoulder_max_overlap_width_px=width)
head=np.array(images['head'])[:,:,3]>16
neck_overlap=np.where((head&body).any(axis=1))[0]
neck_depth=int(neck_overlap[-1]-neck_overlap[0]+1)
assert neck_depth>=30,neck_depth
box=full.getchannel('A').point(lambda v:255 if v>16 else 0).getbbox()
assert box[1]==172 and box[3]==1774,box
assert min(box[0],1024-box[2],box[1],2048-box[3])>=40
report=dict(canvas=[1024,2048],figure_box=box,baseline_alpha_threshold=16,parts=checks,neck_overlap_vertical_extent_px=neck_depth,composite='pixel-exact',psd='four layers, pixel-exact roundtrip',runtime_assets='byte-identical')
(P/'delivery-check.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
