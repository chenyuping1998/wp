"""Flowing ends for every visible red tie, using the existing painted pixels.

Each knot and tightly wound wrap remains on its original body attachment.
Only its free ends get two-link weights, phase lag and inertial follow-through.
"""
import math
from polish_ninja_motion import local_point, smooth, world_transform


# Positions are local pixels on the PSD part, not guessed skeleton offsets.
# Tight shoe/shin wraps are deliberately excluded from the free-end masks.
STRAPS = [
    ('band_upper','head_2_face','head',(47,62),(7,109),13,1.8,3.0),
    ('band_lower','head_2_face','head',(45,67),(24,145),15,1.8,3.2),
    ('sleeve_outer','left_arm_0_upper_arm','cuffL',(45,111),(7,160),18,2.5,4.5),
    ('sleeve_inner','left_arm_0_upper_arm','cuffL',(45,114),(27,170),18,2.3,4.2),
    ('sash_side','torso_0_trunk','torso',(104,315),(56,395),25,1.2,2.0),
    ('shin_left_outer','left_leg_1_calf','legL_calf',(28,85),(7,143),12,2.2,3.5),
    ('shin_left_inner','left_leg_1_calf','legL_calf',(30,89),(23,171),12,1.8,3.2),
    ('shin_right_outer','right_leg_1_calf','legR_calf',(102,96),(122,137),9,2.2,3.8),
    ('shin_right_inner','right_leg_1_calf','legR_calf',(100,100),(104,149),10,1.8,3.5),
    ('heel_right','right_leg_2_foot','legR_foot',(12,55),(12,98),10,1.5,2.7),
]


def wave(amplitude,phase):
    period=4.8
    # A second harmonic makes the tips trail and ripple rather than swing as
    # one rigid pendulum. Both value and derivative match at the loop seam.
    def value(t):
        a=2*math.pi*t/period
        return amplitude*(math.sin(a+phase)-math.sin(phase)+.2*(math.sin(2*a+phase)-math.sin(phase)))
    def speed(t):
        a=2*math.pi*t/period
        return amplitude*2*math.pi/period*(math.cos(a+phase)+.4*math.cos(2*a+phase))
    frames=[]
    for i in range(49):
        t=period*i/48
        key={'time':round(t,6),'value':round(value(t),6)}
        if i<48:
            end=t+period/48
            dt=(end-t)/3
            key['curve']=[t+dt,value(t)+speed(t)*dt,end-dt,value(end)-speed(end)*dt]
        frames.append(key)
    return {'rotate':frames}


def decode_weights(attachment):
    """Preserve the base skin under every pose when adding a finer grid.

    Interpolate weight*local-position as well as weights; recomputing local
    positions from the new rest point changes the original sleeve deformation.
    """
    if attachment.get('type') != 'mesh':
        return None
    data=attachment['vertices']
    weights=[]
    cursor=0
    for _ in range(len(attachment['uvs'])//2):
        count=int(data[cursor]);cursor+=1
        item={}
        for _ in range(count):
            bone,x,y,weight=data[cursor:cursor+4];cursor+=4
            item[int(bone)]=(weight,x,y)
        weights.append(item)
    uvs=list(zip(attachment['uvs'][::2],attachment['uvs'][1::2]))
    triangles=[]
    for i in range(0,len(attachment['triangles']),3):
        ids=attachment['triangles'][i:i+3]
        a,b,c=[uvs[j] for j in ids]
        det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
        if abs(det)>1e-12:
            triangles.append((ids,a,b,c,det))
    def sample(u,v):
        for ids,a,b,c,det in triangles:
            p=((b[1]-c[1])*(u-c[0])+(c[0]-b[0])*(v-c[1]))/det
            q=((c[1]-a[1])*(u-c[0])+(a[0]-c[0])*(v-c[1]))/det
            r=1-p-q
            if min(p,q,r)<-1e-6:
                continue
            out={}
            for index,amount in zip(ids,(p,q,r)):
                for bone,(weight,x,y) in weights[index].items():
                    w=weight*max(0,amount)
                    old=out.get(bone,(0,0,0))
                    out[bone]=(old[0]+w,old[1]+w*x,old[2]+w*y)
            return {bone:(w,x/w,y/w) for bone,(w,x,y) in out.items() if w>1e-9}
        raise ValueError(f'Uncovered base mesh UV {u},{v}')
    return sample


def tail_field(px,py,root,tip,width):
    dx,dy=tip[0]-root[0],tip[1]-root[1]
    length=math.hypot(dx,dy)
    t=((px-root[0])*dx+(py-root[1])*dy)/(length*length)
    distance=abs((px-root[0])*dy-(py-root[1])*dx)/length
    # Broad, smooth falloff into adjacent cloth avoids tearing the unchanged
    # painting open. The first 12% is pinned at the knot.
    influence=.88*smooth((t-.12)/.78)*(1-smooth((t-1.12)/.42))
    influence*=math.exp(-(distance/width)**4)
    return influence,smooth((t-.42)/.50)*.78


def add_straps(rig,pieces,layout):
    parts={part['name']:part for part in layout['layers']}
    groups={}
    for i,(name,slot,parent,root,tip,width,base_amp,tip_amp) in enumerate(STRAPS):
        part=parts[slot]
        dx,dy=tip[0]-root[0],tip[1]-root[1]
        length=math.hypot(dx,dy)
        rotation=math.degrees(math.atan2(-dy,dx))
        wx,wy=part['x']+root[0]-280,884-(part['y']+root[1])
        transform=world_transform(rig['bones'],parent)
        x,y=local_point(transform,wx,wy)
        rotation-=math.degrees(math.atan2(transform[1],transform[0]))
        rig['bones'].append(dict(name=name,parent=parent,x=x,y=y,rotation=rotation,length=length*.52))
        rig['bones'].append(dict(name=name+'_tip',parent=name,x=length*.52,length=length*.48))
        for link,amp,phase in [(name,base_amp,.35*i),(name+'_tip',tip_amp,.35*i+.65)]:
            rig['physics'].append(dict(name=link+'_flow',bone=link,order=len(rig['physics']),
                                      rotate=.25,inertia=.16,strength=170,damping=.92,mass=.5,limit=10))
            rig['animations']['flutter']['bones'][link]=wave(amp,phase)
        groups.setdefault(slot,[]).append((name,root,tip,width))
    bones=rig['bones']
    indices={bone['name']:i for i,bone in enumerate(bones)}
    transforms=[world_transform(bones,bone['name']) for bone in bones]
    for slot,straps in groups.items():
        part=parts[slot]
        attachment=rig['skins'][0]['attachments'][slot][slot]
        parent=next(s for s in rig['slots'] if s['name']==slot)['bone']
        sample=decode_weights(attachment)
        w,h=pieces[slot].size
        cols=max(12,math.ceil(w/7))
        rows=max(14,math.ceil(h/7))
        ring=([(c,0) for c in range(cols)]+[(cols,r) for r in range(rows)]+
              [(c,rows) for c in range(cols,0,-1)]+[(0,r) for r in range(rows,0,-1)])
        order=ring+[(c,r) for r in range(1,rows) for c in range(1,cols)]
        ids={p:i for i,p in enumerate(order)}
        uvs,vertices,triangles=[],[],[]
        for c,r in order:
            u,v=c/cols,r/rows
            px,py=u*w,v*h
            base=sample(u,v) if sample else {indices[parent]:(1.,*local_point(transforms[indices[parent]],part['x']+px-280,884-part['y']-py))}
            fields=[(name,*tail_field(px,py,root,tip,width)) for name,root,tip,width in straps]
            total=sum(amount for _,amount,_ in fields)
            # The sleeve already blends shoulder and cuff bones during a
            # strike. Keep that proven skinning dominant; the ties add a
            # secondary ripple instead of pulling the sleeve off the elbow.
            cap=.22 if slot=='left_arm_0_upper_arm' else .9
            normalize=min(1.,cap/max(total,1e-9))
            used=total*normalize
            weights={i:value[0]*(1-used) for i,value in base.items()}
            for name,amount,blend in fields:
                amount*=normalize
                weights[indices[name]]=amount*(1-blend)
                weights[indices[name+'_tip']]=amount*blend
            weights={i:value for i,value in weights.items() if value>1e-6}
            total=sum(weights.values())
            uvs.extend((u,v));vertices.append(len(weights))
            for i,weight in weights.items():
                if i in base:
                    _,x,y=base[i]
                else:
                    x,y=local_point(transforms[i],part['x']+px-280,884-part['y']-py)
                vertices.extend((i,round(x,6),round(y,6),weight/total))
        for r in range(rows):
            for c in range(cols):
                a,b,e,d=ids[c,r],ids[c+1,r],ids[c+1,r+1],ids[c,r+1]
                triangles.extend((a,b,e,a,e,d))
        rig['skins'][0]['attachments'][slot][slot]=dict(type='mesh',width=w,height=h,
            uvs=uvs,vertices=vertices,triangles=triangles,hull=len(ring))
