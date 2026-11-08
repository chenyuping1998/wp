"""Archive/edit continuous sleeves, register each bone to ORIGINAL joint points.
No movement, character scale, original joints or animation parameters change.
"""
from pathlib import Path
import importlib.util,json,hashlib
D=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('import_fg',D.parent/'cast_fg/import_generated_repairs.py');fg=importlib.util.module_from_spec(spec);spec.loader.exec_module(fg)
G=D/'source/sleeves-1028';O=D/'source/repairs-1028';O.mkdir(parents=True,exist_ok=True)
joints=json.loads((D/'joints.json').read_text());manifest={}
for side,root,joint,end,radius in [('l',(815,300),(278,790),(574,1153),75),('r',(448,410),(680,815),(377,987),55)]:
 full=fg.normalized(G/(side+'.png'));up,lo=fg.split_limb(full,joint,root,end,radius)
 def point(name):p=joints[name+side.upper()];return(p['x'],p['y'])
 targetroot=point('shoulder');targetjoint=point('elbow');targetend=point('wrist')
 up=fg.register(up,root,joint,targetroot,targetjoint);lo=fg.register(lo,joint,end,targetjoint,targetend)
 # Rear upper-arm cap is concealed inside the original painted elbow; keep
 # the foreground forearm's complete cloth folds and outer bend silhouette.
 up=fg.socket(up,targetjoint,targetroot,14)
 # Complete unoutlined shoulder socket; never feather alpha through the
 # coat/sleeve contact (that produces a visible white hole on light scenes).
 up=fg.socket(up,targetroot,targetjoint,25)
 # Match the original coat palette while retaining the generated cloth folds.
 for im in [up,lo]:
  pix=im.load();box=im.getchannel('A').getbbox()
  for yy in range(box[1],box[3]):
   for xx in range(box[0],box[2]):
    rr,gg,bb,aa=pix[xx,yy]
    if aa and rr>75 and rr>gg*2.4 and rr>bb*2.5:
     pix[xx,yy]=(min(255,round(rr*.68+40)),min(255,gg+5),min(255,round(bb*.75+8)),aa)
 for suffix,im in [('upper',up),('lower',lo)]:
  p=O/f'arm_{side}_{suffix}.png';im.save(p);manifest[p.name]=hashlib.sha256(p.read_bytes()).hexdigest()
manifest={'source':'built-in image_gen, one complete continuous sleeve per side','registration':'per-bone similarity using measured generated landmarks and original joints','layers':manifest}
(O/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Four registered generated sleeves; original joints and motions unchanged.')
