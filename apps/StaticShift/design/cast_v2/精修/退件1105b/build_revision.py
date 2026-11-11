"""Upper limbs own the complete, painted elbow/knee tip. Lower roots are
organically narrowed inside the upper layer's inscribed joint area; shafts
and distal interfaces retain their original scale and coordinates.
"""
from pathlib import Path
import json,shutil,math,sys
import numpy as np,cv2
from scipy import ndimage as ndi
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent;SIZE=(1024,1536);yy,xx=np.mgrid[:1536,:1024]
def load(f):return np.array(Image.open(f).convert('RGBA'))
def cleanup(a):
 lab,n=ndi.label(a[:,:,3]>40)
 if n:
  counts=np.bincount(lab.ravel());counts[0]=0;keep=ndi.binary_dilation(lab==counts.argmax(),iterations=2);a[~keep]=0
 lab,n=ndi.label(a[:,:,3]>0)
 if n:
  counts=np.bincount(lab.ravel());counts[0]=0;a[lab!=counts.argmax()]=0
 edge=(a[:,:,3]>0)&(a[:,:,3]<245);solid=a[:,:,3]>=245
 if edge.any()and solid.any():
  ids=ndi.distance_transform_edt(~solid,return_distances=False,return_indices=True);a[edge,:3]=a[ids[0][edge],ids[1][edge],:3]
 a[a[:,:,3]==0,:3]=0;return a
meta=json.loads((P/'source-mapping.json').read_text())
for ch in ['dj','host']:
 D=P/'candidate'/ch;B=P/'baseline'/ch
 if D.exists():shutil.rmtree(D)
 shutil.copytree(B,D);shutil.rmtree(D/'qa');(D/'qa').mkdir()
 layout=json.loads((B/'layout.json').read_text());J=layout['joints'];L={f.stem:load(f)for f in (B/'layers').glob('*.png')};out={}
 for kind,prox,dist,end,blend in [('arm','shoulder','elbow','wrist',42),('leg','hip','knee','ankle',120)]:
  for side in ['l','r']:
   key=f'{ch}_{kind}_{side}';f=P/(key+'_registered.png');assert f.exists(),f
   g=load(f);M=np.array(meta[key]['matrix']);inv=cv2.invertAffineTransform(M);g=cv2.warpAffine(g,inv,SIZE,flags=cv2.INTER_CUBIC);old=L[f'{kind}_{side}_upper'];S=np.array(J[prox+'_'+side],float);E=np.array(J[dist+'_'+side],float);v=(E-S)/np.linalg.norm(E-S);q=(xx-E[0])*v[0]+(yy-E[1])*v[1]
   # Only the repainted distal end; original shoulder, waist and pocket stay.
   start=-120 if kind=='arm'and ch=='dj'and side=='r'else -50
   w=np.clip((q-start)/18,0,1);a=np.round(old*(1-w[:,:,None])+g*w[:,:,None]).clip(0,255).astype('uint8')
   if kind=='arm':
    r,gr,b=old[:,:,:3].astype(float).transpose(2,0,1)
    cloth=((r>150)&(gr>r*.82)&(b>r*.68))if ch=='host'else((r>90)&(gr<r*.59)&(b<gr*.92))
    cloth=ndi.binary_dilation(cloth&(old[:,:,3]>80),iterations=4)&(old[:,:,3]>0);a[cloth]=old[cloth]
   a=cleanup(a);L[f'{kind}_{side}_upper']=a
   # The entire uninked proximal root must fit inside the upper part at EVERY
   # relative rotation. An inscribed disk is rotation invariant.
   joint_material=a[:,:,3]>180
   if kind=='arm':
    rr,gg,bb=a[:,:,:3].astype(float).transpose(2,0,1);warm=(rr>80)&(gg>rr*(.59 if ch=='dj'else .47))&(gg<rr*.84)&(bb<gg*.95)&(bb>gg*.32)&joint_material;warm=ndi.binary_fill_holes(ndi.binary_closing(warm,iterations=2));cloth=(rr>150)&(gg>rr*.82)&(bb>rr*.68);joint_material&=ndi.binary_dilation(warm,iterations=1)&~ndi.binary_dilation(cloth,iterations=1)
   inside=ndi.distance_transform_edt(joint_material);radius=float(inside[round(E[1]),round(E[0])])-2.5
   assert radius>=13,(key,'repaint must include complete hidden joint',radius)
   lower=L[f'{kind}_{side}_lower'];W=np.array(J[end+'_'+side],float);axis=(W-E)/np.linalg.norm(W-E);perp=np.array([-axis[1],axis[0]]);q=(xx-E[0])*axis[0]+(yy-E[1])*axis[1];c=(xx-E[0])*perp[0]+(yy-E[1])*perp[1]
   # Measure the original root radius from its alpha, not an assumed ellipse.
   oldroot=(lower[:,:,3]>160)&(q<0)&(q>-100)&(abs(c)<110);Y,X=np.where(oldroot);R=float(np.hypot(X-E[0],Y-E[1]).max())if len(X)else radius
   root=min(R,radius);ratio=root/max(R,1);t=np.clip(q/blend,0,1);t=t*t*(3-2*t);scale=ratio+(1-ratio)*t;srcq=np.where(q<0,q/max(ratio,.01),q);srcc=c/scale
   mx=(E[0]+axis[0]*srcq+perp[0]*srcc).astype('float32');my=(E[1]+axis[1]*srcq+perp[1]*srcc).astype('float32');new=cv2.remap(lower,mx,my,cv2.INTER_CUBIC)
   new[(q<0)&(np.hypot(xx-E[0],yy-E[1])>root+.75)]=0
   # Match the hidden joint material to the generated upper-arm/trouser art.
   lum=a[:,:,:3]@[.299,.587,.114];ar,ag,ab=a[:,:,:3].astype(float).transpose(2,0,1);sample=(a[:,:,3]>220)&(np.hypot(xx-E[0],yy-E[1])<max(root,15))&(lum>(100 if kind=='arm'else 32))
   assert sample.any(),(key,'no valid joint pigment sample')
   if kind=='arm':sample&=(ag>ar*(.59 if ch=='dj'else .47))&(ag<ar*.83)&(ab<ag*.94)
   assert sample.any(),(key,'no valid material after skin classification')
   if sample.any():
    rgb=np.median(a[sample,:3],axis=0);r,gr,b=new[:,:,:3].astype(float).transpose(2,0,1);material=(new[:,:,3]>0)&((r>gr*1.22)&(gr>r*.45)&(b<gr*.95)if kind=='arm'else((new[:,:,:3]@[.299,.587,.114])>65));weight=np.where(q<0,1.,np.clip((12-q)/20,0,1)*material);new[:,:,:3]=(new[:,:,:3]*(1-weight[:,:,None])+rgb*weight[:,:,None]).clip(0,255).astype('uint8')
   # Shared generated material at the actual overlap prevents a circular
   # pigment seam when a concealed root rotates against its neighbour.
   radial=np.hypot(xx-E[0],yy-E[1]);palette_weight=np.clip((root+31-radial)/30,0,1)
   for ar in [a,new]:
    rr,gg,bb=ar[:,:,:3].astype(float).transpose(2,0,1);mat=((rr>80)&(gg>rr*(.59 if ch=='dj'else .47))&(gg<rr*.85)&(bb<gg*.95)&(bb>gg*.32))if kind=='arm'else((ar[:,:,:3]@[.299,.587,.114])>32);weight=palette_weight*mat;ar[:,:,:3]=(ar[:,:,:3]*(1-weight[:,:,None])+rgb*weight[:,:,None]).clip(0,255).astype('uint8')
   L[f'{kind}_{side}_upper']=cleanup(a)
   L[f'{kind}_{side}_lower']=cleanup(new);out[key]={'upper_joint_inscribed_radius_px':round(radius+2.5,2),'original_root_radius_px':round(R,2),'retracted_root_radius_px':round(root,2),'unchanged_shaft_beyond_joint_px':blend}
 # Closed clothing contours at the actual shoulder attachment, preserving
 # original fabric volume and all cuff folds. Torso still occludes the root.
 from root_cloth_ink import repair_cloth
 for side in ['l','r']:
  L[f'arm_{side}_upper']=repair_cloth(L[f'arm_{side}_upper'],J,side,ch)
 L['torso']=repair_cloth(L['torso'],J,'l',ch)
 from root_cloth_ink import repair_hip_root
 for side in ['l','r']:
  L[f'leg_{side}_upper']=repair_hip_root(L[f'leg_{side}_upper'],J,side,ch)
 # Restore both side ink lines from the full generated forearm source; old
 # narrow source crops had cut one border off, especially on the host.
 from shaft_ink import repair_forearm
 for side in ['l','r']:
  temp=dict(J);temp['_radius_'+side]=out[f'{ch}_arm_{side}']['upper_joint_inscribed_radius_px']
  L[f'arm_{side}_lower']=repair_forearm(L[f'arm_{side}_lower'],temp,side,ch)
 # Every interchangeable wrist gets the same actual source pigment, without
 # recolouring ink, jewelry, headphones or microphones.
 for side in ['l','r']:
  E=np.array(J['elbow_'+side],float);W=np.array(J['wrist_'+side],float);v=(W-E)/np.linalg.norm(W-E);q=(xx-W[0])*v[0]+(yy-W[1])*v[1];c=-(xx-W[0])*v[1]+(yy-W[1])*v[0];fore=L[f'arm_{side}_lower'];sample=(q>-55)&(q<-20)&(abs(c)<8)&(fore[:,:,3]>220);rgb=np.median(fore[sample,:3],axis=0)
  for n in [f'arm_{side}_lower',*[n for n in L if n.startswith('hand_'+side)]]:
   a=L[n];r,g,b=a[:,:,:3].astype(float).transpose(2,0,1);skin=(r>80)&(g>r*.48)&(g<r*.9)&(b>g*.35)&(b<g*.94)&(a[:,:,3]>0);dist=np.hypot(xx-W[0],yy-W[1]);weight=np.clip((105-dist)/25,0,1)*skin
   if n==f'arm_{side}_lower':
    joint_radius=out[f'{ch}_arm_{side}']['retracted_root_radius_px'];weight*=np.clip((np.hypot(xx-E[0],yy-E[1])-joint_radius-2)/25,0,1)
   a[:,:,:3]=(a[:,:,:3]*(1-weight[:,:,None])+rgb*weight[:,:,None]).clip(0,255).astype('uint8');L[n]=a
  if side=='l':
   from wrist_adapter import adapt_left
   L=adapt_left(L,J,ch,yy,xx)
  # The forearm's extra distal underpaint fits inside ALL hand variants. No
  # real shaft between elbow and wrist is removed; only q>0 overlap changes.
  common=np.ones((1536,1024),bool)
  for n in [n for n in L if n.startswith('hand_'+side)]:common&=L[n][:,:,3]>160
  common=ndi.binary_erosion(common,iterations=1);a=L[f'arm_{side}_lower'];tip=(q>0);a[tip&~common]=0;opened=cv2.morphologyEx((a[:,:,3]>128).astype('uint8'),cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7)))>0;a[tip&~opened]=0;L[f'arm_{side}_lower']=cleanup(a)
 # Deep concealed hand stems inherit the exact forearm pixels. This keeps
 # texture and pigment identical through the overlap, including short arms.
 for side in ['l','r']:
  E=np.array(J['elbow_'+side],float);W=np.array(J['wrist_'+side],float);v=(W-E)/np.linalg.norm(W-E);q=(xx-W[0])*v[0]+(yy-W[1])*v[1];fore=L[f'arm_{side}_lower']
  for name in [n for n in L if n.startswith('hand_'+side)]:
   a=L[name];rr,gg,bb=a[:,:,:3].astype(float).transpose(2,0,1);skin=(rr>80)&(gg>rr*.48)&(gg<rr*.9)&(bb>gg*.35)&(bb<gg*.94);zone=(q<-12)&(fore[:,:,3]>180)&(a[:,:,3]>0)&skin;a[zone,:3]=fore[zone,:3];L[name]=a
 for n,a in L.items():a=cleanup(a);L[n]=a;Image.fromarray(a).save(D/'layers'/(n+'.png'))
 full=Image.new('RGBA',SIZE)
 for n in layout['draw_order']:full.alpha_composite(Image.fromarray(L[n]))
 full.save(D/'assembled.png');full.save(D/'master.png');bg=Image.new('RGBA',SIZE,'#e5e2d6');bg.alpha_composite(full);bg.convert('RGB').save(D/'qa/assembled-paper.jpg',quality=96)
 layout['status']='R2_SOURCE_REPAIR_CANDIDATE';(D/'layout.json').write_text(json.dumps(layout,indent=2)+'\n');(D/'qa/root-containment.json').write_text(json.dumps(out,indent=2)+'\n');print(ch,out)
