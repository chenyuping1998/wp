"""Copy generated parts, preserve full canvas, assemble and render QA evidence."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,re,shutil,hashlib
ROOT=Path(__file__).resolve().parent
BASE=['arm_l_upper','arm_l_lower','hand_l_hip','leg_l_upper','leg_l_lower','foot_l','pelvis','leg_r_upper','leg_r_lower','foot_r','neck','torso','head_idle']
for char in ['dj','host']:
    D=ROOT/'交件'/char; L=D/'layers'; R=D/'raw';Q=D/'qa'
    for p in [L,R,Q]:p.mkdir(parents=True,exist_ok=True)
    names=BASE+[('hat' if char=='dj' else 'glasses'),'arm_r_upper','arm_r_lower','hand_r_grip']
    report={'character':char,'canvas':[1024,1536],'draw_order':names,'layers':{}}
    manifest=ROOT/'generation-complete-manifest.json'
    if manifest.exists():
        for job in json.loads(manifest.read_text())['jobs']:
            if job['char']!=char or not job.get('output'):continue
            m=re.search(r' as (/.+?\.png) by default',job['output'])
            if m and Path(m[1]).exists():shutil.copy2(m[1],R/(job['name']+'.png'))
    for p in sorted(R.glob('*.png')):
        im=Image.open(p).convert('RGBA')
        if im.size!=(1024,1536):
            # Keep original whole-canvas coordinates, never crop/recenter parts.
            im=im.resize((1024,1536),Image.Resampling.LANCZOS)
        im.save(L/p.name)
        alpha=im.getchannel('A');box=alpha.point(lambda a:255 if a>128 else 0).getbbox()
        report['layers'][p.stem]={'bbox_alpha128':box,'size':list(im.size),'alpha_range':list(alpha.getextrema()),'sha256':hashlib.sha256((L/p.name).read_bytes()).hexdigest()}
        sheet=Image.new('RGB',(768,600),'#808080');draw=ImageDraw.Draw(sheet)
        for x,color in [(0,'#eeeeea'),(384,'#15191f')]:
            bg=Image.new('RGBA',(384,576),color);thumb=im.resize((384,576),Image.Resampling.LANCZOS);bg.alpha_composite(thumb);sheet.paste(bg.convert('RGB'),(x,24))
        draw.text((8,5),p.stem,fill='black');sheet.save(Q/(p.stem+'-light-dark.jpg'),quality=94)
    assembled=Image.new('RGBA',(1024,1536));missing=[]
    for name in names:
        p=L/(name+'.png')
        if p.exists():assembled.alpha_composite(Image.open(p).convert('RGBA'))
        else:missing.append(name)
    # A partial assembly is a diagnostic, never a deliverable assembled.png.
    assembled.save(Q/'assembly-in-progress.png')
    report['missing_default_layers']=missing
    (D/'source-report.json').write_text(json.dumps(report,indent=2)+'\n')
    imgs=sorted(Q.glob('*-light-dark.jpg'))
    cols=3;rows=(len(imgs)+cols-1)//cols
    if rows:
        contact=Image.new('RGB',(cols*384,rows*300),'#888888')
        for n,p in enumerate(imgs):contact.paste(Image.open(p).resize((384,300)),((n%cols)*384,(n//cols)*300))
        contact.save(Q/'layers-contact.jpg',quality=95)
    print(char,len(report['layers']),'layers; missing',missing)
