from pathlib import Path
import json,shutil
import numpy as np,cv2
from scipy import ndimage as ndi
from PIL import Image
P=Path(__file__).resolve().parent;meta=json.loads((P/'source-mapping.json').read_text());G=Path('/Users/stone/.codex/generated_images/01a1a6d9-fea1-7d42-9fee-d3afd422905e')
manifest=json.loads((P/'generated-files.json').read_text());reports={}
def register(gen,ref,mask=None):
 scale=2;ref2=cv2.resize(ref,None,fx=scale,fy=scale);sift=cv2.SIFT_create();gray=lambda a:cv2.cvtColor(a[:,:,:3],cv2.COLOR_RGB2GRAY);k1,d1=sift.detectAndCompute(gray(gen),gen[:,:,3]);mm=None if mask is None else cv2.resize(mask.astype('uint8')*255,(ref2.shape[1],ref2.shape[0]),interpolation=cv2.INTER_NEAREST);k2,d2=sift.detectAndCompute(gray(ref2),mm);good=[m for m,n in cv2.BFMatcher().knnMatch(d1,d2,k=2)if m.distance<.73*n.distance];assert len(good)>=4,len(good);a=np.float32([k1[m.queryIdx].pt for m in good]);b=np.float32([k2[m.trainIdx].pt for m in good]);M,inl=cv2.estimateAffinePartial2D(a,b,method=cv2.RANSAC,ransacReprojThreshold=5);assert M is not None;M/=scale;out=cv2.warpAffine(gen,M,(ref.shape[1],ref.shape[0]),flags=cv2.INTER_CUBIC);return out,{'matches':len(good),'inliers':int(inl.sum()),'matrix':M.tolist()}
for key,name in manifest.items():
 f=G/name;shutil.copy2(f,P/(key+'_generated.png'));gen=np.array(Image.open(f).convert('RGBA'))
 if key.endswith('_upper_context'):
  ch=key.split('_')[0];ref=np.array(Image.open(P/'baseline'/ch/'assembled.png').convert('RGBA'));H,W=ref.shape[:2];yy,xx=np.mgrid[:H,:W];mask=(ref[:,:,3]>180)&((yy<350)|(yy>650)|((xx>420)&(xx<640)))
  reg,report=register(gen,ref,mask);Image.fromarray(reg).save(P/(key+'_full_registered.png'));reports[key]=report
  for side in ['l','r']:
   n=f'{ch}_arm_{side}';old=np.array(Image.open(P/(n+'_input.png')).convert('RGBA'));M=np.array(meta[n]['matrix']);g=cv2.warpAffine(reg,M,(512,640),flags=cv2.INTER_CUBIC);r,gr,b=g[:,:,:3].astype(float).transpose(2,0,1);yy,xx=np.mgrid[:640,:512];warm=(r>85)&(gr>r*(.58 if ch=='dj'else .47))&(gr<r*.83)&(b<gr*.94)&(b>gr*.32)&(g[:,:,3]>200)&(np.hypot(xx-256,yy-480)<110)
   lab,num=ndi.label(warm);counts=np.bincount(lab.ravel());counts[0]=0;best=None
   for i in range(1,num+1):
    if counts[i]<15:continue
    Y,X=np.where(lab==i);distance=float(np.min(np.hypot(X-256,Y-480)));score=distance-counts[i]*.0001
    if best is None or score<best[0]:best=(score,i)
   assert best is not None,(n,'no elbow skin generated');skin=ndi.binary_fill_holes(lab==best[1]);border=ndi.binary_dilation(skin,iterations=5)&((g[:,:,:3]@[.299,.587,.114])<65)&(g[:,:,3]>100);alpha=skin|border
   # Keep original sleeve, and replace only the distal anatomical tip.
   start=360 if ch=='dj'and side=='r'else 400;w=np.clip((yy-start)/16,0,1);base=old.copy();base[:,:,3]=(base[:,:,3]*(1-w)).astype('uint8');patch=g.copy();patch[:,:,3]=(patch[:,:,3]*alpha*w).astype('uint8');out=np.array(Image.alpha_composite(Image.fromarray(base),Image.fromarray(patch)))
   r,gr,b=old[:,:,:3].astype(float).transpose(2,0,1);cloth=((r>150)&(gr>r*.82)&(b>r*.68))if ch=='host'else((r>90)&(gr<r*.59)&(b<gr*.92));cloth=ndi.binary_dilation(cloth&(old[:,:,3]>80),iterations=4)&(old[:,:,3]>0);out[cloth]=old[cloth];out[out[:,:,3]==0,:3]=0;Image.fromarray(out).save(P/(n+'_registered.png'))
 else:
  ref=np.array(Image.open(P/(key+'_input.png')).convert('RGBA'));yy,xx=np.mgrid[:ref.shape[0],:ref.shape[1]];mask=(ref[:,:,3]>180)&(yy<405);reg,report=register(gen,ref,mask);Image.fromarray(reg).save(P/(key+'_registered.png'));reports[key]=report
(P/'registration-report.json').write_text(json.dumps(reports,indent=2))
for n in meta:
 f=P/(n+'_registered.png')
 if f.exists():
  im=Image.open(f);bg=Image.new('RGBA',im.size,'#e5e2d6');bg.alpha_composite(im);bg.convert('RGB').save(P/(n+'_registered-paper.jpg'))
print(reports)
