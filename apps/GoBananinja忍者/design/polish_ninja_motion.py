"""Cloth follow-through and authored ninja gestures on Boom's body joints.

Only accessory bones are appended; existing body joints and source pixels stay
unchanged. The jacket remains one continuous weighted surface without holes.
"""
import copy
import math


def smooth(x):
    x = min(1., max(0., x))
    return x*x*(3-2*x)


def timeline(keys, fields=('value',)):
    """Monotone cubic tangents, with quiet endpoints and no pose overshoot."""
    result = [dict(time=t, **dict(zip(fields, values))) for t, *values in keys]
    slopes = []
    for dim in range(len(fields)):
        secants = [(b[dim+1]-a[dim+1])/(b[0]-a[0]) for a,b in zip(keys,keys[1:])]
        tangents = [0.]
        for before,after in zip(secants,secants[1:]):
            tangents.append(2*before*after/(before+after) if before*after>0 else 0.)
        slopes.append(tangents+[0.])
    for i,(a,b) in enumerate(zip(keys,keys[1:])):
        dt=(b[0]-a[0])/3
        curve=[]
        for dim in range(len(fields)):
            curve += [round(a[0]+dt,6),round(a[dim+1]+slopes[dim][i]*dt,6),
                      round(b[0]-dt,6),round(b[dim+1]-slopes[dim][i+1]*dt,6)]
        result[i]['curve']=curve
    return result


def world_transform(bones, name):
    b=next(b for b in bones if b['name']==name)
    angle=math.radians(b.get('rotation',0))
    c,s=math.cos(angle),math.sin(angle)
    local=(c,s,-s,c,b.get('x',0),b.get('y',0))
    if 'parent' not in b:
        return local
    a,bb,cc,d,x,y=world_transform(bones,b['parent'])
    e,f,g,h,tx,ty=local
    return (a*e+cc*f,bb*e+d*f,a*g+cc*h,bb*g+d*h,a*tx+cc*ty+x,bb*tx+d*ty+y)


def local_point(transform,x,y):
    a,b,c,d,tx,ty=transform
    det=a*d-b*c
    return ((d*(x-tx)-c*(y-ty))/det,(-b*(x-tx)+a*(y-ty))/det)


def add_cloth(rig):
    bones=rig['bones']
    # Source canvas points; positive bone axes follow the hanging fabric.
    definitions=[('hem_left',(166,468),-108,94),('hem_right',(378,468),-82,80),
                 ('sash_base',(330,444),-100,70),('sash_short',(352,446),-80,93)]
    for name,(px,py),rotation,length in definitions:
        x,y=local_point(world_transform(bones,'torso'),px-280,884-py)
        bones.append(dict(name=name,parent='torso',x=x,y=y,rotation=rotation,length=length))
    bones.append(dict(name='sash_tip',parent='sash_base',x=70,length=67))
    names=['hem_left','hem_right','sash_base','sash_tip','sash_short']
    for i,name in enumerate(names):
        rig['physics'].append(dict(name=name+'_cloth',bone=name,order=len(rig['physics']),
                                  rotate=.35,inertia=.3,strength=150 if name.startswith('hem') else 110,
                                  damping=.88,mass=.75,limit=12))
    transforms={b['name']:world_transform(bones,b['name']) for b in bones}
    indices={b['name']:i for i,b in enumerate(bones)}
    cols,rows=36,44
    ring=([(c,0) for c in range(cols)]+[(cols,r) for r in range(rows)]+
          [(c,rows) for c in range(cols,0,-1)]+[(0,r) for r in range(rows,0,-1)])
    order=ring+[(c,r) for r in range(1,rows) for c in range(1,cols)]
    index={p:i for i,p in enumerate(order)}
    uvs,vertices,triangles=[],[],[]
    for col,row in order:
        u,v=col/cols,row/rows
        px,py=69+361*u,146+441*v
        # Pin the knot and waistband. Only the hanging cloth gets a free end.
        long=0.87*smooth((py-457)/55)*math.exp(-((px-(330-.22*(py-450)))/27)**4)
        short=0.72*smooth((py-460)/65)*math.exp(-((px-(352+.16*(py-450)))/18)**4)
        short*=1-long
        tip=smooth((py-498)/68)*.8
        remaining=1-long-short
        left=.62*smooth((py-473)/105)*(1-smooth((px-240)/70))*remaining
        right=.62*smooth((py-473)/105)*smooth((px-280)/65)*remaining
        weights={'torso':remaining-left-right,'hem_left':left,'hem_right':right,
                 'sash_base':long*(1-tip),'sash_tip':long*tip,'sash_short':short}
        weights={n:w for n,w in weights.items() if w>1e-5}
        total=sum(weights.values())
        uvs.extend((u,v))
        vertices.append(len(weights))
        for name,weight in weights.items():
            x,y=local_point(transforms[name],px-280,884-py)
            vertices.extend((indices[name],round(x,6),round(y,6),weight/total))
    for r in range(rows):
        for c in range(cols):
            a,b,e,d=index[c,r],index[c+1,r],index[c+1,r+1],index[c,r+1]
            triangles.extend((a,b,e,a,e,d))
    rig['skins'][0]['attachments']['torso_0_trunk']['torso_0_trunk']=dict(
        type='mesh',width=361,height=441,uvs=uvs,vertices=vertices,triangles=triangles,hull=len(ring))
    flutter=rig['animations']['flutter']['bones']
    period=4.8
    for name,amp,phase in [('hem_left',.9,0),('hem_right',.8,.7),
                           ('sash_base',1.6,.4),('sash_tip',3.2,1.0),('sash_short',2.2,.8)]:
        # Equal position AND slope at the loop seam. Physics reacts to torso
        # acceleration independently of this gentle breeze on track 1.
        keys=[]
        for i in range(49):
            t=period*i/48
            value=amp*(math.sin(2*math.pi*t/period+phase)-math.sin(phase))
            key=dict(time=round(t,6),value=round(value,6))
            if i<48:
                dt=period/48
                tangent=amp*2*math.pi/period*math.cos(2*math.pi*t/period+phase)
                nt=t+dt
                nv=amp*(math.sin(2*math.pi*nt/period+phase)-math.sin(phase))
                ns=amp*2*math.pi/period*math.cos(2*math.pi*nt/period+phase)
                key['curve']=[t+dt/3,value+tangent*dt/3,nt-dt/3,nv-ns*dt/3]
            keys.append(key)
        flutter[name]={'rotate':keys}
    # 4.8 seconds matches Boom's accessory loop exactly.


def split_gesture(finale=False):
    end=1.18 if finale else .94
    strength=1.12 if finale else 1.
    times=[0,.10,.17,.32,.43,.64,end]
    animation={'bones':{}}
    def rotate(name,values):
        animation['bones'].setdefault(name,{})['rotate']=timeline([(t,v*strength) for t,v in zip(times,values)])
    def translate(name,values):
        animation['bones'].setdefault(name,{})['translate']=timeline([(t,x*strength,y*strength) for t,(x,y) in zip(times,values)],('x','y'))
    # The reel finishes its downstroke at 320ms (192ms in turbo).
    # Turn into a guard, drive a diagonal forearm strike, absorb, then settle.
    translate('hip',[(0,0),(3,-6),(5,-12),(-9,-5),(-5,-9),(-1,-2),(0,0)])
    rotate('torso',[0,4,8,-10,-6,2,0])
    rotate('head',[0,-2,-5,7,4,-1,0])
    rotate('armL',[0,14,27,-22,-13,4,0])
    rotate('armL_fore',[0,20,45,19,10,-2,0])
    rotate('armR',[0,-9,-17,12,7,-2,0])
    rotate('armR_fore',[0,-14,-28,-8,-4,1,0])
    rotate('legL',[0,-1,-2,2,1,0,0])
    rotate('legR',[0,1,2,-2,-1,0,0])
    # The accent has a longer, visible held guard; its attack still meets the
    # same impact frame, so the reel and the character never drift apart.
    if finale:
        for track in animation['bones'].values():
            for frames in track.values():
                for key in frames:
                    if key['time']==.64:
                        key['time']=.78
                # Rebuild tangents after extending the recovery hold.
                fields=('value',) if 'value' in frames[0] else ('x','y')
                track['rotate' if fields==('value',) else 'translate']=timeline(
                    [(key['time'],*(key[f] for f in fields)) for key in frames],fields)
    return animation


def polish(rig,pieces,layout):
    add_cloth(rig)
    rig['animations']['slash']=split_gesture()
    rig['animations']['slash_alt']=copy.deepcopy(rig['animations']['slash'])
    rig['animations']['split_finale']=split_gesture(True)
    # A dedicated rare-trigger double strike, not repeated chest beating.
    special=split_gesture(True)
    for track in special['bones'].values():
        for name,frames in list(track.items()):
            fields=('value',) if name=='rotate' else ('x','y')
            values=[tuple(key[f] for f in fields) for key in frames]
            new_times=[0,.22,.38,.56,.69,.84,1.45]
            keys=[(t,*value) for t,value in zip(new_times,values)]
            # Second, smaller strike at the 1.02s audio cue.
            keys=keys[:-1]+[(.90,*(v*-.55 for v in values[2])),
                           (1.02,*(v*.8 for v in values[3])),
                           (1.18,*(v*.35 for v in values[4])),(1.62,*(0 for _ in fields))]
            track[name]=timeline(keys,fields)
    rig['animations']['scatter_slash']=special
    # A quiet celebration loop replaces the repeated jump/cheer cycle.
    dance={'bones':{}}
    times=[0,.7,1.4,2.1,2.8]
    for name,values in [('torso',[0,2,0,-2,0]),('head',[0,-1,0,1,0]),
                        ('armL',[0,-4,0,3,0]),('armR',[0,-3,0,4,0])]:
        dance['bones'][name]={'rotate':timeline(list(zip(times,values)))}
    dance['bones']['hip']={'translate':timeline([(0,0,0),(.7,2,-3),(1.4,0,0),(2.1,-2,-3),(2.8,0,0)],('x','y'))}
    rig['animations']['dance']=dance
    # A restrained glance toward the board, followed by a guard adjustment.
    # All poses return to setup so the breathing loop can resume without a snap.
    watch={'bones':{}}
    times=[0,.35,.8,1.25,1.8,2.3]
    for name,values in [('head',[0,3,3,1,-1,0]),
                        ('torso',[0,1,1,-1,-.5,0]),
                        ('armL',[0,2,4,3,1,0]),
                        ('armL_fore',[0,3,7,5,1,0]),
                        ('armR',[0,-1,-2,-1,0,0])]:
        watch['bones'][name]={'rotate':timeline(list(zip(times,values)))}
    rig['animations']['watch']=watch
    from ninja_strap_motion import add_straps
    add_straps(rig,pieces,layout)
