"""Restage compiled code and changed authored art, preserving existing pruning."""
from pathlib import Path
import hashlib,shutil,json
D=Path(__file__).resolve().parent;APP=D.parent.parent;ROOT=APP.parents[2];U=ROOT/'upload/TurfWar';B=APP/'build'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert (ROOT/'_upload_backups/TurfWar-before-full-remake-20261023.tgz').stat().st_size>1000000
assert 'stub.local' not in (B/'index.html').read_text()
# Keep the old immutable folder recoverable in the full backup before replacement.
old=U/'frontend/_app/immutable'
if old.exists():shutil.rmtree(old)
shutil.copytree(B/'_app/immutable',old);shutil.copy2(B/'index.html',U/'frontend/index.html')
for p in (B/'_app').iterdir():
 if p.is_file():shutil.copy2(p,U/'frontend/_app'/p.name)
changed=[]
for p in sorted((APP/'static').rglob('*')):
 if not p.is_file():continue
 rel=p.relative_to(APP/'static')
 if str(rel).startswith('assets/castLayers/turf/v3/') and rel.name=='full.png':continue
 before=D/'before/static'/rel
 if before.exists() and digest(p)==digest(before):continue
 dest=U/'frontend'/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest);changed.append(str(rel))
for folder in ['thumbnail','cover']:
 for name in [f'TurfWar-{"Cover-" if folder=="cover" else ""}BG.png',f'TurfWar-{"Cover-" if folder=="cover" else ""}FG.png']:
  src=APP/'design'/folder/name;shutil.copy2(src,U/folder/name)
shutil.copy2(APP/'design/thumbnail/Silverstars-Logo.png',U/'thumbnail/Silverstars-Logo.png')
# These old runtime layer sets have no registry/bundle references anymore.
# Keep original sources and their regression gates locally; archive has staged copies.
pruned=json.loads((D/'staged-pruned-assets.json').read_text()) if (D/'staged-pruned-assets.json').exists() else []
for variant in ['base','feature','fg','kingpin']:
 p=U/'frontend/assets/castLayers/turf'/variant
 if p.exists():shutil.rmtree(p);pruned.append(str(p.relative_to(U)))
for p in (U/'frontend/assets/castLayers/turf/v3').glob('*/full.png'):
 p.unlink();pruned.append(str(p.relative_to(U)))
(D/'staged-pruned-assets.json').write_text(json.dumps(sorted(set(pruned)),indent=2)+'\n')
(D/'staged-changed-assets.json').write_text(json.dumps(changed,indent=2)+'\n')
print(f'Restaged compiled code and {len(changed)} explicitly changed assets; math untouched; platform not updated.')
