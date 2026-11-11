from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from scipy import ndimage as ndi
import numpy as np,json,hashlib,math
from render_core import prep,draw,affine
P=Path(__file__).resolve().parent;F=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',17);yy,xx=np.ogrid[-5:6,-5:6];disk=xx*xx+yy*yy<=25;sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
def check(a):
 solid=a[:,:,3]>160;clear=a[:,:,3]<40;edge=solid&ndi.binary_dilation(clear,iterations=2);lum=a[:,:,:3]@np.array([.299,.587,.114]);bad=edge&~ndi.binary_dilation(solid&(lum<90),structure=disk);bad[:3]=bad[-3:]=False;bad[:,:3]=bad[:,-3:]=False;lab,n=ndi.label(bad,structure=np.ones((3,3)));sizes=np.bincount(lab.ravel());return [int(z)for z in sizes[1:]if z>=14]
for ch in ['dj','host']:
 D=P/'candidate'/ch;J=json.loads((D/'layout.json').read_text())['joints'];L=prep(D);spec=json.loads((P/(ch+'-actual-frames.json')).read_text());outdir=D/'qa/actual-wrists';outdir.mkdir(exist_ok=True);groups={};fails=[]
 for f in spec['frames']:
  tile=Image.new('RGB',(440,270),'#e5e2d6');d=ImageDraw.Draw(tile);d.text((5,3),ch+' '+f['anim']+' '+str(round(f['time'],3))+'s',font=F,fill='#a32727')
  for col,side in enumerate(['l','r']):
   M=affine(dict(f['slots'])['arm_'+side+'_lower']);center=(M@[*J['wrist_'+side],1])[:2];origin=np.round(center-[105,105]);im=draw(L,f['slots'],origin,(210,210),(0,0,0,0));runs=check(np.array(im));paper=Image.new('RGBA',im.size,'#e5e2d6');paper.alpha_composite(im);tile.paste(paper.convert('RGB'),(col*220+5,45));d.text((col*220+5,24),side+' wrist',font=F,fill='#222222')
   if runs:fails.append({'animation':f['anim'],'time':f['time'],'side':side,'uninked_runs':runs});paper.convert('RGB').save(outdir/('FAIL-'+f['anim']+'-'+str(f['time'])+'-'+side+'.jpg'),quality=98)
  groups.setdefault(f['anim'],[]).append(tile)
 for anim,tiles in groups.items():
  out=Image.new('RGB',(6*440,math.ceil(len(tiles)/6)*270),'#e5e2d6')
  for i,tile in enumerate(tiles):out.paste(tile,((i%6)*440,(i//6)*270))
  out.save(outdir/(anim+'.jpg'),quality=98)
 r={'source_layers_sha256':{f.name:sha(f)for f in(D/'layers').glob('*.png')},'spine_r6_sha256':sha(P/'../../spine_r6'/(ch+'_L')/(ch+'.json')),'total_frames':len(spec['frames']),'wrists_per_frame':2,'paper':'#e5e2d6','failures':fails};(outdir/'report.json').write_text(json.dumps(r,indent=2)+'\n');print(ch,'149 original-angle frames, wrist failures:',fails,flush=True)
