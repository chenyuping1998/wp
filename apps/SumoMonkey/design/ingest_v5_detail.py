"""Register ImageGen detail patches without accepting its canvas/pose drift.

All inputs are the installed v5 layers, never the obsolete delivery folder.
Generated texture is composited only into explicit repair masks. Feet, exposed
gloves and all layers outside the brief retain their original pixels. Work is
staged beside the brief; --install is a separate step after visual acceptance.
"""
from pathlib import Path
import json, shutil, argparse
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import label, distance_transform_edt, gaussian_filter, binary_closing
from scipy.interpolate import PchipInterpolator

A=Path(__file__).resolve().parents[1]
R=A.parents[2]
B=R/'_upload_backups/SumoMonkey-before-v5-detail-20261027/design/sumo_cast'
W=R/'角色生圖_相撲猴/補畫_v5/工作'
MANIFEST=W/'imagegen-manifest.json'
Y,X=np.mgrid[:1536,:1024]

def main_component(alpha):
    ids,_=label(alpha>0, np.ones((3,3)))
    sizes=np.bincount(ids.ravel());sizes[0]=0
    return ids==sizes.argmax()

def bbox(mask):
    ys,xs=np.nonzero(mask)
    return (int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1))

def donor(source,generated):
    """Registration is confined to a texture donor; final parts never move."""
    s=np.asarray(source);g=np.asarray(generated.convert('RGBA'))
    srcbox=bbox(s[:,:,3]>128);genbox=bbox(main_component(g[:,:,3]>180))
    tex=generated.crop(genbox).resize((srcbox[2]-srcbox[0],srcbox[3]-srcbox[1]),Image.Resampling.LANCZOS)
    out=np.zeros_like(s);out[srcbox[1]:srcbox[3],srcbox[0]:srcbox[2]]=np.asarray(tex)
    mask=out[:,:,3]>180
    # The generator's soft halo is never used for final alpha. Sample texture
    # from the opaque interior so its artificial shadow cannot become a fringe.
    inside=distance_transform_edt(mask)>7
    _,nearest=distance_transform_edt(~inside,return_indices=True)
    return out[nearest[0],nearest[1],:3].astype(float),inside,out

def coords(j,a,b):
    p=np.array(list(j[a].values()),float);q=np.array(list(j[b].values()),float)
    v=q-p;L=np.linalg.norm(v);v/=L
    return (X-p[0])*v[0]+(Y-p[1])*v[1],(X-p[0])*(-v[1])+(Y-p[1])*v[0],L

def profile(values,knots,radii):
    return PchipInterpolator(knots,radii)(np.clip(values,knots[0],knots[-1]))

def soft_profile(s,c,L,knots,widths,cap):
    radius=np.interp(s/L,knots,widths)
    # Round hidden endpoint, not a second visible circle.
    radius=np.minimum(radius,np.sqrt(np.maximum(0,cap*cap-np.maximum(s-L,0)**2)))
    return np.clip(radius-np.abs(c)+.5,0,1)

def build():
    entries=json.loads(MANIFEST.read_text());lookup={(e['cast'],e['part']):e for e in entries}
    report={}
    for cast in ['mg','fg']:
        root=B/cast;src=root/'layers';dst=W/cast/'layers';dst.mkdir(parents=True,exist_ok=True)
        order=json.loads((src/'layers.json').read_text())['order'];j=json.loads((src/'joints.json').read_text())
        arrays={n:np.asarray(Image.open(src/f'{n}.png').convert('RGBA')).copy() for n in order}
        opaque_above={};cover=np.zeros((1536,1024),bool)
        for n in reversed(order):
            opaque_above[n]=cover.copy();cover|=arrays[n][:,:,3]>250
        report[cast]={}
        for part in order:
            base=arrays[part];out=base.copy();key=(cast,part)
            if key not in lookup:
                Image.fromarray(out).save(dst/f'{part}.png');continue
            e=lookup[key];raw=Path(e['path']);rawdest=W/'generated'/cast/f'{part}.png';rawdest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(raw,rawdest)
            tex,donor_valid,registered=donor(Image.fromarray(base),Image.open(raw).convert('RGBA'))
            alpha=base[:,:,3].astype(float)/255
            main=main_component(base[:,:,3]);removed=int(np.count_nonzero((base[:,:,3]>0)&~main));alpha*=main
            shape=False
            if part.startswith('leg_'):
                side='F' if 'front' in part else 'B'
                if part.endswith('upper'):
                    s,c,L=coords(j,'hip'+side,'knee'+side)
                    knee=63 if cast=='mg' else 57
                    # Only distal third is trimmed; hip silhouette stays native.
                    r=profile(s/L,[0,.35,.6,.8,1,1.3],[180,180,140,90,knee,knee])
                    r=np.minimum(r,np.sqrt(np.maximum(0,knee**2-np.maximum(s-L,0)**2))+np.where(s<L,10000,0))
                    mask=np.clip(r-np.abs(c)+.5,0,1)
                    mask=np.where(s>L+knee,0,mask)
                    alpha=np.minimum(alpha,mask);shape=True
                else:
                    s,c,L=coords(j,'knee'+side,'ankle'+side)
                    # Continuous calf profile replaces the two stacked bulbs.
                    radius=profile(s/L,[-.3,0,.28,.5,.65,.8,1],[50,50,64,78,130,220,300])*(1 if cast=='mg' else .96)
                    radius=np.minimum(radius,np.sqrt(np.maximum(0,50**2-np.minimum(s,0)**2))+np.where(s>0,10000,0))
                    kneealpha=np.clip(radius-np.abs(c)+.5,0,1)*((s>=-60)&(s<=L))
                    blend=np.clip((L*.7-s)/25,0,1)
                    generated_alpha=np.clip((registered[:,:,3].astype(float)-128)/112,0,1)
                    generated_alpha=np.minimum(generated_alpha,kneealpha)
                    original_alpha=alpha.copy()
                    alpha=np.minimum(original_alpha,np.where(s<L-35,kneealpha,1))
                    fur=registered[:,:,:3].copy()
                    origfur=base[(base[:,:,3]>200)&(s<L*.75),:3]
                    genfur=fur[(generated_alpha>.9)&(s<L*.75),:3]
                    shift=np.median(origfur,axis=0)-np.median(genfur,axis=0)
                    fur=np.clip(fur.astype(float)+shift,0,255)
                    blend*=((generated_alpha>.9)&(fur.mean(axis=2)<170))
                    rgb=base[:,:,:3]*(1-blend[:,:,None])+fur*blend[:,:,None]
                    out[:,:,:3]=np.rint(np.clip(rgb,0,255)).astype('uint8')
                    # Keep original foot and ankle; no generated foot accepted.
                    shape=True
            if cast=='mg' and part=='arm_front_lower':
                s,c,L=coords(j,'elbowF','wristF')
                radius=profile(s/L,[-.5,0,.35,1,1.5],[38,39,37,28,24])
                radius=np.minimum(radius,np.sqrt(np.maximum(0,39**2-np.minimum(s,0)**2))+np.where(s>0,10000,0))
                alpha=np.minimum(alpha,np.clip(radius-np.abs(c)+.5,0,1)*(s>=-39));shape=True
            # Original anti-aliasing is retained except along changed contours.
            alpha=np.clip(alpha,0,1);newmask=alpha>.01
            oldmask=base[:,:,3]>128
            added=newmask&~oldmask
            repair=added.copy()
            if shape:
                oldinside=distance_transform_edt(oldmask)
                newinside=distance_transform_edt(newmask)
                repair|=newmask&(newinside<5)&(np.abs(alpha-base[:,:,3]/255)>0.03)
            hidden_edge=(distance_transform_edt(oldmask)<7)&oldmask&opaque_above[part]
            repair|=hidden_edge
            # Match generated patch value to the existing material; repair only
            # border/underpaint pixels rather than replacing unchanged anatomy.
            material=oldmask&(distance_transform_edt(oldmask)>12)
            origvalue=np.median(base[material,:3],axis=0)
            genvalue=np.median(tex[material],axis=0)
            tex=np.clip(tex+origvalue-genvalue,0,255)
            repair&=donor_valid
            out[repair,:3]=tex[repair].astype('uint8')
            # Concealed edge repair samples the same native material, at most
            # 9px inside the original edge. Never stretch a remote donor pixel.
            depth=distance_transform_edt(oldmask)
            gy,gx=np.gradient(gaussian_filter(depth,1))
            norm=np.maximum(np.hypot(gx,gy),.001)
            offset=np.maximum(0,18-2*depth)
            nx=np.clip(np.rint(X+gx/norm*offset).astype(int),0,1023)
            ny=np.clip(np.rint(Y+gy/norm*offset).astype(int),0,1535)
            hidden=hidden_edge&newmask
            hidden&=oldmask[ny,nx]
            out[hidden,:3]=base[ny[hidden],nx[hidden],:3]
            if part.startswith('leg_') and part.endswith('upper'):
                side='F' if 'front' in part else 'B'
                ss,cc,ll=coords(j,'hip'+side,'knee'+side)
                hp=np.array(list(j['hip'+side].values()),float);kp=np.array(list(j['knee'+side].values()),float)
                axis=(kp-hp)/ll
                tx=np.clip(np.rint(X+axis[0]*60).astype(int),0,1023)
                ty=np.clip(np.rint(Y+axis[1]*60).astype(int),0,1535)
                cap=opaque_above[part]&(ss<55)&(np.abs(cc)<105)&oldmask[ty,tx]
                # Fill the old hairline split INSIDE the concealed hip cap;
                # retain its outer silhouette and sample a true 2-D fur patch.
                healed=binary_closing(newmask,iterations=2)
                fill=cap&healed&~newmask
                alpha[fill]=1;newmask|=fill
                out[cap&newmask,:3]=base[ty[cap&newmask],tx[cap&newmask],:3]
            if cast=='fg' and part=='leg_front_upper':
                # Reuse this SAME character's accepted rear-thigh fur material,
                # registered in bone coordinates; geometry and anchors stay put.
                rear=arrays['leg_back_upper'];sf,cf,Lf=coords(j,'hipF','kneeF')
                hp=np.array(list(j['hipB'].values()),float);kp=np.array(list(j['kneeB'].values()),float)
                vb=kp-hp;Lb=np.linalg.norm(vb);vb/=Lb;nb=np.array([-vb[1],vb[0]])
                bx=hp[0]+sf/Lf*Lb*vb[0]-cf*nb[0]
                by=hp[1]+sf/Lf*Lb*vb[1]-cf*nb[1]
                bx=np.clip(np.rint(bx).astype(int),0,1023);by=np.clip(np.rint(by).astype(int),0,1535)
                inside=distance_transform_edt(rear[:,:,3]>200)>10
                valid=newmask&inside[by,bx]
                out[valid,:3]=rear[by[valid],bx[valid],:3]
            out[:,:,3]=np.rint(alpha*255).astype('uint8');out[~newmask,:]=0
            if part.startswith('leg_') and part.endswith('lower'):
                # The whole distal calf/ankle/foot is pixel-identical, including
                # its native antialiasing. Generated ankle pixels are rejected.
                preserve=s>=L-35
                out[preserve]=base[preserve]
            # Remove isolated subpixel islands after contour clipping too.
            keep=main_component(out[:,:,3]);out[~keep]=0
            Image.fromarray(out).save(dst/f'{part}.png')
            report[cast][part]={'removed_island_pixels':removed,'repair_pixels':int(repair.sum()),'alpha_changed_pixels':int(np.count_nonzero(out[:,:,3]!=base[:,:,3])),'source_bbox':bbox(base[:,:,3]>0),'final_bbox':bbox(out[:,:,3]>0),'generated':str(rawdest.relative_to(W))}
        for f in src.glob('*.json'):
            if not (dst/f.name).exists():shutil.copy2(f,dst/f.name)
        full=Image.new('RGBA',(1024,1536))
        for n in order:full.alpha_composite(Image.open(dst/f'{n}.png').convert('RGBA'))
        full.save(W/cast/'full.png')
    (W/'ingest-report.json').write_text(json.dumps(report,indent=2))
    print('Registered',sum(map(len,report.values())),'patched layers; current game unchanged')

def install():
    for cast in ['mg','fg']:
        src=W/cast;dst=A/'design/sumo_cast'/cast
        for f in (src/'layers').glob('*.png'):shutil.copy2(f,dst/'layers'/f.name)
        shutil.copy2(src/'full.png',dst/'full.png')
    print('Installed accepted layer revision. Regenerate Spine, crops and bakes before building.')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--install',action='store_true');args=p.parse_args()
    install() if args.install else build()
