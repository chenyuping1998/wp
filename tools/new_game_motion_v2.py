"""Distinct, bounded performances for the seated cat and three-quarter macaw.

Smooth curves are sampled into explicit keys so editor and runtime agree.
No camera, frame or whole-character idle scaling is introduced.
"""
import math

def author_motion_v2(S,cat,joints,arm,rotate,translate,attach,clip,finish):
    def eased(keys,curve='smooth',fps=40):
        result=[]
        for left,right in zip(keys,keys[1:]):
            t0,*a=left;t1,*b=right
            for i in range(max(1,math.ceil((t1-t0)*fps))):
                u=i/max(1,math.ceil((t1-t0)*fps));q=(1-math.cos(u*math.pi))/2 if curve=='smooth' else 1-(1-u)**3 if curve=='snap' else u*u*u
                result.append((round(t0+(t1-t0)*u,5),*[round(x+(y-x)*q,5) for x,y in zip(a,b)]))
        return result+[keys[-1]]
    def rot(c,b,keys,curve='smooth'):rotate(c,b,eased(keys,curve))
    def move(c,b,keys,curve='smooth'):translate(c,b,eased(keys,curve))
    def hand(c,side,keys,curve='smooth'):arm(c,side,[(t,[x,y]) for t,x,y in eased([(t,*p) for t,p in keys],curve)])
    def expression(c,keys):attach(c,'face',keys)
    def accessory(c,duration,strength=1):
        # Delayed follow-through, then a true hold instead of perpetual wobble.
        for bone,delay,amp in [('chain',.08,3.5),('headphones',.055,1.3),('crest',.035,2.1)] if not cat else [('monocle',.055,1.4),('tie',.07,2),('rose',.08,.9)]:
            if 'rotate' in c['bones'].get(bone,{}):continue
            lag=min(delay,duration*.08)
            rot(c,bone,[(0,0),(duration*.24+lag,amp*strength),(duration*.44+lag,-amp*.34*strength),(duration*.66+lag,amp*.10*strength),(duration*.92,0),(duration,0)])
        for i in range(1,5):
            rot(c,f'tail_{i}',[(0,0),(duration*.34+i*.025,(1.0 if cat else 1.5)*i*strength),(duration*.63+i*.015,-.2*i*strength),(duration,0)])
    def action(name,duration,faces):
        c=clip(duration);expression(c,faces);return c
    front=joints['front'][2];back=joints['back'][2]
    # Respiratory motion is confined by per-vertex weights on two body bones.
    c=clip(5.4 if cat else 4.6)
    D=c['_duration']
    for b,ampx,ampy,delay in [('belly',.018 if cat else .014,.015,.0),('ribs',.008,.011,.16)]:
        points=[(0,1,1),(D*.38+delay,1+ampx,1+ampy),(D*.9,1,1),(D,1,1)]
        c['bones'].setdefault(b,{})['scale']=[{'time':t,'x':x,'y':y} for t,x,y in eased(points)]
    finish('breath',c)
    c=clip(16);expression(c,[(0,'face_idle'),(6.10,'face_blink'),(6.24,'face_idle'),(14.50,'face_blink'),(14.64,'face_idle')]);rot(c,'tail_4',[(0,0),(12.8,0),(13.15,2),(13.65,-.5),(14,0),(16,0)]);finish('idle',c)
    c=clip(16);expression(c,[(0,'face_idle'),(7.2,'face_blink'),(7.34,'face_idle')])
    if cat:
        attach(c,'hand_front',[(0,'paw_front_stamp')]);attach(c,'stamp_held',[(0,'stamp_held')]);rot(c,'chest',[(0,1.2),(16,1.2)])
    finish('fg_idle',c)
    if cat:
        for name,D,contact in [('push_monocle',1.1,.50),('push_monocle_short',.5,.20)]:
            f=D/1.1;c=action(name,D,[(0,'face_idle'),(contact-.02,'face_monocle'),(D-.08,'face_idle')])
            hand(c,'front',[(0,front),(.32*f,[588,505]),(.49*f,[594,493]),(.55*f,[600,474]),(.68*f,[595,493]),(D,front)])
            move(c,'monocle',[(0,0,0),(.49*f,0,0),(.54*f,0,18),(.70*f,0,4),(D,0,0)])
            rot(c,'head',[(0,0),(.48*f,0),(.56*f,-1.5),(.78*f,0),(D,0)]);accessory(c,D,.45)
            c['events']=[{'time':contact,'name':'contact'},{'time':contact+.05,'name':'release'}];finish(name,c)
        for name,D in [('stamp',.9),('stamp_short',.45)]:
            c=action(name,D,[(0,'face_stamp'),(D-.04,'face_idle')]);attach(c,'hand_front',[(0,'paw_front_stamp'),(D-.04,'paw_front_rest')]);attach(c,'stamp_held',[(0,'stamp_held'),(D-.04,None)])
            hand(c,'front',[(0,front),(D*.33,[280,580]),(D*.44,[265,570]),(D*.54,[210,850]),(D*.65,[220,832]),(D,front)])
            rot(c,'chest',[(0,0),(D*.4,-2),(D*.55,4.5),(D*.7,3),(D,0)]);accessory(c,D,.8);c['events']=[{'time':D*.54,'name':'contact'}];finish(name,c)
        c=action('claim_turf',1.1,[(0,'face_smug'),(.3,'face_stamp'),(.95,'face_idle')]);hand(c,'front',[(0,front),(.25,[450,540]),(.35,[420,540]),(.5,[100,760]),(.75,[150,790]),(1.1,front)]);rot(c,'chest',[(0,0),(.3,6),(.52,8),(.85,3),(1.1,0)]);accessory(c,1.1,1);finish('claim_turf',c)
        c=action('lick_paw',.6,[(0,'face_smug'),(.55,'face_idle')]);hand(c,'front',[(0,front),(.2,[440,540]),(.42,[440,540]),(.6,front)]);rot(c,'head',[(0,0),(.28,5),(.6,0)]);finish('lick_paw',c)
        c=action('catch_stamp',.5,[(0,'face_smug'),(.46,'face_idle')]);hand(c,'front',[(0,front),(.15,[300,800]),(.24,[295,818]),(.5,front)]);attach(c,'stamp_held',[(.17,'stamp_held'),(.48,None)]);finish('catch_stamp',c)
        c=action('react_small',.9,[(0,'face_smug'),(.8,'face_idle')]);rot(c,'whiskers_left',[(0,0),(.14,-3),(.36,-3),(.9,0)]);rot(c,'whiskers_right',[(0,0),(.14,3),(.36,3),(.9,0)]);accessory(c,.9,.45);finish('react_small',c)
        c=action('react_good',1.4,[(0,'face_smug'),(1.3,'face_idle')]);hand(c,'front',[(0,front),(.3,[480,980]),(1,[480,980]),(1.4,front)]);hand(c,'back',[(0,back),(.3,[610,980]),(1,[610,980]),(1.4,back)]);rot(c,'head',[(0,0),(.32,2.5),(.52,0),(.75,2),(1.05,0),(1.4,0)]);rot(c,'chest',[(0,0),(.3,-2),(1.1,-2),(1.4,0)]);accessory(c,1.4,.6);finish('react_good',c)
        c=action('react_chain',1,[(0,'face_stamp'),(.9,'face_idle')]);rot(c,'chest',[(0,0),(.2,-3),(.8,-3),(1,0)]);move(c,'chest',[(0,0,0),(.25,0,10),(.8,0,10),(1,0,0)]);finish('react_chain',c)
        c=action('react_none',1.2,[(0,'face_annoyed'),(1.1,'face_idle')]);hand(c,'front',[(0,front),(.35,[220,1080]),(.48,[120,1080]),(.68,[165,1060]),(1.2,front)]);rot(c,'head',[(0,0),(.5,-3),(.95,-3),(1.2,0)]);finish('react_none',c)
        c=action('idle_bored',2.4,[(0,'face_idle'),(.35,'face_yawn'),(1.2,'face_smug'),(2.25,'face_idle')]);rot(c,'head',[(0,0),(.5,-4),(1,0),(1.6,4),(2.4,0)]);hand(c,'front',[(0,front),(1.2,front),(1.5,[450,545]),(1.85,[450,545]),(2.4,front)]);finish('idle_bored',c)
        c=action('fg_trigger',2.2,[(0,'face_idle'),(.2,'face_shock'),(1.1,'face_stamp'),(2.1,'face_idle')]);rot(c,'head',[(0,0),(.22,-4),(.48,-4),(.8,0),(2.2,0)]);attach(c,'catnip',[(0,'catnip'),(.95,None)]);move(c,'catnip',[(0,0,0),(.4,0,0),(.9,-30,-370),(2.2,-30,-370)]);hand(c,'front',[(0,front),(.3,[300,780]),(.8,[300,780]),(1.25,[250,560]),(1.8,[250,560]),(2.2,front)]);attach(c,'stamp_held',[(1.1,'stamp_held'),(2.15,None)]);accessory(c,2.2,.8);finish('fg_trigger',c)
        c=action('fg_end',1.6,[(0,'face_smug'),(1.5,'face_idle')]);hand(c,'front',[(0,front),(.3,[510,760]),(.65,[480,760]),(1.1,front),(1.6,front)]);attach(c,'stamp_held',[(0,'stamp_held'),(.5,None)]);rot(c,'tie',[(0,0),(.45,5),(.75,0),(1.6,0)]);rot(c,'head',[(0,0),(1.1,3),(1.35,0),(1.6,0)]);finish('fg_end',c)
    else:
        c=action('encore_build',1,[(0,'face_hype'),(.97,'face_hype')]);hand(c,'front',[(0,front),(.10,[275,1100]),(.27,[210,1100]),(.34,[320,1100]),(.52,[290,1100]),(.68,[205,1100]),(.76,[325,1100]),(.9,[280,1100]),(1,[280,1100])]);rot(c,'head',[(0,0),(.12,4),(.34,0),(.55,4),(.78,0),(1,0)]);accessory(c,1,.7);finish('encore_build',c)
        c=action('encore_call',.8,[(0,'face_squawk'),(.76,'face_idle')]);hand(c,'front',[(0,[280,1100]),(.1,[210,465]),(.67,[210,465]),(.8,front)],'snap');attach(c,'hand_front',[(0,'wing_front_tip_up'),(.76,'wing_front_tip_scratch')]);rot(c,'crest',[(0,0),(.1,-12),(.68,-12),(.8,0)]);accessory(c,.8,.8);finish('encore_call',c)
        for name,face in [('encore_success','face_smug'),('react_small','face_smug')]:
            c=action(name,.8,[(0,face),(.74,'face_idle')]);hand(c,'front',[(0,front),(.16,[160,780]),(.55,[160,780]),(.8,front)]);attach(c,'hand_front',[(0,'wing_front_tip_point'),(.75,'wing_front_tip_scratch')]);accessory(c,.8,.5);finish(name,c)
        c=action('encore_fail',1.2,[(0,'face_squawk'),(.08,'face_awkward'),(1.1,'face_idle')]);rot(c,'crest',[(0,-8),(.2,10),(.9,10),(1.2,0)]);move(c,'chest',[(0,0,0),(.22,0,-10),(.9,0,-10),(1.2,0,0)]);hand(c,'front',[(0,front),(.2,[320,1080]),(.9,[320,1080]),(1.2,front)]);rot(c,'head',[(0,0),(.18,-5),(.9,-5),(1.2,0)]);finish('encore_fail',c)
        c=action('turn_knob',.4,[(0,'face_hype'),(.36,'face_idle')]);hand(c,'back',[(0,back),(.12,[590,800]),(.26,[540,760]),(.4,back)]);rot(c,'hand_back',[(0,0),(.22,-24),(.4,0)]);finish('turn_knob',c)
        c=action('record_pull',1,[(0,'face_hype'),(.96,'face_idle')]);hand(c,'front',[(0,front),(.23,[330,1210]),(.4,[290,1130]),(.72,[210,460]),(.84,[170,430]),(1,front)]);attach(c,'hand_front',[(.25,'wing_front_tip_hold'),(.95,'wing_front_tip_scratch')]);attach(c,'record_held',[(.32,'record_held'),(.85,None)]);rot(c,'head',[(0,0),(.22,8),(.45,4),(.75,-3),(1,0)]);accessory(c,1,.9);finish('record_pull',c)
        c=action('record_hit',.8,[(0,'face_party'),(.74,'face_idle')]);hand(c,'front',[(0,front),(.14,[100,610]),(.55,[100,610]),(.8,front)]);hand(c,'back',[(0,back),(.14,[930,610]),(.55,[930,610]),(.8,back)]);rot(c,'head',[(0,0),(.16,-6),(.5,-6),(.8,0)]);accessory(c,.8,1);finish('record_hit',c)
        c=action('record_miss',.65,[(0,'face_awkward'),(.59,'face_idle')]);hand(c,'front',[(0,front),(.14,[410,450]),(.4,[410,450]),(.65,front)]);rot(c,'head',[(0,0),(.18,4),(.65,0)]);finish('record_miss',c)
        c=action('react_good',1.2,[(0,'face_party'),(1.1,'face_idle')]);rot(c,'chest',[(0,0),(.22,-3),(.44,3),(.66,-2),(.90,1),(1.2,0)]);accessory(c,1.2,1);finish('react_good',c)
        c=action('idle_mimic',1.5,[(0,'face_idle'),(.35,'face_squawk'),(.5,'face_idle'),(.75,'face_squawk'),(.9,'face_idle'),(1.15,'face_squawk'),(1.35,'face_idle')]);rot(c,'head',[(0,0),(.35,5),(.65,0),(1,-4),(1.5,0)]);finish('idle_mimic',c)
        c=action('idle_bored',2,[(0,'face_idle'),(.6,'face_blink'),(.82,'face_idle')]);rot(c,'head',[(0,0),(.55,6),(1.1,6),(2,0)]);accessory(c,2,.3);finish('idle_bored',c)
        c=action('fg_trigger',2.2,[(0,'face_shock'),(1.1,'face_party'),(2.1,'face_idle')]);rot(c,'crest',[(0,0),(.15,-12),(.8,-12),(2.2,0)]);hand(c,'back',[(0,back),(.4,[750,1050]),(.85,[800,400]),(1.8,[800,400]),(2.2,back)]);attach(c,'microphone_held',[(.45,'microphone_held'),(2.05,None)]);hand(c,'front',[(0,front),(.7,[180,650]),(1.8,[180,650]),(2.2,front)]);accessory(c,2.2,1);finish('fg_trigger',c)
        c=action('fg_end',1.6,[(0,'face_smug'),(1.5,'face_idle')]);move(c,'headphones',[(0,0,0),(.5,0,-290),(1.1,0,-290),(1.6,0,0)]);rot(c,'chest',[(0,0),(.65,9),(1.1,9),(1.6,0)]);rot(c,'head',[(0,0),(.7,5),(1.3,0),(1.6,0)]);finish('fg_end',c)
    # Distinct celebration poses; loops match the final pose without a jump.
    for name,D in [('win_big',2.6),('win_max',3.2)]:
        expressionName='face_laugh' if cat and name=='win_big' else 'face_purr' if cat else 'face_party'
        c=action(name,D,[(0,expressionName)])
        for side in joints:
            rest=joints[side][2];target=[250 if side=='front' else 800,490] if cat else [50 if side=='front' else 1000,650]
            hand(c,side,[(0,rest),(.55 if cat else .3,target),(D,target)])
        if cat and name=='win_max':
            rot(c,'hips',[(0,0),(.45,-8),(1.05,68),(1.65,94),(2.3,89),(D,92)]);move(c,'hips',[(0,0,0),(.8,100,-45),(1.6,210,-90),(D,210,-90)])
            c['bones']['hips']['scale']=[{'time':t,'x':v,'y':v} for t,v in eased([(0,1),(.45,1),(1.6,.74),(D,.74)])]
            move(c,'monocle',[(0,0,0),(.65,0,0),(.95,30,80),(1.5,35,35),(D,35,35)]);rot(c,'monocle',[(0,0),(.95,28),(1.5,20),(D,20)])
        elif not cat and name=='win_max':
            move(c,'hips',[(0,0,0),(.35,0,-25),(.75,0,115),(1.15,0,100),(D,0,100)]);move(c,'headphones',[(0,0,0),(.75,0,45),(1.15,0,0),(D,0,0)])
            c['bones']['hips']['scale']=[{'time':t,'x':v,'y':v} for t,v in eased([(0,1),(.35,1),(.75,.9),(D,.9)])]
        else:rot(c,'chest',[(0,0),(.3,-3),(.65,3),(.95,0),(D,0)])
        accessory(c,D,.8);finish(name,c)
        c=clip(2);expression(c,[(0,expressionName)])
        for side in joints:
            target=[250 if side=='front' else 800,490] if cat else [50 if side=='front' else 1000,650];hand(c,side,[(0,target),(2,target)])
        if cat and name=='win_max':
            rot(c,'hips',[(0,92),(.65,94),(1.3,90),(2,92)]);move(c,'hips',[(0,210,-90),(2,210,-90)]);c['bones']['hips']['scale']=[{'time':0,'x':.74,'y':.74},{'time':2,'x':.74,'y':.74}];move(c,'monocle',[(0,35,35),(2,35,35)]);rot(c,'monocle',[(0,20),(2,20)])
        elif not cat and name=='win_max':
            move(c,'hips',[(0,0,100),(2,0,100)]);c['bones']['hips']['scale']=[{'time':0,'x':.9,'y':.9},{'time':2,'x':.9,'y':.9}]
        rot(c,'head',[(0,0),(.5,1.2),(1,0),(1.5,-.8),(2,0)]);finish(name+'_loop',c)
    S['skeleton']['hash']=('purrfia' if cat else 'parrot')+'-motion-v2-20261026'
