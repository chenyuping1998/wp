"""Register independently repainted layers using UNIFORM transforms, then rig.
No master slicing: each part has its own retained image-generation source.
"""
from pathlib import Path
import json, subprocess, sys, shutil
import numpy as np
from PIL import Image, ImageDraw

D=Path(__file__).resolve().parent
APP=D.parent.parent
SRC=D/'source'
TOOL=Path.home()/'.codex/skills/hacksaw-character-motion/archetype/layered/build_layered_rig.py'

CONFIG={
 'mg': {
  'transforms':{'body':[1,0,20],'head':[.55,270,0],'arm_l':[.46,120,145],'arm_r':[.5,410,220]},
  'joints':{'hips':[490,770],'waist':[500,650],'chest':[505,445],'neck':[548,325],'head_top':[565,28],
    'shoulder_l':[300,290],'elbow_l':[210,480],'wrist_l':[440,420],
    'shoulder_r':[605,352],'elbow_r':[735,545],'wrist_r':[840,425]},
  'feet_y':1492,
 },
 'fg': {
  'transforms':{'body':[1,0,0],'head':[.4,340,-50],'arm_l':[.52,130,115],'arm_r':[.5,455,145]},
  'joints':{'hips':[510,670],'waist':[510,570],'chest':[510,390],'neck':[550,250],'head_top':[540,25],
    'shoulder_l':[307,271],'elbow_l':[273,531],'wrist_l':[520,385],
    'shoulder_r':[675,325],'elbow_r':[737,515],'wrist_r':[887,445]},
  'feet_y':1485,
 },
}

def register(image, transform):
 k,x,y=transform
 return image.transform((1024,1536),Image.Transform.AFFINE,(1/k,0,-x/k,0,1/k,-y/k),Image.Resampling.BICUBIC)

def main():
 for who in sys.argv[1:] or ['mg','fg']:
  config=CONFIG[who]
  delivery=D/'cast'/who;delivery.mkdir(parents=True,exist_ok=True)
  order=['arm_r','body','head','arm_l']
  full=Image.new('RGBA',(1024,1536))
  for part in order:
   source=SRC/f'{who}-{part.replace("_","-")}.png'
   image=register(Image.open(source).convert('RGBA'),config['transforms'][part])
   # Discard RGB from transparent pixels, retaining antialiased silhouettes.
   data=np.asarray(image).copy();data[data[:,:,3]==0,:3]=0
   image=Image.fromarray(data)
   image.save(delivery/f'{part}.png')
   full.alpha_composite(image)
  full.save(delivery/'full.png')
  spec={'archetype':'turf_original_open_guard_v3','size':[1024,1536],'order':order,'joints':config['joints'],'feet_y':config['feet_y'],'anchors':{}}
  (delivery/'layers.json').write_text(json.dumps(spec,indent=2))
  (delivery/'registration.json').write_text(json.dumps({'uniform_scale_only':True,'source':str(SRC),'transforms':config['transforms']},indent=2))
  out=APP/'static/assets/castLayers/turf/v3'/('base' if who=='mg' else 'fg')
  out.mkdir(parents=True,exist_ok=True)
  subprocess.run([sys.executable,str(TOOL),str(delivery),'--out',str(out),'--cell','18','--elbow-blend','110'],check=True)
  manifest=json.loads((out/'layers.manifest.json').read_text())
  for layer in manifest['layers']:
   image=Image.open(delivery/layer['texture']).convert('RGBA');bbox=image.getchannel('A').getbbox()
   alpha=np.asarray(image)[:,:,3]
   visible=[]
   for ti,t in enumerate(layer['rig']['tris']):
    points=np.array([layer['rig']['verts'][v] for v in t])
    samples=list(points)+[points.mean(0)]+[(points[i]+points[(i+1)%3])/2 for i in range(3)]
    if any(alpha[min(1535,max(0,round(float(y)))),min(1023,max(0,round(float(x))))]>32 for x,y in samples):visible.append(ti)
   layer['rig']['visibleTriangles']=visible
   x0,y0,x1,y1=bbox;pad=3;x0=max(0,x0-pad);y0=max(0,y0-pad);x1=min(1024,x1+pad);y1=min(1536,y1+pad)
   layer['crop']=[x0,y0,x1-x0,y1-y0]
   image.crop((x0,y0,x1,y1)).save(out/layer['texture'],optimize=True)
  (out/'layers.manifest.json').write_text(json.dumps(manifest,separators=(',',':')))
  shutil.copy2(delivery/'full.png',out/'full.png')
  print(who,manifest['figure_box'])

if __name__=='__main__':main()
