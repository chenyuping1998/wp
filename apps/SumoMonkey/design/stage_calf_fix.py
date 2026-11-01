"""Stage the 2026-10-29 FG calf restoration (補畫_v5 had trimmed both FG calves).
Verifies source/crop/Spine/build identity, mirrors build into upload/SumoMonkey/frontend,
refreshes Spine zip + motion GIF + art-source. No platform upload."""
from pathlib import Path
from PIL import Image, ImageSequence
import hashlib, json, shutil, subprocess, sys, zipfile
A=Path(__file__).resolve().parents[1]; R=A.parents[2]; U=R/'upload/SumoMonkey'
S=Path(sys.argv[1])  # QA evidence folder (scratch)
E=U/'art-source/leg-fix-20261030'
h=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
tree=lambda d:{str(p.relative_to(d)):h(p) for p in Path(d).rglob('*') if p.is_file()}
math_before=tree(U/'math')
# 1. revision identity
for c in ['mg','fg']:
    src=A/f'design/sumo_cast/{c}'; crops=json.loads((src/'crops.json').read_text())
    order=json.loads((src/'layers/layers.json').read_text())['order']
    full=Image.new('RGBA',(1024,1536))
    for n in order: full.alpha_composite(Image.open(src/f'layers/{n}.png').convert('RGBA'))
    assert full.tobytes()==Image.open(src/'full.png').convert('RGBA').tobytes(),(c,'full')
    for n,box in crops.items():
        o=Image.open(src/f'layers/{n}.png').convert('RGBA')
        rec=Image.new('RGBA',o.size); rec.paste(Image.open(A/f'static/assets/sumoCast/{c}/{n}.png').convert('RGBA'),tuple(box[:2]))
        assert o.tobytes()==rec.tobytes(),(c,n,'crop')
        assert o.tobytes()==Image.open(src/f'{c}_spine/images/{n}.png').convert('RGBA').tobytes(),(c,n,'spine')
        assert h(A/f'static/assets/sumoCast/{c}/{n}.png')==h(A/f'build/assets/sumoCast/{c}/{n}.png'),(c,n,'build')
# 2. frontend
build=tree(A/'build')
assert not any('stub' in n for n in build) and b'stub-data' not in (A/'build/index.html').read_bytes()
before=tree(U/'frontend')
for f in before.keys()-build.keys(): (U/'frontend'/f).unlink()
shutil.copytree(A/'build',U/'frontend',dirs_exist_ok=True)
assert tree(U/'frontend')==build
changed=sorted(n for n,v in build.items() if before.get(n)!=v); removed=sorted(before.keys()-build.keys())
# 3. store art + art-source cast (store script copies cast layers/full/crops)
subprocess.run([sys.executable,str(A/'design/build_sumo_store.py')],check=True)
# 4. motion art-source, Spine zip, GIFs
for c in ['mg','fg']:
    shutil.copytree(A/f'design/sumo_cast/{c}/{c}_spine',U/f'art-source/motion/{c}_spine',dirs_exist_ok=True)
    shutil.copy2(A/f'src/game/sumoMotion_{c}.json',U/f'art-source/motion/sumoMotion_{c}.json')
subprocess.run([sys.executable,str(A/'design/sumo_preview_motion.py')],check=True)
with zipfile.ZipFile(U/'SumoMonkey-Spine43.zip','w',zipfile.ZIP_DEFLATED) as z:
    for c in ['mg','fg']:
        s=A/f'design/sumo_cast/{c}/{c}_spine'
        for p in s.rglob('*'):
            if p.is_file(): z.write(p,f'{c}_spine/{p.relative_to(s)}')
with zipfile.ZipFile(U/'SumoMonkey-Spine43.zip') as z: assert z.testzip() is None
gifs={c:[f.convert('RGB') for f in ImageSequence.Iterator(Image.open(A/f'design/sumo_cast/{c}/{c}_spine/預覽.gif'))] for c in ['mg','fg']}
n=min(len(gifs['mg']),len(gifs['fg'])); w,hh=gifs['mg'][0].size
frames=[]
for m,f in zip(gifs['mg'][:n],gifs['fg'][:n]):
    pic=Image.new('RGB',(w*2,hh)); pic.paste(m,(0,0)); pic.paste(f,(w,0)); frames.append(pic)
frames[0].save(U/'sumo-current-motion.gif',save_all=True,append_images=frames[1:],duration=83,loop=0)
# 5. evidence
E.mkdir(parents=True,exist_ok=True)
for p in S.iterdir():
    if p.is_file(): shutil.copy2(p,E/p.name)
for f in ['sumo_leg_blend.py','stage_calf_fix.py']: shutil.copy2(A/'design'/f,E/f)
[shutil.copy2(A/f'design/sumo_cast/{c}/layers/{n}.png',E/f'{c}_{n}.png') for c in ['mg','fg'] for n in ['leg_back_upper','leg_back_lower','leg_front_upper','leg_front_lower']]
assert tree(U/'math')==math_before
(E/'release-manifest.json').write_text(json.dumps({'date':'2026-10-30','change':'MG+FG all 4 leg layers: v5 chord cuts undone; outline blended from 重拆_v2 away from the knee, v5 knee tuck kept','frontend_changed':changed,'frontend_removed':removed,'frontend_files':len(build),'math_unchanged':True,'platform_updated':False},indent=2,ensure_ascii=False))
print('STAGED',len(build),'files; changed',changed,'removed',removed)
