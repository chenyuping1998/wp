"""Stage only the visually accepted v5 detail revision; no platform mutation."""
from pathlib import Path
from PIL import Image,ImageSequence
import json,hashlib,shutil,zipfile
A=Path(__file__).resolve().parents[1];R=A.parents[2];U=R/'upload/SumoMonkey'
O=R/'dist/sumomonkey-v5-detail';W=R/'角色生圖_相撲猴/補畫_v5/工作'
B=R/'_upload_backups/SumoMonkey-before-v5-detail-20261027'
h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def copy_if_changed(src,dst):
 if Path(dst).exists() and Path(src).read_bytes()==Path(dst).read_bytes():return str(dst)
 return shutil.copy2(src,dst)
qa=json.loads((O/'playtest/v5-detail-final-qa.json').read_text())
assert qa['ends']==2 and not qa['errors'] and not qa['badResponses']
assert set(qa['captured'])=={5,6,7} and len(qa['spinsSeen'])==3
assert qa['production_sha256']==h(A/'build/index.html')
audit=json.loads((O/'source-audit.json').read_text())
for c in ['mg','fg']:
 for n,part in audit[c]['parts'].items():assert part['sha256']==h(A/f'design/sumo_cast/{c}/layers/{n}.png')
 assert audit[c]['full_exact'] and audit[c]['joints_order_params_identical']
before={str(p.relative_to(U/'frontend')):h(p) for p in (U/'frontend').rglob('*') if p.is_file()}
math={p.name:h(p) for p in (U/'math').iterdir() if p.is_file()}
for rel in ['frontend','thumbnail','cover']:
 if not (B/rel).exists():shutil.copytree(U/rel,B/rel)
for f in ['SumoMonkey-Spine43.zip','sumo-current-motion.gif']:
 if (U/f).exists() and not (B/f).exists():shutil.copy2(U/f,B/f)
build={str(p.relative_to(A/'build')):h(p) for p in (A/'build').rglob('*') if p.is_file()}
assert not any('stub' in n or 'boxing-alpha' in n for n in build)
assert b'stub.local' not in (A/'build/index.html').read_bytes()
for f in before.keys()-build.keys():(U/'frontend'/f).unlink()
shutil.copytree(A/'build',U/'frontend',dirs_exist_ok=True)
E=U/'art-source/v5-detail-20261027';E.mkdir(exist_ok=True)
for c in ['mg','fg']:
 root=A/f'design/sumo_cast/{c}';dest=R/f'角色生圖_相撲猴/補畫_v5/交件/{c.upper()}';dest.mkdir(parents=True,exist_ok=True)
 names=[e['part'] for e in json.loads((W/'imagegen-manifest.json').read_text()) if e['cast']==c]
 for n in names:shutil.copy2(root/f'layers/{n}.png',dest/f'{n}.png')
 shutil.copy2(root/'full.png',dest/'full.png')
 shutil.copytree(root,E/'cast'/c,dirs_exist_ok=True)
 shutil.copytree(root,U/'art-source/cast'/c,dirs_exist_ok=True,copy_function=copy_if_changed)
 shutil.copytree(root/f'{c}_spine',U/f'art-source/motion/{c}_spine',dirs_exist_ok=True)
 shutil.copy2(A/f'src/game/sumoMotion_{c}.json',U/f'art-source/motion/sumoMotion_{c}.json')
 shutil.copy2(A/f'src/game/sumoMotion_{c}.json',E/f'sumoMotion_{c}.json')
 shutil.copytree(root/'layers',E/'source-layers'/c,dirs_exist_ok=True)
with zipfile.ZipFile(U/'SumoMonkey-Spine43.zip','w',zipfile.ZIP_DEFLATED) as z:
 for c in ['mg','fg']:
  src=A/f'design/sumo_cast/{c}/{c}_spine'
  for p in src.rglob('*'):
   if p.is_file():z.write(p,f'{c}_spine/{p.relative_to(src)}')
with zipfile.ZipFile(U/'SumoMonkey-Spine43.zip') as z:assert z.testzip() is None
frames=[]
with Image.open(O/'mg-before-after.gif') as mg,Image.open(O/'fg-before-after.gif') as fg:
 for m,f in zip(ImageSequence.Iterator(mg),ImageSequence.Iterator(fg)):
  pic=Image.new('RGB',(840,550));pic.paste(m.convert('RGB').crop((420,0,840,550)),(0,0));pic.paste(f.convert('RGB').crop((420,0,840,550)),(420,0));frames.append(pic)
frames[0].save(U/'sumo-current-motion.gif',save_all=True,append_images=frames[1:],duration=67,loop=0)
shutil.copy2(O/'mg-before-after.gif',U/'sumo-v5-detail-before-after-mg.gif')
shutil.copy2(O/'fg-before-after.gif',U/'sumo-v5-detail-before-after-fg.gif')
for c in ['mg','fg']:
 shutil.copy2(O/f'{c}-before-after.gif',E/f'{c}-before-after.gif')
 shutil.copytree(O/'transitions',E/'transitions',dirs_exist_ok=True)
shutil.copytree(O/'playtest',E/'runtime-qa',ignore=shutil.ignore_patterns('_app','assets','fonts','stub*','index.html','*.js'),dirs_exist_ok=True)
for p in O.glob('*.png'):shutil.copy2(p,E/p.name)
for p in O.glob('*.json'):shutil.copy2(p,E/p.name)
for f in ['imagegen-manifest.json','ingest-report.json','baseline.json']:shutil.copy2(W/f,E/f)
shutil.copytree(W/'generated',E/'generated',dirs_exist_ok=True)
for f in ['ingest_v5_detail.py','audit_v5_detail.py','v5_detail_qa.cjs','v5_detail_transitions.py','v5_detail_consistency.py','package_v5_detail.py','sumo_generate_motion.ts','sumo_trim_layers.py','sumo_export_motion.ts','measure_cast_placement.py']:shutil.copy2(A/'design'/f,E/f)
for label in ['build','motion','audit','transitions','qa-final']:
 p=Path(f'/tmp/sumo-v5-detail-{label}.log')
 if p.exists():shutil.copy2(p,E/p.name)
assert math=={p.name:h(p) for p in (U/'math').iterdir() if p.is_file()}
assert build=={str(p.relative_to(U/'frontend')):h(p) for p in (U/'frontend').rglob('*') if p.is_file()}
manifest={'frontend_sha256':build,'math_unchanged':math,'source_audit':audit,'qa_production_sha256':qa['production_sha256'],'changed':[n for n,v in build.items() if before.get(n)!=v],'removed':sorted(before.keys()-build.keys()),'platform_updated':False,'store_art_platform_updated':False}
(E/'release-manifest.json').write_text(json.dumps(manifest,indent=2));print('STAGED',len(build),'frontend files; math unchanged; platform untouched')
