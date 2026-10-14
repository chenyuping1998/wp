"""Stage the verified release; local playtest scripts never enter upload."""
from pathlib import Path
import shutil, json, hashlib
APP=Path(__file__).resolve().parents[1]
ROOT=APP.parents[2]
OUT=ROOT/'upload/PicklePanic'
FRONT=OUT/'frontend'
OUT.mkdir(parents=True,exist_ok=True)
FRONT.mkdir(exist_ok=True)
# Refresh code and explicitly owned art. Never restore the template leftovers.
for name in ['index.html','favicon.svg']:
 shutil.copy2(APP/'build'/name,FRONT/name)
for name in ['_app','assets/pickle','assets/spines/pickleBoss','assets/spines/picklePepper','assets/audio/pickle','fonts/pickle']:
 src=APP/'build'/name;dst=FRONT/name
 if dst.exists():shutil.rmtree(dst)
 shutil.copytree(src,dst)
for name in ['assets/audio/sounds.json','assets/audio/sounds.wav']:
 shutil.copy2(APP/'build'/name,FRONT/name)
for folder,names in {'thumbnail':['PicklePanic-BG.png','PicklePanic-FG.png','Silverstars-Logo.png'],'cover':['PicklePanic-Cover-BG.png','PicklePanic-Cover-FG.png']}.items():
 (OUT/folder).mkdir(exist_ok=True)
 for name in names:shutil.copy2(APP/'design'/folder/name,OUT/folder/name)
shutil.copy2(APP/'design/UPLOAD_README.md',OUT/'README.md')
for p in FRONT.rglob('*'):
 if not p.is_file():continue
 assert not any(t in p.name.lower() for t in ['sushi','stub','playtest']),p
 if p.suffix in ['.html','.js','.css','.json','.svg']:
  text=p.read_text(errors='replace')
  for term in ['Sushi Monkey','SushiMonkey','sushiMaster','sushiApprentice','SushiReceipt','stub.local','localhost:','stub-data.js','playtest_stub']:
   assert term not in text,(p,term)
manifest={str(p.relative_to(OUT)):{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(OUT.rglob('*')) if p.is_file() and p.name!='manifest.json'}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Staged {len(manifest)} files at {OUT}. Platform NOT updated. No ZIP produced.')
