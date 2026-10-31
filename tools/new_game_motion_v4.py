"""Authored joint-space gestures for the actual painted seated/avian anatomy.

Contact poses are measured against the paw tip, not the wrist. Generic IK aimed
the wrist at the lens/forehead and turned the whole sleeve inside out. All
clips explicitly key both limb chains, including their volume helpers.
"""
import math
from new_game_motion_flow import bake_curve

def author_motion_v4(S,cat,joints):
    def duration(c):
        return max((k.get('time',0) for b in c['bones'].values() for keys in b.values() for k in keys),default=1)
    def curve(keys):
        return bake_curve(keys)
    def rot(c,b,keys):c['bones'].setdefault(b,{})['rotate']=[{'time':t,'value':v} for t,v in keys]
    def limb(c,side,D,keys):
        dense=curve([(D*f,u,e,w) for f,u,e,w in keys])
        for b,k in [('upper_',1),('fore_',2),('hand_',3)]:
            c['bones'][b+side]={'rotate':[{'time':p[0],'value':p[k]} for p in dense]}
        rot(c,'elbow_volume_'+side,[(p[0],p[2]*.5) for p in dense])
        rot(c,'wrist_volume_'+side,[(p[0],p[3]*.5) for p in dense])
    def gesture(c,side,D,pose,up=.30,hold=.68):
        limb(c,side,D,[(0,0,0,0),(up,*pose),(hold,*pose),(1,0,0,0)])
    def wing_path(c,side,D,keys):
        # Bake a measured wrist corridor into FK. Folding the elbow before
        # raising the shoulder keeps feathers near the body through the whole
        # path; interpolating only the endpoint angles sweeps them off-canvas.
        sh,el,wr=joints[side];L1=math.dist(sh,el);L2=math.dist(el,wr)
        a0=math.degrees(math.atan2(sh[1]-el[1],el[0]-sh[0]));b0=math.degrees(math.atan2(el[1]-wr[1],wr[0]-el[0]))
        dense=curve([(D*f,*point,orientation) for f,point,orientation in keys]);poses=[]
        normal=lambda v:(v+180)%360-180
        for t,x,y,orientation in dense:
            dx,dy=x-sh[0],sh[1]-y;d=math.hypot(dx,dy)
            assert abs(L1-L2)<d<L1+L2,('Unreachable wing target',side,x,y)
            phi=math.acos(max(-1,min(1,(L1*L1+d*d-L2*L2)/(2*L1*d))))
            a=math.atan2(dy,dx)+phi;b=math.atan2(dy-L1*math.sin(a),dx-L1*math.cos(a))
            u=normal(math.degrees(a)-a0);f=normal(math.degrees(b-a)-(b0-a0));h=normal(orientation-u-f)
            if poses:
                previous=poses[-1]
                u=previous[1]+normal(u-previous[1]);f=previous[2]+normal(f-previous[2]);h=previous[3]+normal(h-previous[3])
            assert abs(h)<105,('Wing wrist over-flexion',side,t,h)
            poses.append((t,u,f,h))
        for b,k in [('upper_',1),('fore_',2),('hand_',3)]:rot(c,b+side,[(p[0],p[k]) for p in poses])
        rot(c,'elbow_volume_'+side,[(p[0],p[2]*.5) for p in poses]);rot(c,'wrist_volume_'+side,[(p[0],p[3]*.5) for p in poses])
    def raised_wing(c,side,D,target,orientation,up=.30,hold=.68,loop=False):
        wr=joints[side][2];fold=[310,805] if side=='front' else [780,850];pre=[280,690] if side=='front' else [850,650]
        first=-70 if side=='front' else 35;second=-130 if side=='front' else 95
        if loop:
            sign=1 if side=='front' else -1
            wing_path(c,side,D,[(0,target,orientation),(.28,[target[0]+3*sign,target[1]+5],orientation+sign),(.58,[target[0],target[1]+8],orientation),(.80,[target[0]-2*sign,target[1]+3],orientation-sign*.6),(1,target,orientation)])
            return
        up=min(up*1.45,hold*.73)
        keys=[(0,wr,0),(up*.43,fold,first),(up*.78,pre,second),(up,target,orientation),(hold,target,orientation)]
        if hold<1:keys += [(hold+(1-hold)*.55,fold,first),(1,wr,0)]
        wing_path(c,side,D,keys)
    rest=[(0,0,0,0),(1,0,0,0)]
    for name,c in S['animations'].items():
        if name=='breath':continue
        D=duration(c)
        for side in joints:limb(c,side,D,rest)
        if not cat:
            # Distinct tip drawings had incompatible roots and popped at the
            # wrist. Keep one registered wing; articulation makes the gesture.
            for k in c['slots'].get('hand_front',{}).get('attachment',[]):
                if k.get('name'):k['name']='wing_front_tip_scratch'
        if cat:
            if name.startswith('push_monocle'):
                limb(c,'front',D,[(0,0,0,0),(.28,62,12,12),(.46,122,-10,45),(.53,124,-10,45),(.68,122,-10,45),(1,0,0,0)])
                c['bones']['monocle']['translate']=[{'time':0,'x':0,'y':0},{'time':D*.46,'x':0,'y':0},{'time':D*.53,'x':0,'y':5},{'time':D*.70,'x':0,'y':0},{'time':D,'x':0,'y':0}]
            elif name.startswith('stamp'):
                limb(c,'front',D,[(0,0,0,0),(.33,45,25,-45),(.44,46,24,-45),(.54,-10,20,-10),(.65,-7,18,-11),(1,0,0,0)])
            elif name=='claim_turf':
                limb(c,'front',D,[(0,0,0,0),(.18,18,18,-15),(.28,20,20,-15),(.58,-60,30,12),(.73,-58,28,11),(1,0,0,0)])
            elif name=='lick_paw':gesture(c,'front',D,(90,50,20),.30,.68)
            elif name=='catch_stamp':gesture(c,'front',D,(-12,20,-8),.28,.55)
            elif name=='react_good':
                gesture(c,'front',D,(16,12,-8),.25,.72);gesture(c,'back',D,(-12,-8,8),.30,.72)
            elif name=='react_none':gesture(c,'front',D,(-12,12,-8),.35,.70)
            elif name=='idle_bored':
                limb(c,'front',D,[(0,0,0,0),(.50,0,0,0),(.65,90,50,20),(.77,90,50,20),(1,0,0,0)])
            elif name=='fg_trigger':
                limb(c,'front',D,[(0,0,0,0),(.18,-12,20,-8),(.40,-12,20,-8),(.59,38,28,-35),(.82,38,28,-35),(1,0,0,0)])
            elif name=='fg_end':gesture(c,'front',D,(28,25,-30),.25,.55)
            elif name in ['win_big','win_big_loop']:
                front=(25,15,-15);back=(-20,-10,10)
                for side,p in [('front',front),('back',back)]:
                    limb(c,side,D,[(0,*(p if name.endswith('_loop') else (0,0,0))),(.25,*p),(1,*p)])
            elif name in ['win_max','win_max_loop']:
                loop=name.endswith('_loop')
                for side,sign in [('front',1),('back',-1)]:
                    limb(c,side,D,[(0,2*sign if loop else 0,-6*sign if loop else 0,0),(.25,2*sign,-6*sign,-6*sign),(.50,2*sign,-6*sign,0),(.75,2*sign,-6*sign,-5*sign),(1,2*sign,-6*sign,0)])
        else:
            if name=='encore_build':
                limb(c,'front',D,[(0,0,0,0),(.12,2,-8,-6),(.28,-3,-4,6),(.38,4,-10,-7),(.55,-2,-5,6),(.72,4,-10,-7),(.90,2,-5,0),(1,2,-5,0)])
            elif name=='encore_call':gesture(c,'front',D,(-105,-55,10),.22,.73)
            elif name in ['encore_success','react_small']:gesture(c,'front',D,(-65,-45,8),.24,.66)
            elif name=='encore_fail':gesture(c,'front',D,(8,-8,-10),.25,.72)
            elif name=='turn_knob':gesture(c,'back',D,(-8,-28,-20),.28,.65)
            elif name=='record_pull':
                limb(c,'front',D,[(0,0,0,0),(.22,8,-8,-5),(.40,-35,-30,8),(.72,-105,-55,5),(.84,-108,-52,5),(1,0,0,0)])
            elif name=='record_hit':
                gesture(c,'front',D,(-75,-35,8),.22,.68);gesture(c,'back',D,(110,-25,-8),.25,.68)
            elif name=='record_miss':gesture(c,'front',D,(-45,-65,0),.26,.65)
            elif name=='fg_trigger':
                gesture(c,'front',D,(-65,-40,12),.30,.82);gesture(c,'back',D,(145,-25,-12),.38,.82)
            elif name=='fg_end':
                # No detached headphones travelling through the torso.
                c['bones']['headphones']={'translate':[{'time':0,'x':0,'y':0},{'time':D,'x':0,'y':0}]}
                rot(c,'headphones',curve([(0,0),(D*.35,2),(D*.72,0),(D,0)]))
                gesture(c,'back',D,(12,-12,-8),.28,.58)
            elif name in ['win_big','win_big_loop','win_max','win_max_loop']:
                loop=name.endswith('_loop')
                for side,p in [('front',(-102,-45,4)),('back',(140,-24,-8))]:
                    limb(c,side,D,[(0,*(p if loop else (0,0,0))),(.24,*p),(1,*p)])
    if not cat:
        for name,c in S['animations'].items():
            if name=='breath':continue
            D=duration(c);rot(c,'microphone_grip',[(0,0),(D,0)])
            if name in ['react_small','encore_success']:raised_wing(c,'front',D,[245,640],-150,.28,.66)
            elif name=='encore_call':raised_wing(c,'front',D,[235,520],-175,.27,.73)
            elif name=='record_pull':
                wr=joints['front'][2]
                wing_path(c,'front',D,[(0,wr,0),(.23,[285,1050],0),(.42,[310,805],-70),(.60,[280,690],-130),(.73,[235,520],-175),(.84,[235,520],-175),(.93,[310,805],-70),(1,wr,0)])
            elif name=='record_hit':
                raised_wing(c,'front',D,[235,570],-165,.28,.68);raised_wing(c,'back',D,[885,530],140,.30,.68)
            elif name=='record_miss':gesture(c,'front',D,(18,-25,-8),.26,.65)
            elif name=='fg_trigger':
                raised_wing(c,'front',D,[245,600],-160,.36,.82);raised_wing(c,'back',D,[885,490],145,.40,.82)
                rot(c,'microphone_grip',curve([(0,0),(D*.35,-10),(D*.82,-10),(D,0)]))
            elif name in ['win_big','win_big_loop','win_max','win_max_loop']:
                loop=name.endswith('_loop')
                raised_wing(c,'front',D,[235,520],-175,.27,1,loop);raised_wing(c,'back',D,[885,490],145,.29,1,loop)
                if name.startswith('win_max'):
                    loop=name.endswith('_loop');c['bones']['hips']={'translate':[{'time':t,'x':x,'y':y} for t,x,y in curve([(0,0,30 if loop else 0),(D*.10,0,30 if loop else -8),(D*.23,0,36),(D*.38,0,30),(D,0,30)])]}
    # Small asymmetric holds keep a celebration alive without rotating its
    # entire cutout. Paw kneading alternates rather than flexing both together.
    if cat:
        for name in ['win_big_loop','win_max_loop']:
            c=S['animations'][name];D=duration(c)
            for side,sign in [('front',1),('back',-1)]:
                poses=[]
                for i in range(121):
                    u=i/120;soft=(1-math.cos(u*math.tau))*.5
                    if name=='win_max_loop':
                        w=-6*soft if side=='front' else 6*(1-soft)
                        poses.append((D*u,2*sign,-6*sign,w))
                    else:poses.append((D*u,25+.7*soft if side=='front' else -20-.6*soft,15+.6*soft if side=='front' else -10-.5*soft,-15-1.6*soft if side=='front' else 10+1.2*soft))
                for b,k in [('upper_',1),('fore_',2),('hand_',3)]:rot(c,b+side,[(p[0],p[k]) for p in poses])
                rot(c,'elbow_volume_'+side,[(p[0],p[2]*.5) for p in poses]);rot(c,'wrist_volume_'+side,[(p[0],p[3]*.5) for p in poses])
        c=S['animations']['win_max'];D=duration(c)
        rot(c,'hand_back',curve([(0,0),(D*.72,0),(D,6)]));rot(c,'wrist_volume_back',curve([(0,0),(D*.72,0),(D,3)]))
    else:
        c=S['animations']['win_max_loop'];D=duration(c)
        c['bones']['hips']={'translate':[{'time':D*i/120,'x':0,'y':30+2.5*math.sin(math.pi*i/120)**2} for i in range(121)]}
    S['skeleton']['hash']=('purrfia' if cat else 'parrot')+'-flow-v6-20261030'
