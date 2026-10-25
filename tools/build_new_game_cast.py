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
import json,math,sys

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
    pw=world.get(parent,{'p':[0,0],'angle':0});q=spine(p);local=inv(q,pw['p'],pw['angle']);entry={'name':name,'x':round(local[0],4),'y':round(local[1],4),'rotation':round(norm(rotation-pw['angle']),4)}
    if parent:entry['parent']=parent
    bones.append(entry);world[name]={'p':q,'pixel':p,'angle':rotation,'parent':parent}
bone('root',None,GROUND);bone('hips','root',[510,1060]);bone('chest','hips',[510,780]);bone('neck','chest',[500,650]);bone('head','neck',[500,430]);bone('crest','head',[465,190]);bone('headphones','head',[500,370]);bone('eyepatch','head',[625,410]);bone('monocle','head',[625,445]);bone('chain','chest',[535,740]);bone('tie','chest',[480,750]);bone('rose','chest',[610,785]);bone('catnip','head',[400,510])
JOINTS={'front':[[340,790],[280,990],[420,1110]],'back':[[710,785],[790,940],[815,1070]]} if CAT else {'front':[[355,720],[300,900],[280,1060]],'back':[[690,730],[770,880],[800,1040]]}
for side,points in JOINTS.items():
    sh,el,wr=points;upper=angle(sh,el);fore=angle(el,wr);bone('upper_'+side,'chest',sh,upper);bone('fore_'+side,'upper_'+side,el,fore);bone('hand_'+side,'fore_'+side,wr,fore)
for i,p in enumerate([[730,1110],[780,1210],[815,1310],[835,1390]]):bone(f'tail_{i+1}','hips' if i==0 else f'tail_{i}',p)
bone('whiskers_left','head',[415,490]);bone('whiskers_right','head',[565,490]);bone('turntable_left','root',[310,1205]);bone('turntable_right','root',[720,1205])

def register(name,file,rect,bone_name,slot=None,visible=True):
    im=Image.open(file).convert('RGBA');bbox=im.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox();assert bbox,file
    cut=im.crop(bbox);x0,y0,x1,y1=rect;cut=ImageOps.contain(cut,(round(x1-x0),round(y1-y0)),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(W,H));canvas.alpha_composite(cut,(round((x0+x1-cut.width)/2),round((y0+y1-cut.height)/2)))
    images[name]=canvas;specs[name]={'bone':bone_name,'rect':rect,'slot':slot or name,'visible':visible};canvas.save(LAYERS/(name+'.png'))

if CAT:
    register('sofa_back',PARTS/'sofa_back.png',[30,430,1000,1460],'root')
    register('tail',PARTS/'tail.png',[680,870,1010,1450],'tail_1')
    register('body',PARTS/'body.png',[200,620,815,1430],'chest')
    register('arm_back',PARTS/'arm_back.png',[660,750,870,1070],'upper_back')
    register('paw_back',PARTS/'paw_back.png',[730,1010,930,1160],'hand_back')
    register('tie',PARTS/'tie.png',[440,705,520,845],'tie',visible=False)
    register('rose',PARTS/'rose.png',[585,725,650,795],'rose',visible=False)
    face_rect=[155,125,855,735]
    register('arm_front_upper',PARTS/'arm_front_upper.png',[150,765,365,1055],'upper_front')
    register('arm_front_fore',PARTS/'arm_front_fore.png',[200,930,435,1165],'fore_front')
    for n in ['paw_front_rest','paw_front_push','paw_front_stamp']:register(n,PARTS/(n+'.png'),[320,1045,535,1230],'hand_front','hand_front',n=='paw_front_rest')
    register('stamp_held',APP/'design/source/purrfia/mechanics/stamp_side.png',[325,940,485,1150],'hand_front',visible=False)
    for n in ['face_idle','face_monocle','face_smug','face_annoyed','face_shock','face_stamp','face_laugh','face_purr','face_blink','face_yawn']:register(n,FACES/(n+'.png'),face_rect,'head','face',n=='face_idle')
    register('whiskers_left',FACES/'whiskers_left.png',[230,460,445,570],'whiskers_left')
    register('whiskers_right',FACES/'whiskers_right.png',[570,470,790,580],'whiskers_right')
    register('monocle',PARTS/'monocle.png',[550,380,700,535],'monocle')
    register('monocle_chain',PARTS/'monocle_chain.png',[620,500,700,730],'monocle')
    register('catnip',PARTS/'catnip.png',[330,480,470,560],'catnip',visible=False)
    order=['sofa_back','tail','body','arm_back','paw_back','tie','rose','arm_front_upper','arm_front_fore','paw_front_rest','stamp_held','face_idle','whiskers_left','whiskers_right','monocle_chain','monocle','catnip']
else:
    register('tail',PARTS/'tail.png',[550,1020,875,1510],'tail_1')
    register('wing_back_upper',PARTS/'wing_back_upper.png',[665,710,900,995],'upper_back')
    register('wing_back_tip',PARTS/'wing_back_tip.png',[730,895,980,1180],'fore_back')
    register('body',PARTS/'body.png',[270,620,750,1135],'chest')
    register('chain',PARTS/'chain.png',[340,700,690,995],'chain')
    for n in ['face_idle','face_hype','face_smug','face_awkward','face_shock','face_party','face_blink','face_squawk']:register(n,FACES/(n+'.png'),[165,160,840,750],'head','face',n=='face_idle')
    register('crest',PARTS/'crest.png',[325,55,625,285],'crest')
    register('headphones',PARTS/'headphones.png',[120,120,900,725],'headphones')
    register('eyepatch',PARTS/'eyepatch.png',[520,335,735,545],'eyepatch')
    register('wing_front_upper',PARTS/'wing_front_upper.png',[155,700,425,1000],'upper_front')
    register('wing_front_mid',PARTS/'wing_front_mid.png',[125,855,405,1120],'fore_front')
    for n in ['wing_front_tip_scratch','wing_front_tip_point','wing_front_tip_up','wing_front_tip_hold']:register(n,PARTS/(n+'.png'),[110,990,400,1185],'hand_front','hand_front',n=='wing_front_tip_scratch')
    register('booth',PARTS/'booth.png',[65,1070,970,1510],'root')
    order=['tail','wing_back_upper','wing_back_tip','body','chain','headphones','face_idle','crest','eyepatch','wing_front_upper','wing_front_mid','wing_front_tip_scratch','booth']

# Preserve the delivered pose and all alternative attachments in a layered PSD.
composite=Image.new('RGBA',(W,H))
for n in order:
    if specs[n]['visible']:composite.alpha_composite(images[n])
composite.save(SRC/'assembled.png')
psd=PSDImage.new('RGBA',(W,H))
for n in order:
    layer=PixelLayer.frompil(images[n],psd,name=n);layer.visible=specs[n]['visible']
for n in images:
    if n not in order:layer=PixelLayer.frompil(images[n],psd,name=n);layer.visible=False
psd.save(SRC/('don_whiskers.psd' if CAT else 'squawk.psd'))
(LAYERS/'layers.json').write_text(json.dumps({'canvas':[W,H],'ground':GROUND,'joints':{k:v['pixel'] for k,v in world.items()},'layers':specs,'order':order},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

attachments={};crops={};indices={b['name']:i for i,b in enumerate(bones)}
for n,im in images.items():
    bbox=im.getchannel('A').getbbox();x0,y0,x1,y1=bbox;w,h=x1-x0,y1-y0
    b=specs[n]['bone'];verts=[];uvs=[];tris=[]
    nx,ny=(8,12) if n=='tail' else (2,2);points=[]
    for row in range(ny+1):
        for col in range(nx+1):
            p=[x0+w*col/nx,y0+h*row/ny];uvs.extend([col/nx,row/ny]);weights=[(b,1)]
            if n=='tail':
                t=max(0,min(2.999,(p[1]-1110)/100));k=int(t);f=t-k;weights=[(f'tail_{k+1}',1-f),(f'tail_{min(4,k+2)}',f)]
            weights=[(bone_name,value) for bone_name,value in weights if value>1e-5];verts.append(len(weights))
            for bone_name,value in weights:
                local=inv(spine(p),world[bone_name]['p'],world[bone_name]['angle']);verts.extend([indices[bone_name],round(local[0],4),round(local[1],4),round(value,6)])
    for row in range(ny):
        for col in range(nx):a=row*(nx+1)+col;bb=a+1;c=a+nx+2;d=a+nx+1;tris.extend([a,bb,c,a,c,d])
    attachments[n]={'type':'mesh','path':n,'width':w,'height':h,'uvs':uvs,'triangles':tris,'vertices':verts,'hull':0}
    cut=im.crop(bbox);cut.save(EDITOR/'images'/(n+'.png'));cut.thumbnail((round(w*.75),round(h*.75)),Image.Resampling.LANCZOS);crops[n]=cut
slots=[];skin={}
for n in order:
    slot=specs[n]['slot'];slots.append({'name':slot,'bone':specs[n]['bone'],**({'attachment':n} if specs[n]['visible'] else {})})
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
        dx,dy=p[0]-sh[0],sh[1]-p[1];dist=max(1,min(math.hypot(dx,dy),L1+L2-.1));theta=math.atan2(dy,dx);phi=math.acos(max(-1,min(1,(L1*L1+dist*dist-L2*L2)/(2*L1*dist))));a=theta+(phi if side=='front' else -phi);b=math.atan2(dy-L1*math.sin(a),dx-L1*math.cos(a));u=norm(math.degrees(a)-a0);f=norm(math.degrees(b)-b0-u);upper.append((t,u));fore.append((t,f))
    rotate(c,'upper_'+side,upper);rotate(c,'fore_'+side,fore)
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
(OUT/'character.json').write_text(rig,encoding='utf-8');(OUT/'character.atlas').write_text(atlas,encoding='utf-8');(EDITOR/'character.json').write_text(rig,encoding='utf-8')
(APP/'src/game/characterRigData.json').write_text(rig,encoding='utf-8');(APP/'src/game/characterRigAtlas.txt').write_text(atlas,encoding='utf-8');(APP/'src/game/characterRigPages.json').write_text(json.dumps([p['name'] for p in pages]),encoding='utf-8')
report={'character':NAME,'spine':'4.3.13','bones':len(bones),'layers':len(images),'clips':list(S['animations']),'pages':len(pages),'customTopology':'seated Persian cat' if CAT else 'three-quarter macaw DJ','sourcePSD':str(SRC/('don_whiskers.psd' if CAT else 'squawk.psd'))}
(SRC/'rig-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,ensure_ascii=False))
