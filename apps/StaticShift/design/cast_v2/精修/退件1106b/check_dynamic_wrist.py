from pathlib import Path
from PIL import Image
import json,numpy as np
from scipy import ndimage as ndi
P=Path(__file__).resolve().parent;ns={'__file__':str(P/'render_actual_elbows.py')};exec((P/'render_actual_elbows.py').read_text().split("for ch in ['dj','host']:")[0].replace("Image.new('RGBA',size,PAPER)","Image.new('RGBA',size)"),ns)
yy,xx=np.ogrid[-5:6,-5:6];disk=xx*xx+yy*yy<=25
for ch in ['dj','host']:
 D=P/'candidate'/ch;J=json.loads((D/'layout.json').read_text())['joints'];L=ns['prep'](D);frames=json.loads((P/(ch+'-actual-frames.json')).read_text())['frames'];out=[]
 for f in frames:
  M=ns['affine'](dict(f['slots'])['arm_r_lower']);W=(M@[*J['wrist_r'],1])[:2];origin=np.round(W-[130,130]);im=ns['draw'](L,f['slots'],origin,(260,260));a=np.array(im);solid=a[:,:,3]>160;edge=solid&ndi.binary_dilation(a[:,:,3]<40,iterations=2);lum=a[:,:,:3]@np.array([.299,.587,.114]);bad=edge&(~ndi.binary_dilation(solid&(lum<90),structure=disk));lab,n=ndi.label(bad,structure=np.ones((3,3)));sizes=np.bincount(lab.ravel());runs=[int(s)for s in sizes[1:]if s>=14]
  if runs:
   out.append({'anim':f['anim'],'time':f['time'],'runs':runs});paper=Image.new('RGBA',im.size,'#e5e2d6');paper.alpha_composite(im);paper.convert('RGB').save(P/(ch+'-dynamic-fail-'+f['anim']+'-'+str(f['time'])+'.jpg'),quality=98)
 (D/'qa/dynamic-wrist-report.json').write_text(json.dumps({'frames':len(frames),'failures':out},indent=2)+'\n');print(ch,'dynamic wrist failures',out,flush=True)
