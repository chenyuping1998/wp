"""Connected limb chains with half-angle elbow and wrist volume bones.

The shoulder belongs to the moving upper limb. Blending it with a stationary
chest while rotating an arm by 100 degrees folds the sleeve through itself.
Every overlapping sleeve/paw/feather layer uses the same chain coordinate, so
the skin on either side of a seam has the same transform.
"""
import math
from new_game_skin_v3 import skin_weights as soft_weights, smooth, normalize, grid_for as soft_grid

def add_articulation_bones(bone, joints, angle, cat=False):
    for side,(shoulder,elbow,wrist) in joints.items():
        fore=angle(elbow,wrist)
        bone('elbow_volume_'+side,'upper_'+side,elbow,fore)
        bone('wrist_volume_'+side,'fore_'+side,wrist,fore)

def grid_for(name):
    if name.startswith(('arm_','wing_','paw_')):return 20,28
    return soft_grid(name)

def chain_coordinate(point,points):
    best=float('inf');coordinate=0;distance=0;cum=[0]
    for i,(a,b) in enumerate(zip(points,points[1:])):
        dx,dy=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dy)
        t=((point[0]-a[0])*dx+(point[1]-a[1])*dy)/(length*length)
        tc=min(t,1) if i==0 else max(t,0) if i==len(points)-2 else max(0,min(1,t))
        gap=math.hypot(point[0]-a[0]-dx*tc,point[1]-a[1]-dy*tc)
        if gap<best:best=gap;coordinate=distance+tc*length
        distance+=length;cum.append(distance)
    return coordinate,cum

def skin_weights(name,p,default,cat,joints):
    if cat and name.startswith('face_'):
        # Lower ruff follows the collar, not a pivot in the middle of the face.
        weights=soft_weights(name,(p[0],p[1]-32),default,cat,joints)
        pin=.98*smooth(642,740,p[1])
        return normalize([(b,w*(1-pin)) for b,w in weights]+[('neck',pin)])
    if not name.startswith(('arm_','wing_','paw_')):
        return soft_weights(name,p,default,cat,joints)
    side='back' if 'back' in name else 'front';sh,el,wr=joints[side]
    if cat and name.startswith('paw_'):
        # A palm is not the continuation of an infinitely projected forearm.
        # Its broad knuckles must not be pulled back onto the elbow chain.
        w=.28*smooth(wr[1]+45,wr[1]+105,p[1])
        return [('hand_'+side,1-w),('knuckle_'+side,w)]
    if not cat:
        if 'upper' in name:return [('upper_'+side,1)]
        if name=='wing_front_mid':return [('fore_'+side,1)]
        if name=='wing_back_tip':return [('fore_'+side,1)]
        w=.18*smooth(wr[1]+35,wr[1]+115,p[1])
        return [('hand_'+side,1-w),('feather_'+side,w)]
    tip=([430,1210] if side=='front' else [830,1155]) if cat else ([265,1175] if side=='front' else [845,1140])
    # Joint planes follow the actual limb directions. Horizontal image rows
    # make the left edge of a diagonal forearm move as if it were a cuff.
    L1=math.dist(sh,el);L2=math.dist(el,wr)
    upper=((el[0]-sh[0])/L1,(el[1]-sh[1])/L1);fore=((wr[0]-el[0])/L2,(wr[1]-el[1])/L2)
    bisector=(upper[0]+fore[0],upper[1]+fore[1]);length=math.hypot(*bisector);bisector=(bisector[0]/length,bisector[1]/length)
    e=(p[0]-el[0])*bisector[0]+(p[1]-el[1])*bisector[1];band=.88*min(L1,L2)
    e1=smooth(-band,0,e);e2=smooth(0,band,e)
    w=(p[0]-wr[0])*fore[0]+(p[1]-wr[1])*fore[1];wb=min(120,.65*L2)
    w1=smooth(-wb,-wb*.5,w);w2=smooth(-wb*.5,-15,w)
    result=[('upper_'+side,(1-e1)*(1-w1)),('elbow_volume_'+side,(e1-e2)*(1-w1)),('fore_'+side,e2*(1-w1)),('wrist_volume_'+side,w1-w2),('hand_'+side,w2)]
    return normalize(result)
