# Claude 11-07: composite Codex wrist repaint (精修/生圖_1107) into host far hand, lower-edge half only
import numpy as np, json, sys
from PIL import Image
from scipy import ndimage as nd
SRC='交件/host/layers'; W='精修/claude_r7fix/host/layers'; G='精修/生圖_1107'
x0,y0=340,580; cx,cy,R=420,650,34; ex,ey=306,545
yy,xx=np.mgrid[:160,:200]; X=xx+x0; Y=yy+y0
r=np.hypot(X-cx,Y-cy)
dx,dy=cx-ex,cy-ey; n=np.hypot(dx,dy)
side=((X-cx)*dy-(Y-cy)*dx)/n            # <0 = lower edge (step side)
w=np.clip((R+1-r)/3,0,1)*np.clip((3-side)/5,0,1)
rep={}; gas={}
for h in ['hand_l_open','hand_l_point']:
    raw=np.array(Image.open(f'{G}/{h}_raw.png').convert('RGB')).astype(float)
    c=raw.reshape(-1,3); paper=np.median(c[c.mean(1)>200],0)
    d=np.abs(raw-paper).max(-1); a7=np.clip((d-14)/50,0,1); a7=nd.binary_opening(a7>0)*a7
    pm=np.dstack([raw*a7[...,None],a7*255]).astype(np.float32)
    sm=np.dstack([np.array(Image.fromarray(pm[...,k]).resize((200,160),Image.BOX)) for k in range(4)])
    a=sm[...,3]/255; col=np.where(a[...,None]>1e-3,sm[...,:3]/np.maximum(a[...,None],1e-3),0).clip(0,255); a[a<0.08]=0
    gas[h]=a
    H0=np.array(Image.open(f'{SRC}/{h}.png').convert('RGBA')).astype(float)[y0:y0+160,x0:x0+200]
    L0=np.array(Image.open(f'{SRC}/arm_l_lower.png').convert('RGBA')).astype(float)[y0:y0+160,x0:x0+200]
    orig=np.where(H0[...,3:4]>250,H0[...,:3],L0[...,:3]); oop=(H0[...,3]>250)|(L0[...,3]>250)
    skin=(a>0.98)&oop&(col.mean(-1)>90)&(orig.mean(-1)>90)&(r<R+6)
    gain=np.median(orig[skin],0)/np.median(col[skin],0)
    sk=col.mean(-1,keepdims=True)>90
    col=np.where(sk,(col*gain).clip(0,255),col); rep[h+'_gain']=gain.round(3).tolist()
    H=np.array(Image.open(f'{SRC}/{h}.png').convert('RGBA')).astype(float)
    sub=H[y0:y0+160,x0:x0+200]; oa=sub[...,3]/255
    na=w*a+(1-w)*oa
    nc=(w[...,None]*a[...,None]*col+(1-w[...,None])*oa[...,None]*sub[...,:3])/np.maximum(na[...,None],1e-3)
    sub[...,:3]=np.where(na[...,None]>0,nc,0); sub[...,3]=na*255
    Image.fromarray(H.round().clip(0,255).astype(np.uint8)).save(f'{W}/{h}.png')
    rep[h]=dict(removed=int(((oa-na)>0.25).sum()),added=int(((na-oa)>0.25).sum()))
lo=np.array(Image.open(f'{SRC}/arm_l_lower.png').convert('RGBA')).astype(float)
sil=nd.binary_dilation((gas['hand_l_open']>0.5)&(gas['hand_l_point']>0.5),iterations=1)
sub=lo[y0:y0+160,x0:x0+200]; cut=(r<=R-2)&(side<-2)&~sil&(sub[...,3]>0); sub[...,3][cut]=0
Image.fromarray(lo.round().astype(np.uint8)).save(f'{W}/arm_l_lower.png'); rep['forearm_trim']=int(cut.sum())
print(json.dumps(rep))
# top side: hand root must stay >=3px inside the forearm outline (it poked out as a step when the forearm mesh bends)
lo_full=np.array(Image.open(f'{W}/arm_l_lower.png').convert('RGBA'))[...,3]
inner=nd.binary_erosion(lo_full>=250,iterations=3)
YY,XX=np.mgrid[:1536,:1024]
T=((XX-cx)*dx+(YY-cy)*dy)/n; SD=((XX-cx)*dy-(YY-cy)*dx)/n
for h in ['hand_l_open','hand_l_point']:
    H=np.array(Image.open(f'{W}/{h}.png').convert('RGBA'))
    m=(H[...,3]>0)&(T<-3)&(SD>0)&~inner&(np.hypot(XX-cx,YY-cy)<60)
    H[...,3][m]=0; Image.fromarray(H).save(f'{W}/{h}.png'); print(h,'root trim',int(m.sum()))
