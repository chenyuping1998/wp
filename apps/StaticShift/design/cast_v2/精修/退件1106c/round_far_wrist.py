from pathlib import Path
from PIL import Image
from scipy import ndimage as ndi
import numpy as np,cv2,json
P=Path(__file__).resolve().parent;D=P/'candidate/host';a=np.array(Image.open(D/'layers/arm_l_lower.png'));J=json.loads((D/'layout.json').read_text())['joints'];W=np.array(J['wrist_l']);E=np.array(J['elbow_l']);v=(W-E)/np.linalg.norm(W-E);n=np.array([-v[1],v[0]]);sc=8;M=np.array([[*(v*sc),50*sc-sc*v@W],[*(n*sc),60*sc-sc*n@W]]);z=cv2.warpAffine(a[:,:,3],M,(100*sc,120*sc),flags=cv2.INTER_LINEAR);solid=z>127;lo=[];hi=[]
for col in range(100*sc):
 ys=np.where(solid[:,col])[0];lo.append(ys.min()if len(ys)else np.nan);hi.append(ys.max()if len(ys)else np.nan)
cols=np.arange(100*sc);valid=np.isfinite(lo);lo=np.interp(cols,cols[valid],np.array(lo)[valid]);hi=np.interp(cols,cols[valid],np.array(hi)[valid]);low=ndi.gaussian_filter1d(lo,3.2*sc);high=ndi.gaussian_filter1d(hi,3.2*sc);qq=(cols-50*sc)/sc;blend=np.clip((qq+30)/8,0,1)*np.clip((18-qq)/6,0,1);blend=blend*blend*(3-2*blend);lo=lo*(1-blend)+low*blend;hi=hi*(1-blend)+high*blend
# Paint the final small wrist contour at high resolution; no hard corner/chord cuts.
b=(W[0]-60,W[1]-60,W[0]+60,W[1]+60);Y,X=np.mgrid[:120*sc,:120*sc];px=b[0]+(X+.5)/sc;py=b[1]+(Y+.5)/sc;q=(px-W[0])*v[0]+(py-W[1])*v[1];t=(px-W[0])*n[0]+(py-W[1])*n[1];l=np.interp(q.ravel(),qq,lo).reshape(q.shape)/sc-60;h=np.interp(q.ravel(),qq,hi).reshape(q.shape)/sc-60;mask=(t>=l)&(t<=h);near=np.minimum(t-l,h-t);rgb=np.zeros((*mask.shape,3),float)+[191,115,64];rgb[mask&(near<2.1)&(q<18)]=[10,5,3];z=np.dstack([rgb,mask.astype(float)*255]);z[:,:,:3]*=z[:,:,3:4]/255;z=cv2.resize(z,(120,120),interpolation=cv2.INTER_AREA);al=z[:,:,3:4];z[:,:,:3]=np.where(al>1e-6,z[:,:,:3]/np.maximum(al,1e-6)*255,0);z=z.clip(0,255).round().astype('uint8');Y,X=np.mgrid[b[1]:b[3],b[0]:b[2]];q=(X-W[0])*v[0]+(Y-W[1])*v[1];region=(q>-30)&(q<18);part=a[b[1]:b[3],b[0]:b[2]];part[region]=z[region];a[b[1]:b[3],b[0]:b[2]]=part;a[a[:,:,3]==0,:3]=0;Image.fromarray(a).save(D/'layers/arm_l_lower.png');full=Image.new('RGBA',(1024,1536))
for name in json.loads((D/'layout.json').read_text())['draw_order']:full.alpha_composite(Image.open(D/'layers'/(name+'.png')))
full.save(D/'assembled.png');full.save(D/'master.png');print('Far wrist upper/lower contours joined with a smooth organic curve; accepted elbow unchanged')
