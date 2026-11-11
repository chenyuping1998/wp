"""Static Shift cast v3（加粗）拆層共用函式。母圖＝生圖/<who>/<who>_全身_候選2.png（品紅底）。
沒改到的圖層沿用 cast_v2/交件；改到的圖層＝母圖像素切出來＋被擋處補底。"""
import json, numpy as np
from pathlib import Path
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
HERE=Path(__file__).resolve().parent; V3=HERE.parent; V2=V3.parent/'cast_v2'/'交件'
W,H=1024,1536
KIT_ORDER=['arm_l_upper','arm_l_lower','hand_l_hip','leg_l_upper','leg_l_lower','foot_l','pelvis','leg_r_upper','leg_r_lower','foot_r','neck','torso','head_idle','hat','glasses','arm_r_upper','arm_r_lower','hand_r_grip']
def load(who,order=None):
    new=np.asarray(Image.open(V3/'生圖'/who/f'{who}_全身_候選2.png').convert('RGB')).astype(np.int32)
    r,g,b=new[...,0],new[...,1],new[...,2]
    mag=(r>170)&(b>170)&(g<110)&(abs(r-b)<70)
    # 品紅溢色邊：往內收 1px
    N=ndi.binary_erosion(~mag,iterations=1)
    lay=json.load(open(V2/who/'layout.json'))
    layers={p.stem:np.asarray(Image.open(p).convert('RGBA')).copy() for p in sorted((V2/who/'layers').glob('*.png'))}
    order=[n for n in (order or lay['draw_order']) if n in layers]; lay['draw_order']=order
    own=np.zeros((H,W),int); names=[None]+order
    for i,n in enumerate(order,1): own[layers[n][...,3]>128]=i
    return new,N,lay,layers,own,names
def poly(pts):
    im=Image.new('L',(W,H),0); ImageDraw.Draw(im).polygon([tuple(p) for p in pts],fill=255); return np.asarray(im)>0
def disc(c,r):
    yy,xx=np.mgrid[:H,:W]; return (xx-c[0])**2+(yy-c[1])**2<=r*r
def below(a,b):
    """a→b 這條線的右手邊（影像座標：a 在左、b 在右時＝下方）"""
    yy,xx=np.mgrid[:H,:W]; return (b[0]-a[0])*(yy-a[1])-(b[1]-a[1])*(xx-a[0])>0
def ink(new): return new.max(-1)<80
def biggest(m):
    lab,n=ndi.label(m)
    if n<=1: return m
    s=ndi.sum(m,lab,range(1,n+1)); return lab==1+int(np.argmax(s))
def rgba(new,mask):
    out=np.zeros((H,W,4),np.uint8); out[...,:3][mask]=new[mask]; out[...,3][mask]=255; return out
def paint(layer,mask,color):
    """只在 layer 還透明的地方補平塗"""
    m=mask&(layer[...,3]==0); layer[...,:3][m]=color; layer[...,3][m]=255; return m
def ring(layer,added,width,keep_open,color=(21,20,22)):
    """替補上去的區塊在外緣畫墨線；keep_open＝不畫線的那一側（和母圖像素相接處）"""
    full=layer[...,3]>0; edge=added&~ndi.binary_erosion(full,iterations=width)
    edge&=~ndi.binary_dilation(keep_open,iterations=width+1)
    layer[...,:3][edge]=color
def capsule(a,b,r):
    yy,xx=np.mgrid[:H,:W]; a=np.array(a,float); b=np.array(b,float); v=b-a
    t=np.clip(((xx-a[0])*v[0]+(yy-a[1])*v[1])/(v@v),0,1)
    return (xx-a[0]-t*v[0])**2+(yy-a[1]-t*v[1])**2<=r*r
def seal(layer,cover,color,it=5):
    """補上的區塊和母圖像素之間的細縫（都在 cover＝前面那一層底下）填平"""
    a=layer[...,3]>0; m=ndi.binary_closing(a,iterations=it)&~a&cover
    layer[...,:3][m]=color; layer[...,3][m]=255; return m
def taper(layer,C,u,a,d,b,color,cover,ink_w=8,INKC=(21,20,22)):
    """手腕端：從前臂斷面（中心 C、半寬 a）往手掌方向 u 收到半寬 b、長 d 的梯形，兩側畫墨線。
    只畫在 cover（靜止時蓋在上面的那隻手）裡面，所以靜止畫面不變；換成比較窄的手時露出來的是有線的手腕。"""
    u=np.array(u,float); u/=np.hypot(*u); n=np.array([-u[1],u[0]]); C=np.array(C,float)
    A,B=C+n*a-u*4,C-n*a-u*4; A2,B2=C+u*d+n*b,C+u*d-n*b
    reg=poly([A,B,B2,A2])&ndi.binary_erosion(cover,iterations=1)
    m=reg&(layer[...,3]==0); layer[m,:3]=color; layer[m,3]=255
    im=Image.new('L',(W,H),0); dr=ImageDraw.Draw(im)
    dr.line([tuple(A),tuple(A2)],fill=255,width=ink_w); dr.line([tuple(B),tuple(B2)],fill=255,width=ink_w)
    e=(np.asarray(im)>0)&m; layer[e,:3]=INKC
    return int(m.sum())
def wrist_end(layer,E,Wp,cover,b,d,color,ink_w=8,INKC=(21,20,22)):
    """近手手腕端：量前臂在 Wp 的實際斷面，靜止時被手蓋住的那一側重畫成收窄、兩側有線的手腕。"""
    E=np.array(E,float); Wp=np.array(Wp,float); u=Wp-E; t0=np.hypot(*u); u/=t0; n=np.array([-u[1],u[0]])
    yy,xx=np.mgrid[:H,:W]; t=(xx-E[0])*u[0]+(yy-E[1])*u[1]; sc=(xx-E[0])*n[0]+(yy-E[1])*n[1]
    a_=layer[...,3]>0
    # 斷面取在「手開始蓋住前臂中線」的前 3px
    for k in range(int(t0*0.3),int(t0)+60):
        p=E+u*k
        if cover[int(round(p[1])),int(round(p[0]))]: t0=k-3; break
    sec=a_&(np.abs(t-t0)<1.5); s0,s1=sc[sec].min(),sc[sec].max()
    C=E+u*t0+n*(s0+s1)/2; a=(s1-s0)/2-1
    sm=(s0+s1)/2
    orig=layer.copy(); layer[(t>t0)]=0                           # 斷面以外的尖角、殘邊都不留
    el=((sc-sm)/a)**2+((t-t0)/d)**2
    reg=(t>t0-1)&(el<=1)&(layer[...,3]==0)                       # 圓弧收邊的手腕端
    layer[reg,:3]=color; layer[reg,3]=255
    inner=((sc-sm)/max(a-ink_w,1))**2+((t-t0)/max(d-ink_w,1))**2
    e=reg&(inner>1); layer[e,:3]=INKC
    keep=reg&(orig[...,3]>0); layer[keep]=orig[keep]             # 靜止時看得到的部分照母圖
    drop=reg&~cover&(orig[...,3]==0); layer[drop]=0              # 圓弧只留在靜止時被手蓋住的地方
    b_=layer[...,3]>0; layer[b_&~biggest(b_)]=0
    return round(float(a),1),int(reg.sum())
def retone(layer,delta):
    """沿用的 v2 圖層膚色調到母圖色調（只動膚色像素）"""
    o=layer[...,:3].astype(int); r,g,b=o[...,0],o[...,1],o[...,2]
    sk=(layer[...,3]>0)&(r>120)&(r-b>60)&(r-g>30)&(g>60)&~((r>200)&(g>150)&(b<100)&(r-g<70))
    layer[sk,:3]=np.clip(o[sk]+np.array(delta),0,255)
def trim_stem(layer,keep=6):
    """v2 換手圖的無線腕根（為細前臂畫的長條）裁短：只留貼著有線手掌的 keep px。
    腕根＝最近的輪廓點沒有墨線的那些像素。"""
    a=layer[...,3]>128; dark=a&(layer[...,:3].max(-1)<80)
    edge=a&~ndi.binary_erosion(a,iterations=1)
    inked=edge&ndi.binary_dilation(dark,iterations=3)
    d,(iy,ix)=ndi.distance_transform_edt(~edge,return_indices=True)
    stem=a&~inked[iy,ix]
    stem=ndi.binary_opening(stem,iterations=3)
    cut=stem&~ndi.binary_dilation(a&~stem,iterations=keep)
    layer[cut]=0
    b=layer[...,3]>0; layer[b&~biggest(b)]=0
    return int(cut.sum())
def underpaint(back,front,depth=40,ink_w=8,INKC=(21,20,22)):
    """back 被 front 擋住的地方往裡多畫 depth px：顏色取最近的 back 像素，新外緣畫墨線。
    只畫在 front（往內縮 2px）裡面，靜止畫面不變；front 移開時露出的是有描線的延伸，不是切邊。"""
    b=back[...,3]>0; f=ndi.binary_erosion(front[...,3]>128,iterations=2)
    grow=ndi.binary_dilation(b,iterations=depth)&f&~b
    grow=ndi.binary_opening(grow,iterations=2)
    if not grow.any(): return 0
    solid=b&(back[...,:3].max(-1)>=80)                       # 取色不取墨線
    _,(iy,ix)=ndi.distance_transform_edt(~solid,return_indices=True)
    back[grow,:3]=back[iy[grow],ix[grow],:3]; back[grow,3]=255
    allm=back[...,3]>0
    rim=grow&~ndi.binary_erosion(allm,iterations=ink_w)
    rim&=~ndi.binary_dilation(b&~ndi.binary_erosion(b,iterations=1),iterations=2)   # 和原本的邊相接處不加線
    back[rim,:3]=INKC
    return int(grow.sum())
def clean_dust(layer):
    a=layer[...,3]; m=(a>0)&(a<8); layer[m]=0; return int(m.sum())
def save(layer,path):
    a=layer.copy(); a[a[...,3]==0]=0; Image.fromarray(a,'RGBA').save(path)
def compose(layers,order):
    full=Image.new('RGBA',(W,H))
    for n in order: full.alpha_composite(Image.fromarray(layers[n],'RGBA'))
    return full
