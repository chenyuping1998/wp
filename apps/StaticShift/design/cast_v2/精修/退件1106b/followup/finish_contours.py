from pathlib import Path
from PIL import Image
import numpy as np,cv2,json
from scipy import ndimage as ndi
P=Path(__file__).resolve().parent.parent;Q=P/'followup';H,W=1536,1024;Y,X=np.mgrid[:H,:W]
def save(a,f):
 lab,n=ndi.label(a[:,:,3]>0);sz=np.bincount(lab.ravel());sz[0]=0;a[lab!=sz.argmax()]=0;a[a[:,:,3]==0,:3]=0;Image.fromarray(a).save(f)
def smooth_alpha(a,b,sigma,scale=6):
 crop=a[b[1]:b[3],b[0]:b[2],3].astype(float)/255;z=cv2.resize(crop,((b[2]-b[0])*scale,(b[3]-b[1])*scale),interpolation=cv2.INTER_CUBIC);z=ndi.gaussian_filter(z,sigma*scale);mask=z>.5;return mask
# Preserve the previously joint-fitted organic silhouette, use new generated volume/shading.
old=np.array(Image.open(Q/'host-arm-before-followup.png').convert('RGBA'));b=(691,464,779,592);sc=6;mask=smooth_alpha(old,b,.65,sc);hh,ww=mask.shape;y,x=np.mgrid[:hh,:ww];srcX=b[0]+(x+.5)/sc;srcY=b[1]+(y+.5)/sc
im=Image.open(Q/'host_forearm-generated.png').convert('RGBA');bb=im.getchannel('A').point(lambda a:255 if a>80 else 0).getbbox();g=np.array(im.crop(bb));gh,gw=g.shape[:2];left=[];right=[]
for row in range(gh):
 ids=np.where(g[row,:,3]>120)[0];left.append(ids.min()if len(ids)else np.nan);right.append(ids.max()if len(ids)else np.nan)
valid=np.isfinite(left);left=np.interp(np.arange(gh),np.where(valid)[0],np.array(left)[valid]);right=np.interp(np.arange(gh),np.where(valid)[0],np.array(right)[valid]);oldL=[];oldR=[]
for row in range(hh):
 ids=np.where(mask[row])[0];oldL.append(ids.min()if len(ids)else np.nan);oldR.append(ids.max()if len(ids)else np.nan)
valid=np.isfinite(oldL);oldL=np.interp(np.arange(hh),np.where(valid)[0],np.array(oldL)[valid]);oldR=np.interp(np.arange(hh),np.where(valid)[0],np.array(oldR)[valid]);my=np.clip((srcY-474)/108*(gh-1),0,gh-1);gl=np.interp(my.ravel(),np.arange(gh),left).reshape(my.shape);gr=np.interp(my.ravel(),np.arange(gh),right).reshape(my.shape);u=(x-np.array(oldL)[:,None])/np.maximum((np.array(oldR)-oldL)[:,None],1);mx=gl+u*(gr-gl);rgb=cv2.remap(g[:,:,:3].astype('float32'),mx.astype('float32'),my.astype('float32'),cv2.INTER_CUBIC);rgb+=np.array([12,4,-2]);rgb=rgb.clip(0,255);E=np.array([729,566]);V=np.array([4,-84.])/np.hypot(4,84);q=(srcX-E[0])*V[0]+(srcY-E[1])*V[1];r=np.hypot(srcX-E[0],srcY-E[1]);w=np.clip((25-q)/25,0,1);w=w*w*(3-2*w);rgb=rgb*(1-w[:,:,None])+[192,116,65]*w[:,:,None]
dist=ndi.distance_transform_edt(mask)/sc;hidden=(q<1.2)&(r<16);edge=mask&(dist<=2.4)&~hidden;rgb[edge]=[12,7,4];rgb[hidden]=[192,116,65];z=np.dstack([rgb,mask.astype(float)*255]);z[:,:,:3]*=z[:,:,3:4]/255;z=cv2.resize(z,(b[2]-b[0],b[3]-b[1]),interpolation=cv2.INTER_AREA);alpha=z[:,:,3:4];z[:,:,:3]=np.where(alpha>1e-6,z[:,:,:3]/np.maximum(alpha,1e-6)*255,0);out=np.zeros((H,W,4),'uint8');out[b[1]:b[3],b[0]:b[2]]=z.clip(0,255).round().astype('uint8');save(out,P/'candidate/host/layers/arm_r_lower.png')
# DJ: clean the existing rounded shoulder cap without moving cuff/folds, round only the small inward corner.
a=np.array(Image.open(Q/'dj-upper-before-followup.png').convert('RGBA'));orig=a.copy();b=(650,365,795,605);mask=smooth_alpha(a,b,.95,sc);yy,xx=np.mgrid[:mask.shape[0],:mask.shape[1]];px=b[0]+(xx+.5)/sc;py=b[1]+(yy+.5)/sc;S=np.array([681,399]);E=np.array([757,567]);v=(E-S)/np.linalg.norm(E-S);q=(px-S[0])*v[0]+(py-S[1])*v[1];notch=(px-727)**2+(py-529)**2<24**2;root=(q<45)&((px-S[0])**2+(py-S[1])**2<65**2);zone=root|notch
# Original unmodified RGB inside; generated underpaint supplies newly exposed skin at the rounded corner.
g=np.array(Image.open(Q/'dj_upper-generated.png').convert('RGBA'));bb=Image.fromarray(g[:,:,3]).point(lambda z:255 if z>80 else 0).getbbox();g=g[bb[1]:bb[3],bb[0]:bb[2]];g=cv2.resize(g,(110*sc,207*sc),interpolation=cv2.INTER_CUBIC);paint=np.zeros((240*sc,145*sc,4),'uint8');paint[(383-365)*sc:(590-365)*sc,(671-650)*sc:(781-650)*sc]=g
z=cv2.resize(a[b[1]:b[3],b[0]:b[2]],(145*sc,240*sc),interpolation=cv2.INTER_NEAREST).astype(float);z[zone,3]=mask[zone]*255;oldsolid=z[:,:,3]>127;dist=ndi.distance_transform_edt(mask)/sc;oldcrop=cv2.resize(orig[b[1]:b[3],b[0]:b[2],3],(145*sc,240*sc),interpolation=cv2.INTER_NEAREST)>160;olddist=ndi.distance_transform_edt(oldcrop)/sc;oldedge=(olddist<=3.5);newinside=zone&notch&mask&(dist>2.3)&oldedge;z[newinside,:3]=paint[newinside,:3];z[zone&mask&(dist<=2.3),:3]=[10,5,3];z[zone&(~mask),:3]=0
# Premultiplied downsample, update only the two local areas.
z[:,:,:3]*=z[:,:,3:4]/255;z=cv2.resize(z,(145,240),interpolation=cv2.INTER_AREA);al=z[:,:,3:4];z[:,:,:3]=np.where(al>1e-6,z[:,:,:3]/np.maximum(al,1e-6)*255,0);z=z.clip(0,255).round().astype('uint8');local=(X[b[1]:b[3],b[0]:b[2]]-727)**2+(Y[b[1]:b[3],b[0]:b[2]]-529)**2<25**2;qq=(X[b[1]:b[3],b[0]:b[2]]-S[0])*v[0]+(Y[b[1]:b[3],b[0]:b[2]]-S[1])*v[1];local|=(qq<45)&((X[b[1]:b[3],b[0]:b[2]]-S[0])**2+(Y[b[1]:b[3],b[0]:b[2]]-S[1])**2<66**2);part=a[b[1]:b[3],b[0]:b[2]];part[local]=z[local];a[b[1]:b[3],b[0]:b[2]]=part;save(a,P/'candidate/dj/layers/arm_r_upper.png')
for ch in ['dj','host']:
 D=P/'candidate'/ch;j=json.loads((D/'layout.json').read_text());full=Image.new('RGBA',(1024,1536))
 for n in j['draw_order']:full.alpha_composite(Image.open(D/'layers'/(n+'.png')))
 full.save(D/'assembled.png');full.save(D/'master.png')
print('Final generated shading and smooth ink contours installed; wrist-only hand repair retained',flush=True)
