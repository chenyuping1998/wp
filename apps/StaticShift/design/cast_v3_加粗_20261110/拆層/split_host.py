"""主持人 v3 拆層。疊圖順序（由後往前，寫進 host/layers.json）：
遠手前臂 → 遠手袖子 → 遠腿 → 骨盆 → 近腿 → 脖子 → 軀幹 → 頭 → 眼鏡 → 遠手手掌 → 近手袖子 → 近手前臂 → 近手手掌
（遠手前臂收在袖口底下；叉腰的手掌疊在身體前面；其餘同模板）"""
import json, numpy as np
from splitlib import *
who='host'
ORDER=['arm_l_lower','arm_l_upper','leg_l_upper','leg_l_lower','foot_l','pelvis','leg_r_upper','leg_r_lower','foot_r','neck','torso','head_idle','glasses','hand_l_hip','arm_r_upper','arm_r_lower','hand_r_grip']
new,N,lay,L,own,names=load(who,ORDER)
idx={n:i for i,n in enumerate(names) if n}
def owned(*ns): return np.isin(own,[idx[n] for n in ns])
def alpha(n): return L[n][...,3]>128
yy,xx=np.mgrid[:H,:W]
def sk_(a): return (a[...,0]>120)&(a[...,0]<230)&(a[...,1]>60)&(a[...,1]<165)&(a[...,2]<115)&(a[...,0]-a[...,2]>60)&(a[...,0]-a[...,1]>35)
def gen(name):
    a=np.asarray(Image.open(V3/'補畫_第二階段'/'交件'/name).convert('RGB')).astype(np.int32)
    mg=(a[...,0]>170)&(a[...,2]>170)&(a[...,1]<110)&(abs(a[...,0]-a[...,2])<70)
    return a,ndi.binary_erosion(~mg,iterations=1)
h1,n1=gen('H1_候選1.png'); h2,n2=gen('H2_候選1.png')
skin=sk_(new); out={k:v.copy() for k,v in L.items()}
# ---------------- 遠手 ----------------
O=(244,550); I=(380,572)                       # 手肘線：外側肘尖—內側肘窩
P1=(390,671); P2=(411,626)                     # 腕線（下緣、上緣）
wside=below(P1,P2); v=np.array([P2[1]-P1[1],P1[0]-P2[0]],float); v/=np.hypot(*v)
if not wside[int(P1[1]+v[1]*20),int(P1[0]+v[0]*20)]: v=-v
sh=lambda p,d:(p[0]+v[0]*d,p[1]+v[1]*d)
fore_side=~below(sh(P1,3),sh(P2,3))
SEAM=[(452,334),(447,360),(446,400),(444,440),(436,470),(420,500),(408,514)]
PL=[(225,325)]+SEAM+[(396,540),(402,575),(422,606),(430,640),(400,700),(225,700)]
polyL=poly(PL)
F=biggest(N&polyL&fore_side&~owned('head_idle','glasses','neck'))
lowS=below(O,I); fore=F&lowS; upper=F&~lowS
SK=tuple(int(x) for x in np.median(new[fore&skin&~ink(new)],axis=0))
wedge=biggest(ndi.binary_closing(upper&skin&~ink(new),iterations=3))          # 袖口外露出的上臂皮膚
sleeve=upper&~ndi.binary_dilation(wedge,iterations=1)
sleeve0=sleeve
sleeve=biggest(biggest(ndi.binary_opening(sleeve,iterations=7))|(sleeve&(yy<430)))   # 腋下、袖口的墨線尖角不留在袖子上
_im=Image.new('L',(W,H),0); ImageDraw.Draw(_im).line(SEAM[3:]+[(396,540)],fill=255,width=24)
band=(np.asarray(_im)>0)&sleeve&ink(new)&(yy>446)
sleeve=biggest(sleeve&~band)
armpit=sleeve0&~sleeve&(xx>380)&(yy>430)
arm_skin=F&~sleeve                                                            # 前臂＋袖口外的上臂皮膚：整塊歸前臂層
lo=rgba(new,arm_skin)
# 手肘端：沿袖口線往袖子底下長一塊圓弧收邊的皮膚（兩端收尖，不會從前臂輪廓外露出來）
bd=ndi.binary_dilation(wedge,iterations=3)&sleeve
by,bx=np.where(bd); cx_,cy_=bx.mean(),by.mean()
cov_=np.cov(np.stack([bx-cx_,by-cy_])); ev,evec=np.linalg.eigh(cov_); ax=evec[:,1]
sproj=(xx-cx_)*ax[0]+(yy-cy_)*ax[1]; half=np.abs(sproj[bd]).max()
dw=ndi.distance_transform_edt(~wedge)
DEPTH=20
lim=DEPTH*np.sqrt(np.clip(1-(sproj/(half-4))**2,0,1))
tuck=sleeve&(dw<=lim)&(dw>0)
tuck=ndi.binary_opening(tuck,iterations=2)
lo[tuck,:3]=SK; lo[tuck,3]=255
seal(lo,sleeve,SK,it=4)
rim=tuck&(dw>lim-7); lo[rim,:3]=(21,20,22)
print('手肘端',tuck.sum(),'弦半長',round(float(half)))
a_=lo[...,3]>0; lo[a_&~biggest(a_)]=0
out['arm_l_lower']=lo
up=rgba(new,sleeve)
root=alpha('arm_l_upper')&~polyL&(xx<470)                                      # 袖根：v2 在軀幹底下那段
m=root&(up[...,3]==0); up[m]=L['arm_l_upper'][m]
cm=lambda a:(a[...,0]>200)&(a[...,1]>180)&(a[...,2]>130)
dc=np.median(new[sleeve&cm(new)],axis=0)-np.median(up[...,:3][m&cm(up[...,:3].astype(int))].astype(int),axis=0); mm=m&cm(up[...,:3].astype(int)); up[mm,:3]=np.clip(up[mm,:3].astype(int)+dc,0,255); print('袖根調色',np.round(dc))
out['arm_l_upper']=up
for hn in ('hand_l_open','hand_l_point'):                                      # 換手：v2 腕根切到腕線
    h=out[hn]; h[~wside]=0; a_=h[...,3]>0; h[a_&~biggest(a_)]=0
HP=poly([sh(P2,-3),(448,599),(476,594),(522,612),(526,656),(502,682),(400,684),sh(P1,-3)])
hs=biggest(ndi.binary_closing(skin&HP&N,iterations=4))
hipm=ndi.binary_dilation(hs,iterations=8)&HP&N&(ink(new)|hs|skin)
hipm=biggest(ndi.binary_opening(ndi.binary_fill_holes(hipm|hs),iterations=2))&~arm_skin
out['hand_l_hip']=rgba(new,hipm)
print('遠手腕收窄',taper(out['arm_l_lower'],(401,649),(0.707,0.707),26,18,17,SK,hipm))
_l=out['arm_l_lower']; _a0=_l[...,3]>0; _k=ndi.binary_dilation(ndi.binary_opening(_a0,iterations=3),iterations=3)&_a0; _l[_a0&~_k]=0   # 細墨線鬚不留
_l=out['arm_l_lower']; _a=_l[...,3]>0; _g=ndi.binary_closing(_a,iterations=3)&~_a; _l[_g,:3]=SK; _l[_g,3]=255   # 手腕端和前臂之間的髮絲縫
print('遠手：袖子',sleeve.sum(),'前臂層',arm_skin.sum(),'收進袖口',tuck.sum(),'叉腰手',hipm.sum())
# ---------------- 近手 ----------------
grip=alpha('hand_r_grip')
polyR=poly([(640,340),(830,340),(830,625),(705,625),(690,560),(684,480),(690,400)])
body_old=np.logical_or.reduce([alpha(n) for n in ('torso','pelvis','leg_r_upper','neck','head_idle')])
sk=biggest(ndi.binary_closing(skin&poly([(700,495),(790,495),(800,600),(715,600)])&~grip,iterations=3))
foreR=ndi.binary_dilation(sk,iterations=10)&N&polyR&~grip&(ink(new)|sk)
foreR=biggest(ndi.binary_opening(ndi.binary_fill_holes(foreR|sk),iterations=3))
foreR=biggest(ndi.binary_opening(foreR&~((new[...,0]>200)&(new[...,1]>180)&(new[...,2]>130)),iterations=4))
loR=rgba(new,foreR); print('近手腕',wrist_end(loR,(729,566),(735,522),grip,20,24,SK))
out['arm_r_lower']=loR
slv=biggest(n2&polyR&(alpha('arm_r_upper')|~body_old))                        # H2：整隻袖子（含袖口）
upR=np.zeros((H,W,4),np.uint8); upR[slv,:3]=h2[slv]; upR[slv,3]=255
out['arm_r_upper']=upR
print('近手：袖子',slv.sum(),'前臂',foreR.sum())
# ---------------- 身體（軀幹、骨盆、腿、鞋）----------------
front=hipm|grip|foreR|slv|owned('head_idle','glasses')
body=['torso','pelvis','leg_l_upper','leg_r_upper','leg_l_lower','leg_r_lower','foot_l','foot_r','neck']
bodyN=N&~front&~sleeve&~arm_skin                                              # 母圖裡看得到的身體
dist=np.stack([ndi.distance_transform_edt(~(owned(b)&bodyN)) for b in body]); lab=np.argmin(dist,0)
lab[(lab==1)&(yy<612)&(xx<500)&skin]=0
Z=(ndi.binary_dilation(hipm|arm_skin,iterations=16)|ndi.binary_dilation(HP,iterations=18))&(xx<570)&(yy>545)   # 遠手後面：整塊用 H1
ZR=ndi.binary_dilation(grip|foreR|slv,iterations=6)&(xx>600)                                                    # 近手後面：用 H2
pm=lambda a:(a[...,0]>70)&(a[...,1]<75)&(a[...,2]>50)&(a[...,0]>a[...,2])
ref=bodyN&(lab==1)&~Z
delta=np.median(new[ref&pm(new)],axis=0)-np.median(h1[ref&pm(h1)],axis=0); h1=h1.copy(); h1[pm(h1)]=np.clip(h1[pm(h1)]+delta,0,255); print('H1 紫色校正',delta)
wsk=n1&sk_(h1)&(yy>=556)&(yy<=652)&(xx<560)
yb=np.where(wsk.any(0),H-1-np.argmax(wsk[::-1],axis=0),-1).astype(float); has=yb>=0
yb=np.where(has,ndi.median_filter(np.where(has,yb,0),size=9),-1); YB=np.broadcast_to(yb,(H,W))
for bi,b in enumerate(body):
    if b=='neck': continue
    vis=bodyN&(lab==bi); vis=biggest(vis) if vis.any() else vis
    lay_=out[b]; old=lay_[...,3]>128
    both=vis&old&~ink(new)&(L[b][...,:3].max(-1)>=80)
    if both.sum()>500:                                                         # 沿用的被擋處調到母圖的色調
        d=np.median(new[both],axis=0)-np.median(L[b][...,:3][both].astype(int),axis=0)
        hid=old&~vis&(lay_[...,:3].max(-1)>=80); lay_[hid,:3]=np.clip(lay_[hid,:3].astype(int)+d,0,255)
        print(b,'可見',vis.sum(),'被擋處調色',np.round(d))
    if b=='torso': lay_[polyL]=0
    if b in ('torso','pelvis'): lay_[Z]=0
    lay_[vis&~Z if b in ('torso','pelvis') else vis,:3]=new[vis&~Z if b in ('torso','pelvis') else vis]; lay_[vis&~Z if b in ('torso','pelvis') else vis,3]=255
    out[b]=lay_
t_=out['torso']; p_=out['pelvis']
t_[armpit,:3]=new[armpit]; t_[armpit,3]=255; print('腋下墨線歸軀幹',armpit.sum())
fill=Z&n1; toT=fill&(YB>=0)&(yy<=YB+3); toP=fill&((YB<0)|(yy>=YB-8))
t_[toT,:3]=h1[toT]; t_[toT,3]=255; p_[toP,:3]=h1[toP]; p_[toP,3]=255
tR=alpha('torso')&ZR&n2&~(bodyN&(lab==0))                                       # 近手後面的夾克右襟、背心
t_[tR,:3]=h2[tR]; t_[tR,3]=255
CREAM=tuple(int(x) for x in np.median(new[slv&cm(new)],axis=0))
und=ndi.binary_dilation(t_[...,3]>0,iterations=14)&slv&(t_[...,3]==0)&(yy<520)   # 近手袖子底下的夾克多墊一圈
pass  # （試過墊一圈平塗：手舉起來時在夾克側邊露出沒描線的淺色邊，不用）
for nme in ('torso','pelvis'):
    a_=out[nme][...,3]>0; out[nme][a_&~biggest(a_)]=0
print('H1 補進 軀幹',toT.sum(),'骨盆',toP.sum(),'H2 補進軀幹',tR.sum())
comp0=np.asarray(compose(out,ORDER))[...,3]>0; ms=N&~comp0&polyR&(xx>745)       # 近手袖口邊：歸袖子
out['arm_r_upper'][ms,:3]=new[ms]; out['arm_r_upper'][ms,3]=255
_a=out['arm_r_upper'][...,3]>0; _k=biggest(ndi.binary_dilation(ndi.binary_opening(_a,iterations=3),iterations=3)&_a); out['arm_r_upper'][_a&~_k]=0   # 細墨線鬚不留
# 母圖有、但沒有任何一層蓋到的細縫：歸給最近、而且在最上面的那一層
comp=np.asarray(compose(out,ORDER))[...,3]>0; missing=N&~comp
topvis=np.zeros((H,W),int)
for i,n in enumerate(ORDER,1): topvis[out[n][...,3]>0]=i
dn,(iy,ix)=ndi.distance_transform_edt(topvis==0,return_indices=True)
near=topvis[iy,ix]; fixm=missing&(dn<=8)
for i,n in enumerate(ORDER,1):
    m=fixm&(near==i)
    if m.any(): out[n][m,:3]=new[m]; out[n][m,3]=255
print('細縫補回',fixm.sum(),'仍缺',(missing&~fixm).sum())
# ---------------- 輸出 ----------------
for hn in ('hand_r_open','hand_r_pinch'): print(hn,'腕根裁掉',trim_stem(out[hn]))
for hn in ('hand_r_open','hand_r_pinch','hand_r_hatheld','hand_l_open','hand_l_point'): retone(out[hn],(13,9,-7))
g_=(own==idx['hand_r_grip'])&N; out['hand_r_grip'][g_,:3]=new[g_]
nk=(own==idx['neck'])&N; retone(out['neck'],(18,7,-11)); out['neck'][nk,:3]=new[nk]
comp1=np.asarray(compose(out,ORDER))[...,3]>0; last=N&~comp1&(yy>330)&(yy<700)   # 最後一道：靜止時還露底的像素補在軀幹
lg=last&(xx>740)&(yy>440)&(yy<530); last&=~lg; out['hand_r_grip'][lg,:3]=new[lg]; out['hand_r_grip'][lg,3]=255   # 握麥克風手旁邊的殘邊歸那隻手，不留在軀幹上飄著
out['torso'][last,:3]=new[last]; out['torso'][last,3]=255; print('最後補在軀幹',last.sum())
_u=(out['torso'][...,3]>0)|(out['arm_r_upper'][...,3]>0); _h=ndi.binary_fill_holes(ndi.binary_closing(_u,iterations=6))&~_u&(xx>640)&(yy<560)&(yy>340)
_sl=out['arm_r_upper']; _c=np.median(_sl[...,:3][(_sl[...,3]>0)&(_sl[...,:3].min(-1)>150)],axis=0); _sl[_h,:3]=_c; _sl[_h,3]=255; print('近手肩口的洞補在袖子',int(_h.sum()))
for _n in ORDER:      # 每層只留一整塊：不和本體相連的殘邊一律丟掉（跟著動會變成飄在外面的碎點）
    _a=out[_n][...,3]>0; _b=biggest(_a); 
    if (_a&~_b).any(): print(_n,'丟掉不相連碎塊',int((_a&~_b).sum())); out[_n][_a&~_b]=0
print('清灰塵',sum(clean_dust(v) for v in out.values()))
d=HERE/who/'layers'; d.mkdir(parents=True,exist_ok=True)
for n,a in out.items(): save(a,d/f'{n}.png')
json.dump({'order':[{'hand_l_hip':'hand_l','head_idle':'head','hand_r_grip':'hand_r'}.get(n,n) for n in ORDER]},open(HERE/who/'layers.json','w'),indent=1)
full=compose(out,ORDER); full.save(HERE/who/'assembled.png')
m=np.asarray(full); miss=N&(m[...,3]==0); extra=(m[...,3]>0)&~ndi.binary_dilation(N,iterations=2)
diff=(np.abs(m[...,:3].astype(int)-new).max(-1)>40)&N&(m[...,3]>0)
print('母圖有、合成沒有',miss.sum(),'合成多出',extra.sum(),'顏色差>40',diff.sum())
vv=np.full((H,W,3),(0x56,0x54,0x8c),np.uint8); a=m[...,3]>0; vv[a]=m[...,:3][a]; vv[miss]=(0,255,0); vv[extra]=(255,0,0); vv[diff]=(255,255,0)
Image.fromarray(vv).crop((200,300,860,1500)).save(HERE/who/'_diff.png')
