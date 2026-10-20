"""Cut, register and crop our own cast art for the Spine v2 brief.

Input repairs are preserved in design/_incoming/spine_v2. Nothing is painted by
this script: it only registers the generated repairs, masks the original art,
and crops the resulting animation layers. Run before build_cast_spine.py.
"""
import json
import os
from pathlib import Path

import numpy as np
from scipy.ndimage import gaussian_filter
from PIL import Image, ImageDraw, ImageChops, ImageFilter
from cast_spine_v2_config import upgrade
from build_cast_spine import PRISONER, WARDEN

APP = Path(__file__).resolve().parents[1]
INCOMING = APP/'design/_incoming/spine_v2'
SOURCE = APP/'design/source/spine_v2'
SIZE = (1024,2048)


def blank():
    return Image.new('RGBA', SIZE)


def polygon(points):
    m = Image.new('L',SIZE)
    ImageDraw.Draw(m).polygon(points,fill=255)
    return m


def cut(im, points):
    out = im.copy()
    out.putalpha(ImageChops.multiply(im.getchannel('A'),polygon(points)))
    return out


def rect(im,x0,y0,x1,y1):
    return cut(im,[(x0,y0),(x1,y0),(x1,y1),(x0,y1)])


def old_layer(who,name):
    src = APP/'static/assets/castLayers'/who
    d = json.loads((src/'layers.json').read_text())
    l = next(l for l in d['layers'] if l['name']==name)
    out=blank()
    out.alpha_composite(Image.open(src/l['texture']).convert('RGBA'),tuple(l.get('crop',[0,0])[:2]))
    return out


def repair(name,box=None):
    im=Image.open(INCOMING/(name+'.png')).convert('RGBA')
    # ImageGen can leave nearly transparent specks far from the figure. Those
    # are not registration landmarks; using alpha.getbbox() magnifies them.
    a=np.array(im)
    a[a[...,3]<12]=0
    im=Image.fromarray(a)
    if box:
        mask=im.getchannel('A').point(lambda a:255 if a>96 else 0)
        im=im.crop(mask.getbbox())
        out=blank()
        out.alpha_composite(im.resize((box[2]-box[0],box[3]-box[1]),Image.Resampling.LANCZOS),box[:2])
        im=out
    else:
        im=im.resize(SIZE,Image.Resampling.LANCZOS)
    return im


def legs(full,pants,knee,ankle,hem,mid):
    # The repair only supplies the hidden waistband; original visible trousers
    # and shoes keep their exact paint, silhouette and registration.
    pants=rect(pants,0,hem-65,1023,hem+3)
    pants.alpha_composite(rect(full,0,hem,1023,2047))
    layers={'pelvis':rect(pants,0,hem-65,1023,hem+155)}
    for side,x0,x1 in [('r',0,mid),('l',mid+1,1023)]:
        layers['thigh_'+side]=rect(pants,x0,hem+85,x1,knee+40)
        layers['shin_'+side]=rect(pants,x0,knee-40,x1,ankle+30)
        layers['shoe_'+side]=rect(full,x0,ankle-25,x1,2047)
    return layers


def blink(who,closed):
    # Crop only the eyelids; the original face never swaps or changes size.
    # Soft oval edges hide the replacement against the original painted skin.
    boxes = {'prisoner':[(458,252,489,278),(503,251,547,279)],
             'warden':[(410,204,441,228),(444,201,479,226)]}
    m=Image.new('L',SIZE)
    d=ImageDraw.Draw(m)
    for b in boxes[who]: d.ellipse(b,fill=255)
    m=m.filter(ImageFilter.GaussianBlur(2))
    out=closed.copy();out.putalpha(ImageChops.multiply(out.getchannel('A'),m))
    return out


def prisoner():
    full=Image.open(APP/'design/cast_brief/spine_v2/full_prisoner.png').convert('RGBA')
    p1=repair('P1')
    p2=repair('P2',(275,437,779,748))
    p3=repair('P3',(289,895,806,1774))
    layers=legs(full,p3,1370,1665,960,546)
    # Sleeveless repaired trunk. Deliberately narrow below the shoulders: no
    # forearm-shaped underlay can be left outside the jacket's real waist.
    trunk=[(332,439),(423,398),(475,378),(594,372),(659,404),(719,439),
           (703,563),(695,742),(716,961),(338,961),(353,750),(367,550)]
    layers['torso']=cut(p1,trunk)
    layers['torso'].alpha_composite(rect(cut(full,[(353,740),(696,740),(716,961),(338,961)]),0,750,1023,961))
    # Original visible sleeves, supplemented at hidden shoulders by P2.
    arm_r=[(332,437),(393,460),(405,538),(382,604),(401,660),(383,716),
           (318,749),(276,715),(273,612),(301,520)]
    arm_l=[(704,437),(749,445),(774,521),(779,607),(757,690),(708,700),(671,615),(684,529)]
    for side,points in [('r',arm_r),('l',arm_l)]:
        part=cut(p2,points);part.alpha_composite(cut(full,points));layers['upper_arm_'+side]=part
    layers['forearm_under']=cut(repair('P2_under',(275,550,718,748)),
        [(275,690),(615,607),(645,563),(718,550),(718,625),(648,654),(546,714),(330,748),(275,735)])
    # Keep the visible lower sleeve and its hand from the original painting.
    layers['forearm_under'].alpha_composite(cut(full,[(276,641),(309,673),(367,669),
        (465,644),(511,648),(562,684),(550,738),(330,751),(288,724)]))
    layers['forearm_under'].alpha_composite(cut(full,[(613,607),(620,580),(651,559),
        (687,550),(704,551),(704,560),(719,570),(718,581),(704,585),(718,588),
        (715,599),(695,607),(667,613),(646,628)]))
    layers['forearm_over']=cut(full,[(385,610),(397,598),(435,591),(475,595),
        (482,589),(528,596),(579,605),(640,609),(705,601),(754,593),
        (778,646),(764,687),(737,718),(702,728),(652,724),(601,714),
        (548,699),(477,684),(464,650),(432,636),(391,636)])
    towel=[(619,378),(659,388),(689,400),(720,420),(704,457),(692,506),
           (686,550),(676,577),(701,624),(727,658),(771,637),(781,689),
           (790,807),(776,833),(735,844),(710,825),(701,776),(704,719),
           (696,687),(677,627),(654,558),(641,491),(627,433)]
    layers['towel']=cut(full,towel)
    # Front sleeves occlude the towel through the middle of its drop. Remove
    # those sleeve pixels rather than moving a duplicate arm with the towel.
    tm=np.array(layers['towel']); tm[555:733,:750,3]=0
    layers['towel']=Image.fromarray(tm)
    layers['head']=old_layer('prisoner_crossed','head')
    # Preserve EVERY visible original pixel, assigning it to its frontmost
    # cut piece. The repair is only the backing that a moving limb uncovers.
    visible=old_layer('prisoner_crossed','body')
    reserved=Image.new('L',SIZE)
    for name in ['upper_arm_r','upper_arm_l','forearm_under','forearm_over','towel']:
        reserved=ImageChops.lighter(reserved,layers[name].getchannel('A'))
    facefree=rect(visible,0,0,1023,960)
    facefree.putalpha(ImageChops.multiply(facefree.getchannel('A'),
        ImageChops.multiply(polygon(trunk),ImageChops.invert(reserved))))
    layers['torso'].alpha_composite(facefree)
    # Cover small polygon-boundary omissions with the adjacent ORIGINAL part,
    # never a patch of generated clothing over an already visible sleeve.
    comp=blank()
    for name in ['torso','upper_arm_r','upper_arm_l','forearm_under','forearm_over','towel']:
        comp.alpha_composite(layers[name])
    missing=ImageChops.subtract(rect(visible,0,0,1023,959).getchannel('A'),comp.getchannel('A'))
    for name,box in [('upper_arm_r',(0,0,410,600)),('upper_arm_l',(650,0,1023,600)),
                     ('forearm_under',(0,600,550,760)),('forearm_over',(550,580,750,750)),
                     ('towel',(750,550,1023,960))]:
        patch=rect(visible,*box);patch.putalpha(ImageChops.multiply(patch.getchannel('A'),missing))
        layers[name].alpha_composite(patch)
    fix_prisoner_ghosts(layers,full,p1,p2,trunk,towel,arm_l)
    plug_holes(layers,full,upgrade(PRISONER)['order'])
    layers['blink']=blink('prisoner',repair('P4'))
    return layers


def fill_from_surroundings(rgba,mask):
    """Paint `mask` (inside an opaque silhouette) from the opaque pixels around
    it: normalised Gaussian fill, coarse to fine. Alpha is left as it was, so
    the arm keeps its outline; only the colour under the hand is replaced."""
    out=rgba.copy().astype(np.float32)
    known=(rgba[...,3]>200)&~mask
    for sigma in [2,4,8,16,32]:
        w=known.astype(np.float32)
        num=[gaussian_filter(out[...,c]*w,sigma) for c in range(3)]
        den=gaussian_filter(w,sigma)
        ok=mask&~known&(den>1e-3)
        for c in range(3): out[...,c][ok]=num[c][ok]/den[ok]
        known=known|ok
    out[...,3][mask]=np.maximum(out[...,3][mask],255*(rgba[...,3][mask]>0))
    return np.clip(out,0,255).astype(np.uint8)


def plug_holes(layers,full,order):
    """Any pixel the original paints that the stacked layers leave transparent
    is a hole you can see at rest. Give it to the frontmost layer that has
    paint within 4 px (so it moves with that part); what is left goes to the
    torso. check_cast_spine_holes.py measures the result."""
    comp=blank()
    for n in order:
        if n!='blink': comp.alpha_composite(layers[n])
    f=np.array(full); hole=(f[...,3]>200)&(np.array(comp)[...,3]<128)
    for n in reversed(order):
        if n=='blink' or not hole.any(): continue
        a=np.array(layers[n].getchannel('A').point(lambda v:255 if v>40 else 0).filter(ImageFilter.MaxFilter(9)))>0
        take=hole&a
        if take.any():
            L=np.array(layers[n]); L[take]=f[take]; layers[n]=Image.fromarray(L); hole&=~take
    if hole.any():
        L=np.array(layers['torso']); L[hole]=f[hole]; layers['torso']=Image.fromarray(L)


def towel_colour(im):
    a=np.array(im).astype(np.float32)
    mx=a[...,:3].max(2); mn=a[...,:3].min(2)
    return (mx>150)&((mx-mn)/(mx+1e-3)<0.22)&(a[...,3]>40)


def fix_prisoner_ghosts(layers,full,p1,p2,trunk,towel,arm_l):
    """Ghost check, 2026-10-20 (Claude): take every moving part away and look at
    what is left. Three things stayed behind and would show the moment the
    arms tighten or the towel swings:

    1. the torso was ORIGINAL visible jacket hard-pasted over P1, the seam
       hidden exactly under the arm edges - so any arm motion opened a torn,
       misregistered edge (pocket flap, a step across the chest at y 750);
    2. upper_arm_l carried the four fingers of the right hand that rests on
       the left bicep (forearm_under already has the hand);
    3. upper_arm_l and forearm_over carried strips of the towel, while the
       towel layer had its middle cut out.
    """
    # 1. P1 around every moving part (plus the distance the arms travel), the
    #    original jacket only where nothing ever uncovers it, blended softly.
    movers=Image.new('L',SIZE)
    for name in ['upper_arm_r','upper_arm_l','forearm_under','forearm_over','towel']:
        movers=ImageChops.lighter(movers,layers[name].getchannel('A').point(lambda v:255 if v>40 else 0))
    # Original wherever it can be seen at rest, P1 under the moving parts, the
    # change made at the parts' edges over a soft ~6 px instead of the torn,
    # misregistered hard edge. (Reaching further under the arms keeps the
    # arms' OWN outline in the torso - a faint ghost arm - since what the
    # original shows there is the arm.)
    near=movers.filter(ImageFilter.MaxFilter(7))
    keep=ImageChops.invert(near).filter(ImageFilter.GaussianBlur(3))
    visible=old_layer('prisoner_crossed','body')
    torso=cut(p1,trunk)
    orig=rect(visible,0,0,1023,960)
    orig.putalpha(ImageChops.multiply(orig.getchannel('A'),ImageChops.multiply(polygon(trunk),keep)))
    torso.alpha_composite(orig)
    layers['torso']=torso

    # 2. the right hand's fingers on the left bicep: refill from the same
    #    sleeve higher up (the hand covers it at rest, so this is only ever
    #    seen while the hand slides).
    ua=np.array(layers['upper_arm_l'])
    hand=np.array(layers['forearm_under'].getchannel('A'))>40
    hand[:, :640]=False
    region=np.array(polygon(arm_l))>0
    # Only under the hand (+3 px of its anti-aliased rim): anything wider shows
    # as a blurred patch beside the fingertips at rest. Filled LAST, below.
    m=(np.array(Image.fromarray((hand&region).astype(np.uint8)*255).filter(ImageFilter.MaxFilter(7)))>0)&region

    # 3. towel pixels belong to the towel; the sleeve edge they covered comes
    #    from P2 (arms only, no towel).
    tm=towel_colour(full)&(np.array(polygon(towel))>0)
    # grow the towel mask over its anti-aliased rim, but never past the towel's
    # own polygon: the towel layer is cut by that polygon, so anything taken
    # off an arm outside it would be a hole.
    tm=(np.array(Image.fromarray(tm.astype(np.uint8)*255).filter(ImageFilter.MaxFilter(5)))>0)&(np.array(polygon(towel))>0)
    p2a=np.array(cut(p2,arm_l))
    # P2 paints the same hand on the bicep, so keep it off the hand's area.
    sel=tm&region&~m&(p2a[...,3]>128)
    ua[sel]=p2a[sel]
    ua[tm&region&~m&(p2a[...,3]<=128),3]=0
    ua[...,3][m]=255
    ua=fill_from_surroundings(ua,m)
    layers['upper_arm_l']=Image.fromarray(ua)
    fo=np.array(layers['forearm_over']); fo[tm,3]=0; layers['forearm_over']=Image.fromarray(fo)
    tw=np.array(layers['towel']); src=np.array(cut(full,towel))
    band=np.zeros(tm.shape,bool); band[555:733,:750]=True
    tw[band&tm]=src[band&tm]
    layers['towel']=Image.fromarray(tw)


def warden():
    full=Image.open(APP/'design/cast_brief/spine_v2/full_warden.png').convert('RGBA')
    w1=repair('W1');w2=repair('W2',(174,338,843,1086));w3=repair('W3',(262,690,778,1875))
    pants_original=full.copy()
    a=np.array(pants_original)
    # The hanging hand extends BELOW the belt in the full illustration. It
    # belongs to hand_l, never to pelvis/thigh_l (a rectangular leg crop would
    # leave a second hand behind when the arm swings).
    a[:1150,700:,3]=0
    pants_original=Image.fromarray(a)
    layers=legs(pants_original,w3,1410,1735,825,490)
    # Original trousers have the keys in the waist. Replace only that hidden
    # area with W3, preserving the visible belt on the rest of the pelvis.
    original=old_layer('warden','body')
    keymask=Image.new('L',SIZE)
    ImageDraw.Draw(keymask).rounded_rectangle((336,804,407,944),radius=13,fill=255)
    keymask=keymask.filter(ImageFilter.GaussianBlur(5))
    belt=Image.composite(w3,original,keymask)
    belt.putalpha(original.getchannel('A'))
    layers['pelvis']=rect(belt,0,735,1023,990)
    layers['torso']=cut(w1,[(366,340),(419,329),(469,366),(545,337),(603,358),
        (674,392),(678,494),(656,641),(658,788),(322,788),(316,675),(331,513),(333,402)])
    # The existing separate shirt is already clean below its accessories;
    # preserve its original pixels over the repaired backing.
    layers['torso'].alpha_composite(rect(original,0,0,1023,750))
    ar=old_layer('warden','arm_r');al=old_layer('warden','arm_l')
    # Cut each arm at the elbow with 40 px overlap. Both halves share the
    # same repaired sleeve pixels where the joint opens.
    up=[(375,338),(406,338),(406,580),(285,685),(230,675),(264,580),
        (311,460),(344,438),(365,400)]
    ur=cut(w2,up)
    ur.alpha_composite(cut(ar,up))
    layers['upper_arm_r']=ur
    fp=[(184,569),(218,480),(253,430),(271,392),(281,350),(349,345),
        (378,380),(368,420),(338,447),(315,491),(289,554),(268,617),(223,680),(180,650)]
    fr=cut(w2,fp);fr.alpha_composite(cut(ar,fp))
    layers['forearm_r']=fr
    layers['upper_arm_l']=rect(al,0,0,1023,812)
    layers['forearm_l']=rect(al,0,732,1023,939)
    layers['hand_l']=rect(al,0,919,1023,2047)
    layers['keys']=cut(original,[(351,798),(386,799),(405,827),(399,868),(402,921),
        (387,936),(347,932),(337,909),(343,864),(346,833)])
    layers['whistle']=old_layer('warden','dangle_chain')
    layers['radio_cord']=old_layer('warden','dangle_mask')
    layers['baton']=old_layer('warden','prop_bat')
    layers['fingers_r']=old_layer('warden','fingers_r')
    layers['head']=old_layer('warden','head')
    plug_holes(layers,full,upgrade(WARDEN)['order'])
    layers['blink']=blink('warden',repair('W4'))
    return layers


def save(cfg,layers):
    dst=APP/'static/assets/castLayers'/cfg['src'];dst.mkdir(parents=True,exist_ok=True)
    man={'version':2,'size':list(SIZE),'figure_box':list(PRISONER['root']),
         'order':cfg['order'],'layers':[],'repairs':'design/_incoming/spine_v2'}
    man['figure_box']=[275,172,806,1774] if cfg['name']=='prisoner' else [180,71,836,1875]
    composite=blank()
    sheet=Image.new('RGBA',(1024*5,2048*4),(45,41,37,255))
    for i,name in enumerate(cfg['order']):
        im=layers[name];bb=im.getchannel('A').getbbox()
        if not bb: raise ValueError('empty layer '+name)
        part=im.crop(bb);part.save(dst/(name+'.png'),optimize=True)
        man['layers'].append({'name':name,'texture':name+'.png',
                              'crop':[bb[0],bb[1],part.width,part.height]})
        if name!='blink':composite.alpha_composite(im)
        sheet.alpha_composite(im,(i%5*1024,i//5*2048))
        ImageDraw.Draw(sheet).text((i%5*1024+20,i//5*2048+20),name,fill='white',font_size=42)
    (dst/'layers.json').write_text(json.dumps(man,indent=2)+'\n')
    SOURCE.mkdir(parents=True,exist_ok=True)
    composite.save(SOURCE/(cfg['name']+'_setup.png'))
    sheet.thumbnail((1500,2400));sheet.save(SOURCE/(cfg['name']+'_layers.png'))
    # Adapter for the house underlay audit (which expects the #7 rig format).
    audit=SOURCE/'underlay'/cfg['name'];audit.mkdir(parents=True,exist_ok=True)
    audit_layers=[]
    for layer in man['layers']:
        n=layer['name'];alias='trunk' if n=='torso' else n
        if n.startswith('upper_arm_'):alias='left_arm_upper' if n.endswith('l') else 'right_arm_upper'
        if n.startswith('forearm_'):alias='left_arm_fore' if n in ['forearm_l','forearm_over'] else 'right_arm_fore'
        x,y,w,h=layer['crop']
        audit_layers.append(dict(name=alias,file=os.path.relpath(dst/layer['texture'],audit),x=x,y=y,w=w,h=h))
    (audit/'layers.json').write_text(json.dumps(dict(canvas=list(SIZE),layers=audit_layers),indent=2)+'\n')
    rig={}
    for side in ['l','r']:
        b=next(b for b in cfg['bones'] if b[0]=='arm_'+side)
        rig['shoulder'+side.upper()]=b[2];rig['elbow'+side.upper()]=b[3]
    (audit/'rig.json').write_text(json.dumps(rig,indent=2)+'\n')
    print(cfg['name'],len(man['layers']),'cropped layers',dst)


if __name__=='__main__':
    for cfg,fn in [(PRISONER,prisoner),(WARDEN,warden)]:save(upgrade(cfg),fn())
