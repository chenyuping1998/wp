"""Normalize archived ImageGen source PNGs and split at the EXISTING joints.
No motion/rig changes. Full limbs are retained beside the split source layers.
"""
from pathlib import Path
from PIL import Image,ImageChops,ImageFilter
import json,math
D=Path(__file__).resolve().parent;G=D/'source/generated-repairs-1028';R=D/'source/repairs-1028';SIZE=(1024,1536)
def normalized(path):
 im=Image.open(path).convert('RGBA');assert im.size==SIZE
 a=im.getchannel('A').point(lambda v:255 if v>=220 else 0)
 a=a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
 a=a.resize((2048,3072),Image.Resampling.LANCZOS).resize(SIZE,Image.Resampling.LANCZOS).point(lambda v:0 if v<16 else 255 if v>239 else v)
 im.putalpha(a);return im

def register(im,a,b,c,d):
 scale=math.dist(c,d)/math.dist(a,b);angle=math.atan2(d[1]-c[1],d[0]-c[0])-math.atan2(b[1]-a[1],b[0]-a[0]);co=math.cos(angle)*scale;si=math.sin(angle)*scale
 tx=c[0]-co*a[0]+si*a[1];ty=c[1]-si*a[0]-co*a[1];det=co*co+si*si
 return im.convert('RGBa').transform(SIZE,Image.Transform.AFFINE,(co/det,si/det,(-co*tx-si*ty)/det,-si/det,co/det,(si*tx-co*ty)/det),Image.Resampling.BICUBIC).convert('RGBA')

def split_limb(full,joint,root,end,radius):
 jx,jy=joint;ap=full.getchannel('A').load();p=full.load();upper=Image.new('RGBA',SIZE);lower=Image.new('RGBA',SIZE);up=upper.load();lp=lower.load();box=full.getchannel('A').getbbox()
 ux,uy=root[0]-jx,root[1]-jy;ul=math.hypot(ux,uy);ux/=ul;uy/=ul
 lx,ly=end[0]-jx,end[1]-jy;ll=math.hypot(lx,ly);lx/=ll;ly/=ll
 for y in range(box[1],box[3]):
  for x in range(box[0],box[2]):
   if not ap[x,y]:continue
   dx=x-jx;dy=y-jy;tu=dx*ux+dy*uy;tl=dx*lx+dy*ly;du=abs(dx*uy-dy*ux);dl=abs(dx*ly-dy*lx)
   if (tu>=0 and (du<=dl or tl<0)) or math.hypot(dx,dy)<=radius:up[x,y]=p[x,y]
   if (tl>=0 and (dl<du or tu<0)) or math.hypot(dx,dy)<=radius:lp[x,y]=p[x,y]
 return upper,lower

def save(n,im):R.mkdir(parents=True,exist_ok=True);im.save(R/(n+'.png'))
def clean_interior_ink(im,joint,radius):
 """Remove cuff/forearm contour remnants inside opaque fur, keeping silhouette ink."""
 out=im.copy();p=out.load();src=im.load();jx,jy=joint
 interior=im.getchannel('A').filter(ImageFilter.MinFilter(7)).load()
 for y in range(max(0,jy-radius),min(SIZE[1],jy+radius+1)):
  for x in range(max(0,jx-radius),min(SIZE[0],jx+radius+1)):
   r,g,b,a=src[x,y]
   if (x-jx)**2+(y-jy)**2>radius**2 or interior[x,y]<240 or not (r<90 and g<50 and b<37):continue
   samples=[src[xx,yy] for yy in range(y-9,y+10) for xx in range(x-9,x+10) if src[xx,yy][3]>240 and 100<src[xx,yy][0]<175 and src[xx,yy][1]>50]
   if samples:p[x,y]=(*(sorted(c[k] for c in samples)[len(samples)//2] for k in range(3)),a)
 return out
def knee_pigment(im,joint):
 """One continuous skin pigment for both halves, no circular shading boundary."""
 out=im.copy();p=out.load();jx,jy=joint
 for y in range(jy-85,jy+86):
  for x in range(jx-85,jx+86):
   r,g,b,a=p[x,y];distance=math.hypot(x-jx,y-jy)
   if not a or distance>=85:continue
   blend=max(0,min(1,(85-distance)/45));blend=blend*blend*(3-2*blend)
   p[x,y]=(round(r*(1-blend)+145*blend),round(g*(1-blend)+78*blend),round(b*(1-blend)+47*blend),a)
 return out
def clean_overlap(im,joint,toward,radius,depth=40,pigment=None):
 """Complete a hidden socket from INTERIOR pigment, never an outlined edge.

 The old cross-axis donor copied contour ink into the cap; leaving the
 forward contour untouched also kept a notch at the cap/body junction.
 Interpolate both contour edges into the existing body at `depth` instead.
 Alpha only antialiases the outer silhouette, not an internal circular seam.
 """
 out=im.copy();src=im.load();px=out.load();jx,jy=joint
 ux,uy=toward[0]-jx,toward[1]-jy;length=math.hypot(ux,uy);ux/=length;uy/=length
 def coord(t,v):return round(jx+ux*t-uy*v),round(jy+uy*t+ux*v)
 def color(t,v):
  # Central 40% only: no ink, bright contour pixels or transparent RGB.
  samples=[]
  for dt in [-2,0,2]:
   for dv in [-2,0,2]:
    c=src[coord(t+dt,v+dv)]
    if c[3]>240:samples.append(c)
  if not samples:raise ValueError('No opaque interior socket pigment')
  return tuple(round(sum(c[k] for c in samples)/len(samples)) for k in range(3))
 span=[v for v in range(-75,76) if src[coord(depth,v)][3]>220]
 if not span:raise ValueError('Socket body missing')
 lo,hi=min(span),max(span)
 box=im.getchannel('A').getbbox();pad=radius+75
 for y in range(max(0,min(box[1],round(jy-pad))),min(SIZE[1],max(box[3],round(jy+pad)))):
  for x in range(max(0,min(box[0],round(jx-pad))),min(SIZE[0],max(box[2],round(jx+pad)))):
   dx=x-jx;dy=y-jy;t=dx*ux+dy*uy;v=-dx*uy+dy*ux
   if t>=depth:continue
   if t<0:coverage=max(0,min(1,radius-math.hypot(t,v)+.5))
   else:
    f=t/depth;f=f*f*(3-2*f)
    left=-radius+(lo+radius)*f;right=radius+(hi-radius)*f
    coverage=max(0,min(1,min(v-left,right-v)+.5))
   if not coverage:px[x,y]=(0,0,0,0);continue
   donor=pigment or color(depth,max(lo*.4,min(hi*.4,v*.4)))
   original=src[x,y];blend=max(0,min(1,t/depth))**2
   # Blend towards clean body shading, but never reintroduce ink fragments.
   if original[3]<240 or min(original[:3])<22:blend=0
   rgb=tuple(round(donor[k]*(1-blend)+original[k]*blend) for k in range(3))
   px[x,y]=(*rgb,round(255*coverage))
 return out
def socket(im,joint,toward,radius,fill_forward=False):
 """Unoutlined rounded source overlap; no opposite-limb stub or square mask."""
 out=im.copy();src=im.load();px=out.load();jx,jy=joint
 ux,uy=toward[0]-jx,toward[1]-jy;length=math.hypot(ux,uy);ux/=length;uy/=length
 box=im.getchannel('A').getbbox()
 x0=max(0,min(box[0],round(jx-radius-2)));y0=max(0,min(box[1],round(jy-radius-2)))
 x1=min(SIZE[0],max(box[2],round(jx+radius+2)));y1=min(SIZE[1],max(box[3],round(jy+radius+2)))
 for y in range(y0,y1):
  for x in range(x0,x1):
   dx=x-jx;dy=y-jy;t=dx*ux+dy*uy;v=-dx*uy+dy*ux
   # A completed standalone part already has its visible contour. Preserve
   # the forward side rather than switching a clipped strip off at 32px.
   if t>=32 or (fill_forward and t>=0):continue
   if t<0:
    coverage=max(0,min(1,radius-math.hypot(t,v)+.5))
    if coverage==0:px[x,y]=(0,0,0,0);continue
    sample=src[round(jx+ux*30-uy*v),round(jy+uy*30+ux*v)]
    if sample[3]<220:sample=src[round(jx+ux*30),round(jy+uy*30)]
    px[x,y]=(*sample[:3],round(255*coverage))
   else:
    coverage=max(0,min(1,radius+t*.4-abs(v)+.5))
    color=px[x,y]
    if fill_forward and t<16 and coverage>0:
     sample=src[round(jx+ux*30-uy*v),round(jy+uy*30+ux*v)]
     if sample[3]<220:sample=src[round(jx+ux*30),round(jy+uy*30)]
     color=(*sample[:3],max(color[3],round(255*coverage)))
    px[x,y]=(*color[:3],round(color[3]*coverage))
 return out
def main():
 parts=json.loads((G/'manifest.json').read_text())['parts']
 for n in ['pelvis','neck']:
  if n in parts:save(n,normalized(G/(n+'.png')))
 if 'tail_1' in parts:
  tail=register(normalized(G/'tail_1.png'),(649,785),(866,1030),(646,785),(837,1016))
  # The distal overlap uses the original continuous tail's exact pixels. A
  # generated closed-end ink line must not become a transverse joint seam.
  oldtail=Image.open(D/'source/original-split-1028/tail_2.png').convert('RGBA');tp=tail.load();op=oldtail.load()
  for y in range(978,1065):
   for x in range(794,890):
    if x>837 and (x-837)**2+(y-1016)**2>30**2:tp[x,y]=(0,0,0,0);continue
    if x>=810 and tp[x,y][3]:
     donor=op[x,y]
     if donor[3]>220:tp[x,y]=donor
     elif x>829:tp[x,y]=(0,0,0,0)
  save('tail_1',tail)
 if 'fg_torso' in parts:save('torso',register(normalized(G/'fg_torso.png'),(520,418),(463,725),(493,410),(466,650)))
 registration={}
 # Independently completed anatomical segments supersede the bent-arm
 # extraction drafts. Each source contains exactly one anatomical part.
 single_anchors={
  'clean_arm_l_upper':((411,445),(255,625),(374,439),(285,560)),
  'clean_arm_r_upper':((605,443),(736,612),(607,445),(730,612)),
  'clean_arm_l_lower':((300,580),(190,365),(285,560),(190,382)),
  'clean_arm_r_lower':((753,575),(600,688),(730,612),(609,682)),
 }
 for side in ['l','r']:
  for suffix in ['upper','lower']:
   key=f'clean_arm_{side}_{suffix}'
   if key not in parts:continue
   im=normalized(G/(key+'.png'))
   if key in single_anchors:
    a,b,c,d=single_anchors[key];im=register(im,a,b,c,d);registration[key]={'sourceAnchors':[a,b],'targetAnchors':[c,d],'method':'single complete anatomical part; similarity transform'}
   joint=(285,560) if side=='l' else (730,612)
   root=(374,439) if side=='l' else (607,445)
   end=(190,382) if side=='l' else (609,682)
   im=socket(im,joint,root if suffix=='upper' else end,32,True)
   if suffix=='upper':im=clean_overlap(im,joint,root,22,45)
   else:
    im=clean_overlap(im,joint,end,22,48)
    im=clean_overlap(im,end,joint,18,40)
    im=clean_interior_ink(im,end,65)
    im=clean_interior_ink(im,joint,60)
   save(f'arm_{side}_{suffix}',im)
 # The existing leg anatomy already matches the approved silhouette. Repair
 # its source split, not its bone proportions. Use the exact shared knee
 # pixels from the union of the two original layers in the overlap area.
 from PIL import ImageDraw
 old=D/'source/original-split-1028'
 for side,knee,radius in [('l',(333,1058),33),('r',(580,1077),33)]:
  upper=Image.open(old/f'leg_{side}_upper.png').convert('RGBA');lower=Image.open(old/f'leg_{side}_lower.png').convert('RGBA')
  full=upper.copy();full.alpha_composite(lower)
  for suffix,im in [('upper',upper),('lower',lower)]:
   mask=im.getchannel('A').point(lambda v:255 if v>=210 else 0)
   # A circle rounds the overlap instead of keeping the extraction rectangle.
   x,y=knee;cap=Image.new('L',SIZE);ImageDraw.Draw(cap).ellipse((x-radius,y-radius,x+radius,y+radius),fill=255)
   if suffix=='lower':
    keep=Image.new('L',SIZE,255);ImageDraw.Draw(keep).rectangle((0,0,1024,y-3),fill=0);keep=ImageChops.lighter(keep,cap);mask=ImageChops.multiply(mask,keep)
   shared=ImageChops.multiply(cap,full.getchannel('A'));mask=ImageChops.lighter(mask,shared)
   result=full.copy();result.putalpha(mask)
   # Remove the historic clothes edge from the CONCEALED thigh socket only.
   if suffix=='upper':
    p=result.load()
    for yy in range(740,835):
     for xx in range(270,655):
      rr,gg,bb,aa=p[xx,yy]
      if aa and ((rr>gg*1.65 and gg>bb*1.15) or (rr>170 and gg>95)):
       donor=full.getpixel((xx,850))
       if donor[3]>220:p[xx,yy]=(*donor[:3],aa)
   if suffix=='lower':result=clean_overlap(result,knee,(x,y+100),29,42)
   result=knee_pigment(result,knee)
   save(f'leg_{side}_{suffix}',result)
 # Keep approved palms/fingers, register cuff fur to its actual forearm's
 # colour at the wrist, so a different-colour furry tube is not baked in.
 for name in ['hand_l_hip','hand_l_point','hand_l_open','hand_r_pinch','hand_r_grip','hand_r_open']:
  hand=Image.open(old/(name+'.png')).convert('RGBA');hp=hand.load();left=name.startswith('hand_l')
  arm=Image.open(R/('arm_l_lower.png' if left else 'arm_r_lower.png')).convert('RGBA');ap=arm.load();box=hand.getchannel('A').getbbox()
  for y in range(box[1],box[3]):
   for x in range(box[0],box[2]):
    rr,gg,bb,aa=hp[x,y]
    if not aa or not (65<rr<185 and gg<112 and bb<88 and rr>gg*1.3 and gg>bb*1.12):continue
    blend=max(0,min(1,(y-329)/42 if left else (x-552)/43))
    donor=ap[x,y]
    if donor[3]<220:donor=ap[190,382] if left else ap[609,682]
    if donor[3]>220:hp[x,y]=(round(rr+(donor[0]-rr)*blend),round(gg+(donor[1]-gg)*blend),round(bb+(donor[2]-bb)*blend),aa)
  # A shared 40px round socket survives the unchanged wrist rotation without
  # an elongated cuff extension protruding through the adjoining silhouette.
  wrist=(190,382) if left else (609,682)
  # Concealed extension follows the FOREARM axis; fingers may flex at the
  # wrist, so their direction is not a valid hidden-overlap direction.
  palm=((95,204) if name=='hand_l_hip' else (100,300)) if left else (488,752)
  wx,wy=wrist;ux,uy=palm[0]-wx,palm[1]-wy;length=math.hypot(ux,uy);ux/=length;uy/=length
  oldhand=hand.copy();hp=hand.load();donor=ap[wx,wy]
  for y in range(box[1],box[3]+30):
   for x in range(max(0,box[0]-30),min(1024,box[2]+30)):
    dx=x-wx;dy=y-wy;t=dx*ux+dy*uy;v=-dx*uy+dy*ux
    if t>=12:continue
    inside=t*t+v*v<=20**2 if t<0 else abs(v)<=20+t*.35
    if not inside:hp[x,y]=(0,0,0,0)
    elif t<4:hp[x,y]=(*donor[:3],255)
  # Match the forearm's interior pigment and round the entire cuff transition,
  # including the old two dark ticks, rather than stamping a separate disk.
  sample=ap[wx,wy]
  hand=clean_overlap(hand,wrist,palm,18,32,pigment=sample[:3])
  hand=clean_interior_ink(hand,wrist,70)
  # The cuff's former exterior ink becomes an INTERIOR line when the wrist
  # rotates over the forearm. Remove it throughout the concealed fur region;
  # preserve the palm/finger drawing beyond that region.
  hp=hand.load()
  for y in range(max(0,wy-75),min(1536,wy+76)):
   for x in range(max(0,wx-75),min(1024,wx+76)):
    rr,gg,bb,aa=hp[x,y];t=(x-wx)*ux+(y-wy)*uy
    if aa and t<62 and (x-wx)**2+(y-wy)**2<75**2 and rr<95 and gg<55:hp[x,y]=(*sample[:3],aa)
  save(name,hand)
 # Reject substantial disconnected anatomy; remove sub-eight-pixel resample
 # specks at source, before Spine images/atlas/preview are rebuilt.
 import importlib.util
 spec=importlib.util.spec_from_file_location('source_cc',D.parent/'cast_mg/check_connected.py');cc=importlib.util.module_from_spec(spec);spec.loader.exec_module(cc)
 for path in R.glob('*.png'):
  im=Image.open(path).convert('RGBA');parts=cc.components(im.getchannel('A'))
  for component in parts[1:]:
   if component['area']>8:raise ValueError(f'Disconnected source anatomy: {path.name}: {component}')
   from PIL import ImageDraw
   alpha=im.getchannel('A');x0,y0,x1,y1=component['bbox'];ImageDraw.Draw(alpha).rectangle((x0,y0,x1-1,y1-1),fill=0);im.putalpha(alpha)
  if len(parts)>1:im.save(path)
 (R/'registration.json').write_text(json.dumps(registration,indent=2)+'\n')
 print('Imported generated sources, keeping full canvas and original joints.')
if __name__=='__main__':main()
