import sys, numpy as np
from splitlib import *
who='host'; new,N,lay,L,own,names=load(who)
idx={n:i for i,n in enumerate(names) if n}
def owned(*ns): return np.isin(own,[idx[n] for n in ns])
INK=(21,20,22)
skin=(new[...,0]>120)&(new[...,0]<230)&(new[...,1]>60)&(new[...,1]<165)&(new[...,2]<115)&(new[...,0]-new[...,2]>60)&(new[...,0]-new[...,1]>35)
out={k:v.copy() for k,v in L.items()}
yy,xx=np.mgrid[:H,:W]
# ================= 遠手（畫面左） =================
E_L=(286,560); O=(244,550); I=(380,572)
P1=(390,671); P2=(411,626)                     # 腕線（下緣、上緣）
wside=below(P1,P2)
v=np.array([P2[1]-P1[1],P1[0]-P2[0]],float); v/=np.hypot(*v)
if not wside[int(P1[1]+v[1]*20),int(P1[0]+v[0]*20)]: v=-v
sh=lambda p,d:(p[0]+v[0]*d,p[1]+v[1]*d)
fore_side=~below(sh(P1,3),sh(P2,3))
SEAM=[(452,334),(447,360),(446,400),(444,440),(436,470),(420,500),(408,514)]       # 袖子和身體的交界（粗墨線）
polyL=poly([(225,325)]+SEAM+[(396,540),(402,575),(422,606),(430,640),(400,700),(225,700)])
F=biggest(N&polyL&fore_side&~owned('head_idle','glasses','neck'))
lowS=below(O,I)
SK=tuple(int(x) for x in np.median(new[F&lowS&skin&~ink(new)],axis=0)); print('skin',SK)
fore=F&lowS; upper=F&~lowS
cap=disc(E_L,30)&ndi.binary_erosion(F,iterations=10)
fore_vis=fore|cap
lower=rgba(new,fore_vis)
paint(lower,disc((401,649),19)&wside,SK)
_FORE_PATCH_=1
out['arm_l_lower']=lower
# 手掌：v2 腕根切到腕線；叉腰手再補上變粗後多出來的邊
for hn in ('hand_l_hip','hand_l_open','hand_l_point'):
    h=out[hn]; h[~wside]=0
    lab,n=ndi.label(h[...,3]>0)
    if n>1: h[lab!=1+int(np.argmax(ndi.sum(h[...,3]>0,lab,range(1,n+1))))]=0
# 叉腰手這張是重畫過的：從母圖切
HP=poly([sh(P2,-3),(448,599),(476,594),(522,612),(526,656),(502,682),(400,684),sh(P1,-3)])
hs=skin&HP&N
hs=biggest(ndi.binary_closing(hs,iterations=4))
hipm=ndi.binary_dilation(hs,iterations=8)&HP&N&(ink(new)|hs|skin)
hipm=biggest(ndi.binary_opening(ndi.binary_fill_holes(hipm|hs),iterations=2))&~fore_vis
hip=rgba(new,hipm); out['hand_l_hip']=hip
# 上臂（袖子）
up=rgba(new,upper)
root=(L["arm_l_upper"][...,3]>128)&~polyL   # v2 袖根，在新交界線右邊（軀幹底下）
root&=xx<470
m=root&(up[...,3]==0); up[m]=L['arm_l_upper'][m]
stub=paint(up,capsule((320,522),E_L,42)&lowS&ndi.binary_erosion(fore_vis,iterations=2),SK)
stub|=seal(up,fore_vis,SK); ring(up,stub,8,upper)
out['arm_l_upper']=up
# ================= 近手（畫面右） =================
grip=L['hand_r_grip'][...,3]>128
polyR=poly([(640,340),(830,340),(830,625),(705,625),(690,560),(684,480),(690,400)])
tors_old=owned('torso')
sk=skin&poly([(700,495),(790,495),(800,600),(715,600)])&~grip
sk=biggest(ndi.binary_closing(sk,iterations=3))
foreR=ndi.binary_dilation(sk,iterations=10)&N&polyR&~grip&(ink(new)|sk)
# 墨線只收貼著膚色的那一圈：再和膚色區的凸包式外擴相交
foreR=biggest(ndi.binary_opening(ndi.binary_fill_holes(foreR|sk),iterations=3))
lowerR=rgba(new,foreR)
paint(lowerR,capsule((737,500),(737,480),24)&ndi.binary_erosion(grip,iterations=2),SK); seal(lowerR,grip,SK)
out['arm_r_lower']=lowerR
upperR=N&polyR&~tors_old&~grip&~foreR&~owned('head_idle','neck','pelvis','leg_r_upper')
_l,_n=ndi.label(upperR); _s=ndi.sum(upperR,_l,range(1,_n+1)); upperR=np.isin(_l,[i+1 for i,v_ in enumerate(_s) if v_>300])
upR=rgba(new,upperR)
rootR=(L['arm_r_upper'][...,3]>128)&(tors_old|grip|foreR)
m=rootR&(upR[...,3]==0); upR[m]=L['arm_r_upper'][m]
out['arm_r_upper']=upR
# ================= 軀幹、骨盆、大腿 =================
taken=F|fore_vis|hipm|grip|foreR|upperR|owned('head_idle','glasses','neck')
rest=N&~taken
body=['torso','pelvis','leg_l_upper','leg_r_upper','leg_l_lower','leg_r_lower','foot_l','foot_r']
dist=np.stack([ndi.distance_transform_edt(~(owned(b)&rest)) for b in body])
lab=np.argmin(dist,0)
lab[(lab==1)&(yy<612)&(xx<500)&skin]=0      # 變寬的左腰是軀幹，不是骨盆
CREAM=(244,226,196)
left=np.zeros((H,W),bool)
for bi,b in enumerate(('torso','pelvis','leg_l_upper','leg_r_upper')):
    vis=rest&(lab==bi); main=biggest(vis); left|=vis&~main; vis=main
    lay_=out[b]
    if b=='torso': lay_[polyL]=0     # 新交界線左邊是袖子，舊軀幹像素拿掉
    lay_[vis,:3]=new[vis]; lay_[vis,3]=255
    out[b]=lay_
    print(b,'可見像素',vis.sum())
# 落單的碎片歸回它貼著的手臂／手掌層
cands={'arm_l_lower':fore_vis,'arm_r_upper':upperR,'arm_l_upper':upper}
dd=np.stack([ndi.distance_transform_edt(~m) for m in cands.values()]); ll=np.argmin(dd,0)
for i,n in enumerate(cands):
    m=left&(ll==i)&(dd.min(0)<14); out[n][m,:3]=new[m]; out[n][m,3]=255; print('碎片→',n,m.sum())
print('丟掉的碎片',(left&(dd.min(0)>=14)).sum())
# 近手袖子：前臂、手掌後面的洞補平
a_=out['arm_r_upper'][...,3]>0; hole=ndi.binary_fill_holes(ndi.binary_closing(a_,iterations=12))&~a_&N&(xx>640)
out['arm_r_upper'][hole,:3]=CREAM; out['arm_r_upper'][hole,3]=255
hipm=out['hand_l_hip'][...,3]>128
# 握麥克風那隻手旁邊多出來的手腕／手環邊：歸手掌層
spike=(out['arm_r_upper'][...,3]>0)&poly([(742,380),(805,380),(805,494),(772,499),(742,470)])&N
out['hand_r_grip'][spike,:3]=new[spike]; out['hand_r_grip'][spike,3]=255; out['arm_r_upper'][spike]=0
# ---- 叉腰手後面的腰側：新體型比 v2 寬，v2 的補底不合，重補 ----
cover=ndi.binary_erosion(hipm|fore_vis,iterations=2)&(xx<530)
C=[(470,570),(457,598),(441,625),(416,655),(393,682),(378,706)]            # 被擋住的腰→髖輪廓
B=poly(C+[(530,706),(530,570)])&cover
belt_top=612+(510-xx)*0.08
tv=out['torso'][...,3]>0; pv=out['pelvis'][...,3]>0
vis_t=rest&(lab==0); vis_p=rest&(lab==1)
PURPLE=tuple(int(x) for x in np.median(new[vis_p&(yy>650)&~ink(new)],axis=0)); WSK=tuple(int(x) for x in np.median(new[vis_t&(yy>560)&~ink(new)&skin],axis=0)); print('purple',PURPLE,'waist',WSK)
for nme,vis_ in (('torso',vis_t),('pelvis',vis_p)):
    lay_=out[nme]; lay_[cover&~vis_]=0                                    # 手後面的舊補底清掉
edgeC=np.zeros((H,W),bool)
from PIL import ImageDraw as _D
_im=Image.new('L',(W,H),0); _D.Draw(_im).line(C,fill=255,width=9); edgeC=(np.asarray(_im)>0)&cover
t_=out['torso']; m=B&(yy<belt_top+6)&(t_[...,3]==0); t_[m,:3]=WSK; t_[m,3]=255; e=edgeC&(yy<belt_top+6); t_[e,:3]=INK; t_[e,3]=255
p_=out['pelvis']; m=B&(yy>=belt_top-2)&(p_[...,3]==0); p_[m,:3]=PURPLE; p_[m,3]=255
bm=m&(yy<belt_top+30); p_[bm,:3]=(27,26,30)
e=edgeC&(yy>=belt_top-2); p_[e,:3]=INK; p_[e,3]=255
for nme in ('torso','pelvis'):
    a_=out[nme][...,3]>0; keep=biggest(a_); out[nme][a_&~keep]=0
# ================= 第二階段補畫（Codex H1–H3）合進被擋處 =================
def gen(name):
    a=np.asarray(Image.open(V3/'補畫_第二階段'/'交件'/name).convert('RGB')).astype(np.int32)
    mg=(a[...,0]>170)&(a[...,2]>170)&(a[...,1]<110)&(abs(a[...,0]-a[...,2])<70)
    return a,ndi.binary_erosion(~mg,iterations=1)
h1,n1=gen('H1_候選1.png'); h2,n2=gen('H2_候選1.png'); h3,n3=gen('H3_候選1.png')
def sk_(a): return (a[...,0]>120)&(a[...,0]<230)&(a[...,1]>60)&(a[...,1]<165)&(a[...,2]<115)&(a[...,0]-a[...,2]>60)&(a[...,0]-a[...,1]>35)
# --- H1：叉腰手、前臂後面的腰與髖 ---
covL=ndi.binary_dilation(hipm|fore_vis,iterations=3)&(xx<540)&(yy>540)
for nme in ('torso','pelvis'): out[nme]=L[nme].copy()
vis_t=biggest(rest&(lab==0)); vis_p=biggest(rest&(lab==1))
t_=out['torso']; t_[polyL]=0; t_[covL]=0; t_[vis_t,:3]=new[vis_t]; t_[vis_t,3]=255
p_=out['pelvis']; p_[covL]=0; p_[vis_p,:3]=new[vis_p]; p_[vis_p,3]=255
Z=(ndi.binary_dilation(hipm|fore_vis,iterations=16)|ndi.binary_dilation(HP,iterations=18))&(xx<570)&(yy>545)
pm=lambda a:(a[...,0]>70)&(a[...,1]<75)&(a[...,2]>50)&(a[...,0]>a[...,2])
ref=vis_p&~Z&(xx<600)
delta=np.median(new[ref&pm(new)],axis=0)-np.median(h1[ref&pm(h1)],axis=0); print('H1 紫色校正',delta)
h1=h1.copy(); h1[pm(h1)]=np.clip(h1[pm(h1)]+delta,0,255)
t_[Z]=0; p_[Z]=0
fill=Z&n1
wsk=n1&sk_(h1)&(yy>=556)&(yy<=652)&(xx<560)
yb=np.where(wsk.any(0),H-1-np.argmax(wsk[::-1],axis=0),-1).astype(float)      # 每一欄腰部皮膚的最下緣＝皮帶上緣
has=yb>=0; ybs=ndi.median_filter(np.where(has,yb,0),size=9); yb=np.where(has,ybs,-1)
YB=np.broadcast_to(yb,(H,W))
toT=fill&(YB>=0)&(yy<=YB+3); toP=fill&((YB<0)|(yy>=YB-8))
t_[toT,:3]=h1[toT]; t_[toT,3]=255; p_[toP,:3]=h1[toP]; p_[toP,3]=255
for nme in ('torso','pelvis'):
    a_=out[nme][...,3]>0; out[nme][a_&~biggest(a_)]=0
print('H1 補進 軀幹',toT.sum(),'骨盆',toP.sum())
# --- H2：近手袖子整隻、軀幹右邊被手擋住的地方 ---
covR=ndi.binary_dilation(grip|foreR,iterations=3)
tR=tors_old&covR&n2&~vis_t
out['torso'][tR,:3]=h2[tR]; out['torso'][tR,3]=255
slv=n2&polyR&~tors_old&~owned('head_idle','neck','pelvis','leg_r_upper')
slv=biggest(slv)
upR=np.zeros((H,W,4),np.uint8); upR[slv,:3]=h2[slv]; upR[slv,3]=255
m=rootR&(upR[...,3]==0); upR[m]=L['arm_r_upper'][m]
a_=upR[...,3]>0; hole=ndi.binary_fill_holes(ndi.binary_closing(a_,iterations=10))&~a_&tors_old
upR[hole,:3]=CREAM; upR[hole,3]=255
out['arm_r_upper']=upR
out['hand_r_grip']=L['hand_r_grip'].copy()
print('H2 袖子',slv.sum(),'軀幹右側',tR.sum())
# --- H3：遠手袖子＋上臂，手肘端圓頭 ---
polyLfull=poly([(225,325)]+SEAM+[(396,540),(402,575),(422,606),(430,640),(400,700),(225,700)])
u3=biggest(n3&polyLfull&~(n1&(yy>590)))
u3&=~ndi.binary_dilation(n1&polyLfull&(yy>560)&(xx>380),iterations=2)
u3=biggest(u3)
h4,n4=gen('H4_候選1.png')
wedge=biggest(ndi.binary_closing(upper&sk_(new)&~ink(new),iterations=3))      # 袖口外露出來的上臂皮膚
sleeve_m=upper&~ndi.binary_dilation(wedge,iterations=1)                       # 袖子本體（含袖口墨線）照母圖
sleeve_m=biggest(ndi.binary_opening(sleeve_m,iterations=4))|(sleeve_m&(yy<500))
sleeve_m=biggest(sleeve_m)
st3=biggest(u3&~sleeve_m&(yy>470))                                            # H3：上臂皮膚＋圓滑手肘端
up=rgba(new,sleeve_m); up[st3,:3]=h3[st3]; up[st3,3]=255
m=root&(up[...,3]==0); up[m]=L['arm_l_upper'][m]
a_=up[...,3]>0; hole=ndi.binary_closing(a_,iterations=3)&~a_; up[hole,:3]=SK; up[hole,3]=255
out['arm_l_upper']=up
# 前臂整隻用 H4（手肘端是畫好的圓頭），壓到袖子的部分不要
f4=n4&polyLfull&fore_side&~sleeve_m&~(n1&ndi.binary_erosion(n1,iterations=6))
f4=biggest(ndi.binary_opening(f4,iterations=2))
fm=fore|(wedge&f4)                                           # 形狀：母圖前臂＋H4 圓頭蓋到的上臂皮膚；顏色全照母圖
fm=biggest(fm)
lo=rgba(new,fm)
tip=(upper&~sleeve_m&~fm&~st3)                                # 袖口內側尖角：留在上臂層
tip=ndi.binary_opening(tip,iterations=1)
lo[tip,:3]=new[tip]; lo[tip,3]=255; print('內肘尖角歸前臂',tip.sum())
paint(lo,disc((401,649),19)&wside,SK)
out['arm_l_lower']=lo
ys_,xs_=np.where(st3&f4); print('手肘重疊中心',xs_.mean().round(),ys_.mean().round(),'前臂像素',f4.sum(),'母圖前臂有而 H4 沒有',(fore&~f4).sum())
print('H3 上臂皮膚＋手肘端',st3.sum())
d=HERE/who/'layers'; d.mkdir(parents=True,exist_ok=True)
np.save(HERE/who/'_hipmask.npy',hipm)
for n,a in out.items(): save(a,d/f'{n}.png')
full=compose(out,lay['draw_order']); full.save(HERE/who/'assembled.png')
m=np.asarray(full); miss=N&(m[...,3]==0); extra=(m[...,3]>0)&~ndi.binary_dilation(N,iterations=2)
diff=(np.abs(m[...,:3].astype(int)-new).max(-1)>40)&N&(m[...,3]>0)
print('母圖有、合成沒有',miss.sum(),'合成多出',extra.sum(),'顏色差>40',diff.sum())
v=np.full((H,W,3),(0x56,0x54,0x8c),np.uint8); a=m[...,3]>0; v[a]=m[...,:3][a]; v[miss]=(0,255,0); v[extra]=(255,0,0); v[diff]=(255,255,0)
Image.fromarray(v).crop((200,300,860,1100)).save(HERE/who/'_diff.png')
