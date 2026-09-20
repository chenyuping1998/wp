"""Reproducible pose-specific rig; never modifies conductor artwork.

Uses the installed mesh toolkit for grid, matrix posing and diagnostic renders.
Measured shoulder/elbow/hand paths belong to this conductor, not Hot Miami.
"""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image

TOOLKIT = Path.home() / '.codex/skills/hacksaw-character-motion/rig'
sys.path.insert(0, str(TOOLKIT))
import skin
import motion

APP = Path(__file__).resolve().parents[1]
SOURCE = APP / 'static/assets/deadwood/conductor.png'
OUT = APP / 'static/assets/deadwood/conductor.rig.json'
ARMS = {
    'l': [(270, 310), (222, 493), (117, 507), (108, 430)],
    'r': [(590, 352), (680, 601), (788, 730), (817, 806)],
}

def segment(points, a, b):
    d = np.array(b) - a
    t = np.clip(((points - a) @ d) / (d @ d), 0, 1)
    return np.linalg.norm(points - (np.array(a) + t[:, None] * d), axis=1)

def build():
    im = Image.open(SOURCE).convert('RGBA')
    rig = skin.build_rig(im, cols=24, rows=48)
    # Scarf extends far right: using full silhouette midpoints would put the
    # chest into the scarf. Explicit body pivots follow the actual jacket.
    for b, p in zip(rig['bones'], [(430,1510),(435,1220),(457,940),(453,650),(442,365),(438,90)]):
        b['x'], b['y'] = p
    v = np.array(rig['verts'])
    w, _ = skin.bone_weights(v, rig['bones'], softness=1.3, plant=1375)
    ownership = {}
    alpha = np.array(im)[:,:,3]
    ink = alpha[np.minimum(v[:,1].astype(int),im.height-1), np.minimum(v[:,0].astype(int),im.width-1)] > 128
    for side, p in ARMS.items():
        p = np.array(p, float)
        i = len(rig['bones'])
        for name, pivot, parent, axis in [(f'arm_{side}',p[0],3,p[1]-p[0]),(f'fore_{side}',p[1],i,p[2]-p[1])]:
            rig['bones'].append(dict(name=name,x=pivot[0],y=pivot[1],parent=parent,axis=(axis/np.linalg.norm(axis)).tolist()))
        dist = np.minimum.reduce([segment(v,a,b) for a,b in zip(p[:-1],p[1:])])
        claim = skin.smoothstep((180-dist)/140) * skin.smoothstep(np.linalg.norm(v-p[0],axis=1)/220)
        # Blend along the bent arm's path, preserve prop with the hand.
        elbow = np.linalg.norm(p[1]-p[0])
        path = np.linalg.norm(v-p[0],axis=1)
        mix = skin.smoothstep((path-elbow+90)/180)
        aw = np.zeros((len(v),i+2)); aw[:,i]=1-mix;aw[:,i+1]=mix
        w = np.column_stack([w,np.zeros((len(v),2))])*(1-claim[:,None])+aw*claim[:,None]
        region = ink & (dist<55) & (path>85)
        ownership[side] = float(w[region,i:i+2].sum(1).mean())
    assert np.allclose(w.sum(1),1)
    assert min(ownership.values()) >= .5, ownership
    rig['weights']=w.tolist();rig['image']='conductor.png'
    rig['arm_paths']=ARMS
    OUT.parent.mkdir(parents=True,exist_ok=True)
    skin.save_rig(rig,str(OUT))
    print('ownership',ownership)
    return rig, im, ownership

def measure(rig, im, ownership):
    v=np.array(rig['verts']);t=np.array(rig['tris'])
    def area(p):
        q=p[t];a=q[:,1]-q[:,0];b=q[:,2]-q[:,0]
        return a[:,0]*b[:,1]-a[:,1]*b[:,0]
    rest=area(v)
    limits={}
    for j,b in enumerate(rig['bones'][1:],1):
        last=0
        for angle in np.arange(.5,45,.5):
            good=True
            for sign in [-1,1]:
                a=[0]*len(rig['bones']);a[j]=angle*sign
                r=area(skin.pose(rig,a))/rest
                good &= r.min()>=.5 and r.max()<=1.6
            if not good:break
            last=float(angle)
        limits[b['name']]=last
    lo,hi=1.,1.
    for start in np.arange(8)*1000:
        for dt in np.linspace(0,1000,41):
            a,o,_=motion.reaction_state(rig['bones'],start+dt,start,rig['figure_box'])
            r=area(skin.pose(rig,a,o,motion.reaction_scales(rig['bones'],start+dt,start)))/rest
            lo=min(lo,float(r.min()));hi=max(hi,float(r.max()))
    report=dict(size=rig['size'],armOwnership=ownership,geometricLimits=limits,referenceReaction=dict(minArea=lo,maxArea=hi),sourceAlpha=dict(clearFraction=float((np.array(im)[:,:,3]==0).mean())))
    (APP/'design/deadwood_rig_report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
    frames=[]
    for at in [0,170,400,650,1000]:
        a,o,_=motion.reaction_state(rig['bones'],at,0,rig['figure_box'])
        frames.append(skin.render(rig,im,a,80,offsets=o,scales=motion.reaction_scales(rig['bones'],at,0)).resize((355,509)))
    sheet=Image.new('RGB',(355*len(frames),509),(70,65,80))
    for i,frame in enumerate(frames):sheet.paste(frame,(355*i,0),frame)
    sheet.save(APP/'design/deadwood_rig_reaction.png')
    assert lo>=.5 and hi<=1.6,(lo,hi)

if __name__=='__main__':
    measure(*build())
