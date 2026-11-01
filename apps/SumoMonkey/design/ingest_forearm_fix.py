"""Register accepted ImageGen art as eight coherent upper/lower arm segments.
Keep shoulder/elbow/wrist anchors and all motions/recipes unchanged. Upper arms
include concealed shoulder overlap; reject the swollen front-arm generations.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,shutil
from scipy.ndimage import label
A=Path(__file__).resolve().parents[1];P=A/'design/forearm-fix';B=A.parents[2]/'dist/sumomonkey-forearm-fix/before'
report={};review=Image.new('RGB',(1200,1536),'#efeadc')
for ci,cast in enumerate(['mg','fg']):
 root=A/f'design/sumo_cast/{cast}';layers=root/'layers';j=json.loads((layers/'joints.json').read_text());raw=Image.open(P/f'{cast}-back-raw.png').convert('RGBA');arr=np.asarray(raw).copy()
 # Ingest normalization removes generated soft background/shadow, not anatomy.
 ids,_=label(arr[:,:,3]>=128);sizes=np.bincount(ids.ravel());sizes[0]=0;mask=ids==sizes.argmax();arr[:,:,3]=mask.astype('uint8')*255;arr[~mask,:3]=0;clean=Image.fromarray(arr)
 y,x=np.nonzero(mask);pts=np.column_stack([x,y]);center=pts.mean(0);vals,vec=np.linalg.eigh(np.cov(pts-center,rowvar=False));u=vec[:,-1]
 if u[0]<0:u=-u
 n=np.array([-u[1],u[0]]);p=pts@u;q=pts@n;pmin,pmax=p.min(),p.max();qmid=(q.max()+q.min())/2
 report[cast]={'selected_raw':f'{cast}-back-raw.png','rejected_front_generation':'still segmented/swollen','alpha_ingest_threshold':128,'parts':{}}
 for side,segment in [(s,t) for s in ['front','back'] for t in ['upper','lower']]:
  s='F' if side=='front' else 'B';e=np.array(list(j[('shoulder' if segment=='upper' else 'elbow')+s].values()));w=np.array(list(j[('elbow' if segment=='upper' else 'wrist')+s].values()));v=w-e;L=np.linalg.norm(v);v=v/L;t=np.array([-v[1],v[0]])
  proximal=100 if segment=='upper' else 35;axial=(L+proximal+30)/(pmax-pmin);cross=((165 if cast=='mg' else 140) if segment=='upper' else (96 if cast=='mg' else 80))/(q.max()-q.min());M=axial*np.outer(v,u)+cross*np.outer(t,n);T=e-v*proximal-M@(u*pmin+n*qmid);I=np.linalg.inv(M);shift=-I@T
  output=clean.transform((1024,1536),Image.Transform.AFFINE,(I[0,0],I[0,1],shift[0],I[1,0],I[1,1],shift[1]),Image.Resampling.BICUBIC)
  # Final native-resolution alpha stays antialiased; isolated subpixel islands
  # are checked by the layer audit, not hidden with overlays or rest-pose cuts.
  output.save(P/f'{cast}-{side}-{segment}-registered.png');output.save(layers/f'arm_{side}_{segment}.png')
  report[cast]['parts'][side+'_'+segment]={'matrix':M.tolist(),'translation':T.tolist(),'bbox':output.getbbox(),'proximal_joint':'shoulder' if segment=='upper' else 'elbow','distal_joint':'elbow' if segment=='upper' else 'wrist','proximal':e.tolist(),'distal':w.tolist()}
 full=Image.new('RGBA',(1024,1536));order=json.loads((layers/'layers.json').read_text())['order']
 for part in order:full.alpha_composite(Image.open(layers/f'{part}.png').convert('RGBA'))
 full.save(root/'full.png')
 old=Image.open(B/f'design/sumo_cast/{cast}/full.png').convert('RGBA')
 for i,im in enumerate([old,full]):
  thumb=im.copy();thumb.thumbnail((580,1450));review.paste(thumb,(ci*600+i*300,40),thumb) if False else None
 # Full-resolution arm comparison, one row per cast.
 for i,im in enumerate([old,full]):
  arm=im.crop((80,330,995,790));arm.thumbnail((580,700));review.paste(arm,(i*600,ci*768+90),arm)
  ImageDraw.Draw(review).text((i*600+15,ci*768+20),cast.upper()+(' BEFORE' if i==0 else ' AFTER'),fill='#282828')
(P/'registration.json').write_text(json.dumps(report,indent=2));review.save(P/'assembled-arm-review.png');print('Registered coherent upper/lower arms; unchanged joints/recipes')
