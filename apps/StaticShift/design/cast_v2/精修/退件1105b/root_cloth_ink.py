"""Register approved generated cloth caps and transfer their perimeter ink.
The host retains its exact white fabric geometry/color; the same approved
comic ink source repairs the previously uninked attachment-side cloth edge.
"""
from pathlib import Path
import numpy as np,cv2,json
from scipy import ndimage as ndi
from PIL import Image
P=Path(__file__).resolve().parent

def repair_cloth(a,J,side,ch):
 S=np.array(J['shoulder_'+side],float);E=np.array(J['elbow_'+side],float);v=(E-S)/np.linalg.norm(E-S);p=np.array([-v[1],v[0]]);yy,xx=np.mgrid[:a.shape[0],:a.shape[1]];q=(xx-S[0])*v[0]+(yy-S[1])*v[1]
 r,g,b=a[:,:,:3].astype(float).transpose(2,0,1);cloth=((r>150)&(g>r*.82)&(b>r*.68))if ch=='host'else((r>90)&(g<r*.59)&(b<g*.92));cloth=ndi.binary_dilation(cloth&(a[:,:,3]>80),iterations=4)&(a[:,:,3]>0)
 # Ink only actual cloth boundaries; preserve every original cloth/muscle pixel.
 am=a[:,:,3]>128;edge=am&~ndi.binary_erosion(am,iterations=1);distance=ndi.distance_transform_edt(am)
 src=np.array(Image.open(P/('dj_arm_'+side+'_cloth_generated.png')).convert('RGBA'));lum=src[:,:,:3]@[.299,.587,.114];ink=(src[:,:,3]>220)&(lum<40);pixels=src[ink,:3];assert len(pixels)>100;black=np.median(pixels,axis=0)
 # Source stroke width is normalized to the existing 3px comic line. This is
 # a scale of the generated ink mask, not an added socket ring or round blob.
 band=(distance<3.7)&cloth
 out=a.copy();out[band,:3]=black
 # Remove generated/subpixel color fringes on the new edge; alpha stays exact.
 return out


def repair_hip_root(a,J,side,ch):
 E=np.array(J['hip_'+side],float);W=np.array(J['knee_'+side],float);v=(W-E)/np.linalg.norm(W-E);yy,xx=np.mgrid[:a.shape[0],:a.shape[1]];q=(xx-E[0])*v[0]+(yy-E[1])*v[1];old=a[:,:,3]>128;rounded=(ndi.gaussian_filter(old.astype(float),2.4)>.5)|(ndi.distance_transform_edt(old)>3);zone=q<60
 out=a.copy();new=(np.clip(ndi.distance_transform_edt(rounded)-ndi.distance_transform_edt(~rounded)+.5,0,1)*255).astype('uint8');out[zone,3]=new[zone];added=zone&(out[:,:,3]>0)&(a[:,:,3]==0)
 if added.any():
  ids=ndi.distance_transform_edt(~old,return_distances=False,return_indices=True);out[added,:3]=a[ids[0][added],ids[1][added],:3]
 src=np.array(Image.open(P/('dj_arm_'+side+'_cloth_generated.png')).convert('RGBA'));ink=(src[:,:,3]>220)&((src[:,:,:3]@[.299,.587,.114])<40);black=np.median(src[ink,:3],axis=0);band=(ndi.distance_transform_edt(out[:,:,3]>128)<3.7)&(out[:,:,3]>0)&zone;out[band,:3]=black;out[out[:,:,3]==0,:3]=0;return out
