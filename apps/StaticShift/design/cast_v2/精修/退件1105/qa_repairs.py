from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw,ImageFont
import numpy as np
from scipy import ndimage as ndi
P=Path(__file__).resolve().parent;ROOT=P.parents[1]
for name in ['check_overlap.py','check_joint_art.py','native_joint_checks.py']:
 s=(ROOT/name).read_text();s=s.replace("Path(__file__).resolve().parent/'精修/v1'",repr(str(P/'candidate')))
 # assignment must remain Path, not str
 s=s.replace("P="+repr(str(P/'candidate')),"P=Path("+repr(str(P/'candidate'))+")")
 s=s.replace("ROOT/'精修/v1'/ch","Path("+repr(str(P/'candidate'))+")/ch")
 s=s.replace("'#171b24'","'#e5e2d6'").replace("'#888888'","'#e5e2d6'").replace("'#eeeeea'","'#222222'").replace("'#eeeeea'","'#222222'").replace("'#eeeeea'","'#222222'")
 if name=='check_joint_art.py':
  insert='''
  import sys
  sys.path.insert(0,str(Path(__file__).resolve().parent/'精修/退件1105'))
  from art_skinning import deform
  skin=None
  for side in ['l','r']:
   if name=='arm_'+side+'_upper':skin=(np.eye(3),trans[name],J['shoulder_'+side],np.array(J['elbow_'+side])-J['shoulder_'+side],70)
   if name=='arm_'+side+'_lower':skin=(trans['arm_'+side+'_upper'],trans[name],J['elbow_'+side],np.array(J['wrist_'+side])-J['elbow_'+side],30)
   if name=='leg_'+side+'_upper':skin=(np.eye(3),trans[name],J['hip_'+side],np.array(J['knee_'+side])-J['hip_'+side],90)
   if name=='leg_'+side+'_lower':skin=(trans['leg_'+side+'_upper'],trans[name],J['knee_'+side],np.array(J['ankle_'+side])-J['knee_'+side],80)
   if name=='foot_'+side:skin=(trans['leg_'+side+'_lower'],trans[name],J['ankle_'+side],[0,1],60)
  if skin and not np.allclose(skin[0],skin[1]):part=deform(im,canvas.size,*skin,np.array([280,500]))
  canvas.alpha_composite(part)
'''
  s=s.replace('canvas.alpha_composite(part)',insert)
  s=s.replace('static source articulation check','weighted source articulation proof')
 exec(compile(s,str(ROOT/name),'exec'),{'__file__':str(ROOT/name),'__name__':'repair_qa'})
for ch in ['dj','host']:
 B=P/'修前交件'/ch;D=P/'candidate'/ch;out={};tiles=[]
 for f in sorted((D/'layers').glob('*.png')):
  a=np.array(Image.open(f).convert('RGBA'));old=np.array(Image.open(B/'layers'/f.name));delta=old[:,:,3].astype(int)-a[:,:,3].astype(int);removed=delta>16;added=delta< -16
  lab,n=ndi.label(a[:,:,3]>0);sizes=np.bincount(lab.ravel())[1:];assert (sizes>4).sum()==1,(ch,f.name,sizes)
  # Export every final layer on the requested paper and dark backgrounds.
  view=Image.new('RGBA',(2048,1536),'#e5e2d6');view.alpha_composite(Image.fromarray(a));view.alpha_composite(Image.new('RGBA',(1024,1536),'#171b24'),(1024,0));view.alpha_composite(Image.fromarray(a),(1024,0));view.convert('RGB').save(D/'qa'/(f.stem+'-light-dark.jpg'),quality=94)
  if np.array_equal(a,old):continue
  mask=removed|added;ys,xs=np.where(mask);b=(max(0,xs.min()-20),max(0,ys.min()-20),min(1024,xs.max()+21),min(1536,ys.max()+21)) if len(xs) else Image.fromarray(a).getbbox()
  # Every connected removed region shown at native size plus labeled full crop.
  sheet=Image.new('RGBA',(1024,500),'#e5e2d6')
  for i,ar in enumerate([old,a]):
   im=Image.fromarray(ar).crop(b);im.thumbnail((320,450));sheet.alpha_composite(im,(i*340,35))
  diff=old.copy();diff[removed,:3]=[225,35,50];diff[added,:3]=[20,130,80];im=Image.fromarray(diff).crop(b);im.thumbnail((320,450));sheet.alpha_composite(im,(680,35));ImageDraw.Draw(sheet).text((5,5),f.stem+' | BEFORE / AFTER / red removed, green added',fill='black');sheet.convert('RGB').save(D/'qa'/(f.stem+'-alpha-diff.jpg'))
  out[f.stem]={'removed_alpha_px':int(removed.sum()),'added_alpha_px':int(added.sum()),'before_sha256':hashlib.sha256((B/'layers'/f.name).read_bytes()).hexdigest(),'after_sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
  tile=Image.new('RGBA',(700,330),'#e5e2d6');crop=Image.fromarray(a).crop(Image.fromarray(a).getbbox());crop.thumbnail((320,290));tile.alpha_composite(crop,(10,30));dark=Image.new('RGBA',(350,330),'#171b24');dark.alpha_composite(crop,(10,30));tile.alpha_composite(dark,(350,0));ImageDraw.Draw(tile).text((5,5),f.stem,fill='black');tiles.append(tile)
  Image.fromarray((removed.astype('uint8')*255)).save(D/'qa'/(f.stem+'-removed-alpha.png'))
 sheet=Image.new('RGBA',(1400,((len(tiles)+1)//2)*330),'#e5e2d6')
 for i,t in enumerate(tiles):sheet.alpha_composite(t,((i%2)*700,(i//2)*330))
 sheet.convert('RGB').save(D/'qa/repaired-layer-contact.jpg');(D/'qa/repair-alpha-report.json').write_text(json.dumps(out,indent=2)+'\n')
 print(ch,'modified',list(out))
