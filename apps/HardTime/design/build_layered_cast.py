"""Pack ImageGen-produced parts, without repainting, into a common rig canvas.
Run: /Applications/anaconda3/bin/python design/build_layered_cast.py
Original generated illustrations remain in cast_parts/sample_v1.
"""
from pathlib import Path
import json, math, shutil
import numpy as np
from PIL import Image
from scipy.ndimage import label, binary_dilation, distance_transform_edt
from psd_tools import PSDImage
from psd_tools.api.layers import PixelLayer

APP=Path(__file__).resolve().parents[1]
SOURCE=APP/'design/cast_parts/sample_v1'
OUT=APP/'design/cast_parts/base'
RUNTIME=APP/'static/assets/castLayers/prisoner'
SIZE=(1024,2048)
G=(1774-172)/(1678-(161*.285+70))
TX=537-446*G
TY=1774-1678*G
# Equal x/y scaling preserves anatomical proportions. Shoulder rotation opens
# the resting forearms without stretching the texture or welding it to torso.
PARTS={
 'head':dict(file='head_generated.png',scale=.285,x=318,y=70),
 'arm_r':dict(file='arm_r_generated.png',scale=.556,x=69,y=182,pivot=(277,422),angle=8),
 'arm_l':dict(file='arm_l_generated.png',scale=.65,x=237,y=57,pivot=(622,422),angle=-10.6),
 'body':dict(file='body_v2_generated.png',scale=1,x=0,y=0),
}

def clean(im):
 a=np.asarray(im.getchannel('A'))
 labels,n=label(a>16)
 counts=np.bincount(labels.ravel());counts[0]=0
 core=labels==counts.argmax()
 # Keep anti-aliasing adjacent to the actual part, discard distant alpha dust.
 keep=binary_dilation(core,iterations=3)
 rgba=np.asarray(im).copy();rgba[~keep]=0
 return Image.fromarray(rgba)

def mapping(p):
 s=p['scale']; m=np.array([[s,0,p['x']],[0,s,p['y']],[0,0,1.]],float)
 if 'pivot' in p:
  x,y=p['pivot'];a=math.radians(p['angle']);c=math.cos(a);sn=math.sin(a)
  rot=np.array([[c,-sn,x-c*x+sn*y],[sn,c,y-sn*x-c*y],[0,0,1.]])
  m=rot@m
 return np.array([[G,0,TX],[0,G,TY],[0,0,1.]])@m

def pos(x,y):return [round(TX+x*G,5),round(TY+y*G,5)]
def armpos(key,x,y):
 p=PARTS[key];cx,cy=p['pivot'];a=math.radians(p['angle']);dx=x-cx;dy=y-cy
 return pos(cx+dx*math.cos(a)-dy*math.sin(a),cy+dx*math.sin(a)+dy*math.cos(a))
def smooth(t):
 t=max(0,min(1,t));return t*t*(3-2*t)

OUT.mkdir(parents=True,exist_ok=True);RUNTIME.mkdir(parents=True,exist_ok=True)
images={}
for key,p in PARTS.items():
 im=clean(Image.open(SOURCE/p['file']).convert('RGBA'))
 inv=np.linalg.inv(mapping(p))
 images[key]=im.transform(SIZE,Image.Transform.AFFINE,tuple(inv[:2].ravel()),Image.Resampling.BICUBIC)
 # The generated neck's lower end just touches the undershirt. Extend only the
 # already-hidden neck region by a vertical resample (no new painted pixels).
 if key=='head':
  rgba=images[key];cut=pos(0,350)[1];bottom=rgba.getchannel('A').getbbox()[3]
  strip=rgba.crop((0,int(cut),SIZE[0],bottom))
  rgba.paste((0,0,0,0),(0,int(cut),SIZE[0],SIZE[1]))
  strip=strip.resize((SIZE[0],strip.height+42),Image.Resampling.BICUBIC)
  rgba.paste(strip,(0,int(cut)))
 images[key].save(OUT/f'{key}.png')
full=Image.new('RGBA',SIZE)
for key in PARTS:full.alpha_composite(images[key])
full.save(OUT/'full.png')
box=full.getchannel('A').point(lambda v:255 if v>16 else 0).getbbox()
# Common skeleton. Anatomical left is screen right.
bones=[]
def bone(name,p,parent):
 bones.append(dict(name=name,x=p[0],y=p[1],parent=parent));return len(bones)-1
root=bone('root',pos(446,1600),-1)
hips=bone('hips',pos(446,975),root)
waist=bone('waist',pos(446,825),hips)
chest=bone('chest',pos(446,470),waist)
neck=bone('neck',pos(446,365),chest)
head=bone('head',pos(446,292),neck)
for side,elbow,wrist in [('l',(679,655),(704,905)),('r',(212,655),(178,905))]:
 key='arm_'+side;parent=bone(key,pos(*PARTS[key]['pivot']),chest)
 ep=armpos(key,*elbow);wp=armpos(key,*wrist)
 fore=bone('fore_'+side,ep,parent)
 axis=np.array(wp)-np.array(ep);axis/=np.linalg.norm(axis);bones[fore]['axis']=axis.tolist()
names=[b['name'] for b in bones]
rigs={}
for key,im in images.items():
 bbox=im.getchannel('A').getbbox()
 x0,y0,x1,y1=bbox
 x0=max(0,x0-4);y0=max(0,y0-4);x1=min(SIZE[0],x1+4);y1=min(SIZE[1],y1+4)
 cols=max(4,math.ceil((x1-x0)/20));rows=max(4,math.ceil((y1-y0)/20))
 verts=[];weights=[];tris=[]
 for j in range(rows+1):
  for i in range(cols+1):
   x=x0+(x1-x0)*i/cols;y=y0+(y1-y0)*j/rows;verts.append([x,y]);w=[0.]*len(bones)
   if key.startswith('arm_'):
    side=key[-1];ep=bones[names.index('fore_'+side)]
    # Blend only around elbow; fingers fully owned by forearm.
    t=smooth((y-ep['y']+65)/130)
    w[names.index(key)]=1-t;w[names.index('fore_'+side)]=t
   elif key=='head':
    # Hidden lower neck follows torso; face and skull stay rigid together.
    t=smooth((pos(0,355)[1]-y)/90)
    w[chest]=1-t;w[head]=t
   else:
    # Feet remain root-owned. Upper torso follows chest exactly so both
    # shoulder attachments and collar share the same transform at their seam.
    if y<pos(0,620)[1]:w[chest]=1
    elif y<pos(0,850)[1]:
     t=smooth((y-pos(0,620)[1])/(230*G));w[chest]=1-t;w[waist]=t
    elif y<pos(0,1100)[1]:
     t=smooth((y-pos(0,850)[1])/(250*G));w[waist]=1-t;w[hips]=t
    else:
     t=smooth((y-pos(0,1100)[1])/(350*G));w[hips]=1-t;w[root]=t
   # Match runtime's sparse cutoff without losing weight mass at boundaries.
   w=[v if v>.002 else 0. for v in w];total=sum(w)
   weights.append([v/total for v in w])
 for j in range(rows):
  for i in range(cols):
   a=j*(cols+1)+i;b=a+1;c=a+cols+1;d=c+1;tris.extend([[a,b,c],[b,d,c]])
 rigs[key]=dict(size=list(SIZE),figure_box=list(box),verts=verts,tris=tris,weights=weights,bones=bones)
manifest=dict(version=1,size=list(SIZE),figure_box=list(box),order=list(PARTS),layers=[dict(name=k,texture=f'{k}.png',rig=rigs[k]) for k in PARTS],anatomical_sides=True)
(OUT/'layers.json').write_text(json.dumps(manifest,separators=(',',':')))
psd=PSDImage.new('RGBA',SIZE)
for key in PARTS:PixelLayer.frompil(images[key],psd,key)
# psd-tools' automatic preview writer emits three channels for this RGBA
# document. Write the standard white-matted merged RGB + transparency channel
# explicitly, with a negative layer count marking merged transparency.
matte=Image.new('RGBA',SIZE,(255,255,255,255));matte.alpha_composite(full)
channels=list(matte.convert('RGB').split())+[full.getchannel('A')]
psd._record.image_data.set_data([c.tobytes() for c in channels],psd._record.header)
psd._record.layer_and_mask_information.layer_info.layer_count=-len(PARTS)
psd._updated=False
psd.save(OUT/'prisoner.psd')
# Verify PSD layers round-trip without losing position/transparency.
opened=PSDImage.open(OUT/'prisoner.psd')
assert opened.composite().size==SIZE
assert opened.composite().getchannel('A').tobytes()==full.getchannel('A').tobytes()
assert [p.name for p in opened]==list(PARTS)
for layer,key in zip(opened,PARTS):
 assert np.array_equal(np.asarray(layer.topil()),np.asarray(images[key])),key
for name in ['head.png','arm_r.png','arm_l.png','body.png','full.png','layers.json']:
 shutil.copy2(OUT/name,RUNTIME/name)
report=dict(canvas=SIZE,figure_box=box,source_tool='built-in image_gen',psd_roundtrip='exact',normalization='uniform affine per part; neck underlap extension',layers={k:dict(alpha_box=im.getchannel('A').getbbox()) for k,im in images.items()})
(OUT/'art-check.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
