import sys, numpy as np
from splitlib import *
who='dj'; new,N,lay,L,own,names=load(who,KIT_ORDER)
idx={n:i for i,n in enumerate(names) if n}
arm_ids=[idx[n] for n in ('arm_l_upper','arm_l_lower','arm_r_upper','arm_r_lower')]
nonarm=(own>0)&~np.isin(own,arm_ids)
skin=(new[...,0]>190)&(new[...,1]>120)&(new[...,1]<215)&(new[...,2]>70)&(new[...,2]<175)&(new[...,0]-new[...,2]>60)
SKIN=(246,166,110); INK=(21,20,22)
out={k:v.copy() for k,v in L.items()}
# ---------- 遠手（畫面左） ----------
E_L=(240,540); O=(186,533); I=(294,548)
hand=L['hand_l_hip'][...,3]>128
P1=(294,702); P2=(334,656)                                   # 腕線：母圖手腕橫紋兩端（下緣、上緣）
wside=below(P1,P2)                                           # True＝手掌那一側
_v=np.array([P2[1]-P1[1],P1[0]-P2[0]],float); _v/=np.hypot(*_v)   # 指向手掌
if not wside[int(P1[1]+_v[1]*20),int(P1[0]+_v[0]*20)]: _v=-_v
def shift(p,d): return (p[0]+_v[0]*d,p[1]+_v[1]*d)
fore_side=~below(shift(P1,3),shift(P2,3))                    # 前臂多留 3px 壓進手掌底下
F=biggest(N&~(nonarm&~hand)&fore_side&poly([(170,330),(380,330),(380,530),(350,560),(338,640),(345,705),(300,745),(225,745),(170,570)]))
lowS=below(O,I)
fore=F&lowS; upper=F&~lowS
cap=disc(E_L,40)&ndi.binary_erosion(F,iterations=10)   # 前臂肘端圓頭：母圖像素、退到外緣墨線以內
fore_vis=fore|cap
lower=rgba(new,fore_vis)
for hn in ('hand_l_hip','hand_l_open','hand_l_point'):         # 手掌：v2 的無線腕根切到腕線為止
    h=out[hn]; h[~wside]=0
    lab,n=ndi.label(h[...,3]>0)
    if n>1:
        keep=1+int(np.argmax(ndi.sum(h[...,3]>0,lab,range(1,n+1)))); h[lab!=keep]=0
hands_all=np.logical_and.reduce([out[hn][...,3]>128 for hn in ('hand_l_hip','hand_l_open','hand_l_point')])
print('遠手腕收窄',taper(lower,(314,679),(0.47,0.88),25,16,19,SKIN,out['hand_l_hip'][...,3]>128))
out['arm_l_lower']=lower
up=rgba(new,upper)
root=(L['arm_l_upper'][...,3]>128)&nonarm&~(L['hand_l_hip'][...,3]>128)                 # 肩根：沿用 v2 在軀幹下面的那一段
up[root&(up[...,3]==0)]=L['arm_l_upper'][root&(up[...,3]==0)]
stub=paint(up,disc(E_L,50)&lowS&ndi.binary_erosion(fore_vis,iterations=3),SKIN)
stub|=seal(up,fore_vis,SKIN); ring(up,stub,8,upper)
out['arm_l_upper']=up
# ---------- 近手（畫面右） ----------
R=N&poly([(690,360),(830,360),(830,620),(740,620),(690,560),(660,520),(690,480)])
crease=[(690,470),(700,492),(725,490),(760,497),(780,507),(800,522),(830,535),(830,640),(640,640),(640,470)]
lowR=poly(crease)
grip=L['hand_r_grip'][...,3]>128
arm_free=R&~nonarm                                            # 軀幹外面的手臂
sk=skin&R&lowR&~grip                                          # 前臂膚色（含壓在軀幹上的那一段）
sk=biggest(ndi.binary_closing(sk,iterations=2))
foreR=ndi.binary_dilation(sk,iterations=11)&R&lowR&~grip&(ink(new)|sk|(arm_free&lowR))
foreR=biggest(ndi.binary_fill_holes(foreR|sk))
lowerR=rgba(new,foreR)
print('近手腕',wrist_end(lowerR,(757,567),(705,520),grip,22,18,SKIN))
out['arm_r_lower']=lowerR
upperR=arm_free&~foreR
upperR=biggest(upperR)
upR=rgba(new,upperR)
rootR=(L['arm_r_upper'][...,3]>128)&nonarm&~grip
upR[rootR&(upR[...,3]==0)]=L['arm_r_upper'][rootR&(upR[...,3]==0)]
stubR=paint(upR,capsule((748,470),(762,548),40)&ndi.binary_erosion(foreR,iterations=3),SKIN)
stubR|=seal(upR,foreR,SKIN); ring(upR,stubR,8,upperR)
out['arm_r_upper']=upR
ORDER=lay['draw_order']
comp=np.asarray(compose(out,ORDER))[...,3]>0; missing=N&~comp
topvis=np.zeros((H,W),int)
for i,n in enumerate(ORDER,1): topvis[out[n][...,3]>0]=i
dn,(iy,ix)=ndi.distance_transform_edt(topvis==0,return_indices=True)
near=topvis[iy,ix]; fixm=missing&(dn<=8)
for i,n in enumerate(ORDER,1):
    m_=fixm&(near==i)
    if m_.any(): out[n][m_,:3]=new[m_]; out[n][m_,3]=255
print('細縫補回',fixm.sum(),'仍缺',(missing&~fixm).sum())
for hn in ('hand_r_open','hand_r_pinch'): print(hn,'腕根裁掉',trim_stem(out[hn]))
for hn in ('hand_r_open','hand_r_pinch','hand_r_hatheld','hand_l_open','hand_l_point'): retone(out[hn],(-2,6,-8))
for hn in ('hand_r_grip','hand_l_hip'):
    g_=(own==idx[hn])&N&(out[hn][...,3]>0); out[hn][g_,:3]=new[g_]
for _n in lay['draw_order']:
    _a=out[_n][...,3]>0; _b=biggest(_a)
    if (_a&~_b).any(): print(_n,'丟掉不相連碎塊',int((_a&~_b).sum())); out[_n][_a&~_b]=0
print('清灰塵',sum(clean_dust(v) for v in out.values()))
d=HERE/who/'layers'; d.mkdir(parents=True,exist_ok=True)
for n,a in out.items(): save(a,d/f'{n}.png')
full=compose(out,lay['draw_order']); full.save(HERE/who/'assembled.png')
import numpy as _n
m=np.asarray(full); miss=N&(m[...,3]==0); extra=(m[...,3]>0)&~ndi.binary_dilation(N,iterations=2)
diff=(np.abs(m[...,:3].astype(int)-new).max(-1)>40)&N&(m[...,3]>0)
print('母圖有、合成沒有',miss.sum(),'合成多出',extra.sum(),'顏色差>40',diff.sum())
vv=np.full((H,W,3),(0x56,0x54,0x8c),np.uint8); a=m[...,3]>0; vv[a]=m[...,:3][a]; vv[miss]=(0,255,0); vv[extra]=(255,0,0); vv[diff]=(255,255,0)
Image.fromarray(vv).crop((160,300,860,800)).save(HERE/who/'_diff.png')
