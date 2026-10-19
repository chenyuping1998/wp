"""Rebind the painted alchemist to anatomical elbows/wrists and restage actions.
No limb translations or length scaling. Release remains at .38s.
Original skeleton backup makes regeneration deterministic and reversible.
"""
import json, math
from pathlib import Path
import alchemist_flow as flow
APP=Path(__file__).resolve().parents[1]
FILE=APP/'static/assets/spines/goBananasMonkey/monkey.json'
BACKUP=APP/'design/source/before_repaint_v2/monkey.json'
if not BACKUP.exists():BACKUP.write_bytes(FILE.read_bytes())
rig=json.loads(BACKUP.read_text(encoding='utf-8'))
W,H=560,884
# the backup predates the newer flow pieces (flapL, skirtR): place every flow
# bone, its physics and its flutter afresh — idempotent for the old ones
flow.Skeleton(rig,W,H).add_bones();flow.add_motion(rig)
idx={b['name']:b for b in rig['bones']}
# Preserve the chain and align its hinges to the painted shoulder, elbow, wrist.
points={'armL':(121,242),'armL_fore':(81,397),'armL_hand':(104,517),
        'armR':(434,264),'armR_fore':(492,394),'armR_hand':(504,492)}
def world(name):
    b=idx[name]
    if 'parent' not in b:return b.get('x',0),b.get('y',0),b.get('rotation',0)
    px,py,pr=world(b['parent']);c,s=math.cos(math.radians(pr)),math.sin(math.radians(pr))
    return px+c*b.get('x',0)-s*b.get('y',0),py+s*b.get('x',0)+c*b.get('y',0),pr+b.get('rotation',0)
for name,(x,y) in points.items():
    b=idx[name];px,py,pr=world(b['parent']);dx,dy=x-W/2-px,H-y-py
    c,s=math.cos(math.radians(pr)),math.sin(math.radians(pr))
    b['x'],b['y']=round(c*dx+s*dy,3),round(-s*dx+c*dy,3)
for a,b in [('armL','armL_fore'),('armL_fore','armL_hand'),('armR','armR_fore'),('armR_fore','armR_hand')]:
    idx[a]['length']=round(math.hypot(idx[b]['x'],idx[b]['y']),3)

# Keep painted anatomy stable. Expressiveness comes from timing and distinct
# silhouettes, not stretching torso length or separating joints.
for name,anim in rig['animations'].items():
    if name=='flutter':continue
    for bone,channels in anim.get('bones',{}).items():
        if bone!='prop':
            for k in channels.get('scale',[]):
                k['x']=round(1+(k.get('x',1)-1)*.12,5)
                k['y']=round(1+(k.get('y',1)-1)*.12,5)
        if bone=='head':channels.pop('translate',None)
        if bone=='torso':
            for k in channels.get('rotate',[]):k['value']*=.62
        if bone=='hip':
            for k in channels.get('translate',[]):k['y']*=.6;k['x']*=.75
        if bone.startswith('arm'):
            channels.pop('translate',None);channels.pop('scale',None)
            factor=.52 if '_fore' in bone else .66
            if name=='cheer':factor*=1.2
            for k in channels.get('rotate',[]):k['value']*=factor

def rotate(frames):
    return [{'time':t,'value':v} for t,v in frames]
def hand(anim,bone,frames):rig['animations'][anim]['bones'][bone]={'rotate':rotate(frames)}
# A held fist silhouette, then wrist and elbow follow-through, behind the shoulder.
hand('cheer','armR_hand',[(0,0),(.18,3),(.43,-7),(.65,-3),(1.14,-6),(1.56,-3),(1.9,0)])
hand('cheer','armL_hand',[(0,0),(.22,-3),(.48,7),(.7,3),(1.19,6),(1.61,3),(1.9,0)])
hand('nod','armR_hand',[(0,0),(.22,-4),(.5,-2),(.82,0)])
hand('alert','armL_hand',[(0,0),(.3,5),(.5,-4),(1,-4),(1.35,0)])
hand('throwit','armL_hand',[(0,0),(.18,-5),(.30,-8),(.38,8),(.5,4),(.76,-2),(1.2,0)])
hand('throwit','armR_hand',[(0,0),(.24,4),(.44,-4),(.7,2),(1.2,0)])

# Clear throw: one wind-up, one fast release (.38s), and a long recovery.
a=rig['animations']['throwit']['bones']
a['armL']['rotate']=rotate([(0,0),(.16,6),(.28,14),(.38,-15),(.49,-10),(.72,-4),(1.2,0)])
a['armL_fore']['rotate']=rotate([(0,0),(.18,5),(.29,9),(.38,-8),(.48,-6),(.74,-3),(1.2,0)])
a['torso']['rotate']=rotate([(0,0),(.18,3),(.28,6),(.38,-6),(.56,-3),(.8,2),(1.2,0)])
a['head']['rotate']=rotate([(0,0),(.2,4),(.32,5),(.44,-4),(.72,-2),(1.2,0)])
rig['animations']['throwit']['slots']['dynamite']['attachment'][-1]['time']=.38

# Wider wind-up and release arcs, through the same fixed-length limb chains.
for bone in ['armL', 'armL_fore', 'armR', 'armR_fore']:
    for key in a.get(bone, {}).get('rotate', []):key['value']*=1.3
for key in a['torso']['rotate']:key['value']*=1.2

# The goggles make one readable delayed rattle without translating the skull.
for key in rig['animations']['flutter']['bones']['goggles'].get('rotate',[]):
    key['value']*=1.30
for name in ['coatL1','coatL2']:
    for key in rig['animations']['flutter']['bones'][name].get('rotate',[]):key['value']*=.6
for constraint in rig.get('physics',[]):
    if constraint['bone'] in ['coatL1','coatL2','flask']:
        constraint['inertia']*=.5
        constraint['strength']*=1.5
        constraint['damping']=.9

# 2026-10-16 (user: 人物網格動態): the flow read as a still picture — coat tails
# 8-14px, goggles 3px on an 884px figure. Wider keyed sway and looser springs;
# the left tail stays under its 10-15 damping (it sits under the left fist).
FLOW_GAIN={'coatL1':1.5,'coatL2':1.6,'coatR1':2.0,'coatR2':2.1,'flask':1.8,'vials':1.8,'goggles':1.8,'skirtR':1.6,'flapL':1.2}
for name,gain in FLOW_GAIN.items():
    for key in rig['animations']['flutter']['bones'][name].get('rotate',[]):key['value']=round(key['value']*gain,3)
for constraint in rig.get('physics',[]):
    if constraint['bone'] in ['coatR1','coatR2','vials','coatL2']:
        constraint['inertia']=min(.7,constraint['inertia']*1.4)
        constraint['strength']*=.75
        constraint['damping']=.8

for side in ['L','R']:
    frames=[(0,0)]
    for i in range(6):
        t=.48+i*.3
        if (side=='R')==(i%2==0):frames.extend([(t-.08,3 if side=='R' else -3),(t, -6 if side=='R' else 6),(t+.13,0)])
    frames.append((2.68,0));frames.sort()
    hand('chestbeat',f'arm{side}_hand',frames)

sk=flow.Skeleton(rig,W,H);sk.add_bones()
rig['skins'][0]['attachments']['alchemy_body']['alchemy_body']=flow.body_mesh(sk)
# painted lids riding the body mesh's own vertices, and the `blink` loop
import alchemist_blink;alchemist_blink.add_blink(rig)
# Spine 4 stores Bezier values as ABSOLUTE coordinates. Keeping an old curve
# after changing a key still overshoots to the old scale/rotation in-between.
# Rebuild monotone ease curves from the final keys so no hidden limb stretch
# survives the retargeting.
for animation in rig['animations'].values():
    for channels in animation.get('bones',{}).values():
        for channel,keys in channels.items():
            if channel not in ['rotate','translate','scale']:continue
            axes=['value'] if channel=='rotate' else ['x','y']
            default=1 if channel=='scale' else 0
            for i,key in enumerate(keys):
                key.pop('curve',None)
                if i+1>=len(keys):continue
                end=keys[i+1];t0=key.get('time',0);t1=end.get('time',0)
                if t1<=t0:continue
                key['curve']=[]
                for axis in axes:
                    key['curve'].extend([round(t0+(t1-t0)/3,5),key.get(axis,default),round(t1-(t1-t0)/3,5),end.get(axis,default)])
# Lengths and parent offsets are immutable in all animation channels.
FILE.write_text(json.dumps(rig,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print('Rebound anatomical chains and restaged eight actions; no limb translation/scale.')
