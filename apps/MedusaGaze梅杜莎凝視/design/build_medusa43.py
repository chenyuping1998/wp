"""Build an original, app-owned Spine 4.3 rig from registered painted layers.

Snake-tail topology, measured joints and original performance keys are specific
to Medusa. No animation or skeleton from another game is copied.
"""
from pathlib import Path
from PIL import Image
import numpy as np
import json,math,hashlib

APP=Path(__file__).resolve().parent.parent;ROOT=APP/'design/source/medusagaze/cast';LAYERS=ROOT/'medusa_layers'
OUT=APP/'static/assets/spines/medusa43';OUT.mkdir(parents=True,exist_ok=True)
EDITOR=ROOT/'spine43_editor';(EDITOR/'images').mkdir(parents=True,exist_ok=True)
M=json.loads((LAYERS/'layers.json').read_text(encoding='utf-8'));J=M['joints'];ground=J['ground'];bones=[];world={}
def norm(x):return (x+180)%360-180
def spine(p):return (p[0]-ground[0],ground[1]-p[1])
def inverse(point,origin,angle):
    x,y=point[0]-origin[0],point[1]-origin[1];c=math.cos(math.radians(angle));s=math.sin(math.radians(angle));return (c*x+s*y,-s*x+c*y)
def angle(a,b):return math.degrees(math.atan2(a[1]-b[1],b[0]-a[0]))
def bone(name,parent,p,rot=0,length=0):
    w=spine(p);parentWorld=world.get(parent,{'p':(0,0),'rot':0});x,y=inverse(w,parentWorld['p'],parentWorld['rot'])
    item={'name':name,'x':round(x,5),'y':round(y,5),'rotation':round(norm(rot-parentWorld['rot']),5)}
    if parent:item['parent']=parent
    if length:item['length']=round(length,4)
    bones.append(item);world[name]={'p':w,'rot':rot,'pixel':p,'parent':parent}
bone('root',None,ground)
bone('hips','root',J['hips'],90,170);bone('belly','hips',[520,1010],90,180);bone('chest','belly',J['chest'],90,160)
bone('neck','chest',J['neck'],90,35);bone('head','neck',J['head'],90,300)
bone('eyes','head',J['eyes']);bone('glasses','head',J['glasses'])
for name,p in zip(['eye_left','eye_right'],J['gazeEyes']):bone(name,'head',p)
for side in ['back','front']:
    shoulder,elbow,wrist=J['arm_'+side];a=angle(shoulder,elbow);b=angle(elbow,wrist)
    bone('upper_'+side,'chest',shoulder,a,math.dist(shoulder,elbow))
    bone('fore_'+side,'upper_'+side,elbow,b,math.dist(elbow,wrist))
    bone('elbow_'+side,'upper_'+side,elbow,a+norm(b-a)/2)
    bone('hand_'+side,'fore_'+side,wrist,b,90)
bone('tail_anchor','root',[520,1950],0)
for i,p in enumerate(J['tail'][:3]):bone('tail_'+str(i+1),'hips' if i==0 else 'tail_'+str(i),p,90,200)
bone('tail_4','root',J['tail'][3],90,200);bone('tail_tip','tail_4',J['tail'][4],90,140)
for side,p in [('left',[380,1190]),('right',[640,1190])]:bone('chain_'+side,'hips',p,0,130)
for side,p in [('left',[410,1190]),('front',[520,1200]),('right',[650,1200])]:bone('skirt_'+side,'hips',p,90,230)
for i in range(1,10):
    points=J['snakes'][str(i)]
    for k,p in enumerate(points):
        name=f'snake_{i}_'+('root' if k==0 else 'head' if k==4 else str(k))
        parent='head' if k==0 else f'snake_{i}_'+('root' if k==1 else str(k-1))
        a=angle(p,points[k+1]) if k<4 else angle(points[k-1],p)
        bone(name,parent,p,a,math.dist(p,points[k+1]) if k<4 else 35)
indices={b['name']:i for i,b in enumerate(bones)}
def smooth(x):x=max(0,min(1,x));return x*x*(3-2*x)
def path_s(p,points):
    best=(1e99,0);acc=0
    for a,b in zip(points,points[1:]):
        d=np.array(b)-a;L=float(np.linalg.norm(d));t=float(np.dot(np.array(p)-a,d)/(L*L));t=max(0,min(1,t));q=np.array(a)+t*d;dist=float(np.linalg.norm(np.array(p)-q))
        if dist<best[0]:best=(dist,acc+t*L)
        acc+=L
    return best[1]
def weights(name,p):
    chain=M['layers'][name].get('chain')
    if not chain:return [(M['layers'][name]['bone'],1)]
    if chain.startswith('arm_'):
        side=chain.split('_')[1];points=J[chain];s=path_s(p,points);L=math.dist(points[0],points[1]);band=85
        if s<L: t=smooth((s-(L-band))/band);pairs=[('upper_'+side,1-t),('elbow_'+side,t)]
        else:t=smooth((s-L)/band);pairs=[('elbow_'+side,1-t),('fore_'+side,t)]
        return [(b,w) for b,w in pairs if w>1e-5]
    if chain=='tail':
        x,y=p
        if x>780 and y<1770:
            t=smooth((x-780)/100)*smooth((1770-y)/150);return [('tail_anchor',1-t),('tail_tip',t)]
        if y>1760:return [('tail_anchor',1)]
        t=(y-1190)/240;k=max(0,min(1,int(t)));a='tail_'+str(k+1);b='tail_'+str(k+2);f=smooth(t-k)
        anchor=smooth((y-1570)/220)
        return [(a,(1-f)*(1-anchor)),(b,f*(1-anchor)),('tail_anchor',anchor)]
    points=J['snakes'][chain.split('_')[1]]
    # A monotone neck field avoids nearest-segment jumps where an S-curve
    # doubles back close to itself. The five pivots remain drawing-specific.
    yy=p[1];k=min(3,next((i for i in range(4) if yy>=points[i+1][1]),3));f=smooth((points[k][1]-yy)/(points[k][1]-points[k+1][1]));prefix=chain+'_'
    ids=['root','1','2','3','head'];return [(prefix+ids[k],1-f),(prefix+ids[k+1],f)]

attachments={};crops={};geometry={};editor=[]
for name,spec in M['layers'].items():
    im=Image.open(LAYERS/(name+'.png')).convert('RGBA');a=np.array(im.getchannel('A'));ys,xs=np.where(a>16)
    if not len(xs):continue
    x0,y0=max(0,int(xs.min())-3),max(0,int(ys.min())-3);x1,y1=min(1024,int(xs.max())+4),min(2048,int(ys.max())+4);w,h=x1-x0,y1-y0
    chain=spec.get('chain');verts=[];tris=[];uv=[]
    if not chain:
        verts=[(x0,y0),(x1,y0),(x1,y1),(x0,y1)];tris=[0,1,2,0,2,3];uv=[0,0,1,0,1,1,0,1]
    else:
        step=20 if chain=='tail' else 12;nx=math.ceil(w/step);ny=math.ceil(h/step);vid={}
        def v(cx,cy):
            key=(cx,cy)
            if key not in vid:vid[key]=len(verts);verts.append((x0+w*cx/nx,y0+h*cy/ny))
            return vid[key]
        for cy in range(ny):
            for cx in range(nx):
                xa,xb=int(x0+w*cx/nx),math.ceil(x0+w*(cx+1)/nx);ya,yb=int(y0+h*cy/ny),math.ceil(y0+h*(cy+1)/ny)
                if not np.any(a[ya:yb,xa:xb]>16):continue
                aa,bb,cc,dd=v(cx,cy),v(cx+1,cy),v(cx+1,cy+1),v(cx,cy+1);tris.extend([aa,bb,cc,aa,cc,dd])
        uv=[q for x,y in verts for q in [(x-x0)/w,(y-y0)/h]]
    stored=[]
    for p in verts:
        ws=[(b,max(0,weight)) for b,weight in weights(name,p) if weight>1e-5];total=sum(v for _,v in ws);stored.append(len(ws))
        for b,value in ws:
            lx,ly=inverse(spine(p),world[b]['p'],world[b]['rot']);stored.extend([indices[b],round(lx,5),round(ly,5),round(value/total,7)])
    attachments[name]={'type':'mesh','path':name,'width':w,'height':h,'uvs':[round(v,7) for v in uv],'triangles':tris,'vertices':stored,'hull':0}
    cropped=im.crop((x0,y0,x1,y1));cropped.save(EDITOR/'images'/(name+'.png'));editor.append(name)
    runtime=cropped.resize((max(1,round(w*.85)),max(1,round(h*.85))),Image.Resampling.LANCZOS);crops[name]=runtime
    ink=[]
    for k in range(0,len(tris),3):
        q=np.mean([verts[tris[k+n]] for n in range(3)],axis=0);px=max(0,min(1023,round(q[0])));py=max(0,min(2047,round(q[1])));ink.append(bool(a[py,px]>24))
    geometry[name]={'vertices':len(verts),'triangles':len(tris)//3,'crop':[x0,y0,w,h],'chain':chain,'inkedTriangles':ink}

slots=[];skin={}
for name in M['order']:
    slot='face' if name=='face_idle' else 'hand_front' if name=='hand_front_open' else name
    slots.append({'name':slot,'bone':M['layers'][name]['bone'],'attachment':name})
    names=[n for n in attachments if n.startswith('face_')] if slot=='face' else [n for n in attachments if n.startswith('hand_front_')] if slot=='hand_front' else [name]
    skin[slot]={n:attachments[n] for n in names}
    if name in ['snake_3','snake_6','snake_9']:
        mirrored=json.loads(json.dumps(attachments[name]));mirrored['uvs']=[1-v if i%2==0 else v for i,v in enumerate(mirrored['uvs'])];skin[slot][name+'_left']=mirrored

S={'skeleton':{'hash':'medusa-original-20261025','spine':'4.3.13','x':-512,'y':-48,'width':1024,'height':2048,'fps':60,'images':'./images/'},'bones':bones,'slots':slots,'constraints':[],'skins':[{'name':'default','attachments':skin}],'events':{'release':{'string':'multiplier'},'gaze_on':{},'glasses_touch':{}},'animations':{}}
def sample(points,D):
    out=[]
    for t in sorted(set([round(i/60,5) for i in range(math.ceil(D*60)+1)]+[p[0] for p in points]+[D])):
        if t>D:continue
        left=next((i for i in range(len(points)-1) if points[i][0]<=t<points[i+1][0]),len(points)-1)
        if left==len(points)-1:value=points[-1][1]
        else:
            a,b=points[left],points[left+1];f=smooth((t-a[0])/(b[0]-a[0]));value=a[1]+(b[1]-a[1])*f
        out.append({'time':t,'value':round(value,5)})
    return out
def new(D):return {'bones':{},'slots':{},'_duration':D}
def rot(c,name,points):c['bones'].setdefault(name,{})['rotate']=sample(points,c['_duration'])
def move(c,name,points):
    parent=world[name]['parent'];p=world[parent]['rot'] if parent else 0;xy=[(t,inverse((dx,-dy),(0,0),p)) for t,dx,dy in points]
    xx=sample([(t,q[0]) for t,q in xy],c['_duration']);yy=sample([(t,q[1]) for t,q in xy],c['_duration'])
    c['bones'].setdefault(name,{})['translate']=[{'time':a['time'],'x':a['value'],'y':b['value']} for a,b in zip(xx,yy)]
def attach(c,slot,keys):c['slots'][slot]={'attachment':[{'time':t,'name':n} for t,n in keys]}

def scale_bone(c,name,points):
    xx=sample([(t,x) for t,x,y in points],c['_duration']);yy=sample([(t,y) for t,x,y in points],c['_duration'])
    c['bones'].setdefault(name,{})['scale']=[{'time':a['time'],'x':a['value'],'y':b['value']} for a,b in zip(xx,yy)]
def finish(name,c):
    D=c.pop('_duration')
    # Duration is explicit even when the physical action stops earlier.
    c['bones'].setdefault('root',{})['rotate']=[{'time':0,'value':0},{'time':D,'value':0}];S['animations'][name]=c
def solve(side,target):
    sh,el,wr=J['arm_'+side];u=np.array([target[0]-sh[0],sh[1]-target[1]]);L1=math.dist(sh,el);L2=math.dist(el,wr);d=max(1,min(float(np.linalg.norm(u)),L1+L2-.5));theta=math.atan2(u[1],u[0]);phi=math.acos(max(-1,min(1,(L1*L1+d*d-L2*L2)/(2*L1*d))))
    a=theta+(phi if side=='front' else -phi);end=np.array([math.cos(a)*L1,math.sin(a)*L1]);bb=math.atan2(u[1]-end[1],u[0]-end[0]);upper=norm(math.degrees(a)-world['upper_'+side]['rot']);fore=norm(math.degrees(bb)-world['fore_'+side]['rot']-upper);return upper,fore
def arm_targets(c,side,keys,hand_world=None):
    solved=[(t,solve(side,p)) for t,p in keys]
    rot(c,'upper_'+side,[(t,p[0]) for t,p in solved]);rot(c,'fore_'+side,[(t,p[1]) for t,p in solved]);rot(c,'elbow_'+side,[(t,p[1]/2) for t,p in solved])
    if hand_world is not None:
        rot(c,'hand_'+side,[(t,hand_world(t)-(p[0]+p[1])) for t,p in solved])
def snakes(c,start,peak,hold,end,strength):
    D=c['_duration']
    for i in range(1,10):
        lag=(i%3)*.028+(i//3)*.012;direction=1 if J['snakes'][str(i)][0][0]<512 else -1
        for k,suffix in enumerate(['root','1','2','3','head']):
            ll=lag+k*.012;a=strength*direction*(.65+k*.12)
            rot(c,f'snake_{i}_{suffix}',[(0,0),(start+ll,0),(peak+ll,a),(hold+ll,a),(min(D,end+ll),0),(D,0)])
def glasses(c,keys):move(c,'glasses',[(t,dx,dy) for t,dx,dy in keys])
def rest_pose(c,free=False):
    D=c['_duration'];attach(c,'face',[(0,'face_idle'),(5.60,'face_blink'),(5.74,'face_idle'),(D,'face_idle')]) if D>=6 else attach(c,'face',[(0,'face_idle'),(D,'face_idle')])
    glasses(c,[(0,0,-175 if free else 0),(D,0,-175 if free else 0)])
    if free:rot(c,'glasses',[(0,-12),(D,-12)])
    # A quiet six-second breath: ribcage expansion, delayed shoulders and head.
    # Hips/root stay planted. All transforms return exactly to rest at the seam.
    move(c,'belly',[(0,0,0),(1.55,0,-2),(2.1,0,-2),(4.9,0,0),(D,0,0)])
    move(c,'chest',[(0,0,0),(1.8,0,-8),(2.15,0,-8),(5.0,0,0),(D,0,0)])
    scale_bone(c,'chest',[(0,1,1),(1.8,1.008,1.025),(2.15,1.008,1.025),(5.0,1,1),(D,1,1)])
    move(c,'neck',[(0,0,0),(2.0,0,3),(2.3,0,3),(5.2,0,0),(D,0,0)])
    rot(c,'upper_front',[(0,0),(2.1,.45),(2.4,.45),(5.2,0),(D,0)])
    rot(c,'upper_back',[(0,0),(1.95,-.35),(2.25,-.35),(5.1,0),(D,0)])
    for i in range(1,10):
        lag=(i%3)*.07+(i//3)*.035;direction=1 if J['snakes'][str(i)][0][0]<512 else -1
        for suffix,amplitude in [('root',.22),('head',.55)]:
            rot(c,f'snake_{i}_{suffix}',[(0,0),(1.9+lag,direction*amplitude),(2.2+lag,direction*amplitude),(5.1+lag,0),(D,0)])
    rot(c,'tail_tip',[(0,0),(4.8,0),(5.35,1.4),(5.65,-.6),(D,0)]) if D>=6 else None
for name,free in [('idle',False),('fg_idle',True)]:c=new(6);rest_pose(c,free);finish(name,c)

def gaze_clip(name,D,peek,beam,release,end,free=False):
    c=new(D);neutral=J['arm_front'][2];offset=J['pinchOffset'];grip=J['grip'];touch=[grip[0]-offset[0],grip[1]-offset[1]];pull=[touch[0],touch[1]+55]
    if free:
        glasses(c,[(0,0,-175),(D,0,-175)]);rot(c,'glasses',[(0,-12),(D,-12)])
        attach(c,'face',[(0,'face_idle'),(beam,'face_gaze'),(end,'face_idle'),(D,'face_idle')])
        arm_targets(c,'front',[(0,neutral),(beam*.65,[neutral[0]-15,neutral[1]-30]),(release,[neutral[0]-100,neutral[1]-145]),(min(end,release+.12),[neutral[0]-100,neutral[1]-145]),(end,neutral),(D,neutral)])
        attach(c,'hand_front',[(0,'hand_front_open'),(beam,'hand_front_point'),(end,'hand_front_open'),(D,'hand_front_open')])
    else:
        arm_targets(c,'front',[(0,neutral),(peek*.55,touch),(peek,pull),(beam,pull),(end,pull),(D,neutral)],lambda t:0)
        glasses(c,[(0,0,0),(peek*.55,0,0),(peek,0,55),(beam,0,55),(end,0,55),(D,0,0)])
        attach(c,'hand_front',[(0,'hand_front_open'),(peek*.35,'hand_front_pinch'),(end,'hand_front_pinch'),(D-.1,'hand_front_open'),(D,'hand_front_open')])
        attach(c,'face',[(0,'face_idle'),(peek,'face_peek'),(beam,'face_gaze'),(end,'face_peek'),(D,'face_idle')])
        c['events']=[{'time':peek*.55,'name':'glasses_touch'},{'time':beam,'name':'gaze_on'},{'time':release,'name':'release'}]
    snakes(c,0,peek if not free else beam,release,end,3.0)
    # Keep painted necks continuous during the turn; never mirror a whole snake
    # attachment in one frame. The staggered five-bone chains carry the glance.
    if free:c['events']=[{'time':beam,'name':'gaze_on'},{'time':release,'name':'release'}]
    # A single anticipation, a clean held silhouette, then one follow-through.
    # Chest carries head and both arm pivots together, preserving the glasses grip.
    pre=min(.12,beam*.45,peek*.35);hold=peek if not free else beam
    move(c,'chest',[(0,0,0),(pre,4,3),(hold,-2,0),(beam,-2,0),(release,-5,-1),(end,-5,-1),(D,0,0)])
    rot(c,'head',[(0,0),(pre,-1.4),(min(peek*.54,beam),0),(D,0)]) if not free else None
    arm_targets(c,'back',[(0,J['arm_back'][2]),(beam,[J['arm_back'][2][0]-12,J['arm_back'][2][1]-20]),(release,[J['arm_back'][2][0]-22,J['arm_back'][2][1]-35]),(end,[J['arm_back'][2][0]-22,J['arm_back'][2][1]-35]),(D,J['arm_back'][2])])
    move(c,'tail_1',[(0,0,0),(pre,3,1),(hold,-3,0),(release,-5,0),(end,-4,0),(D,0,0)])
    for side in ['left','right']:rot(c,'chain_'+side,[(0,0),(release,0),(min(D,release+.10),2 if side=='left' else -2),(min(D,end+.1),-.7 if side=='left' else .7),(D,0)])
    finish(name,c)
gaze_clip('gaze',1.6,.35,.6,.75,1.05)
gaze_clip('gaze_turbo',.9,.175,.25,.35,.62)
gaze_clip('fg_gaze',1.2,.2,.2,.35,.95,True)
gaze_clip('fg_gaze_turbo',.9,.1,.1,.21,.66,True)

c=new(1.2);attach(c,'face',[(0,'face_annoyed'),(.82,'face_annoyed'),(1.2,'face_idle')]);rot(c,'head',[(0,0),(.18,-4),(.65,-4),(1.2,0)]);snakes(c,0,.22,.6,1.06,-2.2);finish('gaze_dud',c)
c=new(.8);attach(c,'face',[(0,'face_smug'),(.7,'face_smug'),(.8,'face_idle')]);attach(c,'hand_front',[(0,'hand_front_open'),(.12,'hand_front_thumb'),(.58,'hand_front_thumb'),(.8,'hand_front_open')]);neutral=J['arm_front'][2];arm_targets(c,'front',[(0,neutral),(.2,[neutral[0]-50,neutral[1]-90]),(.48,[neutral[0]-50,neutral[1]-90]),(.8,neutral)]);rot(c,'head',[(0,0),(.23,2),(.45,2),(.8,0)]);finish('react_small',c)

c=new(2);attach(c,'face',[(0,'face_shock'),(1.28,'face_laugh'),(2,'face_idle')]);glasses(c,[(0,0,0),(.25,0,-175),(2,0,-175)]);rot(c,'glasses',[(0,0),(.25,-12),(2,-12)])
for side,target in [('front',[350,570]),('back',[725,595])]:
    neutral=J['arm_'+side][2];arm_targets(c,side,[(0,neutral),(.46,target),(1.35,target),(2,neutral)],lambda t:180*smooth(t/.46) if t<1.35 else 180*(1-smooth((t-1.35)/.65)))
snakes(c,0,.28,1.2,1.8,5.0);finish('fg_trigger',c)

for name,D,large in [('win_big',2.4,False),('win_max',3.0,True)]:
    c=new(D);attach(c,'face',[(0,'face_laugh'),(.18,'face_cry_happy' if large else 'face_laugh'),(D,'face_cry_happy' if large else 'face_laugh')]);glasses(c,[(0,0,-175),(D,0,-175)]);rot(c,'glasses',[(0,-12),(D,-12)])
    for side,target in [('front',[260,470]),('back',[780,500])]:
        neutral=J['arm_'+side][2];arm_targets(c,side,[(0,neutral),(.16,[neutral[0],neutral[1]+18]),(.52,target),(D,target)])
    rot(c,'chest',[(0,0),(.16,-1),(.5,2),(.9,1.4),(D,1.4)]);rot(c,'head',[(0,0),(.55,-3),(D,-3)]);rot(c,'tail_tip',[(0,0),(.3,-6),(.58,11 if large else 8),(.85,-3),(1.1,0),(D,0)])
    move(c,'tail_4',[(0,0,0),(.32,0,-20),(.62,0,0),(.85,0,-12 if large else 0),(1.1,0,0),(D,0,0)])
    snakes(c,.12,.45,1.0,1.4,5.5 if large else 4.5)
    for side in ['left','right']:rot(c,'chain_'+side,[(0,0),(.4,5 if side=='left' else -5),(.7,-2 if side=='left' else 2),(1.2,0),(D,0)])
    finish(name,c)
    loop=new(2);attach(loop,'face',[(0,'face_cry_happy' if large else 'face_laugh'),(2,'face_cry_happy' if large else 'face_laugh')]);glasses(loop,[(0,0,-175),(2,0,-175)]);rot(loop,'glasses',[(0,-12),(2,-12)])
    for side,target in [('front',[260,470]),('back',[780,500])]:arm_targets(loop,side,[(0,target),(2,target)])
    rot(loop,'chest',[(0,1.4),(.12,2),(.24,1.4),(.38,2),(.5,1.4),(2,1.4)]);rot(loop,'head',[(0,-3),(2,-3)]);finish(name+'_loop',loop)

c=new(1.5);attach(c,'face',[(0,'face_idle'),(.7,'face_smug'),(1.5,'face_idle')]);glasses(c,[(0,0,-175),(.45,0,-175),(.78,0,0),(1.5,0,0)]);rot(c,'glasses',[(0,-12),(.78,0),(1.5,0)])
neutral=J['arm_front'][2];t=[J['grip'][0]-J['pinchOffset'][0],J['grip'][1]-J['pinchOffset'][1]];arm_targets(c,'front',[(0,neutral),(.25,[t[0],t[1]-175]),(.78,t),(1.5,neutral)],lambda t:0);attach(c,'hand_front',[(0,'hand_front_pinch'),(1.2,'hand_front_open'),(1.5,'hand_front_open')]);finish('fg_end',c)
c=new(1.5);neutral=J['arm_front'][2];t=[J['grip'][0]-J['pinchOffset'][0],J['grip'][1]-J['pinchOffset'][1]];arm_targets(c,'front',[(0,neutral),(.34,t),(.7,t),(1.5,neutral)],lambda t:0);attach(c,'hand_front',[(0,'hand_front_open'),(.22,'hand_front_pinch'),(.95,'hand_front_open'),(1.5,'hand_front_open')]);rot(c,'head',[(0,0),(.36,-1.5),(.7,-1.5),(1.5,0)]);finish('idle_fidget',c)
for i in range(1,10):
    c=new(.9)
    for k,suffix in enumerate(['root','1','2','3','head']):rot(c,f'snake_{i}_{suffix}',[(0,0),(.12+k*.02,0),(.34+k*.02,(1+k*.45)*(1 if i%2 else -1)),(.54+k*.02,-.4),(.9,0)])
    finish(f'snake_fidget_{i}',c)

# Compact atlas pages, with edge bleed. UVs remain local to their own region.
pages=[];remaining=sorted(crops,key=lambda n:-crops[n].height)
while remaining:
    placements=[];x=y=row=0;todo=[]
    for name in remaining:
        im=crops[name];ww,hh=im.width+4,im.height+4
        if x+ww>2048:x=0;y+=row;row=0
        if y+hh>2048:todo.append(name);continue
        placements.append((name,x+2,y+2));x+=ww;row=max(row,hh)
    assert placements,'Atlas region exceeds 2048'
    height=2**math.ceil(math.log2(max(py+crops[n].height+2 for n,px,py in placements)));width=2048
    page=Image.new('RGBA',(width,height));filename='medusa.png' if not pages else f'medusa_{len(pages)+1}.png'
    for name,px,py in placements:
        im=crops[name];page.paste(im.resize((im.width+4,im.height+4),Image.Resampling.NEAREST),(px-2,py-2));page.paste(im,(px,py))
    page.save(OUT/filename);pages.append({'name':filename,'width':width,'height':height,'placements':placements});remaining=todo
lines=[]
for pg in pages:
    if lines:lines.append('')
    lines.extend([pg['name'],f"size:{pg['width']},{pg['height']}",'format:RGBA8888','filter:Linear,Linear','repeat:none','pma:false'])
    for name,x,y in pg['placements']:im=crops[name];lines.extend([name,f'bounds:{x},{y},{im.width},{im.height}'])
atlas='\n'.join(lines)+'\n';(OUT/'medusa.atlas').write_text(atlas,encoding='utf-8')
encoded=json.dumps(S,separators=(',',':'));(OUT/'medusa.json').write_text(encoded,encoding='utf-8');(EDITOR/'medusa.json').write_text(encoded,encoding='utf-8')
(APP/'src/game/medusaRigData.json').write_text(encoded,encoding='utf-8')
(APP/'src/game/medusaRigAtlas.txt').write_text(atlas,encoding='utf-8')
report={'spine':'4.3.13','bones':len(bones),'frontSnakeChains':9,'snakeBonesEach':5,'animations':{n:max((k.get('time',0) for b in c['bones'].values() for timeline in b.values() for k in timeline),default=0) for n,c in S['animations'].items()},'atlasPages':[{k:v for k,v in p.items() if k!='placements'} for p in pages],'mesh':geometry,'hash':hashlib.sha256(encoded.encode()).hexdigest(),'provenance':'Original Medusa-only topology and keys. Painted imagegen sources registered in full canvas. No third-party character motion data.'}
(ROOT/'spine43-build.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:report[k] for k in ['spine','bones','frontSnakeChains','snakeBonesEach','atlasPages']},indent=2));print('Animations:',', '.join(S['animations']))
