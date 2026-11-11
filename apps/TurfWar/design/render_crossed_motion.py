"""Render a brief reaction strip from the exact shipped meshes and game motion."""
from pathlib import Path
import json,subprocess
import numpy as np
from PIL import Image,ImageDraw
D=Path(__file__).resolve().parent; APP=D.parent

def render(who,age):
 layers=APP/'static/assets/castLayers/turf'/('base' if who=='mg' else 'fg')
 state={'timeMs':1000+age,'reactionAge':age,'motionScale':1,'kind':'trigger'}
 out=subprocess.check_output(['node',str(D/'pose_layered_verts.mjs'),str(layers/'layers.manifest.json'),str(APP/'src/game/castMotion.ts'),str(APP/'src/game/layeredCastMotion.ts')+'#'+('LAYERED_TIERS' if who=='mg' else 'KINGPIN_TIERS'),'{}',json.dumps(state)],text=True)
 d=json.loads(out); im=Image.new('RGBA',(384,768)); scale=384/1024
 for name in d['order']:
  L=d['layers'][name];tex=Image.open(layers/f'{name}.png').convert('RGBA');cx,cy=L['crop'][:2]
  dst=np.array(L['dst']).reshape(-1,2)*scale;layer=Image.new('RGBA',im.size)
  for t in L['tris']:
   S=np.array([[L['src'][k][0]-cx,L['src'][k][1]-cy] for k in t]);T=dst[list(t)]
   x0,y0=np.floor(T.min(0)).astype(int)-1;x1,y1=np.ceil(T.max(0)).astype(int)+1
   try:M=np.linalg.solve(np.c_[T,np.ones(3)],S)
   except np.linalg.LinAlgError:continue
   a,b,c=M[:,0];e,f,g=M[:,1]
   patch=tex.transform((x1-x0,y1-y0),Image.AFFINE,(a,b,a*x0+b*y0+c,e,f,e*x0+f*y0+g),resample=Image.Resampling.BILINEAR)
   mask=Image.new('L',patch.size);ImageDraw.Draw(mask).polygon([(p[0]-x0,p[1]-y0) for p in T],fill=255);layer.paste(patch,(x0,y0),mask)
  im.alpha_composite(layer)
 return im
frames=[]
ages=[0,100,150,300,500,700,900]
for age in ages:
 im=Image.new('RGB',(768,768),'#55585D')
 for i,who in enumerate(('mg','fg')):
  part=render(who,age);im.paste(part,(i*384,0),part)
 ImageDraw.Draw(im).text((15,20),f'MG / FG reaction: {age} ms',fill='white');frames.append(im)
out=D/'cast_brief_crossed/reaction.gif';frames[0].save(out,save_all=True,append_images=frames[1:],duration=[b-a for a,b in zip(ages,ages[1:])]+[900],loop=0)
frames[2].save(D/'cast_brief_crossed/reaction_peak.jpg');print(out)
