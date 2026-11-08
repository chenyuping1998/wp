#!/usr/bin/env python3
"""Register imagegen source parts and repair masks; user authorized 2026-10-27.

Raw source PNGs are immutable. No synthetic replacement for the official rig.
The final master is assembled from the delivered layers, not the concept image.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import json
import shutil
from native_repairs import make as native_parts
from finish_sources import finish

ROOT = Path(__file__).resolve().parent
SIZE = (1024, 1536)
ORDER = ('tail_3 tail_2 tail_1 coat_tail_l coat_tail_r arm_l_upper arm_l_lower '
         'hand_l_hip leg_l_upper leg_l_lower foot_l pelvis leg_r_upper leg_r_lower '
         'foot_r neck torso head_idle hat glasses arm_r_upper arm_r_lower hand_r_pinch').split()


def clean(image):
    image = image.convert('RGBA')
    alpha = image.getchannel('A').point(lambda v: 0 if v < 8 else 255 if v >= 248 else v)
    image.putalpha(alpha)
    zero = alpha.point(lambda v: 255 if v == 0 else 0)
    image.paste((0, 0, 0, 0), (0, 0), zero)
    return image


def polygon_mask(points):
    mask = Image.new('L', SIZE, 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    return mask


def clipped(image, points):
    image = image.copy().convert('RGBA')
    image.putalpha(ImageChops.multiply(image.getchannel('A'), polygon_mask(points)))
    return image


def y_pos(y):
    # Uniform final vertical registration: hat top 28 -> 80, soles 1477 -> 1456.
    return round(80 + (y - 28) * (1456 - 80) / (1477 - 28))


def build():
    required=[ROOT/'source/repairs-1028'/f'arm_{side}_{part}.png' for side in ['l','r'] for part in ['upper','lower']]
    if any(not p.exists() for p in required):
        raise FileNotFoundError('Run import_generated_sleeves.py first; accepted sleeve sources are required.')
    targets = json.loads((ROOT / 'layer-targets.json').read_text())
    raw = ROOT / 'raw_layers'
    output = ROOT / 'layers'
    output.mkdir(exist_ok=True)
    reference = ROOT / 'reference-master.png'
    if not reference.exists():
        shutil.copy2(ROOT / 'master.png', reference)
    original = clean(Image.open(reference))
    native = native_parts(original)
    head_alpha = clean(Image.open(raw / 'head_idle.png')).getchannel('A')
    transforms = {}
    final = {}
    for path in sorted(raw.glob('*.png')):
        name = path.stem
        image = Image.open(path).convert('RGBA')
        repairs = []
        if name in native:
            image=native[name]
            repairs.append('precise master cut / concealed anatomy repair; shared continuous limb or tail source')
        elif name.startswith('head_'):
            # All five expressions are edits of one head at the same raw
            # coordinates. Restore its known silhouette, not the corrupted
            # background alpha returned by expression generation.
            image.putalpha(head_alpha)
            repairs.append('same-head silhouette alpha restored from head_idle')
        elif name == 'hand_l_hip':
            image = clipped(Image.open(ROOT/'attempts/hand_l_hip-before-repair.png'),
                            [(296,739),(339,734),(363,753),(365,799),(344,821),
                             (336,843),(305,853),(278,837),(270,816),(277,797),
                             (279,781),(285,765)])
            repairs.append('clean original brown hand isolated; cuff excluded')
        elif name == 'hand_r_grip':
            image = clipped(Image.open(ROOT/'attempts/hand_r_grip-before-repair.png'),
                            [(396,486),(642,486),(642,610),(584,624),(559,679),
                             (501,657),(399,642)])
            repairs.append('clean original brown grip isolated; cuff excluded')
        elif name == 'arm_l_upper':
            # Source master has the correct continuous upper-arm contour.
            # A hidden, rounded overlap cap is underpainted inside the sleeve.
            image = clipped(original, [(126,658),(145,630),(291,525),(320,506),
                                      (350,506),(347,575),(314,618),(181,703),
                                      (151,694)])
            cap = Image.new('RGBA', SIZE)
            draw = ImageDraw.Draw(cap)
            draw.ellipse((131,642,188,699), fill=(187,15,32,255))
            draw.ellipse((304,517,351,573), fill=(203,17,38,255))
            cap.alpha_composite(image)
            image = cap
            repairs.append('upper sleeve cut from full master; no forearm stub; rounded concealed overlaps')
        image = clean(image)
        bbox = image.getchannel('A').point(lambda v: 255 if v > 128 else 0).getbbox()
        if not bbox:
            raise ValueError(f'Empty part: {name}')
        target = targets.get(name, targets['head_idle'] if name.startswith('head_') else None)
        if target is None:
            raise ValueError(f'No target for {name}')
        x0,y0,x1,y1 = target
        target = [x0,y_pos(y0),x1,y_pos(y1)]
        # Record every geometry transform, instead of silently using generated
        # positions. Images remain full-canvas and in a common final coordinate system.
        if name in native:
            scale=(1456-80)/(1477-28)
            offset=80-28*scale
            canvas=image.transform(SIZE,Image.Transform.AFFINE,(1,0,0,0,1/scale,-offset/scale),Image.Resampling.BICUBIC)
            target=[bbox[0],y_pos(bbox[1]),bbox[2],y_pos(bbox[3])]
        else:
            if name=='glasses':
                target[1]+=18;target[3]+=18
            part = image.crop(bbox).resize((target[2]-target[0],target[3]-target[1]), Image.Resampling.LANCZOS)
            canvas = Image.new('RGBA', SIZE)
            canvas.alpha_composite(part, (target[0],target[1]))
        canvas = clean(canvas)
        canvas.save(output/f'{name}.png')
        final[name] = canvas
        transforms[name] = {'source_bbox':list(bbox),'final_bbox':target,'repairs':repairs}
    final=finish(final)
    # Accepted full-canvas source edits override historical procedural sleeves.
    # This is after registration: these PNGs already use final joint coordinates.
    repair_dir=ROOT/'source/repairs-1028'
    if repair_dir.exists():
        for path in sorted(repair_dir.glob('*.png')):
            if path.stem not in final:raise ValueError(f'Unknown source repair {path.name}')
            image=Image.open(path).convert('RGBA')
            if image.size!=SIZE:raise ValueError(f'Repair canvas changed: {path.name}')
            final[path.stem]=image
            transforms[path.stem]['repairs'].append('full continuous ImageGen cloth sleeve; measured original-joint registration')
    for name,image in final.items():
        image.save(output/f'{name}.png')
        transforms[name]['registered_target_bbox']=transforms[name]['final_bbox']
        transforms[name]['final_bbox']=list(image.getchannel('A').point(lambda v:255 if v>128 else 0).getbbox())
        if name.startswith('arm_'):transforms[name]['repairs'].append('1028: curved tapered cloth, no outlined overlap caps')
        if name.startswith('tail_'):transforms[name]['repairs'].append('1028: underpaint radius 23 inside shaft, preserve side ink, clamp registration RGB overshoot')
        if name in ['hand_l_hip','hand_r_grip','hand_r_pinch','hand_r_hatheld']:transforms[name]['repairs'].append('1028: smooth continuous edge and remove thin wrist protrusions')
        if name=='head_grin':transforms[name]['repairs'].append('1028: remove exterior chin shadow only; other heads unchanged')
    assembled = Image.new('RGBA',SIZE)
    for name in ORDER:
        assembled.alpha_composite(final[name])
    assembled.save(ROOT/'assembled.png')
    assembled.save(ROOT/'master.png')
    (ROOT/'registration.json').write_text(json.dumps({'authorization':'User explicitly selected programmatic cutting, alpha repair and registration on 2026-10-27','reference_master':'reference-master.png','final_master':'master.png','reference_difference':'Final master is a new assembly from repaired registered parts; not pixel-identical to the first imagegen master','transforms':transforms},ensure_ascii=False,indent=2)+'\n')
    (ROOT/'layers.json').write_text(json.dumps({'order':ORDER},indent=2)+'\n')
    # Real art joints, measured against the source pose; official stand34 builds bones.
    coords={
        'hip':(438,875),'waist':(443,800),'neckBase':(439,511),
        'headBase':(448,478),'headTop':(450,213),'hatBase':(449,265),
        'hatTop':(485,45),'glasses':(388,358),
        'shoulderL':(327,553),'elbowL':(165,668),'wristL':(279,757),
        'shoulderR':(581,565),'elbowR':(679,723),'wristR':(573,635),
        'hipL':(410,891),'kneeL':(333,1092),'ankleL':(423,1335),'toeL':(238,1430),
        'hipR':(483,890),'kneeR':(569,1105),'ankleR':(667,1340),'toeR':(819,1434),
        'tailRoot':(625,1054),'tail2':(790,1088),'tail3':(895,970),'tailTip':(764,859),
        'coatRootL':(344,819),'coatTipL':(480,1107),
        'coatRootR':(540,825),'coatTipR':(718,1151)}
    joints={k:{'x':x,'y':y_pos(y)} for k,(x,y) in coords.items()}
    (ROOT/'joints.json').write_text(json.dumps(joints,indent=2)+'\n')
    qa=ROOT/'qa';qa.mkdir(exist_ok=True)
    for name,color in [('assembled-light',(245,245,245,255)),('assembled-dark',(25,25,25,255))]:
        bg=Image.new('RGBA',SIZE,color);bg.alpha_composite(assembled);bg.convert('RGB').save(qa/f'{name}.jpg',quality=95)
    print(f'Registered {len(final)} parts; assembled master and measured joints saved.')


if __name__ == '__main__':
    build()
