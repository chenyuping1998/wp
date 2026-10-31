"""Register painted character layers and author original Spine 4.3 performances.

The seated cat and three-quarter macaw use custom topologies, never the standing
mascot or boxing template. Full-canvas PNG layers, editable PSD and editor JSON
are preserved beside a packed runtime atlas.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
from psd_tools import PSDImage
from psd_tools.api.layers import PixelLayer
import numpy as np
import json,math,sys,hashlib,re,base64
from new_game_skin_v3 import add_skin_bones
from new_game_articulation_v4 import add_articulation_bones,grid_for,skin_weights

CAT=sys.argv[1]=='Purrfia';SLUG='purrfia' if CAT else 'parrot';NAME='Don Whiskers' if CAT else 'Squawk'
APP=Path('E:/stake/wp/apps')/('Purrfia喵菲亞家族' if CAT else 'ParrotRadio鸚鵡電台')
SRC=APP/'design/source'/SLUG/'cast';PARTS=SRC/'parts';FACES=SRC/'faces';LAYERS=SRC/'layers';OUT=APP/'static/assets/spines'/('donWhiskers43' if CAT else 'squawk43');EDITOR=SRC/'spine43_editor'
for d in [LAYERS,OUT,EDITOR/'images']:d.mkdir(parents=True,exist_ok=True)
W,H=1024,1536;GROUND=[512,1450];images={};specs={};world={};bones=[]
def spine(p):return [p[0]-GROUND[0],GROUND[1]-p[1]]
def inv(p,o,angle):
    x,y=p[0]-o[0],p[1]-o[1];c=math.cos(math.radians(angle));s=math.sin(math.radians(angle));return [c*x+s*y,-s*x+c*y]
def norm(a):return (a+180)%360-180
def angle(a,b):return math.degrees(math.atan2(a[1]-b[1],b[0]-a[0]))
def bone(name,parent,p,rotation=0):
    if CAT and name in {'crest','headphones','eyepatch','monocle','catnip','whiskers_left','whiskers_right','ear_left','ear_right','cheek_left','cheek_right','muzzle','lens_chain_mid','lens_chain_end'}:p=[p[0],p[1]+32]
    pw=world.get(parent,{'p':[0,0],'angle':0});q=spine(p);local=inv(q,pw['p'],pw['angle']);entry={'name':name,'x':round(local[0],4),'y':round(local[1],4),'rotation':round(norm(rotation-pw['angle']),4)}
    if parent:entry['parent']=parent
    bones.append(entry);world[name]={'p':q,'pixel':p,'angle':rotation,'parent':parent}
bone('root',None,GROUND);bone('hips','root',[510,1060]);bone('spine_low','hips',[510,1020]);bone('spine_mid','spine_low',[510,900]);bone('chest','spine_mid',[510,780]);bone('neck','chest',[500,740] if CAT else [500,650]);bone('head','neck',[500,735] if CAT else [500,430]);bone('crest','head',[465,190]);bone('headphones','head',[500,370]);bone('eyepatch','head',[625,410]);bone('monocle','head',[625,445]);bone('chain','chest',[535,740]);bone('tie','chest',[480,750]);bone('rose','chest',[610,785]);bone('catnip','head',[400,510])
if CAT:bone('collar_contact','neck',[500,740])
bone('belly','hips',[510,975]);bone('ribs','chest',[510,810])
JOINTS={'front':[[340,790],[280,990],[420,1110]],'back':[[745,790],[790,925],[825,1040]]} if CAT else {'front':[[355,720],[350,910],[280,1060]],'back':[[690,730],[770,880],[800,1040]]}
for side,points in JOINTS.items():
    sh,el,wr=points;upper=angle(sh,el);fore=angle(el,wr);bone('upper_'+side,'chest',sh,upper);bone('fore_'+side,'upper_'+side,el,fore);bone('hand_'+side,'fore_'+side,wr,fore)
    if CAT:bone('shoulder_contact_'+side,'chest',sh)
for i,p in enumerate([[730,1110],[780,1210],[815,1310],[835,1390]]):bone(f'tail_{i+1}','hips' if i==0 else f'tail_{i}',p)
bone('whiskers_left','head',[415,490]);bone('whiskers_right','head',[565,490]);bone('turntable_left','root',[310,1205]);bone('turntable_right','root',[720,1205])
add_skin_bones(bone,CAT)
add_articulation_bones(bone,JOINTS,angle,CAT)
if not CAT:bone('microphone_grip','fore_back',[805,1100],world['fore_back']['angle'])
for side,(sh,el,wr) in JOINTS.items():
    for name,length in [('upper_'+side,math.dist(sh,el)),('fore_'+side,math.dist(el,wr)),('hand_'+side,100 if CAT else 115)]:
        next(b for b in bones if b['name']==name)['length']=round(length,4)

def register(name,file,rect,bone_name,slot=None,visible=True,anchors=None):
    im=Image.open(file).convert('RGBA');bbox=im.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox();assert bbox,file
    cut=im.crop(bbox);x0,y0,x1,y1=rect;cut=ImageOps.contain(cut,(round(x1-x0),round(y1-y0)),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(W,H))
    if anchors:
        source,target=anchors;matrix=np.linalg.solve(np.c_[np.array(target),np.ones(3)],np.array(source)).T
        canvas=im.transform((W,H),Image.Transform.AFFINE,tuple(matrix.flat),Image.Resampling.BICUBIC)
    else:canvas.alpha_composite(cut,(round((x0+x1-cut.width)/2),round(y1-cut.height if slot=='face' else (y0+y1-cut.height)/2)))
    images[name]=canvas;specs[name]={'bone':bone_name,'rect':rect,'slot':slot or name,'visible':visible};canvas.save(LAYERS/(name+'.png'))

def reanchor(name,source,target):
    if len(source)==2:
        a0,a1=np.array(source,dtype=float);b0,b1=np.array(target,dtype=float);sx,sy=a1-a0;dx,dy=b1-b0;den=dx*dx+dy*dy;a=(sx*dx+sy*dy)/den;b=(sy*dx-sx*dy)/den
        matrix=np.array([[a,-b,a0[0]-a*b0[0]+b*b0[1]],[b,a,a0[1]-b*b0[0]-a*b0[1]]])
    else:matrix=np.linalg.solve(np.c_[np.array(target),np.ones(3)],np.array(source)).T
    images[name]=images[name].transform((W,H),Image.Transform.AFFINE,tuple(matrix.flat),Image.Resampling.BICUBIC)
    images[name].save(LAYERS/(name+'.png'));specs[name]['jointRegistration']={'source':source,'target':target}

if CAT:
    register('sofa_back',PARTS/'sofa_back.png',[30,430,1000,1460],'root')
    register('tail',PARTS/'tail.png',[680,870,1010,1450],'tail_1')
    register('body',PARTS/'body.png',[200,620,815,1430],'chest')
    register('arm_back',PARTS/'arm_back.png',[660,750,870,1070],'upper_back')
    reanchor('arm_back',[[740,805],[800,1035]],[JOINTS['back'][0],JOINTS['back'][2]])
    # The old wrist anchor sat on the lower rim of the empty sleeve. Register
    # the opening's centre instead, so the palm actually enters the cuff.
    reanchor('arm_back',[[745,790],[795,1010]],[JOINTS['back'][0],JOINTS['back'][2]])
    register('paw_back',PARTS/'paw_back.png',[730,1010,930,1160],'hand_back')
    reanchor('paw_back',[[0,0],[100,0]],[[-28,-18],[72,-18]])
    register('tie',PARTS/'tie.png',[440,705,520,845],'tie',visible=False)
    register('rose',PARTS/'rose.png',[585,725,650,795],'rose',visible=False)
    face_rect=[155,125,855,735]
    register('arm_front_upper',PARTS/'arm_front_upper.png',[150,765,365,1055],'upper_front')
    register('arm_front_fore',PARTS/'arm_front_fore.png',[200,930,435,1165],'fore_front')
    register('arm_front_full',PARTS/'arm_front_full_v3.png',[165,755,470,1150],'upper_front',anchors=([[355,475],[360,900],[657,1123]],JOINTS['front']))
    for n in ['paw_front_rest','paw_front_push','paw_front_stamp']:register(n,PARTS/(n+'.png'),[320,1045,535,1230],'hand_front','hand_front',n=='paw_front_rest')
    register('stamp_held',APP/'design/source/purrfia/mechanics/stamp_side.png',[325,940,485,1150],'hand_front',visible=False)
    reanchor('stamp_held',[[450,1007],[367,1072]],[[435,1172],[375,1240]])
    # Reuse the clean neutral face for the lens adjustment: the alternate sheet
    # contains a vertical lighting fragment outside the cheek silhouette.
    for n in ['face_idle','face_monocle','face_smug','face_annoyed','face_shock','face_stamp','face_laugh','face_purr','face_blink','face_yawn']:
        file='face_idle' if n=='face_monocle' else n+'_v6' if n in ['face_smug','face_laugh','face_purr','face_yawn'] and (FACES/(n+'_v6.png')).exists() else n
        register(n,FACES/(file+'.png'),face_rect,'head','face',n=='face_idle')
    register('whiskers_left',FACES/'whiskers_left.png',[230,460,445,570],'whiskers_left',visible=False)
    register('whiskers_right',FACES/'whiskers_right.png',[570,470,790,580],'whiskers_right',visible=False)
    register('monocle',PARTS/'monocle.png',[550,380,700,535],'monocle')
    register('monocle_chain',PARTS/'monocle_chain.png',[620,500,700,730],'monocle')
    register('catnip',PARTS/'catnip.png',[330,480,470,560],'catnip',visible=False)
    for n in images:
        if n.startswith(('face_','whiskers_')) or n in ['monocle','monocle_chain','catnip']:
            reanchor(n,[[0,0],[100,0]],[[0,32],[100,32]])
    # Reuse the painted jacket as native mesh shoulder facings. The sleeve
    # root sits under the facing, while the elbow and cuff remain in front.
    # No new paint or alpha retouch: each facing samples the existing body UVs.
    facings={}
    for side,(x0,y0,x1,y1) in [('front',[310,730,400,890]),('back',[650,730,745,890])]:
        facings[side]=[]
        # Native nonoverlapping strips feather the facing over 24 source px.
        # This avoids a rectangular cut line without altering the painted art.
        bands=[]
        for i in range(8):
            a=i*3;b=a+3;t=(i+.5)/8;opacity=t*t*(3-2*t)
            bands += [(r,opacity) for r in [[x0+a,y0+a,x1-a,y0+b],[x0+a,y1-b,x1-a,y1-a],[x0+a,y0+b,x0+b,y1-b],[x1-b,y0+b,x1-a,y1-b]]]
        bands.append(([x0+24,y0+24,x1-24,y1-24],1))
        for i,(rect,opacity) in enumerate(bands):
            cut=images['body'].crop(tuple(rect))
            if not cut.getchannel('A').getbbox():continue
            name='shoulder_facing_'+side+'_'+str(i);facing=Image.new('RGBA',(W,H));facing.paste(cut,tuple(rect[:2]));images[name]=facing
            facing.save(LAYERS/(name+'.png'))
            specs[name]={'bone':'chest','rect':rect,'slot':name,'visible':True,'weightSource':'body','opacity':opacity};facings[side].append(name)
    order=['sofa_back','tail','body','arm_back',*facings['back'],'paw_back','tie','rose','arm_front_full',*facings['front'],'face_idle','whiskers_left','whiskers_right','monocle_chain','monocle','stamp_held','paw_front_rest','catnip']
else:
    register('tail',PARTS/'tail.png',[550,1020,875,1510],'tail_1')
    register('wing_back_upper',PARTS/'wing_back_upper.png',[665,710,900,995],'upper_back')
    reanchor('wing_back_upper',[[735,775],[836,925]],JOINTS['back'][:2])
    register('wing_back_tip',PARTS/'wing_back_tip.png',[730,895,980,1180],'fore_back')
    reanchor('wing_back_tip',[[754,947],[882,1087]],JOINTS['back'][1:])
    register('body',PARTS/'body.png',[270,620,750,1135],'chest')
    register('chain',PARTS/'chain.png',[340,700,690,995],'chain')
    for n in ['face_idle','face_hype','face_smug','face_awkward','face_shock','face_party','face_blink','face_squawk']:register(n,FACES/(n+'.png'),[165,160,840,750],'head','face',n=='face_idle')
    register('crest',PARTS/'crest.png',[325,55,625,285],'crest')
    register('headphones',PARTS/'headphones.png',[120,120,900,725],'headphones')
    register('eyepatch',PARTS/'eyepatch.png',[520,335,735,545],'eyepatch')
    register('wing_front_upper',PARTS/'wing_front_upper.png',[155,700,425,1000],'upper_front')
    reanchor('wing_front_upper',[[294,784],[286,910],[394,784]],[JOINTS['front'][0],JOINTS['front'][1],[455,720]])
    register('wing_front_mid',PARTS/'wing_front_mid.png',[125,855,405,1120],'fore_front')
    reanchor('wing_front_mid',[[170,921],[284,1028]],JOINTS['front'][1:])
    for n in ['wing_front_tip_scratch','wing_front_tip_point','wing_front_tip_up','wing_front_tip_hold']:register(n,PARTS/(n+'.png'),[110,990,400,1185],'hand_front','hand_front',n=='wing_front_tip_scratch')
    reanchor('wing_front_tip_scratch',[[166,1020],[267,1112]],[JOINTS['front'][2],[265,1175]])
    register('booth',PARTS/'booth.png',[65,1070,970,1510],'root')
    register('record_held',APP/'design/source/parrot/mechanics/platinum_disc.png',[170,1020,365,1215],'hand_front',visible=False)
    register('microphone_held',APP/'design/source/parrot/symbols/parts/s_mic.png',[740,890,880,1130],'microphone_grip',visible=False)
    reanchor('microphone_held',[[810,1080],[810,930]],[[805,1100],[805,950]])
    order=['tail','wing_back_upper','body','chain','headphones','face_idle','crest','eyepatch','microphone_held','wing_back_tip','wing_front_upper','booth','wing_front_mid','record_held','wing_front_tip_scratch']

# Preserve the delivered pose and all alternative attachments in a layered PSD.
composite=Image.new('RGBA',(W,H))
for n in order:
    if specs[n]['visible']:
        layer=images[n].copy();opacity=specs[n].get('opacity',1)
        if opacity<1:layer.putalpha(layer.getchannel('A').point(lambda a:round(a*opacity)))
        composite.alpha_composite(layer)
composite.save(SRC/'assembled.png')
psd=PSDImage.new('RGBA',(W,H))
for n in order:
    layer=PixelLayer.frompil(images[n],psd,name=n);layer.visible=specs[n]['visible'];layer.opacity=round(255*specs[n].get('opacity',1))
for n in images:
    if n not in order:layer=PixelLayer.frompil(images[n],psd,name=n);layer.visible=False
psd.save(SRC/('don_whiskers.psd' if CAT else 'squawk.psd'))
(LAYERS/'layers.json').write_text(json.dumps({'canvas':[W,H],'ground':GROUND,'joints':{k:v['pixel'] for k,v in world.items()},'layers':specs,'order':order},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

attachments={};crops={};coverage={};hit_masks={};indices={b['name']:i for i,b in enumerate(bones)}
for n,im in images.items():
    bbox=im.getchannel('A').getbbox();x0,y0,x1,y1=bbox;w,h=x1-x0,y1-y0
    b=specs[n]['bone'];verts=[];uvs=[];tris=[]
    nx,ny=(2,2) if n.startswith('shoulder_facing_') else grid_for(n);points=[]
    for row in range(ny+1):
        for col in range(nx+1):
            rect=specs[n].get('meshRect',[x0,y0,x1,y1]);p=[rect[0]+(rect[2]-rect[0])*col/nx,rect[1]+(rect[3]-rect[1])*row/ny];points.append(p);uvs.extend([(p[0]-x0)/w,(p[1]-y0)/h]);weights=[(b,1)]
            if n=='tail':
                t=max(0,min(2.999,(p[1]-1110)/100));k=int(t);f=t-k;weights=[(f'tail_{k+1}',1-f),(f'tail_{min(4,k+2)}',f)]
            elif n=='body':
                # The seated legs and lower torso stay anchored. Only the
                # abdomen/rib cage receive the independent respiratory track.
                chest=max(0,min(1,(1060-p[1])/360))
                belly=.72*math.exp(-((p[0]-510)/240)**2-((p[1]-970)/175)**2)
                ribs=.50*math.exp(-((p[0]-510)/250)**2-((p[1]-805)/140)**2)
                total=belly+ribs
                if total>.88:belly*=.88/total;ribs*=.88/total
                weights=[('hips',(1-belly-ribs)*(1-chest)),('chest',(1-belly-ribs)*chest),('belly',belly),('ribs',ribs)]
            weights=skin_weights(specs[n].get('weightSource',n),p,b,CAT,JOINTS)
            weights=[(bone_name,value) for bone_name,value in weights if value>1e-5];verts.append(len(weights))
            for bone_name,value in weights:
                local=inv(spine(p),world[bone_name]['p'],world[bone_name]['angle']);verts.extend([indices[bone_name],round(local[0],4),round(local[1],4),round(value,6)])
    for row in range(ny):
        for col in range(nx):a=row*(nx+1)+col;bb=a+1;c=a+nx+2;d=a+nx+1;tris.extend([a,bb,c,a,c,d])
    attachments[n]={'type':'mesh','path':n,'width':w,'height':h,'uvs':uvs,'triangles':tris,'vertices':verts,'hull':0}
    alpha=im.getchannel('A');opaque=[]
    for t in range(0,len(tris),3):
        tri=[points[i] for i in tris[t:t+3]]
        for factors in [(1/3,1/3,1/3),(.7,.15,.15),(.15,.7,.15),(.15,.15,.7)]:
            x,y=[sum(point[k]*f for point,f in zip(tri,factors)) for k in [0,1]]
            if alpha.getpixel((max(0,min(W-1,int(x))),max(0,min(H-1,int(y)))))>160:opaque.append(t//3);break
    coverage[n]=opaque
    hit=np.asarray(alpha.crop(bbox).resize((96,96),Image.Resampling.BILINEAR))>64
    hit_masks[n]=base64.b64encode(np.packbits(hit.reshape(-1)).tobytes()).decode()
    cut=im.crop(bbox);cut.save(EDITOR/'images'/(n+'.png'));cut.thumbnail((round(w*.75),round(h*.75)),Image.Resampling.LANCZOS);crops[n]=cut
slots=[];skin={}
for n in order:
    slot=specs[n]['slot'];slots.append({'name':slot,'bone':specs[n]['bone'],**({'attachment':n} if specs[n]['visible'] else {}),**({'color':'ffffff'+format(round(255*specs[n]['opacity']),'02x')} if 'opacity' in specs[n] else {})})
    skin[slot]={name:attachment for name,attachment in attachments.items() if specs[name]['slot']==slot}
S={'skeleton':{'hash':SLUG+'-original-20261025','spine':'4.3.13','x':-512,'y':-86,'width':1024,'height':1536,'fps':60,'images':'./images/'},'bones':bones,'slots':slots,'constraints':[],'skins':[{'name':'default','attachments':skin}],'events':{'release':{},'contact':{}},'animations':{}}
def clip(duration):return {'bones':{},'slots':{},'_duration':duration}
def rotate(c,b,keys):c['bones'].setdefault(b,{})['rotate']=[{'time':t,'value':v} for t,v in keys]
def translate(c,b,keys):c['bones'].setdefault(b,{})['translate']=[{'time':t,'x':x,'y':y} for t,x,y in keys]
def attach(c,slot,keys):c['slots'][slot]={'attachment':[{'time':t,'name':n} for t,n in keys]}
def face(c,name,end=True):attach(c,'face',[(0,name)]+([(c['_duration']-.05,'face_idle')] if end else []))
def finish(name,c):
    D=c.pop('_duration');rotate(c,'root',[(0,0),(D,0)]);S['animations'][name]=c
def arm(c,side,keys):
    sh,el,wr=JOINTS[side];L1=math.dist(sh,el);L2=math.dist(el,wr);a0=angle(sh,el);b0=angle(el,wr);upper=[];fore=[]
    for t,p in keys:
        dx,dy=p[0]-sh[0],sh[1]-p[1];dist=max(abs(L1-L2)+.1,min(math.hypot(dx,dy),L1+L2-.0001));theta=math.atan2(dy,dx);phi=math.acos(max(-1,min(1,(L1*L1+dist*dist-L2*L2)/(2*L1*dist))));a=theta+(-phi if side=='front' else phi);b=math.atan2(dy-L1*math.sin(a),dx-L1*math.cos(a));u=norm(math.degrees(a)-a0);f=norm(math.degrees(b)-b0-u)
        if upper:
            while u-upper[-1][1]>180:u-=360
            while u-upper[-1][1]<-180:u+=360
            while f-fore[-1][1]>180:f-=360
            while f-fore[-1][1]<-180:f+=360
        upper.append((t,u));fore.append((t,f))
    rotate(c,'upper_'+side,upper);rotate(c,'fore_'+side,fore)
    rotate(c,'hand_'+side,[(t,max(-65,min(65,-.40*(u+f)))) for (t,u),(_,f) in zip(upper,fore)])
rest=JOINTS['front'][2]
c=clip(8);attach(c,'face',[(0,'face_idle'),(5.60,'face_blink'),(5.76,'face_idle')]);rotate(c,'tail_4',[(0,0),(7,0),(7.35,2),(7.65,-.6),(8,0)]);finish('idle',c)
S['animations']['fg_idle']=json.loads(json.dumps(S['animations']['idle']))
if CAT:
    for name,D in [('push_monocle',1.1),('push_monocle_short',.5)]:
        c=clip(D);face(c,'face_monocle');arm(c,'front',[(0,rest),(.32*D/1.1,[600,490]),(.60*D/1.1,[605,475]),(D,rest)]);translate(c,'monocle',[(0,0,0),(.48*D/1.1,0,0),(.53*D/1.1,0,18),(.75*D/1.1,0,0),(D,0,0)]);rotate(c,'monocle',[(0,0),(.55*D/1.1,-3),(.75*D/1.1,1),(D,0)]);c['events']=[{'time':.5*D/1.1,'name':'contact'},{'time':.55*D/1.1,'name':'release'}];finish(name,c)
    for name,D in [('stamp',.9),('stamp_short',.45),('claim_turf',1.1),('catch_stamp',.4),('lick_paw',.4)]:
        c=clip(D);face(c,'face_stamp' if name!='lick_paw' else 'face_smug');attach(c,'hand_front',[(0,'paw_front_stamp'),(D-.03,'paw_front_rest')]);attach(c,'stamp_held',[(0,'stamp_held'),(D-.03,None)]);arm(c,'front',[(0,rest),(.35*D,[240,570]),(.6*D,[160,850]),(.75*D,[190,820]),(D,rest)]);rotate(c,'chest',[(0,0),(.5*D,4),(.7*D,4),(D,0)]);finish(name,c)
    actions=[('react_small',.9,'face_smug'),('react_good',1.4,'face_smug'),('react_chain',1,'face_stamp'),('react_none',1.2,'face_annoyed'),('idle_bored',2.4,'face_yawn'),('fg_trigger',2.2,'face_shock'),('fg_end',1.6,'face_smug'),('win_big',2.6,'face_laugh'),('win_max',3.2,'face_purr')]
else:
    actions=[('react_small',.8,'face_smug'),('react_good',1.2,'face_party'),('idle_mimic',1.5,'face_squawk'),('idle_bored',2,'face_idle'),('encore_build',1,'face_hype'),('encore_call',.8,'face_squawk'),('encore_success',.8,'face_smug'),('encore_fail',1.2,'face_awkward'),('turn_knob',.4,'face_hype'),('fg_trigger',2.2,'face_shock'),('fg_end',1.6,'face_smug'),('win_big',2.6,'face_party'),('win_max',3.2,'face_party'),('record_pull',1,'face_hype'),('record_hit',.8,'face_party'),('record_miss',.8,'face_awkward')]
for name,D,expression in actions:
    c=clip(D);face(c,expression);rotate(c,'head',[(0,0),(.25*D,-4 if 'fail' in name or 'none' in name else 3),(.65*D,-4 if 'fail' in name or 'none' in name else 3),(D,0)])
    rotate(c,'tail_3',[(0,0),(.35*D,5),(.60*D,-2),(D,0)]);rotate(c,'chain',[(0,0),(.35*D,4),(.65*D,-1),(D,0)])
    if name.startswith('win') or name=='fg_trigger':
        for side in JOINTS:arm(c,side,[(0,JOINTS[side][2]),(.4*D,[280 if side=='front' else 760,410]),(.8*D,[280 if side=='front' else 760,410]),(D,JOINTS[side][2])])
        translate(c,'chest',[(0,0,0),(.18*D,0,-12),(.4*D,0,18),(.65*D,0,4),(D,0,0)])
    elif not CAT:
        if name=='encore_build':arm(c,'front',[(0,rest),(.25,[260,1110]),(.45,[340,1110]),(.65,[230,1110]),(.85,[340,1110]),(D,rest)])
        elif name in ['encore_call','encore_success','record_pull','turn_knob','react_small']:
            target=[250,390] if name in ['encore_call','record_pull'] else [130,780];arm(c,'front',[(0,rest),(.35*D,target),(.8*D,target),(D,rest)])
            attach(c,'hand_front',[(0,'wing_front_tip_hold' if name=='record_pull' else 'wing_front_tip_up' if name=='encore_call' else 'wing_front_tip_point'),(D-.03,'wing_front_tip_scratch')])
        elif name=='fg_end':translate(c,'headphones',[(0,0,0),(.5*D,0,-180),(D,0,0)]);rotate(c,'chest',[(0,0),(.5*D,7),(.7*D,7),(D,0)])
    if CAT and name=='win_max':rotate(c,'hips',[(0,0),(.6,-12),(1.2,72),(1.7,100),(2.4,84),(D,92)]);translate(c,'hips',[(0,0,0),(.9,-50,-120),(1.5,-100,-200),(D,-100,-200)])
    finish(name,c)
for name in ['win_big','win_max']:
    c=clip(2);face(c,'face_purr' if CAT and name=='win_max' else 'face_laugh' if CAT else 'face_party',False);rotate(c,'head',[(0,0),(.12,1),(.24,0),(.38,1),(.5,0),(2,0)])
    if CAT and name=='win_max':rotate(c,'hips',[(0,92),(.6,95),(1.2,89),(2,92)]);translate(c,'hips',[(0,-100,-200),(2,-100,-200)])
    finish(name+'_loop',c)

# Authored v2 performances replace the generic foundation keys.
from new_game_motion_v2 import author_motion_v2
author_motion_v2(S,CAT,JOINTS,arm,rotate,translate,attach,clip,finish)
from new_game_motion_v3 import refine_motion_v3
refine_motion_v3(S,CAT)
from new_game_motion_v4 import author_motion_v4
author_motion_v4(S,CAT,JOINTS)

# Shelf-pack with two-pixel extrusion to avoid dark alpha fringes.
pages=[];todo=sorted(crops,key=lambda n:-crops[n].height)
while todo:
    placed=[];remaining=[];x=y=row=0
    for n in todo:
        im=crops[n];ww,hh=im.width+4,im.height+4
        if x+ww>2048:x=0;y+=row;row=0
        if y+hh>2048:remaining.append(n);continue
        placed.append((n,x+2,y+2));x+=ww;row=max(row,hh)
    assert placed
    height=2**math.ceil(math.log2(max(py+crops[n].height+2 for n,px,py in placed)));file='character.png' if not pages else f'character_{len(pages)+1}.png';canvas=Image.new('RGBA',(2048,height))
    for n,px,py in placed:
        im=crops[n];canvas.paste(im.resize((im.width+4,im.height+4),Image.Resampling.NEAREST),(px-2,py-2));canvas.paste(im,(px,py))
    canvas.save(OUT/file);pages.append({'name':file,'width':2048,'height':height,'placements':placed});todo=remaining
lines=[]
for page in pages:
    if lines:lines.append('')
    lines += [page['name'],f"size:{page['width']},{page['height']}",'format:RGBA8888','filter:Linear,Linear','repeat:none','pma:false']
    for n,x,y in page['placements']:im=crops[n];lines += [n,f'bounds:{x},{y},{im.width},{im.height}']
atlas='\n'.join(lines)+'\n';rig=json.dumps(S,separators=(',',':'))
(APP/'design/character-anatomy-coverage.json').write_text(json.dumps({'rigSha256':hashlib.sha256(rig.encode()).hexdigest(),'opaqueTriangles':coverage,'hitMasks96':hit_masks},separators=(',',':')),encoding='utf-8')
(OUT/'character.json').write_text(rig,encoding='utf-8');(OUT/'character.atlas').write_text(atlas,encoding='utf-8');(EDITOR/'character.json').write_text(rig,encoding='utf-8')
(APP/'src/game/characterRigData.json').write_text(rig,encoding='utf-8');(APP/'src/game/characterRigAtlas.txt').write_text(atlas,encoding='utf-8');(APP/'src/game/characterRigPages.json').write_text(json.dumps([p['name'] for p in pages]),encoding='utf-8')
# Packed regions move when artwork changes: version the pages with the rig.
fingerprint=hashlib.sha256(rig.encode()).hexdigest()[:12];registry=APP/'src/game/assets.ts';text=registry.read_text(encoding='utf-8')
text=re.sub(r"(castAtlas\d+:.*?\.href)(?:\+'\?v=[^']*')?",lambda m:m[1]+"+'?v="+fingerprint+"'",text)
registry.write_text(text,encoding='utf-8')
report={'character':NAME,'spine':'4.3.13','skinVersion':6 if CAT else 4,'bones':len(bones),'layers':len(images),'clips':list(S['animations']),'pages':len(pages),'softSkin':['torso','face','ears','limbs','chain','crest','tail'],'articulation':'native jacket shoulder facings over sleeve roots, registered cuffs, collar-pinned lower ruff and neckline pivot' if CAT else 'shared chain weights, half-angle elbow/wrist volume bones, registered feather roots, authored joint poses','customTopology':'seated Persian cat' if CAT else 'three-quarter macaw DJ','sourcePSD':str(SRC/('don_whiskers.psd' if CAT else 'squawk.psd'))}
(SRC/'rig-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,ensure_ascii=False))
