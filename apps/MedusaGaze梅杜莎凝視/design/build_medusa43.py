"""Build an original, app-owned Spine 4.3 rig from registered painted layers.

Snake-tail topology, measured joints and original performance keys are specific
to Medusa. No animation or skeleton from another game is copied.
"""
from pathlib import Path
from PIL import Image
import numpy as np
import json,math,hashlib,bisect

APP=Path(__file__).resolve().parent.parent;ROOT=APP/'design/source/medusagaze/cast';LAYERS=ROOT/'medusa_layers'
OUT=APP/'static/assets/spines/medusa43';OUT.mkdir(parents=True,exist_ok=True)
EDITOR=ROOT/'spine43_editor';(EDITOR/'images').mkdir(parents=True,exist_ok=True)
M=json.loads((LAYERS/'layers.json').read_text(encoding='utf-8'));J=M['joints'];ground=J['ground'];bones=[];world={}

# Mouth guides are measured on the approved, cropped paintings. The four
# closed-mouth snakes get a split lip seam and an interior using the original
# snake_1 mouth texture. This is editable rig geometry, not replacement artwork.
JAW_GUIDES={
 1:dict(hinge=(98,65),front=(12,76),closed=False),2:dict(hinge=(72,69),front=(170,83),closed=False),
 3:dict(hinge=(105,69),front=(191,91),closed=False),4:dict(hinge=(100,65),front=(12,78),closed=False),
 5:dict(hinge=(104,68),front=(12,81),closed=False),6:dict(hinge=(79,67),front=(160,76),closed=True),
 7:dict(hinge=(111,69),front=(8,78),closed=True),8:dict(hinge=(93,66),front=(4,74),closed=True),
 9:dict(hinge=(78,62),front=(155,72),closed=True)}
for i,g in JAW_GUIDES.items():
    a=np.array(Image.open(LAYERS/f'snake_{i}.png').getchannel('A'));yy,xx=np.where(a>16)
    g['origin']=(max(0,int(xx.min())-3),max(0,int(yy.min())-3))
    g['sign']=1 if g['front'][0]<g['hinge'][0] else -1

def lip_y(g,x):
    hx,hy=g['hinge'];fx,fy=g['front'];u=max(0,min(1,(x-hx)/(fx-hx)))
    return hy+(fy-hy)*u+math.sin(math.pi*u)*7
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
bone('face_look','head',[J['head'][0]+320,J['head'][1]],0,40)
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
    g=JAW_GUIDES[i];bone(f'snake_{i}_jaw',f'snake_{i}_head',[g['origin'][0]+g['hinge'][0],g['origin'][1]+g['hinge'][1]],0,50)
indices={b['name']:i for i,b in enumerate(bones)}
def smooth(x):x=max(0,min(1,x));return x*x*(3-2*x)
def path_s(p,points):
    best=(1e99,0);acc=0
    for a,b in zip(points,points[1:]):
        d=np.array(b)-a;L=float(np.linalg.norm(d));t=float(np.dot(np.array(p)-a,d)/(L*L));t=max(0,min(1,t));q=np.array(a)+t*d;dist=float(np.linalg.norm(np.array(p)-q))
        if dist<best[0]:best=(dist,acc+t*L)
        acc+=L
    return best[1]
def weights(name,p,lower=None):
    if name.startswith('face_'):
        # Foreground features turn more than the silhouette. This is a depth
        # field over the approved painted face, not replacement facial art.
        r=((p[0]-490)/155)**2+((p[1]-510)/165)**2
        w=.44*math.exp(-r/.4)
        return [('head',1-w),('face_look',w)]
    chain=M['layers'][name].get('chain')
    if not chain:return [(M['layers'][name]['bone'],1)]
    if chain.startswith('arm_'):
        side=chain.split('_')[1];points=J[chain];s=path_s(p,points);L=math.dist(points[0],points[1]);band=85
        if s<L: t=smooth((s-(L-band))/band);pairs=[('upper_'+side,1-t),('elbow_'+side,t)]
        else:t=smooth((s-L)/band);pairs=[('elbow_'+side,1-t),('fore_'+side,t)]
        return [(b,w) for b,w in pairs if w>1e-5]
    if chain=='tail':
        x,y=p
        if y>1760:base=[('tail_anchor',1)]
        else:
            t=(y-1190)/240;k=max(0,min(1,int(t)));a='tail_'+str(k+1);b='tail_'+str(k+2);f=smooth(t-k)
            anchor=smooth((y-1570)/220)
            base=[(a,(1-f)*(1-anchor)),(b,f*(1-anchor)),('tail_anchor',anchor)]
        # Blend continuously into the returning tip. The old x=780 branch
        # snapped adjacent vertices to unrelated chains when the waist inhaled.
        tip=smooth((x-735)/155)*(1-smooth((y-1650)/130))
        return [(b,w*(1-tip)) for b,w in base]+[('tail_tip',tip)]
    points=J['snakes'][chain.split('_')[1]]
    # A monotone neck field avoids nearest-segment jumps where an S-curve
    # doubles back close to itself. The five pivots remain drawing-specific.
    yy=p[1];k=min(3,next((i for i in range(4) if yy>=points[i+1][1]),3));f=smooth((points[k][1]-yy)/(points[k][1]-points[k+1][1]));prefix=chain+'_'
    ids=['root','1','2','3','head'];base=[(prefix+ids[k],1-f),(prefix+ids[k+1],f)]
    g=JAW_GUIDES[int(chain.split('_')[1])];x,y=p[0]-g['origin'][0],p[1]-g['origin'][1];hx,hy=g['hinge'];fx,fy=g['front']
    head=1-smooth((y-hy-45)/70);base=[(b,w*(1-head)) for b,w in base]+[(prefix+'head',head)]
    if g['closed']:
        u=(x-hx)/(fx-hx);jaw=smooth((u-.03)/.45)*(1-smooth((u-1)/.35))*(1-smooth((y-lip_y(g,x)-12)/80)) if lower else 0
    else:
        u=(x-hx)/(fx-hx);jaw=smooth((y-hy-9)/29)*smooth((u+.15)/.4)*(1-smooth((u-1.05)/.4))*(1-smooth((y-hy-60)/55))
    merged={}
    for b,w in base:merged[b]=merged.get(b,0)+w*(1-jaw)
    merged[prefix+'jaw']=jaw
    return list(merged.items())

attachments={};crops={};geometry={};editor=[]
for name,spec in M['layers'].items():
    im=Image.open(LAYERS/(name+'.png')).convert('RGBA');a=np.array(im.getchannel('A'));ys,xs=np.where(a>16)
    if not len(xs):continue
    x0,y0=max(0,int(xs.min())-3),max(0,int(ys.min())-3);x1,y1=min(1024,int(xs.max())+4),min(2048,int(ys.max())+4);w,h=x1-x0,y1-y0
    chain='face' if name.startswith('face_') else spec.get('chain');verts=[];tris=[];uv=[];jaw_sides=None
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
        if chain.startswith('snake_') and JAW_GUIDES[int(chain.split('_')[1])]['closed']:
            g=JAW_GUIDES[int(chain.split('_')[1])];raw_v,raw_t=verts,tris;verts=[];tris=[];jaw_sides=[];seen={}
            def signed(p):return p[1]-g['origin'][1]-lip_y(g,p[0]-g['origin'][0])
            def clipped(poly,lower):
                out=[]
                for a,b in zip(poly,poly[1:]+poly[:1]):
                    da,db=signed(a),signed(b);ia=da>=0 if lower else da<=0;ib=db>=0 if lower else db<=0
                    if ia:out.append(a)
                    if ia!=ib:
                        f=da/(da-db);out.append((a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f))
                return out
            for at in range(0,len(raw_t),3):
                triangle=[raw_v[raw_t[at+n]] for n in range(3)]
                for lower in [False,True]:
                    polygon=clipped(triangle,lower);ids=[]
                    for p in polygon:
                        key=(round(p[0],6),round(p[1],6),lower)
                        if key not in seen:seen[key]=len(verts);verts.append(p);jaw_sides.append(lower)
                        ids.append(seen[key])
                    for at2 in range(1,len(ids)-1):tris.extend([ids[0],ids[at2],ids[at2+1]])
        uv=[q for x,y in verts for q in [(x-x0)/w,(y-y0)/h]]
    stored=[]
    for vi,p in enumerate(verts):
        ws=[(b,max(0,weight)) for b,weight in weights(name,p,None if jaw_sides is None else jaw_sides[vi]) if weight>1e-5];total=sum(v for _,v in ws);stored.append(len(ws))
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
    if name.startswith('snake_') and JAW_GUIDES[int(name.split('_')[1])]['closed']:
        i=int(name.split('_')[1]);g=JAW_GUIDES[i];hx,hy=g['hinge'];fx,fy=g['front'];ox,oy=g['origin']
        points=[(hx,hy),(fx,fy),(fx,fy+5),(hx,hy+5)];stored=[]
        for at,(x,y) in enumerate(points):
            b=f'snake_{i}_head' if at<2 else f'snake_{i}_jaw';lx,ly=inverse(spine((x+ox,y+oy)),world[b]['p'],world[b]['rot']);stored.extend([1,indices[b],round(lx,5),round(ly,5),1])
        # UVs sample only the painted red cavity/fangs, and follow the lip seam.
        source=[(80,69),(20,77),(34,111),(56,109)]
        uv=[q for x,y in source for q in (x/186,y/247)]
        att={'type':'mesh','path':'snake_1','width':100,'height':50,'uvs':uv,'triangles':[0,1,2,0,2,3] if fx>hx else [0,2,1,0,3,2],'vertices':stored,'hull':0}
        mouth=f'snake_{i}_mouth';slots.append({'name':mouth,'bone':f'snake_{i}_head','attachment':mouth});skin[mouth]={mouth:att}
    slot='face' if name=='face_idle' else 'hand_front' if name=='hand_front_open' else name
    slots.append({'name':slot,'bone':M['layers'][name]['bone'],'attachment':name})
    names=[n for n in attachments if n.startswith('face_')] if slot=='face' else [n for n in attachments if n.startswith('hand_front_')] if slot=='hand_front' else [name]
    skin[slot]={n:attachments[n] for n in names}
    if name in ['snake_3','snake_6','snake_9']:
        mirrored=json.loads(json.dumps(attachments[name]));mirrored['uvs']=[1-v if i%2==0 else v for i,v in enumerate(mirrored['uvs'])];skin[slot][name+'_left']=mirrored

S={'skeleton':{'hash':'medusa-original-20261025','spine':'4.3.13','x':-512,'y':-48,'width':1024,'height':2048,'fps':60,'images':'./images/'},'bones':bones,'slots':slots,'constraints':[],'skins':[{'name':'default','attachments':skin}],'events':{'release':{'string':'multiplier'},'gaze_on':{},'glasses_touch':{}},'animations':{}}
def curve(points):
    # Shape-preserving Hermite tangents carry momentum through waypoints while
    # retaining authored holds and reversals. Duplicate event times are merged.
    keys=sorted({round(t,6):value for t,value in points}.items())
    times=[t for t,_ in keys];values=[value for _,value in keys];n=len(keys);tangents=[0.0]*n
    slopes=[(values[i+1]-values[i])/(times[i+1]-times[i]) for i in range(n-1)]
    for i in range(1,n-1):
        a,b=slopes[i-1],slopes[i]
        if a*b>0:
            before=times[i]-times[i-1];after=times[i+1]-times[i];w1=2*after+before;w2=after+2*before
            tangents[i]=(w1+w2)/(w1/a+w2/b)
    def at(t):
        if t<=times[0]:return values[0]
        if t>=times[-1]:return values[-1]
        i=bisect.bisect_right(times,t)-1;h=times[i+1]-times[i];u=(t-times[i])/h
        return (2*u**3-3*u*u+1)*values[i]+(u**3-2*u*u+u)*h*tangents[i]+(-2*u**3+3*u*u)*values[i+1]+(u**3-u*u)*h*tangents[i+1]
    return at
def sample_times(points,D):
    return sorted(t for t in set([round(i/60,6) for i in range(math.ceil(D*60)+1)]+[round(p[0],6) for p in points]+[round(D,6)]) if t<=D)
def sample(points,D):
    at=curve(points)
    return [{'time':t,'value':round(at(t),5)} for t in sample_times(points,D)]
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
def shear_bone(c,name,points):
    xx=sample([(t,x) for t,x,y in points],c['_duration']);yy=sample([(t,y) for t,x,y in points],c['_duration'])
    c['bones'].setdefault(name,{})['shear']=[{'time':a['time'],'x':a['value'],'y':b['value']} for a,b in zip(xx,yy)]
def finish(name,c):
    D=c.pop('_duration')
    # Duration is explicit even when the physical action stops earlier.
    c['bones'].setdefault('root',{})['rotate']=[{'time':0,'value':0},{'time':D,'value':0}];S['animations'][name]=c
def solve(side,target):
    sh,el,wr=J['arm_'+side];u=np.array([target[0]-sh[0],sh[1]-target[1]]);L1=math.dist(sh,el);L2=math.dist(el,wr);d=max(1,min(float(np.linalg.norm(u)),L1+L2-.5));theta=math.atan2(u[1],u[0]);phi=math.acos(max(-1,min(1,(L1*L1+d*d-L2*L2)/(2*L1*d))))
    a=theta+(phi if side=='front' else -phi);end=np.array([math.cos(a)*L1,math.sin(a)*L1]);bb=math.atan2(u[1]-end[1],u[0]-end[0]);upper=norm(math.degrees(a)-world['upper_'+side]['rot']);fore=norm(math.degrees(bb)-world['fore_'+side]['rot']-upper);return upper,fore
def arm_targets(c,side,keys,hand_world=None):
    # Solve the continuous wrist path at export frames, rather than interpolating
    # sparse joint angles and stopping the hand at every control point.
    x=curve([(t,p[0]) for t,p in keys]);y=curve([(t,p[1]) for t,p in keys]);solved=[]
    shoulder=J['arm_'+side][0];minimum_reach=min(190,min(math.dist(shoulder,p) for _,p in keys))
    for t in sample_times([(t,0) for t,_ in keys],c['_duration']):
        target=np.array([x(t),y(t)]);delta=target-shoulder;reach=float(np.linalg.norm(delta))
        # Carry the wrist around the shoulder rather than through it. The
        # painted elbow has a finite bend envelope, including during transitions.
        if reach<minimum_reach:target=np.array(shoulder)+delta/max(.001,reach)*minimum_reach
        angles=solve(side,target)
        if solved:angles=tuple(solved[-1][1][i]+norm(value-solved[-1][1][i]) for i,value in enumerate(angles))
        solved.append((t,angles))
    rot(c,'upper_'+side,[(t,p[0]) for t,p in solved]);rot(c,'fore_'+side,[(t,p[1]) for t,p in solved]);rot(c,'elbow_'+side,[(t,p[1]/2) for t,p in solved])
    if hand_world is not None:
        rot(c,'hand_'+side,[(t,hand_world(t)-(p[0]+p[1])) for t,p in solved])
def snakes(c,start,peak,hold,end,strength):
    D=c['_duration']
    for i in range(1,10):
        lag=(i%3)*.036+(i//3)*.016;direction=1 if J['snakes'][str(i)][0][0]<512 else -1
        for k,suffix in enumerate(['root','1','2','3','head']):
            ll=lag+k*.016;a=strength*direction*(.65+k*.12)*(2.05 if abs(strength)<=3.1 else 1.26)*((.72 if i==9 else 1.15 if i==8 and abs(strength)>3.1 else 1.35) if k==4 else 1)
            # Splay, recoil and strike again with the cast. Reverse the middle
            # neck joint so the painted curl keeps an S silhouette.
            middle=peak+(hold-peak)*.46
            rot(c,f'snake_{i}_{suffix}',[(0,0),(start+ll,0),(peak+ll,a),(middle+ll,-a*.42),(hold+ll,a*1.12),(min(D,end+ll),0),(D,0)])
        g=JAW_GUIDES[i];a=g['sign']*(27.4 if g['closed'] else -12.5)
        rot(c,f'snake_{i}_jaw',[(0,0),(start+lag,0),(peak+lag,a),(middle+lag,a*.1 if g['closed'] else g['sign']*4),(hold+lag,a),(min(D,end+lag),0),(D,0)])
def glasses(c,keys):move(c,'glasses',[(t,dx,dy) for t,dx,dy in keys])
def rest_pose(c,free=False):
    D=c['_duration'];attach(c,'face',[(0,'face_idle'),(5.60,'face_blink'),(5.74,'face_idle'),(D,'face_idle')]) if D>=6 else attach(c,'face',[(0,'face_idle'),(D,'face_idle')])
    glasses(c,[(0,0,-175 if free else 0),(D,0,-175 if free else 0)])
    if free:rot(c,'glasses',[(0,-12),(D,-12)])
    # A readable inhale, suspended breath and long exhale. Weight travels through
    # the hips and upper coils; the ground-contact tail anchor never moves.
    rot(c,'hips',[(0,0),(1.6,.75),(2.2,.75),(5.0,0),(D,0)])
    move(c,'belly',[(0,0,0),(1.55,0,-9),(2.1,0,-9),(4.9,0,0),(D,0,0)])
    scale_bone(c,'belly',[(0,1,1),(1.65,1.026,1.024),(2.15,1.026,1.024),(5.0,1,1),(D,1,1)])
    move(c,'chest',[(0,0,0),(1.8,0,-14),(2.15,0,-14),(5.0,0,0),(D,0,0)])
    scale_bone(c,'chest',[(0,1,1),(1.8,1.018,1.035),(2.15,1.018,1.035),(5.0,1,1),(D,1,1)])
    move(c,'neck',[(0,0,0),(2.0,0,5),(2.3,0,5),(5.2,0,0),(D,0,0)])
    rot(c,'upper_front',[(0,0),(2.1,1.1),(2.4,1.1),(5.2,0),(D,0)])
    rot(c,'upper_back',[(0,0),(1.95,-.85),(2.25,-.85),(5.1,0),(D,0)])
    # A short glance and relaxed wrists are separate from the breathing lift.
    # Return to a held neutral; no constant whole-character oscillation.
    rot(c,'head',[(0,0),(2.7,0),(3.2,-1.6),(3.7,-1.6),(4.65,0),(D,0)])
    move(c,'face_look',[(0,0,0),(2.7,0,0),(3.2,-22,-4),(3.7,-18,-3),(4.65,0,0),(D,0,0)])
    rot(c,'hand_front',[(0,0),(1.3,0),(2.15,-3),(2.5,-3),(4.6,0),(D,0)])
    rot(c,'hand_back',[(0,0),(1.7,0),(2.4,2.2),(2.7,2.2),(4.9,0),(D,0)])
    move(c,'tail_1',[(0,0,0),(1.8,9,-5),(2.3,9,-5),(5.1,0,0),(D,0,0)])
    for name,amplitude,lag in [('tail_2',2.2,.10),('tail_3',-1.6,.25),('tail_4',-2.2,.4),('tail_tip',5.8,.6)]:
        rot(c,name,[(0,0),(1.8+lag,amplitude),(2.15+lag,amplitude),(5.2+lag,0),(D,0)])
    rot(c,'tail_tip',[(0,0),(2.4,5.8),(2.8,5.8),(3.30,-10),(3.72,16),(4.85,0),(D,0)])
    for side,direction in [('left',1),('right',-1)]:
        rot(c,'chain_'+side,[(0,0),(2.2,1.2*direction),(2.55,1.2*direction),(5.3,0),(D,0)])
        rot(c,'skirt_'+side,[(0,0),(2.0,.6*direction),(2.4,.6*direction),(5.2,0),(D,0)])
    for i in range(1,10):
        lag=(i%3)*.085+(i//3)*.045;direction=1 if J['snakes'][str(i)][0][0]<512 else -1
        # A stronger neck wave plus an individually staggered double bite.
        # Roots stay planted; the impulse travels through all five joints.
        attack=.55+(i-1)*.42
        for k,suffix in enumerate(['root','1','2','3','head']):
            amplitude=[2.5,3.5,-2.6,4.8,8][k]*direction*(.85+(i%3)*.13)
            delay=k*.026
            rot(c,f'snake_{i}_{suffix}',[(0,0),(attack+delay,0),(attack+.22+delay,-amplitude*.65),(attack+.38+delay,-amplitude*.65),(attack+.52+delay,amplitude),(attack+.70+delay,-amplitude*.22),(attack+.87+delay,amplitude*.8),(attack+1.13+delay,-amplitude*.16),(attack+1.55+delay,0),(D,0)])
        g=JAW_GUIDES[i];a=g['sign']*(29 if g['closed'] else -12.5)
        rot(c,f'snake_{i}_jaw',[(0,0),(attack+.10,0),(attack+.36,a),(attack+.51,a),(attack+.64,0),(attack+.76,a*.95),(attack+.88,a*.95),(attack+1.02,0),(D,0)] if g['closed'] else [(0,0),(attack+.10,0),(attack+.36,a*.45),(attack+.51,a*.45),(attack+.64,a),(attack+.76,g['sign']*4),(attack+.88,g['sign']*4),(attack+1.02,a),(attack+1.40,0),(D,0)])
for name,free in [('idle',False),('fg_idle',True)]:c=new(6);rest_pose(c,free);finish(name,c)

def gaze_clip(name,D,peek,beam,release,end,free=False):
    c=new(D);neutral=J['arm_front'][2];offset=J['pinchOffset'];grip=J['grip'];touch=[grip[0]-offset[0],grip[1]-offset[1]];pull=[touch[0],touch[1]+55]
    move(c,'face_look',[(0,0,0),(end,0,0),(end+.1,-8,-1),(D,0,0)])
    if free:
        glasses(c,[(0,0,-175),(D,0,-175)]);rot(c,'glasses',[(0,-12),(D,-12)])
        attach(c,'face',[(0,'face_idle'),(beam,'face_gaze'),(release-.12,'face_talk'),(release+.40,'face_smug'),(end,'face_smug'),(D,'face_idle')])
        arm_targets(c,'front',[(0,neutral),(beam*.65,[neutral[0]-15,neutral[1]-30]),(release,[neutral[0]-100,neutral[1]-145]),(release+.08,[neutral[0]-118,neutral[1]-156]),(release+.24,[neutral[0]-82,neutral[1]-125]),(end,neutral),(D,neutral)])
        attach(c,'hand_front',[(0,'hand_front_open'),(beam,'hand_front_point'),(end,'hand_front_open'),(D,'hand_front_open')])
    else:
        arm_targets(c,'front',[(0,neutral),(peek*.55,touch),(peek,pull),(beam,pull),(end,pull),(end+.16,[345,575]),(end+.36,[205,740]),(D,neutral)],lambda t:0)
        glasses(c,[(0,0,0),(peek*.55,0,0),(peek,0,55),(beam,0,55),(end,0,55),(D,0,0)])
        attach(c,'hand_front',[(0,'hand_front_open'),(peek*.35,'hand_front_pinch'),(end,'hand_front_pinch'),(end+.12,'hand_front_open'),(D,'hand_front_open')])
        attach(c,'face',[(0,'face_idle'),(peek,'face_peek'),(beam,'face_gaze'),(release-.12,'face_talk'),(release+.40,'face_smug'),(end,'face_smug'),(D,'face_idle')])
        c['events']=[{'time':peek*.55,'name':'glasses_touch'},{'time':beam,'name':'gaze_on'},{'time':release,'name':'release'}]
    snakes(c,0,peek if not free else beam,release,end,3.0)
    # Keep painted necks continuous during the turn; never mirror a whole snake
    # attachment in one frame. The staggered five-bone chains carry the glance.
    if free:c['events']=[{'time':beam,'name':'gaze_on'},{'time':release,'name':'release'}]
    # A single anticipation, a clean held silhouette, then one follow-through.
    # Chest carries head and both arm pivots together, preserving the glasses grip.
    pre=min(.12,beam*.45,peek*.35);hold=peek if not free else beam
    move(c,'chest',[(0,0,0),(pre,4,3),(hold,-2,0),(beam,-2,0),(release-.35,-4,-2),(release-.11,8,4),(release-.055,8,4),(release,-5,-1),(release+.10,-8,1),(release+.28,-4,-3),(end,-5,-1),(D,0,0)])
    rot(c,'head',[(0,0),(pre,-1.4),(min(peek*.54,beam),0),(D,0)]) if not free else None
    back=J['arm_back'][2]
    # Meet the 350ms orb charge with a real elbow coil. Let the palm gather,
    # retract toward the shoulder, briefly hold its weight, then reverse into
    # the upward/forward release. The wrist follows after the upper arm.
    arm_targets(c,'back',[(0,back),(beam,[920,790]),(release-.35,[915,690]),(release-.11,[875,810]),(release-.055,[875,810]),(release,[850,625]),(release+.12,[825,605]),(release+.30,[885,750]),(release+.52,[930,900]),(end+.3,[845,1050]),(D,back)])
    # The casting arm crosses in front of the near snake curls. Do not let the
    # open palm disappear behind the hair while its silhouette explains release.
    c['drawOrder']=[{'time':0},{'time':beam*.5,'offsets':[{'slot':'arm_back','offset':23},{'slot':'hand_back','offset':23}]},{'time':D,'offsets':[]}]
    move(c,'tail_1',[(0,0,0),(pre,3,1),(hold,-3,0),(release,-5,0),(release+.12,-9,2),(release+.28,-4,-1),(end,-4,0),(D,0,0)])
    # Propagate the casting impulse through the coils, then let the tip flick.
    rot(c,'tail_2',[(0,0),(release-.08,0),(release+.13,2.6),(release+.32,-1.3),(end,0),(D,0)])
    rot(c,'tail_3',[(0,0),(release,0),(release+.19,-2.2),(release+.38,1.1),(end+.1,0),(D,0)])
    rot(c,'tail_tip',[(0,0),(release,0),(release+.13,-8),(release+.30,11),(end,-2),(D,0)])
    rot(c,'hand_back',[(0,0),(beam,-18),(release-.35,-8),(release-.11,28),(release-.055,28),(release-.02,8),(release,-28),(release+.09,-34),(release+.20,11),(release+.40,-4),(end+.3,0),(D,0)])
    for part,sign in [('skirt_left',1),('skirt_right',-1),('skirt_front',.65)]:
        rot(c,part,[(0,0),(release,0),(release+.18,1.8*sign),(end,-.6*sign),(D,0)])
        shear_bone(c,part,[(0,0,0),(release+.07,0,0),(release+.23,2.3*sign,0),(end+.12,-.65*sign,0),(D,0,0)])
    for side in ['left','right']:rot(c,'chain_'+side,[(0,0),(release,0),(min(D,release+.10),2 if side=='left' else -2),(min(D,end+.1),-.7 if side=='left' else .7),(D,0)])
    finish(name,c)
gaze_clip('gaze',2.5,.35,.6,1.45,1.9)
gaze_clip('gaze_turbo',2.5,.35,.6,1.45,1.9)
gaze_clip('fg_gaze',2.1,.2,.2,1.05,1.5,True)
gaze_clip('fg_gaze_turbo',2.1,.2,.2,1.05,1.5,True)

c=new(1.2);attach(c,'face',[(0,'face_annoyed'),(.82,'face_annoyed'),(1.2,'face_idle')]);rot(c,'head',[(0,0),(.18,-4),(.65,-4),(1.2,0)]);snakes(c,0,.22,.6,1.06,-2.2);finish('gaze_dud',c)
c=new(.8)
attach(c,'face',[(0,'face_idle'),(.26,'face_smug'),(.65,'face_idle'),(.8,'face_idle')])
attach(c,'hand_front',[(0,'hand_front_open'),(.26,'hand_front_thumb'),(.62,'hand_front_thumb'),(.8,'hand_front_open')])
neutral=J['arm_front'][2];target=[neutral[0]-50,neutral[1]-90]
arm_targets(c,'front',[(0,neutral),(.12,[neutral[0]+8,neutral[1]+12]),(.32,target),(.58,target),(.8,neutral)])
move(c,'belly',[(0,0,0),(.16,0,4),(.34,0,-3),(.8,0,0)])
move(c,'chest',[(0,0,0),(.12,0,8),(.30,-3,-4),(.44,-2,-5),(.52,-1,-3),(.61,-2,-4),(.8,0,0)])
move(c,'neck',[(0,0,0),(.20,0,0),(.40,0,-2),(.58,0,-1),(.8,0,0)])
move(c,'face_look',[(0,0,0),(.16,0,0),(.32,-18,-2),(.58,-14,-1),(.8,0,0)])
rot(c,'head',[(0,0),(.12,.8),(.32,-2),(.58,-1.8),(.8,0)])
rot(c,'hand_front',[(0,0),(.24,0),(.36,-7),(.47,4),(.60,-2),(.8,0)])
finish('react_small',c)

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
    # Dynamic held celebration: torso, neck and look carry the same gesture
    # with delay. The grounded tail anchor stays outside this body hierarchy.
    move(c,'belly',[(0,0,0),(.20,0,4),(.55,0,-3),(D,0,-1)])
    move(c,'chest',[(0,0,0),(.16,0,4),(.50,0,-7),(.83,-2,-6),(1.0,-3,-3),(1.18,-2,-5),(1.38,-3,-3),(1.62,-2,-4),(D,-3,-3)])
    move(c,'neck',[(0,0,0),(.23,0,3),(.60,0,-2),(.90,0,1),(1.20,0,-2),(D,0,-1)])
    move(c,'face_look',[(0,0,0),(.30,-16,-2),(.70,-22,-4),(1.0,-12,-2),(1.40,-20,-3),(D,-8,-1)])
    for side in ['left','right']:rot(c,'chain_'+side,[(0,0),(.4,5 if side=='left' else -5),(.7,-2 if side=='left' else 2),(1.2,0),(D,0)])
    finish(name,c)
    loop=new(2);attach(loop,'face',[(0,'face_cry_happy' if large else 'face_laugh'),(2,'face_cry_happy' if large else 'face_laugh')]);glasses(loop,[(0,0,-175),(2,0,-175)]);rot(loop,'glasses',[(0,-12),(2,-12)])
    for side,target in [('front',[260,470]),('back',[780,500])]:arm_targets(loop,side,[(0,target),(2,target)])
    move(loop,'belly',[(0,0,-1),(.7,0,-2),(1.5,0,0),(2,0,-1)])
    move(loop,'chest',[(0,-3,-3),(.4,-2,-4),(.8,-3,-3),(1.2,-2,-5),(1.6,-3,-3),(2,-3,-3)])
    move(loop,'neck',[(0,0,-1),(.5,0,-2),(1.0,0,-1),(1.5,0,0),(2,0,-1)])
    move(loop,'face_look',[(0,-8,-1),(.4,-17,-3),(.8,-11,-1),(1.2,-18,-2),(1.6,-10,-1),(2,-8,-1)])
    rot(loop,'chest',[(0,1.4),(.12,2),(.24,1.4),(.38,2),(.5,1.4),(2,1.4)]);rot(loop,'head',[(0,-3),(2,-3)]);finish(name+'_loop',loop)

c=new(1.5);attach(c,'face',[(0,'face_idle'),(.7,'face_smug'),(1.5,'face_idle')]);glasses(c,[(0,0,-175),(.45,0,-175),(.78,0,0),(1.5,0,0)]);rot(c,'glasses',[(0,-12),(.78,0),(1.5,0)])
neutral=J['arm_front'][2];t=[J['grip'][0]-J['pinchOffset'][0],J['grip'][1]-J['pinchOffset'][1]];arm_targets(c,'front',[(0,neutral),(.25,[t[0],t[1]-175]),(.78,t),(1.5,neutral)],lambda t:0);attach(c,'hand_front',[(0,'hand_front_pinch'),(1.2,'hand_front_open'),(1.5,'hand_front_open')]);finish('fg_end',c)
c=new(1.5);neutral=J['arm_front'][2];t=[J['grip'][0]-J['pinchOffset'][0],J['grip'][1]-J['pinchOffset'][1]];arm_targets(c,'front',[(0,neutral),(.34,t),(.7,t),(1.5,neutral)],lambda t:0);attach(c,'hand_front',[(0,'hand_front_open'),(.22,'hand_front_pinch'),(.95,'hand_front_open'),(1.5,'hand_front_open')]);rot(c,'head',[(0,0),(.36,-1.5),(.7,-1.5),(1.5,0)]);finish('idle_fidget',c)
for i in range(1,10):
    c=new(1.25);direction=1 if J['snakes'][str(i)][0][0]<512 else -1
    # Coil back, strike with the painted open jaws, snap, then settle the neck.
    # The head follows the five-bone neck; no detached sprite translation.
    for k,suffix in enumerate(['root','1','2','3','head']):
        delay=k*.018;amount=[2.6,3.7,4.8,6.3,11.8][k]*direction
        rot(c,f'snake_{i}_{suffix}',[(0,0),(.19+delay,-amount*.7),(.35+delay,-amount*.7),(.49+delay,amount),(.63+delay,-amount*.3),(.80+delay,amount*.8),(.97+delay,-amount*.15),(1.20,0),(1.25,0)])
    g=JAW_GUIDES[i];a=g['sign']*(26.5 if g['closed'] else -13)
    rot(c,f'snake_{i}_jaw',[(0,0),(.16,0),(.34,a),(.48,a),(.59,0),(.71,a*.95),(.81,a*.95),(.94,0),(1.25,0)] if g['closed'] else [(0,0),(.16,a*.4),(.34,g['sign']*4),(.48,g['sign']*4),(.59,a),(.71,g['sign']*4),(.81,g['sign']*4),(.94,a),(1.25,0)])
    finish(f'snake_fidget_{i}',c)

# Character foley follows authored poses, including cancellation and playback rate.
def sound_mark(clip,time,name):
    S['events'].setdefault(name,{})
    S['animations'][clip].setdefault('events',[]).append({'time':round(time,6),'name':name})
for name,release in [('gaze',1.45),('gaze_turbo',1.45),('fg_gaze',1.05),('fg_gaze_turbo',1.05)]:
    for at,event in [(release-.35,'motion_gather'),(release-.10,'motion_cast'),(release-.015,'motion_wrist'),(release+.20,'motion_jewel'),(release+.30,'motion_tail')]:sound_mark(name,at,event)
    if not name.startswith('fg_'):
        sound_mark(name,.2,'motion_glasses_slide');sound_mark(name,2.38,'motion_glasses_on')
for at,event in [(.16,'motion_gather'),(.29,'motion_smug'),(.36,'motion_jewel')]:sound_mark('react_small',at,event)
for name in ['win_big','win_max']:
    for at,event in [(.10,'motion_laugh'),(.26,'motion_gather'),(.53,'motion_jewel'),(.64,'motion_tail')]:sound_mark(name,at,event)
sound_mark('gaze_dud',.06,'motion_annoyed')
sound_mark('fg_trigger',.06,'motion_gasp');sound_mark('fg_trigger',.42,'motion_jewel')
sound_mark('fg_end',.78,'motion_glasses_on');sound_mark('fg_end',.90,'motion_smug')
sound_mark('idle_fidget',.28,'motion_glasses_slide');sound_mark('idle_fidget',.72,'motion_jewel')
for i in range(1,10):
    sound_mark(f'snake_fidget_{i}',.59,'motion_bite');sound_mark(f'snake_fidget_{i}',.94,'motion_bite_soft')
for animation in S['animations'].values():
    if 'events' in animation:animation['events'].sort(key=lambda event:event['time'])

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
report={'spine':'4.3.13','bones':len(bones),'frontSnakeChains':9,'snakeBonesEach':5,'independentSnakeJaws':9,'mouthConstruction':'Editable lip seam meshes with original painted mouth UVs','animations':{n:max((k.get('time',0) for b in c['bones'].values() for timeline in b.values() for k in timeline),default=0) for n,c in S['animations'].items()},'atlasPages':[{k:v for k,v in p.items() if k!='placements'} for p in pages],'mesh':geometry,'hash':hashlib.sha256(encoded.encode()).hexdigest(),'provenance':'Original Medusa-only topology and keys. Painted imagegen sources registered in full canvas. No third-party character motion data.'}
(ROOT/'spine43-build.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:report[k] for k in ['spine','bones','frontSnakeChains','snakeBonesEach','atlasPages']},indent=2));print('Animations:',', '.join(S['animations']))
