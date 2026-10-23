"""Register independently generated street layers, then build cropped runtime rigs.

No replacement artwork is painted here. Native imagegen originals are retained in
_incoming/street_cast/*/source; registration, alpha cleanup and export are repeatable.
Run with the math-sdk Python. --install is only valid after both delivery gates pass.
"""
from pathlib import Path
import argparse
import json
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import label, binary_dilation

D = Path(__file__).resolve().parent
APP = D.parent
SRC = D / '_incoming/street_cast'
KIT = Path('/Users/stone/.codex/skills/hacksaw-character-motion/archetype/layered')
SIZE = (1024, 2048)
# Drawing-space registration measured against the approved full references.
BOXES = {
 'mg': {
  'body': (250,176,790,1674), 'head': (390,250,605,535),
  'arm_r': (160,465,455,790), 'arm_l': (615,460,815,1100),
  'prop_bat': (150,220,310,590), 'fingers_r': (185,480,325,590),
  'dangle_chain': (450,535,575,685), 'dangle_mask': (510,475,560,555),
 },
 'fg': {
  'body': (270,350,755,1674), 'head': (420,176,655,425),
  'arm_r': (150,425,350,1085), 'arm_l': (694,425,874,1085),
  'prop_cigar': (390,318,445,338), 'dangle_smoke': (380,205,410,320),
 },
}
JOINTS = {
 'mg': {'head_top':[530,176], 'neck':[530,510], 'chest':[540,620],
        'waist':[535,890], 'hips':[535,1000],
        'shoulder_r':[410,535], 'elbow_r':[240,740], 'wrist_r':[235,540],
        'shoulder_l':[665,510], 'elbow_l':[785,750], 'wrist_l':[845,1030]},
 'fg': {'head_top':[540,176], 'neck':[540,425], 'chest':[520,575],
        'waist':[520,850], 'hips':[520,1000],
        'shoulder_r':[320,470], 'elbow_r':[220,750], 'wrist_r':[235,1020],
        'shoulder_l':[705,470], 'elbow_l':[820,750], 'wrist_l':[805,1020]},
}
ANCHORS = {'mg': {'prop_bat':[235,540], 'dangle_chain':[515,535], 'dangle_mask':[535,480]},
           'fg': {'prop_cigar':[435,328], 'dangle_smoke':[400,318]}}

def cleaned(path):
 im = Image.open(path).convert('RGBA')
 a = np.asarray(im).copy()
 labs, n = label(a[:,:,3] > 20)
 counts = np.bincount(labs.ravel())
 keep = np.zeros(a.shape[:2], dtype=bool)
 for k in range(1,n+1):
  if counts[k] >= 80: keep |= labs == k
 keep = binary_dilation(keep, iterations=2)
 a[~keep] = 0
 im = Image.fromarray(a)
 box = im.getchannel('A').getbbox()
 if not box: raise ValueError(f'Empty delivered layer: {path}')
 return im.crop(box)

def register(path, box):
 im = cleaned(path)
 x0,y0,x1,y1=box
 # Supersampling preserves antialiasing on flat ink contours.
 im=im.resize(((x1-x0)*2,(y1-y0)*2),Image.Resampling.LANCZOS)
 alpha=im.getchannel('A')
 # Explicit inks preserve the tiny orange chain instead of letting a
 # frequency-based quantiser average it into the much larger grey coat.
 colours=['121212','3A3D42','9A9CA0','F7F5F0',
          '6B3E26','A56739','D79551',
          '9C5A22','F5893D','FFC38A']
 palette=Image.new('P',(1,1))
 rgb=[int(c[i:i+2],16) for c in colours for i in (0,2,4)]
 palette.putpalette(rgb+[0]*(768-len(rgb)))
 if path.stem.startswith('body'):
  im=im.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGB')
  # No jewellery below the hips: exclude warm skin/metal inks from shoes.
  lower=(0,round(im.height*.55),im.width,im.height)
  grey=Image.new('P',(1,1))
  inks=[18,18,18,58,61,66,154,156,160,247,245,240]
  grey.putpalette(inks+[0]*(768-len(inks)))
  im.paste(im.crop(lower).quantize(palette=grey,dither=Image.Dither.NONE).convert('RGB'),lower)
  im=im.filter(ImageFilter.MedianFilter(9)).convert('RGBA')
 else:
  # Each small layer has its own skin/ink colours. An adaptive palette avoids
  # forcing its skin onto a threshold shared with the coat's grey inks.
  im=im.convert('RGB').quantize(colors=48,dither=Image.Dither.NONE).convert('RGB').filter(ImageFilter.MedianFilter(5)).convert('RGBA')
 im.putalpha(alpha)
 im=im.resize((x1-x0,y1-y0),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',SIZE)
 out.alpha_composite(im,(x0,y0))
 return out

def build(who):
 if who=='mg' and (SRC/'mg_rearm/source/arm_r.png').exists():
  from build_street_rearm import build as build_rearm
  return build_rearm()
 out=SRC/who
 spec=json.loads((D/f'cast_brief_street/{who}/layers.template.json').read_text())
 spec.update(joints=JOINTS[who], anchors=ANCHORS[who], feet_y=1674,top_y=176)
 spec['style']={'kind':'street','source':'../../../ART_BRIEF.md','frames':['../../../style_frame/cast_head.png','../../../style_frame/h1.png']}
 spec['provenance']='Native imagegen: each layer generated independently from our approved own full-figure reference. Originals and prompts retained; only mechanical registration and alpha cleanup.'
 if who=='mg':
  # Hood belongs to body and must be behind the face; carrying arm is foreground.
  spec['order']=['body','arm_r','prop_bat','arm_l','dangle_chain','head','dangle_mask','fingers_r']
 else:
  # The native sleeve includes an underlapping shoulder/coat extension.
  # Both complete sleeves belong behind the complete coat underpaint.
  spec['order']=['arm_l','arm_r','body','head','prop_cigar','dangle_smoke']
 images={}
 for name,box in BOXES[who].items():
  candidates=[out/f'source/{name}-{variant}.png' for variant in ('clean','prop','raw')]
  source=next(p for p in candidates if p.exists())
  images[name]=register(source,box)
  if who=='mg' and name=='arm_l':
   # Register the lower sleeve clear of the hoodie while keeping the painted
   # shoulder overlap. This is a measured placement change, not an underpaint.
   source=np.asarray(images[name])
   moved=np.zeros_like(source)
   for y in range(SIZE[1]):
    dx=round(55*min(1,max(0,(y-610)/240)))
    if dx:moved[y,dx:]=source[y,:-dx]
    else:moved[y]=source[y]
   images[name]=Image.fromarray(moved)
  if who=='fg' and name in ('arm_l','arm_r'):
   source=np.asarray(images[name])
   moved=np.zeros_like(source)
   for y in range(SIZE[1]):
    dx=round((40 if name=='arm_r' else -40)*min(1,max(0,(740-y)/240)))
    if dx>0:moved[y,dx:]=source[y,:-dx]
    elif dx<0:moved[y,:dx]=source[y,-dx:]
    else:moved[y]=source[y]
   images[name]=Image.fromarray(moved)
 full=Image.new('RGBA',SIZE)
 for name in spec['order']:
  images[name].save(out/f'{name}.png',optimize=True)
  full.alpha_composite(images[name])
 full.save(out/'full.png',optimize=True)
 (out/'layers.json').write_text(json.dumps(spec,indent=2)+'\n')
 subprocess.run([sys.executable,str(KIT/'check_layered_art.py'),str(out)],check=True)
 subprocess.run([sys.executable,str(KIT/'build_layered_rig.py'),str(out)],check=True)
 manifest=json.loads((out/'layers.manifest.json').read_text())
 # A mouth-held cigar follows the head, not the nearest forearm.
 if who=='fg':
  for layer in manifest['layers']:
   bones=layer['rig']['bones']
   head=next(i for i,b in enumerate(bones) if b['name']=='head')
   next(b for b in bones if b['name']=='prop_cigar')['parent']=head
 (out/'layers.manifest.json').write_text(json.dumps(manifest,separators=(',',':')))
 return out,manifest

def install(who,delivery,manifest):
 modes=['base','feature','kingpin'] if who=='mg' else ['fg']
 for mode in modes:
  dest=APP/f'static/assets/castLayers/turf/{mode}'
  backup=D/f'_legacy_assets/pre_street_cast/{mode}'
  if not backup.exists(): shutil.copytree(dest,backup)
  runtime=json.loads(json.dumps(manifest))
  for layer in runtime['layers']:
   im=Image.open(delivery/layer['texture']).convert('RGBA')
   x0,y0,x1,y1=im.getchannel('A').getbbox()
   box=(max(0,x0-4),max(0,y0-4),min(1024,x1+4),min(2048,y1+4))
   x0,y0,x1,y1=box
   layer['crop']=[x0,y0,x1-x0,y1-y0]
   im.crop(box).save(dest/layer['texture'],optimize=True)
  (dest/'layers.manifest.json').write_text(json.dumps(runtime,separators=(',',':')))
  full=Image.open(delivery/'full.png').convert('RGBA')
  full.crop(full.getchannel('A').getbbox()).save(dest/'full.png',optimize=True)
 print('installed',who,modes)

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument('--install',action='store_true')
 args=ap.parse_args()
 built={who:build(who) for who in ('mg','fg')}
 if args.install:
  for who,(delivery,manifest) in built.items(): install(who,delivery,manifest)

if __name__=='__main__':main()
