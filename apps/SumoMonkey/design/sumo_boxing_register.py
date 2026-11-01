"""Register one independently delivered part to its unified source; stage only.
Similarity transform (scale+rotation+translation) preserves proportions.
Never installs or overwrites cast files. Review the overlay before ownership masks.
"""
from pathlib import Path
from PIL import Image
import numpy as np,json,argparse
from skimage.feature import SIFT,match_descriptors
from skimage.measure import ransac
from skimage.transform import SimilarityTransform
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);p.add_argument('--reference',type=Path,required=True);p.add_argument('--roi',required=True);p.add_argument('--out',type=Path,required=True);args=p.parse_args()
src=Image.open(args.source).convert('RGBA');ref=Image.open(args.reference).convert('RGBA');x,y,w,h=map(int,args.roi.split(','))
def gray(im):
 a=np.array(im);return (a[:,:,:3]@np.array([.2126,.7152,.0722])/255)*(a[:,:,3]/255)
sift1=SIFT(upsampling=1);sift1.detect_and_extract(gray(src));sift2=SIFT(upsampling=1);sift2.detect_and_extract(gray(ref.crop((x,y,x+w,y+h))))
matches=match_descriptors(sift1.descriptors,sift2.descriptors,max_ratio=.72,cross_check=True)
a=sift1.keypoints[matches[:,0]][:,::-1];b=sift2.keypoints[matches[:,1]][:,::-1]+[x,y]
if len(a)<4:raise ValueError(f'Only {len(a)} texture matches; manual landmarks required')
model,inliers=ransac((a,b),SimilarityTransform,min_samples=3,residual_threshold=5,max_trials=3000,random_state=42)
if inliers.sum()<4:raise ValueError('Insufficient robust feature support')
M=model.params;inv=np.linalg.inv(M)
warped=src.transform(ref.size,Image.Transform.AFFINE,tuple(inv[:2].ravel()),Image.Resampling.BICUBIC)
args.out.mkdir(parents=True,exist_ok=True);warped.save(args.out/'registered_generated.png')
bg=Image.new('RGBA',ref.size,'#efeadc');base=bg.copy();base.alpha_composite(ref);over=bg.copy();over.alpha_composite(warped)
blend=Image.blend(base,over,.5);blend.save(args.out/'registration_overlay.png')
side=Image.new('RGB',(ref.width*2,ref.height),'#efeadc');side.paste(base,(0,0));side.paste(over,(ref.width,0));side.save(args.out/'registration_side.png')
error=np.linalg.norm(model(a[inliers])-b[inliers],axis=1)
report={'source':str(args.source),'reference':str(args.reference),'roi':[x,y,w,h],'matches':len(matches),'inliers':int(inliers.sum()),'median_error_px':float(np.median(error)),'scale':float(model.scale),'rotation_deg':float(np.rad2deg(model.rotation)),'matrix':M.tolist(),'status':'registration candidate only; visible ownership masks and paintbehind are separate'}
(args.out/'registration.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
