from pathlib import Path
import json,math,hashlib
import numpy as np,cv2
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent;PAPER='#e5e2d6';F=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',17)
def affine(vals):a,b,c,d,e,f=vals;return np.array([[a,b,e],[c,d,f],[0,0,1.]])
def prep(D):
 out={}
 for f in (D/'layers').glob('*.png'):
  im=Image.open(f).convert('RGBA');b=im.getbbox();a=np.array(im.crop(b)).astype('float32')/255;a[:,:,:3]*=a[:,:,3:4];out[f.stem]=(a,b)
 return out
def draw(L,slots,origin,size):
 out=Image.new('RGBA',size,PAPER)
 for n,vals in slots:
  a,b=L[n];M=affine(vals);corners=np.array([[b[0],b[1],1],[b[2],b[1],1],[b[2],b[3],1],[b[0],b[3],1]]);Q=(corners@M.T)[:,:2]-origin
  if(Q.max(axis=0)<0).any()or(Q.min(axis=0)>np.array(size)).any():continue
  M[:2,2]+=M[:2,:2]@np.array(b[:2])-origin;z=cv2.warpAffine(a,M[:2],size,flags=cv2.INTER_CUBIC);raw=z[:,:,3:4].copy();z[:,:,:3]=np.where(raw>1e-6,z[:,:,:3]/np.maximum(raw,1e-6),0);z[:,:,3:4]=raw.clip(0,1);out.alpha_composite(Image.fromarray((z.clip(0,1)*255).round().astype('uint8')))
 return out
for ch in ['dj','host']:
 D=P/'candidate'/ch;outdir=D/'qa/actual-motions';outdir.mkdir(exist_ok=True);spec=json.loads((P/(ch+'-actual-frames.json')).read_text());J=json.loads((D/'layout.json').read_text())['joints'];L=prep(D);source_hashes={f.name:hashlib.sha256(f.read_bytes()).hexdigest()for f in (D/'layers').glob('*.png')};groups={};report=[]
 for frame in spec['frames']:
  slots=frame['slots'];tile=Image.new('RGB',(420,245),PAPER);d=ImageDraw.Draw(tile);d.text((4,2),ch+' '+frame['anim']+' '+str(round(frame['time'],2))+'s',font=F,fill='#a41e1e');centers={}
  for i,side in enumerate(['l','r']):
   M=affine(dict(slots)[f'arm_{side}_upper']);E=np.array([*J['elbow_'+side],1]);center=(M@E)[:2];origin=np.round(center-np.array([100,100]));crop=draw(L,slots,origin,(200,200));tile.paste(crop.convert('RGB'),(i*210+5,35));d.text((i*210+5,20),side+' elbow',font=F,fill='#222222');centers[side]=center.tolist()
  groups.setdefault(frame['anim'],[]).append(tile);report.append({'anim':frame['anim'],'time':frame['time'],'centers':centers})
 for anim,tiles in groups.items():
  sheet=Image.new('RGB',(6*420,math.ceil(len(tiles)/6)*245),PAPER)
  for i,tile in enumerate(tiles):sheet.paste(tile,((i%6)*420,(i//6)*245))
  sheet.save(outdir/(anim+'.jpg'),quality=98)
 # Selected actual frames full body, source pixels at 1:1 native scale.
 for anim,time in [('gaze',.84),('win_big',.6),('win_big_loop',.48)]:
  f=min([f for f in spec['frames']if f['anim']==anim],key=lambda f:abs(f['time']-time));im=draw(L,f['slots'],np.array([0,0]),(2200,2300));im.convert('RGB').save(outdir/(anim+'-native.jpg'),quality=97)
 (outdir/'report.json').write_text(json.dumps({'source':'r6 actual Spine JSON, unchanged bones/animations/angles','source_layers_sha256':source_hashes,'spine_json_sha256':hashlib.sha256((P/'../../spine_r6'/ (ch+'_L')/(ch+'.json')).read_bytes()).hexdigest(),'sampling_step_seconds':.1,'frames':report,'total_frames':len(report),'paper':PAPER},indent=2)+'\n');print(ch,'rendered',len(report),'actual frames, both elbows',flush=True)
