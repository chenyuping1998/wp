"""Assemble imagegen-painted parts, preserve alpha, and export aligned editable art.

Only crop, proportional placement and layer separation happen here. No artwork
is procedurally painted. Original generated images and exact prompts are kept.
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFont
from psd_tools import PSDImage
from psd_tools.api.layers import PixelLayer
import numpy as np
import json
import math
import cv2

APP=Path(__file__).resolve().parent.parent
ROOT=APP/'design/source/medusagaze/cast'
SRC=ROOT/'generated'; LAYERS=ROOT/'medusa_layers'; LAYERS.mkdir(exist_ok=True)
W,H=1024,2048
images={}; specs={}; order=[]
def alpha_box(im,cut=16):
    return im.getchannel('A').point(lambda a:255 if a>cut else 0).getbbox()
def source(name,box=None):
    im=Image.open(SRC/name).convert('RGBA')
    return im.crop(box) if box else im
def cut_cell(name,cols,rows,index):
    im=source(name); cw=im.width/cols;ch=im.height/rows;x=index%cols;y=index//cols
    return im.crop((round(x*cw),round(y*ch),round((x+1)*cw),round((y+1)*ch)))
def isolated_parts(name,count):
    im=source(name); alpha=np.array(im.getchannel('A'));n,labels,stats,centers=cv2.connectedComponentsWithStats((alpha>128).astype(np.uint8),8)
    ids=sorted(range(1,n),key=lambda i:stats[i,cv2.CC_STAT_AREA],reverse=True)[:count]
    ids=sorted(ids,key=lambda i:centers[i,1]); ordered=[]
    for row in range(count//3):ordered.extend(sorted(ids[row*3:row*3+3],key=lambda i:centers[i,0]))
    return [im.crop((max(0,stats[i,0]-3),max(0,stats[i,1]-3),min(im.width,stats[i,0]+stats[i,2]+3),min(im.height,stats[i,1]+stats[i,3]+3))) for i in ordered]
def layer(name,im,box,bone,chain=None,flip=False,angle=0,align=(.5,.5)):
    im=im.crop(alpha_box(im));
    if flip: im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if angle: im=im.rotate(angle,Image.Resampling.BICUBIC,expand=True)
    x,y,bw,bh=box; scale=min(bw/im.width,bh/im.height)
    im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.LANCZOS)
    px=round(x+(bw-im.width)*align[0]);py=round(y+(bh-im.height)*align[1])
    canvas=Image.new('RGBA',(W,H));canvas.alpha_composite(im,(px,py))
    images[name]=canvas; specs[name]={'bone':bone,'chain':chain,'box':[px,py,im.width,im.height]}; order.append(name)
    return specs[name]['box']

# Tail remains continuous; five separately weighted controls avoid hinge seams.
layer('tail',source('tail_original.png'),(40,1110,950,890),'tail_anchor','tail')
layer('hair_back',source('hair_back.png'),(115,35,800,800),'head')

# Arms are measured on this drawing, not inherited from a mascot template.
arm_joints={
 'front':{'source':[(600,150),(480,445),(275,710)],'shoulder':(385,760),'cell':0},
 'back':{'source':[(920,150),(1045,445),(1245,720)],'shoulder':(660,790),'cell':1},
}
for side in ['back','front']:
    item=arm_joints[side]; im=source('arms_original.png'); arr=np.array(im)
    shoulder,elbow,wrist=[np.array(p,dtype=float) for p in item['source']]
    yy,xx=np.indices(arr.shape[:2]); d=wrist-elbow; projection=(xx-wrist[0])*d[0]+(yy-wrist[1])*d[1]
    arr[:,:,3]=np.where((projection>8*np.linalg.norm(d))|((xx<768) if side=='back' else (xx>=768)),0,arr[:,:,3])
    im=Image.fromarray(arr)
    scale=.50; sx,sy=item['shoulder']; px=sx-shoulder[0]*scale;py=sy-shoulder[1]*scale
    scaled=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(W,H));canvas.alpha_composite(scaled,(round(px),round(py)))
    name='arm_'+side;images[name]=canvas;specs[name]={'bone':'upper_'+side,'chain':'arm_'+side};order.append(name)
    item['world']=[[round(px+p[0]*scale,3),round(py+p[1]*scale,3)] for p in [shoulder,elbow,wrist]]

layer('body',source('torso_original.png'),(332,602,400,640),'chest')
for i,side in enumerate(['left','right']):
    im=source('skirt_original.png'); x0=0 if i==0 else im.width//2
    piece=im.crop((x0,round(im.height*.65),x0+im.width//2,im.height))
    layer('chain_'+side,piece,((350 if i==0 else 575),1190,150,110),'chain_'+side)
for i,name in enumerate(['left','front','right']):
    im=source('skirt_original.png'); cw=im.width/3
    piece=im.crop((round(i*cw),0,round((i+1)*cw),round(im.height*.65)))
    boxes=[(265,1170,230,330),(400,1190,245,390),(620,1180,205,310)]
    layer('skirt_'+name,piece,boxes[i],'skirt_'+name)

# A full registered cell is retained for expression swaps; no per-face auto-fit.
baseface=cut_cell('faces_a.png',3,2,0) if (SRC/'faces_a.png').exists() else source('head_clean.png')
headbox=layer('face_idle',baseface,(340,265,355,410),'head')
def gem(im):
    a=np.array(im);yy=np.indices(a.shape[:2])[0]
    m=((a[:,:,2].astype(float)>a[:,:,0]*1.3)&(a[:,:,2].astype(float)>a[:,:,1]*1.10)&(a[:,:,2]>100)&(a[:,:,3]>128)&(yy<im.height*.45)).astype(np.uint8)
    n,labels,stats,centers=cv2.connectedComponentsWithStats(m,8);idx=max(range(1,n),key=lambda i:stats[i,cv2.CC_STAT_AREA])
    return centers[idx],stats[idx,cv2.CC_STAT_HEIGHT]
basecrop=baseface.crop(alpha_box(baseface));basegem,baseheight=gem(basecrop)
baseScale=headbox[2]/basecrop.width;gemWorld=np.array(headbox[:2])+basegem*baseScale
face_defs=[('face_smug','faces_a.png',3,2,1),('face_peek','faces_a.png',3,2,2),('face_gaze','faces_a.png',3,2,3),('face_annoyed','faces_a.png',3,2,4),('face_shock','faces_a.png',3,2,5),('face_laugh','faces_b.png',2,2,0),('face_cry_happy','faces_b.png',2,2,1),('face_blink','faces_b.png',2,2,2),('face_talk','faces_b.png',2,2,3)]
for name,file,cols,rows,index in face_defs:
    im=source('face_gaze.png') if name=='face_gaze' and (SRC/'face_gaze.png').exists() else cut_cell(file,cols,rows,index) if (SRC/file).exists() else source('head_clean.png')
    crop=im.crop(alpha_box(im));landmark,height=gem(crop);scale=baseScale*baseheight/height
    resized=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.LANCZOS)
    px,py=gemWorld-landmark*scale;canvas=Image.new('RGBA',(W,H));canvas.alpha_composite(resized,(round(px),round(py)))
    images[name]=canvas;specs[name]={'bone':'head','chain':None,'registration':'sapphire landmark; uniform scale and translation only'}

snake_boxes=[(420,10,180,315),(240,100,185,305),(610,100,195,315),(105,250,185,300),(765,270,185,295),(165,435,165,260),(665,410,180,280),(245,555,150,235),(720,555,160,250)]
snake_parts=isolated_parts('snakes_original.png',9)
for i,box in enumerate(snake_boxes):
    # A closed-mouth original is reused for no.6 so the final nine are 5 open + 4 closed.
    source_index=8 if i==5 else i
    im=snake_parts[source_index]
    layer(f'snake_{i+1}',im,box,f'snake_{i+1}_root',f'snake_{i+1}')

layer('glasses',source('glasses_original.png'),(305,360,400,200),'glasses')
images['glasses']=images['glasses'].rotate(20,Image.Resampling.BICUBIC,center=(500,460))
for index,gesture in enumerate(['open','point','pinch']):
    im=cut_cell('hands_original.png',3,1,index)
    anchor=[(630,220),(680,390),(675,500)][index]; scale=.18
    wx,wy=arm_joints['front']['world'][2];canvas=Image.new('RGBA',(W,H));scaled=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    canvas.alpha_composite(scaled,(round(wx-anchor[0]*scale),round(wy-anchor[1]*scale)))
    name='hand_front_'+gesture;images[name]=canvas;specs[name]={'bone':'hand_front','chain':None,'box':list(alpha_box(canvas))};order.append(name)
    if gesture!='open': order.remove('hand_front_'+gesture)
# Rear hand is retained from its own source arm, including all five fingers.
im=source('arms_original.png'); arr=np.array(im); yy,xx=np.indices(arr.shape[:2])
elbow=np.array(arm_joints['back']['source'][1]);wrist=np.array(arm_joints['back']['source'][2]);d=wrist-elbow
arr[:,:,3]=np.where(((xx-wrist[0])*d[0]+(yy-wrist[1])*d[1]<-12*np.linalg.norm(d))|(xx<768),0,arr[:,:,3])
item=arm_joints['back'];sx,sy=item['shoulder'];px=sx-item['source'][0][0]*.5;py=sy-item['source'][0][1]*.5
canvas=Image.new('RGBA',(W,H));canvas.alpha_composite(Image.fromarray(arr).resize((768,512),Image.Resampling.LANCZOS),(round(px),round(py)))
images['hand_back']=canvas;specs['hand_back']={'bone':'hand_back','chain':None};order.append('hand_back')
# The front forearm crosses in front of the hair when she lifts her glasses.
# Keep its shoulder under the torso, but retain the painted forearm above snakes.
arr=np.array(images['arm_front']);yy,xx=np.indices(arr.shape[:2]);elbow=np.array(arm_joints['front']['world'][1]);axis=np.array(arm_joints['front']['world'][2])-elbow
distance=((xx-elbow[0])*axis[0]+(yy-elbow[1])*axis[1])/np.linalg.norm(axis)
upper=arr.copy();upper[:,:,3]=np.where(distance<35,upper[:,:,3],0);images['arm_front']=Image.fromarray(upper)
fore=arr.copy();fore[:,:,3]=np.where(distance>-35,fore[:,:,3],0);images['forearm_front']=Image.fromarray(fore);specs['forearm_front']={'bone':'upper_front','chain':'arm_front'}
order.insert(order.index('glasses'),'forearm_front')
if (SRC/'thumb.png').exists():
    im=source('thumb.png');scale=.11;wx,wy=arm_joints['front']['world'][2];canvas=Image.new('RGBA',(W,H));scaled=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    canvas.alpha_composite(scaled,(round(wx-330*scale),round(wy-1360*scale)))
    images['hand_front_thumb']=canvas;specs['hand_front_thumb']={'bone':'hand_front','chain':None}
# Rear hand belongs behind the torso; front arm/hand should be on top.
order.remove('arm_front');order.remove('hand_back');order.insert(order.index('body'),'hand_back');order.insert(order.index('body'),'arm_front')
order.remove('hand_front_open');order.append('hand_front_open')
order=list(dict.fromkeys(order))

joints={'ground':[512,2000],'hips':[520,1190],'chest':[520,800],'neck':[520,640],'head':[510,630],'eyes':[475,480],
 'arm_front':arm_joints['front']['world'],'arm_back':arm_joints['back']['world'],
 'tail':[[540,1190],[560,1430],[590,1660],[720,1850],[900,1535]],
 'glasses':[500,460],'grip':[347,493],'pinchOffset':[-84.6,-49.5]}
# Register energy to the painted lime pupils, not the approximate portrait centre.
face=np.array(images['face_gaze']);mask=((face[:,:,1]>face[:,:,0]*1.12)&(face[:,:,1]>face[:,:,2]*1.4)&(face[:,:,1]>175)&(face[:,:,3]>200)).astype(np.uint8)
n,labels,stats,centers=cv2.connectedComponentsWithStats(mask,8);ids=sorted(range(1,n),key=lambda i:stats[i,cv2.CC_STAT_AREA],reverse=True)[:2];assert len(ids)==2
joints['gazeEyes']=[list(map(float,centers[i])) for i in sorted(ids,key=lambda i:centers[i,0])]
snake_paths={}
for i in range(9):
    x,y,w,h=specs[f'snake_{i+1}']['box']
    snake_paths[str(i+1)]=[[x+w*.52,y+h*.94],[x+w*.48,y+h*.72],[x+w*.60,y+h*.48],[x+w*.60,y+h*.28],[x+w*.48,y+h*.18]]
joints['snakes']=snake_paths

for name,im in images.items():im.save(LAYERS/(name+'.png'))
# Editable requested subdivisions remain on the same 1024x2048 canvas.
for side in ['front','back']:
    im=images['arm_'+side]; arr=np.array(im); yy,xx=np.indices(arr.shape[:2]);elbow=np.array(arm_joints[side]['world'][1]);axis=np.array(arm_joints[side]['world'][2])-elbow
    distance=((xx-elbow[0])*axis[0]+(yy-elbow[1])*axis[1])/np.linalg.norm(axis)
    for suffix,keep in [('upper',distance<35),('fore',distance>-35)]:
        part=arr.copy();part[:,:,3]=np.where(keep,part[:,:,3],0);Image.fromarray(part).save(LAYERS/f'arm_{side}_{suffix}.png')
for i in range(9):
    name=f'snake_{i+1}';arr=np.array(images[name]);x,y,w,h=specs[name]['box'];yy=np.indices(arr.shape[:2])[0];cut=y+h*.39
    for suffix,keep in [('head',yy<cut+25),('body',yy>cut-25)]:
        part=arr.copy();part[:,:,3]=np.where(keep,part[:,:,3],0);Image.fromarray(part).save(LAYERS/f'{name}_{suffix}.png')
for i in range(5):
    arr=np.array(images['tail']);yy=np.indices(arr.shape[:2])[0]
    lo=1110+i*178-40;hi=1110+(i+1)*178+40;arr[:,:,3]=np.where((yy>=lo)&(yy<=hi),arr[:,:,3],0)
    Image.fromarray(arr).save(LAYERS/('tail_tip.png' if i==4 else f'tail_{i+1}.png'))

manifest={'canvas':[W,H],'ground':[512,2000],'order':order,'layers':specs,'joints':joints,'source':'built-in image_gen; originals preserved; crop/registration only','frontSnakes':9,'mouths':{'open':5,'closed':4},'schema':'custom 3/4-left snake-tail Medusa, not front mascot template'}
(LAYERS/'layers.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(LAYERS/'joints.json').write_text(json.dumps(joints,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
composite=Image.new('RGBA',(W,H))
for name in order:composite.alpha_composite(images[name])
composite.save(ROOT/'medusa_assembled.png')
# PSD is a real layered editable document, not a flattened image with a renamed suffix.
psd=PSDImage.new('RGBA',(W,H))
for name in order:PixelLayer.frompil(images[name],psd,name=name)
for name in images:
    if name not in order:
        alternative=PixelLayer.frompil(images[name],psd,name=name);alternative.visible=False
for file in sorted(LAYERS.glob('*.png')):
    if file.stem not in images:
        alternative=PixelLayer.frompil(Image.open(file),psd,name=file.stem);alternative.visible=False
psd.save(ROOT/'medusa.psd')
reopened=PSDImage.open(ROOT/'medusa.psd');assert len(reopened)>=len(order)
print(json.dumps({'runtimeLayers':len(order),'editableLayers':len(reopened),'canvas':[W,H],'psdBytes':(ROOT/'medusa.psd').stat().st_size},indent=2))
