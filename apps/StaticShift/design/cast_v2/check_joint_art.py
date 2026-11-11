"""Static articulation proofs only, not a Spine rig or delivered motion."""
from pathlib import Path
import math,json
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent
FONT=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',24)
SIZE=(1024,1536)
def around(p,a):
 a=math.radians(a);c=math.cos(a);s=math.sin(a);x,y=p
 return np.array([[c,-s,x-c*x+s*y],[s,c,y-s*x-c*y],[0,0,1.]])
def render(ch,D,label,pose):
 data=json.loads((D/'layout.json').read_text());J=data['joints'];order=data['draw_order'];trans={};swap={}
 for side in ['l','r']:
  a,b=pose.get('arm_'+side,(0,0));A=around(J['shoulder_'+side],a);B=A@around(J['elbow_'+side],b)
  for part,M in [('upper',A),('lower',B)]:trans[f'arm_{side}_{part}']=M
  hn='hand_l_hip' if side=='l' else 'hand_r_grip';trans[hn]=B
  if 'hand_'+side in pose:swap[hn]=pose['hand_'+side]
  a,b=pose.get('leg_'+side,(0,0));A=around(J['hip_'+side],a);B=A@around(J['knee_'+side],b)
  trans[f'leg_{side}_upper']=A;trans[f'leg_{side}_lower']=B
  P=np.array([*J['ankle_'+side],1.]);Q=B@P;F=np.eye(3);F[:2,2]=Q[:2]-P[:2];trans['foot_'+side]=F
 H=around(J['neck'],pose.get('head_angle',0));trans['head_idle']=H;trans['hat']=H;trans['glasses']=H;trans['neck']=around(J['neck'],pose.get('head_angle',0)*.3)
 if 'head' in pose:swap['head_idle']=pose['head']
 canvas=Image.new('RGBA',(1600,2160),'#171b24');off=np.array([[1,0,280],[0,1,500],[0,0,1.]])
 for name in order:
  if ch=='dj' and name=='hat' and pose.get('hand_r')=='hand_r_hatheld':continue
  im=Image.open(D/'layers'/((swap.get(name,name))+'.png')).convert('RGBA');M=off@trans.get(name,np.eye(3));inv=np.linalg.inv(M);coeff=tuple(inv[:2].ravel());part=im.transform(canvas.size,Image.Transform.AFFINE,coeff,Image.Resampling.BICUBIC);box=part.getchannel('A').getbbox();assert box and box[0]>0 and box[1]>0 and box[2]<canvas.width and box[3]<canvas.height,(ch,label,name,'proof canvas clips art');canvas.alpha_composite(part)
 ImageDraw.Draw(canvas).text((25,25),label+' - static source articulation check',font=FONT,fill='#eeeeea');canvas.save(D/'qa'/('joint-'+label+'.png'))
 return canvas
poses=[('rest',{}),('extended',{'arm_l':(45,75),'arm_r':(-20,120),'hand_l':'hand_l_point','head':'head_spiral'}),('raised',{'arm_l':(120,90),'arm_r':(-130,150),'hand_l':'hand_l_open','hand_r':'hand_r_hatheld','head':'head_grin'}),('folded',{'arm_l':(-15,-85),'arm_r':(20,-60),'hand_r':'hand_r_pinch','head':'head_blink'}),('shrug',{'arm_l':(30,-30),'arm_r':(-25,30),'hand_l':'hand_l_open','hand_r':'hand_r_open','head':'head_annoyed','head_angle':-8}),('knees',{'leg_l':(20,-45),'leg_r':(-15,35),'head_angle':10})]
for ch in ['dj','host']:
 D=ROOT/'精修/v1'/ch;sheet=Image.new('RGB',(1500,1200),'#888888')
 for i,(label,p) in enumerate(poses):im=render(ch,D,label,p);im.thumbnail((500,600));sheet.paste(im.convert('RGB'),((i%3)*500,(i//3)*600))
 sheet.save(D/'qa/joint-proof-sheet.jpg',quality=96)
 # Component inventory catches stray fragments without pretending to judge anatomy.
 out={}
 for f in sorted((D/'layers').glob('*.png')):
  im=Image.open(f).convert('RGBA');a=np.array(im)[:,:,3];lab,n=ndi.label(a>128);sizes=np.bincount(lab.ravel())[1:];out[f.stem]={'size':im.size,'alpha_range':im.getchannel('A').getextrema(),'components_gt16':int((sizes>16).sum()),'largest_area':int(sizes.max()) if len(sizes) else 0,'edge_touches':bool((a[0]>0).any()or(a[-1]>0).any()or(a[:,0]>0).any()or(a[:,-1]>0).any())}
 (D/'qa/component-report.json').write_text(json.dumps(out,indent=2)+'\n')
 print(ch,'components anomalies:',[(k,v['components_gt16'],v['edge_touches'])for k,v in out.items()if v['components_gt16']!=1 or v['edge_touches']])
