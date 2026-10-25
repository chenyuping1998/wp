"""Preserve generated originals and split/normalize explicitly requested sprite sheets.

All creative drawing and image edits are made with image_gen. This tool only
registers delivered cells, exports the brief's canvases and records provenance.
"""
from pathlib import Path
import hashlib,json,shutil,sys
from PIL import Image,ImageOps,ImageDraw,ImageFont,ImageFilter
import numpy as np

ROOT=Path('E:/stake/wp/apps')
JOBS=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
L=Image.Resampling.LANCZOS

def save_json(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def normalize(image,size,fill=.8):
    image=image.convert('RGBA');bbox=image.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
    assert bbox,'Empty art cell'
    crop=image.crop(bbox);crop.thumbnail((round(size[0]*fill),round(size[1]*fill)),L)
    out=Image.new('RGBA',size);out.alpha_composite(crop,((size[0]-crop.width)//2,(size[1]-crop.height)//2));return out
def split(im,columns,rows):
    return [im.crop((round(c*im.width/columns),round(r*im.height/rows),round((c+1)*im.width/columns),round((r+1)*im.height/rows))) for r in range(rows) for c in range(columns)]

def components(im,centers):
    """Register disconnected painted sprites by their measured sheet locations.

    Run-length components retain complete cards and long banners even when the
    generative layout uses unequal row heights. Only normalization follows.
    """
    alpha=np.asarray(im.getchannel('A'));parents=[];runs=[];previous=[]
    def find(i):
        while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
        return i
    for y,row in enumerate(alpha>80):
        edges=np.diff(np.r_[False,row,False].astype('int8'));starts=np.flatnonzero(edges==1);ends=np.flatnonzero(edges==-1)
        current=[]
        for x0,x1 in zip(starts,ends):
            touching=[label for a,b,label in previous if b>=x0 and a<=x1]
            if touching:
                label=find(touching[0])
                for other in touching:parents[find(other)]=label
            else:label=len(parents);parents.append(label)
            runs.append((y,int(x0),int(x1),label));current.append((int(x0),int(x1),label))
        previous=current
    groups={}
    for y,a,b,label in runs:groups.setdefault(find(label),[]).append((y,a,b))
    masks=[Image.new('L',im.size) for _ in centers];draws=[ImageDraw.Draw(mask) for mask in masks]
    for group in groups.values():
        count=sum(b-a for y,a,b in group)
        if count<7:continue
        cx=sum((a+b)/2*(b-a) for y,a,b in group)/count/im.width;cy=sum(y*(b-a) for y,a,b in group)/count/im.height
        index=min(range(len(centers)),key=lambda i:(cx-centers[i][0])**2+(cy-centers[i][1])**2)
        for y,a,b in group:draws[index].line((a,y,b-1,y),fill=255)
    out=[]
    for mask in masks:
        mask=mask.filter(ImageFilter.MaxFilter(7));bbox=mask.getbbox();assert bbox,'Missing registered sprite'
        cut=im.copy();cut.putalpha(Image.fromarray((alpha.astype('uint16')*np.asarray(mask)/255).astype('uint8')));out.append(cut.crop(bbox))
    return out

for job in JOBS:
    if not job.get('output'):continue
    key=job['key'];cat=key.startswith('purrfia');slug='purrfia' if cat else 'parrot';folder='Purrfia喵菲亞家族' if cat else 'ParrotRadio鸚鵡電台'
    app=ROOT/folder;source=app/'design/source'/slug;runtime=app/'static/assets/sprites';brand=runtime/(slug+'Brand')
    for d in [source/'originals',source/'_sheets',brand]:d.mkdir(parents=True,exist_ok=True)
    original=source/'originals'/(key+'.png');incoming=Path(job['output'])
    if not original.exists():shutil.copy2(incoming,original)
    else:assert hashlib.sha256(original.read_bytes()).digest()==hashlib.sha256(incoming.read_bytes()).digest(),f'Original collision {key}'
    (source/'originals'/(key+'_prompt.txt')).write_text(job['prompt']+'\n',encoding='utf-8')
    im=Image.open(original).convert('RGBA');items=[];names=[];columns=3;rows=3;kind=''
    if '_bg_' in key:
        mode='free' if '_free' in key else 'base';kind='background';target=runtime/(slug+'Background');target.mkdir(exist_ok=True)
        final=ImageOps.fit(im.convert('RGB'),(1920,1080),method=L)
        final.save(target/f'bg_{mode}.jpg',quality=88)
        (source/'background').mkdir(exist_ok=True);final.save(source/'background'/f'bg_{mode}.jpg',quality=94)
        # Named whole-scene reference is separate from actual independently drawn layers.
        items=[final];names=[f'bg_{mode}']
    elif key.endswith('_symbols'):
        kind='symbols';names=['s','h1','h2','h3','h4','l1','l2','l3','l4'];items=split(im,3,3)
    elif key.endswith('_character'):
        kind='cast';names=['character_master'];items=[im];columns=rows=1
    elif key.endswith('_symbol_parts'):
        kind='symbols/parts';columns=3;rows=4;items=split(im,3,4)
        names=['s_ring','s_gem','h1_bowl','h1_water','h1_fish','h2_can','h2_lid','h2_tail','h3_ball','h3_thread','h4_pot','h4_leaves'] if cat else ['s_mic','s_feather','s_charm','h1_disc','h1_label','h2_hat','h2_cord','h3_scope','h3_eye','h4_coconut','h4_straw','h4_umbrella']
    elif key.endswith('_parts'):
        kind='cast/parts';columns=rows=4;items=split(im,4,4)
        names=['body','head','arm_back','paw_back','arm_front_upper','arm_front_fore','paw_front_rest','paw_front_push','paw_front_stamp','tail','tie','rose','monocle','monocle_chain','catnip','sofa_back'] if cat else ['body','head','wing_back_upper','wing_back_tip','wing_front_upper','wing_front_mid','wing_front_tip_scratch','wing_front_tip_point','wing_front_tip_up','wing_front_tip_hold','tail','crest','headphones','eyepatch','chain','booth']
    elif key.endswith('_faces'):
        kind='cast/faces';columns=4 if cat else 3;rows=3;items=split(im,columns,rows)
        names=['face_idle','face_monocle','face_smug','face_annoyed','face_shock','face_stamp','face_laugh','face_purr','face_blink','face_yawn','whiskers_left','whiskers_right'] if cat else ['face_idle','face_hype','face_smug','face_awkward','face_shock','face_party','face_blink','face_squawk','crest_states']
    elif key.endswith('_mechanics'):
        kind='mechanics';columns=4;rows=4 if cat else 3;items=split(im,columns,rows)
        names=['box_closed','box_peek_1','box_peek_2','box_open_1','box_open_2','box_open_3','box_open_4','stamp_x2','stamp_x3','stamp_x5','stamp_x10','stamp_x25','stamp_x50','stamp_x100','stamp_ink','stamp_side'] if cat else ['knob_base','knob_cap','knob_led','knob_plate','platinum_disc','platinum_label_t1','platinum_label_t2','platinum_label_t3','platinum_label_t4','platinum_sleeve','platinum_shine','platinum_scratch']
    elif key.endswith('_ui'):
        kind='ui';columns=rows=4;items=split(im,4,4)
        names=['button_disc','button_disc_on','buybonus_plate','buybonus_plate_lit','buy_card_bonus','buy_card_super','buy_card_bonus_hover','buy_card_super_hover','fs_counter_panel','fs_sign','frame_corner','frame_edge_h','frame_edge_v','big','superwin','mega']
        centers=[(.13,.13),(.37,.13),(.62,.14),(.87,.14),(.13,.41),(.38,.41),(.62,.41),(.87,.41),(.10,.66),(.38,.66),(.64,.65),(.86,.69),(.05,.86),(.35,.83),(.77,.83),(.55,.94)] if cat else [(.13,.18),(.37,.18),(.62,.18),(.87,.18),(.13,.45),(.38,.45),(.62,.45),(.87,.45),(.11,.71),(.42,.71),(.69,.70),(.89,.71),(.05,.87),(.25,.88),(.55,.88),(.85,.88)]
        items=components(im,centers)
    elif key.endswith('_banners'):
        kind='banners';columns=1;rows=6;items=split(im,1,6);names=['big','superwin','mega','epic','max','bar_strip']
    elif key.endswith('_intro'):
        kind='intro';columns=1;rows=3;items=split(im,1,3);names=['intro_1','intro_2','intro_3']
    elif key.endswith('_logo'):
        kind='brand';columns=rows=1;items=[im];names=['logo']
    if not items:continue
    if kind in ['symbols','cast/parts','symbols/parts']:
        items=components(im,[((c+.5)/columns,(r+.5)/rows) for r in range(rows) for c in range(columns)])
    destination=source/kind;destination.mkdir(parents=True,exist_ok=True)
    for name,image in zip(names,items):
        if kind=='background':continue
        size=(1024,1536) if kind=='cast' else (768,768) if kind=='cast/faces' else (512,512)
        if kind=='banners':size=(1600,200) if name=='bar_strip' else (1352,194)
        if kind=='intro':size=(960,720)
        if kind=='brand':size=(1600,600)
        if kind=='ui':
            size=(640,800) if name.startswith('buy_card') else (1706,922) if name=='fs_sign' else (1352,194) if name in ['big','superwin','mega'] else (512,96) if name=='frame_edge_h' else (96,512) if name=='frame_edge_v' else (256,256) if name.startswith('button') or name=='frame_corner' else (512,320) if name=='fs_counter_panel' else (640,640)
        out=ImageOps.fit(image,size,method=L) if kind=='intro' else normalize(image,size,.98 if kind in ['banners','brand'] else .90 if name.startswith('frame_edge') else .83 if kind.startswith('cast') else .78)
        out.save(destination/(name+'.png'))
        if kind=='symbols' or kind=='symbols/parts':target=runtime/(slug+'Symbols')
        elif kind=='ui':target=runtime/(slug+'WinBanners' if name in ['big','superwin','mega'] else slug+'Ui')
        elif kind=='mechanics':target=runtime/(slug+'Mechanics')
        elif kind=='banners':target=runtime/(slug+'Ui' if name=='bar_strip' else slug+'WinBanners')
        elif kind=='intro':target=runtime/(slug+'Intro')
        elif kind=='brand':target=brand
        else:target=runtime/(slug+'Cast')
        target.mkdir(exist_ok=True)
        if not kind.startswith('cast/'):out.save(target/(name+'.png'))
    thumb=im.copy();thumb.thumbnail((1280,1280),L);sheet=Image.new('RGB',(thumb.width,thumb.height+55),'#283445');sheet.paste(thumb,(0,55),thumb)
    draw=ImageDraw.Draw(sheet);draw.text((14,16),key,font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',22),fill='#ffe6a0');sheet.save(source/'_sheets'/(key+'.jpg'),quality=92)
    print(key,im.size,'->',len(items),'registered assets')
