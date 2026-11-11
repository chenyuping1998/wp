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

# The installed toolkit derives leaf axes from the upper arm. This drawing's
# left forearm bends sideways, so honor authored leaf axes like the game does.
_derived_axes = skin.bone_axes
def authored_axes(bones):
    return [np.array(b.get('axis', axis), float) for b, axis in zip(bones, _derived_axes(bones))]
skin.bone_axes = authored_axes

APP = Path(__file__).resolve().parents[1]

# One entry per cast figure. Everything measured belongs to that drawing:
# shoulder -> elbow -> wrist -> hand paths, the body chain's pivots (feet to
# head), the foot plant line, and the crops the diagnostic sheets use.
#   python3 design/deadwood_rig.py              # both
#   python3 design/deadwood_rig.py passenger    # one
FIGURES = {
    # base game, beside the board
    'conductor': dict(
        arms={'l': [(270, 310), (222, 493), (117, 507), (108, 430)],
              'r': [(590, 352), (680, 601), (788, 730), (817, 806)]},
        body=[(430,1510),(435,1220),(457,940),(453,650),(442,365),(438,90)],
        plant=1375, suffix='',
        hand_crops=[(45,365,285,650),(80,380,320,665),(660,615,900,900),(680,625,920,910)],
        joint_boxes=((100,430,420,790),(670,670,990,1030)),
    ),
    # free spins (2026-09-26): the veiled passenger, H2's full-body figure.
    # Measured on the keyed passenger.png against a 50px grid. Her veil is the
    # free appendage; it rides the head/chest bones and needs no bone of its own.
    'passenger': dict(
        arms={'l': [(330, 430), (255, 555), (180, 625), (125, 660)],
              'r': [(530, 430), (605, 560), (690, 645), (755, 700)]},
        body=[(445,1390),(440,1150),(440,900),(440,650),(420,420),(405,255)],
        plant=1370, suffix='_passenger',
        hand_crops=[(40,520,280,805),(40,520,280,805),(600,560,840,845),(600,560,840,845)],
        joint_boxes=((60,440,380,800),(540,480,860,840)),
    ),
}

def segment(points, a, b):
    d = np.array(b) - a
    t = np.clip(((points - a) @ d) / (d @ d), 0, 1)
    return np.linalg.norm(points - (np.array(a) + t[:, None] * d), axis=1)

def build(name):
    fig = FIGURES[name]
    ARMS = fig['arms']
    im = Image.open(APP / f'static/assets/deadwood/{name}.png').convert('RGBA')
    rig = skin.build_rig(im, cols=24, rows=48)
    # Scarf extends far right: using full silhouette midpoints would put the
    # chest into the scarf. Explicit body pivots follow the actual jacket.
    for b, p in zip(rig['bones'], fig['body']):
        b['x'], b['y'] = p
    v = np.array(rig['verts'])
    w, _ = skin.bone_weights(v, rig['bones'], softness=1.3, plant=fig['plant'])
    ownership = {}
    alpha = np.array(im)[:,:,3]
    ink = alpha[np.minimum(v[:,1].astype(int),im.height-1), np.minimum(v[:,0].astype(int),im.width-1)] > 128
    for side, p in ARMS.items():
        p = np.array(p, float)
        i = len(rig['bones'])
        for bone_name, pivot, parent, axis in [(f'arm_{side}',p[0],3,p[1]-p[0]),(f'fore_{side}',p[1],i,p[2]-p[1])]:
            rig['bones'].append(dict(name=bone_name,x=pivot[0],y=pivot[1],parent=parent,axis=(axis/np.linalg.norm(axis)).tolist()))
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
    rig['weights']=w.tolist();rig['image']=f'{name}.png'
    rig['arm_paths']=ARMS
    out = APP / f'static/assets/deadwood/{name}.rig.json'
    skin.save_rig(rig,str(out))
    print(name,'ownership',ownership)
    return name, rig, im, ownership

def measure(name, rig, im, ownership):
    fig = FIGURES[name]; sfx = fig['suffix']
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
    parity=[]
    for start,dt in [(0,0),(0,170),(2000,400),(7000,650)]:
        a,o,_=motion.reaction_state(rig['bones'],start+dt,start,rig['figure_box'])
        parity.append(dict(time=start+dt,age=dt,vertices=skin.pose(rig,a,o,motion.reaction_scales(rig['bones'],start+dt,start)).tolist()))
    (APP/f'design/deadwood_rig_parity{sfx}.json').write_text(json.dumps(parity,separators=(',',':'))+'\n')
    (APP/f'design/deadwood_rig_report{sfx}.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
    frames=[]
    for at in [0,170,400,650,1000]:
        a,o,_=motion.reaction_state(rig['bones'],at,0,rig['figure_box'])
        frames.append(skin.render(rig,im,a,80,offsets=o,scales=motion.reaction_scales(rig['bones'],at,0)).resize((355,509)))
    sheet=Image.new('RGB',(355*len(frames),509),(70,65,80))
    for i,frame in enumerate(frames):sheet.paste(frame,(355*i,0),frame)
    sheet.save(APP/f'design/deadwood_rig_reaction{sfx}.png')
    # Full-resolution hand crops make texture shear visible rather than hiding
    # it by judging only the 500px full-figure contact sheet.
    peak_a, peak_o, _ = motion.reaction_state(rig['bones'],400,0,rig['figure_box'])
    peak = skin.render(rig,im,peak_a,80,offsets=peak_o,scales=motion.reaction_scales(rig['bones'],400,0))
    c = fig['hand_crops']
    crops = [im.crop(c[0]),peak.crop(c[1]),im.crop(c[2]),peak.crop(c[3])]
    hands=Image.new('RGB',(960,285),(70,65,80))
    for i,f in enumerate(crops):hands.paste(f,(240*i,0),f)
    hands.save(APP/f'design/deadwood_rig_hands{sfx}.png')
    panels=[]
    for bone, angle in [('arm_l',5),('fore_l',5),('arm_r',4),('fore_r',5)]:
        for sign in [-1,1]:
            a=[0]*len(rig['bones']);a[[b['name'] for b in rig['bones']].index(bone)]=angle*sign
            f=skin.render(rig,im,a,80)
            box=fig['joint_boxes'][0] if bone.endswith('l') else fig['joint_boxes'][1]
            panels.append(f.crop(box))
    joint_sheet=Image.new('RGB',(320*4,360*2),(70,65,80))
    for i,f in enumerate(panels):joint_sheet.paste(f,((i//2)*320,(i%2)*360),f)
    joint_sheet.save(APP/f'design/deadwood_rig_joint_hands{sfx}.png')
    assert lo>=.5 and hi<=1.6,(lo,hi)

if __name__=='__main__':
    for n in (sys.argv[1:] or list(FIGURES)):
        measure(*build(n))
