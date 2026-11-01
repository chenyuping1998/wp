"""Extract authored atlas cells and place their joints on the motion-kit canvas.

No painted limbs are cut out of a flattened person: every input is an isolated,
complete part with its own overlap caps. Sources remain in sumo_source/.
"""
from pathlib import Path
from PIL import Image
import json, math
import numpy as np
from scipy.ndimage import label

ROOT=Path(__file__).resolve().parent
W,H=1024,1536
J={
 'hip':(510,990),'waist':(510,820),'neckBase':(510,500),
 'headBase':(540,430),'headTop':(560,105),
 'shoulderF':(650,600),'elbowF':(745,735),'wristF':(845,575),
 'shoulderB':(365,600),'elbowB':(415,735),'wristB':(570,600),
 'hipF':(605,995),'kneeF':(665,1200),'ankleF':(650,1410),
 'hipB':(415,995),'kneeB':(345,1200),'ankleB':(335,1410),
 'hairRoot':(540,135),'hairTip':(500,80),
}
ORDER=['arm_back_upper','arm_back_lower','fist_back','leg_back_lower','leg_back_upper',
 'leg_front_lower','leg_front_upper','pelvis','neck','torso','head',
 'arm_front_upper','arm_front_lower','fist_front']

def cell(atlas,i):
 cw,ch=atlas.width//4,atlas.height//4
 # AI atlas cells drift several pixels across nominal dividers. Extract a
 # padded cell then retain its central connected shape, rather than clipping
 # bellies/legs at a grid line or including a neighbouring part's fringe.
 pad=int(cw*.25)
 im=atlas.crop(((i%4)*cw-pad,(i//4)*ch-pad,(i%4+1)*cw+pad,(i//4+1)*ch+pad))
 alpha=np.array(im.getchannel('A')); ids,n=label(alpha>40)
 counts=np.bincount(ids.ravel());counts[0]=0
 # The neck cell may contain a larger sliver of its neighbour's pelvis.
 # Choose the substantial component nearest this cell's own centre.
 from scipy.ndimage import center_of_mass
 candidates=[k for k in range(1,n+1) if counts[k]>max(300,counts.max()*.04)]
 centers=center_of_mass(alpha>40,ids,candidates)
 cy,cx=pad+ch/2,pad+cw/2
 target=min(zip(candidates,centers),key=lambda kc:(kc[1][0]-cy)**2+(kc[1][1]-cx)**2)[0]
 keep=ids==target
 # One-pixel edge dilation retains the source antialias.
 from scipy.ndimage import binary_dilation
 alpha[~binary_dilation(keep,iterations=2)]=0
 im.putalpha(Image.fromarray(alpha))
 box=im.getchannel('A').getbbox()
 return im.crop(box)

def fit(im,box):
 x,y,w,h=box
 out=Image.new('RGBA',(W,H))
 out.alpha_composite(im.resize((int(w),int(h)),Image.Resampling.LANCZOS),(int(x),int(y)))
 return out

def limb(im,p0,p1,j0,j1,width_scale=1):
 # Similarity transform plus transverse widening retains the drawn shape,
 # while keeping the two actual joint centres in the exact rig locations.
 a=(p0[0]*im.width,p0[1]*im.height); b=(p1[0]*im.width,p1[1]*im.height)
 u=(b[0]-a[0],b[1]-a[1]); v=(j1[0]-j0[0],j1[1]-j0[1])
 ll=u[0]**2+u[1]**2
 # M = (v*uT + widened perpendicular(v)*perpendicular(u)T) / |u|²
 m00=(v[0]*u[0]+width_scale*v[1]*u[1])/ll
 m01=(v[0]*u[1]-width_scale*v[1]*u[0])/ll
 m10=(v[1]*u[0]-width_scale*v[0]*u[1])/ll
 m11=(v[1]*u[1]+width_scale*v[0]*u[0])/ll
 ex=j0[0]-m00*a[0]-m01*a[1]; ey=j0[1]-m10*a[0]-m11*a[1]
 d=m00*m11-m01*m10
 inv=(m11/d,-m01/d,(-m11*ex+m01*ey)/d,-m10/d,m00/d,(m10*ex-m00*ey)/d)
 return im.transform((W,H),Image.Transform.AFFINE,inv,Image.Resampling.BICUBIC)

for cast in ['mg','fg']:
 atlas=Image.open(ROOT/'sumo_source'/f'{cast}_parts.png').convert('RGBA')
 out=ROOT/'sumo_cast'/cast/'layers'; out.mkdir(parents=True,exist_ok=True)
 layers={
 'head':fit(cell(atlas,0),(350,95,415,440)),
 'torso':fit(cell(atlas,1),(270,470,500,565)),
 'pelvis':fit(cell(atlas,2),(320,915,400,225)),
 'neck':fit(cell(atlas,3),(430,420,170,150)),
 }
 specs=[
 ('arm_back_upper',4,(.27,.24),(.72,.78),'shoulderB','elbowB',1.3),
 ('arm_back_lower',5,(.17,.82),(.83,.16),'elbowB','wristB',1.35),
 ('arm_front_upper',7,(.27,.24),(.73,.78),'shoulderF','elbowF',1.25),
 ('arm_front_lower',8,(.17,.82),(.83,.16),'elbowF','wristF',1.4),
 ('leg_back_upper',10,(.78,.16),(.25,.85),'hipB','kneeB',1.5),
 ('leg_back_lower',11,(.56,.10),(.60,.72),'kneeB','ankleB',1.3),
 ('leg_front_upper',12,(.21,.13),(.79,.86),'hipF','kneeF',1.5),
 ('leg_front_lower',13,(.43,.09),(.40,.74),'kneeF','ankleF',1.25),
 ]
 for name,i,a,b,j0,j1,wide in specs:
  layers[name]=limb(cell(atlas,i),a,b,J[j0],J[j1],wide)
 layers['fist_back']=fit(cell(atlas,6),(J['wristB'][0]-40,J['wristB'][1]-85,175,140))
 layers['fist_front']=fit(cell(atlas,9),(J['wristF'][0]-65,J['wristF'][1]-135,160,220))
 # Champion's generated lead upper-arm is reversed in its atlas cell.
 if cast=='fg':
  layers['arm_front_upper']=limb(cell(atlas,7),(.73,.24),(.29,.78),J['shoulderF'],J['elbowF'],1.25)
 for name,im in layers.items(): im.save(out/f'{name}.png')
 (out/'joints.json').write_text(json.dumps({k:dict(zip(['x','y'],v)) for k,v in J.items()},indent=2))
 (out/'layers.json').write_text(json.dumps({'order':ORDER}))
 (out/'celebrate.params.json').write_text(json.dumps({'params':{'swing':25}}))
 full=Image.new('RGBA',(W,H))
 for name in ORDER: full.alpha_composite(layers[name])
 full.save(out.parent/'full.png')
 print(cast,out)
