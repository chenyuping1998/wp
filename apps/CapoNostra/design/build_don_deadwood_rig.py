"""One coherent Don illustration, pose-specific rig; Deadwood motion roles.
No body-part stretching. Uniform canvas registration only.
"""
from pathlib import Path
import sys,json,shutil
import numpy as np
from PIL import Image
sys.path.insert(0,str(Path.home()/'.codex/skills/hacksaw-character-motion/rig'))
import skin
APP=Path(__file__).resolve().parents[1];D=APP/'design/cast_parts/mg';B=APP/'design/_incoming/don_deadwood_20261004'
im=Image.open(B/'source.png').convert('RGBA');box=im.getbbox();s=1598/(box[3]-box[1]);ox=512-(box[0]+box[2])/2*s;oy=224-box[1]*s
full=Image.new('RGBA',(1024,2048));scaled=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS);full.alpha_composite(scaled,(round(ox),round(oy)))
def point(p):return np.array([p[0]*s+ox,p[1]*s+oy])
rig=skin.build_rig(full,cols=32,rows=64)
body=[(525,1514),(520,1015),(520,740),(518,480),(505,280),(492,163)]
for b,p in zip(rig['bones'],body):b['x'],b['y']=point(p).tolist()
v=np.array(rig['verts']);w,_=skin.bone_weights(v,rig['bones'],softness=1.3,plant=point((0,1370))[1]);alpha=np.array(full)[:,:,3];ink=alpha[np.minimum(v[:,1].astype(int),2047),np.minimum(v[:,0].astype(int),1023)]>128
arms={'l':[(323,337),(276,589),(219,551),(198,499)],'r':[(754,334),(809,581),(807,773),(785,859)]};ownership={}
def segment(a,b):
 d=b-a;t=np.clip((v-a)@d/(d@d),0,1);return np.linalg.norm(v-(a+t[:,None]*d),axis=1)
for side,path in arms.items():
 p=np.array([point(q) for q in path]);i=len(rig['bones'])
 for name,pivot,parent,axis in [(f'arm_{side}',p[0],3,p[1]-p[0]),(f'fore_{side}',p[1],i,p[2]-p[1])]:rig['bones'].append(dict(name=name,x=float(pivot[0]),y=float(pivot[1]),parent=parent,axis=(axis/np.linalg.norm(axis)).tolist()))
 dist=np.minimum.reduce([segment(a,b) for a,b in zip(p[:-1],p[1:])]);pathdist=np.linalg.norm(v-p[0],axis=1)
 claim=skin.smoothstep((155-dist)/115)*skin.smoothstep(pathdist/195)
 mix=skin.smoothstep((pathdist-np.linalg.norm(p[1]-p[0])+90)/180);aw=np.zeros((len(v),i+2));aw[:,i]=1-mix;aw[:,i+1]=mix
 w=np.column_stack([w,np.zeros((len(v),2))])*(1-claim[:,None])+aw*claim[:,None]
 region=ink&(dist<45)&(pathdist>110);ownership[side]=float(w[region,i:i+2].sum(1).mean())
assert np.allclose(w.sum(1),1);assert min(ownership.values())>.5,ownership
idle={'root':[0,0,2000,0],'hips':[.06,0,2450,0],'waist':[.12,360,2800,.2],'chest':[.24,180,2150,.3],'neck':[.38,120,2650,.5],'head':[.55,60,1750,.8],'arm_l':[1.6,0,2050,.4],'fore_l':[1.2,300,1800,.3],'arm_r':[1.5,180,1500,.4],'fore_r':[1.1,360,1550,.3]}
for b in rig['bones']:b['idle']=idle[b['name']]
rig['weights']=w.tolist();rig['image']='figure.png';rig['arm_paths']={k:[point(q).tolist() for q in p] for k,p in arms.items()}
manifest=dict(version=1,size=[1024,2048],figure_box=rig['figure_box'],order=['figure'],layers=[dict(name='figure',texture='figure.png',rig=rig)],anatomical_sides=False)
D.mkdir(exist_ok=True);full.save(D/'figure.png');full.save(D/'full.png');(D/'layers.manifest.json').write_text(json.dumps(manifest,separators=(',',':')))
(D/'layers.json').write_text(json.dumps({'status':'single coherent image; newly authored mesh','joints':{'hips':point((520,740)).tolist()},'motion_reference':'DeadwoodExpress self-authored conductor motion'},indent=2))
(B/'rig-report.json').write_text(json.dumps({'ownership':ownership,'registration':{'uniform_scale':s,'offset':[ox,oy]},'arms':rig['arm_paths']},indent=2));print(ownership)
