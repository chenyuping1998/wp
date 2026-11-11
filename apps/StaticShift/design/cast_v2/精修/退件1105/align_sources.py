from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np, cv2, ast, json, shutil
P=Path(__file__).resolve().parent
sources={'dj_neck':'exec-c185896f-02bc-4215-ad9e-e8274ba1d9d9.png','dj_r':'exec-56b9528a-871c-4f7c-92ee-5de54c1ed719.png','dj_l':'exec-db1d94a4-368f-4b2d-88ce-969dc1f0647e.png','host_r':'exec-683ea525-ab00-472e-ace6-3ae0ff41ca83.png','host_l':'exec-43ac99d0-d51f-430f-bb3a-ac3324f2bedd.png','dj_waist':'exec-96bff4a2-b5b8-4f0b-a969-feae9f5c312b.png'}
G=Path('/Users/stone/.codex/generated_images/01a1a6d9-fea1-7d42-9fee-d3afd422905e')
for n,f in sources.items():
 if not (G/f).exists():continue
 shutil.copy2(G/f,P/(n+'_generated.png'))
 ref=np.array(Image.open(P/(n+'_context.png')).convert('RGBA'));gen=np.array(Image.open(G/f).convert('RGBA'));h,w=ref.shape[:2]
 # Feature registration uses unchanged folds and fingers, not repaired edges.
 scale=4;ref4=cv2.resize(ref,(w*scale,h*scale));sift=cv2.SIFT_create();gray=lambda a:cv2.cvtColor(a[:,:,:3],cv2.COLOR_RGB2GRAY)
 k1,d1=sift.detectAndCompute(gray(gen),gen[:,:,3]);k2,d2=sift.detectAndCompute(gray(ref4),ref4[:,:,3]);matches=cv2.BFMatcher().knnMatch(d1,d2,k=2);good=[m for m,n2 in matches if m.distance<.72*n2.distance]
 a=np.float32([k1[m.queryIdx].pt for m in good]);b=np.float32([k2[m.trainIdx].pt for m in good]);M,inl=cv2.estimateAffine2D(a,b,method=cv2.RANSAC,ransacReprojThreshold=8);M/=scale
 reg=cv2.warpAffine(gen,M,(w,h),flags=cv2.INTER_LANCZOS4);Image.fromarray(reg).save(P/(n+'_registered.png'))
 bg=Image.new('RGBA',(w*3,h),'#e5e2d6');bg.alpha_composite(Image.fromarray(ref),(0,0));bg.alpha_composite(Image.fromarray(reg),(w,0));mix=Image.blend(Image.fromarray(ref),Image.fromarray(reg),.5);bg.alpha_composite(mix,(w*2,0));bg.convert('RGB').save(P/(n+'_registration.jpg'))
 print(n,len(good),int(inl.sum()),M.tolist())
