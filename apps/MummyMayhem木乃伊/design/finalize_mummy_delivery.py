from pathlib import Path
from PIL import Image
import json,shutil,zipfile,hashlib
ROOT=Path(__file__).resolve().parent;APP=ROOT.parent;D=ROOT/'source/mummy_delivery'
# Nominal-size delivery masters retain original generated high-pay resolution.
for k in ['h1','h2','h3','h4','w','s']:
 Image.open(D/'originals'/(k+'.png')).convert('RGBA').resize((1024,1024),Image.Resampling.LANCZOS).save(D/'symbols'/(k+'.png'))
for k in ['l1','l2','l3','l4','l5','p','x']:
 p=D/'symbols'/(k+'.png');a=Image.open(p).convert('RGBA');a.resize((1024,1024),Image.Resampling.LANCZOS).save(p)
for p in (D/'ui').glob('buy_art_*.png'):Image.open(p).convert('RGB').save(p.with_suffix('.jpg'),quality=96,subsampling=0)
p=D/'ui/buybonus_plate.png';Image.open(p).resize((640,640),Image.Resampling.LANCZOS).save(p)
# Trim transparent padding before fitting the linen texture; keep alpha around frayed edges.
p=D/'originals/bandage.png';a=Image.open(p).convert('RGBA');a=a.crop(a.getchannel('A').point(lambda v:255 if v>60 else 0).getbbox()).resize((2400,360),Image.Resampling.LANCZOS)
a.save(D/'transition/bandage_strip.png');a.save(APP/'static/assets/sprites/mummyTransition/bandage_strip.webp',format='WEBP',quality=94,method=4)
budget_path=D/'runtime_texture_budget.json';budget=json.loads(budget_path.read_text())
for row in budget['runtime_textures']:row['bytes']=(APP/'static'/row['file']).stat().st_size
budget['output_bytes']=sum(row['bytes'] for row in budget['runtime_textures']);budget_path.write_text(json.dumps(budget,indent=2))
# Stage the completed static asset set alongside the verified latest JS bundle.
source=APP/'static/assets';target=APP/'build/assets'
assert source.resolve().is_relative_to(APP.resolve()) and target.resolve().is_relative_to(APP.resolve())
shutil.copytree(source,target,dirs_exist_ok=True)
# Do not retain stale PNG siblings after WebP encoding in a previously built tree.
for folder in target.glob('sprites/mummy*'):
 for p in folder.glob('*.png'):
  if p.with_suffix('.webp').exists():p.unlink()
manifest=[]
for p in D.rglob('*'):
 if not p.is_file() or p.suffix.lower() not in ['.png','.jpg'] or 'originals' in p.parts or 'mascot_built' in p.parts:continue
 im=Image.open(p);manifest.append(dict(file=str(p.relative_to(D)),size=im.size,mode=im.mode))
(D/'DELIVERY_MANIFEST.json').write_text(json.dumps(manifest,indent=2))
release=ROOT/'release';release.mkdir(exist_ok=True);out=release/'MummyMayhem_frontend_review_20261107.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted((APP/'build').rglob('*')):
  if p.is_file():z.write(p,p.relative_to(APP/'build').as_posix())
with zipfile.ZipFile(out) as z:
 names=z.namelist();assert 'index.html' in names and any(n.startswith('_app/immutable/') for n in names)
 assert not any('/audio/jungle/' in n or '/spines/goBananasMonkey/' in n for n in names)
 assert not any('playtest' in n or 'replay-harness' in n for n in names)
 for p in (APP/'static/assets').rglob('*'):
  if p.is_file():assert hashlib.sha256(p.read_bytes()).digest()==hashlib.sha256((APP/'build/assets'/p.relative_to(APP/'static/assets')).read_bytes()).digest()
report=dict(file=out.name,bytes=out.stat().st_size,sha256=hashlib.sha256(out.read_bytes()).hexdigest(),entries=len(names),index_at_root=True)
(release/'PACKAGE.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
