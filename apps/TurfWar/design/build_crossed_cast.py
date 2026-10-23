"""Register native imagegen layers for the 2026-10-20 crossed-arm delivery.

Originals are preserved beside the delivery. Only alpha cleanup, registration,
supersampled resizing and runtime cropping occur here; no replacement art is drawn.
"""
from pathlib import Path
import argparse, json, shutil, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label, binary_dilation

D = Path(__file__).resolve().parent
APP = D.parent
KIT = Path('/Users/stone/.codex/skills/hacksaw-character-motion/archetype/layered')
SRC = D / '_incoming/street_cast_crossed'
BOXES = {
 'mg': {'prop_bat':(150,380,650,1120), 'body':(290,460,750,1673),
        'arm_r':(250,465,690,795), 'arm_l':(330,465,775,805),
        'head':(345,178,680,525), 'dangle_chain':(423,495,615,650),
        'dangle_mask':(630,400,690,530)},
 'fg': {'body':(275,435,805,1673), 'arm_r':(225,460,700,815),
        'arm_l':(330,460,815,825), 'head':(335,178,680,520),
        'prop_cigar':(270,395,395,430), 'dangle_smoke':(255,265,300,400)},
}
ORDER = {'mg':['prop_bat','body','arm_r','arm_l','head','dangle_chain','dangle_mask'],
         'fg':['body','arm_r','arm_l','head','prop_cigar','dangle_smoke']}
JOINTS = {
 'mg':{'head_top':[490,178],'neck':[540,495],'chest':[520,620],
       'waist':[520,880],'hips':[520,960],
       'shoulder_r':[325,510],'elbow_r':[310,735],'wrist_r':[635,695],
       'shoulder_l':[705,510],'elbow_l':[725,745],'wrist_l':[400,695]},
 'fg':{'head_top':[495,178],'neck':[540,480],'chest':[525,620],
       'waist':[525,880],'hips':[525,960],
       'shoulder_r':[305,505],'elbow_r':[285,755],'wrist_r':[645,705],
       'shoulder_l':[740,505],'elbow_l':[760,765],'wrist_l':[400,705]},
}
ANCHORS = {'mg':{'prop_bat':[480,700],'dangle_chain':[520,500],'dangle_mask':[642,410]},
           'fg':{'prop_cigar':[390,410],'dangle_smoke':[278,397]}}

def clean(path):
 im=Image.open(path).convert('RGBA'); a=np.array(im)
 # Remove generated soft drop-shadow/halo outside the actual opaque sticker.
 labels,n=label(a[:,:,3]>220); counts=np.bincount(labels.ravel()); counts[0]=0
 if not n: raise ValueError(f'No opaque artwork in {path}')
 keep=binary_dilation(labels==counts.argmax(),iterations=3)
 a[~keep]=0
 im=Image.fromarray(a); return im.crop(im.getchannel('A').getbbox())

def build(who):
 out=SRC/who; source=out/'source'; source.mkdir(parents=True,exist_ok=True)
 paths=json.loads((D/'cast_brief_crossed/generated_paths.json').read_text())
 for name in ['reference']+ORDER[who]:
  target=source/f'{name}.png'
  if not target.exists(): shutil.copy2(paths[f'{who}_{name}'],target)
 full=Image.new('RGBA',(1024,2048))
 for name in ORDER[who]:
  x0,y0,x1,y1=BOXES[who][name]
  im=clean(source/f'{name}.png')
  im=im.resize(((x1-x0)*2,(y1-y0)*2),Image.Resampling.LANCZOS)
  im=im.resize((x1-x0,y1-y0),Image.Resampling.LANCZOS)
  canvas=Image.new('RGBA',full.size); canvas.alpha_composite(im,(x0,y0))
  # A sticker rim belongs only at the background-facing silhouette. Remove
  # white matte pixels where this part overlaps an already opaque underlayer;
  # retain the original painted black outlines and all exposed ivory edges.
  pixels=np.array(canvas); under=np.array(full.getchannel('A'))
  rgb=pixels[:,:,:3].astype(int)
  rim=(rgb.min(axis=2)>190)&((rgb.max(axis=2)-rgb.min(axis=2))<35)&(under>250)
  pixels[rim]=0; canvas=Image.fromarray(pixels)
  canvas.save(out/f'{name}.png',optimize=True); full.alpha_composite(canvas)
 full.save(out/'full.png',optimize=True)
 if who=='mg':
  from scipy.ndimage import distance_transform_edt
  head=np.array(Image.open(out/'head.png'))[:,:,3]>16
  bat=np.array(Image.open(out/'prop_bat.png'))[:,:,3]>16
  clearance=float(distance_transform_edt(~head)[bat].min())
  assert clearance>=60, f'Bat is only {clearance:.1f}px from head (need 60)'
  print(f'Bat/head clearance: {clearance:.1f}px')
 spec={'version':1,'archetype':'miami_green_guy','size':[1024,2048],
       'feet_y':1673,'top_y':178,'sides':'anatomical','mirrored':False,
       'order':ORDER[who],'joints':JOINTS[who],'anchors':ANCHORS[who],
       'arms':{'l':'crossed','r':'crossed'},
       'style':{'kind':'street','source':'../../../ART_BRIEF.md'},
       'provenance':'Native imagegen own-game references; original independent painted parts in source/. Registration and alpha cleanup only.'}
 (out/'layers.json').write_text(json.dumps(spec,indent=2)+'\n')
 subprocess.run([sys.executable,str(KIT/'check_layered_art.py'),str(out)],check=True)
 subprocess.run([sys.executable,str(KIT/'build_layered_rig.py'),str(out)],check=True)
 manifest=json.loads((out/'layers.manifest.json').read_text())
 # Back-slung bat follows chest; mouth-held cigar follows head.
 for layer in manifest['layers']:
  bones=layer['rig']['bones']
  for prop,parent in [('prop_bat','chest'),('prop_cigar','head')]:
   if prop in ORDER[who]:
    next(b for b in bones if b['name']==prop)['parent']=next(i for i,b in enumerate(bones) if b['name']==parent)
 (out/'layers.manifest.json').write_text(json.dumps(manifest,separators=(',',':')))
 return out,manifest

def install(who,out,manifest):
 for mode in (['base','feature','kingpin'] if who=='mg' else ['fg']):
  dest=APP/f'static/assets/castLayers/turf/{mode}'
  backup=D/f'_legacy_assets/pre_crossed_20261020/{mode}'
  if not backup.exists(): shutil.copytree(dest,backup)
  runtime=json.loads(json.dumps(manifest))
  for layer in runtime['layers']:
   im=Image.open(out/layer['texture']).convert('RGBA')
   x0,y0,x1,y1=im.getchannel('A').getbbox()
   box=(max(0,x0-4),max(0,y0-4),min(1024,x1+4),min(2048,y1+4))
   x0,y0,x1,y1=box; layer['crop']=[x0,y0,x1-x0,y1-y0]
   im.crop(box).save(dest/layer['texture'],optimize=True)
  (dest/'layers.manifest.json').write_text(json.dumps(runtime,separators=(',',':')))
  im=Image.open(out/'full.png'); im.crop(im.getchannel('A').getbbox()).save(dest/'full.png')
  # Remove the obsolete gripping-fingers layer after the bat moved to the back.
  obsolete=dest/'fingers_r.png'
  if obsolete.exists(): obsolete.unlink()

def main():
 # Compatibility entry point. The independently resized v1 was rejected.
 # Import lazily: build_master_cast reuses clean/install from this module.
 from build_master_cast import main as build_master
 build_master()

if __name__=='__main__':main()
