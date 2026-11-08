"""Ship the reviewed complete frontend; earlier review packages are retained."""
from pathlib import Path
import hashlib,json,zipfile
APP=Path(__file__).resolve().parent.parent
release=APP/'design/release';release.mkdir(exist_ok=True)
out=release/'MummyMayhem_frontend_review_20261107_motion_polish.zip'
source=APP/'static/assets/spines/mummyCat';built=APP/'build/assets/spines/mummyCat'
for p in source.iterdir():
 if p.is_file():assert (built/p.name).read_bytes()==p.read_bytes(),f'stale built character:{p.name}'
reports={
 'cloth':APP/'design/source/mummy_delivery/mascot/flow/verification.json',
 'seams':APP/'design/source/mummy_delivery/mascot/flow/seams_verification.json',
 'ambience':APP/'design/preview_mummy_20261107/motion_polish/ambience_verification.json'}
reports={k:json.loads(p.read_text())for k,p in reports.items()}
assert all(r['passed']for r in reports.values())
assert all(v==1 for v in reports['seams']['minCoverage'].values())
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted((APP/'build').rglob('*')):
  if p.is_file():z.write(p,p.relative_to(APP/'build').as_posix())
with zipfile.ZipFile(out) as z:
 assert 'index.html' in z.namelist()
 for p in source.iterdir():
  if p.is_file():assert z.read('assets/spines/mummyCat/'+p.name)==p.read_bytes()
result=dict(file=out.name,bytes=out.stat().st_size,sha256=hashlib.sha256(out.read_bytes()).hexdigest(),changes='Anchored travelling cloth; individual symbol acting; coherent tomb draught, foliage, drapes and flames',reports=reports)
(release/'PACKAGE_motion_polish.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
