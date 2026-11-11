"""主持人近手兩張換手圖（第三階段補畫 S1、S2 候選 1）→ hand_r_open / hand_r_pinch。split_host.py 之後跑。"""
import sys, numpy as np
from splitlib import *
who='host'; SK=np.array((208,128,59))
yy,xx=np.mgrid[:H,:W]
fore=np.asarray(Image.open(HERE/who/'layers'/'arm_r_lower.png'))
fa=fore[...,3]>0
pick={'hand_r_open':'S1_候選1.png','hand_r_pinch':'S2_候選1.png'}
for hn,f in pick.items():
    a=np.asarray(Image.open(V3/'補畫_第三階段_主持人換手'/'交件'/f).convert('RGB')).astype(np.int32)
    r,g,b=a[...,0],a[...,1],a[...,2]
    mag=(r>150)&(b>150)&(g<120)
    skin=(r>120)&(r<235)&(g>60)&(g<170)&(b<120)&(r-b>60)&(r-g>30)
    gold=(r>190)&(g>140)&(b<110)&(r-b>100)&~skin
    dark=a.max(-1)<80
    zone=(yy<528)&(xx>650)&(xx<840)&(yy>340)
    core=biggest(ndi.binary_closing((skin|gold)&zone&~mag,iterations=3))
    hand=ndi.binary_dilation(core,iterations=9)&zone&~mag&(core|dark|skin|gold)
    hand=biggest(ndi.binary_opening(ndi.binary_fill_holes(hand),iterations=2))
    hand&=ndi.binary_erosion(~mag,iterations=1)
    hand&=(yy<506)|(disc((742,506),34)&ndi.binary_erosion(fa|(yy<506),iterations=4))   # 下端收成圓頭，藏在前臂裡面
    hand=biggest(hand)
    hand&=ndi.binary_dilation(ndi.binary_opening(hand,iterations=3),iterations=3)   # 細墨線鬚不留
    hand=biggest(hand)
    lay=np.zeros((H,W,4),np.uint8); lay[hand,:3]=a[hand]; lay[hand,3]=255
    sk=hand&skin&~dark; d=SK-np.median(a[sk],axis=0)
    lay[sk,:3]=np.clip(a[sk]+d,0,255)
    ys,xs=np.where(hand); low=hand&(yy>ys.max()-4); 
    print(hn,f,'px',hand.sum(),'bbox',xs.min(),xs.max(),ys.min(),ys.max(),'底寬',int(low.any(0).sum()),'膚色校正',np.round(d),'與前臂重疊',int((hand&fa).sum()))
    save(lay,HERE/who/'layers'/f'{hn}.png')
