"""Render six official baked clips and the 180ms runtime pose transitions."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, math, os
APP=Path(__file__).resolve().parents[1]
ROOT=APP.parents[2]
OUT=ROOT/os.environ.get('SUMO_MOTION_OUT','dist/sumomonkey-polish/motion')
OUT.mkdir(parents=True,exist_ok=True)
# Reuse the exact cropped-art affine renderer; no source or geometry edits.
ns={'__file__':str(APP/'design/sumo_redissect_v2_preview.py')}
source=(APP/'design/sumo_redissect_v2_preview.py').read_text().split('casts = {}')[0]
source=source.replace('W, H, S = 420, 450, .255','W, H, S = 420, 550, .255').replace('190+x*S, 420+y*S','190+x*S, 520+y*S')
exec(source,ns)
render=ns['render'];load=ns['source'];W,H=ns['W'],ns['H']
def pose(data,name,t):
 c=data['clips'][name];f=min(t*c['fps'],len(c['frames'])-1);a=int(f);b=min(a+1,len(c['frames'])-1)
 return [[l+(r-l)*(f-a) for l,r in zip(x,y)] for x,y in zip(c['frames'][a],c['frames'][b])]
def blend_pic(data,images,start,name,t,label):
 target=pose(data,name,t);p=min(1,t/.18);w=p*p*(3-2*p)
 frame=[[x+(y-x)*w for x,y in zip(a,b)] for a,b in zip(start,target)]
 d={**data,'clips':{'transition':{'fps':30,'duration':1,'frames':[frame]}}}
 return render(d,images,'transition',0,label)
for cast in ['mg','fg']:
 data,images=load(APP,cast);frames=[];sheet=Image.new('RGB',(W*4,H*12),'#efeadc')
 for row,(name,clip) in enumerate(data['clips'].items()):
  transitions=[(pose(data,'idle',.65),name,'idle -> '+name),
   (pose(data,name,clip['duration']), 'idle',name+' -> idle')]
  for side,(start,target,label) in enumerate(transitions):
   for k,t in enumerate([0,.06,.12,.18]):
    pic=blend_pic(data,images,start,target,t,cast.upper()+' '+label+f' {t:.2f}s')
    sheet.paste(pic,(W*k,H*(row*2+side)))
   for k in range(8):frames.append(blend_pic(data,images,start,target,k/30,cast.upper()+' '+label))
   # Keep the actual full motion, including extremes, between transition proofs.
   for k in range(math.ceil(data['clips'][target]['duration']*15)):
    frames.append(render(data,images,target,k/15,cast.upper()+' '+target))
 sheet.save(OUT/f'{cast}-transitions.png')
 frames[0].save(OUT/f'{cast}-transitions.gif',save_all=True,append_images=frames[1:],duration=67,loop=0)
 print(cast,'PASS rendered',len(frames),'frames')
