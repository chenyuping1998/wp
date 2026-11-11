from pathlib import Path
import numpy as np,cv2,json
from scipy import ndimage as ndi
from PIL import Image
P=Path(__file__).resolve().parent.parent;Q=P/'followup';Y,X=np.mgrid[:1536,:1024]
def array(f):return np.array(Image.open(f).convert('RGBA'))
def fit_generated(f,box):
 im=Image.open(f).convert('RGBA');b=im.getchannel('A').point(lambda x:255 if x>80 else 0).getbbox();im=im.crop(b);a=np.array(im).astype('float32')/255;a[:,:,:3]*=a[:,:,3:4];z=cv2.resize(a,(box[2]-box[0],box[3]-box[1]),interpolation=cv2.INTER_AREA);al=z[:,:,3:4].copy();z[:,:,:3]=np.where(al>1e-6,z[:,:,:3]/np.maximum(al,1e-6),0);z[:,:,3:4]=al.clip(0,1);out=np.zeros((1536,1024,4),'uint8');out[box[1]:box[3],box[0]:box[2]]=(z.clip(0,1)*255).round().astype('uint8');return out
# HOST: use the newly painted high-resolution contour once, never stretch low-resolution old ink.
old=array(P/'candidate/host/layers/arm_r_lower.png');Image.fromarray(old).save(Q/'host-arm-before-followup.png');a=fit_generated(Q/'host_forearm-generated.png',(701,474,769,582));E=np.array([729,566]);W=np.array([733,482]);v=(W-E)/np.linalg.norm(W-E);q=(X-E[0])*v[0]+(Y-E[1])*v[1];solid=a[:,:,3]>100;dist=ndi.distance_transform_edt(solid);edge=solid&(dist<=2.3)&(q>2);a[edge,:3]=[14,9,6]
# No grey or pale fringe: continue the painted contour RGB into its antialias pixels.
soft=(a[:,:,3]>0)&(a[:,:,3]<=100)&(q>2);a[soft,:3]=[14,9,6];lum=a[:,:,:3]@np.array([.299,.587,.114]);skin=(lum>90)&(a[:,:,3]>0);w=np.clip((24-q)/24,0,1);w=w*w*(3-2*w);rgb=a[:,:,:3]*(1-w[:,:,None])+np.array([192,116,65])*w[:,:,None];a[skin,:3]=rgb.clip(0,255).round().astype('uint8')[skin];a[(q<2)&(a[:,:,3]>0),:3]=[192,116,65];a[a[:,:,3]==0,:3]=0;Image.fromarray(a).save(P/'candidate/host/layers/arm_r_lower.png')
# HOST GRIP: the old hand carries a residual forearm stub below its wrist bangles.
# Only this local skin-root mask is changed; fingers, microphone and bangles are immutable.
a=array(P/'baseline/host/layers/hand_r_grip.png');g=fit_generated(Q/'host_grip-generated.png',(672,315,775,526));R,G,B=a[:,:,:3].astype(float).transpose(2,0,1);skin=(R>100)&(G>55)&(G<165)&(B<135)&(R>1.35*G)&(a[:,:,3]>100);root=skin&(Y>=503)&(X>=720)&(X<=765);root=ndi.binary_fill_holes(ndi.binary_closing(root,iterations=3));root=ndi.binary_dilation(root,iterations=3)&(Y>=503)&(X>=720)&(X<=765)&(a[:,:,3]>0);gold=(R>165)&(G>120)&(B<115)&(G>R*.65)&(Y>475);protected=ndi.binary_dilation(gold,iterations=3);root&=~protected;distance=ndi.distance_transform_edt(~gold);keep=np.clip((8-distance)/2,0,1);out=a.copy();out[root,:3]=g[root,:3];out[root,3]=np.rint(a[root,3]*keep[root]).astype('uint8')
# Match the retained tiny concealed underpaint, removing the old stray black slash.
out[root&(out[:,:,3]>0),:3]=[192,116,65];out[out[:,:,3]==0,:3]=0;lab,k=ndi.label(out[:,:,3]>0);sz=np.bincount(lab.ravel());sz[0]=0;out[lab!=sz.argmax()]=0
changed=np.any(out!=a,axis=2);assert not changed[~root].any();assert not changed[protected].any();Image.fromarray(root.astype('uint8')*255).save(Q/'host-grip-permitted-root-mask.png');Image.fromarray(protected.astype('uint8')*255).save(Q/'host-grip-immutable-bangles-mask.png');Image.fromarray(out).save(P/'candidate/host/layers/hand_r_grip.png');print('host grip root changed pixels',changed.sum(),'other pixels, including bangles, exact',flush=True)
# DJ: take only the painted rounded inner cuff/elbow corner and shoulder fringe cleanup.
a=array(P/'candidate/dj/layers/arm_r_upper.png');Image.fromarray(a).save(Q/'dj-upper-before-followup.png');g=fit_generated(Q/'dj_upper-generated.png',(671,383,781,590));S=np.array([681,399]);E=np.array([757,567]);v=(E-S)/np.linalg.norm(E-S);q=(X-S[0])*v[0]+(Y-S[1])*v[1];rootzone=(q<34)&(((X-S[0])**2+(Y-S[1])**2)<65**2);notchzone=((X-727)**2+(Y-529)**2)<23**2
# Original red sleeve/cuff stays exact outside shoulder fringe and this small flesh corner.
for mask in [rootzone,notchzone]:
 a[mask]=g[mask]
# Single source part; no transparent RGB or crumbs.
lab,k=ndi.label(a[:,:,3]>0);sz=np.bincount(lab.ravel());sz[0]=0;a[lab!=sz.argmax()]=0;a[a[:,:,3]==0,:3]=0;Image.fromarray(a).save(P/'candidate/dj/layers/arm_r_upper.png')
for ch in ['dj','host']:
 D=P/'candidate'/ch;j=json.loads((D/'layout.json').read_text());full=Image.new('RGBA',(1024,1536))
 for name in j['draw_order']:full.alpha_composite(Image.open(D/'layers'/(name+'.png')))
 full.save(D/'assembled.png');full.save(D/'master.png')
